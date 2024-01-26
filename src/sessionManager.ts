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
                // QUESTION: Should we check for current user if we don't have persistence?
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
        // debugger;
        mpInstance.Logger.verbose(
            Messages.InformationMessages.StartingEndSession
        );

        if (override) {
            mpInstance._Events.logEvent({
                messageType: Types.MessageType.SessionEnd,
            });

            mpInstance._Store.nullifySession();
            return;
        }

        // debugger;

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

        // debugger;

        let sessionTimeoutInMilliseconds: number;
        let timeSinceLastEventSent: number;

        const persistence: IPersistenceMinified = mpInstance._Persistence.getPersistence();

        // debugger;

        // QUESTION: What constitutes ending a session if we don't have persistence?

        // If for some reason we do not have a session ID, there is no session to end
        if (
            !persistence?.gs?.sid &&
            !mpInstance._Store.sessionId
        ) {
            mpInstance.Logger.verbose(
                Messages.InformationMessages.NoSessionToEnd
            );
            return;
        }

        // If sessionId exists in persistence and is different than Store, persistence takes precedence
        // For example, if persistence changed in a separate browser instance or tab
        if (
            persistence?.gs &&
            persistence?.gs.sid &&
            mpInstance._Store.sessionId !== persistence.gs.sid
        ) {
            mpInstance._Store.sessionId = persistence.gs.sid;
        }

        // debugger;

        // Check Store for last time event was sent. If there is a different value in persistence,
        // use that and update the Store
        // TODO: Check if dateLastEventSent and return early if it does not exist
        let timeLastEventSent: number = mpInstance._Store.dateLastEventSent?.getTime();
        if (
            persistence?.gs &&
            persistence?.gs.les &&
            timeLastEventSent !== persistence.gs.les
        ) {
            timeLastEventSent = persistence.gs.les;
            mpInstance._Store.dateLastEventSent = new Date(persistence.gs.les);
        }

        // debugger;

        if (timeLastEventSent) {
            sessionTimeoutInMilliseconds =
                mpInstance._Store.SDKConfig.sessionTimeout * 60000;
            const newDate: number = new Date().getTime();
            timeSinceLastEventSent = newDate - timeLastEventSent;

            if (timeSinceLastEventSent < sessionTimeoutInMilliseconds) {
                self.setSessionTimer();
            } else {
                mpInstance._Events.logEvent({
                    messageType: Types.MessageType.SessionEnd,
                });

                mpInstance._Store.nullifySession();
            }
        }
    };

    this.setSessionTimer = function(): void {
        const sessionTimeoutInMilliseconds: number =
            mpInstance._Store.SDKConfig.sessionTimeout * 60000;

        mpInstance._Store.globalTimer = window.setTimeout(function() {
            // TODO: kill this global timer when ending session
            // debugger;
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

            if (
                persistence?.gs &&
                persistence?.gs.sid &&
                mpInstance._Store.sessionId !== persistence.gs.sid
            ) {
                mpInstance._Store.sessionId = persistence.gs.sid;
            }

            // TODO: Make this a store method
            if (!mpInstance._Store.sessionId) {
                self.startNewSession();
            }
        }
    };
}
