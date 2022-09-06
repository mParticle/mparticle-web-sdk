export default class Logger {
  private logLevel: string = this.config.logLevel || 'warning';
  private logger;

  constructor(private config: ConfigLogger) {
    if (config.hasOwnProperty('logger')) {
      this.logger = config.logger;
    } else {
      this.logger = new ConsoleLogger();
    }
  }

  verbose(msg) {
    if (this.logLevel !== 'none') {
      if (this.logger.verbose && this.logLevel === 'verbose') {
        this.logger.verbose(msg);
      };
    };
  };

  warning(msg) {
    if (this.logLevel !== 'none') {
      if (this.logger.warning && (this.logLevel === 'verbose' || this.logLevel === 'warning')) {
        this.logger.warning(msg);
      };
    };
  };

  error(msg) {
    if (this.logLevel !== 'none') {
      if (this.logger.error) {
        this.logger.error(msg);
      };
    };
  };

  setLogLevel(newLogLevel) {
    this.logLevel = newLogLevel;
  };

}

class ConsoleLogger {
  constructor() { }

  verbose(msg: string) {
    if (console && console.info) {
      console.info(msg);
    };
  };

  error(msg: string) {
    if (console && console.error) {
      console.error(msg);
    };
  };

  warning(msg: string) {
    if (console && console.warn) {
      console.warn(msg);
    };
  };

}

interface ConfigLogger {
  logLevel: string;
  logger: {
    error?(errorMsg);
    warning?(warningMsg);
    verbose?(verboseMsg);
  };
}