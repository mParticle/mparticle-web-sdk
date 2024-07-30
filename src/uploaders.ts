export interface fetchPayload {
    method: string;
    headers: {
        Accept: string;
        'Content-Type'?: string;
    };
    body?: string;
}

export abstract class AsyncUploader {
    url: string;
    public abstract upload(
        fetchPayload: fetchPayload,
        url?: string
    ): Promise<Response>;

    constructor(url: string) {
        this.url = url;
    }
}

export class FetchUploader extends AsyncUploader {
    public async upload(
        fetchPayload: fetchPayload,
        _url?: string
    ): Promise<Response> {
        const url = _url || this.url;
        return await fetch(url, fetchPayload);
    }
}

export class XHRUploader extends AsyncUploader {
    public async upload(fetchPayload: fetchPayload): Promise<Response> {
        const response: Response = await this.makeRequest(
            this.url,
            fetchPayload.body,
            fetchPayload.method as 'post' | 'get'
        );
        return response;
    }

    // XHR Ready States
    // https://stackoverflow.com/questions/30522565/what-is-meaning-of-xhr-readystate-4#:~:text=State%204%20means%20that%20the,finished%20downloading%20the%20response%20content.
    // 0   UNSENT  open() has not been called yet.
    // 1   OPENED  send() has been called.
    // 2   HEADERS_RECEIVED    send() has been called, and headers and status are available.
    // 3   LOADING Downloading; responseText holds partial data.
    // 4   DONE    The operation is complete.

    private async makeRequest(
        url: string,
        data: string,
        method: 'post' | 'get' = 'post'
    ): Promise<Response> {
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
            xhr.onreadystatechange = () => {
                if (xhr.readyState !== 4) return;

                // Process the response
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr as unknown as Response);
                } else {
                    reject(xhr);
                }
            };

            xhr.open(method, url);
            xhr.send(data);
        });
    }
}
