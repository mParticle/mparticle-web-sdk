import { ICookieConsentFlags } from './cookieConsentManager';
import { IMParticleWebSDKInstance } from './mp-instance';
/** True while the stored record holds only the retained privacy choices. */
export declare function isStoredRecordPurged(mpInstance: IMParticleWebSDKInstance): boolean;
/**
 * True while a page or derived flag, not initialization alone, keeps
 * functional storage switched off for the current Store.
 */
export declare function isFunctionalStorageRevoked(mpInstance: IMParticleWebSDKInstance): boolean;
/**
 * Applies a change of the combined privacy flags (initialization OR page OR
 * derived) made after initialization. Flags known before the workspace
 * configuration loads are read by each storage consumer when it is created,
 * exactly like initialization flags, so only later changes switch storage here.
 *
 * @param previous combined flag values before the change
 */
export declare function applyPrivacyFlagChange(mpInstance: IMParticleWebSDKInstance, previous: ICookieConsentFlags): void;
/**
 * Called once the configuration has loaded and storage has been read into
 * memory. A page or derived restriction set while it loaded only stopped the
 * consumers; remove what earlier pages stored, as a later restriction would.
 */
export declare function applyRestrictionAfterConfiguration(mpInstance: IMParticleWebSDKInstance): void;
/**
 * Writes the in-memory record back over the retained privacy choices. Memory
 * stays the full copy until storage holds that record, so a failed write
 * cannot load the privacy choices over it; a later write retries.
 */
export declare function restoreStoredRecord(mpInstance: IMParticleWebSDKInstance): void;
/**
 * Runs the initial identify that was skipped because noFunctional applied
 * without an explicit identifier, once that restriction has been lifted.
 * If another identity request is in flight, waits for it to finish.
 */
export declare function resumeSuppressedIdentify(mpInstance: IMParticleWebSDKInstance): void;
/** Called after each identity request finishes, successfully or not. */
export declare function onIdentityRequestSettled(mpInstance: IMParticleWebSDKInstance): void;
