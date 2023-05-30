import { isEmpty } from '../../utils';
import { IMparticleEventLogging } from '../eventLogging/eventLogging';
import { IMParticleIdentity } from '../identity/identity';
import { Mediator } from './mediator';
import { IMParticleOptions } from '../options';

export default class mParticle {
    private mediator: Mediator;

    // QUESTION: should we store an array of instances or just the "current" instance
    private _instance: mParticle = null;

    constructor(private options: IMParticleOptions) {
        if (isEmpty(options)) {
            throw new Error('Invalid mParticle Config');
        }

        this._instance = this;

        // QUESTION: Should each instance have its own mediator?
        this.mediator = new Mediator();
        this.mediator.configure(options);
    }

    public getInstance(): mParticle {
        if (this._instance) {
            return this._instance;
        }

        throw new Error(
            'mParticle must be initialized before returning an instance'
        );
    }

    public Identity(): IMParticleIdentity {
        // QUESTION: should this return the instance's mediator?
        return this.mediator.identity;
    }

    public EventLogging(): IMparticleEventLogging {
        // QUESTION: should this return the instance's mediator?
        return this.mediator.eventLogging;
    }
}
