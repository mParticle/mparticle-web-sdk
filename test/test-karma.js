const shell = require("shelljs");
const util = require('util');
var defaultArgs = '--single-run --browsers ChromeHeadless'
var args = process.argv.slice(2).join(' ') || defaultArgs;
var testCommand = util.format('browserify src/main.js -v -o build/mParticle.js && browserify test/test-index.js -o test/test-bundle.js && karma start %s test/karma.config.js', args);
console.log("Running command: \n" + testCommand)
shell.exec(testCommand);
