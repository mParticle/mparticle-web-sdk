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
  bs_chrome_mac_beta: {
    base: 'BrowserStack',
    browser: 'chrome',
    browser_version: 'beta',
    os: 'OS X',
    os_version: 'Ventura'
  },
  bs_chrome_win_beta: {
    base: 'BrowserStack',
    browser: 'chrome',
    browser_version: 'latest',
    os: 'Windows',
    os_version: '11'
  },
};

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
      outputFile: 'test-karma-beta.xml',
    },
    browserDisconnectTimeout: 50000,
    browserDisconnectTolerance: 5,
    concurrency: 5,
  });
};

