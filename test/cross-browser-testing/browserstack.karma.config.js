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
    // https://www.w3schools.com/js/js_versions.asp shows a list of browsers that support ES6.  
    // The below list is primarily the version just before that, or if that version was not available on Browserstack to test, the next version was
    // All versions below, including earlier versions of each browser, have a combined ~0.37% market share according to
    // www.browserslist.dev.  Query for "opera < 38, safari < 12, chrome < 51, firefox <52, edge < 15"
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
    bs_edge_windows_15: {
      base: 'BrowserStack',
      browser: 'edge',
      browser_version: '15.0',
      os: 'Windows',
      os_version: '10'
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
    // Oldest Chrome version to pass all tests
    // bs_chrome_mac_49: {
    //   base: 'BrowserStack',
    //   browser: 'chrome',
    //   browser_version: '49.0',
    //   os: 'OS X',
    //   os_version: 'Mojave'
    // },
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
