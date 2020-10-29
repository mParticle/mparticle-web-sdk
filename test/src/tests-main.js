import { MPConfig, workspaceToken} from './config';

var userApi = null;

mParticle._isTestEnv = true;
beforeEach(function() {
    //mocha can't clean up after itself, so this lets
    //tests mock the current user and restores in between runs.
    if (!userApi) {
        userApi = window.mParticle.getInstance().Identity
            .getCurrentUser;
    } else {
        window.mParticle.getInstance().Identity.getCurrentUser = userApi;
    }
    window.mParticle = window.mParticle || {};
    window.mParticle.config = {
        workspaceToken: workspaceToken,
        logLevel: 'none',
        kitConfigs: [],
        requestConfig: false,
        isDevelopmentMode: false,
    };
    
    mParticle._resetForTests(MPConfig);
    delete mParticle._instances['default_instance'];
});

afterEach(function() {
    window.fetchMock.restore();
});

import './tests-core-sdk';
import './tests-batchUploader';
import './tests-kit-blocking';
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
import './tests-mockBatchCreator.ts';
import './tests-mParticleUser';
import './tests-self-hosting-specific';
import './tests-runtimeToBatchEventsDTO';
import './tests-apiClient';
import './tests-mparticle-instance-manager';
