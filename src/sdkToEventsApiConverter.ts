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
        environment: lastEvent.Debug ? 'development' : 'production',
        events: uploadEvents,
        mp_deviceid: lastEvent.DeviceId,
        sdk_version: lastEvent.SDKVersion,
        application_info: {
            application_version: lastEvent.AppVersion,
            application_name: lastEvent.AppName,
        },
        device_info: {
            platform: 'web',
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

export function convertGdprConsentState(sdkGdprConsentState: {
    [key: string]: SDKGDPRConsentState;
}): { [key: string]: EventsApi.GDPRConsentState | null } {
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
    sdkCcpaConsentState: Record<string, SDKCCPAConsentState>
): Record<string, EventsApi.GDPRConsentState> {
    if (!sdkCcpaConsentState) {
        return null;
    }
    const state: { data_sale_opt_out: EventsApi.CCPAConsentState } = {
        data_sale_opt_out: null,
    };
    if (sdkCcpaConsentState.hasOwnProperty('data_sale_opt_out')) {
        state.data_sale_opt_out = {
            consented: sdkCcpaConsentState['data_sale_opt_out'].Consented,
            hardware_id: sdkCcpaConsentState['data_sale_opt_out'].HardwareId,
            document: sdkCcpaConsentState['data_sale_opt_out'].ConsentDocument,
            timestamp_unixtime_ms:
                sdkCcpaConsentState['data_sale_opt_out'].Timestamp,
            location: sdkCcpaConsentState['data_sale_opt_out'].Location,
        };
    }

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
                debugger;
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
        return 'unknown';
    }
    switch (actionType) {
        case SDKProductActionType.AddToCart:
            return 'add_to_cart';
        case SDKProductActionType.AddToWishlist:
            return 'add_to_wishlist';
        case SDKProductActionType.Checkout:
            return 'checkout';
        case SDKProductActionType.CheckoutOption:
            return 'checkout_option';
        case SDKProductActionType.Click:
            return 'click';
        case SDKProductActionType.Purchase:
            return 'purchase';
        case SDKProductActionType.Refund:
            return 'refund';
        case SDKProductActionType.RemoveFromCart:
            return 'remove_from_cart';
        case SDKProductActionType.RemoveFromWishlist:
            return 'remove_from_wish_list';
        case SDKProductActionType.ViewDetail:
            return 'view_detail';
        default:
            return 'unknown';
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
        event_type: 'commerce_event',
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
        event_type: 'crash_report',
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
        application_transition_type: 'application_initialized',
        is_first_run: sdkEvent.IsFirstRun,
        is_upgrade: false,
    };
    astEventData = Object.assign(astEventData, commonEventData);
    return {
        event_type: 'application_state_transition',
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
        event_type: 'session_end',
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
        event_type: 'session_start',
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
        event_type: 'screen_view',
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
        event_type: 'opt_out',
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
        event_type: 'custom_event',
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
            return 'other';
        case Types.EventType.Location:
            return 'location';
        case Types.EventType.Navigation:
            return 'navigation';
        case Types.EventType.Search:
            return 'search';
        case Types.EventType.Social:
            return 'social';
        case Types.EventType.Transaction:
            return 'transaction';
        case Types.EventType.UserContent:
            return 'user_content';
        case Types.EventType.UserPreference:
            return 'user_preference';
        case Types.CommerceEventType.ProductAddToCart:
            return 'add_to_cart';
        case Types.CommerceEventType.ProductAddToWishlist:
            return 'add_to_wishlist';
        case Types.CommerceEventType.ProductCheckout:
            return 'checkout';
        case Types.CommerceEventType.ProductCheckoutOption:
            return 'checkout_option';
        case Types.CommerceEventType.ProductClick:
            return 'click';
        case Types.CommerceEventType.ProductImpression:
            return 'impression';
        case Types.CommerceEventType.ProductPurchase:
            return 'purchase';
        case Types.CommerceEventType.ProductRefund:
            return 'refund';
        case Types.CommerceEventType.ProductRemoveFromCart:
            return 'remove_from_cart';
        case Types.CommerceEventType.ProductRemoveFromWishlist:
            return 'remove_from_wishlist';
        case Types.CommerceEventType.ProductViewDetail:
            return 'view_detail';
        case Types.CommerceEventType.PromotionClick:
            return 'promotion_click';
        case Types.CommerceEventType.PromotionView:
            return 'promotion_view';

        default:
            return 'unknown';
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
        event_type: 'user_attribute_change',
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
            identity_type: sdkEvent.UserIdentityChanges.New.IdentityType,
            identity: sdkEvent.UserIdentityChanges.New.Identity || null,
            timestamp_unixtime_ms: sdkEvent.Timestamp,
            created_this_batch:
                sdkEvent.UserIdentityChanges.New.CreatedThisBatch,
        },
        old: {
            identity_type: sdkEvent.UserIdentityChanges.Old.IdentityType,
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
        event_type: 'user_identity_change',
        data: userIdentityChangeEvent,
    };
}
