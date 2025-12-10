import Constants, { HTTP_ACCEPTED, HTTP_BAD_REQUEST, HTTP_OK } from './constants';
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
import { IMParticleWebSDKInstance } from './mp-instance';
import { ErrorCodes } from './logging/errorCodes';

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
    mpInstance: IMParticleWebSDKInstance
) {
    this.sendAliasRequest = async function(
        aliasRequest: IAliasRequest,
        aliasCallback: IAliasCallback
    ) {
        const { Logger } = mpInstance;
        const { invokeAliasCallback } = mpInstance._Helpers;
        const { aliasUrl } = mpInstance._Store.SDKConfig;
        const { devToken: apiKey } = mpInstance._Store;

        Logger.verbose(Messages.InformationMessages.SendAliasHttp);

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

            let aliasResponseBody: IAliasResponseBody;
            let message: string;
            let errorMessage: string;

            switch (response.status) {
                // A successfull Alias request will return without a body
                case HTTP_ACCEPTED:
                case HTTP_OK:
                    // https://go.mparticle.com/work/SQDSDKS-6670
                    message = 'Received Alias Response from server: ' + JSON.stringify(response.status);
                    break;

                // Our Alias Request API will 400 if there is an issue with the request body (ie timestamps are too far 
                // in the past or MPIDs don't exist).
                // A 400 will return an error in the response body and will go through the happy path to report the error
                case HTTP_BAD_REQUEST:
                    // response.json will always exist on a fetch, but can only be await-ed when the
                    // response is not empty, otherwise it will throw an error.
                    if (response.json) {
                        try {
                            aliasResponseBody = await response.json();
                        } catch (e) {
                            Logger.verbose('The request has no response body');
                        }
                    } else {
                        // https://go.mparticle.com/work/SQDSDKS-6568
                        // XHRUploader returns the response as a string that we need to parse
                        const xhrResponse = (response as unknown) as XMLHttpRequest;
        
                        aliasResponseBody = xhrResponse.responseText
                            ? JSON.parse(xhrResponse.responseText)
                            : '';
                    }

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

                    break;
                    
                // Any unhandled errors, such as 500 or 429, will be caught here as well
                default: {
                    throw new Error('Received HTTP Code of ' + response.status);
                }

            }

            Logger.verbose(message);
            invokeAliasCallback(aliasCallback, response.status, errorMessage);
        } catch (e) {
            const errorMessage = (e as Error).message || e.toString();
            Logger.error(
                'Error sending alias request to mParticle servers. ' + errorMessage,
                ErrorCodes.IDENTITY_API_CLIENT_ERROR
            );
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
        const { invokeCallback } = mpInstance._Helpers;
        const { Logger } = mpInstance;
        Logger.verbose(Messages.InformationMessages.SendIdentityBegin);
        if (!identityApiRequest) {
            Logger.error(Messages.ErrorMessages.APIRequestEmpty, ErrorCodes.IDENTITY_API_CLIENT_ERROR);
            return;
        }
        Logger.verbose(Messages.InformationMessages.SendIdentityHttp);

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

            switch (response.status) {
                case HTTP_ACCEPTED:
                case HTTP_OK:

                // Our Identity API will return a 400 error if there is an issue with the requeest body
                // such as if the body is empty or one of the attributes is missing or malformed
                // A 400 will return an error in the response body and will go through the happy path to report the error
                case HTTP_BAD_REQUEST:
                        
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

                    if (identityResponse.status === HTTP_BAD_REQUEST) {
                        const errorResponse: IdentityApiErrorResponse = identityResponse.responseText as unknown as IdentityApiErrorResponse;
                        message = 'Issue with sending Identity Request to mParticle Servers, received HTTP Code of ' + identityResponse.status;

                        if (errorResponse?.Errors) {
                            const errorMessage = errorResponse.Errors.map((error) => error.message).join(', ');
                            message += ' - ' + errorMessage;
                        }

                    } else {
                        message = 'Received Identity Response from server: ';
                        message += JSON.stringify(identityResponse.responseText);
                    }

                    break;
                    
                // Our Identity API will return:
                // - 401 if the `x-mp-key` is incorrect or missing
                // - 403 if the there is a permission or account issue related to the `x-mp-key`
                // 401 and 403 have no response bodies and should be rejected outright
                default: {
                    throw new Error('Received HTTP Code of ' + response.status);
                }
            }

            mpInstance._Store.identityCallInFlight = false;

            Logger.verbose(message);
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

            Logger.error('Error sending identity request to servers' + ' - ' + errorMessage, ErrorCodes.IDENTITY_API_CLIENT_ERROR);
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
