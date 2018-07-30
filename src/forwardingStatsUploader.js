var ApiClient = require('./apiClient'),
    Helpers = require('./helpers'),
    Forwarders = require('./forwarders'),
    MP = require('./mp'),
    Persistence = require('./persistence');

function startForwardingStatsTimer() {
    mParticle._forwardingStatsTimer = setInterval(function() {
        prepareAndSendForwardingStatsBatch();
    }, MP.Config.ForwarderStatsTimeout);
}

function prepareAndSendForwardingStatsBatch() {
    var forwarderQueue = Forwarders.getForwarderStatsQueue(),
        uploadsTable = Persistence.forwardingStatsBatches.uploadsTable,
        now = Date.now();

    if (forwarderQueue.length) {
        uploadsTable[now] = {uploading: false, data: forwarderQueue};
        Forwarders.setForwarderStatsQueue([]);
    }

    for (var date in uploadsTable) {
        (function(date) {
            if (uploadsTable.hasOwnProperty(date)) {
                if (uploadsTable[date].uploading === false) {
                    var xhrCallback = function() {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200 || xhr.status === 202) {
                                Helpers.logDebug('Successfully sent  ' + xhr.statusText + ' from server');
                                delete uploadsTable[date];
                            } else if (xhr.status.toString()[0] === '4') {
                                if (xhr.status !== 429) {
                                    delete uploadsTable[date];
                                }
                            }
                            else {
                                uploadsTable[date].uploading = false;
                            }
                        }
                    };

                    var xhr = Helpers.createXHR(xhrCallback);
                    var forwardingStatsData = uploadsTable[date].data;
                    uploadsTable[date].uploading = true;
                    ApiClient.sendBatchForwardingStatsToServer(forwardingStatsData, xhr);
                }
            }
        })(date);
    }
}

module.exports = {
    startForwardingStatsTimer: startForwardingStatsTimer
};
