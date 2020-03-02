import Constants from './constants';

var Messages = Constants.Messages;

var androidBridgeNameBase = 'mParticleAndroid';
var iosBridgeNameBase = 'mParticle';

export default function NativeSdkHelpers(mpInstance) {
    var self = this;
    this.isBridgeV2Available = function(bridgeName) {
        if (!bridgeName) {
            return false;
        }
        var androidBridgeName =
            androidBridgeNameBase + '_' + bridgeName + '_v2';
        var iosBridgeName = iosBridgeNameBase + '_' + bridgeName + '_v2';

        // iOS v2 bridge
        if (
            window.webkit &&
            window.webkit.messageHandlers &&
            window.webkit.messageHandlers.hasOwnProperty(iosBridgeName)
        ) {
            return true;
        }
        // other iOS v2 bridge
        // TODO: what to do about people setting things on mParticle itself?
        if (
            window.mParticle &&
            window.mParticle.uiwebviewBridgeName &&
            window.mParticle.uiwebviewBridgeName === iosBridgeName
        ) {
            return true;
        }
        // android
        if (window.hasOwnProperty(androidBridgeName)) {
            return true;
        }
        return false;
    };

    this.isWebviewEnabled = function(
        requiredWebviewBridgeName,
        minWebviewBridgeVersion
    ) {
        mpInstance._Store.bridgeV2Available = self.isBridgeV2Available(
            requiredWebviewBridgeName
        );
        mpInstance._Store.bridgeV1Available = self.isBridgeV1Available();

        if (minWebviewBridgeVersion === 2) {
            return mpInstance._Store.bridgeV2Available;
        }

        // iOS BridgeV1 can be available via mParticle.isIOS, but return false if uiwebviewBridgeName doesn't match requiredWebviewBridgeName
        if (window.mParticle) {
            if (
                window.mParticle.uiwebviewBridgeName &&
                window.mParticle.uiwebviewBridgeName !==
                    iosBridgeNameBase + '_' + requiredWebviewBridgeName + '_v2'
            ) {
                return false;
            }
        }

        if (minWebviewBridgeVersion < 2) {
            // ios
            return (
                mpInstance._Store.bridgeV2Available ||
                mpInstance._Store.bridgeV1Available
            );
        }

        return false;
    };

    this.isBridgeV1Available = function() {
        if (
            mpInstance._Store.SDKConfig.useNativeSdk ||
            window.mParticleAndroid ||
            mpInstance._Store.SDKConfig.isIOS
        ) {
            return true;
        }

        return false;
    };

    this.sendToNative = function(path, value) {
        if (
            mpInstance._Store.bridgeV2Available &&
            mpInstance._Store.SDKConfig.minWebviewBridgeVersion === 2
        ) {
            self.sendViaBridgeV2(
                path,
                value,
                mpInstance._Store.SDKConfig.requiredWebviewBridgeName
            );
            return;
        }
        if (
            mpInstance._Store.bridgeV2Available &&
            mpInstance._Store.SDKConfig.minWebviewBridgeVersion < 2
        ) {
            self.sendViaBridgeV2(
                path,
                value,
                mpInstance._Store.SDKConfig.requiredWebviewBridgeName
            );
            return;
        }
        if (
            mpInstance._Store.bridgeV1Available &&
            mpInstance._Store.SDKConfig.minWebviewBridgeVersion < 2
        ) {
            self.sendViaBridgeV1(path, value);
            return;
        }
    };

    this.sendViaBridgeV1 = function(path, value) {
        if (
            window.mParticleAndroid &&
            window.mParticleAndroid.hasOwnProperty(path)
        ) {
            mpInstance.Logger.verbose(
                Messages.InformationMessages.SendAndroid + path
            );
            window.mParticleAndroid[path](value);
        } else if (mpInstance._Store.SDKConfig.isIOS) {
            mpInstance.Logger.verbose(
                Messages.InformationMessages.SendIOS + path
            );
            self.sendViaIframeToIOS(path, value);
        }
    };

    this.sendViaIframeToIOS = function(path, value) {
        var iframe = document.createElement('IFRAME');
        iframe.setAttribute(
            'src',
            'mp-sdk://' + path + '/' + encodeURIComponent(value)
        );
        document.documentElement.appendChild(iframe);
        iframe.parentNode.removeChild(iframe);
    };

    this.sendViaBridgeV2 = function(path, value, requiredWebviewBridgeName) {
        if (!requiredWebviewBridgeName) {
            return;
        }

        var androidBridgeName =
                androidBridgeNameBase + '_' + requiredWebviewBridgeName + '_v2',
            androidBridge = window[androidBridgeName],
            iosBridgeName =
                iosBridgeNameBase + '_' + requiredWebviewBridgeName + '_v2',
            iOSBridgeMessageHandler,
            iOSBridgeNonMessageHandler;

        if (
            window.webkit &&
            window.webkit.messageHandlers &&
            window.webkit.messageHandlers[iosBridgeName]
        ) {
            iOSBridgeMessageHandler =
                window.webkit.messageHandlers[iosBridgeName];
        }

        if (mpInstance.uiwebviewBridgeName === iosBridgeName) {
            iOSBridgeNonMessageHandler = mpInstance[iosBridgeName];
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
            self.sendViaIframeToIOS(path, value);
        }
    };
}
