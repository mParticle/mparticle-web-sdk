export default function ConfigAPIClient() {
    this.getSDKConfiguration = function(
        apiKey,
        config,
        completeSDKInitialization,
        mpInstance
    ) {
        var url;
        try {
            var xhrCallback = function() {
                if (xhr.readyState === 4) {
                    // when a 200 returns, merge current config with what comes back from config, prioritizing user inputted config
                    if (xhr.status === 200) {
                        config = mpInstance._Helpers.extend(
                            {},
                            config,
                            JSON.parse(xhr.responseText)
                        );
                        completeSDKInitialization(apiKey, config, mpInstance);
                        mpInstance.Logger.verbose(
                            'Successfully received configuration from server'
                        );
                    } else {
                        // if for some reason a 200 doesn't return, then we initialize with the just the passed through config
                        completeSDKInitialization(apiKey, config, mpInstance);
                        mpInstance.Logger.verbose(
                            'Issue with receiving configuration from server, received HTTP Code of ' +
                                xhr.status
                        );
                    }
                }
            };

            var xhr = mpInstance._Helpers.createXHR(xhrCallback);
            url =
                'https://' +
                mpInstance._Store.SDKConfig.configUrl +
                apiKey +
                '/config?env=';
            if (config.isDevelopmentMode) {
                url = url + '1';
            } else {
                url = url + '0';
            }

            var dataPlan = config.dataPlan;
            if (dataPlan) {
                if (dataPlan.planId) {
                    url = url + '&plan_id=' + dataPlan.planId || '';
                }
                if (dataPlan.planVersion) {
                    url = url + '&plan_version=' + dataPlan.planVersion || '';
                }
            }

            if (xhr) {
                xhr.open('get', url);
                xhr.send(null);
            }
        } catch (e) {
            completeSDKInitialization(apiKey, config, mpInstance);
            mpInstance.Logger.error(
                'Error getting forwarder configuration from mParticle servers.'
            );
        }
    };
}
