// This file is used ONLY for the mParticle ESLint plugin. It should NOT be used otherwise!

import ServerModel from './serverModel';
import { SDKEvent, BaseEvent, MParticleWebSDK } from './sdkRuntimeModels';
import { convertEvents } from './sdkToEventsApiConverter';
import * as EventsApi from '@mparticle/event-models';
import { Batch } from '@mparticle/event-models';
import { IMPSideloadedKit } from './sideloadedKit';
import { IMParticleWebSDKInstance } from './mp-instance';

const mockFunction = function() {
    return null;
};
export default class _BatchValidator {
    private getMPInstance() {
        return ({
            // Certain Helper, Store, and Identity properties need to be mocked to be used in the `returnBatch` method
            _Helpers: {
                sanitizeAttributes: (window.mParticle.getInstance() as unknown as IMParticleWebSDKInstance)._Helpers
                    .sanitizeAttributes,
                generateHash: function() {
                    return 'mockHash';
                },
                generateUniqueId: function() {
                    return 'mockId';
                },
                extend: (window.mParticle.getInstance() as unknown as IMParticleWebSDKInstance)._Helpers.extend,
                createServiceUrl: mockFunction,
                parseNumber: mockFunction,
                isObject: mockFunction,
                Validators: null,
            },
            _resetForTests: mockFunction,
            _APIClient: null,
            MPSideloadedKit: null,
            _Consent: null,
            _Events: null,
            _Forwarders: null,
            _NativeSdkHelpers: null,
            _Persistence: null,
            _preInit: null,
            Consent: null,
            _ServerModel: null,
            _SessionManager: null,
            _Store: {
                sessionId: 'mockSessionId',
                sideloadedKits: [],
                devToken: 'test_dev_token',
                isFirstRun: true,
                isEnabled: true,
                sessionAttributes: {},
                currentSessionMPIDs: [],
                consentState: null,
                clientId: null,
                deviceId: null,
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
                wrapperSDKInfo: {
                    name: 'none',
                    version: null,
                    isInfoSet: false,
                },
                SDKConfig: {
                    isDevelopmentMode: false,
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
            getDeviceId: mockFunction,
            init: mockFunction,
            logBaseEvent: mockFunction,
            logEvent: mockFunction,
            logLevel: 'none',
            setPosition: mockFunction,
            upload: mockFunction,
        } as unknown) as IMParticleWebSDKInstance;
    }

    private createSDKEventFunction(event): SDKEvent {
        return new ServerModel(this.getMPInstance()).createEventObject(event);
    }

    public returnBatch(events: BaseEvent | BaseEvent[]): Batch | null {
        const mpInstance = this.getMPInstance();

        const sdkEvents: SDKEvent[] = Array.isArray(events)
            ? events.map(event => this.createSDKEventFunction(event))
            : [this.createSDKEventFunction(events)];

        const batch: Batch = convertEvents('0', sdkEvents, mpInstance as any);

        return batch;
    }
}
