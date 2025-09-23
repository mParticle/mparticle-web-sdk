import Store, { IStore } from '../../src/store';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';

describe('Store privacy flags', () => {
    let store: IStore & Record<string, any>;
    let mockMPInstance: IMParticleWebSDKInstance & Record<string, any>;

    beforeEach(() => {
        mockMPInstance = {
            _Helpers: {
                createMainStorageName: () => 'mprtcl-v4',
                createProductStorageName: () => 'mprtcl-prodv4',
                Validators: { isFunction: () => true },
                extend: Object.assign,
            },
            _NativeSdkHelpers: {
                isWebviewEnabled: () => false,
            },
            _Persistence: {
                update: () => {},
                savePersistence: () => {},
                getPersistence: () => ({ gs: {} }),
            },
            Logger: {
                verbose: () => {},
                warning: () => {},
                error: () => {},
            },
            Identity: {
                getCurrentUser: () => ({ getMPID: () => 'mpid' }),
            },
        } as any;

        store = {} as any;
        // Construct Store with our mock 'this'
        (Store as any).call(store, {} as SDKInitConfig, mockMPInstance, 'apikey');
    });

    it('should default noFunctional and noTargeting to false when not provided', () => {
        const cfg: SDKInitConfig = { flags: {} } as any;
        store.processConfig(cfg);
        expect(store.getNoFunctional()).toBe(false);
        expect(store.getNoTargeting()).toBe(false);
    });

    it('should set noFunctional as true and noTargeting as true from config', () => {
        const cfg: SDKInitConfig = {
            launcherOptions: { noFunctional: true, noTargeting: true },
            flags: {},
        } as any;

        store.processConfig(cfg);

        expect(store.getNoFunctional()).toBe(true);
        expect(store.getNoTargeting()).toBe(true);
    });

    it('should set noFunctional as true and noTargeting as false from config', () => {
        const cfg: SDKInitConfig = {
            launcherOptions: { noFunctional: true, noTargeting: false },
            flags: {},
        } as any;

        store.processConfig(cfg);

        expect(store.getNoFunctional()).toBe(true);
        expect(store.getNoTargeting()).toBe(false);
    });

    it('should set noFunctional as false and noTargeting as true from config', () => {
        const cfg: SDKInitConfig = {
            launcherOptions: { noFunctional: false, noTargeting: true },
            flags: {},
        } as any;

        store.processConfig(cfg);
        
        expect(store.getNoFunctional()).toBe(false);
        expect(store.getNoTargeting()).toBe(true);
    });
});