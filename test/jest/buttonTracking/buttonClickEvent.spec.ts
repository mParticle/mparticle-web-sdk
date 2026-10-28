import {
    AUTO_BUTTON_ATTRIBUTE,
    AUTO_LINK_ATTRIBUTE,
    BUTTON_CLICK_EVENT_NAME,
    buildButtonClickEvent,
    buildLinkClickEvent,
    getButtonClickBlocker,
    LINK_CLICK_EVENT_NAME,
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
    productId: 'p-100',
    productCategory: 'women > jeans',
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

describe('buildButtonClickEvent and buildLinkClickEvent', () => {
    const outbound: IButtonClick = {
        label: 'help centre',
        labelSource: 'text',
        element: 'link',
        type: 'button',
        linkType: 'outbound',
        linkDomain: 'example.org',
    };
    const attributes = {
        label: 'help centre',
        label_source: 'text',
        element: 'link',
        type: 'button',
        link_type: 'outbound',
        link_domain: 'example.org',
        path: '/help',
        hostname: window.location.hostname,
    };

    it('builds a link click as an Other event with its own marker, never Navigation', () => {
        expect(buildLinkClickEvent(outbound, '/help')).toEqual({
            messageType: 4,
            name: LINK_CLICK_EVENT_NAME,
            eventType: EventType.Other,
            data: { ...attributes, [AUTO_LINK_ATTRIBUTE]: true },
        });
    });

    it('sends a link to another page of the site without its label or aria label', () => {
        const { data } = buildLinkClickEvent(
            { ...outbound, linkType: 'internal', linkDomain: undefined, ariaLabel: 'hi jane', elementId: 'account' },
            '/help'
        );

        expect(data).toEqual({
            label_source: 'none',
            element: 'link',
            type: 'button',
            link_type: 'internal',
            element_id: 'account',
            path: '/help',
            hostname: window.location.hostname,
            [AUTO_LINK_ATTRIBUTE]: true,
        });
    });

    it.each(['role', 'wallet'])('keeps the label of a %s control that links to another page of the site', element => {
        const { data } = buildLinkClickEvent(
            { ...outbound, element: element as IButtonClick['element'], linkType: 'internal', linkDomain: undefined, label: 'paypal' },
            '/help'
        );

        expect(data.label).toBe('paypal');
        expect(data.label_source).toBe('text');
    });

    it('builds a button click with the same attributes and the button marker', () => {
        expect(buildButtonClickEvent(outbound, '/help')).toEqual({
            messageType: 4,
            name: BUTTON_CLICK_EVENT_NAME,
            eventType: EventType.Other,
            data: { ...attributes, [AUTO_BUTTON_ATTRIBUTE]: true },
        });
    });
});

describe('getButtonClickBlocker', () => {
    describe('for auto link clicks', () => {
        it('names the event name filter when the connection filters Auto Link Click by name', () => {
            const eventNameFilters = [KitFilterHelper.hashEventName(LINK_CLICK_EVENT_NAME, EventType.Other)];

            expect(getButtonClickBlocker(connection({ eventNameFilters }), undefined, true)).toBe('event name filter');
            expect(getButtonClickBlocker(connection({ eventNameFilters }))).toBeUndefined();
        });

        it('names the data plan when it plans Auto Button Click but not Auto Link Click', () => {
            const kitBlocker = kitBlockerFor([customEventPoint(BUTTON_CLICK_EVENT_NAME)]);

            expect(getButtonClickBlocker(connection(), kitBlocker, true)).toBe('data plan');
            expect(getButtonClickBlocker(connection(), kitBlocker)).toBeUndefined();
        });

        it('names the forwarding rule when it excludes auto link clicks by their marker', () => {
            const rule = attributeRule(AUTO_LINK_ATTRIBUTE, 'true', false);

            expect(getButtonClickBlocker(rule, undefined, true)).toBe('forwarding rule');
            expect(getButtonClickBlocker(rule)).toBeUndefined();
        });

        it('finds none when the connection receives auto link clicks', () => {
            expect(getButtonClickBlocker(connection(), undefined, true)).toBeUndefined();
        });
    });

    it('finds none for a connection with no filters and no data plan', () => {
        expect(getButtonClickBlocker(connection())).toBeUndefined();
    });

    it('names the event name filter when the connection filters the event name', () => {
        const eventNameFilters = [
            KitFilterHelper.hashEventName(BUTTON_CLICK_EVENT_NAME, EventType.Other),
        ];

        expect(getButtonClickBlocker(connection({ eventNameFilters }))).toBe('event name filter');
    });

    it('names the event type filter when the connection filters the event type', () => {
        const eventTypeFilters = [KitFilterHelper.hashEventType(EventType.Other)];

        expect(getButtonClickBlocker(connection({ eventTypeFilters }))).toBe('event type filter');
    });

    it('finds none when the connection filters only other event names', () => {
        const eventNameFilters = [
            KitFilterHelper.hashEventName('Some Other Event', EventType.Other),
        ];

        expect(getButtonClickBlocker(connection({ eventNameFilters }))).toBeUndefined();
    });

    it('names the data plan when it blocks unplanned events and does not plan it', () => {
        const kitBlocker = kitBlockerFor([customEventPoint('Some Other Event')]);

        expect(getButtonClickBlocker(connection(), kitBlocker)).toBe('data plan');
    });

    it('finds none when the data plan plans it', () => {
        const kitBlocker = kitBlockerFor([customEventPoint(BUTTON_CLICK_EVENT_NAME)]);

        expect(getButtonClickBlocker(connection(), kitBlocker)).toBeUndefined();
    });

    it('finds none when the data plan does not block unplanned events', () => {
        const kitBlocker = kitBlockerFor([], { ev: false, ea: false, ua: false, id: false });

        expect(getButtonClickBlocker(connection(), kitBlocker)).toBeUndefined();
    });

    it('judges a forwarding rule by the attributes the data plan leaves on a click', () => {
        const kitBlocker = kitBlockerFor(
            [{
                ...customEventPoint(BUTTON_CLICK_EVENT_NAME),
                validator: { type: 'json_schema', definition: { properties: { data: { additionalProperties: false } } } },
            }],
            { ev: true, ea: true, ua: false, id: false }
        );
        const rule = attributeRule(AUTO_BUTTON_ATTRIBUTE, 'true', true);

        expect(getButtonClickBlocker(rule, kitBlocker)).toBe('forwarding rule');
    });

    it('names the forwarding rule when it excludes auto button clicks', () => {
        const rule = attributeRule(AUTO_BUTTON_ATTRIBUTE, 'true', false);

        expect(getButtonClickBlocker(rule)).toBe('forwarding rule');
    });

    it('finds none when a forwarding rule includes auto button clicks', () => {
        const rule = attributeRule(AUTO_BUTTON_ATTRIBUTE, 'true', true);

        expect(getButtonClickBlocker(rule)).toBeUndefined();
    });

    it.each([
        ['includes', true],
        ['excludes', false],
    ])('names the forwarding rule when it %s events by an attribute that varies per click', (_, includeOnMatch) => {
        const rule = attributeRule('label', 'place order', includeOnMatch as boolean);

        expect(getButtonClickBlocker(rule)).toBe('forwarding rule');
    });

    it('names the forwarding rule when it excludes events by any attribute a click can carry', () => {
        const { data } = buildButtonClickEvent(clickWithEveryField, '/cart');
        const varying = Object.keys(data).filter(name => name !== AUTO_BUTTON_ATTRIBUTE && name !== 'hostname');

        expect(varying.filter(name => getButtonClickBlocker(attributeRule(name, 'x', false)) !== 'forwarding rule')).toEqual([]);
    });

    it.each([
        ['includes only this page\'s hostname', window.location.hostname, true, undefined],
        ['excludes only another hostname', 'staging.example.com', false, undefined],
        ['excludes this page\'s hostname', window.location.hostname, false, 'forwarding rule'],
        ['includes only another hostname', 'staging.example.com', true, 'forwarding rule'],
    ])('follows a forwarding rule that %s', (_, hostname, includeOnMatch, blocker) => {
        const rule = attributeRule('hostname', hostname as string, includeOnMatch as boolean);

        expect(getButtonClickBlocker(rule)).toBe(blocker);
    });

    it('finds none when a forwarding rule excludes events by an attribute no click carries', () => {
        const rule = attributeRule('environment', 'staging', false);

        expect(getButtonClickBlocker(rule)).toBeUndefined();
    });

    it('names the forwarding rule when it includes only events with an attribute no click carries', () => {
        const rule = attributeRule('environment', 'production', true);

        expect(getButtonClickBlocker(rule)).toBe('forwarding rule');
    });

    it('finds none when a forwarding rule names an attribute but no value', () => {
        const rule = connection({
            filteringEventAttributeValue: {
                eventAttributeName: KitFilterHelper.hashAttributeConditionalForwarding('label'),
                eventAttributeValue: '',
                includeOnMatch: true,
            },
        });

        expect(getButtonClickBlocker(rule)).toBeUndefined();
    });
});
