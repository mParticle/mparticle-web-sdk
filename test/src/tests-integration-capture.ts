import sinon from 'sinon';
import { expect}  from 'chai';
import Utils from './config/utils';
import fetchMock from 'fetch-mock/esm/client';
import { urls, apiKey, testMPID, MPConfig } from "./config/constants";

const { waitForCondition, fetchMockSuccess, deleteAllCookies, findEventFromRequest, hasIdentifyReturned } = Utils;

const mParticle = window.mParticle;

describe('Integration Capture', () => {
    beforeEach(() => {
        mParticle._resetForTests(MPConfig);
        fetchMock.post(urls.events, 200);
        delete mParticle._instances['default_instance'];
        fetchMockSuccess(urls.identify, {
            mpid: testMPID, is_logged_in: false
        });

        window.mParticle.config.flags = {
            captureIntegrationSpecificIds: 'True'
        };

        window.document.cookie = '_cookie1=234';
        window.document.cookie = '_cookie2=39895811.9165333198';
        window.document.cookie = 'foo=bar';
        window.document.cookie = '_fbp=54321';
        window.document.cookie = 'baz=qux';


        // Mock the query params capture function because we cannot mock window.location.href
        sinon.stub(window.mParticle.getInstance()._IntegrationCapture, 'getQueryParams').returns({
            fbclid: '1234',
        });

        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        sinon.restore();
        fetchMock.restore();
        mParticle._resetForTests(MPConfig);
        deleteAllCookies();
    });


    it('should add captured integrations to event custom flags', async () => {
        await waitForCondition(hasIdentifyReturned);
        window.mParticle.logEvent(
            'Test Event',
            mParticle.EventType.Navigation,
            { mykey: 'myvalue' }
        );

        const testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');

        const initialTimestamp = window.mParticle.getInstance()._IntegrationCapture.initialTimestamp;

        expect(testEvent).to.have.property('data');
        expect(testEvent.data).to.have.property('event_name', 'Test Event');
        expect(testEvent.data).to.have.property('custom_flags');
        expect(testEvent.data.custom_flags).to.deep.equal({
            'Facebook.ClickId': `fb.1.${initialTimestamp}.1234`,
            'Facebook.BrowserId': '54321',
        });
    });
});