import KitFilterHelper from "../../src/kitFilterHelper";
import { EventTypeEnum, IdentityType } from "../../src/types.interfaces";
import Constants from '../../src/constants';
const { CCPAPurpose } = Constants;


describe('FilterHashingUtilities', () => {
    describe('#hashEventType', () => {
        it('should hash event type Unknown', () => {
            const eventTypeUnknownHash = KitFilterHelper.hashEventType(EventTypeEnum.Unknown);
            const expectedUnknownHash = 48;
            expect(eventTypeUnknownHash).toBe(expectedUnknownHash);
        });

        it('should hash event type Navigation', () => {
            const eventTypeNavigationHash = KitFilterHelper.hashEventType(EventTypeEnum.Navigation);
            const expectedNavigationHash = 49;

            expect(eventTypeNavigationHash).toBe(expectedNavigationHash);
        });

        it('should hash event type Location', () => {
            const eventTypeLocationHash = KitFilterHelper.hashEventType(EventTypeEnum.Location);
            const expectedLocationHash = 50;

            expect(eventTypeLocationHash).toBe(expectedLocationHash);
        });

        it('should hash event type Search', () => {
            const eventTypeSearchHash = KitFilterHelper.hashEventType(EventTypeEnum.Search);
            const expectedSearchHash = 51;

            expect(eventTypeSearchHash).toBe(expectedSearchHash);
        });

        it('should hash event type Transaction', () => {
            const eventTypeTransactionHash = KitFilterHelper.hashEventType(EventTypeEnum.Transaction);
            const expectedTransactionHash = 52;

            expect(eventTypeTransactionHash).toBe(expectedTransactionHash);
        });

        it('should hash event type UserContent', () => {
            const eventTypeUserContentHash = KitFilterHelper.hashEventType(EventTypeEnum.UserContent);
            const expectedUserContentHash = 53;

            expect(eventTypeUserContentHash).toBe(expectedUserContentHash);

        });

        it('should hash event type UserPreference', () => {
            const eventTypeUserPreferenceHash = KitFilterHelper.hashEventType(EventTypeEnum.UserPreference);
            const expectedUserPreferenceHash = 54;

            expect(eventTypeUserPreferenceHash).toBe(expectedUserPreferenceHash);

        });

        it('should hash event type Social', () => {
            const eventTypeSocialHash = KitFilterHelper.hashEventType(EventTypeEnum.Social);
            const expectedSocialHash = 55;

            expect(eventTypeSocialHash).toBe(expectedSocialHash);

        });

        it('should hash event type Other', () => {
            const eventTypeOtherHash = KitFilterHelper.hashEventType(EventTypeEnum.Other);
            const expectedOtherHash = 56;

            expect(eventTypeOtherHash).toBe(expectedOtherHash);

        });

        it('should hash event type Media', () => {
            const eventTypeMediaHash = KitFilterHelper.hashEventType(EventTypeEnum.Media);
            const expectedMediaHash = 57;

            expect(eventTypeMediaHash).toBe(expectedMediaHash);

        });
    });

    describe('#hashEventName', () => {
        const eventName = 'foo-event-name';

        it('should hash event name with event type Unknown', () => {
            const eventTypeUnknownHash = KitFilterHelper.hashEventName(eventName, EventTypeEnum.Unknown);
            const expectedUnknownHash = -59445899;
            
            expect(eventTypeUnknownHash).toBe(expectedUnknownHash);
        });

        it('should hash event name with event type Navigation', () => {
            const eventTypeNavigationHash = KitFilterHelper.hashEventName(eventName, EventTypeEnum.Navigation);
            const expectedNavigationHash = 1448105910;
            

            expect(eventTypeNavigationHash).toBe(expectedNavigationHash);
        });

        it('should hash event name with event type Location', () => {
            const eventTypeLocationHash = KitFilterHelper.hashEventName(eventName, EventTypeEnum.Location);
            const expectedLocationHash = -1339309577;
            

            expect(eventTypeLocationHash).toBe(expectedLocationHash);
        });

        it('should hash event name with event type Search', () => {
            const eventTypeSearchHash = KitFilterHelper.hashEventName(eventName, EventTypeEnum.Search);
            const expectedSearchHash = 168242232;
            

            expect(eventTypeSearchHash).toBe(expectedSearchHash);
        });

        it('should hash event name with event type Transaction', () => {
            const eventTypeTransactionHash = KitFilterHelper.hashEventName(eventName, EventTypeEnum.Transaction);
            const expectedTransactionHash = 1675794041;
            

            expect(eventTypeTransactionHash).toBe(expectedTransactionHash);
        });

        it('should hash event name with event type UserContent', () => {
            const eventTypeUserContentHash = KitFilterHelper.hashEventName(eventName, EventTypeEnum.UserContent);
            const expectedUserContentHash = -1111621446;
            

            expect(eventTypeUserContentHash).toBe(expectedUserContentHash);

        });

        it('should hash event name with event type UserPreference', () => {
            const eventTypeUserPreferenceHash = KitFilterHelper.hashEventName(eventName, EventTypeEnum.UserPreference);
            const expectedUserPreferenceHash = 395930363;
            

            expect(eventTypeUserPreferenceHash).toBe(expectedUserPreferenceHash);

        });

        it('should hash event name with event type Social', () => {
            const eventTypeSocialHash = KitFilterHelper.hashEventName(eventName, EventTypeEnum.Social);
            const expectedSocialHash = 1903482172;
            

            expect(eventTypeSocialHash).toBe(expectedSocialHash);

        });

        it('should hash event name with event type Other', () => {
            const eventTypeOtherHash = KitFilterHelper.hashEventName(eventName, EventTypeEnum.Other);
            const expectedOtherHash = -883933315;
            

            expect(eventTypeOtherHash).toBe(expectedOtherHash);

        });

        it('should hash event name with event type Media', () => {
            const eventTypeMediaHash = KitFilterHelper.hashEventName(eventName, EventTypeEnum.Media);
            const expectedMediaHash = 623618494;

            expect(eventTypeMediaHash).toBe(expectedMediaHash);

        });
    });

    describe('#hashEventAttributeKey', () => {
        it('should hash event attribute key', () => {
            const eventType:EventTypeEnum = EventTypeEnum.Navigation;
            const eventName :string = 'foo-event-name';
            const customAttributeName: string = 'event-attribute-key';

            const resultHash = KitFilterHelper.hashEventAttributeKey(eventType, eventName, customAttributeName);

            const expectedHash = 683216453;

            expect(resultHash).toBe(expectedHash);
        });
    });

    describe('#hashUserAttribute', () => {
        it('should hash user attributey', () => {
            const userAttribute :string = 'foo-value';

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
});
