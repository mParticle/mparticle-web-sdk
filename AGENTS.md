# AGENTS.md

Third-party SDK on customer pages, including checkout. Security, public-API
compat, and gzip size are product constraints. CI diffs gzip size against
`master`.

Agents can find files, scripts, and style settings in the tree (`package.json`,
`.eslintrc`, `.prettierrc`, `src/`, `test/`). Do not add maps or command
catalogs here.

## Hard rules

- No `eval`, `new Function`, inline handlers, or `window.*` outside
  `window.mParticle` and `window.__mpApv__`.
- No `console.log`. Use `mpInstance.Logger` or `src/reporting/`.
- No comments unless the build requires it (`eslint-disable`) or the reader
  cannot infer a real external gotcha from the code.
- New source is TypeScript. Do not add `.js` modules. Do not convert a file's
  module style (constructor+`mpInstance` vs class) unless that is the task.
- Do not commit `dist/`, `CHANGELOG.md`, or version bumps — release CI writes
  those.
- Feature PRs target **`development`**. `master` is release-only. (Ignore
  `CONTRIBUTING.md` if it still says `master`.)

## Contracts the code will not tell you

- A public method missing from **both** `snippet.js` and `snippet.rokt.js` is
  silently dropped for every script-tag customer who calls it before load. Keep
  the two lists in sync; update `src/stub/mparticle.stub.js` when the stub
  should expose it.
- Customer types go in `src/public-types.ts`. Kit/Rokt-shared types go in
  `src/internal-types.ts` (`@mparticle/web-sdk/internal`).
- Identity methods are callback-based and async. Do not change public
  signatures. Pre-init calls must keep queuing (`queueIfNotInitialized`).
- `noDeviceId` / `noDeviceID` implies `noFunctional` and `noTargeting`
  (`src/roktLauncherOptions.ts`). Do not split that.
- APV state lives on `window.__mpApv__` because some hosts (Next.js) re-execute
  the bundle and wipe module scope. Tests must drive `pageViewTracker.ts`
  through public APIs, not internals.
- Storage writes go through `src/vault.ts` so quota / `SecurityError` cannot
  break event logging.
- Log payloads with `obfuscateDevData` / `obfuscateData` from `src/utils.ts`.
  Never log raw identity maps or attribute bags in production.
- This repo does not load Rokt `launcher.js`. The kit / WSDK owns that.

## Tests

- Jest (`test/jest`) for isolated TS units. Karma (`test/src`) for public API
  and browser behavior — that is the suite that proves snippet + `init`.
- Karma: `mParticle._resetForTests(MPConfig)` in `beforeEach`. Await identity
  with `waitForCondition` from `test/src/config/utils.js` (it is `.js`).
- After code changes: `npm run lint` and `npm run test:jest`. Run `npm run test`
  (build + Karma) when the public API or snippet is involved.
