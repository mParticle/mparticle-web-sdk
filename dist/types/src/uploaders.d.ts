export interface IFetchPayload {
    method: string;
    headers: {
        Accept: string;
        'Content-Type'?: string;
        'rokt-account-id'?: string;
    };
    body?: string;
}
export declare abstract class AsyncUploader {
    url: string;
    abstract upload(fetchPayload: IFetchPayload, url?: string): Promise<Response>;
    constructor(url: string);
}
export declare class FetchUploader extends AsyncUploader {
    upload(fetchPayload: IFetchPayload, _url?: string): Promise<Response>;
}
export declare class XHRUploader extends AsyncUploader {
    upload(fetchPayload: IFetchPayload): Promise<Response>;
    private makeRequest;
}
