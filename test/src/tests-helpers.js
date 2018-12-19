var Helpers = require('../../src/helpers'),
    Validators = Helpers.Validators;

describe('helpers', function() {
    it('should correctly validate an attribute value', function(done) {
        var validatedString = Validators.isValidAttributeValue('testValue1');
        var validatedNumber = Validators.isValidAttributeValue(1);
        var validatedNull = Validators.isValidAttributeValue(null);
        var validatedObject = Validators.isValidAttributeValue({});
        var validatedArray = Validators.isValidAttributeValue([]);
        var validatedUndefined = Validators.isValidAttributeValue(undefined);

        validatedString.should.be.ok();
        validatedNumber.should.be.ok();
        validatedNull.should.be.ok();
        validatedObject.should.not.be.ok();
        validatedArray.should.not.be.ok();
        validatedUndefined.should.not.be.ok();

        done();
    });

    it('should correctly validate a key value', function(done) {
        var validatedString = Validators.isValidKeyValue('testValue1');
        var validatedNumber = Validators.isValidKeyValue(1);
        var validatedNull = Validators.isValidKeyValue(null);
        var validatedObject = Validators.isValidKeyValue({});
        var validatedArray = Validators.isValidKeyValue([]);
        var validatedUndefined = Validators.isValidKeyValue(undefined);

        validatedString.should.be.ok();
        validatedNumber.should.be.ok();
        validatedNull.should.not.be.ok();
        validatedObject.should.not.be.ok();
        validatedArray.should.not.be.ok();
        validatedUndefined.should.not.be.ok();

        done();
    });

    it('should correctly validate a string or number', function(done) {
        var validatedString = Validators.isStringOrNumber('testValue1');
        var validatedNumber = Validators.isStringOrNumber(1);
        var validatedNull = Validators.isStringOrNumber(null);
        var validatedObject = Validators.isStringOrNumber({});
        var validatedArray = Validators.isStringOrNumber([]);
        var validatedUndefined = Validators.isStringOrNumber(undefined);

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
                customerid: '123'
            },
            copyUserAttributes: true
        };
        var identifyResult = Validators.validateIdentities(identityApiData, 'identify');
        var logoutResult = Validators.validateIdentities(identityApiData, 'logout');
        var loginResult = Validators.validateIdentities(identityApiData, 'login');
        var modifyResult = Validators.validateIdentities(identityApiData, 'modify');

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

        var stringResult = Helpers.parseStringOrNumber(string);
        var numberResult = Helpers.parseStringOrNumber(number);
        var objectResult = Helpers.parseStringOrNumber(object);
        var arrayResult = Helpers.parseStringOrNumber(array);
        var nullResult = Helpers.parseStringOrNumber(null);

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
            yahoo: 'yahoo123'
        };

        var filteredIdentities = Helpers.filterUserIdentities(userIdentitiesObject, filterList);
        filteredIdentities.length.should.equal(3);
        filteredIdentities[0].should.have.property('Identity', '123');
        filteredIdentities[0].should.have.property('Type', 1);
        filteredIdentities[1].should.have.property('Identity', 'test@gmail.com');
        filteredIdentities[1].should.have.property('Type', 7);
        filteredIdentities[2].should.have.property('Identity', 'abc');
        filteredIdentities[2].should.have.property('Type', 0);

        done();
    });

    it('should return the appropriate boolean for if events should be delayed by an integration', function(done) {
        var integrationDelays1 = {
            128: false,
            20: false,
            10: true
        };
        var integrationDelays2 = {
            128: true
        };
        var integrationDelays3 = {
            128: false
        };

        var integrationDelays4 = {
            128: false,
            20: false,
            10: false
        };

        var result1 = Helpers.isDelayedByIntegration(integrationDelays1);
        var result2 = Helpers.isDelayedByIntegration(integrationDelays2);
        var result3 = Helpers.isDelayedByIntegration(integrationDelays3);
        var result4 = Helpers.isDelayedByIntegration(integrationDelays4);

        result1.should.equal(true);
        result2.should.equal(true);
        result3.should.equal(false);
        result4.should.equal(false);

        done();
    });

    it('should return false if integration delay object is empty', function(done) {
        var emptyIntegrationDelays = {};
        var result1 = Helpers.isDelayedByIntegration(emptyIntegrationDelays);

        result1.should.equal(false);

        done();
    });
});
