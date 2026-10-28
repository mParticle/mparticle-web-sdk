// Masks a button label before it is logged. Button text can carry personal data,
// so this is the privacy boundary for every label and aria-label.

// Masking needs \p{Nd} to see every script's digits. Browsers without Unicode
// property escapes send no labels at all.
function createDigitPatterns(): { run: RegExp; number: RegExp } | undefined {
    try {
        return {
            run: new RegExp('\\p{Nd}{6,}', 'u'),
            number: new RegExp('\\p{Nd}+(?:[.,،٫٬]\\p{Nd}+)*', 'gu'),
        };
    } catch (e) {
        return undefined;
    }
}

const digitPatterns = createDigitPatterns();

// Longer raw labels are dropped, not cut short.
export const MAX_RAW_LABEL_LENGTH = 128;

// The label as logged: lower case, at most 64 characters, digits and amounts
// masked. Dropped when it looks like an email, phone or card number.
export function maskLabel(raw: string | null | undefined): string | undefined {
    if (!raw || raw.length > MAX_RAW_LABEL_LENGTH || !digitPatterns) {
        return undefined;
    }
    const text = raw
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    if (
        !text ||
        text.indexOf('@') !== -1 ||
        digitPatterns.run.test(text.replace(/[\s()\-‐-―]/g, ''))
    ) {
        return undefined;
    }
    const masked = text
        .replace(digitPatterns.number, '#')
        .slice(0, 64)
        .trim();
    return masked || undefined;
}

// Masks numbers and amounts in any script as '#', or undefined where the browser
// can't see every script's digits.
export function maskNumbers(text: string): string | undefined {
    return digitPatterns ? text.replace(digitPatterns.number, '#') : undefined;
}
