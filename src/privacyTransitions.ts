import { ICookieConsentFlags } from './cookieConsentManager';
import { NO_TARGETING_ATTRIBUTE } from './constants';
import { isNoFunctionalWithoutId } from './identity-utils';
import { IMParticleWebSDKInstance } from './mp-instance';
import { hasOwnProp } from './utils';
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
            purgedStores.delete(store);
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

    if (manager.getNoTargeting() !== previous.noTargeting) {
        syncNoTargetingAttribute(mpInstance);
    }

    if (previous.noFunctional && !noFunctional) {
        resumeSuppressedIdentify(mpInstance);
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

    if (!mpInstance._APIClient?.uploader) {
        attempt(() => new SessionStorageVault(`${storageName}-events`).purge());
        attempt(() => new LocalStorageVault(`${storageName}-batches`).purge());
    }
    suppressConsumers(mpInstance);
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
    attempt(() => {
        persistence.savePersistence(store.persistenceData);
        persistence.update();
    });

    // Time-on-site writes resume through the live flag. The identity cache
    // and the uploader are switched back here.
    attempt(() => {
        mpInstance._Identity.idCache = new LocalStorageVault(
            `${storageName}-id-cache`
        );
    });
    switchUploader(mpInstance, true);
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
