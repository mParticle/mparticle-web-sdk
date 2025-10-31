import { MPConfig, workspaceToken } from './constants';
import { IMParticleInstanceManager } from '../../../src/sdkRuntimeModels';

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
    }
}

let userApi = null;

window.mParticle._isTestEnv = true;
type MParticleSDK = { _forwardingStatsTimer?: number | null };


beforeEach(function() {
    const mpInstance = window.mParticle.getInstance();
    const sessionTimer = mpInstance._Store.globalTimer;

    clearTimeout(sessionTimer);
    mpInstance._Store.globalTimer = 0;
    
    
    const mParticleSDK = (window as Window & { mParticle?: MParticleSDK }).mParticle;
    const forwardingStatsTimer = mParticleSDK?._forwardingStatsTimer;
    
    clearInterval(forwardingStatsTimer);
    mParticleSDK._forwardingStatsTimer = 0;
    
    
    // mocha can't clean up after itself, so this lets
    // tests mock the current user and restores in between runs.
    if (!userApi) {
        userApi = mpInstance.Identity.getCurrentUser;
    } else {
        mpInstance.Identity.getCurrentUser = userApi;
    }

    window.mParticle.config = {
        workspaceToken: workspaceToken,
        logLevel: 'none',
        kitConfigs: [],
        requestConfig: false,
        isDevelopmentMode: false,
        flags: {
            eventBatchingIntervalMillis: 0,
            astBackgroundEvents: 'False',
            offlineStorage: '0',
        }
    };

    // This is to tell the resetPersistence method that we are in a test environment
    // It should probably be refactored to be included as an argument
    window.mParticle._resetForTests(MPConfig);
    delete window.mParticle._instances['default_instance'];
});