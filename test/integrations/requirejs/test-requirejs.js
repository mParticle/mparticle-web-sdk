describe('Require.JS Pages', function() {
    it('loads mParticle properly', function() {
        var server = new MockHttpServer();
        server.start();

        server.handle = function(request) {
            request.setResponseHeader('Content-Type', 'application/json');
            request.receive(
                200,
                JSON.stringify({
                    Store: {},
                    mpid: 'testMPID',
                })
            );
        };

        mParticle.init('fakeapikey', { requestConfig: false });
        server.requests = [];
        mParticle.logEvent('test event');
        assert.isDefined(mParticle, 'mParticle should be defined');
        assert(
            JSON.parse(server.requests[0].requestText).n === 'test event',
            'Request has the proper test event'
        );
    });
});
