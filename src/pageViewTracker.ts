import { IMParticleWebSDKInstance } from './mp-instance';
import { EventType, MessageType } from './types';

type HistoryStateMethod = History['pushState'];

const WRAPPED_MARKER = '__mpApvWrapped__';

type MarkedHistoryMethod = HistoryStateMethod & {
    [WRAPPED_MARKER]?: boolean;
};

// window key under which the single active tracker is stored.
// Survives module re-evaluation (Next.js re-executes the bundle on every SPA
// navigation, resetting all module-level state, but window persists for the
// lifetime of the tab).
export const WIN_TRACKER_KEY = '__mpApvTracker__';

// Guards the initial page view so repeated mParticle.init() calls from SPA
// re-renders don't fire duplicate logPageView() events for the same page.
export const WIN_INIT_PV_KEY = '__mpApvInitPVLogged__' as const;

export type WindowWithApvFlags = Window & {
    [WIN_TRACKER_KEY]?: PageViewTracker;
    [WIN_INIT_PV_KEY]?: boolean;
};

type NavigationSource = 'pushState' | 'replaceState' | 'popstate';

export class PageViewTracker {
    static hasInitialPageViewFired(): boolean {
        return !!(window as WindowWithApvFlags)[WIN_INIT_PV_KEY];
    }

    static markInitialPageViewFired(): void {
        (window as WindowWithApvFlags)[WIN_INIT_PV_KEY] = true;
    }

    // Tears down any window-registered tracker that differs from instanceTracker
    // (e.g. left by a previous module load), then clears both APV window flags.
    // Call from _resetForTests after tearing down the instance-level tracker.
    static resetWindowState(instanceTracker?: PageViewTracker): void {
        const win = window as WindowWithApvFlags;
        const windowTracker = win[WIN_TRACKER_KEY];
        if (windowTracker && windowTracker !== instanceTracker) {
            windowTracker.teardown();
        }
        delete win[WIN_INIT_PV_KEY];
        delete win[WIN_TRACKER_KEY];
    }

    mpInstance: IMParticleWebSDKInstance;

    private lastPath: string | null = null;
    private isActive = false;

    private pendingNavigations: Array<{
        path: string;
        timeoutId: ReturnType<typeof setTimeout>;
    }> = [];

    private originalPushState: HistoryStateMethod | null = null;
    private originalReplaceState: HistoryStateMethod | null = null;

    private pushStateWrapper: HistoryStateMethod | null = null;
    private replaceStateWrapper: HistoryStateMethod | null = null;

    private popStateListener: (() => void) | null = null;

    constructor(mpInstance: IMParticleWebSDKInstance) {
        this.mpInstance = mpInstance;
    }

    private isSupportedEnvironment(): boolean {
        return (
            typeof window !== 'undefined' &&
            typeof window.history !== 'undefined' &&
            typeof window.history.pushState === 'function' &&
            typeof window.addEventListener === 'function'
        );
    }

    public init(): void {
        this.mpInstance.Logger.verbose('mParticle APV: [init] PageViewTracker Init');
        if (!this.isSupportedEnvironment()) {
            this.mpInstance.Logger.verbose(
                'mParticle APV: [init] unsupported environment (no History API), not starting'
            );
            return;
        }

        // Tear down any tracker left over from a previous module load.
        // window[WIN_TRACKER_KEY] outlives module re-evaluation; this is the
        // only way to reach a tracker instance in a dead module scope.
        // Transfer any pending navigations first so a route change that queued a
        // deferred fire before module re-evaluation occurs is not silently dropped.
        const win = window as WindowWithApvFlags;
        const prev = win[WIN_TRACKER_KEY];
        let inheritedPaths: string[] = [];
        if (prev && prev !== this) {
            this.mpInstance.Logger.verbose(
                'mParticle APV: [init] found stale tracker from previous module load — transferring pending navigations and tearing down'
            );
            inheritedPaths = prev.takePendingNavigations();
            prev.teardown();
        }

        if (this.isActive) {
            this.mpInstance.Logger.verbose(
                'mParticle APV: [init] starting (teardown-first for idempotency)'
            );
            this.teardown();
        }

        this.isActive = true;

        this.lastPath = this.getCurrentKey();

        this.mpInstance.Logger.verbose(
            `mParticle APV: [init] seeded lastPath: ${this.lastPath}`
        );

        this.patchHistoryMethods();
        this.addNavigationListeners();

        (window as WindowWithApvFlags)[WIN_TRACKER_KEY] = this;

        this.mpInstance.Logger.verbose(
            'mParticle APV: [init] patched pushState/replaceState + listening for popstate'
        );

        // Re-fire navigations that the stale tracker had queued but not yet flushed
        // when module re-evaluation occurred. Title is read at flush time so the
        // router's post-navigation render commit still has a chance to update it.
        inheritedPaths.forEach(path => {
            const timeoutId = setTimeout(() => {
                this.pendingNavigations = this.pendingNavigations.filter(
                    p => p.timeoutId !== timeoutId
                );
                if (!this.isActive) return;
                this.mpInstance._SessionManager.resetSessionTimer();
                this.firePageView(path);
            }, 0);
            this.pendingNavigations.push({ path, timeoutId });
        });
    }

    private patchHistoryMethods(): void {
        const self = this;

        const installed = window.history.pushState as MarkedHistoryMethod;
        if (installed[WRAPPED_MARKER]) {
            this.mpInstance.Logger.verbose(
                'mParticle APV: [patch] history already wrapped, skipping to avoid double-wrap — STACKED WRAPPER DETECTED'
            );
            return;
        }

        const originalPushState = window.history.pushState;
        const originalReplaceState = window.history.replaceState;
        this.originalPushState = originalPushState;
        this.originalReplaceState = originalReplaceState;

        const pushStateWrapper = function(
            this: History,
            ...args: Parameters<HistoryStateMethod>
        ): void {
            const result = originalPushState.apply(this, args);
            self.safeHandleNavigation('pushState');
            return result;
        };

        const replaceStateWrapper = function(
            this: History,
            ...args: Parameters<HistoryStateMethod>
        ): void {
            const result = originalReplaceState.apply(this, args);
            self.safeHandleNavigation('replaceState');
            return result;
        };

        Object.defineProperty(pushStateWrapper, WRAPPED_MARKER, {
            value: true,
            enumerable: false,
        });
        Object.defineProperty(replaceStateWrapper, WRAPPED_MARKER, {
            value: true,
            enumerable: false,
        });

        this.pushStateWrapper = pushStateWrapper;
        this.replaceStateWrapper = replaceStateWrapper;

        try {
            window.history.pushState = pushStateWrapper;
            window.history.replaceState = replaceStateWrapper;
        } catch (e) {
            this.mpInstance.Logger.verbose(
                `mParticle APV: [error] failed to patch history methods (frozen/sealed), rolling back: ${e}`
            );
            try {
                if (window.history.pushState === pushStateWrapper) {
                    window.history.pushState = originalPushState;
                }
                if (window.history.replaceState === replaceStateWrapper) {
                    window.history.replaceState = originalReplaceState;
                }
            } catch (restoreError) {
                this.mpInstance.Logger.verbose(
                    `mParticle APV: [error] failed to restore history methods after patch failure: ${restoreError}`
                );
            }
            this.pushStateWrapper = null;
            this.replaceStateWrapper = null;
            this.originalPushState = null;
            this.originalReplaceState = null;
        }
    }

    private addNavigationListeners(): void {
        this.popStateListener = () => this.safeHandleNavigation('popstate');
        window.addEventListener('popstate', this.popStateListener);
    }

    private safeHandleNavigation(source: NavigationSource): void {
        try {
            this.handleNavigation(source);
        } catch (e) {
            this.mpInstance.Logger.verbose(
                `mParticle APV: [error] navigation handler threw (${source}), page view skipped: ${e}`
            );
        }
    }

    private getCurrentKey(): string {
        return window.location.pathname;
    }

    private handleNavigation(source: NavigationSource): void {
        const candidatePath = this.getCurrentKey();

        this.mpInstance.Logger.verbose(
            `mParticle APV: [detect] navigation signal (source: ${source}, candidatePath: ${candidatePath}, lastPath: ${this.lastPath})`
        );

        if (candidatePath === this.lastPath) {
            this.mpInstance.Logger.verbose(
                `mParticle APV: [dedupe] pathname unchanged, skipping (source: ${source}, path: ${candidatePath})`
            );
            return;
        }

        this.mpInstance.Logger.verbose(
            `mParticle APV: [accept] pathname changed, scheduling fire (source: ${source}, from: ${this.lastPath}, to: ${candidatePath})`
        );
        this.lastPath = candidatePath;

        // Snapshot the path now: it is already settled at this point, and a
        // same-tick navigation would otherwise overwrite window.location
        // before the deferred flush reads it. The title is intentionally read
        // later (in the deferred flush) so the router's post-navigation render
        // commit has a chance to update document.title first.
        const capturedPath = candidatePath;

        const timeoutId = setTimeout(() => {
            this.pendingNavigations = this.pendingNavigations.filter(
                p => p.timeoutId !== timeoutId
            );
            if (!this.isActive) {
                this.mpInstance.Logger.verbose(
                    'mParticle APV: [defer] fire aborted, tracker inactive (torn down before flush)'
                );
                return;
            }

            this.mpInstance._SessionManager.resetSessionTimer();
            this.firePageView(capturedPath);
        }, 0);
        this.pendingNavigations.push({ path: capturedPath, timeoutId });
    }

    // Mirrors the event shape of the public mParticle.logPageView(), but carries
    // the captured SPA path rather than reading the live location.
    private firePageView(path: string): void {
        const title = window.document.title;

        this.mpInstance.Logger.verbose(
            `mParticle APV: [fire] deferred flush -> _Events.logEvent(PageView) (path: ${path}, title: ${title})`
        );

        this.mpInstance._Events.logEvent({
            messageType: MessageType.PageView,
            name: 'PageView',
            data: {
                hostname: window.location.hostname,
                title,
                path,
            },
            eventType: EventType.Unknown,
        });
    }

    // Cancels pending deferred fires and returns their captured paths so a
    // successor tracker can re-schedule them. Call before teardown() during
    // module-replacement handoff.
    public takePendingNavigations(): string[] {
        const paths = this.pendingNavigations.map(p => p.path);
        this.pendingNavigations.forEach(p => clearTimeout(p.timeoutId));
        this.pendingNavigations = [];
        return paths;
    }

    private restoreHistoryMethod(
        methodName: 'pushState' | 'replaceState',
        original: HistoryStateMethod | null,
        wrapper: HistoryStateMethod | null
    ): void {
        if (!original) return;
        const stillOurs = wrapper !== null && window.history[methodName] === wrapper;
        if (stillOurs) {
            window.history[methodName] = original;
            this.mpInstance.Logger.verbose(
                `mParticle APV: [teardown] restored original ${methodName}`
            );
        } else {
            this.mpInstance.Logger.verbose(
                `mParticle APV: [teardown] ${methodName} no longer ours; leaving in place, gating callback to no-op`
            );
        }
    }

    public teardown(): void {
        // Cancel any pending deferred fires (e.g. when the feature flag is
        // disabled on re-init). For module-replacement, call takePendingNavigations()
        // before teardown() instead so paths are transferred, not discarded.
        this.pendingNavigations.forEach(p => clearTimeout(p.timeoutId));
        this.pendingNavigations = [];

        if (this.popStateListener) {
            window.removeEventListener('popstate', this.popStateListener);
            this.popStateListener = null;
        }

        this.restoreHistoryMethod('pushState', this.originalPushState, this.pushStateWrapper);
        this.originalPushState = null;
        this.pushStateWrapper = null;

        this.restoreHistoryMethod('replaceState', this.originalReplaceState, this.replaceStateWrapper);
        this.originalReplaceState = null;
        this.replaceStateWrapper = null;

        this.isActive = false;
        const win = window as WindowWithApvFlags;
        if (win[WIN_TRACKER_KEY] === this) {
            delete win[WIN_TRACKER_KEY];
        }
    }
}
