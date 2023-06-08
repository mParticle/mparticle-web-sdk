import { IMParticleComponent } from '../core/component';
import { BaseEvent } from '../../sdkRuntimeModels';
import { Dictionary } from '@mparticle/web-sdk';

export interface IMparticleEventLogging extends IMParticleComponent {
    logEvent(event: BaseEvent): void;
    logError(message: string, params?: Dictionary, error?: Error): void;
}

// QUESTION: Can we use the same name for interface and class for breveity?
export class EventLoggingImplementation implements IMparticleEventLogging {
    constructor() {}

    public logEvent(event: BaseEvent): void {
        console.log('Log Event', event);
    }

    public logError(message: string, params?: Dictionary, error?: Error): void {
        console.error(message, params, error);
    }
}
