import Constants from './constants';
import { IMParticleWebSDKInstance } from './mp-instance';
import { INativeSdkHelpers } from './nativeSdkHelpers.interfaces';
import { Dictionary } from './utils';

const Messages = Constants.Messages;

const androidBridgeNameBase = 'mParticleAndroid';
const iosBridgeNameBase = 'mParticle';

export default function NativeSdkHelpers(
    this: INativeSdkHelpers,
    mpInstance: IMParticleWebSDKInstance
): void {
    this.initializeSessionAttributes = (apiKey: string): void => {
        const { SetSessionAttribute } = Constants.NativeSdkPaths;
        const env = JSON.stringify({
            key: '$src_env',
            value: 'webview',
        });

        const key = JSON.stringify({
            key: '$src_key',
            value: apiKey,
        });

        this.sendToNative(SetSessionAttribute, env);
        if (apiKey) {
            this.sendToNative(SetSessionAttribute, key);
        }
    };

    this.isBridgeV2Available = (bridgeName: string): boolean => {
        if (!bridgeName) {
            return false;
        }
        const androidBridgeName =
            androidBridgeNameBase + '_' + bridgeName + '_v2';
        const iosBridgeName = iosBridgeNameBase + '_' + bridgeName + '_v2';

        // iOS v2 bridge
        if (
            (window as Dictionary).webkit &&
            (window as Dictionary).webkit.messageHandlers &&
            (window as Dictionary).webkit.messageHandlers.hasOwnProperty(iosBridgeName)
        ) {
            return true;
        }
        // other iOS v2 bridge
        // TODO: what to do about people setting things on mParticle itself?
        if (
            window.mParticle &&
            (window.mParticle as Dictionary).uiwebviewBridgeName &&
            (window.mParticle as Dictionary).uiwebviewBridgeName === iosBridgeName
        ) {
            return true;
        }
        // android
        if (window.hasOwnProperty(androidBridgeName)) {
            return true;
        }
        return false;
    };

    this.isWebviewEnabled = (
        requiredWebviewBridgeName: string,
        minWebviewBridgeVersion: number
    ): boolean => {
        (mpInstance._Store as Dictionary).bridgeV2Available = this.isBridgeV2Available(
            requiredWebviewBridgeName
        );
        (mpInstance._Store as Dictionary).bridgeV1Available = this.isBridgeV1Available();

        if (minWebviewBridgeVersion === 2) {
            return (mpInstance._Store as Dictionary).bridgeV2Available;
        }

        // iOS BridgeV1 can be available via mParticle.isIOS, but return false if uiwebviewBridgeName doesn't match requiredWebviewBridgeName
        if (window.mParticle) {
            if (
                (window.mParticle as Dictionary).uiwebviewBridgeName &&
                (window.mParticle as Dictionary).uiwebviewBridgeName !==
                    iosBridgeNameBase + '_' + requiredWebviewBridgeName + '_v2'
            ) {
                return false;
            }
        }

        if (minWebviewBridgeVersion < 2) {
            // ios
            return (
                (mpInstance._Store as Dictionary).bridgeV2Available ||
                (mpInstance._Store as Dictionary).bridgeV1Available
            );
        }

        return false;
    };

    this.isBridgeV1Available = (): boolean => {
        if (
            mpInstance._Store.SDKConfig.useNativeSdk ||
            (window as Dictionary).mParticleAndroid ||
            mpInstance._Store.SDKConfig.isIOS
        ) {
            return true;
        }

        return false;
    };

    this.sendToNative = (path: string, value?: string): void => {
        if (
            (mpInstance._Store as Dictionary).bridgeV2Available &&
            mpInstance._Store.SDKConfig.minWebviewBridgeVersion === 2
        ) {
            this.sendViaBridgeV2(
                path,
                value,
                mpInstance._Store.SDKConfig.requiredWebviewBridgeName
            );
            return;
        }
        if (
            (mpInstance._Store as Dictionary).bridgeV2Available &&
            mpInstance._Store.SDKConfig.minWebviewBridgeVersion < 2
        ) {
            this.sendViaBridgeV2(
                path,
                value,
                mpInstance._Store.SDKConfig.requiredWebviewBridgeName
            );
            return;
        }
        if (
            (mpInstance._Store as Dictionary).bridgeV1Available &&
            mpInstance._Store.SDKConfig.minWebviewBridgeVersion < 2
        ) {
            this.sendViaBridgeV1(path, value);
            return;
        }
    };

    this.sendViaBridgeV1 = (path: string, value: string): void => {
        if (
            (window as Dictionary).mParticleAndroid &&
            (window as Dictionary).mParticleAndroid.hasOwnProperty(path)
        ) {
            mpInstance.Logger.verbose(
                Messages.InformationMessages.SendAndroid + path
            );
            (window as Dictionary).mParticleAndroid[path](value);
        } else if (mpInstance._Store.SDKConfig.isIOS) {
            mpInstance.Logger.verbose(
                Messages.InformationMessages.SendIOS + path
            );
            this.sendViaIframeToIOS(path, value);
        }
    };

    this.sendViaIframeToIOS = (path: string, value: string): void => {
        const iframe = document.createElement('IFRAME');
        iframe.setAttribute(
            'src',
            'mp-sdk://' + path + '/' + encodeURIComponent(value)
        );
        document.documentElement.appendChild(iframe);
        iframe.parentNode.removeChild(iframe);
    };

    this.sendViaBridgeV2 = (
        path: string,
        value: string,
        requiredWebviewBridgeName: string
    ): void => {
        if (!requiredWebviewBridgeName) {
            return;
        }

        const androidBridgeName =
            androidBridgeNameBase + '_' + requiredWebviewBridgeName + '_v2';
        const androidBridge = (window as Dictionary)[androidBridgeName];
        const iosBridgeName =
            iosBridgeNameBase + '_' + requiredWebviewBridgeName + '_v2';
        let iOSBridgeMessageHandler: Dictionary;
        let iOSBridgeNonMessageHandler: Dictionary;

        if (
            (window as Dictionary).webkit &&
            (window as Dictionary).webkit.messageHandlers &&
            (window as Dictionary).webkit.messageHandlers[iosBridgeName]
        ) {
            iOSBridgeMessageHandler =
                (window as Dictionary).webkit.messageHandlers[iosBridgeName];
        }

        if ((mpInstance as Dictionary).uiwebviewBridgeName === iosBridgeName) {
            iOSBridgeNonMessageHandler = (mpInstance as Dictionary)[iosBridgeName];
        }

        if (androidBridge && androidBridge.hasOwnProperty(path)) {
            mpInstance.Logger.verbose(
                Messages.InformationMessages.SendAndroid + path
            );
            androidBridge[path](value);
            return;
        } else if (iOSBridgeMessageHandler) {
            mpInstance.Logger.verbose(
                Messages.InformationMessages.SendIOS + path
            );

            iOSBridgeMessageHandler.postMessage(
                JSON.stringify({
                    path: path,
                    value: value ? JSON.parse(value) : null,
                })
            );
        } else if (iOSBridgeNonMessageHandler) {
            mpInstance.Logger.verbose(
                Messages.InformationMessages.SendIOS + path
            );
            this.sendViaIframeToIOS(path, value);
        }
    };
}
