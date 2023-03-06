import {
    converted,
    decoded,
    findKeyInObject,
    generateHash,
    generateRandomValue,
    generateUniqueId,
    getRampNumber,
    inArray,
    isDataPlanSlug,
    isEmpty,
    isObject,
    isStringOrNumber,
    parseNumber,
    parseStringOrNumber,
    returnConvertedBoolean
} from '../../src/utils';
import { expect } from 'chai';

describe('Utils', () => {
    describe('#generateHash', () => {
        it('should return a valid hash', () => {
            expect(generateHash('A'), 'A').to.equal(97);
            expect(generateHash(false)).to.equal(97196323);
            expect(generateHash('3569038')).to.equal(-412991536);
            expect(generateHash(3569038)).to.equal(-412991536);
            expect(generateHash('TestHash')).to.equal(-1146196832);
            expect(generateHash('mParticle'), 'mParticle String').to.equal(1744810483);
        });

        it('returns 0 when hashing undefined or null', () => {
            expect(generateHash(null)).to.equal(0);
            expect(generateHash(undefined)).to.equal(0);
            expect(typeof generateHash(false)).to.equal('number');
            expect(generateHash(false)).to.not.equal(0);
        });
    });

    describe.only('#generateRandomValue', () => {
        it('should generate random values', () => {
            // @ts-ignore
            expect(generateRandomValue().length).to.equal(1);
            expect(generateRandomValue()).to.equal('1234567');
        });
    });

    describe('#generateUniqueId', () => {
        it('returns a unique ID', () => {
            expect(generateUniqueId()).to.be.ok;
            expect(generateUniqueId().length).to.equal(36);
            expect(typeof generateUniqueId()).to.equal('string');

            // Tests format to be broken up by 5 hypens
            expect(generateUniqueId().split('-').length).to.equal(5);
        });
    });

    describe('#getRampNumber', () => {
        it('returns a ramp number', () =>{
            expect(getRampNumber()).to.equal(100);
            expect(getRampNumber(null)).to.equal(100);

            expect(getRampNumber('2b907d8b-cefe-4530-a6fe-60a381f2e066')).to.equal(100);
        });
    });

    describe('#isObject', () => {
        it('returns true if object is an object', () => {
            const validObject = {
                foo: 'bar',
                fizz:'buzz',
            };
            expect(isObject(validObject)).to.eq(true);
        });

        it('returns false if object is not an object', () => {
            expect(isObject('not an object')).to.eq(false);
            expect(isObject(42)).to.eq(false);
            expect(isObject(null)).to.eq(false);
            expect(isObject(undefined)).to.eq(false);
            expect(isObject(false)).to.eq(false);
            expect(isObject(true)).to.eq(false);
        });

    });

    describe('#isStringOrNumber', () => {
        it(' should correctly validate a string or number', ()=> {
            expect(isStringOrNumber(42)).to.eq(true);
            expect(isStringOrNumber('42')).to.eq(true);

            expect(isStringOrNumber(null)).to.eq(false);
            expect(isStringOrNumber(undefined)).to.eq(false);
            expect(isStringOrNumber([])).to.eq(false);
            expect(isStringOrNumber({})).to.eq(false);
            expect(isStringOrNumber(function (){})).to.eq(false);
        });
    });

    describe('#parseNumber', () => {
        it('should parse a number into a number', () => {
            expect(parseNumber('42')).to.eq(42);
            expect(parseNumber('-42')).to.eq(-42);
            expect(parseNumber('007')).to.eq(7);
            expect(parseNumber(42)).to.eq(42);
            expect(parseNumber(-42)).to.eq(-42);
            expect(parseNumber('not an number')).to.eq(0);
            expect(parseNumber('3.50')).to.eq(3.5);
        });
    });

    describe('#parseStringOrNumber', ()=> {
        it('should correctly parse string or number', ()=> {
            expect(parseStringOrNumber('abc')).to.eq('abc');
            expect(parseStringOrNumber(123)).to.eq(123);
            expect(parseStringOrNumber({} as unknown as string)).to.eq(null);
            expect(parseStringOrNumber([] as unknown as string)).to.eq(null);
            expect(parseStringOrNumber(null as unknown as string)).to.eq(null);
        })
    });

    describe('#returnConvertedBoolean', () => {
        it ('returns expected boolean value when strings are passed', () => {
            returnConvertedBoolean('false').should.equal(false);
            returnConvertedBoolean(false).should.equal(false);
            returnConvertedBoolean('true').should.equal(true);
            returnConvertedBoolean('true').should.equal(true);
            returnConvertedBoolean('randomstring').should.equal(true);
            returnConvertedBoolean(0).should.equal(false);
            returnConvertedBoolean(1).should.equal(true);
            returnConvertedBoolean('0').should.equal(false);
            returnConvertedBoolean('1').should.equal(true);
            returnConvertedBoolean(null).should.equal(false);
            returnConvertedBoolean(undefined).should.equal(false);
            returnConvertedBoolean('').should.equal(false);
        });
    });

    describe('#inArray', () => {
        it('returns true if element is in the array', ()=> {
            const things = ['people', 'places', 'things'];

            expect(inArray(things, 'people')).to.eq(true);
        });

        it('returns false if element is not in the array', ()=> {
            const things = ['people', 'places', 'things'];

            expect(inArray(things, 'cats')).to.eq(false);
        });
    });

    describe('#findKeyInObject', () => {
        it('returns the key if it exists in the object', () => {
            const things = {
                sunglasses: true,
                suit: 'black',
                music: 'blues',
            };

            expect(findKeyInObject(things, 'music')).to.eq('music')
        });

        it('returns null if the key is not in the object', () => {
            const things = {
                sunglasses: true,
                suit: 'black',
                music: 'blues',
            };

            expect(findKeyInObject(things, 'car')).to.be.null;
        });
    });

    describe('#decoded', () => {
        it('should replace pluses with spaces', () => {
            expect(decoded('f++o+++o')).to.equal('f  o   o');
        });
    });

    describe('#converted', () => {
        it('should convert cookie strings', () => {
            const cookieString = "{'sid':'1992BDBB-AD74-49DB-9B20-5EC8037E72DE'|'ie':1|'ua':'eyJ0ZXN'0Ijoiwq7igJkifQ=='";
            expect(converted(cookieString)).to.eq("{\'sid\':\'1992BDBB-AD74-49DB-9B20-5EC8037E72DE\'|\'ie\':1|\'ua\':\'eyJ0ZXN\'0Ijoiwq7igJkifQ==\'")
        })
    });

    describe('#isDataPlanSlug', function () {
        it('handles numbers', function () {
            expect(isDataPlanSlug(35 as unknown as string)).to.equal(false);
        });

        it('handles spaces', function () {
            expect(isDataPlanSlug('Slug with spaces in')).to.equal(false);
        });

        it('handles PascalCase', function () {
            // TODO: Remove support for kabob case once we remove slugify
            expect(isDataPlanSlug('PascalSlug')).to.equal(true);
        });

        it('handles kabob-case-slug', function () {
            // TODO: Remove support for kabob case once we remove slugify
            expect(isDataPlanSlug('kabob-case-slug')).to.equal(true);
        });

        it('handles simple string', function () {
            expect(isDataPlanSlug('slug')).to.equal(true);
        });

        it('handles under_score_slug', function () {
            expect(isDataPlanSlug('under_score_slug')).to.equal(true);
        });

        it('handles numerical strings', function () {
            expect(isDataPlanSlug('42')).to.equal(true);
        });
    });

    describe('#isEmpty', () => {
        it('returns true if array is empty', () => {
            expect(isEmpty([])).to.equal(true);
        });

        it('returns false if array is not empty', () => {
            expect(isEmpty([1, 2, 3])).to.equal(false);
        });

        it('returns true if object is empty', ()=> {
            expect(isEmpty({})).to.equal(true);
        });

        it('returns false if object is not empty', ()=> {
            expect(isEmpty({'foo': 'bar'})).to.equal(false);
        });

        it('returns true if object is null', () => {
            expect(isEmpty(null)).to.equal(true);
        });

        it('returns true if object is undefined', () => {
            expect(isEmpty(undefined)).to.equal(true);
        });
    });
});
