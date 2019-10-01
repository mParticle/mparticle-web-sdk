import * as Converter from '../../src/sdkToEventsApiConverter';
import { expect }  from 'chai';
import ServerModel from '../../src/serverModel'
import Types from '../../src/types'
import { SDKEvent, MParticleWebSDK } from '../../src/sdkRuntimeModels';
import * as EventsApi from '../../src/eventsApiModels';

declare global {
    interface Window { mParticle: MParticleWebSDK; }
}

describe('Old model to batch model conversion', () => {

    const batchDataTests = [
        {devmode:false},
        {devmode:true}
    ];

    batchDataTests.forEach((params) => {
        it('Batch level conversion ' + params, (done) => {

            let batch = Converter.convertEvents(null, null);
            expect(batch).to.be.null;

            batch = Converter.convertEvents(null, []);
            expect(batch).to.be.null;

            window.mParticle.Store = { 
                sessionId: 'foo-session-id',
                isFirstRun: false,
                devToken: 'foo token',
                deviceId: 'a device id',
                SDKConfig: { 
                    isDevelopmentMode: params.devmode, 
                    appVersion: 'a version'
                }
            };

            window.mParticle.Identity.getCurrentUser = () => {
                return {
                    getUserIdentities: () => {
                        return {    
                            userIdentities: { 
                                customerid:'1234567',
                                email: 'foo-email',
                                other: 'foo-other',
                                other2: 'foo-other2',
                                other3: 'foo-other3',
                                other4: 'foo-other4'
                            }
                        };
                    },
                    getAllUserAttributes: () => {
                        return {    
                            'foo-user-attr':'foo-attr-value',
                            'foo-user-attr-list':['item1','item2'],
                        };
                    },
                    getMPID: () => {
                        return '98765';
                    },
                    getConsentState: () => {
                        return null;
                    }
                }
            };

            const publicEvent = {
                messageType: Types.MessageType.PageEvent,
                name: 'foo page',
                data: {'foo-attr':'foo-val'},
                eventType: Types.EventType.Navigation,
                customFlags: {'foo-flag': 'foo-flag-val'}
            };
            const sdkEvent = ServerModel.createEventObject(publicEvent) as SDKEvent;

            expect(sdkEvent).to.be.ok;
            batch = Converter.convertEvents('123', [sdkEvent, sdkEvent]);
            expect(batch).to.be.ok;
            expect(batch.mpid).to.equal('123');
            expect(batch.environment).to.equal(params.devmode ? 'development' : 'production');
            expect(batch.application_info).to.be.ok;
            expect(batch.application_info.application_version).to.equal('a version');
            expect(batch.mp_deviceid).to.equal('a device id');
            expect(batch.user_attributes).to.be.ok;

            expect(batch.user_identities).to.be.ok;
 
            expect(batch.events).to.be.ok;
            expect(batch.events.length).to.equal(2);
            
            const batchEvent = batch.events[0] as EventsApi.CustomEvent;
            expect(batchEvent).to.be.ok;
            expect(batchEvent.data.event_name).to.equal('foo page');
            expect(batchEvent.data.custom_attributes).to.deep.equal({'foo-attr':'foo-val'});
            expect(batchEvent.data.custom_event_type).to.equal('navigation');
            expect(batchEvent.data.custom_flags).to.deep.equal({'foo-flag': 'foo-flag-val'});
            expect(batchEvent.data.session_uuid).to.equal('foo-session-id');

            done();
        });
    });

    it('User attribute conversion ', (done) => {
        window.mParticle.Identity.getCurrentUser = () => {
            return {
                getUserIdentities: () => {
                    return {    
                        userIdentities: {}
                    };
                },
                getAllUserAttributes: () => {
                    return {    
                        'foo-user-attr':'foo-attr-value',
                        'foo-user-attr-list':['item1','item2'],
                    };
                },
                getMPID: () => {
                    return '98765';
                },
                getConsentState: () => {
                    return null;
                }
            }
        };
        const publicEvent = {
            messageType: Types.MessageType.PageEvent,
            name: 'foo page',
            data: {'foo-attr':'foo-val'},
            eventType: Types.EventType.Navigation,
            customFlags: {'foo-flag': 'foo-flag-val'}
        };
        const sdkEvent = ServerModel.createEventObject(publicEvent) as SDKEvent;

        expect(sdkEvent).to.be.ok;
        const batch = Converter.convertEvents('123', [sdkEvent]);

        expect(batch.user_attributes).to.be.ok;
        expect(batch.user_attributes).to.deep.equal({    
            'foo-user-attr':'foo-attr-value',
            'foo-user-attr-list':['item1','item2'],
        });

        done();
    });

    it('User identity conversion ', (done) => {
        window.mParticle.Identity.getCurrentUser = () => {
            return {
                getUserIdentities: () => {
                    return {    
                        userIdentities: { 
                            customerid:'1234567',
                            email: 'foo-email',
                            other: 'foo-other',
                            other2: 'foo-other2',
                            other3: 'foo-other3',
                            other4: 'foo-other4'
                        }
                    };
                },
                getAllUserAttributes: () => {
                    return null;
                },
                getMPID: () => {
                    return '98765';
                },
                getConsentState: () => {
                    return null;
                }
            }
        };
        const publicEvent = {
            messageType: Types.MessageType.PageEvent,
            name: 'foo page',
            data: {'foo-attr':'foo-val'},
            eventType: Types.EventType.Navigation,
            customFlags: {'foo-flag': 'foo-flag-val'}
        };
        const sdkEvent = ServerModel.createEventObject(publicEvent) as SDKEvent;

        expect(sdkEvent).to.be.ok;
        const batch = Converter.convertEvents('123', [sdkEvent, sdkEvent]);

        expect(batch.user_identities).to.be.ok;
        expect(batch.user_identities.customer_id).to.equal('1234567');
        expect(batch.user_identities.email).to.equal('foo-email');
        expect(batch.user_identities.other).to.equal('foo-other');
        expect(batch.user_identities.other_id_2).to.equal('foo-other2');
        expect(batch.user_identities.other_id_3).to.equal('foo-other3');
        expect(batch.user_identities.other_id_4).to.equal('foo-other4');

        done();
    });

    const baseEventConversion: 
        { [key: number]: EventsApi.EventType } = {
                1:'session_start',
                2:'session_end',
                3:'screen_view',
                4:'custom_event',
                5:'crash_report',
                6:'opt_out',
                10:'application_state_transition',
                16:'commerce_event'
        };
    
    Object.keys(baseEventConversion).forEach((key) => {
        it('Base Event Conversion ' + baseEventConversion[key], (done) => {

            let event = Converter.convertEvent(null);
            expect(event).to.be.null;

            let publicEvent = {
                messageType: null,
                name: 'foo page',
                data: {'foo-attr':'foo-val'},
                eventType: Types.EventType.Navigation,
                customFlags: {'foo-flag': 'foo-flag-val'}
            };
            let sdkEvent = ServerModel.createEventObject(publicEvent) as SDKEvent;

            event = Converter.convertEvent(sdkEvent);
            expect(event).to.be.null;

            publicEvent = {
                messageType: parseInt(key+'',10),
                name: 'foo page',
                data: {'foo-attr':'foo-val'},
                eventType: Types.EventType.Navigation,
                customFlags: {'foo-flag': 'foo-flag-val'}
            };
            sdkEvent = ServerModel.createEventObject(publicEvent) as SDKEvent;
            expect(sdkEvent).to.be.ok;
    
            event = Converter.convertEvent(sdkEvent);
            expect(event).to.be.ok;
            expect(event.event_type).to.equal(baseEventConversion[key]);
            done();
        });
    });

    it('Commerce Event Product Action convertion', (done) => {
        const sdkEvent: SDKEvent = {
            'EventName':'eCommerce - Purchase',
            'EventCategory':16,
            'EventAttributes':null,
            'SDKVersion':'2.9.10',
            'SessionId':'391D4CCE-E7F9-473E-B5CD-8566DEB17425',
            'SessionStartDate':1569453582333,
            'EventDataType':16,
            'Debug':true,
            'Location':null,
            'OptOut':null,
            'DeviceId':'47f10c9d-f962-4f8a-b92a-8add36f86078',
            'CurrencyCode':null,
            'MPID':'1053073459916128825',
            'ConsentState':null,
            'Timestamp':1569453613501,
            'ProductAction':{
                'ProductActionType':7,
                'ProductList':[
                    {
                        'Name':'item 1',
                        'Sku':'econ-1',
                        'Price':321,
                        'Quantity':1,
                        'Brand':'foo-brand',
                        'Variant':'foo-variant',
                        'Category':'foo-category',
                        'Position':1,
                        'CouponCode':'foo-coupon',
                        'TotalAmount':222,
                        'Attributes':{
                            'foo':'bar',
                            'foo2':'bar2'
                        }
                    },
                    {
                        'Name':'item 2',
                        'Sku':'econ-2',
                        'Price':123,
                        'Quantity':2,
                        'Brand':'foo-brand',
                        'Variant':'foo-variant',
                        'Category':'foo-category',
                        'Position':2,
                        'CouponCode':'foo-coupon',
                        'TotalAmount':111,
                        'Attributes':{
                        'foo3':'bar3',
                        'foo4':'bar4'
                        }
                    }
                ],
                'TransactionId':'foo-transaction-id',
                'TotalAmount':430.01,
                'TaxAmount':31
            },
            'IsFirstRun':false
        };
        let batch = Converter.convertEvents('1053073459916128825', [sdkEvent])
        expect(batch).to.be.ok;
        expect(batch.mpid).to.equal(sdkEvent.MPID);
        expect(batch.events.length).to.equal(1)
        let event = batch.events[0] as EventsApi.CommerceEvent
        expect(event).to.be.ok;
        expect(event.event_type).to.equal('commerce_event')
        expect(event.data.timestamp_unixtime_ms).to.equal(sdkEvent.Timestamp);
        expect(event.data.session_start_unixtime_ms).to.equal(sdkEvent.SessionStartDate);
        expect(event.data.product_action.action).to.equal('purchase')
        expect(event.data.product_action.products.length).to.equal(2)
        
        for (let i = 0; i < event.data.product_action.products.length; i++) {
            let product = event.data.product_action.products[i];
            let sdkProduct = sdkEvent.ProductAction.ProductList[i];
            expect(product.name).to.equal(sdkProduct.Name);
            expect(product.id).to.equal(sdkProduct.Sku);
            expect(product.price).to.equal(sdkProduct.Price);
            expect(product.quantity).to.equal(sdkProduct.Quantity);
            expect(product.brand).to.equal(sdkProduct.Brand);
            expect(product.variant).to.equal(sdkProduct.Variant);
            expect(product.category).to.equal(sdkProduct.Category);
            expect(product.position).to.equal(sdkProduct.Position);
            expect(product.coupon_code).to.equal(sdkProduct.CouponCode);
            expect(product.total_product_amount).to.equal(sdkProduct.TotalAmount);
            expect(product.custom_attributes).to.deep.equal(sdkProduct.Attributes);
        }
        done()
    });
});