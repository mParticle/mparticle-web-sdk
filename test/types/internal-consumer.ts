/**
 * Package contract smoke test for the internal `@mparticle/web-sdk/internal`
 * entry point.
 *
 * This file is compiled against generated declarations in `dist/types`, not
 * source files, so it catches publish-shape regressions for kits and other
 * mParticle-owned integrations. The internal entry point should expose kit
 * implementation contracts and re-export public types for one-path internal
 * consumption.
 */

import type {
    Batch,
    ConfiguredKit,
    IKitFilterSettings,
    IRoktKit,
    KitInterface,
    SDKInitConfig,
    SDKEvent,
    UserIdentities,
} from '@mparticle/web-sdk/internal';

const filters: IKitFilterSettings = {
    attributeFilters: [],
    consentRegulationFilters: [],
    consentRegulationPurposeFilters: [],
    eventNameFilters: [],
    eventTypeFilters: [],
    messageTypeFilters: [],
    messageTypeStateFilters: [],
    screenAttributeFilters: [],
    screenNameFilters: [],
    userAttributeFilters: [],
    userIdentityFilters: [],
};

const kit: KitInterface = {
    id: 123,
    name: 'Type Test Kit',
    init(settings, service, testMode, trackerId, userAttributes) {
        void settings;
        void service;
        void testMode;
        void trackerId;
        void userAttributes;
        return 'initialized';
    },
    process(event: SDKEvent) {
        return event.EventName;
    },
    processBatch(batch: Batch) {
        return String(batch.events?.length ?? 0);
    },
    setUserIdentity(id, type) {
        void id;
        void type;
    },
};

const configuredKit = {} as ConfiguredKit;
const event = {} as SDKEvent;

const forwarderResult: void = kit.setUserIdentity?.('user-id', 1);
const roktKit = {} as IRoktKit;
const identities: UserIdentities = {
    email: 'name@example.com',
};
const config: SDKInitConfig = {
    isDevelopmentMode: true,
};

void filters;
void configuredKit;
void event;
void forwarderResult;
void roktKit;
void identities;
void config;
