import { SDKEventCustomFlags } from './sdkRuntimeModels';
import { Dictionary, queryStringParser, getCookies, getHref } from './utils';


export const facebookClickIdProcessor = (clickId: string): string => {
    if (!clickId) {
        return '';
    }

    const clickIdParts = clickId.split('.');
    if (clickIdParts.length === 4) {
        return clickIdParts[3];
    };

    return clickId;
};
interface ProcessorFunction {
    (clickId: string): string;
}
interface IntegrationIdMapping {
    [key: string]: {
        mappingValue: string;
        processor?: ProcessorFunction;
    };
}

const integrationMapping: IntegrationIdMapping = {
    fbclid: {
        mappingValue: 'Facebook.ClickId',
        processor: facebookClickIdProcessor,
    },
    _fbp: {
        mappingValue: 'Facebook.BrowserId',
    },
    _fbc: {
        mappingValue: 'Facebook.ClickId',
        processor: facebookClickIdProcessor,
    },
};

export default class IntegrationCapture {
    public clickIds: Dictionary<string>;

    /**
     * Captures Integration Ids from cookies and query params and stores them in clickIds object
     */
    public capture(): void {
        const queryParams = this.captureQueryParams() || {};
        const cookies = this.captureCookies() || {};

        if (queryParams['fbclid'] && cookies['_fbc']) {
            // Exclude fbclid if _fbc is present
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
        return this.applyProcessors(queryParams);
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
            const mappedKey = integrationMapping[key]?.mappingValue;
            if (mappedKey) {
                customFlags[mappedKey] = value;
            }
        }
        return customFlags;
    }

    private applyProcessors(clickIds: Dictionary<string>): Dictionary<string> {
        const processedClickIds: Dictionary<string> = {};

        for (const [key, value] of Object.entries(clickIds)) {
            const processor = integrationMapping[key]?.processor;
            if (processor) {
                processedClickIds[key] = processor(value);
            } else {
                processedClickIds[key] = value;
            }
        }

        return processedClickIds;
    };
}
