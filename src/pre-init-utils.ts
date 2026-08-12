import { IPixelConfiguration } from './cookieSyncManager';
import { MPForwarder } from './forwarders.interfaces';
import { IntegrationDelays } from './mp-instance';
import { SDKLoggerApi } from './sdkRuntimeModels';
import { isEmpty, isFunction, getErrorMessage } from './utils';

export interface IPreInit {
    readyQueue: Array<Function> | Array<any>;
    integrationDelays: IntegrationDelays;
    forwarderConstructors: Array<MPForwarder>;
    pixelConfigurations?: Array<IPixelConfiguration>;
    isDevelopmentMode?: boolean;
}

export const processReadyQueue = (readyQueue, logger: SDKLoggerApi): Array<Function> => {
    if (isEmpty(readyQueue)) {
        return [];
    }

    // Without draining first, sync re-entry (cache-hit identify →
    // parseIdentityResponse → processReadyQueue) re-iterates the same array:
    // callers only replace `_preInit.readyQueue` with [] after we return, so the
    // nested call still sees every entry. That duplicates Identity/event calls
    // and can nest "Unable to compute proper mParticle function" wraps.
    // Splice the queue empty up front so a nested call observes [].
    const items = readyQueue.splice(0, readyQueue.length);

    // Isolate each item so one throw cannot abort the rest of this pass.
    // Drain-first already removed siblings from the shared queue; without a
    // per-item catch they would be lost forever when forEach aborts.
    items.forEach((readyQueueItem) => {
        try {
            if (isFunction(readyQueueItem)) {
                readyQueueItem();
            } else if (Array.isArray(readyQueueItem)) {
                processPreloadedItem(readyQueueItem);
            }
        } catch (e) {
            logger.error('Error processing ready queue item: ' + getErrorMessage(e));
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
            (computedMPFunction as unknown as Function).apply(context, args);
        } catch (e) {
            throw new Error('Unable to compute proper mParticle function ' + e);
        }
    }
};
