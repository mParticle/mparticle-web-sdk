import { buttonTrackingModule } from './buttonTrackingModule';
import type { ISDKModuleRegistry } from '../sdkModuleTypes';

// The module file is served after the lean SDK in the same response, so the
// global is already there. Loading it twice, or without the SDK, changes nothing.
try {
    ((window.mParticle as unknown) as ISDKModuleRegistry)._registerModule(
        'buttonTracking',
        buttonTrackingModule
    );
} catch (e) {
    // Nothing to register with.
}
