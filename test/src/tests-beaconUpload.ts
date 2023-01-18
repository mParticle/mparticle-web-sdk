import sinon from 'sinon';
import { urls } from './config';
import { apiKey, MPConfig, testMPID } from './config';
import { MParticleWebSDK } from '../../src/sdkRuntimeModels';
import _BatchValidator from '../../src/mockBatchCreator';

declare global {
    interface Window {
        mParticle: MParticleWebSDK;
        fetchMock: any;
    }
}

describe('Beacon Upload', () => {
    let mockServer;
    let mockLS;
    let mockEventFromLS = {
        EventName: 10,
        EventAttributes: null,
        SourceMessageId: 'b56a0cdf-91b8-4d86-96a8-57d8886d3b7a',
        EventDataType: 10,
        CustomFlags: {},
        IsFirstRun: true,
        LaunchReferral: 'http://localhost:9876/debug.html',
        CurrencyCode: null,
        MPID: 'testMPID',
        ConsentState: null,
        UserAttributes: {},
        UserIdentities: [],
        Store: {},
        SDKVersion: '2.18.0',
        SessionId: '0D63646B-EA93-4AD1-8378-FAD7A71A333B',
        SessionStartDate: 1671576752819,
        Debug: false,
        Location: null,
        OptOut: null,
        ExpandedEventCount: 0,
        ClientGeneratedId: '95a0d3e4-f16c-4bd4-a86a-60bfd1ed353f',
        DeviceId: '062e7536-cf85-4430-a177-282dd0bbb31f',
        IntegrationAttributes: {},
        DataPlan: {},
        Timestamp: 1671576752827,
    };

    let mockBatchFromLS = {
        application_info: {},
        consent_state: null,
        device_info: {
            platform: 'web',
            screen_width: 3440,
            screen_height: 1440,
        },
        platform: 'web',
        screen_height: 1440,
        screen_width: 3440,
        environment: 'production',
        events: [
            {
                event_type: 'session_start',
                data: {
                    custom_attributes: null,
                    location: null,
                    session_start_unixtime_ms: 1672254481735,
                    session_uuid: 'AF7F14A6-5966-4A47-B90E-341731D1E53E',
                    source_message_id: '57b21559-8188-47b3-a462-ff4f369b3bc5',
                    timestamp_unixtime_ms: 1672254481751,
                },
            },
        ],
        integration_attributes: {},
        mp_deviceid: '281cb431-5e27-4ae2-bfe9-6229f28bad29',
        mpid: 'testMPID',
        sdk_version: '2.18.0',
        source_request_id: '74009286-5241-4581-a5b8-8c9444214250',
        timestamp_unixtime_ms: 1672254531776,
        user_attributes: {},
        user_identities: null,
    };

    beforeEach(function() {
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        // Stub Local Storage response because it causes beacon to not fire in
        // repeated tests
        // Note: Firefox won't let you mock local storage directly, so
        //       you need to mock Storage.prototype
        // https://github.com/jasmine/jasmine/issues/299#issuecomment-312599271
        mockLS = sinon.stub(Storage.prototype, 'getItem');
        mockLS.withArgs('mprtcl-v4_abcdef-events').returns(
            JSON.stringify({
                'b56a0cdf-91b8-4d86-96a8-57d8886d3b7a': mockEventFromLS,
            })
        );
        mockLS.withArgs('mprtcl-v4_abcdef-batches').returns(
            JSON.stringify({
                '74009286-5241-4581-a5b8-8c9444214250': mockBatchFromLS,
            })
        );

        window.mParticle.config.flags = {
            eventsV3: '100',
            eventBatchingIntervalMillis: 1000,
        };
    });

    afterEach(() => {
        sinon.restore();
        mockServer.reset();
        window.localStorage.clear();
    });

    it('should trigger beacon on page visibilitychange events', function(done) {
        window.mParticle._resetForTests(MPConfig);

        var bond = sinon.spy(navigator, 'sendBeacon');
        window.mParticle.init(apiKey, window.mParticle.config);

        // visibility change is a document property, not window
        document.dispatchEvent(new Event('visibilitychange'));

        bond.called.should.eql(true);
        bond.getCalls()[0].args[0].should.eql(
            'https://jssdks.mparticle.com/v3/JS/test_key/events'
        );

        done();
    });

    it('should trigger beacon on page beforeunload events', function(done) {
        window.mParticle._resetForTests(MPConfig);

        var bond = sinon.spy(navigator, 'sendBeacon');
        window.mParticle.init(apiKey, window.mParticle.config);

        // karma fails if onbeforeunload is not set to null
        window.onbeforeunload = null;
        window.dispatchEvent(new Event('beforeunload'));

        bond.called.should.eql(true);
        bond.getCalls()[0].args[0].should.eql(
            'https://jssdks.mparticle.com/v3/JS/test_key/events'
        );

        done();
    });

    it('should trigger beacon on pagehide events', function(done) {
        window.mParticle._resetForTests(MPConfig);

        var bond = sinon.spy(navigator, 'sendBeacon');
        window.mParticle.init(apiKey, window.mParticle.config);

        window.dispatchEvent(new Event('pagehide'));

        bond.called.should.eql(true);
        bond.getCalls()[0].args[0].should.eql(
            'https://jssdks.mparticle.com/v3/JS/test_key/events'
        );

        (typeof bond.getCalls()[0].args[1]).should.eql('object');

        done();
    });
});
