import Helpers from './helpers';
import Constants from './constants';
import Types from './types';
import Identity from './identity';
import Persistence from './persistence';
import Events from './events';

var IdentityAPI = Identity.IdentityAPI,
    Messages = Constants.Messages,
    logEvent = Events.logEvent;

function initialize() {
    if (mParticle.Store.sessionId) {
        var sessionTimeoutInMilliseconds = mParticle.Store.SDKConfig.sessionTimeout * 60000;

        if (new Date() > new Date(mParticle.Store.dateLastEventSent.getTime() + sessionTimeoutInMilliseconds)) {
            endSession();
            startNewSession();
        } else {
            var cookies = Persistence.getPersistence();
            if (cookies && !cookies.cu) {
                IdentityAPI.identify(mParticle.Store.SDKConfig.identifyRequest, mParticle.Store.SDKConfig.identityCallback);
                mParticle.Store.identifyCalled = true;
                mParticle.Store.SDKConfig.identityCallback = null;
            }
        }
    } else {
        startNewSession();
    }
}

function getSession() {
    return mParticle.Store.sessionId;
}

function startNewSession() {
    mParticle.Logger.verbose(Messages.InformationMessages.StartingNewSession);

    if (Helpers.canLog()) {
        mParticle.Store.sessionId = Helpers.generateUniqueId().toUpperCase();
        var currentUser = mParticle.Identity.getCurrentUser(),
            mpid = currentUser ? currentUser.getMPID() : null;
        if (mpid) {
            mParticle.Store.currentSessionMPIDs = [mpid];
        }

        if (!mParticle.Store.sessionStartDate) {
            var date = new Date();
            mParticle.Store.sessionStartDate = date;
            mParticle.Store.dateLastEventSent = date;
        }

        setSessionTimer();

        if (!mParticle.Store.identifyCalled) {
            IdentityAPI.identify(mParticle.Store.SDKConfig.identifyRequest, mParticle.Store.SDKConfig.identityCallback);
            mParticle.Store.identifyCalled = true;
            mParticle.Store.SDKConfig.identityCallback = null;
        }

        logEvent(Types.MessageType.SessionStart);
    }
    else {
        mParticle.Logger.verbose(Messages.InformationMessages.AbandonStartSession);
    }
}

function endSession(override) {
    mParticle.Logger.verbose(Messages.InformationMessages.StartingEndSession);

    if (override) {
        logEvent(Types.MessageType.SessionEnd);

        mParticle.Store.sessionId = null;
        mParticle.Store.dateLastEventSent = null;
        mParticle.Store.sessionAttributes = {};
        Persistence.update();
    } else if (Helpers.canLog()) {
        var sessionTimeoutInMilliseconds,
            cookies,
            timeSinceLastEventSent;

        cookies = Persistence.getCookie() || Persistence.getLocalStorage();

        if (!cookies) {
            return;
        }

        if (cookies.gs && !cookies.gs.sid) {
            mParticle.Logger.verbose(Messages.InformationMessages.NoSessionToEnd);
            return;
        }

        // sessionId is not equal to cookies.sid if cookies.sid is changed in another tab
        if (cookies.gs.sid && mParticle.Store.sessionId !== cookies.gs.sid) {
            mParticle.Store.sessionId = cookies.gs.sid;
        }

        if (cookies.gs && cookies.gs.les) {
            sessionTimeoutInMilliseconds = mParticle.Store.SDKConfig.sessionTimeout * 60000;
            var newDate = new Date().getTime();
            timeSinceLastEventSent = newDate - cookies.gs.les;

            if (timeSinceLastEventSent < sessionTimeoutInMilliseconds) {
                setSessionTimer();
            } else {
                logEvent(Types.MessageType.SessionEnd);

                mParticle.Store.sessionId = null;
                mParticle.Store.dateLastEventSent = null;
                mParticle.Store.sessionStartDate = null;
                mParticle.Store.sessionAttributes = {};
                Persistence.update();
            }
        }
    } else {
        mParticle.Logger.verbose(Messages.InformationMessages.AbandonEndSession);
    }
}

function setSessionTimer() {
    var sessionTimeoutInMilliseconds = mParticle.Store.SDKConfig.sessionTimeout * 60000;

    mParticle.Store.globalTimer = window.setTimeout(function() {
        endSession();
    }, sessionTimeoutInMilliseconds);
}

function resetSessionTimer() {
    if (!mParticle.Store.webviewBridgeEnabled) {
        if (!mParticle.Store.sessionId) {
            startNewSession();
        }
        clearSessionTimeout();
        setSessionTimer();
    }
    startNewSessionIfNeeded();
}

function clearSessionTimeout() {
    clearTimeout(mParticle.Store.globalTimer);
}

function startNewSessionIfNeeded() {
    if (!mParticle.Store.webviewBridgeEnabled) {
        var cookies = Persistence.getCookie() || Persistence.getLocalStorage();

        if (!mParticle.Store.sessionId && cookies) {
            if (cookies.sid) {
                mParticle.Store.sessionId = cookies.sid;
            } else {
                startNewSession();
            }
        }
    }
}

export default {
    initialize: initialize,
    getSession: getSession,
    startNewSession: startNewSession,
    endSession: endSession,
    setSessionTimer: setSessionTimer,
    resetSessionTimer: resetSessionTimer,
    clearSessionTimeout: clearSessionTimeout
};