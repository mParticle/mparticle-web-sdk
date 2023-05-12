import MPSideloadedKit, { IMPSideloadedKit } from "../../src/sideloadedKit";
import { IMPSideloadedKitConstructor } from "../../src/sideloadedKit";
import { EventTypeEnum, IdentityType } from "../../src/types.interfaces";
import { UnregisteredKit } from '../../src/forwarders.interfaces';
import { IKitFilterSettings } from '../../src/configAPIClient';
import { mParticle } from "../src/config";

const mockKitInstance: UnregisteredKit = {
    register: function() {},
    name: 'foo-unregistered-kit'
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

    describe('#MPSideloadedKit Integration Tests', () => {
        // https://stackoverflow.com/questions/13407036/how-does-interfaces-with-construct-signatures-work
        function makeMPSideloadedKit(n: IMPSideloadedKitConstructor) {
            return new n(mockKitInstance);
        }
        it('should create a new MPSideloadedKit instance from the global mParticle object', () => {
            const sampleSideloadedKit = makeMPSideloadedKit(MPSideloadedKit);

            expect(sampleSideloadedKit).toHaveProperty('addEventAttributeFilter');
            expect(sampleSideloadedKit).toHaveProperty('addEventTypeFilter');
            expect(sampleSideloadedKit).toHaveProperty('addEventNameFilter');
            expect(sampleSideloadedKit).toHaveProperty('addEventAttributeFilter');
            expect(sampleSideloadedKit).toHaveProperty('addScreenNameFilter');
            expect(sampleSideloadedKit).toHaveProperty('addScreenAttributeFilter');
            expect(sampleSideloadedKit).toHaveProperty('addUserIdentityFilter');
            expect(sampleSideloadedKit).toHaveProperty('addUserAttributeFilter');
            expect(sampleSideloadedKit).toHaveProperty('filterDictionary');
            expect(sampleSideloadedKit).toHaveProperty('kitInstance');
        });

        // For this test to pass, we need to mock http requests in jest
        // it.only('should add sideloaded kits to the active forwarders', function() {
        //     const unregisteredSideloadedKitInstance1: IMockSideloadedKit = new MockSideloadedKit('SideloadedKit1', 1);
        //     const unregisteredSideloadedKitInstance2: IMockSideloadedKit = new MockSideloadedKit('SideloadedKit2', 2);

        //     const mpsideloadedKit1 = new MPSideloadedKit(unregisteredSideloadedKitInstance1);
        //     const mpsideloadedKit2 = new MPSideloadedKit(unregisteredSideloadedKitInstance2);
        //     const sideloadedKits = [mpsideloadedKit1, mpsideloadedKit2];
        //     window.mParticle.config.sideloadedKits = sideloadedKits;
        //     // console.log(window.mParticle.config.sideloadedKits);
        //     window.mParticle.config.requestConfig = false;
        //     mParticle.init(apiKey, window.mParticle.config);

        //     const activeForwarders: MPForwarder = mParticle.getInstance()._getActiveForwarders();
            
        //     expect(activeForwarders.length, 'active forwarders length').toEqual(sideloadedKits.length);
        //     expect(activeForwarders[0].name, '1st active forwarder ').toEqual(mpsideloadedKit1.kitInstance.name);
        //     expect(activeForwarders[0].name, '1st active forwarder ').toEqual(mpsideloadedKit2.kitInstance.name);
        // });
    });
});
