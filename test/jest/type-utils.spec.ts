import { getNewIdentitiesByName } from '../../src/type-utils';
import { IdentityType } from '../../src/types.interfaces';

describe('getNewIdentitesByName', () => {
    it('returns an identity name when passing an identity type', () => {
        const { Email, CustomerId } = IdentityType;

        const newIdentitiesByType = {
            [CustomerId]: 'foo',
            [Email]: 'bar@gmail.com',
        };

        expect(getNewIdentitiesByName(newIdentitiesByType)).toEqual({
            customerid: 'foo',
            email: 'bar@gmail.com',
        });
    });
});
