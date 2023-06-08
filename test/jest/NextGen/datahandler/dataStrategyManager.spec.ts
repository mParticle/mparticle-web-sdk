import {
    CommerceEvent,
    EventTypeEnum,
    ProductActionActionEnum,
} from '@mparticle/event-models';
import BatchManager from '../../../../src/NextGen/batchManager';
import { BaseMPMessage } from '../../../../src/NextGen/core/baseMPMessage';
import { BaseMparticleDataHandlerStrategy } from '../../../../src/NextGen/dataHandler/dataHandlerStrategy';
import { DataHandlerType } from '../../../../src/NextGen/dataHandler/dataHandlerType';
import { MParticleDataStrategyManagerImplementation } from '../../../../src/NextGen/dataHandler/dataStrategyManagerImplementation';
import { MParticleDataRepository } from '../../../../src/NextGen/data/dataRepository';

class MockDataHandler extends BaseMparticleDataHandlerStrategy<
    CustomEvent,
    BaseMPMessage
> {
    private dataRepository: MParticleDataRepository;
    constructor(
        dataRepository: MParticleDataRepository,
        batchManager: BatchManager
    ) {
        super(batchManager);
        this.dataRepository = dataRepository;
        this.batchManager = batchManager;
    }

    public saveData(data: any, immediateUpload: boolean = false): void {}

    public retrieveData(): BaseMPMessage[] {
        return [];
    }

    public type(): DataHandlerType {
        return DataHandlerType.COMMERCE_EVENT;
    }
}

describe('Next Gen', () => {
    describe('Data Strategy Manager Implementation', () => {
        describe('#saveData', () => {
            it('should be defined', () => {
                const dsManager = new MParticleDataStrategyManagerImplementation(
                    []
                );

                expect(dsManager.saveData).toBeDefined();
            });

            it('should use a strategy to save data', () => {
                const event: CommerceEvent = {
                    event_type: EventTypeEnum.commerceEvent,
                    data: {
                        product_action: {
                            action: ProductActionActionEnum.addToCart,
                        },
                    },
                };

                const mockDataRepo = new MParticleDataRepository();
                const mockStrategy = new MockDataHandler(mockDataRepo, null);

                const strategySpy = jest.spyOn(mockStrategy, 'saveData');
                const dsManager = new MParticleDataStrategyManagerImplementation(
                    [mockStrategy]
                );

                dsManager.saveData(event);

                expect(strategySpy).toHaveBeenCalledWith(event, false);
            });
        });

        describe('#configure', () => {
            it('should be defined', () => {
                const dsManager = new MParticleDataStrategyManagerImplementation(
                    []
                );

                expect(dsManager.configure).toBeDefined();
            });
        });
    });
});
