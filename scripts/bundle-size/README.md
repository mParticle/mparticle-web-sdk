# Bundle size check

Reports how a pull request moves the gzipped size of the artefacts consumers download.
It is informational — the `Bundle Size` job never fails a PR.

The job builds **both** the PR head and the commit the PR is based on from source, in
one job, then renders a table into a sticky PR comment and the run's step summary.
Building both sides with one toolchain is the point: an earlier version of this check
compared the committed `dist/` against a `master` build with an unpinned minifier, and
reported size changes on PRs that could not touch the bundle.

## Adding or removing a tracked bundle

Edit `trackedBundles` in [`tracked-bundles.js`](./tracked-bundles.js), and make sure
[`build-bundles.sh`](./build-bundles.sh) produces it. That script may only call npm
scripts that already exist on every live base branch — the base side of a comparison is
a commit that predates whatever you are adding.

A bundle the base branch does not produce shows as `new`; one this branch does not
produce shows as `not built`.

## Why the build script deletes before it builds

Six of the seven tracked paths are committed to the repo, so every checkout already
holds release-time copies. Both build steps in the workflow are `continue-on-error`, so
the report is rendered even when a build fails — and it would measure those committed
files and present them as this branch's sizes, usually as `no change`. That is the
defect this check exists to catch, so `build-bundles.sh` removes every tracked path
before installing, and a failure then shows up honestly as `not built`.

## Running it locally

```sh
bash scripts/bundle-size/build-bundles.sh
node scripts/bundle-size/report.js
```

Note that the build script deletes the tracked bundle outputs before rebuilding them:
the tracked files under `dist/`, `snippet.rokt.min.js`, and the kit's
`kits/rokt/dist/Rokt-Kit.iife.js`. Each is removed by name, never as a directory. On a
clean tree the rebuild restores them; if you are holding uncommitted edits to any built
artefact, stash or commit them first.

To compare two checkouts, snapshot one and use it as the baseline for the other:

```sh
node scripts/bundle-size/report.js --cwd ../base --out base.json
node scripts/bundle-size/report.js --cwd . --baseline base.json
```
