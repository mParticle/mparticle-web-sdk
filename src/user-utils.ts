import { MParticleUser } from './sdkRuntimeModels';

export function didUserChange(
    previousUser: MParticleUser,
    newUser: MParticleUser
): boolean {
    return (
        !previousUser ||
        newUser.getMPID() !== previousUser.getMPID() ||
        previousUser.isLoggedIn() !== newUser.isLoggedIn()
    );
}
