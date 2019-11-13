import Constants from './constants';
import Types from './types';
import { BatchUploader } from './batchUploader';

var HTTPCodes = Constants.HTTPCodes,
    Messages = Constants.Messages;

export default function APIClient(mpInstance) {
    this.uploader = null;
    var self = this;
    this.queueEventForBatchUpload = function(event) {
        if (!this.uploader) {
            var millis = mpInstance._Helpers.getFeatureFlag(
                Constants.FeatureFlags.EventBatchingIntervalMillis
            );
            this.uploader = new BatchUploader(mpInstance, millis);
        }
        this.uploader.queueEvent(event);
    };

    this.shouldEnableBatching = function() {
        if (!window.fetch) {
            return false;
        }

        // Returns a string of a number that must be parsed
        // Invalid strings will be parsed to NaN which is falsey
        var eventsV3Percentage = parseInt(
            mpInstance._Helpers.getFeatureFlag(Constants.FeatureFlags.EventsV3),
            10
        );

        if (!eventsV3Percentage) {
            return false;
        }

        var rampNumber = mpInstance._Helpers.getRampNumber(
            mpInstance._Store.deviceId
        );
        return eventsV3Percentage >= rampNumber;
    };

    this.processQueuedEvents = function() {
        var mpid,
            currentUser = mpInstance.Identity.getCurrentUser();
        if (currentUser) {
            mpid = currentUser.getMPID();
        }
        if (mpInstance._Store.eventQueue.length && mpid) {
            var localQueueCopy = mpInstance._Store.eventQueue;
            mpInstance._Store.eventQueue = [];
            this.appendUserInfoToEvents(currentUser, localQueueCopy);
            localQueueCopy.forEach(function(event) {
                self.sendEventToServer(event);
            });
        }
    };

    this.appendUserInfoToEvents = function(user, events) {
        events.forEach(function(event) {
            if (!event.MPID) {
                mpInstance._ServerModel.appendUserInfo(user, event);
            }
        });
    };

    this.sendEventToServer = function(event) {
        if (mpInstance._Store.webviewBridgeEnabled) {
            mpInstance._NativeSdkHelpers.sendToNative(
                Constants.NativeSdkPaths.LogEvent,
                JSON.stringify(event)
            );
            return;
        }

        var mpid,
            currentUser = mpInstance.Identity.getCurrentUser();
        if (currentUser) {
            mpid = currentUser.getMPID();
        }
        mpInstance._Store.requireDelay = mpInstance._Helpers.isDelayedByIntegration(
            mpInstance._preInit.integrationDelays,
            mpInstance._Store.integrationDelayTimeoutStart,
            Date.now()
        );
        // We queue events if there is no MPID (MPID is null, or === 0), or there are integrations that that require this to stall because integration attributes
        // need to be set, or if we are still fetching the config (self hosted only), and so require delaying events
        if (
            !mpid ||
            mpInstance._Store.requireDelay ||
            !mpInstance._Store.configurationLoaded
        ) {
            mpInstance.Logger.verbose(
                'Event was added to eventQueue. eventQueue will be processed once a valid MPID is returned or there is no more integration imposed delay.'
            );
            mpInstance._Store.eventQueue.push(event);
            return;
        }

        this.processQueuedEvents();

        if (this.shouldEnableBatching()) {
            this.queueEventForBatchUpload(event);
        } else {
            this.sendSingleEventToServer(event);
        }

        if (event && event.EventName !== Types.MessageType.AppStateTransition) {
            mpInstance._Forwarders.sendEventToForwarders(event);
        }
    };

    this.sendSingleEventToServer = function(event) {
        if (event.EventDataType === Types.MessageType.Media) {
            return;
        }
        var xhr,
            xhrCallback = function() {
                if (xhr.readyState === 4) {
                    mpInstance.Logger.verbose(
                        'Received ' + xhr.statusText + ' from server'
                    );
                    self.parseEventResponse(xhr.responseText);
                }
            };

        if (!event) {
            mpInstance.Logger.error(Messages.ErrorMessages.EventEmpty);
            return;
        }
        mpInstance.Logger.verbose(Messages.InformationMessages.SendHttp);
        xhr = mpInstance._Helpers.createXHR(xhrCallback);
        if (xhr) {
            try {
                xhr.open(
                    'post',
                    mpInstance._Helpers.createServiceUrl(
                        mpInstance._Store.SDKConfig.v2SecureServiceUrl,
                        mpInstance._Store.devToken
                    ) + '/Events'
                );
                xhr.send(
                    JSON.stringify(
                        mpInstance._ServerModel.convertEventToDTO(
                            event,
                            mpInstance._Store.isFirstRun
                        )
                    )
                );
            } catch (e) {
                mpInstance.Logger.error(
                    'Error sending event to mParticle servers. ' + e
                );
            }
        }
    };

    this.parseEventResponse = function(responseText) {
        var now = new Date(),
            settings,
            prop,
            fullProp;

        if (!responseText) {
            return;
        }

        try {
            mpInstance.Logger.verbose('Parsing response from server');
            settings = JSON.parse(responseText);

            if (settings && settings.Store) {
                mpInstance.Logger.verbose(
                    'Parsed store from response, updating local settings'
                );

                if (!mpInstance._Store.serverSettings) {
                    mpInstance._Store.serverSettings = {};
                }

                for (prop in settings.Store) {
                    if (!settings.Store.hasOwnProperty(prop)) {
                        continue;
                    }

                    fullProp = settings.Store[prop];

                    if (!fullProp.Value || new Date(fullProp.Expires) < now) {
                        // This setting should be deleted from the local store if it exists

                        if (
                            mpInstance._Store.serverSettings.hasOwnProperty(
                                prop
                            )
                        ) {
                            delete mpInstance._Store.serverSettings[prop];
                        }
                    } else {
                        // This is a valid setting
                        mpInstance._Store.serverSettings[prop] = fullProp;
                    }
                }
            }
            mpInstance._Persistence.update();
        } catch (e) {
            mpInstance.Logger.error(
                'Error parsing JSON response from server: ' + e.name
            );
        }
    };

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

    this.sendBatchForwardingStatsToServer = function(forwardingStatsData, xhr) {
        var url, data;
        try {
            url = mpInstance._Helpers.createServiceUrl(
                mpInstance._Store.SDKConfig.v2SecureServiceUrl,
                mpInstance._Store.devToken
            );
            data = {
                uuid: mpInstance._Helpers.generateUniqueId(),
                data: forwardingStatsData,
            };

            if (xhr) {
                xhr.open('post', url + '/Forwarding');
                xhr.send(JSON.stringify(data));
            }
        } catch (e) {
            mpInstance.Logger.error(
                'Error sending forwarding stats to mParticle servers.'
            );
        }
    };

    this.sendSingleForwardingStatsToServer = function(forwardingStatsData) {
        var url, data;
        try {
            var xhrCallback = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 202) {
                        mpInstance.Logger.verbose(
                            'Successfully sent  ' +
                                xhr.statusText +
                                ' from server'
                        );
                    }
                }
            };
            var xhr = mpInstance._Helpers.createXHR(xhrCallback);
            url = mpInstance._Helpers.createServiceUrl(
                mpInstance._Store.SDKConfig.v1SecureServiceUrl,
                mpInstance._Store.devToken
            );
            data = forwardingStatsData;

            if (xhr) {
                xhr.open('post', url + '/Forwarding');
                xhr.send(JSON.stringify(data));
            }
        } catch (e) {
            mpInstance.Logger.error(
                'Error sending forwarding stats to mParticle servers.'
            );
        }
    };

    this.getSDKConfiguration = function(
        apiKey,
        config,
        completeSDKInitialization,
        mpInstance
    ) {
        var url;
        try {
            var xhrCallback = function() {
                if (xhr.readyState === 4) {
                    // when a 200 returns, merge current config with what comes back from config, prioritizing user inputted config
                    if (xhr.status === 200) {
                        config = mpInstance._Helpers.extend(
                            {},
                            config,
                            JSON.parse(xhr.responseText)
                        );
                        completeSDKInitialization(apiKey, config, mpInstance);
                        mpInstance.Logger.verbose(
                            'Successfully received configuration from server'
                        );
                    } else {
                        // if for some reason a 200 doesn't return, then we initialize with the just the passed through config
                        completeSDKInitialization(apiKey, config, mpInstance);
                        mpInstance.Logger.verbose(
                            'Issue with receiving configuration from server, received HTTP Code of ' +
                                xhr.status
                        );
                    }
                }
            };

            var xhr = mpInstance._Helpers.createXHR(xhrCallback);
            url =
                'https://' +
                mpInstance._Store.SDKConfig.configUrl +
                apiKey +
                '/config?env=';
            if (config.isDevelopmentMode) {
                url = url + '1';
            } else {
                url = url + '0';
            }

            if (xhr) {
                xhr.open('get', url);
                xhr.send(null);
            }
        } catch (e) {
            completeSDKInitialization(apiKey, config, mpInstance);
            mpInstance.Logger.error(
                'Error getting forwarder configuration from mParticle servers.'
            );
        }
    };

    this.prepareForwardingStats = function(forwarder, event) {
        var forwardingStatsData,
            queue = mpInstance._Forwarders.getForwarderStatsQueue();

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
                eec: event.ExpandedEventCount,
            };

            if (
                mpInstance._Helpers.getFeatureFlag(
                    Constants.FeatureFlags.ReportBatching
                )
            ) {
                queue.push(forwardingStatsData);
                mpInstance._Forwarders.setForwarderStatsQueue(queue);
            } else {
                self.sendSingleForwardingStatsToServer(forwardingStatsData);
            }
        }
    };
}
