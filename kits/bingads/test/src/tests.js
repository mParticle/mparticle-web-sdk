describe('Bing Ads Event Forwarder', function() {
    var ReportingService = function() {
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
    };
    var MessageType = {
        SessionStart: 1,
        SessionEnd: 2,
        PageView: 3,
        PageEvent: 4,
        Commerce: 16,
    };
    var EventType = {
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
        getName: function() {
            return 'This is my name!';
        },
    };
    var ProductActionType = {
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
        getName: function() {
            return 'Action';
        },
    };
    var reportService = new ReportingService();

    before(function() {
        mParticle.EventType = EventType;
        mParticle.MessageType = MessageType;
        mParticle.ProductActionType = ProductActionType;
    });

    beforeEach(function() {
        reportService.reset();
        window.uetq = [];
    });

    describe('Init the BingAds SDK', function() {
        beforeEach(function() {
            mParticle.forwarder.init(
                {
                    tagId: 'tagId',
                },
                reportService.cb,
                true
            );
        });

        it('should init', function(done) {
            window.uetq.length.should.equal(0);

            done();
        });

        it('should init with a consent payload', function(done) {
            mParticle.forwarder.init(
                {
                    tagId: 'tagId',
                },
                reportService.cb,
                false // Disable testMode so we can test init
            );

            // UETQ queues up events as array elements and then parses them internally.
            // The first 3 elements of this array will be the consent payload
            window.uetq.length.should.eql(3);
            window.uetq[0].should.equal('consent');
            window.uetq[1].should.equal('default');
            window.uetq[2].should.eql({
                ad_storage: 'granted',
            });

            done();
        });
    });

    describe('Track Events', function() {
        beforeEach(function() {
            mParticle.forwarder.init(
                {
                    tagId: 'tagId',
                },
                reportService.cb,
                true
            );
        });

        it('should log events', function(done) {
            var obj = {
                EventDataType: MessageType.PageEvent,
                EventName: 'Test Page Event',
                CustomFlags: {
                    'Bing.EventValue': 10,
                },
            };

            mParticle.forwarder.process(obj);

            window.uetq[0].should.have.property('ea', 'pageLoad');
            window.uetq[0].should.have.property('el', 'Test Page Event');
            reportService.cb.should.be.instanceof(Object);

            done();
        });

        it('should log commerce events', function(done) {
            var obj = {
                EventDataType: MessageType.Commerce,
                EventName: 'Test Commerce Event',
                ProductAction: {
                    ProductActionType: ProductActionType.Purchase,
                    TotalAmount: 10,
                },
            };

            mParticle.forwarder.process(obj);

            window.uetq[0].should.have.property('ea', 'eCommerce');
            window.uetq[0].should.have.property('gv', 10);
            window.uetq[0].should.have.property('el', 'Test Commerce Event');
            reportService.cb.should.be.instanceof(Object);

            done();
        });

        it('should not log event without an event name', function(done) {
            mParticle.forwarder.process({
                EventDataType: '',
            });

            window.uetq.length.should.equal(0);

            done();
        });

        it('should not log incorrect events', function(done) {
            mParticle.forwarder.process({
                EventDataType: MessageType.Commerce,
            });

            window.uetq.length.should.equal(0);

            done();
        });
    });

    describe('Consent', function() {
        var consentMap = [
            {
                jsmap: null,
                map: 'marketing_consent',
                maptype: 'ConsentPurposes',
                value: 'ad_storage',
            },
        ];

        beforeEach(function() {
            mParticle.forwarders = [];
        });

        afterEach(function() {
            window.uetq = [];
        });

        it('should consent information to window.uetq', function(done) {
            mParticle.forwarder.init(
                {
                    tagId: 'tagId',
                },
                reportService.cb,
                false // Disable testMode so we can test init
            );

            var obj = {
                EventDataType: MessageType.PageEvent,
                EventName: 'Test Page Event',
                CustomFlags: {
                    'Bing.EventValue': 10,
                },
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

            var expectedConsentPayload = [
                'consent',
                'update',
                { ad_storage: 'granted' },
            ];

            var expectedEventPayload = {
                ea: 'pageLoad',
                ec: 'This is my name!',
                el: 'Test Page Event',
                ev: 10,
            };

            mParticle.forwarder.process(obj);

            // UETQ queues up events as array elements and then parses them internally.
            // The first 3 elements of this array will be the consent payload
            // The 4th element will be the event payload
            window.uetq.length.should.eql(4);
            window.uetq[0].should.equal('consent');
            window.uetq[1].should.equal('default');
            window.uetq[2].should.eql(expectedConsentPayload[2]);
            window.uetq[3].should.eql(expectedEventPayload);

            done();
        });

        it('should construct a Default Consent State Payload of `granted` from Mappings when `defaultAdStorageConsentWeb` is undefined', function(done) {
            mParticle.forwarder.init(
                {
                    tagId: 'tagId',
                    consentMappingWeb:
                        '[{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Marketing&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;ad_storage&quot;}]',
                },
                reportService.cb,
                false // Disable testMode so we can test init
            );

            var expectedConsentPayload = [
                'consent',
                'default',
                { ad_storage: 'granted' }, // Microsoft recommends defaulting to granted
            ];

            // UETQ queues up events as array elements and then parses them internally.
            // The first 3 elements of this array will be the consent payload
            window.uetq.length.should.eql(3);
            window.uetq.should.eql(expectedConsentPayload);

            done();
        });

        it('should construct a Default Consent State Payload from Default Settings and construct an Update Consent State Payload from Mappings', function(done) {
            mParticle.forwarder.init(
                {
                    tagId: 'tagId',
                    consentMappingWeb: JSON.stringify(consentMap),
                    defaultAdStorageConsentWeb: 'Denied', // Should be overridden by user consent state
                },
                reportService.cb,
                false // Disable testMode so we can test init
            );

            var expectedInitialConsentPayload = [
                'consent',
                'default',
                { ad_storage: 'denied' },
            ];

            var expectedUpdatedConsentPayload = [
                'consent',
                'update',
                { ad_storage: 'granted' },
            ];

            window.uetq.length.should.eql(3);
            window.uetq.should.eql(expectedInitialConsentPayload);

            var obj = {
                EventDataType: MessageType.PageEvent,
                EventName: 'Test Page Event',
                CustomFlags: {
                    'Bing.EventValue': 10,
                },
                ConsentState: {
                    getGDPRConsentState: function() {
                        return {
                            marketing_consent: {
                                Consented: true,
                                Timestamp: 1557935884509,
                                ConsentDocument: 'Marketing_Consent',
                                Location: 'This is fake',
                                HardwareId: '123456',
                            },
                        };
                    },

                    getCCPAConsentState: function() {
                        return {
                            data_sale_opt_out: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                        };
                    },
                },
            };

            mParticle.forwarder.process(obj);

            // UETQ should now have 7 elements
            // The first 3 elements of this array will be the consent payload
            // The next 3 elments will be the consent update payload
            // The 7th element will be the event payload

            window.uetq.length.should.eql(7);
            window.uetq[3].should.equal('consent');
            window.uetq[4].should.equal('update');
            window.uetq[5].should.eql(expectedUpdatedConsentPayload[2]);

            done();
        });

        it('should default to `granted` if Consent Settings are `Unspecified`', function(done) {
            mParticle.forwarder.init(
                {
                    tagId: 'tagId',
                    consentMappingWeb: JSON.stringify(consentMap),
                    defaultAdStorageConsentWeb: 'Unspecified', // Should be overridden by user consent state
                },
                reportService.cb,
                false // Disable testMode so we can test init
            );

            var expectedConsentPayload = [
                'consent',
                'default',
                { ad_storage: 'granted' },
            ];

            window.uetq.length.should.eql(3);
            window.uetq.should.eql(expectedConsentPayload);
            done();
        });

        it('should construct a Consent State Update Payload when consent changes and defaultAdStorageConsentWeb is undefined', function(done) {
            mParticle.forwarder.init(
                {
                    tagId: 'tagId',
                    consentMappingWeb: JSON.stringify(consentMap),
                },
                reportService.cb,
                false // Disable testMode so we can test init
            );

            var expectedInitialConsentPayload = [
                'consent',
                'default',
                { ad_storage: 'granted' },
            ];

            var expectedUpdatedConsentPayload = [
                'consent',
                'update',
                { ad_storage: 'denied' },
            ];

            // UETQ queues up events as array elements and then parses them internally.
            // The first 3 elements of this array will be the consent payload

            window.uetq.length.should.eql(3);
            window.uetq[0].should.equal('consent');
            window.uetq[1].should.equal('default');
            window.uetq[2].should.eql(expectedInitialConsentPayload[2]);

            var obj = {
                EventDataType: MessageType.PageEvent,
                EventName: 'Test Page Event',
                CustomFlags: {
                    'Bing.EventValue': 10,
                },
                ConsentState: {
                    getGDPRConsentState: function() {
                        return {
                            marketing_consent: {
                                Consented: false,
                                Timestamp: 1557935884509,
                                ConsentDocument: 'Marketing_Consent',
                                Location: 'This is fake',
                                HardwareId: '123456',
                            },
                        };
                    },

                    getCCPAConsentState: function() {
                        return {
                            data_sale_opt_out: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                        };
                    },
                },
            };

            mParticle.forwarder.process(obj);

            // UETQ should now have 7 elements
            // The first 3 elements of this array will be the initial consent payload
            // The next 3 elments will be the consent update payload
            // The 7th element will be the event payload

            window.uetq.length.should.eql(7);
            window.uetq[3].should.equal('consent');
            window.uetq[4].should.equal('update');
            window.uetq[5].should.eql(expectedUpdatedConsentPayload[2]);

            done();
        });

        it('should construct a Consent State Update Payload when consent changes', function(done) {
            mParticle.forwarder.init(
                {
                    tagId: 'tagId',
                    consentMappingWeb: JSON.stringify(consentMap),
                    defaultAdStorageConsentWeb: 'Denied',
                },
                reportService.cb,
                false // Disable testMode so we can test init
            );

            var expectedInitialConsentPayload = [
                'consent',
                'default',
                { ad_storage: 'denied' },
            ];

            var expectedUpdatedConsentPayload = [
                'consent',
                'update',
                { ad_storage: 'granted' },
            ];

            // UETQ queues up events as array elements and then parses them internally.
            // The first 3 elements of this array will be the consent payload

            window.uetq.length.should.eql(3);
            window.uetq[0].should.equal('consent');
            window.uetq[1].should.equal('default');
            window.uetq[2].should.eql(expectedInitialConsentPayload[2]);

            var obj = {
                EventDataType: MessageType.PageEvent,
                EventName: 'Test Page Event',
                CustomFlags: {
                    'Bing.EventValue': 10,
                },
                ConsentState: {
                    getGDPRConsentState: function() {
                        return {
                            marketing_consent: {
                                Consented: true,
                                Timestamp: 1557935884509,
                                ConsentDocument: 'Marketing_Consent',
                                Location: 'This is fake',
                                HardwareId: '123456',
                            },
                        };
                    },

                    getCCPAConsentState: function() {
                        return {
                            data_sale_opt_out: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                        };
                    },
                },
            };

            mParticle.forwarder.process(obj);

            // UETQ should now have 7 elements
            // The first 3 elements of this array will be the initial consent payload
            // The next 3 elments will be the consent update payload
            // The 7th element will be the event payload

            window.uetq.length.should.eql(7);
            window.uetq[3].should.equal('consent');
            window.uetq[4].should.equal('update');
            window.uetq[5].should.eql(expectedUpdatedConsentPayload[2]);

            done();
        });

        it('should NOT construct a Consent State Update Payload if consent DOES NOT change', function(done) {
            mParticle.forwarder.init(
                {
                    tagId: 'tagId',
                    consentMappingWeb: JSON.stringify(consentMap),
                },
                reportService.cb,
                false // Disable testMode so we can test init
            );

            var expectedInitialConsentPayload = [
                'consent',
                'default',
                { ad_storage: 'granted' },
            ];

            // UETQ queues up events as array elements and then parses them internally.
            // The first 3 elements of this array will be the consent payload

            window.uetq.length.should.eql(3);
            window.uetq[0].should.equal('consent');
            window.uetq[1].should.equal('default');
            window.uetq[2].should.eql(expectedInitialConsentPayload[2]);

            var obj = {
                EventDataType: MessageType.PageEvent,
                EventName: 'Test Page Event',
                CustomFlags: {
                    'Bing.EventValue': 10,
                },
                ConsentState: {
                    getGDPRConsentState: function() {
                        return {
                            marketing_consent: {
                                Consented: true,
                                Timestamp: 1557935884509,
                                ConsentDocument: 'Marketing_Consent',
                                Location: 'This is fake',
                                HardwareId: '123456',
                            },
                        };
                    },

                    getCCPAConsentState: function() {
                        return {
                            data_sale_opt_out: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                        };
                    },
                },
            };

            mParticle.forwarder.process(obj);

            // UETQ should now have 4 elements
            // The first 3 elements of this array will be the initial consent payload
            // The 4th element will be the event payload

            window.uetq.length.should.eql(4);
            window.uetq[3].should.eql({
                ea: 'pageLoad',
                ec: 'This is my name!',
                el: 'Test Page Event',
                ev: 10,
            });
            window.uetq.indexOf('update').should.equal(-1);

            done();
        });

        it('should create a Consent State Default of Granted if consent mappings and settings are undefined', function(done) {
            mParticle.forwarder.init(
                {
                    tagId: 'tagId',
                },
                reportService.cb,
                false // Disable testMode so we can test init
            );

            var expectedInitialConsentPayload = [
                'consent',
                'default',
                { ad_storage: 'granted' },
            ];

            // UETQ queues up events as array elements and then parses them internally.
            // The first 3 elements of this array will be the consent payload

            window.uetq.length.should.eql(3);
            window.uetq[0].should.equal('consent');
            window.uetq[1].should.equal('default');
            window.uetq[2].should.eql(expectedInitialConsentPayload[2]);

            done();
        });

        it('should ONLY construct Default Consent State Payloads if consent mappings is undefined but settings defaults are defined and consent does not change', function(done) {
            mParticle.forwarder.init(
                {
                    tagId: 'tagId',
                    defaultAdStorageConsentWeb: 'Denied',
                },
                reportService.cb,
                false // Disable testMode so we can test init
            );

            var expectedInitialConsentPayload = [
                'consent',
                'default',
                { ad_storage: 'denied' },
            ];

            // UETQ queues up events as array elements and then parses them internally.
            // The first 3 elements of this array will be the consent payload

            window.uetq.length.should.eql(3);
            window.uetq[0].should.equal('consent');
            window.uetq[1].should.equal('default');
            window.uetq[2].should.eql(expectedInitialConsentPayload[2]);

            var obj = {
                EventDataType: MessageType.PageEvent,
                EventName: 'Test Page Event',
                CustomFlags: {
                    'Bing.EventValue': 10,
                },
                ConsentState: {
                    getGDPRConsentState: function() {
                        return {
                            marketing_consent: {
                                Consented: false,
                                Timestamp: 1557935884509,
                                ConsentDocument: 'Marketing_Consent',
                                Location: 'This is fake',
                                HardwareId: '123456',
                            },
                        };
                    },

                    getCCPAConsentState: function() {
                        return {
                            data_sale_opt_out: {
                                Consented: false,
                                Timestamp: Date.now(),
                                Document: 'some_consent',
                            },
                        };
                    },
                },
            };

            mParticle.forwarder.process(obj);

            // UETQ should now have 4 elements
            // The first 3 elements of this array will be the initial consent payload
            // The 4th element will be the event payload

            window.uetq.length.should.eql(4);
            window.uetq[3].should.eql({
                ea: 'pageLoad',
                ec: 'This is my name!',
                el: 'Test Page Event',
                ev: 10,
            });

            done();
        });
    });
});
