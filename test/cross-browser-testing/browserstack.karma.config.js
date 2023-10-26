const { DEBUG } = process.env;

const files = [
  '../lib/geomock.js',
  '../../dist/mparticle.js',
  './CBT-tests-es5.js',
];

let captureConsole = false;
let browserConsoleLogOptions = {};

// Allows console logs to appear when doing npm run test:debug
if (DEBUG === 'true') {
    browserConsoleLogOptions = {
        level: 'log',
        format: '%b %T: %m',
        terminal: true,
    };
    captureConsole = true;
} else {
    browserConsoleLogOptions = {
        terminal: false,
    };
}

const customLaunchers = {
    // Full list of supported browsers - https://www.browserstack.com/list-of-browsers-and-platforms/live
    // Fails a few tests related to setTimeout
    bs_chrome_mac_48: {
      base: 'BrowserStack',
      browser: 'chrome',
      browser_version: '48.0',
      os: 'OS X',
      os_version: 'Mojave'
    },
    // Oldest Chrome version to pass all tests
    bs_chrome_mac_49: {
      base: 'BrowserStack',
      browser: 'chrome',
      browser_version: '49.0',
      os: 'OS X',
      os_version: 'Mojave'
    },
}

module.exports = function(config) {
    config.set({
      browserStack: {
        username: process.env.BS_USERNAME,
        accessKey: process.env.BS_ACCESS_KEY
      },
      autoWatch: false,
      customLaunchers,
      browsers: Object.keys(customLaunchers),
      frameworks: ['mocha', 'should'],
      files,
      reporters: ['progress', 'junit'],
      colors: true,
      singleRun: true,
      debug: true,
      logLevel: config.LOG_INFO,
      browserConsoleLogOptions,
      client: {
        captureConsole,
      },
      junitReporter: {
        outputDir: 'reports/',
        outputFile: 'test-karma.xml',
      },
      // These settings are added because the connection to Browserstack
      // can sometimes be unstable, requiring re-connections, or a longer than 
      // 2000 ms (default) timeout 
      browserDisconnectTimeout: 50000,
      browserDisconnectTolerance: 5,
      concurrency: 5,
    });
};
