import { EventLoggingImplementation } from '../../../../src/NextGen/eventLogging/eventLogging';

describe('Next Gen', () => {
    describe('Event Logging Implementation', () => {
        describe('#logEvent', () => {
            it('should be defined', () => {
                const eventLogger = new EventLoggingImplementation();
                expect(eventLogger.logEvent).toBeDefined();
            });
        });

        describe('#logError', () => {
            it('should be defined', () => {
                const eventLogger = new EventLoggingImplementation();
                expect(eventLogger.logError).toBeDefined();
            });
        });
    });
});
