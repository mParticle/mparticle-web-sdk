import { IAliasRequest, IAliasCallback } from "./identity.interfaces";
import { MParticleWebSDK } from "./sdkRuntimeModels";
import Constants from './constants';
import { FetchUploader, XHRUploader } from './uploaders';
import { HTTP_ACCEPTED, HTTP_OK } from "./constants";
import { IIdentityApiClientSendAliasRequest } from "./identityApiClient.interfaces";


const { HTTPCodes, Messages } = Constants;

interface IAliasResponseBody {
    message?: string
}

export const sendAliasRequest: IIdentityApiClientSendAliasRequest = async function  (mpInstance: MParticleWebSDK, aliasRequest: IAliasRequest, aliasCallback: IAliasCallback): Promise<void> {
        const { verbose, error } = mpInstance.Logger;
        const { invokeAliasCallback } = mpInstance._Helpers;
        const { aliasUrl } = mpInstance._Store.SDKConfig;
        const { devToken: apiKey } = mpInstance._Store;

        verbose(Messages.InformationMessages.SendAliasHttp);

        // https://go.mparticle.com/work/SQDSDKS-6750
        const uploadUrl = `https://${aliasUrl}${apiKey}/Alias`;
        const uploader = window.fetch
        ? new FetchUploader(uploadUrl)
        : new XHRUploader(uploadUrl);
        
        
        // https://go.mparticle.com/work/SQDSDKS-6568
        const uploadPayload = {
            method: 'post',
            headers: {
                Accept: 'text/plain;charset=UTF-8',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(aliasRequest),
        };

        try {
            const response = await uploader.upload(uploadPayload);

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
                const xhrResponse = response as unknown as XMLHttpRequest;

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
            invokeAliasCallback(aliasCallback, HTTPCodes.noHttpCoverage, (err.message));
        }
    };