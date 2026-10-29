// Masks the parts of a page path that can single out one shopper: pagePath for
// the path a click logs, pageUrlPath for the page URL and page views every event
// carries.

// A token of letters and digits mixed, six or more long, as session ids,
// hex and UUID parts and invite codes are: `A1B2C3D4E5F6`, `550e8400`.
const MIXED_TOKEN = /^(?=[^0-9]*[0-9])(?=[^A-Za-z]*[A-Za-z])[A-Za-z0-9]{6,}$/;
// Letters alone, eight or more long, switching case three times or more, as a
// random code does (`xKpQzRtV`) and a camel-case route word rarely does.
const CASE_SWITCHING_TOKEN = /^(?=[A-Za-z]{8,}$)(?:[^a-z]*[a-z]+[A-Z]){3}/;
// Route words whose next segment names one person or carries a one-time code,
// as in `/profile/jane-smith` or `/reset/abcdefgh`. A bare `u` isn't one: sites
// use it for whole account sections, such as `/u/login`.
const PERSONAL_ROUTE = /^(?:user|users|profile|profiles|member|members|people|reset|reset-password|password|verify|verification|confirm|activate|invite|invitation|token|unsubscribe|magic-link)$/i;

// Route words whose next segment is one shopper's order: any with `order` or
// `orders` as a whole word part, as in `view-order`, `order-received` or `order_id`.
const ORDER_ROUTE = /(?:^|[-_])orders?(?:[-_]|$)/i;
// Product words that name a way to buy, not an order: `pre-order`, `on-order`,
// `back-order`, `made-to-order`, as the whole route word only, so
// `return-to-order` and `pre-order-status` stay routes.
const PRODUCT_ORDER_WORD = /^(?:(?:pre|on|back)[-_]|made[-_]to[-_])orders?$/i;
// A `;` that starts a matrix parameter, plain or encoded any number of times.
const MATRIX_SEPARATOR = /;|%(?:25)*3B/i;
// A valid escape left after decoding stopped, as when a literal `%` before it
// can't be decoded again. What it hides is unknown, so it counts as sensitive.
export const LEFTOVER_ESCAPE = /%[0-9A-F]{2}/i;

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
// it can't be decoded, or is still encoded after MAX_DECODES.
function routeWord(segment: string): string | undefined {
    let text = segment;
    for (let i = 0; i < MAX_DECODES; i++) {
        const route = text.split(MATRIX_SEPARATOR)[0];
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
    return undefined;
}

// The last segment before index i that isn't empty, so `/orders//12345678`
// still reads the order route.
export function routeSegment(segments: string[], i: number): string {
    let routeIndex = i - 1;
    while (routeIndex > 0 && segments[routeIndex] === '') {
        routeIndex--;
    }
    return segments[routeIndex];
}

// A piece with a lowercase letter right before an uppercase one, as a random
// code has and a Title-Case word doesn't.
const INNER_CASE_SWITCH = /[a-z][A-Z]/;

const isToken = (text: string): boolean =>
    MIXED_TOKEN.test(text) || CASE_SWITCHING_TOKEN.test(text);

const mixesLettersAndDigits = (piece: string): boolean =>
    /[0-9]/.test(piece) && /[A-Za-z]/.test(piece);

// `+` sits inside base64 tokens, so it never splits one. A token that `-` or `_`
// cuts into short pieces is still one when the pieces read as one joined and
// either a piece switches case inside it or two or more pieces mix letters and
// digits, as `a1b2-c3d4-e5f6` does. Title-Case-Words and plain slugs such as
// `iphone-15-pro` do neither.
export function isTokenSegment(segment: string): boolean {
    const text = segment.replace(/\+/g, '');
    const pieces = text.split(/[-_.~]/);
    const joined = pieces.join('');
    return (
        pieces.some(isToken) ||
        (pieces.some(piece => INNER_CASE_SWITCH.test(piece)) &&
            isToken(joined)) ||
        (pieces.filter(mixesLettersAndDigits).length >= 2 &&
            MIXED_TOKEN.test(joined))
    );
}

// A word a page or product name is made of: three or more letters that don't
// switch case like a code.
const isWord = (piece: string): boolean =>
    /^[A-Za-z]{3,}$/.test(piece) && !CASE_SWITCHING_TOKEN.test(piece);

// A segment that holds a token, with only its token pieces as `*` when the rest
// reads as words, so `trail-runner-gtx-zq7Kd93Lm41` goes as
// `trail-runner-gtx-*`. A piece that can't be decoded or decodes to a
// separator counts as a token. The segment goes whole as `*` when no piece is a
// word, as an id or checkout token's pieces aren't, or when the token only shows
// once its pieces are joined. Undefined when the segment holds no token.
// `segment` is as the page has it, `text` decoded.
export function maskTokenSegment(
    segment: string,
    text: string
): string | undefined {
    if (!isTokenSegment(text)) {
        return undefined;
    }
    const parts = segment.split(/([-_.~])/);
    const pieces: Array<{ raw: string; token: boolean } | null> = parts.map(
        (part, i) => {
            if (i % 2 === 1) {
                return null;
            }
            const piece = decodeFully(part);
            return piece === undefined || /[-_.~]/.test(piece)
                ? { raw: part, token: true }
                : { raw: part, token: isToken(piece.replace(/\+/g, '')) };
        }
    );
    const kept = pieces.filter(piece => piece && !piece.token);
    if (
        !pieces.some(piece => piece && piece.token) ||
        !kept.some(piece => isWord(decodeFully(piece.raw) || ''))
    ) {
        return '*';
    }
    return parts
        .map((part, i) => {
            const piece = pieces[i];
            return piece && piece.token ? '*' : part;
        })
        .join('');
}

// The path a click logs. A segment that can single out one shopper
// goes as `*`: one holding an @, `;` or `=`, an id, or the one after a route
// that names a person, carries a code or opens an order. A token inside a name
// goes as `*` alone. Kept segments stay exactly as the page has them, plain
// numbers included, since on a product page they name the product.
export function pagePath(pathname: string): string {
    const segments = pathname.split('/');
    return segments
        .map((segment, i) => {
            const text = decodeFully(segment);
            const route = i > 0 ? routeWord(routeSegment(segments, i)) : '';
            // A route word that can't be decoded may be any route, so the
            // segment after it is hidden too.
            const hiddenByRoute =
                i > 0 &&
                !!text &&
                (route === undefined || hidesNextSegment(route));
            // An encoded slash hides several segments in one, so it goes whole.
            if (
                text === undefined ||
                /[@;=/]/.test(text) ||
                LEFTOVER_ESCAPE.test(text) ||
                hiddenByRoute
            ) {
                return '*';
            }
            const masked = maskTokenSegment(segment, text);
            return masked === undefined ? segment : masked;
        })
        .join('/');
}

// A token long enough that no page or product name looks like it: 16 or more
// letters and digits mixed, as checkout tokens are, 16 or more letters
// switching case like a random code, or a UUID.
const LONG_MIXED_TOKEN = /^(?=[^0-9]*[0-9])(?=[^A-Za-z]*[A-Za-z])[A-Za-z0-9]{16,}$/;
const LONG_CASE_SWITCHING_TOKEN = /^(?=[A-Za-z]{16,}$)(?:[^a-z]*[a-z]+[A-Z]){3}/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A token that `-` or `_` cuts into shorter pieces counts when two or more
// pieces mix letters and digits, as `a1b2c3d4-e5f6g7h8` does and a product slug
// such as `acmephone-15-pro-max-256gb` doesn't.
function isLongToken(segment: string): boolean {
    const pieces = segment.replace(/\+/g, '').split(/[-_.~]/);
    return (
        UUID.test(segment) ||
        pieces.some(
            piece =>
                LONG_MIXED_TOKEN.test(piece) ||
                LONG_CASE_SWITCHING_TOKEN.test(piece)
        ) ||
        (pieces.filter(mixesLettersAndDigits).length >= 2 &&
            LONG_MIXED_TOKEN.test(pieces.join('')))
    );
}

// The path every event carries, in its page URL and page views, where a
// wrong `*` costs every output the page it names. Only what reliably singles
// out one shopper goes as `*`: a segment holding an @, `;` or `=`, one that
// can't be decoded or still holds an escape, a long token, and the one after a
// route that names a person or opens an order when it holds a digit or a token.
// Product codes and pages such as `/profile/edit` or `/orders/history` stay.
export function pageUrlPath(pathname: string): string {
    const segments = pathname.split('/');
    return segments
        .map((segment, i) => {
            const text = decodeFully(segment);
            const route = i > 0 ? routeWord(routeSegment(segments, i)) : '';
            const holdsId =
                !!text && (/[0-9]/.test(text) || isTokenSegment(text));
            // A route word that can't be decoded may be any route.
            const hiddenByRoute =
                i > 0 &&
                !!text &&
                (route === undefined || (hidesNextSegment(route) && holdsId));
            return text === undefined ||
                /[@;=/]/.test(text) ||
                LEFTOVER_ESCAPE.test(text) ||
                isLongToken(text) ||
                hiddenByRoute
                ? '*'
                : segment;
        })
        .join('/');
}
