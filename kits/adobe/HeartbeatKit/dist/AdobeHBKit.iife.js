console.info('[mParticle QA kit path smoke] Loaded kits/adobe/HeartbeatKit/dist/AdobeHBKit.iife.js from monorepo GitHub path');
var mpAdobeHBKit = (function (exports) {
    function Common() {
        this.playheadPosition = 0;
        this.startupTime = 0;
        this.droppedFrames = 0;
        this.bitRate = 0;
        this.fps = 0;
    }

    var common = Common;

    var MediaEventType = {
        Play: 23,
        Pause: 24,
        ContentEnd: 25,
        SessionStart: 30,
        SessionEnd: 31,
        SeekStart: 32,
        SeekEnd: 33,
        BufferStart: 34,
        BufferEnd: 35,
        UpdatePlayheadPosition: 36,
        AdClick: 37,
        AdBreakStart: 38,
        AdBreakEnd: 39,
        AdStart: 40,
        AdEnd: 41,
        AdSkip: 42,
        SegmentStart: 43,
        SegmentEnd: 44,
        SegmentSkip: 45,
        UpdateQoS: 46,
    };

    var ContentType = {
        Audio: 'Audio',
        Video: 'Video',
    };

    var StreamType = {
        LiveStream: 'LiveStream',
        OnDemand: 'OnDemand',
        Linear: 'Linear',
        Podcast: 'Podcast',
        Audiobook: 'Audiobook',
    };

    function EventHandler(common) {
        this.common = common || {};
    }
    EventHandler.prototype.logEvent = function(event) {
        var customAttributes = {};
        if (event && event.EventAttributes) {
            customAttributes = event.EventAttributes;
        }

        if (event && event.PlayheadPosition) {
            this.common.playheadPosition = event.PlayheadPosition / 1000;
        }

        switch (event.EventCategory) {
            case MediaEventType.AdBreakStart:
                var adBreakObject = this.common.MediaHeartbeat.createAdBreakObject(
                    event.AdBreak.title,
                    event.AdBreak.placement || 0, // TODO: Ad Break Object doesn't support placement yet
                    this.common.playheadPosition
                );

                this.common.mediaHeartbeat.trackEvent(
                    this.common.MediaHeartbeat.Event.AdBreakStart,
                    adBreakObject,
                    customAttributes
                );
                break;
            case MediaEventType.AdBreakEnd:
                this.common.mediaHeartbeat.trackEvent(
                    this.common.MediaHeartbeat.Event.AdBreakComplete,
                    {},
                    customAttributes
                );
                break;
            case MediaEventType.AdStart:
                var adObject = this.common.MediaHeartbeat.createAdObject(
                    event.AdContent.title,
                    event.AdContent.id,
                    event.AdContent.position,
                    event.AdContent.duration / 1000
                );

                this.common.mediaHeartbeat.trackEvent(
                    this.common.MediaHeartbeat.Event.AdStart,
                    adObject,
                    customAttributes
                );
                break;
            case MediaEventType.AdEnd:
                this.common.mediaHeartbeat.trackEvent(
                    this.common.MediaHeartbeat.Event.AdComplete,
                    {},
                    customAttributes
                );
                break;
            case MediaEventType.AdSkip:
                this.common.mediaHeartbeat.trackEvent(
                    this.common.MediaHeartbeat.Event.AdSkip,
                    {},
                    customAttributes
                );
                break;
            case MediaEventType.AdClick:
                // This is not supported in Adobe Heartbeat
                console.warn('Ad Click is not a supported Adobe Heartbeat Event');
                break;
            case MediaEventType.BufferStart:
                this.common.mediaHeartbeat.trackEvent(
                    this.common.MediaHeartbeat.Event.BufferStart,
                    {},
                    customAttributes
                );
                break;
            case MediaEventType.BufferEnd:
                this.common.mediaHeartbeat.trackEvent(
                    this.common.MediaHeartbeat.Event.BufferComplete,
                    {},
                    customAttributes
                );
                break;
            case MediaEventType.ContentEnd:
                this.common.mediaHeartbeat.trackComplete();
                break;
            case MediaEventType.SessionStart:
                var streamType = getStreamType(
                    event.StreamType,
                    event.ContentType,
                    this.common.MediaHeartbeat.StreamType
                );

                var adobeMediaObject = this.common.MediaHeartbeat.createMediaObject(
                    event.ContentTitle,
                    event.ContentId,
                    event.Duration / 1000,
                    streamType,
                    event.ContentType
                );

                var combinedAttributes = getAdobeMetadataKeys(
                    customAttributes,
                    this.common.MediaHeartbeat
                );

                this.common.mediaHeartbeat.trackSessionStart(
                    adobeMediaObject,
                    combinedAttributes
                );
                break;

            case MediaEventType.SessionEnd:
                this.common.mediaHeartbeat.trackSessionEnd();
                break;
            case MediaEventType.Play:
                this.common.mediaHeartbeat.trackPlay();
                break;
            case MediaEventType.Pause:
                this.common.mediaHeartbeat.trackPause();
                break;
            case MediaEventType.UpdatePlayheadPosition:
                // This is commented out because we're updating playhead position
                // for all events and Adobe does not have a relevant playhead
                // update position function
                break;
            case MediaEventType.SeekStart:
                this.common.mediaHeartbeat.trackEvent(
                    this.common.MediaHeartbeat.Event.SeekStart,
                    {},
                    customAttributes
                );
                break;
            case MediaEventType.SeekEnd:
                this.common.mediaHeartbeat.trackEvent(
                    this.common.MediaHeartbeat.Event.SeekComplete,
                    {},
                    customAttributes
                );
                break;
            case MediaEventType.SegmentStart:
                var chapterObject = this.common.MediaHeartbeat.createChapterObject(
                    event.Segment.title,
                    event.Segment.index,
                    event.Segment.duration / 1000,
                    this.common.playheadPosition
                );

                this.common.mediaHeartbeat.trackEvent(
                    this.common.MediaHeartbeat.Event.ChapterStart,
                    chapterObject,
                    customAttributes
                );
                break;
            case MediaEventType.SegmentEnd:
                this.common.mediaHeartbeat.trackEvent(
                    this.common.MediaHeartbeat.Event.ChapterComplete,
                    {},
                    customAttributes
                );
                break;
            case MediaEventType.SegmentSkip:
                this.common.mediaHeartbeat.trackEvent(
                    this.common.MediaHeartbeat.Event.ChapterSkip,
                    {},
                    customAttributes
                );
                break;
            case MediaEventType.UpdateQoS:
                this.common.startupTime = event.QoS.startupTime / 1000;
                this.common.droppedFrames = event.QoS.droppedFrames;
                this.common.bitRate = event.QoS.bitRate;
                this.common.fps = event.QoS.fps;

                var qosObject = this.common.MediaHeartbeat.createQoSObject(
                    this.common.bitRate,
                    this.common.startupTime,
                    this.common.fps,
                    this.common.droppedFrames
                );

                this.common.mediaHeartbeat.trackEvent(
                    this.common.MediaHeartbeat.Event.BitrateChange,
                    qosObject,
                    customAttributes
                );
                break;
            default:
                console.error('Unknown Event Type', event);
                return false;
        }
    };

    var getAdobeMetadataKeys = function(attributes, Heartbeat) {
        var AdobeMetadataLookupTable = {
            // Ad Meta Data
            ad_content_advertiser: Heartbeat.AdMetadataKeys.ADVERTISER,
            ad_content_campaign: Heartbeat.AdMetadataKeys.CAMPAIGN_ID,
            ad_content_creative: Heartbeat.AdMetadataKeys.CREATIVE_ID,
            ad_content_placement: Heartbeat.AdMetadataKeys.PLACEMENT_ID,
            ad_content_site_id: Heartbeat.AdMetadataKeys.SITE_ID,
            ad_content_creative_url: Heartbeat.AdMetadataKeys.CREATIVE_URL,

            // Audio Meta
            content_artist: Heartbeat.AudioMetadataKeys.ARTIST,
            content_album: Heartbeat.AudioMetadataKeys.ALBUM,
            content_label: Heartbeat.AudioMetadataKeys.LABEL,
            content_author: Heartbeat.AudioMetadataKeys.AUTHOR,
            content_station: Heartbeat.AudioMetadataKeys.STATION,
            content_publisher: Heartbeat.AudioMetadataKeys.PUBLISHER,

            // Video Meta
            content_show: Heartbeat.VideoMetadataKeys.SHOW,
            stream_format: Heartbeat.VideoMetadataKeys.STREAM_FORMAT,
            content_season: Heartbeat.VideoMetadataKeys.SEASON,
            content_episode: Heartbeat.VideoMetadataKeys.EPISODE,
            content_asset_id: Heartbeat.VideoMetadataKeys.ASSET_ID,
            content_genre: Heartbeat.VideoMetadataKeys.GENRE,
            content_first_air_date: Heartbeat.VideoMetadataKeys.FIRST_AIR_DATE,
            content_digital_date: Heartbeat.VideoMetadataKeys.FIRST_DIGITAL_DATE,
            content_rating: Heartbeat.VideoMetadataKeys.RATING,
            content_originator: Heartbeat.VideoMetadataKeys.ORIGINATOR,
            content_network: Heartbeat.VideoMetadataKeys.NETWORK,
            content_show_type: Heartbeat.VideoMetadataKeys.SHOW_TYPE,
            content_ad_load: Heartbeat.VideoMetadataKeys.AD_LOAD,
            content_mvpd: Heartbeat.VideoMetadataKeys.MVPD,
            content_authorized: Heartbeat.VideoMetadataKeys.AUTHORIZED,
            content_daypart: Heartbeat.VideoMetadataKeys.DAY_PART,
            content_feed: Heartbeat.VideoMetadataKeys.FEED,
        };

        var adobeMetadataKeys = {};
        for (var attribute in attributes) {
            var key = attribute;
            if (AdobeMetadataLookupTable[attribute]) {
                key = AdobeMetadataLookupTable[attribute];
            }
            adobeMetadataKeys[key] = attributes[attribute];
        }

        return adobeMetadataKeys;
    };

    var getStreamType = function(streamType, contentType, types) {
        switch (streamType) {
            case StreamType.OnDemand:
                return contentType === ContentType.Video ? types.VOD : types.AOD;
            case StreamType.LiveStream:
                return types.LIVE;
            case StreamType.Linear:
                return types.LINEAR;
            case StreamType.Podcast:
                return types.PODCAST;
            case StreamType.Audiobook:
                return types.AUDIOBOOK;
            default:
                // If it's an unknown type, just pass it through to Adobe
                return streamType;
        }
    };

    var eventHandler = EventHandler;

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
        },
    };

    var initialization = Initialization;

    // =============== REACH OUT TO MPARTICLE IF YOU HAVE ANY QUESTIONS ===============
    //
    //  Copyright 2018 mParticle, Inc.
    //
    //  Licensed under the Apache License, Version 2.0 (the "License");
    //  you may not use this file except in compliance with the License.
    //  You may obtain a copy of the License at
    //
    //      http://www.apache.org/licenses/LICENSE-2.0
    //
    //  Unless required by applicable law or agreed to in writing, software
    //  distributed under the License is distributed on an "AS IS" BASIS,
    //  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    //  See the License for the specific language governing permissions and
    //  limitations under the License.





    var MessageType = {
        SessionStart: 1,
        SessionEnd: 2,
        PageView: 3,
        PageEvent: 4,
        CrashReport: 5,
        OptOut: 6,
        Commerce: 16,
        Media: 20,
    };

    function constructor() {
        var self = this,
            isAdobeMediaSDKInitialized = false,
            reportingService,
            eventQueue = [],
            name = 'AdobeHeartbeatKit';

        self.moduleId = initialization.moduleId;
        self.common = new common();

        var initForwarderCallback = function() {
            isAdobeMediaSDKInitialized = true;
        };

        function initForwarder(
            settings,
            service,
            testMode,
            trackerId,
            userAttributes,
            userIdentities
        ) {
            if (window.mParticle.isTestEnvironment) {
                reportingService = function() {};
            } else {
                reportingService = service;
            }

            try {
                initialization.initForwarder(
                    settings,
                    testMode,
                    userAttributes,
                    userIdentities,
                    processEvent,
                    eventQueue,
                    self.common,
                    initForwarderCallback
                );
                self.eventHandler = new eventHandler(self.common);
            } catch (e) {
                console.error('Failed to initialize ' + name, e);
            }
        }

        function processEvent(event) {
            var reportEvent = false;
            if (isAdobeMediaSDKInitialized) {
                try {
                    if (event.EventDataType === MessageType.Media) {
                        // Kits should just treat Media Events as generic Events
                        reportEvent = logEvent(event);
                    }
                    if (reportEvent === true && reportingService) {
                        reportingService(self, event);
                        return 'Successfully sent to ' + name;
                    } else {
                        return (
                            'Error logging event or event type not supported on forwarder ' +
                            name
                        );
                    }
                } catch (e) {
                    return 'Failed to send to ' + name + ' ' + e;
                }
            } else {
                eventQueue.push(event);
                return (
                    'Cannot send to forwarder ' +
                    name +
                    ', not initialized. Event added to queue.'
                );
            }
        }

        function logEvent(event) {
            try {
                self.eventHandler.logEvent(event);
                return true;
            } catch (e) {
                return {
                    error: 'Error logging event on forwarder ' + name + '; ' + e,
                };
            }
        }

        this.init = initForwarder;
        this.process = processEvent;
    }

    if (window.mParticle && window.mParticle.registerHBK) {
        window.mParticle.registerHBK({ constructor: constructor });
    }

    var src = {
        AdobeHbkConstructor: constructor,
    };
    var src_1 = src.AdobeHbkConstructor;

    exports.AdobeHbkConstructor = src_1;
    exports.default = src;

    return exports;

}({}));
