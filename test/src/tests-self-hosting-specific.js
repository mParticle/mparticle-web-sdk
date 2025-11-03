import Utils from './config/utils';
import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { urls, apiKey, MPConfig } from './config/constants';

const {
    findEventFromRequest,
    findBatch,
    waitForCondition,
    fetchMockSuccess,
    hasConfigurationReturned
} = Utils;

// Calls to /config are specific to only the self hosting environment
describe('/config self-hosting integration tests', function() {
    beforeEach(function() {
        mParticle._resetForTests(MPConfig);
        fetchMock.config.overwriteRoutes = true;
        fetchMock.post(urls.events, 200);
    });

    afterEach(function() {
        fetchMock.restore();
        sinon.restore();
        window.mParticle.config.requestConfig = false;
    })

    // https://go.mparticle.com/work/SQDSDKS-7160
    it.skip('queues events in the eventQueue while /config is in flight, then processes them afterwards with correct MPID', async () => {
        window.mParticle.config.requestConfig = true;
        window.mParticle.config.flags.eventBatchingIntervalMillis = 0; // trigger event uploads immediately

        window.mParticle.config.identifyRequest = {
            userIdentities: {
                google: 'google123',
            },
        };

        fetchMockSuccess(urls.identify, {
            mpid: 'identifyMPID', is_logged_in: false
        });

          // https://go.mparticle.com/work/SQDSDKS-6651
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

        await waitForCondition(hasConfigurationReturned);
        event = findBatch(fetchMock.calls(), 'Test');
    
        event.should.be.ok();
        event.mpid.should.equal('identifyMPID');
        
        window.mParticle.config.requestConfig = false;
    });

    // https://go.mparticle.com/work/SQDSDKS-6852
    it.skip('queued events contain login mpid instead of identify mpid when calling login immediately after mParticle initializes', async () => {
        const messages = [];
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
                }, 200); // 100ms delay
            })
        });

        fetchMock.mock(urls.identify, () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        status: 200,
                        body: JSON.stringify({
                            mpid: 'identifyMPID', is_logged_in: false
                        }),
                        headers: { 'Content-Type': 'application/json' },
                    });
                }, 5000); // 100ms delay
            })
        });

        fetchMockSuccess(urls.login, {
            mpid: 'loginMPID', is_logged_in: false
        });

        mParticle.init(apiKey, window.mParticle.config);
        mParticle.Identity.login({ userIdentities: { customerid: 'abc123' } });
        mParticle.getInstance()._Store.isInitialized = true;
        mParticle.logEvent('Test');
        
        await waitForCondition(() => {
            return (
                mParticle.Identity.getCurrentUser()?.getMPID() === 'loginMPID'
            );
        });
        // call login before mParticle.identify is triggered, which happens after config returns
        // mParticle.Identity.login({ userIdentities: { customerid: 'abc123' } });
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.configurationLoaded === true
            );
        });
        // config triggers, login triggers immediately before identify
        const event1 = findBatch(fetchMock.calls(), 'Test');
        event1.mpid.should.equal('loginMPID');
        messages
            .indexOf('Parsing "login" identity response from server')
            .should.be.above(0);

        // when login is in flight, identify will not run, but callback still will
        messages
            .indexOf('Parsing "identify" identity response from server')
            .should.equal(-1);

        // const event2 = findBatch(fetchMock.calls(), 'identify callback event', false, mockServer);
        // event2.mpid.should.equal('loginMPID');


        localStorage.removeItem('mprtcl-v4_workspaceTokenTest');
    });

    it('cookie name has workspace token in it in self hosting mode after config fetch', async () => {
        window.mParticle.config.requestConfig = true;
        window.mParticle.config.logLevel = 'verbose';
        delete window.mParticle.config.workspaceToken;

        fetchMock.get(urls.config, {
            status: 200,
            body: JSON.stringify({
                workspaceToken: 'wtTest'
            }),
        });

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(hasConfigurationReturned);

        const data = window.localStorage.getItem('mprtcl-v4_wtTest');
        (typeof data === 'string').should.equal(true);
    });

    describe('/config self-hosting with direct url routing', async () => {
        it('should return direct urls when no baseUrls are passed and directURLRouting is true', async () => {
            window.mParticle.config.requestConfig = true;
            delete window.mParticle.config.workspaceToken;


            fetchMock.get(urls.config, {
                status: 200,
                body: JSON.stringify({
                        workspaceToken: 'wtTest',
                        flags: {
                        directURLRouting: 'True',
                    },
                }),
            });

            fetchMockSuccess(urls.identify, {
                mpid: 'identifyMPID', is_logged_in: false
            });

            mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasConfigurationReturned);
            const {
                aliasUrl,
                configUrl,
                identityUrl,
                v1SecureServiceUrl,
                v3SecureServiceUrl,
            } = mParticle.getInstance()._Store.SDKConfig;

            aliasUrl.should.equal('jssdks.us1.mparticle.com/v1/identity/');
            configUrl.should.equal('jssdkcdns.mparticle.com/JS/v2/');
            identityUrl.should.equal('identity.us1.mparticle.com/v1/');
            v1SecureServiceUrl.should.equal('jssdks.us1.mparticle.com/v1/JS/');
            v3SecureServiceUrl.should.equal('jssdks.us1.mparticle.com/v3/JS/');
        });
            
        it('should prioritize passed in baseUrls over direct urls', async () => {
            window.mParticle.config.requestConfig = true;
            window.mParticle.config.aliasUrl =
                'jssdks.foo.mparticle.com/v1/identity/';
            window.mParticle.config.identityUrl =
                'identity.foo.mparticle.com/v1/';
            window.mParticle.config.v1SecureServiceUrl =
                'jssdks.foo.mparticle.com/v1/JS/';
            window.mParticle.config.v3SecureServiceUrl =
                'jssdks.foo.mparticle.com/v3/JS/';

            fetchMock.get(urls.config, {
                status: 200,
                body: JSON.stringify({
                        workspaceToken: 'wtTest',
                        flags: {
                        directURLRouting: 'True',
                    },
                }),
            });

            fetchMockSuccess(urls.identify, {
                mpid: 'identifyMPID', is_logged_in: false
            });

            mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasConfigurationReturned);
            const {
                aliasUrl,
                configUrl,
                identityUrl,
                v1SecureServiceUrl,
                v3SecureServiceUrl,
            } = mParticle.getInstance()._Store.SDKConfig;

            configUrl.should.equal('jssdkcdns.mparticle.com/JS/v2/');
            aliasUrl.should.equal('jssdks.foo.mparticle.com/v1/identity/');
            identityUrl.should.equal('identity.foo.mparticle.com/v1/');
            v1SecureServiceUrl.should.equal('jssdks.foo.mparticle.com/v1/JS/');
            v3SecureServiceUrl.should.equal('jssdks.foo.mparticle.com/v3/JS/');
        });
    });
});