export type CheckoutIntentKind = 'commit' | 'wallet' | 'checkout_step' | 'frame';
export declare function getIntentRouteClass(pathname: string): 'checkout_path' | 'other';
export declare function classifyIntentControl(path: Array<EventTarget | null>, pathname: string): CheckoutIntentKind | undefined;
export declare function classifyIntentFrame(target: EventTarget | null, win: Window): 'frame' | undefined;
