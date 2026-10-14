export type ButtonElementKind = 'button' | 'input' | 'role' | 'wallet';
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
}
export declare function describeButtonClick(control: Element): IButtonClick | undefined;
