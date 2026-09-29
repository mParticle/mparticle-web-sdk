import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {spawnSync} from 'child_process';

describe('shadow V3 candidate packaging job in staging step 1', () => {
    const workflow = fs.readFileSync(
        path.join(__dirname, '../../.github/workflows/staging-step-1.yml'),
        'utf8'
    );
    const jobsSection = workflow.slice(workflow.indexOf('\njobs:\n'));
    const jobNames = Array.from(
        jobsSection.matchAll(/^ {4}([a-z0-9-]+):$/gm),
        match => match[1]
    );
    const jobs = new Map(
        jobNames.map((name, index) => {
            const start = jobsSection.indexOf(`\n    ${name}:\n`);
            const next = jobNames[index + 1];
            const end = next
                ? jobsSection.indexOf(`\n    ${next}:\n`)
                : jobsSection.length;
            return [name, jobsSection.slice(start, end)];
        })
    );
    const packageJob = jobs.get('package-v3-candidate') || '';
    const stepScript = (job: string, stepName: string) => {
        const step = job.slice(job.indexOf(`- name: ${stepName}\n`));
        const body = step.slice(step.indexOf('run: |\n') + 'run: |\n'.length);
        return body
            .split('\n')
            .filter((line, index, lines) =>
                lines.slice(0, index + 1).every(
                    previous => previous === '' || previous.startsWith(' '.repeat(18))
                )
            )
            .map(line => line.slice(18))
            .join('\n');
    };

    it('runs as an independent, read-only, non-blocking job after the release', () => {
        expect(jobNames).toContain('release');
        expect(jobNames).toContain('publish-kits');
        expect(packageJob).toContain('\n        needs: release\n');
        jobs.forEach((job, name) => {
            if (name !== 'package-v3-candidate') {
                expect(job).not.toContain('package-v3-candidate');
            }
        });

        for (const condition of [
            "vars.V3_PACKAGE_CANDIDATE == 'true'",
            "inputs.track == 'v3'",
            "github.event.inputs.dryRun == 'false'",
            "needs.release.outputs.release_tag != ''",
        ]) {
            expect(packageJob).toContain(condition);
        }
        expect(packageJob).toContain('\n        continue-on-error: true\n');
        expect(packageJob).toContain('\n        timeout-minutes: 20\n');
        expect(packageJob).toContain(
            '\n        permissions:\n            contents: read\n        steps:\n'
        );
        expect(packageJob).not.toContain('id-token');
        expect(packageJob).not.toContain('secrets.');
        expect(packageJob).not.toContain('environment:');
        expect(packageJob).toContain(
            'ref: refs/tags/${{ needs.release.outputs.release_tag }}\n                  persist-credentials: false\n'
        );
        expect(packageJob).toContain('node-version: 24.19.0');
        expect(packageJob).toContain('run: npm ci --ignore-scripts\n');
        expect(packageJob).toMatch(/uses: actions\/upload-artifact@[0-9a-f]{40} # v/);
        expect(packageJob).toContain('retention-days: 7');
        for (const uses of packageJob.match(/uses: \S+/g) || []) {
            expect(uses).toMatch(/@[0-9a-f]{40}$/);
        }
        for (const script of [
            stepScript(packageJob, 'Verify release source'),
            stepScript(packageJob, 'Package the release candidate'),
        ]) {
            expect(script).not.toContain('${{');
        }

        const releaseJob = jobs.get('release') || '';
        expect(releaseJob).toContain(
            'release_version: ${{ steps.verify-release.outputs.release_version }}'
        );
        expect(releaseJob).toContain('echo "release_version=${PACKAGE_VERSION}"');
        expect(releaseJob).not.toContain('package-v3-candidate.ts');
    });

    it('packages only a checkout of the verified release tag', () => {
        const verifyScript = stepScript(packageJob, 'Verify release source');
        const packageScript = stepScript(packageJob, 'Package the release candidate');
        const tempDirectory = fs.realpathSync(
            fs.mkdtempSync(path.join(os.tmpdir(), 'mparticle-shadow-package-'))
        );
        const git = (...args: string[]) =>
            spawnSync(
                'git',
                [
                    '-c', 'user.name=test', '-c', 'user.email=test@example.com',
                    '-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false',
                    ...args,
                ],
                {cwd: tempDirectory, encoding: 'utf8'}
            ).stdout.trim();
        const stubDirectory = path.join(tempDirectory, '.stub');
        const nodeLog = path.join(tempDirectory, '.node.log');
        const run = (script: string, env: Record<string, string>) => {
            const result = spawnSync(
                'bash',
                ['--noprofile', '--norc', '-eo', 'pipefail', '-c', script],
                {
                    cwd: tempDirectory,
                    encoding: 'utf8',
                    env: {...process.env, ...env},
                }
            );
            return {status: result.status, output: `${result.stdout}${result.stderr}`};
        };

        try {
            git('init', '-q');
            fs.writeFileSync(
                path.join(tempDirectory, 'package.json'),
                JSON.stringify({version: '3.1.0'})
            );
            git('add', 'package.json');
            git('commit', '-q', '-m', 'release');
            git('tag', 'v3.1.0');
            const releaseSha = git('rev-parse', 'HEAD');
            const verified = {
                RELEASE_TAG: 'v3.1.0',
                RELEASE_SHA: releaseSha,
                RELEASE_VERSION: '3.1.0',
            };

            expect(run(verifyScript, verified).status).toBe(0);
            expect(
                run(verifyScript, {...verified, RELEASE_VERSION: '3.1.1'})
            ).toEqual({
                status: 1,
                output: 'package.json is 3.1.0; expected 3.1.1 for v3.1.0\n',
            });
            expect(
                run(verifyScript, {...verified, RELEASE_SHA: 'f'.repeat(40)}).status
            ).toBe(1);

            git('commit', '-q', '--allow-empty', '-m', 'after');
            expect(run(verifyScript, verified).output).toMatch(
                /^Checked out [0-9a-f]{40}; v3\.1\.0 is [0-9a-f]{40} and the release reported [0-9a-f]{40}$/m
            );
            expect(run(verifyScript, verified).status).toBe(1);

            fs.mkdirSync(stubDirectory);
            fs.writeFileSync(
                path.join(stubDirectory, 'node'),
                `#!/bin/sh\necho "$*" >> "${nodeLog}"\n`,
                {mode: 0o755}
            );
            expect(
                run(packageScript, {
                    PATH: `${stubDirectory}:${process.env.PATH}`,
                    RELEASE_VERSION: '3.1.0',
                    GITHUB_RUN_ID: '123',
                    GITHUB_RUN_ATTEMPT: '2',
                }).status
            ).toBe(0);
            expect(fs.readFileSync(nodeLog, 'utf8')).toBe(
                '--experimental-strip-types scripts/package-v3-candidate.ts 3.1.0 --build-id 123-2 --output out/v3-candidate\n'
            );
        } finally {
            fs.rmSync(tempDirectory, {force: true, recursive: true});
        }
    });
});
