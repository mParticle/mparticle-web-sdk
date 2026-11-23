import { IKitFilterSettings } from './configAPIClient';
import { isEventForwarded } from './forwarder-utils';
import type KitBlocker from './kitBlocking';
import KitFilterHelper from './kitFilterHelper';
import { SDKEvent } from './sdkRuntimeModels';
import { EVENT_TYPE_OTHER, MESSAGE_TYPE_PAGE_EVENT } from './eventTypeIds';
import {
    AUTO_BUTTON_ATTRIBUTE,
    AUTO_LINK_ATTRIBUTE,
    BUTTON_CLICK_EVENT_NAME,
    LINK_CLICK_EVENT_NAME,
} from './autoClickNames';

// Every attribute buildButtonClickEvent (in buttonTracking/buttonClickEvent.ts)
// can set apart from the marker and the hostname, which is the same on every
// click on this page. A spec checks the two stay in step.
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
        EventCategory: EVENT_TYPE_OTHER,
        EventDataType: MESSAGE_TYPE_PAGE_EVENT,
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
