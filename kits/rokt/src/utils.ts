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

export function readOwnValue(source: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(source, key) ? source[key] : undefined;
}

// Cleans a URL with the core SDK's rule (`mParticle._cleanUrl`), so every URL the kit
// persists, sends or reports matches the page_url on core events. A core without it
// predates that rule; the kit then drops the whole query and keeps the fragment.
export function cleanPageUrl(href: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const core = (window as any).mParticle;
  if (core && typeof core._cleanUrl === 'function') {
    return core._cleanUrl(href, 'full');
  }

  const hashStart = href.indexOf('#');
  const hash = hashStart === -1 ? '' : href.slice(hashStart);
  return (hashStart === -1 ? href : href.slice(0, hashStart)).split('?')[0] + hash;
}

export function djb2(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) + hash + value.charCodeAt(i);
    hash = hash & hash;
  }
  return hash;
}

