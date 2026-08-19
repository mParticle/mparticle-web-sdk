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

type WindowWithTracker = Window & {
    [WIN_TRACKER_KEY]?: PageViewTracker;
};

type NavigationSource = 'pushState' | 'replaceState' | 'popstate';

export class PageViewTracker {
    mpInstance: IMParticleWebSDKInstance;

    private lastPath: string | null = null;
    private isActive = false;

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
        const win = window as WindowWithTracker;
        const prev = win[WIN_TRACKER_KEY];
        if (prev && prev !== this) {
            this.mpInstance.Logger.verbose(
                'mParticle APV: [init] found stale tracker from previous module load — tearing down to prevent stacked wrappers'
            );
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

        (window as WindowWithTracker)[WIN_TRACKER_KEY] = this;

        this.mpInstance.Logger.verbose(
            'mParticle APV: [init] patched pushState/replaceState + listening for popstate'
        );
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

        setTimeout(() => {
            if (!this.isActive) {
                this.mpInstance.Logger.verbose(
                    'mParticle APV: [defer] fire aborted, tracker inactive (torn down before flush)'
                );
                return;
            }

            this.mpInstance._SessionManager.resetSessionTimer();
            this.firePageView(capturedPath);
        }, 0);
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
        const win = window as WindowWithTracker;
        if (win[WIN_TRACKER_KEY] === this) {
            delete win[WIN_TRACKER_KEY];
        }
    }
}
