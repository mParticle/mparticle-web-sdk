/* eslint-disable no-undef*/
describe('Amplitude forwarder', function () {
    var MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Commerce: 16,
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
        PromotionActionType = {
            Unknown: 0,
            PromotionView: 1,
            PromotionClick: 2,
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
            getName: function (type) {
                for (key in IdentityType) {
                    if (IdentityType[key] === type) {
                        return key;
                    }
                }
            },
        },
        ReportingService = function () {
            var self = this;

            this.id = null;
            this.event = null;

            this.cb = function (forwarder, event) {
                self.id = forwarder.id;
                self.event = event;
            };

            this.reset = function () {
                self.id = null;
                self.event = null;
            };
        },
        reportService = new ReportingService();

    before(function () {
        mParticle.EventType = EventType;
        mParticle.ProductActionType = ProductActionType;
        mParticle.IdentityType = IdentityType;
        mParticle.generateHash = function (name) {
            var hash = 0,
                i = 0,
                character;

            if (!name) {
                return null;
            }

            name = name.toString().toLowerCase();

            if (Array.prototype.reduce) {
                return name.split('').reduce(function (a, b) {
                    a = (a << 5) - a + b.charCodeAt(0);
                    return a & a;
                }, 0);
            }

            if (name.length === 0) {
                return hash;
            }

            for (i = 0; i < name.length; i++) {
                character = name.charCodeAt(i);
                hash = (hash << 5) - hash + character;
                hash = hash & hash;
            }

            return hash;
        };
        mParticle.Identity = {
            getCurrentUser: function () {
                return {
                    getMPID: function () {
                        return '123';
                    },
                    getUserIdentities: function () {
                        return {
                            userIdentities: {
                                customerid: '123',
                            },
                        };
                    },
                    getAllUserAttributes: function () {
                        return {};
                    },
                    getConsentState: function () {
                        return {};
                    },
                };
            },
        };
    });

    beforeEach(function () {
        window.amplitude.reset();
        mParticle.forwarder.init(
            {
                saveEvents: 'True',
                savedMaxCount: 20,
                uploadBatchSize: 5,
                includeUtm: 'False',
                includeReferrer: 'True',
                instanceName: 'newInstance',
            },
            reportService.cb,
            true
        );

        mParticle.init('faketoken', {
            requestConfig: false,
            workspaceToken: 'fakeToken',
        });
    });

    it('should have created an instance with name "newInstance"', function (done) {
        var instanceNames = Object.keys(amplitude.instances);

        instanceNames.should.have.length(1);
        amplitude.instances.should.have.property('newInstance');

        done();
    });

    it('creates an additional instance with name "default" when no instanceName is passed', function (done) {
        mParticle.forwarder.init(
            {
                saveEvents: 'True',
                savedMaxCount: 20,
                uploadBatchSize: 5,
                includeUtm: 'False',
                includeReferrer: 'True',
            },
            reportService.cb,
            true
        );

        var instanceNames = Object.keys(amplitude.instances);

        instanceNames.should.have.length(2);
        amplitude.instances.should.have.property('default');
        amplitude.instances.should.have.property('newInstance');

        done();
    });

    it('should log page view', function (done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageView,
            EventName: 'Test Page View',
            EventAttributes: {
                Path: 'Test',
            },
        });

        amplitude.instances.newInstance.events[0].should.have.property(
            'eventName',
            'Viewed Test Page View'
        );
        amplitude.instances.newInstance.events[0].should.have.property('attrs');
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Path',
            'Test'
        );

        done();
    });

    it('should log transaction', function (done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.PageEvent,
            EventCategory: EventType.Transaction,
            EventAttributes: {
                $MethodName: 'LogEcommerceTransaction',
                RevenueAmount: 400,
                ProductQuantity: 1,
                ProductSKU: '12345',
            },
        });

        amplitude.instances.newInstance.should.have.property('amount', 400);
        amplitude.instances.newInstance.should.have.property('quantity', 1);
        amplitude.instances.newInstance.should.have.property('sku', '12345');

        done();
    });

    it('should log product impressions as events', function (done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.ProductImpression,
            ProductImpressions: [
                {
                    ProductImpressionList: '"Suggested Products List"',
                    ProductList: [
                        {
                            Attributes: {
                                journeyType: 'testjourneytype1',
                                eventMetric1: 'metric2',
                            },
                            Brand: 'brand',
                            Category: 'category',
                            CouponCode: 'coupon',
                            Name: 'iphone',
                            Position: 1,
                            Price: 999,
                            Quantity: 1,
                            Sku: 'iphoneSKU',
                            TotalAmount: 999,
                            Variant: 'variant',
                        },
                        {
                            Attributes: {
                                attr1: 'hit-att2-type',
                                prodMetric1: 'metric1',
                            },
                            Brand: 'brand',
                            Category: 'category',
                            CouponCode: 'coupon',
                            Name: 'galaxy',
                            Position: 1,
                            Price: 799,
                            Quantity: 1,
                            Sku: 'galaxySKU',
                            TotalAmount: 799,
                            Variant: 'variant',
                        },
                    ],
                },
            ],
        });
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Brand',
            'brand'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Category',
            'category'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Coupon Code',
            'coupon'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Id',
            'iphoneSKU'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Item Price',
            999
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Name',
            'iphone'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Position',
            1
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Product Impression List',
            '"Suggested Products List"'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Quantity',
            1
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Variant',
            'variant'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'eventMetric1',
            'metric2'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'journeyType',
            'testjourneytype1'
        );

        amplitude.instances.newInstance.events[1].attrs.should.have.property(
            'Brand',
            'brand'
        );
        amplitude.instances.newInstance.events[1].attrs.should.have.property(
            'Category',
            'category'
        );
        amplitude.instances.newInstance.events[1].attrs.should.have.property(
            'Coupon Code',
            'coupon'
        );
        amplitude.instances.newInstance.events[1].attrs.should.have.property(
            'Id',
            'galaxySKU'
        );
        amplitude.instances.newInstance.events[1].attrs.should.have.property(
            'Item Price',
            799
        );
        amplitude.instances.newInstance.events[1].attrs.should.have.property(
            'Name',
            'galaxy'
        );
        amplitude.instances.newInstance.events[1].attrs.should.have.property(
            'Position',
            1
        );
        amplitude.instances.newInstance.events[1].attrs.should.have.property(
            'Product Impression List',
            '"Suggested Products List"'
        );
        amplitude.instances.newInstance.events[1].attrs.should.have.property(
            'Quantity',
            1
        );
        amplitude.instances.newInstance.events[1].attrs.should.have.property(
            'Variant',
            'variant'
        );
        amplitude.instances.newInstance.events[1].attrs.should.have.property(
            'attr1',
            'hit-att2-type'
        );
        amplitude.instances.newInstance.events[1].attrs.should.have.property(
            'prodMetric1',
            'metric1'
        );

        done();
    });

    it('should log promotion clicks as events', function (done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.PromotionClick,
            PromotionAction: {
                PromotionActionType: PromotionActionType.PromotionClick,
                PromotionList: [
                    {
                        Id: 'my_promo_1',
                        Creative: 'sale_banner_1',
                        Name: 'App-wide 50% off sale',
                    },
                ],
            },
        });
        amplitude.instances.newInstance.events[0].should.property(
            'eventName',
            'eCommerce - click - Item'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Id',
            'my_promo_1'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Creative',
            'sale_banner_1'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Name',
            'App-wide 50% off sale'
        );

        done();
    });

    it('should log promotion views as events', function (done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.PromotionView,
            PromotionAction: {
                PromotionActionType: PromotionActionType.PromotionView,
                PromotionList: [
                    {
                        Id: 'my_promo_1',
                        Creative: 'sale_banner_1',
                        Name: 'App-wide 50% off sale',
                    },
                ],
            },
        });
        console.log(amplitude.instances.newInstance.events);

        amplitude.instances.newInstance.events[0].should.property(
            'eventName',
            'eCommerce - view - Item'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Id',
            'my_promo_1'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Creative',
            'sale_banner_1'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Name',
            'App-wide 50% off sale'
        );

        done();
    });

    it('should set customer id user identity', function (done) {
        mParticle.getVersion = function () {
            return '1.16.3';
        };
        mParticle.forwarder.setUserIdentity(
            'customerId1',
            IdentityType.CustomerId
        );
        amplitude.instances.newInstance.should.have.property(
            'userId',
            'customerId1'
        );

        done();
    });

    it('should set customerid as mpid when selected in settings', function (done) {
        mParticle.forwarder.init(
            {
                userIdentification: 'mpId',
                instanceName: 'newInstance',
            },
            reportService.cb,
            true
        );

        amplitude.instances.newInstance.should.have.property('userId', '123');

        done();
    });

    it('should set user identities as user attributes for non customerid user identities in v1', function (done) {
        mParticle.getVersion = function () {
            return '1.16.3';
        };
        mParticle.forwarder.setUserIdentity('other1', IdentityType.Other);

        amplitude.instances.newInstance.props.should.have.property(
            'Other',
            'other1'
        );

        done();
    });

    describe('Identity', function () {
        mParticle.getVersion = function () {
            return '2.x.y';
        };
        describe('Identity exists', function () {
            var mParticleUser = {
                getMPID: function () {
                    return 'abc';
                },
                getUserIdentities: function () {
                    return {
                        userIdentities: {
                            customerid: 'customerid',
                            email: 'email',
                            other: 'other',
                            other2: 'other2',
                            other3: 'other3',
                            other4: 'other4',
                            other5: 'other5',
                            other6: 'other6',
                            other7: 'other7',
                            other8: 'other8',
                            other9: 'other9',
                            other10: 'other10',
                        },
                    };
                },
            };

            it('should not set any userId as a user attribute when on v2', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'other2',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'props',
                    null
                );

                done();
            });

            it('should set email as a user attribute when includeEmailAsUserProperty is True', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'other2',
                        instanceName: 'newInstance',
                        includeEmailAsUserProperty: 'True',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.props.should.have.property(
                    'email',
                    'email'
                );

                done();
            });

            it('should set userId as MPID on onUserIdentified if forwarder settings has MPID as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'mpId',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    'abc'
                );

                done();
            });

            it('should set userId as customerid on onUserIdentified if forwarder settings has customerId as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'customerId',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    'customerid'
                );

                done();
            });

            it('should set userId as email on onUserIdentified if forwarder settings has email as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'email',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    'email'
                );

                done();
            });

            it('should set userId as other on onUserIdentified if forwarder settings has other as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'other',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    'other'
                );

                done();
            });

            it('should set userId as other2 on onUserIdentified if forwarder settings has other2 as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'other2',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    'other2'
                );

                done();
            });

            it('should set userId as other3 on onUserIdentified if forwarder settings has other3 as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'other3',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    'other3'
                );

                done();
            });

            it('should set userId as other4 on onUserIdentified if forwarder settings has other4 as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'other4',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    'other4'
                );

                done();
            });

            it('should set userId as other5 on onUserIdentified if forwarder settings has other5 as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'other5',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    'other5'
                );

                done();
            });

            it('should set userId as other6 on onUserIdentified if forwarder settings has other6 as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'other6',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    'other6'
                );

                done();
            });

            it('should set userId as other7 on onUserIdentified if forwarder settings has other7 as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'other7',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    'other7'
                );

                done();
            });

            it('should set userId as other8 on onUserIdentified if forwarder settings has other4 as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'other8',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    'other8'
                );

                done();
            });

            it('should set userId as other9 on onUserIdentified if forwarder settings has other4 as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'other9',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    'other9'
                );

                done();
            });

            it('should set userId as other10 on onUserIdentified if forwarder settings has other4 as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'other10',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    'other10'
                );

                done();
            });
        });

        describe('Identity does not exist', function () {
            var mParticleUser = {
                getUserIdentities: function () {
                    return {
                        userIdentities: {},
                    };
                },
            };

            it('should set userId as customerid on onUserIdentified if forwarder settings has customerId as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'customerId',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    null
                );

                done();
            });

            it('should set userId as email on onUserIdentified if forwarder settings has email as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'email',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    null
                );

                done();
            });

            it('should set userId as other on onUserIdentified if forwarder settings has other as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'other',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    null
                );

                done();
            });

            it('should set userId as other2 on onUserIdentified if forwarder settings has other2 as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'other2',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    null
                );

                done();
            });

            it('should set userId as other3 on onUserIdentified if forwarder settings has other3 as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'other3',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    null
                );

                done();
            });

            it('should set userId as other4 on onUserIdentified if forwarder settings has other4 as userIdField', function (done) {
                mParticle.forwarder.init(
                    {
                        userIdentification: 'other4',
                        instanceName: 'newInstance',
                    },
                    reportService.cb,
                    true
                );

                mParticle.forwarder.onUserIdentified(mParticleUser);

                amplitude.instances.newInstance.should.have.property(
                    'userId',
                    null
                );

                done();
            });
        });
    });

    it('should set user attribute', function (done) {
        mParticle.forwarder.setUserAttribute('gender', 'male');

        amplitude.instances.newInstance.should.have.property('props');
        amplitude.instances.newInstance.props.should.have.property(
            'gender',
            'male'
        );

        done();
    });

    it('should set opt out', function (done) {
        mParticle.forwarder.setOptOut(true);

        amplitude.instances.newInstance.should.have.property(
            'isOptingOut',
            true
        );

        done();
    });

    it('should parse forwarder settings', function (done) {
        amplitude.instances.newInstance.settings.should.have.property(
            'saveEvents',
            true
        );
        amplitude.instances.newInstance.settings.should.have.property(
            'savedMaxCount',
            20
        );
        amplitude.instances.newInstance.settings.should.have.property(
            'uploadBatchSize',
            5
        );
        amplitude.instances.newInstance.settings.should.have.property(
            'includeUtm',
            false
        );
        amplitude.instances.newInstance.settings.should.have.property(
            'includeReferrer',
            true
        );

        done();
    });

    it('should log purchase commerce events', function (done) {
        mParticle.forwarder.process({
            EventAttributes: {
                CustomEventAttribute: 'SomeEventAttributeValue',
            },
            EventDataType: MessageType.Commerce,
            ProductAction: {
                TransactionId: 123,
                Affiliation: 'my-affiliation',
                TotalAmount: 234,
                TaxAmount: 40,
                ShippingAmount: 10,
                CouponCode: 'WinnerChickenDinner',
                ProductActionType: ProductActionType.Purchase,
                ProductList: [
                    {
                        Sku: '12345',
                        Price: 400,
                        Quantity: 1,
                        Attributes: { CustomProductAttribute: 'Cool' },
                    },
                ],
            },
        });

        // Transaction Level Attribute
        amplitude.instances.newInstance.revenueObj.eventAttributes.should.have.property(
            'Transaction Id',
            123
        );
        amplitude.instances.newInstance.revenueObj.eventAttributes.should.have.property(
            'Coupon Code',
            'WinnerChickenDinner'
        );
        amplitude.instances.newInstance.revenueObj.eventAttributes.should.have.property(
            'Affiliation',
            'my-affiliation'
        );
        amplitude.instances.newInstance.revenueObj.eventAttributes.should.have.property(
            'Shipping Amount',
            10
        );
        amplitude.instances.newInstance.revenueObj.eventAttributes.should.have.property(
            'Tax Amount',
            40
        );
        amplitude.instances.newInstance.revenueObj.eventAttributes.should.have.property(
            'CustomEventAttribute',
            'SomeEventAttributeValue'
        );
        amplitude.instances.newInstance.revenueObj.eventAttributes.should.not.have.property(
            'Total Amount'
        );
        amplitude.instances.newInstance.revenueObj.should.have.property(
            'price',
            234
        );

        // Product level attributes
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Id',
            '12345'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Item Price',
            400
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Quantity',
            1
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Transaction Id',
            123
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'CustomEventAttribute',
            'SomeEventAttributeValue'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'CustomProductAttribute',
            'Cool'
        );
        amplitude.instances.newInstance.events[0].attrs.should.not.property(
            'Total Product Amount'
        );

        done();
    });

    it('should log refund commerce events', function (done) {
        mParticle.forwarder.process({
            EventAttributes: {
                CustomEventAttribute: 'SomeEventAttributeValue',
            },
            EventDataType: MessageType.Commerce,
            ProductAction: {
                TransactionId: 123,
                Affiliation: 'my-affiliation',
                TotalAmount: 234,
                TaxAmount: 40,
                ShippingAmount: 10,
                CouponCode: 'WinnerChickenDinner',
                ProductActionType: ProductActionType.Refund,
                ProductList: [
                    {
                        Sku: '12345',
                        Price: 400,
                        Quantity: 1,
                        Attributes: { CustomProductAttribute: 'Cool' },
                    },
                ],
            },
        });

        // Transaction Level Attribute
        amplitude.instances.newInstance.revenueObj.eventAttributes.should.have.property(
            'Transaction Id',
            123
        );
        amplitude.instances.newInstance.revenueObj.eventAttributes.should.have.property(
            'Coupon Code',
            'WinnerChickenDinner'
        );
        amplitude.instances.newInstance.revenueObj.eventAttributes.should.have.property(
            'Affiliation',
            'my-affiliation'
        );
        amplitude.instances.newInstance.revenueObj.eventAttributes.should.have.property(
            'Shipping Amount',
            10
        );
        amplitude.instances.newInstance.revenueObj.eventAttributes.should.have.property(
            'Tax Amount',
            40
        );
        amplitude.instances.newInstance.revenueObj.eventAttributes.should.have.property(
            'CustomEventAttribute',
            'SomeEventAttributeValue'
        );
        amplitude.instances.newInstance.revenueObj.eventAttributes.should.not.have.property(
            'Total Amount'
        );
        amplitude.instances.newInstance.revenueObj.should.have.property(
            'price',
            -234
        );

        // Product level attributes
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Id',
            '12345'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Item Price',
            400
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Quantity',
            1
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Transaction Id',
            123
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'CustomEventAttribute',
            'SomeEventAttributeValue'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'CustomProductAttribute',
            'Cool'
        );
        amplitude.instances.newInstance.events[0].attrs.should.not.property(
            'Total Product Amount'
        );

        done();
    });

    it('should log AddToCart commerce events', function (done) {
        mParticle.forwarder.process({
            EventAttributes: {
                CustomEventAttribute: 'SomeEventAttributeValue',
            },
            EventDataType: MessageType.Commerce,
            ProductAction: {
                TransactionId: 123,
                Affiliation: 'my-affiliation',
                TotalAmount: 234,
                TaxAmount: 40,
                ShippingAmount: 10,
                CouponCode: 'WinnerChickenDinner',
                ProductActionType: ProductActionType.AddToCart,
                ProductList: [
                    {
                        Sku: '12345',
                        Price: 400,
                        Quantity: 1,
                        Attributes: { CustomProductAttribute: 'Cool' },
                    },
                ],
            },
        });

        // No revenue call is expected
        amplitude.instances.newInstance.should.not.have.property('revenueObj');

        // Product level attributes
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Id',
            '12345'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Item Price',
            400
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Quantity',
            1
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Transaction Id',
            123
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'CustomEventAttribute',
            'SomeEventAttributeValue'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'CustomProductAttribute',
            'Cool'
        );
        amplitude.instances.newInstance.events[0].attrs.should.not.property(
            'Total Product Amount'
        );

        done();
    });

    it('should log RemoveFromCart commerce events', function (done) {
        mParticle.forwarder.process({
            EventAttributes: {
                CustomEventAttribute: 'SomeEventAttributeValue',
            },
            EventDataType: MessageType.Commerce,
            ProductAction: {
                TransactionId: 123,
                Affiliation: 'my-affiliation',
                TotalAmount: 234,
                TaxAmount: 40,
                ShippingAmount: 10,
                CouponCode: 'WinnerChickenDinner',
                ProductActionType: ProductActionType.RemoveFromCart,
                ProductList: [
                    {
                        Sku: '12345',
                        Price: 400,
                        Quantity: 1,
                        Attributes: { CustomProductAttribute: 'Cool' },
                    },
                ],
            },
        });

        // No revenue call is expected
        amplitude.instances.newInstance.should.not.have.property('revenueObj');

        // Product level attributes
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Id',
            '12345'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Item Price',
            400
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Quantity',
            1
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'Transaction Id',
            123
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'CustomEventAttribute',
            'SomeEventAttributeValue'
        );
        amplitude.instances.newInstance.events[0].attrs.should.have.property(
            'CustomProductAttribute',
            'Cool'
        );
        amplitude.instances.newInstance.events[0].attrs.should.not.property(
            'Total Product Amount'
        );

        done();
    });

    describe('eCommerce Events', function () {
        var product1, product2, commerceEvent;
        beforeEach(function () {
            product1 = {
                Name: 'iphone',
                Sku: 'iphoneSKU',
                Price: 999,
                Quantity: 1,
                Brand: 'brand',
                Variant: 'variant',
                Category: 'category',
                Position: 1,
                CouponCode: 'coupon',
                TotalAmount: 999,
                Attributes: {
                    journeyType: 'testjourneytype1',
                    eventMetric1: 'metric2',
                },
            };
            product2 = {
                Name: 'galaxy',
                Sku: 'galaxySKU',
                Price: 799,
                Quantity: 1,
                Brand: 'brand',
                Variant: 'variant',
                Category: 'category',
                Position: 1,
                CouponCode: 'coupon',
                TotalAmount: 799,
                Attributes: {
                    'hit-att2': 'hit-att2-type',
                    prodMetric1: 'metric1',
                },
            };
            commerceEvent = {
                EventAttributes: {
                    sale: true,
                },
                EventDataType: 16,
                CurrencyCode: 'USD',
                ProductAction: {
                    ProductList: [product1, product2],
                    TransactionId: 'foo-transaction-id',
                    TotalAmount: 430,
                    TaxAmount: 30,
                },
            };
        });

        describe('eCommerce Events with excludeIndividualProductEvents set to true', function () {
            beforeEach(function () {
                mParticle.forwarder.init(
                    {
                        saveEvents: 'True',
                        savedMaxCount: 20,
                        uploadBatchSize: 5,
                        includeUtm: 'False',
                        includeReferrer: 'True',
                        instanceName: 'newInstance',
                        excludeIndividualProductEvents: 'True',
                        enableTempAmplitudeEcommerce: 'True',
                    },
                    reportService.cb,
                    true
                );
            });

            it('should only log transaction level purchase commerce event', function (done) {
                commerceEvent.EventName = 'eCommerce - Purchase';
                commerceEvent.EventCategory = CommerceEventType.ProductPurchase;
                commerceEvent.ProductAction.ProductActionType =
                    ProductActionType.Purchase;

                mParticle.forwarder.process(commerceEvent);
                amplitude.instances.newInstance.events.length.should.equal(1);
                // events[0] has the summary event
                amplitude.instances.newInstance.events[0].should.have.property(
                    'eventName',
                    'eCommerce - Purchase'
                );

                amplitude.instances.newInstance.events[0].attrs.should.deepEqual(
                    {
                        $revenue: 430,
                        'Product Count': 2,
                        'Currency Code': 'USD',
                        'Tax Amount': 30,
                        'Transaction Id': 'foo-transaction-id',
                        mparticle_amplitude_should_split: false,
                        products: [product1, product2],
                        sale: true,
                    }
                );

                done();
            });

            it('should only log transaction level refund commerce event', function (done) {
                commerceEvent.EventName = 'eCommerce - Refund';
                commerceEvent.EventCategory = CommerceEventType.ProductRefund;
                commerceEvent.ProductAction.ProductActionType =
                    ProductActionType.Refund;

                mParticle.forwarder.process(commerceEvent);
                amplitude.instances.newInstance.events.length.should.equal(1);
                // events[0] has the summary event
                amplitude.instances.newInstance.events[0].should.have.property(
                    'eventName',
                    'eCommerce - Refund'
                );

                amplitude.instances.newInstance.events[0].attrs.should.deepEqual(
                    {
                        $revenue: -430,
                        'Product Count': 2,
                        'Currency Code': 'USD',
                        'Tax Amount': 30,
                        'Transaction Id': 'foo-transaction-id',
                        mparticle_amplitude_should_split: false,
                        products: [product1, product2],
                        sale: true,
                    }
                );

                done();
            });

            it('should only log transaction level add to cart commerce event when excludeIndividualProductEvents = false ', function (done) {
                commerceEvent.EventName = 'eCommerce - AddToCart';
                commerceEvent.EventCategory =
                    CommerceEventType.ProductAddToCart;
                commerceEvent.ProductAction.ProductActionType =
                    ProductActionType.AddToCart;

                mParticle.forwarder.process(commerceEvent);
                // events[0] has the summary event
                amplitude.instances.newInstance.events[0].should.have.property(
                    'eventName',
                    'eCommerce - AddToCart'
                );

                amplitude.instances.newInstance.events[0].attrs.should.have.property(
                    'mparticle_amplitude_should_split',
                    false
                );
                amplitude.instances.newInstance.events[0].attrs.should.have.property(
                    'sale',
                    true
                );
                amplitude.instances.newInstance.events[0].attrs.should.have.property(
                    'products',
                    [product1, product2]
                );

                done();
            });

            it('should only log transaction level remove from cart commerce event when excludeIndividualProductEvents = false ', function (done) {
                commerceEvent.EventName = 'eCommerce - RemoveFromCart';
                commerceEvent.EventCategory =
                    CommerceEventType.ProductRemoveFromCart;
                commerceEvent.ProductAction.ProductActionType =
                    ProductActionType.RemoveFromCart;

                mParticle.forwarder.process(commerceEvent);
                // events[0] has the summary event
                amplitude.instances.newInstance.events[0].should.have.property(
                    'eventName',
                    'eCommerce - RemoveFromCart'
                );

                amplitude.instances.newInstance.events[0].attrs.should.have.property(
                    'mparticle_amplitude_should_split',
                    false
                );
                amplitude.instances.newInstance.events[0].attrs.should.have.property(
                    'sale',
                    true
                );
                amplitude.instances.newInstance.events[0].attrs.should.have.property(
                    'products',
                    [product1, product2]
                );

                done();
            });
        });

        describe('eCommerce Events with excludeIndividualProductEvents set to false', function () {
            beforeEach(function () {
                mParticle.forwarder.init(
                    {
                        saveEvents: 'True',
                        savedMaxCount: 20,
                        uploadBatchSize: 5,
                        includeUtm: 'False',
                        includeReferrer: 'True',
                        instanceName: 'newInstance',
                        excludeIndividualProductEvents: 'False',
                        enableTempAmplitudeEcommerce: 'True',
                    },
                    reportService.cb,
                    true
                );
            });

            it('should log transaction level purchase commerce event and include revenue and item level events', function (done) {
                commerceEvent.EventName = 'eCommerce - Purchase';
                commerceEvent.EventCategory = CommerceEventType.ProductPurchase;
                commerceEvent.ProductAction.ProductActionType =
                    ProductActionType.Purchase;
                mParticle.forwarder.process(commerceEvent);

                // a revenue event is not included on the events object, but rather the amplitude.instance.newInstace.revenueObj
                amplitude.instances.newInstance.events.length.should.equal(3);
                // events[0] has the summary event
                amplitude.instances.newInstance.events[0].should.have.property(
                    'eventName',
                    'eCommerce - Purchase'
                );

                amplitude.instances.newInstance.events[0].attrs.should.deepEqual(
                    {
                        'Product Count': 2,
                        revenue: 430,
                        'Currency Code': 'USD',
                        'Tax Amount': 30,
                        'Transaction Id': 'foo-transaction-id',
                        mparticle_amplitude_should_split: false,
                        products: [product1, product2],
                        sale: true,
                    }
                );

                amplitude.instances.newInstance.revenueObj.should.have.property(
                    'price',
                    430
                );

                amplitude.instances.newInstance.revenueObj.eventAttributes.should.deepEqual(
                    {
                        'Product Count': 2,
                        'Currency Code': 'USD',
                        'Tax Amount': 30,
                        'Transaction Id': 'foo-transaction-id',
                        sale: true,
                    }
                );

                amplitude.instances.newInstance.events[1].should.have.property(
                    'eventName',
                    'eCommerce - purchase - Item'
                );
                amplitude.instances.newInstance.events[1].attrs.should.deepEqual(
                    {
                        Brand: 'brand',
                        Category: 'category',
                        'Coupon Code': 'coupon',
                        Id: 'iphoneSKU',
                        'Item Price': 999,
                        Name: 'iphone',
                        Position: 1,
                        Quantity: 1,
                        'Transaction Id': 'foo-transaction-id',
                        Variant: 'variant',
                        eventMetric1: 'metric2',
                        journeyType: 'testjourneytype1',
                        sale: true,
                    }
                );

                amplitude.instances.newInstance.events[2].should.have.property(
                    'eventName',
                    'eCommerce - purchase - Item'
                );

                amplitude.instances.newInstance.events[2].attrs.should.deepEqual(
                    {
                        Brand: 'brand',
                        Category: 'category',
                        'Coupon Code': 'coupon',
                        Id: 'galaxySKU',
                        'Item Price': 799,
                        Name: 'galaxy',
                        Position: 1,
                        Quantity: 1,
                        'Transaction Id': 'foo-transaction-id',
                        Variant: 'variant',
                        'hit-att2': 'hit-att2-type',
                        prodMetric1: 'metric1',
                        sale: true,
                    }
                );

                done();
            });

            it('should log transaction level refund commerce event and include revenue and item level events', function (done) {
                commerceEvent.EventName = 'eCommerce - Refund';
                commerceEvent.EventCategory = CommerceEventType.ProductRefund;
                commerceEvent.ProductAction.ProductActionType =
                    ProductActionType.Refund;
                mParticle.forwarder.process(commerceEvent);

                // a revenue event is not included on the events object, but rather the amplitude.instance.newInstace.revenueObj
                amplitude.instances.newInstance.events.length.should.equal(3);
                // events[0] has the summary event
                amplitude.instances.newInstance.events[0].should.have.property(
                    'eventName',
                    'eCommerce - Refund'
                );

                amplitude.instances.newInstance.events[0].attrs.should.deepEqual(
                    {
                        'Product Count': 2,
                        revenue: -430,
                        'Currency Code': 'USD',
                        'Tax Amount': 30,
                        'Transaction Id': 'foo-transaction-id',
                        mparticle_amplitude_should_split: false,
                        products: [product1, product2],
                        sale: true,
                    }
                );

                amplitude.instances.newInstance.revenueObj.should.have.property(
                    'price',
                    -430
                );

                amplitude.instances.newInstance.revenueObj.eventAttributes.should.deepEqual(
                    {
                        'Product Count': 2,
                        'Currency Code': 'USD',
                        'Tax Amount': 30,
                        'Transaction Id': 'foo-transaction-id',
                        sale: true,
                    }
                );

                amplitude.instances.newInstance.events[1].should.have.property(
                    'eventName',
                    'eCommerce - refund - Item'
                );
                amplitude.instances.newInstance.events[1].attrs.should.deepEqual(
                    {
                        Brand: 'brand',
                        Category: 'category',
                        'Coupon Code': 'coupon',
                        Id: 'iphoneSKU',
                        'Item Price': 999,
                        Name: 'iphone',
                        Position: 1,
                        Quantity: 1,
                        'Transaction Id': 'foo-transaction-id',
                        Variant: 'variant',
                        eventMetric1: 'metric2',
                        journeyType: 'testjourneytype1',
                        sale: true,
                    }
                );

                amplitude.instances.newInstance.events[2].should.have.property(
                    'eventName',
                    'eCommerce - refund - Item'
                );

                amplitude.instances.newInstance.events[2].attrs.should.deepEqual(
                    {
                        Brand: 'brand',
                        Category: 'category',
                        'Coupon Code': 'coupon',
                        Id: 'galaxySKU',
                        'Item Price': 799,
                        Name: 'galaxy',
                        Position: 1,
                        Quantity: 1,
                        'Transaction Id': 'foo-transaction-id',
                        Variant: 'variant',
                        'hit-att2': 'hit-att2-type',
                        prodMetric1: 'metric1',
                        sale: true,
                    }
                );

                done();
            });

            it('should log transaction level add to cart commerce event and include item level events', function (done) {
                commerceEvent.EventName = 'eCommerce - AddToCart';
                commerceEvent.EventCategory =
                    CommerceEventType.ProductAddToCart;
                commerceEvent.ProductAction.ProductActionType =
                    ProductActionType.AddToCart;
                mParticle.forwarder.process(commerceEvent);

                // No revenue call is expected
                amplitude.instances.newInstance.should.not.have.property(
                    'revenueObj'
                );

                amplitude.instances.newInstance.events.length.should.equal(3);

                // events[0] has the summary event
                amplitude.instances.newInstance.events[0].should.have.property(
                    'eventName',
                    'eCommerce - AddToCart'
                );

                amplitude.instances.newInstance.events[0].attrs.should.have.property(
                    'mparticle_amplitude_should_split',
                    false
                );
                amplitude.instances.newInstance.events[0].attrs.should.have.property(
                    'sale',
                    true
                );
                amplitude.instances.newInstance.events[0].attrs.should.have.property(
                    'products',
                    [product1, product2]
                );

                amplitude.instances.newInstance.events[1].should.have.property(
                    'eventName',
                    'eCommerce - add_to_cart - Item'
                );

                amplitude.instances.newInstance.events[1].attrs.should.deepEqual(
                    {
                        Brand: 'brand',
                        Category: 'category',
                        'Coupon Code': 'coupon',
                        Id: 'iphoneSKU',
                        'Item Price': 999,
                        Name: 'iphone',
                        Position: 1,
                        Quantity: 1,
                        'Transaction Id': 'foo-transaction-id',
                        Variant: 'variant',
                        eventMetric1: 'metric2',
                        journeyType: 'testjourneytype1',
                        'Tax Amount': 30,
                        sale: true,
                    }
                );

                amplitude.instances.newInstance.events[2].should.have.property(
                    'eventName',
                    'eCommerce - add_to_cart - Item'
                );

                amplitude.instances.newInstance.events[2].attrs.should.deepEqual(
                    {
                        Brand: 'brand',
                        Category: 'category',
                        'Coupon Code': 'coupon',
                        Id: 'galaxySKU',
                        'Item Price': 799,
                        Name: 'galaxy',
                        Position: 1,
                        Quantity: 1,
                        'Transaction Id': 'foo-transaction-id',
                        Variant: 'variant',
                        'hit-att2': 'hit-att2-type',
                        prodMetric1: 'metric1',
                        'Tax Amount': 30,
                        sale: true,
                    }
                );

                done();
            });

            it('should log transaction level remove from cart commerce event and include item level events', function (done) {
                commerceEvent.EventName = 'eCommerce - RemoveFromCart';
                commerceEvent.EventCategory =
                    CommerceEventType.ProductRemoveFromCart;
                commerceEvent.ProductAction.ProductActionType =
                    ProductActionType.RemoveFromCart;
                mParticle.forwarder.process(commerceEvent);

                // No revenue call is expected
                amplitude.instances.newInstance.should.not.have.property(
                    'revenueObj'
                );

                amplitude.instances.newInstance.events.length.should.equal(3);

                // events[0] has the summary event
                amplitude.instances.newInstance.events[0].should.have.property(
                    'eventName',
                    'eCommerce - RemoveFromCart'
                );

                amplitude.instances.newInstance.events[0].attrs.should.have.property(
                    'mparticle_amplitude_should_split',
                    false
                );
                amplitude.instances.newInstance.events[0].attrs.should.have.property(
                    'sale',
                    true
                );
                amplitude.instances.newInstance.events[0].attrs.should.have.property(
                    'products',
                    [product1, product2]
                );

                amplitude.instances.newInstance.events[1].should.have.property(
                    'eventName',
                    'eCommerce - remove_from_cart - Item'
                );

                amplitude.instances.newInstance.events[1].attrs.should.deepEqual(
                    {
                        Brand: 'brand',
                        Category: 'category',
                        'Coupon Code': 'coupon',
                        Id: 'iphoneSKU',
                        'Item Price': 999,
                        Name: 'iphone',
                        Position: 1,
                        Quantity: 1,
                        'Transaction Id': 'foo-transaction-id',
                        Variant: 'variant',
                        eventMetric1: 'metric2',
                        journeyType: 'testjourneytype1',
                        'Tax Amount': 30,
                        sale: true,
                    }
                );

                amplitude.instances.newInstance.events[2].should.have.property(
                    'eventName',
                    'eCommerce - remove_from_cart - Item'
                );

                amplitude.instances.newInstance.events[2].attrs.should.deepEqual(
                    {
                        Brand: 'brand',
                        Category: 'category',
                        'Coupon Code': 'coupon',
                        Id: 'galaxySKU',
                        'Item Price': 799,
                        Name: 'galaxy',
                        Position: 1,
                        Quantity: 1,
                        'Transaction Id': 'foo-transaction-id',
                        Variant: 'variant',
                        'hit-att2': 'hit-att2-type',
                        prodMetric1: 'metric1',
                        'Tax Amount': 30,
                        sale: true,
                    }
                );

                done();
            });
        });
    });

    it('should not log non-compatible commerce events', function (done) {
        mParticle.forwarder.process({
            EventDataType: MessageType.Commerce,
            ProductAction: {
                ProductActionType: ProductActionType.Checkout,
                ProductList: [
                    {
                        Sku: '12345',
                        Price: 400,
                        Quantity: 1,
                    },
                ],
            },
        });

        amplitude.instances.newInstance.should.have.property('amount', null);

        done();
    });

    describe('Custom Attributes with Arrays when sendEventAttributesAsObjects is true', function () {
        beforeEach(function () {
            window.amplitude.reset();
            mParticle.forwarder.init(
                {
                    sendEventAttributesAsObjects: 'True',
                    instanceName: 'newInstance',
                    excludeIndividualProductEvents: 'False',
                },
                reportService.cb,
                true
            );

            mParticle.init('faketoken', {
                requestConfig: false,
                workspaceToken: 'fakeToken',
            });
        });

        it('should turn a stringified array into an array as part of custom attributes when logging a page view', function () {
            mParticle.forwarder.process({
                EventDataType: MessageType.PageView,
                EventName: 'Test Page View',
                EventAttributes: {
                    Path: 'Test',
                    Array: JSON.stringify(['abc', 'def', 'ghi']),
                    Obj: JSON.stringify({ foo: 'bar' }),
                },
            });

            amplitude.instances.newInstance.events[0].should.have.property(
                'eventName',
                'Viewed Test Page View'
            );
            amplitude.instances.newInstance.events[0].should.have.property(
                'attrs'
            );
            amplitude.instances.newInstance.events[0].attrs.should.have.property(
                'Path',
                'Test'
            );
            amplitude.instances.newInstance.events[0].attrs.should.have.property(
                'Array',
                ['abc', 'def', 'ghi']
            );
            amplitude.instances.newInstance.events[0].attrs.Obj.should.have.property(
                'foo',
                'bar'
            );
        });

        it('should turn a stringified array into an array as part of custom attributes when logging a purchase commerce events', function (done) {
            mParticle.forwarder.process({
                EventAttributes: {
                    CustomEventAttribute: 'SomeEventAttributeValue',
                    Array: JSON.stringify(['abc', 'def', 'ghi']),
                    Obj: JSON.stringify({ foo: 'bar' }),
                },
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 234,
                    TaxAmount: 40,
                    ShippingAmount: 10,
                    CouponCode: 'WinnerChickenDinner',
                    ProductActionType: ProductActionType.Purchase,
                    ProductList: [
                        {
                            Sku: '12345',
                            Price: 400,
                            Quantity: 1,
                            Attributes: { CustomProductAttribute: 'Cool' },
                        },
                    ],
                },
            });

            // Transaction Level Attribute
            amplitude.instances.newInstance.revenueObj.eventAttributes.should.have.property(
                'CustomEventAttribute',
                'SomeEventAttributeValue'
            );
            amplitude.instances.newInstance.revenueObj.eventAttributes.should.have.property(
                'Array',
                ['abc', 'def', 'ghi']
            );
            amplitude.instances.newInstance.revenueObj.eventAttributes.Obj.should.have.property(
                'foo',
                'bar'
            );

            // Product level attributes
            amplitude.instances.newInstance.events[0].attrs.should.have.property(
                'CustomEventAttribute',
                'SomeEventAttributeValue'
            );
            amplitude.instances.newInstance.events[0].attrs.should.have.property(
                'Array',
                ['abc', 'def', 'ghi']
            );
            amplitude.instances.newInstance.events[0].attrs.Obj.should.have.property(
                'foo',
                'bar'
            );

            done();
        });

        it('should turn a stringified array into an array as part of custom attributes when logging a regular page event', function (done) {
            mParticle.forwarder.process({
                EventDataType: MessageType.PageEvent,
                EventAttributes: {
                    CustomEventAttribute: 'SomeEventAttributeValue',
                    Array: JSON.stringify(['abc', 'def', 'ghi']),
                    Obj: JSON.stringify({ foo: 'bar' }),
                },
            });

            amplitude.instances.newInstance.events[0].attrs.should.have.property(
                'CustomEventAttribute',
                'SomeEventAttributeValue'
            );
            amplitude.instances.newInstance.events[0].attrs.should.have.property(
                'Array',
                ['abc', 'def', 'ghi']
            );
            amplitude.instances.newInstance.events[0].attrs.Obj.should.have.property(
                'foo',
                'bar'
            );

            done();
        });
    });
});

describe('Default amplitude settings', function () {
    it('sets default amplitude settings', function () {
        var platform = 'International Space Station';
        var baseUrl = 'api2.amplitude.com';
        window.AmplitudeInitSettings = {
            platform: platform,
        };
        window.amplitude.reset();
        mParticle.forwarder.init(
            {
                saveEvents: 'True',
                savedMaxCount: 20,
                uploadBatchSize: 5,
                includeUtm: 'False',
                includeReferrer: 'True',
                instanceName: 'newInstance',
                baseUrl: baseUrl,
            },
            function (forwarder, event) {
                self.id = forwarder.id;
                self.event = event;
            },
            true
        );

        amplitude.instances.newInstance.settings.should.have.property(
            'platform',
            platform
        );

        amplitude.instances.newInstance.settings.should.have.property(
            'apiEndpoint',
            baseUrl
        );
    });
});
