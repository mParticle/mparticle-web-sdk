import { converted, decoded, findKeyInObject, inArray, isObject, parseNumber, returnConvertedBoolean } from '../../src/utils';
import { expect } from 'chai';

describe('Utils', () => {
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
});
