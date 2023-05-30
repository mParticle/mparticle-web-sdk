import { Mediator } from '../../../../src/NextGen/core/mediator';

describe('NextGen', () => {
    describe('Mediator', () => {
        describe('#registerComponents', () => {
            it('should register identity component', () => {
                const testMediator = new Mediator();
                testMediator.configure({});
                expect(testMediator.identity).toBeDefined();

                expect(testMediator.identity.login).toBeDefined();
            });

            it('should register event logging component', () => {
                const testMediator = new Mediator();
                testMediator.configure({});
                expect(testMediator.eventLogging).toBeDefined();
                expect(testMediator.eventLogging.logEvent).toBeDefined();
            });
        });
    });
});
