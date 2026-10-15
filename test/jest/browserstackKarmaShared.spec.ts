const sharedSettingsPath = '../cross-browser-testing/browserstack.karma.shared';

const githubActionsEnv = {
    GITHUB_REPOSITORY: 'mParticle/mparticle-web-sdk',
    GITHUB_REF_NAME: 'v3-development',
    GITHUB_RUN_ID: '35374193805',
    GITHUB_RUN_NUMBER: '1610',
    GITHUB_SHA: '17a134318b1f4df4dad64a03454a203046ff2a25',
};

const loadBrowserStackOptions = () => {
    let options;
    jest.isolateModules(() => {
        const {
            getSharedKarmaSettings,
        } = require(sharedSettingsPath);
        options = getSharedKarmaSettings({
            files: [],
            junitOutputFile: 'test-karma.xml',
        }).browserStack;
    });
    return options;
};

describe('browserstack.karma.shared', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        Object.keys(githubActionsEnv).forEach(key => delete process.env[key]);
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('BrowserStack build identity', () => {
        it('names the build per workflow run so sessions are traceable to one run', () => {
            Object.assign(process.env, githubActionsEnv);

            expect(loadBrowserStackOptions()).toMatchObject({
                project: 'mParticle/mparticle-web-sdk',
                build: 'v3-development #1610 17a1343 (run 35374193805)',
            });
        });

        it('gives two runs of the same commit and branch different build names', () => {
            Object.assign(process.env, githubActionsEnv);
            const firstRun = loadBrowserStackOptions();

            Object.assign(process.env, {
                GITHUB_RUN_ID: '35378144688',
                GITHUB_RUN_NUMBER: '1611',
            });

            expect(loadBrowserStackOptions().build).not.toEqual(firstRun.build);
        });

        it('leaves build and project unset outside GitHub Actions', () => {
            const options = loadBrowserStackOptions();

            expect(options).not.toHaveProperty('build');
            expect(options).not.toHaveProperty('project');
        });
    });
});
