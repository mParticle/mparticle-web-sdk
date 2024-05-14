import { IdentityType } from './types.interfaces';

export interface IIdentityType {
    getIdentityType(identityType: string): IdentityType | null;
}
