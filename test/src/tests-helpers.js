import {
    urls,
    apiKey,
    testMPID,
    mParticle,
} from './config/constants';
import sinon from 'sinon';
import Utils from './config/utils';

const { waitForCondition, fetchMockSuccess, hasIdentityCallInflightReturned } = Utils;

describe('helpers', function() {
    let sandbox;

    beforeEach(function() {
        // Create a fresh sandbox for each test to avoid spy conflicts
        sandbox = sinon.createSandbox();

        fetchMockSuccess(urls.events);
        fetchMockSuccess(urls.identify, {
            context: null,
            matched_identities: {
                device_application_stamp: 'my-das',
            },
            is_ephemeral: true,
            mpid: testMPID,
            is_logged_in: false,
        });

        mParticle.init(apiKey, window.mParticle.config);
    });

    afterEach(function() {
        // Restore all spies/stubs created by this test's sandbox
        if (sandbox) {
            sandbox.restore();
        }
    });

    it('should correctly validate an attribute value', function(done) {
        const validatedString = mParticle
            .getInstance()
            ._Helpers.Validators.isValidAttributeValue('testValue1');
        const validatedNumber = mParticle
            .getInstance()
            ._Helpers.Validators.isValidAttributeValue(1);
        const validatedNull = mParticle
            .getInstance()
            ._Helpers.Validators.isValidAttributeValue(null);
        const validatedObject = mParticle
            .getInstance()
            ._Helpers.Validators.isValidAttributeValue({});
        const validatedArray = mParticle
            .getInstance()
            ._Helpers.Validators.isValidAttributeValue([]);
        const validatedUndefined = mParticle
            .getInstance()
            ._Helpers.Validators.isValidAttributeValue(undefined);

        validatedString.should.be.ok();
        validatedNumber.should.be.ok();
        validatedNull.should.be.ok();
        validatedObject.should.not.be.ok();
        validatedArray.should.not.be.ok();
        validatedUndefined.should.not.be.ok();

        done();
    });

    it('should return event name in warning when sanitizing invalid attributes', async () => {
        await waitForCondition(hasIdentityCallInflightReturned);
        const bond = sandbox.spy(mParticle.getInstance().Logger, 'warning');
        mParticle.logEvent('eventName', mParticle.EventType.Location, {invalidValue: {}});

        bond.called.should.eql(true);
        bond.callCount.should.equal(1);

        bond.getCalls()[0].args[0].should.eql(
            "For 'eventName', the corresponding attribute value of 'invalidValue' must be a string, number, boolean, or null."
        );
    });

    it('should return product name in warning when sanitizing invalid attributes', function(done) {
        const bond = sandbox.spy(mParticle.getInstance().Logger, 'warning');
        mParticle.eCommerce.createProduct(
            'productName',
            'sku',
            1,
            1,
            'variant',
        'category',
        'brand',
        'position',
        'couponCode',
        {invalidValue: {}}
        )
        bond.called.should.eql(true);
        bond.callCount.should.equal(1);

        bond.getCalls()[0].args[0].should.eql(
            "For 'productName', the corresponding attribute value of 'invalidValue' must be a string, number, boolean, or null."
        );

        done();
    });

    it('should return commerce event name in warning when sanitizing invalid attributes', async () => {
        await waitForCondition(hasIdentityCallInflightReturned);

        const bond = sandbox.spy(mParticle.getInstance().Logger, 'warning');

        const product1 = mParticle.eCommerce.createProduct('prod1', 'prod1sku', 999);
        const product2 = mParticle.eCommerce.createProduct('prod2', 'prod2sku', 799);

        const customAttributes = {invalidValue: {}};
        mParticle.eCommerce.logProductAction(mParticle.ProductActionType.AddToCart, [product1, product2], customAttributes);

        bond.called.should.eql(true);
        bond.callCount.should.equal(1);

        bond.getCalls()[0].args[0].should.eql(
            "For 'eCommerce - AddToCart', the corresponding attribute value of 'invalidValue' must be a string, number, boolean, or null."
        );
    });

    it('should correctly validate an identity request with copyUserAttribute as a key using any identify method', function(done) {
        const identityApiData = {
            userIdentities: {
                customerid: '123',
            },
            copyUserAttributes: true,
        };
        const identifyResult = mParticle
            .getInstance()
            ._Helpers.Validators.validateIdentities(identityApiData, 'identify');
        const logoutResult = mParticle
            .getInstance()
            ._Helpers.Validators.validateIdentities(identityApiData, 'logout');
        const loginResult = mParticle
            .getInstance()
            ._Helpers.Validators.validateIdentities(identityApiData, 'login');
        const modifyResult = mParticle
            .getInstance()
            ._Helpers.Validators.validateIdentities(identityApiData, 'modify');

        identifyResult.valid.should.equal(true);
        logoutResult.valid.should.equal(true);
        loginResult.valid.should.equal(true);
        modifyResult.valid.should.equal(true);

        done();
    });

    it('should correctly parse string or number', function(done) {
        const string = 'abc';
        const number = 123;
        const object = {};
        const array = [];

        const stringResult = mParticle
            .getInstance()
            ._Helpers.parseStringOrNumber(string);
        const numberResult = mParticle
            .getInstance()
            ._Helpers.parseStringOrNumber(number);
        const objectResult = mParticle
            .getInstance()
            ._Helpers.parseStringOrNumber(object);
        const arrayResult = mParticle
            .getInstance()
            ._Helpers.parseStringOrNumber(array);
        const nullResult = mParticle
            .getInstance()
            ._Helpers.parseStringOrNumber(null);

        stringResult.should.equal(string);
        numberResult.should.equal(number);
        Should(objectResult).not.be.ok();
        Should(arrayResult).not.be.ok();
        Should(nullResult).not.be.ok();

        done();
    });

    it('should filterUserIdentities and include customerId as first in the array', function(done) {
        const filterList = [2, 4, 6, 8];
        const userIdentitiesObject = {
            email: 'test@gmail.com',
            other: 'abc',
            customerid: '123',
            facebook: 'facebook123',
            google: 'google123',
            yahoo: 'yahoo123',
        };

        const filteredIdentities = mParticle
            .getInstance()
            ._Helpers.filterUserIdentities(userIdentitiesObject, filterList);
        filteredIdentities.length.should.equal(3);
        filteredIdentities[0].should.have.property('Identity', '123');
        filteredIdentities[0].should.have.property('Type', 1);
        filteredIdentities[1].should.have.property(
            'Identity',
            'test@gmail.com'
        );
        filteredIdentities[1].should.have.property('Type', 7);
        filteredIdentities[2].should.have.property('Identity', 'abc');
        filteredIdentities[2].should.have.property('Type', 0);

        done();
    });

    it('should return the appropriate boolean for if events should be delayed by an integration', function(done) {
        const integrationDelays1 = {
            128: false,
            20: false,
            10: true,
        };
        const integrationDelays2 = {
            128: true,
        };
        const integrationDelays3 = {
            128: false,
        };

        const integrationDelays4 = {
            128: false,
            20: false,
            10: false,
        };

        const result1 = mParticle
            .getInstance()
            ._Helpers.isDelayedByIntegration(integrationDelays1);
        const result2 = mParticle
            .getInstance()
            ._Helpers.isDelayedByIntegration(integrationDelays2);
        const result3 = mParticle
            .getInstance()
            ._Helpers.isDelayedByIntegration(integrationDelays3);
        const result4 = mParticle
            .getInstance()
            ._Helpers.isDelayedByIntegration(integrationDelays4);

        result1.should.equal(true);
        result2.should.equal(true);
        result3.should.equal(false);
        result4.should.equal(false);

        done();
    });

    it('should return false if integration delay object is empty', function(done) {
        const emptyIntegrationDelays = {};
        const result1 = mParticle
            .getInstance()
            ._Helpers.isDelayedByIntegration(emptyIntegrationDelays);

        result1.should.equal(false);

        done();
    });

    it('should return 0 when hashing undefined or null', function(done) {
        mParticle.generateHash(undefined)
            .should.equal(0);
        mParticle.generateHash(null)
            .should.equal(0);
        (typeof mParticle.generateHash(false)).should.equal('number');
        mParticle.generateHash(false)
            .should.not.equal(0);

        done();
    });

    it('should generate random value', function(done) {
        let randomValue = mParticle.getInstance()._Helpers.generateUniqueId();
        randomValue.should.be.ok();
        window.crypto.getRandomValues = undefined;
        randomValue = mParticle.getInstance()._Helpers.generateUniqueId();
        randomValue.should.be.ok();
        //old browsers may return undefined despite
        //defining the getRandomValues API.
        window.crypto.getRandomValues = function(a) {
            a = undefined;
            return a;
        };

        randomValue = mParticle.getInstance()._Helpers.generateUniqueId();
        randomValue.should.be.ok();
        done();
    });

    it('should create a storage name based on default mParticle storage version + apiKey if apiKey is passed in', function(done) {
        const cookieName = mParticle
            .getInstance()
            ._Helpers.createMainStorageName(apiKey);
        cookieName.should.equal('mprtcl-v4_test_key');

        done();
    });

    it('should create a storage name based on default mParticle storage version if no apiKey is passed in', function(done) {
        const cookieName = mParticle
            .getInstance()
            ._Helpers.createMainStorageName();
        cookieName.should.equal('mprtcl-v4');

        done();
    });
});