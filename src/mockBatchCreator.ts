// This file is used ONLY for the mParticle ESLint plugin. It should NOT be used otherwise!

import ServerModel from './serverModel';
import { SDKEvent, BaseEvent, MParticleWebSDK } from './sdkRuntimeModels';
import { convertEvents } from './sdkToEventsApiConverter';
import * as EventsApi from '@mparticle/event-models';

const mockFunction = function () {
    return null;
}
export default class _BatchValidator {
    private getMPInstance() {
        return {
            // Certain Helper, Store, and Identity properties need to be mocked to be used in the `returnBatch` method
            _Helpers: {
                sanitizeAttributes: window.mParticle.getInstance()._Helpers
                    .sanitizeAttributes,
                generateUniqueId: function() {
                    return 'mockId';
                },
                extend: window.mParticle.getInstance()._Helpers.extend,
                createServiceUrl: mockFunction,
                parseNumber: mockFunction,
                isObject: mockFunction,
                returnConvertedBoolean: mockFunction,
                Validators: null,
            },
            _resetForTests: mockFunction,
            _Store: {
                sessionId: 'mockSessionId',
                devToken: 'test_dev_token',
                isFirstRun: true,
                isEnabled: true,
                sessionAttributes: {},
                currentSessionMPIDs: [],
                consentState: null,
                clientId: null,
                deviceId: null,
                migrationData: {},
                serverSettings: {},
                dateLastEventSent: null,
                sessionStartDate: null,
                currentPosition: null,
                isTracking: false,
                watchPositionId: null,
                cartProducts: [],
                eventQueue: [],
                currencyCode: null,
                globalTimer: null,
                context: null,
                configurationLoaded: false,
                identityCallInFlight: false,
                migratingToIDSyncCookies: false,
                nonCurrentUserMPIDs: {},
                identifyCalled: false,
                isLoggedIn: false,
                cookieSyncDates: {},
                integrationAttributes: {},
                requireDelay: true,
                isLocalStorageAvailable: null,
                integrationDelayTimeoutStart: null,
                storageName: null,
                prodStorageName: null,
                activeForwarders: [],
                kits: {},
                configuredForwarders: [],
                pixelConfigurations: [],
                SDKConfig: {
                    isDevelopmentMode: true,
                    onCreateBatch: mockFunction,
                },
            },
            config: null,
            eCommerce: null,
            Identity: {
                getCurrentUser: mockFunction,
                IdentityAPI: {},
                identify: mockFunction,
                login: mockFunction,
                logout: mockFunction,
                modify: mockFunction,
            },
            Logger: {
                verbose: mockFunction,
                error: mockFunction,
                warning: mockFunction,
            },
            ProductActionType: null,
            ServerModel: null,
            addForwarder: mockFunction,
            generateHash: mockFunction,
            getAppVersion: mockFunction,
            getAppName: mockFunction,
            getInstance: mockFunction,
            init: mockFunction,
            logBaseEvent: mockFunction,
            logEvent: mockFunction,
            logLevel: 'none',
            setPosition: mockFunction,
            upload: mockFunction,
        };
    }

    returnBatch(event: BaseEvent) {
        const mpInstance = this.getMPInstance();
        const sdkEvent: SDKEvent = new ServerModel(
            mpInstance
        ).createEventObject(event);
        const batch: EventsApi.Batch | null = convertEvents(
            '0',
            [sdkEvent],
            mpInstance as any
        );
        return batch;
    }
}
