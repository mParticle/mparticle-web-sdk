import {
    FetchUploader,
    XHRUploader,
    IFetchPayload,
} from '../../src/uploaders';

const payload: IFetchPayload = {
    method: 'post',
    headers: {
        Accept: 'text/plain;charset=UTF-8',
        'Content-Type': 'text/plain;charset=UTF-8',
    },
    body: '{"test":true}',
};

describe('uploaders', () => {
    describe('FetchUploader', () => {
        let originalFetch: typeof fetch;

        beforeEach(() => {
            originalFetch = window.fetch;
        });

        afterEach(() => {
            window.fetch = originalFetch;
        });

        it('posts the payload to the constructor URL', async () => {
            const response = ({ status: 200 } as unknown) as Response;
            const fetchSpy = jest.fn().mockResolvedValue(response);
            window.fetch = fetchSpy;

            const uploader = new FetchUploader('https://example.com/upload');
            const result = await uploader.upload(payload);

            expect(fetchSpy).toHaveBeenCalledWith(
                'https://example.com/upload',
                payload
            );
            expect(result).toBe(response);
        });

        it('posts to the URL passed to upload when one is given', async () => {
            const fetchSpy = jest.fn().mockResolvedValue({ status: 202 });
            window.fetch = fetchSpy;

            const uploader = new FetchUploader('https://example.com/upload');
            await uploader.upload(payload, 'https://example.com/other');

            expect(fetchSpy).toHaveBeenCalledWith(
                'https://example.com/other',
                payload
            );
        });

        it('resolves a non-2xx response without throwing', async () => {
            const response = ({ status: 500 } as unknown) as Response;
            window.fetch = jest.fn().mockResolvedValue(response);

            const uploader = new FetchUploader('https://example.com/upload');

            await expect(uploader.upload(payload)).resolves.toBe(response);
        });

        it('rejects when the network request fails', async () => {
            const error = new TypeError('Failed to fetch');
            window.fetch = jest.fn().mockRejectedValue(error);

            const uploader = new FetchUploader('https://example.com/upload');

            await expect(uploader.upload(payload)).rejects.toBe(error);
        });
    });

    describe('XHRUploader', () => {
        let originalXHR: typeof XMLHttpRequest;
        let xhr: {
            open: jest.Mock;
            send: jest.Mock;
            setRequestHeader: jest.Mock;
            readyState: number;
            status: number;
            onreadystatechange: () => void;
            onerror: () => void;
        };

        beforeEach(() => {
            originalXHR = window.XMLHttpRequest;
            xhr = {
                open: jest.fn(),
                send: jest.fn(),
                setRequestHeader: jest.fn(),
                readyState: 0,
                status: 0,
                onreadystatechange: null,
                onerror: null,
            };
            window.XMLHttpRequest = (jest.fn(
                () => xhr
            ) as unknown) as typeof XMLHttpRequest;
        });

        afterEach(() => {
            window.XMLHttpRequest = originalXHR;
        });

        it('opens, sets each header and sends the body', async () => {
            const uploader = new XHRUploader('https://example.com/upload');
            const pending = uploader.upload(payload);

            expect(xhr.open).toHaveBeenCalledWith(
                'post',
                'https://example.com/upload'
            );
            expect(xhr.setRequestHeader).toHaveBeenCalledWith(
                'Accept',
                'text/plain;charset=UTF-8'
            );
            expect(xhr.setRequestHeader).toHaveBeenCalledWith(
                'Content-Type',
                'text/plain;charset=UTF-8'
            );
            expect(xhr.send).toHaveBeenCalledWith('{"test":true}');

            xhr.readyState = 4;
            xhr.status = 200;
            xhr.onreadystatechange();

            await expect(pending).resolves.toBe(xhr);
        });

        it('waits for the request to finish before resolving', async () => {
            const uploader = new XHRUploader('https://example.com/upload');
            const resolved = jest.fn();
            const pending = uploader.upload(payload).then(resolved);

            xhr.readyState = 2;
            xhr.onreadystatechange();
            // Flush every pending microtask. An early resolve passes through
            // several promise jobs before it reaches `resolved`.
            await new Promise(r => setTimeout(r, 0));
            expect(resolved).not.toHaveBeenCalled();

            xhr.readyState = 4;
            xhr.onreadystatechange();
            await pending;
            expect(resolved).toHaveBeenCalledWith(xhr);
        });

        it('resolves an HTTP error status without rejecting', async () => {
            const uploader = new XHRUploader('https://example.com/upload');
            const pending = uploader.upload(payload);

            xhr.readyState = 4;
            xhr.status = 400;
            xhr.onreadystatechange();

            await expect(pending).resolves.toBe(xhr);
        });

        it('rejects when the request errors', async () => {
            const uploader = new XHRUploader('https://example.com/upload');
            const pending = uploader.upload(payload);

            xhr.onerror();

            await expect(pending).rejects.toBe(xhr);
        });

        it('defaults to POST with no headers when the payload has neither', () => {
            const uploader = new XHRUploader('https://example.com/upload');

            uploader.upload(({ body: 'data' } as unknown) as IFetchPayload);

            expect(xhr.open).toHaveBeenCalledWith(
                'post',
                'https://example.com/upload'
            );
            expect(xhr.setRequestHeader).not.toHaveBeenCalled();
            expect(xhr.send).toHaveBeenCalledWith('data');
        });

        it('skips inherited header properties', async () => {
            const headers = Object.create({ Inherited: 'value' });
            headers.Accept = 'text/plain';
            const uploader = new XHRUploader('https://example.com/upload');

            uploader.upload({ method: 'post', headers, body: '' });

            expect(xhr.setRequestHeader).toHaveBeenCalledTimes(1);
            expect(xhr.setRequestHeader).toHaveBeenCalledWith(
                'Accept',
                'text/plain'
            );
        });
    });
});
