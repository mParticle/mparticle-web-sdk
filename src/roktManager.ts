import {SDKInitConfig} from "./sdkRuntimeModels";

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


export default class RoktManager {
    public launcher: IRoktLauncher | null = null;
    private messageQueue: IRoktMessage[] = [];
    public config: SDKInitConfig | null = null;

    constructor() {
        this.launcher = null;
    }

    public init(config: SDKInitConfig): void {
        this.config = config;
    }

    public attachLauncher(launcher: IRoktLauncher): void {
        this.setLauncher(launcher);
        this.processMessageQueue();
    }

    public selectPlacements(options: IRoktSelectPlacementsOptions): Promise<IRoktSelection> {
        if (!this.launcher) {
            this.queueMessage({
                methodName: 'selectPlacements',
                payload: options,
            });
            return Promise.resolve({} as IRoktSelection);
        }

        try {
            const enhancedOptions = {
                ...options,
                attributes: {
                    ...options.attributes,
                    sandbox: this.config.isDevelopmentMode
                }
            };
            return this.launcher.selectPlacements(enhancedOptions);
        } catch (error) {
            return Promise.reject(error instanceof Error ? error : new Error('Unknown error occurred'));
        }
    }

    private processMessageQueue(): void {
        if (this.messageQueue.length > 0) {
            this.messageQueue.forEach(async (message) => {
                if (this.launcher && message.methodName in this.launcher) {
                    await (this.launcher[message.methodName] as Function)(message.payload);
                }
            });
            this.messageQueue = [];
        }
    }


    private queueMessage(message: IRoktMessage): void {
        this.messageQueue.push(message);
    }

    private setLauncher(launcher: IRoktLauncher): void {
        this.launcher = launcher;
    }
}
