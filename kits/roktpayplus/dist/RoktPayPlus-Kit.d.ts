import { KitInterface } from '../../../src/internal-types.ts';
import { SDKEvent } from '../../../src/internal-types.ts';

export declare function register(config: {
    kits?: Record<string, unknown>;
}): void;

export declare class RoktPayPlusKit implements KitInterface {
    name: string;
    id: number;
    isInitialized: boolean;
    private config;
    init(settings: Record<string, unknown>): string;
    process(event: SDKEvent): string;
    private handlePageView;
    private handleCustomEvent;
}

export declare interface RoktPayPlusKitSettings {
    progressionScreenNames?: string;
    approvedEventName?: string;
    pendingEventName?: string;
    loggedInEventName?: string;
    accountCreatedEventName?: string;
    offerSavedEventName?: string;
    purchaseCompletedEventName?: string;
    formSubmittedEventName?: string;
    pendingSuccessEventName?: string;
    closeEventName?: string;
    removeLoadingOverlayEventName?: string;
    conversionEventName?: string;
    gwpApprovedEventName?: string;
}

export { }
