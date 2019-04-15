var TestsCore = require('./tests-core'),
    testMPID = TestsCore.testMPID,
    MPConfig = TestsCore.MPConfig,
    apiKey = TestsCore.apiKey,
    workspaceToken = TestsCore.workspaceToken,
    server = TestsCore.server;

describe('mParticle', function() {
    before(function() {
        server.start();
    });

    beforeEach(function() {
        window.mParticle = window.mParticle || {};
        window.mParticle.config = {
            workspaceToken: workspaceToken
        };
        require('../../src/main.js');
        mParticle._isTestEnv = true;
        server.requests = [];
        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(200, JSON.stringify({
                Store: {},
                mpid: testMPID
            }));
        };
        window.mParticleAndroid = null;
        mParticle.preInit.isDevelopmentMode = false;
        window.mParticle.isIOS = null;

        mParticle.reset(MPConfig);
        mParticle.init(apiKey);
        window.mParticle.config = {
            workspaceToken: workspaceToken
        };
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
