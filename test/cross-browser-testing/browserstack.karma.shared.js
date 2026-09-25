'use strict';

// karma-browserstack-launcher derives `build` only from Jenkins/Travis/Circle/
// Drone variables and ignores BROWSERSTACK_BUILD_NAME, so without this every
// GitHub Actions session lands in one shared unnamed BrowserStack build.
function getGithubActionsBuildIdentity() {
    const {
        GITHUB_REPOSITORY,
        GITHUB_REF_NAME,
        GITHUB_RUN_ID,
        GITHUB_RUN_NUMBER,
        GITHUB_SHA,
    } = process.env;

    if (!GITHUB_RUN_ID) {
        return {};
    }

    const shortSha = (GITHUB_SHA || '').slice(0, 7);

    return {
        project: GITHUB_REPOSITORY,
        build: `${GITHUB_REF_NAME} #${GITHUB_RUN_NUMBER} ${shortSha} (run ${GITHUB_RUN_ID})`,
    };
}

function getBrowserStackOptions() {
    return {
        username: process.env.BS_USERNAME,
        accessKey: process.env.BS_ACCESS_KEY,
        ...getGithubActionsBuildIdentity(),
        // Pin CI sessions to the workflow tunnel; locally karma still
        // starts its own when BROWSERSTACK_LOCAL_IDENTIFIER is unset.
        ...(process.env.BROWSERSTACK_LOCAL_IDENTIFIER
            ? {
                  startTunnel: false,
                  localIdentifier:
                      process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
              }
            : {}),
    };
}

function getDebugConsoleOptions() {
    if (process.env.DEBUG === 'true') {
        return {
            captureConsole: true,
            browserConsoleLogOptions: {
                level: 'log',
                format: '%b %T: %m',
                terminal: true,
            },
        };
    }

    return {
        captureConsole: false,
        browserConsoleLogOptions: {
            terminal: false,
        },
    };
}

function getSharedKarmaSettings({ files, junitOutputFile, extra }) {
    const { captureConsole, browserConsoleLogOptions } =
        getDebugConsoleOptions();

    return {
        browserStack: getBrowserStackOptions(),
        autoWatch: false,
        frameworks: ['mocha', 'should'],
        files,
        reporters: ['progress', 'junit'],
        colors: true,
        singleRun: true,
        debug: true,
        browserConsoleLogOptions,
        client: {
            captureConsole,
            // Slow BrowserStack VMs need more than mocha's 2s default.
            mocha: {
                timeout: 20000,
            },
        },
        junitReporter: {
            outputDir: 'reports/',
            outputFile: junitOutputFile,
        },
        browserDisconnectTimeout: 50000,
        browserDisconnectTolerance: 5,
        concurrency: 5,
        ...extra,
    };
}

module.exports = {
    getSharedKarmaSettings,
};
