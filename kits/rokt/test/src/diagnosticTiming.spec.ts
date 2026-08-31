import { describe, it, expect } from 'vitest';
import { buildSetterDiagnosticLogEntry, buildSelectPlacementsDiagnosticLogEntry } from '../../src/diagnosticTiming';

describe('diagnosticTiming', () => {
  describe('buildSetterDiagnosticLogEntry', () => {
    it('reports the source and attribute keys', () => {
      const entry = buildSetterDiagnosticLogEntry('setUserAttribute', ['favoriteColor']);

      expect(entry.code).toBe('ATTRIBUTE_SETTER_CALLED');
      expect(entry.message).toBe('Rokt Kit: setUserAttribute called [attributeKeys=favoriteColor]');
    });

    it('joins multiple attribute keys', () => {
      const entry = buildSetterDiagnosticLogEntry('onUserIdentified', ['email', 'firstName']);

      expect(entry.message).toContain('[attributeKeys=email,firstName]');
    });

    it('never includes attribute values, only keys', () => {
      const entry = buildSetterDiagnosticLogEntry('setUserAttribute', ['email']);

      expect(entry.message).not.toContain('test@example.com');
    });
  });

  describe('buildSelectPlacementsDiagnosticLogEntry', () => {
    it('reports the full set of placement attribute keys', () => {
      const entry = buildSelectPlacementsDiagnosticLogEntry(['favoriteColor', 'mpid']);

      expect(entry.code).toBe('SELECT_PLACEMENTS_DISPATCHED');
      expect(entry.message).toBe('Rokt Kit: selectPlacements dispatched [placementAttributeKeys=favoriteColor,mpid]');
    });
  });
});
