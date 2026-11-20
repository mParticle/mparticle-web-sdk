import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const yaml = require('js-yaml');

const REPO_ROOT = path.join(__dirname, '../..');
const HELPER = 'scripts/v3-release/gh-api-retry.sh';

// A stand-in for gh, defined as a shell function so no file needs to be
// executable: each call takes the next line of the plan file.
//   ok <text>   prints <text> on stdout and succeeds
//   http <code> prints an error body on stdout, gh's error line on stderr, fails
//   bare <code> prints an HTML error page on stdout, gh's bare error line
//               ("gh: HTTP <code>", its form for a non-JSON body) on stderr, fails
//   barenet <code> as bare, with a network-looking line after it on stderr
//   net         prints a network error on stderr, fails
//   other       prints a non-HTTP, non-network error on stderr, fails
// Each call's arguments are appended to the calls file.
const FAKE_GH = `gh() {
    local n line
    printf '%s\\n' "$*" >> "$FAKE_GH_CALLS"
    n=$(( $(wc -l < "$FAKE_GH_CALLS") ))
    line="$(sed -n "\${n}p" "$FAKE_GH_PLAN")"
    case "$line" in
        ok\\ *) printf '%s\\n' "\${line#ok }" ;;
        http\\ *)
            printf '{"message":"error"}\\n'
            echo "gh: Error (HTTP \${line#http })" >&2
            return 1
            ;;
        bare\\ *)
            printf '<html>Bad Gateway</html>\\n'
            echo "gh: HTTP \${line#bare }" >&2
            return 1
            ;;
        barenet\\ *)
            printf '<html>Not Found</html>\\n'
            echo "gh: HTTP \${line#barenet }" >&2
            echo 'dial tcp: i/o timeout' >&2
            return 1
            ;;
        net)
            echo 'Get "https://api.github.com/repos/o/r": dial tcp: i/o timeout' >&2
            return 1
            ;;
        *)
            echo 'failed to parse jq expression' >&2
            return 1
            ;;
    esac
}`;

function runHelper(
    plan: string[],
    script: string,
    env: Record<string, string> = {}
): { status: number | null; stdout: string; stderr: string; calls: string[] } {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gh-api-retry-'));
    const planFile = path.join(directory, 'plan');
    const callsFile = path.join(directory, 'calls');
    fs.writeFileSync(planFile, plan.join('\n') + '\n');
    fs.writeFileSync(callsFile, '');

    try {
        const result = spawnSync(
            'bash',
            [
                '--noprofile',
                '--norc',
                '-c',
                `set -euo pipefail\n${FAKE_GH}\n. ${HELPER}\n${script}`,
            ],
            {
                cwd: REPO_ROOT,
                encoding: 'utf8',
                env: {
                    ...process.env,
                    FAKE_GH_PLAN: planFile,
                    FAKE_GH_CALLS: callsFile,
                    GH_API_RETRY_SECONDS: '0',
                    ...env,
                },
            }
        );
        const calls = fs
            .readFileSync(callsFile, 'utf8')
            .split('\n')
            .filter(line => line.length > 0);
        return {
            status: result.status,
            stdout: result.stdout,
            stderr: result.stderr,
            calls,
        };
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
}

describe('gh_api_retry', () => {
    it('returns the reply of a call that succeeds first time', () => {
        const result = runHelper(['ok {"id":1}'], 'gh_api_retry repos/o/r');

        expect(result.status).toBe(0);
        expect(result.stdout).toBe('{"id":1}\n');
        expect(result.calls).toEqual(['api repos/o/r']);
    });

    it('retries a 5xx reply and prints only the good reply', () => {
        const result = runHelper(
            ['http 502', 'ok {"id":1}'],
            'gh_api_retry --paginate repos/o/r/artifacts | cat'
        );

        expect(result.status).toBe(0);
        expect(result.stdout).toBe('{"id":1}\n');
        expect(result.calls).toHaveLength(2);
        expect(result.stderr).toContain(
            'gh api --paginate repos/o/r/artifacts failed (attempt 1 of 4)'
        );
    });

    it('retries a 5xx reply whose body is not JSON', () => {
        const result = runHelper(
            ['bare 502', 'bare 504', 'ok {"id":1}'],
            'gh_api_retry --paginate repos/o/r/artifacts | cat'
        );

        expect(result.status).toBe(0);
        expect(result.stdout).toBe('{"id":1}\n');
        expect(result.calls).toHaveLength(3);
        expect(result.stderr).toContain(
            'gh api --paginate repos/o/r/artifacts failed (attempt 1 of 4): gh: HTTP 502'
        );
    });

    it('fails a 4xx reply whose body is not JSON on the first try', () => {
        const result = runHelper(['bare 404', 'ok {}'], 'gh_api_retry repos/o/r/runs/1 > /dev/null');

        expect(result.status).toBe(1);
        expect(result.calls).toHaveLength(1);
        expect(result.stderr).toContain(
            '::error::gh api repos/o/r/runs/1 failed and is not retried: gh: HTTP 404'
        );
    });

    it('does not read a bare 4xx as a network error', () => {
        const result = runHelper(['barenet 404', 'ok {}'], 'gh_api_retry repos/o/r/runs/1 > /dev/null');

        expect(result.status).toBe(1);
        expect(result.calls).toHaveLength(1);
        expect(result.stderr).toContain('failed and is not retried');
    });

    it('retries a network error with no HTTP reply', () => {
        const result = runHelper(['net', 'ok 7'], 'X="$(gh_api_retry repos/o/r --jq .id)"; echo "id=$X"');

        expect(result.status).toBe(0);
        expect(result.stdout).toBe('id=7\n');
        expect(result.calls).toHaveLength(2);
    });

    it('fails a 4xx reply on the first try, naming the call', () => {
        const result = runHelper(['http 404', 'ok {}'], 'gh_api_retry repos/o/r/runs/1 > /dev/null');

        expect(result.status).toBe(1);
        expect(result.calls).toHaveLength(1);
        expect(result.stderr).toContain(
            '::error::gh api repos/o/r/runs/1 failed and is not retried: gh: Error (HTTP 404)'
        );
    });

    it('fails any other error on the first try', () => {
        const result = runHelper(['other', 'ok {}'], 'gh_api_retry repos/o/r --jq ".["');

        expect(result.status).toBe(1);
        expect(result.calls).toHaveLength(1);
    });

    it('gives up after GH_API_ATTEMPTS tries and fails the pipe it feeds', () => {
        const result = runHelper(
            ['http 502', 'http 503', 'http 500', 'ok {}'],
            'gh_api_retry --paginate repos/o/r/jobs | cat',
            { GH_API_ATTEMPTS: '3' }
        );

        expect(result.status).toBe(1);
        expect(result.calls).toHaveLength(3);
        expect(result.stdout).toBe('');
        expect(result.stderr).toContain(
            '::error::gh api --paginate repos/o/r/jobs failed after 3 attempts: gh: Error (HTTP 500)'
        );
    });

    it('refuses a bad GH_API_ATTEMPTS', () => {
        const result = runHelper(['ok {}'], 'gh_api_retry repos/o/r', {
            GH_API_ATTEMPTS: '0',
        });

        expect(result.status).toBe(2);
        expect(result.calls).toHaveLength(0);
    });
});

// Each workflow, its job, and the steps in it that read GitHub.
const GATE_READS: Array<[string, string, string[]]> = [
    ['v3-shadow-candidate.yml', 'resolve', ['run', 'artifact']],
    ['v3-shadow-promote.yml', 'resolve', ['plan']],
];

describe('V3 release gate reads', () => {
    it.each(GATE_READS)('%s reads GitHub only through gh_api_retry', (file, job, stepIds) => {
        const workflow = yaml.load(
            fs.readFileSync(
                path.join(REPO_ROOT, '.github/workflows', file),
                'utf8'
            )
        );
        for (const id of stepIds) {
            const step = workflow.jobs[job].steps.find(
                (candidate: any) => candidate.id === id
            );
            expect(step).toBeDefined();
            expect(step.run).toContain(`. ${HELPER}`);
            expect(step.run).toContain('gh_api_retry ');
            expect(step.run).not.toMatch(/\bgh api\b/);
        }
    });
});
