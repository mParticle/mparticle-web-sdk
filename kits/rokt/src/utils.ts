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

// Page history is stored on the device and sent with every placement call, so it keeps no
// query at all, not even the params core's rule allows (those include free-text search
// terms). Core's rule (`mParticle._cleanUrl`) still cleans the fragment when present. Then
// everything from the first `?` is cut, in the URL and in any fragment, hash route or not.
export function cleanPageUrl(href: string): string {
  const coreCleanUrl = getCoreCleanUrl();
  const url = coreCleanUrl ? coreCleanUrl(href, 'full') : href;
  const hashStart = url.indexOf('#');
  const hash = hashStart === -1 ? '' : url.slice(hashStart);
  return (hashStart === -1 ? url : url.slice(0, hashStart)).split('?')[0] + hash.split('?')[0];
}

// Scheme, host and path only, for a URL that goes into a log, an error report or
// the ad-block probe, none of which need the query or a hash route.
export function cleanReportingUrl(href: string): string {
  const coreCleanUrl = getCoreCleanUrl();
  return coreCleanUrl ? coreCleanUrl(href, 'report') : href.split(/[?#]/)[0];
}

function getCoreCleanUrl(): ((href: string, mode: string) => string) | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const core = (window as any).mParticle;
  return core && typeof core._cleanUrl === 'function' ? core._cleanUrl : undefined;
}

export function djb2(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) + hash + value.charCodeAt(i);
    hash = hash & hash;
  }
  return hash;
}

