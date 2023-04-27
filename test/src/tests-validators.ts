import Validators from '../../src/validators';
import { expect } from 'chai';

describe('Validators', () => {
    it('#isValidAttributeValue should correctly validate an attribute value', ()=> {
        const validatedString = Validators.isValidAttributeValue('testValue1');
        const validatedNumber = Validators.isValidAttributeValue(1);
        const validatedNull = Validators.isValidAttributeValue(null);
        const validatedObject = Validators.isValidAttributeValue({});
        const validatedArray = Validators.isValidAttributeValue([]);
        const validatedUndefined = Validators.isValidAttributeValue(undefined);

        expect(validatedString).to.eq(true);
        expect(validatedNumber).to.eq(true);
        expect(validatedNull).to.eq(true);
        expect(validatedObject).to.eq(false);
        expect(validatedArray).to.eq(false);
        expect(validatedUndefined).to.eq(false);
    });

    it('#validateIdentities should properly validate identityApiRequest values', ()=> {
        const badUserIdentitiesArray = {
            userIdentities: {
                customerid: [],
            },
        };

        const badUserIdentitiesObject = {
            userIdentities: {
                customerid: {},
            },
        };

        const badUserIdentitiesBoolean = {
            userIdentities: {
                customerid: false,
            },
        };

        const badUserIdentitiesUndefined = {
            userIdentities: {
                customerid: undefined,
            },
        };

        const validUserIdentitiesString = {
            userIdentities: {
                customerid: '123',
            },
        };

        const validUserIdentitiesNull = {
            userIdentities: {
                customerid: null,
            },
        };

        const invalidUserIdentitiesCombo = {
            userIdentities: {
                customerid: '123',
                email: undefined,
            },
        };

        // Hiding from TS validation to make sure actual unit test works in JS
        const badUserIdentitiesArrayResult = Validators.validateIdentities(badUserIdentitiesArray as unknown as any);
        const badUserIdentitiesObjectResult = Validators.validateIdentities(badUserIdentitiesObject as unknown as any);
        const badUserIdentitiesBooleanResult = Validators.validateIdentities(badUserIdentitiesBoolean as unknown as any);
        const badUserIdentitiesUndefinedResult = Validators.validateIdentities(badUserIdentitiesUndefined);

        const validUserIdentitiesNullResult = Validators.validateIdentities(validUserIdentitiesNull);
        const validUserIdentitiesStringResult = Validators.validateIdentities(validUserIdentitiesString);

        const invalidUserIdentitiesComboResult = Validators.validateIdentities(invalidUserIdentitiesCombo);

        expect(badUserIdentitiesArrayResult.valid).to.eq(false);
        expect(badUserIdentitiesObjectResult.valid).to.eq(false);
        expect(badUserIdentitiesBooleanResult.valid).to.eq(false);
        expect(badUserIdentitiesUndefinedResult.valid).to.eq(false);

        expect(validUserIdentitiesNullResult.valid).to.eq(true);
        expect(validUserIdentitiesStringResult.valid).to.eq(true);

        expect(invalidUserIdentitiesComboResult.valid).to.eq(false);

    });

    it('#isValidKeyValue should correctly validate a key value', () => {
        expect(Validators.isValidKeyValue(42)).to.eq(true);
        expect(Validators.isValidKeyValue('42')).to.eq(true);

        expect(Validators.isValidKeyValue(null)).to.eq(false);
        expect(Validators.isValidKeyValue(undefined)).to.eq(false);
        expect(Validators.isValidKeyValue([])).to.eq(false);
        expect(Validators.isValidKeyValue({})).to.eq(false);
        expect(Validators.isValidKeyValue(function (){})).to.eq(false);
    });

    it('#isStringOrNumber should correctly validate a string or number', ()=> {
        expect(Validators.isStringOrNumber(42)).to.eq(true);
        expect(Validators.isStringOrNumber('42')).to.eq(true);

        expect(Validators.isStringOrNumber(null)).to.eq(false);
        expect(Validators.isStringOrNumber(undefined)).to.eq(false);
        expect(Validators.isStringOrNumber([])).to.eq(false);
        expect(Validators.isStringOrNumber({})).to.eq(false);
        expect(Validators.isStringOrNumber(function (){})).to.eq(false);
    });

    it('#isNumber should correctly validate a number', () => {
        expect(Validators.isNumber(42)).to.eq(true);

        expect(Validators.isNumber('42')).to.eq(false);
        expect(Validators.isNumber(null)).to.eq(false);
        expect(Validators.isNumber(undefined)).to.eq(false);
        expect(Validators.isNumber([])).to.eq(false);
        expect(Validators.isNumber({})).to.eq(false);
        expect(Validators.isNumber(function (){})).to.eq(false);
    });

    it('#isFunction should correctly validate a function', () => {
        expect(Validators.isFunction(42)).to.eq(false);
        expect(Validators.isFunction('42')).to.eq(false);
        expect(Validators.isFunction(null)).to.eq(false);
        expect(Validators.isFunction(undefined)).to.eq(false);
        expect(Validators.isFunction([])).to.eq(false);
        expect(Validators.isFunction({})).to.eq(false);

        expect(Validators.isFunction(function (){})).to.eq(true);
        expect(Validators.isFunction(() => {})).to.eq(true);
    });
});