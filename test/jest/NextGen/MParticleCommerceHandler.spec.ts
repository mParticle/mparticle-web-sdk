import {
    CommerceEvent,
    EventTypeEnum,
    ProductActionActionEnum,
} from '@mparticle/event-models';
import { BaseMPMessage } from '../../../src/NextGen/core/baseMPMessage';
import { MParticleDataRepository } from '../../../src/NextGen/dataRepository';
import MParticleCommerceHandler from '../../../src/NextGen/examples/MParticleCommerceHandler';
import BatchManager from '../../../src/NextGen/batchManager';

describe('Next Gen', () => {
    describe('mParticle Commerce Handler', () => {
        describe('#saveData', () => {
            it('saves a commerce event to a data repository', () => {
                const event: CommerceEvent = {
                    event_type: EventTypeEnum.commerceEvent,
                    data: {
                        product_action: {
                            action: ProductActionActionEnum.addToCart,
                        },
                    },
                };

                const mockDataRepo = new MParticleDataRepository();
                const commerceHandler = new MParticleCommerceHandler(
                    mockDataRepo,
                    null
                );

                commerceHandler.saveData(event, false);
                expect(mockDataRepo.internalState).toEqual([event]);
            });

            it('should immediately upload if immediateUpload is true', () => {
                const event: CommerceEvent = {
                    event_type: EventTypeEnum.commerceEvent,
                    data: {
                        product_action: {
                            action: ProductActionActionEnum.addToCart,
                        },
                    },
                };

                const batchManager = new BatchManager(null);
                const batchSpy = jest
                    .spyOn(batchManager, 'uploadBatch')
                    .mockReturnValue(); // Prevent calling actual api request

                const mockDataRepo = new MParticleDataRepository();
                const commerceHandler = new MParticleCommerceHandler(
                    mockDataRepo,
                    batchManager
                );

                commerceHandler.saveData(event, true);

                expect(batchSpy).toHaveBeenCalledWith({
                    mpid: 'test-mpid',
                    environment: 'unknown',
                    events: [event],
                });
            });
        });

        describe('#retrieveData', () => {
            it('returns a list events', () => {
                const event: BaseMPMessage = {
                    name: 'Session Start Test',
                };

                const mockDataRepo = new MParticleDataRepository();

                mockDataRepo.insertCommerceEvent(event);
                mockDataRepo.insertCommerceEvent(event);
                mockDataRepo.insertCommerceEvent(event);

                const commerceHandler = new MParticleCommerceHandler(
                    mockDataRepo,
                    null
                );

                expect(commerceHandler.retrieveData()).toEqual([
                    event,
                    event,
                    event,
                ]);
            });

            it('returns an empty list if there are no events', () => {
                const mockDataRepo = new MParticleDataRepository();
                const commerceHandler = new MParticleCommerceHandler(
                    mockDataRepo,
                    null
                );
                expect(commerceHandler.retrieveData()).toEqual([]);
            });
        });
        describe('#type', () => {
            it('returns a DataHandlerType of Commerce Event', () => {
                const commerceHandler = new MParticleCommerceHandler(
                    null,
                    null
                );

                expect(commerceHandler.type()).toBe('commerce_event');
            });
        });
    });
});
