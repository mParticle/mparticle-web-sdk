import { EventTimingService, IEventTimingService } from '../../src/eventTimingService';

describe('EventTimingService', () => {
    let timingService: IEventTimingService;

    beforeEach(() => {
        timingService = new EventTimingService();
    });

    it('should start and end timing, and return duration', () => {
        timingService.setEventTiming('myEvent', 1000);
        timingService.setEventTiming('otherEvent', 14225);

        const timings = timingService.getAllTimings();
        const myEventDuration = timings['myEvent'];
        const otherEventDuration = timings['otherEvent'];

        expect(myEventDuration).toEqual(1000);
        expect(otherEventDuration).toEqual(14225);
    });

    it('should return empty object if no timings are set', () => {
        expect(timingService.getAllTimings()).toEqual({});
    });
});
