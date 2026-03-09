/* eslint-disable no-undef*/
describe('Adobe Target Forwarder', function() {
    // -------------------DO NOT EDIT ANYTHING BELOW THIS LINE-----------------------
    var MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            AppStateTransition: 10,
            Profile: 14,
            Commerce: 16,
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
            ProductPurchase: 16,
            getName: function() {
                return 'blahblah';
            },
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
            RemoveFromWishlist: 10,
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
            Alias: 8,
            FacebookCustomAudienceId: 9,
        },
        ReportingService = function() {
            var self = this;

            this.id = null;
            this.event = null;

            this.cb = function(forwarder, event) {
                self.id = forwarder.id;
                self.event = event;
            };

            this.reset = function() {
                this.id = null;
                this.event = null;
            };
        },
        reportService = new ReportingService();

    // -------------------DO NOT EDIT ANYTHING ABOVE THIS LINE-----------------------
    // -------------------START EDITING BELOW:-----------------------
    // -------------------mParticle stubs - Add any additional stubbing to our methods as needed-----------------------
    mParticle.Identity = {
        getCurrentUser: function() {
            return {
                getMPID: function() {
                    return '123';
                },
            };
        },
    };
    // -------------------START EDITING BELOW:-----------------------
    var AdobeTargetForwarder = function() {
        var self = this;
        this.getOffer = function(options) {
            self.getOfferOptions = options;
            self.success = options.success();
            self.error = options.error();
        };
        this.trackEvent = function(options) {
            self.trackEventOptions = options;
        };
        this.applyOffer = function(offer) {
            self.applyOfferCalled = true;
            self.offer = offer;
        };
    };

    before(function() {});

    beforeEach(function() {
        window.adobe = {
            target: new AdobeTargetForwarder(),
        };
        // Include any specific settings that is required for initializing your SDK here
        var sdkSettings = {};
        mParticle.forwarder.init(sdkSettings, reportService.cb, true);
    });

    it('should track a pageview event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageView,
            EventName: 'Test Event',
            EventAttributes: {
                label: 'label',
                value: 200,
                category: 'category',
            },
            CustomFlags: {
                'ADOBETARGET.MBOX': 'testMBOX',
            },
        });

        window.adobe.target.trackEventOptions.mbox.should.equal('testMBOX');
        window.adobe.target.trackEventOptions.params.should.have.property(
            'label',
            'label'
        );
        window.adobe.target.trackEventOptions.params.should.have.property(
            'value',
            200
        );
        window.adobe.target.trackEventOptions.params.should.have.property(
            'category',
            'category'
        );

        done();
    });

    it('should track a get offer event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageEvent,
            EventName: 'test name',
            EventAttributes: {
                attr1: 'test1',
                attr2: 'test2',
            },
            CustomFlags: {
                'ADOBETARGET.MBOX': 'testMBOX',
                'ADOBETARGET.GETOFFER': true,
                'ADOBETARGET.SUCCESS': function(offer) {
                    return offer;
                },
                'ADOBETARGET.ERROR': function(error) {
                    return error;
                },
                'ADOBETARGET.TIMEOUT': 5000,
            },
        });

        window.adobe.target.getOfferOptions.mbox.should.equal('testMBOX');
        window.adobe.target.getOfferOptions.params.should.have.property(
            'attr1',
            'test1'
        );
        window.adobe.target.getOfferOptions.params.should.have.property(
            'attr2',
            'test2'
        );
        window.adobe.target.getOfferOptions.should.have.property(
            'timeout',
            5000
        );
        window.adobe.target.getOfferOptions.should.have.properties([
            'success',
            'error',
        ]);

        done();
    });

    it('should track a custom event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageEvent,
            EventName: 'test name',
            EventAttributes: {
                attr1: 'test1',
                attr2: 'test2',
            },
            CustomFlags: {
                'ADOBETARGET.MBOX': 'testMBOX',
                'ADOBETARGET.SUCCESS': function(offer) {
                    return offer;
                },
                'ADOBETARGET.ERROR': function(error) {
                    return error;
                },
                'ADOBETARGET.TIMEOUT': 5000,
                'ADOBETARGET.SELECTOR': 'selector',
                'ADOBETARGET.TYPE': 'type',
                'ADOBETARGET.PREVENTDEFAULT': true,
            },
        });

        window.adobe.target.trackEventOptions.mbox.should.equal('testMBOX');
        window.adobe.target.trackEventOptions.params.should.have.property(
            'attr1',
            'test1'
        );
        window.adobe.target.trackEventOptions.params.should.have.property(
            'attr2',
            'test2'
        );
        window.adobe.target.trackEventOptions.should.have.property(
            'timeout',
            5000
        );
        window.adobe.target.trackEventOptions.should.have.property(
            'selector',
            'selector'
        );
        window.adobe.target.trackEventOptions.should.have.property(
            'type',
            'type'
        );
        window.adobe.target.trackEventOptions.should.have.property(
            'preventDefault',
            true
        );

        done();
    });

    it('should track a product purchase', function(done) {
        mParticle.forwarder.process({
            EventName: 'eCommerce - Purchase',
            EventDataType: MessageType.Commerce,
            EventCategory: EventType.ProductPurchase,
            CustomFlags: {
                'ADOBETARGET.MBOX': 'mboxTest',
            },
            ProductAction: {
                ProductActionType: ProductActionType.Purchase,
                ProductList: [
                    {
                        Sku: 'SKU1',
                        Name: 'iPhone 6',
                        Category: 'Phones',
                        Brand: 'iPhone',
                        Variant: '6',
                        Price: 400,
                        TotalAmount: 400,
                        CouponCode: 'coupon-code',
                        Quantity: 1,
                    },
                    {
                        Sku: 'SKU2',
                        Name: 'iPhone 6',
                        Category: 'Phones',
                        Brand: 'iPhone',
                        Variant: '6',
                        Price: 400,
                        TotalAmount: 400,
                        CouponCode: 'coupon-code',
                        Quantity: 1,
                    },
                ],
                TransactionId: '123',
                Affiliation: 'my-affiliation',
                TotalAmount: 450,
                TaxAmount: 40,
                ShippingAmount: 10,
                CouponCode: null,
            },
        });

        window.adobe.target.trackEventOptions.should.have.property(
            'mbox',
            'mboxTest'
        );
        window.adobe.target.trackEventOptions.params.should.have.property(
            'orderId',
            '123'
        );
        window.adobe.target.trackEventOptions.params.should.have.property(
            'orderTotal',
            450
        );
        window.adobe.target.trackEventOptions.params.should.have.property(
            'productPurchasedId',
            'SKU1, SKU2'
        );

        done();
    });
});
