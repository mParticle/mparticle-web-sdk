import { valueof } from './utils';
import Constants from './constants';
import { IdentityApiData } from '@mparticle/web-sdk';
import { IdentityAPIMethod } from './identity.interfaces';
type ValidationIdentitiesReturn = {
    valid: boolean;
    error?: valueof<typeof Constants.Messages.ValidationMessages>;
};
declare const Validators: {
    isNumber: (value: any) => boolean;
    isFunction: (fn: any) => boolean;
    isStringOrNumber: (value: any) => boolean;
    isValidAttributeValue: (value: any) => boolean;
    isValidKeyValue: (key: any) => boolean;
    removeFalsyIdentityValues: (identityApiData: IdentityApiData, logger: any) => IdentityApiData;
    validateIdentities: (identityApiData: IdentityApiData, method?: IdentityAPIMethod) => ValidationIdentitiesReturn;
};
export default Validators;
