import { IAPIClient } from './apiClient';
import { ICookieSyncManager } from './cookieSyncManager';
import { ISessionManager } from './sessionManager';
import { IStore } from './store';
import { IServerModel } from './serverModel';
import ForwardingStatsUploader from './forwardingStatsUploader';
import { IConsent } from './consent';
import IdentityAPIClient from './identityApiClient';
import IntegrationCapture from './integrationCapture';
import { IPreInit } from './pre-init-utils';
import { MParticleWebSDK, SDKHelpersApi } from './sdkRuntimeModels';
import { Dictionary } from '@mparticle/web-sdk';
import { IIdentity } from './identity.interfaces';
import { IEvents } from './events.interfaces';
import { IECommerce } from './ecommerce.interfaces';
import { INativeSdkHelpers } from './nativeSdkHelpers.interfaces';
import { IPersistence } from './persistence.interfaces';
import ForegroundTimer from './foregroundTimeTracker';
import RoktManager from './roktManager';
import { ICookieConsentManager } from './cookieConsentManager';
import { ErrorReportingDispatcher } from './reporting/errorReportingDispatcher';
import { LoggingDispatcher } from './reporting/loggingDispatcher';
export interface IErrorLogMessage {
    message?: string;
    name?: string;
    stack?: string;
}
export interface IErrorLogMessageMinified {
    m?: string;
    s?: string;
    t?: string;
}
export type IntegrationDelays = Dictionary<boolean>;
export interface IMParticleWebSDKInstance extends MParticleWebSDK {
    _APIClient: IAPIClient;
    _Consent: IConsent;
    _CookieSyncManager: ICookieSyncManager;
    _Ecommerce: IECommerce;
    _Events: IEvents;
    _Forwarders: any;
    _ForwardingStatsUploader: ForwardingStatsUploader;
    _Helpers: SDKHelpersApi;
    _Identity: IIdentity;
    _IdentityAPIClient: typeof IdentityAPIClient;
    _IntegrationCapture: IntegrationCapture;
    _NativeSdkHelpers: INativeSdkHelpers;
    _Persistence: IPersistence;
    _CookieConsentManager: ICookieConsentManager;
    _ErrorReportingDispatcher: ErrorReportingDispatcher;
    _LoggingDispatcher: LoggingDispatcher;
    _RoktManager: RoktManager;
    _SessionManager: ISessionManager;
    _ServerModel: IServerModel;
    _Store: IStore;
    _instanceName: string;
    _preInit: IPreInit;
    _timeOnSiteTimer: ForegroundTimer;
    setLauncherInstanceGuid: () => void;
    getLauncherInstanceGuid: () => string;
    captureTiming(metricName: string): any;
    processQueueOnIdentityFailure?: () => void;
    processQueueOnNoFunctional?: () => void;
}
/**
 * <p>All of the following methods can be called on the primary mParticle class. In version 2.10.0, we introduced <a href="https://docs.mparticle.com/developers/sdk/web/multiple-instances/">multiple instances</a>. If you are using multiple instances (self hosted environments only), you should call these methods on each instance.</p>
 * <p>In current versions of mParticle, if your site has one instance, that instance name is 'default_instance'. Any methods called on mParticle on a site with one instance will be mapped to the `default_instance`.</p>
 * <p>This is for simplicity and backwards compatibility. For example, calling mParticle.logPageView() automatically maps to mParticle.getInstance('default_instance').logPageView().</p>
 * <p>If you have multiple instances, instances must first be initialized and then a method can be called on that instance. For example:</p>
 * <code>
 *  mParticle.init('apiKey', config, 'another_instance');
 *  mParticle.getInstance('another_instance').logPageView();
 * </code>
 *
 * @class mParticle & mParticleInstance
 */
export default function mParticleInstance(this: IMParticleWebSDKInstance, instanceName: string): void;
