import { IMParticleUser, IdentityResultBody } from './identity-user-interfaces';
import { SDKEvent } from './sdkRuntimeModels';
export declare function hasMPIDAndUserLoginChanged(previousUser: IMParticleUser, newUser: IMParticleUser): boolean;
export declare function hasMPIDChanged(prevUser: IMParticleUser, identityApiResult: IdentityResultBody): boolean;
export declare function appendUserInfo(user: IMParticleUser, event: SDKEvent): void;
