var files = [
    '../../lib/mockhttprequest.js',
    '../../lib/geomock.js',
    '../../../node_modules/sinon-browser-only/sinon.js',
    '../../test-bundle.js',
];

var settings = {
    frameworks: ['mocha', 'should'],
    reporters: ['progress', 'junit'],
    colors: true,
    browsers: ['ChromeHeadless', 'FirefoxHeadless'],
    concurrency: Infinity,
    debug: true,
    browserConsoleLogOptions: {
        terminal: false,
    },
    client: {
        captureConsole: false,
    },
    customLaunchers: {
        FirefoxHeadless: {
            base: 'Firefox',
            flags: ['-headless'],
        },
    },
    junitReporter: {
        outputDir: '../../reports/',
    },
    singleRun: true,
};

module.exports = {
    files,
    settings,
};
