import sinon from 'sinon';
import { expect } from 'chai';
import Utils from './config/utils';
import Constants from '../../src/constants';
import { MParticleWebSDK } from '../../src/sdkRuntimeModels';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import fetchMock from 'fetch-mock/esm/client';

const {
    getLocalStorage,
    setLocalStorage,
    findCookie,
    forwarderDefaultConfiguration,
    getLocalStorageProducts,
    findEventFromRequest,
    findBatch,
    getIdentityEvent,
    setCookie,
    MockForwarder,
} = Utils;

const { HTTPCodes } = Constants;

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}

const mParticle = window.mParticle as MParticleWebSDK;

// https://go.mparticle.com/work/SQDSDKS-6508
describe('mParticle User', function() {
    let mockServer;
    let clock;

    beforeEach(function() {
        delete mParticle.config.useCookieStorage;
        fetchMock.post(urls.events, 200);
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;
        localStorage.clear();

        clock = sinon.useFakeTimers({
            now: new Date().getTime(),
        });

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        mockServer.restore();
        fetchMock.restore();
        mParticle._resetForTests(MPConfig);
        clock.restore();
    });

    describe('Consent State', function() {
        it('get/set consent state for single user', done => {
            mParticle._resetForTests(MPConfig);

            mParticle.init(apiKey, mParticle.config);
            let consentState = mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .getConsentState();

            expect(consentState).to.equal(null);
            consentState = mParticle.Consent.createConsentState();
            consentState.addGDPRConsentState(
                'foo purpose',
                mParticle.Consent.createGDPRConsent(true, 10)
            );

            mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .setConsentState(consentState);

            const storedConsentState = mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .getConsentState();
            expect(storedConsentState).to.be.ok;
            expect(storedConsentState.getGDPRConsentState()).to.have.property(
                'foo purpose'
            );
            expect(
                storedConsentState.getGDPRConsentState()['foo purpose']
            ).to.have.property('Consented', true);
            expect(
                storedConsentState.getGDPRConsentState()['foo purpose']
            ).to.have.property('Timestamp', 10);
            done();
        });

        it('get/set consent state for multiple users', done => {
            mParticle._resetForTests(MPConfig);

            mParticle.init(apiKey, mParticle.config);

            mockServer.respondWith(urls.login, [
                200,
                {},
                JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
            ]);

            const userIdentities1 = {
                userIdentities: {
                    customerid: 'foo1',
                },
            };

            mParticle.Identity.login(userIdentities1);
            let user1StoredConsentState = mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .getConsentState();
            expect(user1StoredConsentState).to.equal(null);
            const consentState = mParticle.Consent.createConsentState();
            consentState.addGDPRConsentState(
                'foo purpose',
                mParticle.Consent.createGDPRConsent(true, 10)
            );

            mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .setConsentState(consentState);

            mParticle._resetForTests(MPConfig, true);
            mParticle.init(apiKey, mParticle.config);

            mockServer.respondWith(urls.login, [
                200,
                {},
                JSON.stringify({ mpid: 'MPID2', is_logged_in: false }),
            ]);

            const userIdentities2 = {
                userIdentities: {
                    customerid: 'foo2',
                },
            };

            mParticle.Identity.login(userIdentities2);

            let user2StoredConsentState = mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .getConsentState();
            expect(user2StoredConsentState).to.equal(null);

            consentState.removeGDPRConsentState('foo purpose');

            consentState.addGDPRConsentState(
                'foo purpose 2',
                mParticle.Consent.createGDPRConsent(false, 11)
            );

            mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .setConsentState(consentState);

            user1StoredConsentState = mParticle
                .getInstance()
                ._Store.getConsentState('MPID1');
            user2StoredConsentState = mParticle
                .getInstance()
                ._Store.getConsentState('MPID2');

            expect(
                user1StoredConsentState.getGDPRConsentState()
            ).to.have.property('foo purpose');
            expect(
                user1StoredConsentState.getGDPRConsentState()
            ).to.not.have.property('foo purpose 2');
            expect(
                user1StoredConsentState.getGDPRConsentState()['foo purpose']
            ).to.have.property('Consented', true);
            expect(
                user1StoredConsentState.getGDPRConsentState()['foo purpose']
            ).to.have.property('Timestamp', 10);

            expect(
                user2StoredConsentState.getGDPRConsentState()
            ).to.have.property('foo purpose 2');
            expect(
                user1StoredConsentState.getGDPRConsentState()
            ).to.not.have.property('foo purpose 1');
            expect(
                user2StoredConsentState.getGDPRConsentState()['foo purpose 2']
            ).to.have.property('Consented', false);
            expect(
                user2StoredConsentState.getGDPRConsentState()['foo purpose 2']
            ).to.have.property('Timestamp', 11);
            done();
        });
    });
});
