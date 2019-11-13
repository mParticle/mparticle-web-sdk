const { DEBUG } = process.env;

let files = [
    'lib/mockhttprequest.js',
    'lib/geomock.js',
    '../node_modules/fetch-mock/dist/es5/client-bundle.js',
    '../node_modules/sinon-browser-only/sinon.js',
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
            outputDir: 'reports/',
            outputFile: 'test-karma.xml',
        },
    });
};
