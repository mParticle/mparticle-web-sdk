import Types from './types';
import Constants from './constants';
import * as utils from './utils';
import Validators from './validators';
import KitFilterHelper from './kitFilterHelper';
import { IMParticleWebSDKInstance } from './mp-instance';
import { SDKHelpersApi } from './sdkRuntimeModels';
import { Dictionary } from './utils';
import { IMParticleUser } from './identity-user-interfaces';
import { MPID } from '@mparticle/web-sdk';

const StorageNames = Constants.StorageNames;

export default function Helpers(
    this: SDKHelpersApi,
    mpInstance: IMParticleWebSDKInstance
): void {
    const self = this;
    this.canLog = function(): boolean {
        if (
            mpInstance._Store.isEnabled &&
            (mpInstance._Store.devToken ||
                mpInstance._Store.webviewBridgeEnabled)
        ) {
            return true;
        }

        return false;
    };

    this.getFeatureFlag = function(feature: string): boolean | string | null {
        if (mpInstance._Store.SDKConfig.flags.hasOwnProperty(feature)) {
            return mpInstance._Store.SDKConfig.flags[feature];
        }
        return null;
    };

    this.invokeCallback = function(
        callback: Function,
        code: number,
        body: string,
        mParticleUser?: IMParticleUser,
        previousMpid?: MPID
    ): void {
        if (!callback) {
            mpInstance.Logger.warning('There is no callback provided');
        }
        try {
            if (self.Validators.isFunction(callback)) {
                callback({
                    httpCode: code,
                    body: body,
                    getUser: function() {
                        if (mParticleUser) {
                            return mParticleUser;
                        } else {
                            return mpInstance.Identity.getCurrentUser();
                        }
                    },
                    getPreviousUser: function() {
                        if (!previousMpid) {
                            const users = mpInstance.Identity.getUsers();
                            const mostRecentUser = users.shift();
                            const currentUser =
                                mParticleUser ||
                                mpInstance.Identity.getCurrentUser();
                            if (
                                mostRecentUser &&
                                currentUser &&
                                mostRecentUser.getMPID() ===
                                    currentUser.getMPID()
                            ) {
                                return users.shift() || null;
                            }
                            return mostRecentUser || null;
                        } else {
                            return mpInstance.Identity.getUser(previousMpid);
                        }
                    },
                });
            }
        } catch (e) {
            mpInstance.Logger.error(
                'There was an error with your callback: ' + e
            );
        }
    };

    this.invokeAliasCallback = function(
        callback: Function,
        code: number,
        message?: string
    ): void {
        if (!callback) {
            mpInstance.Logger.warning('There is no callback provided');
        }
        try {
            if (self.Validators.isFunction(callback)) {
                const callbackMessage: Dictionary = {
                    httpCode: code,
                };
                if (message) {
                    callbackMessage.message = message;
                }
                callback(callbackMessage);
            }
        } catch (e) {
            mpInstance.Logger.error(
                'There was an error with your callback: ' + e
            );
        }
    };

    this.extend = utils.extend;

    this.createServiceUrl = function(
        secureServiceUrl: string,
        devToken?: string
    ): string {
        const serviceScheme =
            window.mParticle && mpInstance._Store.SDKConfig.forceHttps
                ? 'https://'
                : window.location.protocol + '//';
        let baseUrl: string;
        if (mpInstance._Store.SDKConfig.forceHttps) {
            baseUrl = 'https://' + secureServiceUrl;
        } else {
            baseUrl = serviceScheme + secureServiceUrl;
        }
        if (devToken) {
            baseUrl = baseUrl + devToken;
        }
        return baseUrl;
    };

    this.createXHR = function(cb: () => void): XMLHttpRequest {
        let xhr: XMLHttpRequest;

        try {
            xhr = new window.XMLHttpRequest();
        } catch (e) {
            mpInstance.Logger.error('Error creating XMLHttpRequest object.');
        }

        if (xhr && cb && 'withCredentials' in xhr) {
            xhr.onreadystatechange = cb;
        } else if (typeof (window as Dictionary).XDomainRequest !== 'undefined') {
            mpInstance.Logger.verbose('Creating XDomainRequest object');

            try {
                xhr = new (window as Dictionary).XDomainRequest();
                xhr.onload = cb;
            } catch (e) {
                mpInstance.Logger.error('Error creating XDomainRequest object');
            }
        }

        return xhr;
    };

    this.filterUserIdentities = function(
        userIdentitiesObject: Dictionary<string>,
        filterList: number[]
    ): Array<{ Type: number; Identity: string }> {
        const filteredUserIdentities: Array<{ Type: number; Identity: string }> = [];

        if (userIdentitiesObject && Object.keys(userIdentitiesObject).length) {
            for (const userIdentityName in userIdentitiesObject) {
                if (userIdentitiesObject.hasOwnProperty(userIdentityName)) {
                    const userIdentityType = Types.IdentityType.getIdentityType(
                        userIdentityName
                    );
                    if (!self.inArray(filterList, userIdentityType)) {
                        const identity = {
                            Type: userIdentityType,
                            Identity: userIdentitiesObject[userIdentityName],
                        };
                        if (
                            userIdentityType === Types.IdentityType.CustomerId
                        ) {
                            filteredUserIdentities.unshift(identity);
                        } else {
                            filteredUserIdentities.push(identity);
                        }
                    }
                }
            }
        }

        return filteredUserIdentities;
    };

    this.filterUserIdentitiesForForwarders =
        KitFilterHelper.filterUserIdentities;
    this.filterUserAttributes = KitFilterHelper.filterUserAttributes;

    this.isEventType = function(type: number): boolean {
        for (const prop in Types.EventType) {
            if (Types.EventType.hasOwnProperty(prop)) {
                if (Types.EventType[prop] === type) {
                    return true;
                }
            }
        }
        return false;
    };

    this.sanitizeAttributes = function(
        attrs: Dictionary,
        name: string
    ): Dictionary<string> | null {
        if (!attrs || !self.isObject(attrs)) {
            return null;
        }

        const sanitizedAttrs: Dictionary<string> = {};

        for (const prop in attrs) {
            // Make sure that attribute values are not objects or arrays, which are not valid
            if (
                attrs.hasOwnProperty(prop) &&
                self.Validators.isValidAttributeValue(attrs[prop])
            ) {
                sanitizedAttrs[prop] = attrs[prop];
            } else {
                mpInstance.Logger.warning(
                    "For '" +
                        name +
                        "', the corresponding attribute value of '" +
                        prop +
                        "' must be a string, number, boolean, or null."
                );
            }
        }

        return sanitizedAttrs;
    };

    this.isDelayedByIntegration = function(
        delayedIntegrations: Dictionary<boolean>,
        timeoutStart: number,
        now: number
    ): boolean {
        if (
            now - timeoutStart >
            mpInstance._Store.SDKConfig.integrationDelayTimeout
        ) {
            return false;
        }
        for (const integration in delayedIntegrations) {
            if (delayedIntegrations[integration] === true) {
                return true;
            } else {
                continue;
            }
        }
        return false;
    };

    this.createMainStorageName = function(workspaceToken: string): string {
        if (workspaceToken) {
            return StorageNames.currentStorageName + '_' + workspaceToken;
        } else {
            return StorageNames.currentStorageName;
        }
    };

    // TODO: Refactor SDK to directly use these methods
    // https://go.mparticle.com/work/SQDSDKS-5239
    // Utility Functions
    this.converted = utils.converted;
    this.findKeyInObject = utils.findKeyInObject;
    this.parseNumber = utils.parseNumber;
    this.inArray = utils.inArray;
    this.isObject = utils.isObject;
    this.decoded = utils.decoded;
    this.parseStringOrNumber = utils.parseStringOrNumber;
    this.generateHash = utils.generateHash;
    this.generateUniqueId = utils.generateUniqueId;

    // Imported Validators
    this.Validators = Validators;
}
