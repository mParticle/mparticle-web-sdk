import { Batch } from '@mparticle/event-models';
import { SDKEvent, MParticleWebSDK } from './sdkRuntimeModels';
export declare class BatchUploader {
    static readonly CONTENT_TYPE: string;
    static readonly MINIMUM_INTERVAL_MILLIS: number;
    uploadIntervalMillis: number;
    pendingEvents: SDKEvent[];
    pendingUploads: Batch[];
    mpInstance: MParticleWebSDK;
    uploadUrl: string;
    batchingEnabled: boolean;
    constructor(mpInstance: MParticleWebSDK, uploadInterval: number);
    private addEventListeners;
    private isBeaconAvailable;
    queueEvent(event: SDKEvent): void;
    /**
     * This implements crucial logic to:
     * - bucket pending events by MPID, and then by Session, and upload individual batches for each bucket.
     *
     * In the future this should enforce other requirements such as maximum batch size.
     *
     * @param sdkEvents current pending events
     * @param defaultUser the user to reference for events that are missing data
     */
    private static createNewUploads;
    /**
     * This is the main loop function:
     *  - take all pending events and turn them into batches
     *  - attempt to upload each batch
     *
     * @param triggerFuture whether to trigger the loop again - for manual/forced uploads this should be false
     * @param useBeacon whether to use the beacon API - used when the page is being unloaded
     */
    private prepareAndUpload;
    private upload;
}
