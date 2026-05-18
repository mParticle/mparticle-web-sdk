const l = "Rokt";
const z = "selectPlacements", Q = "apps.roktecommerce.com";
const w = {
  LOGIN: "login",
  LOGOUT: "logout",
  MODIFY_USER: "modify_user",
  IDENTIFY: "identify"
}, B = "ThankYouPageJourney", V = "rokt-launcher", q = "rokt-thank-you-element", J = "userIdentifiedInWorkspace", X = 500, T = {
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  UNHANDLED_EXCEPTION: "UNHANDLED_EXCEPTION",
  IDENTITY_REQUEST: "IDENTITY_REQUEST"
}, A = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARNING: "WARNING"
}, $ = "apps.rokt-api.com/v1/log", Z = "apps.rokt-api.com/v1/errors", ee = 10;
function a() {
  return window.mParticle;
}
function P(n, e) {
  const i = [G(n), "/wsdk/integrations/launcher.js"].join("");
  return !e || e.length === 0 ? i : i + "?extensions=" + e.join(",");
}
function U(n) {
  return [G(n), "/rokt-elements/rokt-element-thank-you.js"].join("");
}
function G(n) {
  return ["https://", typeof n < "u" ? n : "apps.rokt-api.com"].join("");
}
function C(n, e, t) {
  if (document.getElementById(n)) return;
  const i = document.head || document.body, r = document.createElement("script");
  r.id = n, r.type = "text/javascript", r.src = e, r.async = !0, r.crossOrigin = "anonymous", r.fetchPriority = "high", t?.onLoad && (r.onload = t.onLoad), t?.onError && (r.onerror = t.onError), i.appendChild(r);
}
function L(n) {
  return n != null && typeof n == "object" && Array.isArray(n) === !1;
}
function S(n) {
  if (!n)
    return [];
  try {
    return JSON.parse(n.replace(/&quot;/g, '"'));
  } catch {
    console.error("Settings string contains invalid JSON");
  }
  return [];
}
function M(n) {
  const e = n ? S(n) : [], t = [], i = [];
  let r = !1;
  for (let o = 0; o < e.length; o++) {
    const s = e[o].value;
    s === "thank-you-journey" ? (r = !0, i.push(B)) : t.push(s);
  }
  return {
    roktExtensionsQueryParams: t,
    legacyRoktExtensions: i,
    loadThankYouElement: r
  };
}
async function te(n, e) {
  const t = [];
  if (e)
    for (const i of n)
      t.push(e.use(i));
  return Promise.all(t);
}
function K(n) {
  if (!n)
    return {};
  const e = {};
  for (let t = 0; t < n.length; t++) {
    const i = n[t];
    e[i.jsmap] = i.value;
  }
  return e;
}
function D(n) {
  const e = {};
  if (!Array.isArray(n))
    return e;
  for (let t = 0; t < n.length; t++) {
    const i = n[t];
    if (!i || !p(i.value) || !p(i.map))
      continue;
    const r = i.value, o = i.map;
    e[r] || (e[r] = []), e[r].push({
      eventAttributeKey: o,
      conditions: Array.isArray(i.conditions) ? i.conditions : []
    });
  }
  return e;
}
function x(n, e, t) {
  return a().generateHash([n, e, t].join(""));
}
function I(n) {
  return n == null ? !0 : typeof n == "object" ? Object.keys(n).length === 0 : Array.isArray(n) ? n.length === 0 : !1;
}
function p(n) {
  return typeof n == "string";
}
function ie(n) {
  let i = "mParticle_wsdkv_" + a().getVersion() + "_kitv_" + "1.26.1";
  return n && (i += "_" + n), i;
}
function H(n) {
  let e = 5381;
  for (let t = 0; t < n.length; t++)
    e = (e << 5) + e + n.charCodeAt(t), e = e & e;
  return e;
}
function O(n) {
  const e = document.createElement("iframe");
  e.style.display = "none", e.setAttribute("sandbox", "allow-scripts allow-same-origin"), e.src = n, e.onload = function() {
    e.onload = null, e.parentNode && e.parentNode.removeChild(e);
  };
  const t = document.body || document.head;
  t && t.appendChild(e);
}
function Y(n, e) {
  const t = H(window.location.origin);
  if (f._allowedOriginHashes.indexOf(t) === -1 || Math.random() >= 0.1)
    return;
  const r = window.__rokt_li_guid__;
  if (!r)
    return;
  const o = window.location.href.split("?")[0].split("#")[0], s = "version=" + encodeURIComponent(e ?? "") + "&launcherInstanceGuid=" + encodeURIComponent(r) + "&pageUrl=" + encodeURIComponent(o);
  O("https://" + (n || "apps.rokt.com") + "/v1/wsdk-init/index.html?" + s), O(
    "https://" + Q + "/v1/wsdk-init/index.html?" + s + "&isControl=true"
  );
}
function ne() {
  return typeof window < "u" && !!window.ROKT_DOMAIN;
}
function re() {
  return typeof window < "u" && !!window.location?.search?.toLowerCase().includes("mp_enable_logging=true");
}
function se() {
  return typeof window < "u" ? window.location?.href : void 0;
}
function oe() {
  return typeof window < "u" ? window.navigator?.userAgent : void 0;
}
class W {
  constructor() {
    this._logCount = {};
  }
  incrementAndCheck(e) {
    const i = (this._logCount[e] || 0) + 1;
    return this._logCount[e] = i, i > ee;
  }
}
class N {
  constructor(e, t, i, r, o) {
    this._reporter = "mp-wsdk";
    const s = e?.isLoggingEnabled === !0 || e?.isLoggingEnabled === "true";
    this._integrationName = t || "", this._launcherInstanceGuid = i, this._accountId = r || null, this._rateLimiter = o || new W(), this._isEnabled = re() || ne() && s;
  }
  send(e, t, i, r, o, s) {
    if (!(!this._isEnabled || this._rateLimiter.incrementAndCheck(t)))
      try {
        const c = {
          additionalInformation: {
            message: i,
            version: this._integrationName
          },
          severity: t,
          code: r || T.UNKNOWN_ERROR,
          url: se(),
          deviceInfo: oe(),
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
        }).catch((d) => {
          console.error("ReportingTransport: Failed to send log", d), s && s(d);
        });
      } catch (c) {
        console.error("ReportingTransport: Failed to send log", c), s && s(c);
      }
  }
}
class F {
  constructor(e, t, i, r, o) {
    this._transport = new N(e, t, i, r, o), this._errorUrl = "https://" + (e?.errorUrl || Z);
  }
  report(e) {
    if (!e) return;
    const t = e.severity || A.ERROR;
    this._transport.send(this._errorUrl, t, e.message, e.code, e.stackTrace);
  }
}
class j {
  constructor(e, t, i, r, o, s) {
    this._transport = new N(e, i, r, o, s), this._loggingUrl = "https://" + (e?.loggingUrl || $), this._errorReportingService = t;
  }
  log(e) {
    e && this._transport.send(
      this._loggingUrl,
      A.INFO,
      e.message,
      e.code,
      void 0,
      (t) => {
        this._errorReportingService && this._errorReportingService.report({
          message: "LoggingService: Failed to send log: " + t.message,
          code: T.UNKNOWN_ERROR,
          severity: A.ERROR
        });
      }
    );
  }
}
const g = class g {
  constructor() {
    this.name = l, this.id = 181, this.moduleId = 181, this.isInitialized = !1, this.launcher = null, this.filters = {}, this.userAttributes = {}, this.userIdentifiedInWorkspace = !1, this.testHelpers = null, this.placementEventMappingLookup = {}, this.placementEventAttributeMappingLookup = {}, this.batchQueue = [], this.batchStreamQueue = [], this.pendingIdentityEvents = [], this.integrationName = null, this.errorReportingService = null, this.loggingService = null, this._thankYouElementOnLoadCallback = null, this._isThankYouElementLoaded = !1, this._workspaceSearchInFlightPromise = null;
  }
  // ---- Private helpers ----
  getEventAttributeValue(e, t) {
    const i = e && e.EventAttributes;
    return !i || typeof i[t] > "u" ? null : i[t];
  }
  doesEventAttributeConditionMatch(e, t) {
    if (!e || !p(e.operator))
      return !1;
    const i = e.operator.toLowerCase(), r = e.attributeValue;
    return i === "exists" ? t !== null : t == null ? !1 : i === "equals" ? String(t) === String(r) : i === "contains" ? String(t).indexOf(String(r)) !== -1 : !1;
  }
  doesEventMatchRule(e, t) {
    if (!t || !p(t.eventAttributeKey))
      return !1;
    const i = t.conditions;
    if (!Array.isArray(i))
      return !1;
    const r = this.getEventAttributeValue(e, t.eventAttributeKey);
    if (i.length === 0)
      return r !== null;
    for (let o = 0; o < i.length; o++)
      if (!this.doesEventAttributeConditionMatch(i[o], r))
        return !1;
    return !0;
  }
  applyPlacementEventAttributeMapping(e) {
    const t = Object.keys(this.placementEventAttributeMappingLookup);
    for (let i = 0; i < t.length; i++) {
      const r = t[i], o = this.placementEventAttributeMappingLookup[r];
      if (I(o))
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
    return !a().Rokt || typeof a().Rokt.getLocalSessionAttributes != "function" ? {} : I(this.placementEventMappingLookup) && I(this.placementEventAttributeMappingLookup) ? {} : a().Rokt.getLocalSessionAttributes();
  }
  replaceOtherIdentityWithEmailsha256(e) {
    const t = {};
    Object.keys(e || {}).forEach((r) => {
      const o = e[r];
      p(o) && (t[r] = o);
    });
    const i = this._mappedEmailSha256Key;
    return i && e[i] && (t[g.EMAIL_SHA256_KEY] = e[i]), i && delete t[i], t;
  }
  logSelectPlacementsEvent(e) {
    if (!window.mParticle || typeof a().logEvent != "function" || !L(e))
      return;
    const t = a().EventType.Other;
    a().logEvent(z, t, e);
  }
  buildIdentityEvent(e, t) {
    const i = t.getMPID(), r = a() && a().sessionManager && typeof a().sessionManager.getSession == "function" ? a().sessionManager.getSession() : void 0;
    return {
      event_type: e,
      data: {
        timestamp_unixtime_ms: Date.now(),
        session_uuid: r ?? void 0,
        mpid: i
      }
    };
  }
  mergePendingIdentityEvents(e) {
    if (this.pendingIdentityEvents.length === 0)
      return e;
    const t = {
      ...e,
      events: [...e.events ?? [], ...this.pendingIdentityEvents]
    };
    return this.pendingIdentityEvents = [], t;
  }
  drainBatchQueue() {
    this.batchQueue.forEach((e) => {
      this.processBatch(e);
    }), this.batchQueue = [];
  }
  processBatch(e) {
    return this.isKitReady() ? (this.sendBatchStream(this.mergePendingIdentityEvents(e)), "Successfully sent batch to forwarder: " + l) : (this.batchQueue.push(e), "Batch queued for forwarder: " + l);
  }
  sendBatchStream(e) {
    if (window.Rokt && typeof window.Rokt.__batch_stream__ == "function") {
      if (this.batchStreamQueue.length) {
        const t = this.batchStreamQueue;
        this.batchStreamQueue = [];
        for (let i = 0; i < t.length; i++)
          window.Rokt.__batch_stream__(t[i]);
      }
      window.Rokt.__batch_stream__(e);
    } else
      this.batchStreamQueue.push(e);
  }
  setRoktSessionId(e) {
    if (!(!e || typeof e != "string"))
      try {
        const t = a().getInstance();
        t && typeof t.setIntegrationAttribute == "function" && t.setIntegrationAttribute(181, {
          roktSessionId: e
        });
      } catch {
      }
  }
  attachLauncher(e, t, i = []) {
    const r = a() && a().sessionManager && typeof a().sessionManager.getSession == "function" ? a().sessionManager.getSession() : void 0, o = {
      accountId: e,
      ...t || {},
      ...r ? { mpSessionId: r } : {}
    };
    let s;
    this.isPartnerInLocalLauncherTestGroup() ? s = Promise.resolve(window.Rokt.createLocalLauncher(o)) : s = window.Rokt.createLauncher(o), s.then(async (c) => {
      await te(i, c), this.initRoktLauncher(c);
    }).catch((c) => {
      console.error("Error creating Rokt launcher:", c);
    });
  }
  initRoktLauncher(e) {
    window.Rokt && (window.Rokt.currentLauncher = e), this.launcher = e;
    const t = a().Rokt?.filters;
    t ? (this.filters = t, t.filteredUser ? this._workspaceSearchInFlightPromise = this.search(t.filteredUser) : console.warn("Rokt Kit: No filtered user has been set.")) : console.warn("Rokt Kit: No filters have been set."), this.isInitialized = !0, Y(this.domain, this.integrationName), a().Rokt.attachKit(this), this.drainBatchQueue();
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
  init(e, t, i, r, o) {
    const s = e, c = s.accountId;
    this.userAttributes = o || {}, this._onboardingExpProvider = s.onboardingExpProvider;
    const u = S(s.placementEventMapping);
    this.placementEventMappingLookup = K(u);
    const d = S(
      s.placementEventAttributeMapping
    );
    this.placementEventAttributeMappingLookup = D(d), s.hashedEmailUserIdentityType && (this._mappedEmailSha256Key = s.hashedEmailUserIdentityType.toLowerCase()), this._workspaceIdSyncApiKey = p(s.workspaceIdSyncApiKey) ? s.workspaceIdSyncApiKey : void 0;
    const m = a().Rokt?.domain, { roktExtensionsQueryParams: v, legacyRoktExtensions: E, loadThankYouElement: b } = M(
      s.roktExtensions
    ), h = {
      ...a().Rokt?.launcherOptions || {}
    };
    this.integrationName = ie(h.integrationName), h.integrationName = this.integrationName, this.domain = m;
    const k = {
      loggingUrl: s.loggingUrl,
      errorUrl: s.errorUrl,
      isLoggingEnabled: s.isLoggingEnabled === "true" || s.isLoggingEnabled === !0
    }, _ = new F(
      k,
      this.integrationName,
      window.__rokt_li_guid__,
      s.accountId
    ), R = new j(
      k,
      _,
      this.integrationName,
      window.__rokt_li_guid__,
      s.accountId
    );
    return this.errorReportingService = _, this.loggingService = R, a()._registerErrorReportingService && a()._registerErrorReportingService(_), a()._registerLoggingService && a()._registerLoggingService(R), i ? (this.testHelpers = {
      generateLauncherScript: P,
      generateThankYouElementScript: U,
      extractRoktExtensionConfig: M,
      hashEventMessage: x,
      parseSettingsString: S,
      generateMappedEventLookup: K,
      generateMappedEventAttributeLookup: D,
      sendAdBlockMeasurementSignals: Y,
      createAutoRemovedIframe: O,
      djb2: H,
      setAllowedOriginHashes: (y) => {
        g._allowedOriginHashes = y;
      },
      ReportingTransport: N,
      ErrorReportingService: F,
      LoggingService: j,
      RateLimiter: W,
      ErrorCodes: T,
      WSDKErrorSeverity: A
    }, this.attachLauncher(c, h), "Successfully initialized: " + l) : (b && (a().Rokt.flushOnShoppableAdsReadyMessageQueue?.(this), C(q, U(m), {
      onLoad: () => {
        this._isThankYouElementLoaded = !0, this._thankYouElementOnLoadCallback && this._thankYouElementOnLoadCallback();
      },
      onError: (y) => {
        console.error("Error loading Rokt Thank You Element script:", y);
      }
    })), this.isLauncherReadyToAttach() ? this.attachLauncher(c, h, E) : (C(V, P(m, v), {
      onLoad: () => {
        this.isLauncherReadyToAttach() ? this.attachLauncher(c, h, E) : console.error("Rokt object is not available after script load.");
      },
      onError: (y) => {
        console.error("Error loading Rokt launcher script:", y);
      }
    }), this.captureTiming(g.PERFORMANCE_MARKS.RoktScriptAppended)), "Successfully initialized: " + l);
  }
  process(e) {
    if (!this.isKitReady())
      return "Kit not ready for forwarder: " + l;
    if (typeof a().Rokt?.setLocalSessionAttribute == "function" && (I(this.placementEventAttributeMappingLookup) || this.applyPlacementEventAttributeMapping(e), !I(this.placementEventMappingLookup))) {
      const t = x(e.EventDataType, e.EventCategory, e.EventName ?? "");
      this.placementEventMappingLookup[String(t)] && a().Rokt.setLocalSessionAttribute?.(this.placementEventMappingLookup[String(t)], !0);
    }
    return "Successfully sent to forwarder: " + l;
  }
  setExtensionData(e) {
    if (!this.isKitReady()) {
      console.error("Rokt Kit: Not initialized");
      return;
    }
    window.Rokt.setExtensionData(e);
  }
  setUserAttribute(e, t) {
    return this.userAttributes[e] = t, "Successfully set user attribute for forwarder: " + l;
  }
  removeUserAttribute(e) {
    return delete this.userAttributes[e], "Successfully removed user attribute for forwarder: " + l;
  }
  handleIdentityComplete(e, t, i) {
    const r = e;
    return this.userAttributes = e.getAllUserAttributes(), this.pendingIdentityEvents.push(this.buildIdentityEvent(t, r)), "Successfully called " + i + " for forwarder: " + l;
  }
  onUserIdentified(e) {
    const t = e;
    return this.filters.filteredUser = t, this._workspaceSearchInFlightPromise = this.search(t), this.handleIdentityComplete(e, w.IDENTIFY, "onUserIdentified");
  }
  search(e) {
    const t = this._workspaceIdSyncApiKey;
    if (!t)
      return this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = void 0, Promise.resolve();
    const i = a().Identity?.search;
    if (typeof i != "function")
      return this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = void 0, Promise.resolve();
    const r = e.getUserIdentities ? e.getUserIdentities().userIdentities : null, o = {};
    if (r)
      for (const u of Object.keys(r)) {
        const d = r[u];
        p(d) && d.length > 0 && (o[u] = d);
      }
    const s = Object.keys(o);
    if (s.length === 0)
      return this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = void 0, Promise.resolve();
    const c = s.sort().map((u) => `${u}=${o[u]}`).join("&");
    return c === this._workspaceLastSearchedIdentitiesKey ? this._workspaceSearchInFlightPromise || Promise.resolve() : (this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = c, new Promise((u) => {
      try {
        i(t, o, (d) => {
          d?.httpCode === 200 && (this.userIdentifiedInWorkspace = !0), u();
        });
      } catch (d) {
        console.error("Rokt Kit: Workspace IDSync search failed", d), this._workspaceLastSearchedIdentitiesKey = void 0, u();
      }
    }));
  }
  onLoginComplete(e, t) {
    return this.handleIdentityComplete(e, w.LOGIN, "onLoginComplete");
  }
  onLogoutComplete(e, t) {
    return this.userIdentifiedInWorkspace = !1, this._workspaceSearchInFlightPromise = null, this._workspaceLastSearchedIdentitiesKey = void 0, this.handleIdentityComplete(e, w.LOGOUT, "onLogoutComplete");
  }
  onModifyComplete(e, t) {
    return this.handleIdentityComplete(e, w.MODIFY_USER, "onModifyComplete");
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
        new Promise((i) => setTimeout(i, X))
      ]).then(() => this._dispatchPlacements(e));
    }
    return this._dispatchPlacements(e);
  }
  _dispatchPlacements(e) {
    const t = e && e.attributes || {}, i = { ...this.userAttributes, ...t }, r = this.filters || {}, o = r.userAttributeFilters || [], s = r.filteredUser || null, c = s ? s.getMPID() : null;
    let u;
    r ? r.filterUserAttributes ? u = r.filterUserAttributes(i, o) : u = i : (console.warn("Rokt Kit: No filters available, using user attributes"), u = i), this.userAttributes = u;
    const d = this._onboardingExpProvider === "Optimizely" ? this.fetchOptimizely() : {}, m = this.returnUserIdentities(s), v = this.returnLocalSessionAttributes(), E = {
      ...m,
      ...u,
      ...d,
      ...v,
      ...this.userIdentifiedInWorkspace ? { [J]: !0 } : {},
      mpid: c
    }, b = { ...e, attributes: E }, h = this.launcher.selectPlacements(b), k = () => this.logSelectPlacementsEvent(E);
    return Promise.resolve(h).then((_) => _?.context?.sessionId?.then((R) => this.setRoktSessionId(R))).catch(() => {
    }).finally(k), h;
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
    return this.isKitReady() ? !e || !p(e) ? Promise.reject(new Error("Rokt Kit: Invalid extension name")) : this.launcher.use(e) : (console.error("Rokt Kit: Not initialized"), Promise.reject(new Error("Rokt Kit: Not initialized")));
  }
  /**
   * Registers a callback to be invoked once rokt-thank-you-element.js becomes available.
   */
  onShoppableAdsReady(e) {
    this._isThankYouElementLoaded ? e() : this._thankYouElementOnLoadCallback = e;
  }
};
g._allowedOriginHashes = [-553112570, 549508659], g.PERFORMANCE_MARKS = {
  RoktScriptAppended: "mp:RoktScriptAppended"
}, g.EMAIL_SHA256_KEY = "emailsha256";
let f = g;
function ae() {
  return 181;
}
function ce(n) {
  if (!n) {
    window.console.log("You must pass a config object to register the kit " + l);
    return;
  }
  if (!L(n)) {
    window.console.log("'config' must be an object. You passed in a " + typeof n);
    return;
  }
  L(n.kits) ? n.kits[l] = {
    constructor: f
  } : (n.kits = {}, n.kits[l] = {
    constructor: f
  }), window.console.log("Successfully registered " + l + " to your mParticle configuration");
}
typeof window < "u" && window.mParticle && a().addForwarder && a().addForwarder({
  name: l,
  constructor: f,
  getId: ae
});
export {
  ce as register
};
//# sourceMappingURL=Rokt-Kit.esm.js.map
