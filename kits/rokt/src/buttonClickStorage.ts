import {
  readNamespacedField,
  writeNamespacedField,
  removeNamespacedField,
  sessionStorageBackend,
  STORAGE_NAMESPACE_KEY,
} from './storage';
import type { SDKEvent } from '@mparticle/web-sdk/internal';

// Tab-scoped on purpose: clicks only matter within one journey, and sessionStorage
// leaves nothing on the shopper's device once the tab closes.
const BUTTON_CLICKS_FIELD = 'buttonClicks';
export const BUTTON_CLICKS_MAX_COUNT = 25;
// The selection API rejects a request whose attribute value passes 64 KiB, so the
// serialized clicks stay far below that.
export const BUTTON_EVENTS_MAX_LENGTH = 8192;
const PATH_MAX_LENGTH = 256;

// Set by core auto button tracking on every automatic Button Click event. The custom
// flag survives attribute filters and data plans; the attribute is a fallback.
export const AUTO_BUTTON_FLAG = 'Rokt.AutoButtonClick';
export const AUTO_BUTTON_ATTRIBUTE = 'is_auto_button_click';

// What the core already put on the event: masked labels, never a field value.
export interface ButtonClick {
  sourceMessageId: string;
  timestamp: number;
  path?: string;
  label?: string;
  labelSource?: string;
  ariaLabel?: string;
  icon?: string;
  element?: string;
  type?: string;
}

const EVENT_FIELDS: Array<[keyof ButtonClick, string]> = [
  ['path', 'path'],
  ['label', 'label'],
  ['labelSource', 'label_source'],
  ['ariaLabel', 'aria_label'],
  ['icon', 'icon'],
  ['element', 'element'],
  ['type', 'type'],
];

export function isAutoButtonClickEvent(event: SDKEvent): boolean {
  return (
    event.CustomFlags?.[AUTO_BUTTON_FLAG] === 'true' ||
    String(event.EventAttributes?.[AUTO_BUTTON_ATTRIBUTE]) === 'true'
  );
}

export function buildButtonClick(event: SDKEvent): ButtonClick {
  const click: ButtonClick = { sourceMessageId: event.SourceMessageId, timestamp: event.Timestamp };
  for (const [field, key] of EVENT_FIELDS) {
    const value = event.EventAttributes?.[key];
    if (typeof value === 'string' && value !== '') {
      (click as unknown as Record<string, string>)[field] = field === 'path' ? value.slice(0, PATH_MAX_LENGTH) : value;
    }
  }
  return click;
}

export function loadButtonClicks(): ButtonClick[] {
  const stored = readNamespacedField(STORAGE_NAMESPACE_KEY, BUTTON_CLICKS_FIELD, sessionStorageBackend);
  return Array.isArray(stored) ? (stored as ButtonClick[]) : [];
}

// Keeps the most recent clicks, dropping the oldest until the write fits.
export function writeButtonClicks(clicks: ButtonClick[]): number {
  const recent = clicks.slice(-BUTTON_CLICKS_MAX_COUNT);
  for (let i = 0; i < recent.length; i++) {
    const toWrite = recent.slice(i);
    if (writeNamespacedField(STORAGE_NAMESPACE_KEY, BUTTON_CLICKS_FIELD, toWrite, sessionStorageBackend)) {
      return toWrite.length;
    }
  }
  return 0;
}

export function clearButtonClicks(): void {
  removeNamespacedField(STORAGE_NAMESPACE_KEY, BUTTON_CLICKS_FIELD, sessionStorageBackend);
}

// The clicks as sent with selectPlacements, oldest dropped until they fit.
export function serializeButtonClicks(clicks: ButtonClick[]): string | undefined {
  for (let i = 0; i < clicks.length; i++) {
    const json = JSON.stringify(clicks.slice(i));
    if (json.length <= BUTTON_EVENTS_MAX_LENGTH) {
      return json;
    }
  }
  return undefined;
}
