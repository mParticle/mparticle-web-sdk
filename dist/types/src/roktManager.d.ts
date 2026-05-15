import { IKitConfigs } from "./configAPIClient";
import { UserAttributeFilters } from "./forwarders.interfaces";
import { IMParticleUser } from "./identity-user-interfaces";
import { Dictionary, AttributeValue } from "./utils";
import { SDKIdentityApi } from "./identity.interfaces";
import { SDKLoggerApi } from "./sdkRuntimeModels";
import { IStore, LocalSessionAttributes } from "./store";
import { IErrorReportingService, ILoggingService } from "./reporting/types";
export type RoktAttributeValueArray = Array<string | number | boolean>;
export type RoktAttributeValueType = string | number | boolean | undefined | null;
export type RoktAttributeValue = RoktAttributeValueType | RoktAttributeValueArray;
export type RoktAttributes = Record<string, RoktAttributeValue>;
export interface IRoktPartnerExtensionData<T> {
    [extensionName: string]: T;
}
export interface IRoktSelectPlacementsOptions {
    attributes: RoktAttributes;
    identifier?: string;
}
interface IRoktPlacement {
}
export interface IRoktSelection {
    close: () => void;
    getPlacements: () => Promise<IRoktPlacement[]>;
}
export interface IRoktLauncher {
    selectPlacements: (options: IRoktSelectPlacementsOptions) => Promise<IRoktSelection>;
    hashAttributes: (attributes: RoktAttributes) => Promise<Record<string, string>>;
    use: <T>(name: string) => Promise<T>;
}
export interface IRoktMessage {
    messageId: string;
    methodName: string;
    payload: any;
    resolve?: Function;
    reject?: Function;
}
export interface RoktKitFilterSettings {
    userAttributeFilters?: UserAttributeFilters;
    filterUserAttributes?: (userAttributes: Dictionary<string>, filterList: number[]) => Dictionary<string>;
    filteredUser?: IMParticleUser | null;
}
export interface IRoktKitSettings {
    accountId?: string;
    placementAttributesMapping?: string;
    hashedEmailUserIdentityType?: string;
}
export interface IRoktKit {
    filters: RoktKitFilterSettings;
    filteredUser: IMParticleUser | null;
    launcher: IRoktLauncher | null;
    userAttributes: Dictionary<string>;
    hashAttributes: (attributes: RoktAttributes) => Promise<RoktAttributes>;
    selectPlacements: (options: IRoktSelectPlacementsOptions) => Promise<IRoktSelection>;
    setExtensionData<T>(extensionData: IRoktPartnerExtensionData<T>): void;
    use: <T>(name: string) => Promise<T>;
    onShoppableAdsReady(callback: () => void): void;
    launcherOptions?: Dictionary<any>;
    settings?: IRoktKitSettings;
    integrationName?: string;
}
export interface IRoktOptions {
    sandbox?: boolean;
    launcherOptions?: IRoktLauncherOptions;
    domain?: string;
}
export type IRoktLauncherOptions = Dictionary<any>;
export default class RoktManager {
    kit: IRoktKit;
    filters: RoktKitFilterSettings;
    private currentUser;
    private messageQueue;
    private sandbox;
    private placementAttributesMapping;
    private identityService;
    private store;
    private launcherOptions?;
    private logger;
    private errorReporter;
    private loggingService;
    private domain?;
    private mappedEmailShaIdentityType?;
    private captureTiming?;
    private onReadyCallback;
    private initialized;
    private isShoppableAdsLoaded;
    /**
     * Sets a callback to be invoked when RoktManager becomes ready
     */
    setOnReadyCallback(callback: () => void): void;
    /**
     * Initializes the RoktManager with configuration settings and user data.
     *
     * @param {IKitConfigs} roktConfig - Configuration object containing user attribute filters and settings
     * @param {IMParticleUser} filteredUser - User object with filtered attributes
     * @param {SDKIdentityApi} identityService - The mParticle Identity instance
     * @param {SDKLoggerApi} logger - The mParticle Logger instance
     * @param {IRoktOptions} options - Options for the RoktManager
     * @param {Function} captureTiming - Function to capture performance timing marks
     * @param {IErrorReportingService} errorReporter - Dispatcher for error/warning reporting
     * @param {ILoggingService} loggingService - Dispatcher for informational logging
     *
     * @throws Logs error to console if placementAttributesMapping parsing fails
     */
    init(roktConfig: IKitConfigs, filteredUser: IMParticleUser, identityService: SDKIdentityApi, store: IStore, logger?: SDKLoggerApi, options?: IRoktOptions, captureTiming?: (metricsName: string) => void, errorReporter?: IErrorReportingService, loggingService?: ILoggingService): void;
    get isInitialized(): boolean;
    attachKit(kit: IRoktKit): void;
    /**
     * Renders ads based on the options provided
     *
     * @param {IRoktSelectPlacementsOptions} options - The options for selecting placements, including attributes and optional identifier
     * @returns {Promise<IRoktSelection>} A promise that resolves to the selection
     *
     * @example
     * // Correct usage with await
     * await window.mParticle.Rokt.selectPlacements({
     *   attributes: {
     *     email: 'user@example.com',
     *     customAttr: 'value'
     *   }
     * });
     */
    selectPlacements(options: IRoktSelectPlacementsOptions): Promise<IRoktSelection>;
    /**
     * Hashes attributes and returns both original and hashed versions
     * with Rokt-compatible key names (like emailsha256, mobilesha256)
     *
     *
     * @param {RoktAttributes} attributes - Attributes to hash
     * @returns {Promise<RoktAttributes>} Object with both original and hashed attributes
     *
     */
    hashAttributes(attributes: RoktAttributes): Promise<RoktAttributes>;
    setExtensionData<T>(extensionData: IRoktPartnerExtensionData<T>): void;
    use<T>(name: string): Promise<T>;
    onShoppableAdsReady(callback: () => void): void;
    flushOnShoppableAdsReadyMessageQueue(kit: IRoktKit): void;
    /**
     * Hashes an attribute using SHA-256
     *
     * @param {string | number | boolean | undefined | null} attribute - The value to hash
     * @returns {Promise<string | undefined | null>} SHA-256 hashed value or undefined/null
     *
     */
    hashSha256(attribute: RoktAttributeValueType): Promise<string | undefined | null>;
    getLocalSessionAttributes(): LocalSessionAttributes;
    setLocalSessionAttribute(key: string, value: AttributeValue): void;
    isReady(): boolean;
    private setUserAttributes;
    private mapPlacementAttributes;
    onIdentityComplete(): void;
    processMessageQueue(): void;
    private queueMessage;
    private deferredCall;
    /**
     * Hashes a string input using SHA-256 and returns the hex digest
     * Uses the Web Crypto API for secure hashing
     *
     * @param {string} input - The string to hash
     * @returns {Promise<string>} The SHA-256 hash as a hexadecimal string
     */
    private sha256Hex;
    /**
     * Converts an ArrayBuffer to a hexadecimal string representation
     * Each byte is converted to a 2-character hex string with leading zeros
     *
     * @param {ArrayBuffer} buffer - The buffer to convert
     * @returns {string} The hexadecimal string representation
     */
    private arrayBufferToHex;
    /**
     * Checks if an identity value has changed by comparing current and new values
     *
     * @param {string | undefined} currentValue - The current identity value
     * @param {string | undefined} newValue - The new identity value to compare against
     * @returns {boolean} True if the identity has changed (new value exists and differs from current), false otherwise
     */
    private hasIdentityChanged;
}
export {};
