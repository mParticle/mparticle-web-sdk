var Helpers = require('./helpers'),
    Messages = require('./constants').Messages,
    Types = require('./types'),
    identify = require('./identity').identify,
    Persistence = require('./persistence'),
    MP = require('./mp'),
    logEvent = require('./events').logEvent;

function initialize() {
    if (MP.sessionId) {
        var sessionTimeoutInSeconds = MP.Config.SessionTimeout * 60000;

        if (new Date() > new Date(MP.dateLastEventSent.getTime() + sessionTimeoutInSeconds)) {
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

        if (!MP.dateLastEventSent) {
            MP.dateLastEventSent = new Date();
        }

        mParticle.sessionManager.setSessionTimer();

        logEvent(Types.MessageType.SessionStart);
    }
    else {
        Helpers.logDebug(Messages.InformationMessages.AbandonStartSession);
    }
}

function endSession() {
    Helpers.logDebug(Messages.InformationMessages.StartingEndSession);

    if (Helpers.canLog()) {
        if (!MP.sessionId) {
            Helpers.logDebug(Messages.InformationMessages.NoSessionToEnd);
            return;
        }

        logEvent(Types.MessageType.SessionEnd);

        MP.sessionId = null;
        MP.dateLastEventSent = null;
        MP.sessionAttributes = {};
        Persistence.update();
    }
    else {
        Helpers.logDebug(Messages.InformationMessages.AbandonEndSession);
    }
}

function setSessionTimer() {
    var sessionTimeoutInSeconds = MP.Config.SessionTimeout * 60000;

    MP.globalTimer = window.setTimeout(function() {
        mParticle.sessionManager.endSession();
    }, sessionTimeoutInSeconds);
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
