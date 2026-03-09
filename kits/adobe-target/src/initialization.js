var initialization = {
    name: 'AdobeTarget',
    initForwarder: function(
        forwarderSettings,
        testMode,
        userAttributes,
        userIdentities,
        processEvent,
        eventQueue,
        isInitialized
    ) {
        if (!testMode) {
            // Adobe Target's at.js file is hosted by the customer, loaded before mParticle.js, and has initialization code inside of at.js
            var adobeTargetPresent = window.adobe && window.adobe.target;
            if (adobeTargetPresent) {
                isInitialized = true;
            }
        } else {
            // For testing, you should fill out this section in order to ensure any required initialization calls are made,
            // clientSDKObject.initialize(forwarderSettings.apiKey)
        }
    },
};

module.exports = initialization;
