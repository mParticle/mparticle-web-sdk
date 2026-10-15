---
name: debug-api
description: Debug HTTP/network/API failures in mParticle Web SDK including fetch failed/fetch error/request failed/API call failed/endpoint not responding/401 unauthorized/403 forbidden/404 not found/500 internal server error/502 bad gateway/503 service unavailable/504 gateway timeout/network error/timeout/ETIMEDOUT/connection timeout/ECONNREFUSED/response format wrong/DTO mismatch/type mismatch in response/unexpected response/null response/undefined response/empty response/missing data/API contract changed/batch upload failed/identity API failed/config API failed/events API failed
---

# API Debug Skill - Web SDK

## Purpose
Diagnose network/API failures in the mParticle Web SDK through systematic request/response inspection and API client debugging.

## Core Principles
- **Network tab is truth**: Inspect actual requests, not assumptions
- **Mock vs real divergence**: fetch-mock works but real API fails → contract drift
- **Batch timing matters**: Events batched before upload (100 events or 30 seconds)
- **Three API systems**: Events, Identity, and Config APIs have different shapes

## Architecture Context
HTTP clients in `src/apiClient.ts` (Events), `src/identityApiClient.ts` (Identity), `src/configAPIClient.ts` (Config). Uses fetch API. Batch upload in `src/batchUploader.ts`. Tests use fetch-mock for HTTP mocking.

## Failure Classification

**Request never sent:**
- Network offline → browser blocking
- Batch not full → waiting for 100 events or 30 second interval
- API client not initialized → SDK init failed
- Config disabled feature → server config blocking

**Request fails:**
- 401 → Auth token invalid/expired
- 403 → Workspace permissions issue
- 404 → URL wrong (trailing slash, workspace ID, endpoint)
- 500 → Backend error (check server logs)
- Timeout → slow network/server hang
- CORS → should not happen with mParticle APIs (same-origin or configured)

**Response wrong:**
- DTO mismatch → backend changed contract
- Null/undefined → optional fields missing
- Type error → response shape unexpected
- Empty response → valid but no data

**SDK-specific issues:**
- Batch upload stuck → timer not advancing
- Identity callback not fired → response parsing failed
- Config not loading → initial config fetch failed
- Events not forwarding → kits not initialized

## Investigation Strategy

### 1. Network Inspection
Use browser DevTools Network tab:
- Request URL (exact match with workspace ID)
- Request headers (Content-Type, User-Agent)
- Request payload (batch structure, identity request)
- Response status (200/401/403/404/500)
- Response body (success flags, error messages)
- Timing (slow? timeout?)

### 2. API Client State
Log client state:
```typescript
// In apiClient.ts
console.log({ url, payload, config: mpInstance._Store })

// In identityApiClient.ts
console.log({ identityRequest, callback })

// In batchUploader.ts
console.log({ batchSize, uploadInterval, queuedEvents })
```

### 3. Verify API Endpoints
Check endpoint construction:
- Events: `/v1/[workspace]/events`
- Identity: `/v1/[workspace]/identify` (or `/login`, `/logout`, `/modify`)
- Config: `/v1/[workspace]/config`

Ensure workspace ID (devToken/apiKey) is correct.

### 4. fetch-mock vs Real API
If fetch-mock works but real fails:
- Compare mock URL vs real endpoint
- Check mock response shape vs real DTO
- Verify auth headers match
- Look for hardcoded test data

## Common Root Causes

**Auth failures:**
- API key (devToken) missing or wrong
- API key passed incorrectly in request
- Workspace disabled or suspended
- Environment mismatch (dev key in production)

**Events API issues:**
- Batch structure malformed
- Event validation failed (data plan)
- Consent state blocking events
- Kit filtering rules blocking

**Identity API issues:**
- Identity request validation failed
- MPID not found (new user)
- Identity callback error → silent failure
- User identities malformed

**Config API issues:**
- Config fetch failed → kits not initialized
- Config cache stale → using old settings
- Server-side config override → unexpected behavior

**Batch upload issues:**
- Timer not advancing → events never sent
- Batch size threshold not met → waiting for 100 events
- Upload interval not met → waiting for 30 seconds
- Network offline → queued but not sent

## Obscure Debugging Vectors

- **Network throttling**: Fast 3G reveals timeout issues
- **Disable cache**: Force fresh requests to test caching theory
- **Copy as fetch**: Right-click network request → replay in console
- **fetch-mock logging**: Enable fetch-mock logging in tests
- **Batch queue inspection**: Log `mpInstance._Batch` to see queued events
- **Identity MPID check**: Verify MPID exists in localStorage
- **Config inspection**: Check `mpInstance._Store` for loaded config
- **Session ID check**: Verify session ID in event payload

## Debugging Flow

1. Reproduce failure, open network tab
2. Identify request: sent? failed? wrong response?
3. Check API key (devToken) in request
4. Verify endpoint URL format (workspace ID, path)
5. Compare fetch-mock handler vs real API response
6. Log API client state before/after request
7. Check batch queue status (if Events API)
8. Test with network throttling enabled

## Success Criteria
- Request succeeds with correct response
- Events uploaded to mParticle servers
- Identity callbacks fire correctly
- Config loaded and applied
- Works across 3+ attempts (no fluke)
- Screenshot: network tab + successful response

## SDK-Specific API Patterns

**Events API (`/v1/[workspace]/events`):**
- Batch of events in payload
- Response indicates success/failure per event
- Retry logic for failed uploads
- Validate event structure before sending

**Identity API (`/v1/[workspace]/identify`):**
- Single identity request
- Callback with result (success/error)
- MPID returned in response
- User identities in request

**Config API (`/v1/[workspace]/config`):**
- Fetched on SDK init
- Contains kit configurations
- Workspace settings
- Feature flags

**Common Headers:**
```
Content-Type: application/json
User-Agent: mParticle web SDK
```

## Test Debugging

**fetch-mock configuration:**
```typescript
import fetchMock from 'fetch-mock/esm/client'

fetchMock.post('/v1/test-workspace/events', {
  status: 200,
  body: { Store: true }
})
```

**Verify mock called:**
```typescript
expect(fetchMock.called('/v1/test-workspace/events')).toBe(true)
```

**Check request payload:**
```typescript
const calls = fetchMock.calls('/v1/test-workspace/events')
console.log(JSON.parse(calls[0][1].body))
```

## Self-Improvement
**CRITICAL**: Update with:
- Events API contract changes
- Identity API error patterns
- Config API structure updates
- Batch upload timing solutions
- fetch-mock anti-patterns
- Common SDK API failures
