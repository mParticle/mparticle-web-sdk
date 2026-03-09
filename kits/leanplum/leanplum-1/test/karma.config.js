const { DEBUG } = process.env || 'false';

const files = [
    '../node_modules/@mparticle/web-sdk/dist/mparticle.js',
    'config.js',
    '../dist/LeanplumAnalyticsEventForwarder.iife.js',
    'lib/mockhttprequest.js',
    'test-bundle.js',
];

let browsers = ['ChromeHeadless', 'FirefoxHeadless'];
let singleRun = true;

if (DEBUG === 'true') {
    browsers = ['Chrome'];
    singleRun = false;
}

module.exports = function (config) {
    config.set({
        frameworks: ['mocha', 'chai'],
        files,
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        browsers,
        concurrency: Infinity,
        customLaunchers: {
            FirefoxHeadless: {
                base: 'Firefox',
                flags: ['-headless'],
            },
        },
        singleRun,
    });
};
