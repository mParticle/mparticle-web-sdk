export default function Forwarders(mpInstance: any, kitBlocker: any): void;
export default class Forwarders {
    constructor(mpInstance: any, kitBlocker: any);
    forwarderStatsUploader: any;
    initForwarders: (userIdentities: any, forwardingStatsCallback: any) => void;
    isEnabledForUserAttributes: (filterObject: any, user: any) => boolean;
    isEnabledForUnknownUser: (excludeAnonymousUserBoolean: any, user: any) => boolean;
    applyToForwarders: (functionName: any, functionArgs: any) => void;
    sendEventToForwarders: (event: any) => void;
    handleForwarderUserAttributes: (functionNameKey: any, key: any, value: any) => void;
    setForwarderUserIdentities: (userIdentities: any) => void;
    setForwarderOnUserIdentified: (user: any) => void;
    setForwarderOnIdentityComplete: (user: any, identityMethod: any) => void;
    getForwarderStatsQueue: () => any;
    setForwarderStatsQueue: (queue: any) => void;
    processForwarders: (config: any, forwardingStatsCallback: any) => void;
    processUIEnabledKits: (config: any) => void;
    returnKitConstructors: () => {};
    configureUIEnabledKit: (configuration: any, kits: any) => void;
    processSideloadedKits: (mpConfig: any) => void;
    configureSideloadedKit: (kitConstructor: any) => void;
    returnConfiguredKit: (forwarder: any, config?: {}) => any;
    configurePixel: (settings: any) => void;
    processPixelConfigs: (config: any) => void;
    sendSingleForwardingStatsToServer: (forwardingStatsData: any) => Promise<void>;
}
