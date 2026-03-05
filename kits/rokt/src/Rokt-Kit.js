/* eslint-disable no-undef */
//  Copyright 2025 mParticle, Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

var name = 'Rokt';
var moduleId = 181;
var EVENT_NAME_SELECT_PLACEMENTS = 'selectPlacements';

var constructor = function () {
    var self = this;
    var PerformanceMarks = {
        RoktScriptAppended: 'mp:RoktScriptAppended',
    };

    var EMAIL_SHA256_KEY = 'emailsha256';

    // Dynamic identity type for Rokt's emailsha256 identity value which MP doesn't natively support - will be set during initialization
    var mappedEmailSha256Key;

    self.name = name;
    self.moduleId = moduleId;
    self.isInitialized = false;

    self.launcher = null;
    self.filters = {};
    self.userAttributes = {};
    self.testHelpers = null;
    self.placementEventMappingLookup = {};
    self.placementEventAttributeMappingLookup = {};
    self.eventQueue = [];
    self.integrationName = null;

    function getEventAttributeValue(event, eventAttributeKey) {
        var attributes = event && event.EventAttributes;
        if (!attributes) {
            return null;
        }

        if (typeof attributes[eventAttributeKey] === 'undefined') {
            return null;
        }

        return attributes[eventAttributeKey];
    }

    function doesEventAttributeConditionMatch(condition, actualValue) {
        if (!condition || !isString(condition.operator)) {
            return false;
        }

        var operator = condition.operator.toLowerCase();
        var expectedValue = condition.attributeValue;

        if (operator === 'exists') {
            return actualValue !== null;
        }

        if (actualValue == null) {
            return false;
        }

        if (operator === 'equals') {
            return String(actualValue) === String(expectedValue);
        }

        if (operator === 'contains') {
            return String(actualValue).indexOf(String(expectedValue)) !== -1;
        }

        return false;
    }

    function doesEventMatchRule(event, rule) {
        if (!rule || !isString(rule.eventAttributeKey)) {
            return false;
        }

        var conditions = rule.conditions;
        if (!Array.isArray(conditions)) {
            return false;
        }

        var actualValue = getEventAttributeValue(event, rule.eventAttributeKey);

        if (conditions.length === 0) {
            return actualValue !== null;
        }
        for (var i = 0; i < conditions.length; i++) {
            if (!doesEventAttributeConditionMatch(conditions[i], actualValue)) {
                return false;
            }
        }

        return true;
    }

    function generateMappedEventAttributeLookup(
        placementEventAttributeMapping
    ) {
        var mappedAttributeKeys = {};
        if (!Array.isArray(placementEventAttributeMapping)) {
            return mappedAttributeKeys;
        }
        for (var i = 0; i < placementEventAttributeMapping.length; i++) {
            var mapping = placementEventAttributeMapping[i];
            if (
                !mapping ||
                !isString(mapping.value) ||
                !isString(mapping.map)
            ) {
                continue;
            }

            var mappedAttributeKey = mapping.value;
            var eventAttributeKey = mapping.map;

            if (!mappedAttributeKeys[mappedAttributeKey]) {
                mappedAttributeKeys[mappedAttributeKey] = [];
            }

            mappedAttributeKeys[mappedAttributeKey].push({
                eventAttributeKey: eventAttributeKey,
                conditions: Array.isArray(mapping.conditions)
                    ? mapping.conditions
                    : [],
            });
        }
        return mappedAttributeKeys;
    }

    function applyPlacementEventAttributeMapping(event) {
        var mappedAttributeKeys = Object.keys(
            self.placementEventAttributeMappingLookup
        );
        for (var i = 0; i < mappedAttributeKeys.length; i++) {
            var mappedAttributeKey = mappedAttributeKeys[i];
            var rulesForMappedAttributeKey =
                self.placementEventAttributeMappingLookup[mappedAttributeKey];
            if (isEmpty(rulesForMappedAttributeKey)) {
                continue;
            }

            // Require ALL rules for the same key to match (AND).
            var allMatch = true;
            for (var j = 0; j < rulesForMappedAttributeKey.length; j++) {
                if (!doesEventMatchRule(event, rulesForMappedAttributeKey[j])) {
                    allMatch = false;
                    break;
                }
            }
            if (!allMatch) {
                continue;
            }

            window.mParticle.Rokt.setLocalSessionAttribute(
                mappedAttributeKey,
                true
            );
        }
    }

    /**
     * Generates the Rokt launcher script URL with optional domain override and extensions
     * @param {string} domain - The CNAME domain to use for overriding the launcher url
     * @param {Array<string>} extensions - List of extension query parameters to append
     * @returns {string} The complete launcher script URL
     */
    function generateLauncherScript(_domain, extensions) {
        // Override domain if a customer is using a CNAME
        // If a customer is using a CNAME, a domain will be passed. If not, we use the default domain.
        var domain = typeof _domain !== 'undefined' ? _domain : 'apps.rokt.com';
        var protocol = 'https://';
        var launcherPath = '/wsdk/integrations/launcher.js';
        var baseUrl = [protocol, domain, launcherPath].join('');

        if (!extensions || extensions.length === 0) {
            return baseUrl;
        }
        return baseUrl + '?extensions=' + extensions.join(',');
    }

    /**
     * Checks if Rokt launcher is available and ready to attach
     * @returns {boolean} True if launcher can be attached
     */
    function isLauncherReadyToAttach() {
        return window.Rokt && typeof window.Rokt.createLauncher === 'function';
    }

    /**
     * Passes attributes to the Rokt Web SDK for client-side hashing
     * @see https://docs.rokt.com/developers/integration-guides/web/library/integration-launcher#hash-attributes
     * @param {Object} attributes - The attributes to be hashed
     * @returns {Promise<Object|null>} A Promise resolving to the
     * hashed attributes from the launcher, or `null` if the kit is not initialized
     */
    function hashAttributes(attributes) {
        if (!isKitReady()) {
            console.error('Rokt Kit: Not initialized');
            return null;
        }
        return self.launcher.hashAttributes(attributes);
    }

    function initForwarder(
        settings,
        _service,
        testMode,
        _trackerId,
        filteredUserAttributes
    ) {
        var accountId = settings.accountId;
        var roktExtensions = extractRoktExtensions(settings.roktExtensions);
        self.userAttributes = filteredUserAttributes || {};
        self.onboardingExpProvider = settings.onboardingExpProvider;

        var placementEventMapping = parseSettingsString(
            settings.placementEventMapping
        );
        self.placementEventMappingLookup = generateMappedEventLookup(
            placementEventMapping
        );

        var placementEventAttributeMapping = parseSettingsString(
            settings.placementEventAttributeMapping
        );
        self.placementEventAttributeMappingLookup =
            generateMappedEventAttributeLookup(placementEventAttributeMapping);

        // Set dynamic OTHER_IDENTITY based on server settings
        // Convert to lowercase since server sends TitleCase (e.g., 'Other' -> 'other')
        if (settings.hashedEmailUserIdentityType) {
            mappedEmailSha256Key =
                settings.hashedEmailUserIdentityType.toLowerCase();
        }

        var domain = window.mParticle.Rokt.domain;
        var launcherOptions = mergeObjects(
            {},
            window.mParticle.Rokt.launcherOptions || {}
        );
        self.integrationName = generateIntegrationName(
            launcherOptions.integrationName
        );
        launcherOptions.integrationName = self.integrationName;

        if (testMode) {
            self.testHelpers = {
                generateLauncherScript: generateLauncherScript,
                extractRoktExtensions: extractRoktExtensions,
                hashEventMessage: hashEventMessage,
                parseSettingsString: parseSettingsString,
                generateMappedEventLookup: generateMappedEventLookup,
                generateMappedEventAttributeLookup:
                    generateMappedEventAttributeLookup,
            };
            attachLauncher(accountId, launcherOptions);
            return;
        }

        if (isLauncherReadyToAttach()) {
            attachLauncher(accountId, launcherOptions);
        } else {
            var target = document.head || document.body;
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = generateLauncherScript(domain, roktExtensions);
            script.async = true;
            script.crossOrigin = 'anonymous';
            script.fetchPriority = 'high';
            script.id = 'rokt-launcher';

            script.onload = function () {
                if (isLauncherReadyToAttach()) {
                    attachLauncher(accountId, launcherOptions);
                } else {
                    console.error(
                        'Rokt object is not available after script load.'
                    );
                }
            };

            script.onerror = function (error) {
                console.error('Error loading Rokt launcher script:', error);
            };

            target.appendChild(script);
            captureTiming(PerformanceMarks.RoktScriptAppended);
        }
    }
    /**
     * Returns the user identities from the filtered user, if any
     * @param {Object} filteredUser - The filtered user object containing identities
     * @returns {Object} The user identities from the filtered user
     */
    function returnUserIdentities(filteredUser) {
        if (!filteredUser || !filteredUser.getUserIdentities) {
            return {};
        }

        var userIdentities = filteredUser.getUserIdentities().userIdentities;

        return replaceOtherIdentityWithEmailsha256(userIdentities);
    }

    function returnLocalSessionAttributes() {
        if (
            !window.mParticle.Rokt ||
            typeof window.mParticle.Rokt.getLocalSessionAttributes !==
                'function'
        ) {
            return {};
        }
        if (
            isEmpty(self.placementEventMappingLookup) &&
            isEmpty(self.placementEventAttributeMappingLookup)
        ) {
            return {};
        }
        return window.mParticle.Rokt.getLocalSessionAttributes();
    }

    function replaceOtherIdentityWithEmailsha256(userIdentities) {
        var newUserIdentities = mergeObjects({}, userIdentities || {});
        if (userIdentities[mappedEmailSha256Key]) {
            newUserIdentities[EMAIL_SHA256_KEY] =
                userIdentities[mappedEmailSha256Key];
        }
        delete newUserIdentities[mappedEmailSha256Key];

        return newUserIdentities;
    }

    /**
     * Selects placements for Rokt Web SDK with merged attributes, filters, and experimentation options
     * @see https://docs.rokt.com/developers/integration-guides/web/library/select-placements-options/
     * @param {Object} options - The options object for selecting placements containing:
     * - identifier {string}: The placement identifier
     * - attributes {Object}: Optional attributes to merge with existing attributes
     * @returns {Promise<void>} A Promise resolving to the Rokt launcher's selectPlacements method with processed attributes
     */
    function selectPlacements(options) {
        var attributes = (options && options.attributes) || {};
        var placementAttributes = mergeObjects(self.userAttributes, attributes);

        var filters = self.filters || {};
        var userAttributeFilters = filters.userAttributeFilters || [];
        var filteredUser = filters.filteredUser || {};
        var mpid =
            filteredUser &&
            filteredUser.getMPID &&
            typeof filteredUser.getMPID === 'function'
                ? filteredUser.getMPID()
                : null;

        var filteredAttributes;

        if (!filters) {
            console.warn(
                'Rokt Kit: No filters available, using user attributes'
            );

            filteredAttributes = placementAttributes;
        } else if (filters.filterUserAttributes) {
            filteredAttributes = filters.filterUserAttributes(
                placementAttributes,
                userAttributeFilters
            );
        }

        self.userAttributes = filteredAttributes;

        var optimizelyAttributes =
            self.onboardingExpProvider === 'Optimizely'
                ? fetchOptimizely()
                : {};

        var filteredUserIdentities = returnUserIdentities(filteredUser);

        var localSessionAttributes = returnLocalSessionAttributes();

        var selectPlacementsAttributes = mergeObjects(
            filteredUserIdentities,
            filteredAttributes,
            optimizelyAttributes,
            localSessionAttributes,
            {
                mpid: mpid,
            }
        );

        var selectPlacementsOptions = mergeObjects(options, {
            attributes: selectPlacementsAttributes,
        });

        // Log custom event for selectPlacements call
        logSelectPlacementsEvent(selectPlacementsAttributes);

        return self.launcher.selectPlacements(selectPlacementsOptions);
    }

    /**
     * Logs a custom event when selectPlacements is called
     * This enables visibility and troubleshooting
     * @param {Object} attributes - The attributes sent to Rokt
     */
    function logSelectPlacementsEvent(attributes) {
        if (
            !window.mParticle ||
            typeof window.mParticle.logEvent !== 'function'
        ) {
            return;
        }

        if (!isObject(attributes)) {
            return;
        }

        var EVENT_TYPE_OTHER = window.mParticle.EventType.Other;

        window.mParticle.logEvent(
            EVENT_NAME_SELECT_PLACEMENTS,
            EVENT_TYPE_OTHER,
            attributes
        );
    }

    /**
     * Enables optional Integration Launcher extensions before selecting placements
     * @param {string} extensionName - Name of the extension to enable
     * @returns {Promise<*>} A Promise resolving to the extension API if available
     */
    function use(extensionName) {
        if (!isKitReady()) {
            console.error('Rokt Kit: Not initialized');
            return Promise.reject(new Error('Rokt Kit: Not initialized'));
        }
        if (!extensionName || !isString(extensionName)) {
            return Promise.reject(
                new Error('Rokt Kit: Invalid extension name')
            );
        }
        return self.launcher.use(extensionName);
    }

    /**
     * Sets extension data for Rokt Web SDK
     * @param {Object} partnerExtensionData - The extension data object containing:
     * - [extensionName] {string}: Name of the extension
     * - [extensionName].options {Object}: Key-value pairs of options for the extension
     * @returns {void} Nothing is returned
     */
    function setExtensionData(partnerExtensionData) {
        if (!isKitReady()) {
            console.error('Rokt Kit: Not initialized');
            return;
        }

        window.Rokt.setExtensionData(partnerExtensionData);
    }

    function processEventQueue() {
        self.eventQueue.forEach(function (event) {
            processEvent(event);
        });
        self.eventQueue = [];
    }

    function processEvent(event) {
        if (!isKitReady()) {
            self.eventQueue.push(event);
            return;
        }

        if (
            typeof window.mParticle.Rokt.setLocalSessionAttribute !== 'function'
        ) {
            return;
        }

        if (!isEmpty(self.placementEventAttributeMappingLookup)) {
            applyPlacementEventAttributeMapping(event);
        }

        if (isEmpty(self.placementEventMappingLookup)) {
            return;
        }

        var hashedEvent = hashEventMessage(
            event.EventDataType,
            event.EventCategory,
            event.EventName
        );

        if (self.placementEventMappingLookup[hashedEvent]) {
            var mappedValue = self.placementEventMappingLookup[hashedEvent];
            window.mParticle.Rokt.setLocalSessionAttribute(mappedValue, true);
        }
    }

    function onUserIdentified(filteredUser) {
        self.filters.filteredUser = filteredUser;
        self.userAttributes = filteredUser.getAllUserAttributes();
    }

    function setUserAttribute(key, value) {
        self.userAttributes[key] = value;
    }

    function removeUserAttribute(key) {
        delete self.userAttributes[key];
    }

    function attachLauncher(accountId, launcherOptions) {
        var options = mergeObjects(
            {
                accountId: accountId,
            },
            launcherOptions || {}
        );

        if (isPartnerInLocalLauncherTestGroup()) {
            var localLauncher = window.Rokt.createLocalLauncher(options);
            initRoktLauncher(localLauncher);
        } else {
            window.Rokt.createLauncher(options)
                .then(initRoktLauncher)
                .catch(function (err) {
                    console.error('Error creating Rokt launcher:', err);
                });
        }
    }

    function initRoktLauncher(launcher) {
        // Assign the launcher to a global variable for later access
        window.Rokt.currentLauncher = launcher;
        // Locally cache the launcher and filters
        self.launcher = launcher;

        var roktFilters = window.mParticle.Rokt.filters;

        if (!roktFilters) {
            console.warn('Rokt Kit: No filters have been set.');
        } else {
            self.filters = roktFilters;
            if (!roktFilters.filteredUser) {
                console.warn('Rokt Kit: No filtered user has been set.');
            }
        }

        // Kit must be initialized before attaching to the Rokt manager
        self.isInitialized = true;
        // Attaches the kit to the Rokt manager
        window.mParticle.Rokt.attachKit(self);
        processEventQueue();
    }

    // mParticle Kit Callback Methods
    function fetchOptimizely() {
        var forwarders = window.mParticle
            ._getActiveForwarders()
            .filter(function (forwarder) {
                return forwarder.name === 'Optimizely';
            });

        try {
            if (forwarders.length > 0 && window.optimizely) {
                // Get the state object
                var optimizelyState = window.optimizely.get('state');
                if (
                    !optimizelyState ||
                    !optimizelyState.getActiveExperimentIds
                ) {
                    return {};
                }
                // Get active experiment IDs
                var activeExperimentIds =
                    optimizelyState.getActiveExperimentIds();
                // Get variations for each active experiment
                var activeExperiments = activeExperimentIds.reduce(function (
                    acc,
                    expId
                ) {
                    acc[
                        'rokt.custom.optimizely.experiment.' +
                            expId +
                            '.variationId'
                    ] = optimizelyState.getVariationMap()[expId].id;
                    return acc;
                },
                {});
                return activeExperiments;
            }
        } catch (error) {
            console.error('Error fetching Optimizely attributes:', error);
        }
        return {};
    }

    // Called by the mParticle Rokt Manager
    this.selectPlacements = selectPlacements;
    this.hashAttributes = hashAttributes;
    this.use = use;

    // Kit Callback Methods
    this.init = initForwarder;
    this.process = processEvent;
    this.setExtensionData = setExtensionData;
    this.setUserAttribute = setUserAttribute;
    this.onUserIdentified = onUserIdentified;
    this.removeUserAttribute = removeUserAttribute;

    /**
     * Checks if the Rokt kit is ready to use.
     * Both conditions must be true:
     * 1. self.isInitialized - Set after successful initialization of the kit
     * 2. self.launcher - The Rokt launcher instance must be available
     * @returns {boolean} Whether the kit is ready for use
     */
    function isKitReady() {
        return !!(self.isInitialized && self.launcher);
    }

    function isPartnerInLocalLauncherTestGroup() {
        return (
            window.mParticle.config &&
            window.mParticle.config.isLocalLauncherEnabled &&
            _isAssignedToSampleGroup()
        );
    }

    function _isAssignedToSampleGroup() {
        var LOCAL_LAUNCHER_TEST_GROUP_THRESHOLD = 0.5;
        return Math.random() > LOCAL_LAUNCHER_TEST_GROUP_THRESHOLD;
    }

    function captureTiming(metricName) {
        if (
            window &&
            window.mParticle &&
            window.mParticle.captureTiming &&
            metricName
        ) {
            window.mParticle.captureTiming(metricName);
        }
    }
};

function generateIntegrationName(customIntegrationName) {
    var coreSdkVersion = window.mParticle.getVersion();
    var kitVersion = process.env.PACKAGE_VERSION;
    var name = 'mParticle_' + 'wsdkv_' + coreSdkVersion + '_kitv_' + kitVersion;

    if (customIntegrationName) {
        name += '_' + customIntegrationName;
    }
    return name;
}

function getId() {
    return moduleId;
}

function register(config) {
    if (!config) {
        window.console.log(
            'You must pass a config object to register the kit ' + name
        );
        return;
    }
    if (!isObject(config)) {
        window.console.log(
            "'config' must be an object. You passed in a " + typeof config
        );
        return;
    }

    if (isObject(config.kits)) {
        config.kits[name] = {
            constructor: constructor,
        };
    } else {
        config.kits = {};
        config.kits[name] = {
            constructor: constructor,
        };
    }
    window.console.log(
        'Successfully registered ' + name + ' to your mParticle configuration'
    );
}

function isObject(val) {
    return (
        val != null && typeof val === 'object' && Array.isArray(val) === false
    );
}

function mergeObjects() {
    var resObj = {};
    for (var i = 0; i < arguments.length; i += 1) {
        var obj = arguments[i],
            keys = Object.keys(obj);
        for (var j = 0; j < keys.length; j += 1) {
            resObj[keys[j]] = obj[keys[j]];
        }
    }
    return resObj;
}

function parseSettingsString(settingsString) {
    if (!settingsString) {
        return [];
    }
    try {
        return JSON.parse(settingsString.replace(/&quot;/g, '"'));
    } catch (error) {
        console.error('Settings string contains invalid JSON');
    }
    return [];
}

function extractRoktExtensions(settingsString) {
    var settings = settingsString ? parseSettingsString(settingsString) : [];
    var roktExtensions = [];

    for (var i = 0; i < settings.length; i++) {
        roktExtensions.push(settings[i].value);
    }

    return roktExtensions;
}

function generateMappedEventLookup(placementEventMapping) {
    if (!placementEventMapping) {
        return {};
    }

    var mappedEvents = {};
    for (var i = 0; i < placementEventMapping.length; i++) {
        var mapping = placementEventMapping[i];
        mappedEvents[mapping.jsmap] = mapping.value;
    }
    return mappedEvents;
}

function hashEventMessage(messageType, eventType, eventName) {
    return window.mParticle.generateHash(
        [messageType, eventType, eventName].join('')
    );
}

function isEmpty(value) {
    return value == null || !(Object.keys(value) || value).length;
}

function isString(value) {
    return typeof value === 'string';
}

if (window && window.mParticle && window.mParticle.addForwarder) {
    window.mParticle.addForwarder({
        name: name,
        constructor: constructor,
        getId: getId,
    });
}

module.exports = {
    register: register,
};
