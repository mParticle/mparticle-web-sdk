/* eslint-disable no-undef*/

describe('Leanplum Forwarder', function() {
    var expandCommerceEvent = function(event) {
            return [
                {
                    EventName: event.EventName,
                    EventDataType: event.EventDataType,
                    EventAttributes: event.EventAttributes,
                },
            ];
        },
        MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
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
            ProductImpression: 22,
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
            getName: function() {
                return 'CustomerID';
            },
        },
        PromotionActionType = {
            Unknown: 0,
            PromotionView: 1,
            PromotionClick: 2,
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
        reportService = new ReportingService(),
        MockLeanplum = function() {
            var self = this;

            this.trackCustomEventCalled = false;
            this.logPurchaseEventCalled = false;
            this.setAppIdForDevelopmentModeCalled = false;
            this.setAppIdForProductionModeCalled = false;
            this.initializeCalled = false;

            this.trackCustomName = null;
            this.logPurchaseName = null;
            this.apiKey = null;
            this.appId = null;
            this.sessionLength = null;
            this.userId = null;
            this.userAttributes = {};
            this.userIdField = null;

            this.eventProperties = [];
            this.purchaseEventProperties = [];

            this.setAppIdForDevelopmentMode = function (appId, apiKey) {
                self.initializeCalled = true;
                self.setAppIdForDevelopmentModeCalled = true;
                self.apiKey = apiKey;
                self.appId = appId;

                return true;
            };

            this.setAppIdForProductionMode = function (appId, apiKey) {
                self.initializeCalled = true;
                self.setAppIdForProductionModeCalled = true;
                self.apiKey = apiKey;
                self.appId = appId;

                return true;
            };
            this.track = function(name, eventProperties) {
                self.trackCustomEventCalled = true;
                self.trackCustomName = name;
                if (name === 'Purchase') {
                    self.totalAmount = eventProperties.totalAmount;
                    self.eventProperties.push(arguments[2]);
                } else {
                    self.eventProperties.push(eventProperties);
                }

                // Return true to indicate event should be reported
                return true;
            };

            this.advanceTo = function(name, eventProperties) {
                self.trackCustomEventCalled = true;
                self.trackCustomName = name;
                self.eventProperties.push(eventProperties);

                return true;
            };

            this.start = function(id, userAttributes) {
                self.userId = id;

                if (Object.keys(userAttributes).length) {
                    for (var key in userAttributes) {
                        if (userAttributes[key] === null) {
                            delete self.userAttributes[key];
                        } else {
                            self.userAttributes[key] = userAttributes[key];
                        }
                    }
                }
            };

            this.setUserId = function(id) {
                self.userId = id;
            };

            this.setUserAttributes = function(attributeDict) {
                for (var key in attributeDict) {
                    if (attributeDict[key] === null) {
                        delete self.userAttributes[key];
                    } else {
                        self.userAttributes[key] = attributeDict[key];
                    }
                }
            };

            this.useSessionLength = function (sessionLength) {
                self.sessionLength = sessionLength;
            };
        };

    before(function() {
        mParticle.EventType = EventType;
        mParticle.ProductActionType = ProductActionType;
        mParticle.PromotionType = PromotionActionType;
        mParticle.IdentityType = IdentityType;
        mParticle.CommerceEventType = CommerceEventType;
        mParticle.eCommerce = {};
        mParticle.eCommerce.expandCommerceEvent = expandCommerceEvent;

        mParticle.Types = {} || mParticle.Types;
        mParticle.Types.Environment = {
            Production: 'production',
            Development: 'development',
        };

        mParticle.getEnvironment = function () {
            return 'development';
        };
    });

    beforeEach(function() {
        window.Leanplum = new MockLeanplum();
        mParticle.forwarder.init(
            {
                clientKey: '123456',
                appId: 'abcde',
                userIdField: 'customerId',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'customerId',
                    Type: IdentityType.CustomerId,
                },
                {
                    Identity: 'email',
                    Type: IdentityType.Email,
                },
                {
                    Identity: 'facebook',
                    Type: IdentityType.Facebook,
                },
            ],
            '1.1',
            'My App'
        );
    });

    it('should log event', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageEvent,
            EventName: 'Test Event',
            EventAttributes: {
                label: 'label',
                value: 200,
                category: 'category',
            },
        });
        window.Leanplum.apiKey.should.equal('123456');
        window.Leanplum.appId.should.equal('abcde');
        window.Leanplum.eventProperties[0].category.should.equal('category');
        window.Leanplum.eventProperties[0].label.should.equal('label');
        window.Leanplum.eventProperties[0].value.should.equal(200);

        done();
    });

    it('should log page view', function(done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageView,
            EventName: 'test name',
            EventAttributes: {
                attr1: 'test1',
                attr2: 'test2',
            },
        });

        window.Leanplum.trackCustomEventCalled.should.equal(true);
        window.Leanplum.trackCustomName.should.equal('test name');
        window.Leanplum.eventProperties[0].attr1.should.equal('test1');
        window.Leanplum.eventProperties[0].attr2.should.equal('test2');

        done();
    });

    it('should log a product purchase commerce event', function(done) {
        mParticle.forwarder.process({
            EventName: 'Test Purchase Event',
            EventDataType: MessageType.Commerce,
            EventCategory: EventType.ProductPurchase,
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
                        TotalAmount: 400,
                        CouponCode: 'coupon-code',
                        Quantity: 1,
                    },
                ],
                TransactionId: 123,
                Affiliation: 'my-affiliation',
                TotalAmount: 450,
                TaxAmount: 40,
                ShippingAmount: 10,
                CouponCode: null,
            },
        });

        window.Leanplum.trackCustomEventCalled.should.equal(true);
        window.Leanplum.trackCustomName.should.equal('Purchase');

        window.Leanplum.eventProperties[0].Sku.should.equal('12345');
        window.Leanplum.eventProperties[0].Name.should.equal('iPhone 6');
        window.Leanplum.eventProperties[0].Category.should.equal('Phones');
        window.Leanplum.eventProperties[0].Brand.should.equal('iPhone');
        window.Leanplum.eventProperties[0].Variant.should.equal('6');
        window.Leanplum.eventProperties[0].Price.should.equal(400);
        window.Leanplum.eventProperties[0].TotalAmount.should.equal(400);
        window.Leanplum.eventProperties[0].CouponCode.should.equal(
            'coupon-code'
        );
        window.Leanplum.eventProperties[0].Quantity.should.equal(1);

        done();
    });

    it('should log non-product purchase commerce events as normal events', function(done) {
        mParticle.forwarder.process({
            EventName: 'Test Purchase Event',
            EventDataType: MessageType.Commerce,
            EventCategory: EventType.Other,
            EventAttributes: {
                label: 'label',
                value: 200,
                category: 'category',
            },
        });

        window.Leanplum.should.have.property('trackCustomEventCalled', true);
        window.Leanplum.should.have.property(
            'trackCustomName',
            'Test Purchase Event'
        );
        window.Leanplum.eventProperties[0].should.have.property(
            'label',
            'label'
        );
        window.Leanplum.eventProperties[0].should.have.property('value', 200);
        window.Leanplum.eventProperties[0].should.have.property(
            'category',
            'category'
        );

        done();
    });

    it('should set user identity when userIdentities are passed on init and userIdField = customerId', function(done) {
        window.Leanplum.userId.should.equal('customerId');

        done();
    });

    it('should set user identity when userIdentities are passed on init and userIdField = email', function(done) {
        window.Leanplum = new MockLeanplum();
        mParticle.forwarder.init(
            {
                clientKey: '123456',
                appId: 'abcde',
                userIdField: 'email',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'customerId',
                    Type: IdentityType.CustomerId,
                },
                {
                    Identity: 'email',
                    Type: IdentityType.Email,
                },
                {
                    Identity: 'facebook',
                    Type: IdentityType.Facebook,
                },
            ],
            '1.1',
            'My App'
        );

        window.Leanplum.userId.should.equal('email');

        done();
    });

    it('should set user identity as MPID when userIdentities are passed on init and userIdField = mpid', function(done) {
        window.Leanplum = new MockLeanplum();
        window.mParticle.Identity = {
            getCurrentUser: function() {
                return {
                    getMPID: function() {
                        return '123';
                    },
                };
            },
        };
        mParticle.forwarder.init(
            {
                clientKey: '123456',
                appId: 'abcde',
                userIdField: 'mpid',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'customerId',
                    Type: IdentityType.CustomerId,
                },
                {
                    Identity: 'email',
                    Type: IdentityType.Email,
                },
                {
                    Identity: 'facebook',
                    Type: IdentityType.Facebook,
                },
            ],
            '1.1',
            'My App'
        );

        window.Leanplum.userId.should.equal('123');

        done();
    });

    it('should call setAppIdForDevelopmentMode if mParticle is in development mode upon init', function (done) {
        mParticle.getEnvironment = function () {
            return 'development';
        };

        window.Leanplum = new MockLeanplum();
        mParticle.forwarder.init(
            {
                clientKey: '123456',
                appId: 'abcde',
                userIdField: 'email',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'customerId',
                    Type: IdentityType.CustomerId,
                },
                {
                    Identity: 'email',
                    Type: IdentityType.Email,
                },
                {
                    Identity: 'facebook',
                    Type: IdentityType.Facebook,
                },
            ],
            '1.1',
            'My App'
        );

        window.Leanplum.setAppIdForDevelopmentModeCalled.should.equal(true);

        done();
    });

    it('should call setAppIdForProductionMode if mParticle is in production mode upon init', function (done) {
        mParticle.getEnvironment = function () {
            return 'production';
        };

        window.Leanplum = new MockLeanplum();

        mParticle.forwarder.init(
            {
                clientKey: '123456',
                appId: 'abcde',
                userIdField: 'email',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'customerId',
                    Type: IdentityType.CustomerId,
                },
                {
                    Identity: 'email',
                    Type: IdentityType.Email,
                },
                {
                    Identity: 'facebook',
                    Type: IdentityType.Facebook,
                },
            ],
            '1.1',
            'My App'
        );

        window.Leanplum.setAppIdForProductionModeCalled.should.equal(true);

        done();
    });

    it('should set user identity when directly called and no ids are passed', function (done) {
        window.Leanplum = new MockLeanplum();
        mParticle.forwarder.init(
            {
                apiKey: '123456',
                appId: 'abcde',
                userIdField: 'email',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [],
            '1.1',
            'My App'
        );

        mParticle.forwarder.setUserIdentity('123abc', IdentityType.Email);

        window.Leanplum.userId.should.equal('123abc');

        done();
    });

    it('should set user attributes when passed on init', function(done) {
        window.Leanplum.userAttributes.gender.should.equal('m');

        done();
    });

    it('should set user attributes when directly called', function(done) {
        mParticle.forwarder.setUserAttribute('color', 'blue');
        window.Leanplum.userAttributes.color.should.equal('blue');

        done();
    });

    it('should remove user attributes', function(done) {
        window.Leanplum.userAttributes.gender.should.equal('m');

        mParticle.forwarder.removeUserAttribute('gender');

        Object.keys(window.Leanplum.userAttributes).length.should.equal(0);

        done();
    });

    it('should set userId as MPID on onUserIdentified if forwarder settings has MPID as userIdField', function(done) {
        var mParticleUser = {
            getMPID: function() {
                return 'abc';
            },
        };
        mParticle.forwarder.init(
            {
                clientKey: '123456',
                appId: 'abcde',
                userIdField: 'mpid',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'customerId',
                    Type: IdentityType.CustomerId,
                },
                {
                    Identity: 'email',
                    Type: IdentityType.Email,
                },
                {
                    Identity: 'facebook',
                    Type: IdentityType.Facebook,
                },
            ],
            '1.1',
            'My App'
        );

        mParticle.forwarder.onUserIdentified(mParticleUser);

        window.Leanplum.userId.should.equal('abc');

        done();
    });
});
