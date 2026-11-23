import mParticle from '../../src/mparticle-instance-manager';
import CookieConsentManager from '../../src/cookieConsentManager';
import { NO_TARGETING_ATTRIBUTE } from '../../src/constants';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import {
    onIdentityRequestSettled,
    resumeSuppressedIdentify,
} from '../../src/privacyTransitions';
import { DisabledVault, LocalStorageVault } from '../../src/vault';
import { deleteAllCookies } from './utils';

const apiKey = 'test_key';

// Each test uses its own workspace and instance so storage keys and window
// listeners from earlier SDK instances cannot affect it.
let testCount = 0;
let workspaceToken: string;
let storageName: string;
let instanceName: string;
let identityMethods: string[];
let originalFetch: typeof global.fetch;

const mpidFor = { identify: 'mpid-1', login: 'mpid-2', logout: 'mpid-3' };

function flush(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
}

async function settle(): Promise<void> {
    for (let i = 0; i < 5; i++) {
        await flush();
    }
}

function init(
    config: Record<string, unknown> = {},
    name: string = instanceName
): IMParticleWebSDKInstance {
    mParticle.init(
        apiKey,
        {
            requestConfig: false,
            workspaceToken,
            flags: { offlineStorage: '100' },
            ...config,
        } as any,
        name
    );
    return (mParticle.getInstance(name) as unknown) as IMParticleWebSDKInstance;
}

function consent(instance: IMParticleWebSDKInstance): CookieConsentManager {
    return instance._CookieConsentManager as CookieConsentManager;
}

function storedRecord(instance: IMParticleWebSDKInstance) {
    return instance._Persistence.getLocalStorage();
}

function userAttributes(instance: IMParticleWebSDKInstance) {
    return instance.Identity.getCurrentUser().getAllUserAttributes();
}

beforeEach(() => {
    testCount++;
    workspaceToken = `privacyWS${testCount}`;
    storageName = `mprtcl-v4_${workspaceToken}`;
    instanceName = `privacy-${testCount}`;
    identityMethods = [];
    localStorage.clear();
    sessionStorage.clear();
    deleteAllCookies();

    originalFetch = global.fetch;
    global.fetch = jest.fn(async (url: string) => {
        const match = /\/(identify|login|logout)(\?|$)/.exec(url);
        if (match) {
            identityMethods.push(match[1]);
            return {
                status: 200,
                headers: { get: (): null => null },
                json: async () => ({
                    mpid: mpidFor[match[1]],
                    context: null,
                    is_logged_in: match[1] === 'login',
                    matched_identities: {},
                }),
            };
        }
        if (/\/config\?/.test(url)) {
            return { status: 200, json: async () => ({}) };
        }
        return { ok: true, status: 202 };
    }) as unknown as typeof global.fetch;
});

afterEach(() => {
    global.fetch = originalFetch;
});

// How many event uploads carried the batch with this request id.
function uploadsOf(requestId: string): number {
    return (global.fetch as jest.Mock).mock.calls.filter(
        ([url, options]) =>
            /\/events$/.test(url) &&
            JSON.parse(options.body).source_request_id === requestId
    ).length;
}

// Holds every event upload of a first instance, then re-initializes it with
// the same workspace. Later uploads succeed. The returned function fails the
// held uploads and waits for them to finish.
async function startRetiredUpload(
    beforeReinit: (instance: IMParticleWebSDKInstance) => void = () => {}
) {
    const held: Array<() => void> = [];
    const heldIds: string[] = [];
    let holding = true;
    const respond = global.fetch;
    global.fetch = jest.fn((url: string, options?: { body: string }) => {
        if (holding && /\/events$/.test(url)) {
            heldIds.push(JSON.parse(options.body).source_request_id);
            return new Promise(resolve =>
                held.push(() => resolve({ status: 500 }))
            );
        }
        return (respond as any)(url, options);
    }) as unknown as typeof global.fetch;

    const instance = init();
    await settle();
    mParticle.getInstance(instanceName).logEvent('pending');
    const retired = instance._APIClient.uploader;
    await flush();
    expect(held.length).toBeGreaterThan(0);
    holding = false;

    beforeReinit(instance);
    init();
    await settle();
    expect(instance._APIClient.uploader).not.toBe(retired);

    return {
        instance,
        heldIds,
        failRetiredUploads: async () => {
            held.forEach(fail => fail());
            await settle();
        },
    };
}

describe('combined privacy flags', () => {
    it('notifies only when a combined flag changes, and a later false never undoes another source', () => {
        const manager = new CookieConsentManager({
            noFunctional: true,
            noTargeting: false,
        });
        const listener = jest.fn();
        manager.setChangeListener(listener);

        // Initialization already opts out of functional storage.
        manager.setPageFlags({ noFunctional: true });
        manager.setPageFlags({ noFunctional: false });
        expect(listener).not.toHaveBeenCalled();
        expect(manager.getNoFunctional()).toBe(true);

        manager.replaceDerivedFlags({ noTargeting: true });
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenLastCalledWith({
            noFunctional: true,
            noTargeting: false,
            doNotShareOrSell: false,
        });

        // The page source cannot lift the derived opt-out.
        manager.setPageFlags({ noTargeting: false });
        expect(listener).toHaveBeenCalledTimes(1);
        expect(manager.getNoTargeting()).toBe(true);

        manager.replaceDerivedFlags({});
        expect(listener).toHaveBeenCalledTimes(2);
        expect(manager.getNoTargeting()).toBe(false);
    });
});

describe('initialization without page or derived flags', () => {
    it('stores identity and session data as before', async () => {
        const instance = init();
        await settle();

        expect(identityMethods).toEqual(['identify']);
        expect(storedRecord(instance).cu).toBe('mpid-1');
        expect(instance._Identity.idCache).toBeInstanceOf(LocalStorageVault);
        expect(instance._timeOnSiteTimer['noFunctional']).toBe(false);
        expect(userAttributes(instance)).toEqual({});
    });

    it('keeps a stored identity when noFunctional is set at initialization', async () => {
        init();
        await settle();
        const recordBefore = localStorage.getItem(storageName);
        expect(recordBefore).not.toBeNull();

        const instance = init(
            { launcherOptions: { noFunctional: true } },
            `${instanceName}-reload`
        );
        await settle();

        expect(localStorage.getItem(storageName)).toBe(recordBefore);
        expect(instance.Identity.getCurrentUser().getMPID()).toBe('mpid-1');
        expect(identityMethods).toEqual(['identify']);
        expect(instance._Identity.idCache).toBeInstanceOf(DisabledVault);
    });

    it('counts noDeviceID as noFunctional for the time-on-site timer', async () => {
        const instance = init({ launcherOptions: { noDeviceID: true } });
        await settle();
        expect(instance._timeOnSiteTimer['noFunctional']).toBe(true);
    });

    it('writes time on site and ends timed-out sessions as before', async () => {
        const instance = init();
        await settle();

        instance._timeOnSiteTimer.totalTime = 500;
        instance._timeOnSiteTimer.updateTimeInPersistence();
        expect(localStorage.getItem(`mprtcl-tos-${workspaceToken}`)).toBe('500');

        const sessionId = instance._Store.sessionId;
        instance._Store.dateLastEventSent = new Date(Date.now() - 31 * 60000);
        instance._Persistence.update();
        instance._SessionManager.endSession();
        expect(instance._Store.sessionId).toBeNull();
        expect(sessionId).toBeTruthy();
    });

    it('sets $NoTargeting from initialization flags as before', async () => {
        const instance = init({ launcherOptions: { noTargeting: true } });
        await settle();
        expect(userAttributes(instance)[NO_TARGETING_ATTRIBUTE]).toBe(true);
    });
});

describe('mid-page noFunctional changes', () => {
    it('removes stored functional data, including storage chosen at initialization', async () => {
        const instance = init();
        await settle();
        localStorage.setItem(`${storageName}-batches`, JSON.stringify([{ source_request_id: 'stored' }]));
        localStorage.setItem(`${storageName}-id-cache`, '{}');
        localStorage.setItem(`mprtcl-tos-${workspaceToken}`, '1000');
        localStorage.setItem('unrelated', 'keep');

        consent(instance).setPageFlags({ noFunctional: true });

        expect(localStorage.getItem(storageName)).toBeNull();
        expect(localStorage.getItem(`${storageName}-id-cache`)).toBeNull();
        expect(localStorage.getItem(`${storageName}-batches`)).toBeNull();
        expect(sessionStorage.getItem(`${storageName}-events`)).toBeNull();
        expect(localStorage.getItem(`mprtcl-tos-${workspaceToken}`)).toBeNull();
        expect(localStorage.getItem('unrelated')).toBe('keep');
        expect(instance._Identity.idCache).toBeInstanceOf(DisabledVault);
        // The stored failed batch stays queued in memory for this page.
        expect(
            instance._APIClient.uploader['batchesQueuedForProcessing'].map(
                batch => batch.source_request_id
            )
        ).toContain('stored');

        // The current user is kept in memory and nothing is written again.
        mParticle.getInstance(instanceName).logEvent('after opt-out');
        instance._timeOnSiteTimer.getTimeInForeground();
        expect(instance.Identity.getCurrentUser().getMPID()).toBe('mpid-1');
        expect(localStorage.getItem(storageName)).toBeNull();
        expect(sessionStorage.getItem(`${storageName}-events`)).toBeNull();
        expect(localStorage.getItem(`mprtcl-tos-${workspaceToken}`)).toBeNull();
    });

    it('expires the persistence cookie when cookie storage is used', async () => {
        init({ useCookieStorage: true });
        await settle();
        expect(document.cookie).toContain(storageName);

        consent(mParticle.getInstance(instanceName) as any).setPageFlags({
            noFunctional: true,
        });

        expect(document.cookie).not.toContain(storageName);
    });

    it('keeps a logging opt-out across the cleanup and the next page load', async () => {
        const instance = init();
        await settle();
        mParticle.getInstance(instanceName).setOptOut(true);

        consent(instance).replaceDerivedFlags({ noFunctional: true });

        expect(storedRecord(instance)).toEqual({ gs: { ie: false } });

        const reloaded = init({}, `${instanceName}-reload`);
        await settle();
        expect(reloaded._Store.isEnabled).toBe(false);
    });

    it('keeps a consent decline across the cleanup and the next page load', async () => {
        const instance = init();
        await settle();
        const sdk = mParticle.getInstance(instanceName);
        const user = sdk.Identity.getCurrentUser();
        user.setUserAttribute('color', 'blue');
        const declined = sdk.Consent.createConsentState().addGDPRConsentState(
            'marketing',
            sdk.Consent.createGDPRConsent(false, 1)
        );
        user.setConsentState(declined);

        consent(instance).replaceDerivedFlags({ noFunctional: true });

        const record = storedRecord(instance);
        expect(Object.keys(record).sort()).toEqual(['cu', 'gs', 'mpid-1']);
        expect(Object.keys(record['mpid-1'])).toEqual(['con']);
        expect(user.getAllUserAttributes()).toEqual({ color: 'blue' });

        const reloaded = init({}, `${instanceName}-reload`);
        await settle();
        const gdpr = mParticle
            .getInstance(`${instanceName}-reload`)
            .Identity.getCurrentUser()
            .getConsentState()
            .getGDPRConsentState();
        expect(gdpr.marketing.Consented).toBe(false);
        expect(reloaded._Store.mpid).toBe('mpid-1');
    });

    it('keeps the user logged in after a login while the privacy choices are the only stored record', async () => {
        const instance = init();
        await settle();
        const sdk = mParticle.getInstance(instanceName);
        sdk.Identity.getCurrentUser().setConsentState(
            sdk.Consent.createConsentState().addGDPRConsentState(
                'marketing',
                sdk.Consent.createGDPRConsent(false, 1)
            )
        );
        sdk.setIntegrationAttribute(128, { client_id: 'abc' });
        const sessionStart = instance._Store.sessionStartDate;
        consent(instance).replaceDerivedFlags({ noFunctional: true });

        sdk.Identity.login({ userIdentities: { customerid: 'customer' } });
        await settle();

        expect(sdk.Identity.getCurrentUser().getMPID()).toBe(mpidFor.login);
        expect(sdk.Identity.getCurrentUser().isLoggedIn()).toBe(true);
        expect(sdk.getIntegrationAttributes(128)).toEqual({ client_id: 'abc' });
        expect(instance._Store.sessionStartDate).toBe(sessionStart);
    });

    it('removes what earlier pages stored once the configuration arrives under a restriction set while it loads', async () => {
        init();
        await settle();
        mParticle
            .getInstance(instanceName)
            .Identity.getCurrentUser()
            .setUserAttribute('color', 'blue');
        localStorage.setItem(`mprtcl-tos-${workspaceToken}`, '123');

        const respond = global.fetch;
        let releaseConfig: () => void;
        global.fetch = jest.fn((url: string, options?: unknown) =>
            /\/config\?/.test(url)
                ? new Promise(resolve => {
                      releaseConfig = () =>
                          resolve({ status: 200, json: async () => ({}) });
                  })
                : (respond as any)(url, options)
        ) as unknown as typeof global.fetch;
        const loading = init({ requestConfig: true });
        consent(loading).setPageFlags({ noFunctional: true });
        releaseConfig();
        await settle();

        expect(loading._Store.getUserAttributes(loading._Store.mpid)).toEqual({
            color: 'blue',
        });
        const stored = storedRecord(loading);
        expect(stored && stored[loading._Store.mpid] && stored[loading._Store.mpid].ua).toBeFalsy();
        expect(localStorage.getItem(`mprtcl-tos-${workspaceToken}`)).toBeNull();

        consent(loading).setPageFlags({});
        expect(storedRecord(loading)[loading._Store.mpid].ua).toEqual({
            color: 'blue',
        });
    });

    it('loads the stored user when noFunctional is set while configuration loads', async () => {
        const first = init();
        await settle();
        mParticle
            .getInstance(instanceName)
            .Identity.getCurrentUser()
            .setUserAttribute('color', 'blue');
        const identities = first._Store.getUserIdentities(first._Store.mpid);

        const respond = global.fetch;
        let releaseConfig: () => void;
        global.fetch = jest.fn((url: string, options?: unknown) =>
            /\/config\?/.test(url)
                ? new Promise(resolve => {
                      releaseConfig = () =>
                          resolve({ status: 200, json: async () => ({}) });
                  })
                : (respond as any)(url, options)
        ) as unknown as typeof global.fetch;
        const loading = init({ requestConfig: true });
        consent(loading).setPageFlags({ noFunctional: true });
        releaseConfig();
        await settle();

        expect(loading._Store.configurationLoaded).toBe(true);
        expect(loading._Store.getUserAttributes(loading._Store.mpid)).toEqual({
            color: 'blue',
        });
        expect(loading._Store.getUserIdentities(loading._Store.mpid)).toEqual(
            identities
        );
        consent(loading).setPageFlags({});
        const stored = storedRecord(loading)[loading._Store.mpid];
        expect(stored.ua).toEqual({ color: 'blue' });

        const reloaded = init({}, `${instanceName}-reload`);
        await settle();
        expect(reloaded._Store.getUserAttributes(reloaded._Store.mpid)).toEqual({
            color: 'blue',
        });
        expect(reloaded._Store.getUserIdentities(reloaded._Store.mpid)).toEqual(
            identities
        );
    });

    function answerModify(): void {
        const respond = global.fetch;
        global.fetch = jest.fn((url: string, options?: unknown) =>
            /\/modify$/.test(url)
                ? Promise.resolve({
                      status: 200,
                      headers: { get: (): null => null },
                      json: async () => ({ change_results: [] }),
                  })
                : (respond as any)(url, options)
        ) as unknown as typeof global.fetch;
    }

    function declineMarketing(sdk: any, consented: boolean) {
        return sdk.Consent.createConsentState().addGDPRConsentState(
            'marketing',
            sdk.Consent.createGDPRConsent(consented, 1)
        );
    }

    async function reloadedUser() {
        const name = `${instanceName}-reload`;
        const reloaded = init({}, name);
        await settle();
        return {
            store: reloaded._Store,
            user: mParticle.getInstance(name).Identity.getCurrentUser(),
        };
    }

    it('keeps untouched identities when one identity is modified while the privacy choices are the only stored record', async () => {
        answerModify();
        const instance = init();
        await settle();
        const sdk = mParticle.getInstance(instanceName);
        sdk.Identity.modify({
            userIdentities: { email: 'old@example.com', customerid: 'c1' },
        });
        await settle();
        sdk.Identity.getCurrentUser().setConsentState(
            declineMarketing(sdk, false)
        );
        consent(instance).replaceDerivedFlags({ noFunctional: true });

        sdk.Identity.modify({ userIdentities: { email: 'new@example.com' } });
        await settle();
        expect(sdk.Identity.getCurrentUser().getMPID()).toBe(mpidFor.identify);
        expect(
            sdk.Identity.getCurrentUser().getUserIdentities().userIdentities
        ).toEqual({ email: 'new@example.com', customerid: 'c1' });

        consent(instance).replaceDerivedFlags({});
        const { user } = await reloadedUser();
        expect(user.getUserIdentities().userIdentities).toEqual({
            email: 'new@example.com',
            customerid: 'c1',
        });
    });

    it('keeps existing identities on a login to the same user while the privacy choices are the only stored record', async () => {
        answerModify();
        const instance = init();
        await settle();
        const sdk = mParticle.getInstance(instanceName);
        sdk.Identity.modify({ userIdentities: { customerid: 'c1' } });
        await settle();
        sdk.Identity.getCurrentUser().setConsentState(
            declineMarketing(sdk, false)
        );
        consent(instance).replaceDerivedFlags({ noFunctional: true });

        const loginMPID = mpidFor.login;
        mpidFor.login = mpidFor.identify;
        try {
            sdk.Identity.login({ userIdentities: { email: 'a@example.com' } });
            await settle();
        } finally {
            mpidFor.login = loginMPID;
        }

        expect(
            sdk.Identity.getCurrentUser().getUserIdentities().userIdentities
        ).toEqual({ customerid: 'c1', email: 'a@example.com' });
    });

    it('keeps a consent decline made while the privacy choices are the only stored record', async () => {
        const instance = init();
        await settle();
        const sdk = mParticle.getInstance(instanceName);
        const user = sdk.Identity.getCurrentUser();
        user.setConsentState(declineMarketing(sdk, true));
        consent(instance).replaceDerivedFlags({ noFunctional: true });

        user.setConsentState(declineMarketing(sdk, false));

        const { user: reloaded } = await reloadedUser();
        expect(
            reloaded.getConsentState().getGDPRConsentState().marketing.Consented
        ).toBe(false);
    });

    it('drops the retained consent when it is removed while the privacy choices are the only stored record', async () => {
        const instance = init();
        await settle();
        const sdk = mParticle.getInstance(instanceName);
        const user = sdk.Identity.getCurrentUser();
        user.setConsentState(declineMarketing(sdk, false));
        consent(instance).replaceDerivedFlags({ noFunctional: true });

        user.setConsentState(null);

        expect(storedRecord(instance)).toBeNull();
        const { user: reloaded } = await reloadedUser();
        expect(reloaded.getConsentState()).toBeFalsy();
    });

    it('drops the departed user from the privacy choices after a logout or a switch to another user', async () => {
        const instance = init();
        await settle();
        const sdk = mParticle.getInstance(instanceName);
        sdk.Identity.getCurrentUser().setConsentState(
            declineMarketing(sdk, false)
        );
        consent(instance).replaceDerivedFlags({ noFunctional: true });

        sdk.Identity.logout();
        await settle();
        expect(sdk.Identity.getCurrentUser().getMPID()).toBe(mpidFor.logout);
        expect(storedRecord(instance)).toBeNull();

        sdk.Identity.getCurrentUser().setConsentState(
            declineMarketing(sdk, false)
        );
        expect(storedRecord(instance).cu).toBe(mpidFor.logout);

        sdk.Identity.login({ userIdentities: { customerid: 'c2' } });
        await settle();
        expect(sdk.Identity.getCurrentUser().getMPID()).toBe(mpidFor.login);
        expect(storedRecord(instance)).toBeNull();
    });

    it('removes user attributes and tags from memory while the privacy choices are the only stored record', async () => {
        const instance = init();
        await settle();
        const sdk = mParticle.getInstance(instanceName);
        const user = sdk.Identity.getCurrentUser();
        user.setUserAttribute('sensitive', 'secret');
        user.setUserAttribute('color', 'blue');
        user.setUserTag('vip');
        consent(instance).replaceDerivedFlags({ noFunctional: true });

        user.removeUserAttribute('sensitive');
        user.removeUserTag('vip');
        expect(user.getAllUserAttributes()).toEqual({ color: 'blue' });

        consent(instance).replaceDerivedFlags({});
        expect(user.getAllUserAttributes()).toEqual({ color: 'blue' });
        expect(storedRecord(instance)['mpid-1'].ua).toEqual({ color: 'blue' });

        init({}, `${instanceName}-reload`);
        await settle();
        expect(
            mParticle
                .getInstance(`${instanceName}-reload`)
                .Identity.getCurrentUser()
                .getAllUserAttributes()
        ).toEqual({ color: 'blue' });
    });

    it('removes all user attributes from memory while the privacy choices are the only stored record', async () => {
        const instance = init();
        await settle();
        const sdk = mParticle.getInstance(instanceName);
        const user = sdk.Identity.getCurrentUser();
        user.setUserAttribute('sensitive', 'secret');
        user.setUserAttributeList('list', ['a', 'b']);
        consent(instance).replaceDerivedFlags({ noFunctional: true });

        user.removeAllUserAttributes();
        expect(user.getAllUserAttributes()).toEqual({});

        consent(instance).replaceDerivedFlags({});
        expect(user.getAllUserAttributes()).toEqual({});
        expect(storedRecord(instance)['mpid-1'].ua || {}).toEqual({});
    });

    it('keeps first and last seen times, and alias time bounds, while the privacy choices are the only stored record', async () => {
        const instance = init();
        await settle();
        const sdk = mParticle.getInstance(instanceName);
        const firstSeen = sdk.Identity.getCurrentUser().getFirstSeenTime();
        expect(firstSeen).toBeGreaterThan(0);
        consent(instance).replaceDerivedFlags({ noFunctional: true });

        sdk.Identity.login({ userIdentities: { customerid: 'customer' } });
        await settle();

        const previous = sdk.Identity.getUser(mpidFor.identify);
        const current = sdk.Identity.getCurrentUser();
        expect(current.getMPID()).toBe(mpidFor.login);
        expect(previous.getFirstSeenTime()).toBe(firstSeen);
        expect(previous.getLastSeenTime()).toBeGreaterThan(0);
        expect(current.getFirstSeenTime()).toBeGreaterThan(0);

        const request = sdk.Identity.createAliasRequest(previous, current);
        expect(request.startTime).toBe(firstSeen);
        expect(request.endTime).toBe(previous.getLastSeenTime());
    });

    it('keeps memory authoritative when writing the full record back fails on lift', async () => {
        const instance = init();
        await settle();
        const sdk = mParticle.getInstance(instanceName);
        const user = sdk.Identity.getCurrentUser();
        user.setUserAttribute('color', 'blue');
        user.setConsentState(
            sdk.Consent.createConsentState().addGDPRConsentState(
                'marketing',
                sdk.Consent.createGDPRConsent(false, 1)
            )
        );
        const identities = user.getUserIdentities();
        consent(instance).replaceDerivedFlags({ noFunctional: true });

        const setItem = Storage.prototype.setItem;
        const failing = jest
            .spyOn(Storage.prototype, 'setItem')
            .mockImplementation(function(this: Storage, key: string, value: string) {
                if (key === storageName) {
                    throw new Error('QuotaExceededError');
                }
                return setItem.call(this, key, value);
            });
        consent(instance).replaceDerivedFlags({});
        failing.mockRestore();

        instance._Store.syncPersistenceData();
        expect(user.getAllUserAttributes()).toEqual({ color: 'blue' });
        expect(user.getUserIdentities()).toEqual(identities);

        consent(instance).replaceDerivedFlags({ noFunctional: true });
        consent(instance).replaceDerivedFlags({});
        expect(storedRecord(instance)['mpid-1'].ua).toEqual({ color: 'blue' });
        expect(user.getAllUserAttributes()).toEqual({ color: 'blue' });
    });

    async function restrictedUserWithConsent(): Promise<IMParticleWebSDKInstance> {
        const instance = init();
        await settle();
        const sdk = mParticle.getInstance(instanceName);
        const user = sdk.Identity.getCurrentUser();
        user.setUserAttribute('color', 'blue');
        user.setConsentState(
            sdk.Consent.createConsentState().addGDPRConsentState(
                'marketing',
                sdk.Consent.createGDPRConsent(false, 1)
            )
        );
        consent(instance).replaceDerivedFlags({ noFunctional: true });
        return instance;
    }

    function failWrites(predicate: (value: string) => boolean): jest.SpyInstance {
        const setItem = Storage.prototype.setItem;
        return jest
            .spyOn(Storage.prototype, 'setItem')
            .mockImplementation(function(this: Storage, key: string, value: string) {
                if (key === storageName && predicate(value)) {
                    throw new Error('QuotaExceededError');
                }
                return setItem.call(this, key, value);
            });
    }

    it('keeps memory authoritative when only the global fields can be written back on lift', async () => {
        const instance = await restrictedUserWithConsent();
        const user = mParticle.getInstance(instanceName).Identity.getCurrentUser();
        const decode = (value: string) =>
            String(instance._Persistence.decodePersistence(value));
        const failing = failWrites(value => decode(value).indexOf('blue') !== -1);

        consent(instance).replaceDerivedFlags({});
        failing.mockRestore();
        instance._Store.syncPersistenceData();

        expect(user.getAllUserAttributes()).toEqual({ color: 'blue' });
    });

    it('puts the full record back on a later write once storage recovers after a failed lift', async () => {
        const instance = await restrictedUserWithConsent();
        const failing = failWrites(() => true);
        consent(instance).replaceDerivedFlags({});
        failing.mockRestore();
        expect(instance._Persistence.getPersistence()).toBeNull();

        mParticle.getInstance(instanceName).logEvent('after recovery');

        expect(storedRecord(instance)['mpid-1'].ua).toEqual({ color: 'blue' });
        expect(instance._Persistence.getPersistence()).not.toBeNull();
    });

    it('ends a timed-out session while a failed write-back keeps the record purged', async () => {
        const instance = await restrictedUserWithConsent();
        const failing = failWrites(() => true);
        consent(instance).replaceDerivedFlags({});
        expect(instance._Store.sessionId).toBeTruthy();

        instance._Store.dateLastEventSent = new Date(Date.now() - 31 * 60000);
        instance._SessionManager.endSession();
        failing.mockRestore();

        expect(instance._Store.sessionId).toBeNull();
    });

    it('finishes restoring storage after the last attribute was removed while restricted', async () => {
        const instance = await restrictedUserWithConsent();
        mParticle
            .getInstance(instanceName)
            .Identity.getCurrentUser()
            .removeUserAttribute('color');

        consent(instance).replaceDerivedFlags({});

        expect(instance._Persistence.getPersistence()).not.toBeNull();
    });

    it('finishes restoring storage after consent was cleared while restricted', async () => {
        const instance = await restrictedUserWithConsent();
        mParticle
            .getInstance(instanceName)
            .Identity.getCurrentUser()
            .setConsentState(null);

        consent(instance).replaceDerivedFlags({});

        expect(instance._Persistence.getPersistence()).not.toBeNull();
    });

    it('rewrites the retained privacy choices only when they change', async () => {
        const instance = await restrictedUserWithConsent();
        const setItem = jest.spyOn(Storage.prototype, 'setItem');
        const sdk = mParticle.getInstance(instanceName);

        for (let i = 0; i < 20; i++) {
            sdk.logEvent(`restricted ${i}`);
        }
        const writes = () =>
            setItem.mock.calls.filter(([key]) => key === storageName).length;
        expect(writes()).toBe(0);

        sdk.Identity.getCurrentUser().setConsentState(
            sdk.Consent.createConsentState().addGDPRConsentState(
                'marketing',
                sdk.Consent.createGDPRConsent(true, 2)
            )
        );
        expect(writes()).toBe(1);
        setItem.mockRestore();
    });

    it('retries a retained privacy write that failed, so a reload sees the latest decision', async () => {
        const instance = init();
        await settle();
        const sdk = mParticle.getInstance(instanceName);
        const user = sdk.Identity.getCurrentUser();
        user.setConsentState(declineMarketing(sdk, true));
        consent(instance).replaceDerivedFlags({ noFunctional: true });

        const setItem = jest
            .spyOn(Storage.prototype, 'setItem')
            .mockImplementation(() => {
                throw new Error('storage unavailable');
            });
        user.setConsentState(declineMarketing(sdk, false));
        setItem.mockRestore();
        sdk.logEvent('after storage recovers');

        const { user: reloaded } = await reloadedUser();
        expect(
            reloaded.getConsentState().getGDPRConsentState().marketing.Consented
        ).toBe(false);
    });

    it('removes stored queues on restriction even when offline storage is off', async () => {
        const instance = init({ flags: { offlineStorage: '0' } });
        await settle();
        mParticle.getInstance(instanceName).logEvent('before');
        expect(instance._APIClient.uploader).toBeTruthy();
        localStorage.setItem(`${storageName}-batches`, 'stale');
        sessionStorage.setItem(`${storageName}-events`, 'stale');

        consent(instance).setPageFlags({ noFunctional: true });

        expect(localStorage.getItem(`${storageName}-batches`)).toBeNull();
        expect(sessionStorage.getItem(`${storageName}-events`)).toBeNull();
    });

    it('does not let a failing targeting sync escape the privacy setter', async () => {
        const instance = init();
        await settle();
        jest.spyOn(consent(instance), 'syncNoTargetingAttribute').mockImplementation(() => {
            throw new Error('forwarder failure');
        });

        expect(() =>
            consent(instance).setPageFlags({ noTargeting: true })
        ).not.toThrow();
        expect(consent(instance).getNoTargeting()).toBe(true);
    });

    for (const useCookieStorage of [false, true]) {
        it(`keeps only consent decisions in the retained record (${useCookieStorage ? 'cookie' : 'localStorage'})`, async () => {
            const instance = init({ useCookieStorage });
            await settle();
            const sdk = mParticle.getInstance(instanceName);
            sdk.Identity.getCurrentUser().setConsentState(
                sdk.Consent.createConsentState()
                    .addGDPRConsentState(
                        'marketing',
                        sdk.Consent.createGDPRConsent(false, 1, 'doc', 'place', 'device')
                    )
                    .setCCPAConsentState(
                        sdk.Consent.createCCPAConsent(true, 2, 'doc', 'place', 'device')
                    )
            );

            consent(instance).replaceDerivedFlags({ noFunctional: true });

            const stored = useCookieStorage
                ? instance._Persistence.getCookie()
                : storedRecord(instance);
            expect(stored['mpid-1'].con).toEqual({
                gdpr: { marketing: { c: false, ts: 1 } },
                ccpa: { data_sale_opt_out: { c: true, ts: 2 } },
            });

            const reloaded = init({ useCookieStorage }, `${instanceName}-reload`);
            await settle();
            expect(
                mParticle
                    .getInstance(`${instanceName}-reload`)
                    .Identity.getCurrentUser()
                    .getConsentState()
                    .getGDPRConsentState().marketing.Consented
            ).toBe(false);
            expect(reloaded._Store.mpid).toBe('mpid-1');
        });
    }

    it('switches storage back on when noFunctional is lifted', async () => {
        const instance = init();
        await settle();
        const manager = consent(instance);

        manager.setPageFlags({ noFunctional: true });
        manager.setPageFlags({});

        expect(instance._Identity.idCache).toBeInstanceOf(LocalStorageVault);
        expect(instance._Identity.idCache).not.toBeInstanceOf(DisabledVault);
        mParticle.getInstance(instanceName).logEvent('after opt-in');
        expect(storedRecord(instance).cu).toBe('mpid-1');
        expect(sessionStorage.getItem(`${storageName}-events`)).not.toBeNull();
        expect(identityMethods).toEqual(['identify']);
    });

    it('restores stored identities and user attributes for the next page load', async () => {
        const instance = init({
            identifyRequest: { userIdentities: { email: 'user@example.com' } },
        });
        await settle();
        mParticle
            .getInstance(instanceName)
            .Identity.getCurrentUser()
            .setUserAttribute('color', 'blue');
        const manager = consent(instance);

        manager.setPageFlags({ noFunctional: true });
        manager.setPageFlags({});
        mParticle.getInstance(instanceName).logEvent('after opt-in');

        const reloaded = init({}, `${instanceName}-reload`);
        const user = reloaded.Identity.getCurrentUser();
        expect(user.getMPID()).toBe('mpid-1');
        expect(user.getAllUserAttributes()).toEqual({ color: 'blue' });
        expect(user.getUserIdentities().userIdentities).toEqual({
            email: 'user@example.com',
        });
    });

    it('keeps a logging opt-out when storage is switched back on', async () => {
        const instance = init();
        await settle();
        mParticle.getInstance(instanceName).setOptOut(true);
        const manager = consent(instance);

        manager.setPageFlags({ noFunctional: true });
        manager.setPageFlags({});

        expect(storedRecord(instance).gs.ie).toBe(false);
        expect(storedRecord(instance).cu).toBe('mpid-1');
    });

    it('ends a timed-out session while storage is switched off', async () => {
        const instance = init();
        await settle();
        const sessionId = instance._Store.sessionId;
        expect(sessionId).toBeTruthy();

        consent(instance).setPageFlags({ noFunctional: true });
        instance._Store.dateLastEventSent = new Date(Date.now() - 31 * 60000);
        instance._SessionManager.endSession();

        expect(instance._Store.sessionId).toBeNull();

        mParticle.getInstance(instanceName).logEvent('after timeout');
        expect(instance._Store.sessionId).toBeTruthy();
        expect(instance._Store.sessionId).not.toBe(sessionId);
        expect(localStorage.getItem(storageName)).toBeNull();
    });

    it('ends a timed-out session when only a logging opt-out record is stored', async () => {
        const instance = init();
        await settle();
        const sdk = mParticle.getInstance(instanceName);
        sdk.setOptOut(true);
        consent(instance).setPageFlags({ noFunctional: true });
        expect(storedRecord(instance)).toEqual({ gs: { ie: false } });
        sdk.setOptOut(false);
        const sessionId = instance._Store.sessionId;
        expect(sessionId).toBeTruthy();
        expect(storedRecord(instance)).toBeNull();

        instance._Store.dateLastEventSent = new Date(Date.now() - 31 * 60000);
        instance._SessionManager.endSession();

        expect(instance._Store.sessionId).toBeNull();
        sdk.logEvent('after timeout');
        expect(instance._Store.sessionId).toBeTruthy();
        expect(instance._Store.sessionId).not.toBe(sessionId);
    });

    it('re-arms the session timer when no event was sent yet while storage is switched off', async () => {
        const instance = init();
        await settle();
        consent(instance).setPageFlags({ noFunctional: true });
        const sessionId = instance._Store.sessionId;
        instance._Store.dateLastEventSent = null;
        const rearm = jest.spyOn(instance._SessionManager, 'setSessionTimer');

        instance._SessionManager.endSession();

        expect(instance._Store.sessionId).toBe(sessionId);
        expect(rearm).toHaveBeenCalled();
    });

    it('keeps a session that has not timed out while storage is switched off', async () => {
        const instance = init();
        await settle();
        const sessionId = instance._Store.sessionId;

        consent(instance).setPageFlags({ noFunctional: true });
        instance._Store.dateLastEventSent = new Date();
        const setSessionTimer = jest.spyOn(instance._SessionManager, 'setSessionTimer');
        instance._SessionManager.endSession();

        expect(instance._Store.sessionId).toBe(sessionId);
        expect(setSessionTimer).toHaveBeenCalled();
    });

    it('does not store batches from an upload retired by re-initialization', async () => {
        const { instance, failRetiredUploads } = await startRetiredUpload();
        mParticle.getInstance(instanceName).logEvent('current');
        consent(instance).setPageFlags({ noFunctional: true });

        await failRetiredUploads();

        expect(localStorage.getItem(`${storageName}-batches`)).toBeNull();
        // The current uploader retries the batches from memory.
        expect(
            instance._APIClient.uploader.batchesQueuedForProcessing.length
        ).toBeGreaterThan(0);
    });

    it('hands batches to the current uploader when storage was switched off before retirement', async () => {
        const { instance, heldIds, failRetiredUploads } = await startRetiredUpload(
            before => consent(before).setPageFlags({ noFunctional: true })
        );
        consent(instance).setPageFlags({ noFunctional: true });
        mParticle.getInstance(instanceName).logEvent('current');

        await failRetiredUploads();
        await instance._APIClient.uploader.prepareAndUpload(false, false);
        await settle();

        expect(uploadsOf(heldIds[0])).toBe(2);
        expect(localStorage.getItem(`${storageName}-batches`)).toBeNull();
    });

    it('keeps batches from a retired upload until a delayed uploader is created', async () => {
        const sdk = () => mParticle.getInstance(instanceName) as any;
        const { instance, heldIds, failRetiredUploads } = await startRetiredUpload(
            () => sdk()._setIntegrationDelay(1, true)
        );
        consent(instance).setPageFlags({ noFunctional: true });
        expect(instance._APIClient.uploader).toBeNull();

        await failRetiredUploads();
        sdk()._setIntegrationDelay(1, false);
        await instance._APIClient.uploader.prepareAndUpload(false, false);
        await settle();

        expect(uploadsOf(heldIds[0])).toBe(2);
        expect(localStorage.getItem(`${storageName}-batches`)).toBeNull();
    });

    it('hands failed batches to the next uploader when re-initialization finds no upload in flight', async () => {
        const respond = global.fetch;
        let failUploads = true;
        global.fetch = jest.fn((url: string, options?: { body: string }) =>
            failUploads && /\/events$/.test(url)
                ? Promise.resolve({ status: 500 })
                : (respond as any)(url, options)
        ) as unknown as typeof global.fetch;

        const instance = init();
        await settle();
        consent(instance).setPageFlags({ noFunctional: true });
        mParticle.getInstance(instanceName).logEvent('failed');
        await settle();
        const [failed] = instance._APIClient.uploader.batchesQueuedForProcessing;
        expect(failed).toBeDefined();
        const failedAttempts = uploadsOf(failed.source_request_id);
        failUploads = false;

        init();
        await settle();
        consent(instance).setPageFlags({ noFunctional: true });
        mParticle.getInstance(instanceName).logEvent('current');
        await instance._APIClient.uploader.prepareAndUpload(false, false);
        await settle();

        expect(uploadsOf(failed.source_request_id)).toBe(failedAttempts + 1);
        expect(localStorage.getItem(`${storageName}-batches`)).toBeNull();
    });

    it('hands buffered events to the next uploader when re-initialization comes before they are batched', async () => {
        const batching = {
            flags: { offlineStorage: '100', eventBatchingIntervalMillis: '60000' },
        };
        const instance = init(batching);
        await settle();
        consent(instance).setPageFlags({ noFunctional: true });
        mParticle.getInstance(instanceName).logEvent('buffered');
        expect(
            instance._APIClient.uploader.eventsQueuedForProcessing.length
        ).toBeGreaterThan(0);

        init(batching);
        await settle();
        consent(instance).setPageFlags({ noFunctional: true });
        mParticle.getInstance(instanceName).logEvent('current');
        await instance._APIClient.uploader.prepareAndUpload(false, false);
        await settle();

        const uploadedNames = (global.fetch as jest.Mock).mock.calls
            .filter(([url]) => /\/events$/.test(url))
            .map(([, options]) => JSON.parse(options.body).events)
            .reduce((all, events) => all.concat(events), [])
            .map((event: { data: { event_name?: string } }) => event.data.event_name);
        expect(uploadedNames).toContain('buffered');
        expect(sessionStorage.getItem(`${storageName}-events`)).toBeNull();
    });

    it('does not store withheld batches or events after a re-initialization that does not re-apply the restriction', async () => {
        const respond = global.fetch;
        global.fetch = jest.fn((url: string, options?: { body: string }) =>
            /\/events$/.test(url)
                ? Promise.resolve({ status: 500 })
                : (respond as any)(url, options)
        ) as unknown as typeof global.fetch;
        const batching = {
            flags: { offlineStorage: '100', eventBatchingIntervalMillis: '60000' },
        };
        const instance = init(batching);
        await settle();
        consent(instance).setPageFlags({ noFunctional: true });
        mParticle.getInstance(instanceName).logEvent('withheld batch');
        await instance._APIClient.uploader.prepareAndUpload(false, false);
        await settle();
        const [withheld] = instance._APIClient.uploader.batchesQueuedForProcessing;
        expect(withheld).toBeDefined();
        mParticle.getInstance(instanceName).logEvent('withheld event');

        init(batching);
        await settle();
        mParticle.getInstance(instanceName).logEvent('current');
        expect(sessionStorage.getItem(`${storageName}-events`)).not.toContain(
            'withheld event'
        );
        await instance._APIClient.uploader.prepareAndUpload(false, false);
        await settle();

        const stored = localStorage.getItem(`${storageName}-batches`) ?? '';
        expect(stored).not.toContain(withheld.source_request_id);
        expect(stored).not.toContain('withheld event');
        expect(stored).toContain('current');
        expect(uploadsOf(withheld.source_request_id)).toBe(2);
    });

    it('stores failed batches again when noFunctional is lifted, so re-initialization still sends them', async () => {
        const respond = global.fetch;
        let failUploads = true;
        global.fetch = jest.fn((url: string, options?: { body: string }) =>
            failUploads && /\/events$/.test(url)
                ? Promise.resolve({ status: 500 })
                : (respond as any)(url, options)
        ) as unknown as typeof global.fetch;

        const instance = init();
        await settle();
        mParticle.getInstance(instanceName).logEvent('failed');
        await instance._APIClient.uploader.prepareAndUpload(false, false);
        await settle();
        const [failed] = JSON.parse(
            localStorage.getItem(`${storageName}-batches`)
        );
        expect(failed).toBeDefined();

        consent(instance).setPageFlags({ noFunctional: true });
        expect(
            localStorage.getItem(`${storageName}-batches`) ?? ''
        ).not.toContain(failed.source_request_id);
        consent(instance).setPageFlags({ noFunctional: false });
        expect(localStorage.getItem(`${storageName}-batches`)).toContain(
            failed.source_request_id
        );

        const failedAttempts = uploadsOf(failed.source_request_id);
        failUploads = false;
        init();
        await settle();
        await instance._APIClient.uploader.prepareAndUpload(false, false);
        await settle();

        expect(uploadsOf(failed.source_request_id)).toBe(failedAttempts + 1);
    });

    it('still stores batches from a retired upload when storage is allowed', async () => {
        const { instance, failRetiredUploads } = await startRetiredUpload();

        await failRetiredUploads();

        expect(
            JSON.parse(localStorage.getItem(`${storageName}-batches`)).length
        ).toBeGreaterThan(0);
    });

    it('resumes time-on-site writes after a restriction set while configuration loads is lifted', async () => {
        mParticle.init(
            apiKey,
            { requestConfig: true, workspaceToken } as any,
            instanceName
        );
        const instance = (mParticle.getInstance(instanceName) as unknown) as IMParticleWebSDKInstance;
        consent(instance).setPageFlags({ noFunctional: true });
        await settle();

        instance._timeOnSiteTimer.totalTime = 500;
        instance._timeOnSiteTimer.updateTimeInPersistence();
        expect(localStorage.getItem(`mprtcl-tos-${workspaceToken}`)).toBeNull();

        consent(instance).setPageFlags({});
        instance._timeOnSiteTimer.updateTimeInPersistence();
        expect(localStorage.getItem(`mprtcl-tos-${workspaceToken}`)).toBe('500');
    });

    // Re-initializes with a configuration request that never resolves.
    async function startLoadingReinit(): Promise<IMParticleWebSDKInstance> {
        init();
        await settle();
        mParticle.getInstance(instanceName).logEvent('before re-init');
        expect(sessionStorage.getItem(`${storageName}-events`)).not.toBeNull();

        const respond = global.fetch;
        global.fetch = jest.fn((url: string, options?: unknown) =>
            /\/config\?/.test(url)
                ? new Promise(() => {})
                : (respond as any)(url, options)
        ) as unknown as typeof global.fetch;
        const instance = init({ requestConfig: true });
        expect(instance._Store.configurationLoaded).toBe(false);
        return instance;
    }

    it('stops the previous uploader from writing while a re-initialization loads its configuration', async () => {
        const instance = await startLoadingReinit();
        consent(instance).setPageFlags({ noFunctional: true });

        window.dispatchEvent(new Event('pagehide'));
        await settle();

        expect(sessionStorage.getItem(`${storageName}-events`)).toBeNull();
        expect(localStorage.getItem(`${storageName}-batches`)).toBeNull();
    });

    it('lets the previous uploader write again when the restriction is lifted while configuration loads', async () => {
        const instance = await startLoadingReinit();
        consent(instance).setPageFlags({ noFunctional: true });
        consent(instance).setPageFlags({});

        window.dispatchEvent(new Event('pagehide'));
        await settle();

        expect(sessionStorage.getItem(`${storageName}-events`)).not.toBeNull();
    });

    it('keeps failed batches stored when noFunctional is switched on and off while a re-initialization loads its configuration', async () => {
        const respond = global.fetch;
        let failUploads = true;
        global.fetch = jest.fn((url: string, options?: { body: string }) =>
            failUploads && /\/events$/.test(url)
                ? Promise.resolve({ status: 500 })
                : (respond as any)(url, options)
        ) as unknown as typeof global.fetch;

        const first = init();
        await settle();
        mParticle.getInstance(instanceName).logEvent('failed');
        await first._APIClient.uploader.prepareAndUpload(false, false);
        await settle();
        const [failed] = JSON.parse(
            localStorage.getItem(`${storageName}-batches`)
        );
        expect(failed).toBeDefined();
        const failedAttempts = uploadsOf(failed.source_request_id);

        const uploading = global.fetch;
        global.fetch = jest.fn((url: string, options?: unknown) =>
            /\/config\?/.test(url)
                ? new Promise(() => {})
                : (uploading as any)(url, options)
        ) as unknown as typeof global.fetch;
        const loading = init({ requestConfig: true, flags: undefined });
        expect(loading._Store.configurationLoaded).toBe(false);
        consent(loading).setPageFlags({ noFunctional: true });
        consent(loading).setPageFlags({});

        expect(localStorage.getItem(`${storageName}-batches`)).toContain(
            failed.source_request_id
        );

        global.fetch = uploading;
        failUploads = false;
        const next = init();
        await settle();
        await next._APIClient.uploader.prepareAndUpload(false, false);
        await settle();

        expect(uploadsOf(failed.source_request_id)).toBe(failedAttempts + 1);
    });

    it('keeps storage off when noFunctional is lifted during a re-initialization and offline storage was off at creation', async () => {
        const instance = init({ flags: { offlineStorage: '0' } });
        await settle();
        instance._APIClient.uploader.destroy();
        instance._APIClient.uploader = null;
        consent(instance).setPageFlags({ noFunctional: true });
        mParticle.getInstance(instanceName).logEvent('restricted');
        const uploader = instance._APIClient.uploader;
        expect(uploader).not.toBeNull();

        const respond = global.fetch;
        global.fetch = jest.fn((url: string, options?: unknown) =>
            /\/config\?/.test(url)
                ? new Promise(() => {})
                : (respond as any)(url, options)
        ) as unknown as typeof global.fetch;
        const loading = init({ requestConfig: true, flags: undefined });
        consent(loading).setPageFlags({ noFunctional: true });
        consent(loading).setPageFlags({});
        uploader.queueEvent({ EventName: 'after lift' } as any);

        expect(sessionStorage.getItem(`${storageName}-events`)).toBeNull();
        expect(localStorage.getItem(`${storageName}-batches`)).toBeNull();
    });

    it('does not cache identities after removing the stored cache fails', async () => {
        const instance = init({
            flags: { offlineStorage: '100', cacheIdentity: 'True' },
        });
        await settle();
        const cacheKey = `${storageName}-id-cache`;
        expect(localStorage.getItem(cacheKey)).not.toBeNull();

        const removeItem = jest
            .spyOn(Storage.prototype, 'removeItem')
            .mockImplementation(() => {
                throw new Error('denied');
            });
        try {
            consent(instance).setPageFlags({ noFunctional: true });
        } finally {
            removeItem.mockRestore();
        }
        localStorage.removeItem(cacheKey);

        mParticle.getInstance(instanceName).Identity.login({
            userIdentities: { customerid: 'customer' },
        });
        await settle();

        expect(identityMethods).toContain('login');
        expect(localStorage.getItem(cacheKey)).toBeNull();
    });

    it('stays restricted while another source still opts out', async () => {
        const instance = init();
        await settle();
        const manager = consent(instance);

        manager.replaceDerivedFlags({ noFunctional: true });
        manager.setPageFlags({ noFunctional: false });
        mParticle.getInstance(instanceName).logEvent('still restricted');

        expect(localStorage.getItem(storageName)).toBeNull();
        expect(instance._Identity.idCache).toBeInstanceOf(DisabledVault);
    });

    it('runs a suppressed initial identify once noFunctional is lifted', async () => {
        const identityCallback = jest.fn();
        mParticle.init(
            apiKey,
            {
                requestConfig: true,
                workspaceToken,
                identityCallback,
            } as any,
            instanceName
        );
        const instance = (mParticle.getInstance(instanceName) as unknown) as IMParticleWebSDKInstance;
        // Set while the workspace configuration is still loading.
        consent(instance).setPageFlags({ noFunctional: true });
        await settle();

        expect(instance._Store.configurationLoaded).toBe(true);
        expect(identityMethods).toEqual([]);
        expect(identityCallback).not.toHaveBeenCalled();

        consent(instance).setPageFlags({});
        await settle();

        expect(identityMethods).toEqual(['identify']);
        expect(identityCallback).toHaveBeenCalledTimes(1);
        expect(instance.Identity.getCurrentUser().getMPID()).toBe('mpid-1');

        consent(instance).setPageFlags({ noFunctional: true });
        consent(instance).setPageFlags({});
        await settle();
        expect(identityMethods).toEqual(['identify']);
    });
});

describe('resuming a suppressed identify', () => {
    function stubInstance(): IMParticleWebSDKInstance {
        return ({
            _Store: {
                configurationLoaded: true,
                webviewBridgeEnabled: false,
                identifyCalled: false,
                mpid: null,
                identityCallInFlight: true,
                SDKConfig: {
                    identifyRequest: { userIdentities: {} },
                    identityCallback: jest.fn(),
                },
            },
            _Helpers: { canLog: () => true },
            _CookieConsentManager: new CookieConsentManager({
                noFunctional: false,
                noTargeting: false,
            }),
            Identity: { identify: jest.fn() },
        } as unknown) as IMParticleWebSDKInstance;
    }

    it('waits for an identity request in flight and keeps the callback', () => {
        const instance = stubInstance();
        const callback = instance._Store.SDKConfig.identityCallback;

        resumeSuppressedIdentify(instance);
        expect(instance.Identity.identify).not.toHaveBeenCalled();
        expect(instance._Store.SDKConfig.identityCallback).toBe(callback);

        instance._Store.identityCallInFlight = false;
        onIdentityRequestSettled(instance);
        expect(instance.Identity.identify).toHaveBeenCalledWith(
            { userIdentities: {} },
            callback
        );
        expect(instance._Store.identifyCalled).toBe(true);

        onIdentityRequestSettled(instance);
        expect(instance.Identity.identify).toHaveBeenCalledTimes(1);
    });

    it('does not run once the request in flight supplied an MPID', () => {
        const instance = stubInstance();
        resumeSuppressedIdentify(instance);
        instance._Store.identityCallInFlight = false;
        instance._Store.mpid = 'from-login';
        onIdentityRequestSettled(instance);
        expect(instance.Identity.identify).not.toHaveBeenCalled();
    });

    it('does not run in a web view bridge', () => {
        const instance = stubInstance();
        instance._Store.identityCallInFlight = false;
        instance._Store.webviewBridgeEnabled = true;
        resumeSuppressedIdentify(instance);
        expect(instance.Identity.identify).not.toHaveBeenCalled();
    });
});

describe('mid-page noTargeting changes', () => {
    it('syncs $NoTargeting on the current user immediately', async () => {
        const instance = init();
        await settle();
        const manager = consent(instance);

        manager.setPageFlags({ noTargeting: true });
        expect(userAttributes(instance)[NO_TARGETING_ATTRIBUTE]).toBe(true);

        manager.setPageFlags({});
        expect(userAttributes(instance)).not.toHaveProperty(NO_TARGETING_ATTRIBUTE);
    });

    it('keeps $NoTargeting while initialization still opts out', async () => {
        const instance = init({ launcherOptions: { noTargeting: true } });
        await settle();

        consent(instance).setPageFlags({ noTargeting: false });
        expect(userAttributes(instance)[NO_TARGETING_ATTRIBUTE]).toBe(true);
    });

    it('sets $NoTargeting on users after login and logout from the combined value', async () => {
        const instance = init();
        await settle();
        consent(instance).replaceDerivedFlags({ noTargeting: true });

        mParticle.getInstance(instanceName).Identity.login({
            userIdentities: { customerid: 'customer' },
        });
        await settle();
        expect(instance.Identity.getCurrentUser().getMPID()).toBe('mpid-2');
        expect(userAttributes(instance)[NO_TARGETING_ATTRIBUTE]).toBe(true);

        mParticle.getInstance(instanceName).Identity.logout({});
        await settle();
        expect(instance.Identity.getCurrentUser().getMPID()).toBe('mpid-3');
        expect(userAttributes(instance)[NO_TARGETING_ATTRIBUTE]).toBe(true);

        consent(instance).replaceDerivedFlags({});
        expect(userAttributes(instance)).not.toHaveProperty(NO_TARGETING_ATTRIBUTE);
    });

    it('removes $NoTargeting when noFunctional and noTargeting are lifted together', async () => {
        const instance = init();
        await settle();
        const manager = consent(instance);

        manager.setPageFlags({ noFunctional: true, noTargeting: true });
        expect(userAttributes(instance)[NO_TARGETING_ATTRIBUTE]).toBe(true);

        manager.setPageFlags({});
        expect(userAttributes(instance)).not.toHaveProperty(NO_TARGETING_ATTRIBUTE);

        mParticle.getInstance(instanceName).logEvent('after opt-in');
        expect(storedRecord(instance)['mpid-1'].ua || {}).not.toHaveProperty(
            NO_TARGETING_ATTRIBUTE
        );
    });

    it('removes $NoTargeting from memory when both are lifted and storage refuses writes', async () => {
        const instance = init();
        await settle();
        const manager = consent(instance);
        manager.setPageFlags({ noFunctional: true, noTargeting: true });

        const setItem = jest
            .spyOn(Storage.prototype, 'setItem')
            .mockImplementation(() => {
                throw new Error('denied');
            });
        try {
            manager.setPageFlags({});
        } finally {
            setItem.mockRestore();
        }
        expect(userAttributes(instance)).not.toHaveProperty(NO_TARGETING_ATTRIBUTE);

        instance.Identity.getCurrentUser().setUserAttribute('color', 'blue');
        expect(storedRecord(instance)['mpid-1'].ua).toEqual({ color: 'blue' });
    });

    it('removes $NoTargeting from memory while functional storage stays off', async () => {
        const instance = init();
        await settle();
        const manager = consent(instance);

        manager.setPageFlags({ noFunctional: true, noTargeting: true });
        expect(userAttributes(instance)[NO_TARGETING_ATTRIBUTE]).toBe(true);

        manager.setPageFlags({ noFunctional: true });
        expect(userAttributes(instance)).not.toHaveProperty(NO_TARGETING_ATTRIBUTE);
        expect(localStorage.getItem(storageName)).toBeNull();
    });
});
