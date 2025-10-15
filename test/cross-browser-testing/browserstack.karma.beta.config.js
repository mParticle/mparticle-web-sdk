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
  bs_chrome_mac_tahoe_beta: {
    base: 'BrowserStack',
    browser: 'chrome',
    browser_version: 'latest-beta',
    os: 'OS X',
    os_version: 'Tahoe' // macOS 26
  },
  bs_chrome_mac_sequoia_beta: {
    base: 'BrowserStack',
    browser: 'chrome',
    browser_version: 'latest-beta',
    os: 'OS X',
    os_version: 'Sequoia' // macOS 15
  },
  bs_chrome_win_beta: {
    base: 'BrowserStack',
    browser: 'chrome',
    browser_version: 'latest',
    os: 'Windows',
    os_version: '11'
  },
  bs_firefox_mac_tahoe_beta: {
    base: 'BrowserStack',
    browser: 'firefox',
    browser_version: 'latest-beta',
    os: 'OS X',
    os_version: 'Tahoe' // macOS 26
  },
  bs_firefox_mac_sequoia_beta: {
    base: 'BrowserStack',
    browser: 'firefox',
    browser_version: 'latest-beta',
    os: 'OS X',
    os_version: 'Sequoia' // macOS 15
  },
  bs_firefox_mac_catalina_beta: {
    base: 'BrowserStack',
    browser: 'firefox',
    browser_version: 'latest-beta',
    os: 'OS X',
    os_version: 'Catalina' // macOS 10.15
  },
  bs_firefox_win_latest: {
    base: 'BrowserStack',
    browser: 'firefox',
    browser_version: 'latest',
    os: 'Windows',
    os_version: '11',
  },
  bs_edge_mac_tahoe_beta: {
    base: 'BrowserStack',
    browser: 'edge',
    browser_version: 'latest-beta',
    os: 'OS X',
    os_version: 'Tahoe' // macOS 26
  },
  bs_edge_mac_sequoia_beta: {
    base: 'BrowserStack',
    browser: 'edge',
    browser_version: 'latest-beta',
    os: 'OS X',
    os_version: 'Sequoia' // macOS 15
  },
  bs_edge_win_beta: {
    base: 'BrowserStack',
    browser: 'edge',
    browser_version: 'latest-beta',
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

