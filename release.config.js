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
            ('@semantic-release/exec',
            {
                prepareCmd: 'sh ./scripts/release.sh',
                failCmd:
                    'npm unpublish @mparicle/web-sdk@${nextRelease.version}',
            }),
        ],
        [
            '@semantic-release/npm',
            {
                npmPublish: true,
            },
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
    ci: false,
};
