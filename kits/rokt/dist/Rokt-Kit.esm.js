const Ee = [
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
], _e = new Set(Ee);
function se(i) {
  return _e.has(i.toLowerCase());
}
function T(i) {
  const e = {}, t = i || {}, n = Object.keys(t);
  for (let r = 0; r < n.length; r++) {
    const s = n[r];
    se(s) || (e[s] = t[s]);
  }
  return e;
}
function E(i) {
  return typeof i == "object" && i !== null && !Array.isArray(i);
}
function m(i) {
  return typeof i == "string";
}
function b(i) {
  return typeof i == "function";
}
function C(i) {
  return i == null ? !0 : typeof i == "object" ? Object.keys(i).length === 0 : !1;
}
function F(i) {
  try {
    const e = new URL(i);
    return e.search = "", e.toString();
  } catch {
    return i;
  }
}
const H = "__rokt_ls_probe__";
function K() {
  try {
    return window.localStorage.setItem(H, "1"), window.localStorage.removeItem(H), !0;
  } catch {
    return !1;
  }
}
function x(i) {
  try {
    const e = window.localStorage.getItem(i);
    return e === null ? null : JSON.parse(e);
  } catch {
    return null;
  }
}
function oe(i, e) {
  try {
    return window.localStorage.setItem(i, JSON.stringify(e)), !0;
  } catch {
    return !1;
  }
}
function Se(i) {
  try {
    window.localStorage.removeItem(i);
  } catch {
  }
}
function Y(i, e) {
  const t = x(i);
  return E(t) ? t[e] : void 0;
}
function ae(i, e, t) {
  const n = x(i), r = E(n) ? { ...n } : {};
  return r[e] = t, oe(i, r);
}
function ce(i, e) {
  const t = x(i);
  if (!E(t) || !(e in t))
    return;
  const n = { ...t };
  delete n[e], Object.keys(n).length === 0 ? Se(i) : oe(i, n);
}
const _ = "mp-rokt-kit", j = "pageViews", O = "utmParams", le = 25, Ie = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
function ue(i) {
  return i.slice(-le);
}
function V() {
  const i = Y(_, j);
  return Array.isArray(i) ? i : [];
}
function Ae(i) {
  const e = ue(i);
  for (let t = 0; t < e.length; t++) {
    const n = e.slice(t);
    if (ae(_, j, n))
      return n.length;
  }
  return 0;
}
function z() {
  ce(_, j);
}
function ye(i) {
  const e = ue(i);
  return e.map((t, n) => {
    const r = t.activeTimeOnSite, s = r !== void 0 && Number.isFinite(r), c = e[n + 1]?.activeTimeOnSite, u = c !== void 0 && Number.isFinite(c), l = s && u ? c - r : void 0;
    return {
      pageUrl: t.pageUrl,
      sourceMessageId: t.sourceMessageId,
      timestamp: t.timestamp,
      ...t.pageTitle !== void 0 ? { pageTitle: t.pageTitle } : {},
      ...t.canonicalUrl !== void 0 ? { canonicalUrl: t.canonicalUrl } : {},
      ...s ? { activeTimeOnSite: r } : {},
      ...l !== void 0 && l >= 0 ? { activeTimeOnPage: l } : {}
    };
  });
}
function ke(i) {
  if (Y(_, O) !== void 0)
    return;
  const e = new URLSearchParams(window.location.search), t = {};
  for (const r of Ie) {
    const s = e.get(r);
    s && (t[r] = s);
  }
  if (Object.keys(t).length === 0)
    return;
  const n = Object.keys(t).join(", ");
  if (!ae(_, O, t)) {
    const r = K() ? "quota" : "ls_unavailable";
    i?.log({
      message: `Rokt Kit: Failed to persist UTM params [reason: ${r}]`,
      code: "UTM_CAPTURE_FAILED"
    });
    return;
  }
  i?.log({
    message: `Rokt Kit: Captured UTM params [${n}]`,
    code: "UTM_CAPTURE_SUCCESS"
  });
}
function Re() {
  const i = Y(_, O);
  return E(i) ? i : null;
}
function $() {
  ce(_, O);
}
function ve() {
  const e = document.querySelector('link[rel="canonical"]')?.href;
  if (e)
    return F(e);
}
function M(i, e) {
  return {
    message: `Rokt Kit: ${i} called [attributeKeys=${e.join(",")}]`,
    code: "ATTRIBUTE_SETTER_CALLED"
  };
}
function we(i) {
  return {
    message: `Rokt Kit: selectPlacements dispatched [placementAttributeKeys=${i.join(",")}]`,
    code: "SELECT_PLACEMENTS_DISPATCHED"
  };
}
function Te() {
  return {
    context: null,
    lifecycle: "idle",
    recreateInFlight: null
  };
}
function be(i, e) {
  i.context = {
    accountId: e.accountId,
    launcherOptions: { ...e.launcherOptions },
    legacyRoktExtensions: [...e.legacyRoktExtensions]
  };
}
function Le(i) {
  i.lifecycle = "attached";
}
function Pe(i) {
  i.lifecycle !== "idle" && (i.lifecycle = "terminated");
}
function Oe(i) {
  i.lifecycle = "terminated";
}
function Ne(i) {
  i.context = null, i.lifecycle = "idle", i.recreateInFlight = null;
}
function Ue(i, e, t) {
  if (i.recreateInFlight)
    return i.recreateInFlight;
  if (i.lifecycle !== "terminated" || !i.context || !e)
    return;
  i.lifecycle = "recreating";
  const n = i.context;
  return i.recreateInFlight = t(n).finally(() => {
    i.recreateInFlight = null;
  }), i.recreateInFlight;
}
const d = "Rokt", L = 181, Ce = "selectPlacements", Me = "apps.roktecommerce.com", Ke = 0.1, De = "ThankYouPageJourney", Fe = "rokt-launcher", xe = "rokt-thank-you-element", Ye = "userIdentifiedInWorkspace", je = 3, We = 2, Ge = "page_events", He = "page_view_attributes", Ve = "mparticle_session_id", ze = "mparticle_device_id", q = 500, W = {
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  UNHANDLED_EXCEPTION: "UNHANDLED_EXCEPTION",
  IDENTITY_REQUEST: "IDENTITY_REQUEST",
  LOG_DELIVERY_FAILURE: "LOG_DELIVERY_FAILURE"
}, A = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARNING: "WARNING"
}, $e = "apps.rokt-api.com", qe = "/v1/log", Be = "/v1/errors", Je = 10;
function a() {
  return window.mParticle;
}
function B(i, e) {
  const n = [N(i), "/wsdk/integrations/launcher.js"].join("");
  return !e || e.length === 0 ? n : n + "?extensions=" + e.join(",");
}
function J(i) {
  return [N(i), "/rokt-elements/rokt-element-thank-you.js"].join("");
}
function N(i) {
  const e = typeof i < "u" ? i : $e;
  return e.includes("://") ? e.replace(/\/+$/, "") : ["https://", e].join("");
}
function de(i, e, t) {
  if (i)
    return i.startsWith("http://") || i.startsWith("https://") ? i : "https://" + i;
  const r = e?.includes("://") && !/^https?:\/\//i.test(e) ? void 0 : e;
  return N(r) + t;
}
function Q(i, e, t) {
  if (document.getElementById(i)) return;
  const n = document.head || document.body, r = document.createElement("script");
  r.id = i, r.type = "text/javascript", r.src = e, r.async = !0, r.crossOrigin = "anonymous", r.fetchPriority = "high", t?.onLoad && (r.onload = t.onLoad), t?.onError && (r.onerror = t.onError), n.appendChild(r);
}
function P(i) {
  if (!i)
    return [];
  try {
    return JSON.parse(i.replace(/&quot;/g, '"'));
  } catch {
    console.error("Settings string contains invalid JSON");
  }
  return [];
}
function X(i) {
  const e = i ? P(i) : [], t = [], n = [];
  let r = !1;
  for (let s = 0; s < e.length; s++) {
    const o = e[s].value;
    o === "thank-you-journey" ? (r = !0, n.push(De)) : t.push(o);
  }
  return {
    roktExtensionsQueryParams: t,
    legacyRoktExtensions: n,
    loadThankYouElement: r
  };
}
async function Qe(i, e) {
  const t = [];
  if (e)
    for (const n of i)
      t.push(e.use(n));
  return Promise.all(t);
}
function Z(i) {
  if (!i)
    return {};
  const e = {};
  for (let t = 0; t < i.length; t++) {
    const n = i[t];
    e[n.jsmap] = n.value;
  }
  return e;
}
function ee(i) {
  const e = {};
  if (!Array.isArray(i))
    return e;
  for (let t = 0; t < i.length; t++) {
    const n = i[t];
    if (!n || !m(n.value) || !m(n.map))
      continue;
    const r = n.value, s = n.map;
    e[r] || (e[r] = []), e[r].push({
      eventAttributeKey: s,
      conditions: Array.isArray(n.conditions) ? n.conditions : []
    });
  }
  return e;
}
function te(i, e, t) {
  return a().generateHash([i, e, t].join(""));
}
function Xe(i) {
  let n = "mParticle_wsdkv_" + a().getVersion() + "_kitv_" + "3.1.0";
  return i && (n += "_" + i), n;
}
function he(i) {
  let e = 5381;
  for (let t = 0; t < i.length; t++)
    e = (e << 5) + e + i.charCodeAt(t), e = e & e;
  return e;
}
function D(i) {
  const e = document.createElement("iframe");
  e.style.display = "none", e.setAttribute("sandbox", "allow-scripts allow-same-origin"), e.src = i, e.onload = function() {
    e.onload = null, e.parentNode && e.parentNode.removeChild(e);
  };
  const t = document.body || document.head;
  t && t.appendChild(e);
}
function ie(i, e) {
  const t = he(window.location.origin);
  if (y._allowedOriginHashes.indexOf(t) === -1 || Math.random() >= Ke)
    return;
  const r = window.__rokt_li_guid__;
  if (!r || i && i.includes("://") && !/^https:\/\//i.test(i))
    return;
  const s = window.location.href.split("?")[0].split("#")[0], o = "version=" + encodeURIComponent(e ?? "") + "&launcherInstanceGuid=" + encodeURIComponent(r) + "&pageUrl=" + encodeURIComponent(s), c = i ? N(i) : "https://apps.rokt.com";
  D(c + "/v1/wsdk-init/index.html?" + o), D(
    "https://" + Me + "/v1/wsdk-init/index.html?" + o + "&isControl=true"
  );
}
function Ze() {
  return typeof window < "u" && !!window.location?.search?.toLowerCase().includes("mp_enable_logging=true");
}
function et() {
  return typeof window < "u" ? window.location?.href : void 0;
}
function tt() {
  return typeof window < "u" ? window.navigator?.userAgent : void 0;
}
class ge {
  constructor() {
    this._logCount = {};
  }
  incrementAndCheck(e) {
    const n = (this._logCount[e] || 0) + 1;
    return this._logCount[e] = n, n > Je;
  }
}
class R {
  constructor(e, t, n, r, s) {
    this._reporter = "mp-wsdk";
    const o = e.isLoggingEnabled;
    this._integrationName = t || "", this._launcherInstanceGuid = n, this._accountId = r || null, this._rateLimiter = s || new ge(), this._isEnabled = Ze() || o;
  }
  send(e, t, n, r, s, o) {
    if (!(!this._isEnabled || this._rateLimiter.incrementAndCheck(t)))
      try {
        const c = {
          additionalInformation: {
            message: n,
            version: this._integrationName
          },
          severity: t,
          code: r || W.UNKNOWN_ERROR,
          url: et(),
          deviceInfo: tt(),
          stackTrace: s,
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
          console.error("ReportingTransport: Failed to send log", l), o && o(l);
        });
      } catch (c) {
        console.error("ReportingTransport: Failed to send log", c), o && o(c);
      }
  }
}
class ne {
  constructor(e, t, n, r, s) {
    this._transport = new R(e, t, n, r, s), this._errorUrl = de(e?.errorUrl, e?.integrationDomain, Be);
  }
  report(e) {
    if (!e) return;
    const t = e.severity || A.ERROR;
    this._transport.send(this._errorUrl, t, e.message, e.code, e.stackTrace);
  }
}
class re {
  constructor(e, t, n, r, s, o) {
    this._transport = new R(e, n, r, s, o), this._diagnosticTransport = new R(e, n, r, s), this._placementDiagnosticTransport = new R(
      e,
      n,
      r,
      s
    ), this._loggingUrl = de(e?.loggingUrl, e?.integrationDomain, qe), this._errorReportingService = t;
  }
  log(e) {
    e && this._send(this._transport, e);
  }
  logDiagnostic(e) {
    e && this._send(this._diagnosticTransport, e);
  }
  logPlacementDiagnostic(e) {
    e && this._send(this._placementDiagnosticTransport, e);
  }
  _send(e, t) {
    e.send(
      this._loggingUrl,
      A.INFO,
      t.message,
      t.code,
      void 0,
      (n) => {
        if (this._errorReportingService) {
          const r = typeof n.statusCode == "number";
          this._errorReportingService.report({
            message: "LoggingService: Failed to send log: " + n.message,
            code: W.LOG_DELIVERY_FAILURE,
            severity: r ? A.ERROR : A.WARNING
          });
        }
      }
    );
  }
}
function it(i) {
  const e = F(window.location.href), t = i.EventAttributes?.title || document.title, n = ve(), r = i.ActiveTimeOnSite;
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
    this.name = d, this.id = L, this.moduleId = L, this.isInitialized = !1, this.launcher = null, this.filters = {}, this.userAttributes = {}, this.userIdentifiedInWorkspace = !1, this.testHelpers = null, this.placementEventMappingLookup = {}, this.placementEventAttributeMappingLookup = {}, this.integrationName = null, this.errorReportingService = null, this.loggingService = null, this._thankYouElementOnLoadCallback = null, this._isThankYouElementLoaded = !1, this._workspaceSearchInFlightPromise = null, this._launcherAttachState = Te();
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
    for (let s = 0; s < n.length; s++)
      if (!this.doesEventAttributeConditionMatch(n[s], r))
        return !1;
    return !0;
  }
  applyPlacementEventAttributeMapping(e) {
    const t = Object.keys(this.placementEventAttributeMappingLookup);
    for (let n = 0; n < t.length; n++) {
      const r = t[n], s = this.placementEventAttributeMappingLookup[r];
      if (C(s))
        continue;
      let o = !0;
      for (let c = 0; c < s.length; c++)
        if (!this.doesEventMatchRule(e, s[c])) {
          o = !1;
          break;
        }
      o && a().Rokt.setLocalSessionAttribute?.(r, !0);
    }
  }
  capturePageView(e) {
    let t;
    try {
      t = F(window.location.href);
      const n = V(), r = it(e);
      n.push(r);
      const s = Math.min(n.length, le), o = Ae(n);
      if (o === 0) {
        const c = K() ? "quota" : "ls_unavailable";
        this.loggingService?.log({
          message: `Rokt Kit: Failed to persist page view for ${t} [reason: ${c}]`,
          code: "PAGE_VIEW_CAPTURE_FAILED"
        });
      } else o < s && this.loggingService?.log({
        message: `Rokt Kit: Page view storage reduced from ${s} to ${o} record(s) under quota pressure [reason: quota_eviction]`,
        code: "PAGE_VIEW_QUOTA_EVICTION"
      });
    } catch (n) {
      const r = K() ? "exception" : "ls_unavailable", s = n instanceof Error ? n.message : String(n);
      this.loggingService?.log({
        message: `Rokt Kit: Failed to capture page view for ${t}: ${s} [reason: ${r}]`,
        code: "PAGE_VIEW_CAPTURE_FAILED"
      });
    }
  }
  isLauncherReadyToAttach() {
    return !!window.Rokt && b(window.Rokt.createLauncher);
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
    if (!window.mParticle || typeof a().logEvent != "function" || !E(e))
      return;
    const t = a().EventType.Other;
    a().logEvent(Ce, t, e);
  }
  setRoktSessionId(e) {
    if (!(!e || typeof e != "string"))
      try {
        const t = a().getInstance();
        t && b(t.setIntegrationAttribute) && t.setIntegrationAttribute(L, {
          roktSessionId: e
        });
      } catch {
      }
  }
  readMpSessionId() {
    const e = a()?.sessionManager, t = e?.getSessionId ?? e?.getSession;
    if (b(t))
      return t.call(e) || void 0;
  }
  readMpDeviceId() {
    return a()?.getDeviceId?.() || void 0;
  }
  attachLauncher(e, t, n = []) {
    be(this._launcherAttachState, {
      accountId: e,
      launcherOptions: t || {},
      legacyRoktExtensions: n
    });
    const r = {
      accountId: e,
      ...t || {}
    };
    let s;
    return this.isPartnerInLocalLauncherTestGroup() ? s = Promise.resolve(window.Rokt.createLocalLauncher(r)) : s = window.Rokt.createLauncher(r), s.then(async (o) => {
      await Qe([...n], o), this.initRoktLauncher(o);
    }).catch((o) => {
      Oe(this._launcherAttachState), console.error("Error creating Rokt launcher:", o);
    });
  }
  recreateLauncherIfTerminated() {
    return Ue(
      this._launcherAttachState,
      this.isLauncherReadyToAttach(),
      (e) => this.attachLauncher(e.accountId, e.launcherOptions, e.legacyRoktExtensions)
    );
  }
  initRoktLauncher(e) {
    window.Rokt && (window.Rokt.currentLauncher = e), this.launcher = e, Le(this._launcherAttachState);
    const t = a().Rokt?.filters;
    t ? (this.filters = t, t.filteredUser ? this._workspaceSearchInFlightPromise = this.search(t.filteredUser) : console.warn("Rokt Kit: No filtered user has been set.")) : console.warn("Rokt Kit: No filters have been set."), this.isInitialized = !0, ie(this.domain, this.integrationName), a().Rokt.attachKit(this);
  }
  fetchOptimizely() {
    const e = a()._getActiveForwarders().filter((t) => t.name === "Optimizely");
    try {
      if (e.length > 0 && window.optimizely) {
        const t = window.optimizely.get("state");
        return !t || !t.getActiveExperimentIds ? {} : t.getActiveExperimentIds().reduce((s, o) => (s["rokt.custom.optimizely.experiment." + o + ".variationId"] = t.getVariationMap()[o].id, s), {});
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
  init(e, t, n, r, s) {
    const o = e, c = o.accountId;
    this.userAttributes = T(s), this._onboardingExpProvider = o.onboardingExpProvider;
    const u = P(o.placementEventMapping);
    this.placementEventMappingLookup = Z(u);
    const l = P(
      o.placementEventAttributeMapping
    );
    this.placementEventAttributeMappingLookup = ee(l), o.hashedEmailUserIdentityType && (this._mappedEmailSha256Key = o.hashedEmailUserIdentityType.toLowerCase()), this._workspaceIdSyncApiKey = m(o.workspaceIdSyncApiKey) ? o.workspaceIdSyncApiKey : void 0;
    const g = a().Rokt?.domain, { roktExtensionsQueryParams: U, legacyRoktExtensions: v, loadThankYouElement: w } = X(
      o.roktExtensions
    ), p = {
      ...a().Rokt?.launcherOptions || {}
    };
    this.integrationName = Xe(p.integrationName), p.integrationName = this.integrationName, this.domain = g;
    const k = {
      loggingUrl: o.loggingUrl,
      errorUrl: o.errorUrl,
      integrationDomain: g,
      isLoggingEnabled: a().config?.isLoggingEnabled === !0
    }, S = new ne(
      k,
      this.integrationName,
      window.__rokt_li_guid__,
      o.accountId
    ), I = new re(
      k,
      S,
      this.integrationName,
      window.__rokt_li_guid__,
      o.accountId
    );
    if (this.errorReportingService = S, this.loggingService = I, this.isTargetingDisabled())
      try {
        z(), $();
      } catch (h) {
        this.errorReportingService?.report({
          message: "Rokt Kit: Failed to clear page views when targeting is disabled",
          code: "PAGE_VIEW_CAPTURE_FAILED",
          severity: A.INFO,
          stackTrace: h instanceof Error ? h.stack : void 0
        });
      }
    return a()._registerErrorReportingService && a()._registerErrorReportingService(S), a()._registerLoggingService && a()._registerLoggingService(I), n ? (this.testHelpers = {
      generateLauncherScript: B,
      generateThankYouElementScript: J,
      extractRoktExtensionConfig: X,
      hashEventMessage: te,
      parseSettingsString: P,
      generateMappedEventLookup: Z,
      generateMappedEventAttributeLookup: ee,
      sendAdBlockMeasurementSignals: ie,
      createAutoRemovedIframe: D,
      djb2: he,
      setAllowedOriginHashes: (h) => {
        f._allowedOriginHashes = h;
      },
      ReportingTransport: R,
      ErrorReportingService: ne,
      LoggingService: re,
      RateLimiter: ge,
      ErrorCodes: W,
      WSDKErrorSeverity: A,
      resetLauncherAttachState: () => Ne(this._launcherAttachState)
    }, this.attachLauncher(c, p), "Successfully initialized: " + d) : (w && (a().Rokt.flushOnShoppableAdsReadyMessageQueue?.(this), Q(xe, J(g), {
      onLoad: () => {
        this._isThankYouElementLoaded = !0, this._thankYouElementOnLoadCallback && this._thankYouElementOnLoadCallback();
      },
      onError: (h) => {
        console.error("Error loading Rokt Thank You Element script:", h);
      }
    })), this.isLauncherReadyToAttach() ? this.attachLauncher(c, p, v) : (Q(Fe, B(g, U), {
      onLoad: () => {
        this.isLauncherReadyToAttach() ? this.attachLauncher(c, p, v) : console.error("Rokt object is not available after script load.");
      },
      onError: (h) => {
        console.error("Error loading Rokt launcher script:", h);
      }
    }), this.captureTiming(f.PERFORMANCE_MARKS.RoktScriptAppended)), "Successfully initialized: " + d);
  }
  process(e) {
    if (this.isTargetingDisabled() || (e.EventDataType === je && (ke(this.loggingService), this.capturePageView(e)), e.EventDataType === We && (z(), $())), !this.isKitReady())
      return "Kit not ready for forwarder: " + d;
    if (b(a().Rokt?.setLocalSessionAttribute) && (C(this.placementEventAttributeMappingLookup) || this.applyPlacementEventAttributeMapping(e), !C(this.placementEventMappingLookup))) {
      const t = te(e.EventDataType, e.EventCategory, e.EventName ?? "");
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
    return this.loggingService?.logDiagnostic(M("setUserAttribute", [e])), se(e) || (this.userAttributes[e] = t), "Successfully set user attribute for forwarder: " + d;
  }
  removeUserAttribute(e) {
    return this.loggingService?.logDiagnostic(M("removeUserAttribute", [e])), delete this.userAttributes[e], "Successfully removed user attribute for forwarder: " + d;
  }
  handleIdentityComplete(e, t) {
    return this.userAttributes = T(e.getAllUserAttributes()), this.loggingService?.logDiagnostic(M(t, Object.keys(this.userAttributes))), "Successfully called " + t + " for forwarder: " + d;
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
    const r = e.getUserIdentities ? e.getUserIdentities().userIdentities : null, s = {};
    if (r)
      for (const u of Object.keys(r)) {
        const l = r[u];
        m(l) && l.length > 0 && (s[u] = l);
      }
    const o = Object.keys(s);
    if (o.length === 0)
      return this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = void 0, Promise.resolve();
    const c = o.sort().map((u) => `${u}=${s[u]}`).join("&");
    return c === this._workspaceLastSearchedIdentitiesKey ? this._workspaceSearchInFlightPromise || Promise.resolve() : (this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = c, new Promise((u) => {
      try {
        n(t, s, (l) => {
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
   * this wrapper just gates it on the in-flight search via `Promise.race`,
   * and on a post-terminate createLauncher when the SPA needs a new instance.
   */
  selectPlacements(e) {
    const t = this.recreateLauncherIfTerminated();
    if (t) {
      const n = this._workspaceSearchInFlightPromise, r = n ? Promise.race([
        n,
        new Promise((s) => setTimeout(s, q))
      ]) : Promise.resolve();
      return Promise.all([t, r]).then(
        () => this._dispatchPlacements(e)
      );
    }
    if (this._workspaceSearchInFlightPromise) {
      const n = this._workspaceSearchInFlightPromise;
      return Promise.race([
        n,
        new Promise((r) => setTimeout(r, q))
      ]).then(() => this._dispatchPlacements(e));
    }
    return this._dispatchPlacements(e);
  }
  _dispatchPlacements(e) {
    const t = e && e.attributes || {}, r = { ...T(this.userAttributes), ...t }, s = this.filters || {}, o = s.userAttributeFilters || [], c = s.filteredUser || null, u = c ? c.getMPID() : null;
    let l;
    s ? s.filterUserAttributes ? l = s.filterUserAttributes(r, o) : l = r : (console.warn("Rokt Kit: No filters available, using user attributes"), l = r), this.userAttributes = T(l);
    const g = this._onboardingExpProvider === "Optimizely" ? this.fetchOptimizely() : {}, U = this.returnUserIdentities(c), v = this.returnLocalSessionAttributes(), w = ye(V()), p = Re(), k = this.readMpSessionId(), S = this.readMpDeviceId(), I = {
      ...U,
      ...l,
      ...g,
      ...v,
      ...w.length ? { [Ge]: JSON.stringify(w) } : {},
      ...p ? { [He]: p } : {},
      ...this.userIdentifiedInWorkspace ? { [Ye]: !0 } : {},
      ...k ? { [Ve]: k } : {},
      ...S ? { [ze]: S } : {},
      mpid: u
    }, h = { ...e, attributes: I };
    this.loggingService?.logPlacementDiagnostic(
      we(Object.keys(I))
    );
    const G = this.launcher.selectPlacements(h), pe = () => this.logSelectPlacementsEvent(I);
    return Promise.resolve(G).then((fe) => fe?.context?.sessionId?.then((me) => this.setRoktSessionId(me))).catch(() => {
    }).finally(pe), G;
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
   * Tears down the Rokt launcher and the placements it rendered.
   *
   * The kit's launcher reference is left in place so isKitReady() stays true.
   * The Web SDK clears its memoized launcher on terminate, so a later
   * createLauncher (SPA navigation) produces a new instance. The next
   * selectPlacements call re-attaches that instance. Nulling the reference
   * here would flip the kit to not-ready with no drain path for queued calls.
   */
  terminate() {
    return this.isKitReady() ? (Pe(this._launcherAttachState), this.launcher.terminate()) : (console.error("Rokt Kit: Not initialized"), Promise.resolve());
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
let y = f;
function nt() {
  return L;
}
function rt(i) {
  if (!i) {
    window.console.log("You must pass a config object to register the kit " + d);
    return;
  }
  if (!E(i)) {
    window.console.log("'config' must be an object. You passed in a " + typeof i);
    return;
  }
  E(i.kits) ? i.kits[d] = {
    constructor: y
  } : (i.kits = {}, i.kits[d] = {
    constructor: y
  }), window.console.log("Successfully registered " + d + " to your mParticle configuration");
}
typeof window < "u" && window.mParticle && a().addForwarder && a().addForwarder({
  name: d,
  constructor: y,
  getId: nt
});
export {
  rt as register
};
//# sourceMappingURL=Rokt-Kit.esm.js.map
