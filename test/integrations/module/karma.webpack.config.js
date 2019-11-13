const { BUNDLER } = process.env;
let template = require('./karma.selfhost.module.template.config.js');
let file = './dist/' + BUNDLER + '-output.js';

template.files.unshift(file);
template.settings.outputFile = 'test-karma-' + BUNDLER + '.xml';
template.settings.junitReporter.outputFile =
    'test-karma-' + BUNDLER + '-cjs.xml';

module.exports = function(config) {
    config.set({
        ...template.settings,
        browsers: template.settings.browsers,
        files: template.files,
    });
};
