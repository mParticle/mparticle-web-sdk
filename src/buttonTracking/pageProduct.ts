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

const MAX_NODES = 200;
const MAX_DEPTH = 4;

function isType(node: unknown, type: string): node is Node {
    if (!node || typeof node !== 'object') {
        return false;
    }
    const value = (node as Node)['@type'];
    return Array.isArray(value) ? value.indexOf(type) !== -1 : value === type;
}

// Every node a block holds through arrays and @graph, or undefined when it
// holds more than a bounded walk can see in full.
function collectNodes(json: unknown): Node[] | undefined {
    const nodes: Node[] = [];
    const walk = (value: unknown, depth: number): boolean => {
        if (depth > MAX_DEPTH) {
            return false;
        }
        if (Array.isArray(value)) {
            return value.every(item => walk(item, depth + 1));
        }
        if (!value || typeof value !== 'object') {
            return true;
        }
        if (nodes.push(value as Node) > MAX_NODES) {
            return false;
        }
        const graph = (value as Node)['@graph'];
        return graph === undefined || walk(graph, depth + 1);
    };
    return walk(json, 0) ? nodes : undefined;
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

// A category given as text or a list of text, or null when it is given in a
// form that can't be read safely.
function categoryText(value: unknown): string | undefined | null {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value === 'string') {
        return value;
    }
    if (
        Array.isArray(value) &&
        value.every(item => typeof item === 'string')
    ) {
        return value.join(' > ');
    }
    return null;
}

// A breadcrumb's names in position order, without home and its last step,
// which on a product page is the product itself. Every name, last step
// included, goes to the sensitivity check; the order only decides which of
// them name the category. null when the order is unclear.
function breadcrumb(
    list: Node
): { names: string[]; category: string | undefined } | null {
    const items = list.itemListElement;
    if (!Array.isArray(items)) {
        return null;
    }
    const steps = items.map(item => {
        const entry = (item || {}) as Node;
        const thing =
            entry.item && typeof entry.item === 'object'
                ? (entry.item as Node)
                : undefined;
        const name =
            typeof entry.name === 'string' ? entry.name : thing && thing.name;
        return {
            position: entry.position,
            name: typeof name === 'string' ? name.trim() : '',
        };
    });
    const names = steps.map(step => step.name).filter(name => !!name);
    const positions = steps.map(step => Number(step.position));
    const ordered = positions.every(
        (position, i) => !isNaN(position) && (i === 0 || position > positions[i - 1])
    );
    if (!ordered) {
        return { names, category: undefined };
    }
    const path = steps
        .map(step => step.name)
        .filter(name => !!name && name.toLowerCase() !== 'home');
    path.pop();
    return { names, category: path.length ? path.join(' > ') : undefined };
}

// The single product the page describes, or undefined when it describes none
// or several (a listing or the bag), when any product or category can't be
// read safely, when any of them is sensitive, or when the page's markup is
// too large to read in full.
export function readPageProduct(doc: Document): IPageProduct | undefined {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    if (scripts.length > MAX_SCRIPTS) {
        return undefined;
    }
    const ids: string[] = [];
    const checked: string[] = [];
    let category: string | undefined;
    let crumbs: string | undefined;
    for (let i = 0; i < scripts.length; i++) {
        const text = scripts[i].textContent || '';
        if (text.length > MAX_SCRIPT_LENGTH) {
            return undefined;
        }
        let json: unknown;
        try {
            json = JSON.parse(text);
        } catch (e) {
            continue;
        }
        const nodes = collectNodes(json);
        if (!nodes) {
            return undefined;
        }
        for (const node of nodes) {
            if (isType(node, 'Product')) {
                const id = productId(node);
                const text = categoryText(node.category);
                if (!id || text === null) {
                    return undefined;
                }
                if (ids.indexOf(id) === -1) {
                    ids.push(id);
                }
                if (text) {
                    checked.push(text);
                    category = category || text;
                }
            } else if (isType(node, 'BreadcrumbList')) {
                const list = breadcrumb(node);
                if (!list) {
                    return undefined;
                }
                checked.push(list.names.join(' > '));
                crumbs = crumbs || list.category;
            }
        }
    }
    if (ids.length !== 1 || checked.some(isSensitiveCategory)) {
        return undefined;
    }
    const raw = category || crumbs;
    return { id: ids[0], category: raw ? maskLabel(raw) : undefined };
}
