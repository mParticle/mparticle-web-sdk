import { SDKEvent } from './sdkRuntimeModels';
import { IMParticleWebSDKInstance } from './mp-instance';
import Constants from './constants';
import { EventType } from './types';

export function createBaseEvent(
    mpInstance: IMParticleWebSDKInstance,
    messageType: number,
    eventName: string = ''
): SDKEvent {
    const now = Date.now();
    const { _Store, Identity, _timeOnSiteTimer } = mpInstance;
    const { sessionId, deviceId, sessionStartDate, SDKConfig } = _Store;
    return {
        EventDataType: messageType,
        EventName: eventName,
        EventCategory: EventType.Other,
        Timestamp: now,
        SessionId: sessionId,
        MPID: Identity.getCurrentUser()?.getMPID(),
        DeviceId: deviceId,
        IsFirstRun: false,
        SourceMessageId: '',
        SDKVersion: Constants.sdkVersion,
        CustomFlags: {},
        UserAttributes: {},
        UserIdentities: [],
        SessionStartDate: sessionStartDate?.getTime() || now,
        Debug: SDKConfig.isDevelopmentMode,
        CurrencyCode: null,
        ExpandedEventCount: 0,
        ActiveTimeOnSite: _timeOnSiteTimer?.getTimeInForeground() || 0
    };
} 