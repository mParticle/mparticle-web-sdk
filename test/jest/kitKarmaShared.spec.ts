import * as fs from 'fs';
import * as path from 'path';

const yaml = require('js-yaml');
const {
    CI_LOCAL_KARMA_SETTINGS,
    getLocalKarmaSettings,
} = require('../../kits/karma.local.shared');

const REPO_ROOT = path.join(__dirname, '../..');
const KITS_ROOT = path.join(REPO_ROOT, 'kits');
const VITEST_KITS = new Set(['kits/rokt', 'kits/roktpayplus']);

function discoverKitKarmaConfigs(dir = KITS_ROOT): string[] {
    const configs: string[] = [];

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'dist') {
            continue;
        }

        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            configs.push(...discoverKitKarmaConfigs(fullPath));
        } else if (entry.isFile() && entry.name === 'karma.config.js') {
            configs.push(
                path.relative(REPO_ROOT, fullPath).split(path.sep).join('/')
            );
        }
    }

    return configs.sort();
}

function loadKitKarmaConfig(
    relativeConfigPath: string,
    envOverrides: Record<string, string | undefined>
): Record<string, any> {
    const previousEnv = process.env;
    let resolved: Record<string, any> | undefined;

    try {
        const nextEnv: NodeJS.ProcessEnv = { ...previousEnv };
        delete nextEnv.CI;
        delete nextEnv.DEBUG;

        for (const [key, value] of Object.entries(envOverrides)) {
            if (value === undefined) {
                delete nextEnv[key];
            } else {
                nextEnv[key] = value;
            }
        }
        process.env = nextEnv;

        jest.isolateModules(() => {
            const configure = require(path.join(REPO_ROOT, relativeConfigPath));
            configure({
                LOG_INFO: 'INFO',
                set(settings: Record<string, any>) {
                    resolved = settings;
                },
            });
        });
    } finally {
        process.env = previousEnv;
    }

    if (!resolved) {
        throw new Error(
            `${relativeConfigPath} did not call config.set(...) when loaded`
        );
    }

    return resolved;
}

describe('kits/karma.local.shared', () => {
    const discoveredConfigs = discoverKitKarmaConfigs();

    it('discovers every kit karma.config.js and covers every Karma kit in kits/matrix.json', () => {
        expect(discoveredConfigs).toHaveLength(31);

        const matrix = JSON.parse(
            fs.readFileSync(path.join(KITS_ROOT, 'matrix.json'), 'utf8')
        ) as Array<{ name: string; local_path: string }>;

        for (const kit of matrix) {
            const matchingConfigs = discoveredConfigs.filter(configPath =>
                configPath.startsWith(`${kit.local_path}/`)
            );
            if (VITEST_KITS.has(kit.local_path)) {
                expect(matchingConfigs).toEqual([]);
            } else {
                expect(matchingConfigs.length).toBeGreaterThanOrEqual(1);
            }
        }
    });

    it('returns the CI local-browser timeouts only when CI is enabled and DEBUG is not true', () => {
        expect(getLocalKarmaSettings({ CI: 'true' })).toEqual({
            captureTimeout: 120000,
            browserNoActivityTimeout: 120000,
            browserDisconnectTolerance: 1,
        });
        expect(
            getLocalKarmaSettings({ CI: '1', DEBUG: 'false' })
        ).toEqual(CI_LOCAL_KARMA_SETTINGS);

        expect(getLocalKarmaSettings({})).toEqual({});
        expect(getLocalKarmaSettings({ CI: '' })).toEqual({});
        expect(getLocalKarmaSettings({ CI: 'false' })).toEqual({});
        expect(getLocalKarmaSettings({ CI: '0' })).toEqual({});
        expect(
            getLocalKarmaSettings({ CI: 'true', DEBUG: 'true' })
        ).toEqual({});
    });

    it('applies captureTimeout, browserNoActivityTimeout, and browserDisconnectTolerance across every kit config in CI without BrowserStack settings', () => {
        for (const configPath of discoveredConfigs) {
            const resolved = loadKitKarmaConfig(configPath, {
                CI: 'true',
                DEBUG: 'false',
            });

            expect(resolved.captureTimeout).toBe(120000);
            expect(resolved.browserNoActivityTimeout).toBe(120000);
            expect(resolved.browserDisconnectTolerance).toBe(1);
            expect(resolved.concurrency).toBe(Infinity);
            expect(resolved.retryLimit).toBeUndefined();
            expect(resolved.browserDisconnectTimeout).toBeUndefined();
        }
    });

    it('leaves local and DEBUG runs unchanged across every kit config', () => {
        for (const configPath of discoveredConfigs) {
            const localResolved = loadKitKarmaConfig(configPath, {});
            expect(localResolved.captureTimeout).toBeUndefined();
            expect(localResolved.browserNoActivityTimeout).toBeUndefined();
            expect(localResolved.browserDisconnectTolerance).toBeUndefined();

            const debugResolved = loadKitKarmaConfig(configPath, {
                CI: 'true',
                DEBUG: 'true',
            });
            expect(debugResolved.captureTimeout).toBeUndefined();
            expect(debugResolved.browserNoActivityTimeout).toBeUndefined();
            expect(debugResolved.browserDisconnectTolerance).toBeUndefined();
        }

        const amplitudeDebug = loadKitKarmaConfig(
            'kits/amplitude/amplitude-8/test/karma.config.js',
            { CI: 'true', DEBUG: 'true' }
        );
        expect(amplitudeDebug.browsers).toEqual(['Chrome']);
        expect(amplitudeDebug.singleRun).toBe(false);

        const doubleClickBoilerplateLocal = loadKitKarmaConfig(
            'kits/doubleclick/test/boilerplate/karma.config.js',
            {}
        );
        expect(doubleClickBoilerplateLocal.browsers).toEqual([
            'ChromeHeadless',
            'Chrome',
            'FirefoxHeadless',
            'Safari',
            'Edge',
            'IE',
            'Firefox',
        ]);
    });

    it('keeps every kit workflow job timeout above the 6-minute worst-case browser capture failure', () => {
        // Karma's default retryLimit is 2 (1 initial launch + 2 retries = 3 attempts),
        // so captureTimeout: 120000 ms takes ~6 minutes to fail if a browser never starts.
        const worstCaseCaptureMinutes =
            ((1 + 2) * CI_LOCAL_KARMA_SETTINGS.captureTimeout) / 60000;
        expect(worstCaseCaptureMinutes).toBe(6);

        const workflowPaths = [
            '.github/workflows/pull-request.yml',
            '.github/workflows/staging-step-1.yml',
            '.github/workflows/v3-release-step-1.yml',
        ];

        for (const workflowPath of workflowPaths) {
            const workflow = yaml.load(
                fs.readFileSync(path.join(REPO_ROOT, workflowPath), 'utf8')
            );
            const runKitTestsJob = workflow.jobs['run-kit-tests'];
            expect(runKitTestsJob).toBeDefined();

            const timeoutMinutes = runKitTestsJob['timeout-minutes'] ?? 360;
            expect(timeoutMinutes).toBeGreaterThanOrEqual(
                worstCaseCaptureMinutes + 4
            );
        }
    });
});
