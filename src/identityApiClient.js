import Constants from './constants';
import { sendAliasRequest } from './aliasRequestApiClient';
import { FetchUploader, XHRUploader } from './uploaders';
import { CACHE_HEADER } from './identity-utils';
import { parseNumber } from './utils';

var HTTPCodes = Constants.HTTPCodes,
    Messages = Constants.Messages;

const { Modify } = Constants.IdentityMethods;

export default function IdentityAPIClient(mpInstance) {
    this.sendAliasRequest = async function (aliasRequest, callback) {
        await sendAliasRequest(mpInstance, aliasRequest, callback);
    };

    this.sendIdentityRequest = async function (
        identityApiRequest,
        method,
        callback,
        originalIdentityApiData,
        parseIdentityResponse,
        mpid,
        knownIdentities
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

        const uploader = window.fetch
            ? new FetchUploader(uploadUrl)
            : new XHRUploader(uploadUrl);

        const fetchPayload = {
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
            const response = await uploader.upload(fetchPayload);

            let identityResponse;

            if (response.json) {
                // https://go.mparticle.com/work/SQDSDKS-6568
                // FetchUploader returns the response as a JSON object that we have to await
                const responseBody = await response.json();
                identityResponse = this.getIdentityResponseFromFetch(
                    response,
                    responseBody
                );
            } else {
                identityResponse = this.getIdentityResponseFromXHR(response);
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
            mpInstance._Store.identityCallInFlight = false;
            invokeCallback(callback, HTTPCodes.noHttpCoverage, err);
            error('Error sending identity request to servers' + ' - ' + err);
        }
    };

    this.getUploadUrl = (method, mpid) => {
        const uploadServiceUrl = mpInstance._Helpers.createServiceUrl(
            mpInstance._Store.SDKConfig.identityUrl
        );

        const uploadUrl =
            method === Modify
                ? uploadServiceUrl + mpid + '/' + method
                : uploadServiceUrl + method;

        return uploadUrl;
    };

    this.getIdentityResponseFromFetch = (response, responseBody) => ({
        status: response.status,
        responseText: responseBody,
        cacheMaxAge: parseInt(response.headers.get(CACHE_HEADER)) || 0,
        expireTimestamp: 0,
    });

    this.getIdentityResponseFromXHR = (response) => ({
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
