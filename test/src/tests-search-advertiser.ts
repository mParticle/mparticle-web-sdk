import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { expect } from 'chai';
import { apiKey, MPConfig, urls, testMPID } from './config/constants';
import Constants from '../../src/constants';
import { Logger } from '../../src/logger';
import { IMParticleInstanceManager, SDKLoggerApi } from '../../src/sdkRuntimeModels';
import {
    ISearchAdvertiserResult,
    sendSearchAdvertiserRequest,
} from '../../src/searchAdvertiser';
import Utils from './config/utils';
const { fetchMockSuccess } = Utils;

const { HTTPCodes } = Constants;

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
        fetchMock: any;
    }
}

const searchUrl = `https://identity.mparticle.com/v1/search`;

const buildEnvelope = () => ({
    client_sdk: {
        platform: 'web',
        sdk_vendor: 'mparticle',
        sdk_version: '2.66.0',
    },
    environment: 'development' as const,
    request_id: 'fixed-request-id',
    request_timestamp_ms: 1735689600000,
});

describe('searchAdvertiser', () => {
    let logger: SDKLoggerApi;

    beforeEach(() => {
        // Some tests below boot up window.mParticle to verify the public
        // Identity.searchAdvertiser surface; reset between tests so they
        // don't interfere with each other.
        window.mParticle._resetForTests(MPConfig);
        fetchMockSuccess(urls.identify, {
            mpid: testMPID,
            is_logged_in: false,
        });

        logger = new Logger(window.mParticle.config);
    });

    afterEach(() => {
        sinon.restore();
        fetchMock.restore();
    });

    describe('sendSearchAdvertiserRequest (network layer)', () => {
        it('invokes the callback with httpCode 200 and the parsed body on success', async () => {
            const responseBody = {
                context: 'ctx-123',
                mpid: 'matched-mpid',
                matched_identities: { email: 'hashed-email' },
                is_ephemeral: false,
                is_logged_in: true,
            };
            fetchMock.post(searchUrl, {
                status: 200,
                body: JSON.stringify(responseBody),
            });

            const callback = sinon.spy();
            await sendSearchAdvertiserRequest(
                { email: 'user@example.com' },
                apiKey,
                buildEnvelope,
                searchUrl,
                callback,
                logger,
            );

            expect(callback.calledOnce).to.eq(true);
            const result = callback.getCall(0).args[0] as ISearchAdvertiserResult;
            expect(result.httpCode).to.equal(200);
            expect(result.body).to.deep.equal(responseBody);
        });

        it('forwards x-mp-key, content-type, and a JSON body matching the /v1/identify envelope', async () => {
            fetchMock.post(searchUrl, {
                status: 200,
                body: JSON.stringify({ mpid: 'm' }),
            });

            await sendSearchAdvertiserRequest(
                { email: 'user@example.com' },
                apiKey,
                buildEnvelope,
                searchUrl,
                () => undefined,
                logger,
            );

            const lastCall = fetchMock.lastCall(searchUrl);
            expect(lastCall, 'POST was issued to the search URL').to.be.ok;
            const init = lastCall![1] as RequestInit;
            const headers = init.headers as Record<string, string>;
            expect(headers['x-mp-key']).to.equal(apiKey);
            expect(headers['Content-Type']).to.equal('application/json');

            const sentBody = JSON.parse(init.body as string);
            expect(sentBody).to.have.keys(
                'client_sdk',
                'environment',
                'request_id',
                'request_timestamp_ms',
                'known_identities',
            );
            expect(sentBody.known_identities).to.deep.equal({
                email: 'user@example.com',
            });
            expect(sentBody.client_sdk).to.deep.equal({
                platform: 'web',
                sdk_vendor: 'mparticle',
                sdk_version: '2.66.0',
            });
            expect(sentBody.environment).to.equal('development');
        });

        it('surfaces httpCode 404 cleanly and parses NOT_FOUND_ERROR body without throwing', async () => {
            const notFoundBody = {
                Errors: [{ code: 'NOT_FOUND_ERROR', message: 'No match' }],
            };
            fetchMock.post(searchUrl, {
                status: 404,
                body: JSON.stringify(notFoundBody),
            });

            const callback = sinon.spy();
            await sendSearchAdvertiserRequest(
                { email: 'unknown@example.com' },
                apiKey,
                buildEnvelope,
                searchUrl,
                callback,
                logger,
            );

            expect(callback.calledOnce).to.eq(true);
            const result = callback.getCall(0).args[0] as ISearchAdvertiserResult;
            expect(result.httpCode).to.equal(404);
            // Body is best-effort parsed; we don't assert its exact shape
            // beyond "it didn't throw".
            expect(result.body).to.deep.equal(notFoundBody);
        });

        it('invokes the callback with noHttpCoverage when the API key is missing (no network call)', async () => {
            const callback = sinon.spy();
            const requestBuilderSpy = sinon.spy(buildEnvelope);

            await sendSearchAdvertiserRequest(
                { email: 'user@example.com' },
                '',
                requestBuilderSpy,
                searchUrl,
                callback,
                logger,
            );

            expect(fetchMock.calls(searchUrl).length).to.equal(0);
            expect(requestBuilderSpy.called).to.eq(false);
            // Missing apiKey: no network, but callback fires so callers can
            // resolve any loading state they're holding open.
            expect(callback.calledOnce).to.eq(true);
            const result = callback.getCall(0).args[0] as ISearchAdvertiserResult;
            expect(result.httpCode).to.equal(HTTPCodes.noHttpCoverage);
        });

        it('returns silently and does not throw when the callback is not a function', async () => {
            const requestBuilderSpy = sinon.spy(buildEnvelope);
            let threw = false;
            try {
                await sendSearchAdvertiserRequest(
                    { email: 'user@example.com' },
                    apiKey,
                    requestBuilderSpy,
                    searchUrl,
                    (undefined as unknown) as any,
                    logger,
                );
            } catch (e) {
                threw = true;
            }
            expect(threw, 'should not throw on missing callback').to.eq(false);
            expect(fetchMock.calls(searchUrl).length).to.equal(0);
            expect(requestBuilderSpy.called).to.eq(false);
        });

        it('invokes the callback with noHttpCoverage when knownIdentities.email is missing or invalid (no network)', async () => {
            const callback = sinon.spy();

            await sendSearchAdvertiserRequest(
                ({} as any),
                apiKey,
                buildEnvelope,
                searchUrl,
                callback,
                logger,
            );

            await sendSearchAdvertiserRequest(
                ({ email: '' } as any),
                apiKey,
                buildEnvelope,
                searchUrl,
                callback,
                logger,
            );

            await sendSearchAdvertiserRequest(
                ({ email: 12345 } as any),
                apiKey,
                buildEnvelope,
                searchUrl,
                callback,
                logger,
            );

            // Missing/invalid email: no network, but callback fires for each
            // call so callers can resolve any pending loading state.
            expect(fetchMock.calls(searchUrl).length).to.equal(0);
            expect(callback.callCount).to.equal(3);
            for (let i = 0; i < callback.callCount; i++) {
                const result = callback.getCall(i).args[0] as ISearchAdvertiserResult;
                expect(result.httpCode).to.equal(HTTPCodes.noHttpCoverage);
            }
        });

        it('catches network errors and surfaces noHttpCoverage via the callback (not thrown)', async () => {
            fetchMock.post(searchUrl, { throws: new Error('network down') });

            const callback = sinon.spy();
            let threw = false;
            try {
                await sendSearchAdvertiserRequest(
                    { email: 'user@example.com' },
                    apiKey,
                    buildEnvelope,
                    searchUrl,
                    callback,
                    logger,
                );
            } catch (e) {
                threw = true;
            }

            expect(threw, 'should not throw on network error').to.eq(false);
            expect(callback.calledOnce).to.eq(true);
            const result = callback.getCall(0).args[0] as ISearchAdvertiserResult;
            expect(result.httpCode).to.equal(HTTPCodes.noHttpCoverage);
        });

        it('catches errors thrown during request setup (e.g. requestBuilder) and surfaces noHttpCoverage via the callback', async () => {
            // The try/catch must wrap requestBuilder, JSON.stringify, and
            // uploader construction — not just the network call. If any
            // synchronous setup step throws, the consumer's callback must
            // still fire (otherwise a discarded Promise becomes an unhandled
            // rejection and the consumer hangs on a never-fired callback).
            const callback = sinon.spy();
            const throwingBuilder = () => {
                throw new Error('builder boom');
            };
            let threw = false;
            try {
                await sendSearchAdvertiserRequest(
                    { email: 'user@example.com' },
                    apiKey,
                    throwingBuilder,
                    searchUrl,
                    callback,
                    logger,
                );
            } catch (e) {
                threw = true;
            }

            expect(threw, 'should not throw on setup error').to.eq(false);
            expect(callback.calledOnce).to.eq(true);
            const result = callback.getCall(0).args[0] as ISearchAdvertiserResult;
            expect(result.httpCode).to.equal(HTTPCodes.noHttpCoverage);
            // No network call should have been made.
            expect(fetchMock.calls(searchUrl).length).to.equal(0);
        });

        it('reports a structured error through the supplied errorReporter on network failure', async () => {
            fetchMock.post(searchUrl, { throws: new Error('network down') });

            const callback = sinon.spy();
            const errorReporter = { report: sinon.spy() };

            await sendSearchAdvertiserRequest(
                { email: 'user@example.com' },
                apiKey,
                buildEnvelope,
                searchUrl,
                callback,
                logger,
                undefined,
                errorReporter,
            );

            expect(errorReporter.report.calledOnce).to.eq(true);
            const reported = errorReporter.report.getCall(0).args[0];
            expect(reported.severity).to.equal('ERROR');
            expect(reported.code).to.equal('IDENTITY_REQUEST');
            expect(reported.message).to.match(/searchAdvertiser/);
            expect(reported.message).to.match(/network down/);
        });

        it('handles a non-JSON response body without throwing', async () => {
            fetchMock.post(searchUrl, {
                status: 200,
                body: 'not-json',
                headers: { 'Content-Type': 'text/plain' },
            });

            const callback = sinon.spy();
            await sendSearchAdvertiserRequest(
                { email: 'user@example.com' },
                apiKey,
                buildEnvelope,
                searchUrl,
                callback,
                logger,
            );

            expect(callback.calledOnce).to.eq(true);
            const result = callback.getCall(0).args[0] as ISearchAdvertiserResult;
            expect(result.httpCode).to.equal(200);
            expect(result.body).to.be.undefined;
        });
    });

    describe('mParticle.Identity.searchAdvertiser (public surface)', () => {
        const advertiserApiKey = 'advertiser_api_key';

        beforeEach(() => {
            window.mParticle.init(apiKey, window.mParticle.config);
        });

        it('is exposed on the Identity namespace', () => {
            expect(typeof (window.mParticle.Identity as any).searchAdvertiser).to.equal(
                'function',
            );
        });

        it('issues a POST to /v1/search with the caller-supplied x-mp-key and a known_identities email', async () => {
            fetchMock.post(searchUrl, {
                status: 200,
                body: JSON.stringify({ mpid: 'matched' }),
            });

            const callback = sinon.spy();
            (window.mParticle.Identity as any).searchAdvertiser(
                advertiserApiKey,
                { email: 'user@example.com' },
                callback,
            );

            // fetch-mock + the response.json() await chain need a few ticks
            // before the callback resolves; flush the microtask queue.
            await fetchMock.flush(true);
            await new Promise(resolve => setTimeout(resolve, 10));

            const lastCall = fetchMock.lastCall(searchUrl);
            expect(lastCall, 'POST was issued to /v1/search').to.be.ok;

            const init = lastCall![1] as RequestInit;
            const headers = init.headers as Record<string, string>;
            // Must use the advertiser-supplied key, NOT the SDK's workspace token.
            expect(headers['x-mp-key']).to.equal(advertiserApiKey);
            expect(headers['x-mp-key']).to.not.equal(apiKey);

            const sentBody = JSON.parse(init.body as string);
            expect(sentBody.known_identities).to.deep.equal({
                email: 'user@example.com',
            });
            expect(sentBody.client_sdk.platform).to.equal('web');
            expect(sentBody.client_sdk.sdk_vendor).to.equal('mparticle');
            expect(typeof sentBody.request_id).to.equal('string');
            expect(typeof sentBody.request_timestamp_ms).to.equal('number');

            expect(callback.calledOnce).to.eq(true);
            const result = callback.getCall(0).args[0] as ISearchAdvertiserResult;
            expect(result.httpCode).to.equal(200);
            expect(result.body).to.deep.equal({ mpid: 'matched' });
        });

        it('does not throw and logs an error when called without a callback', () => {
            expect(() =>
                (window.mParticle.Identity as any).searchAdvertiser(
                    advertiserApiKey,
                    { email: 'user@example.com' },
                ),
            ).to.not.throw();
        });

        it('invokes the callback with noHttpCoverage (no network call) when the caller passes an empty apiKey', async () => {
            fetchMock.post(searchUrl, {
                status: 200,
                body: JSON.stringify({ mpid: 'should-not-be-called' }),
            });

            const callback = sinon.spy();
            (window.mParticle.Identity as any).searchAdvertiser(
                '',
                { email: 'user@example.com' },
                callback,
            );

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(fetchMock.calls(searchUrl).length).to.equal(0);
            expect(callback.calledOnce).to.eq(true);
            const result = callback.getCall(0).args[0] as ISearchAdvertiserResult;
            expect(result.httpCode).to.equal(HTTPCodes.noHttpCoverage);
        });

        it('skips the request and invokes the callback with loggingDisabledOrMissingAPIKey when the SDK is opted out', async () => {
            fetchMock.post(searchUrl, {
                status: 200,
                body: JSON.stringify({ mpid: 'should-not-be-called' }),
            });

            // Wait for init's /identify round-trip to finish so setOptOut isn't
            // queued by `queueIfNotInitialized` (it's a no-op until the SDK is ready).
            await new Promise(resolve => setTimeout(resolve, 50));

            window.mParticle.setOptOut(true);

            const callback = sinon.spy();
            (window.mParticle.Identity as any).searchAdvertiser(
                advertiserApiKey,
                { email: 'user@example.com' },
                callback,
            );

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(fetchMock.calls(searchUrl).length).to.equal(0);
            expect(callback.calledOnce).to.eq(true);
            const result = callback.getCall(0).args[0] as ISearchAdvertiserResult & {
                getUser?: unknown;
                getPreviousUser?: unknown;
            };
            expect(result.httpCode).to.equal(HTTPCodes.loggingDisabledOrMissingAPIKey);
            // Result must conform to ISearchAdvertiserResult: no body string,
            // and none of the standard Identity-callback `getUser`/`getPreviousUser`
            // helpers (which would leak through if `_Helpers.invokeCallback` were
            // used to deliver this result).
            expect(result.body).to.equal(undefined);
            expect(result.getUser).to.equal(undefined);
            expect(result.getPreviousUser).to.equal(undefined);

            // Restore opt-in so the next test's beforeEach reset isn't fighting state.
            window.mParticle.setOptOut(false);
        });
    });
});
