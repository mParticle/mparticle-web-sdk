var Helpers = require('./helpers'),
    Constants = require('./constants'),
    HTTPCodes = Constants.HTTPCodes,
    MP = require('./mp'),
    ServerModel = require('./serverModel'),
    Types = require('./types'),
    Messages = Constants.Messages;

function sendEventToServer(event, sendEventToForwarders, parseEventResponse) {
    if (Helpers.shouldUseNativeSdk()) {
        Helpers.sendToNative(Constants.NativeSdkPaths.LogEvent, JSON.stringify(event));
    } else {
        var xhr,
            xhrCallback = function() {
                if (xhr.readyState === 4) {
                    Helpers.logDebug('Received ' + xhr.statusText + ' from server');

                    parseEventResponse(xhr.responseText);
                }
            };

        Helpers.logDebug(Messages.InformationMessages.SendBegin);

        var validUserIdentities = [];

        // convert userIdentities which are objects with key of IdentityType (number) and value ID to an array of Identity objects for DTO and event forwarding
        if (Helpers.isObject(event.UserIdentities) && Object.keys(event.UserIdentities).length) {
            for (var key in event.UserIdentities) {
                var userIdentity = {};
                userIdentity.Identity = event.UserIdentities[key];
                userIdentity.Type = Helpers.parseNumber(key);
                validUserIdentities.push(userIdentity);
            }
            event.UserIdentities = validUserIdentities;
        } else {
            event.UserIdentities = [];
        }

        // When there is no MPID (MPID is null, or === 0), we queue events until we have a valid MPID
        if (!MP.mpid) {
            Helpers.logDebug('Event was added to eventQueue. eventQueue will be processed once a valid MPID is returned');
            MP.eventQueue.push(event);
        } else {
            if (!event) {
                Helpers.logDebug(Messages.ErrorMessages.EventEmpty);
                return;
            }

            Helpers.logDebug(Messages.InformationMessages.SendHttp);

            xhr = Helpers.createXHR(xhrCallback);

            if (xhr) {
                try {
                    xhr.open('post', Helpers.createServiceUrl(Constants.v2SecureServiceUrl, Constants.v2ServiceUrl, MP.devToken) + '/Events');
                    xhr.send(JSON.stringify(ServerModel.convertEventToDTO(event, MP.isFirstRun, MP.currencyCode)));

                    if (event.EventName !== Types.MessageType.AppStateTransition) {
                        sendEventToForwarders(event);
                    }
                }
                catch (e) {
                    Helpers.logDebug('Error sending event to mParticle servers. ' + e);
                }
            }
        }
    }
}

function sendIdentityRequest(identityApiRequest, method, callback, originalIdentityApiData, parseIdentityResponse) {
    var xhr, previousMPID,
        xhrCallback = function() {
            if (xhr.readyState === 4) {
                Helpers.logDebug('Received ' + xhr.statusText + ' from server');
                parseIdentityResponse(xhr, previousMPID, callback, originalIdentityApiData, method);
            }
        };

    Helpers.logDebug(Messages.InformationMessages.SendIdentityBegin);

    if (!identityApiRequest) {
        Helpers.logDebug(Messages.ErrorMessages.APIRequestEmpty);
        return;
    }

    Helpers.logDebug(Messages.InformationMessages.SendIdentityHttp);
    xhr = Helpers.createXHR(xhrCallback);

    if (xhr) {
        try {
            if (MP.identityCallInFlight) {
                callback({httpCode: HTTPCodes.activeIdentityRequest, body: 'There is currently an AJAX request processing. Please wait for this to return before requesting again'});
            } else {
                previousMPID = (!MP.isFirstRun && MP.mpid) ? MP.mpid : null;
                if (method === 'modify') {
                    xhr.open('post', Constants.identityUrl + MP.mpid + '/' + method);
                } else {
                    xhr.open('post', Constants.identityUrl + method);
                }
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('x-mp-key', MP.devToken);
                MP.identityCallInFlight = true;
                xhr.send(JSON.stringify(identityApiRequest));
            }
        }
        catch (e) {
            MP.identityCallInFlight = false;
            Helpers.invokeCallback(callback, HTTPCodes.noHttpCoverage, e);
            Helpers.logDebug('Error sending identity request to servers with status code ' + xhr.status + ' - ' + e);
        }
    }
}

function sendBatchForwardingStatsToServer(forwardingStatsData, xhr) {
    var url, data;
    try {
        url = Helpers.createServiceUrl(Constants.v2SecureServiceUrl, Constants.v2ServiceUrl, MP.devToken);
        data = {
            uuid: Helpers.generateUniqueId(),
            data: forwardingStatsData
        };

        if (xhr) {
            xhr.open('post', url + '/Forwarding');
            xhr.send(JSON.stringify(data));
        }
    }
    catch (e) {
        Helpers.logDebug('Error sending forwarding stats to mParticle servers.');
    }
}

function sendSingleForwardingStatsToServer(forwardingStatsData) {
    var url, data;
    try {
        var xhrCallback = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 202) {
                    Helpers.logDebug('Successfully sent  ' + xhr.statusText + ' from server');
                }
            }
        };
        var xhr = Helpers.createXHR(xhrCallback);
        url = Helpers.createServiceUrl(Constants.v1SecureServiceUrl, Constants.v1ServiceUrl, MP.devToken);
        data = forwardingStatsData;

        if (xhr) {
            xhr.open('post', url + '/Forwarding');
            xhr.send(JSON.stringify(data));
        }
    }
    catch (e) {
        Helpers.logDebug('Error sending forwarding stats to mParticle servers.');
    }
}

module.exports = {
    sendEventToServer: sendEventToServer,
    sendIdentityRequest: sendIdentityRequest,
    sendBatchForwardingStatsToServer: sendBatchForwardingStatsToServer,
    sendSingleForwardingStatsToServer: sendSingleForwardingStatsToServer
};
