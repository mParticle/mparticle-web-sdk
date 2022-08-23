import {
    CCPAConsentState,
    ConsentState,
    GDPRConsentState,
    PrivacyConsentState,
} from '@mparticle/web-sdk';
import { MParticleUser, MParticleWebSDK } from './sdkRuntimeModels';

interface GDPRConsentObject {
    purpose: string;
}

interface CCPAConsentObject {
    purpose: string;
}

interface ConsentJSONObject {
    gdpr?: Partial<GDPRConsentObject>;
    ccpa?: Partial<CCPAConsentObject>;
}

export interface ConsentRuleValues {
    consentPurpose: string;
    hasConsented: boolean;
}
export interface ConsentRules {
    includeOnMatch: boolean;
    values: ConsentRuleValues[];
}

export interface IConsentSerialization {
    toMinifiedJsonObject: (state: ConsentState) => ConsentJSONObject;
    fromMinifiedJsonObject: (json: ConsentJSONObject) => ConsentState;
}

export interface IConsent {
    mPinstance;
    isEnabledForUserConsent: (consentRules: any, user: any) => boolean;
    createPrivacyConsent: (
        consented: boolean,
        timestamp: number,
        consentDocument: string,
        location: string,
        hardwareId: string
    ) => PrivacyConsentState;
    createConsentState: (consentState?: ConsentState) => ConsentState;
    ConsentSerialization: IConsentSerialization;
}

export default function Consent(this: IConsent, mpInstance: MParticleWebSDK) {
    var self = this;
    var CCPAPurpose: string = 'data_sale_opt_out';

    // this function is called when consent is required to
    // determine if a cookie sync should happen, or a
    // forwarder should be initialized
    this.isEnabledForUserConsent = function(
        consentRules: ConsentRules,
        user: MParticleUser
    ) {
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

        var purposeHashes = {},
            consentState = user.getConsentState(),
            purposeHash;
        if (consentState) {
            // the server hashes consent purposes in the following way:
            // GDPR - '1' + purpose name
            // CCPA - '2data_sale_opt_out' (there is only 1 purpose of data_sale_opt_out for CCPA)
            var GDPRConsentHashPrefix = '1';
            var CCPAPurpose = 'data_sale_opt_out'; // FIXME: is this redundant?
            var CCPAHashString = '2' + CCPAPurpose;

            var gdprConsentState = consentState.getGDPRConsentState();
            if (gdprConsentState) {
                for (var purpose in gdprConsentState) {
                    if (gdprConsentState.hasOwnProperty(purpose)) {
                        purposeHash = mpInstance._Helpers
                            .generateHash(GDPRConsentHashPrefix + purpose)
                            .toString();
                        purposeHashes[purposeHash] =
                            gdprConsentState[purpose].Consented;
                    }
                }
            }
            var CCPAConsentState = consentState.getCCPAConsentState();
            if (CCPAConsentState) {
                purposeHash = mpInstance._Helpers
                    .generateHash(CCPAHashString)
                    .toString();
                purposeHashes[purposeHash] = CCPAConsentState.Consented;
            }
        }
        var isMatch = consentRules.values.some(function(consentRule) {
            var consentPurposeHash = consentRule.consentPurpose;
            var hasConsented = consentRule.hasConsented;
            if (purposeHashes.hasOwnProperty(consentPurposeHash)) {
                return purposeHashes[consentPurposeHash] === hasConsented;
            }
            return false;
        });

        return consentRules.includeOnMatch === isMatch;
    };

    this.createPrivacyConsent = function(
        consented,
        timestamp,
        consentDocument,
        location,
        hardwareId
    ) {
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
        toMinifiedJsonObject(state: ConsentState): ConsentJSONObject {
            var jsonObject: Partial<ConsentJSONObject> = {};
            if (state) {
                var gdprConsentState = state.getGDPRConsentState();
                if (gdprConsentState) {
                    jsonObject.gdpr = {};
                    for (var purpose in gdprConsentState) {
                        if (gdprConsentState.hasOwnProperty(purpose)) {
                            var gdprConsent = gdprConsentState[purpose];
                            jsonObject.gdpr[purpose] = {};
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

                var ccpaConsentState = state.getCCPAConsentState();
                if (ccpaConsentState) {
                    jsonObject.ccpa = {};
                    jsonObject.ccpa[CCPAPurpose] = {};

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

        fromMinifiedJsonObject(json): ConsentState {
            var state = self.createConsentState();
            if (json.gdpr) {
                for (var purpose in json.gdpr) {
                    if (json.gdpr.hasOwnProperty(purpose)) {
                        var gdprConsent = self.createPrivacyConsent(
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
                    var ccpaConsent = self.createPrivacyConsent(
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

    this.createConsentState = function(
        this: ConsentState,
        consentState?: ConsentState
    ): ConsentState {
        var gdpr = {};
        var ccpa = {};

        function canonicalizeForDeduplication(purpose: string): string {
            if (typeof purpose !== 'string') {
                return null;
            }
            var trimmedPurpose = purpose.trim();
            if (!trimmedPurpose.length) {
                return null;
            }
            return trimmedPurpose.toLowerCase();
        }

        /**
         * Invoke these methods on a consent state object.
         * <p>
         * Usage: var consent = mParticle.Consent.createConsentState()
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

        // FIXME: Chaining is broken
        const addGDPRConsentState = (
            purpose: string,
            gdprConsent: GDPRConsentState
        ): ConsentState => {
            var normalizedPurpose = canonicalizeForDeduplication(purpose);
            if (!normalizedPurpose) {
                mpInstance.Logger.error('Purpose must be a string.');
                return this;
            }

            if (!mpInstance._Helpers.isObject(gdprConsent)) {
                mpInstance.Logger.error(
                    'Invoked with a bad or empty consent object.'
                );
                return this;
            }
            var gdprConsentCopy = self.createPrivacyConsent(
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
        };

        const setGDPRConsentState = (
            gdprConsentState: GDPRConsentState
        ): ConsentState => {
            if (!gdprConsentState) {
                gdpr = {};
            } else if (mpInstance._Helpers.isObject(gdprConsentState)) {
                gdpr = {};
                for (var purpose in gdprConsentState) {
                    if (gdprConsentState.hasOwnProperty(purpose)) {
                        addGDPRConsentState(purpose, gdprConsentState[purpose]);
                    }
                }
            }
            return this;
        };

        /**
         * Remove a GDPR Consent State to the consent state object
         *
         * @method removeGDPRConsentState
         * @param purpose [String] Data processing purpose that describes the type of processing done on the data subject’s data
         */

        const removeGDPRConsentState = purpose => {
            var normalizedPurpose = canonicalizeForDeduplication(purpose);
            if (!normalizedPurpose) {
                return this;
            }
            delete gdpr[normalizedPurpose];
            return this;
        };

        /**
         * Gets the GDPR Consent State
         *
         * @method getGDPRConsentState
         * @return {Object} A GDPR Consent State
         */

        const getGDPRConsentState = (): GDPRConsentState => {
            return mpInstance._Helpers.extend({}, gdpr);
        };

        /**
         * Sets a CCPA Consent state (has a single purpose of 'data_sale_opt_out')
         *
         * @method setCCPAConsentState
         * @param {Object} ccpaConsent CCPA Consent State
         */
        const setCCPAConsentState = (
            ccpaConsent: CCPAConsentState
        ): ConsentState => {
            if (!mpInstance._Helpers.isObject(ccpaConsent)) {
                mpInstance.Logger.error(
                    'Invoked with a bad or empty CCPA consent object.'
                );
                return this;
            }
            var ccpaConsentCopy = self.createPrivacyConsent(
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
        };

        /**
         * Gets the CCPA Consent State
         *
         * @method getCCPAConsentStatensent
         * @return {Object} A CCPA Consent State
         */
        const getCCPAConsentState = (): CCPAConsentState => {
            return ccpa[CCPAPurpose];
        };

        /**
         * Removes CCPA from the consent state object
         *
         * @method removeCCPAConsentState
         */
        const removeCCPAConsentState = (): ConsentState => {
            delete ccpa[CCPAPurpose];
            return this;
        };

        if (consentState) {
            setGDPRConsentState(consentState.getGDPRConsentState());
            setCCPAConsentState(consentState.getCCPAConsentState());
        }

        return {
            setGDPRConsentState,
            addGDPRConsentState,
            setCCPAConsentState,
            getCCPAConsentState,
            getGDPRConsentState,
            removeGDPRConsentState,
            removeCCPAConsentState,
        };
    };
}
