import { MPSideloadedKit } from "../../src/sideloadedKit";
import { EventTypeEnum, IdentityType } from "../../src/types.interfaces";
import Constants from '../../src/constants';
import { UnregisteredKit } from '../../src/forwarders.interfaces';
import { IKitFilterSettings } from '../../src/configAPIClient';
const { CCPAPurpose } = Constants;


const mockKitInstance: UnregisteredKit = {
    register: function() {}
};

describe('MPSideloadedKit', () => {
    let mpSideloadedKit: MPSideloadedKit;
    let filterDictionary: Partial<IKitFilterSettings>;

    beforeEach(()=> {
        mpSideloadedKit = new MPSideloadedKit(mockKitInstance)
        filterDictionary = mpSideloadedKit.filterDictionary;
    });

    describe('#addEventTypeFilter', () => {
        it('should add a hashed event type to eventTypeFilters', () => {
            const expectedResult = [48];
            mpSideloadedKit.addEventTypeFilter(EventTypeEnum.Unknown);
            expect(filterDictionary.eventTypeFilters).toEqual(expectedResult);
        });
    });

    describe('#addEventNameFilter', () => {
        it('should add a hashed event name to eventNameFilters', () => {
            const eventName = 'foo-event-name';
            const expectedResult = [-59445899];
            mpSideloadedKit.addEventNameFilter(EventTypeEnum.Unknown, eventName);
            expect(filterDictionary.eventNameFilters).toEqual(expectedResult);
        });
    });

    describe('#addEventAttributeFilter', () => {
        it('should add a hashed event attribute to attributeFilters', () => {
            const eventType: EventTypeEnum = EventTypeEnum.Navigation;
            const eventName: string = 'foo-event-name';
            const customAttributeName: string = 'event-attribute-key';

            const expectedResult = [683216453];
            mpSideloadedKit.addEventAttributeFilter(eventType, eventName, customAttributeName);
            expect(filterDictionary.attributeFilters).toEqual(expectedResult);
        });
    });

    describe('#addScreenNameFilter', () => {
        it('should add a hashed screen name to screenNameFilters', () => {
            const screenName: string = 'foo-event-name';

            const expectedResult = [-59445899];
            mpSideloadedKit.addScreenNameFilter(screenName);
            expect(filterDictionary.screenNameFilters).toEqual(expectedResult);
        });
    });

    describe('#addScreenAttributeFilter', () => {
        it('should add a hashed screen view attribute to screenAttributeFilters', () => {
            const screenName: string = 'foo-screen-name';
            const screenAttribute: string = 'foo-screen-attr';
            const expectedResult = [-350541578];
            mpSideloadedKit.addScreenAttributeFilter(screenName, screenAttribute);
            expect(filterDictionary.screenAttributeFilters).toEqual(expectedResult);
        });
    });

    describe('#addUserIdentityFilter', () => {
        it('should add a hashed user identity to identityFilters', () => {
            const otherIdentityType = IdentityType.Other;
            const expectedResult = [0];

            mpSideloadedKit.addUserIdentityFilter(otherIdentityType);
            expect(filterDictionary.userIdentityFilters).toEqual(expectedResult);
        });
    });

    describe('#addUserAttributeFilter', () => {
        it('should add a hashed user attribute to userAttributeFilters', () => {
            const userAttributeKey: string = 'foo-key';
            const expectedResult = [-682111784];
            mpSideloadedKit.addUserAttributeFilter(userAttributeKey);
            expect(filterDictionary.userAttributeFilters).toEqual(expectedResult);
        });
    });
});
