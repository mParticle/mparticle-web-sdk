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
    element: ButtonElementKind;
    type: string;
}
export declare function describeButtonClick(path: Array<EventTarget | null>): IButtonClick | undefined;
