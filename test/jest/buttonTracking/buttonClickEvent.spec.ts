import {
    AUTO_BUTTON_ATTRIBUTE,
    BUTTON_CLICK_EVENT_NAME,
    buildButtonClickEvent,
    isButtonClickForwarded,
} from '../../../src/buttonTracking/buttonClickEvent';
import { IButtonClick } from '../../../src/buttonTracking/buttonDescription';
import { IKitFilterSettings } from '../../../src/configAPIClient';
import Helpers from '../../../src/helpers';
import KitBlocker from '../../../src/kitBlocking';
import KitFilterHelper from '../../../src/kitFilterHelper';
import { IMParticleWebSDKInstance } from '../../../src/mp-instance';
import { KitBlockerDataPlan } from '../../../src/sdkRuntimeModels';
import { EventType } from '../../../src/types';

const connection = (
    filters: Partial<IKitFilterSettings> = {}
): IKitFilterSettings => (filters as unknown) as IKitFilterSettings;

const kitBlockerFor = (
    dataPoints: unknown[],
    blok = { ev: true, ea: false, ua: false, id: false }
): KitBlocker => {
    const mpInstance = ({
        Logger: { verbose: jest.fn(), warning: jest.fn(), error: jest.fn() },
    } as unknown) as IMParticleWebSDKInstance;
    mpInstance._Helpers = new Helpers(mpInstance);
    return new KitBlocker(
        ({
            document: {
                dtpn: {
                    blok,
                    vers: { version_document: { data_points: dataPoints } },
                },
            },
        } as unknown) as KitBlockerDataPlan,
        mpInstance
    );
};

const customEventPoint = (eventName: string) => ({
    match: {
        type: 'custom_event',
        criteria: { event_name: eventName, custom_event_type: 'other' },
    },
    validator: { type: 'json_schema', definition: {} },
});

// Required, so a field added to IButtonClick has to be added here too.
const clickWithEveryField: Required<IButtonClick> = {
    label: 'place order',
    labelSource: 'text',
    ariaLabel: 'place order',
    icon: 'cart',
    elementId: 'checkout',
    elementName: 'checkout',
    testId: 'checkout',
    controls: 'menu',
    form: 'payment',
    element: 'link',
    type: 'submit',
    linkType: 'download',
    linkDomain: 'example.com',
    fileExtension: 'pdf',
    checked: false,
};

const attributeRule = (name: string, value: string, includeOnMatch: boolean) =>
    connection({
        filteringEventAttributeValue: {
            eventAttributeName: KitFilterHelper.hashAttributeConditionalForwarding(name),
            eventAttributeValue: KitFilterHelper.hashAttributeConditionalForwarding(value),
            includeOnMatch,
        },
    });

describe('isButtonClickForwarded', () => {
    it('is true for a connection with no filters and no data plan', () => {
        expect(isButtonClickForwarded(connection())).toBe(true);
    });

    it('is false when the connection filters the event name', () => {
        const eventNameFilters = [
            KitFilterHelper.hashEventName(BUTTON_CLICK_EVENT_NAME, EventType.Other),
        ];

        expect(isButtonClickForwarded(connection({ eventNameFilters }))).toBe(false);
    });

    it('is false when the connection filters the event type', () => {
        const eventTypeFilters = [KitFilterHelper.hashEventType(EventType.Other)];

        expect(isButtonClickForwarded(connection({ eventTypeFilters }))).toBe(false);
    });

    it('is true when the connection filters only other event names', () => {
        const eventNameFilters = [
            KitFilterHelper.hashEventName('Some Other Event', EventType.Other),
        ];

        expect(isButtonClickForwarded(connection({ eventNameFilters }))).toBe(true);
    });

    it('is false when the data plan blocks unplanned events and does not plan it', () => {
        const kitBlocker = kitBlockerFor([customEventPoint('Some Other Event')]);

        expect(isButtonClickForwarded(connection(), kitBlocker)).toBe(false);
    });

    it('is true when the data plan plans it', () => {
        const kitBlocker = kitBlockerFor([customEventPoint(BUTTON_CLICK_EVENT_NAME)]);

        expect(isButtonClickForwarded(connection(), kitBlocker)).toBe(true);
    });

    it('is true when the data plan does not block unplanned events', () => {
        const kitBlocker = kitBlockerFor([], { ev: false, ea: false, ua: false, id: false });

        expect(isButtonClickForwarded(connection(), kitBlocker)).toBe(true);
    });

    it('is false when a forwarding rule excludes auto button clicks', () => {
        const rule = attributeRule(AUTO_BUTTON_ATTRIBUTE, 'true', false);

        expect(isButtonClickForwarded(rule)).toBe(false);
    });

    it('is true when a forwarding rule includes auto button clicks', () => {
        const rule = attributeRule(AUTO_BUTTON_ATTRIBUTE, 'true', true);

        expect(isButtonClickForwarded(rule)).toBe(true);
    });

    it.each([
        ['includes', true],
        ['excludes', false],
    ])('is false when a forwarding rule %s events by an attribute that varies per click', (_, includeOnMatch) => {
        const rule = attributeRule('label', 'place order', includeOnMatch as boolean);

        expect(isButtonClickForwarded(rule)).toBe(false);
    });

    it('is false when a forwarding rule excludes events by any attribute a click can carry', () => {
        const { data } = buildButtonClickEvent(clickWithEveryField, '/cart');
        const varying = Object.keys(data).filter(name => name !== AUTO_BUTTON_ATTRIBUTE && name !== 'hostname');

        expect(varying.filter(name => isButtonClickForwarded(attributeRule(name, 'x', false)))).toEqual([]);
    });

    it.each([
        ['includes only this page\'s hostname', window.location.hostname, true, true],
        ['excludes only another hostname', 'staging.example.com', false, true],
        ['excludes this page\'s hostname', window.location.hostname, false, false],
        ['includes only another hostname', 'staging.example.com', true, false],
    ])('follows a forwarding rule that %s', (_, hostname, includeOnMatch, forwarded) => {
        const rule = attributeRule('hostname', hostname as string, includeOnMatch as boolean);

        expect(isButtonClickForwarded(rule)).toBe(forwarded);
    });

    it('is true when a forwarding rule excludes events by an attribute no click carries', () => {
        const rule = attributeRule('environment', 'staging', false);

        expect(isButtonClickForwarded(rule)).toBe(true);
    });

    it('is false when a forwarding rule includes only events with an attribute no click carries', () => {
        const rule = attributeRule('environment', 'production', true);

        expect(isButtonClickForwarded(rule)).toBe(false);
    });

    it('is true when a forwarding rule names an attribute but no value', () => {
        const rule = connection({
            filteringEventAttributeValue: {
                eventAttributeName: KitFilterHelper.hashAttributeConditionalForwarding('label'),
                eventAttributeValue: '',
                includeOnMatch: true,
            },
        });

        expect(isButtonClickForwarded(rule)).toBe(true);
    });
});
