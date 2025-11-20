import { Batch } from '@mparticle/event-models';
import Constants from './constants';
import { SDKEvent, SDKEventCustomFlags, SDKLoggerApi } from './sdkRuntimeModels';
import { convertEvents } from './sdkToEventsApiConverter';
import { MessageType, EventType } from './types';
import { getRampNumber, isEmpty } from './utils';
import { SessionStorageVault, LocalStorageVault } from './vault';
import {
    AsyncUploader,
    FetchUploader,
    XHRUploader,
    IFetchPayload,
} from './uploaders';
import { IMParticleUser } from './identity-user-interfaces';
import { IMParticleWebSDKInstance } from './mp-instance';
import { appendUserInfo } from './user-utils';
import { IntegrationAttributes } from './store';
/**
 * BatchUploader contains all the logic to store/retrieve events and batches
 * to/from persistence, and upload batches to mParticle.
 * It queues events as they come in, storing them in persistence, then at set
 * intervals turns them into batches and transfers between event and batch
 * persistence.
 * It then attempts to upload them to mParticle, purging batch persistence if
 * the upload is successful
 *
 * These uploads happen on an interval basis using window.fetch or XHR
 * requests, depending on what is available in the browser.
 *
 * Uploads can also be triggered on browser visibility/focus changes via an
 * event listener, which then uploads to mPartice via the browser's Beacon API.
 */

export class BatchUploader {
    // We upload JSON, but this content type is required to avoid a CORS preflight request
    static readonly CONTENT_TYPE: string = 'text/plain;charset=UTF-8';
    static readonly MINIMUM_INTERVAL_MILLIS: number = 500;
    uploadIntervalMillis: number;
    eventsQueuedForProcessing: SDKEvent[];
    batchesQueuedForProcessing: Batch[];
    mpInstance: IMParticleWebSDKInstance;
    uploadUrl: string;
    batchingEnabled: boolean;
    private eventVault: SessionStorageVault<SDKEvent[]>;
    private batchVault: LocalStorageVault<Batch[]>;
    private offlineStorageEnabled: boolean = false;
    private uploader: AsyncUploader;
    private lastASTEventTime: number = 0;
    private readonly AST_DEBOUNCE_MS: number = 1000; // 1 second debounce

    /**
     * Creates an instance of a BatchUploader
     * @param {IMParticleWebSDKInstance} mpInstance - the mParticle SDK instance
     * @param {number} uploadInterval - the desired upload interval in milliseconds
     */
    constructor(mpInstance: IMParticleWebSDKInstance, uploadInterval: number) {
        this.mpInstance = mpInstance;
        this.uploadIntervalMillis = uploadInterval;
        this.batchingEnabled =
            uploadInterval >= BatchUploader.MINIMUM_INTERVAL_MILLIS;
        if (this.uploadIntervalMillis < BatchUploader.MINIMUM_INTERVAL_MILLIS) {
            this.uploadIntervalMillis = BatchUploader.MINIMUM_INTERVAL_MILLIS;
        }

        // Events will be queued during `queueEvents` method
        this.eventsQueuedForProcessing = [];

        // Batch queue should start empty and will be populated during
        // `prepareAndUpload` method, either via Local Storage or after
        // new batches are created.
        this.batchesQueuedForProcessing = [];

        // Cache Offline Storage Availability boolean
        // so that we don't have to check it every time
        this.offlineStorageEnabled = this.isOfflineStorageAvailable();

        if (this.offlineStorageEnabled) {
            this.eventVault = new SessionStorageVault<SDKEvent[]>(
                `${mpInstance._Store.storageName}-events`,
                {
                    logger: mpInstance.Logger,
                }
            );

            this.batchVault = new LocalStorageVault<Batch[]>(
                `${mpInstance._Store.storageName}-batches`,
                {
                    logger: mpInstance.Logger,
                }
            );

            // Load Events from Session Storage in case we have any in storage
            this.eventsQueuedForProcessing.push(...this.eventVault.retrieve());
        }

        const { SDKConfig, devToken } = this.mpInstance._Store;
        const baseUrl = this.mpInstance._Helpers.createServiceUrl(
            SDKConfig.v3SecureServiceUrl,
            devToken
        );
        this.uploadUrl = `${baseUrl}/events`;

        this.uploader = window.fetch
            ? new FetchUploader(this.uploadUrl)
            : new XHRUploader(this.uploadUrl);

        this.triggerUploadInterval(true, false);
        this.addEventListeners();
    }

    private isOfflineStorageAvailable(): boolean {
        const {
            _Helpers: { getFeatureFlag },
            _Store: { deviceId },
        } = this.mpInstance;

        // https://go.mparticle.com/work/SQDSDKS-6317
        const offlineStorageFeatureFlagValue: string = getFeatureFlag(
            Constants.FeatureFlags.OfflineStorage
        ) as string;

        const offlineStoragePercentage: number = parseInt(
            offlineStorageFeatureFlagValue,
            10
        );

        const rampNumber = getRampNumber(deviceId);

        // TODO: Handle cases where Local Storage is unavailable
        //       Potentially shared between Vault and Persistence as well
        //       https://go.mparticle.com/work/SQDSDKS-5022
        return offlineStoragePercentage >= rampNumber;
    }

    // debounce AST just in case multiple events are fired in a short period of time due to browser differences
    private shouldDebounceAndUpdateLastASTTime(): boolean {
        const now = Date.now();
        if (now - this.lastASTEventTime < this.AST_DEBOUNCE_MS) {
            return true;
        }

        this.lastASTEventTime = now;
        return false;
    }

    // https://go.mparticle.com/work/SQDSDKS-7133
    private createBackgroundASTEvent(): SDKEvent {
        const now = Date.now();
        const { _Store, Identity, _timeOnSiteTimer, _Helpers  } = this.mpInstance;
        const { sessionId, deviceId, sessionStartDate, SDKConfig } = _Store;
        const { generateUniqueId, getFeatureFlag } = _Helpers;
        const { getCurrentUser } = Identity;

        const event = {
            AppName: SDKConfig.appName,
            AppVersion: SDKConfig.appVersion,
            Package: SDKConfig.package,
            EventDataType: MessageType.AppStateTransition,
            Timestamp: now,
            SessionId: sessionId,
            DeviceId: deviceId,
            IsFirstRun: false,
            SourceMessageId: generateUniqueId(),
            SDKVersion: Constants.sdkVersion,
            CustomFlags: {},
            EventAttributes: {},
            SessionStartDate: sessionStartDate?.getTime() || now,
            Debug: SDKConfig.isDevelopmentMode,
            ActiveTimeOnSite: _timeOnSiteTimer?.getTimeInForeground() || 0,
            IsBackgroundAST: true
        } as SDKEvent;


        let customFlags: SDKEventCustomFlags = {...event.CustomFlags};
        let integrationAttributes: IntegrationAttributes = _Store.integrationAttributes;
        const integrationSpecificIds = getFeatureFlag(Constants.FeatureFlags.CaptureIntegrationSpecificIds) as boolean;
        const integrationSpecificIdsV2 = getFeatureFlag(Constants.FeatureFlags.CaptureIntegrationSpecificIdsV2) as string || '';
        const isIntegrationCaptureEnabled = (integrationSpecificIdsV2 && integrationSpecificIdsV2 !== Constants.CaptureIntegrationSpecificIdsV2Modes.None) || integrationSpecificIds === true;

        // https://go.mparticle.com/work/SQDSDKS-5053
        if (isIntegrationCaptureEnabled) {

            // Attempt to recapture click IDs in case a third party integration
            // has added or updated  new click IDs since the last event was sent.
            this.mpInstance._IntegrationCapture.capture();
            const transformedClickIDs = this.mpInstance._IntegrationCapture.getClickIdsAsCustomFlags();
            customFlags = {...transformedClickIDs, ...customFlags};

            const transformedIntegrationAttributes = this.mpInstance._IntegrationCapture.getClickIdsAsIntegrationAttributes();
            integrationAttributes = {...transformedIntegrationAttributes, ...integrationAttributes};
        }

        event.CustomFlags = customFlags;
        event.IntegrationAttributes = integrationAttributes;

        appendUserInfo(getCurrentUser(), event);

        return event;
    }

    // Adds listeners to be used trigger Navigator.sendBeacon if the browser
    // loses focus for any reason, such as closing browser tab or minimizing window
    private addEventListeners() {
        const _this = this;

        const handleExit = () => {
            // Check for debounce before creating and queueing event
            const {
                _Helpers: { getFeatureFlag },
            } = this.mpInstance;
            const { AstBackgroundEvents } = Constants.FeatureFlags;

            if (getFeatureFlag(AstBackgroundEvents)) {
                if (_this.shouldDebounceAndUpdateLastASTTime()) {
                    return;
                }
                // Add application state transition event to queue
                const event = _this.createBackgroundASTEvent();
                _this.queueEvent(event);
            }
            // Then trigger the upload with beacon
            _this.prepareAndUpload(false, _this.isBeaconAvailable());
        };
        // visibility change is a document property, not window
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                handleExit();
            }
        });
        window.addEventListener('beforeunload', handleExit);
        window.addEventListener('pagehide', handleExit);
    }

    private isBeaconAvailable(): boolean {
        if (navigator.sendBeacon) {
            return true;
        }
        return false;
    }

    // Triggers a setTimeout for prepareAndUpload
    private triggerUploadInterval(
        triggerFuture: boolean = false,
        useBeacon: boolean = false
    ): void {
        setTimeout(() => {
            this.prepareAndUpload(triggerFuture, useBeacon);
        }, this.uploadIntervalMillis);
    }

    /**
     * This method will queue a single Event which will eventually be processed into a Batch
     * @param event event that should be queued
     */
    public queueEvent(event: SDKEvent): void {
        if (isEmpty(event)) {
            return;
        }

        const { Logger } = this.mpInstance;

        this.eventsQueuedForProcessing.push(event);
        if (this.offlineStorageEnabled && this.eventVault) {
            this.eventVault.store(this.eventsQueuedForProcessing);
        }

        Logger.verbose(`Queuing event: ${JSON.stringify(event)}`);
        Logger.verbose(`Queued event count: ${this.eventsQueuedForProcessing.length}`);

        if (this.shouldTriggerImmediateUpload(event.EventDataType)) {
            this.prepareAndUpload(false, false);
        }
    }

    // https://go.mparticle.com/work/SQDSDKS-3720
    private shouldTriggerImmediateUpload (eventDataType: number): boolean {
        const priorityEvents = [
            MessageType.Commerce,
            MessageType.UserIdentityChange,
        ] as const;

        return !this.batchingEnabled || priorityEvents.includes(eventDataType as typeof priorityEvents[number]);
    };

    /**
     * This implements crucial logic to:
     * - bucket pending events by MPID, and then by Session, and upload individual batches for each bucket.
     *
     * In the future this should enforce other requirements such as maximum batch size.
     *
     * @param sdkEvents current pending events
     * @param defaultUser the user to reference for events that are missing data
     */
    private static createNewBatches(
        sdkEvents: SDKEvent[],
        defaultUser: IMParticleUser,
        mpInstance: IMParticleWebSDKInstance
    ): Batch[] | null {
        if (!defaultUser || !sdkEvents || !sdkEvents.length) {
            return null;
        }

        //bucket by MPID, and then by session, ordered by timestamp
        const newUploads: Batch[] = [];

        const eventsByUser = new Map<string, SDKEvent[]>();
        for (const sdkEvent of sdkEvents) {
            //on initial startup, there may be events logged without an mpid.
            if (!sdkEvent.MPID) {
                const mpid = defaultUser.getMPID();
                sdkEvent.MPID = mpid;
            }
            let events = eventsByUser.get(sdkEvent.MPID);
            if (!events) {
                events = [];
            }
            events.push(sdkEvent);
            eventsByUser.set(sdkEvent.MPID, events);
        }
        for (const entry of Array.from(eventsByUser.entries())) {
            const mpid: string = entry[0];
            const userEvents: SDKEvent[] = entry[1];
            const eventsBySession = new Map<string, SDKEvent[]>();
            for (const sdkEvent of userEvents) {
                let events = eventsBySession.get(sdkEvent.SessionId);
                if (!events) {
                    events = [];
                }
                events.push(sdkEvent);
                eventsBySession.set(sdkEvent.SessionId, events);
            }
            for (const entry of Array.from(eventsBySession.entries())) {
                let uploadBatchObject = convertEvents(
                    mpid,
                    entry[1],
                    mpInstance
                );
                const onCreateBatchCallback =
                    mpInstance._Store.SDKConfig.onCreateBatch;

                if (onCreateBatchCallback) {
                    uploadBatchObject =
                        onCreateBatchCallback(uploadBatchObject);
                    if (uploadBatchObject) {
                        uploadBatchObject.modified = true;
                    } else {
                        mpInstance.Logger.warning(
                            'Skiping batch upload because no batch was returned from onCreateBatch callback'
                        );
                    }
                }

                if (uploadBatchObject) {
                    newUploads.push(uploadBatchObject);
                }
            }
        }
        return newUploads;
    }

    /**
     * This is the main loop function:
     *  - take all pending events and turn them into batches
     *  - attempt to upload each batch
     *
     * @param triggerFuture whether to trigger the loop again - for manual/forced uploads this should be false
     * @param useBeacon whether to use the beacon API - used when the page is being unloaded
     */
    public async prepareAndUpload(
        triggerFuture: boolean = false,
        useBeacon: boolean = false,
    ): Promise<void> {
        // Fetch current user so that events can be grouped by MPID
        const currentUser = this.mpInstance.Identity.getCurrentUser();

        const currentEvents: SDKEvent[] = this.eventsQueuedForProcessing;

        this.eventsQueuedForProcessing = [];
        if (this.offlineStorageEnabled && this.eventVault) {
            this.eventVault.store([]);
        }

        let newBatches: Batch[] = [];
        if (!isEmpty(currentEvents)) {
            newBatches = BatchUploader.createNewBatches(
                currentEvents,
                currentUser,
                this.mpInstance
            );
        }

        // Top Load any older Batches from Offline Storage so they go out first
        if (this.offlineStorageEnabled && this.batchVault) {
            this.batchesQueuedForProcessing.unshift(
                ...this.batchVault.retrieve()
            );

            // Remove batches from local storage before transmit to
            // prevent duplication
            this.batchVault.purge();
        }

        if (!isEmpty(newBatches)) {
            this.batchesQueuedForProcessing.push(...newBatches);
        }

        // Clear out pending batches to avoid any potential duplication
        const batchesToUpload = this.batchesQueuedForProcessing;
        this.batchesQueuedForProcessing = [];

        const batchesThatDidNotUpload = await this.uploadBatches(
            this.mpInstance.Logger,
            batchesToUpload,
            useBeacon
        );

        // Batches that do not successfully upload are added back to the process queue
        // in the order they were created so that we can attempt re-transmission in
        // the same sequence. This is to prevent any potential data corruption.
        if (!isEmpty(batchesThatDidNotUpload)) {
            // TODO: https://go.mparticle.com/work/SQDSDKS-5165
            this.batchesQueuedForProcessing.unshift(...batchesThatDidNotUpload);
        }

        // Update Offline Storage with current state of batch queue
        if (!useBeacon && this.offlineStorageEnabled && this.batchVault) {
            // Note: since beacon is "Fire and forget" it will empty `batchesThatDidNotUplod`
            // regardless of whether the batches were successfully uploaded or not. We should
            // therefore NOT overwrite Offline Storage when beacon returns, so that we can retry
            // uploading saved batches at a later time. Batches should only be removed from
            // Local Storage once we can confirm they are successfully uploaded.
            this.batchVault.store(this.batchesQueuedForProcessing);

            // Clear batch queue since everything should be in Offline Storage
            this.batchesQueuedForProcessing = [];
        }

        if (triggerFuture) {
            this.triggerUploadInterval(triggerFuture, false);
        }
    }

    // TODO: Refactor to use logger as a class method
    // https://go.mparticle.com/work/SQDSDKS-5167
    private async uploadBatches(
        logger: SDKLoggerApi,
        batches: Batch[],
        useBeacon: boolean
    ): Promise<Batch[] | null> {
        // Filter out any batches that don't have events
        const uploads = batches.filter((batch) => !isEmpty(batch.events));

        if (isEmpty(uploads)) {
            return null;
        }

        logger.verbose(`Uploading batches: ${JSON.stringify(uploads)}`);
        logger.verbose(`Batch count: ${uploads.length}`);

        for (let i = 0; i < uploads.length; i++) {
            const fetchPayload: IFetchPayload = {
                method: 'POST',
                headers: {
                    Accept: BatchUploader.CONTENT_TYPE,
                    'Content-Type': 'text/plain;charset=UTF-8',
                },
                body: JSON.stringify(uploads[i]),
            };

            // beacon is only used on onbeforeunload onpagehide events
            if (useBeacon && this.isBeaconAvailable()) {
                let blob = new Blob([fetchPayload.body], {
                    type: 'text/plain;charset=UTF-8',
                });

                navigator.sendBeacon(this.uploadUrl, blob);
            } else {
                try {
                    const response = await this.uploader.upload(fetchPayload);

                    if (response.status >= 200 && response.status < 300) {
                        logger.verbose(
                            `Upload success for request ID: ${uploads[i].source_request_id}`
                        );
                    } else if (
                        response.status >= 500 ||
                        response.status === 429
                    ) {
                        logger.error(
                            `HTTP error status ${response.status} received`
                        );
                        // Server error, add back current batches and try again later
                        return uploads.slice(i, uploads.length);
                    } else if (response.status >= 401) {
                        logger.error(
                            `HTTP error status ${response.status} while uploading - please verify your API key.`
                        );
                        //if we're getting a 401, assume we'll keep getting a 401 and clear the uploads.
                        return null;
                    } else {
                        // In case there is an HTTP error we did not anticipate.
                        console.error(
                            `HTTP error status ${response.status} while uploading events.`,
                            response
                        );

                        throw new Error(
                            `Uncaught HTTP Error ${response.status}.  Batch upload will be re-attempted.`
                        );
                    }
                } catch (e) {
                    logger.error(
                        `Error sending event to mParticle servers. ${e}`
                    );
                    return uploads.slice(i, uploads.length);
                }
            }
        }
        return null;
    }
}