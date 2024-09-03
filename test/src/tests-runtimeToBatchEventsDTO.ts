import * as Converter from '../../src/sdkToEventsApiConverter';
import { expect } from 'chai';
import Types from '../../src/types';
import { SDKEvent, MParticleWebSDK } from '../../src/sdkRuntimeModels';
import * as EventsApi from '@mparticle/event-models';
import { MPConfig, apiKey } from './config/constants';
import { IMParticleUser } from '../../src/identity-user-interfaces';

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
    }
}

describe('Old model to batch model conversion', () => {
    beforeEach(function() {
        window.mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        window.mParticle._resetForTests(MPConfig);
    });

    const batchDataTests = [{ devmode: false }, { devmode: true }];
    batchDataTests.forEach(params => {
        it('Batch level conversion ' + params, done => {
            window.mParticle._resetForTests(MPConfig);
            window.mParticle.config.appVersion = 'a version';
            window.mParticle.config.appName = 'a name';

            window.mParticle.init(apiKey, window.mParticle.config);
            let batch = Converter.convertEvents(null, null, window.mParticle.getInstance());
            expect(batch).to.be.null;

            batch = Converter.convertEvents(null, [], window.mParticle.getInstance());
            expect(batch).to.be.null;
            
            window.mParticle.getInstance()._Store.sessionId = 'foo-session-id';
            window.mParticle.getInstance()._Store.isFirstRun = false;
            window.mParticle.getInstance()._Store.devToken = 'foo token';
            window.mParticle.getInstance()._Store.deviceId = 'a device id';
            window.mParticle.getInstance()._Store.SDKConfig.isDevelopmentMode = params.devmode;
            window.mParticle.getInstance().Identity.getCurrentUser = () => {
                return {
                    getUserIdentities: () => {
                        return {
                            userIdentities: {
                                customerid: '1234567',
                                email: 'foo-email',
                                other: 'foo-other',
                                other2: 'foo-other2',
                                other3: 'foo-other3',
                                other4: 'foo-other4',
                            },
                        };
                    },
                    getAllUserAttributes: () => {
                        return {
                            'foo-user-attr': 'foo-attr-value',
                            'foo-user-attr-list': ['item1', 'item2'],
                        };
                    },
                    getMPID: () => {
                        return '98765';
                    },
                    getConsentState: () => {
                        return null;
                    },
                } as IMParticleUser;
            };

            const publicEvent = {
                messageType: Types.MessageType.PageEvent,
                name: 'foo page',
                data: { 'foo-attr': 'foo-val' },
                eventType: Types.EventType.Navigation,
                customFlags: { 'foo-flag': 'foo-flag-val' },
            };

            const sdkEvent = window.mParticle.getInstance()._ServerModel.createEventObject(
                publicEvent
                ) as SDKEvent;
                console.log(sdkEvent);
                expect(sdkEvent).to.be.ok;
            batch = Converter.convertEvents(
                '123',
                [sdkEvent, sdkEvent],
                window.mParticle.getInstance()
            );
            expect(batch).to.be.ok;
            expect(batch.mpid).to.equal('123');
            expect(batch.environment).to.equal(
                params.devmode ? 'development' : 'production'
            );
            expect(batch.application_info).to.be.ok;
            expect(batch.application_info.application_version).to.equal(
                'a version'
            );
            expect(batch.application_info.application_name).to.equal(
                'a name'
            );
            expect(batch.mp_deviceid).to.equal('a device id');
            expect(batch.user_attributes).to.be.ok;

            expect(batch.user_identities).to.be.ok;

            expect(batch.events).to.be.ok;
            expect(batch.events.length).to.equal(2);

            const batchEvent = batch.events[0] as EventsApi.CustomEvent;
            expect(batchEvent).to.be.ok;
            expect(batchEvent.data.event_name).to.equal('foo page');
            expect(batchEvent.data.custom_attributes).to.deep.equal({
                'foo-attr': 'foo-val',
            });
            expect(batchEvent.data.custom_event_type).to.equal('navigation');
            expect(batchEvent.data.custom_flags).to.deep.equal({
                'foo-flag': 'foo-flag-val',
            });
            expect(batchEvent.data.session_uuid).to.equal('foo-session-id');

            done();
        });
    });

    it('User attribute conversion ', done => {
        window.mParticle.getInstance().Identity.getCurrentUser = () => {
            return {
                getUserIdentities: () => {
                    return {
                        userIdentities: {},
                    };
                },
                getAllUserAttributes: () => {
                    return {
                        'foo-user-attr': 'foo-attr-value',
                        'foo-user-attr-list': ['item1', 'item2'],
                    };
                },
                getMPID: () => {
                    return '98765';
                },
                getConsentState: () => {
                    return null;
                },
            } as IMParticleUser;
        };
        const publicEvent = {
            messageType: Types.MessageType.PageEvent,
            name: 'foo page',
            data: { 'foo-attr': 'foo-val' },
            eventType: Types.EventType.Navigation,
            customFlags: { 'foo-flag': 'foo-flag-val' },
        };
        const sdkEvent = window.mParticle.getInstance()._ServerModel.createEventObject(
            publicEvent
        ) as SDKEvent;

        expect(sdkEvent).to.be.ok;
        const batch = Converter.convertEvents('123', [sdkEvent], window.mParticle.getInstance());

        expect(batch.user_attributes).to.be.ok;
        expect(batch.user_attributes).to.deep.equal({
            'foo-user-attr': 'foo-attr-value',
            'foo-user-attr-list': ['item1', 'item2'],
        });

        done();
    });

    it('Data Plan Context conversion', done => {
        const publicEvent = {
            messageType: Types.MessageType.PageEvent,
            name: 'foo page',
            data: { 'foo-attr': 'foo-val' },
            eventType: Types.EventType.Navigation,

        };
        const sdkEvent = window.mParticle.getInstance()._ServerModel.createEventObject(
            publicEvent
        ) as SDKEvent;

        sdkEvent.DataPlan = null;
        let batch = Converter.convertEvents('123', [sdkEvent], window.mParticle.getInstance());
        expect(batch.context).to.be.undefined;

        sdkEvent.DataPlan = {};
        batch = Converter.convertEvents('123', [sdkEvent], window.mParticle.getInstance());
        expect(batch.context).to.be.undefined;

        sdkEvent.DataPlan = {PlanId:  null};
        batch = Converter.convertEvents('123', [sdkEvent], window.mParticle.getInstance());
        expect(batch.context).to.be.undefined;

        sdkEvent.DataPlan = {PlanId:  null, PlanVersion:  2};
        batch = Converter.convertEvents('123', [sdkEvent], window.mParticle.getInstance());
        expect(batch.context).to.be.undefined;

        sdkEvent.DataPlan = {PlanId:  "foo", PlanVersion: null };
        batch = Converter.convertEvents('123', [sdkEvent], window.mParticle.getInstance());
        expect(batch.context).to.be.ok;
        expect(batch.context.data_plan).to.be.ok;
        expect(batch.context.data_plan.plan_id).to.equal("foo");
        expect(batch.context.data_plan.plan_version).be.undefined;

        sdkEvent.DataPlan = {PlanId:  "foo", PlanVersion: 4};
        batch = Converter.convertEvents('123', [sdkEvent], window.mParticle.getInstance());
        expect(batch.context).to.be.ok;
        expect(batch.context.data_plan).to.be.ok;
        expect(batch.context.data_plan.plan_id).to.equal("foo");
        expect(batch.context.data_plan.plan_version).be.equal(4);
        done();
    });

    it('User identity conversion ', done => {
        window.mParticle.getInstance().Identity.getCurrentUser = () => {
            return {
                getUserIdentities: () => {
                    return {
                        userIdentities: {
                            customerid: '1234567',
                            email: 'foo-email',
                            other: 'foo-other',
                            other2: 'foo-other2',
                            other3: 'foo-other3',
                            other4: 'foo-other4',
                        },
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
                },
            } as IMParticleUser;
        };
        const publicEvent = {
            messageType: Types.MessageType.PageEvent,
            name: 'foo page',
            data: { 'foo-attr': 'foo-val' },
            eventType: Types.EventType.Navigation,
            customFlags: { 'foo-flag': 'foo-flag-val' },
        };
        const sdkEvent = window.mParticle.getInstance()._ServerModel.createEventObject(
            publicEvent
        ) as SDKEvent;

        expect(sdkEvent).to.be.ok;
        const batch = Converter.convertEvents(
            '123',
            [sdkEvent, sdkEvent],
            window.mParticle.getInstance()
        );

        expect(batch.user_identities).to.be.ok;
        expect(batch.user_identities.customer_id).to.equal('1234567');
        expect(batch.user_identities.email).to.equal('foo-email');
        expect(batch.user_identities.other).to.equal('foo-other');
        expect(batch.user_identities.other_id_2).to.equal('foo-other2');
        expect(batch.user_identities.other_id_3).to.equal('foo-other3');
        expect(batch.user_identities.other_id_4).to.equal('foo-other4');

        done();
    });

    const baseEventConversion: { [key: number]: EventsApi.EventType } = {
        1: EventsApi.EventTypeEnum.sessionStart,
        2:  EventsApi.EventTypeEnum.sessionEnd,
        3:  EventsApi.EventTypeEnum.screenView,
        4:  EventsApi.EventTypeEnum.customEvent,
        5:  EventsApi.EventTypeEnum.crashReport,
        6:  EventsApi.EventTypeEnum.optOut,
        10: EventsApi.EventTypeEnum.applicationStateTransition,
        16: EventsApi.EventTypeEnum.commerceEvent,
    };

    Object.keys(baseEventConversion).forEach(key => {
        it('Base Event Conversion ' + baseEventConversion[key], done => {
            let event = Converter.convertEvent(null);
            expect(event).to.be.null;

            let publicEvent = {
                messageType: null,
                name: 'foo page',
                data: { 'foo-attr': 'foo-val' },
                eventType: Types.EventType.Navigation,
                customFlags: { 'foo-flag': 'foo-flag-val' },
            };
            let sdkEvent = window.mParticle.getInstance()._ServerModel.createEventObject(
                publicEvent
            ) as SDKEvent;

            event = Converter.convertEvent(sdkEvent);
            expect(event).to.be.null;

            publicEvent = {
                messageType: parseInt(key + '', 10),
                name: 'foo page',
                data: { 'foo-attr': 'foo-val' },
                eventType: Types.EventType.Navigation,
                customFlags: { 'foo-flag': 'foo-flag-val' },
            };
            sdkEvent = window.mParticle.getInstance()._ServerModel.createEventObject(
                publicEvent
            ) as SDKEvent;
            expect(sdkEvent).to.be.ok;

            event = Converter.convertEvent(sdkEvent);
            expect(event).to.be.ok;
            expect(event.event_type).to.equal(baseEventConversion[key]);
            done();
        });
    });

    it('Commerce Event Product Action convertion', done => {
        const sdkEvent: SDKEvent = {
            EventName: 'eCommerce - Purchase',
            EventCategory: 16,
            ExpandedEventCount: 0,
            EventAttributes: null,
            SDKVersion: '2.9.10',
            SourceMessageId: 'testSMID',
            SessionId: '391D4CCE-E7F9-473E-B5CD-8566DEB17425',
            SessionStartDate: 1569453582333,
            EventDataType: 16,
            Debug: true,
            Location: null,
            OptOut: null,
            DeviceId: '47f10c9d-f962-4f8a-b92a-8add36f86078',
            CurrencyCode: null,
            MPID: '1053073459916128825',
            ConsentState: null,
            Timestamp: 1569453613501,
            ProductAction: {
                ProductActionType: 7,
                ProductList: [
                    {
                        Name: 'item 1',
                        Sku: 'econ-1',
                        Price: 321,
                        Quantity: 1,
                        Brand: 'foo-brand',
                        Variant: 'foo-variant',
                        Category: 'foo-category',
                        Position: 1,
                        CouponCode: 'foo-coupon',
                        TotalAmount: 222,
                        Attributes: {
                            foo: 'bar',
                            foo2: 'bar2',
                        },
                    },
                    {
                        Name: 'item 2',
                        Sku: 'econ-2',
                        Price: 123,
                        Quantity: 2,
                        Brand: 'foo-brand',
                        Variant: 'foo-variant',
                        Category: 'foo-category',
                        Position: 2,
                        CouponCode: 'foo-coupon',
                        TotalAmount: 111,
                        Attributes: {
                            foo3: 'bar3',
                            foo4: 'bar4',
                        },
                    },
                ],
                TransactionId: 'foo-transaction-id',
                TotalAmount: 430.01,
                TaxAmount: 31,
            },
            IsFirstRun: false,
        };
        let batch = Converter.convertEvents(
            '1053073459916128825',
            [sdkEvent],
            window.mParticle.getInstance()
        );
        expect(batch).to.be.ok;
        expect(batch.mpid).to.equal(sdkEvent.MPID);
        expect(batch.events.length).to.equal(1);
        let event = batch.events[0] as EventsApi.CommerceEvent;
        expect(event).to.be.ok;
        expect(event.event_type).to.equal('commerce_event');
        expect(event.data.timestamp_unixtime_ms).to.equal(sdkEvent.Timestamp);
        expect(event.data.session_start_unixtime_ms).to.equal(
            sdkEvent.SessionStartDate
        );
        expect(event.data.product_action.action).to.equal('purchase');
        expect(event.data.product_action.products.length).to.equal(2);

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
            expect(product.total_product_amount).to.equal(
                sdkProduct.TotalAmount
            );
            expect(product.custom_attributes).to.deep.equal(
                sdkProduct.Attributes
            );
        }
        done();
    });

    it ('Media Event Conversion', done => {
        const sdkEvent: SDKEvent = {
            EventName: "Pause Event",
            EventCategory: 9,
            ExpandedEventCount: 0,
            EventDataType: 4,
            EventAttributes: {
                content_duration: '120000',
                content_id: "1234567",
                content_title: "My sweet sweet media",
                content_type: "Video",
                media_session_id: "07be2e14-7e05-4053-bcb5-94950365822d",
                playhead_position: '7023.335999999999',
                stream_type: "OnDemand",
            },
            ConsentState: null,
            CurrencyCode: null,
            CustomFlags: {},
            DataPlan: {},
            Debug: true,
            DeviceId: "0edd580e-d887-44e4-89ae-cd65aa0ee933",
            Location: null,
            MPID: "-8433569646818451201",
            OptOut: null,
            SDKVersion: "2.11.15",
            SourceMessageId: 'testSMID',
            SessionId: "64102C03-592F-440D-8BCC-1D27AAA6B188",
            SessionStartDate: 1603211322698,
            Timestamp: 1603212299414,
            UserAttributes: {},
            UserIdentities: [],
            IsFirstRun: true,
        }

        const batch = Converter.convertEvents(
            '-8433569646818451201',
            [sdkEvent],
            window.mParticle.getInstance()
        );

        expect(batch).to.be.ok;
        expect(batch.events.length).to.equal(1);
        const event = batch.events[0] as EventsApi.CustomEvent;
        expect(event).to.be.ok;
        expect(event.event_type).to.equal('custom_event');
        expect(event.data.custom_event_type).to.equal('media')

        done();
    });
});
