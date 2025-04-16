import { IKitConfigs } from "./configAPIClient";
import { UserAttributeFilters  } from "./forwarders.interfaces";
import { IMParticleUser } from "./identity-user-interfaces";
import KitFilterHelper from "./kitFilterHelper";
import { Dictionary, parseSettingsString } from "./utils";

// https://docs.rokt.com/developers/integration-guides/web/library/attributes
export interface IRoktPartnerAttributes {
    [key: string]: string | number | boolean | undefined | null;
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
}

export interface IRoktMessage {
    methodName: string;
    payload: any;
}

export interface RoktKitFilterSettings {
    userAttributeFilters?: UserAttributeFilters;
    filterUserAttributes?: (userAttributes: Dictionary<string>, filterList: number[]) => Dictionary<string>;
    filteredUser?: IMParticleUser | null;
}

export interface IRoktKit  {
    filters: RoktKitFilterSettings;
    filteredUser: IMParticleUser | null;
    launcher: IRoktLauncher | null;
    userAttributes: Dictionary<string>;
    selectPlacements: (options: IRoktSelectPlacementsOptions) => Promise<IRoktSelection>;
}

export interface IRoktManagerOptions {
    sandbox?: boolean;
}

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
    private filteredUser: IMParticleUser | null = null;
    private messageQueue: IRoktMessage[] = [];
    private sandbox: boolean | null = null;
    private userAttributeMapping: Dictionary<string>[] = [];

    /**
     * Initializes the RoktManager with configuration settings and user data.
     * 
     * @param {IKitConfigs} roktConfig - Configuration object containing user attribute filters and settings
     * @param {IMParticleUser} filteredUser - User object with filtered attributes
     * @param {IMParticleUser} currentUser - Current mParticle user object
     * @param {IRoktManagerOptions} options - Options for the RoktManager
     * 
     * @throws Logs error to console if userAttributeMapping parsing fails
     */
    public init(roktConfig: IKitConfigs, filteredUser: IMParticleUser, currentUser: IMParticleUser, options?: IRoktManagerOptions): void {
        const { userAttributeFilters, settings } = roktConfig || {};
        const { userAttributeMapping } = settings || {};

        try {
            this.userAttributeMapping = parseSettingsString(userAttributeMapping);
        } catch (error) {
            console.error('Error parsing user attribute mapping from config', error);
        }

        this.currentUser = currentUser;

        this.filters = {
            userAttributeFilters,
            filterUserAttributes: KitFilterHelper.filterUserAttributes,
            filteredUser: filteredUser,
        };

        this.sandbox = options?.sandbox;
    }

    public attachKit(kit: IRoktKit): void {
        this.kit = kit;
        this.processMessageQueue();
    }

    public selectPlacements(options: IRoktSelectPlacementsOptions): Promise<IRoktSelection> {
        if (!this.isReady()) {
            this.queueMessage({
                methodName: 'selectPlacements',
                payload: options,
            });
            return Promise.resolve({} as IRoktSelection);
        }

        try {
            const { attributes } = options;
            const sandboxValue = attributes?.sandbox ?? this.sandbox;
            const mappedAttributes = this.mapUserAttributes(attributes, this.userAttributeMapping);

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
            console.error('Error setting user attributes', error);
        }
    }

    private mapUserAttributes(attributes: IRoktPartnerAttributes, userAttributeMapping: Dictionary<string>[]): IRoktPartnerAttributes {
        const mappingLookup: { [key: string]: string } = {};
        for (const mapping of userAttributeMapping) {
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
        if (this.messageQueue.length > 0 && this.isReady()) {
            this.messageQueue.forEach(async (message) => {
                if (this.kit && message.methodName in this.kit) {
                    await (this.kit[message.methodName] as Function)(message.payload);
                }
            });
            this.messageQueue = [];
        }
    }

    private queueMessage(message: IRoktMessage): void {
        this.messageQueue.push(message);
    }
}
