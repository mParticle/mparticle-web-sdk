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
// Product words that name a way to buy, not an order: `pre-order`, `on-order`,
// `made-to-order`, `back-order`.
const PRODUCT_ORDER_WORD = /(?:^|[-_])(?:pre|on|to|back)[-_]orders?(?:[-_]|$)/i;

export function hidesNextSegment(route: string): boolean {
    return (
        PERSONAL_ROUTE.test(route) ||
        (ORDER_ROUTE.test(route) && !PRODUCT_ORDER_WORD.test(route))
    );
}

// How many times a value is decoded at most, so one encoded twice or more reads
// as its plain text.
const MAX_DECODES = 5;

// Decodes until the text stops changing. Undefined when the first decode fails;
// a later failure keeps what decoded so far, as a literal `%` would.
export function decodeFully(text: string): string | undefined {
    let current = text;
    for (let i = 0; i < MAX_DECODES; i++) {
        let next: string;
        try {
            next = decodeURIComponent(current);
        } catch (e) {
            return i === 0 ? undefined : current;
        }
        if (next === current) {
            return current;
        }
        current = next;
    }
    return current;
}

// The route word in a raw path segment: its last part behind an encoded slash,
// read before any matrix parameter such as `;jsessionid=`, its `;` encoded once,
// twice or not at all, so a parameter's own value never hides it. Undefined when
// it can't be decoded.
function routeWord(segment: string): string | undefined {
    let text = segment;
    for (let i = 0; i < MAX_DECODES; i++) {
        const route = text.split(/;|%3B/i)[0];
        let next: string;
        try {
            next = decodeURIComponent(route);
        } catch (e) {
            return i === 0 ? undefined : route.split('/').pop();
        }
        if (next === route) {
            return route.split('/').pop();
        }
        text = next;
    }
    return text
        .split(/;|%3B/i)[0]
        .split('/')
        .pop();
}

// A piece with a lowercase letter right before an uppercase one, as a random
// code has and a Title-Case word doesn't.
const INNER_CASE_SWITCH = /[a-z][A-Z]/;

// `+` sits inside base64 tokens, so it never splits one. A token that `-` or `_`
// cuts into short pieces still switches case like one across them, which
// Title-Case-Words joined by hyphens only do between pieces.
export function isTokenSegment(segment: string): boolean {
    const text = segment.replace(/\+/g, '');
    const pieces = text.split(/[-_.~]/);
    return (
        pieces.some(
            token => MIXED_TOKEN.test(token) || CASE_SWITCHING_TOKEN.test(token)
        ) ||
        (pieces.some(piece => INNER_CASE_SWITCH.test(piece)) &&
            CASE_SWITCHING_TOKEN.test(pieces.join('')))
    );
}

// A page path as the SDK sends it. A segment that can single out one shopper
// goes as `*`: one holding an @, `;` or `=`, a token, or the one after a route
// that names a person, carries a code or opens an order. Kept segments stay
// exactly as the page has them, plain numbers included, since on a product page
// they name the product.
export function pagePath(pathname: string): string {
    const segments = pathname.split('/');
    return segments
        .map((segment, i) => {
            const text = decodeFully(segment);
            // The route word comes from the last segment before this one that
            // isn't empty, so `/orders//12345678` still hides the order.
            let routeIndex = i - 1;
            while (routeIndex > 0 && segments[routeIndex] === '') {
                routeIndex--;
            }
            const previous =
                i > 0 ? routeWord(segments[routeIndex]) : undefined;
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
