import { IPixelConfiguration } from './cookieSyncManager';
import { MPForwarder } from './forwarders.interfaces';
import { IntegrationDelays } from './mp-instance';
export interface IPreInit {
    readyQueue: Function[] | any[];
    integrationDelays: IntegrationDelays;
    forwarderConstructors: MPForwarder[];
    pixelConfigurations?: IPixelConfiguration[];
    isDevelopmentMode?: boolean;
}
export declare const processReadyQueue: (readyQueue: any) => Function[];
