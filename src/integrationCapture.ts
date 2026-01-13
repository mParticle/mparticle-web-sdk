import { SDKEventCustomFlags } from './sdkRuntimeModels';
import Constants from './constants';
import { IntegrationAttributes } from './store';
import {
    Dictionary,
    queryStringParser,
    getCookies,
    getHref,
    isEmpty,
    valueof,
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

// Integration outputs are used to determine how click ids are used within the SDK
// CUSTOM_FLAGS are sent out when an Event is created via ServerModel.createEventObject
// PARTNER_IDENTITIES are sent out in a Batch when a group of events are converted to a Batch
// INTEGRATION_ATTRIBUTES are stored initially on the SDKEvent level but then is added to the Batch when the batch is created

const IntegrationOutputs = {
    CUSTOM_FLAGS: 'custom_flags',
    PARTNER_IDENTITIES: 'partner_identities',
    INTEGRATION_ATTRIBUTES: 'integration_attributes',
} as const;

interface IntegrationMappingItem {
    mappedKey: string;
    output: valueof<typeof IntegrationOutputs>;
    processor?: IntegrationCaptureProcessorFunction;
    moduleId?: number;
}

interface IntegrationIdMapping {
    [key: string]: IntegrationMappingItem;
}

const integrationMappingExternal: IntegrationIdMapping = {
    // Facebook / Meta
    fbclid: {
        mappedKey: 'Facebook.ClickId',
        processor: facebookClickIdProcessor,
        output: IntegrationOutputs.CUSTOM_FLAGS,
    },
    _fbp: {
        mappedKey: 'Facebook.BrowserId',
        output: IntegrationOutputs.CUSTOM_FLAGS,
    },
    _fbc: {
        mappedKey: 'Facebook.ClickId',
        output: IntegrationOutputs.CUSTOM_FLAGS,
    },

    // Google
    gclid: {
        mappedKey: 'GoogleEnhancedConversions.Gclid',
        output: IntegrationOutputs.CUSTOM_FLAGS,
    },
    gbraid: {
        mappedKey: 'GoogleEnhancedConversions.Gbraid',
        output: IntegrationOutputs.CUSTOM_FLAGS,
    },
    wbraid: {
        mappedKey: 'GoogleEnhancedConversions.Wbraid',
        output: IntegrationOutputs.CUSTOM_FLAGS,
    },

    // TIKTOK
    ttclid: {
        mappedKey: 'TikTok.Callback',
        output: IntegrationOutputs.CUSTOM_FLAGS,
    },
    _ttp: {
        mappedKey: 'tiktok_cookie_id',
        output: IntegrationOutputs.PARTNER_IDENTITIES,
    },

    // Snapchat
    // https://businesshelp.snapchat.com/s/article/troubleshooting-click-id?language=en_US
    ScCid: {
        mappedKey: 'SnapchatConversions.ClickId',
        output: IntegrationOutputs.CUSTOM_FLAGS,
    },

    // Pinterest
    // https://developers.pinterest.com/docs/track-conversions/track-conversions-in-the-api/
    // https://help.pinterest.com/en/business/article/pinterest-tag-parameters-and-cookies
    epik: {
        mappedKey: 'Pinterest.click_id',
        output: IntegrationOutputs.CUSTOM_FLAGS,
    },
    _epik: {
        mappedKey: 'Pinterest.click_id',
    // Snapchat
    // https://developers.snap.com/api/marketing-api/Conversions-API/UsingTheAPI#sending-click-id
    _scid: {
        mappedKey: 'SnapchatConversions.Cookie1',
        output: IntegrationOutputs.CUSTOM_FLAGS,
    },
};

const integrationMappingRokt: IntegrationIdMapping = {
    // Rokt
    // https://docs.rokt.com/developers/integration-guides/web/advanced/rokt-id-tag/
    // https://go.mparticle.com/work/SQDSDKS-7167
    rtid: {
        mappedKey: 'passbackconversiontrackingid',
        output: IntegrationOutputs.INTEGRATION_ATTRIBUTES,
        moduleId: 1277,
    },
    rclid: {
        mappedKey: 'passbackconversiontrackingid',
        output: IntegrationOutputs.INTEGRATION_ATTRIBUTES,
        moduleId: 1277,
    },
    RoktTransactionId: {
        mappedKey: 'passbackconversiontrackingid',
        output: IntegrationOutputs.INTEGRATION_ATTRIBUTES,
        moduleId: 1277,
    },
};

export default class IntegrationCapture {
    public clickIds: Dictionary<string>;
    public readonly initialTimestamp: number;
    public readonly filteredPartnerIdentityMappings: IntegrationIdMapping;
    public readonly filteredCustomFlagMappings: IntegrationIdMapping;
    public readonly filteredIntegrationAttributeMappings: IntegrationIdMapping;
    public captureMode?: valueof<typeof Constants.CaptureIntegrationSpecificIdsV2Modes>;

    constructor(captureMode: valueof<typeof Constants.CaptureIntegrationSpecificIdsV2Modes>) {
        this.initialTimestamp = Date.now();
        this.captureMode = captureMode;

        // Cache filtered mappings for faster access
        this.filteredPartnerIdentityMappings = this.filterMappings(IntegrationOutputs.PARTNER_IDENTITIES);
        this.filteredCustomFlagMappings = this.filterMappings(IntegrationOutputs.CUSTOM_FLAGS);
        this.filteredIntegrationAttributeMappings = this.filterMappings(IntegrationOutputs.INTEGRATION_ATTRIBUTES);
    }

    /**
     * Captures Integration Ids from cookies and query params and stores them in clickIds object
     */
    public capture(): void {
        const queryParams = this.captureQueryParams() || {};
        const cookies = this.captureCookies() || {};
        const localStorage = this.captureLocalStorage() || {};

        // Facebook Rules
        // Exclude _fbc if fbclid is present
        // https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc#retrieve-from-fbclid-url-query-parameter
        if (queryParams['fbclid'] && cookies['_fbc']) {
            delete cookies['_fbc'];
        }

        // ROKT Rules
        // If both rtid or rclid and RoktTransactionId are present, prioritize rtid/rclid
        // If RoktTransactionId is present in both cookies and localStorage,
        // prioritize localStorage
        const hasQueryParamId = queryParams['rtid'] || queryParams['rclid'];
        const hasLocalStorageId = localStorage['RoktTransactionId'];
        const hasCookieId = cookies['RoktTransactionId'];

        if (hasQueryParamId) {
            // Query param takes precedence, remove both localStorage and cookie if present
            if (hasLocalStorageId) {
                delete localStorage['RoktTransactionId'];
            }
            if (hasCookieId) {
                delete cookies['RoktTransactionId'];
            }
        } else if (hasLocalStorageId && hasCookieId) {
            // No query param, but both localStorage and cookie exist
            // localStorage takes precedence over cookie
            delete cookies['RoktTransactionId'];
        }

        this.clickIds = {
            ...this.clickIds,
            ...queryParams,
            ...localStorage,
            ...cookies
        };
    }

    /**
     * Captures cookies based on the integration ID mapping.
     */
    public captureCookies(): Dictionary<string> {
        const integrationKeys = this.getAllowedKeysForMode();
        const cookies = getCookies(integrationKeys);
        return this.applyProcessors(cookies, getHref(), this.initialTimestamp);
    }

    /**
     * Captures query parameters based on the integration ID mapping.
     */
    public captureQueryParams(): Dictionary<string> {
        const queryParams = this.getQueryParams();
        return this.applyProcessors(queryParams, getHref(), this.initialTimestamp);
    }

    /**
     * Captures local storage based on the integration ID mapping.
     */
    public captureLocalStorage(): Dictionary<string> {
        const integrationKeys = this.getAllowedKeysForMode();
        let localStorageItems: Dictionary<string> = {};
        for (const key of integrationKeys) {
            const localStorageItem = localStorage.getItem(key);
            if (localStorageItem) {
                localStorageItems[key] = localStorageItem;
            }
        }

        return this.applyProcessors(localStorageItems, getHref(), this.initialTimestamp);
    }

    /**
     * Gets the query parameters based on the integration ID mapping.
     * @returns {Dictionary<string>} The query parameters.
     */
    public getQueryParams(): Dictionary<string> {
        const integrationKeys = this.getAllowedKeysForMode();
        return queryStringParser(getHref(), integrationKeys);
    }

    /**
     * Converts captured click IDs to custom flags for SDK events.
     * @returns {SDKEventCustomFlags} The custom flags.
     */
    public getClickIdsAsCustomFlags(): SDKEventCustomFlags {
        return this.getClickIds(this.clickIds, this.filteredCustomFlagMappings);
    }

    /**
     * Returns only the `partner_identities` mapped integration output.
     * @returns {Dictionary<string>} The partner identities.
     */
    public getClickIdsAsPartnerIdentities(): Dictionary<string> {
        return this.getClickIds(this.clickIds, this.filteredPartnerIdentityMappings);
    }

    /**
     * Returns only the `integration_attributes` mapped integration output.
     * @returns {IntegrationAttributes} The integration attributes.
     */
    public getClickIdsAsIntegrationAttributes(): IntegrationAttributes {
        // Integration IDs are stored in the following format:
        // {
        //     "integration_attributes": {
        //         "<moduleId>": {
        //           "mappedKey": "clickIdValue"
        //         }
        //     }
        // }
        const mappedClickIds: IntegrationAttributes = {};

        for (const key in this.clickIds) {
            if (this.clickIds.hasOwnProperty(key)) {
                const value = this.clickIds[key];
                const mappingKey = this.filteredIntegrationAttributeMappings[key]?.mappedKey;
                if (!isEmpty(mappingKey)) {
                    const moduleId = this.filteredIntegrationAttributeMappings[key]?.moduleId;
                    if (moduleId && !mappedClickIds[moduleId]) {
                        mappedClickIds[moduleId] = { [mappingKey]: value };
                    }
                }
            }
        }
        return mappedClickIds;
    }
    

    private getClickIds(
        clickIds: Dictionary<string>,
        mappingList: IntegrationIdMapping
    ): Dictionary<string> {
        const mappedClickIds: Dictionary<string> = {};

        if (!clickIds) {
            return mappedClickIds;
        }

        for (const key in clickIds) {
            if (clickIds.hasOwnProperty(key)) {
                const value = clickIds[key];
                const mappedKey = mappingList[key]?.mappedKey;
                if (!isEmpty(mappedKey)) {
                    mappedClickIds[mappedKey] = value;
                }
            }
        }

        return mappedClickIds;
    }

    private applyProcessors(
        clickIds: Dictionary<string>,
        url?: string,
        timestamp?: number
    ): Dictionary<string> {
        const processedClickIds: Dictionary<string> = {};
        const integrationKeys = this.getActiveIntegrationMapping();
    
        for (const key in clickIds) {
            if (clickIds.hasOwnProperty(key)) {
                const value = clickIds[key];
                const processor = integrationKeys[key]?.processor;
                processedClickIds[key] = processor ? processor(value, url, timestamp) : value;
            }
        }
        return processedClickIds;
    }

    private filterMappings(
        outputType: valueof<typeof IntegrationOutputs>
    ): IntegrationIdMapping {
        const filteredMappings: IntegrationIdMapping = {};
        const integrationKeys = this.getActiveIntegrationMapping();
        for (const key in integrationKeys) {
            if (integrationKeys[key].output === outputType) {
                filteredMappings[key] = integrationKeys[key];
            }
        }
        return filteredMappings;
    }

    /**
     * Returns the allowed keys to capture based on the current mode.
     * For RoktOnly, limit capture to Rokt keys; for All, capture all mapped keys.
     */
    private getAllowedKeysForMode(): string[] {
        return Object.keys(this.getActiveIntegrationMapping());
    }
    
    /**
    * Selects the active integration mapping for the current captureMode.
    * - 'roktonly': only Rokt IDs are considered
    * - 'all': both External and Rokt IDs are considered
    * - else: returns an empty mapping and nothing will be captured
    */
    private getActiveIntegrationMapping(): IntegrationIdMapping {
        if (this.captureMode === Constants.CaptureIntegrationSpecificIdsV2Modes.RoktOnly) {
            return integrationMappingRokt;
        }
        if (this.captureMode === Constants.CaptureIntegrationSpecificIdsV2Modes.All) {
            return { ...integrationMappingExternal, ...integrationMappingRokt };
        }
        return {};
    }
}
