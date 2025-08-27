import KitFilterHelper from "../../src/kitFilterHelper";
import { EventType, IdentityType, MessageType } from "../../src/types";
import Constants from '../../src/constants';
const { CCPAPurpose } = Constants;


describe('FilterHashingUtilities', () => {
    describe('#hashEventType', () => {
        it('should hash event type Unknown', () => {
            const eventTypeUnknownHash = KitFilterHelper.hashEventType(EventType.Unknown);
            const expectedUnknownHash = 48;
            expect(eventTypeUnknownHash).toBe(expectedUnknownHash);
        });

        it('should hash event type Navigation', () => {
            const eventTypeNavigationHash = KitFilterHelper.hashEventType(EventType.Navigation);
            const expectedNavigationHash = 49;

            expect(eventTypeNavigationHash).toBe(expectedNavigationHash);
        });

        it('should hash event type Location', () => {
            const eventTypeLocationHash = KitFilterHelper.hashEventType(EventType.Location);
            const expectedLocationHash = 50;

            expect(eventTypeLocationHash).toBe(expectedLocationHash);
        });

        it('should hash event type Search', () => {
            const eventTypeSearchHash = KitFilterHelper.hashEventType(EventType.Search);
            const expectedSearchHash = 51;

            expect(eventTypeSearchHash).toBe(expectedSearchHash);
        });

        it('should hash event type Transaction', () => {
            const eventTypeTransactionHash = KitFilterHelper.hashEventType(EventType.Transaction);
            const expectedTransactionHash = 52;

            expect(eventTypeTransactionHash).toBe(expectedTransactionHash);
        });

        it('should hash event type UserContent', () => {
            const eventTypeUserContentHash = KitFilterHelper.hashEventType(EventType.UserContent);
            const expectedUserContentHash = 53;

            expect(eventTypeUserContentHash).toBe(expectedUserContentHash);

        });

        it('should hash event type UserPreference', () => {
            const eventTypeUserPreferenceHash = KitFilterHelper.hashEventType(EventType.UserPreference);
            const expectedUserPreferenceHash = 54;

            expect(eventTypeUserPreferenceHash).toBe(expectedUserPreferenceHash);

        });

        it('should hash event type Social', () => {
            const eventTypeSocialHash = KitFilterHelper.hashEventType(EventType.Social);
            const expectedSocialHash = 55;

            expect(eventTypeSocialHash).toBe(expectedSocialHash);

        });

        it('should hash event type Other', () => {
            const eventTypeOtherHash = KitFilterHelper.hashEventType(EventType.Other);
            const expectedOtherHash = 56;

            expect(eventTypeOtherHash).toBe(expectedOtherHash);

        });

        it('should hash event type Media', () => {
            const eventTypeMediaHash = KitFilterHelper.hashEventType(EventType.Media);
            const expectedMediaHash = 57;

            expect(eventTypeMediaHash).toBe(expectedMediaHash);

        });
    });

    describe('#hashEventName', () => {
        const eventName = 'foo-event-name';

        it('should hash event name with event type Unknown', () => {
            const eventTypeUnknownHash = KitFilterHelper.hashEventName(eventName, EventType.Unknown);
            const expectedUnknownHash = -59445899;
            
            expect(eventTypeUnknownHash).toBe(expectedUnknownHash);
        });

        it('should hash event name with event type Navigation', () => {
            const eventTypeNavigationHash = KitFilterHelper.hashEventName(eventName, EventType.Navigation);
            const expectedNavigationHash = 1448105910;
            

            expect(eventTypeNavigationHash).toBe(expectedNavigationHash);
        });

        it('should hash event name with event type Location', () => {
            const eventTypeLocationHash = KitFilterHelper.hashEventName(eventName, EventType.Location);
            const expectedLocationHash = -1339309577;
            

            expect(eventTypeLocationHash).toBe(expectedLocationHash);
        });

        it('should hash event name with event type Search', () => {
            const eventTypeSearchHash = KitFilterHelper.hashEventName(eventName, EventType.Search);
            const expectedSearchHash = 168242232;
            

            expect(eventTypeSearchHash).toBe(expectedSearchHash);
        });

        it('should hash event name with event type Transaction', () => {
            const eventTypeTransactionHash = KitFilterHelper.hashEventName(eventName, EventType.Transaction);
            const expectedTransactionHash = 1675794041;
            

            expect(eventTypeTransactionHash).toBe(expectedTransactionHash);
        });

        it('should hash event name with event type UserContent', () => {
            const eventTypeUserContentHash = KitFilterHelper.hashEventName(eventName, EventType.UserContent);
            const expectedUserContentHash = -1111621446;
            

            expect(eventTypeUserContentHash).toBe(expectedUserContentHash);

        });

        it('should hash event name with event type UserPreference', () => {
            const eventTypeUserPreferenceHash = KitFilterHelper.hashEventName(eventName, EventType.UserPreference);
            const expectedUserPreferenceHash = 395930363;
            

            expect(eventTypeUserPreferenceHash).toBe(expectedUserPreferenceHash);

        });

        it('should hash event name with event type Social', () => {
            const eventTypeSocialHash = KitFilterHelper.hashEventName(eventName, EventType.Social);
            const expectedSocialHash = 1903482172;
            

            expect(eventTypeSocialHash).toBe(expectedSocialHash);

        });

        it('should hash event name with event type Other', () => {
            const eventTypeOtherHash = KitFilterHelper.hashEventName(eventName, EventType.Other);
            const expectedOtherHash = -883933315;
            

            expect(eventTypeOtherHash).toBe(expectedOtherHash);

        });

        it('should hash event name with event type Media', () => {
            const eventTypeMediaHash = KitFilterHelper.hashEventName(eventName, EventType.Media);
            const expectedMediaHash = 623618494;

            expect(eventTypeMediaHash).toBe(expectedMediaHash);

        });
    });

    describe('#hashEventMessage', () => {
        it('should hash event message for SessionStart', () => {
            const eventName = '1';
            const eventType = EventType.Other;
            const messageType = MessageType.SessionStart;
            const resultHash = KitFilterHelper.hashEventMessage(eventName, eventType, messageType);
            expect(resultHash).toBe(48874);
        });

        it('should hash event message for SessionEnd', () => {
            const eventName = '2';
            const eventType = EventType.Other;
            const messageType = MessageType.SessionEnd;
            const resultHash = KitFilterHelper.hashEventMessage(eventName, eventType, messageType);
            expect(resultHash).toBe(49836);
        });

        it('should hash event message for PageView', () => {
            const eventName = 'Page View';
            const eventType = EventType.Navigation;
            const messageType = MessageType.PageView;
            const resultHash = KitFilterHelper.hashEventMessage(eventName, eventType, messageType);
            expect(resultHash).toBe(-1663677192);
        });

        it('should hash event message for PageEvent', () => {
            const eventName = 'Page Event';
            const eventType = EventType.Other;
            const messageType = MessageType.PageEvent;
            const resultHash = KitFilterHelper.hashEventMessage(eventName, eventType, messageType);
            expect(resultHash).toBe(385626957);
        });

        it('should hash event message for CrashReport', () => {
            const eventName = 'Crash Report';
            const eventType = EventType.Other;
            const messageType = MessageType.CrashReport;
            const resultHash = KitFilterHelper.hashEventMessage(eventName, eventType, messageType);
            expect(resultHash).toBe(-96572944);
        });

        it('should hash event message for OptOut', () => {
            const eventName = 'Opt Out';
            const eventType = EventType.Other;
            const messageType = MessageType.OptOut;
            const resultHash = KitFilterHelper.hashEventMessage(eventName, eventType, messageType);
            expect(resultHash).toBe(-1256811681);
        });

        it('should hash event message for AppStateTransition', () => {
            const eventName = 'App State Transition';
            const eventType = EventType.Other;
            const messageType = MessageType.AppStateTransition;
            const resultHash = KitFilterHelper.hashEventMessage(eventName, eventType, messageType);
            expect(resultHash).toBe(-181018660);
        });

        it('should hash event message for Profile', () => {
            const eventName = 'Profile';
            const eventType = EventType.Other;
            const messageType = MessageType.Profile;
            const resultHash = KitFilterHelper.hashEventMessage(eventName, eventType, messageType);
            expect(resultHash).toBe(-2033873516);
        });

        it('should hash event message for Commerce', () => {
            const eventName = 'Commerce';
            const eventType = EventType.Other;
            const messageType = MessageType.Commerce;
            const resultHash = KitFilterHelper.hashEventMessage(eventName, eventType, messageType);
            expect(resultHash).toBe(1381254798);
        });

        it('should hash event message for Media', () => {
            const eventName = 'Media';
            const eventType = EventType.Media;
            const messageType = MessageType.Media;
            const resultHash = KitFilterHelper.hashEventMessage(eventName, eventType, messageType);
            expect(resultHash).toBe(-1667658999);
        });

        it('should hash event message for UserAttributeChange', () => {
            const eventName = 'User Attribute Change';
            const eventType = EventType.Other;
            const messageType = MessageType.UserAttributeChange;
            const resultHash = KitFilterHelper.hashEventMessage(eventName, eventType, messageType);
            expect(resultHash).toBe(775325143);
        });

        it('should hash event message for UserIdentityChange', () => {
            const eventName = 'User Identity Change';
            const eventType = EventType.Other;
            const messageType = MessageType.UserIdentityChange;
            const resultHash = KitFilterHelper.hashEventMessage(eventName, eventType, messageType);
            expect(resultHash).toBe(161212270);
        });

    });

    describe('#hashEventAttributeKey', () => {
        it('should hash event attribute key', () => {
            const eventType = EventType.Navigation;
            const eventName :string = 'foo-event-name';
            const customAttributeName: string = 'event-attribute-key';

            const resultHash = KitFilterHelper.hashEventAttributeKey(eventType, eventName, customAttributeName);

            const expectedHash = 683216453;

            expect(resultHash).toBe(expectedHash);
        });
    });

    describe('#hashUserAttribute', () => {
        it('should hash user attributey', () => {
            const userAttribute: string = 'foo-value';

            const resultHash = KitFilterHelper.hashUserAttribute(userAttribute);

            const expectedHash = 1630602666;

            expect(resultHash).toBe(expectedHash);
        });
    });

    describe('#hashUserIdentity', () => {
        // User Identities are not actually hashed, this method is named this way to
        // be consistent with the filter class. UserIdentityType is also a number
        it('should hash user identity - Other', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.Other);
            const expectedHash = 0;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - CustomerId', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.CustomerId);
            const expectedHash = 1;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - Facebook', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.Facebook);
            const expectedHash = 2;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - Twitter', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.Twitter);
            const expectedHash = 3;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - Google', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.Google);
            const expectedHash = 4;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - Microsoft', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.Microsoft);
            const expectedHash = 5;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - Yahoo', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.Yahoo);
            const expectedHash = 6;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - Email', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.Email);
            const expectedHash = 7;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - FacebookCustomAudienceId', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.FacebookCustomAudienceId);
            const expectedHash = 9;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - Other2', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.Other2);
            const expectedHash = 10;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - Other3', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.Other3);
            const expectedHash = 11;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - Other4', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.Other4);
            const expectedHash = 12;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - Other5', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.Other5);
            const expectedHash = 13;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - Other6', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.Other6);
            const expectedHash = 14;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - Other7', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.Other7);
            const expectedHash = 15;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - Other8', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.Other8);
            const expectedHash = 16;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - Other9', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.Other9);
            const expectedHash = 17;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - Other10', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.Other10);
            const expectedHash = 18;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - MobileNumber', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.MobileNumber);
            const expectedHash = 19;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - PhoneNumber2', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.PhoneNumber2);
            const expectedHash = 20;

            expect(resultHash).toBe(expectedHash);
        });
        it('should hash user identity - PhoneNumber3', () => {
            const resultHash = KitFilterHelper.hashUserIdentity(IdentityType.PhoneNumber3);
            const expectedHash = 21;

            expect(resultHash).toBe(expectedHash);
        });
    });

    describe('#hashGDPRPurpose', () => {
        it('should hash GDPR Purpose', () => {
            const GDPRConsentHashPrefix: string = '1';
            const GDPRPurpose = 'Marketing';
            const resultHash = KitFilterHelper.hashConsentPurpose(GDPRConsentHashPrefix, GDPRPurpose);
            const expectedHash = -1972997867;

            expect(resultHash).toBe(expectedHash);
        });
    });

    describe('#hashCCPA', () => {
        it('should hash CCPA', () => {
            const CCPAHashPrefix: string = '2';
            const resultHash = KitFilterHelper.hashConsentPurpose(CCPAHashPrefix, CCPAPurpose);
            const expectedHash = -575335347;

            expect(resultHash).toBe(expectedHash);
        });
    });

    describe('#hashAttributeConditionalForwarding', () => {
        it('should hash event attribute key for forwarding', () => {
            const eventAttributeKey :string = 'foo-key';

            const resultHash = KitFilterHelper.hashAttributeConditionalForwarding(eventAttributeKey);

            const expectedHash = "-682111784";

            expect(resultHash).toBe(expectedHash);
        });

        it('should hash user attribute key for forwarding', () => {
            const userAttributeKey :string = 'foo-key';

            const resultHash = KitFilterHelper.hashAttributeConditionalForwarding(userAttributeKey);

            const expectedHash = "-682111784";

            expect(resultHash).toBe(expectedHash);
        });
    });

    describe('#hashConsentPurposeConditionalForwarding', () => {
        it('should hash GDPR consent for conditional forwarding', () => {
            const GDPRConsentHashPrefix: string = '1';
            const GDPRPurpose = 'Marketing';
            const resultHash = KitFilterHelper.hashConsentPurposeConditionalForwarding(GDPRConsentHashPrefix, GDPRPurpose);
            const expectedHash = "-1972997867";
            
            expect(resultHash).toBe(expectedHash);
        });

        it('should hash CCPA for conditional forwarding', () => {
            const CCPAHashPrefix: string = '2';
            const resultHash = KitFilterHelper.hashConsentPurposeConditionalForwarding(CCPAHashPrefix, CCPAPurpose);
            const expectedHash = "-575335347";

            expect(resultHash).toBe(expectedHash);
        });
    });

    describe('#filterUserAttributes', () => {
        it('should return the original user attributes if no filter list is provided', () => {
            const userAttributes = {
                'foo-key': 'foo-value',
                'bar-key': 'bar-value',
                'baz-key': 'baz-value',
            };

            const result = KitFilterHelper.filterUserAttributes(userAttributes, []);

            expect(result).toEqual(userAttributes);
        });

        it('should filter user attributes', () => {
            const userAttributes = {
                'foo-key': 'foo-value',
                'bar-key': 'bar-value',
                'baz-key': 'baz-value',
            };

            const fooFilter = KitFilterHelper.hashUserAttribute('foo-key');
            const barFilter = KitFilterHelper.hashUserAttribute('bar-key');

            const result = KitFilterHelper.filterUserAttributes(userAttributes, [
                fooFilter,
                barFilter,
            ]);

            expect(result).toEqual({
                'baz-key': 'baz-value',
            });
        });
    });

    describe('#filterUserIdentities', () => {
        it('should return the original user identities if no filter list is provided', () => {
            const userIdentities = {
                'other': 'foo-value',
                'customerid': 'bar-value',
                'facebook': 'baz-value',
            };

            const result = KitFilterHelper.filterUserIdentities(userIdentities, []);

            expect(result).toEqual(userIdentities);
        });

        it('should filter user identities', () => {
            const userIdentities = {
                'other': 'foo-value',
                'customerid': 'bar-value',
                'facebook': 'baz-value',
            };

            const fooFilter = KitFilterHelper.hashUserIdentity(IdentityType.Other);
            const barFilter = KitFilterHelper.hashUserIdentity(IdentityType.CustomerId);

            const result = KitFilterHelper.filterUserIdentities(userIdentities, [
                fooFilter,
                barFilter,
            ]);

            expect(result).toEqual({
                'facebook': 'baz-value',
            });
        });
    });

    describe('#isFilteredUserAttribute', () => {
        it('should return true if the user attribute is filtered', () => {
            const userAttributeKey = 'foo-key';
            const filterList = [KitFilterHelper.hashUserAttribute(userAttributeKey)];

            const result = KitFilterHelper.isFilteredUserAttribute(userAttributeKey, filterList);

            expect(result).toBe(true);
        });

        it('should return false if the user attribute is not filtered', () => {
            const userAttributeKey = 'foo-key';
            const filterList = [];

            const result = KitFilterHelper.isFilteredUserAttribute(userAttributeKey, filterList);

            expect(result).toBe(false);
        });
    });
});