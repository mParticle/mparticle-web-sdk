import Constants from './constants';
import Types from './types';
import { BatchUploader } from './batchUploader';

var Messages = Constants.Messages;

export default function APIClient(mpInstance, kitBlocker) {
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
            if (kitBlocker && kitBlocker.kitBlockingEnabled) {
                event = kitBlocker.createBlockedEvent(event);
            }
            if (event) {
                mpInstance._Forwarders.sendEventToForwarders(event);
            }
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
                    mpInstance._Persistence.update();
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
                        mpInstance._ServerModel.convertEventToDTO(event)
                    )
                );
            } catch (e) {
                mpInstance.Logger.error(
                    'Error sending event to mParticle servers. ' + e
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
                dp: event.DataPlan,
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
