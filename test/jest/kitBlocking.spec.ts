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
        const planWithNoIdentityDataPoint = createDataPlan([]);
        const kitBlocker = new KitBlocker(
            planWithNoIdentityDataPoint,
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
