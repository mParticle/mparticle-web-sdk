import { IKitFilterSettings } from './configAPIClient';
import { UnregisteredKit } from './forwarders.interfaces';
import { EventType, IdentityType } from './types';
import { valueof } from './utils';
export interface IMPSideloadedKit {
    kitInstance: UnregisteredKit;
    filterDictionary: IKitFilterSettings;
    addEventTypeFilter(eventType: valueof<typeof EventType>): void;
    addEventNameFilter(eventType: valueof<typeof EventType>, eventName: string): void;
    addEventAttributeFilter(eventType: valueof<typeof EventType>, eventName: string, customAttributeKey: string): void;
    addScreenNameFilter(screenName: string): void;
    addScreenAttributeFilter(screenName: string, screenAttribute: string): void;
    addUserIdentityFilter(userIdentity: typeof IdentityType): void;
    addUserAttributeFilter(userAttributeKey: string): void;
}
export interface IMPSideloadedKitConstructor {
    new (unregisteredKitInstance: UnregisteredKit): IMPSideloadedKit;
}
export default class MPSideloadedKit implements IMPSideloadedKit {
    kitInstance: UnregisteredKit;
    filterDictionary: IKitFilterSettings;
    constructor(unregisteredKitInstance: UnregisteredKit);
    addEventTypeFilter(eventType: valueof<typeof EventType>): void;
    addEventNameFilter(eventType: valueof<typeof EventType>, eventName: string): void;
    addEventAttributeFilter(eventType: valueof<typeof EventType>, eventName: string, customAttributeKey: string): void;
    addScreenNameFilter(screenName: string): void;
    addScreenAttributeFilter(screenName: string, screenAttribute: string): void;
    addUserIdentityFilter(userIdentity: typeof IdentityType): void;
    addUserAttributeFilter(userAttributeKey: string): void;
}
