#!/usr/bin/env sh
set -eu

VERSION=${1:-}
if [ -z "$VERSION" ]; then
    echo "Error: VERSION argument required. Usage: ./scripts/release.sh <version>" >&2
    exit 1
fi
case "${TRACK:-}" in
    v2|v3) ;;
    *)
        echo "Error: TRACK must be v2 or v3" >&2
        exit 1
        ;;
esac

echo '---------- Begin generate latest core bundle ----------'
rm -rf dist
npm run build

if [ "$TRACK" = "v3" ]; then
    echo '---------- Begin update kit versions ----------'
    node scripts/prepare-kit-release.js "$VERSION"

    echo '---------- Begin generate kit bundles ----------'
    BUILD_PATHS_FILE=$(mktemp)
    trap 'rm -f "$BUILD_PATHS_FILE"' 0
    trap 'exit 1' 1 2 15
    node -e "
        const inventory = require('./scripts/prepare-kit-release').loadReleaseInventory();
        process.stdout.write(inventory.buildPaths.join('\n'));
    " > "$BUILD_PATHS_FILE"
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
fi

echo '---------- Begin commit generated bundles ----------'
git add dist -f
if [ "$TRACK" = "v3" ]; then
    find kits -type d -name dist -not -path '*/node_modules/*' \
        -exec git add -f -- {} +
fi
if ! git diff --cached --quiet; then
    git commit -m 'chore(build): Generate release bundles [skip ci]'
fi
