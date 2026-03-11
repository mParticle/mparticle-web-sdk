// If we are testing this in a browser runner, sinon is loaded via script tag
if (typeof require !== 'undefined') {
    var sinon = require('sinon');
}

// If we are testing this in a node environemnt, we load the common.js Braze kit

var GA4ServerSideInstance;
if (typeof require !== 'undefined') {
    GA4ServerSideInstance = require('../../dist/GoogleAnalytics4EventForwarderServerSide-Kit.common')
        .default;
} else {
    GA4ServerSideInstance = window.mParticleGA4.default;
}

/* eslint-disable no-undef*/
describe('Google Analytics 4 Server Side', function() {
    // -------------------DO NOT EDIT ANYTHING BELOW THIS LINE-----------------------
    var ReportingService = function() {
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
    // -------------------START EDITING BELOW:-----------------------
    var mockGA4EventForwarder = function() {
        var self = this;

        // create properties for each type of event you want tracked, see below for examples
        this.initializeCalled = false;

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

    var kitSettings = {
        clientKey: '123456',
        appId: 'abcde',
        externalUserIdentityType: 'customerId',
        measurementId: 'testMeasurementId',
    };

    describe('initialization', function() {
        it('should initialize gtag and the dataLayer', function(done) {
            (typeof window.gtag === 'undefined').should.be.true();
            (typeof window.dataLayer === 'undefined').should.be.true();
            window.mockGA4EventForwarder = new mockGA4EventForwarder();
            // Include any specific settings that is required for initializing your SDK here
            mParticle.forwarder.init(kitSettings, reportService.cb, true);

            window.gtag.should.be.ok();
            window.dataLayer.should.be.ok();

            done();
        });

        it('should set the measurement ID as an Integration Attribute', function(done) {
            var sandbox = sinon.createSandbox();
            var mPStub = sinon.stub(window.mParticle);

            window.mockGA4EventForwarder = new mockGA4EventForwarder();

            mParticle.forwarder.init(kitSettings, reportService.cb, true);

            // GTAG will normally trigger every callback in the DataLayer
            // asynchronously. However, since we are mocking GTAG within our tests,
            // we need to manually trigger the callback directly to verify that
            // mParticle.setIntegrationAttribute is eventually called with
            // clientID via GTAG.
            // The specific 'get' request is index 2, and the callback is
            // index 3. We are manually passing a string into the callback
            // as GTAG seems to hash the id internally.
            dataLayer[3][3]('test-client-id');

            // Verify that data later triggers setClientId
            mPStub.setIntegrationAttribute.calledWith(160, {
                client_id: 'test-client-id',
            });

            // Set Integration Delay should be called twice upon init
            // First, as true, then false after client ID is registered
            mPStub._setIntegrationDelay.getCall(0).calledWith(160, true);
            mPStub._setIntegrationDelay.getCall(1).calledWith(160, false);

            sandbox.restore();
            done();
        });

        it('should have a property of suffix', function() {
            window.mParticle.forwarder.should.have.property('suffix', 'Server');
        });

        it('should register a forwarder with version number onto a config', function() {
            var config = {};
            GA4ServerSideInstance.register(config);
            config.should.have.property('kits');
            config.kits.should.have.property('GoogleAnalytics4-Server');
        });
    });
});
