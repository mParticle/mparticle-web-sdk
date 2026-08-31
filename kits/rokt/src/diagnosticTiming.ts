// Builds diagnostic log entries for attribute/identity setter calls and
// selectPlacements dispatches. Each fires independently at the moment it
// happens; correlating the two (timing delta, which setters preceded a given
// placement call) is done downstream from the logged timestamps and page URL
// that ReportingTransport already attaches to every log request. Attribute
// names only — never values — since this ships over the network logging
// pipeline and setter payloads can carry customer PII.

export interface DiagnosticLogEntry {
  message: string;
  code: string;
}

export function buildSetterDiagnosticLogEntry(source: string, attributeKeys: string[]): DiagnosticLogEntry {
  return {
    message: `Rokt Kit: ${source} called [attributeKeys=${attributeKeys.join(',')}]`,
    code: 'ATTRIBUTE_SETTER_CALLED',
  };
}

export function buildSelectPlacementsDiagnosticLogEntry(placementAttributeKeys: string[]): DiagnosticLogEntry {
  return {
    message: `Rokt Kit: selectPlacements dispatched [placementAttributeKeys=${placementAttributeKeys.join(',')}]`,
    code: 'SELECT_PLACEMENTS_DISPATCHED',
  };
}
