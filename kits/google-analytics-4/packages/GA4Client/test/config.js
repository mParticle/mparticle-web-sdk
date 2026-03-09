window.mParticle.addForwarder = function (forwarder) {
    window.mParticle.forwarder = new forwarder.constructor();
};
