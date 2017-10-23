var Helpers = require('./helpers'),
    Constants = require('./constants'),
    Types = require('./types'),
    MP = require('./mp');

function sendForwardingStats(forwarder, event) {
    var xhr,
        forwardingStat;

    if (forwarder && forwarder.isVisible) {
        xhr = Helpers.createXHR();
        forwardingStat = JSON.stringify({
            mid: forwarder.id,
            n: event.EventName,
            attrs: event.EventAttributes,
            sdk: event.SDKVersion,
            dt: event.EventDataType,
            et: event.EventCategory,
            dbg: event.Debug,
            ct: event.Timestamp,
            eec: event.ExpandedEventCount
        });

        if (xhr) {
            try {
                xhr.open('post', Helpers.createServiceUrl(Constants.secureServiceUrl, Constants.serviceUrl, MP.devToken) + '/Forwarding');
                xhr.send(forwardingStat);
            }
            catch (e) {
                Helpers.logDebug('Error sending forwarding stats to mParticle servers.');
            }
        }
    }
}

function initForwarders(identifyRequest) {
    if (!Helpers.isWebViewEmbedded() && MP.forwarders) {
        // Some js libraries require that they be loaded first, or last, etc
        MP.forwarders.sort(function(x, y) {
            x.settings.PriorityValue = x.settings.PriorityValue || 0;
            y.settings.PriorityValue = y.settings.PriorityValue || 0;
            return -1 * (x.settings.PriorityValue - y.settings.PriorityValue);
        });

        MP.forwarders.forEach(function(forwarder) {
            var filteredUserIdentities = Helpers.filterUserIdentities(identifyRequest.userIdentities, forwarder.userIdentityFilters);

            forwarder.init(forwarder.settings,
                sendForwardingStats,
                false,
                null,
                MP.userAttributes,
                filteredUserIdentities,
                MP.appVersion,
                MP.appName,
                MP.customFlags,
                MP.clientId);
        });
    }
}

function applyToForwarders(functionName, functionArgs) {
    if (MP.forwarders.length) {
        MP.forwarders.forEach(function(forwarder) {
            var forwarderFunction = forwarder[functionName];
            if (forwarderFunction) {
                try {
                    var result = forwarder[functionName](forwarder, functionArgs);

                    if (result) {
                        Helpers.logDebug(result);
                    }
                }
                catch (e) {
                    Helpers.logDebug(e);
                }
            }
        });
    }
}

function sendEventToForwarders(event) {
    var clonedEvent,
        hashedName,
        hashedType,
        filterUserAttributes = function(event, filterList) {
            var hash;

            if (event.UserAttributes) {
                for (var attrName in event.UserAttributes) {
                    if (event.UserAttributes.hasOwnProperty(attrName)) {
                        hash = Helpers.generateHash(attrName);

                        if (Helpers.inArray(filterList, hash)) {
                            delete event.UserAttributes[attrName];
                        }
                    }
                }
            }
        },
        filterUserIdentities = function(event, filterList) {
            if (event.UserIdentities && event.UserIdentities.length) {
                event.UserIdentities.forEach(function(userIdentity, i) {
                    if (Helpers.inArray(filterList, userIdentity.Type)) {
                        event.UserIdentities.splice(i, 1);

                        if (i > 0) {
                            i--;
                        }
                    }
                });
            }
        },

        filterAttributes = function(event, filterList) {
            var hash;

            if (!filterList) {
                return;
            }

            for (var attrName in event.EventAttributes) {
                if (event.EventAttributes.hasOwnProperty(attrName)) {
                    hash = Helpers.generateHash(event.EventCategory + event.EventName + attrName);

                    if (Helpers.inArray(filterList, hash)) {
                        delete event.EventAttributes[attrName];
                    }
                }
            }
        },
        inFilteredList = function(filterList, hash) {
            if (filterList && filterList.length) {
                if (Helpers.inArray(filterList, hash)) {
                    return true;
                }
            }

            return false;
        },
        forwardingRuleMessageTypes = [
            Types.MessageType.PageEvent,
            Types.MessageType.PageView,
            Types.MessageType.Commerce
        ];

    if (!Helpers.isWebViewEmbedded() && MP.forwarders) {
        hashedName = Helpers.generateHash(event.EventCategory + event.EventName);
        hashedType = Helpers.generateHash(event.EventCategory);

        for (var i = 0; i < MP.forwarders.length; i++) {
            // Check attribute forwarding rule. This rule allows users to only forward an event if a
            // specific attribute exists and has a specific value. Alternatively, they can specify
            // that an event not be forwarded if the specified attribute name and value exists.
            // The two cases are controlled by the "includeOnMatch" boolean value.
            // Supported message types for attribute forwarding rules are defined in the forwardingRuleMessageTypes array

            if (forwardingRuleMessageTypes.indexOf(event.EventDataType) > -1
                && MP.forwarders[i].filteringEventAttributeValue
                && MP.forwarders[i].filteringEventAttributeValue.eventAttributeName
                && MP.forwarders[i].filteringEventAttributeValue.eventAttributeValue) {

                var foundProp = null;

                // Attempt to find the attribute in the collection of event attributes
                if (event.EventAttributes) {
                    for (var prop in event.EventAttributes) {
                        hashedName = Helpers.generateHash(prop);

                        if (hashedName === MP.forwarders[i].filteringEventAttributeValue.eventAttributeName) {
                            foundProp = {
                                name: hashedName,
                                value: Helpers.generateHash(event.EventAttributes[prop])
                            };
                        }

                        break;
                    }
                }

                var isMatch = foundProp !== null && foundProp.value === MP.forwarders[i].filteringEventAttributeValue.eventAttributeValue;

                var shouldInclude = MP.forwarders[i].filteringEventAttributeValue.includeOnMatch === true ? isMatch : !isMatch;

                if (!shouldInclude) {
                    continue;
                }
            }

            // Clone the event object, as we could be sending different attributes to each forwarder
            clonedEvent = {};
            clonedEvent = Helpers.extend(true, clonedEvent, event);
            // Check event filtering rules
            if (event.EventDataType === Types.MessageType.PageEvent
                && (inFilteredList(MP.forwarders[i].eventNameFilters, hashedName)
                    || inFilteredList(MP.forwarders[i].eventTypeFilters, hashedType))) {
                continue;
            }
            else if (event.EventDataType === Types.MessageType.Commerce && inFilteredList(MP.forwarders[i].eventTypeFilters, hashedType)) {
                continue;
            }
            else if (event.EventDataType === Types.MessageType.PageView && inFilteredList(MP.forwarders[i].screenNameFilters, hashedName)) {
                continue;
            }

            // Check attribute filtering rules
            if (clonedEvent.EventAttributes) {
                if (event.EventDataType === Types.MessageType.PageEvent) {
                    filterAttributes(clonedEvent, MP.forwarders[i].attributeFilters);
                }
                else if (event.EventDataType === Types.MessageType.PageView) {
                    filterAttributes(clonedEvent, MP.forwarders[i].pageViewAttributeFilters);
                }
            }

            // Check user identity filtering rules
            filterUserIdentities(clonedEvent, MP.forwarders[i].userIdentityFilters);

            // Check user attribute filtering rules
            filterUserAttributes(clonedEvent, MP.forwarders[i].userAttributeFilters);

            Helpers.logDebug('Sending message to forwarder: ' + MP.forwarders[i].name);
            var result = MP.forwarders[i].process(clonedEvent);

            if (result) {
                Helpers.logDebug(result);
            }
        }
    }
}

function callSetUserAttributeOnForwarders(key, value) {
    if (MP.forwarders.length) {
        MP.forwarders.forEach(function(forwarder) {
            if (forwarder.setUserAttribute &&
                forwarder.userAttributeFilters &&
                !Helpers.inArray(forwarder.userAttributeFilters, Helpers.generateHash(key))) {

                try {
                    var result = forwarder.setUserAttribute(key, value);

                    if (result) {
                        Helpers.logDebug(result);
                    }
                }
                catch (e) {
                    Helpers.logDebug(e);
                }
            }
        });
    }
}

function setForwarderUserIdentities(userIdentities) {
    MP.forwarders.forEach(function(forwarder) {
        var filteredUserIdentities = Helpers.filterUserIdentities(userIdentities, forwarder.userIdentityFilters);
        if (forwarder.setUserIdentity) {
            filteredUserIdentities.forEach(function(identity) {
                var result = forwarder.setUserIdentity(identity.Identity, identity.Type);
                if (result) {
                    Helpers.logDebug(result);
                }
            });
        }
    });
}

module.exports = {
    initForwarders: initForwarders,
    applyToForwarders: applyToForwarders,
    sendEventToForwarders: sendEventToForwarders,
    callSetUserAttributeOnForwarders: callSetUserAttributeOnForwarders,
    setForwarderUserIdentities: setForwarderUserIdentities
};
