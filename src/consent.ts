import {
    CCPAConsentState,
    ConsentState,
    GDPRConsentState,
    PrivacyConsentState,
} from '@mparticle/web-sdk';
import { MParticleUser, MParticleWebSDK } from './sdkRuntimeModels';
import { Dictionary, isObject } from './utils';

export const CCPAPurpose = 'data_sale_opt_out' as const;

export interface IMinifiedConsentJSONObject {
    gdpr?: Dictionary<IPrivacyV2DTO>;
    ccpa?: {
        [CCPAPurpose]: IPrivacyV2DTO;
    };
}

export interface ICreatePrivacyConsentFunction {
    (
        consented: boolean,
        timestamp?: number,
        consentDocument?: string,
        location?: string,
        hardwareId?: string
    ): PrivacyConsentState | null;
}

// Represents Consent API defined as part of mPInstance
// TODO: Refactor this with Consent Namespace in @types/mparticle-web-sdk
//       https://go.mparticle.com/work/SQDSDKS-5009
export interface SDKConsentApi {
    createGDPRConsent: ICreatePrivacyConsentFunction;
    createCCPAConsent: ICreatePrivacyConsentFunction;
    createConsentState: (consentState?: ConsentState) => ConsentState;
    ConsentSerialization: IConsentSerialization;
    createPrivacyConsent: ICreatePrivacyConsentFunction;
}

export interface IConsentSerialization {
    toMinifiedJsonObject: (state: ConsentState) => IMinifiedConsentJSONObject;
    fromMinifiedJsonObject: (json: IMinifiedConsentJSONObject) => ConsentState;
}

// TODO: Resolve discrepency between ConsentState and SDKConsentState
//       https://go.mparticle.com/work/SQDSDKS-5009
export interface SDKConsentState
    extends Omit<ConsentState, 'getGDPRConsentState' | 'getCCPAConsentState'> {
    getGDPRConsentState(): SDKGDPRConsentState;
    getCCPAConsentState(): SDKCCPAConsentState;
}

// TODO: Resolve discrepency between ConsentState and SDKConsentState
//       https://go.mparticle.com/work/SQDSDKS-5009
//       Specifically PrivacyConsentState, GDPRConsentState and CCPAConsentState
//       Treat all attributes as required, but we had to override this
//       to be optional for a bugfix:
//       https://github.com/mParticle/mparticle-web-sdk/commit/3b11ead79f25b417737442a4fabd6435750f46b8
export interface SDKConsentStateData {
    Consented: boolean;
    Timestamp?: number;
    ConsentDocument?: string;
    Location?: string;
    HardwareId?: string;
}

export type SDKGDPRConsentState = Dictionary<SDKConsentStateData>;
export interface SDKCCPAConsentState extends SDKConsentStateData {}

export interface IPrivacyV2DTO {
    c: boolean; // Consented
    ts: number; // Timestamp
    d: string; // Document
    l: string; // Location
    h: string; // HardwareID
}

export type IGDPRConsentStateV2DTO = Dictionary<IPrivacyV2DTO>;

export interface ICCPAConsentStateV2DTO {
    [CCPAPurpose]: IPrivacyV2DTO;
}

// TODO: Remove when Deprecating V2
export interface IConsentStateV2DTO {
    gdpr?: IGDPRConsentStateV2DTO;
    ccpa?: ICCPAConsentStateV2DTO;
}

export interface IConsentRulesValues {
    consentPurpose: string;
    hasConsented: boolean;
}
export interface IConsentRules {
    includeOnMatch: boolean;
    values: IConsentRulesValues[];
}

// TODO: Remove this if we can safely deprecate `removeCCPAState`
export interface IConsentState extends ConsentState {
    removeCCPAState: () => ConsentState;
}

// Represents Actual Interface for Consent Module
// TODO: Should eventually consolidate with SDKConsentStateApi
export interface IConsent {
    isEnabledForUserConsent: (
        consentRules: IConsentRules,
        user: MParticleUser
    ) => boolean;
    createPrivacyConsent: ICreatePrivacyConsentFunction;
    createConsentState: (consentState?: ConsentState) => ConsentState;
    ConsentSerialization: IConsentSerialization;
}

export default function Consent(this: IConsent, mpInstance: MParticleWebSDK) {
    const self = this;

    // this function is called when consent is required to
    // determine if a cookie sync should happen, or a
    // forwarder should be initialized
    this.isEnabledForUserConsent = function(
        consentRules: IConsentRules,
        user: MParticleUser
    ): boolean {
        if (
            !consentRules ||
            !consentRules.values ||
            !consentRules.values.length
        ) {
            return true;
        }
        if (!user) {
            return false;
        }

        const purposeHashes: Dictionary<boolean> = {};
        const consentState: SDKConsentState = user.getConsentState();
        let purposeHash: string;

        if (consentState) {
            // the server hashes consent purposes in the following way:
            // GDPR - '1' + purpose name
            // CCPA - '2data_sale_opt_out' (there is only 1 purpose of data_sale_opt_out for CCPA)
            const GDPRConsentHashPrefix = '1';
            const CCPAHashString = '2' + CCPAPurpose;

            const gdprConsentState = consentState.getGDPRConsentState();
            if (gdprConsentState) {
                for (const purpose in gdprConsentState) {
                    if (gdprConsentState.hasOwnProperty(purpose)) {
                        purposeHash = mpInstance._Helpers
                            .generateHash(GDPRConsentHashPrefix + purpose)
                            .toString();
                        purposeHashes[purposeHash] =
                            gdprConsentState[purpose].Consented;
                    }
                }
            }
            const CCPAConsentState = consentState.getCCPAConsentState();
            if (CCPAConsentState) {
                purposeHash = mpInstance._Helpers
                    .generateHash(CCPAHashString)
                    .toString();
                purposeHashes[purposeHash] = CCPAConsentState.Consented;
            }
        }
        const isMatch = consentRules.values.some(function(consentRule) {
            const consentPurposeHash = consentRule.consentPurpose;
            const hasConsented = consentRule.hasConsented;
            if (purposeHashes.hasOwnProperty(consentPurposeHash)) {
                return purposeHashes[consentPurposeHash] === hasConsented;
            }
            return false;
        });

        return consentRules.includeOnMatch === isMatch;
    };

    this.createPrivacyConsent = function(
        consented: boolean,
        timestamp?: number,
        consentDocument?: string,
        location?: string,
        hardwareId?: string
    ): PrivacyConsentState | null {
        if (typeof consented !== 'boolean') {
            mpInstance.Logger.error(
                'Consented boolean is required when constructing a Consent object.'
            );
            return null;
        }
        if (timestamp && isNaN(timestamp)) {
            mpInstance.Logger.error(
                'Timestamp must be a valid number when constructing a Consent object.'
            );
            return null;
        }
        if (consentDocument && typeof consentDocument !== 'string') {
            mpInstance.Logger.error(
                'Document must be a valid string when constructing a Consent object.'
            );
            return null;
        }
        if (location && typeof location !== 'string') {
            mpInstance.Logger.error(
                'Location must be a valid string when constructing a Consent object.'
            );
            return null;
        }
        if (hardwareId && typeof hardwareId !== 'string') {
            mpInstance.Logger.error(
                'Hardware ID must be a valid string when constructing a Consent object.'
            );
            return null;
        }
        return {
            Consented: consented,
            Timestamp: timestamp || Date.now(),
            ConsentDocument: consentDocument,
            Location: location,
            HardwareId: hardwareId,
        };
    };

    this.ConsentSerialization = {
        toMinifiedJsonObject(state: ConsentState): IMinifiedConsentJSONObject {
            const jsonObject: Partial<IMinifiedConsentJSONObject> = {};
            if (state) {
                const gdprConsentState = state.getGDPRConsentState();
                if (gdprConsentState) {
                    jsonObject.gdpr = {} as Dictionary<IPrivacyV2DTO>;
                    for (const purpose in gdprConsentState) {
                        if (gdprConsentState.hasOwnProperty(purpose)) {
                            const gdprConsent = gdprConsentState[purpose];
                            jsonObject.gdpr[purpose] = {} as IPrivacyV2DTO;
                            if (typeof gdprConsent.Consented === 'boolean') {
                                jsonObject.gdpr[purpose].c =
                                    gdprConsent.Consented;
                            }
                            if (typeof gdprConsent.Timestamp === 'number') {
                                jsonObject.gdpr[purpose].ts =
                                    gdprConsent.Timestamp;
                            }
                            if (
                                typeof gdprConsent.ConsentDocument === 'string'
                            ) {
                                jsonObject.gdpr[purpose].d =
                                    gdprConsent.ConsentDocument;
                            }
                            if (typeof gdprConsent.Location === 'string') {
                                jsonObject.gdpr[purpose].l =
                                    gdprConsent.Location;
                            }
                            if (typeof gdprConsent.HardwareId === 'string') {
                                jsonObject.gdpr[purpose].h =
                                    gdprConsent.HardwareId;
                            }
                        }
                    }
                }

                const ccpaConsentState = state.getCCPAConsentState();
                if (ccpaConsentState) {
                    jsonObject.ccpa = {
                        [CCPAPurpose]: {} as IPrivacyV2DTO,
                    };

                    if (typeof ccpaConsentState.Consented === 'boolean') {
                        jsonObject.ccpa[CCPAPurpose].c =
                            ccpaConsentState.Consented;
                    }
                    if (typeof ccpaConsentState.Timestamp === 'number') {
                        jsonObject.ccpa[CCPAPurpose].ts =
                            ccpaConsentState.Timestamp;
                    }
                    if (typeof ccpaConsentState.ConsentDocument === 'string') {
                        jsonObject.ccpa[CCPAPurpose].d =
                            ccpaConsentState.ConsentDocument;
                    }
                    if (typeof ccpaConsentState.Location === 'string') {
                        jsonObject.ccpa[CCPAPurpose].l =
                            ccpaConsentState.Location;
                    }
                    if (typeof ccpaConsentState.HardwareId === 'string') {
                        jsonObject.ccpa[CCPAPurpose].h =
                            ccpaConsentState.HardwareId;
                    }
                }
            }
            return jsonObject;
        },

        fromMinifiedJsonObject(json: IMinifiedConsentJSONObject): ConsentState {
            const state: ConsentState = self.createConsentState();
            if (json.gdpr) {
                for (const purpose in json.gdpr) {
                    if (json.gdpr.hasOwnProperty(purpose)) {
                        const gdprConsent = self.createPrivacyConsent(
                            json.gdpr[purpose].c,
                            json.gdpr[purpose].ts,
                            json.gdpr[purpose].d,
                            json.gdpr[purpose].l,
                            json.gdpr[purpose].h
                        );
                        state.addGDPRConsentState(purpose, gdprConsent);
                    }
                }
            }

            if (json.ccpa) {
                if (json.ccpa.hasOwnProperty(CCPAPurpose)) {
                    const ccpaConsent = self.createPrivacyConsent(
                        json.ccpa[CCPAPurpose].c,
                        json.ccpa[CCPAPurpose].ts,
                        json.ccpa[CCPAPurpose].d,
                        json.ccpa[CCPAPurpose].l,
                        json.ccpa[CCPAPurpose].h
                    );
                    state.setCCPAConsentState(ccpaConsent);
                }
            }
            return state;
        },
    };

    // TODO: Refactor this method into a constructor
    this.createConsentState = function(
        this: ConsentState,
        consentState?: ConsentState
    ): IConsentState {
        let gdpr = {};
        let ccpa = {};

        if (consentState) {
            const consentStateCopy = self.createConsentState();
            consentStateCopy.setGDPRConsentState(
                consentState.getGDPRConsentState()
            );
            consentStateCopy.setCCPAConsentState(
                consentState.getCCPAConsentState()
            );

            // TODO: Remove casting once `removeCCPAState` is removed;
            return consentStateCopy as IConsentState;
        }

        function canonicalizeForDeduplication(purpose: string): string {
            if (typeof purpose !== 'string') {
                return null;
            }

            const trimmedPurpose = purpose.trim();

            if (!trimmedPurpose.length) {
                return null;
            }

            return trimmedPurpose.toLowerCase();
        }

        /**
         * Invoke these methods on a consent state object.
         * <p>
         * Usage: const consent = mParticle.Consent.createConsentState()
         * <br>
         * consent.setGDPRCoonsentState()
         *
         * @class Consent
         */

        /**
         * Add a GDPR Consent State to the consent state object
         *
         * @method addGDPRConsentState
         * @param purpose [String] Data processing purpose that describes the type of processing done on the data subject’s data
         * @param gdprConsent [Object] A GDPR consent object created via mParticle.Consent.createGDPRConsent(...)
         */

        function addGDPRConsentState(
            this: ConsentState,
            purpose: string,
            gdprConsent: PrivacyConsentState
        ): ConsentState {
            const normalizedPurpose = canonicalizeForDeduplication(purpose);
            if (!normalizedPurpose) {
                mpInstance.Logger.error('Purpose must be a string.');
                return this;
            }

            if (!isObject(gdprConsent)) {
                mpInstance.Logger.error(
                    'Invoked with a bad or empty consent object.'
                );
                return this;
            }
            const gdprConsentCopy = self.createPrivacyConsent(
                gdprConsent.Consented,
                gdprConsent.Timestamp,
                gdprConsent.ConsentDocument,
                gdprConsent.Location,
                gdprConsent.HardwareId
            );
            if (gdprConsentCopy) {
                gdpr[normalizedPurpose] = gdprConsentCopy;
            }
            return this;
        }

        function setGDPRConsentState(
            this: ConsentState,
            gdprConsentState: GDPRConsentState
        ): ConsentState {
            if (!gdprConsentState) {
                gdpr = {};
            } else if (isObject(gdprConsentState)) {
                gdpr = {};
                for (const purpose in gdprConsentState) {
                    if (gdprConsentState.hasOwnProperty(purpose)) {
                        this.addGDPRConsentState(
                            purpose,
                            gdprConsentState[purpose]
                        );
                    }
                }
            }
            return this;
        }

        /**
         * Remove a GDPR Consent State to the consent state object
         *
         * @method removeGDPRConsentState
         * @param purpose [String] Data processing purpose that describes the type of processing done on the data subject’s data
         */

        function removeGDPRConsentState(
            this: ConsentState,
            purpose: string
        ): ConsentState {
            const normalizedPurpose = canonicalizeForDeduplication(purpose);
            if (!normalizedPurpose) {
                return this;
            }
            delete gdpr[normalizedPurpose];
            return this;
        }

        /**
         * Gets the GDPR Consent State
         *
         * @method getGDPRConsentState
         * @return {Object} A GDPR Consent State
         */

        function getGDPRConsentState(): GDPRConsentState {
            // TODO: Can we replace the usage of extend and either use
            //       Object.assign or create our own clone function?
            // return mpInstance._Helpers.extend({}, gdpr);
            return Object.assign({}, gdpr);
        }

        /**
         * Sets a CCPA Consent state (has a single purpose of 'data_sale_opt_out')
         *
         * @method setCCPAConsentState
         * @param {Object} ccpaConsent CCPA Consent State
         */
        function setCCPAConsentState(
            this: ConsentState,
            ccpaConsent: CCPAConsentState
        ) {
            if (!isObject(ccpaConsent)) {
                mpInstance.Logger.error(
                    'Invoked with a bad or empty CCPA consent object.'
                );
                return this;
            }
            const ccpaConsentCopy = self.createPrivacyConsent(
                ccpaConsent.Consented,
                ccpaConsent.Timestamp,
                ccpaConsent.ConsentDocument,
                ccpaConsent.Location,
                ccpaConsent.HardwareId
            );
            if (ccpaConsentCopy) {
                ccpa[CCPAPurpose] = ccpaConsentCopy;
            }
            return this;
        }

        /**
         * Gets the CCPA Consent State
         *
         * @method getCCPAConsentStatensent
         * @return {Object} A CCPA Consent State
         */
        function getCCPAConsentState(): CCPAConsentState {
            return ccpa[CCPAPurpose];
        }

        /**
         * Removes CCPA from the consent state object
         *
         * @method removeCCPAConsentState
         */
        function removeCCPAConsentState(this: ConsentState) {
            delete ccpa[CCPAPurpose];
            return this;
        }

        // TODO: Can we remove this? It is deprecated.
        function removeCCPAState(this: ConsentState) {
            mpInstance.Logger.warning(
                'removeCCPAState is deprecated and will be removed in a future release; use removeCCPAConsentState instead'
            );
            // @ts-ignore
            return removeCCPAConsentState();
        }

        return {
            setGDPRConsentState,
            addGDPRConsentState,
            setCCPAConsentState,
            getCCPAConsentState,
            getGDPRConsentState,
            removeGDPRConsentState,
            removeCCPAState, // TODO: Can we remove? This is deprecated
            removeCCPAConsentState,
        };
    };
}
