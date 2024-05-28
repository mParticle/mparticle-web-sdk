import { IMParticleUser, IdentityResultBody } from './identity-user-interfaces';

export function hasMPIDAndUserLoginChanged(
    previousUser: IMParticleUser,
    newUser: IMParticleUser
): boolean {
    return (
        !previousUser ||
        newUser.getMPID() !== previousUser.getMPID() ||
        previousUser.isLoggedIn() !== newUser.isLoggedIn()
    );
}

// https://go.mparticle.com/work/SQDSDKS-6504
export function hasMPIDChanged(
    prevUser: IMParticleUser,
    identityApiResult: IdentityResultBody
): boolean {
    return (
        !prevUser ||
        (prevUser.getMPID() &&
            identityApiResult.mpid &&
            identityApiResult.mpid !== prevUser.getMPID())
    );
}
