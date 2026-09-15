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

## Running it locally

```sh
bash scripts/bundle-size/build-bundles.sh
node scripts/bundle-size/report.js
```

To compare two checkouts, snapshot one and use it as the baseline for the other:

```sh
node scripts/bundle-size/report.js --cwd ../base --out base.json
node scripts/bundle-size/report.js --cwd . --baseline base.json
```
