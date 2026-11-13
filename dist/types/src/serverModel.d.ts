import { BaseEvent, SDKEvent } from './sdkRuntimeModels';
import { ServerSettings } from './store';
import { IMParticleUser } from './identity-user-interfaces';
import { IMParticleWebSDKInstance } from './mp-instance';
export interface IUploadObject extends SDKEvent {
    ClientGeneratedId: string;
    Store: ServerSettings;
    ExpandedEventCount: number;
    ProfileMessageType: number;
}
export interface IServerModel {
    createEventObject: (event: BaseEvent, user?: IMParticleUser) => SDKEvent;
}
export default function ServerModel(this: IServerModel, mpInstance: IMParticleWebSDKInstance): void;
