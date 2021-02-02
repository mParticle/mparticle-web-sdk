module.exports = {
    branches: ['master'],
    tagFormat: 'v${version}',
    repositoryUrl: 'https://github.com/mParticle/mparticle-web-sdk-public-test',
    plugins: [
        [
            '@semantic-release/commit-analyzer',
            {
                preset: 'angular',
            },
        ],
        [
            '@semantic-release/release-notes-generator',
            {
                preset: 'angular',
            },
        ],
        [
            '@semantic-release/changelog',
            {
                changelogFile: 'CHANGELOG.md',
            },
        ],
        [
            '@semantic-release/npm',
            {
                npmPublish: false,
            },
        ][
            ('@semantic-release/exec',
            {
                verifyReleaseCmd: 'sh ./scripts/release.sh',
            })
        ],
        [
            '@semantic-release/github',
            {
                assets: [
                    'dist/mparticle.common.js',
                    'dist/mparticle.esm.js',
                    'dist/mparticle.js',
                    'mparticle.stub.js',
                ],
            },
        ],
        [
            '@semantic-release/git',
            {
                assets: [
                    'package.json',
                    'package-lock.json',
                    'CHANGELOG.md',
                    'snippet.js',
                    'snippet.min.js',
                ],
                message:
                    'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
            },
        ],
    ],
};
