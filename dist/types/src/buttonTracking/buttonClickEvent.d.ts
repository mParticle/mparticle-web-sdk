import { BaseEvent } from '../sdkRuntimeModels';
import { IButtonClick } from './buttonDescription';
export declare const AUTO_BUTTON_ATTRIBUTE = "is_auto_button_click";
export declare const BUTTON_CLICK_EVENT_NAME = "Auto Button Click";
export declare const buildButtonClickEvent: (click: IButtonClick, pathname: string) => BaseEvent;
