export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isFunction(value: unknown): value is (...args: Array<unknown>) => unknown {
  return typeof value === 'function';
}

// Kit settings arrive with quotes HTML-escaped. Returns undefined when the string is not valid JSON.
export function parseKitSettingJson(setting: string): unknown {
  try {
    return JSON.parse(setting.replace(/&quot;/g, '"'));
  } catch {
    return undefined;
  }
}

export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') {
    return value.length === 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value as object).length === 0;
  }
  return false;
}

// Strips the query string from a URL before it is persisted and sent to Rokt,
// since query params commonly carry PII (emails, tokens, order refs).
// Returns the input unchanged if it can't be parsed as a URL.
export function sanitizeUrl(href: string): string {
  try {
    const url = new URL(href);
    url.search = '';
    return url.toString();
  } catch {
    return href;
  }
}

// Strips the query string and the fragment before a URL goes into a log or error report,
// since both commonly carry PII. Separate from sanitizeUrl, whose output is a reported
// field where a hash route is meaningful. Falls back to a literal cut on an unparseable
// input, so a sanitiser failure never widens what is reported.
export function sanitizeReportingUrl(href: string): string {
  try {
    const url = new URL(href);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return href.split(/[?#]/)[0];
  }
}

export function djb2(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) + hash + value.charCodeAt(i);
    hash = hash & hash;
  }
  return hash;
}

