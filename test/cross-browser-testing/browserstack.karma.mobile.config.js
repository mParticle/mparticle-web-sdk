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
  // Android Mobile Browsers
  bs_android_chrome: {
    base: 'BrowserStack',
    device: 'Google Pixel 8',
    os: 'android',
    os_version: '14.0',
    real_mobile: true,
    browser: 'chrome'
  },
  bs_android_firefox: {
    base: 'BrowserStack',
    device: 'Google Pixel 8',
    os: 'android',
    os_version: '14.0',
    real_mobile: true,
    browser: 'firefox'
  },
  bs_android_samsung: {
    base: 'BrowserStack',
    device: 'Samsung Galaxy S23',
    os: 'android',
    os_version: '13.0',
    real_mobile: true,
    browser: 'samsung'
  },
  
  // iOS Mobile Browsers
  bs_ios_safari: {
    base: 'BrowserStack',
    device: 'iPhone 15 Pro',
    os: 'ios',
    os_version: '17',
    real_mobile: true,
    browser: 'safari'
  },
  bs_ios_chrome: {
    base: 'BrowserStack',
    device: 'iPhone 15 Pro',
    os: 'ios',
    os_version: '17',
    real_mobile: true,
    browser: 'chrome'
  },
  bs_ios_firefox: {
    base: 'BrowserStack',
    device: 'iPhone 15 Pro',
    os: 'ios',
    os_version: '17',
    real_mobile: true,
    browser: 'firefox'
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
    browserDisconnectTimeout: 180000,
    browserDisconnectTolerance: 5,
    concurrency: 1,
    captureTimeout: 180000,
    browserNoActivityTimeout: 180000,
  });
};
