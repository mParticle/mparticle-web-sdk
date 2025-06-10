import { IPixelConfiguration } from './cookieSyncManager';
import { MPForwarder } from './forwarders.interfaces';
import { IntegrationDelays } from './mp-instance';
import { isEmpty, isFunction } from './utils';

export interface IPreInit {
    readyQueue: (() => void)[] | any[];
    integrationDelays: IntegrationDelays;
    forwarderConstructors: MPForwarder[];
    pixelConfigurations?: IPixelConfiguration[];
    isDevelopmentMode?: boolean;
}

export const processReadyQueue = (readyQueue): (() => void)[] => {
    if (!isEmpty(readyQueue)) {
        readyQueue.forEach((readyQueueItem) => {
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
    if (
        typeof window !== 'undefined' &&
        window.mParticle &&
        window.mParticle[args[0]]
    ) {
        window.mParticle[method](...args);
        // otherwise, the method is on either eCommerce or Identity objects, ie. "eCommerce.setCurrencyCode", "Identity.login"
    } else {
        const methodArray = method.split('.');
        try {
            let computedMPFunction = window.mParticle;
            let context = window.mParticle;

            // Track both the function and its context
            for (const currentMethod of methodArray) {
                context = computedMPFunction; // Keep track of the parent object
                computedMPFunction = computedMPFunction[currentMethod];
            }

            // Apply the function with its proper context
            (
                computedMPFunction as unknown as (...args: unknown[]) => unknown
            ).apply(context, args);
        } catch (e) {
            throw new Error('Unable to compute proper mParticle function ' + e);
        }
    }
};
