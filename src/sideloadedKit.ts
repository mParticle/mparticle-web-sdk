import KitFilterHelper from './kitFilterHelper';
import {
    IFilteringConsentRuleValues,
    IFilteringEventAttributeValue,
    IFilteringUserAttributeValue,
    IKitFilterSettings,
} from './configAPIClient';
import { UnregisteredKit } from './forwarders.interfaces';
import { EventTypeEnum, IdentityType } from './types.interfaces';

export interface IMPSideloadedKit {
    kitInstance: UnregisteredKit;
    filterDictionary: IKitFilterSettings;

    addEventTypeFilter(eventType: EventTypeEnum): void;
    addEventNameFilter(eventType: EventTypeEnum, eventName: string): void;
    addEventAttributeFilter(
        eventType: EventTypeEnum,
        eventName: string,
        customAttributeKey: string
    ): void;
    addScreenNameFilter(screenName: string): void;
    addScreenAttributeFilter(screenName: string, screenAttribute: string): void;
    addUserIdentityFilter(userIdentity: IdentityType): void;
    addUserAttributeFilter(userAttributeKey: string): void;
}

// This constructor is necessary to be able ot call new on mParticle.SideloadedKit
// https://stackoverflow.com/questions/13407036/how-does-interfaces-with-construct-signatures-work
export interface IMPSideloadedKitConstructor {
    new(unregisteredKitInstance: UnregisteredKit): IMPSideloadedKit;
}

export default class MPSideloadedKit implements IMPSideloadedKit{
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

        // The below filtering members are optional, but we instantiate them
        // to simplify public method assignment
        filteringEventAttributeValue: {} as IFilteringEventAttributeValue,
        filteringUserAttributeValue: {} as IFilteringUserAttributeValue,
        filteringConsentRuleValues: {} as IFilteringConsentRuleValues,
    };

    constructor(unregisteredKitInstance: UnregisteredKit) {
        this.kitInstance = unregisteredKitInstance;
    }

    public addEventTypeFilter(eventType: EventTypeEnum): void {
        const hashedEventType = KitFilterHelper.hashEventType(eventType);
        this.filterDictionary.eventTypeFilters.push(hashedEventType);
    }

    public addEventNameFilter(
        eventType: EventTypeEnum,
        eventName: string
    ): void {
        const hashedEventName = KitFilterHelper.hashEventName(
            eventName,
            eventType
        );
        this.filterDictionary.eventNameFilters.push(hashedEventName);
    }

    public addEventAttributeFilter(
        eventType: EventTypeEnum,
        eventName: string,
        customAttributeKey: string
    ): void {
        const hashedEventAttribute = KitFilterHelper.hashEventAttributeKey(
            eventType,
            eventName,
            customAttributeKey
        );
        this.filterDictionary.attributeFilters.push(hashedEventAttribute);
    }

    public addScreenNameFilter(screenName: string): void {
        const hashedScreenName = KitFilterHelper.hashEventName(
            screenName,
            EventTypeEnum.Unknown
        );
        this.filterDictionary.screenNameFilters.push(hashedScreenName);
    }

    public addScreenAttributeFilter(
        screenName: string,
        screenAttribute: string
    ): void {
        const hashedScreenAttribute = KitFilterHelper.hashEventAttributeKey(
            EventTypeEnum.Unknown,
            screenName,
            screenAttribute
        );
        this.filterDictionary.screenAttributeFilters.push(
            hashedScreenAttribute
        );
    }

    public addUserIdentityFilter(userIdentity: IdentityType): void {
        const hashedIdentityType = KitFilterHelper.hashUserIdentity(
            userIdentity
        );
        this.filterDictionary.userIdentityFilters.push(hashedIdentityType);
    }

    public addUserAttributeFilter(userAttributeKey: string): void {
        const hashedUserAttributeKey = KitFilterHelper.hashUserAttribute(
            userAttributeKey
        );
        this.filterDictionary.userAttributeFilters.push(hashedUserAttributeKey);
    }
}
