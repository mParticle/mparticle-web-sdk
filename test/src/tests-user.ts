import sinon from 'sinon';
import { expect } from 'chai';
import Utils from './config/utils';
import Constants from '../../src/constants';
import { MParticleWebSDK } from '../../src/sdkRuntimeModels';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import fetchMock from 'fetch-mock/esm/client';
const { fetchMockSuccess, waitForCondition } = Utils;

const { HTTPCodes } = Constants;

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}

const mParticle = window.mParticle as MParticleWebSDK;

const hasIdentifyReturned = () => {
    return window.mParticle.Identity.getCurrentUser()?.getMPID() === testMPID;
};

// https://go.mparticle.com/work/SQDSDKS-6508
describe('mParticle User', function() {
    beforeEach(function() {
        delete mParticle.config.useCookieStorage;
        fetchMock.post(urls.events, 200);
        localStorage.clear();

        fetchMockSuccess(urls.identify, {
            mpid: testMPID, is_logged_in: false
        });

        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        fetchMock.restore();
        mParticle._resetForTests(MPConfig);
    });

    describe('Consent State', function() {
        it('get/set consent state for single user', done => {
            mParticle._resetForTests(MPConfig);

            mParticle.init(apiKey, mParticle.config);
                debugger;

            waitForCondition(hasIdentifyReturned)
            .then(() => {
                debugger;
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

            })
            .catch(e => {
                console.log(e)
            })
        });

        it('get/set consent state for multiple users', done => {
            mParticle._resetForTests(MPConfig);

            mParticle.init(apiKey, mParticle.config);

            waitForCondition(hasIdentifyReturned)
            .then(() => {
                debugger;
                const userIdentities1 = {
                    userIdentities: {
                        customerid: 'foo1',
                    },
                };
    
                fetchMockSuccess(urls.login, {
                    mpid: 'loginMPID1', is_logged_in: false
                });

                mParticle.Identity.login(userIdentities1);
                waitForCondition(() => {
                    return (
                        mParticle.Identity.getCurrentUser()?.getMPID() === 'loginMPID1'
                    );
                })
                .then(() => {
                    debugger;
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
                        
                    fetchMockSuccess(urls.login, {
                        mpid: 'loginMPID2', is_logged_in: false
                    });


                    const userIdentities2 = {
                        userIdentities: {
                            customerid: 'foo2',
                        },
                    };

                    mParticle.Identity.login(userIdentities2);
                    waitForCondition(() => {
                        return (
                            mParticle.Identity.getCurrentUser()?.getMPID() === 'loginMPID2'
                        );
                    })
                    .then(() => {
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
                            ._Store.getConsentState('loginMPID1');
                        user2StoredConsentState = mParticle
                            .getInstance()
                            ._Store.getConsentState('loginMPID2');

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
                })
            })
            .catch((e) => {
                console.log(e);
                done();
            })
        });
    });
});
