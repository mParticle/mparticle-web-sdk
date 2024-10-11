import Utils from './config/utils';
const { waitForCondition, fetchMockSuccess } = Utils;
import sinon from 'sinon';
import { expect } from 'chai';
import { MParticleWebSDK } from '../../src/sdkRuntimeModels';
import {
    apiKey,
    MPConfig,
    testMPID,
    urls,
    MessageType,
} from './config/constants';
import { IdentityApiData } from '@mparticle/web-sdk';
import { MILLIS_IN_ONE_SEC } from '../../src/constants';
import Constants from '../../src/constants';

const { Messages } = Constants;

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}

const mParticle = window.mParticle;

describe('SessionManager', () => {
    const now = new Date();
    let clock;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        clock = sinon.useFakeTimers(now.getTime());

        fetchMockSuccess(urls.identify, {
            mpid: testMPID, is_logged_in: false
        });
    });

    afterEach(function() {
        sandbox.restore();
        clock.restore();
        mParticle._resetForTests(MPConfig);
    });

    describe('Unit Tests', () => {
        describe('#initialize', () => {
            beforeEach(() => {
                // Change timeout to 10 minutes so we can make sure defaults are not in use
                window.mParticle.config.sessionTimeout = 10;
            });

            it('starts a new session if Store does not contain a sessionId', () => {
                const generateUniqueIdSpy = sinon.stub(
                    mParticle.getInstance()._Helpers,
                    'generateUniqueId'
                );
                generateUniqueIdSpy.returns('test-unique-id');

                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();

                mpInstance._Store.sessionId = '';
                expect(mpInstance._Store.sessionId).to.be.empty;

                mpInstance._SessionManager.initialize();
                expect(mpInstance._Store.sessionId).to.equal('TEST-UNIQUE-ID');
            });

            it('ends the previous session and creates a new session if Store contains a sessionId and dateLastEventSent beyond the timeout window', () => {
                const timePassed = 11 * (MILLIS_IN_ONE_SEC * 60);

                const generateUniqueIdSpy = sinon.stub(
                    mParticle.getInstance()._Helpers,
                    'generateUniqueId'
                );
                generateUniqueIdSpy.returns('test-unique-id');

                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();

                mpInstance._Store.sessionId = 'OLD-ID';

                const timeLastEventSent = mpInstance._Store.dateLastEventSent.getTime();
                mpInstance._Store.dateLastEventSent = new Date(
                    timeLastEventSent - timePassed
                );

                mpInstance._SessionManager.initialize();
                expect(mpInstance._Store.sessionId).to.equal('TEST-UNIQUE-ID');
            });

            it('resumes the previous session if session ID exists and dateLastSent is within the timeout window', () => {
                const timePassed = 8 * (MILLIS_IN_ONE_SEC * 60);

                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();

                mParticle.getInstance()._Store.sessionId = 'OLD-ID';

                const timeLastEventSent = mpInstance._Store.dateLastEventSent.getTime();
                mpInstance._Store.dateLastEventSent = new Date(
                    timeLastEventSent - timePassed
                );

                mParticle.getInstance()._SessionManager.initialize();
                expect(mParticle.getInstance()._Store.sessionId).to.equal(
                    'OLD-ID'
                );
            });
        });

        describe('#getSession', () => {
            it('returns a Session ID from the Store', () => {
                mParticle.init(apiKey, window.mParticle.config);
                mParticle.getInstance()._Store.sessionId = 'foo';

                const sessionId: string = mParticle
                    .getInstance()
                    ._SessionManager.getSession();

                expect(sessionId).to.equal('foo');
            });

            it('should log a deprecation message', () => {
                mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = mParticle.getInstance();
                const consoleSpy = sinon.spy(mpInstance.Logger, 'warning');

                mpInstance._SessionManager.getSession();

                expect(consoleSpy.lastCall.firstArg).to.equal(
                    'SessionManager.getSession() is a deprecated method and will be removed in future releases SessionManager.getSessionId() is a deprecated method and will be removed in future releases'
                );
            });
        });

        describe('#getSessionId', () => {
            it('returns a Session ID from the Store', () => {
                mParticle.init(apiKey, window.mParticle.config);
                mParticle.getInstance()._Store.sessionId = 'foo';

                const sessionId: string = mParticle
                    .getInstance()
                    ._SessionManager.getSessionId();

                expect(sessionId).to.equal('foo');
            });
        });

        describe('#startNewSession', () => {
            it('should create a new session', () => {
                const generateUniqueIdSpy = sinon.stub(
                    mParticle.getInstance()._Helpers,
                    'generateUniqueId'
                );
                generateUniqueIdSpy.returns('new-session-id');

                mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = mParticle.getInstance();

                mpInstance._SessionManager.startNewSession();

                expect(mpInstance._Store.sessionId).to.equal('NEW-SESSION-ID');
                expect(mpInstance._Store.sessionStartDate).to.eql(now);
                expect(mpInstance._Store.dateLastEventSent).to.eql(now);
            });

            it('should log a session start event', () => {
                mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = mParticle.getInstance();
                const eventSpy = sinon.spy(mpInstance._Events, 'logEvent');

                mpInstance._SessionManager.startNewSession();

                expect(eventSpy.getCalls().length).to.equal(1);
                expect(eventSpy.getCall(0).firstArg).to.eql({
                    messageType: MessageType.SessionStart,
                });
            });

            it('should start a session timer', () => {
                mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = mParticle.getInstance();
                const timerSpy = sinon.spy(
                    mpInstance._SessionManager,
                    'setSessionTimer'
                );

                mpInstance._SessionManager.startNewSession();

                expect(timerSpy.getCalls().length).to.equal(1);
            });

            it('should update sessionStartDate if it does not exist', () => {
                mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = mParticle.getInstance();

                mpInstance._Store.sessionStartDate = null;
                mpInstance._SessionManager.startNewSession();

                expect(mpInstance._Store.sessionStartDate).to.eql(now);
            });

            it('should NOT update sessionStartDate if one already exists', () => {
                const dateInThePast = new Date(2015, 10, 21);

                mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = mParticle.getInstance();

                mpInstance._Store.sessionStartDate = dateInThePast;
                mpInstance._SessionManager.startNewSession();

                expect(mpInstance._Store.sessionStartDate).to.eql(
                    dateInThePast
                );
            });

            it('should update dateLastEventSent if sessionStartDate does not exist', () => {
                mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = mParticle.getInstance();

                mpInstance._Store.sessionStartDate = null;
                mpInstance._SessionManager.startNewSession();

                expect(mpInstance._Store.dateLastEventSent).to.eql(now);
            });

            it('should NOT update dateLastEventSent if sessionStartDate already exists', () => {
                const dateInThePast = new Date(2015, 10, 21);

                mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = mParticle.getInstance();

                mpInstance._Store.sessionStartDate = dateInThePast;

                expect(mpInstance._Store.dateLastEventSent).to.eql(now);

                mpInstance._SessionManager.startNewSession();

                expect(mpInstance._Store.dateLastEventSent).to.eql(now);
            });

            it('should call Identity.identify if Store.identifyCalled is false', () => {
                // `init` already sends an identify request and resets the identity callback,
                // To test this feature in isolation we will "reset" the identify
                // request and callback after init so we can test startNewSession
                // in isolation.

                const identityApiData: IdentityApiData = {
                    userIdentities: {
                        customerid: 'my-customer-id',
                    },
                };

                mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = mParticle.getInstance();
                const callbackSpy = sinon.spy();
                const identifySpy = sinon.spy(mpInstance.Identity, 'identify');

                mpInstance._Store.SDKConfig.identifyRequest = identityApiData;
                mpInstance._Store.SDKConfig.identityCallback = callbackSpy;
                mpInstance._Store.identifyCalled = false;
                mpInstance._SessionManager.startNewSession();

                expect(identifySpy.getCall(0).args[0]).to.eql(identityApiData);
                expect(identifySpy.getCall(0).args[1]).to.eql(callbackSpy);
                expect(callbackSpy.called).to.equal(true);
                expect(mpInstance._Store.identifyCalled).to.eql(true);
                expect(mpInstance._Store.SDKConfig.identityCallback).to.eql(
                    null
                );
            });
        });

        describe('#endSession', () => {
            it('should end a session', () => {
                mParticle.init(apiKey, window.mParticle.config);
                waitForCondition(() => {
                    return (
                        mParticle.Identity.getCurrentUser()?.getMPID() === testMPID
                    );
                })
                .then(() => {
                const mpInstance = mParticle.getInstance();
                const persistenceSpy = sinon.spy(
                    mpInstance._Persistence,
                    'update'
                );

                mpInstance._SessionManager.endSession();

                expect(mpInstance._Store.sessionId).to.equal(null);
                expect(mpInstance._Store.dateLastEventSent).to.equal(null);
                expect(mpInstance._Store.sessionAttributes).to.eql({});

                // Persistence isn't necessary for this feature, but we should test
                // to see that it is called in case this ever needs to be refactored
                expect(persistenceSpy.called).to.equal(true);
                });
            });

            it('should force a session end when override is used', () => {
                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();
                const persistenceSpy = sinon.spy(
                    mpInstance._Persistence,
                    'update'
                );

                mpInstance._SessionManager.endSession(true);

                expect(mpInstance._Store.sessionId).to.equal(null);
                expect(mpInstance._Store.dateLastEventSent).to.equal(null);
                expect(mpInstance._Store.sessionAttributes).to.eql({});

                // Persistence isn't necessary for this feature, but we should test
                // to see that it is called in case this ever needs to be refactored
                expect(persistenceSpy.called).to.equal(true);
            });

            it('should log  NoSessionToEnd Message  and return if Persistence is null', () => {
                mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = mParticle.getInstance();
                sinon
                    .stub(mpInstance._Persistence, 'getPersistence')
                    .returns(null);

                const consoleSpy = sinon.spy(mpInstance.Logger, 'verbose');

                mpInstance._SessionManager.endSession();

                // Should log initial StartingEndSession and NoSessionToEnd messages
                expect(consoleSpy.getCalls().length).to.equal(2);
                expect(consoleSpy.firstCall.firstArg).to.equal(
                    Messages.InformationMessages.StartingEndSession
                );
                expect(consoleSpy.lastCall.firstArg).to.equal(
                    Messages.InformationMessages.NoSessionToEnd
                );
            });

            it('should log a NoSessionToEnd Message if Persistence exists but does not return an sid', () => {
                mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = mParticle.getInstance();
                sinon
                    .stub(mpInstance._Persistence, 'getPersistence')
                    .returns({ gs: {} });

                const consoleSpy = sinon.spy(mpInstance.Logger, 'verbose');

                mpInstance._SessionManager.endSession();

                // Should log initial StartingEndSession and NoSessionToEnd messages
                expect(consoleSpy.getCalls().length).to.equal(2);
                expect(consoleSpy.lastCall.firstArg).to.equal(
                    Messages.InformationMessages.NoSessionToEnd
                );
            });

            it('should log an AbandonedEndSession message if SDK canLog() returns false', () => {
                mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = mParticle.getInstance();
                sinon
                    .stub(mpInstance._Persistence, 'getPersistence')
                    .returns({ gs: {} });

                sinon.stub(mpInstance._Helpers, 'canLog').returns(false);

                const consoleSpy = sinon.spy(mpInstance.Logger, 'verbose');

                mpInstance._SessionManager.endSession();

                // Should log initial StartingEndSession and AbandonEndSession messages
                expect(consoleSpy.getCalls().length).to.equal(2);
                expect(consoleSpy.lastCall.firstArg).to.equal(
                    Messages.InformationMessages.AbandonEndSession
                );
            });

            it('should log an AbandonedEndSession message if Store.isEnabled is false', () => {
                mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = mParticle.getInstance();
                sinon
                    .stub(mpInstance._Persistence, 'getPersistence')
                    .returns({ gs: {} });

                const consoleSpy = sinon.spy(mpInstance.Logger, 'verbose');

                mpInstance._Store.isEnabled = false;

                mpInstance._SessionManager.endSession();

                // Should log initial StartingEndSession and AbandonEndSession messagesk
                expect(consoleSpy.getCalls().length).to.equal(2);
                expect(consoleSpy.lastCall.firstArg).to.equal(
                    Messages.InformationMessages.AbandonEndSession
                );
            });

            it('should log AbandonEndSession message if webviewBridgeEnabled is false but Store.isEnabled is true and devToken is undefined', () => {
                mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = mParticle.getInstance();
                sinon
                    .stub(mpInstance._Persistence, 'getPersistence')
                    .returns({ gs: {} });

                const consoleSpy = sinon.spy(mpInstance.Logger, 'verbose');

                mpInstance._Store.isEnabled = true;
                mpInstance._Store.webviewBridgeEnabled = false;
                mpInstance._Store.devToken = undefined;

                mpInstance._SessionManager.endSession();

                // Should log initial StartingEndSession and AbandonEndSession messages
                expect(consoleSpy.getCalls().length).to.equal(2);
                expect(consoleSpy.lastCall.firstArg).to.equal(
                    Messages.InformationMessages.AbandonEndSession
                );
            });

            it('should log NoSessionToEnd message if webviewBridgeEnabled and Store.isEnabled are true but devToken is undefined', () => {
                mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = mParticle.getInstance();
                sinon
                    .stub(mpInstance._Persistence, 'getPersistence')
                    .returns({ gs: {} });

                const consoleSpy = sinon.spy(mpInstance.Logger, 'verbose');

                mpInstance._Store.isEnabled = true;
                mpInstance._Store.devToken = undefined;
                mpInstance._Store.webviewBridgeEnabled = true;

                mpInstance._SessionManager.endSession();

                // Should log initial StartingEndSession and NoSessionToEnd messages
                expect(consoleSpy.getCalls().length).to.equal(2);
                expect(consoleSpy.lastCall.firstArg).to.equal(
                    Messages.InformationMessages.NoSessionToEnd
                );
            });

            it('should prioritize cookie sessionId over Store.sessionId', () => {
                mParticle.init(apiKey, window.mParticle.config);

                const mpInstance = mParticle.getInstance();
                sinon.stub(mpInstance._Persistence, 'getPersistence').returns({
                    gs: {
                        sid: 'cookie-session-id',
                    },
                });

                mpInstance._Store.sessionId = 'store-session-id';

                mpInstance._SessionManager.endSession();

                expect(mpInstance._Store.sessionId).to.equal(
                    'cookie-session-id'
                );
            });

            it('should NOT end session if session has not timed out', () => {
                const now = new Date();
                // The default timeout limit is 30 minutes.
                const twentyMinutesAgo = new Date();
                twentyMinutesAgo.setMinutes(now.getMinutes() - 20);

                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();
                const timerSpy = sinon.spy(
                    mpInstance._SessionManager,
                    'setSessionTimer'
                );

                // Session Manager relies on persistence to determine last event sent (LES) time
                // Also requires sid to verify session exists
                sinon.stub(mpInstance._Persistence, 'getPersistence').returns({
                    gs: {
                        les: twentyMinutesAgo,
                        sid: 'fake-session-id',
                    },
                });

                mpInstance._SessionManager.endSession();

                // We are verifying that the session has not ended, and therefore the
                // session ID should still be the same, as opposed to null, which
                // is assigned when the session actually ends
                expect(mpInstance._Store.sessionId).to.equal('fake-session-id');

                // When session is not timed out, setSessionTimer is called to keep track
                // of current session timeout
                expect(timerSpy.getCalls().length).to.equal(1);
            });

            it('should end session if the session timeout limit has been reached', () => {
                const generateUniqueIdSpy = sinon.stub(
                    mParticle.getInstance()._Helpers,
                    'generateUniqueId'
                );
                generateUniqueIdSpy.returns('test-unique-id');

                const now = new Date();
                const twentyMinutesAgo = new Date();
                const hourAgo = new Date();
                twentyMinutesAgo.setMinutes(now.getMinutes() - 20);
                hourAgo.setMinutes(now.getMinutes() - 60);

                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();

                expect(mpInstance._Store.sessionId).to.equal('TEST-UNIQUE-ID');
                // Init will set dateLastEventSent to now, but endSession relies on the persistence layer
                expect(mpInstance._Store.dateLastEventSent).to.eql(now);
                expect(mpInstance._Store.sessionAttributes).to.eql({});

                const persistenceUpdateSpy = sinon.spy(
                    mpInstance._Persistence,
                    'update'
                );

                // Session Manager relies on persistence to determine last event seen (LES) time
                // Also requires sid to verify session exists
                const persistenceGetterStub = sinon
                    .stub(mpInstance._Persistence, 'getPersistence')
                    .returns({
                        gs: {
                            les: twentyMinutesAgo,
                            sid: 'TEST-UNIQUE-ID',
                        },
                    });

                // Fire end session before sessionTimeout window has been reached
                mpInstance._SessionManager.endSession();

                expect(mpInstance._Store.sessionId).to.equal('TEST-UNIQUE-ID');
                // Init will set dateLastEventSent to now, but endSession relies on the persistence layer
                expect(mpInstance._Store.dateLastEventSent).to.eql(now);
                expect(mpInstance._Store.sessionAttributes).to.eql({});

                // Session Manager relies on persistence to determine last time seen (LES)
                // Also requires sid to verify session exists
                persistenceGetterStub.returns({
                    gs: {
                        les: hourAgo,
                        sid: 'TEST-UNIQUE-ID',
                    },
                });

                mpInstance._SessionManager.endSession();

                expect(mpInstance._Store.sessionId).to.equal(null);
                expect(mpInstance._Store.dateLastEventSent).to.equal(null);
                expect(mpInstance._Store.sessionAttributes).to.eql({});

                // Persistence isn't necessary for this feature, but we should test
                // to see that it is called in case this ever needs to be refactored
                expect(persistenceUpdateSpy.called).to.equal(true);
            });
        });

        describe('#setSessionTimer', () => {
            it('should end a session after the timeout expires', () => {
                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();
                const endSessionSpy = sinon.spy(
                    mpInstance._SessionManager,
                    'endSession'
                );

                // Start Timer
                mpInstance._SessionManager.setSessionTimer();

                // Progress 29 minutes to make sure end session has not fired
                clock.tick(29 * (MILLIS_IN_ONE_SEC * 60));
                expect(endSessionSpy.called).to.equal(false);

                // Progress one minute to make sure end session fires
                clock.tick(1 * (MILLIS_IN_ONE_SEC * 60));
                expect(endSessionSpy.called).to.equal(true);
            });

            it('should set a global timer', () => {
                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();

                // Manually clear global timer since it gets set during init
                mpInstance._Store.globalTimer = null;
                expect(mpInstance._Store.globalTimer).to.eq(null);

                mpInstance._SessionManager.setSessionTimer();
                expect(mpInstance._Store.globalTimer).to.be.ok;
            });
        });

        describe('#resetSessionTimer', () => {
            it('should call startNewSession if sessionId is not defined', () => {
                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();

                mpInstance._Store.sessionId = null;

                const startNewSessionSpy = sinon.spy(
                    mpInstance._SessionManager,
                    'startNewSession'
                );

                mpInstance._SessionManager.resetSessionTimer();
                expect(startNewSessionSpy.called).to.equal(true);
            });

            it('should NOT call startNewSession if sessionId is defined', () => {
                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();

                mpInstance._Store.sessionId = 'test-session-id';

                const startNewSessionSpy = sinon.spy(
                    mpInstance._SessionManager,
                    'startNewSession'
                );

                mpInstance._SessionManager.resetSessionTimer();
                expect(startNewSessionSpy.called).to.equal(false);
            });

            it('should NOT restart a session if webviewBridgeEnabled is true', () => {
                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();

                mpInstance._Store.webviewBridgeEnabled = true;

                const startNewSessionSpy = sinon.spy(
                    mpInstance._SessionManager,
                    'startNewSession'
                );
                const clearSessionTimeoutSpy = sinon.spy(
                    mpInstance._SessionManager,
                    'clearSessionTimeout'
                );
                const setSessionTimerSpy = sinon.spy(
                    mpInstance._SessionManager,
                    'setSessionTimer'
                );

                mpInstance._SessionManager.resetSessionTimer();
                expect(startNewSessionSpy.called).to.equal(false);
                expect(clearSessionTimeoutSpy.called).to.equal(false);
                expect(setSessionTimerSpy.called).to.equal(false);
            });

            it('should reset session timer by calling clearSessionTimeout and setSessionTimer', () => {
                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();

                const clearSessionTimeoutSpy = sinon.spy(
                    mpInstance._SessionManager,
                    'clearSessionTimeout'
                );
                const setSessionTimerSpy = sinon.spy(
                    mpInstance._SessionManager,
                    'setSessionTimer'
                );

                mpInstance._SessionManager.resetSessionTimer();
                expect(clearSessionTimeoutSpy.called).to.equal(true);
                expect(setSessionTimerSpy.called).to.equal(true);
            });

            it('should call startNewSessionIfNeeded', () => {
                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();

                const startNewSessionIfNeededSpy = sinon.spy(
                    mpInstance._SessionManager,
                    'startNewSessionIfNeeded'
                );

                expect(startNewSessionIfNeededSpy.called).to.equal(false);

                mpInstance._SessionManager.resetSessionTimer();
                expect(startNewSessionIfNeededSpy.called).to.equal(true);
            });
        });

        describe('#clearSessionTimer', () => {
            it('should call clearTimeout', () => {
                const clearTimeoutSpy = sinon.spy(window, 'clearTimeout');

                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();

                expect(clearTimeoutSpy.called).to.equal(false);
                mpInstance._SessionManager.clearSessionTimeout();
                expect(clearTimeoutSpy.called).to.equal(true);
            });
        });

        describe('startNewSessionIfNeeded', () => {
            it('should call startNewSession if sessionId is not available from Persistence', () => {
                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();

                // Session Manager relies on persistence check sid (Session ID)
                sinon.stub(mpInstance._Persistence, 'getPersistence').returns({
                    gs: {
                        sid: null,
                    },
                });

                mpInstance._Store.sessionId = null;

                const startNewSessionSpy = sinon.spy(
                    mpInstance._SessionManager,
                    'startNewSession'
                );

                mpInstance._SessionManager.startNewSessionIfNeeded();
                expect(startNewSessionSpy.called).to.equal(true);
            });

            it('should NOT call startNewSession if sessionId is undefined and Persistence is undefined', () => {
                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();

                // Session Manager relies on persistence check sid (Session ID)
                // However, if persistence is undefined, this will not create a
                // new session
                sinon
                    .stub(mpInstance._Persistence, 'getPersistence')
                    .returns(null);

                mpInstance._Store.sessionId = undefined;

                const startNewSessionSpy = sinon.spy(
                    mpInstance._SessionManager,
                    'startNewSession'
                );

                mpInstance._SessionManager.startNewSessionIfNeeded();
                expect(startNewSessionSpy.called).to.equal(false);
            });

            it('should override Store.sessionId from Persistence', () => {
                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();

                // Session Manager relies on persistence check sid (Session ID)
                sinon.stub(mpInstance._Persistence, 'getPersistence').returns({
                    gs: {
                        sid: 'sid-from-persistence',
                    },
                });

                mpInstance._Store.sessionId = 'sid-from-store';

                mpInstance._SessionManager.startNewSessionIfNeeded();

                mpInstance._Store.sessionId = 'sid-from-persistence';
            });

            it('should set sessionId from Persistence if Store.sessionId is undefined', () => {
                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();

                // Session Manager relies on persistence check sid (Session ID)
                sinon.stub(mpInstance._Persistence, 'getPersistence').returns({
                    gs: {
                        sid: 'sid-from-persistence',
                    },
                });

                const startNewSessionSpy = sinon.spy(
                    mpInstance._SessionManager,
                    'startNewSession'
                );

                mpInstance._Store.sessionId = undefined;

                mpInstance._SessionManager.startNewSessionIfNeeded();

                mpInstance._Store.sessionId = 'sid-from-persistence';

                expect(startNewSessionSpy.called).to.equal(true);
            });

            it('should NOT call startNewSession if Store.sessionId and Persistence are null', () => {
                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();

                // Session Manager relies on persistence check sid (Session ID)
                sinon
                    .stub(mpInstance._Persistence, 'getPersistence')
                    .returns(null);

                const startNewSessionSpy = sinon.spy(
                    mpInstance._SessionManager,
                    'startNewSession'
                );

                mpInstance._Store.sessionId = null;

                mpInstance._SessionManager.startNewSessionIfNeeded();

                expect(startNewSessionSpy.called).to.equal(false);
            });

            it('should NOT call startNewSession if webviewBridgeEnabled is true', () => {
                mParticle.init(apiKey, window.mParticle.config);
                const mpInstance = mParticle.getInstance();

                mpInstance._Store.webviewBridgeEnabled = true;

                const startNewSessionSpy = sinon.spy(
                    mpInstance._SessionManager,
                    'startNewSession'
                );

                mpInstance._SessionManager.startNewSessionIfNeeded();
                expect(startNewSessionSpy.called).to.equal(false);
            });
        });
    });

    describe('Integration Tests', () => {
        it('should end a session if the session timeout expires', () => {
            const generateUniqueIdSpy = sinon.stub(
                mParticle.getInstance()._Helpers,
                'generateUniqueId'
            );
            generateUniqueIdSpy.returns('test-unique-id');

            const now = new Date();

            mParticle.init(apiKey, window.mParticle.config);
            const mpInstance = mParticle.getInstance();

            expect(mpInstance._Store.sessionId).to.equal('TEST-UNIQUE-ID');
            // Init will set dateLastEventSent to now, but endSession relies on the persistence layer
            expect(mpInstance._Store.dateLastEventSent).to.eql(now);
            expect(mpInstance._Store.sessionAttributes).to.eql({});

            const persistenceSpy = sinon.spy(mpInstance._Persistence, 'update');

            // Session Manager relies on persistence to determine last time seen (LES)
            // Also requires sid to verify session exists
            sinon.stub(mpInstance._Persistence, 'getPersistence').returns({
                gs: {
                    les: now,
                    sid: 'fake-session-id',
                },
            });

            // trigger a session end
            clock.tick(60 * (MILLIS_IN_ONE_SEC * 60));

            expect(mpInstance._Store.sessionId).to.equal(null);
            expect(mpInstance._Store.dateLastEventSent).to.equal(null);
            expect(mpInstance._Store.sessionAttributes).to.eql({});

            // Persistence isn't necessary for this feature, but we should test
            // to see that it is called in case this ever needs to be refactored
            expect(persistenceSpy.called).to.equal(true);
        });
    });
});