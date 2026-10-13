import type { SDKEvent } from '@mparticle/web-sdk/internal';

// Clicks wait here in page memory until the Rokt Web SDK takes them. It keeps them in
// Rokt's own storage and sends them with selections, so the kit stores nothing on the
// partner's site.
export const BUTTON_CLICKS_MAX_PENDING = 25;
export const BUTTON_CLICKS_FLUSH_SIZE = 10;
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
  elementId?: string;
  elementName?: string;
  testId?: string;
  element?: string;
  type?: string;
}

export interface ButtonEventRecorder {
  recordButtonEvents?: (events: ButtonClick[]) => void;
}

const EVENT_FIELDS: Array<[keyof ButtonClick, string]> = [
  ['path', 'path'],
  ['label', 'label'],
  ['labelSource', 'label_source'],
  ['ariaLabel', 'aria_label'],
  ['icon', 'icon'],
  ['elementId', 'element_id'],
  ['elementName', 'element_name'],
  ['testId', 'test_id'],
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

export class ButtonClickBuffer {
  private pending: ButtonClick[] = [];

  // Keeps the newest clicks; true when enough are waiting to hand over a batch.
  public add(click: ButtonClick): boolean {
    this.pending.push(click);
    if (this.pending.length > BUTTON_CLICKS_MAX_PENDING) {
      this.pending.shift();
    }
    return this.pending.length >= BUTTON_CLICKS_FLUSH_SIZE;
  }

  // Hands every waiting click to a launcher that can record them. A launcher without
  // the method leaves them waiting for a later one.
  public flush(launcher: ButtonEventRecorder | null | undefined): void {
    if (!this.pending.length || !launcher || typeof launcher.recordButtonEvents !== 'function') {
      return;
    }
    const batch = this.pending;
    this.pending = [];
    try {
      launcher.recordButtonEvents(batch);
    } catch {
      // The launcher owns delivery; a failure there must not reach the partner's page.
    }
  }

  public clear(): void {
    this.pending = [];
  }

  public get size(): number {
    return this.pending.length;
  }
}
