export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isFunction(value: unknown): value is (...args: Array<unknown>) => unknown {
  return typeof value === 'function';
}

export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
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

export function djb2(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) + hash + value.charCodeAt(i);
    hash = hash & hash;
  }
  return hash;
}

export function buildCacheMatchHash(attributeKeys: string[], attributes: Record<string, unknown>): string {
  const serialized = attributeKeys.map((key) => `${key}:${JSON.stringify(attributes[key])}`).join('|');
  return String(djb2(serialized));
}
