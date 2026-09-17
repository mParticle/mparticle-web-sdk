import Forwarders from '../../src/forwarders';
import Helpers from '../../src/helpers';
import KitBlocker from '../../src/kitBlocking';
import { IdentityType } from '../../src/types';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { ConfiguredKit, IForwarders } from '../../src/forwarders.interfaces';
import { KitBlockerDataPlan } from '../../src/sdkRuntimeModels';
import { Dictionary } from '../../src/utils';

const testMPID = 'test-mpid';

// A restrictive data plan: customerid and email are planned, so google and
// yahoo are unplanned and blok.id must keep them from a kit. 'planned_attr'
// is planned, so 'unplanned_attr' must be kept from a kit.
const restrictiveDataPlan = ({
    document: {
        dtpn: {
            blok: { ev: false, ea: false, ua: true, id: true },
            vers: {
                version_document: {
                    data_points: [
                        {
                            match: { type: 'user_attributes' },
                            validator: {
                                type: 'json_schema',
                                definition: {
                                    additionalProperties: false,
                                    properties: { planned_attr: {} },
                                },
                            },
                        },
                        {
                            match: { type: 'user_identities' },
                            validator: {
                                type: 'json_schema',
                                definition: {
                                    additionalProperties: false,
                                    properties: {
                                        customerid: {},
                                        email: {},
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        },
    },
} as unknown) as KitBlockerDataPlan;

// Identities as they are passed to initForwarders and
// setForwarderUserIdentities: keyed by identity name.
const userIdentitiesByName = {
    customerid: 'cust-1',
    email: 'user@example.com',
    google: 'google-id',
    yahoo: 'yahoo-id',
};

const userAttributes: Dictionary = {
    planned_attr: 'planned value',
    unplanned_attr: 'unplanned value',
};

interface IRecordingKit extends ConfiguredKit {
    initUserAttributes: Dictionary | null;
    initUserIdentities: { Identity: string; Type: number }[] | null;
    setUserIdentityCalls: { Identity: string; Type: number }[];
}

// A kit that records what it was handed. setUserIdentity keeps every call: a
// kit that only kept the last one could not tell "never called for this
// identity type" apart from "called and then overwritten".
function createRecordingKit(): IRecordingKit {
    const kit = {
        name: 'RecordingKit',
        id: 1,
        settings: { PriorityValue: 1 },
        initialized: false,
        userAttributeFilters: [],
        userIdentityFilters: [],
        filteringConsentRuleValues: {},
        filteringUserAttributeValue: {},
        excludeAnonymousUser: false,
        initUserAttributes: null,
        initUserIdentities: null,
        setUserIdentityCalls: [],
        init(
            settings,
            forwardingStatsCallback,
            testMode,
            trackerId,
            initUserAttributes,
            initUserIdentities
        ) {
            // Copies: the objects a kit is handed are mutated in place by later
            // calls, so a reference would not prove what init received.
            kit.initUserAttributes = { ...initUserAttributes };
            kit.initUserIdentities = (initUserIdentities || []).slice();
        },
        setUserIdentity(identity: string, type: number) {
            kit.setUserIdentityCalls.push({ Identity: identity, Type: type });
        },
    };

    return (kit as unknown) as IRecordingKit;
}

function createMpInstance(kit: IRecordingKit): IMParticleWebSDKInstance {
    const user = {
        getMPID: () => testMPID,
        isLoggedIn: () => true,
        getAllUserAttributes: () => ({ ...userAttributes }),
    };

    const mpInstance = ({
        _Store: {
            webviewBridgeEnabled: false,
            configuredForwarders: [kit],
            activeForwarders: [kit],
            clientId: 'client-id',
            devToken: 'test-token',
            SDKConfig: {
                appVersion: '1.0.0',
                appName: 'test-app',
                customFlags: {},
                v1SecureServiceUrl: 'jssdks.mparticle.com/v1/JS/',
            },
            getUserAttributes: () => ({ ...userAttributes }),
            getUserIdentities: () => ({
                [IdentityType.CustomerId]: 'cust-1',
                [IdentityType.Email]: 'user@example.com',
                [IdentityType.Google]: 'google-id',
                [IdentityType.Yahoo]: 'yahoo-id',
            }),
        },
        _Consent: {
            isEnabledForUserConsent: () => true,
        },
        Identity: {
            getCurrentUser: () => user,
        },
        Logger: {
            verbose: jest.fn(),
            warning: jest.fn(),
            error: jest.fn(),
        },
    } as unknown) as IMParticleWebSDKInstance;

    // The real Helpers, so filterUserIdentities and filterUserAttributes are
    // the production implementations rather than a restatement of them.
    mpInstance._Helpers = new Helpers(mpInstance);

    return mpInstance;
}

function createForwarders(
    mpInstance: IMParticleWebSDKInstance,
    kitBlocker?: KitBlocker
): IForwarders {
    return new (Forwarders as any)(mpInstance, kitBlocker) as IForwarders;
}

function typesOf(calls: { Type: number }[]): number[] {
    return calls.map(call => call.Type);
}

describe('Forwarders kit blocking', () => {
    describe('initForwarders', () => {
        it('should pass user attributes and identities to a kit when there is no kit blocker', () => {
            const kit = createRecordingKit();
            const mpInstance = createMpInstance(kit);

            createForwarders(mpInstance).initForwarders(
                userIdentitiesByName,
                jest.fn()
            );

            expect(kit.initUserAttributes).toEqual(userAttributes);
            expect(typesOf(kit.initUserIdentities)).toEqual(
                expect.arrayContaining([
                    IdentityType.CustomerId,
                    IdentityType.Email,
                    IdentityType.Google,
                    IdentityType.Yahoo,
                ])
            );
        });

        it('should not pass blocked user attributes or identities to a kit', () => {
            const kit = createRecordingKit();
            const mpInstance = createMpInstance(kit);
            const kitBlocker = new KitBlocker(restrictiveDataPlan, mpInstance);

            createForwarders(mpInstance, kitBlocker).initForwarders(
                userIdentitiesByName,
                jest.fn()
            );

            // Positive controls: the planned attribute and the planned
            // identities are delivered, so an absent blocked value below
            // cannot be explained by nothing being delivered at all.
            expect(kit.initUserAttributes).toHaveProperty(
                'planned_attr',
                'planned value'
            );
            expect(kit.initUserAttributes).not.toHaveProperty(
                'unplanned_attr'
            );

            const initIdentityTypes = typesOf(kit.initUserIdentities);
            expect(initIdentityTypes).toContain(IdentityType.CustomerId);
            expect(initIdentityTypes).toContain(IdentityType.Email);
            expect(initIdentityTypes).not.toContain(IdentityType.Google);
            expect(initIdentityTypes).not.toContain(IdentityType.Yahoo);
        });

        it('should not initialize a kit at all when the webview bridge is enabled', () => {
            const kit = createRecordingKit();
            const mpInstance = createMpInstance(kit);
            mpInstance._Store.webviewBridgeEnabled = true;
            const kitBlocker = new KitBlocker(restrictiveDataPlan, mpInstance);
            const isIdentityBlocked = jest.spyOn(
                kitBlocker,
                'isIdentityBlocked'
            );

            createForwarders(mpInstance, kitBlocker).initForwarders(
                userIdentitiesByName,
                jest.fn()
            );

            expect(kit.initUserAttributes).toBeNull();
            expect(isIdentityBlocked).not.toHaveBeenCalled();
        });
    });

    describe('setForwarderUserIdentities', () => {
        it('should call setUserIdentity for every identity when there is no kit blocker', () => {
            const kit = createRecordingKit();
            const mpInstance = createMpInstance(kit);

            createForwarders(mpInstance).setForwarderUserIdentities(
                userIdentitiesByName
            );

            expect(typesOf(kit.setUserIdentityCalls)).toEqual(
                expect.arrayContaining([
                    IdentityType.CustomerId,
                    IdentityType.Email,
                    IdentityType.Google,
                    IdentityType.Yahoo,
                ])
            );
        });

        it('should not call setUserIdentity for a blocked identity', () => {
            const kit = createRecordingKit();
            const mpInstance = createMpInstance(kit);
            const kitBlocker = new KitBlocker(restrictiveDataPlan, mpInstance);

            createForwarders(mpInstance, kitBlocker).setForwarderUserIdentities(
                userIdentitiesByName
            );

            const calledTypes = typesOf(kit.setUserIdentityCalls);
            // Positive controls, as above.
            expect(calledTypes).toContain(IdentityType.CustomerId);
            expect(calledTypes).toContain(IdentityType.Email);
            expect(calledTypes).not.toContain(IdentityType.Google);
            expect(calledTypes).not.toContain(IdentityType.Yahoo);
        });
    });
});
