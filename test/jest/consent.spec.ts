import Consent, { IConsent, IMinifiedConsentJSONObject } from '../../src/consent';
import { IMParticleWebSDKInstance } from '../../src/mp-instance';
import { Dictionary } from '../../src/utils';

describe('Consent.ConsentSerialization.fromMinifiedJsonObject', () => {
    const storedPurpose = {
        c: true,
        ts: 10,
        d: 'stored document',
        l: 'stored location',
        h: 'stored hardware id',
    };
    const storedCCPAState = {
        c: false,
        ts: 11,
        d: 'ccpa document',
        l: 'ccpa location',
        h: 'ccpa hardware id',
    };
    const purposeReadBack = {
        Consented: true,
        Timestamp: 10,
        ConsentDocument: 'stored document',
        Location: 'stored location',
        HardwareId: 'stored hardware id',
    };
    const ccpaStateReadBack = {
        Consented: false,
        Timestamp: 11,
        ConsentDocument: 'ccpa document',
        Location: 'ccpa location',
        HardwareId: 'ccpa hardware id',
    };

    const entriesThatAreNotConsentObjects: Dictionary<unknown> = {
        null: null,
        'a number': 5,
        'a string': 'stored',
        'a boolean': true,
        'an array': [storedPurpose],
        'an object without a consented boolean': { ts: 12, d: 'document' },
        'an object with an array timestamp': { c: true, ts: [12] },
        'an object with a timestamp that has no primitive value': {
            c: true,
            ts: JSON.parse('{"valueOf":1,"toString":1}'),
        },
    };

    const mapsThatAreNotObjects: Dictionary<unknown> = {
        null: null,
        'a number': 5,
        'a string': 'stored',
        'a boolean': true,
        'an array holding a consent object': [storedPurpose],
        'an array holding null': [null],
        'a string equal to the CCPA purpose': 'data_sale_opt_out',
        'an array with the CCPA purpose as a property': Object.assign([], {
            data_sale_opt_out: storedCCPAState,
        }),
    };

    let consent: IConsent;

    beforeEach(() => {
        const mockMPInstance = ({
            Logger: {
                error: jest.fn(),
                warning: jest.fn(),
                verbose: jest.fn(),
            },
        } as unknown) as IMParticleWebSDKInstance;
        consent = new (Consent as any)(mockMPInstance) as IConsent;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const readStoredConsent = (storedConsent: unknown) =>
        consent.ConsentSerialization.fromMinifiedJsonObject(
            storedConsent as IMinifiedConsentJSONObject
        );

    const writeBack = (storedConsent: unknown) =>
        consent.ConsentSerialization.toMinifiedJsonObject(
            readStoredConsent(storedConsent)
        );

    it('reads back a record with several GDPR purposes and a CCPA state exactly as it was stored', () => {
        const storedConsent = {
            gdpr: {
                'stored purpose': storedPurpose,
                'second purpose': { c: false, ts: 20 },
            },
            ccpa: { data_sale_opt_out: storedCCPAState },
        };

        expect(readStoredConsent(storedConsent).getGDPRConsentState()).toEqual({
            'stored purpose': purposeReadBack,
            'second purpose': { Consented: false, Timestamp: 20 },
        });
        expect(writeBack(storedConsent)).toStrictEqual(storedConsent);
    });

    it.each([
        ['a null timestamp', { c: true, ts: null }],
        ['no timestamp', { c: true }],
    ])(
        'reads back a stored entry with %s, timestamped with the time it is read',
        (_, storedEntry) => {
            const readTime = 1234;
            jest.spyOn(Date, 'now').mockReturnValue(readTime);
            const consentState = readStoredConsent({
                gdpr: {
                    'entry to timestamp': storedEntry,
                    'stored purpose': storedPurpose,
                },
                ccpa: { data_sale_opt_out: storedEntry },
            });

            expect(consentState.getGDPRConsentState()).toEqual({
                'entry to timestamp': { Consented: true, Timestamp: readTime },
                'stored purpose': purposeReadBack,
            });
            expect(consentState.getCCPAConsentState()).toEqual({
                Consented: true,
                Timestamp: readTime,
            });
        }
    );

    describe.each(Object.keys(entriesThatAreNotConsentObjects))(
        'a stored entry that is %s',
        shape => {
            const entry = entriesThatAreNotConsentObjects[shape];

            it('is omitted as a GDPR purpose while the other purposes and the CCPA state are read back', () => {
                const storedConsent = {
                    gdpr: {
                        'not a consent object': entry,
                        'stored purpose': storedPurpose,
                    },
                    ccpa: { data_sale_opt_out: storedCCPAState },
                };
                const consentState = readStoredConsent(storedConsent);

                expect(consentState.getGDPRConsentState()).toStrictEqual({
                    'stored purpose': purposeReadBack,
                });
                expect(consentState.getCCPAConsentState()).toStrictEqual(
                    ccpaStateReadBack
                );
                expect(
                    writeBack(storedConsent),
                    'the record saved from the state read back'
                ).toStrictEqual({
                    gdpr: { 'stored purpose': storedPurpose },
                    ccpa: { data_sale_opt_out: storedCCPAState },
                });
            });

            it('is omitted as the CCPA state while the GDPR purposes are read back', () => {
                const storedConsent = {
                    gdpr: { 'stored purpose': storedPurpose },
                    ccpa: { data_sale_opt_out: entry },
                };
                const consentState = readStoredConsent(storedConsent);

                expect(consentState.getGDPRConsentState()).toStrictEqual({
                    'stored purpose': purposeReadBack,
                });
                expect(consentState.getCCPAConsentState()).toBeUndefined();
                expect(
                    writeBack(storedConsent),
                    'the record saved from the state read back'
                ).toStrictEqual({
                    gdpr: { 'stored purpose': storedPurpose },
                });
            });
        }
    );

    describe.each(Object.keys(mapsThatAreNotObjects))(
        'a stored map that is %s',
        shape => {
            const map = mapsThatAreNotObjects[shape];

            it('yields no GDPR purposes while the CCPA state is read back', () => {
                const consentState = readStoredConsent({
                    gdpr: map,
                    ccpa: { data_sale_opt_out: storedCCPAState },
                });

                expect(consentState.getGDPRConsentState()).toStrictEqual({});
                expect(consentState.getCCPAConsentState()).toStrictEqual(
                    ccpaStateReadBack
                );
            });

            it('yields no CCPA state while the GDPR purposes are read back', () => {
                const consentState = readStoredConsent({
                    gdpr: { 'stored purpose': storedPurpose },
                    ccpa: map,
                });

                expect(consentState.getGDPRConsentState()).toStrictEqual({
                    'stored purpose': purposeReadBack,
                });
                expect(consentState.getCCPAConsentState()).toBeUndefined();
            });
        }
    );

    it.each([null, undefined, '', 'stored', 5, true, [{ gdpr: {} }]])(
        'returns an empty consent state for a stored record that is %p',
        storedConsent => {
            const consentState = readStoredConsent(storedConsent);

            expect(consentState.getGDPRConsentState()).toStrictEqual({});
            expect(consentState.getCCPAConsentState()).toBeUndefined();
            expect(
                readStoredConsent({
                    gdpr: { 'stored purpose': storedPurpose },
                }).getGDPRConsentState(),
                'a record that is an object, read by the same deserializer'
            ).toStrictEqual({ 'stored purpose': purposeReadBack });
        }
    );
});

describe('Consent.createPrivacyConsent timestamp', () => {
    let consent: IConsent;
    let logger: { error: jest.Mock; warning: jest.Mock; verbose: jest.Mock };

    beforeEach(() => {
        logger = { error: jest.fn(), warning: jest.fn(), verbose: jest.fn() };
        consent = new (Consent as any)(({
            Logger: logger,
        } as unknown) as IMParticleWebSDKInstance) as IConsent;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it.each([
        ['an array', [12]],
        ['an object with no primitive value', Object.create(null)],
        ['a plain object', { ts: 12 }],
        ['an invalid Date', new Date('not a date')],
        ['true', true],
        ['a symbol', Symbol('ts')],
        ['a bigint', BigInt(12)],
    ])('returns null for a timestamp that is %s', (_, timestamp) => {
        expect(consent.createPrivacyConsent(true, timestamp as any)).toBeNull();
        expect(logger.error).toHaveBeenCalledWith(
            'Timestamp must be a valid number when constructing a Consent object.'
        );
    });

    it('keeps a number timestamp', () => {
        expect(consent.createPrivacyConsent(true, 12)).toEqual({
            Consented: true,
            Timestamp: 12,
        });
    });

    it('converts a Date timestamp to its epoch milliseconds', () => {
        expect(
            consent.createPrivacyConsent(true, (new Date(12) as unknown) as number)
        ).toEqual({ Consented: true, Timestamp: 12 });
    });

    it.each([
        ['null', null],
        ['undefined', undefined],
    ])('timestamps a %s timestamp with the current time', (_, timestamp) => {
        jest.spyOn(Date, 'now').mockReturnValue(1234);

        expect(consent.createPrivacyConsent(true, timestamp as any)).toEqual({
            Consented: true,
            Timestamp: 1234,
        });
    });
});
