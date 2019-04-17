var Helpers = require('./helpers'),
    Constants = require('./constants'),
    NativeSdkHelpers = require('./nativeSdkHelpers'),
    HTTPCodes = Constants.HTTPCodes,
    ServerModel = require('./serverModel'),
    Types = require('./types'),
    Messages = Constants.Messages;

function sendEventToServer(event, sendEventToForwarders, parseEventResponse) {
    var mpid,
        currentUser = mParticle.Identity.getCurrentUser();
    if (currentUser) {
        mpid = currentUser.getMPID();
    }
    if (mParticle.Store.webviewBridgeEnabled) {
        NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.LogEvent, JSON.stringify(event));
    } else {
        var xhr,
            xhrCallback = function() {
                if (xhr.readyState === 4) {
                    mParticle.Logger.verbose('Received ' + xhr.statusText + ' from server');

                    parseEventResponse(xhr.responseText);
                }
            };

        mParticle.Logger.verbose(Messages.InformationMessages.SendBegin);

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

        mParticle.Store.requireDelay = Helpers.isDelayedByIntegration(mParticle.preInit.integrationDelays, mParticle.Store.integrationDelayTimeoutStart, Date.now());
        // We queue events if there is no MPID (MPID is null, or === 0), or there are integrations that that require this to stall because integration attributes
        // need to be set, and so require delaying events
        if (!mpid || mParticle.Store.requireDelay) {
            mParticle.Logger.verbose('Event was added to eventQueue. eventQueue will be processed once a valid MPID is returned or there is no more integration imposed delay.');
            mParticle.Store.eventQueue.push(event);
        } else {
            Helpers.processQueuedEvents(mParticle.Store.eventQueue, mpid, !mParticle.Store.requiredDelay, sendEventToServer, sendEventToForwarders, parseEventResponse);

            if (!event) {
                mParticle.Logger.error(Messages.ErrorMessages.EventEmpty);
                return;
            }

            mParticle.Logger.verbose(Messages.InformationMessages.SendHttp);

            xhr = Helpers.createXHR(xhrCallback);

            if (xhr) {
                try {
                    xhr.open('post', Helpers.createServiceUrl(Constants.v2SecureServiceUrl, Constants.v2ServiceUrl, mParticle.Store.devToken) + '/Events');
                    xhr.send(JSON.stringify(ServerModel.convertEventToDTO(event, mParticle.Store.isFirstRun, mParticle.Store.currencyCode, mParticle.Store.integrationAttributes)));

                    if (event.EventName !== Types.MessageType.AppStateTransition) {
                        sendEventToForwarders(event);
                    }
                }
                catch (e) {
                    mParticle.Logger.error('Error sending event to mParticle servers. ' + e);
                }
            }
        }
    }
}

function sendIdentityRequest(identityApiRequest, method, callback, originalIdentityApiData, parseIdentityResponse, mpid) {
    var xhr, previousMPID,
        xhrCallback = function() {
            if (xhr.readyState === 4) {
                mParticle.Logger.verbose('Received ' + xhr.statusText + ' from server');
                parseIdentityResponse(xhr, previousMPID, callback, originalIdentityApiData, method);
            }
        };

    mParticle.Logger.verbose(Messages.InformationMessages.SendIdentityBegin);

    if (!identityApiRequest) {
        mParticle.Logger.error(Messages.ErrorMessages.APIRequestEmpty);
        return;
    }

    mParticle.Logger.verbose(Messages.InformationMessages.SendIdentityHttp);
    xhr = Helpers.createXHR(xhrCallback);

    if (xhr) {
        try {
            if (mParticle.Store.identityCallInFlight) {
                callback({httpCode: HTTPCodes.activeIdentityRequest, body: 'There is currently an AJAX request processing. Please wait for this to return before requesting again'});
            } else {
                previousMPID = (!mParticle.Store.isFirstRun && mpid) ? mpid : null;
                if (method === 'modify') {
                    xhr.open('post', Constants.identityUrl + mpid + '/' + method);
                } else {
                    xhr.open('post', Constants.identityUrl + method);
                }
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('x-mp-key', mParticle.Store.devToken);
                mParticle.Store.identityCallInFlight = true;
                xhr.send(JSON.stringify(identityApiRequest));
            }
        }
        catch (e) {
            mParticle.Store.identityCallInFlight = false;
            Helpers.invokeCallback(callback, HTTPCodes.noHttpCoverage, e);
            mParticle.Logger.error('Error sending identity request to servers with status code ' + xhr.status + ' - ' + e);
        }
    }
}

function sendBatchForwardingStatsToServer(forwardingStatsData, xhr) {
    var url, data;
    try {
        url = Helpers.createServiceUrl(Constants.v2SecureServiceUrl, Constants.v2ServiceUrl, mParticle.Store.devToken);
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
        mParticle.Logger.error('Error sending forwarding stats to mParticle servers.');
    }
}

function sendSingleForwardingStatsToServer(forwardingStatsData) {
    var url, data;
    try {
        var xhrCallback = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 202) {
                    mParticle.Logger.verbose('Successfully sent  ' + xhr.statusText + ' from server');
                }
            }
        };
        var xhr = Helpers.createXHR(xhrCallback);
        url = Helpers.createServiceUrl(Constants.v1SecureServiceUrl, Constants.v1ServiceUrl, mParticle.Store.devToken);
        data = forwardingStatsData;

        if (xhr) {
            xhr.open('post', url + '/Forwarding');
            xhr.send(JSON.stringify(data));
        }
    }
    catch (e) {
        mParticle.Logger.error('Error sending forwarding stats to mParticle servers.');
    }
}

module.exports = {
    sendEventToServer: sendEventToServer,
    sendIdentityRequest: sendIdentityRequest,
    sendBatchForwardingStatsToServer: sendBatchForwardingStatsToServer,
    sendSingleForwardingStatsToServer: sendSingleForwardingStatsToServer
};
