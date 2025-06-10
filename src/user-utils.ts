import { UserIdentities } from '@mparticle/web-sdk';
import {
    IMParticleUser,
    ISDKUserIdentity,
    IdentityResultBody,
} from './identity-user-interfaces';
import { SDKEvent } from './sdkRuntimeModels';
import Types from './types';
import { isObject, parseNumber } from './utils';

export function hasMPIDAndUserLoginChanged(
    previousUser: IMParticleUser,
    newUser: IMParticleUser,
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
    identityApiResult: IdentityResultBody,
): boolean {
    return (
        !prevUser ||
        (prevUser.getMPID() &&
            identityApiResult.mpid &&
            identityApiResult.mpid !== prevUser.getMPID())
    );
}

// https://go.mparticle.com/work/SQDSDKS-7136
export function appendUserInfo(user: IMParticleUser, event: SDKEvent): void {
    if (!event) {
        return;
    }
    if (!user) {
        event.MPID = null;
        event.ConsentState = null;
        event.UserAttributes = null;
        event.UserIdentities = null;
        return;
    }
    if (event.MPID && event.MPID === user.getMPID()) {
        return;
    }

    event.MPID = user.getMPID();
    event.ConsentState = user.getConsentState();
    event.UserAttributes = user.getAllUserAttributes();

    const userIdentities: UserIdentities =
        user.getUserIdentities().userIdentities;
    const dtoUserIdentities = {};
    for (const identityKey in userIdentities) {
        const identityType = Types.IdentityType.getIdentityType(identityKey);
        if (identityType !== false) {
            dtoUserIdentities[identityType] = userIdentities[identityKey];
        }
    }

    const validUserIdentities: ISDKUserIdentity[] = [];
    if (isObject(dtoUserIdentities)) {
        if (Object.keys(dtoUserIdentities).length) {
            for (const key in dtoUserIdentities) {
                const userIdentity = {} as ISDKUserIdentity;
                userIdentity.Identity = dtoUserIdentities[key];
                userIdentity.Type = parseNumber(key);
                validUserIdentities.push(userIdentity);
            }
        }
    }
    event.UserIdentities = validUserIdentities;
}
