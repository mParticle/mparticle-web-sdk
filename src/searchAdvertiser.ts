import Constants, { HTTP_OK, HTTP_NOT_FOUND } from './constants';
import { SDKLoggerApi } from './sdkRuntimeModels';
import {
    AsyncUploader,
    FetchUploader,
    IFetchPayload,
    XHRUploader,
} from './uploaders';

const { HTTPCodes } = Constants;

/**
 * Shape of `known_identities` accepted by `searchAdvertiser`.
 *
 * The IDSync `/v1/search` endpoint accepts the same identity keys as
 * `/v1/identify`, but for v1 of this client API we only support `email`.
 * Additional identity types can be added here in the future without breaking
 * existing consumers.
 */
export interface ISearchAdvertiserKnownIdentities {
    email: string;
}

/**
 * Body payload returned by the `/v1/search` endpoint, as parsed JSON.
 *
 * The shape mirrors `/v1/identify` responses. All fields are optional because
 * non-200 responses (e.g. 404 NOT_FOUND_ERROR) may include partial or
 * error-shaped bodies, and the consumer should only rely on body fields when
 * `httpCode === 200`.
 */
export interface ISearchAdvertiserResponseBody {
    context?: string | null;
    mpid?: string;
    matched_identities?: Record<string, string>;
    is_ephemeral?: boolean;
    is_logged_in?: boolean;
}

/**
 * Result delivered to the consumer's callback. `httpCode` is always present;
 * `body` is present whenever the response had a parseable JSON body.
 *
 * For non-network errors (missing API key, validation failures, JSON parse
 * errors) `httpCode` will be `HTTPCodes.noHttpCoverage` (-1) and `body` will
 * be omitted. The consumer is expected to gate behaviour on
 * `httpCode === 200`.
 */
export interface ISearchAdvertiserResult {
    httpCode: number;
    body?: ISearchAdvertiserResponseBody;
}

export type SearchAdvertiserCallback = (result: ISearchAdvertiserResult) => void;

/**
 * Body posted to `/v1/search`. Mirrors the `/v1/identify` request envelope so
 * that the IDSync service can correlate requests across endpoints.
 */
export interface ISearchAdvertiserRequestBody {
    client_sdk: {
        platform: string;
        sdk_vendor: string;
        sdk_version: string;
    };
    environment: 'development' | 'production';
    request_id: string;
    request_timestamp_ms: number;
    known_identities: ISearchAdvertiserKnownIdentities;
}

interface ISearchAdvertiserPayload extends IFetchPayload {
    headers: {
        Accept: string;
        'Content-Type': string;
        Authorization: string;
    };
}

/**
 * Encode a UTF-8 string as base64. Browsers expose `btoa`, but it only handles
 * Latin-1; for the IDSync use case the inputs are workspace API keys/secrets
 * (ASCII), so `btoa` is sufficient. We fall back to a manual table only in the
 * unlikely event `btoa` is unavailable.
 */
const toBase64 = (input: string): string => {
    if (typeof btoa === 'function') {
        return btoa(input);
    }
    // Minimal fallback for non-DOM hosts; the SDK runs in browsers, so this
    // path should never execute in practice.
    /* istanbul ignore next */
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(input, 'utf-8').toString('base64');
    }
    /* istanbul ignore next */
    throw new Error('No base64 encoder available.');
};

/**
 * Sends a POST to mParticle's IDSync Search endpoint and invokes `callback`
 * with the HTTP status and parsed body.
 *
 * Auth: HTTP Basic with `Authorization: Basic <base64(apiKey:secret)>`.
 * Per https://docs.mparticle.com/developers/apis/idsync/#search the Search
 * endpoint requires Basic (key+secret) or HMAC auth; key-only auth is not
 * generally provisioned. For Web workspaces the "secret" ships in the
 * browser bundle and is not actually a secret.
 *
 * Defensive contract:
 *  - Missing/invalid `email`           -> no network call, no callback.
 *  - Missing `apiKey` or `secret`      -> no network call, no callback.
 *  - Non-function `callback`           -> no network call, logged.
 *  - Network/JSON-parse errors         -> callback with
 *                                         `{ httpCode: noHttpCoverage }`,
 *                                         never thrown.
 */
export const sendSearchAdvertiserRequest = async (
    knownIdentities: ISearchAdvertiserKnownIdentities,
    apiKey: string,
    secret: string,
    requestBuilder: () => Omit<ISearchAdvertiserRequestBody, 'known_identities'>,
    searchUrl: string,
    callback: SearchAdvertiserCallback,
    logger: SDKLoggerApi,
    uploader?: AsyncUploader,
): Promise<void> => {
    // Validate the callback up front. If it isn't a function we have nowhere
    // to deliver a result to, so log and bail out without invoking anything.
    if (typeof callback !== 'function') {
        logger.error(
            'searchAdvertiser called without a callback function; skipping request.',
        );
        return;
    }

    const safeInvoke = (result: ISearchAdvertiserResult): void => {
        try {
            callback(result);
        } catch (e) {
            logger.error(
                'Error invoking searchAdvertiser callback: ' +
                    ((e as Error)?.message || String(e)),
            );
        }
    };

    // No valid email -> no request, and no callback. The consumer (Rokt kit)
    // only reacts on httpCode === 200, so missing inputs are silently inert.
    if (!knownIdentities || typeof knownIdentities.email !== 'string' || !knownIdentities.email) {
        logger.verbose(
            'searchAdvertiser called without a valid email; skipping request.',
        );
        return;
    }

    // Both halves of the Basic auth credential are required.
    if (!apiKey || !secret) {
        logger.verbose(
            'searchAdvertiser called without a complete apiKey+secret credential; skipping request.',
        );
        return;
    }

    const requestEnvelope = requestBuilder();
    const requestBody: ISearchAdvertiserRequestBody = {
        ...requestEnvelope,
        known_identities: {
            email: knownIdentities.email,
        },
    };

    const fetchPayload: ISearchAdvertiserPayload = {
        method: 'post',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Basic ' + toBase64(apiKey + ':' + secret),
        },
        body: JSON.stringify(requestBody),
    };

    const api: AsyncUploader =
        uploader ||
        (window.fetch
            ? new FetchUploader(searchUrl)
            : new XHRUploader(searchUrl));

    try {
        logger.verbose('Sending searchAdvertiser request to ' + searchUrl);
        const response: Response = await api.upload(fetchPayload, searchUrl);

        let body: ISearchAdvertiserResponseBody | undefined;

        // FetchUploader returns a real Response with .json(); XHRUploader
        // returns an XHR-shaped object with `responseText`. We tolerate both.
        if (typeof (response as Response).json === 'function') {
            try {
                body = (await (response as Response).json()) as ISearchAdvertiserResponseBody;
            } catch (e) {
                logger.verbose(
                    'searchAdvertiser response had no parseable JSON body.',
                );
            }
        } else {
            const xhrLike = (response as unknown) as XMLHttpRequest;
            if (xhrLike?.responseText) {
                try {
                    body = JSON.parse(xhrLike.responseText) as ISearchAdvertiserResponseBody;
                } catch (e) {
                    logger.verbose(
                        'searchAdvertiser XHR response was not valid JSON.',
                    );
                }
            }
        }

        if (response.status === HTTP_OK) {
            logger.verbose('searchAdvertiser received 200 OK.');
        } else if (response.status === HTTP_NOT_FOUND) {
            // 404 NOT_FOUND_ERROR is an expected steady-state outcome and is
            // intentionally not logged as an error.
            logger.verbose('searchAdvertiser received 404 (no match).');
        } else {
            logger.verbose(
                'searchAdvertiser received non-success status ' + response.status,
            );
        }

        safeInvoke({ httpCode: response.status, body });
    } catch (e) {
        const message = (e as Error)?.message || String(e);
        logger.error('Error sending searchAdvertiser request: ' + message);
        safeInvoke({ httpCode: HTTPCodes.noHttpCoverage });
    }
};
