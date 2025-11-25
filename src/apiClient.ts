import Constants from './constants';
import Types from './types';
import { BatchUploader } from './batchUploader';
import { SDKEvent, SDKDataPlan } from './sdkRuntimeModels';
import KitBlocker from './kitBlocking';
import { Dictionary, isEmpty, parseNumber } from './utils';
import { IUploadObject } from './serverModel';
import { MPForwarder } from './forwarders.interfaces';
import { IMParticleUser, ISDKUserAttributes } from './identity-user-interfaces';
import { AsyncUploader, FetchUploader, XHRUploader } from './uploaders';
import { IMParticleWebSDKInstance } from './mp-instance';
import { appendUserInfo } from './user-utils';
import { LogRequest } from './logging/logRequest';

export interface IAPIClient {
    uploader: BatchUploader | null;
    queueEventForBatchUpload: (event: SDKEvent) => void;
    processQueuedEvents: () => void;
    appendUserInfoToEvents: (user: IMParticleUser, events: SDKEvent[]) => void;
    sendEventToServer: (event: SDKEvent, _options?: Dictionary<any>) => void;
    sendSingleEventToServer: (event: SDKEvent) => void;
    sendBatchForwardingStatsToServer: (
        forwardingStatsData: IForwardingStatsData,
        xhr: XMLHttpRequest
    ) => void;
    initializeForwarderStatsUploader: () => AsyncUploader;
    prepareForwardingStats: (
        forwarder: MPForwarder,
        event: IUploadObject
    ) => void;
    sendLogToServer: (log: LogRequest) => void;
}

export interface IForwardingStatsData {
    mid: number; // Module Id
    esid: number; // Event Subscription Id
    n: string; // Event Name
    attrs: ISDKUserAttributes; // User Attributes
    sdk: string; // SDK Version
    dt: number; // Data Type
    et: number; // Event Type
    dbg: boolean; // Development Mode (for debugging in Live Stream)
    ct: number; // Current Timestamp
    eec: number; // Expanded Event Count
    dp: SDKDataPlan; // Data Plan
}

export default function APIClient(
    this: IAPIClient,
    mpInstance: IMParticleWebSDKInstance,
    kitBlocker: KitBlocker
) {
    this.uploader = null;
    const self = this;
    this.queueEventForBatchUpload = function(event: SDKEvent) {
        if (!this.uploader) {
            // https://go.mparticle.com/work/SQDSDKS-6317
            const millis: number = parseNumber(mpInstance._Helpers.getFeatureFlag(
                Constants.FeatureFlags.EventBatchingIntervalMillis
            ) as string);
            this.uploader = new BatchUploader(mpInstance, millis);
        }
        this.uploader.queueEvent(event);

        // https://go.mparticle.com/work/SQDSDKS-6038
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
                appendUserInfo(user, event);
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

        // https://go.mparticle.com/work/SQDSDKS-6038
        if (options.shouldUploadEvent) {
            this.queueEventForBatchUpload(event);
        }

        // https://go.mparticle.com/work/SQDSDKS-6935
        // While Event Name is 'usually' a string, there are some cases where it is a number
        // in that it could be a type of MessageType Enum
        if (event.EventName as unknown as number !== Types.MessageType.AppStateTransition) {
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

    this.initializeForwarderStatsUploader = (): AsyncUploader => {
        const {
            v1SecureServiceUrl: forwardingDomain,
        } = mpInstance._Store.SDKConfig;
        const { devToken } = mpInstance._Store;

        const uploadUrl: string = `https://${forwardingDomain}${devToken}/Forwarding`;

        const uploader: AsyncUploader = window.fetch
            ? new FetchUploader(uploadUrl)
            : new XHRUploader(uploadUrl);

        return uploader;
    };

    this.prepareForwardingStats = function(
        forwarder: MPForwarder,
        event:SDKEvent,
    ) : void {
        let forwardingStatsData: IForwardingStatsData;
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
            
            const {
                sendSingleForwardingStatsToServer,
                setForwarderStatsQueue,
            } = mpInstance._Forwarders;

            if (
                mpInstance._Helpers.getFeatureFlag(
                    Constants.FeatureFlags.ReportBatching
                )
            ) {
                queue.push(forwardingStatsData);
                setForwarderStatsQueue(queue);
            } else {
                sendSingleForwardingStatsToServer(forwardingStatsData);
            }
        }
    };

    this.sendLogToServer = function(logRequest: LogRequest) {
        const baseUrl = mpInstance._Helpers.createServiceUrl(
            mpInstance._Store.SDKConfig.v2SecureServiceUrl,
            mpInstance._Store.devToken
        );
        
        const uploadUrl = `${baseUrl}/v1/log`;
        const uploader = window.fetch
            ? new FetchUploader(uploadUrl)
            : new XHRUploader(uploadUrl);

        uploader.upload({
            method: 'POST',
            headers: {
                Accept: 'text/plain;charset=UTF-8',
                'Content-Type': 'text/plain;charset=UTF-8',
            },
            body: JSON.stringify(logRequest),
        });
    };
}
