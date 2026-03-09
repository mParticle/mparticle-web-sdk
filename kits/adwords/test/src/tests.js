const GoogleECData = {
    email: 'test@gmail.com',
    phone_number: '1-911-867-5309',
    first_name: 'John',
    last_name: 'Doe',
    home_address: {
        street: '123 Main St',
        city: 'San Francisco',
        region: 'CA',
        postal_code: '12345',
        country: 'US',
    },
};

describe('Adwords forwarder', function () {
    var MessageType = {
        SessionStart: 1,
        SessionEnd: 2,
        PageView: 3,
        PageEvent: 4,
        CrashReport: 5,
        OptOut: 6,
        Commerce: 16
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
            getName: function () { return 'CustomerID'; }
        },
        ReportingService = function () {
            var self = this;

            this.id = null;
            this.event = null;

            this.cb = function (id, event) {
                self.id = id;
                self.event = event;
            };

            this.reset = function () {
                this.id = null
                this.event = null;
            };
        },
        google_trackConversion_mock = function (data) {
            window.google_track_data = data;
            window.google_track_called = true;
        },
        google_track_data = null,
        google_track_called = false,
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
                return name.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
            }

            if (name.length === 0) {
                return hash;
            }

            for (i = 0; i < name.length; i++) {
                character = name.charCodeAt(i);
                hash = ((hash << 5) - hash) + character;
                hash = hash & hash;
            }

            return hash;
        };

        window.google_trackConversion = google_trackConversion_mock;
    });

    function checkCommonProperties(){
        window.google_track_data.should.have.property("google_conversion_language", "en");
        window.google_track_data.should.have.property("google_conversion_color", "ffffff")
        window.google_track_data.should.have.property("google_conversion_format", "3")
        window.google_track_data.should.have.property("google_conversion_id", 'AW-123123123')
    }

    describe('Legacy Conversion Async', function () {
        beforeEach(function() {
            window.dataLayer = undefined;
        });

        describe("Page View Conversion Label", function () {
            before(function () {
                var map = [{ "maptype": "EventClassDetails.Id", "value": "pageViewLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.PageView + "" + 'Homepage') }]

                mParticle.forwarder.init({
                    labels: JSON.stringify(map),
                    conversionId: 'AW-123123123'
                }, reportService.cb, true);
            });


            it('should have conversion labels for page view', function (done) {
                var successMessage = mParticle.forwarder.process({
                    EventName: 'Homepage',
                    EventDataType: MessageType.PageView,
                    EventAttributes: {
                        showcase: 'something',
                        test: 'thisoneshouldgetmapped',
                        mp: 'rock'
                    }
                });

                successMessage.should.not.be.null();
                successMessage.should.be.equal("Successfully sent to GoogleAdWords")
                checkCommonProperties();
                window.google_track_data.should.have.property('google_conversion_label', "pageViewLabel123");

                done();
            });
        });

        describe("Page Event Conversion Label", function () {
            before(function () {
                var map = [{ "maptype": "EventClass.Id", "value": "pageEventLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.PageEvent + "" +  EventType.Navigation + 'Homepage') }]

                mParticle.forwarder.init({
                    labels: JSON.stringify(map),
                    conversionId: 'AW-123123123'
                }, reportService.cb, true);
            });


            it('should have conversion labels for page event', function (done) {
                var successMessage = mParticle.forwarder.process({
                    EventName: 'Homepage',
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventAttributes: {
                        showcase: 'something',
                        test: 'thisoneshouldgetmapped',
                        mp: 'rock'
                    }
                });

                successMessage.should.not.be.null();
                successMessage.should.be.equal("Successfully sent to GoogleAdWords")
                checkCommonProperties();
                window.google_track_data.should.have.property('google_conversion_label', "pageEventLabel123");

                done();
            });
        });


        describe("Commerce Event Conversion Label", function () {
            before(function () {
                var map = [{ "maptype": "EventClassDetails.Id", "value": "commerceLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.Commerce + "" + "eCommerce - Purchase") }]

                mParticle.forwarder.init({
                    labels: JSON.stringify(map),
                    conversionId: 'AW-123123123'
                }, reportService.cb, true);
            });

            it('should have conversion labels for commerce event', function (done) {
                var successMessage = mParticle.forwarder.process({
                    EventName: "eCommerce - Purchase",
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
                        ShippingAmount: 10,
                    },
                    CurrencyCode: "USD"
                });

                successMessage.should.not.be.null();
                successMessage.should.be.equal("Successfully sent to GoogleAdWords")
                checkCommonProperties();
                window.google_track_data.should.have.property('google_conversion_label', "commerceLabel123");

                done();
            });
        })

        describe("Custom Parameters", function () {
            before(function () {
                var labels = [
                    { "maptype": "EventClass.Id", "value": "pageEventLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.PageEvent + "" + EventType.Navigation + 'Homepage') },
                    { "maptype": "EventClassDetails.Id", "value": "pageViewLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.PageView + "" + 'Homepage') },
                    { "maptype": "EventClassDetails.Id", "value": "commerceLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.Commerce + "" + "eCommerce - Purchase") },
                ];
                var attr = [
                    { "maptype": "EventAttributeClass.Id", "value": "mycustomprop", "map": "0", "jsmap": mParticle.generateHash(MessageType.PageEvent + "" + EventType.Navigation + 'attributekey') },
                    { "maptype": "EventAttributeClassDetails.Id", "value": "title", "map": "0", "jsmap": mParticle.generateHash(MessageType.PageView + "" + 'title') },
                    { "maptype": "EventAttributeClassDetails.Id", "value": "sale", "map": "0", "jsmap": mParticle.generateHash(MessageType.Commerce + "" + 'sale') }
                ];

                mParticle.forwarder.init({
                    labels: JSON.stringify(labels),
                    customParameters: JSON.stringify(attr),
                    conversionId: 'AW-123123123'
                }, reportService.cb, true);
            });

            it('should have custom params for page event', function (done) {
                var successMessage = mParticle.forwarder.process({
                    EventName: 'Homepage',
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventAttributes: {
                        attributekey: 'attributevalue'
                    }
                });

                successMessage.should.not.be.null();
                successMessage.should.be.equal("Successfully sent to GoogleAdWords")
                checkCommonProperties();
                window.google_track_data.should.have.property('google_custom_params');
                Object.keys(window.google_track_data.google_custom_params).length.should.be.equal(1);
                window.google_track_data.google_custom_params.should.have.property('mycustomprop', 'attributevalue')
                done();
            });

            it('should have custom params for page view', function (done) {
                var successMessage = mParticle.forwarder.process({
                    EventName: 'Homepage',
                    EventDataType: MessageType.PageView,
                    EventAttributes: {
                        title: 'my page view'
                    }
                });

                successMessage.should.not.be.null();
                successMessage.should.be.equal("Successfully sent to GoogleAdWords")
                checkCommonProperties();
                window.google_track_data.should.have.property('google_custom_params');
                Object.keys(window.google_track_data.google_custom_params).length.should.be.equal(1);
                window.google_track_data.google_custom_params.should.have.property('title', 'my page view');
                done();
            });

            it('should have custom params for commerce events', function (done) {
                var successMessage = mParticle.forwarder.process({
                    EventName: "eCommerce - Purchase",
                    EventDataType: MessageType.Commerce,
                    EventAttributes: {
                        sale: 'seasonal sale'
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
                                Price: 400,
                                CouponCode: null,
                                Quantity: 1
                            }
                        ],
                        TransactionId: 123,
                        Affiliation: 'my-affiliation',
                        TotalAmount: 450,
                        TaxAmount: 40,
                        ShippingAmount: 10,
                    },
                    CurrencyCode: "USD"
                });

                successMessage.should.not.be.null();
                successMessage.should.be.equal("Successfully sent to GoogleAdWords")
                checkCommonProperties();
                window.google_track_data.should.have.property('google_custom_params');
                Object.keys(window.google_track_data.google_custom_params).length.should.be.equal(1);
                window.google_track_data.google_custom_params.should.have.property('sale', 'seasonal sale');
                done();
            });
        });

        describe("Unmapped conversion labels", function () {
            before(function () {
                var map = [{ "maptype": "EventClassDetails.Id", "value": "commerceLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.Commerce + "" + "eCommerce - Purchase") }]

                mParticle.forwarder.init({
                    labels: JSON.stringify(map),
                    conversionId: 'AW-123123123'
                }, reportService.cb, true);
            });before(function () {
                var map = [{ "maptype": "EventClassDetails.Id", "value": "commerceLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.Commerce + "" + "eCommerce - Purchase") }]

                mParticle.forwarder.init({
                    labels: JSON.stringify(map),
                    conversionId: 'AW-123123123'
                }, reportService.cb, true);
            });

            beforeEach(function() {
                window.dataLayer = [];
            });

            it('should not forward unmapped custom events', function (done) {
                var failMessage = mParticle.forwarder.process({
                    EventName: 'Something random',
                    EventDataType: MessageType.PageEvent,
                    EventAttributes: {
                        showcase: 'something',
                    },
                });

                failMessage.should.not.be.null();
                failMessage.should.be.containEql("Can't send to forwarder")
                done();
            });

            it('should not forward unmapped ecommerce events', function(done) {
                var failMessage = mParticle.forwarder.process({
                    EventName: 'eCommerce - AddToCart',
                    EventDataType: MessageType.Commerce,
                    EventAttributes: {
                        sale: 'seasonal sale',
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
                                Price: 400,
                                CouponCode: null,
                                Quantity: 1,
                            },
                        ],
                        TransactionId: 123,
                        Affiliation: 'my-affiliation',
                        TotalAmount: 450,
                        TaxAmount: 40,
                        ShippingAmount: 10,
                    },
                    CurrencyCode: 'USD',
                });

                failMessage.should.not.be.null();
                failMessage.should.be.containEql("Can't send to forwarder");
                window.dataLayer.length.should.eql(0);
                done();
            });
        });

        describe("Bad Label Json", function () {
            before(function () {
                // The ids are calculated based on the events used in the tests below so they must match exactly.
                mParticle.forwarder.init({
                    labels: 'baaaaaddddddd json',
                    conversionId: 'AW-123123123'
                }, reportService.cb, true);
            });


            it('should not forward with bad labels json', function (done) {
                var failMessage = mParticle.forwarder.process({
                    EventName: 'Something random',
                    EventDataType: MessageType.PageEvent,
                    EventAttributes: {
                        showcase: 'something'
                    }
                });

                failMessage.should.not.be.null();
                failMessage.should.be.containEql("Can't send to forwarder")
                done();
            });
        });


        describe("Bad Custom Parameters Json", function () {
            before(function () {
                // The ids are calculated based on the events used in the tests below so they must match exactly.
                mParticle.forwarder.init({
                    customParameters: 'sdpfuhasdflasdjfnsdjfsdjfn really baddd json',
                    conversionId: 'AW-123123123'
                }, reportService.cb, true);
            });


            it('should not forward with bad custom parameters json', function (done) {
                var failMessage = mParticle.forwarder.process({
                    EventName: 'Something random',
                    EventDataType: MessageType.PageEvent,
                    EventAttributes: {
                        showcase: 'something'
                    }
                });

                failMessage.should.not.be.null();
                failMessage.should.be.containEql("Can't send to forwarder")
                done();
            });
        });
    });

    describe('GTAG Conversions', function () {
        describe('Initializing GTAG', function () {
            it('should disable gtag and dataLayer by default', function (done) {
                var map = [{ "maptype": "EventClassDetails.Id", "value": "pageViewLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.PageView + "" + 'Homepage') }]

                mParticle.forwarder.init({
                    labels: JSON.stringify(map),
                    conversionId: 'AW-123123123'
                }, reportService.cb, true);

                (typeof window.gtag === 'undefined').should.be.true();
                (typeof window.dataLayer === 'undefined').should.be.true();
                done();
            });

            it('should initialize gtag and dataLayer when user opts in', function (done) {
                var map = [{ "maptype": "EventClassDetails.Id", "value": "pageViewLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.PageView + "" + 'Homepage') }]

                mParticle.forwarder.init({
                    labels: JSON.stringify(map),
                    enableGtag: 'True',
                    conversionId: 'AW-123123123'
                }, reportService.cb, 1, true);

                window.gtag.should.be.ok();
                window.dataLayer.should.be.ok();

                done();
            });
        });

        describe("Page View Conversion Label", function () {
            before(function () {
                window.dataLayer = undefined;

                var map = [{ "maptype": "EventClassDetails.Id", "value": "pageViewLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.PageView + "" + 'Homepage') }]

                mParticle.forwarder.init({
                    enableGtag: 'True',
                    labels: JSON.stringify(map),
                    conversionId: '123123123'
                }, reportService.cb, 1, true);
            });

            it('should have conversion labels for page view', function (done) {
                var successMessage = mParticle.forwarder.process({
                    EventName: 'Homepage',
                    EventDataType: MessageType.PageView,
                    EventAttributes: {
                        showcase: 'something',
                        test: 'thisoneshouldgetmapped',
                        mp: 'rock'
                    }
                });

                var result = [
                    'event',
                    'conversion',
                    {
                        'send_to': 'AW-123123123/pageViewLabel123'
                    }
                ];

                successMessage.should.not.be.null();
                successMessage.should.be.equal("Successfully sent to GoogleAdWords")
                window.dataLayer[0].should.match(result);

                done();
            });
        });

        describe("Page Event Conversion Label", function () {
            before(function () {
                var map = [{ "maptype": "EventClass.Id", "value": "pageEventLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.PageEvent + "" +  EventType.Navigation + 'Homepage') }]

                mParticle.forwarder.init({
                    enableGtag: 'True',
                    labels: JSON.stringify(map),
                    conversionId: '123123123'
                }, reportService.cb, 1, true);
            });

            beforeEach(function() {
                window.dataLayer = [];
            });

            it('should have conversion labels for page event', function (done) {
                var successMessage = mParticle.forwarder.process({
                    EventName: 'Homepage',
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventAttributes: {
                        showcase: 'something',
                        test: 'thisoneshouldgetmapped',
                        mp: 'rock'
                    }
                });

                var result = [
                    'event',
                    'conversion',
                    {
                        'send_to': 'AW-123123123/pageEventLabel123'
                    }
                ];

                successMessage.should.not.be.null();
                successMessage.should.be.equal("Successfully sent to GoogleAdWords")
                window.dataLayer[0].should.match(result);

                done();
            });
        });

        describe("Commerce Event Conversion Label", function () {
            before(function () {
                window.dataLayer = undefined;

                var map = [{ "maptype": "EventClassDetails.Id", "value": "commerceLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.Commerce + "" + "eCommerce - Purchase") }]

                mParticle.forwarder.init({
                    enableGtag: 'True',
                    labels: JSON.stringify(map),
                    conversionId: '123123123'
                }, reportService.cb, 1, true);
            });

            it('should have conversion labels for commerce event', function (done) {
                var successMessage = mParticle.forwarder.process({
                    EventName: "eCommerce - Purchase",
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
                        ShippingAmount: 10,
                    },
                    CurrencyCode: "USD"
                });

                var result = [
                    'event',
                    'conversion',
                    {
                        'send_to': 'AW-123123123/commerceLabel123',
                        transaction_id: 123,
                        value: 450,
                        currency: 'USD',
                    }
                ];

                successMessage.should.not.be.null();
                successMessage.should.be.equal("Successfully sent to GoogleAdWords")
                window.dataLayer[0].should.match(result);

                done();
            });
        })

        describe("Custom Parameters", function () {
            before(function () {
                window.dataLayer = undefined;

                var labels = [
                    { "maptype": "EventClass.Id", "value": "pageEventLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.PageEvent + "" + EventType.Navigation + 'Homepage') },
                    { "maptype": "EventClassDetails.Id", "value": "pageViewLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.PageView + "" + 'Homepage') },
                    { "maptype": "EventClassDetails.Id", "value": "commerceLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.Commerce + "" + "eCommerce - Purchase") },
                ];
                var attr = [
                    { "maptype": "EventAttributeClass.Id", "value": "mycustomprop", "map": "0", "jsmap": mParticle.generateHash(MessageType.PageEvent + "" + EventType.Navigation + 'attributekey') },
                    { "maptype": "EventAttributeClassDetails.Id", "value": "title", "map": "0", "jsmap": mParticle.generateHash(MessageType.PageView + "" + 'title') },
                    { "maptype": "EventAttributeClassDetails.Id", "value": "sale", "map": "0", "jsmap": mParticle.generateHash(MessageType.Commerce + "" + 'sale') }
                ]

                mParticle.forwarder.init({
                    enableGtag: 'True',
                    labels: JSON.stringify(labels),
                    customParameters: JSON.stringify(attr),
                    conversionId: '123123123'
                }, reportService.cb, 1, true);
            });

            afterEach(function() {
                window.dataLayer = [];
            });

            it('should have custom params for page event', function (done) {
                var successMessage = mParticle.forwarder.process({
                    EventName: 'Homepage',
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventAttributes: {
                        attributekey: 'attributevalue'
                    },
                    SourceMessageId: 'foo-bar'
                });

                var result = [
                    'event',
                    'conversion',
                    {
                        send_to: 'AW-123123123/pageEventLabel123',
                        mycustomprop: 'attributevalue',
                        transaction_id: 'foo-bar',
                    },
                ];

                successMessage.should.not.be.null();
                successMessage.should.be.equal("Successfully sent to GoogleAdWords")
                window.dataLayer[0].should.match(result);

                done();
            });

            it('should have custom params for page view', function (done) {
                var successMessage = mParticle.forwarder.process({
                    EventName: 'Homepage',
                    EventDataType: MessageType.PageView,
                    EventAttributes: {
                        title: 'my page title'
                    }
                });

                var result = [
                    'event',
                    'conversion',
                    {
                        'send_to': 'AW-123123123/pageViewLabel123',
                        title: 'my page title'
                    }
                ];

                successMessage.should.not.be.null();
                successMessage.should.be.equal("Successfully sent to GoogleAdWords")

                window.dataLayer[0].should.match(result);

                done();
            });

            it('should have custom params for commerce event', function (done) {
                var successMessage = mParticle.forwarder.process({
                    EventName: "eCommerce - Purchase",
                    EventDataType: MessageType.Commerce,
                    EventAttributes: {
                        sale: 'seasonal sale'
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
                                Price: 400,
                                CouponCode: null,
                                Quantity: 1
                            }
                        ],
                        TransactionId: 123,
                        Affiliation: 'my-affiliation',
                        TotalAmount: 450,
                        TaxAmount: 40,
                        ShippingAmount: 10,
                    },
                    CurrencyCode: "USD"
                });

                var result = [
                    'event',
                    'conversion',
                    {
                        'send_to': 'AW-123123123/commerceLabel123',
                        currency: 'USD',
                        language: 'en',
                        remarketing_only: false,
                        sale: 'seasonal sale',
                        value: 450
                    }
                ];

                successMessage.should.not.be.null();
                successMessage.should.be.equal("Successfully sent to GoogleAdWords");

                window.dataLayer[0].should.match(result);

                done();
            });
        });

        describe("Unmapped conversion labels", function () {
            before(function () {
                var map = [{ "maptype": "EventClassDetails.Id", "value": "commerceLabel123", "map": "0", "jsmap": mParticle.generateHash(MessageType.Commerce + "" + "eCommerce - Purchase") }]

                mParticle.forwarder.init({
                    enableGtag: 'True',
                    labels: JSON.stringify(map),
                    conversionId: '123123123'
                }, reportService.cb, 1, true);
            });

            beforeEach(function() {
                window.dataLayer = [];
            })

            it('should not forward unmapped custom events', function (done) {
                var failMessage = mParticle.forwarder.process({
                    EventName: 'Something random',
                    EventDataType: MessageType.PageEvent,
                    EventAttributes: {
                        showcase: 'something'
                    }
                });

                failMessage.should.not.be.null();
                failMessage.should.be.containEql("Can't send to forwarder")
                window.dataLayer.length.should.eql(0)
                done();
            });

            it('should not forward unmapped ecommerce events', function(done) {
                var failMessage = mParticle.forwarder.process({
                    EventName: 'eCommerce - AddToCart',
                    EventDataType: MessageType.Commerce,
                    EventAttributes: {
                        sale: 'seasonal sale',
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
                                Price: 400,
                                CouponCode: null,
                                Quantity: 1,
                            },
                        ],
                        TransactionId: 123,
                        Affiliation: 'my-affiliation',
                        TotalAmount: 450,
                        TaxAmount: 40,
                        ShippingAmount: 10,
                    },
                    CurrencyCode: 'USD',
                });

                failMessage.should.not.be.null();
                failMessage.should.be.containEql("Can't send to forwarder");
                window.dataLayer.length.should.eql(0);
                done();
            });
        });

        describe("Bad Label Json", function () {
            before(function () {
                // The ids are calculated based on the events used in the tests below so they must match exactly.
                mParticle.forwarder.init({
                    enableGtag: 'True',
                    labels: 'baaaaaddddddd json',
                    conversionId: '123123123'
                }, reportService.cb, 1, true);
            });

            beforeEach(function() {
                window.dataLayer = [];
            });

            it('should not forward with bad labels json', function (done) {
                var failMessage = mParticle.forwarder.process({
                    EventName: 'Something random',
                    EventDataType: MessageType.PageEvent,
                    EventAttributes: {
                        showcase: 'something'
                    }
                });

                failMessage.should.not.be.null();
                failMessage.should.be.containEql("Can't send to forwarder")
                window.dataLayer.length.should.eql(0)
                done();
            });
        });

        describe("Bad Custom Parameters Json", function () {
            before(function () {
                // The ids are calculated based on the events used in the tests below so they must match exactly.
                mParticle.forwarder.init({
                    enableGtag: 'True',
                    customParameters: 'sdpfuhasdflasdjfnsdjfsdjfn really baddd json',
                    conversionId: '123123123'
                }, reportService.cb, 1, true);
            });

            beforeEach(function() {
                window.dataLayer = [];
            });


            it('should not forward with bad custom parameters json', function (done) {
                var failMessage = mParticle.forwarder.process({
                    EventName: 'Something random',
                    EventDataType: MessageType.PageEvent,
                    EventAttributes: {
                        showcase: 'something'
                    }
                });

                failMessage.should.not.be.null();
                failMessage.should.be.containEql("Can't send to forwarder")
                done();
            });
        });

        describe('Enhanced Conversions', function(done) {
            before(function() {
                mParticle.forwarder.init(
                    {
                        conversionId: 'AW-123123123',
                        enableEnhancedConversions: 'True',
                        enableGtag: 'True',
                    },
                    reportService.cb,
                    true,
                    true
                );
            });
            beforeEach(function() {
                window.enhanced_conversion_data = {};
            })

            it('should set enhanced conversion data as an object on custom events', function(done) {
                mParticle.forwarder.process({
                    EventName: 'Homepage',
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    CustomFlags: {
                        'GoogleAds.ECData': GoogleECData 
                    },
                });

                window.enhanced_conversion_data.email.should.equal(
                    'test@gmail.com'
                );
                window.enhanced_conversion_data.phone_number.should.equal(
                    '1-911-867-5309'
                );
                window.enhanced_conversion_data.first_name.should.equal('John');
                window.enhanced_conversion_data.last_name.should.equal('Doe');
                window.enhanced_conversion_data.home_address.street.should.equal(
                    '123 Main St'
                );
                window.enhanced_conversion_data.home_address.city.should.equal(
                    'San Francisco'
                );
                window.enhanced_conversion_data.home_address.region.should.equal(
                    'CA'
                );
                window.enhanced_conversion_data.home_address.postal_code.should.equal(
                    '12345'
                );
                window.enhanced_conversion_data.home_address.country.should.equal('US');

                done();
            });

            it('should set enhanced conversion data as strings on custom events', function(done) {
                mParticle.forwarder.process({
                    EventName: 'Homepage',
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    CustomFlags: {
                        'GoogleAds.ECData': JSON.stringify(GoogleECData),
                    },
                });

                window.enhanced_conversion_data.email.should.equal(
                    'test@gmail.com'
                );
                window.enhanced_conversion_data.phone_number.should.equal(
                    '1-911-867-5309'
                );
                window.enhanced_conversion_data.first_name.should.equal('John');
                window.enhanced_conversion_data.last_name.should.equal('Doe');
                window.enhanced_conversion_data.home_address.street.should.equal(
                    '123 Main St'
                );
                window.enhanced_conversion_data.home_address.city.should.equal(
                    'San Francisco'
                );
                window.enhanced_conversion_data.home_address.region.should.equal(
                    'CA'
                );
                window.enhanced_conversion_data.home_address.postal_code.should.equal(
                    '12345'
                );
                window.enhanced_conversion_data.home_address.country.should.equal('US');

                done();
            });

            it('should set enhanced conversion data as an object on commerce events', function(done) {
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
                                Quantity: 1,
                            },
                        ],
                        TransactionId: 123,
                        Affiliation: 'my-affiliation',
                        TotalAmount: 450,
                        TaxAmount: 40,
                        ShippingAmount: 10,
                    },
                    CurrencyCode: 'USD',
                    CustomFlags: {
                        'GoogleAds.ECData': GoogleECData
                    },
                });

                window.enhanced_conversion_data.email.should.equal(
                    'test@gmail.com'
                );
                window.enhanced_conversion_data.phone_number.should.equal(
                    '1-911-867-5309'
                );
                window.enhanced_conversion_data.first_name.should.equal('John');
                window.enhanced_conversion_data.last_name.should.equal('Doe');
                window.enhanced_conversion_data.home_address.street.should.equal(
                    '123 Main St'
                );
                window.enhanced_conversion_data.home_address.city.should.equal(
                    'San Francisco'
                );
                window.enhanced_conversion_data.home_address.region.should.equal(
                    'CA'
                );
                window.enhanced_conversion_data.home_address.postal_code.should.equal(
                    '12345'
                );
                window.enhanced_conversion_data.home_address.country.should.equal('US');

                done();
            });

            it('should set enhanced conversion data as strings on commerce events', function(done) {
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
                                Quantity: 1,
                            },
                        ],
                        TransactionId: 123,
                        Affiliation: 'my-affiliation',
                        TotalAmount: 450,
                        TaxAmount: 40,
                        ShippingAmount: 10,
                    },
                    CurrencyCode: 'USD',
                    CustomFlags: {
                        'GoogleAds.ECData': JSON.stringify(GoogleECData),
                    },
                });

                window.enhanced_conversion_data.email.should.equal(
                    'test@gmail.com'
                );
                window.enhanced_conversion_data.phone_number.should.equal(
                    '1-911-867-5309'
                );
                window.enhanced_conversion_data.first_name.should.equal('John');
                window.enhanced_conversion_data.last_name.should.equal('Doe');
                window.enhanced_conversion_data.home_address.street.should.equal(
                    '123 Main St'
                );
                window.enhanced_conversion_data.home_address.city.should.equal(
                    'San Francisco'
                );
                window.enhanced_conversion_data.home_address.region.should.equal(
                    'CA'
                );
                window.enhanced_conversion_data.home_address.postal_code.should.equal(
                    '12345'
                );
                window.enhanced_conversion_data.home_address.country.should.equal('US');

                done();
            });

            it('should set malformed enhanced conversion data to an empty object', function (done) {
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
                                Quantity: 1,
                            },
                        ],
                        TransactionId: 123,
                        Affiliation: 'my-affiliation',
                        TotalAmount: 450,
                        TaxAmount: 40,
                        ShippingAmount: 10,
                    },
                    CurrencyCode: 'USD',
                    CustomFlags: {
                        'GoogleAds.ECData': true
                    },
                });

                window.enhanced_conversion_data.should.eql({});

                done();
            });
        });

        describe('Consent State', function () {
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

            beforeEach(function () {
                window.dataLayer = [];
                window.gtag = function () {
                    window.dataLayer.push(arguments);
                };

                mParticle.Identity = {
                    getCurrentUser: function () {
                        return {
                            getConsentState: function () {
                                return {
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
            });

            afterEach(function () {
                mParticle.Identity = undefined;
            });

            it('should construct a Default Consent State Payload from Mappings', function (done) {
                // We are intentionally using a string here instead of `JSON.stringify(consentMap)`
                // so that we can also test how consentMappingWeb is parsed when returned as a string
                // from the mParticle config
                mParticle.forwarder.init(
                    {
                        conversionId: 'AW-123123123',
                        enableGtag: 'True',
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

                // https://go.mparticle.com/work/SQDSDKS-6152
                window.dataLayer.length.should.eql(1);
                window.dataLayer[0][0].should.equal('consent');
                window.dataLayer[0][1].should.equal('default');
                window.dataLayer[0][2].should.deepEqual(expectedDataLayer[2]);
                done();
            });

            it('should construct a Default Consent State Payload from Default Settings and construct an Update Consent State Payload from Mappings', function (done) {
                mParticle.forwarder.init(
                    {
                        conversionId: 'AW-123123123',
                        enableGtag: 'True',
                        consentMappingWeb: JSON.stringify(consentMap),
                        defaultAdPersonalizationConsent: 'Granted', // Will be overriden by User Consent State
                        defaultAdUserDataConsent: 'Granted', // Will be overriden by User Consent State
                        defaultAdStorageConsentWeb: 'Granted',
                        defaultAnalyticsStorageConsentWeb: 'Granted',
                    },
                    reportService.cb,
                    true
                );

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

                window.dataLayer.length.should.eql(2);
                window.dataLayer[0][0].should.equal('consent');
                window.dataLayer[0][1].should.equal('default');
                window.dataLayer[0][2].should.deepEqual(expectedDataLayer1[2]);
                window.dataLayer[1][0].should.equal('consent');
                window.dataLayer[1][1].should.equal('update');
                window.dataLayer[1][2].should.deepEqual(expectedDataLayer2[2]);

                done();
            });

            it('should ignore Unspecified Consent Settings if NOT explicitely defined in Consent State', function (done) {
                mParticle.forwarder.init(
                    {
                        conversionId: 'AW-123123123',
                        enableGtag: 'True',
                        consentMappingWeb: JSON.stringify(consentMap),
                        defaultAdStorageConsentWeb: 'Unspecified', // Will be overriden by User Consent State
                        defaultAdUserDataConsent: 'Unspecified', // Will be overriden by User Consent State
                        defaultAdPersonalizationConsent: 'Unspecified',
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

                window.dataLayer.length.should.eql(1);
                window.dataLayer[0][0].should.equal('consent');
                window.dataLayer[0][1].should.equal('default');
                window.dataLayer[0][2].should.deepEqual(expectedDataLayer[2]);

                done();
            });

            it('should construct a Consent State Update Payload when consent changes', function (done) {
                mParticle.forwarder.init(
                    {
                        conversionId: 'AW-123123123',
                        enableGtag: 'True',
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

                window.dataLayer.length.should.eql(1);
                window.dataLayer[0][0].should.equal('consent');
                window.dataLayer[0][1].should.equal('default');
                window.dataLayer[0][2].should.deepEqual(
                    expectedDataLayerBefore[2]
                );

                mParticle.forwarder.process({
                    EventName: 'Homepage',
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventAttributes: {
                        showcase: 'something',
                        test: 'thisoneshouldgetmapped',
                        mp: 'rock',
                    },
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

                window.dataLayer.length.should.eql(2);
                window.dataLayer[1][0].should.equal('consent');
                window.dataLayer[1][1].should.equal('update');
                window.dataLayer[1][2].should.deepEqual(
                    expectedDataLayerAfter[2]
                );

                mParticle.forwarder.process({
                    EventName: 'Homepage',
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventAttributes: {
                        showcase: 'something',
                        test: 'thisoneshouldgetmapped',
                        mp: 'rock',
                    },
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

                window.dataLayer.length.should.eql(3);
                window.dataLayer[2][0].should.equal('consent');
                window.dataLayer[2][1].should.equal('update');
                window.dataLayer[2][2].should.deepEqual(
                    expectedDataLayerFinal[2]
                );
                done();
            });

            it('should construct a Consent State Update Payload with Consent Setting Defaults when consent changes', function (done) {
                mParticle.forwarder.init(
                    {
                        conversionId: 'AW-123123123',
                        enableGtag: 'True',
                        consentMappingWeb: JSON.stringify(consentMap),
                        defaultAdPersonalizationConsent: 'Granted', // Will be overriden by User Consent State
                        defaultAdUserDataConsent: 'Granted', // Will be overriden by User Consent State
                        defaultAdStorageConsentWeb: 'Granted',
                        defaultAnalyticsStorageConsentWeb: 'Granted',
                    },
                    reportService.cb,
                    true
                );

                var expectedDataLayerBefore1 = [
                    'consent',
                    'default',
                    {
                        ad_personalization: 'granted', // From Consent Settings
                        ad_user_data: 'granted', // From Consent Settings
                        ad_storage: 'granted', // From Consent Settings
                        analytics_storage: 'granted', // From Consent Settings
                    },
                ];

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

                window.dataLayer.length.should.eql(2);
                window.dataLayer[0][0].should.equal('consent');
                window.dataLayer[0][1].should.equal('default');
                window.dataLayer[0][2].should.deepEqual(
                    expectedDataLayerBefore1[2]
                );
                window.dataLayer[1][0].should.equal('consent');
                window.dataLayer[1][1].should.equal('update');
                window.dataLayer[1][2].should.deepEqual(
                    expectedDataLayerBefore2[2]
                );

                mParticle.forwarder.process({
                    EventName: 'Homepage',
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventAttributes: {
                        showcase: 'something',
                        test: 'thisoneshouldgetmapped',
                        mp: 'rock',
                    },
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

                window.dataLayer.length.should.eql(3);
                window.dataLayer[2][0].should.equal('consent');
                window.dataLayer[2][1].should.equal('update');
                window.dataLayer[2][2].should.deepEqual(
                    expectedDataLayerAfter[2]
                );

                mParticle.forwarder.process({
                    EventName: 'Homepage',
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventAttributes: {
                        showcase: 'something',
                        test: 'thisoneshouldgetmapped',
                        mp: 'rock',
                    },
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

                window.dataLayer.length.should.eql(4);
                window.dataLayer[3][0].should.equal('consent');
                window.dataLayer[3][1].should.equal('update');
                window.dataLayer[3][2].should.deepEqual(
                    expectedDataLayerFinal[2]
                );
                done();
            });

            it('should NOT construct a Consent State Update Payload if consent DOES NOT change', function (done) {
                mParticle.forwarder.init(
                    {
                        conversionId: 'AW-123123123',
                        enableGtag: 'True',
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

                window.dataLayer.length.should.eql(1);
                window.dataLayer[0][0].should.equal('consent');
                window.dataLayer[0][1].should.equal('default');
                window.dataLayer[0][2].should.deepEqual(
                    expectedDataLayerBefore[2]
                );

                mParticle.forwarder.process({
                    EventName: 'Homepage',
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventAttributes: {
                        showcase: 'something',
                        test: 'thisoneshouldgetmapped',
                        mp: 'rock',
                    },
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

                window.dataLayer.length.should.eql(1);

                done();
            });

            it('should NOT construct any Consent State Payload if consent mappings and settings are undefined', function (done) {
                mParticle.forwarder.init(
                    {
                        conversionId: 'AW-123123123',
                        enableGtag: 'True',
                    },
                    reportService.cb,
                    true
                );

                window.dataLayer.length.should.eql(0);

                mParticle.forwarder.process({
                    EventName: 'Homepage',
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventAttributes: {
                        showcase: 'something',
                        test: 'thisoneshouldgetmapped',
                        mp: 'rock',
                    },
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

                window.dataLayer.length.should.eql(0);
                done();
            });

            it('should construct Consent State Payloads if consent mappings is undefined but settings defaults are defined', function (done) {
                mParticle.forwarder.init(
                    {
                        conversionId: 'AW-123123123',
                        enableGtag: 'True',
                        defaultAdUserDataConsent: 'Granted',
                        defaultAdPersonalizationConsent: 'Denied',
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

                window.dataLayer.length.should.eql(1);
                window.dataLayer[0][0].should.equal('consent');
                window.dataLayer[0][1].should.equal('default');
                window.dataLayer[0][2].should.deepEqual(
                    expectedDataLayerBefore[2]
                );

                mParticle.forwarder.process({
                    EventName: 'Homepage',
                    EventDataType: MessageType.PageEvent,
                    EventCategory: EventType.Navigation,
                    EventAttributes: {
                        showcase: 'something',
                        test: 'thisoneshouldgetmapped',
                        mp: 'rock',
                    },
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

                // There should be no additional consent update events
                // as the consent state is not mapped to any gtag consent settings
                window.dataLayer.length.should.eql(1);
                window.dataLayer[0][0].should.equal('consent');
                window.dataLayer[0][1].should.equal('default');
                window.dataLayer[0][2].should.deepEqual(
                    expectedDataLayerBefore[2]
                );

                done();
            });
        });
    });
});
