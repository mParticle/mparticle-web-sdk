import CookieConsentManager from '../../src/cookieConsentManager';
import Store, { IStore } from '../../src/store';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';
import Persistence from '../../src/persistence';
import { IPersistence } from '../../src/persistence.interfaces';
import { createCookieString, isObject } from '../../src/utils';
import Polyfill from '../../src/polyfill';

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
        // The Base64 encoder the SDK itself uses, so these fixtures are encoded
        // exactly the way `encodePersistence` would have written them.
        const b64 = (value: any): string =>
            Polyfill.Base64.encode(JSON.stringify(value));

        // Decode a persistence object through the real public entry point.
        // `decodePersistence` swallows its own errors and returns undefined, so
        // this also asserts nothing was logged: without that check, a fixture
        // that failed to decode at all would satisfy every "value is gone"
        // assertion below for the wrong reason.
        const decode = (value: object): any => {
            const decoded = persistence.decodePersistence(
                createCookieString(JSON.stringify(value))
            );
            expect(mockMPInstance.Logger.error).not.toHaveBeenCalled();
            expect(decoded).toBeTruthy();
            return JSON.parse(decoded as string);
        };

        // Note on what is load-bearing here, because it differs from the karma
        // integration tests for the same behaviour. At this boundary the guard
        // is the only thing that removes a malformed `csm`, so the absence
        // assertions below are discriminating for all three variants. In the
        // karma tests, which assert on the raw stored value after a round trip,
        // `isNonEmptyArrayOrObject` already drops a primitive `csm` on the next
        // update() regardless, so there the positive assertion is the
        // load-bearing one for the string and number variants. Both layers keep
        // a positive control, but for different reasons.
        it('should drop a csm that decodes to an object, and keep a well formed csm array', () => {
            const malformed = decode({
                gs: { csm: b64({ a: 1 }) },
                cu: 'mpid1',
                l: 0,
            });
            expect(malformed.gs).not.toHaveProperty('csm');

            const wellFormed = decode({
                gs: { csm: b64(['mpid1', 'mpid2']) },
                cu: 'mpid1',
                l: 0,
            });
            expect(wellFormed.gs.csm).toEqual(['mpid1', 'mpid2']);
        });

        it('should drop a csm that decodes to a string, and keep a well formed csm array', () => {
            const malformed = decode({
                gs: { csm: b64('notAnArray') },
                cu: 'mpid1',
                l: 0,
            });
            expect(malformed.gs).not.toHaveProperty('csm');

            const wellFormed = decode({
                gs: { csm: b64(['mpid1']) },
                cu: 'mpid1',
                l: 0,
            });
            expect(wellFormed.gs.csm).toEqual(['mpid1']);
        });

        it('should drop a csm that decodes to a number, and keep a well formed csm array', () => {
            const malformed = decode({
                gs: { csm: b64(1234567890123) },
                cu: 'mpid1',
                l: 0,
            });
            expect(malformed.gs).not.toHaveProperty('csm');

            const wellFormed = decode({
                gs: { csm: b64(['mpid1']) },
                cu: 'mpid1',
                l: 0,
            });
            expect(wellFormed.gs.csm).toEqual(['mpid1']);
        });

        it('should leave the other Base64 global settings fields alone', () => {
            // Only `csm` is shape checked. A sibling Base64 `gs` field must
            // still decode, so the guard cannot be passing by dropping
            // everything in `gs`.
            const decoded = decode({
                gs: {
                    csm: b64({ a: 1 }),
                    sa: b64({ sessionAttr: 'value' }),
                    ia: b64({ 128: { MCID: 'integration' } }),
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
                gs: { csm: b64(['mpid1']) },
                cu: 'mpid1',
                l: 0,
                mpid1: { ui: b64({ '1': 'customer-1' }) },
                nullRecord: null,
                stringRecord: 'not-a-record',
                numberRecord: 7,
                arrayRecord: ['not', 'a', 'record'],
            });

            expect(decoded).not.toHaveProperty('nullRecord');
            expect(decoded).not.toHaveProperty('stringRecord');
            expect(decoded).not.toHaveProperty('numberRecord');
            expect(decoded).not.toHaveProperty('arrayRecord');

            // Positive controls, in the same test: the well formed record still
            // decodes, and the reserved keys are still processed rather than
            // treated as malformed records.
            expect(decoded.mpid1.ui).toEqual({ '1': 'customer-1' });
            expect(decoded.cu).toEqual('mpid1');
            expect(decoded.l).toEqual(false);
            expect(decoded.gs.csm).toEqual(['mpid1']);
        });
    });

    describe('#findPrevCookiesBasedOnUI record shape guard', () => {
        // Scope of these two tests, stated up front because their fixtures are
        // deliberately synthetic.
        //
        // The guard here sits at the dereference site rather than at the decode
        // boundary, so it is only reachable with a persistence object that did
        // not come from `decodePersistence` - decoding now removes such a value
        // before this runs. The guard is kept so the assumption is enforced
        // where it is used, and that is what these tests pin down. Hence the
        // stubbed `getPersistence`.
        //
        // The candidates below are NOT well-formed persisted records, and are
        // not presented as such. Two ways they differ from what the SDK
        // actually writes:
        //   - `IUserPersistenceMinified` has no `mpid` field and nothing in
        //     persistence writes one, yet `findMpidForRequestedIdentity` looks
        //     for exactly that;
        //   - a persisted `ui` is keyed by numeric identity type, because
        //     `setUserIdentities` stores the by-type map, whereas these use
        //     name keys so the existing comparison in
        //     `cookieUiMatchesRequestedIdentity` resolves at all.
        // They are therefore *matcher-eligible* objects: the minimum shape that
        // reaches the code under test. What is being verified is the guard's
        // control flow - skip, keep searching, prefer the candidate that
        // qualifies - not the matcher's own key semantics, which are unchanged
        // here and tracked separately.
        const matcherEligibleCandidate = (mpid: string): any => ({
            mpid,
            ui: { customerid: 'match-me' },
        });

        beforeEach(() => {
            mockMPInstance._Persistence = persistence;
        });

        it('should skip a record that is not an object and still reach the matcher-eligible record after it', () => {
            const storedPersistence: any = {
                gs: {},
                cu: 'mpid1',
                l: 0,
                // Ordered first, so a guard that bailed out instead of
                // continuing would fail the control below.
                brokenRecord: null,
                mpid1: matcherEligibleCandidate('mpid1'),
            };

            jest.spyOn(persistence, 'getPersistence').mockReturnValue(
                storedPersistence
            );
            const storeDataInMemorySpy = jest
                .spyOn(persistence, 'storeDataInMemory')
                .mockImplementation(() => undefined);

            expect(() =>
                persistence.findPrevCookiesBasedOnUI({
                    userIdentities: { customerid: 'match-me' },
                })
            ).not.toThrow();

            // Control: the candidate after the broken one was still reached and
            // selected, so the guard skipped rather than ended the search.
            expect(storeDataInMemorySpy).toHaveBeenCalledWith(
                storedPersistence,
                'mpid1'
            );
        });

        it('should not select a candidate with no mpid, and still select the one that has it', () => {
            const storedPersistence: any = {
                gs: {},
                cu: 'mpid1',
                l: 0,
                // The qualifying candidate is deliberately FIRST and the
                // matching candidate with no `mpid` second. The loop keeps the
                // last match it finds, so if the `mpid` half of the guard is
                // removed the second one matches too and overwrites the first.
                // That makes the assertion below discriminating: it is not
                // merely a control, it is what fails when the guard goes.
                mpid1: matcherEligibleCandidate('mpid1'),
                // Same matching `ui`, but no `mpid`, so the guard must not
                // treat it as a candidate.
                noMpidCandidate: { ui: { customerid: 'match-me' } },
            };

            jest.spyOn(persistence, 'getPersistence').mockReturnValue(
                storedPersistence
            );
            const storeDataInMemorySpy = jest
                .spyOn(persistence, 'storeDataInMemory')
                .mockImplementation(() => undefined);

            persistence.findPrevCookiesBasedOnUI({
                userIdentities: { customerid: 'match-me' },
            });

            expect(storeDataInMemorySpy).toHaveBeenCalledWith(
                storedPersistence,
                'mpid1'
            );
            expect(storeDataInMemorySpy).not.toHaveBeenCalledWith(
                storedPersistence,
                'noMpidCandidate'
            );
        });
    });
});