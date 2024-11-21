import { generateHash, valueof } from "./utils";
// TODO: https://mparticle-eng.atlassian.net/browse/SQDSDKS-5381
import { EventType, IdentityType } from "./types";

export default class KitFilterHelper {
    static hashEventType(eventType: valueof<typeof EventType>): number {
        return generateHash(eventType as unknown as string);
    };

    static hashEventName(eventName: string, eventType: valueof<typeof EventType>): number {
        return generateHash(eventType + eventName);
    };

    static hashEventAttributeKey(eventType: valueof<typeof EventType>, eventName: string, customAttributeName: string): number {
        return generateHash(eventType + eventName + customAttributeName);
    }
    
    static hashUserAttribute(userAttributeKey: string): number {
        return generateHash(userAttributeKey);
    }

    // User Identities are not actually hashed, this method is named this way to
    // be consistent with the filter class. UserIdentityType is also a number
    static hashUserIdentity(userIdentity: typeof IdentityType): typeof IdentityType {
        return userIdentity;
    }

    static hashConsentPurpose(prefix: string, purpose: string){
        return generateHash(prefix + purpose)

    }

    // The methods below are for conditional forwarding, a type of filter
    // hashAttributeCondiitonalForwarding is used for both User and Event
    // attribute keys and attribute values
    // The backend returns the hashes as strings for conditional forwarding
    // but returns "regular" filters as arrays of numbers
    // See IFilteringEventAttributeValue in configApiClient.ts as an example
    static hashAttributeConditionalForwarding(attribute: string): string {
        return generateHash(attribute).toString();
    }

    static hashConsentPurposeConditionalForwarding(prefix: string, purpose: string): string {
        return this.hashConsentPurpose(prefix, purpose).toString();
    }
}