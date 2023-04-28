import { generateHash } from "./utils";
// TODO: EventType/EventTypeEnum exists in differnet forms between @types/eventmodel/dataplanningnode.  determine the differences and consolidate if possible
import { EventTypeEnum } from "./types.interfaces";

export default class FilterHashingUtilities {
    // add generateHash function as a private member
    static hashEventType(eventType: EventTypeEnum) {
        return generateHash(eventType);
    };

    static hashEventName(eventName: string, eventType: EventTypeEnum) {
        return generateHash(eventType + eventName);
    };

    static hashScreenName(screenName: string) {}
    static hashEventAttributeKey(eventType: EventTypeEnum, eventName: string, customAttributeName: string) {
        return generateHash(eventType + eventName + customAttributeName);
    }
    static hashEventAttributeKeyForForwarding(eventName: string) {
        return generateHash(eventName);
    }
    static hashEventAttributeValueForForwarding(customAttributeName: string) {
        return generateHash(customAttributeName);
    }
    static hashScreenAttribute(screenName: string, customAttributeKey: string) {}
    static hashUserIdentity(userIdentity){}
    static hashUserAttributeValue(userAttributeValue: string) {
        return generateHash(userAttributeValue);
    }
    static hashUserAttributeKey(userAttributeKey: string) {
        return generateHash(userAttributeKey);

    }
    static hashCommerceEventAttribute(eventType, eventAttributeKey: string) {}
    static hashCommerceEventEntityType(commerceEventKind){}
    static hashCommerceEventAppFamilyAttribute(attributeKey: string){}
}