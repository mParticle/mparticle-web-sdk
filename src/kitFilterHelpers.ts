import { generateHash } from "./utils";
// TODO: EventType/EventTypeEnum exists in differnet forms between @types/eventmodel/dataplanningnode.  determine the differences and consolidate if possible
import { EventTypeEnum, IdentityType } from "./types.interfaces";
import { UserIdentityType } from "./forwarders.interfaces";


export default class KitFilterHelpers {
    // add generateHash function as a private member?
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

    // User Identities are not actually hashed, this method is named this way to
    // be consistent with the filter class. UserIdentityType is also a number
    static hashUserIdentity(userIdentity: IdentityType): IdentityType {
        return userIdentity;
    }

    static hashGDPRPurpose(purpose: string): number {
        const GDPRConsentHashPrefix = '1';

        return generateHash(GDPRConsentHashPrefix + purpose)
    }

    static hashCCPAPurpose(){
        const CCPAPurpose = 'data_sale_opt_out' as const;
        const CCPAHashPrefix = '2';

        return generateHash(CCPAHashPrefix + CCPAPurpose);
    }

    // Forwarding filters
    static hashEventAttributeKeyForForwarding(eventName: string): number {
        return generateHash(eventName);
    }
    static hashEventAttributeValueForForwarding(customAttributeName: string): number {
        return generateHash(customAttributeName);
    }
}