import { Dictionary } from '@mparticle/web-sdk';

export interface IEventTimingService {
    setEventTiming: (eventName: EventTimingName, timestamp: number) => void;
    getAllTimings: () => Dictionary<number>;
}

export function EventTimingService(this: IEventTimingService) {
    const eventTimings = {} as Dictionary<number>;

    this.setEventTiming = function(eventName: EventTimingName, timestamp) {
        eventTimings[eventName] = timestamp;
    };

    this.getAllTimings = function() {
        return eventTimings;
    };
}
export type EventTimingName = (typeof EventTimingName)[keyof typeof EventTimingName];
export const EventTimingName = {
    SdkStart: 'sdkStart',
    SdkRoktScriptAppended: 'sdkRoktScriptAppended',
    SdkScriptRequestStart: 'sdkScriptRequestStart',
    SdkScriptRequestEnd: 'sdkScriptRequestEnd',
} as const;