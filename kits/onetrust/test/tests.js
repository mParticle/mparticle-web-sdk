/* eslint-disable no-undef*/
var server = new MockHttpServer(),
    MockForwarder = function() {
        var self = this;

        this.initForwarderCalled = false;

        this.apiKey = null;
        this.OnConsentChangedCalled = false;
        this.OnConsentChanged = function(fn) {
            if (!self.OnConsentChangedCalled) {
                self.OnConsentChangedCalled = true;
            } else {
                fn();
            }
        };
    };

function generateMockConsentGroupString(mapping) {
    if (!mapping) {
        return '';
    }
    return (
        '[' +
        [
            mapping
                .map(function(el) {
                    return [
                        '{' +
                            // This is usually just `null` so we don't wrap in `&quot`
                            '&quot;jsmap&quot;:' +
                            el.jsmap,

                        // the consent purpose
                        '&quot;map&quot;:' + '&quot;' + el.map + '&quot;',

                        // This is usally a string value of "ConsentPurposes"
                        '&quot;maptype&quot;:' +
                            '&quot;' +
                            el.maptype +
                            '&quot;',

                        // the corresponding OneTrust cookie value
                        '&quot;value&quot;:' +
                            '&quot;' +
                            el.value +
                            '&quot;' +
                            '}',
                    ].join(',');
                })
                .join(','),
        ].join() +
        ']'
    );
}

function configureOneTrustForwarderAndInit(
    consentGroups,
    vendorIABConsentGroups,
    vendorGoogleConsentGroups,
    vendorGeneralConsentGroups
) {
    mParticle.config = {
        requestConfig: false,
        logLevel: 'none',
        workspaceToken: 'workspaceToken1',
        kitConfigs: [
            {
                name: 'OneTrust',
                settings: {
                    consentGroups: generateMockConsentGroupString(
                        consentGroups
                    ),
                    vendorIABConsentGroups: generateMockConsentGroupString(vendorIABConsentGroups),
                    vendorGoogleConsentGroups: generateMockConsentGroupString(vendorGoogleConsentGroups),
                    vendorGeneralConsentGroups: generateMockConsentGroupString(vendorGeneralConsentGroups),
                },
                eventNameFilters: [],
                eventTypeFilters: [],
                attributeFilters: [],
                screenNameFilters: [],
                pageViewAttributeFilters: [],
                userIdentityFilters: [],
                userAttributeFilters: [],
                moduleId: 1,
                isDebug: false,
                HasDebugString: 'false',
                isVisible: true,
            },
        ],
    };
    mParticle.init('apikey', mParticle.config);
}

describe('OneTrust Forwarder', function() {
    before(function() {
        server.start();
        server.requests = [];
    });

    beforeEach(function() {
        localStorage.clear();
        window.Optanon = new MockForwarder();
        server.requests = [];
        window.mParticleAndroid = null;
        window.mParticle.isIOS = null;
        window.mParticle.useCookieStorage = false;
        mParticle.isDevelopmentMode = false;
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    Store: {},
                    mpid: 'testMPID',
                })
            );
        };
    });

    it('should test consent group parsing', function() {
        var consentGroups = [
            {
                jsmap: null,
                map: 'Test 1',
                maptype: 'ConsentPurposes',
                value: 'test1',
            },
            {
                jsmap: null,
                map: 'Test 2',
                maptype: 'ConsentPurposes',
                value: 'test2',
            },
            {
                jsmap: null,
                map: 'Test 3',
                maptype: 'ConsentPurposes',
                value: 'test3',
            },
        ];

        // Using this method to make sure string doesn't have any unnecessary whitespace
        var expectedString = [
            '[{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Test 1&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;test1&quot;},',
            '{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Test 2&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;test2&quot;},',
            '{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;Test 3&quot;,&quot;maptype&quot;:&quot;ConsentPurposes&quot;,&quot;value&quot;:&quot;test3&quot;}]',
        ].join('');

        var generatedString = generateMockConsentGroupString(consentGroups);

        generatedString.should.equal(expectedString);
    });

    it('should use CCPA regulation if consent purpose is "data_sale_opt_out", otherwise should use GDPR', function(done) {
        var consentGroups = [
            {
                jsmap: null,
                map: 'european_privacy',
                maptype: 'ConsentPurposes',
                value: 'euro_biscuit',
            },
            {
                jsmap: null,
                map: 'data_sale_opt_out',
                maptype: 'ConsentPurposes',
                value: 'cali_cookie',
            },
        ];

        window.OnetrustActiveGroups = ',euro_biscuit,cali_cookie';
        configureOneTrustForwarderAndInit(consentGroups);

        var consent = mParticle.getInstance()._Persistence.getLocalStorage();
        consent.testMPID.con.ccpa.should.have.property('data_sale_opt_out');
        consent.testMPID.con.gdpr['european_privacy'].should.have.property(
            'd',
            'european_privacy'
        );

        done();
    });

    describe('vendor consent', function() {
        var consentGroups = [
            {
                jsmap: null,
                map: 'Test 1',
                maptype: 'ConsentPurposes',
                value: 'test1',
            },
            {
                jsmap: null,
                map: 'Test 2',
                maptype: 'ConsentPurposes',
                value: 'test2',
            },
            {
                jsmap: null,
                map: 'Test 3',
                maptype: 'ConsentPurposes',
                value: 'test3',
            },
        ];
        var vendorIABConsentGroups = [
            {
                jsmap: null,
                map: 'some_consent',
                maptype: 'ConsentPurposes',
                value: '5',
            },
        ];

        var vendorGoogleConsentGroups = [
            {
                jsmap: null,
                map: 'testconsent',
                maptype: 'ConsentPurposes',
                value: '1584',
            },
            {
                jsmap: null,
                map: 'Performance',
                maptype: 'ConsentPurposes',
                value: '2292',
            },
        ];

        var vendorGeneralConsentGroups = [
            {
                jsmap: null,
                map: 'Marketing',
                maptype: 'ConsentPurposes',
                value: 'V1',
            },
            {
                jsmap: null,
                map: 'vendor consent example',
                maptype: 'ConsentPurposes',
                value: 'V2',
            },
        ];

        it('should initialize using stored GDPR regulation API for Vendor Consents', function(done) {
            window.OnetrustActiveGroups = 'V1';
            window.OneTrust = {
                getVendorConsentsRequestV2: function(fn) {
                    var vendorConsent = {
                        addtlConsent: '1~39.43.1584.',
                        vendor: {
                            consents: '00001',
                        },
                    };
                    fn(vendorConsent);
                },
            };
            configureOneTrustForwarderAndInit(
                consentGroups,
                vendorIABConsentGroups,
                vendorGoogleConsentGroups,
                vendorGeneralConsentGroups
            );

            var consent = mParticle.Identity.getCurrentUser()
                .getConsentState()
                .getGDPRConsentState();
            consent.marketing.Consented.should.equal(true);
            consent.testconsent.Consented.should.equal(true);
            consent['vendor consent example'].Consented.should.equal(false);
            consent.performance.Consented.should.equal(false);
            consent['some_consent'].Consented.should.equal(true);

            done();
        });
    });
});

describe('OneTrust re-initialization tests', function() {
    before(function() {
        server.start();
        server.requests = [];
    });

    beforeEach(function() {
        localStorage.clear();
        window.Optanon = new MockForwarder();
        server.requests = [];
        window.mParticleAndroid = null;
        window.mParticle.isIOS = null;
        window.mParticle.useCookieStorage = false;
        mParticle.isDevelopmentMode = false;
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    Store: {},
                    mpid: 'testMPID',
                })
            );
        };
    });

    it('should update consent during initialization if consent has changed', function() {
        var consentGroups = [
            {
                jsmap: null,
                map: 'strictly necessary',
                maptype: 'ConsentPurposes',
                value: 'userEditable1',
            },
        ];

        // Previous version of kit allowed OnetrustActiveGroups to only be numbers, now they are user editable
        // The following example includes both examples to allow for maximum flexibility in the test
        window.OnetrustActiveGroups = ',1,2,4,userEditable1,userEditable2';

        // After initializing the kit once, the user will have the strictly necessary consent associated with it
        // as true
        configureOneTrustForwarderAndInit(consentGroups);

        var consentBefore = mParticle.Identity.getCurrentUser()
            .getConsentState()
            .getGDPRConsentState()['strictly necessary'];
        var consentTimestampBefore = consentBefore.Timestamp;
        consentTimestampBefore.should.be.ok();
        // Update to remove userEditable1, thus having OneTrust set this consent to false
        window.OnetrustActiveGroups = ',1,2,4,userEditable2';

        // When we re-initialize consent, the strictly necessary consent has not been updated
        // because there is no change in consent
        configureOneTrustForwarderAndInit(consentGroups);

        var consentAfter = mParticle.Identity.getCurrentUser()
            .getConsentState()
            .getGDPRConsentState()['strictly necessary'];

        var consentTimestampAfter = consentAfter.Timestamp;
        consentTimestampAfter.should.be.ok();

        // the timestamps should not equal each other because the timestamp has been updated due to the consent change
        consentTimestampBefore.should.not.equal(consentTimestampAfter);
    });

    it('should not update consent during initialization if consent does not change', function() {
        var consentGroups = [
            {
                jsmap: null,
                map: 'strictly necessary',
                maptype: 'ConsentPurposes',
                value: 'userEditable1',
            },
        ];

        // Previous version of kit allowed OnetrustActiveGroups to only be numbers, now they are user editable
        // The following example includes both examples to allow for maximum flexibility in the test
        window.OnetrustActiveGroups = ',1,2,4,userEditable1,userEditable2';

        // After initializing the kit once, the user will have the strictly necessary consent associated with it
        // as true
        configureOneTrustForwarderAndInit(consentGroups);

        var consentBefore = mParticle.Identity.getCurrentUser()
            .getConsentState()
            .getGDPRConsentState()['strictly necessary'];
        var consentTimestampBefore = consentBefore.Timestamp;
        consentTimestampBefore.should.be.ok();

        // When we re-initialize consent, the strictly necessary consent has not been updated
        // because there is no change in consent
        configureOneTrustForwarderAndInit(consentGroups);

        var consentAfter = mParticle.Identity.getCurrentUser()
            .getConsentState()
            .getGDPRConsentState()['strictly necessary'];

        var consentTimestampAfter = consentAfter.Timestamp;
        consentTimestampAfter.should.be.ok();

        // The timestamps should be the same because consent was not updated.
        consentTimestampBefore.should.equal(consentTimestampAfter);
    });
});
