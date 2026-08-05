var Initialization = {
    name: 'AdobeHeartbeat',
    moduleId: 124,
    initForwarder: function(
        settings,
        testMode,
        userAttributes,
        userIdentities,
        processEvent,
        eventQueue,
        common,
        initForwarderCallback
    ) {
        var self = this;
        if (!window.mParticle.isTestEnvironment || !window.ADB) {
            /* Load your Web SDK here using a variant of your snippet from your readme that your customers would generally put into their <head> tags
               Generally, our integrations create script tags and append them to the <head>. Please follow the following format as a guide:
            */
            var adobeHeartbeatSdk = document.createElement('script');
            adobeHeartbeatSdk.type = 'text/javascript';
            adobeHeartbeatSdk.async = true;
            adobeHeartbeatSdk.src =
                'https://static.mparticle.com/sdk/web/adobe/MediaSDK.min.js';
            (
                document.getElementsByTagName('head')[0] ||
                document.getElementsByTagName('body')[0]
            ).appendChild(adobeHeartbeatSdk);
            adobeHeartbeatSdk.onload = function() {
                if (ADB) {
                    self.initHeartbeat(
                        settings,
                        common,
                        ADB,
                        testMode,
                        initForwarderCallback
                    );
                    if (eventQueue.length > 0) {
                        // Process any events that may have been queued up while forwarder was being initialized.
                        for (var i = 0; i < eventQueue.length; i++) {
                            processEvent(eventQueue[i]);
                        }
                        // now that each queued event is processed, we empty the eventQueue
                        eventQueue = [];
                    }
                }
            };
        } else {
            // For testing, you should fill out this section in order to ensure any required initialization calls are made,
            // clientSDKObject.initialize(forwarderSettings.apiKey)
            self.initHeartbeat(
                settings,
                common,
                ADB,
                testMode,
                initForwarderCallback
            );
        }
    },
    initHeartbeat: function(
        settings,
        common,
        adobeSDK,
        testMode,
        initHeartbeatCallback
    ) {
        try {
            // Init App Measurement with Visitor
            var appMeasurement = new AppMeasurement(settings.reportSuiteIDs);
            var visitorOptions = {};
            if (settings.audienceManagerServer) {
                visitorOptions.audienceManagerServer =
                    settings.audienceManagerServer;
            }

            appMeasurement.visitor = Visitor.getInstance(
                settings.organizationID,
                visitorOptions
            );
            appMeasurement.trackingServer = settings.trackingServer;
            appMeasurement.account = settings.reportSuiteIDs;
            appMeasurement.pageName = document.title;
            appMeasurement.charSet = 'UTF­8';

            // Init Media Heartbeat

            var MediaHeartbeat = adobeSDK.va.MediaHeartbeat;
            var MediaHeartbeatConfig = adobeSDK.va.MediaHeartbeatConfig;
            var MediaHeartbeatDelegate = adobeSDK.va.MediaHeartbeatDelegate;
            var mediaConfig = new MediaHeartbeatConfig();
            common.MediaHeartbeat = MediaHeartbeat;

            mediaConfig.trackingServer = settings.mediaTrackingServer;
            mediaConfig.ssl = settings.useSSL === 'True';
            mediaConfig.playerName = 'mParticle Media SDK';

            var mediaDelegate = new MediaHeartbeatDelegate();

            mediaDelegate.getCurrentPlaybackTime = function() {
                return common.playheadPosition;
            };

            mediaDelegate.getQoSObject = function() {
                return MediaHeartbeat.createQoSObject(
                    common.bitRate,
                    common.startupTime,
                    common.fps,
                    common.droppedFrames
                );
            };

            var mediaHeartbeat = new MediaHeartbeat(
                mediaDelegate,
                mediaConfig,
                appMeasurement
            );
            common.mediaHeartbeat = mediaHeartbeat;
        } catch (e) {
            console.error(e);
        }

        initHeartbeatCallback();
    }
};

module.exports = Initialization;
