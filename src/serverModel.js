var Types = require('./types'),
    MessageType = Types.MessageType,
    ApplicationTransitionType = Types.ApplicationTransitionType,
    Constants = require('./constants'),
    Helpers = require('./helpers'),
    parseNumber = require('./helpers').parseNumber;

function convertCustomFlags(event, dto) {
    var valueArray = [];
    dto.flags = {};

    for (var prop in event.CustomFlags) {
        valueArray = [];

        if (event.CustomFlags.hasOwnProperty(prop)) {
            if (Array.isArray(event.CustomFlags[prop])) {
                event.CustomFlags[prop].forEach(function(customFlagProperty) {
                    if (typeof customFlagProperty === 'number'
                    || typeof customFlagProperty === 'string'
                    || typeof customFlagProperty === 'boolean') {
                        valueArray.push(customFlagProperty.toString());
                    }
                });
            }
            else if (typeof event.CustomFlags[prop] === 'number'
            || typeof event.CustomFlags[prop] === 'string'
            || typeof event.CustomFlags[prop] === 'boolean') {
                valueArray.push(event.CustomFlags[prop].toString());
            }

            if (valueArray.length) {
                dto.flags[prop] = valueArray;
            }
        }
    }
}

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
        id: Helpers.parseStringOrNumber(product.Sku),
        nm: Helpers.parseStringOrNumber(product.Name),
        pr: parseNumber(product.Price),
        qt: parseNumber(product.Quantity),
        br: Helpers.parseStringOrNumber(product.Brand),
        va: Helpers.parseStringOrNumber(product.Variant),
        ca: Helpers.parseStringOrNumber(product.Category),
        ps: parseNumber(product.Position),
        cc: Helpers.parseStringOrNumber(product.CouponCode),
        tpa: parseNumber(product.TotalAmount),
        attrs: product.Attributes
    };
}

function convertToConsentStateDTO(state) {
    if (!state) {
        return null;
    }
    var jsonObject = {};
    var gdprConsentState = state.getGDPRConsentState();
    if (gdprConsentState) {
        var gdpr = {};
        jsonObject.gdpr = gdpr;
        for (var purpose in gdprConsentState){
            if (gdprConsentState.hasOwnProperty(purpose)) {
                var gdprConsent = gdprConsentState[purpose];
                jsonObject.gdpr[purpose] = {};
                if (typeof(gdprConsent.Consented) === 'boolean') {
                    gdpr[purpose].c = gdprConsent.Consented;
                }
                if (typeof(gdprConsent.Timestamp) === 'number') {
                    gdpr[purpose].ts = gdprConsent.Timestamp;
                }
                if (typeof(gdprConsent.ConsentDocument) === 'string') {
                    gdpr[purpose].d = gdprConsent.ConsentDocument;
                }
                if (typeof(gdprConsent.Location) === 'string') {
                    gdpr[purpose].l = gdprConsent.Location;
                }
                if (typeof(gdprConsent.HardwareId) === 'string') {
                    gdpr[purpose].h = gdprConsent.HardwareId;
                }
            }
        }
    }

    return jsonObject;
}

function createEventObject(messageType, name, data, eventType, customFlags) {
    var eventObject,
        dtoUserIdentities = {},
        currentUser = mParticle.Identity.getCurrentUser(),
        userIdentities = currentUser ? currentUser.getUserIdentities().userIdentities : {},
        optOut = (messageType === Types.MessageType.OptOut ? !mParticle.Store.isEnabled : null);

    data = Helpers.sanitizeAttributes(data);

    if (mParticle.Store.sessionId || messageType == Types.MessageType.OptOut || mParticle.Store.webviewBridgeEnabled) {
        for (var identityKey in userIdentities) {
            dtoUserIdentities[Types.IdentityType.getIdentityType(identityKey)] = userIdentities[identityKey];
        }

        if (messageType !== Types.MessageType.SessionEnd) {
            mParticle.Store.dateLastEventSent = new Date();
        }
        eventObject = {
            EventName: name || messageType,
            EventCategory: eventType,
            UserAttributes: currentUser ? currentUser.getAllUserAttributes() : {},
            UserIdentities: dtoUserIdentities,
            Store: mParticle.Store.serverSettings,
            EventAttributes: data,
            SDKVersion: Constants.sdkVersion,
            SessionId: mParticle.Store.sessionId,
            EventDataType: messageType,
            Debug: mParticle.preInit.isDevelopmentMode,
            Location: mParticle.Store.currentPosition,
            OptOut: optOut,
            ExpandedEventCount: 0,
            CustomFlags: customFlags,
            AppVersion: mParticle.Store.SDKConfig.appVersion,
            ClientGeneratedId: mParticle.Store.clientId,
            DeviceId: mParticle.Store.deviceId,
            MPID: currentUser ? currentUser.getMPID() : null,
            ConsentState: currentUser ? currentUser.getConsentState() : null,
            IntegrationAttributes: mParticle.Store.integrationAttributes
        };

        if (messageType === Types.MessageType.SessionEnd) {
            eventObject.SessionLength = mParticle.Store.dateLastEventSent.getTime() - mParticle.Store.sessionStartDate.getTime();
            eventObject.currentSessionMPIDs = mParticle.Store.currentSessionMPIDs;
            eventObject.EventAttributes = mParticle.Store.sessionAttributes;

            mParticle.Store.currentSessionMPIDs = [];
        }

        eventObject.Timestamp = mParticle.Store.dateLastEventSent.getTime();

        return eventObject;
    }

    return null;
}

function convertEventToDTO(event, isFirstRun, currencyCode) {
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
        smpids: event.currentSessionMPIDs
    };

    var consent = convertToConsentStateDTO(event.ConsentState);
    if (consent) {
        dto.con = consent;
    }

    if (event.EventDataType === MessageType.AppStateTransition) {
        dto.fr = isFirstRun;
        dto.iu = false;
        dto.at = ApplicationTransitionType.AppInit;
        dto.lr = window.location.href || null;
        dto.attrs = null;
    }

    if (event.CustomFlags) {
        convertCustomFlags(event, dto);
    }

    if (event.EventDataType === MessageType.Commerce) {
        dto.cu = currencyCode;

        if (event.ShoppingCart) {
            dto.sc = {
                pl: convertProductListToDTO(event.ShoppingCart.ProductList)
            };
        }

        if (event.ProductAction) {
            dto.pd = {
                an: event.ProductAction.ProductActionType,
                cs: parseNumber(event.ProductAction.CheckoutStep),
                co: event.ProductAction.CheckoutOptions,
                pl: convertProductListToDTO(event.ProductAction.ProductList),
                ti: event.ProductAction.TransactionId,
                ta: event.ProductAction.Affiliation,
                tcc: event.ProductAction.CouponCode,
                tr: parseNumber(event.ProductAction.TotalAmount),
                ts: parseNumber(event.ProductAction.ShippingAmount),
                tt: parseNumber(event.ProductAction.TaxAmount)
            };
        }
        else if (event.PromotionAction) {
            dto.pm = {
                an: event.PromotionAction.PromotionActionType,
                pl: event.PromotionAction.PromotionList.map(function(promotion) {
                    return {
                        id: promotion.Id,
                        nm: promotion.Name,
                        cr: promotion.Creative,
                        ps: promotion.Position ? promotion.Position : 0
                    };
                })
            };
        }
        else if (event.ProductImpressions) {
            dto.pi = event.ProductImpressions.map(function(impression) {
                return {
                    pil: impression.ProductImpressionList,
                    pl: convertProductListToDTO(impression.ProductList)
                };
            });
        }
    }
    else if (event.EventDataType === MessageType.Profile) {
        dto.pet = event.ProfileMessageType;
    }

    return dto;
}

module.exports = {
    createEventObject: createEventObject,
    convertEventToDTO: convertEventToDTO,
    convertToConsentStateDTO: convertToConsentStateDTO
};
