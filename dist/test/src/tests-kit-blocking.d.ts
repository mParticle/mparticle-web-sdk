import { MParticleWebSDK } from '../../src/sdkRuntimeModels';
declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        MockForwarder1: any;
    }
}
