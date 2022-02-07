import sinon from 'sinon';
import { apiKey, MPConfig, testMPID, urls } from './config';
import { SDKProductActionType } from  '../../src/sdkRuntimeModels';

describe('Queue Public Methods', function () {
    let mockServer;

    beforeEach(function () {
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.eventsV2, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, Store: {}}),
        ]);

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
    });
    
    afterEach(function () {
        mockServer.reset();
        mParticle._resetForTests(MPConfig);
    });

    describe('mParticle Core', function () {

        describe('#setAppVersion', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setAppVersion('1.2.3');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setAppVersion('1.2.3');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#setAppName', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setAppName('Timmy');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setAppName('Timmy');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
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

            it('should process queue after initialization', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.ready(function () {
                    console.log('fired ready function');
                });
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#setPosition', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setPosition(10, 4);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setPosition(10, 4);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
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

            it('should process queue after initialization', function () {
                const event = {
                    name: 'test event',
                };

                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.logBaseEvent(event);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#logEvent', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.logEvent('Test Event');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.logEvent('Test Event');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#logError', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.logError('test error', {});
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.logError('test error', {});
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#logPageView', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.logPageView('test page view', {});
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.logPageView('test page view', {});
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#setOptOut', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setOptOut(true);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setOptOut(true);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#setIntegrationAttribute', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setIntegrationAttribute('12345', {});
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setIntegrationAttribute('12345', {});
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#setSessionAttribute', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setSessionAttribute('foo', 'bar');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.setSessionAttribute('foo', 'bar');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#isInitialized', function () {
            it('returns true when Store is initialized', function () {
                mParticle.getInstance().isInitialized().should.be.false();
                mParticle.init(apiKey, window.mParticle.config);
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

            it('should process queue after initialization', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.eCommerce.setCurrencyCode('USD');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#logProductAction', function () {
            it('should queue if not initialized', function () {
                var product = window.mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.eCommerce.logProductAction(SDKProductActionType.Purchase, product);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', function () {
                var product = window.mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.eCommerce.logProductAction(SDKProductActionType.Purchase, product);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#logPromotion', function () {
            it('should queue if not initialized', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.eCommerce.logPromotion('Test');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', function () {
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.eCommerce.logPromotion('Test');
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	

        describe('#logImpression', function () {
            it('should queue if not initialized', function () {
                var product = window.mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999);
                var impression = window.mParticle.eCommerce.createImpression('iphone impression', product);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.eCommerce.logImpression(impression);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
            });

            it('should process queue after initialization', function () {
                var product = window.mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999);
                var impression = window.mParticle.eCommerce.createImpression('iphone impression', product);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
                mParticle.eCommerce.logImpression(impression);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(1);
                mParticle.init(apiKey, window.mParticle.config);
                mParticle.getInstance()._preInit.readyQueue.length.should.equal(0);
            });
        });	
    });
});