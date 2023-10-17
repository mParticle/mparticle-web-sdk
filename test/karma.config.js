const { DEBUG } = process.env;

const files = [
    'lib/geomock.js',
    'config.js',
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
        client: {
            captureConsole,
        },
        customLaunchers: {
            FirefoxHeadless: {
                base: 'Firefox',
                flags: ['-headless'],
            },
        },
        junitReporter: {
            outputDir: 'reports/',
            outputFile: 'test-karma.xml',
        },
    });
};
