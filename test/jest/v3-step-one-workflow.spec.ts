/* eslint-env jest, node, es2021 */
/* eslint-disable no-undef */

import * as fs from 'fs';
import * as path from 'path';

const {load} = require('js-yaml');

type Step = {
    id?: string;
    name?: string;
    run?: string;
    uses?: string;
    with?: Record<string, string>;
};

type Job = {
    environment?: {name: string};
    needs?: string | string[];
    outputs?: Record<string, string>;
    permissions?: Record<string, string>;
    steps: Step[];
};

type Workflow = {
    name: string;
    on: Record<string, unknown>;
    permissions: Record<string, string>;
    jobs: Record<string, Job>;
};

const repositoryRoot = path.resolve(__dirname, '../..');
const workflowPath = path.join(
    repositoryRoot,
    '.github/workflows/reusable-v3-staging-step-1.yml'
);
const source = fs.readFileSync(workflowPath, 'utf8');
const workflow = load(source) as Workflow;
const prepare = workflow.jobs['prepare-candidate'];
const publish = workflow.jobs['approve-and-publish'];
const exactReleaseSource = fs.readFileSync(
    path.join(repositoryRoot, 'scripts/release/exact-release.js'),
    'utf8'
);

function stepText(job: Job) {
    return job.steps.map(step => step.run || '').join('\n');
}

function findStep(job: Job, name: string) {
    const step = job.steps.find(candidate => candidate.name === name);
    expect(step).toBeDefined();
    return step!;
}

describe('reusable v3 Step 1 workflow contract', () => {
    it('is workflow_call-only and statically connected', () => {
        expect(Object.keys(workflow.on)).toEqual(['workflow_call']);

        const liveCaller = fs.readFileSync(
            path.join(
                repositoryRoot,
                '.github/workflows/staging-step-1.yml'
            ),
            'utf8'
        );
        expect(liveCaller).toContain(
            'reusable-v3-staging-step-1.yml'
        );
    });

    it('uses only v3 trunk release targets', () => {
        expect(source).toContain('refs/heads/main');
        expect(source).toContain('refs/heads/v3-staging');
        expect(exactReleaseSource).toContain("'--tag'");
        expect(exactReleaseSource).toContain("'next'");
        expect(source).not.toMatch(
            /refs\/heads\/(?:master|development|staging)(?:\s|$)/
        );
        expect(source).not.toContain('v3-development');
        expect(source).not.toContain('release.config.js');
        expect(source).not.toContain('semantic-release');
        expect(exactReleaseSource).not.toMatch(
            /['"](?:--tag=?)?latest['"]/
        );
    });

    it('creates the candidate before entering the protected gate', () => {
        expect(prepare.environment).toBeUndefined();
        expect(publish.environment).toEqual({name: 'v3-playground'});
        expect(publish.needs).toBe('prepare-candidate');
        expect(stepText(prepare)).toContain(
            '${CANDIDATE_SHA}:refs/heads/v3-staging'
        );

        const beforeApproval = stepText(prepare);
        expect(beforeApproval).not.toContain('npm publish');
        expect(beforeApproval).not.toContain('gh release create');
        expect(beforeApproval).not.toMatch(/\bgit tag\b/);
        expect(beforeApproval.match(/\bgit push\b/g)).toHaveLength(1);
        expect(beforeApproval).toContain('--force-with-lease=');
        expect(beforeApproval).not.toMatch(/\bgit push --force(?:\s|$)/);
        expect(
            prepare.steps.findIndex(step =>
                step.name?.includes('durable prepared')
            )
        ).toBeLessThan(
            prepare.steps.findIndex(step =>
                step.name?.includes('awaiting approval')
            )
        );
        expect(
            publish.steps.findIndex(step =>
                step.name?.includes('Append approved')
            )
        ).toBeGreaterThan(
            publish.steps.findIndex(step =>
                step.name?.includes('Checkout approved candidate')
            )
        );
    });

    it('creates the immutable stable tag before npm publication', () => {
        const tagIndex = publish.steps.findIndex(step =>
            step.name?.includes('immutable stable tag')
        );
        const publishIndex = publish.steps.findIndex(step =>
            step.name?.includes('Publish only exact')
        );
        const releaseIndex = publish.steps.findIndex(step =>
            step.name?.includes('Create GitHub Release')
        );
        const auditIndex = publish.steps.findIndex(step =>
            step.name?.includes('Audit all 34')
        );

        expect(tagIndex).toBeGreaterThan(-1);
        expect(
            publish.steps.findIndex(step =>
                step.name?.includes('Append publishing')
            )
        ).toBeLessThan(tagIndex);
        expect(tagIndex).toBeLessThan(publishIndex);
        expect(publishIndex).toBeLessThan(auditIndex);
        expect(auditIndex).toBeLessThan(releaseIndex);
        expect(
            publish.steps.findIndex(step =>
                step.name?.includes('published lifecycle')
            )
        ).toBeGreaterThan(releaseIndex);
        expect(stepText(publish)).not.toMatch(
            /tag (?:-d|--delete)|push .*--delete/
        );
        expect(stepText(publish)).not.toContain('git tag -f');
    });

    it('downloads artifact IDs and never rebuilds or repacks after approval', () => {
        const packageDownload = findStep(
            publish,
            'Download exact approved package artifact by ID'
        );
        const envelopeDownload = findStep(
            publish,
            'Download exact approved envelope by ID'
        );
        expect(packageDownload.uses).toContain('actions/download-artifact@');
        expect(packageDownload.with?.['artifact-ids']).toBe(
            '${{ needs.prepare-candidate.outputs.artifact_id }}'
        );
        expect(envelopeDownload.with?.['artifact-ids']).toBe(
            '${{ needs.prepare-candidate.outputs.envelope_artifact_id }}'
        );
        expect(stepText(publish)).not.toMatch(
            /npm (?:run )?build|npm pack|prepare-artifacts/
        );
    });

    it('grants provenance and attestation permissions only where needed', () => {
        expect(workflow.permissions).toEqual({contents: 'read'});
        expect(prepare.permissions).toEqual({
            actions: 'read',
            attestations: 'write',
            contents: 'write',
            deployments: 'write',
            'id-token': 'write',
        });
        expect(publish.permissions).toEqual({
            actions: 'read',
            attestations: 'read',
            contents: 'write',
            deployments: 'write',
            'id-token': 'write',
        });
        expect(
            source.match(
                /actions\/attest-build-provenance@977bb373ede98d70efdf65b84cb5f73e068dcc2a/g
            )
        ).toHaveLength(2);
        expect(stepText(publish)).toContain('gh attestation verify');
        expect(stepText(publish)).toContain(
            'scripts/release/exact-release.js publish'
        );
        expect(exactReleaseSource).toContain("'--provenance'");
    });

    it('uses a deliberate complete fresh-or-recovery contract', () => {
        expect(source).toContain('mode must be exactly fresh or recovery');
        expect(source).toContain("if: inputs.mode == 'fresh'");
        expect(source).toContain("if: inputs.mode == 'recovery'");
        [
            'recovery_candidate_sha',
            'recovery_version',
            'recovery_artifact_id',
            'recovery_envelope_artifact_id',
            'recovery_artifact_digest',
            'recovery_manifest_sha256',
            'recovery_artifact_created_at',
            'recovery_artifact_expires_at',
        ].forEach(input => expect(source).toContain(input));
    });

    it('secures artifacts and envelope before lease-pushing candidate', () => {
        const localCommit = prepare.steps.findIndex(step =>
            step.name?.includes('locally')
        );
        const packageAttestation = prepare.steps.findIndex(step =>
            step.name?.includes('Attest exact packages')
        );
        const envelopeAttestation = prepare.steps.findIndex(step =>
            step.name?.includes('Attest signed identity envelope')
        );
        const push = prepare.steps.findIndex(step =>
            step.name?.includes('Lease-push secured candidate')
        );
        expect(localCommit).toBeLessThan(packageAttestation);
        const deployment = prepare.steps.findIndex(step =>
            step.name?.includes('lifecycle deployment')
        );
        expect(packageAttestation).toBeLessThan(push);
        expect(push).toBeLessThan(deployment);
        expect(deployment).toBeLessThan(envelopeAttestation);
    });

    it('authorizes creation and re-reads candidates before lease-push', () => {
        const validation = workflow.jobs.validate;
        const initialAuthorization = findStep(
            validation,
            'Authorize fresh candidate creation'
        );
        const push = findStep(
            prepare,
            'Lease-push secured candidate to v3-staging'
        );
        expect(initialAuthorization.run).toContain('authorize-candidate');
        expect(initialAuthorization.run).toContain('--mode fresh');
        expect(initialAuthorization.run).toContain(
            'environment=v3-release-lifecycle'
        );
        expect(push.run).toContain('authorize-candidate');
        expect(push.run!.indexOf('authorize-candidate')).toBeLessThan(
            push.run!.indexOf('git push')
        );
    });

    it('pins release-critical actions to immutable verified commits', () => {
        expect(source).not.toMatch(
            /uses:\s+actions\/(?:checkout|setup-node|upload-artifact|download-artifact|attest-build-provenance)@v\d/
        );
        expect(source).toContain(
            'ROKT/rokt-workflows/actions/generate-changelog@c5c93e92107c520fb8b8cf71070995abdf4c403f'
        );
    });

    it('enforces authenticated signer source and hosted-runner constraints', () => {
        const allPublicationText = [
            stepText(publish),
            stepText(workflow.jobs['recover-publication']),
        ].join('\n');
        expect(allPublicationText).toContain('--signer-workflow');
        expect(allPublicationText).toContain('--signer-digest');
        expect(allPublicationText).toContain('--source-ref refs/heads/main');
        expect(allPublicationText).toContain('--source-digest "$SOURCE_SHA"');
        expect(allPublicationText).toContain('--hostname github.com');
        expect(allPublicationText).toContain('--deny-self-hosted-runners');
        expect(JSON.stringify(publish)).toContain('GH_TOKEN');
        expect(
            JSON.stringify(workflow.jobs['recover-publication'])
        ).toContain('GH_TOKEN');
    });

    it('fails artifacts inside a 24-hour expiry safety margin', () => {
        expect(stepText(publish)).toContain(
            'MINIMUM_REMAINING_SECONDS=86400'
        );
        expect(stepText(workflow.jobs['recover-publication'])).toContain(
            'EXPIRES_EPOCH - NOW'
        );
    });

    it('recovers exact missing packages and creates only a missing stable tag', () => {
        const recoveryText = stepText(workflow.jobs['recover-publication']);
        expect(recoveryText).toContain('--mode recovery');
        expect(recoveryText).toContain('refs/tags/v${VERSION}^{}');
        expect(recoveryText).toContain('if test -z "$TAG_SHA"');
        expect(recoveryText).toContain(
            'git tag -a "v${VERSION}" "$CANDIDATE_SHA"'
        );
        expect(recoveryText).not.toMatch(
            /npm (?:run )?build|npm pack|prepare-artifacts/
        );
        expect(recoveryText).not.toMatch(
            /tag (?:-d|--delete)|push .*--delete|git tag -f/
        );
    });

    it('keeps activation blocked on a one-time live OIDC smoke test', () => {
        expect(source).toContain(
            'ACTIVATION BLOCKER: before connecting this inactive workflow'
        );
        expect(source).toContain('live trusted-publication smoke test');
        expect(source).toContain(
            "npm exposes signed provenance bundles but no separately"
        );
    });

    it('rejects mismatched stable tags and verifies existing releases', () => {
        const freshText = stepText(publish);
        const recoveryText = stepText(workflow.jobs['recover-publication']);
        expect(freshText).toContain('Stable tag v${VERSION} already exists');
        expect(recoveryText).toContain(
            'test "$TAG_SHA" = "$CANDIDATE_SHA"'
        );
        expect(recoveryText).toContain('.assets[] | select(.name == $name)');
        expect(recoveryText).toContain('.digest');
        expect(recoveryText).toContain('gh release create "$TAG"');
    });

    it('audits the complete authoritative package inventory', () => {
        const inventory = JSON.parse(
            fs.readFileSync(
                path.join(repositoryRoot, 'kits/publish-matrix.json'),
                'utf8'
            )
        );
        expect(inventory).toHaveLength(33);
        expect(findStep(publish, 'Audit all 34 packages').run).toContain(
            'exact-release.js audit'
        );
        expect(findStep(publish, 'Append durable published lifecycle state').run)
            .toContain('--state published');
    });

    it('wires one immutable identity through every phase', () => {
        expect(prepare.outputs).toMatchObject({
            artifact_digest:
                '${{ steps.upload-release.outputs.artifact-digest }}',
            artifact_id: '${{ steps.upload-release.outputs.artifact-id }}',
            candidate_sha: '${{ steps.candidate.outputs.candidate_sha }}',
            manifest_sha256:
                '${{ steps.candidate.outputs.manifest_sha256 }}',
            source_sha: '${{ needs.validate.outputs.source_sha }}',
            version: '${{ needs.validate.outputs.version }}',
        });
        const publishText = JSON.stringify(publish);
        [
            'artifact_digest',
            'artifact_id',
            'candidate_sha',
            'envelope_artifact_id',
            'manifest_sha256',
            'source_sha',
            'version',
        ].forEach(identity => {
            expect(publishText).toContain(
                `needs.prepare-candidate.outputs.${identity}`
            );
        });
        expect(source).toContain(
            '$GITHUB_REPOSITORY/.github/workflows/staging-step-1.yml@refs/heads/main'
        );
    });
});
