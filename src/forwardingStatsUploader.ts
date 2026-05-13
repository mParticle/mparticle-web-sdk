import { IMParticleWebSDKInstance } from './mp-instance';
import { Dictionary } from './utils';

export interface IForwardingStatsUploader {
    startForwardingStatsTimer(): void;
}

export default function forwardingStatsUploader(
    this: IForwardingStatsUploader,
    mpInstance: IMParticleWebSDKInstance
): void {
    this.startForwardingStatsTimer = function(): void {
        (window.mParticle as Dictionary)._forwardingStatsTimer = setInterval(function() {
            prepareAndSendForwardingStatsBatch();
        }, (mpInstance._Store.SDKConfig as Dictionary).forwarderStatsTimeout);
    };

    function prepareAndSendForwardingStatsBatch(): void {
        const forwarderQueue = mpInstance._Forwarders.getForwarderStatsQueue();
        const uploadsTable =
            mpInstance._Persistence.forwardingStatsBatches.uploadsTable;
        const now = Date.now();

        if (forwarderQueue.length) {
            uploadsTable[now] = { uploading: false, data: forwarderQueue };
            mpInstance._Forwarders.setForwarderStatsQueue([]);
        }

        for (const date in uploadsTable) {
            (function(date: string) {
                if (uploadsTable.hasOwnProperty(date)) {
                    if (uploadsTable[date].uploading === false) {
                        const xhrCallback = function(): void {
                            if (xhr.readyState === 4) {
                                if (xhr.status === 200 || xhr.status === 202) {
                                    mpInstance.Logger.verbose(
                                        'Successfully sent  ' +
                                            xhr.statusText +
                                            ' from server'
                                    );
                                    delete uploadsTable[date];
                                } else if (xhr.status.toString()[0] === '4') {
                                    if (xhr.status !== 429) {
                                        delete uploadsTable[date];
                                    }
                                } else {
                                    uploadsTable[date].uploading = false;
                                }
                            }
                        };

                        const xhr = mpInstance._Helpers.createXHR(xhrCallback);
                        const forwardingStatsData = uploadsTable[date].data;
                        uploadsTable[date].uploading = true;
                        mpInstance._APIClient.sendBatchForwardingStatsToServer(
                            forwardingStatsData,
                            xhr
                        );
                    }
                }
            })(date);
        }
    }
}
