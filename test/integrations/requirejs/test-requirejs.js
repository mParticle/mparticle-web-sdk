describe('Require.JS Pages', function() {
    it('loads mParticle properly', function() {
        var server = new MockHttpServer();
        server.start();
        window.fetchMock.post('https://jssdks.mparticle.com/v3/JS/test_key/events', 200);
        window.mParticle = window.mParticle || {};
        window.mParticle.config = {
            workspaceToken: 'fooToken',
            logLevel: 'none',
            requestConfig: false,
            isDevelopmentMode: false,
            flags: {
                eventBatchingIntervalMillis: 0,
            }
        };

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

        mParticle.init('test_key', window.mParticle.config);

        window.fetchMock._calls = [];

        mParticle.logEvent('Test Event1');

        const testEvent = window.fetchMock._calls[0];
        const testEventName = JSON.parse(testEvent[1].body).events[0].data.event_name;

        testEventName.should.equal('Test Event1');
    });
});