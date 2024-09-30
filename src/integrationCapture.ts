import { SDKEventCustomFlags } from "./sdkRuntimeModels";
import { Dictionary } from "./utils";

const integrationIdMapping = {
    'ttclid': 'TikTok.ClickId',
    'fbclid': 'Facebook.ClickId',
    'fbp': 'FaceBook.BrowserId',
};

// TODO: Do we need to put this in the store?
export default class IntegrationCapture {
    public clickIds: Dictionary<string> = {};

    public captureQueryParams(): void {
        // TODO: Make this a utility with a fallback
        const urlParams = new URLSearchParams(window.location.search);

        Object.keys(integrationIdMapping).forEach((key) => {
            const value = urlParams.get(key);
            if (value) {
                this.clickIds[key] = value;
            }
        });

        console.log('captured params', this.clickIds);
    }

    public getClickIdsAsCustomFlags(): SDKEventCustomFlags {
        let customFlags: SDKEventCustomFlags = {};

        debugger;

        for(const [key, value] of Object.entries(this.clickIds)) {
            customFlags[integrationIdMapping[key]] = value;
        }

        console.log('returning custom flags', customFlags);

        return customFlags;
    }
}