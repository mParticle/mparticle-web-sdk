import { Logger } from '../../src/logger';
import { ReportingLogger } from '../../src/logging/reportingLogger';
import { ErrorCodes } from '../../src/logging/types';
import { IStore, SDKConfig } from '../../src/store';
import { LogLevelType } from '../../src/sdkRuntimeModels';

describe('Logging Integration', () => {
    let mockFetch: jest.Mock;
    const loggingUrl = 'test-url.com/v1/log';
    const errorUrl = 'test-url.com/v1/errors';
    const sdkVersion = '1.2.3';
    const accountId = '9876543210';
    const integrationName = 'test-integration';

    beforeEach(() => {
        mockFetch = jest.fn().mockResolvedValue({ ok: true });
        global.fetch = mockFetch;

        Object.defineProperty(window, 'location', {
            writable: true,
            value: {
                href: 'https://example.com',
                search: ''
            }
        });

        Object.defineProperty(window, 'navigator', {
            writable: true,
            value: { userAgent: 'test-user-agent' }
        });

        Object.defineProperty(window, 'mParticle', {
            writable: true,
            value: { config: { isLoggingEnabled: true } }
        });

        Object.defineProperty(window, 'ROKT_DOMAIN', {
            writable: true,
            value: 'test-domain'
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('integrates Logger, ReportingLogger, and Store to send error with account ID and integration name', () => {
        // Setup Store with account ID and integration name
        const mockStore: Partial<IStore> = {
            getRoktAccountId: jest.fn().mockReturnValue(accountId),
            getIntegrationName: jest.fn().mockReturnValue(integrationName)
        };

        // Create ReportingLogger with Store
        const reportingLogger = new ReportingLogger(
            { loggingUrl, errorUrl, isLoggingEnabled: true } as SDKConfig,
            sdkVersion,
            mockStore as IStore,
            'test-guid'
        );

        // Create Logger with ReportingLogger
        const logger = new Logger(
            { logLevel: LogLevelType.Warning },
            reportingLogger
        );

        // Log an error through the Logger
        logger.error('Integration test error', ErrorCodes.UNHANDLED_EXCEPTION);

        // Verify the full flow
        expect(mockFetch).toHaveBeenCalledTimes(1);

        const fetchCall = mockFetch.mock.calls[0];
        const fetchUrl = fetchCall[0];
        const fetchOptions = fetchCall[1];

        // Verify URL
        expect(fetchUrl).toBe(`https://${errorUrl}`);

        // Verify headers include Store data
        expect(fetchOptions.headers['rokt-account-id']).toBe(accountId);
        expect(fetchOptions.headers['rokt-launcher-version']).toBe(integrationName);
        expect(fetchOptions.headers['rokt-launcher-instance-guid']).toBe('test-guid');

        // Verify body includes correct data
        const body = JSON.parse(fetchOptions.body);
        expect(body.additionalInformation.message).toBe('Integration test error');
        expect(body.additionalInformation.version).toBe(integrationName);
        expect(body.code).toBe(ErrorCodes.UNHANDLED_EXCEPTION);
        expect(body.integration).toBe(integrationName);
        expect(body.reporter).toBe('mp-wsdk');

        // Verify Store methods were called
        expect(mockStore.getRoktAccountId).toHaveBeenCalled();
        expect(mockStore.getIntegrationName).toHaveBeenCalled();
    });

    it('does not send to ReportingLogger when error code is not provided', () => {
        const mockStore: Partial<IStore> = {
            getRoktAccountId: jest.fn().mockReturnValue(accountId),
            getIntegrationName: jest.fn().mockReturnValue(integrationName)
        };

        const reportingLogger = new ReportingLogger(
            { loggingUrl, errorUrl, isLoggingEnabled: true } as SDKConfig,
            sdkVersion,
            mockStore as IStore
        );

        const logger = new Logger(
            { logLevel: LogLevelType.Warning },
            reportingLogger
        );

        // Log error without error code - should not report to backend
        logger.error('Console only error');

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('updates Store reference and uses new data after setStore is called', () => {
        const initialStore: Partial<IStore> = {
            getRoktAccountId: jest.fn().mockReturnValue('initial-id'),
            getIntegrationName: jest.fn().mockReturnValue('initial-integration')
        };

        const reportingLogger = new ReportingLogger(
            { loggingUrl, errorUrl, isLoggingEnabled: true } as SDKConfig,
            sdkVersion,
            initialStore as IStore
        );

        const logger = new Logger(
            { logLevel: LogLevelType.Warning },
            reportingLogger
        );

        // Update Store reference (simulating what happens in _resetForTests)
        const newStore: Partial<IStore> = {
            getRoktAccountId: jest.fn().mockReturnValue('new-id'),
            getIntegrationName: jest.fn().mockReturnValue('new-integration')
        };

        reportingLogger.setStore(newStore as IStore);

        // Log error - should use new Store data
        logger.error('Test error', ErrorCodes.IDENTITY_REQUEST);

        expect(mockFetch).toHaveBeenCalledTimes(1);

        const fetchCall = mockFetch.mock.calls[0];
        const fetchOptions = fetchCall[1];

        // Verify new Store data is used
        expect(fetchOptions.headers['rokt-account-id']).toBe('new-id');
        expect(fetchOptions.headers['rokt-launcher-version']).toBe('new-integration');

        const body = JSON.parse(fetchOptions.body);
        expect(body.additionalInformation.version).toBe('new-integration');
        expect(body.integration).toBe('new-integration');

        // Verify new Store was called, not the old one
        expect(newStore.getRoktAccountId).toHaveBeenCalled();
        expect(newStore.getIntegrationName).toHaveBeenCalled();
        expect(initialStore.getRoktAccountId).not.toHaveBeenCalled();
    });

    it('sends info logs to loggingUrl instead of errorUrl', () => {
        const mockStore: Partial<IStore> = {
            getRoktAccountId: jest.fn().mockReturnValue(accountId),
            getIntegrationName: jest.fn().mockReturnValue(integrationName)
        };

        const reportingLogger = new ReportingLogger(
            { loggingUrl, errorUrl, isLoggingEnabled: true } as SDKConfig,
            sdkVersion,
            mockStore as IStore
        );

        // Call info directly on ReportingLogger
        reportingLogger.info('Info message', ErrorCodes.IDENTITY_REQUEST);

        expect(mockFetch).toHaveBeenCalledTimes(1);

        const fetchCall = mockFetch.mock.calls[0];
        const fetchUrl = fetchCall[0];

        // Verify it goes to loggingUrl, not errorUrl
        expect(fetchUrl).toBe(`https://${loggingUrl}`);
        expect(fetchUrl).not.toContain('errors');
    });

    it('respects LogLevel settings in Logger', () => {
        const mockStore: Partial<IStore> = {
            getRoktAccountId: jest.fn().mockReturnValue(accountId),
            getIntegrationName: jest.fn().mockReturnValue(integrationName)
        };

        const reportingLogger = new ReportingLogger(
            { loggingUrl, errorUrl, isLoggingEnabled: true } as SDKConfig,
            sdkVersion,
            mockStore as IStore
        );

        // Set LogLevel to None - should not log anything
        const logger = new Logger(
            { logLevel: LogLevelType.None },
            reportingLogger
        );

        logger.error('Should not log', ErrorCodes.UNHANDLED_EXCEPTION);

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('uses default values when Store methods return null', () => {
        const mockStore: Partial<IStore> = {
            getRoktAccountId: jest.fn().mockReturnValue(null),
            getIntegrationName: jest.fn().mockReturnValue(null)
        };

        const reportingLogger = new ReportingLogger(
            { loggingUrl, errorUrl, isLoggingEnabled: true } as SDKConfig,
            sdkVersion,
            mockStore as IStore
        );

        const logger = new Logger(
            { logLevel: LogLevelType.Warning },
            reportingLogger
        );

        logger.error('Test error', ErrorCodes.UNHANDLED_EXCEPTION);

        expect(mockFetch).toHaveBeenCalledTimes(1);

        const fetchCall = mockFetch.mock.calls[0];
        const fetchOptions = fetchCall[1];

        // Verify rokt-account-id header is not present
        expect(fetchOptions.headers['rokt-account-id']).toBeUndefined();

        // Verify default integration name is used
        expect(fetchOptions.headers['rokt-launcher-version']).toBe(`mParticle_wsdkv_${sdkVersion}`);

        const body = JSON.parse(fetchOptions.body);
        expect(body.integration).toBe('mp-wsdk');
    });
});
