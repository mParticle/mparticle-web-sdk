import { SDKInitConfig } from "./sdkRuntimeModels";

interface Logger {
    verbose: (msg: string) => void;
    warning: (msg: string) => void;
    error: (msg: string) => void;
    setLogLevel: (msg: string) => void;
    logLevel: string;
    logger: this;
}

function Logger(this: Logger, config: SDKInitConfig): void {
    var self = this;
    var logLevel: string = config.logLevel || 'warning';
    if (config.hasOwnProperty('logger')) {
        this.logger = config.logger as Logger;
    } else {
        this.logger = new ConsoleLogger();
    }

    this.verbose = function(msg: string) {
        if (logLevel !== 'none') {
            if (self.logger.verbose && logLevel === 'verbose') {
                self.logger.verbose(msg);
            }
        }
    };

    this.warning = function(msg: string) {
        if (logLevel !== 'none') {
            if (
                self.logger.warning &&
                (logLevel === 'verbose' || logLevel === 'warning')
            ) {
                self.logger.warning(msg);
            }
        }
    };

    this.error = function(msg: string) {
        if (logLevel !== 'none') {
            if (self.logger.error) {
                self.logger.error(msg);
            }
        }
    };

    this.setLogLevel = function(newLogLevel: string) {
        logLevel = newLogLevel;
        this.logLevel = logLevel;
    };
}

function ConsoleLogger(this: Logger): void {
    this.verbose = function(msg: string) {
        if (console && console.info) {
            console.info(msg);
        }
    };

    this.error = function(msg: string) {
        if (console && console.error) {
            console.error(msg);
        }
    };
    this.warning = function(msg: string) {
        if (console && console.warn) {
            console.warn(msg);
        }
    };
}

export default Logger;