#!/usr/bin/env sh
# Builds the core bundles and every publishable kit for a V3 release at
# VERSION. Shared by scripts/release.sh and the V3 candidate packaging CI
# check so both build exactly the same way. It does not commit anything.
set -eu

VERSION=${1:-}
if [ -z "$VERSION" ]; then
    echo "Error: VERSION argument required. Usage: ./scripts/build-v3-release.sh <version>" >&2
    exit 1
fi

echo '---------- Begin validate kit release inventory ----------'
BUILD_PATHS_FILE=$(mktemp)
trap 'rm -f "$BUILD_PATHS_FILE"' 0
trap 'exit 1' 1 2 15
node -e "
        const {
            loadReleaseInventory,
            serializeBuildPaths,
        } = require('./scripts/prepare-kit-release');
        const inventory = loadReleaseInventory();
        process.stdout.write(serializeBuildPaths(inventory.buildPaths));
    " > "$BUILD_PATHS_FILE"

echo '---------- Begin generate latest core bundle ----------'
rm -rf dist
npm run build

echo '---------- Begin update kit versions ----------'
node scripts/prepare-kit-release.js "$VERSION"

echo '---------- Begin generate kit bundles ----------'
while IFS= read -r KIT_PATH; do
    [ -n "$KIT_PATH" ] || continue
    echo "Installing dependencies for $KIT_PATH"
    npm ci --prefix "$KIT_PATH"
    rm -rf "$KIT_PATH/dist"
    echo "Building $KIT_PATH"
    npm run build --prefix "$KIT_PATH"
done < "$BUILD_PATHS_FILE"
rm -f "$BUILD_PATHS_FILE"
trap - 0 1 2 15
