import sinon from 'sinon';
import { expect } from 'chai';
import { MParticleWebSDK } from '../../src/sdkRuntimeModels';
import { apiKey, MPConfig, testMPID, urls, MessageType } from './config';
import { IdentityApiData } from '@mparticle/web-sdk';

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}

let mockServer;
const mParticle = window.mParticle;

describe('SessionManager', () => {
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
            const sessionTimeoutInMilliseconds = 11 * 60000; // 11 minutes

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
                timeLastEventSent - sessionTimeoutInMilliseconds
            );

            mpInstance._SessionManager.initialize();
            expect(mpInstance._Store.sessionId).to.equal('TEST-UNIQUE-ID');
        });

        it('resumes the previous session if session ID exists and dateLastSent is within the timeoutWindow', () => {
            const sessionTimeoutInMilliseconds = 8 * 60000; // 11 minutes

            mParticle.init(apiKey, window.mParticle.config);
            const mpInstance = mParticle.getInstance();

            mParticle.getInstance()._Store.sessionId = 'OLD-ID';

            const timeLastEventSent = mpInstance._Store.dateLastEventSent.getTime();
            mpInstance._Store.dateLastEventSent = new Date(
                timeLastEventSent - sessionTimeoutInMilliseconds
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
            expect(mpInstance._Store.sessionStartDate).to.eql(new Date());
            expect(mpInstance._Store.dateLastEventSent).to.eql(new Date());
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
            mpInstance._SessionManager.startNewSession();

            expect(mpInstance._Store.dateLastEventSent).to.eql(now);
        });

        it('should call Identity.identify if Store.identifyCalled is false', () => {
            // Init already an identify request and resets the identiy callback,
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
            //
            mpInstance._SessionManager.startNewSession();

            expect(identifySpy.getCall(0).args[0]).to.eql(identityApiData);
            expect(identifySpy.getCall(0).args[1]).to.eql(callbackSpy);
            expect(callbackSpy.called).to.equal(true);
            expect(mpInstance._Store.identifyCalled).to.eql(true);
            expect(mpInstance._Store.SDKConfig.identityCallback).to.eql(null);
        });
    });

    describe('#endSession', () => {
        // TODO: Set up scaffolding for session
        it.skip('should end a session', () => {
            mParticle.init(apiKey, window.mParticle.config);
            const mpInstance = mParticle.getInstance();
            const persistenceSpy = sinon.spy(mpInstance._Persistence, 'update');

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
        it('should use the cookie sessionId over Store.sessionId', () => {});

        it('should NOT end session if session has not timed out', () => {
            const now = new Date();
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

    describe('#setSessionTimer', () => {});

    describe('#resetSessionTimer', () => {});

    describe('#clearSessionTimer', () => {});

    describe('startNewSessionIfNeeded', () => {});
});
