interface ICnsLogger {
    verbose(msg: string): void;
    error(msg: string): void;
    warning(msg: string): void;
}

interface ILogger extends ICnsLogger {
    logger: ICnsLogger;
    logLevel: string;
    setLogLevel(newLogLevel: string): void;
}

type Config = {
    logLevel: string;
    logger: ICnsLogger;
};

class ConsoleLogger implements ICnsLogger {
    verbose(msg: string): void {
        if (console && console.info) {
            console.info(msg);
        }
    }

    error(msg: string): void {
        if (console && console.error) {
            console.error(msg);
        }
    }
    warning(msg: string): void {
        if (console && console.warn) {
            console.warn(msg);
        }
    }
}

class Logger implements ILogger {
    logger: ICnsLogger;
    logLevel: string;

    constructor(config: Config) {
        this.logLevel = config.logLevel || 'warning';
        if (config.hasOwnProperty('logger')) {
            this.logger = config.logger;
        } else {
            this.logger = new ConsoleLogger();
        }
    }

    verbose = (msg: string): void => {
        this.logLevel === 'verbose' && this.logger.verbose(msg);
    };

    error = (msg: string): void => {
        this.logLevel !== 'none' && this.logger.error(msg);
    };

    warning = (msg: string): void => {
        (this.logLevel === 'verbose' || this.logLevel === 'warning') &&
            this.logger.warning(msg);
    };

    setLogLevel = (newLogLevel: string): void => {
        this.logLevel = newLogLevel;
    };
}

export default Logger;
