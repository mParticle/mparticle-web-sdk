import Utils from './config/utils';
import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { urls, apiKey, MPConfig } from './config/constants';

const { findEventFromRequest, findBatch } = Utils;

let mockServer;

// Calls to /config are specific to only the self hosting environment
describe('/config self-hosting integration tests', function() {
    beforeEach(function() {
        fetchMock.post(urls.events, 200);

        mockServer = sinon.createFakeServer();
    });

    afterEach(function() {
        fetchMock.restore();
        sinon.restore();
    })

    it('queues events in the eventQueue while /config is in flight, then processes them afterwards with correct MPID', function(done) {
        mParticle._resetForTests(MPConfig);
        window.mParticle.config.requestConfig = true;
        window.mParticle.config.flags.eventBatchingIntervalMillis = 0; // trigger event uploads immediately

        window.mParticle.config.identifyRequest = {
            userIdentities: {
                google: 'google123',
            },
        };

        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'identifyMPID', is_logged_in: false }),
        ]);

        fetchMock.mock(urls.config, () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        status: 200,
                        body: JSON.stringify({
                            success: true,
                            appName: 'Test App',
                            kitCOnfigs: []
                        }),
                        headers: { 'Content-Type': 'application/json' },
                    });
                }, 50); // 100ms delay
            })
        });

        mParticle.init(apiKey, window.mParticle.config);

        // log event before config and identify come back
        mParticle.logEvent('Test');
        let event = findEventFromRequest(fetchMock.calls(), 'Test');
        Should(event).not.be.ok();

        setTimeout(() => {
            event = findBatch(fetchMock.calls(), 'Test');
            
            event.should.be.ok();
            event.mpid.should.equal('identifyMPID');
            
            mockServer.restore();
            window.mParticle.config.requestConfig = false;
            done();
        }, 75);
    });

    it('queued events contain login mpid instead of identify mpid when calling login immediately after mParticle initializes', function(done) {
        const messages = [];
        mParticle._resetForTests(MPConfig);
        window.mParticle.config.requestConfig = true;
        window.mParticle.config.flags.eventBatchingIntervalMillis = 0; // trigger event uploads immediately

        window.mParticle.config.logLevel = 'verbose';
        delete window.mParticle.config.workspaceToken;
        mParticle.config.logger = {
            verbose: function(msg) {
                messages.push(msg);
            },
        };

        window.mParticle.config.identityCallback = function() {
            mParticle.logEvent('identify callback event');
        };

        mockServer.autoRespond = true;
        mockServer.autoRespondAfter = 100;

        fetchMock.mock(urls.config, () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        status: 200,
                        body: JSON.stringify({
                            success: true,
                            appName: 'Test App',
                            kitCOnfigs: []
                        }),
                        headers: { 'Content-Type': 'application/json' },
                    });
                }, 50); // 100ms delay
            })
        });

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: 'identifyMPID', is_logged_in: false }),
        ]);

        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'loginMPID', is_logged_in: false }),
        ]);


        mParticle.init(apiKey, window.mParticle.config);
        // call login before mParticle.identify is triggered, which happens after config returns
        mParticle.Identity.login({ userIdentities: { customerid: 'abc123' } });
        mParticle.logEvent('Test');

        // config triggers, login triggers immediately before identify
        setTimeout(() => {
            const event1 = findBatch(fetchMock.calls(), 'Test');
            event1.mpid.should.equal('loginMPID');
            messages
                .indexOf('Parsing "login" identity response from server')
                .should.be.above(0);

            // when login is in flight, identify will not run, but callback still will
            messages
                .indexOf('Parsing "identify" identity response from server')
                .should.equal(-1);
            const event2 = findBatch(fetchMock.calls(), 'identify callback event', false, mockServer);
            event2.mpid.should.equal('loginMPID');

            mockServer.restore();
            // clock.restore();

            localStorage.removeItem('mprtcl-v4_workspaceTokenTest');
            window.mParticle.config.requestConfig = false;

            done();
            
        }, 150);
    });

    it('cookie name has workspace token in it in self hosting mode after config fetch', function(done) {
        mParticle._resetForTests(MPConfig);
        window.mParticle.config.requestConfig = true;
        window.mParticle.config.logLevel = 'verbose';
        delete window.mParticle.config.workspaceToken;

        fetchMock.mock(urls.config, () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        status: 200,
                        body: JSON.stringify({
                            workspaceToken: 'wtTest'
                        }),
                        headers: { 'Content-Type': 'application/json' },
                    });
                }, 50); // 100ms delay
            })
        });

        mParticle.init(apiKey, window.mParticle.config);

        setTimeout(() => {
            const data = window.localStorage.getItem('mprtcl-v4_wtTest');
            (typeof data === 'string').should.equal(true);
            window.mParticle.config.requestConfig = false;
    
            done();
        }, 75);
    });
});