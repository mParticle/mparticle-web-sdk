import { isEmpty, isFunction } from './utils';

export const processReadyQueue = (readyQueue): Function[] => {
    // debugger;
    console.log('processReadyQueue', readyQueue);
    if (!isEmpty(readyQueue)) {
        readyQueue.forEach(readyQueueItem => {
            if (isFunction(readyQueueItem)) {
                // debugger;
                readyQueueItem();
            } else if (Array.isArray(readyQueueItem)) {
                // debugger;
                processPreloadedItem(readyQueueItem);
            }
        });
    }
    return [];
};

const processPreloadedItem = (readyQueueItem): void => {
    // debugger;
    const args = readyQueueItem;
    const method = args.splice(0, 1)[0];

    // TODO: We should check to make sure window.mParticle is not undefined
    //       or possibly add it as an argument in the constructor
    // if the first argument is a method on the base mParticle object, run it
    if (window.mParticle[args[0]]) {
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
