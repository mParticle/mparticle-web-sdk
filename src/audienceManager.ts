import { SDKLoggerApi } from './sdkRuntimeModels';
import {
    FetchUploader,
    XHRUploader,
    AsyncUploader,
    fetchPayload
} from './uploaders';
import Audience from './audience';

export interface IAudienceMembershipsServerResponse {
    dt: 'cam';  // current audience memberships
    ct: number; // timestamp
    id: string;
    current_audience_memberships: Audience[];
}

export interface IAudienceMemberships {
    currentAudienceMemberships: Audience[];
}

export default class AudienceManager {
    public url: string = '';
    public userAudienceAPI: AsyncUploader;
    public logger: SDKLoggerApi;

    constructor(
        userAudienceUrl: string,
        apiKey: string,
        logger: SDKLoggerApi
    ) {
        this.logger = logger;
        this.url = `https://${userAudienceUrl}${apiKey}/audience?mpid=`;
        this.userAudienceAPI = window.fetch
            ? new FetchUploader(this.url)
            : new XHRUploader(this.url);
    }

    public async sendGetUserAudienceRequest(mpid: string, callback: (userAudiences: IAudienceMemberships) => void) {
        this.logger.verbose('Fetching user audiences from server');

        const fetchPayload: fetchPayload = {
            method: 'GET',
            headers: {
                Accept: '*/*',
            },
        };
        const audienceURLWithMPID = `${this.url}${mpid}`;
        let userAudiencePromise: Response;

        try {
             userAudiencePromise = await this.userAudienceAPI.upload(
                 fetchPayload,
                 audienceURLWithMPID
             );

            if (
                userAudiencePromise.status >= 200 &&
                userAudiencePromise.status < 300
            ) {
                this.logger.verbose(`User Audiences successfully received`);

                const userAudienceMembershipsServerResponse: IAudienceMembershipsServerResponse = await userAudiencePromise.json();
                const parsedUserAudienceMemberships: IAudienceMemberships = {
                    currentAudienceMemberships: userAudienceMembershipsServerResponse?.current_audience_memberships
                }

                try {
                    callback(parsedUserAudienceMemberships);
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