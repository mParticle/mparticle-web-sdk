import { maskLabel } from './labelMasking';

// The product a product page describes, from the schema.org markup sites
// publish for search engines. Only its id and category are read: never its
// name, price, image or address, and never any other type of markup, such as
// the Person or Order markup an account page can carry.
export interface IPageProduct {
    id: string;
    category?: string;
}

const MAX_SCRIPTS = 10;
const MAX_SCRIPT_LENGTH = 100000;
// An identifier: letters, digits and . _ - only, so an email address or free
// text never passes, and no run of digits as long as a card number.
const PRODUCT_ID = /^[A-Za-z0-9._-]{1,64}$/;
const LONG_DIGITS = /[0-9]{13,}/;
const ID_FIELDS = ['productID', 'sku', 'mpn'];

// Interest in these says something sensitive about the shopper: health,
// sexual life, religion, politics, or a child in the household. A product
// in one of them sends nothing at all.
const SENSITIVE_STEMS = [
    'health',
    'medic',
    'pharmac',
    'drug',
    'prescription',
    'vitamin',
    'supplement',
    'sexual',
    'adult',
    'intimate',
    'condom',
    'lubric',
    'pregnan',
    'fertil',
    'ovulat',
    'contracept',
    'incontinen',
    'religio',
    'bible',
    'prayer',
    'politic',
    'baby',
    'babies',
    'infant',
    'toddler',
    'child',
    'maternity',
    'diaper',
];
const SENSITIVE_WORDS = ['sex', 'hiv', 'std', 'rx', 'cbd', 'kid', 'kids'];

export function isSensitiveCategory(category: string): boolean {
    return category
        .toLowerCase()
        .split(/[^a-z]+/)
        .some(
            word =>
                SENSITIVE_WORDS.indexOf(word) !== -1 ||
                SENSITIVE_STEMS.some(stem => word.indexOf(stem) === 0)
        );
}

type Node = { [key: string]: unknown };

function isType(node: unknown, type: string): node is Node {
    if (!node || typeof node !== 'object') {
        return false;
    }
    const value = (node as Node)['@type'];
    return Array.isArray(value) ? value.indexOf(type) !== -1 : value === type;
}

// The top-level nodes of one block: an array, a @graph, or the block itself.
function nodesOf(json: unknown): unknown[] {
    if (Array.isArray(json)) {
        return json;
    }
    const graph = json && typeof json === 'object' ? (json as Node)['@graph'] : undefined;
    return Array.isArray(graph) ? graph : [json];
}

function productId(product: Node): string | undefined {
    for (const field of ID_FIELDS) {
        const value = product[field];
        if (typeof value === 'string' || typeof value === 'number') {
            const id = String(value).trim();
            if (PRODUCT_ID.test(id) && !LONG_DIGITS.test(id)) {
                return id;
            }
        }
    }
    return undefined;
}

// A breadcrumb's names in order, without its last step, which on a product
// page is the product itself.
function breadcrumbCategory(list: Node): string | undefined {
    const items = list.itemListElement;
    if (!Array.isArray(items)) {
        return undefined;
    }
    const names = items
        .map(item => {
            const entry = item as Node;
            const thing = entry && entry.item && typeof entry.item === 'object' ? (entry.item as Node) : undefined;
            const name = entry && typeof entry.name === 'string' ? entry.name : thing && thing.name;
            return typeof name === 'string' ? name.trim() : '';
        })
        .filter(name => !!name && name.toLowerCase() !== 'home');
    names.pop();
    return names.length ? names.join(' > ') : undefined;
}

// The single product the page describes, or undefined when it describes none,
// several (a listing or the bag), only an unusable id, or a sensitive category.
export function readPageProduct(doc: Document): IPageProduct | undefined {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    const ids: string[] = [];
    let category: string | undefined;
    let crumbs: string | undefined;
    for (let i = 0; i < scripts.length && i < MAX_SCRIPTS; i++) {
        const text = scripts[i].textContent || '';
        if (text.length > MAX_SCRIPT_LENGTH) {
            continue;
        }
        let json: unknown;
        try {
            json = JSON.parse(text);
        } catch (e) {
            continue;
        }
        for (const node of nodesOf(json)) {
            if (isType(node, 'Product')) {
                const id = productId(node);
                if (!id) {
                    return undefined;
                }
                if (ids.indexOf(id) === -1) {
                    ids.push(id);
                }
                if (!category && typeof node.category === 'string') {
                    category = node.category;
                }
            } else if (!crumbs && isType(node, 'BreadcrumbList')) {
                crumbs = breadcrumbCategory(node);
            }
        }
    }
    if (ids.length !== 1) {
        return undefined;
    }
    const raw = category || crumbs;
    if (raw && isSensitiveCategory(raw)) {
        return undefined;
    }
    return { id: ids[0], category: raw ? maskLabel(raw) : undefined };
}
