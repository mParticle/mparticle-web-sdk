#!/usr/bin/env bash
#
# Builds every artefact listed in tracked-bundles.js, in whichever checkout this is
# run from. Both sides of a bundle-size comparison run this same script.
#
# It deliberately calls only npm scripts that exist on every live base branch
# (main, v3-development, master, development): the base side of a comparison is a
# commit that predates this check and cannot be assumed to have new scripts.

set -euo pipefail

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
