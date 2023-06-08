import mParticle from '../../../../src/NextGen/core/mParticle';
import { IMParticleOptions } from '../../../../src/NextGen/options';

describe('Next Gen', () => {
    describe('mParticle Core', () => {
        describe('#init', () => {
            it('should throw an error when an invalid config is used', () => {
                const options: IMParticleOptions = {};
                expect(() => {
                    new mParticle(options);
                }).toThrow('Invalid mParticle Config');
            });
        });

        describe('#getInstance', () => {
            it('should return an instance of the mParticle SDK', () => {
                const options: IMParticleOptions = {
                    apiKey: 'test-key',
                };
                const mpInstance = new mParticle(options);

                expect(mpInstance).toBeDefined();
            });

            it.skip('should throw an exception if instance is undefined', () => {
                const options: IMParticleOptions = {};
                const mpInstance = new mParticle(options);

                expect(() => {
                    mpInstance.getInstance();
                }).toThrow(
                    'mParticle must be initialized before returning an instance'
                );
            });
        });
    });

    describe('mParticle Components', () => {
        it('should register an Identity Component', () => {
            const options: IMParticleOptions = {
                apiKey: 'test-key',
            };
            const mpInstance = new mParticle(options);
            // mpInstance.Identity;
            expect(mpInstance.Identity).toBeDefined();
            expect(mpInstance.getInstance().Identity().login).toBeDefined();
            // Expect mPInstance.Identity to be a mediator
        });

        it('should register an EventLogging Component', () => {
            const options: IMParticleOptions = {
                apiKey: 'test-key',
            };
            const mpInstance = new mParticle(options);
            // mpInstance.EventLogging;
            expect(mpInstance.EventLogging).toBeDefined();

            // QUESTION: will we eventually have a shorter public log event method?
            expect(
                mpInstance.getInstance().EventLogging().logEvent
            ).toBeDefined();
            // Expect mPInstance.EventLogging to be a mediator
        });
    });
});
