import { Callback, Logger } from '@mparticle/web-sdk';

// XDomainRequest is no longer a valid type,
// but we need to support it for type safety
// https://github.com/microsoft/TypeScript/issues/2927
export interface XDomainRequest {
    // constructor?: () => XDomainRequest;
    onload?: () => {};
    send?: () => {};
    open?: () => {};
}

declare global {
    interface Window {
        XDomainRequest: () => void;
    }
}

export abstract class AsyncUploader {
    url: string;
    public abstract upload(fetchPayload: fetchPayload): Promise<XHRResponse>;

    constructor(url: string) {
        this.url = url;
    }
}

export class FetchUploader extends AsyncUploader {
    public async upload(fetchPayload: fetchPayload): Promise<XHRResponse> {
        const response: XHRResponse = await fetch(this.url, fetchPayload);
        return response;
    }
}

// FIXME: Rename to XHRAsyncUploader?
export class XHRUploader extends AsyncUploader {
    public async upload(fetchPayload: fetchPayload): Promise<XHRResponse> {
        const response: XHRResponse = await this.makeRequest(
            this.url,
            fetchPayload.body
        );
        return response;
    }

    private async makeRequest(
        url: string,
        data: string
    ): Promise<XMLHttpRequest> {
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
            // QUESTION: How does this relate to the helper function?
            xhr.onreadystatechange = () => {
                if (xhr.readyState !== 4) return;

                // Process the response
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr);
                } else {
                    reject(xhr);
                }
            };

            xhr.open('post', url);
            xhr.send(data);
        });
    }
}

export type XHRMethods = 'post' | 'get';
export type XHRSuccess = () => {};
export type XHRFailure = () => {};

export class XHRThingie {
    url: string;
    data: any;
    callback: any;

    xhr: XMLHttpRequest | XDomainRequest;

    // QUESTION: Do we need logger?
    logger: Logger;

    onSuccess: () => any;
    onFailure: () => any;

    // constructor(url: string, callback?: Callback) {
    //     this.url = url;

    //     this.xhr = this.createXHR(this.callback);
    // }

    public static send(
        url: string,
        data: any, // FIXME: Can we make this a type?
        method: XHRMethods,
        callback?: Callback
    ): void {
        const xhr = createXHR(callback);
        if (xhr) {
            xhr.open(method, url);
            xhr.send(JSON.stringify(data));
        }
    }
}

function createXHR(callback?: Callback): XMLHttpRequest | XDomainRequest {
    let xhr: XMLHttpRequest | XDomainRequest;
    try {
        xhr = new window.XMLHttpRequest();
    } catch (error) {
        console.error('Error creating XMLHttpRequest object.');
    }

    if (xhr && callback && 'withCredentials' in xhr) {
        xhr.onreadystatechange = callback;
    } else if (typeof window.XDomainRequest !== 'undefined') {
        console.log('Creating XDomainRequest object');

        try {
            xhr = new window.XDomainRequest();
            xhr.onload = callback;
        } catch (error) {
            console.error('Error creating XDomainRequest object');
        }
    }

    return xhr;
}

export interface XHRResponse {
    status: number;
    statusText?: string;
}

export interface fetchPayload {
    method: string;
    headers: {
        Accept: string;
        'Content-Type': string;
    };
    body: string;
}
