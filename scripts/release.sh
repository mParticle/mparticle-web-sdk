echo '---------- Begin generate latest bundle ----------'
npm run build
git add dist -f
git commit -m 'chore(build): Generate latest bundle [skip ci]'

echo '---------- Begin update kit versions ----------'
VERSION=$1
if [ -f kits/matrix.json ]; then
    jq -r '.[].local_path' kits/matrix.json | while read KIT_PATH; do
        npm pkg set version="$VERSION" --prefix "$KIT_PATH"
        echo "Updated $KIT_PATH/package.json to $VERSION"
    done
fi
