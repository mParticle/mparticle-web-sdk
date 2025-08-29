// TODO: This file is no longer the server model because the web SDK payload
//       is now the server-to-server model.  We should rename this to
//       something more appropriate.

import Types from './types';
import Constants from './constants';
import {
    BaseEvent,
    SDKEvent,
    SDKEventCustomFlags,
    SDKGeoLocation,
    SDKProduct,
} from './sdkRuntimeModels';
import {
    parseNumber,
    parseStringOrNumber,
    Dictionary,
    isValidCustomFlagProperty,
} from './utils';
import { IntegrationAttributes, ServerSettings } from './store';
import { MPID } from '@mparticle/web-sdk';
import {
    IConsentStateV2DTO,
    IGDPRConsentStateV2DTO,
    IPrivacyV2DTO,
    SDKConsentState,
} from './consent';
import { IMParticleUser, ISDKUserIdentity } from './identity-user-interfaces';
import { IMParticleWebSDKInstance } from './mp-instance';
import { appendUserInfo } from './user-utils';

const MessageType = Types.MessageType;
const ApplicationTransitionType = Types.ApplicationTransitionType;

// TODO: Confirm which attributes are optional
export interface IServerV2DTO {
    id: string | number;
    nm: string | number;
    pr: number;
    qt: number;
    br: string | number;
    va: string | number;
    ca: string | number;
    ps: number;
    cc: string | number;
    attrs: Record<string, string> | null;
    dp_id?: string;
    dp_v?: number;
    n?: string;
    et?: number;

    // https://go.mparticle.com/work/SQDSDKS-5196
    ua?: Dictionary<string | string[]>;

    ui?: ISDKUserIdentity[];
    ia?: Dictionary<Dictionary<string>>;
    str?: ServerSettings;
    sdk?: string;
    sid?: string;
    sl?: number;
    ssd?: number;
    dt?: number;
    dbg?: boolean;
    ct?: number;
    lc?: SDKGeoLocation;
    o?: boolean;
    eec?: number;
    av?: string;
    cgid?: string;
    das?: string;
    mpid?: MPID;
    smpids?: MPID[];
    con?: IConsentStateV2DTO;
    fr?: boolean;
    iu?: boolean; // isUpgrade
    at?: number;
    lr?: string;
    flags?: Dictionary<string[]>;
    cu?: string;
    sc?: {
        pl: IProductV2DTO[];
    };
    pd?: {
        an: number;
        cs: number;
        co: string;
        pl: IProductV2DTO[];
        ta: string;
        ti: string;
        tcc: string;
        tr: number;
        ts: number;
        tt: number;
    };
    pm?: {
        an: string;
        pl: IPromotionV2DTO[];
    };
    pi?: IProductImpressionV2DTO[];
    pet?: number;
}

export interface IProductV2DTO {
    id: string | number;
    nm: string | number;
    pr: number;
    qt: number;
    br: string | number;
    va: string | number;
    ca: string | number;
    ps: number;
    cc: string | number;
    tpa: number;
    attrs: Dictionary<string> | null;
}

export interface IPromotionV2DTO {
    id: string | number;
    nm: string | number;
    ps: string | number;
    cr: string;
}

export interface IProductImpressionV2DTO {
    pil: string;
    pl: IProductV2DTO[];
}

export interface IUploadObject extends SDKEvent {
    // TODO: References to `ClientGeneratedId` can be removed when we remove the
    //       V2 event upload path because it does not exist in the V3 payload
    ClientGeneratedId: string;
    // FIXME: This reference to Store is misleading and can be removed whenever
    //        we deprecate v2 related code
    Store: ServerSettings;
    ExpandedEventCount: number;
    ProfileMessageType: number;
}

export interface IServerModel {
    convertEventToV2DTO: (event: IUploadObject) => IServerV2DTO;
    createEventObject: (event: BaseEvent, user?: IMParticleUser) => SDKEvent;
    convertToConsentStateV2DTO: (state: SDKConsentState) => IConsentStateV2DTO;
}

// TODO: Make this a pure function that returns a new object
function convertCustomFlags(event: SDKEvent, dto: IServerV2DTO) {
    var valueArray: string[] = [];
    dto.flags = {};

    for (var prop in event.CustomFlags) {
        valueArray = [];

        if (event.CustomFlags.hasOwnProperty(prop)) {
            if (Array.isArray(event.CustomFlags[prop])) {
                event.CustomFlags[prop].forEach(customFlagProperty => {
                    if (isValidCustomFlagProperty(customFlagProperty)) {
                        valueArray.push(customFlagProperty.toString());
                    }
                });
            } else if (isValidCustomFlagProperty(event.CustomFlags[prop])) {
                valueArray.push(event.CustomFlags[prop].toString());
            }

            if (valueArray.length) {
                dto.flags[prop] = valueArray;
            }
        }
    }
}

function convertProductToV2DTO(product: SDKProduct): IProductV2DTO {
    return {
        id: parseStringOrNumber(product.Sku),
        nm: parseStringOrNumber(product.Name),
        pr: parseNumber(product.Price),
        qt: parseNumber(product.Quantity),
        br: parseStringOrNumber(product.Brand),
        va: parseStringOrNumber(product.Variant),
        ca: parseStringOrNumber(product.Category),
        ps: parseNumber(product.Position),
        cc: parseStringOrNumber(product.CouponCode),
        tpa: parseNumber(product.TotalAmount),
        attrs: product.Attributes as Dictionary<string> | null,
    };
}

function convertProductListToV2DTO(productList: SDKProduct[]): IProductV2DTO[] {
    if (!productList) {
        return [];
    }

    return productList.map(function(product) {
        return convertProductToV2DTO(product);
    });
}

export default function ServerModel(
    this: IServerModel,
    mpInstance: IMParticleWebSDKInstance
) {
    var self = this;

    this.convertToConsentStateV2DTO = function(
        state: SDKConsentState
    ): IConsentStateV2DTO {
        if (!state) {
            return null;
        }
        var jsonObject: IConsentStateV2DTO = {};
        var gdprConsentState = state.getGDPRConsentState();
        if (gdprConsentState) {
            var gdpr: IGDPRConsentStateV2DTO = {};
            jsonObject.gdpr = gdpr;
            for (var purpose in gdprConsentState) {
                if (gdprConsentState.hasOwnProperty(purpose)) {
                    var gdprConsent = gdprConsentState[purpose];
                    jsonObject.gdpr[purpose] = {} as IPrivacyV2DTO;
                    if (typeof gdprConsent.Consented === 'boolean') {
                        gdpr[purpose].c = gdprConsent.Consented;
                    }
                    if (typeof gdprConsent.Timestamp === 'number') {
                        gdpr[purpose].ts = gdprConsent.Timestamp;
                    }
                    if (typeof gdprConsent.ConsentDocument === 'string') {
                        gdpr[purpose].d = gdprConsent.ConsentDocument;
                    }
                    if (typeof gdprConsent.Location === 'string') {
                        gdpr[purpose].l = gdprConsent.Location;
                    }
                    if (typeof gdprConsent.HardwareId === 'string') {
                        gdpr[purpose].h = gdprConsent.HardwareId;
                    }
                }
            }
        }

        var ccpaConsentState = state.getCCPAConsentState();
        if (ccpaConsentState) {
            jsonObject.ccpa = {
                data_sale_opt_out: {
                    c: ccpaConsentState.Consented,
                    ts: ccpaConsentState.Timestamp,
                    d: ccpaConsentState.ConsentDocument,
                    l: ccpaConsentState.Location,
                    h: ccpaConsentState.HardwareId,
                },
            };
        }

        return jsonObject as IConsentStateV2DTO;
    };

    this.createEventObject = function(
        event: BaseEvent,
        user?: IMParticleUser
    ): SDKEvent | IUploadObject {
        var uploadObject: Partial<IUploadObject> = {};
        var eventObject: Partial<SDKEvent> = {};

        //  The `optOut` variable is passed later in this method to the `uploadObject`
        //  so that it can be used to denote whether or not a user has "opted out" of being
        //  tracked. If this is an `optOut` Event, we set `optOut` to the inverse of the SDK's
        // `isEnabled` boolean which is controlled via `MPInstanceManager.setOptOut`.
        var optOut =
            event.messageType === Types.MessageType.OptOut
                ? !mpInstance._Store.isEnabled
                : null;

        // TODO: Why is Webview Bridge Enabled or Opt Out necessary here?
        if (
            mpInstance._Store.sessionId ||
            event.messageType === Types.MessageType.OptOut ||
            mpInstance._Store.webviewBridgeEnabled
        ) {
            let customFlags: SDKEventCustomFlags = {...event.customFlags};
            let integrationAttributes: IntegrationAttributes = mpInstance._Store.integrationAttributes;

            const { getFeatureFlag } = mpInstance._Helpers;
            // https://go.mparticle.com/work/SQDSDKS-5053
            // https://go.mparticle.com/work/SQDSDKS-7639
            const integrationSpecificIds = getFeatureFlag(Constants.FeatureFlags.CaptureIntegrationSpecificIds) as boolean;
            const integrationSpecificIdsV2 = ((getFeatureFlag(Constants.FeatureFlags.CaptureIntegrationSpecificIdsV2) as string) || '');
            const isIntegrationCaptureEnabled = (integrationSpecificIdsV2 ? integrationSpecificIdsV2 !== Constants.CaptureIntegrationSpecificIdsV2Modes.None : false) || (integrationSpecificIds === true);
            if (isIntegrationCaptureEnabled) {
                // Attempt to recapture click IDs in case a third party integration
                // has added or updated  new click IDs since the last event was sent.
                mpInstance._IntegrationCapture.capture();
                const transformedClickIDs = mpInstance._IntegrationCapture.getClickIdsAsCustomFlags();
                customFlags = { ...transformedClickIDs, ...customFlags };
                const transformedIntegrationAttributes = mpInstance._IntegrationCapture.getClickIdsAsIntegrationAttributes();
                integrationAttributes = { ...transformedIntegrationAttributes, ...integrationAttributes };
            }
            

            if (event.hasOwnProperty('toEventAPIObject')) {
                eventObject = event.toEventAPIObject();
            } else {
                eventObject = {
                    // This is an artifact from v2 events where SessionStart/End and AST event
                    //  names are numbers (1, 2, or 10), but going forward with v3, these lifecycle
                    //  events do not have names, but are denoted by their `event_type`
                    EventName:
                        event.name ||
                        ((event.messageType as unknown) as string),
                    EventCategory: event.eventType,
                    EventAttributes: mpInstance._Helpers.sanitizeAttributes(
                        event.data,
                        event.name
                    ),
                    ActiveTimeOnSite: mpInstance._timeOnSiteTimer?.getTimeInForeground(),
                    SourceMessageId:
                        event.sourceMessageId ||
                        mpInstance._Helpers.generateUniqueId(),
                    EventDataType: event.messageType,
                    CustomFlags: customFlags,
                    UserAttributeChanges: event.userAttributeChanges,
                    UserIdentityChanges: event.userIdentityChanges,
                };
            }

            // TODO: Should we move this side effect outside of this method?
            if (event.messageType !== Types.MessageType.SessionEnd) {
                mpInstance._Store.dateLastEventSent = new Date();
            }

            uploadObject = {
                // FIXME: Deprecate when we get rid of V2
                Store: mpInstance._Store.serverSettings,
                SDKVersion: Constants.sdkVersion,
                SessionId: mpInstance._Store.sessionId,
                SessionStartDate: mpInstance._Store.sessionStartDate
                    ? mpInstance._Store.sessionStartDate.getTime()
                    : 0,
                Debug: mpInstance._Store.SDKConfig.isDevelopmentMode,
                Location: mpInstance._Store.currentPosition,
                OptOut: optOut,
                ExpandedEventCount: 0,
                AppVersion: mpInstance.getAppVersion(),
                AppName: mpInstance.getAppName(),
                Package: mpInstance._Store.SDKConfig.package,
                ClientGeneratedId: mpInstance._Store.clientId,
                DeviceId: mpInstance._Store.deviceId,
                IntegrationAttributes: integrationAttributes, 
                CurrencyCode: mpInstance._Store.currencyCode,
                DataPlan: mpInstance._Store.SDKConfig.dataPlan
                    ? mpInstance._Store.SDKConfig.dataPlan
                    : {},
            };

            if (eventObject.EventDataType === MessageType.AppStateTransition) {
                eventObject.IsFirstRun = mpInstance._Store.isFirstRun;
                eventObject.LaunchReferral = window.location.href || null;
            }

            // FIXME: Remove duplicate occurence
            eventObject.CurrencyCode = mpInstance._Store.currencyCode;
            var currentUser = user || mpInstance.Identity.getCurrentUser();
            appendUserInfo(currentUser, eventObject as SDKEvent);

            if (event.messageType === Types.MessageType.SessionEnd) {
                eventObject.SessionLength =
                    mpInstance._Store.dateLastEventSent.getTime() -
                    mpInstance._Store.sessionStartDate.getTime();
                eventObject.currentSessionMPIDs =
                    mpInstance._Store.currentSessionMPIDs;

                // Session attributes are assigned on a session level, but only uploaded
                // when a session ends. As there is no way to attach event attributes to
                // a `SessionEnd` event, we are uploading the session level attributes
                // as event level attributes in a `SessionEnd` event.
                eventObject.EventAttributes =
                    mpInstance._Store.sessionAttributes;

                // TODO: We should move this out of here to avoid side effects
                mpInstance._Store.currentSessionMPIDs = [];
                mpInstance._Store.sessionStartDate = null;
            }

            uploadObject.Timestamp = mpInstance._Store.dateLastEventSent.getTime();

            return mpInstance._Helpers.extend({}, eventObject, uploadObject);
        }

        return null;
    };

    this.convertEventToV2DTO = function(event: IUploadObject): IServerV2DTO {
        var dto: Partial<IServerV2DTO> = {
            n: event.EventName,
            et: event.EventCategory,
            ua: event.UserAttributes,
            ui: event.UserIdentities,
            ia: event.IntegrationAttributes,
            str: event.Store,
            attrs: event.EventAttributes,
            sdk: event.SDKVersion,
            sid: event.SessionId,
            sl: event.SessionLength,
            ssd: event.SessionStartDate,
            dt: event.EventDataType,
            dbg: event.Debug,
            ct: event.Timestamp,
            lc: event.Location,
            o: event.OptOut,
            eec: event.ExpandedEventCount,
            av: event.AppVersion,
            cgid: event.ClientGeneratedId,
            das: event.DeviceId,
            mpid: event.MPID,
            smpids: event.currentSessionMPIDs,
        };

        if (event.DataPlan && event.DataPlan.PlanId) {
            dto.dp_id = event.DataPlan.PlanId;
            if (event.DataPlan.PlanVersion) {
                dto.dp_v = event.DataPlan.PlanVersion;
            }
        }

        var consent = self.convertToConsentStateV2DTO(event.ConsentState);
        if (consent) {
            dto.con = consent;
        }

        if (event.EventDataType === MessageType.AppStateTransition) {
            dto.fr = event.IsFirstRun;
            dto.iu = false;
            dto.at = ApplicationTransitionType.AppInit;
            dto.lr = event.LaunchReferral;

            // Nullify Attributes in case AST Was logged manually or
            // via logBaseEvent. AST should not have any attributes
            dto.attrs = null;
        }

        if (event.CustomFlags) {
            convertCustomFlags(event, dto as IServerV2DTO);
        }

        if (event.EventDataType === MessageType.Commerce) {
            dto.cu = event.CurrencyCode;

            // TODO: If Cart is deprecated, we should deprecate this too
            if (event.ShoppingCart) {
                dto.sc = {
                    pl: convertProductListToV2DTO(
                        event.ShoppingCart.ProductList
                    ),
                };
            }

            if (event.ProductAction) {
                dto.pd = {
                    an: event.ProductAction.ProductActionType,
                    cs: mpInstance._Helpers.parseNumber(
                        event.ProductAction.CheckoutStep
                    ),
                    co: event.ProductAction.CheckoutOptions,
                    pl: convertProductListToV2DTO(
                        event.ProductAction.ProductList
                    ),
                    ti: event.ProductAction.TransactionId,
                    ta: event.ProductAction.Affiliation,
                    tcc: event.ProductAction.CouponCode,
                    tr: mpInstance._Helpers.parseNumber(
                        event.ProductAction.TotalAmount
                    ),
                    ts: mpInstance._Helpers.parseNumber(
                        event.ProductAction.ShippingAmount
                    ),
                    tt: mpInstance._Helpers.parseNumber(
                        event.ProductAction.TaxAmount
                    ),
                };
            } else if (event.PromotionAction) {
                dto.pm = {
                    an: event.PromotionAction.PromotionActionType,
                    pl: event.PromotionAction.PromotionList.map(function(
                        promotion
                    ) {
                        return {
                            id: promotion.Id,
                            nm: promotion.Name,
                            cr: promotion.Creative,
                            ps: promotion.Position ? promotion.Position : 0,
                        };
                    }),
                };
            } else if (event.ProductImpressions) {
                dto.pi = event.ProductImpressions.map(function(impression) {
                    return {
                        pil: impression.ProductImpressionList,
                        pl: convertProductListToV2DTO(impression.ProductList),
                    };
                });
            }
        } else if (event.EventDataType === MessageType.Profile) {
            dto.pet = event.ProfileMessageType;
        }

        return dto as IServerV2DTO;
    };
}
