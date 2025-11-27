import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { LogRequest, LogRequestSeverity } from '../../src/logging/logRequest';
import { ErrorCodes } from '../../src/logging/errorCodes';
import APIClient from '../../src/apiClient';

jest.mock('../../src/uploaders', () => {
    const fetchUploadMock = jest.fn(() => Promise.resolve({} as Response));
    const xhrUploadMock = jest.fn(() => Promise.resolve({} as Response));
    
    class MockFetchUploader {
        constructor(public url: string) {}
        upload = fetchUploadMock;
    }
    class MockXHRUploader {
        constructor(public url: string) {}
        upload = xhrUploadMock;
    }
    
    (globalThis as any).__fetchUploadSpy = fetchUploadMock;
    (globalThis as any).__xhrUploadSpy = xhrUploadMock;
    
    return {
        AsyncUploader: class {},
        FetchUploader: MockFetchUploader,
        XHRUploader: MockXHRUploader,
    };
});

describe('apiClient.sendLogToServer', () => {
    let mpInstance: any;
    let logRequest: LogRequest;
    let originalWindow: any;
    let originalFetch: any;
    let kitBlocker: any = { 
        kitBlockingEnabled: false,
        dataPlanMatchLookups: {},
    };

    beforeEach(() => {
        jest.resetModules();

        originalWindow = (global as any).window;
        originalFetch = (global as any).window?.fetch;

        mpInstance = {
            _Helpers: {
                createServiceUrl: jest.fn((url: string, token: string) => `https://api.fake.com/${token}`)
            },
            _Store: {
                SDKConfig: { v2SecureServiceUrl: 'someUrl' },
                devToken: 'testToken123'
            }
        };

        logRequest = {
            additionalInformation: {
                message: 'test',
                version: '1.0.0'
            },
            severity: LogRequestSeverity.Error,
            code: ErrorCodes.UNHANDLED_EXCEPTION,
            url: 'https://example.com',
            deviceInfo: 'test',
            stackTrace: 'test',
            reporter: 'test',
            integration: 'test'
        };

        // @ts-ignore
        (global as any).window = {};

        const fetchSpy = (globalThis as any).__fetchUploadSpy as jest.Mock;
        const xhrSpy = (globalThis as any).__xhrUploadSpy as jest.Mock;
        if (fetchSpy) fetchSpy.mockClear();
        if (xhrSpy) xhrSpy.mockClear();
    });

    afterEach(() => {
        (globalThis as any).window = originalWindow;
        if (originalFetch !== undefined) {
            (globalThis as any).window.fetch = originalFetch;
        }
        jest.clearAllMocks();
    });

    test('should use FetchUploader if window.fetch is available', () => {
        (globalThis as any).window.fetch = jest.fn();
        
        const uploadSpy = (global as any).__fetchUploadSpy as jest.Mock;
        const client = new APIClient(mpInstance, kitBlocker);

        client.sendLogToServer(logRequest);

        validateUploadCall(uploadSpy, logRequest, mpInstance);
    });

    test('should use XHRUploader if window.fetch is not available', () => {
        delete (global as any).window.fetch;
        
        const uploadSpy = (global as any).__xhrUploadSpy as jest.Mock;
        const client = new APIClient(mpInstance, kitBlocker);

        client.sendLogToServer(logRequest);

        validateUploadCall(uploadSpy, logRequest, mpInstance);
    });

    function validateUploadCall(uploadSpy: jest.Mock, expectedLogRequest: LogRequest, mpInstance: any) {
        expect(uploadSpy).toHaveBeenCalledTimes(1);
        expect(uploadSpy.mock.calls.length).toBeGreaterThan(0);
        const firstCall = uploadSpy.mock.calls[0] as any[];
        expect(firstCall).toBeDefined();
        const call = firstCall[0];
        expect(call).toBeDefined();
        expect((call as any).method).toBe('POST');
        expect((call as any).body).toBe(JSON.stringify(expectedLogRequest));
        expect((call as any).headers).toMatchObject({
            Accept: 'text/plain;charset=UTF-8',
            'Content-Type': 'text/plain;charset=UTF-8'
        });
        expect(mpInstance._Helpers.createServiceUrl).toHaveBeenCalledWith(
            mpInstance._Store.SDKConfig.v2SecureServiceUrl,
            mpInstance._Store.devToken
        );
    }
});



