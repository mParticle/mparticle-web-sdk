import Constants from './constants';

var HTTPCodes = Constants.HTTPCodes,
    Messages = Constants.Messages;

export default function IdentityAPIClient(mpInstance) {
    this.sendAliasRequest = function(aliasRequest, callback) {
        var xhr,
            xhrCallback = function() {
                if (xhr.readyState === 4) {
                    mpInstance.Logger.verbose(
                        'Received ' + xhr.statusText + ' from server'
                    );
                    //only parse error messages from failing requests
                    if (xhr.status !== 200 && xhr.status !== 202) {
                        if (xhr.responseText) {
                            var response = JSON.parse(xhr.responseText);
                            if (response.hasOwnProperty('message')) {
                                var errorMessage = response.message;
                                mpInstance._Helpers.invokeAliasCallback(
                                    callback,
                                    xhr.status,
                                    errorMessage
                                );
                                return;
                            }
                        }
                    }
                    mpInstance._Helpers.invokeAliasCallback(
                        callback,
                        xhr.status
                    );
                }
            };
        mpInstance.Logger.verbose(Messages.InformationMessages.SendAliasHttp);

        xhr = mpInstance._Helpers.createXHR(xhrCallback);
        if (xhr) {
            try {
                xhr.open(
                    'post',
                    mpInstance._Helpers.createServiceUrl(
                        mpInstance._Store.SDKConfig.aliasUrl,
                        mpInstance._Store.devToken
                    ) + '/Alias'
                );
                xhr.send(JSON.stringify(aliasRequest));
            } catch (e) {
                mpInstance._Helpers.invokeAliasCallback(
                    callback,
                    HTTPCodes.noHttpCoverage,
                    e
                );
                mpInstance.Logger.error(
                    'Error sending alias request to mParticle servers. ' + e
                );
            }
        }
    };

    this.sendIdentityRequest = function(
        identityApiRequest,
        method,
        callback,
        originalIdentityApiData,
        parseIdentityResponse,
        mpid
    ) {
        var xhr,
            previousMPID,
            xhrCallback = function() {
                if (xhr.readyState === 4) {
                    mpInstance.Logger.verbose(
                        'Received ' + xhr.statusText + ' from server'
                    );
                    parseIdentityResponse(
                        xhr,
                        previousMPID,
                        callback,
                        originalIdentityApiData,
                        method
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
                    if (method === 'modify') {
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
