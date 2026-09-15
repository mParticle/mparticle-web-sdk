var GoogleAnalytics4Kit = (function (exports) {
    'use strict';

    var googleConsentValues = {
        // Server Integration uses 'Unspecified' as a value when the setting is 'not set'.
        // However, this is not used by Google's Web SDK. We are referencing it here as a comment
        // as a record of this distinction and for posterity.
        // If Google ever adds this for web, the line can just be uncommented to support this.
        //
        // Docs:
        // Web: https://developers.google.com/tag-platform/gtagjs/reference#consent
        // S2S: https://developers.google.com/google-ads/api/reference/rpc/v15/ConsentStatusEnum.ConsentStatus
        //
        // Unspecified: 'unspecified',
        Denied: 'denied',
        Granted: 'granted',
    };

    // Declares list of valid Google Consent Properties
    var googleConsentProperties = [
        'ad_storage',
        'ad_user_data',
        'ad_personalization',
        'analytics_storage',
        'functionality_storage',
        'personalization_storage',
        'security_storage',
    ];

    function ConsentHandler(common) {
        this.common = common || {};
    }

    ConsentHandler.prototype.getUserConsentState = function() {
        var userConsentState = {};

        if (mParticle.Identity && mParticle.Identity.getCurrentUser) {
            var currentUser = mParticle.Identity.getCurrentUser();

            if (!currentUser) {
                return {};
            }

            var consentState = mParticle.Identity.getCurrentUser().getConsentState();

            if (consentState && consentState.getGDPRConsentState) {
                userConsentState = consentState.getGDPRConsentState();
            }
        }

        return userConsentState;
    };

    ConsentHandler.prototype.getConsentSettings = function() {
        var consentSettings = {};

        var googleToMpConsentSettingsMapping = {
            ad_user_data: 'defaultAdUserDataConsentSDK',
            ad_personalization: 'defaultAdPersonalizationConsentSDK',
            ad_storage: 'defaultAdStorageConsentSDK',
            analytics_storage: 'defaultAnalyticsStorageConsentSDK',
            functionality_storage: 'defaultFunctionalityStorageConsentSDK',
            personalization_storage: 'defaultPersonalizationStorageConsentSDK',
            security_storage: 'defaultSecurityStorageConsentSDK',
        };

        var forwarderSettings = this.common.forwarderSettings;

        Object.keys(googleToMpConsentSettingsMapping).forEach(function(
            googleConsentKey
        ) {
            var mpConsentSettingKey =
                googleToMpConsentSettingsMapping[googleConsentKey];
            var googleConsentValuesKey = forwarderSettings[mpConsentSettingKey];

            if (googleConsentValuesKey && mpConsentSettingKey) {
                consentSettings[googleConsentKey] =
                    googleConsentValues[googleConsentValuesKey];
            }
        });

        return consentSettings;
    };

    ConsentHandler.prototype.generateConsentStatePayloadFromMappings = function(
        consentState,
        mappings
    ) {
        if (!mappings) return {};

        var payload = this.common.cloneObject(this.common.consentPayloadDefaults);

        for (var i = 0; i <= mappings.length - 1; i++) {
            var mappingEntry = mappings[i];

            // Although consent purposes can be inputted into the UI in any casing
            // the SDK will automatically lowercase them to prevent pseudo-duplicate
            // consent purposes, so we call `toLowerCase` on the consentMapping purposes here
            var mpMappedConsentName = mappingEntry.map.toLowerCase();
            var googleMappedConsentName = mappingEntry.value;

            if (
                consentState[mpMappedConsentName] &&
                googleConsentProperties.indexOf(googleMappedConsentName) !== -1
            ) {
                payload[googleMappedConsentName] = consentState[mpMappedConsentName]
                    .Consented
                    ? googleConsentValues.Granted
                    : googleConsentValues.Denied;
            }
        }

        return payload;
    };

    var consent = ConsentHandler;

    // Google requires event and user attribute strings to have specific limits
    // in place when sending to data layer.
    // https://support.google.com/analytics/answer/11202874?sjid=7958830619827381593-NA



    var EVENT_NAME_MAX_LENGTH = 40;
    var EVENT_ATTRIBUTE_KEY_MAX_LENGTH = 40;
    var EVENT_ATTRIBUTE_VAL_MAX_LENGTH = 100;
    var EVENT_ATTRIBUTE_MAX_NUMBER = 100;
    var PAGE_TITLE_MAX_LENGTH = 300;
    var PAGE_REFERRER_MAX_LENGTH = 420;
    var PAGE_LOCATION_MAX_LENGTH = 1000;

    var USER_ATTRIBUTE_KEY_MAX_LENGTH = 24;
    var USER_ATTRIBUTE_VALUE_MAX_LENGTH = 36;

    var PRODUCT_ATTRIBUTE_MAX_NUMBER = 10;

    var PAGE_TITLE_KEY = 'page_title';
    var PAGE_LOCATION_KEY = 'page_location';
    var PAGE_REFERRER_KEY = 'page_referrer';

    var RESERVED_PRODUCT_KEYS = [
        'item_category',
        'item_category2',
        'item_category3',
        'item_category4',
        'item_category5',
    ];

    var FORBIDDEN_PREFIXES = ['google_', 'firebase_', 'ga_'];
    var FORBIDDEN_CHARACTERS_REGEX = /[^a-zA-Z0-9_]/g;

    function truncateString(string, limit) {
        return !!string && string.length > limit
            ? string.substring(0, limit)
            : string;
    }

    function isEmpty(value) {
        return value == null || !(Object.keys(value) || value).length;
    }

    function Common() {
        this.consentMappings = [];
        this.consentPayloadDefaults = {};
        this.consentPayloadAsString = '';

        this.consentHandler = new consent(this);
    }

    Common.prototype.forwarderSettings = null;

    Common.prototype.mergeObjects = function() {
        var resObj = {};
        for (var i = 0; i < arguments.length; i += 1) {
            var obj = arguments[i],
                keys = Object.keys(obj);
            for (var j = 0; j < keys.length; j += 1) {
                resObj[keys[j]] = obj[keys[j]];
            }
        }
        return resObj;
    };

    Common.prototype.truncateAttributes = function(
        attributes,
        keyLimit,
        valueLimit
    ) {
        var truncatedAttributes = {};

        if (!isEmpty(attributes)) {
            Object.keys(attributes).forEach(function(attribute) {
                var key = truncateString(attribute, keyLimit);
                var valueLimitOverride;
                switch (key) {
                    case PAGE_TITLE_KEY:
                        valueLimitOverride = PAGE_TITLE_MAX_LENGTH;
                        break;
                    case PAGE_REFERRER_KEY:
                        valueLimitOverride = PAGE_REFERRER_MAX_LENGTH;
                        break;
                    case PAGE_LOCATION_KEY:
                        valueLimitOverride = PAGE_LOCATION_MAX_LENGTH;
                        break;
                    default:
                        valueLimitOverride = valueLimit;
                }
                var val = truncateString(attributes[attribute], valueLimitOverride);
                truncatedAttributes[key] = val;
            });
        }

        return truncatedAttributes;
    };

    Common.prototype.limitAttributes = function(attributes, limitNumber) {
        if (isEmpty(attributes)) {
            return {};
        }

        var attributeKeys = Object.keys(attributes);

        attributeKeys.sort();

        var limitedAttributes = attributeKeys
            .slice(0, limitNumber)
            .reduce(function(obj, key) {
                obj[key] = attributes[key];
                return obj;
            }, {});

        return limitedAttributes;
    };

    Common.prototype.limitEventAttributes = function(attributes) {
        return this.limitAttributes(attributes, EVENT_ATTRIBUTE_MAX_NUMBER);
    };

    Common.prototype.limitProductAttributes = function(attributes) {
        var productAttributes = {};
        var reservedAttributes = {};

        for (var key in attributes) {
            if (RESERVED_PRODUCT_KEYS.indexOf(key) >= 0) {
                reservedAttributes[key] = attributes[key];
            } else {
                productAttributes[key] = attributes[key];
            }
        }

        var limitedProductAttributes = this.limitAttributes(
            productAttributes,
            PRODUCT_ATTRIBUTE_MAX_NUMBER
        );

        return this.mergeObjects(limitedProductAttributes, reservedAttributes);
    };

    Common.prototype.getEventConsentState = function(eventConsentState) {
        return eventConsentState && eventConsentState.getGDPRConsentState
            ? eventConsentState.getGDPRConsentState()
            : {};
    };

    Common.prototype.maybeSendConsentUpdateToGoogle = function(consentState) {
        // If consent payload is empty,
        // we never sent an initial default consent state
        // so we shouldn't send an update.
        if (
            this.consentPayloadAsString &&
            this.consentMappings &&
            !this.isEmpty(consentState)
        ) {
            var updatedConsentPayload = this.consentHandler.generateConsentStatePayloadFromMappings(
                consentState,
                this.consentMappings
            );

            var eventConsentAsString = JSON.stringify(updatedConsentPayload);

            if (eventConsentAsString !== this.consentPayloadAsString) {
                gtag('consent', 'update', updatedConsentPayload);
                this.consentPayloadAsString = eventConsentAsString;
            }
        }
    };

    Common.prototype.sendDefaultConsentPayloadToGoogle = function(consentPayload) {
        this.consentPayloadAsString = JSON.stringify(consentPayload);

        gtag('consent', 'default', consentPayload);
    };

    Common.prototype.truncateEventName = function(eventName) {
        return truncateString(eventName, EVENT_NAME_MAX_LENGTH);
    };

    Common.prototype.truncateEventAttributes = function(eventAttributes) {
        return this.truncateAttributes(
            eventAttributes,
            EVENT_ATTRIBUTE_KEY_MAX_LENGTH,
            EVENT_ATTRIBUTE_VAL_MAX_LENGTH
        );
    };

    Common.prototype.standardizeParameters = function(parameters) {
        var standardizedParameters = {};
        for (var key in parameters) {
            var standardizedKey = this.standardizeName(key);
            standardizedParameters[standardizedKey] = parameters[key];
        }
        return standardizedParameters;
    };

    Common.prototype.standardizeName = function(name) {
        if (
            window.GoogleAnalytics4Kit.hasOwnProperty(
                'setCustomNameStandardization'
            )
        ) {
            try {
                name = window.GoogleAnalytics4Kit.setCustomNameStandardization(
                    name
                );
            } catch (e) {
                console.warn(
                    'Error calling setCustomNameStandardization callback. Check your callback.  Data will still be sent without user-defined standardization. See our docs for proper use - https://docs.mparticle.com/integrations/google-analytics-4/event/',
                    e
                );
            }
        }

        // names of events and parameters have the following requirements:
        // 1. They must only contain letters, numbers, and underscores
        function removeForbiddenCharacters(name) {
            return name.replace(FORBIDDEN_CHARACTERS_REGEX, '_');
        }

        // 2. They must start with a letter
        function doesNameStartsWithLetter(name) {
            return !isEmpty(name) && /^[a-zA-Z]/.test(name.charAt(0));
        }

        // 3. They must not start with certain prefixes
        function doesNameStartWithForbiddenPrefix(name) {
            var hasPrefix = false;
            if (!isEmpty(name)) {
                for (var i = 0; i < FORBIDDEN_PREFIXES.length; i++) {
                    var prefix = FORBIDDEN_PREFIXES[i];
                    if (name.indexOf(prefix) === 0) {
                        hasPrefix = true;
                        break;
                    }
                }
            }

            return hasPrefix;
        }

        function removeNonAlphabetCharacterFromStart(name) {
            var str = name.slice();
            while (!isEmpty(str) && str.charAt(0).match(/[^a-zA-Z]/i)) {
                str = str.substring(1);
            }
            return str;
        }

        function removeForbiddenPrefix(name) {
            var str = name.slice();

            FORBIDDEN_PREFIXES.forEach(function(prefix) {
                if (str.indexOf(prefix) === 0) {
                    str = str.replace(prefix, '');
                }
            });

            return str;
        }

        var standardizedName = removeForbiddenCharacters(name);

        // While loops is required because there is a chance that once certain sanitization
        // occurs, that the resulting string will end up violating a different criteria.
        // An example is 123___google_$$google_test_event.  If letters, are removed and
        // prefix is removed once, the remaining string will be __google_test_event which violates
        // a string starting with a letter.  We have to repeat the sanitizations repeatedly
        // until all criteria checks pass.
        while (
            !doesNameStartsWithLetter(standardizedName) ||
            doesNameStartWithForbiddenPrefix(standardizedName)
        ) {
            standardizedName = removeNonAlphabetCharacterFromStart(
                standardizedName
            );
            standardizedName = removeForbiddenPrefix(standardizedName);
        }

        return standardizedName;
    };

    Common.prototype.truncateUserAttributes = function(userAttributes) {
        return this.truncateAttributes(
            userAttributes,
            USER_ATTRIBUTE_KEY_MAX_LENGTH,
            USER_ATTRIBUTE_VALUE_MAX_LENGTH
        );
    };

    Common.prototype.getUserId = function(
        user,
        externalUserIdentityType,
        hashUserId
    ) {
        if (!user) {
            return;
        }

        var externalUserIdentityTypes = {
            none: 'None',
            customerId: 'CustomerId',
            other: 'Other',
            other2: 'Other2',
            other3: 'Other3',
            other4: 'Other4',
            other5: 'Other5',
            other6: 'Other6',
            other7: 'Other7',
            other8: 'Other8',
            other9: 'Other9',
            other10: 'Other10',
            mpid: 'mpid',
        };

        var userId,
            userIdentities = user.getUserIdentities().userIdentities;
        if (externalUserIdentityType !== externalUserIdentityTypes.none) {
            switch (externalUserIdentityType) {
                case 'CustomerId':
                    userId = userIdentities.customerid;
                    break;
                case externalUserIdentityTypes.other:
                    userId = userIdentities.other;
                    break;
                case externalUserIdentityTypes.other2:
                    userId = userIdentities.other2;
                    break;
                case externalUserIdentityTypes.other3:
                    userId = userIdentities.other3;
                    break;
                case externalUserIdentityTypes.other4:
                    userId = userIdentities.other4;
                    break;
                case externalUserIdentityTypes.other5:
                    userId = userIdentities.other5;
                    break;
                case externalUserIdentityTypes.other6:
                    userId = userIdentities.other6;
                    break;
                case externalUserIdentityTypes.other7:
                    userId = userIdentities.other7;
                    break;
                case externalUserIdentityTypes.other8:
                    userId = userIdentities.other8;
                    break;
                case externalUserIdentityTypes.other9:
                    userId = userIdentities.other9;
                    break;
                case externalUserIdentityTypes.other10:
                    userId = userIdentities.other10;
                    break;
                case externalUserIdentityTypes.mpid:
                    userId = user.getMPID();
                    break;
                default:
                    console.warn(
                        'External identity type not found for setting identity on ' +
                            'GA4' +
                            '. User not set. Please double check your implementation.'
                    );
            }
            if (userId) {
                if (hashUserId == 'True') {
                    userId = window.mParticle.generateHash(userId);
                }
            } else {
                console.warn(
                    'External identity type of ' +
                        externalUserIdentityType +
                        ' not set on the user'
                );
            }
            return userId;
        }
    };

    Common.prototype.cloneObject = function(obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    Common.prototype.isEmpty = isEmpty;

    var common = Common;

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    var self$1 = commonjsGlobal;
    function CommerceHandler(common) {
        self$1.common = this.common = common || {};
    }

    var ProductActionTypes = {
        Unknown: 0,
        AddToCart: 10,
        Click: 14,
        Checkout: 12,
        CheckoutOption: 13,
        Impression: 22,
        Purchase: 16,
        Refund: 17,
        RemoveFromCart: 11,
        ViewDetail: 15,
        AddToWishlist: 20,
    };

    var PromotionActionTypes = {
        PromotionClick: 19,
        PromotionView: 18,
    };

    // Custom Flags
    var GA4_COMMERCE_EVENT_TYPE = 'GA4.CommerceEventType',
        GA4_SHIPPING_TIER = 'GA4.ShippingTier',
        GA4_PAYMENT_TYPE = 'GA4.PaymentType';

    var ADD_SHIPPING_INFO = 'add_shipping_info',
        ADD_PAYMENT_INFO = 'add_payment_info',
        VIEW_CART = 'view_cart';

    CommerceHandler.prototype.logCommerceEvent = function(event) {
        var needsCurrency = true,
            needsValue = true,
            ga4CommerceEventParameters = {},
            isViewCartEvent = false,
            customEventAttributes = event.EventAttributes || {},
            // affiliation potentially lives on any commerce event with items
            affiliation =
                event && event.ProductAction
                    ? event.ProductAction.Affiliation
                    : null;

        // GA4 has a view_cart event which MP does not support via a ProductActionType
        // In order to log a view_cart event, pass ProductActionType.Unknown along with
        // the proper custom flag
        // Unknown ProductActionTypes without a custom flag will reach the switch statement
        // below and throw an error to the customer
        if (event.EventCategory === ProductActionTypes.Unknown) {
            if (
                event.CustomFlags &&
                event.CustomFlags[GA4_COMMERCE_EVENT_TYPE] === VIEW_CART
            ) {
                isViewCartEvent = true;
                return this.logViewCart(event, affiliation);
            }
        }
        // Handle Impressions
        if (event.EventCategory === ProductActionTypes.Impression) {
            return this.logImpressionEvent(event, affiliation);
            // Handle Promotions
        } else if (
            event.EventCategory === PromotionActionTypes.PromotionClick ||
            event.EventCategory === PromotionActionTypes.PromotionView
        ) {
            return this.logPromotionEvent(event);
        }

        switch (event.EventCategory) {
            case ProductActionTypes.AddToCart:
            case ProductActionTypes.RemoveFromCart:
                ga4CommerceEventParameters = buildAddOrRemoveCartItem(
                    event,
                    affiliation
                );
                break;
            case ProductActionTypes.Checkout:
                ga4CommerceEventParameters = buildCheckout(event, affiliation);
                break;
            case ProductActionTypes.Click:
                ga4CommerceEventParameters = buildSelectItem(event, affiliation);

                needsCurrency = false;
                needsValue = false;
                break;
            case ProductActionTypes.Purchase:
                ga4CommerceEventParameters = buildPurchase(event, affiliation);
                break;
            case ProductActionTypes.Refund:
                ga4CommerceEventParameters = buildRefund(event, affiliation);
                break;
            case ProductActionTypes.ViewDetail:
                ga4CommerceEventParameters = buildViewItem(event, affiliation);
                break;
            case ProductActionTypes.AddToWishlist:
                ga4CommerceEventParameters = buildAddToWishlist(event, affiliation);
                break;

            case ProductActionTypes.CheckoutOption:
                return this.logCheckoutOptionEvent(event, affiliation);

            default:
                // a view cart event is handled at the beginning of this function
                if (!isViewCartEvent) {
                    console.error(
                        'Unsupported Commerce Event. Event not sent.',
                        event
                    );
                    return false;
                }
        }

        // TODO: https://mparticle-eng.atlassian.net/browse/SQDSDKS-5714
        if (this.common.forwarderSettings.enableDataCleansing) {
            customEventAttributes = this.common.standardizeParameters(
                customEventAttributes
            );
        }

        ga4CommerceEventParameters = this.common.mergeObjects(
            ga4CommerceEventParameters,
            this.common.limitEventAttributes(customEventAttributes)
        );

        // CheckoutOption, Promotions, and Impressions will not make it to this code
        if (needsCurrency) {
            ga4CommerceEventParameters.currency = event.CurrencyCode;
        }

        if (needsValue) {
            ga4CommerceEventParameters.value =
                (event.CustomFlags && event.CustomFlags['GA4.Value']) ||
                event.ProductAction.TotalAmount ||
                null;
        }

        return this.sendCommerceEventToGA4(
            mapGA4EcommerceEventName(event),
            ga4CommerceEventParameters
        );
    };

    CommerceHandler.prototype.sendCommerceEventToGA4 = function(
        eventName,
        eventAttributes
    ) {
        if (this.common.forwarderSettings.measurementId) {
            eventAttributes.send_to = this.common.forwarderSettings.measurementId;
        }

        gtag('event', eventName, eventAttributes);

        return true;
    };

    // Google previously had a CheckoutOption event, and now this has been split into 2 GA4 events - add_shipping_info and add_payment_info
    // Since MP still uses CheckoutOption, we must map this to the 2 events using custom flags.  To prevent any data loss from customers
    // migrating from UA to GA4, we will set a default `set_checkout_option` which matches Firebase's data model.
    CommerceHandler.prototype.logCheckoutOptionEvent = function(
        event,
        affiliation
    ) {
        try {
            var customFlags = event.CustomFlags,
                GA4CommerceEventType = customFlags[GA4_COMMERCE_EVENT_TYPE],
                ga4CommerceEventParameters;

            // if no custom flags exist or there is no GA4CommerceEventType, the user has not updated their code from using legacy GA which still supports checkout_option
            if (!customFlags || !GA4CommerceEventType) {
                console.error(
                    'Your checkout option event for the Google Analytics 4 integration is missing a custom flag for "GA4.CommerceEventType". The event was sent using the deprecated set_checkout_option event.  Review mParticle docs for GA4 for the custom flags to add.'
                );
            }

            switch (GA4CommerceEventType) {
                case ADD_SHIPPING_INFO:
                    ga4CommerceEventParameters = buildAddShippingInfo(
                        event,
                        affiliation
                    );
                    break;
                case ADD_PAYMENT_INFO:
                    ga4CommerceEventParameters = buildAddPaymentInfo(
                        event,
                        affiliation
                    );
                    break;
                default:
                    ga4CommerceEventParameters = buildCheckoutOptions(
                        event,
                        affiliation
                    );
                    break;
            }
        } catch (error) {
            console.error(
                'There is an issue with the custom flags in your CheckoutOption event. The event was not sent.  Plrease review the docs and fix.',
                error
            );
            return false;
        }

        ga4CommerceEventParameters = this.common.mergeObjects(
            ga4CommerceEventParameters,
            this.common.limitEventAttributes(event.EventAttributes)
        );

        return this.sendCommerceEventToGA4(
            mapGA4EcommerceEventName(event),
            ga4CommerceEventParameters
        );
    };

    CommerceHandler.prototype.logPromotionEvent = function(event) {
        var self = this;
        try {
            var ga4CommerceEventParameters;
            event.PromotionAction.PromotionList.forEach(function(promotion) {
                ga4CommerceEventParameters = buildPromotion(promotion);

                ga4CommerceEventParameters = self.common.mergeObjects(
                    ga4CommerceEventParameters,
                    self.common.limitEventAttributes(event.EventAttributes)
                );

                self.sendCommerceEventToGA4(
                    mapGA4EcommerceEventName(event),
                    ga4CommerceEventParameters
                );
            });

            return true;
        } catch (error) {
            console.error(
                'Error logging Promotions to GA4. Promotions not logged.',
                error
            );
            return false;
        }
    };

    CommerceHandler.prototype.logImpressionEvent = function(event, affiliation) {
        var self = this;
        try {
            var ga4CommerceEventParameters;
            event.ProductImpressions.forEach(function(impression) {
                ga4CommerceEventParameters = parseImpression(
                    impression,
                    affiliation
                );

                ga4CommerceEventParameters = self.common.mergeObjects(
                    ga4CommerceEventParameters,
                    self.common.limitEventAttributes(event.EventAttributes)
                );

                self.sendCommerceEventToGA4(
                    mapGA4EcommerceEventName(event),
                    ga4CommerceEventParameters
                );
            });

            return true;
        } catch (error) {
            console.log(
                'Error logging Impressions to GA4. Impressions not logged',
                error
            );
            return false;
        }
    };

    CommerceHandler.prototype.logViewCart = function(event, affiliation) {
        var ga4CommerceEventParameters = buildViewCart(event, affiliation);
        ga4CommerceEventParameters = this.common.mergeObjects(
            ga4CommerceEventParameters,
            this.common.limitEventAttributes(event.EventAttributes)
        );
        ga4CommerceEventParameters.currency = event.CurrencyCode;

        ga4CommerceEventParameters.value =
            (event.CustomFlags && event.CustomFlags['GA4.Value']) ||
            event.ProductAction.TotalAmount ||
            null;

        return this.sendCommerceEventToGA4(
            mapGA4EcommerceEventName(event),
            ga4CommerceEventParameters
        );
    };

    function buildAddOrRemoveCartItem(event, affiliation) {
        return {
            items: buildProductsList(event.ProductAction.ProductList, affiliation),
        };
    }

    function buildCheckout(event, affiliation) {
        return {
            items: buildProductsList(event.ProductAction.ProductList, affiliation),
            coupon: event.ProductAction ? event.ProductAction.CouponCode : null,
        };
    }

    function buildCheckoutOptions(event, affiliation) {
        var parameters = event.EventAttributes;
        parameters.items = buildProductsList(
            event.ProductAction.ProductList,
            affiliation
        );
        parameters.coupon = event.ProductAction
            ? event.ProductAction.CouponCode
            : null;

        return parameters;
    }

    function parseImpression(impression, affiliation) {
        return {
            item_list_id: impression.ProductImpressionList,
            item_list_name: impression.ProductImpressionList,
            items: buildProductsList(impression.ProductList, affiliation),
        };
    }

    function buildSelectItem(event, affiliation) {
        return {
            items: buildProductsList(event.ProductAction.ProductList, affiliation),
        };
    }

    function buildViewItem(event, affiliation) {
        return {
            items: buildProductsList(event.ProductAction.ProductList, affiliation),
        };
    }

    function buildPromotion(promotion) {
        return parsePromotion(promotion);
    }

    function buildPurchase(event, affiliation) {
        return {
            transaction_id: event.ProductAction.TransactionId,
            value: event.ProductAction.TotalAmount,
            coupon: event.ProductAction.CouponCode,
            shipping: event.ProductAction.ShippingAmount,
            tax: event.ProductAction.TaxAmount,
            items: buildProductsList(event.ProductAction.ProductList, affiliation),
        };
    }
    function buildRefund(event, affiliation) {
        return {
            transaction_id: event.ProductAction.TransactionId,
            value: event.ProductAction.TotalAmount,
            coupon: event.ProductAction.CouponCode,
            shipping: event.ProductAction.ShippingAmount,
            tax: event.ProductAction.TaxAmount,
            items: buildProductsList(event.ProductAction.ProductList, affiliation),
        };
    }
    function buildAddToWishlist(event, affiliation) {
        return {
            value: event.ProductAction.TotalAmount,
            items: buildProductsList(event.ProductAction.ProductList, affiliation),
        };
    }

    function buildAddShippingInfo(event, affiliation) {
        return {
            coupon:
                event.ProductAction && event.ProductAction.CouponCode
                    ? event.ProductAction.CouponCode
                    : null,
            shipping_tier:
                event.CustomFlags && event.CustomFlags[GA4_SHIPPING_TIER]
                    ? event.CustomFlags[GA4_SHIPPING_TIER]
                    : null,
            items: buildProductsList(event.ProductAction.ProductList, affiliation),
        };
    }

    function buildAddPaymentInfo(event, affiliation) {
        return {
            coupon:
                event.ProductAction && event.ProductAction.CouponCode
                    ? event.ProductAction.CouponCode
                    : null,
            payment_type:
                event.CustomFlags && event.CustomFlags[GA4_PAYMENT_TYPE]
                    ? event.CustomFlags[GA4_PAYMENT_TYPE]
                    : null,
            items: buildProductsList(event.ProductAction.ProductList, affiliation),
        };
    }

    // Utility function
    function toUnderscore(string) {
        return string
            .split(/(?=[A-Z])/)
            .join('_')
            .toLowerCase();
    }

    function parseProduct(product, affiliation) {
        // 1. Move key/value pairs from product.Attributes to be at the same level
        // as all keys in product, limiting them to 10 in the process.

        var productWithAllAttributes = {};

        if (affiliation) {
            productWithAllAttributes.affiliation = affiliation;
        }

        productWithAllAttributes = self$1.common.mergeObjects(
            productWithAllAttributes,
            self$1.common.limitProductAttributes(product.Attributes)
        );

        // 2. Copy key/value pairs in product
        for (var key in product) {
            switch (key) {
                case 'Sku':
                    productWithAllAttributes.item_id = product.Sku;
                    break;
                case 'Name':
                    productWithAllAttributes.item_name = product.Name;
                    break;
                case 'Brand':
                    productWithAllAttributes.item_brand = product.Brand;
                    break;
                case 'Category':
                    productWithAllAttributes.item_category = product.Category;
                    break;
                case 'CouponCode':
                    productWithAllAttributes.coupon = product.CouponCode;
                    break;
                case 'Variant':
                    productWithAllAttributes.item_variant = product.Variant;
                    break;
                case 'Position':
                    productWithAllAttributes.index = product.Position;
                    break;
                case 'Attributes':
                    break;
                default:
                    productWithAllAttributes[toUnderscore(key)] = product[key];
            }
        }

        // TODO: https://mparticle-eng.atlassian.net/browse/SQDSDKS-5716
        if (self$1.common.forwarderSettings.enableDataCleansing) {
            return self$1.common.standardizeParameters(productWithAllAttributes);
        } else {
            return productWithAllAttributes;
        }
    }

    function parsePromotion(_promotion) {
        var promotion = {};

        for (var key in _promotion) {
            switch (key) {
                case 'Id':
                    promotion.promotion_id = _promotion.Id;
                    break;
                case 'Creative':
                    promotion.creative_name = _promotion.Creative;
                    break;
                case 'Name':
                    promotion.promotion_name = _promotion.Name;
                    break;
                case 'Position':
                    promotion.creative_slot = _promotion.Position;
                    break;
                default:
                    promotion[toUnderscore(key)] = _promotion[key];
            }
        }

        if (self$1.common.forwarderSettings.enableDataCleansing) {
            return self$1.common.standardizeParameters(promotion);
        } else {
            return promotion;
        }
    }

    function buildProductsList(products, affiliation) {
        var productsList = [];

        products.forEach(function(product) {
            productsList.push(parseProduct(product, affiliation));
        });

        return productsList;
    }

    function mapGA4EcommerceEventName(event) {
        switch (event.EventCategory) {
            case ProductActionTypes.AddToCart:
                return 'add_to_cart';
            case ProductActionTypes.AddToWishlist:
                return 'add_to_wishlist';
            case ProductActionTypes.RemoveFromCart:
                return 'remove_from_cart';
            case ProductActionTypes.Purchase:
                return 'purchase';
            case ProductActionTypes.Checkout:
                return 'begin_checkout';
            case ProductActionTypes.CheckoutOption:
                return getCheckoutOptionEventName(event.CustomFlags);
            case ProductActionTypes.Click:
                return 'select_item';
            case ProductActionTypes.Impression:
                return 'view_item_list';
            case ProductActionTypes.Refund:
                return 'refund';
            case ProductActionTypes.ViewDetail:
                return 'view_item';
            case PromotionActionTypes.PromotionClick:
                return 'select_promotion';
            case PromotionActionTypes.PromotionView:
                return 'view_promotion';
            case ProductActionTypes.Unknown:
                if (
                    event.CustomFlags &&
                    event.CustomFlags[GA4_COMMERCE_EVENT_TYPE] === VIEW_CART
                ) {
                    return 'view_cart';
                }
                break;
            default:
                console.error('Product Action Type not supported');
                return null;
        }
    }

    function getCheckoutOptionEventName(customFlags) {
        switch (customFlags[GA4_COMMERCE_EVENT_TYPE]) {
            case ADD_SHIPPING_INFO:
                return ADD_SHIPPING_INFO;
            case ADD_PAYMENT_INFO:
                return ADD_PAYMENT_INFO;
            default:
                return 'set_checkout_option';
        }
    }

    function buildViewCart(event, affiliation) {
        return {
            items: buildProductsList(event.ProductAction.ProductList, affiliation),
        };
    }

    var commerceHandler = CommerceHandler;

    function EventHandler(common) {
        this.common = common || {};
    }

    // TODO: https://mparticle-eng.atlassian.net/browse/SQDSDKS-5715
    EventHandler.prototype.sendEventToGA4 = function(eventName, eventAttributes) {
        var standardizedEventName;
        var standardizedAttributes;
        if (this.common.forwarderSettings.enableDataCleansing) {
            standardizedEventName = this.common.standardizeName(eventName);
            standardizedAttributes = this.common.standardizeParameters(
                eventAttributes
            );
        } else {
            standardizedEventName = eventName;
            standardizedAttributes = eventAttributes;
        }

        standardizedAttributes = this.common.limitEventAttributes(
            standardizedAttributes
        );

        if (this.common.forwarderSettings.measurementId) {
            standardizedAttributes.send_to = this.common.forwarderSettings.measurementId;
        }

        gtag(
            'event',
            this.common.truncateEventName(standardizedEventName),
            this.common.truncateEventAttributes(standardizedAttributes)
        );
    };

    EventHandler.prototype.logEvent = function(event) {
        var eventConsentState = this.common.getEventConsentState(
            event.ConsentState
        );
        this.common.maybeSendConsentUpdateToGoogle(eventConsentState);
        this.sendEventToGA4(event.EventName, event.EventAttributes);
    };

    EventHandler.prototype.logError = function() {
        console.warn('Google Analytics 4 does not support error events.');
    };

    EventHandler.prototype.logPageView = function(event) {
        var TITLE = 'GA4.Title';
        var LOCATION = 'GA4.Location';
        var REFERRER = 'GA4.Referrer';

        // These are being included for backwards compatibility from the legacy Google Analytics custom flags
        var LEGACY_GA_TITLE = 'Google.Title';
        var LEGACY_GA_LOCATION = 'Google.Location';
        var LEGACY_GA_REFERRER = 'Google.DocumentReferrer';

        var pageLocation = location.href;
        var pageTitle = document.title;
        var pageReferrer = document.referrer;

        if (event.CustomFlags) {
            if (event.CustomFlags.hasOwnProperty(TITLE)) {
                pageTitle = event.CustomFlags[TITLE];
            } else if (event.CustomFlags.hasOwnProperty(LEGACY_GA_TITLE)) {
                pageTitle = event.CustomFlags[LEGACY_GA_TITLE];
            }

            if (event.CustomFlags.hasOwnProperty(LOCATION)) {
                pageLocation = event.CustomFlags[LOCATION];
            } else if (event.CustomFlags.hasOwnProperty(LEGACY_GA_LOCATION)) {
                pageLocation = event.CustomFlags[LEGACY_GA_LOCATION];
            }

            if (event.CustomFlags.hasOwnProperty(REFERRER)) {
                pageReferrer = event.CustomFlags[REFERRER];
            } else if (event.CustomFlags.hasOwnProperty(LEGACY_GA_REFERRER)) {
                pageReferrer = event.CustomFlags[LEGACY_GA_REFERRER];
            }
        }

        var eventAttributes = this.common.mergeObjects(
            {
                page_title: pageTitle,
                page_location: pageLocation,
                page_referrer: pageReferrer,
            },
            event.EventAttributes
        );

        var eventConsentState = this.common.getEventConsentState(
            event.ConsentState
        );
        this.common.maybeSendConsentUpdateToGoogle(eventConsentState);
        this.sendEventToGA4('page_view', eventAttributes);

        return true;
    };

    var eventHandler = EventHandler;

    /*
    The 'mParticleUser' is an object with methods get user Identities and set/get user attributes
    Partners can determine what userIds are available to use in their SDK
    Call mParticleUser.getUserIdentities() to return an object of userIdentities --> { userIdentities: {customerid: '1234', email: 'email@gmail.com'} }
    For more identity types, see http://docs.mparticle.com/developers/sdk/javascript/identity#allowed-identity-types
    Call mParticleUser.getMPID() to get mParticle ID
    For any additional methods, see http://docs.mparticle.com/developers/sdk/javascript/apidocs/classes/mParticle.Identity.getCurrentUser().html
    */

    /*
    identityApiRequest has the schema:
    {
      userIdentities: {
        customerid: '123',
        email: 'abc'
      }
    }
    For more userIdentity types, see http://docs.mparticle.com/developers/sdk/javascript/identity#allowed-identity-types
    */

    function IdentityHandler(common) {
        this.common = common || {};
    }
    IdentityHandler.prototype.onUserIdentified = function(mParticleUser) {
        var userId = this.common.getUserId(
            mParticleUser,
            this.common.forwarderSettings.externalUserIdentityType,
            this.common.forwarderSettings.hashUserId
        );
        gtag('config', this.common.forwarderSettings.measurementId, {
            // do not send a page view when updating the userid in an identity call
            send_page_view: false,
            user_id: userId,
        });
    };
    IdentityHandler.prototype.onIdentifyComplete = function(
        mParticleUser,
        identityApiRequest
    ) {};
    IdentityHandler.prototype.onLoginComplete = function(
        mParticleUser,
        identityApiRequest
    ) {};
    IdentityHandler.prototype.onLogoutComplete = function(
        mParticleUser,
        identityApiRequest
    ) {};
    IdentityHandler.prototype.onModifyComplete = function(
        mParticleUser,
        identityApiRequest
    ) {};

    /*  In previous versions of the mParticle web SDK, setting user identities on
        kits is only reachable via the onSetUserIdentity method below. We recommend
        filling out `onSetUserIdentity` for maximum compatibility
    */
    IdentityHandler.prototype.onSetUserIdentity = function(
        forwarderSettings,
        id,
        type
    ) {};

    var identityHandler = IdentityHandler;

    var initialization = {
        // This name matches the mParticle database. This should not be changed unless the database name is being changed
        // Changing this will also break the API for the cleansing data callback that a customer uses.
        name: 'GoogleAnalytics4',
        moduleId: 160,
        /*  ****** Fill out initForwarder to load your SDK ******
        Note that not all arguments may apply to your SDK initialization.
        These are passed from mParticle, but leave them even if they are not being used.
        forwarderSettings contain settings that your SDK requires in order to initialize
        userAttributes example: {gender: 'male', age: 25}
        userIdentities example: { 1: 'customerId', 2: 'facebookId', 7: 'emailid@email.com' }
        additional identityTypes can be found at https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/src/types.js#L88-L101
    */
        initForwarder: function(
            forwarderSettings,
            testMode,
            userAttributes,
            userIdentities,
            processEvent,
            eventQueue,
            isInitialized,
            common
        ) {
            mParticle._setIntegrationDelay(this.moduleId, true);

            // The API to allow a customer to provide the cleansing callback
            // relies on window.GoogleAnalytics4Kit to exist. When MP is initialized
            // via the snippet, the kit code adds it to the window automatically.
            // However, when initialized via npm, it does not exist, and so we have
            // to set it manually here.
            window.GoogleAnalytics4Kit = window.GoogleAnalytics4Kit || {};

            common.forwarderSettings = forwarderSettings;
            common.forwarderSettings.enableDataCleansing =
                common.forwarderSettings.enableDataCleansing === 'True';
            var measurementId = forwarderSettings.measurementId;
            var userIdType = forwarderSettings.externalUserIdentityType;
            var hashUserId = forwarderSettings.hashUserId;

            var configSettings = {
                send_page_view: forwarderSettings.enablePageView === 'True',
            };

            if (forwarderSettings.consentMappingSDK) {
                common.consentMappings = parseSettingsString(
                    forwarderSettings.consentMappingSDK
                );
            } else {
                // Ensures consent mappings is an empty array
                // for future use
                common.consentMappings = [];
                common.consentPayloadDefaults = {};
                common.consentPayloadAsString = '';
            }

            window.dataLayer = window.dataLayer || [];

            window.gtag = function() {
                window.dataLayer.push(arguments);
            };
            gtag('js', new Date());

            // Check to see if mParticle SDK is V2 because V1 does not have the
            // Identity API
            if (window.mParticle.getVersion().split('.')[0] === '2') {
                var userId = common.getUserId(
                    mParticle.Identity.getCurrentUser(),
                    userIdType,
                    hashUserId
                );
                if (userId) {
                    configSettings.user_id = userId;
                }
            }
            gtag('config', measurementId, configSettings);

            gtag('get', measurementId, 'client_id', function(clientId) {
                setClientId(clientId, initialization.moduleId);
            });

            if (!testMode) {
                var clientScript = document.createElement('script');
                clientScript.type = 'text/javascript';
                clientScript.async = true;
                clientScript.src =
                    'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
                (
                    document.getElementsByTagName('head')[0] ||
                    document.getElementsByTagName('body')[0]
                ).appendChild(clientScript);

                clientScript.onload = function() {
                    isInitialized = true;

                    if (window.dataLayer && gtag && eventQueue.length > 0) {
                        for (var i = 0; i < eventQueue.length; i++) {
                            processEvent(eventQueue[i]);
                        }
                        eventQueue = [];
                    }
                };
            } else {
                isInitialized = true;
            }

            common.consentPayloadDefaults = common.consentHandler.getConsentSettings();
            var defaultConsentPayload = common.cloneObject(
                common.consentPayloadDefaults
            );
            var updatedConsentState = common.consentHandler.getUserConsentState();
            var updatedDefaultConsentPayload = common.consentHandler.generateConsentStatePayloadFromMappings(
                updatedConsentState,
                common.consentMappings
            );

            // If a default consent payload exists (as selected in the mParticle UI), set it as the default
            if (!common.isEmpty(defaultConsentPayload)) {
                common.sendDefaultConsentPayloadToGoogle(defaultConsentPayload);
                // If a default consent payload does not exist, but the user currently has updated their consent,
                // send that as the default because a default must be sent
            } else if (!common.isEmpty(updatedDefaultConsentPayload)) {
                common.sendDefaultConsentPayloadToGoogle(
                    updatedDefaultConsentPayload
                );
            }

            common.maybeSendConsentUpdateToGoogle(updatedConsentState);

            return isInitialized;
        },
    };

    function setClientId(clientId, moduleId) {
        var GA4CLIENTID = 'client_id';
        var ga4IntegrationAttributes = {};
        ga4IntegrationAttributes[GA4CLIENTID] = clientId;
        window.mParticle.setIntegrationAttribute(
            moduleId,
            ga4IntegrationAttributes
        );
        window.mParticle._setIntegrationDelay(moduleId, false);
    }

    function parseSettingsString(settingsString) {
        return JSON.parse(settingsString.replace(/&quot;/g, '"'));
    }

    var initialization_1 = initialization;

    var sessionHandler = {
        onSessionStart: function(event) {},
        onSessionEnd: function(event) {},
    };

    var sessionHandler_1 = sessionHandler;

    function UserAttributeHandler(common) {
        this.common = common || {};
    }

    UserAttributeHandler.prototype.sendUserPropertiesToGA4 = function(
        userAttributes
    ) {
        gtag(
            'set',
            'user_properties',
            this.common.truncateUserAttributes(userAttributes)
        );
    };

    // `mParticleUser` was removed from the function signatures onRemoveUserAttribute, onSetUserAttribute, and onConsentStateUpload because they were not being used
    // In the future if mParticleUser is ever required for an implementation of any of the below APIs, see https://github.com/mparticle-integrations/mparticle-javascript-integration-example/blob/master/src/user-attribute-handler.js
    // for previous function signatures

    UserAttributeHandler.prototype.onRemoveUserAttribute = function(key) {
        var userAttributes = {};
        userAttributes[key] = null;
        this.sendUserPropertiesToGA4(userAttributes);
    };

    UserAttributeHandler.prototype.onSetUserAttribute = function(key, value) {
        var userAttributes = {};
        userAttributes[key] = value;
        this.sendUserPropertiesToGA4(userAttributes);
    };

    // TODO: Commenting this out for now because Integrations PM still determining if this is in scope or not
    // UserAttributeHandler.prototype.onConsentStateUpdated = function() // oldState,
    // newState,
    // mParticleUser
    // {};

    var userAttributeHandler = UserAttributeHandler;

    // =============== REACH OUT TO MPARTICLE IF YOU HAVE ANY QUESTIONS ===============
    //
    //  Copyright 2018 mParticle, Inc.
    //
    //  Licensed under the Apache License, Version 2.0 (the "License");
    //  you may not use this file except in compliance with the License.
    //  You may obtain a copy of the License at
    //
    //      http://www.apache.org/licenses/LICENSE-2.0
    //
    //  Unless required by applicable law or agreed to in writing, software
    //  distributed under the License is distributed on an "AS IS" BASIS,
    //  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    //  See the License for the specific language governing permissions and
    //  limitations under the License.









    var name = initialization_1.name,
        moduleId = initialization_1.moduleId,
        MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Commerce: 16,
            Media: 20,
        };

    var constructor = function() {
        var self = this,
            isInitialized = false,
            forwarderSettings,
            reportingService,
            eventQueue = [];

        self.name = initialization_1.name;
        self.moduleId = initialization_1.moduleId;
        self.common = new common();

        function initForwarder(
            settings,
            service,
            testMode,
            trackerId,
            userAttributes,
            userIdentities,
            appVersion,
            appName,
            customFlags,
            clientId
        ) {
            forwarderSettings = settings;

            if (
                typeof window !== 'undefined' &&
                window.mParticle.isTestEnvironment
            ) {
                reportingService = function() {};
            } else {
                reportingService = service;
            }

            try {
                initialization_1.initForwarder(
                    settings,
                    testMode,
                    userAttributes,
                    userIdentities,
                    processEvent,
                    eventQueue,
                    isInitialized,
                    self.common,
                    appVersion,
                    appName,
                    customFlags,
                    clientId
                );
                self.eventHandler = new eventHandler(self.common);
                self.identityHandler = new identityHandler(self.common);
                self.userAttributeHandler = new userAttributeHandler(self.common);
                self.commerceHandler = new commerceHandler(self.common);

                isInitialized = true;
            } catch (e) {
                console.log('Failed to initialize ' + name + ' - ' + e);
            }
        }

        function processEvent(event) {
            var reportEvent = false;
            if (isInitialized) {
                try {
                    if (event.EventDataType === MessageType.SessionStart) {
                        reportEvent = logSessionStart(event);
                    } else if (event.EventDataType === MessageType.SessionEnd) {
                        reportEvent = logSessionEnd(event);
                    } else if (event.EventDataType === MessageType.CrashReport) {
                        reportEvent = logError(event);
                    } else if (event.EventDataType === MessageType.PageView) {
                        reportEvent = logPageView(event);
                    } else if (event.EventDataType === MessageType.Commerce) {
                        reportEvent = logEcommerceEvent(event);
                    } else if (event.EventDataType === MessageType.PageEvent) {
                        reportEvent = logEvent(event);
                    } else if (event.EventDataType === MessageType.Media) {
                        // Kits should just treat Media Events as generic Events
                        reportEvent = logEvent(event);
                    }
                    if (reportEvent === true && reportingService) {
                        reportingService(self, event);
                        return 'Successfully sent to ' + name;
                    } else {
                        return (
                            'Error logging event or event type not supported on forwarder ' +
                            name
                        );
                    }
                } catch (e) {
                    return 'Failed to send to ' + name + ' ' + e;
                }
            } else {
                eventQueue.push(event);
                return (
                    "Can't send to forwarder " +
                    name +
                    ', not initialized. Event added to queue.'
                );
            }
        }

        function logSessionStart(event) {
            try {
                sessionHandler_1.onSessionStart(event);
                return true;
            } catch (e) {
                return {
                    error: 'Error starting session on forwarder ' + name + '; ' + e,
                };
            }
        }

        function logSessionEnd(event) {
            try {
                sessionHandler_1.onSessionEnd(event);
                return true;
            } catch (e) {
                return {
                    error: 'Error ending session on forwarder ' + name + '; ' + e,
                };
            }
        }

        function logError(event) {
            try {
                self.eventHandler.logError(event);
                return true;
            } catch (e) {
                return {
                    error: 'Error logging error on forwarder ' + name + '; ' + e,
                };
            }
        }

        function logPageView(event) {
            try {
                self.eventHandler.logPageView(event);
                return true;
            } catch (e) {
                return {
                    error:
                        'Error logging page view on forwarder ' + name + '; ' + e,
                };
            }
        }

        function logEvent(event) {
            try {
                self.eventHandler.logEvent(event);
                return true;
            } catch (e) {
                return {
                    error: 'Error logging event on forwarder ' + name + '; ' + e,
                };
            }
        }

        function logEcommerceEvent(event) {
            try {
                self.commerceHandler.logCommerceEvent(event);
                return true;
            } catch (e) {
                return {
                    error:
                        'Error logging purchase event on forwarder ' +
                        name +
                        '; ' +
                        e,
                };
            }
        }

        function setUserAttribute(key, value) {
            if (isInitialized) {
                try {
                    self.userAttributeHandler.onSetUserAttribute(
                        key,
                        value,
                        forwarderSettings
                    );
                    return 'Successfully set user attribute on forwarder ' + name;
                } catch (e) {
                    return (
                        'Error setting user attribute on forwarder ' +
                        name +
                        '; ' +
                        e
                    );
                }
            } else {
                return (
                    "Can't set user attribute on forwarder " +
                    name +
                    ', not initialized'
                );
            }
        }

        function removeUserAttribute(key) {
            if (isInitialized) {
                try {
                    self.userAttributeHandler.onRemoveUserAttribute(
                        key,
                        forwarderSettings
                    );
                    return (
                        'Successfully removed user attribute on forwarder ' + name
                    );
                } catch (e) {
                    return (
                        'Error removing user attribute on forwarder ' +
                        name +
                        '; ' +
                        e
                    );
                }
            } else {
                return (
                    "Can't remove user attribute on forwarder " +
                    name +
                    ', not initialized'
                );
            }
        }

        function setUserIdentity(id, type) {
            if (isInitialized) {
                try {
                    self.identityHandler.onSetUserIdentity(
                        forwarderSettings,
                        id,
                        type
                    );
                    return 'Successfully set user Identity on forwarder ' + name;
                } catch (e) {
                    return (
                        'Error removing user attribute on forwarder ' +
                        name +
                        '; ' +
                        e
                    );
                }
            } else {
                return (
                    "Can't call setUserIdentity on forwarder " +
                    name +
                    ', not initialized'
                );
            }
        }

        function onUserIdentified(user) {
            if (isInitialized) {
                try {
                    self.identityHandler.onUserIdentified(user);

                    return (
                        'Successfully called onUserIdentified on forwarder ' + name
                    );
                } catch (e) {
                    return {
                        error:
                            'Error calling onUserIdentified on forwarder ' +
                            name +
                            '; ' +
                            e,
                    };
                }
            } else {
                return (
                    "Can't set new user identities on forwader  " +
                    name +
                    ', not initialized'
                );
            }
        }

        function onIdentifyComplete(user, filteredIdentityRequest) {
            if (isInitialized) {
                try {
                    self.identityHandler.onIdentifyComplete(
                        user,
                        filteredIdentityRequest
                    );

                    return (
                        'Successfully called onIdentifyComplete on forwarder ' +
                        name
                    );
                } catch (e) {
                    return {
                        error:
                            'Error calling onIdentifyComplete on forwarder ' +
                            name +
                            '; ' +
                            e,
                    };
                }
            } else {
                return (
                    "Can't call onIdentifyCompleted on forwader  " +
                    name +
                    ', not initialized'
                );
            }
        }

        function onLoginComplete(user, filteredIdentityRequest) {
            if (isInitialized) {
                try {
                    self.identityHandler.onLoginComplete(
                        user,
                        filteredIdentityRequest
                    );

                    return (
                        'Successfully called onLoginComplete on forwarder ' + name
                    );
                } catch (e) {
                    return {
                        error:
                            'Error calling onLoginComplete on forwarder ' +
                            name +
                            '; ' +
                            e,
                    };
                }
            } else {
                return (
                    "Can't call onLoginComplete on forwader  " +
                    name +
                    ', not initialized'
                );
            }
        }

        function onLogoutComplete(user, filteredIdentityRequest) {
            if (isInitialized) {
                try {
                    self.identityHandler.onLogoutComplete(
                        user,
                        filteredIdentityRequest
                    );

                    return (
                        'Successfully called onLogoutComplete on forwarder ' + name
                    );
                } catch (e) {
                    return {
                        error:
                            'Error calling onLogoutComplete on forwarder ' +
                            name +
                            '; ' +
                            e,
                    };
                }
            } else {
                return (
                    "Can't call onLogoutComplete on forwader  " +
                    name +
                    ', not initialized'
                );
            }
        }

        function onModifyComplete(user, filteredIdentityRequest) {
            if (isInitialized) {
                try {
                    self.identityHandler.onModifyComplete(
                        user,
                        filteredIdentityRequest
                    );

                    return (
                        'Successfully called onModifyComplete on forwarder ' + name
                    );
                } catch (e) {
                    return {
                        error:
                            'Error calling onModifyComplete on forwarder ' +
                            name +
                            '; ' +
                            e,
                    };
                }
            } else {
                return (
                    "Can't call onModifyComplete on forwader  " +
                    name +
                    ', not initialized'
                );
            }
        }

        function setOptOut(isOptingOutBoolean) {
            if (isInitialized) {
                try {
                    self.initialization.setOptOut(isOptingOutBoolean);

                    return 'Successfully called setOptOut on forwarder ' + name;
                } catch (e) {
                    return {
                        error:
                            'Error calling setOptOut on forwarder ' +
                            name +
                            '; ' +
                            e,
                    };
                }
            } else {
                return (
                    "Can't call setOptOut on forwader  " +
                    name +
                    ', not initialized'
                );
            }
        }

        this.init = initForwarder;
        this.process = processEvent;
        this.setUserAttribute = setUserAttribute;
        this.removeUserAttribute = removeUserAttribute;
        this.onUserIdentified = onUserIdentified;
        this.setUserIdentity = setUserIdentity;
        this.onIdentifyComplete = onIdentifyComplete;
        this.onLoginComplete = onLoginComplete;
        this.onLogoutComplete = onLogoutComplete;
        this.onModifyComplete = onModifyComplete;
        this.setOptOut = setOptOut;
    };

    function getId() {
        return moduleId;
    }

    function isObject(val) {
        return (
            val != null && typeof val === 'object' && Array.isArray(val) === false
        );
    }

    function register(config) {
        if (!config) {
            console.log(
                'You must pass a config object to register the kit ' + name
            );
            return;
        }

        if (!isObject(config)) {
            console.log(
                "'config' must be an object. You passed in a " + typeof config
            );
            return;
        }

        if (isObject(config.kits)) {
            config.kits[name] = {
                constructor: constructor,
            };
        } else {
            config.kits = {};
            config.kits[name] = {
                constructor: constructor,
            };
        }
        console.log(
            'Successfully registered ' + name + ' to your mParticle configuration'
        );
    }

    if (typeof window !== 'undefined') {
        if (window && window.mParticle && window.mParticle.addForwarder) {
            window.mParticle.addForwarder({
                name: name,
                constructor: constructor,
                getId: getId,
            });
        }
    }

    var webKitWrapper = {
        register: register,
    };
    var webKitWrapper_1 = webKitWrapper.register;

    exports.default = webKitWrapper;
    exports.register = webKitWrapper_1;

    return exports;

}({}));
