function EventHandler(common) {
    this.common = common || {};
}

EventHandler.prototype.logEvent = function(event) {
    var MBOXNAME = event.CustomFlags['ADOBETARGET.MBOX'];
    var successHandler = event.CustomFlags['ADOBETARGET.SUCCESS'];
    var errorHandler = event.CustomFlags['ADOBETARGET.ERROR'];
    var getOffer = event.CustomFlags['ADOBETARGET.GETOFFER'];
    var timeout = event.CustomFlags['ADOBETARGET.TIMEOUT'];

    if (!MBOXNAME) {
        console.warn(
            'ADOBE.MBOX not passed as custom flag; not forwarding to Adobe Target'
        );
        return false;
    }

    var params = {};
    for (var key in event.EventAttributes) {
        params[key] = event.EventAttributes[key];
    }

    var options = {
        mbox: MBOXNAME,
        params: params,
    };

    if (timeout) {
        options.timeout = timeout;
    }

    // an event is either a getOffer event or a trackEvent event
    if (getOffer) {
        options.success = function(offer) {
            window.adobe.target.applyOffer(offer);
            if (successHandler && typeof successHandler === 'function') {
                successHandler(offer);
            }
        };
        options.error = function(status, error) {
            if (errorHandler && typeof errorHandler === 'function') {
                errorHandler(status, error);
            }
        };
        window.adobe.target.getOffer(options);
    } else {
        var selector = event.CustomFlags['ADOBETARGET.SELECTOR'];
        var type = event.CustomFlags['ADOBETARGET.TYPE'];
        var preventDefault = event.CustomFlags['ADOBETARGET.PREVENTDEFAULT'];

        if (selector) {
            options.selector = selector;
        }
        if (type) {
            options.type = type;
        }
        if (preventDefault) {
            options.preventDefault = preventDefault;
        }

        window.adobe.target.trackEvent(options);
    }

    return true;
};

EventHandler.prototype.logError = function() {};

EventHandler.prototype.logPageView = function(event) {
    this.logEvent(event);
};

module.exports = EventHandler;
