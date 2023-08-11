import sinon from 'sinon';
import { expect } from 'chai';
import { MParticleWebSDK } from '../../src/sdkRuntimeModels';
import { apiKey, MPConfig, testMPID, urls, MessageType, MILLISECONDS_IN_ONE_MINUTE } from './config';
import { IdentityApiData } from '@mparticle/web-sdk';

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}

let mockServer;
const mParticle = window.mParticle;

describe.only('SessionManager', () => {
    const now = new Date();
    let clock;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        clock = sinon.useFakeTimers(now.getTime());

        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
    });

    afterEach(function() {
        sandbox.restore();
        clock.restore();
        mockServer.restore();
        mParticle._resetForTests(MPConfig);
    });

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
            const timePassed = 11 * MILLISECONDS_IN_ONE_MINUTE;

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
            const timePassed = 8 * MILLISECONDS_IN_ONE_MINUTE;

            mParticle.init(apiKey, window.mParticle.config);
            const mpInstance = mParticle.getInstance();

            mParticle.getInstance()._Store.sessionId = 'OLD-ID';

            const timeLastEventSent = mpInstance._Store.dateLastEventSent.getTime();
            mpInstance._Store.dateLastEventSent = new Date(
                timeLastEventSent - timePassed
            );

            mParticle.getInstance()._SessionManager.initialize();
            expect(mParticle.getInstance()._Store.sessionId).to.equal('OLD-ID');
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

            expect(mpInstance._Store.sessionStartDate).to.eql(dateInThePast);
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
            expect(mpInstance._Store.SDKConfig.identityCallback).to.eql(null);
        });
    });

    describe('#endSession', () => {
        it('should end a session', () => {
            mParticle.init(apiKey, window.mParticle.config);
            const mpInstance = mParticle.getInstance();
            const persistenceSpy = sinon.spy(mpInstance._Persistence, 'update');

            clock.tick(31 * MILLISECONDS_IN_ONE_MINUTE);
            mpInstance._SessionManager.endSession();

            expect(mpInstance._Store.sessionId).to.equal(null);
            expect(mpInstance._Store.dateLastEventSent).to.equal(null);
            expect(mpInstance._Store.sessionAttributes).to.eql({});

            // Persistence isn't necessary for this feature, but we should test
            // to see that it is called in case this ever needs to be refactored
            expect(persistenceSpy.called).to.equal(true);
        });

        it('should force a session end when override is used', () => {
            mParticle.init(apiKey, window.mParticle.config);
            const mpInstance = mParticle.getInstance();
            const persistenceSpy = sinon.spy(mpInstance._Persistence, 'update');

            mpInstance._SessionManager.endSession(true);

            expect(mpInstance._Store.sessionId).to.equal(null);
            expect(mpInstance._Store.dateLastEventSent).to.equal(null);
            expect(mpInstance._Store.sessionAttributes).to.eql({});

            // Persistence isn't necessary for this feature, but we should test
            // to see that it is called in case this ever needs to be refactored
            expect(persistenceSpy.called).to.equal(true);
        });

        it('should do nothing when a session does not exist', () => {});
        it('should do nothing when persistence cookies are missing', () => {});
        it('should nullify session attributes when override is used', () => {});
        it('should nullify session attributes when sesison has ended', () => {});
        it('should use the cookie sessionId over Store.sessionId', () => {});

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

            // Session Manager relies on persistence to determine last time seen (LES)
            // Also requires sid to verify session exists
            sinon.stub(mpInstance._Persistence, 'getPersistence').returns({
                gs: {
                    les: twentyMinutesAgo,
                    sid: 'fake-session-id',
                },
            });

            mpInstance._SessionManager.endSession();

            expect(mpInstance._Store.sessionId).to.equal('fake-session-id');

            // When session is not timed out, setSessionTimer is called to keep track
            // of current session timeout
            expect(timerSpy.getCalls().length).to.equal(1);
        });

        it('should end session if session times out', () => {
            const now = new Date();
            const hourAgo = new Date();
            hourAgo.setMinutes(now.getMinutes() - 60);

            mParticle.init(apiKey, window.mParticle.config);
            const mpInstance = mParticle.getInstance();
            const persistenceSpy = sinon.spy(mpInstance._Persistence, 'update');

            // Session Manager relies on persistence to determine last time seen (LES)
            // Also requires sid to verify session exists
            sinon.stub(mpInstance._Persistence, 'getPersistence').returns({
                gs: {
                    les: hourAgo,
                    sid: 'fake-session-id',
                },
            });

            mpInstance._SessionManager.endSession(true);

            expect(mpInstance._Store.sessionId).to.equal(null);
            expect(mpInstance._Store.dateLastEventSent).to.equal(null);
            expect(mpInstance._Store.sessionAttributes).to.eql({});

            // Persistence isn't necessary for this feature, but we should test
            // to see that it is called in case this ever needs to be refactored
            expect(persistenceSpy.called).to.equal(true);
        });
    });

    describe('#setSessionTimer', () => {
        it('should end a session after the timeout expires', done => {
            mParticle.init(apiKey, window.mParticle.config);
            const mpInstance = mParticle.getInstance();
            const endSessionSpy = sinon.spy(
                mpInstance._SessionManager,
                'endSession'
            );

            // Start Timer
            mpInstance._SessionManager.setSessionTimer();

            // Progress 29 minutes to make sure end session has not fired
            clock.tick(29 * MILLISECONDS_IN_ONE_MINUTE);
            expect(endSessionSpy.called).to.equal(false);

            // Progress one minutes to make sure end session fires
            clock.tick(30 * MILLISECONDS_IN_ONE_MINUTE);
            expect(endSessionSpy.called).to.equal(true);

            // Let test know async process is done
            done();
        });

        it('should set a global timer', () => {
            mParticle.init(apiKey, window.mParticle.config);
            const mpInstance = mParticle.getInstance();

            // Manually clear global timer since it gets set during init
            // window.clearTimeout(mpInstance._Store.globalTimer);
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

        it('should NOT call startNewSession if sessionId is defined and Persistence is undefined', () => {
            mParticle.init(apiKey, window.mParticle.config);
            const mpInstance = mParticle.getInstance();

            // Session Manager relies on persistence check sid (Session ID)
            // However, if persistence is undefined, this will not create a
            // new session
            sinon.stub(mpInstance._Persistence, 'getPersistence').returns(null);

            mpInstance._Store.sessionId = null;

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

        it('should NOT call startNewSession if Store.sessionId and Persistence is null', () => {
            mParticle.init(apiKey, window.mParticle.config);
            const mpInstance = mParticle.getInstance();

            // Session Manager relies on persistence check sid (Session ID)
            sinon.stub(mpInstance._Persistence, 'getPersistence').returns(null);

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
