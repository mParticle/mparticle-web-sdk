import { generateHash } from "./utils";
// TODO: EventType/EventTypeEnum exists in differnet forms between @types/eventmodel/dataplanningnode.  determine the differences and consolidate if possible
import { EventTypeEnum } from "./types.interfaces";

export default class FilterHashingUtilities {
    // add generateHash function as a private member
    static hashEventType(eventType: EventTypeEnum): number {
        return generateHash(eventType);
    };

    static hashEventName(eventName: string, eventType: EventTypeEnum): number {
        return generateHash(eventType + eventName);
    };

    static hashEventAttributeKey(eventType: EventTypeEnum, eventName: string, customAttributeName: string): number {
        return generateHash(eventType + eventName + customAttributeName);
    }
    
    static hashUserAttributeKey(userAttributeKey: string): number {
        return generateHash(userAttributeKey);
    }

    static hashUserAttributeValue(userAttributeValue: string): number {
        return generateHash(userAttributeValue);
    }

    static hashUserIdentity(userIdentity): number {
        return userIdentity;
    }

    // 
    // static hashScreenAttribute(screenName: string, customAttributeKey: string): number {}
    // static hashScreenName(screenName: string): number {}
    // static hashCommerceEventAttribute(eventType, eventAttributeKey: string): number {}
    // static hashCommerceEventEntityType(commerceEventKind): number {}
    // static hashCommerceEventAppFamilyAttribute(attributeKey: string): number {}

    // Forwarding filters
    static hashEventAttributeKeyForForwarding(eventName: string): number {
        return generateHash(eventName);
    }
    static hashEventAttributeValueForForwarding(customAttributeName: string): number {
        return generateHash(customAttributeName);
    }
}