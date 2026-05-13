import { SDKLoggerApi } from '../sdkRuntimeModels';
import { Environment } from '../utils';
import { AsyncUploader } from '../uploaders';
import { IErrorReportingService } from '../reporting/types';
import { UserIdentities } from '../publicSdkTypes';
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
export declare const sendSearchRequest: (knownIdentities: UserIdentities, apiKey: string, requestBuilder: () => Omit<IIdentitySearchRequestBody, 'known_identities'>, searchUrl: string, callback: IdentitySearchCallback, logger: SDKLoggerApi, uploader?: AsyncUploader, errorReporter?: IErrorReportingService) => Promise<void>;
