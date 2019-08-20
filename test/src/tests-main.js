import TestsCore from './tests-core';

var testMPID = TestsCore.testMPID,
    MPConfig = TestsCore.MPConfig,
    apiKey = TestsCore.apiKey,
    workspaceToken = TestsCore.workspaceToken,
    server = TestsCore.server;

before(function() {
    server.start();
});

beforeEach(function() {
    window.mParticle = window.mParticle || {};
    window.mParticle.config = {
        workspaceToken: workspaceToken,
        logLevel: 'none',
        kitConfigs: [],
        requestConfig: false,
        isDevelopmentMode: false
    };

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
    window.mParticle.isIOS = null;

    mParticle.reset(MPConfig);
    mParticle.init(apiKey, window.mParticle.config);
    window.mParticle.config = {
        workspaceToken: workspaceToken,
        logLevel: 'none',
        kitConfigs: [],
        requestConfig: false,
        isDevelopmentMode: false
    };
    delete window.MockForwarder1;
});

import './tests-core-sdk';
import './tests-migrations';
import './tests-persistence';
import './tests-forwarders';
import './tests-helpers';
import './tests-identity';
import './tests-event-logging';
import './tests-eCommerce';
import './tests-identities-attributes';
import './tests-cookie-syncing';
import './tests-native-sdk';
import './tests-consent';
import './tests-serverModel';
import './tests-mParticleUser';
import './tests-self-hosting-specific';
