/* eslint-disable no-undef*/
describe('GoogleTagManager Forwarder', function() {
    // -------------------DO NOT EDIT ANYTHING BELOW THIS LINE-----------------------
    var MessageTypes = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            AppStateTransition: 10,
            Profile: 14,
            Commerce: 16
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
    mParticle.getDeviceId = function() {
        return '1234567890';
    };
    mParticle.Identity = {
        getCurrentUser: function () {
            return {
                getMPID: function () {
                    return '123';
                },
                getConsentState: function () {
                    return {
                        gdpr: {},
                        getGDPRConsentState: function () {
                            return {
                                some_consent: {
                                    Consented: false,
                                    Timestamp: 1,
                                    Document: 'some_consent',
                                },
                                test_consent: {
                                    Consented: false,
                                    Timestamp: 1,
                                    Document: 'test_consent',
                                },
                            };
                        },
                    };
                },
            };
        },
    };
    // -------------------START EDITING BELOW:-----------------------
    var GoogleTagManagerMockForwarder = function() {
        var self = this;

        // create properties for each type of event you want tracked, see below for examples
        this.trackCustomEventCalled = false;
        this.logPurchaseEventCalled = false;
        this.initializeCalled = false;

        this.trackCustomName = null;
        this.logPurchaseName = null;
        this.apiKey = null;
        this.appId = null;
        this.userId = null;
        this.userAttributes = {};
        this.userIdField = null;

        this.eventProperties = [];
        this.purchaseEventProperties = [];

        // stub your different methods to ensure they are being called properly
        this.initialize = function(appId, apiKey) {
            self.initializeCalled = true;
            self.apiKey = apiKey;
            self.appId = appId;
        };

        this.stubbedTrackingMethod = function(name, eventProperties) {
            self.trackCustomEventCalled = true;
            self.trackCustomName = name;
            self.eventProperties.push(eventProperties);
            // Return true to indicate event should be reported
            return true;
        };

        this.stubbedUserAttributeSettingMethod = function(userAttributes) {
            self.userId = id;
            userAttributes = userAttributes || {};
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

        this.stubbedUserLoginMethod = function(id) {
            self.userId = id;
        };
    };

    var mockDataLayer;
    var mockUser;

    beforeEach(function () {
        window.GoogleTagManagerMockForwarder = new GoogleTagManagerMockForwarder();
        // Include any specific settings that is required for initializing your SDK here
        var sdkSettings = {
            containerId: 'GTM-1138',
            dataLayerName: 'mparticle_data_layer'
        };
        mParticle.forwarder.init(sdkSettings, reportService.cb, true);

        mockDataLayer = window.mparticle_data_layer || [];

        mockUser = {
            getMPID: function() {
                return '8675309';
            },
            getAllUserAttributes: function() {
                return {
                    something: 'some attribute'
                };
            },
            getUserIdentities: function() {
                return {
                    userIdentities: {
                        customerid: '2324',
                        email: 'testuser@mparticle.com'
                    }
                };
            }
        };
    });

    afterEach(function() {
        window = {};
        window.mparticle_data_layer = [];
        mParticle.forwarders = [];
    });

    describe('Basic Events', function() {
        it('should log event', function(done) {
            mParticle.forwarder.process({
                EventDataType: MessageTypes.PageEvent,
                EventName: 'Test Event',
                EventAttributes: {
                    label: 'label',
                    value: 200,
                    category: 'category'
                }
            });

            var expectedEvent = {
                event: 'Test Event',
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'Test Event',
                        type: 'custom_event',
                        attributes: {
                            label: 'label',
                            value: 200,
                            category: 'category'
                        }
                    },
                    user: {
                        mpid: '',
                        attributes: {},
                        identities: {},
                        consent_state: {
                            gdpr: {}
                        }
                    }
                }
            };

            mockDataLayer.length.should.equal(1);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });

        it('should log page view', function(done) {
            mParticle.forwarder.process({
                EventDataType: MessageTypes.PageView,
                EventName: 'Test PageView',
                EventAttributes: {
                    attr1: 'test1',
                    attr2: 'test2'
                }
            });
            var expectedEvent = {
                event: 'Test PageView',
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'Test PageView',
                        type: 'screen_view',
                        attributes: {
                            attr1: 'test1',
                            attr2: 'test2'
                        }
                    },

                    user: {
                        mpid: '',
                        attributes: {},
                        identities: {},
                        consent_state: {
                            gdpr: {}
                        }
                    }
                }
            };

            mockDataLayer.length.should.equal(1);
            mockDataLayer[0].should.match(expectedEvent);

            done();
        });
    });
    describe('DataLayer', function() {
        it('should reject invalid custom dataLayer names ', function(done) {
            window.faultyForwarder = new GoogleTagManagerMockForwarder();
            // Include any specific settings that is required for initializing your SDK here
            var sdkSettings = {
                containerId: 'foo',
                dataLayerName: '$$$'
            };

            mParticle.forwarder.init(sdkSettings, reportService.cb, true);

            brokenDataLayer = window['$$$'];

            (brokenDataLayer === undefined).should.equal(true);
            done();
        });

        it('should implement a shared custom dataLayer', function(done) {
            // Expected behavior:
            // If two GTM Forwarders are sharing the same dataLayer name,
            // we should expect events to be duplicated in the dataLayer

            window.firstGTMForwarder = new GoogleTagManagerMockForwarder();
            window.secondGTMForwarder = new GoogleTagManagerMockForwarder();
            // Include any specific settings that is required for initializing your SDK here
            var sdkSettings1 = {
                containerId: 'GTM-1138',
                dataLayerName: 'shared_mock_data_layer'
            };

            var sdkSettings2 = {
                containerId: 'GTM-4311',
                dataLayerName: 'shared_mock_data_layer'
            };
            mParticle.forwarder.init(sdkSettings1, reportService.cb, true);
            mParticle.forwarder.init(sdkSettings2, reportService.cb, true);

            mParticle.forwarder.process({
                EventDataType: MessageTypes.PageEvent,
                EventName: 'Shared Event'
            });

            var expectedEvent = {
                event: 'Shared Event'
            };

            // Duplicate shared events is expected
            window.shared_mock_data_layer.should.be.defined;
            window.shared_mock_data_layer.length.should.equal(2);

            // Make sure both events are the same
            window.shared_mock_data_layer[0].should.match(expectedEvent);
            window.shared_mock_data_layer[1].should.match(expectedEvent);

            done();
        });

        it('should implement a unique dataLayer', function(done) {
            window.anotherGTMForwarder = new GoogleTagManagerMockForwarder();
            // Include any specific settings that is required for initializing your SDK here
            var sdkSettings = {
                containerId: 'GTM-1138',
                dataLayerName: 'another_mock_data_layer'
            };
            mParticle.forwarder.init(sdkSettings, reportService.cb, true);

            mParticle.forwarder.process({
                EventDataType: MessageTypes.PageEvent,
                EventName: 'Custom Event'
            });

            var expectedEvent = {
                event: 'Custom Event'
            };

            window.another_mock_data_layer.should.be.defined;
            window.another_mock_data_layer.length.should.equal(1);
            window.another_mock_data_layer[0].should.match(expectedEvent);

            done();
        });

        it('should allow multiple GTM containers', function(done) {
            window.firstGTMForwarder = new GoogleTagManagerMockForwarder();
            window.secondGTMForwarder = new GoogleTagManagerMockForwarder();
            // Include any specific settings that is required for initializing your SDK here
            var sdkSettings1 = {
                containerId: 'GTM-1138',
                dataLayerName: 'first_mock_data_layer'
            };

            var sdkSettings2 = {
                containerId: 'GTM-4311',
                dataLayerName: 'second_mock_data_layer'
            };
            mParticle.forwarder.init(sdkSettings1, reportService.cb, true);
            mParticle.forwarder.init(sdkSettings2, reportService.cb, true);

            mParticle.forwarder.process({
                EventDataType: MessageTypes.PageEvent,
                EventName: 'Shared Event'
            });

            var expectedEvent = {
                event: 'Shared Event'
            };

            window.first_mock_data_layer.should.be.defined;
            window.second_mock_data_layer.should.be.defined;

            window.first_mock_data_layer.length.should.equal(1);
            window.first_mock_data_layer[0].should.match(expectedEvent);

            window.second_mock_data_layer.length.should.equal(1);
            window.second_mock_data_layer[0].should.match(expectedEvent);

            done();
        });
    });

    describe('Identity', function() {
        it('should contain user attributes and identites', function(done) {
            var fakeEvent = {
                EventName: 'Test User Action',
                EventDataType: MessageTypes.PageEvent,
                UserAttributes: {
                    something: 'some attribute'
                },
                UserIdentities: [
                    {
                        Identity: '2324',
                        Type: 1
                    },
                    {
                        Identity: 'testuser@mparticle.com',
                        Type: 7
                    }
                ],
                EventAttributes: {
                    testable: true,
                    another_attribute: 'maybe'
                },
                DeviceId: '1234567890',
                MPID: '8675309'
            };

            var expectedEvent = {
                event: 'Test User Action',
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'Test User Action',
                        attributes: {
                            testable: true,
                            another_attribute: 'maybe'
                        }
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {
                            something: 'some attribute'
                        },
                        identities: {
                            customerid: '2324',
                            email: 'testuser@mparticle.com'
                        }
                    }
                }
            };

            mParticle.forwarder.process(fakeEvent);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);

            done();
        });

        it('should trigger login complete', function(done) {
            mParticle.forwarder.onLoginComplete(mockUser);

            var expectedEvent = {
                event: 'Login Complete',
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'Login Complete',
                        type: 'custom_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {
                            something: 'some attribute'
                        },
                        identities: {
                            customerid: '2324',
                            email: 'testuser@mparticle.com'
                        }
                    }
                }
            };

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });

        it('should trigger logout complete', function(done) {
            mParticle.forwarder.onLogoutComplete(mockUser);

            var expectedEvent = {
                event: 'Logout Complete',
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'Logout Complete',
                        type: 'custom_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {
                            something: 'some attribute'
                        },
                        identities: {
                            customerid: '2324',
                            email: 'testuser@mparticle.com'
                        }
                    }
                }
            };

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });

        it('should trigger modify complete', function(done) {
            mParticle.forwarder.onModifyComplete(mockUser);

            var expectedEvent = {
                event: 'Modify Complete',
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'Modify Complete',
                        type: 'custom_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {
                            something: 'some attribute'
                        },
                        identities: {
                            customerid: '2324',
                            email: 'testuser@mparticle.com'
                        }
                    }
                }
            };

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });

        it('should trigger user identified', function(done) {
            mParticle.forwarder.onUserIdentified(mockUser);

            var expectedEvent = {
                event: 'User Identified',
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'User Identified',
                        type: 'custom_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {
                            something: 'some attribute'
                        },
                        identities: {
                            customerid: '2324',
                            email: 'testuser@mparticle.com'
                        }
                    }
                }
            };

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger identify complete', function(done) {
            mParticle.forwarder.onIdentifyComplete(mockUser);

            var expectedEvent = {
                event: 'Identify Complete',
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'Identify Complete',
                        type: 'custom_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {
                            something: 'some attribute'
                        },
                        identities: {
                            customerid: '2324',
                            email: 'testuser@mparticle.com'
                        }
                    }
                }
            };

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
    });
    describe('eCommerce', function() {
        it('should add custom product attributes', function (done) {
            var event = {
                EventName: 'eCommerce - AddToCart',
                EventCategory: mParticle.CommerceEventType.ProductAddToCart,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                EventAttributes: null,
                DeviceId: '1234567890',
                MPID: '8675309',
                CurrencyCode: null,
                ProductAction: {
                    ProductActionType: 1,
                    ProductList: [
                        {
                            Name: 'Some Product',
                            Sku: '12312123',
                            Price: '112.22',
                            Quantity: 1,
                            Brand: 'Omni Consumer Products',
                            Variant: 'cheaper',
                            Position: 'featured',
                            CouponCode: 'SALE2019',
                            TotalAmount: 112.22,
                            Attributes: {
                                is_personalization_available: true,
                                location: 'test_package',
                                campaign: 'test_campaign'
                            }
                        }
                    ]
                }
            };

            var expectedEvent = {
                event: 'eCommerce - AddToCart',
                ecommerce: {
                    currencyCode: 'USD',
                    add: {
                        products: [
                            {
                                name: 'Some Product',
                                id: '12312123',
                                price: '112.22',
                                quantity: 1,
                                brand: 'Omni Consumer Products',
                                variant: 'cheaper',
                                position: 'featured',
                                coupon_code: 'SALE2019',
                                total_amount: 112.22,
                                attributes: {
                                    is_personalization_available: true,
                                    location: 'test_package',
                                    campaign: 'test_campaign'
                                }
                            }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - AddToCart',
                        type: 'commerce_event',
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };

            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger product impressions', function(done) {
            var event = {
                EventName: 'eCommerce - Impression',
                EventCategory: mParticle.CommerceEventType.ProductImpression,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [
                    {
                        Identity: '2324',
                        Type: 1
                    },
                    {
                        Identity: 'testuser@mparticle.com',
                        Type: 7
                    }
                ],
                DeviceId: '1234567890',
                MPID: '8675309',
                ProductImpressions: [
                    {
                        ProductImpressionList: 'Test Impression',
                        ProductList: [
                            {
                                Name: 'Headphones',
                                Sku: '44556',
                                Price: '12.23',
                                Quantity: 1,
                                TotalAmount: 12.23,
                                Attributes: null
                            },
                            {
                                Name: 'Pizza',
                                Sku: '809808',
                                Price: '23.00',
                                Quantity: 1,
                                TotalAmount: 23,
                                Attributes: null
                            },
                            {
                                Name: 'Drums',
                                Sku: '0202200202',
                                Price: '320.12',
                                Quantity: 1,
                                TotalAmount: 320.12,
                                Attributes: null
                            },
                            {
                                Name: 'Bass',
                                Sku: '100100101',
                                Price: '1204.02',
                                Quantity: 1,
                                TotalAmount: 1204.02,
                                Attributes: null
                            },
                            {
                                Name: 'Spaceboy',
                                Sku: '1',
                                Price: '111.11',
                                Quantity: 1,
                                TotalAmount: 111.11,
                                Attributes: null
                            }
                        ]
                    }
                ]
            };

            var expectedEvent = {
                event: 'eCommerce - Impression',
                ecommerce: {
                    currencyCode: 'USD',
                    impressions: [
                        { name: 'Headphones', id: '44556', price: '12.23' },
                        { name: 'Pizza', id: '809808', price: '23.00' },
                        { name: 'Drums', id: '0202200202', price: '320.12' },
                        { name: 'Bass', id: '100100101', price: '1204.02' },
                        { name: 'Spaceboy', id: '1', price: '111.11' }
                    ]
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - Impression',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {
                            customerid: '2324',
                            email: 'testuser@mparticle.com'
                        }
                    }
                }
            };

            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger product clicks', function(done) {
            var event = {
                EventName: 'eCommerce - Click',
                EventCategory: mParticle.CommerceEventType.ProductClick,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                EventAttributes: {
                    list: 'featured'
                },
                DeviceId: '1234567890',
                MPID: '8675309',
                CurrencyCode: null,
                ProductAction: {
                    ProductActionType: 5,
                    ProductList: [
                        {
                            Name: 'Headphones',
                            Sku: '44556',
                            Price: '12.23',
                            Quantity: 8,
                            Position: 0,
                            TotalAmount: 97.84,
                            Attributes: null
                        }
                    ]
                }
            };

            var expectedEvent = {
                event: 'eCommerce - Click',
                ecommerce: {
                    click: {
                        actionField: {
                            list: 'featured'
                        },
                        products: [
                            {
                                name: 'Headphones',
                                id: '44556',
                                price: '12.23'
                            }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - Click',
                        type: 'commerce_event',
                        attributes: {
                            list: 'featured'
                        }
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };

            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger add to cart', function(done) {
            var event = {
                EventName: 'eCommerce - AddToCart',
                EventCategory: mParticle.CommerceEventType.ProductAddToCart,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                EventAttributes: null,
                DeviceId: '1234567890',
                MPID: '8675309',
                CurrencyCode: null,
                ProductAction: {
                    ProductActionType: 1,
                    ProductList: [
                        {
                            Name: 'Some Product',
                            Sku: '12312123',
                            Price: '112.22',
                            Quantity: 1,
                            TotalAmount: 112.22,
                            Attributes: null
                        }
                    ]
                }
            };

            var expectedEvent = {
                event: 'eCommerce - AddToCart',
                ecommerce: {
                    currencyCode: 'USD',
                    add: {
                        products: [
                            {
                                name: 'Some Product',
                                id: '12312123',
                                price: '112.22'
                            }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - AddToCart',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };

            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger remove from cart', function(done) {
            var event = {
                EventName: 'eCommerce - RemoveFromCart',
                EventCategory:
                    mParticle.CommerceEventType.ProductRemoveFromCart,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                EventAttributes: null,
                DeviceId: '1234567890',
                MPID: '8675309',
                CurrencyCode: null,
                ProductAction: {
                    ProductActionType: 1,
                    ProductList: [
                        {
                            Name: 'Some Product',
                            Sku: '12312123',
                            Price: '112.22',
                            Quantity: 1,
                            TotalAmount: 112.22,
                            Attributes: null
                        }
                    ]
                }
            };

            var expectedEvent = {
                event: 'eCommerce - RemoveFromCart',
                ecommerce: {
                    currencyCode: 'USD',
                    remove: {
                        products: [
                            {
                                name: 'Some Product',
                                id: '12312123',
                                price: '112.22'
                            }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - RemoveFromCart',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };

            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger promotion impressions', function(done) {
            var event = {
                EventName: 'eCommerce - PromotionView',
                EventCategory: mParticle.CommerceEventType.PromotionView,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                DeviceId: '1234567890',
                MPID: '8675309',
                PromotionAction: {
                    PromotionActionType: mParticle.PromotionType.PromotionView,
                    PromotionList: [
                        {
                            Id: 'FREE_SHIPPING',
                            Creative: 'skyscraper',
                            Name: 'Free Shipping Promo',
                            Position: 'slot2'
                        }
                    ]
                }
            };

            var expectedEvent = {
                event: 'eCommerce - PromotionView',
                ecommerce: {
                    promoView: {
                        promotions: [
                            {
                                id: 'FREE_SHIPPING',
                                creative: 'skyscraper',
                                name: 'Free Shipping Promo',
                                position: 'slot2'
                            }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - PromotionView',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };

            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger promotion clicks', function(done) {
            var event = {
                EventName: 'eCommerce - PromotionClick',
                EventCategory: mParticle.CommerceEventType.PromotionClick,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                Store: {},
                EventAttributes: null,
                DeviceId: '1234567890',
                MPID: '8675309',
                ConsentState: null,
                PromotionAction: {
                    PromotionActionType: mParticle.PromotionType.PromotionClick,
                    PromotionList: [
                        {
                            Id: 'FREE_SHIPPING',
                            Creative: 'skyscraper',
                            Name: 'Free Shipping Promo',
                            Position: 'slot2'
                        }
                    ]
                }
            };

            var expectedEvent = {
                event: 'eCommerce - PromotionClick',
                ecommerce: {
                    promoClick: {
                        promotions: [
                            {
                                id: 'FREE_SHIPPING',
                                creative: 'skyscraper',
                                name: 'Free Shipping Promo',
                                position: 'slot2'
                            }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - PromotionClick',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };
            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger checkout with steps', function(done) {
            var event = {
                EventName: 'eCommerce - Checkout',
                EventCategory: mParticle.CommerceEventType.ProductCheckout,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                DeviceId: '1234567890',
                MPID: '8675309',
                ConsentState: null,
                CurrencyCode: null,
                ProductAction: {
                    ProductActionType: 3,
                    CheckoutStep: 13,
                    ProductList: [
                        {
                            Name: 'Headphones',
                            Sku: '44556',
                            Price: '12.23',
                            Quantity: 1,
                            TotalAmount: 12.23,
                            Attributes: null
                        },
                        {
                            Name: 'Pizza',
                            Sku: '809808',
                            Price: '23.00',
                            Quantity: 1,
                            TotalAmount: 23,
                            Attributes: null
                        },
                        {
                            Name: 'Clash Vinyl',
                            Sku: '00202001',
                            Price: '12.99',
                            Quantity: 1,
                            TotalAmount: 12.99,
                            Attributes: null
                        },
                        {
                            Name: 'Drums',
                            Sku: '0202200202',
                            Price: '320.12',
                            Quantity: 1,
                            TotalAmount: 320.12,
                            Attributes: null
                        },
                        {
                            Name: 'Bass',
                            Sku: '100100101',
                            Price: '1204.02',
                            Quantity: 1,
                            TotalAmount: 1204.02,
                            Attributes: null
                        },
                        {
                            Name: 'Spaceboy Action Figure',
                            Sku: '1',
                            Price: '111.11',
                            Quantity: 1,
                            TotalAmount: 111.11,
                            Attributes: null
                        }
                    ]
                }
            };
            var expectedEvent = {
                event: 'eCommerce - Checkout',
                ecommerce: {
                    checkout: {
                        actionField: {
                            step: 13
                        },
                        products: [
                            {
                                name: 'Headphones',
                                id: '44556',
                                price: '12.23'
                            },
                            {
                                name: 'Pizza',
                                id: '809808',
                                price: '23.00'
                            },
                            {
                                name: 'Clash Vinyl',
                                id: '00202001',
                                price: '12.99'
                            },
                            {
                                name: 'Drums',
                                id: '0202200202',
                                price: '320.12'
                            },
                            {
                                name: 'Bass',
                                id: '100100101',
                                price: '1204.02'
                            },
                            {
                                name: 'Spaceboy Action Figure',
                                id: '1',
                                price: '111.11'
                            }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - Checkout',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };
            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger checkout with options', function (done) {
            var event = {
                EventName: 'eCommerce - CheckoutOption',
                EventCategory: mParticle.CommerceEventType.ProductCheckoutOption,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                DeviceId: '1234567890',
                MPID: '8675309',
                ConsentState: null,
                CurrencyCode: null,
                ProductAction: {
                    ProductActionType: 4,
                    CheckoutStep: 42,
                    CheckoutOptions: 'salmon mousse',
                    ProductList: [
                        {
                            Name: 'Headphones',
                            Sku: '44556',
                            Price: '12.23',
                            Quantity: 1,
                            TotalAmount: 12.23,
                            Attributes: null
                        },
                        {
                            Name: 'Pizza',
                            Sku: '809808',
                            Price: '23.00',
                            Quantity: 1,
                            TotalAmount: 23,
                            Attributes: null
                        },
                        {
                            Name: 'Clash Vinyl',
                            Sku: '00202001',
                            Price: '12.99',
                            Quantity: 1,
                            TotalAmount: 12.99,
                            Attributes: null
                        },
                        {
                            Name: 'Drums',
                            Sku: '0202200202',
                            Price: '320.12',
                            Quantity: 1,
                            TotalAmount: 320.12,
                            Attributes: null
                        },
                        {
                            Name: 'Bass',
                            Sku: '100100101',
                            Price: '1204.02',
                            Quantity: 1,
                            TotalAmount: 1204.02,
                            Attributes: null
                        },
                        {
                            Name: 'Spaceboy Action Figure',
                            Sku: '1',
                            Price: '111.11',
                            Quantity: 1,
                            TotalAmount: 111.11,
                            Attributes: null
                        }
                    ]
                }
            };
            var expectedEvent = {
                event: 'eCommerce - CheckoutOption',
                ecommerce: {
                    checkout_option: {
                        actionField: {
                            step: 42,
                            option: 'salmon mousse'
                        },
                        products: [
                            {
                                name: 'Headphones',
                                id: '44556',
                                price: '12.23'
                            },
                            {
                                name: 'Pizza',
                                id: '809808',
                                price: '23.00'
                            },
                            {
                                name: 'Clash Vinyl',
                                id: '00202001',
                                price: '12.99'
                            },
                            {
                                name: 'Drums',
                                id: '0202200202',
                                price: '320.12'
                            },
                            {
                                name: 'Bass',
                                id: '100100101',
                                price: '1204.02'
                            },
                            {
                                name: 'Spaceboy Action Figure',
                                id: '1',
                                price: '111.11'
                            }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - CheckoutOption',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };

            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger purchases', function(done) {
            var event = {
                EventName: 'eCommerce - Purchase',
                EventCategory: mParticle.CommerceEventType.ProductPurchase,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                EventAttributes: null,
                DeviceId: '1234567890',
                MPID: '8675309',
                ConsentState: null,
                CurrencyCode: null,
                ProductAction: {
                    ProductActionType: 7,
                    ProductList: [
                        {
                            Name: 'Headphones',
                            Sku: '44556',
                            Price: '12.23',
                            Quantity: 1,
                            TotalAmount: 12.23,
                            Attributes: null
                        },
                        {
                            Name: 'Pizza',
                            Sku: '809808',
                            Price: '23.00',
                            Quantity: 1,
                            TotalAmount: 23,
                            Attributes: null
                        },
                        {
                            Name: 'Clash',
                            Sku: '00202001',
                            Price: '12.99',
                            Quantity: 1,
                            TotalAmount: 12.99,
                            Attributes: null
                        },
                        {
                            Name: 'Drums',
                            Sku: '200202',
                            Price: '320.12',
                            Quantity: 1,
                            TotalAmount: 320.12,
                            Attributes: null
                        },
                        {
                            Name: 'Bass',
                            Sku: '100100101',
                            Price: '1204.02',
                            Quantity: 1,
                            TotalAmount: 1204.02,
                            Attributes: null
                        },
                        {
                            Name: 'Spaceboy',
                            Sku: '1',
                            Price: '111.11',
                            Quantity: 1,
                            TotalAmount: 111.11,
                            Attributes: null
                        }
                    ],
                    TransactionId: 'T12345',
                    Affiliation: 'Online Store',
                    CouponCode: 'SUMMER_SALE',
                    TotalAmount: '35.43',
                    ShippingAmount: '5.99',
                    TaxAmount: '4.90'
                }
            };
            var expectedEvent = {
                event: 'eCommerce - Purchase',
                ecommerce: {
                    purchase: {
                        actionField: {
                            id: 'T12345',
                            affiliation: 'Online Store',
                            revenue: '35.43',
                            tax: '4.90',
                            shipping: '5.99',
                            coupon: 'SUMMER_SALE'
                        },
                        products: [
                            { name: 'Headphones', id: '44556', price: '12.23' },
                            { name: 'Pizza', id: '809808', price: '23.00' },
                            { name: 'Clash', id: '00202001', price: '12.99' },
                            { name: 'Drums', id: '200202', price: '320.12' },
                            { name: 'Bass', id: '100100101', price: '1204.02' },
                            { name: 'Spaceboy', id: '1', price: '111.11' }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - Purchase',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };
            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger full refunds', function(done) {
            var event = {
                EventName: 'eCommerce - Refund',
                EventCategory: mParticle.CommerceEventType.ProductRefund,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                EventAttributes: null,
                DeviceId: '1234567890',
                MPID: '8675309',
                ConsentState: null,
                CurrencyCode: null,
                ProductAction: {
                    ProductActionType: 8,
                    ProductList: [],
                    TransactionId: 'T12345'
                }
            };
            var expectedEvent = {
                event: 'eCommerce - Refund',
                ecommerce: {
                    refund: { actionField: { id: 'T12345' }, products: [] }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - Refund',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };
            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger partial refunds', function(done) {
            var event = {
                EventName: 'eCommerce - Refund',
                EventCategory: mParticle.CommerceEventType.ProductRefund,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                EventAttributes: null,
                DeviceId: '1234567890',
                MPID: '8675309',
                ConsentState: null,
                CurrencyCode: null,
                ProductAction: {
                    ProductActionType: 8,
                    ProductList: [
                        {
                            Name: 'Headphones',
                            Sku: '44556',
                            Price: '12.23',
                            Quantity: 1,
                            TotalAmount: 12.23,
                            Attributes: null
                        },
                        {
                            Name: 'Pizza',
                            Sku: '809808',
                            Price: '23.00',
                            Quantity: 1,
                            TotalAmount: 23,
                            Attributes: null
                        },
                        {
                            Name: 'Clash Vinyl',
                            Sku: '00202001',
                            Price: '12.99',
                            Quantity: 1,
                            TotalAmount: 12.99,
                            Attributes: null
                        }
                    ],
                    TransactionId: 'T12345'
                }
            };
            var expectedEvent = {
                event: 'eCommerce - Refund',
                ecommerce: {
                    refund: {
                        actionField: { id: 'T12345' },
                        products: [
                            { name: 'Headphones', id: '44556', price: '12.23' },
                            { name: 'Pizza', id: '809808', price: '23.00' },
                            {
                                name: 'Clash Vinyl',
                                id: '00202001',
                                price: '12.99'
                            }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - Refund',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };

            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
    });
    describe('Consent', function () {
        var consentMap = [
            {
                jsmap: null,
                map: 'Some_consent',
                maptype: 'ConsentPurposes',
                value: 'ad_user_data',
            },
            {
                jsmap: null,
                map: 'Storage_consent',
                maptype: 'ConsentPurposes',
                value: 'analytics_storage',
            },
            {
                jsmap: null,
                map: 'Other_test_consent',
                maptype: 'ConsentPurposes',
                value: 'ad_storage',
            },
            {
                jsmap: null,
                map: 'Test_consent',
                maptype: 'ConsentPurposes',
                value: 'ad_personalization',
            },
        ];

        beforeEach(function() {
            mParticle.forwarders = [];
        });

        afterEach(function() {});

        it('should consolidate consent information', function(done) {
            mParticle.forwarder.init(
                {
                    dataLayerName: 'mparticle_data_layer',
                    containerId: 'GTM-123123',
                },
                reportService.cb,
                true
            );

            var event = {
                EventName: 'Test User Action',
                EventDataType: MessageTypes.PageEvent,
                UserAttributes: {},
                UserIdentities: [],
                EventAttributes: null,
                DeviceId: '1234567890',
                MPID: '8675309',
                ConsentState: {
                    getGDPRConsentState: function() {
                        return {
                            some_consent: {
                                Consented: true,
                                Timestamp: 1557935884509,
                                ConsentDocument: 'fake_consent_document',
                                Location: 'This is fake',
                                HardwareId: '123456',
                            },
                        };
                    },
                },
            };
            var expectedEvent = {
                event: 'Test User Action',
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'Test User Action',
                        attributes: {},
                    },
                    user: {
                        mpid: '8675309',
                        attributes: {},
                        identities: [],
                        consent_state: {
                            gdpr: {
                                some_consent: {
                                    Consented: true,
                                    Timestamp: 1557935884509,
                                    ConsentDocument: 'fake_consent_document',
                                    Location: 'This is fake',
                                    HardwareId: '123456',
                                },
                            },
                        },
                    },
                },
            };

            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });

        it('should construct a Default Consent State Payload from Mappings', function(done) {
            mParticle.forwarder.init(
                {
                    dataLayerName: 'mparticle_data_layer',
                    containerId: 'GTM-123123',
                    consentMappingWeb:
                        '[{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Some_consent&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;ad_user_data&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Storage_consent&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;analytics_storage&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Other_test_consent&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;ad_storage&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Test_consent&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;ad_personalization&quot;}]',
                },
                reportService.cb,
                true
            );

            var expectedDataLayer = [
                'consent',
                'default',
                {
                    ad_user_data: 'denied',
                    ad_personalization: 'denied',
                },
            ];

            mockDataLayer.length.should.eql(1);
            mockDataLayer[0][0].should.equal('consent');
            mockDataLayer[0][1].should.equal('default');
            mockDataLayer[0][2].should.deepEqual(expectedDataLayer[2]);
            done();
        });

        it('should construct a Default Consent State Payload from Default Settings and construct an Update Consent State Payload from Mappings', (done) => {
            mParticle.forwarder.init(
                {
                    dataLayerName: 'mparticle_data_layer',
                    containerId: 'GTM-123123',
                    consentMappingWeb: JSON.stringify(consentMap),
                    defaultAdUserDataConsentWeb: 'Granted', // Will be overriden by User Consent State
                    defaultAdPersonalizationConsentWeb: 'Granted', // Will be overriden by User Consent State
                    defaultAdStorageConsentWeb: 'Granted',
                    defaultAnalyticsStorageConsentWeb: 'Granted',
                },
                reportService.cb,
                true
            );

            // default consent payload from Default Settings sent first
            var expectedDataLayer1 = [
                'consent',
                'default',
                {
                    ad_personalization: 'granted', // From Consent Settings
                    ad_user_data: 'granted', // From Consent Settings
                    ad_storage: 'granted', // From Consent Settings
                    analytics_storage: 'granted', // From Consent Settings
                },
            ];

            // updated consent payload from mappings sent after
            var expectedDataLayer2 = [
                'consent',
                'update',
                {
                    ad_personalization: 'denied', // From User Consent State
                    ad_user_data: 'denied', // From User Consent State
                    ad_storage: 'granted', // From Consent Settings
                    analytics_storage: 'granted', // From Consent Settings
                },
            ];

            mockDataLayer.length.should.eql(2);
            mockDataLayer[0][0].should.equal('consent');
            mockDataLayer[0][1].should.equal('default');
            mockDataLayer[0][2].should.deepEqual(expectedDataLayer1[2]);
            mockDataLayer[1][0].should.equal('consent');
            mockDataLayer[1][1].should.equal('update');
            mockDataLayer[1][2].should.deepEqual(expectedDataLayer2[2]);

            done();
        });

        it('should ignore Unspecified Consent Settings if NOT explicitly defined in Consent State', (done) => {
            mParticle.forwarder.init(
                {
                    dataLayerName: 'mparticle_data_layer',
                    containerId: 'GTM-123123',
                    consentMappingWeb: JSON.stringify(consentMap),
                    defaultAdUserDataConsentWeb: 'Unspecified',
                    defaultAdPersonalizationConsentWeb: 'Unspecified', // Will be overriden by User Consent State
                    defaultAdStorageConsentWeb: 'Unspecified', // Will be overriden by User Consent State
                    defaultAnalyticsStorageConsentWeb: 'Unspecified',
                },
                reportService.cb,
                true
            );

            var expectedDataLayer = [
                'consent',
                'default',
                {
                    ad_personalization: 'denied', // From User Consent State
                    ad_user_data: 'denied', // From User Consent State
                },
            ];

            mockDataLayer.length.should.eql(1);
            mockDataLayer[0][0].should.equal('consent');
            mockDataLayer[0][1].should.equal('default');
            mockDataLayer[0][2].should.deepEqual(expectedDataLayer[2]);

            done();
        });

        it('should construct a Consent State Update Payload when consent changes', (done) => {
            mParticle.forwarder.init(
                {
                    dataLayerName: 'mparticle_data_layer',
                    containerId: 'GTM-123123',
                    consentMappingWeb: JSON.stringify(consentMap),
                },
                reportService.cb,
                true
            );

            var expectedDataLayerBefore = [
                'consent',
                'update',
                {
                    ad_user_data: 'denied',
                    ad_personalization: 'denied',
                },
            ];

            mockDataLayer.length.should.eql(1);
            mockDataLayer[0][0].should.equal('consent');
            mockDataLayer[0][1].should.equal('default');
            mockDataLayer[0][2].should.deepEqual(expectedDataLayerBefore[2]);

            mParticle.forwarder.process({
                EventName: 'Test Event 1',
                EventDataType: MessageTypes.PageEvent,
                EventCategory: mParticle.EventType.Unknown,
                ConsentState: {
                    getGDPRConsentState: function () {
                        return {
                            some_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                            ignored_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'ignored_consent',
                            },
                            test_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'test_consent',
                            },
                        };
                    },

                    getCCPAConsentState: function () {
                        return {
                            data_sale_opt_out: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                        };
                    },
                },
            });

            var expectedDataLayerAfter = [
                'consent',
                'update',
                {
                    ad_user_data: 'granted',
                    ad_personalization: 'granted',
                },
            ];

            // Data layer have 3 elements:
            // Consent Defaults at index 0
            // Consent Update at index 1
            // Test Event 1 at index 2
            mockDataLayer.length.should.eql(3);
            mockDataLayer[1][0].should.equal('consent');
            mockDataLayer[1][1].should.equal('update');
            mockDataLayer[1][2].should.deepEqual(expectedDataLayerAfter[2]);

            mockDataLayer[2].should.have.property('event');

            mParticle.forwarder.process({
                EventName: 'Test Event 2',
                EventDataType: MessageTypes.PageEvent,
                EventCategory: mParticle.EventType.Unknown,
                ConsentState: {
                    getGDPRConsentState: function () {
                        return {
                            some_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                            ignored_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'ignored_consent',
                            },
                            test_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'test_consent',
                            },
                            other_test_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'other_test_consent',
                            },
                            storage_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'storage_consent',
                            },
                        };
                    },

                    getCCPAConsentState: function () {
                        return {
                            data_sale_opt_out: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'data_sale_opt_out',
                            },
                        };
                    },
                },
            });

            var expectedDataLayerFinal = [
                'consent',
                'update',
                {
                    ad_personalization: 'granted',
                    ad_storage: 'granted',
                    ad_user_data: 'granted',
                    analytics_storage: 'denied',
                },
            ];

            // Data layer have 5 elements:
            // Consent Defaults at index 0
            // Consent Update at index 1
            // Test Event 1 at index 2
            // Consent Update at index 3
            // Test Event 2 at index 4
            mockDataLayer.length.should.eql(5);
            mockDataLayer[3][0].should.equal('consent');
            mockDataLayer[3][1].should.equal('update');
            mockDataLayer[3][2].should.deepEqual(expectedDataLayerFinal[2]);

            mockDataLayer[4].should.have.property('event');

            done();
        });

        it('should construct a Consent State Update Payload with Consent Setting Defaults when consent changes', (done) => {
            mParticle.forwarder.init(
                {
                    dataLayerName: 'mparticle_data_layer',
                    containerId: 'GTM-123123',
                    consentMappingWeb: JSON.stringify(consentMap),
                    defaultAdUserDataConsentWeb: 'Granted', // Will be overriden by User Consent State
                    defaultAdPersonalizationConsentWeb: 'Granted', // Will be overriden by User Consent State
                    defaultAdStorageConsentWeb: 'Granted',
                    defaultAnalyticsStorageConsentWeb: 'Granted',
                },
                reportService.cb,
                true
            );

            // default consent payload from Default Settings sent first
            var expectedDataLayerBefore1 = [
                'consent',
                'update',
                {
                    ad_personalization: 'granted', // From Consent Settings
                    ad_user_data: 'granted', // From Consent Settings
                    ad_storage: 'granted', // From Consent Settings
                    analytics_storage: 'granted', // From Consent Settings
                },
            ];

            // updated consent payload from mappings sent after
            var expectedDataLayerBefore2 = [
                'consent',
                'update',
                {
                    ad_personalization: 'denied', // From User Consent State
                    ad_user_data: 'denied', // From User Consent State
                    ad_storage: 'granted', // From Consent Settings
                    analytics_storage: 'granted', // From Consent Settings
                },
            ];

            mockDataLayer.length.should.eql(2);
            mockDataLayer[0][0].should.equal('consent');
            mockDataLayer[0][1].should.equal('default');
            mockDataLayer[0][2].should.deepEqual(expectedDataLayerBefore1[2]);
            mockDataLayer[1][0].should.equal('consent');
            mockDataLayer[1][1].should.equal('update');
            mockDataLayer[1][2].should.deepEqual(expectedDataLayerBefore2[2]);

            mParticle.forwarder.process({
                EventName: 'Test Event 1',
                EventDataType: MessageTypes.PageEvent,
                EventCategory: mParticle.EventType.Unknown,
                EventAttributes: {},
                ConsentState: {
                    getGDPRConsentState: function () {
                        return {
                            some_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                            ignored_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'ignored_consent',
                            },
                            test_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'test_consent',
                            },
                        };
                    },

                    getCCPAConsentState: function () {
                        return {
                            data_sale_opt_out: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'data_sale_opt_out',
                            },
                        };
                    },
                },
            });

            var expectedDataLayerAfter = [
                'consent',
                'update',
                {
                    ad_personalization: 'granted', // From Event Consent State Change
                    ad_user_data: 'granted', // From Event Consent State Change
                    ad_storage: 'granted', // From Consent Settings
                    analytics_storage: 'granted', // From Consent Settings
                },
            ];

            // Data layer should have 3 elements:
            // Consent Defaults at index 0
            // Consent Update at index 1
            // Test Event 1 at index 2
            mockDataLayer.length.should.eql(4);
            mockDataLayer[2][0].should.equal('consent');
            mockDataLayer[2][1].should.equal('update');
            mockDataLayer[2][2].should.deepEqual(expectedDataLayerAfter[2]);

            mockDataLayer[3].should.have.property('event');

            mParticle.forwarder.process({
                EventName: 'Test Event',
                EventDataType: MessageTypes.PageEvent,
                EventCategory: mParticle.EventType.Unknown,
                ConsentState: {
                    getGDPRConsentState: function () {
                        return {
                            some_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                            ignored_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'ignored_consent',
                            },
                            test_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'test_consent',
                            },
                            other_test_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'other_test_consent',
                            },
                            storage_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'storage_consent',
                            },
                        };
                    },

                    getCCPAConsentState: function () {
                        return {
                            data_sale_opt_out: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'data_sale_opt_out',
                            },
                        };
                    },
                },
            });

            var expectedDataLayerFinal = [
                'consent',
                'update',
                {
                    ad_personalization: 'granted', // From Previous Event State Change
                    ad_storage: 'granted', // From Previous Event State Change
                    ad_user_data: 'granted', // From Consent Settings
                    analytics_storage: 'denied', // From FinalEvent Consent State Change
                },
            ];

            // Data layer should have 3 elements:
            // Consent Defaults at index 0
            // Consent Update at index 1
            // Test Event 1 at index 2
            // Consent Update at index 3
            // Test Event 2 at index 4
            mockDataLayer.length.should.eql(6);
            mockDataLayer[4][0].should.equal('consent');
            mockDataLayer[4][1].should.equal('update');
            mockDataLayer[4][2].should.deepEqual(expectedDataLayerFinal[2]);

            mockDataLayer[5].should.have.property('event');

            done();
        });

        it('should NOT construct a Consent State Update Payload if consent DOES NOT change', (done) => {
            mParticle.forwarder.init(
                {
                    dataLayerName: 'mparticle_data_layer',
                    containerId: 'GTM-123123',
                    consentMappingWeb: JSON.stringify(consentMap),
                },
                reportService.cb,
                true
            );

            var expectedDataLayerBefore = [
                'consent',
                'update',
                {
                    ad_user_data: 'denied',
                    ad_personalization: 'denied',
                },
            ];

            mockDataLayer.length.should.eql(1);
            mockDataLayer[0][0].should.equal('consent');
            mockDataLayer[0][1].should.equal('default');
            mockDataLayer[0][2].should.deepEqual(expectedDataLayerBefore[2]);

            mParticle.forwarder.process({
                EventName: 'Test Event 1',
                EventDataType: MessageTypes.PageEvent,
                EventCategory: mParticle.EventType.Unknown,
                ConsentState: {
                    getGDPRConsentState: function () {
                        return {
                            some_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                            test_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'test_consent',
                            },
                        };
                    },
                },
            });

            // dataLayer should have 2 elements:
            // Consent Defaults at index 0
            // Test Event 1 at index 1
            mockDataLayer.length.should.eql(2);
            mockDataLayer[0][0].should.equal('consent');
            mockDataLayer[0][1].should.equal('default');
            mockDataLayer[0][2].should.deepEqual(expectedDataLayerBefore[2]);

            mockDataLayer[1].should.have.property('event');

            done();
        });

        it('should NOT construct any Consent State Payload if consent mappings and settings are undefined', (done) => {
            mParticle.forwarder.init(
                {
                    dataLayerName: 'mparticle_data_layer',
                    containerId: 'GTM-123123',
                },
                reportService.cb,
                true
            );

            mockDataLayer.length.should.eql(0);

            mParticle.forwarder.process({
                EventName: 'Test Event 1',
                EventDataType: MessageTypes.PageEvent,
                EventCategory: mParticle.EventType.Unknown,
                ConsentState: {
                    getGDPRConsentState: function () {
                        return {
                            some_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                            ignored_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'ignored_consent',
                            },
                            test_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'test_consent',
                            },
                            other_test_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'other_test_consent',
                            },
                            storage_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'storage_consent',
                            },
                        };
                    },

                    getCCPAConsentState: function () {
                        return {
                            data_sale_opt_out: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'data_sale_opt_out',
                            },
                        };
                    },
                },
            });

            // dataLayer should have 1 element:
            // Test Event 1 at index 0
            mockDataLayer.length.should.eql(1);
            mockDataLayer[0].should.have.property('event');

            done();
        });

        it('should construct Consent State Payloads if consent mappings is undefined but settings defaults are defined', (done) => {
            mParticle.forwarder.init(
                {
                    dataLayerName: 'mparticle_data_layer',
                    containerId: 'GTM-123123',
                    defaultAdUserDataConsentWeb: 'Granted',
                    defaultAdPersonalizationConsentWeb: 'Denied',
                    defaultAdStorageConsentWeb: 'Granted',
                    defaultAnalyticsStorageConsentWeb: 'Denied',
                },
                reportService.cb,
                true
            );

            var expectedDataLayerBefore = [
                'consent',
                'default',
                {
                    ad_user_data: 'granted',
                    ad_personalization: 'denied',
                    ad_storage: 'granted',
                    analytics_storage: 'denied',
                },
            ];

            mockDataLayer.length.should.eql(1);
            mockDataLayer[0][0].should.equal('consent');
            mockDataLayer[0][1].should.equal('default');
            mockDataLayer[0][2].should.deepEqual(expectedDataLayerBefore[2]);

            mParticle.forwarder.process({
                EventName: 'Test Event 1',
                EventDataType: MessageTypes.PageEvent,
                EventCategory: mParticle.EventType.Unknown,
                ConsentState: {
                    getGDPRConsentState: function () {
                        return {
                            some_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                            ignored_consent: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'ignored_consent',
                            },
                            test_consent: {
                                Consented: true,
                                Timestamp: Date.now(),
                                Document: 'test_consent',
                            },
                        };
                    },

                    getCCPAConsentState: function () {
                        return {
                            data_sale_opt_out: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'data_sale_opt_out',
                            },
                        };
                    },
                },
            });

            // dataLayer should have 2 elements:
            // Consent Defaults at index 0
            // Test Event 1 at index 1
            mockDataLayer.length.should.eql(2);
            mockDataLayer[0][0].should.equal('consent');
            mockDataLayer[0][1].should.equal('default');
            mockDataLayer[0][2].should.deepEqual(expectedDataLayerBefore[2]);

            mockDataLayer[1].should.have.property('event');

            done();
        });
    });
});
