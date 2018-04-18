/* eslint-disable quotes */

var Identity = require('../../src/identity'),
    Helpers= require('../../src/helpers'),
    TestsCore = require('./tests-core'),
    Constants = require('../../src/constants'),
    checkIdentitySwap = Identity.Identity.checkIdentitySwap,
    getLocalStorage = TestsCore.getLocalStorage,
    setLocalStorage = TestsCore.setLocalStorage,
    apiKey = TestsCore.apiKey,
    testMPID = TestsCore.testMPID,
    server = TestsCore.server,
    findCookie = TestsCore.findCookie,
    getIdentityEvent = TestsCore.getIdentityEvent,
    getLocalStorageProducts = TestsCore.getLocalStorageProducts,
    getEvent = TestsCore.getEvent,
    v1localStorageKey = TestsCore.v1localStorageKey,
    v4CookieKey = TestsCore.v4CookieKey,
    setCookie = TestsCore.setCookie;

describe('identity', function() {
    it('should not do an identity swap if there is no MPID change', function(done) {
        var cookiesBefore = getLocalStorage();
        checkIdentitySwap(testMPID, testMPID);

        var cookiesAfter = mParticle.persistence.getLocalStorage();

        cookiesBefore.cu.should.equal(cookiesAfter.cu);

        done();
    });

    it('should do an identity swap if there is an MPID change', function(done) {
        var cookiesBefore = getLocalStorage();

        mParticle._Identity.checkIdentitySwap(testMPID, 'currentMPID');

        var cookiesAfter = mParticle.persistence.getLocalStorage();
        cookiesBefore.cu.should.equal(testMPID);

        cookiesAfter.cu.should.equal('currentMPID');

        done();
    });

    it('should store all MPIDs associated with a sessionId, then clear sessionIds when a new session starts', function(done) {
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                mpid: 'otherMPID'
            }));
        };

        mParticle.Identity.login();
        var localStorageDataBeforeSessionEnd = mParticle.persistence.getLocalStorage();

        localStorageDataBeforeSessionEnd.gs.csm.length.should.equal(2);

        mParticle.endSession();
        var localStorageDataAfterSessionEnd1 = mParticle.persistence.getLocalStorage();
        localStorageDataAfterSessionEnd1.gs.should.not.have.property('csm');

        mParticle.logEvent('hi');
        mParticle.Identity.login();

        var localStorageAfterLoggingEvent = mParticle.persistence.getLocalStorage();
        localStorageAfterLoggingEvent.gs.csm.length.should.equal(1);

        done();
    });

    it('localStorage - should switch user cookies to new mpid details from cookies when a new mpid is provided', function(done) {
        mParticle.reset();
        window.mParticle.useCookieStorage = false;

        setLocalStorage(v1localStorageKey, {
            ui: [{Identity: '123', Type: 1}],
            csd: { 10: 500 },
            mpid: testMPID,
            ie: true
        });


        mParticle.init(apiKey);

        var cookies1 = mParticle.persistence.getLocalStorage();
        cookies1.cu.should.equal(testMPID);
        cookies1[testMPID].should.have.property('csd');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                mpid: 'otherMPID'
            }));
        };

        mParticle.Identity.login();
        var cookiesAfterMPIDChange = mParticle.persistence.getLocalStorage();
        cookiesAfterMPIDChange.should.have.properties(['cu', 'otherMPID', testMPID, 'gs']);
        cookiesAfterMPIDChange.should.have.property('cu', 'otherMPID');
        cookiesAfterMPIDChange[testMPID].should.have.property('csd');

        var props = ['ie', 'sa', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'sid', 'c', 'mpid', 'cp'];

        props.forEach(function(prop) {
            cookiesAfterMPIDChange[testMPID].should.not.have.property(prop);
            cookiesAfterMPIDChange['otherMPID'].should.not.have.property(prop);
        });

        done();
    });

    it('cookies - should switch user cookies to new mpid details from cookies when a new mpid is provided', function(done) {
        mParticle.reset();
        window.mParticle.useCookieStorage = true;

        setLocalStorage(v1localStorageKey, {
            mpid: testMPID,
            cgid: 'cgidTEST',
            ie: true
        });
        mParticle.init(apiKey);

        var cookiesAfterInit = findCookie();
        cookiesAfterInit.should.have.properties('gs', 'cu', testMPID);
        cookiesAfterInit.gs.should.have.property('cgid', 'cgidTEST');

        var props1 = ['mpid', 'ui', 'ua', 'les', 'sid', 'ie', 'dt', 'sa', 'ss', 'cp'];

        props1.forEach(function(prop) {
            cookiesAfterInit.should.not.have.property(prop);
        });

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'otherMPID'
            }));
        };

        mParticle.Identity.login();

        var cookiesAfterMPIDChange = findCookie();
        cookiesAfterMPIDChange.should.have.properties(['cu', 'gs', 'otherMPID', testMPID]);
        cookiesAfterMPIDChange.should.have.property('cu', 'otherMPID');

        var props2 = ['ie', 'sa', 'ss', 'dt', 'les', 'av', 'cgid', 'das', 'sid', 'c', 'mpid', 'cp'];

        props2.forEach(function(prop) {
            cookiesAfterMPIDChange[testMPID].should.not.have.property(prop);
            cookiesAfterMPIDChange['otherMPID'].should.not.have.property(prop);
        });

        done();
    });

    it('should swap property identityType for identityName', function(done) {
        var data = {userIdentities: {}};
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
        var data = {userIdentities: {}},
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

        var identityRequest = mParticle._IdentityRequest.createIdentityRequest(data, platform, sdkVendor, sdkVersion, deviceId, context, testMPID);
        identityRequest.should.have.properties(['client_sdk', 'environment', 'context', 'known_identities', 'previous_mpid', 'request_id', 'request_timestamp_ms']);
        identityRequest.client_sdk.should.have.properties(['platform', 'sdk_vendor', 'sdk_version']);
        identityRequest.client_sdk.platform.should.equal(platform);
        identityRequest.client_sdk.sdk_vendor.should.equal(sdkVendor);
        identityRequest.environment.should.equal('production');
        identityRequest.previous_mpid.should.equal(testMPID);
        identityRequest.known_identities.should.have.properties(['other', 'customerid', 'facebook', 'twitter', 'google', 'microsoft', 'yahoo', 'email', 'facebookcustomaudienceid', 'other2', 'other3', 'other4', 'device_application_stamp']);
        identityRequest.known_identities.other.should.equal('id1');
        identityRequest.known_identities.customerid.should.equal('id2');
        identityRequest.known_identities.facebook.should.equal('id3');
        identityRequest.known_identities.twitter.should.equal('id4');
        identityRequest.known_identities.google.should.equal('id5');
        identityRequest.known_identities.microsoft.should.equal('id6');
        identityRequest.known_identities.yahoo.should.equal('id7');
        identityRequest.known_identities.email.should.equal('id8');
        identityRequest.known_identities.facebookcustomaudienceid.should.equal('id9');
        identityRequest.known_identities.other2.should.equal('id10');
        identityRequest.known_identities.other3.should.equal('id11');
        identityRequest.known_identities.other4.should.equal('id12');

        done();
    });

    it('should create a proper modify identity request', function(done) {
        var oldIdentities = {},
            platform = 'web',
            sdkVendor = 'mparticle',
            sdkVersion = '1.0.0',
            deviceId = 'abc',
            context = null;

        oldIdentities[0] = 'id1';
        oldIdentities[1] = 'id2';
        oldIdentities[2] = 'id3';
        oldIdentities[3] = 'id4';
        oldIdentities[4] = 'id5';
        oldIdentities[5] = 'id6';
        oldIdentities[6] = 'id7';
        oldIdentities[7] = 'id8';
        oldIdentities[9] = 'id9';
        oldIdentities[10] = 'id10';
        oldIdentities[11] = 'id11';
        oldIdentities[12] = 'id12';
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
        newIdentities.other2 = 'id23';
        newIdentities.other3 = 'id24';
        newIdentities.other4 = 'id25';

        var identityRequest = mParticle._IdentityRequest.createModifyIdentityRequest(oldIdentities, newIdentities, platform, sdkVendor, sdkVersion, deviceId, context, testMPID);
        identityRequest.should.have.properties(['client_sdk', 'environment', 'identity_changes', 'request_id', 'request_timestamp_ms']);
        identityRequest.client_sdk.should.have.properties(['platform', 'sdk_vendor', 'sdk_version']);
        identityRequest.client_sdk.platform.should.equal('web');
        identityRequest.client_sdk.sdk_vendor.should.equal('mparticle');
        identityRequest.environment.should.equal('production');
        identityRequest.identity_changes[0].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[0].old_value.should.equal('id1');
        identityRequest.identity_changes[0].identity_type.should.equal('other');
        identityRequest.identity_changes[0].new_value.should.equal('id14');

        identityRequest.identity_changes[1].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[1].old_value.should.equal('id2');
        identityRequest.identity_changes[1].identity_type.should.equal('customerid');
        identityRequest.identity_changes[1].new_value.should.equal('id15');

        identityRequest.identity_changes[2].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[2].old_value.should.equal('id3');
        identityRequest.identity_changes[2].identity_type.should.equal('facebook');
        identityRequest.identity_changes[2].new_value.should.equal('id16');

        identityRequest.identity_changes[3].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[3].old_value.should.equal('id4');
        identityRequest.identity_changes[3].identity_type.should.equal('twitter');
        identityRequest.identity_changes[3].new_value.should.equal('id17');

        identityRequest.identity_changes[4].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[4].old_value.should.equal('id5');
        identityRequest.identity_changes[4].identity_type.should.equal('google');
        identityRequest.identity_changes[4].new_value.should.equal('id18');

        identityRequest.identity_changes[5].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[5].old_value.should.equal('id6');
        identityRequest.identity_changes[5].identity_type.should.equal('microsoft');
        identityRequest.identity_changes[5].new_value.should.equal('id19');

        identityRequest.identity_changes[6].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[6].old_value.should.equal('id7');
        identityRequest.identity_changes[6].identity_type.should.equal('yahoo');
        identityRequest.identity_changes[6].new_value.should.equal('id20');

        identityRequest.identity_changes[7].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[7].old_value.should.equal('id8');
        identityRequest.identity_changes[7].identity_type.should.equal('email');
        identityRequest.identity_changes[7].new_value.should.equal('id21');

        identityRequest.identity_changes[8].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[8].old_value.should.equal('id9');
        identityRequest.identity_changes[8].identity_type.should.equal('facebookcustomaudienceid');
        identityRequest.identity_changes[8].new_value.should.equal('id22');

        identityRequest.identity_changes[9].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[9].old_value.should.equal('id10');
        identityRequest.identity_changes[9].identity_type.should.equal('other2');
        identityRequest.identity_changes[9].new_value.should.equal('id23');

        identityRequest.identity_changes[10].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[10].old_value.should.equal('id11');
        identityRequest.identity_changes[10].identity_type.should.equal('other3');
        identityRequest.identity_changes[10].new_value.should.equal('id24');

        identityRequest.identity_changes[11].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[11].old_value.should.equal('id12');
        identityRequest.identity_changes[11].identity_type.should.equal('other4');
        identityRequest.identity_changes[11].new_value.should.equal('id25');

        done();
    });

    it('should not make a request when an invalid request is sent to login', function(done) {
        server.requests = [];

        var identityAPIRequest1 = {
            userIdentities: 'badUserIdentitiesString'
        };
        mParticle.Identity.login(identityAPIRequest1);

        var badData1 = getIdentityEvent('login');
        Should(badData1).not.be.ok();

        var identityAPIRequest2 = {
            userIdentities: ['bad', 'user', 'identities', 'array']
        };
        mParticle.Identity.login(identityAPIRequest2);

        var badData2 = getIdentityEvent('login');
        Should(badData2).not.be.ok();

        var identityAPIRequest3 = {
            userIdentities: undefined
        };
        mParticle.Identity.login(identityAPIRequest3);

        var badData3 = getIdentityEvent('login');
        Should(badData3).not.be.ok();

        var identityAPIRequest4 = {
            userIdentities: true
        };
        mParticle.Identity.login(identityAPIRequest4);

        var badData4 = getIdentityEvent('login');
        Should(badData4).not.be.ok();

        done();
    });

    it('should not make a request when an invalid request is sent to logout', function(done) {
        server.requests = [];
        var identityAPIRequest1 = {
            userIdentities: 'badUserIdentitiesString'
        };
        mParticle.Identity.logout(identityAPIRequest1);

        var badData1 = getIdentityEvent('logout');
        Should(badData1).not.be.ok();

        var identityAPIRequest2 = {
            userIdentities: ['bad', 'user', 'identities', 'array']
        };
        mParticle.Identity.logout(identityAPIRequest2);

        var badData2 = getIdentityEvent('logout');
        Should(badData2).not.be.ok();

        var identityAPIRequest3 = {
            userIdentities: undefined
        };
        mParticle.Identity.logout(identityAPIRequest3);

        var badData3 = getIdentityEvent('logout');
        Should(badData3).not.be.ok();

        var identityAPIRequest4 = {
            userIdentities: true
        };

        mParticle.Identity.logout(identityAPIRequest4);
        var badData4 = getIdentityEvent('logout');
        Should(badData4).not.be.ok();

        done();
    });

    it('should not make a request when an invalid request is sent to modify', function(done) {
        server.requests = [];
        var identityAPIRequest1 = {
            userIdentities: 'badUserIdentitiesString'
        };
        mParticle.Identity.modify(identityAPIRequest1);

        var badData1 = getIdentityEvent('modify');
        Should(badData1).not.be.ok();

        var identityAPIRequest2 = {
            userIdentities: ['bad', 'user', 'identities', 'array']
        };
        mParticle.Identity.modify(identityAPIRequest2);

        var badData2 = getIdentityEvent('modify');
        Should(badData2).not.be.ok();

        var identityAPIRequest3 = {
            userIdentities: null
        };
        mParticle.Identity.modify(identityAPIRequest3);

        var badData3 = getIdentityEvent('modify');
        Should(badData3).not.be.ok();

        var identityAPIRequest4 = {
            userIdentities: undefined
        };
        mParticle.Identity.modify(identityAPIRequest4);

        var badData4 = getIdentityEvent('modify');
        Should(badData4).not.be.ok();

        var identityAPIRequest5 = {
            userIdentities: true
        };
        mParticle.Identity.modify(identityAPIRequest5);
        var badData5 = getIdentityEvent('modify');
        Should(badData5).not.be.ok();

        done();
    });

    it('should not make a request when an invalid request is sent to identify', function(done) {
        server.requests = [];
        var identityAPIRequest1 = {
            userIdentities: 'badUserIdentitiesString'
        };
        mParticle.Identity.identify(identityAPIRequest1);

        var badData1 = getIdentityEvent('identify');
        Should(badData1).not.be.ok();

        var identityAPIRequest2 = {
            userIdentities: ['bad', 'user', 'identities', 'array']
        };
        mParticle.Identity.identify(identityAPIRequest2);

        var badData2 = getIdentityEvent('identify');
        Should(badData2).not.be.ok();

        var identityAPIRequest3 = {
            userIdentities: undefined
        };
        mParticle.Identity.identify(identityAPIRequest3);

        var badData3 = getIdentityEvent('identify');
        Should(badData3).not.be.ok();

        var identityAPIRequest4 = {
            userIdentities: true
        };
        mParticle.Identity.identify(identityAPIRequest4);
        var badData4 = getIdentityEvent('identify');
        Should(badData4).not.be.ok();

        done();
    });

    it('should have old_value === null when there is no previous identity of a certain type and a new identity of that type', function(done) {
        var oldIdentities = {};
        oldIdentities[2] = 'old_facebook_id';
        var newIdentities = {};
        newIdentities.other = 'new_other_id';
        newIdentities.facebook = 'new_facebook_id';

        var identityRequest = mParticle._IdentityRequest.createModifyIdentityRequest(oldIdentities, newIdentities);

        identityRequest.identity_changes[0].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[0].should.have.property('old_value', null);
        identityRequest.identity_changes[0].identity_type.should.equal('other');
        identityRequest.identity_changes[0].new_value.should.equal('new_other_id');

        identityRequest.identity_changes[1].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[1].should.have.property('old_value', 'old_facebook_id');
        identityRequest.identity_changes[1].identity_type.should.equal('facebook');
        identityRequest.identity_changes[1].new_value.should.equal('new_facebook_id');

        done();
    });

    it('should have new_value === null when there is a previous identity of a certain type and no new identity of that type', function(done) {
        var oldIdentities = {};
        oldIdentities[0] = 'old_other_id';
        oldIdentities[2] = 'old_facebook_id';
        var newIdentities = {};
        newIdentities.facebook = 'new_facebook_id';

        var identityRequest = mParticle._IdentityRequest.createModifyIdentityRequest(oldIdentities, newIdentities);

        identityRequest.identity_changes[0].should.have.properties(['identity_type', 'new_value', 'old_value']);
        identityRequest.identity_changes[0].old_value.should.equal('old_facebook_id');
        identityRequest.identity_changes[0].identity_type.should.equal('facebook');
        identityRequest.identity_changes[0].new_value.should.equal('new_facebook_id');

        identityRequest.identity_changes.length.should.equal(1);

        done();
    });

    it('should create a proper send request when passing identities to modify', function(done) {
        var identityAPIData = {
            userIdentities: {
                email: 'rob@gmail.com'
            }
        };

        mParticle.Identity.modify(identityAPIData);
        var data = getIdentityEvent('modify');

        data.identity_changes.length.should.equal(1);
        data.identity_changes[0].should.have.properties('old_value', 'new_value', 'identity_type');
        data.identity_changes[0].should.have.properties('old_value', 'new_value', 'identity_type');

        done();
    });

    it('queue events when MPID is 0, and then flush events once MPID changes', function(done) {
        mParticle.reset();

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({}));
        };

        mParticle.init(apiKey);

        server.requests = [];
        mParticle.logEvent('Test1');
        var event1 = getEvent('Test1');
        Should(event1).not.be.ok();

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                mpid: 'otherMPID'
            }));
        };

        mParticle.logEvent('Test2');
        mParticle.Identity.login();

        // server requests will have AST, sessionStart, Test1, Test2, and login
        server.requests.length.should.equal(5);
        event1 = getEvent('Test1');
        var event2 = getEvent('Test2');
        var event3 = getEvent(10);
        var event4 = getEvent(1);
        var event5 = getIdentityEvent('login');
        Should(event1).be.ok();
        Should(event2).be.ok();
        Should(event3).be.ok();
        Should(event4).be.ok();
        Should(event5).be.ok();

        done();
    });

    it('should only update its own cookies, not any other mpids when initializing with a different set of credentials', function(done) {
        mParticle.reset();

        var user1 = {
            userIdentities: {
                customerid: 'customerid1',
                email: 'email1@test.com'
            }
        };

        var user2 = {
            userIdentities: {
                customerid: 'customerid2',
                email: 'email2@test.com'
            }
        };

        var user3 = {
            userIdentities: {
                customerid: 'customerid3',
                email: 'email3@test.com'
            }
        };

        mParticle.init(apiKey);

        // get user 1 into cookies
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'user1'
            }));
        };

        mParticle.Identity.login(user1);
        mParticle.Identity.getCurrentUser().setUserAttribute('user', 'user1');

        // get user 2 into cookies
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'user2'
            }));
        };

        mParticle.Identity.login(user2);
        mParticle.Identity.getCurrentUser().setUserAttribute('user', 'user2');

        // get user 3 into cookies
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'user3'
            }));
        };

        mParticle.Identity.login(user3);
        mParticle.Identity.getCurrentUser().setUserAttribute('user', 'user3');

        // init again using user 1
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'user1'
            }));
        };

        mParticle.identifyRequest = user1;

        mParticle.init(apiKey);

        var localStorage = mParticle.persistence.getLocalStorage();

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
        var previousIdentities = { 1: 'customerid1', 7: 'email2@test.com', 3:'test3' };
        var newIdentities = { google:'google4', twitter:'twitter5' };

        var modifiedUserIdentities = mParticle._IdentityRequest.modifyUserIdentities(previousIdentities, newIdentities);
        modifiedUserIdentities.should.have.properties([1, 3, 4, 7]);
        modifiedUserIdentities[1].should.equal('customerid1');
        modifiedUserIdentities[3].should.equal('twitter5');
        modifiedUserIdentities[4].should.equal('google4');
        modifiedUserIdentities[7].should.equal('email2@test.com');

        done();
    });

    it('should convert user identities object to an array if no identityRequest is passed through', function(done) {
        mParticle.reset();
        server.requests = [];

        mParticle.identifyRequest = null;
        mParticle.init(apiKey);

        var data = getEvent(1);

        Array.isArray(data.ui).should.equal(true);
        done();
    });

    it('should reject a callback that is not a function', function(done) {
        var identityRequest = {
            userIdentities: {
                customerid: 123
            }
        };
        var badCallback = 'string';
        server.requests = [];

        mParticle.Identity.login(identityRequest, badCallback);
        mParticle.Identity.logout(identityRequest, badCallback);
        mParticle.Identity.modify(identityRequest, badCallback);
        mParticle.Identity.identify(identityRequest, badCallback);

        server.requests.length.should.equal(0);

        done();
    });

    it('should find the related MPID\'s cookies when given a UI with fewer IDs when passed to login, logout, and identify, and then log events with updated cookies', function(done) {
        mParticle.reset();
        var user1 = {
            userIdentities: {
                customerid: 'customerid1'
            }
        };

        var user1modified = {
            userIdentities: {
                email: 'email2@test.com'
            }
        };

        mParticle.identifyRequest = user1;

        mParticle.init(apiKey);

        mParticle.Identity.modify(user1modified);
        mParticle.Identity.getCurrentUser().setUserAttribute('foo1', 'bar1');

        var product1 = mParticle.eCommerce.createProduct('iPhone', '12345', '1000', 2);
        mParticle.eCommerce.Cart.add(product1);

        mParticle.logEvent('test event1');
        var event1 = getEvent('test event1');

        event1.ua.should.have.property('foo1', 'bar1');
        event1.ui[0].should.have.property('Type', 1);
        event1.ui[0].should.have.property('Identity', 'customerid1');
        event1.ui[1].should.have.property('Type', 7);
        event1.ui[1].should.have.property('Identity', 'email2@test.com');

        var products = getLocalStorageProducts();

        products.testMPID.cp[0].should.have.property('Name', 'iPhone', 'sku', 'quantity');
        products.testMPID.cp[0].should.have.property('Sku', '12345');
        products.testMPID.cp[0].should.have.property('Price', '1000');
        products.testMPID.cp[0].should.have.property('Quantity', 2);

        var user2 = {
            userIdentities: {
                customerid: 'customerid2'
            }
        };

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'otherMPID'
            }));
        };

        mParticle.Identity.logout(user2);
        mParticle.logEvent('test event 2');
        var event2 = getEvent('test event 2');

        Object.keys(event2.ua).length.should.equal(0);
        event2.ui[0].should.have.property('Type', 1);
        event2.ui[0].should.have.property('Identity', 'customerid2');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'testMPID'
            }));
        };

        mParticle.Identity.login(user1);
        mParticle.logEvent('test event3');
        var event3 = getEvent('test event3');

        // TODO: confirm about copy user attributes
        // event3.ua.should.have.property('foo1', 'bar1');
        event3.ui.length.should.equal(2);
        event3.ui[0].should.have.property('Type', 1);
        event3.ui[0].should.have.property('Identity', 'customerid1');
        event3.ui[1].should.have.property('Type', 7);
        event3.ui[1].should.have.property('Identity', 'email2@test.com');

        var products2 = getLocalStorageProducts();

        products2.testMPID.cp[0].should.have.property('Name', 'iPhone', 'sku', 'quantity');
        products2.testMPID.cp[0].should.have.property('Sku', '12345');
        products2.testMPID.cp[0].should.have.property('Price', '1000');
        products2.testMPID.cp[0].should.have.property('Quantity', 2);

        done();
    });

    it('Should maintain cookie structure when initializing multiple identity requests, and reinitializing with a previous one will keep the last MPID ', function(done) {
        mParticle.reset();
        var user1 = {
            userIdentities: {
                customerid: '1'
            }
        };

        var user2 = {
            userIdentities: {
                customerid: '2'
            }
        };

        var user3 = {
            userIdentities: {
                customerid: '3'
            }
        };

        var user4 = {
            userIdentities: {
                customerid: '4'
            }
        };

        mParticle.identifyRequest = user1;

        mParticle.init(apiKey);
        var user1UIs = mParticle.Identity.getCurrentUser().getUserIdentities();

        user1UIs.userIdentities.customerid.should.equal('1');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'mpid2'
            }));
        };

        mParticle.Identity.login(user2);
        var user2UIs = mParticle.Identity.getCurrentUser().getUserIdentities();
        user2UIs.userIdentities.customerid.should.equal('2');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'mpid3'
            }));
        };

        mParticle.Identity.login(user3);
        var user3UIs = mParticle.Identity.getCurrentUser().getUserIdentities();
        user3UIs.userIdentities.customerid.should.equal('3');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'mpid4'
            }));
        };

        mParticle.Identity.login(user4);
        var user4UIs = mParticle.Identity.getCurrentUser().getUserIdentities();
        user4UIs.userIdentities.customerid.should.equal('4');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: testMPID
            }));
        };

        mParticle.init(apiKey);

        var user5 = mParticle.Identity.getCurrentUser();
        user5.getUserIdentities().userIdentities.customerid.should.equal('4');
        user5.getMPID().should.equal('mpid4');

        var data = mParticle.persistence.getLocalStorage();

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
                customerid: []
            }
        };

        var badUserIdentitiesObject = {
            userIdentities: {
                customerid: {}
            }
        };

        var badUserIdentitiesBoolean = {
            userIdentities: {
                customerid: false
            }
        };

        var badUserIdentitiesUndefined = {
            userIdentities: {
                customerid: undefined
            }
        };

        var validUserIdentitiesString = {
            userIdentities: {
                customerid: '123'
            }
        };

        var validUserIdentitiesNull = {
            userIdentities: {
                customerid: null
            }
        };

        var invalidUserIdentitiesCombo = {
            userIdentities: {
                customerid: '123',
                email: undefined
            }
        };

        var badUserIdentitiesArrayResult = Helpers.Validators.validateIdentities(badUserIdentitiesArray);
        var badUserIdentitiesObjectResult = Helpers.Validators.validateIdentities(badUserIdentitiesObject);
        var badUserIdentitiesBooleanResult = Helpers.Validators.validateIdentities(badUserIdentitiesBoolean);
        var badUserIdentitiesUndefinedResult = Helpers.Validators.validateIdentities(badUserIdentitiesUndefined);
        var validUserIdentitiesNullResult = Helpers.Validators.validateIdentities(validUserIdentitiesNull);
        var validUserIdentitiesStringResult = Helpers.Validators.validateIdentities(validUserIdentitiesString);
        var invalidUserIdentitiesComboResult = Helpers.Validators.validateIdentities(invalidUserIdentitiesCombo);

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
        server.requests = [];
        var result;

        var badUserIdentitiesArray = {
            userIdentities: {
                customerid: []
            }
        };

        var badUserIdentitiesObject = {
            userIdentities: {
                customerid: {}
            }
        };

        var badUserIdentitiesBoolean = {
            userIdentities: {
                customerid: false
            }
        };

        var badUserIdentitiesUndefined = {
            userIdentities: {
                customerid: undefined
            }
        };

        var validUserIdentitiesString = {
            userIdentities: {
                customerid: '123'
            }
        };

        var validUserIdentitiesNull = {
            userIdentities: {
                customerid: null
            }
        };

        var callback = function(resp) {
            result = resp;
        };

        var invalidUserIdentitiesArray = [ badUserIdentitiesArray, badUserIdentitiesObject, badUserIdentitiesBoolean, badUserIdentitiesUndefined ];
        var validUserIdentities = [ validUserIdentitiesString, validUserIdentitiesNull ];
        var identityMethods = ['login', 'logout', 'identify', 'modify'];

        identityMethods.forEach(function(identityMethod) {
            invalidUserIdentitiesArray.forEach(function(badIdentities) {
                mParticle.Identity[identityMethod](badIdentities, callback);
                result.httpCode.should.equal(-4);
                result.body.should.equal(Constants.Messages.ValidationMessages.UserIdentitiesInvalidValues);
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
        var user = {
            userIdentities: {
                customerid: '123'
            }
        };

        mParticle.Identity.login(user);
        var userIdentities1 = mParticle.Identity.getCurrentUser().getUserIdentities();

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'mpid1'
            }));
        };

        mParticle.Identity.logout();
        var userIdentities2 = mParticle.Identity.getCurrentUser().getUserIdentities();

        userIdentities1.userIdentities.should.have.property('customerid', '123');
        Object.keys(userIdentities2.userIdentities).length.should.equal(0);

        done();
    });

    it('saves proper cookies for each user\'s products, and purchases record cartProducts correctly', function(done) {
        mParticle.reset();

        var identityAPIRequest1 = {
            userIdentities: {
                customerid: '123'
            }
        };
        mParticle.identifyRequest = identityAPIRequest1;
        mParticle.init(apiKey);

        var product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
            product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 2),
            product3 = mParticle.eCommerce.createProduct('Windows', 'SKU3', 3),
            product4 = mParticle.eCommerce.createProduct('HTC', 'SKU4', 4);

        mParticle.eCommerce.Cart.add([product1, product2]);

        var identityAPIRequest2 = {
            userIdentities: {
                customerid: '234'
            }
        };

        var products = getLocalStorageProducts();
        var cartProducts = products[testMPID].cp;

        cartProducts[0].Name.should.equal('iPhone');
        cartProducts[1].Name.should.equal('Android');

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'otherMPID'
            }));
        };

        mParticle.Identity.login(identityAPIRequest2);

        mParticle.eCommerce.Cart.add([product3, product4]);

        var products2 = getLocalStorageProducts();
        var cartProducts2 = products2['otherMPID'].cp;

        cartProducts2[0].Name.should.equal('Windows');
        cartProducts2[1].Name.should.equal('HTC');

        mParticle.eCommerce.logCheckout(1);
        var commerceEventUser2 = getEvent('eCommerce - Checkout');
        commerceEventUser2.sc.pl[0].nm.should.equal('Windows');
        commerceEventUser2.sc.pl[0].id.should.equal('SKU3');
        commerceEventUser2.sc.pl[0].pr.should.equal(3);
        commerceEventUser2.sc.pl[1].nm.should.equal('HTC');
        commerceEventUser2.sc.pl[1].id.should.equal('SKU4');
        commerceEventUser2.sc.pl[1].pr.should.equal(4);

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: testMPID
            }));
        };

        mParticle.Identity.login(identityAPIRequest1);
        server.requests = [];
        mParticle.eCommerce.logCheckout(1);

        var commerceEventUser1 = getEvent('eCommerce - Checkout');
        commerceEventUser1.sc.pl[0].nm.should.equal('iPhone');
        commerceEventUser1.sc.pl[0].id.should.equal('SKU1');
        commerceEventUser1.sc.pl[0].pr.should.equal(1);
        commerceEventUser1.sc.pl[1].nm.should.equal('Android');
        commerceEventUser1.sc.pl[1].id.should.equal('SKU2');
        commerceEventUser1.sc.pl[1].pr.should.equal(2);

        done();
    });

    it('should update cookies after modifying identities', function(done) {
        var user = {
            userIdentities: {
                customerid: 'customerId1'
            }
        };

        var modifiedUser = {
            userIdentities: {
                customerid: 'customerId2'
            }
        };

        mParticle.Identity.login(user);
        mParticle.Identity.modify(modifiedUser);

        var cookie = mParticle.persistence.getLocalStorage();
        cookie.testMPID.ui[1].should.equal('customerId2');

        done();
    });

    it('does not run onUserAlias if it is not a function', function(done) {
        var user1 = {
            userIdentities: {
                customerid: 'customerId1'
            }
        };

        var user2 = {
            userIdentities: {
                customerid: 'customerId2'
            },
            onUserAlias: null
        };

        var product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
            product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 1);

        mParticle.eCommerce.Cart.add([product1, product2]);

        mParticle.Identity.login(user1);

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'otherMPID'
            }));
        };

        server.requests = [];
        mParticle.Identity.login(user2);

        server.requests.length.should.equal(0);

        done();
    });

    it('should run onUserAlias if it is a function', function(done) {
        var hasBeenRun = false;
        var user1 = {
            userIdentities: {
                customerid: 'customerId1'
            }
        };

        var user2 = {
            userIdentities: {
                customerid: 'customerId2'
            },
            onUserAlias: function() {
                hasBeenRun = true;
            }
        };

        mParticle.Identity.login(user1);

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'otherMPID'
            }));
        };

        mParticle.Identity.login(user2);
        hasBeenRun.should.equal(true);

        done();
    });

    it('should setUserAttributes, setUserAttributeLists, removeUserAttributes, and removeUserAttributeLists properly in onUserAlias', function(done) {
        var user1 = {
            userIdentities: {
                customerid: 'customerId1'
            }
        };

        mParticle.Identity.login(user1);
        mParticle.Identity.getCurrentUser().setUserAttribute('gender', 'male');
        mParticle.Identity.getCurrentUser().setUserAttribute('age', 27);

        var user1Attrs = mParticle.Identity.getCurrentUser().getAllUserAttributes();
        user1Attrs.should.have.property('gender', 'male');
        user1Attrs.should.have.property('age', 27);

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'otherMPID'
            }));
        };

        var user1Object,
            user2Object;

        var user2 = {
            userIdentities: {
                customerid: 'customerId2'
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
            }
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


        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'otherMPID2'
            }));
        };


        var user2AttributeListsBeforeRemoving,
            user3UserAttributeListsBeforeAdding,
            user2AttributeListsAfterRemoving,
            user3UserAttributeListsAfterAdding;

        var user3 = {
            userIdentities: {
                customerid: 'customerId3'
            },
            onUserAlias: function(user2, user3) {
                user2AttributeListsBeforeRemoving = user2.getUserAttributesLists();
                user3UserAttributeListsBeforeAdding = user3.getUserAttributesLists();
                user2.removeAllUserAttributes();
                user3.setUserAttributeList('list', [1, 2, 3, 4, 5]);
                user2AttributeListsAfterRemoving = user2.getUserAttributesLists();
                user3UserAttributeListsAfterAdding = user3.getUserAttributesLists();
            }
        };

        mParticle.Identity.login(user3);
        user2AttributeListsBeforeRemoving.list.length.should.equal(5);
        Should(Object.keys(user3UserAttributeListsBeforeAdding).length).not.be.ok();

        Should(Object.keys(user2AttributeListsAfterRemoving).length).not.be.ok();
        user3UserAttributeListsAfterAdding.list.length.should.equal(5);

        done();
    });

    it('should add, remove, and clear products properly', function(done) {
        var newUserProductsAfter,
            oldUserProductsBefore,
            oldUserProductsAfter,
            newUserProductsBefore;
        var user1 = {
            userIdentities: {
                customerid: 'customerId1'
            }
        };

        var product1 = mParticle.eCommerce.createProduct('iPhone', 'SKU1', 1),
            product2 = mParticle.eCommerce.createProduct('Android', 'SKU2', 1);

        mParticle.Identity.login(user1);
        mParticle.eCommerce.Cart.add([product1, product2]);
        var user1Products = mParticle.Identity.getCurrentUser().getCart().getCartProducts();
        user1Products.length.should.equal(2);
        JSON.stringify(user1Products).should.equal(JSON.stringify([product1, product2]));

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'otherMPID'
            }));
        };

        var user2 = {
            userIdentities: {
                customerid: 'customerId2'
            },
            onUserAlias: function(oldUser, newUser) {
                var oldUserAttributes = oldUser.getAllUserAttributes();
                for (var key in oldUserAttributes) {
                    if (key !== 'gender') {
                        newUser.setUserAttribute(key, oldUserAttributes[key]);
                    }
                }

                oldUserProductsBefore = oldUser.getCart().getCartProducts();
                newUserProductsBefore = newUser.getCart().getCartProducts();
                newUser.getCart().add(oldUser.getCart().getCartProducts());

                newUserProductsAfter = newUser.getCart().getCartProducts();
                oldUser.getCart().remove(product1);
                oldUserProductsAfter = oldUser.getCart().getCartProducts();
            }
        };


        mParticle.Identity.login(user2);
        newUserProductsBefore.length.should.equal(0);
        newUserProductsAfter.length.should.equal(2);
        JSON.stringify(newUserProductsAfter).should.equal(JSON.stringify([product1, product2]));
        oldUserProductsAfter.length.should.equal(1);
        JSON.stringify(oldUserProductsAfter).should.equal(JSON.stringify([product2]));
        JSON.stringify(oldUserProductsBefore).should.equal(JSON.stringify([product1, product2]));

        mParticle.eCommerce.logCheckout(1);
        var event = getEvent('eCommerce - Checkout');
        event.sc.pl[0].should.have.property('id', 'SKU1');
        event.sc.pl[0].should.have.property('nm', 'iPhone');
        event.sc.pl[0].should.have.property('pr', 1);
        event.sc.pl[1].should.have.property('id', 'SKU2');
        event.sc.pl[1].should.have.property('nm', 'Android');
        event.sc.pl[1].should.have.property('pr', 1);

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: 'testMPID'
            }));
        };

        mParticle.Identity.login(user1);
        mParticle.eCommerce.logCheckout(1);

        event = getEvent('eCommerce - Checkout');
        event.sc.pl[0].should.have.property('id', 'SKU2');
        event.sc.pl[0].should.have.property('nm', 'Android');
        event.sc.pl[0].should.have.property('pr', 1);
        event.sc.pl.length.should.equal(1);

        done();
    });

    it('should return an empty array when no cart products exist', function(done) {
        var user1 = {
            userIdentities: {
                customerid: 'customerId1'
            }
        };

        mParticle.Identity.login(user1);
        var products = mParticle.Identity.getCurrentUser().getCart().getCartProducts();

        Should(products.length).not.be.ok();

        done();
    });

    it('should make a request when copyUserAttributes is included on the identity request', function(done) {
        var identityAPIRequest1 = {
            userIdentities: {
                customerid: '123'
            },
            copyUserAttributes: true
        };

        mParticle.Identity.logout(identityAPIRequest1);

        var logoutData = getIdentityEvent('logout');
        Should(logoutData).be.ok();

        mParticle.Identity.login(identityAPIRequest1);

        var loginData = getIdentityEvent('login');
        Should(loginData).be.ok();

        mParticle.Identity.modify(identityAPIRequest1);

        var modifyData = getIdentityEvent('login');
        Should(modifyData).be.ok();

        done();
    });

    it('should trigger the identifyCallback when a successful identify call is sent', function(done) {
        // MP.sessionID does not exist yet because we perform an mParticle.reset();
        mParticle.reset();

        var mpid;
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                status: 200,
                mpid: 'MPID1'
            }));
        };

        mParticle.identityCallback = function(resp) {
            mpid = resp.body.mpid;
        };

        mParticle.init(apiKey);

        mpid.should.equal('MPID1');
        done();
    });

    it('should still trigger the identifyCallback when no identify request is sent beause there are already cookies', function(done) {
        mParticle.reset();
        var les = new Date().getTime();
        var cookies = "{'gs':{'ie':1|'dt':'test_key'|'cgid':'886e874b-862b-4822-a24a-1146cd057101'|'das':'62c91b8d-fef6-44ea-b2cc-b55714b0d827'|'csm':'WyJ0ZXN0TVBJRCJd'|'sid':'2535f9ed-ab19-4a7c-9eeb-ce4e41e0cb06'|'les': " + les + "|'ssd':1518536950916}|'testMPID123':{'ui':'eyIxIjoiY3VzdG9tZXJpZDEifQ=='}|'cu':'testMPID123'}";
        mParticle.useCookieStorage = true;
        setCookie(v4CookieKey, cookies, true);
        //does not actually hit the server because identity request is not sent
        mParticle.identityCallback = function(resp) {
            result = resp;
        };

        mParticle.init(apiKey);

        var result;

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                status: 200, mpid: 'MPID1'
            }));
        };

        server.requests = [];
        mParticle.init(apiKey);

        //the only server request is the AST, there is no request to Identity
        server.requests.length.should.equal(1);
        result.should.have.properties('body', 'httpCode');
        result.httpCode.should.equal(-3);
        result.body.should.have.properties('context', 'is_ephemeral', 'matched_identities', 'mpid');
        Should(result.body.context).not.be.ok();
        Should(result.body.is_ephemeral).not.be.ok();
        result.body.matched_identities.should.have.property('customerid', 'customerid1');
        result.body.mpid.should.equal('testMPID123');

        done();
    });
});
