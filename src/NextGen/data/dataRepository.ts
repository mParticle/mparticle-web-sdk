import { Batch } from '@mparticle/event-models';
import { BaseMPMessage } from '../core/baseMPMessage';

export class MParticleDataRepository {
    public internalState: BaseMPMessage[] = [];

    // QUESTION: Shouldn't this be of type
    public insertCommerceEvent(data: BaseMPMessage): void {
        this.internalState.push(data);
    }

    public insertBreadcrumb(data: BaseMPMessage): void {
        this.internalState.push(data);
    }

    public getEventsByType(): BaseMPMessage[] {
        return this.internalState;
    }

    public getBatch(source_request_id: string): Batch {
        return null;
    }

    public getBatches(): Batch[] {
        return [];
    }
}
