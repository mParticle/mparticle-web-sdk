import { MPID, User } from '@mparticle/web-sdk';
import { IMParticleComponent } from '../core/component';
import { Context } from '@mparticle/event-models';
import { Mediator } from '../core/mediator';

export interface IdentityApiResult {
    user: User;
    previousUser: User;

    getUser(): User;
    getPreviousUser(): User;
}

export enum MParticleClientErrorCodes {
    noHttpCoverage = -1,
    activeIdentityRequest = -2,
    activeSession = -3,
    validationIssue = -4,
    nativeIdentityRequest = -5,
    loggingDisabledOrMissingAPIKey = -6,
}

export enum MParticleHttpErrorCodes {
    badRequest = 400,
    forbidden = 401,
    tooManyRequests = 429,
    serverError = 500,
}

export interface IdentityAPIServerErrorResult {
    errorCode: MParticleClientErrorCodes;
}

export interface IdentityAPIHttpErrorResult {
    errorCode: number;
}

export type IMPIdentityApiResponse =
    | IdentityApiResult
    | IdentityAPIHttpErrorResult
    | IdentityAPIServerErrorResult;

// TODO: See if we can use a utility class to make this cleaner
interface IKnownIdentities {
    device_application_stamp: string;
    other?: string;
    customerid?: string;
    facebook?: string;
    twitter?: string;
    google?: string;
    microsoft?: string;
    yahoo?: string;
    email?: string;
    facebookcustomaudienceid?: string;
    other2?: string;
    other3?: string;
    other4?: string;
    other5?: string;
    other6?: string;
    other7?: string;
    other8?: string;
    other9?: string;
    other10?: string;
    phone_number_2?: string;
    phone_number_3?: string;
    mobile_number?: string;
}

export interface IdentityApiRequest {
    client_sdk: {
        platform: string;
        sdk_vendor: string;
        sdk_version: string;
    };
    context: Context;
    environment: 'development' | 'production';
    request_id: string;
    request_timestamp_ms: number;
    previous_mpid: MPID | null;
    known_identities: IKnownIdentities;
}

export interface IMParticleIdentity extends IMParticleComponent {
    login(request: IdentityApiRequest): Promise<IMPIdentityApiResponse>;
    logout(request: IdentityApiRequest): Promise<IMPIdentityApiResponse>;
    getUser(mpid: MPID): Promise<User>;
    getUsers(): Promise<User[]>;
}

export interface InternalIdentity extends IMParticleIdentity {
    login(request: IdentityApiRequest): Promise<IMPIdentityApiResponse>;
    logout(request: IdentityApiRequest): Promise<IMPIdentityApiResponse>;
    modify(request: IdentityApiRequest): Promise<IMPIdentityApiResponse>;
    identify(request: IdentityApiRequest): Promise<IMPIdentityApiResponse>;
}

export interface IdentityListener {}

export class IdentityImplementation implements InternalIdentity {
    private mediator: Mediator = null;

    constructor(mediator: Mediator) {
        this.mediator = mediator;
    }

    // TODO: Temporary implementation to test signature
    private generateFakeAPIResult = (): IMPIdentityApiResponse => ({
        user: null,
        previousUser: null,
        getUser: () => {
            return null;
        },
        getPreviousUser: () => {
            return null;
        },
    });

    public identify(
        request: IdentityApiRequest
    ): Promise<IMPIdentityApiResponse> {
        return Promise.resolve(this.generateFakeAPIResult());
    }

    public modify(
        request: IdentityApiRequest
    ): Promise<IMPIdentityApiResponse> {
        // FIXME: Forcing a rejected promise for demonstration purposes
        //        This should be replaced with a real implementation eventually
        return Promise.reject({
            errorCode: MParticleClientErrorCodes.activeSession,
        });
    }

    public logout(
        request: IdentityApiRequest
    ): Promise<IMPIdentityApiResponse> {
        return Promise.resolve(this.generateFakeAPIResult());
    }

    public login(request: IdentityApiRequest): Promise<IMPIdentityApiResponse> {
        return Promise.resolve(this.generateFakeAPIResult());
    }

    public getUser(mpid: string): Promise<User> {
        return Promise.resolve(null);
    }

    public getUsers(): Promise<User[]> {
        return Promise.resolve(null);
    }
}
