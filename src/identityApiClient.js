import Constants from './constants';
import { xhrIdentityResponseAdapter } from './identity-utils';
import { sendAliasRequest } from './aliasRequestApiClient';
var HTTPCodes = Constants.HTTPCodes,
    Messages = Constants.Messages;

const { Modify } = Constants.IdentityMethods;

export default function IdentityAPIClient(mpInstance) {
    this.sendAliasRequest = async function(aliasRequest, callback) {
        await sendAliasRequest(mpInstance, aliasRequest, callback);
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
