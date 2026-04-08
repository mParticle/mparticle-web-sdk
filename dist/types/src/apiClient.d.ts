import { BatchUploader } from './batchUploader';
import { SDKEvent, SDKDataPlan } from './sdkRuntimeModels';
import KitBlocker from './kitBlocking';
import { Dictionary } from './utils';
import { IUploadObject } from './serverModel';
import { MPForwarder } from './forwarders.interfaces';
import { IMParticleUser, ISDKUserAttributes } from './identity-user-interfaces';
import { AsyncUploader } from './uploaders';
import { IMParticleWebSDKInstance } from './mp-instance';
export interface IAPIClient {
    uploader: BatchUploader | null;
    queueEventForBatchUpload: (event: SDKEvent) => void;
    processQueuedEvents: () => void;
    appendUserInfoToEvents: (user: IMParticleUser, events: SDKEvent[]) => void;
    sendEventToServer: (event: SDKEvent, _options?: Dictionary<any>) => void;
    sendSingleEventToServer: (event: SDKEvent) => void;
    sendBatchForwardingStatsToServer: (forwardingStatsData: IForwardingStatsData, xhr: XMLHttpRequest) => void;
    initializeForwarderStatsUploader: () => AsyncUploader;
    prepareForwardingStats: (forwarder: MPForwarder, event: IUploadObject) => void;
}
export interface IForwardingStatsData {
    mid: number;
    esid: number;
    n: string;
    attrs: ISDKUserAttributes;
    sdk: string;
    dt: number;
    et: number;
    dbg: boolean;
    ct: number;
    eec: number;
    dp: SDKDataPlan;
}
export default function APIClient(this: IAPIClient, mpInstance: IMParticleWebSDKInstance, kitBlocker: KitBlocker): void;
