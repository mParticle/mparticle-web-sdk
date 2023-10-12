const { DEBUG } = process.env;

const files = [
  '../../lib/mockhttprequest.js',
  '../../lib/geomock.js',
  '../../../node_modules/fetch-mock/dist/es5/client-bundle.js',
  '../../../node_modules/sinon-browser-only/sinon.js',
  '../../config.js',
  '../../../dist/mparticle.js',
  // currently we are testing the full test suite
    '../../test-bundle.js',
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
        // These 2 browsers pass because they are capable of running ES6 syntax
        // Our tests currently have ES6 syntax in them.  They need to be transpiled
        bs_firefox_mac_100: {
          base: 'BrowserStack',
          browser: 'firefox',
          browser_version: '100.0',
          os: 'OS X',
          os_version: 'Ventura'
        },
        bs_chrome_mac_100: {
          base: 'BrowserStack',
          browser: 'chrome',
          browser_version: '100.0',
          os: 'OS X',
          os_version: 'Ventura'
        },
        // These two browsers fail because they cannot run ES6 syntax.  
        // Our tests have some ES6 syntax in them, so we need to transpile the tests
        // to get them to run properly.
        // bs_firefox_mac_21: {
        //   base: 'BrowserStack',
        //   browser: 'firefox',
        //   browser_version: '21.0',
        //   os: 'OS X',
        //   os_version: 'Snow Leopard'
        // },
        // bs_chrome_mac_38: {
        //   base: 'BrowserStack',
        //   browser: 'chrome',
        //   browser_version: '38.0',
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
      customLaunchers,
      browsers: Object.keys(customLaunchers),
      frameworks: ['mocha', 'should'],
      files,
      reporters: ['progress', 'junit'],
      colors: true,
      concurrency: Infinity,
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
    });
};
