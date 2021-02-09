import { Batch } from '@mparticle/event-models';
import {
    SDKEvent,
    MParticleUser,
    MParticleWebSDK,
    SDKLoggerApi,
} from './sdkRuntimeModels';
import { convertEvents } from './sdkToEventsApiConverter';
import Types from './types';

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

    queueEvent(event: SDKEvent) {
        if (event) {
            this.pendingEvents.push(event);
            this.mpInstance.Logger.verbose(
                `Queuing event: ${JSON.stringify(event)}`
            );
            this.mpInstance.Logger.verbose(
                `Queued event count: ${this.pendingEvents.length}`
            );

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
        const remainingUploads: Batch[] = await this.upload(
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
        let uploader;
        if (!uploads || uploads.length < 1) {
            return null;
        }
        logger.verbose(`Uploading batches: ${JSON.stringify(uploads)}`);
        logger.verbose(`Batch count: ${uploads.length}`);

        for (let i = 0; i < uploads.length; i++) {
            const fetchPayload: fetchPayload = {
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
                if (!uploader) {
                    if (window.fetch) {
                        uploader = new FetchUploader(this.uploadUrl, logger);
                    } else {
                        uploader = new XHRUploader(this.uploadUrl, logger);
                    }
                }
                try {
                    const response = await uploader.upload(
                        fetchPayload,
                        uploads,
                        i
                    );

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
                        //server error, add back current events and try again later
                        return uploads.slice(i, uploads.length);
                    } else if (response.status >= 401) {
                        logger.error(
                            `HTTP error status ${response.status} while uploading - please verify your API key.`
                        );
                        //if we're getting a 401, assume we'll keep getting a 401 and clear the uploads.
                        return null;
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

abstract class AsyncUploader {
    url: string;
    logger: SDKLoggerApi;

    constructor(url: string, logger: SDKLoggerApi) {
        this.url = url;
        this.logger = logger;
    }
}

class FetchUploader extends AsyncUploader {
    private async upload(
        fetchPayload: fetchPayload,
        uploads: Batch[],
        i: number
    ) {
        const response: XHRResponse = await fetch(this.url, fetchPayload);
        return response;
    }
}

class XHRUploader extends AsyncUploader {
    private async upload(
        fetchPayload: fetchPayload,
        uploads: Batch[],
        i: number
    ) {
        const response: XHRResponse = await this.makeRequest(
            this.url,
            this.logger,
            fetchPayload.body
        );
        return response;
    }

    private async makeRequest(
        url: string,
        logger: SDKLoggerApi,
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
