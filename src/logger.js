function Logger(config) {
    var self = this;
    var logLevel = config.logLevel || 'warning';
    if (config.hasOwnProperty('logger')) {
        this.logger = config.logger;
    } else {
        this.logger = new ConsoleLogger();
    }

    this.verbose = function(msg) {
        if (logLevel !== 'none') {
            if (self.logger.verbose && logLevel === 'verbose') {
                self.logger.verbose(msg);
            }
        }
    };

    this.warning = function(msg) {
        if (logLevel !== 'none') {
            if (
                self.logger.warning &&
                (logLevel === 'verbose' || logLevel === 'warning')
            ) {
                self.logger.warning(msg);
            }
        }
    };

    this.error = function(msg) {
        if (logLevel !== 'none') {
            if (self.logger.error) {
                self.logger.error(msg);
            }
        }
    };

    this.setLogLevel = function(newLogLevel) {
        logLevel = newLogLevel;
    };
}

function ConsoleLogger() {
    this.verbose = function(msg) {
        if (console && console.info) {
            console.info(msg);
        }
    };

    this.error = function(msg) {
        if (console && console.error) {
            console.error(msg);
        }
    };
    this.warning = function(msg) {
        if (console && console.warn) {
            console.warn(msg);
        }
    };
}

export default Logger;
