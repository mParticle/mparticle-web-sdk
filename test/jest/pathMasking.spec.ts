import { pagePath, pageUrlPath, routeSegments } from '../../src/pathMasking';
import { cleanUrl, UrlMode } from '../../src/pageUrl';

describe('routeSegments', () => {
    it('gives each index the last segment before it that is not empty', () => {
        expect(routeSegments(['', 'orders', '', '', '12345678'])).toEqual([
            '',
            '',
            'orders',
            'orders',
            'orders',
        ]);
    });

    it('reads each segment a bounded number of times, however many are empty', () => {
        const segments: string[] = new Array(100001).fill('');
        let reads = 0;
        const counted = new Proxy(segments, {
            get(target, key) {
                if (typeof key === 'string' && /^[0-9]+$/.test(key)) {
                    reads++;
                }
                return Reflect.get(target, key);
            },
        });

        routeSegments(counted);

        expect(reads).toBeLessThanOrEqual(2 * segments.length);
    });
});

describe('a path of many empty segments', () => {
    it('still reads the route before the empty segments', () => {
        expect(pageUrlPath('/orders//12345678')).toBe('/orders//*');
        expect(pagePath('/orders//12345678')).toBe('/orders//*');
    });

    it('masks a hash route of many slashes, keeping every slash', () => {
        const slashes = '/'.repeat(100000);

        expect(
            cleanUrl(
                `https://shop.example.com/#${slashes}orders/12345678`,
                UrlMode.Full
            )
        ).toBe(`https://shop.example.com/#${slashes}orders/*`);
    });

    it('does not re-decode the preceding route segment across empty segments in pagePath or pageUrlPath', () => {
        const longSegment = 'a'.repeat(2000);
        const slashes = '/'.repeat(2000);
        const path = `/${longSegment}${slashes}orders/12345678`;
        const spy = jest.spyOn(global, 'decodeURIComponent');
        let decodedChars = 0;
        spy.mockImplementation((val: string) => {
            decodedChars += String(val).length;
            return val;
        });

        try {
            expect(pageUrlPath(path)).toBe(`/${longSegment}${slashes}orders/*`);
            expect(pagePath(path)).toBe(`/${longSegment}${slashes}orders/*`);
            expect(decodedChars).toBeLessThanOrEqual(8 * longSegment.length);
        } finally {
            spy.mockRestore();
        }
    });
});
