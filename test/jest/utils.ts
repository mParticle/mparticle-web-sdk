import { KitRegistrationConfig, RegisteredKit, UnregisteredKit } from "../../src/forwarders.interfaces";
import Store, { IStore } from '../../src/store';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';
import Persistence from '../../src/persistence';
import { IPersistence } from '../../src/persistence.interfaces';
import Helpers from '../../src/helpers';
import { createCookieString } from '../../src/utils';

export class MockForwarder {
    public name: string;
    public moduleId: number;
    public initCalled: boolean = false;
    public processCalled: boolean = false;
    public setUserIdentityCalled: boolean = false;
    public onUserIdentifiedCalled: boolean = false;
    
    public setOptOutCalled: boolean = false;
    public setUserAttributeCalled: boolean = false;
    public reportingService = null;
    public userAttributeFilters = [];
    public removeUserAttributeCalled = false;
    public receivedEvent = null;
    public isVisible = false;
    public logOutCalled = false;
    public settings = {};
    public trackerId = null;
    public testMode = false;
    public userAttributes = {};
    public userIdentities = null;
    public appVersion = null;
    public appName = null;
    constructor(forwarderName?: string, id?: number) {
        this.name = forwarderName || 'MockFowarder';
        this.moduleId = id || 1;
    }

    public register = (config: KitRegistrationConfig): void => {
        if (config.kits) {
            config.kits[this.name] = {
                constructor: this.constructor as () => RegisteredKit,
            };
        }
    }

    public getId = (): number => {
        return this.moduleId;
    }

    public init = ((
        settings,
        reportingService,
        testMode,
        id,
        userAttributes,
        userIdentities,
        appVersion,
        appName
    ) => {
        this.reportingService = reportingService;
        this.initCalled = true;

        this.trackerId = id;
        this.userAttributes = userAttributes;
        this.userIdentities = userIdentities;
        this.appVersion = appVersion;
        this.appName = appName;
        this.settings = settings;
        this.testMode = testMode;
    })
}

export const MockSideloadedKit = MockForwarder;

export interface IMockSideloadedKit extends MockForwarder {}

export interface IMockSideloadedKitConstructor {
    new(unregisteredKitInstance: UnregisteredKit): IMockSideloadedKit;
}

export const deleteAllCookies = ():void => {
    document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    });
}
export interface PersistenceHarnessOptions {
    useCookieStorage?: boolean;
    isLocalStorageAvailable?: boolean;
    getCurrentUser?: () => { getMPID(): string };
}

export interface PersistenceHarness {
    store: IStore;
    persistence: IPersistence;
    mpInstance: IMParticleWebSDKInstance;
    logger: { verbose: jest.Mock; error: jest.Mock; warning: jest.Mock };
}

export const buildPersistenceHarness = (
    options: PersistenceHarnessOptions = {}
): PersistenceHarness => {
    const store = {} as IStore;
    const logger = {
        verbose: jest.fn(),
        error: jest.fn(),
        warning: jest.fn(),
    };
    const mpInstance = ({
        _Store: store,
        _NativeSdkHelpers: {},
        Identity: {
            getCurrentUser:
                options.getCurrentUser ||
                (() => ({ getMPID: () => store.mpid })),
        },
        Logger: logger,
    } as unknown) as IMParticleWebSDKInstance;
    mpInstance._Helpers = new Helpers(mpInstance);
    Store.call(store, {} as SDKInitConfig, mpInstance, 'apikey');
    store.storageName = mpInstance._Helpers.createMainStorageName('abcdef');
    if (options.isLocalStorageAvailable !== undefined) {
        store.isLocalStorageAvailable = options.isLocalStorageAvailable;
    }
    if (options.useCookieStorage !== undefined) {
        store.SDKConfig.useCookieStorage = options.useCookieStorage;
    }
    store.webviewBridgeEnabled = false;
    const persistence = new Persistence(mpInstance);
    return { store, persistence, mpInstance, logger };
};

export const encodePersistenceRecord = (
    mpid: string,
    isEnabled: 0 | 1,
    extraRecords = {}
): string =>
    createCookieString(
        JSON.stringify({
            cu: mpid,
            gs: {
                sid: 'SESSION-' + mpid,
                ie: isEnabled,
                les: Date.now(),
                ssd: Date.now(),
                das: 'das-' + mpid,
            },
            l: 0,
            [mpid]: { ui: btoa(JSON.stringify({ 1: 'customer-' + mpid })) },
            ...extraRecords,
        })
    );
