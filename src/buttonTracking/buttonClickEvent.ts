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
    // Optional fields are left out when the button has no safe value for them.
    const optional: { [key: string]: string | undefined } = {
        label: click.label,
        aria_label: click.ariaLabel,
        icon: click.icon,
        element_id: click.elementId,
        element_name: click.elementName,
        test_id: click.testId,
        controls: click.controls,
        form: click.form,
        link_type: click.linkType,
        link_domain: click.linkDomain,
        file_extension: click.fileExtension,
    };
    for (const key of Object.keys(optional)) {
        if (optional[key]) {
            data[key] = optional[key];
        }
    }
    return {
        messageType: MessageType.PageEvent,
        name: BUTTON_CLICK_EVENT_NAME,
        data,
        eventType: EventType.Other,
    };
};
