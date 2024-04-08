import { IdentityType } from './types.interfaces';
import { parseNumber } from './utils';

export interface IIdentitiesByType {
    [key: number]: string;
}

export function getNewIdentitiesByName(newIdentitiesByType: IIdentitiesByType) {
    const newIdentitiesByName = {};

    for (var key in newIdentitiesByType) {
        const identityNameKey = getIdentityName(parseNumber(key));
        newIdentitiesByName[identityNameKey] = newIdentitiesByType[key];
    }

    return newIdentitiesByName;
}

export function getIdentityName(identityType: IdentityType): string | null {
    switch (identityType) {
        case IdentityType.Other:
            return 'other';
        case IdentityType.CustomerId:
            return 'customerid';
        case IdentityType.Facebook:
            return 'facebook';
        case IdentityType.Twitter:
            return 'twitter';
        case IdentityType.Google:
            return 'google';
        case IdentityType.Microsoft:
            return 'microsoft';
        case IdentityType.Yahoo:
            return 'yahoo';
        case IdentityType.Email:
            return 'email';
        case IdentityType.FacebookCustomAudienceId:
            return 'facebookcustomaudienceid';
        case IdentityType.Other2:
            return 'other2';
        case IdentityType.Other3:
            return 'other3';
        case IdentityType.Other4:
            return 'other4';
        case IdentityType.Other5:
            return 'other5';
        case IdentityType.Other6:
            return 'other6';
        case IdentityType.Other7:
            return 'other7';
        case IdentityType.Other8:
            return 'other8';
        case IdentityType.Other9:
            return 'other9';
        case IdentityType.Other10:
            return 'other10';
        case IdentityType.MobileNumber:
            return 'mobile_number';
        case IdentityType.PhoneNumber2:
            return 'phone_number_2';
        case IdentityType.PhoneNumber3:
            return 'phone_number_3';
        default:
            return null;
    }
}
