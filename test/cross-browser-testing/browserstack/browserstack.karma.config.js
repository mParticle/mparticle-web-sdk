const { DEBUG } = process.env;

const files = [
    '../../lib/mockhttprequest.js',
    '../../lib/geomock.js',
    '../../../node_modules/fetch-mock/dist/es5/client-bundle.js',
    '../../../node_modules/sinon-browser-only/sinon.js',
    '../../config.js',
    '../../../dist/mparticle.js',
    '../../test-bundle.js'
];

const singleRun = true;

let browserConsoleLogOptions = {
    terminal: false,
};

let captureConsole = false;

// Allows console logs to appear when doing npm run test:debug
if (DEBUG === 'true') {
    browserConsoleLogOptions = {
        level: 'log',
        format: '%b %T: %m',
        terminal: true,
    };
    captureConsole = true;
}

module.exports = function(config) {
    config.set({
      browserStack: {
        username: process.env.BS_USERNAME,
        accessKey: process.env.BS_ACCESS_KEY
      },
      // define browsers
      customLaunchers: {
        // Firefox 21 fails non-es6 tests
        bs_firefox_mac_21: {
          base: 'BrowserStack',
          browser: 'firefox',
          browser_version: '21.0',
          os: 'OS X',
          os_version: 'Snow Leopard'
        },
        bs_firefox_mac_100: {
          base: 'BrowserStack',
          browser: 'firefox',
          browser_version: '100.0',
          os: 'OS X',
          os_version: 'Ventura'
        }
      },
      browsers: ['bs_firefox_mac_21', 'bs_firefox_mac_100'],
      frameworks: ['mocha', 'should'],
      files,
      reporters: ['progress', 'junit'],
      colors: true,
      concurrency: Infinity,
      singleRun,
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
    });
};
