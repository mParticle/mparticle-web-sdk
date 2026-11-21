#!/usr/bin/env bash
# Builds core's and the Rokt kit's IIFE bundles in the current checkout for the CDN-shaped size report. A bundle whose
# build fails is removed, even when the build wrote it first, so the report reads "not built" instead of a stale size.

CORE=dist/mparticle.js
KIT=kits/rokt/dist/Rokt-Kit.iife.js

rm -f "$CORE" "$KIT"
{ npm ci && npm run build:iife; } || rm -f "$CORE"
(cd kits/rokt && npm ci && npm run build) || rm -f "$KIT"
exit 0
