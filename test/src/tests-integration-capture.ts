import sinon from 'sinon';
import { expect}  from 'chai';
import Utils from './config/utils';
import fetchMock from 'fetch-mock/esm/client';
import { urls, apiKey, testMPID, MPConfig } from "./config/constants";
import { IMParticleInstanceManager } from '../../src/sdkRuntimeModels';

const {
    waitForCondition,
    fetchMockSuccess,
    deleteAllCookies,
    findEventFromRequest,
    hasIdentifyReturned,
    hasIdentityCallInflightReturned,
} = Utils;

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
        fetchMock: any;
    }
}

const mParticle = window.mParticle as IMParticleInstanceManager;

/** Expected integration-capture custom flags from stubbed query params + _scid cookie */
function expectCapturedSnapchatAndPinterestFlags(
    customFlags: Record<string, unknown>,
): void {
    expect(customFlags['SnapchatConversions.ClickId'], 'Snapchat Click ID').to.equal('1234');
    expect(customFlags['SnapchatConversions.Cookie1'], 'Snapchat Cookie1').to.equal('cookie1-value');
    expect(customFlags['Pinterest.click_id'], 'Pinterest click id').to.equal('pinterest-qp-epik');
}

/** Expected Facebook + Google custom flags from stubbed capture */
function expectCapturedGoogleFacebookFlags(
    customFlags: Record<string, unknown>,
    facebookClickId: string,
): void {
    expect(customFlags['Facebook.ClickId'], 'Facebook Click Id').to.equal(facebookClickId);
    expect(customFlags['Facebook.BrowserId'], 'Facebook Browser Id').to.equal('54321');
    expect(customFlags['GoogleEnhancedConversions.Gclid'], 'Google Enhanced Conversions Gclid').to.equal('234');
    expect(customFlags['GoogleEnhancedConversions.Gbraid'], 'Google Enhanced Conversions Gbraid').to.equal('6574');
    expect(customFlags['GoogleEnhancedConversions.Wbraid'], 'Google Enhanced Conversions Wbraid').to.equal('1234111');
}

function expectStubbedIntegrationCaptureFlags(
    customFlags: Record<string, unknown>,
    facebookClickId: string,
): void {
    expectCapturedGoogleFacebookFlags(customFlags, facebookClickId);
    expectCapturedSnapchatAndPinterestFlags(customFlags);
}

const COMMERCE_TRANSACTION_ATTRS = { Id: 'foo-transaction-id', Revenue: 430.0, Tax: 30 };
const COMMERCE_CUSTOM_ATTRS = { sale: true };

function createCommercePurchaseProducts() {
    const product1 = mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999, 1);
    const product2 = mParticle.eCommerce.createProduct('galaxy', 'galaxySKU', 799, 1);
    return [product1, product2] as const;
}

function logCommercePurchaseAndGetEvent(customFlags: Record<string, unknown>) {
    const [product1, product2] = createCommercePurchaseProducts();
    mParticle.eCommerce.logProductAction(
        mParticle.ProductActionType.Purchase,
        [product1, product2],
        COMMERCE_CUSTOM_ATTRS,
        customFlags,
        COMMERCE_TRANSACTION_ATTRS,
    );
    return findEventFromRequest(fetchMock.calls(), 'purchase');
}

function logThreeEventsUploadAndParseBatch(): Record<string, unknown> {
    window.mParticle.logEvent('Test Event 1');
    window.mParticle.logEvent('Test Event 2');
    window.mParticle.logEvent('Test Event 3');
    window.mParticle.upload();
    expect(fetchMock.calls().length).to.greaterThan(1);
    const lastCall = fetchMock.lastCall();
    return JSON.parse(lastCall[1].body as string) as Record<string, unknown>;
}

describe('Integration Capture', () => {
    beforeEach(async function() {
        mParticle._resetForTests(MPConfig);
        fetchMock.restore();
        fetchMock.config.overwriteRoutes = true;
        fetchMock.post(urls.events, 200);
        delete mParticle._instances['default_instance'];
        fetchMockSuccess(urls.identify, {
            mpid: testMPID, is_logged_in: false
        });

        window.mParticle.config.flags = {
            captureIntegrationSpecificIds: 'True',
            captureIntegrationSpecificIdsV2: 'all'
        };

        window.document.cookie = '_cookie1=234';
        window.document.cookie = '_cookie2=39895811.9165333198';
        window.document.cookie = 'foo=bar';
        window.document.cookie = '_fbp=54321';
        window.document.cookie = 'baz=qux';
        window.document.cookie = '_ttp=45670808';
        window.document.cookie = '_scid=cookie1-value';
        mParticle.init(apiKey, window.mParticle.config);
        await waitForCondition(hasIdentifyReturned);
        const integrationCapture = window.mParticle.getInstance()._IntegrationCapture;
        // Mock the query params capture function because we cannot mock window.location.href
        sinon.stub(integrationCapture, 'getQueryParams').returns({
            fbclid: '1234',
            gclid: '234',
            gbraid: '6574',
            rtid: '45670808',
            rclid: '7183717',
            wbraid: '1234111',
            ScCid: '1234',
            epik: 'pinterest-qp-epik',
        });
        integrationCapture.capture();
    });

    afterEach(function() {
        fetchMock.restore();
        sinon.restore();
        deleteAllCookies();
    });

    it('should add captured integrations to event custom flags', async () => {
        await waitForCondition(hasIdentifyReturned);
        mParticle.logEvent(
            'Test Event',
            mParticle.EventType.Navigation,
            { mykey: 'myvalue' }
        );

        const testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');

        const initialTimestamp = window.mParticle.getInstance()._IntegrationCapture.initialTimestamp;

        expect(testEvent).to.have.property('data');
        expect(testEvent.data).to.have.property('event_name', 'Test Event');
        expect(testEvent.data).to.have.property('custom_flags');

        expectStubbedIntegrationCaptureFlags(
            testEvent.data.custom_flags,
            `fb.1.${initialTimestamp}.1234`,
        );
    });

    it('should add captured integrations to event custom flags, prioritizing passed in custom flags', async () => {
        await waitForCondition(hasIdentifyReturned);
        window.mParticle.logEvent(
            'Test Event',
            mParticle.EventType.Navigation,
            { mykey: 'myvalue' },
            { 'Facebook.ClickId': 'passed-in' },
        );

        const testEvent = findEventFromRequest(fetchMock.calls(), 'Test Event');

        expect(testEvent).to.have.property('data');
        expect(testEvent.data).to.have.property('event_name', 'Test Event');
        expect(testEvent.data).to.have.property('custom_flags');

        expectStubbedIntegrationCaptureFlags(testEvent.data.custom_flags, 'passed-in');
    });

    it('should add captured integrations to page view custom flags', async () => {
        await waitForCondition(hasIdentifyReturned);

        window.mParticle.logPageView(
            'Test Page View',
            {'foo-attr': 'bar-attr'}
        );

        const testEvent = findEventFromRequest(fetchMock.calls(), 'Test Page View');

        const initialTimestamp = window.mParticle.getInstance()._IntegrationCapture.initialTimestamp;

        expect(testEvent).to.have.property('data');
        expect(testEvent.data).to.have.property('screen_name', 'Test Page View');
        expect(testEvent.data).to.have.property('custom_flags');

        expectStubbedIntegrationCaptureFlags(
            testEvent.data.custom_flags,
            `fb.1.${initialTimestamp}.1234`,
        );
    });

    it('should add captured integrations to page view custom flags, prioritizing passed in custom flags', async () => {
        await waitForCondition(hasIdentifyReturned);

        window.mParticle.logPageView(
            'Test Page View',
            {'foo-attr': 'bar-attr'},
            {'Facebook.ClickId': 'passed-in'},
        );

        const testEvent = findEventFromRequest(fetchMock.calls(), 'Test Page View');

        expect(testEvent).to.have.property('data');
        expect(testEvent.data).to.have.property('screen_name', 'Test Page View');
        expect(testEvent.data).to.have.property('custom_flags');

        expectStubbedIntegrationCaptureFlags(testEvent.data.custom_flags, 'passed-in');
    });

    it('should add captured integrations to commerce event custom flags', async () => {
        await waitForCondition(hasIdentifyReturned);

        const testEvent = logCommercePurchaseAndGetEvent({ foo: 'bar' });

        const initialTimestamp = window.mParticle.getInstance()._IntegrationCapture.initialTimestamp;

        expect(testEvent.data.product_action).to.have.property('action', 'purchase');
        expect(testEvent.data).to.have.property('custom_flags');

        expect(testEvent.data.custom_flags['foo'], 'Custom Flag').to.equal('bar');
        expectStubbedIntegrationCaptureFlags(
            testEvent.data.custom_flags,
            `fb.1.${initialTimestamp}.1234`,
        );
    });

    it('should add captured integrations to commerce event custom flags, prioritizing passed in flags', async () => {
        await waitForCondition(hasIdentifyReturned);

        const testEvent = logCommercePurchaseAndGetEvent({
            'Facebook.ClickId': 'passed-in',
        });

        expect(testEvent.data.product_action).to.have.property('action', 'purchase');
        expect(testEvent.data).to.have.property('custom_flags');

        expectStubbedIntegrationCaptureFlags(testEvent.data.custom_flags, 'passed-in');
    });

    it('should add captured integrations to batch as partner identities', async () => {
        await waitForCondition(hasIdentityCallInflightReturned);

        const batch = logThreeEventsUploadAndParseBatch();

        expect(batch).to.have.property('partner_identities');
        expect(batch.partner_identities).to.deep.equal({
            'tiktok_cookie_id': '45670808',
        });

    });

    it('should add captured integrations to batch as integration attributes', async () => {
        await waitForCondition(hasIdentityCallInflightReturned);

        const batch = logThreeEventsUploadAndParseBatch();

        expect(batch).to.have.property('integration_attributes');
        expect(batch.integration_attributes['1277']).to.deep.equal({
            'passbackconversiontrackingid': '45670808',
        });
    });

    it('should add captured integrations to batch as integration attributes without colliding with set integration attributes', async () => {
        await waitForCondition(hasIdentityCallInflightReturned);

        window.mParticle.setIntegrationAttribute(160, { 'client_id': '12354'});

        const batch = logThreeEventsUploadAndParseBatch();

        expect(batch).to.have.property('integration_attributes');
        expect(batch.integration_attributes).to.have.property('1277');
        expect(batch.integration_attributes).to.have.property('160');
        expect(batch.integration_attributes['1277']).to.deep.equal({
            'passbackconversiontrackingid': '45670808',
        });
        expect(batch.integration_attributes['160']).to.deep.equal({
            'client_id': '12354',
        });

    });

    it('should add captured integrations to batch as integration attributes, prioritizing passed in integration attributes', async () => {
        await waitForCondition(hasIdentityCallInflightReturned);

        window.mParticle.setIntegrationAttribute(1277, { 'passbackconversiontrackingid': 'passed-in'});
        window.mParticle.setIntegrationAttribute(160, { 'client_id': '12354'});

        const batch = logThreeEventsUploadAndParseBatch();

        expect(batch).to.have.property('integration_attributes');
        expect(batch.integration_attributes['1277']).to.deep.equal({
            'passbackconversiontrackingid': 'passed-in',
        });
    });
});