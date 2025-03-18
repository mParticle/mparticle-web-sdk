import { KitRegistrationConfig, RegisteredKit, UnregisteredKit } from "../../src/forwarders.interfaces";

export class MockForwarder {
    public name: string;
    public moduleId: number;
    public initCalled: boolean = false;
    public processCalled: boolean = false;
    public setUserIdentityCalled: boolean = false;
    public onUserIdentifiedCalled: boolean = false;
    
    public setOptOutCalled: boolean = false;
    public setUserAttributeCalled: boolean = false;
    public reportingService = null;
    public userAttributeFilters = [];
    public removeUserAttributeCalled = false;
    public receivedEvent = null;
    public isVisible = false;
    public logOutCalled = false;
    public settings = {};
    public trackerId = null;
    public testMode = false;
    public userAttributes = {};
    public userIdentities = null;
    public appVersion = null;
    public appName = null;
    constructor(forwarderName?: string, id?: number) {
        this.name = forwarderName || 'MockFowarder';
        this.moduleId = id || 1;
    }

    public register = (config: KitRegistrationConfig): void => {
        if (config.kits) {
            config.kits[this.name] = {
                constructor: this.constructor as () => RegisteredKit,
            };
        }
    }

    public getId = (): number => {
        return this.moduleId;
    }

    public init = ((
        settings,
        reportingService,
        testMode,
        id,
        userAttributes,
        userIdentities,
        appVersion,
        appName
    ) => {
        this.reportingService = reportingService;
        this.initCalled = true;

        this.trackerId = id;
        this.userAttributes = userAttributes;
        this.userIdentities = userIdentities;
        this.appVersion = appVersion;
        this.appName = appName;
        this.settings = settings;
        this.testMode = testMode;
    })
}

export const MockSideloadedKit = MockForwarder;

export interface IMockSideloadedKit extends MockForwarder {}

export interface IMockSideloadedKitConstructor {
    new(unregisteredKitInstance: UnregisteredKit): IMockSideloadedKit;
}

export const deleteAllCookies = ():void => {
    document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    });
}