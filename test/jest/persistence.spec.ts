import CookieConsentManager from '../../src/cookieConsentManager';
import Store, { IStore } from '../../src/store';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';
import Persistence from '../../src/persistence';
import { IPersistence } from '../../src/persistence.interfaces';
import { createCookieString, isObject } from '../../src/utils';
import Polyfill from '../../src/polyfill';
import Consent from '../../src/consent';
import Helpers from '../../src/helpers';
import Identity from '../../src/identity';
import { IIdentity } from '../../src/identity.interfaces';

// Must stay an SDKv2NonMPIDCookieKeys name: decodeMpidRecords drops a non-object
// under any other key, so an MPID-shaped key here would make the writes below
// unreachable from storage.
const exemptRecordKey = 'currentUserMPID';

describe('Persistence', () => {
    let store: IStore;
    let mockMPInstance: IMParticleWebSDKInstance;
    let persistence: IPersistence;

    beforeEach(() => {
        store = {} as IStore;
        mockMPInstance = {
            _Helpers: {
                isObject,
            },
            _NativeSdkHelpers: {},
            _Store: store,
            Identity: {
                getCurrentUser: jest.fn().mockReturnValue({
                    getMPID: () => 'test-mpid',
                }),
            },
            Logger: {
                verbose: jest.fn(),
                error: jest.fn(),
                warning: jest.fn(),
            },
        } as unknown as IMParticleWebSDKInstance;

        Store.call(store, {} as SDKInitConfig, mockMPInstance, 'apikey');
        
        store.isLocalStorageAvailable = true;
        store.SDKConfig.useCookieStorage = true;
        store.webviewBridgeEnabled = false;

        persistence = new Persistence(mockMPInstance);
    });

    describe('#update', () => {
        it('should write to cookie and localStorage by default when useCookieStorage is true', () => {
            store.SDKConfig.useCookieStorage = true;

            jest.spyOn(persistence, 'getCookie').mockReturnValue(null);

            const setCookieSpy = jest.spyOn(persistence, 'setCookie');
            const setLocalStorageSpy = jest.spyOn(persistence, 'setLocalStorage');

            persistence.update();

            expect(setCookieSpy).toHaveBeenCalled();
            expect(setLocalStorageSpy).toHaveBeenCalled();
        });

        it('should write to localStorage by default when useCookieStorage is false', () => {
            store.SDKConfig.useCookieStorage = false;

            const setCookieSpy = jest.spyOn(persistence, 'setCookie');
            const setLocalStorageSpy = jest.spyOn(persistence, 'setLocalStorage');

            persistence.update();

            expect(setCookieSpy).not.toHaveBeenCalled();
            expect(setLocalStorageSpy).toHaveBeenCalled();
        });

        it('should NOT write to storage when webviewBridgeEnabled is true', () => {
            store.webviewBridgeEnabled = true;
            store.SDKConfig.useCookieStorage = true;

            const setCookieSpy = jest.spyOn(persistence, 'setCookie');
            const setLocalStorageSpy = jest.spyOn(persistence, 'setLocalStorage');

            persistence.update();

            expect(setCookieSpy).not.toHaveBeenCalled();
            expect(setLocalStorageSpy).not.toHaveBeenCalled();
        });
    });

    describe('noFunctional (block mprtcl-v4 cookies)', () => {
        it('should not write cookie when noFunctional is true', () => {
            mockMPInstance._CookieConsentManager = new CookieConsentManager({
                noFunctional: true,
                noTargeting: false,
            });
            persistence = new Persistence(mockMPInstance);

            const getCookieDomainSpy = jest.spyOn(persistence, 'getCookieDomain');
            persistence.setCookie();

            expect(getCookieDomainSpy).not.toHaveBeenCalled();
        });

        it('should write cookie when noFunctional is false', () => {
            mockMPInstance._CookieConsentManager = new CookieConsentManager({
                noFunctional: false,
                noTargeting: false,
            });
            persistence = new Persistence(mockMPInstance);

            jest.spyOn(persistence, 'getCookie').mockReturnValue(null);
            const setCookieSpy = jest.spyOn(persistence, 'setCookie');
            persistence.update();

            expect(setCookieSpy).toHaveBeenCalled();
        });
    });

    describe('#decodePersistence record shapes', () => {
        const encodeAsPersistedField = (value: any): string =>
            Polyfill.Base64.encode(JSON.stringify(value));

        // `decodePersistence` swallows its own errors and returns undefined, so
        // a fixture that failed to decode would satisfy every absence assertion.
        const decode = (value: object): any => {
            const decoded = persistence.decodePersistence(
                createCookieString(JSON.stringify(value))
            );
            expect(mockMPInstance.Logger.error).not.toHaveBeenCalled();
            expect(decoded).toBeTruthy();
            return JSON.parse(decoded as string);
        };

        it.each([
            { label: 'object', value: { a: 1 } },
            { label: 'string', value: 'notAnArray' },
            { label: 'number', value: 1234567890123 },
        ])('should drop a csm that decodes to a $label', ({ value }) => {
            const malformed = decode({
                gs: { csm: encodeAsPersistedField(value) },
                cu: 'mpid1',
                l: 0,
            });

            expect(malformed.gs).not.toHaveProperty('csm');
        });

        it('should keep a well formed csm array', () => {
            const wellFormed = decode({
                gs: { csm: encodeAsPersistedField(['mpid1', 'mpid2']) },
                cu: 'mpid1',
                l: 0,
            });

            expect(wellFormed.gs.csm).toEqual(['mpid1', 'mpid2']);
        });

        it('should leave the other Base64 global settings fields alone', () => {
            const decoded = decode({
                gs: {
                    csm: encodeAsPersistedField({ a: 1 }),
                    sa: encodeAsPersistedField({ sessionAttr: 'value' }),
                    ia: encodeAsPersistedField({ 128: { MCID: 'integration' } }),
                },
                cu: 'mpid1',
                l: 0,
            });

            expect(decoded.gs).not.toHaveProperty('csm');
            expect(decoded.gs.sa).toEqual({ sessionAttr: 'value' });
            expect(decoded.gs.ia).toEqual({ 128: { MCID: 'integration' } });
        });

        it('should drop top level records that are not objects, and keep a well formed record', () => {
            const decoded = decode({
                gs: { csm: encodeAsPersistedField(['mpid1']) },
                cu: 'mpid1',
                l: 0,
                mpid1: { ui: encodeAsPersistedField({ '1': 'customer-1' }) },
                nullRecord: null,
                stringRecord: 'not-a-record',
                numberRecord: 7,
                arrayRecord: ['not', 'a', 'record'],
            });

            expect(decoded).not.toHaveProperty('nullRecord');
            expect(decoded).not.toHaveProperty('stringRecord');
            expect(decoded).not.toHaveProperty('numberRecord');
            expect(decoded).not.toHaveProperty('arrayRecord');

            expect(decoded.mpid1.ui).toEqual({ '1': 'customer-1' });
            expect(decoded.cu).toEqual('mpid1');
            expect(decoded.l).toEqual(false);
            expect(decoded.gs.csm).toEqual(['mpid1']);
        });
    });

    describe('writes aimed at a stored record that is not an object', () => {
        let storedPersistence: any;
        let savePersistenceSpy: jest.SpyInstance;

        beforeEach(() => {
            storedPersistence = {
                gs: {},
                cu: exemptRecordKey,
                l: 0,
                [exemptRecordKey]: 'not-a-record',
                wellFormedMpid: {},
            };

            jest.spyOn(persistence, 'getPersistence').mockImplementation(
                () => storedPersistence
            );
            savePersistenceSpy = jest
                .spyOn(persistence, 'savePersistence')
                .mockImplementation((saved: any) => {
                    storedPersistence = saved;
                });
        });

        it('setFirstSeenTime should replace the record rather than write into it', () => {
            persistence.setFirstSeenTime(exemptRecordKey, 111);
            persistence.setFirstSeenTime('wellFormedMpid', 222);

            expect(
                storedPersistence[exemptRecordKey],
                'record that was not an object'
            ).toEqual({ fst: 111 });
            expect(
                storedPersistence.wellFormedMpid,
                'record that was already an object'
            ).toEqual({ fst: 222 });
        });

        it('setLastSeenTime should leave the record alone and still update a well formed one', () => {
            persistence.setLastSeenTime(exemptRecordKey, 111);

            expect(
                storedPersistence[exemptRecordKey],
                'record that was not an object'
            ).toEqual('not-a-record');
            expect(savePersistenceSpy).not.toHaveBeenCalled();

            persistence.setLastSeenTime('wellFormedMpid', 222);

            expect(
                storedPersistence.wellFormedMpid,
                'record that was already an object'
            ).toEqual({ lst: 222 });
            expect(savePersistenceSpy).toHaveBeenCalledTimes(1);
        });

        it('saveUserCookieSyncDatesToPersistence should replace the record rather than write into it', () => {
            persistence.saveUserCookieSyncDatesToPersistence(exemptRecordKey, {
                5: 111,
            });
            persistence.saveUserCookieSyncDatesToPersistence('wellFormedMpid', {
                5: 222,
            });

            expect(
                storedPersistence[exemptRecordKey],
                'record that was not an object'
            ).toEqual({ csd: { 5: 111 } });
            expect(
                storedPersistence.wellFormedMpid,
                'record that was already an object'
            ).toEqual({ csd: { 5: 222 } });
        });

        it('Store._setPersistence should replace the record rather than write into it', () => {
            mockMPInstance._Persistence = persistence;

            store.setUserAttributes(exemptRecordKey, { attr: 'value' });
            store.setUserAttributes('wellFormedMpid', { attr: 'value' });

            expect(
                store.persistenceData[exemptRecordKey],
                'record that was not an object'
            ).toEqual({ ua: { attr: 'value' } });
            expect(
                store.persistenceData.wellFormedMpid,
                'record that was already an object'
            ).toEqual({ ua: { attr: 'value' } });
            expect(store.getUserAttributes(exemptRecordKey)).toEqual({
                attr: 'value',
            });
        });

        it('Store.setConsentState should persist a consent state the record can be read back from', () => {
            mockMPInstance._Persistence = persistence;
            mockMPInstance._Consent = new Consent(mockMPInstance);

            const consented = mockMPInstance._Consent
                .createConsentState()
                .addGDPRConsentState(
                    'data_sale_opt_out',
                    mockMPInstance._Consent.createPrivacyConsent(true, 42)
                );

            store.setConsentState(exemptRecordKey, consented);
            store.setConsentState('wellFormedMpid', consented);

            expect(
                store.getConsentState(exemptRecordKey)?.getGDPRConsentState(),
                'record that was not an object'
            ).toHaveProperty('data_sale_opt_out');
            expect(
                store.getConsentState('wellFormedMpid')?.getGDPRConsentState(),
                'record that was already an object'
            ).toHaveProperty('data_sale_opt_out');
        });

        describe('through the user returned for that MPID', () => {
            let identity: IIdentity;

            beforeEach(() => {
                mockMPInstance._Helpers = new Helpers(mockMPInstance);
                mockMPInstance._Persistence = persistence;
                mockMPInstance._SessionManager = {
                    resetSessionTimer: jest.fn(),
                } as any;
                mockMPInstance._Forwarders = {
                    initForwarders: jest.fn(),
                    handleForwarderUserAttributes: jest.fn(),
                } as any;
                mockMPInstance._APIClient = {
                    prepareForwardingStats: jest.fn(),
                } as any;
                (store as any).mpid = exemptRecordKey;

                storedPersistence.wellFormedMpid = {
                    ua: { probeAttribute: 'probeValue' },
                };

                identity = new (Identity as any)(mockMPInstance) as IIdentity;
                jest.spyOn(
                    identity,
                    'sendUserAttributeChangeEvent'
                ).mockImplementation(() => undefined);
            });

            it('removeUserAttribute should not write into the record, and still remove from a well formed one', () => {
                identity
                    .mParticleUser(exemptRecordKey)
                    .removeUserAttribute('probeAttribute');

                expect(
                    storedPersistence[exemptRecordKey],
                    'record that was not an object'
                ).toEqual('not-a-record');
                expect(savePersistenceSpy).not.toHaveBeenCalled();

                identity
                    .mParticleUser('wellFormedMpid')
                    .removeUserAttribute('probeAttribute');

                expect(
                    storedPersistence.wellFormedMpid.ua,
                    'record that was already an object'
                ).toEqual({});
                expect(savePersistenceSpy).toHaveBeenCalledTimes(1);
            });
        });
    });
});
