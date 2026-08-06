import { IMParticleWebSDKInstance } from './mp-instance';

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

        const { pathname, search, hash } = window.location;
        this.lastPath = pathname + search + hash;

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

    private handleNavigation(source: string): void {
        const { pathname, search, hash } = window.location;
        const candidatePath = pathname + search + hash;

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

        setTimeout(() => {
            if (!this.isActive) {
                this.mpInstance.Logger.verbose(
                    'mParticle APV: [defer] fire aborted, tracker inactive (torn down before flush)'
                );
                return;
            }

            this.mpInstance._SessionManager.resetSessionTimer();

            this.mpInstance.Logger.verbose(
                `mParticle APV: [fire] deferred flush -> _Events.logPageView() (path: ${candidatePath}, title: ${window.document.title})`
            );
            this.mpInstance._Events.logPageView();
        }, 0);
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

        const ourWrapperStillInstalled =
            this.pushStateWrapper !== null &&
            window.history.pushState === this.pushStateWrapper;

        if (this.originalPushState && this.originalReplaceState) {
            if (ourWrapperStillInstalled) {
                window.history.pushState = this.originalPushState;
                window.history.replaceState = this.originalReplaceState;
                this.mpInstance.Logger.verbose(
                    'mParticle APV: [teardown] restored original pushState/replaceState'
                );
            } else {
                this.mpInstance.Logger.verbose(
                    'mParticle APV: [teardown] wrapper no longer ours; leaving history methods, gating callback to no-op'
                );
            }
            this.originalPushState = null;
            this.originalReplaceState = null;
            this.pushStateWrapper = null;
            this.replaceStateWrapper = null;
        }

        this.isActive = false;
    }
}
