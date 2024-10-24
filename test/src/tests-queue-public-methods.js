import { apiKey, MPConfig, testMPID, urls } from './config/constants';
import { SDKProductActionType } from  '../../src/sdkRuntimeModels';
import Utils from './config/utils';

const { waitForCondition, fetchMockSuccess, hasIdentityCallInflightReturned } = Utils;

describe('Queue Public Methods', function () {

    beforeEach(function () {
        fetchMockSuccess(urls.events);
        fetchMockSuccess(urls.identify, {
            mpid: testMPID,
            is_logged_in: false,
        });
    });
    
    afterEach(function () {
        mParticle._resetForTests(MPConfig);
    });

    describe('mParticle Core', function () {

        describe('#isInitialized', function () {
            it('should be a valid method on both mParticle and mParticle.getInstance() objects', function () {
                mParticle.should.have.property('isInitialized');
                mParticle.getInstance().should.have.property('isInitialized');
            });

            it('should return false if not yet initialized, and true after initialization', async function () {
                mParticle.isInitialized().should.equal(false);
                mParticle.getInstance().isInitialized().should.equal(false);
                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentityCallInflightReturned)
                mParticle.isInitialized().should.equal(true);
                mParticle.getInstance().isInitialized().should.equal(true);
            });
        });	

        describe('#setAppVersion', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setAppVersion('1.2.3');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', async function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setAppVersion('1.2.3');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentityCallInflightReturned)
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#setAppName', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setAppName('Timmy');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', async function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setAppName('Timmy');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentityCallInflightReturned)
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#ready', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.ready(function () {
                    console.log('fired ready function');
                });
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', async function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.ready(function () {
                    console.log('fired ready function');
                });
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentityCallInflightReturned)
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#setPosition', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setPosition(10, 4);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', async function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setPosition(10, 4);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentityCallInflightReturned)
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });

        describe('#logBaseEvent', function () {
            it('should queue if not initialized', function () {
                const event = {
                    name: 'test event',
                };

                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.logBaseEvent(event);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', async function () {
                const event = {
                    name: 'test event',
                };

                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.logBaseEvent(event);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentityCallInflightReturned)
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#logEvent', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.logEvent('Test Event');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', async function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.logEvent('Test Event');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentityCallInflightReturned)
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#logError', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.logError('test error', {});
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', async function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.logError('test error', {});
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentityCallInflightReturned)
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#logPageView', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.logPageView('test page view', {});
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', async function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.logPageView('test page view', {});
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentityCallInflightReturned)
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#setOptOut', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setOptOut(true);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', async function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setOptOut(true);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentityCallInflightReturned)
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#setIntegrationAttribute', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setIntegrationAttribute('12345', {});
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', async function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setIntegrationAttribute('12345', {});
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentityCallInflightReturned)
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#setSessionAttribute', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setSessionAttribute('foo', 'bar');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', async function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setSessionAttribute('foo', 'bar');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentityCallInflightReturned)
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#isInitialized', function () {
            it('returns true when Store is initialized', async function () {
                mParticle.getInstance().isInitialized().should.be.false();
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentityCallInflightReturned)
                mParticle.getInstance().isInitialized().should.be.true();
            });
        });
    });	

    describe('mParticle.eCommerce', function () {
        describe('#setCurrencyCode', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.eCommerce.setCurrencyCode('USD');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', async function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.eCommerce.setCurrencyCode('USD');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentityCallInflightReturned)
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#logProductAction', function () {
            it('should queue if not initialized', function () {
                const product = window.mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.eCommerce.logProductAction(SDKProductActionType.Purchase, product);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', async function () {
                const product = window.mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.eCommerce.logProductAction(SDKProductActionType.Purchase, product);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentityCallInflightReturned)
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#logPromotion', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.eCommerce.logPromotion('Test');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', async function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.eCommerce.logPromotion('Test');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentityCallInflightReturned)
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#logImpression', function () {
            it('should queue if not initialized', function () {
                const product = window.mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999);
                const impression = window.mParticle.eCommerce.createImpression('iphone impression', product);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.eCommerce.logImpression(impression);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', async function () {
                const product = window.mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999);
                const impression = window.mParticle.eCommerce.createImpression('iphone impression', product);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.eCommerce.logImpression(impression);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentityCallInflightReturned)
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	
    });
});