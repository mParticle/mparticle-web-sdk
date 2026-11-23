import { isString, readOwnValue } from '../utils';
import { type PreselectPageValue } from './preselectionConfig';

const MAX_PAGE_PATH_SEGMENTS = 8;
const PAGE_PATH_SEGMENT_PATTERN = /^[\w$-]{1,64}$/;
const BARRED_PAGE_PATH_SEGMENTS = ['__proto__', 'constructor', 'prototype'];

export function isPageValuePath(path: unknown): path is string {
  if (!isString(path)) {
    return false;
  }
  const segments = path.split('.');
  return (
    segments.length <= MAX_PAGE_PATH_SEGMENTS &&
    segments.every((segment) => PAGE_PATH_SEGMENT_PATTERN.test(segment) && !BARRED_PAGE_PATH_SEGMENTS.includes(segment))
  );
}

// Own data properties only, so no getter or inherited property runs. A cross-origin frame throws on access.
export function readPageValue(path: string): string | undefined {
  if (!isPageValuePath(path)) {
    return undefined;
  }
  try {
    let value: unknown = window;
    for (const segment of path.split('.')) {
      if (typeof value !== 'object' || value === null) {
        return undefined;
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, segment);
      if (!descriptor || !('value' in descriptor)) {
        return undefined;
      }
      value = descriptor.value;
    }
    if (isString(value)) {
      return value;
    }
    return typeof value === 'number' && Number.isFinite(value) ? String(value) : undefined;
  } catch {
    return undefined;
  }
}

export function readPageValueFill({ path, values }: PreselectPageValue): string | undefined {
  const pageValue = readPageValue(path);
  return pageValue === undefined
    ? undefined
    : (readOwnValue(values, pageValue.trim().toLowerCase()) as string | undefined);
}
