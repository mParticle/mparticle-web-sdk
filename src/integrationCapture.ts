import { SDKEventCustomFlags } from './sdkRuntimeModels';
import {
    Dictionary,
    queryStringParser,
    getCookies,
    getHref,
    isEmpty,
} from './utils';

export interface IntegrationCaptureProcessorFunction {
    (clickId: string, url: string, timestamp?: number): string;
}

// Facebook Click ID has specific formatting rules
// The formatted ClickID value must be of the form version.subdomainIndex.creationTime.<fbclid>, where:
// - version is always this prefix: fb
// - subdomainIndex is which domain the cookie is defined on ('com' = 0, 'example.com' = 1, 'www.example.com' = 2)
// - creationTime is the UNIX time since epoch in milliseconds when the _fbc was stored. If you don't save the _fbc cookie, use the timestamp when you first observed or received this fbclid value
// - <fbclid> is the value for the fbclid query parameter in the page URL.
// https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc
export const facebookClickIdProcessor: IntegrationCaptureProcessorFunction = (
    clickId: string,
    url: string,
    timestamp?: number,
): string => {
    if (!clickId || !url) {
        return '';
    }

    const urlSegments = url?.split('//')
    if (!urlSegments) {
        return '';
    }

    const urlParts = urlSegments[1].split('/');
    const domainParts = urlParts[0].split('.');
    let subdomainIndex: number = 1;

    // The rules for subdomainIndex are for parsing the domain portion
    // of the URL for cookies, but in this case we are parsing the URL 
    // itself, so we can ignore the use of 0 for 'com'
    if (domainParts.length >= 3) {
        subdomainIndex = 2;
    }

    // If timestamp is not provided, use the current time
    const _timestamp = timestamp || Date.now();

    return `fb.${subdomainIndex}.${_timestamp}.${clickId}`;
};
interface IntegrationIdMapping {
    [key: string]: {
        mappedKey: string;
        processor?: IntegrationCaptureProcessorFunction;
    };
}

const integrationMapping: IntegrationIdMapping = {
    // Facebook / Meta
    fbclid: {
        mappedKey: 'Facebook.ClickId',
        processor: facebookClickIdProcessor,
    },
    _fbp: {
        mappedKey: 'Facebook.BrowserId',
    },
    _fbc: {
        mappedKey: 'Facebook.ClickId',
    },

    // Google
    gclid: {
        mappedKey: 'GoogleEnhancedConversions.Gclid',
    },
    gbraid: {
        mappedKey: 'GoogleEnhancedConversions.Gbraid',
    },
    wbraid: {
        mappedKey: 'GoogleEnhancedConversions.Wbraid',
    },

};

export default class IntegrationCapture {
    public clickIds: Dictionary<string>;
    public readonly initialTimestamp: number;

    constructor() {
        this.initialTimestamp = Date.now();
    }

    /**
     * Captures Integration Ids from cookies and query params and stores them in clickIds object
     */
    public capture(): void {
        const queryParams = this.captureQueryParams() || {};
        const cookies = this.captureCookies() || {};

        // Exclude _fbc if fbclid is present
        // https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc#retrieve-from-fbclid-url-query-parameter
        if (queryParams['fbclid'] && cookies['_fbc']) {
            delete cookies['_fbc'];
        }

        this.clickIds = { ...this.clickIds, ...queryParams, ...cookies };
    }

    /**
     * Captures cookies based on the integration ID mapping.
     */
    public captureCookies(): Dictionary<string> {
        const cookies = getCookies(Object.keys(integrationMapping));
        return this.applyProcessors(cookies);
    }

    /**
     * Captures query parameters based on the integration ID mapping.
     */
    public captureQueryParams(): Dictionary<string> {
        const queryParams = this.getQueryParams();
        return this.applyProcessors(queryParams, getHref(), this.initialTimestamp);
    }

    /**
     * Gets the query parameters based on the integration ID mapping.
     * @returns {Dictionary<string>} The query parameters.
     */
    public getQueryParams(): Dictionary<string> {
        return queryStringParser(getHref(), Object.keys(integrationMapping));
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
            const mappedKey = integrationMapping[key]?.mappedKey;
            if (!isEmpty(mappedKey)) {
                customFlags[mappedKey] = value;
            }
        }
        return customFlags;
    }

    private applyProcessors(clickIds: Dictionary<string>, url?: string, timestamp?: number): Dictionary<string> {
        const processedClickIds: Dictionary<string> = {};

        for (const [key, value] of Object.entries(clickIds)) {
            const processor = integrationMapping[key]?.processor;
            if (processor) {
                processedClickIds[key] = processor(value, url, timestamp);
            } else {
                processedClickIds[key] = value;
            }
        }

        return processedClickIds;
    }
}
