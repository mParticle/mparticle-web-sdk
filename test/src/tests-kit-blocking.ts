import sinon from 'sinon';
import { expect } from 'chai';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import { SDKEvent, SDKProductActionType, DataPlanResult, KitBlockerDataPlan, IMParticleInstanceManager } from  '../../src/sdkRuntimeModels';
import * as dataPlan from './dataPlan.json';
import Utils from './config/utils';
import KitBlocker from '../../src/kitBlocking';
import Types from '../../src/types';
import { DataPlanVersion } from '@mparticle/data-planning-models';
import fetchMock from 'fetch-mock/esm/client';
import { IMockForwarder } from './tests-forwarders';
const { waitForCondition, fetchMockSuccess, hasIdentifyReturned, findEventFromRequest } = Utils;

let forwarderDefaultConfiguration = Utils.forwarderDefaultConfiguration;
const MockForwarder = Utils.MockForwarder;

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
        MockForwarder1: IMockForwarder;
    }
}

describe('kit blocking', () => {
    let kitBlockerDataPlan: KitBlockerDataPlan = {
        document: dataPlan
    } as KitBlockerDataPlan;

    beforeEach(function() {
        window.mParticle._resetForTests(MPConfig);
        window.mParticle.config.dataPlan = {
            document: dataPlan as DataPlanResult
        };
        window.mParticle.config.kitConfigs = []
    });
    
    afterEach(function() {
        sinon.restore();
        fetchMock.restore();
    });

    describe('kitBlocker', () => {
        it('kitBlocker should parse data plan into dataPlanMatchLookups properly', () => {
            let kitBlocker = new KitBlocker(kitBlockerDataPlan, window.mParticle.getInstance());
            let dataPlanMatchLookups = kitBlocker.dataPlanMatchLookups;
            dataPlanMatchLookups.should.have.property('custom_event:search:Search Event', true);
            dataPlanMatchLookups.should.have.property('screen_view::another new screenview event', {});
            dataPlanMatchLookups.should.have.property('custom_event:location:locationEvent', {foo: true, 'foo foo': true, 'foo number': true});
            dataPlanMatchLookups.should.have.property('product_action:add_to_cart', {
                attributeNumMinMax: true,
                attributeEmail: true,
                attributeNumEnum: true,
                attributeStringAlpha: true,
                attributeBoolean: true,
            });
            dataPlanMatchLookups.should.have.property('product_action:add_to_cart:ProductAttributes', true);
            dataPlanMatchLookups.should.have.property('promotion_action:view', {
                'not required': true,
                'required': true
            });
            dataPlanMatchLookups.should.have.property('promotion_action:view:ProductAttributes', true);
            dataPlanMatchLookups.should.have.property('custom_event:navigation:TestEvent', true);
            dataPlanMatchLookups.should.have.property('product_impression:ProductAttributes', {
                allowedAttr1: true,
                allowedAttr2: true
            });

            dataPlanMatchLookups.should.have.property('screen_view::A New ScreenViewEvent', true)
            dataPlanMatchLookups.should.have.property('screen_view::my screeeen', {
                test2key: true,
                test1key: true,
            });
            dataPlanMatchLookups.should.have.property('custom_event:navigation:something something something', true);
            dataPlanMatchLookups.should.have.property('user_attributes', {
                'my attribute': true,
                'my other attribute': true,
                'a third attribute': true,
            });
            dataPlanMatchLookups.should.have.property('user_identities', true)
            dataPlanMatchLookups.should.have.property('custom_event:social:SocialEvent', {})
            dataPlanMatchLookups.should.have.property('product_action:purchase', {
                eventAttribute1: true,
                eventAttribute2: true
            })
            dataPlanMatchLookups.should.have.property('product_action:purchase:ProductAttributes', {
                plannedAttr1: true,
                plannedAttr2: true
            })
            dataPlanMatchLookups.should.have.property('promotion_action:click', {
                eventAttribute1: true,
                eventAttribute2: true
            })
            dataPlanMatchLookups.should.have.property('promotion_action:click:ProductAttributes', true)
        });
    })
    
    describe('kitblocking - events and event attributes', () => {
        let kitBlocker;
        let event: SDKEvent;

        beforeEach(() => {
             kitBlocker = new KitBlocker(kitBlockerDataPlan, window.mParticle.getInstance());
             event = {
                DeviceId: 'test',
                IsFirstRun: true,
                EventName: null,
                EventCategory: null,
                ExpandedEventCount: 0,
                MPID: testMPID, 
                EventAttributes: null,
                SDKVersion: '1.0.0',
                SourceMessageId: 'testSMID',
                SessionId: 'sessionId',
                SessionStartDate: 1,
                Timestamp: 1,
                EventDataType: null,
                Debug: true,
                CurrencyCode: 'usd',
                ActiveTimeOnSite: 10,
                TotalTimeOnSite: 15
            }
        });

        it('should transform an unplanned event to null if blok.ev = true', () => {
            event.EventName = 'unplanned event';
            event.EventCategory = Types.EventType.Search;
            event.EventAttributes = { keyword2: 'test' };
            event.EventDataType = Types.MessageType.PageEvent;

            let transformedEvent = kitBlocker.transformEventAndEventAttributes(event);
            (transformedEvent === null).should.equal(true);
        });

        it('should transform EventAttributes if an event attribute is not planned and blok.ea = true', () => {
            event.EventName = 'locationEvent';
            event.EventCategory = Types.EventType.Location;
            event.EventAttributes = { unplannedAttr: 'test', foo: 'hi' };
            event.EventDataType = Types.MessageType.PageEvent;

            let transformedEvent = kitBlocker.transformEventAndEventAttributes(event);
            transformedEvent.EventAttributes.should.not.have.property('unplannedAttr');
            transformedEvent.EventAttributes.should.have.property('foo', 'hi');
        });

        it('should transform EventAttributes if there are no custom attributes and additionalProperties === false', () => {
            event.EventName = 'another new screenview event';
            event.EventCategory = Types.EventType.Location;
            event.EventAttributes = { unplannedAttr: 'test', foo: 'hi' };
            event.EventDataType = Types.MessageType.PageView;
 
            let transformedEvent = kitBlocker.transformEventAndEventAttributes(event);
            transformedEvent.EventAttributes.should.not.have.property('unplannedAttr');
            transformedEvent.EventAttributes.should.not.have.property('foo');
        });

        it('should include unplanned event attributes if additionalProperties = true and blok.ea = true', () => {
            event.EventName = 'something something something';
            event.EventCategory = Types.EventType.Navigation;
            event.EventAttributes = { keyword2: 'test', foo: 'hi' };
            event.EventDataType = Types.MessageType.PageEvent;

            let transformedEvent = kitBlocker.transformEventAndEventAttributes(event);
            transformedEvent.EventAttributes.should.have.property('foo', 'hi');
            transformedEvent.EventAttributes.should.have.property('keyword2', 'test');
        });

        it('should block any unplanned event attributes if custom attributes is empty, additionalProperties = false, and block.ea = true.', () => {
            event.EventName = 'SocialEvent';
            event.EventCategory = Types.EventType.Social;
            event.EventAttributes = { keyword2: 'test', foo: 'hi' };
            event.EventDataType = Types.MessageType.PageEvent;

            let transformedEvent = kitBlocker.transformEventAndEventAttributes(event);
            Object.keys(transformedEvent.EventAttributes).length.should.equal(0);
        });

        it('should not block any unplanned event attributes if custom attributes is empty, additionalProperties = true, and block.ea = true.', () => {
            // modify this test so that the above 
            let socialDataPoint = dataPlan.dtpn.vers.version_document.data_points.find(dataPoint => {
                return dataPoint?.match?.criteria?.event_name === 'SocialEvent'
            });
            socialDataPoint.validator.definition.properties.data.properties.custom_attributes.additionalProperties = true;

            kitBlocker = new KitBlocker(kitBlockerDataPlan, window.mParticle.getInstance());

            event.EventName = 'SocialEvent';
            event.EventCategory = Types.EventType.Social;
            event.EventAttributes = { keyword2: 'test', foo: 'hi' };
            event.EventDataType = Types.MessageType.PageEvent;

            let transformedEvent = kitBlocker.transformEventAndEventAttributes(event);
            Object.keys(transformedEvent.EventAttributes).length.should.equal(2);
            transformedEvent.EventAttributes.should.have.property('foo', 'hi');
            transformedEvent.EventAttributes.should.have.property('keyword2', 'test');

            socialDataPoint.validator.definition.properties.data.properties.custom_attributes.additionalProperties = false;
        });
    });

    describe('kit blocking - user attributes/identities', () => {
        let kitBlocker;
        let event: SDKEvent;

        beforeEach(() => {
             kitBlocker = new KitBlocker(kitBlockerDataPlan, window.mParticle.getInstance());
             event = {
                DeviceId: 'test',
                IsFirstRun: true,
                EventName: null,
                EventCategory: null,
                ExpandedEventCount: 0,
                MPID: testMPID, 
                EventAttributes: null,
                SDKVersion: '1.0.0',
                SourceMessageId: 'testSMID',
                SessionId: 'sessionId',
                SessionStartDate: 1,
                Timestamp: 1,
                EventDataType: null,
                Debug: true,
                CurrencyCode: 'usd',
                ActiveTimeOnSite: 10,
                TotalTimeOnSite: 15
            };
        });

        it('should block any unplanned user attributes when blok.ua = true and additionalPropertes = false', () => {
            event.EventName = 'something something something';
            event.EventCategory = Types.EventType.Navigation;
            event.EventAttributes = { keyword2: 'test', foo: 'hi' };
            event.EventDataType = Types.MessageType.PageEvent;
            event.UserAttributes = {
                'my attribute': 'test1',
                'my other attribute': 'test2',
                'a third attribute': 'test3',
                'unplanned attribute': 'test4',
            }

            let kitBlocker = new KitBlocker(kitBlockerDataPlan, window.mParticle.getInstance());
            let transformedEvent = kitBlocker.transformUserAttributes(event);
            transformedEvent.UserAttributes.should.have.property('my attribute', 'test1');
            transformedEvent.UserAttributes.should.have.property('my other attribute', 'test2');
            transformedEvent.UserAttributes.should.have.property('a third attribute', 'test3');
            transformedEvent.UserAttributes.should.not.have.property('unplanned attribute');

        });

        it('should not block any unplanned user attributes if blok.ua = false', () => {
            //TODO - what if this additional properties is false? shoudl we validate that?
            window.mParticle.config.dataPlan.document.dtpn.blok.ua = false;

            event.EventName = 'something something something',
            event.EventCategory = Types.EventType.Navigation,
            event.EventAttributes = { keyword2: 'test', foo: 'hi' },
            event.EventDataType = Types.MessageType.PageEvent,
            event.UserAttributes = {
                'my attribute': 'test1',
                'my other attribute': 'test2',
                'a third attribute': 'test3',
                'unplanned attribute': 'test4',
            };

            let kitBlocker = new KitBlocker(kitBlockerDataPlan, window.mParticle.getInstance());
            let transformedEvent = kitBlocker.transformUserAttributes(event);
            transformedEvent.UserAttributes.should.have.property('my attribute', 'test1');
            transformedEvent.UserAttributes.should.have.property('my other attribute', 'test2');
            transformedEvent.UserAttributes.should.have.property('a third attribute', 'test3');
            transformedEvent.UserAttributes.should.have.property('unplanned attribute', 'test4');
            
            //reset
            window.mParticle.config.dataPlan.document.dtpn.blok.ua = true;

        });

        it('isAttributeKeyBlocked should return false for attributes that are blocked and true for properties that are not', () => {
            // this key is blocked because the default data plan has user_attributes>additional_properties = false
            const kitBlocker = new KitBlocker(kitBlockerDataPlan, window.mParticle.getInstance());

            let isBlocked = kitBlocker.isAttributeKeyBlocked('blocked');
            isBlocked.should.equal(true);

            let userAttributeDataPoint = dataPlan.dtpn.vers.version_document.data_points.find(dataPoint => {
                return dataPoint.match.type === 'user_attributes'
            });
            userAttributeDataPoint.validator.definition.additionalProperties = true;
                
            const kitBlocker2 = new KitBlocker(kitBlockerDataPlan, window.mParticle.getInstance());
            isBlocked = kitBlocker2.isAttributeKeyBlocked('my attribute');
            isBlocked.should.equal(false);

            // reset to original data plan
            userAttributeDataPoint.validator.definition.additionalProperties = false;

        });

        it('should not block any unplanned user identities when blok.id = true and additionalProperties = true', () => {
            event.EventName = 'something something something';
            event.EventCategory = Types.EventType.Navigation;
            event.EventAttributes = { keyword2: 'test', foo: 'hi' };
            event.EventDataType = Types.MessageType.PageEvent;
            event.UserIdentities = [
                { Type: 7, Identity: 'email@gmail.com' },
                { Type: 1, Identity: 'customerid1' },
                { Type: 4, Identity: 'GoogleId' }
            ];

            let kitBlocker = new KitBlocker(kitBlockerDataPlan, window.mParticle.getInstance());
            let transformedEvent = kitBlocker.transformUserIdentities(event);

            transformedEvent.UserIdentities.filter(UI => UI.Type === 1)[0].should.have.property('Identity', 'customerid1');
            transformedEvent.UserIdentities.filter(UI => UI.Type === 7)[0].should.have.property('Identity', 'email@gmail.com');
            transformedEvent.UserIdentities.filter(UI => UI.Type === 4)[0].should.have.property('Identity', 'GoogleId');

        });

        it('should block user identities when additional properties = false and blok.id = true', () => {
            let userIdentityDataPoint = dataPlan.dtpn.vers.version_document.data_points.find(dataPoint => {
                return dataPoint.match.type === 'user_identities'
            });

            userIdentityDataPoint.validator.definition.additionalProperties = false;

            event.EventName = 'something something something';
            event.EventCategory = Types.EventType.Navigation;
            event.EventAttributes = { keyword2: 'test', foo: 'hi' };
            event.EventDataType = Types.MessageType.PageEvent;
            event.UserIdentities = [
                { Type: 7, Identity: 'email@gmail.com' },
                { Type: 1, Identity: 'customerid1' },
                { Type: 4, Identity: 'GoogleId' }
            ];

            let kitBlocker = new KitBlocker(kitBlockerDataPlan, window.mParticle.getInstance());
            let transformedEvent = kitBlocker.transformUserIdentities(event);

            transformedEvent.UserIdentities.find(UI => UI.Type === 1).should.have.property('Identity', 'customerid1');
            transformedEvent.UserIdentities.find(UI => UI.Type === 7).should.have.property('Identity', 'email@gmail.com');
            (transformedEvent.UserIdentities.find(UI => UI.Type === 4) === undefined).should.equal(true);

            // reset
            userIdentityDataPoint.validator.definition.additionalProperties = true;

        });

        it('isIdentityBlocked should return false for identities that are blocked and true for properties that are not', () => {
            // this identity is not blocked because the default data plan has user_identities>additional_properties = false
            const kitBlocker = new KitBlocker(kitBlockerDataPlan, window.mParticle.getInstance());

            let isBlocked = kitBlocker.isIdentityBlocked('random identity');
            isBlocked.should.equal(false);

            // for next test, change additionalProperties to false
            let userIdentityDataPoint = dataPlan.dtpn.vers.version_document.data_points.find(dataPoint => {
                return dataPoint.match.type === 'user_identities'
            });

            userIdentityDataPoint.validator.definition.additionalProperties = false;
                
            const kitBlocker2 = new KitBlocker(kitBlockerDataPlan, window.mParticle.getInstance());
            isBlocked = kitBlocker2.isIdentityBlocked('facebook');
            isBlocked.should.equal(true);

            // reset to original data plan
            userIdentityDataPoint.validator.definition.additionalProperties = true;

        });
    });

    describe('kit blocking - product attributes', () => {
        let kitBlocker;
        let event: SDKEvent;
        let products;

        beforeEach(() => {
             kitBlocker = new KitBlocker(kitBlockerDataPlan, window.mParticle.getInstance());
             products = [
                        {
                            Attributes: {
                                'plannedAttr1': 'val1',
                                'plannedAttr2': 'val2',
                                'unplannedAttr1': 'val3',
                                'allowedAttr1': 'val4',
                                'allowedAttr2': 'val5',
                            },
                            Name: 'iPhone',
                            Category: 'category',
                            CouponCode: 'coupon',
                            Position: 1,
                            Price: 999,
                            Quantity: 1,
                            Sku: 'iphoneSKU',
                            TotalAmount: 999,
                            Variant: '128',
                        },
                        {
                            Attributes: {
                                'plannedAttr1': 'val1',
                                'plannedAttr2': 'val2',
                                'unplannedAttr1': 'val3',
                                'allowedAttr1': 'val4',
                                'allowedAttr2': 'val5',
                            },
                            Name: 'S10',
                            Category: 'category',
                            CouponCode: 'coupon',
                            Position: 2,
                            Price: 500,
                            Quantity: 1,
                            Sku: 'galaxySKU',
                            TotalAmount: 500,
                            Variant: '256',
                        }
                    ]
             event = {
                DeviceId: 'test',
                IsFirstRun: true,
                EventName: null,
                EventCategory: null,
                ExpandedEventCount: 0,
                MPID: testMPID, 
                EventAttributes: null,
                SDKVersion: '1.0.0',
                SourceMessageId: 'testSMID',
                SessionId: 'sessionId',
                SessionStartDate: 1,
                Timestamp: 1,
                EventDataType: null,
                Debug: true,
                CurrencyCode: 'usd',
                ActiveTimeOnSite: 10,
                TotalTimeOnSite: 15
            };
        });

        it('should transform productAttributes if an product attribute is not planned, additionalProperties = false, and blok.ea = true', () => {
            event.EventName = 'eCommerce - Purchase';
            event.EventCategory = Types.CommerceEventType.ProductPurchase;
            event.EventDataType = Types.MessageType.Commerce;
            event.ProductAction = {
                ProductActionType: SDKProductActionType.Purchase,
                ProductList: products,
            }

            let kitBlocker = new KitBlocker(kitBlockerDataPlan, window.mParticle.getInstance());

            let transformedEvent = kitBlocker.transformProductAttributes(event);
            transformedEvent.ProductAction.ProductList[0].Attributes.should.not.have.property('unplannedAttr1');
            transformedEvent.ProductAction.ProductList[0].Attributes.should.have.property('plannedAttr1');
            transformedEvent.ProductAction.ProductList[0].Attributes.should.have.property('plannedAttr2');

            transformedEvent.ProductAction.ProductList[1].Attributes.should.not.have.property('unplannedAttr1');
            transformedEvent.ProductAction.ProductList[1].Attributes.should.have.property('plannedAttr1');
            transformedEvent.ProductAction.ProductList[1].Attributes.should.have.property('plannedAttr2');

        });

        it('should not transform productAttributes if a product attribute is not planned, additionalProperties = false,  and blok.ea = true', () => {
            event.EventName = 'eCommerce - AddToCart';
            event.EventCategory = Types.CommerceEventType.ProductAddToCart;
            event.EventDataType = Types.MessageType.Commerce;
            event.ProductAction = {
                ProductActionType: SDKProductActionType.AddToCart,
                ProductList: products,
            };

            let kitBlocker = new KitBlocker(kitBlockerDataPlan, window.mParticle.getInstance());
            let transformedEvent = kitBlocker.transformProductAttributes(event);
            
            transformedEvent.ProductAction.ProductList[0].Attributes.should.have.property('unplannedAttr1');
            transformedEvent.ProductAction.ProductList[0].Attributes.should.have.property('plannedAttr1');
            transformedEvent.ProductAction.ProductList[0].Attributes.should.have.property('plannedAttr2');

            transformedEvent.ProductAction.ProductList[1].Attributes.should.have.property('unplannedAttr1');
            transformedEvent.ProductAction.ProductList[1].Attributes.should.have.property('plannedAttr1');
            transformedEvent.ProductAction.ProductList[1].Attributes.should.have.property('plannedAttr2');

        });

        it('should transform productAttributes in product impressions if an product attribute is not planned, additionalProperties = false,  and blok.ea = true', () => {
            event.EventName = 'eCommerce - Impression';
            event.ProductImpressions = [
                {
                    ProductImpressionList: 'imp1',
                    ProductList: products
                },
                {
                    ProductImpressionList: 'imp2',
                    ProductList: products
                }
            ]
            event.EventCategory = Types.CommerceEventType.ProductImpression;
            event.EventDataType = Types.MessageType.Commerce;

            let kitBlocker = new KitBlocker(kitBlockerDataPlan, window.mParticle.getInstance());
            let transformedEvent = kitBlocker.transformProductAttributes(event);

            transformedEvent.ProductImpressions[0].ProductList[0].Attributes.should.have.property('allowedAttr1', 'val4');
            transformedEvent.ProductImpressions[0].ProductList[0].Attributes.should.have.property('allowedAttr2', 'val5');
            transformedEvent.ProductImpressions[0].ProductList[0].Attributes.should.not.have.property('unplannedAttr1');
            transformedEvent.ProductImpressions[0].ProductList[0].Attributes.should.not.have.property('unplannedAttr2');
            transformedEvent.ProductImpressions[0].ProductList[1].Attributes.should.have.property('allowedAttr1', 'val4');
            transformedEvent.ProductImpressions[0].ProductList[1].Attributes.should.have.property('allowedAttr2', 'val5');
            transformedEvent.ProductImpressions[0].ProductList[1].Attributes.should.not.have.property('unplannedAttr1');
            transformedEvent.ProductImpressions[0].ProductList[1].Attributes.should.not.have.property('unplannedAttr2');

            transformedEvent.ProductImpressions[1].ProductList[0].Attributes.should.have.property('allowedAttr1', 'val4');
            transformedEvent.ProductImpressions[1].ProductList[0].Attributes.should.have.property('allowedAttr2', 'val5');
            transformedEvent.ProductImpressions[1].ProductList[0].Attributes.should.not.have.property('unplannedAttr1');
            transformedEvent.ProductImpressions[1].ProductList[0].Attributes.should.not.have.property('unplannedAttr2');
            transformedEvent.ProductImpressions[1].ProductList[1].Attributes.should.have.property('allowedAttr1', 'val4');
            transformedEvent.ProductImpressions[1].ProductList[1].Attributes.should.have.property('allowedAttr2', 'val5');
            transformedEvent.ProductImpressions[1].ProductList[1].Attributes.should.not.have.property('unplannedAttr1');
            transformedEvent.ProductImpressions[1].ProductList[1].Attributes.should.not.have.property('unplannedAttr2');

        });
    });

    describe('kit blocking - integration tests', () => {
        beforeEach(() => {
            fetchMock.restore();
            fetchMock.config.overwriteRoutes = true;
            fetchMockSuccess(urls.identify, {
                mpid: testMPID,
                is_logged_in: false,
            });

            let mockForwarder = new MockForwarder();
            window.mParticle.addForwarder(mockForwarder);
        });

        it('integration test - should log an error if the data plan has an error on it', () => {
            const errorMessage = 'This is an error';
            window.mParticle.config.dataPlan = {
                document: {
                    error_message: errorMessage
                }
            };

            let errorMessages = [];

            let mockForwarder = new MockForwarder();
            window.mParticle.addForwarder(mockForwarder);
            window.mParticle.config.logLevel = 'verbose';

            window.mParticle.config.logger = {
                error: function(err) {
                    errorMessages.push(err)
                }
            }

            window.mParticle.init(apiKey, window.mParticle.config);
            errorMessages[0].should.equal(errorMessage);
            window.mParticle.config.requestConfig = false;

        });

        it('integration test - should block a custom event from reaching the forwarder if event is unplanned and block.ev=true', () => {
            window.mParticle.config.kitConfigs.push(forwarderDefaultConfiguration('MockForwarder'));
            window.mParticle.init(apiKey, window.mParticle.config);

            window.mParticle.logEvent('Blocked event');

            let event = window.MockForwarder1.instance.receivedEvent;
            (event === null).should.equal(true);
            
        });

        it('integration test - should allow unplanned custom events through to forwarder if blok.ev=false', async () => {
            window.mParticle.config.kitConfigs.push(forwarderDefaultConfiguration('MockForwarder'));
            window.mParticle.config.dataPlan.document.dtpn.blok.ev = false;
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);
            
            window.mParticle.logEvent('Unplanned Event');
            
            let event = window.MockForwarder1.instance.receivedEvent;
            event.should.have.property('EventName', 'Unplanned Event');
            
            // reset
            window.mParticle.config.dataPlan.document.dtpn.blok.ev = true;
            
        });

        it('integration test - should block an unplanned attribute from being set on the forwarder if additionalProperties = false and blok.ua = true', async () => {
            window.mParticle.config.kitConfigs.push(forwarderDefaultConfiguration('MockForwarder'));
            window.mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasIdentifyReturned);

            window.mParticle.Identity.getCurrentUser().setUserAttribute('unplannedAttr', true);
            window.MockForwarder1.instance.should.have.property(
                'setUserAttributeCalled',
                false
            );
        });

        it('integration test - should not throw an error when unplanned user attributes are allowed and block.ua = true', () => {
            window.mParticle.config.kitConfigs.push(forwarderDefaultConfiguration('MockForwarder'));
            window.mParticle.init(apiKey, window.mParticle.config);

            // save old data points for reset later
            const oldDataPoints = dataPlan.dtpn.vers.version_document.data_points;
            // when "Allow unplanned user attributes" is enabled, the data points returned is an empty array
            dataPlan.dtpn.vers.version_document.data_points = [];
            let kitBlocker = new KitBlocker(kitBlockerDataPlan, window.mParticle.getInstance());

            expect(() => { kitBlocker.isAttributeKeyBlocked('unplannedAttr') }).to.not.throw(TypeError, /Cannot read properties of undefined \(reading 'unplannedAttr'\)/)
            // "Allow unplanned user attributes" is prioritized when blocking unplanned attributes is also enabled, hence the expected value is false
            expect(kitBlocker.isAttributeKeyBlocked('unplannedAttr')).to.equal(false)
            // reset data points
            dataPlan.dtpn.vers.version_document.data_points = oldDataPoints;

        });

        it('integration test - should allow an unplanned attribute to be set on forwarder if additionalProperties = true and blok.ua = true', async () => {
            let userAttributeDataPoint = dataPlan.dtpn.vers.version_document.data_points.find(dataPoint => {
                return dataPoint.match.type === 'user_attributes'
            });

            userAttributeDataPoint.validator.definition.additionalProperties = true;

            window.mParticle.config.kitConfigs.push(forwarderDefaultConfiguration('MockForwarder'));
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            window.mParticle.Identity.getCurrentUser().setUserAttribute('unplanned but unblocked', true);
            window.MockForwarder1.instance.should.have.property(
                'setUserAttributeCalled',
                true
            );

            userAttributeDataPoint.validator.definition.additionalProperties = false;
            
        });

        it('integration test - should allow an unplanned user attribute to be set on the forwarder if blok=false', async () => {
            window.mParticle.config.dataPlan.document.dtpn.blok.ua = false

            window.mParticle.config.kitConfigs.push(forwarderDefaultConfiguration('MockForwarder'));
            window.mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasIdentifyReturned);
            window.mParticle.Identity.getCurrentUser().setUserAttribute('unplanned but not blocked', true);
            window.MockForwarder1.instance.should.have.property(
                'setUserAttributeCalled',
                true
            );

            window.mParticle.config.dataPlan.document.dtpn.blok.ua = true
        });

        it('integration test - should block an unplanned attribute set via setUserTag from being set on the forwarder if additionalProperties = false and blok.ua = true', async () => {
            window.mParticle.config.kitConfigs.push(forwarderDefaultConfiguration('MockForwarder'));
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);
            window.mParticle.Identity.getCurrentUser().setUserTag('unplannedAttr', true);
            window.MockForwarder1.instance.should.have.property(
                'setUserAttributeCalled',
                false
            );
        });

        it('integration test - should allow an unplanned attribute set via setUserTag to be set on forwarder if additionalProperties = true and blok.ua = true', async () => {
            let userAttributeDataPoint = dataPlan.dtpn.vers.version_document.data_points.find(dataPoint => {
                return dataPoint.match.type === 'user_attributes'
            });

            userAttributeDataPoint.validator.definition.additionalProperties = true;

            window.mParticle.config.kitConfigs.push(forwarderDefaultConfiguration('MockForwarder'));
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            window.mParticle.Identity.getCurrentUser().setUserTag('unplanned but unblocked', true);
            window.MockForwarder1.instance.should.have.property(
                'setUserAttributeCalled',
                true
            );

            userAttributeDataPoint.validator.definition.additionalProperties = false;
        });

        it('integration test - should allow an unplanned user attribute set via setUserTag to be set on the forwarder if blok=false', async () => {
            window.mParticle.config.dataPlan.document.dtpn.blok.ua = false
            window.mParticle.config.kitConfigs.push(forwarderDefaultConfiguration('MockForwarder'));
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            window.mParticle.Identity.getCurrentUser().setUserTag('unplanned but not blocked', true);
            window.MockForwarder1.instance.should.have.property(
                'setUserAttributeCalled',
                true
            );

            window.mParticle.config.dataPlan.document.dtpn.blok.ua = true
        });

        describe('integration tests - user identity related', ()=> {
            let userIdentityRequest;

            beforeEach(() => {
                ['login', 'logout', 'modify'].forEach((identityMethod) => {
                    fetchMockSuccess(urls[identityMethod], { mpid: testMPID, is_logged_in: true })}
                );
                let mockForwarder = new MockForwarder();
                window.mParticle.addForwarder(mockForwarder);
                
                userIdentityRequest = {
                    userIdentities: {
                        google: 'test',
                        customerid: 'id1',
                        other: 'id2',
                        yahoo: 'yahoo1',
                        email: 'email@gmail.com'
                    },
                };
            });

            it('integration test - should not block any unplanned user identities to the forwarder when blok.id = true and additionalProperties = true', async () => {
                window.mParticle.config.kitConfigs.push(forwarderDefaultConfiguration('MockForwarder'));
                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);
                window.mParticle.Identity.login({userIdentities: {customerid: 'customerid1', email: 'email@gmail.com', 'google': 'GoogleId'}});
                await waitForCondition(() => {
                    return (
                        window.mParticle.getInstance()?._Store?.identityCallInFlight === false
                    );
                });
                window.mParticle.logEvent('something something something', Types.EventType.Navigation);
                let event = window.MockForwarder1.instance.receivedEvent;
                event.UserIdentities.find(UI => UI.Type === 1).should.have.property('Identity', 'customerid1');
                event.UserIdentities.find(UI => UI.Type === 7).should.have.property('Identity', 'email@gmail.com');
                event.UserIdentities.find(UI => UI.Type === 4).should.have.property('Identity', 'GoogleId');

            });

            it('integration test - should block user identities to the forwarder when additional properties = false and blok.id = true', async () => {
                let userIdentityDataPoint = dataPlan.dtpn.vers.version_document.data_points.find(dataPoint => {
                    return dataPoint.match.type === 'user_identities'
                });

                userIdentityDataPoint.validator.definition.additionalProperties = false;

                window.mParticle.config.kitConfigs.push(forwarderDefaultConfiguration('MockForwarder'));
                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);

                window.mParticle.Identity.login({userIdentities: {customerid: 'customerid1', email: 'email@gmail.com', 'google': 'GoogleId'}});
                await waitForCondition(() => {
                    return (
                        window.mParticle.getInstance()?._Store?.identityCallInFlight === false
                    );
                });
                window.mParticle.logEvent('something something something', Types.EventType.Navigation);
                let event = window.MockForwarder1.instance.receivedEvent;
                event.UserIdentities.find(UI => UI.Type === 1).should.have.property('Identity', 'customerid1');
                event.UserIdentities.find(UI => UI.Type === 7).should.have.property('Identity', 'email@gmail.com');
                (event.UserIdentities.find(UI => UI.Type === 4) === undefined).should.not.have.property('Identity', 'GoogleId');

                // reset
                userIdentityDataPoint.validator.definition.additionalProperties = true;

            });

            it('integration test - should not block identities from being passed to onUserIdentified/onLogoutComplete if blok.id = true and additionalProperties = true (in addition to having a filtered user identity list)', async () => {
                let config1 = forwarderDefaultConfiguration('MockForwarder', 1);
                (config1.userIdentityFilters = [4]),
                    window.mParticle.config.kitConfigs.push(config1);

                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);
                window.mParticle.Identity.logout(userIdentityRequest);
                await waitForCondition(() => {
                    return (
                        window.mParticle.getInstance()?._Store?.identityCallInFlight === false
                    );
                });
                let onUserIdentifiedUserIdentities = window.MockForwarder1.instance.onUserIdentifiedUser
                    .getUserIdentities()
                    .userIdentities;
                onUserIdentifiedUserIdentities.should.not.have.property('google');
                onUserIdentifiedUserIdentities.should.have.property('customerid', 'id1');
                onUserIdentifiedUserIdentities.should.have.property('other', 'id2');
                onUserIdentifiedUserIdentities.should.have.property('yahoo', 'yahoo1');
                onUserIdentifiedUserIdentities.should.have.property('email', 'email@gmail.com');

                let onLogoutCompleteUserIdentities = window.MockForwarder1.instance.onLogoutCompleteUser
                    .getUserIdentities()
                    .userIdentities;
                onLogoutCompleteUserIdentities.should.not.have.property('google');
                onLogoutCompleteUserIdentities.should.have.property('customerid', 'id1');
                onLogoutCompleteUserIdentities.should.have.property('other', 'id2');
                onLogoutCompleteUserIdentities.should.have.property('yahoo', 'yahoo1');
                onLogoutCompleteUserIdentities.should.have.property('email', 'email@gmail.com');

            });

            it('integration test - should block identities from being passed to onUserIdentified/onLogoutComplete if blok.id = true and additionalProperties = false (in addition to having a filtered user identity list)', async () => {
                let userIdentityDataPoint = dataPlan.dtpn.vers.version_document.data_points.find(dataPoint => {
                    return dataPoint.match.type === 'user_identities'
                });

                userIdentityDataPoint.validator.definition.additionalProperties = false;

                let config1 = forwarderDefaultConfiguration('MockForwarder', 1);
                (config1.userIdentityFilters = [4]),
                    window.mParticle.config.kitConfigs.push(config1);

                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);
                window.mParticle.Identity.logout(userIdentityRequest);
                await waitForCondition(() => {
                    return (
                        window.mParticle.getInstance()?._Store?.identityCallInFlight === false
                    );
                });
                let onUserIdentifiedUserIdentities = window.MockForwarder1.instance.onUserIdentifiedUser
                    .getUserIdentities()
                    .userIdentities;
                onUserIdentifiedUserIdentities.should.have.property('customerid', 'id1');
                onUserIdentifiedUserIdentities.should.have.property('email', 'email@gmail.com');
                onUserIdentifiedUserIdentities.should.not.have.property('google');
                onUserIdentifiedUserIdentities.should.not.have.property('other', 'id2');
                onUserIdentifiedUserIdentities.should.not.have.property('yahoo');

                let onLogoutCompleteUserIdentities = window.MockForwarder1.instance.onLogoutCompleteUser
                    .getUserIdentities()
                    .userIdentities;
                onLogoutCompleteUserIdentities.should.have.property('customerid', 'id1');
                onLogoutCompleteUserIdentities.should.have.property('email', 'email@gmail.com');
                onLogoutCompleteUserIdentities.should.not.have.property('google');
                onLogoutCompleteUserIdentities.should.not.have.property('other', 'id2');
                onLogoutCompleteUserIdentities.should.not.have.property('yahoo');

                userIdentityDataPoint.validator.definition.additionalProperties = true;
                
            });

            it('integration test - should not block identities from being passed to onUserIdentified/onModifyComplete if blok.id = true and additionalProperties = true (in addition to having a filtered user identity list)', async () => {
                let config1 = forwarderDefaultConfiguration('MockForwarder', 1);
                (config1.userIdentityFilters = [4]),
                    window.mParticle.config.kitConfigs.push(config1);

                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);
                window.mParticle.Identity.modify(userIdentityRequest);
                await waitForCondition(() => {
                    return (
                        window.mParticle.getInstance()?._Store?.identityCallInFlight === false
                    );
                });
                let onUserIdentifiedUserIdentities = window.MockForwarder1.instance.onUserIdentifiedUser
                    .getUserIdentities()
                    .userIdentities;
                onUserIdentifiedUserIdentities.should.not.have.property('google');
                onUserIdentifiedUserIdentities.should.have.property('customerid', 'id1');
                onUserIdentifiedUserIdentities.should.have.property('other', 'id2');
                onUserIdentifiedUserIdentities.should.have.property('yahoo', 'yahoo1');
                onUserIdentifiedUserIdentities.should.have.property('email', 'email@gmail.com');

                let onModifyCompleteUserIdentities = window.MockForwarder1.instance.onModifyCompleteUser
                    .getUserIdentities()
                    .userIdentities;
                onModifyCompleteUserIdentities.should.not.have.property('google');
                onModifyCompleteUserIdentities.should.have.property('customerid', 'id1');
                onModifyCompleteUserIdentities.should.have.property('other', 'id2');
                onModifyCompleteUserIdentities.should.have.property('yahoo', 'yahoo1');
                onModifyCompleteUserIdentities.should.have.property('email', 'email@gmail.com');

            });

            it('integration test - should block identities from being passed to onUserIdentified/onModifyComplete if blok.id = true and additionalProperties = false (in addition to having a filtered user identity list)', async () => {
                let userIdentityDataPoint = dataPlan.dtpn.vers.version_document.data_points.find(dataPoint => {
                    return dataPoint.match.type === 'user_identities'
                });

                userIdentityDataPoint.validator.definition.additionalProperties = false;

                let config1 = forwarderDefaultConfiguration('MockForwarder', 1);
                (config1.userIdentityFilters = [4]),
                    window.mParticle.config.kitConfigs.push(config1);

                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);
                window.mParticle.Identity.modify(userIdentityRequest);
                await waitForCondition(() => {
                    return (
                        window.mParticle.getInstance()?._Store?.identityCallInFlight === false
                    );
                });
                let onUserIdentifiedUserIdentities = window.MockForwarder1.instance.onUserIdentifiedUser
                    .getUserIdentities()
                    .userIdentities;
                onUserIdentifiedUserIdentities.should.have.property('customerid', 'id1');
                onUserIdentifiedUserIdentities.should.have.property('email', 'email@gmail.com');
                onUserIdentifiedUserIdentities.should.not.have.property('google');
                onUserIdentifiedUserIdentities.should.not.have.property('other', 'id2');
                onUserIdentifiedUserIdentities.should.not.have.property('yahoo');

                let onModifyCompleteUserIdentities = window.MockForwarder1.instance.onModifyCompleteUser
                    .getUserIdentities()
                    .userIdentities;
                onModifyCompleteUserIdentities.should.have.property('customerid', 'id1');
                onModifyCompleteUserIdentities.should.have.property('email', 'email@gmail.com');
                onModifyCompleteUserIdentities.should.not.have.property('google');
                onModifyCompleteUserIdentities.should.not.have.property('other', 'id2');
                onModifyCompleteUserIdentities.should.not.have.property('yahoo');

                userIdentityDataPoint.validator.definition.additionalProperties = true;
                
            });

            it('integration test - should not block identities from being passed to onUserIdentified/onIdentifyComplete if blok.id = true and additionalProperties = true (in addition to having a filtered user identity list)', async () => {
                let config1 = forwarderDefaultConfiguration('MockForwarder', 1);
                (config1.userIdentityFilters = [4]),
                    window.mParticle.config.kitConfigs.push(config1);

                window.mParticle.config.identifyRequest = userIdentityRequest;

                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);
                let onUserIdentifiedUserIdentities = window.MockForwarder1.instance.onUserIdentifiedUser
                    .getUserIdentities()
                    .userIdentities;
                onUserIdentifiedUserIdentities.should.not.have.property('google');
                onUserIdentifiedUserIdentities.should.have.property('customerid', 'id1');
                onUserIdentifiedUserIdentities.should.have.property('other', 'id2');
                onUserIdentifiedUserIdentities.should.have.property('yahoo', 'yahoo1');
                onUserIdentifiedUserIdentities.should.have.property('email', 'email@gmail.com');

                let onIdentifyCompleteUserIdentities = window.MockForwarder1.instance.onIdentifyCompleteUser
                    .getUserIdentities()
                    .userIdentities;
                onIdentifyCompleteUserIdentities.should.not.have.property('google');
                onIdentifyCompleteUserIdentities.should.have.property('customerid', 'id1');
                onIdentifyCompleteUserIdentities.should.have.property('other', 'id2');
                onIdentifyCompleteUserIdentities.should.have.property('yahoo', 'yahoo1');
                onIdentifyCompleteUserIdentities.should.have.property('email', 'email@gmail.com')

            });

            it('integration test - should block identities from being passed to onUserIdentified/onIdentifyComplete if blok.id = true and additionalProperties = false (in addition to having a filtered user identity list)', async () => {
                let userIdentityDataPoint = dataPlan.dtpn.vers.version_document.data_points.find(dataPoint => {
                    return dataPoint.match.type === 'user_identities'
                });

                userIdentityDataPoint.validator.definition.additionalProperties = false;

                let config1 = forwarderDefaultConfiguration('MockForwarder', 1);
                (config1.userIdentityFilters = [4]),
                    window.mParticle.config.kitConfigs.push(config1);

                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);

                window.mParticle.Identity.identify(userIdentityRequest);
                await waitForCondition(() => {
                    return (
                        window.mParticle.getInstance()?._Store?.identityCallInFlight === false
                    );
                });
                let onUserIdentifiedUserIdentities = window.MockForwarder1.instance.onUserIdentifiedUser
                    .getUserIdentities()
                    .userIdentities;
                onUserIdentifiedUserIdentities.should.have.property('customerid', 'id1');
                onUserIdentifiedUserIdentities.should.have.property('email', 'email@gmail.com');
                onUserIdentifiedUserIdentities.should.not.have.property('google');
                onUserIdentifiedUserIdentities.should.not.have.property('other', 'id2');
                onUserIdentifiedUserIdentities.should.not.have.property('yahoo');

                let onIdentifyCompleteUserIdentities = window.MockForwarder1.instance.onIdentifyCompleteUser
                    .getUserIdentities()
                    .userIdentities;
                onIdentifyCompleteUserIdentities.should.have.property('customerid', 'id1');
                onIdentifyCompleteUserIdentities.should.have.property('email', 'email@gmail.com');
                onIdentifyCompleteUserIdentities.should.not.have.property('google');
                onIdentifyCompleteUserIdentities.should.not.have.property('other', 'id2');
                onIdentifyCompleteUserIdentities.should.not.have.property('yahoo');

                userIdentityDataPoint.validator.definition.additionalProperties = true;
                
            });

            it('integration test - should not block identities from being passed to onUserIdentified/onLoginComplete if blok.id = true and additionalProperties = true (in addition to having a filtered user identity list)', async () => {
                let config1 = forwarderDefaultConfiguration('MockForwarder', 1);
                (config1.userIdentityFilters = [4]),
                    window.mParticle.config.kitConfigs.push(config1);

                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);

                window.mParticle.Identity.login(userIdentityRequest);

                await waitForCondition(() => {
                    return (
                        window.mParticle.getInstance()?._Store?.identityCallInFlight === false
                    );
                });
                let onUserIdentifiedUserIdentities = window.MockForwarder1.instance.onUserIdentifiedUser
                    .getUserIdentities()
                    .userIdentities;
                onUserIdentifiedUserIdentities.should.not.have.property('google');
                onUserIdentifiedUserIdentities.should.have.property('customerid', 'id1');
                onUserIdentifiedUserIdentities.should.have.property('other', 'id2');
                onUserIdentifiedUserIdentities.should.have.property('yahoo', 'yahoo1');
                onUserIdentifiedUserIdentities.should.have.property('email', 'email@gmail.com');

                let onLoginCompleteUserIdentities = window.MockForwarder1.instance.onLoginCompleteUser
                    .getUserIdentities()
                    .userIdentities;
                onLoginCompleteUserIdentities.should.not.have.property('google');
                onLoginCompleteUserIdentities.should.have.property('customerid', 'id1');
                onLoginCompleteUserIdentities.should.have.property('other', 'id2');
                onLoginCompleteUserIdentities.should.have.property('yahoo', 'yahoo1');
                onLoginCompleteUserIdentities.should.have.property('email', 'email@gmail.com');

            });

            it('integration test - should block identities from being passed to onUserIdentified/onLoginComplete if blok.id = true and additionalProperties = false (in addition to having a filtered user identity list)', async () => {
                let userIdentityDataPoint = dataPlan.dtpn.vers.version_document.data_points.find(dataPoint => {
                    return dataPoint.match.type === 'user_identities'
                });

                userIdentityDataPoint.validator.definition.additionalProperties = false;

                let mockForwarder = new MockForwarder();
                window.mParticle.addForwarder(mockForwarder);

                let config1 = forwarderDefaultConfiguration('MockForwarder', 1);
                (config1.userIdentityFilters = [4]),
                    window.mParticle.config.kitConfigs.push(config1);

                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);
                window.mParticle.Identity.login(userIdentityRequest);
                await waitForCondition(() => {
                    return (
                        window.mParticle.getInstance()?._Store?.identityCallInFlight === false
                    );
                });
                let onUserIdentifiedUserIdentities = window.MockForwarder1.instance.onUserIdentifiedUser
                    .getUserIdentities()
                    .userIdentities;
                onUserIdentifiedUserIdentities.should.have.property('customerid', 'id1');
                onUserIdentifiedUserIdentities.should.have.property('email', 'email@gmail.com');
                onUserIdentifiedUserIdentities.should.not.have.property('google');
                onUserIdentifiedUserIdentities.should.not.have.property('other', 'id2');
                onUserIdentifiedUserIdentities.should.not.have.property('yahoo');

                let onLoginCompleteUserIdentities = window.MockForwarder1.instance.onLoginCompleteUser
                    .getUserIdentities()
                    .userIdentities;
                onLoginCompleteUserIdentities.should.have.property('customerid', 'id1');
                onLoginCompleteUserIdentities.should.have.property('email', 'email@gmail.com');
                onLoginCompleteUserIdentities.should.not.have.property('google');
                onLoginCompleteUserIdentities.should.not.have.property('other', 'id2');
                onLoginCompleteUserIdentities.should.not.have.property('yahoo');

                userIdentityDataPoint.validator.definition.additionalProperties = true;
                
        });

        describe('integration tests - kit initialization and setUserIdentity', () => {
            const PLANNED_ATTRIBUTE = 'my attribute';
            const PLANNED_ATTRIBUTE_STORED_BEFORE_INIT = 'my other attribute';
            const UNPLANNED_ATTRIBUTE = 'unplannedAttr';
            const plannedIdentities = {
                customerid: 'id1',
                email: 'email@gmail.com',
            };
            const unplannedIdentities = {
                google: 'GoogleId',
                yahoo: 'yahoo1',
            };
            const allIdentities = {
                ...plannedIdentities,
                ...unplannedIdentities,
            };
            const identityMethods: ('login' | 'logout' | 'modify')[] = [
                'login',
                'logout',
                'modify',
            ];

            let userIdentityDataPoint;
            let originalDataPoints;

            const identityTypesOf = (
                calls: { Identity: string; Type: number }[]
            ): number[] => calls.map(call => call.Type);

            // Waiting on the identity call rather than on the asserted value makes
            // an over-blocking regression a diff instead of a timeout.
            const identityCallSettled = () =>
                window.mParticle.getInstance()?._Store?.identityCallInFlight ===
                false;

            beforeEach(() => {
                originalDataPoints =
                    dataPlan.dtpn.vers.version_document.data_points;

                identityMethods.forEach(identityMethod => {
                    fetchMockSuccess(urls[identityMethod], {
                        mpid: testMPID,
                        is_logged_in: true,
                    });
                });

                userIdentityDataPoint = dataPlan.dtpn.vers.version_document.data_points.find(
                    dataPoint => dataPoint.match.type === 'user_identities'
                );
                userIdentityDataPoint.validator.definition.additionalProperties = false;
            });

            afterEach(() => {
                // dataPlan.json is shared across this file; restore so a failure cannot leak.
                if (userIdentityDataPoint) {
                    userIdentityDataPoint.validator.definition.additionalProperties = true;
                }
                dataPlan.dtpn.vers.version_document.data_points = originalDataPoints;
            });

            it('integration test - should not pass blocked user attributes or user identities to a kit when it is initialized', async () => {
                window.mParticle.config.kitConfigs.push(
                    forwarderDefaultConfiguration('MockForwarder')
                );
                window.mParticle.config.identifyRequest = {
                    userIdentities: allIdentities,
                };

                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);

                const user = window.mParticle.Identity.getCurrentUser();
                user.setUserAttribute(PLANNED_ATTRIBUTE, 'planned value');
                user.setUserAttribute(UNPLANNED_ATTRIBUTE, 'unplanned value');

                const previousInstance = window.MockForwarder1.instance;
                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(
                    () => window.MockForwarder1.instance !== previousInstance
                );

                const initUserAttributes =
                    window.MockForwarder1.instance.userAttributesOnInit;
                initUserAttributes.should.have.property(
                    PLANNED_ATTRIBUTE,
                    'planned value'
                );
                initUserAttributes.should.not.have.property(
                    UNPLANNED_ATTRIBUTE
                );

                const initIdentityTypes = identityTypesOf(
                    window.MockForwarder1.instance.userIdentitiesOnInit
                );
                expect(initIdentityTypes).to.include(
                    Types.IdentityType.CustomerId
                );
                expect(initIdentityTypes).to.include(Types.IdentityType.Email);
                expect(initIdentityTypes).to.not.include(
                    Types.IdentityType.Google
                );
                expect(initIdentityTypes).to.not.include(
                    Types.IdentityType.Yahoo
                );
            });

            it('integration test - should not pass blocked user attributes to a kit that is initialized later by conditional forwarding', async () => {
                const kitConfig = forwarderDefaultConfiguration('MockForwarder');
                kitConfig.filteringUserAttributeValue = {
                    userAttributeName: window.mParticle
                        .generateHash(PLANNED_ATTRIBUTE)
                        .toString(),
                    userAttributeValue: window.mParticle
                        .generateHash('on')
                        .toString(),
                    includeOnMatch: true,
                };
                window.mParticle.config.kitConfigs.push(kitConfig);

                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);

                expect(
                    window.MockForwarder1.instance.userAttributesOnInit,
                    'kit must not be initialized before the rule matches'
                ).to.equal(null);

                const user = window.mParticle.Identity.getCurrentUser();
                user.setUserAttribute(UNPLANNED_ATTRIBUTE, 'unplanned value');
                user.setUserAttribute(
                    PLANNED_ATTRIBUTE_STORED_BEFORE_INIT,
                    'planned value'
                );
                user.setUserAttribute(PLANNED_ATTRIBUTE, 'on');

                const initUserAttributes =
                    window.MockForwarder1.instance.userAttributesOnInit;
                initUserAttributes.should.have.property(
                    PLANNED_ATTRIBUTE_STORED_BEFORE_INIT,
                    'planned value'
                );
                initUserAttributes.should.have.property(PLANNED_ATTRIBUTE, 'on');
                initUserAttributes.should.not.have.property(
                    UNPLANNED_ATTRIBUTE
                );
            });

            it('integration test - should not pass blocked user identities to a kit that is initialized on a user change', async () => {
                const kitConfig = forwarderDefaultConfiguration('MockForwarder');
                kitConfig.excludeAnonymousUser = true;
                window.mParticle.config.kitConfigs.push(kitConfig);

                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);

                expect(
                    window.MockForwarder1.instance.userIdentitiesOnInit,
                    'kit must not be initialized while the user is anonymous'
                ).to.equal(null);

                window.mParticle.Identity.login({
                    userIdentities: allIdentities,
                });
                await waitForCondition(identityCallSettled);

                const initIdentityTypes = identityTypesOf(
                    window.MockForwarder1.instance.userIdentitiesOnInit
                );
                expect(initIdentityTypes).to.include(
                    Types.IdentityType.CustomerId
                );
                expect(initIdentityTypes).to.include(Types.IdentityType.Email);
                expect(initIdentityTypes).to.not.include(
                    Types.IdentityType.Google
                );
                expect(initIdentityTypes).to.not.include(
                    Types.IdentityType.Yahoo
                );
            });

            it('integration test - should not call setUserIdentity on a kit for a blocked user identity at identify', async () => {
                window.mParticle.config.kitConfigs.push(
                    forwarderDefaultConfiguration('MockForwarder')
                );
                window.mParticle.config.identifyRequest = {
                    userIdentities: allIdentities,
                };

                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);
                await waitForCondition(identityCallSettled);

                const calledTypes = identityTypesOf(
                    window.MockForwarder1.instance.setUserIdentityCalls
                );
                expect(calledTypes).to.include(Types.IdentityType.CustomerId);
                expect(calledTypes).to.include(Types.IdentityType.Email);
                expect(calledTypes).to.not.include(Types.IdentityType.Google);
                expect(calledTypes).to.not.include(Types.IdentityType.Yahoo);
            });

            identityMethods.forEach(identityMethod => {
                it(`integration test - should not call setUserIdentity on a kit for a blocked user identity on ${identityMethod}`, async () => {
                    window.mParticle.config.kitConfigs.push(
                        forwarderDefaultConfiguration('MockForwarder')
                    );

                    // No identifyRequest, so every call recorded comes from this method.
                    window.mParticle.init(apiKey, window.mParticle.config);
                    await waitForCondition(hasIdentifyReturned);

                    window.mParticle.Identity[identityMethod]({
                        userIdentities: allIdentities,
                    });
                    await waitForCondition(identityCallSettled);

                    const calledTypes = identityTypesOf(
                        window.MockForwarder1.instance.setUserIdentityCalls
                    );
                    expect(calledTypes).to.include(
                        Types.IdentityType.CustomerId
                    );
                    expect(calledTypes).to.include(Types.IdentityType.Email);
                    expect(calledTypes).to.not.include(
                        Types.IdentityType.Google
                    );
                    expect(calledTypes).to.not.include(Types.IdentityType.Yahoo);
                });
            });

            it('integration test - should pass every user attribute and user identity to a kit when no data plan is configured', async () => {
                delete window.mParticle.config.dataPlan;

                window.mParticle.config.kitConfigs.push(
                    forwarderDefaultConfiguration('MockForwarder')
                );
                window.mParticle.config.identifyRequest = {
                    userIdentities: allIdentities,
                };

                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);
                await waitForCondition(identityCallSettled);

                // Assert before the second init replaces the instance these calls hit.
                const calledTypes = identityTypesOf(
                    window.MockForwarder1.instance.setUserIdentityCalls
                );
                expect(calledTypes).to.include(Types.IdentityType.CustomerId);
                expect(calledTypes).to.include(Types.IdentityType.Google);
                expect(calledTypes).to.include(Types.IdentityType.Yahoo);

                const user = window.mParticle.Identity.getCurrentUser();
                user.setUserAttribute(PLANNED_ATTRIBUTE, 'planned value');
                user.setUserAttribute(UNPLANNED_ATTRIBUTE, 'unplanned value');

                const previousInstance = window.MockForwarder1.instance;
                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(
                    () => window.MockForwarder1.instance !== previousInstance
                );

                const initUserAttributes =
                    window.MockForwarder1.instance.userAttributesOnInit;
                initUserAttributes.should.have.property(
                    PLANNED_ATTRIBUTE,
                    'planned value'
                );
                initUserAttributes.should.have.property(
                    UNPLANNED_ATTRIBUTE,
                    'unplanned value'
                );

                const initIdentityTypes = identityTypesOf(
                    window.MockForwarder1.instance.userIdentitiesOnInit
                );
                expect(initIdentityTypes).to.include(
                    Types.IdentityType.CustomerId
                );
                expect(initIdentityTypes).to.include(Types.IdentityType.Google);
                expect(initIdentityTypes).to.include(Types.IdentityType.Yahoo);
            });

            it('integration test - should not throw an error when unplanned user identities are allowed and blok.id = true', () => {
                dataPlan.dtpn.vers.version_document.data_points = [];
                const kitBlocker = new KitBlocker(
                    kitBlockerDataPlan,
                    window.mParticle.getInstance()
                );

                expect(() => {
                    kitBlocker.isIdentityBlocked('email');
                }).to.not.throw();
                expect(kitBlocker.isIdentityBlocked('email')).to.equal(false);
            });
        });

        describe('integration tests - product attribute related', () => {
            let prodattr1, prodattr2, product1, product2, transactionAttributes, customAttributes, customFlags;

            beforeEach(() => {
                let mockForwarder = new MockForwarder();
                window.mParticle.addForwarder(mockForwarder);

                window.mParticle.config.kitConfigs.push(forwarderDefaultConfiguration('MockForwarder'));
                window.mParticle.init(apiKey, window.mParticle.config);

                prodattr1 = {
                    'plannedAttr1': 'val1',
                    'plannedAttr2': 'val2',
                    'unplannedAttr1': 'val3'
                };
                prodattr2 = {
                    'plannedAttr1': 'val1',
                    'plannedAttr2': 'val2',
                    'unplannedAttr1': 'val3'
                };
    
                product1 = window.mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999, 1, 'variant', 'category', 'brand', 1, 'coupon', prodattr1);
                product2 = window.mParticle.eCommerce.createProduct('galaxy', 'galaxySKU', 799, 1, 'variant', 'category', 'brand', 1, 'coupon', prodattr2);
    
                transactionAttributes = {
                    Id: 'foo-transaction-id',
                    Revenue: 430.00,
                    Tax: 30
                };
                customAttributes = {sale: true};
                customFlags = {'Google.Category': 'travel'};
            })

            it('integration test - should block any unplanned product attributes from reaching the forwarder if additionalProperties = false and block.ea=true', async () => {
                await waitForCondition(hasIdentifyReturned);
                window.mParticle.eCommerce.logProductAction(
                    window.mParticle.ProductActionType['Purchase'],
                    [product1, product2],
                    customAttributes,
                    customFlags,
                    transactionAttributes);


                let event = window.MockForwarder1.instance.receivedEvent;
                let products = event.ProductAction.ProductList;

                products[0].Attributes.should.have.property('plannedAttr1', 'val1')
                products[0].Attributes.should.have.property('plannedAttr2', 'val2')
                products[0].Attributes.should.not.have.property('unplannedAttr1')

                products[1].Attributes.should.have.property('plannedAttr1', 'val1')
                products[1].Attributes.should.have.property('plannedAttr2', 'val2')
                products[1].Attributes.should.not.have.property('unplannedAttr1')
                
            });

            it('integration test - should not block unplanned product attributes from reaching the forwarder if additionalProperties = true and block.ea=true', async () => {
                await waitForCondition(hasIdentifyReturned);
                window.mParticle.eCommerce.logProductAction(
                    window.mParticle.ProductActionType['AddToCart'],
                    [product1, product2],
                    customAttributes,
                    customFlags,
                    transactionAttributes);

                let event = window.MockForwarder1.instance.receivedEvent;
                let products = event.ProductAction.ProductList;

                products[0].Attributes.should.have.property('plannedAttr1', 'val1')
                products[0].Attributes.should.have.property('plannedAttr2', 'val2')
                products[0].Attributes.should.have.property('unplannedAttr1')

                products[1].Attributes.should.have.property('plannedAttr1', 'val1')
                products[1].Attributes.should.have.property('plannedAttr2', 'val2')
                products[1].Attributes.should.have.property('unplannedAttr1')
                
                })
            });
        })

        describe('integration tests - product attributes on every product action', () => {
            const productActions: [string, string, number][] = [
                ['AddToCart', 'add_to_cart', Types.CommerceEventType.ProductAddToCart],
                ['RemoveFromCart', 'remove_from_cart', Types.CommerceEventType.ProductRemoveFromCart],
                ['Checkout', 'checkout', Types.CommerceEventType.ProductCheckout],
                ['CheckoutOption', 'checkout_option', Types.CommerceEventType.ProductCheckoutOption],
                ['Click', 'click', Types.CommerceEventType.ProductClick],
                ['ViewDetail', 'view_detail', Types.CommerceEventType.ProductViewDetail],
                ['Purchase', 'purchase', Types.CommerceEventType.ProductPurchase],
                ['Refund', 'refund', Types.CommerceEventType.ProductRefund],
                ['AddToWishlist', 'add_to_wishlist', Types.CommerceEventType.ProductAddToWishlist],
                ['RemoveFromWishlist', 'remove_from_wish_list', Types.CommerceEventType.ProductRemoveFromWishlist],
            ];
            const plannedProductAttributesOnly = {
                additionalProperties: false,
                properties: { plannedAttr: {} },
            };
            const productAttributes = { plannedAttr: 'planned', unplannedAttr: 'unplanned' };

            function productActionDataPoint(action: string) {
                return {
                    match: { type: 'product_action', criteria: { action } },
                    validator: {
                        type: 'json_schema',
                        definition: {
                            properties: {
                                data: {
                                    properties: {
                                        product_action: {
                                            properties: {
                                                products: {
                                                    items: {
                                                        properties: { custom_attributes: plannedProductAttributesOnly },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                };
            }

            const productImpressionDataPoint = {
                match: { type: 'product_impression', criteria: {} },
                validator: {
                    type: 'json_schema',
                    definition: {
                        properties: {
                            data: {
                                properties: {
                                    product_impressions: {
                                        items: {
                                            properties: {
                                                products: {
                                                    items: {
                                                        properties: { custom_attributes: plannedProductAttributesOnly },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            };

            const userAttributesDataPoint = {
                match: { type: 'user_attributes', criteria: {} },
                validator: {
                    type: 'json_schema',
                    definition: {
                        additionalProperties: false,
                        properties: { planned_user_attr: {} },
                    },
                },
            };

            function createProductWithAttributes(name: string) {
                return window.mParticle.eCommerce.createProduct(
                    name, name + 'SKU', 10, 1, null, null, null, null, null, { ...productAttributes }
                );
            }

            beforeEach(() => {
                fetchMock.post(urls.events, 200, { overwriteRoutes: true });
                window.mParticle.config.dataPlan = {
                    document: {
                        dtpn: {
                            blok: { ev: false, ea: true, ua: true, id: false },
                            vers: {
                                version_document: {
                                    data_points: [
                                        ...productActions.map(([, action]) => productActionDataPoint(action)),
                                        productImpressionDataPoint,
                                        userAttributesDataPoint,
                                    ],
                                },
                            },
                        },
                    } as unknown as DataPlanResult,
                };
                window.mParticle.config.kitConfigs.push(forwarderDefaultConfiguration('MockForwarder'));
                window.mParticle.init(apiKey, window.mParticle.config);
            });

            it('integration test - should pass only planned product attributes to the forwarder for every product action and for product impressions', async () => {
                await waitForCondition(hasIdentifyReturned);

                productActions.forEach(([name]) => {
                    window.mParticle.eCommerce.logProductAction(
                        window.mParticle.ProductActionType[name],
                        createProductWithAttributes(name),
                        null,
                        null,
                        { Id: name + '-transaction' }
                    );
                });
                window.mParticle.eCommerce.logImpression(
                    window.mParticle.eCommerce.createImpression(
                        'impression list',
                        createProductWithAttributes('Impression')
                    )
                );

                const forwardedProductAttributes = window.MockForwarder1.instance.receivedEvents
                    .filter(event => event.EventDataType === Types.MessageType.Commerce)
                    .map(event => [
                        event.EventCategory,
                        (event.ProductAction
                            ? event.ProductAction.ProductList
                            : event.ProductImpressions[0].ProductList
                        ).map(product => product.Attributes),
                    ]);

                expect(forwardedProductAttributes).to.deep.equal([
                    ...productActions.map(([, , eventCategory]) => [eventCategory, [{ plannedAttr: 'planned' }]]),
                    [Types.CommerceEventType.ProductImpression, [{ plannedAttr: 'planned' }]],
                ]);
            });

            it('integration test - should keep blocking the rest of a product action that includes a product created without attributes', async () => {
                await waitForCondition(hasIdentifyReturned);
                const user = window.mParticle.Identity.getCurrentUser();
                user.setUserAttribute('planned_user_attr', 'kept');
                user.setUserAttribute('unplanned_user_attr', 'withheld');
                const productWithoutAttributes = window.mParticle.eCommerce.createProduct('Bare', 'BareSKU', 10);

                expect(productWithoutAttributes.Attributes, 'createProduct called without attributes').to.equal(null);

                window.mParticle.eCommerce.logProductAction(
                    window.mParticle.ProductActionType['Purchase'],
                    [productWithoutAttributes, createProductWithAttributes('Purchase')],
                    null,
                    null,
                    { Id: 'purchase-transaction' }
                );

                const forwardedPurchase = window.MockForwarder1.instance.receivedEvent;
                expect(forwardedPurchase.ProductAction.ProductList.map(product => product.Attributes)).to.deep.equal([
                    null,
                    { plannedAttr: 'planned' },
                ]);
                expect(forwardedPurchase.UserAttributes).to.deep.equal({ planned_user_attr: 'kept' });
            });

            it('integration test - should leave the logged product unchanged, so a later event uploads all of its attributes', async () => {
                await waitForCondition(hasIdentifyReturned);
                const product = createProductWithAttributes('Reused');

                window.mParticle.eCommerce.logProductAction(
                    window.mParticle.ProductActionType['Purchase'],
                    product,
                    null,
                    null,
                    { Id: 'reused-transaction' }
                );
                window.mParticle.eCommerce.logProductAction(
                    window.mParticle.ProductActionType['Refund'],
                    product,
                    null,
                    null,
                    { Id: 'reused-transaction' }
                );

                const forwardedPurchase = window.MockForwarder1.instance.receivedEvents.find(
                    event => event.EventCategory === Types.CommerceEventType.ProductPurchase
                );
                expect(forwardedPurchase.ProductAction.ProductList[0].Attributes).to.deep.equal({ plannedAttr: 'planned' });
                expect(product.Attributes).to.deep.equal(productAttributes);

                const uploadedRefund = findEventFromRequest(fetchMock.calls(), 'refund');
                expect(uploadedRefund.data.product_action.products[0].custom_attributes).to.deep.equal(productAttributes);
            });
        });

        describe('integration tests - client passed in data plan', () => {
            let clientProvidedDataPlan: DataPlanVersion = {
                version_document: {
                    data_points: [
                        {
                            match: {
                                // @ts-ignore (fix this after DataPlanMatchType importing works)
                                type: 'custom_event',
                                criteria: {
                                    event_name: 'locationEvent123',
                                    custom_event_type: 'location'
                                }
                            },
                            validator: {
                                // @ts-ignore (fix this after DataPlanMatchType importing works)
                                type: 'json_schema',
                                definition: {
                                    properties: {
                                        data: {
                                            properties: {
                                                custom_attributes: {
                                                    additionalProperties: false,
                                                    properties: {
                                                        foo: {},
                                                        'foo foo': {},
                                                        'foo number': {}
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            };

            it('integration test - should log an error if the client passes a data plan without the proper keys', async () => {
                // @ts-ignore - purposely leaving out blockUserIdentities as a key below
                window.mParticle.config.dataPlanOptions = { 
                    dataPlanVersion: clientProvidedDataPlan,
                    blockUserAttributes: true,
                    blockEventAttributes: true,
                    blockEvents: true,
                };

                let errorMessages = [];

                window.mParticle.config.logLevel = 'verbose';

                window.mParticle.config.logger = {
                    error: function(err) {
                        errorMessages.push(err)
                    }
                }

                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);
                errorMessages[0].should.equal('Ensure your config.dataPlanOptions object has the following keys: a "dataPlanVersion" object, and "blockUserAttributes", "blockEventAttributes", "blockEvents", "blockUserIdentities" booleans');

            });

            it('integration test - should prioritize data plan from config.dataPlanOptions over server provided data plan', async () => {
                let mockForwarder = new MockForwarder();
                window.mParticle.addForwarder(mockForwarder);
                window.mParticle.config.kitConfigs.push(forwarderDefaultConfiguration('MockForwarder'));

                window.mParticle.config.dataPlanOptions = {
                    dataPlanVersion: clientProvidedDataPlan,
                    blockUserAttributes: true,
                    blockEventAttributes: true,
                    blockEvents: true,
                    blockUserIdentities: true
                };

                let logs = [];

                window.mParticle.config.logLevel = 'verbose';

                window.mParticle.config.logger = {
                    verbose: function(msg) {
                        logs.push(msg)
                    }
                }

                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);
                logs.includes('Customer provided data plan found').should.equal(true);
                logs.includes('Data plan found from mParticle.js').should.equal(false);
                logs.includes('Data plan found from /config').should.equal(false);

                // this event is part of the server provided data plan (dataPlan.json) which is being ignored, so the event doesn't go through;
                window.mParticle.logEvent('something something something', Types.EventType.Navigation);

                let event = window.MockForwarder1.instance.receivedEvent;
                (event === null).should.equal(true);

                // this event is part of the clientGeneratedDataPlan
                window.mParticle.logEvent('locationEvent123', Types.EventType.Location, {
                    unplannedAttr: 'test',
                    foo: 'hi' 
                });

                event = window.MockForwarder1.instance.receivedEvent;

                event.should.have.property('EventName', 'locationEvent123');
                event.EventAttributes.should.have.property('foo', 'hi');
                event.EventAttributes.should.not.have.property('unplannedAttr');

            });

            it('integration test - should block or unblock planned events', async () => {
                let mockForwarder = new MockForwarder();
                window.mParticle.addForwarder(mockForwarder);

                delete window.mParticle.config.dataPlan;
                window.mParticle.config.dataPlanOptions = {
                    dataPlanVersion: clientProvidedDataPlan,
                    blockUserAttributes: true,
                    blockEventAttributes: true,
                    blockEvents: true,
                    blockUserIdentities: true
                }

                window.mParticle.config.kitConfigs.push(forwarderDefaultConfiguration('MockForwarder'));
                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);

                window.mParticle.logEvent('Blocked event');

                let event = window.MockForwarder1.instance.receivedEvent;
                (event === null).should.equal(true);

                window.mParticle.logEvent('locationEvent123', Types.EventType.Location, {
                    unplannedAttr: 'test',
                    foo: 'hi' 
                });

                event = window.MockForwarder1.instance.receivedEvent;

                event.should.have.property('EventName', 'locationEvent123');
                event.EventAttributes.should.have.property('foo', 'hi');
                event.EventAttributes.should.not.have.property('unplannedAttr');

            });
        });

        describe('integration tests - self hosting set up', () => {
            it('should create a proper kitblocker on a self hosted set up', async () => {
                fetchMock.get(`${urls.config}&plan_id=robs_plan&plan_version=1`, {
                    status: 200,
                    body: JSON.stringify({ dataPlanResult: dataPlan }),
                });

                let mockForwarder = new MockForwarder();
                window.mParticle.addForwarder(mockForwarder);
                //requestConfig = true indicates self hosted
                window.mParticle.config.requestConfig = true;
                window.mParticle.config.logLevel = 'verbose';
                window.mParticle.config.dataPlan = {
                    planId: 'robs_plan',
                    planVersion: 1
                }

                window.mParticle.config.kitConfigs.push(forwarderDefaultConfiguration('MockForwarder'));
                window.mParticle.init(apiKey, window.mParticle.config);
                
                window.mParticle.logEvent('Blocked event');

                await waitForCondition(hasIdentifyReturned);

                let event = window.MockForwarder1.instance.receivedEvent;
                (event === null).should.equal(true);
                
                window.mParticle.config.requestConfig = false;
            });

            it('should log an error if the data plan has an error on it', async () => {
                const errorMessage = 'This is an error';

                fetchMock.get(`${urls.config}&plan_id=robs_plan&plan_version=1`, {
                    status: 200,
                    body: JSON.stringify({ dataPlanResult: {error_message: errorMessage} }),
                });

                let errorMessages = [];

                let mockForwarder = new MockForwarder();
                window.mParticle.addForwarder(mockForwarder);

                //requestConfig = true indicates self hosted
                window.mParticle.config.requestConfig = true;
                window.mParticle.config.logLevel = 'verbose';
                window.mParticle.config.dataPlan = {
                    planId: 'robs_plan',
                    planVersion: 1
                }

                window.mParticle.config.kitConfigs.push(forwarderDefaultConfiguration('MockForwarder'));
                window.mParticle.config.logLevel = 'verbose';
                window.mParticle.config.logger = {
                    error: function(err) {
                        errorMessages.push(err)
                    }
                }

                window.mParticle.init(apiKey, window.mParticle.config);
                await waitForCondition(hasIdentifyReturned);

                errorMessages[0].should.equal(errorMessage);
                window.mParticle.config.requestConfig = false;
            });
        });
    });
});