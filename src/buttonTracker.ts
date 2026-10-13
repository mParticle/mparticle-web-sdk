import { IMParticleWebSDKInstance } from './mp-instance';
import { BaseEvent } from './sdkRuntimeModels';
import { EventType, MessageType } from './types';
import {
    CheckoutIntentKind,
    classifyIntentControl,
    classifyIntentFrame,
    describeButtonClick,
    IButtonClick,
} from './buttonIntentClassifier';

// State lives on `window`, like APV, so a re-executed bundle never doubles the
// listeners. Inspect `window.__mpBtn__` in a console to see if one is live.
export const WIN_BTN_KEY = '__mpBtn__';

// Marks an automatically logged button click, like `is_auto_page_view`.
export const AUTO_BUTTON_ATTRIBUTE = 'is_auto_button_click';
// The same marker as a custom flag, which attribute filters and data plans keep,
// so the Rokt kit never treats an auto click as a configured trigger event.
export const AUTO_BUTTON_FLAG = 'Rokt.AutoButtonClick';

const THROTTLE_MS = 2000;
const SUBMIT_AFTER_COMMIT_CLICK_MS = 1000;
const PATH_LIMIT = 12;
const EVENT_DEDUP_MS = 1000;
const PAGE_EVENT_LIMIT = 50;

interface IBtnState {
    tracker?: ButtonTracker;
}

type WindowWithBtn = Window & {
    [WIN_BTN_KEY]?: IBtnState;
};

export interface IButtonTrackerOptions {
    // The Rokt kit signal only runs when this init configures a Rokt kit.
    hasRoktKit: boolean;
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

export const BUTTON_CLICK_EVENT_NAME = 'Button Click';

// One custom event per click, logged like logLink() with the auto marker and the
// page fields that auto page views carry. No intent: classifying clicks is left
// to whoever reads the data.
export const buildButtonClickEvent = (
    click: IButtonClick,
    pathname: string
): BaseEvent => {
    const data: { [key: string]: string | boolean } = {
        label_source: click.labelSource,
        element: click.element,
        type: click.type,
        path: pathname,
        hostname: window.location.hostname,
        [AUTO_BUTTON_ATTRIBUTE]: true,
    };
    if (click.label) {
        data.label = click.label;
    }
    if (click.ariaLabel) {
        data.aria_label = click.ariaLabel;
    }
    if (click.icon) {
        data.icon = click.icon;
    }
    return {
        messageType: MessageType.PageEvent,
        name: BUTTON_CLICK_EVENT_NAME,
        data,
        eventType: EventType.Other,
        customFlags: { [AUTO_BUTTON_FLAG]: 'true' },
    };
};

const CAPTURE_PASSIVE: AddEventListenerOptions = {
    capture: true,
    passive: true,
};
const PASSIVE: AddEventListenerOptions = { passive: true };

// Logs every button click as an mParticle event, and hands checkout intent to the
// Rokt kit as a frozen {kind, t}. Submits and wallet frame focus feed the kit only.
export class ButtonTracker {
    private readonly mpInstance: IMParticleWebSDKInstance;
    private active = false;
    private hasRoktKit = false;
    // Bumped on reset so classification queued before it is dropped.
    private generation = 0;
    private lastCommitClick = -Infinity;
    private lastSent: { [kind: string]: { t: number; pathname: string } } = {};
    private pagePath: string | null = null;
    private pageEvents = 0;
    private lastEvent: { [key: string]: number } = {};

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

        if (!this.eventsEnabled() && this.isKitSuppressed()) {
            this.log('opted out, not starting');
            return;
        }

        win.document.addEventListener('click', this.onEvent, CAPTURE_PASSIVE);
        win.document.addEventListener('submit', this.onEvent, CAPTURE_PASSIVE);
        win.addEventListener('blur', this.onEvent, PASSIVE);
        win.addEventListener('pageshow', this.onPageShow, PASSIVE);

        this.active = true;
        if (!win[WIN_BTN_KEY]) {
            win[WIN_BTN_KEY] = {};
        }
        win[WIN_BTN_KEY].tracker = this;
        this.log('listening');
    }

    public teardown(): void {
        const win = btnWindow();
        if (win) {
            win.document.removeEventListener('click', this.onEvent, true);
            win.document.removeEventListener('submit', this.onEvent, true);
            win.removeEventListener('blur', this.onEvent);
            win.removeEventListener('pageshow', this.onPageShow);

            const state = win[WIN_BTN_KEY];
            if (state && state.tracker === this) {
                state.tracker = undefined;
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
        this.lastCommitClick = -Infinity;
        this.lastSent = {};
        this.pagePath = null;
        this.pageEvents = 0;
        this.lastEvent = {};
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
        const layer = event.type;
        const logsEvents = layer === 'click' && this.eventsEnabled();
        if (!logsEvents && this.isKitSuppressed()) {
            return;
        }

        const t = Date.now();
        const pathname = window.location.pathname;
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
                } else if (layer === 'submit') {
                    kind = classifyIntentControl([target], pathname);
                } else {
                    const click = describeButtonClick(path);
                    if (click && logsEvents) {
                        this.logClick(click, t, pathname);
                    }
                    kind = classifyIntentControl(path, pathname);
                }
                if (kind) {
                    this.emit(kind, layer, t, pathname);
                }
            } catch (e) {
                this.log('[error] classification threw: ' + e);
            }
        }, 0);
    }

    // One event per identical button every second, and at most 50 per page.
    private logClick(click: IButtonClick, t: number, pathname: string): void {
        if (!this.eventsEnabled()) {
            return;
        }
        if (pathname !== this.pagePath) {
            this.pagePath = pathname;
            this.pageEvents = 0;
            this.lastEvent = {};
        }
        if (this.pageEvents >= PAGE_EVENT_LIMIT) {
            return;
        }
        const key = [
            click.label,
            click.ariaLabel,
            click.icon,
            click.element,
            click.type,
        ].join('|');
        const last = this.lastEvent[key];
        if (last !== undefined && t - last < EVENT_DEDUP_MS) {
            return;
        }
        this.lastEvent[key] = t;
        this.pageEvents++;

        // Restarts an expired session, as public logEvent() and page views do.
        this.mpInstance._SessionManager.resetSessionTimer();
        this.mpInstance._Events.logEvent(
            buildButtonClickEvent(click, pathname)
        );
    }

    private emit(
        kind: CheckoutIntentKind,
        layer: string,
        t: number,
        pathname: string
    ): void {
        if (this.isKitSuppressed()) {
            return;
        }
        if (kind === 'commit' && layer === 'click') {
            this.lastCommitClick = t;
        }

        const last = this.lastSent[kind];
        if (last && last.pathname === pathname && t - last.t < THROTTLE_MS) {
            return;
        }
        this.lastSent[kind] = { t, pathname };

        this.mpInstance._RoktManager.notifyCheckoutIntent(
            Object.freeze({ kind, t }),
            pathname
        );
    }

    // Events follow the SDK's opt-out like any other event.
    private eventsEnabled(): boolean {
        const store = this.mpInstance._Store;
        return !!store && store.isEnabled;
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
