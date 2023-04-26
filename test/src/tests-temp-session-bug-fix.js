import Utils from './utils';
import sinon from 'sinon';
import { urls, workspaceToken } from './config';
import { apiKey, MPConfig, testMPID, workspaceCookieName } from './config';

var setLocalStorage = Utils.setLocalStorage,
    mockServer;

    function findEventFromBatchTemp(batch, eventName) {
        if (batch.events.length) {
            return batch.events.find(function(event) {
                switch (event.event_type) {
                    case 'commerce_event':
                        if (event.data.product_action) {
                            return event.data.product_action.action === eventName;
                        }
                        else if (event.data.promotion_action) {
                            // return the promotion action
                            return true;
                        } else {
                            // all commerce_events that do not have product_action
                            // or promotion_action are impression actions
                            return true;
                        }
                    case 'custom_event':
                        return event.data.event_name === eventName;
                    case 'crash_report':
                        return true;
                    default:
                        // all other events are lifecycle events (session start, end, AST)
                        return event.event_type === eventName
                }
            })
        }
        return null;
    }

    function findRequestTemp(requests, eventName) {
        var matchingRequest;
        requests.forEach(function(request) {
            var batch = JSON.parse(request[1].body);
            for (var i = 0; i<batch.events.length; i++) {
                var foundEventFromBatch = findEventFromBatchTemp(batch, eventName);
                if (foundEventFromBatch) {
                    matchingRequest = request;
                    break;
                }
            }
        })

        return matchingRequest;
    }

    function findBatchTemp(requests, eventName) {
        var request = findRequestTemp(requests, eventName);
        if (request) {
            return JSON.parse(findRequestTemp(requests, eventName)[1].body);
        } else {
            return null;
        }

    }

    function findEventFromRequestTemp(requests, eventName) {
        var batch = findBatchTemp(requests, eventName);
        if (batch) {
            return findEventFromBatchTemp(batch, eventName);
        } else {
            return null;
        }

    }
// TODO: Remove this block once V2 is removed from 
describe('session bug fix test', function() {
    beforeEach(function() {
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        window.mParticle.config = {
            workspaceToken: workspaceToken,
            logLevel: 'none',
            kitConfigs: [],
            requestConfig: false,
            isDevelopmentMode: false,
            flags: {
                eventsV3: '100',
                eventBatchingIntervalMillis: 0,
            }
        };

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);
        window.fetchMock.post(urls.eventsV3, 200);
        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        mockServer.reset();
        mParticle._resetForTests(MPConfig);
    });

    it('creates a new session when elapsed time between actions is greater than session timeout', function(done) {
        mParticle._resetForTests(MPConfig);
        var clock = sinon.useFakeTimers();
        mParticle.config.sessionTimeout = 1;
        mParticle.init(apiKey, window.mParticle.config);
        clock.tick(100);

        mParticle.logEvent('Test Event');
        var testEvent = findEventFromRequestTemp(window.fetchMock._calls, 'Test Event');

        clock.tick(70000);

        mParticle.logEvent('Test Event2');
        var testEvent2 = findEventFromRequestTemp(window.fetchMock._calls, 'Test Event2');
        testEvent.data.session_uuid.should.not.equal(testEvent2.data.session_uuid);
        mParticle.getInstance()._SessionManager.clearSessionTimeout(); clock.restore();

        done();
    });

    it('should end session when last event sent is outside of sessionTimeout', function(done) {
        mParticle._resetForTests(MPConfig);
        var clock = sinon.useFakeTimers();
        mParticle.config.sessionTimeout = 1;
        mParticle.init(apiKey, window.mParticle.config);
        clock.tick(100);
        mParticle.logEvent('Test Event');

        clock.tick(10000);
        mParticle.logEvent('Test Event2');

        clock.tick(120000);
        mParticle.logEvent('Test Event3');

        clock.tick(150000);

        var testEvent = findEventFromRequestTemp(window.fetchMock._calls, 'Test Event');
        var testEvent2 = findEventFromRequestTemp(window.fetchMock._calls, 'Test Event2');
        var testEvent3 = findEventFromRequestTemp(window.fetchMock._calls, 'Test Event3');
        
        testEvent2.data.session_uuid.should.equal(testEvent.data.session_uuid);
        testEvent3.data.session_uuid.should.not.equal(testEvent.data.session_uuid);
        clock.restore();
        done();

    });

    it('should not end session when end session is called within sessionTimeout timeframe', function(done) {
       // This test mimics if another tab is open and events are sent, but previous tab's sessionTimeout is still ongoing
        mParticle._resetForTests(MPConfig);
        var clock = sinon.useFakeTimers();
        mParticle.config.sessionTimeout = 1;
        mParticle.init(apiKey, window.mParticle.config);

        clock.tick(100);
        mParticle.logEvent('Test Event');

        // This clock tick initiates a session end event that is successful
        clock.tick(70000);

        var sessionEndEvent = findEventFromRequestTemp(window.fetchMock._calls, 'session_end');
        Should(sessionEndEvent).be.ok();

        window.fetchMock._calls = [];
        clock.tick(100);
        mParticle.logEvent('Test Event2');

        var sid = mParticle.getInstance()._Persistence.getLocalStorage().gs.sid;

        var new_Persistence = {
            gs: {
                sid: sid,
                ie: 1,
                les: 120000,
            },
        };
        setLocalStorage(workspaceCookieName, new_Persistence);
        // // This clock tick initiates a session end event that is not successful
        clock.tick(70000);

        sessionEndEvent = findEventFromRequestTemp(window.fetchMock._calls, 'session_end');

        Should(sessionEndEvent).not.be.ok();
        var testEvent2 = findEventFromRequestTemp(window.fetchMock._calls, 'Test Event2');

        mParticle.logEvent('Test Event3');

        var testEvent3 = findEventFromRequestTemp(window.fetchMock._calls, 'Test Event3');

        testEvent3.data.session_uuid.should.equal(testEvent2.data.session_uuid);

        clock.restore();
        done();
    });

    it('should update session start date when manually ending session then starting a new one', function(done) {
        mParticle.logEvent('Test Event');

        var testEvent = findEventFromRequestTemp(window.fetchMock._calls, 'Test Event');
        var testEventSessionStartTime = testEvent.data.session_start_unixtime_ms;

        mParticle.endSession();

        var sessionEndEvent = findEventFromRequestTemp(window.fetchMock._calls, 'session_end');
        var sessionEndEventSessionStartDate = sessionEndEvent.data.session_start_unixtime_ms;
        sessionEndEventSessionStartDate.should.equal(testEventSessionStartTime);

        mParticle.logEvent('Test Event2');

        var testEvent2 = findEventFromRequestTemp(window.fetchMock._calls, 'Test Event2');

        var testEvent2SessionStartDate = testEvent2.data.session_start_unixtime_ms;
        testEvent2SessionStartDate.should.be.above(sessionEndEventSessionStartDate);

        done();

    });

    it('should update session start date when session times out,then starting a new one', function(done) {
        mParticle._resetForTests(MPConfig);
        mParticle.config.sessionTimeout = 1;

        var clock = sinon.useFakeTimers();
        mParticle.init(apiKey, mParticle.config);

        clock.tick(10);

        mParticle.logEvent('Test Event');
        var testEvent = findEventFromRequestTemp(window.fetchMock._calls, 'Test Event');
        var testEventSessionStartDate = testEvent.data.session_start_unixtime_ms;

        // trigger session timeout which ends session automatically
        clock.tick(60000);

        // note to self - session end event not being triggered, could be the same bug
        var sessionEndEvent = findEventFromRequestTemp(window.fetchMock._calls, 'session_end');
        var sessionEndEventSessionStartDate = sessionEndEvent.data.session_start_unixtime_ms;
        sessionEndEventSessionStartDate.should.equal(testEventSessionStartDate);

        clock.tick(100);

        mParticle.logEvent('Test Event2');
        var testEvent2 = findEventFromRequestTemp(window.fetchMock._calls, 'Test Event2');

        var testEvent2SessionStartDate = testEvent2.data.session_start_unixtime_ms;
        testEvent2SessionStartDate.should.be.above(sessionEndEventSessionStartDate);

        clock.restore();

        done();
    });
    
    it('should remove cookies when calling reset', function(done) {
        mParticle._resetForTests(MPConfig);

        window.mParticle.config.useCookieStorage = true;
        window.mParticle.config.workspaceToken = 'defghi';
        mParticle.init(apiKey, window.mParticle.config)

        var cookie = document.cookie;
        cookie.includes('mprtcl-v4_defghi').should.equal(true);
        mParticle.reset();

        cookie = document.cookie;
        
        cookie.includes('mprtcl-v4_defghi').should.equal(false);
        
        window.mParticle.config.useCookieStorage = false;
        done();
    });

    it('should store all MPIDs associated with a sessionId, then clear MPIDs from currentSessionMPIDs when a new session starts', function(done) {
        mockServer.respondWith(urls.login, [
            200,
            {},
            JSON.stringify({ mpid: 'otherMPID', is_logged_in: false }),
        ]);

        mParticle.Identity.login();
        var localStorageDataBeforeSessionEnd = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();

        localStorageDataBeforeSessionEnd.gs.csm.length.should.equal(2);

        mParticle.endSession();
        var localStorageDataAfterSessionEnd1 = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        localStorageDataAfterSessionEnd1.gs.should.not.have.property('csm');

        mParticle.logEvent('hi');
        mParticle.Identity.login();

        var localStorageAfterLoggingEvent = mParticle
            .getInstance()
            ._Persistence.getLocalStorage();
        localStorageAfterLoggingEvent.gs.csm.length.should.equal(1);

        done();
    });
});