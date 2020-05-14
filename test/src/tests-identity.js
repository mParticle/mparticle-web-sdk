import Constants from '../../src/constants';
import Utils from './utils';
import sinon from 'sinon';
import { urls, apiKey,
    testMPID,
    MPConfig,
    workspaceCookieName } from './config';

var getLocalStorage = Utils.getLocalStorage,
    setLocalStorage = Utils.setLocalStorage,
    findCookie = Utils.findCookie,
    forwarderDefaultConfiguration = Utils.forwarderDefaultConfiguration,
    getLocalStorageProducts = Utils.getLocalStorageProducts,
    getEvent = Utils.getEvent,
    getIdentityEvent = Utils.getIdentityEvent,
    setCookie = Utils.setCookie,
    MockForwarder = Utils.MockForwarder,
    HTTPCodes = Constants.HTTPCodes,
    mockServer;

describe('identity', function() {
    beforeEach(function() {
        delete mParticle.config.useCookieStorage;
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.eventsV2, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, Store: {}})
        ]);

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        mockServer.restore();
        mParticle._resetForTests(MPConfig);
    });

    it('should respect consent rules on consent-change', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.isDevelopmentMode = false;
        var mockForwarder = new MockForwarder('MockForwarder1');
        mockForwarder.register(window.mParticle.config);

        var config1 = forwarderDefaultConfiguration('MockForwarder1', 1);
        config1.filteringConsentRuleValues = {
            includeOnMatch: true,
            values: [
                {
                    consentPurpose: mParticle.generateHash('1' + 'foo purpose 1'),
                    hasConsented: true,
                },
            ],
        };

        var mockForwarder2 = new MockForwarder('MockForwarder2', 2);
        mockForwarder2.register(window.mParticle.config);

        var config2 = forwarderDefaultConfiguration('MockForwarder2', 2);
        config2.filteringConsentRuleValues = {
            includeOnMatch: true,
            values: [
                {
                    consentPurpose: mParticle.generateHash('1' + 'foo purpose 2'),
                    hasConsented: true,
                },
            ],
        };

        window.mParticle.config.kitConfigs.push(config1);
        window.mParticle.config.kitConfigs.push(config2);

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.init(apiKey, window.mParticle.config);

        var activeForwarders = mParticle.getInstance()._getActiveForwarders();
        activeForwarders.length.should.not.be.ok();

        var consentState = mParticle.Consent.createConsentState();
        consentState.addGDPRConsentState(
            'foo purpose 1',
            mParticle.Consent.createGDPRConsent(true)
        );
        mParticle.Identity.getCurrentUser().setConsentState(consentState);

        activeForwarders = mParticle.getInstance()._getActiveForwarders();
        activeForwarders.length.should.equal(1);
        activeForwarders[0].name.should.equal('MockForwarder1');

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID2', is_logged_in: false }),
        ]);

        mParticle.Identity.login();
        activeForwarders = mParticle.getInstance()._getActiveForwarders();
        activeForwarders.length.should.not.be.ok();

        consentState = mParticle.Consent.createConsentState();
        consentState.addGDPRConsentState(
            'foo purpose 2',
            mParticle.Consent.createGDPRConsent(true)
        );
        mParticle.Identity.getCurrentUser().setConsentState(consentState);

        activeForwarders = mParticle.getInstance()._getActiveForwarders();
        activeForwarders.length.should.equal(1);
        activeForwarders[0].name.should.equal('MockForwarder2');

        done();
    });

    it('should not do an identity swap if there is no MPID change', function(done) {
        mParticle.init(apiKey, window.mParticle.config);
        var cookiesBefore = getLocalStorage();
        mParticle.getInstance()._Identity.checkIdentitySwap(testMPID, testMPID);

        var cookiesAfter = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        cookiesBefore.cu.should.equal(cookiesAfter.cu);

        done();
    });

    it('should do an identity swap if there is an MPID change', function(done) {
        mParticle.init(apiKey, window.mParticle.config);
        var cookiesBefore = getLocalStorage();

        mParticle
            .getInstance()
            ._Identity.checkIdentitySwap(testMPID, 'currentMPID');

        var cookiesAfter = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        cookiesBefore.cu.should.equal(testMPID);

        cookiesAfter.cu.should.equal('currentMPID');

        done();
    });

    it('should store all MPIDs associated with a sessionId, then clear MPIDs from currentSessionMPIDs when a new session starts', function(done) {
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mParticle.Identity.login();
        var localStorageDataBeforeSessionEnd = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        localStorageDataBeforeSessionEnd.gs.csm.length.should.equal(2);

        mockServer.respondWith(urls.eventsV2, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', Store: {}})
        ]);

        mParticle.endSession();
        var localStorageDataAfterSessionEnd1 = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        localStorageDataAfterSessionEnd1.gs.should.not.have.property('csm');

        mParticle.logEvent('hi');
        mParticle.Identity.login();

        var localStorageAfterLoggingEvent = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        localStorageAfterLoggingEvent.gs.csm.length.should.equal(1);

        done();
    });

    it('localStorage - should switch user cookies to new mpid details from cookies when a new mpid is provided', function(done) {
        mParticle._resetForTests(MPConfig);
        window.mParticle.config.useCookieStorage = false;

        setLocalStorage();

        mParticle.init(apiKey, window.mParticle.config);

        var cookies1 = mParticle.getInstance()._Persistence.getLocalStorage();
        cookies1.cu.should.equal(testMPID);
        cookies1[testMPID].should.have.property('csd');

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mParticle.Identity.login();
        var cookiesAfterMPIDChange = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        cookiesAfterMPIDChange.should.have.properties([
            'cu',
            'otherMPID',
            testMPID,
            'gs',
        ]);
        cookiesAfterMPIDChange.should.have.property('cu', 'otherMPID');
        cookiesAfterMPIDChange[testMPID].should.have.property('csd');

        var props = [
            'ie',
            'sa',
            'ss',
            'dt',
            'les',
            'av',
            'cgid',
            'das',
            'sid',
            'c',
            'mpid',
            'cp',
        ];

        props.forEach(function(prop) {
            cookiesAfterMPIDChange[testMPID].should.not.have.property(prop);
            cookiesAfterMPIDChange['otherMPID'].should.not.have.property(prop);
        });

        done();
    });

    it('cookies - should switch user cookies to new mpid details from cookies when a new mpid is provided', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.useCookieStorage = true;

        setLocalStorage();

        mParticle.init(apiKey, window.mParticle.config);

        var cookiesAfterInit = findCookie();
        cookiesAfterInit.should.have.properties('gs', 'cu', testMPID);

        var props1 = [
            'mpid',
            'ui',
            'ua',
            'les',
            'sid',
            'ie',
            'dt',
            'sa',
            'ss',
            'cp',
        ];

        props1.forEach(function(prop) {
            cookiesAfterInit.should.not.have.property(prop);
        });

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mParticle.Identity.login();

        var cookiesAfterMPIDChange = findCookie();
        cookiesAfterMPIDChange.should.have.properties([
            'cu',
            'gs',
            'otherMPID',
            testMPID,
        ]);
        cookiesAfterMPIDChange.should.have.property('cu', 'otherMPID');

        var props2 = [
            'ie',
            'sa',
            'ss',
            'dt',
            'les',
            'av',
            'cgid',
            'das',
            'sid',
            'c',
            'mpid',
            'cp',
        ];

        props2.forEach(function(prop) {
            cookiesAfterMPIDChange[testMPID].should.not.have.property(prop);
            cookiesAfterMPIDChange['otherMPID'].should.not.have.property(prop);
        });

        done();
    });

    it('should swap property identityType for identityName', function(done) {
        var data = { userIdentities: {} };
        data.userIdentities.other = 'id1';
        data.userIdentities.customerid = 'id2';
        data.userIdentities.facebook = 'id3';
        data.userIdentities.twitter = 'id4';
        data.userIdentities.google = 'id5';
        data.userIdentities.microsoft = 'id6';
        data.userIdentities.yahoo = 'id7';
        data.userIdentities.email = 'id8';
        data.userIdentities.facebookcustomaudienceid = 'id9';
        data.userIdentities.other2 = 'id10';
        data.userIdentities.other3 = 'id11';
        data.userIdentities.other4 = 'id12';

        var count = 0;
        for (var key in data.userIdentities) {
            mParticle.IdentityType.getIdentityType(key).should.equal(count);
            count++;
            // 8 is alias, which was removed
            if (count === 8) {
                count = 9;
            }
        }

        done();
    });

    it('should create a proper identity request', function(done) {
        var data = { userIdentities: {} },
            platform = 'web',
            sdkVendor = 'mparticle',
            sdkVersion = '1.0.0',
            deviceId = 'abc',
            context = null;

        data.userIdentities.other = 'id1';
        data.userIdentities.customerid = 'id2';
        data.userIdentities.facebook = 'id3';
        data.userIdentities.twitter = 'id4';
        data.userIdentities.google = 'id5';
        data.userIdentities.microsoft = 'id6';
        data.userIdentities.yahoo = 'id7';
        data.userIdentities.email = 'id8';
        data.userIdentities.facebookcustomaudienceid = 'id9';
        data.userIdentities.other2 = 'id10';
        data.userIdentities.other3 = 'id11';
        data.userIdentities.other4 = 'id12';
        data.userIdentities.other5 = 'id13';
        data.userIdentities.other6 = 'id14';
        data.userIdentities.other7 = 'id15';
        data.userIdentities.other8 = 'id16';
        data.userIdentities.other9 = 'id17';
        data.userIdentities.other10 = 'id18';
        data.userIdentities.mobile_number = 'id19';
        data.userIdentities.phone_number_2 = 'id20';
        data.userIdentities.phone_number_3 = 'id21';

        var identityRequest = mParticle
            .getInstance()
            ._Identity.IdentityRequest.createIdentityRequest(
                data,
                platform,
                sdkVendor,
                sdkVersion,
                deviceId,
                context,
                testMPID
            );
        identityRequest.should.have.properties([
            'client_sdk',
            'environment',
            'context',
            'known_identities',
            'previous_mpid',
            'request_id',
            'request_timestamp_ms',
        ]);
        identityRequest.client_sdk.should.have.properties([
            'platform',
            'sdk_vendor',
            'sdk_version',
        ]);
        identityRequest.client_sdk.platform.should.equal(platform);
        identityRequest.client_sdk.sdk_vendor.should.equal(sdkVendor);
        identityRequest.environment.should.equal('production');
        identityRequest.previous_mpid.should.equal(testMPID);
        identityRequest.known_identities.should.have.properties([
            'other',
            'customerid',
            'facebook',
            'twitter',
            'google',
            'microsoft',
            'yahoo',
            'email',
            'facebookcustomaudienceid',
            'other2',
            'other3',
            'other4',
            'other5',
            'other6',
            'other7',
            'other8',
            'other9',
            'other10',
            'phone_number_2',
            'phone_number_3',
            'mobile_number',
            'device_application_stamp',
        ]);
        identityRequest.known_identities.other.should.equal('id1');
        identityRequest.known_identities.customerid.should.equal('id2');
        identityRequest.known_identities.facebook.should.equal('id3');
        identityRequest.known_identities.twitter.should.equal('id4');
        identityRequest.known_identities.google.should.equal('id5');
        identityRequest.known_identities.microsoft.should.equal('id6');
        identityRequest.known_identities.yahoo.should.equal('id7');
        identityRequest.known_identities.email.should.equal('id8');
        identityRequest.known_identities.facebookcustomaudienceid.should.equal(
            'id9'
        );
        identityRequest.known_identities.other2.should.equal('id10');
        identityRequest.known_identities.other3.should.equal('id11');
        identityRequest.known_identities.other4.should.equal('id12');
        identityRequest.known_identities.other5.should.equal('id13');
        identityRequest.known_identities.other6.should.equal('id14');
        identityRequest.known_identities.other7.should.equal('id15');
        identityRequest.known_identities.other8.should.equal('id16');
        identityRequest.known_identities.other9.should.equal('id17');
        identityRequest.known_identities.other10.should.equal('id18');
        identityRequest.known_identities.mobile_number.should.equal('id19');
        identityRequest.known_identities.phone_number_2.should.equal('id20');
        identityRequest.known_identities.phone_number_3.should.equal('id21');

        done();
    });

    it('should create a proper modify identity request', function(done) {
        var oldIdentities = {},
            platform = 'web',
            sdkVendor = 'mparticle',
            sdkVersion = '1.0.0',
            deviceId = 'abc',
            context = null;

        oldIdentities['other'] = 'id1';
        oldIdentities['customerid'] = 'id2';
        oldIdentities['facebook'] = 'id3';
        oldIdentities['twitter'] = 'id4';
        oldIdentities['google'] = 'id5';
        oldIdentities['microsoft'] = 'id6';
        oldIdentities['yahoo'] = 'id7';
        oldIdentities['email'] = 'id8';
        oldIdentities['facebookcustomaudienceid'] = 'id9';
        oldIdentities['other1'] = 'id10';
        oldIdentities['other2'] = 'id11';
        oldIdentities['other3'] = 'id12';
        oldIdentities['other4'] = 'id13';
        oldIdentities['other5'] = 'id14';
        oldIdentities['other6'] = 'id15';
        oldIdentities['other7'] = 'id16';
        oldIdentities['other8'] = 'id17';
        oldIdentities['other9'] = 'id18';
        oldIdentities['other10'] = 'id19';
        oldIdentities['mobile_number'] = 'id20';
        oldIdentities['phone_number_2'] = 'id21';
        oldIdentities['phone_number_3'] = 'id22';
        var newIdentities = {};
        newIdentities.other = 'id14';
        newIdentities.customerid = 'id15';
        newIdentities.facebook = 'id16';
        newIdentities.twitter = 'id17';
        newIdentities.google = 'id18';
        newIdentities.microsoft = 'id19';
        newIdentities.yahoo = 'id20';
        newIdentities.email = 'id21';
        newIdentities.facebookcustomaudienceid = 'id22';
        newIdentities.other1 = 'id23';
        newIdentities.other2 = 'id24';
        newIdentities.other3 = 'id25';
        newIdentities.other4 = 'id26';
        newIdentities.other5 = 'id27';
        newIdentities.other6 = 'id28';
        newIdentities.other7 = 'id29';
        newIdentities.other8 = 'id30';
        newIdentities.other9 = 'id31';
        newIdentities.other10 = 'id32';
        newIdentities.mobile_number = 'id33';
        newIdentities.phone_number_2 = 'id34';
        newIdentities.phone_number_3 = 'id35';

        var identityRequest = mParticle
            .getInstance()
            ._Identity.IdentityRequest.createModifyIdentityRequest(
                oldIdentities,
                newIdentities,
                platform,
                sdkVendor,
                sdkVersion,
                deviceId,
                context,
                testMPID
            );
        identityRequest.should.have.properties([
            'client_sdk',
            'environment',
            'identity_changes',
            'request_id',
            'request_timestamp_ms',
        ]);
        identityRequest.client_sdk.should.have.properties([
            'platform',
            'sdk_vendor',
            'sdk_version',
        ]);
        identityRequest.client_sdk.platform.should.equal('web');
        identityRequest.client_sdk.sdk_vendor.should.equal('mparticle');
        identityRequest.environment.should.equal('production');
        identityRequest.identity_changes[0].should.have.properties([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        identityRequest.identity_changes[0].old_value.should.equal('id1');
        identityRequest.identity_changes[0].identity_type.should.equal('other');
        identityRequest.identity_changes[0].new_value.should.equal('id14');

        identityRequest.identity_changes[1].should.have.properties([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        identityRequest.identity_changes[1].old_value.should.equal('id2');
        identityRequest.identity_changes[1].identity_type.should.equal(
            'customerid'
        );
        identityRequest.identity_changes[1].new_value.should.equal('id15');

        identityRequest.identity_changes[2].should.have.properties([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        identityRequest.identity_changes[2].old_value.should.equal('id3');
        identityRequest.identity_changes[2].identity_type.should.equal(
            'facebook'
        );
        identityRequest.identity_changes[2].new_value.should.equal('id16');

        identityRequest.identity_changes[3].should.have.properties([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        identityRequest.identity_changes[3].old_value.should.equal('id4');
        identityRequest.identity_changes[3].identity_type.should.equal(
            'twitter'
        );
        identityRequest.identity_changes[3].new_value.should.equal('id17');

        identityRequest.identity_changes[4].should.have.properties([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        identityRequest.identity_changes[4].old_value.should.equal('id5');
        identityRequest.identity_changes[4].identity_type.should.equal(
            'google'
        );
        identityRequest.identity_changes[4].new_value.should.equal('id18');

        identityRequest.identity_changes[5].should.have.properties([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        identityRequest.identity_changes[5].old_value.should.equal('id6');
        identityRequest.identity_changes[5].identity_type.should.equal(
            'microsoft'
        );
        identityRequest.identity_changes[5].new_value.should.equal('id19');

        identityRequest.identity_changes[6].should.have.properties([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        identityRequest.identity_changes[6].old_value.should.equal('id7');
        identityRequest.identity_changes[6].identity_type.should.equal('yahoo');
        identityRequest.identity_changes[6].new_value.should.equal('id20');

        identityRequest.identity_changes[7].should.have.properties([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        identityRequest.identity_changes[7].old_value.should.equal('id8');
        identityRequest.identity_changes[7].identity_type.should.equal('email');
        identityRequest.identity_changes[7].new_value.should.equal('id21');

        identityRequest.identity_changes[8].should.have.properties([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        identityRequest.identity_changes[8].old_value.should.equal('id9');
        identityRequest.identity_changes[8].identity_type.should.equal(
            'facebookcustomaudienceid'
        );
        identityRequest.identity_changes[8].new_value.should.equal('id22');

        identityRequest.identity_changes[9].should.have.properties([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        identityRequest.identity_changes[9].old_value.should.equal('id10');
        identityRequest.identity_changes[9].identity_type.should.equal(
            'other1'
        );
        identityRequest.identity_changes[9].new_value.should.equal('id23');

        identityRequest.identity_changes[10].should.have.properties([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        identityRequest.identity_changes[10].old_value.should.equal('id11');
        identityRequest.identity_changes[10].identity_type.should.equal(
            'other2'
        );
        identityRequest.identity_changes[10].new_value.should.equal('id24');

        identityRequest.identity_changes[11].should.have.properties([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        identityRequest.identity_changes[11].old_value.should.equal('id12');
        identityRequest.identity_changes[11].identity_type.should.equal(
            'other3'
        );
        identityRequest.identity_changes[11].new_value.should.equal('id25');

        identityRequest.identity_changes[12].should.have.properties([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        identityRequest.identity_changes[12].old_value.should.equal('id13');
        identityRequest.identity_changes[12].identity_type.should.equal(
            'other4'
        );
        identityRequest.identity_changes[12].new_value.should.equal('id26');

        identityRequest.identity_changes[13].old_value.should.equal('id14');
        identityRequest.identity_changes[13].identity_type.should.equal(
            'other5'
        );
        identityRequest.identity_changes[13].new_value.should.equal('id27');

        identityRequest.identity_changes[14].old_value.should.equal('id15');
        identityRequest.identity_changes[14].identity_type.should.equal(
            'other6'
        );
        identityRequest.identity_changes[14].new_value.should.equal('id28');

        identityRequest.identity_changes[15].old_value.should.equal('id16');
        identityRequest.identity_changes[15].identity_type.should.equal(
            'other7'
        );
        identityRequest.identity_changes[15].new_value.should.equal('id29');

        identityRequest.identity_changes[16].old_value.should.equal('id17');
        identityRequest.identity_changes[16].identity_type.should.equal(
            'other8'
        );
        identityRequest.identity_changes[16].new_value.should.equal('id30');

        identityRequest.identity_changes[17].old_value.should.equal('id18');
        identityRequest.identity_changes[17].identity_type.should.equal(
            'other9'
        );
        identityRequest.identity_changes[17].new_value.should.equal('id31');

        identityRequest.identity_changes[18].old_value.should.equal('id19');
        identityRequest.identity_changes[18].identity_type.should.equal(
            'other10'
        );
        identityRequest.identity_changes[18].new_value.should.equal('id32');
        
        identityRequest.identity_changes[19].old_value.should.equal('id20');
        identityRequest.identity_changes[19].identity_type.should.equal(
            'mobile_number'
        );
        identityRequest.identity_changes[19].new_value.should.equal('id33');

        identityRequest.identity_changes[20].old_value.should.equal('id21');
        identityRequest.identity_changes[20].identity_type.should.equal(
            'phone_number_2'
        );
        identityRequest.identity_changes[20].new_value.should.equal('id34');

        identityRequest.identity_changes[21].old_value.should.equal('id22');
        identityRequest.identity_changes[21].identity_type.should.equal(
            'phone_number_3'
        );
        identityRequest.identity_changes[21].new_value.should.equal('id35');

        done();
    });

    it('should not make a request when an invalid request is sent to login', function(done) {
        mockServer.requests = [];

        var identityAPIRequest1 = {
            userIdentities: 'badUserIdentitiesString',
        };
        mParticle.Identity.login(identityAPIRequest1);

        var badData1 = getIdentityEvent(mockServer.requests, 'login');
        Should(badData1).not.be.ok();

        var identityAPIRequest2 = {
            userIdentities: ['bad', 'user', 'identities', 'array'],
        };
        mParticle.Identity.login(identityAPIRequest2);

        var badData2 = getIdentityEvent(mockServer.requests, 'login');
        Should(badData2).not.be.ok();

        var identityAPIRequest3 = {
            userIdentities: undefined,
        };
        mParticle.Identity.login(identityAPIRequest3);

        var badData3 = getIdentityEvent(mockServer.requests, 'login');
        Should(badData3).not.be.ok();

        var identityAPIRequest4 = {
            userIdentities: true,
        };
        mParticle.Identity.login(identityAPIRequest4);

        var badData4 = getIdentityEvent(mockServer.requests, 'login');
        Should(badData4).not.be.ok();

        done();
    });

    it('should not make a request when an invalid request is sent to logout', function(done) {
        mockServer.requests = [];
        var identityAPIRequest1 = {
            userIdentities: 'badUserIdentitiesString',
        };
        mParticle.Identity.logout(identityAPIRequest1);

        var badData1 = getIdentityEvent(mockServer.requests, 'logout');
        Should(badData1).not.be.ok();

        var identityAPIRequest2 = {
            userIdentities: ['bad', 'user', 'identities', 'array'],
        };
        mParticle.Identity.logout(identityAPIRequest2);

        var badData2 = getIdentityEvent(mockServer.requests, 'logout');
        Should(badData2).not.be.ok();

        var identityAPIRequest3 = {
            userIdentities: undefined,
        };
        mParticle.Identity.logout(identityAPIRequest3);

        var badData3 = getIdentityEvent(mockServer.requests, 'logout');
        Should(badData3).not.be.ok();

        var identityAPIRequest4 = {
            userIdentities: true,
        };

        mParticle.Identity.logout(identityAPIRequest4);
        var badData4 = getIdentityEvent(mockServer.requests, 'logout');
        Should(badData4).not.be.ok();

        done();
    });

    it('should not make a request when an invalid request is sent to modify', function(done) {
        mockServer.requests = [];
        var identityAPIRequest1 = {
            userIdentities: 'badUserIdentitiesString',
        };
        mParticle.Identity.modify(identityAPIRequest1);

        var badData1 = getIdentityEvent(mockServer.requests, 'modify');
        Should(badData1).not.be.ok();

        var identityAPIRequest2 = {
            userIdentities: ['bad', 'user', 'identities', 'array'],
        };
        mParticle.Identity.modify(identityAPIRequest2);

        var badData2 = getIdentityEvent(mockServer.requests, 'modify');
        Should(badData2).not.be.ok();

        var identityAPIRequest3 = {
            userIdentities: null,
        };
        mParticle.Identity.modify(identityAPIRequest3);

        var badData3 = getIdentityEvent(mockServer.requests, 'modify');
        Should(badData3).not.be.ok();

        var identityAPIRequest4 = {
            userIdentities: undefined,
        };
        mParticle.Identity.modify(identityAPIRequest4);

        var badData4 = getIdentityEvent(mockServer.requests, 'modify');
        Should(badData4).not.be.ok();

        var identityAPIRequest5 = {
            userIdentities: true,
        };
        mParticle.Identity.modify(identityAPIRequest5);
        var badData5 = getIdentityEvent(mockServer.requests, 'modify');
        Should(badData5).not.be.ok();

        done();
    });

    it('should not make a request when an invalid request is sent to identify', function(done) {
        mockServer.requests = [];
        var identityAPIRequest1 = {
            userIdentities: 'badUserIdentitiesString',
        };
        mParticle.Identity.identify(identityAPIRequest1);

        var badData1 = getIdentityEvent(mockServer.requests, 'identify');
        Should(badData1).not.be.ok();

        var identityAPIRequest2 = {
            userIdentities: ['bad', 'user', 'identities', 'array'],
        };
        mParticle.Identity.identify(identityAPIRequest2);

        var badData2 = getIdentityEvent(mockServer.requests, 'identify');
        Should(badData2).not.be.ok();

        var identityAPIRequest3 = {
            userIdentities: undefined,
        };
        mParticle.Identity.identify(identityAPIRequest3);

        var badData3 = getIdentityEvent(mockServer.requests, 'identify');
        Should(badData3).not.be.ok();

        var identityAPIRequest4 = {
            userIdentities: true,
        };
        mParticle.Identity.identify(identityAPIRequest4);
        var badData4 = getIdentityEvent(mockServer.requests, 'identify');
        Should(badData4).not.be.ok();

        done();
    });

    it('should have old_value === null when there is no previous identity of a certain type and a new identity of that type', function(done) {
        var oldIdentities = {};
        oldIdentities['facebook'] = 'old_facebook_id';
        var newIdentities = {};
        newIdentities.other = 'new_other_id';
        newIdentities.facebook = 'new_facebook_id';

        var identityRequest = mParticle
            .getInstance()
            ._Identity.IdentityRequest.createModifyIdentityRequest(
                oldIdentities,
                newIdentities
            );

        identityRequest.identity_changes[0].should.have.properties([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        identityRequest.identity_changes[0].should.have.property(
            'old_value',
            null
        );
        identityRequest.identity_changes[0].identity_type.should.equal('other');
        identityRequest.identity_changes[0].new_value.should.equal(
            'new_other_id'
        );

        identityRequest.identity_changes[1].should.have.properties([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        identityRequest.identity_changes[1].should.have.property(
            'old_value',
            'old_facebook_id'
        );
        identityRequest.identity_changes[1].identity_type.should.equal(
            'facebook'
        );
        identityRequest.identity_changes[1].new_value.should.equal(
            'new_facebook_id'
        );

        done();
    });

    it('should have new_value === null when there is a previous identity of a certain type and no new identity of that type', function(done) {
        var oldIdentities = {};
        oldIdentities['other'] = 'old_other_id';
        oldIdentities['facebook'] = 'old_facebook_id';
        var newIdentities = {};
        newIdentities.facebook = 'new_facebook_id';

        var identityRequest = mParticle
            .getInstance()
            ._Identity.IdentityRequest.createModifyIdentityRequest(
                oldIdentities,
                newIdentities
            );

        identityRequest.identity_changes[0].should.have.properties([
            'identity_type',
            'new_value',
            'old_value',
        ]);
        identityRequest.identity_changes[0].old_value.should.equal(
            'old_facebook_id'
        );
        identityRequest.identity_changes[0].identity_type.should.equal(
            'facebook'
        );
        identityRequest.identity_changes[0].new_value.should.equal(
            'new_facebook_id'
        );

        identityRequest.identity_changes.length.should.equal(1);

        done();
    });

    it('should create a proper send request when passing identities to modify', function(done) {
        var identityAPIData = {
            userIdentities: {
                email: 'rob@gmail.com',
            },
        };
        mParticle.init(apiKey, window.mParticle.config);
        mockServer.respondWith(urls.modify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.Identity.modify(identityAPIData);
        var data = getIdentityEvent(mockServer.requests, 'modify');

        data.identity_changes.length.should.equal(1);
        data.identity_changes[0].should.have.properties(
            'old_value',
            'new_value',
            'identity_type'
        );
        data.identity_changes[0].should.have.properties(
            'old_value',
            'new_value',
            'identity_type'
        );

        done();
    });

    it('Ensure that automatic identify is not called more than once.', function(done) {
        mParticle._resetForTests(MPConfig);
        var spy = sinon.spy();
        mParticle.config.identityCallback = spy;

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mParticle.init(apiKey, window.mParticle.config);
        spy.calledOnce.should.be.ok();
        mParticle.startNewSession();
        spy.calledOnce.should.be.ok();

        done();
    });

    it('queue events when MPID is 0, and then flush events once MPID changes', function(done) {
        mParticle._resetForTests(MPConfig);

        mockServer.respondWith(urls.eventsV2, [
            200,
            {},
            JSON.stringify({})
        ]);

        mockServer.respondWith(urls.identify, [
            0,
            {},
            JSON.stringify({}),
        ]);

        mParticle.init(apiKey, window.mParticle.config);

        mockServer.requests = [];
        mParticle.logEvent('Test1');
        var event1 = getEvent(mockServer.requests, 'Test1');
        Should(event1).not.be.ok();

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mParticle.logEvent('Test2');
        mParticle.Identity.login();

        // server requests will have AST, sessionStart, Test1, Test2, and login
        mockServer.requests.length.should.equal(5);
        event1 = getEvent(mockServer.requests, 'Test1');
        var event2 = getEvent(mockServer.requests, 'Test2');
        var event3 = getEvent(mockServer.requests, 10);
        var event4 = getEvent(mockServer.requests, 1);
        var event5 = getIdentityEvent(mockServer.requests, 'login');
        Should(event1).be.ok();
        Should(event2).be.ok();
        Should(event3).be.ok();
        Should(event4).be.ok();
        Should(event5).be.ok();

        done();
    });

    it('getUsers should return all mpids available in local storage', function(done) {
        mParticle._resetForTests(MPConfig);

        var user1 = {};
        var user2 = {};
        var user3 = {
            userIdentities: {
                customerid: 'customerid3',
                email: 'email3@test.com',
            },
        };

        mParticle.init(apiKey, window.mParticle.config);

        // get user 1 into cookies
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'user1', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user1);

        // get user 2 into cookies
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'user2', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user2);

        // get user 3 into cookies
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'user3', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user3);

        // init again using user 1
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'user1', is_logged_in: false }),
        ]);

        mParticle.identifyRequest = user1;

        mParticle.init(apiKey, window.mParticle.config);
        var users = mParticle.Identity.getUsers();
        //this includes the original, starting user, in addition to the 3 added above
        Should(users).have.length(4);
        for (var i = 0; i < users.length; i++) {
            Should.exist(mParticle.Identity.getUser(users[i].getMPID()));
        }
        Should.not.exist(mParticle.Identity.getUser('gs'));
        Should.not.exist(mParticle.Identity.getUser('cu'));
        Should.not.exist(mParticle.Identity.getUser('0'));
        Should.not.exist(mParticle.Identity.getUser('user4'));
        done();
    });

    it('should only update its own cookies, not any other mpids when initializing with a different set of credentials', function(done) {
        mParticle._resetForTests(MPConfig);

        var user1 = {
            userIdentities: {
                customerid: 'customerid1',
                email: 'email1@test.com',
            },
        };

        var user2 = {
            userIdentities: {
                customerid: 'customerid2',
                email: 'email2@test.com',
            },
        };

        var user3 = {
            userIdentities: {
                customerid: 'customerid3',
                email: 'email3@test.com',
            },
        };

        mParticle.init(apiKey, window.mParticle.config);

        // get user 1 into cookies
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'user1', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user1);
        mParticle.Identity.getCurrentUser().setUserAttribute('user', 'user1');

        // get user 2 into cookies
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'user2', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user2);
        mParticle.Identity.getCurrentUser().setUserAttribute('user', 'user2');

        // get user 3 into cookies
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'user3', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user3);
        mParticle.Identity.getCurrentUser().setUserAttribute('user', 'user3');

        // init again using user 1
        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'user1', is_logged_in: false }),
        ]);

        mParticle.identifyRequest = user1;

        mParticle.init(apiKey, window.mParticle.config);

        var localStorage = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        localStorage.user1.ua.user.should.equal('user1');
        localStorage.user1.ui.should.have.property('1', 'customerid1');
        localStorage.user1.ui.should.have.property('7', 'email1@test.com');
        localStorage.user2.ua.user.should.equal('user2');
        localStorage.user2.ui.should.have.property('1', 'customerid2');
        localStorage.user2.ui.should.have.property('7', 'email2@test.com');
        localStorage.user3.ua.user.should.equal('user3');
        localStorage.user3.ui.should.have.property('1', 'customerid3');
        localStorage.user3.ui.should.have.property('7', 'email3@test.com');

        done();
    });

    it('should create a new modified user identity object', function(done) {
        var previousIdentities = {
            1: 'customerid1',
            7: 'email2@test.com',
            3: 'test3',
        };
        var newIdentities = { google: 'google4', twitter: 'twitter5' };

        var modifiedUserIdentities = mParticle
            .getInstance()
            ._Identity.IdentityRequest.modifyUserIdentities(
                previousIdentities,
                newIdentities
            );
        modifiedUserIdentities.should.have.properties([1, 3, 4, 7]);
        modifiedUserIdentities[1].should.equal('customerid1');
        modifiedUserIdentities[3].should.equal('twitter5');
        modifiedUserIdentities[4].should.equal('google4');
        modifiedUserIdentities[7].should.equal('email2@test.com');

        done();
    });

    it('should convert user identities object to an array if no identityRequest is passed through', function(done) {
        mParticle._resetForTests(MPConfig);
        mockServer.requests = [];

        mParticle.identifyRequest = null;
        mParticle.init(apiKey, window.mParticle.config);

        var data = getEvent(mockServer.requests, 1);

        Array.isArray(data.ui).should.equal(true);
        done();
    });

    it('should reject a callback that is not a function', function(done) {
        var identityRequest = {
            userIdentities: {
                customerid: 123,
            },
        };
        var badCallback = 'string';
        mockServer.requests = [];

        mParticle.Identity.login(identityRequest, badCallback);
        mParticle.Identity.logout(identityRequest, badCallback);
        mParticle.Identity.modify(identityRequest, badCallback);
        mParticle.Identity.identify(identityRequest, badCallback);

        mockServer.requests.length.should.equal(0);

        done();
    });

    it("should find the related MPID's cookies when given a UI with fewer IDs when passed to login, logout, and identify, and then log events with updated cookies", function(done) {
        mParticle._resetForTests(MPConfig);
        var user1 = {
            userIdentities: {
                customerid: 'customerid1',
            },
        };

        var user1modified = {
            userIdentities: {
                email: 'email2@test.com',
            },
        };

        mParticle.config.identifyRequest = user1;

        mParticle.init(apiKey, window.mParticle.config);

        mockServer.respondWith(urls.modify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.Identity.modify(user1modified);
        mParticle.Identity.getCurrentUser().setUserAttribute('foo1', 'bar1');

        var product1 = mParticle.eCommerce.createProduct(
            'iPhone',
            '12345',
            '1000',
            2
        );
        mParticle.eCommerce.Cart.add(product1);

        mParticle.logEvent('test event1');
        var event1 = getEvent(mockServer.requests, 'test event1');

        event1.ua.should.have.property('foo1', 'bar1');
        event1.ui[0].should.have.property('Type', 1);
        event1.ui[0].should.have.property('Identity', 'customerid1');
        event1.ui[1].should.have.property('Type', 7);
        event1.ui[1].should.have.property('Identity', 'email2@test.com');

        var products = getLocalStorageProducts();

        products.testMPID.cp[0].should.have.property(
            'Name',
            'iPhone',
            'sku',
            'quantity'
        );
        products.testMPID.cp[0].should.have.property('Sku', '12345');
        products.testMPID.cp[0].should.have.property('Price', '1000');
        products.testMPID.cp[0].should.have.property('Quantity', 2);

        var user2 = {
            userIdentities: {
                customerid: 'customerid2',
            },
        };

        mockServer.respondWith(urls.logout, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mParticle.Identity.logout(user2);
        mParticle.logEvent('test event 2');
        var event2 = getEvent(mockServer.requests, 'test event 2');

        Object.keys(event2.ua).length.should.equal(0);
        event2.ui[0].should.have.property('Type', 1);
        event2.ui[0].should.have.property('Identity', 'customerid2');

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'testMPID', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user1);
        mParticle.logEvent('test event3');
        var event3 = getEvent(mockServer.requests, 'test event3');

        event3.ua.should.have.property('foo1', 'bar1');
        event3.ui.length.should.equal(2);
        event3.ui[0].should.have.property('Type', 1);
        event3.ui[0].should.have.property('Identity', 'customerid1');
        event3.ui[1].should.have.property('Type', 7);
        event3.ui[1].should.have.property('Identity', 'email2@test.com');

        var products2 = getLocalStorageProducts();

        products2.testMPID.cp[0].should.have.property(
            'Name',
            'iPhone',
            'sku',
            'quantity'
        );
        products2.testMPID.cp[0].should.have.property('Sku', '12345');
        products2.testMPID.cp[0].should.have.property('Price', '1000');
        products2.testMPID.cp[0].should.have.property('Quantity', 2);

        done();
    });

    it('Should maintain cookie structure when initializing multiple identity requests, and reinitializing with a previous one will keep the last MPID ', function(done) {
        mParticle._resetForTests(MPConfig);
        var user1 = {
            userIdentities: {
                customerid: '1',
            },
        };

        var user2 = {
            userIdentities: {
                customerid: '2',
            },
        };

        var user3 = {
            userIdentities: {
                customerid: '3',
            },
        };

        var user4 = {
            userIdentities: {
                customerid: '4',
            },
        };

        mParticle.config.identifyRequest = user1;

        mParticle.init(apiKey, window.mParticle.config);
        var user1UIs = mParticle.Identity.getCurrentUser().getUserIdentities();

        user1UIs.userIdentities.customerid.should.equal('1');

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid2', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user2);
        var user2UIs = mParticle.Identity.getCurrentUser().getUserIdentities();
        user2UIs.userIdentities.customerid.should.equal('2');

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid3', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user3);
        var user3UIs = mParticle.Identity.getCurrentUser().getUserIdentities();
        user3UIs.userIdentities.customerid.should.equal('3');

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid4', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user4);
        var user4UIs = mParticle.Identity.getCurrentUser().getUserIdentities();
        user4UIs.userIdentities.customerid.should.equal('4');

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.init(apiKey, window.mParticle.config);

        var user5 = mParticle.Identity.getCurrentUser();
        user5.getUserIdentities().userIdentities.customerid.should.equal('4');
        user5.getMPID().should.equal('mpid4');

        var data = mParticle.getInstance()._Persistence.getLocalStorage();

        data.cu.should.equal('mpid4');
        data.testMPID.ui[1].should.equal('1');
        data.mpid2.ui[1].should.equal('2');
        data.mpid3.ui[1].should.equal('3');
        data.mpid4.ui[1].should.equal('4');

        mParticle.identifyRequest = null;
        done();
    });

    it('should properly validate identityApiRequest values', function(done) {
        var badUserIdentitiesArray = {
            userIdentities: {
                customerid: [],
            },
        };

        var badUserIdentitiesObject = {
            userIdentities: {
                customerid: {},
            },
        };

        var badUserIdentitiesBoolean = {
            userIdentities: {
                customerid: false,
            },
        };

        var badUserIdentitiesUndefined = {
            userIdentities: {
                customerid: undefined,
            },
        };

        var validUserIdentitiesString = {
            userIdentities: {
                customerid: '123',
            },
        };

        var validUserIdentitiesNull = {
            userIdentities: {
                customerid: null,
            },
        };

        var invalidUserIdentitiesCombo = {
            userIdentities: {
                customerid: '123',
                email: undefined,
            },
        };

        var badUserIdentitiesArrayResult = mParticle
            .getInstance()
            ._Helpers.Validators.validateIdentities(badUserIdentitiesArray);
        var badUserIdentitiesObjectResult = mParticle
            .getInstance()
            ._Helpers.Validators.validateIdentities(badUserIdentitiesObject);
        var badUserIdentitiesBooleanResult = mParticle
            .getInstance()
            ._Helpers.Validators.validateIdentities(badUserIdentitiesBoolean);
        var badUserIdentitiesUndefinedResult = mParticle
            .getInstance()
            ._Helpers.Validators.validateIdentities(badUserIdentitiesUndefined);
        var validUserIdentitiesNullResult = mParticle
            .getInstance()
            ._Helpers.Validators.validateIdentities(validUserIdentitiesNull);
        var validUserIdentitiesStringResult = mParticle
            .getInstance()
            ._Helpers.Validators.validateIdentities(validUserIdentitiesString);
        var invalidUserIdentitiesComboResult = mParticle
            .getInstance()
            ._Helpers.Validators.validateIdentities(invalidUserIdentitiesCombo);

        badUserIdentitiesArrayResult.valid.should.equal(false);
        badUserIdentitiesObjectResult.valid.should.equal(false);
        badUserIdentitiesBooleanResult.valid.should.equal(false);
        badUserIdentitiesUndefinedResult.valid.should.equal(false);
        validUserIdentitiesNullResult.valid.should.equal(true);
        validUserIdentitiesStringResult.valid.should.equal(true);
        invalidUserIdentitiesComboResult.valid.should.equal(false);

        done();
    });

    it('should not send requests to the server with invalid userIdentity values', function(done) {
        mParticle.init(apiKey, window.mParticle.config);
        mockServer.requests = [];
        var result;

        var badUserIdentitiesArray = {
            userIdentities: {
                customerid: [],
            },
        };

        var badUserIdentitiesObject = {
            userIdentities: {
                customerid: {},
            },
        };

        var badUserIdentitiesBoolean = {
            userIdentities: {
                customerid: false,
            },
        };

        var badUserIdentitiesUndefined = {
            userIdentities: {
                customerid: undefined,
            },
        };

        var validUserIdentitiesString = {
            userIdentities: {
                customerid: '123',
            },
        };

        var validUserIdentitiesNull = {
            userIdentities: {
                customerid: null,
            },
        };

        var callback = function(resp) {
            result = resp;
        };

        var invalidUserIdentitiesArray = [
            badUserIdentitiesArray,
            badUserIdentitiesObject,
            badUserIdentitiesBoolean,
            badUserIdentitiesUndefined,
        ];
        var validUserIdentities = [
            validUserIdentitiesString,
            validUserIdentitiesNull,
        ];
        var identityMethods = ['login', 'logout', 'identify', 'modify'];

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mockServer.respondWith(urls.logout, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mockServer.respondWith(urls.modify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        identityMethods.forEach(function(identityMethod) {
            invalidUserIdentitiesArray.forEach(function(badIdentities) {
                mParticle.Identity[identityMethod](badIdentities, callback);
                result.httpCode.should.equal(-4);
                result.body.should.equal(
                    Constants.Messages.ValidationMessages
                        .UserIdentitiesInvalidValues
                );
                result = null;
            });

            validUserIdentities.forEach(function(goodIdentities) {
                mParticle.Identity[identityMethod](goodIdentities, callback);
                result.httpCode.should.equal(200);
                result.body.mpid.should.equal(testMPID);
                result = null;
            });
        });

        done();
    });

    it('should have no user identities when logging out or in with no object', function(done) {
        mParticle.init(apiKey, window.mParticle.config)
        var user = {
            userIdentities: {
                customerid: '123',
            },
        };

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid1', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user);
        var userIdentities1 = mParticle.Identity.getCurrentUser().getUserIdentities();

        mockServer.respondWith(urls.logout, [
            200,
            {},
            JSON.stringify({ mpid: 'mpid1', is_logged_in: false }),
        ]);

        mParticle.Identity.logout();
        var userIdentities2 = mParticle.Identity.getCurrentUser().getUserIdentities();

        userIdentities1.userIdentities.should.have.property(
            'customerid',
            '123'
        );
        Object.keys(userIdentities2.userIdentities).length.should.equal(0);

        done();
    });

    it("saves proper cookies for each user's products, and purchases record cartProducts correctly", function(done) {
        mParticle._resetForTests(MPConfig);

        var identityAPIRequest1 = {
            userIdentities: {
                customerid: '123',
            },
        };
        mParticle.identifyRequest = identityAPIRequest1;
        mParticle.init(apiKey, window.mParticle.config);

        var product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
            product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 2),
            product3 = mParticle.eCommerce.createProduct('Windows', 'SKU3', 3),
            product4 = mParticle.eCommerce.createProduct('HTC', 'SKU4', 4);

        mParticle.eCommerce.Cart.add([product1, product2]);

        var identityAPIRequest2 = {
            userIdentities: {
                customerid: '234',
            },
        };

        var products = getLocalStorageProducts();
        var cartProducts = products[testMPID].cp;

        cartProducts[0].Name.should.equal('iPhone');
        cartProducts[1].Name.should.equal('Android');

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mParticle.Identity.login(identityAPIRequest2);

        mParticle.eCommerce.Cart.add([product3, product4]);

        var products2 = getLocalStorageProducts();
        var cartProducts2 = products2['otherMPID'].cp;

        cartProducts2[0].Name.should.equal('Windows');
        cartProducts2[1].Name.should.equal('HTC');

        mParticle.eCommerce.logCheckout(1);
        var commerceEventUser2 = getEvent(mockServer.requests, 'eCommerce - Checkout');
        commerceEventUser2.sc.pl.length.should.equal(0)

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.Identity.login(identityAPIRequest1);
        mockServer.requests = [];
        mParticle.eCommerce.logCheckout(1);

        var commerceEventUser1 = getEvent(mockServer.requests, 'eCommerce - Checkout');
        commerceEventUser1.sc.pl.length.should.equal(0);

        done();
    });

    it('should update cookies after modifying identities', function(done) {
        mParticle.init(apiKey, window.mParticle.config)
        var user = {
            userIdentities: {
                customerid: 'customerId1',
            },
        };

        var modifiedUser = {
            userIdentities: {
                customerid: 'customerId2',
            },
        };

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
        
        mockServer.respondWith(urls.modify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.Identity.login(user);
        mParticle.Identity.modify(modifiedUser);

        var cookie = mParticle.getInstance()._Persistence.getLocalStorage();
        cookie.testMPID.ui[1].should.equal('customerId2');

        done();
    });

    it('does not run onUserAlias if it is not a function', function(done) {
        mParticle.init(apiKey, window.mParticle.config)
        var user1 = {
            userIdentities: {
                customerid: 'customerId1',
            },
        };

        var user2 = {
            userIdentities: {
                customerid: 'customerId2',
            },
            onUserAlias: null,
        };

        var product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
            product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 1);

        mParticle.eCommerce.Cart.add([product1, product2]);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);


        mParticle.Identity.login(user1);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mockServer.requests = [];
        mParticle.Identity.login(user2);

        mockServer.requests.length.should.equal(0);

        done();
    });

    it('should run onUserAlias if it is a function', function(done) {
        mParticle.init(apiKey, window.mParticle.config);
        var hasBeenRun = false;
        var user1 = {
            userIdentities: {
                customerid: 'customerId1',
            },
        };

        var user2 = {
            userIdentities: {
                customerid: 'customerId2',
            },
            onUserAlias: function() {
                hasBeenRun = true;
            },
        };

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.Identity.login(user1);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mParticle.Identity.login(user2);
        hasBeenRun.should.equal(true);

        done();
    });

    it('should setUserAttributes, setUserAttributeLists, removeUserAttributes, and removeUserAttributeLists properly in onUserAlias', function(done) {
        mParticle.init(apiKey, window.mParticle.config);
        var user1 = {
            userIdentities: {
                customerid: 'customerId1',
            },
        };

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.Identity.login(user1);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttribute('age', 27);

        var user1Attrs = mParticle.Identity.getCurrentUser().getAllUserAttributes();
        user1Attrs.should.have.property('gender', 'male');
        user1Attrs.should.have.property('age', 27);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        var user1Object, user2Object;

        var user2 = {
            userIdentities: {
                customerid: 'customerId2',
            },
            onUserAlias: function(user1, user2) {
                var user1Attributes = user1.getAllUserAttributes();
                for (var key in user1Attributes) {
                    if (key !== 'gender') {
                        user2.setUserAttribute(key, user1Attributes[key]);
                    }
                }
                user2.setUserAttributeList('list', [1, 2, 3, 4, 5]);
                user1.removeUserAttribute('age');

                user1Object = user1;
                user2Object = user2;
            },
        };

        mParticle.Identity.login(user2);

        var user1ObjectAttrs = user1Object.getAllUserAttributes();
        user1ObjectAttrs.should.not.have.property('age');
        user1ObjectAttrs.should.have.property('gender', 'male');

        var user2Attrs = mParticle.Identity.getCurrentUser().getAllUserAttributes();
        user2Attrs.should.not.have.property('gender');
        user2Attrs.should.have.property('age', 27);
        var user2ObjectAttrs = user2Object.getAllUserAttributes();
        user2ObjectAttrs.should.not.have.property('gender');
        user2ObjectAttrs.should.have.property('age', 27);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID2', is_logged_in: false }),
        ]);

        var user2AttributeListsBeforeRemoving,
            user3UserAttributeListsBeforeAdding,
            user2AttributeListsAfterRemoving,
            user3UserAttributeListsAfterAdding;

        var user3 = {
            userIdentities: {
                customerid: 'customerId3',
            },
            onUserAlias: function(user2, user3) {
                user2AttributeListsBeforeRemoving = user2.getUserAttributesLists();
                user3UserAttributeListsBeforeAdding = user3.getUserAttributesLists();
                user2.removeAllUserAttributes();
                user3.setUserAttributeList('list', [1, 2, 3, 4, 5]);
                user2AttributeListsAfterRemoving = user2.getUserAttributesLists();
                user3UserAttributeListsAfterAdding = user3.getUserAttributesLists();
            },
        };

        mParticle.Identity.login(user3);
        user2AttributeListsBeforeRemoving.list.length.should.equal(5);
        Should(
            Object.keys(user3UserAttributeListsBeforeAdding).length
        ).not.be.ok();

        Should(
            Object.keys(user2AttributeListsAfterRemoving).length
        ).not.be.ok();
        user3UserAttributeListsAfterAdding.list.length.should.equal(5);

        done();
    });

    it('should return an empty array when no cart products exist', function(done) {
        mParticle.init(apiKey, window.mParticle.config);

        var user1 = {
            userIdentities: {
                customerid: 'customerId1',
            },
        };

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.Identity.login(user1);
        var products = mParticle.Identity.getCurrentUser()
            .getCart()
            .getCartProducts();

        Should(products.length).not.be.ok();

        done();
    });

    it('should make a request when copyUserAttributes is included on the identity request', function(done) {
        mParticle.init(apiKey, window.mParticle.config);

        var identityAPIRequest1 = {
            userIdentities: {
                customerid: '123',
            },
            copyUserAttributes: true,
        };

        mockServer.respondWith(urls.logout, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        mParticle.Identity.logout(identityAPIRequest1);

        var logoutData = getIdentityEvent(mockServer.requests, 'logout');
        Should(logoutData).be.ok();

        mParticle.Identity.login(identityAPIRequest1);

        var loginData = getIdentityEvent(mockServer.requests, 'login');
        Should(loginData).be.ok();

        mParticle.Identity.modify(identityAPIRequest1);

        var modifyData = getIdentityEvent(mockServer.requests, 'login');
        Should(modifyData).be.ok();

        done();
    });

    it('should trigger the identifyCallback when a successful identify call is sent', function(done) {
        // MP.sessionID does not exist yet because we perform an mParticle._resetForTests(MPConfig);
        mParticle._resetForTests(MPConfig);

        var mpid;
        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.config.identityCallback = function(resp) {
            mpid = resp.body.mpid;
        };

        mParticle.init(apiKey, window.mParticle.config);

        mpid.should.equal('MPID1');
        done();
    });

    it('should trigger the identityCallback before eventQueue is flushed', function(done) {
        mParticle._resetForTests(MPConfig);
        var clock = sinon.useFakeTimers();
        mockServer.respondImmediately = false;
        mockServer.autoRespond = true;
        mockServer.autoRespondAfter = 500;
        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.config.identityCallback = function() {
            mParticle.Identity.getCurrentUser().setUserAttribute('foo', 'bar');
        };

        mockServer.requests = [];
        mParticle.init(apiKey, window.mParticle.config);

        (mockServer.requests.length === 0).should.equal.true
        clock.tick(1000);
        
        var sessionStart = getEvent(mockServer.requests, 1);
        var ASTEvent = getEvent(mockServer.requests, 10);
        sessionStart.ua.should.have.property('foo', 'bar');
        ASTEvent.ua.should.have.property('foo', 'bar');
        clock.restore();

        done();
    });

    it('should still trigger the identifyCallback when no identify request is sent because there are already cookies', function(done) {
        mParticle._resetForTests(MPConfig);
        var les = new Date().getTime();
        var cookies =
            "{'gs':{'ie':1|'dt':'test_key'|'cgid':'886e874b-862b-4822-a24a-1146cd057101'|'das':'62c91b8d-fef6-44ea-b2cc-b55714b0d827'|'csm':'WyJ0ZXN0TVBJRCJd'|'sid':'2535f9ed-ab19-4a7c-9eeb-ce4e41e0cb06'|'les': " +
            les +
            "|'ssd':1518536950916}|'testMPID':{'ui':'eyIxIjoiY3VzdG9tZXJpZDEifQ=='}|'cu':'testMPID'}";
        mParticle.config.useCookieStorage = true;
        setCookie(workspaceCookieName, cookies, true);
        //does not actually hit the server because identity request is not sent
        mParticle.config.identityCallback = function(resp) {
            resp.getUser().setUserAttribute('attr', 'value');
            result = resp;
        };

        mParticle.init(apiKey, window.mParticle.config);

        var result;

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mockServer.requests = [];
        mParticle.init(apiKey, window.mParticle.config);
        //the only server request is the AST, there is no request to Identity
        mockServer.requests.length.should.equal(1);
        result.should.have.properties('body', 'httpCode', 'getUser');

        result.httpCode.should.equal(-3);
        result.body.should.have.properties(
            'context',
            'is_ephemeral',
            'matched_identities',
            'mpid'
        );
        Should(result.body.context).not.be.ok();
        Should(result.body.is_ephemeral).not.be.ok();
        result.body.matched_identities.should.have.property(
            'customerid',
            'customerid1'
        );
        result.body.mpid.should.equal('testMPID');
        result
            .getUser()
            .getMPID()
            .should.equal('testMPID');
        result
            .getUser()
            .getAllUserAttributes()
            .should.have.property('attr', 'value');

        done();
    });

    it('identifyCallback response should have a getUser function on the result object', function(done) {
        var result;
        mParticle._resetForTests(MPConfig);

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mParticle.config.identityCallback = function(resp) {
            result = resp;
            resp.getUser().setUserAttribute('test', 'value');
        };

        mParticle.init(apiKey, window.mParticle.config);

        result.should.have.property('getUser');

        mParticle.Identity.getCurrentUser()
            .getAllUserAttributes()
            .should.have.property('test', 'value');

        done();
    });

    it('identityCallback responses should all have a getUser function on their result objects', function(done) {
        var result, loginResult, logoutResult, modifyResult;

        mParticle._resetForTests(MPConfig);

        mParticle.config.identityCallback = function(resp) {
            resp.getUser().setUserAttribute('attr', 'value');
            result = resp;
        };

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false, status: 200 }),
        ]);

        mParticle.init(apiKey, window.mParticle.config);

        var identityRequest = { userIdentities: { customerid: 'test123' } };
        function loginCallback(result) {
            loginResult = result;
        }
        function logoutCallback(result) {
            logoutResult = result;
        }
        function modifyCallback(result) {
            modifyResult = result;
        }

        mParticle.Identity.login(identityRequest, loginCallback);
        mParticle.Identity.logout(identityRequest, logoutCallback);
        mParticle.Identity.modify(identityRequest, modifyCallback);

        result.should.have.properties('body', 'httpCode', 'getUser');
        result.httpCode.should.equal(200);
        result.body.should.have.properties('mpid', 'status');
        result.body.mpid.should.equal('MPID1');
        result
            .getUser()
            .getMPID()
            .should.equal('MPID1');
        result
            .getUser()
            .getAllUserAttributes()
            .should.have.property('attr', 'value');
        loginResult
            .getUser()
            .getMPID()
            .should.equal('MPID1');
        logoutResult
            .getUser()
            .getMPID()
            .should.equal('MPID1');
        modifyResult
            .getUser()
            .getMPID()
            .should.equal('MPID1');

        loginResult
            .getUser()
            .getAllUserAttributes()
            .should.have.property('attr', 'value');
        logoutResult
            .getUser()
            .getAllUserAttributes()
            .should.have.property('attr', 'value');
        modifyResult
            .getUser()
            .getAllUserAttributes()
            .should.have.property('attr', 'value');

        done();
    });

    it('should call identify when there is an active session but no current user', function(done) {
        // this broken cookie state occurs when an initial identify request is made, fails, and the
        // client had no programmatic handling of a failed identify request
        mParticle._resetForTests(MPConfig);

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        // invalid customerid of type number, so mParticle.init(apiKey, window.mParticle.config) will fail, but create cookies
        // without a current user
        mParticle.config.identifyRequest = {
            userIdentities: {
                customerid: 123,
            },
        };
        mockServer.requests = [];
        mParticle.init(apiKey, window.mParticle.config);

        var cookies = mParticle.getInstance()._Persistence.getPersistence();
        cookies.should.have.property('gs');
        cookies.should.not.have.property('cu');
        (mParticle.Identity.getCurrentUser() === null).should.equal(true);

        // change to a valid customerid
        mParticle.config.identifyRequest = {
            userIdentities: {
                customerid: '123',
            },
        };
        mockServer.requests = [];

        mParticle.init(apiKey, window.mParticle.config);

        cookies = mParticle.getInstance()._Persistence.getPersistence();
        cookies.should.have.property('gs');
        cookies.should.have.have.property('cu', 'MPID1');
        mParticle.Identity.getCurrentUser().should.not.equal(null);

        done();
    });

    it('Users should have firstSeenTime and lastSeenTime', function(done) {
        mParticle._resetForTests(MPConfig);

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mockServer.requests = [];

        var clock = sinon.useFakeTimers();
        clock.tick(100);

        mParticle.init(apiKey, window.mParticle.config);

        var currentUser = mParticle.Identity.getCurrentUser();
        currentUser.should.not.equal(null);

        Should(currentUser.getFirstSeenTime()).not.equal(null);
        Should(currentUser.getLastSeenTime()).not.equal(null);

        clock.tick(100);

        currentUser.getFirstSeenTime().should.equal(100);
        currentUser.getLastSeenTime().should.equal(200);

        clock.restore();
        done();
    });

    it('firstSeenTime should stay the same for a user', function(done) {
        mParticle._resetForTests(MPConfig);

        var clock = sinon.useFakeTimers();
        clock.tick(100);

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);

        mockServer.requests = [];

        mParticle.init(apiKey, window.mParticle.config);

        var currentUser = mParticle.Identity.getCurrentUser();
        currentUser.should.not.equal(null);
        var user1FirstSeen = currentUser.getFirstSeenTime();

        clock.tick(20);

        var user1LastSeen = currentUser.getLastSeenTime();

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID2', is_logged_in: false }),
        ]);

        mockServer.requests = [];
        mParticle.Identity.login();

        currentUser = mParticle.Identity.getCurrentUser();
        currentUser.getMPID().should.equal('MPID2');

        //new user's firstSeenTime should be greater than or equal to the preceeding user's lastSeenTime
        (currentUser.getFirstSeenTime() >= user1LastSeen).should.equal(true);
        currentUser.getFirstSeenTime().should.equal(120);

        clock.tick(20);

        var user1 = mParticle.Identity.getUser('MPID1');
        user1.getFirstSeenTime().should.equal(user1FirstSeen);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'MPID1', is_logged_in: false }),
        ]);
        mockServer.requests = [];

        mParticle.Identity.login();

        currentUser = mParticle.Identity.getCurrentUser();
        currentUser.getMPID().should.equal('MPID1');
        currentUser.getFirstSeenTime().should.equal(user1FirstSeen);
        (currentUser.getLastSeenTime() > user1LastSeen).should.equal(true);

        clock.restore();
        done();
    });

    it('List returned by Identity.getUsers() should be sorted by lastSeenTime, with nulls last', function(done) {
        mParticle._resetForTests(MPConfig);

        var cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            1: {
                lst: 200,
            },
            2: {
                lst: 400,
            },
            3: {
                lst: 300,
            },
            4: {},
            5: {
                lst: 700,
            },
            cu: '1',
        });

        setCookie(workspaceCookieName, cookies);
        mParticle.useCookieStorage = true;

        mParticle.init(apiKey, window.mParticle.config);

        var users = mParticle.Identity.getUsers();

        users.length.should.equal(5);

        users[0].getMPID().should.equal('1');
        users[1].getMPID().should.equal('5');
        users[2].getMPID().should.equal('2');
        users[3].getMPID().should.equal('3');
        users[4].getMPID().should.equal('4');
        Should(users[4].getLastSeenTime()).equal(null);

        done();
    });

    it('does not error when simultaneous identity calls are out', function(done) {
        var errorMessages = [];
        mParticle._resetForTests(MPConfig);
        mParticle.config.logger = {
            error: function(msg) {
                errorMessages.push(msg);
            },
        };
        mParticle.init(apiKey, window.mParticle.config);

        mParticle.getInstance()._Store.identityCallInFlight = true;

        mParticle.setLogLevel('warning');

        mParticle.Identity.login({ userIdentities: { customerid: 'test' } });
        errorMessages.length.should.equal(0);

        done();
    });

    it('Startup identity callback should include getPreviousUser()', function(done) {
        mParticle._resetForTests(MPConfig);

        var cookies = JSON.stringify({
            gs: {
                sid: 'test',
                les: new Date().getTime(),
            },
            testMPID: {
                lst: 100,
            },
            testMPID2: {
                lst: 200,
            },
            cu: 'testMPID',
        });
        setCookie(workspaceCookieName, cookies);
        mParticle.useCookieStorage = true;

        var identityResult;

        function identityCallback(result) {
            identityResult = result;
        }

        mParticle.config.identityCallback = identityCallback;

        mParticle.init(apiKey, window.mParticle.config);

        identityResult
            .getUser()
            .getMPID()
            .should.equal('testMPID');
        Should(identityResult.getPreviousUser()).not.equal(null);
        Should(identityResult.getPreviousUser().getMPID()).equal('testMPID2');
        done();
    });

    it('Identity callback should include getPreviousUser()', function(done) {
        mParticle._resetForTests(MPConfig);

        var cookies = JSON.stringify({
            testMPID: {
                lst: 200,
            },
            testMPID2: {
                lst: 100,
            },
            cu: 'testMPID',
        });

        setCookie(workspaceCookieName, cookies);
        mParticle.useCookieStorage = true;

        mParticle.init(apiKey, window.mParticle.config);

        var loginResult;

        function identityCallback(result) {
            loginResult = result;
        }
        mParticle.Identity.login({}, identityCallback);

        mParticle.Identity.getCurrentUser()
            .getMPID()
            .should.equal('testMPID');
        loginResult
            .getUser()
            .getMPID()
            .should.equal('testMPID');
        Should(loginResult.getPreviousUser()).not.equal(null);
        loginResult
            .getPreviousUser()
            .getMPID()
            .should.equal('testMPID2');
        done();
    });

    it('should return the correct user for Previous User', function(done) {
        mParticle._resetForTests(MPConfig);

        var cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            1: {
                lst: 200,
            },
            2: {
                lst: 400,
            },
            3: {
                lst: 300,
            },
            4: {
                lst: 600,
            },
            5: {
                lst: 100,
            },
            cu: '1',
        });

        setCookie(workspaceCookieName, cookies);
        mParticle.useCookieStorage = true;

        mParticle.init(apiKey, window.mParticle.config);

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: '1', is_logged_in: false }),
        ]);

        var identityResult;
        mParticle.Identity.identify({}, function(result) {
            identityResult = result;
        });

        identityResult
            .getUser()
            .getMPID()
            .should.equal('1');
        identityResult
            .getPreviousUser()
            .getMPID()
            .should.equal('4');

        done();
    });

    it('Alias request should be received when API is called validly', function(done) {
        mockServer.requests = [];
        var aliasRequest = {
            destinationMpid: 1,
            sourceMpid: 2,
            startTime: 3,
            endTime: 4,
        };
        mockServer.respondWith(urls.alias, [
            200,
            {},
            JSON.stringify({}),
        ]);

        mParticle.Identity.aliasUsers(aliasRequest);
        mockServer.requests.length.should.equal(1);

        var request = mockServer.requests[0];
        request.url.should.equal(urls.alias);

        var requestBody = JSON.parse(request.requestBody);
        Should(requestBody['request_id']).not.equal(null);
        Should(requestBody['request_type']).equal('alias');
        Should(requestBody['environment']).equal('production');
        Should(requestBody['api_key']).equal(
            mParticle.getInstance()._Store.devToken
        );
        var dataBody = requestBody['data'];
        Should(dataBody).not.equal(null);
        Should(dataBody['destination_mpid']).equal(1);
        Should(dataBody['source_mpid']).equal(2);
        Should(dataBody['start_unixtime_ms']).equal(3);
        Should(dataBody['end_unixtime_ms']).equal(4);

        done();
    });

    it('Should reject malformed Alias Requests', function(done) {
        mParticle.config.logLevel = 'verbose';
        var warnMessage = null;

        mParticle.config.logger = {
            warning: function(msg) {
                warnMessage = msg;
            },
        };
        mParticle.init(apiKey, window.mParticle.config);
        var callbackResult;

        //missing sourceMpid
        var aliasRequest = {
            destinationMpid: 1,
            startTime: 3,
            endTime: 4,
        };

        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });
        callbackResult.httpCode.should.equal(HTTPCodes.validationIssue);
        Should(callbackResult.message).equal(
            Constants.Messages.ValidationMessages.AliasMissingMpid
        );
        Should(warnMessage).equal(
            Constants.Messages.ValidationMessages.AliasMissingMpid
        );
        callbackResult = null;
        warnMessage = null;

        //missing destinationMpid
        aliasRequest = {
            sourceMpid: 2,
            startTime: 3,
            endTime: 4,
        };
        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });
        callbackResult.httpCode.should.equal(HTTPCodes.validationIssue);
        Should(callbackResult.message).equal(
            Constants.Messages.ValidationMessages.AliasMissingMpid
        );
        Should(warnMessage).equal(
            Constants.Messages.ValidationMessages.AliasMissingMpid
        );
        callbackResult = null;
        warnMessage = null;

        //same destinationMpid & sourceMpid
        aliasRequest = {
            destinationMpid: 1,
            sourceMpid: 1,
            startTime: 3,
            endTime: 4,
        };
        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });
        callbackResult.httpCode.should.equal(HTTPCodes.validationIssue);
        Should(callbackResult.message).equal(
            Constants.Messages.ValidationMessages.AliasNonUniqueMpid
        );
        Should(warnMessage).equal(
            Constants.Messages.ValidationMessages.AliasNonUniqueMpid
        );
        callbackResult = null;
        warnMessage = null;

        //endTime before startTime
        aliasRequest = {
            destinationMpid: 1,
            sourceMpid: 2,
            startTime: 4,
            endTime: 3,
        };
        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });
        callbackResult.httpCode.should.equal(HTTPCodes.validationIssue);
        Should(callbackResult.message).equal(
            Constants.Messages.ValidationMessages.AliasStartBeforeEndTime
        );
        Should(warnMessage).equal(
            Constants.Messages.ValidationMessages.AliasStartBeforeEndTime
        );
        callbackResult = null;
        warnMessage = null;

        //missing endTime and startTime
        aliasRequest = {
            destinationMpid: 1,
            sourceMpid: 2,
        };
        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });
        callbackResult.httpCode.should.equal(HTTPCodes.validationIssue);
        Should(callbackResult.message).equal(
            Constants.Messages.ValidationMessages.AliasMissingTime
        );
        Should(warnMessage).equal(
            Constants.Messages.ValidationMessages.AliasMissingTime
        );
        callbackResult = null;
        warnMessage = null;

        //sanity test, make sure properly formatted requests are accepted
        aliasRequest = {
            destinationMpid: 1,
            sourceMpid: 2,
            startTime: 3,
            endTime: 4,
        };

        mockServer.respondWith(urls.alias, [
            200,
            {},
            JSON.stringify({}),
        ]);

        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });
        callbackResult.httpCode.should.equal(200);
        Should(callbackResult.message).equal(undefined);
        Should(warnMessage).equal(null);
        callbackResult = null;

        done();
    });

    it('Should parse error info from Alias Requests', function(done) {
        mParticle.init(apiKey, window.mParticle.config);
        var errorMessage = 'this is a sample error message';
        var callbackResult;

        mockServer.respondWith(urls.alias, [
            400,
            {},
            JSON.stringify({
                message: errorMessage,
                code: 'ignored code',
            }),
        ]);
    
        var aliasRequest = {
            destinationMpid: 1,
            sourceMpid: 2,
            startTime: 3,
            endTime: 4,
        };

        mParticle.Identity.aliasUsers(aliasRequest, function(callback) {
            callbackResult = callback;
        });

        callbackResult.httpCode.should.equal(400);
        callbackResult.message.should.equal(errorMessage);

        done();
    });

    it('Should properly create AliasRequest', function(done) {
        mParticle._resetForTests(MPConfig);

        var cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            1: {
                fst: 200,
                lst: 400,
            },
            cu: '2',
        });

        setCookie(workspaceCookieName, cookies);
        mParticle.useCookieStorage = true;

        mParticle.init(apiKey, window.mParticle.config);

        var clock = sinon.useFakeTimers();
        clock.tick(1000);

        var destinationUser = mParticle.Identity.getCurrentUser();
        var sourceUser = mParticle.Identity.getUser('1');

        var aliasRequest = mParticle.Identity.createAliasRequest(
            sourceUser,
            destinationUser
        );
        Should(aliasRequest.sourceMpid).equal('1');
        Should(aliasRequest.destinationMpid).equal('2');
        Should(aliasRequest.startTime).equal(200);
        Should(aliasRequest.endTime).equal(400);
        clock.restore();

        done();
    });

    it('Should fill in missing fst and lst in createAliasRequest', function(done) {
        mParticle._resetForTests(MPConfig);

        var cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            1: {
                fst: 200,
                lst: 400,
            },
            2: {},
            cu: '3',
        });

        setCookie(workspaceCookieName, cookies);
        mParticle.useCookieStorage = true;

        mParticle.init(apiKey, window.mParticle.config);

        var clock = sinon.useFakeTimers();
        clock.tick(1000);

        var destinationUser = mParticle.Identity.getCurrentUser();
        var sourceUser = mParticle.Identity.getUser('2');

        var aliasRequest = mParticle.Identity.createAliasRequest(
            sourceUser,
            destinationUser
        );
        Should(aliasRequest.sourceMpid).equal('2');
        Should(aliasRequest.destinationMpid).equal('3');
        //should grab the earliest fst out of any user if user does not have fst
        Should(aliasRequest.startTime).equal(200);
        //should grab currentTime if user does not have lst
        Should(aliasRequest.endTime).equal(1000);

        clock.restore();

        done();
    });

    it('Should fix startTime when default is outside max window create AliasRequest', function(done) {
        mParticle._resetForTests(MPConfig);

        var millisPerDay = 24 * 60 * 60 * 1000;
        var cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            1: {
                fst: 200,
            },
            cu: '2',
        });

        setCookie(workspaceCookieName, cookies);
        mParticle.useCookieStorage = true;

        //set max Alias startTime age to 1 day
        mParticle.config.aliasMaxWindow = 1;

        mParticle.init(apiKey, window.mParticle.config);

        var clock = sinon.useFakeTimers();
        clock.tick(millisPerDay * 2);

        var destinationUser = mParticle.Identity.getCurrentUser();
        var sourceUser = mParticle.Identity.getUser('1');

        var aliasRequest = mParticle.Identity.createAliasRequest(
            sourceUser,
            destinationUser
        );
        Should(aliasRequest.sourceMpid).equal('1');
        Should(aliasRequest.destinationMpid).equal('2');
        var oldestAllowedStartTime =
            new Date().getTime() -
            mParticle.getInstance()._Store.SDKConfig.aliasMaxWindow *
                millisPerDay;
        Should(aliasRequest.startTime).equal(oldestAllowedStartTime);
        Should(aliasRequest.endTime).equal(new Date().getTime());
        clock.restore();

        done();
    });

    it('Should warn if legal aliasRequest cannot be created with MParticleUser', function(done) {
        var millisPerDay = 24 * 60 * 60 * 1000;

        mParticle.config.logLevel = 'verbose';
        var warnMessage = null;

        mParticle.config.logger = {
            warning: function(msg) {
                warnMessage = msg;
            },
        };

        var cookies = JSON.stringify({
            gs: {
                sid: 'fst Test',
                les: new Date().getTime(),
            },
            1: {
                fst: 200,
                lst: 300,
            },
            cu: '2',
        });
        setCookie(workspaceCookieName, cookies);
        mParticle.useCookieStorage = true;
        //set max Alias startTime age to 1 day
        mParticle.config.aliasMaxWindow = 1;

        mParticle.init(apiKey, window.mParticle.config);

        var clock = sinon.useFakeTimers();
        clock.tick(millisPerDay * 2);

        var destinationUser = mParticle.Identity.getCurrentUser();
        var sourceUser = mParticle.Identity.getUser('1');

        var aliasRequest = mParticle.Identity.createAliasRequest(
            sourceUser,
            destinationUser
        );
        Should(aliasRequest.sourceMpid).equal('1');
        Should(aliasRequest.destinationMpid).equal('2');
        var oldestAllowedStartTime =
            new Date().getTime() -
            mParticle.getInstance()._Store.SDKConfig.aliasMaxWindow *
                millisPerDay;
        Should(aliasRequest.startTime).equal(oldestAllowedStartTime);
        Should(aliasRequest.endTime).equal(300);
        Should(warnMessage).equal(
            'Source User has not been seen in the last ' +
                mParticle.getInstance()._Store.SDKConfig.maxAliasWindow +
                ' days, Alias Request will likely fail'
        );

        clock.restore();
        done();
    });

    it("Alias request should have environment 'development' when isDevelopmentMode is true", function(done) {
        mParticle._resetForTests(MPConfig);
        window.mParticle.config.isDevelopmentMode = true;

        mParticle.init(apiKey, window.mParticle.config);

        mockServer.requests = [];
        var aliasRequest = {
            destinationMpid: 1,
            sourceMpid: 2,
            startTime: 3,
            endTime: 4,
        };
        mParticle.Identity.aliasUsers(aliasRequest);
        mockServer.requests.length.should.equal(1);

        var request = mockServer.requests[0];
        var requestBody = JSON.parse(request.requestBody);
        Should(requestBody['environment']).equal('development');

        done();
    });

    it('should set isFirtRun to false after an app is initialized', function(done) {
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, window.mParticle.config);

        mParticle.getInstance()._Store.isFirstRun.should.equal(false);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID1', is_logged_in: false }),
        ]);

        mParticle.Identity.login({ userIdentities: { customerid: 'abc' } });

        var ls = mParticle.getInstance()._Persistence.getLocalStorage();
        ls['testMPID'].lst.should.not.equal(null);

        done();
    });

    it('should send back an httpCode of -1 when there is a no coverage (http code returns 0)', function(done) {
        mParticle._resetForTests(MPConfig);

        var result;

        function identityCallback(response) {
            result = response;
        }
        mockServer.respondWith(urls.identify, [
            0,
            {},
            JSON.stringify({ body: null}),
        ]);

        mParticle.config.identityCallback = identityCallback;

        mParticle.init(apiKey, window.mParticle.config);

        result.httpCode.should.equal(-1);

        done();
    });

    describe('Deprecate Cart', function() {
        afterEach(function() {
            sinon.restore();
        });
        it('should deprecate the user\'s cart', function() {
            mParticle.init(apiKey, window.mParticle.config)
            var bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

            mParticle.getInstance().Identity.getCurrentUser().getCart();
            mParticle.Identity.getCurrentUser().getCart();

            bond.called.should.eql(true);
            bond.callCount.should.equal(2);

            bond.getCalls()[0].args[0].should.eql(
                'Deprecated function Identity.getCurrentUser().getCart() will be removed in future releases'
            );
        });
        it('should deprecate add', function() {
            mParticle.init(apiKey, window.mParticle.config)
            var bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

            var product = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                400
            );
            mParticle.getInstance().Identity.getCurrentUser()
                .getCart()
                .add(product);

            mParticle.Identity.getCurrentUser()
                .getCart()
                .add(product);

            bond.called.should.eql(true);
            // deprecates on both .getCart, then .add
            bond.callCount.should.equal(4);
            bond.getCalls()[1].args[0].should.eql(
                'Deprecated function Identity.getCurrentUser().getCart().add() will be removed in future releases'
            );

        });
        it('should deprecate remove', function() {
            mParticle.init(apiKey, window.mParticle.config)
            var bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

            var product = mParticle.eCommerce.createProduct(
                'iPhone',
                '12345',
                400
            );

            mParticle.getInstance().Identity.getCurrentUser()
                .getCart()
                .remove(product, true);
            mParticle.Identity.getCurrentUser()
                .getCart()
                .remove(product, true);

            bond.called.should.eql(true);
            // deprecates on both .getCart, then .add
            bond.callCount.should.equal(4);
            bond.getCalls()[1].args[0].should.eql(
                'Deprecated function Identity.getCurrentUser().getCart().remove() will be removed in future releases'
            );
        });
        it('should deprecate clear', function() {
            mParticle.init(apiKey, window.mParticle.config)
            var bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

            mParticle.getInstance().Identity.getCurrentUser()
                .getCart()
                .clear();
            mParticle.Identity.getCurrentUser()
                .getCart()
                .clear();

            bond.called.should.eql(true);
            // deprecates on both .getCart, then .add
            bond.callCount.should.equal(4);
            bond.getCalls()[1].args[0].should.eql(
                'Deprecated function Identity.getCurrentUser().getCart().clear() will be removed in future releases'
            );
        });

        it('should deprecate getCartProducts', function() {
            mParticle.init(apiKey, window.mParticle.config)
            var bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

            mParticle.getInstance().Identity.getCurrentUser()
                .getCart()
                .getCartProducts();
            mParticle.Identity.getCurrentUser()
                .getCart()
                .getCartProducts();

            bond.called.should.eql(true);
            // deprecates on both .getCart, then .add
            bond.callCount.should.equal(4);
            bond.getCalls()[1].args[0].should.eql(
                'Deprecated function Identity.getCurrentUser().getCart().getCartProducts() will be removed in future releases'
            );
        });
    });
});
