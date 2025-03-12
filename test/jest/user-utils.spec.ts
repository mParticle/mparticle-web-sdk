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
import { SDKEvent } from '../../src/sdkRuntimeModels';
import { appendUserInfo } from '../../src/user-utils';
import { isObject, parseNumber } from '../../src/utils';

describe('user-utils', () => {
    let mockMPInstance;

    beforeEach(() => {
        mockMPInstance = {
            _Helpers: {
                isObject,
                parseNumber
            }
        };
    });

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

    describe('appendUserInfo', () => {
        it('should append User Identities and Attributes to event', () => {
            const user = ({
                getUserIdentities: () => {
                    return {
                        userIdentities: {
                            customerid: '1234567',
                            email: 'foo-email',
                            other: 'foo-other',
                            other2: 'foo-other2',
                            other3: 'foo-other3',
                            other4: 'foo-other4',
                        },
                    };
                },
                getAllUserAttributes: () => {
                    return {
                        'foo-user-attr': 'foo-attr-value',
                        'foo-user-attr-list': ['item1', 'item2'],
                    };
                },
                getMPID: () => {
                    return '98765';
                },
                getConsentState: () => {
                    return {
                        gdpr: {
                            'test-purpose': {
                                consented: true,
                                timestamp: 11111,
                                consent_document: 'gdpr-doc',
                                location: 'test-gdpr-location',
                                hardwareId: 'test-gdpr-hardware',
                            },
                        },
                        ccpa: {
                            data_sale_opt_out: {
                                consented: false,
                                timestamp: 22222,
                                consent_document: 'ccpa-doc',
                                location: 'test-ccpa-location',
                                hardwareId: 'test-ccpa-hardware',
                            },
                        },
                    };
                },
            } as unknown) as IMParticleUser;

            const event: SDKEvent = {
                EventName: 'Test Event',
                ExpandedEventCount: 0,
                MPID: '',
                IsFirstRun: true,
                DeviceId: 'test-device',
                EventCategory: 0,
                SourceMessageId: 'test-source-message-id',
                SDKVersion: 'test-version',
                SessionId: 'test-session-id',
                SessionStartDate: 0,
                Timestamp: 0,
                EventDataType: 0,
                Debug: true,
                CurrencyCode: 'USD',
                ActiveTimeOnSite: 10,
            };

            appendUserInfo(mockMPInstance, user, event);

            expect(event.MPID).toBe('98765');
            expect(event.ConsentState).toEqual({
                gdpr: {
                    'test-purpose': {
                        consented: true,
                        timestamp: 11111,
                        consent_document: 'gdpr-doc',
                        location: 'test-gdpr-location',
                        hardwareId: 'test-gdpr-hardware',
                    },
                },
                ccpa: {
                    data_sale_opt_out: {
                        consented: false,
                        timestamp: 22222,
                        consent_document: 'ccpa-doc',
                        location: 'test-ccpa-location',
                        hardwareId: 'test-ccpa-hardware',
                    },
                },
            });
            expect(event.UserAttributes).toEqual({
                'foo-user-attr': 'foo-attr-value',
                'foo-user-attr-list': ['item1', 'item2'],
            });
            expect(event.UserIdentities).toEqual([
                { Identity: 'foo-other', Type: 0 },
                { Identity: '1234567', Type: 1 },
                { Identity: 'foo-email', Type: 7 },
                { Identity: 'foo-other2', Type: 10 },
                { Identity: 'foo-other3', Type: 11 },
                { Identity: 'foo-other4', Type: 12 },
            ]);
        });

        it('sets User Attributes and Identities to null if user is empty', () => {
            const event = {} as SDKEvent;

            appendUserInfo(mockMPInstance, null, event);
            expect(event.MPID).toBeNull();
            expect(event.ConsentState).toBeNull();
            expect(event.UserIdentities).toBeNull();
            expect(event.UserAttributes).toBeNull();
        });

        it('returns undefined if event is empty', () => {
            expect(appendUserInfo(mockMPInstance, {} as IMParticleUser, null)).toBeUndefined();
        });

        it('returns early if event MPID matches User MPID', () => {
            const user = {
                getUserIdentities: () => {
                    return { userIdentities: {} };
                },
                getAllUserAttributes: () => {
                    return null;
                },
                getMPID: () => {
                    return '123456';
                },
                getConsentState: () => {
                    return null;
                },
            };

            const event = {
                MPID: '123456',
            };

            appendUserInfo(mockMPInstance, user as IMParticleUser, event as SDKEvent);

            expect(event.MPID).toBe('123456');
            // Verify to make sure we didn't add anything unnecessary to the event
            expect(Object.keys(event).length).toBe(1);
        });

        it('updates event MPID with User MPID', () => {
            const user = {
                getUserIdentities: () => {
                    return { userIdentities: {} };
                },
                getAllUserAttributes: () => {
                    return null;
                },
                getMPID: () => {
                    return '123456';
                },
                getConsentState: () => {
                    return null;
                },
            };

            const event = {
                MPID: '555666777',
            };

            appendUserInfo(mockMPInstance, user as IMParticleUser, event as SDKEvent);

            expect(event.MPID).toBe('123456');
        });

        it('returns early if event and user are not valid', () => {
            expect(appendUserInfo(mockMPInstance, null, null)).toBeUndefined();
        });
    });
});
