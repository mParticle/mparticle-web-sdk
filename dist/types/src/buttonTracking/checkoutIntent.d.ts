export type CheckoutIntentKind = 'commit' | 'wallet' | 'checkout_step' | 'frame' | 'cart';
export type PaymentFrameFamily = 'apple_pay' | 'google_pay' | 'amazon_pay' | 'shop_pay' | 'card';
export type CheckoutIntentSource = 'vendor' | 'label' | 'brand' | 'frame' | 'submit' | 'name' | 'api';
export interface ICheckoutIntent {
    kind: Exclude<CheckoutIntentKind, 'frame'>;
    source: CheckoutIntentSource;
}
export declare function classifyIntent(control: Element, pathname: string): ICheckoutIntent | undefined;
export declare function classifyIntentControl(control: Element, pathname: string): Exclude<CheckoutIntentKind, 'frame'> | undefined;
export interface IPaymentFrame {
    kind: 'wallet' | 'frame';
    family?: PaymentFrameFamily;
}
export declare function classifyPaymentFrame(target: EventTarget | null, win: Window): IPaymentFrame | undefined;
