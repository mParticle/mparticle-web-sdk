/* eslint-disable no-undef */

describe('Appboy Forwarder', function () {
    var expandCommerceEvent = function (event) {
            var eventAttributes = {};
            if (event.ProductAction && event.ProductAction.TransactionId) {
                eventAttributes['Transaction Id'] =
                    event.ProductAction.TransactionId;
            }
            return [
                {
                    EventName: 'Test EXPANDED Event',
                    EventDataType: MessageType.PageEvent,
                    EventAttributes: eventAttributes,
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
        },
        MockDisplay = function() {
            var self = this;
        },
        MockAppboyUser = function() {
            var self = this;

            this.lastName = null;
            this.firstName = null;
            this.emailSet = null;
            this.genderSet = null;
            this.countrySet = null;
            this.homeCity = null;
            this.emailSubscribe = false;
            this.pushSubscribe = false;
            this.phoneSet = null;
            this.imageUrl = null;
            this.yearOfBirth = null;
            this.monthOfBirth = null;
            this.dayOfBirth = null;
            this.customAttribute = null;
            this.customAttributeValue = null;

            this.customAttributeSet = false;

            this.setLastName = function(name) {
                self.lastName = name;
            };

            this.setFirstName = function(name) {
                self.firstName = name;
            };

            this.setEmail = function(email) {
                self.emailSet = email;
            };

            this.setGender = function(gender) {
                self.genderSet = gender;
            };

            this.setCountry = function(country) {
                self.countrySet = country;
            };

            this.setHomeCity = function(homeCity) {
                self.homeCity = homeCity;
            };

            this.setEmailNotificationSubscriptionType = function(
                subscriptionType
            ) {
                self.emailSubscribe = subscriptionType;
            };

            this.setPushNotificationSubscriptionType = function(
                subscriptionType
            ) {
                self.pushSubscribe = subscriptionType;
            };

            this.setPhoneNumber = function(number) {
                self.phoneSet = number;
            };

            this.setAvatarImageUrl = function(url) {
                self.imageUrl = url;
            };

            this.setDateOfBirth = function(year, month, day) {
                self.yearOfBirth = year;
                self.monthOfBirth = month;
                self.dayOfBirth = day;
            };

            this.setCustomUserAttribute = function(key, value) {
                self.customAttributeSet = true;
                self.customAttribute = key;
                self.customAttributeValue = !value ? '' : value;
            };
        },
        MockAppboy = function() {
            var self = this;

            this.logCustomEventCalled = false;
            this.logPurchaseEventCalled = false;
            this.initializeCalled = false;
            this.openSessionCalled = false;
            this.inAppMessageRefreshCalled = false;
            this.subscribeToNewInAppMessagesCalled = false;

            this.logCustomEventName = null;
            this.logPurchaseName = null;
            this.apiKey = null;
            this.baseUrl = null;
            this.userId = null;
            this.doNotLoadFontAwesome = null;
            this.metadata = null;
            this.subscribeToInAppMessageCalled = false;
            this.eventProperties = [];
            this.purchaseEventProperties = [];

            this.user = new MockAppboyUser();
            this.display = new MockDisplay();
            this.addSdkMetadata = function(metadata) {
                self.metadata = metadata;
            };

            this.subscribeToInAppMessage = function() {
                self.subscribeToInAppMessageCalled = true;
            };

            this.initialize = function(apiKey, options) {
                self.options = options;
                self.initializeCalled = true;
                self.apiKey = apiKey;
                self.baseUrl = options.baseUrl || null;
                self.doNotLoadFontAwesome = options.doNotLoadFontAwesome;
                return true;
            };

            this.openSession = function(func) {
                self.openSessionCalled = true;
            };

            this.changeUser = function(id) {
                self.userId = id;
            };

            this.subscribeToNewInAppMessages = function() {
                self.subscribeToNewInAppMessagesCalled = true;
            };

            this.getUser = function() {
                return self.user;
            };

            this.logCustomEvent = function(name, eventProperties) {
                self.logCustomEventCalled = true;
                self.logCustomEventName = name;
                self.eventProperties.push(eventProperties);

                // Return true to indicate event should be reported
                return true;
            };

            this.logPurchase = function(
                sku,
                price,
                currencyType,
                quantity,
                attributes
            ) {
                self.logPurchaseName = sku;
                self.logPurchaseEventCalled = true;
                self.purchaseEventProperties.push([
                    sku,
                    price,
                    quantity,
                    attributes,
                ]);

                // Return true to indicate event should be reported
                return true;
            };
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
                self.id = null;
                self.event = null;
            };
        },
        reportService = new ReportingService();

    before(function() {
        mParticle.EventType = EventType;
        mParticle.IdentityType = IdentityType;
        mParticle.MessageType = MessageType;
        mParticle.CommerceEventType = CommerceEventType;
        mParticle.eCommerce = {};
        mParticle.eCommerce.expandCommerceEvent = expandCommerceEvent;
    });

    beforeEach(function() {
        reportService.reset();
        window.appboy = new MockAppboy();

        mParticle.forwarder.init(
            {
                apiKey: '123456',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'testUser',
                    Type: IdentityType.CustomerId,
                },
            ],
            '1.1',
            'My App'
        );
    });

    it('should initialize with apiKey and mp metadata', function() {
        window.appboy.should.have.property('apiKey', '123456');
        window.appboy.should.have.property('metadata', ['mp']);
    });

    it('should open a new session and refresh in app messages upon initialization', function() {
        window.appboy.should.have.property('initializeCalled', true);
        window.appboy.should.have.property('openSessionCalled', true);
        window.appboy.should.have.property(
            'subscribeToInAppMessageCalled',
            true
        );
    });

    it('should log event', function() {
        mParticle.forwarder.process({
            EventName: 'Test Event',
            EventDataType: MessageType.PageEvent,
        });
        window.appboy.should.have.property('logCustomEventCalled', true);
        window.appboy.should.have.property('logCustomEventName', 'Test Event');

        reportService.event.should.have.property('EventName', 'Test Event');
    });

    it('should log an event with properties', function() {
        mParticle.forwarder.process({
            EventName: 'Test Event with attributes',
            EventDataType: MessageType.PageEvent,
            EventAttributes: {
                dog: 'rex',
            },
        });
        window.appboy.should.have.property('logCustomEventCalled', true);
        window.appboy.should.have.property(
            'logCustomEventName',
            'Test Event with attributes'
        );
        window.appboy.eventProperties.should.have.lengthOf(1);
        window.appboy.eventProperties[0]['dog'].should.equal('rex');
    });

    it('should sanitize event names and property keys/values', function() {
        mParticle.forwarder.process({
            EventName: '$$$$Test Event with attributes$',
            EventDataType: MessageType.PageEvent,
            EventAttributes: {
                $dog: '$$rex$',
            },
        });
        window.appboy.should.have.property('logCustomEventCalled', true);
        window.appboy.should.have.property(
            'logCustomEventName',
            'Test Event with attributes$'
        );
        window.appboy.eventProperties.should.have.lengthOf(1);
        window.appboy.eventProperties[0]['dog'].should.equal('rex$');
    });

    it('should not set if properties are invalid', function() {
        mParticle.forwarder.process({
            EventName: '$$$$Test Event with attributes$',
            EventDataType: MessageType.PageEvent,
            EventAttributes: 5,
        });
        window.appboy.should.have.property('logCustomEventCalled', false);
    });

    it('should log a purchase event', function() {
        mParticle.forwarder.process({
            EventName: 'Test Purchase Event',
            EventDataType: MessageType.Commerce,
            EventCategory: EventType.ProductPurchase,
            CurrencyCode: 'USD',
            ProductAction: {
                TransactionId: 1234,
                TotalAmount: 50,
                ProductList: [
                    {
                        Price: '50',
                        Name: 'Product Name',
                        TotalAmount: 50,
                        Quantity: 1,
                        Attributes: { attribute: 'whatever' },
                        Sku: 12345,
                    },
                ],
            },
        });
        window.appboy.should.have.property('logPurchaseEventCalled', true);
        window.appboy.should.have.property('logPurchaseName', 'Product Name');
        window.appboy.purchaseEventProperties.should.have.lengthOf(1);
        window.appboy.purchaseEventProperties[0][0].should.equal(
            'Product Name'
        );
        window.appboy.purchaseEventProperties[0][1].should.equal(50);
        window.appboy.purchaseEventProperties[0][2].should.equal(1);
        window.appboy.purchaseEventProperties[0][3]['attribute'].should.equal(
            'whatever'
        );
        window.appboy.purchaseEventProperties[0][3]['Sku'].should.equal(12345);
        reportService.event.should.have.property(
            'EventName',
            'Test Purchase Event'
        );
    });

    it('should log a purchase event with a transaction id', function () {
        mParticle.forwarder.process({
            EventName: 'Test Purchase Event',
            EventDataType: MessageType.Commerce,
            EventCategory: EventType.ProductPurchase,
            CurrencyCode: 'USD',
            ProductAction: {
                TransactionId: 'foo-purchase-transaction-id',
                TotalAmount: 50,
                ProductList: [
                    {
                        Price: '50',
                        Name: 'Product Name',
                        TotalAmount: 50,
                        Quantity: 1,
                        Attributes: { attribute: 'whatever' },
                        Sku: 12345,
                    },
                ],
            },
        });
        window.appboy.should.have.property('logPurchaseEventCalled', true);
        window.appboy.should.have.property('logPurchaseName', 'Product Name');
        window.appboy.purchaseEventProperties.should.have.lengthOf(1);
        window.appboy.purchaseEventProperties[0][0].should.equal(
            'Product Name'
        );
        window.appboy.purchaseEventProperties[0][1].should.equal(50);
        window.appboy.purchaseEventProperties[0][2].should.equal(1);
        window.appboy.purchaseEventProperties[0][3]['attribute'].should.equal(
            'whatever'
        );
        window.appboy.purchaseEventProperties[0][3]['Sku'].should.equal(12345);
        window.appboy.purchaseEventProperties[0][3][
            'Transaction Id'
        ].should.equal('foo-purchase-transaction-id');
        reportService.event.should.have.property(
            'EventName',
            'Test Purchase Event'
        );
    });

    it('should log a non-purchase commerce event with a transaction id', function () {
        mParticle.forwarder.process({
            EventName: 'Test Add To Cart',
            EventDataType: MessageType.Commerce,
            EventCategory: CommerceEventType.ProductAddToCart, // 10
            CurrencyCode: 'USD',
            ProductAction: {
                ProductActionType: EventType.AddToCart, // 1
                TransactionId: 'foo-add-to-cart-transaction-id',
                TotalAmount: 50,
                ProductList: [
                    {
                        Price: '50',
                        Name: 'Product Name',
                        TotalAmount: 50,
                        Quantity: 1,
                        Attributes: { attribute: 'whatever' },
                        Sku: 12345,
                    },
                ],
            },
        });
        window.appboy.should.have.property('logCustomEventCalled', true);
        window.appboy.should.have.property(
            'logCustomEventName',
            'Test EXPANDED Event'
        );

        window.appboy.eventProperties.should.have.lengthOf(1);
        window.appboy.eventProperties[0]['Transaction Id'].should.equal(
            'foo-add-to-cart-transaction-id'
        );
        reportService.event.should.have.property(
            'EventName',
            'Test Add To Cart'
        );
    });

    it('should log a purchase event without attributes', function () {
        mParticle.forwarder.process({
            EventName: 'Test Purchase Event',
            EventDataType: MessageType.Commerce,
            EventCategory: EventType.ProductPurchase,
            CurrencyCode: 'USD',
            ProductAction: {
                TransactionId: 1234,
                TotalAmount: 50,
                ProductList: [
                    {
                        Price: '50',
                        Name: 'Product Name',
                        TotalAmount: 50,
                        Quantity: 1,
                        Sku: 12345,
                    },
                ],
            },
        });
        window.appboy.should.have.property('logPurchaseEventCalled', true);
        window.appboy.should.have.property('logPurchaseName', 'Product Name');
        window.appboy.purchaseEventProperties.should.have.lengthOf(1);
        window.appboy.purchaseEventProperties[0][0].should.equal(
            'Product Name'
        );
        window.appboy.purchaseEventProperties[0][1].should.equal(50);
        window.appboy.purchaseEventProperties[0][2].should.equal(1);
        window.appboy.purchaseEventProperties[0][3].should.not.have.properties(
            'attribute'
        );
        window.appboy.purchaseEventProperties[0][3][
            'Transaction Id'
        ].should.equal(1234);
    });

    it('should log a purchase event with empty attributes', function() {
        mParticle.forwarder.process({
            EventName: 'Test Purchase Event',
            EventDataType: MessageType.Commerce,
            EventCategory: EventType.ProductPurchase,
            CurrencyCode: 'USD',
            ProductAction: {
                TransactionId: 1234,
                TotalAmount: 50,
                ProductList: [
                    {
                        Price: '50',
                        Name: 'Product Name',
                        TotalAmount: 50,
                        Quantity: 1,
                        Attributes: {},
                        Sku: 12345,
                    },
                ],
            },
        });
        window.appboy.should.have.property('logPurchaseEventCalled', true);
        window.appboy.should.have.property('logPurchaseName', 'Product Name');
        window.appboy.purchaseEventProperties.should.have.lengthOf(1);
        window.appboy.purchaseEventProperties[0][0].should.equal(
            'Product Name'
        );
        window.appboy.purchaseEventProperties[0][1].should.equal(50);
        window.appboy.purchaseEventProperties[0][2].should.equal(1);
        window.appboy.purchaseEventProperties[0][3].should.not.have.properties(
            'attribute'
        );
        window.appboy.purchaseEventProperties[0][3][
            'Transaction Id'
        ].should.equal(1234);
    });

    it('should log a custom event for non-purchase commerce events', function() {
        mParticle.forwarder.process({
            EventName: 'Test Non-Purchase Event',
            EventDataType: MessageType.Commerce,
            EventCategory: EventType.Other,
        });

        window.appboy.should.have.property('logCustomEventCalled', true);
        reportService.event.should.have.property(
            'EventName',
            'Test Non-Purchase Event'
        );
    });

    it('should log a page view when forwardScreenViews is true, and not log when forwarder setting is false', function() {
        mParticle.forwarder.init(
            {
                apiKey: '123456',
                forwardScreenViews: 'False',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'testUser',
                    Type: IdentityType.CustomerId,
                },
            ],
            '1.1',
            'My App'
        );

        mParticle.forwarder.process({
            EventName: 'Test Log Page View',
            EventDataType: MessageType.PageView,
            EventCategory: EventType.Navigation,
            EventAttributes: { $$$attri$bute: '$$$$what$ever' },
        });

        window.appboy.should.have.property('logCustomEventCalled', false);

        window.appboy = new MockAppboy();
        mParticle.forwarder.init(
            {
                apiKey: '123456',
                forwardScreenViews: 'True',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'testUser',
                    Type: IdentityType.CustomerId,
                },
            ],
            '1.1',
            'My App'
        );
        mParticle.forwarder.process({
            EventName: 'Test Log Page View',
            EventDataType: MessageType.PageView,
            EventCategory: EventType.Navigation,
            EventAttributes: { $$$attri$bute: '$$$$what$ever' },
        });

        window.appboy.should.have.property('logCustomEventCalled', true);
        window.appboy.eventProperties[0].should.have.property(
            'hostname',
            window.location.hostname
        );
        window.appboy.eventProperties[0].should.have.property('title');
        window.appboy.eventProperties[0].should.have.property(
            'attri$bute',
            'what$ever'
        );
        reportService.event.should.have.property(
            'EventName',
            'Test Log Page View'
        );
    });

    it('should log a purchase event with SKU in place of product name if forwardSkuAsProductName is true', function() {
        mParticle.forwarder.init(
            {
                apiKey: '123456',
                forwardSkuAsProductName: 'True',
            },
            reportService.cb,
            true,
            null
        );

        mParticle.forwarder.process({
            EventName: 'Test Purchase Event',
            EventDataType: MessageType.Commerce,
            EventCategory: EventType.ProductPurchase,
            CurrencyCode: 'USD',
            ProductAction: {
                TransactionId: 1234,
                TotalAmount: 50,
                ProductList: [
                    {
                        Price: '50',
                        Name: '$Product $Name',
                        TotalAmount: 50,
                        Quantity: 1,
                        Attributes: { $$$attri$bute: '$$$$what$ever' },
                        Sku: 12345,
                    },
                ],
            },
        });

        window.appboy.should.have.property('logPurchaseEventCalled', true);
        window.appboy.should.have.property('logPurchaseName', '12345');
    });

    it('should log a page view with the page name if sendEventNameForPageView is true', function() {
        mParticle.forwarder.init(
            {
                apiKey: '123456',
                forwardScreenViews: 'True',
                setEventNameForPageView: 'True',
            },
            reportService.cb,
            true,
            null
        );

        mParticle.forwarder.process({
            EventName: 'Test Log Page View',
            EventDataType: MessageType.PageView,
            EventCategory: EventType.Navigation,
            EventAttributes: { $$$attri$bute: '$$$$what$ever' },
        });

        window.appboy.should.have.property('logCustomEventCalled', true);
        window.appboy.should.have.property(
            'logCustomEventName',
            'Test Log Page View'
        );
        window.appboy.eventProperties[0].should.have.property(
            'hostname',
            window.location.hostname
        );
        window.appboy.eventProperties[0].should.have.property('title');
        window.appboy.eventProperties[0].should.have.property(
            'attri$bute',
            'what$ever'
        );
        reportService.event.should.have.property(
            'EventName',
            'Test Log Page View'
        );

        mParticle.forwarder.init(
            {
                apiKey: '123456',
                forwardScreenViews: 'True',
                setEventNameForPageView: 'False',
            },
            reportService.cb,
            true,
            null
        );

        mParticle.forwarder.process({
            EventName: 'Test Log Page View',
            EventDataType: MessageType.PageView,
            EventCategory: EventType.Navigation,
            EventAttributes: { $$$attri$bute: '$$$$what$ever' },
        });

        window.appboy.should.have.property('logCustomEventCalled', true);

        window.appboy.logCustomEventName
            .includes('Test Log Page View')
            .should.equal(false);
        //when setEventNameForPageView is false, logCustomEventName is the path, which will include several /'s
        window.appboy.logCustomEventName.includes('/').should.equal(true);
        window.appboy.eventProperties[0].should.have.property(
            'hostname',
            window.location.hostname
        );
        window.appboy.eventProperties[0].should.have.property('title');
        window.appboy.eventProperties[0].should.have.property(
            'attri$bute',
            'what$ever'
        );
        reportService.event.should.have.property(
            'EventName',
            'Test Log Page View'
        );
    });

    it('should sanitize purchase event and properties', function() {
        mParticle.forwarder.process({
            EventName: 'Test Purchase Event',
            EventDataType: MessageType.Commerce,
            EventCategory: EventType.ProductPurchase,
            CurrencyCode: 'USD',
            ProductAction: {
                TransactionId: 1234,
                TotalAmount: 50,
                ProductList: [
                    {
                        Price: '50',
                        Name: '$Product $Name',
                        TotalAmount: 50,
                        Quantity: 1,
                        Attributes: { $$$attri$bute: '$$$$what$ever' },
                        Sku: 12345,
                    },
                ],
            },
        });
        window.appboy.should.have.property('logPurchaseEventCalled', true);
        window.appboy.purchaseEventProperties.should.have.lengthOf(1);
        window.appboy.purchaseEventProperties[0][0].should.equal(
            'Product $Name'
        );
        window.appboy.purchaseEventProperties[0][1].should.equal(50);
        window.appboy.purchaseEventProperties[0][2].should.equal(1);
        window.appboy.purchaseEventProperties[0][3]['attri$bute'].should.equal(
            'what$ever'
        );
        window.appboy.purchaseEventProperties[0][3]['Sku'].should.equal(12345);
    });

    it('should not log non-purchase or non-pageEvent Events', function() {
        mParticle.forwarder.process({
            EventName: 'Non-Event',
            EventDataType: MessageType.PageView,
        });
        window.appboy.should.have.property('logPurchaseEventCalled', false);
    });

    it('should only change user identity and set the user email', function() {
        // version 1 should use setUserIdentity
        mParticle.getVersion = function() {
            return '1.1.1';
        };
        mParticle.forwarder.setUserIdentity(
            '123',
            window.mParticle.IdentityType.CustomerId
        );
        mParticle.forwarder.setUserIdentity(
            'blah@gmail.com',
            window.mParticle.IdentityType.Email
        );
        mParticle.forwarder.setUserIdentity(
            'Mr. Blah facebook id',
            window.mParticle.IdentityType.Facebook
        );
        window.appboy.userId.should.equal('123');
        window.appboy.getUser().emailSet.should.equal('blah@gmail.com');

        delete mParticle.getVersion;
    });

    it('should not use forwarder.setUserIdentity on version 2', function() {
        mParticle.getVersion = function() {
            return '2.0.0';
        };
        mParticle.forwarder.setUserIdentity(
            '123',
            window.mParticle.IdentityType.CustomerId
        );
        mParticle.forwarder.setUserIdentity(
            'blah@gmail.com',
            window.mParticle.IdentityType.Email
        );
        mParticle.forwarder.setUserIdentity(
            'Mr. Blah facebook id',
            window.mParticle.IdentityType.Facebook
        );

        (window.appboy.userId === null).should.equal(true);
        (window.appboy.getUser().emailSet === null).should.equal(true);

        delete mParticle.getVersion;
    });

    it('should set main appboy user identity from userIdentificationType ', function() {
        mParticle.forwarder.init({
            apiKey: '123456',
            userIdentificationType: 'Email',
        });
        var user = {
            getUserIdentities: function() {
                return {
                    userIdentities: {
                        customerid: 'abc123',
                        email: 'test@test.com',
                        facebook: 'fbID1',
                    },
                };
            },
            getMPID: function() {
                return 'MPID123';
            },
        };

        mParticle.forwarder.onUserIdentified(user);
        window.appboy.userId.should.equal('test@test.com');
        window.appboy.getUser().emailSet.should.equal('test@test.com');

        mParticle.forwarder.init({
            apiKey: '123456',
            userIdentificationType: 'MPID',
        });

        mParticle.forwarder.onUserIdentified(user);
        window.appboy.userId.should.equal('MPID123');

        mParticle.forwarder.init({
            apiKey: '123456',
            userIdentificationType: 'Facebook',
        });

        mParticle.forwarder.onUserIdentified(user);
        window.appboy.userId.should.equal('fbID1');
    });

    it('it should set default user attributes', function() {
        mParticle.forwarder.setUserAttribute('first_name', 'John');
        mParticle.forwarder.setUserAttribute('last_name', 'Doe');
        mParticle.forwarder.setUserAttribute('email', 'test@gmail.com');
        mParticle.forwarder.setUserAttribute('push_subscribe', 'opted_in');
        mParticle.forwarder.setUserAttribute('gender', 'm');
        mParticle.forwarder.setUserAttribute('dob', new Date(1991, 11, 17));
        mParticle.forwarder.setUserAttribute('phone', '1234567890');
        mParticle.forwarder.setUserAttribute('country', 'USA');
        mParticle.forwarder.setUserAttribute('home_city', 'NYC');
        window.appboy.getUser().genderSet.should.equal('m');
        window.appboy.getUser().firstName.should.equal('John');
        window.appboy.getUser().lastName.should.equal('Doe');
        window.appboy.getUser().emailSet.should.equal('test@gmail.com');
        window.appboy.getUser().pushSubscribe.should.equal('opted_in');
        window.appboy.getUser().yearOfBirth.should.equal(1991);
        window.appboy.getUser().dayOfBirth.should.equal(17);
        window.appboy.getUser().monthOfBirth.should.equal(12);
        window.appboy.getUser().phoneSet.should.equal('1234567890');
        window.appboy.getUser().countrySet.should.equal('USA');
        window.appboy.getUser().homeCity.should.equal('NYC');
    });

    it('it should set default user attributes using newer mParticle reserved attributes', function() {
        mParticle.forwarder.setUserAttribute('$FirstName', 'Jane');
        mParticle.forwarder.setUserAttribute('$LastName', 'Smith');
        mParticle.forwarder.setUserAttribute('Email', 'test2@gmail.com');
        mParticle.forwarder.setUserAttribute('$Gender', 'f');
        mParticle.forwarder.setUserAttribute('$Age', 10);
        mParticle.forwarder.setUserAttribute('$Mobile', '1234567890');
        mParticle.forwarder.setUserAttribute('$Country', 'USA');
        mParticle.forwarder.setUserAttribute('$City', 'NYC');

        window.appboy.getUser().genderSet.should.equal('f');
        window.appboy.getUser().firstName.should.equal('Jane');
        window.appboy.getUser().lastName.should.equal('Smith');
        window.appboy.getUser().emailSet.should.equal('test2@gmail.com');

        // We support $Age as a reserved attribute for Braze. However, since
        // Braze's API expects a year from us, this test will break every year,
        // since setting the age = 10 in 2021 will mean the user is born in 2011,
        // but setting it in 2022 means the year is 2012.
        window.appboy.getUser().yearOfBirth.should.equal(2012);
        window.appboy.getUser().dayOfBirth.should.equal(1);
        window.appboy.getUser().monthOfBirth.should.equal(1);
        window.appboy.getUser().phoneSet.should.equal('1234567890');
        window.appboy.getUser().countrySet.should.equal('USA');
        window.appboy.getUser().homeCity.should.equal('NYC');
    });

    it('it should not set invalid attributes on reserved attributes', function() {
        // age must be a number so yearofBirth is not set
        mParticle.forwarder.setUserAttribute('$Age', '10');
        (window.appboy.getUser().yearOfBirth === null).should.equal(true);

        // dob must be a date value so yearofBirth is not set
        mParticle.forwarder.setUserAttribute('dob', '1/1/2019');
        (window.appboy.getUser().yearOfBirth === null).should.equal(true);
    });

    it('should not set default values if a string is not passed as the attribute', function() {
        mParticle.forwarder.setUserAttribute('first_name', 'John');
        mParticle.forwarder.setUserAttribute('last_name', 'Doe');
        mParticle.forwarder.setUserAttribute('first_name', 10.2);
        mParticle.forwarder.setUserAttribute('last_name', false);
        window.appboy.getUser().firstName.should.equal('John');
        window.appboy.getUser().lastName.should.equal('Doe');
    });

    it('should set a custom user attribute', function() {
        mParticle.forwarder.setUserAttribute('test', 'result');
        window.appboy
            .getUser()
            .should.have.property('customAttributeSet', true);
        window.appboy.getUser().customAttribute.should.equal('test');
        window.appboy.getUser().customAttributeValue.should.equal('result');
    });

    it('should set a custom user attribute of diffferent types', function() {
        mParticle.forwarder.setUserAttribute('testint', 3);
        window.appboy.getUser().customAttributeValue.should.equal(3);
        var d = new Date();
        mParticle.forwarder.setUserAttribute('testdate', d);
        window.appboy.getUser().customAttributeValue.should.equal(d);
        mParticle.forwarder.setUserAttribute('testarray', ['3']);
        window.appboy.getUser().customAttributeValue[0].should.equal('3');
    });

    it('should sanitize a custom user attribute', function() {
        mParticle.forwarder.setUserAttribute('$$tes$t', '$$res$ult');
        window.appboy
            .getUser()
            .should.have.property('customAttributeSet', true);
        window.appboy.getUser().customAttribute.should.equal('tes$t');
        window.appboy.getUser().customAttributeValue.should.equal('res$ult');
    });

    it('should sanitize a custom user attribute array', function() {
        mParticle.forwarder.setUserAttribute('att array', ['1', '$2$']);
        window.appboy.getUser().customAttributeValue[1].should.equal('2$');
    });

    it('should not set a custom user attribute array on an invalid array', function() {
        mParticle.forwarder.setUserAttribute('att array', [2, 4, 5]);
        window.appboy
            .getUser()
            .should.have.property('customAttributeSet', false);
    });

    it('should remove a default user attribute', function() {
        mParticle.forwarder.setUserAttribute('first_name', 'John');
        mParticle.forwarder.removeUserAttribute('first_name');
        window.appboy.getUser().firstName.should.equal('');
    });

    it('should remove custom user attributes', function() {
        mParticle.forwarder.setUserAttribute('test', 'result');
        mParticle.forwarder.removeUserAttribute('test');
        window.appboy.getUser().customAttribute.should.equal('test');
        window.appboy.getUser().customAttributeValue.should.equal('');
    });

    it('should remove custom user attributes', function() {
        mParticle.forwarder.setUserAttribute('$$test', '$res$ul$t');
        mParticle.forwarder.removeUserAttribute('$test');
        window.appboy.getUser().customAttribute.should.equal('test');
        window.appboy.getUser().customAttributeValue.should.equal('');
    });

    it('should not set date of birth if passed an invalid value', function() {
        mParticle.forwarder.setUserAttribute('dob', new Date(1991, 11, 17));
        mParticle.forwarder.setUserAttribute('dob', 'something');
        window.appboy.getUser().yearOfBirth.should.equal(1991);
        window.appboy.getUser().dayOfBirth.should.equal(17);
        window.appboy.getUser().monthOfBirth.should.equal(12);
    });

    it('should log messages to the proper logger', function() {
        mParticle.forwarder.logger = {
            verbose: function(msg) {
                mParticle.forwarder.msg = msg;
            },
        };
        var product1 = {
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
                color: 'blue',
            },
        };

        var commerceEvent = {
            EventName: 'eCommerce - Purchase',
            EventCategory: CommerceEventType.ProductPurchase,
            EventAttributes: {
                sale: true,
            },
            EventDataType: 16,
            CurrencyCode: 'USD',
            ProductAction: {
                ProductActionType: 7, // ProductActionType.Purchase value is 7
                ProductList: [product1],
                TransactionId: 'foo-transaction-id',
                TotalAmount: 430,
                TaxAmount: 30,
            },
        };
        mParticle.forwarder.process(commerceEvent);

        var expectedMessage = `mParticle - Braze Web Kit log:
appboy.logPurchase:
iphone,
999,
USD,
1,
{\"color\":\"blue\",\"Sku":"iphoneSKU",\"Transaction Id":"foo-transaction-id"},\n`;

        mParticle.forwarder.msg.should.equal(expectedMessage);
    });

    it('should not set baseUrl when passed an invalid cluster', function() {
        reportService.reset();
        window.appboy = new MockAppboy();

        mParticle.forwarder.init(
            {
                apiKey: '123456',
                cluster: '0',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'testUser',
                    Type: IdentityType.CustomerId,
                },
            ],
            '1.1',
            'My App'
        );

        (window.appboy.baseUrl === null).should.equal(true);
    });

    it('should have no baseUrl when cluster is not passed and dataCenterLocation is not EU', function() {
        reportService.reset();
        window.appboy = new MockAppboy();

        mParticle.forwarder.init(
            {
                apiKey: '123456',
                dataCenterLocation: 'US',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'testUser',
                    Type: IdentityType.CustomerId,
                },
            ],
            '1.1',
            'My App'
        );

        window.appboy.should.have.property('baseUrl', null);
    });

    it('should use the EU data center when dataCenterLocation is set to EU and no host is passed', function() {
        reportService.reset();
        window.appboy = new MockAppboy();

        mParticle.forwarder.init(
            {
                apiKey: '123456',
                dataCenterLocation: 'EU',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'testUser',
                    Type: IdentityType.CustomerId,
                },
            ],
            '1.1',
            'My App'
        );

        window.appboy.should.have.property('baseUrl', 'sdk.fra-01.braze.eu');
    });

    it('should use the 01 clusterMapping url when 01 number is passed to cluster', function() {
        reportService.reset();
        window.appboy = new MockAppboy();

        mParticle.forwarder.init(
            {
                apiKey: '123456',
                cluster: '01',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'testUser',
                    Type: IdentityType.CustomerId,
                },
            ],
            '1.1',
            'My App'
        );

        window.appboy.baseUrl.should.equal('sdk.iad-01.braze.com');
    });

    it('should use the 02 clusterMapping url when 02 number is passed to cluster', function() {
        reportService.reset();
        window.appboy = new MockAppboy();

        mParticle.forwarder.init(
            {
                apiKey: '123456',
                cluster: '02',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'testUser',
                    Type: IdentityType.CustomerId,
                },
            ],
            '1.1',
            'My App'
        );

        window.appboy.baseUrl.should.equal('sdk.iad-02.braze.com');
    });

    it('should use the 03 clusterMapping url when 03 number is passed to cluster', function() {
        reportService.reset();
        window.appboy = new MockAppboy();

        mParticle.forwarder.init(
            {
                apiKey: '123456',
                cluster: '03',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'testUser',
                    Type: IdentityType.CustomerId,
                },
            ],
            '1.1',
            'My App'
        );

        window.appboy.baseUrl.should.equal('sdk.iad-03.braze.com');
    });

    it('should use the 04 clusterMapping url when 04 number is passed to cluster', function() {
        reportService.reset();
        window.appboy = new MockAppboy();
        mParticle.forwarder.init(
            {
                apiKey: '123456',
                cluster: '04',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'testUser',
                    Type: IdentityType.CustomerId,
                },
            ],
            '1.1',
            'My App'
        );

        window.appboy.baseUrl.should.equal('sdk.iad-04.braze.com');
    });

    it('should use the 06 clusterMapping url when 06 number is passed to cluster', function() {
        reportService.reset();
        window.appboy = new MockAppboy();
        mParticle.forwarder.init(
            {
                apiKey: '123456',
                cluster: '06',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'testUser',
                    Type: IdentityType.CustomerId,
                },
            ],
            '1.1',
            'My App'
        );

        window.appboy.baseUrl.should.equal('sdk.iad-06.braze.com');
    });

    it('should use the 08 clusterMapping url when 08 number is passed to cluster', function() {
        reportService.reset();
        window.appboy = new MockAppboy();
        mParticle.forwarder.init(
            {
                apiKey: '123456',
                cluster: '08',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'testUser',
                    Type: IdentityType.CustomerId,
                },
            ],
            '1.1',
            'My App'
        );

        window.appboy.baseUrl.should.equal('sdk.iad-08.braze.com');
    });

    it('should use custom cluster url when passed cluster JSON', function() {
        reportService.reset();
        window.appboy = new MockAppboy();
        mParticle.forwarder.init(
            {
                apiKey: '123456',
                cluster:
                    '{&quot;SDK&quot;:&quot;sdk.foo.bar.com&quot;,&quot;REST&quot;:&quot;rest.foo.bar.com&quot;,&quot;JS&quot;:&quot;js.foo.bar.com&quot;}',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'testUser',
                    Type: IdentityType.CustomerId,
                },
            ],
            '1.1',
            'My App'
        );

        window.appboy.baseUrl.should.equal('https://js.foo.bar.com/api/v3');
    });

    it('decodeClusterSetting should return null when no setting given', function() {
        Should(window.mParticle.forwarder.decodeClusterSetting()).not.be.ok();
    });

    it('decodeClusterSetting should return null on bad json', function() {
        Should(
            window.mParticle.forwarder.decodeClusterSetting('blah&quote;')
        ).not.be.ok();
    });

    it('decodeClusterSetting should return JS url when proper setting is given', function() {
        var clusterSetting =
            '{&quot;SDK&quot;:&quot;sdk.foo.bar.com&quot;,&quot;REST&quot;:&quot;rest.foo.bar.com&quot;,&quot;JS&quot;:&quot;js.foo.bar.com&quot;}';
        Should(
            window.mParticle.forwarder.decodeClusterSetting(clusterSetting)
        ).equal('https://js.foo.bar.com/api/v3');
    });

    it('does not log prime-for-push when initialized without softPushCustomEventName', function() {
        Should(window.appboy.logCustomEventName).not.be.ok();
    });

    it('logs soft push custom event when initialized with softPushCustomEventName', function() {
        mParticle.forwarder.init(
            {
                apiKey: '123456',
                softPushCustomEventName: 'prime-for-push',
            },
            reportService.cb,
            true,
            null,
            {
                gender: 'm',
            },
            [
                {
                    Identity: 'testUser',
                    Type: IdentityType.CustomerId,
                },
            ],
            '1.1',
            'My App'
        );
        window.appboy.logCustomEventCalled.should.equal(true);
        window.appboy.logCustomEventName.should.equal('prime-for-push');
    });

    it('should initialize with doNotLoadFontAwesome', function() {
        window.appboy = new MockAppboy();

        mParticle.forwarder.init({
            doNotLoadFontAwesome: null,
        });

        window.appboy.should.have.property('doNotLoadFontAwesome', false);

        window.appboy = new MockAppboy();

        mParticle.forwarder.init({
            doNotLoadFontAwesome: 'True',
        });

        window.appboy.should.have.property('doNotLoadFontAwesome', true);

        window.appboy = new MockAppboy();

        mParticle.forwarder.init({
            doNotLoadFontAwesome: 'False',
        });

        window.appboy.should.have.property('doNotLoadFontAwesome', false);
    });

    it('should add additional braze settings passed from custom flags to the options object', function() {
        window.appboy = new MockAppboy();
        mParticle.forwarder.init(
            {
                doNotLoadFontAwesome: null,
                apiKey: 'test',
            },
            null,
            true,
            null,
            null,
            null,
            null,
            null,
            {
                28: {
                    initOptions: function(options) {
                        options.brazeSetting1 = true;
                        options.brazeSetting2 = true;
                    },
                },
            }
        );

        window.appboy.options.should.have.property('brazeSetting1', true);
        window.appboy.options.should.have.property('brazeSetting2', true);
    });
});
