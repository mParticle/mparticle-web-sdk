import { generateHash } from "./utils";
// TODO: https://mparticle-eng.atlassian.net/browse/SQDSDKS-5381
import { EventTypeEnum, IdentityType } from "./types.interfaces";
import Constants from './constants';

const { CCPAPurpose } = Constants;


export default class KitFilterHelpers {
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