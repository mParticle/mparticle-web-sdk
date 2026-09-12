window.MockHttpServer = require('./mockhttprequest.js');
window.Should = require('should');
require('@mparticle/web-sdk');
mParticle.addForwarder = function (forwarder) {
    mParticle.forwarder = new forwarder.constructor();
};
require('../../node_modules/@mparticle/web-kit-wrapper/index.js');
require('../tests.js');
