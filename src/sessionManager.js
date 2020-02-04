import Constants from './constants';
import Types from './types';

var Messages = Constants.Messages;

function SessionManager(mpInstance) {
    var self = this;
    this.initialize = function() {
        if (mpInstance._Store.sessionId) {
            var sessionTimeoutInMilliseconds =
                mpInstance._Store.SDKConfig.sessionTimeout * 60000;

            if (
                new Date() >
                new Date(
                    mpInstance._Store.dateLastEventSent.getTime() +
                        sessionTimeoutInMilliseconds
                )
            ) {
                self.endSession();
                self.startNewSession();
            } else {
                var persistence = mpInstance._Persistence.getPersistence();
                if (persistence && !persistence.cu) {
                    mpInstance.Identity.identify(
                        mpInstance._Store.SDKConfig.identifyRequest,
                        mpInstance._Store.SDKConfig.identityCallback
                    );
                    mpInstance._Store.identifyCalled = true;
                    mpInstance._Store.SDKConfig.identityCallback = null;
                }
            }
        } else {
            self.startNewSession();
        }
    };

    this.getSession = function() {
        return mpInstance._Store.sessionId;
    };

    this.startNewSession = function() {
        mpInstance.Logger.verbose(
            Messages.InformationMessages.StartingNewSession
        );

        if (mpInstance._Helpers.canLog()) {
            mpInstance._Store.sessionId = mpInstance._Helpers
                .generateUniqueId()
                .toUpperCase();
            var currentUser = mpInstance.Identity.getCurrentUser(),
                mpid = currentUser ? currentUser.getMPID() : null;
            if (mpid) {
                mpInstance._Store.currentSessionMPIDs = [mpid];
            }

            if (!mpInstance._Store.sessionStartDate) {
                var date = new Date();
                mpInstance._Store.sessionStartDate = date;
                mpInstance._Store.dateLastEventSent = date;
            }

            self.setSessionTimer();

            if (!mpInstance._Store.identifyCalled) {
                mpInstance.Identity.identify(
                    mpInstance._Store.SDKConfig.identifyRequest,
                    mpInstance._Store.SDKConfig.identityCallback
                );
                mpInstance._Store.identifyCalled = true;
                mpInstance._Store.SDKConfig.identityCallback = null;
            }

            mpInstance._Events.logEvent({
                messageType: Types.MessageType.SessionStart,
            });
        } else {
            mpInstance.Logger.verbose(
                Messages.InformationMessages.AbandonStartSession
            );
        }
    };

    this.endSession = function(override) {
        mpInstance.Logger.verbose(
            Messages.InformationMessages.StartingEndSession
        );

        if (override) {
            mpInstance._Events.logEvent({
                messageType: Types.MessageType.SessionEnd,
            });

            mpInstance._Store.sessionId = null;
            mpInstance._Store.dateLastEventSent = null;
            mpInstance._Store.sessionAttributes = {};
            mpInstance._Persistence.update();
        } else if (mpInstance._Helpers.canLog()) {
            var sessionTimeoutInMilliseconds, cookies, timeSinceLastEventSent;

            cookies = mpInstance._Persistence.getPersistence();

            if (!cookies) {
                return;
            }

            if (cookies.gs && !cookies.gs.sid) {
                mpInstance.Logger.verbose(
                    Messages.InformationMessages.NoSessionToEnd
                );
                return;
            }

            // sessionId is not equal to cookies.sid if cookies.sid is changed in another tab
            if (
                cookies.gs.sid &&
                mpInstance._Store.sessionId !== cookies.gs.sid
            ) {
                mpInstance._Store.sessionId = cookies.gs.sid;
            }

            if (cookies.gs && cookies.gs.les) {
                sessionTimeoutInMilliseconds =
                    mpInstance._Store.SDKConfig.sessionTimeout * 60000;
                var newDate = new Date().getTime();
                timeSinceLastEventSent = newDate - cookies.gs.les;

                if (timeSinceLastEventSent < sessionTimeoutInMilliseconds) {
                    self.setSessionTimer();
                } else {
                    mpInstance._Events.logEvent({
                        messageType: Types.MessageType.SessionEnd,
                    });

                    mpInstance._Store.sessionId = null;
                    mpInstance._Store.dateLastEventSent = null;
                    mpInstance._Store.sessionStartDate = null;
                    mpInstance._Store.sessionAttributes = {};
                    mpInstance._Persistence.update();
                }
            }
        } else {
            mpInstance.Logger.verbose(
                Messages.InformationMessages.AbandonEndSession
            );
        }
    };

    this.setSessionTimer = function() {
        var sessionTimeoutInMilliseconds =
            mpInstance._Store.SDKConfig.sessionTimeout * 60000;

        mpInstance._Store.globalTimer = window.setTimeout(function() {
            self.endSession();
        }, sessionTimeoutInMilliseconds);
    };

    this.resetSessionTimer = function() {
        if (!mpInstance._Store.webviewBridgeEnabled) {
            if (!mpInstance._Store.sessionId) {
                self.startNewSession();
            }
            self.clearSessionTimeout();
            self.setSessionTimer();
        }
        self.startNewSessionIfNeeded();
    };

    this.clearSessionTimeout = function() {
        clearTimeout(mpInstance._Store.globalTimer);
    };

    this.startNewSessionIfNeeded = function() {
        if (!mpInstance._Store.webviewBridgeEnabled) {
            var persistence = mpInstance._Persistence.getPersistence();

            if (!mpInstance._Store.sessionId && persistence) {
                if (persistence.sid) {
                    mpInstance._Store.sessionId = persistence.sid;
                } else {
                    self.startNewSession();
                }
            }
        }
    };
}

export default SessionManager;
