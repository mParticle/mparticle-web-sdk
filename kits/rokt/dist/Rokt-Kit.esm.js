const He = [
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
  "exitintentreason",
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
], ze = new Set(He);
function Te(i) {
  return ze.has(i.toLowerCase());
}
function P(i) {
  const e = {}, t = i || {}, n = Object.keys(t);
  for (let r = 0; r < n.length; r++) {
    const s = n[r];
    Te(s) || (e[s] = t[s]);
  }
  return e;
}
function h(i) {
  return typeof i == "object" && i !== null && !Array.isArray(i);
}
function d(i) {
  return typeof i == "string";
}
function v(i) {
  return typeof i == "function";
}
function T(i) {
  return i == null ? !0 : typeof i == "string" ? i.length === 0 : typeof i == "object" ? Object.keys(i).length === 0 : !1;
}
function Re(i) {
  try {
    const e = new URL(i);
    return e.search = "", e.toString();
  } catch {
    return i;
  }
}
function Z(i) {
  try {
    const e = new URL(i);
    return e.search = "", e.hash = "", e.toString();
  } catch {
    return i.split(/[?#]/)[0];
  }
}
function ke(i) {
  let e = 5381;
  for (let t = 0; t < i.length; t++)
    e = (e << 5) + e + i.charCodeAt(t), e = e & e;
  return e;
}
const p = "mp-rokt-kit", ce = "__rokt_ls_probe__";
function X() {
  try {
    return window.localStorage.setItem(ce, "1"), window.localStorage.removeItem(ce), !0;
  } catch {
    return !1;
  }
}
const w = () => window.localStorage;
function ee(i, e = w) {
  try {
    const t = e().getItem(i);
    return t === null ? null : JSON.parse(t);
  } catch {
    return null;
  }
}
function we(i, e, t = w) {
  try {
    return t().setItem(i, JSON.stringify(e)), !0;
  } catch {
    return !1;
  }
}
function $e(i, e = w) {
  try {
    e().removeItem(i);
  } catch {
  }
}
function K(i, e, t = w) {
  const n = ee(i, t);
  return h(n) ? n[e] : void 0;
}
function H(i, e, t, n = w) {
  const r = ee(i, n), s = h(r) ? { ...r } : {};
  return s[e] = t, we(i, s, n);
}
function z(i, e, t = w) {
  const n = ee(i, t);
  if (!h(n) || !(e in n))
    return;
  const r = { ...n };
  delete r[e], Object.keys(r).length === 0 ? $e(i, t) : we(i, r, t);
}
const te = "pageViews", V = "utmParams", Le = 25, Be = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
function Ce(i) {
  return i.slice(-Le);
}
function le() {
  const i = K(p, te);
  return Array.isArray(i) ? i : [];
}
function qe(i) {
  const e = Ce(i);
  for (let t = 0; t < e.length; t++) {
    const n = e.slice(t);
    if (H(p, te, n))
      return n.length;
  }
  return 0;
}
function ue() {
  z(p, te);
}
function Xe(i) {
  const e = Ce(i);
  return e.map((t, n) => {
    const r = t.activeTimeOnSite, s = r !== void 0 && Number.isFinite(r), a = e[n + 1]?.activeTimeOnSite, c = a !== void 0 && Number.isFinite(a), l = s && c ? a - r : void 0;
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
function Je(i) {
  if (K(p, V) !== void 0)
    return;
  const e = new URLSearchParams(window.location.search), t = {};
  for (const r of Be) {
    const s = e.get(r);
    s && (t[r] = s);
  }
  if (Object.keys(t).length === 0)
    return;
  const n = Object.keys(t).join(", ");
  if (!H(p, V, t)) {
    const r = X() ? "quota" : "ls_unavailable";
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
function Qe() {
  const i = K(p, V);
  return h(i) ? i : null;
}
function de() {
  z(p, V);
}
function Ze() {
  const e = document.querySelector('link[rel="canonical"]')?.href;
  if (e)
    return Re(e);
}
const $ = [
  {
    accountId: "2919171670744024290",
    pathname: "/checkout",
    targetPageIdentifier: "prod.rokt.conf",
    attributeKeys: [
      "email",
      "customertype",
      "firstname",
      "lastname"
    ],
    optionalAttributeKeys: ["firstname", "lastname"],
    dispatchDelayMs: 2e4
  },
  {
    accountId: "2550745407543340151",
    pathname: "/checkout",
    targetPageIdentifier: "RoktExperience",
    attributeKeys: [
      "email",
      "firstname",
      "lastname",
      "customertype",
      "loyaltytier",
      "paymenttype",
      "ccbin"
    ],
    optionalAttributeKeys: ["loyaltytier", "paymenttype", "ccbin"],
    dispatchDelayMs: 2e4
  },
  {
    accountId: "3236704179315511296",
    pathname: "/check-out/pay",
    targetPageIdentifier: "confirmation_page",
    attributeKeys: [
      "email",
      "firstname",
      "lastname",
      "loyaltytier"
    ],
    optionalAttributeKeys: [
      "firstname",
      "lastname",
      "loyaltytier"
    ],
    dispatchDelayMs: 2e4
  },
  {
    accountId: "2192288523645376337",
    pathname: "/checkout/*/review",
    targetPageIdentifier: "ppx-ad-view-prod",
    attributeKeys: [
      "email"
    ],
    optionalAttributeKeys: [
      "email"
    ],
    dispatchDelayMs: 1e4
  },
  {
    accountId: "2074245483568304147",
    pathname: "/checkout/cart",
    targetPageIdentifier: "new_confirmation",
    attributeKeys: [
      "email",
      "showPlacement",
      "post_purchase_variant",
      "has_groupon_banner"
    ],
    optionalAttributeKeys: [
      "showPlacement",
      "post_purchase_variant",
      "has_groupon_banner"
    ],
    preselectAttributeOverrides: {
      showPlacement: "rokt",
      post_purchase_variant: "treatment",
      has_groupon_banner: "false"
    }
  },
  {
    accountId: "3316822094627160064",
    pathname: "/cart/review",
    targetPageIdentifier: "prod.rokt.photo",
    attributeKeys: [
      "emailsha256"
    ],
    dispatchDelayMs: 1e3
  }
], et = 6e4;
function tt(i) {
  return h(i) && typeof i.expiresAt == "number" && h(i.attributes);
}
function it(i, e) {
  return `activePreselect:${i}:${e}`;
}
function nt(i) {
  const e = K(p, i);
  return tt(e) ? e : null;
}
function rt(i, e) {
  H(p, i, {
    expiresAt: Date.now() + et,
    attributes: e
  });
}
const st = 5 * 6e4;
function Y() {
  return window.sessionStorage;
}
function ot(i) {
  return h(i) && typeof i.expiresAt == "number" && d(i.pathname) && d(i.identifier) && h(i.attributes) && d(i.mpid);
}
function ie(i) {
  return `pendingPreselect:${i}`;
}
function at(i) {
  const e = ie(i), t = K(p, e, Y);
  return ot(t) ? t.expiresAt <= Date.now() ? (z(p, e, Y), null) : t : null;
}
function ct(i, e, t, n, r) {
  return H(
    p,
    ie(i),
    {
      expiresAt: Date.now() + st,
      pathname: e,
      identifier: t,
      attributes: n,
      mpid: r
    },
    Y
  );
}
function D(i) {
  z(p, ie(i), Y);
}
function S(i, e) {
  const t = {
    fired: "PRESELECT_FIRED",
    missed: "PRESELECT_MISSED",
    queued: "PRESELECT_QUEUED",
    skipped: "PRESELECT_SKIPPED"
  };
  return {
    message: `Rokt Kit: preselect ${i} [reason=${e}]`,
    code: t[i]
  };
}
function lt(i, e) {
  if (!i.includes("*"))
    return i === e;
  const t = i.split("/"), n = e.split("/");
  return t.length !== n.length ? !1 : t.every(
    (r, s) => r === "*" ? n[s] !== "" : r === n[s]
  );
}
const Ne = {};
function W(i) {
  return i === Ne;
}
function ne(i, e) {
  if (i)
    return $.find(
      (t) => t.accountId === i && lt(t.pathname, e)
    );
}
function J(i, e) {
  if (!(!i || !d(e)))
    return $.find((t) => t.accountId === i && t.targetPageIdentifier === e);
}
function De(i, e) {
  if (!e)
    return i;
  const t = new Set(Object.keys(e).map((r) => r.toLowerCase())), n = {};
  for (const [r, s] of Object.entries(i))
    t.has(r.toLowerCase()) || (n[r] = s);
  return { ...n, ...e };
}
function ut(i) {
  const e = Object.keys(i.preselectAttributeOverrides ?? {});
  return [...i.attributeKeys, ...e.filter((t) => !i.attributeKeys.includes(t))];
}
function dt(i) {
  return i ? $.some((e) => e.accountId === i) : !1;
}
function ht(i, e, t = window.location.pathname) {
  if (i.pending.some((r) => r.pathname === t && !W(r.event)))
    return;
  const n = i.scheduledDispatch;
  n && n.pathname === t && !W(n.event) || re(i, e, Ne, t);
}
function ft(i, e) {
  return i ? $.some((t) => t.accountId === i && t.attributeKeys.includes(e)) : !1;
}
function gt() {
  return { pending: [] };
}
function Oe(i) {
  i.dispatchTimer !== void 0 && (clearTimeout(i.dispatchTimer), i.dispatchTimer = void 0, i.scheduledDispatch = void 0);
}
function U(i, e) {
  const t = i.pending.findIndex((n) => n.pathname === e.pathname);
  if (t >= 0) {
    if (W(e.event) && !W(i.pending[t].event))
      return;
    i.pending[t] = e;
    return;
  }
  i.pending.push(e);
}
function j(i) {
  if (!i?.getUserIdentities)
    return !1;
  const e = i.getUserIdentities().userIdentities;
  return e ? Object.keys(e).some((t) => {
    const n = e[t];
    return d(n) && n.length > 0;
  }) : !1;
}
function O(i) {
  const e = i?.getMPID?.();
  return e == null ? null : String(e);
}
function Ue(i, e) {
  const t = new Set((i.optionalAttributeKeys ?? []).map((n) => n.toLowerCase()));
  return i.attributeKeys.filter((n) => !t.has(n.toLowerCase()) && T(e[n]));
}
function Ke(i, e, t) {
  const n = i.filteredUser?.getAllUserAttributes?.() || {}, r = {};
  for (const s of t.attributeKeys) {
    const o = i.getEventAttributeValue(e, s), a = T(o) ? i.userAttributes[s] ?? n[s] : o;
    T(a) || (r[s] = a);
  }
  return {
    collected: r,
    missingKeys: Ue(t, r)
  };
}
function pt(i, e) {
  Promise.resolve(i.selectPlacements(e)).catch((t) => {
    const n = t instanceof Error ? t.message : String(t);
    i.log({
      message: `Rokt Kit: Preselect selectPlacements call failed: ${n}`,
      code: "PRESELECT_DISPATCH_FAILED"
    });
  });
}
function xe(i, e, t, n, r, s) {
  const o = it(e, t), a = nt(o), c = De(
    r,
    J(e, n)?.preselectAttributeOverrides
  ), l = !!a && JSON.stringify(a.attributes) === JSON.stringify(c);
  if (a && a.expiresAt > Date.now() && l) {
    i.logPlacementDiagnostic(S("skipped", "active_preselection"));
    return;
  }
  rt(o, c), i.logPlacementDiagnostic(S("fired", s)), pt(i, { attributes: r, preselect: !0, identifier: n, omitUrl: !0 });
}
function mt(i, e) {
  if (!e.accountId || !e.isKitReady())
    return;
  const t = at(e.accountId);
  if (!t)
    return;
  if (i.pending.some((o) => o.pathname === t.pathname)) {
    D(e.accountId);
    return;
  }
  if (!e.isPreselectionEnabled()) {
    D(e.accountId);
    return;
  }
  if (!j(e.filteredUser) || (D(e.accountId), O(e.filteredUser) !== t.mpid))
    return;
  const n = ne(e.accountId, t.pathname);
  if (!n || n.targetPageIdentifier !== t.identifier)
    return;
  const r = P(t.attributes), s = Ue(n, r);
  if (s.length > 0) {
    for (const o of s)
      e.logPlacementDiagnostic(S("missed", `missing_persisted_attribute:${o}`));
    return;
  }
  xe(e, e.accountId, t.identifier, t.identifier, r, "recovered");
}
function re(i, e, t, n = window.location.pathname, r) {
  Oe(i);
  const s = ne(e.accountId, n);
  if (s && !(r !== void 0 && O(e.filteredUser) !== r)) {
    if (!e.isKitReady()) {
      const o = [], a = O(e.filteredUser);
      if (e.accountId && a && j(e.filteredUser)) {
        const { collected: c, missingKeys: l } = Ke(e, t, s);
        if (l.length === 0) {
          const f = P(c);
          ct(
            e.accountId,
            n,
            s.targetPageIdentifier,
            f,
            a
          ) || o.push(S("queued", "persist_failed"));
        }
      }
      U(i, { event: t, pathname: n, storedDiagnostics: o, triggeringUserId: r });
      return;
    }
    if (e.isPreselectionEnabled()) {
      if (!j(e.filteredUser)) {
        e.logPlacementDiagnostic(S("missed", "no_valid_identity")), U(i, { event: t, pathname: n, triggeringUserId: r });
        return;
      }
      if (s.dispatchDelayMs !== void 0) {
        const o = O(e.filteredUser);
        i.scheduledDispatch = { event: t, pathname: n }, i.dispatchTimer = setTimeout(() => {
          i.dispatchTimer = void 0, i.scheduledDispatch = void 0, _t(i, e.getCurrentHost?.() ?? e, t, n, o);
        }, s.dispatchDelayMs);
        return;
      }
      Me(i, e, t, n, s, r);
    }
  }
}
function _t(i, e, t, n, r) {
  const s = ne(e.accountId, n);
  if (!(!s || e.isTargetingDisabled?.())) {
    if (!e.isKitReady()) {
      U(i, { event: t, pathname: n, triggeringUserId: r });
      return;
    }
    if (e.isPreselectionEnabled()) {
      if (!j(e.filteredUser)) {
        e.logPlacementDiagnostic(S("missed", "no_valid_identity")), U(i, { event: t, pathname: n, triggeringUserId: r });
        return;
      }
      O(e.filteredUser) === r && Me(i, e, t, n, s, r);
    }
  }
}
function Me(i, e, t, n, r, s) {
  const { collected: o, missingKeys: a } = Ke(e, t, r);
  if (a.length > 0) {
    for (const c of a)
      e.logPlacementDiagnostic(S("missed", `missing_attribute:${c}`));
    U(i, { event: t, pathname: n, triggeringUserId: s });
    return;
  }
  xe(e, e.accountId || "", n, r.targetPageIdentifier, o, "fired");
}
function Et(i, e, t = window.location.pathname) {
  if (mt(i, e), i.pending.length === 0)
    return;
  const n = i.pending;
  i.pending = [], n.forEach(({ event: r, pathname: s, storedDiagnostics: o, triggeringUserId: a }) => {
    s === t && (e.isKitReady() && e.isPreselectionEnabled() && o?.forEach((c) => e.logPlacementDiagnostic(c)), re(i, e, r, s, a));
  });
}
function It() {
  return {
    context: null,
    lifecycle: "idle",
    recreateInFlight: null
  };
}
function yt(i, e) {
  i.context = {
    accountId: e.accountId,
    launcherOptions: { ...e.launcherOptions },
    legacyRoktExtensions: [...e.legacyRoktExtensions]
  };
}
function bt(i) {
  i.lifecycle = "attached";
}
function At(i) {
  i.lifecycle !== "idle" && (i.lifecycle = "terminated");
}
function St(i) {
  i.lifecycle = "terminated";
}
function vt(i) {
  i.context = null, i.lifecycle = "idle", i.recreateInFlight = null;
}
function Pt(i, e, t) {
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
const g = "Rokt", M = 181, Tt = "selectPlacements", Rt = "apps.roktecommerce.com", kt = 0.1, wt = "ThankYouPageJourney", Lt = "rokt-launcher", Ct = "rokt-thank-you-element", Nt = "userIdentifiedInWorkspace", Dt = 3, Ot = 2, Ut = "page_events", Kt = "page_view_attributes", xt = "mparticle_session_id", Mt = "mparticle_device_id", he = "rokt:intent", fe = "LEAD_CAPTURE_SUBMITTED", q = "exit-intent", Ft = [
  "3479519924056514560",
  "3484183287406608384",
  "3198447216177237634",
  "3292347205549055462"
], Vt = "exit-intent-placement", ge = 500, se = {
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  UNHANDLED_EXCEPTION: "UNHANDLED_EXCEPTION",
  IDENTITY_REQUEST: "IDENTITY_REQUEST",
  LOG_DELIVERY_FAILURE: "LOG_DELIVERY_FAILURE"
}, R = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARNING: "WARNING"
}, Yt = "apps.rokt-api.com", Wt = "/v1/log", jt = "/v1/errors", Gt = 10;
function u() {
  return window.mParticle;
}
function pe(i, e) {
  const n = [B(i), "/wsdk/integrations/launcher.js"].join("");
  return !e || e.length === 0 ? n : n + "?extensions=" + e.join(",");
}
function me(i) {
  return [B(i), "/rokt-elements/rokt-element-thank-you.js"].join("");
}
function B(i) {
  const e = i !== void 0 ? i : Yt;
  return e.includes("://") ? e.replace(/\/+$/, "") : ["https://", e].join("");
}
function Fe(i, e, t) {
  if (i)
    return i.startsWith("http://") || i.startsWith("https://") ? i : "https://" + i;
  const r = e?.includes("://") && !/^https?:\/\//i.test(e) ? void 0 : e;
  return B(r) + t;
}
function _e(i, e, t) {
  if (document.getElementById(i)) return;
  const n = document.head || document.body, r = document.createElement("script");
  r.id = i, r.type = "text/javascript", r.src = e, r.async = !0, r.crossOrigin = "anonymous", r.fetchPriority = "high", t?.onLoad && (r.onload = t.onLoad), t?.onError && (r.onerror = t.onError), n.appendChild(r);
}
function F(i) {
  if (!i)
    return [];
  try {
    return JSON.parse(i.replace(/&quot;/g, '"'));
  } catch {
    console.error("Settings string contains invalid JSON");
  }
  return [];
}
function Ee(i) {
  const e = i ? F(i) : [], t = [], n = [];
  let r = !1;
  for (let s = 0; s < e.length; s++) {
    const o = e[s].value;
    o === "thank-you-journey" ? (r = !0, n.push(wt)) : t.push(o);
  }
  return {
    roktExtensionsQueryParams: t,
    legacyRoktExtensions: n,
    loadThankYouElement: r
  };
}
async function Ht(i, e) {
  const t = [];
  if (e)
    for (const n of i)
      t.push(e.use(n));
  return Promise.all(t);
}
function Ie(i) {
  if (!i)
    return {};
  const e = {};
  for (let t = 0; t < i.length; t++) {
    const n = i[t];
    e[n.jsmap] = n.value;
  }
  return e;
}
function ye(i) {
  const e = {};
  if (!Array.isArray(i))
    return e;
  for (let t = 0; t < i.length; t++) {
    const n = i[t];
    if (!n || !d(n.value) || !d(n.map))
      continue;
    const r = n.value, s = n.map;
    e[r] || (e[r] = []), e[r].push({
      eventAttributeKey: s,
      conditions: Array.isArray(n.conditions) ? n.conditions : []
    });
  }
  return e;
}
function be(i, e, t) {
  return u().generateHash([i, e, t].join(""));
}
function zt(i) {
  let n = "mParticle_wsdkv_" + u().getVersion() + "_kitv_" + "3.11.1";
  return i && (n += "_" + i), n;
}
function Ae(i) {
  return !!(i && Ft.includes(i));
}
function Q(i) {
  const e = document.createElement("iframe");
  e.style.display = "none", e.setAttribute("sandbox", "allow-scripts allow-same-origin"), e.src = i, e.onload = function() {
    e.onload = null, e.parentNode && e.parentNode.removeChild(e);
  };
  const t = document.body || document.head;
  t && t.appendChild(e);
}
function Se(i, e) {
  const t = ke(window.location.origin);
  if (k._allowedOriginHashes.indexOf(t) === -1 || Math.random() >= kt)
    return;
  const r = window.__rokt_li_guid__;
  if (!r || i && i.includes("://") && !/^https:\/\//i.test(i))
    return;
  const s = Z(window.location.href), o = "version=" + encodeURIComponent(e ?? "") + "&launcherInstanceGuid=" + encodeURIComponent(r) + "&pageUrl=" + encodeURIComponent(s), a = i ? B(i) : "https://apps.rokt.com";
  Q(a + "/v1/wsdk-init/index.html?" + o), Q(
    "https://" + Rt + "/v1/wsdk-init/index.html?" + o + "&isControl=true"
  );
}
function $t() {
  return typeof window < "u" && !!window.location?.search?.toLowerCase().includes("mp_enable_logging=true");
}
function Bt() {
  if (typeof window > "u")
    return;
  const i = window.location?.href;
  return i ? Z(i) : void 0;
}
function qt() {
  return typeof window < "u" ? window.navigator?.userAgent : void 0;
}
class Ve {
  constructor() {
    this._logCount = {};
  }
  incrementAndCheck(e) {
    const n = (this._logCount[e] || 0) + 1;
    return this._logCount[e] = n, n > Gt;
  }
}
class G {
  constructor(e, t, n, r, s) {
    this._reporter = "mp-wsdk";
    const o = e.isLoggingEnabled;
    this._integrationName = t || "", this._launcherInstanceGuid = n, this._accountId = r || null, this._rateLimiter = s || new Ve(), this._isEnabled = $t() || o;
  }
  send(e, t, n, r, s, o) {
    if (!(!this._isEnabled || this._rateLimiter.incrementAndCheck(t)))
      try {
        const a = {
          additionalInformation: {
            message: n,
            version: this._integrationName
          },
          severity: t,
          code: r || se.UNKNOWN_ERROR,
          url: Bt(),
          deviceInfo: qt(),
          stackTrace: s,
          reporter: this._reporter,
          integration: this._integrationName
        }, c = {
          Accept: "text/plain;charset=UTF-8",
          "Content-Type": "application/json",
          "rokt-launcher-version": this._integrationName,
          "rokt-wsdk-version": "joint"
        };
        this._launcherInstanceGuid && (c["rokt-launcher-instance-guid"] = this._launcherInstanceGuid), this._accountId && (c["rokt-account-id"] = this._accountId), fetch(e, {
          method: "POST",
          headers: c,
          body: JSON.stringify(a)
        }).then((l) => {
          if (!l.ok) {
            const f = new Error("HTTP " + l.status + " from log endpoint");
            throw f.statusCode = l.status, f;
          }
        }).catch((l) => {
          console.error("ReportingTransport: Failed to send log", l), o && o(l);
        });
      } catch (a) {
        console.error("ReportingTransport: Failed to send log", a), o && o(a);
      }
  }
}
class ve {
  constructor(e, t, n, r, s) {
    this._transport = new G(e, t, n, r, s), this._errorUrl = Fe(e?.errorUrl, e?.integrationDomain, jt);
  }
  report(e) {
    if (!e) return;
    const t = e.severity || R.ERROR;
    this._transport.send(this._errorUrl, t, e.message, e.code, e.stackTrace);
  }
}
class Pe {
  constructor(e, t, n, r, s, o) {
    this._transport = new G(e, n, r, s, o), this._placementDiagnosticTransport = new G(
      e,
      n,
      r,
      s
    ), this._loggingUrl = Fe(e?.loggingUrl, e?.integrationDomain, Wt), this._errorReportingService = t;
  }
  log(e) {
    e && this._send(this._transport, e);
  }
  logPlacementDiagnostic(e) {
    e && this._send(this._placementDiagnosticTransport, e);
  }
  _send(e, t) {
    e.send(
      this._loggingUrl,
      R.INFO,
      t.message,
      t.code,
      void 0,
      (n) => {
        if (this._errorReportingService) {
          const r = typeof n.statusCode == "number";
          this._errorReportingService.report({
            message: "LoggingService: Failed to send log: " + n.message,
            code: se.LOG_DELIVERY_FAILURE,
            severity: r ? R.ERROR : R.WARNING
          });
        }
      }
    );
  }
}
function Xt(i) {
  const e = Re(window.location.href), t = i.EventAttributes?.title || document.title, n = Ze(), r = i.ActiveTimeOnSite;
  return {
    pageUrl: e,
    sourceMessageId: i.SourceMessageId,
    timestamp: i.Timestamp,
    ...t ? { pageTitle: t } : {},
    ...n !== void 0 ? { canonicalUrl: n } : {},
    ...Number.isFinite(r) ? { activeTimeOnSite: r } : {}
  };
}
const b = class b {
  constructor() {
    this.name = g, this.id = M, this.moduleId = M, this.isInitialized = !1, this.launcher = null, this.filters = {}, this.userAttributes = {}, this.userIdentifiedInWorkspace = !1, this.testHelpers = null, this.placementEventMappingLookup = {}, this.placementEventAttributeMappingLookup = {}, this.integrationName = null, this.errorReportingService = null, this.loggingService = null, this._thankYouElementOnLoadCallback = null, this._isThankYouElementLoaded = !1, this._workspaceSearchInFlightPromise = null, this._launcherAttachState = It(), this._exitIntentConfig = null, this._exitIntentDispatchedForPageView = !1, this._exitIntentEnabledForAccount = !1, this._pendingInitWarnings = [], this.accountId = null, this._preselectState = gt();
  }
  // ---- Private helpers ----
  getEventAttributeValue(e, t) {
    const n = e && e.EventAttributes;
    return !n || n[t] === void 0 ? null : n[t];
  }
  doesEventAttributeConditionMatch(e, t) {
    if (!e || !d(e.operator))
      return !1;
    const n = e.operator.toLowerCase(), r = e.attributeValue;
    return n === "exists" ? t !== null : t == null ? !1 : n === "equals" ? String(t) === String(r) : n === "contains" ? String(t).indexOf(String(r)) !== -1 : !1;
  }
  doesEventMatchRule(e, t) {
    if (!t || !d(t.eventAttributeKey))
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
      if (T(s))
        continue;
      let o = !0;
      for (let a = 0; a < s.length; a++)
        if (!this.doesEventMatchRule(e, s[a])) {
          o = !1;
          break;
        }
      o && u().Rokt.setLocalSessionAttribute?.(r, !0);
    }
  }
  capturePageView(e) {
    let t;
    try {
      t = Z(window.location.href);
      const n = le(), r = Xt(e);
      n.push(r);
      const s = Math.min(n.length, Le), o = qe(n);
      if (o === 0) {
        const a = X() ? "quota" : "ls_unavailable";
        this.loggingService?.log({
          message: `Rokt Kit: Failed to persist page view for ${t} [reason: ${a}]`,
          code: "PAGE_VIEW_CAPTURE_FAILED"
        });
      } else o < s && this.loggingService?.log({
        message: `Rokt Kit: Page view storage reduced from ${s} to ${o} record(s) under quota pressure [reason: quota_eviction]`,
        code: "PAGE_VIEW_QUOTA_EVICTION"
      });
    } catch (n) {
      const r = X() ? "exception" : "ls_unavailable", s = n instanceof Error ? n.message : String(n);
      this.loggingService?.log({
        message: `Rokt Kit: Failed to capture page view for ${t}: ${s} [reason: ${r}]`,
        code: "PAGE_VIEW_CAPTURE_FAILED"
      });
    }
  }
  isPreselectionEnabled() {
    return this.launcher?.enablePreselection === !0;
  }
  buildCacheMatchKeys(e) {
    if (!this.isPreselectionEnabled())
      return;
    const t = J(this.accountId, e);
    if (t)
      return ut(t);
  }
  buildPreselectAttributeOverrides(e) {
    if (!this.isPreselectionEnabled())
      return;
    const t = J(this.accountId, e)?.preselectAttributeOverrides, n = this.filters || {};
    if (!t || !n.filterUserAttributes)
      return t;
    const r = n.userAttributeFilters || [];
    return n.filterUserAttributes(t, r);
  }
  buildPreselectHost() {
    return {
      accountId: this.accountId,
      filteredUser: this.filters.filteredUser,
      userAttributes: this.userAttributes,
      isKitReady: () => this.isKitReady(),
      isPreselectionEnabled: () => this.isPreselectionEnabled(),
      getEventAttributeValue: (e, t) => this.getEventAttributeValue(e, t),
      logPlacementDiagnostic: (e) => this.loggingService?.logPlacementDiagnostic(e),
      log: (e) => this.loggingService?.log(e),
      selectPlacements: (e) => this.selectPlacements(e),
      getCurrentHost: () => this.buildPreselectHost(),
      isTargetingDisabled: () => this.isTargetingDisabled()
    };
  }
  flushPendingPreselectDispatches() {
    Et(this._preselectState, this.buildPreselectHost());
  }
  isLauncherReadyToAttach() {
    return !!window.Rokt && v(window.Rokt.createLauncher);
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
    return !u().Rokt || typeof u().Rokt.getLocalSessionAttributes != "function" ? {} : u().Rokt.getLocalSessionAttributes();
  }
  replaceOtherIdentityWithEmailsha256(e) {
    const t = { ...e || {} }, n = this._mappedEmailSha256Key;
    return n && e[n] && (t[b.EMAIL_SHA256_KEY] = e[n]), n && delete t[n], t;
  }
  logSelectPlacementsEvent(e) {
    if (!window.mParticle || typeof u().logEvent != "function" || !h(e))
      return;
    const t = u().EventType.Other;
    u().logEvent(Tt, t, e);
  }
  setRoktSessionId(e) {
    if (!(!e || typeof e != "string"))
      try {
        const t = u().getInstance();
        t && v(t.setIntegrationAttribute) && t.setIntegrationAttribute(M, {
          roktSessionId: e
        });
      } catch {
      }
  }
  readMpSessionId() {
    const e = u()?.sessionManager, t = e?.getSessionId ?? e?.getSession;
    if (v(t))
      return t.call(e) || void 0;
  }
  readMpDeviceId() {
    return u()?.getDeviceId?.() || void 0;
  }
  attachLauncher(e, t, n = []) {
    yt(this._launcherAttachState, {
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
      await Ht([...n], o), this.initRoktLauncher(o);
    }).catch((o) => {
      const a = this._launcherAttachState.lifecycle === "attached";
      if (St(this._launcherAttachState), !a) {
        const c = o instanceof Error ? o.message : String(o);
        this.loggingService?.log({
          message: `Rokt Kit: Failed to attach Rokt launcher: ${c}`,
          code: "LAUNCHER_ATTACH_FAILED"
        });
      }
      console.error("Error creating Rokt launcher:", o);
    });
  }
  recreateLauncherIfTerminated() {
    return Pt(
      this._launcherAttachState,
      this.isLauncherReadyToAttach(),
      (e) => this.attachLauncher(e.accountId, e.launcherOptions, e.legacyRoktExtensions)
    );
  }
  initRoktLauncher(e) {
    window.Rokt && (window.Rokt.currentLauncher = e), this.launcher = e, bt(this._launcherAttachState);
    const t = u().Rokt?.filters;
    t ? (this.filters = t, t.filteredUser ? this._workspaceSearchInFlightPromise = this.search(t.filteredUser) : console.warn("Rokt Kit: No filtered user has been set.")) : console.warn("Rokt Kit: No filters have been set."), this.isInitialized = !0, Se(this.domain, this.integrationName), u().Rokt.attachKit(this), this.pushExitIntentExtensionConfig(), this.flushPendingPreselectDispatches();
  }
  // Leaving the hook unset is what keeps History unpatched for workspaces that never
  // preselect.
  armPreselectPathnameTrigger() {
    this.onRouteChange = dt(this.accountId) ? () => this.evaluatePreselectPathname() : void 0;
  }
  evaluatePreselectPathname() {
    const e = window.location.pathname;
    e !== this._lastPreselectPathname && (this.isTargetingDisabled() || (this._lastPreselectPathname = e, ht(this._preselectState, this.buildPreselectHost(), e)));
  }
  fetchOptimizely() {
    const e = u()._getActiveForwarders().filter((t) => t.name === "Optimizely");
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
    return u().Rokt?.launcherOptions?.noTargeting === !0;
  }
  isPartnerInLocalLauncherTestGroup() {
    return !!(u().config && u().config.isLocalLauncherEnabled && this.isAssignedToSampleGroup());
  }
  isAssignedToSampleGroup() {
    return Math.random() > 0.5;
  }
  getEffectiveExitIntentConfig(e) {
    return Ae(e) ? {
      identifier: Vt,
      signals: {
        mouseExitTop: !0,
        scrollUpFast: !0,
        idle: !0
      }
    } : null;
  }
  applyExitIntentExtensionOverride(e, t) {
    return e ? t.includes(q) ? t : [...t, q] : t;
  }
  extractExitIntentIdentifier(e) {
    return e ? d(e.identifier) && e.identifier.length > 0 ? e.identifier : d(e.placementIdentifier) && e.placementIdentifier.length > 0 ? e.placementIdentifier : null : null;
  }
  processLeadCaptureSubmittedEvent(e) {
    if (!(e instanceof CustomEvent) || !h(e.detail))
      return;
    const t = e.detail, n = h(t.body) ? t.body : {};
    let r = d(n.email) ? n.email : void 0, s = d(n.mobile_number) ? n.mobile_number : void 0;
    if (!r || !s) {
      const I = Array.isArray(t.fields) ? t.fields : [];
      for (let A = 0; A < I.length; A += 1) {
        const m = I[A];
        if (!d(m.fieldKey) || !d(m.value))
          continue;
        const _ = m.fieldKey.toLowerCase().replace(/[^a-z]/g, "");
        !r && (_ === "email" || _ === "emailaddress") && m.value.length > 0 && (r = m.value), !s && (_ === "mobile" || _ === "mobilenumber" || _ === "phone" || _ === "phonenumber") && (s = m.value);
      }
    }
    const o = {};
    d(r) && r.length > 0 && (o.email = r), d(s) && s.length > 0 && (o.mobile_number = s);
    const a = {};
    this.mergeLeadCaptureUserAttributes(a, h(n.userAttributes) ? n.userAttributes : null), this.mergeLeadCaptureUserAttributes(
      a,
      h(t.userAttributes) ? t.userAttributes : null
    );
    const c = d(n.rclid) ? n.rclid : d(t.rclid) ? t.rclid : void 0;
    c && c.length > 0 && (a.rokt_rclid = c);
    const l = d(n.accountID) ? n.accountID : d(t.accountID) ? t.accountID : void 0;
    l && l.length > 0 && (a.rokt_account_id = l);
    const f = d(n.referralCreativeID) ? n.referralCreativeID : d(t.referralCreativeID) ? t.referralCreativeID : void 0;
    f && f.length > 0 && (a.rokt_referral_creative_id = f), this.applyIdentityCapturePayload(o, a);
  }
  isSafeLeadCaptureUserAttributeKey(e) {
    return e === "__proto__" || e === "constructor" || e === "prototype" ? !1 : /^[a-zA-Z0-9_.-]+$/.test(e);
  }
  isSupportedLeadCaptureUserAttributeValue(e) {
    return d(e) || typeof e == "number" || typeof e == "boolean" ? !0 : Array.isArray(e) ? e.every((t) => d(t)) : !1;
  }
  mergeLeadCaptureUserAttributes(e, t) {
    if (t)
      for (const [n, r] of Object.entries(t))
        this.isSafeLeadCaptureUserAttributeKey(n) && this.isSupportedLeadCaptureUserAttributeValue(r) && (e[n] = r);
  }
  applyIdentityCapturePayload(e, t) {
    const n = {}, r = e.email;
    d(r) && r.length > 0 && (n.email = r);
    const s = e.mobile_number;
    d(s) && s.length > 0 && (n.mobile_number = s);
    const o = u().Identity?.modify;
    if (v(o) && Object.keys(n).length > 0)
      try {
        o({ userIdentities: n });
      } catch (c) {
        this.loggingService?.log({
          message: "Rokt Kit: identity capture modify failed",
          code: "EXIT_INTENT_IDENTITY_MODIFY_FAILED",
          additional_info: c instanceof Error ? { errorName: c.name, errorMessage: c.message } : void 0
        });
      }
    const a = u().Identity?.getCurrentUser?.();
    for (const [c, l] of Object.entries(t))
      if (a?.setUserAttribute)
        try {
          a.setUserAttribute(c, l);
        } catch (f) {
          this.loggingService?.log({
            message: "Rokt Kit: identity capture user attribute update failed",
            code: "EXIT_INTENT_IDENTITY_SET_ATTRIBUTE_FAILED",
            additional_info: f instanceof Error ? { errorName: f.name, errorMessage: f.message, key: c } : { key: c }
          });
        }
  }
  configureExitIntentBridge(e) {
    if (this._exitIntentConfig = this.isTargetingDisabled() ? null : e, this._exitIntentDispatchedForPageView = !1, this._exitIntentListener && (window.removeEventListener(he, this._exitIntentListener), this._exitIntentListener = void 0), this._exitIntentLeadCaptureSubmittedListener && (window.removeEventListener(
      fe,
      this._exitIntentLeadCaptureSubmittedListener
    ), this._exitIntentLeadCaptureSubmittedListener = void 0), this._isIdentityCaptureBridgeEnabled(this._exitIntentConfig) && (this._exitIntentLeadCaptureSubmittedListener = (n) => {
      this.processLeadCaptureSubmittedEvent(n);
    }, window.addEventListener(
      fe,
      this._exitIntentLeadCaptureSubmittedListener
    )), !this._isExitIntentBridgeEnabled(this._exitIntentConfig))
      return;
    const t = this.extractExitIntentIdentifier(this._exitIntentConfig);
    t && (this._exitIntentListener = (n) => {
      const r = n instanceof CustomEvent && n.detail && d(n.detail.reason) ? n.detail.reason : "unknown";
      if (this._exitIntentDispatchedForPageView || !this.isKitReady() || !(r === "mouse-exit-top" || r === "scroll-up-fast" || r === "idle" || r === "leave-link"))
        return;
      this._exitIntentDispatchedForPageView = !0;
      const o = h(this._exitIntentConfig?.attributes) ? this._exitIntentConfig.attributes : {};
      try {
        const a = u().Rokt?.selectPlacements?.({
          identifier: t,
          attributes: {
            ...o,
            exitIntentReason: r
          }
        });
        Promise.resolve(a).catch(() => {
        });
      } catch {
        this._exitIntentDispatchedForPageView = !1;
        return;
      }
    }, window.addEventListener(he, this._exitIntentListener));
  }
  _isExitIntentBridgeEnabled(e) {
    return !!(e && e.enabled !== !1);
  }
  _isIdentityCaptureBridgeEnabled(e) {
    if (!this._isExitIntentBridgeEnabled(e))
      return !1;
    const t = e.identityCapture;
    return h(t) ? t.enabled === !0 : !1;
  }
  _recordInitWarning(e) {
    if (this.loggingService) {
      this.loggingService.log({ message: e, code: "EXIT_INTENT_CONFIG_INVALID" });
      return;
    }
    this._pendingInitWarnings.push(e);
  }
  _flushInitWarnings() {
    if (!(!this.loggingService || this._pendingInitWarnings.length === 0)) {
      for (let e = 0; e < this._pendingInitWarnings.length; e += 1)
        this.loggingService.log({
          message: this._pendingInitWarnings[e],
          code: "EXIT_INTENT_CONFIG_INVALID"
        });
      this._pendingInitWarnings = [];
    }
  }
  pushExitIntentExtensionConfig() {
    !this._exitIntentConfig || !v(window.Rokt?.setExtensionData) || window.Rokt.setExtensionData({
      [q]: this._exitIntentConfig
    });
  }
  captureTiming(e) {
    window && u() && u().captureTiming && e && u().captureTiming(e);
  }
  // ---- Public methods (mParticle Kit Callbacks) ----
  /**
   * Initializes the Rokt forwarder with settings from the mParticle server.
   */
  init(e, t, n, r, s) {
    const o = e, a = o.accountId;
    this._exitIntentEnabledForAccount = Ae(a);
    const c = this._exitIntentEnabledForAccount ? this.getEffectiveExitIntentConfig(a) : null;
    this._exitIntentEnabledForAccount ? this.configureExitIntentBridge(c) : this.configureExitIntentBridge(null), this.accountId = a || null, this.userAttributes = P(s), this.armPreselectPathnameTrigger(), this._onboardingExpProvider = o.onboardingExpProvider;
    const l = F(o.placementEventMapping);
    this.placementEventMappingLookup = Ie(l);
    const f = F(
      o.placementEventAttributeMapping
    );
    this.placementEventAttributeMappingLookup = ye(f), o.hashedEmailUserIdentityType && (this._mappedEmailSha256Key = o.hashedEmailUserIdentityType.toLowerCase()), this._workspaceIdSyncApiKey = d(o.workspaceIdSyncApiKey) ? o.workspaceIdSyncApiKey : void 0;
    const I = u().Rokt?.domain, { roktExtensionsQueryParams: A, legacyRoktExtensions: m, loadThankYouElement: _ } = Ee(
      o.roktExtensions
    ), x = this.applyExitIntentExtensionOverride(
      c,
      A
    ), y = {
      ...u().Rokt?.launcherOptions || {}
    };
    this.integrationName = zt(y.integrationName), y.integrationName = this.integrationName, this.domain = I;
    const L = {
      loggingUrl: o.loggingUrl,
      errorUrl: o.errorUrl,
      integrationDomain: I,
      isLoggingEnabled: u().config?.isLoggingEnabled === !0
    }, C = new ve(
      L,
      this.integrationName,
      window.__rokt_li_guid__,
      o.accountId
    ), N = new Pe(
      L,
      C,
      this.integrationName,
      window.__rokt_li_guid__,
      o.accountId
    );
    if (this.errorReportingService = C, this.loggingService = N, this._flushInitWarnings(), this.isTargetingDisabled())
      try {
        ue(), de();
      } catch (E) {
        this.errorReportingService?.report({
          message: "Rokt Kit: Failed to clear page views when targeting is disabled",
          code: "PAGE_VIEW_CAPTURE_FAILED",
          severity: R.INFO,
          stackTrace: E instanceof Error ? E.stack : void 0
        });
      }
    return u()._registerErrorReportingService && u()._registerErrorReportingService(C), u()._registerLoggingService && u()._registerLoggingService(N), n ? (this.testHelpers = {
      generateLauncherScript: pe,
      generateThankYouElementScript: me,
      extractRoktExtensionConfig: Ee,
      hashEventMessage: be,
      parseSettingsString: F,
      generateMappedEventLookup: Ie,
      generateMappedEventAttributeLookup: ye,
      sendAdBlockMeasurementSignals: Se,
      createAutoRemovedIframe: Q,
      djb2: ke,
      setAllowedOriginHashes: (E) => {
        b._allowedOriginHashes = E;
      },
      ReportingTransport: G,
      ErrorReportingService: ve,
      LoggingService: Pe,
      RateLimiter: Ve,
      ErrorCodes: se,
      WSDKErrorSeverity: R,
      resetLauncherAttachState: () => vt(this._launcherAttachState)
    }, this.attachLauncher(a, y), "Successfully initialized: " + g) : (_ && (u().Rokt.flushOnShoppableAdsReadyMessageQueue?.(this), _e(Ct, me(I), {
      onLoad: () => {
        this._isThankYouElementLoaded = !0, this._thankYouElementOnLoadCallback && this._thankYouElementOnLoadCallback();
      },
      onError: (E) => {
        console.error("Error loading Rokt Thank You Element script:", E);
      }
    })), this.isLauncherReadyToAttach() ? this.attachLauncher(a, y, m) : (_e(Lt, pe(I, x), {
      onLoad: () => {
        this.isLauncherReadyToAttach() ? this.attachLauncher(a, y, m) : console.error("Rokt object is not available after script load.");
      },
      onError: (E) => {
        console.error("Error loading Rokt launcher script:", E);
      }
    }), this.captureTiming(b.PERFORMANCE_MARKS.RoktScriptAppended)), "Successfully initialized: " + g);
  }
  process(e) {
    if (this.isTargetingDisabled() || (e.EventDataType === Dt && (this._exitIntentEnabledForAccount && (this._exitIntentDispatchedForPageView = !1), Je(this.loggingService), this.capturePageView(e), re(this._preselectState, this.buildPreselectHost(), e)), e.EventDataType === Ot && (ue(), de(), this.accountId && D(this.accountId), Oe(this._preselectState))), !this.isKitReady())
      return "Kit not ready for forwarder: " + g;
    if (v(u().Rokt?.setLocalSessionAttribute) && (T(this.placementEventAttributeMappingLookup) || this.applyPlacementEventAttributeMapping(e), !T(this.placementEventMappingLookup))) {
      const t = be(e.EventDataType, e.EventCategory, e.EventName ?? "");
      this.placementEventMappingLookup[String(t)] && u().Rokt.setLocalSessionAttribute?.(this.placementEventMappingLookup[String(t)], !0);
    }
    return "Successfully sent to forwarder: " + g;
  }
  setExtensionData(e) {
    if (!this.isKitReady()) {
      console.error("Rokt Kit: Not initialized");
      return;
    }
    window.Rokt.setExtensionData(e);
  }
  setUserAttribute(e, t) {
    return Te(e) || (this.userAttributes[e] = t), ft(this.accountId, e) && this.flushPendingPreselectDispatches(), "Successfully set user attribute for forwarder: " + g;
  }
  removeUserAttribute(e) {
    return delete this.userAttributes[e], "Successfully removed user attribute for forwarder: " + g;
  }
  handleIdentityComplete(e, t) {
    return this.userAttributes = P(e.getAllUserAttributes()), "Successfully called " + t + " for forwarder: " + g;
  }
  onUserIdentified(e) {
    const t = e;
    this.filters.filteredUser = t, this._workspaceSearchInFlightPromise = this.search(t);
    const n = this.handleIdentityComplete(e, "onUserIdentified");
    return this.flushPendingPreselectDispatches(), n;
  }
  search(e) {
    const t = this._workspaceIdSyncApiKey;
    if (!t)
      return this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = void 0, Promise.resolve();
    const n = u().Identity?.search;
    if (typeof n != "function")
      return this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = void 0, Promise.resolve();
    const r = e.getUserIdentities ? e.getUserIdentities().userIdentities : null, s = {};
    if (r)
      for (const c of Object.keys(r)) {
        const l = r[c];
        d(l) && l.length > 0 && (s[c] = l);
      }
    const o = Object.keys(s);
    if (o.length === 0)
      return this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = void 0, Promise.resolve();
    const a = o.sort().map((c) => `${c}=${s[c]}`).join("&");
    return a === this._workspaceLastSearchedIdentitiesKey ? this._workspaceSearchInFlightPromise || Promise.resolve() : (this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = a, new Promise((c) => {
      try {
        n(t, s, (l) => {
          l?.httpCode === 200 && (this.userIdentifiedInWorkspace = !0), c();
        });
      } catch (l) {
        console.error("Rokt Kit: Workspace IDSync search failed", l), this._workspaceLastSearchedIdentitiesKey = void 0, c();
      }
    }));
  }
  onLoginComplete(e, t) {
    return this.handleIdentityComplete(e, "onLoginComplete");
  }
  onLogoutComplete(e, t) {
    return this.userIdentifiedInWorkspace = !1, this._workspaceSearchInFlightPromise = null, this._workspaceLastSearchedIdentitiesKey = void 0, this.accountId && D(this.accountId), this.handleIdentityComplete(e, "onLogoutComplete");
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
        new Promise((s) => setTimeout(s, ge))
      ]) : Promise.resolve();
      return Promise.all([t, r]).then(
        () => this._dispatchPlacements(e)
      );
    }
    if (this._workspaceSearchInFlightPromise) {
      const n = this._workspaceSearchInFlightPromise;
      return Promise.race([
        n,
        new Promise((r) => setTimeout(r, ge))
      ]).then(() => this._dispatchPlacements(e));
    }
    return this._dispatchPlacements(e);
  }
  _dispatchPlacements(e) {
    const t = e && e.attributes || {}, r = { ...P(this.userAttributes), ...t }, s = this.filters || {}, o = s.userAttributeFilters || [], a = s.filteredUser || null, c = a ? a.getMPID() : null;
    let l;
    s ? s.filterUserAttributes ? l = s.filterUserAttributes(r, o) : l = r : (console.warn("Rokt Kit: No filters available, using user attributes"), l = r), this.userAttributes = P(l);
    const f = this._onboardingExpProvider === "Optimizely" ? this.fetchOptimizely() : {}, I = this.returnUserIdentities(a), A = this.returnLocalSessionAttributes(), m = Xe(le()), _ = Qe(), x = this.readMpSessionId(), y = this.readMpDeviceId(), L = typeof e.identifier == "string" ? e.identifier : void 0, C = e.preselect === !0 ? De(l, this.buildPreselectAttributeOverrides(L)) : l, N = {
      ...I,
      ...C,
      ...f,
      ...A,
      ...m.length ? { [Ut]: JSON.stringify(m) } : {},
      ..._ ? { [Kt]: _ } : {},
      ...this.userIdentifiedInWorkspace ? { [Nt]: !0 } : {},
      ...x ? { [xt]: x } : {},
      ...y ? { [Mt]: y } : {},
      mpid: c
    }, E = this.buildCacheMatchKeys(L), Ye = {
      ...e,
      attributes: N,
      ...E !== void 0 ? { cacheMatchKeys: E } : {}
    }, oe = this.launcher.selectPlacements(Ye), ae = e.preselect === !0, We = () => {
      ae || this.logSelectPlacementsEvent(N);
    };
    return Promise.resolve(oe).then((je) => {
      if (!ae)
        return je?.context?.sessionId?.then((Ge) => this.setRoktSessionId(Ge));
    }).catch(() => {
    }).finally(We), oe;
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
    return this.isKitReady() ? !e || !d(e) ? Promise.reject(new Error("Rokt Kit: Invalid extension name")) : this.launcher.use(e) : (console.error("Rokt Kit: Not initialized"), Promise.reject(new Error("Rokt Kit: Not initialized")));
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
    return this.isKitReady() ? (At(this._launcherAttachState), this.launcher.terminate()) : (console.error("Rokt Kit: Not initialized"), Promise.resolve());
  }
  /**
   * Registers a callback to be invoked once rokt-thank-you-element.js becomes available.
   */
  onShoppableAdsReady(e) {
    this._isThankYouElementLoaded ? e() : this._thankYouElementOnLoadCallback = e;
  }
};
b._allowedOriginHashes = [-553112570, 549508659], b.PERFORMANCE_MARKS = {
  RoktScriptAppended: "mp:RoktScriptAppended"
}, b.EMAIL_SHA256_KEY = "emailsha256";
let k = b;
function Jt() {
  return M;
}
function Qt(i) {
  if (!i) {
    window.console.log("You must pass a config object to register the kit " + g);
    return;
  }
  if (!h(i)) {
    window.console.log("'config' must be an object. You passed in a " + typeof i);
    return;
  }
  h(i.kits) ? i.kits[g] = {
    constructor: k
  } : (i.kits = {}, i.kits[g] = {
    constructor: k
  }), window.console.log("Successfully registered " + g + " to your mParticle configuration");
}
typeof window < "u" && window.mParticle && u().addForwarder && u().addForwarder({
  name: g,
  constructor: k,
  getId: Jt
});
export {
  Qt as register
};
//# sourceMappingURL=Rokt-Kit.esm.js.map
