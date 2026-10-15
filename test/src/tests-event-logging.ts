import Utils from './config/utils';
import sinon from 'sinon';
import fetchMock from 'fetch-mock/esm/client';
import { expect } from 'chai';
import Should from 'should';
import {
    urls,
    apiKey,
    testMPID,
    MPConfig,
    MessageType,
} from './config/constants';
import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';
import { TransactionAttributes } from '@mparticle/web-sdk';

const { findEventFromRequest, findBatch, getIdentityEvent, waitForCondition, fetchMockSuccess, hasIdentifyReturned } = Utils;

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
    }
}

const mParticle = window.mParticle as IMParticleInstanceManager;

function parseFetchJson(body: unknown) {
    return JSON.parse(body as string);
}

describe('event logging', function() {
    beforeEach(function() {
        mParticle._resetForTests(MPConfig);
        fetchMock.post(urls.events, 200);
        delete mParticle._instances['default_instance'];
        
        fetchMockSuccess(urls.identify, {
            mpid: testMPID, is_logged_in: false
        });
        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        fetchMock.restore();
        sinon.restore();
    });

    it('should log an event', async () => {
        await waitForCondition(hasIdentifyReturned);

        window.mParticle.logEvent(
            'Test Event',
            mParticle.EventType.Navigation,
            { mykey: 'myvalue' }
        );
        const testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');
        const testEventBatch = findBatch(fetchMock.calls(), 'Test Event');

        testEvent.data.should.have.property('event_name', 'Test Event');
        testEvent.data.should.have.property('custom_event_type', 'navigation');
        testEvent.data.should.have.property('custom_attributes');
        testEvent.data.custom_attributes.should.have.property(
            'mykey',
            'myvalue'
        );

        testEventBatch.should.have.property('mpid', testMPID);
    });

    it('should log an event with new device id when set on setDeviceId', async () => {
        await waitForCondition(hasIdentifyReturned);

        window.mParticle.logEvent(
            'Test Event',
            mParticle.EventType.Navigation,
            { mykey: 'myvalue' }
        );

        const testEventBatch = findBatch(fetchMock.calls(), 'Test Event');
        // this das should be the SDK auto generated one, which is 36 characters long
        testEventBatch.mp_deviceid.should.have.length(36);

        mParticle.setDeviceId('foo-guid');

        window.mParticle.logEvent('Test Event2');
        const testEvent2Batch = findBatch(fetchMock.calls(), 'Test Event2');

        // das should be the one passed to setDeviceId()
        testEvent2Batch.should.have.property('mp_deviceid', 'foo-guid');
    });

    it('should log an event with new device id when set via mParticle.config', async () => {
        mParticle._resetForTests(MPConfig);
        
        window.mParticle.config.deviceId = 'foo-guid';
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);

        window.mParticle.logEvent('Test Event');
        const testEventBatch = findBatch(fetchMock.calls(), 'Test Event');

        // this das should be the SDK auto generated one
        testEventBatch.should.have.property('mp_deviceid', 'foo-guid');
    });

    it('should allow an event to bypass server upload', async () => {
        await waitForCondition(hasIdentifyReturned);

        window.mParticle.logEvent(
            'Test Standard Upload',
            mParticle.EventType.Navigation,
            { mykey: 'myvalue' },
            {},
            {
                shouldUploadEvent: true,
            }
        );

        window.mParticle.logEvent(
            'Test Upload Bypass',
            mParticle.EventType.Navigation,
            { mykey: 'myvalue' },
            {},
            {
                shouldUploadEvent: false,
            }
        );

        const uploadEvent = findEventFromRequest(
            fetchMock.calls(),
            'Test Standard Upload'
        );
        const uploadEventBatch = findBatch(
            fetchMock.calls(),
            'Test Standard Upload'
        );

        const bypassedEvent = findEventFromRequest(
            fetchMock.calls(),
            'Test Upload Bypass'
        );

        uploadEvent.should.be.ok();
        uploadEvent.data.should.have.property(
            'event_name',
            'Test Standard Upload'
        );
        uploadEvent.data.should.have.property(
            'custom_event_type',
            'navigation'
        );
        uploadEvent.data.should.have.property('custom_attributes');
        uploadEvent.data.custom_attributes.should.have.property(
            'mykey',
            'myvalue'
        );
        uploadEventBatch.should.have.property('mpid', testMPID);

        Should(bypassedEvent).not.be.ok();
    });

    it('should allow an event to bypass server upload via logBaseEvent', async () => {
        await waitForCondition(hasIdentifyReturned);

        window.mParticle.logBaseEvent(
            {
                name: 'Test Standard Upload',
                messageType: MessageType.PageEvent,
                eventType: mParticle.EventType.Navigation,
                data: { mykey: 'myvalue' },
                customFlags: {},
            },
            {
                shouldUploadEvent: true,
            }
        );

        window.mParticle.logBaseEvent(
            {
                name: 'Test Upload Bypass',
                messageType: MessageType.PageEvent,
                eventType: mParticle.EventType.Navigation,
                data: { mykey: 'myvalue' },
                customFlags: {},
            },
            {
                shouldUploadEvent: false,
            }
        );

        const uploadEvent = findEventFromRequest(
            fetchMock.calls(),
            'Test Standard Upload'
        );
        const uploadEventBatch = findBatch(
            fetchMock.calls(),
            'Test Standard Upload'
        );

        const bypassedEvent = findEventFromRequest(
            fetchMock.calls(),
            'Test Upload Bypass'
        );

        uploadEvent.should.be.ok();

        uploadEvent.data.should.have.property(
            'event_name',
            'Test Standard Upload'
        );
        uploadEvent.data.should.have.property(
            'custom_event_type',
            'navigation'
        );
        uploadEvent.data.should.have.property('custom_attributes');
        uploadEvent.data.custom_attributes.should.have.property(
            'mykey',
            'myvalue'
        );
        uploadEventBatch.should.have.property('mpid', testMPID);

        Should(bypassedEvent).not.be.ok();
    });

    it('should log an error', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.logError('my error' as any);

        const errorEvent = findEventFromRequest(fetchMock.calls(), 'my error');

        Should(errorEvent).be.ok();

        errorEvent.data.should.have.property('message', 'Error');
        errorEvent.data.should.have.property('custom_attributes');
        errorEvent.data.custom_attributes.should.have.property('m', 'my error');
    });

    it('should log an error with name, message, stack', async () => {
        await waitForCondition(hasIdentifyReturned);

        const error = new Error('my error');
        error.stack = 'my stacktrace';

        mParticle.logError(error);

        const errorEvent = findEventFromRequest(fetchMock.calls(), 'my error');

        Should(errorEvent).be.ok();

        errorEvent.data.should.have.property('message', 'Error');
        errorEvent.data.should.have.property('custom_attributes');
        errorEvent.data.custom_attributes.should.have.property('m', 'my error');
        errorEvent.data.custom_attributes.should.have.property('s', 'Error');
        errorEvent.data.custom_attributes.should.have.property(
            't',
            'my stacktrace'
        );
    });

    it('should log an error with custom attrs', async () => {
        await waitForCondition(hasIdentifyReturned);

        const error = new Error('my error');
        error.stack = 'my stacktrace';

        mParticle.logError(error, { location: 'my path', myData: 'my data' });

        const errorEvent = findEventFromRequest(fetchMock.calls(), 'my error');

        Should(errorEvent).be.ok();
        errorEvent.data.should.have.property('message', 'Error');
        errorEvent.data.should.have.property('custom_attributes');
        errorEvent.data.custom_attributes.should.have.property(
            'location',
            'my path'
        );
        errorEvent.data.custom_attributes.should.have.property(
            'myData',
            'my data'
        );
    });

    it('should sanitize error custom attrs', async () => {
        await waitForCondition(hasIdentifyReturned);

        const bond = sinon.spy(mParticle.getInstance().Logger, 'warning');
        mParticle.logError('my error' as any, {
            invalid: ['my invalid attr'],
            valid: 10,
        } as any);

        const errorEvent = findEventFromRequest(fetchMock.calls(), 'my error');

        Should(errorEvent).be.ok();
        errorEvent.data.should.have.property('message', 'Error');
        errorEvent.data.should.have.property('custom_attributes');
        errorEvent.data.custom_attributes.should.have.property('valid', 10);
        errorEvent.data.custom_attributes.should.not.have.property('invalid');

        bond.called.should.eql(true);
        bond.callCount.should.equal(1);

        bond.getCalls()[0].args[0].should.eql(
            "For 'my error', the corresponding attribute value of 'invalid' must be a string, number, boolean, or null."
        );
    });

    it('should log an AST with firstRun = true when first visiting a page, and firstRun = false when reloading the page', async () => {
        await waitForCondition(hasIdentifyReturned);

        const astEvent = findEventFromRequest(
            fetchMock.calls(),
            'application_state_transition'
        );

        astEvent.data.should.have.property(
            'application_transition_type',
            'application_initialized'
        );
        astEvent.data.should.have.property('is_first_run', true);
        astEvent.data.should.have.property('is_upgrade', false);

        if (document.referrer && document.referrer.length > 0) {
            astEvent.data.should.have.property(
                'launch_referral',
                window.location.href
            );
        }

        fetchMock.resetHistory();

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });

        const astEvent2 = findEventFromRequest(
            fetchMock.calls(),
            'application_state_transition'
        );

        astEvent2.data.should.have.property('is_first_run', false);
    });

    it('should log an AST on init with firstRun = false when cookies already exist', async () => {
        await waitForCondition(hasIdentifyReturned);

        // cookies currently exist, mParticle.init called from beforeEach
        fetchMock.resetHistory();
        // log second AST
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });

        mParticle.init(apiKey, window.mParticle.config);

        const astEvent = findEventFromRequest(
            fetchMock.calls(),
            'application_state_transition'
        );
        astEvent.data.should.have.property('is_first_run', false);
    });

    it('should log a page view', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.logPageView();

        const pageViewEvent = findEventFromRequest(
            fetchMock.calls(),
            'screen_view'
        );

        Should(pageViewEvent).be.ok();

        pageViewEvent.data.should.have.property('custom_attributes');
        pageViewEvent.data.custom_attributes.should.have.property(
            'hostname',
            window.location.hostname
        );
        pageViewEvent.data.custom_attributes.should.have.property(
            'title',
            window.document.title
        );
    });

    it('should log custom page view', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.logPageView(
            'My Page View',
            { testattr: 1 },
            {
                'MyCustom.Flag': 'Test',
            }
        );

        const pageViewEvent = findEventFromRequest(
            fetchMock.calls(),
            'My Page View'
        );

        Should(pageViewEvent).be.ok();

        pageViewEvent.data.should.have.property('custom_attributes');
        pageViewEvent.data.should.have.property('screen_name', 'My Page View');
        pageViewEvent.data.custom_attributes.should.have.property(
            'testattr',
            1
        );
        pageViewEvent.data.custom_flags.should.have.property(
            'MyCustom.Flag',
            'Test'
        );
    });

    it('should pass custom flags in page views', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.logPageView('test', null, {
            'MyCustom.Flag': 'Test',
        });

        const pageViewEvent = findEventFromRequest(
            fetchMock.calls(),
            'test'
        );

        Should(pageViewEvent).be.ok();

        pageViewEvent.data.should.have.property('custom_flags');
        pageViewEvent.data.custom_flags.should.have.property(
            'MyCustom.Flag',
            'Test'
        );
    });

    it('should allow a page view to bypass server upload', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.logPageView('test bypass', null, null, {
            shouldUploadEvent: false,
        });

        const pageViewEvent = findEventFromRequest(
            fetchMock.calls(),
            'test bypass'
        );

        Should(pageViewEvent).not.be.ok();
    });

    it('should not log a PageView event if there are invalid attrs', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.logPageView('test1', 'invalid' as any, null);
        const pageViewEvent = findEventFromRequest(
            fetchMock.calls(),
            'test1'
        );

        Should(pageViewEvent).not.be.ok();
    });

    it('should not log an event that has an invalid customFlags', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.logPageView('test', null, 'invalid' as any);

        const pageViewEvent = findEventFromRequest(
            fetchMock.calls(),
            'test'
        );
        Should(pageViewEvent).not.be.ok();
    });

    it('should log event with name PageView when an invalid event name is passed', async () => {
        await waitForCondition(hasIdentifyReturned);

        fetchMock.resetHistory();

        mParticle.logPageView(null as any);
        fetchMock.calls().length.should.equal(1);
        const pageViewEvent = findEventFromRequest(
            fetchMock.calls(),
            'screen_view'
        );
        pageViewEvent.data.screen_name.should.equal('PageView');

        fetchMock.resetHistory();
        mParticle.logPageView({ test: 'test' } as any);
        fetchMock.calls().length.should.equal(1);
        const pageViewEvent2 = findEventFromRequest(
            fetchMock.calls(),
            'screen_view'
        );
        pageViewEvent2.data.screen_name.should.equal('PageView');

        fetchMock.resetHistory();
        mParticle.logPageView([1, 2, 3] as any);
        fetchMock.calls().length.should.equal(1);
        const pageViewEvent3 = findEventFromRequest(
            fetchMock.calls(),
            'screen_view'
        );
        pageViewEvent3.data.screen_name.should.equal('PageView');
    });

    describe('automatic page view (AutoLogPageView feature flag)', () => {
        it('should not log a page view on init when the flag is absent', async () => {
            // Baseline: the default (flag-off) init should fire no PageView.
            await waitForCondition(hasIdentifyReturned);

            const pageViewEvent = findEventFromRequest(
                fetchMock.calls(),
                'screen_view'
            );

            Should(pageViewEvent).not.be.ok();
        });

        it('should not log a page view on init when the flag is not "True"', async () => {
            mParticle._resetForTests(MPConfig);

            window.mParticle.config.flags = {
                autoLogPageView: 'False',
            };

            mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            const pageViewEvent = findEventFromRequest(
                fetchMock.calls(),
                'screen_view'
            );

            Should(pageViewEvent).not.be.ok();
        });

        it('should log exactly one page view on init when the flag is "True"', async () => {
            mParticle._resetForTests(MPConfig);

            window.mParticle.config.flags = {
                autoLogPageView: 'True',
            };

            mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            const pageViewBatch = findBatch(fetchMock.calls(), 'screen_view');
            const pageViewEvents = pageViewBatch.events.filter(
                (event) => event.event_type === 'screen_view'
            );

            // Exactly one auto page view should be logged.
            pageViewEvents.length.should.equal(1);

            const pageViewEvent = pageViewEvents[0];
            pageViewEvent.data.screen_name.should.equal('PageView');
            pageViewEvent.data.should.have.property('custom_attributes');
            pageViewEvent.data.custom_attributes.should.have.property(
                'hostname',
                window.location.hostname
            );
            pageViewEvent.data.custom_attributes.should.have.property(
                'title',
                window.document.title
            );
        });

        it('should log the auto page view after the application state transition', async () => {
            mParticle._resetForTests(MPConfig);

            window.mParticle.config.flags = {
                autoLogPageView: 'True',
            };

            mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            // The auto page view fires via _Events.logPageView right after
            // logAST(). During init each lifecycle event is uploaded as its own
            // batch, so we assert ordering across the sequence of upload
            // requests: the screen_view must be sent after the AST (and must
            // reach the server at all, rather than being stranded on the
            // readyQueue).
            const eventTypeSequence = fetchMock
                .calls()
                .filter((call) => call[1].method.toLowerCase() === 'post')
                .map((call) => parseFetchJson(call[1].body))
                .filter((body) => body.events)
                .flatMap((body) => body.events.map((event) => event.event_type));

            const astIndex = eventTypeSequence.indexOf(
                'application_state_transition'
            );
            const pageViewIndex = eventTypeSequence.indexOf('screen_view');

            pageViewIndex.should.be.above(-1);
            astIndex.should.be.above(-1);
            pageViewIndex.should.be.above(astIndex);
        });

        it('should expose _Events.logPageView that logs the default PageView', async () => {
            await waitForCondition(hasIdentifyReturned);

            mParticle.getInstance()._Events.logPageView();

            const pageViewEvent = findEventFromRequest(
                fetchMock.calls(),
                'screen_view'
            );

            Should(pageViewEvent).be.ok();
            pageViewEvent.data.screen_name.should.equal('PageView');
            pageViewEvent.data.custom_attributes.should.have.property(
                'hostname',
                window.location.hostname
            );
            pageViewEvent.data.custom_attributes.should.have.property(
                'title',
                window.document.title
            );
        });

        it('should not log a duplicate page view when init() is called again (SPA re-init)', async () => {
            mParticle._resetForTests(MPConfig);
            window.mParticle.config.flags = { autoLogPageView: 'True' };

            // First init — one page view fires for the initial page load.
            mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            const firstInitPageViewBatch = findBatch(fetchMock.calls(), 'screen_view');
            const firstInitPageViews = firstInitPageViewBatch.events.filter(
                event => event.event_type === 'screen_view'
            );
            firstInitPageViews.length.should.equal(1);

            // Simulate a SPA framework calling mParticle.init() again on navigation.
            fetchMock.resetHistory();
            fetchMock.post(urls.events, 200, { overwriteRoutes: true });
            fetchMockSuccess(urls.identify, { mpid: testMPID, is_logged_in: false });

            mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(() => mParticle.getInstance()?._Store?.identityCallInFlight === false);

            // No duplicate page view should fire — the PageViewTracker already
            // owns navigation tracking after the first init.
            const reInitPageViewEvent = findEventFromRequest(
                fetchMock.calls(),
                'screen_view'
            );
            Should(reInitPageViewEvent).not.be.ok();
        });

        it('should not log a duplicate page view when a fresh module replaces the tracker (Next.js module re-evaluation)', async () => {
            mParticle._resetForTests(MPConfig);
            window.mParticle.config.flags = { autoLogPageView: 'True' };

            // First init — one page view fires; window.__mpApv__ now holds both
            // the tracker and initialPageViewFired.
            mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            const firstBatch = findBatch(fetchMock.calls(), 'screen_view');
            firstBatch.events.filter(e => e.event_type === 'screen_view').length.should.equal(1);

            // Simulate Next.js module re-evaluation: a fresh module creates a new
            // SDK instance with no _PageViewTracker, while window.__mpApv__ survives
            // from the previous load.
            const staleTracker = mParticle.getInstance()._PageViewTracker;
            mParticle.getInstance()._PageViewTracker = undefined;

            fetchMock.resetHistory();
            fetchMock.post(urls.events, 200, { overwriteRoutes: true });
            fetchMockSuccess(urls.identify, { mpid: testMPID, is_logged_in: false });

            // Fresh-module init: should create a new tracker, tear down the stale
            // one via the window singleton, and skip logPageView (flag already set).
            mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(() => mParticle.getInstance()?._Store?.identityCallInFlight === false);

            // Stale tracker must have been torn down.
            Should(staleTracker.isActive).not.be.ok();

            // No duplicate page view from the fresh-module init.
            const freshModulePageViewEvent = findEventFromRequest(
                fetchMock.calls(),
                'screen_view'
            );
            Should(freshModulePageViewEvent).not.be.ok();
        });
    });

    it('should log opt out', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.setOptOut(true);

        const optOutEvent = findEventFromRequest(fetchMock.calls(), 'opt_out');

        optOutEvent.event_type.should.equal('opt_out');
        optOutEvent.data.should.have.property('is_opted_out', true);
    });

    it('log event requires name', async () => {
        await waitForCondition(hasIdentifyReturned);

        fetchMock.resetHistory();
        (mParticle.logEvent as any)();
        
        fetchMock.calls().should.have.lengthOf(0);
    });

    it('log event requires valid event type', async () => {
        await waitForCondition(hasIdentifyReturned);

        fetchMock.resetHistory();

        mParticle.logEvent('test', 100 as any);

        fetchMock.calls().should.have.lengthOf(0);
    });

    it('event attributes must be object', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.logEvent('Test Event', null, 1 as any);
        
        const testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');
        
        testEvent.data.should.have.property('custom_attributes', null);
    });

    it('opting out should prevent events being sent', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.setOptOut(true);
        fetchMock.resetHistory();

        mParticle.logEvent('test');
        fetchMock.calls().should.have.lengthOf(0);
    });

    it('after logging optout, and reloading, events still should not be sent until opt out is enabled when using local storage', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.setOptOut(true);
        fetchMock.resetHistory();

        mParticle.logEvent('test');
        fetchMock.calls().should.have.lengthOf(0);

        mParticle.setOptOut(false);

        mParticle.init(apiKey, window.mParticle.config);
        fetchMock.resetHistory();

        mParticle.logEvent('test');
        fetchMock.calls().should.have.lengthOf(1);

        mParticle.setOptOut(true);
        mParticle.init(apiKey, window.mParticle.config);
        fetchMock.resetHistory();

        mParticle.logEvent('test');
        fetchMock.calls().should.have.lengthOf(0);
    });

    it('after logging optout, and reloading, events still should not be sent until opt out is enabled when using cookie storage', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.config.useCookieStorage = true;
        mParticle.init(apiKey, window.mParticle.config);
        mParticle.setOptOut(true);
        fetchMock.resetHistory();

        mParticle.logEvent('test');
        fetchMock.calls().should.have.lengthOf(0);

        mParticle.setOptOut(false);

        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });

        fetchMock.resetHistory();
        mParticle.logEvent('test');
        fetchMock.calls().should.have.lengthOf(1);
        
        mParticle.setOptOut(true);
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });

        fetchMock.resetHistory();
        mParticle.logEvent('test');
        fetchMock.calls().should.have.lengthOf(0);
    });

    it('should log identify event', async () => {
        fetchMockSuccess(urls.identify, {
                mpid: testMPID, is_logged_in: false
            });
        await waitForCondition(hasIdentifyReturned);
        fetchMock.resetHistory();

        mParticle.Identity.identify();
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });

        const identityCalls = fetchMock.calls().filter(call => 
            call[0].includes('/identify')
        );

        expect(identityCalls.length).to.equal(1);
        const data = parseFetchJson(identityCalls[0][1].body);
        data.should.have.properties(
            'client_sdk',
            'environment',
            'known_identities',
            'previous_mpid',
            'request_id',
            'request_timestamp_ms',
            'context'
        );
    });

    it('should log logout event', async () => {
        fetchMockSuccess(urls.logout, {
            mpid: 'logoutMPID', is_logged_in: false
        });

        await waitForCondition(hasIdentifyReturned);

        mParticle.Identity.logout();
        await waitForCondition(() => {
            return (
                mParticle.Identity.getCurrentUser()?.getMPID() === 'logoutMPID'
            );
        });

        const data = getIdentityEvent(fetchMock.calls(), 'logout');
        data.should.have.properties(
            'client_sdk',
            'environment',
            'known_identities',
            'previous_mpid',
            'request_id',
            'request_timestamp_ms',
            'context'
        );
    });

    it('should log login event', async () => {
        fetchMockSuccess(urls.login, {
            mpid: 'loginMPID', is_logged_in: false
        });

        await waitForCondition(hasIdentifyReturned);

        mParticle.Identity.login();
        await waitForCondition(() => {
            return (
                mParticle.Identity.getCurrentUser()?.getMPID() === 'loginMPID'
            );
        });

        const data = getIdentityEvent(fetchMock.calls(), 'login');
        data.should.have.properties(
            'client_sdk',
            'environment',
            'known_identities',
            'previous_mpid',
            'request_id',
            'request_timestamp_ms',
            'context'
        );
    });

    it('should log modify event', async () => {
        await waitForCondition(hasIdentifyReturned);

        fetchMockSuccess(urls.modify, {
            change_results: [
                    {
                        identity_type: 'email',
                        modified_mpid: testMPID,
                    },
                ]
        });
        mParticle.Identity.modify();
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });

        const data = getIdentityEvent(fetchMock.calls(), 'modify');
        data.should.have.properties(
            'client_sdk',
            'environment',
            'identity_changes',
            'request_id',
            'request_timestamp_ms',
            'context'
        );
    });

    it('should send das with each event logged', async () => {
        await waitForCondition(hasIdentifyReturned);

        window.mParticle.logEvent('Test Event');
        const testEventBatch = findBatch(fetchMock.calls(), 'Test Event');

        testEventBatch.should.have.property('mp_deviceid');
        testEventBatch.mp_deviceid.length.should.equal(36);
    });

    it('should send consent state with each event logged', async () => {
        await waitForCondition(hasIdentifyReturned);
        const consentState = mParticle.Consent.createConsentState();
        consentState.addGDPRConsentState(
            'foo purpose',
            mParticle.Consent.createGDPRConsent(
                true,
                10,
                'foo document',
                'foo location',
                'foo hardwareId'
            )
        );
        mParticle.Identity.getCurrentUser().setConsentState(consentState);

        window.mParticle.logEvent('Test Event');
        const testEvent = findBatch(fetchMock.calls(), 'Test Event');

        testEvent.should.have.property('consent_state');
        testEvent.consent_state.should.have.property('gdpr');
        testEvent.consent_state.gdpr.should.have.property('foo purpose');

        const purpose = testEvent.consent_state.gdpr['foo purpose'];
        purpose.should.have.property('timestamp_unixtime_ms', 10);
        purpose.should.have.property('document', 'foo document');
        purpose.should.have.property('location', 'foo location');
        purpose.should.have.property('hardware_id', 'foo hardwareId');

        mParticle.Identity.getCurrentUser().setConsentState(null);

        window.mParticle.logEvent('Test Event2');
        const testEvent2 = findBatch(fetchMock.calls(), 'Test Event2');

        testEvent2.should.have.property('consent_state', null);

    });

    it('should log integration attributes with each event', async () => {
        await waitForCondition(hasIdentifyReturned);
        mParticle.setIntegrationAttribute(128, { MCID: 'abcdefg' });
        mParticle.logEvent('Test Event');
        const testEvent = findBatch(fetchMock.calls(), 'Test Event');

        testEvent.should.have.property('integration_attributes');
        testEvent.integration_attributes.should.have.property('128');
        testEvent.integration_attributes['128'].should.have.property(
            'MCID',
            'abcdefg'
        );

    });

    it('should run the callback once when tracking succeeds', async () => {
        await waitForCondition(hasIdentifyReturned);
        const clock = sinon.useFakeTimers();

        mParticle.init(apiKey, window.mParticle.config);

        let successCallbackCalled = false;
        let numberTimesCalled = 0;

        mParticle.startTrackingLocation(function() {
            numberTimesCalled += 1;
            successCallbackCalled = true;
            mParticle.logEvent('Test Event');
        });

        // mock geo will successfully run after 1 second (geomock.js // navigator.geolocation.delay)
        clock.tick(1000);
        successCallbackCalled.should.equal(true);
        let testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');

        testEvent.data.location.latitude.should.equal(52.5168);
        testEvent.data.location.longitude.should.equal(13.3889);
        fetchMock.resetHistory();

        //this will hit the watch position again, but won't call the callback again
        clock.tick(1000);
        numberTimesCalled.should.equal(1);

        testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');

        Should(testEvent).not.be.ok();

        clock.restore();

    });

    it('should run the callback once when tracking fails', async () => {
        await waitForCondition(hasIdentifyReturned);
        const clock = sinon.useFakeTimers();

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });

        let successCallbackCalled = false;
        let numberTimesCalled = 0;

        (navigator.geolocation as any).shouldFail = true;

        mParticle.startTrackingLocation(function() {
            numberTimesCalled += 1;
            successCallbackCalled = true;
            mParticle.logEvent('Test Event');
        });

        // mock geo will successfully run after 1 second (geomock.js // navigator.geolocation.delay)
        clock.tick(1000);
        successCallbackCalled.should.equal(true);

        let testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');

        testEvent.data.should.have.property('location', null);
        fetchMock.resetHistory();

        //this will hit the watch position again, but won't call the callback again
        clock.tick(1000);
        numberTimesCalled.should.equal(1);
        testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');
        Should(testEvent).not.be.ok();

        (navigator.geolocation as any).shouldFail = false;

        clock.restore();
    });

    it('should pass the found or existing position to the callback in startTrackingLocation', async () => {
        await waitForCondition(hasIdentifyReturned);
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        })
        let currentPosition;

        function callback(position) {
            currentPosition = position;
        }
        const clock = sinon.useFakeTimers();
        mParticle.startTrackingLocation(callback as any);

        // mock geo will successfully run after 1 second (geomock.js // navigator.geolocation.delay)

        clock.tick(1000);
        const latitudeResult = 52.5168;
        const longitudeResult = 13.3889;

        currentPosition.coords.latitude.should.equal(latitudeResult);
        currentPosition.coords.longitude.should.equal(longitudeResult);

        clock.restore();
    });

    it('should run the callback if tracking already exists', async () => {
        await waitForCondition(hasIdentifyReturned);

        mParticle.init(apiKey, window.mParticle.config);

        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });

        const clock = sinon.useFakeTimers();

        mParticle.startTrackingLocation();
        let successCallbackCalled = false;
        function callback() {
            successCallbackCalled = true;
            mParticle.logEvent('Test Event');
        }
        mParticle.startTrackingLocation(callback as any);

        // mock geo will successfully run after 1 second (geomock.js // navigator.geolocation.delay)
        clock.tick(1000);
        successCallbackCalled.should.equal(true);
        const testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');

        const latitudeResult = 52.5168;
        const longitudeResult = 13.3889;
        testEvent.data.location.latitude.should.equal(latitudeResult);
        testEvent.data.location.longitude.should.equal(longitudeResult);

        clock.restore();
    });

    it('should log appName in the payload on v3 endpoint when set on config prior to init', async () => {
        mParticle.config.appName = 'a name';
        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };

        await waitForCondition(hasIdentifyReturned);
        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });

        window.mParticle.logEvent('Test Event');

        const batch = parseFetchJson(fetchMock.lastOptions().body);

        batch.application_info.should.have.property(
            'application_name',
            'a name'
        );

        delete window.mParticle.config.flags;
    });

    it('should log AST first_run as true on new page loads, and false for when a page has previously been loaded', async () => {
        await waitForCondition(hasIdentifyReturned);
        mParticle._resetForTests(MPConfig);

        mParticle.init(apiKey, mParticle.config);

        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        })

        const batch = parseFetchJson(fetchMock.lastOptions().body);
        batch.events[0].data.should.have.property('is_first_run', true);

        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        })

        mParticle.init(apiKey, mParticle.config);
        const batch2 = parseFetchJson(fetchMock.lastOptions().body);
        batch2.events[0].data.should.have.property('is_first_run', false);

        delete window.mParticle.config.flags;
    });

    it('should log AST with launch_referral with a url', async () => {
        await waitForCondition(hasIdentifyReturned);
        mParticle._resetForTests(MPConfig);

        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });


        const batch = parseFetchJson(fetchMock.lastOptions().body);
        batch.events[0].data.should.have.property('launch_referral');
        batch.events[0].data.launch_referral.should.startWith(
            'http://localhost'
        );

        delete window.mParticle.config.flags;
    });

    it('should log appName in the payload on v3 endpoint when set on config prior to init', async () => {
        await waitForCondition(hasIdentifyReturned);
        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });


        mParticle.init(apiKey, mParticle.config);
        mParticle.setAppName('another name');

        window.mParticle.logEvent('Test Event');

        const batch = parseFetchJson(fetchMock.lastOptions().body);
        batch.application_info.should.have.property(
            'application_name',
            'another name'
        );

        delete window.mParticle.config.flags;
    });

    it('should log a batch to v3 with data planning in the payload', async () => {
        mParticle.config.logLevel = 'verbose';
        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };
        mParticle.config.dataPlan = {
            planId: 'plan_slug',
            planVersion: 10,
        };

        await waitForCondition(hasIdentifyReturned);
        mParticle.init(apiKey, mParticle.config);

        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });
        window.mParticle.logEvent('Test Event');

        const batch = parseFetchJson(fetchMock.lastOptions().body);

        batch.should.have.property('context');
        batch.context.should.have.property('data_plan');
        batch.context.data_plan.should.have.property('plan_version', 10);
        batch.context.data_plan.should.have.property('plan_id', 'plan_slug');

        delete window.mParticle.config.flags;
    });

    it('should log a batch to v3 with no version if no version is passed', async () => {
        await waitForCondition(hasIdentifyReturned);
        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };
        mParticle.config.dataPlan = {
            planId: 'plan_slug',
        };

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });
        window.mParticle.logEvent('Test Event');

        const batch = parseFetchJson(fetchMock.lastOptions().body);

        batch.should.have.property('context');
        batch.context.should.have.property('data_plan');
        batch.context.data_plan.should.not.have.property('plan_version');
        batch.context.data_plan.should.have.property('plan_id', 'plan_slug');

        delete window.mParticle.config.flags;
    });

    it('should log a batch to v3 with no context if no data plan is passed', async () => {
        await waitForCondition(hasIdentifyReturned);
        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };
        mParticle.config.dataPlan = {
            planVersion: 10,
        };

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });
        window.mParticle.logEvent('Test Event');

        const batch = parseFetchJson(fetchMock.lastOptions().body);

        batch.should.not.have.property('context');

        delete window.mParticle.config.flags;
    });

    it('should log an error if a non slug string is passed as the dataplan planId', async () => {
        await waitForCondition(hasIdentifyReturned);
        let errorMessage;

        mParticle.config.logLevel = 'verbose';
        mParticle.config.logger = {
            error: function(msg) {
                if (!errorMessage) {
                    errorMessage = msg;
                }
            },
        };
        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };
        mParticle.config.dataPlan = {
            planId: 'not a slug',
            planVersion: 10,
        };

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });
        window.mParticle.logEvent('Test Event');

        errorMessage.should.equal(
            'Your data plan id must be a string and match the data plan slug format (i.e. under_case_slug)'
        );
        const batch = parseFetchJson(fetchMock.lastOptions().body);
        batch.should.not.have.property('context');
        delete window.mParticle.config.flags;
    });

    it('should log consent properly to v3 endpoint ', async () => {
        await waitForCondition(hasIdentifyReturned);
        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };
        mParticle.config.dataPlan = {
            planVersion: 10,
        };

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        })
        const user = mParticle.Identity.getCurrentUser();
        // Add to your consent state
        const consentState = mParticle.Consent.createConsentState();

        const ccpa = mParticle.Consent.createCCPAConsent(
            true,
            Date.now(),
            'doc1',
            'location1',
            'hardwareid'
        );

        consentState.setCCPAConsentState(ccpa);
        const location_collection_consent = mParticle.Consent.createGDPRConsent(
            true,
            Date.now(),
            'doc1',
            'location1',
            'hardwareid'
        );

        // Add to your consent state
        consentState.addGDPRConsentState(
            'My GDPR Purpose',
            location_collection_consent
        );
        user.setConsentState(consentState);

        window.mParticle.logEvent('Test Event');

        const batch = parseFetchJson(fetchMock.lastOptions().body);

        batch.should.have.property('consent_state');
        batch.consent_state.should.have.properties(['gdpr', 'ccpa']);
        batch.consent_state.gdpr.should.have.property('my gdpr purpose');
        batch.consent_state.gdpr['my gdpr purpose'].should.have.property(
            'consented',
            true
        );
        batch.consent_state.gdpr['my gdpr purpose'].should.have.property(
            'document',
            'doc1'
        );
        batch.consent_state.gdpr['my gdpr purpose'].should.have.property(
            'location',
            'location1'
        );
        batch.consent_state.gdpr['my gdpr purpose'].should.have.property(
            'hardware_id',
            'hardwareid'
        );
        batch.consent_state.gdpr['my gdpr purpose'].should.have.property(
            'timestamp_unixtime_ms'
        );

        batch.consent_state.ccpa['data_sale_opt_out'].should.have.property(
            'consented',
            true
        );
        batch.consent_state.ccpa['data_sale_opt_out'].should.have.property(
            'document',
            'doc1'
        );
        batch.consent_state.ccpa['data_sale_opt_out'].should.have.property(
            'location',
            'location1'
        );
        batch.consent_state.ccpa['data_sale_opt_out'].should.have.property(
            'hardware_id',
            'hardwareid'
        );
        batch.consent_state.ccpa['data_sale_opt_out'].should.have.property(
            'timestamp_unixtime_ms'
        );

        delete window.mParticle.config.flags;
    });

    it('should sanitize transaction attributes in the payload on v3 endpoint', async () => {
        await waitForCondition(hasIdentifyReturned);
        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });
        const product1 = mParticle.eCommerce.createProduct(
            'iphone',
            'iphoneSKU',
            999,
            1
        );
        const product2 = mParticle.eCommerce.createProduct(
            'galaxy',
            'galaxySKU',
            799,
            1
        );

        const transactionAttributes = {
            Id: 'foo-transaction-id',
            Revenue: 'string',
            Tax: 'string',
            Shipping: 'string',
        } as unknown as TransactionAttributes;

        const customAttributes = { sale: true };
        const customFlags = { 'Google.Category': 'travel' };

        mParticle.eCommerce.logProductAction(
            mParticle.ProductActionType.Purchase,
            [product1, product2],
            customAttributes,
            customFlags,
            transactionAttributes
        );

        const batch = parseFetchJson(fetchMock.lastOptions().body);

        batch.events[0].data.product_action.total_amount.should.equal(0);
        batch.events[0].data.product_action.shipping_amount.should.equal(0);
        batch.events[0].data.product_action.tax_amount.should.equal(0);

        delete window.mParticle.config.flags;
    });

    it('should sanitize product attributes in the payload on v3 endpoint', async () => {
        await waitForCondition(hasIdentifyReturned);
        mParticle.config.flags = {
            eventBatchingIntervalMillis: 0,
        };

        mParticle.init(apiKey, mParticle.config);
        await waitForCondition(() => {
            return (
                mParticle.getInstance()._Store.identityCallInFlight === false
            );
        });
        const product1 = mParticle.eCommerce.createProduct(
            'iphone',
            'iphoneSKU',
            'string',
            'string',
            'variant',
            'category',
            'brand',
            'string' as any,
            'coupon'
        );
        const product2 = mParticle.eCommerce.createProduct(
            'galaxy',
            'galaxySKU',
            'string',
            'string',
            'variant',
            'category',
            'brand',
            'string' as any,
            'coupon'
        );

        const transactionAttributes = {
            Id: 'foo-transaction-id',
            Revenue: 'string',
            Tax: 'string',
            Shipping: 'string',
        } as unknown as TransactionAttributes;

        const customAttributes = { sale: true };
        const customFlags = { 'Google.Category': 'travel' };
        mParticle.eCommerce.logProductAction(
            mParticle.ProductActionType.Purchase,
            [product1, product2],
            customAttributes,
            customFlags,
            transactionAttributes
        );

        const batch = parseFetchJson(fetchMock.lastOptions().body);
        (
            batch.events[0].data.product_action.products[0].position === null
        ).should.equal(true);
        batch.events[0].data.product_action.products[0].price.should.equal(0);
        batch.events[0].data.product_action.products[0].quantity.should.equal(
            0
        );
        batch.events[0].data.product_action.products[0].total_product_amount.should.equal(
            0
        );

        (
            batch.events[0].data.product_action.products[1].position === null
        ).should.equal(true);
        batch.events[0].data.product_action.products[1].price.should.equal(0);
        batch.events[0].data.product_action.products[1].quantity.should.equal(
            0
        );
        batch.events[0].data.product_action.products[1].total_product_amount.should.equal(
            0
        );

        delete window.mParticle.config.flags;
    });
});