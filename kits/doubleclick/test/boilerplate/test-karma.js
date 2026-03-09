var shell = require('shelljs');
var util = require('util');
var defaultArgs = '--single-run --browsers=ChromeHeadless,FirefoxHeadless';
var args = process.argv.slice(2).join(' ') || defaultArgs;

var testCommand = util.format('browserify test/boilerplate/test-index.js -o test/test-bundle.js && karma start %s test/boilerplate/karma.config.js', args);
console.log('Running command: \n' + testCommand);
shell.exec(testCommand);
