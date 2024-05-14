export enum EventTypeEnum {
    Unknown,
    Navigation,
    Location,
    Search,
    Transaction,
    UserContent,
    UserPreference,
    Social,
    Other,
    Media,
}

// TODO: https://mparticle-eng.atlassian.net/browse/SQDSDKS-5403
export enum MessageType {
    SessionStart = 1,
    SessionEnd = 2,
    PageView = 3,
    PageEvent = 4,
    CrashReport = 5,
    OptOut = 6,
    AppStateTransition = 10,
    Profile = 14,
    Commerce = 16,
    UserAttributeChange = 17,
    UserIdentityChange = 18,
    Media = 20,
};

export enum IdentityType {
    Other = 0,
    CustomerId = 1,
    Facebook = 2,
    Twitter = 3,
    Google = 4,
    Microsoft = 5,
    Yahoo = 6,
    Email = 7,
    FacebookCustomAudienceId = 9,
    Other2 = 10,
    Other3 = 11,
    Other4 = 12,
    Other5 = 13,
    Other6 = 14,
    Other7 = 15,
    Other8 = 16,
    Other9 = 17,
    Other10 = 18,
    MobileNumber = 19,
    PhoneNumber2 = 20,
    PhoneNumber3 = 21,
}

export interface IIdentityType {
    getIdentityType(identityType: string): IdentityType | null;
}
