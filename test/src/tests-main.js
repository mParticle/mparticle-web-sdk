var TestsCore = require('./tests-core'),
    testMPID = TestsCore.testMPID,
    apiKey = TestsCore.apiKey,
    workspaceToken = TestsCore.workspaceToken,
    server = TestsCore.server;

describe('mParticle', function() {
    before(function() {
        mParticle._isTestEnv = true;
        mParticle.reset();
        server.start();
    });

    beforeEach(function() {
        mParticle.reset();

        server.requests = [];
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: testMPID
            }));
        };
        mParticle.forceHttps = true;
        window.mParticleAndroid = null;
        window.mParticle.isIOS = null;
        window.mParticle.useCookieStorage = false;
        mParticle.isDevelopmentMode = false;
        mParticle.maxCookieSize = 3000;
        mParticle.workspaceToken = workspaceToken;
        mParticle.init(apiKey);
    });

    require('./tests-core-sdk');
    require('./tests-migrations');
    require('./tests-persistence');
    require('./tests-forwarders');
    require('./tests-helpers');
    require('./tests-identity');
    require('./tests-event-logging');
    require('./tests-eCommerce');
    require('./tests-identities-attributes');
    require('./tests-cookie-syncing');
    require('./tests-native-sdk');
    require('./tests-consent');
    require('./tests-serverModel');
    require('./tests-mParticleUser');
});
