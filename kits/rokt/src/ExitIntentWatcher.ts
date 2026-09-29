import { isObject, isString } from './utils';

const EXIT_INTENT_EVENT_NAME = 'rokt:intent';
const LEAD_CAPTURE_SUBMITTED_EVENT_NAME = 'LEAD_CAPTURE_SUBMITTED';

export interface ExitIntentConfig {
  identifier?: string;
  placementIdentifier?: string;
  attributes?: Record<string, unknown>;
  identityCapture?: {
    enabled?: boolean;
    [key: string]: unknown;
  };
  enabled?: boolean;
  [key: string]: unknown;
}

interface LeadCaptureField {
  fieldKey?: unknown;
  value?: unknown;
}

interface LeadCaptureSubmittedDetail {
  body?: Record<string, unknown>;
  fields?: LeadCaptureField[];
  userAttributes?: unknown;
  email?: unknown;
  mobile_number?: unknown;
  rclid?: unknown;
  accountID?: unknown;
  referralCreativeID?: unknown;
}

export interface LeadCapturePayload {
  identities: Record<string, unknown>;
  userAttributes: Record<string, unknown>;
}

interface ExitIntentWatcherHandlers {
  isKitReady: () => boolean;
  onExitIntent: (reason: string, configuredAttributes: Record<string, unknown>) => boolean;
  onLeadCaptureSubmitted: (payload: LeadCapturePayload) => void;
}

export class ExitIntentWatcher {
  private config: ExitIntentConfig | null = null;
  private dispatchedForPageView = false;
  private exitIntentListener?: (event: Event) => void;
  private leadCaptureSubmittedListener?: (event: Event) => void;

  public constructor(private readonly handlers: ExitIntentWatcherHandlers) {}

  public configure(config: ExitIntentConfig | null): void {
    this.config = config;
    this.dispatchedForPageView = false;
    this.detachListeners();

    if (this.isIdentityCaptureBridgeEnabled(this.config)) {
      this.leadCaptureSubmittedListener = (event: Event) => {
        const payload = this.parseLeadCaptureSubmittedPayload(event);
        if (!payload) {
          return;
        }
        this.handlers.onLeadCaptureSubmitted(payload);
      };
      window.addEventListener(
        LEAD_CAPTURE_SUBMITTED_EVENT_NAME,
        this.leadCaptureSubmittedListener as EventListener,
      );
    }

    if (!this.isExitIntentBridgeEnabled(this.config)) {
      return;
    }
    this.exitIntentListener = (event: Event) => this.handleExitIntentEvent(event);
    window.addEventListener(EXIT_INTENT_EVENT_NAME, this.exitIntentListener as EventListener);
  }

  public resetPageViewState(): void {
    this.dispatchedForPageView = false;
  }

  public dispose(): void {
    this.detachListeners();
    this.config = null;
    this.dispatchedForPageView = false;
  }

  private detachListeners(): void {
    if (this.exitIntentListener) {
      window.removeEventListener(EXIT_INTENT_EVENT_NAME, this.exitIntentListener as EventListener);
      this.exitIntentListener = undefined;
    }
    if (this.leadCaptureSubmittedListener) {
      window.removeEventListener(
        LEAD_CAPTURE_SUBMITTED_EVENT_NAME,
        this.leadCaptureSubmittedListener as EventListener,
      );
      this.leadCaptureSubmittedListener = undefined;
    }
  }

  private isExitIntentBridgeEnabled(config: ExitIntentConfig | null): boolean {
    return !!(config && config.enabled !== false);
  }

  private isIdentityCaptureBridgeEnabled(config: ExitIntentConfig | null): boolean {
    if (!this.isExitIntentBridgeEnabled(config)) {
      return false;
    }
    const identityCapture = config.identityCapture;
    if (!isObject(identityCapture)) {
      return false;
    }
    return (identityCapture as Record<string, unknown>).enabled === true;
  }

  private extractExitIntentReason(event: Event): string {
    return event instanceof CustomEvent && event.detail && isString(event.detail.reason)
      ? event.detail.reason
      : 'unknown';
  }

  private handleExitIntentEvent(event: Event): void {
    const reason = this.extractExitIntentReason(event);
    if (this.dispatchedForPageView || !this.handlers.isKitReady()) {
      return;
    }

    const isKnownReason = reason === 'mouse-exit-top'
      || reason === 'scroll-up-fast'
      || reason === 'idle'
      || reason === 'leave-link';
    if (!isKnownReason) {
      return;
    }

    this.dispatchedForPageView = true;
    const configuredAttributes = isObject(this.config?.attributes)
      ? (this.config?.attributes as Record<string, unknown>)
      : {};
    const didForward = this.handlers.onExitIntent(reason, configuredAttributes);
    if (!didForward) {
      this.dispatchedForPageView = false;
    }
  }

  private parseLeadCaptureSubmittedPayload(event: Event): LeadCapturePayload | null {
    if (!(event instanceof CustomEvent) || !isObject(event.detail)) {
      return null;
    }

    const detail = event.detail as LeadCaptureSubmittedDetail;
    const body = isObject(detail.body) ? (detail.body as Record<string, unknown>) : {};

    let email = isString(body.email) ? body.email : undefined;
    let mobileNumber = isString(body.mobile_number) ? body.mobile_number : undefined;
    if (!email || !mobileNumber) {
      const fields = Array.isArray(detail.fields) ? detail.fields : [];
      for (let i = 0; i < fields.length; i += 1) {
        const field = fields[i] as LeadCaptureField;
        if (!isString(field.fieldKey) || !isString(field.value)) {
          continue;
        }
        const key = field.fieldKey.toLowerCase().replace(/[^a-z]/g, '');
        if (!email && (key === 'email' || key === 'emailaddress') && field.value.length > 0) {
          email = field.value;
        }
        if (!mobileNumber && (key === 'mobile' || key === 'mobilenumber' || key === 'phone' || key === 'phonenumber')) {
          mobileNumber = field.value;
        }
      }
    }

    const identities: Record<string, unknown> = {};
    if (isString(email) && email.length > 0) {
      identities.email = email;
    }
    if (isString(mobileNumber) && mobileNumber.length > 0) {
      identities.mobile_number = mobileNumber;
    }

    const userAttributes: Record<string, unknown> = {};
    this.mergeLeadCaptureUserAttributes(userAttributes, isObject(body.userAttributes) ? body.userAttributes : null);
    this.mergeLeadCaptureUserAttributes(
      userAttributes,
      isObject(detail.userAttributes) ? (detail.userAttributes as Record<string, unknown>) : null,
    );

    const rclid = isString(body.rclid) ? body.rclid : isString(detail.rclid) ? detail.rclid : undefined;
    if (rclid && rclid.length > 0) {
      userAttributes.rokt_rclid = rclid;
    }
    const accountId = isString(body.accountID) ? body.accountID : isString(detail.accountID) ? detail.accountID : undefined;
    if (accountId && accountId.length > 0) {
      userAttributes.rokt_account_id = accountId;
    }
    const referralCreativeId = isString(body.referralCreativeID)
      ? body.referralCreativeID
      : isString(detail.referralCreativeID)
        ? detail.referralCreativeID
        : undefined;
    if (referralCreativeId && referralCreativeId.length > 0) {
      userAttributes.rokt_referral_creative_id = referralCreativeId;
    }

    return { identities, userAttributes };
  }

  private isSafeLeadCaptureUserAttributeKey(key: string): boolean {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return false;
    }
    return /^[a-zA-Z0-9_.-]+$/.test(key);
  }

  private isSupportedLeadCaptureUserAttributeValue(value: unknown): boolean {
    if (isString(value) || typeof value === 'number' || typeof value === 'boolean') {
      return true;
    }
    if (Array.isArray(value)) {
      return value.every((item) => isString(item));
    }
    return false;
  }

  private mergeLeadCaptureUserAttributes(
    target: Record<string, unknown>,
    source: Record<string, unknown> | null,
  ): void {
    if (!source) {
      return;
    }
    for (const [key, value] of Object.entries(source)) {
      if (!this.isSafeLeadCaptureUserAttributeKey(key)) {
        continue;
      }
      if (!this.isSupportedLeadCaptureUserAttributeValue(value)) {
        continue;
      }
      target[key] = value;
    }
  }
}
