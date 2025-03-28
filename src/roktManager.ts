import { IKitConfigs } from "./configAPIClient";
import { UserAttributeFilters  } from "./forwarders.interfaces";
import { IMParticleUser } from "./identity-user-interfaces";
import KitFilterHelper from "./kitFilterHelper";
import { SDKInitConfig } from "./sdkRuntimeModels";
import { Dictionary } from "./utils";

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
}

export interface IRoktKit  {
    filters: RoktKitFilterSettings;
    filteredUser: IMParticleUser | null;
    userAttributes: Dictionary<string>;
    selectPlacements: (options: IRoktSelectPlacementsOptions) => Promise<IRoktSelection>;
}

export default class RoktManager {
    public config: SDKInitConfig | null = null;
    public kit: IRoktKit = null;
    public filters: RoktKitFilterSettings = {};

    private filteredUser: IMParticleUser | null = null;
    private messageQueue: IRoktMessage[] = [];

    constructor() {
        this.kit = null;
        this.filters = {};
        this.filteredUser = null;
    }

    public init(config: SDKInitConfig, filteredUser?: IMParticleUser): void {
        const roktConfig = this.parseConfig(config);
        const { userAttributeFilters } = roktConfig || {};

        this.filters = {
            userAttributeFilters,
            filterUserAttributes: KitFilterHelper.filterUserAttributes,
        };

        this.filteredUser = filteredUser;
    }

    public parseConfig(config: SDKInitConfig): IKitConfigs | null {
        return config.kitConfigs?.find((kitConfig: IKitConfigs) => 
            kitConfig.name === 'Rokt' && 
            kitConfig.moduleId === 181
        ) || null;
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
            return this.kit.selectPlacements(options);
        } catch (error) {
            return Promise.reject(error instanceof Error ? error : new Error('Unknown error occurred'));
        }
    }

    private isReady(): boolean {
        return Boolean(this.kit);
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
