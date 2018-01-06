var Helpers = require('./helpers'),
    Messages = require('./constants').Messages,
    Types = require('./types'),
    identify = require('./identity').identify,
    Persistence = require('./persistence'),
    MP = require('./mp'),
    logEvent = require('./events').logEvent;

function initialize() {
    if (MP.sessionId) {
        var sessionTimeoutInMilliseconds = MP.Config.SessionTimeout * 60000;

        if (new Date() > new Date(MP.dateLastEventSent.getTime() + sessionTimeoutInMilliseconds)) {
            this.endSession();
            this.startNewSession();
        }
    } else {
        this.startNewSession();
    }
}

function getSession() {
    return MP.sessionId;
}

function startNewSession() {
    Helpers.logDebug(Messages.InformationMessages.StartingNewSession);

    if (Helpers.canLog()) {
        identify(MP.initialIdentifyRequest);
        MP.sessionId = Helpers.generateUniqueId();
        if (MP.mpid) {
            MP.currentSessionMPIDs = [MP.mpid];
        }

        if (!MP.sessionStartDate) {
            var date = new Date();
            MP.sessionStartDate = date;
            MP.dateLastEventSent = date;
        }

        mParticle.sessionManager.setSessionTimer();

        logEvent(Types.MessageType.SessionStart);
    }
    else {
        Helpers.logDebug(Messages.InformationMessages.AbandonStartSession);
    }
}

function endSession(override) {
    Helpers.logDebug(Messages.InformationMessages.StartingEndSession);

    if (override) {
        logEvent(Types.MessageType.SessionEnd);

        MP.sessionId = null;
        MP.dateLastEventSent = null;
        MP.sessionAttributes = {};
        Persistence.update();
    } else if (Helpers.canLog()) {
        var sessionTimeoutInMilliseconds,
            cookies,
            timeSinceLastEventSent;

        cookies = Persistence.getCookie() || Persistence.getLocalStorage();

        if (!cookies.gs.sid) {
            Helpers.logDebug(Messages.InformationMessages.NoSessionToEnd);
            return;
        }

        // sessionId is not equal to cookies.sid if cookies.sid is changed in another tab
        if (cookies.gs.sid && MP.sessionId !== cookies.gs.sid) {
            MP.sessionId = cookies.gs.sid;
        }

        if (cookies && cookies.gs && cookies.gs.les) {
            sessionTimeoutInMilliseconds = MP.Config.SessionTimeout * 60000;
            var newDate = new Date().getTime();
            timeSinceLastEventSent = newDate - cookies.gs.les;

            if (timeSinceLastEventSent < sessionTimeoutInMilliseconds) {
                setSessionTimer();
            } else {
                logEvent(Types.MessageType.SessionEnd);

                MP.sessionId = null;
                MP.dateLastEventSent = null;
                MP.sessionStartDate = null;
                MP.sessionAttributes = {};
                Persistence.update();
            }
        }
    } else {
        Helpers.logDebug(Messages.InformationMessages.AbandonEndSession);
    }
}

function setSessionTimer() {
    var sessionTimeoutInMilliseconds = MP.Config.SessionTimeout * 60000;

    MP.globalTimer = window.setTimeout(function() {
        mParticle.sessionManager.endSession();
    }, sessionTimeoutInMilliseconds);
}

function resetSessionTimer() {
    if (!MP.sessionId) {
        startNewSession();
    }
    clearSessionTimeout();
    setSessionTimer();
}

function clearSessionTimeout() {
    clearTimeout(MP.globalTimer);
}

module.exports = {
    initialize: initialize,
    getSession: getSession,
    startNewSession: startNewSession,
    endSession: endSession,
    setSessionTimer: setSessionTimer,
    resetSessionTimer: resetSessionTimer,
    clearSessionTimeout: clearSessionTimeout
};
