module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'chai'],
    files: ['test-bundle.js'],
    reporters: ['progress', 'junit'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadless'],
    autoWatch: false,
    concurrency: Infinity
  })
}
