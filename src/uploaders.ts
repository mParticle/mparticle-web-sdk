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
    public abstract upload(fetchPayload: fetchPayload): Promise<Response>;

    constructor(url: string) {
        this.url = url;
    }
}

export class FetchUploader extends AsyncUploader {
    public async upload(fetchPayload: fetchPayload): Promise<Response> {
        const response: Response = await fetch(this.url, fetchPayload);

        return response;
    }
}

export class XHRUploader extends AsyncUploader {
    public async upload(fetchPayload: fetchPayload): Promise<Response> {
        const response: Response = await this.makeRequest(
            this.url,
            fetchPayload.body
        );
        return response;
    }

    private async makeRequest(url: string, data: string): Promise<Response> {
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
            xhr.onreadystatechange = () => {
                if (xhr.readyState !== 4) return;

                // Process the response
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve((xhr as unknown) as Response);
                } else {
                    reject(xhr);
                }
            };

            xhr.open('post', url);
            xhr.send(data);
        });
    }
}
