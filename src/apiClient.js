import Helpers from './helpers';
import Constants from './constants';
import NativeSdkHelpers from './nativeSdkHelpers';
import ServerModel from './serverModel';
import Types from './types';
import { BatchUploader } from './batchUploader';
import Persistence from './persistence';
import Forwarders from './forwarders';

var HTTPCodes = Constants.HTTPCodes,
    Messages = Constants.Messages,
    uploader = null;

function queueEventForBatchUpload(event) {
    if (!uploader){
        var millis = Helpers.getFeatureFlag(Constants.FeatureFlags.EventBatchingIntervalMillis);
        uploader = new BatchUploader(mParticle, millis);
    }
    uploader.queueEvent(event);
}

function shouldEnableBatching() {
    if (!window.fetch) {
        return false;
    }
    var eventsV3Percentage = Helpers.getFeatureFlag(Constants.FeatureFlags.EventsV3);
    if (!eventsV3Percentage || !Helpers.Validators.isNumber(eventsV3Percentage)) {
        return false;
    }
    var rampNumber = Helpers.getRampNumber(mParticle.Store.deviceId);
    return eventsV3Percentage >= rampNumber;
}

function processQueuedEvents() {
    var mpid,
        currentUser = mParticle.Identity.getCurrentUser();
    if (currentUser) {
        mpid = currentUser.getMPID();
    }
    if (mParticle.Store.eventQueue.length && mpid) {
        var localQueueCopy = mParticle.Store.eventQueue;
        mParticle.Store.eventQueue = [];
        appendUserInfoToEvents(currentUser, localQueueCopy);
        localQueueCopy.forEach(function(event) {
            sendEventToServer(event);
        });
    }
}

function appendUserInfoToEvents(user, events) {
    events.forEach(function(event) {
        if (!event.MPID) {
            ServerModel.appendUserInfo(user, event);
        }
    });
}

function sendEventToServer(event) {
    if (mParticle.Store.webviewBridgeEnabled) {
        NativeSdkHelpers.sendToNative(Constants.NativeSdkPaths.LogEvent, JSON.stringify(event));
        return;
    }
    
    var mpid,
        currentUser = mParticle.Identity.getCurrentUser();
    if (currentUser) {
        mpid = currentUser.getMPID();
    }
    mParticle.Store.requireDelay = Helpers.isDelayedByIntegration(mParticle.preInit.integrationDelays, mParticle.Store.integrationDelayTimeoutStart, Date.now());
    // We queue events if there is no MPID (MPID is null, or === 0), or there are integrations that that require this to stall because integration attributes
    // need to be set, or if we are still fetching the config (self hosted only), and so require delaying events
    if (!mpid || mParticle.Store.requireDelay || !mParticle.Store.configurationLoaded) {
        mParticle.Logger.verbose('Event was added to eventQueue. eventQueue will be processed once a valid MPID is returned or there is no more integration imposed delay.');
        mParticle.Store.eventQueue.push(event);
        return;
    }

    processQueuedEvents();

    if (shouldEnableBatching()) {
        queueEventForBatchUpload(event);
    } else {
        sendSingleEventToServer(event);
    }

    if (event && event.EventName !== Types.MessageType.AppStateTransition) {
        Forwarders.sendEventToForwarders(event);
    }
}

function sendSingleEventToServer(event) {
    if (event.EventDataType === Types.MessageType.Media) {
        return;
    }
    var xhr,
        xhrCallback = function() {
            if (xhr.readyState === 4) {
                mParticle.Logger.verbose('Received ' + xhr.statusText + ' from server');
                parseEventResponse(xhr.responseText);
            }
        };
    
    if (!event) {
        mParticle.Logger.error(Messages.ErrorMessages.EventEmpty);
        return;
    }
    mParticle.Logger.verbose(Messages.InformationMessages.SendHttp);
    xhr = Helpers.createXHR(xhrCallback);
    if (xhr) {
        try {
            xhr.open('post', Helpers.createServiceUrl(mParticle.Store.SDKConfig.v2SecureServiceUrl, mParticle.Store.devToken) + '/Events');
            xhr.send(JSON.stringify(ServerModel.convertEventToDTO(event, mParticle.Store.isFirstRun)));
        }
        catch (e) {
            mParticle.Logger.error('Error sending event to mParticle servers. ' + e);
        }
    }
    
}

function parseEventResponse(responseText) {
    var now = new Date(),
        settings,
        prop,
        fullProp;

    if (!responseText) {
        return;
    }

    try {
        mParticle.Logger.verbose('Parsing response from server');
        settings = JSON.parse(responseText);

        if (settings && settings.Store) {
            mParticle.Logger.verbose('Parsed store from response, updating local settings');

            if (!mParticle.Store.serverSettings) {
                mParticle.Store.serverSettings = {};
            }

            for (prop in settings.Store) {
                if (!settings.Store.hasOwnProperty(prop)) {
                    continue;
                }

                fullProp = settings.Store[prop];

                if (!fullProp.Value || new Date(fullProp.Expires) < now) {
                    // This setting should be deleted from the local store if it exists

                    if (mParticle.Store.serverSettings.hasOwnProperty(prop)) {
                        delete mParticle.Store.serverSettings[prop];
                    }
                }
                else {
                    // This is a valid setting
                    mParticle.Store.serverSettings[prop] = fullProp;
                }
            }

            Persistence.update();
        }
    }
    catch (e) {
        mParticle.Logger.error('Error parsing JSON response from server: ' + e.name);
    }
}

function sendAliasRequest(aliasRequest, callback) {
    var xhr,
        xhrCallback = function() {
            if (xhr.readyState === 4) {
                mParticle.Logger.verbose('Received ' + xhr.statusText + ' from server');
                //only parse error messages from failing requests
                if (xhr.status !== 200 && xhr.status !== 202) {
                    if (xhr.responseText) {
                        var response = JSON.parse(xhr.responseText);
                        if (response.hasOwnProperty('message')) {
                            var errorMessage = response.message;
                            Helpers.invokeAliasCallback(callback, xhr.status, errorMessage);
                            return;
                        }
                    }
                }
                Helpers.invokeAliasCallback(callback, xhr.status);
            }
        };
    mParticle.Logger.verbose(Messages.InformationMessages.SendAliasHttp);

    xhr = Helpers.createXHR(xhrCallback);
    if (xhr) {
        try {
            xhr.open('post', Helpers.createServiceUrl(mParticle.Store.SDKConfig.aliasUrl, mParticle.Store.devToken) + '/Alias');
            xhr.send(JSON.stringify(aliasRequest));
        }
        catch (e) {
            Helpers.invokeAliasCallback(callback, HTTPCodes.noHttpCoverage, e);
            mParticle.Logger.error('Error sending alias request to mParticle servers. ' + e);
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
                Helpers.invokeCallback(callback, HTTPCodes.activeIdentityRequest, 'There is currently an Identity request processing. Please wait for this to return before requesting again');
            } else {
                previousMPID = mpid || null;
                if (method === 'modify') {
                    xhr.open('post', Helpers.createServiceUrl(mParticle.Store.SDKConfig.identityUrl) + mpid + '/' + method);
                } else {
                    xhr.open('post', Helpers.createServiceUrl(mParticle.Store.SDKConfig.identityUrl) + method);
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
        url = Helpers.createServiceUrl(mParticle.Store.SDKConfig.v2SecureServiceUrl, mParticle.Store.devToken);
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
        url = Helpers.createServiceUrl(mParticle.Store.SDKConfig.v1SecureServiceUrl, mParticle.Store.devToken);
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

function getSDKConfiguration(apiKey, config, completeSDKInitialization) {
    var url;
    try {
        var xhrCallback = function() {
            if (xhr.readyState === 4) { 
                // when a 200 returns, merge current config with what comes back from config, prioritizing user inputted config
                if (xhr.status === 200) {
                    config = Helpers.extend({}, config, JSON.parse(xhr.responseText));
                    completeSDKInitialization(apiKey, config);
                    mParticle.Logger.verbose('Successfully received configuration from server');
                } else {
                    // if for some reason a 200 doesn't return, then we initialize with the just the passed through config
                    completeSDKInitialization(apiKey, config);
                    mParticle.Logger.verbose('Issue with receiving configuration from server, received HTTP Code of ' + xhr.status);
                }
            }
        };

        var xhr = Helpers.createXHR(xhrCallback);
        url = 'https://' + mParticle.Store.SDKConfig.configUrl + apiKey + '/config?env=';
        if (config.isDevelopmentMode) {
            url = url + '1';
        } else {
            url = url + '0';
        }

        if (xhr) {
            xhr.open('get', url);
            xhr.send(null);
        }
    }
    catch (e) {
        completeSDKInitialization(apiKey, config);
        mParticle.Logger.error('Error getting forwarder configuration from mParticle servers.');
    }
}

function prepareForwardingStats(forwarder, event) {
    var forwardingStatsData,
        queue = Forwarders.getForwarderStatsQueue();

    if (forwarder && forwarder.isVisible) {
        forwardingStatsData = {
            mid: forwarder.id,
            esid: forwarder.eventSubscriptionId,
            n: event.EventName,
            attrs: event.EventAttributes,
            sdk: event.SDKVersion,
            dt: event.EventDataType,
            et: event.EventCategory,
            dbg: event.Debug,
            ct: event.Timestamp,
            eec: event.ExpandedEventCount
        };

        if (Helpers.getFeatureFlag(Constants.FeatureFlags.ReportBatching)) {
            queue.push(forwardingStatsData);
            Forwarders.setForwarderStatsQueue(queue);
        } else {
            sendSingleForwardingStatsToServer(forwardingStatsData);
        }
    }
}

export default {
    sendEventToServer: sendEventToServer,
    sendIdentityRequest: sendIdentityRequest,
    sendBatchForwardingStatsToServer: sendBatchForwardingStatsToServer,
    sendSingleForwardingStatsToServer: sendSingleForwardingStatsToServer,
    sendAliasRequest: sendAliasRequest,
    getSDKConfiguration: getSDKConfiguration,
    prepareForwardingStats: prepareForwardingStats,
    processQueuedEvents: processQueuedEvents,
    appendUserInfoToEvents: appendUserInfoToEvents,
    shouldEnableBatching: shouldEnableBatching
};