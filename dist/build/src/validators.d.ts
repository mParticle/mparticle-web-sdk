import Constants from './constants';
import { IdentityApiData } from '@mparticle/web-sdk';
import { valueof } from './utils';
declare type IdentityAPIMethod = 'login' | 'logout' | 'identify' | 'modify';
declare type ValidationIdentitiesReturn = {
    valid: boolean;
    error?: valueof<typeof Constants.Messages.ValidationMessages>;
};
declare const Validators: {
    isValidAttributeValue: (value: any) => boolean;
    isValidKeyValue: (key: any) => boolean;
    isStringOrNumber: (value: any) => boolean;
    isNumber: (value: any) => boolean;
    isFunction: (fn: any) => boolean;
    validateIdentities: (identityApiData: IdentityApiData, method?: IdentityAPIMethod) => ValidationIdentitiesReturn;
};
export default Validators;
