import { SDKLoggerApi } from './sdkRuntimeModels';
import {
    FetchUploader,
    XHRUploader,
    AsyncUploader,
    fetchPayload
} from './uploaders';
import Audience from './audience';

export interface IAudienceMemberships {
    audience_memberships: Audience[];
}

export default class AudienceManager {
    public url: string = '';
    public userAudienceAPI: AsyncUploader;
    public logger: SDKLoggerApi;

    constructor(
        userAudienceUrl: string,
        apiKey: string,
        logger: SDKLoggerApi,
        mpid: string
    ) {
        this.logger = logger;
        this.url = `https://${userAudienceUrl}${apiKey}/audience?mpid=${mpid}`;
        this.userAudienceAPI = window.fetch
            ? new FetchUploader(this.url)
            : new XHRUploader(this.url);
    }

    public async sendGetUserAudienceRequest(callback: (userAudiences: IAudienceMemberships) => void) {
        this.logger.verbose('Fetching user audiences from server');

        const fetchPayload: fetchPayload = {
            method: 'GET',
            headers: {
                Accept: '*/*',
            },
        };
        let userAudiencePromise: Response;

        try {
             userAudiencePromise = await this.userAudienceAPI.upload(
                fetchPayload
            );

            if (
                userAudiencePromise.status >= 200 &&
                userAudiencePromise.status < 300
            ) {
                this.logger.verbose(`User Audiences successfully received`);

                const userAudienceMemberships: IAudienceMemberships = await userAudiencePromise.json();
                
                try {
                    callback(userAudienceMemberships);
                } catch(e) {
                    this.logger.error('Error invoking callback on IAudienceMemberships.');
                }

            } else if (userAudiencePromise.status === 401) {
                this.logger.error(
                    `HTTP error status ${userAudiencePromise.status} while retrieving User Audiences - please verify your API key.`
                );
            } else if (userAudiencePromise.status === 403) {
                this.logger.error(
                    `HTTP error status ${userAudiencePromise.status} while retrieving User Audiences - please verify your workspace is enabled for audiences.`
                );
            } else {
                // In case there is an HTTP error we did not anticipate.
                console.error(
                    `HTTP error status ${userAudiencePromise.status} while uploading events.`,
                    userAudiencePromise
                );

                throw new Error(
                    `Uncaught HTTP Error ${userAudiencePromise.status}.`
                );
            }
        } catch (e) {
            this.logger.error(
                `Error retrieving audiences. ${e}`
            );
        }
    }
}