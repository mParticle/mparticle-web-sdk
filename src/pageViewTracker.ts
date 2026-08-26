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

// The query params an auto page view may carry. An allowlist, not a denylist:
// partner URLs routinely hold order ids, email addresses and session tokens, and
// none of those should reach the event stream because someone forgot to exclude
// them. Anything absent from this list is dropped.
//
// SECURITY: `code`, `state` and `nonce` are the OAuth 2.0 / OIDC authorization
// code and the CSRF/replay tokens. They are credentials until redeemed, and
// attaching them here persists them in the event store and forwards them to
// every configured kit. They are on the list by explicit product decision —
// deleting that line is the whole of the fix if that decision is revisited.
export const ALLOWED_QUERY_PARAMS: string[] = [
    // Campaign attribution
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'utm_id',

    // Ad-network click ids
    'gclid',
    'gbraid',
    'wbraid',
    'fbclid',
    'msclkid',
    'ttclid',
    'twclid',
    'li_fat_id',
    'dclid',

    // OAuth / OIDC — see the SECURITY note above
    'client_id',
    'redirect_uri',
    'response_type',
    'scope',
    'state',
    'code',
    'nonce',

    // Pagination and search
    'page',
    'limit',
    'offset',
    'cursor',
    'per_page',
    'q',
    'search',

    // Referral
    'ref',
    'referrer',
];

// Names a customer may not add, on top of the format rule below.
//
// hostname/title/path are the three core event fields. buildPageViewEvent's spread
// order already stops a param overwriting them, but rejecting the names here keeps
// them out of the dedup key as well, rather than leaving one guard doing all the
// work.
//
// constructor/__proto__/prototype resolve to something truthy through the
// prototype chain. hasOwnProp neutralises them at capture, and rejecting them at
// the config boundary means they never travel far enough to depend on that.
const RESERVED_QUERY_PARAMS: string[] = [
    'hostname',
    'title',
    'path',
    'constructor',
    '__proto__',
    'prototype',
];

// Must start with a letter, digit or underscore, then up to 63 more of the same
// plus dot and hyphen. Excludes `&`, `=`, `%` and whitespace — the characters that
// would let a name distort the dedup key or an event attribute name.
const QUERY_PARAM_NAME = /^[a-z0-9_][a-z0-9_.-]{0,63}$/;

// mParticle caps attributes per event; 31 built-ins plus this leaves headroom.
export const MAX_CUSTOM_QUERY_PARAMS = 25;

// How much of a rejected entry is safe to name in a log.
const REJECTED_LABEL_LIMIT = 32;

// A log-safe label for a rejected entry.
//
// An entry is rejected BECAUSE of a character, and everything from that character
// onwards is untrusted: a customer who types `password=hunter2` into the field must
// not have the value echoed into the console, where session-replay tooling would
// ship it off-domain. So cut at the first character that is not name-legal, and cap
// the length. The surviving prefix is still enough to identify which entry was
// dropped, which is the whole point of reporting it.
const rejectedLabel = (entry: string): string => {
    const legalPrefix = /^[a-z0-9_.-]*/.exec(entry);
    const kept = (legalPrefix ? legalPrefix[0] : '').slice(
        0,
        REJECTED_LABEL_LIMIT
    );

    return kept.length < entry.length ? `${kept}...` : kept;
};

// Applies to CUSTOM params only — see allowedQueryParams.
export const MAX_CUSTOM_QUERY_PARAM_VALUE_LENGTH = 512;

// One captured param. An ordered list rather than a dictionary because the dedup
// key depends on a stable order, and once the allowlist is configurable that order
// can no longer come from a module constant. Capturing it here means pageKey and
// describePage need no knowledge of the allowlist at all.
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
// Returns the accepted names alongside log-safe labels for what it dropped. The raw
// rejected entry never escapes this function — see rejectedLabel.
export const parseQueryParamAllowlist = (
    configured: string | string[]
): { allowed: string[]; rejected: string[] } => {
    const allowed: string[] = [];
    const rejected: string[] = [];

    if (!configured) {
        return { allowed, rejected };
    }

    const entries: string[] = Array.isArray(configured)
        ? configured
        : String(configured).split(',');

    entries.forEach(entry => {
        if (allowed.length >= MAX_CUSTOM_QUERY_PARAMS) {
            return;
        }

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
            rejected.push(rejectedLabel(name));
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

        allowed.push(name);
    });

    return { allowed, rejected };
};

// Built-ins first, in their existing order, then the customer's additions in the
// order given.
//
// The order is load-bearing, not cosmetic. pageKey walks this list, so keeping the
// built-in prefix intact means a customer who adds params gets byte-identical keys
// for pages that use none of them. Without it, adding a single param would change
// every key at once and fire one spurious page view per page on the first
// navigation after rollout.
export const effectiveAllowlist = (
    extras: string | string[] = []
): string[] => {
    // Tolerates a raw comma-separated string as well as the validated list
    // processFlags stores. Not decoration: a mis-shaped config value reaching this
    // unguarded would throw inside logPageView and take every page view with it,
    // which is a much worse failure than ignoring a bad setting.
    //
    // An array is trusted as already validated. That is deliberate — it is what
    // lets the tests inject hostile names directly and prove the own-property check
    // in allowedQueryParams is a real backstop rather than dead code behind
    // validation.
    const list = Array.isArray(extras)
        ? extras
        : parseQueryParamAllowlist(extras).allowed;

    return ALLOWED_QUERY_PARAMS.concat(
        list.filter(name => ALLOWED_QUERY_PARAMS.indexOf(name) === -1)
    );
};

// Pulls the allowlisted query params off a URL, in allowlist order.
//
// Delegates to the SDK's own parser, which lowercases keys (so `?UTM_Source=` and
// `?utm_source=` land on one attribute), drops empty values, and carries the
// fallback for browsers without URLSearchParams. Tolerates an empty href, so SSR
// yields no params rather than throwing.
//
// Membership is an own-property check, not `in`: `in` walks the prototype chain, so
// a configured name matching an Object.prototype member would report as present on
// every page.
export const allowedQueryParams = (
    href: string,
    extras: string | string[] = []
): ICapturedParam[] => {
    const allowlist = effectiveAllowlist(extras);
    const found = queryStringParser(href, allowlist);

    return allowlist
        .filter(name => hasOwnProp(found, name))
        .filter(name => {
            // The length cap applies to CUSTOM params only. Built-in behaviour is
            // deliberately untouched, so no existing customer can lose a long
            // utm_content on upgrade. Custom params are where unbounded choice
            // enters: a param holding a base64 blob would bloat every APV event
            // and every dedup key.
            //
            // Dropped, not truncated — truncating makes two different long values
            // produce the same key, which silently swallows a real page view.
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

// The dedup key: pathname plus the captured params in allowlist order, so that
// reordering the query string is not a new page. Params outside the effective
// allowlist never make it into `page.params` and so cannot key a view — nor can the
// hash.
//
// Values are re-encoded because queryStringParser hands them back DECODED. A value
// holding the pair delimiters would otherwise serialize exactly like two separate
// params — `{q: 'a&search=b'}` and `{q: 'a', search: 'b'}` both becoming
// `q=a&search=b` — and dedup would treat a real navigation between them as the same
// page and drop the view. `q`, `search` and `redirect_uri` carry `&` and `=`
// routinely, so this is reachable rather than theoretical.
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

    // Reads and validates the configured additions. Logs the names it rejected —
    // names only, never values, for the same reason describePage omits them.
    private readCustomQueryParams(): string[] {
        const configured = this.mpInstance._Helpers.getFeatureFlag(
            Constants.FeatureFlags.AutoLogPageViewQueryParams
        ) as string | string[];

        const { allowed, rejected } = parseQueryParamAllowlist(configured);

        if (rejected.length) {
            this.mpInstance.Logger.warning(
                'mParticle APV: ignoring invalid additional page view query ' +
                    `parameters: ${rejected.join()}`
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
