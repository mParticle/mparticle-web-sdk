var common = require('./common');

var eventCounterTypes = {
    standard: 1,
    unique: 1,
    per_session: 1
};

function EventHandler(common) {
    this.common = common || {};
}

EventHandler.prototype.logEvent = function (event) {
    var eventConsentState = this.common.getEventConsentState(
        event.ConsentState
    );
    this.common.maybeSendConsentUpdateToGoogle(eventConsentState);

    var gtagProperties = {};
    this.common.setCustomVariables(event, gtagProperties);
    this.common.setCustomFields(event, gtagProperties);
    var eventMapping = this.common.getEventMapping(event);

    if (!eventMapping) {
        console.log('Event not mapped. Event not sent.');
        return false;
    }

    if (eventMapping.result && eventMapping.match) {
        var counter =
            event.CustomFlags && event.CustomFlags['DoubleClick.Counter']
                ? event.CustomFlags['DoubleClick.Counter']
                : null;
        if (!counter) {
            console.log(
                "Event not sent. Event conversions requires a custom flag of DoubleClick.Counter equal to 'standard', 'unique, or 'per_session'. See https://support.google.com/dcm/partner/answer/2823400?hl=en for more info"
            );
            return false;
        }
        if (eventCounterTypes[counter]) {
            this.common.setSendTo(
                eventMapping.match,
                event.CustomFlags,
                gtagProperties
            );
            gtagProperties.send_to += '+' + counter;
            this.common.sendGtag('conversion', gtagProperties);
        } else {
            console.log(
                "Counter type not valid. For event conversions, use 'standard', 'unique, or 'per_session'. See https://support.google.com/dcm/partner/answer/2823400?hl=en for more info"
            );
            return false;
        }
    }
    return true;
};
EventHandler.prototype.logError = function() {};
EventHandler.prototype.logPageView = function() {};

module.exports = EventHandler;
