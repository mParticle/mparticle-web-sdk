const Oi = [
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
  "rokt.preselecttrigger",
  // PRESELECT_TRIGGER_ATTRIBUTE: describes one speculative call only
  "shippingaddress1",
  "shippingcity",
  "shippingcountry",
  "shippingmethod",
  "shippingstate",
  "shippingzipcode",
  "totalprice"
], Ki = new Set(Oi);
function Qt(t) {
  return Ki.has(t.toLowerCase());
}
function Y(t) {
  const e = {}, i = t || {}, n = Object.keys(i);
  for (let r = 0; r < n.length; r++) {
    const s = n[r];
    Qt(s) || (e[s] = i[s]);
  }
  return e;
}
function I(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function m(t) {
  return typeof t == "string";
}
function $(t) {
  return typeof t == "function";
}
function Zt(t) {
  try {
    return JSON.parse(t.replace(/&quot;/g, '"'));
  } catch {
    return;
  }
}
function T(t) {
  return t == null ? !0 : typeof t == "string" ? t.length === 0 : typeof t == "object" ? Object.keys(t).length === 0 : !1;
}
function O(t, e) {
  return Object.prototype.hasOwnProperty.call(t, e) ? t[e] : void 0;
}
function ei(t) {
  const e = ti();
  if (e)
    return e(t, "full");
  const i = t.indexOf("#"), n = i === -1 ? "" : t.slice(i);
  return (i === -1 ? t : t.slice(0, i)).split("?")[0] + n;
}
function ze(t) {
  const e = ti();
  return e ? e(t, "path") : t.split(/[?#]/)[0];
}
function ti() {
  const t = window.mParticle;
  return t && typeof t._cleanUrl == "function" ? t._cleanUrl : void 0;
}
function Xe(t) {
  let e = 5381;
  for (let i = 0; i < t.length; i++)
    e = (e << 5) + e + t.charCodeAt(i), e = e & e;
  return e;
}
const E = "mp-rokt-kit", Pt = "__rokt_ls_probe__";
function wt() {
  const t = /* @__PURE__ */ new Map();
  return {
    getItem: (e) => t.get(e) ?? null,
    setItem: (e, i) => {
      t.set(e, i);
    },
    removeItem: (e) => {
      t.delete(e);
    }
  };
}
let X = null;
function Ni(t) {
  t ? X || (X = { local: wt(), session: wt() }) : X = null;
}
function Ui() {
  return X !== null;
}
const W = () => X?.local ?? window.localStorage, D = () => X?.session ?? window.sessionStorage;
function Ne() {
  try {
    const t = W();
    return t.setItem(Pt, "1"), t.removeItem(Pt), !0;
  } catch {
    return !1;
  }
}
function be(t, e = W) {
  try {
    const i = e().getItem(t);
    return i === null ? null : JSON.parse(i);
  } catch {
    return null;
  }
}
function ii(t, e, i = W) {
  try {
    return i().setItem(t, JSON.stringify(e)), !0;
  } catch {
    return !1;
  }
}
function Ue(t, e = W) {
  try {
    e().removeItem(t);
  } catch {
  }
}
function Fi() {
  Ue(E, () => window.localStorage), Ue(E, () => window.sessionStorage);
}
function B(t, e, i = W) {
  const n = be(t, i);
  return I(n) ? n[e] : void 0;
}
function z(t, e, i, n = W) {
  const r = be(t, n), s = I(r) ? { ...r } : {};
  return s[e] = i, ii(t, s, n);
}
function ni(t, e, i) {
  Object.keys(e).length === 0 ? Ue(t, i) : ii(t, e, i);
}
function de(t, e, i = W) {
  const n = be(t, i);
  if (!I(n) || !(e in n))
    return;
  const r = { ...n };
  delete r[e], ni(t, r, i);
}
function ce(t, e, i = W) {
  const n = be(t, i);
  if (!I(n))
    return;
  const r = Object.keys(n).filter((o) => o.startsWith(e));
  if (r.length === 0)
    return;
  const s = { ...n };
  r.forEach((o) => delete s[o]), ni(t, s, i);
}
const qe = "pageViews", Ee = "utmParams", ri = 25, Mi = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
function si(t) {
  return t.slice(-ri);
}
function St() {
  const t = B(E, qe);
  return Array.isArray(t) ? t : [];
}
function xi(t) {
  const e = si(t);
  for (let i = 0; i < e.length; i++) {
    const n = e.slice(i);
    if (z(E, qe, n))
      return n.length;
  }
  return 0;
}
function De() {
  de(E, qe);
}
function Vi(t) {
  const e = si(t);
  return e.map((i, n) => {
    const r = i.activeTimeOnSite, s = r !== void 0 && Number.isFinite(r), a = e[n + 1]?.activeTimeOnSite, c = a !== void 0 && Number.isFinite(a), l = s && c ? a - r : void 0;
    return {
      pageUrl: i.pageUrl,
      sourceMessageId: i.sourceMessageId,
      timestamp: i.timestamp,
      ...i.pageTitle !== void 0 ? { pageTitle: i.pageTitle } : {},
      ...i.canonicalUrl !== void 0 ? { canonicalUrl: i.canonicalUrl } : {},
      ...s ? { activeTimeOnSite: r } : {},
      ...l !== void 0 && l >= 0 ? { activeTimeOnPage: l } : {}
    };
  });
}
function Hi(t) {
  if (B(E, Ee) !== void 0)
    return;
  const e = new URLSearchParams(window.location.search), i = {};
  for (const r of Mi) {
    const s = e.get(r);
    s && (i[r] = s);
  }
  if (Object.keys(i).length === 0)
    return;
  const n = Object.keys(i).join(", ");
  if (!z(E, Ee, i)) {
    const r = Ne() ? "quota" : "ls_unavailable";
    t?.log({
      message: `Rokt Kit: Failed to persist UTM params [reason: ${r}]`,
      code: "UTM_CAPTURE_FAILED"
    });
    return;
  }
  t?.log({
    message: `Rokt Kit: Captured UTM params [${n}]`,
    code: "UTM_CAPTURE_SUCCESS"
  });
}
function Wi() {
  const t = B(E, Ee);
  return I(t) ? t : null;
}
function Ce() {
  de(E, Ee);
}
function ji() {
  const e = document.querySelector('link[rel="canonical"]')?.href;
  if (e)
    return ei(e);
}
const $i = [
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
    identityKeys: ["email"],
    dispatchDelayMs: 5e3,
    readEmailInput: !0
  },
  {
    accountId: "2550745407543340151",
    pathname: "/checkout",
    targetPageIdentifier: "RoktExperience",
    attributeKeys: [
      "email",
      "firstname",
      "customertype",
      "loyaltytier",
      "paymenttype"
    ],
    optionalAttributeKeys: ["loyaltytier", "paymenttype"],
    dispatchDelayMs: 2e4
  },
  {
    accountId: "3236704179315511296",
    pathname: "/check-out/*",
    targetPageIdentifier: "confirmation_page",
    attributeKeys: [
      "email",
      "firstname",
      "loyaltytier"
    ],
    optionalAttributeKeys: [
      "firstname",
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
], Yi = 1, Gi = 6e4;
function C(t) {
  return Array.isArray(t) && t.every(m);
}
function Bi(t, e) {
  if (!I(e))
    return "not an object";
  const { pathname: i, targetPageIdentifier: n, attributeKeys: r, optionalAttributeKeys: s, identityKeys: o, dispatchDelayMs: a } = e, { triggerEventNames: c, releaseHoldOnRouteChange: l, readEmailInput: d } = e, u = e.preselectAttributeOverrides, p = e.widenedOptionalAttributeKeys;
  if (e.accountId !== void 0 && e.accountId !== t)
    return "accountId";
  if (!m(i) || !i.startsWith("/"))
    return "pathname";
  if (!m(n) || n === "")
    return "targetPageIdentifier";
  if (!C(r) || r.length === 0)
    return "attributeKeys";
  if (s !== void 0 && (!C(s) || !s.every((g) => r.includes(g))))
    return "optionalAttributeKeys";
  if (p !== void 0 && (!C(p) || !p.every((g) => r.includes(g))))
    return "widenedOptionalAttributeKeys";
  if (o !== void 0 && (!C(o) || o.length === 0 || !o.every((g) => r.includes(g))))
    return "identityKeys";
  if (C(p) && p.length > 0) {
    const g = (C(s) ? s : []).concat(p).map((_) => _.toLowerCase());
    if (!C(o) || o.some((_) => g.includes(_.toLowerCase())))
      return "identityKeys";
  }
  if (a !== void 0 && (!Number.isInteger(a) || a < 0 || a > Gi))
    return "dispatchDelayMs";
  if (l !== void 0 && typeof l != "boolean")
    return "releaseHoldOnRouteChange";
  if (d !== void 0 && (typeof d != "boolean" || !r.includes("email") || C(s) && s.includes("email") || // The runtime matches optional keys in any casing, so an 'Email' key would make email optional too.
  C(p) && p.some((g) => g.toLowerCase() === "email")))
    return "readEmailInput";
  if (u !== void 0 && (!I(u) || !Object.entries(u).every(
    ([g, _]) => m(_) && r.includes(g) && !(C(o) && o.includes(g))
  )))
    return "preselectAttributeOverrides";
  if (c !== void 0 && (!C(c) || c.length === 0 || c.some((g) => g === "")))
    return "triggerEventNames";
  const f = { accountId: t, pathname: i, targetPageIdentifier: n, attributeKeys: r };
  return s !== void 0 && (f.optionalAttributeKeys = s), p !== void 0 && (f.widenedOptionalAttributeKeys = p), o !== void 0 && (f.identityKeys = o), a !== void 0 && (f.dispatchDelayMs = a), l !== void 0 && (f.releaseHoldOnRouteChange = l), d !== void 0 && (f.readEmailInput = d), u !== void 0 && (f.preselectAttributeOverrides = u), c !== void 0 && (f.triggerEventNames = c), f;
}
function zi(t, e) {
  const i = Zt(e);
  if (i === void 0)
    return { error: "invalid JSON" };
  if (!I(i))
    return { error: "not an object" };
  if (i.schemaVersion !== Yi)
    return { error: "schemaVersion" };
  if (!Array.isArray(i.entries))
    return { error: "entries" };
  const n = [];
  for (let r = 0; r < i.entries.length; r++) {
    const s = Bi(t, i.entries[r]);
    if (m(s))
      return { error: `entry ${r + 1} ${s}` };
    if (n.some((o) => o.targetPageIdentifier === s.targetPageIdentifier))
      return { error: `entry ${r + 1} targetPageIdentifier` };
    n.push(s);
  }
  return { entries: n };
}
const Xi = 6e4, Je = "activePreselect:";
function qi(t) {
  return I(t) && typeof t.expiresAt == "number" && typeof t.attributesDigest == "number";
}
function oi(t, e) {
  return `${Je}${t}:${e}`;
}
function re(t) {
  const e = B(E, t, D);
  return qi(e) && e.expiresAt > Date.now() ? e : null;
}
function Ji(t, e, i = !1) {
  z(
    E,
    t,
    { expiresAt: Date.now() + Xi, attributesDigest: e, ...i ? { byEvent: !0 } : {} },
    D
  );
}
function Qi(t, e, i) {
  const n = re(t);
  n && n.attributesDigest !== i || (e && e.expiresAt > Date.now() ? z(E, t, e, D) : de(E, t, D));
}
function Tt(t) {
  ce(
    E,
    `${Je}${t}:`,
    D
  );
}
function Zi() {
  ce(E, Je);
}
const en = 5 * 6e4, ai = "pendingPreselect:";
function tn(t) {
  return I(t) && typeof t.expiresAt == "number" && m(t.pathname) && m(t.identifier) && I(t.attributes) && m(t.mpid);
}
function Qe(t) {
  return `${ai}${t}`;
}
function Ze(t) {
  const e = Qe(t), i = B(E, e, D);
  return tn(i) ? i.expiresAt <= Date.now() ? (de(E, e, D), null) : i : null;
}
function Lt(t, e, i, n, r, s = !1) {
  return z(
    E,
    Qe(t),
    {
      expiresAt: Date.now() + en,
      pathname: e,
      identifier: i,
      attributes: n,
      mpid: r,
      ...s ? { byEvent: !0 } : {}
    },
    D
  );
}
function G(t) {
  de(E, Qe(t), D);
}
function nn() {
  ce(E, ai);
}
const ci = "preselectArrival:", li = "preselectTriggerAnyTab:", rn = 30 * 6e4, Pe = 30 * 6e4, Fe = ["commit", "wallet", "frame", "checkout_step"], sn = ["triggeredAt", "identitySeenAt", "firedAt", "firedDigest", "arrivedAt", "nearMissAt"];
function j(t, e) {
  return `${ci}${t}:${e}`;
}
function ui(t, e) {
  return `${li}${t}:${e}`;
}
function et(t) {
  const e = B(E, t, D), i = {};
  if (!I(e))
    return i;
  for (const n of sn)
    typeof e[n] == "number" && (i[n] = e[n]);
  return typeof e.intentAt == "number" && Fe.includes(e.intentKind) && (i.intentAt = e.intentAt, i.intentKind = e.intentKind), i;
}
function ee(t, e) {
  return z(E, t, e, D);
}
function te(t) {
  const e = et(t);
  return e.arrivedAt === void 0 ? e : {};
}
function on(t, e, i) {
  const n = j(t, e), r = te(n), s = Date.now();
  ee(n, {
    ...r,
    triggeredAt: r.triggeredAt ?? s,
    ...i ? { identitySeenAt: r.identitySeenAt ?? s } : {}
  }), z(E, ui(t, e), {
    triggeredAt: s
  });
}
function an(t, e) {
  const i = B(E, ui(t, e));
  if (!I(i) || typeof i.triggeredAt != "number")
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < rn;
}
function cn(t, e) {
  const i = j(t, e), n = et(i);
  n.arrivedAt !== void 0 || n.nearMissAt !== void 0 || ee(i, { ...n, nearMissAt: Date.now() });
}
function ln(t, e, i) {
  const n = j(t, e), r = te(n), s = r.firedAt !== void 0 && gi(r.firedAt) ? { firedAt: r.firedAt, ...r.firedDigest !== void 0 ? { firedDigest: r.firedDigest } : {} } : void 0;
  return ee(n, di(r, { firedAt: s?.firedAt ?? Date.now(), firedDigest: i })), s;
}
function un(t, e, i, n) {
  const r = j(t, e), s = te(r);
  s.firedAt === void 0 || s.firedDigest !== n || ee(r, di(s, i));
}
function di(t, e) {
  const i = { ...t };
  return delete i.firedAt, delete i.firedDigest, e ? { ...i, firedAt: e.firedAt, ...e.firedDigest !== void 0 ? { firedDigest: e.firedDigest } : {} } : i;
}
function dn(t, e) {
  const i = te(j(t, e));
  if (i.triggeredAt === void 0)
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < Pe;
}
function fi(t, e, i) {
  const n = te(j(t, e));
  if (n.firedAt === void 0 || i !== void 0 && n.firedDigest !== void 0 && n.firedDigest !== i)
    return !1;
  const r = Date.now() - n.firedAt;
  return r >= 0 && r < Pe;
}
function fn(t, e, i, n) {
  const r = j(t, e), s = te(r);
  if (s.intentAt !== void 0 && s.intentKind !== void 0 && gn(s.intentAt)) {
    const o = Fe.indexOf(s.intentKind), a = Fe.indexOf(i);
    if (o < a || o === a && s.intentAt >= n)
      return;
  }
  ee(r, { ...s, intentAt: n, intentKind: i });
}
function gi(t) {
  const e = Date.now() - t;
  return e >= 0 && e < Pe;
}
function gn(t) {
  return gi(t);
}
function pn(t, e) {
  const i = j(t, e), n = et(i);
  if (n.arrivedAt === void 0 && ee(i, { ...n, arrivedAt: Date.now() }))
    return n;
}
function Rt(t) {
  ce(
    E,
    `${ci}${t}:`,
    D
  ), ce(E, `${li}${t}:`);
}
function y(t, e, i = {}) {
  const n = {
    fired: "PRESELECT_FIRED",
    missed: "PRESELECT_MISSED",
    queued: "PRESELECT_QUEUED",
    skipped: "PRESELECT_SKIPPED",
    held: "PRESELECT_HELD",
    identity_arrived: "PRESELECT_IDENTITY_ARRIVED",
    arrived: "PRESELECT_ARRIVED"
  }, r = Object.entries(i).map(([s, o]) => ` [${s}=${o}]`).join("");
  return {
    message: `Rokt Kit: preselect ${t} [reason=${e}]${r}`,
    code: n[t]
  };
}
const Me = /* @__PURE__ */ new Map();
function hn(t, e) {
  if (Me.delete(t), !e)
    return;
  const i = zi(t, e);
  if ("error" in i)
    return i.error;
  Me.set(t, i.entries);
}
function F(t) {
  return Me.get(t) ?? $i.filter((e) => e.accountId === t);
}
function se(t, e) {
  const i = A(t), n = A(e);
  if (!i.includes("*"))
    return i === n;
  const r = i.split("/"), s = n.split("/");
  return r.length !== s.length ? !1 : r.every(
    (o, a) => o === "*" ? s[a] !== "" : o === s[a]
  );
}
function A(t) {
  return t.length > 1 && t.endsWith("/") ? t.slice(0, -1) : t;
}
function mn(t, e) {
  const i = A(t).toLowerCase(), n = A(e).toLowerCase().split("/"), r = i.split("/").length;
  return se(i, n.join("/")) || se(i, ["", ...n.slice(2)].join("/")) || n.length > r && se(i, n.slice(0, r).join("/"));
}
const pi = {}, tt = {}, it = {}, _n = ["commit", "wallet", "checkout_step", "frame"], En = ["vendor", "label", "brand", "frame", "submit"], In = 512;
function nt(t) {
  return typeof t.source == "string" && En.includes(t.source) ? t.source : void 0;
}
function yn(t) {
  return [...new Set(F(t).map((i) => i.targetPageIdentifier))].some((i) => dn(t, i)) ? "left" : "before_entry";
}
function hi(t, e, i, n, r = {}) {
  const s = `${n}:${i}:${e.kind}`;
  if (xe.has(s)) return;
  xe.add(s);
  const o = nt(e);
  t.logPlacementDiagnostic(
    y("skipped", "intent_observed", {
      intent_kind: e.kind,
      intent_route: i,
      ...o ? { intent_source: o } : {},
      has_email: lt(t, {}),
      has_identity: K(t.filteredUser),
      ...r
    })
  );
}
function vn(t, e, i, n) {
  const r = t.accountId, s = yn(r), o = P(t.filteredUser), a = t.getCurrentUser?.(), c = o !== null && P(a) === o && a?.isLoggedIn?.() === !0, l = (v) => hi(t, e, s, n, { logged_in: c, ...v ? { cause: v } : {} });
  if (!c) return l();
  const d = F(r);
  if (d.length !== 1) return l("multiple_entries");
  if (i !== A(window.location.pathname)) return l("path_changed");
  const u = d[0];
  if (!K(t.filteredUser)) return l("no_valid_identity");
  const p = e.kind === "commit" ? "intent_commit" : "intent_wallet", { collected: f, missingKeys: g } = ge(
    t,
    p === "intent_commit" ? tt : it,
    u
  ), _ = ft(t, r, u.targetPageIdentifier, f);
  if (fi(r, u.targetPageIdentifier, _)) return l("active_preselection");
  if (g.length > 0) return l("missing_attribute");
  if (!lt(t, f, u.targetPageIdentifier)) return l("no_strict_email");
  gt(
    t,
    r,
    u.targetPageIdentifier,
    u.targetPageIdentifier,
    f,
    "intent",
    rt(p === "intent_commit" ? "intent_commit_off_entry" : "intent_wallet_off_entry", u),
    !1,
    !0,
    !1,
    void 0,
    nt(e),
    s
  );
}
function An(t) {
  const e = t.pathname;
  return typeof e == "string" && e.charAt(0) === "/" && e.length <= In ? A(e) : void 0;
}
const ne = /* @__PURE__ */ new Set(), xe = /* @__PURE__ */ new Set(), U = [];
function le(t) {
  if (t === tt) return "intent_commit";
  if (t === it) return "intent_wallet";
}
function fe(t) {
  return le(t) !== void 0;
}
function Oe(t, e = Date.now()) {
  t = A(t), U[U.length - 1]?.pathname !== t && (U.push({ pathname: t, since: e }), U.length > 8 && U.shift(), xe.clear());
}
function bn(t, e, i) {
  if (!i || !_n.includes(i.kind) || typeof i.t != "number" || !Number.isFinite(i.t))
    return;
  const n = `${i.kind}:${i.t}`;
  if (ne.has(n) || (ne.add(n), ne.size > 4096 && ne.delete(ne.values().next().value), e.isTargetingDisabled?.() || e.isForwardingAllowed?.() === !1 || !ie(e) || !e.isKitReady() || !e.isPreselectionEnabled() || !We(e.accountId)))
    return;
  Pn(e.accountId, i);
  const r = [...U].reverse().find((g) => g.since <= i.t), s = An(i) ?? r?.pathname;
  if (!s) return;
  const o = r && r.pathname === s ? r.since : 0, a = `${s}:${o}`, c = i.kind === "commit" || i.kind === "wallet";
  if (!L(e.accountId, s)) {
    c && vn(e, i, s, a);
    return;
  }
  const l = window.location.pathname, d = s === A(l);
  if (!c || !d) {
    hi(e, i, "entry", a);
    return;
  }
  t.intentSource = nt(i);
  const u = i.kind === "commit" ? "intent_commit" : "intent_wallet", p = t.scheduledDispatch;
  if (p && A(p.pathname) === A(l)) {
    st(t), Si(t, e, p, "intent_released", u);
    return;
  }
  const f = t.pending.find(
    (g) => A(g.pathname) === A(l)
  );
  if (f) {
    f.intentSeen = u, f.waitingFor === "intent" && (t.pending = t.pending.filter((g) => g !== f), Q(
      t,
      e,
      f.event,
      l,
      f.triggeringUserId,
      f.triggeredAt,
      u
    ));
    return;
  }
  Q(
    t,
    e,
    i.kind === "commit" ? tt : it,
    l,
    void 0,
    i.t
  );
}
function Pn(t, e) {
  new Set(F(t).map((n) => n.targetPageIdentifier)).forEach((n) => fn(t, n, e.kind, e.t));
}
function J(t) {
  return t === pi;
}
const we = 4, wn = "Auto Button Click", Sn = "is_auto_button_click";
function mi(t) {
  return t.EventDataType === we && t.EventName === wn || String(t.EventAttributes?.[Sn]) === "true";
}
function q(t, e) {
  return e.EventDataType === we && m(e.EventName) && !mi(e) && (t.triggerEventNames ?? []).includes(e.EventName);
}
const _i = "rokt.preselecttrigger", Ie = "preselectFormEmail", Ve = "preselectLoggedIn";
function rt(t, e) {
  return `${t}|${e.pathname}`;
}
function L(t, e) {
  if (t)
    return F(t).find((i) => se(i.pathname, e));
}
function ye(t, e) {
  if (!(!t || !m(e)))
    return F(t).find((i) => i.targetPageIdentifier === e);
}
function He(t, e) {
  if (!e)
    return t;
  const i = new Set(Object.keys(e).map((r) => r.toLowerCase())), n = {};
  for (const [r, s] of Object.entries(t))
    i.has(r.toLowerCase()) || (n[r] = s);
  return { ...n, ...e };
}
function Tn(t) {
  const e = Object.keys(t.preselectAttributeOverrides ?? {});
  return [...t.attributeKeys, ...e.filter((i) => !t.attributeKeys.includes(i))];
}
function We(t) {
  return t ? F(t).length > 0 : !1;
}
function Ln(t, e, i = window.location.pathname) {
  if (t.pending.some((r) => r.pathname === i && !J(r.event)))
    return;
  const n = t.scheduledDispatch;
  n && n.pathname === i && !J(n.event) || Q(t, e, pi, i);
}
function Rn(t, e) {
  return !t || !m(e) ? !1 : F(t).some((i) => (i.triggerEventNames ?? []).includes(e));
}
function ve(t) {
  return !J(t) && !fe(t) && t.EventDataType !== we;
}
function kn(t, e) {
  const i = t.scheduledDispatch;
  return i && i.pathname === e && ve(i.event) ? !0 : t.pending.some((n) => n.pathname === e && ve(n.event));
}
function Dn(t, e, i, n) {
  if (!t.isKitReady() || !t.isPreselectionEnabled() || !ut(t, i))
    return "waits";
  const { collected: r, missingKeys: s } = ge(t, e, i);
  if (s.length > 0)
    return "waits";
  const o = t.accountId || "", a = re(oi(o, A(n)));
  if (!a)
    return "now";
  const c = ft(t, o, i.targetPageIdentifier, r);
  return a.byEvent || c !== void 0 && c === a.attributesDigest ? "skipped" : "now";
}
function Cn(t, e, i) {
  t.pending = t.pending.filter((r) => r.pathname !== i);
  const n = e.accountId ? Ze(e.accountId) : null;
  e.accountId && n && n.pathname === i && G(e.accountId);
}
function On(t, e, i, n = window.location.pathname) {
  const r = L(e.accountId, n);
  if (!r || !q(r, i))
    return;
  const s = Dn(e, i, r, n);
  if (s === "now")
    Cn(t, e, n);
  else if (kn(t, n) || s === "skipped" && t.scheduledDispatch?.pathname === n)
    return;
  Q(t, e, i, n);
}
function Kn(t, e) {
  return t ? F(t).some((i) => i.attributeKeys.includes(e)) : !1;
}
function Nn() {
  return { pending: [] };
}
function st(t) {
  if (t.dispatchTimer === void 0)
    return;
  const e = t.scheduledDispatch;
  return clearTimeout(t.dispatchTimer), t.dispatchTimer = void 0, t.scheduledDispatch = void 0, e;
}
function Un(t, e) {
  return t === void 0 ? e : e === void 0 ? t : Math.min(t, e);
}
function kt(t) {
  return J(t) ? 0 : fe(t) || t.EventDataType === we ? 2 : 1;
}
function Fn(t, e) {
  const i = L(t.accountId, e.pathname);
  return !!i && ge(t, e.event, i).missingKeys.length > 0;
}
function Ei(t, e, i, n) {
  const r = t.pending.find((s) => s.pathname === n);
  return !!r && kt(i) < kt(r.event) && !(ve(i) && Fn(e, r));
}
function H(t, e, i) {
  const n = t.pending.findIndex((r) => r.pathname === i.pathname);
  if (n >= 0) {
    if (Ei(t, e, i.event, i.pathname))
      return;
    const r = t.pending[n];
    t.pending[n] = {
      ...i,
      triggeredAt: Un(r.triggeredAt, i.triggeredAt),
      intentSeen: i.intentSeen ?? r.intentSeen ?? le(r.event)
    };
    return;
  }
  t.pending.push(i);
}
function ue(t) {
  if (!t?.getUserIdentities)
    return [];
  const e = t.getUserIdentities().userIdentities;
  return e ? Object.keys(e).filter((i) => {
    const n = e[i];
    return m(n) && n.length > 0;
  }).sort() : [];
}
function K(t) {
  return ue(t).length > 0;
}
const Ii = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, je = /* @__PURE__ */ new WeakSet(), Dt = /* @__PURE__ */ new WeakSet();
function ot(t) {
  if (!(t instanceof HTMLInputElement)) return !1;
  const e = t.type;
  return e === "text" || e === "email" || t.getAttribute("autocomplete") === "email" && e !== "hidden" && e !== "password";
}
function $e(t) {
  const e = t.target;
  if (!(e instanceof HTMLInputElement)) return;
  const i = !Dt.has(t);
  if (Dt.add(t), t.isTrusted === !0 && ot(e)) {
    if (!i) return;
    je.add(e), e.addEventListener("input", $e, !0), e.addEventListener("change", $e, !0);
  } else
    je.delete(e);
}
function Mn(t) {
  return ot(t) && (t.type === "email" || t.getAttribute("autocomplete") === "email" || Ii.test(t.value.trim()));
}
function Se(t) {
  return t.attributeKeys.find((e) => e.toLowerCase() === "email");
}
function xn() {
  const t = /* @__PURE__ */ new Map();
  return document.querySelectorAll("input").forEach((e) => {
    if (!je.has(e) || !ot(e)) return;
    const i = e.value.trim();
    Ii.test(i) && !t.has(i.toLowerCase()) && t.set(i.toLowerCase(), i);
  }), t.size === 1 ? t.values().next().value : void 0;
}
function at(t, e, i = {}) {
  const n = new Set(
    [e, "emailsha256", t.mappedEmailSha256Key].filter(m).map((o) => o.toLowerCase())
  ), r = t.getCurrentUser?.();
  return [
    i,
    t.userAttributes,
    t.filteredUser?.getAllUserAttributes?.() ?? {},
    t.getUserIdentities?.() ?? {},
    r?.getAllUserAttributes?.() ?? {},
    r?.getUserIdentities?.().userIdentities ?? {}
  ].some(
    (o) => Object.keys(o).some((a) => n.has(a.toLowerCase()) && !T(O(o, a)))
  );
}
const Vn = ["email", "emailsha256"];
function ct(t, e) {
  const i = t.toLowerCase();
  return Vn.includes(i) || m(e) && i === e.toLowerCase();
}
function lt(t, e, i) {
  return t.getOutgoingAttributes ? he(t.getOutgoingAttributes(e, i), t.mappedEmailSha256Key) : he(e, t.mappedEmailSha256Key) || he(t.getUserIdentities?.() ?? {}, t.mappedEmailSha256Key);
}
function he(t, e) {
  return Object.keys(t).some(
    (i) => ct(i, e) && !T(O(t, i))
  );
}
function yi(t, e, i, n = {}) {
  return e.readEmailInput === !0 && se(e.pathname, window.location.pathname) && t.isForwardingAllowed?.() === !0 && t.isPreselectionPrivacyAllowed?.() !== !1 && t.isTargetingDisabled?.() !== !0 && t.isEmailIdentityFiltered?.() !== !0 && !at(t, i, n);
}
function Hn(t, e, i) {
  const n = window.location.pathname, r = L(e.accountId, n), s = r && Se(r);
  return !!s && t.pending.some(
    (o) => o.pathname === n && yi(e, r, s, o.event.EventAttributes ?? {})
  ) && i.isTrusted === !0 && Mn(i.target);
}
function vi(t, e, i, n) {
  const r = Se(e);
  if (!r || !T(O(i, r)) || !yi(t, e, r, n.EventAttributes ?? {}))
    return;
  const s = xn();
  if (s)
    return i[r] = s, r;
}
function ut(t, e) {
  const i = Se(e);
  return K(t.filteredUser) || e.readEmailInput === !0 && !!i && dt(t, e, {}).includes(i);
}
function Wn(t) {
  return !!t && F(t).some((e) => e.readEmailInput === !0);
}
function Ae(t) {
  return t.length > 0 ? t.join(",") : "none";
}
function P(t) {
  const e = t?.getMPID?.();
  return e == null ? null : String(e);
}
function Ai(t, e) {
  const i = ue(t.filteredUser), n = t.getCurrentUser?.(), r = ue(n), s = P(t.filteredUser), o = P(n), a = [...e.identityKeys ?? [], "email", "emailsha256"];
  t.mappedEmailSha256Key && a.push(t.mappedEmailSha256Key);
  const c = new Set(a.map((p) => p.toLowerCase())), l = n?.getAllUserAttributes?.() ?? {}, d = [t.userAttributes, l].some(
    (p) => Object.entries(p).some(
      ([f, g]) => c.has(f.toLowerCase()) && m(g) && g.length > 0
    )
  );
  let u = "no_identities";
  return t.filteredUser ? o !== null && s !== o ? u = "mpid_mismatch" : r.length > 0 && (u = "kit_user_lacks_identities") : u = "no_filtered_user", {
    identity_reason: u,
    kit_identity_types: Ae(i),
    current_identity_types: Ae(r),
    mpid_match: o === null ? "unknown" : s === o,
    identity_attribute_present: d
  };
}
function dt(t, e, i) {
  const n = t.getPreselectVariant?.() === "widened" ? e.widenedOptionalAttributeKeys ?? [] : [], r = new Set(
    [...e.optionalAttributeKeys ?? [], ...n].map((s) => s.toLowerCase())
  );
  return e.attributeKeys.filter(
    (s) => !r.has(s.toLowerCase()) && T(O(i, s))
  );
}
function ge(t, e, i) {
  const n = t.filteredUser?.getAllUserAttributes?.() || {}, r = new Set(i.identityKeys ?? []);
  let s;
  const o = {};
  for (const c of i.attributeKeys) {
    const l = t.getEventAttributeValue(e, c), d = O(t.userAttributes, c);
    let u = T(l) ? T(d) ? O(n, c) : d : l;
    if (T(u) && r.has(c)) {
      s || (s = t.getUserIdentities?.() ?? {});
      const p = O(s, c);
      u = m(p) && p !== "" ? p : void 0;
    }
    T(u) || (o[c] = u);
  }
  const a = vi(t, i, o, e);
  return {
    collected: o,
    missingKeys: dt(t, i, o),
    formEmailKey: a
  };
}
const bi = /* @__PURE__ */ new WeakMap();
function jn(t) {
  return bi.get(t);
}
function $n(t, e, i) {
  i && bi.set(e, i);
  const n = (s) => {
    i?.();
    const o = e[Ie] ? "redacted" : s instanceof Error ? s.message : String(s);
    t.log({
      message: `Rokt Kit: Preselect selectPlacements call failed: ${o}`,
      code: "PRESELECT_DISPATCH_FAILED"
    });
  };
  let r;
  try {
    r = t.selectPlacements(e);
  } catch (s) {
    n(s);
    return;
  }
  Promise.resolve(r).catch(n);
}
const Ct = /* @__PURE__ */ new Map(), Ot = /* @__PURE__ */ new Map();
function Kt(t, e, i) {
  const n = t.get(e), r = { previous: i, earlier: n };
  return n && (n.later = r), t.set(e, r), r;
}
function Nt(t, e, i, n) {
  const { earlier: r, later: s } = i;
  if (s) {
    s.previous = i.previous, s.earlier = r, r && (r.later = s);
    return;
  }
  n(i.previous), r && (r.later = void 0), t.get(e) === i && (r ? t.set(e, r) : t.delete(e));
}
function ft(t, e, i, n) {
  try {
    const r = JSON.stringify(
      He(
        n,
        ye(e, i)?.preselectAttributeOverrides
      )
    ), s = t.getOutgoingAttributes ? t.getOutgoingAttributes(n, i) : { ...t.getUserIdentities?.() ?? {}, ...n }, o = Object.keys(s).sort().filter((a) => ct(a, t.mappedEmailSha256Key) && !T(O(s, a))).map((a) => [a, O(s, a)]);
    return Xe(o.length > 0 ? `${r}|${JSON.stringify(o)}` : r);
  } catch {
    return;
  }
}
function Pi(t) {
  return !t.isTargetingDisabled?.() && t.isPreselectionPrivacyAllowed?.() !== !1 && t.isForwardingAllowed?.() !== !1;
}
function gt(t, e, i, n, r, s, o, a = !1, c = !1, l = a, d, u, p) {
  if (!Pi(t))
    return !1;
  const f = oi(e, i), g = ft(t, e, n, r);
  if (c && fi(e, n, g))
    return t.logPlacementDiagnostic(y("skipped", "active_preselection")), !0;
  if (a && re(f)?.byEvent)
    return t.logPlacementDiagnostic(y("skipped", "active_preselection")), !1;
  const _ = g !== void 0 ? re(f) : null;
  if (g !== void 0) {
    if (_?.attributesDigest === g)
      return t.logPlacementDiagnostic(y("skipped", "active_preselection")), !0;
    Ji(
      f,
      g,
      l || c && re(f)?.byEvent === !0
    );
  }
  t.logPlacementDiagnostic(
    y("fired", s, {
      identity_types: Ae(ue(t.filteredUser)),
      ...d ? { email_source: "input" } : {},
      ...c ? {
        intent_route: p ?? "entry",
        ...u ? { intent_source: u } : {},
        ...p ? { logged_in: !0 } : {}
      } : {}
    })
  );
  const v = `${e}:${n}`, R = Kt(
    Ct,
    v,
    ln(e, n, g)
  ), k = g !== void 0 ? Kt(Ot, f, _) : void 0;
  let M = !1;
  const b = () => {
    M || (M = !0, k && Nt(
      Ot,
      f,
      k,
      (w) => Qi(f, w, g)
    ), Nt(
      Ct,
      v,
      R,
      (w) => un(e, n, w, g)
    ));
  };
  return $n(t, {
    attributes: { ...r, [_i]: o },
    preselect: !0,
    identifier: n,
    omitUrl: !0,
    ...d ? { [Ie]: { key: d, mpid: P(t.filteredUser) } } : {},
    ...p ? { [Ve]: { mpid: P(t.filteredUser) } } : {}
  }, b), !0;
}
function Yn(t, e) {
  if (!e.accountId || !e.isKitReady())
    return;
  const i = Ze(e.accountId);
  if (!i)
    return;
  if (t.pending.some((o) => o.pathname === i.pathname)) {
    G(e.accountId);
    return;
  }
  if (!e.isPreselectionEnabled()) {
    G(e.accountId);
    return;
  }
  if (!K(e.filteredUser) || (G(e.accountId), P(e.filteredUser) !== i.mpid))
    return;
  const n = L(e.accountId, i.pathname);
  if (!n || n.targetPageIdentifier !== i.identifier)
    return;
  if (!i.byEvent && ie(e)) {
    e.logPlacementDiagnostic(y("missed", "recovery_awaits_intent"));
    return;
  }
  const r = Y(i.attributes), s = dt(e, n, r);
  if (s.length > 0) {
    for (const o of s)
      e.logPlacementDiagnostic(y("missed", `missing_persisted_attribute:${o}`));
    return;
  }
  gt(
    e,
    e.accountId,
    i.identifier,
    i.identifier,
    r,
    "recovered",
    rt("recovered", n)
  );
}
function pt(t) {
  return !t.isTargetingDisabled?.() && t.isPreselectionPrivacyAllowed?.() !== !1 && t.isKitReady() && t.isPreselectionEnabled();
}
function ht(t) {
  return t === void 0 ? {} : { since_trigger_ms: Date.now() - t };
}
function wi(t, e, i) {
  if (e.waitingFor !== "intent" || e.intentSeen)
    return !1;
  const n = L(t.accountId, e.pathname);
  return !!n && n === L(t.accountId, i);
}
function Ye(t, e) {
  pt(t) && t.logPlacementDiagnostic(
    y("missed", "left_trigger_path", {
      waiting_for: e.waitingFor,
      has_identity: K(t.filteredUser),
      ...ht(e.triggeredAt)
    })
  );
}
function Q(t, e, i, n = window.location.pathname, r, s = Date.now(), o) {
  const a = t.pending.filter((d) => d.pathname !== n);
  if (a.length > 0) {
    const d = e.accountId ? Ze(e.accountId) : null;
    e.accountId && d && a.some((u) => u.pathname === d.pathname) && G(e.accountId), a.forEach((u) => {
      wi(e, u, n) ? t.intentWaitMovedWithin = L(e.accountId, n) : Ye(e, u);
    }), t.pending = t.pending.filter((u) => u.pathname === n);
  }
  const c = st(t), l = c !== void 0 && c.pathname === n && J(c.event);
  if (c && !l) {
    const d = L(e.accountId, c.pathname);
    A(c.pathname) !== A(n) && d?.releaseHoldOnRouteChange ? (Si(t, e, c, "hold_released_on_route_change"), t.pending = t.pending.filter((u) => u.pathname === c.pathname ? (Ye(e, u), !1) : !0)) : Ut(e, c, n);
  }
  Gn(t, e, i, n, r, s, l, o), l && t.scheduledDispatch === void 0 && Ut(e, c, n);
}
function Ut(t, e, i) {
  t.logPlacementDiagnostic(
    y("missed", "hold_cancelled", {
      held_ms: Date.now() - e.heldAt,
      same_path: e.pathname === i
    })
  );
}
function Gn(t, e, i, n, r, s, o, a) {
  const c = t.pending.find((d) => A(d.pathname) === A(n));
  if (a ?? (a = le(i) ?? c?.intentSeen ?? le(c?.event)), e.isTargetingDisabled?.() || e.isPreselectionPrivacyAllowed?.() === !1)
    return;
  const l = L(e.accountId, n);
  if (!l) {
    Bn(e, n);
    return;
  }
  if (!(r !== void 0 && P(e.filteredUser) !== r)) {
    if (!a && !q(l, i) && ie(e)) {
      const d = t.intentWaitMovedWithin === l;
      t.intentWaitMovedWithin = void 0;
      const u = d || c?.waitingFor === "intent" && c.awaitingIntentLogged === !0, p = e.isKitReady() && e.isPreselectionEnabled();
      H(t, e, {
        event: i,
        pathname: n,
        // Bound to an identified shopper, as a timer hold is, so another user's click never sends
        // this page view's attributes. A guest stays unbound so signing in at checkout still fires.
        triggeringUserId: r ?? (K(e.filteredUser) ? P(e.filteredUser) : void 0),
        triggeredAt: s,
        waitingFor: "intent",
        awaitingIntentLogged: u || p
      }), !u && p && e.logPlacementDiagnostic(y("held", "awaiting_intent")), p && Ge(e, l, i);
      return;
    }
    if (!e.isKitReady()) {
      if (Ei(t, e, i, n))
        return;
      const d = [], u = P(e.filteredUser);
      if (e.accountId && u && K(e.filteredUser)) {
        const { collected: p, missingKeys: f, formEmailKey: g } = ge(e, i, l);
        if (f.length === 0 && !g) {
          const _ = Y(p);
          (q(l, i) || !!a ? Lt(
            e.accountId,
            n,
            l.targetPageIdentifier,
            _,
            u,
            !0
          ) : Lt(e.accountId, n, l.targetPageIdentifier, _, u)) || d.push(y("queued", "persist_failed"));
        }
      }
      H(t, e, {
        event: i,
        pathname: n,
        storedDiagnostics: d,
        triggeringUserId: r,
        triggeredAt: s,
        waitingFor: "launcher",
        intentSeen: a
      });
      return;
    }
    if (e.isPreselectionEnabled()) {
      if (Ge(e, l, i), !ut(e, l)) {
        e.logPlacementDiagnostic(
          y("missed", "no_valid_identity", Ai(e, l))
        ), H(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "identity" });
        return;
      }
      if (l.dispatchDelayMs !== void 0 && !q(l, i) && !fe(i) && !a) {
        const d = P(e.filteredUser), u = Math.min(
          l.dispatchDelayMs,
          Math.max(0, s + l.dispatchDelayMs - Date.now())
        );
        t.scheduledDispatch = { event: i, pathname: n, heldAt: Date.now(), heldForUserId: d, triggeredAt: s }, o || e.logPlacementDiagnostic(y("held", "dispatch_delay", { delay_ms: u })), t.dispatchTimer = setTimeout(() => {
          t.dispatchTimer = void 0, t.scheduledDispatch = void 0, Ti(t, e.getCurrentHost?.() ?? e, i, n, d, s);
        }, u);
        return;
      }
      Li(
        t,
        e,
        i,
        n,
        l,
        r,
        s,
        void 0,
        a,
        a ? c : void 0
      );
    }
  }
}
function Ge(t, e, i) {
  if (!t.accountId) return;
  const n = Se(e), r = e.readEmailInput === !0 && !!n && (at(t, n, i.EventAttributes ?? {}) || vi(t, e, {}, i) !== void 0);
  on(
    t.accountId,
    e.targetPageIdentifier,
    K(t.filteredUser) || r
  );
}
function Bn(t, e) {
  const i = t.accountId;
  !i || t.isKitReady() && !t.isPreselectionEnabled() || F(i).forEach((n) => {
    mn(n.pathname, e) && cn(i, n.targetPageIdentifier);
  });
}
function zn(t) {
  const e = U[U.length - 1];
  return t !== void 0 && (e === void 0 || t < e.since);
}
function Xn() {
  try {
    return new URL(document.referrer).origin === window.location.origin ? "same_origin" : "other_origin";
  } catch {
    return "none";
  }
}
function ie(t) {
  return t.isCheckoutIntentActive?.() === !0 && t.isPreselectionPrivacyAllowed?.() !== !1;
}
function Si(t, e, i, n, r) {
  Ti(
    t,
    e.getCurrentHost?.() ?? e,
    i.event,
    i.pathname,
    i.heldForUserId,
    i.triggeredAt,
    n,
    r
  );
}
function Ti(t, e, i, n, r, s, o, a) {
  const c = L(e.accountId, n);
  if (!(!c || e.isTargetingDisabled?.() || e.isPreselectionPrivacyAllowed?.() === !1)) {
    if (!a && !q(c, i) && !fe(i) && ie(e)) {
      const l = e.isKitReady() && e.isPreselectionEnabled();
      H(t, e, {
        event: i,
        pathname: n,
        triggeringUserId: r,
        triggeredAt: s,
        waitingFor: "intent",
        awaitingIntentLogged: l
      }), l && e.logPlacementDiagnostic(y("held", "awaiting_intent"));
      return;
    }
    if (!e.isKitReady()) {
      H(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "launcher" });
      return;
    }
    if (e.isPreselectionEnabled()) {
      if (!ut(e, c)) {
        e.logPlacementDiagnostic(
          y("missed", "no_valid_identity", Ai(e, c))
        ), H(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "identity" });
        return;
      }
      P(e.filteredUser) === r && Li(t, e, i, n, c, r, s, o, a);
    }
  }
}
function Li(t, e, i, n, r, s, o, a, c, l) {
  if (e.isPreselectionPrivacyAllowed?.() === !1) return;
  const { collected: d, missingKeys: u, formEmailKey: p } = ge(e, i, r), f = t.lastResolvedPageView, g = U[U.length - 1], _ = A(n);
  if (fe(i) && f && f.accountId === e.accountId && f.pathname === _ && f.route === g && f.userId === P(e.filteredUser) && f.identifier === r.targetPageIdentifier && f.attributeKeys.some(
    (b) => r.attributeKeys.includes(b) && T(O(d, b))
  ))
    return;
  if (u.length > 0) {
    const b = ue(e.filteredUser);
    for (const w of u)
      e.logPlacementDiagnostic(
        y("missed", `missing_attribute:${w}`, {
          identity_types: Ae(b),
          key_is_identity: b.some((N) => N.toLowerCase() === w.toLowerCase())
        })
      );
    H(t, e, {
      event: i,
      pathname: n,
      triggeringUserId: s,
      triggeredAt: o,
      intentSeen: c,
      waitingFor: "attribute"
    });
    return;
  }
  const v = c ?? le(i);
  if (v && !lt(e, d, r.targetPageIdentifier)) {
    t.noEmailLoggedPathname !== _ && (t.noEmailLoggedPathname = _, e.logPlacementDiagnostic(
      y("missed", "no_strict_email", {
        has_identity: K(e.filteredUser)
      })
    )), H(t, e, {
      event: i,
      pathname: n,
      triggeringUserId: s,
      triggeredAt: o,
      intentSeen: v,
      waitingFor: "attribute"
    });
    return;
  }
  t.noEmailLoggedPathname = void 0, l && (t.pending = t.pending.filter((b) => b !== l));
  const R = q(r, i), k = v ?? (R ? "event" : J(i) ? "pathname" : "pageview");
  gt(
    e,
    e.accountId || "",
    A(n),
    r.targetPageIdentifier,
    d,
    a ?? (v ? "intent" : R ? "event_trigger" : "fired"),
    rt(k, r),
    R && !v,
    !!v,
    R,
    p,
    v ? t.intentSource : void 0
  ) && (ve(i) || R) && (t.lastResolvedPageView = {
    accountId: e.accountId,
    pathname: _,
    route: g,
    userId: P(e.filteredUser),
    identifier: r.targetPageIdentifier,
    attributeKeys: Object.keys(d)
  });
}
function qn(t, e, i = window.location.pathname) {
  if (Yn(t, e), t.pending.length === 0)
    return;
  const n = t.pending;
  t.pending = [], n.forEach((r) => {
    const { event: s, pathname: o, storedDiagnostics: a, triggeringUserId: c, triggeredAt: l, waitingFor: d, intentSeen: u } = r, p = pt(e), f = K(e.filteredUser), g = ht(l);
    if (p && d === "identity" && f && e.logPlacementDiagnostic(
      y("identity_arrived", "pending_identity", {
        ...g,
        on_trigger_path: o === i
      })
    ), o !== i) {
      wi(e, r, i) ? t.intentWaitMovedWithin = L(e.accountId, i) : Ye(e, { waitingFor: d, triggeredAt: l });
      return;
    }
    if (d === "intent" && !u) {
      const _ = L(e.accountId, o);
      if (_ && ie(e)) {
        !r.awaitingIntentLogged && e.isKitReady() && e.isPreselectionEnabled() && (e.logPlacementDiagnostic(y("held", "awaiting_intent")), Ge(e, _, s), r.awaitingIntentLogged = !0), t.pending.push(r);
        return;
      }
    }
    p && a?.forEach((_) => e.logPlacementDiagnostic(_)), t.scheduledDispatch?.pathname !== o && Q(t, e, s, o, c, l, u);
  });
}
function Jn(t, e) {
  if (!t.accountId || !pt(t))
    return;
  const i = ye(t.accountId, e);
  if (!i)
    return;
  const n = pn(t.accountId, i.targetPageIdentifier);
  if (!n || (ie(t) && t.isForwardingAllowed?.() !== !1 && t.logPlacementDiagnostic(
    y("arrived", "intent_arrival", Qn(n))
  ), n.firedAt !== void 0))
    return;
  const r = n.triggeredAt !== void 0;
  t.logPlacementDiagnostic(
    y("missed", "arrival_without_fire", {
      trigger_seen: r,
      identity_seen_on_trigger_path: n.identitySeenAt !== void 0,
      has_identity: K(t.filteredUser),
      // Another tab's checkout caches its offers in that tab, so this arrival still misses. This tab's
      // own trigger counts too: the device marker can expire, be cleared by another tab or fail to save.
      trigger_seen_any_tab: r || an(t.accountId, i.targetPageIdentifier),
      ...ht(n.triggeredAt),
      near_miss_seen: zn(n.nearMissAt),
      // Page memory loses the trigger record on a full navigation, so trigger_seen reads false.
      storage: Ui() ? "page" : "device",
      referrer: Xn()
    })
  );
}
function Qn(t) {
  const e = t.intentAt === void 0 || t.intentKind === void 0 ? "none" : er(Date.now() - t.intentAt);
  return {
    intent_seen: e === "none" ? "none" : t.intentKind,
    lead: e,
    fired: t.firedAt !== void 0
  };
}
const Zn = [
  [1e3, "lt1s"],
  [2e3, "1s_2s"],
  [5e3, "2s_5s"],
  [1e4, "5s_10s"],
  [2e4, "10s_20s"],
  [6e4, "20s_60s"],
  [3e5, "60s_300s"],
  [Pe, "300s_1800s"]
];
function er(t) {
  if (t < 0)
    return "none";
  const e = Zn.find(([i]) => t < i);
  return e ? e[1] : "none";
}
function tr() {
  return {
    context: null,
    lifecycle: "idle",
    recreateInFlight: null
  };
}
function ir(t, e) {
  t.context = {
    accountId: e.accountId,
    launcherOptions: { ...e.launcherOptions },
    legacyRoktExtensions: [...e.legacyRoktExtensions]
  };
}
function nr(t) {
  t.lifecycle = "attached";
}
function rr(t) {
  t.lifecycle !== "idle" && (t.lifecycle = "terminated");
}
function sr(t) {
  t.lifecycle = "terminated";
}
function or(t) {
  t.context = null, t.lifecycle = "idle", t.recreateInFlight = null;
}
function ar(t, e, i) {
  if (t.recreateInFlight)
    return t.recreateInFlight;
  if (t.lifecycle !== "terminated" || !t.context || !e)
    return;
  t.lifecycle = "recreating";
  const n = t.context;
  return t.recreateInFlight = i(n).finally(() => {
    t.recreateInFlight = null;
  }), t.recreateInFlight;
}
const S = "Rokt", cr = 7, me = 181, lr = "selectPlacements", ur = "apps.roktecommerce.com", dr = 0.1, fr = "ThankYouPageJourney", gr = "rokt-launcher", pr = "rokt-thank-you-element", hr = "userIdentifiedInWorkspace", Ft = 3, mr = 2, _r = "page_events", Er = "page_view_attributes", Ir = "mparticle_session_id", yr = "mparticle_device_id", Mt = "rokt:intent", xt = "LEAD_CAPTURE_SUBMITTED", Ke = "exit-intent", vr = [
  "3479519924056514560",
  "3484183287406608384",
  "3198447216177237634",
  "3292347205549055462"
], Ar = "exit-intent-placement", Vt = 500, mt = {
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  UNHANDLED_EXCEPTION: "UNHANDLED_EXCEPTION",
  IDENTITY_REQUEST: "IDENTITY_REQUEST",
  LOG_DELIVERY_FAILURE: "LOG_DELIVERY_FAILURE"
}, oe = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARNING: "WARNING"
}, br = "apps.rokt-api.com", Pr = "/v1/log", wr = "/v1/errors", Sr = 10;
function h() {
  return window.mParticle;
}
function Ht(t, e) {
  const n = [Te(t), "/wsdk/integrations/launcher.js"].join("");
  return !e || e.length === 0 ? n : n + "?extensions=" + e.join(",");
}
function Wt(t) {
  return [Te(t), "/rokt-elements/rokt-element-thank-you.js"].join("");
}
function Te(t) {
  const e = t !== void 0 ? t : br;
  return e.includes("://") ? e.replace(/\/+$/, "") : ["https://", e].join("");
}
function Ri(t, e, i) {
  if (t)
    return t.startsWith("http://") || t.startsWith("https://") ? t : "https://" + t;
  const r = e?.includes("://") && !/^https?:\/\//i.test(e) ? void 0 : e;
  return Te(r) + i;
}
function jt(t, e, i) {
  if (document.getElementById(t)) return;
  const n = document.head || document.body, r = document.createElement("script");
  r.id = t, r.type = "text/javascript", r.src = e, r.async = !0, r.crossOrigin = "anonymous", r.fetchPriority = "high", i?.onLoad && (r.onload = i.onLoad), i?.onError && (r.onerror = i.onError), n.appendChild(r);
}
function _e(t) {
  if (!t)
    return [];
  const e = Zt(t);
  return e === void 0 ? (console.error("Settings string contains invalid JSON"), []) : e;
}
function $t(t) {
  const e = t ? _e(t) : [], i = [], n = [];
  let r = !1;
  for (let s = 0; s < e.length; s++) {
    const o = e[s].value;
    o === "thank-you-journey" ? (r = !0, n.push(fr)) : i.push(o);
  }
  return {
    roktExtensionsQueryParams: i,
    legacyRoktExtensions: n,
    loadThankYouElement: r
  };
}
async function Tr(t, e) {
  const i = [];
  if (e)
    for (const n of t)
      i.push(e.use(n));
  return Promise.all(i);
}
function Yt(t) {
  if (!t)
    return {};
  const e = {};
  for (let i = 0; i < t.length; i++) {
    const n = t[i];
    e[n.jsmap] = n.value;
  }
  return e;
}
function Gt(t) {
  const e = {};
  if (!Array.isArray(t))
    return e;
  for (let i = 0; i < t.length; i++) {
    const n = t[i];
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
function Bt(t, e, i) {
  return h().generateHash([t, e, i].join(""));
}
function Lr(t) {
  let n = "mParticle_wsdkv_" + h().getVersion() + "_kitv_" + "3.23.0";
  return t && (n += "_" + t), n;
}
function zt(t) {
  return !!(t && vr.includes(t));
}
function Be(t) {
  const e = document.createElement("iframe");
  e.style.display = "none", e.setAttribute("sandbox", "allow-scripts allow-same-origin"), e.src = t, e.onload = function() {
    e.onload = null, e.parentNode && e.parentNode.removeChild(e);
  };
  const i = document.body || document.head;
  i && i.appendChild(e);
}
function Xt(t, e) {
  const i = Xe(window.location.origin);
  if (Z._allowedOriginHashes.indexOf(i) === -1 || Math.random() >= dr)
    return;
  const r = window.__rokt_li_guid__;
  if (!r || t && t.includes("://") && !/^https:\/\//i.test(t))
    return;
  const s = ze(window.location.href), o = "version=" + encodeURIComponent(e ?? "") + "&launcherInstanceGuid=" + encodeURIComponent(r) + "&pageUrl=" + encodeURIComponent(s), a = t ? Te(t) : "https://apps.rokt.com";
  Be(a + "/v1/wsdk-init/index.html?" + o), Be(
    "https://" + ur + "/v1/wsdk-init/index.html?" + o + "&isControl=true"
  );
}
function Rr() {
  return typeof window < "u" && !!window.location?.search?.toLowerCase().includes("mp_enable_logging=true");
}
function kr() {
  if (typeof window > "u")
    return;
  const t = window.location?.href;
  return t ? ze(t) : void 0;
}
function Dr() {
  return typeof window < "u" ? window.navigator?.userAgent : void 0;
}
class ki {
  constructor() {
    this._logCount = {};
  }
  incrementAndCheck(e) {
    const n = (this._logCount[e] || 0) + 1;
    return this._logCount[e] = n, n > Sr;
  }
}
class ae {
  constructor(e, i, n, r, s) {
    this._reporter = "mp-wsdk";
    const o = e.isLoggingEnabled;
    this._integrationName = i || "", this._launcherInstanceGuid = n, this._accountId = r || null, this._rateLimiter = s || new ki(), this._isEnabled = Rr() || o;
  }
  send(e, i, n, r, s, o) {
    if (!(!this._isEnabled || this._rateLimiter.incrementAndCheck(i)))
      try {
        const a = {
          additionalInformation: {
            message: n,
            version: this._integrationName
          },
          severity: i,
          code: r || mt.UNKNOWN_ERROR,
          url: kr(),
          deviceInfo: Dr(),
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
            const d = new Error("HTTP " + l.status + " from log endpoint");
            throw d.statusCode = l.status, d;
          }
        }).catch((l) => {
          console.error("ReportingTransport: Failed to send log", l), o && o(l);
        });
      } catch (a) {
        console.error("ReportingTransport: Failed to send log", a), o && o(a);
      }
  }
}
class qt {
  constructor(e, i, n, r, s) {
    this._transport = new ae(e, i, n, r, s), this._errorUrl = Ri(e?.errorUrl, e?.integrationDomain, wr);
  }
  report(e) {
    if (!e) return;
    const i = e.severity || oe.ERROR;
    this._transport.send(this._errorUrl, i, e.message, e.code, e.stackTrace);
  }
}
class Jt {
  constructor(e, i, n, r, s, o) {
    this._intentObserveLines = 0, this._transport = new ae(e, n, r, s, o), this._placementDiagnosticTransport = new ae(
      e,
      n,
      r,
      s
    ), this._preselectOutcomeTransport = new ae(e, n, r, s), this._loggingUrl = Ri(e?.loggingUrl, e?.integrationDomain, Pr), this._errorReportingService = i;
  }
  log(e) {
    e && this._send(this._transport, e);
  }
  logPlacementDiagnostic(e) {
    if (!e) return;
    if (e.code === "PRESELECT_SKIPPED" && e.message.includes("[reason=intent_observed]")) {
      if (this._intentObserveLines >= 4) return;
      this._intentObserveLines++;
    }
    const i = e.code === "PRESELECT_FIRED" || e.code === "PRESELECT_ARRIVED";
    this._send(i ? this._preselectOutcomeTransport : this._placementDiagnosticTransport, e);
  }
  _send(e, i) {
    e.send(
      this._loggingUrl,
      oe.INFO,
      i.message,
      i.code,
      void 0,
      (n) => {
        if (this._errorReportingService) {
          const r = typeof n.statusCode == "number";
          this._errorReportingService.report({
            message: "LoggingService: Failed to send log: " + n.message,
            code: mt.LOG_DELIVERY_FAILURE,
            severity: r ? oe.ERROR : oe.WARNING
          });
        }
      }
    );
  }
}
function Cr(t) {
  const e = ei(window.location.href), i = t.EventAttributes?.title || document.title, n = ji(), r = t.ActiveTimeOnSite;
  return {
    pageUrl: e,
    sourceMessageId: t.SourceMessageId,
    timestamp: t.Timestamp,
    ...i ? { pageTitle: i } : {},
    ...n !== void 0 ? { canonicalUrl: n } : {},
    ...Number.isFinite(r) ? { activeTimeOnSite: r } : {}
  };
}
const V = class V {
  constructor() {
    this.name = S, this.id = me, this.moduleId = me, this.isInitialized = !1, this.launcher = null, this.filters = {}, this.userAttributes = {}, this.userIdentifiedInWorkspace = !1, this.testHelpers = null, this.placementEventMappingLookup = {}, this.placementEventAttributeMappingLookup = {}, this.integrationName = null, this.errorReportingService = null, this.loggingService = null, this._thankYouElementOnLoadCallback = null, this._isThankYouElementLoaded = !1, this._workspaceSearchInFlightPromise = null, this._launcherAttachState = tr(), this._exitIntentConfig = null, this._exitIntentDispatchedForPageView = !1, this._exitIntentEnabledForAccount = !1, this._pendingInitWarnings = [], this.accountId = null, this._preselectState = Nn();
  }
  // ---- Private helpers ----
  getEventAttributeValue(e, i) {
    const n = e && e.EventAttributes;
    if (!n)
      return null;
    const r = O(n, i);
    return r === void 0 ? null : r;
  }
  doesEventAttributeConditionMatch(e, i) {
    if (!e || !m(e.operator))
      return !1;
    const n = e.operator.toLowerCase(), r = e.attributeValue;
    return n === "exists" ? i !== null : i == null ? !1 : n === "equals" ? String(i) === String(r) : n === "contains" ? String(i).indexOf(String(r)) !== -1 : !1;
  }
  doesEventMatchRule(e, i) {
    if (!i || !m(i.eventAttributeKey))
      return !1;
    const n = i.conditions;
    if (!Array.isArray(n))
      return !1;
    const r = this.getEventAttributeValue(e, i.eventAttributeKey);
    if (n.length === 0)
      return r !== null;
    for (let s = 0; s < n.length; s++)
      if (!this.doesEventAttributeConditionMatch(n[s], r))
        return !1;
    return !0;
  }
  applyPlacementEventAttributeMapping(e) {
    const i = Object.keys(this.placementEventAttributeMappingLookup);
    for (let n = 0; n < i.length; n++) {
      const r = i[n], s = this.placementEventAttributeMappingLookup[r];
      if (T(s))
        continue;
      let o = !0;
      for (let a = 0; a < s.length; a++)
        if (!this.doesEventMatchRule(e, s[a])) {
          o = !1;
          break;
        }
      o && h().Rokt.setLocalSessionAttribute?.(r, !0);
    }
  }
  capturePageView(e) {
    let i;
    try {
      i = ze(window.location.href);
      const n = St(), r = Cr(e);
      n.push(r);
      const s = Math.min(n.length, ri), o = xi(n);
      if (o === 0) {
        const a = Ne() ? "quota" : "ls_unavailable";
        this.loggingService?.log({
          message: `Rokt Kit: Failed to persist page view for ${i} [reason: ${a}]`,
          code: "PAGE_VIEW_CAPTURE_FAILED"
        });
      } else o < s && this.loggingService?.log({
        message: `Rokt Kit: Page view storage reduced from ${s} to ${o} record(s) under quota pressure [reason: quota_eviction]`,
        code: "PAGE_VIEW_QUOTA_EVICTION"
      });
    } catch (n) {
      const r = Ne() ? "exception" : "ls_unavailable", s = n instanceof Error ? n.message : String(n);
      this.loggingService?.log({
        message: `Rokt Kit: Failed to capture page view for ${i}: ${s} [reason: ${r}]`,
        code: "PAGE_VIEW_CAPTURE_FAILED"
      });
    }
  }
  isPreselectionEnabled() {
    return this.launcher?.enablePreselection === !0;
  }
  findCacheConfigEntry(e) {
    if (this.isPreselectionEnabled())
      return ye(this.accountId, e);
  }
  buildPreselectAttributeOverrides(e) {
    if (!this.isPreselectionEnabled())
      return;
    const i = ye(this.accountId, e)?.preselectAttributeOverrides, n = this.filters || {};
    if (!i || !n.filterUserAttributes)
      return i;
    const r = n.userAttributeFilters || [];
    return n.filterUserAttributes(i, r);
  }
  buildPreselectHost() {
    return {
      accountId: this.accountId,
      filteredUser: this.filters.filteredUser,
      userAttributes: this.userAttributes,
      isKitReady: () => this.isKitReady(),
      isPreselectionEnabled: () => this.isPreselectionEnabled(),
      getPreselectVariant: () => this.launcher?.preselectVariant,
      getEventAttributeValue: (e, i) => this.getEventAttributeValue(e, i),
      logPlacementDiagnostic: (e) => this.loggingService?.logPlacementDiagnostic(e),
      log: (e) => this.loggingService?.log(e),
      selectPlacements: (e) => this.selectPlacements(e),
      isPreselectionPrivacyAllowed: () => this.isPreselectionPrivacyAllowed(),
      getCurrentUser: () => h().Identity?.getCurrentUser?.(),
      getCurrentHost: () => this.buildPreselectHost(),
      isTargetingDisabled: () => this.isTargetingDisabled(),
      getUserIdentities: () => this.returnUserIdentities(this.filters.filteredUser),
      getOutgoingAttributes: (e, i) => this.getOutgoingPreselectAttributes(e, i),
      mappedEmailSha256Key: this._mappedEmailSha256Key,
      isForwardingAllowed: () => this.isForwardingAllowed(),
      isCheckoutIntentActive: () => this.isCheckoutIntentActive(),
      isEmailIdentityFiltered: () => this.isEmailIdentityFiltered()
    };
  }
  flushPendingPreselectDispatches() {
    qn(this._preselectState, this.buildPreselectHost());
  }
  isLauncherReadyToAttach() {
    return !!window.Rokt && $(window.Rokt.createLauncher);
  }
  /**
   * Returns the user identities from the filtered user, if any.
   */
  returnUserIdentities(e) {
    if (!e || !e.getUserIdentities)
      return {};
    const i = e.getUserIdentities().userIdentities;
    return this.replaceOtherIdentityWithEmailsha256(i);
  }
  returnLocalSessionAttributes() {
    return !h().Rokt || typeof h().Rokt.getLocalSessionAttributes != "function" ? {} : h().Rokt.getLocalSessionAttributes();
  }
  replaceOtherIdentityWithEmailsha256(e) {
    const i = { ...e || {} }, n = this._mappedEmailSha256Key;
    return n && e[n] && (i[V.EMAIL_SHA256_KEY] = e[n]), n && delete i[n], i;
  }
  logSelectPlacementsEvent(e) {
    if (!window.mParticle || typeof h().logEvent != "function" || !I(e))
      return;
    const i = h().EventType.Other;
    h().logEvent(lr, i, e);
  }
  setRoktSessionId(e) {
    if (!(!e || typeof e != "string"))
      try {
        const i = h().getInstance();
        i && $(i.setIntegrationAttribute) && i.setIntegrationAttribute(me, {
          roktSessionId: e
        });
      } catch {
      }
  }
  readMpSessionId() {
    const e = h()?.sessionManager, i = e?.getSessionId ?? e?.getSession;
    if ($(i))
      return i.call(e) || void 0;
  }
  readMpDeviceId() {
    return h()?.getDeviceId?.() || void 0;
  }
  attachLauncher(e, i, n = []) {
    ir(this._launcherAttachState, {
      accountId: e,
      launcherOptions: i || {},
      legacyRoktExtensions: n
    });
    const r = {
      accountId: e,
      ...i || {}
    };
    let s;
    return this.isPartnerInLocalLauncherTestGroup() ? s = Promise.resolve(window.Rokt.createLocalLauncher(r)) : s = window.Rokt.createLauncher(r), s.then(async (o) => {
      await Tr([...n], o), this.initRoktLauncher(o);
    }).catch((o) => {
      const a = this._launcherAttachState.lifecycle === "attached";
      if (sr(this._launcherAttachState), !a) {
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
    return ar(
      this._launcherAttachState,
      this.isLauncherReadyToAttach(),
      (e) => this.attachLauncher(e.accountId, e.launcherOptions, e.legacyRoktExtensions)
    );
  }
  initRoktLauncher(e) {
    window.Rokt && (window.Rokt.currentLauncher = e), this.launcher = e, nr(this._launcherAttachState);
    const i = h().Rokt?.filters;
    i ? (!this.isInitialized && this.filters.filteredUser && (i.filteredUser = this.filters.filteredUser), this.filters = i, i.filteredUser ? this._workspaceSearchInFlightPromise = this.search(i.filteredUser) : console.warn("Rokt Kit: No filtered user has been set.")) : console.warn("Rokt Kit: No filters have been set."), this.isInitialized = !0, Xt(this.domain, this.integrationName), h().Rokt.attachKit(this), this.pushExitIntentExtensionConfig(), this.flushPendingPreselectDispatches();
  }
  // Leaving the hook unset is what keeps History unpatched for workspaces that never
  // preselect. The core SDK reads onCheckoutIntent when it has a signal, so an account without
  // pre-selection entries never hears one.
  armPreselectPathnameTrigger() {
    Oe(window.location.pathname), this.onRouteChange = We(this.accountId) ? () => this.evaluatePreselectPathname() : void 0, this.armPreselectEmailInputListener(), this.onCheckoutIntent = We(this.accountId) ? (e) => {
      try {
        bn(this._preselectState, this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0;
  }
  // A guest often types their email after the trigger page view has queued for want of one, so a
  // committed email input retries the queue. Only accounts with an entry that reads the form listen.
  armPreselectEmailInputListener() {
    this._preselectEmailInputListener && (document.removeEventListener("input", this._preselectEmailInputListener, !0), document.removeEventListener("change", this._preselectEmailInputListener, !0), this._preselectEmailInputListener = void 0), Wn(this.accountId) && (this._preselectEmailInputListener = (e) => {
      $e(e), e.type === "change" && this._preselectState.pending.length > 0 && Hn(this._preselectState, this.buildPreselectHost(), e) && this.flushPendingPreselectDispatches();
    }, document.addEventListener("input", this._preselectEmailInputListener, !0), document.addEventListener("change", this._preselectEmailInputListener, !0));
  }
  // True while the core SDK says the confirm click can be waited for: auto button tracking is on, no
  // opt-out or privacy option suppresses it, and the browser supports the detector. A core released
  // without the check reads false, so its entries keep dispatchDelayMs.
  isCheckoutIntentActive() {
    const e = h().Rokt;
    try {
      return $(e?.isCheckoutIntentLive) && e.isCheckoutIntentLive() === !0;
    } catch {
      return !1;
    }
  }
  // Core gates every kit callback on opt-out and consent, but a DOM listener is called by the browser
  // directly, so it checks both itself.
  isForwardingAllowed() {
    return h().getInstance?.()?._Store?.isEnabled !== !1 && h()._getActiveForwarders().some((i) => i === this);
  }
  // A call carrying a form email can wait on identity search or launcher setup. A skipped one costs only
  // the cached hit, so it goes out only if nothing changed: same user, still allowed, and no partner
  // email has appeared, filtered or not.
  getFormEmailDropCause(e, i) {
    if (!this.isForwardingAllowed()) return "forwarding_disallowed";
    if (this.isTargetingDisabled() || !this.isPreselectionPrivacyAllowed()) return "privacy_signal";
    if (String(this.filters?.filteredUser?.getMPID?.() ?? "") !== String(i ?? "")) return "user_changed";
    if (at(this.buildPreselectHost(), e)) return "partner_email";
  }
  // Whether this connection filters out the Email identity, or the identity mapped to the hashed email.
  isEmailIdentityFiltered() {
    const e = this.userIdentityFilters || [];
    if (e.includes(cr))
      return !0;
    const i = this._mappedEmailSha256Key, n = h().IdentityType || {}, r = i ? Object.keys(n).find((o) => o.toLowerCase() === i) : void 0, s = r ? n[r] : void 0;
    return typeof s == "number" && e.includes(s);
  }
  evaluatePreselectPathname() {
    const e = window.location.pathname;
    Oe(e), e !== this._lastPreselectPathname && (this.isTargetingDisabled() || (this._lastPreselectPathname = e, Ln(this._preselectState, this.buildPreselectHost(), e)));
  }
  fetchOptimizely() {
    const e = h()._getActiveForwarders().filter((i) => i.name === "Optimizely");
    try {
      if (e.length > 0 && window.optimizely) {
        const i = window.optimizely.get("state");
        return !i || !i.getActiveExperimentIds ? {} : i.getActiveExperimentIds().reduce((s, o) => (s["rokt.custom.optimizely.experiment." + o + ".variationId"] = i.getVariationMap()[o].id, s), {});
      }
    } catch (i) {
      console.error("Error fetching Optimizely attributes:", i);
    }
    return {};
  }
  isKitReady() {
    return !!(this.isInitialized && this.launcher);
  }
  // When the partner has opted out of targeting (noTargeting launcher option),
  // the kit must not collect behavioral targeting signals such as page views.
  isTargetingDisabled() {
    return h().Rokt?.launcherOptions?.noTargeting === !0;
  }
  isPreselectionPrivacyAllowed() {
    return h().Rokt?.launcherOptions?.doNotShareOrSell !== !0 && navigator.globalPrivacyControl !== !0;
  }
  isPageHistoryAllowed() {
    return !this.isTargetingDisabled() && this.isPreselectionPrivacyAllowed();
  }
  isPartnerInLocalLauncherTestGroup() {
    return !!(h().config && h().config.isLocalLauncherEnabled && this.isAssignedToSampleGroup());
  }
  isAssignedToSampleGroup() {
    return Math.random() > 0.5;
  }
  getEffectiveExitIntentConfig(e) {
    return zt(e) ? {
      identifier: Ar,
      signals: {
        mouseExitTop: !0,
        scrollUpFast: !0,
        idle: !0
      }
    } : null;
  }
  applyExitIntentExtensionOverride(e, i) {
    return e ? i.includes(Ke) ? i : [...i, Ke] : i;
  }
  extractExitIntentIdentifier(e) {
    return e ? m(e.identifier) && e.identifier.length > 0 ? e.identifier : m(e.placementIdentifier) && e.placementIdentifier.length > 0 ? e.placementIdentifier : null : null;
  }
  processLeadCaptureSubmittedEvent(e) {
    if (!(e instanceof CustomEvent) || !I(e.detail))
      return;
    const i = e.detail, n = I(i.body) ? i.body : {};
    let r = m(n.email) ? n.email : void 0, s = m(n.mobile_number) ? n.mobile_number : void 0;
    if (!r || !s) {
      const u = Array.isArray(i.fields) ? i.fields : [];
      for (let p = 0; p < u.length; p += 1) {
        const f = u[p];
        if (!m(f.fieldKey) || !m(f.value))
          continue;
        const g = f.fieldKey.toLowerCase().replace(/[^a-z]/g, "");
        !r && (g === "email" || g === "emailaddress") && f.value.length > 0 && (r = f.value), !s && (g === "mobile" || g === "mobilenumber" || g === "phone" || g === "phonenumber") && (s = f.value);
      }
    }
    const o = {};
    m(r) && r.length > 0 && (o.email = r), m(s) && s.length > 0 && (o.mobile_number = s);
    const a = {};
    this.mergeLeadCaptureUserAttributes(a, I(n.userAttributes) ? n.userAttributes : null), this.mergeLeadCaptureUserAttributes(
      a,
      I(i.userAttributes) ? i.userAttributes : null
    );
    const c = m(n.rclid) ? n.rclid : m(i.rclid) ? i.rclid : void 0;
    c && c.length > 0 && (a.rokt_rclid = c);
    const l = m(n.accountID) ? n.accountID : m(i.accountID) ? i.accountID : void 0;
    l && l.length > 0 && (a.rokt_account_id = l);
    const d = m(n.referralCreativeID) ? n.referralCreativeID : m(i.referralCreativeID) ? i.referralCreativeID : void 0;
    d && d.length > 0 && (a.rokt_referral_creative_id = d), this.applyIdentityCapturePayload(o, a);
  }
  isSafeLeadCaptureUserAttributeKey(e) {
    return e === "__proto__" || e === "constructor" || e === "prototype" ? !1 : /^[a-zA-Z0-9_.-]+$/.test(e);
  }
  isSupportedLeadCaptureUserAttributeValue(e) {
    return m(e) || typeof e == "number" || typeof e == "boolean" ? !0 : Array.isArray(e) ? e.every((i) => m(i)) : !1;
  }
  mergeLeadCaptureUserAttributes(e, i) {
    if (i)
      for (const [n, r] of Object.entries(i))
        this.isSafeLeadCaptureUserAttributeKey(n) && this.isSupportedLeadCaptureUserAttributeValue(r) && (e[n] = r);
  }
  applyIdentityCapturePayload(e, i) {
    const n = {}, r = e.email;
    m(r) && r.length > 0 && (n.email = r);
    const s = e.mobile_number;
    m(s) && s.length > 0 && (n.mobile_number = s);
    const o = h().Identity?.modify;
    if ($(o) && Object.keys(n).length > 0)
      try {
        o({ userIdentities: n });
      } catch (c) {
        this.loggingService?.log({
          message: "Rokt Kit: identity capture modify failed",
          code: "EXIT_INTENT_IDENTITY_MODIFY_FAILED",
          additional_info: c instanceof Error ? { errorName: c.name, errorMessage: c.message } : void 0
        });
      }
    const a = h().Identity?.getCurrentUser?.();
    for (const [c, l] of Object.entries(i))
      if (a?.setUserAttribute)
        try {
          a.setUserAttribute(c, l);
        } catch (d) {
          this.loggingService?.log({
            message: "Rokt Kit: identity capture user attribute update failed",
            code: "EXIT_INTENT_IDENTITY_SET_ATTRIBUTE_FAILED",
            additional_info: d instanceof Error ? { errorName: d.name, errorMessage: d.message, key: c } : { key: c }
          });
        }
  }
  configureExitIntentBridge(e) {
    if (this._exitIntentConfig = this.isTargetingDisabled() ? null : e, this._exitIntentDispatchedForPageView = !1, this._exitIntentListener && (window.removeEventListener(Mt, this._exitIntentListener), this._exitIntentListener = void 0), this._exitIntentLeadCaptureSubmittedListener && (window.removeEventListener(
      xt,
      this._exitIntentLeadCaptureSubmittedListener
    ), this._exitIntentLeadCaptureSubmittedListener = void 0), this._isIdentityCaptureBridgeEnabled(this._exitIntentConfig) && (this._exitIntentLeadCaptureSubmittedListener = (n) => {
      this.processLeadCaptureSubmittedEvent(n);
    }, window.addEventListener(
      xt,
      this._exitIntentLeadCaptureSubmittedListener
    )), !this._isExitIntentBridgeEnabled(this._exitIntentConfig))
      return;
    const i = this.extractExitIntentIdentifier(this._exitIntentConfig);
    i && (this._exitIntentListener = (n) => {
      const r = n instanceof CustomEvent && n.detail && m(n.detail.reason) ? n.detail.reason : "unknown";
      if (this._exitIntentDispatchedForPageView || !this.isKitReady() || !(r === "mouse-exit-top" || r === "scroll-up-fast" || r === "idle" || r === "leave-link"))
        return;
      this._exitIntentDispatchedForPageView = !0;
      const o = I(this._exitIntentConfig?.attributes) ? this._exitIntentConfig.attributes : {};
      try {
        const a = h().Rokt?.selectPlacements?.({
          identifier: i,
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
    }, window.addEventListener(Mt, this._exitIntentListener));
  }
  _isExitIntentBridgeEnabled(e) {
    return !!(e && e.enabled !== !1);
  }
  _isIdentityCaptureBridgeEnabled(e) {
    if (!this._isExitIntentBridgeEnabled(e))
      return !1;
    const i = e.identityCapture;
    return I(i) ? i.enabled === !0 : !1;
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
    !this._exitIntentConfig || !$(window.Rokt?.setExtensionData) || window.Rokt.setExtensionData({
      [Ke]: this._exitIntentConfig
    });
  }
  captureTiming(e) {
    window && h() && h().captureTiming && e && h().captureTiming(e);
  }
  // ---- Public methods (mParticle Kit Callbacks) ----
  /**
   * Initializes the Rokt forwarder with settings from the mParticle server.
   */
  init(e, i, n, r, s) {
    const o = h().Rokt?.launcherOptions?.noFunctional === !0;
    Ni(o), o || this.isTargetingDisabled() ? Fi() : (Zi(), nn()), this.isPageHistoryAllowed() || (De(), Ce());
    const a = e, c = a.accountId;
    this._exitIntentEnabledForAccount = zt(c);
    const l = this._exitIntentEnabledForAccount ? this.getEffectiveExitIntentConfig(c) : null;
    this._exitIntentEnabledForAccount ? this.configureExitIntentBridge(l) : this.configureExitIntentBridge(null), this.accountId = c || null;
    const d = this.accountId ? hn(this.accountId, a.preselectionConfig) : void 0;
    this.userAttributes = Y(s), this.armPreselectPathnameTrigger(), this._onboardingExpProvider = a.onboardingExpProvider;
    const u = _e(a.placementEventMapping);
    this.placementEventMappingLookup = Yt(u);
    const p = _e(
      a.placementEventAttributeMapping
    );
    this.placementEventAttributeMappingLookup = Gt(p), a.hashedEmailUserIdentityType && (this._mappedEmailSha256Key = a.hashedEmailUserIdentityType.toLowerCase()), this._workspaceIdSyncApiKey = m(a.workspaceIdSyncApiKey) ? a.workspaceIdSyncApiKey : void 0;
    const f = h().Rokt?.domain, { roktExtensionsQueryParams: g, legacyRoktExtensions: _, loadThankYouElement: v } = $t(
      a.roktExtensions
    ), R = this.applyExitIntentExtensionOverride(
      l,
      g
    ), k = {
      ...h().Rokt?.launcherOptions || {}
    };
    this.integrationName = Lr(k.integrationName), k.integrationName = this.integrationName, this.domain = f;
    const M = {
      loggingUrl: a.loggingUrl,
      errorUrl: a.errorUrl,
      integrationDomain: f,
      isLoggingEnabled: h().config?.isLoggingEnabled === !0
    }, b = new qt(
      M,
      this.integrationName,
      window.__rokt_li_guid__,
      a.accountId
    ), w = new Jt(
      M,
      b,
      this.integrationName,
      window.__rokt_li_guid__,
      a.accountId
    );
    return this.errorReportingService = b, this.loggingService = w, this._flushInitWarnings(), d && w.log({
      message: `Rokt Kit: preselectionConfig setting is invalid [reason=${d}], using the built-in preselection config`,
      code: "PRESELECT_CONFIG_INVALID"
    }), h()._registerErrorReportingService && h()._registerErrorReportingService(b), h()._registerLoggingService && h()._registerLoggingService(w), n ? (this.testHelpers = {
      generateLauncherScript: Ht,
      generateThankYouElementScript: Wt,
      extractRoktExtensionConfig: $t,
      hashEventMessage: Bt,
      parseSettingsString: _e,
      generateMappedEventLookup: Yt,
      generateMappedEventAttributeLookup: Gt,
      sendAdBlockMeasurementSignals: Xt,
      createAutoRemovedIframe: Be,
      djb2: Xe,
      setAllowedOriginHashes: (N) => {
        V._allowedOriginHashes = N;
      },
      ReportingTransport: ae,
      ErrorReportingService: qt,
      LoggingService: Jt,
      RateLimiter: ki,
      ErrorCodes: mt,
      WSDKErrorSeverity: oe,
      resetLauncherAttachState: () => or(this._launcherAttachState)
    }, this.attachLauncher(c, k), "Successfully initialized: " + S) : (v && (h().Rokt.flushOnShoppableAdsReadyMessageQueue?.(this), jt(pr, Wt(f), {
      onLoad: () => {
        this._isThankYouElementLoaded = !0, this._thankYouElementOnLoadCallback && this._thankYouElementOnLoadCallback();
      },
      onError: (N) => {
        console.error("Error loading Rokt Thank You Element script:", N);
      }
    })), this.isLauncherReadyToAttach() ? this.attachLauncher(c, k, _) : (jt(gr, Ht(f, R), {
      onLoad: () => {
        this.isLauncherReadyToAttach() ? this.attachLauncher(c, k, _) : console.error("Rokt object is not available after script load.");
      },
      onError: (N) => {
        console.error("Error loading Rokt launcher script:", N);
      }
    }), this.captureTiming(V.PERFORMANCE_MARKS.RoktScriptAppended)), "Successfully initialized: " + S);
  }
  process(e) {
    if (e.EventDataType === Ft && Oe(window.location.pathname), this.isTargetingDisabled() || (e.EventDataType === Ft && (this._exitIntentEnabledForAccount && (this._exitIntentDispatchedForPageView = !1), this.isPageHistoryAllowed() ? (Hi(this.loggingService), this.capturePageView(e)) : (De(), Ce()), Q(this._preselectState, this.buildPreselectHost(), e)), Rn(this.accountId, e.EventName) && On(this._preselectState, this.buildPreselectHost(), e)), e.EventDataType === mr && (De(), Ce(), st(this._preselectState), this.accountId && (G(this.accountId), Tt(this.accountId), Rt(this.accountId))), !this.isKitReady())
      return "Kit not ready for forwarder: " + S;
    if ($(h().Rokt?.setLocalSessionAttribute) && !mi(e) && (T(this.placementEventAttributeMappingLookup) || this.applyPlacementEventAttributeMapping(e), !T(this.placementEventMappingLookup))) {
      const i = Bt(e.EventDataType, e.EventCategory, e.EventName ?? "");
      this.placementEventMappingLookup[String(i)] && h().Rokt.setLocalSessionAttribute?.(this.placementEventMappingLookup[String(i)], !0);
    }
    return "Successfully sent to forwarder: " + S;
  }
  setExtensionData(e) {
    if (!this.isKitReady()) {
      console.error("Rokt Kit: Not initialized");
      return;
    }
    window.Rokt.setExtensionData(e);
  }
  setUserAttribute(e, i) {
    return Qt(e) || (this.userAttributes[e] = i), (Kn(this.accountId, e) || ct(e, this._mappedEmailSha256Key)) && this.flushPendingPreselectDispatches(), "Successfully set user attribute for forwarder: " + S;
  }
  removeUserAttribute(e) {
    return delete this.userAttributes[e], "Successfully removed user attribute for forwarder: " + S;
  }
  handleIdentityComplete(e, i) {
    return this.userAttributes = Y(e.getAllUserAttributes()), "Successfully called " + i + " for forwarder: " + S;
  }
  onUserIdentified(e) {
    const i = e;
    this.filters.filteredUser = i, this._workspaceSearchInFlightPromise = this.search(i);
    const n = this.handleIdentityComplete(e, "onUserIdentified");
    return this.flushPendingPreselectDispatches(), n;
  }
  search(e) {
    const i = this._workspaceIdSyncApiKey;
    if (!i)
      return this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = void 0, Promise.resolve();
    const n = h().Identity?.search;
    if (typeof n != "function")
      return this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = void 0, Promise.resolve();
    const r = e.getUserIdentities ? e.getUserIdentities().userIdentities : null, s = {};
    if (r)
      for (const c of Object.keys(r)) {
        const l = r[c];
        m(l) && l.length > 0 && (s[c] = l);
      }
    const o = Object.keys(s);
    if (o.length === 0)
      return this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = void 0, Promise.resolve();
    const a = o.sort().map((c) => `${c}=${s[c]}`).join("&");
    return a === this._workspaceLastSearchedIdentitiesKey ? this._workspaceSearchInFlightPromise || Promise.resolve() : (this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = a, new Promise((c) => {
      try {
        n(i, s, (l) => {
          l?.httpCode === 200 && (this.userIdentifiedInWorkspace = !0), c();
        });
      } catch (l) {
        console.error("Rokt Kit: Workspace IDSync search failed", l), this._workspaceLastSearchedIdentitiesKey = void 0, c();
      }
    }));
  }
  onLoginComplete(e, i) {
    return this.handleIdentityComplete(e, "onLoginComplete");
  }
  onLogoutComplete(e, i) {
    return this.userIdentifiedInWorkspace = !1, this._workspaceSearchInFlightPromise = null, this._workspaceLastSearchedIdentitiesKey = void 0, this.accountId && (G(this.accountId), Tt(this.accountId), Rt(this.accountId)), this.handleIdentityComplete(e, "onLogoutComplete");
  }
  onModifyComplete(e, i) {
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
    const i = this.recreateLauncherIfTerminated();
    if (i) {
      const n = this._workspaceSearchInFlightPromise, r = n ? Promise.race([
        n,
        new Promise((s) => setTimeout(s, Vt))
      ]) : Promise.resolve();
      return Promise.all([i, r]).then(
        () => this._dispatchPlacements(e)
      );
    }
    if (this._workspaceSearchInFlightPromise) {
      const n = this._workspaceSearchInFlightPromise;
      return Promise.race([
        n,
        new Promise((r) => setTimeout(r, Vt))
      ]).then(() => this._dispatchPlacements(e));
    }
    return this._dispatchPlacements(e);
  }
  // What a pre-selection call with these attributes would send, mirroring _dispatchPlacements: identities,
  // then the cached user attributes merged in, filtered and overridden for the target page, then the
  // session attributes, so a later source wins as it does on the wire.
  getOutgoingPreselectAttributes(e, i) {
    const n = { ...Y(this.userAttributes), ...e }, r = this.filters || {}, s = r.filterUserAttributes ? r.filterUserAttributes(n, r.userAttributeFilters || []) : n, o = i ? He(s, this.buildPreselectAttributeOverrides(i)) : s;
    return {
      ...this.returnUserIdentities(r.filteredUser || null),
      ...o,
      ...this.returnLocalSessionAttributes()
    };
  }
  _dispatchPlacements(e) {
    const i = e ? jn(e) : void 0;
    if (e?.preselect === !0 && !Pi(this.buildPreselectHost())) {
      i?.();
      return;
    }
    const n = e?.[Ie], r = e?.[Ve], s = { ...e };
    if (delete s[Ie], delete s[Ve], e = s, r !== void 0) {
      const x = I(r) ? String(r.mpid ?? "") : "", pe = h().Identity?.getCurrentUser?.();
      if (x === "" || String(this.filters?.filteredUser?.getMPID?.() ?? "") !== x || String(pe?.getMPID?.() ?? "") !== x || pe?.isLoggedIn?.() !== !0) {
        this.loggingService?.logPlacementDiagnostic(y("missed", "logged_in_dropped")), i?.();
        return;
      }
    }
    const o = I(n) ? n : void 0, a = o && m(o.key) ? o.key : void 0;
    if (a) {
      const x = this.getFormEmailDropCause(a, o.mpid);
      if (x) {
        this.loggingService?.logPlacementDiagnostic(
          y("missed", "form_email_dropped", { cause: x })
        ), i?.();
        return;
      }
    }
    const c = e.attributes || {}, l = Y(this.userAttributes), d = { ...l, ...c }, u = this.filters || {}, p = u.userAttributeFilters || [], f = u.filteredUser || null, g = f ? f.getMPID() : null;
    let _;
    u ? u.filterUserAttributes ? _ = u.filterUserAttributes(d, p) : _ = d : (console.warn("Rokt Kit: No filters available, using user attributes"), _ = d);
    const v = Y(_);
    a && (Object.prototype.hasOwnProperty.call(l, a) ? v[a] = l[a] : delete v[a]), this.userAttributes = v;
    const R = this._onboardingExpProvider === "Optimizely" ? this.fetchOptimizely() : {}, k = this.returnUserIdentities(f), M = this.returnLocalSessionAttributes(), b = this.isPageHistoryAllowed(), w = b ? Vi(St()) : [], N = b ? Wi() : null, _t = this.readMpSessionId(), Et = this.readMpDeviceId(), Le = typeof e.identifier == "string" ? e.identifier : void 0;
    e.preselect !== !0 && Jn(this.buildPreselectHost(), Le);
    const It = e.preselect === !0 ? He(_, this.buildPreselectAttributeOverrides(Le)) : _, Re = {
      ...k,
      ...It,
      ...R,
      ...M,
      ...w.length ? { [_r]: JSON.stringify(w) } : {},
      ...N ? { [Er]: N } : {},
      ...this.userIdentifiedInWorkspace ? { [hr]: !0 } : {},
      ..._t ? { [Ir]: _t } : {},
      ...Et ? { [yr]: Et } : {},
      mpid: g
    }, yt = It[_i];
    if (e.preselect === !0 && m(yt) && yt.indexOf("intent_") === 0 && !he(Re, this._mappedEmailSha256Key)) {
      this.loggingService?.logPlacementDiagnostic(
        y("missed", "no_strict_email", { cause: "lost_before_dispatch" })
      ), i?.();
      return;
    }
    const ke = this.findCacheConfigEntry(Le), vt = ke?.identityKeys, Di = {
      ...e,
      attributes: Re,
      ...ke ? { cacheMatchKeys: Tn(ke) } : {},
      ...vt ? { cacheIdentityKeys: vt } : {}
    }, At = this.launcher.selectPlacements(Di), bt = e.preselect === !0, Ci = () => {
      bt || this.logSelectPlacementsEvent(Re);
    };
    return Promise.resolve(At).then((x) => {
      if (!bt)
        return x?.context?.sessionId?.then((pe) => this.setRoktSessionId(pe));
    }).catch(() => {
    }).finally(Ci), At;
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
    return this.isKitReady() ? (rr(this._launcherAttachState), this.launcher.terminate()) : (console.error("Rokt Kit: Not initialized"), Promise.resolve());
  }
  /**
   * Registers a callback to be invoked once rokt-thank-you-element.js becomes available.
   */
  onShoppableAdsReady(e) {
    this._isThankYouElementLoaded ? e() : this._thankYouElementOnLoadCallback = e;
  }
};
V._allowedOriginHashes = [-553112570, 549508659], V.PERFORMANCE_MARKS = {
  RoktScriptAppended: "mp:RoktScriptAppended"
}, V.EMAIL_SHA256_KEY = "emailsha256";
let Z = V;
function Or() {
  return me;
}
function Kr(t) {
  if (!t) {
    window.console.log("You must pass a config object to register the kit " + S);
    return;
  }
  if (!I(t)) {
    window.console.log("'config' must be an object. You passed in a " + typeof t);
    return;
  }
  I(t.kits) ? t.kits[S] = {
    constructor: Z
  } : (t.kits = {}, t.kits[S] = {
    constructor: Z
  }), window.console.log("Successfully registered " + S + " to your mParticle configuration");
}
typeof window < "u" && window.mParticle && h().addForwarder && h().addForwarder({
  name: S,
  constructor: Z,
  getId: Or
});
export {
  Kr as register
};
//# sourceMappingURL=Rokt-Kit.esm.js.map
