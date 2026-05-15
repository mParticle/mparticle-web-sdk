# DefinitelyTyped Drift Notes

This PR moves the Web SDK's public TypeScript surface into
`@mparticle/web-sdk` itself. The previous source of truth was
`@types/mparticle__web-sdk`; the new public entry point is generated from
`src/public-types.ts`.

The compatibility compile tests at
`test/types/definitely-typed/manager.ts` and
`test/types/definitely-typed/instance.ts` are based on the old DefinitelyTyped
tests. They use this package's real default runtime import and keep the old
namespace-style type examples through a local type-only namespace merge:

```ts
import mParticle from '@mparticle/web-sdk';
import type * as MParticleTypes from '@mparticle/web-sdk';
```

Their tsconfig maps that import to this package's generated declarations:

```json
"paths": {
    "@mparticle/web-sdk": ["dist/types/src/public-types.d.ts"]
}
```

That verifies existing DT-style type examples can compile against the SDK's
native declarations without depending on `@types/mparticle__web-sdk`, while
avoiding declarations for named runtime imports that the ESM bundle does not
emit.

The generated `dist/types` output is intentionally not part of this PR's source
diff. CI runs `npm run test:types`, which rebuilds declaration files from source
before compiling the consumer fixtures against the generated package entry
points.

## Public Type Ownership

- Added native public definitions for types previously supplied by
  `@types/mparticle__web-sdk`, including `MPConfiguration`, `MPID`,
  `IdentityApiData`, `UserIdentities`, consent types, ecommerce types,
  `SDKEventAttrs`, `SDKEventOptions`, and `SDKEventCustomFlags`.
- Kept the package entry point as a default-only runtime export. TypeScript
  consumers should import the SDK object as the default export and access members
  such as `mParticle.getInstance`, `mParticle.EventType`,
  `mParticle.Identity`, `mParticle.eCommerce`, and `mParticle.Consent`.
- Named runtime exports such as `import { init } from '@mparticle/web-sdk'` are
  intentionally not declared because the ESM bundle does not emit them.
- `window.mParticle` is globally augmented by the public entry point so snippet
  and browser-global consumers can type direct `window.mParticle` usage without
  relying on DefinitelyTyped.

## Public API Drift From DefinitelyTyped

### Manager And Instance

- `getInstance()` creates and returns the default instance when needed.
  `getInstance(instanceName)` returns `null` when that named instance has not
  already been initialized.
- `generateHash` returns `number`, matching the implementation. DT had this as a
  string-returning API.
- `setSessionAttribute` accepts the SDK's valid attribute values:
  `string | number | boolean | null | undefined`.
- `logError` supports both the object form and the string form used by existing
  consumers.
- `logLink` and `logForm` allow optional `eventType` and `eventInfo`, matching
  existing examples and runtime usage.
- `startTrackingLocation` accepts a location callback that receives a location
  object.

### Configuration

- `logLevel` includes `"error"` in addition to `"verbose"`, `"warning"`, and
  `"none"`.
- Added config fields used by the current SDK but absent from DT, including URL
  overrides and runtime options such as `aliasUrl`, `configUrl`, `identityUrl`,
  `v1SecureServiceUrl`, `v2SecureServiceUrl`, `v3SecureServiceUrl`,
  `requestConfig`, `integrationDelayTimeout`, `forceHttps`, `useNativeSdk`,
  `maxProducts`, `domain`, `isIOS`, and `launcherOptions`.
- `DataPlanConfig` supports an optional `document`, matching SDK data plan
  handling when server/snippet data plan documents are present.
- `SDKInitConfig` continues to expose SDK-specific config beyond legacy
  `MPConfiguration`, including kit, pixel, data plan blocking, Rokt launcher,
  logging, and feature flag options.

### Events

- `SDKEventOptions.shouldUploadEvent` is optional.
- `SDKEventOptions.sourceMessageId` is supported.
- `SDKEventCustomFlags` supports the broader values accepted by the SDK:
  primitives, arrays, and records.

### Identity

- `Identity.search` is exposed on the public Identity API.
- `IdentityApiData` includes `onUserAlias` and `copyUserAttributes`.
- `IdentityApiData.userIdentities` remains optional/null-capable for broad
  identity request compatibility, while `IdentifyRequest` keeps
  `userIdentities` required.
- `onUserAlias` is typed as the legacy callback shape
  `(previousUser, newUser) => void`, matching runtime behavior.
- `UserIdentities` accepts `null` values for legacy identity-clearing patterns.
- `UserIdentities` includes `email_sha256` and `mobile_sha256` aliases used by
  the SDK's identity normalization flow.
- `IdentityResult.body` is a union of the normal identity response body and the
  modify response body.
- `IdentityResultBody.mpid` is exposed as optional.
- Alias requests use a typed scope of `'device' | 'mpid'`.
- `Identity.aliasUsers` uses the alias callback result shape
  `{ httpCode: number; message: string }`.
- `Identity.logout` accepts `IdentityApiData`, `{}`, `null`, or `undefined`,
  matching existing usage.
- `User.getUserAudiences` is exposed as optional, matching runtime behavior.

### Consent

- `PrivacyConsentState` metadata fields are optional because the SDK can create
  consent objects with only the required `Consented` value.
- `Consent.createGDPRConsent` and `Consent.createCCPAConsent` return
  `PrivacyConsentState | null`, reflecting runtime validation failures.
- `ConsentState` includes both `removeCCPAConsentState` and the deprecated
  `removeCCPAState` compatibility method.

### Ecommerce

- Ecommerce factory methods are typed as nullable where the implementation can
  return `null` after validation failure.
- Product creation accepts string or number inputs for SKU, price, quantity,
  revenue, and shipping where runtime sanitization/conversion supports it.
- Public product types include SDK-created fields such as `CouponCode` and
  `TotalAmount`.
- Impressions support a single product or product arrays.
- Promotions require `Id` on successfully created promotion objects and support
  string or number IDs, matching `createPromotion` input validation.
- Promotion and impression logging accept single objects or arrays, matching
  runtime behavior.

### Sideloaded Kits

- `MPSideloadedKit` is exposed as a public constructor on the package surface,
  matching the runtime manager object and the documented sideloaded-kit setup
  flow.
- `KitFilterSettings` is exposed so consumers can type
  `MPSideloadedKit.filterDictionary`.
- `MPSideloadedKit.addUserIdentityFilter` accepts an `IdentityType` enum value,
  matching runtime usage.
- `MPConfiguration.sideloadedKits` remains permissive for this migration. The
  documented setup flow, sample app, DefinitelyTyped fixture, and runtime path
  are not fully aligned on whether the config array contains raw kit exports or
  `MPSideloadedKit` wrappers, so tightening this shape should be handled after
  docs, samples, and runtime behavior agree.

### Rokt

- Added public Rokt manager typing because `mParticle.Rokt` is part of the
  current SDK surface and is documented for direct customer use.
- Kept the DT-compatible Rokt type names used by consumers, including
  `RoktSelection`, `RoktPlacement`, `RoktPlacementEvent`, `RoktSubscriber`,
  `RoktUnsubscriber`, `RoktSelectPlacementsOptions`,
  `RoktPartnerExtensionData`, and `RoktAttributes`.
- Did not expose new public aliases such as `RoktEventChannel` or
  `RoktSubscription`; those names were not part of the DT contract.

## New Public Declarations Not In DefinitelyTyped

- `MParticleWebSDK`
- `MParticleWebSDKManager`
- `MParticleWebSDKInstance`
- `FilteringConsentRuleValues`
- `FilteringEventAttributeValue`
- `FilteringUserAttributeValue`
- `SDKInitConfig`
- `SDKConsentApi`
- `SDKConsentState`
- `SDKGDPRConsentState`
- `SDKCCPAConsentState`
- `IdentitySearchCallback`
- `IIdentitySearchResult`
- `IIdentitySearchResponseBody`

## Intentional Compatibility Notes

- The old DT-style fixture uses non-null assertions for `getInstance()` and
  nullable ecommerce/consent factory results. This keeps the compatibility test
  close to the original examples while preserving more accurate native SDK
  declarations.
- The old DT-style fixture intentionally uses the package default import instead
  of `import mParticle = require('@mparticle/web-sdk')`. Supporting the
  `export =` declaration shape would make TypeScript accept named runtime
  imports that are not emitted by the ESM bundle.
- `publicSdkTypes.ts` is a consolidation point for legacy DT-owned public shapes.
  A follow-up refactor can move those types into domain-specific files such as
  consent, identity, ecommerce, and config interfaces while keeping
  `public-types.ts` as the public barrel.
