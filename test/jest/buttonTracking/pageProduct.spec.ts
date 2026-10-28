import { isSensitiveCategory, readPageProduct } from '../../../src/buttonTracking/pageProduct';

const page = (...blocks: unknown[]) => {
    document.head.innerHTML = blocks
        .map(block => '<script type="application/ld+json">' + (typeof block === 'string' ? block : JSON.stringify(block)) + '</script>')
        .join('');
    return readPageProduct(document);
};

describe('readPageProduct', () => {
    afterEach(() => {
        document.head.innerHTML = '';
    });

    it('reads the id and category of the one product a page describes', () => {
        expect(page({ '@type': 'Product', productID: 'TR-200', name: 'Trail Runner', category: 'Shoes > Running', offers: { price: '80' } })).toEqual({
            id: 'TR-200',
            category: 'shoes > running',
        });
    });

    it.each([
        ['a numeric product id', { '@type': 'Product', productID: 48213907 }, '48213907'],
        ['a sku when there is no product id', { '@type': 'Product', sku: 'SKU-1' }, 'SKU-1'],
        ['an mpn last', { '@type': 'Product', mpn: 'M_1.2' }, 'M_1.2'],
        ['a type list', { '@type': ['Product', 'Thing'], productID: 'p1' }, 'p1'],
        ['a graph', { '@graph': [{ '@type': 'WebPage' }, { '@type': 'Product', productID: 'p2' }] }, 'p2'],
        ['an array', [{ '@type': 'Organization' }, { '@type': 'Product', productID: 'p3' }], 'p3'],
    ])('reads %s', (_name, block, id) => {
        expect(page(block)).toEqual(expect.objectContaining({ id }));
    });

    it('names the category from the breadcrumb, without home or the product itself', () => {
        expect(
            page(
                { '@type': 'Product', productID: 'p1', name: 'Wide-Leg Jeans' },
                {
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Home' },
                        { '@type': 'ListItem', position: 2, item: { name: 'Women' } },
                        { '@type': 'ListItem', position: 3, name: 'Jeans' },
                        { '@type': 'ListItem', position: 4, name: 'Wide-Leg Jeans' },
                    ],
                }
            )
        ).toEqual({ id: 'p1', category: 'women > jeans' });
    });

    it('keeps one product described twice', () => {
        expect(page({ '@type': 'Product', productID: 'p1' }, { '@type': 'Product', sku: 'p1' })).toEqual({ id: 'p1', category: undefined });
    });

    it.each([
        ['no product', [{ '@type': 'WebPage' }]],
        ['several products, as a listing or bag has', [{ '@type': 'Product', productID: 'p1' }, { '@type': 'Product', productID: 'p2' }]],
        ['only a person and an order', [{ '@type': 'Person', name: 'Jane Doe', email: 'jane@example.com' }, { '@type': 'Order', orderNumber: 'A1' }]],
        ['an email address as the id', [{ '@type': 'Product', productID: 'jane@example.com' }]],
        ['free text as the id', [{ '@type': 'Product', sku: 'Jane Doe' }]],
        ['a card-length run of digits', [{ '@type': 'Product', productID: '4111111111111111' }]],
        ['an id over 64 characters', [{ '@type': 'Product', productID: 'a'.repeat(65) }]],
        ['no usable id', [{ '@type': 'Product', name: 'Trail Runner' }]],
    ])('reads nothing from a page with %s', (_name, blocks) => {
        expect(page(...blocks)).toBeUndefined();
    });

    it('never reads person or order markup beside the product', () => {
        const product = page(
            { '@type': 'Person', name: 'Jane Doe', email: 'jane@example.com' },
            { '@type': 'Product', productID: 'p1', category: 'Shoes' }
        );

        expect(product).toEqual({ id: 'p1', category: 'shoes' });
        expect(JSON.stringify(product)).not.toMatch(/jane/i);
    });

    it.each([
        ['health', 'Health & Wellness > Pregnancy Tests'],
        ['pharmacy', 'Pharmacy'],
        ['sexual wellness', 'Sexual Wellness'],
        ['children', 'Kids > Jeans'],
        ['baby', 'Baby Clothes'],
        ['religion', 'Books > Religion'],
        ['a breadcrumb', null],
    ])('sends nothing for a %s category', (_name, category) => {
        const blocks: unknown[] = [{ '@type': 'Product', productID: 'p1', category: category || undefined }];
        if (!category) {
            blocks.push({ '@type': 'BreadcrumbList', itemListElement: [{ name: 'Vitamins' }, { name: 'Fish Oil' }] });
        }

        expect(page(...blocks)).toBeUndefined();
    });

    it.each([
        ['a sensitive category on a repeat of the product', [{ '@type': 'Product', productID: 'p1', category: 'Shoes' }, { '@type': 'Product', productID: 'p1', category: 'Kids' }]],
        ['a sensitive breadcrumb beside a plain category', [{ '@type': 'Product', productID: 'p1', category: 'Shoes' }, { '@type': 'BreadcrumbList', itemListElement: [{ position: 1, name: 'Kids' }, { position: 2, name: 'Sneakers' }] }]],
        ['a sensitive second breadcrumb', [{ '@type': 'Product', productID: 'p1' }, { '@type': 'BreadcrumbList', itemListElement: [{ position: 1, name: 'Shoes' }, { position: 2, name: 'Sneakers' }] }, { '@type': 'BreadcrumbList', itemListElement: [{ position: 1, name: 'Pharmacy' }] }]],
        ['a sensitive category in a list', [{ '@type': 'Product', productID: 'p1', category: ['Pharmacy'] }]],
        ['a category it cannot read', [{ '@type': 'Product', productID: 'p1', category: { '@type': 'Thing', name: 'Shoes' } }]],
        ['a second product inside a graph within an array', [[{ '@type': 'Product', productID: 'p1' }, { '@graph': [{ '@type': 'Product', productID: 'p2' }] }]]],
        ['markup nested too deeply to read in full', [[[[[[{ '@type': 'Product', productID: 'p1' }]]]]]]],
    ])('reads nothing with %s', (_name, blocks) => {
        expect(page(...blocks)).toBeUndefined();
    });

    it('reads nothing when the page has more blocks than it reads', () => {
        const blocks: unknown[] = [{ '@type': 'Product', productID: 'p1' }];
        for (let i = 0; i < 10; i++) {
            blocks.push({ '@type': 'WebPage' });
        }

        expect(page(...blocks)).toBeUndefined();
    });

    it('reads nothing when any block is too large to read', () => {
        expect(page({ '@type': 'Product', productID: 'p1' }, { '@type': 'WebPage', text: 'x'.repeat(100001) })).toBeUndefined();
    });

    it('orders a breadcrumb by position, and names no category when its order is unclear', () => {
        const product = { '@type': 'Product', productID: 'p1' };
        const step = (position: number | undefined, name: string) => ({ '@type': 'ListItem', position, name });

        expect(page(product, { '@type': 'BreadcrumbList', itemListElement: [step(3, 'Trail Runner'), step(1, 'Shoes'), step(2, 'Running')] })).toEqual({ id: 'p1', category: undefined });
        expect(page(product, { '@type': 'BreadcrumbList', itemListElement: [step(1, 'Shoes'), step(2, 'Running'), step(3, 'Trail Runner')] })).toEqual({ id: 'p1', category: 'shoes > running' });
        expect(page(product, { '@type': 'BreadcrumbList', itemListElement: [step(undefined, 'Shoes'), step(undefined, 'Trail Runner')] })).toEqual({ id: 'p1', category: undefined });
    });

    it('joins a category given as a list', () => {
        expect(page({ '@type': 'Product', productID: 'p1', category: ['Shoes', 'Running'] })).toEqual({ id: 'p1', category: 'shoes > running' });
    });

    it('drops a category that looks personal but keeps the id', () => {
        expect(page({ '@type': 'Product', productID: 'p1', category: 'gifts for jane@example.com' })).toEqual({ id: 'p1', category: undefined });
    });

    it('skips a block that is not valid JSON or is too large', () => {
        expect(page('{not json', { '@type': 'Product', productID: 'p1' })).toEqual({ id: 'p1', category: undefined });
        expect(page(JSON.stringify({ '@type': 'Product', productID: 'p2', description: 'x'.repeat(100001) }))).toBeUndefined();
    });
});

describe('isSensitiveCategory', () => {
    it.each([
        ['Standard Shipping', false],
        ['Medical Supplies', true],
        ['Kidskin Gloves', false],
        ['STD Tests', true],
        ['Women > Jeans', false],
    ])('reads "%s" as sensitive: %s', (category, expected) => {
        expect(isSensitiveCategory(category)).toBe(expected);
    });
});
