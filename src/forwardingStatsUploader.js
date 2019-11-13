export default function forwardingStatsUploader(mpInstance) {
    this.startForwardingStatsTimer = function() {
        mParticle._forwardingStatsTimer = setInterval(function() {
            prepareAndSendForwardingStatsBatch();
        }, mpInstance._Store.SDKConfig.forwarderStatsTimeout);
    };

    function prepareAndSendForwardingStatsBatch() {
        var forwarderQueue = mpInstance._Forwarders.getForwarderStatsQueue(),
            uploadsTable =
                mpInstance._Persistence.forwardingStatsBatches.uploadsTable,
            now = Date.now();

        if (forwarderQueue.length) {
            uploadsTable[now] = { uploading: false, data: forwarderQueue };
            mpInstance._Forwarders.setForwarderStatsQueue([]);
        }

        for (var date in uploadsTable) {
            (function(date) {
                if (uploadsTable.hasOwnProperty(date)) {
                    if (uploadsTable[date].uploading === false) {
                        var xhrCallback = function() {
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

                        var xhr = mpInstance._Helpers.createXHR(xhrCallback);
                        var forwardingStatsData = uploadsTable[date].data;
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
