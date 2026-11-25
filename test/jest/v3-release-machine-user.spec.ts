import * as fs from 'fs';
import * as path from 'path';

const yaml = require('js-yaml');

const WORKFLOW_DIRECTORY = path.join(__dirname, '../../.github/workflows');
const RELEASE_ENVIRONMENT = 'v3-release-machine-user';
const RELEASE_SECRETS =
    /secrets\.(MP_SEMANTIC_RELEASE_BOT|SDK_RELEASE_GITHUB_CLIENT_ID|SDK_RELEASE_GITHUB_APP_PRIVATE_KEY|GPG_PRIVATE_KEY|GPG_PASSPHRASE)\b/;
const APP_TOKEN_ACTION = /^actions\/create-github-app-token@[0-9a-f]{40}$/;
// Reads the token only in the legacy branch mode; a tag dispatch uses github.token.
const LEGACY_BRANCH_MODE_JOBS = ['v3-release-step-1.yml#release'];

function v3ReleaseWorkflows(): Array<[string, any]> {
    return fs
        .readdirSync(WORKFLOW_DIRECTORY)
        .filter(name => /^v3-release-.*\.ya?ml$/.test(name))
        .map(name => [
            name,
            yaml.load(fs.readFileSync(path.join(WORKFLOW_DIRECTORY, name), 'utf8')),
        ]);
}

describe('V3 release machine user secrets', () => {
    it('are read only by jobs in the v3-release-machine-user Environment', () => {
        const inside: string[] = [];
        const outside: string[] = [];
        for (const [file, workflow] of v3ReleaseWorkflows()) {
            expect(JSON.stringify(workflow.env || {})).not.toMatch(RELEASE_SECRETS);
            for (const [name, job] of Object.entries<any>(workflow.jobs || {})) {
                if (!RELEASE_SECRETS.test(JSON.stringify(job))) {
                    continue;
                }
                const environment =
                    typeof job.environment === 'object' ? job.environment?.name : job.environment;
                const id = `${file}#${name}`;
                (environment === RELEASE_ENVIRONMENT ? inside : outside).push(id);
            }
        }
        expect(outside).toEqual(LEGACY_BRANCH_MODE_JOBS);
        expect(inside).toEqual(
            expect.arrayContaining([
                'v3-release-please.yml#release-please',
                'v3-release-please-dist.yml#commit-dist',
                'v3-release-step-1.yml#advance-staging',
                'v3-release-step-2.yml#promote-release-candidate',
                'v3-release-step-3.yml#synchronize-branches',
            ])
        );
    });

    it('push with a release app token scoped to this repository, never the machine user token', () => {
        const minting: string[] = [];
        for (const [file, workflow] of v3ReleaseWorkflows()) {
            for (const [name, job] of Object.entries<any>(workflow.jobs || {})) {
                const id = `${file}#${name}`;
                if (!LEGACY_BRANCH_MODE_JOBS.includes(id)) {
                    expect(JSON.stringify(job)).not.toContain(
                        'secrets.MP_SEMANTIC_RELEASE_BOT'
                    );
                }
                const mint = (job.steps || []).find(
                    (step: any) => step.id === 'release-app-token'
                );
                if (!mint) {
                    continue;
                }
                minting.push(id);
                expect(mint.uses).toMatch(APP_TOKEN_ACTION);
                expect(mint.with).toEqual(
                    expect.objectContaining({
                        'client-id': '${{ secrets.SDK_RELEASE_GITHUB_CLIENT_ID }}',
                        'private-key':
                            '${{ secrets.SDK_RELEASE_GITHUB_APP_PRIVATE_KEY }}',
                        owner: '${{ github.repository_owner }}',
                        repositories: '${{ github.event.repository.name }}',
                        'permission-contents': 'write',
                    })
                );
            }
        }
        expect(minting.sort()).toEqual([
            'v3-release-please-dist.yml#commit-dist',
            'v3-release-please.yml#release-please',
            'v3-release-step-1.yml#advance-staging',
            'v3-release-step-2.yml#promote-release-candidate',
            'v3-release-step-3.yml#synchronize-branches',
        ]);
    });
});
