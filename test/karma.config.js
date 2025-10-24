const { DEBUG } = process.env;

const files = [
    'lib/geomock.js',
    '../dist/mparticle.js',
    'test-bundle.js',
];

let browsers = ['ChromeHeadless', 'FirefoxHeadless'];
let singleRun = true;

if (DEBUG === 'true') {
    browsers = ['Chrome'];
    singleRun = false;
}

let browserConsoleLogOptions = {
    terminal: false,
};

let captureConsole = false;

// Allows console logs to appear when doing npm run test:debug
if (DEBUG === 'true') {
    browserConsoleLogOptions = {
        level: 'log',
        format: '%b %T: %m',
        terminal: true,
    };
    captureConsole = true;
}

module.exports = function(config) {
    config.set({
        frameworks: ['mocha', 'should'],
        files,
        reporters: ['progress', 'junit'],
        colors: true,
        browsers,
        concurrency: Infinity,
        singleRun,
        debug: true,
        logLevel: config.LOG_INFO,
        browserConsoleLogOptions,
        browserDisconnectTimeout: 10000,
        browserDisconnectTolerance: 1,
        captureTimeout: 120000,
        processKillTimeout: 100000,
        client: {
            captureConsole,
            mocha: {
                timeout: 5000 // 5 seconds.  Increase from default 2 seconds.
            }
        },
        customLaunchers: {
            FirefoxHeadless: {
                base: 'Firefox',
                flags: ['-headless'],
                browserNoActivityTimeout: 20000,
            },
        },
        junitReporter: {
            outputDir: 'reports/',
            outputFile: 'test-karma.xml',
        },
    });
};
