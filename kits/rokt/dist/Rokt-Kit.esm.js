const $t = [
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
], Wt = new Set($t);
function ft(t) {
  return Wt.has(t.toLowerCase());
}
function j(t) {
  const e = {}, i = t || {}, n = Object.keys(i);
  for (let r = 0; r < n.length; r++) {
    const s = n[r];
    ft(s) || (e[s] = i[s]);
  }
  return e;
}
function E(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function g(t) {
  return typeof t == "string";
}
function H(t) {
  return typeof t == "function";
}
function gt(t) {
  try {
    return JSON.parse(t.replace(/&quot;/g, '"'));
  } catch {
    return;
  }
}
function N(t) {
  return t == null ? !0 : typeof t == "string" ? t.length === 0 : typeof t == "object" ? Object.keys(t).length === 0 : !1;
}
function Y(t, e) {
  return Object.prototype.hasOwnProperty.call(t, e) ? t[e] : void 0;
}
function ht(t) {
  try {
    const e = new URL(t);
    return e.search = "", e.toString();
  } catch {
    return t.split("?")[0];
  }
}
function Se(t) {
  try {
    const e = new URL(t);
    return e.search = "", e.hash = "", e.toString();
  } catch {
    return t.split(/[?#]/)[0];
  }
}
function we(t) {
  let e = 5381;
  for (let i = 0; i < t.length; i++)
    e = (e << 5) + e + t.charCodeAt(i), e = e & e;
  return e;
}
const m = "mp-rokt-kit", je = "__rokt_ls_probe__";
function Ye() {
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
function Gt(t) {
  t ? X || (X = { local: Ye(), session: Ye() }) : X = null;
}
const O = () => X?.local ?? window.localStorage, S = () => X?.session ?? window.sessionStorage;
function Ie() {
  try {
    const t = O();
    return t.setItem(je, "1"), t.removeItem(je), !0;
  } catch {
    return !1;
  }
}
function ue(t, e = O) {
  try {
    const i = e().getItem(t);
    return i === null ? null : JSON.parse(i);
  } catch {
    return null;
  }
}
function pt(t, e, i = O) {
  try {
    return i().setItem(t, JSON.stringify(e)), !0;
  } catch {
    return !1;
  }
}
function ye(t, e = O) {
  try {
    e().removeItem(t);
  } catch {
  }
}
function zt() {
  ye(m, () => window.localStorage), ye(m, () => window.sessionStorage);
}
function F(t, e, i = O) {
  const n = ue(t, i);
  return E(n) ? n[e] : void 0;
}
function G(t, e, i, n = O) {
  const r = ue(t, n), s = E(r) ? { ...r } : {};
  return s[e] = i, pt(t, s, n);
}
function mt(t, e, i) {
  Object.keys(e).length === 0 ? ye(t, i) : pt(t, e, i);
}
function de(t, e, i = O) {
  const n = ue(t, i);
  if (!E(n) || !(e in n))
    return;
  const r = { ...n };
  delete r[e], mt(t, r, i);
}
function J(t, e, i = O) {
  const n = ue(t, i);
  if (!E(n))
    return;
  const r = Object.keys(n).filter((a) => a.startsWith(e));
  if (r.length === 0)
    return;
  const s = { ...n };
  r.forEach((a) => delete s[a]), mt(t, s, i);
}
const Re = "pageViews", se = "utmParams", _t = 25, Bt = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
function Et(t) {
  return t.slice(-_t);
}
function $e() {
  const t = F(m, Re);
  return Array.isArray(t) ? t : [];
}
function Xt(t) {
  const e = Et(t);
  for (let i = 0; i < e.length; i++) {
    const n = e.slice(i);
    if (G(m, Re, n))
      return n.length;
  }
  return 0;
}
function We() {
  de(m, Re);
}
function qt(t) {
  const e = Et(t);
  return e.map((i, n) => {
    const r = i.activeTimeOnSite, s = r !== void 0 && Number.isFinite(r), o = e[n + 1]?.activeTimeOnSite, c = o !== void 0 && Number.isFinite(o), l = s && c ? o - r : void 0;
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
function Jt(t) {
  if (F(m, se) !== void 0)
    return;
  const e = new URLSearchParams(window.location.search), i = {};
  for (const r of Bt) {
    const s = e.get(r);
    s && (i[r] = s);
  }
  if (Object.keys(i).length === 0)
    return;
  const n = Object.keys(i).join(", ");
  if (!G(m, se, i)) {
    const r = Ie() ? "quota" : "ls_unavailable";
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
function Qt() {
  const t = F(m, se);
  return E(t) ? t : null;
}
function Ge() {
  de(m, se);
}
function Zt() {
  const e = document.querySelector('link[rel="canonical"]')?.href;
  if (e)
    return ht(e);
}
const ei = [
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
    dispatchDelayMs: 5e3
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
    pathname: "/check-out/pay",
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
], ti = 1, ii = 6e4;
function z(t) {
  return Array.isArray(t) && t.every(g);
}
function ni(t, e) {
  if (!E(e))
    return "not an object";
  const { pathname: i, targetPageIdentifier: n, attributeKeys: r, optionalAttributeKeys: s, identityKeys: a, dispatchDelayMs: o } = e, { triggerEventNames: c, releaseHoldOnRouteChange: l, intentTrigger: u } = e, d = e.preselectAttributeOverrides;
  if (e.accountId !== void 0 && e.accountId !== t)
    return "accountId";
  if (!g(i) || !i.startsWith("/"))
    return "pathname";
  if (!g(n) || n === "")
    return "targetPageIdentifier";
  if (!z(r) || r.length === 0)
    return "attributeKeys";
  if (s !== void 0 && (!z(s) || !s.every((h) => r.includes(h))))
    return "optionalAttributeKeys";
  if (a !== void 0 && (!z(a) || a.length === 0 || !a.every((h) => r.includes(h))))
    return "identityKeys";
  if (o !== void 0 && (!Number.isInteger(o) || o < 0 || o > ii))
    return "dispatchDelayMs";
  if (u !== void 0 && u !== "observe" && u !== "fire")
    return "intentTrigger";
  if (l !== void 0 && typeof l != "boolean")
    return "releaseHoldOnRouteChange";
  if (d !== void 0 && (!E(d) || !Object.entries(d).every(
    ([h, _]) => g(_) && r.includes(h) && !(z(a) && a.includes(h))
  )))
    return "preselectAttributeOverrides";
  if (c !== void 0 && (!z(c) || c.length === 0 || c.some((h) => h === "")))
    return "triggerEventNames";
  const p = { accountId: t, pathname: i, targetPageIdentifier: n, attributeKeys: r };
  return s !== void 0 && (p.optionalAttributeKeys = s), a !== void 0 && (p.identityKeys = a), o !== void 0 && (p.dispatchDelayMs = o), l !== void 0 && (p.releaseHoldOnRouteChange = l), d !== void 0 && (p.preselectAttributeOverrides = d), c !== void 0 && (p.triggerEventNames = c), u !== void 0 && (p.intentTrigger = u), p;
}
function ri(t, e) {
  const i = gt(e);
  if (i === void 0)
    return { error: "invalid JSON" };
  if (!E(i))
    return { error: "not an object" };
  if (i.schemaVersion !== ti)
    return { error: "schemaVersion" };
  if (!Array.isArray(i.entries))
    return { error: "entries" };
  const n = [];
  for (let r = 0; r < i.entries.length; r++) {
    const s = ni(t, i.entries[r]);
    if (g(s))
      return { error: `entry ${r + 1} ${s}` };
    if (n.some((a) => a.targetPageIdentifier === s.targetPageIdentifier))
      return { error: `entry ${r + 1} targetPageIdentifier` };
    n.push(s);
  }
  return { entries: n };
}
const si = 6e4, ke = "activePreselect:";
function oi(t) {
  return E(t) && typeof t.expiresAt == "number" && typeof t.attributesDigest == "number";
}
function It(t, e) {
  return `${ke}${t}:${e}`;
}
function ie(t) {
  const e = F(m, t, S);
  return oi(e) && e.expiresAt > Date.now() ? e : null;
}
function ai(t, e, i = !1) {
  G(
    m,
    t,
    { expiresAt: Date.now() + si, attributesDigest: e, ...i ? { byEvent: !0 } : {} },
    S
  );
}
function ze(t) {
  J(
    m,
    `${ke}${t}:`,
    S
  );
}
function ci() {
  J(m, ke);
}
const li = 5 * 6e4, yt = "pendingPreselect:";
function ui(t) {
  return E(t) && typeof t.expiresAt == "number" && g(t.pathname) && g(t.identifier) && E(t.attributes) && g(t.mpid);
}
function Le(t) {
  return `${yt}${t}`;
}
function De(t) {
  const e = Le(t), i = F(m, e, S);
  return ui(i) ? i.expiresAt <= Date.now() ? (de(m, e, S), null) : i : null;
}
function di(t, e, i, n, r) {
  return G(
    m,
    Le(t),
    {
      expiresAt: Date.now() + li,
      pathname: e,
      identifier: i,
      attributes: n,
      mpid: r
    },
    S
  );
}
function x(t) {
  de(m, Le(t), S);
}
function fi() {
  J(m, yt);
}
const bt = "preselectArrival:", vt = "preselectTriggerAnyTab:", gi = 30 * 6e4, At = 30 * 6e4, be = ["commit", "wallet", "frame", "checkout_step"], hi = ["triggeredAt", "identitySeenAt", "firedAt", "arrivedAt"];
function fe(t, e) {
  return `${bt}${t}:${e}`;
}
function Pt(t, e) {
  return `${vt}${t}:${e}`;
}
function Tt(t) {
  const e = F(m, t, S), i = {};
  if (!E(e))
    return i;
  for (const n of hi)
    typeof e[n] == "number" && (i[n] = e[n]);
  return typeof e.intentAt == "number" && be.includes(e.intentKind) && (i.intentAt = e.intentAt, i.intentKind = e.intentKind), i;
}
function ge(t, e) {
  return G(m, t, e, S);
}
function Ce(t) {
  const e = Tt(t);
  return e.arrivedAt === void 0 ? e : {};
}
function pi(t, e, i) {
  const n = fe(t, e), r = Ce(n), s = Date.now();
  ge(n, {
    ...r,
    triggeredAt: r.triggeredAt ?? s,
    ...i ? { identitySeenAt: r.identitySeenAt ?? s } : {}
  }), G(m, Pt(t, e), {
    triggeredAt: s
  });
}
function mi(t, e) {
  const i = F(m, Pt(t, e));
  if (!E(i) || typeof i.triggeredAt != "number")
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < gi;
}
function _i(t, e) {
  const i = fe(t, e), n = Ce(i);
  ge(i, { ...n, firedAt: n.firedAt ?? Date.now() });
}
function Ei(t, e, i, n) {
  const r = fe(t, e), s = Ce(r);
  if (s.intentAt !== void 0 && s.intentKind !== void 0 && Ii(s.intentAt)) {
    const a = be.indexOf(s.intentKind), o = be.indexOf(i);
    if (a < o || a === o && s.intentAt >= n)
      return;
  }
  ge(r, { ...s, intentAt: n, intentKind: i });
}
function Ii(t) {
  const e = Date.now() - t;
  return e >= 0 && e < At;
}
function yi(t, e) {
  const i = fe(t, e), n = Tt(i);
  if (n.arrivedAt === void 0 && ge(i, { ...n, arrivedAt: Date.now() }))
    return n;
}
function Be(t) {
  J(
    m,
    `${bt}${t}:`,
    S
  ), J(m, `${vt}${t}:`);
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
  }, r = Object.entries(i).map(([s, a]) => ` [${s}=${a}]`).join("");
  return {
    message: `Rokt Kit: preselect ${t} [reason=${e}]${r}`,
    code: n[t]
  };
}
const ve = /* @__PURE__ */ new Map();
function bi(t, e) {
  if (ve.delete(t), !e)
    return;
  const i = ri(t, e);
  if ("error" in i)
    return i.error;
  ve.set(t, i.entries);
}
function M(t) {
  return ve.get(t) ?? ei.filter((e) => e.accountId === t);
}
function vi(t, e) {
  const i = I(t), n = I(e);
  if (!i.includes("*"))
    return i === n;
  const r = i.split("/"), s = n.split("/");
  return r.length !== s.length ? !1 : r.every(
    (a, o) => a === "*" ? s[o] !== "" : a === s[o]
  );
}
function I(t) {
  return t.length > 1 && t.endsWith("/") ? t.slice(0, -1) : t;
}
const St = {}, wt = {}, Rt = {}, Ai = ["commit", "wallet", "checkout_step", "frame"], B = /* @__PURE__ */ new Set(), Ae = /* @__PURE__ */ new Set(), C = [];
function Q(t) {
  if (t === wt) return "intent_commit";
  if (t === Rt) return "intent_wallet";
}
function he(t) {
  return Q(t) !== void 0;
}
function _e(t, e = Date.now()) {
  t = I(t), C[C.length - 1]?.pathname !== t && (C.push({ pathname: t, since: e }), C.length > 8 && C.shift(), Ae.clear());
}
function Ne(t) {
  return !!t && M(t).some((e) => e.intentTrigger);
}
function Pi(t, e, i) {
  if (!i || !Ai.includes(i.kind) || typeof i.t != "number" || !Number.isFinite(i.t))
    return;
  const n = `${i.kind}:${i.t}`;
  if (B.has(n) || (B.add(n), B.size > 4096 && B.delete(B.values().next().value), e.isTargetingDisabled?.() || e.isIntentPrivacyAllowed?.() === !1 || !e.isKitReady() || !e.isPreselectionEnabled() || !Ne(e.accountId)))
    return;
  Ti(e.accountId, i);
  const r = [...C].reverse().find((h) => h.since <= i.t);
  if (!r) return;
  const s = V(e.accountId, r.pathname), a = !!s?.intentTrigger;
  if (!a) return;
  const o = window.location.pathname, c = I(r.pathname) === I(o), l = i.kind === "commit" || i.kind === "wallet";
  if (s?.intentTrigger !== "fire" || !l || !c) {
    const h = `${r.since}:${i.kind}`;
    Ae.has(h) || (Ae.add(h), e.logPlacementDiagnostic(
      y("skipped", "intent_observed", {
        intent_kind: i.kind,
        has_identity: T(e.filteredUser),
        hold_running: !!t.scheduledDispatch,
        on_trigger_path: a
      })
    ));
    return;
  }
  const u = i.kind === "commit" ? "intent_commit" : "intent_wallet", d = t.scheduledDispatch;
  if (d && I(d.pathname) === I(o)) {
    Ue(t), Ut(t, e, d, "intent_released", u);
    return;
  }
  const p = t.pending.find(
    (h) => I(h.pathname) === I(o)
  );
  if (p) {
    p.intentSeen = u;
    return;
  }
  te(
    t,
    e,
    i.kind === "commit" ? wt : Rt,
    o,
    void 0,
    i.t
  );
}
function Ti(t, e) {
  new Set(
    M(t).filter((n) => n.intentTrigger).map((n) => n.targetPageIdentifier)
  ).forEach((n) => Ei(t, n, e.kind, e.t));
}
function $(t) {
  return t === St;
}
const Oe = 4;
function Ke(t, e) {
  return e.EventDataType === Oe && g(e.EventName) && (t.triggerEventNames ?? []).includes(e.EventName);
}
const Si = "rokt.preselecttrigger";
function kt(t, e) {
  return `${t}|${e.pathname}`;
}
function V(t, e) {
  if (t)
    return M(t).find((i) => vi(i.pathname, e));
}
function oe(t, e) {
  if (!(!t || !g(e)))
    return M(t).find((i) => i.targetPageIdentifier === e);
}
function Lt(t, e) {
  if (!e)
    return t;
  const i = new Set(Object.keys(e).map((r) => r.toLowerCase())), n = {};
  for (const [r, s] of Object.entries(t))
    i.has(r.toLowerCase()) || (n[r] = s);
  return { ...n, ...e };
}
function wi(t) {
  const e = Object.keys(t.preselectAttributeOverrides ?? {});
  return [...t.attributeKeys, ...e.filter((i) => !t.attributeKeys.includes(i))];
}
function Ri(t) {
  return t ? M(t).length > 0 : !1;
}
function ki(t, e, i = window.location.pathname) {
  if (t.pending.some((r) => r.pathname === i && !$(r.event)))
    return;
  const n = t.scheduledDispatch;
  n && n.pathname === i && !$(n.event) || te(t, e, St, i);
}
function Li(t, e) {
  return !t || !g(e) ? !1 : M(t).some((i) => (i.triggerEventNames ?? []).includes(e));
}
function ae(t) {
  return !$(t) && !he(t) && t.EventDataType !== Oe;
}
function Di(t, e) {
  const i = t.scheduledDispatch;
  return i && i.pathname === e && ae(i.event) ? !0 : t.pending.some((n) => n.pathname === e && ae(n.event));
}
function Ci(t, e, i, n) {
  if (!t.isKitReady() || !t.isPreselectionEnabled() || !T(t.filteredUser))
    return "waits";
  const { collected: r, missingKeys: s } = pe(t, e, i);
  if (s.length > 0)
    return "waits";
  const a = t.accountId || "", o = ie(It(a, I(n)));
  if (!o)
    return "now";
  const c = Ot(a, i.targetPageIdentifier, r);
  return o.byEvent || c !== void 0 && c === o.attributesDigest ? "skipped" : "now";
}
function Ni(t, e, i) {
  t.pending = t.pending.filter((r) => r.pathname !== i);
  const n = e.accountId ? De(e.accountId) : null;
  e.accountId && n && n.pathname === i && x(e.accountId);
}
function Oi(t, e, i, n = window.location.pathname) {
  const r = V(e.accountId, n);
  if (!r || !Ke(r, i))
    return;
  const s = Ci(e, i, r, n);
  if (s === "now")
    Ni(t, e, n);
  else if (Di(t, n) || s === "skipped" && t.scheduledDispatch?.pathname === n)
    return;
  te(t, e, i, n);
}
function Ki(t, e) {
  return t ? M(t).some((i) => i.attributeKeys.includes(e)) : !1;
}
function Ui() {
  return { pending: [] };
}
function Ue(t) {
  if (t.dispatchTimer === void 0)
    return;
  const e = t.scheduledDispatch;
  return clearTimeout(t.dispatchTimer), t.dispatchTimer = void 0, t.scheduledDispatch = void 0, e;
}
function xi(t, e) {
  return t === void 0 ? e : e === void 0 ? t : Math.min(t, e);
}
function Xe(t) {
  return $(t) ? 0 : he(t) || t.EventDataType === Oe ? 2 : 1;
}
function Fi(t, e) {
  const i = V(t.accountId, e.pathname);
  return !!i && pe(t, e.event, i).missingKeys.length > 0;
}
function Dt(t, e, i, n) {
  const r = t.pending.find((s) => s.pathname === n);
  return !!r && Xe(i) < Xe(r.event) && !(ae(i) && Fi(e, r));
}
function Z(t, e, i) {
  const n = t.pending.findIndex((r) => r.pathname === i.pathname);
  if (n >= 0) {
    if (Dt(t, e, i.event, i.pathname))
      return;
    const r = t.pending[n];
    t.pending[n] = {
      ...i,
      triggeredAt: xi(r.triggeredAt, i.triggeredAt),
      intentSeen: i.intentSeen ?? r.intentSeen ?? Q(r.event)
    };
    return;
  }
  t.pending.push(i);
}
function ee(t) {
  if (!t?.getUserIdentities)
    return [];
  const e = t.getUserIdentities().userIdentities;
  return e ? Object.keys(e).filter((i) => {
    const n = e[i];
    return g(n) && n.length > 0;
  }).sort() : [];
}
function T(t) {
  return ee(t).length > 0;
}
function ce(t) {
  return t.length > 0 ? t.join(",") : "none";
}
function R(t) {
  const e = t?.getMPID?.();
  return e == null ? null : String(e);
}
function Ct(t, e) {
  const i = ee(t.filteredUser), n = t.getCurrentUser?.(), r = ee(n), s = R(t.filteredUser), a = R(n), o = [...e.identityKeys ?? [], "email", "emailsha256"];
  t.mappedEmailSha256Key && o.push(t.mappedEmailSha256Key);
  const c = new Set(o.map((p) => p.toLowerCase())), l = n?.getAllUserAttributes?.() ?? {}, u = [t.userAttributes, l].some(
    (p) => Object.entries(p).some(
      ([h, _]) => c.has(h.toLowerCase()) && g(_) && _.length > 0
    )
  );
  let d = "no_identities";
  return t.filteredUser ? a !== null && s !== a ? d = "mpid_mismatch" : r.length > 0 && (d = "kit_user_lacks_identities") : d = "no_filtered_user", {
    identity_reason: d,
    kit_identity_types: ce(i),
    current_identity_types: ce(r),
    mpid_match: a === null ? "unknown" : s === a,
    identity_attribute_present: u
  };
}
function Nt(t, e) {
  const i = new Set((t.optionalAttributeKeys ?? []).map((n) => n.toLowerCase()));
  return t.attributeKeys.filter(
    (n) => !i.has(n.toLowerCase()) && N(Y(e, n))
  );
}
function pe(t, e, i) {
  const n = t.filteredUser?.getAllUserAttributes?.() || {}, r = new Set(i.identityKeys ?? []);
  let s;
  const a = {};
  for (const o of i.attributeKeys) {
    const c = t.getEventAttributeValue(e, o);
    let l = N(c) ? Y(t.userAttributes, o) ?? Y(n, o) : c;
    if (N(l) && r.has(o)) {
      s || (s = t.getUserIdentities?.() ?? {});
      const u = Y(s, o);
      l = g(u) && u !== "" ? u : void 0;
    }
    N(l) || (a[o] = l);
  }
  return {
    collected: a,
    missingKeys: Nt(i, a)
  };
}
function Mi(t, e) {
  Promise.resolve(t.selectPlacements(e)).catch((i) => {
    const n = i instanceof Error ? i.message : String(i);
    t.log({
      message: `Rokt Kit: Preselect selectPlacements call failed: ${n}`,
      code: "PRESELECT_DISPATCH_FAILED"
    });
  });
}
function Ot(t, e, i) {
  try {
    return we(
      JSON.stringify(
        Lt(
          i,
          oe(t, e)?.preselectAttributeOverrides
        )
      )
    );
  } catch {
    return;
  }
}
function Kt(t, e, i, n, r, s, a, o = !1, c = !1, l = o) {
  if (t.isTargetingDisabled?.() || c && t.isIntentPrivacyAllowed?.() === !1) return !1;
  const u = It(e, i);
  if (o && ie(u)?.byEvent)
    return t.logPlacementDiagnostic(y("skipped", "active_preselection")), !1;
  const d = Ot(e, n, r);
  if (d !== void 0) {
    if (ie(u)?.attributesDigest === d)
      return t.logPlacementDiagnostic(y("skipped", "active_preselection")), !0;
    ai(
      u,
      d,
      l || c && ie(u)?.byEvent === !0
    );
  }
  return t.logPlacementDiagnostic(
    y("fired", s, {
      identity_types: ce(ee(t.filteredUser))
    })
  ), _i(e, n), Mi(t, {
    attributes: { ...r, [Si]: a },
    preselect: !0,
    identifier: n,
    omitUrl: !0
  }), !0;
}
function Vi(t, e) {
  if (!e.accountId || !e.isKitReady())
    return;
  const i = De(e.accountId);
  if (!i)
    return;
  if (t.pending.some((a) => a.pathname === i.pathname)) {
    x(e.accountId);
    return;
  }
  if (!e.isPreselectionEnabled()) {
    x(e.accountId);
    return;
  }
  if (!T(e.filteredUser) || (x(e.accountId), R(e.filteredUser) !== i.mpid))
    return;
  const n = V(e.accountId, i.pathname);
  if (!n || n.targetPageIdentifier !== i.identifier)
    return;
  const r = j(i.attributes), s = Nt(n, r);
  if (s.length > 0) {
    for (const a of s)
      e.logPlacementDiagnostic(y("missed", `missing_persisted_attribute:${a}`));
    return;
  }
  Kt(
    e,
    e.accountId,
    i.identifier,
    i.identifier,
    r,
    "recovered",
    kt("recovered", n)
  );
}
function xe(t) {
  return !t.isTargetingDisabled?.() && t.isKitReady() && t.isPreselectionEnabled();
}
function Fe(t) {
  return t === void 0 ? {} : { since_trigger_ms: Date.now() - t };
}
function Pe(t, e) {
  xe(t) && t.logPlacementDiagnostic(
    y("missed", "left_trigger_path", {
      waiting_for: e.waitingFor,
      has_identity: T(t.filteredUser),
      ...Fe(e.triggeredAt)
    })
  );
}
function te(t, e, i, n = window.location.pathname, r, s = Date.now(), a) {
  const o = t.pending.filter((u) => u.pathname !== n);
  if (o.length > 0) {
    const u = e.accountId ? De(e.accountId) : null;
    e.accountId && u && o.some((d) => d.pathname === u.pathname) && x(e.accountId), o.forEach((d) => Pe(e, d)), t.pending = t.pending.filter((d) => d.pathname === n);
  }
  const c = Ue(t), l = c !== void 0 && c.pathname === n && $(c.event);
  if (c && !l) {
    const u = V(e.accountId, c.pathname);
    I(c.pathname) !== I(n) && u?.releaseHoldOnRouteChange ? (Ut(t, e, c, "hold_released_on_route_change"), t.pending = t.pending.filter((d) => d.pathname === c.pathname ? (Pe(e, d), !1) : !0)) : qe(e, c, n);
  }
  Hi(t, e, i, n, r, s, l, a), l && t.scheduledDispatch === void 0 && qe(e, c, n);
}
function qe(t, e, i) {
  t.logPlacementDiagnostic(
    y("missed", "hold_cancelled", {
      held_ms: Date.now() - e.heldAt,
      same_path: e.pathname === i
    })
  );
}
function Hi(t, e, i, n, r, s, a, o) {
  const c = t.pending.find((u) => I(u.pathname) === I(n));
  if (o ?? (o = Q(i) ?? c?.intentSeen ?? Q(c?.event)), o && e.isIntentPrivacyAllowed?.() === !1 || e.isTargetingDisabled?.())
    return;
  const l = V(e.accountId, n);
  if (l && !(r !== void 0 && R(e.filteredUser) !== r)) {
    if (!e.isKitReady()) {
      if (Dt(t, e, i, n))
        return;
      const u = [], d = R(e.filteredUser);
      if (e.accountId && d && T(e.filteredUser)) {
        const { collected: p, missingKeys: h } = pe(e, i, l);
        if (h.length === 0) {
          const _ = j(p);
          di(
            e.accountId,
            n,
            l.targetPageIdentifier,
            _,
            d
          ) || u.push(y("queued", "persist_failed"));
        }
      }
      Z(t, e, {
        event: i,
        pathname: n,
        storedDiagnostics: u,
        triggeringUserId: r,
        triggeredAt: s,
        waitingFor: "launcher",
        intentSeen: o
      });
      return;
    }
    if (e.isPreselectionEnabled()) {
      if (e.accountId && pi(e.accountId, l.targetPageIdentifier, T(e.filteredUser)), !T(e.filteredUser)) {
        e.logPlacementDiagnostic(
          y("missed", "no_valid_identity", Ct(e, l))
        ), Z(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: o, waitingFor: "identity" });
        return;
      }
      if (l.dispatchDelayMs !== void 0 && !Ke(l, i) && !he(i) && !o) {
        const u = R(e.filteredUser), d = Math.min(
          l.dispatchDelayMs,
          Math.max(0, s + l.dispatchDelayMs - Date.now())
        );
        t.scheduledDispatch = { event: i, pathname: n, heldAt: Date.now(), heldForUserId: u, triggeredAt: s }, a || e.logPlacementDiagnostic(y("held", "dispatch_delay", { delay_ms: d })), t.dispatchTimer = setTimeout(() => {
          t.dispatchTimer = void 0, t.scheduledDispatch = void 0, xt(t, e.getCurrentHost?.() ?? e, i, n, u, s);
        }, d);
        return;
      }
      Ft(
        t,
        e,
        i,
        n,
        l,
        r,
        s,
        void 0,
        o,
        o ? c : void 0
      );
    }
  }
}
function Ut(t, e, i, n, r) {
  xt(
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
function xt(t, e, i, n, r, s, a, o) {
  if (o && e.isIntentPrivacyAllowed?.() === !1) return;
  const c = V(e.accountId, n);
  if (!(!c || e.isTargetingDisabled?.())) {
    if (!e.isKitReady()) {
      Z(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: o, waitingFor: "launcher" });
      return;
    }
    if (e.isPreselectionEnabled()) {
      if (!T(e.filteredUser)) {
        e.logPlacementDiagnostic(
          y("missed", "no_valid_identity", Ct(e, c))
        ), Z(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: o, waitingFor: "identity" });
        return;
      }
      R(e.filteredUser) === r && Ft(t, e, i, n, c, r, s, a, o);
    }
  }
}
function Ft(t, e, i, n, r, s, a, o, c, l) {
  if (c && e.isIntentPrivacyAllowed?.() === !1) return;
  const { collected: u, missingKeys: d } = pe(e, i, r), p = t.lastResolvedPageView, h = C[C.length - 1], _ = I(n);
  if (he(i) && p && p.accountId === e.accountId && p.pathname === _ && p.route === h && p.userId === R(e.filteredUser) && p.identifier === r.targetPageIdentifier && p.attributeKeys.some(
    (b) => r.attributeKeys.includes(b) && N(Y(u, b))
  ))
    return;
  if (d.length > 0) {
    const b = ee(e.filteredUser);
    for (const P of d)
      e.logPlacementDiagnostic(
        y("missed", `missing_attribute:${P}`, {
          identity_types: ce(b),
          key_is_identity: b.some((L) => L.toLowerCase() === P.toLowerCase())
        })
      );
    Z(t, e, {
      event: i,
      pathname: n,
      triggeringUserId: s,
      triggeredAt: a,
      intentSeen: c,
      waitingFor: "attribute"
    });
    return;
  }
  l && (t.pending = t.pending.filter((b) => b !== l));
  const A = Ke(r, i), w = c ?? Q(i), K = w ?? (A ? "event" : $(i) ? "pathname" : "pageview");
  Kt(
    e,
    e.accountId || "",
    I(n),
    r.targetPageIdentifier,
    u,
    o ?? (w ? "intent" : A ? "event_trigger" : "fired"),
    kt(K, r),
    A && !w,
    !!w,
    A
  ) && r.intentTrigger && (ae(i) || A) && (t.lastResolvedPageView = {
    accountId: e.accountId,
    pathname: _,
    route: h,
    userId: R(e.filteredUser),
    identifier: r.targetPageIdentifier,
    attributeKeys: Object.keys(u)
  });
}
function ji(t, e, i = window.location.pathname) {
  if (Vi(t, e), t.pending.length === 0)
    return;
  const n = t.pending;
  t.pending = [], n.forEach(({ event: r, pathname: s, storedDiagnostics: a, triggeringUserId: o, triggeredAt: c, waitingFor: l, intentSeen: u }) => {
    const d = xe(e), p = T(e.filteredUser), h = Fe(c);
    if (d && l === "identity" && p && e.logPlacementDiagnostic(
      y("identity_arrived", "pending_identity", {
        ...h,
        on_trigger_path: s === i
      })
    ), s !== i) {
      Pe(e, { waitingFor: l, triggeredAt: c });
      return;
    }
    d && a?.forEach((_) => e.logPlacementDiagnostic(_)), t.scheduledDispatch?.pathname !== s && te(t, e, r, s, o, c, u);
  });
}
function Yi(t, e) {
  if (!t.accountId || !xe(t))
    return;
  const i = oe(t.accountId, e);
  if (!i)
    return;
  const n = yi(t.accountId, i.targetPageIdentifier);
  if (!n || (Ne(t.accountId) && t.isIntentPrivacyAllowed?.() !== !1 && t.logPlacementDiagnostic(
    y("arrived", "intent_arrival", $i(n))
  ), n.firedAt !== void 0))
    return;
  const r = n.triggeredAt !== void 0;
  t.logPlacementDiagnostic(
    y("missed", "arrival_without_fire", {
      trigger_seen: r,
      identity_seen_on_trigger_path: n.identitySeenAt !== void 0,
      has_identity: T(t.filteredUser),
      // Another tab's checkout caches its offers in that tab, so this arrival still misses. This tab's
      // own trigger counts too: the device marker can expire, be cleared by another tab or fail to save.
      trigger_seen_any_tab: r || mi(t.accountId, i.targetPageIdentifier),
      ...Fe(n.triggeredAt)
    })
  );
}
function $i(t) {
  const e = t.intentAt === void 0 || t.intentKind === void 0 ? "none" : Gi(Date.now() - t.intentAt);
  return {
    intent_seen: e === "none" ? "none" : t.intentKind,
    lead: e,
    fired: t.firedAt !== void 0
  };
}
const Wi = [
  [1e3, "lt1s"],
  [2e3, "1s_2s"],
  [5e3, "2s_5s"],
  [1e4, "5s_10s"],
  [2e4, "10s_20s"],
  [6e4, "20s_60s"],
  [3e5, "60s_300s"],
  [At, "300s_1800s"]
];
function Gi(t) {
  if (t < 0)
    return "none";
  const e = Wi.find(([i]) => t < i);
  return e ? e[1] : "none";
}
function zi() {
  return {
    context: null,
    lifecycle: "idle",
    recreateInFlight: null
  };
}
function Bi(t, e) {
  t.context = {
    accountId: e.accountId,
    launcherOptions: { ...e.launcherOptions },
    legacyRoktExtensions: [...e.legacyRoktExtensions]
  };
}
function Xi(t) {
  t.lifecycle = "attached";
}
function qi(t) {
  t.lifecycle !== "idle" && (t.lifecycle = "terminated");
}
function Ji(t) {
  t.lifecycle = "terminated";
}
function Qi(t) {
  t.context = null, t.lifecycle = "idle", t.recreateInFlight = null;
}
function Zi(t, e, i) {
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
const v = "Rokt", ne = 181, en = "selectPlacements", tn = "apps.roktecommerce.com", nn = 0.1, rn = "ThankYouPageJourney", sn = "rokt-launcher", on = "rokt-thank-you-element", an = "userIdentifiedInWorkspace", Je = 3, cn = 2, ln = "page_events", un = "page_view_attributes", dn = "mparticle_session_id", fn = "mparticle_device_id", Qe = "rokt:intent", Ze = "LEAD_CAPTURE_SUBMITTED", Ee = "exit-intent", gn = [
  "3479519924056514560",
  "3484183287406608384",
  "3198447216177237634",
  "3292347205549055462"
], hn = "exit-intent-placement", et = 500, Me = {
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  UNHANDLED_EXCEPTION: "UNHANDLED_EXCEPTION",
  IDENTITY_REQUEST: "IDENTITY_REQUEST",
  LOG_DELIVERY_FAILURE: "LOG_DELIVERY_FAILURE"
}, q = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARNING: "WARNING"
}, pn = "apps.rokt-api.com", mn = "/v1/log", _n = "/v1/errors", En = 10;
function f() {
  return window.mParticle;
}
function tt(t, e) {
  const n = [me(t), "/wsdk/integrations/launcher.js"].join("");
  return !e || e.length === 0 ? n : n + "?extensions=" + e.join(",");
}
function it(t) {
  return [me(t), "/rokt-elements/rokt-element-thank-you.js"].join("");
}
function me(t) {
  const e = t !== void 0 ? t : pn;
  return e.includes("://") ? e.replace(/\/+$/, "") : ["https://", e].join("");
}
function Mt(t, e, i) {
  if (t)
    return t.startsWith("http://") || t.startsWith("https://") ? t : "https://" + t;
  const r = e?.includes("://") && !/^https?:\/\//i.test(e) ? void 0 : e;
  return me(r) + i;
}
function nt(t, e, i) {
  if (document.getElementById(t)) return;
  const n = document.head || document.body, r = document.createElement("script");
  r.id = t, r.type = "text/javascript", r.src = e, r.async = !0, r.crossOrigin = "anonymous", r.fetchPriority = "high", i?.onLoad && (r.onload = i.onLoad), i?.onError && (r.onerror = i.onError), n.appendChild(r);
}
function re(t) {
  if (!t)
    return [];
  const e = gt(t);
  return e === void 0 ? (console.error("Settings string contains invalid JSON"), []) : e;
}
function rt(t) {
  const e = t ? re(t) : [], i = [], n = [];
  let r = !1;
  for (let s = 0; s < e.length; s++) {
    const a = e[s].value;
    a === "thank-you-journey" ? (r = !0, n.push(rn)) : i.push(a);
  }
  return {
    roktExtensionsQueryParams: i,
    legacyRoktExtensions: n,
    loadThankYouElement: r
  };
}
async function In(t, e) {
  const i = [];
  if (e)
    for (const n of t)
      i.push(e.use(n));
  return Promise.all(i);
}
function st(t) {
  if (!t)
    return {};
  const e = {};
  for (let i = 0; i < t.length; i++) {
    const n = t[i];
    e[n.jsmap] = n.value;
  }
  return e;
}
function ot(t) {
  const e = {};
  if (!Array.isArray(t))
    return e;
  for (let i = 0; i < t.length; i++) {
    const n = t[i];
    if (!n || !g(n.value) || !g(n.map))
      continue;
    const r = n.value, s = n.map;
    e[r] || (e[r] = []), e[r].push({
      eventAttributeKey: s,
      conditions: Array.isArray(n.conditions) ? n.conditions : []
    });
  }
  return e;
}
function at(t, e, i) {
  return f().generateHash([t, e, i].join(""));
}
function yn(t) {
  let n = "mParticle_wsdkv_" + f().getVersion() + "_kitv_" + "3.17.0";
  return t && (n += "_" + t), n;
}
function ct(t) {
  return !!(t && gn.includes(t));
}
function Te(t) {
  const e = document.createElement("iframe");
  e.style.display = "none", e.setAttribute("sandbox", "allow-scripts allow-same-origin"), e.src = t, e.onload = function() {
    e.onload = null, e.parentNode && e.parentNode.removeChild(e);
  };
  const i = document.body || document.head;
  i && i.appendChild(e);
}
function lt(t, e) {
  const i = we(window.location.origin);
  if (W._allowedOriginHashes.indexOf(i) === -1 || Math.random() >= nn)
    return;
  const r = window.__rokt_li_guid__;
  if (!r || t && t.includes("://") && !/^https:\/\//i.test(t))
    return;
  const s = Se(window.location.href), a = "version=" + encodeURIComponent(e ?? "") + "&launcherInstanceGuid=" + encodeURIComponent(r) + "&pageUrl=" + encodeURIComponent(s), o = t ? me(t) : "https://apps.rokt.com";
  Te(o + "/v1/wsdk-init/index.html?" + a), Te(
    "https://" + tn + "/v1/wsdk-init/index.html?" + a + "&isControl=true"
  );
}
function bn() {
  return typeof window < "u" && !!window.location?.search?.toLowerCase().includes("mp_enable_logging=true");
}
function vn() {
  if (typeof window > "u")
    return;
  const t = window.location?.href;
  return t ? Se(t) : void 0;
}
function An() {
  return typeof window < "u" ? window.navigator?.userAgent : void 0;
}
class Vt {
  constructor() {
    this._logCount = {};
  }
  incrementAndCheck(e) {
    const n = (this._logCount[e] || 0) + 1;
    return this._logCount[e] = n, n > En;
  }
}
class le {
  constructor(e, i, n, r, s) {
    this._reporter = "mp-wsdk";
    const a = e.isLoggingEnabled;
    this._integrationName = i || "", this._launcherInstanceGuid = n, this._accountId = r || null, this._rateLimiter = s || new Vt(), this._isEnabled = bn() || a;
  }
  send(e, i, n, r, s, a) {
    if (!(!this._isEnabled || this._rateLimiter.incrementAndCheck(i)))
      try {
        const o = {
          additionalInformation: {
            message: n,
            version: this._integrationName
          },
          severity: i,
          code: r || Me.UNKNOWN_ERROR,
          url: vn(),
          deviceInfo: An(),
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
          body: JSON.stringify(o)
        }).then((l) => {
          if (!l.ok) {
            const u = new Error("HTTP " + l.status + " from log endpoint");
            throw u.statusCode = l.status, u;
          }
        }).catch((l) => {
          console.error("ReportingTransport: Failed to send log", l), a && a(l);
        });
      } catch (o) {
        console.error("ReportingTransport: Failed to send log", o), a && a(o);
      }
  }
}
class ut {
  constructor(e, i, n, r, s) {
    this._transport = new le(e, i, n, r, s), this._errorUrl = Mt(e?.errorUrl, e?.integrationDomain, _n);
  }
  report(e) {
    if (!e) return;
    const i = e.severity || q.ERROR;
    this._transport.send(this._errorUrl, i, e.message, e.code, e.stackTrace);
  }
}
class dt {
  constructor(e, i, n, r, s, a) {
    this._intentObserveLines = 0, this._transport = new le(e, n, r, s, a), this._placementDiagnosticTransport = new le(
      e,
      n,
      r,
      s
    ), this._loggingUrl = Mt(e?.loggingUrl, e?.integrationDomain, mn), this._errorReportingService = i;
  }
  log(e) {
    e && this._send(this._transport, e);
  }
  logPlacementDiagnostic(e) {
    if (e) {
      if (e.code === "PRESELECT_SKIPPED" && e.message.includes("[reason=intent_observed]")) {
        if (this._intentObserveLines >= 4) return;
        this._intentObserveLines++;
      }
      this._send(this._placementDiagnosticTransport, e);
    }
  }
  _send(e, i) {
    e.send(
      this._loggingUrl,
      q.INFO,
      i.message,
      i.code,
      void 0,
      (n) => {
        if (this._errorReportingService) {
          const r = typeof n.statusCode == "number";
          this._errorReportingService.report({
            message: "LoggingService: Failed to send log: " + n.message,
            code: Me.LOG_DELIVERY_FAILURE,
            severity: r ? q.ERROR : q.WARNING
          });
        }
      }
    );
  }
}
function Pn(t) {
  const e = ht(window.location.href), i = t.EventAttributes?.title || document.title, n = Zt(), r = t.ActiveTimeOnSite;
  return {
    pageUrl: e,
    sourceMessageId: t.SourceMessageId,
    timestamp: t.Timestamp,
    ...i ? { pageTitle: i } : {},
    ...n !== void 0 ? { canonicalUrl: n } : {},
    ...Number.isFinite(r) ? { activeTimeOnSite: r } : {}
  };
}
const D = class D {
  constructor() {
    this.name = v, this.id = ne, this.moduleId = ne, this.isInitialized = !1, this.launcher = null, this.filters = {}, this.userAttributes = {}, this.userIdentifiedInWorkspace = !1, this.testHelpers = null, this.placementEventMappingLookup = {}, this.placementEventAttributeMappingLookup = {}, this.integrationName = null, this.errorReportingService = null, this.loggingService = null, this._thankYouElementOnLoadCallback = null, this._isThankYouElementLoaded = !1, this._workspaceSearchInFlightPromise = null, this._launcherAttachState = zi(), this._exitIntentConfig = null, this._exitIntentDispatchedForPageView = !1, this._exitIntentEnabledForAccount = !1, this._pendingInitWarnings = [], this.accountId = null, this._preselectState = Ui();
  }
  // ---- Private helpers ----
  getEventAttributeValue(e, i) {
    const n = e && e.EventAttributes;
    if (!n)
      return null;
    const r = Y(n, i);
    return r === void 0 ? null : r;
  }
  doesEventAttributeConditionMatch(e, i) {
    if (!e || !g(e.operator))
      return !1;
    const n = e.operator.toLowerCase(), r = e.attributeValue;
    return n === "exists" ? i !== null : i == null ? !1 : n === "equals" ? String(i) === String(r) : n === "contains" ? String(i).indexOf(String(r)) !== -1 : !1;
  }
  doesEventMatchRule(e, i) {
    if (!i || !g(i.eventAttributeKey))
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
      if (N(s))
        continue;
      let a = !0;
      for (let o = 0; o < s.length; o++)
        if (!this.doesEventMatchRule(e, s[o])) {
          a = !1;
          break;
        }
      a && f().Rokt.setLocalSessionAttribute?.(r, !0);
    }
  }
  capturePageView(e) {
    let i;
    try {
      i = Se(window.location.href);
      const n = $e(), r = Pn(e);
      n.push(r);
      const s = Math.min(n.length, _t), a = Xt(n);
      if (a === 0) {
        const o = Ie() ? "quota" : "ls_unavailable";
        this.loggingService?.log({
          message: `Rokt Kit: Failed to persist page view for ${i} [reason: ${o}]`,
          code: "PAGE_VIEW_CAPTURE_FAILED"
        });
      } else a < s && this.loggingService?.log({
        message: `Rokt Kit: Page view storage reduced from ${s} to ${a} record(s) under quota pressure [reason: quota_eviction]`,
        code: "PAGE_VIEW_QUOTA_EVICTION"
      });
    } catch (n) {
      const r = Ie() ? "exception" : "ls_unavailable", s = n instanceof Error ? n.message : String(n);
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
      return oe(this.accountId, e);
  }
  buildPreselectAttributeOverrides(e) {
    if (!this.isPreselectionEnabled())
      return;
    const i = oe(this.accountId, e)?.preselectAttributeOverrides, n = this.filters || {};
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
      getEventAttributeValue: (e, i) => this.getEventAttributeValue(e, i),
      logPlacementDiagnostic: (e) => this.loggingService?.logPlacementDiagnostic(e),
      log: (e) => this.loggingService?.log(e),
      selectPlacements: (e) => this.selectPlacements(e),
      isIntentPrivacyAllowed: () => this.isIntentPrivacyAllowed(),
      getCurrentUser: () => f().Identity?.getCurrentUser?.(),
      getCurrentHost: () => this.buildPreselectHost(),
      isTargetingDisabled: () => this.isTargetingDisabled(),
      getUserIdentities: () => this.returnUserIdentities(this.filters.filteredUser),
      mappedEmailSha256Key: this._mappedEmailSha256Key
    };
  }
  flushPendingPreselectDispatches() {
    ji(this._preselectState, this.buildPreselectHost());
  }
  isLauncherReadyToAttach() {
    return !!window.Rokt && H(window.Rokt.createLauncher);
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
    return !f().Rokt || typeof f().Rokt.getLocalSessionAttributes != "function" ? {} : f().Rokt.getLocalSessionAttributes();
  }
  replaceOtherIdentityWithEmailsha256(e) {
    const i = { ...e || {} }, n = this._mappedEmailSha256Key;
    return n && e[n] && (i[D.EMAIL_SHA256_KEY] = e[n]), n && delete i[n], i;
  }
  logSelectPlacementsEvent(e) {
    if (!window.mParticle || typeof f().logEvent != "function" || !E(e))
      return;
    const i = f().EventType.Other;
    f().logEvent(en, i, e);
  }
  setRoktSessionId(e) {
    if (!(!e || typeof e != "string"))
      try {
        const i = f().getInstance();
        i && H(i.setIntegrationAttribute) && i.setIntegrationAttribute(ne, {
          roktSessionId: e
        });
      } catch {
      }
  }
  readMpSessionId() {
    const e = f()?.sessionManager, i = e?.getSessionId ?? e?.getSession;
    if (H(i))
      return i.call(e) || void 0;
  }
  readMpDeviceId() {
    return f()?.getDeviceId?.() || void 0;
  }
  attachLauncher(e, i, n = []) {
    Bi(this._launcherAttachState, {
      accountId: e,
      launcherOptions: i || {},
      legacyRoktExtensions: n
    });
    const r = {
      accountId: e,
      ...i || {}
    };
    let s;
    return this.isPartnerInLocalLauncherTestGroup() ? s = Promise.resolve(window.Rokt.createLocalLauncher(r)) : s = window.Rokt.createLauncher(r), s.then(async (a) => {
      await In([...n], a), this.initRoktLauncher(a);
    }).catch((a) => {
      const o = this._launcherAttachState.lifecycle === "attached";
      if (Ji(this._launcherAttachState), !o) {
        const c = a instanceof Error ? a.message : String(a);
        this.loggingService?.log({
          message: `Rokt Kit: Failed to attach Rokt launcher: ${c}`,
          code: "LAUNCHER_ATTACH_FAILED"
        });
      }
      console.error("Error creating Rokt launcher:", a);
    });
  }
  recreateLauncherIfTerminated() {
    return Zi(
      this._launcherAttachState,
      this.isLauncherReadyToAttach(),
      (e) => this.attachLauncher(e.accountId, e.launcherOptions, e.legacyRoktExtensions)
    );
  }
  initRoktLauncher(e) {
    window.Rokt && (window.Rokt.currentLauncher = e), this.launcher = e, Xi(this._launcherAttachState);
    const i = f().Rokt?.filters;
    i ? (!this.isInitialized && this.filters.filteredUser && (i.filteredUser = this.filters.filteredUser), this.filters = i, i.filteredUser ? this._workspaceSearchInFlightPromise = this.search(i.filteredUser) : console.warn("Rokt Kit: No filtered user has been set.")) : console.warn("Rokt Kit: No filters have been set."), this.isInitialized = !0, lt(this.domain, this.integrationName), f().Rokt.attachKit(this), this.pushExitIntentExtensionConfig(), this.flushPendingPreselectDispatches();
  }
  // Leaving the hook unset is what keeps History unpatched for workspaces that never
  // preselect. The core SDK reads onCheckoutIntent when it has a signal, so an account without
  // intentTrigger entries never hears one.
  armPreselectPathnameTrigger() {
    _e(window.location.pathname), this.onRouteChange = Ri(this.accountId) ? () => this.evaluatePreselectPathname() : void 0, this.onCheckoutIntent = Ne(this.accountId) ? (e) => {
      try {
        Pi(this._preselectState, this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0;
  }
  evaluatePreselectPathname() {
    const e = window.location.pathname;
    _e(e), e !== this._lastPreselectPathname && (this.isTargetingDisabled() || (this._lastPreselectPathname = e, ki(this._preselectState, this.buildPreselectHost(), e)));
  }
  fetchOptimizely() {
    const e = f()._getActiveForwarders().filter((i) => i.name === "Optimizely");
    try {
      if (e.length > 0 && window.optimizely) {
        const i = window.optimizely.get("state");
        return !i || !i.getActiveExperimentIds ? {} : i.getActiveExperimentIds().reduce((s, a) => (s["rokt.custom.optimizely.experiment." + a + ".variationId"] = i.getVariationMap()[a].id, s), {});
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
    return f().Rokt?.launcherOptions?.noTargeting === !0;
  }
  isIntentPrivacyAllowed() {
    return f().Rokt?.launcherOptions?.doNotShareOrSell !== !0 && navigator.globalPrivacyControl !== !0;
  }
  isPartnerInLocalLauncherTestGroup() {
    return !!(f().config && f().config.isLocalLauncherEnabled && this.isAssignedToSampleGroup());
  }
  isAssignedToSampleGroup() {
    return Math.random() > 0.5;
  }
  getEffectiveExitIntentConfig(e) {
    return ct(e) ? {
      identifier: hn,
      signals: {
        mouseExitTop: !0,
        scrollUpFast: !0,
        idle: !0
      }
    } : null;
  }
  applyExitIntentExtensionOverride(e, i) {
    return e ? i.includes(Ee) ? i : [...i, Ee] : i;
  }
  extractExitIntentIdentifier(e) {
    return e ? g(e.identifier) && e.identifier.length > 0 ? e.identifier : g(e.placementIdentifier) && e.placementIdentifier.length > 0 ? e.placementIdentifier : null : null;
  }
  processLeadCaptureSubmittedEvent(e) {
    if (!(e instanceof CustomEvent) || !E(e.detail))
      return;
    const i = e.detail, n = E(i.body) ? i.body : {};
    let r = g(n.email) ? n.email : void 0, s = g(n.mobile_number) ? n.mobile_number : void 0;
    if (!r || !s) {
      const d = Array.isArray(i.fields) ? i.fields : [];
      for (let p = 0; p < d.length; p += 1) {
        const h = d[p];
        if (!g(h.fieldKey) || !g(h.value))
          continue;
        const _ = h.fieldKey.toLowerCase().replace(/[^a-z]/g, "");
        !r && (_ === "email" || _ === "emailaddress") && h.value.length > 0 && (r = h.value), !s && (_ === "mobile" || _ === "mobilenumber" || _ === "phone" || _ === "phonenumber") && (s = h.value);
      }
    }
    const a = {};
    g(r) && r.length > 0 && (a.email = r), g(s) && s.length > 0 && (a.mobile_number = s);
    const o = {};
    this.mergeLeadCaptureUserAttributes(o, E(n.userAttributes) ? n.userAttributes : null), this.mergeLeadCaptureUserAttributes(
      o,
      E(i.userAttributes) ? i.userAttributes : null
    );
    const c = g(n.rclid) ? n.rclid : g(i.rclid) ? i.rclid : void 0;
    c && c.length > 0 && (o.rokt_rclid = c);
    const l = g(n.accountID) ? n.accountID : g(i.accountID) ? i.accountID : void 0;
    l && l.length > 0 && (o.rokt_account_id = l);
    const u = g(n.referralCreativeID) ? n.referralCreativeID : g(i.referralCreativeID) ? i.referralCreativeID : void 0;
    u && u.length > 0 && (o.rokt_referral_creative_id = u), this.applyIdentityCapturePayload(a, o);
  }
  isSafeLeadCaptureUserAttributeKey(e) {
    return e === "__proto__" || e === "constructor" || e === "prototype" ? !1 : /^[a-zA-Z0-9_.-]+$/.test(e);
  }
  isSupportedLeadCaptureUserAttributeValue(e) {
    return g(e) || typeof e == "number" || typeof e == "boolean" ? !0 : Array.isArray(e) ? e.every((i) => g(i)) : !1;
  }
  mergeLeadCaptureUserAttributes(e, i) {
    if (i)
      for (const [n, r] of Object.entries(i))
        this.isSafeLeadCaptureUserAttributeKey(n) && this.isSupportedLeadCaptureUserAttributeValue(r) && (e[n] = r);
  }
  applyIdentityCapturePayload(e, i) {
    const n = {}, r = e.email;
    g(r) && r.length > 0 && (n.email = r);
    const s = e.mobile_number;
    g(s) && s.length > 0 && (n.mobile_number = s);
    const a = f().Identity?.modify;
    if (H(a) && Object.keys(n).length > 0)
      try {
        a({ userIdentities: n });
      } catch (c) {
        this.loggingService?.log({
          message: "Rokt Kit: identity capture modify failed",
          code: "EXIT_INTENT_IDENTITY_MODIFY_FAILED",
          additional_info: c instanceof Error ? { errorName: c.name, errorMessage: c.message } : void 0
        });
      }
    const o = f().Identity?.getCurrentUser?.();
    for (const [c, l] of Object.entries(i))
      if (o?.setUserAttribute)
        try {
          o.setUserAttribute(c, l);
        } catch (u) {
          this.loggingService?.log({
            message: "Rokt Kit: identity capture user attribute update failed",
            code: "EXIT_INTENT_IDENTITY_SET_ATTRIBUTE_FAILED",
            additional_info: u instanceof Error ? { errorName: u.name, errorMessage: u.message, key: c } : { key: c }
          });
        }
  }
  configureExitIntentBridge(e) {
    if (this._exitIntentConfig = this.isTargetingDisabled() ? null : e, this._exitIntentDispatchedForPageView = !1, this._exitIntentListener && (window.removeEventListener(Qe, this._exitIntentListener), this._exitIntentListener = void 0), this._exitIntentLeadCaptureSubmittedListener && (window.removeEventListener(
      Ze,
      this._exitIntentLeadCaptureSubmittedListener
    ), this._exitIntentLeadCaptureSubmittedListener = void 0), this._isIdentityCaptureBridgeEnabled(this._exitIntentConfig) && (this._exitIntentLeadCaptureSubmittedListener = (n) => {
      this.processLeadCaptureSubmittedEvent(n);
    }, window.addEventListener(
      Ze,
      this._exitIntentLeadCaptureSubmittedListener
    )), !this._isExitIntentBridgeEnabled(this._exitIntentConfig))
      return;
    const i = this.extractExitIntentIdentifier(this._exitIntentConfig);
    i && (this._exitIntentListener = (n) => {
      const r = n instanceof CustomEvent && n.detail && g(n.detail.reason) ? n.detail.reason : "unknown";
      if (this._exitIntentDispatchedForPageView || !this.isKitReady() || !(r === "mouse-exit-top" || r === "scroll-up-fast" || r === "idle" || r === "leave-link"))
        return;
      this._exitIntentDispatchedForPageView = !0;
      const a = E(this._exitIntentConfig?.attributes) ? this._exitIntentConfig.attributes : {};
      try {
        const o = f().Rokt?.selectPlacements?.({
          identifier: i,
          attributes: {
            ...a,
            exitIntentReason: r
          }
        });
        Promise.resolve(o).catch(() => {
        });
      } catch {
        this._exitIntentDispatchedForPageView = !1;
        return;
      }
    }, window.addEventListener(Qe, this._exitIntentListener));
  }
  _isExitIntentBridgeEnabled(e) {
    return !!(e && e.enabled !== !1);
  }
  _isIdentityCaptureBridgeEnabled(e) {
    if (!this._isExitIntentBridgeEnabled(e))
      return !1;
    const i = e.identityCapture;
    return E(i) ? i.enabled === !0 : !1;
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
    !this._exitIntentConfig || !H(window.Rokt?.setExtensionData) || window.Rokt.setExtensionData({
      [Ee]: this._exitIntentConfig
    });
  }
  captureTiming(e) {
    window && f() && f().captureTiming && e && f().captureTiming(e);
  }
  // ---- Public methods (mParticle Kit Callbacks) ----
  /**
   * Initializes the Rokt forwarder with settings from the mParticle server.
   */
  init(e, i, n, r, s) {
    const a = f().Rokt?.launcherOptions?.noFunctional === !0;
    Gt(a), a || this.isTargetingDisabled() ? zt() : (ci(), fi()), this.isTargetingDisabled() && (We(), Ge());
    const o = e, c = o.accountId;
    this._exitIntentEnabledForAccount = ct(c);
    const l = this._exitIntentEnabledForAccount ? this.getEffectiveExitIntentConfig(c) : null;
    this._exitIntentEnabledForAccount ? this.configureExitIntentBridge(l) : this.configureExitIntentBridge(null), this.accountId = c || null;
    const u = this.accountId ? bi(this.accountId, o.preselectionConfig) : void 0;
    this.userAttributes = j(s), this.armPreselectPathnameTrigger(), this._onboardingExpProvider = o.onboardingExpProvider;
    const d = re(o.placementEventMapping);
    this.placementEventMappingLookup = st(d);
    const p = re(
      o.placementEventAttributeMapping
    );
    this.placementEventAttributeMappingLookup = ot(p), o.hashedEmailUserIdentityType && (this._mappedEmailSha256Key = o.hashedEmailUserIdentityType.toLowerCase()), this._workspaceIdSyncApiKey = g(o.workspaceIdSyncApiKey) ? o.workspaceIdSyncApiKey : void 0;
    const h = f().Rokt?.domain, { roktExtensionsQueryParams: _, legacyRoktExtensions: A, loadThankYouElement: w } = rt(
      o.roktExtensions
    ), K = this.applyExitIntentExtensionOverride(
      l,
      _
    ), k = {
      ...f().Rokt?.launcherOptions || {}
    };
    this.integrationName = yn(k.integrationName), k.integrationName = this.integrationName, this.domain = h;
    const b = {
      loggingUrl: o.loggingUrl,
      errorUrl: o.errorUrl,
      integrationDomain: h,
      isLoggingEnabled: f().config?.isLoggingEnabled === !0
    }, P = new ut(
      b,
      this.integrationName,
      window.__rokt_li_guid__,
      o.accountId
    ), L = new dt(
      b,
      P,
      this.integrationName,
      window.__rokt_li_guid__,
      o.accountId
    );
    return this.errorReportingService = P, this.loggingService = L, this._flushInitWarnings(), u && L.log({
      message: `Rokt Kit: preselectionConfig setting is invalid [reason=${u}], using the built-in preselection config`,
      code: "PRESELECT_CONFIG_INVALID"
    }), f()._registerErrorReportingService && f()._registerErrorReportingService(P), f()._registerLoggingService && f()._registerLoggingService(L), n ? (this.testHelpers = {
      generateLauncherScript: tt,
      generateThankYouElementScript: it,
      extractRoktExtensionConfig: rt,
      hashEventMessage: at,
      parseSettingsString: re,
      generateMappedEventLookup: st,
      generateMappedEventAttributeLookup: ot,
      sendAdBlockMeasurementSignals: lt,
      createAutoRemovedIframe: Te,
      djb2: we,
      setAllowedOriginHashes: (U) => {
        D._allowedOriginHashes = U;
      },
      ReportingTransport: le,
      ErrorReportingService: ut,
      LoggingService: dt,
      RateLimiter: Vt,
      ErrorCodes: Me,
      WSDKErrorSeverity: q,
      resetLauncherAttachState: () => Qi(this._launcherAttachState)
    }, this.attachLauncher(c, k), "Successfully initialized: " + v) : (w && (f().Rokt.flushOnShoppableAdsReadyMessageQueue?.(this), nt(on, it(h), {
      onLoad: () => {
        this._isThankYouElementLoaded = !0, this._thankYouElementOnLoadCallback && this._thankYouElementOnLoadCallback();
      },
      onError: (U) => {
        console.error("Error loading Rokt Thank You Element script:", U);
      }
    })), this.isLauncherReadyToAttach() ? this.attachLauncher(c, k, A) : (nt(sn, tt(h, K), {
      onLoad: () => {
        this.isLauncherReadyToAttach() ? this.attachLauncher(c, k, A) : console.error("Rokt object is not available after script load.");
      },
      onError: (U) => {
        console.error("Error loading Rokt launcher script:", U);
      }
    }), this.captureTiming(D.PERFORMANCE_MARKS.RoktScriptAppended)), "Successfully initialized: " + v);
  }
  process(e) {
    if (e.EventDataType === Je && _e(window.location.pathname), this.isTargetingDisabled() || (e.EventDataType === Je && (this._exitIntentEnabledForAccount && (this._exitIntentDispatchedForPageView = !1), Jt(this.loggingService), this.capturePageView(e), te(this._preselectState, this.buildPreselectHost(), e)), Li(this.accountId, e.EventName) && Oi(this._preselectState, this.buildPreselectHost(), e)), e.EventDataType === cn && (We(), Ge(), Ue(this._preselectState), this.accountId && (x(this.accountId), ze(this.accountId), Be(this.accountId))), !this.isKitReady())
      return "Kit not ready for forwarder: " + v;
    if (H(f().Rokt?.setLocalSessionAttribute) && (N(this.placementEventAttributeMappingLookup) || this.applyPlacementEventAttributeMapping(e), !N(this.placementEventMappingLookup))) {
      const i = at(e.EventDataType, e.EventCategory, e.EventName ?? "");
      this.placementEventMappingLookup[String(i)] && f().Rokt.setLocalSessionAttribute?.(this.placementEventMappingLookup[String(i)], !0);
    }
    return "Successfully sent to forwarder: " + v;
  }
  setExtensionData(e) {
    if (!this.isKitReady()) {
      console.error("Rokt Kit: Not initialized");
      return;
    }
    window.Rokt.setExtensionData(e);
  }
  setUserAttribute(e, i) {
    return ft(e) || (this.userAttributes[e] = i), Ki(this.accountId, e) && this.flushPendingPreselectDispatches(), "Successfully set user attribute for forwarder: " + v;
  }
  removeUserAttribute(e) {
    return delete this.userAttributes[e], "Successfully removed user attribute for forwarder: " + v;
  }
  handleIdentityComplete(e, i) {
    return this.userAttributes = j(e.getAllUserAttributes()), "Successfully called " + i + " for forwarder: " + v;
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
    const n = f().Identity?.search;
    if (typeof n != "function")
      return this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = void 0, Promise.resolve();
    const r = e.getUserIdentities ? e.getUserIdentities().userIdentities : null, s = {};
    if (r)
      for (const c of Object.keys(r)) {
        const l = r[c];
        g(l) && l.length > 0 && (s[c] = l);
      }
    const a = Object.keys(s);
    if (a.length === 0)
      return this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = void 0, Promise.resolve();
    const o = a.sort().map((c) => `${c}=${s[c]}`).join("&");
    return o === this._workspaceLastSearchedIdentitiesKey ? this._workspaceSearchInFlightPromise || Promise.resolve() : (this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = o, new Promise((c) => {
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
    return this.userIdentifiedInWorkspace = !1, this._workspaceSearchInFlightPromise = null, this._workspaceLastSearchedIdentitiesKey = void 0, this.accountId && (x(this.accountId), ze(this.accountId), Be(this.accountId)), this.handleIdentityComplete(e, "onLogoutComplete");
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
        new Promise((s) => setTimeout(s, et))
      ]) : Promise.resolve();
      return Promise.all([i, r]).then(
        () => this._dispatchPlacements(e)
      );
    }
    if (this._workspaceSearchInFlightPromise) {
      const n = this._workspaceSearchInFlightPromise;
      return Promise.race([
        n,
        new Promise((r) => setTimeout(r, et))
      ]).then(() => this._dispatchPlacements(e));
    }
    return this._dispatchPlacements(e);
  }
  _dispatchPlacements(e) {
    const i = e && e.attributes || {}, r = { ...j(this.userAttributes), ...i }, s = this.filters || {}, a = s.userAttributeFilters || [], o = s.filteredUser || null, c = o ? o.getMPID() : null;
    let l;
    s ? s.filterUserAttributes ? l = s.filterUserAttributes(r, a) : l = r : (console.warn("Rokt Kit: No filters available, using user attributes"), l = r), this.userAttributes = j(l);
    const u = this._onboardingExpProvider === "Optimizely" ? this.fetchOptimizely() : {}, d = this.returnUserIdentities(o), p = this.returnLocalSessionAttributes(), h = qt($e()), _ = Qt(), A = this.readMpSessionId(), w = this.readMpDeviceId(), K = typeof e.identifier == "string" ? e.identifier : void 0;
    e.preselect !== !0 && Yi(this.buildPreselectHost(), K);
    const k = e.preselect === !0 ? Lt(l, this.buildPreselectAttributeOverrides(K)) : l, b = {
      ...d,
      ...k,
      ...u,
      ...p,
      ...h.length ? { [ln]: JSON.stringify(h) } : {},
      ..._ ? { [un]: _ } : {},
      ...this.userIdentifiedInWorkspace ? { [an]: !0 } : {},
      ...A ? { [dn]: A } : {},
      ...w ? { [fn]: w } : {},
      mpid: c
    }, P = this.findCacheConfigEntry(K), L = P?.identityKeys, U = {
      ...e,
      attributes: b,
      ...P ? { cacheMatchKeys: wi(P) } : {},
      ...L ? { cacheIdentityKeys: L } : {}
    }, Ve = this.launcher.selectPlacements(U), He = e.preselect === !0, Ht = () => {
      He || this.logSelectPlacementsEvent(b);
    };
    return Promise.resolve(Ve).then((jt) => {
      if (!He)
        return jt?.context?.sessionId?.then((Yt) => this.setRoktSessionId(Yt));
    }).catch(() => {
    }).finally(Ht), Ve;
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
    return this.isKitReady() ? !e || !g(e) ? Promise.reject(new Error("Rokt Kit: Invalid extension name")) : this.launcher.use(e) : (console.error("Rokt Kit: Not initialized"), Promise.reject(new Error("Rokt Kit: Not initialized")));
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
    return this.isKitReady() ? (qi(this._launcherAttachState), this.launcher.terminate()) : (console.error("Rokt Kit: Not initialized"), Promise.resolve());
  }
  /**
   * Registers a callback to be invoked once rokt-thank-you-element.js becomes available.
   */
  onShoppableAdsReady(e) {
    this._isThankYouElementLoaded ? e() : this._thankYouElementOnLoadCallback = e;
  }
};
D._allowedOriginHashes = [-553112570, 549508659], D.PERFORMANCE_MARKS = {
  RoktScriptAppended: "mp:RoktScriptAppended"
}, D.EMAIL_SHA256_KEY = "emailsha256";
let W = D;
function Tn() {
  return ne;
}
function Sn(t) {
  if (!t) {
    window.console.log("You must pass a config object to register the kit " + v);
    return;
  }
  if (!E(t)) {
    window.console.log("'config' must be an object. You passed in a " + typeof t);
    return;
  }
  E(t.kits) ? t.kits[v] = {
    constructor: W
  } : (t.kits = {}, t.kits[v] = {
    constructor: W
  }), window.console.log("Successfully registered " + v + " to your mParticle configuration");
}
typeof window < "u" && window.mParticle && f().addForwarder && f().addForwarder({
  name: v,
  constructor: W,
  getId: Tn
});
export {
  Sn as register
};
//# sourceMappingURL=Rokt-Kit.esm.js.map
