import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

describe('shadow V3 candidate packaging job in V3 Step 1', () => {
    const workflow = fs.readFileSync(
        path.join(__dirname, '../../.github/workflows/v3-release-step-1.yml'),
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
    const uploadJob = jobs.get('upload-v3-candidate') || '';
    const stepScript = (job: string, stepName: string) => {
        const step = job.slice(job.indexOf(`- name: ${stepName}\n`));
        const body = step.slice(step.indexOf('run: |\n') + 'run: |\n'.length);
        return body
            .split('\n')
            .filter((line, index, lines) =>
                lines
                    .slice(0, index + 1)
                    .every(
                        previous =>
                            previous === '' ||
                            previous.startsWith(' '.repeat(18))
                    )
            )
            .map(line => line.slice(18))
            .join('\n');
    };

    it('runs as a read-only, release-blocking job after the release', () => {
        expect(jobNames).toContain('release');
        expect(jobNames).toContain('publish-kits');
        expect(jobNames).toContain('upload-v3-candidate');
        expect(packageJob).toContain('\n        needs: release\n');
        jobs.forEach((job, name) => {
            if (name !== 'package-v3-candidate' && name !== 'upload-v3-candidate') {
                expect(job).not.toContain('package-v3-candidate');
            }
        });

        for (const condition of [
            'always() &&',
            '!cancelled() &&',
            "needs.release.result == 'success'",
            "github.event.inputs.dryRun == 'false'",
            "needs.release.outputs.release_tag != ''",
        ]) {
            expect(packageJob).toContain(condition);
        }
        expect(packageJob).not.toContain('V3_PACKAGE_CANDIDATE');
        expect(packageJob).not.toContain('inputs.track');
        expect(packageJob).not.toContain('continue-on-error');
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
        expect(packageJob).toMatch(
            /uses: actions\/upload-artifact@[0-9a-f]{40} # v/
        );
        expect(packageJob).toContain(
            'name: v3-candidate-${{ github.run_id }}-${{ github.run_attempt }}'
        );
        expect(packageJob).toContain('path: out/v3-candidate');
        expect(packageJob).toContain('if-no-files-found: error');
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
        expect(releaseJob).toContain(
            'echo "release_version=${PACKAGE_VERSION}"'
        );
        expect(releaseJob).not.toContain('package-v3-candidate.ts');
    });

    it('packages only a checkout of the verified release tag', () => {
        const verifyScript = stepScript(packageJob, 'Verify release source');
        const packageScript = stepScript(
            packageJob,
            'Package the release candidate'
        );
        const tempDirectory = fs.realpathSync(
            fs.mkdtempSync(path.join(os.tmpdir(), 'mparticle-shadow-package-'))
        );
        const git = (...args: string[]) =>
            spawnSync(
                'git',
                [
                    '-c',
                    'user.name=test',
                    '-c',
                    'user.email=test@example.com',
                    '-c',
                    'commit.gpgsign=false',
                    '-c',
                    'tag.gpgsign=false',
                    ...args,
                ],
                { cwd: tempDirectory, encoding: 'utf8' }
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
                    env: { ...process.env, ...env },
                }
            );
            return {
                status: result.status,
                output: `${result.stdout}${result.stderr}`,
            };
        };

        try {
            git('init', '-q');
            fs.writeFileSync(
                path.join(tempDirectory, 'package.json'),
                JSON.stringify({ version: '3.1.0' })
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
                run(verifyScript, { ...verified, RELEASE_VERSION: '3.1.1' })
            ).toEqual({
                status: 1,
                output: 'package.json is 3.1.0; expected 3.1.1 for v3.1.0\n',
            });
            expect(
                run(verifyScript, { ...verified, RELEASE_SHA: 'f'.repeat(40) })
                    .status
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
                { mode: 0o755 }
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
            fs.rmSync(tempDirectory, { force: true, recursive: true });
        }
    });

    const DISPATCH_STEP = 'Dispatch and wait for V3 candidate upload and stage';
    const CANCEL_STEP = 'Cancel V3 candidate workflow if Step 1 fails or is cancelled';
    const RUN_IN_PROGRESS =
        '{"status":"in_progress","conclusion":null,"html_url":"https://example.test/runs/987654"}';
    const RUN_READ = 'api repos/mParticle/mparticle-web-sdk/actions/runs/987654';
    const STATUS_READ = `${RUN_READ} --jq .status`;
    const CANCEL_CALL =
        'api --method POST repos/mParticle/mparticle-web-sdk/actions/runs/987654/cancel';
    const countCalls = (calls: string, call: string) =>
        calls.split('\n').filter(line => line === call).length;

    type StepResult = {
        status: number | null;
        output: string;
        calls: string;
        outputs: string;
        summary: string;
    };

    // Runs each step script against a fake gh on PATH. The dispatch returns
    // run 987654, or fails with FAKE_DISPATCH_ERROR if it is set. Each read of
    // that run fails like a 502 reply for the first FAKE_FAILED_POLLS reads,
    // then returns FAKE_FIRST_RUN_JSON once (if set), then FAKE_RUN_JSON. A
    // cancel fails with FAKE_CANCEL_ERROR if it is set: every time, or only for
    // the first FAKE_FAILED_CANCELS cancels if that is set too.
    const withFakeGh = (
        body: (
            runStep: (script: string, env: Record<string, string>) => StepResult
        ) => void
    ) => {
        const tempDirectory = fs.realpathSync(
            fs.mkdtempSync(path.join(os.tmpdir(), 'mparticle-upload-gate-'))
        );
        const bin = path.join(tempDirectory, 'bin');
        const ghLog = path.join(tempDirectory, 'gh.log');
        const stateFile = path.join(tempDirectory, 'state.txt');
        const cancelStateFile = path.join(tempDirectory, 'cancels.txt');
        const outputs = path.join(tempDirectory, 'outputs');
        const summary = path.join(tempDirectory, 'summary.md');
        fs.mkdirSync(bin);
        fs.writeFileSync(
            path.join(bin, 'gh'),
            [
                '#!/bin/sh',
                `echo "$*" >> "${ghLog}"`,
                'DEFAULT_DISPATCH_JSON=\'{"workflow_run_id":987654}\'',
                'DEFAULT_RUN_JSON=\'{"status":"completed","conclusion":"success","html_url":"https://example.test/runs/987654"}\'',
                'case "$*" in',
                '  *"/dispatches"*)',
                '    if [ -n "${FAKE_DISPATCH_ERROR:-}" ]; then',
                '      echo "$FAKE_DISPATCH_ERROR" >&2',
                '      exit 1',
                '    fi',
                '    printf \'%s\\n\' "${FAKE_DISPATCH_JSON:-$DEFAULT_DISPATCH_JSON}";;',
                '  *"/cancel")',
                `    CANCELS="$(cat "${cancelStateFile}" 2>/dev/null || echo 0)"`,
                '    CANCELS=$((CANCELS + 1))',
                `    echo "$CANCELS" > "${cancelStateFile}"`,
                '    if [ -n "${FAKE_CANCEL_ERROR:-}" ] && { [ -z "${FAKE_FAILED_CANCELS:-}" ] || [ "$CANCELS" -le "$FAKE_FAILED_CANCELS" ]; }; then',
                '      echo "$FAKE_CANCEL_ERROR" >&2',
                '      exit 1',
                '    fi',
                '    echo "{}" ;;',
                '  *"/actions/runs/"*)',
                `    COUNT="$(cat "${stateFile}" 2>/dev/null || echo 0)"`,
                '    COUNT=$((COUNT + 1))',
                `    echo "$COUNT" > "${stateFile}"`,
                '    FAILED_POLLS="${FAKE_FAILED_POLLS:-0}"',
                '    if [ "$COUNT" -le "$FAILED_POLLS" ]; then',
                '      echo "gh: Server Error (HTTP 502)" >&2',
                '      exit 1',
                '    fi',
                '    if [ "$COUNT" -eq "$((FAILED_POLLS + 1))" ] && [ -n "${FAKE_FIRST_RUN_JSON:-}" ]; then',
                '      RUN_JSON="$FAKE_FIRST_RUN_JSON"',
                '    else',
                '      RUN_JSON="${FAKE_RUN_JSON:-$DEFAULT_RUN_JSON}"',
                '    fi',
                '    case "$*" in',
                '      *"--jq .status") printf \'%s\\n\' "$RUN_JSON" | jq -r .status ;;',
                '      *) printf \'%s\\n\' "$RUN_JSON" ;;',
                '    esac ;;',
                'esac',
                '',
            ].join('\n'),
            { mode: 0o755 }
        );
        const runStep = (script: string, env: Record<string, string>) => {
            fs.writeFileSync(ghLog, '');
            fs.writeFileSync(stateFile, '0');
            fs.writeFileSync(cancelStateFile, '0');
            fs.writeFileSync(outputs, '');
            fs.writeFileSync(summary, '');
            const result = spawnSync(
                'bash',
                ['--noprofile', '--norc', '-eo', 'pipefail', '-c', script],
                {
                    cwd: tempDirectory,
                    encoding: 'utf8',
                    env: {
                        ...process.env,
                        PATH: `${bin}:${process.env.PATH}`,
                        GITHUB_REPOSITORY: 'mParticle/mparticle-web-sdk',
                        GITHUB_OUTPUT: outputs,
                        GITHUB_STEP_SUMMARY: summary,
                        STEP1_RUN_ID: '123456',
                        WAIT_TIMEOUT_SECONDS: '30',
                        POLL_INTERVAL_SECONDS: '1',
                        CANCEL_ATTEMPTS: '3',
                        CANCEL_RETRY_SECONDS: '1',
                        ...env,
                    },
                }
            );
            return {
                status: result.status,
                output: `${result.stdout}${result.stderr}`,
                calls: fs.readFileSync(ghLog, 'utf8'),
                outputs: fs.readFileSync(outputs, 'utf8'),
                summary: fs.readFileSync(summary, 'utf8'),
            };
        };
        try {
            body(runStep);
        } finally {
            fs.rmSync(tempDirectory, { force: true, recursive: true });
        }
    };

    it('dispatches and waits for the candidate workflow with actions: write only, no checkout, and no repo scripts', () => {
        for (const condition of [
            'always() &&',
            '!cancelled() &&',
            "needs.release.result == 'success'",
            "needs.package-v3-candidate.result == 'success'",
            "needs.publish-kits.result == 'success'",
            "needs.audit-kits.result == 'success'",
            "github.event.inputs.dryRun == 'false'",
            "needs.release.outputs.release_tag != ''",
        ]) {
            expect(uploadJob).toContain(condition);
        }
        // The child's npm parity check must see the published kits.
        expect(uploadJob).toContain(
            '\n        needs:\n            - release\n            - package-v3-candidate\n            - publish-kits\n            - audit-kits\n'
        );
        expect(uploadJob).not.toContain('continue-on-error');
        expect(uploadJob).toContain('\n        timeout-minutes: 130\n');
        expect(uploadJob).toContain(
            '\n        permissions:\n            actions: write\n        steps:\n'
        );
        expect(uploadJob).not.toContain('contents:');
        expect(uploadJob).not.toContain('id-token');
        expect(uploadJob).not.toContain('uses:');
        expect(uploadJob).not.toContain('checkout');
        expect(uploadJob).not.toContain('scripts/');
        expect(uploadJob).not.toContain('secrets.');
        expect(uploadJob).toContain("WAIT_TIMEOUT_SECONDS: '7200'");
        // Both cancel paths retry 6 times, 5, 10, 20, 40 and 80 seconds apart.
        expect(
            uploadJob.split("CANCEL_ATTEMPTS: '6'\n").length - 1
        ).toBe(2);
        expect(
            uploadJob.split("CANCEL_RETRY_SECONDS: '5'\n").length - 1
        ).toBe(2);
        expect(uploadJob).toContain(
            "if: ${{ (failure() || cancelled()) && steps.dispatch.outputs.child_run_id != '' && steps.dispatch.outputs.child_completed != 'true' }}"
        );

        const dispatchScript = stepScript(uploadJob, DISPATCH_STEP);
        const cancelScript = stepScript(uploadJob, CANCEL_STEP);
        expect(dispatchScript).not.toContain('${{');
        expect(cancelScript).not.toContain('${{');

        withFakeGh(runStep => {
            const ok = runStep(dispatchScript, {
                FAKE_FIRST_RUN_JSON: RUN_IN_PROGRESS,
            });
            expect(ok.status).toBe(0);
            expect(ok.outputs).toBe(
                'child_run_id=987654\nchild_completed=true\n'
            );
            expect(ok.calls).toContain(
                'api --method POST repos/mParticle/mparticle-web-sdk/actions/workflows/v3-shadow-candidate.yml/dispatches -f ref=main -f inputs[step1_run_id]=123456 -f inputs[release_gate]=true -F return_run_details=true'
            );
            expect(ok.calls).toContain(RUN_READ);
            expect(ok.calls).not.toContain('/cancel');
            expect(ok.summary).toContain('`987654`');

            // A completed child cannot be cancelled, so the step tries no cancel.
            const failedChild = runStep(dispatchScript, {
                FAKE_RUN_JSON:
                    '{"status":"completed","conclusion":"failure","html_url":"https://example.test/runs/987654"}',
            });
            expect(failedChild.status).toBe(1);
            expect(failedChild.output).toContain(
                'V3 candidate upload workflow run 987654 concluded failure'
            );
            expect(failedChild.outputs).toBe(
                'child_run_id=987654\nchild_completed=true\n'
            );
            expect(failedChild.calls).not.toContain('/cancel');

            // With no child run ID, nothing can cancel the child, so the step
            // names the manual check that the README describes. The shared
            // gate concurrency group makes a re-run's child queue behind it.
            const missingRunId = runStep(dispatchScript, {
                FAKE_DISPATCH_JSON: '{}',
            });
            expect(missingRunId.status).toBe(1);
            expect(missingRunId.output).toContain(
                'Dispatch did not return a valid workflow_run_id. Check the V3 shadow release: upload candidate runs'
            );
            expect(missingRunId.outputs).toBe('');
            expect(missingRunId.calls).not.toContain('/cancel');

            const lostReply = runStep(dispatchScript, {
                FAKE_DISPATCH_ERROR: 'gh: Server Error (HTTP 502)',
            });
            expect(lostReply.status).toBe(1);
            expect(lostReply.output).toContain(
                'Dispatch of the V3 candidate upload workflow failed or its reply was lost. Check the V3 shadow release: upload candidate runs'
            );
            expect(lostReply.outputs).toBe('');
            expect(lostReply.calls).not.toContain('/cancel');

            const timedOut = runStep(dispatchScript, {
                WAIT_TIMEOUT_SECONDS: '1',
                FAKE_RUN_JSON: RUN_IN_PROGRESS,
            });
            expect(timedOut.status).toBe(1);
            expect(timedOut.output).toContain(
                'Timed out after 1s waiting for V3 candidate upload workflow run 987654'
            );
            expect(countCalls(timedOut.calls, CANCEL_CALL)).toBe(1);

            const cancelled = runStep(cancelScript, {
                CHILD_RUN_ID: '987654',
            });
            expect(cancelled.status).toBe(0);
            expect(cancelled.calls).toBe(`${CANCEL_CALL}\n`);
        });
    }, 30000);

    it('retries a failed status read until the deadline and cancels the child on every other exit', () => {
        const dispatchScript = stepScript(uploadJob, DISPATCH_STEP);
        const cancelScript = stepScript(uploadJob, CANCEL_STEP);

        withFakeGh(runStep => {
            // A 502 reply and a reply without a run status are retried, and
            // the wait then succeeds without cancelling the child.
            const recovered = runStep(dispatchScript, {
                FAKE_FAILED_POLLS: '1',
                FAKE_FIRST_RUN_JSON: '<html>Bad gateway</html>',
            });
            expect(recovered.status).toBe(0);
            expect(recovered.output).toContain(
                'Reading V3 candidate upload workflow run 987654 failed; retrying until the deadline. gh: Server Error (HTTP 502)'
            );
            expect(countCalls(recovered.calls, RUN_READ)).toBe(3);
            expect(recovered.calls).not.toContain('/cancel');
            expect(recovered.outputs).toBe(
                'child_run_id=987654\nchild_completed=true\n'
            );
            expect(recovered.summary).toContain('`987654`');

            // Reads that keep failing end at the deadline, and the step's
            // exit cancels the child once.
            const unreadable = runStep(dispatchScript, {
                FAKE_FAILED_POLLS: '1000',
                WAIT_TIMEOUT_SECONDS: '1',
            });
            expect(unreadable.status).toBe(1);
            expect(unreadable.output).toContain(
                'Reading V3 candidate upload workflow run 987654 failed; retrying until the deadline. gh: Server Error (HTTP 502)'
            );
            expect(unreadable.output).toContain(
                'Timed out after 1s waiting for V3 candidate upload workflow run 987654'
            );
            expect(unreadable.outputs).toBe('child_run_id=987654\n');
            expect(countCalls(unreadable.calls, CANCEL_CALL)).toBe(1);

            // The cleanup step accepts a child that has already completed,
            // such as one the wait step's exit already cancelled.
            const alreadyCompleted = runStep(cancelScript, {
                CHILD_RUN_ID: '987654',
                FAKE_CANCEL_ERROR:
                    'gh: Cannot cancel a workflow run that is completed. (HTTP 409)',
            });
            expect(alreadyCompleted.status).toBe(0);
            expect(alreadyCompleted.output).toContain(
                'V3 candidate upload workflow run 987654 has already completed.'
            );

            // It fails if the child is still running after every cancel try.
            const stillRunning = runStep(cancelScript, {
                CHILD_RUN_ID: '987654',
                FAKE_CANCEL_ERROR: 'gh: Server Error (HTTP 502)',
                FAKE_RUN_JSON: RUN_IN_PROGRESS,
            });
            expect(stillRunning.status).toBe(1);
            expect(countCalls(stillRunning.calls, CANCEL_CALL)).toBe(3);
            expect(stillRunning.output).toContain(
                'Could not cancel V3 candidate upload workflow run 987654 after 3 attempts (status in_progress).'
            );
            expect(stillRunning.output).toContain(
                'Cancel V3 candidate upload workflow run 987654 before re-running Step 1.'
            );
        });
    }, 30000);

    it('retries a refused cancel with a doubling backoff until GitHub accepts it', () => {
        const dispatchScript = stepScript(uploadJob, DISPATCH_STEP);
        const cancelScript = stepScript(uploadJob, CANCEL_STEP);
        const cancelFunction = (script: string) =>
            (script.match(/^cancel_child\(\) \{\n[\s\S]*?\n\}\n/m) ||
                [''])[0];

        // The wait step's exit trap and the cleanup step run the same retry.
        expect(cancelFunction(dispatchScript)).toContain('sleep "$CANCEL_DELAY"');
        expect(cancelFunction(cancelScript)).toBe(cancelFunction(dispatchScript));

        withFakeGh(runStep => {
            // The cancel fails twice with a rate-limit reply while the child
            // is still running, then GitHub accepts it.
            const trapRecovered = runStep(dispatchScript, {
                WAIT_TIMEOUT_SECONDS: '1',
                FAKE_RUN_JSON: RUN_IN_PROGRESS,
                FAKE_CANCEL_ERROR: 'gh: API rate limit exceeded (HTTP 403)',
                FAKE_FAILED_CANCELS: '2',
            });
            expect(trapRecovered.status).toBe(1);
            expect(trapRecovered.output).toContain(
                'Timed out after 1s waiting for V3 candidate upload workflow run 987654'
            );
            expect(countCalls(trapRecovered.calls, CANCEL_CALL)).toBe(3);
            expect(countCalls(trapRecovered.calls, STATUS_READ)).toBe(2);
            expect(trapRecovered.output).toContain(
                'gh: API rate limit exceeded (HTTP 403)'
            );
            expect(trapRecovered.output).toContain(
                'Retrying the cancel in 1s (status in_progress).'
            );
            expect(trapRecovered.output).toContain(
                'Retrying the cancel in 2s (status in_progress).'
            );
            expect(trapRecovered.output).toContain(
                'Cancelling V3 candidate upload workflow run 987654 (attempt 3 of 3).'
            );
            expect(trapRecovered.output).toContain(
                'Cancelled V3 candidate upload workflow run 987654.'
            );
            expect(trapRecovered.output).not.toContain(
                'The next step tries the cancel again.'
            );

            const cleanupRecovered = runStep(cancelScript, {
                CHILD_RUN_ID: '987654',
                FAKE_RUN_JSON: RUN_IN_PROGRESS,
                FAKE_CANCEL_ERROR: 'gh: Server Error (HTTP 502)',
                FAKE_FAILED_CANCELS: '2',
            });
            expect(cleanupRecovered.status).toBe(0);
            expect(cleanupRecovered.calls).toBe(
                [
                    CANCEL_CALL,
                    STATUS_READ,
                    CANCEL_CALL,
                    STATUS_READ,
                    CANCEL_CALL,
                    '',
                ].join('\n')
            );
            expect(cleanupRecovered.output).toContain(
                'Retrying the cancel in 2s (status in_progress).'
            );
            expect(cleanupRecovered.output).toContain(
                'Cancelled V3 candidate upload workflow run 987654.'
            );

            // A child that completes between two tries ends the retry.
            const completedMeanwhile = runStep(cancelScript, {
                CHILD_RUN_ID: '987654',
                FAKE_FIRST_RUN_JSON: RUN_IN_PROGRESS,
                FAKE_CANCEL_ERROR: 'gh: Server Error (HTTP 502)',
            });
            expect(completedMeanwhile.status).toBe(0);
            expect(countCalls(completedMeanwhile.calls, CANCEL_CALL)).toBe(2);
            expect(completedMeanwhile.output).toContain(
                'V3 candidate upload workflow run 987654 has already completed.'
            );

            // When every try fails, the trap keeps the step's own exit code and
            // leaves the child to the cleanup step.
            const trapGaveUp = runStep(dispatchScript, {
                WAIT_TIMEOUT_SECONDS: '1',
                CANCEL_ATTEMPTS: '2',
                FAKE_RUN_JSON: RUN_IN_PROGRESS,
                FAKE_CANCEL_ERROR: 'gh: Server Error (HTTP 502)',
            });
            expect(trapGaveUp.status).toBe(1);
            expect(countCalls(trapGaveUp.calls, CANCEL_CALL)).toBe(2);
            expect(trapGaveUp.output).toContain(
                'Could not cancel V3 candidate upload workflow run 987654 after 2 attempts (status in_progress).'
            );
            expect(trapGaveUp.output).toContain(
                'The next step tries the cancel again.'
            );
            expect(trapGaveUp.outputs).toBe('child_run_id=987654\n');
        });
    }, 60000);
});
