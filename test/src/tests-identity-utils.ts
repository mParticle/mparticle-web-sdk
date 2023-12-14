import {
    cacheIdentityRequest,
    concatenateIdentities,
    shouldCallIdentity,
    createKnownIdentities,
    IKnownIdentities
} from "../../src/identity-utils";
import { LocalStorageVault } from "../../src/vault";
import { Dictionary } from "../../src/utils";
import { expect } from 'chai';
import sinon from 'sinon';

const DEVICE_ID = 'test-device-id'

describe('identity-utils', () => {
    const mpLocalStorageKey = 'mparticle-id-cache';
    beforeEach(()=> {
        window.localStorage.clear();
    });

    describe('#cacheIdentityRequest', () => {
        it('should save an identify request to local storage', () => {
            const mpIdCache = window.localStorage.getItem(mpLocalStorageKey);
            expect(mpIdCache).to.equal(null);
            
            const cacheVault = new LocalStorageVault<Dictionary>(mpLocalStorageKey);
            const knownIdentities: IKnownIdentities = createKnownIdentities({
                userIdentities: {customerid: 'id1}'}},
                DEVICE_ID
            );

            cacheIdentityRequest('identify', knownIdentities, 'testMpid', new Date().getTime(), cacheVault);
            
            const updatedMpIdCache = cacheVault.retrieve();

            expect(Object.keys(updatedMpIdCache).length).to.equal(1)
            const cachedKey = 'identify:device_application_stamp=test-das;';

            expect(updatedMpIdCache.hasOwnProperty(cachedKey)).to.equal(true);
            expect(updatedMpIdCache[cachedKey]).hasOwnProperty('mpid');
            expect(updatedMpIdCache[cachedKey]).hasOwnProperty('expireTimestamp');
        });

        it('should save an login request to local storage', () => {
            const mpIdCache = window.localStorage.getItem(mpLocalStorageKey);
            expect(mpIdCache).to.equal(null);
            
            const cacheVault = new LocalStorageVault<Dictionary>(mpLocalStorageKey);
            const knownIdentities: IKnownIdentities = createKnownIdentities({
                userIdentities: {customerid: 'id1}'}},
                DEVICE_ID
            );
            cacheIdentityRequest('login', knownIdentities, 'testMpid', new Date().getTime(), cacheVault);

            const updatedMpIdCache = cacheVault.retrieve();

            expect(Object.keys(updatedMpIdCache).length).to.equal(1);
            const cachedKey = 'login:device_application_stamp=test-das;';

            expect(updatedMpIdCache.hasOwnProperty(cachedKey)).to.equal(true);
            expect(updatedMpIdCache[cachedKey]).hasOwnProperty('mpid');
            expect(updatedMpIdCache[cachedKey]).hasOwnProperty('expireTimestamp');
        });
    });

    describe('#concatenateIdentities', () => {
        it('should return a concatenated user identity string based on the order of IdentityType enum', () => {
            const userIdentities: IKnownIdentities = {
                device_application_stamp: 'first',
                customerid: '01',
                email: '07',
                other: '00',
                other2: '10',
                other3: '11',
                other4: '12',
                other5: '13',
                other6: '14',
                other7: '15',
                other8: '16',
                other9: '17',
                other10: '18',
                mobile_number: '19',
                phone_number_2: '20',
                phone_number_3: '21',
                facebook: '02',
                facebookcustomaudienceid: '09',
                google: '04',
                twitter: '03',
                microsoft: '05',
                yahoo: '06',
            };

            const key: string = concatenateIdentities('identify', userIdentities);
            const expectedResult: string = 'identify:device_application_stamp=first;other=00;customerid=01;facebook=02;twitter=03;google=04;microsoft=05;yahoo=06;email=07;facebookcustomaudienceid=09;other2=10;other3=11;other4=12;other5=13;other6=14;other7=15;other8=16;other9=17;other10=18;mobile_number=19;phone_number_2=20;phone_number_3=21;';

            expect(key).to.equal(expectedResult);
        });
    });

    describe('#shouldCallIdentity', () => {
        let clock;

        beforeEach(() => {
            clock = sinon.useFakeTimers();
        });

        afterEach(() => {
            clock.restore();
        });

        const userIdentities = {
            device_application_stamp: 'first',
            customerid: '01',
            email: '07',
            other: '00',
            other2: '10',
            other3: '11',
            other4: '12',
            other5: '13',
            other6: '14',
            other7: '15',
            other8: '16',
            other9: '17',
            other10: '18',
            mobile_number: '19',
            phone_number_2: '20',
            phone_number_3: '21',
            facebook: '02',
            facebookcustomaudienceid: '09',
            google: '04',
            twitter: '03',
            microsoft: '05',
            yahoo: '06',
        };

        it('should return true if idCache is empty', () => {
            const mpIdCache = window.localStorage.getItem(mpLocalStorageKey);
            expect(mpIdCache).to.equal(null);
            
            const cacheVault = new LocalStorageVault<Dictionary>(mpLocalStorageKey);

            const result = shouldCallIdentity('identify', userIdentities, cacheVault);
            expect(result).to.equal(true);
        });

        it('should return false if idCache has the identity method and new identity call is within 1 day of previously cached identity call', () => {
            const mpIdCache = window.localStorage.getItem(mpLocalStorageKey);
            expect(mpIdCache).to.equal(null);

            const cacheVault = new LocalStorageVault<Dictionary>(mpLocalStorageKey);

            const result1 = shouldCallIdentity('identify', userIdentities, cacheVault);
            expect(result1).to.equal(true);

            const oneDayInMS = 86400 * 60 * 60 * 24;

            cacheIdentityRequest('identify', userIdentities, 'testMpid', new Date().getTime() + oneDayInMS, cacheVault);

            clock.tick(5000);
            const result2 = shouldCallIdentity('identify', userIdentities, cacheVault);
            expect(result2).to.equal(false);
        });

        it('should return true if idCache has the identity method and new identity call is beyond of 1 day of previously cached identity call', () => {
            const mpIdCache = window.localStorage.getItem(mpLocalStorageKey);
            expect(mpIdCache).to.equal(null);

            const cacheVault = new LocalStorageVault<Dictionary>(mpLocalStorageKey);

            const oneDayInMS = 86400 * 60 * 60 * 24;
            cacheIdentityRequest('identify', userIdentities, 'testMpid', new Date().getTime() + oneDayInMS, cacheVault);

            clock.tick(oneDayInMS +1);
            const result3 = shouldCallIdentity('identify', userIdentities, cacheVault);
            expect(result3).to.equal(true);
        });
    });
});
