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

// One History patch for the whole SDK, so page-view tracking and preselection do not
// stack two wrappers.
//
// State lives on `window`, not module scope, because Next.js re-executes the bundle per
// SPA navigation while the patch from the previous execution stays installed.
export const WIN_ROUTE_MONITOR_KEY = '__mpRouteMonitor__';

interface IRouteMonitorState {
    listeners: Set<RouteChangeListener>;
    undoHistoryPatch: (() => void) | null;
    popStateListener: (() => void) | null;
}

type WindowWithRouteMonitor = Window & {
    [WIN_ROUTE_MONITOR_KEY]?: IRouteMonitorState;
};

const monitorState = (): IRouteMonitorState => {
    const win = window as WindowWithRouteMonitor;

    if (!win[WIN_ROUTE_MONITOR_KEY]) {
        win[WIN_ROUTE_MONITOR_KEY] = {
            listeners: new Set(),
            undoHistoryPatch: null,
            popStateListener: null,
        };
    }

    return win[WIN_ROUTE_MONITOR_KEY] as IRouteMonitorState;
};

// Reads the shared state at call time, so a wrapper installed by a previous bundle
// execution still reaches the current listeners.
const emit = (source: RouteChangeSource): void => {
    // Copied before iterating so a listener that unsubscribes during the fan-out does not
    // skip the next one.
    Array.from(monitorState().listeners).forEach(listener => {
        try {
            listener(source);
        } catch (e) {
            // One subscriber must not stop the others, and must never break navigation.
        }
    });
};

const install = (
    state: IRouteMonitorState,
    log: (message: string) => void
): void => {
    if (state.undoHistoryPatch || state.popStateListener) {
        return;
    }

    state.undoHistoryPatch = patchHistory(emit, log);
    state.popStateListener = (): void => emit('popstate');
    window.addEventListener('popstate', state.popStateListener);
};

const uninstall = (state: IRouteMonitorState): void => {
    if (state.popStateListener) {
        window.removeEventListener('popstate', state.popStateListener);
        state.popStateListener = null;
    }

    if (state.undoHistoryPatch) {
        state.undoHistoryPatch();
        state.undoHistoryPatch = null;
    }
};

// Installs on the first subscriber and tears down after the last leaves, so a workspace
// that needs neither is never patched.
export const subscribeToRouteChange = (
    listener: RouteChangeListener,
    log: (message: string) => void = () => undefined
): (() => void) => {
    if (!supportsHistoryTracking(typeof window === 'undefined' ? null : window)) {
        return () => undefined;
    }

    const state = monitorState();

    state.listeners.add(listener);
    install(state, log);

    let unsubscribed = false;
    return (): void => {
        if (unsubscribed) {
            return;
        }

        unsubscribed = true;
        state.listeners.delete(listener);

        if (state.listeners.size === 0) {
            uninstall(state);
        }
    };
};

export const resetRouteChangeMonitor = (): void => {
    if (typeof window === 'undefined') {
        return;
    }

    const state = monitorState();
    state.listeners.clear();
    uninstall(state);
    delete (window as WindowWithRouteMonitor)[WIN_ROUTE_MONITOR_KEY];
};
