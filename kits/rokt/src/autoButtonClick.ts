import type { SDKEvent } from '@mparticle/web-sdk/internal';

// Set by core auto button tracking on every automatic Button Click event. The custom
// flag survives attribute filters and data plans; the attribute is a fallback.
export const AUTO_BUTTON_FLAG = 'Rokt.AutoButtonClick';
export const AUTO_BUTTON_ATTRIBUTE = 'is_auto_button_click';

export function isAutoButtonClickEvent(event: SDKEvent): boolean {
  return (
    event.CustomFlags?.[AUTO_BUTTON_FLAG] === 'true' ||
    String(event.EventAttributes?.[AUTO_BUTTON_ATTRIBUTE]) === 'true'
  );
}
