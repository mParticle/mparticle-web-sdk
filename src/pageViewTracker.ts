import Constants from './constants';
import { IMParticleWebSDKInstance } from './mp-instance';
import { BaseEvent } from './sdkRuntimeModels';
import { EventType, MessageType } from './types';
import { Dictionary, getHref, hasOwnProp, queryStringParser } from './utils';

type HistoryStateMethod = History['pushState'];
type HistoryMethodName = 'pushState' | 'replaceState';
type NavigationSource = HistoryMethodName | 'popstate';

const HISTORY_METHODS: HistoryMethodName[] = ['pushState', 'replaceState'];

const WRAPPED_MARKER = '__mpApvWrapped__';

type MarkedHistoryMethod = HistoryStateMethod & {
    [WRAPPED_MARKER]?: boolean;
};

// All APV state hangs off one window key, and it is the public debugging
// contract: `window.__mpApv__` is what you inspect in a console to see whether
// tracking is live.
//
// It lives on `window` rather than in module scope because Next.js re-executes
// the SDK bundle on every SPA navigation: module-level state is reset each time,
// but `window` persists for the lifetime of the tab.
//
// One object rather than a key per flag, so resetting is a single reassignment.
// Nothing has to be deleted, and there is no ordering in which half the state
// survives the reset.
export const WIN_APV_KEY = '__mpApv__';

interface IApvState {
    // The tracker that currently owns the history patch. May have been
    // registered by a module scope that no longer exists.
    tracker?: PageViewTracker;

    // Guards the initial page view so repeated mParticle.init() calls from SPA
    // re-renders don't fire duplicate logPageView() events for the same page.
    initialPageViewFired: boolean;
}

type WindowWithApv = Window & {
    [WIN_APV_KEY]?: IApvState;
};

// The default allowlist: params that identify WHICH page you are on, which is also
// what the dedup key needs. A floor, not a ceiling — customers add their own names in
// the Web input's Advanced Settings.
//
// Two groups were removed deliberately and should not come back:
//
// OAuth/OIDC (code, state, nonce, client_id, redirect_uri, response_type, scope) —
// `code` is an authorization code and state/nonce are CSRF and replay tokens, so
// capturing them by default put credentials in the event store and every connected
// kit.
//
// Attribution (utm_*, gclid, gbraid, wbraid, fbclid, msclkid, ttclid, twclid,
// li_fat_id, dclid) — carried on better-suited planes already: click ids by
// IntegrationCapture as per-network custom flags, campaign data by the reserved
// `$utm_*` user attributes that forwarders actually read. As page view attributes they
// were a copy nothing consumed, and 15 of them on every view displace the customer's
// own wherever a forwarder caps the count (Flurry keeps 10).
export const ALLOWED_QUERY_PARAMS: string[] = [
    // Pagination
    'page',
    'limit',
    'offset',
    'cursor',
    'per_page',

    // Search
    'q',
    'search',

    // Referral
    'ref',
    'referrer',
];

// Rejected whatever their format, grouped by why.
const RESERVED_QUERY_PARAMS: string[] = [
    // Core event fields: must not reach the dedup key or an attribute name.
    'hostname',
    'title',
    'path',

    // Truthy through the prototype chain.
    'constructor',
    '__proto__',
    'prototype',

    // Every other flag here is compared against 'True'; an operator copying that
    // convention would silently start capturing `?true=`.
    'true',
    'false',
];

// Excludes `&`, `=`, `%` and whitespace: they would distort the dedup key.
const QUERY_PARAM_NAME = /^[a-z0-9_][a-z0-9_.-]{0,63}$/;

// A ceiling on what one input's config can add. The SDK imposes no per-event attribute
// cap of its own, but forwarders do (Flurry keeps 10), so an unbounded list would
// quietly displace the customer's own attributes.
export const MAX_CUSTOM_QUERY_PARAMS = 25;

// One parse, stored whole by processFlags, so no second validator can drift from it.
export interface IQueryParamAllowlist {
    allowed: string[];

    // 1-based, in the order the customer wrote them. Positions and not names because
    // a rejected entry may be something pasted into the wrong field, and
    // `password=hunter2` must not reach Logger.warning. Truncating at the first
    // illegal character does not work: `.`, `-` and `_` are all legal.
    rejectedPositions: number[];

    // Count, not positions: past the cap the remedy is "ask for fewer".
    overLimit: number;
}

// Applies to CUSTOM params only — see allowedQueryParams.
export const MAX_CUSTOM_QUERY_PARAM_VALUE_LENGTH = 512;

// Ordered rather than a dictionary: the dedup key needs a stable order, and once the
// allowlist is configurable that order cannot come from a module constant.
export interface ICapturedParam {
    name: string;
    value: string;
}

interface IPageSnapshot {
    path: string;
    params: ICapturedParam[];
}

interface IPageViewData extends IPageSnapshot {
    hostname: string;
    title: string;
}

interface IPendingNavigation {
    page: IPageSnapshot;
    timeoutId: ReturnType<typeof setTimeout>;
}

// ---------------------------------------------------------------------------
// Pure helpers. No `this`, no globals, no side effects — callable and assertable
// on their own, which is where the interesting rules live.
// ---------------------------------------------------------------------------

// Normalises the customer's additions, as delivered by remote config.
//
// Runs in the SDK even though the dashboard validates too, because remote config is
// untrusted input: it arrives over the network into a third-party embed on the
// customer's page, and the SDK cannot assume anything validated it. Accepts an
// array as well as a comma-separated string so a self-hosted config can pass one
// directly.
//
// Returns the accepted names alongside positions for what it dropped. No part of a
// rejected entry escapes this function — see IQueryParamAllowlist.
export const parseQueryParamAllowlist = (
    configured: string | string[]
): IQueryParamAllowlist => {
    const allowed: string[] = [];
    const rejectedPositions: number[] = [];
    let overLimit = 0;

    if (!configured) {
        return { allowed, rejectedPositions, overLimit };
    }

    const entries: string[] = Array.isArray(configured)
        ? configured
        : String(configured).split(',');

    entries.forEach((entry, index) => {
        // 1-based, and counted over every comma-separated slot including the blank
        // ones, so a reported position matches what the customer typed.
        const position = index + 1;

        // Lowercased because queryStringParser matches case-insensitively and keys
        // its result by the allowlist's casing — so this is what makes the emitted
        // attribute name stable however the customer typed it.
        const name = String(entry)
            .trim()
            .toLowerCase();

        if (!name) {
            return;
        }

        if (
            !QUERY_PARAM_NAME.test(name) ||
            RESERVED_QUERY_PARAMS.indexOf(name) !== -1
        ) {
            rejectedPositions.push(position);
            return;
        }

        // Already built in, or already accepted. Not a rejection — there is nothing
        // wrong with asking for something you already have.
        if (
            ALLOWED_QUERY_PARAMS.indexOf(name) !== -1 ||
            allowed.indexOf(name) !== -1
        ) {
            return;
        }

        // The cap is checked here rather than at the top of the loop so that a
        // blank or a duplicate does not consume headroom, and — the reason it
        // moved — so the entries that lose out are counted instead of vanishing
        // with no report at all.
        if (allowed.length >= MAX_CUSTOM_QUERY_PARAMS) {
            overLimit++;
            return;
        }

        allowed.push(name);
    });

    return { allowed, rejectedPositions, overLimit };
};

// Not localeCompare: this ordering feeds the dedup key, so it has to be identical in
// every browser, and localeCompare is locale-dependent.
const byName = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

// Ordering is load-bearing — pageKey walks this list, so it decides which navigations
// count as a new page. Built-ins keep their positions so no key that exists today moves
// (asserted by the pageKey tests), and additions are sorted so a key depends on the SET
// a customer configured rather than the order they typed it in.
//
// `extras` is trusted as already validated; processFlags does that once, at the config
// boundary. `|| []` covers the null getFeatureFlag returns for an absent flag, which the
// default parameter does not.
export const effectiveAllowlist = (extras: string[] = []): string[] =>
    ALLOWED_QUERY_PARAMS.concat(
        (extras || [])
            .filter(name => ALLOWED_QUERY_PARAMS.indexOf(name) === -1)
            .sort(byName)
    );

// queryStringParser lowercases keys, drops empty values, carries the
// pre-URLSearchParams fallback, and tolerates an empty href — so SSR yields no params
// rather than throwing.
export const allowedQueryParams = (
    href: string,
    extras: string[] = []
): ICapturedParam[] => {
    const allowlist = effectiveAllowlist(extras);
    const found = queryStringParser(href, allowlist);

    return allowlist
        .filter(name => hasOwnProp(found, name))
        .filter(name => {
            // Custom params only, so nobody loses a long utm_content on upgrade.
            // Dropped rather than truncated: two long values sharing a truncated
            // prefix would share a dedup key and swallow a real view.
            if (ALLOWED_QUERY_PARAMS.indexOf(name) !== -1) {
                return true;
            }

            return found[name].length <= MAX_CUSTOM_QUERY_PARAM_VALUE_LENGTH;
        })
        .map(name => ({ name, value: found[name] }));
};

// Folds the ordered pairs into the flat attribute map an event carries.
export const paramsToAttributes = (
    params: ICapturedParam[]
): Dictionary<string> => {
    const attributes: Dictionary<string> = {};
    params.forEach(({ name, value }) => {
        attributes[name] = value;
    });
    return attributes;
};

// Values are re-encoded because queryStringParser returns them DECODED: otherwise
// `{q: 'a&search=b'}` and `{q: 'a', search: 'b'}` both serialize to `q=a&search=b`, so
// a real navigation between the two would dedup away.
export const pageKey = (page: IPageSnapshot): string => {
    const query = page.params
        .map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
        .join('&');

    return query ? `${page.path}?${query}` : page.path;
};

// Dedup keys on the pageKey above: a change to any captured param is a new page
// (`?page=2` is a distinct pagination view), while a hash-only change, or a
// change confined to params we do not capture, is the same page.
export const isNewPage = (
    lastKey: string | null,
    candidateKey: string
): boolean => candidateKey !== lastKey;

export const supportsHistoryTracking = (win: Window | null): boolean =>
    !!win &&
    win.history !== undefined &&
    typeof win.history.pushState === 'function' &&
    typeof win.addEventListener === 'function';

// Mirrors the event shape of the public mParticle.logPageView(), but carries the
// path and query params captured when the navigation was accepted rather than the
// live location.
export const buildPageViewEvent = ({
    params,
    hostname,
    title,
    path,
}: IPageViewData): BaseEvent => ({
    messageType: MessageType.PageView,
    name: 'PageView',
    // Params spread first, then the core fields by name, so a core field always
    // wins. No allowlist entry collides with hostname/title/path today; naming
    // them here is what keeps a later addition from silently overwriting one.
    data: {
        ...paramsToAttributes(params),
        hostname,
        title,
        path,
    },
    eventType: EventType.Unknown,
});

// ---------------------------------------------------------------------------
// Window-scoped APV state. Every read and write goes through these helpers, so
// neither the tracker nor mp-instance touches `window` directly and
// `typeof window` is checked in exactly one place.
// ---------------------------------------------------------------------------

const apvWindow = (): WindowWithApv | null =>
    typeof window === 'undefined' ? null : (window as WindowWithApv);

const freshState = (): IApvState => ({ initialPageViewFired: false });

// Reads tolerate absent state, so a read never mutates `window`. Only the
// writers below create it.
const readState = (): IApvState | undefined => {
    const win = apvWindow();
    return win ? win[WIN_APV_KEY] : undefined;
};

const writeState = (): IApvState | null => {
    const win = apvWindow();
    if (!win) {
        return null;
    }

    if (!win[WIN_APV_KEY]) {
        win[WIN_APV_KEY] = freshState();
    }

    return win[WIN_APV_KEY];
};

export const getActiveTracker = (): PageViewTracker | undefined => {
    const state = readState();
    return state ? state.tracker : undefined;
};

export const hasInitialPageViewFired = (): boolean => {
    const state = readState();
    return !!(state && state.initialPageViewFired);
};

export const markInitialPageViewFired = (): void => {
    const state = writeState();
    if (state) {
        state.initialPageViewFired = true;
    }
};

// Returns the page to its pre-APV state: stops the active tracker (restoring the
// history methods it patched), then swaps in fresh state. The state object is the
// authoritative handle, so this reaches trackers whose owning module is gone.
export const resetPageViewTracking = (): void => {
    const win = apvWindow();
    if (!win) {
        return;
    }

    const active = getActiveTracker();
    if (active) {
        active.teardown();
    }

    // One reassignment replaces every flag at once, so nothing can be left behind
    // whatever shape the previous state was in.
    win[WIN_APV_KEY] = freshState();
};

const setActiveTracker = (tracker: PageViewTracker): void => {
    const state = writeState();
    if (state) {
        state.tracker = tracker;
    }
};

const clearActiveTracker = (tracker: PageViewTracker): void => {
    const state = readState();
    if (state && state.tracker === tracker) {
        state.tracker = undefined;
    }
};

const currentPage = (extras: string[]): IPageSnapshot => ({
    path: window.location.pathname,
    params: allowedQueryParams(getHref(), extras),
});

// Log-safe description of a page: the path, plus the NAMES of the captured
// params. Values are deliberately omitted — verbose logging goes to the console,
// and session-replay tooling ships console output off-domain, which is not a
// place for an OAuth code or a consumer's search terms.
// Only reachable before init() assigns lastPage, which is ahead of any navigation
// handler being able to run, so this returns nothing rather than a sentinel.
const describePage = (page: IPageSnapshot | null): string => {
    if (!page) {
        return '';
    }

    const names = page.params.map(({ name }) => name);
    return names.length ? `${page.path} (params: ${names.join()})` : page.path;
};

// ---------------------------------------------------------------------------
// History patching
// ---------------------------------------------------------------------------

// Wraps pushState/replaceState so `onNavigate` runs after the real method, and
// returns the single function that undoes it — or null when nothing was
// installed (history is already wrapped, or a frozen/sealed History rejected the
// assignment). Handing back one undo closure keeps the wrapper and original
// references out of the tracker entirely: there is no half-patched state for a
// caller to inspect, and no way to restore the wrong pair.
export const patchHistory = (
    onNavigate: (source: NavigationSource) => void,
    log: (message: string) => void
): (() => void) | null => {
    if ((window.history.pushState as MarkedHistoryMethod)[WRAPPED_MARKER]) {
        log(
            '[patch] history already wrapped, skipping to avoid double-wrap — STACKED WRAPPER DETECTED'
        );
        return null;
    }

    const originals = {} as Record<HistoryMethodName, HistoryStateMethod>;
    const wrappers = {} as Record<HistoryMethodName, HistoryStateMethod>;

    HISTORY_METHODS.forEach(name => {
        const original = window.history[name];
        originals[name] = original;

        const wrapper = function(
            this: History,
            ...args: Parameters<HistoryStateMethod>
        ): void {
            const result = original.apply(this, args);
            onNavigate(name);
            return result;
        };

        Object.defineProperty(wrapper, WRAPPED_MARKER, {
            value: true,
            enumerable: false,
        });

        wrappers[name] = wrapper;
    });

    // Restore per method: a third party may have patched one of the two on top of
    // ours after we installed. Clobbering theirs would break their tracking, so
    // leave anything that is no longer ours in place.
    const restore = (): void =>
        HISTORY_METHODS.forEach(name => {
            if (window.history[name] === wrappers[name]) {
                window.history[name] = originals[name];
                log(`[teardown] restored original ${name}`);
            } else {
                log(
                    `[teardown] ${name} no longer ours; leaving in place, gating callback to no-op`
                );
            }
        });

    try {
        HISTORY_METHODS.forEach(name => {
            window.history[name] = wrappers[name];
        });
    } catch (e) {
        log(
            `[error] failed to patch history methods (frozen/sealed), rolling back: ${e}`
        );
        try {
            restore();
        } catch (restoreError) {
            log(
                `[error] failed to restore history methods after patch failure: ${restoreError}`
            );
        }
        return null;
    }

    return restore;
};

// ---------------------------------------------------------------------------
// Tracker
// ---------------------------------------------------------------------------

export class PageViewTracker {
    private readonly mpInstance: IMParticleWebSDKInstance;

    private lastPage: IPageSnapshot | null = null;
    private active = false;

    // The customer's additions to the allowlist, read once per init() rather than
    // per navigation: config cannot change without a re-init, and re-reading it on
    // every pushState would re-validate the same list thousands of times.
    private customQueryParams: string[] = [];
    private pendingNavigations: IPendingNavigation[] = [];

    private undoHistoryPatch: (() => void) | null = null;
    private popStateListener: (() => void) | null = null;

    constructor(mpInstance: IMParticleWebSDKInstance) {
        this.mpInstance = mpInstance;
    }

    // True while this tracker owns the history patch and is listening for
    // navigations. Flips to false on teardown, including the teardown a
    // successor tracker performs during a handoff. Read-only, and the one thing
    // worth checking on `window.__mpApv__.tracker` from a console.
    public get isActive(): boolean {
        return this.active;
    }

    public init(): void {
        this.log('[init] PageViewTracker Init');

        if (!supportsHistoryTracking(apvWindow())) {
            this.log(
                '[init] unsupported environment (no History API), not starting'
            );
            return;
        }

        // Take over from whichever tracker is currently active: one left behind by
        // a previous module load, or this same tracker on a repeat
        // mParticle.init(). Their pending navigations are transferred rather than
        // dropped — a route change may have queued a deferred fire that has not
        // flushed yet, and dropping it loses a page view entirely.
        const active = getActiveTracker();
        let inheritedPages = this.retire(active);
        if (this.active && active !== this) {
            inheritedPages = inheritedPages.concat(this.retire(this));
        }

        this.active = true;
        this.customQueryParams = this.readCustomQueryParams();
        this.lastPage = currentPage(this.customQueryParams);
        this.log(`[init] seeded lastPage: ${describePage(this.lastPage)}`);

        this.undoHistoryPatch = patchHistory(
            source => this.safeHandleNavigation(source),
            message => this.log(message)
        );
        this.popStateListener = () => this.safeHandleNavigation('popstate');
        window.addEventListener('popstate', this.popStateListener);

        setActiveTracker(this);

        this.log(
            '[init] patched pushState/replaceState + listening for popstate'
        );

        inheritedPages.forEach(page => this.scheduleFire(page));
    }

    public teardown(): void {
        // Discard pending deferred fires (e.g. AutoLogPageView switched off on
        // re-init). A handoff calls takePendingNavigations() first, so by this
        // point those paths are already transferred rather than dropped.
        this.takePendingNavigations();

        if (this.popStateListener) {
            window.removeEventListener('popstate', this.popStateListener);
            this.popStateListener = null;
        }

        if (this.undoHistoryPatch) {
            this.undoHistoryPatch();
            this.undoHistoryPatch = null;
        }

        this.active = false;
        clearActiveTracker(this);
    }

    // Reports what processFlags rejected; deliberately does NOT re-validate. Parsing
    // the already-clean list again would have nothing left to reject, which is how
    // this warning was once dead in production while its test passed.
    private readCustomQueryParams(): string[] {
        const {
            allowed = [],
            rejectedPositions = [],
            overLimit = 0,
        } = (this.mpInstance._Helpers.getFeatureFlag(
            Constants.FeatureFlags.AutoLogPageViewQueryParams
        ) || {}) as IQueryParamAllowlist;

        if (rejectedPositions.length) {
            this.mpInstance.Logger.warning(
                'mParticle APV: ignoring invalid additional page view query ' +
                    `parameters at positions ${rejectedPositions.join(', ')}`
            );
        }

        if (overLimit) {
            this.mpInstance.Logger.warning(
                `mParticle APV: ignoring ${overLimit} additional page view ` +
                    `query parameters beyond the limit of ` +
                    `${MAX_CUSTOM_QUERY_PARAMS}`
            );
        }

        if (allowed.length) {
            this.log(`[init] additional query params: ${allowed.join()}`);
        }

        return allowed;
    }

    // Stops the outgoing tracker and returns the pages it had queued so this
    // tracker can re-schedule them once it is active. Private, but reachable
    // across instances: the handoff protocol stays internal to the class.
    private retire(outgoing: PageViewTracker | undefined): IPageSnapshot[] {
        if (!outgoing) {
            return [];
        }

        this.log(
            outgoing === this
                ? '[init] retiring this tracker for a repeat mParticle.init() — transferring pending navigations and tearing down'
                : '[init] retiring a tracker from a previous module load — transferring pending navigations and tearing down'
        );

        const pages = outgoing.takePendingNavigations();
        outgoing.teardown();
        return pages;
    }

    // Cancels this tracker's deferred fires and hands back their captured pages.
    private takePendingNavigations(): IPageSnapshot[] {
        const pending = this.pendingNavigations;
        this.pendingNavigations = [];
        pending.forEach(({ timeoutId }) => clearTimeout(timeoutId));
        return pending.map(({ page }) => page);
    }

    private safeHandleNavigation(source: NavigationSource): void {
        // An orphaned wrapper still calls in: teardown can only restore a history
        // method that is still ours, so one a third party patched over stays
        // installed and keeps firing at a dead tracker. Bail before touching
        // lastPath or queueing a fire the flush would just abort. Guarding here
        // rather than at each wrapper also covers the popstate path.
        if (!this.active) {
            return;
        }

        try {
            this.handleNavigation(source);
        } catch (e) {
            this.log(
                `[error] navigation handler threw (${source}), page view skipped: ${e}`
            );
        }
    }

    private handleNavigation(source: NavigationSource): void {
        const candidate = currentPage(this.customQueryParams);
        const lastKey = this.lastPage ? pageKey(this.lastPage) : null;

        this.log(
            `[detect] navigation signal (source: ${source}, candidate: ${describePage(
                candidate
            )}, last: ${describePage(this.lastPage)})`
        );

        if (!isNewPage(lastKey, pageKey(candidate))) {
            this.log(
                `[dedupe] page unchanged, skipping (source: ${source}, page: ${describePage(
                    candidate
                )})`
            );
            return;
        }

        this.log(
            `[accept] page changed, scheduling fire (source: ${source}, from: ${describePage(
                this.lastPage
            )}, to: ${describePage(candidate)})`
        );
        this.lastPage = candidate;
        this.scheduleFire(candidate);
    }

    // Deferred by a macrotask so the router's post-navigation render commit has a
    // chance to update document.title before the event is built. The path and
    // query params are snapshotted now because they are already settled, whereas a
    // same-tick navigation would overwrite window.location before the flush reads
    // it.
    private scheduleFire(page: IPageSnapshot): void {
        const timeoutId = setTimeout(() => {
            this.pendingNavigations = this.pendingNavigations.filter(
                p => p.timeoutId !== timeoutId
            );

            if (!this.active) {
                this.log(
                    '[defer] fire aborted, tracker inactive (torn down before flush)'
                );
                return;
            }

            this.mpInstance._SessionManager.resetSessionTimer();
            this.firePageView(page);
        }, 0);

        this.pendingNavigations.push({ page, timeoutId });
    }

    private firePageView(page: IPageSnapshot): void {
        const title = window.document.title;
        const event = buildPageViewEvent({
            ...page,
            hostname: window.location.hostname,
            title,
        });

        this.log(
            `[fire] deferred flush -> _Events.logEvent(PageView) (page: ${describePage(
                page
            )}, title: ${title})`
        );

        this.mpInstance._Events.logEvent(event);
    }

    private log(message: string): void {
        this.mpInstance.Logger.verbose(`mParticle APV: ${message}`);
    }
}
