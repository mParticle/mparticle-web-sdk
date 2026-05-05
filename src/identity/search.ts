import Constants, { HTTP_OK, HTTP_NOT_FOUND } from '../constants';
import { SDKLoggerApi } from '../sdkRuntimeModels';
import { Environment, isEmpty, isFunction } from '../utils';
import {
    AsyncUploader,
    FetchUploader,
    IFetchPayload,
    XHRUploader,
} from '../uploaders';
import {
    ErrorCodes,
    IErrorReportingService,
    WSDKErrorSeverity,
} from '../reporting/types';
import { IdentityApiData, UserIdentities } from '@mparticle/web-sdk';
import Validators from '../validators';

const { HTTPCodes } = Constants;

/**
 * Body payload returned by the `/v1/search` endpoint, as parsed JSON.
 *
 * The shape mirrors `/v1/identify` responses. All fields are optional because
 * non-200 responses (e.g. 404 NOT_FOUND_ERROR) may include partial or
 * error-shaped bodies, and the consumer should only rely on body fields when
 * `httpCode === 200`.
 */
export interface IIdentitySearchResponseBody {
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
export interface IIdentitySearchResult {
    httpCode: number;
    body?: IIdentitySearchResponseBody;
}

export type IdentitySearchCallback = (result: IIdentitySearchResult) => void;

/**
 * Body posted to `/v1/search`. Mirrors the `/v1/identify` request envelope so
 * that the IDSync service can correlate requests across endpoints.
 */
export interface IIdentitySearchRequestBody {
    client_sdk: {
        platform: string;
        sdk_vendor: string;
        sdk_version: string;
    };
    environment: Environment;
    request_id: string;
    request_timestamp_ms: number;
    known_identities: UserIdentities;
}

interface IIdentitySearchPayload extends IFetchPayload {
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
 *  - No identifier with a non-empty string value -> callback with
 *    `{ httpCode: noHttpCoverage }`, no network call.
 *  - Missing `apiKey` -> callback with `{ httpCode: noHttpCoverage }`,
 *    no network call.
 *  - Network/JSON-parse errors are caught and surfaced via the callback,
 *    never thrown. Network errors are also reported through the optional
 *    `errorReporter` so any registered IErrorReportingService can observe
 *    them (matches the pattern used by identifyRequest in identityApiClient).
 */
export const sendSearchRequest = async (
    knownIdentities: UserIdentities,
    apiKey: string,
    requestBuilder: () => Omit<IIdentitySearchRequestBody, 'known_identities'>,
    searchUrl: string,
    callback: IdentitySearchCallback,
    logger: SDKLoggerApi,
    uploader?: AsyncUploader,
    errorReporter?: IErrorReportingService,
): Promise<void> => {
    // Validate the callback up front. If it isn't a function we have nowhere
    // to deliver a result to, so log and bail out without invoking anything.
    if (!isFunction(callback)) {
        logger.error(
            'search called without a callback function; skipping request.',
        );
        return;
    }

    const safeInvoke = (result: IIdentitySearchResult): void => {
        try {
            callback(result);
        } catch (e) {
            logger.error(
                'Error invoking search callback: ' +
                    ((e as Error)?.message || String(e)),
            );
        }
    };

    const cleanedKnownIdentities: UserIdentities = Validators.removeFalsyIdentityValues(
        { userIdentities: knownIdentities ?? {} } as IdentityApiData,
        logger,
    ).userIdentities;

    // No usable identifier -> deliver httpCode: noHttpCoverage so callers
    // waiting on the callback (e.g. to clear a loading state) don't hang.
    if (
        isEmpty(cleanedKnownIdentities) ||
        !Object.values(cleanedKnownIdentities).some(
            (v) => typeof v === 'string' && v.length > 0,
        )
    ) {
        logger.verbose(
            'Identity search called with non empty identifiers; skipping request.',
        );
        safeInvoke({ httpCode: HTTPCodes.noHttpCoverage });
        return;
    }

    // No API key -> same: deliver noHttpCoverage rather than hanging.
    if (!apiKey) {
        logger.verbose(
            'search called without a workspace API key; skipping request.',
        );
        safeInvoke({ httpCode: HTTPCodes.noHttpCoverage });
        return;
    }

    // Wrap request setup AND the network call in the try/catch so any throw
    // — from requestBuilder, JSON.stringify (e.g. circular refs), or
    // uploader construction — flows into the catch below and the consumer's
    // callback fires with noHttpCoverage rather than the async function
    // rejecting and the caller hanging on a never-fired callback.
    try {
        const requestEnvelope = requestBuilder();

        const requestBody: IIdentitySearchRequestBody = {
            ...requestEnvelope,
            known_identities: { ...cleanedKnownIdentities },
        };

        const fetchPayload: IIdentitySearchPayload = {
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

        logger.verbose('Sending search request to ' + searchUrl);
        const response: Response = await api.upload(fetchPayload, searchUrl);

        let body: IIdentitySearchResponseBody | undefined;

        // FetchUploader returns a real Response with .json(); XHRUploader
        // returns an XHR-shaped object with `responseText`. We tolerate both.
        if (isFunction(response.json)) {
            try {
                body = (await response.json()) as IIdentitySearchResponseBody;
            } catch (e) {
                logger.verbose(
                    'search response had no parseable JSON body.',
                );
            }
        } else {
            const xhrLike = (response as unknown) as XMLHttpRequest;
            if (xhrLike?.responseText) {
                try {
                    body = JSON.parse(xhrLike.responseText) as IIdentitySearchResponseBody;
                } catch (e) {
                    logger.verbose(
                        'search XHR response was not valid JSON.',
                    );
                }
            }
        }

        if (response.status === HTTP_OK) {
            logger.verbose('search received 200 OK.');
        } else if (response.status === HTTP_NOT_FOUND) {
            // 404 NOT_FOUND_ERROR is an expected steady-state outcome and is
            // intentionally not logged as an error.
            logger.verbose('search received 404 (no match).');
        } else {
            logger.verbose(
                'search received non-success status ' + response.status,
            );
        }

        safeInvoke({ httpCode: response.status, body });
    } catch (e) {
        const message = (e as Error)?.message || String(e);
        const reportMessage = 'Error sending search request: ' + message;
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
