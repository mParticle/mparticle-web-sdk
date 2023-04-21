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
    before(function() {
        window.fetchMock.restore();
        sinon.restore();
    });

    beforeEach(function() {
        window.fetchMock.restore();
        mockServer = sinon.createFakeServer();
        mockServer.respondImmediately = true;

        mockServer.respondWith(urls.identify, [
            200,
            {},
            JSON.stringify({ mpid: testMPID, is_logged_in: false }),
        ]);

        window.mParticle.config.flags = {
            eventsV3: '100',
            eventBatchingIntervalMillis: 1000,
        };
    });

    afterEach(() => {
        sinon.restore();
        mockServer.reset();
        window.fetchMock.restore();
    });

    it('should trigger beacon on page visibilitychange events', function(done) {
        window.mParticle._resetForTests(MPConfig);

        var bond = sinon.spy(navigator, 'sendBeacon');
        window.mParticle.init(apiKey, window.mParticle.config);

        // visibility change is a document property, not window
        document.dispatchEvent(new Event('visibilitychange'));

        bond.called.should.eql(true);
        bond.lastCall.args[0].should.eql(urls.events);

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
        bond.getCalls()[0].args[0].should.eql(urls.events);

        done();
    });

    it('should trigger beacon on pagehide events', function(done) {
        window.mParticle._resetForTests(MPConfig);

        var bond = sinon.spy(navigator, 'sendBeacon');
        window.mParticle.init(apiKey, window.mParticle.config);

        window.dispatchEvent(new Event('pagehide'));

        bond.called.should.eql(true);
        bond.getCalls()[0].args[0].should.eql(urls.events);

        (typeof bond.getCalls()[0].args[1]).should.eql('object');

        done();
    });
});