import BatchManager from '../batchManager';
import { BaseMPMessage } from '../core/baseMPMessage';
import { DataHandlerType } from './dataHandlerType';

export interface IMParticleDataHandlerStrategy<Input, Output> {
    saveData(data: Input, immediateUpload?: boolean): void;
    retrieveData(): Output[];

    // QUESTION: What is this trying to do?
    // fun I.toDto(): O?
    // fun O.toModel(): I?

    // QUESTION: Is this just a getter for type or strategy ID?
    type(): DataHandlerType;
}

export abstract class BaseMparticleDataHandlerStrategy<Input, Output>
    implements IMParticleDataHandlerStrategy<Input, Output> {
    public batchManager: BatchManager;

    constructor(batchManager: BatchManager) {
        this.batchManager = batchManager;
    }

    // QUESTION: We currently queue multiple batches to upload. Should we split these into separate methods?
    // QUESTION: How does the event get passed into the batch manager for creation?
    protected createAndUploadBatch(event: BaseMPMessage) {
        const batch = this.batchManager.createBatch([event]);
        this.batchManager.uploadBatch(batch);
    }

    // QUESTION: Shouldn't data be of type Input?
    abstract saveData(data: Input, immediateUpload?: boolean): void;
    abstract retrieveData(): Output[];
    abstract type(): DataHandlerType;
}
