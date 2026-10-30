import { IMParticleWebSDKInstance } from '../mp-instance';
import { isFunction } from '../utils';
import { buildButtonClickEvent, buildLinkClickEvent } from './buttonClickEvent';
import {
    describeButtonClick,
    describePaymentChoice,
    IButtonClick,
    IPaymentChoice,
    isLinkClick,
    isPicked,
} from './buttonDescription';
import {
    CheckoutIntentKind,
    CheckoutIntentSource,
    classifyIntent,
    classifyPaymentFrame,
    PaymentFrameFamily,
} from './checkoutIntent';
import { findControl, findRoleControl, isExcludedPath } from './controls';

// State lives on `window`, like APV, so a re-executed bundle never doubles the
// listeners. Inspect `window.__mpBtn__` in a console to see if one is live.
export const WIN_BTN_KEY = '__mpBtn__';

const THROTTLE_MS = 2000;
const SUBMIT_AFTER_COMMIT_CLICK_MS = 1000;
// Apple Pay must begin inside the tap's own handler, so the tap is this recent.
const APPLE_PAY_AFTER_CLICK_MS = 1000;
// How far up from the clicked element a control is looked for. Checkout intent
// keeps findControl's own 12; logging looks further, past deep product cards.
const PATH_LIMIT = 20;
// A ceiling, not a dedupe: a held Enter key or browser automation fires a
// trusted click per repeat, and each one is forwarded to every kit.
const PAGE_EVENT_LIMIT = 100;

interface IBtnState {
    tracker?: ButtonTracker;
}

type WindowWithBtn = Window & {
    [WIN_BTN_KEY]?: IBtnState;
};

export interface IButtonTrackerOptions {
    // The Rokt kit signal only runs when this init configures a Rokt kit.
    hasRoktKit: boolean;
    // Button clicks and clicks on links that leave the page are logged apart.
    logButtons: boolean;
    logLinks: boolean;
}

const btnWindow = (): WindowWithBtn | null =>
    typeof window === 'undefined' ? null : (window as WindowWithBtn);

export const getActiveButtonTracker = (): ButtonTracker | undefined => {
    const win = btnWindow();
    const state = win ? win[WIN_BTN_KEY] : undefined;
    return state ? state.tracker : undefined;
};

// Stops whichever tracker is active, including one from an earlier bundle load.
export const resetButtonTracking = (): void => {
    const win = btnWindow();
    if (!win) {
        return;
    }
    const active = getActiveButtonTracker();
    if (active) {
        active.teardown();
    }
    win[WIN_BTN_KEY] = {};
};

// Runs once the browser has painted the page's response to the interaction, so
// describing and logging a click never delays that paint.
const afterNextPaint = (fn: () => void): void => {
    if (
        isFunction(window.requestAnimationFrame) &&
        document.visibilityState !== 'hidden'
    ) {
        requestAnimationFrame(() => {
            setTimeout(fn, 0);
        });
    } else {
        setTimeout(fn, 0);
    }
};

// Apple Pay's session opens only from a shopper's tap, whatever button the page
// draws for it, so its opening is a wallet tap no label or name rule can miss.
// The wrapper keeps the page's own begin under this key, to put it back.
const APPLE_PAY_HOOK = '__mpApplePayHook__';

const applePayPrototype = (win: Window) => {
    const session = win['ApplePaySession'];
    return session && session.prototype;
};

// Wraps ApplePaySession.prototype.begin once per window, so the active tracker
// hears that a session began. The wrapper reads no arguments and no payment
// data, and returns or throws exactly what the original does. Nothing here can
// throw into SDK init: a throwing getter or a frozen prototype leaves Apple Pay
// as it was.
const hookApplePay = (win: Window): void => {
    try {
        const prototype = applePayPrototype(win);
        const begin = prototype && prototype.begin;
        if (!isFunction(begin) || begin[APPLE_PAY_HOOK]) {
            return;
        }
        const opened = function(this: unknown, ...args: unknown[]) {
            const result = begin.apply(this, args);
            try {
                const tracker = getActiveButtonTracker();
                if (tracker) {
                    tracker.onApplePayBegin();
                }
            } catch (e) {
                // A session the page began is never disturbed by tracking.
            }
            return result;
        };
        // Not enumerable, so the marker doesn't show among the method's own keys.
        Object.defineProperty(opened, APPLE_PAY_HOOK, { value: begin });
        prototype.begin = opened;
    } catch (e) {
        // Apple Pay stays as the page set it up.
    }
};

// Puts the page's own begin back, unless another script has wrapped it since.
const unhookApplePay = (win: Window): void => {
    try {
        const prototype = applePayPrototype(win);
        const begin = prototype && prototype.begin;
        if (isFunction(begin) && isFunction(begin[APPLE_PAY_HOOK])) {
            prototype.begin = begin[APPLE_PAY_HOOK];
        }
    } catch (e) {
        // Apple Pay stays as it is.
    }
};

const CAPTURE_PASSIVE: AddEventListenerOptions = {
    capture: true,
    passive: true,
};
const PASSIVE: AddEventListenerOptions = { passive: true };

// Logs button clicks and clicks on links that leave the page as mParticle events, and hands checkout
// intent to the Rokt kit as a frozen {kind, t, source, pathname}, with adds on an add-to-cart click.
// Submits and wallet frame focus feed the kit only, and so do payment picks: a payment radio's option
// names, or the payment family of a focused frame.
export class ButtonTracker {
    private readonly mpInstance: IMParticleWebSDKInstance;
    private active = false;
    private hasRoktKit = false;
    private logButtons = false;
    private logLinks = false;
    // Bumped on reset so classification queued before it is dropped.
    private generation = 0;
    private lastCommitClick = -Infinity;
    // The latest trusted click: whether the page excluded it, and the intent it
    // already carries to the kit, with its source, if any.
    private lastClick: {
        t: number;
        excluded: boolean;
        kind: CheckoutIntentKind | undefined;
        source: CheckoutIntentSource | undefined;
    } | null = null;
    private lastSent: { [kind: string]: { t: number; pathname: string } } = {};
    private pagePath: string | null = null;
    private pageEvents = 0;
    // Clicks read at dispatch and waiting for the next paint.
    private pending: Array<() => void> = [];

    constructor(mpInstance: IMParticleWebSDKInstance) {
        this.mpInstance = mpInstance;
    }

    public get isActive(): boolean {
        return this.active;
    }

    public init(options: IButtonTrackerOptions): void {
        const win = btnWindow();
        if (!win) {
            return;
        }

        const previous = getActiveButtonTracker();
        if (previous) {
            previous.teardown();
        }
        if (this.active) {
            this.teardown();
        }
        this.hasRoktKit = options.hasRoktKit;
        this.logButtons = options.logButtons;
        this.logLinks = options.logLinks;

        if (
            (!(this.logButtons || this.logLinks) || !this.eventsEnabled()) &&
            this.isKitSuppressed()
        ) {
            this.log('opted out, not starting');
            return;
        }

        win.document.addEventListener('click', this.onEvent, CAPTURE_PASSIVE);
        win.document.addEventListener('submit', this.onEvent, CAPTURE_PASSIVE);
        win.addEventListener('blur', this.onEvent, PASSIVE);
        win.addEventListener('pageshow', this.onPageShow, PASSIVE);
        win.addEventListener('beforeunload', this.onHide, CAPTURE_PASSIVE);
        win.addEventListener('pagehide', this.onHide, CAPTURE_PASSIVE);
        win.document.addEventListener(
            'visibilitychange',
            this.onHide,
            CAPTURE_PASSIVE
        );

        this.active = true;
        if (!win[WIN_BTN_KEY]) {
            win[WIN_BTN_KEY] = {};
        }
        win[WIN_BTN_KEY].tracker = this;
        // Only where checkout intent can reach the kit; a shopper who opts back in mid-page gets no session
        // signal until the next page load.
        if (!this.isKitSuppressed()) {
            hookApplePay(win);
        }
        this.log('listening');
    }

    // An Apple Pay session begun right after a tracked tap counts as a wallet
    // tap for the kit; one begun with no such tap, or from a tap the page
    // excluded, does not. A tap that reads as a confirm tap reaches the kit as
    // one. It is delivered on a timer, not after the next paint, since the
    // payment sheet may hold painting back: a tap that already reads as a
    // wallet goes now under its own rule, and the throttle drops the copy
    // queued for the paint.
    public onApplePayBegin(): void {
        const t = Date.now();
        const click = this.lastClick;
        if (
            !this.active ||
            !click ||
            click.excluded ||
            click.kind === 'commit' ||
            t - click.t > APPLE_PAY_AFTER_CLICK_MS ||
            this.isKitSuppressed()
        ) {
            return;
        }
        const pathname = window.location.pathname;
        const generation = this.generation;
        setTimeout(() => {
            if (generation !== this.generation) {
                return;
            }
            try {
                this.emit(
                    'wallet',
                    click.kind === 'wallet' ? click.source : 'api',
                    'apple_pay',
                    t,
                    pathname
                );
            } catch (e) {
                this.log('[error] Apple Pay delivery threw: ' + e);
            }
        }, 0);
    }

    public teardown(): void {
        const win = btnWindow();
        if (win) {
            win.document.removeEventListener('click', this.onEvent, true);
            win.document.removeEventListener('submit', this.onEvent, true);
            win.removeEventListener('blur', this.onEvent);
            win.removeEventListener('pageshow', this.onPageShow);
            win.removeEventListener('beforeunload', this.onHide, true);
            win.removeEventListener('pagehide', this.onHide, true);
            win.document.removeEventListener(
                'visibilitychange',
                this.onHide,
                true
            );

            const state = win[WIN_BTN_KEY];
            if (state && state.tracker === this) {
                state.tracker = undefined;
                unhookApplePay(win);
            }
        }
        this.active = false;
        // Signals not yet handed to a kit go with the tracker.
        this.clearPending();
    }

    // Drops queued classification, commit timing and buffered signals, so
    // nothing captured before an opt-out is delivered after an opt-in.
    public clearPending(): void {
        this.reset();
        const roktManager = this.mpInstance._RoktManager;
        if (roktManager) {
            roktManager.discardCheckoutIntents();
        }
    }

    private reset(): void {
        this.generation++;
        this.pending = [];
        this.lastCommitClick = -Infinity;
        this.lastClick = null;
        this.lastSent = {};
        this.pagePath = null;
        this.pageEvents = 0;
    }

    private enqueue(delivery: () => void): void {
        this.pending.push(delivery);
        if (this.pending.length === 1) {
            afterNextPaint(this.drain);
        }
    }

    private readonly drain = (): void => {
        const queue = this.pending;
        this.pending = [];
        queue.forEach(delivery => delivery());
    };

    // A click that navigates away can unload the page before the next paint, so
    // anything waiting is delivered as the page is hidden or left. The capture
    // listeners run before the SDK's own upload on the same events, including
    // beforeunload, the first of them.
    private readonly onHide = (event: Event): void => {
        if (
            event.type === 'beforeunload' ||
            event.type === 'pagehide' ||
            document.visibilityState === 'hidden'
        ) {
            // The SDK's exit upload then sends these clicks with the queue.
            this.drain();
        }
    };

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
        const layer = event.type;
        const logsEvents =
            layer === 'click' &&
            (this.logButtons || this.logLinks) &&
            this.eventsEnabled() &&
            !this.hasTargetingOptOut();
        const signalsKit = !this.isKitSuppressed();
        if (!logsEvents && !signalsKit) {
            return;
        }

        const t = Date.now();
        const pathname = window.location.pathname;

        // The button is read now, while the click is still being dispatched:
        // this capture listener runs before the page's own handlers, so a
        // button that disables or relabels itself is seen as it was clicked.
        // Logging and the kit hand-off wait for the next paint.
        let click: IButtonClick | undefined;
        let asLink = false;
        let box: HTMLInputElement | undefined;
        let kind: CheckoutIntentKind | undefined;
        let source: CheckoutIntentSource | undefined;
        let adds: true | undefined;
        let choice: IPaymentChoice | undefined;
        let family: PaymentFrameFamily | undefined;
        let unconfirmedCommit = false;
        if (layer === 'click') {
            // The composed path is only populated during dispatch.
            const path = isFunction(event.composedPath)
                ? event.composedPath().slice(0, PATH_LIMIT)
                : [];
            const excluded = isExcludedPath(path);
            const control = excluded ? undefined : findControl(path, true);
            const logged =
                control ||
                (excluded
                    ? undefined
                    : findControl(path, true, PATH_LIMIT) ||
                      findRoleControl(path, PATH_LIMIT));
            if (logged) {
                // With links alone, only an anchor can be logged.
                click =
                    logsEvents &&
                    (this.logButtons || logged.matches('a[href]'))
                        ? describeButtonClick(logged, path)
                        : undefined;
                if (click) {
                    asLink = this.logLinks && isLinkClick(click);
                    // Without link tracking, a link that leaves the page stays a
                    // button click, except a plain link to another page of the
                    // site, which button tracking never logged.
                    const asButton =
                        this.logButtons &&
                        !asLink &&
                        !(
                            click.linkType === 'internal' &&
                            logged.matches('a[href]:not([role="button"])')
                        );
                    if (!asLink && !asButton) {
                        click = undefined;
                    }
                }
                if (click && click.checked !== undefined) {
                    box = logged as HTMLInputElement;
                }
            }
            if (control) {
                // Checkout intent is only worked out when the kit can use it.
                const intent = signalsKit
                    ? classifyIntent(control, pathname)
                    : undefined;
                kind = intent ? intent.kind : undefined;
                source = intent ? intent.source : undefined;
                adds = intent ? intent.adds : undefined;
                choice = signalsKit
                    ? describePaymentChoice(control, path)
                    : undefined;
            }
            this.lastClick = { t, excluded, kind, source };
        } else if (layer === 'submit') {
            const submitter = (event as Event & { submitter?: Element | null })
                .submitter;
            const control = submitter ? findControl([submitter]) : undefined;
            // A form submitted without a submitter only counts right after a
            // commit click, which is known once that click is delivered.
            if (!submitter) {
                kind = 'commit';
                source = 'submit';
            } else if (control) {
                const intent = classifyIntent(control, pathname);
                kind = intent ? intent.kind : undefined;
                source = intent ? intent.source : undefined;
                adds = intent ? intent.adds : undefined;
            }
            unconfirmedCommit = !submitter;
        }

        const generation = this.generation;
        this.enqueue(() => {
            if (generation !== this.generation) {
                return;
            }
            try {
                if (layer === 'blur') {
                    // Read after the blur settles: some browsers have not moved
                    // focus into the frame yet when the window blurs.
                    const frame = classifyPaymentFrame(
                        document.activeElement,
                        window
                    );
                    kind = frame ? frame.kind : undefined;
                    family = frame ? frame.family : undefined;
                    source = 'frame';
                } else if (
                    unconfirmedCommit &&
                    t - this.lastCommitClick > SUBMIT_AFTER_COMMIT_CLICK_MS
                ) {
                    kind = undefined;
                }
                if (click && logsEvents) {
                    // The box as this click left it. The browser toggles it
                    // before dispatch and puts it back once a cancelled click
                    // is over, so only a cancelled click changes the reading
                    // taken at dispatch: a checkbox to the other state, a
                    // radio to however it was restored.
                    if (box && event.defaultPrevented) {
                        click.checked =
                            box.type === 'checkbox'
                                ? !click.checked
                                : box.checked;
                    }
                    this.logClick(click, pathname, asLink);
                }
                // Ahead of the intent, so a pre-selection it fires goes out
                // with this pick.
                if (choice && isPicked(choice.radio)) {
                    this.pickPayment(t, pathname, choice.names);
                } else if (family) {
                    this.pickPayment(t, pathname, undefined, family);
                }
                if (kind) {
                    this.emit(kind, source, layer, t, pathname, adds);
                }
            } catch (e) {
                this.log('[error] delivery threw: ' + e);
            }
        });
    }

    // Every real click is one event, repeats included, up to a ceiling per page.
    private logClick(
        click: IButtonClick,
        pathname: string,
        asLink: boolean
    ): void {
        if (!this.eventsEnabled() || this.hasTargetingOptOut()) {
            return;
        }
        if (pathname !== this.pagePath) {
            this.pagePath = pathname;
            this.pageEvents = 0;
        }
        if (this.pageEvents >= PAGE_EVENT_LIMIT) {
            return;
        }
        this.pageEvents++;
        // Restarts an expired session, as public logEvent() and page views do.
        this.mpInstance._SessionManager.resetSessionTimer();
        // No upload of its own, which a click that opens another page would
        // cancel: with batching on, the next batch or the exit upload sends it.
        this.mpInstance._Events.logEvent(
            asLink
                ? buildLinkClickEvent(click, pathname)
                : buildButtonClickEvent(click, pathname)
        );
    }

    private emit(
        kind: CheckoutIntentKind,
        source: CheckoutIntentSource | undefined,
        layer: string,
        t: number,
        pathname: string,
        adds?: true
    ): void {
        if (this.isKitSuppressed()) {
            return;
        }
        if (kind === 'commit' && layer === 'click') {
            this.lastCommitClick = t;
        }

        // An add-to-cart click throttles apart from a click that opens the
        // cart, so opening the cart first never drops the add.
        const key = adds ? kind + ':adds' : kind;
        const last = this.lastSent[key];
        if (last && last.pathname === pathname && t - last.t < THROTTLE_MS) {
            return;
        }
        this.lastSent[key] = { t, pathname };

        this.mpInstance._RoktManager.notifyCheckoutIntent(
            Object.freeze(
                adds
                    ? { kind, t, source, pathname, adds }
                    : { kind, t, source, pathname }
            ),
            pathname
        );
    }

    private pickPayment(
        t: number,
        pathname: string,
        names?: string[],
        family?: PaymentFrameFamily
    ): void {
        if (this.isKitSuppressed()) {
            return;
        }
        this.mpInstance._RoktManager.notifyPaymentPick(
            Object.freeze({
                t,
                pathname,
                names: names ? Object.freeze(names.slice()) : undefined,
                family,
            })
        );
    }

    // Events follow the SDK's opt-out like any other event.
    private eventsEnabled(): boolean {
        const store = this.mpInstance._Store;
        return !!store && store.isEnabled;
    }

    // Read per click, since the launcher options can arrive after the tracker
    // starts. Only where this init configures a Rokt kit, so Global Privacy
    // Control alone doesn't stop click logging elsewhere.
    private hasTargetingOptOut(): boolean {
        const roktManager = this.mpInstance._RoktManager;
        return (
            this.hasRoktKit &&
            !!roktManager &&
            roktManager.hasTargetingOptOut()
        );
    }

    // The Rokt manager owns the kit's privacy gates: flag, opt-out, launcher
    // options and Global Privacy Control.
    private isKitSuppressed(): boolean {
        const roktManager = this.mpInstance._RoktManager;
        return (
            !this.hasRoktKit ||
            !roktManager ||
            roktManager.isCheckoutIntentSuppressed()
        );
    }

    private log(message: string): void {
        this.mpInstance.Logger.verbose('mParticle button tracking: ' + message);
    }
}
