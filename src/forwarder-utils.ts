import Types, {
    EventType,
    getMessageTypeFromEventType,
    getIdentityTypeFromBatchKey,
} from './types';
import { inArray, valueof } from './utils';
import KitFilterHelper from './kitFilterHelper';
import * as EventsApi from '@mparticle/event-models';
import { IKitFilterSettings } from './configAPIClient';
import { SDKEvent } from './sdkRuntimeModels';
import {
    getEventNameFromBatchEvent,
    getEventCategoryFromBatchEvent,
} from './sdkToEventsApiConverter';

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

export function inFilteredList(
    filterList: number[] | undefined,
    hash: number
): boolean {
    if (filterList && filterList.length) {
        if (inArray(filterList, hash)) {
            return true;
        }
    }
    return false;
}

export function isBlockedByForwardingRule(
    messageType: number,
    attributes: Record<string, unknown> | null,
    forwarder: ForwarderFilterConfig
): boolean {
    if (
        FORWARDING_RULE_MESSAGE_TYPES.indexOf(messageType) === -1 ||
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
    event: SDKEvent,
    filterList: number[]
): void {
    if (event.UserIdentities && event.UserIdentities.length) {
        event.UserIdentities.forEach(function(
            userIdentity: { Type: number },
            i: number
        ) {
            if (
                inArray(
                    filterList,
                    KitFilterHelper.hashUserIdentity(userIdentity.Type)
                )
            ) {
                event.UserIdentities.splice(i, 1);

                if (i > 0) {
                    i--;
                }
            }
        });
    }
}

export function isBatchEventAllowed(
    batchEvent: EventsApi.BaseEvent,
    forwarder: ForwarderFilterConfig
): boolean {
    if (!batchEvent || !(batchEvent as any).data) {
        return true;
    }

    const messageType = getMessageTypeFromEventType(
        (batchEvent as any).event_type
    );
    const eventName = getEventNameFromBatchEvent(batchEvent);
    const eventCategory = getEventCategoryFromBatchEvent(batchEvent);

    if (
        isBlockedByForwardingRule(
            messageType,
            (batchEvent as any).data.custom_attributes,
            forwarder
        )
    ) {
        return false;
    }

    const hashedEventName = KitFilterHelper.hashEventName(
        eventName,
        eventCategory as valueof<typeof EventType>
    );
    const hashedEventType = KitFilterHelper.hashEventType(
        eventCategory as valueof<typeof EventType>
    );

    return !isBlockedByEventFilter(
        messageType,
        hashedEventName,
        hashedEventType,
        forwarder
    );
}

export function filterBatchEventAttributes(
    batchEvent: EventsApi.BaseEvent,
    forwarder: ForwarderFilterConfig
): void {
    if (!batchEvent || !(batchEvent as any).data) {
        return;
    }

    const messageType = getMessageTypeFromEventType(
        (batchEvent as any).event_type
    );
    const eventName = getEventNameFromBatchEvent(batchEvent);
    const eventCategory = getEventCategoryFromBatchEvent(batchEvent);

    (batchEvent as any).data.custom_attributes = filterEventAttributes(
        messageType,
        eventCategory,
        eventName,
        (batchEvent as any).data.custom_attributes,
        forwarder
    );
}

export function filterBatchIdentities(
    userIdentities: Record<string, unknown> | undefined,
    filterList: number[] | undefined
): Record<string, unknown> | undefined {
    if (!userIdentities || !filterList) {
        return userIdentities;
    }

    const filtered: Record<string, unknown> = {};
    for (const key in userIdentities) {
        if (userIdentities.hasOwnProperty(key)) {
            const identityType = getIdentityTypeFromBatchKey(key);

            if (
                identityType === -1 ||
                !inArray(filterList, identityType)
            ) {
                filtered[key] = userIdentities[key];
            }
        }
    }
    return filtered;
}
