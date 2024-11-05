import { IdentityApiData, MPID, UserIdentities } from '@mparticle/web-sdk';
import {
    IdentityCallback,
    IIdentityResponse,
} from './identity-user-interfaces';
import {
    IAliasRequest,
    IAliasCallback,
    IIdentityRequest,
    IdentityAPIMethod,
    IIdentity,
} from './identity.interfaces';
import { MParticleWebSDK } from './sdkRuntimeModels';

export interface IIdentityApiClient {
    sendAliasRequest: (
        aliasRequest: IAliasRequest,
        aliasCallback: IAliasCallback
    ) => Promise<void>;
    sendIdentityRequest: (
        identityApiRequest: IIdentityRequest,
        method: IdentityAPIMethod,
        callback: IdentityCallback,
        originalIdentityApiData: IdentityApiData,
        parseIdentityResponse: IIdentity['parseIdentityResponse'],
        mpid: MPID,
        knownIdentities: UserIdentities
    ) => Promise<void>;
    getUploadUrl: (method: IdentityAPIMethod, mpid: MPID) => string;
    getIdentityResponseFromFetch: (
        response: Response,
        responseBody: string
    ) => IIdentityResponse;
    getIdentityResponseFromXHR: (response: Response) => IIdentityResponse;
}

// https://go.mparticle.com/work/SQDSDKS-6568
// https://go.mparticle.com/work/SQDSDKS-6679
// Combine with `sendIdentityRequest` above once module is fully migrated
export interface IIdentityApiClientSendAliasRequest {
    (
        mpInstance: MParticleWebSDK,
        aliasRequest: IAliasRequest,
        aliasCallback: IAliasCallback
    ): Promise<void>;
}
