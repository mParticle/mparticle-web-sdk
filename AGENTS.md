# mParticle Web SDK - Agent Instructions

Guidance for AI coding agents working in this repository. It is loaded into every agent
session, so it holds only what an agent cannot work out by reading the code: exact commands,
conventions that differ from tool defaults, and traps. Architecture diagrams are in
`ARCHITECTURE.md`, contribution mechanics in `CONTRIBUTING.md`, and the public API at
https://docs.mparticle.com/developers/sdk/web/.

<!-- COMMON SECTION - keep synced across all SDKs. Last updated: 2026-08-29 -->

## Code Quality Standards

- **Security First**: Prevent injection vulnerabilities (XSS, command injection, etc.)
- **Avoid Over-Engineering**: Only make changes that are directly requested or clearly necessary
- **No Premature Abstractions**: Don't create helpers or utilities for one-time operations
- **Keep It Simple**: Three similar lines of code is better than a premature abstraction
- **No Unnecessary Features**: Don't add error handling for scenarios that can't happen
- **Trust Internal Code**: Only validate at system boundaries (user input, external APIs)

## Logging and PII Obfuscation

**PII (Personally Identifiable Information)** is data that can identify a specific person,
for example: email, name or phone number, and similar attributes. Logging raw payloads can
expose PII in production.

- Use `obfuscateDevData(data, isDevelopmentMode)` from `utils` to log payloads - shows raw
  data in development mode, obfuscates in production.
- Use `obfuscateData(data)` from `utils` when you need to obfuscate a specific field.
- Log through `mpInstance.Logger.error()` / `.warning()` / `.verbose()`, never
  `console.log`. **ESLint does not enforce this**, so it is on you. Standard messages live
  in `Constants.Messages.ErrorMessages`.

## Git Commit Standards

Conventional Commits drive semantic-release, so the type you choose decides the version
bump:

| Type | Effect |
| --- | --- |
| `feat` | minor release |
| `fix` | patch release |
| `docs` `test` `refactor` `perf` `style` `chore` `ci` `build` `revert` | no release |

A `BREAKING CHANGE:` footer triggers a major release:

```
feat: new API for identity management

BREAKING CHANGE: Identity.login() now requires a callback parameter
```

## Testing Requirements

- Add tests for new features and bug fixes; cover both success and error cases.
- Use existing test patterns as examples rather than inventing new ones.
- Run the test suite before committing. See "Commands" below - the runners have traps.

<!-- END COMMON SECTION - everything below is web-platform specific -->

## Pull Requests: which branch

**Open PRs against `main`.** The `Check PR for semantic target branch` gate accepts only
`main` and `build/*`, so a PR based on anything else fails it.

`master` is still the GitHub *default* branch but is behind `main`, and `development` is a
legacy alias at the same commit as `master`. GitHub will offer `master` as the base - change
it. `CONTRIBUTING.md` still says `master`; `main` is correct.

Branch names are gated too: use `<type>/<description>`, e.g. `docs/release-process`.
PR titles must be valid Conventional Commits.

## Repository Layout

| Path | What it is |
| --- | --- |
| `src/` | Core SDK source, TypeScript |
| `test/src/` | Karma browser integration tests (`tests-*.ts`, some legacy `.js`) |
| `test/jest/` | Jest unit tests (`*.spec.ts`) |
| `test/integrations/` | Bundler smoke tests (browserify, webpack, rollup, RequireJS) |
| `kits/` | ~30 vendored forwarder integrations, each with its own build and tests |
| `dist/` | **Committed** build output - see the traps below |
| `scripts/`, `.github/workflows/` | Release automation and CI |

Entry point is `src/mparticle-instance-manager.ts`; the SDK instance and its public API
live in `src/mp-instance.ts`. The other ~58 files in `src/` are named after what they do
(`batchUploader.ts`, `sessionManager.ts`, `forwarders.ts`, ...) - read the directory rather
than trusting a list here, which is how the previous version of this file went stale.

## Commands

Node version is pinned in `.nvmrc` (v24.16.0). Install with `npm ci`.

| Task | Command |
| --- | --- |
| Build all bundles (iife, cjs, esm, stub) + types | `npm run build` |
| Build browser bundle only | `npm run build:iife` |
| Watch and rebuild | `npm run watch` |
| Karma browser tests | `npm test` |
| Jest unit tests | `npm run test:jest` |
| Bundler integration tests | `npm run test:integrations` |
| Cross-browser (BrowserStack) | `npm run test:browserstack` |
| ESLint (`src/` and `test/src/`) | `npm run lint` |
| Prettier check | `npm run prettier` |
| Minify + gzip for size reporting | `npm run bundle` |

`/verify` (see Skills) runs lint, build and Jest in one step.

### Command traps

These cost real debugging time and none of them are visible from the script names.

1. **`npm test` needs a Firefox binary.** `test/karma.config.js` runs
   `['ChromeHeadless', 'FirefoxHeadless']`. With no Firefox installed the launcher crashes
   and takes karma-server down with it. Run
   `npx karma start test/karma.config.js --browsers ChromeHeadless --single-run` instead.
2. **Karma's exit code can lie.** When the launcher dies the command may still exit 0. Read
   the `TOTAL:` line in the output, not `$?`.
3. **Both runners need a built `dist/`.** Karma serves `../dist/mparticle.js` and Jest loads
   it via `setupFiles` in `jest.config.js`. `npm test` builds first; `npm run test:jest` and
   a bare `karma start` do **not**. Run `npm run build` on a fresh clone and after any
   `src/` change, or you will chase failures that have nothing to do with your diff.
4. **`dist/` is committed, and every build rewrites it.** CI regenerates it on merge
   (`chore(build): Generate latest bundle [skip ci]`), so a source-only PR should not carry
   dist churn. Run `git checkout -- dist/` before committing.
5. **Prettier is pinned to 1.18.2, which predates optional chaining.** `x?.[key]` makes it
   report `Parsing error: Expression expected` and **silently stop formatting the whole
   file**. Prefer an explicit local: `const win = getWindow(); win ? win.foo : undefined`.
6. **Prettier only checks JavaScript.** `npm run prettier` globs `"**/*.js"`, so TypeScript
   formatting comes from gts via ESLint and a `.ts` file can pass Prettier untouched.
7. **Jest skips two kits by design.** `jest.config.js` ignores `kits/adobe` (kit-level Jest
   setup) and `kits/rokt` (Vitest, whose `.spec.ts` names collide with Jest's default
   `testMatch`).

## TypeScript and JavaScript Conventions

`src/` is TypeScript (the only `.js` left is `src/stub/mparticle.stub.js`). `test/src/`
still has 7 legacy `.js` specs alongside 34 `.ts` ones; write new tests in TypeScript.

**tsconfig** extends `gts/tsconfig-google.json` and then loosens it - `target: es5`,
`lib: [es5, es6, dom]`, `moduleResolution: Node`, and importantly
**`strictNullChecks: false` and `noImplicitAny: false`**. Don't assume strict-mode
guarantees.

**Naming**: interfaces are prefixed `I` or `SDK` (`IFeatureName`, `SDKFeatureName`);
constants are `UPPER_SNAKE_CASE`; a leading underscore means private/internal
(`_privateMethod`).

**Prettier** (`.prettierrc`) sets only three things: `tabWidth: 4`, `singleQuote: true`,
`trailingComma: "es5"`. Everything else, including the 80-column width, is Prettier's default.

**Linting by file type**: `.js` uses ESLint + Prettier, `.ts` uses ESLint + gts. A
pre-commit hook runs ESLint and fails the commit on errors.

## Instance Model

`mParticle` is the global **manager**; `mpInstance` is an individual **SDK instance**.
`init(apiKey, config, instanceName?)` creates one and `getInstance(instanceName?)` retrieves
it, so a page can run several isolated instances - each with its own config, identity and
state.

Internal modules hang off the instance (`mpInstance._Store`, `._Identity`, `._Persistence`,
`._Forwarders`, ...) and receive `mpInstance` as a parameter. That is the
dependency-injection seam that keeps modules testable and the dependency graph acyclic - use
it instead of importing modules directly.

## Common Gotchas

1. **Instance vs manager**: `mParticle` is the manager, `mpInstance` is the SDK instance.
2. **Async identity**: identity calls are asynchronous - use the callbacks.
3. **Forwarder timing**: kits are configured from server config on init and may not be
   initialized immediately.
4. **Silent event drops**: events can be blocked by data plan rules (`kitBlocking.ts`) or
   consent state, so "the event never arrived" is often correct behaviour.
5. **Storage limits**: persistence prefers `localStorage` (~5-10 MB) and falls back to
   cookies (4 KB). Keys follow `mp_[workspace]_[mpid]`.
6. **Test state leaks**: reset with `mParticle._resetForTests(MPConfig)` in `beforeEach` for
   Karma tests.

## Test Tooling

- **Karma** (`test/src/tests-*.ts`) - full SDK in a real browser. Mock HTTP with
  `fetch-mock/esm/client`, await async work with `waitForCondition()` from
  `test/src/config/utils.js` (imported as `Utils`), assert with chai, spy with sinon.
- **Jest** (`test/jest/*.spec.ts`) - isolated units under jsdom. Fake timers via
  `jest.useFakeTimers()`, mock `global.fetch`, build minimal mock `mpInstance` objects.

## Available Skills

Defined in `.claude/skills/`:

| Skill | Use it for |
| --- | --- |
| `/verify` | Lint, build and Jest in one step before committing |
| `/debug-build` | TypeScript compile and Rollup bundling failures |
| `/debug-jest` | Jest assertion, mock and coverage failures |
| `/debug-api` | HTTP, network and API-contract failures |
| `/handoff` | Write a handoff document to transfer session context |
| `/kickstart` | Resume a session from a handoff document |
| `/session-recap` | Re-orient after an interruption |
