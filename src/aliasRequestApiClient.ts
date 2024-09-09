import { IdentityCallback } from "./identity-user-interfaces";
import { IAliasRequest } from "./identity.interfaces";
import { MParticleWebSDK } from "./sdkRuntimeModels";
import Constants from './constants';
import { FetchUploader, XHRUploader } from './uploaders';


var HTTPCodes = Constants.HTTPCodes,
    Messages = Constants.Messages;

export async function sendAliasRequest (mpInstance: MParticleWebSDK, aliasRequest: IAliasRequest, callback: IdentityCallback) {
        const { verbose, error } = mpInstance.Logger;
        const { invokeAliasCallback } = mpInstance._Helpers;
        const { aliasUrl } = mpInstance._Store.SDKConfig;
        const { devToken } = mpInstance._Store;

        verbose(Messages.InformationMessages.SendAliasHttp);

        const uploadUrl = `https://${aliasUrl}${devToken}/Alias`;
        const uploader = window.fetch
            ? new FetchUploader(uploadUrl)
            : new XHRUploader(uploadUrl);

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

            let message;
            let aliasResponseBody;

            // FetchUploader returns the response as a JSON object that we have to await
            if (response.json) {
                // HTTP responses of 202, 200, and 403 do not have a response.  response.json will always exist on a fetch, but can only be await-ed when the response is not empty, otherwise it will throw an error.
                try {
                    aliasResponseBody = await response.json();
                } catch (e) {
                    verbose('The request has no response body');
                }
            } else {
                // as unknown as xhrresponse (copy config)
                // https://go.mparticle.com/work/SQDSDKS-6568
                // XHRUploader returns the response as a string that we need to parse
                const xhrResponse = response as unknown as XMLHttpRequest;
                // debugger;
                aliasResponseBody = xhrResponse.responseText
                    ? JSON.parse(xhrResponse.responseText)
                    : '';
            }

            let errorMessage;

            switch (response.status) {
                case 200:
                case 202:
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
            invokeAliasCallback(callback, response.status, errorMessage);
        } catch (e) {
            const err = e as Error;
            error('Error sending alias request to mParticle servers. ' + err);
            invokeAliasCallback(callback, HTTPCodes.noHttpCoverage, (err.message));
        }
    };