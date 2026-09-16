import * as fs from 'fs';
import * as path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..');
const read = (file: string): string =>
    fs.readFileSync(path.join(repoRoot, file), 'utf8');

const SDK_URL_PREFIX = 'https://jssdkcdns.mparticle.com/js/v3/';

// A pasted loader snippet runs in whatever document the host page happens to
// have. Beyond http/https, this SDK supports hybrid webviews (config.isIOS,
// config.useNativeSdk, window.mParticleAndroid*, minWebviewBridgeVersion),
// whose documents are loaded from file:, capacitor:, ionic: or app: origins.
const DOCUMENT_PROTOCOLS = [
    'https:',
    'http:',
    'file:',
    'capacitor:',
    'ionic:',
    'app:',
];

// Runs a loader snippet against the real jsdom document, varying only the
// document scheme, and returns the <script> element it injected.
function injectedScript(source: string, protocol: string): HTMLScriptElement {
    // On a real page the snippet sits inside a <script> tag and inserts the SDK
    // before the first script it finds.
    document.head.innerHTML = '<script id="snippet-host"></script>';
    document.body.innerHTML = '';
    delete (window as any).mParticle;

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

    return document.querySelector('script[src]') as HTMLScriptElement;
}

['snippet.js', 'snippet.min.js'].forEach(file => {
    describe(file, () => {
        const source = read(file);

        DOCUMENT_PROTOCOLS.forEach(protocol => {
            it(
                'requests the SDK over https from a ' + protocol + ' document',
                () => {
                    const script = injectedScript(source, protocol);

                    expect(script).not.toBeNull();
                    // Positive control: the URL was built in full, rather than
                    // simply lacking a cleartext prefix.
                    expect(script.src).toContain('/mparticle.js?env=0');
                    expect(script.src.substring(0, SDK_URL_PREFIX.length)).toBe(
                        SDK_URL_PREFIX
                    );
                }
            );
        });
    });
});

it('README documents the committed minified snippet verbatim', () => {
    expect(read('README.md')).toContain(read('snippet.min.js').trim());
});
