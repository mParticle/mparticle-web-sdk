import {
    IMParticleUser,
    IdentityModifyResultBody,
    IdentityResultBody,
} from '../../src/identity-user-interfaces';
import { SDKIdentityTypeEnum } from '../../src/identity.interfaces';
import {
    hasMPIDAndUserLoginChanged,
    hasMPIDChanged,
} from '../../src/user-utils';

describe('user-utils', () => {
    describe('#didUserChange', () => {
        it('returns true if previousUser is null', () => {
            expect(hasMPIDAndUserLoginChanged(null, null)).toBeTruthy();
        });

        it('returns true if previousUser and newUser have different mpids', () => {
            const previousUser = ({
                getMPID: () => '123',
            } as unknown) as IMParticleUser;

            const newUser = ({
                getMPID: () => '456',
            } as unknown) as IMParticleUser;

            expect(
                hasMPIDAndUserLoginChanged(previousUser, newUser)
            ).toBeTruthy();
        });

        it('returns false if previousUser and newUser have the same MPID', () => {
            const previousUser = ({
                getMPID: () => '123',
                isLoggedIn: () => false,
            } as unknown) as IMParticleUser;

            const newUser = ({
                getMPID: () => '123',
                isLoggedIn: () => false,
            } as unknown) as IMParticleUser;

            expect(
                hasMPIDAndUserLoginChanged(previousUser, newUser)
            ).toBeFalsy();
        });

        it('returns true if previousUser and newUser have the same MPID but different login states', () => {
            const previousUser = ({
                getMPID: () => '123',
                isLoggedIn: () => true,
            } as unknown) as IMParticleUser;

            const newUser = ({
                getMPID: () => '123',
                isLoggedIn: () => false,
            } as unknown) as IMParticleUser;

            expect(
                hasMPIDAndUserLoginChanged(previousUser, newUser)
            ).toBeTruthy();
        });
    });

    describe('#hasMPIDChanged', () => {
        const identityResultBody: IdentityResultBody = {
            context: null,
            is_ephemeral: false,
            is_logged_in: false,
            matched_identities: {
                device_application_stamp: 'test-das',
            },
            mpid: '123',
        };

        it('returns true if prevUser is null', () => {
            expect(hasMPIDChanged(null, identityResultBody)).toBeTruthy();
        });

        it('returns false if prevUser has an MPID and the new MPID is null or undefined', () => {
            const prevUser = ({
                getMPID: () => '123',
            } as unknown) as IMParticleUser;

            expect(
                hasMPIDChanged(prevUser, { ...identityResultBody, mpid: null })
            ).toBeFalsy();

            expect(
                hasMPIDChanged(prevUser, {
                    ...identityResultBody,
                    mpid: undefined,
                })
            ).toBeFalsy();
        });

        it('returns false if prevUser has an MPID and the identity result is empty', () => {
            const prevUser = ({
                getMPID: () => '123',
            } as unknown) as IMParticleUser;

            expect(
                hasMPIDChanged(prevUser, {} as IdentityResultBody)
            ).toBeFalsy();
        });

        it('returns true if prevUser has an MPID and the new MPID is different', () => {
            const prevUser = ({
                getMPID: () => '456',
            } as unknown) as IMParticleUser;

            expect(hasMPIDChanged(prevUser, identityResultBody)).toBeTruthy();
        });

        it('returns false if prevUser has an MPID and the new MPID is the same', () => {
            const prevUser = ({
                getMPID: () => '123',
            } as unknown) as IMParticleUser;

            expect(hasMPIDChanged(prevUser, identityResultBody)).toBeFalsy();
        });

        it('returns false if prevUser has an MPID but the result is a modify result', () => {
            const prevUser = ({
                getMPID: () => '123',
            } as unknown) as IMParticleUser;

            const modifyResults: IdentityModifyResultBody = {
                change_results: {
                    identity_type: SDKIdentityTypeEnum.email,
                    modified_mpid: '123',
                },
            };
            expect(
                hasMPIDChanged(prevUser, modifyResults as IdentityResultBody)
            ).toBeFalsy();
        });
    });
});
