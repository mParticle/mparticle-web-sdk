# Type Sharing Plan: mparticle-web-sdk → Consumers

## Goal

Expose TypeScript declarations directly from `@mparticle/web-sdk` so that consuming packages (`rokt/sdk-web`, `mparticle-javascript-integration-rokt`, and future consumers) can import types from a single source of truth — eliminating the need for `@types/mparticle__web-sdk` (DefinitelyTyped) and preventing type drift across repos.

---

## Current State

| Package | Language | Types Source | Specific Types Used |
|---------|----------|-------------|---------------------|
| `@mparticle/web-sdk` | Mixed TS/JS | Native `.ts` in `src/`, but `declaration: false` — no `.d.ts` emitted | N/A (source) |
| `@types/mparticle__web-sdk` | N/A | DefinitelyTyped `index.d.ts` (~700 lines) | N/A (current published types) |
| `rokt/sdk-web` | TypeScript | `@types/mparticle__web-sdk@^2.54.0` | `MPConfiguration` |
| `mparticle-javascript-integration-rokt` | JavaScript | Runtime `@mparticle/web-sdk@^2.20.0` (no types) | `IdentityType`, `EventType`, `ProductActionType` (runtime access via `window.mParticle`) |

### Key Observation

The Rollup entry point is `src/mparticle-instance-manager.ts` — already TypeScript. Enabling declaration output will generate `.d.ts` files for the entire TS import chain from this entry point. The 11 remaining `.js` files are internal modules; they won't block declaration generation but will appear as `any` at their boundaries until converted.

---

## Target State

```
@mparticle/web-sdk (source of truth)
  ├── dist/mparticle.common.js     (CJS bundle)
  ├── dist/mparticle.esm.js        (ESM bundle)
  ├── dist/types/                   (generated .d.ts files)
  │   └── index.d.ts               (public API declarations)
  └── package.json
        types: "dist/types/index.d.ts"

rokt/sdk-web
  └── devDependencies: "@mparticle/web-sdk"
      import type { MPConfiguration } from '@mparticle/web-sdk'

mparticle-javascript-integration-rokt
  └── devDependencies: "@mparticle/web-sdk"
      (JSDoc types or future TS migration)
```

---

## Phase 1: Enable Declaration Output in Core SDK

**Package:** `@mparticle/web-sdk`

### 1.1 — Create a public types barrel file

Create `src/public-types.ts` (or similar) that explicitly re-exports only the types intended for external consumers. This serves as a stable public contract separate from internal types.

**Types to export (based on DefinitelyTyped surface + consumer usage):**

| Category | Types |
|----------|-------|
| Enums | `EventType`, `IdentityType`, `CommerceEventType`, `ProductActionType`, `PromotionActionType` |
| Configuration | `MPConfiguration` / `SDKInitConfig`, `DataPlanConfig` |
| User & Identity | `IMParticleUser`, `MPID`, `UserIdentities`, `IdentityCallback`, `IdentityResult`, `IdentityResultBody`, `IdentifyRequest` |
| Events | `BaseEvent`, `SDKEventAttrs`, `SDKEventCustomFlags`, `SDKEventOptions` |
| eCommerce | `Product`, `TransactionAttributes`, `Impression`, `Promotion` |
| Consent | `ConsentState`, `GDPRConsentState`, `CCPAConsentState` |
| Utilities | `Dictionary<V>` |
| Rokt-specific | `RoktAttributes`, `IRoktLauncher`, `IRoktKit`, `IRoktSelectPlacementsOptions` |

### 1.2 — Update `tsconfig.json`

```diff
{
  "compilerOptions": {
-   "declaration": false,
+   "declaration": true,
+   "declarationDir": "dist/types",
+   "emitDeclarationOnly": false,
    ...
  }
}
```

> **Note:** `emitDeclarationOnly` stays `false` because Rollup handles JS output. Depending on build setup, a separate `tsc` step for declarations may be cleaner than having Rollup emit them (see 1.3).

### 1.3 — Update build pipeline

Add a declaration generation step. Two options:

**Option A — Separate `tsc` step (recommended):**
```json
{
  "scripts": {
    "build:types": "tsc --emitDeclarationOnly --declaration --declarationDir dist/types",
    "build": "cross-env ENVIRONMENT=prod BUILDALL=true rollup --config rollup.config.js && npm run build:types"
  }
}
```

**Option B — Rollup plugin:**
Use `rollup-plugin-dts` or `@rollup/plugin-typescript` with declaration options. This bundles all declarations into a single `.d.ts` file, which is cleaner for consumers but adds build complexity.

### 1.4 — Update `package.json`

```diff
{
  "name": "@mparticle/web-sdk",
+ "types": "dist/types/mparticle-instance-manager.d.ts",
  "files": [
    "dist/mparticle.common.js",
    "dist/mparticle.esm.js",
    "dist/mparticle.js",
+   "dist/types/",
    "src/"
  ],
}
```

> If using a barrel file, point `"types"` at the barrel's declaration output instead.

### 1.5 — Validate declaration output

- Run `npm run build:types` and inspect `dist/types/`
- Verify that all public API types are present and not `any`
- Spot-check that internal-only types are not accidentally exported
- Run `tsc --noEmit` from a test consumer to confirm imports resolve

### 1.6 — Publish

Publish a new minor version of `@mparticle/web-sdk` (e.g., `2.62.0`) with the declarations included.

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

Current import in `extension-vnext-initialization.ts`:
```ts
import type { MPConfiguration } from '@mparticle/web-sdk';
```

This import path stays the same — only the resolution source changes (from `@types/` to the SDK's own declarations). **No code changes needed** if the type names match.

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

## Phase 3: Migrate `mparticle-javascript-integration-rokt`

**Package:** `mparticle-javascript-integration-rokt`

This package is plain JavaScript today. Two options depending on timeline:

### Option A — JSDoc types (no TS migration required)

Add `@mparticle/web-sdk` as a devDependency and use JSDoc type annotations:

```js
/** @typedef {import('@mparticle/web-sdk').IdentityType} IdentityType */
```

Enable type checking in `jsconfig.json`:
```json
{
  "compilerOptions": {
    "checkJs": true,
    "noEmit": true
  }
}
```

### Option B — TypeScript migration (if planned)

Add `@mparticle/web-sdk` as a devDependency, rename `.js` → `.ts`, and import types directly. This is the better long-term path but a larger effort.

### Either option:

```diff
# package.json
{
  "devDependencies": {
+   "@mparticle/web-sdk": "^2.62.0"
  },
  "dependencies": {
-   "@mparticle/web-sdk": "^2.20.0"
  }
}
```

> **Note:** If this package needs `@mparticle/web-sdk` at runtime (not just for types), keep it as a regular dependency. If it only accesses mParticle via `window.mParticle` at runtime, a devDependency suffices.

---

## Phase 4: Deprecate DefinitelyTyped

### 4.1 — Update DefinitelyTyped entry

Once consumers have migrated, update the DefinitelyTyped `index.d.ts` to re-export from the SDK:

```ts
// Deprecated: types are now included in @mparticle/web-sdk directly
export * from '@mparticle/web-sdk';
```

Or submit a PR to deprecate the package entirely.

### 4.2 — Remove `@types/mparticle__web-sdk` from core SDK devDependencies

```diff
# mparticle-web-sdk/package.json
{
  "devDependencies": {
-   "@types/mparticle__web-sdk": "^2.16.1",
  }
}
```

---

## Phase 5: Ongoing — Convert Remaining JS Files

As the remaining 11 `.js` files in `mparticle-web-sdk/src/` are converted to TypeScript, the declaration output automatically improves. Priority order based on consumer impact:

| File | Consumer Impact | Priority |
|------|----------------|----------|
| `identity.js` | Identity types used by all consumers | High |
| `ecommerce.js` | Product/transaction types used by Rokt kit | High |
| `events.js` | Event logging types | Medium |
| `persistence.js` | Internal | Low |
| `forwarders.js` | Kit integration contract | Medium |
| `helpers.js` | Internal utilities | Low |
| `filteredMparticleUser.js` | Internal | Low |
| `forwardingStatsUploader.js` | Internal | Low |
| `nativeSdkHelpers.js` | Internal | Low |
| `polyfill.js` | Internal | Low |
| `stub/mparticle.stub.js` | Stub entry (separate Rollup input) | Low |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Type names differ between DefinitelyTyped and core SDK source | Audit DefinitelyTyped `index.d.ts` against core SDK types before Phase 1.6; add type aliases for backwards compatibility where names diverge |
| Remaining JS files produce `any` at type boundaries | Document known `any` gaps; prioritize converting high-impact JS files (Phase 5) |
| Breaking change for existing `@types/mparticle__web-sdk` consumers | Phase 4 re-export bridge ensures gradual migration; keep DefinitelyTyped updated until consumer migration is complete |
| Build time increase from `tsc` declaration step | Declaration generation is fast (~seconds) — negligible impact |
| Accidental exposure of internal types | Barrel file (Phase 1.1) acts as explicit public API boundary; review declarations in CI |

---

## Success Criteria

- [ ] `@mparticle/web-sdk` publishes `.d.ts` files alongside JS bundles
- [ ] `rokt/sdk-web` imports types from `@mparticle/web-sdk` (not `@types/`)
- [ ] `mparticle-javascript-integration-rokt` has type coverage via JSDoc or TS
- [ ] `@types/mparticle__web-sdk` is deprecated or re-exports from core SDK
- [ ] No consumer has a separate copy of mParticle type definitions
