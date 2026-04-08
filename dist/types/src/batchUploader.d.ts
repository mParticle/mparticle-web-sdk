import { Batch } from '@mparticle/event-models';
import { SDKEvent } from './sdkRuntimeModels';
import { IMParticleWebSDKInstance } from './mp-instance';
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
export declare class BatchUploader {
    static readonly CONTENT_TYPE: string;
    static readonly MINIMUM_INTERVAL_MILLIS: number;
    uploadIntervalMillis: number;
    eventsQueuedForProcessing: SDKEvent[];
    batchesQueuedForProcessing: Batch[];
    mpInstance: IMParticleWebSDKInstance;
    uploadUrl: string;
    batchingEnabled: boolean;
    private eventVault;
    private batchVault;
    private offlineStorageEnabled;
    private uploader;
    private lastASTEventTime;
    private readonly AST_DEBOUNCE_MS;
    /**
     * Creates an instance of a BatchUploader
     * @param {IMParticleWebSDKInstance} mpInstance - the mParticle SDK instance
     * @param {number} uploadInterval - the desired upload interval in milliseconds
     */
    constructor(mpInstance: IMParticleWebSDKInstance, uploadInterval: number);
    private isOfflineStorageAvailable;
    private shouldDebounceAndUpdateLastASTTime;
    private createBackgroundASTEvent;
    private addEventListeners;
    private isBeaconAvailable;
    private triggerUploadInterval;
    /**
     * This method will queue a single Event which will eventually be processed into a Batch
     * @param event event that should be queued
     */
    queueEvent(event: SDKEvent): void;
    private shouldTriggerImmediateUpload;
    /**
     * This implements crucial logic to:
     * - bucket pending events by MPID, and then by Session, and upload individual batches for each bucket.
     *
     * In the future this should enforce other requirements such as maximum batch size.
     *
     * @param sdkEvents current pending events
     * @param defaultUser the user to reference for events that are missing data
     */
    private static createNewBatches;
    /**
     * This is the main loop function:
     *  - take all pending events and turn them into batches
     *  - attempt to upload each batch
     *
     * @param triggerFuture whether to trigger the loop again - for manual/forced uploads this should be false
     * @param useBeacon whether to use the beacon API - used when the page is being unloaded
     */
    prepareAndUpload(triggerFuture?: boolean, useBeacon?: boolean): Promise<void>;
    private uploadBatches;
}
