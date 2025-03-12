import { IPixelConfiguration } from './cookieSyncManager';
import { MPForwarder } from './forwarders.interfaces';
import { IntegrationDelays } from './mp-instance';
import { isEmpty, isFunction } from './utils';

export interface KitListener {
    isReady: boolean;
    callbackQueue: Function[];
}

export interface IPreInit {
    readyQueue: Function[] | any[];
    integrationDelays: IntegrationDelays;
    forwarderConstructors: MPForwarder[];
    pixelConfigurations?: IPixelConfiguration[];
    isDevelopmentMode?: boolean;
    kitListeners: Record<string, KitListener>;
}

export const processReadyQueue = (readyQueue): Function[] => {
    if (!isEmpty(readyQueue)) {
        readyQueue.forEach(readyQueueItem => {
            if (isFunction(readyQueueItem)) {
                readyQueueItem();
            } else if (Array.isArray(readyQueueItem)) {
                processPreloadedItem(readyQueueItem);
            }
        });
    }
    return [];
};

const processPreloadedItem = (readyQueueItem): void => {
    const args = readyQueueItem;
    const method = args.splice(0, 1)[0];

    // if the first argument is a method on the base mParticle object, run it
    if (typeof window !== 'undefined' && window.mParticle && window.mParticle[args[0]]) {
        window.mParticle[method].apply(this, args);
        // otherwise, the method is on either eCommerce or Identity objects, ie. "eCommerce.setCurrencyCode", "Identity.login"
    } else {
        const methodArray = method.split('.');
        try {
            let computedMPFunction = window.mParticle;
            for (const currentMethod of methodArray) {
                computedMPFunction = computedMPFunction[currentMethod];
            }
            ((computedMPFunction as unknown) as Function).apply(this, args);
        } catch (e) {
            throw new Error('Unable to compute proper mParticle function ' + e);
        }
    }
};
