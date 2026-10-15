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

if [ "$TRACK" = "v3" ]; then
    # Exit 1 on a signal during the build, as before the build was extracted.
    trap 'exit 1' 1 2 15
    sh ./scripts/build-v3-release.sh "$VERSION"
    trap - 1 2 15
else
    echo '---------- Begin generate latest core bundle ----------'
    rm -rf dist
    npm run build
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
