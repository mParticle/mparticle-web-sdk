import { MParticleWebSDK } from '../../src/sdkRuntimeModels';
declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}
