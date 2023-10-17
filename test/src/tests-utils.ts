import {
    converted,
    createCookieString,
    decoded,
    findKeyInObject,
    generateHash,
    generateUniqueId,
    getRampNumber,
    inArray,
    isDataPlanSlug,
    isEmpty,
    isObject,
    isStringOrNumber,
    parseNumber,
    parseStringOrNumber,
    replaceApostrophesWithQuotes,
    replaceCommasWithPipes,
    replacePipesWithCommas,
    replaceQuotesWithApostrophes,
    returnConvertedBoolean,
    revertCookieString,
    toDataPlanSlug,
} from '../../src/utils';
import { expect } from 'chai';

describe('Utils', () => {
    describe('#createCookieString', () => {
        it('should create a valid cookie string', () => {
            const before =
                '{"cgid":"abc","das":"def","dt":"hij","ie":true,"les":1505932333024,"sid":"klm"}';
            const after =
                "{'cgid':'abc'|'das':'def'|'dt':'hij'|'ie':true|'les':1505932333024|'sid':'klm'}";
            expect(createCookieString(before)).to.equal(after);
        });
    });
    describe('#revertCookieString', () => {
        it('should create a revert cookie string', () => {
            const before =
                '{"cgid":"abc","das":"def","dt":"hij","ie":true,"les":1505932333024,"sid":"klm"}';
            const after =
                "{'cgid':'abc'|'das':'def'|'dt':'hij'|'ie':true|'les':1505932333024|'sid':'klm'}";
            expect(revertCookieString(after)).to.equal(before);
        });
    });

    describe('#generateHash', () => {
        it('should a hash number with a valid input', () => {
            expect(generateHash('A'), 'A').to.equal(97);
            expect(generateHash('false')).to.equal(97196323);
            expect(generateHash('3569038')).to.equal(-412991536);
            expect(generateHash('TestHash')).to.equal(-1146196832);
            expect(generateHash('mParticle'), 'mParticle String').to.equal(
                1744810483
            );
            expect(
                generateHash('d71b49a6-4248-4581-afff-abb28dada53d')
            ).to.equal(635757846);
        });

        it('returns 0 when hashing undefined or null', () => {
            expect(generateHash(null)).to.equal(0);
            expect(generateHash(undefined)).to.equal(0);

            // Use bad values to verify expected fail cases
            expect(typeof generateHash(false as unknown as string)).to.equal(
                'number'
            );
            expect(generateHash(false as unknown as string)).to.not.equal(0);
        });
    });

    describe('#generateUniqueId', () => {
        it('generate a random value', () => {
            expect(generateUniqueId()).to.be.ok;
            expect(generateUniqueId().length).to.equal(36);
            expect(typeof generateUniqueId()).to.equal('string');

            // Tests format to be broken up by 4 hyphens
            expect(generateUniqueId().split('-').length).to.equal(5);

            window.crypto.getRandomValues = undefined;
            expect(generateUniqueId()).to.be.ok;
            // old browsers may return undefined despite
            // defining the getRandomValues API.
            window.crypto.getRandomValues = function (a) {
                a = undefined;
                return a;
            };
            expect(generateUniqueId()).to.be.ok;
        });
    });

    describe('#getRampNumber', () => {
        it('returns a ramp number', () => {
            expect(getRampNumber()).to.equal(100);
            expect(getRampNumber(null)).to.equal(100);
            expect(
                getRampNumber('2b907d8b-cefe-4530-a6fe-60a381f2e066')
            ).to.equal(60);
            expect(
                getRampNumber('d71b49a6-4248-4581-afff-abb28dada53d')
            ).to.equal(47);

            const uniqueId = generateUniqueId();
            const result = getRampNumber(uniqueId);
            expect(result).to.be.lessThan(101);
            expect(result).to.be.greaterThan(0);
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

    describe('#parseStringOrNumber', () => {
        it('should correctly parse string or number', () => {
            expect(parseStringOrNumber('abc')).to.eq('abc');
            expect(parseStringOrNumber(123)).to.eq(123);
            expect(parseStringOrNumber(({} as unknown) as string)).to.eq(null);
            expect(parseStringOrNumber(([] as unknown) as string)).to.eq(null);
            expect(parseStringOrNumber((null as unknown) as string)).to.eq(
                null
            );
        });
    });

    describe('#replaceCommasWithPipes', () => {
        it('should replace commas with pipes', () => {
            const pipes =
                '{"cgid":"abc"|"das":"def"|"dt":"hij"|"ie":true|"les":1505932333024|"sid":"klm"}';
            const commas =
                '{"cgid":"abc","das":"def","dt":"hij","ie":true,"les":1505932333024,"sid":"klm"}';

            expect(replaceCommasWithPipes(commas)).to.equal(pipes);
        });
    });

    describe('#replacePipesWithCommas', () => {
        it('should replace pipes with commas', () => {
            const pipes =
                '{"cgid":"abc"|"das":"def"|"dt":"hij"|"ie":true|"les":1505932333024|"sid":"klm"}';
            const commas =
                '{"cgid":"abc","das":"def","dt":"hij","ie":true,"les":1505932333024,"sid":"klm"}';

            expect(replacePipesWithCommas(pipes)).to.equal(commas);
        });
    });

    describe('#replaceApostrophesWithQuotes', () => {
        it('should replace apostrophes with quotes', () => {
            const quotes =
                '{"cgid":"abc"|"das":"def"|"dt":"hij"|"ie":true|"les":1505932333024|"sid":"klm"}';
            const apostrophes =
                "{'cgid':'abc'|'das':'def'|'dt':'hij'|'ie':true|'les':1505932333024|'sid':'klm'}";

            expect(replaceApostrophesWithQuotes(apostrophes)).to.equal(quotes);
        });
    });

    describe('#replaceQuotesWithApostrophes', () => {
        it('should replace quotes with apostrophes', () => {
            const quotes =
                '{"cgid":"abc"|"das":"def"|"dt":"hij"|"ie":true|"les":1505932333024|"sid":"klm"}';
            const apostrophes =
                "{'cgid':'abc'|'das':'def'|'dt':'hij'|'ie':true|'les':1505932333024|'sid':'klm'}";

            expect(replaceQuotesWithApostrophes(quotes)).to.equal(apostrophes);
        });
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

    describe('#toDataPlanSlug', () => {
        it('should convert a string to a slug', () => {
            expect(toDataPlanSlug('string')).to.equal('string');
            expect(toDataPlanSlug('42')).to.equal('42');
            expect(toDataPlanSlug(37)).to.equal('37');
            expect(toDataPlanSlug('string with spaces')).to.equal('string_with_spaces');
            expect(toDataPlanSlug('kabob-case-string')).to.equal('kabob_case_string');
            expect(toDataPlanSlug('PascalSlug')).to.equal('pascalslug');
            expect(toDataPlanSlug('under_score_slug')).to.equal('under_score_slug');
        });

        it('should convert non-strings to an empty string', () => {
            expect(toDataPlanSlug(true)).to.equal('');
            expect(toDataPlanSlug([])).to.equal('');
            expect(toDataPlanSlug({})).to.equal('');
            expect(toDataPlanSlug(null)).to.equal('');
            expect(toDataPlanSlug(undefined)).to.equal('');
            expect(toDataPlanSlug(()=>{})).to.equal('');
        });
    });

    describe('#isDataPlanSlug', function () {
        it('handles numbers', function () {
            // Non-strings will be rejected. This is to simply validate
            // that it returns false
            expect(isDataPlanSlug(35 as unknown as string)).to.equal(false);
        });

        it('handles spaces', function () {
            expect(isDataPlanSlug('Slug with spaces in')).to.equal(false);
        });

        it('handles PascalCase', function () {
            expect(isDataPlanSlug('PascalSlug')).to.equal(false);
        });

        it('handles kabob-case-slug', function () {
            expect(isDataPlanSlug('kabob-case-slug')).to.equal(false);
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
