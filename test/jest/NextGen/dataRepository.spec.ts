import { BaseMPMessage } from '../../../src/NextGen/core/baseMPMessage';
import { MParticleDataRepository } from '../../../src/NextGen/data/dataRepository';

describe('Next Gen', () => {
    describe('Data Repository', () => {
        describe('#insertCommerceEvent', () => {
            const dataRepo = new MParticleDataRepository();
            const event: BaseMPMessage = {
                name: 'Session Start Test',
            };

            expect(dataRepo.insertCommerceEvent).toBeDefined();

            expect(dataRepo.internalState.length).toBe(0);

            dataRepo.insertCommerceEvent(event);

            expect(dataRepo.internalState.length).toBe(1);
        });

        describe('#insertBreadcrumb', () => {
            it('should update its own internal state', () => {
                const dataRepo = new MParticleDataRepository();
                const event: BaseMPMessage = {
                    name: 'Breadcrumb test',
                };

                expect(dataRepo.insertBreadcrumb).toBeDefined();

                dataRepo.insertBreadcrumb(event);

                expect(dataRepo.internalState.length).toBe(1);
            });
        });

        describe('#getEventsByType', () => {
            it('should be defined', () => {});
        });

        describe('#getBatch', () => {
            it('should be defined', () => {
                const dataRepo = new MParticleDataRepository();
                expect(dataRepo.getBatch).toBeDefined;
            });
        });

        describe('#getBatches', () => {
            it('should be defined', () => {
                const dataRepo = new MParticleDataRepository();
                expect(dataRepo.getBatches).toBeDefined;
            });
        });
    });
});
