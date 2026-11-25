// The full SDK: the lean SDK plus every optional module, registered before
// any page code can call init. Builds that leave a module out start from
// mparticle-lean.ts instead.
import { registerBuiltInSDKModule, SDKModuleNames } from './sdkModules';
import { buttonTrackingModule } from './buttonTracking/buttonTrackingModule';
import mParticleManager from './mparticle-lean';

registerBuiltInSDKModule(SDKModuleNames.ButtonTracking, buttonTrackingModule);

export default mParticleManager;
