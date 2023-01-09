import { MPConfig, workspaceToken } from './config';

var userApi = null;

mParticle._isTestEnv = true;
beforeEach(function() {
    //mocha can't clean up after itself, so this lets
    //tests mock the current user and restores in between runs.
    if (!userApi) {
        userApi = window.mParticle.getInstance().Identity.getCurrentUser;
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

// NOTE: Beacon upload must come before core sdk tests beause of race condition
import './tests-beaconUpload';

import './tests-core-sdk';
import './tests-temp-session-bug-fix';
import './tests-batchUploader';
import './tests-kit-blocking';
import './tests-migrations';
import './tests-persistence';
import './tests-forwarders';
import './tests-helpers';
import './tests-identity';
import './tests-event-logging';
import './tests-eCommerce';
import './tests-cookie-syncing';
import './tests-identities-attributes';
import './tests-native-sdk';
import './tests-consent';
import './tests-serverModel';
import './tests-mockBatchCreator.ts';
import './tests-mParticleUser';
import './tests-self-hosting-specific';
import './tests-runtimeToBatchEventsDTO';
import './tests-apiClient';
import './tests-mparticle-instance-manager';
import './tests-queue-public-methods';
import './tests-validators';
import './tests-utils';
import './tests-store';
import './tests-vault';
