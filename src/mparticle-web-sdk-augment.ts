/**
 * Published @types/mparticle__web-sdk describe the consumer API and omit
 * snippet/internal globals (config.rq, Store, isIOS, _BatchValidator).
 * With "module": "ESNext" those typings attach to window.mParticle, so the
 * IIFE build needs this augmentation. Do not import this file.
 */
export {};

declare module '@mparticle/web-sdk' {
    export let config: {
        rq?: Array<any>;
        [key: string]: any;
    };
    export let Store: any;
    export let isIOS: boolean;
    export let _BatchValidator: any;
}
