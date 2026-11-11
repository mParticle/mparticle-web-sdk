import Types, { EventType } from './types';
import { inArray, valueof } from './utils';
import KitFilterHelper from './kitFilterHelper';
import { IKitFilterSettings } from './configAPIClient';
import type { SDKEvent } from './sdkRuntimeModels';
import type KitBlocker from './kitBlocking';

type ForwarderFilterConfig = Pick<
    IKitFilterSettings,
    | 'eventNameFilters'
    | 'eventTypeFilters'
    | 'screenNameFilters'
    | 'screenAttributeFilters'
    | 'attributeFilters'
    | 'userIdentityFilters'
    | 'filteringEventAttributeValue'
>;

const FORWARDING_RULE_MESSAGE_TYPES: number[] = [
    Types.MessageType.PageEvent,
    Types.MessageType.PageView,
    Types.MessageType.Commerce,
];

function inFilteredList(
    filterList: number[] | undefined,
    hash: number
): boolean {
    if (filterList && filterList.length) {
        return inArray(filterList, hash);
    }
    return false;
}

export function isBlockedByForwardingRule(
    messageType: number,
    attributes: Record<string, unknown> | null,
    forwarder: ForwarderFilterConfig
): boolean {
    if (
        !FORWARDING_RULE_MESSAGE_TYPES.includes(messageType) ||
        !forwarder.filteringEventAttributeValue ||
        !forwarder.filteringEventAttributeValue.eventAttributeName ||
        !forwarder.filteringEventAttributeValue.eventAttributeValue
    ) {
        return false;
    }

    let foundProp: { name: string; value: string } | null = null;

    if (attributes) {
        for (const prop in attributes) {
            if (attributes.hasOwnProperty(prop)) {
                const hashedName = KitFilterHelper.hashAttributeConditionalForwarding(
                    prop
                );

                if (
                    hashedName ===
                    forwarder.filteringEventAttributeValue.eventAttributeName
                ) {
                    foundProp = {
                        name: hashedName,
                        value: KitFilterHelper.hashAttributeConditionalForwarding(
                            attributes[prop] as string
                        ),
                    };
                    break;
                }
            }
        }
    }

    const isMatch =
        foundProp !== null &&
        foundProp.value ===
            forwarder.filteringEventAttributeValue.eventAttributeValue;

    const shouldInclude =
        forwarder.filteringEventAttributeValue.includeOnMatch === true
            ? isMatch
            : !isMatch;

    return !shouldInclude;
}

export function isBlockedByEventFilter(
    messageType: number,
    hashedEventName: number,
    hashedEventType: number,
    forwarder: ForwarderFilterConfig
): boolean {
    if (
        messageType === Types.MessageType.PageEvent &&
        (inFilteredList(forwarder.eventNameFilters, hashedEventName) ||
            inFilteredList(forwarder.eventTypeFilters, hashedEventType))
    ) {
        return true;
    } else if (
        messageType === Types.MessageType.Commerce &&
        inFilteredList(forwarder.eventTypeFilters, hashedEventType)
    ) {
        return true;
    } else if (
        messageType === Types.MessageType.PageView &&
        inFilteredList(forwarder.screenNameFilters, hashedEventName)
    ) {
        return true;
    }
    return false;
}

// sendEventToForwarders passes no kitBlocker: apiClient has already applied
// the data plan by then.
export function isEventForwarded(
    event: SDKEvent,
    forwarder: ForwarderFilterConfig,
    kitBlocker?: KitBlocker
): boolean {
    const plannedEvent =
        kitBlocker && kitBlocker.kitBlockingEnabled
            ? kitBlocker.createBlockedEvent(event)
            : event;
    if (!plannedEvent) {
        return false;
    }

    if (
        isBlockedByForwardingRule(
            plannedEvent.EventDataType,
            plannedEvent.EventAttributes,
            forwarder
        )
    ) {
        return false;
    }

    const eventCategory = plannedEvent.EventCategory as valueof<
        typeof EventType
    >;
    return !isBlockedByEventFilter(
        plannedEvent.EventDataType,
        KitFilterHelper.hashEventName(plannedEvent.EventName, eventCategory),
        KitFilterHelper.hashEventType(eventCategory),
        forwarder
    );
}

export function filterEventAttributes(
    messageType: number,
    eventCategory: number,
    eventName: string,
    attributes: Record<string, unknown> | null,
    forwarder: ForwarderFilterConfig
): Record<string, unknown> | null {
    if (!attributes) {
        return attributes;
    }

    let filterList: number[] | undefined;
    if (messageType === Types.MessageType.PageEvent) {
        filterList = forwarder.attributeFilters;
    } else if (messageType === Types.MessageType.PageView) {
        filterList = forwarder.screenAttributeFilters;
    }

    if (!filterList) {
        return attributes;
    }

    const filtered: Record<string, unknown> = {};
    for (const attrName in attributes) {
        if (attributes.hasOwnProperty(attrName)) {
            const hash = KitFilterHelper.hashEventAttributeKey(
                eventCategory as valueof<typeof EventType>,
                eventName,
                attrName
            );

            if (!inArray(filterList, hash)) {
                filtered[attrName] = attributes[attrName];
            }
        }
    }
    return filtered;
}

export function filterUserIdentities(
    userIdentities: Array<{ Type: number }> | undefined,
    filterList: number[]
): Array<{ Type: number }> {
    if (!userIdentities || !userIdentities.length) {
        return userIdentities || [];
    }

    return userIdentities.filter(function(userIdentity) {
        return !inArray(
            filterList,
            KitFilterHelper.hashUserIdentity(userIdentity.Type)
        );
    });
}
