import { IKitFilterSettings } from '../configAPIClient';
import { isEventForwarded } from '../forwarder-utils';
import type KitBlocker from '../kitBlocking';
import KitFilterHelper from '../kitFilterHelper';
import { BaseEvent, SDKEvent } from '../sdkRuntimeModels';
import { EventType, MessageType } from '../types';
import { IButtonClick, pagePath } from './buttonDescription';

// Marks an automatically logged button click, like `is_auto_page_view`.
export const AUTO_BUTTON_ATTRIBUTE = 'is_auto_button_click';

// Specific enough not to merge with a customer's own 'Button Click' event.
export const BUTTON_CLICK_EVENT_NAME = 'Auto Button Click';

// Marks an automatically logged click on a link that leaves the page.
export const AUTO_LINK_ATTRIBUTE = 'is_auto_link_click';

export const LINK_CLICK_EVENT_NAME = 'Auto Link Click';

// The attributes both click events carry, with the page fields that auto page
// views carry. No intent: classifying clicks is left to whoever reads the data.
const clickAttributes = (
    click: IButtonClick,
    pathname: string
): { [key: string]: string | boolean } => {
    const data: { [key: string]: string | boolean } = {
        label_source: click.labelSource,
        element: click.element,
        type: click.type,
        path: pagePath(pathname),
        hostname: window.location.hostname,
    };
    // Optional fields are left out when the control has no safe value for them.
    const optional: { [key: string]: string | undefined } = {
        label: click.label,
        aria_label: click.ariaLabel,
        icon: click.icon,
        element_id: click.elementId,
        element_name: click.elementName,
        test_id: click.testId,
        controls: click.controls,
        form: click.form,
        group: click.group,
        link_type: click.linkType,
        link_domain: click.linkDomain,
        link_path: click.linkPath,
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
    return data;
};

// One custom event per button click, logged like logLink() with the auto marker.
export const buildButtonClickEvent = (
    click: IButtonClick,
    pathname: string
): BaseEvent => {
    const data = clickAttributes(click, pathname);
    data[AUTO_BUTTON_ATTRIBUTE] = true;
    return {
        messageType: MessageType.PageEvent,
        name: BUTTON_CLICK_EVENT_NAME,
        data,
        eventType: EventType.Other,
    };
};

// One custom event per click on a link that leaves the page. Typed Other, not
// Navigation, so no kit reads it as a page change. A plain link to another page
// of the site goes without its text, which can name the shopper ("Hi, Jane"), and
// with its destination path instead; a button or wallet acting as a link keeps
// its name.
export const buildLinkClickEvent = (
    click: IButtonClick,
    pathname: string
): BaseEvent => {
    const data = clickAttributes(
        click.linkType === 'internal' && click.element === 'link'
            ? {
                  ...click,
                  label: undefined,
                  labelSource: 'none',
                  ariaLabel: undefined,
              }
            : click,
        pathname
    );
    data[AUTO_LINK_ATTRIBUTE] = true;
    return {
        messageType: MessageType.PageEvent,
        name: LINK_CLICK_EVENT_NAME,
        data,
        eventType: EventType.Other,
    };
};

// Every attribute buildButtonClickEvent can set apart from the marker and the
// hostname, which is the same on every click on this page. A spec checks the
// two stay in step.
const CLICK_ATTRIBUTES = [
    'label_source',
    'element',
    'type',
    'path',
    'label',
    'aria_label',
    'icon',
    'element_id',
    'element_name',
    'test_id',
    'controls',
    'form',
    'group',
    'link_type',
    'link_domain',
    'link_path',
    'file_extension',
    'checked',
];

export type ButtonClickBlocker =
    | 'data plan'
    | 'forwarding rule'
    | 'event name filter'
    | 'event type filter';

// Which check keeps some or all auto button clicks, or auto link clicks with
// `link`, from a kit, or undefined when the kit receives every one. A forwarding
// rule on an attribute whose value differs between clicks lets some through and
// not others. Each other check goes through isEventForwarded on its own, so
// together they decide as it does for each click.
export const getButtonClickBlocker = (
    forwarder: IKitFilterSettings,
    kitBlocker?: KitBlocker,
    link = false
): ButtonClickBlocker | undefined => {
    const rule = forwarder.filteringEventAttributeValue;
    if (
        rule &&
        rule.eventAttributeValue &&
        CLICK_ATTRIBUTES.some(
            name =>
                KitFilterHelper.hashAttributeConditionalForwarding(name) ===
                rule.eventAttributeName
        )
    ) {
        return 'forwarding rule';
    }
    const attributes: { [key: string]: string | boolean } = {
        hostname: window.location.hostname,
    };
    attributes[link ? AUTO_LINK_ATTRIBUTE : AUTO_BUTTON_ATTRIBUTE] = true;
    const click = ({
        EventName: link ? LINK_CLICK_EVENT_NAME : BUTTON_CLICK_EVENT_NAME,
        EventCategory: EventType.Other,
        EventDataType: MessageType.PageEvent,
        EventAttributes: attributes,
    } as unknown) as SDKEvent;
    const checks: Array<[ButtonClickBlocker, Partial<IKitFilterSettings>]> = [
        ['data plan', {}],
        ['forwarding rule', { filteringEventAttributeValue: rule }],
        ['event name filter', { eventNameFilters: forwarder.eventNameFilters }],
        ['event type filter', { eventTypeFilters: forwarder.eventTypeFilters }],
    ];
    const failed = checks.find(
        ([, filters]) =>
            !isEventForwarded(click, filters as IKitFilterSettings, kitBlocker)
    );
    return failed ? failed[0] : undefined;
};
