export type CheckoutIntentKind = 'commit' | 'wallet' | 'checkout_step' | 'frame';
export declare function classifyIntentControl(control: Element, pathname: string): Exclude<CheckoutIntentKind, 'frame'> | undefined;
export declare function classifyIntentFrame(target: EventTarget | null, win: Window): 'frame' | undefined;
