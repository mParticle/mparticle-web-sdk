import Types from './types';
import { isObject } from './utils';
import Constants from './constants';
import { IdentityApiData } from '@mparticle/web-sdk';
import { valueof } from './utils';

type IdentityAPIMethod = 'login' | 'logout' | 'identify' | 'modify';

type ValidationIdentitiesReturn = {
    valid: boolean;
    error?: valueof<typeof Constants.Messages.ValidationMessages>;
};

const Validators = {
    isValidAttributeValue: function(value: any): boolean {
        return value !== undefined && !isObject(value) && !Array.isArray(value);
    },

    // Neither null nor undefined can be a valid Key
    isValidKeyValue: function(key: any): boolean {
        return Boolean(
            key &&
                !isObject(key) &&
                !Array.isArray(key) &&
                !this.isFunction(key)
        );
    },

    isStringOrNumber: function(value: any): boolean {
        return typeof value === 'string' || typeof value === 'number';
    },

    isNumber: function(value: any): boolean {
        return typeof value === 'number';
    },

    isFunction: (fn: any): boolean => {
        return typeof fn === 'function';
    },

    validateIdentities: function(
        identityApiData: IdentityApiData,
        method?: IdentityAPIMethod
    ): ValidationIdentitiesReturn {
        var validIdentityRequestKeys = {
            userIdentities: 1,
            onUserAlias: 1,
            copyUserAttributes: 1,
        };
        if (identityApiData) {
            if (method === 'modify') {
                if (
                    (isObject(identityApiData.userIdentities) &&
                        !Object.keys(identityApiData.userIdentities).length) ||
                    !isObject(identityApiData.userIdentities)
                ) {
                    return {
                        valid: false,
                        error:
                            Constants.Messages.ValidationMessages
                                .ModifyIdentityRequestUserIdentitiesPresent,
                    };
                }
            }
            for (var key in identityApiData) {
                if (identityApiData.hasOwnProperty(key)) {
                    if (!validIdentityRequestKeys[key]) {
                        return {
                            valid: false,
                            error:
                                Constants.Messages.ValidationMessages
                                    .IdentityRequesetInvalidKey,
                        };
                    }
                    if (
                        key === 'onUserAlias' &&
                        !Validators.isFunction(identityApiData[key])
                    ) {
                        return {
                            valid: false,
                            error:
                                Constants.Messages.ValidationMessages
                                    .OnUserAliasType,
                        };
                    }
                }
            }
            if (Object.keys(identityApiData).length === 0) {
                return {
                    valid: true,
                };
            } else {
                // identityApiData.userIdentities can't be undefined
                if (identityApiData.userIdentities === undefined) {
                    return {
                        valid: false,
                        error:
                            Constants.Messages.ValidationMessages
                                .UserIdentities,
                    };
                    // identityApiData.userIdentities can be null, but if it isn't null or undefined (above conditional), it must be an object
                } else if (
                    identityApiData.userIdentities !== null &&
                    !isObject(identityApiData.userIdentities)
                ) {
                    return {
                        valid: false,
                        error:
                            Constants.Messages.ValidationMessages
                                .UserIdentities,
                    };
                }
                if (
                    isObject(identityApiData.userIdentities) &&
                    Object.keys(identityApiData.userIdentities).length
                ) {
                    for (var identityType in identityApiData.userIdentities) {
                        if (
                            identityApiData.userIdentities.hasOwnProperty(
                                identityType
                            )
                        ) {
                            if (
                                Types.IdentityType.getIdentityType(
                                    identityType
                                ) === false
                            ) {
                                return {
                                    valid: false,
                                    error:
                                        Constants.Messages.ValidationMessages
                                            .UserIdentitiesInvalidKey,
                                };
                            }
                            if (
                                !(
                                    typeof identityApiData.userIdentities[
                                        identityType
                                    ] === 'string' ||
                                    identityApiData.userIdentities[
                                        identityType
                                    ] === null
                                )
                            ) {
                                return {
                                    valid: false,
                                    error:
                                        Constants.Messages.ValidationMessages
                                            .UserIdentitiesInvalidValues,
                                };
                            }
                        }
                    }
                }
            }
        }
        return {
            valid: true,
        };
    },
};

export default Validators;
