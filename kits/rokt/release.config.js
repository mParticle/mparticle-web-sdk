module.exports = {
    branches: ['main'],
    tagFormat: 'v${version}',
    repositoryUrl:
        'https://github.com/mparticle-integrations/mparticle-javascript-integration-rokt',
    plugins: [
        [
            '@semantic-release/commit-analyzer',
            {
                preset: 'angular',
                releaseRules: [
                    { type: 'feat', release: 'minor' },
                    { type: 'ci', release: 'patch' },
                    { type: 'fix', release: 'patch' },
                    { type: 'docs', release: 'patch' },
                    { type: 'test', release: 'patch' },
                    { type: 'refactor', release: 'patch' },
                    { type: 'style', release: 'patch' },
                    { type: 'build', release: 'patch' },
                    { type: 'chore', release: 'patch' },
                    { type: 'revert', release: 'patch' },
                ],
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
                npmPublish: false, // Disable npm publish here; we use exec with OIDC instead
            },
        ],
        [
            '@semantic-release/exec',
            {
                prepareCmd: 'sh ./scripts/release.sh',
                publishCmd: 'npm publish',
            },
        ],
        [
            '@semantic-release/github',
            {
                assets: ['dist/Rokt-Kit.common.js', 'dist/Rokt-Kit.iife.js'],
            },
        ],
        [
            '@semantic-release/git',
            {
                assets: ['package.json', 'package-lock.json', 'CHANGELOG.md'],
                message:
                    'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
            },
        ],
    ],
};
