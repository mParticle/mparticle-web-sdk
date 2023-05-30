import { Kit } from '../../sdkRuntimeModels';
import { IMParticleComponent } from './component';
import {
    EventLoggingImplementation,
    IMparticleEventLogging,
} from '../eventLogging/eventLogging';
import { IdentityImplementation, InternalIdentity } from '../identity/identity';
import { IMParticleOptions } from '../options';

// TODO: Should this be part of component.ts?
function isComponent(
    component: IMParticleComponent
): component is IMParticleComponent {
    return (component as IMParticleComponent) !== undefined;
}

export class Mediator {
    public eventLogging: IMparticleEventLogging = null;
    public identity: InternalIdentity = null;
    public kitManager = null;
    public dataUploader = null;

    private kits: Kit[];
    private uploadStrategies;

    constructor() {}

    public configure(options: IMParticleOptions): void {
        // QUESTION: Should we create new instances of the components here?
        this.registerComponent(new IdentityImplementation(this));
        // this.registerComponent(new EventLoggingImplementation(this));
        this.registerComponent(new EventLoggingImplementation());
    }

    private registerKits(options: IMParticleOptions): Kit[] {
        return [];
    }

    private registerComponent(component: IMParticleComponent): void {
        // TODO: Instead of using switch case, could we have the componenet
        //       be aware of what type it is, and just assign it directly?
        // this[component.whatIsIt] = component;

        switch (component.constructor) {
            case IdentityImplementation:
                this.identity = component as IdentityImplementation;
                break;
            case EventLoggingImplementation:
                this.eventLogging = component as EventLoggingImplementation;
                break;
            default:
                console.warn('Unrecognized component', component);
        }
    }
}
