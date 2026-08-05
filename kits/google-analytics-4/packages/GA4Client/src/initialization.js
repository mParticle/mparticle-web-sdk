var initialization = {
    // This name matches the mParticle database. This should not be changed unless the database name is being changed
    // Changing this will also break the API for the cleansing data callback that a customer uses.
    name: 'GoogleAnalytics4',
    moduleId: 160,
    /*  ****** Fill out initForwarder to load your SDK ******
    Note that not all arguments may apply to your SDK initialization.
    These are passed from mParticle, but leave them even if they are not being used.
    forwarderSettings contain settings that your SDK requires in order to initialize
    userAttributes example: {gender: 'male', age: 25}
    userIdentities example: { 1: 'customerId', 2: 'facebookId', 7: 'emailid@email.com' }
    additional identityTypes can be found at https://github.com/mParticle/mparticle-sdk-javascript/blob/master-v2/src/types.js#L88-L101
*/
    initForwarder: function (
        forwarderSettings,
        testMode,
        userAttributes,
        userIdentities,
        processEvent,
        eventQueue,
        isInitialized,
        common
    ) {
        mParticle._setIntegrationDelay(this.moduleId, true);

        // The API to allow a customer to provide the cleansing callback
        // relies on window.GoogleAnalytics4Kit to exist. When MP is initialized
        // via the snippet, the kit code adds it to the window automatically.
        // However, when initialized via npm, it does not exist, and so we have
        // to set it manually here.
        window.GoogleAnalytics4Kit = window.GoogleAnalytics4Kit || {};

        common.forwarderSettings = forwarderSettings;
        common.forwarderSettings.enableDataCleansing =
            common.forwarderSettings.enableDataCleansing === 'True';
        var measurementId = forwarderSettings.measurementId;
        var userIdType = forwarderSettings.externalUserIdentityType;
        var hashUserId = forwarderSettings.hashUserId;

        var configSettings = {
            send_page_view: forwarderSettings.enablePageView === 'True',
        };

        if (forwarderSettings.consentMappingSDK) {
            common.consentMappings = parseSettingsString(
                forwarderSettings.consentMappingSDK
            );
        } else {
            // Ensures consent mappings is an empty array
            // for future use
            common.consentMappings = [];
            common.consentPayloadDefaults = {};
            common.consentPayloadAsString = '';
        }

        window.dataLayer = window.dataLayer || [];

        window.gtag = function () {
            window.dataLayer.push(arguments);
        };
        gtag('js', new Date());

        // Check to see if mParticle SDK is V2 because V1 does not have the
        // Identity API
        if (window.mParticle.getVersion().split('.')[0] === '2') {
            var userId = common.getUserId(
                mParticle.Identity.getCurrentUser(),
                userIdType,
                hashUserId
            );
            if (userId) {
                configSettings.user_id = userId;
            }
        }
        gtag('config', measurementId, configSettings);

        gtag('get', measurementId, 'client_id', function (clientId) {
            setClientId(clientId, initialization.moduleId);
        });

        if (!testMode) {
            var clientScript = document.createElement('script');
            clientScript.type = 'text/javascript';
            clientScript.async = true;
            clientScript.src =
                'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
            (
                document.getElementsByTagName('head')[0] ||
                document.getElementsByTagName('body')[0]
            ).appendChild(clientScript);

            clientScript.onload = function () {
                isInitialized = true;

                if (window.dataLayer && gtag && eventQueue.length > 0) {
                    for (var i = 0; i < eventQueue.length; i++) {
                        processEvent(eventQueue[i]);
                    }
                    eventQueue = [];
                }
            };
        } else {
            isInitialized = true;
        }

        common.consentPayloadDefaults =
            common.consentHandler.getConsentSettings();
        var defaultConsentPayload = common.cloneObject(
            common.consentPayloadDefaults
        );
        var updatedConsentState = common.consentHandler.getUserConsentState();
        var updatedDefaultConsentPayload =
            common.consentHandler.generateConsentStatePayloadFromMappings(
                updatedConsentState,
                common.consentMappings
            );

        // If a default consent payload exists (as selected in the mParticle UI), set it as the default
        if (!common.isEmpty(defaultConsentPayload)) {
            common.sendDefaultConsentPayloadToGoogle(defaultConsentPayload);
        // If a default consent payload does not exist, but the user currently has updated their consent,
        // send that as the default because a default must be sent
        } else if (!common.isEmpty(updatedDefaultConsentPayload)) {
            common.sendDefaultConsentPayloadToGoogle(
                updatedDefaultConsentPayload
            );
        }

        common.maybeSendConsentUpdateToGoogle(updatedConsentState);

        return isInitialized;
    },
};

function setClientId(clientId, moduleId) {
    var GA4CLIENTID = 'client_id';
    var ga4IntegrationAttributes = {};
    ga4IntegrationAttributes[GA4CLIENTID] = clientId;
    window.mParticle.setIntegrationAttribute(
        moduleId,
        ga4IntegrationAttributes
    );
    window.mParticle._setIntegrationDelay(moduleId, false);
}

function parseSettingsString(settingsString) {
    return JSON.parse(settingsString.replace(/&quot;/g, '"'));
}

module.exports = initialization;
