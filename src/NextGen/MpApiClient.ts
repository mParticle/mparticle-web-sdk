import { Batch } from '@mparticle/event-models';

export interface IMpApiClient {
    uploadBatch(batch: Batch): void;
}

export class MpApiClient implements IMpApiClient {
    public uploadBatch(batch: Batch) {}
}
