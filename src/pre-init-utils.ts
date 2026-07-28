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

// Kept free of the method path so it stays low-cardinality for monitors and
// grouping. The path itself travels on the error's `stack`, which the reporting
// pipeline forwards to a dedicated stackTrace field.
const UNRESOLVED_METHOD_MESSAGE =
    'Unable to compute proper mParticle function - method not found';

/**
 * A queued entry named a method that does not resolve on `window.mParticle`.
 * Distinct from a method that resolved and then threw on its own.
 */
const unresolvedMethodError = (method: string): Error => {
    const error = new Error(UNRESOLVED_METHOD_MESSAGE);
    error.stack =
        'mParticle pre-init method not found: ' +
        method +
        '\n' +
        (error.stack || '');
    return error;
};

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
    // Operate on a copy of the queued item. The ready queue can be drained more
    // than once (e.g. a synchronous cache-hit identify re-enters processReadyQueue
    // before the outer drain resets the queue). Splicing the shared item array in
    // place would corrupt it on the second pass — ["Identity.login", opts] becomes
    // [opts] — so `method` turns into a non-string/undefined and `method.split('.')`
    // throws. Copying keeps the original item intact for any repeat pass.
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
        let computedMPFunction = window.mParticle;
        let context = window.mParticle;

        // Track both the function and its context
        for (const currentMethod of methodArray) {
            context = computedMPFunction; // Keep track of the parent object
            computedMPFunction = computedMPFunction?.[currentMethod];
        }

        // Resolution failures and failures thrown by a resolved method are
        // different problems and are reported separately. Resolving with `?.`
        // also stops a missing intermediate object (ie. "Identity" on
        // "Identity.login") from surfacing as an incidental TypeError that
        // named the property rather than the queued method.
        if (!isFunction(computedMPFunction)) {
            throw unresolvedMethodError(method);
        }

        try {
            // Apply the function with its proper context
            ((computedMPFunction as unknown) as Function).apply(context, args);
        } catch (e) {
            throw new Error('Unable to compute proper mParticle function ' + e);
        }
    }
};
