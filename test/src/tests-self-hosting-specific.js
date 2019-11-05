import TestsCore from './tests-core';
import sinon from 'sinon';

var apiKey = TestsCore.apiKey,
    getEvent = TestsCore.getEvent,
    MPConfig = TestsCore.MPConfig;

// Calls to /config are specific to only the self hosting environment
describe('/config self-hosting integration tests', function() {
    it('queues events in the eventQueue while /config is in flight, then processes them afterwards with correct MPID', function(done) {
        mParticle.reset(MPConfig);
        window.mParticle.config.requestConfig = true;

        window.mParticle.config.identifyRequest = {
            userIdentities: {
                google: 'google123',
            },
        };

        // start fake timer and mock server in order to
        var clock = sinon.useFakeTimers();
        var mockServer = sinon.createFakeServer();
        mockServer.autoRespond = true;
        mockServer.autoRespondAfter = 100;

        mockServer.respondWith('https://identity.mparticle.com/v1/identify', [
            200,
            {},
            JSON.stringify({ mpid: 'identifyMPID', is_logged_in: false }),
        ]);
        mockServer.respondWith(
            'https://jssdkcdns.mparticle.com/JS/v2/test_key/config?env=0',
            [200, {}, JSON.stringify({})]
        );

        mParticle.init(apiKey, window.mParticle.config);

        // log event before config and identify come back
        mParticle.logEvent('Test');
        var event = getEvent('Test', false, mockServer);
        Should(event).not.be.ok();

        // config and identify now get triggered, which runs through the event queue
        clock.tick(300);

        event = getEvent('Test', false, mockServer);
        event.should.be.ok();
        event.mpid.should.equal('identifyMPID');

        mockServer.restore();
        clock.restore();

        done();
    });

    it('queued events contain login mpid instead of identify mpid when calling login immediately after mParticle initializes', function(done) {
        var messages = [];
        mParticle.reset(MPConfig);
        window.mParticle.config.requestConfig = true;
        window.mParticle.config.logLevel = 'verbose';
        delete window.mParticle.config.workspaceToken;
        mParticle.config.logger = {
            verbose: function(msg) {
                messages.push(msg);
            },
        };

        window.mParticle.config.identifyRequest = {
            userIdentities: {
                google: 'google123',
            },
        };
        window.mParticle.config.identityCallback = function() {
            mParticle.logEvent('identify callback event');
        };

        // start fake timer and mock server
        var clock = sinon.useFakeTimers();
        var mockServer = sinon.createFakeServer();
        mockServer.autoRespond = true;
        mockServer.autoRespondAfter = 100;

        mockServer.respondWith(
            'https://jssdkcdns.mparticle.com/JS/v2/test_key/config?env=0',
            [200, {}, JSON.stringify({ workspaceToken: 'workspaceTokenTest' })]
        );
        mockServer.respondWith('https://identity.mparticle.com/v1/identify', [
            200,
            {},
            JSON.stringify({ mpid: 'identifyMPID', is_logged_in: false }),
        ]);
        mockServer.respondWith('https://identity.mparticle.com/v1/login', [
            200,
            {},
            JSON.stringify({ mpid: 'loginMPID', is_logged_in: false }),
        ]);

        mParticle.init(apiKey, window.mParticle.config);
        // call login before mParticle.identify is triggered, which happens after config returns
        mParticle.Identity.login({ userIdentities: { customerid: 'abc123' } });
        mParticle.logEvent('Test');

        // config triggers, login triggers immediately before identify
        clock.tick(300);

        var event1 = getEvent('Test', false, mockServer);
        event1.mpid.should.equal('loginMPID');
        messages
            .indexOf('Parsing "login" identity response from server')
            .should.be.above(0);

        // when login is in flight, identify will not run, but callback still will
        messages
            .indexOf('Parsing "identify" identity response from server')
            .should.equal(-1);
        var event2 = getEvent('identify callback event', false, mockServer);
        event2.mpid.should.equal('loginMPID');

        mockServer.restore();
        clock.restore();

        localStorage.removeItem('mprtcl-v4_workspaceTokenTest');
        done();
    });

    it('cookie name has workspace token in it in self hosting mode after config fetch', function(done) {
        mParticle.reset(MPConfig);
        window.mParticle.config.requestConfig = true;
        window.mParticle.config.logLevel = 'verbose';
        delete window.mParticle.config.workspaceToken;

        // start fake timer and mock server
        var clock = sinon.useFakeTimers();
        var mockServer = sinon.createFakeServer();
        mockServer.autoRespond = true;
        mockServer.autoRespondAfter = 100;

        mockServer.respondWith(
            'https://jssdkcdns.mparticle.com/JS/v2/test_key/config?env=0',
            [200, {}, JSON.stringify({ workspaceToken: 'wtTest' })]
        );

        mParticle.init(apiKey, window.mParticle.config);
        clock.tick(300);

        var data = window.localStorage.getItem('mprtcl-v4_wtTest');
        (typeof data === 'string').should.equal(true);

        mockServer.restore();
        clock.restore();

        done();
    });
});
