import {
    isBlockedByForwardingRule,
    isBlockedByEventFilter,
    isEventForwarded,
    filterEventAttributes,
    filterUserIdentities,
} from '../../src/forwarder-utils';
import KitFilterHelper from '../../src/kitFilterHelper';
import Types, { EventType, IdentityType } from '../../src/types';
import type { SDKEvent } from '../../src/sdkRuntimeModels';
import type KitBlocker from '../../src/kitBlocking';

const { MessageType, CommerceEventType } = Types;

type ForwarderConfig = Parameters<typeof isEventForwarded>[1];

const hashAttr = KitFilterHelper.hashAttributeConditionalForwarding;

// The filter config type marks every field required; a test sets only the
// fields it exercises.
function config(fields: Partial<ForwarderConfig> = {}): ForwarderConfig {
    return fields as ForwarderConfig;
}

function forwardingRule(
    name: string,
    value: string,
    includeOnMatch: boolean
): ForwarderConfig {
    return config({
        filteringEventAttributeValue: {
            eventAttributeName: hashAttr(name),
            eventAttributeValue: hashAttr(value),
            includeOnMatch,
        },
    });
}

function buildEvent(overrides: Partial<SDKEvent> = {}): SDKEvent {
    return ({
        EventName: 'Test Event',
        EventCategory: EventType.Navigation,
        EventDataType: MessageType.PageEvent,
        EventAttributes: { color: 'blue' },
        ...overrides,
    } as unknown) as SDKEvent;
}

describe('forwarder-utils', () => {
    describe('#isBlockedByForwardingRule', () => {
        it('does not block message types the rule does not apply to', () => {
            const forwarder = forwardingRule('color', 'blue', true);

            expect(
                isBlockedByForwardingRule(
                    MessageType.SessionStart,
                    { color: 'red' },
                    forwarder
                )
            ).toBe(false);
        });

        it('does not block when the forwarder has no rule', () => {
            expect(
                isBlockedByForwardingRule(
                    MessageType.PageEvent,
                    { color: 'red' },
                    config()
                )
            ).toBe(false);
        });

        it('does not block when the rule has no attribute name or value', () => {
            const noName = config({
                filteringEventAttributeValue: {
                    eventAttributeName: '',
                    eventAttributeValue: hashAttr('blue'),
                    includeOnMatch: true,
                },
            });
            const noValue = config({
                filteringEventAttributeValue: {
                    eventAttributeName: hashAttr('color'),
                    eventAttributeValue: '',
                    includeOnMatch: true,
                },
            });

            expect(
                isBlockedByForwardingRule(
                    MessageType.PageEvent,
                    { color: 'red' },
                    noName
                )
            ).toBe(false);
            expect(
                isBlockedByForwardingRule(
                    MessageType.PageEvent,
                    { color: 'red' },
                    noValue
                )
            ).toBe(false);
        });

        describe('when includeOnMatch is true', () => {
            const forwarder = forwardingRule('color', 'blue', true);

            it('lets a matching event through', () => {
                expect(
                    isBlockedByForwardingRule(
                        MessageType.PageEvent,
                        { color: 'blue' },
                        forwarder
                    )
                ).toBe(false);
            });

            it('blocks an event whose value differs', () => {
                expect(
                    isBlockedByForwardingRule(
                        MessageType.PageView,
                        { color: 'red' },
                        forwarder
                    )
                ).toBe(true);
            });

            it('blocks an event without the attribute', () => {
                expect(
                    isBlockedByForwardingRule(
                        MessageType.Commerce,
                        { size: 'large' },
                        forwarder
                    )
                ).toBe(true);
            });

            it('blocks an event with no attributes', () => {
                expect(
                    isBlockedByForwardingRule(
                        MessageType.PageEvent,
                        null,
                        forwarder
                    )
                ).toBe(true);
            });
        });

        describe('when includeOnMatch is false', () => {
            const forwarder = forwardingRule('color', 'blue', false);

            it('blocks a matching event', () => {
                expect(
                    isBlockedByForwardingRule(
                        MessageType.PageEvent,
                        { color: 'blue' },
                        forwarder
                    )
                ).toBe(true);
            });

            it('lets an event whose value differs through', () => {
                expect(
                    isBlockedByForwardingRule(
                        MessageType.PageEvent,
                        { color: 'red' },
                        forwarder
                    )
                ).toBe(false);
            });

            it('lets an event with no attributes through', () => {
                expect(
                    isBlockedByForwardingRule(
                        MessageType.PageEvent,
                        null,
                        forwarder
                    )
                ).toBe(false);
            });
        });

        it('ignores inherited attribute properties', () => {
            const forwarder = forwardingRule('color', 'blue', true);
            const attributes = Object.create({ color: 'blue' });

            expect(
                isBlockedByForwardingRule(
                    MessageType.PageEvent,
                    attributes,
                    forwarder
                )
            ).toBe(true);
        });
    });

    describe('#isBlockedByEventFilter', () => {
        const nameHash = KitFilterHelper.hashEventName(
            'Test Event',
            EventType.Navigation
        );
        const typeHash = KitFilterHelper.hashEventType(EventType.Navigation);

        it('blocks a page event by name', () => {
            expect(
                isBlockedByEventFilter(
                    MessageType.PageEvent,
                    nameHash,
                    typeHash,
                    config({ eventNameFilters: [nameHash] })
                )
            ).toBe(true);
        });

        it('blocks a page event by type', () => {
            expect(
                isBlockedByEventFilter(
                    MessageType.PageEvent,
                    nameHash,
                    typeHash,
                    config({ eventTypeFilters: [typeHash] })
                )
            ).toBe(true);
        });

        it('blocks a commerce event by type only', () => {
            expect(
                isBlockedByEventFilter(
                    MessageType.Commerce,
                    nameHash,
                    typeHash,
                    config({ eventTypeFilters: [typeHash] })
                )
            ).toBe(true);
            expect(
                isBlockedByEventFilter(
                    MessageType.Commerce,
                    nameHash,
                    typeHash,
                    config({ eventNameFilters: [nameHash] })
                )
            ).toBe(false);
        });

        it('blocks a page view by screen name only', () => {
            expect(
                isBlockedByEventFilter(
                    MessageType.PageView,
                    nameHash,
                    typeHash,
                    config({ screenNameFilters: [nameHash] })
                )
            ).toBe(true);
            expect(
                isBlockedByEventFilter(
                    MessageType.PageView,
                    nameHash,
                    typeHash,
                    config({ eventNameFilters: [nameHash] })
                )
            ).toBe(false);
        });

        it('does not block when the filter lists are empty or missing', () => {
            expect(
                isBlockedByEventFilter(
                    MessageType.PageEvent,
                    nameHash,
                    typeHash,
                    config({ eventNameFilters: [], eventTypeFilters: [] })
                )
            ).toBe(false);
            expect(
                isBlockedByEventFilter(
                    MessageType.PageEvent,
                    nameHash,
                    typeHash,
                    config()
                )
            ).toBe(false);
        });

        it('does not block other message types', () => {
            expect(
                isBlockedByEventFilter(
                    MessageType.SessionStart,
                    nameHash,
                    typeHash,
                    config({
                        eventNameFilters: [nameHash],
                        eventTypeFilters: [typeHash],
                        screenNameFilters: [nameHash],
                    })
                )
            ).toBe(false);
        });
    });

    describe('#isEventForwarded', () => {
        it('forwards an event no filter matches', () => {
            expect(isEventForwarded(buildEvent(), config())).toBe(true);
        });

        it('does not forward an event a forwarding rule blocks', () => {
            const forwarder = forwardingRule('color', 'red', true);

            expect(isEventForwarded(buildEvent(), forwarder)).toBe(false);
        });

        it('does not forward an event an event name filter blocks', () => {
            const forwarder = config({
                eventNameFilters: [
                    KitFilterHelper.hashEventName(
                        'Test Event',
                        EventType.Navigation
                    ),
                ],
            });

            expect(isEventForwarded(buildEvent(), forwarder)).toBe(false);
        });

        it('applies kit blocking when it is enabled', () => {
            const blocked = buildEvent({ EventName: 'Planned Event' });
            const kitBlocker = ({
                kitBlockingEnabled: true,
                createBlockedEvent: jest.fn().mockReturnValue(blocked),
            } as unknown) as KitBlocker;
            const forwarder = config({
                eventNameFilters: [
                    KitFilterHelper.hashEventName(
                        'Planned Event',
                        EventType.Navigation
                    ),
                ],
            });

            expect(isEventForwarded(buildEvent(), forwarder, kitBlocker)).toBe(
                false
            );
            expect(kitBlocker.createBlockedEvent).toHaveBeenCalled();
        });

        it('does not forward an event kit blocking removes', () => {
            const kitBlocker = ({
                kitBlockingEnabled: true,
                createBlockedEvent: jest.fn().mockReturnValue(null),
            } as unknown) as KitBlocker;

            expect(isEventForwarded(buildEvent(), config(), kitBlocker)).toBe(false);
        });

        it('skips kit blocking when it is disabled', () => {
            const kitBlocker = ({
                kitBlockingEnabled: false,
                createBlockedEvent: jest.fn(),
            } as unknown) as KitBlocker;

            expect(isEventForwarded(buildEvent(), config(), kitBlocker)).toBe(true);
            expect(kitBlocker.createBlockedEvent).not.toHaveBeenCalled();
        });

        it('filters a commerce event by its type', () => {
            const event = buildEvent({
                EventDataType: MessageType.Commerce,
                EventCategory: CommerceEventType.ProductPurchase,
            });
            const forwarder = config({
                eventTypeFilters: [
                    KitFilterHelper.hashEventType(
                        CommerceEventType.ProductPurchase as any
                    ),
                ],
            });

            expect(isEventForwarded(event, forwarder)).toBe(false);
        });
    });

    describe('#filterEventAttributes', () => {
        const attributes = { keep: 'yes', drop: 'no' };
        const dropHash = KitFilterHelper.hashEventAttributeKey(
            EventType.Navigation,
            'Test Event',
            'drop'
        );

        it('removes filtered attributes from a page event', () => {
            expect(
                filterEventAttributes(
                    MessageType.PageEvent,
                    EventType.Navigation,
                    'Test Event',
                    attributes,
                    config({ attributeFilters: [dropHash] })
                )
            ).toEqual({ keep: 'yes' });
        });

        it('removes filtered screen attributes from a page view', () => {
            expect(
                filterEventAttributes(
                    MessageType.PageView,
                    EventType.Navigation,
                    'Test Event',
                    attributes,
                    config({ screenAttributeFilters: [dropHash] })
                )
            ).toEqual({ keep: 'yes' });
        });

        it('returns the attributes unchanged when there is no filter list', () => {
            expect(
                filterEventAttributes(
                    MessageType.PageEvent,
                    EventType.Navigation,
                    'Test Event',
                    attributes,
                    config()
                )
            ).toBe(attributes);
        });

        it('returns the attributes unchanged for other message types', () => {
            expect(
                filterEventAttributes(
                    MessageType.Commerce,
                    EventType.Navigation,
                    'Test Event',
                    attributes,
                    config({ attributeFilters: [dropHash] })
                )
            ).toBe(attributes);
        });

        it('returns null attributes as they are', () => {
            expect(
                filterEventAttributes(
                    MessageType.PageEvent,
                    EventType.Navigation,
                    'Test Event',
                    null,
                    config({ attributeFilters: [dropHash] })
                )
            ).toBeNull();
        });

        it('ignores inherited attribute properties', () => {
            const inherited = Object.create({ inheritedKey: 'value' });
            inherited.own = 'value';

            expect(
                filterEventAttributes(
                    MessageType.PageEvent,
                    EventType.Navigation,
                    'Test Event',
                    inherited,
                    config({ attributeFilters: [] })
                )
            ).toEqual({ own: 'value' });
        });
    });

    describe('#filterUserIdentities', () => {
        it('removes filtered identity types', () => {
            const identities = [
                { Type: IdentityType.Email },
                { Type: IdentityType.CustomerId },
            ];

            expect(
                filterUserIdentities(identities, [
                    KitFilterHelper.hashUserIdentity(
                        IdentityType.Email as any
                    ) as any,
                ])
            ).toEqual([{ Type: IdentityType.CustomerId }]);
        });

        it('handles the Other identity type, whose value is 0', () => {
            const identities = [
                { Type: IdentityType.Other },
                { Type: IdentityType.Email },
            ];

            expect(
                filterUserIdentities(identities, [
                    KitFilterHelper.hashUserIdentity(
                        IdentityType.Other as any
                    ) as any,
                ])
            ).toEqual([{ Type: IdentityType.Email }]);
        });

        it('returns an empty list when there are no identities', () => {
            expect(filterUserIdentities(undefined, [1])).toEqual([]);
            expect(filterUserIdentities([], [1])).toEqual([]);
        });

        it('keeps every identity when the filter list is empty', () => {
            const identities = [{ Type: IdentityType.Email }];

            expect(filterUserIdentities(identities, [])).toEqual(identities);
        });
    });
});
