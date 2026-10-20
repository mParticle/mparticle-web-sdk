import { IKitFilterSettings } from '../configAPIClient';
import { isEventForwarded } from '../forwarder-utils';
import type KitBlocker from '../kitBlocking';
import KitFilterHelper from '../kitFilterHelper';
import { BaseEvent, SDKEvent } from '../sdkRuntimeModels';
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
    if (click.checked !== undefined) {
        data.checked = click.checked;
    }
    return {
        messageType: MessageType.PageEvent,
        name: BUTTON_CLICK_EVENT_NAME,
        data,
        eventType: EventType.Other,
    };
};

// Whether a kit receives every auto button click. Only the marker is the same
// on every click, so a forwarding rule on any other attribute lets some clicks
// through and not others, and counts as not receiving them.
export const isButtonClickForwarded = (
    forwarder: IKitFilterSettings,
    kitBlocker?: KitBlocker
): boolean => {
    const rule = forwarder.filteringEventAttributeValue;
    if (
        rule &&
        rule.eventAttributeName &&
        rule.eventAttributeName !==
            KitFilterHelper.hashAttributeConditionalForwarding(
                AUTO_BUTTON_ATTRIBUTE
            )
    ) {
        return false;
    }
    return isEventForwarded(
        ({
            EventName: BUTTON_CLICK_EVENT_NAME,
            EventCategory: EventType.Other,
            EventDataType: MessageType.PageEvent,
            EventAttributes: { [AUTO_BUTTON_ATTRIBUTE]: true },
        } as unknown) as SDKEvent,
        forwarder,
        kitBlocker
    );
};
