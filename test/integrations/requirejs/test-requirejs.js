import fetchMock from 'fetch-mock/esm/client';
import sinon from 'sinon';

describe('Require.JS Pages', function() {
    it('loads mParticle properly', function() {
        var mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith('https://identity.mparticle.com/v1/identify', [
            200,
            {},
            JSON.stringify({ mpid: 'testMPID', is_logged_in: false }),
        ]);

        fetchMock.post('https://jssdks.mparticle.com/v3/JS/test_key/events', 200);

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

        mParticle.init('test_key', window.mParticle.config);

        fetchMock.resetHistory();

        mParticle.logEvent('Test Event1');

        const testEvent = fetchMock.calls()[0];
        const testEventName = JSON.parse(testEvent[1].body).events[0].data.event_name;

        testEventName.should.equal('Test Event1');
    });
});