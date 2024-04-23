import { didUserChange } from '../../src/user-utils';

describe('user-utils', () => {
    describe('#didUserChange', () => {
        it('returns true if previousUser is null', () => {
            expect(didUserChange(null, null)).toBeTruthy();
        });

        it('returns true if previousUser and newUser have different mpids', () => {
            const previousUser = {
                getMPID: () => '123',
            };

            const newUser = {
                getMPID: () => '456',
            };

            expect(didUserChange(previousUser, newUser)).toBeTruthy();
        });

        it('returns false if previousUser and newUser have the same MPID', () => {
            const previousUser = {
                getMPID: () => '123',
                isLoggedIn: () => false,
            };

            const newUser = {
                getMPID: () => '123',
                isLoggedIn: () => false,
            };

            expect(didUserChange(previousUser, newUser)).toBeFalsy();
        });

        it('returns true if previousUser and newUser have the same MPID but different login states', () => {
            const previousUser = {
                getMPID: () => '123',
                isLoggedIn: () => true,
            };

            const newUser = {
                getMPID: () => '123',
                isLoggedIn: () => false,
            };

            expect(didUserChange(previousUser, newUser)).toBeTruthy();
        });
    });
});
