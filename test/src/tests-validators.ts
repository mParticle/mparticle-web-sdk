import Validators from '../../src/validators';
import { expect } from 'chai';

describe('Validators', () => {
    it('should correctly validate an attribute value', ()=> {
        var validatedString = Validators.isValidAttributeValue('testValue1');
        var validatedNumber = Validators.isValidAttributeValue(1);
        var validatedNull = Validators.isValidAttributeValue(null);
        var validatedObject = Validators.isValidAttributeValue({});
        var validatedArray = Validators.isValidAttributeValue([]);
        var validatedUndefined = Validators.isValidAttributeValue(undefined);

        expect(validatedString).to.eq(true);
        expect(validatedNumber).to.eq(true);
        expect(validatedNull).to.eq(true);
        expect(validatedObject).to.eq(false);
        expect(validatedArray).to.eq(false);
        expect(validatedUndefined).to.eq(false);
    });

    it('should properly validate identityApiRequest values', ()=> {
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
});