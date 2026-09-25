import * as fs from 'fs';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import { execFile } from 'child_process';

const yaml = require('js-yaml');

// Executes the workflow's own run scripts against a fake AWS CLI and a fake
// OIDC endpoint. Nothing here talks to GitHub or AWS.

const REPO_ROOT = path.join(__dirname, '../..');
const WORKFLOW_PATH = '.github/workflows/qa-v3-s3-oidc-phase1.yml';
const workflow = yaml.load(
    fs.readFileSync(path.join(REPO_ROOT, WORKFLOW_PATH), 'utf8')
);
const REPOSITORY = 'example-org/example-repo';
const EVIDENCE_TAG: string = workflow.env.EVIDENCE_TAG;
const EVIDENCE_REF = `refs/tags/${EVIDENCE_TAG}`;
const REQUEST_TOKEN = 'request-token-must-not-leak';
const VERSION_ID = 'version-id-must-not-leak';

const SECRETS: Record<string, string> = {
    AWS_ACCOUNT_ID: '123456789012',
    AWS_REGION: 'zz-secret-region-1',
    SDK_ARTIFACT_BUCKET: 'secret-bucket-name',
    SDK_ARTIFACT_PREFIX: 'secret-root/candidates',
    SDK_POINTER_DENIAL_PREFIX: 'secret-root/pointers',
    AWS_ROLE_ARN: 'arn:aws:iam::123456789012:role/secret-role-name',
};

const FAKE_AWS = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const config = JSON.parse(process.env.FAKE_S3_CONFIG);
const args = process.argv.slice(2);
fs.appendFileSync(process.env.FAKE_S3_CALLS, JSON.stringify(args) + '\\n');
const opts = {};
const positional = [];
for (let i = 2; i < args.length; i++) {
    if (args[i].startsWith('--')) {
        opts[args[i].slice(2)] = args[i + 1];
        i++;
    } else {
        positional.push(args[i]);
    }
}
function fail(code) {
    process.stderr.write(JSON.stringify({
        Code: code,
        Message: 'raw stderr ' + opts.bucket + '/' + opts.key,
    }));
    process.exit(254);
}
if (args[0] !== 's3api') fail('Unsupported');
if (
    opts.bucket !== config.bucket ||
    opts['expected-bucket-owner'] !== config.owner
) {
    fail('AccessDenied');
}
const objectPath = path.join(
    process.env.FAKE_S3_STATE,
    encodeURIComponent(opts.key)
);
const exists = fs.existsSync(objectPath);
const inCandidate = opts.key.startsWith(config.candidatePrefix + '/');
switch (args[1]) {
    case 'put-object': {
        if (!inCandidate) fail('AccessDenied');
        const conditional = opts['if-none-match'] === '*';
        if (exists && conditional) fail('PreconditionFailed');
        if (!conditional && !config.allowUnconditionalPut) {
            if (config.writeDespiteDenial) fs.copyFileSync(opts.body, objectPath);
            fail(config.unconditionalPutError || 'AccessDenied');
        }
        fs.copyFileSync(opts.body, objectPath);
        const output = { ETag: '"etag"' };
        if (config.versionId) output.VersionId = config.versionId;
        process.stdout.write(JSON.stringify(output));
        break;
    }
    case 'get-object':
        if (!inCandidate) fail('AccessDenied');
        if (!exists) fail('NoSuchKey');
        fs.copyFileSync(objectPath, positional[0]);
        process.stdout.write('{}');
        break;
    case 'delete-object':
        if (opts['version-id'] !== undefined) {
            if (!config.allowDeleteVersion) fail('AccessDenied');
            if (opts['version-id'] !== config.versionId) fail('NoSuchVersion');
        } else if (!config.allowDelete) {
            fail('AccessDenied');
        }
        fs.rmSync(objectPath, { force: true });
        process.stdout.write('{}');
        break;
    default:
        fail('Unsupported');
}
`;

interface FakeS3Config {
    versionId?: string;
    allowUnconditionalPut?: boolean;
    unconditionalPutError?: string;
    allowDelete?: boolean;
    allowDeleteVersion?: boolean;
    writeDespiteDenial?: boolean;
}

interface RunContext {
    ref?: string;
    refType?: string;
    eventName?: string;
    secrets?: Record<string, string>;
    s3?: FakeS3Config;
    extraEnv?: Record<string, string>;
}

interface StepResult {
    name: string;
    code: number;
    output: string;
}

interface JobResult {
    steps: StepResult[];
    failedStep?: string;
    output: string;
    awsCalls: string[][];
}

let workDirectory: string;

beforeEach(() => {
    workDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-oidc-'));
});

afterEach(() => {
    fs.rmSync(workDirectory, { recursive: true, force: true });
});

function resolveExpression(value: unknown, secrets: Record<string, string>) {
    const text = String(value);
    const resolved = text.replace(
        /\$\{\{\s*secrets\.([A-Z_]+)\s*\}\}/g,
        (_match, name) => secrets[name] ?? ''
    );
    if (resolved.includes('${{')) {
        throw new Error(`Unsupported expression in env: ${text}`);
    }
    return resolved;
}

function runBash(
    script: string,
    env: Record<string, string>
): Promise<{ code: number; output: string }> {
    return new Promise(resolve => {
        execFile(
            'bash',
            ['--noprofile', '--norc', '-eo', 'pipefail', '-c', script],
            { cwd: REPO_ROOT, env, maxBuffer: 16 * 1024 * 1024 },
            (error, stdout, stderr) => {
                const code = error ? (error as any).code ?? 1 : 0;
                resolve({ code, output: `${stdout}${stderr}` });
            }
        );
    });
}

async function runJob(jobName: string, context: RunContext = {}) {
    const job = workflow.jobs[jobName];
    const ref = context.ref ?? EVIDENCE_REF;
    const secrets = context.secrets ?? SECRETS;
    const runnerTemp = fs.mkdtempSync(path.join(workDirectory, 'runner-'));
    const binDirectory = path.join(workDirectory, 'bin');
    const stateDirectory = path.join(workDirectory, 's3');
    const callsPath = path.join(workDirectory, 'aws-calls');
    fs.mkdirSync(binDirectory, { recursive: true });
    fs.mkdirSync(stateDirectory, { recursive: true });
    fs.writeFileSync(path.join(binDirectory, 'aws'), FAKE_AWS, {
        mode: 0o755,
    });
    fs.writeFileSync(callsPath, '');

    const s3Config = {
        bucket: SECRETS.SDK_ARTIFACT_BUCKET,
        owner: SECRETS.AWS_ACCOUNT_ID,
        candidatePrefix: SECRETS.SDK_ARTIFACT_PREFIX,
        ...context.s3,
    };
    const baseEnv: Record<string, string> = {
        PATH: `${binDirectory}:${process.env.PATH}`,
        HOME: workDirectory,
        GITHUB_EVENT_NAME: context.eventName ?? 'workflow_dispatch',
        GITHUB_REF: ref,
        GITHUB_REF_TYPE: context.refType ?? 'tag',
        GITHUB_REPOSITORY: REPOSITORY,
        GITHUB_WORKFLOW_REF: `${REPOSITORY}/${WORKFLOW_PATH}@${ref}`,
        GITHUB_RUN_ID: '1001',
        GITHUB_RUN_ATTEMPT: '1',
        RUNNER_TEMP: runnerTemp,
        FAKE_S3_CONFIG: JSON.stringify(s3Config),
        FAKE_S3_STATE: stateDirectory,
        FAKE_S3_CALLS: callsPath,
        ...context.extraEnv,
    };

    const result: JobResult = { steps: [], output: '', awsCalls: [] };
    for (const step of job.steps) {
        if (step.uses) {
            continue;
        }
        const env = { ...baseEnv };
        for (const scope of [workflow.env, job.env, step.env]) {
            for (const [key, value] of Object.entries(scope ?? {})) {
                env[key] = resolveExpression(value, secrets);
            }
        }
        const { code, output } = await runBash(step.run, env);
        result.steps.push({ name: step.name, code, output });
        result.output += output;
        if (code !== 0) {
            result.failedStep = step.name;
            break;
        }
    }
    result.awsCalls = fs
        .readFileSync(callsPath, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line));
    return result;
}

function expectNoDisclosure(output: string) {
    for (const [name, value] of Object.entries(SECRETS)) {
        expect(output, `${name} was printed`).not.toContain(value);
    }
    expect(output).not.toContain('raw stderr');
    expect(output).not.toContain(VERSION_ID);
    expect(output).not.toContain(REQUEST_TOKEN);
}

function stepSecrets(step: any): string[] {
    return Object.values(step.env ?? {})
        .map(value => String(value).match(/secrets\.([A-Z_]+)/))
        .filter(Boolean)
        .map(match => match[1])
        .sort();
}

describe('QA V3 S3 OIDC Phase 1 workflow', () => {
    jest.setTimeout(60000);

    describe('static structure', () => {
        it('keeps the registered dispatch interface', () => {
            expect(workflow.name).toBe('QA V3 S3 OIDC Phase 1');
            expect(Object.keys(workflow.on)).toEqual(['workflow_dispatch']);
            expect(workflow.on.workflow_dispatch.inputs.operation).toEqual({
                description: 'Phase 1 operation',
                required: true,
                type: 'choice',
                options: ['inspect-claims', 'upload-validate'],
                default: 'inspect-claims',
            });
            expect(workflow.permissions).toEqual({});
        });

        it('uses a new evidence tag rather than the reviewed evidence-1 tag', () => {
            expect(EVIDENCE_TAG).toMatch(/^qa-v3-s3-oidc-phase1-evidence-\d+$/);
            expect(EVIDENCE_TAG).not.toBe('qa-v3-s3-oidc-phase1-evidence-1');
        });

        it('gates every Environment job on the tag before any token request', () => {
            const gate = workflow.jobs['require-evidence-tag'];
            expect(gate.environment).toBeUndefined();
            expect(gate.permissions).toEqual({});

            const inspect = workflow.jobs['inspect-claims'];
            expect(inspect.needs).toBe('require-evidence-tag');
            expect(inspect.steps[0].name).toBe(
                'Require the exact protected evidence tag'
            );
            const tokenStepIndex = inspect.steps.findIndex((step: any) =>
                String(step.run).includes('ACTIONS_ID_TOKEN_REQUEST_URL')
            );
            expect(tokenStepIndex).toBeGreaterThan(0);

            const upload = workflow.jobs['upload-validate'];
            expect(upload.needs).toEqual([
                'require-evidence-tag',
                'inspect-claims',
            ]);
            expect(upload.steps[0].name).toBe(
                'Require the exact protected evidence tag'
            );
        });

        it('scopes each Environment secret to the steps that need it', () => {
            expect(JSON.stringify(workflow.env)).not.toContain('secrets.');
            for (const job of Object.values<any>(workflow.jobs)) {
                expect(JSON.stringify(job.env ?? {})).not.toContain(
                    'secrets.'
                );
            }

            const steps = workflow.jobs['upload-validate'].steps;
            const byName = (name: string) =>
                steps.find((step: any) => step.name === name);
            expect(byName('Checkout reviewed source').env).toBeUndefined();
            expect(
                stepSecrets(byName('Validate local inputs and committed artifact'))
            ).toEqual(Object.keys(SECRETS).sort());
            for (const step of steps) {
                if (
                    step.uses ||
                    step.name === 'Validate local inputs and committed artifact'
                ) {
                    continue;
                }
                const names = stepSecrets(step);
                if (String(step.run).includes('aws s3api')) {
                    expect(names).toEqual([
                        'AWS_ACCOUNT_ID',
                        'SDK_ARTIFACT_BUCKET',
                    ]);
                } else {
                    expect(names).toEqual([]);
                }
            }
        });
    });

    describe('inspect-claims', () => {
        let server: http.Server;
        let tokenRequests: number;
        let claimsOverride: Record<string, unknown>;
        let rawToken: string;
        let requestUrl: string;

        beforeEach(async () => {
            tokenRequests = 0;
            claimsOverride = {};
            server = http.createServer((request, response) => {
                tokenRequests++;
                const url = new URL(request.url, 'http://localhost');
                const claims = {
                    iss: 'https://token.actions.githubusercontent.com',
                    aud: url.searchParams.get('audience'),
                    sub: `repo:${REPOSITORY}:environment:v3-qa-upload`,
                    repository: REPOSITORY,
                    repository_id: '1',
                    repository_owner_id: '2',
                    environment: 'v3-qa-upload',
                    ref: EVIDENCE_REF,
                    workflow_ref: `${REPOSITORY}/${WORKFLOW_PATH}@${EVIDENCE_REF}`,
                    ...claimsOverride,
                };
                const encode = (value: unknown) =>
                    Buffer.from(JSON.stringify(value)).toString('base64url');
                rawToken = `${encode({ alg: 'none' })}.${encode(
                    claims
                )}.raw-signature-must-not-leak`;
                if (request.headers.authorization !== `Bearer ${REQUEST_TOKEN}`) {
                    response.writeHead(401).end();
                    return;
                }
                response
                    .writeHead(200, { 'Content-Type': 'application/json' })
                    .end(JSON.stringify({ value: rawToken }));
            });
            await new Promise<void>(resolve =>
                server.listen(0, '127.0.0.1', resolve)
            );
            const { port } = server.address() as { port: number };
            requestUrl = `http://127.0.0.1:${port}/token?api-version=2`;
        });

        afterEach(async () => {
            await new Promise(resolve => server.close(resolve));
        });

        const oidcEnv = () => ({
            ACTIONS_ID_TOKEN_REQUEST_URL: requestUrl,
            ACTIONS_ID_TOKEN_REQUEST_TOKEN: REQUEST_TOKEN,
        });

        it.each([
            ['a branch', { ref: 'refs/heads/qa/v3-s3-oidc-phase1', refType: 'branch' }],
            ['the old evidence tag', { ref: 'refs/tags/qa-v3-s3-oidc-phase1-evidence-1' }],
            ['a lookalike tag', { ref: `${EVIDENCE_REF}-x` }],
            ['a non-dispatch event', { eventName: 'push' }],
        ])('fails closed from %s before requesting a token', async (_label, context) => {
            for (const jobName of ['require-evidence-tag', 'inspect-claims']) {
                const result = await runJob(jobName, {
                    ...context,
                    extraEnv: oidcEnv(),
                });
                expect(result.failedStep).toBe(
                    'Require the exact protected evidence tag'
                );
                expect(result.output).toContain(
                    'This workflow runs only from the protected evidence tag.'
                );
            }
            expect(tokenRequests).toBe(0);
        });

        it('prints only allowlisted claims from the evidence tag', async () => {
            expect((await runJob('require-evidence-tag')).failedStep).toBeUndefined();
            const result = await runJob('inspect-claims', { extraEnv: oidcEnv() });
            expect(result.failedStep).toBeUndefined();
            expect(tokenRequests).toBe(1);
            expect(result.output).toContain(`"ref": "${EVIDENCE_REF}"`);
            expect(result.output).not.toContain(rawToken);
            expect(result.output).not.toContain('raw-signature-must-not-leak');
            expectNoDisclosure(result.output);
        });

        it('fails when a claim does not match', async () => {
            claimsOverride = { environment: 'other-environment' };
            const result = await runJob('inspect-claims', { extraEnv: oidcEnv() });
            expect(result.failedStep).toBe('Inspect allowlisted identity metadata');
            expect(result.output).toContain('OIDC Environment did not match.');
            expect(result.output).not.toContain(rawToken);
        });
    });

    describe('upload-validate', () => {
        const OVERWRITE_STEP = 'Prove unconditional candidate overwrite is denied';
        const VERSION_STEP = 'Prove candidate version deletion is denied';
        const VALIDATE_STEP = 'Validate local inputs and committed artifact';

        it('fails closed from another ref before any AWS call', async () => {
            const result = await runJob('upload-validate', {
                ref: 'refs/heads/main',
                refType: 'branch',
            });
            expect(result.failedStep).toBe(
                'Require the exact protected evidence tag'
            );
            expect(result.awsCalls).toEqual([]);
        });

        it('validates an unversioned bucket and denies overwrite and delete', async () => {
            const result = await runJob('upload-validate');
            expect(result.failedStep).toBeUndefined();
            expect(result.output).toContain('Candidate overwrite denied (AccessDenied).');
            expect(result.output).toContain('Candidate deletion denied (AccessDenied).');
            expect(result.output).toContain(
                'No version ID was returned; versioning appears disabled.'
            );
            expect(result.output).toContain(
                'Phase 1 transport validation completed successfully.'
            );

            const puts = result.awsCalls.filter(call => call[1] === 'put-object');
            const candidatePuts = puts.filter(call =>
                call[call.indexOf('--key') + 1].startsWith(
                    `${SECRETS.SDK_ARTIFACT_PREFIX}/`
                )
            );
            expect(candidatePuts).toHaveLength(2);
            expect(candidatePuts[0]).toContain('--if-none-match');
            expect(candidatePuts[1]).not.toContain('--if-none-match');
            expect(
                result.awsCalls.some(call => call.includes('--version-id'))
            ).toBe(false);
            expectNoDisclosure(result.output);
        });

        it('proves DeleteObjectVersion is denied when a version ID is returned', async () => {
            const result = await runJob('upload-validate', {
                s3: { versionId: VERSION_ID },
            });
            expect(result.failedStep).toBeUndefined();
            expect(result.output).toContain(
                'Candidate version deletion denied (AccessDenied).'
            );
            const versionDelete = result.awsCalls.find(call =>
                call.includes('--version-id')
            );
            expect(versionDelete[versionDelete.indexOf('--version-id') + 1]).toBe(
                VERSION_ID
            );
            expectNoDisclosure(result.output);
        });

        it('stops when an unconditional overwrite succeeds', async () => {
            const result = await runJob('upload-validate', {
                s3: { allowUnconditionalPut: true },
            });
            expect(result.failedStep).toBe(OVERWRITE_STEP);
            expect(result.output).toContain(
                'Candidate overwrite was unexpectedly allowed.'
            );
            expectNoDisclosure(result.output);
        });

        it('does not accept a non-authorization overwrite failure', async () => {
            const result = await runJob('upload-validate', {
                s3: { unconditionalPutError: 'PreconditionFailed' },
            });
            expect(result.failedStep).toBe(OVERWRITE_STEP);
            expect(result.output).toContain(
                'Candidate overwrite denial failed (PreconditionFailed).'
            );
        });

        it('stops when the uploaded version can be deleted', async () => {
            const result = await runJob('upload-validate', {
                s3: { versionId: VERSION_ID, allowDeleteVersion: true },
            });
            expect(result.failedStep).toBe(VERSION_STEP);
            expect(result.output).toContain(
                'Candidate version deletion was unexpectedly allowed.'
            );
            expectNoDisclosure(result.output);
        });

        it('stops when the final bytes differ from the source', async () => {
            const result = await runJob('upload-validate', {
                s3: { writeDespiteDenial: true },
            });
            expect(result.output).toContain('Candidate overwrite denied (AccessDenied).');
            expect(result.failedStep).toBe(
                'Confirm candidate remains readable and unchanged'
            );
            expect(result.output).toContain(
                'Final candidate readback did not match the source.'
            );
        });

        it.each([
            ['an empty pointer prefix', { SDK_POINTER_DENIAL_PREFIX: '' }],
            ['a single-segment pointer prefix', { SDK_POINTER_DENIAL_PREFIX: 'pointers' }],
            ['a leading slash', { SDK_POINTER_DENIAL_PREFIX: '/secret-root/pointers' }],
            ['a doubled slash', { SDK_POINTER_DENIAL_PREFIX: 'secret-root//pointers' }],
            ['a dot segment', { SDK_POINTER_DENIAL_PREFIX: 'secret-root/./pointers' }],
            ['a parent segment', { SDK_POINTER_DENIAL_PREFIX: 'secret-root/../pointers' }],
            ['a wildcard', { SDK_POINTER_DENIAL_PREFIX: 'secret-root/point*' }],
            ['a pointer prefix equal to the candidate prefix', { SDK_POINTER_DENIAL_PREFIX: 'secret-root/candidates/' }],
            ['a pointer prefix inside the candidate prefix', { SDK_POINTER_DENIAL_PREFIX: 'secret-root/candidates/pointers' }],
            ['a candidate prefix inside the pointer prefix', { SDK_ARTIFACT_PREFIX: 'secret-root/pointers/candidates' }],
            ['an unnormalized candidate prefix', { SDK_ARTIFACT_PREFIX: 'secret-root/../candidates' }],
        ])('rejects %s before any AWS call', async (_label, override) => {
            const result = await runJob('upload-validate', {
                secrets: { ...SECRETS, ...override },
            });
            expect(result.failedStep).toBe(VALIDATE_STEP);
            expect(result.awsCalls).toEqual([]);
            expectNoDisclosure(result.output);
        });

        it('accepts sibling prefixes that only share a name stem', async () => {
            const result = await runJob('upload-validate', {
                secrets: {
                    ...SECRETS,
                    SDK_POINTER_DENIAL_PREFIX: 'secret-root/candidates-pointers/',
                },
            });
            expect(result.failedStep).toBeUndefined();
        });
    });
});
