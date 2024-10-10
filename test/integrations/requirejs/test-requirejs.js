import fetchMock from 'fetch-mock/esm/client';

const waitForCondition = function async(
        conditionFn,
        timeout = 200,
        interval = 10
    ) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            (function poll() {
                if (conditionFn()) {
                    return resolve(undefined);
                } else if (Date.now() - startTime > timeout) {
                    return reject(new Error('Timeout waiting for condition'));
                } else {
                    setTimeout(poll, interval);
                }
            })();
        });
    },
    fetchMockSuccess = function (url, body) {
        fetchMock.post(
            url,
            {
                status: 200,
                body: JSON.stringify(body),
            },
            { overwriteRoutes: true }
        );
    },
    hasIdentifyReturned = () => {
        return window.mParticle.Identity.getCurrentUser()?.getMPID() === 'testMPID';
};

describe('Require.JS Pages', function() {
    it('loads mParticle properly', function() {
        fetchMockSuccess('https://identity.mparticle.com/v1/identify', {
            mpid: 'testMPID', is_logged_in: false
        });

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
        waitForCondition(hasIdentifyReturned).then(() => {
        fetchMock.resetHistory();

        mParticle.logEvent('Test Event1');

        const testEvent = fetchMock.calls()[0];
        const testEventName = JSON.parse(testEvent[1].body).events[0].data.event_name;

        testEventName.should.equal('Test Event1');
        })
    });
});