#!/usr/bin/env bash
#
# Builds every artefact listed in tracked-bundles.js, in whichever checkout this is
# run from. Both sides of a bundle-size comparison run this same script.
#
# It deliberately calls only npm scripts that exist on every live base branch
# (main, v3-development, master, development): the base side of a comparison is a
# commit that predates this check and cannot be assumed to have new scripts.

set -euo pipefail

# Clear the tracked outputs first so a failed build reports `not built` rather than the
# committed copies — see the README. The list comes from this script's own sibling
# module, never the checkout's, which on the base side predates it.
SCRIPT_DIRECTORY="$(cd "$(dirname "$0")" && pwd)"
node -e '
    const { trackedBundles } = require(process.argv[1]);
    process.stdout.write(trackedBundles.map(b => b.relativePath + "\n").join(""));
' "$SCRIPT_DIRECTORY/tracked-bundles.js" | while IFS= read -r bundle || [ -n "$bundle" ]; do
    [ -n "$bundle" ] && rm -f "$bundle"
done

npm ci

npm run build:iife
npm run build:npm
npm run build:esm
npm run build:stub
npm run build:snippet:rokt
npm run uglify

# kits/rokt only exists on the v3 branches; on a v2 base its row reports as not built.
if [ -d kits/rokt ]; then
    npm ci --prefix kits/rokt
    npm run build --prefix kits/rokt
fi
