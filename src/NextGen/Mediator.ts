import { Logger } from '@mparticle/web-sdk';
import { IServerModel } from '../serverModel';
import { IStore } from '../store';
import { IEventLogging } from './EventLogging';
import { MParticleWebSDK, SDKHelpersApi } from '../sdkRuntimeModels';
import { IAPIClient } from '../apiClient';

export interface IMediator {
    eventLogging: IEventLogging;
    logger: Logger;
    store: IStore;

    // TODO: Refactor Server Model to decouple mPInstance
    serverModel?: IServerModel;
}

export default class Mediator implements IMediator {
    public eventLogging: IEventLogging;
    public logger: Logger;
    public store: IStore;

    // TODO: Decouple Helpers from mPInstance
    public helpers: SDKHelpersApi;

    // TODO: These should components of Event Logging
    public serverModel?: IServerModel;
    public eventApiClient: IAPIClient;

    // TODO: Decouple this
    public mPInstance: MParticleWebSDK;

    constructor(
        eventLogging: IEventLogging,
        store: IStore,
        logger: Logger,
        mPInstance: MParticleWebSDK
    ) {
        this.eventLogging = eventLogging;
        this.logger = logger;
        this.store = store;

        // Define convenience methods to facilitate mPInstance
        // decoupling in the future
        this.mPInstance = mPInstance;
        this.helpers = this.mPInstance._Helpers;
        // this.eventApiClient = this.mPInstance._APIClient;
    }
}
