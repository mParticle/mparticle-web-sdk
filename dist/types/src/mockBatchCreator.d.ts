import { BaseEvent } from './sdkRuntimeModels';
import { Batch } from '@mparticle/event-models';
export default class _BatchValidator {
    private getMPInstance;
    private createSDKEventFunction;
    returnBatch(events: BaseEvent | BaseEvent[]): Batch | null;
}
