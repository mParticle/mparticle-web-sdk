import { IAliasCallback, IAliasRequest, IdentityAPIMethod, IIdentity, IIdentityAPIRequestData } from './identity.interfaces';
import { IdentityApiData, MPID, UserIdentities } from '@mparticle/web-sdk';
import { IdentityCallback, IdentityResultBody, IIdentityResponse } from './identity-user-interfaces';
import { IMParticleWebSDKInstance } from './mp-instance';
export interface IIdentityApiClient {
    sendAliasRequest: (aliasRequest: IAliasRequest, aliasCallback: IAliasCallback) => Promise<void>;
    sendIdentityRequest: (identityApiRequest: IIdentityAPIRequestData, method: IdentityAPIMethod, callback: IdentityCallback, originalIdentityApiData: IdentityApiData, parseIdentityResponse: IIdentity['parseIdentityResponse'], mpid: MPID, knownIdentities: UserIdentities) => Promise<void>;
    getUploadUrl: (method: IdentityAPIMethod, mpid: MPID) => string;
    getIdentityResponseFromFetch: (response: Response, responseBody: IdentityResultBody) => IIdentityResponse;
    getIdentityResponseFromXHR: (response: XMLHttpRequest) => IIdentityResponse;
}
export interface IAliasResponseBody {
}
export default function IdentityAPIClient(this: IIdentityApiClient, mpInstance: IMParticleWebSDKInstance): void;
