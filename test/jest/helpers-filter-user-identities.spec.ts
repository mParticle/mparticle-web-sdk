import Helpers from '../../src/helpers';
import { IdentityType } from '../../src/types';
import { ISDKUserIdentity } from '../../src/identity-user-interfaces';

describe('Helpers.filterUserIdentities', () => {
    let helpers: any;

    beforeEach(() => {
        helpers = new (Helpers as any)({
            _Store: { SDKConfig: { flags: {} } },
            Logger: { verbose: jest.fn(), error: jest.fn() },
        });
    });

    const filter = (
        identities: Record<string, unknown>,
        filterList: number[] = []
    ): ISDKUserIdentity[] => helpers.filterUserIdentities(identities, filterList);

    it('drops an identity name that does not map to an identity type', () => {
        expect(
            filter({ notAnIdentity: 'nope', email: 'test@example.com' })
        ).toEqual([
            { Type: IdentityType.Email, Identity: 'test@example.com' },
        ]);
    });

    it('drops the userIdentities wrapper key but accepts the same dictionary unwrapped', () => {
        const identities = { customerid: '123', email: 'test@example.com' };

        // appendFilteredUserIdentity unshifts customerid, so it leads.
        expect(filter(identities)).toEqual([
            { Type: IdentityType.CustomerId, Identity: '123' },
            { Type: IdentityType.Email, Identity: 'test@example.com' },
        ]);

        expect(filter({ userIdentities: identities })).toEqual([]);
    });

    it('keeps the lowest-numbered identity type, 0, which a falsy check would drop', () => {
        expect(filter({ other: 'a', email_sha256: 'b' })).toEqual([
            { Type: IdentityType.Other, Identity: 'a' },
            { Type: IdentityType.Other, Identity: 'b' },
        ]);
    });

    it('still applies the filter list to recognised identities', () => {
        expect(
            filter(
                { customerid: '123', google: 'g', email: 'test@example.com' },
                [IdentityType.Google]
            )
        ).toEqual([
            { Type: IdentityType.CustomerId, Identity: '123' },
            { Type: IdentityType.Email, Identity: 'test@example.com' },
        ]);
    });
});
