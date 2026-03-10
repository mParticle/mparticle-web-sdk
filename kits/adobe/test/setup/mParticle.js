var mParticle = require('@mparticle/web-sdk');
mParticle.previousAddForwarder = mParticle.addForwarder;

mParticle.addForwarder = function (forwarder) {
    mParticle.previousAddForwarder(forwarder);
    mParticle.forwarder = new forwarder.constructor();
};