const {
    getSharedKarmaSettings,
} = require('./browserstack.karma.shared');

const files = [
  '../lib/geomock.js',
  '../../dist/mparticle.js',
  '../test-bundle.js',
];

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
    ...getSharedKarmaSettings({
      files,
      junitOutputFile: 'test-karma-beta.xml',
    }),
    customLaunchers,
    browsers: Object.keys(customLaunchers),
    logLevel: config.LOG_INFO,
  });
};
