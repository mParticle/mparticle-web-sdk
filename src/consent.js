export default function Consent(mpInstance) {
    var self = this;
    this.createGDPRConsent = function(
        consented,
        timestamp,
        consentDocument,
        location,
        hardwareId
    ) {
        if (typeof consented !== 'boolean') {
            mpInstance.Logger.error(
                'Consented boolean is required when constructing a GDPR Consent object.'
            );
            return null;
        }
        if (timestamp && isNaN(timestamp)) {
            mpInstance.Logger.error(
                'Timestamp must be a valid number when constructing a GDPR Consent object.'
            );
            return null;
        }
        if (consentDocument && typeof consentDocument !== 'string') {
            mpInstance.Logger.error(
                'Document must be a valid string when constructing a GDPR Consent object.'
            );
            return null;
        }
        if (location && typeof location !== 'string') {
            mpInstance.Logger.error(
                'Location must be a valid string when constructing a GDPR Consent object.'
            );
            return null;
        }
        if (hardwareId && typeof hardwareId !== 'string') {
            mpInstance.Logger.error(
                'Hardware ID must be a valid string when constructing a GDPR Consent object.'
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
        toMinifiedJsonObject: function(state) {
            var jsonObject = {};
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
            }
            return jsonObject;
        },

        fromMinifiedJsonObject: function(json) {
            var state = self.createConsentState();
            if (json.gdpr) {
                for (var purpose in json.gdpr) {
                    if (json.gdpr.hasOwnProperty(purpose)) {
                        var gdprConsent = self.createGDPRConsent(
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
            return state;
        },
    };

    this.createConsentState = function(consentState) {
        var gdpr = {};

        if (consentState) {
            setGDPRConsentState(consentState.getGDPRConsentState());
        }

        function canonicalizeForDeduplication(purpose) {
            if (typeof purpose !== 'string') {
                return null;
            }
            var trimmedPurpose = purpose.trim();
            if (!trimmedPurpose.length) {
                return null;
            }
            return trimmedPurpose.toLowerCase();
        }

        function setGDPRConsentState(gdprConsentState) {
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
        }

        function addGDPRConsentState(purpose, gdprConsent) {
            var normalizedPurpose = canonicalizeForDeduplication(purpose);
            if (!normalizedPurpose) {
                mpInstance.Logger.error(
                    'addGDPRConsentState() invoked with bad purpose. Purpose must be a string.'
                );
                return this;
            }
            if (!mpInstance._Helpers.isObject(gdprConsent)) {
                mpInstance.Logger.error(
                    'addGDPRConsentState() invoked with bad or empty GDPR consent object.'
                );
                return this;
            }
            var gdprConsentCopy = self.createGDPRConsent(
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

        function removeGDPRConsentState(purpose) {
            var normalizedPurpose = canonicalizeForDeduplication(purpose);
            if (!normalizedPurpose) {
                return this;
            }
            delete gdpr[normalizedPurpose];
            return this;
        }

        function getGDPRConsentState() {
            return mpInstance._Helpers.extend({}, gdpr);
        }

        return {
            setGDPRConsentState: setGDPRConsentState,
            addGDPRConsentState: addGDPRConsentState,
            getGDPRConsentState: getGDPRConsentState,
            removeGDPRConsentState: removeGDPRConsentState,
        };
    };
}
