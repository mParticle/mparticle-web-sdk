const ae = [
  "active_time_on_site_ms",
  "billingaddress1",
  "billingaddress2",
  "billingcity",
  "billingstate",
  "billingzipcode",
  "cartitems",
  "ccbin",
  "confirmationref",
  "conversiontype",
  "country",
  "couponcode",
  "currency",
  "language",
  "paymentserviceprovider",
  "paymentserviceproviderattribute",
  "paymenttype",
  "shippingaddress1",
  "shippingcity",
  "shippingcountry",
  "shippingmethod",
  "shippingstate",
  "shippingzipcode",
  "totalprice"
], ce = new Set(ae);
function X(i) {
  return ce.has(i.toLowerCase());
}
function b(i) {
  const e = {}, t = i || {}, n = Object.keys(t);
  for (let r = 0; r < n.length; r++) {
    const o = n[r];
    X(o) || (e[o] = t[o]);
  }
  return e;
}
function y(i) {
  return typeof i == "object" && i !== null && !Array.isArray(i);
}
function m(i) {
  return typeof i == "string";
}
function P(i) {
  return i == null ? !0 : typeof i == "object" ? Object.keys(i).length === 0 : !1;
}
function M(i) {
  try {
    const e = new URL(i);
    return e.search = "", e.toString();
  } catch {
    return i;
  }
}
function N(i) {
  try {
    const e = window.localStorage.getItem(i);
    return e === null ? null : JSON.parse(e);
  } catch {
    return null;
  }
}
function Z(i, e) {
  try {
    return window.localStorage.setItem(i, JSON.stringify(e)), !0;
  } catch {
    return !1;
  }
}
function ee(i) {
  try {
    window.localStorage.removeItem(i);
  } catch {
  }
}
function te(i, e) {
  const t = N(i);
  return y(t) ? t[e] : void 0;
}
function U(i, e, t) {
  const n = N(i), r = y(n) ? { ...n } : {};
  return r[e] = t, Z(i, r);
}
function le(i, e) {
  const t = N(i);
  if (!y(t) || !(e in t))
    return;
  const n = { ...t };
  delete n[e], Object.keys(n).length === 0 ? ee(i) : Z(i, n);
}
function ue(i, e, t, n) {
  const r = t.slice(), o = () => r.length <= 1 ? !1 : (r.shift(), !0);
  let s = JSON.stringify(r).length > n;
  for (; s && o(); )
    s = JSON.stringify(r).length > n;
  let c = U(i, e, r);
  for (; !c && o(); )
    c = U(i, e, r);
  return c;
}
const S = "mp-rokt-kit", k = "pageViews", x = "mpPageViews", de = 100 * 1024;
function ie(i) {
  const e = N(x);
  if (e === null)
    return;
  if (!(te(S, k) !== void 0) && Array.isArray(e) && !U(S, k, e)) {
    i?.log({
      message: "Rokt Kit: Failed to migrate legacy page-view storage; retaining legacy key for retry",
      code: "PAGE_VIEW_CAPTURE_FAILED"
    });
    return;
  }
  ee(x);
}
function Y(i) {
  ie(i);
  const e = te(S, k);
  return Array.isArray(e) ? e : [];
}
function he(i) {
  return ue(S, k, i, de);
}
function G() {
  le(S, k);
}
function ge(i) {
  return i.map((e, t) => {
    const n = e.activeTimeOnSite, r = n !== void 0 && Number.isFinite(n), s = i[t + 1]?.activeTimeOnSite, c = s !== void 0 && Number.isFinite(s), u = r && c ? s - n : void 0;
    return {
      pageUrl: e.pageUrl,
      sourceMessageId: e.sourceMessageId,
      timestamp: e.timestamp,
      ...e.pageTitle !== void 0 ? { pageTitle: e.pageTitle } : {},
      ...e.canonicalUrl !== void 0 ? { canonicalUrl: e.canonicalUrl } : {},
      ...r ? { activeTimeOnSite: n } : {},
      ...u !== void 0 && u >= 0 ? { activeTimeOnPage: u } : {}
    };
  });
}
function pe() {
  const e = document.querySelector('link[rel="canonical"]')?.href;
  if (e)
    return M(e);
}
const d = "Rokt", L = 181, fe = "selectPlacements", me = "apps.roktecommerce.com", Ee = 0.1, _e = "ThankYouPageJourney", ye = "rokt-launcher", Ie = "rokt-thank-you-element", Se = "userIdentifiedInWorkspace", ke = 3, Ae = 2, Re = "page_events", ve = 500, K = {
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  UNHANDLED_EXCEPTION: "UNHANDLED_EXCEPTION",
  IDENTITY_REQUEST: "IDENTITY_REQUEST",
  LOG_DELIVERY_FAILURE: "LOG_DELIVERY_FAILURE"
}, _ = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARNING: "WARNING"
}, we = "apps.rokt-api.com", be = "/v1/log", Le = "/v1/errors", Te = 10;
function a() {
  return window.mParticle;
}
function W(i, e) {
  const n = [D(i), "/wsdk/integrations/launcher.js"].join("");
  return !e || e.length === 0 ? n : n + "?extensions=" + e.join(",");
}
function j(i) {
  return [D(i), "/rokt-elements/rokt-element-thank-you.js"].join("");
}
function D(i) {
  return ["https://", typeof i < "u" ? i : we].join("");
}
function ne(i, e, t) {
  return i ? i.startsWith("http://") || i.startsWith("https://") ? i : "https://" + i : D(e) + t;
}
function H(i, e, t) {
  if (document.getElementById(i)) return;
  const n = document.head || document.body, r = document.createElement("script");
  r.id = i, r.type = "text/javascript", r.src = e, r.async = !0, r.crossOrigin = "anonymous", r.fetchPriority = "high", t?.onLoad && (r.onload = t.onLoad), t?.onError && (r.onerror = t.onError), n.appendChild(r);
}
function T(i) {
  if (!i)
    return [];
  try {
    return JSON.parse(i.replace(/&quot;/g, '"'));
  } catch {
    console.error("Settings string contains invalid JSON");
  }
  return [];
}
function V(i) {
  const e = i ? T(i) : [], t = [], n = [];
  let r = !1;
  for (let o = 0; o < e.length; o++) {
    const s = e[o].value;
    s === "thank-you-journey" ? (r = !0, n.push(_e)) : t.push(s);
  }
  return {
    roktExtensionsQueryParams: t,
    legacyRoktExtensions: n,
    loadThankYouElement: r
  };
}
async function Ne(i, e) {
  const t = [];
  if (e)
    for (const n of i)
      t.push(e.use(n));
  return Promise.all(t);
}
function z(i) {
  if (!i)
    return {};
  const e = {};
  for (let t = 0; t < i.length; t++) {
    const n = i[t];
    e[n.jsmap] = n.value;
  }
  return e;
}
function J(i) {
  const e = {};
  if (!Array.isArray(i))
    return e;
  for (let t = 0; t < i.length; t++) {
    const n = i[t];
    if (!n || !m(n.value) || !m(n.map))
      continue;
    const r = n.value, o = n.map;
    e[r] || (e[r] = []), e[r].push({
      eventAttributeKey: o,
      conditions: Array.isArray(n.conditions) ? n.conditions : []
    });
  }
  return e;
}
function B(i, e, t) {
  return a().generateHash([i, e, t].join(""));
}
function Oe(i) {
  let n = "mParticle_wsdkv_" + a().getVersion() + "_kitv_" + "1.30.2";
  return i && (n += "_" + i), n;
}
function re(i) {
  let e = 5381;
  for (let t = 0; t < i.length; t++)
    e = (e << 5) + e + i.charCodeAt(t), e = e & e;
  return e;
}
function C(i) {
  const e = document.createElement("iframe");
  e.style.display = "none", e.setAttribute("sandbox", "allow-scripts allow-same-origin"), e.src = i, e.onload = function() {
    e.onload = null, e.parentNode && e.parentNode.removeChild(e);
  };
  const t = document.body || document.head;
  t && t.appendChild(e);
}
function q(i, e) {
  const t = re(window.location.origin);
  if (I._allowedOriginHashes.indexOf(t) === -1 || Math.random() >= Ee)
    return;
  const r = window.__rokt_li_guid__;
  if (!r)
    return;
  const o = window.location.href.split("?")[0].split("#")[0], s = "version=" + encodeURIComponent(e ?? "") + "&launcherInstanceGuid=" + encodeURIComponent(r) + "&pageUrl=" + encodeURIComponent(o);
  C("https://" + (i || "apps.rokt.com") + "/v1/wsdk-init/index.html?" + s), C(
    "https://" + me + "/v1/wsdk-init/index.html?" + s + "&isControl=true"
  );
}
function Pe() {
  return typeof window < "u" && !!window.location?.search?.toLowerCase().includes("mp_enable_logging=true");
}
function Ue() {
  return typeof window < "u" ? window.location?.href : void 0;
}
function Ce() {
  return typeof window < "u" ? window.navigator?.userAgent : void 0;
}
class oe {
  constructor() {
    this._logCount = {};
  }
  incrementAndCheck(e) {
    const n = (this._logCount[e] || 0) + 1;
    return this._logCount[e] = n, n > Te;
  }
}
class F {
  constructor(e, t, n, r, o) {
    this._reporter = "mp-wsdk";
    const s = e.isLoggingEnabled;
    this._integrationName = t || "", this._launcherInstanceGuid = n, this._accountId = r || null, this._rateLimiter = o || new oe(), this._isEnabled = Pe() || s;
  }
  send(e, t, n, r, o, s) {
    if (!(!this._isEnabled || this._rateLimiter.incrementAndCheck(t)))
      try {
        const c = {
          additionalInformation: {
            message: n,
            version: this._integrationName
          },
          severity: t,
          code: r || K.UNKNOWN_ERROR,
          url: Ue(),
          deviceInfo: Ce(),
          stackTrace: o,
          reporter: this._reporter,
          integration: this._integrationName
        }, u = {
          Accept: "text/plain;charset=UTF-8",
          "Content-Type": "application/json",
          "rokt-launcher-version": this._integrationName,
          "rokt-wsdk-version": "joint"
        };
        this._launcherInstanceGuid && (u["rokt-launcher-instance-guid"] = this._launcherInstanceGuid), this._accountId && (u["rokt-account-id"] = this._accountId), fetch(e, {
          method: "POST",
          headers: u,
          body: JSON.stringify(c)
        }).then((l) => {
          if (!l.ok) {
            const g = new Error("HTTP " + l.status + " from log endpoint");
            throw g.statusCode = l.status, g;
          }
        }).catch((l) => {
          console.error("ReportingTransport: Failed to send log", l), s && s(l);
        });
      } catch (c) {
        console.error("ReportingTransport: Failed to send log", c), s && s(c);
      }
  }
}
class Q {
  constructor(e, t, n, r, o) {
    this._transport = new F(e, t, n, r, o), this._errorUrl = ne(e?.errorUrl, e?.integrationDomain, Le);
  }
  report(e) {
    if (!e) return;
    const t = e.severity || _.ERROR;
    this._transport.send(this._errorUrl, t, e.message, e.code, e.stackTrace);
  }
}
class $ {
  constructor(e, t, n, r, o, s) {
    this._transport = new F(e, n, r, o, s), this._loggingUrl = ne(e?.loggingUrl, e?.integrationDomain, be), this._errorReportingService = t;
  }
  log(e) {
    e && this._transport.send(
      this._loggingUrl,
      _.INFO,
      e.message,
      e.code,
      void 0,
      (t) => {
        if (this._errorReportingService) {
          const n = typeof t.statusCode == "number";
          this._errorReportingService.report({
            message: "LoggingService: Failed to send log: " + t.message,
            code: K.LOG_DELIVERY_FAILURE,
            severity: n ? _.ERROR : _.WARNING
          });
        }
      }
    );
  }
}
function Me(i) {
  const e = M(window.location.href), t = i.EventAttributes?.title || document.title, n = pe(), r = i.ActiveTimeOnSite;
  return {
    pageUrl: e,
    sourceMessageId: i.SourceMessageId,
    timestamp: i.Timestamp,
    ...t ? { pageTitle: t } : {},
    ...n !== void 0 ? { canonicalUrl: n } : {},
    ...Number.isFinite(r) ? { activeTimeOnSite: r } : {}
  };
}
const f = class f {
  constructor() {
    this.name = d, this.id = L, this.moduleId = L, this.isInitialized = !1, this.launcher = null, this.filters = {}, this.userAttributes = {}, this.userIdentifiedInWorkspace = !1, this.testHelpers = null, this.placementEventMappingLookup = {}, this.placementEventAttributeMappingLookup = {}, this.integrationName = null, this.errorReportingService = null, this.loggingService = null, this._thankYouElementOnLoadCallback = null, this._isThankYouElementLoaded = !1, this._workspaceSearchInFlightPromise = null;
  }
  // ---- Private helpers ----
  getEventAttributeValue(e, t) {
    const n = e && e.EventAttributes;
    return !n || typeof n[t] > "u" ? null : n[t];
  }
  doesEventAttributeConditionMatch(e, t) {
    if (!e || !m(e.operator))
      return !1;
    const n = e.operator.toLowerCase(), r = e.attributeValue;
    return n === "exists" ? t !== null : t == null ? !1 : n === "equals" ? String(t) === String(r) : n === "contains" ? String(t).indexOf(String(r)) !== -1 : !1;
  }
  doesEventMatchRule(e, t) {
    if (!t || !m(t.eventAttributeKey))
      return !1;
    const n = t.conditions;
    if (!Array.isArray(n))
      return !1;
    const r = this.getEventAttributeValue(e, t.eventAttributeKey);
    if (n.length === 0)
      return r !== null;
    for (let o = 0; o < n.length; o++)
      if (!this.doesEventAttributeConditionMatch(n[o], r))
        return !1;
    return !0;
  }
  applyPlacementEventAttributeMapping(e) {
    const t = Object.keys(this.placementEventAttributeMappingLookup);
    for (let n = 0; n < t.length; n++) {
      const r = t[n], o = this.placementEventAttributeMappingLookup[r];
      if (P(o))
        continue;
      let s = !0;
      for (let c = 0; c < o.length; c++)
        if (!this.doesEventMatchRule(e, o[c])) {
          s = !1;
          break;
        }
      s && a().Rokt.setLocalSessionAttribute?.(r, !0);
    }
  }
  capturePageView(e) {
    let t;
    try {
      t = M(window.location.href);
      const n = Y(this.loggingService), r = Me(e);
      n.push(r), he(n) || this.loggingService?.log({
        message: `Rokt Kit: Failed to persist page view for ${t}`,
        code: "PAGE_VIEW_CAPTURE_FAILED"
      });
    } catch (n) {
      this.loggingService?.log({
        message: `Rokt Kit: Failed to capture page view for ${t}: ${n instanceof Error ? n.message : String(n)}`,
        code: "PAGE_VIEW_CAPTURE_FAILED"
      });
    }
  }
  isLauncherReadyToAttach() {
    return !!window.Rokt && typeof window.Rokt.createLauncher == "function";
  }
  /**
   * Returns the user identities from the filtered user, if any.
   */
  returnUserIdentities(e) {
    if (!e || !e.getUserIdentities)
      return {};
    const t = e.getUserIdentities().userIdentities;
    return this.replaceOtherIdentityWithEmailsha256(t);
  }
  returnLocalSessionAttributes() {
    return !a().Rokt || typeof a().Rokt.getLocalSessionAttributes != "function" ? {} : a().Rokt.getLocalSessionAttributes();
  }
  replaceOtherIdentityWithEmailsha256(e) {
    const t = { ...e || {} }, n = this._mappedEmailSha256Key;
    return n && e[n] && (t[f.EMAIL_SHA256_KEY] = e[n]), n && delete t[n], t;
  }
  logSelectPlacementsEvent(e) {
    if (!window.mParticle || typeof a().logEvent != "function" || !y(e))
      return;
    const t = a().EventType.Other;
    a().logEvent(fe, t, e);
  }
  setRoktSessionId(e) {
    if (!(!e || typeof e != "string"))
      try {
        const t = a().getInstance();
        t && typeof t.setIntegrationAttribute == "function" && t.setIntegrationAttribute(L, {
          roktSessionId: e
        });
      } catch {
      }
  }
  attachLauncher(e, t, n = []) {
    const r = a() && a().sessionManager && typeof a().sessionManager.getSession == "function" ? a().sessionManager.getSession() : void 0, o = {
      accountId: e,
      ...t || {},
      ...r ? { mpSessionId: r } : {}
    };
    let s;
    this.isPartnerInLocalLauncherTestGroup() ? s = Promise.resolve(window.Rokt.createLocalLauncher(o)) : s = window.Rokt.createLauncher(o), s.then(async (c) => {
      await Ne(n, c), this.initRoktLauncher(c);
    }).catch((c) => {
      console.error("Error creating Rokt launcher:", c);
    });
  }
  initRoktLauncher(e) {
    window.Rokt && (window.Rokt.currentLauncher = e), this.launcher = e;
    const t = a().Rokt?.filters;
    t ? (this.filters = t, t.filteredUser ? this._workspaceSearchInFlightPromise = this.search(t.filteredUser) : console.warn("Rokt Kit: No filtered user has been set.")) : console.warn("Rokt Kit: No filters have been set."), this.isInitialized = !0, q(this.domain, this.integrationName), a().Rokt.attachKit(this);
  }
  fetchOptimizely() {
    const e = a()._getActiveForwarders().filter((t) => t.name === "Optimizely");
    try {
      if (e.length > 0 && window.optimizely) {
        const t = window.optimizely.get("state");
        return !t || !t.getActiveExperimentIds ? {} : t.getActiveExperimentIds().reduce((o, s) => (o["rokt.custom.optimizely.experiment." + s + ".variationId"] = t.getVariationMap()[s].id, o), {});
      }
    } catch (t) {
      console.error("Error fetching Optimizely attributes:", t);
    }
    return {};
  }
  isKitReady() {
    return !!(this.isInitialized && this.launcher);
  }
  // When the partner has opted out of targeting (noTargeting launcher option),
  // the kit must not collect behavioral targeting signals such as page views.
  isTargetingDisabled() {
    return a().Rokt?.launcherOptions?.noTargeting === !0;
  }
  isPartnerInLocalLauncherTestGroup() {
    return !!(a().config && a().config.isLocalLauncherEnabled && this.isAssignedToSampleGroup());
  }
  isAssignedToSampleGroup() {
    return Math.random() > 0.5;
  }
  captureTiming(e) {
    window && a() && a().captureTiming && e && a().captureTiming(e);
  }
  // ---- Public methods (mParticle Kit Callbacks) ----
  /**
   * Initializes the Rokt forwarder with settings from the mParticle server.
   */
  init(e, t, n, r, o) {
    const s = e, c = s.accountId;
    this.userAttributes = b(o), this._onboardingExpProvider = s.onboardingExpProvider;
    const u = T(s.placementEventMapping);
    this.placementEventMappingLookup = z(u);
    const l = T(
      s.placementEventAttributeMapping
    );
    this.placementEventAttributeMappingLookup = J(l), s.hashedEmailUserIdentityType && (this._mappedEmailSha256Key = s.hashedEmailUserIdentityType.toLowerCase()), this._workspaceIdSyncApiKey = m(s.workspaceIdSyncApiKey) ? s.workspaceIdSyncApiKey : void 0;
    const g = a().Rokt?.domain, { roktExtensionsQueryParams: O, legacyRoktExtensions: A, loadThankYouElement: R } = V(
      s.roktExtensions
    ), p = {
      ...a().Rokt?.launcherOptions || {}
    };
    this.integrationName = Oe(p.integrationName), p.integrationName = this.integrationName, this.domain = g;
    const v = {
      loggingUrl: s.loggingUrl,
      errorUrl: s.errorUrl,
      integrationDomain: g,
      isLoggingEnabled: a().config?.isLoggingEnabled === !0
    }, E = new Q(
      v,
      this.integrationName,
      window.__rokt_li_guid__,
      s.accountId
    ), w = new $(
      v,
      E,
      this.integrationName,
      window.__rokt_li_guid__,
      s.accountId
    );
    if (this.errorReportingService = E, this.loggingService = w, this.isTargetingDisabled())
      try {
        G();
      } catch (h) {
        this.errorReportingService?.report({
          message: "Rokt Kit: Failed to clear page views when targeting is disabled",
          code: "PAGE_VIEW_CAPTURE_FAILED",
          severity: _.INFO,
          stackTrace: h instanceof Error ? h.stack : void 0
        });
      }
    return a()._registerErrorReportingService && a()._registerErrorReportingService(E), a()._registerLoggingService && a()._registerLoggingService(w), n ? (this.testHelpers = {
      generateLauncherScript: W,
      generateThankYouElementScript: j,
      extractRoktExtensionConfig: V,
      hashEventMessage: B,
      parseSettingsString: T,
      generateMappedEventLookup: z,
      generateMappedEventAttributeLookup: J,
      sendAdBlockMeasurementSignals: q,
      createAutoRemovedIframe: C,
      djb2: re,
      setAllowedOriginHashes: (h) => {
        f._allowedOriginHashes = h;
      },
      ReportingTransport: F,
      ErrorReportingService: Q,
      LoggingService: $,
      RateLimiter: oe,
      ErrorCodes: K,
      WSDKErrorSeverity: _
    }, this.attachLauncher(c, p), "Successfully initialized: " + d) : (R && (a().Rokt.flushOnShoppableAdsReadyMessageQueue?.(this), H(Ie, j(g), {
      onLoad: () => {
        this._isThankYouElementLoaded = !0, this._thankYouElementOnLoadCallback && this._thankYouElementOnLoadCallback();
      },
      onError: (h) => {
        console.error("Error loading Rokt Thank You Element script:", h);
      }
    })), this.isLauncherReadyToAttach() ? this.attachLauncher(c, p, A) : (H(ye, W(g, O), {
      onLoad: () => {
        this.isLauncherReadyToAttach() ? this.attachLauncher(c, p, A) : console.error("Rokt object is not available after script load.");
      },
      onError: (h) => {
        console.error("Error loading Rokt launcher script:", h);
      }
    }), this.captureTiming(f.PERFORMANCE_MARKS.RoktScriptAppended)), "Successfully initialized: " + d);
  }
  process(e) {
    if (this.isTargetingDisabled() || (e.EventDataType === ke && this.capturePageView(e), e.EventDataType === Ae && (ie(this.loggingService), G())), !this.isKitReady())
      return "Kit not ready for forwarder: " + d;
    if (typeof a().Rokt?.setLocalSessionAttribute == "function" && (P(this.placementEventAttributeMappingLookup) || this.applyPlacementEventAttributeMapping(e), !P(this.placementEventMappingLookup))) {
      const t = B(e.EventDataType, e.EventCategory, e.EventName ?? "");
      this.placementEventMappingLookup[String(t)] && a().Rokt.setLocalSessionAttribute?.(this.placementEventMappingLookup[String(t)], !0);
    }
    return "Successfully sent to forwarder: " + d;
  }
  setExtensionData(e) {
    if (!this.isKitReady()) {
      console.error("Rokt Kit: Not initialized");
      return;
    }
    window.Rokt.setExtensionData(e);
  }
  setUserAttribute(e, t) {
    return X(e) || (this.userAttributes[e] = t), "Successfully set user attribute for forwarder: " + d;
  }
  removeUserAttribute(e) {
    return delete this.userAttributes[e], "Successfully removed user attribute for forwarder: " + d;
  }
  handleIdentityComplete(e, t) {
    return this.userAttributes = b(e.getAllUserAttributes()), "Successfully called " + t + " for forwarder: " + d;
  }
  onUserIdentified(e) {
    const t = e;
    return this.filters.filteredUser = t, this._workspaceSearchInFlightPromise = this.search(t), this.handleIdentityComplete(e, "onUserIdentified");
  }
  search(e) {
    const t = this._workspaceIdSyncApiKey;
    if (!t)
      return this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = void 0, Promise.resolve();
    const n = a().Identity?.search;
    if (typeof n != "function")
      return this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = void 0, Promise.resolve();
    const r = e.getUserIdentities ? e.getUserIdentities().userIdentities : null, o = {};
    if (r)
      for (const u of Object.keys(r)) {
        const l = r[u];
        m(l) && l.length > 0 && (o[u] = l);
      }
    const s = Object.keys(o);
    if (s.length === 0)
      return this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = void 0, Promise.resolve();
    const c = s.sort().map((u) => `${u}=${o[u]}`).join("&");
    return c === this._workspaceLastSearchedIdentitiesKey ? this._workspaceSearchInFlightPromise || Promise.resolve() : (this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = c, new Promise((u) => {
      try {
        n(t, o, (l) => {
          l?.httpCode === 200 && (this.userIdentifiedInWorkspace = !0), u();
        });
      } catch (l) {
        console.error("Rokt Kit: Workspace IDSync search failed", l), this._workspaceLastSearchedIdentitiesKey = void 0, u();
      }
    }));
  }
  onLoginComplete(e, t) {
    return this.handleIdentityComplete(e, "onLoginComplete");
  }
  onLogoutComplete(e, t) {
    return this.userIdentifiedInWorkspace = !1, this._workspaceSearchInFlightPromise = null, this._workspaceLastSearchedIdentitiesKey = void 0, this.handleIdentityComplete(e, "onLogoutComplete");
  }
  onModifyComplete(e, t) {
    return this.handleIdentityComplete(e, "onModifyComplete");
  }
  /**
   * Selects placements for Rokt Web SDK with merged attributes, filters, and experimentation options.
   *
   * If a Workspace IDSync search is in flight from a recent onUserIdentified
   * call, this method waits up to `WORKSPACE_SEARCH_SELECT_TIMEOUT_MS` for it
   * to settle so the first placement call can include the
   * `userIdentifiedInWorkspace` flag without racing the network response.
   * The timeout protects against a stalled or slow search blocking placement
   * rendering — if it fires, selectPlacements proceeds without the flag.
   *
   * Implementation note: this method stays non-async deliberately. First,
   * the public return type is `RoktSelection | Promise<RoktSelection> |
   * undefined` — a superset of the `RoktSelection | Promise<RoktSelection>`
   * shape declared for `RoktLauncher.selectPlacements` above (line ~70).
   * Marking this `async` would narrow it to `Promise<RoktSelection |
   * undefined>` and silently change the contract for callers that read
   * the result synchronously. Second, `RoktSelection` has an optional
   * `then?` member, so TS treats it as ambiguously promise-like and
   * rejects it as the awaited return of an async function (TS1058) —
   * working around that would require a cast or wrapping every return in
   * `Promise.resolve(...)`. The inner work runs in `_dispatchPlacements`;
   * this wrapper just gates it on the in-flight search via `Promise.race`.
   */
  selectPlacements(e) {
    if (this._workspaceSearchInFlightPromise) {
      const t = this._workspaceSearchInFlightPromise;
      return Promise.race([
        t,
        new Promise((n) => setTimeout(n, ve))
      ]).then(() => this._dispatchPlacements(e));
    }
    return this._dispatchPlacements(e);
  }
  _dispatchPlacements(e) {
    const t = e && e.attributes || {}, r = { ...b(this.userAttributes), ...t }, o = this.filters || {}, s = o.userAttributeFilters || [], c = o.filteredUser || null, u = c ? c.getMPID() : null;
    let l;
    o ? o.filterUserAttributes ? l = o.filterUserAttributes(r, s) : l = r : (console.warn("Rokt Kit: No filters available, using user attributes"), l = r), this.userAttributes = b(l);
    const g = this._onboardingExpProvider === "Optimizely" ? this.fetchOptimizely() : {}, O = this.returnUserIdentities(c), A = this.returnLocalSessionAttributes(), R = ge(Y(this.loggingService)), p = {
      ...O,
      ...l,
      ...g,
      ...A,
      ...R.length ? { [Re]: JSON.stringify(R) } : {},
      ...this.userIdentifiedInWorkspace ? { [Se]: !0 } : {},
      mpid: u
    }, v = { ...e, attributes: p }, E = this.launcher.selectPlacements(v), w = () => this.logSelectPlacementsEvent(p);
    return Promise.resolve(E).then((h) => h?.context?.sessionId?.then((se) => this.setRoktSessionId(se))).catch(() => {
    }).finally(w), E;
  }
  /**
   * Passes attributes to the Rokt Web SDK for client-side hashing.
   */
  hashAttributes(e) {
    return this.isKitReady() ? this.launcher.hashAttributes(e) : (console.error("Rokt Kit: Not initialized"), null);
  }
  /**
   * Enables optional Integration Launcher extensions before selecting placements.
   *
   * @deprecated This functionality has been internalized and will be removed in a future release.
   */
  use(e) {
    return this.isKitReady() ? !e || !m(e) ? Promise.reject(new Error("Rokt Kit: Invalid extension name")) : this.launcher.use(e) : (console.error("Rokt Kit: Not initialized"), Promise.reject(new Error("Rokt Kit: Not initialized")));
  }
  /**
   * Registers a callback to be invoked once rokt-thank-you-element.js becomes available.
   */
  onShoppableAdsReady(e) {
    this._isThankYouElementLoaded ? e() : this._thankYouElementOnLoadCallback = e;
  }
};
f._allowedOriginHashes = [-553112570, 549508659], f.PERFORMANCE_MARKS = {
  RoktScriptAppended: "mp:RoktScriptAppended"
}, f.EMAIL_SHA256_KEY = "emailsha256";
let I = f;
function Ke() {
  return L;
}
function De(i) {
  if (!i) {
    window.console.log("You must pass a config object to register the kit " + d);
    return;
  }
  if (!y(i)) {
    window.console.log("'config' must be an object. You passed in a " + typeof i);
    return;
  }
  y(i.kits) ? i.kits[d] = {
    constructor: I
  } : (i.kits = {}, i.kits[d] = {
    constructor: I
  }), window.console.log("Successfully registered " + d + " to your mParticle configuration");
}
typeof window < "u" && window.mParticle && a().addForwarder && a().addForwarder({
  name: d,
  constructor: I,
  getId: Ke
});
export {
  De as register
};
//# sourceMappingURL=Rokt-Kit.esm.js.map
