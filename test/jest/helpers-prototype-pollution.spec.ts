import Helpers from '../../src/helpers';

describe('Helpers - Prototype Pollution Protection', () => {
    let helpers: any;
    let mockMpInstance: any;

    beforeEach(() => {
        // Clear any potential pollution
        delete (Object.prototype as any).isAdmin;
        delete (Object.prototype as any).polluted;
        delete (Object.prototype as any).testProp;

        mockMpInstance = {
            _Store: {
                SDKConfig: {
                    flags: {}
                }
            },
            Logger: {
                verbose: jest.fn(),
                warning: jest.fn(),
                error: jest.fn()
            }
        };

        helpers = new Helpers(mockMpInstance);
    });

    afterEach(() => {
        // Cleanup
        delete (Object.prototype as any).isAdmin;
        delete (Object.prototype as any).polluted;
        delete (Object.prototype as any).testProp;
    });

    describe('extend() - Prototype Pollution Prevention', () => {
        it('should block __proto__ in shallow merge', () => {
            const malicious = JSON.parse('{"__proto__": {"isAdmin": true}}');
            const result = helpers.extend({}, malicious);

            const testObj = {};
            expect((testObj as any).isAdmin).toBeUndefined();
            expect((Object.prototype as any).isAdmin).toBeUndefined();
        });

        it('should block __proto__ in deep merge', () => {
            const malicious = JSON.parse('{"__proto__": {"polluted": "yes"}}');
            const result = helpers.extend(true, {}, malicious);

            const testObj = {};
            expect((testObj as any).polluted).toBeUndefined();
            expect((Object.prototype as any).polluted).toBeUndefined();
        });

        it('should block constructor property', () => {
            const malicious = JSON.parse('{"constructor": {"polluted": "constructor"}}');
            const result = helpers.extend({}, malicious);

            const testObj = {};
            expect((testObj as any).polluted).toBeUndefined();
        });

        it('should block prototype property', () => {
            const malicious = JSON.parse('{"prototype": {"polluted": "prototype"}}');
            const result = helpers.extend({}, malicious);

            const testObj = {};
            expect((testObj as any).polluted).toBeUndefined();
        });

        it('should only copy own properties', () => {
            const parent = { inherited: 'value' };
            const child = Object.create(parent);
            child.own = 'ownValue';

            const result = helpers.extend({}, child);

            expect(result.own).toBe('ownValue');
            expect(result.inherited).toBeUndefined();
        });

        it('should still merge normal properties correctly', () => {
            const source = {
                name: 'John',
                age: 30,
                address: {
                    city: 'NYC',
                    zip: '10001'
                }
            };

            const result = helpers.extend(true, {}, source);

            expect(result.name).toBe('John');
            expect(result.age).toBe(30);
            expect(result.address.city).toBe('NYC');
            expect(result.address.zip).toBe('10001');
        });

        it('should handle nested objects without pollution', () => {
            const malicious = {
                user: {
                    name: 'John',
                    __proto__: { isAdmin: true }
                }
            };

            const result = helpers.extend(true, {}, malicious);

            expect(result.user.name).toBe('John');
            
            const testObj = {};
            expect((testObj as any).isAdmin).toBeUndefined();
            expect((Object.prototype as any).isAdmin).toBeUndefined();
        });

        it('should handle multiple source objects', () => {
            const obj1 = { a: 1 };
            const obj2 = { b: 2 };
            const malicious = JSON.parse('{"__proto__": {"polluted": true}}');

            const result = helpers.extend({}, obj1, obj2, malicious);

            expect(result.a).toBe(1);
            expect(result.b).toBe(2);

            const testObj = {};
            expect((testObj as any).polluted).toBeUndefined();
        });

        it('should handle arrays correctly', () => {
            const source = {
                items: [1, 2, 3],
                nested: {
                    arr: ['a', 'b']
                }
            };

            const result = helpers.extend(true, {}, source);

            expect(Array.isArray(result.items)).toBe(true);
            expect(result.items).toEqual([1, 2, 3]);
            expect(result.nested.arr).toEqual(['a', 'b']);
        });
    });

    describe('Real-world attack scenarios', () => {
        it('should protect against localStorage-based attack', () => {
            // Simulate malicious localStorage data
            const localStorageData = JSON.parse('{"__proto__": {"isAdmin": true}, "user": {"name": "attacker"}}');
            
            const result = helpers.extend(false, {}, localStorageData);

            expect(result.user.name).toBe('attacker');

            const testObj = {};
            expect((testObj as any).isAdmin).toBeUndefined();
        });

        it('should protect against nested pollution attempts', () => {
            const malicious = {
                config: {
                    settings: {
                        __proto__: { polluted: true }
                    }
                }
            };

            const result = helpers.extend(true, {}, malicious);

            const testObj = {};
            expect((testObj as any).polluted).toBeUndefined();
        });

        it('should handle mixed legitimate and malicious data', () => {
            const mixed = {
                validProp: 'valid',
                __proto__: { isAdmin: true },
                anotherValid: 123,
                constructor: { polluted: true },
                nested: {
                    data: 'ok'
                }
            };

            const result = helpers.extend(true, {}, mixed);

            // Valid properties should be copied
            expect(result.validProp).toBe('valid');
            expect(result.anotherValid).toBe(123);
            expect(result.nested.data).toBe('ok');

            // Pollution should be blocked
            const testObj = {};
            expect((testObj as any).isAdmin).toBeUndefined();
            expect((testObj as any).polluted).toBeUndefined();
        });
    });
});


