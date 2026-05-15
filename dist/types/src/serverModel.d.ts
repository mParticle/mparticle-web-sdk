import { BaseEvent, SDKEvent, SDKGeoLocation } from './sdkRuntimeModels';
import { Dictionary } from './utils';
import { ServerSettings } from './store';
import { MPID } from '@mparticle/web-sdk';
import { IConsentStateV2DTO, SDKConsentState } from './consent';
import { IMParticleUser, ISDKUserIdentity } from './identity-user-interfaces';
import { IMParticleWebSDKInstance } from './mp-instance';
export interface IServerV2DTO {
    id: string | number;
    nm: string | number;
    pr: number;
    qt: number;
    br: string | number;
    va: string | number;
    ca: string | number;
    ps: number;
    cc: string | number;
    attrs: Record<string, string> | null;
    dp_id?: string;
    dp_v?: number;
    n?: string;
    et?: number;
    ua?: Dictionary<string | string[]>;
    ui?: ISDKUserIdentity[];
    ia?: Dictionary<Dictionary<string>>;
    str?: ServerSettings;
    sdk?: string;
    sid?: string;
    sl?: number;
    ssd?: number;
    dt?: number;
    dbg?: boolean;
    ct?: number;
    lc?: SDKGeoLocation;
    o?: boolean;
    eec?: number;
    av?: string;
    cgid?: string;
    das?: string;
    mpid?: MPID;
    smpids?: MPID[];
    con?: IConsentStateV2DTO;
    fr?: boolean;
    iu?: boolean;
    at?: number;
    lr?: string;
    flags?: Dictionary<string[]>;
    cu?: string;
    sc?: {
        pl: IProductV2DTO[];
    };
    pd?: {
        an: number;
        cs: number;
        co: string;
        pl: IProductV2DTO[];
        ta: string;
        ti: string;
        tcc: string;
        tr: number;
        ts: number;
        tt: number;
    };
    pm?: {
        an: string;
        pl: IPromotionV2DTO[];
    };
    pi?: IProductImpressionV2DTO[];
    pet?: number;
}
export interface IProductV2DTO {
    id: string | number;
    nm: string | number;
    pr: number;
    qt: number;
    br: string | number;
    va: string | number;
    ca: string | number;
    ps: number;
    cc: string | number;
    tpa: number;
    attrs: Dictionary<string> | null;
}
export interface IPromotionV2DTO {
    id: string | number;
    nm: string | number;
    ps: string | number;
    cr: string;
}
export interface IProductImpressionV2DTO {
    pil: string;
    pl: IProductV2DTO[];
}
export interface IUploadObject extends SDKEvent {
    ClientGeneratedId: string;
    Store: ServerSettings;
    ExpandedEventCount: number;
    ProfileMessageType: number;
}
export interface IServerModel {
    convertEventToV2DTO: (event: IUploadObject) => IServerV2DTO;
    createEventObject: (event: BaseEvent, user?: IMParticleUser) => SDKEvent;
    convertToConsentStateV2DTO: (state: SDKConsentState) => IConsentStateV2DTO;
}
export default function ServerModel(this: IServerModel, mpInstance: IMParticleWebSDKInstance): void;
