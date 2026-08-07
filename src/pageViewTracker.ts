import { IMParticleWebSDKInstance } from './mp-instance';
import { EventType, MessageType } from './types';

type HistoryStateMethod = History['pushState'];

const WRAPPED_MARKER = '__mpApvWrapped__';

type MarkedHistoryMethod = HistoryStateMethod & {
    [WRAPPED_MARKER]?: boolean;
};

export class PageViewTracker {
    mpInstance: IMParticleWebSDKInstance;

    private lastPath: string | null = null;
    private isActive = false;

    private originalPushState: HistoryStateMethod | null = null;
    private originalReplaceState: HistoryStateMethod | null = null;

    private pushStateWrapper: HistoryStateMethod | null = null;
    private replaceStateWrapper: HistoryStateMethod | null = null;

    private popStateListener: (() => void) | null = null;
    private hashChangeListener: (() => void) | null = null;

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
        this.mpInstance.Logger.verbose(
            'mParticle APV: [init] PageViewTracker Init'
        );
        if (!this.isSupportedEnvironment()) {
            this.mpInstance.Logger.verbose(
                'mParticle APV: [init] unsupported environment (no History API), not starting'
            );
            return;
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

        this.mpInstance.Logger.verbose(
            'mParticle APV: [init] patched pushState/replaceState + listening for popstate/hashchange'
        );
    }

    private patchHistoryMethods(): void {
        const self = this;

        const installed = window.history.pushState as MarkedHistoryMethod;
        if (installed[WRAPPED_MARKER]) {
            this.mpInstance.Logger.verbose(
                'mParticle APV: [patch] history already wrapped, skipping to avoid double-wrap'
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
        this.hashChangeListener = () => this.safeHandleNavigation('hashchange');

        window.addEventListener('popstate', this.popStateListener);
        window.addEventListener('hashchange', this.hashChangeListener);
    }

    private safeHandleNavigation(source: string): void {
        try {
            this.handleNavigation(source);
        } catch (e) {
            this.mpInstance.Logger.verbose(
                `mParticle APV: [error] navigation handler threw (${source}), page view skipped: ${e}`
            );
        }
    }

    private getCurrentKey(): string {
        const { pathname, search, hash } = window.location;
        return pathname + search + hash;
    }

    private handleNavigation(source: string): void {
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

    public teardown(): void {
        if (this.popStateListener) {
            window.removeEventListener('popstate', this.popStateListener);
            this.popStateListener = null;
        }
        if (this.hashChangeListener) {
            window.removeEventListener('hashchange', this.hashChangeListener);
            this.hashChangeListener = null;
        }

        const pushStateStillOurs =
            this.pushStateWrapper !== null &&
            window.history.pushState === this.pushStateWrapper;
        if (this.originalPushState) {
            if (pushStateStillOurs) {
                window.history.pushState = this.originalPushState;
                this.mpInstance.Logger.verbose(
                    'mParticle APV: [teardown] restored original pushState'
                );
            } else {
                this.mpInstance.Logger.verbose(
                    'mParticle APV: [teardown] pushState no longer ours; leaving in place, gating callback to no-op'
                );
            }
            this.originalPushState = null;
            this.pushStateWrapper = null;
        }

        const replaceStateStillOurs =
            this.replaceStateWrapper !== null &&
            window.history.replaceState === this.replaceStateWrapper;
        if (this.originalReplaceState) {
            if (replaceStateStillOurs) {
                window.history.replaceState = this.originalReplaceState;
                this.mpInstance.Logger.verbose(
                    'mParticle APV: [teardown] restored original replaceState'
                );
            } else {
                this.mpInstance.Logger.verbose(
                    'mParticle APV: [teardown] replaceState no longer ours; leaving in place, gating callback to no-op'
                );
            }
            this.originalReplaceState = null;
            this.replaceStateWrapper = null;
        }

        this.isActive = false;
    }
}
