import { Batch } from '@mparticle/event-models';
import {
    SDKEvent,
    MParticleUser,
    MParticleWebSDK,
    SDKLoggerApi,
} from './sdkRuntimeModels';
import { convertEvents } from './sdkToEventsApiConverter';
import Types from './types';
import { isEmpty } from './utils';

/**
 * BatchUploader contains all the logic to upload batches to mParticle.
 * It queues events as they come in and at set intervals turns them into batches.
 * It then attempts to upload them to mParticle.
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
    mpInstance: MParticleWebSDK;
    uploadUrl: string;
    batchingEnabled: boolean;
    private uploader: AsyncUploader;

    /**
     * Creates an instance of a BatchUploader
     * @param {MParticleWebSDK} mpInstance - the mParticle SDK instance
     * @param {number} uploadInterval - the desired upload interval in milliseconds
     */
    constructor(mpInstance: MParticleWebSDK, uploadInterval: number) {
        this.mpInstance = mpInstance;
        this.uploadIntervalMillis = uploadInterval;
        this.batchingEnabled =
            uploadInterval >= BatchUploader.MINIMUM_INTERVAL_MILLIS;
        if (this.uploadIntervalMillis < BatchUploader.MINIMUM_INTERVAL_MILLIS) {
            this.uploadIntervalMillis = BatchUploader.MINIMUM_INTERVAL_MILLIS;
        }
        this.eventsQueuedForProcessing = [];
        this.batchesQueuedForProcessing = [];

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

    // Adds listeners to be used trigger Navigator.sendBeacon if the browser
    // loses focus for any reason, such as closing browser tab or minimizing window
    private addEventListeners() {
        const _this = this;

        // visibility change is a document property, not window
        document.addEventListener('visibilitychange', () => {
            _this.prepareAndUpload(false, _this.isBeaconAvailable());
        });
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
    queueEvent(event: SDKEvent): void {
        if (!isEmpty(event)) {
            this.eventsQueuedForProcessing.push(event);
            this.mpInstance.Logger.verbose(
                `Queuing event: ${JSON.stringify(event)}`
            );
            this.mpInstance.Logger.verbose(
                `Queued event count: ${this.eventsQueuedForProcessing.length}`
            );

            // TODO: Remove this check once the v2 code path is removed
            //       https://go.mparticle.com/work/SQDSDKS-3720
            if (
                !this.batchingEnabled ||
                Types.TriggerUploadType[event.EventDataType]
            ) {
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
    private static createNewBatches(
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
    private async prepareAndUpload(
        triggerFuture: boolean,
        useBeacon: boolean
    ): Promise<void> {
        const currentUser = this.mpInstance.Identity.getCurrentUser();

        const currentEvents = this.eventsQueuedForProcessing;
        this.eventsQueuedForProcessing = [];

        const newBatches = BatchUploader.createNewBatches(
            currentEvents,
            currentUser,
            this.mpInstance
        );
        if (!isEmpty(newBatches)) {
            this.batchesQueuedForProcessing.push(...newBatches);
        }

        const batchesToUpload = this.batchesQueuedForProcessing;
        const batchesThatDidNotUpload: Batch[] = [];
        this.batchesQueuedForProcessing = [];

        // Create an array of promises as we try to upload each batch indvidually
        const promises: Promise<Batch>[] = batchesToUpload.map((upload) => {
            return this.upload(this.mpInstance.Logger, upload, useBeacon);
        });

        // Iterate through fulfilled promises and store any remaining batches
        // for future re-transmission attempts
        if (!isEmpty(promises)) {
            Promise.all(promises)
                .then((batchResponses) => {
                    batchResponses.forEach((batch) =>
                        !isEmpty(batch)
                            ? batchesThatDidNotUpload.push(batch)
                            : null
                    );
                })
                .catch((error) => {
                    this.mpInstance.Logger.error(
                        `Error processing batches during upload attempt: ${error}`
                    );
                })
                .finally(() => {
                    // Any batches that did not upload should be put back into the queue for processing
                    if (!isEmpty(batchesThatDidNotUpload)) {
                        this.batchesQueuedForProcessing.unshift(
                            ...batchesThatDidNotUpload
                        );
                    }
                });
        }

        if (triggerFuture) {
            this.triggerUploadInterval(triggerFuture, false);
        }
    }

    private async upload(
        logger: SDKLoggerApi,
        batch: Batch,
        useBeacon: boolean
    ): Promise<Batch | null> {
        if (isEmpty(batch) || isEmpty(batch.events)) {
            return null;
        }

        logger.verbose(`Uploading batches: ${JSON.stringify(batch)}`);

        const fetchPayload: fetchPayload = {
            method: 'POST',
            headers: {
                Accept: BatchUploader.CONTENT_TYPE,
                'Content-Type': 'text/plain;charset=UTF-8',
            },
            body: JSON.stringify(batch),
        };

        // TODO: Make beacon its own function
        // beacon is only used on onbeforeunload onpagehide events
        if (useBeacon && this.isBeaconAvailable()) {
            let blob = new Blob([fetchPayload.body], {
                type: 'text/plain;charset=UTF-8',
            });
            navigator.sendBeacon(this.uploadUrl, blob);
        } else {
            try {
                const response = await this.uploader.upload(fetchPayload);

                // TODO: Should we make this a switch statement instead?
                if (response.status >= 200 && response.status < 300) {
                    logger.verbose(
                        `Upload success for request ID: ${batch.source_request_id}`
                    );

                    return null;
                } else if (response.status >= 500 || response.status === 429) {
                    logger.error(
                        `HTTP error status ${response.status} received`
                    );

                    // Server error, return current batch and try again later
                    return batch;
                } else if (response.status >= 401) {
                    logger.error(
                        `HTTP error status ${response.status} while uploading - please verify your API key.`
                    );
                    // if we're getting a 401, assume we'll keep getting a 401
                    // so return the upload so it can be stored for later use
                    return batch;
                }
            } catch (error) {
                logger.error(
                    `Error sending event to mParticle servers. ${error}`
                );
                return batch;
            }
        }
        return null;
    }
}

abstract class AsyncUploader {
    url: string;
    public abstract upload(fetchPayload: fetchPayload): Promise<XHRResponse>;

    constructor(url: string) {
        this.url = url;
    }
}

class FetchUploader extends AsyncUploader {
    public async upload(fetchPayload: fetchPayload): Promise<XHRResponse> {
        const response: XHRResponse = await fetch(this.url, fetchPayload);
        return response;
    }
}

class XHRUploader extends AsyncUploader {
    public async upload(fetchPayload: fetchPayload): Promise<XHRResponse> {
        const response: XHRResponse = await this.makeRequest(
            this.url,
            fetchPayload.body
        );
        return response;
    }

    private async makeRequest(
        url: string,
        data: string
    ): Promise<XMLHttpRequest> {
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
            xhr.onreadystatechange = () => {
                if (xhr.readyState !== 4) return;

                // Process the response
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr);
                } else {
                    reject(xhr);
                }
            };

            xhr.open('post', url);
            xhr.send(data);
        });
    }
}

interface XHRResponse {
    status: number;
    statusText?: string;
}

interface fetchPayload {
    method: string;
    headers: {
        Accept: string;
        'Content-Type': string;
    };
    body: string;
}
