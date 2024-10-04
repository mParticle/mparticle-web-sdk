import { SDKEventCustomFlags } from './sdkRuntimeModels';
import { Dictionary, queryStringParser, getCookies, getHref } from './utils';

const integrationIdMapping: Dictionary<string> = {
    fbclid: 'Facebook.ClickId',
    _fbp: 'Facebook.BrowserId',
};

export default class IntegrationCapture {
    public clickIds: Dictionary<string>;

    /**
     * Captures Integration Ids from cookies and query params and stores them in clickIds object
     */
    public capture(): void {
        this.captureCookies();
        this.captureQueryParams();
    }

    /**
     * Captures cookies based on the integration ID mapping.
     */
    public captureCookies(): void {
        const cookies = getCookies(Object.keys(integrationIdMapping));
        this.clickIds = { ...this.clickIds, ...cookies };
    }

    /**
     * Captures query parameters based on the integration ID mapping.
     */
    public captureQueryParams(): void {
        const parsedQueryParams = this.getQueryParams();
        this.clickIds = { ...this.clickIds, ...parsedQueryParams };
    }

    /**
     * Gets the query parameters based on the integration ID mapping.
     * @returns {Dictionary<string>} The query parameters.
     */
    public getQueryParams(): Dictionary<string> {
        return queryStringParser(getHref(), Object.keys(integrationIdMapping));
    }

    /**
     * Converts captured click IDs to custom flags for SDK events.
     * @returns {SDKEventCustomFlags} The custom flags.
     */
    public getClickIdsAsCustomFlags(): SDKEventCustomFlags {
        const customFlags: SDKEventCustomFlags = {};

        if (!this.clickIds) {
            return customFlags;
        }

        for (const [key, value] of Object.entries(this.clickIds)) {
            const mappedKey = integrationIdMapping[key];
            if (mappedKey) {
                customFlags[mappedKey] = value;
            }
        }
        return customFlags;
    }
}
