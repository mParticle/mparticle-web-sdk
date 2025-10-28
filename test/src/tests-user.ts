import sinon from 'sinon';
import { expect } from 'chai';
import Utils from './config/utils';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import fetchMock from 'fetch-mock/esm/client';
import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';
const { fetchMockSuccess, waitForCondition } = Utils;

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
        fetchMock: any;
    }
}

const mParticle = window.mParticle as IMParticleInstanceManager;

// https://go.mparticle.com/work/SQDSDKS-6849
const hasIdentifyReturned = () => {
    return window.mParticle.Identity.getCurrentUser()?.getMPID() === testMPID;
};

// https://go.mparticle.com/work/SQDSDKS-6508
describe('mParticle User', () => {
    beforeEach(() => {
        mParticle._resetForTests(MPConfig);
        fetchMock.config.overwriteRoutes = true;
        delete mParticle.config.useCookieStorage;
        fetchMock.post(urls.events, 200);
        localStorage.clear();

        fetchMockSuccess(urls.identify, {
            mpid: testMPID,
            is_logged_in: false,
        });

        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(() => {
        fetchMock.restore();
        sinon.restore();
    });

    describe('Consent State', () => {
        // https://go.mparticle.com/work/SQDSDKS-7393
        it('get/set consent state for single user', async () => {
            mParticle.init(apiKey, mParticle.config);
            await waitForCondition(hasIdentifyReturned);
            let consentState = mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .getConsentState();

            expect(consentState).to.equal(null);
            consentState = mParticle.Consent.createConsentState();
            consentState.addGDPRConsentState(
                'foo purpose',
                mParticle.Consent.createGDPRConsent(true, 10),
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
            expect(
                storedConsentState.getGDPRConsentState(),
            ).to.have.property('foo purpose');
            expect(
                storedConsentState.getGDPRConsentState()['foo purpose'],
            ).to.have.property('Consented', true);
            expect(
                storedConsentState.getGDPRConsentState()['foo purpose'],
            ).to.have.property('Timestamp', 10);
        });

        it('get/set consent state for multiple users', async () => {
            mParticle.init(apiKey, mParticle.config);

            await waitForCondition(hasIdentifyReturned);
            
            const userIdentities1 = {
                userIdentities: {
                    customerid: 'foo1',
                },
            };

            fetchMockSuccess(urls.login, {
                mpid: 'loginMPID1',
                is_logged_in: false,
            });

            mParticle.Identity.login(userIdentities1);
            await waitForCondition(() => {
                return (
                    mParticle.Identity.getCurrentUser()?.getMPID() ===
                    'loginMPID1'
                );
            });
            
            let user1StoredConsentState = mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .getConsentState();
            expect(user1StoredConsentState).to.equal(null);
            const consentState = mParticle.Consent.createConsentState();
            consentState.addGDPRConsentState(
                'foo purpose',
                mParticle.Consent.createGDPRConsent(true, 10),
            );

            mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .setConsentState(consentState);

            fetchMockSuccess(urls.login, {
                mpid: 'loginMPID2',
                is_logged_in: false,
            });

            const userIdentities2 = {
                userIdentities: {
                    customerid: 'foo2',
                },
            };

            mParticle.Identity.login(userIdentities2);
            await waitForCondition(() => {
                return (
                    mParticle.Identity.getCurrentUser()?.getMPID() ===
                    'loginMPID2'
                );
            });
            
            let user2StoredConsentState = mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .getConsentState();
            expect(user2StoredConsentState).to.equal(null);

            consentState.removeGDPRConsentState('foo purpose');

            consentState.addGDPRConsentState(
                'foo purpose 2',
                mParticle.Consent.createGDPRConsent(false, 11),
            );

            mParticle
                .getInstance()
                .Identity.getCurrentUser()
                .setConsentState(consentState);

            user1StoredConsentState = mParticle
                .getInstance()
                ._Store.getConsentState('loginMPID1');
            user2StoredConsentState = mParticle
                .getInstance()
                ._Store.getConsentState('loginMPID2');

            expect(
                user1StoredConsentState.getGDPRConsentState(),
            ).to.have.property('foo purpose');
            expect(
                user1StoredConsentState.getGDPRConsentState(),
            ).to.not.have.property('foo purpose 2');
            expect(
                user1StoredConsentState.getGDPRConsentState()[
                    'foo purpose'
                ],
            ).to.have.property('Consented', true);
            expect(
                user1StoredConsentState.getGDPRConsentState()[
                    'foo purpose'
                ],
            ).to.have.property('Timestamp', 10);

            expect(
                user2StoredConsentState.getGDPRConsentState(),
            ).to.have.property('foo purpose 2');
            expect(
                user1StoredConsentState.getGDPRConsentState(),
            ).to.not.have.property('foo purpose 1');
            expect(
                user2StoredConsentState.getGDPRConsentState()[
                    'foo purpose 2'
                ],
            ).to.have.property('Consented', false);
            expect(
                user2StoredConsentState.getGDPRConsentState()[
                    'foo purpose 2'
                ],
            ).to.have.property('Timestamp', 11);
        });
    });
});