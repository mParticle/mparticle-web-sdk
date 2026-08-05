import { IMParticleWebSDKInstance } from './mp-instance';

/**
 * PageViewTracker detects client-side (SPA) navigations and fires an
 * auto-logged page view for each one, when the AutoLogPageView feature flag
 * is enabled.
 *
 * No framework detection is needed: every client-side router ultimately
 * drives navigation through the same browser primitives —
 *   - history.pushState()  (forward navigation)
 *   - history.replaceState() (redirects / canonicalization)
 *   - popstate  (back / forward buttons)
 *   - hashchange (hash routers)
 *
 * pushState/replaceState fire no native event, so we monkey-patch them
 * (the standard technique used by GA4, Segment, Amplitude, Datadog RUM) and
 * listen for popstate/hashchange. Navigations are deduped by pathname. MPAs
 * never trigger these, so with the flag off the tracker is never constructed
 * and the listeners stay inert.
 *
 * Modeled on BatchUploader: the constructor is side-effect-free; init() does
 * the patching/listening and tears down internally first for idempotency.
 *
 * NOTE (POC): every detection stage emits console.warn('Rokt APV:', ...) so we
 * can validate the detection logic locally. These logs are for the prototype
 * only and would be removed before shipping.
 */

type HistoryStateMethod = History['pushState'];

export class PageViewTracker {
    mpInstance: IMParticleWebSDKInstance;

    // The path we last fired for; used to dedupe repeated navigations to the
    // same pathname. Seeded in init() with the landing page.
    private lastPath: string | null = null;

    private isActive = false;

    // Original references so we can restore on teardown (good-neighbor patch).
    private originalPushState: HistoryStateMethod | null = null;
    private originalReplaceState: HistoryStateMethod | null = null;

    // Named listener refs so teardown removes exactly what init added.
    private popStateListener: (() => void) | null = null;
    private hashChangeListener: (() => void) | null = null;

    constructor(mpInstance: IMParticleWebSDKInstance) {
        this.mpInstance = mpInstance;
    }

    /**
     * Guards against non-browser / webview contexts where the History API is
     * unavailable.
     */
    private isSupportedEnvironment(): boolean {
        return (
            typeof window !== 'undefined' &&
            typeof window.history !== 'undefined' &&
            typeof window.history.pushState === 'function' &&
            typeof window.addEventListener === 'function'
        );
    }

    public init(): void {
        if (!this.isSupportedEnvironment()) {
            // eslint-disable-next-line no-console
            console.warn(
                'Rokt APV: [init] unsupported environment (no History API), not starting'
            );
            return;
        }

        // Idempotent: tear down any prior patch/listeners first so repeated
        // init() calls (e.g. re-init) don't stack wrappers or listeners.
        // eslint-disable-next-line no-console
        console.warn('Rokt APV: [init] starting (teardown-first for idempotency)');
        this.teardown();

        this.isActive = true;

        // Seed lastPath with the current landing page so the first real
        // navigation registers as a change rather than a spurious fire.
        this.lastPath = window.location.pathname;
        // eslint-disable-next-line no-console
        console.warn('Rokt APV: [init] seeded lastPath', {
            lastPath: this.lastPath,
        });

        this.patchHistoryMethods();
        this.addNavigationListeners();

        // eslint-disable-next-line no-console
        console.warn(
            'Rokt APV: [init] patched pushState/replaceState + listening for popstate/hashchange'
        );
    }

    private patchHistoryMethods(): void {
        this.originalPushState = window.history.pushState;
        this.originalReplaceState = window.history.replaceState;

        const self = this;

        // Wrap with original.apply(this, args) so the router's own behavior is
        // untouched, then handle the navigation. Patch both identically —
        // path-changing replaceState (redirects) should also log a view;
        // under-counting is worse than a rare extra view.
        window.history.pushState = function(
            this: History,
            ...args: Parameters<HistoryStateMethod>
        ): void {
            const result = self.originalPushState!.apply(this, args);
            self.handleNavigation('pushState');
            return result;
        };

        window.history.replaceState = function(
            this: History,
            ...args: Parameters<HistoryStateMethod>
        ): void {
            const result = self.originalReplaceState!.apply(this, args);
            self.handleNavigation('replaceState');
            return result;
        };
    }

    private addNavigationListeners(): void {
        this.popStateListener = () => this.handleNavigation('popstate');
        this.hashChangeListener = () => this.handleNavigation('hashchange');

        window.addEventListener('popstate', this.popStateListener);
        window.addEventListener('hashchange', this.hashChangeListener);
    }

    /**
     * Called by every navigation primitive. Captures the candidate path
     * synchronously, dedupes by pathname, and defers the fire to the next
     * macrotask so the SPA's document.title has settled.
     */
    private handleNavigation(source: string): void {
        const candidatePath = window.location.pathname;

        // eslint-disable-next-line no-console
        console.warn('Rokt APV: [detect] navigation signal', {
            source,
            candidatePath,
            lastPath: this.lastPath,
        });

        if (candidatePath === this.lastPath) {
            // eslint-disable-next-line no-console
            console.warn('Rokt APV: [dedupe] pathname unchanged, skipping', {
                source,
                path: candidatePath,
            });
            return;
        }

        // eslint-disable-next-line no-console
        console.warn('Rokt APV: [accept] pathname changed, scheduling fire', {
            source,
            from: this.lastPath,
            to: candidatePath,
        });
        this.lastPath = candidatePath;

        // Defer via setTimeout(fn, 0) — chosen over requestAnimationFrame
        // (throttled in background tabs) and queueMicrotask (may run before the
        // render commit, yielding a stale title).
        setTimeout(() => {
            if (!this.isActive) {
                // eslint-disable-next-line no-console
                console.warn(
                    'Rokt APV: [defer] fire aborted, tracker inactive (torn down before flush)'
                );
                return;
            }
            // eslint-disable-next-line no-console
            console.warn('Rokt APV: [fire] deferred flush -> _Events.logPageView()', {
                path: candidatePath,
                title: window.document.title,
            });
            this.mpInstance._Events.logPageView();
        }, 0);
    }

    /**
     * Removes listeners unconditionally and restores the original history
     * methods only if the wrapper is still ours (someone may have patched on
     * top of us). Otherwise we simply mark inactive so the deferred callback
     * no-ops.
     */
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
            this.originalPushState !== null &&
            window.history.pushState !== this.originalPushState;

        if (this.originalPushState && this.originalReplaceState) {
            if (ourWrapperStillInstalled) {
                window.history.pushState = this.originalPushState;
                window.history.replaceState = this.originalReplaceState;
                // eslint-disable-next-line no-console
                console.warn(
                    'Rokt APV: [teardown] restored original pushState/replaceState'
                );
            } else {
                // eslint-disable-next-line no-console
                console.warn(
                    'Rokt APV: [teardown] wrapper no longer ours; leaving history methods, gating callback to no-op'
                );
            }
            this.originalPushState = null;
            this.originalReplaceState = null;
        }

        this.isActive = false;
    }
}
