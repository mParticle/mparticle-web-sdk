const { FILE_ORDER } = process.env;

let files = [];
switch (FILE_ORDER) {
    case 'before_mp':
        files = [
            '../../lib/mockhttprequest.js',
            '../../lib/require.2.3.6.min.js',
            '../../../dist/mparticle.js',
            'test-requirejs.js',
        ];
        break;
    case 'after_mp':
        files = [
            '../../lib/mockhttprequest.js',
            '../../../dist/mparticle.js',
            '../../lib/require.2.3.6.min.js',
            'test-requirejs.js',
        ];
        break;
    default:
        throw new Error(
            "Please specify 'FILE_ORDER' env variable as either 'before_mp' or 'after_mp'"
        );
}

module.exports = function(config) {
    config.set({
        frameworks: ['mocha', 'chai'],
        files,
        reporters: ['progress', 'junit'],
        colors: true,
        browsers: ['ChromeHeadless', 'FirefoxHeadless'],
        concurrency: Infinity,
        singleRun: true,
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
            outputDir: '../../reports/',
            outputFile: 'test-requirejs.xml',
        },
    });
};
