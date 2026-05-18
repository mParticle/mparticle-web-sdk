export declare function register(config: {
    kits?: Record<string, unknown>;
}): void;

export { }


declare global {
    interface Window {
        Rokt?: RoktGlobal;
        __rokt_li_guid__?: string;
        optimizely?: OptimizelyGlobal;
        ROKT_DOMAIN?: string;
        mParticle: any;
    }
}

