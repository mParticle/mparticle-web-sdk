const { DEBUG } = process.env;

const files = [
  '../lib/geomock.js',
  '../../node_modules/fetch-mock/dist/es5/client-bundle.js',
  '../../dist/mparticle.js',
  // TODO: the current test suite includes modern syntax which run successfully
  // on newer browsers.  We will need to transpile tests to work with older
  // browsers - go.mparticle.com/work/SQDSDKS-5834
  '../test-bundle.js',
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
