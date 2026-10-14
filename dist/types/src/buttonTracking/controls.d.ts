export declare const CONTROL_SELECTOR = "button, input[type=\"submit\"], input[type=\"button\"], input[type=\"image\"], [role=\"button\"]";
export declare function hasComposedAncestor(element: Element, selector: string): boolean;
export declare function isRoktElement(element: Element): boolean;
export declare function isWalletElement(element: Element): boolean;
export declare function findControl(path: Array<EventTarget | null>): Element | undefined;
