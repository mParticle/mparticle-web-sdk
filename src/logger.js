function Logger(config) {
    var logLevel = config.logLevel || 'warning';
    if (config.hasOwnProperty('logger')) {
        this.logger = config.logger;
    } else {
        this.logger = new ConsoleLogger();
    }

    this.verbose = function(msg) {
        if (logLevel !== 'none') {
            if (this.logger.verbose && logLevel === 'verbose') {
                this.logger.verbose(msg);
            }
        }
    };

    this.warning = function(msg) {
        if (logLevel !== 'none') {
            if ((this.logger.warning && (logLevel === 'verbose' || logLevel === 'warning'))) {
                this.logger.warning(msg);
            }
        }
    };

    this.error = function(msg) {
        if (logLevel !== 'none') {
            if (this.logger.error) {
                this.logger.error(msg);
            }
        }
    };

    this.setLogLevel = function (newLogLevel) {
        logLevel = newLogLevel;
    };
}

function ConsoleLogger() {
    this.verbose = function (msg) {
        if (window.console && window.console.info) {
            window.console.info(msg);
        }
    };

    this.error = function (msg) {
        if (window.console && window.console.error) {
            window.console.error(msg);
        }
    };
    this.warning = function (msg) {
        if (window.console && window.console.warn) {
            window.console.warn(msg);
        }
    };
}

module.exports = Logger;