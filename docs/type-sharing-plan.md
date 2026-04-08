# Type Sharing Plan: mparticle-web-sdk → Consumers

## Goal

Expose TypeScript declarations directly from `@mparticle/web-sdk` so that consuming packages (`rokt/sdk-web` and future consumers) can import types from a single source of truth — eliminating the need for `@types/mparticle__web-sdk` (DefinitelyTyped), `@mparticle/event-models`, and `@mparticle/data-planning-models` as separate type dependencies, and preventing type drift across repos.

---

## Current State

| Package | Language | Types Source | Specific Types Used |
|---------|----------|-------------|---------------------|
| `@mparticle/web-sdk` | Mixed TS/JS | Native `.ts` in `src/`, but `declaration: false` — no `.d.ts` emitted | N/A (source) |
| `@types/mparticle__web-sdk` | N/A | DefinitelyTyped `index.d.ts` (~700 lines) | N/A (current published types) |
| `rokt/sdk-web` | TypeScript | `@types/mparticle__web-sdk@^2.54.0` | `MPConfiguration` |

### Key Observations

- The Rollup entry point is `src/mparticle-instance-manager.ts` — already TypeScript.
- All public API types that consumers need are already defined in `.ts` interface files (`sdkRuntimeModels.ts`, `identity-user-interfaces.ts`, `identity.interfaces.ts`, `ecommerce.interfaces.ts`, `consent.ts`, `types.ts`, etc.).
- The remaining 11 `.js` files are **implementation files**, not type-defining files. They implement interfaces defined in `.ts` files.
- **Full JS → TS migration is NOT a prerequisite.** Declaration output can be enabled now because the public API types do not flow through unconverted JS files.
- For any internal types that are missing `.ts` definitions, we can manually define interfaces without converting the full JS implementation (same pattern used today: e.g., `identity.js` implements `IIdentity` from `identity.interfaces.ts`).

> **Note:** `mparticle-javascript-integration-rokt` (Rokt Kit) has a separate TypeScript migration already in progress and is out of scope for this plan.

---

## Target State

```
@mparticle/web-sdk (source of truth)
  ├── dist/mparticle.common.js        (CJS bundle)
  ├── dist/mparticle.esm.js           (ESM bundle)
  ├── dist/types/src/
  │   ├── public-types.d.ts           (customer-facing types)
  │   └── internal-types.d.ts         (shared internal types)
  └── package.json
        exports:
          ".":          → public-types.d.ts + JS bundles
          "./internal": → internal-types.d.ts (types only)

Customers (e.g. mParticle integrators)
  └── import type { MPConfiguration, EventType } from '@mparticle/web-sdk'
      import type { Batch, CommerceEvent } from '@mparticle/web-sdk'
      (only sees public types in autocomplete — includes re-exported
       @mparticle/event-models and @mparticle/data-planning-models types)

Rokt SDKs (rokt/sdk-web, rokt-kit, etc.)
  └── import type { MPConfiguration } from '@mparticle/web-sdk'
      import type { IKitFilterSettings, IRoktKit } from '@mparticle/web-sdk/internal'
      (access to both public and internal types)
```

---

## Phase 1: Enable Declaration Output in Core SDK [IMPLEMENTED]

**Package:** `@mparticle/web-sdk`

### 1.1 — Create public and internal types barrel files

Two barrel files define explicit export boundaries:

**`src/public-types.ts`** — Customer-facing types (autocomplete-safe, stable API contract):

| Category | Types |
|----------|-------|
| Re-exported from `@mparticle/web-sdk` (DT) | `AllUserAttributes`, `Callback`, `CCPAConsentState`, `ConsentState`, `GDPRConsentState`, `IdentityApiData`, `MPConfiguration`, `MPID`, `PrivacyConsentState`, `SDKEventAttrs`, `SDKEventOptions`, `TransactionAttributes`, `User`, `UserIdentities` |
| Re-exported from `@mparticle/event-models` | `Batch`, `CommerceEvent`, `CustomEvent`, `ScreenViewEvent` |
| Re-exported from `@mparticle/data-planning-models` | `DataPlanVersion` |
| Enums | `EventType`, `IdentityType`, `CommerceEventType`, `ProductActionType`, `PromotionActionType`, `MessageType` |
| Configuration | `SDKInitConfig`, `DataPlanConfig`, `BaseEvent`, `SDKEventCustomFlags`, `LogLevelType`, `MParticleWebSDK` |
| User & Identity | `IMParticleUser`, `IdentityCallback`, `IdentityResult`, `IdentityResultBody`, `IdentityModifyResultBody`, `ISDKUserIdentity`, `ISDKUserAttributes`, `SDKIdentityApi`, `IAliasRequest`, `IAliasCallback`, `IAliasResult`, `SDKIdentityTypeEnum` |
| eCommerce | `SDKECommerceAPI`, `SDKCart`, `SDKProduct`, `SDKPromotion`, `SDKImpression`, `SDKProductImpression` |
| Consent | `SDKConsentApi`, `SDKConsentState`, `SDKConsentStateData`, `SDKGDPRConsentState`, `SDKCCPAConsentState` |
| Utilities | `Dictionary<V>`, `valueof` |

**`src/internal-types.ts`** — Types shared between mParticle/Rokt SDKs, not intended for customers:

| Category | Types |
|----------|-------|
| Kit/Forwarder | `IKitConfigs`, `IKitFilterSettings`, `IFilteringEventAttributeValue`, `IFilteringUserAttributeValue`, `IFilteringConsentRuleValues`, `IConsentRuleValue`, `UnregisteredKit`, `RegisteredKit`, `KitRegistrationConfig`, `ConfiguredKit`, `MPForwarder`, `UserAttributeFilters`, `UserIdentityFilters`, `forwardingStatsCallback` |
| Rokt integration | `RoktAttributes`, `RoktAttributeValue`, `IRoktLauncher`, `IRoktKit`, `IRoktKitSettings`, `RoktKitFilterSettings`, `IRoktSelectPlacementsOptions`, `IRoktSelection`, `IRoktPartnerExtensionData`, `IRoktMessage`, `IRoktOptions`, `IRoktLauncherOptions` |
| Reporting internals | `ErrorCodes`, `WSDKErrorSeverity`, `ISDKError`, `ISDKLogEntry`, `IErrorReportingService`, `ILoggingService` |
| Runtime internals | `SDKEvent`, `SDKProductAction`, `SDKProductActionType`, `SDKPromotionAction`, `SDKShoppingCart`, `SDKGeoLocation`, `SDKDataPlan`, `SDKHelpersApi`, `SDKLoggerApi`, `SDKStoreApi`, `SDKConfigApi`, `KitBlockerOptions`, `IMParticleInstanceManager` |
| Events/eCommerce internals | `IEvents`, `IECommerce` |
| Identity internals | `IIdentity`, `IIdentityRequest`, `IIdentityAPIRequestData`, `IIdentityAPIModifyRequestData`, `IdentityAPIMethod` |
| Consent internals | `IConsentRules`, `IConsentSerialization`, `IMinifiedConsentJSONObject`, `IConsentState`, `IConsent` |

> These barrel files re-export from existing source files — no type definitions are moved or duplicated.

### 1.2 — Separate `tsconfig.types.json` for declaration generation

A dedicated tsconfig avoids conflicts with the main build (which uses Babel via Rollup and has pre-existing type errors against `window.mParticle` in DefinitelyTyped). Key settings:

- `emitDeclarationOnly: true` — only generates `.d.ts`, no JS
- `skipLibCheck: true` — avoids jest/mocha type conflicts
- `noEmitOnError: false` — allows declaration emission despite pre-existing `window.mParticle` errors (13 errors in `mp-instance.ts`, `mparticle-instance-manager.ts`, `store.ts`)
- `rootDir: "."` — required because `constants.ts` imports `../package.json`

### 1.3 — Build pipeline

The `build:types` script runs after the Rollup build:

```json
{
  "build": "cross-env ENVIRONMENT=prod BUILDALL=true rollup --config rollup.config.js && npm run build:types",
  "build:types": "tsc -p tsconfig.types.json || true"
}
```

> `|| true` prevents the pre-existing type errors from failing the build. These errors are in runtime code that Babel compiles fine — they'll be resolved when DefinitelyTyped is deprecated (Phase 3).

### 1.4 — `package.json` dual entry points

```json
{
  "types": "dist/types/src/public-types.d.ts",
  "exports": {
    ".": {
      "types": "./dist/types/src/public-types.d.ts",
      "import": "./dist/mparticle.esm.js",
      "require": "./dist/mparticle.common.js"
    },
    "./internal": {
      "types": "./dist/types/src/internal-types.d.ts"
    }
  },
  "files": [
    "dist/mparticle.common.js",
    "dist/mparticle.esm.js",
    "dist/mparticle.js",
    "dist/types/",
    "src/"
  ]
}
```

The `./internal` entry point is types-only — no JS bundle. This means:
- **Customers** using `import { EventType } from '@mparticle/web-sdk'` see only public types in autocomplete
- **Rokt SDKs** using `import type { IKitFilterSettings } from '@mparticle/web-sdk/internal'` get access to shared internal types
- The `/internal` path is a convention boundary — technically accessible to anyone, but clearly signals "not part of the public API"

### 1.5 — Type consolidation: re-exporting upstream packages

The public barrel file re-exports select types from `@mparticle/event-models` and `@mparticle/data-planning-models`. This means consumers only need `@mparticle/web-sdk` — they don't need to install the upstream packages for types:

```ts
// In public-types.ts
export type { Batch, CommerceEvent, CustomEvent, ScreenViewEvent } from '@mparticle/event-models';
export type { DataPlanVersion } from '@mparticle/data-planning-models';
```

### 1.6 — Publish

Publish a new minor version of `@mparticle/web-sdk` with declarations included.

---

## Phase 2: Migrate `rokt/sdk-web`

**Package:** `rokt/sdk-web` → `packages/integrations/integration-launcher`

### 2.1 — Swap type dependency

```diff
# packages/integrations/integration-launcher/package.json
{
  "devDependencies": {
-   "@types/mparticle__web-sdk": "^2.54.0",
+   "@mparticle/web-sdk": "^2.62.0"
  }
}
```

### 2.2 — Update imports

Public types (e.g. `MPConfiguration`) keep the same import path — no code changes needed:
```ts
import type { MPConfiguration } from '@mparticle/web-sdk';
```

For internal types previously duplicated or hand-typed in the Rokt SDK, switch to the `/internal` entry point:
```ts
import type { IKitFilterSettings, IRoktKit } from '@mparticle/web-sdk/internal';
```

### 2.3 — Handle `RoktExtensions` on `MPConfiguration`

The DefinitelyTyped file currently includes `RoktExtensions?: Array<string>` on `MPConfiguration`. Two paths:

- **If already in core SDK types:** No action needed.
- **If not in core SDK types:** Use module augmentation in `rokt/sdk-web`:

```ts
// src/types/mparticle-augments.d.ts
declare module '@mparticle/web-sdk' {
  interface MPConfiguration {
    RoktExtensions?: string[];
  }
}
```

### 2.4 — Verify

- `npm install && npm run build` passes
- Type checking passes with no regressions
- Integration tests pass

---

## Phase 3: Deprecate DefinitelyTyped

### 3.1 — Update DefinitelyTyped entry

Once consumers have migrated, update the DefinitelyTyped `index.d.ts` to re-export from the SDK:

```ts
// Deprecated: types are now included in @mparticle/web-sdk directly
export * from '@mparticle/web-sdk';
```

Or submit a PR to deprecate the package entirely.

### 3.2 — Remove `@types/mparticle__web-sdk` from core SDK devDependencies

```diff
# mparticle-web-sdk/package.json
{
  "devDependencies": {
-   "@types/mparticle__web-sdk": "^2.16.1",
  }
}
```

> This will also resolve the 13 pre-existing `window.mParticle` type errors that currently require `|| true` in the `build:types` script.

---

## Phase 4 (Ongoing): Fill Missing Internal Type Interfaces

For any internal types needed by Rokt SDKs that don't yet have `.ts` interface files, manually define the interfaces without converting the full JS implementation. This follows the existing pattern in the codebase:

- `identity.js` → implements `IIdentity` from `identity.interfaces.ts`
- `ecommerce.js` → implements `IECommerce` from `ecommerce.interfaces.ts`
- `forwarders.js` → implements interfaces from `forwarders.interfaces.ts`

Add new interface files as needed and re-export from `src/internal-types.ts`.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Type names differ between DefinitelyTyped and core SDK source | Audit DefinitelyTyped `index.d.ts` against core SDK types before Phase 1.6; add type aliases for backwards compatibility where names diverge |
| Pre-existing type errors in `window.mParticle` usage | `noEmitOnError: false` allows declaration emission; `|| true` prevents build failure; errors resolved when DT is deprecated (Phase 3) |
| Breaking change for existing `@types/mparticle__web-sdk` consumers | Phase 3 re-export bridge ensures gradual migration; keep DefinitelyTyped updated until consumer migration is complete |
| Accidental exposure of internal types | Dual barrel files with `exports` map in `package.json` ensures customers only see `public-types.d.ts`; the `/internal` path is accessible by convention but clearly signals non-public API |
| Internal types path used by external customers | Document the `/internal` path as unstable/unsupported; consider adding a `@internal` JSDoc tag and a note in the barrel file |

---

## Success Criteria

- [x] `@mparticle/web-sdk` generates `.d.ts` files alongside JS bundles
- [x] Public types barrel (`public-types.ts`) covers full consumer API surface
- [x] Internal types barrel (`internal-types.ts`) covers Rokt SDK needs
- [x] `@mparticle/event-models` and `@mparticle/data-planning-models` types re-exported through public barrel
- [ ] `@mparticle/web-sdk` published with declarations
- [ ] `rokt/sdk-web` imports types from `@mparticle/web-sdk` (not `@types/`)
- [ ] `@types/mparticle__web-sdk` is deprecated or re-exports from core SDK
- [ ] No consumer has a separate copy of mParticle type definitions
