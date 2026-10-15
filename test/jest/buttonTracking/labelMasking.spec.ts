import { maskLabel } from '../../../src/buttonTracking/labelMasking';

describe('maskLabel', () => {
    it.each([
        ['Pay $84.20', 'pay $#'],
        ['  Size   10 ', 'size #'],
        ['Buy 2 for 1.234,50 €', 'buy # for # €'],
        ['ＳＡＶＥ ２０％', 'ｓａｖｅ #％'],
        ['ادفع ٨٤٫٢٠', 'ادفع #'],
    ])('masks "%s" as "%s"', (raw, masked) => {
        expect(maskLabel(raw)).toBe(masked);
    });

    it.each([
        ['an email', 'Send to jane@example.com'],
        ['a phone number', 'Call 555-123-4567'],
        ['a card number', 'Card 4111 1111 1111 1111'],
        ['an Arabic-Indic phone number', 'اتصل ٠١٢٣٤٥٦٧٨٩'],
        ['a Devanagari phone number', 'कॉल ९८७६५४३२१०'],
        ['a Gujarati phone number', 'કૉલ ૯૮૭૬૫૪૩૨૧૦'],
        ['a Tamil phone number', 'அழை ௯௮௭௬௫௪௩௨௧௦'],
        ['an order number', 'Track order 12345678'],
        ['an empty label', '   '],
        ['a sentence over 128 characters', 'a'.repeat(129)],
    ])('drops %s', (_, raw) => {
        expect(maskLabel(raw)).toBeUndefined();
    });

    it('sends no labels where Unicode property escapes are unsupported', () => {
        const NativeRegExp = RegExp;
        const NoUnicodeRegExp = function(
            pattern: string | RegExp,
            flags?: string
        ) {
            if (flags && flags.indexOf('u') !== -1) {
                throw new SyntaxError('Invalid regular expression flags');
            }
            return new NativeRegExp(pattern, flags);
        } as unknown as RegExpConstructor;
        (global as any).RegExp = NoUnicodeRegExp;
        try {
            jest.isolateModules(() => {
                const legacy = require('../../../src/buttonTracking/labelMasking');
                expect(legacy.maskLabel('Add to cart')).toBeUndefined();
                expect(legacy.maskLabel('ఫోన్ ౯౮౭౬౫౪౩౨౧౦')).toBeUndefined();
            });
        } finally {
            (global as any).RegExp = NativeRegExp;
        }
    });

    it('drops Telugu and Kannada digit runs', () => {
        expect(maskLabel('ఫోన్ ౯౮౭౬౫౪౩౨౧౦')).toBeUndefined();
        expect(maskLabel('ಕರೆ ೯೮೭೬೫೪೩೨೧೦')).toBeUndefined();
    });

    it('caps the label at 64 characters', () => {
        expect(maskLabel('b'.repeat(100))).toHaveLength(64);
    });
});
