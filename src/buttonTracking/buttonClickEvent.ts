import { BaseEvent } from '../sdkRuntimeModels';
import { EventType, MessageType } from '../types';
import { IButtonClick } from './buttonDescription';

// Marks an automatically logged button click, like `is_auto_page_view`.
export const AUTO_BUTTON_ATTRIBUTE = 'is_auto_button_click';

// Specific enough not to merge with a customer's own 'Button Click' event.
export const BUTTON_CLICK_EVENT_NAME = 'Auto Button Click';

// One custom event per click, logged like logLink() with the auto marker and the
// page fields that auto page views carry. No intent: classifying clicks is left
// to whoever reads the data.
export const buildButtonClickEvent = (
    click: IButtonClick,
    pathname: string
): BaseEvent => {
    const data: { [key: string]: string | boolean } = {
        label_source: click.labelSource,
        element: click.element,
        type: click.type,
        path: pathname,
        hostname: window.location.hostname,
        [AUTO_BUTTON_ATTRIBUTE]: true,
    };
    if (click.label) {
        data.label = click.label;
    }
    if (click.ariaLabel) {
        data.aria_label = click.ariaLabel;
    }
    if (click.icon) {
        data.icon = click.icon;
    }
    if (click.elementId) {
        data.element_id = click.elementId;
    }
    if (click.elementName) {
        data.element_name = click.elementName;
    }
    if (click.testId) {
        data.test_id = click.testId;
    }
    return {
        messageType: MessageType.PageEvent,
        name: BUTTON_CLICK_EVENT_NAME,
        data,
        eventType: EventType.Other,
    };
};
