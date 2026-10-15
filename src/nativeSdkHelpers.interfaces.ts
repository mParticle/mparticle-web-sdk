export interface IWKScriptMessageHandler {
    postMessage(message: string): void;
}

export interface IAndroidNativeBridge {
    [methodName: string]: ((payload?: string) => void) | undefined;
}

declare global {
    interface Window {
        webkit?: {
            messageHandlers?: Record<
                string,
                IWKScriptMessageHandler | undefined
            >;
        };
        mParticleAndroid?: IAndroidNativeBridge;
    }
}

export interface INativeSdkHelpers {
    initializeSessionAttributes: (apiKey: string) => void;
    isBridgeV2Available: (bridgeName: string) => boolean;
    isWebviewEnabled: (
        requiredWebviewBridgeName: string,
        minWebviewBridgeVersion: number
    ) => boolean;
    isBridgeV1Available: () => boolean;
    sendToNative: (path: string, value?: string) => void;
    sendViaBridgeV1: (path: string, value: string) => void;
    sendViaIframeToIOS: (path: string, value: string) => void;
    sendViaBridgeV2: (path: string, value: string, requiredWebviewBridgeName: string) => void;
}
