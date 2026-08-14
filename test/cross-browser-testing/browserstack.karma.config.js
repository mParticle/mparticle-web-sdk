const {
    getSharedKarmaSettings,
} = require('./browserstack.karma.shared');

const files = [
  '../lib/geomock.js',
  '../../dist/mparticle.js',
  './CBT-tests-es5.js',
];

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
      ...getSharedKarmaSettings({
        files,
        junitOutputFile: 'test-karma.xml',
        extra: {
          // Session queueing often exceeds karma's 60s capture default.
          captureTimeout: 300000,
          // Slow VMs can stall longer than the 30s no-activity default.
          browserNoActivityTimeout: 120000,
        },
      }),
      customLaunchers,
      browsers: Object.keys(customLaunchers),
      logLevel: config.LOG_INFO,
    });
};
