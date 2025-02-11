import sinon from 'sinon';
import * as fetchMock from 'fetch-mock/esm/client';
import { urls, apiKey, MPConfig, testMPID } from './config/constants';
import { expect } from 'chai';
import {
    IAliasRequest,
    IIdentityAPIRequestData,
} from '../../src/identity.interfaces';
import Constants, {
    HTTP_ACCEPTED,
    HTTP_BAD_REQUEST,
    HTTP_FORBIDDEN,
    HTTP_NOT_FOUND,
    HTTP_OK,
    HTTP_SERVER_ERROR,
    HTTP_UNAUTHORIZED,
} from '../../src/constants';
import IdentityAPIClient, { IIdentityApiClient } from '../../src/identityApiClient';
import { IIdentityResponse } from '../../src/identity-user-interfaces';
import Utils from './config/utils';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';
const { fetchMockSuccess } = Utils;
const { HTTPCodes }  = Constants;

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
        fetchMock: any;
    }
}

const mParticle = window.mParticle;

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

            const mpInstance: IMParticleWebSDKInstance = ({
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
            } as unknown) as IMParticleWebSDKInstance;

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

            const mpInstance: IMParticleWebSDKInstance = ({
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
            } as unknown) as IMParticleWebSDKInstance;

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

            const mpInstance: IMParticleWebSDKInstance = ({
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
            } as unknown) as IMParticleWebSDKInstance;

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

            const mpInstance: IMParticleWebSDKInstance = ({
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
            } as unknown) as IMParticleWebSDKInstance;

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

            const mpInstance: IMParticleWebSDKInstance = ({
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
            } as unknown) as IMParticleWebSDKInstance;;

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

            expect(fetchMock.calls()[0][1].method, 'Payload Method').to.deep.equal(expectedFetchPayload.method);
            expect(fetchMock.calls()[0][1].body, 'Payload Body').to.deep.equal(expectedFetchPayload.body);
            expect(fetchMock.calls()[0][1].headers, 'Payload Headers').to.deep.equal(expectedFetchPayload.headers);
        });

        it('should include a detailed error message if the fetch returns a 400 (Bad Request)', async () => {
            const identityRequestError = {
                "Errors": [
                    {
                        "code": "LOOKUP_ERROR",
                        "message": "knownIdentities is empty."
                    }
                ],
                "ErrorCode": "LOOKUP_ERROR",
                "StatusCode": 400,
                "RequestId": "6c6a234f-e171-4588-90a2-d7bc02530ec3"
            };

            fetchMock.post(urls.identify, {
                status: HTTP_BAD_REQUEST,
                body: identityRequestError,
            }, {
                overwriteRoutes: true,
            });

            const callbackSpy = sinon.spy();
            const invokeCallbackSpy = sinon.spy();
            const verboseSpy = sinon.spy();
            const errorSpy = sinon.spy();

            const mpInstance: IMParticleWebSDKInstance = ({
                Logger: {
                    verbose: (message) => verboseSpy(message),
                    error: (message) => errorSpy(message),
                },
                _Helpers: {
                    createServiceUrl: () =>
                        'https://identity.mparticle.com/v1/',

                    invokeCallback: (callback, httpCode, errorMessage) =>
                        invokeCallbackSpy(callback, httpCode, errorMessage),
                },
                _Store: {
                    devToken: 'test_key',
                    SDKConfig: {
                        identityUrl: '',
                    },
                },
                _Persistence: {},
            } as unknown) as IMParticleWebSDKInstance;

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

            const expectedIdentityErrorRequest = {
                status: 400,
                responseText: identityRequestError,
                cacheMAxAge: 0,
                expireTimestamp: 0,
            }

            expect(verboseSpy.lastCall, 'verboseSpy called').to.be.ok;
            expect(verboseSpy.lastCall.firstArg).to.equal("Issue with sending Identity Request to mParticle Servers, received HTTP Code of 400 - knownIdentities is empty.");

            // A 400 will still call parseIdentityResponse
            expect(parseIdentityResponseSpy.calledOnce, 'parseIdentityResponseSpy').to.eq(true);
            expect(parseIdentityResponseSpy.args[0][0].status, 'Identity Error Request Status').to.equal(expectedIdentityErrorRequest.status);
            expect(parseIdentityResponseSpy.args[0][0].responseText, 'Identity Error Request responseText').to.deep.equal(expectedIdentityErrorRequest.responseText);
            expect(parseIdentityResponseSpy.args[0][1]).to.equal(testMPID);
            expect(parseIdentityResponseSpy.args[0][2]).to.be.a('function');
            expect(parseIdentityResponseSpy.args[0][3]).to.deep.equal(originalIdentityApiData);
            expect(parseIdentityResponseSpy.args[0][4]).to.equal('identify');
            expect(parseIdentityResponseSpy.args[0][5]).to.deep.equal(identityRequest.known_identities);
            expect(parseIdentityResponseSpy.args[0][6]).to.equal(false);
        });

        it('should include a detailed error message if the fetch returns a 401 (Unauthorized)', async () => {
            fetchMock.post(urls.identify, {
                status: HTTP_UNAUTHORIZED,
                body: null,
            }, {
                overwriteRoutes: true,
            });

            const callbackSpy = sinon.spy();
            const invokeCallbackSpy = sinon.spy();
            const verboseSpy = sinon.spy();
            const errorSpy = sinon.spy();

            const mpInstance: IMParticleWebSDKInstance = ({
                Logger: {
                    verbose: (message) => verboseSpy(message),
                    error: (message) => errorSpy(message),
                },
                _Helpers: {
                    createServiceUrl: () =>
                        'https://identity.mparticle.com/v1/',

                    invokeCallback: (callback, httpCode, errorMessage) =>
                        invokeCallbackSpy(callback, httpCode, errorMessage),
                },
                _Store: {
                    devToken: 'test_key',
                    SDKConfig: {
                        identityUrl: '',
                    },
                },
                _Persistence: {},
            } as unknown) as IMParticleWebSDKInstance;

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

            expect(errorSpy.lastCall, 'errorSpy called').to.be.ok;
            expect(errorSpy.lastCall.firstArg).to.equal("Error sending identity request to servers - Received HTTP Code of 401");

            expect(invokeCallbackSpy.calledOnce, 'invokeCallbackSpy').to.eq(true);
            expect(invokeCallbackSpy.args[0][0]).to.equal(callbackSpy);
            expect(invokeCallbackSpy.args[0][1]).to.equal(-1);
            expect(invokeCallbackSpy.args[0][2]).to.equal("Received HTTP Code of 401");

            // A 401 should not call parseIdentityResponse
            expect(parseIdentityResponseSpy.calledOnce, 'parseIdentityResponseSpy').to.eq(false);
        });

        it('should include a detailed error message if the fetch returns a 403 (Forbidden)', async () => {
            fetchMock.post(urls.identify, {
                status: HTTP_FORBIDDEN,
                body: null,
            }, {
                overwriteRoutes: true,
            });

            const callbackSpy = sinon.spy();
            const invokeCallbackSpy = sinon.spy();
            const verboseSpy = sinon.spy();
            const errorSpy = sinon.spy();

            const mpInstance: IMParticleWebSDKInstance = ({
                Logger: {
                    verbose: (message) => verboseSpy(message),
                    error: (message) => errorSpy(message),
                },
                _Helpers: {
                    createServiceUrl: () =>
                        'https://identity.mparticle.com/v1/',

                    invokeCallback: (callback, httpCode, errorMessage) => invokeCallbackSpy(callback, httpCode, errorMessage),
                },
                _Store: {
                    devToken: 'test_key',
                    SDKConfig: {
                        identityUrl: '',
                    },
                },
                _Persistence: {},
            } as unknown) as IMParticleWebSDKInstance;

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

            expect(errorSpy.lastCall, 'errorSpy called').to.be.ok;
            expect(errorSpy.lastCall.firstArg).to.equal("Error sending identity request to servers - Received HTTP Code of 403");

            expect(invokeCallbackSpy.calledOnce, 'invokeCallbackSpy').to.eq(true);
            expect(invokeCallbackSpy.args[0][0]).to.equal(callbackSpy);
            expect(invokeCallbackSpy.args[0][1]).to.equal(-1);
            expect(invokeCallbackSpy.args[0][2]).to.equal("Received HTTP Code of 403");

            // A 403 should not call parseIdentityResponse
            expect(parseIdentityResponseSpy.calledOnce, 'parseIdentityResponseSpy').to.eq(false);

        });

        it('should include a detailed error message if the fetch returns a 404 (Not Found)', async () => {
            fetchMock.post(urls.identify, {
                status: HTTP_NOT_FOUND,
                body: null,
            }, {
                overwriteRoutes: true,
            });

            const callbackSpy = sinon.spy();
            const invokeCallbackSpy = sinon.spy();
            const verboseSpy = sinon.spy();
            const errorSpy = sinon.spy();

            const mpInstance: IMParticleWebSDKInstance = ({
                Logger: {
                    verbose: (message) => verboseSpy(message),
                    error: (message) => errorSpy(message),
                },
                _Helpers: {
                    createServiceUrl: () =>
                        'https://identity.mparticle.com/v1/',

                    invokeCallback: (callback, httpCode, errorMessage) => invokeCallbackSpy(callback, httpCode, errorMessage),
                },
                _Store: {
                    devToken: 'test_key',
                    SDKConfig: {
                        identityUrl: '',
                    },
                },
                _Persistence: {},
            } as unknown) as IMParticleWebSDKInstance;

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

            expect(errorSpy.lastCall, 'errorSpy called').to.be.ok;
            expect(errorSpy.lastCall.firstArg).to.equal("Error sending identity request to servers - Received HTTP Code of 404");

            expect(invokeCallbackSpy.calledOnce, 'invokeCallbackSpy').to.eq(true);
            expect(invokeCallbackSpy.args[0][0]).to.equal(callbackSpy);
            expect(invokeCallbackSpy.args[0][1]).to.equal(-1);
            expect(invokeCallbackSpy.args[0][2]).to.equal("Received HTTP Code of 404");

            // A 404 should not call parseIdentityResponse
            expect(parseIdentityResponseSpy.calledOnce, 'parseIdentityResponseSpy').to.eq(false);
        });

        it('should include a detailed error message if the fetch returns a 500 (Server Error)', async () => {
            fetchMock.post(urls.identify, {
                status: HTTP_SERVER_ERROR,
                body: {
                    "Errors": [
                        {
                            "code": "INTERNAL_ERROR",
                            "message": "An unknown error was encountered."
                        }
                    ],
                    "ErrorCode": "INTERNAL_ERROR",
                    "StatusCode": 500,
                    "RequestId": null
                },
            }, {
                overwriteRoutes: true,
            });

            const callbackSpy = sinon.spy();
            const verboseSpy = sinon.spy();
            const errorSpy = sinon.spy();

            const mpInstance: IMParticleWebSDKInstance = ({
                Logger: {
                    verbose: (message) => verboseSpy(message),
                    error: (message) => errorSpy(message),
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
            } as unknown) as IMParticleWebSDKInstance;

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

            expect(errorSpy.calledOnce, 'errorSpy called').to.eq(true);

            expect(errorSpy.args[0][0]).to.equal('Error sending identity request to servers - Received HTTP Code of 500');
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
            const mpInstance: IMParticleWebSDKInstance = mParticle.getInstance();
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
            const mpInstance: IMParticleWebSDKInstance = mParticle.getInstance();
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
            const mpInstance: IMParticleWebSDKInstance = mParticle.getInstance();
            const identityApiClient = new IdentityAPIClient(mpInstance);
            const aliasRequest: IAliasRequest = {
                destinationMpid: '123',
                sourceMpid: '456',
                startTime: 10001230123,
                endTime: 10001231123,
            };

            const aliasCallback = sinon.spy();
            fetchMock.post(aliasUrl, {
                status: HTTP_BAD_REQUEST,
                body: {
                    message:"The payload was malformed JSON or had missing fields.",
                    code:"INVALID_DATA"}
            }, {
                overwriteRoutes: true
            });

            await identityApiClient.sendAliasRequest(
                aliasRequest,
                aliasCallback
            );
            expect(aliasCallback.calledOnce).to.eq(true);
            const callbackArgs = aliasCallback.getCall(0).args;
            expect(callbackArgs[0]).to.deep.equal({
                httpCode: HTTP_BAD_REQUEST,
                message: 'The payload was malformed JSON or had missing fields.',
            });
        });

        it('should have an httpCode and an error message passed to the callback on a 401', async () => {
            const mpInstance: IMParticleWebSDKInstance = mParticle.getInstance();
            const identityApiClient = new IdentityAPIClient(mpInstance);
            const aliasRequest: IAliasRequest = {
                destinationMpid: '123',
                sourceMpid: '456',
                startTime: 10001230123,
                endTime: 10001231123,
            };

            const aliasCallback = sinon.spy();
            fetchMock.post(aliasUrl, {
                status: HTTP_UNAUTHORIZED,
                body: null,
            });

            await identityApiClient.sendAliasRequest(
                aliasRequest,
                aliasCallback
            );
            expect(aliasCallback.calledOnce).to.eq(true);
            const callbackArgs = aliasCallback.getCall(0).args;
            expect(callbackArgs[0].httpCode).to.equal(HTTPCodes.noHttpCoverage);
            expect(callbackArgs[0].message).deep.equal('Received HTTP Code of 401');
        });

        it('should have an httpCode and an error message passed to the callback on a 403', async () => {
            const mpInstance: IMParticleWebSDKInstance = mParticle.getInstance();
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
                body: null,
            });

            await identityApiClient.sendAliasRequest(
                aliasRequest,
                aliasCallback
            );
            expect(aliasCallback.calledOnce).to.eq(true);
            const callbackArgs = aliasCallback.getCall(0).args;
            expect(callbackArgs[0].httpCode).to.equal(HTTPCodes.noHttpCoverage);
            expect(callbackArgs[0].message).deep.equal('Received HTTP Code of 403');
        });

        it('should have an httpCode and an error message passed to the callback on a 404', async () => {
            const mpInstance: IMParticleWebSDKInstance = mParticle.getInstance();
            const identityApiClient = new IdentityAPIClient(mpInstance);
            const aliasRequest: IAliasRequest = {
                destinationMpid: '123',
                sourceMpid: '456',
                startTime: 10001230123,
                endTime: 10001231123,
            };

            const aliasCallback = sinon.spy();
            fetchMock.post(aliasUrl, {
                status: HTTP_NOT_FOUND,
                body: null,
            });

            await identityApiClient.sendAliasRequest(
                aliasRequest,
                aliasCallback
            );
            expect(aliasCallback.calledOnce).to.eq(true);
            const callbackArgs = aliasCallback.getCall(0).args;
            expect(callbackArgs[0].httpCode).to.equal(HTTPCodes.noHttpCoverage);
            expect(callbackArgs[0].message).deep.equal('Received HTTP Code of 404');
        });

        it('should have an httpCode and an error message passed to the callback on a 500', async () => {
            const mpInstance: IMParticleWebSDKInstance = mParticle.getInstance();
            const identityApiClient = new IdentityAPIClient(mpInstance);
            const aliasRequest: IAliasRequest = {
                destinationMpid: '123',
                sourceMpid: '456',
                startTime: 10001230123,
                endTime: 10001231123,
            };

            const aliasCallback = sinon.spy();
            fetchMock.post(aliasUrl, {
                status: HTTP_SERVER_ERROR,
                body: {
                    "Errors": [
                        {
                            "code": "INTERNAL_ERROR",
                            "message": "An unknown error was encountered."
                        }
                    ],
                    "ErrorCode": "INTERNAL_ERROR",
                    "StatusCode": 500,
                    "RequestId": null
                },
            });

            await identityApiClient.sendAliasRequest(
                aliasRequest,
                aliasCallback
            );
            expect(aliasCallback.calledOnce).to.eq(true);
            const callbackArgs = aliasCallback.getCall(0).args;
            expect(callbackArgs[0].httpCode).to.equal(HTTPCodes.noHttpCoverage);
            expect(callbackArgs[0].message).deep.equal('Received HTTP Code of 500');
        });
    });
});
