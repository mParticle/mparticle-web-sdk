import Constants, { HTTP_OK, HTTP_NOT_FOUND } from './constants';
import { SDKLoggerApi } from './sdkRuntimeModels';
import {
    AsyncUploader,
    FetchUploader,
    IFetchPayload,
    XHRUploader,
} from './uploaders';
import {
    ErrorCodes,
    IErrorReportingService,
    WSDKErrorSeverity,
} from './reporting/types';

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
        'x-mp-key': string;
    };
}

/**
 * Sends a POST to mParticle's IDSync Search endpoint and invokes `callback`
 * with the HTTP status and parsed body.
 *
 * Defensive contract:
 *  - Missing/invalid `email` -> callback with `{ httpCode: noHttpCoverage }`,
 *    no network call.
 *  - Missing `apiKey`        -> callback with `{ httpCode: noHttpCoverage }`,
 *    no network call.
 *  - Network/JSON-parse errors are caught and surfaced via the callback,
 *    never thrown. Network errors are also reported through the optional
 *    `errorReporter` so any registered IErrorReportingService can observe
 *    them (matches the pattern used by identifyRequest in identityApiClient).
 *
 * NOTE: There is a known CORS limitation at the Fastly edge in front of
 * `/v1/search`: it currently only allows `authorization,content-type` in
 * `Access-Control-Allow-Headers`, which means browsers will block requests
 * carrying `x-mp-key`. This is being addressed separately by the team that
 * owns the Fastly config. This SDK code is written assuming `x-mp-key` will
 * be allowed.
 */
export const sendSearchAdvertiserRequest = async (
    knownIdentities: ISearchAdvertiserKnownIdentities,
    apiKey: string,
    requestBuilder: () => Omit<ISearchAdvertiserRequestBody, 'known_identities'>,
    searchUrl: string,
    callback: SearchAdvertiserCallback,
    logger: SDKLoggerApi,
    uploader?: AsyncUploader,
    errorReporter?: IErrorReportingService,
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

    // No valid email -> deliver httpCode: noHttpCoverage so callers waiting on
    // the callback (e.g. to clear a loading state) don't hang.
    if (!knownIdentities || typeof knownIdentities.email !== 'string' || !knownIdentities.email) {
        logger.verbose(
            'searchAdvertiser called without a valid email; skipping request.',
        );
        safeInvoke({ httpCode: HTTPCodes.noHttpCoverage });
        return;
    }

    // No API key -> same: deliver noHttpCoverage rather than hanging.
    if (!apiKey) {
        logger.verbose(
            'searchAdvertiser called without a workspace API key; skipping request.',
        );
        safeInvoke({ httpCode: HTTPCodes.noHttpCoverage });
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
            'x-mp-key': apiKey,
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
        const reportMessage = 'Error sending searchAdvertiser request: ' + message;
        logger.error(reportMessage);
        // Mirror the identity-route pattern in identityApiClient.ts: log to
        // console AND push a structured report through the dispatcher so any
        // registered IErrorReportingService (e.g. the Rokt kit's) can observe
        // the failure.
        errorReporter?.report({
            message: reportMessage,
            code: ErrorCodes.IDENTITY_REQUEST,
            severity: WSDKErrorSeverity.ERROR,
        });
        safeInvoke({ httpCode: HTTPCodes.noHttpCoverage });
    }
};
