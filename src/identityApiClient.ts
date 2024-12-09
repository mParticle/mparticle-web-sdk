import Constants, { HTTP_ACCEPTED, HTTP_OK } from './constants';
import {
    AsyncUploader,
    FetchUploader,
    XHRUploader,
    IFetchPayload,
} from './uploaders';
import { CACHE_HEADER } from './identity-utils';
import { parseNumber, valueof } from './utils';
import {
    IAliasCallback,
    IAliasRequest,
    IdentityAPIMethod,
    IIdentity,
    IIdentityAPIRequestData,
} from './identity.interfaces';
import {
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

// A successfull Alias request will return a 202 with no body
export interface IAliasResponseBody {}

interface IdentityApiRequestPayload extends IFetchPayload {
    headers: {
        Accept: string;
        'Content-Type': string;
        'x-mp-key': string;
    };
}

type HTTP_STATUS_CODES = typeof HTTP_OK | typeof HTTP_ACCEPTED;

interface IdentityApiError {
    code: string;
    message: string;
}

interface IdentityApiErrorResponse {
    Errors: IdentityApiError[],
    ErrorCode: string,
    StatusCode: valueof<HTTP_STATUS_CODES>;
    RequestId: string;
}

// All Identity Api Responses have the same structure, except for Alias
interface IAliasErrorResponse extends IdentityApiError {}

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
                // HTTP responses of 202, 200, and 403 do not have a response.
                // response.json will always exist on a fetch, but can only be
                // await-ed when the response is not empty, otherwise it will
                // throw an error.
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
                // Alias response is a 202 with no body
                case HTTP_OK:
                case HTTP_ACCEPTED:
                    // https://go.mparticle.com/work/SQDSDKS-6670
                    message =
                        'Successfully sent forwarding stats to mParticle Servers';
                    break;
                default: {
                    // 400 has an error message, but 403 doesn't
                    const errorResponse: IAliasErrorResponse = aliasResponseBody as unknown as IAliasErrorResponse;
                    if (errorResponse?.message) {
                        errorMessage = errorResponse.message;
                    }
                    message =
                        'Issue with sending Alias Request to mParticle Servers, received HTTP Code of ' +
                        response.status;
                    
                    if (errorResponse?.code) {
                        message += ' - ' + errorResponse.code;
                    }
                }
            }

            verbose(message);
            invokeAliasCallback(aliasCallback, response.status, errorMessage);
        } catch (e) {
            const errorMessage = (e as Error).message || e.toString();
            error('Error sending alias request to mParticle servers. ' + errorMessage);
            invokeAliasCallback(
                aliasCallback,
                HTTPCodes.noHttpCoverage,
                errorMessage,
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
        mpInstance._Store.identityCallInFlight = true;

        try {
            const response: Response = await uploader.upload(fetchPayload);

            let identityResponse: IIdentityResponse;
            let message: string;

            // FetchUploader returns the response as a JSON object that we have to await
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


            switch (identityResponse.status) {
                case HTTP_OK:
                case HTTP_ACCEPTED:
                    message = 'Received Identity Response from server: ';
                    message += JSON.stringify(identityResponse.responseText);
                    break;

                default: {
                    // 400 has an error message, but 403 doesn't
                    const errorResponse: IdentityApiErrorResponse = identityResponse.responseText as unknown as IdentityApiErrorResponse;
                    if (errorResponse?.Errors) {
                        message = 'Issue with sending Identity Request to mParticle Servers, received HTTP Code of ' + identityResponse.status;

                        const errorMessage = errorResponse.Errors.map((error) => error.message).join(', ');
                        message += ' - ' + errorMessage;
                    }
                }
            }

            verbose(message);
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
            mpInstance._Store.identityCallInFlight = false;
            
            const errorMessage = (err as Error).message || err.toString();
            error('Error sending identity request to servers' + ' - ' + errorMessage);
            invokeCallback(
                callback,
                HTTPCodes.noHttpCoverage,
                errorMessage,
            );
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
