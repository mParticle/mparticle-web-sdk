import Logger from "../../src/logger";
import { SDKInitConfig } from "../../src/sdkRuntimeModels";

describe('ConsoleLogger', () => {
    it('should set logger level to warning', () => {
        // create a dummy config
        let sampleConfig = {
            appName: 'Store Test',
            appVersion: '1.x',
            package: 'com.mparticle.test',
            flags: {},
        } as SDKInitConfig;

        // create a new Logger instance
        const logger = new Logger(sampleConfig);

        // setLogLevel to warning
        logger.setLogLevel('warning');

        // insure the logLevel is set to warning
        expect(logger.logLevel).toBe('warning')
    });

    it('should set logger level to verbose', () => {
        // create a dummy config
        let sampleConfig = {
            appName: 'Store Test',
            appVersion: '1.x',
            package: 'com.mparticle.test',
            flags: {},
        } as SDKInitConfig;

        // create a new Logger instance
        const logger = new Logger(sampleConfig);

        // setLogLevel to verbose
        logger.setLogLevel('verbose');

        // insure the logLevel is set to verbose
        expect(logger.logLevel).toBe('verbose')
    })

    it('should set logger level to error', () => {
        // create a dummy config
        let sampleConfig = {
            appName: 'Store Test',
            appVersion: '1.x',
            package: 'com.mparticle.test',
            flags: {},
        } as SDKInitConfig;

        // create a new Logger instance
        const logger = new Logger(sampleConfig);

        // setLogLevel to error
        logger.setLogLevel('error');

        // insure the logLevel is set to error
        expect(logger.logLevel).toBe('error')
    })
});