import {
    ISDKUserIdentityChangeData,
    IUserAttributeChangeEvent,
    IUserIdentityChangeEvent,
} from '../../src/identity-user-interfaces';
import {
    IIdentityAPIRequestData,
    IdentityAPIMethod,
    IdentityPreProcessResult,
    IIdentityAPIModifyRequestData,
    IAliasRequest,
    SDKIdentityTypeEnum,
} from '../../src/identity.interfaces';
import { MessageType } from '../../src/types.interfaces';

describe('Identity', () => {
    describe('#types', () => {
        it('defines IdentityAPIMethods', () => {
            const identify: IdentityAPIMethod = 'identify';
            const login: IdentityAPIMethod = 'login';
            const logout: IdentityAPIMethod = 'logout';
            const modify: IdentityAPIMethod = 'modify';

            expect(identify).toEqual('identify');
            expect(login).toEqual('login');
            expect(logout).toEqual('logout');
            expect(modify).toEqual('modify');
        });

        it('defines IdentityPreProcessResult', () => {
            const IdentityPreProcessResult: IdentityPreProcessResult = {
                valid: true,
                error: 'I AM ERROR',
            };

            expect(IdentityPreProcessResult).toBeDefined();
        });

        it('defines SDKIdentityTypeEnum', () => {
            const google: SDKIdentityTypeEnum = SDKIdentityTypeEnum.google;
            const facebook: SDKIdentityTypeEnum = SDKIdentityTypeEnum.facebook;
            const microsoft: SDKIdentityTypeEnum =
                SDKIdentityTypeEnum.microsoft;
            const customerId: SDKIdentityTypeEnum =
                SDKIdentityTypeEnum.customerId;
            const twitter: SDKIdentityTypeEnum = SDKIdentityTypeEnum.twitter;
            const yahoo: SDKIdentityTypeEnum = SDKIdentityTypeEnum.yahoo;
            const email: SDKIdentityTypeEnum = SDKIdentityTypeEnum.email;
            const alias: SDKIdentityTypeEnum = SDKIdentityTypeEnum.alias;
            const facebookCustomAudienceId: SDKIdentityTypeEnum =
                SDKIdentityTypeEnum.facebookCustomAudienceId;

            const other: SDKIdentityTypeEnum = SDKIdentityTypeEnum.other;
            const otherId2: SDKIdentityTypeEnum = SDKIdentityTypeEnum.otherId2;
            const otherId3: SDKIdentityTypeEnum = SDKIdentityTypeEnum.otherId3;
            const otherId4: SDKIdentityTypeEnum = SDKIdentityTypeEnum.otherId4;
            const otherId5: SDKIdentityTypeEnum = SDKIdentityTypeEnum.otherId5;
            const otherId6: SDKIdentityTypeEnum = SDKIdentityTypeEnum.otherId6;
            const otherId7: SDKIdentityTypeEnum = SDKIdentityTypeEnum.otherId7;
            const otherId8: SDKIdentityTypeEnum = SDKIdentityTypeEnum.otherId8;
            const otherId9: SDKIdentityTypeEnum = SDKIdentityTypeEnum.otherId9;
            const otherId10: SDKIdentityTypeEnum =
                SDKIdentityTypeEnum.otherId10;

            const mobileNumber: SDKIdentityTypeEnum =
                SDKIdentityTypeEnum.mobileNumber;
            const phoneNumber2: SDKIdentityTypeEnum =
                SDKIdentityTypeEnum.phoneNumber2;
            const phoneNumber3: SDKIdentityTypeEnum =
                SDKIdentityTypeEnum.phoneNumber3;

            expect(google).toEqual('google');
            expect(facebook).toEqual('facebook');
            expect(microsoft).toEqual('microsoft');
            expect(customerId).toEqual('customerid');
            expect(twitter).toEqual('twitter');
            expect(yahoo).toEqual('yahoo');
            expect(email).toEqual('email');
            expect(alias).toEqual('alias');
            expect(facebookCustomAudienceId).toEqual(
                'facebookcustomaudienceid'
            );

            expect(other).toEqual('other');
            expect(otherId2).toEqual('other2');
            expect(otherId3).toEqual('other3');
            expect(otherId4).toEqual('other4');
            expect(otherId5).toEqual('other5');
            expect(otherId6).toEqual('other6');
            expect(otherId7).toEqual('other7');
            expect(otherId8).toEqual('other8');
            expect(otherId9).toEqual('other9');
            expect(otherId10).toEqual('other10');

            expect(mobileNumber).toEqual('mobile_number');
            expect(phoneNumber2).toEqual('phone_number_2');
            expect(phoneNumber3).toEqual('phone_number_3');
        });
    });

    describe('#interfaces', () => {
        it('defines identity change data', () => {
            const testIdentity: ISDKUserIdentityChangeData = {
                IdentityType: SDKIdentityTypeEnum.google,
                Identity: 'test identity',
                Timestamp: Date.now(),
                CreatedThisBatch: false,
            };

            expect(testIdentity).toBeDefined();
        });

        it('defines identity api request data', () => {
            const testIdentityApiRequest: IIdentityAPIRequestData = {
                client_sdk: {
                    platform: 'web',
                    sdk_vendor: 'mparticle',
                    sdk_version: '1.0.0',
                },
                context: {
                    data_plan: {
                        plan_id: '123',
                        plan_version: 1,
                    },
                },
                environment: 'development',
                request_id: '123',
                reqest_timestamp_unixtime_ms: Date.now(),
                previous_mpid: null,
                known_identities: {
                    email: 'user@mparticle.com',
                },
            };

            expect(testIdentityApiRequest).toBeDefined();
        });

        it('defines identity api modify request data', () => {
            const testIdentityApiModifyRequest: IIdentityAPIModifyRequestData = {
                client_sdk: {
                    platform: 'web',
                    sdk_vendor: 'mparticle',
                    sdk_version: '1.0.0',
                },
                context: {
                    data_plan: {
                        plan_id: '123',
                        plan_version: 1,
                    },
                },
                environment: 'development',
                request_id: '123',
                reqest_timestamp_unixtime_ms: Date.now(),
                identity_changes: [
                    {
                        identity_type: SDKIdentityTypeEnum.google,
                        old_value: 'old value',
                        new_value: 'new value',
                    },
                ],
            };

            expect(testIdentityApiModifyRequest).toBeDefined();
        });

        it('defines identity api change data', () => {
            const testIdentityApiChangeData = {
                identity_type: SDKIdentityTypeEnum.google,
                old_value: 'old value',
                new_value: 'new value',
            };

            expect(testIdentityApiChangeData).toBeDefined();
        });

        it('defines user attribute change event', () => {
            const testUserAttributeChangeEvent: IUserAttributeChangeEvent = {
                messageType: MessageType.UserAttributeChange,
                userAttributeChanges: {
                    UserAttributeName: 'foo',
                    New: 'new',
                    Old: 'old',
                    IsNewAttribute: true,
                    Deleted: false,
                },
            };

            expect(testUserAttributeChangeEvent).toBeDefined();
        });

        it('defines user identity change event', () => {
            const testAttributeChangeEvent: IUserIdentityChangeEvent = {
                messageType: MessageType.UserIdentityChange,
                userIdentityChanges: {
                    New: {
                        Identity: 'Google ID',
                        IdentityType: SDKIdentityTypeEnum.google,
                        CreatedThisBatch: true,
                        Timestamp: Date.now(), // optional
                    },
                    Old: {
                        Identity: 'Facebook ID',
                        IdentityType: SDKIdentityTypeEnum.facebook,
                        CreatedThisBatch: false,
                        Timestamp: Date.now(), // optional
                    },
                },
            };

            expect(testAttributeChangeEvent).toBeDefined();
        });

        it('defines alias request', () => {
            const testAliasRequest: IAliasRequest = {
                destinationMpid: '123',
                sourceMpid: '456',
                startTime: Date.now(),
                endTime: Date.now() + 1000,
            };

            expect(testAliasRequest).toBeDefined();
        });
    });
});
