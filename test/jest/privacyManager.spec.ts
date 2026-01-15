import PrivacyManager from '../../src/privacyManager';
import { SDKLoggerApi } from '../../src/sdkRuntimeModels';

describe('PrivacyManager', () => {
    let mockLogger: SDKLoggerApi;

    beforeEach(() => {
        mockLogger = {
            verbose: jest.fn(),
            warning: jest.fn(),
            error: jest.fn(),
        } as unknown as SDKLoggerApi;
    });

    describe('#constructor', () => {
        it('should default flags to false when not provided', () => {
            const privacyManager = new PrivacyManager(undefined, mockLogger);

            expect(privacyManager.getNoFunctional()).toBe(false);
            expect(privacyManager.getNoTargeting()).toBe(false);
            expect(mockLogger.verbose).toHaveBeenCalledWith(
                'PrivacyManager: No privacy flags provided, using defaults'
            );
        });

        it('should set flags when passed and log', () => {
            const privacyManager = new PrivacyManager({ noFunctional: true, noTargeting: true }, mockLogger);

            expect(privacyManager.getNoFunctional()).toBe(true);
            expect(privacyManager.getNoTargeting()).toBe(true);
            expect(mockLogger.verbose).toHaveBeenCalledWith('PrivacyManager: noFunctional set to true');
            expect(mockLogger.verbose).toHaveBeenCalledWith('PrivacyManager: noTargeting set to true');
        });

        it('should ignore non-boolean values', () => {
            const privacyManager = new PrivacyManager({
                noFunctional: 'true' as unknown as boolean,
                noTargeting: 1 as unknown as boolean,
            }, mockLogger);

            expect(privacyManager.getNoFunctional()).toBe(false);
            expect(privacyManager.getNoTargeting()).toBe(false);
        });

        it('should work without a logger', () => {
            const privacyManager = new PrivacyManager({ noTargeting: true });

            expect(privacyManager.getNoTargeting()).toBe(true);
        });
    });

    describe('#getNoFunctional', () => {
        it('should return the noFunctional flag value', () => {
            const privacyManager = new PrivacyManager({ noFunctional: true });

            expect(privacyManager.getNoFunctional()).toBe(true);
        });
    });

    describe('#getNoTargeting', () => {
        it('should return the noTargeting flag value', () => {
            const privacyManager = new PrivacyManager({ noTargeting: true });

            expect(privacyManager.getNoTargeting()).toBe(true);
        });
    });
});
