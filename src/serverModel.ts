import Types from './types';
import Constants from './constants';
import {
    BaseEvent,
    MParticleUser,
    MParticleWebSDK,
    SDKConsentState,
    SDKEvent,
    SDKGeoLocation,
    SDKProduct,
    SDKUserIdentity,
} from './sdkRuntimeModels';
import { parseNumber, parseStringOrNumber, Dictionary } from './utils';
import { IStore } from './store';
import { MPID } from '@mparticle/web-sdk';

const MessageType = Types.MessageType;
const ApplicationTransitionType = Types.ApplicationTransitionType;

// TODO: Move to Consent Module
export interface PrivacyDTO {
    c: boolean; // Consented
    ts: number; // Timestamp
    d: string; // Document
    l: string; // Location
    h: string; // HardwareID
}

// TODO: Move to Consent Module
export interface GDPRConsentStateDTO {
    [key: string]: PrivacyDTO;
}

// TODO: Move to Consent Module
export interface CCPAConsentStateDTO {
    data_sale_opt_out: PrivacyDTO;
}

// TODO: Break this up into GDPR and CCPA interfaces
export interface ConsentStateDTO {
    gdpr?: GDPRConsentStateDTO;
    ccpa?: CCPAConsentStateDTO;
}

// TODO: Confirm which attributes are optional
export interface ServerDTO {
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
    ua?: Dictionary<string | string[]>;
    ui?: SDKUserIdentity[];
    ia?: Dictionary<Dictionary<string>>;
    str?: IStore;
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
    con?: ConsentStateDTO;
    fr?: boolean;
    iu?: boolean;
    at?: number;
    lr?: string;
    flags?: Dictionary<string[]>;
    cu?: string;
    sc?: {
        pl: ProductDTO[];
    };
    pd?: {
        an: number;
        cs: number;
        co: string;
        pl: ProductDTO[];
        ta: string;
        ti: string;
        tcc: string;
        tr: number;
        ts: number;
        tt: number;
    };
    pm?: {
        an: string;
        pl: PromotionDTO[];
    };
    pi?: ProductImpressionDTO[];
    pet?: number;
}

export interface ProductDTO {
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
    attrs: Record<string, string> | null;
}

export interface PromotionDTO {
    id: string | number;
    nm: string | number;
    ps: string | number;
    cr: string;
}

export interface ProductImpressionDTO {
    pil: string;
    pl: ProductDTO[];
}

export interface UploadObject extends SDKEvent {
    ClientGeneratedId: string;
    Store: IStore;
    ExpandedEventCount: number;
    ProfileMessageType: number;
}

export interface IServerModel {
    convertEventToDTO: (event: UploadObject) => ServerDTO;
    createEventObject: (event: BaseEvent, user?: MParticleUser) => SDKEvent;
    convertToConsentStateDTO: (state: SDKConsentState) => ConsentStateDTO;
    appendUserInfo: (user: MParticleUser, event: SDKEvent) => void;
}

// TODO: Make this a pure function that returns a new object
function convertCustomFlags(event: SDKEvent, dto: ServerDTO) {
    var valueArray: string[] = [];
    dto.flags = {};

    for (var prop in event.CustomFlags) {
        valueArray = [];

        if (event.CustomFlags.hasOwnProperty(prop)) {
            if (Array.isArray(event.CustomFlags[prop])) {
                event.CustomFlags[prop].forEach(function(customFlagProperty) {
                    // TODO: Can we use our utility functions here?
                    if (
                        typeof customFlagProperty === 'number' ||
                        typeof customFlagProperty === 'string' ||
                        typeof customFlagProperty === 'boolean'
                    ) {
                        valueArray.push(customFlagProperty.toString());
                    }
                });
            } else if (
                // TODO: Can we use our utility functions here?
                typeof event.CustomFlags[prop] === 'number' ||
                typeof event.CustomFlags[prop] === 'string' ||
                typeof event.CustomFlags[prop] === 'boolean'
            ) {
                valueArray.push(event.CustomFlags[prop].toString());
            }

            if (valueArray.length) {
                dto.flags[prop] = valueArray;
            }
        }
    }
}

function convertProductToDTO(product: SDKProduct): ProductDTO {
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
        attrs: product.Attributes,
    };
}

function convertProductListToDTO(productList: SDKProduct[]): ProductDTO[] {
    if (!productList) {
        return [];
    }

    return productList.map(function(product) {
        return convertProductToDTO(product);
    });
}

export default function ServerModel(
    this: IServerModel,
    mpInstance: MParticleWebSDK
) {
    var self = this;

    // TODO: Can we refactor this to not mutate the event?
    this.appendUserInfo = function(user: MParticleUser, event: SDKEvent): void {
        if (!event) {
            return;
        }
        if (!user) {
            event.MPID = null;
            event.ConsentState = null;
            event.UserAttributes = null;
            event.UserIdentities = null;
            return;
        }
        if (event.MPID && event.MPID === user.getMPID()) {
            return;
        }
        event.MPID = user.getMPID();
        event.ConsentState = user.getConsentState();
        event.UserAttributes = user.getAllUserAttributes();

        var userIdentities = user.getUserIdentities().userIdentities;
        var dtoUserIdentities = {};
        for (var identityKey in userIdentities) {
            var identityType = Types.IdentityType.getIdentityType(identityKey);
            if (identityType !== false) {
                dtoUserIdentities[identityType] = userIdentities[identityKey];
            }
        }

        var validUserIdentities = [];
        if (mpInstance._Helpers.isObject(dtoUserIdentities)) {
            if (Object.keys(dtoUserIdentities).length) {
                for (var key in dtoUserIdentities) {
                    var userIdentity: Partial<SDKUserIdentity> = {};
                    userIdentity.Identity = dtoUserIdentities[key];
                    userIdentity.Type = mpInstance._Helpers.parseNumber(key);
                    validUserIdentities.push(userIdentity);
                }
            }
        }
        event.UserIdentities = validUserIdentities;
    };

    this.convertToConsentStateDTO = function(
        state: SDKConsentState
    ): ConsentStateDTO {
        if (!state) {
            return null;
        }
        var jsonObject: ConsentStateDTO = {};
        var gdprConsentState = state.getGDPRConsentState();
        if (gdprConsentState) {
            var gdpr: GDPRConsentStateDTO = {};
            jsonObject.gdpr = gdpr;
            for (var purpose in gdprConsentState) {
                if (gdprConsentState.hasOwnProperty(purpose)) {
                    var gdprConsent = gdprConsentState[purpose];
                    jsonObject.gdpr[purpose] = {} as PrivacyDTO;
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

        return jsonObject as ConsentStateDTO;
    };

    this.createEventObject = function(
        event: BaseEvent,
        user?: MParticleUser
    ): SDKEvent | UploadObject {
        var uploadObject: Partial<UploadObject> = {};
        var eventObject: Partial<SDKEvent> = {};

        var optOut =
            event.messageType === Types.MessageType.OptOut
                ? !mpInstance._Store.isEnabled
                : null;

        if (
            mpInstance._Store.sessionId ||
            event.messageType == Types.MessageType.OptOut ||
            mpInstance._Store.webviewBridgeEnabled
        ) {
            if (event.hasOwnProperty('toEventAPIObject')) {
                eventObject = event.toEventAPIObject();
            } else {
                eventObject = {
                    // TODO: Do we need the number from the enum or the string it evaluates to?
                    EventName:
                        event.name ||
                        ((event.messageType as unknown) as string),
                    EventCategory: event.eventType,
                    EventAttributes: mpInstance._Helpers.sanitizeAttributes(
                        event.data,
                        event.name
                    ),
                    SourceMessageId:
                        event.sourceMessageId ||
                        mpInstance._Helpers.generateUniqueId(),
                    EventDataType: event.messageType,
                    CustomFlags: event.customFlags || {},
                    UserAttributeChanges: event.userAttributeChanges,
                    UserIdentityChanges: event.userIdentityChanges,
                };
            }

            if (event.messageType !== Types.MessageType.SessionEnd) {
                mpInstance._Store.dateLastEventSent = new Date();
            }

            uploadObject = {
                // TODO: Why are we passing Server Settings as Store?
                Store: (mpInstance._Store.serverSettings as unknown) as IStore,
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
                IntegrationAttributes: mpInstance._Store.integrationAttributes,
                CurrencyCode: mpInstance._Store.currencyCode,
                DataPlan: mpInstance._Store.SDKConfig.dataPlan
                    ? mpInstance._Store.SDKConfig.dataPlan
                    : {},
            };

            if (eventObject.EventDataType === MessageType.AppStateTransition) {
                eventObject.IsFirstRun = mpInstance._Store.isFirstRun;
                eventObject.LaunchReferral = window.location.href || null;
            }

            eventObject.CurrencyCode = mpInstance._Store.currencyCode;
            var currentUser = user || mpInstance.Identity.getCurrentUser();
            self.appendUserInfo(currentUser, eventObject as SDKEvent);

            if (event.messageType === Types.MessageType.SessionEnd) {
                eventObject.SessionLength =
                    mpInstance._Store.dateLastEventSent.getTime() -
                    mpInstance._Store.sessionStartDate.getTime();
                eventObject.currentSessionMPIDs =
                    mpInstance._Store.currentSessionMPIDs;
                eventObject.EventAttributes =
                    mpInstance._Store.sessionAttributes;

                mpInstance._Store.currentSessionMPIDs = [];
                mpInstance._Store.sessionStartDate = null;
            }

            uploadObject.Timestamp = mpInstance._Store.dateLastEventSent.getTime();

            return mpInstance._Helpers.extend({}, eventObject, uploadObject);
        }

        return null;
    };

    // TODO: Should this take an event or upload object?
    this.convertEventToDTO = function(event: UploadObject): ServerDTO {
        var dto: Partial<ServerDTO> = {
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

        var consent = self.convertToConsentStateDTO(event.ConsentState);
        if (consent) {
            dto.con = consent;
        }

        if (event.EventDataType === MessageType.AppStateTransition) {
            dto.fr = event.IsFirstRun;
            dto.iu = false;
            dto.at = ApplicationTransitionType.AppInit;
            dto.lr = event.LaunchReferral;
            dto.attrs = null;
        }

        if (event.CustomFlags) {
            convertCustomFlags(event, dto as ServerDTO);
        }

        if (event.EventDataType === MessageType.Commerce) {
            dto.cu = event.CurrencyCode;

            // TODO: If Cart is deprecated, we should deprecate this too
            if (event.ShoppingCart) {
                dto.sc = {
                    pl: convertProductListToDTO(event.ShoppingCart.ProductList),
                };
            }

            if (event.ProductAction) {
                dto.pd = {
                    an: event.ProductAction.ProductActionType,
                    cs: mpInstance._Helpers.parseNumber(
                        event.ProductAction.CheckoutStep
                    ),
                    co: event.ProductAction.CheckoutOptions,
                    pl: convertProductListToDTO(
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
                        pl: convertProductListToDTO(impression.ProductList),
                    };
                });
            }
        } else if (event.EventDataType === MessageType.Profile) {
            dto.pet = event.ProfileMessageType;
        }

        return dto as ServerDTO;
    };
}