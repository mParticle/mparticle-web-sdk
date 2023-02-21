import { Context } from '@mparticle/event-models';
import { MPID, Product } from '@mparticle/web-sdk';
import {
    IntegrationAttributes,
    ServerSettings,
    SessionAttributes,
} from './store';

export interface IGlobalStoreV2DTO {
    sid: string; // Session ID
    ie: boolean; // Is Enabled
    // Session Attributes
    sa: SessionAttributes;
    ss: ServerSettings;
    dt: string; // Dev Token
    av: string; // App Version
    cgid: string; // Client Generated ID
    das: string; // Device ID/ Device Application String
    ia: IntegrationAttributes;
    c: Context;
    csm: MPID[]; // Current Session MPIDs
    les: number; // Last Event Sent Timestamp
    ssd: number; // Session Start Date
}

export interface IPersistenceV2DTO {
    cu: MPID; // Current User MPID
    gs: IGlobalStoreV2DTO;
    l: false; // IsLoggedIn
}

export interface IPersistence {
    useLocalStorage(): boolean;
    initializeStorage(): void;
    update(): void;
    storeProductsInMemory(products: Product[], mpid: MPID): void;
    storeDataInMemory(obj: IPersistenceV2DTO, currentMPID: MPID): void;
}
