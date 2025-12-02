import { SDKLoggerApi } from './sdkRuntimeModels';
import {
    FetchUploader,
    XHRUploader,
    AsyncUploader,
    IFetchPayload
} from './uploaders';
import Audience from './audience';
import { ErrorCodes } from './logging/errorCodes';

export interface IAudienceMembershipsServerResponse {
    dt: 'cam';  // current audience memberships
    ct: number; // timestamp
    id: string;
    audience_memberships: Audience[];
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
        logger: SDKLoggerApi,
    ) {
        this.logger = logger;
        this.url = `https://${userAudienceUrl}${apiKey}/audience`;
        this.userAudienceAPI = window.fetch
            ? new FetchUploader(this.url)
            : new XHRUploader(this.url);
    }

    public async sendGetUserAudienceRequest(mpid: string, callback: (userAudiences: IAudienceMemberships) => void) {
        this.logger.verbose('Fetching user audiences from server');

        const fetchPayload: IFetchPayload = {
            method: 'GET',
            headers: {
                Accept: '*/*',
            },
        };
        const audienceURLWithMPID = `${this.url}?mpid=${mpid}`;

        try {
             const userAudiencePromise: Response = await this.userAudienceAPI.upload(
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
                    currentAudienceMemberships: userAudienceMembershipsServerResponse?.audience_memberships
                }

                try {
                    callback(parsedUserAudienceMemberships);
                } catch(e) {
                    throw new Error('Error invoking callback on user audience response.');
                }

            } else if (userAudiencePromise.status === 401) {
                throw new Error('`HTTP error status ${userAudiencePromise.status} while retrieving User Audiences - please verify your API key.`');
            } else if (userAudiencePromise.status === 403) {
                throw new Error('`HTTP error status ${userAudiencePromise.status} while retrieving User Audiences - please verify your workspace is enabled for audiences.`');
            } else {
                // In case there is an HTTP error we did not anticipate.
                throw new Error(
                    `Uncaught HTTP Error ${userAudiencePromise.status}.`
                );
            }
        } catch (e) {
            this.logger.error(
                `Error retrieving audiences. ${e}`,
                ErrorCodes.AUDIENCE_MANAGER_ERROR
            );
        }
    }
}