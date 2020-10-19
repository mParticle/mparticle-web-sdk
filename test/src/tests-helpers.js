import { apiKey } from './config';
import sinon from 'sinon';

describe('helpers', function() {
    beforeEach(function() {
        mParticle.init(apiKey, window.mParticle.config);
    });

    it('should correctly validate an attribute value', function(done) {
        var validatedString = mParticle
            .getInstance()
            ._Helpers.Validators.isValidAttributeValue('testValue1');
        var validatedNumber = mParticle
            .getInstance()
            ._Helpers.Validators.isValidAttributeValue(1);
        var validatedNull = mParticle
            .getInstance()
            ._Helpers.Validators.isValidAttributeValue(null);
        var validatedObject = mParticle
            .getInstance()
            ._Helpers.Validators.isValidAttributeValue({});
        var validatedArray = mParticle
            .getInstance()
            ._Helpers.Validators.isValidAttributeValue([]);
        var validatedUndefined = mParticle
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

    it('should return event name in warning when sanitizing invalid attributes', function(done) {
        var bond = sinon.spy(mParticle.getInstance().Logger, 'warning');
        mParticle.logEvent('eventName', mParticle.EventType.Location, {invalidValue: {}});

        bond.called.should.eql(true);
        bond.callCount.should.equal(1);

        bond.getCalls()[0].args[0].should.eql(
            "For 'eventName', the corresponding attribute value of 'invalidValue' must be a string, number, boolean, or null."
        );

        done();
    });

    it('should return product name in warning when sanitizing invalid attributes', function(done) {
        var bond = sinon.spy(mParticle.getInstance().Logger, 'warning');
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

    it('should return commerce event name in warning when sanitizing invalid attributes', function(done) {
        var bond = sinon.spy(mParticle.getInstance().Logger, 'warning');

        var product1 = mParticle.eCommerce.createProduct('prod1', 'prod1sku', 999);
        var product2 = mParticle.eCommerce.createProduct('prod2', 'prod2sku', 799);

        var customAttributes = {invalidValue: {}};
        mParticle.eCommerce.logProductAction(mParticle.ProductActionType.AddToCart, [product1, product2], customAttributes);

        bond.called.should.eql(true);
        bond.callCount.should.equal(1);
        
        bond.getCalls()[0].args[0].should.eql(
            "For 'eCommerce - AddToCart', the corresponding attribute value of 'invalidValue' must be a string, number, boolean, or null."
        );

        done();
    });

    it('should generate ramp number correctly', function(done) {
        var result = mParticle.getInstance()._Helpers.getRampNumber();
        result.should.equal(100);

        result = mParticle.getInstance()._Helpers.getRampNumber(null);
        result.should.equal(100);

        var uniqueId = mParticle.getInstance()._Helpers.generateUniqueId();
        var result1 = mParticle.getInstance()._Helpers.getRampNumber(uniqueId);
        result1.should.be.below(101);
        result1.should.be.above(0);

        var result2 = mParticle.getInstance()._Helpers.getRampNumber(uniqueId);
        result2.should.equal(result1);

        result = mParticle
            .getInstance()
            ._Helpers.getRampNumber('2b907d8b-cefe-4530-a6fe-60a381f2e066');
        result.should.equal(60);
        done();
    });

    it('should correctly validate a key value', function(done) {
        var validatedString = mParticle
            .getInstance()
            ._Helpers.Validators.isValidKeyValue('testValue1');
        var validatedNumber = mParticle
            .getInstance()
            ._Helpers.Validators.isValidKeyValue(1);
        var validatedNull = mParticle
            .getInstance()
            ._Helpers.Validators.isValidKeyValue(null);
        var validatedObject = mParticle
            .getInstance()
            ._Helpers.Validators.isValidKeyValue({});
        var validatedArray = mParticle
            .getInstance()
            ._Helpers.Validators.isValidKeyValue([]);
        var validatedUndefined = mParticle
            .getInstance()
            ._Helpers.Validators.isValidKeyValue(undefined);

        validatedString.should.be.ok();
        validatedNumber.should.be.ok();
        validatedNull.should.not.be.ok();
        validatedObject.should.not.be.ok();
        validatedArray.should.not.be.ok();
        validatedUndefined.should.not.be.ok();

        done();
    });

    it('should correctly validate a string or number', function(done) {
        var validatedString = mParticle
            .getInstance()
            ._Helpers.Validators.isStringOrNumber('testValue1');
        var validatedNumber = mParticle
            .getInstance()
            ._Helpers.Validators.isStringOrNumber(1);
        var validatedNull = mParticle
            .getInstance()
            ._Helpers.Validators.isStringOrNumber(null);
        var validatedObject = mParticle
            .getInstance()
            ._Helpers.Validators.isStringOrNumber({});
        var validatedArray = mParticle
            .getInstance()
            ._Helpers.Validators.isStringOrNumber([]);
        var validatedUndefined = mParticle
            .getInstance()
            ._Helpers.Validators.isStringOrNumber(undefined);

        validatedString.should.be.ok();
        validatedNumber.should.be.ok();
        validatedNull.should.not.be.ok();
        validatedObject.should.not.be.ok();
        validatedArray.should.not.be.ok();
        validatedUndefined.should.not.be.ok();

        done();
    });

    it('should correctly validate an identity request with copyUserAttribute as a key using any identify method', function(done) {
        var identityApiData = {
            userIdentities: {
                customerid: '123',
            },
            copyUserAttributes: true,
        };
        var identifyResult = mParticle
            .getInstance()
            ._Helpers.Validators.validateIdentities(identityApiData, 'identify');
        var logoutResult = mParticle
            .getInstance()
            ._Helpers.Validators.validateIdentities(identityApiData, 'logout');
        var loginResult = mParticle
            .getInstance()
            ._Helpers.Validators.validateIdentities(identityApiData, 'login');
        var modifyResult = mParticle
            .getInstance()
            ._Helpers.Validators.validateIdentities(identityApiData, 'modify');

        identifyResult.valid.should.equal(true);
        logoutResult.valid.should.equal(true);
        loginResult.valid.should.equal(true);
        modifyResult.valid.should.equal(true);

        done();
    });

    it('should correctly parse string or number', function(done) {
        var string = 'abc';
        var number = 123;
        var object = {};
        var array = [];

        var stringResult = mParticle
            .getInstance()
            ._Helpers.parseStringOrNumber(string);
        var numberResult = mParticle
            .getInstance()
            ._Helpers.parseStringOrNumber(number);
        var objectResult = mParticle
            .getInstance()
            ._Helpers.parseStringOrNumber(object);
        var arrayResult = mParticle
            .getInstance()
            ._Helpers.parseStringOrNumber(array);
        var nullResult = mParticle
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
        var filterList = [2, 4, 6, 8];
        var userIdentitiesObject = {
            email: 'test@gmail.com',
            other: 'abc',
            customerid: '123',
            facebook: 'facebook123',
            google: 'google123',
            yahoo: 'yahoo123',
        };

        var filteredIdentities = mParticle
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
        var integrationDelays1 = {
            128: false,
            20: false,
            10: true,
        };
        var integrationDelays2 = {
            128: true,
        };
        var integrationDelays3 = {
            128: false,
        };

        var integrationDelays4 = {
            128: false,
            20: false,
            10: false,
        };

        var result1 = mParticle
            .getInstance()
            ._Helpers.isDelayedByIntegration(integrationDelays1);
        var result2 = mParticle
            .getInstance()
            ._Helpers.isDelayedByIntegration(integrationDelays2);
        var result3 = mParticle
            .getInstance()
            ._Helpers.isDelayedByIntegration(integrationDelays3);
        var result4 = mParticle
            .getInstance()
            ._Helpers.isDelayedByIntegration(integrationDelays4);

        result1.should.equal(true);
        result2.should.equal(true);
        result3.should.equal(false);
        result4.should.equal(false);

        done();
    });

    it('should return false if integration delay object is empty', function(done) {
        var emptyIntegrationDelays = {};
        var result1 = mParticle
            .getInstance()
            ._Helpers.isDelayedByIntegration(emptyIntegrationDelays);

        result1.should.equal(false);

        done();
    });

    it('should return expected boolean value when strings are passed', function(done) {
        mParticle
            .getInstance()
            ._Helpers.returnConvertedBoolean('false')
            .should.equal(false);
        mParticle
            .getInstance()
            ._Helpers.returnConvertedBoolean(false)
            .should.equal(false);
        mParticle
            .getInstance()
            ._Helpers.returnConvertedBoolean('true')
            .should.equal(true);
        mParticle
            .getInstance()
            ._Helpers.returnConvertedBoolean('true')
            .should.equal(true);
        mParticle
            .getInstance()
            ._Helpers.returnConvertedBoolean('randomstring')
            .should.equal(true);
        mParticle
            .getInstance()
            ._Helpers.returnConvertedBoolean(0)
            .should.equal(false);
        mParticle
            .getInstance()
            ._Helpers.returnConvertedBoolean(1)
            .should.equal(true);
        mParticle
            .getInstance()
            ._Helpers.returnConvertedBoolean('0')
            .should.equal(false);
        mParticle
            .getInstance()
            ._Helpers.returnConvertedBoolean('1')
            .should.equal(true);
        mParticle
            .getInstance()
            ._Helpers.returnConvertedBoolean(null)
            .should.equal(false);
        mParticle
            .getInstance()
            ._Helpers.returnConvertedBoolean(undefined)
            .should.equal(false);
        mParticle
            .getInstance()
            ._Helpers.returnConvertedBoolean('')
            .should.equal(false);

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
        var randomValue = mParticle.getInstance()._Helpers.generateUniqueId();
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
        var cookieName = mParticle
            .getInstance()
            ._Helpers.createMainStorageName(apiKey);
        cookieName.should.equal('mprtcl-v4_test_key');

        done();
    });

    it('should create a storage name based on default mParticle storage version if no apiKey is passed in', function(done) {
        var cookieName = mParticle
            .getInstance()
            ._Helpers.createMainStorageName();
        cookieName.should.equal('mprtcl-v4');

        done();
    });

    it('should create a product storage name based on default mParticle storage version + apiKey if apiKey is passed in', function(done) {
        var cookieName = mParticle
            .getInstance()
            ._Helpers.createProductStorageName(apiKey);
        cookieName.should.equal('mprtcl-prodv4_test_key');

        done();
    });
    it('should create a product storage name based on default mParticle storage version if no apiKey is passed in', function(done) {
        var cookieName = mParticle
            .getInstance()
            ._Helpers.createProductStorageName();
        cookieName.should.equal('mprtcl-prodv4');

        done();
    });
});
