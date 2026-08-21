import { IMParticleWebSDKInstance } from './mp-instance';
import { BaseEvent } from './sdkRuntimeModels';
import { EventType, MessageType } from './types';

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

interface IPageViewData {
    hostname: string;
    title: string;
    path: string;
}

interface IPendingNavigation {
    path: string;
    timeoutId: ReturnType<typeof setTimeout>;
}

// ---------------------------------------------------------------------------
// Pure helpers. No `this`, no globals, no side effects — callable and assertable
// on their own, which is where the interesting rules live.
// ---------------------------------------------------------------------------

// Dedup keys on pathname only: a query-string- or hash-only change is the same
// page and must not fire a view.
export const isNewPage = (
    lastPath: string | null,
    candidatePath: string
): boolean => candidatePath !== lastPath;

export const supportsHistoryTracking = (win: Window | null): boolean =>
    !!win &&
    win.history !== undefined &&
    typeof win.history.pushState === 'function' &&
    typeof win.addEventListener === 'function';

// Mirrors the event shape of the public mParticle.logPageView(), but carries the
// path captured when the navigation was accepted rather than the live location.
export const buildPageViewEvent = (data: IPageViewData): BaseEvent => ({
    messageType: MessageType.PageView,
    name: 'PageView',
    data: { ...data },
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

const currentPathname = (): string => window.location.pathname;

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

    private lastPath: string | null = null;
    private active = false;
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
        let inheritedPaths = this.retire(active);
        if (this.active && active !== this) {
            inheritedPaths = inheritedPaths.concat(this.retire(this));
        }

        this.active = true;
        this.lastPath = currentPathname();
        this.log(`[init] seeded lastPath: ${this.lastPath}`);

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

        inheritedPaths.forEach(path => this.scheduleFire(path));
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

    // Stops the outgoing tracker and returns the paths it had queued so this
    // tracker can re-schedule them once it is active. Private, but reachable
    // across instances: the handoff protocol stays internal to the class.
    private retire(outgoing: PageViewTracker | undefined): string[] {
        if (!outgoing) {
            return [];
        }

        this.log(
            outgoing === this
                ? '[init] retiring this tracker for a repeat mParticle.init() — transferring pending navigations and tearing down'
                : '[init] retiring a tracker from a previous module load — transferring pending navigations and tearing down'
        );

        const paths = outgoing.takePendingNavigations();
        outgoing.teardown();
        return paths;
    }

    // Cancels this tracker's deferred fires and hands back their captured paths.
    private takePendingNavigations(): string[] {
        const pending = this.pendingNavigations;
        this.pendingNavigations = [];
        pending.forEach(p => clearTimeout(p.timeoutId));
        return pending.map(p => p.path);
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
        const candidatePath = currentPathname();

        this.log(
            `[detect] navigation signal (source: ${source}, candidatePath: ${candidatePath}, lastPath: ${this.lastPath})`
        );

        if (!isNewPage(this.lastPath, candidatePath)) {
            this.log(
                `[dedupe] pathname unchanged, skipping (source: ${source}, path: ${candidatePath})`
            );
            return;
        }

        this.log(
            `[accept] pathname changed, scheduling fire (source: ${source}, from: ${this.lastPath}, to: ${candidatePath})`
        );
        this.lastPath = candidatePath;
        this.scheduleFire(candidatePath);
    }

    // Deferred by a macrotask so the router's post-navigation render commit has a
    // chance to update document.title before the event is built. The path is
    // snapshotted now because it is already settled, whereas a same-tick
    // navigation would overwrite window.location before the flush reads it.
    private scheduleFire(path: string): void {
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
            this.firePageView(path);
        }, 0);

        this.pendingNavigations.push({ path, timeoutId });
    }

    private firePageView(path: string): void {
        const title = window.document.title;
        const event = buildPageViewEvent({
            hostname: window.location.hostname,
            title,
            path,
        });

        this.log(
            `[fire] deferred flush -> _Events.logEvent(PageView) (path: ${path}, title: ${title})`
        );

        this.mpInstance._Events.logEvent(event);
    }

    private log(message: string): void {
        this.mpInstance.Logger.verbose(`mParticle APV: ${message}`);
    }
}
