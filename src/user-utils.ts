import { IMParticleUser } from './identity-user-interfaces';

export function didUserChange(
    previousUser: IMParticleUser,
    newUser: IMParticleUser
): boolean {
    return (
        !previousUser ||
        newUser.getMPID() !== previousUser.getMPID() ||
        previousUser.isLoggedIn() !== newUser.isLoggedIn()
    );
}
