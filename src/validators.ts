import Types from './types';
import {
    isFunction,
    isNumber,
    isObject,
    isStringOrNumber,
    valueof,
} from './utils';
import Constants from './constants';
import { IdentityApiData } from '@mparticle/web-sdk';
import { IdentityAPIMethod } from './identity.interfaces';

type ValidationIdentitiesReturn = {
    valid: boolean;
    error?: valueof<typeof Constants.Messages.ValidationMessages>;
};

const { Modify } = Constants.IdentityMethods;

const Validators = {
    // From ./utils
    // Utility Functions for backwards compatability
    isNumber,
    isFunction,
    isStringOrNumber,

    // Validator Functions
    isValidAttributeValue: function(value: any): boolean {
        return value !== undefined && !isObject(value) && !Array.isArray(value);
    },

    // Validator Functions
    // Neither null nor undefined can be a valid Key
    isValidKeyValue: function(key: any): boolean {
        return Boolean(
            key &&
                !isObject(key) &&
                !Array.isArray(key) &&
                !this.isFunction(key)
        );
    },

    removeFalsyIdentityValues: function (
        identityApiData: IdentityApiData,
        logger: any
    ): IdentityApiData {
        if (!identityApiData || !identityApiData.userIdentities) {
            return identityApiData;
        }

        const cleanedData = {} as IdentityApiData;
        const cleanedUserIdentities = { ...identityApiData.userIdentities };

        for (const identityType in identityApiData.userIdentities) {
            if (identityApiData.userIdentities.hasOwnProperty(identityType)) {
                const value = identityApiData.userIdentities[identityType];

                // Check if value is falsy (undefined, false, 0, '', etc.) but not null
                if (value !== null && !value) {
                    logger.warning(
                        `Identity value for '${identityType}' is falsy (${value}). This value will be removed from the request.`
                    );
                    delete cleanedUserIdentities[identityType];
                }
            }
        }

        cleanedData.userIdentities = cleanedUserIdentities;

        return cleanedData;
    },

    validateIdentities: function (
        identityApiData: IdentityApiData,
        method?: IdentityAPIMethod
    ): ValidationIdentitiesReturn {
        var validIdentityRequestKeys = {
            userIdentities: 1,
            onUserAlias: 1,
            copyUserAttributes: 1,
        };
        if (identityApiData) {
            if (method === Modify) {
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
