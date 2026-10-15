type HistoryMethodName = 'pushState' | 'replaceState';
export type RouteChangeSource = HistoryMethodName | 'popstate';
export type RouteChangeListener = (source: RouteChangeSource) => void;
export declare const supportsHistoryTracking: (win: Window | null) => boolean;
export declare const patchHistory: (onNavigate: RouteChangeListener, log: (message: string) => void) => (() => void) | null;
export declare const WIN_ROUTE_MONITOR_KEY = "__mpRouteMonitor__";
export declare const subscribeToRouteChange: (key: string, listener: RouteChangeListener, log?: (message: string) => void) => (() => void);
export declare const resetRouteChangeMonitor: () => void;
export {};
