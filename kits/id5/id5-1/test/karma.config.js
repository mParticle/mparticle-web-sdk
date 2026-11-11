const { DEBUG } = process.env || 'false';
const { getLocalKarmaSettings } = require('../../../karma.local.shared');

const files = [
    '../node_modules/@mparticle/web-sdk/dist/mparticle.js',
    '../node_modules/mocha/mocha.js',
    '../node_modules/should/should.js',
    'config.js',

    // TODO: Replace this with the compiled name of your kit
    '../dist/ID5Kit.iife.js',

    'lib/mockhttprequest.js',
    './test-bundle.js',
];

let browsers = ['ChromeHeadless', 'FirefoxHeadless'];
let singleRun = true;

if (DEBUG === 'true') {
    browsers = ['Chrome'];
    singleRun = false;
}

module.exports = function (config) {
    config.set({
        ...getLocalKarmaSettings(),
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
