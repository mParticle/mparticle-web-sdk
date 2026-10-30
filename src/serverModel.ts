// TODO: This file is no longer the server model because the web SDK payload
//       is now the server-to-server model.  We should rename this to
//       something more appropriate.

import Types from './types';
import Constants from './constants';
import {
    BaseEvent,
    SDKEvent,
    SDKEventCustomFlags,
} from './sdkRuntimeModels';
import { extend } from './utils';
import { cleanPageHref } from './pageUrl';
import { IntegrationAttributes, ServerSettings } from './store';
import { IMParticleUser } from './identity-user-interfaces';
import { IMParticleWebSDKInstance } from './mp-instance';
import { appendUserInfo } from './user-utils';
import { isIntegrationCaptureEnabled } from './integrationCapture';

const MessageType = Types.MessageType;

export interface IUploadObject extends SDKEvent {
    // TODO: References to `ClientGeneratedId` can be removed when we remove the
    //       V2 event upload path because it does not exist in the V3 payload
    ClientGeneratedId: string;
    // FIXME: This reference to Store is misleading and can be removed whenever
    //        we deprecate v2 related code
    Store: ServerSettings;
    ExpandedEventCount: number;
    ProfileMessageType: number;
}

export interface IServerModel {
    createEventObject: (event: BaseEvent, user?: IMParticleUser) => SDKEvent;
}

export default function ServerModel(
    this: IServerModel,
    mpInstance: IMParticleWebSDKInstance
) {
    this.createEventObject = function(
        event: BaseEvent,
        user?: IMParticleUser
    ): SDKEvent | IUploadObject {
        var uploadObject: Partial<IUploadObject> = {};
        var eventObject: Partial<SDKEvent> = {};

        //  The `optOut` variable is passed later in this method to the `uploadObject`
        //  so that it can be used to denote whether or not a user has "opted out" of being
        //  tracked. If this is an `optOut` Event, we set `optOut` to the inverse of the SDK's
        // `isEnabled` boolean which is controlled via `MPInstanceManager.setOptOut`.
        var optOut =
            event.messageType === Types.MessageType.OptOut
                ? !mpInstance._Store.isEnabled
                : null;

        // TODO: Why is Webview Bridge Enabled or Opt Out necessary here?
        if (
            mpInstance._Store.sessionId ||
            event.messageType === Types.MessageType.OptOut ||
            mpInstance._Store.webviewBridgeEnabled
        ) {
            let customFlags: SDKEventCustomFlags = {...event.customFlags};
            let integrationAttributes: IntegrationAttributes = mpInstance._Store.integrationAttributes;

            const { getFeatureFlag } = mpInstance._Helpers;
            // https://go.mparticle.com/work/SQDSDKS-5053
            // https://go.mparticle.com/work/SQDSDKS-7639
            if (isIntegrationCaptureEnabled(getFeatureFlag)) {
                // Attempt to recapture click IDs in case a third party integration
                // has added or updated  new click IDs since the last event was sent.
                mpInstance._IntegrationCapture.capture();
                const transformedClickIDs = mpInstance._IntegrationCapture.getClickIdsAsCustomFlags();
                customFlags = { ...transformedClickIDs, ...customFlags };
                const transformedIntegrationAttributes = mpInstance._IntegrationCapture.getClickIdsAsIntegrationAttributes();
                integrationAttributes = { ...transformedIntegrationAttributes, ...integrationAttributes };
            }
            

            if (event.hasOwnProperty('toEventAPIObject')) {
                eventObject = event.toEventAPIObject();
            } else {
                eventObject = {
                    // This is an artifact from v2 events where SessionStart/End and AST event
                    //  names are numbers (1, 2, or 10), but going forward with v3, these lifecycle
                    //  events do not have names, but are denoted by their `event_type`
                    EventName:
                        event.name ||
                        String(event.messageType),
                    EventCategory: event.eventType,
                    EventAttributes: mpInstance._Helpers.sanitizeAttributes(
                        event.data,
                        event.name
                    ),
                    ActiveTimeOnSite: mpInstance._timeOnSiteTimer?.getTimeInForeground(),
                    TotalTimeOnSite: mpInstance._Store.getTotalTimeOnSite?.(),
                    PageUrl: cleanPageHref() || null,
                    SourceMessageId:
                        event.sourceMessageId ||
                        mpInstance._Helpers.generateUniqueId(),
                    EventDataType: event.messageType,
                    CustomFlags: customFlags,
                    UserAttributeChanges: event.userAttributeChanges,
                    UserIdentityChanges: event.userIdentityChanges,
                };
            }

            // TODO: Should we move this side effect outside of this method?
            if (event.messageType !== Types.MessageType.SessionEnd) {
                mpInstance._Store.dateLastEventSent = new Date();
            }

            uploadObject = {
                // FIXME: Deprecate when we get rid of V2
                Store: mpInstance._Store.serverSettings,
                SDKVersion: Constants.sdkVersion,
                SessionId: mpInstance._Store.sessionId,
                SessionStartDate: mpInstance._Store.sessionStartDate
                    ? mpInstance._Store.sessionStartDate.getTime()
                    : 0,
                Debug: mpInstance._Store.SDKConfig.isDevelopmentMode,
                Location: mpInstance._Store.currentPosition,
                OptOut: optOut,
                ExpandedEventCount: 0,
                AppVersion: mpInstance.getAppVersion(),
                AppName: mpInstance.getAppName(),
                Package: mpInstance._Store.SDKConfig.package,
                ClientGeneratedId: mpInstance._Store.clientId,
                DeviceId: mpInstance._Store.deviceId,
                IntegrationAttributes: integrationAttributes, 
                CurrencyCode: mpInstance._Store.currencyCode,
                DataPlan: mpInstance._Store.SDKConfig.dataPlan
                    ? mpInstance._Store.SDKConfig.dataPlan
                    : {},
            };

            if (eventObject.EventDataType === MessageType.AppStateTransition) {
                eventObject.IsFirstRun = mpInstance._Store.isFirstRun;
                eventObject.LaunchReferral = cleanPageHref() || null;
            }

            // FIXME: Remove duplicate occurence
            eventObject.CurrencyCode = mpInstance._Store.currencyCode;
            var currentUser = user || mpInstance.Identity.getCurrentUser();
            appendUserInfo(currentUser, eventObject as SDKEvent);

            if (event.messageType === Types.MessageType.SessionEnd) {
                eventObject.SessionLength =
                    mpInstance._Store.dateLastEventSent.getTime() -
                    mpInstance._Store.sessionStartDate.getTime();
                eventObject.currentSessionMPIDs =
                    mpInstance._Store.currentSessionMPIDs;

                // Session attributes are assigned on a session level, but only uploaded
                // when a session ends. As there is no way to attach event attributes to
                // a `SessionEnd` event, we are uploading the session level attributes
                // as event level attributes in a `SessionEnd` event.
                eventObject.EventAttributes =
                    mpInstance._Store.sessionAttributes;

                // TODO: We should move this out of here to avoid side effects
                mpInstance._Store.currentSessionMPIDs = [];
                mpInstance._Store.sessionStartDate = null;
            }

            uploadObject.Timestamp = mpInstance._Store.dateLastEventSent.getTime();

            return extend({}, eventObject, uploadObject);
        }

        return null;
    };
}
