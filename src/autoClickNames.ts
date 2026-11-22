// The names auto click events go by. The click tracker sets them and core's
// forwarding check reads them, so they sit in core.

// Marks an automatically logged button click, like `is_auto_page_view`.
export const AUTO_BUTTON_ATTRIBUTE = 'is_auto_button_click';

// Specific enough not to merge with a customer's own 'Button Click' event.
export const BUTTON_CLICK_EVENT_NAME = 'Auto Button Click';

// Marks an automatically logged click on a link that leaves the page.
export const AUTO_LINK_ATTRIBUTE = 'is_auto_link_click';

export const LINK_CLICK_EVENT_NAME = 'Auto Link Click';
