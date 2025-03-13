// https://docs.rokt.com/developers/integration-guides/web/library/attributes
export interface IRoktPartnerAttributes {
    [key: string]: string | number | boolean | undefined | null;
}

// https://docs.rokt.com/developers/integration-guides/web/library/select-placements-options
export interface ISelectPlacementsOptions {
    attributes: IRoktPartnerAttributes;
    identifier?: string;
}

export interface ISelection {
    placementId?: string;
    status?: string;
    error?: string;
}

export interface IRoktLauncher {
    selectPlacements: (options: ISelectPlacementsOptions) => Promise<ISelection>;
}

export interface IRoktMessage {
    methodName: string;
    payload: any;
}

export default class RoktManager {
    private launcher: IRoktLauncher | null = null;
    private messageQueue: IRoktMessage[] = [];

    constructor() {
        this.launcher = null;
    }

    public attachLauncher(launcher: IRoktLauncher): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!launcher) {
                this.queueMessage({
                    methodName: 'attachLauncher',
                    payload: launcher,
                });
            } else {
                this.setLauncher(launcher);
                this.processMessageQueue();
            }
            resolve();
        });
    }

    public selectPlacements(options: ISelectPlacementsOptions): Promise<ISelection> {
        if (!this.launcher) {
            this.queueMessage({
                methodName: 'selectPlacements',
                payload: options,
            });
            return Promise.resolve({});
        }

        try {
            return this.launcher.selectPlacements(options);
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
