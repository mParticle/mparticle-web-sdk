import { SDKLoggerApi } from './sdkRuntimeModels';
import {
    FetchUploader,
    XHRUploader,
    AsyncUploader,
    fetchPayload
} from './batchUploader';
import Audience from './audience';

type AudienceResponseMessage = 'ar';
export interface IAudienceServerResponse {
    dt: AudienceResponseMessage;
    id: string;
    ct: number;
    m: IAudienceMembership[];
}
export interface IAudienceMembership {
    id: number; // AudienceId
    n: string; // External Name
    c: AudienceListMembershipUpdateType[]; // AudienceMembershipChanges
    s: string[]; // ModuleEndpointExternalReferenceKeys
}

export enum AudienceMembershipChangeAction {
    Unknown = 'unkown',
    Add = 'add',
    Drop = 'drop',
}

export interface AudienceListMembershipUpdateType {
    ct: number;
    a: AudienceMembershipChangeAction;
}

export interface IMPParsedAudienceMemberships {
    currentAudiences: Audience[];
    pastAudiences: Audience[];
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

    public async sendGetUserAudienceRequest(callback: (userAudiences: IMPParsedAudienceMemberships) => void) {
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

                const userAudienceResponse: IAudienceServerResponse = await userAudiencePromise.json();
                const parsedUserAudiences: IMPParsedAudienceMemberships = parseUserAudiences(userAudienceResponse)
                
                try {
                    callback(parsedUserAudiences);
                } catch(e) {
                    this.logger.error('Error invoking callback on user audience response.')
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

export const parseUserAudiences = (audienceServerResponse: IAudienceServerResponse): IMPParsedAudienceMemberships => {
    const currentAudiences: Audience[] = [];
    const pastAudiences: Audience[] = [];
    audienceServerResponse?.m?.forEach((membership: IAudienceMembership) => {
        if (membership.c[0].a === AudienceMembershipChangeAction.Add) {
            currentAudiences.push(new Audience(
                membership.id,
                membership.n
            ));
        };

        if (membership.c[0].a === AudienceMembershipChangeAction.Drop) {
            pastAudiences.push(new Audience(
                membership.id,
                membership.n
            ));
        };
    });

    return {
        currentAudiences, pastAudiences
    }
}