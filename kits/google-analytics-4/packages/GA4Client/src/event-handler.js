function EventHandler(common) {
    this.common = common || {};
}

// TODO: https://mparticle-eng.atlassian.net/browse/SQDSDKS-5715
EventHandler.prototype.sendEventToGA4 = function (eventName, eventAttributes) {
    var standardizedEventName;
    var standardizedAttributes;
    if (this.common.forwarderSettings.enableDataCleansing) {
        standardizedEventName = this.common.standardizeName(eventName);
        standardizedAttributes =
            this.common.standardizeParameters(eventAttributes);
    } else {
        standardizedEventName = eventName;
        standardizedAttributes = eventAttributes;
    }

    standardizedAttributes = this.common.limitEventAttributes(
        standardizedAttributes
    );

    if (this.common.forwarderSettings.measurementId) {
        standardizedAttributes.send_to =
            this.common.forwarderSettings.measurementId;
    }

    gtag(
        'event',
        this.common.truncateEventName(standardizedEventName),
        this.common.truncateEventAttributes(standardizedAttributes)
    );
};

EventHandler.prototype.logEvent = function (event) {
    var eventConsentState = this.common.getEventConsentState(
        event.ConsentState
    );
    this.common.maybeSendConsentUpdateToGoogle(eventConsentState);
    this.sendEventToGA4(event.EventName, event.EventAttributes);
};

EventHandler.prototype.logError = function () {
    console.warn('Google Analytics 4 does not support error events.');
};

EventHandler.prototype.logPageView = function (event) {
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

module.exports = EventHandler;
