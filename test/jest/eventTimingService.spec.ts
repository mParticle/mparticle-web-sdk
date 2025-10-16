import { EventTimingService, IEventTimingService, EventTimingName } from '../../src/eventTimingService';

describe('EventTimingService', () => {
    let timingService: IEventTimingService;

    beforeEach(() => {
        timingService = new EventTimingService();
    });

    it('should start and end timing, and return duration', () => {
        timingService.setEventTiming(EventTimingName.SdkStart, 1000);
        timingService.setEventTiming(EventTimingName.SdkRoktScriptAppended, 14225);

        const timings = timingService.getAllTimings();

        expect(timings).toEqual({
            [EventTimingName.SdkStart]: 1000,
            [EventTimingName.SdkRoktScriptAppended]: 14225,
        });
    });

    it('should return empty object if no timings are set', () => {
        expect(timingService.getAllTimings()).toEqual({});
    });
});
