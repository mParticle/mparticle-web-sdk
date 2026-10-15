import { IMParticleWebSDKInstance } from './mp-instance';
import { MPID } from '@mparticle/web-sdk';
import { Dictionary } from './utils';
import KitBlocker from './kitBlocking';
import { MPForwarder } from './forwarders.interfaces';
export interface IFilteredMparticleUser {
    getUserIdentities(): {
        userIdentities: Dictionary<string>;
    };
    getMPID(): MPID;
    getUserAttributesLists(forwarder: MPForwarder): Dictionary<string[]>;
    getAllUserAttributes(): Dictionary;
}
export default function filteredMparticleUser(mpid: MPID, forwarder: MPForwarder | {
    userAttributeFilters: number[];
}, mpInstance: IMParticleWebSDKInstance, kitBlocker?: KitBlocker): IFilteredMparticleUser;
