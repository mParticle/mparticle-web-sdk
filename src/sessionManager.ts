import { MPID } from '@mparticle/web-sdk';
import Constants from './constants';
import { IPersistenceMinified } from './persistence.interfaces';
import { MParticleUser, MParticleWebSDK } from './sdkRuntimeModels';
import Types from './types';
import { generateDeprecationMessage } from './utils';

const { Messages } = Constants;

export interface ISessionManager {
    initialize: () => void;
    getSessionId: () => string;
    startNewSession: () => void;
    endSession: (override?: boolean) => void;
    setSessionTimer: () => void;
    resetSessionTimer: () => void;
    clearSessionTimeout: () => void;
    startNewSessionIfNeeded: () => void;

    /**
     * @deprecated
     */
    getSession: () => string;
}

export default function SessionManager(
    this: ISessionManager,
    mpInstance: MParticleWebSDK
) {
    const self = this;

    this.initialize = function(): void {
        if (mpInstance._Store.sessionId) {
            const sessionTimeoutInMilliseconds: number =
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
                // https://go.mparticle.com/work/SQDSDKS-6045
                const persistence: IPersistenceMinified = mpInstance._Persistence.getPersistence();
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

    this.getSession = function(): string {
        mpInstance.Logger.warning(
            generateDeprecationMessage(
                'SessionManager.getSession()',

                'SessionManager.getSessionId()'
            )
        );
        return this.getSessionId();
    };

    this.getSessionId = function(): string {
        return mpInstance._Store.sessionId;
    };

    this.startNewSession = function(): void {
        mpInstance.Logger.verbose(
            Messages.InformationMessages.StartingNewSession
        );

        if (mpInstance._Helpers.canLog()) {
            mpInstance._Store.sessionId = mpInstance._Helpers
                .generateUniqueId()
                .toUpperCase();

            const currentUser: MParticleUser = mpInstance.Identity.getCurrentUser();
            const mpid: MPID = currentUser ? currentUser.getMPID() : null;

            if (mpid) {
                mpInstance._Store.currentSessionMPIDs = [mpid];
            }

            if (!mpInstance._Store.sessionStartDate) {
                const date: Date = new Date();
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

    this.endSession = function(override: boolean): void {
        mpInstance.Logger.verbose(
            Messages.InformationMessages.StartingEndSession
        );

        if (override) {
            mpInstance._Events.logEvent({
                messageType: Types.MessageType.SessionEnd,
            });

            nullifySession();
            return;
        }

        if (!mpInstance._Helpers.canLog()) {
            // At this moment, an AbandonedEndSession is defined when on of three things occurs:
            // - the SDK's store is not enabled because mParticle.setOptOut was called
            // - the devToken is undefined
            // - webviewBridgeEnabled is set to false
            mpInstance.Logger.verbose(
                Messages.InformationMessages.AbandonEndSession
            );
            return;
        }

        let sessionTimeoutInMilliseconds: number;
        let timeSinceLastEventSent: number;

        const cookies: IPersistenceMinified = mpInstance._Persistence.getPersistence();

        if (!cookies || cookies.gs && !cookies.gs.sid) {
            mpInstance.Logger.verbose(
                Messages.InformationMessages.NoSessionToEnd
            );
            return;
        }

        // sessionId is not equal to cookies.sid if cookies.sid is changed in another tab
        if (cookies.gs.sid && mpInstance._Store.sessionId !== cookies.gs.sid) {
            mpInstance._Store.sessionId = cookies.gs.sid;
        }

        if (cookies?.gs?.les) {
            sessionTimeoutInMilliseconds =
                mpInstance._Store.SDKConfig.sessionTimeout * 60000;
            const newDate: number = new Date().getTime();
            timeSinceLastEventSent = newDate - cookies.gs.les;

            if (timeSinceLastEventSent < sessionTimeoutInMilliseconds) {
                self.setSessionTimer();
            } else {
                mpInstance._Events.logEvent({
                    messageType: Types.MessageType.SessionEnd,
                });

                mpInstance._Store.sessionStartDate = null;
                nullifySession();
            }
        }
    };

    this.setSessionTimer = function(): void {
        const sessionTimeoutInMilliseconds: number =
            mpInstance._Store.SDKConfig.sessionTimeout * 60000;

        mpInstance._Store.globalTimer = window.setTimeout(function() {
            self.endSession();
        }, sessionTimeoutInMilliseconds);
    };

    this.resetSessionTimer = function(): void {
        if (!mpInstance._Store.webviewBridgeEnabled) {
            if (!mpInstance._Store.sessionId) {
                self.startNewSession();
            }
            self.clearSessionTimeout();
            self.setSessionTimer();
        }
        self.startNewSessionIfNeeded();
    };

    this.clearSessionTimeout = function(): void {
        clearTimeout(mpInstance._Store.globalTimer);
    };

    this.startNewSessionIfNeeded = function(): void {
        if (!mpInstance._Store.webviewBridgeEnabled) {
            const persistence = mpInstance._Persistence.getPersistence();

            if (!mpInstance._Store.sessionId && persistence) {
                if (persistence.sid) {
                    mpInstance._Store.sessionId = persistence.sid;
                } else {
                    self.startNewSession();
                }
            }
        }
    };

    function nullifySession(): void {
        mpInstance._Store.sessionId = null;
        mpInstance._Store.dateLastEventSent = null;
        mpInstance._Store.sessionAttributes = {};
        mpInstance._Persistence.update();
    }
}
