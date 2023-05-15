import { MPConfiguration } from "@mparticle/web-sdk";
import { UnregisteredKit } from "../../src/forwarders.interfaces";
import { SDKInitConfig } from "../../src/sdkRuntimeModels";

// export interface IMockForwarder {

// }

// export interface IMockForwarderConstructor {
//     new(unregisteredKitInstance: MockForwarder): IMockForwarder;
// }

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

    public register = (config: SDKInitConfig): void => {
        if (config.kits) {
            config.kits[this.name] = {
                constructor: this.constructor,
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
        // mParticle.userAttributesFilterOnInitTest = userAttributes;
        // mParticle.userIdentitiesFilterOnInitTest = userIdentities;
    })
}

// export const MockForwarder = function(forwarderName, forwarderId) {
        // var constructor = function() {
        //     var self = this;
        //     this.id = forwarderId || 1;
        //     this.initCalled = false;
        //     this.processCalled = false;
        //     this.setUserIdentityCalled = false;
        //     this.onUserIdentifiedCalled = false;
        //     this.setOptOutCalled = false;
        //     this.setUserAttributeCalled = false;
        //     this.reportingService = null;
        //     this.name = forwarderName || 'MockForwarder';
        //     this.userAttributeFilters = [];
        //     this.setUserIdentityCalled = false;
        //     this.removeUserAttributeCalled = false;
        //     this.receivedEvent = null;
        //     this.isVisible = false;
        //     this.logOutCalled = false;

        //     this.trackerId = null;
        //     this.userAttributes = {};
        //     this.userIdentities = null;
        //     this.appVersion = null;
        //     this.appName = null;

        //     this.logOut = function() {
        //         this.logOutCalled = true;
        //     };

        //     this.init = function(
        //         settings,
        //         reportingService,
        //         testMode,
        //         id,
        //         userAttributes,
        //         userIdentities,
        //         appVersion,
        //         appName
        //     ) {
        //         self.reportingService = reportingService;
        //         self.initCalled = true;

        //         self.trackerId = id;
        //         self.userAttributes = userAttributes;
        //         mParticle.userAttributesFilterOnInitTest = userAttributes;
        //         mParticle.userIdentitiesFilterOnInitTest = userIdentities;
        //         self.userIdentities = userIdentities;
        //         self.appVersion = appVersion;
        //         self.appName = appName;
        //         self.settings = settings;
        //         self.testMode = testMode;
        //     };

        //     this.process = function(event) {
        //         self.processCalled = true;
        //         this.receivedEvent = event;
        //         self.reportingService(self, event);
        //         self.logger.verbose(event.EventName + ' sent');
        //     };

        //     this.setUserIdentity = function(a, b) {
        //         this.userIdentities = {};
        //         this.userIdentities[b] = a;
        //         self.setUserIdentityCalled = true;
        //     };

        //     this.settings = {
        //         PriorityValue: 1,
        //     };

        //     this.setOptOut = function() {
        //         this.setOptOutCalled = true;
        //     };

        //     this.onUserIdentified = function(user) {
        //         this.onUserIdentifiedCalled = true;
        //         this.onUserIdentifiedUser = user;
        //     };

        //     this.onIdentifyComplete = function(user) {
        //         this.onIdentifyCompleteCalled = true;
        //         this.onIdentifyCompleteUser = user;
        //     };

        //     this.onLoginComplete = function(user) {
        //         this.onLoginCompleteCalled = true;
        //         this.onLoginCompleteUser = user;
        //     };

        //     this.onLogoutComplete = function(user) {
        //         this.onLogoutCompleteCalled = true;
        //         this.onLogoutCompleteUser = user;
        //     };

        //     this.onModifyComplete = function(user) {
        //         this.onModifyCompleteCalled = true;
        //         this.onModifyCompleteUser = user;
        //     };

        //     this.setUserAttribute = function(key, value) {
        //         this.setUserAttributeCalled = true;
        //         this.userAttributes[key] = value;
        //     };

        //     this.removeUserAttribute = function(key) {
        //         this.removeUserAttributeCalled = true;
        //         delete this.userAttributes[key]
        //     };

        //     window[this.name + this.id] = {
        //         instance: this,
        //     };
        // };
export const MockSideloadedKit = MockForwarder;

export interface IMockSideloadedKit extends MockForwarder {

}

export interface IMockSideloadedKitConstructor {
    new(unregisteredKitInstance: UnregisteredKit): IMockSideloadedKit;
}