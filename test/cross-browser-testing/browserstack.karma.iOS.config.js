const { DEBUG } = process.env;

const files = [
  '../lib/geomock.js',
  '../../dist/mparticle.js',
  '../test-bundle.js',
];

let captureConsole = false;
let browserConsoleLogOptions = {};

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
  // iOS 26 - chrome, firefox, safari
  bs_ios_26_safari: {
    base: 'BrowserStack',
    device: 'iPhone 17 Pro',
    os: 'ios',
    os_version: '26',
    real_mobile: true,
    browser: 'safari'
  },
  bs_ios_26_chrome: {
    base: 'BrowserStack',
    device: 'iPad Air 5',
    os: 'ios',
    os_version: '26',
    real_mobile: true,
    browser: 'chrome'
  },
  bs_ios_26_firefox: {
    base: 'BrowserStack',
    device: 'iPhone Air',
    os: 'ios',
    os_version: '26',
    real_mobile: true,
    browser: 'firefox'
  },

  // iOS 18 - chrome, firefox, safari
  bs_ios_18_safari: {
    base: 'BrowserStack',
    device: 'iPhone 16e',
    os: 'ios',
    os_version: '18',
    real_mobile: true,
    browser: 'safari'
  },
  bs_ios_18_chrome: {
    base: 'BrowserStack',
    device: 'iPad Pro 11 2021',
    os: 'ios',
    os_version: '18',
    real_mobile: true,
    browser: 'chrome'
  },
  bs_ios_18_firefox: {
    base: 'BrowserStack',
    device: 'iPhone 14',
    os: 'ios',
    os_version: '18',
    real_mobile: true,
    browser: 'firefox'
  },

  // iOS 17 - chrome
  bs_ios_17_chrome: {
    base: 'BrowserStack',
    device: 'iPhone 12',
    os: 'ios',
    os_version: '17',
    real_mobile: true,
    browser: 'chrome'
  },

  // iOS 16 - safari
  bs_ios_16_safari: {
    base: 'BrowserStack',
    device: 'iPad 10th',
    os: 'ios',
    os_version: '16',
    real_mobile: true,
    browser: 'safari'
  },
};

module.exports = function(config) {
  config.set({
    browserStack: {
      username: process.env.BS_USERNAME,
      accessKey: process.env.BS_ACCESS_KEY,
      local: true,
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
        timeout: 10000
      }
    },
    junitReporter: {
      outputDir: 'reports/',
      outputFile: 'test-karma-mobile.xml',
    },
    browserDisconnectTimeout: 50000,
    browserDisconnectTolerance: 5,
    concurrency: 5,
  });
};
