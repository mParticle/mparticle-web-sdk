import FilterHashingUtilities from "../../src/hashingFilter";
import { EventTypeEnum } from "../../src/types.interfaces";

describe('FilterHashingUtilities', () => {
    describe('#hashEventType', () => {
        it('should hash event type', () => {
            const eventTypeUnknownHash = FilterHashingUtilities.hashEventType(EventTypeEnum.Unknown);
            const eventTypeNavigationHash = FilterHashingUtilities.hashEventType(EventTypeEnum.Navigation);
            const eventTypeLocationHash = FilterHashingUtilities.hashEventType(EventTypeEnum.Location)
            const eventTypeSearchHash = FilterHashingUtilities.hashEventType(EventTypeEnum.Search)
            const eventTypeTransactionHash = FilterHashingUtilities.hashEventType(EventTypeEnum.Transaction)
            const eventTypeUserContentHash = FilterHashingUtilities.hashEventType(EventTypeEnum.UserContent)
            const eventTypeUserPreferenceHash = FilterHashingUtilities.hashEventType(EventTypeEnum.UserPreference)
            const eventTypeSocialHash = FilterHashingUtilities.hashEventType(EventTypeEnum.Social)
            const eventTypeOtherHash = FilterHashingUtilities.hashEventType(EventTypeEnum.Other)
            const eventTypeMediaHash = FilterHashingUtilities.hashEventType(EventTypeEnum.Media)

            const expectedUnknownHash = 48;
            const expectedNavigationHash = 49;
            const expectedLocationHash = 50;
            const expectedSearchHash = 51;
            const expectedTransactionHash = 52;
            const expectedUserContentHash = 53;
            const expectedUserPreferenceHash = 54;
            const expectedSocialHash = 55;
            const expectedOthernHash = 56;
            const expectedMediaHash = 57;

            expect(eventTypeUnknownHash).toBe(expectedUnknownHash);
            expect(eventTypeNavigationHash).toBe(expectedNavigationHash);
            expect(eventTypeLocationHash).toBe(expectedLocationHash);
            expect(eventTypeSearchHash).toBe(expectedSearchHash);
            expect(eventTypeTransactionHash).toBe(expectedTransactionHash);
            expect(eventTypeUserContentHash).toBe(expectedUserContentHash);
            expect(eventTypeUserPreferenceHash).toBe(expectedUserPreferenceHash);
            expect(eventTypeSocialHash).toBe(expectedSocialHash);
            expect(eventTypeOtherHash).toBe(expectedOthernHash);
            expect(eventTypeMediaHash).toBe(expectedMediaHash);
        });
    });

    describe('#hashEventName', () => {
        it('should hash event name', () => {
            const eventName = 'foo-event-name';

            const eventTypeUnknownHash = FilterHashingUtilities.hashEventName(eventName, EventTypeEnum.Unknown);
            const eventTypeNavigationHash = FilterHashingUtilities.hashEventName(eventName, EventTypeEnum.Navigation);
            const eventTypeLocationHash = FilterHashingUtilities.hashEventName(eventName, EventTypeEnum.Location);
            const eventTypeSearchHash = FilterHashingUtilities.hashEventName(eventName, EventTypeEnum.Search);
            const eventTypeTransactionHash = FilterHashingUtilities.hashEventName(eventName, EventTypeEnum.Transaction);
            const eventTypeUserContentHash = FilterHashingUtilities.hashEventName(eventName, EventTypeEnum.UserContent);
            const eventTypeUserPreferenceHash = FilterHashingUtilities.hashEventName(eventName, EventTypeEnum.UserPreference);
            const eventTypeSocialHash = FilterHashingUtilities.hashEventName(eventName, EventTypeEnum.Social);
            const eventTypeOtherHash = FilterHashingUtilities.hashEventName(eventName, EventTypeEnum.Other);
            const eventTypeMediaHash = FilterHashingUtilities.hashEventName(eventName, EventTypeEnum.Media);

            const expectedUnknownHash = -59445899;
            const expectedNavigationHash = 1448105910;
            const expectedLocationHash = -1339309577;
            const expectedSearchHash = 168242232;
            const expectedTransactionHash = 1675794041;
            const expectedUserContentHash = -1111621446;
            const expectedUserPreferenceHash = 395930363;
            const expectedSocialHash = 1903482172;
            const expectedOthernHash = -883933315;
            const expectedMediaHash = 623618494;

            expect(eventTypeUnknownHash).toBe(expectedUnknownHash);
            expect(eventTypeNavigationHash).toBe(expectedNavigationHash);
            expect(eventTypeLocationHash).toBe(expectedLocationHash);
            expect(eventTypeSearchHash).toBe(expectedSearchHash);
            expect(eventTypeTransactionHash).toBe(expectedTransactionHash);
            expect(eventTypeUserContentHash).toBe(expectedUserContentHash);
            expect(eventTypeUserPreferenceHash).toBe(expectedUserPreferenceHash);
            expect(eventTypeSocialHash).toBe(expectedSocialHash);
            expect(eventTypeOtherHash).toBe(expectedOthernHash);
            expect(eventTypeMediaHash).toBe(expectedMediaHash);
        });
    });

    describe('#hashEventAttributeKey', () => {
        it('should hash event attribute key', () => {
            const eventType:EventTypeEnum = EventTypeEnum.Navigation;
            const eventName:string = 'foo-event-name';
            const customAttributeName: string = 'event-attribute-key';

            const resultHash = FilterHashingUtilities.hashEventAttributeKey(eventType, eventName, customAttributeName);

            const expectedHash = 683216453;

            expect(resultHash).toBe(expectedHash);
        });
    });

    describe('#hashUserAttributeKey', () => {
        it('should hash user attribute key', () => {
            const userAttributeKey:string = 'foo-value';

            const resultHash = FilterHashingUtilities.hashUserAttributeValue(userAttributeKey);

            const expectedHash = 1630602666;

            expect(resultHash).toBe(expectedHash);
        });
    });

    describe('#hashUserAttributeValue', () => {
        it('should hash user attribute value', () => {
            const userAttributeValue:string = 'foo-value';

            const resultHash = FilterHashingUtilities.hashUserAttributeValue(userAttributeValue);

            const expectedHash = 1630602666;

            expect(resultHash).toBe(expectedHash);
        });
    });
});
