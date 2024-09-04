import Constants from './constants';
import { xhrIdentityResponseAdapter } from './identity-utils';
import { FetchUploader, XHRUploader } from './uploaders';

var HTTPCodes = Constants.HTTPCodes,
    Messages = Constants.Messages;

const { Modify } = Constants.IdentityMethods;

export default function IdentityAPIClient(mpInstance) {
    this.sendAliasRequest = async function(aliasRequest, callback) {
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
            debugger;
            let message;
            // This is a fire and forget, so we only need to log the response based on the code, and not return any response body
            if (response.status === 202 || response.status === 200) {
                // https://go.mparticle.com/work/SQDSDKS-6670
                message =
                    'Successfully sent forwarding stats to mParticle Servers';
            } else {
                message =
                    'Issue with forwarding stats to mParticle Servers, received HTTP Code of ' +
                    response.status;
            }
            verbose(message);
            invokeAliasCallback(callback, response.status);
        } catch (e) {
            error('Error sending alias request to mParticle servers. ' + e);
            invokeAliasCallback(callback, HTTPCodes.noHttpCoverage, e.message);
        }
    };

    this.sendIdentityRequest = function(
        identityApiRequest,
        method,
        callback,
        originalIdentityApiData,
        parseIdentityResponse,
        mpid,
        knownIdentities
    ) {
        var xhr,
            previousMPID,
            xhrCallback = function() {
                if (xhr.readyState === 4) {
                    // https://go.mparticle.com/work/SQDSDKS-6368
                    mpInstance.Logger.verbose(
                        'Received ' + xhr.statusText + ' from server'
                    );

                    // https://go.mparticle.com/work/SQDSDKS-6565
                    const identityResponse = xhrIdentityResponseAdapter(xhr);
                    parseIdentityResponse(
                        identityResponse,
                        previousMPID,
                        callback,
                        originalIdentityApiData,
                        method,
                        knownIdentities,
                        false
                    );
                }
            };

        mpInstance.Logger.verbose(
            Messages.InformationMessages.SendIdentityBegin
        );

        if (!identityApiRequest) {
            mpInstance.Logger.error(Messages.ErrorMessages.APIRequestEmpty);
            return;
        }

        mpInstance.Logger.verbose(
            Messages.InformationMessages.SendIdentityHttp
        );
        xhr = mpInstance._Helpers.createXHR(xhrCallback);

        if (xhr) {
            try {
                if (mpInstance._Store.identityCallInFlight) {
                    mpInstance._Helpers.invokeCallback(
                        callback,
                        HTTPCodes.activeIdentityRequest,
                        'There is currently an Identity request processing. Please wait for this to return before requesting again'
                    );
                } else {
                    previousMPID = mpid || null;
                    if (method === Modify) {
                        xhr.open(
                            'post',
                            mpInstance._Helpers.createServiceUrl(
                                mpInstance._Store.SDKConfig.identityUrl
                            ) +
                                mpid +
                                '/' +
                                method
                        );
                    } else {
                        xhr.open(
                            'post',
                            mpInstance._Helpers.createServiceUrl(
                                mpInstance._Store.SDKConfig.identityUrl
                            ) + method
                        );
                    }
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.setRequestHeader(
                        'x-mp-key',
                        mpInstance._Store.devToken
                    );
                    mpInstance._Store.identityCallInFlight = true;
                    xhr.send(JSON.stringify(identityApiRequest));
                }
            } catch (e) {
                mpInstance._Store.identityCallInFlight = false;
                mpInstance._Helpers.invokeCallback(
                    callback,
                    HTTPCodes.noHttpCoverage,
                    e
                );
                mpInstance.Logger.error(
                    'Error sending identity request to servers with status code ' +
                        xhr.status +
                        ' - ' +
                        e
                );
            }
        }
    };
}
