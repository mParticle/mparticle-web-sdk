import { IPixelConfiguration } from './cookieSyncManager';
import { MPForwarder } from './forwarders.interfaces';
import { IntegrationDelays } from './mp-instance';
import { isEmpty, isFunction } from './utils';

export interface IPreInit {
    readyQueue: Function[] | any[];
    integrationDelays: IntegrationDelays;
    forwarderConstructors: MPForwarder[];
    pixelConfigurations?: IPixelConfiguration[];
    isDevelopmentMode?: boolean;
}

export const processReadyQueue = (readyQueue): Function[] => {
    if (isEmpty(readyQueue)) {
        return [];
    }

    // Drain the shared queue in place before processing. Callers only replace
    // `_preInit.readyQueue` with the returned `[]` *after* this function
    // returns, so a synchronous re-entry (e.g. cache-hit identify →
    // parseIdentityResponse → processReadyQueue) still sees the same array
    // reference. Taking the items up front means that nested call observes an
    // empty queue and cannot re-execute the same entries — which would
    // otherwise duplicate Identity/event calls, or nest
    // "Unable to compute proper mParticle function" errors when an item fails.
    const items = readyQueue.splice(0, readyQueue.length);

    items.forEach(readyQueueItem => {
        if (isFunction(readyQueueItem)) {
            readyQueueItem();
        } else if (Array.isArray(readyQueueItem)) {
            processPreloadedItem(readyQueueItem);
        }
    });

    return [];
};

const processPreloadedItem = (readyQueueItem): void => {
    // Operate on a copy so processPreloadedItem never mutates the caller's
    // queued item array (defensive; the queue itself is drained above).
    const args = readyQueueItem.slice();
    const method = args.splice(0, 1)[0];

    // Skip malformed queue entries (empty array or non-string method) instead of
    // throwing an uncaught TypeError from method.split() below.
    if (typeof method !== 'string' || method.length === 0) {
        return;
    }

    // if the first argument is a method on the base mParticle object, run it
    if (typeof window !== 'undefined' && window.mParticle && window.mParticle[args[0]]) {
        window.mParticle[method].apply(window.mParticle, args);
        // otherwise, the method is on either eCommerce or Identity objects, ie. "eCommerce.setCurrencyCode", "Identity.login"
    } else {
        const methodArray = method.split('.');
        try {
            let computedMPFunction = window.mParticle;
            let context = window.mParticle;
            
            // Track both the function and its context
            for (const currentMethod of methodArray) {
                context = computedMPFunction;  // Keep track of the parent object
                computedMPFunction = computedMPFunction[currentMethod];
            }
            
            // Apply the function with its proper context
            ((computedMPFunction as unknown) as Function).apply(context, args);
        } catch (e) {
            throw new Error('Unable to compute proper mParticle function ' + e);
        }
    }
};
