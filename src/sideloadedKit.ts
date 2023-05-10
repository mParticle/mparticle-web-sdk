import KitFilterHelper from './kitFilterHelper';
import { IKitFilterSettings } from './configAPIClient';
import { UnregisteredKit } from './forwarders.interfaces';
import { EventTypeEnum, IdentityType } from './types.interfaces';

/**
 */
export class MPSideloadedKit {
    public kitInstance: UnregisteredKit;
    public filterDictionary: IKitFilterSettings = {
        eventTypeFilters: [],
        eventNameFilters: [],
        screenNameFilters: [],
        screenAttributeFilters: [],
        userIdentityFilters: [],
        userAttributeFilters: [],
        attributeFilters: [],
        consentRegulationFilters: [],
        consentRegulationPurposeFilters: [],
        messageTypeFilters: [],
        messageTypeStateFilters: [],
        filteringEventAttributeValue: {},
        filteringUserAttributeValue: {},
        filteringConsentRuleValues: {},
    } as IKitFilterSettings;

    constructor(unregisteredKitInstance: UnregisteredKit) {
        this.kitInstance = unregisteredKitInstance;
    }

    public addEventTypeFilter(eventType: EventTypeEnum) {
        const hashedEventType  = KitFilterHelper.hashEventType(eventType);
        this.filterDictionary.eventTypeFilters.push(hashedEventType);
    }

    public addEventNameFilter(eventType: EventTypeEnum, eventName: string) {
        const hashedEventName  = KitFilterHelper.hashEventName(eventName, eventType);
        this.filterDictionary.eventNameFilters.push(hashedEventName);
    }
    
    public addEventAttributeFilter(eventType: EventTypeEnum, eventName: string, customAttributeKey: string) {
        const hashedEventAttribute  = KitFilterHelper.hashEventAttributeKey(eventType, eventName, customAttributeKey);
        this.filterDictionary.attributeFilters.push(hashedEventAttribute);
    }

    public addScreenNameFilter(screenName: string) {
        const hashedScreenName = KitFilterHelper.hashEventName(screenName, EventTypeEnum.Unknown);
        this.filterDictionary.screenNameFilters.push(hashedScreenName);
    }

    public addScreenAttributeFilter(screenName: string, screenAttribute: string) {
        const hashedScreenAttribute = KitFilterHelper.hashEventAttributeKey(EventTypeEnum.Unknown, screenName, screenAttribute);
        this.filterDictionary.screenAttributeFilters.push(hashedScreenAttribute);
    }

    public addUserIdentityFilter(userIdentity: IdentityType){
        const hashedIdentityType = KitFilterHelper.hashUserIdentity(userIdentity);
        this.filterDictionary.userIdentityFilters.push(hashedIdentityType);
    }

    public addUserAttributeFilter(userAttributeKey: string) {
        const hashedUserAttributeKey = KitFilterHelper.hashUserAttribute(userAttributeKey);
        this.filterDictionary.userAttributeFilters.push(hashedUserAttributeKey);
    }

    // public addCommerceEventAttributeFilter() {
    // }
}