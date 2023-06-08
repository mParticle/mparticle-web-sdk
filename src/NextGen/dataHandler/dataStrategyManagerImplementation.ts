import { BaseEvent } from '@mparticle/event-models';
import { IMParticleDataHandler } from './dataHandler';
import { IMParticleDataHandlerStrategy } from './dataHandlerStrategy';

// TODO: We should define some interface for the Input so that we can make sure
//       we have the correct methods that we expect it to have
export class MParticleDataStrategyManagerImplementation<Input, Output>
    implements IMParticleDataHandler {
    private strategies: IMParticleDataHandlerStrategy<Input, Output>[];
    constructor(strategies: IMParticleDataHandlerStrategy<Input, Output>[]) {
        this.strategies = strategies;
    }

    // TODO: Should data be of type Input?
    saveData(data: any, immediateUpload: boolean = false) {
        this.getStrategy(data).saveData(data, immediateUpload);
    }

    private getStrategy(
        data: BaseEvent
    ): IMParticleDataHandlerStrategy<Input, Output> {
        return this.strategies.find(
            strategy =>
                strategy.type().toString() === data.event_type.toString()
        );
    }

    configure(): void {}
}
