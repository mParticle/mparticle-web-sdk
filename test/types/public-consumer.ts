import mParticle, {
    type AllUserAttributes,
    type IdentityApiData,
    type IdentityCallback,
    type IdentifyRequest,
    type MPConfiguration,
    type MPID,
    type PrivacyConsentState,
    type SDKEventAttrs,
    type SDKEventCustomFlags,
    type SDKEventOptions,
    type SDKInitConfig,
    type SDKProduct,
    type TransactionAttributes,
    type UserIdentities,
} from '@mparticle/web-sdk';

// @ts-expect-error The package only exposes a default runtime export.
import { init } from '@mparticle/web-sdk';

const identities: UserIdentities = {
    customerid: 'customer-1',
    email: 'name@example.com',
    mobile_number: '+15555555555',
};

const identifyRequest: IdentifyRequest = {
    userIdentities: identities,
    copyUserAttributes: true,
};

const identityCallback: IdentityCallback = result => {
    const mpid: MPID | undefined =
        'mpid' in result.body ? result.body.mpid : undefined;
    const user = result.getUser();
    const attrs: AllUserAttributes = user.getAllUserAttributes();

    user.setUserTag('vip', true);
    user.setUserAttribute('age', 42);
    user.setUserAttributeList('plans', ['basic', 'premium']);
    user.setConsentState(mParticle.Consent.createConsentState());

    void mpid;
    void attrs;
};

const config: SDKInitConfig = {
    appName: 'Type Test App',
    appVersion: '1.2.3',
    dataPlan: {
        planId: 'web-plan',
        planVersion: 2,
    },
    dataPlanOptions: {
        dataPlanVersion: {
            version: 2,
        },
        blockUserAttributes: true,
        blockEventAttributes: true,
        blockEvents: false,
        blockUserIdentities: false,
    },
    identityCallback,
    identifyRequest,
    integrationDelayTimeout: 500,
    isDevelopmentMode: true,
    launcherOptions: {
        noFunctional: false,
        noTargeting: true,
    },
    logLevel: 'error',
    requestConfig: false,
    workspaceToken: 'workspace-token',
};

const legacyConfig: MPConfiguration = {
    appName: 'Legacy Config Shape',
    customFlags: {
        bool: true,
        list: ['a', 1, false],
        nested: { source: 'type-test' },
    },
    logLevel: 'error',
    onCreateBatch: batch => batch,
};

mParticle.init('api-key', config);
mParticle.init('api-key', legacyConfig);
window.mParticle.init('api-key', config);

const instance = mParticle.getInstance();

if (instance) {
    const attrs: SDKEventAttrs = {
        bool: true,
        count: 1,
        nullable: null,
        string: 'value',
    };

    const customFlags: SDKEventCustomFlags = {
        flag: 'value',
        values: ['a', 1, false],
    };

    const options: SDKEventOptions = {
        shouldUploadEvent: false,
    };

    const product: SDKProduct | null = mParticle.eCommerce.createProduct(
        'Socks',
        'sku-1',
        12.99,
        2,
        'blue',
        'apparel',
        'mParticle',
        1,
        'WELCOME'
    );

    const transactionAttributes: TransactionAttributes | null = mParticle.eCommerce.createTransactionAttributes(
        'txn-1',
        'store',
        'WELCOME',
        '25.98',
        '0',
        2
    );

    if (!product || !transactionAttributes) {
        throw new Error('Expected ecommerce helpers to return values');
    }

    instance.logEvent(
        'Type Test Event',
        mParticle.EventType.Other,
        attrs,
        customFlags,
        options
    );
    instance.logPageView('Type Test Page', attrs, customFlags, options);
    instance.eCommerce.logProductAction(
        mParticle.ProductActionType.Purchase,
        product,
        attrs,
        customFlags,
        transactionAttributes,
        options
    );
    instance.Identity.identify(identifyRequest, identityCallback);
    instance.Identity.search('workspace-api-key', identities, result => {
        if (result.httpCode === 200) {
            void result.body?.mpid;
        }
    });
}

const consent: PrivacyConsentState | null = mParticle.Consent.createGDPRConsent(
    true,
    Date.now()
);

const state = mParticle.Consent.createConsentState();
if (consent) {
    state.addGDPRConsentState('analytics', consent);
}
state.removeCCPAConsentState();
state.removeCCPAState();
