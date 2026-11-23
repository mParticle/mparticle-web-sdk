import { version } from '../../package.json';
import { IButtonTrackingModule } from '../sdkModuleTypes';
import { ButtonTracker, resetButtonTracking } from './buttonTracker';

// Button and link tracking as an SDK module. The full SDK registers it
// statically from its entry point.
export const buttonTrackingModule: IButtonTrackingModule = {
    version,
    createTracker: mpInstance => new ButtonTracker(mpInstance),
    reset: resetButtonTracking,
};
