import { ICookieConsentFlags } from './cookieConsentManager';
import { NO_TARGETING_ATTRIBUTE } from './constants';
import { isNoFunctionalWithoutId } from './identity-utils';
import { IMParticleWebSDKInstance } from './mp-instance';
import { Dictionary, hasOwnProp } from './utils';
import { DisabledVault, LocalStorageVault, SessionStorageVault } from './vault';

// Stores whose suppressed initial identify waits for another identity request
// to finish. Keyed by Store so a re-initialization drops the pending retry.
const pendingIdentifyStores = new WeakMap<object, boolean>();

// Stores whose functional storage a page or derived flag switched off. An
// initialization restriction never adds a Store here.
const revokedStores = new WeakSet<object>();

// Stores whose stored record was replaced by the retained privacy choices.
// Until the restriction is lifted, memory is the only full copy, so storage is
// not read back into it.
const purgedStores = new WeakSet<object>();

// Stores whose full record is being written back, so the write it makes is
// not taken for another retry.
const restoringStores = new WeakSet<object>();

/** True while the stored record holds only the retained privacy choices. */
export function isStoredRecordPurged(
    mpInstance: IMParticleWebSDKInstance
): boolean {
    return !!mpInstance._Store && purgedStores.has(mpInstance._Store);
}

/**
 * True while a page or derived flag, not initialization alone, keeps
 * functional storage switched off for the current Store.
 */
export function isFunctionalStorageRevoked(
    mpInstance: IMParticleWebSDKInstance
): boolean {
    return !!mpInstance._Store && revokedStores.has(mpInstance._Store);
}

// Each step is best effort: browser storage can be denied, and one failure
// must not leave the remaining consumers writing.
function attempt(step: () => void): void {
    try {
        step();
    } catch (e) {
        // Storage access is best effort.
    }
}

/**
 * Applies a change of the combined privacy flags (initialization OR page OR
 * derived) made after initialization. Flags known before the workspace
 * configuration loads are read by each storage consumer when it is created,
 * exactly like initialization flags, so only later changes switch storage here.
 *
 * @param previous combined flag values before the change
 */
export function applyPrivacyFlagChange(
    mpInstance: IMParticleWebSDKInstance,
    previous: ICookieConsentFlags
): void {
    const manager = mpInstance._CookieConsentManager;
    const store = mpInstance._Store;
    if (!manager || !store) {
        return;
    }

    const noFunctional = manager.getNoFunctional();
    if (noFunctional !== previous.noFunctional) {
        if (noFunctional) {
            // Keep a full copy in memory so it can be written back if the
            // restriction is lifted on this page. While revoked, storage holds
            // only the retained privacy choices and memory stays authoritative.
            if (store.configurationLoaded) {
                attempt(() => store.syncPersistenceData());
            }
            revokedStores.add(store);
        } else {
            revokedStores.delete(store);
        }
        if (store.configurationLoaded) {
            if (noFunctional) {
                disableFunctionalStorage(mpInstance);
            } else {
                enableFunctionalStorage(mpInstance);
            }
        } else if (noFunctional) {
            // A re-initialization is loading its configuration, and the
            // consumers it replaces keep running until it finishes. Stop them
            // now, under the storage keys they were created with.
            suppressConsumers(mpInstance);
        } else {
            switchUploader(mpInstance, true);
        }
    }

    // Forwarder and identity code runs here; a failure in one must not reach
    // the setter's caller or skip the other.
    if (manager.getNoTargeting() !== previous.noTargeting) {
        attempt(() => syncNoTargetingAttribute(mpInstance));
    }

    if (previous.noFunctional && !noFunctional) {
        attempt(() => resumeSuppressedIdentify(mpInstance));
    }
}

/**
 * Called once the configuration has loaded and storage has been read into
 * memory. A page or derived restriction set while it loaded only stopped the
 * consumers; remove what earlier pages stored, as a later restriction would.
 */
export function applyRestrictionAfterConfiguration(
    mpInstance: IMParticleWebSDKInstance
): void {
    const manager = mpInstance._CookieConsentManager;
    if (
        manager &&
        manager.getNoFunctional() &&
        isFunctionalStorageRevoked(mpInstance) &&
        !isStoredRecordPurged(mpInstance)
    ) {
        disableFunctionalStorage(mpInstance);
    }
}

function disableFunctionalStorage(mpInstance: IMParticleWebSDKInstance): void {
    const { _Store: store, _Persistence: persistence } = mpInstance;
    const { storageName } = store;

    // Main persistence: writes already stop through the live flag. Remove what
    // was stored before the change, keeping only the privacy choices: a
    // logging opt-out and the current user's consent state, so a restriction
    // derived from consent is derived again on the next page load.
    purgedStores.add(store);
    attempt(() => new LocalStorageVault(storageName).purge());
    attempt(() => persistence.expireCookies(storageName));
    attempt(() => persistence.storePrivacyChoices());

    suppressConsumers(mpInstance);
    // The uploader has taken what it needs into memory; remove any queue a
    // page stored, including one this uploader never reads.
    attempt(() => new SessionStorageVault(`${storageName}-events`).purge());
    attempt(() => new LocalStorageVault(`${storageName}-batches`).purge());
}

// Stops the identity cache, uploader and time-on-site timer from writing, and
// removes what each stored under its own key.
function suppressConsumers(mpInstance: IMParticleWebSDKInstance): void {
    const identity = mpInstance._Identity;
    const cache = identity.idCache;
    // Install the disabled cache before touching storage, so a storage
    // failure cannot leave the writable cache in place.
    identity.idCache = new DisabledVault(
        `${mpInstance._Store.storageName}-id-cache`,
        false
    );
    attempt(() => cache?.purge());
    switchUploader(mpInstance, false);
    attempt(() => mpInstance._timeOnSiteTimer?.clearStoredTime());
}

function switchUploader(
    mpInstance: IMParticleWebSDKInstance,
    allowed: boolean
): void {
    const uploader = mpInstance._APIClient?.uploader;
    if (uploader) {
        attempt(() => uploader.setFunctionalStorageAllowed(allowed));
    }
}

function enableFunctionalStorage(mpInstance: IMParticleWebSDKInstance): void {
    const { _Store: store, _Persistence: persistence } = mpInstance;
    const { storageName } = store;

    // The stored record was removed, and later writes only refresh the global
    // and current user fields. Write the in-memory users back once, then
    // refresh the global fields, including the logging choice.
    attempt(() => restoreStoredRecord(mpInstance));
    attempt(() => persistence.update());

    // Time-on-site writes resume through the live flag. The identity cache
    // and the uploader are switched back here.
    attempt(() => {
        mpInstance._Identity.idCache = new LocalStorageVault(
            `${storageName}-id-cache`
        );
    });
    switchUploader(mpInstance, true);
}

/**
 * Writes the in-memory record back over the retained privacy choices. Memory
 * stays the full copy until storage holds that record, so a failed write
 * cannot load the privacy choices over it; a later write retries.
 */
export function restoreStoredRecord(
    mpInstance: IMParticleWebSDKInstance
): void {
    const store = mpInstance._Store;
    if (!store || restoringStores.has(store)) {
        return;
    }
    restoringStores.add(store);
    try {
        attempt(() =>
            mpInstance._Persistence.savePersistence(store.persistenceData)
        );
        if (isFullRecordStored(mpInstance)) {
            purgedStores.delete(store);
        }
    } finally {
        restoringStores.delete(store);
    }
}

// True when storage holds every field memory has for the current user and
// the global fields, which the retained privacy choices never do.
function isFullRecordStored(mpInstance: IMParticleWebSDKInstance): boolean {
    const persistence = mpInstance._Persistence;
    const memory = mpInstance._Store.persistenceData || ({} as Dictionary);
    let stored = null;
    attempt(() => {
        stored = persistence.useLocalStorage()
            ? persistence.getLocalStorage()
            : persistence.getCookie();
    });
    if (!stored) {
        return false;
    }
    const mpid = mpInstance._Store.mpid;
    return (
        holdsFields(stored.gs, memory.gs) &&
        (!mpid || holdsFields(stored[mpid], memory[mpid]))
    );
}

function holdsFields(stored: Dictionary, expected: Dictionary): boolean {
    return Object.keys(expected || {}).every(
        field =>
            expected[field] === undefined ||
            (!!stored && hasOwnProp(stored, field))
    );
}

function syncNoTargetingAttribute(mpInstance: IMParticleWebSDKInstance): void {
    const manager = mpInstance._CookieConsentManager;
    const user = mpInstance.Identity.getCurrentUser();
    if (!user) {
        // Login, logout and identify set it from the combined value.
        return;
    }
    manager.syncNoTargetingAttribute(user);

    // removeUserAttribute changes only a stored user record, which may not
    // exist after functional storage was off. Remove it from memory as well.
    if (!manager.getNoTargeting()) {
        const mpid = user.getMPID();
        const attributes = mpInstance._Store.getUserAttributes(mpid);
        if (hasOwnProp(attributes, NO_TARGETING_ATTRIBUTE)) {
            const remaining = { ...attributes };
            delete remaining[NO_TARGETING_ATTRIBUTE];
            mpInstance._Store.setUserAttributes(mpid, remaining);
        }
    }
}

/**
 * Runs the initial identify that was skipped because noFunctional applied
 * without an explicit identifier, once that restriction has been lifted.
 * If another identity request is in flight, waits for it to finish.
 */
export function resumeSuppressedIdentify(
    mpInstance: IMParticleWebSDKInstance
): void {
    const store = mpInstance._Store;
    if (!store) {
        return;
    }
    pendingIdentifyStores.delete(store);

    if (
        !store.configurationLoaded ||
        store.webviewBridgeEnabled ||
        store.identifyCalled ||
        store.mpid ||
        !mpInstance._Helpers.canLog() ||
        isNoFunctionalWithoutId(mpInstance)
    ) {
        return;
    }

    if (store.identityCallInFlight) {
        pendingIdentifyStores.set(store, true);
        return;
    }

    const { SDKConfig } = store;
    mpInstance.Identity.identify(
        SDKConfig.identifyRequest,
        SDKConfig.identityCallback
    );
    store.identifyCalled = true;
    SDKConfig.identityCallback = null;
}

/** Called after each identity request finishes, successfully or not. */
export function onIdentityRequestSettled(
    mpInstance: IMParticleWebSDKInstance
): void {
    const store = mpInstance._Store;
    if (store && pendingIdentifyStores.has(store)) {
        resumeSuppressedIdentify(mpInstance);
    }
}
