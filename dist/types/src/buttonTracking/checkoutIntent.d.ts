export type CheckoutIntentKind = 'commit' | 'wallet' | 'checkout_step' | 'frame' | 'cart';
export type CheckoutIntentSource = 'vendor' | 'label' | 'brand' | 'frame' | 'submit' | 'name' | 'api';
export interface ICheckoutIntent {
    kind: Exclude<CheckoutIntentKind, 'frame'>;
    source: CheckoutIntentSource;
}
export declare function classifyIntent(control: Element, pathname: string): ICheckoutIntent | undefined;
export declare function classifyIntentControl(control: Element, pathname: string): Exclude<CheckoutIntentKind, 'frame'> | undefined;
export declare function classifyIntentFrame(target: EventTarget | null, win: Window): 'wallet' | 'frame' | undefined;
