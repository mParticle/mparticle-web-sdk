import { Dictionary } from '@mparticle/web-sdk';

export interface IEventTimingService {
    setEventTiming: (eventName: string, timestamp: number) => void;
    getAllTimings: () => Dictionary<number>;
}

export function EventTimingService(this: IEventTimingService) {
    const eventTimings = {} as Dictionary<number>;

    this.setEventTiming = function(eventName, timestamp) {
        eventTimings[eventName] = timestamp;
    };

    this.getAllTimings = function() {
        return eventTimings;
    };
}

export const EventTimingNames = {
    SdkStart: 'sdkStart',
    SdkRoktScriptAppended: 'sdkRoktScriptAppended',
    SdkScriptRequestStart: 'sdkScriptRequestStart',
    SdkScriptRequestEnd: 'sdkScriptRequestEnd',
} as const;

export type EventTimingName = typeof EventTimingNames[keyof typeof EventTimingNames];
