import * as EventsApi from '@mparticle/event-models';
import { IKitFilterSettings } from './configAPIClient';
type ForwarderFilterConfig = Pick<IKitFilterSettings, 'eventNameFilters' | 'eventTypeFilters' | 'screenNameFilters' | 'screenAttributeFilters' | 'attributeFilters' | 'userIdentityFilters' | 'filteringEventAttributeValue'>;
export declare function isBlockedByForwardingRule(messageType: number, attributes: Record<string, unknown> | null, forwarder: ForwarderFilterConfig): boolean;
export declare function isBlockedByEventFilter(messageType: number, hashedEventName: number, hashedEventType: number, forwarder: ForwarderFilterConfig): boolean;
export declare function filterEventAttributes(messageType: number, eventCategory: number, eventName: string, attributes: Record<string, unknown> | null, forwarder: ForwarderFilterConfig): Record<string, unknown> | null;
export declare function filterUserIdentities(userIdentities: Array<{
    Type: number;
}> | undefined, filterList: number[]): Array<{
    Type: number;
}>;
export declare function isBatchEventAllowed(batchEvent: EventsApi.BaseEvent, forwarder: ForwarderFilterConfig): boolean;
export declare function filterBatchEventAttributes(batchEvent: EventsApi.BaseEvent, forwarder: ForwarderFilterConfig): void;
export declare function filterBatchIdentities(userIdentities: Record<string, unknown> | undefined, filterList: number[] | undefined): Record<string, unknown> | undefined;
export {};
