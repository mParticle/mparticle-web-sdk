import { describe, it, expect } from 'vitest';
import { PRESELECTION_CONFIG } from '../../src/preselectionConfig';

describe('preselectionConfig', () => {
    it('has structurally valid entries', () => {
        expect(PRESELECTION_CONFIG.length).toBeGreaterThan(0);

        for (const entry of PRESELECTION_CONFIG) {
            expect(typeof entry.accountId).toBe('string');
            expect(entry.accountId.length).toBeGreaterThan(0);

            expect(typeof entry.pathname).toBe('string');
            expect(entry.pathname.startsWith('/')).toBe(true);

            expect(typeof entry.targetPageIdentifier).toBe('string');
            expect(entry.targetPageIdentifier.length).toBeGreaterThan(0);

            expect(Array.isArray(entry.attributeKeys)).toBe(true);
            expect(entry.attributeKeys.length).toBeGreaterThan(0);

            if (entry.optionalAttributeKeys) {
                expect(Array.isArray(entry.optionalAttributeKeys)).toBe(true);
            }

            if (entry.dispatchDelayMs !== undefined) {
                expect(typeof entry.dispatchDelayMs).toBe('number');
                expect(entry.dispatchDelayMs).toBeGreaterThanOrEqual(0);
            }
        }
    });

    it('keeps optional keys within attribute keys (case-insensitive)', () => {
        for (const entry of PRESELECTION_CONFIG) {
            const configured = new Set(
                entry.attributeKeys.map((key) => key.toLowerCase())
            );
            const optional = entry.optionalAttributeKeys ?? [];

            for (const key of optional) {
                expect(configured.has(key.toLowerCase())).toBe(true);
            }
        }
    });
});
