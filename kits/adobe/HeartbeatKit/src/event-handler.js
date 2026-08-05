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
    UpdateQoS: 46
};

var ContentType = {
    Audio: 'Audio',
    Video: 'Video'
};

var StreamType = {
    LiveStream: 'LiveStream',
    OnDemand: 'OnDemand',
    Linear: 'Linear',
    Podcast: 'Podcast',
    Audiobook: 'Audiobook'
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
        content_feed: Heartbeat.VideoMetadataKeys.FEED
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

module.exports = EventHandler;
