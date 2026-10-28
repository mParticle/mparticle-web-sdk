// Masks the parts of a page path that can single out one shopper, for every
// path the SDK sends: page URLs, page views and clicks.

// A token of letters and digits mixed, six or more long, as session ids,
// hex and UUID parts and invite codes are: `A1B2C3D4E5F6`, `550e8400`.
const MIXED_TOKEN = /^(?=[^0-9]*[0-9])(?=[^A-Za-z]*[A-Za-z])[A-Za-z0-9]{6,}$/;
// Letters alone, eight or more long, switching case three times or more, as a
// random code does (`xKpQzRtV`) and a camel-case route word rarely does.
const CASE_SWITCHING_TOKEN = /^(?=[A-Za-z]{8,}$)(?:[^a-z]*[a-z]+[A-Z]){3}/;
// Route words whose next segment names one person or carries a one-time code,
// as in `/profile/jane-smith` or `/reset/abcdefgh`.
const PERSONAL_ROUTE = /^(?:u|user|users|profile|profiles|member|members|people|reset|reset-password|password|verify|verification|confirm|activate|invite|invitation|token|unsubscribe|magic-link)$/i;

// Route words whose next segment is one shopper's order: any with `order` or
// `orders` as a whole word part, as in `view-order`, `order-received` or `order_id`.
const ORDER_ROUTE = /(?:^|[-_])orders?(?:[-_]|$)/i;

export function hidesNextSegment(route: string): boolean {
    return PERSONAL_ROUTE.test(route) || ORDER_ROUTE.test(route);
}

// The route word in a raw path segment: its last part behind an encoded slash,
// read before any matrix parameter such as `;jsessionid=`, its `;` encoded or
// not, so a parameter's own value never hides it. Undefined when it can't be
// decoded.
function routeWord(segment: string): string | undefined {
    try {
        return decodeURIComponent(segment.split(/;|%3B/i)[0])
            .split('/')
            .pop();
    } catch (e) {
        return undefined;
    }
}

export function isTokenSegment(segment: string): boolean {
    return segment
        .split(/[-_.~]/)
        .some(
            token => MIXED_TOKEN.test(token) || CASE_SWITCHING_TOKEN.test(token)
        );
}

// A page path as the SDK sends it. A segment that can single out one shopper
// goes as `*`: one holding an @, `;` or `=`, a token, or the one after a route
// that names a person, carries a code or opens an order. Kept segments stay
// exactly as the page has them, plain numbers included, since on a product page
// they name the product.
export function pagePath(pathname: string): string {
    const segments = pathname.split('/');
    const decoded = segments.map(segment => {
        try {
            return decodeURIComponent(segment);
        } catch (e) {
            return undefined;
        }
    });
    return segments
        .map((segment, i) => {
            const text = decoded[i];
            const previous = i > 0 ? routeWord(segments[i - 1]) : undefined;
            // An encoded slash hides several segments in one, so it goes whole.
            return text === undefined ||
                /[@;=/]/.test(text) ||
                isTokenSegment(text) ||
                (i > 0 &&
                    !!text &&
                    previous !== undefined &&
                    hidesNextSegment(previous))
                ? '*'
                : segment;
        })
        .join('/');
}
