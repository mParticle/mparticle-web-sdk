import { Batch } from '@mparticle/event-models';
import {
    SDKEvent,
    MParticleUser,
    MParticleWebSDK,
    SDKLoggerApi,
} from './sdkRuntimeModels';
import { convertEvents } from './sdkToEventsApiConverter';

export class BatchUploader {
    //we upload JSON, but this content type is required to avoid a CORS preflight request
    static readonly CONTENT_TYPE: string = 'text/plain;charset=UTF-8';
    static readonly MINIMUM_INTERVAL_MILLIS: number = 500;
    uploadIntervalMillis: number;
    pendingEvents: SDKEvent[];
    pendingUploads: Batch[];
    mpInstance: MParticleWebSDK;
    uploadUrl: string;
    batchingEnabled: boolean;

    constructor(mpInstance: MParticleWebSDK, uploadInterval: number) {
        this.mpInstance = mpInstance;
        this.uploadIntervalMillis = uploadInterval;
        this.batchingEnabled =
            uploadInterval >= BatchUploader.MINIMUM_INTERVAL_MILLIS;
        if (this.uploadIntervalMillis < BatchUploader.MINIMUM_INTERVAL_MILLIS) {
            this.uploadIntervalMillis = BatchUploader.MINIMUM_INTERVAL_MILLIS;
        }
        this.pendingEvents = [];
        this.pendingUploads = [];

        const { SDKConfig, devToken } = this.mpInstance._Store;
        const baseUrl = this.mpInstance._Helpers.createServiceUrl(
            SDKConfig.v3SecureServiceUrl,
            devToken
        );
        this.uploadUrl = `${baseUrl}/events`;

        setTimeout(() => {
            this.prepareAndUpload(true, false);
        }, this.uploadIntervalMillis);

        this.addEventListeners();
    }

    private addEventListeners() {
        const _this = this;
        window.addEventListener('beforeunload', () => {
            _this.prepareAndUpload(false, _this.isBeaconAvailable());
        });
        window.addEventListener('pagehide', () => {
            _this.prepareAndUpload(false, _this.isBeaconAvailable());
        });
    }

    private isBeaconAvailable(): boolean {
        if (navigator.sendBeacon) {
            return true;
        }
        return false;
    }

    queueEvent(event: SDKEvent) {
        if (event) {
            //add this for cleaner processing later
            event.IsFirstRun = this.mpInstance._Store.isFirstRun;

            this.pendingEvents.push(event);
            this.mpInstance.Logger.verbose(
                `Queuing event: ${JSON.stringify(event)}`
            );
            this.mpInstance.Logger.verbose(
                `Queued event count: ${this.pendingEvents.length}`
            );
            if (!this.batchingEnabled) {
                this.prepareAndUpload(false, false);
            }
        }
    }

    /**
     * This implements crucial logic to:
     * - bucket pending events by MPID, and then by Session, and upload individual batches for each bucket.
     *
     * In the future this should enforce other requirements such as maximum batch size.
     *
     * @param sdkEvents current pending events
     * @param defaultUser the user to reference for events that are missing data
     */
    private static createNewUploads(
        sdkEvents: SDKEvent[],
        defaultUser: MParticleUser,
        mpInstance: MParticleWebSDK
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
                const upload = convertEvents(mpid, entry[1], mpInstance);
                if (upload) {
                    newUploads.push(upload);
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
    private async prepareAndUpload(triggerFuture: boolean, useBeacon: boolean) {
        const currentUser = this.mpInstance.Identity.getCurrentUser();

        const currentEvents = this.pendingEvents;
        this.pendingEvents = [];
        const newUploads = BatchUploader.createNewUploads(
            currentEvents,
            currentUser,
            this.mpInstance
        );
        if (newUploads && newUploads.length) {
            this.pendingUploads.push(...newUploads);
        }

        const currentUploads = this.pendingUploads;
        this.pendingUploads = [];
        const remainingUploads = await this.upload(
            this.mpInstance.Logger,
            currentUploads,
            useBeacon
        );
        if (remainingUploads && remainingUploads.length) {
            this.pendingUploads.unshift(...remainingUploads);
        }

        if (triggerFuture) {
            setTimeout(() => {
                this.prepareAndUpload(true, false);
            }, this.uploadIntervalMillis);
        }
    }

    private async upload(
        logger: SDKLoggerApi,
        uploads: Batch[],
        useBeacon: boolean
    ): Promise<Batch[]> {
        if (!uploads || uploads.length < 1) {
            return null;
        }
        logger.verbose(`Uploading batches: ${JSON.stringify(uploads)}`);
        logger.verbose(`Batch count: ${uploads.length}`);

        for (let i = 0; i < uploads.length; i++) {
            const settings = {
                method: 'POST',
                headers: {
                    Accept: BatchUploader.CONTENT_TYPE,
                    'Content-Type': 'text/plain;charset=UTF-8',
                },
                body: JSON.stringify(uploads[i]),
            };
            try {
                if (useBeacon) {
                    const blob = new Blob([settings.body], {
                        type: 'text/plain;charset=UTF-8',
                    });
                    navigator.sendBeacon(this.uploadUrl, blob);
                } else {
                    logger.verbose(
                        `Uploading request ID: ${uploads[i].source_request_id}`
                    );
                    const response = await fetch(this.uploadUrl, settings);
                    if (response.ok) {
                        logger.verbose(
                            `Upload success for request ID: ${uploads[i].source_request_id}`
                        );
                    } else if (
                        response.status >= 500 ||
                        response.status === 429
                    ) {
                        //server error, add back current events and try again later
                        return uploads.slice(i, uploads.length);
                    } else if (response.status >= 401) {
                        logger.error(
                            `HTTP error status ${response.status} while uploading - please verify your API key.`
                        );
                        //if we're getting a 401, assume we'll keep getting a 401 and clear the uploads.
                        return null;
                    }
                }
            } catch (e) {
                logger.error(`Exception while uploading: ${e}`);
                return uploads.slice(i, uploads.length);
            }
        }
        return null;
    }
}
