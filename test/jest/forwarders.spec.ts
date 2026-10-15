import Forwarders from '../../src/forwarders';
import Helpers from '../../src/helpers';
import KitBlocker from '../../src/kitBlocking';
import KitFilterHelper from '../../src/kitFilterHelper';
import { IMParticleUser } from '../../src/identity-user-interfaces';
import { IdentityType } from '../../src/types';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { ConfiguredKit, IForwarders } from '../../src/forwarders.interfaces';
import { KitBlockerDataPlan } from '../../src/sdkRuntimeModels';
import { Dictionary } from '../../src/utils';

const testMPID = 'test-mpid';

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

    // Stubbing filterUserIdentities here would make these assertions vacuous.
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
            expect(calledTypes).toContain(IdentityType.CustomerId);
            expect(calledTypes).toContain(IdentityType.Email);
            expect(calledTypes).not.toContain(IdentityType.Google);
            expect(calledTypes).not.toContain(IdentityType.Yahoo);
        });
    });

    describe('isEnabledForUserAttributes', () => {
        const excludeOnAttributeValue = (name: string, value: string) => ({
            userAttributeName: KitFilterHelper.hashAttributeConditionalForwarding(
                name
            ),
            userAttributeValue: KitFilterHelper.hashAttributeConditionalForwarding(
                value
            ),
            includeOnMatch: false,
        });

        const userWithAttributes = (attributes: Dictionary): IMParticleUser =>
            (({
                getAllUserAttributes: () => attributes,
            } as unknown) as IMParticleUser);

        it('should evaluate an attribute-value rule when another attribute is named after an Object.prototype member', () => {
            const forwarders = createForwarders(
                createMpInstance(createRecordingKit())
            );
            const attributes = JSON.parse(
                '{"hasOwnProperty":"stored","tier":"gold"}'
            );

            expect(
                forwarders.isEnabledForUserAttributes(
                    excludeOnAttributeValue('tier', 'gold'),
                    userWithAttributes(attributes)
                )
            ).toBe(false);

            expect(
                forwarders.isEnabledForUserAttributes(
                    excludeOnAttributeValue('tier', 'silver'),
                    userWithAttributes(attributes)
                )
            ).toBe(true);
        });
    });
});
