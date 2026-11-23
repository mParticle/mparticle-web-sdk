import { IMParticleWebSDKInstance } from './mp-instance';
import { BaseEvent } from './sdkRuntimeModels';
import { EventType, MessageType } from './types';
import { getHref } from './utils';
import { pagePath, pageUrlPath } from './pathMasking';
import {
    subscribeToRouteChange,
    supportsHistoryTracking,
    type RouteChangeSource,
} from './routeChangeMonitor';
import {
    allowedQueryParams,
    autoPageViewAttribute,
    type ICapturedParam,
    type IPageViewOptions,
    type IQueryParamAllowlist,
    MAX_CUSTOM_QUERY_PARAMS,
    paramsToAttributes,
} from './pageViewAttributes';
export {
    ALLOWED_QUERY_PARAM_PREFIXES,
    ALLOWED_QUERY_PARAMS,
    allowedQueryParams,
    AUTO_PAGE_VIEW_ATTRIBUTE,
    autoPageViewAttribute,
    effectiveAllowlist,
    type ICapturedParam,
    type IPageViewOptions,
    type IQueryParamAllowlist,
    isAllowedQueryParam,
    MAX_CUSTOM_QUERY_PARAM_VALUE_LENGTH,
    MAX_CUSTOM_QUERY_PARAMS,
    paramsToAttributes,
    parseQueryParamAllowlist,
} from './pageViewAttributes';

type NavigationSource = RouteChangeSource;

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

interface IPageSnapshot {
    path: string;
    params: ICapturedParam[];
}

interface IPageViewData extends IPageSnapshot {
    hostname: string;
    title: string;
    isAutoPageView?: boolean;
}

interface IPendingNavigation {
    page: IPageSnapshot;
    timeoutId: ReturnType<typeof setTimeout>;
}

// ---------------------------------------------------------------------------
// Pure helpers. No `this`, no globals, no side effects — callable and assertable
// on their own, which is where the interesting rules live.
// ---------------------------------------------------------------------------

// Values are re-encoded because they arrive decoded: `{q: 'a&search=b'}` would otherwise
// key the same as `{q: 'a', search: 'b'}` and dedup a real navigation away.
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

// Mirrors the event shape of the public mParticle.logPageView(), but carries the
// path and query params captured when the navigation was accepted rather than the
// live location.
export const buildPageViewEvent = ({
    params,
    hostname,
    title,
    path,
    isAutoPageView,
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
        // Masked here, not in the page snapshot, whose raw path tells one page from the next.
        path: pageUrlPath(path),
        ...autoPageViewAttribute(isAutoPageView),
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
    // A log line is read by no output, so it takes the click path's fuller rules.
    const path = pagePath(page.path);
    return names.length ? `${path} (params: ${names.join()})` : path;
};

// ---------------------------------------------------------------------------
// History patching
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Tracker
// ---------------------------------------------------------------------------

export class PageViewTracker {
    private readonly mpInstance: IMParticleWebSDKInstance;

    private lastPage: IPageSnapshot | null = null;
    private active = false;

    private customQueryParams: string[] = [];
    private pendingNavigations: IPendingNavigation[] = [];

    private undoHistoryPatch: (() => void) | null = null;

    private readonly isAutoPageView: boolean;

    constructor(
        mpInstance: IMParticleWebSDKInstance,
        options?: IPageViewOptions
    ) {
        this.mpInstance = mpInstance;
        this.isAutoPageView = !!(options && options.isAutoPageView);
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

        this.undoHistoryPatch = subscribeToRouteChange(
            'pageView',
            source => this.safeHandleNavigation(source),
            message => this.log(message)
        );

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

        if (this.undoHistoryPatch) {
            this.undoHistoryPatch();
            this.undoHistoryPatch = null;
        }

        this.active = false;
        clearActiveTracker(this);
    }

    private readCustomQueryParams(): string[] {
        const {
            allowed = [],
            rejectedPositions = [],
            overLimit = 0,
        } = (this.mpInstance._Store.SDKConfig.autoLogPageViewQueryParams ||
            {}) as IQueryParamAllowlist;

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
                ? '[init] retiring this tracker for a repeat mParticle.init() - transferring pending navigations and tearing down'
                : '[init] retiring a tracker from a previous module load - transferring pending navigations and tearing down'
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
            isAutoPageView: this.isAutoPageView,
        });

        // A title can name the shopper or an order, so it stays out of the log
        // line, for the same reason describePage omits param values.
        this.log(
            `[fire] deferred flush -> _Events.logEvent(PageView) (page: ${describePage(
                page
            )})`
        );

        this.mpInstance._Events.logEvent(event);
    }

    private log(message: string): void {
        this.mpInstance.Logger.verbose(`mParticle APV: ${message}`);
    }
}
