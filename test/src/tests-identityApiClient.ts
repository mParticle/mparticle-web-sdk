import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import { MParticleWebSDK } from '../../src/sdkRuntimeModels';
import { expect } from 'chai';
import {
    IAliasRequest,
    IIdentityAPIRequestData,
} from '../../src/identity.interfaces';
import {
    HTTP_ACCEPTED,
    HTTP_BAD_REQUEST,
    HTTP_FORBIDDEN,
    HTTP_OK,
} from '../../src/constants';
import IdentityAPIClient, { IIdentityApiClient } from '../../src/identityApiClient';
import { IIdentityResponse } from '../../src/identity-user-interfaces';
import Utils from './config/utils';
const { fetchMockSuccess } = Utils;

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}

let mockServer;
const mParticle = window.mParticle;

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}


describe('Identity Api Client', () => {
    describe('#sendIdentityRequest', () => {
        const identityRequest: IIdentityAPIRequestData = {
            client_sdk: {
                platform: 'web',
                sdk_vendor: 'mparticle',
                sdk_version: '1.0.0',
            },
            context: 'test-context',
            environment: 'development',
            request_id: '123',
            request_timestamp_unixtime_ms: Date.now(),
            previous_mpid: null,
            known_identities: {
                email: 'user@mparticle.com',
            },
        };

        const originalIdentityApiData = {
            userIdentities: {
                other: '123456',
            },
        };

        const apiSuccessResponseBody = {
            mpid: testMPID,
            is_logged_in: false,
            context: 'test-context',
            is_ephemeral: false,
            matched_identities: {},
        }

        const expectedIdentityResponse: IIdentityResponse = {
            status: 200,
            responseText: apiSuccessResponseBody,
            cacheMaxAge: 0,
            expireTimestamp: 0,
        };


        it('should call parseIdentityResponse with the correct arguments', async () => {
            fetchMockSuccess(urls.identify, apiSuccessResponseBody);

            const callbackSpy = sinon.spy();

            const mpInstance: MParticleWebSDK = ({
                Logger: {
                    verbose: () => {},
                    error: () => {},
                },
                _Helpers: {
                    createServiceUrl: () =>
                        'https://identity.mparticle.com/v1/',

                    invokeCallback: () => {},
                },
                _Store: {
                    devToken: 'test_key',
                    SDKConfig: {
                        identityUrl: '',
                    },
                },
                _Persistence: {},
            } as unknown) as MParticleWebSDK;

            const identityApiClient: IIdentityApiClient = new IdentityAPIClient(
                mpInstance
            );

            const parseIdentityResponseSpy = sinon.spy();

            await identityApiClient.sendIdentityRequest(
                identityRequest,
                'identify',
                callbackSpy,
                originalIdentityApiData,
                parseIdentityResponseSpy,
                testMPID,
                identityRequest.known_identities
            );

            expect(parseIdentityResponseSpy.calledOnce, 'Call parseIdentityResponse').to.eq(true);
            expect(parseIdentityResponseSpy.args[0][0]).to.deep.equal(expectedIdentityResponse);
            expect(parseIdentityResponseSpy.args[0][1]).to.equal(testMPID);
            expect(parseIdentityResponseSpy.args[0][2]).to.be.a('function');
            expect(parseIdentityResponseSpy.args[0][3]).to.deep.equal(originalIdentityApiData);
            expect(parseIdentityResponseSpy.args[0][4]).to.equal('identify');
            expect(parseIdentityResponseSpy.args[0][5]).to.deep.equal(identityRequest.known_identities);
            expect(parseIdentityResponseSpy.args[0][6]).to.equal(false);
        });

        it('should return early without calling parseIdentityResponse if the identity call is in flight', async () => {
            fetchMockSuccess(urls.identify, apiSuccessResponseBody);

            const invokeCallbackSpy = sinon.spy();

            const mpInstance: MParticleWebSDK = ({
                Logger: {
                    verbose: () => {},
                    error: () => {},
                },
                _Helpers: {
                    createServiceUrl: () =>
                        'https://identity.mparticle.com/v1/',

                    invokeCallback: invokeCallbackSpy,
                },
                _Store: {
                    devToken: 'test_key',
                    SDKConfig: {
                        identityUrl: '',
                    },
                    identityCallInFlight: true,
                },
                _Persistence: {},
            } as unknown) as MParticleWebSDK;

            const identityApiClient: IIdentityApiClient = new IdentityAPIClient(
                mpInstance
            );

            const parseIdentityResponseSpy = sinon.spy();

            await identityApiClient.sendIdentityRequest(
                identityRequest,
                'identify',
                sinon.spy(),
                null,
                parseIdentityResponseSpy,
                testMPID,
                null,
            );

            expect(invokeCallbackSpy.calledOnce, 'invokeCallbackSpy called').to.eq(true);
            expect(invokeCallbackSpy.args[0][0]).to.be.a('function');
            expect(invokeCallbackSpy.args[0][1]).to.equal(-2);
            expect(invokeCallbackSpy.args[0][2]).to.equal('There is currently an Identity request processing. Please wait for this to return before requesting again');

            expect(parseIdentityResponseSpy.calledOnce, 'parseIdentityResponseSpy NOT called').to.eq(false);

        });

        it('should call invokeCallback with an error if the fetch fails', async () => {
            fetchMock.post(urls.identify, {
                status: 500,
                throws: { message: 'server error' },
            }, {
                overwriteRoutes: true,
            });

            const callbackSpy = sinon.spy();
            const invokeCallbackSpy = sinon.spy();

            const mpInstance: MParticleWebSDK = ({
                Logger: {
                    verbose: () => {},
                    error: () => {},
                },
                _Helpers: {
                    createServiceUrl: () =>
                        'https://identity.mparticle.com/v1/',

                    invokeCallback: invokeCallbackSpy,
                },
                _Store: {
                    devToken: 'test_key',
                    SDKConfig: {
                        identityUrl: '',
                    },
                    identityCallInFlight: false,
                },
                _Persistence: {},
            } as unknown) as MParticleWebSDK;

            const identityApiClient: IIdentityApiClient = new IdentityAPIClient(
                mpInstance
            );

            const parseIdentityResponseSpy = sinon.spy();

            await identityApiClient.sendIdentityRequest(
                identityRequest,
                'identify',
                callbackSpy,
                null,
                parseIdentityResponseSpy,
                testMPID,
                null,
            );

            expect(invokeCallbackSpy.calledOnce, 'invokeCallbackSpy called').to.eq(true);
            expect(invokeCallbackSpy.args[0][0]).to.be.a('function');
            expect(invokeCallbackSpy.args[0][0]).to.equal(callbackSpy);
            expect(invokeCallbackSpy.args[0][1]).to.equal(-1);
            expect(invokeCallbackSpy.args[0][2]).to.equal('server error');
        });

        it('should use XHR if fetch is not available', async () => {
            const mockServer = sinon.createFakeServer();
            mockServer.respondImmediately = true;

            mockServer.respondWith(urls.identify, [
                200,
                {},
                JSON.stringify(apiSuccessResponseBody),
            ]);

            const fetch = window.fetch;
            delete window.fetch;

            const mpInstance: MParticleWebSDK = ({
                Logger: {
                    verbose: () => {},
                    error: () => {},
                },
                _Helpers: {
                    createServiceUrl: () =>
                        'https://identity.mparticle.com/v1/',

                    invokeCallback: sinon.spy(),
                },
                _Store: {
                    devToken: 'test_key',
                    SDKConfig: {
                        identityUrl: '',
                    },
                    identityCallInFlight: false,
                },
                _Persistence: {},
            } as unknown) as MParticleWebSDK;

            const identityApiClient: IIdentityApiClient = new IdentityAPIClient(
                mpInstance
            );

            const parseIdentityResponseSpy = sinon.spy();

            const originalIdentityApiData = {
                userIdentities: {
                    other: '123456',
                },
            };

            await identityApiClient.sendIdentityRequest(
                identityRequest,
                'identify',
                sinon.spy(),
                originalIdentityApiData,
                parseIdentityResponseSpy,
                testMPID,
                identityRequest.known_identities
            );

            expect(parseIdentityResponseSpy.calledOnce, 'Call parseIdentityResponse').to.eq(true);
            expect(parseIdentityResponseSpy.args[0][0]).to.deep.equal(expectedIdentityResponse);
            expect(parseIdentityResponseSpy.args[0][1]).to.equal(testMPID);
            expect(parseIdentityResponseSpy.args[0][2]).to.be.a('function');
            expect(parseIdentityResponseSpy.args[0][3]).to.deep.equal(originalIdentityApiData);
            expect(parseIdentityResponseSpy.args[0][4]).to.equal('identify');
            expect(parseIdentityResponseSpy.args[0][5]).to.deep.equal(identityRequest.known_identities);
            expect(parseIdentityResponseSpy.args[0][6]).to.equal(false);

            window.fetch = fetch;
        });

        it('should construct the correct fetch payload', async () => {
            fetchMockSuccess(urls.identify, apiSuccessResponseBody);

            const callbackSpy = sinon.spy();

            const mpInstance: MParticleWebSDK = ({
                Logger: {
                    verbose: () => {},
                    error: () => {},
                },
                _Helpers: {
                    createServiceUrl: () =>
                        'https://identity.mparticle.com/v1/',

                    invokeCallback: () => {},
                },
                _Store: {
                    devToken: 'test_key',
                    SDKConfig: {
                        identityUrl: '',
                    },
                },
                _Persistence: {},
            } as unknown) as MParticleWebSDK;

            const identityApiClient: IIdentityApiClient = new IdentityAPIClient(
                mpInstance
            );

            const parseIdentityResponseSpy = sinon.spy();

            await identityApiClient.sendIdentityRequest(
                identityRequest,
                'identify',
                callbackSpy,
                originalIdentityApiData,
                parseIdentityResponseSpy,
                testMPID,
                identityRequest.known_identities
            );

            const expectedFetchPayload = {
                method: 'post',
                headers: {
                    Accept: 'text/plain;charset=UTF-8',
                    'Content-Type': 'application/json',
                    'x-mp-key': 'test_key',
                },
                body: JSON.stringify(identityRequest),
            };

            expect(fetchMock.calls()[0][1].method).to.deep.equal(expectedFetchPayload.method);
            expect(fetchMock.calls()[0][1].body).to.deep.equal(expectedFetchPayload.body);
            expect(fetchMock.calls()[0][1].headers).to.deep.equal(expectedFetchPayload.headers);
        });
    });

    describe('#sendAliasRequest', () => {
        const aliasUrl = 'https://jssdks.mparticle.com/v1/identity/test_key/Alias';

        beforeEach(function() {
            fetchMockSuccess(urls.events);
            mParticle.init(apiKey, window.mParticle.config);
        });

        afterEach(function() {
            fetchMock.restore();
            mParticle._resetForTests(MPConfig);
        });

        it('should have just an httpCode on the result passed to the callback on a 200', async () => {
            const mpInstance: MParticleWebSDK = mParticle.getInstance();
            const identityApiClient = new IdentityAPIClient(mpInstance);

            const aliasRequest: IAliasRequest = {
                destinationMpid: '123',
                sourceMpid: '456',
                startTime: 10001230123,
                endTime: 10001231123,
            };

            const aliasCallback = sinon.spy();
            fetchMock.post(aliasUrl, HTTP_OK);

            await identityApiClient.sendAliasRequest(
                aliasRequest,
                aliasCallback
            );
            expect(aliasCallback.calledOnce).to.eq(true);
            const callbackArgs = aliasCallback.getCall(0).args;
            expect(callbackArgs[0]).to.deep.equal({ httpCode: HTTP_OK });
        });

        it('should have just an httpCode on the result passed to the callback on a 202', async () => {
            const mpInstance: MParticleWebSDK = mParticle.getInstance();
            const identityApiClient = new IdentityAPIClient(mpInstance);
            const aliasRequest: IAliasRequest = {
                destinationMpid: '123',
                sourceMpid: '456',
                startTime: 10001230123,
                endTime: 10001231123,
            };

            const aliasCallback = sinon.spy();
            fetchMock.post(aliasUrl, HTTP_ACCEPTED);

            await identityApiClient.sendAliasRequest(
                aliasRequest,
                aliasCallback
            );
            expect(aliasCallback.calledOnce).to.eq(true);
            const callbackArgs = aliasCallback.getCall(0).args;
            expect(callbackArgs[0]).to.deep.equal({ httpCode: HTTP_ACCEPTED });
        });

        it('should have just an httpCode on the result passed to the callback on a 400', async () => {
            const mpInstance: MParticleWebSDK = mParticle.getInstance();
            const identityApiClient = new IdentityAPIClient(mpInstance);
            const aliasRequest: IAliasRequest = {
                destinationMpid: '123',
                sourceMpid: '456',
                startTime: 10001230123,
                endTime: 10001231123,
            };

            const aliasCallback = sinon.spy();
            fetchMock.post(aliasUrl, HTTP_BAD_REQUEST);

            await identityApiClient.sendAliasRequest(
                aliasRequest,
                aliasCallback
            );
            expect(aliasCallback.calledOnce).to.eq(true);
            const callbackArgs = aliasCallback.getCall(0).args;
            expect(callbackArgs[0]).to.deep.equal({
                httpCode: HTTP_BAD_REQUEST,
            });
        });

        it('should have an httpCode and an error message passed to the callback on a 403', async () => {
            const mpInstance: MParticleWebSDK = mParticle.getInstance();
            const identityApiClient = new IdentityAPIClient(mpInstance);
            const aliasRequest: IAliasRequest = {
                destinationMpid: '123',
                sourceMpid: '456',
                startTime: 10001230123,
                endTime: 10001231123,
            };

            const aliasCallback = sinon.spy();
            fetchMock.post(aliasUrl, {
                status: HTTP_FORBIDDEN,
                body: JSON.stringify({ message: 'error' }),
            });

            await identityApiClient.sendAliasRequest(
                aliasRequest,
                aliasCallback
            );
            expect(aliasCallback.calledOnce).to.eq(true);
            const callbackArgs = aliasCallback.getCall(0).args;
            expect(callbackArgs[0]).to.deep.equal({
                httpCode: HTTP_FORBIDDEN,
                message: 'error',
            });
        });
    });
});
