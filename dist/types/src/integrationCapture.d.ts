import { SDKEventCustomFlags } from './sdkRuntimeModels';
import Constants from './constants';
import { IntegrationAttributes } from './store';
import { Dictionary, valueof } from './utils';
export interface IntegrationCaptureProcessorFunction {
    (clickId: string, url: string, timestamp?: number): string;
}
export declare const facebookClickIdProcessor: IntegrationCaptureProcessorFunction;
declare const IntegrationOutputs: {
    readonly CUSTOM_FLAGS: "custom_flags";
    readonly PARTNER_IDENTITIES: "partner_identities";
    readonly INTEGRATION_ATTRIBUTES: "integration_attributes";
};
interface IntegrationMappingItem {
    mappedKey: string;
    output: valueof<typeof IntegrationOutputs>;
    processor?: IntegrationCaptureProcessorFunction;
    moduleId?: number;
}
interface IntegrationIdMapping {
    [key: string]: IntegrationMappingItem;
}
export default class IntegrationCapture {
    clickIds: Dictionary<string>;
    readonly initialTimestamp: number;
    readonly filteredPartnerIdentityMappings: IntegrationIdMapping;
    readonly filteredCustomFlagMappings: IntegrationIdMapping;
    readonly filteredIntegrationAttributeMappings: IntegrationIdMapping;
    captureMode?: valueof<typeof Constants.CaptureIntegrationSpecificIdsV2Modes>;
    constructor(captureMode: valueof<typeof Constants.CaptureIntegrationSpecificIdsV2Modes>);
    /**
     * Captures Integration Ids from cookies and query params and stores them in clickIds object
     */
    capture(): void;
    /**
     * Captures cookies based on the integration ID mapping.
     */
    captureCookies(): Dictionary<string>;
    /**
     * Captures query parameters based on the integration ID mapping.
     */
    captureQueryParams(): Dictionary<string>;
    /**
     * Captures local storage based on the integration ID mapping.
     */
    captureLocalStorage(): Dictionary<string>;
    /**
     * Gets the query parameters based on the integration ID mapping.
     * @returns {Dictionary<string>} The query parameters.
     */
    getQueryParams(): Dictionary<string>;
    /**
     * Converts captured click IDs to custom flags for SDK events.
     * @returns {SDKEventCustomFlags} The custom flags.
     */
    getClickIdsAsCustomFlags(): SDKEventCustomFlags;
    /**
     * Returns only the `partner_identities` mapped integration output.
     * @returns {Dictionary<string>} The partner identities.
     */
    getClickIdsAsPartnerIdentities(): Dictionary<string>;
    /**
     * Returns only the `integration_attributes` mapped integration output.
     * @returns {IntegrationAttributes} The integration attributes.
     */
    getClickIdsAsIntegrationAttributes(): IntegrationAttributes;
    private getClickIds;
    private applyProcessors;
    private filterMappings;
    /**
     * Returns the allowed keys to capture based on the current mode.
     * For RoktOnly, limit capture to Rokt keys; for All, capture all mapped keys.
     */
    private getAllowedKeysForMode;
    /**
    * Selects the active integration mapping for the current captureMode.
    * - 'roktonly': only Rokt IDs are considered
    * - 'all': both External and Rokt IDs are considered
    * - else: returns an empty mapping and nothing will be captured
    */
    private getActiveIntegrationMapping;
}
export {};
