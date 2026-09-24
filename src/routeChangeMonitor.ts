type HistoryStateMethod = History['pushState'];
type HistoryMethodName = 'pushState' | 'replaceState';
export type RouteChangeSource = HistoryMethodName | 'popstate';
export type RouteChangeListener = (source: RouteChangeSource) => void;

const HISTORY_METHODS: HistoryMethodName[] = ['pushState', 'replaceState'];

const WRAPPED_MARKER = '__mpApvWrapped__';

type MarkedHistoryMethod = HistoryStateMethod & {
    [WRAPPED_MARKER]?: boolean;
};

export const supportsHistoryTracking = (win: Window | null): boolean =>
    !!win &&
    win.history !== undefined &&
    typeof win.history.pushState === 'function' &&
    typeof win.addEventListener === 'function';

// Wraps pushState/replaceState so `onNavigate` runs after the real method, and
// returns the single function that undoes it — or null when nothing was
// installed (history is already wrapped, or a frozen/sealed History rejected the
// assignment). Handing back one undo closure keeps the wrapper and original
// references out of the tracker entirely: there is no half-patched state for a
// caller to inspect, and no way to restore the wrong pair.
export const patchHistory = (
    onNavigate: RouteChangeListener,
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

// One History patch for the whole SDK. Page-view tracking and preselection both need to
// know about route changes, and each patching separately would stack wrappers on top of
// one another. Subscribers are independent: whether page views are emitted is the
// AutoLogPageView flag's business, not this module's.
const listeners = new Set<RouteChangeListener>();

let undoHistoryPatch: (() => void) | null = null;
let popStateListener: (() => void) | null = null;

const emit = (source: RouteChangeSource): void => {
    // Copied before iterating so a listener that unsubscribes during the fan-out does not
    // skip the next one.
    Array.from(listeners).forEach(listener => {
        try {
            listener(source);
        } catch (e) {
            // One subscriber must not stop the others, and must never break navigation.
        }
    });
};

const install = (log: (message: string) => void): void => {
    if (undoHistoryPatch || popStateListener) {
        return;
    }

    undoHistoryPatch = patchHistory(emit, log);
    popStateListener = (): void => emit('popstate');
    window.addEventListener('popstate', popStateListener);
};

const uninstall = (): void => {
    if (popStateListener) {
        window.removeEventListener('popstate', popStateListener);
        popStateListener = null;
    }

    if (undoHistoryPatch) {
        undoHistoryPatch();
        undoHistoryPatch = null;
    }
};

// Installs on the first subscriber and tears down after the last one leaves, so a
// workspace using neither page-view tracking nor preselection is never patched.
export const subscribeToRouteChange = (
    listener: RouteChangeListener,
    log: (message: string) => void = () => undefined
): (() => void) => {
    if (!supportsHistoryTracking(typeof window === 'undefined' ? null : window)) {
        return () => undefined;
    }

    listeners.add(listener);
    install(log);

    let unsubscribed = false;
    return (): void => {
        if (unsubscribed) {
            return;
        }

        unsubscribed = true;
        listeners.delete(listener);
        if (listeners.size === 0) {
            uninstall();
        }
    };
};

export const resetRouteChangeMonitor = (): void => {
    listeners.clear();
    uninstall();
};
