import Constants, { HTTP_ACCEPTED, HTTP_OK } from './constants';
import {
    AsyncUploader,
    FetchUploader,
    XHRUploader,
    IFetchPayload,
} from './uploaders';
import { CACHE_HEADER } from './identity-utils';
import { parseNumber } from './utils';
import {
    IAliasCallback,
    IAliasRequest,
    IdentityAPIMethod,
    IIdentity,
    IIdentityAPIRequestData,
} from './identity.interfaces';
import {
    Callback,
    IdentityApiData,
    MPID,
    UserIdentities,
} from '@mparticle/web-sdk';
import {
    IdentityCallback,
    IdentityResultBody,
    IIdentityResponse,
} from './identity-user-interfaces';
import { MParticleWebSDK } from './sdkRuntimeModels';

const { HTTPCodes, Messages, IdentityMethods } = Constants;

const { Modify } = IdentityMethods;

export interface IIdentityApiClient {
    sendAliasRequest: (
        aliasRequest: IAliasRequest,
        aliasCallback: IAliasCallback
    ) => Promise<void>;
    sendIdentityRequest: (
        identityApiRequest: IIdentityAPIRequestData,
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
        responseBody: IdentityResultBody
    ) => IIdentityResponse;
    getIdentityResponseFromXHR: (response: XMLHttpRequest) => IIdentityResponse;
}

export interface IAliasResponseBody {
    message?: string;
}

interface IdentityApiRequestPayload extends IFetchPayload {
    headers: {
        Accept: string;
        'Content-Type': string;
        'x-mp-key': string;
    };
}

export default function IdentityAPIClient(
    this: IIdentityApiClient,
    mpInstance: MParticleWebSDK
) {
    this.sendAliasRequest = async function(
        aliasRequest: IAliasRequest,
        aliasCallback: IAliasCallback
    ) {
        const { verbose, error } = mpInstance.Logger;
        const { invokeAliasCallback } = mpInstance._Helpers;
        const { aliasUrl } = mpInstance._Store.SDKConfig;
        const { devToken: apiKey } = mpInstance._Store;

        verbose(Messages.InformationMessages.SendAliasHttp);

        // https://go.mparticle.com/work/SQDSDKS-6750
        const uploadUrl = `https://${aliasUrl}${apiKey}/Alias`;
        const uploader: AsyncUploader = window.fetch
            ? new FetchUploader(uploadUrl)
            : new XHRUploader(uploadUrl);

        // https://go.mparticle.com/work/SQDSDKS-6568
        const uploadPayload: IFetchPayload = {
            method: 'post',
            headers: {
                Accept: 'text/plain;charset=UTF-8',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(aliasRequest),
        };

        try {
            const response: Response = await uploader.upload(uploadPayload);

            let message: string;
            let aliasResponseBody: IAliasResponseBody;

            // FetchUploader returns the response as a JSON object that we have to await
            if (response.json) {
                // HTTP responses of 202, 200, and 403 do not have a response.  response.json will always exist on a fetch, but can only be await-ed when the response is not empty, otherwise it will throw an error.
                try {
                    aliasResponseBody = await response.json();
                } catch (e) {
                    verbose('The request has no response body');
                }
            } else {
                // https://go.mparticle.com/work/SQDSDKS-6568
                // XHRUploader returns the response as a string that we need to parse
                const xhrResponse = (response as unknown) as XMLHttpRequest;

                aliasResponseBody = xhrResponse.responseText
                    ? JSON.parse(xhrResponse.responseText)
                    : '';
            }

            let errorMessage: string;

            switch (response.status) {
                case HTTP_OK:
                case HTTP_ACCEPTED:
                    // https://go.mparticle.com/work/SQDSDKS-6670
                    message =
                        'Successfully sent forwarding stats to mParticle Servers';
                    break;
                default:
                    // 400 has an error message, but 403 doesn't
                    if (aliasResponseBody?.message) {
                        errorMessage = aliasResponseBody.message;
                    }
                    message =
                        'Issue with sending Alias Request to mParticle Servers, received HTTP Code of ' +
                        response.status;
            }

            verbose(message);
            invokeAliasCallback(aliasCallback, response.status, errorMessage);
        } catch (e) {
            const err = e as Error;
            error('Error sending alias request to mParticle servers. ' + err);
            invokeAliasCallback(
                aliasCallback,
                HTTPCodes.noHttpCoverage,
                err.message
            );
        }
    };

    this.sendIdentityRequest = async function(
        identityApiRequest: IIdentityAPIRequestData,
        method: IdentityAPIMethod,
        callback: IdentityCallback,
        originalIdentityApiData: IdentityApiData,
        parseIdentityResponse: IIdentity['parseIdentityResponse'],
        mpid: MPID,
        knownIdentities: UserIdentities
    ) {
        const { verbose, error } = mpInstance.Logger;
        const { invokeCallback } = mpInstance._Helpers;

        verbose(Messages.InformationMessages.SendIdentityBegin);
        if (!identityApiRequest) {
            error(Messages.ErrorMessages.APIRequestEmpty);
            return;
        }
        verbose(Messages.InformationMessages.SendIdentityHttp);

        if (mpInstance._Store.identityCallInFlight) {
            invokeCallback(
                callback,
                HTTPCodes.activeIdentityRequest,
                'There is currently an Identity request processing. Please wait for this to return before requesting again'
            );
            return;
        }

        const previousMPID = mpid || null;
        const uploadUrl = this.getUploadUrl(method, mpid);

        const uploader: AsyncUploader = window.fetch
            ? new FetchUploader(uploadUrl)
            : new XHRUploader(uploadUrl);

        // https://go.mparticle.com/work/SQDSDKS-6568
        const fetchPayload: IdentityApiRequestPayload = {
            method: 'post',
            headers: {
                Accept: 'text/plain;charset=UTF-8',
                'Content-Type': 'application/json',
                'x-mp-key': mpInstance._Store.devToken,
            },
            body: JSON.stringify(identityApiRequest),
        };

        try {
            mpInstance._Store.identityCallInFlight = true;
            const response: Response = await uploader.upload(fetchPayload);

            let identityResponse: IIdentityResponse;

            if (response.json) {
                // https://go.mparticle.com/work/SQDSDKS-6568
                // FetchUploader returns the response as a JSON object that we have to await
                const responseBody: IdentityResultBody = await response.json();

                identityResponse = this.getIdentityResponseFromFetch(
                    response,
                    responseBody
                );
            } else {
                identityResponse = this.getIdentityResponseFromXHR(
                    (response as unknown) as XMLHttpRequest
                );
            }

            verbose(
                'Received Identity Response from server: ' +
                    JSON.stringify(identityResponse.responseText)
            );

            parseIdentityResponse(
                identityResponse,
                previousMPID,
                callback,
                originalIdentityApiData,
                method,
                knownIdentities,
                false
            );
        } catch (err) {
            const errorMessage = (err as Error).message || err.toString();

            mpInstance._Store.identityCallInFlight = false;
            invokeCallback(
                callback,
                HTTPCodes.noHttpCoverage,
                errorMessage,
            );
            error('Error sending identity request to servers' + ' - ' + err);
        }
    };

    this.getUploadUrl = (method: IdentityAPIMethod, mpid: MPID) => {
        const uploadServiceUrl: string = mpInstance._Helpers.createServiceUrl(
            mpInstance._Store.SDKConfig.identityUrl
        );

        const uploadUrl: string =
            method === Modify
                ? uploadServiceUrl + mpid + '/' + method
                : uploadServiceUrl + method;

        return uploadUrl;
    };

    this.getIdentityResponseFromFetch = (
        response: Response,
        responseBody: IdentityResultBody
    ): IIdentityResponse => ({
        status: response.status,
        responseText: responseBody,
        cacheMaxAge: parseInt(response.headers.get(CACHE_HEADER)) || 0,
        expireTimestamp: 0,
    });

    this.getIdentityResponseFromXHR = (
        response: XMLHttpRequest
    ): IIdentityResponse => ({
        status: response.status,
        responseText: response.responseText
            ? JSON.parse(response.responseText)
            : {},
        cacheMaxAge: parseNumber(
            response.getResponseHeader(CACHE_HEADER) || ''
        ),
        expireTimestamp: 0,
    });
}
