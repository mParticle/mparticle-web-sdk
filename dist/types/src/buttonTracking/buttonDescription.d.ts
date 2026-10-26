export type ButtonElementKind = 'button' | 'input' | 'role' | 'wallet' | 'link';
export type LinkType = 'same_page' | 'internal' | 'outbound' | 'download';
export type ButtonLabelSource = 'labelledby' | 'aria' | 'text' | 'alt' | 'title' | 'value' | 'none';
export interface IButtonClick {
    label?: string;
    labelSource: ButtonLabelSource;
    ariaLabel?: string;
    icon?: string;
    elementId?: string;
    elementName?: string;
    testId?: string;
    controls?: string;
    form?: string;
    element: ButtonElementKind;
    type: string;
    linkType?: LinkType;
    linkDomain?: string;
    fileExtension?: string;
    checked?: boolean;
}
export declare function isLinkClick(click: IButtonClick): boolean;
export declare function describeButtonClick(control: Element, path?: Array<EventTarget | null>): IButtonClick | undefined;
export interface IPaymentChoice {
    radio: Element;
    names: string[];
}
export declare function describePaymentChoice(control: Element, path?: Array<EventTarget | null>): IPaymentChoice | undefined;
export declare function isPicked(radio: Element): boolean;
