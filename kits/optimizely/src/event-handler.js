var optimizelyWebXEvents = require('./optimizely-x-defined-events');
var optimizelyFullStackEvents = require('./optimizely-fs-defined-events');
var helpers = require('./helpers');

function EventHandler(common) {
    this.common = common || {};
}

EventHandler.prototype.logEvent = function(event) {
    if (!this.common.useFullStack && optimizelyWebXEvents.events[event.EventName]) {
        var optimizelyWebXEvent = {
            type: 'event',
            eventName: event.EventName
        };

        if (event.EventAttributes) {
            optimizelyWebXEvent.tags = event.EventAttributes;
        }

        if (event.CustomFlags && event.CustomFlags['Optimizely.Value']) {
            optimizelyWebXEvent.tags.value = event.CustomFlags['Optimizely.Value'];
        }
        window['optimizely'].push(optimizelyWebXEvent);
    }

    // if optimizely full stack is being used
    if (this.common.useFullStack && window.optimizelyClientInstance && optimizelyFullStackEvents.events[event.EventName]) {
        var eventKey = event.EventName,
            userId,
            userAttributes = this.common.userAttributes,
            eventTags = {};

        if (window.mParticle && window.mParticle.Identity) {
            userId = helpers.getUserId(this.common.userIdField);
        }

        if (event.EventAttributes) {
            eventTags = event.EventAttributes;
        }

        if (event.CustomFlags && event.CustomFlags['OptimizelyFullStack.Value']) {
            eventTags.value = event.CustomFlags['OptimizelyFullStack.Value'];
        }

        window['optimizelyClientInstance'].track(eventKey, userId, userAttributes, eventTags);
    }
};

EventHandler.prototype.logPageView = function(event) {
    var self = this;

    if (!self.common.useFullStack && optimizelyWebXEvents.pages[event.EventName]) {
        var optimizelyWebXEvent = {
            type: 'page',
            pageName: event.EventName
        };

        if (event.EventAttributes) {
            optimizelyWebXEvent.tags = event.EventAttributes;
        }
        window['optimizely'].push(optimizelyWebXEvent);
    }
};

module.exports = EventHandler;
