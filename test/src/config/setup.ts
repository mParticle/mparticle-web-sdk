import { MPConfig, workspaceToken } from './constants';
import { IMParticleInstanceManager } from '../../../src/sdkRuntimeModels';

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
    }
}

let userApi = null;

window.mParticle._isTestEnv = true;

beforeEach(function () {
    // mocha can't clean up after itself, so this lets
    // tests mock the current user and restores in between runs.
    if (!userApi) {
        userApi = window.mParticle.getInstance().Identity.getCurrentUser;
    } else {
        window.mParticle.getInstance().Identity.getCurrentUser = userApi;
    }

    window.mParticle.config = {
        workspaceToken: workspaceToken,
        logLevel: 'none',
        kitConfigs: [],
        requestConfig: false,
        isDevelopmentMode: false,
        flags: {
            eventBatchingIntervalMillis: 0,
        },
    };

    // This is to tell the resetPersistence method that we are in a test environment
    // It should probably be refactored to be included as an argument
    window.mParticle._resetForTests(MPConfig);
    delete window.mParticle._instances['default_instance'];
});
