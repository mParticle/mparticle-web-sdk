import { BaseEvent } from '../sdkRuntimeModels';
import { EVENT_TYPE_OTHER, MESSAGE_TYPE_PAGE_EVENT } from '../eventTypeIds';
import {
    AUTO_BUTTON_ATTRIBUTE,
    AUTO_LINK_ATTRIBUTE,
    BUTTON_CLICK_EVENT_NAME,
    LINK_CLICK_EVENT_NAME,
} from '../autoClickNames';
import { IButtonClick } from './buttonDescription';
import { pagePath } from '../pathMasking';

export {
    AUTO_BUTTON_ATTRIBUTE,
    AUTO_LINK_ATTRIBUTE,
    BUTTON_CLICK_EVENT_NAME,
    LINK_CLICK_EVENT_NAME,
};

// The attributes both click events carry, with the page fields that auto page
// views carry. No intent: classifying clicks is left to whoever reads the data.
const clickAttributes = (
    click: IButtonClick,
    pathname: string
): { [key: string]: string | boolean } => {
    const data: { [key: string]: string | boolean } = {
        label_source: click.labelSource,
        element: click.element,
        type: click.type,
        path: pagePath(pathname),
        hostname: window.location.hostname,
    };
    // Optional fields are left out when the control has no safe value for them.
    const optional: { [key: string]: string | undefined } = {
        label: click.label,
        aria_label: click.ariaLabel,
        icon: click.icon,
        element_id: click.elementId,
        element_name: click.elementName,
        test_id: click.testId,
        controls: click.controls,
        form: click.form,
        group: click.group,
        link_type: click.linkType,
        link_domain: click.linkDomain,
        link_path: click.linkPath,
        file_extension: click.fileExtension,
    };
    for (const key of Object.keys(optional)) {
        if (optional[key]) {
            data[key] = optional[key];
        }
    }
    if (click.checked !== undefined) {
        data.checked = click.checked;
    }
    return data;
};

// One custom event per button click, logged like logLink() with the auto marker.
export const buildButtonClickEvent = (
    click: IButtonClick,
    pathname: string
): BaseEvent => {
    const data = clickAttributes(click, pathname);
    data[AUTO_BUTTON_ATTRIBUTE] = true;
    return {
        messageType: MESSAGE_TYPE_PAGE_EVENT,
        name: BUTTON_CLICK_EVENT_NAME,
        data,
        eventType: EVENT_TYPE_OTHER,
    };
};

// One custom event per click on a link that leaves the page. Typed Other, not
// Navigation, so no kit reads it as a page change. A plain link to another page
// of the site goes without its text, which can name the shopper ("Hi, Jane"), and
// with its destination path instead; a button or wallet acting as a link keeps
// its name.
export const buildLinkClickEvent = (
    click: IButtonClick,
    pathname: string
): BaseEvent => {
    const data = clickAttributes(
        click.linkType === 'internal' && click.element === 'link'
            ? {
                  ...click,
                  label: undefined,
                  labelSource: 'none',
                  ariaLabel: undefined,
              }
            : click,
        pathname
    );
    data[AUTO_LINK_ATTRIBUTE] = true;
    return {
        messageType: MESSAGE_TYPE_PAGE_EVENT,
        name: LINK_CLICK_EVENT_NAME,
        data,
        eventType: EVENT_TYPE_OTHER,
    };
};
