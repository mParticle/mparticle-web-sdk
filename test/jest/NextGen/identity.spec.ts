import {
    IdentityAPIServerErrorResult,
    IdentityApiRequest,
    IdentityApiResult,
    IdentityImplementation,
    MParticleClientErrorCodes,
} from '../../../src/NextGen/identity/identity';

const identityImpl = new IdentityImplementation();
const testAPIRequest: IdentityApiRequest = {
    client_sdk: {
        platform: 'test_platform',
        sdk_version: '42',
        sdk_vendor: 'mParticle',
    },
    context: null,
    environment: 'development',
    request_id: 'test-request-id',
    request_timestamp_ms: 12345,
    previous_mpid: 'test-previous-mpid',
    known_identities: {
        device_application_stamp: 'das-efx',
        other2: 'other-2-test',
    },
};

const expectedIdentityApiResponse: IdentityApiResult = {
    user: null,
    previousUser: null,
    getUser: () => {
        return null;
    },
    getPreviousUser: () => {
        return null;
    },
};

describe('Next Gen', () => {
    describe('Identity', () => {
        describe('#identify', () => {
            it('should return a promise', async () => {
                const actualIdentityApiResponse = await identityImpl.identify(
                    testAPIRequest
                );

                expect(JSON.stringify(actualIdentityApiResponse)).toEqual(
                    JSON.stringify(expectedIdentityApiResponse)
                );
            });
        });

        describe('#modify', () => {
            // For demonstration purposes, we are causing this request to throw an error
            it('should return an error as a promise', async () => {
                const errorResponse: IdentityAPIServerErrorResult = {
                    errorCode: MParticleClientErrorCodes.activeSession,
                };

                await expect(
                    identityImpl.modify(testAPIRequest)
                ).rejects.toEqual(errorResponse);
            });
        });

        describe('#login', () => {
            it('should return a promise', async () => {
                const actualIdentityApiResponse = await identityImpl.login(
                    testAPIRequest
                );

                expect(JSON.stringify(actualIdentityApiResponse)).toEqual(
                    JSON.stringify(expectedIdentityApiResponse)
                );
            });
        });

        describe('#logout', () => {
            it('should return a promise', async () => {
                const actualIdentityApiResponse = await identityImpl.logout(
                    testAPIRequest
                );

                expect(JSON.stringify(actualIdentityApiResponse)).toEqual(
                    JSON.stringify(expectedIdentityApiResponse)
                );
            });
        });

        describe('#getUser', () => {
            it('should return a promise', async () => {
                await expect(
                    identityImpl.getUser('test-mpid')
                ).resolves.toBeNull();
            });
        });

        describe('#getUsers', () => {
            it('should return a promise', async () => {
                await expect(identityImpl.getUsers()).resolves.toBeNull();
            });
        });
    });
});
