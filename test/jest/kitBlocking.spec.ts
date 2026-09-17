import KitBlocker from '../../src/kitBlocking';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { KitBlockerDataPlan } from '../../src/sdkRuntimeModels';

function createMpInstance(): IMParticleWebSDKInstance {
    return ({
        Logger: {
            verbose: jest.fn(),
            warning: jest.fn(),
            error: jest.fn(),
        },
    } as unknown) as IMParticleWebSDKInstance;
}

function createDataPlan(dataPoints: unknown[]): KitBlockerDataPlan {
    return ({
        document: {
            dtpn: {
                blok: { ev: false, ea: false, ua: true, id: true },
                vers: { version_document: { data_points: dataPoints } },
            },
        },
    } as unknown) as KitBlockerDataPlan;
}

const restrictiveIdentityDataPoint = {
    match: { type: 'user_identities' },
    validator: {
        type: 'json_schema',
        definition: {
            additionalProperties: false,
            properties: { customerid: {}, email: {} },
        },
    },
};

const permissiveIdentityDataPoint = {
    match: { type: 'user_identities' },
    validator: {
        type: 'json_schema',
        definition: {
            additionalProperties: true,
            properties: { customerid: {}, email: {} },
        },
    },
};

describe('KitBlocker.isIdentityBlocked', () => {
    it('should block an unplanned identity and allow a planned one when the data point is restrictive', () => {
        const kitBlocker = new KitBlocker(
            createDataPlan([restrictiveIdentityDataPoint]),
            createMpInstance()
        );

        expect(kitBlocker.isIdentityBlocked('google')).toBe(true);
        // Positive control: a planned identity is still allowed, so a `true`
        // above is a decision about that identity and not a blanket block.
        expect(kitBlocker.isIdentityBlocked('email')).toBe(false);
    });

    it('should allow any identity when the data point allows additional properties', () => {
        const kitBlocker = new KitBlocker(
            createDataPlan([permissiveIdentityDataPoint]),
            createMpInstance()
        );

        expect(kitBlocker.isIdentityBlocked('google')).toBe(false);
        expect(kitBlocker.isIdentityBlocked('email')).toBe(false);
    });

    it('should allow any identity, and not throw, when the plan has no user_identities data point', () => {
        // When unplanned user identities are allowed, the plan comes back with
        // no user_identities data point at all, so the lookup is absent.
        const kitBlocker = new KitBlocker(
            createDataPlan([]),
            createMpInstance()
        );

        expect(kitBlocker.blockUserIdentities).toBe(true);
        expect(
            kitBlocker.dataPlanMatchLookups['user_identities']
        ).toBeUndefined();

        expect(() => kitBlocker.isIdentityBlocked('email')).not.toThrow();
        expect(kitBlocker.isIdentityBlocked('email')).toBe(false);
        expect(kitBlocker.isIdentityBlocked('google')).toBe(false);
    });

    it('should allow any identity when blockUserIdentities is off', () => {
        const kitBlocker = new KitBlocker(
            createDataPlan([restrictiveIdentityDataPoint]),
            createMpInstance()
        );
        kitBlocker.blockUserIdentities = false;

        expect(kitBlocker.isIdentityBlocked('google')).toBe(false);
    });
});
