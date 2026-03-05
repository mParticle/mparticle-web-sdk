function EventHandler(common) {
    this.common = common || {};
}

EventHandler.prototype.logEvent = function (event) {
    var eventConsentState = this.common.getEventConsentState(
        event.ConsentState
    );
    this.common.maybeSendConsentUpdateToGoogle(eventConsentState);
    this.common.send({
        event: event,
    });

    return true;
};

EventHandler.prototype.logError = function() {};

EventHandler.prototype.logPageView = function (event) {
    var eventConsentState = this.common.getEventConsentState(
        event.ConsentState
    );
    this.common.maybeSendConsentUpdateToGoogle(eventConsentState);
    this.common.send({
        event: event,
        eventType: 'screen_view'
    });

    return true;
};

module.exports = EventHandler;
