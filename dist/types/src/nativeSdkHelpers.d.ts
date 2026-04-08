export default function NativeSdkHelpers(mpInstance: any): void;
export default class NativeSdkHelpers {
    constructor(mpInstance: any);
    initializeSessionAttributes: (apiKey: any) => void;
    isBridgeV2Available: (bridgeName: any) => boolean;
    isWebviewEnabled: (requiredWebviewBridgeName: any, minWebviewBridgeVersion: any) => any;
    isBridgeV1Available: () => boolean;
    sendToNative: (path: any, value: any) => void;
    sendViaBridgeV1: (path: any, value: any) => void;
    sendViaIframeToIOS: (path: any, value: any) => void;
    sendViaBridgeV2: (path: any, value: any, requiredWebviewBridgeName: any) => void;
}
