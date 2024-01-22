import {
    cacheOrClearIdCache,
    cacheIdentityRequest,
    concatenateIdentities,
    hasValidCachedIdentity,
    createKnownIdentities,
    removeExpiredIdentityCacheDates,
    IKnownIdentities,
    ICachedIdentityCall
} from "../../src/identity-utils";
import { LocalStorageVault } from "../../src/vault";
import { Dictionary } from "../../src/utils";
import { expect } from 'chai';
import { 
    MILLISECONDS_IN_ONE_DAY,
    MILLISECONDS_IN_ONE_DAY_PLUS_ONE_SECOND,
    testMPID,
    localStorageIDKey
} from './config/constants';
import Constants from '../../src/constants';
const { Identify, Modify, Login, Logout } = Constants.IdentityMethods;

import sinon from 'sinon';

const DEVICE_ID = 'test-device-id'

const knownIdentities: IKnownIdentities = createKnownIdentities({
    userIdentities: {customerid: 'id1'}},
    DEVICE_ID
);

const cacheVault = new LocalStorageVault<Dictionary>(localStorageIDKey);

const identifyResponse = {
    context: null,
    matched_identities: {
        device_application_stamp: "test-das"
    },
    is_ephemeral: false,
    mpid: testMPID,
    is_logged_in: false
};

const jsonString = JSON.stringify(identifyResponse);

const xhr: XMLHttpRequest = {
    status: 200,
    responseText: jsonString,
    getAllResponseHeaders: ()=> {return 'x-mp-max-age: 1'},
    getResponseHeader: (name: string) => {
        return '1';
    },
} as XMLHttpRequest;

describe('identity-utils', () => {
    beforeEach(()=> {
        window.localStorage.clear();
    });

    describe('#cacheOrClearIdCache', () => {
        afterEach(()=>{
            sinon.restore();
        });

        it('should cache if method is identify', () => {
            const retrieveSpy = sinon.spy(cacheVault, 'retrieve');
            const storeSpy = sinon.spy(cacheVault, 'store');
            const purgeSpy = sinon.spy(cacheVault, 'purge');

            cacheOrClearIdCache(
                Identify,
                knownIdentities,
                cacheVault,
                xhr
            );

            expect(retrieveSpy.called).to.eq(true);
            expect(storeSpy.called).to.eq(true);
            expect(purgeSpy.called).to.eq(false);
        });

        it('should cache if method is login', () => {
            const retrieveSpy = sinon.spy(cacheVault, 'retrieve');
            const storeSpy = sinon.spy(cacheVault, 'store');
            const purgeSpy = sinon.spy(cacheVault, 'purge');

            cacheOrClearIdCache(
                Login,
                knownIdentities,
                cacheVault,
                xhr
            );

            expect(retrieveSpy.called).to.eq(true);
            expect(storeSpy.called).to.eq(true);
            expect(purgeSpy.called).to.eq(false);
        });

        it('should clear cache if method is logout', () => {
            const retrieveSpy = sinon.spy(cacheVault, 'retrieve');
            const storeSpy = sinon.spy(cacheVault, 'store');
            const purgeSpy = sinon.spy(cacheVault, 'purge');
            
            cacheOrClearIdCache(
                Logout,
                knownIdentities,
                cacheVault,
                xhr
            );
                
            expect(retrieveSpy.called).to.eq(false);
            expect(storeSpy.called).to.eq(false);
            expect(purgeSpy.called).to.eq(true);
        });
    });

    describe('#cacheIdentityRequest', () => {
        it('should save an identify request to local storage', () => {
            const mpIdCache = window.localStorage.getItem(localStorageIDKey);
            expect(mpIdCache).to.equal(null);

            const currentTime = new Date().getTime();

            cacheIdentityRequest(
                Identify,
                knownIdentities,
                currentTime,
                cacheVault,
                xhr
            );

            const updatedMpIdCache = cacheVault.retrieve();

            expect(Object.keys(updatedMpIdCache!).length).to.equal(1);
            const cachedKey =
                'identify:device_application_stamp=test-device-id;customerid=id1;';

            expect(updatedMpIdCache!.hasOwnProperty(cachedKey)).to.equal(true);

            const cachedIdentityCall: ICachedIdentityCall = updatedMpIdCache![cachedKey];

            expect(cachedIdentityCall).hasOwnProperty('responseText');
            expect(cachedIdentityCall).hasOwnProperty('status');
            expect(cachedIdentityCall).hasOwnProperty('expireTimestamp');

            expect(cachedIdentityCall.status).to.equal(200);
            expect(cachedIdentityCall.expireTimestamp).to.equal(currentTime);

            const responseText = JSON.parse(cachedIdentityCall.responseText);
            expect(responseText).to.deep.equal(identifyResponse);
        });

        it('should save a login request to local storage', () => {
            const mpIdCache = window.localStorage.getItem(localStorageIDKey);
            expect(mpIdCache).to.equal(null);
            
            const loginResponse = {
                ...identifyResponse,
                is_logged_in: true,
            };
            

            const jsonString = JSON.stringify(loginResponse);

            const xhr: XMLHttpRequest = {
                status: 200,
                responseText: jsonString,
            } as XMLHttpRequest;

            const currentTime = new Date().getTime();

            cacheIdentityRequest(
                Login,
                knownIdentities,
                currentTime,
                cacheVault,
                xhr
            );

            const updatedMpIdCache = cacheVault.retrieve();

            expect(Object.keys(updatedMpIdCache!).length).to.equal(1);
            const cachedKey = 'login:device_application_stamp=test-device-id;customerid=id1;';
            expect(updatedMpIdCache!.hasOwnProperty(cachedKey)).to.equal(true);

            const cachedLoginCall: ICachedIdentityCall = updatedMpIdCache![
                cachedKey
            ];

            expect(cachedLoginCall).hasOwnProperty('responseText');
            expect(cachedLoginCall).hasOwnProperty('status');
            expect(cachedLoginCall).hasOwnProperty('expireTimestamp');

            expect(cachedLoginCall.status).to.equal(200);
            expect(cachedLoginCall.expireTimestamp).to.equal(currentTime);

            const responseText = JSON.parse(cachedLoginCall.responseText);
            expect(responseText).to.deep.equal(loginResponse);
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

    describe('#hasValidCachedIdentity', () => {
        let clock;

        beforeEach(() => {
            clock = sinon.useFakeTimers();
        });

        afterEach(() => {
            clock.restore();
        });

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

        it('should return false if idCache is empty', () => {
            const mpIdCache = window.localStorage.getItem(localStorageIDKey);
            expect(mpIdCache).to.equal(null);
            
            const cacheVault = new LocalStorageVault<Dictionary>(localStorageIDKey);

            const result = hasValidCachedIdentity('identify', userIdentities, cacheVault);
            expect(result).to.equal(false);
        });

        it('should return true if idCache has the identity method and new identity call is within 1 day of previously cached identity call', () => {
            const mpIdCache = window.localStorage.getItem(localStorageIDKey);
            expect(mpIdCache).to.equal(null);

            const cacheVault = new LocalStorageVault<Dictionary>(localStorageIDKey);

            // check to ensure there is nothing on the cache first
            const result1 = hasValidCachedIdentity('identify', userIdentities, cacheVault);
            expect(result1).to.equal(false);

            const oneDayInMS = 86400 * 60 * 60 * 24;

            const expireTime = new Date().getTime() + oneDayInMS;

            cacheIdentityRequest(
                Identify,
                userIdentities,
                expireTime,
                cacheVault,
                xhr
            );

            // tick forward less than oneDayInMS
            clock.tick(5000);
            const result2 = hasValidCachedIdentity('identify', userIdentities, cacheVault);
            expect(result2).to.equal(true);
        });

        it('should return true if idCache has the identity method and new identity call is beyond of 1 day of previously cached identity call', () => {
            const mpIdCache = window.localStorage.getItem(localStorageIDKey);
            expect(mpIdCache).to.equal(null);

            const oneDayInMS = 86400 * 60 * 60 * 24;

            const expireTime = new Date().getTime() + oneDayInMS;

            cacheIdentityRequest(
                Identify,
                userIdentities,
                expireTime,
                cacheVault,
                xhr
            );

            clock.tick(oneDayInMS +1);
            const result3 = hasValidCachedIdentity('identify', userIdentities, cacheVault);
            expect(result3).to.equal(false);
        });
    });

    describe('#createKnownIdentities', () => {
        it('should return an object whose keys are each identity type passed to it from the userIdentities object, in addition to device_application_stamp', () => {
            const identities = {
                userIdentities: {
                    other: 'other',
                    customerid: 'customerid',
                    facebook: 'facebook',
                    twitter: 'twitter',
                    google: 'google',
                    microsoft: 'microsoft',
                    yahoo: 'yahoo',
                    email: 'email',
                    facebookcustomaudienceid: 'facebookcustomaudienceid',
                    other2: 'other2',
                    other3: 'other3',
                    other4: 'other4',
                    other5: 'other5',
                    other6: 'other6',
                    other7: 'other7',
                    other8: 'other8',
                    other9: 'other9',
                    other10: 'other10',
                    mobile_number: 'mobile_number',
                    phone_number_2: 'phone_number_2',
                    phone_number_3: 'phone_number_3',
                }};
            
            const knownIdentities: IKnownIdentities = createKnownIdentities(
                identities,
                DEVICE_ID
            );
    
            const expectedResult: IKnownIdentities = {
                ...identities.userIdentities,
                device_application_stamp: DEVICE_ID,
            };
    
            expect(knownIdentities).to.deep.equal(expectedResult);
        });
    });

    describe('#removeExpiredIdentityCacheDates', () => {
        it('remove any timestamps that are expired, and keep any timestamps that are not expired', () => {
            // set up clock in order to force some time stamps to expire later in the test
            const clock = sinon.useFakeTimers();

            const cacheVault = new LocalStorageVault<Dictionary>(localStorageIDKey);
            const knownIdentities1: IKnownIdentities = createKnownIdentities({
                userIdentities: {customerid: 'id1'}},
                DEVICE_ID
            );
            const knownIdentities2: IKnownIdentities = createKnownIdentities({
                userIdentities: {customerid: 'id2'}},
                DEVICE_ID
            );

            const identifyResponse = {
                context: null,
                matched_identities: {
                    device_application_stamp: "test-das"
                },
                is_ephemeral: false,
                mpid: testMPID,
                is_logged_in: false
            };

            const xhr: XMLHttpRequest = {
                status: 200,
                responseText: JSON.stringify(identifyResponse),
            } as XMLHttpRequest;

            // Cache 1st identity response to expire in 1 day
            cacheIdentityRequest(
                'identify',
                knownIdentities1,
                MILLISECONDS_IN_ONE_DAY,
                cacheVault,
                xhr
            );

            // Cache 2nd identity response to expire in 1 day + 100ms
            cacheIdentityRequest(
                'identify',
                knownIdentities2,
                MILLISECONDS_IN_ONE_DAY + 100,
                cacheVault,
                xhr
            );

            const updatedMpIdCache = cacheVault.retrieve();

            const knownIdentities1CachedKey =
                'identify:device_application_stamp=test-device-id;customerid=id1;';
            const knownIdentities2CachedKey =
                'identify:device_application_stamp=test-device-id;customerid=id2;';


            // both known identities cache keys should exist on the cacheVault
            expect(updatedMpIdCache!.hasOwnProperty(knownIdentities1CachedKey)).to.equal(true);
            expect(updatedMpIdCache!.hasOwnProperty(knownIdentities2CachedKey)).to.equal(true);

            // we do not tick the clock forward at all, so the expiration date should not yet be reached
            // meaning both cached keys are still in the cache vault
            removeExpiredIdentityCacheDates(cacheVault);
            const updatedMpIdCache2 = cacheVault.retrieve();
            expect(updatedMpIdCache2!.hasOwnProperty(knownIdentities1CachedKey)).to.equal(true);
            expect(updatedMpIdCache2!.hasOwnProperty(knownIdentities2CachedKey)).to.equal(true);

            // tick the clock forward 1 day + 1 ms, expiring knownIdentities1CachedKey but not knownIdentities2CachedKey
            clock.tick(MILLISECONDS_IN_ONE_DAY_PLUS_ONE_SECOND);

            removeExpiredIdentityCacheDates(cacheVault);
            const updatedMpIdCache3 = cacheVault.retrieve();

            expect(updatedMpIdCache3!.hasOwnProperty(knownIdentities1CachedKey)).to.equal(false);
            expect(updatedMpIdCache3!.hasOwnProperty(knownIdentities2CachedKey)).to.equal(true);

            clock.restore();
        });
    });
});