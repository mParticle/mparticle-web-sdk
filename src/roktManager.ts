import { IKitConfigs } from "./configAPIClient";
import { UserAttributeFilters  } from "./forwarders.interfaces";
import { IMParticleUser } from "./identity-user-interfaces";
import KitFilterHelper from "./kitFilterHelper";
import {
    Dictionary,
    parseSettingsString,
    generateUniqueId,
    isFunction,
    AttributeValue,
    isEmpty,
} from "./utils";
import { SDKIdentityApi } from "./identity.interfaces";
import { SDKLoggerApi } from "./sdkRuntimeModels";
import { IStore, LocalSessionAttributes } from "./store";
import { UserIdentities } from "@mparticle/web-sdk";
import { IdentityType } from "./types";

// https://docs.rokt.com/developers/integration-guides/web/library/attributes
export interface IRoktPartnerAttributes {
    [key: string]: string | number | boolean | undefined | null;
}

export interface IRoktPartnerExtensionData<T> {
    [extensionName: string]: T;
}

// https://docs.rokt.com/developers/integration-guides/web/library/select-placements-options
export interface IRoktSelectPlacementsOptions {
    attributes: IRoktPartnerAttributes;
    identifier?: string;
}

interface IRoktPlacement {}

export interface IRoktSelection {
    close: () => void;
    getPlacements: () => Promise<IRoktPlacement[]>;
}

export interface IRoktLauncher {
    selectPlacements: (options: IRoktSelectPlacementsOptions) => Promise<IRoktSelection>;
    hashAttributes: (attributes: IRoktPartnerAttributes) => Promise<Record<string, string>>;
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

export interface IRoktKit {
    filters: RoktKitFilterSettings;
    filteredUser: IMParticleUser | null;
    launcher: IRoktLauncher | null;
    userAttributes: Dictionary<string>;
    hashAttributes: (attributes: IRoktPartnerAttributes) => Promise<Record<string, string>>;
    selectPlacements: (options: IRoktSelectPlacementsOptions) => Promise<IRoktSelection>;
    setExtensionData<T>(extensionData: IRoktPartnerExtensionData<T>): void;
    use: <T>(name: string) => Promise<T>;
    launcherOptions?: Dictionary<any>;
}

export interface IRoktOptions {
    sandbox?: boolean;
    launcherOptions?: IRoktLauncherOptions;
    domain?: string;
}

export type IRoktLauncherOptions = Dictionary<any>;

// The purpose of this class is to create a link between the Core mParticle SDK and the
// Rokt Web SDK via a Web Kit.
// The Rokt Manager should load before the Web Kit and stubs out many of the
// Rokt Web SDK functions with an internal message queue in case a Rokt function
// is requested before the Rokt Web Kit or SDK is finished loaded.
// Once the Rokt Kit is attached to the Rokt Manager, we can consider the
// Rokt Manager in a "ready" state and it can begin sending data to the kit.
//
// https://github.com/mparticle-integrations/mparticle-javascript-integration-rokt
export default class RoktManager {
    public kit: IRoktKit = null;
    public filters: RoktKitFilterSettings = {};
    private currentUser: IMParticleUser | null = null;
    private messageQueue: Map<string, IRoktMessage> = new Map();
    private sandbox: boolean | null = null;
    private placementAttributesMapping: Dictionary<string>[] = [];
    private identityService: SDKIdentityApi;
    private store: IStore;
    private launcherOptions?: IRoktLauncherOptions;
    private logger: SDKLoggerApi;
    private domain?: string;
    private mappedEmailShaIdentityType?: string  | null;
    /**
     * Initializes the RoktManager with configuration settings and user data.
     * 
     * @param {IKitConfigs} roktConfig - Configuration object containing user attribute filters and settings
     * @param {IMParticleUser} filteredUser - User object with filtered attributes
     * @param {SDKIdentityApi} identityService - The mParticle Identity instance
     * @param {SDKLoggerApi} logger - The mParticle Logger instance
     * @param {IRoktOptions} options - Options for the RoktManager
     * 
     * @throws Logs error to console if placementAttributesMapping parsing fails
     */
    public init(
        roktConfig: IKitConfigs, 
        filteredUser: IMParticleUser, 
        identityService: SDKIdentityApi,
        store: IStore,
        logger?: SDKLoggerApi,
        options?: IRoktOptions
    ): void {
        const { userAttributeFilters, settings } = roktConfig || {};
        const { placementAttributesMapping, hashedEmailUserIdentityType } = settings || {};
        this.mappedEmailShaIdentityType = hashedEmailUserIdentityType?.toLowerCase() ?? null;

        this.identityService = identityService;
        this.store = store;
        this.logger = logger;

        this.filters = {
            userAttributeFilters,
            filterUserAttributes: KitFilterHelper.filterUserAttributes,
            filteredUser: filteredUser,
        };

        try {
            this.placementAttributesMapping = parseSettingsString(placementAttributesMapping);
        } catch (error) {
            this.logger.error('Error parsing placement attributes mapping from config: ' + error);
        }

        // This is the global setting for sandbox mode
        // It is set here and passed in to the createLauncher method in the Rokt Kit
        // This is not to be confused for the `sandbox` flag in the selectPlacements attributes
        // as that is independent of this setting, though they share the same name.
        const sandbox = options?.sandbox || false;

        // Launcher options are set here for the kit to pick up and pass through
        // to the Rokt Launcher.
        this.launcherOptions = { sandbox, ...options?.launcherOptions };

        if (options?.domain) {
            this.domain = options.domain;
        }
    }

    public attachKit(kit: IRoktKit): void {
        this.kit = kit;
        this.processMessageQueue();
    }

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
    public async selectPlacements(options: IRoktSelectPlacementsOptions): Promise<IRoktSelection> {
        if (!this.isReady()) {
            return this.deferredCall<IRoktSelection>('selectPlacements', options);
        }

        try {
            const { attributes } = options;
            const sandboxValue = attributes?.sandbox || null;
            const mappedAttributes = this.mapPlacementAttributes(attributes, this.placementAttributesMapping);

            // Get current user identities
            this.currentUser = this.identityService.getCurrentUser();
            const currentUserIdentities = this.currentUser?.getUserIdentities()?.userIdentities || {};

            const currentEmail = currentUserIdentities.email;
            const newEmail = mappedAttributes.email as string;

            let currentHashedEmail: string | undefined;
            let newHashedEmail: string | undefined;
            
            // Hashed email identity is valid if it is set to Other-Other10
            if(this.mappedEmailShaIdentityType && IdentityType.getIdentityType(this.mappedEmailShaIdentityType) !== false) {
                currentHashedEmail = currentUserIdentities[this.mappedEmailShaIdentityType];
                newHashedEmail = mappedAttributes['emailsha256'] as string || mappedAttributes[this.mappedEmailShaIdentityType] as string || undefined;
            }

            const emailChanged = this.hasIdentityChanged(currentEmail, newEmail);
            const hashedEmailChanged = this.hasIdentityChanged(currentHashedEmail, newHashedEmail);

            const newIdentities: UserIdentities = {};
            if (emailChanged) {
                newIdentities.email = newEmail;
                if (newEmail) {
                    this.logger.warning(`Email mismatch detected. Current email differs from email passed to selectPlacements call. Proceeding to call identify with email from selectPlacements call. Please verify your implementation.`);
                }
            }

            if (hashedEmailChanged) {
                newIdentities[this.mappedEmailShaIdentityType] = newHashedEmail;
                this.logger.warning(`emailsha256 mismatch detected. Current mParticle hashedEmail differs from hashedEmail passed to selectPlacements call. Proceeding to call identify with hashedEmail from selectPlacements call. Please verify your implementation.`);
            }

            if (!isEmpty(newIdentities)) {
                // Call identify with the new user identities
                try {
                    await new Promise<void>((resolve, reject) => {
                        this.identityService.identify({
                            userIdentities: {
                                ...currentUserIdentities,
                                ...newIdentities
                            }
                        }, () => {
                            resolve();
                        });
                    });
                } catch (error) {
                    this.logger.error('Failed to identify user with new email: ' + JSON.stringify(error));
                }
            }

            this.setUserAttributes(mappedAttributes);

            const enrichedAttributes = {
                ...mappedAttributes,
                ...(sandboxValue !== null ? { sandbox: sandboxValue } : {}),
            };

            const enrichedOptions = {
                ...options,
                attributes: enrichedAttributes,
            };

            return this.kit.selectPlacements(enrichedOptions);
        } catch (error) {
            return Promise.reject(error instanceof Error ? error : new Error('Unknown error occurred'));
        }
    }

    /**
     * Hashes attributes and returns both original and hashed versions
     * with Rokt-compatible key names (like emailsha256, mobilesha256)
     * 
     * 
     * @param {IRoktPartnerAttributes} attributes - Attributes to hash
     * @returns {Promise<IRoktPartnerAttributes>} Object with both original and hashed attributes
     * 
     */
    public async hashAttributes(attributes: IRoktPartnerAttributes): Promise<IRoktPartnerAttributes> {
        try {
            if (!attributes || typeof attributes !== 'object') {
                return {};
            }
            
            // Get own property keys only
            const keys = Object.keys(attributes);
            
            if (keys.length === 0) {
                return {};
            }
            
            // Hash all attributes in parallel
            const hashPromises = keys.map(async (key) => {
                const attributeValue = attributes[key];
                const hashedValue = await this.hashSha256(attributeValue);
                return { key, attributeValue, hashedValue };
            });
            
            const results = await Promise.all(hashPromises);
            
            // Build the result object
            const hashedAttributes: IRoktPartnerAttributes = {};
            for (const { key, attributeValue, hashedValue } of results) {
                hashedAttributes[key] = attributeValue;
                if (hashedValue) {
                    hashedAttributes[`${key}sha256`] = hashedValue;
                }
            }
            return hashedAttributes;
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to hashAttributes, returning an empty object: ${errorMessage}`);
            return {};
        }
    }

    public setExtensionData<T>(extensionData: IRoktPartnerExtensionData<T>): void {
        if (!this.isReady()) {
            this.deferredCall<void>('setExtensionData', extensionData);
            return;
        }

        try {
            this.kit.setExtensionData<T>(extensionData);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error('Error setting extension data: ' + errorMessage);
        }
    }

    public use<T>(name: string): Promise<T> {
        if (!this.isReady()) {
            return this.deferredCall<T>('use', name);
        }

        try {
            return this.kit.use<T>(name);
        } catch (error) {
            return Promise.reject(error instanceof Error ? error : new Error('Error using extension: ' + name));
        }
    }

    /**
     * Hashes an attribute using SHA-256
     * 
     * @param {string | number | boolean | undefined | null} attribute - The value to hash
     * @returns {Promise<string | undefined | null>} SHA-256 hashed value or undefined/null
     * 
     */
    public async hashSha256(attribute: string | number | boolean | undefined | null): Promise<string | undefined | null> {
        if (attribute === null || attribute === undefined) {
            this.logger.warning(`hashSha256 received null/undefined as input`);
            return attribute as null | undefined;
        }
        
        try {
            const normalizedValue = String(attribute).trim().toLocaleLowerCase();
            return await this.sha256Hex(normalizedValue);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to hashSha256, returning undefined: ${errorMessage}`);
            return undefined;
        }
    }

    public getLocalSessionAttributes(): LocalSessionAttributes {
        return this.store.getLocalSessionAttributes();
    }

    public setLocalSessionAttribute(key: string, value: AttributeValue): void {
        this.store.setLocalSessionAttribute(key, value);
    }

    private isReady(): boolean {
        // The Rokt Manager is ready when a kit is attached and has a launcher
        return Boolean(this.kit && this.kit.launcher);
    }

    private setUserAttributes(attributes: IRoktPartnerAttributes): void {
        const reservedAttributes = ['sandbox'];
        const filteredAttributes = {};
        
        for (const key in attributes) {
            if (attributes.hasOwnProperty(key) && reservedAttributes.indexOf(key) === -1) {
                filteredAttributes[key] = attributes[key];
            }
        }

        try {
            this.currentUser.setUserAttributes(filteredAttributes);
        } catch (error) {
            this.logger.error('Error setting user attributes: ' + error);
        }
    }

    private mapPlacementAttributes(attributes: IRoktPartnerAttributes, placementAttributesMapping: Dictionary<string>[]): IRoktPartnerAttributes {
        const mappingLookup: { [key: string]: string } = {};
        for (const mapping of placementAttributesMapping) {
            mappingLookup[mapping.map] = mapping.value;
        }
    
        const mappedAttributes: IRoktPartnerAttributes = {};
        for (const key in attributes) {
            if (attributes.hasOwnProperty(key)) {
                const newKey = mappingLookup[key] || key;
                mappedAttributes[newKey] = attributes[key];
            }
        }
        return mappedAttributes;
    }

    private processMessageQueue(): void {
        if (!this.isReady() || this.messageQueue.size === 0) {
            return;
        }

        this.logger?.verbose(`RoktManager: Processing ${this.messageQueue.size} queued messages`);

        this.messageQueue.forEach((message) => {
            if(!(message.methodName in this) || !isFunction(this[message.methodName])) {
                this.logger?.error(`RoktManager: Method ${message.methodName} not found`);

                return;
            }

            this.logger?.verbose(`RoktManager: Processing queued message: ${message.methodName} with payload: ${JSON.stringify(message.payload)}`);

            try {
                const result = (this[message.methodName] as Function)(message.payload);
                this.completePendingPromise(message.messageId, result);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger?.error(`RoktManager: Error processing message '${message.methodName}': ${errorMessage}`);
                this.completePendingPromise(message.messageId, Promise.reject(error));
            }
        });

        // Clear the queue after processing all messages
        this.messageQueue.clear();
    }

    private queueMessage(message: IRoktMessage): void {
        this.messageQueue.set(message.messageId, message);
    }

    private deferredCall<T>(methodName: string, payload: any): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const messageId = `${methodName}_${generateUniqueId()}`;
            
            this.queueMessage({
                messageId,
                methodName,
                payload,
                resolve,
                reject,
            });
        });
    }

    private completePendingPromise(messageId: string | undefined, resultOrError: any): void {
        if (!messageId || !this.messageQueue.has(messageId)) {
            return;
        }

        const message = this.messageQueue.get(messageId)!;
        
        if (message.resolve) {
            Promise.resolve(resultOrError)
                .then((result) => message.resolve!(result))
                .catch((error) => message.reject!(error));
        }
        
        this.messageQueue.delete(messageId);
    }

    /**
     * Hashes a string input using SHA-256 and returns the hex digest
     * Uses the Web Crypto API for secure hashing
     * 
     * @param {string} input - The string to hash
     * @returns {Promise<string>} The SHA-256 hash as a hexadecimal string
     */
    private async sha256Hex(input: string): Promise<string> {
        const encoder = new TextEncoder();
        const encodedInput = encoder.encode(input);
        const digest = await crypto.subtle.digest('SHA-256', encodedInput);
        return this.arrayBufferToHex(digest);
    }

    /**
     * Converts an ArrayBuffer to a hexadecimal string representation
     * Each byte is converted to a 2-character hex string with leading zeros
     * 
     * @param {ArrayBuffer} buffer - The buffer to convert
     * @returns {string} The hexadecimal string representation
     */
    private arrayBufferToHex(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let hexString = '';
        for (let i = 0; i < bytes.length; i++) {
            const hexByte = bytes[i].toString(16).padStart(2, '0');
            hexString += hexByte;
        }
        return hexString;
    }

    /**
     * Checks if an identity value has changed by comparing current and new values
     * 
     * @param {string | undefined} currentValue - The current identity value
     * @param {string | undefined} newValue - The new identity value to compare against
     * @returns {boolean} True if the identity has changed (new value exists and differs from current), false otherwise
     */
    private hasIdentityChanged(currentValue: string | undefined, newValue: string | undefined): boolean {
        if (!newValue) {
            return false;
        }
        
        if (!currentValue) {
            return true; // New value exists but no current value
        }
        
        if (currentValue !== newValue) {
            return true; // Values are different
        }
        
        return false; // Values are the same
    }
}
