echo '---------- Begin generate latest bundle ----------'
npm run build
git add dist -f
git commit -m 'chore(build): Generate latest bundle [skip ci]'