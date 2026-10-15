import * as fs from 'fs';
import * as path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..');
const read = (file: string): string =>
    fs.readFileSync(path.join(repoRoot, file), 'utf8');

const SDK_HOST = 'https://jssdkcdns.mparticle.com/js/v3/';
const ENCODED_PLACEHOLDER_KEY = 'REPLACE%20WITH%20API%20KEY';

const DOCUMENT_PROTOCOLS = [
    'https:',
    'http:',
    'file:',
    'capacitor:',
    'ionic:',
    'app:',
];

// An indented Markdown block is still a real copy, so this must not anchor at column zero.
const LOADER_LINE_ANY_INDENT = /^\s*\(function\(\w+\)\{window\.mParticle=/;

interface SnippetRun {
    script: HTMLScriptElement;
    mParticle: any;
}

function runSnippetAtProtocol(
    source: string,
    protocol: string,
    config?: any
): SnippetRun {
    document.head.innerHTML = '<script id="snippet-host"></script>';
    document.body.innerHTML = '';
    delete (window as any).mParticle;
    if (config) {
        (window as any).mParticle = { config };
    }

    const documentAtProtocol = new Proxy(document, {
        get(target: Document, property: string | symbol): any {
            if (property === 'location') {
                return { protocol };
            }
            const value = (target as any)[property];
            return typeof value === 'function' ? value.bind(target) : value;
        },
    });

    new Function('window', 'document', source)(window, documentAtProtocol);

    return {
        script: document.querySelector('script[src]') as HTMLScriptElement,
        mParticle: (window as any).mParticle,
    };
}

['snippet.js', 'snippet.min.js'].forEach(file => {
    describe(file, () => {
        const source = read(file);

        DOCUMENT_PROTOCOLS.forEach(protocol => {
            it(
                'requests the SDK over https from a ' + protocol + ' document',
                () => {
                    const { script } = runSnippetAtProtocol(source, protocol);

                    expect(script).not.toBeNull();
                    expect(script.src).toBe(
                        SDK_HOST +
                            ENCODED_PLACEHOLDER_KEY +
                            '/mparticle.js?env=0&'
                    );
                }
            );
        });

        it('appends the configured plan and version query parameters', () => {
            const { script } = runSnippetAtProtocol(source, 'file:', {
                isDevelopmentMode: true,
                dataPlan: { planId: 'my_plan', planVersion: 2 },
                versions: { core: '3.0.0', kit: '1.2.3' },
            });

            expect(script.src).toBe(
                SDK_HOST +
                    ENCODED_PLACEHOLDER_KEY +
                    '/mparticle.js?env=1&plan_id=my_plan&plan_version=2' +
                    '&core=3.0.0&kit=1.2.3'
            );
        });

        it('queues calls made through its stubbed methods', () => {
            const { mParticle } = runSnippetAtProtocol(source, 'file:');
            const onReady = (): void => undefined;

            mParticle.logEvent('test event', mParticle.EventType.Other, {
                attrFoo: 'attrBar',
            });
            mParticle.Identity.login({ userIdentities: { customerid: 'c' } });
            mParticle.eCommerce.setCurrencyCode('usd');
            mParticle.Rokt.selectPlacements({ attributes: {} });
            mParticle.ready(onReady);

            expect(
                mParticle.config.rq,
                'the namespaced entries prove the stub factory keeps its own arguments through minification'
            ).toEqual([
                ['logEvent', 'test event', 8, { attrFoo: 'attrBar' }],
                ['Identity.login', { userIdentities: { customerid: 'c' } }],
                ['eCommerce.setCurrencyCode', 'usd'],
                ['Rokt.selectPlacements', { attributes: {} }],
                onReady,
            ]);
            expect(mParticle.config.snippetVersion).toBe(3);
        });
    });
});

it('README documents the committed minified snippet, and only once', () => {
    const readme = read('README.md');
    const loaderLines = readme
        .split('\n')
        .filter(line => LOADER_LINE_ANY_INDENT.test(line))
        .map(line => line.trim());

    expect(loaderLines).toHaveLength(1);
    expect(loaderLines[0]).toBe(read('snippet.min.js').trim());

    const examples = (
        readme.match(/```javascript\n[\s\S]*?\n```/g) || []
    ).filter(block => block.indexOf('//load the SDK') !== -1);

    expect(
        examples,
        'the script-tag example, not some other fenced block'
    ).toHaveLength(1);
    expect(examples[0]).toContain(loaderLines[0]);
});
