// Google requires event and user attribute strings to have specific limits
// in place when sending to data layer.
// https://support.google.com/analytics/answer/11202874?sjid=7958830619827381593-NA

var ConsentHandler = require('./consent');

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

    this.consentHandler = new ConsentHandler(this);
}

Common.prototype.forwarderSettings = null;

Common.prototype.mergeObjects = function () {
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

Common.prototype.truncateAttributes = function (
    attributes,
    keyLimit,
    valueLimit
) {
    var truncatedAttributes = {};

    if (!isEmpty(attributes)) {
        Object.keys(attributes).forEach(function (attribute) {
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

Common.prototype.limitAttributes = function (attributes, limitNumber) {
    if (isEmpty(attributes)) {
        return {};
    }

    var attributeKeys = Object.keys(attributes);

    attributeKeys.sort();

    var limitedAttributes = attributeKeys
        .slice(0, limitNumber)
        .reduce(function (obj, key) {
            obj[key] = attributes[key];
            return obj;
        }, {});

    return limitedAttributes;
};

Common.prototype.limitEventAttributes = function (attributes) {
    return this.limitAttributes(attributes, EVENT_ATTRIBUTE_MAX_NUMBER);
};

Common.prototype.limitProductAttributes = function (attributes) {
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

Common.prototype.getEventConsentState = function (eventConsentState) {
    return eventConsentState && eventConsentState.getGDPRConsentState
        ? eventConsentState.getGDPRConsentState()
        : {};
};

Common.prototype.maybeSendConsentUpdateToGoogle = function (consentState) {
    // If consent payload is empty,
    // we never sent an initial default consent state
    // so we shouldn't send an update.
    if (
        this.consentPayloadAsString &&
        this.consentMappings &&
        !this.isEmpty(consentState)
    ) {
        var updatedConsentPayload =
            this.consentHandler.generateConsentStatePayloadFromMappings(
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

Common.prototype.sendDefaultConsentPayloadToGoogle = function (consentPayload) {
    this.consentPayloadAsString = JSON.stringify(consentPayload);

    gtag('consent', 'default', consentPayload);
};

Common.prototype.truncateEventName = function (eventName) {
    return truncateString(eventName, EVENT_NAME_MAX_LENGTH);
};

Common.prototype.truncateEventAttributes = function (eventAttributes) {
    return this.truncateAttributes(
        eventAttributes,
        EVENT_ATTRIBUTE_KEY_MAX_LENGTH,
        EVENT_ATTRIBUTE_VAL_MAX_LENGTH
    );
};

Common.prototype.standardizeParameters = function (parameters) {
    var standardizedParameters = {};
    for (var key in parameters) {
        var standardizedKey = this.standardizeName(key);
        standardizedParameters[standardizedKey] = parameters[key];
    }
    return standardizedParameters;
};

Common.prototype.standardizeName = function (name) {
    if (window.GoogleAnalytics4Kit.hasOwnProperty('setCustomNameStandardization')) {
        try {
            name = window.GoogleAnalytics4Kit.setCustomNameStandardization(name);
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

        FORBIDDEN_PREFIXES.forEach(function (prefix) {
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
        standardizedName =
            removeNonAlphabetCharacterFromStart(standardizedName);
        standardizedName = removeForbiddenPrefix(standardizedName);
    }

    return standardizedName;
};

Common.prototype.truncateUserAttributes = function (userAttributes) {
    return this.truncateAttributes(
        userAttributes,
        USER_ATTRIBUTE_KEY_MAX_LENGTH,
        USER_ATTRIBUTE_VALUE_MAX_LENGTH
    );
};

Common.prototype.getUserId = function (
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

Common.prototype.cloneObject = function (obj) {
    return JSON.parse(JSON.stringify(obj));
};

Common.prototype.isEmpty = isEmpty;

module.exports = Common;
