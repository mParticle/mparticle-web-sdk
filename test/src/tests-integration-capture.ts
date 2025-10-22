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

describe.only('Integration Capture', () => {
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

        expect(testEvent.data.custom_flags['Facebook.ClickId'], 'Facebook Click Id').to.equal(`fb.1.${initialTimestamp}.1234`);
        expect(testEvent.data.custom_flags['Facebook.BrowserId'], 'Facebook Browser Id').to.equal('54321');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Gclid'], 'Google Enhanced Conversions Gclid').to.equal('234');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Gbraid'], 'Google Enhanced Conversions Gbraid').to.equal('6574');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Wbraid'], 'Google Enhanced Conversions Wbraid').to.equal('1234111');
        expect(testEvent.data.custom_flags['SnapchatConversions.ClickId'], 'Snapchat Click ID').to.equal('1234');
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

        expect(testEvent.data.custom_flags['Facebook.ClickId'], 'Facebook Click Id').to.equal('passed-in');
        expect(testEvent.data.custom_flags['Facebook.BrowserId'], 'Facebook Browser Id').to.equal('54321');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Gclid'], 'Google Enhanced Conversions Gclid').to.equal('234');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Gbraid'], 'Google Enhanced Conversions Gbraid').to.equal('6574');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Wbraid'], 'Google Enhanced Conversions Wbraid').to.equal('1234111');
        expect(testEvent.data.custom_flags['SnapchatConversions.ClickId'], 'Snapchat Click ID').to.equal('1234');
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

        expect(testEvent.data.custom_flags['Facebook.ClickId'], 'Facebook Click Id').to.equal(`fb.1.${initialTimestamp}.1234`);
        expect(testEvent.data.custom_flags['Facebook.BrowserId'], 'Facebook Browser Id').to.equal('54321');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Gclid'], 'Google Enhanced Conversions Gclid').to.equal('234');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Gbraid'], 'Google Enhanced Conversions Gbraid').to.equal('6574');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Wbraid'], 'Google Enhanced Conversions Wbraid').to.equal('1234111');
        expect(testEvent.data.custom_flags['SnapchatConversions.ClickId'], 'Snapchat Click ID').to.equal('1234');
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

        expect(testEvent.data.custom_flags['Facebook.ClickId'], 'Facebook Click Id').to.equal('passed-in');
        expect(testEvent.data.custom_flags['Facebook.BrowserId'], 'Facebook Browser Id').to.equal('54321');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Gclid'], 'Google Enhanced Conversions Gclid').to.equal('234');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Gbraid'], 'Google Enhanced Conversions Gbraid').to.equal('6574');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Wbraid'], 'Google Enhanced Conversions Wbraid').to.equal('1234111');
        expect(testEvent.data.custom_flags['SnapchatConversions.ClickId'], 'Snapchat Click ID').to.equal('1234');
    });

    it('should add captured integrations to commerce event custom flags', async () => {
        await waitForCondition(hasIdentifyReturned);

        const product1 = mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999, 1);
        const product2 = mParticle.eCommerce.createProduct('galaxy', 'galaxySKU', 799, 1);

        const transactionAttributes = {
            Id: 'foo-transaction-id',
            Revenue: 430.00,
            Tax: 30
        };

        const customAttributes = {sale: true};
        const customFlags = {foo: 'bar'};

        mParticle.eCommerce.logProductAction(
            mParticle.ProductActionType.Purchase,
            [product1, product2],
            customAttributes,
            customFlags,
            transactionAttributes);

        const testEvent = findEventFromRequest(fetchMock.calls(), 'purchase');

        const initialTimestamp = window.mParticle.getInstance()._IntegrationCapture.initialTimestamp;

        expect(testEvent.data.product_action).to.have.property('action', 'purchase');
        expect(testEvent.data).to.have.property('custom_flags');

        expect(testEvent.data.custom_flags['foo'], 'Custom Flag').to.equal('bar');
        expect(testEvent.data.custom_flags['Facebook.ClickId'], 'Facebook Click Id').to.equal(`fb.1.${initialTimestamp}.1234`);
        expect(testEvent.data.custom_flags['Facebook.BrowserId'], 'Facebook Browser Id').to.equal('54321');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Gclid'], 'Google Enhanced Conversions Gclid').to.equal('234');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Gbraid'], 'Google Enhanced Conversions Gbraid').to.equal('6574');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Wbraid'], 'Google Enhanced Conversions Wbraid').to.equal('1234111');
        expect(testEvent.data.custom_flags['SnapchatConversions.ClickId'], 'Snapchat Click ID').to.equal('1234');
    });

    it('should add captured integrations to commerce event custom flags, prioritizing passed in flags', async () => {
        await waitForCondition(hasIdentifyReturned);

        const product1 = mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999, 1);
        const product2 = mParticle.eCommerce.createProduct('galaxy', 'galaxySKU', 799, 1);

        const transactionAttributes = {
            Id: 'foo-transaction-id',
            Revenue: 430.00,
            Tax: 30
        };

        const customAttributes = {sale: true};
        const customFlags = {
            'Facebook.ClickId': 'passed-in'
        };

        mParticle.eCommerce.logProductAction(
            mParticle.ProductActionType.Purchase,
            [product1, product2],
            customAttributes,
            customFlags,
            transactionAttributes);
    

        const testEvent = findEventFromRequest(fetchMock.calls(), 'purchase');

        expect(testEvent.data.product_action).to.have.property('action', 'purchase');
        expect(testEvent.data).to.have.property('custom_flags');

        expect(testEvent.data.custom_flags['Facebook.ClickId'], 'Facebook Click Id').to.equal('passed-in');
        expect(testEvent.data.custom_flags['Facebook.BrowserId'], 'Facebook Browser Id').to.equal('54321');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Gclid'], 'Google Enhanced Conversions Gclid').to.equal('234');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Gbraid'], 'Google Enhanced Conversions Gbraid').to.equal('6574');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Wbraid'], 'Google Enhanced Conversions Wbraid').to.equal('1234111');
        expect(testEvent.data.custom_flags['SnapchatConversions.ClickId'], 'Snapchat Click ID').to.equal('1234');
    });

    it('should add captured integrations to commerce event custom flags', async () => {
        await waitForCondition(hasIdentifyReturned);

        const product1 = mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999, 1);
        const product2 = mParticle.eCommerce.createProduct('galaxy', 'galaxySKU', 799, 1);

        const transactionAttributes = {
            Id: 'foo-transaction-id',
            Revenue: 430.00,
            Tax: 30
        };

        const customAttributes = {sale: true};
        const customFlags = {foo: 'bar'};

        mParticle.eCommerce.logProductAction(
            mParticle.ProductActionType.Purchase,
            [product1, product2],
            customAttributes,
            customFlags,
            transactionAttributes);

        const testEvent = findEventFromRequest(fetchMock.calls(), 'purchase');

        const initialTimestamp = window.mParticle.getInstance()._IntegrationCapture.initialTimestamp;

        expect(testEvent.data.product_action).to.have.property('action', 'purchase');
        expect(testEvent.data).to.have.property('custom_flags');

        expect(testEvent.data.custom_flags['foo'], 'Custom Flag').to.equal('bar');
        expect(testEvent.data.custom_flags['Facebook.ClickId'], 'Facebook Click Id').to.equal(`fb.1.${initialTimestamp}.1234`);
        expect(testEvent.data.custom_flags['Facebook.BrowserId'], 'Facebook Browser Id').to.equal('54321');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Gclid'], 'Google Enhanced Conversions Gclid').to.equal('234');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Gbraid'], 'Google Enhanced Conversions Gbraid').to.equal('6574');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Wbraid'], 'Google Enhanced Conversions Wbraid').to.equal('1234111');
        expect(testEvent.data.custom_flags['SnapchatConversions.ClickId'], 'Snapchat Click ID').to.equal('1234');
    });

    it('should add captured integrations to commerce event custom flags, prioritizing passed in flags', async () => {
        await waitForCondition(hasIdentifyReturned);

        const product1 = mParticle.eCommerce.createProduct('iphone', 'iphoneSKU', 999, 1);
        const product2 = mParticle.eCommerce.createProduct('galaxy', 'galaxySKU', 799, 1);

        const transactionAttributes = {
            Id: 'foo-transaction-id',
            Revenue: 430.00,
            Tax: 30
        };

        const customAttributes = {sale: true};
        const customFlags = {
            'Facebook.ClickId': 'passed-in'
        };

        mParticle.eCommerce.logProductAction(
            mParticle.ProductActionType.Purchase,
            [product1, product2],
            customAttributes,
            customFlags,
            transactionAttributes);
    

        const testEvent = findEventFromRequest(fetchMock.calls(), 'purchase');

        expect(testEvent.data.product_action).to.have.property('action', 'purchase');
        expect(testEvent.data).to.have.property('custom_flags');
        
        expect(testEvent.data.custom_flags['Facebook.ClickId'], 'Facebook Click Id').to.equal('passed-in');
        expect(testEvent.data.custom_flags['Facebook.BrowserId'], 'Facebook Browser Id').to.equal('54321');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Gclid'], 'Google Enhanced Conversions Gclid').to.equal('234');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Gbraid'], 'Google Enhanced Conversions Gbraid').to.equal('6574');
        expect(testEvent.data.custom_flags['GoogleEnhancedConversions.Wbraid'], 'Google Enhanced Conversions Wbraid').to.equal('1234111');
        expect(testEvent.data.custom_flags['SnapchatConversions.ClickId'], 'Snapchat Click ID').to.equal('1234');
    });

    it('should add captured integrations to batch as partner identities', async () => {
        await waitForCondition(hasIdentityCallInflightReturned);

        window.mParticle.logEvent('Test Event 1');
        window.mParticle.logEvent('Test Event 2');
        window.mParticle.logEvent('Test Event 3');

        window.mParticle.upload();

        expect(fetchMock.calls().length).to.greaterThan(1);

        const lastCall = fetchMock.lastCall();
        const batch = JSON.parse(lastCall[1].body as string);

        expect(batch).to.have.property('partner_identities');
        expect(batch.partner_identities).to.deep.equal({
            'tiktok_cookie_id': '45670808',
        });

    });

    it('should add captured integrations to batch as integration attributes', async () => {
        await waitForCondition(hasIdentityCallInflightReturned);

        window.mParticle.logEvent('Test Event 1');
        window.mParticle.logEvent('Test Event 2');
        window.mParticle.logEvent('Test Event 3');

        window.mParticle.upload();

        expect(fetchMock.calls().length).to.greaterThan(1);

        const lastCall = fetchMock.lastCall();
        const batch = JSON.parse(lastCall[1].body as string);

        expect(batch).to.have.property('integration_attributes');
        expect(batch.integration_attributes['1277']).to.deep.equal({
            'passbackconversiontrackingid': '45670808',
        });
    });

    it('should add captured integrations to batch as integration attributes without colliding with set integration attributes', async () => {
        await waitForCondition(hasIdentityCallInflightReturned);

        window.mParticle.setIntegrationAttribute(160, { 'client_id': '12354'});

        window.mParticle.logEvent('Test Event 1');
        window.mParticle.logEvent('Test Event 2');
        window.mParticle.logEvent('Test Event 3');

        window.mParticle.upload();

        expect(fetchMock.calls().length).to.greaterThan(1);

        const lastCall = fetchMock.lastCall();
        const batch = JSON.parse(lastCall[1].body as string);

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

        window.mParticle.logEvent('Test Event 1');
        window.mParticle.logEvent('Test Event 2');
        window.mParticle.logEvent('Test Event 3');

        window.mParticle.upload();

        expect(fetchMock.calls().length).to.greaterThan(1);

        const lastCall = fetchMock.lastCall();
        const batch = JSON.parse(lastCall[1].body as string);

        expect(batch).to.have.property('integration_attributes');
        expect(batch.integration_attributes['1277']).to.deep.equal({
            'passbackconversiontrackingid': 'passed-in',
        });
    });
});