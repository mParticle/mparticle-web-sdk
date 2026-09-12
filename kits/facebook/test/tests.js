/* eslint-disable no-undef */
describe('Facebook Forwarder', function () {
    var MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Commerce: 16
        },
        IdentityType = {
            Other: 0,
            CustomerId: 1,
            Facebook: 2,
            Twitter: 3,
            Google: 4,
            Microsoft: 5,
            Yahoo: 6,
            Email: 7,
            FacebookCustomAudienceId: 9,
            Other2: 10,
            Other3: 11,
            Other4: 12,
            Other5: 13,
            Other6: 14,
            Other7: 15,
            Other8: 16,
            Other9: 17,
            Other10: 18,
            MobileNumber: 19,
            PhoneNumber2: 20,
            PhoneNumber3: 21,
        },
        EventType = {
            Unknown: 0,
            Navigation: 1,
            Location: 2,
            Search: 3,
            Transaction: 4,
            UserContent: 5,
            UserPreference: 6,
            Social: 7,
            Other: 8,
            Media: 9,
            getName: function () {
                return 'blahblah';
            }
        },
        ProductActionType = {
            Unknown: 0,
            AddToCart: 1,
            RemoveFromCart: 2,
            Checkout: 3,
            CheckoutOption: 4,
            Click: 5,
            ViewDetail: 6,
            Purchase: 7,
            Refund: 8,
            AddToWishlist: 9,
            RemoveFromWishlist: 10
        },
        CommerceEventType = {
            ProductAddToCart: 10,
            ProductRemoveFromCart: 11,
            ProductCheckout: 12,
            ProductCheckoutOption: 13,
            ProductClick: 14,
            ProductViewDetail: 15,
            ProductPurchase: 16,
            ProductRefund: 17,
            PromotionView: 18,
            PromotionClick: 19,
            ProductAddToWishlist: 20,
            ProductRemoveFromWishlist: 21,
            ProductImpression: 22
        };
    ReportingService = function () {
        var self = this;

        this.id = null;
        this.event = null;

        this.cb = function (id, event) {
            self.id = id;
            self.event = event;
        };

        this.reset = function () {
            this.id = null;
            this.event = null;
        };
    },
        reportService = new ReportingService();

    function MPMock() {
        var self = this;
        var calledMethods = ['track', 'init'];

        for (var i = 0; i < calledMethods.length; i++) {
            this[calledMethods[i] + 'Called'] = false;
        }

        function setCalledAttributes(attr) {
            self[attr] = true;
        }

        function fbq(fnName, eventname, params, eventData) {
            setCalledAttributes(fnName + 'Called');
            self.eventName = eventname;
            self.params = params;
            self.eventData = eventData;
        }

        return {
            fbq: fbq,
            fbqObj: this
        };
    }

    var SOURCE_MESSAGE_ID = 'Source Message Id Test';
    function checkBasicProperties(fnName) {
        window.fbqObj.should.have.property(fnName + 'Called', true);
        window.fbqObj.should.have.property('eventName');
        window.fbqObj.should.have.property('params');
    }

    before(function () {
        mParticle.EventType = EventType;
        mParticle.ProductActionType = ProductActionType;
        mParticle.CommerceEventType = CommerceEventType;
        mParticle.forwarder.init({
            pixelCode: '1228810793810857'
        }, reportService.cb, true);
    });


    beforeEach(function () {
        var mock = new MPMock();
        window.fbqObj = mock.fbqObj;
        window.fbq = mock.fbq;
    });

    describe('Events handled by this forwarder', function () {

        it('should initialize basic parameters', function (done) {
            mParticle.forwarder.init({
                pixelCode: 'mock-pixel-code',
                externalUserIdentityType: 'CustomerId',
            }, reportService.cb, false);

            window.fbqObj.should.have.property('initCalled', true);
            window.fbqObj.should.have.property('params', {});

            done();
        });

        it('should initialize with externalUserIdentityType', function (done) {
            const userIdentities = [
                {
                    Type: 1,
                    Identity: 'mock-customer-id',
                },
            ];

            mParticle.forwarder.init({
                pixelCode: 'mock-pixel-code',
                externalUserIdentityType: 'CustomerId',
            }, reportService.cb, false, null, null, userIdentities);

            window.fbqObj.should.have.property('initCalled', true);
            window.fbqObj.should.have.property('params', {
                external_id: 'mock-customer-id',
            });

            done();
        });

        it('should log page event', function (done) {
            mParticle.forwarder.process({
                EventDataType: MessageType.PageEvent
            });

            checkBasicProperties('trackCustom');
            done();
        });

        it('should log page view', function (done) {
            mParticle.forwarder.process({
                EventDataType: MessageType.PageView
            });
            checkBasicProperties('trackCustom');
            done();
        });

        it('should log commerce event', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - Purchase',
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.Purchase,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 400,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450,
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD'
            });

            checkBasicProperties('track');
            done();
        });

        it('should not log event unsupported event', function (done) {
            mParticle.forwarder.process({
                EventDataType: MessageType.SessionStart
            });

            window.fbqObj.should.have.property('trackCalled', false);
            done();
        });

    });

    describe('Page Views', function () {
        it('should log page view', function (done) {
            mParticle.forwarder.process({
                EventName: 'testevent',
                EventDataType: MessageType.PageView
            });

            checkBasicProperties('trackCustom');
            window.fbqObj.should.have.property('eventName', 'PageView');
            done();
        });

        it('should log page view with event id when passed', function (done) {
            mParticle.forwarder.process({
                EventName: 'testevent',
                EventDataType: MessageType.PageView,
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('trackCustom');
            window.fbqObj.should.have.property('eventName', 'PageView');
            window.fbqObj.eventData.should.have.property(
                'eventID',
                SOURCE_MESSAGE_ID
            );

            done();
        });

        it('should disable push state if passed in settings', function (done) {
            mParticle.forwarder.init(
                {
                    pixelCode: '1228810793810857',
                    disablePushState: 'True',
                },
                reportService.cb,
                true
            );

            window.fbq.should.have.property('disablePushState', true);
            // window.fbqObj.eventData.should.have.property('eventID', SOURCE_MESSAGE_ID)

            done();
        });
    });

    describe('Page Events', function () {
        it('should log page event', function (done) {
            mParticle.forwarder.process({
                EventName: 'testevent',
                EventDataType: MessageType.PageEvent
            });

            checkBasicProperties('trackCustom');
            window.fbqObj.params.should.have.property('content_name', 'testevent');
            window.fbqObj.should.have.property('eventName', 'testevent');
            done();
        });

        it('should log page event with no event name', function (done) {
            mParticle.forwarder.process({
                EventDataType: MessageType.PageEvent
            });

            checkBasicProperties('trackCustom');
            window.fbqObj.params.should.not.have.property('content_name');
            window.fbqObj.should.have.property('eventName', 'customEvent');
            done();
        });

        it('should log event attributes properly', function (done) {
            mParticle.forwarder.process({
                EventName: 'logevent',
                EventDataType: MessageType.PageEvent,
                EventAttributes: {foo: 'bar'}
            });

            window.fbqObj.params.should.have.property('foo', 'bar');
            done();
        });

        it('should log event id when passed properly', function (done) {
            mParticle.forwarder.process({
                EventName: 'logevent',
                EventDataType: MessageType.PageEvent,
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            window.fbqObj.eventData.should.have.property('eventID', SOURCE_MESSAGE_ID)
            done();
        });
    });

    describe('Commerce Events', function () {
        it('should log Purchase event', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - Purchase',
                EventDataType: MessageType.Commerce,
                EventAttributes: {
                    eventAttr1: 'value1',
                    eventAttr2: 'value2'
                },
                ProductAction: {
                    ProductActionType: ProductActionType.Purchase,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 200,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450, // Note this is used for the value param
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'Purchase');
            window.fbqObj.params.should.have.property('value', 450);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_name', 'eCommerce - Purchase');
            window.fbqObj.params.should.have.property('content_ids', ['12345']);
            window.fbqObj.params.should.have.property('num_items', 1);
            window.fbqObj.params.should.have.property('eventAttr1', 'value1');
            window.fbqObj.params.should.have.property('eventAttr2', 'value2');
            window.fbqObj.eventData.should.have.property('eventID', SOURCE_MESSAGE_ID);
            window.fbqObj.params.should.have.property('order_id', 123);
            window.fbqObj.params.should.have.property('contents');

            done();
        });

        it('should log Checkout event', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - Checkout',
                EventCategory: CommerceEventType.ProductCheckout,
                EventDataType: MessageType.Commerce,
                EventAttributes: {
                    eventAttr1: 'value1',
                    eventAttr2: 'value2'
                },
                ProductAction: {
                    ProductActionType: ProductActionType.Checkout,
                    CheckoutStep: 1,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 52,
                            CouponCode: null,
                            Quantity: 2
                        },
                        {
                            Sku: '22',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 800,
                            CouponCode: null,
                            Quantity: 3
                        },
                        {
                            Sku: '333',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 11,
                            CouponCode: null,
                            Quantity: 4
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450, // Note this is used for the value param
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'InitiateCheckout');
            window.fbqObj.params.should.have.property('value', 450);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_category', 'ProductCheckout');
            window.fbqObj.params.should.have.property('content_name', 'eCommerce - Checkout');
            window.fbqObj.params.should.have.property('content_ids', ['12345', '22', '333']);
            window.fbqObj.params.should.have.property('checkout_step', 1);
            window.fbqObj.params.should.have.property('num_items', 9);
            window.fbqObj.eventData.should.have.property('eventID', SOURCE_MESSAGE_ID);
            window.fbqObj.params.should.have.property('order_id', 123);
            window.fbqObj.params.should.have.property('contents');

            done();
        });

        it('should log AddToCart event', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - AddToCart',
                EventCategory: CommerceEventType.ProductAddToCart,
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.AddToCart,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 400,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450,
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,

            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'AddToCart');
            window.fbqObj.params.should.have.property('value', 400);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_name', 'eCommerce - AddToCart');
            window.fbqObj.params.should.have.property('content_ids', ['12345']);
            window.fbqObj.eventData.should.have.property('eventID', SOURCE_MESSAGE_ID);
            window.fbqObj.params.should.have.property('contents');
            window.fbqObj.params.should.have.property('order_id', 123);

            done();
        });

        it('should log AddToCart event with correct total value', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - AddToCart',
                EventCategory: CommerceEventType.ProductAddToCart,
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.AddToCart,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 400,
                            CouponCode: null,
                            Quantity: 2
                        },
                        {
                            Sku: '888',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 100,
                            CouponCode: null,
                            Quantity: 1
                        },
                        {
                            Sku: '666',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 100,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TotalAmount: 0, // Note that total amount is not used.
                    TransactionId: 123,
                    Affiliation: 'my-affiliation'
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'AddToCart');
            window.fbqObj.params.should.have.property('value', 1000);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_name', 'eCommerce - AddToCart');
            window.fbqObj.params.should.have.property('content_ids', ['12345', '888', '666']);
            window.fbqObj.eventData.should.have.property('eventID', SOURCE_MESSAGE_ID);
            window.fbqObj.params.should.have.property('order_id', 123);
            window.fbqObj.params.should.have.property('contents');

            done();
        });

        it('should log RemoveFromCart event and use TotalAmount when present on ProductAction', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - RemoveFromCart',
                EventCategory: CommerceEventType.ProductRemoveFromCart,
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.RemoveFromCart,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 200,
                            CouponCode: null,
                            Quantity: 1,
                            TotalAmount: 200
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TaxAmount: 40,
                    ShippingAmount: 10,
                    TotalAmount: 205
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('trackCustom');
            window.fbqObj.should.have.property('eventName', 'RemoveFromCart');
            window.fbqObj.params.should.have.property('value', 205);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_name', 'eCommerce - RemoveFromCart');
            window.fbqObj.params.should.have.property('content_ids', ['12345']);
            window.fbqObj.eventData.should.have.property('eventID', SOURCE_MESSAGE_ID);
            window.fbqObj.params.should.have.property('order_id', 123);
            window.fbqObj.params.should.have.property('contents');

            done();
        });

        it('should log RemoveFromCart event and calculate TotalAmount if total amount is not present on ProductAction', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - RemoveFromCart',
                EventCategory: CommerceEventType.ProductRemoveFromCart,
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.RemoveFromCart,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 400,
                            CouponCode: null,
                            Quantity: 1,
                            TotalAmount: 400
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('trackCustom');
            window.fbqObj.should.have.property('eventName', 'RemoveFromCart');
            window.fbqObj.params.should.have.property('value', 400);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_name', 'eCommerce - RemoveFromCart');
            window.fbqObj.params.should.have.property('content_ids', ['12345']);
            window.fbqObj.eventData.should.have.property('eventID', SOURCE_MESSAGE_ID);
            window.fbqObj.params.should.have.property('order_id', 123);
            window.fbqObj.params.should.have.property('contents');

            done();
        });

        it('should log AddToWishList event with correct total value', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - AddToWishlist',
                EventCategory: CommerceEventType.ProductAddToWishlist,
                EventDataType: MessageType.Commerce,
                EventAttributes: {
                    eventAttr1: 'value1',
                    eventAttr2: 'value2'
                },
                ProductAction: {
                    ProductActionType: ProductActionType.AddToWishlist,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 400,
                            CouponCode: null,
                            Quantity: 2 // <---- NOTE the multiplier here
                        },
                        {
                            Sku: '888',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 100,
                            CouponCode: null,
                            Quantity: 1
                        },
                        {
                            Sku: '666',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 100,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TotalAmount: 0, // Note that total amount is not used.
                    TransactionId: 123,
                    Affiliation: 'my-affiliation'
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'AddToWishlist');
            window.fbqObj.params.should.have.property('value', 1000);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_name', 'eCommerce - AddToWishlist');
            window.fbqObj.params.should.have.property('content_ids', ['12345', '888', '666']);
            window.fbqObj.params.should.have.property('eventAttr1', 'value1');
            window.fbqObj.params.should.have.property('eventAttr2', 'value2');
            window.fbqObj.eventData.should.have.property('eventID', SOURCE_MESSAGE_ID);
            window.fbqObj.params.should.have.property('order_id', 123);
            window.fbqObj.params.should.have.property('contents');
            window.fbqObj.params.contents.length.should.equal(3);
            window.fbqObj.params.contents[0].should.have.property('id', '12345');
            window.fbqObj.params.contents[0].should.have.property('quantity', 2);
            window.fbqObj.params.contents[1].should.have.property('id', '888');
            window.fbqObj.params.contents[1].should.have.property('quantity', 1);
            window.fbqObj.params.contents[2].should.have.property('id', '666');
            window.fbqObj.params.contents[2].should.have.property('quantity', 1);

            done();
        });

        it('should log AddToWishlist event', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - AddToWishlist',
                EventCategory: CommerceEventType.ProductAddToWishlist,
                EventDataType: MessageType.Commerce,
                EventAttributes: {
                    eventAttr1: 'value1',
                    eventAttr2: 'value2'
                },
                ProductAction: {
                    ProductActionType: ProductActionType.AddToWishlist,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 400,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450,
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'AddToWishlist');
            window.fbqObj.params.should.have.property('value', 400);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_category', 'ProductAddToWishlist');
            window.fbqObj.params.should.have.property('content_name', 'eCommerce - AddToWishlist');
            window.fbqObj.params.should.have.property('content_ids', ['12345']);
            window.fbqObj.params.should.have.property('eventAttr1', 'value1');
            window.fbqObj.params.should.have.property('eventAttr2', 'value2');
            window.fbqObj.eventData.should.have.property('eventID', SOURCE_MESSAGE_ID);
            window.fbqObj.params.should.have.property('order_id', 123);
            window.fbqObj.params.should.have.property('contents');
            window.fbqObj.params.contents.length.should.equal(1);
            window.fbqObj.params.contents[0].should.have.property('id', '12345');
            window.fbqObj.params.contents[0].should.have.property('quantity', 1);

            done();
        });

        it('should log ViewDetail event', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - ViewDetail',
                EventCategory: CommerceEventType.ProductViewDetail,
                EventDataType: MessageType.Commerce,
                EventAttributes: {
                    eventAttr1: 'value1',
                    eventAttr2: 'value2'
                },
                ProductAction: {
                    ProductActionType: ProductActionType.ViewDetail,
                    ProductList: [
                        {
                            Sku: '145',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 400,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450,
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'ViewContent');
            window.fbqObj.params.should.have.property('value', 400);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_name', 'eCommerce - ViewDetail');
            window.fbqObj.params.should.have.property('content_ids', ['145']);
            window.fbqObj.params.should.have.property('eventAttr1', 'value1');
            window.fbqObj.params.should.have.property('eventAttr2', 'value2');
            window.fbqObj.eventData.should.have.property('eventID', SOURCE_MESSAGE_ID);
            window.fbqObj.params.should.have.property('order_id', 123);
            window.fbqObj.params.should.have.property('contents');
            window.fbqObj.params.contents.length.should.equal(1);
            window.fbqObj.params.contents[0].should.have.property('id', '145');
            window.fbqObj.params.contents[0].should.have.property('quantity', 1);

            done();
        });

        it('should default to ProductAction for content_category', function (done) {
            mParticle.forwarder.process({
                EventName: 'MyeCommerce',
                EventDataType: MessageType.Commerce,
                EventAttributes: {
                    eventAttr1: 'value1',
                    eventAttr2: 'value2'
                },
                ProductAction: {
                    ProductActionType: ProductActionType.AddToWishlist,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 400,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450,
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'AddToWishlist');
            window.fbqObj.params.should.have.property('value', 400);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_category', 'AddToWishlist');
            window.fbqObj.params.should.have.property('content_name', 'MyeCommerce');
            window.fbqObj.params.should.have.property('content_ids', ['12345']);
            window.fbqObj.params.should.have.property('eventAttr1', 'value1');
            window.fbqObj.params.should.have.property('eventAttr2', 'value2');
            window.fbqObj.eventData.should.have.property('eventID', SOURCE_MESSAGE_ID);
            window.fbqObj.params.should.have.property('order_id', 123);
            window.fbqObj.params.should.have.property('contents');
            window.fbqObj.params.contents.length.should.equal(1);
            window.fbqObj.params.contents[0].should.have.property('id', '12345');
            window.fbqObj.params.contents[0].should.have.property('quantity', 1);

            done();
        });

        it('should not log unsupported commerce event', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - Refund,',
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.Refund,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 200,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450, // Note this is used for the value param
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD'
            });

            window.fbqObj.should.have.property('trackCalled', false);
            done();
        });

        it('should build contents array with mapped attributes for Purchase events', function (done) {
            // Initialize with product attribute mapping
            mParticle.forwarder.init({
                pixelCode: 'test-pixel-code',
                "productAttributeMapping":"[{&quot;jsmap&quot;:&quot;3373707&quot;,&quot;map&quot;:&quot;Name&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_name&quot;},{&quot;jsmap&quot;:&quot;93997959&quot;,&quot;map&quot;:&quot;Brand&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_brand&quot;},{&quot;jsmap&quot;:&quot;106934601&quot;,&quot;map&quot;:&quot;Price&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_price&quot;},{&quot;jsmap&quot;:&quot;50511102&quot;,&quot;map&quot;:&quot;Category&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_category&quot;},{&quot;jsmap&quot;:&quot;94842723&quot;,&quot;map&quot;:&quot;category&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_attribute_category&quot;}]"
            }, reportService.cb, true);

            mParticle.forwarder.process({
                EventName: 'eCommerce - Purchase',
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.Purchase,
                    ProductList: [
                        {
                            Sku: 'sku-12',
                            Name: 'iPhone',
                            Brand: 'Apple',
                            Category: 'electronics',
                            Variant: 'blue',
                            Price: 1000.99,
                            Quantity: 1,
                            Attributes: {
                                category: 'phones'
                            }
                        },
                        {
                            Sku: 'sku-34',
                            Name: 'Watch',
                            Brand: 'Samsung',
                            Price: 450.99,
                            Quantity: 2
                        }
                    ],
                    TransactionId: 'txn-1234',
                    TotalAmount: 1451.98
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'Purchase');
            window.fbqObj.params.should.have.property('order_id', 'txn-1234');
            window.fbqObj.params.should.have.property('contents');
            window.fbqObj.params.contents.length.should.equal(2);
            
            var firstProduct = window.fbqObj.params.contents[0];
            // Standard Facebook fields
            firstProduct.should.have.property('id', 'sku-12');
            firstProduct.should.have.property('name', 'iPhone');
            firstProduct.should.have.property('brand', 'Apple');
            firstProduct.should.have.property('item_price', 1000.99);
            firstProduct.should.have.property('quantity', 1);
            
            // Mapped standard fields
            firstProduct.should.have.property('custom_name', 'iPhone');
            firstProduct.should.have.property('custom_brand', 'Apple');
            firstProduct.should.have.property('custom_price', 1000.99);
            firstProduct.should.have.property('custom_category', 'electronics');
            
            // Mapped custom attribute
            firstProduct.should.have.property('custom_attribute_category', 'phones');

            done();
        });

        it('should build contents array with mapped attributes for AddToCart events', function (done) {
            // Initialize with product attribute mapping
            mParticle.forwarder.init({
                pixelCode: 'test-pixel-code',
                "productAttributeMapping":"[{&quot;jsmap&quot;:&quot;3373707&quot;,&quot;map&quot;:&quot;Name&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_name&quot;},{&quot;jsmap&quot;:&quot;93997959&quot;,&quot;map&quot;:&quot;Brand&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_brand&quot;},{&quot;jsmap&quot;:&quot;106934601&quot;,&quot;map&quot;:&quot;Price&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_price&quot;},{&quot;jsmap&quot;:&quot;50511102&quot;,&quot;map&quot;:&quot;Category&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_category&quot;},{&quot;jsmap&quot;:&quot;94842723&quot;,&quot;map&quot;:&quot;category&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_attribute_category&quot;}]"
            }, reportService.cb, true);

            mParticle.forwarder.process({
                EventName: 'eCommerce - AddToCart',
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.AddToCart,
                    ProductList: [
                        {
                            Sku: 'sku-12',
                            Name: 'iPhone',
                            Brand: 'Apple',
                            Category: 'electronics',
                            Variant: 'blue',
                            Price: 1000.99,
                            Quantity: 1,
                            Attributes: {
                                category: 'phones'
                            }
                        },
                        {
                            Sku: 'sku-34',
                            Name: 'Watch',
                            Brand: 'Samsung',
                            Price: 450.99,
                            Quantity: 2
                        }
                    ],
                    TransactionId: 123
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'AddToCart');
            window.fbqObj.params.should.have.property('contents');
            window.fbqObj.params.contents.length.should.equal(2);
            window.fbqObj.params.should.have.property('order_id', 123);
            
            var firstProduct = window.fbqObj.params.contents[0];
            // Standard Facebook fields
            firstProduct.should.have.property('id', 'sku-12');
            firstProduct.should.have.property('name', 'iPhone');
            firstProduct.should.have.property('brand', 'Apple');
            firstProduct.should.have.property('item_price', 1000.99);
            firstProduct.should.have.property('quantity', 1);
            
            // Mapped standard fields
            firstProduct.should.have.property('custom_name', 'iPhone');
            firstProduct.should.have.property('custom_brand', 'Apple');
            firstProduct.should.have.property('custom_price', 1000.99);
            firstProduct.should.have.property('custom_category', 'electronics');
            
            // Mapped custom attribute
            firstProduct.should.have.property('custom_attribute_category', 'phones');

            done();
        });

        it('should build contents array with mapped attributes for Checkout events', function (done) {
            // Initialize with product attribute mapping
            mParticle.forwarder.init({
                pixelCode: 'test-pixel-code',
                "productAttributeMapping":"[{&quot;jsmap&quot;:&quot;3373707&quot;,&quot;map&quot;:&quot;Name&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_name&quot;},{&quot;jsmap&quot;:&quot;93997959&quot;,&quot;map&quot;:&quot;Brand&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_brand&quot;},{&quot;jsmap&quot;:&quot;106934601&quot;,&quot;map&quot;:&quot;Price&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_price&quot;},{&quot;jsmap&quot;:&quot;50511102&quot;,&quot;map&quot;:&quot;Category&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_category&quot;},{&quot;jsmap&quot;:&quot;94842723&quot;,&quot;map&quot;:&quot;category&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_attribute_category&quot;}]"
            }, reportService.cb, true);

            mParticle.forwarder.process({
                EventName: 'eCommerce - Checkout',
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.Checkout,
                    ProductList: [
                        {
                            Sku: 'sku-12',
                            Name: 'iPhone',
                            Brand: 'Apple',
                            Category: 'electronics',
                            Variant: 'blue',
                            Price: 1000.99,
                            Quantity: 1,
                            Attributes: {
                                category: 'phones'
                            }
                        },
                        {
                            Sku: 'sku-34',
                            Name: 'Watch',
                            Brand: 'Samsung',
                            Price: 450.99,
                            Quantity: 2
                        }
                    ],
                    TransactionId: 123,
                    TotalAmount: 1902.97
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'InitiateCheckout');
            window.fbqObj.params.should.have.property('contents');
            window.fbqObj.params.contents.length.should.equal(2);
            window.fbqObj.params.should.have.property('order_id', 123);
            
            var firstProduct = window.fbqObj.params.contents[0];
            // Standard Facebook fields
            firstProduct.should.have.property('id', 'sku-12');
            firstProduct.should.have.property('name', 'iPhone');
            firstProduct.should.have.property('brand', 'Apple');
            firstProduct.should.have.property('item_price', 1000.99);
            firstProduct.should.have.property('quantity', 1);
            
            // Mapped standard fields
            firstProduct.should.have.property('custom_name', 'iPhone');
            firstProduct.should.have.property('custom_brand', 'Apple');
            firstProduct.should.have.property('custom_price', 1000.99);
            firstProduct.should.have.property('custom_category', 'electronics');
            
            // Mapped custom attribute
            firstProduct.should.have.property('custom_attribute_category', 'phones');

            done();
        });

        it('should build contents array with mapped attributes for RemoveFromCart events', function (done) {
            // Initialize with product attribute mapping
            mParticle.forwarder.init({
                pixelCode: 'test-pixel-code',
                "productAttributeMapping":"[{&quot;jsmap&quot;:&quot;3373707&quot;,&quot;map&quot;:&quot;Name&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_name&quot;},{&quot;jsmap&quot;:&quot;93997959&quot;,&quot;map&quot;:&quot;Brand&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_brand&quot;},{&quot;jsmap&quot;:&quot;106934601&quot;,&quot;map&quot;:&quot;Price&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_price&quot;},{&quot;jsmap&quot;:&quot;50511102&quot;,&quot;map&quot;:&quot;Category&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_category&quot;},{&quot;jsmap&quot;:&quot;94842723&quot;,&quot;map&quot;:&quot;category&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_attribute_category&quot;}]"
            }, reportService.cb, true);

            mParticle.forwarder.process({
                EventName: 'eCommerce - RemoveFromCart',
                EventCategory: CommerceEventType.ProductRemoveFromCart,
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.RemoveFromCart,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 200,
                            CouponCode: null,
                            Quantity: 1,
                            TotalAmount: 200,
                            Attributes: {
                                category: 'phones'
                            }
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TaxAmount: 40,
                    ShippingAmount: 10,
                    TotalAmount: 205
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('trackCustom');
            window.fbqObj.should.have.property('eventName', 'RemoveFromCart');
            window.fbqObj.params.should.have.property('contents');
            window.fbqObj.params.contents.length.should.equal(1);
            window.fbqObj.params.should.have.property('order_id', 123);
            
            var firstProduct = window.fbqObj.params.contents[0];
            // Standard Facebook fields
            firstProduct.should.have.property('id', '12345');
            firstProduct.should.have.property('name', 'iPhone 6');
            firstProduct.should.have.property('brand', 'iPhone');
            firstProduct.should.have.property('item_price', 200);
            firstProduct.should.have.property('quantity', 1);
            
            // Mapped standard fields
            firstProduct.should.have.property('custom_name', 'iPhone 6');
            firstProduct.should.have.property('custom_brand', 'iPhone');
            firstProduct.should.have.property('custom_price', 200);
            firstProduct.should.have.property('custom_category', 'Phones');
            
            // Mapped custom attribute
            firstProduct.should.have.property('custom_attribute_category', 'phones');

            done();
        });

        it('should build contents array with mapped attributes for AddToWishlist events', function (done) {
            // Initialize with product attribute mapping
            mParticle.forwarder.init({
                pixelCode: 'test-pixel-code',
                "productAttributeMapping":"[{&quot;jsmap&quot;:&quot;3373707&quot;,&quot;map&quot;:&quot;Name&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_name&quot;},{&quot;jsmap&quot;:&quot;93997959&quot;,&quot;map&quot;:&quot;Brand&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_brand&quot;},{&quot;jsmap&quot;:&quot;106934601&quot;,&quot;map&quot;:&quot;Price&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_price&quot;},{&quot;jsmap&quot;:&quot;50511102&quot;,&quot;map&quot;:&quot;Category&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_category&quot;},{&quot;jsmap&quot;:&quot;94842723&quot;,&quot;map&quot;:&quot;category&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_attribute_category&quot;}]"
            }, reportService.cb, true);

            mParticle.forwarder.process({
                EventName: 'eCommerce - AddToWishlist',
                EventCategory: CommerceEventType.ProductAddToWishlist,
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.AddToWishlist,
                    ProductList: [
                        {
                            Sku: 'wishlist-sku',
                            Name: 'Designer Bag',
                            Category: 'Accessories',
                            Brand: 'Gucci',
                            Variant: 'Black',
                            Price: 2500,
                            Quantity: 1,
                            Attributes: {
                                category: 'luxury'
                            }
                        }
                    ],
                    TransactionId: 789
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'AddToWishlist');
            window.fbqObj.params.should.have.property('contents');
            window.fbqObj.params.contents.length.should.equal(1);
            window.fbqObj.params.should.have.property('order_id', 789);
            
            var firstProduct = window.fbqObj.params.contents[0];
            // Standard Facebook fields
            firstProduct.should.have.property('id', 'wishlist-sku');
            firstProduct.should.have.property('name', 'Designer Bag');
            firstProduct.should.have.property('brand', 'Gucci');
            firstProduct.should.have.property('item_price', 2500);
            firstProduct.should.have.property('quantity', 1);
            
            // Mapped standard fields
            firstProduct.should.have.property('custom_name', 'Designer Bag');
            firstProduct.should.have.property('custom_brand', 'Gucci');
            firstProduct.should.have.property('custom_price', 2500);
            firstProduct.should.have.property('custom_category', 'Accessories');
            
            // Mapped custom attribute
            firstProduct.should.have.property('custom_attribute_category', 'luxury');

            done();
        });

        it('should build contents array with mapped attributes for ViewDetail events', function (done) {
            // Initialize with product attribute mapping
            mParticle.forwarder.init({
                pixelCode: 'test-pixel-code',
                "productAttributeMapping":"[{&quot;jsmap&quot;:&quot;3373707&quot;,&quot;map&quot;:&quot;Name&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_name&quot;},{&quot;jsmap&quot;:&quot;93997959&quot;,&quot;map&quot;:&quot;Brand&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_brand&quot;},{&quot;jsmap&quot;:&quot;106934601&quot;,&quot;map&quot;:&quot;Price&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_price&quot;},{&quot;jsmap&quot;:&quot;50511102&quot;,&quot;map&quot;:&quot;Category&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_category&quot;},{&quot;jsmap&quot;:&quot;94842723&quot;,&quot;map&quot;:&quot;category&quot;,&quot;maptype&quot;:&quot;ProductAttributeSelector.Name&quot;,&quot;value&quot;:&quot;custom_attribute_category&quot;}]"
            }, reportService.cb, true);

            mParticle.forwarder.process({
                EventName: 'eCommerce - ViewDetail',
                EventCategory: CommerceEventType.ProductViewDetail,
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.ViewDetail,
                    ProductList: [
                        {
                            Sku: 'view-sku-999',
                            Name: 'Laptop Pro',
                            Category: 'Electronics',
                            Brand: 'Apple',
                            Variant: '16-inch',
                            Price: 3000,
                            Quantity: 1,
                            Attributes: {
                                category: 'computers'
                            }
                        }
                    ],
                    TransactionId: 999
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'ViewContent');
            window.fbqObj.params.should.have.property('contents');
            window.fbqObj.params.contents.length.should.equal(1);
            window.fbqObj.params.should.have.property('order_id', 999);
            
            var firstProduct = window.fbqObj.params.contents[0];
            // Standard Facebook fields
            firstProduct.should.have.property('id', 'view-sku-999');
            firstProduct.should.have.property('name', 'Laptop Pro');
            firstProduct.should.have.property('brand', 'Apple');
            firstProduct.should.have.property('item_price', 3000);
            firstProduct.should.have.property('quantity', 1);
            
            // Mapped standard fields
            firstProduct.should.have.property('custom_name', 'Laptop Pro');
            firstProduct.should.have.property('custom_brand', 'Apple');
            firstProduct.should.have.property('custom_price', 3000);
            firstProduct.should.have.property('custom_category', 'Electronics');
            
            // Mapped custom attribute
            firstProduct.should.have.property('custom_attribute_category', 'computers');

            done();
        });

        it('should log Purchase event with product names as contents', function (done) {
            mParticle.forwarder.init({
                pixelCode: 'test-pixel-code',
                sendProductNamesasContents: true
            }, reportService.cb, true);

            mParticle.forwarder.process({
                EventName: 'eCommerce - Purchase',
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.Purchase,
                    ProductList: [
                        {
                            Sku: 'sku-12',
                            Name: 'iPhone',
                            Brand: 'Apple',
                            Category: 'electronics',
                            Variant: 'blue',
                            Price: 1000.99,
                            Quantity: 1,
                            Attributes: {
                                category: 'phones'
                            }
                        },
                        {
                            Sku: 'sku-no-name',
                            // Name missing to test filter
                            Brand: 'Generic',
                            Price: 99.99,
                            Quantity: 1
                        },
                        {
                            Sku: 'sku-34',
                            Name: 'Watch',
                            Brand: 'Samsung',
                            Price: 450.99,
                            Quantity: 2
                        }
                    ],
                    TransactionId: 'txn-1234',
                    TotalAmount: 1551.97
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'Purchase');
            window.fbqObj.params.should.have.property('contents');
            window.fbqObj.params.contents.length.should.equal(3);
            window.fbqObj.params.contents[0].should.have.property('name', 'iPhone');
            window.fbqObj.params.contents[2].should.have.property('name', 'Watch');
            // content_name should only include products with names (filters out product without Name)
            window.fbqObj.params.should.have.property('content_name', ['iPhone', 'Watch']);
            window.fbqObj.params.should.have.property('order_id', 'txn-1234');
            window.fbqObj.params.should.have.property('value', 1551.97);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('num_items', 4);
            window.fbqObj.eventData.should.have.property('eventID', SOURCE_MESSAGE_ID);

            done();
        });

        it('should log AddToCart event with product names as contents', function (done) {
            mParticle.forwarder.init({
                pixelCode: 'test-pixel-code',
                sendProductNamesasContents: true
            }, reportService.cb, true);

            mParticle.forwarder.process({
                EventName: 'eCommerce - AddToCart',
                EventCategory: CommerceEventType.ProductAddToCart,
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.AddToCart,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 400,
                            CouponCode: null,
                            Quantity: 1
                        },
                        {
                            Sku: '1234',
                            Name: 'iPhone 11',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 500,
                            CouponCode: null,
                            Quantity: 2
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,

            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'AddToCart');
            window.fbqObj.params.should.have.property('content_name', ['iPhone 6', 'iPhone 11']);
            window.fbqObj.params.should.have.property('content_ids', ['12345', '1234']);
            window.fbqObj.eventData.should.have.property('eventID', SOURCE_MESSAGE_ID);
            done();
        });

        it('should log RemoveFromCart event with product names as content_name', function (done) {
            mParticle.forwarder.init({
                pixelCode: 'test-pixel-code',
                sendProductNamesasContents: true
            }, reportService.cb, true);

            mParticle.forwarder.process({
                EventName: 'eCommerce - RemoveFromCart',
                EventCategory: CommerceEventType.ProductRemoveFromCart,
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.RemoveFromCart,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 200,
                            CouponCode: null,
                            Quantity: 1,
                            TotalAmount: 200
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TaxAmount: 40,
                    ShippingAmount: 10,
                    TotalAmount: 205
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('trackCustom');
            window.fbqObj.should.have.property('eventName', 'RemoveFromCart');
            window.fbqObj.params.should.have.property('content_name', ['iPhone 6']);
            window.fbqObj.params.should.have.property('content_ids', ['12345']);
            window.fbqObj.eventData.should.have.property('eventID', SOURCE_MESSAGE_ID);
            done();
        });

        it('should log Checkout event with product names as contents', function (done) {
            mParticle.forwarder.init({
                pixelCode: 'test-pixel-code',
                sendProductNamesasContents: true
            }, reportService.cb, true);

            mParticle.forwarder.process({
                EventName: 'eCommerce - Checkout',
                EventCategory: CommerceEventType.ProductCheckout,
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.Checkout,
                    ProductList: [
                        {
                            Sku: 'sku-12',
                            Name: 'iPhone',
                            Brand: 'Apple',
                            Category: 'electronics',
                            Variant: 'blue',
                            Price: 1000.99,
                            Quantity: 1
                        },
                        {
                            Sku: 'sku-no-name',
                            // Name missing to test filter
                            Brand: 'Generic',
                            Price: 75.50,
                            Quantity: 1
                        },
                        {
                            Sku: 'sku-34',
                            Name: 'Watch',
                            Brand: 'Samsung',
                            Price: 450.99,
                            Quantity: 2
                        }
                    ],
                    TransactionId: 'txn-5678',
                    TotalAmount: 1978.47,
                    CheckoutStep: 1
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'InitiateCheckout');
            window.fbqObj.params.should.have.property('contents');
            window.fbqObj.params.contents.length.should.equal(3);
            window.fbqObj.params.contents[0].should.have.property('name', 'iPhone');
            window.fbqObj.params.contents[2].should.have.property('name', 'Watch');
            // content_name should only include products with names (filters out product without Name)
            window.fbqObj.params.should.have.property('content_name', ['iPhone', 'Watch']);
            window.fbqObj.params.should.have.property('order_id', 'txn-5678');
            window.fbqObj.params.should.have.property('value', 1978.47);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('num_items', 4);
            window.fbqObj.params.should.have.property('checkout_step', 1);
            window.fbqObj.eventData.should.have.property('eventID', SOURCE_MESSAGE_ID);

            done();
        });

        it('should log AddToWishlist event with product names as contents', function (done) {
            mParticle.forwarder.init({
                pixelCode: 'test-pixel-code',
                sendProductNamesasContents: true
            }, reportService.cb, true);

            mParticle.forwarder.process({
                EventName: 'eCommerce - AddToWishlist',
                EventCategory: CommerceEventType.ProductAddToWishlist,
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.AddToWishlist,
                    ProductList: [
                        {
                            Sku: 'sku-111',
                            Name: 'Laptop',
                            Category: 'Electronics',
                            Brand: 'Dell',
                            Price: 1200,
                            Quantity: 1
                        },
                        {
                            Sku: 'sku-222',
                            Name: 'Mouse',
                            Category: 'Accessories',
                            Brand: 'Logitech',
                            Price: 50,
                            Quantity: 1
                        }
                    ],
                    TransactionId: 456
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'AddToWishlist');
            window.fbqObj.params.should.have.property('content_name', ['Laptop', 'Mouse']);
            window.fbqObj.params.should.have.property('order_id', 456);
            window.fbqObj.params.should.have.property('content_ids', ['sku-111', 'sku-222']);
            window.fbqObj.params.should.have.property('contents');
            window.fbqObj.params.contents.length.should.equal(2);
            window.fbqObj.params.contents[0].should.have.property('id', 'sku-111');
            window.fbqObj.params.contents[0].should.have.property('quantity', 1);
            window.fbqObj.params.contents[1].should.have.property('id', 'sku-222');
            window.fbqObj.params.contents[1].should.have.property('quantity', 1);
            window.fbqObj.eventData.should.have.property('eventID', SOURCE_MESSAGE_ID);
            done();
        });

        it('should log ViewDetail event with product names as contents', function (done) {
            mParticle.forwarder.init({
                pixelCode: 'test-pixel-code',
                sendProductNamesasContents: true
            }, reportService.cb, true);

            mParticle.forwarder.process({
                EventName: 'eCommerce - ViewDetail',
                EventCategory: CommerceEventType.ProductViewDetail,
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.ViewDetail,
                    ProductList: [
                        {
                            Sku: 'sku-999',
                            Name: 'Tablet',
                            Category: 'Electronics',
                            Brand: 'Samsung',
                            Price: 800,
                            Quantity: 1
                        }
                    ],
                    TransactionId: 789
                },
                CurrencyCode: 'USD',
                SourceMessageId: SOURCE_MESSAGE_ID,
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'ViewContent');
            window.fbqObj.params.should.have.property('content_name', ['Tablet']);
            window.fbqObj.params.should.have.property('order_id', 789);
            window.fbqObj.params.should.have.property('content_ids', ['sku-999']);
            window.fbqObj.params.should.have.property('contents');
            window.fbqObj.params.contents.length.should.equal(1);
            window.fbqObj.params.contents[0].should.have.property('id', 'sku-999');
            window.fbqObj.params.contents[0].should.have.property('quantity', 1);
            window.fbqObj.eventData.should.have.property('eventID', SOURCE_MESSAGE_ID);
            done();
        }); 
    });
});
