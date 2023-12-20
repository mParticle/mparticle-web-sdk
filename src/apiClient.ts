import Constants from './constants';
import Types from './types';
import { BatchUploader } from './batchUploader';
import { MParticleUser, MParticleWebSDK, SDKEvent } from './sdkRuntimeModels';
import KitBlocker from './kitBlocking';
import { Dictionary, isEmpty } from './utils';
import { IUploadObject } from './serverModel';
import { MPForwarder } from './forwarders.interfaces';

export type ForwardingStatsData = Dictionary<any>;

export interface IAPIClient {
    uploader: BatchUploader | null;
    queueEventForBatchUpload: (event: SDKEvent) => void;
    processQueuedEvents: () => void;
    appendUserInfoToEvents: (user: MParticleUser, events: SDKEvent[]) => void;
    sendEventToServer: (event: SDKEvent, _options?: Dictionary<any>) => void;
    sendSingleEventToServer: (event: SDKEvent) => void;
    sendBatchForwardingStatsToServer: (
        forwardingStatsData: ForwardingStatsData,
        xhr: XMLHttpRequest
    ) => void;
    sendSingleForwardingStatsToServer: (
        forwardingStatsData: ForwardingStatsData
    ) => void;
    prepareForwardingStats: (
        forwarder: MPForwarder,
        event: IUploadObject
    ) => void;
}

export default function APIClient(
    this: IAPIClient,
    mpInstance: MParticleWebSDK,
    kitBlocker: KitBlocker
) {
    this.uploader = null;
    const self = this;
    this.queueEventForBatchUpload = function(event: SDKEvent) {
        if (!this.uploader) {
            const millis = mpInstance._Helpers.getFeatureFlag(
                Constants.FeatureFlags.EventBatchingIntervalMillis
            );
            this.uploader = new BatchUploader(mpInstance, millis);
        }
        this.uploader.queueEvent(event);

        mpInstance._Persistence.update();
    };

    this.processQueuedEvents = function() {
        let mpid,
            currentUser = mpInstance.Identity.getCurrentUser();
        if (currentUser) {
            mpid = currentUser.getMPID();
        }
        if (mpInstance._Store.eventQueue.length && mpid) {
            const localQueueCopy = mpInstance._Store.eventQueue;
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

    this.sendEventToServer = function(event, _options) {
        const defaultOptions = {
            shouldUploadEvent: true,
        };
        const options = mpInstance._Helpers.extend(defaultOptions, _options);

        if (mpInstance._Store.webviewBridgeEnabled) {
            mpInstance._NativeSdkHelpers.sendToNative(
                Constants.NativeSdkPaths.LogEvent,
                JSON.stringify(event)
            );
            return;
        }

        let mpid,
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

        if (isEmpty(event)) {
            return;
        }

        if (options.shouldUploadEvent) {
            this.queueEventForBatchUpload(event);
        }

        if (event.EventName !== Types.MessageType.AppStateTransition) {
            if (kitBlocker && kitBlocker.kitBlockingEnabled) {
                event = kitBlocker.createBlockedEvent(event);
            }

            // We need to check event again, because kitblocking
            // can nullify the event
            if (event) {
                mpInstance._Forwarders.sendEventToForwarders(event);
            }
        }
    };

    this.sendBatchForwardingStatsToServer = function(forwardingStatsData, xhr) {
        let url;
        let data;
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
        let url;
        let data;
        try {
            const xhrCallback = function() {
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
            const xhr = mpInstance._Helpers.createXHR(xhrCallback);
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
        let forwardingStatsData;
        const queue = mpInstance._Forwarders.getForwarderStatsQueue();

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
