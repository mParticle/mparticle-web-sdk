# AGENTS

---
description: Development guidelines and standards for the mParticle Web SDK
globs: ['**/*']
alwaysApply: true
---

This file is the operating contract for AI coding agents in this repo. Follow the
web-specific rules below first. The common SDK section is product context; the
architecture section is a map, not a license to expand scope.

<!-- ============================================ -->
<!-- WEB PLATFORM — AGENT RULES                    -->
<!-- Inspired by Rokt WSDK AGENTS.md conventions   -->
<!-- ============================================ -->

## High-level principles

Keep these in mind while satisfying any other requirement. In order of importance:

1. **Security** — this SDK is loaded on partner and customer pages, including
   checkout. Call out any security concern. Never introduce XSS, injection,
   `eval` / `new Function`, or unescaped HTML. Never log raw PII in production.
2. **Compatibility** — public API, snippet stubs, published types, and
   multi-instance behavior are contracts. A silent break in `snippet.js` is a
   production incident for every script-tag customer.
3. **Performance** — latency, main-thread time, memory, and gzip bundle size are
   product requirements. CI reports gzip size vs `master` on every PR.
4. **Clarity** — code must be easy for a human to follow. Prefer the obvious
   implementation over a clever one.

## Coding style

- Linting lives in `.eslintrc`. Formatting lives in `.prettierrc` (4-space
  indent, single quotes, ES5 trailing commas). These apply repo-wide.
- Match the file you are in. Existing modules are constructor functions that
  receive `mpInstance` (dependency injection). Do not convert a file to a class
  — or from a class to functions — unless that is the task. `PageViewTracker`
  and `BaseVault` are already classes; follow them when extending those files.
- New source files are TypeScript. Do not add new `.js` modules.
- Prefer iteration and modularization over duplication. Before adding a generic
  helper (record guards, parsers, safe stringify, error-message extraction),
  search `src/utils.ts` and `src/helpers.ts` and reuse or export a shared helper.
- Use descriptive names with auxiliary verbs (`isLoading`, `hasIdentifyReturned`,
  `shouldForward`). Avoid opaque names (`k`, `v`, `x`, `d`).
- Private members are prefixed `_` (`_Store`, `_resetForTests`). Do not promote
  a `_` member to public API without an explicit request and a snippet update.
- Do not use `console.log`. Use `mpInstance.Logger` for local diagnostics and
  `src/reporting/` (`ErrorCodes`, `IErrorReportingService`) for structured
  reportable errors. Convert a new failure mode to a reporting call, not a
  console dump.

### Comments

Do **not** write comments. This is a hard default, not a preference. Before
adding one, make the code self-explanatory — rename, or extract a well-named
helper. A good name almost always removes the need for the comment.

Comments that explain WHAT the code does or WHY you chose an approach are
forbidden. That rationale belongs in the commit message and PR description.

The only allowed exceptions: (a) a tooling/legal directive the build requires
(`eslint-disable`, license header), or (b) a genuine non-obvious external gotcha
a reader cannot infer from the code (e.g. Next.js re-executes the bundle on SPA
navigation so APV state must live on `window.__mpApv__`). If you are not sure it
qualifies, and the user does not explicitly tell you to keep the comment, leave
it out.

## Readability and merge safety

Avoid AI-style refactors that are concise but hide precedence or mutation.

| Prefer | Over | Why |
|---|---|---|
| Explicit copy and targeted assignment | Layered conditional object spreads in a single return | Makes key precedence explicit |
| Clear names (`fieldName`, `fieldValue`) | Opaque names (`k`, `v`, `x`) | Faster review |
| Simple multi-line conditionals | Dense one-liners with nested `&&` / `?:` | Safer edits |
| Intentional, narrow cloning of nested objects | Broad spreads with unclear purpose | Fewer accidental shape changes |
| Explicit assignment order when precedence matters | Relying on spread merge order | Avoids fragile refactors |

### Opportunistic readability refactoring (required)

When a session touches a file for any reason, scan the changed functions for
violations of the table above.

- If an anti-pattern exists in code you are already modifying, refactor it in
  the same changeset (no TODOs). Behavior must stay identical.
- If an anti-pattern is in code you are not modifying, do not refactor it.
  Capture it in the PR description under "Deferred readability opportunities".

### Test integrity

Opportunistic readability (or performance) refactors are implementation-only.

- Existing unit/integration tests must pass as-is with **zero** test file edits.
- If a readability refactor causes test failures, the refactor is wrong. Revert.
- Never weaken, skip, or rewrite assertions to accommodate a refactor.

## Performance

This SDK is a third-party script on customer pages. A performance regression is
a product regression.

| Prefer | Over | Why |
|---|---|---|
| `Map` / `Set` for dynamic key sets | Plain objects as hash maps | Safer for large/dynamic keys |
| `for` / `for...of` on hot paths | `.forEach()` on hot paths | Avoids per-iteration closures |
| Batched work / `queueMicrotask` | Long synchronous loops | Long tasks (`>50ms`) are bugs |
| `structuredClone` (feature-detected) or explicit shallow copy | `JSON.parse(JSON.stringify(...))` | Cheaper, richer types |
| Native browser APIs | New dependencies / polyfills | Bundle size is gated in CI |
| `vault.ts` storage writes | Raw `localStorage.setItem` that can throw | Quota and `SecurityError` must not break event logging |

### Third-party embedding hard rules

- **Zero unapproved global pollution.** No top-level `var`. No `window.*`
  assignment outside `window.mParticle` and the documented APV debug contract
  (`window.__mpApv__` in `pageViewTracker.ts`).
- **CSP-safe.** Never `eval`, `new Function`, or inline event handlers.
- **Bundle-size awareness.** Flag every new dependency or polyfill in the PR.
  Compare `npm run bundle && npm run report:bundled:human` against `master`.
- **Do not block the main thread.** Chunk work; do not add synchronous network
  or storage in `logEvent` / identity hot paths without a clear reason.

## Public API and compatibility

The script-tag snippet is a preload queue, not a convenience. A method that
exists on the live SDK but is missing from the snippet is silently dropped for
every customer who calls it before load.

When adding or renaming a **public** method:

1. Implement it on the instance / `Identity` / `eCommerce` / `Rokt` surface.
2. Add the stub to **both** `snippet.js` and `snippet.rokt.js` (keep the two
   lists in sync).
3. Add it to `src/stub/mparticle.stub.js` if it belongs on the stub build.
4. Export customer-facing types from `src/public-types.ts` only. Types shared
   with the Rokt kit but not customers go in `src/internal-types.ts`
   (`@mparticle/web-sdk/internal`).
5. Cover the method with a Karma test that goes through `mParticle.init`.

Do not change existing public signatures. Identity methods are async and take
callbacks; do not turn them into unannounced promises.

`queueIfNotInitialized` is the preload contract inside the SDK. Methods called
before init must keep queuing.

## Logging and PII

PII (email, name, phone, and similar) must not appear in production logs.

- `obfuscateDevData(data, isDevelopmentMode)` from `src/utils.ts` — raw in
  development, structure-only in production. Use this for payloads.
- `obfuscateData(data)` — always obfuscate a specific field.
- Never log identity maps, request bodies, or attribute bags without one of
  the above.

## Rokt surface

`src/roktManager.ts` is the bridge to Rokt (`selectPlacements`, hashing,
extensions, `terminate`). The kit attaches via `mParticle.Rokt.attachKit`.

- Launcher option normalization lives in `src/roktLauncherOptions.ts`.
  `noDeviceId` / `noDeviceID` is the strongest privacy flag and implies
  `noFunctional` and `noTargeting`. Keep that invariant if you touch options.
- Do not load Rokt `launcher.js` from this repo. The kit / WSDK owns that.
- New `mParticle.Rokt.*` methods need snippet stubs (see Public API).

## Automatic page views

`src/pageViewTracker.ts` owns history patching and the initial page view.

- APV state lives on `window.__mpApv__` because some hosts (e.g. Next.js)
  re-execute the bundle on SPA navigation and wipe module scope.
- Tests must not reach into tracker internals. Drive behavior through public
  APIs (`logPageView`, `init`, history), not private fields.
- Do not fire a second initial page view on re-`init` in the same tab.

## Version control

This repo is gitflow.

- **Day-to-day PRs target `development`**, not `master`. `master` is the
  release branch. CI's gitflow check will reject the wrong base.
- Branch names follow conventional types: `feat/…`, `fix/…`, `docs/…`,
  `refactor/…`, `chore/…`, `test/…`, `ci/…`.
- Conventional Commits drive semantic-release (`feat` → minor, `fix` → patch).
  See the common section for the full type list.
- **Do not commit** `dist/`, `CHANGELOG.md`, or version bumps in
  `package.json` / `package-lock.json`. Release CI generates those.
- Do not commit unless the user explicitly asks.
- When asked to open a PR: push the named branch, fill a real description
  (what / why / test plan), leave checklist boxes for the author, and compare
  against `development`. After creating the PR, do not add further commits
  unless asked.

## Testing

- Jest (`test/jest/*.spec.ts`, jsdom) for isolated TypeScript units.
- Karma (`test/src/tests-*.ts`, ChromeHeadless + Firefox) for browser
  integration. This is the suite that proves public API + snippet behavior.
- Add tests for every behavior change. Cover success and failure paths.
- Karma: `mParticle._resetForTests(MPConfig)` in `beforeEach`. Mock HTTP with
  `fetch-mock/esm/client`. Wait on async identity with `waitForCondition()`
  from `test/src/config/utils.js` (it is `.js`, not `.ts`).
- Chai in Karma (`expect(...).to.equal()`). Jest matchers in Jest.
- Do not add Playwright here; this repo does not use it.
- After code changes, run `/verify` (`.claude/skills/verify/skill.md`) before
  claiming the work is done:

  ```bash
  npm run lint
  npm run test:jest
  npm run test          # build + Karma; slower, required for public API
  ```

## Review guidelines

When reviewing PRs that touch this SDK, apply these severity levels.

### P0 — block merge

- Hardcoded secrets or credentials
- XSS, `eval` / `new Function`, or unescaped HTML
- Raw PII in production logs or checked-in fixtures
- Public method added without `snippet.js` **and** `snippet.rokt.js` stubs
- Breaking change to a public signature without `BREAKING CHANGE:`

### P1 — strongly recommend fixing before merge

- Missing tests for the changed behavior
- New dependency or polyfill with no bundle-size note
- `console.log` / `console.error` instead of Logger / reporting
- Reaching into `_` internals from new tests when a public API exists
- Storage writes that ignore quota / `SecurityError` (use `vault.ts`)
- Identity or Rokt options that drop the `noDeviceId` → `noFunctional` +
  `noTargeting` implication
- Types that belong in `internal-types.ts` exported from `public-types.ts`

---

<!-- ============================================ -->
<!-- COMMON SECTION - Keep synced across all SDKs -->
<!-- Last Updated: 2026-02-16 -->
<!-- ============================================ -->

## About mParticle SDKs

mParticle is a Customer Data Platform that collects, validates, and forwards event data to analytics and marketing integrations. The SDK is responsible for:

- **Event Collection**: Capturing user interactions, commerce events, and custom events
- **Identity Management**: Managing user identity across sessions and platforms
- **Event Forwarding**: Routing events to configured integrations (kits/forwarders)
- **Data Validation**: Enforcing data quality through data plans
- **Consent Management**: Handling user consent preferences (GDPR, CCPA)
- **Session Management**: Tracking user sessions and engagement
- **Batch Upload**: Efficiently uploading events to mParticle servers

### Glossary of Terms

- **MPID (mParticle ID)**: Unique identifier for a user across sessions and devices
- **Kit/Forwarder**: Third-party integration (e.g., Google Analytics, Braze) that receives events from the SDK
- **Data Plan**: Validation schema that defines expected events and their attributes
- **Workspace**: A customer's mParticle environment (identified by API key)
- **Batch**: Collection of events grouped together for efficient server upload
- **Identity Request**: API call to identify, login, logout, or modify a user's identity
- **Session**: Period of user activity with automatic timeout (typically 30 minutes)
- **Consent State**: User's privacy preferences (GDPR, CCPA) that control data collection and forwarding
- **User Attributes**: Key-value pairs describing user properties (e.g., email, age, preferences)
- **Custom Events**: Application-specific events defined by the developer
- **Commerce Events**: Predefined events for e-commerce tracking (purchases, product views, etc.)
- **Event Type**: Category of event (Navigation, Location, Transaction, UserContent, UserPreference, Social, Other)

## General Development Guidelines

### Before Making Changes

1. **Read First, Modify Later**: Always read relevant files before proposing changes. Use the Read tool to understand existing code, patterns, and conventions.
2. **Understand the Architecture**: Review the instance-based architecture and module structure before adding features. Check `ARCHITECTURE.md` if available for architectural diagrams and design patterns.
3. **Review Contributing Guidelines**: Check `CONTRIBUTING.md` for repository-specific contribution guidelines, workflow, and standards.
4. **Check Existing Tests**: Look at test files for usage examples and to understand expected behavior.
5. **Review Constants**: Check the constants file(s) for standard values, messages, and configuration options.

### Code Quality Standards

- **Security First**: Prevent injection vulnerabilities (XSS, command injection, etc.)
- **Avoid Over-Engineering**: Only make changes that are directly requested or clearly necessary
- **No Premature Abstractions**: Don't create helpers or utilities for one-time operations
- **Keep It Simple**: Three similar lines of code is better than a premature abstraction
- **No Unnecessary Features**: Don't add error handling for scenarios that can't happen
- **Trust Internal Code**: Only validate at system boundaries (user input, external APIs)

### Logging and PII Obfuscation

**PII (Personally Identifiable Information)** is data that can identify a specific person, for example: email, name or phone number, and similar attributes. Logging raw payloads can expose PII in production.

- Use `obfuscateDevData(data, isDevelopmentMode)` from `utils` to log payloads - shows raw data in development mode, obfuscates in production.
- Use `obfuscateData(data)` from `utils` when you need to obfuscate a specific field.

### Testing Requirements

- Run the full test suite before committing
- Add tests for new features or bug fixes
- Test both success and error cases
- Use existing test patterns as examples
- Ensure tests pass in all supported environments

### Git Commit Standards

This repository uses **Conventional Commits** for semantic versioning:

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

**Commit Types:**
- `feat` → Triggers minor version bump (new feature)
- `fix` → Triggers patch version bump (bug fix)
- `docs` → Documentation changes
- `test` → Adding or updating tests
- `refactor` → Code refactoring without behavior changes
- `perf` → Performance improvements
- `style` → Code style changes (formatting, etc.)
- `chore` → Maintenance tasks
- `ci` → CI/CD changes
- `build` → Build system changes
- `revert` → Reverting previous commits

**Breaking Changes:**
```
feat: new API for identity management

BREAKING CHANGE: Identity.login() now requires a callback parameter
```

**Examples:**
```
feat: add consent state filtering for forwarders
fix: prevent duplicate events in batch upload
docs: update API reference for eCommerce methods
test: add cross-browser tests for identity API
```

### Pull Request Guidelines

- Create PRs against the `master` branch
- Ensure all CI checks pass
- Include test coverage for changes
- Reference any related issues
- Follow the commit message format throughout the branch

## Common API Patterns

### Core Modules

All SDKs should provide these core modules:

1. **Identity**: User identification, login, logout, modify
2. **Events**: Event logging with custom attributes
3. **eCommerce**: Commerce event tracking (purchases, product views, etc.)
4. **Consent**: User consent state management
5. **Session**: Session lifecycle management
6. **Configuration**: SDK configuration and feature flags

### Data Flow Architecture

```
Event Logged → Validation → Consent Check → Kit Forwarding → Batch Upload
                  ↓              ↓               ↓              ↓
            Data Plan      Consent State   Active Kits    API Client
```

### Configuration Cascade

```
Initial Config (provided by developer)
  ↓
SDK Config (normalized and validated)
  ↓
Server Config (merged from mParticle servers)
  ↓
Feature Flags & Kit Configs (runtime)
```

---

<!-- ============================================ -->
<!-- WEB PLATFORM SPECIFIC SECTION -->
<!-- ============================================ -->

## Web SDK Architecture

**Gitflow override:** feature PRs target `development`. The common-section `master` target applies to release, not day-to-day work.

### Tech Stack

- **Languages**: TypeScript (new code) and remaining JavaScript modules
- **Build**: Rollup → IIFE (`dist/mparticle.js`), CJS, ESM, stub
- **Tests**: Karma (browser integration), Jest (TS units), BrowserStack (cross-browser)
- **Quality**: ESLint, Prettier, GTS
- **Package manager**: npm

### Project Structure

```
/                                       # Repo root
  snippet.js / snippet.rokt.js          # Script-tag preload stubs (keep in sync)
  jest.config.js
/src/
  ├── mparticle-instance-manager.ts     # Named instances
  ├── mp-instance.ts                    # Core instance, public APIs, module wiring
  ├── pageViewTracker.ts                # Automatic page views; state on window.__mpApv__
  ├── apiClient.ts / identityApiClient.ts / configAPIClient.ts
  ├── batchUploader.ts                  # Event batch + retry
  ├── identity.js / identity-utils.ts / identity/search.ts
  ├── events.ts / ecommerce.js
  ├── forwarders.js / kitBlocking.ts / sideloadedKit.ts
  ├── consent.ts / cookieConsentManager.ts
  ├── sessionManager.ts
  ├── roktManager.ts / roktLauncherOptions.ts
  ├── store.ts / persistence.js / vault.ts
  ├── validators.ts / constants.ts / types.ts / utils.ts / helpers.ts
  ├── logger.ts / reporting/            # Logger + structured ErrorCodes
  ├── public-types.ts                   # Customer-facing types
  ├── internal-types.ts                 # Kit/Rokt-shared, not public
  └── stub/                             # Stub build
/test/
  ├── karma.config.js
  ├── src/tests-*.ts                    # Karma
  ├── src/config/utils.js               # waitForCondition, fetchMockSuccess
  └── jest/*.spec.ts                    # Jest
/dist/                                  # Generated — do not commit by hand
/scripts/
/.github/workflows/                     # PR CI targets development; release from master
```

### Instance-based architecture

```javascript
mParticle.init(apiKey, config, instanceName?)
mParticle.getInstance(instanceName?)
```

- Default instance name: `default_instance`
- Each instance has its own config, identity, store, and kits
- `mParticle` is the manager; `mpInstance` is one SDK instance
- Modules take `mpInstance` so they can reach `_Store`, `Logger`, etc. without
  circular imports

```typescript
IMParticleWebSDKInstance {
  logEvent(), logPurchase(), setUserAttribute()
  Identity, eCommerce, Consent, Rokt

  _APIClient, _Identity, _Events, _Ecommerce, _Consent
  _Persistence, _Store, _SessionManager, _Forwarders, _Logger
}
```

### Key files

| Feature | Main files |
|---|---|
| Entry / instances | `mparticle-instance-manager.ts`, `mp-instance.ts` |
| Identity | `identity.js`, `identity-utils.ts`, `identity/search.ts` |
| Events | `events.ts`, `events.interfaces.ts` |
| Page views | `pageViewTracker.ts` |
| eCommerce | `ecommerce.js`, `ecommerce.interfaces.ts` |
| Forwarders | `forwarders.js`, `kitBlocking.ts`, `sideloadedKit.ts` |
| Consent | `consent.ts`, `cookieConsentManager.ts` |
| Session | `sessionManager.ts` |
| Storage | `persistence.js`, `store.ts`, `vault.ts` |
| HTTP | `apiClient.ts`, `identityApiClient.ts`, `configAPIClient.ts`, `batchUploader.ts` |
| Rokt | `roktManager.ts`, `roktLauncherOptions.ts` |
| Types | `public-types.ts`, `internal-types.ts`, `types.ts`, `sdkRuntimeModels.ts` |
| Reporting | `logger.ts`, `reporting/` |

### Build

```bash
npm run watch            # IIFE + sourcemap
npm run watch:all
npm run watch:tests
npm run build:dev
npm run build            # all formats + types
npm run build:iife       # dist/mparticle.js
npm run build:npm        # CJS
npm run build:esm
npm run build:stub
npm run build:snippet    # snippet.min.js + snippet.rokt.min.js
npm run bundle           # uglify + gzip (size report)
```

Rollup entry: `src/mparticle-instance-manager.ts`.
Env: `ENVIRONMENT=dev|prod`, `BUILD=iife|cjs|esm|stub`, `BUILDALL=true`.

### Testing commands

```bash
npm run test                # build + Karma (ChromeHeadless, Firefox)
npm run test:debug          # interactive Chrome
npm run test:jest
npm run test:jest:watch
npm run test:stub
npm run test:browserstack
npm run test:integrations   # CJS / ESM / RequireJS host bundlers
```

**Karma:** reset with `_resetForTests`, mock HTTP with fetch-mock, await
`waitForCondition()` from `test/src/config/utils.js`.

**Jest:** jsdom, `jest.useFakeTimers()` / `jest.fn()`, mock `mpInstance` as needed.

### Storage

1. Primary: `localStorage`
2. Fallback: cookies (`document.cookie`)
3. Key pattern: `mp_[workspace]_[mpid]` (minified field names; see
   `persistence.interfaces.ts`)
4. Writes go through `vault.ts` so quota / disabled-storage failures do not
   throw out of event logging

```javascript
mpInstance._Persistence.setLocalStorage(key, value);
mpInstance._Store.devToken = 'xyz';
```

### API communication

- Events: `/v1/[workspace]/events`
- Identity: `/v1/[workspace]/identify`, `/login`, `/logout`, `/modify`, `/search`
- Config: `/v1/[workspace]/config`

`fetch` (polyfilled) → batch uploader → retry / timeout. Do not add a second
HTTP stack.

### Forwarders (kits)

```
Event → consent / attribute / anonymous / data-plan filters → active kits
```

Kit config is server-driven and can change at runtime. Sideloaded kits go
through `sideloadedKit.ts`.

### Session

Default timeout 30 minutes (`config.sessionTimeout`). Session id is on every
event. Reset the timer on user activity via `_SessionManager.resetSessionTimer()`.

### Common gotchas

1. **Manager vs instance** — `mParticle` is not `mpInstance`.
2. **`_` is private** — do not build new features or tests on private members
   when a public API exists.
3. **Identity is async** — always wait (`waitForCondition(hasIdentifyReturned)`).
4. **Snippet is a contract** — missing stub = silent data loss for script-tag users.
5. **Storage throws** — quota and `SecurityError` are real; use `vault.ts`.
6. **Kits are late** — they may not be ready at the first `logEvent`.
7. **Filters drop events** — data plan, consent, and kit filters all fire.
8. **APV state is on `window`** — module-level flags will reset on SPA re-exec.
9. **`noDeviceId` implies `noFunctional` + `noTargeting`** — do not split them.
10. **`dist/` is generated** — never hand-edit or hand-commit it.

### Debugging

- `config.logLevel = 'verbose'` or `mParticle.setLogLevel('verbose')`
- `npm run test:debug`
- Network: `/config`, `/events`, `/identity`
- Application tab: `localStorage` / cookies
- APV: inspect `window.__mpApv__`
- Dev builds include source maps

### Available skills

- **`/verify`**: lint + Jest + Karma. Run this before claiming a change is done.
  See `.claude/skills/verify/skill.md`.
- **`/kickstart`** / **`/handoff`**: session restore. See `.claude/skills/`.

### Additional resources

- Docs: https://docs.mparticle.com/developers/sdk/web/
- GitHub: https://github.com/mParticle/mparticle-web-sdk
- Architecture diagrams: `ARCHITECTURE.md`
- Contributing / commit types: `CONTRIBUTING.md`
