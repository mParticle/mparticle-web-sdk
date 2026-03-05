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
];

function ConsentHandler(common) {
    this.common = common || {};
}

ConsentHandler.prototype.getUserConsentState = function () {
    var userConsentState = {};

    if (mParticle.Identity && mParticle.Identity.getCurrentUser) {
        var currentUser = mParticle.Identity.getCurrentUser();

        if (!currentUser) {
            return {};
        }

        var consentState =
            mParticle.Identity.getCurrentUser().getConsentState();

        if (consentState && consentState.getGDPRConsentState) {
            userConsentState = consentState.getGDPRConsentState();
        }
    }

    return userConsentState;
};

ConsentHandler.prototype.getConsentSettings = function () {
    var consentSettings = {};

    var googleToMpConsentSettingsMapping = {
        ad_user_data: 'defaultAdUserDataConsentWeb',
        ad_personalization: 'defaultAdPersonalizationConsentWeb',
        ad_storage: 'defaultAdStorageConsentWeb',
        analytics_storage: 'defaultAnalyticsStorageConsentWeb',
    };

    var settings = this.common.settings;

    Object.keys(googleToMpConsentSettingsMapping).forEach(function (
        googleConsentKey
    ) {
        var mpConsentSettingKey =
            googleToMpConsentSettingsMapping[googleConsentKey];
        var googleConsentValuesKey = settings[mpConsentSettingKey];

        if (googleConsentValuesKey && mpConsentSettingKey) {
            consentSettings[googleConsentKey] =
                googleConsentValues[googleConsentValuesKey];
        }
    });

    return consentSettings;
};

ConsentHandler.prototype.generateConsentStatePayloadFromMappings = function (
    consentState,
    mappings
) {
    if (!mappings) return {};

    var payload = this.common.cloneObject(this.common.consentPayloadDefaults);

    for (var i = 0; i <= mappings.length - 1; i++) {
        var mappingEntry = mappings[i];
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

module.exports = ConsentHandler;
