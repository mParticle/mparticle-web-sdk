import { BatchEnvironmentEnum } from '@mparticle/event-models';
import { Batch } from '@mparticle/event-models';
import { BaseMPMessage } from './core/baseMPMessage';
import { isEmpty } from '../utils';
import { BaseEvent } from '../sdkRuntimeModels';

// TODO: Sync this with existing API Client(s)
export interface IMpApiClientImplementation {
    uploadBatch(batch: Batch): void;
}

export default class BatchManager {
    constructor(private api: IMpApiClientImplementation) {
        this.api = api;
    }

    // QUESTION: Should this take an event or message as a param?
    // Making an assumption that creating a batch should require a message
    public createBatch(events: BaseMPMessage[]): Batch {
        // QUESTION: In the existing Batch Uploader, we have a method to create new batches based on events
        //           should this method reuse that code or will this be a much simpler create method?

        if (!isEmpty(events)) {
            return {
                environment: BatchEnvironmentEnum.unknown,
                mpid: 'test-mpid',
            };
        } else {
            return null;
        }
    }

    // QUESTION: We should consider making this take an array or queue of batches, as we are required to upload batches in sequence if they are queued
    public uploadBatch(batch: Batch): void {
        this.api.uploadBatch(batch);
    }
}

// QUESTION: How would MpBatch differ from the existing Batch definition?
class MpBatch {
    // QUESTION: Why are we setting data to string? Shouldn't it be a JSON object?
    public data: string = '';
    public batchId: number = null;

    constructor(data: string, batchId: number) {
        this.data = data;
        this.batchId = batchId;
    }
}
