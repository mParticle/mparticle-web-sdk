import { Dictionary, valueof } from "./utils";
import { EventType, IdentityType } from "./types";
export default class KitFilterHelper {
    static hashEventType(eventType: valueof<typeof EventType>): number;
    static hashEventName(eventName: string, eventType: valueof<typeof EventType>): number;
    static hashEventAttributeKey(eventType: valueof<typeof EventType>, eventName: string, customAttributeName: string): number;
    static hashUserAttribute(userAttributeKey: string): number;
    static hashUserIdentity(userIdentity: typeof IdentityType): typeof IdentityType;
    static hashConsentPurpose(prefix: string, purpose: string): number;
    static hashAttributeConditionalForwarding(attribute: string): string;
    static hashConsentPurposeConditionalForwarding(prefix: string, purpose: string): string;
    static readonly filterUserAttributes: (userAttributes: Dictionary<string>, filterList: number[]) => Dictionary<string>;
    static readonly filterUserIdentities: (userIdentities: Dictionary<string>, filterList: number[]) => Dictionary<string>;
    static readonly isFilteredUserAttribute: (userAttributeKey: string, filterList: number[]) => boolean;
}
