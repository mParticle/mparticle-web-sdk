import { SDKLoggerApi } from './sdkRuntimeModels';
import { AsyncUploader } from './uploaders';
import Audience from './audience';
export interface IAudienceMembershipsServerResponse {
    dt: 'cam';
    ct: number;
    id: string;
    audience_memberships: Audience[];
}
export interface IAudienceMemberships {
    currentAudienceMemberships: Audience[];
}
export default class AudienceManager {
    url: string;
    userAudienceAPI: AsyncUploader;
    logger: SDKLoggerApi;
    constructor(userAudienceUrl: string, apiKey: string, logger: SDKLoggerApi);
    sendGetUserAudienceRequest(mpid: string, callback: (userAudiences: IAudienceMemberships) => void): Promise<void>;
}
