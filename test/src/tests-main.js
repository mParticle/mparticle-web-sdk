var TestsCore = require('./tests-core'),
    testMPID = TestsCore.testMPID,
    apiKey = TestsCore.apiKey,
    server = TestsCore.server;

describe('mParticle', function() {
    before(function() {
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
        window.mParticleAndroid = null;
        window.mParticle.isIOS = null;
        window.mParticle.useCookieStorage = false;
        mParticle.isDevelopmentMode = false;
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

    after(function() {
        server.stop();
    });
});
