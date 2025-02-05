import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { expect } from 'chai';
import { urls, MPConfig } from './config/constants';
import Utils from './config/utils';
import { IMParticleInstanceManager } from '../../src/mparticle-instance-manager';
const {
    findEventFromRequest,
    waitForCondition,
    fetchMockSuccess,
} = Utils;

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
    }
}

const mParticle = window.mParticle as IMParticleInstanceManager;;
let mockServer;

function returnEventForMPInstance(calls, apiKey, eventName) {
    const requestsPerApiKey = calls.filter(function(call) {
        return call[0].includes(apiKey);
    });
    return findEventFromRequest(requestsPerApiKey, eventName);
}

describe('mParticle instance manager', () => {
    it('has all public apis on it', () => {
        expect(mParticle.ProductActionType, 'Product Action Type').to.have.keys(
            [
                'Unknown',
                'AddToCart',
                'RemoveFromCart',
                'Checkout',
                'CheckoutOption',
                'Click',
                'ViewDetail',
                'Purchase',
                'Refund',
                'AddToWishlist',
                'RemoveFromWishlist',
                'getName',
                'getExpansionName',
            ]
        );
        expect(mParticle.CommerceEventType, 'Commerce Event Type').to.have.keys(
            [
                'ProductAddToCart',
                'ProductRemoveFromCart',
                'ProductCheckout',
                'ProductCheckoutOption',
                'ProductClick',
                'ProductViewDetail',
                'ProductPurchase',
                'ProductRefund',
                'PromotionView',
                'PromotionClick',
                'ProductAddToWishlist',
                'ProductRemoveFromWishlist',
                'ProductImpression',
            ]
        );
        expect(mParticle.EventType, 'Event Type').to.have.keys([
            'Unknown',
            'Navigation',
            'Location',
            'Search',
            'Transaction',
            'UserContent',
            'UserPreference',
            'Social',
            'Other',
            'Media',
            'getName',
        ]);
        expect(mParticle.PromotionType, 'Promotion Type').to.have.keys([
            'Unknown',
            'PromotionView',
            'PromotionClick',
            'getName',
            'getExpansionName',
        ]);

        expect(mParticle.IdentityType, 'Identity Type').to.have.keys([
            'Other',
            'CustomerId',
            'Facebook',
            'Twitter',
            'Google',
            'Microsoft',
            'Yahoo',
            'Email',
            'FacebookCustomAudienceId',
            'Other2',
            'Other3',
            'Other4',
            'Other5',
            'Other6',
            'Other7',
            'Other8',
            'Other9',
            'Other10',
            'MobileNumber',
            'PhoneNumber2',
            'PhoneNumber3',
            'isValid',
            'getName',
            'getIdentityType',
            'getIdentityName',
            'getValuesAsStrings',
            'getNewIdentitiesByName',
        ]);
        expect(mParticle.Identity, 'Identity').to.have.keys([
            'HTTPCodes',
            'identify',
            'logout',
            'login',
            'modify',
            'getCurrentUser',
            'getUser',
            'getUsers',
            'aliasUsers',
            'createAliasRequest',
        ]);
        expect(mParticle.Identity.HTTPCodes, 'HTTP Codes').to.have.keys([
            'noHttpCoverage',
            'activeIdentityRequest',
            'activeSession',
            'validationIssue',
            'nativeIdentityRequest',
            'loggingDisabledOrMissingAPIKey',
            'tooManyRequests',
        ]);
        expect(mParticle.eCommerce, 'eCommerce').to.have.keys([
            'Cart',
            'setCurrencyCode',
            'createProduct',
            'createPromotion',
            'createImpression',
            'createTransactionAttributes',
            'logCheckout',
            'logProductAction',
            'logPurchase',
            'logPromotion',
            'logImpression',
            'logRefund',
            'expandCommerceEvent',
        ]);
        expect(mParticle.Consent, 'Consent').to.have.keys([
            'createGDPRConsent',
            'createCCPAConsent',
            'createConsentState',
        ]);

        expect(mParticle.sessionManager, 'Session Manager').to.have.keys([
            'getSession',
        ]);

        expect(mParticle, 'mParticle global').to.have.all.keys([
            'Store',
            'getDeviceId',
            'generateHash',
            'sessionManager',
            'isIOS',
            'Identity',
            'IdentityType',
            'EventType',
            'CommerceEventType',
            'PromotionType',
            'ProductActionType',
            'init',
            'setLogLevel',
            'reset',
            '_resetForTests',
            'ready',
            'getVersion',
            'setAppVersion',
            'getAppName',
            'setAppName',
            'getAppVersion',
            'stopTrackingLocation',
            'startTrackingLocation',
            'setPosition',
            'startNewSession',
            'endSession',
            'logBaseEvent',
            'logEvent',
            'logError',
            'logLink',
            'logForm',
            'logPageView',
            'Consent',
            'eCommerce',
            'setSessionAttribute',
            'setOptOut',
            'setIntegrationAttribute',
            'getIntegrationAttributes',
            'addForwarder',
            'configurePixel',
            '_getActiveForwarders',
            '_getIntegrationDelays',
            '_setIntegrationDelay',
            '_BatchValidator',
            '_instances',
            '_isTestEnv',
            '_setWrapperSDKInfo',
            'MPSideloadedKit',
            'config',
            'getInstance',
            'setDeviceId',
            'isInitialized',
            'getEnvironment',
            'upload',
        ]);
    });

    describe('multiple instances testing', () => {
        beforeEach(() => {
            //remove each of the instance's localStorage
            localStorage.removeItem('mprtcl-v4_wtTest1');
            localStorage.removeItem('mprtcl-v4_wtTest2');
            localStorage.removeItem('mprtcl-v4_wtTest3');
            localStorage.removeItem('mprtcl-prodv4_wtTest1');
            localStorage.removeItem('mprtcl-prodv4_wtTest2');
            localStorage.removeItem('mprtcl-prodv4_wtTest3');

            mParticle._resetForTests(MPConfig);

            mockServer = sinon.createFakeServer();
            mockServer.respondImmediately = true;

            //config default instance
            fetchMock.get(
                'https://jssdkcdns.mparticle.com/JS/v2/apiKey1/config?env=0',
                {
                    status: 200,
                    body: JSON.stringify({ workspaceToken: 'wtTest1' }),
                }
            );

            //config instance 2
            fetchMock.get(
                'https://jssdkcdns.mparticle.com/JS/v2/apiKey2/config?env=0',
                {
                    status: 200,
                    body: JSON.stringify({ workspaceToken: 'wtTest2' }),
                }
            );

            //config instance 3
            fetchMock.get(
                'https://jssdkcdns.mparticle.com/JS/v2/apiKey3/config?env=0',
                {
                    status: 200,
                    body: JSON.stringify({ workspaceToken: 'wtTest3' }),
                }
            );

            // default instance event mock
            fetchMock.post(
                'https://jssdks.mparticle.com/v3/JS/apiKey1/events',
                200
            );
            fetchMock.post(
                'https://jssdks.mparticle.com/v3/JS/apiKey2/events',
                200
            );
            fetchMock.post(
                'https://jssdks.mparticle.com/v3/JS/apiKey3/events',
                200
            );

            // identity mock
            fetchMockSuccess(urls.identify, {
                mpid: 'testMPID',
                is_logged_in: false,
            });

            window.mParticle.config.requestConfig = true;
            delete window.mParticle.config.workspaceToken;

            mParticle.init('apiKey1', window.mParticle.config);
            mParticle.init('apiKey2', window.mParticle.config, 'instance2');
            mParticle.init('apiKey3', window.mParticle.config, 'instance3');
        });

        afterEach(function() {
            mockServer.restore();
            fetchMock.restore();
        });

        it('uses the correct instance name to identify an instance', async () => {
            await waitForCondition(() => (
                mParticle.getInstance('default_instance')._Store.configurationLoaded === true &&
                mParticle.getInstance('instance2')._Store.configurationLoaded === true &&
                mParticle.getInstance('instance3')._Store.configurationLoaded === true
            ));

            expect(mParticle.getInstance('default_instance')._instanceName).to.equal('default_instance');
            expect(mParticle.getInstance('instance2')._instanceName).to.equal('instance2');
            expect(mParticle.getInstance('instance3')._instanceName).to.equal('instance3');
        });

        it('creates multiple instances with their own cookies', done => {
            // setTimeout to allow config to come back from the beforeEach initialization
            setTimeout(() => {
                const cookies1 = window.localStorage.getItem(
                    'mprtcl-v4_wtTest1'
                );
                const cookies2 = window.localStorage.getItem(
                    'mprtcl-v4_wtTest2'
                );
                const cookies3 = window.localStorage.getItem(
                    'mprtcl-v4_wtTest3'
                );

                cookies1.includes('apiKey1').should.equal(true);
                cookies2.includes('apiKey2').should.equal(true);
                cookies3.includes('apiKey3').should.equal(true);

                done();
            }, 50);
        });

        it('logs events to their own instances', async () => {
            // setTimeout to allow config to come back from the beforeEach initialization
            await waitForCondition(() => {
                return (
                    mParticle.getInstance('default_instance')._Store
                        .configurationLoaded === true &&
                    mParticle.getInstance('instance2')._Store
                        .configurationLoaded === true &&
                    mParticle.getInstance('instance3')._Store
                        .configurationLoaded === true
                );
            });
            mParticle.getInstance('default_instance').logEvent('hi1');
            mParticle.getInstance('instance2').logEvent('hi2');
            mParticle.getInstance('instance3').logEvent('hi3');

            const instance1Event = returnEventForMPInstance(
                fetchMock.calls(),
                'apiKey1',
                'hi1'
            );
            instance1Event.should.be.ok();

            const instance2Event = returnEventForMPInstance(
                fetchMock.calls(),
                'apiKey2',
                'hi2'
            );
            instance2Event.should.be.ok();

            const instance3Event = returnEventForMPInstance(
                fetchMock.calls(),
                'apiKey3',
                'hi3'
            );
            instance3Event.should.be.ok();

            const instance1EventsFail1 = returnEventForMPInstance(
                fetchMock.calls(),
                'apiKey1',
                'hi2'
            );

            expect(instance1EventsFail1).not.be.ok;

            const instance1EventsFail2 = returnEventForMPInstance(
                fetchMock.calls(),
                'apiKey1',
                'hi3'
            );
            expect(instance1EventsFail2).not.be.ok;

            const instance2EventsFail1 = returnEventForMPInstance(
                fetchMock.calls(),
                'apiKey2',
                'hi1'
            );
            expect(instance2EventsFail1).not.be.ok;

            const instance2EventsFail2 = returnEventForMPInstance(
                fetchMock.calls(),
                'apiKey2',
                'hi3'
            );
            expect(instance2EventsFail2).not.be.ok;

            const instance3EventsFail1 = returnEventForMPInstance(
                fetchMock.calls(),
                'apiKey3',
                'hi1'
            );
            expect(instance3EventsFail1).not.be.ok;

            const instance3EventsFail2 = returnEventForMPInstance(
                fetchMock.calls(),
                'apiKey3',
                'hi2'
            );
            expect(instance3EventsFail2).not.be.ok;
        });

        it('logs purchase events to their own instances', done => {
            const prodattr1 = {
                journeyType: 'testjourneytype1',
                eventMetric1: 'metric2',
            };
            const prodattr2 = {
                'hit-att2': 'hit-att2-type',
                prodMetric1: 'metric1',
            };

            const product1 = mParticle.eCommerce.createProduct(
                'iphone',
                'iphoneSKU',
                999,
                1,
                'variant',
                'category',
                'brand',
                1,
                'coupon',
                prodattr1
            );
            const product2 = mParticle.eCommerce.createProduct(
                'galaxy',
                'galaxySKU',
                799,
                1,
                'variant',
                'category',
                'brand',
                1,
                'coupon',
                prodattr2
            );

            const ta = mParticle.eCommerce.createTransactionAttributes(
                'TAid1',
                'aff1',
                'coupon',
                1798,
                10,
                5
            );

            // setTimeout to allow config to come back from the beforeEach initialization
            mParticle
                .getInstance()
                .eCommerce.logPurchase(ta, [product1, product2]);
            setTimeout(() => {
                const instance1Event = returnEventForMPInstance(
                    fetchMock.calls(),
                    'apiKey1',
                    'purchase'
                );
                let instance2Event = returnEventForMPInstance(
                    fetchMock.calls(),
                    'apiKey2',
                    'purchase'
                );
                let instance3Event = returnEventForMPInstance(
                    fetchMock.calls(),
                    'apiKey3',
                    'purchase'
                );
                expect(instance1Event).be.ok;
                expect(instance2Event).not.be.ok;
                expect(instance3Event).not.be.ok;

                mParticle
                    .getInstance('instance2')
                    .eCommerce.logPurchase(
                        ta,
                        [product1, product2],
                        false,
                        {},
                        {}
                    );

                instance2Event = returnEventForMPInstance(
                    fetchMock.calls(),
                    'apiKey2',
                    'purchase'
                );
                instance3Event = returnEventForMPInstance(
                    fetchMock.calls(),
                    'apiKey3',
                    'purchase'
                );

                instance2Event.should.be.ok();
                expect(instance3Event).not.be.ok;

                mParticle
                    .getInstance('instance3')
                    .eCommerce.logPurchase(
                        ta,
                        [product1, product2],
                        false,
                        {},
                        {}
                    );

                instance3Event = returnEventForMPInstance(
                    fetchMock.calls(),
                    'apiKey3',
                    'purchase'
                );

                instance3Event.should.be.ok();

                done();
            }, 50);
        });
    });
});
