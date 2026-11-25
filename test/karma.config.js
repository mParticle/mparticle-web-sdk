const { DEBUG, SDK_BUNDLE } = process.env;

// full: the released full SDK. modular: the lean SDK plus every module, as the
// server joins them, against the whole suite. lean: the lean SDK alone,
// against the suites that expect no module (npm run build:modular first).
const sdkFiles = {
    full: ['../dist/mparticle.js'],
    modular: ['modular/mparticle.lean.js', 'modular/mparticle.buttonTracking.js'],
    lean: ['modular/mparticle.lean.js'],
};
const bundle = SDK_BUNDLE || 'full';
if (!sdkFiles[bundle]) {
    throw new Error(`SDK_BUNDLE must be one of ${Object.keys(sdkFiles).join(', ')}`);
}

const files = [
    'lib/geomock.js',
    ...sdkFiles[bundle],
    bundle === 'lean' ? 'test-bundle.lean.js' : 'test-bundle.js',
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
            mocha: {
                timeout: 5000 // 5 seconds.  Increase from default 2 seconds.
            }
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
