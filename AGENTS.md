# mParticle Web SDK - Agent Instructions

Guidance for AI coding agents working in this repository. It is loaded into every agent
session, so it holds only what an agent cannot get from the repo itself: traps, and
conventions that no config file encodes. Anything a config file already states is
deliberately absent - read the config, it cannot go stale. Architecture diagrams are in
`ARCHITECTURE.md` and the public API at https://docs.mparticle.com/developers/sdk/web/.

<!-- COMMON SECTION - keep synced across all SDKs. Last updated: 2026-08-29 -->

## Code Quality Standards

- **Security First**: Prevent injection vulnerabilities (XSS, command injection, etc.)
- **Avoid Over-Engineering**: Only make changes that are directly requested or clearly necessary
- **No Premature Abstractions**: Don't create helpers or utilities for one-time operations
- **Keep It Simple**: Three similar lines of code is better than a premature abstraction
- **No Unnecessary Features**: Don't add error handling for scenarios that can't happen
- **Trust Internal Code**: Only validate at system boundaries (user input, external APIs)

## Logging and PII

Logging a raw payload can leak PII (email, name, phone number, and similar attributes) into
production logs.

- Log payloads with `obfuscateDevData(data, isDevelopmentMode)` from `utils` - raw in
  development mode, obfuscated in production. `obfuscateData(data)` does a single field.
- Log through `mpInstance.Logger.error()` / `.warning()` / `.verbose()`, never `console.log`.
  **ESLint does not enforce this**, so it is on you. Standard messages live in
  `Constants.Messages.ErrorMessages`.

## Commits

Conventional Commits are required and gated by `Check PR for semantic title`.

Choose the type deliberately: `release.config.js` maps types to version bumps, and **most
types cut a release** here, not just `feat` and `fix`. Check that file rather than assuming
the usual defaults. A `BREAKING CHANGE:` footer cuts a major.

Add tests with any feature or bug fix, covering the failure path as well as the happy one.

<!-- END COMMON SECTION - everything below is web-platform specific -->

## Pull Requests

**Base PRs on `main`.** GitHub still offers `master` as the default base and
`CONTRIBUTING.md` still says `master`; both are stale. The `Check PR for semantic target
branch` check accepts only `main` and `build/*`, so a wrong base fails it immediately.

Branch names must be `<type>/<description>`, e.g. `docs/release-process`.

Every PR from a fork shows `BrowserStack Test` and `Notify GChat` red, because GitHub
withholds secrets from fork runs. Neither is a required check. Read `mergeStateStatus`
(`UNSTABLE` = only non-required checks red) rather than the check list.

## Repository Layout

Read the tree for file names - it changes faster than this file can. The parts worth knowing
up front:

| Path | Why it is not obvious |
| --- | --- |
| `test/src/` | Karma browser tests, `tests-*.ts` (a few legacy `.js`) |
| `test/jest/` | Jest unit tests, `*.spec.ts` - a *different* runner, run separately |
| `kits/` | Vendored forwarder integrations, each with its own build and test setup |
| `dist/` | **Committed** to the repo, and rebuilt by every build - see the traps below |

Entry point is `src/mparticle-instance-manager.ts`; the SDK instance and its public API live
in `src/mp-instance.ts`.

## Commands

Node version is in `.nvmrc`. Install with `npm ci`. `npm run` lists everything; these are the
ones whose names do not tell you what they cover:

| Task | Command |
| --- | --- |
| Build all bundles + types | `npm run build` |
| Karma browser tests | `npm test` |
| Jest unit tests (**not** in `npm test`) | `npm run test:jest` |
| Bundler smoke tests | `npm run test:integrations` |
| ESLint + Prettier (**JavaScript only**) | `npm run lint`, `npm run prettier` |
| Typecheck TypeScript (not run by CI) | `npm run build:ts` |
| Lint TypeScript (not run by CI) | `npm run gts:check` |

`/verify` runs lint, build and Jest in one step.

### Command traps

None of these are visible from a script name, and each one costs real debugging time.

1. **`npm test` needs a Firefox binary.** `test/karma.config.js` runs
   `['ChromeHeadless', 'FirefoxHeadless']`. With no Firefox installed the launcher crashes
   and takes karma-server down with it. Use
   `npx karma start test/karma.config.js --browsers ChromeHeadless --single-run` instead.
2. **Karma's exit code can lie.** When the launcher dies the command may still exit 0. Read
   the `TOTAL:` line, not `$?`.
3. **Both runners need a built `dist/`.** Karma serves `../dist/mparticle.js` and Jest loads
   it via `setupFiles`. `npm test` builds first; `npm run test:jest` and a bare `karma start`
   do **not**. Run `npm run build` on a fresh clone and after any `src/` change, or you will
   chase failures that have nothing to do with your diff.
4. **`dist/` is committed, and every build rewrites it.** CI regenerates it on merge, so a
   source-only PR should not carry dist churn. Run `git checkout -- dist/` before committing.
5. **Prettier is pinned at `1.18.2` (exact, no caret), which predates optional chaining.**
   `x?.[key]` makes it report `Parsing error: Expression expected` and **silently stop
   formatting the whole file**. Prefer an explicit local:
   `const win = getWindow(); win ? win.foo : undefined`. Check the pin in `package.json`
   before assuming this still bites.
6. **Nothing checks your TypeScript.** `npm run lint` passes no `--ext`, so ESLint lints
   `.js` only - measured: 21 `.js` files, zero `.ts`. `npm run prettier` globs `"**/*.js"`.
   `gts:check` exists as a script but no hook or workflow calls it. And `build:types` runs
   `tsc -p tsconfig.types.json || true`, which **swallows type errors**. So neither CI nor the
   `pre-commit` hook (which just runs `npm run lint`) will catch a type error or a formatting
   slip in a `.ts` file. Run `npm run build:ts` and `npm run gts:check` yourself.
7. **Jest skips two kits by design.** `kits/adobe` has kit-level Jest setup, and `kits/rokt`
   uses Vitest, whose `.spec.ts` names would otherwise be falsely matched by Jest.

## Conventions

New code is TypeScript. `src/` is TypeScript throughout apart from the stub entry point.

**`strictNullChecks` and `noImplicitAny` are both off**, so do not rely on strict-mode
guarantees you would normally get in a TypeScript project. This is the one tsconfig fact
worth stating here; read `tsconfig.json` for the rest.

**Naming is convention only - no lint rule enforces it.** Interfaces are prefixed `I` or
`SDK` (`IFeatureName`, `SDKFeatureName`), constants are `UPPER_SNAKE_CASE`, and a leading
underscore means private/internal (`_privateMethod`).

Formatting values are in `.prettierrc` and enforced through ESLint for JavaScript - match the
surrounding file rather than looking them up. **For TypeScript nothing enforces them at all;
see trap 6.**

## Instance Model

`mParticle` is the global **manager**; `mpInstance` is an individual **SDK instance**.
`init(apiKey, config, instanceName?)` creates one and `getInstance(instanceName?)` retrieves
it, so a page can run several isolated instances, each with its own config, identity and
state.

Internal modules hang off the instance (`mpInstance._Store`, `._Identity`, `._Persistence`,
`._Forwarders`, ...) and receive `mpInstance` as a parameter. That dependency-injection seam
is what keeps modules testable and the dependency graph acyclic - use it instead of importing
modules directly.

## Gotchas

1. **Async identity**: identity calls are asynchronous - use the callbacks.
2. **Forwarder timing**: kits are configured from server config on init and may not be
   initialized immediately.
3. **Silent event drops**: events can be blocked by data plan rules (`kitBlocking.ts`) or by
   consent state, so "the event never arrived" is often correct behaviour.
4. **Test state leaks**: reset with `mParticle._resetForTests(MPConfig)` in `beforeEach` for
   Karma tests.
5. **Custom async helper**: await Karma async work with `waitForCondition()` from
   `test/src/config/utils.js` (imported as `Utils`) rather than raw timeouts.

## Skills

`.claude/skills/` holds `/verify`, `/debug-build`, `/debug-jest`, `/debug-api`, `/handoff`,
`/kickstart` and `/session-recap`. Claude Code discovers them automatically; read the
directory for what each covers.
