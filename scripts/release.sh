#!/usr/bin/env bash
set -eo pipefail

echo '---------- Validate arguments ----------'
VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Error: VERSION argument required. Usage: ./scripts/release.sh <version>"
    exit 1
fi

echo '---------- Begin generate latest bundle ----------'
npm run build
git add dist -f
git diff --cached --quiet || git commit -m 'chore(build): Generate latest bundle [skip ci]'

echo '---------- Begin build kit bundles ----------'
if [ -f kits/matrix.json ]; then
    while IFS= read -r KIT_PATH; do
        echo "Installing dependencies for $KIT_PATH..."
        npm ci --prefix "$KIT_PATH"
        echo "Building $KIT_PATH..."
        npm run build --prefix "$KIT_PATH"
    done < <(jq -r '.[].local_path' kits/matrix.json)
fi

echo '---------- Begin commit kit bundles ----------'
if [ -f kits/matrix.json ]; then
    while IFS= read -r KIT_PATH; do
        while IFS= read -r DIST_PATH; do
            git add "$DIST_PATH" -f
            echo "Staged $DIST_PATH"
        done < <(find "$KIT_PATH" -type d -name "dist" -not -path "*/node_modules/*")
    done < <(jq -r '.[].local_path' kits/matrix.json)
fi
git diff --cached --quiet || git commit -m 'chore(build): Generate kit bundles [skip ci]'

echo '---------- Begin update kit versions ----------'
if [ -f kits/matrix.json ]; then
    while IFS= read -r KIT_PATH; do
        while IFS= read -r PKG_JSON; do
            PKG_DIR="$(dirname "$PKG_JSON")"
            npm pkg set version="$VERSION" --prefix "$PKG_DIR"
            echo "Updated $PKG_JSON to $VERSION"
        done < <(find "$KIT_PATH" -name "package.json" -not -path "*/node_modules/*")
    done < <(jq -r '.[].local_path' kits/matrix.json)
fi

echo '---------- Begin commit kit version updates ----------'
git add 'kits/**/package.json'
git diff --cached --quiet || git commit -m "chore(release): Update kit versions to $VERSION [skip ci]"
