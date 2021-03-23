import Types from './types';
import Constants from './constants';

var MessageType = Types.MessageType,
    ApplicationTransitionType = Types.ApplicationTransitionType;

export default function ServerModel(mpInstance) {
    var self = this;
    function convertCustomFlags(event, dto) {
        var valueArray = [];
        dto.flags = {};

        for (var prop in event.CustomFlags) {
            valueArray = [];

            if (event.CustomFlags.hasOwnProperty(prop)) {
                if (Array.isArray(event.CustomFlags[prop])) {
                    event.CustomFlags[prop].forEach(function(
                        customFlagProperty
                    ) {
                        if (
                            typeof customFlagProperty === 'number' ||
                            typeof customFlagProperty === 'string' ||
                            typeof customFlagProperty === 'boolean'
                        ) {
                            valueArray.push(customFlagProperty.toString());
                        }
                    });
                } else if (
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

    this.appendUserInfo = function(user, event) {
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
                    var userIdentity = {};
                    userIdentity.Identity = dtoUserIdentities[key];
                    userIdentity.Type = mpInstance._Helpers.parseNumber(key);
                    validUserIdentities.push(userIdentity);
                }
            }
        }
        event.UserIdentities = validUserIdentities;
    };

    function convertProductListToDTO(productList) {
        if (!productList) {
            return [];
        }

        return productList.map(function(product) {
            return convertProductToDTO(product);
        });
    }

    function convertProductToDTO(product) {
        return {
            id: mpInstance._Helpers.parseStringOrNumber(product.Sku),
            nm: mpInstance._Helpers.parseStringOrNumber(product.Name),
            pr: mpInstance._Helpers.parseNumber(product.Price),
            qt: mpInstance._Helpers.parseNumber(product.Quantity),
            br: mpInstance._Helpers.parseStringOrNumber(product.Brand),
            va: mpInstance._Helpers.parseStringOrNumber(product.Variant),
            ca: mpInstance._Helpers.parseStringOrNumber(product.Category),
            ps: mpInstance._Helpers.parseNumber(product.Position),
            cc: mpInstance._Helpers.parseStringOrNumber(product.CouponCode),
            tpa: mpInstance._Helpers.parseNumber(product.TotalAmount),
            attrs: product.Attributes,
        };
    }

    this.convertToConsentStateDTO = function(state) {
        if (!state) {
            return null;
        }
        var jsonObject = {};
        var gdprConsentState = state.getGDPRConsentState();
        if (gdprConsentState) {
            var gdpr = {};
            jsonObject.gdpr = gdpr;
            for (var purpose in gdprConsentState) {
                if (gdprConsentState.hasOwnProperty(purpose)) {
                    var gdprConsent = gdprConsentState[purpose];
                    jsonObject.gdpr[purpose] = {};
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

        return jsonObject;
    };

    this.createEventObject = function(event, user) {
        var uploadObject = {};
        var eventObject = {};
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
                    EventName: event.name || event.messageType,
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
            }

            eventObject.CurrencyCode = mpInstance._Store.currencyCode;
            var currentUser = user || mpInstance.Identity.getCurrentUser();
            self.appendUserInfo(currentUser, eventObject);

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

    this.convertEventToDTO = function(event) {
        var dto = {
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
            dto.lr = window.location.href || null;
            dto.attrs = null;
        }

        if (event.CustomFlags) {
            convertCustomFlags(event, dto);
        }

        if (event.EventDataType === MessageType.Commerce) {
            dto.cu = event.CurrencyCode;

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

        return dto;
    };
}
