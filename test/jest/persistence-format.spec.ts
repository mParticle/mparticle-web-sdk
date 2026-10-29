import Store, { IStore } from '../../src/store';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { SDKInitConfig } from '../../src/sdkRuntimeModels';
import Persistence from '../../src/persistence';
import { IPersistence, IPersistenceMinified } from '../../src/persistence.interfaces';
import { isObject } from '../../src/utils';

// These strings are what the SDK writes today. Cookies and local storage
// written by earlier releases must keep decoding the same way, so a change to
// any of them is a change to the stored format, not a refactor.

const EXPIRES = 'Thu, 01 Jan 2099 00:00:00 GMT';
const DOMAIN = ';domain=.example.com';

const ENCODED = String.raw`{'gs':{'sid':'session-1'|'ie':1|'les':1700000000000|'ssd':1700000000000|'dt':'api-key'|'cgid':'cgid-1'|'das':'das|\'1\''|'csm':'WyJtcGlkMSJd'}|'cu':'mpid1'|'l':true|'mpid1':{'ua':'eyJjb2xvciI6ImJsdWUsIGdyZWVuIiwic2l6ZSI6IlwibGFyZ2VcIiJ9'|'ui':'eyIxIjoiY3VzdG9tZXItMSIsIjciOiJ0ZXN0QGV4YW1wbGUuY29tIn0='|'csd':'eyI1IjoxNzAwMDAwMDAwMDAwfQ=='|'con':'eyJnZHByIjp7InB1cnBvc2UiOnsiYyI6dHJ1ZSwidHMiOjE3MDAwMDAwMDAwMDAsImQiOiJkb2MiLCJsIjoibG9jIiwiaCI6Imh3In19fQ=='|'fst':1700000000000|'lst':1700000000001}|'mpid2':{'ua':'eyJwbGFuIjoiZnJlZSJ9'|'ui':'eyIxIjoiY3VzdG9tZXItMiJ9'|'fst':1600000000000|'lst':1600000000000}}`;

const ENCODED_WITHOUT_MPID2 = String.raw`{'gs':{'sid':'session-1'|'ie':1|'les':1700000000000|'ssd':1700000000000|'dt':'api-key'|'cgid':'cgid-1'|'das':'das|\'1\''|'csm':'WyJtcGlkMSJd'}|'cu':'mpid1'|'l':true|'mpid1':{'ua':'eyJjb2xvciI6ImJsdWUsIGdyZWVuIiwic2l6ZSI6IlwibGFyZ2VcIiJ9'|'ui':'eyIxIjoiY3VzdG9tZXItMSIsIjciOiJ0ZXN0QGV4YW1wbGUuY29tIn0='|'csd':'eyI1IjoxNzAwMDAwMDAwMDAwfQ=='|'con':'eyJnZHByIjp7InB1cnBvc2UiOnsiYyI6dHJ1ZSwidHMiOjE3MDAwMDAwMDAwMDAsImQiOiJkb2MiLCJsIjoibG9jIiwiaCI6Imh3In19fQ=='|'fst':1700000000000|'lst':1700000000001}}`;

const COOKIE_SUFFIX = ';expires=' + EXPIRES + ';path=/' + DOMAIN;

// The value of `das` holds a comma and double quotes, the two characters the
// encoder replaces outside the Base64 fields.
function fixture(): IPersistenceMinified {
    return ({
        gs: {
            sid: 'session-1',
            ie: true,
            les: 1700000000000,
            ssd: 1700000000000,
            dt: 'api-key',
            cgid: 'cgid-1',
            das: 'das,"1"',
            csm: ['mpid1'],
            c: null,
            ia: {},
        },
        cu: 'mpid1',
        l: true,
        mpid1: {
            ua: { color: 'blue, green', size: '"large"' },
            ui: { '1': 'customer-1', '7': 'test@example.com' },
            csd: { '5': 1700000000000 },
            con: {
                gdpr: {
                    purpose: {
                        c: true,
                        ts: 1700000000000,
                        d: 'doc',
                        l: 'loc',
                        h: 'hw',
                    },
                },
            },
            fst: 1700000000000,
            lst: 1700000000001,
        },
        mpid2: {
            ua: { plan: 'free' },
            ui: { '1': 'customer-2' },
            fst: 1600000000000,
            lst: 1600000000000,
        },
    } as unknown) as IPersistenceMinified;
}

// What decoding gives back: empty and falsy global settings are dropped on
// encode, and `ie` returns as a boolean.
function decodedFixture() {
    const expected = fixture() as any;
    delete expected.gs.c;
    delete expected.gs.ia;
    return expected;
}

describe('Persistence stored format', () => {
    let persistence: IPersistence;

    beforeEach(() => {
        const store = {} as IStore;
        const mpInstance = ({
            _Helpers: { isObject },
            _NativeSdkHelpers: {},
            _Store: store,
            Identity: { getCurrentUser: jest.fn() },
            Logger: {
                verbose: jest.fn(),
                error: jest.fn(),
                warning: jest.fn(),
            },
        } as unknown) as IMParticleWebSDKInstance;

        Store.call(store, {} as SDKInitConfig, mpInstance, 'apikey');
        persistence = new Persistence(mpInstance);
    });

    describe('#encodePersistence', () => {
        it('writes the exact stored string used by cookies and local storage', () => {
            expect(
                persistence.encodePersistence(JSON.stringify(fixture()))
            ).toBe(ENCODED);
        });
    });

    describe('#decodePersistence', () => {
        it('reads a stored string back into the same records', () => {
            expect(JSON.parse(persistence.decodePersistence(ENCODED) as string)).toEqual(
                decodedFixture()
            );
        });

        it('round-trips: encode then decode gives the same records', () => {
            const encoded = persistence.encodePersistence(
                JSON.stringify(fixture())
            );

            expect(
                JSON.parse(persistence.decodePersistence(encoded) as string)
            ).toEqual(decodedFixture());
        });

        it('returns nothing for an empty stored value', () => {
            expect(persistence.decodePersistence(null)).toBeUndefined();
            expect(persistence.decodePersistence('')).toBeUndefined();
        });
    });

    describe('#reduceAndEncodePersistence', () => {
        it('writes the whole record with expiry, path and domain when it fits', () => {
            expect(
                persistence.reduceAndEncodePersistence(
                    fixture(),
                    EXPIRES,
                    DOMAIN,
                    3000
                )
            ).toBe(ENCODED + COOKIE_SUFFIX);
        });

        it('drops users outside the current session first when the cookie is too large', () => {
            expect(
                persistence.reduceAndEncodePersistence(
                    fixture(),
                    EXPIRES,
                    DOMAIN,
                    600
                )
            ).toBe(ENCODED_WITHOUT_MPID2 + COOKIE_SUFFIX);
        });
    });
});
