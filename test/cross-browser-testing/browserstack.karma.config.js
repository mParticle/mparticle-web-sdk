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
    // Last pre-ES6 versions on BrowserStack. Legacy EdgeHTML (15–18) is
    // omitted (~0.02% share).
    bs_chrome_mac_50: {
      base: 'BrowserStack',
      browser: 'chrome',
      browser_version: '50.0',
      os: 'OS X',
      os_version: 'Mojave'
    },
    bs_firefox_mac_51: {
      base: 'BrowserStack',
      browser: 'firefox',
      browser_version: '51.0',
      os: 'OS X',
      os_version: 'Mojave'
    },
    bs_safari_mac_11: {
      base: 'BrowserStack',
      browser: 'safari',
      browser_version: '11.1',
      os: 'OS X',
      os_version: 'High Sierra'
    },
    bs_opera_mac_37: {
      base: 'BrowserStack',
      browser: 'opera',
      browser_version: '37.0',
      os: 'OS X',
      os_version: 'Mojave'
    },
}

module.exports = function(config) {
    config.set({
      browserStack: {
        username: process.env.BS_USERNAME,
        accessKey: process.env.BS_ACCESS_KEY,
        // Pin CI sessions to the workflow tunnel; locally karma still
        // starts its own when BROWSERSTACK_LOCAL_IDENTIFIER is unset.
        ...(process.env.BROWSERSTACK_LOCAL_IDENTIFIER
            ? {
                  startTunnel: false,
                  localIdentifier:
                      process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
              }
            : {}),
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
        mocha: {
          // Slow BrowserStack VMs need more than mocha's 2s default.
          timeout: 20000,
        },
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
      // Session queueing often exceeds karma's 60s capture default.
      captureTimeout: 300000,
      // Slow VMs can stall longer than the 30s no-activity default.
      browserNoActivityTimeout: 120000,
      concurrency: 5,
    });
};
