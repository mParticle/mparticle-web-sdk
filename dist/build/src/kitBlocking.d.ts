import { SDKEvent, MParticleWebSDK, KitBlockerDataPlan } from './sdkRuntimeModels';
import { BaseEvent } from '@mparticle/event-models';
import { DataPlanPoint } from '@mparticle/data-planning-models';
export default class KitBlocker {
    dataPlanMatchLookups: {
        [key: string]: {};
    };
    blockEvents: boolean;
    blockEventAttributes: boolean;
    blockUserAttributes: boolean;
    blockUserIdentities: boolean;
    kitBlockingEnabled: boolean;
    mpInstance: MParticleWebSDK;
    constructor(dataPlan: KitBlockerDataPlan, mpInstance: MParticleWebSDK);
    addToMatchLookups(point: DataPlanPoint): void;
    generateMatchKey(match: any): string | null;
    generateProductAttributeMatchKey(match: any): string | null;
    getPlannedProperties(type: any, validator: any): boolean | {
        [key: string]: true;
    } | null;
    getProductProperties(type: any, validator: any): boolean | {
        [key: string]: true;
    } | null;
    getMatchKey(eventToMatch: BaseEvent): string | null;
    getProductAttributeMatchKey(eventToMatch: BaseEvent): string | null;
    createBlockedEvent(event: SDKEvent): SDKEvent;
    transformEventAndEventAttributes(event: SDKEvent): SDKEvent;
    transformProductAttributes(event: SDKEvent): SDKEvent;
    transformUserAttributes(event: SDKEvent): {
        DeviceId: string;
        IsFirstRun: boolean;
        EventName: string;
        EventCategory: number;
        UserAttributes?: {
            [key: string]: string | string[];
        };
        UserIdentities?: import("./sdkRuntimeModels").SDKUserIdentity[];
        SourceMessageId: string;
        MPID: string;
        EventAttributes?: {
            [key: string]: string;
        };
        SDKVersion: string;
        SessionId: string;
        SessionStartDate: number;
        SessionLength?: number;
        currentSessionMPIDs?: string[];
        Timestamp: number;
        EventDataType: number;
        Debug: boolean;
        Location?: import("./sdkRuntimeModels").SDKGeoLocation;
        OptOut?: boolean;
        CustomFlags?: {
            [key: string]: string;
        };
        AppVersion?: string;
        AppName?: string;
        Package?: string;
        ConsentState?: import("./sdkRuntimeModels").SDKConsentState;
        IntegrationAttributes?: {
            [key: string]: {
                [key: string]: string;
            };
        };
        ProductAction?: import("./sdkRuntimeModels").SDKProductAction;
        PromotionAction?: import("./sdkRuntimeModels").SDKPromotionAction;
        ProductImpressions?: import("./sdkRuntimeModels").SDKProductImpression[];
        ShoppingCart?: import("./sdkRuntimeModels").SDKShoppingCart;
        UserIdentityChanges?: import("./sdkRuntimeModels").SDKUserIdentityChangeData;
        UserAttributeChanges?: import("./sdkRuntimeModels").SDKUserAttributeChangeData;
        CurrencyCode: string;
        DataPlan?: import("./sdkRuntimeModels").SDKDataPlan;
        LaunchReferral?: string;
    };
    isAttributeKeyBlocked(key: string): boolean;
    isIdentityBlocked(key: string): boolean;
    transformUserIdentities(event: SDKEvent): {
        DeviceId: string;
        IsFirstRun: boolean;
        EventName: string;
        EventCategory: number;
        UserAttributes?: {
            [key: string]: string | string[];
        };
        UserIdentities?: import("./sdkRuntimeModels").SDKUserIdentity[];
        SourceMessageId: string;
        MPID: string;
        EventAttributes?: {
            [key: string]: string;
        };
        SDKVersion: string;
        SessionId: string;
        SessionStartDate: number;
        SessionLength?: number;
        currentSessionMPIDs?: string[];
        Timestamp: number;
        EventDataType: number;
        Debug: boolean;
        Location?: import("./sdkRuntimeModels").SDKGeoLocation;
        OptOut?: boolean;
        CustomFlags?: {
            [key: string]: string;
        };
        AppVersion?: string;
        AppName?: string;
        Package?: string;
        ConsentState?: import("./sdkRuntimeModels").SDKConsentState;
        IntegrationAttributes?: {
            [key: string]: {
                [key: string]: string;
            };
        };
        ProductAction?: import("./sdkRuntimeModels").SDKProductAction;
        PromotionAction?: import("./sdkRuntimeModels").SDKPromotionAction;
        ProductImpressions?: import("./sdkRuntimeModels").SDKProductImpression[];
        ShoppingCart?: import("./sdkRuntimeModels").SDKShoppingCart;
        UserIdentityChanges?: import("./sdkRuntimeModels").SDKUserIdentityChangeData;
        UserAttributeChanges?: import("./sdkRuntimeModels").SDKUserAttributeChangeData;
        CurrencyCode: string;
        DataPlan?: import("./sdkRuntimeModels").SDKDataPlan;
        LaunchReferral?: string;
    };
}
