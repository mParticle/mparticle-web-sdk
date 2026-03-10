module.exports = function(config) {
    config.set({
        frameworks: ['mocha', 'chai'],
        files: ['../test-bundle.js'],
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ['ChromeHeadless', 'Chrome', 'FirefoxHeadless', 'Safari', 'Edge', 'IE', 'Firefox'],
        autoWatch: false,
        concurrency: Infinity,
        customLaunchers: {
            FirefoxHeadless: {
                base: 'Firefox',
                flags: [ '-headless' ]
            }
        }
    });
};
