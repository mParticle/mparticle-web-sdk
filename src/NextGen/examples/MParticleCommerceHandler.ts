import { CommerceEvent } from '@mparticle/event-models';
import { BaseMparticleDataHandlerStrategy } from '../dataHandler/dataHandlerStrategy';
import { BaseMPMessage } from '../core/baseMPMessage';
import { MParticleDataRepository } from '../data/dataRepository';
import BatchManager from '../batchManager';
import { DataHandlerType } from '../dataHandler/dataHandlerType';

export default class MParticleCommerceHandler extends BaseMparticleDataHandlerStrategy<
    CommerceEvent,
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

    // QUESTION: Why should data be any rather than an actual commerce vent?
    public saveData(data: any, immediateUpload: boolean = false): void {
        this.dataRepository.insertCommerceEvent(data);

        if (immediateUpload) {
            // QUESTION: I think create and upload should be split up as there might be queued batches already
            this.createAndUploadBatch(data);
        }
    }

    public retrieveData(): BaseMPMessage[] {
        return this.dataRepository.getEventsByType() || [];
    }

    public type(): DataHandlerType {
        return DataHandlerType.COMMERCE_EVENT;
    }
}
