import { IMParticleWebSDKInstance } from './mp-instance';
import {
    CheckoutIntentKind,
    classifyIntentControl,
    classifyIntentFrame,
} from './checkoutIntentClassifier';

// State lives on `window`, like APV, so a re-executed bundle never doubles the
// listeners. Inspect `window.__mpCit__` in a console to see if one is live.
export const WIN_CIT_KEY = '__mpCit__';

const THROTTLE_MS = 2000;
const SUBMIT_AFTER_COMMIT_CLICK_MS = 1000;
const PATH_LIMIT = 12;

interface ICitState {
    tracker?: CheckoutIntentTracker;
}

type WindowWithCit = Window & {
    [WIN_CIT_KEY]?: ICitState;
};

const citWindow = (): WindowWithCit | null =>
    typeof window === 'undefined' ? null : (window as WindowWithCit);

export const getActiveCheckoutIntentTracker = ():
    | CheckoutIntentTracker
    | undefined => {
    const win = citWindow();
    const state = win ? win[WIN_CIT_KEY] : undefined;
    return state ? state.tracker : undefined;
};

// Stops whichever tracker is active, including one from an earlier bundle load.
export const resetCheckoutIntentTracking = (): void => {
    const win = citWindow();
    if (!win) {
        return;
    }
    const active = getActiveCheckoutIntentTracker();
    if (active) {
        active.teardown();
    }
    win[WIN_CIT_KEY] = {};
};

const CAPTURE_PASSIVE: AddEventListenerOptions = {
    capture: true,
    passive: true,
};
const PASSIVE: AddEventListenerOptions = { passive: true };

// Listens for checkout clicks, submits and wallet frame focus, and hands a
// frozen {kind, t} to the Rokt kit. No storage, no network, no event logging.
export class CheckoutIntentTracker {
    private readonly mpInstance: IMParticleWebSDKInstance;
    private active = false;
    // Bumped on reset so classification queued before it is dropped.
    private generation = 0;
    private lastCommitClick = -Infinity;
    private lastSent: { [kind: string]: { t: number; pathname: string } } = {};

    constructor(mpInstance: IMParticleWebSDKInstance) {
        this.mpInstance = mpInstance;
    }

    public get isActive(): boolean {
        return this.active;
    }

    public init(): void {
        const win = citWindow();
        if (!win) {
            return;
        }

        const previous = getActiveCheckoutIntentTracker();
        if (previous) {
            previous.teardown();
        }
        if (this.active) {
            this.teardown();
        }

        if (this.isSuppressed()) {
            this.log('privacy settings suppress checkout intent, not starting');
            return;
        }

        win.document.addEventListener('click', this.onEvent, CAPTURE_PASSIVE);
        win.document.addEventListener('submit', this.onEvent, CAPTURE_PASSIVE);
        win.addEventListener('blur', this.onEvent, PASSIVE);
        win.addEventListener('pageshow', this.onPageShow, PASSIVE);

        this.active = true;
        if (!win[WIN_CIT_KEY]) {
            win[WIN_CIT_KEY] = {};
        }
        win[WIN_CIT_KEY].tracker = this;
        this.log('listening');
    }

    public teardown(): void {
        const win = citWindow();
        if (win) {
            win.document.removeEventListener('click', this.onEvent, true);
            win.document.removeEventListener('submit', this.onEvent, true);
            win.removeEventListener('blur', this.onEvent);
            win.removeEventListener('pageshow', this.onPageShow);

            const state = win[WIN_CIT_KEY];
            if (state && state.tracker === this) {
                state.tracker = undefined;
            }
        }
        this.active = false;
        this.reset();
        // Signals not yet handed to a kit go with the tracker.
        const roktManager = this.mpInstance._RoktManager;
        if (roktManager) {
            roktManager.discardCheckoutIntents();
        }
    }

    private reset(): void {
        this.generation++;
        this.lastCommitClick = -Infinity;
        this.lastSent = {};
    }

    private readonly onPageShow = (event: PageTransitionEvent): void => {
        // A page restored from the back-forward cache starts fresh.
        if (event.persisted) {
            this.reset();
        }
    };

    private readonly onEvent = (event: Event): void => {
        try {
            this.observe(event);
        } catch (e) {
            this.log('[error] event handler threw: ' + e);
        }
    };

    private observe(event: Event): void {
        if (!this.active || !event.isTrusted) {
            return;
        }

        const t = Date.now();
        const pathname = window.location.pathname;
        const layer = event.type;
        // The composed path is only populated during dispatch, so copy it now.
        const path =
            layer === 'click' && typeof event.composedPath === 'function'
                ? event.composedPath().slice(0, PATH_LIMIT)
                : [];
        let target: EventTarget | null;
        if (layer === 'submit') {
            target = (event as Event & { submitter?: Element | null })
                .submitter;
        } else if (layer === 'blur') {
            // Read after the blur settles: some browsers have not moved focus
            // into the frame yet when the window blurs.
            target = null;
        } else {
            target = event.target;
        }

        const generation = this.generation;
        setTimeout(() => {
            if (generation !== this.generation) {
                return;
            }
            try {
                let kind: CheckoutIntentKind | undefined;
                if (layer === 'blur') {
                    kind = classifyIntentFrame(document.activeElement, window);
                } else if (layer === 'submit' && target === null) {
                    // A form submitted without a submitter only counts right
                    // after a commit click.
                    kind =
                        t - this.lastCommitClick <= SUBMIT_AFTER_COMMIT_CLICK_MS
                            ? 'commit'
                            : undefined;
                } else {
                    kind = classifyIntentControl(
                        layer === 'submit' ? [target] : path,
                        pathname
                    );
                }
                if (kind) {
                    this.emit(kind, layer, t, pathname);
                }
            } catch (e) {
                this.log('[error] classification threw: ' + e);
            }
        }, 0);
    }

    private emit(
        kind: CheckoutIntentKind,
        layer: string,
        t: number,
        pathname: string
    ): void {
        if (kind === 'commit' && layer === 'click') {
            this.lastCommitClick = t;
        }

        const last = this.lastSent[kind];
        if (last && last.pathname === pathname && t - last.t < THROTTLE_MS) {
            return;
        }
        if (this.isSuppressed()) {
            return;
        }
        this.lastSent[kind] = { t, pathname };

        this.mpInstance._RoktManager.notifyCheckoutIntent(
            Object.freeze({ kind, t }),
            pathname
        );
    }

    // The Rokt manager owns the privacy gates: flag, opt-out, launcher options
    // and Global Privacy Control.
    private isSuppressed(): boolean {
        const roktManager = this.mpInstance._RoktManager;
        return !roktManager || roktManager.isCheckoutIntentSuppressed();
    }

    private log(message: string): void {
        this.mpInstance.Logger.verbose('mParticle checkout intent: ' + message);
    }
}
