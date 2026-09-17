import Helpers from '../../src/helpers';
import { IdentityType } from '../../src/types';
import { ISDKUserIdentity } from '../../src/identity-user-interfaces';

// filterUserIdentities maps a name-keyed identities dictionary onto the
// { Type, Identity } list handed to a kit. It needs nothing from the SDK
// instance beyond what the Helpers constructor attaches to itself.
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
        // The recognised identity is asserted present in the same expectation,
        // so this cannot pass by returning nothing at all.
        expect(
            filter({ notAnIdentity: 'nope', email: 'test@example.com' })
        ).toEqual([
            { Type: IdentityType.Email, Identity: 'test@example.com' },
        ]);
    });

    it('drops the userIdentities wrapper key but accepts the same dictionary unwrapped', () => {
        const identities = { customerid: '123', email: 'test@example.com' };

        // Control: the flat dictionary does produce entries, so the empty
        // result below is caused by the wrapper shape and not by inertness.
        // customerid is placed first by design.
        expect(filter(identities)).toEqual([
            { Type: IdentityType.CustomerId, Identity: '123' },
            { Type: IdentityType.Email, Identity: 'test@example.com' },
        ]);

        expect(filter({ userIdentities: identities })).toEqual([]);
    });

    it('keeps identity names whose identity type is 0', () => {
        // IdentityType.Other is 0, and both of these names map to it. A falsy
        // check on the identity type would drop them.
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
