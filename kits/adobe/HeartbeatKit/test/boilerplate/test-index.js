window.should = require('should');
require('../../../node_modules/@mparticle/web-sdk/dist/mparticle.common.js');
mParticle.registerHBK = function(forwarder) {
    mParticle.forwarder = new forwarder.constructor();
};
require('../../src/index.js');
require('../tests.js');
