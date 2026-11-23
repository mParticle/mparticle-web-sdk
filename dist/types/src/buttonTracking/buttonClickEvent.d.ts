import { BaseEvent } from '../sdkRuntimeModels';
import { AUTO_BUTTON_ATTRIBUTE, AUTO_LINK_ATTRIBUTE, BUTTON_CLICK_EVENT_NAME, LINK_CLICK_EVENT_NAME } from '../autoClickNames';
import { IButtonClick } from './buttonDescription';
export { AUTO_BUTTON_ATTRIBUTE, AUTO_LINK_ATTRIBUTE, BUTTON_CLICK_EVENT_NAME, LINK_CLICK_EVENT_NAME, };
export declare const buildButtonClickEvent: (click: IButtonClick, pathname: string) => BaseEvent;
export declare const buildLinkClickEvent: (click: IButtonClick, pathname: string) => BaseEvent;
