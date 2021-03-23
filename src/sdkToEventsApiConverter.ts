import {
    SDKEvent,
    SDKConsentState,
    SDKGDPRConsentState,
    SDKGeoLocation,
    SDKCCPAConsentState,
    SDKProduct,
    SDKPromotion,
    SDKUserIdentity,
    SDKProductActionType,
    MParticleWebSDK,
    SDKIdentityTypeEnum,
} from './sdkRuntimeModels';
import * as EventsApi from '@mparticle/event-models';
import Types from './types';


export function convertEvents(
    mpid: string,
    sdkEvents: SDKEvent[],
    mpInstance: MParticleWebSDK
): EventsApi.Batch | null {
    if (!mpid) {
        return null;
    }
    if (!sdkEvents || sdkEvents.length < 1) {
        return null;
    }

    const uploadEvents: EventsApi.BaseEvent[] = [];
    let lastEvent: SDKEvent = null;
    for (const sdkEvent of sdkEvents) {
        if (sdkEvent) {
            lastEvent = sdkEvent;
            const baseEvent = convertEvent(sdkEvent);
            if (baseEvent) {
                uploadEvents.push(baseEvent);
            }
        }
    }

    if (!lastEvent) {
        return null;
    }

    const upload: EventsApi.Batch = {
        source_request_id: mpInstance._Helpers.generateUniqueId(),
        mpid,
        timestamp_unixtime_ms: new Date().getTime(),
        environment: lastEvent.Debug
            ? EventsApi.BatchEnvironmentEnum.development
            : EventsApi.BatchEnvironmentEnum.production,
        events: uploadEvents,
        mp_deviceid: lastEvent.DeviceId,
        sdk_version: lastEvent.SDKVersion,
        application_info: {
            application_version: lastEvent.AppVersion,
            application_name: lastEvent.AppName,
        },
        device_info: {
            platform: EventsApi.DeviceInformationPlatformEnum.web,
            screen_width: window.screen.width,
            screen_height: window.screen.height,
        },
        user_attributes: lastEvent.UserAttributes,
        user_identities: convertUserIdentities(lastEvent.UserIdentities),
        consent_state: convertConsentState(lastEvent.ConsentState),
        integration_attributes: lastEvent.IntegrationAttributes,
    };

    if (lastEvent.DataPlan && lastEvent.DataPlan.PlanId) {
        upload.context = {
            data_plan: {
                plan_id: lastEvent.DataPlan.PlanId,
                plan_version: lastEvent.DataPlan.PlanVersion || undefined,
            },
        };
    }
    return upload;
}

export function convertConsentState(
    sdkConsentState?: SDKConsentState
): EventsApi.ConsentState | null {
    if (!sdkConsentState) {
        return null;
    }
    const consentState: EventsApi.ConsentState = {
        gdpr: convertGdprConsentState(sdkConsentState.getGDPRConsentState()),
        ccpa: convertCcpaConsentState(sdkConsentState.getCCPAConsentState()),
    };
    return consentState;
}

export function convertGdprConsentState(
    sdkGdprConsentState: SDKGDPRConsentState
): { [key: string]: EventsApi.GDPRConsentState | null } {
    if (!sdkGdprConsentState) {
        return null;
    }
    const state: { [key: string]: EventsApi.GDPRConsentState } = {};
    for (const purpose in sdkGdprConsentState) {
        if (sdkGdprConsentState.hasOwnProperty(purpose)) {
            state[purpose] = {
                consented: sdkGdprConsentState[purpose].Consented,
                hardware_id: sdkGdprConsentState[purpose].HardwareId,
                document: sdkGdprConsentState[purpose].ConsentDocument,
                timestamp_unixtime_ms: sdkGdprConsentState[purpose].Timestamp,
                location: sdkGdprConsentState[purpose].Location,
            };
        }
    }
    return state;
}

export function convertCcpaConsentState(
    sdkCcpaConsentState: SDKCCPAConsentState
): { data_sale_opt_out: EventsApi.CCPAConsentState } {
    if (!sdkCcpaConsentState) {
        return null;
    }
    const state: { data_sale_opt_out: EventsApi.CCPAConsentState } = {
        data_sale_opt_out: {
            consented: sdkCcpaConsentState.Consented,
            hardware_id: sdkCcpaConsentState.HardwareId,
            document: sdkCcpaConsentState.ConsentDocument,
            timestamp_unixtime_ms: sdkCcpaConsentState.Timestamp,
            location: sdkCcpaConsentState.Location,
        },
    };

    return state;
}

export function convertUserIdentities(
    sdkUserIdentities?: SDKUserIdentity[]
): EventsApi.BatchUserIdentities | null {
    if (!sdkUserIdentities || !sdkUserIdentities.length) {
        return null;
    }
    const batchIdentities: EventsApi.BatchUserIdentities = {};
    for (const identity of sdkUserIdentities) {
        switch (identity.Type) {
            case Types.IdentityType.CustomerId:
                batchIdentities.customer_id = identity.Identity;
                break;
            case Types.IdentityType.Email:
                batchIdentities.email = identity.Identity;
                break;
            case Types.IdentityType.Facebook:
                batchIdentities.facebook = identity.Identity;
                break;
            case Types.IdentityType.FacebookCustomAudienceId:
                batchIdentities.facebook_custom_audience_id = identity.Identity;
                break;
            case Types.IdentityType.Google:
                batchIdentities.google = identity.Identity;
                break;
            case Types.IdentityType.Microsoft:
                batchIdentities.microsoft = identity.Identity;
                break;
            case Types.IdentityType.Other:
                batchIdentities.other = identity.Identity;
                break;
            case Types.IdentityType.Other2:
                batchIdentities.other_id_2 = identity.Identity;
                break;
            case Types.IdentityType.Other3:
                batchIdentities.other_id_3 = identity.Identity;
                break;
            case Types.IdentityType.Other4:
                batchIdentities.other_id_4 = identity.Identity;
                break;
            case Types.IdentityType.Other5:
                batchIdentities.other_id_5 = identity.Identity;
                break;
            case Types.IdentityType.Other6:
                batchIdentities.other_id_6 = identity.Identity;
                break;
            case Types.IdentityType.Other7:
                batchIdentities.other_id_7 = identity.Identity;
                break;
            case Types.IdentityType.Other8:
                batchIdentities.other_id_8 = identity.Identity;
                break;
            case Types.IdentityType.Other9:
                batchIdentities.other_id_9 = identity.Identity;
                break;
            case Types.IdentityType.Other10:
                batchIdentities.other_id_10 = identity.Identity;
                break;
            case Types.IdentityType.MobileNumber:
                batchIdentities.mobile_number = identity.Identity;
                break;
            case Types.IdentityType.PhoneNumber2:
                batchIdentities.phone_number_2 = identity.Identity;
                break;
            case Types.IdentityType.PhoneNumber3:
                batchIdentities.phone_number_3 = identity.Identity;
                break;
            default:
                break;
        }
    }
    return batchIdentities;
}
export function convertEvent(sdkEvent: SDKEvent): EventsApi.BaseEvent | null {
    if (!sdkEvent) {
        return null;
    }
    switch (sdkEvent.EventDataType) {
        case Types.MessageType.AppStateTransition:
            return convertAST(sdkEvent);
        case Types.MessageType.Commerce:
            return convertCommerceEvent(sdkEvent);
        case Types.MessageType.CrashReport:
            return convertCrashReportEvent(sdkEvent);
        case Types.MessageType.OptOut:
            return convertOptOutEvent(sdkEvent);
        case Types.MessageType.PageEvent:
            // Note: Media Events are also sent as PageEvents/CustomEvents
            return convertCustomEvent(sdkEvent);
        case Types.MessageType.PageView:
            return convertPageViewEvent(sdkEvent);
        case Types.MessageType.Profile:
            //deprecated and not supported by the web SDK
            return null;
        case Types.MessageType.SessionEnd:
            return convertSessionEndEvent(sdkEvent);
        case Types.MessageType.SessionStart:
            return convertSessionStartEvent(sdkEvent);
        case Types.MessageType.UserAttributeChange:
            return convertUserAttributeChangeEvent(sdkEvent);
        case Types.MessageType.UserIdentityChange:
            return convertUserIdentityChangeEvent(sdkEvent);
        default:
            break;
    }
    return null;
}

export function convertProductActionType(
    actionType: SDKProductActionType
): EventsApi.ProductActionActionEnum {
    if (!actionType) {
        return EventsApi.ProductActionActionEnum.unknown;
    }
    switch (actionType) {
        case SDKProductActionType.AddToCart:
            return EventsApi.ProductActionActionEnum.addToCart;
        case SDKProductActionType.AddToWishlist:
            return EventsApi.ProductActionActionEnum.addToWishlist;
        case SDKProductActionType.Checkout:
            return EventsApi.ProductActionActionEnum.checkout;
        case SDKProductActionType.CheckoutOption:
            return EventsApi.ProductActionActionEnum.checkoutOption;
        case SDKProductActionType.Click:
            return EventsApi.ProductActionActionEnum.click;
        case SDKProductActionType.Purchase:
            return EventsApi.ProductActionActionEnum.purchase;
        case SDKProductActionType.Refund:
            return EventsApi.ProductActionActionEnum.refund;
        case SDKProductActionType.RemoveFromCart:
            return EventsApi.ProductActionActionEnum.removeFromCart;
        case SDKProductActionType.RemoveFromWishlist:
            return EventsApi.ProductActionActionEnum.removeFromWishlist;
        case SDKProductActionType.ViewDetail:
            return EventsApi.ProductActionActionEnum.viewDetail;
        default:
            return EventsApi.ProductActionActionEnum.unknown;
    }
}

export function convertProductAction(
    sdkEvent: SDKEvent
): EventsApi.ProductAction | null {
    if (!sdkEvent.ProductAction) {
        return null;
    }
    const productAction: EventsApi.ProductAction = {
        action: convertProductActionType(
            sdkEvent.ProductAction.ProductActionType
        ),
        checkout_step: sdkEvent.ProductAction.CheckoutStep,
        checkout_options: sdkEvent.ProductAction.CheckoutOptions,
        transaction_id: sdkEvent.ProductAction.TransactionId,
        affiliation: sdkEvent.ProductAction.Affiliation,
        total_amount: sdkEvent.ProductAction.TotalAmount,
        tax_amount: sdkEvent.ProductAction.TaxAmount,
        shipping_amount: sdkEvent.ProductAction.ShippingAmount,
        coupon_code: sdkEvent.ProductAction.CouponCode,
        products: convertProducts(sdkEvent.ProductAction.ProductList),
    };
    return productAction;
}

export function convertProducts(
    sdkProducts: SDKProduct[]
): EventsApi.Product[] | null {
    if (!sdkProducts || !sdkProducts.length) {
        return null;
    }
    const products: EventsApi.Product[] = [];
    for (const sdkProduct of sdkProducts) {
        const product: EventsApi.Product = {
            id: sdkProduct.Sku,
            name: sdkProduct.Name,
            brand: sdkProduct.Brand,
            category: sdkProduct.Category,
            variant: sdkProduct.Variant,
            total_product_amount: sdkProduct.TotalAmount,
            position: sdkProduct.Position,
            price: sdkProduct.Price,
            quantity: sdkProduct.Quantity,
            coupon_code: sdkProduct.CouponCode,
            custom_attributes: sdkProduct.Attributes,
        };
        products.push(product);
    }
    return products;
}

export function convertPromotionAction(
    sdkEvent: SDKEvent
): EventsApi.PromotionAction | null {
    if (!sdkEvent.PromotionAction) {
        return null;
    }
    const promotionAction: EventsApi.PromotionAction = {
        action: sdkEvent.PromotionAction
            .PromotionActionType as EventsApi.PromotionActionActionEnum,
        promotions: convertPromotions(sdkEvent.PromotionAction.PromotionList),
    };
    return promotionAction;
}

export function convertPromotions(
    sdkPromotions: SDKPromotion[]
): EventsApi.Promotion[] | null {
    if (!sdkPromotions || !sdkPromotions.length) {
        return null;
    }
    const promotions: EventsApi.Promotion[] = [];
    for (const sdkPromotion of sdkPromotions) {
        const promotion: EventsApi.Promotion = {
            id: sdkPromotion.Id,
            name: sdkPromotion.Name,
            creative: sdkPromotion.Creative,
            position: sdkPromotion.Position,
        };
        promotions.push(promotion);
    }
    return promotions;
}

export function convertImpressions(
    sdkEvent: SDKEvent
): EventsApi.ProductImpression[] | null {
    if (!sdkEvent.ProductImpressions) {
        return null;
    }
    const impressions: EventsApi.ProductImpression[] = [];
    for (const sdkImpression of sdkEvent.ProductImpressions) {
        const impression: EventsApi.ProductImpression = {
            product_impression_list: sdkImpression.ProductImpressionList,
            products: convertProducts(sdkImpression.ProductList),
        };
        impressions.push(impression);
    }
    return impressions;
}

export function convertShoppingCart(
    sdkEvent: SDKEvent
): EventsApi.ShoppingCart | null {
    if (
        !sdkEvent.ShoppingCart ||
        !sdkEvent.ShoppingCart.ProductList ||
        !sdkEvent.ShoppingCart.ProductList.length
    ) {
        return null;
    }
    const shoppingCart: EventsApi.ShoppingCart = {
        products: convertProducts(sdkEvent.ShoppingCart.ProductList),
    };
    return shoppingCart;
}

export function convertCommerceEvent(
    sdkEvent: SDKEvent
): EventsApi.CommerceEvent {
    const commonEventData: EventsApi.CommonEventData = convertBaseEventData(
        sdkEvent
    );
    let commerceEventData: EventsApi.CommerceEventData = {
        custom_flags: sdkEvent.CustomFlags,
        product_action: convertProductAction(sdkEvent),
        promotion_action: convertPromotionAction(sdkEvent),
        product_impressions: convertImpressions(sdkEvent),
        shopping_cart: convertShoppingCart(sdkEvent),
        currency_code: sdkEvent.CurrencyCode,
    };

    commerceEventData = Object.assign(commerceEventData, commonEventData);
    return {
        event_type: EventsApi.EventTypeEnum.commerceEvent,
        data: commerceEventData,
    };
}
export function convertCrashReportEvent(
    sdkEvent: SDKEvent
): EventsApi.CrashReportEvent {
    const commonEventData: EventsApi.CommonEventData = convertBaseEventData(
        sdkEvent
    );
    let crashReportEventData: EventsApi.CrashReportEventData = {
        message: sdkEvent.EventName,
    };
    crashReportEventData = Object.assign(crashReportEventData, commonEventData);
    return {
        event_type: EventsApi.EventTypeEnum.crashReport,
        data: crashReportEventData,
    };
}

export function convertAST(
    sdkEvent: SDKEvent
): EventsApi.ApplicationStateTransitionEvent {
    const commonEventData: EventsApi.CommonEventData = convertBaseEventData(
        sdkEvent
    );
    let astEventData: EventsApi.ApplicationStateTransitionEventData = {
        application_transition_type:
            EventsApi
                .ApplicationStateTransitionEventDataApplicationTransitionTypeEnum
                .applicationInitialized,
        is_first_run: sdkEvent.IsFirstRun,
        is_upgrade: false,
    };
    astEventData = Object.assign(astEventData, commonEventData);
    return {
        event_type: EventsApi.EventTypeEnum.applicationStateTransition,
        data: astEventData,
    };
}

export function convertSessionEndEvent(
    sdkEvent: SDKEvent
): EventsApi.SessionEndEvent {
    const commonEventData: EventsApi.CommonEventData = convertBaseEventData(
        sdkEvent
    );
    let sessionEndEventData: EventsApi.SessionEndEventData = {
        session_duration_ms: sdkEvent.SessionLength,
        //note: External Events DTO does not support the session mpids array as of this time.
        //spanning_mpids: sdkEvent.SessionMpids
    };
    sessionEndEventData = Object.assign(sessionEndEventData, commonEventData);
    return {
        event_type: EventsApi.EventTypeEnum.sessionEnd,
        data: sessionEndEventData,
    };
}

export function convertSessionStartEvent(
    sdkEvent: SDKEvent
): EventsApi.SessionStartEvent {
    const commonEventData: EventsApi.CommonEventData = convertBaseEventData(
        sdkEvent
    );
    let sessionStartEventData: EventsApi.SessionStartEventData = {};
    sessionStartEventData = Object.assign(
        sessionStartEventData,
        commonEventData
    );
    return {
        event_type: EventsApi.EventTypeEnum.sessionStart,
        data: sessionStartEventData,
    };
}

export function convertPageViewEvent(
    sdkEvent: SDKEvent
): EventsApi.ScreenViewEvent {
    const commonEventData: EventsApi.CommonEventData = convertBaseEventData(
        sdkEvent
    );
    let screenViewEventData: EventsApi.ScreenViewEventData = {
        custom_flags: sdkEvent.CustomFlags,
        screen_name: sdkEvent.EventName,
    };
    screenViewEventData = Object.assign(screenViewEventData, commonEventData);
    return {
        event_type: EventsApi.EventTypeEnum.screenView,
        data: screenViewEventData,
    };
}

export function convertOptOutEvent(sdkEvent: SDKEvent): EventsApi.OptOutEvent {
    const commonEventData: EventsApi.CommonEventData = convertBaseEventData(
        sdkEvent
    );
    let optOutEventData: EventsApi.OptOutEventData = {
        is_opted_out: sdkEvent.OptOut,
    };
    optOutEventData = Object.assign(optOutEventData, commonEventData);
    return {
        event_type: EventsApi.EventTypeEnum.optOut,
        data: optOutEventData,
    };
}

export function convertCustomEvent(sdkEvent: SDKEvent): EventsApi.CustomEvent {
    const commonEventData: EventsApi.CommonEventData = convertBaseEventData(
        sdkEvent
    );
    let customEventData: EventsApi.CustomEventData = {
        custom_event_type: convertSdkEventType(
            sdkEvent.EventCategory
        ) as EventsApi.CustomEventDataCustomEventTypeEnum,
        custom_flags: sdkEvent.CustomFlags,
        event_name: sdkEvent.EventName,
    };
    customEventData = Object.assign(customEventData, commonEventData);
    return {
        event_type: EventsApi.EventTypeEnum.customEvent,
        data: customEventData,
    };
}

export function convertSdkEventType(
    sdkEventType: number
):
    | EventsApi.CustomEventDataCustomEventTypeEnum
    | EventsApi.CommerceEventDataCustomEventTypeEnum {
    switch (sdkEventType) {
        case Types.EventType.Other:
            return EventsApi.CustomEventDataCustomEventTypeEnum.other;
        case Types.EventType.Location:
            return EventsApi.CustomEventDataCustomEventTypeEnum.location;
        case Types.EventType.Navigation:
            return EventsApi.CustomEventDataCustomEventTypeEnum.navigation;
        case Types.EventType.Search:
            return EventsApi.CustomEventDataCustomEventTypeEnum.search;
        case Types.EventType.Social:
            return EventsApi.CustomEventDataCustomEventTypeEnum.social;
        case Types.EventType.Transaction:
            return EventsApi.CustomEventDataCustomEventTypeEnum.transaction;
        case Types.EventType.UserContent:
            return EventsApi.CustomEventDataCustomEventTypeEnum.userContent;
        case Types.EventType.UserPreference:
            return EventsApi.CustomEventDataCustomEventTypeEnum.userPreference;
        case Types.EventType.Media:
            return EventsApi.CustomEventDataCustomEventTypeEnum.media;
        case Types.CommerceEventType.ProductAddToCart:
            return EventsApi.CommerceEventDataCustomEventTypeEnum.addToCart;
        case Types.CommerceEventType.ProductAddToWishlist:
            return EventsApi.CommerceEventDataCustomEventTypeEnum.addToWishlist;
        case Types.CommerceEventType.ProductCheckout:
            return EventsApi.CommerceEventDataCustomEventTypeEnum.checkout;
        case Types.CommerceEventType.ProductCheckoutOption:
            return EventsApi.CommerceEventDataCustomEventTypeEnum
                .checkoutOption;
        case Types.CommerceEventType.ProductClick:
            return EventsApi.CommerceEventDataCustomEventTypeEnum.click;
        case Types.CommerceEventType.ProductImpression:
            return EventsApi.CommerceEventDataCustomEventTypeEnum.impression;
        case Types.CommerceEventType.ProductPurchase:
            return EventsApi.CommerceEventDataCustomEventTypeEnum.purchase;
        case Types.CommerceEventType.ProductRefund:
            return EventsApi.CommerceEventDataCustomEventTypeEnum.refund;
        case Types.CommerceEventType.ProductRemoveFromCart:
            return EventsApi.CommerceEventDataCustomEventTypeEnum
                .removeFromCart;
        case Types.CommerceEventType.ProductRemoveFromWishlist:
            return EventsApi.CommerceEventDataCustomEventTypeEnum
                .removeFromWishlist;
        case Types.CommerceEventType.ProductViewDetail:
            return EventsApi.CommerceEventDataCustomEventTypeEnum.viewDetail;
        case Types.CommerceEventType.PromotionClick:
            return EventsApi.CommerceEventDataCustomEventTypeEnum
                .promotionClick;
        case Types.CommerceEventType.PromotionView:
            return EventsApi.CommerceEventDataCustomEventTypeEnum.promotionView;

        default:
            return EventsApi.CustomEventDataCustomEventTypeEnum.unknown;
    }
}
export function convertBaseEventData(
    sdkEvent: SDKEvent
): EventsApi.CommonEventData {
    const commonEventData: EventsApi.CommonEventData = {
        timestamp_unixtime_ms: sdkEvent.Timestamp,
        session_uuid: sdkEvent.SessionId,
        session_start_unixtime_ms: sdkEvent.SessionStartDate,
        custom_attributes: sdkEvent.EventAttributes,
        location: convertSDKLocation(sdkEvent.Location),
        source_message_id: sdkEvent.SourceMessageId
    };

    return commonEventData;
}

export function convertSDKLocation(
    sdkEventLocation: SDKGeoLocation
): EventsApi.GeoLocation {
    if (sdkEventLocation && Object.keys(sdkEventLocation).length) {
        return {
            latitude: sdkEventLocation.lat,
            longitude: sdkEventLocation.lng,
        };
    }
    return null;
}

export function convertUserAttributeChangeEvent(
    sdkEvent: SDKEvent
): EventsApi.UserAttributeChangeEvent | null {
    const commonEventData: EventsApi.CommonEventData = convertBaseEventData(
        sdkEvent
    );
    let userAttributeChangeEvent: EventsApi.UserAttributeChangeEventData = {
        user_attribute_name: sdkEvent.UserAttributeChanges.UserAttributeName,
        new: sdkEvent.UserAttributeChanges.New,
        old: sdkEvent.UserAttributeChanges.Old,
        deleted: sdkEvent.UserAttributeChanges.Deleted,
        is_new_attribute: sdkEvent.UserAttributeChanges.IsNewAttribute,
    };

    userAttributeChangeEvent = {
        ...userAttributeChangeEvent,
        ...commonEventData,
    };

    return {
        event_type: EventsApi.EventTypeEnum.userAttributeChange,
        data: userAttributeChangeEvent,
    };
}

export function convertUserIdentityChangeEvent(
    sdkEvent: SDKEvent
): EventsApi.UserIdentityChangeEvent | null {
    const commonEventData: EventsApi.CommonEventData = convertBaseEventData(
        sdkEvent
    );

    let userIdentityChangeEvent: EventsApi.UserIdentityChangeEventData = {
        new: {
            identity_type: convertUserIdentityTypeToServerIdentityType(
                sdkEvent.UserIdentityChanges.New.IdentityType
            ),
            identity: sdkEvent.UserIdentityChanges.New.Identity || null,
            timestamp_unixtime_ms: sdkEvent.Timestamp,
            created_this_batch:
                sdkEvent.UserIdentityChanges.New.CreatedThisBatch,
        },
        old: {
            identity_type: convertUserIdentityTypeToServerIdentityType(
                sdkEvent.UserIdentityChanges.Old.IdentityType
            ),
            identity: sdkEvent.UserIdentityChanges.Old.Identity || null,
            timestamp_unixtime_ms: sdkEvent.Timestamp,
            created_this_batch:
                sdkEvent.UserIdentityChanges.Old.CreatedThisBatch,
        },
    };

    userIdentityChangeEvent = Object.assign(
        userIdentityChangeEvent,
        commonEventData
    );

    return {
        event_type: EventsApi.EventTypeEnum.userIdentityChange,
        data: userIdentityChangeEvent,
    };
}

export function convertUserIdentityTypeToServerIdentityType(
    identityType: SDKIdentityTypeEnum
): EventsApi.IdentityType {
    switch (identityType) {
        case SDKIdentityTypeEnum.other:
            return EventsApi.IdentityTypeEnum.other
        case SDKIdentityTypeEnum.customerId:
            return EventsApi.IdentityTypeEnum.customerId
        case SDKIdentityTypeEnum.facebook:
            return EventsApi.IdentityTypeEnum.facebook
        case SDKIdentityTypeEnum.twitter:
            return EventsApi.IdentityTypeEnum.twitter
        case SDKIdentityTypeEnum.google:
            return EventsApi.IdentityTypeEnum.google
        case SDKIdentityTypeEnum.microsoft:
            return EventsApi.IdentityTypeEnum.microsoft
        case SDKIdentityTypeEnum.yahoo:
            return EventsApi.IdentityTypeEnum.yahoo
        case SDKIdentityTypeEnum.email:
            return EventsApi.IdentityTypeEnum.email
        case SDKIdentityTypeEnum.alias:
            return EventsApi.IdentityTypeEnum.alias
        case SDKIdentityTypeEnum.facebookCustomAudienceId:
            return EventsApi.IdentityTypeEnum.facebookCustomAudienceId
        case SDKIdentityTypeEnum.otherId2:
            return EventsApi.IdentityTypeEnum.otherId2
        case SDKIdentityTypeEnum.otherId3:
            return EventsApi.IdentityTypeEnum.otherId3
        case SDKIdentityTypeEnum.otherId4:
            return EventsApi.IdentityTypeEnum.otherId4
        case SDKIdentityTypeEnum.otherId5:
            return EventsApi.IdentityTypeEnum.otherId5
        case SDKIdentityTypeEnum.otherId6:
            return EventsApi.IdentityTypeEnum.otherId6
        case SDKIdentityTypeEnum.otherId7:
            return EventsApi.IdentityTypeEnum.otherId7
        case SDKIdentityTypeEnum.otherId8:
            return EventsApi.IdentityTypeEnum.otherId8
        case SDKIdentityTypeEnum.otherId9:
            return EventsApi.IdentityTypeEnum.otherId9
        case SDKIdentityTypeEnum.otherId10:
            return EventsApi.IdentityTypeEnum.otherId10
        case SDKIdentityTypeEnum.mobileNumber:
            return EventsApi.IdentityTypeEnum.mobileNumber
        case SDKIdentityTypeEnum.phoneNumber2:
            return EventsApi.IdentityTypeEnum.phoneNumber2
        case SDKIdentityTypeEnum.phoneNumber3:
            return EventsApi.IdentityTypeEnum.phoneNumber3
    }
}
