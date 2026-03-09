window.MockHttpServer = require('./mockhttprequest.js');
window.Should = require('should');
require('@mparticle/web-sdk');

// We need to mock addForwarder b/c we're using multiple dataLayers for GTM
// and the cli version of karma doesn't handle this properly
var self = mParticle;
mParticle.addForwarder = function(forwarder) {
    self.baseForwarder = forwarder.constructor;
    self.forwarders = [];

    self.forwarder = {
        init: function(settings, reporter, testModeBoolean) {
            var _forwarder = new self.baseForwarder();
            _forwarder.init(settings, reporter, testModeBoolean);
            self.forwarders.push(_forwarder);
        },
        process: function(event) {
            self.forwarders.forEach(function(forwarder) {
                forwarder.process(event);
            });
        },
        onLoginComplete: function(user, identityAPIrequest) {
            self.forwarders.forEach(function(forwarder) {
                forwarder.onLoginComplete(user, identityAPIrequest);
            });
        },
        onLogoutComplete: function(user, identityAPIrequest) {
            self.forwarders.forEach(function(forwarder) {
                forwarder.onLogoutComplete(user, identityAPIrequest);
            });
        },
        onModifyComplete: function(user, identityAPIrequest) {
            self.forwarders.forEach(function(forwarder) {
                forwarder.onModifyComplete(user, identityAPIrequest);
            });
        },
        onUserIdentified: function(user, identityAPIrequest) {
            self.forwarders.forEach(function(forwarder) {
                forwarder.onUserIdentified(user, identityAPIrequest);
            });
        },
        onIdentifyComplete: function(user, identityAPIrequest) {
            self.forwarders.forEach(function(forwarder) {
                forwarder.onIdentifyComplete(user, identityAPIrequest);
            });
        },
    };
};
require('./../node_modules/@mparticle/web-kit-wrapper/index.js');
require('./tests.js');
