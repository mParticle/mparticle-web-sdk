const jt = [
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
], $t = new Set(jt);
function ut(t) {
  return $t.has(t.toLowerCase());
}
function j(t) {
  const e = {}, i = t || {}, n = Object.keys(i);
  for (let r = 0; r < n.length; r++) {
    const s = n[r];
    ut(s) || (e[s] = i[s]);
  }
  return e;
}
function E(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function h(t) {
  return typeof t == "string";
}
function H(t) {
  return typeof t == "function";
}
function dt(t) {
  try {
    return JSON.parse(t.replace(/&quot;/g, '"'));
  } catch {
    return;
  }
}
function N(t) {
  return t == null ? !0 : typeof t == "string" ? t.length === 0 : typeof t == "object" ? Object.keys(t).length === 0 : !1;
}
function $(t, e) {
  return Object.prototype.hasOwnProperty.call(t, e) ? t[e] : void 0;
}
function ft(t) {
  try {
    const e = new URL(t);
    return e.search = "", e.toString();
  } catch {
    return t.split("?")[0];
  }
}
function Pe(t) {
  try {
    const e = new URL(t);
    return e.search = "", e.hash = "", e.toString();
  } catch {
    return t.split(/[?#]/)[0];
  }
}
function Se(t) {
  let e = 5381;
  for (let i = 0; i < t.length; i++)
    e = (e << 5) + e + t.charCodeAt(i), e = e & e;
  return e;
}
const m = "mp-rokt-kit", Ve = "__rokt_ls_probe__";
function He() {
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
function Yt(t) {
  t ? X || (X = { local: He(), session: He() }) : X = null;
}
const O = () => X?.local ?? window.localStorage, T = () => X?.session ?? window.sessionStorage;
function Ee() {
  try {
    const t = O();
    return t.setItem(Ve, "1"), t.removeItem(Ve), !0;
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
function gt(t, e, i = O) {
  try {
    return i().setItem(t, JSON.stringify(e)), !0;
  } catch {
    return !1;
  }
}
function Ie(t, e = O) {
  try {
    e().removeItem(t);
  } catch {
  }
}
function Gt() {
  Ie(m, () => window.localStorage), Ie(m, () => window.sessionStorage);
}
function F(t, e, i = O) {
  const n = ue(t, i);
  return E(n) ? n[e] : void 0;
}
function W(t, e, i, n = O) {
  const r = ue(t, n), s = E(r) ? { ...r } : {};
  return s[e] = i, gt(t, s, n);
}
function ht(t, e, i) {
  Object.keys(e).length === 0 ? Ie(t, i) : gt(t, e, i);
}
function de(t, e, i = O) {
  const n = ue(t, i);
  if (!E(n) || !(e in n))
    return;
  const r = { ...n };
  delete r[e], ht(t, r, i);
}
function J(t, e, i = O) {
  const n = ue(t, i);
  if (!E(n))
    return;
  const r = Object.keys(n).filter((a) => a.startsWith(e));
  if (r.length === 0)
    return;
  const s = { ...n };
  r.forEach((a) => delete s[a]), ht(t, s, i);
}
const Te = "pageViews", se = "utmParams", pt = 25, Wt = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
function mt(t) {
  return t.slice(-pt);
}
function je() {
  const t = F(m, Te);
  return Array.isArray(t) ? t : [];
}
function zt(t) {
  const e = mt(t);
  for (let i = 0; i < e.length; i++) {
    const n = e.slice(i);
    if (W(m, Te, n))
      return n.length;
  }
  return 0;
}
function $e() {
  de(m, Te);
}
function Bt(t) {
  const e = mt(t);
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
function Xt(t) {
  if (F(m, se) !== void 0)
    return;
  const e = new URLSearchParams(window.location.search), i = {};
  for (const r of Wt) {
    const s = e.get(r);
    s && (i[r] = s);
  }
  if (Object.keys(i).length === 0)
    return;
  const n = Object.keys(i).join(", ");
  if (!W(m, se, i)) {
    const r = Ee() ? "quota" : "ls_unavailable";
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
function qt() {
  const t = F(m, se);
  return E(t) ? t : null;
}
function Ye() {
  de(m, se);
}
function Jt() {
  const e = document.querySelector('link[rel="canonical"]')?.href;
  if (e)
    return ft(e);
}
const Qt = [
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
], Zt = 1, ei = 6e4;
function z(t) {
  return Array.isArray(t) && t.every(h);
}
function ti(t, e) {
  if (!E(e))
    return "not an object";
  const { pathname: i, targetPageIdentifier: n, attributeKeys: r, optionalAttributeKeys: s, identityKeys: a, dispatchDelayMs: o } = e, { triggerEventNames: c, releaseHoldOnRouteChange: l, intentTrigger: u } = e, d = e.preselectAttributeOverrides;
  if (e.accountId !== void 0 && e.accountId !== t)
    return "accountId";
  if (!h(i) || !i.startsWith("/"))
    return "pathname";
  if (!h(n) || n === "")
    return "targetPageIdentifier";
  if (!z(r) || r.length === 0)
    return "attributeKeys";
  if (s !== void 0 && (!z(s) || !s.every((p) => r.includes(p))))
    return "optionalAttributeKeys";
  if (a !== void 0 && (!z(a) || a.length === 0 || !a.every((p) => r.includes(p))))
    return "identityKeys";
  if (o !== void 0 && (!Number.isInteger(o) || o < 0 || o > ei))
    return "dispatchDelayMs";
  if (u !== void 0 && u !== "observe" && u !== "fire")
    return "intentTrigger";
  if (l !== void 0 && typeof l != "boolean")
    return "releaseHoldOnRouteChange";
  if (d !== void 0 && (!E(d) || !Object.entries(d).every(
    ([p, _]) => h(_) && r.includes(p) && !(z(a) && a.includes(p))
  )))
    return "preselectAttributeOverrides";
  if (c !== void 0 && (!z(c) || c.length === 0 || c.some((p) => p === "")))
    return "triggerEventNames";
  const f = { accountId: t, pathname: i, targetPageIdentifier: n, attributeKeys: r };
  return s !== void 0 && (f.optionalAttributeKeys = s), a !== void 0 && (f.identityKeys = a), o !== void 0 && (f.dispatchDelayMs = o), l !== void 0 && (f.releaseHoldOnRouteChange = l), d !== void 0 && (f.preselectAttributeOverrides = d), c !== void 0 && (f.triggerEventNames = c), u !== void 0 && (f.intentTrigger = u), f;
}
function ii(t, e) {
  const i = dt(e);
  if (i === void 0)
    return { error: "invalid JSON" };
  if (!E(i))
    return { error: "not an object" };
  if (i.schemaVersion !== Zt)
    return { error: "schemaVersion" };
  if (!Array.isArray(i.entries))
    return { error: "entries" };
  const n = [];
  for (let r = 0; r < i.entries.length; r++) {
    const s = ti(t, i.entries[r]);
    if (h(s))
      return { error: `entry ${r + 1} ${s}` };
    if (n.some((a) => a.targetPageIdentifier === s.targetPageIdentifier))
      return { error: `entry ${r + 1} targetPageIdentifier` };
    n.push(s);
  }
  return { entries: n };
}
const ni = 6e4, we = "activePreselect:";
function ri(t) {
  return E(t) && typeof t.expiresAt == "number" && typeof t.attributesDigest == "number";
}
function _t(t, e) {
  return `${we}${t}:${e}`;
}
function ie(t) {
  const e = F(m, t, T);
  return ri(e) && e.expiresAt > Date.now() ? e : null;
}
function si(t, e, i = !1) {
  W(
    m,
    t,
    { expiresAt: Date.now() + ni, attributesDigest: e, ...i ? { byEvent: !0 } : {} },
    T
  );
}
function Ge(t) {
  J(
    m,
    `${we}${t}:`,
    T
  );
}
function oi() {
  J(m, we);
}
const ai = 5 * 6e4, Et = "pendingPreselect:";
function ci(t) {
  return E(t) && typeof t.expiresAt == "number" && h(t.pathname) && h(t.identifier) && E(t.attributes) && h(t.mpid);
}
function Re(t) {
  return `${Et}${t}`;
}
function ke(t) {
  const e = Re(t), i = F(m, e, T);
  return ci(i) ? i.expiresAt <= Date.now() ? (de(m, e, T), null) : i : null;
}
function li(t, e, i, n, r) {
  return W(
    m,
    Re(t),
    {
      expiresAt: Date.now() + ai,
      pathname: e,
      identifier: i,
      attributes: n,
      mpid: r
    },
    T
  );
}
function x(t) {
  de(m, Re(t), T);
}
function ui() {
  J(m, Et);
}
const It = "preselectArrival:", yt = "preselectTriggerAnyTab:", di = 30 * 6e4, fi = ["triggeredAt", "identitySeenAt", "firedAt", "arrivedAt"];
function Le(t, e) {
  return `${It}${t}:${e}`;
}
function bt(t, e) {
  return `${yt}${t}:${e}`;
}
function vt(t) {
  const e = F(m, t, T), i = {};
  if (!E(e))
    return i;
  for (const n of fi)
    typeof e[n] == "number" && (i[n] = e[n]);
  return i;
}
function De(t, e) {
  return W(m, t, e, T);
}
function At(t) {
  const e = vt(t);
  return e.arrivedAt === void 0 ? e : {};
}
function gi(t, e, i) {
  const n = Le(t, e), r = At(n), s = Date.now();
  De(n, {
    ...r,
    triggeredAt: r.triggeredAt ?? s,
    ...i ? { identitySeenAt: r.identitySeenAt ?? s } : {}
  }), W(m, bt(t, e), {
    triggeredAt: s
  });
}
function hi(t, e) {
  const i = F(m, bt(t, e));
  if (!E(i) || typeof i.triggeredAt != "number")
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < di;
}
function pi(t, e) {
  const i = Le(t, e), n = At(i);
  De(i, { ...n, firedAt: n.firedAt ?? Date.now() });
}
function mi(t, e) {
  const i = Le(t, e), n = vt(i);
  if (n.arrivedAt === void 0 && De(i, { ...n, arrivedAt: Date.now() }))
    return n;
}
function We(t) {
  J(
    m,
    `${It}${t}:`,
    T
  ), J(m, `${yt}${t}:`);
}
function y(t, e, i = {}) {
  const n = {
    fired: "PRESELECT_FIRED",
    missed: "PRESELECT_MISSED",
    queued: "PRESELECT_QUEUED",
    skipped: "PRESELECT_SKIPPED",
    held: "PRESELECT_HELD",
    identity_arrived: "PRESELECT_IDENTITY_ARRIVED"
  }, r = Object.entries(i).map(([s, a]) => ` [${s}=${a}]`).join("");
  return {
    message: `Rokt Kit: preselect ${t} [reason=${e}]${r}`,
    code: n[t]
  };
}
const ye = /* @__PURE__ */ new Map();
function _i(t, e) {
  if (ye.delete(t), !e)
    return;
  const i = ii(t, e);
  if ("error" in i)
    return i.error;
  ye.set(t, i.entries);
}
function M(t) {
  return ye.get(t) ?? Qt.filter((e) => e.accountId === t);
}
function Ei(t, e) {
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
const Pt = {}, St = {}, Tt = {};
let pe;
const B = /* @__PURE__ */ new Set(), be = /* @__PURE__ */ new Set(), C = [];
function Q(t) {
  if (t === St) return "intent_commit";
  if (t === Tt) return "intent_wallet";
}
function fe(t) {
  return Q(t) !== void 0;
}
function me(t, e = Date.now()) {
  t = I(t), C[C.length - 1]?.pathname !== t && (C.push({ pathname: t, since: e }), C.length > 8 && C.shift(), be.clear());
}
function Ii(t, e, i) {
  try {
    const n = pe;
    pe = void 0, n?.(), e && M(e).some((r) => r.intentTrigger) && typeof t.__subscribePreselectIntent == "function" && (pe = t.__subscribePreselectIntent(i));
  } catch {
    return;
  }
}
function yi(t, e, i) {
  if (!i || !["commit", "wallet", "checkout_step", "frame"].includes(i.kind) || !["observe", "fire"].includes(i.mode) || typeof i.t != "number" || !Number.isFinite(i.t))
    return;
  const n = `${i.kind}:${i.t}`;
  if (B.has(n) || (B.add(n), B.size > 4096 && B.delete(B.values().next().value), e.isTargetingDisabled?.() || e.isIntentPrivacyAllowed?.() === !1 || !e.isKitReady() || !e.isPreselectionEnabled() || !e.accountId || !M(e.accountId).some((f) => f.intentTrigger)))
    return;
  const r = [...C].reverse().find((f) => f.since <= i.t);
  if (!r) return;
  const s = V(e.accountId, r.pathname), a = !!s?.intentTrigger;
  if (!a || i.kind !== "commit" && i.kind !== "wallet") return;
  const o = window.location.pathname, c = I(r.pathname) === I(o);
  if (s?.intentTrigger !== "fire" || i.mode !== "fire" || !c) {
    const f = `${r.since}:${i.kind}`;
    be.has(f) || (be.add(f), e.logPlacementDiagnostic(
      y("skipped", "intent_observed", {
        intent_kind: i.kind,
        has_identity: S(e.filteredUser),
        hold_running: !!t.scheduledDispatch,
        on_trigger_path: a
      })
    ));
    return;
  }
  const l = i.kind === "commit" ? "intent_commit" : "intent_wallet", u = t.scheduledDispatch;
  if (u && I(u.pathname) === I(o)) {
    Oe(t), Ot(t, e, u, "intent_released", l);
    return;
  }
  const d = t.pending.find(
    (f) => I(f.pathname) === I(o)
  );
  if (d) {
    d.intentSeen = l;
    return;
  }
  te(
    t,
    e,
    i.kind === "commit" ? St : Tt,
    o,
    void 0,
    i.t
  );
}
function Y(t) {
  return t === Pt;
}
const Ce = 4;
function Ne(t, e) {
  return e.EventDataType === Ce && h(e.EventName) && (t.triggerEventNames ?? []).includes(e.EventName);
}
const bi = "rokt.preselecttrigger";
function wt(t, e) {
  return `${t}|${e.pathname}`;
}
function V(t, e) {
  if (t)
    return M(t).find((i) => Ei(i.pathname, e));
}
function oe(t, e) {
  if (!(!t || !h(e)))
    return M(t).find((i) => i.targetPageIdentifier === e);
}
function Rt(t, e) {
  if (!e)
    return t;
  const i = new Set(Object.keys(e).map((r) => r.toLowerCase())), n = {};
  for (const [r, s] of Object.entries(t))
    i.has(r.toLowerCase()) || (n[r] = s);
  return { ...n, ...e };
}
function vi(t) {
  const e = Object.keys(t.preselectAttributeOverrides ?? {});
  return [...t.attributeKeys, ...e.filter((i) => !t.attributeKeys.includes(i))];
}
function Ai(t) {
  return t ? M(t).length > 0 : !1;
}
function Pi(t, e, i = window.location.pathname) {
  if (t.pending.some((r) => r.pathname === i && !Y(r.event)))
    return;
  const n = t.scheduledDispatch;
  n && n.pathname === i && !Y(n.event) || te(t, e, Pt, i);
}
function Si(t, e) {
  return !t || !h(e) ? !1 : M(t).some((i) => (i.triggerEventNames ?? []).includes(e));
}
function ae(t) {
  return !Y(t) && !fe(t) && t.EventDataType !== Ce;
}
function Ti(t, e) {
  const i = t.scheduledDispatch;
  return i && i.pathname === e && ae(i.event) ? !0 : t.pending.some((n) => n.pathname === e && ae(n.event));
}
function wi(t, e, i, n) {
  if (!t.isKitReady() || !t.isPreselectionEnabled() || !S(t.filteredUser))
    return "waits";
  const { collected: r, missingKeys: s } = ge(t, e, i);
  if (s.length > 0)
    return "waits";
  const a = t.accountId || "", o = ie(_t(a, I(n)));
  if (!o)
    return "now";
  const c = Ct(a, i.targetPageIdentifier, r);
  return o.byEvent || c !== void 0 && c === o.attributesDigest ? "skipped" : "now";
}
function Ri(t, e, i) {
  t.pending = t.pending.filter((r) => r.pathname !== i);
  const n = e.accountId ? ke(e.accountId) : null;
  e.accountId && n && n.pathname === i && x(e.accountId);
}
function ki(t, e, i, n = window.location.pathname) {
  const r = V(e.accountId, n);
  if (!r || !Ne(r, i))
    return;
  const s = wi(e, i, r, n);
  if (s === "now")
    Ri(t, e, n);
  else if (Ti(t, n) || s === "skipped" && t.scheduledDispatch?.pathname === n)
    return;
  te(t, e, i, n);
}
function Li(t, e) {
  return t ? M(t).some((i) => i.attributeKeys.includes(e)) : !1;
}
function Di() {
  return { pending: [] };
}
function Oe(t) {
  if (t.dispatchTimer === void 0)
    return;
  const e = t.scheduledDispatch;
  return clearTimeout(t.dispatchTimer), t.dispatchTimer = void 0, t.scheduledDispatch = void 0, e;
}
function Ci(t, e) {
  return t === void 0 ? e : e === void 0 ? t : Math.min(t, e);
}
function ze(t) {
  return Y(t) ? 0 : fe(t) || t.EventDataType === Ce ? 2 : 1;
}
function Ni(t, e) {
  const i = V(t.accountId, e.pathname);
  return !!i && ge(t, e.event, i).missingKeys.length > 0;
}
function kt(t, e, i, n) {
  const r = t.pending.find((s) => s.pathname === n);
  return !!r && ze(i) < ze(r.event) && !(ae(i) && Ni(e, r));
}
function Z(t, e, i) {
  const n = t.pending.findIndex((r) => r.pathname === i.pathname);
  if (n >= 0) {
    if (kt(t, e, i.event, i.pathname))
      return;
    const r = t.pending[n];
    t.pending[n] = {
      ...i,
      triggeredAt: Ci(r.triggeredAt, i.triggeredAt),
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
    return h(n) && n.length > 0;
  }).sort() : [];
}
function S(t) {
  return ee(t).length > 0;
}
function ce(t) {
  return t.length > 0 ? t.join(",") : "none";
}
function R(t) {
  const e = t?.getMPID?.();
  return e == null ? null : String(e);
}
function Lt(t, e) {
  const i = ee(t.filteredUser), n = t.getCurrentUser?.(), r = ee(n), s = R(t.filteredUser), a = R(n), o = [...e.identityKeys ?? [], "email", "emailsha256"];
  t.mappedEmailSha256Key && o.push(t.mappedEmailSha256Key);
  const c = new Set(o.map((f) => f.toLowerCase())), l = n?.getAllUserAttributes?.() ?? {}, u = [t.userAttributes, l].some(
    (f) => Object.entries(f).some(
      ([p, _]) => c.has(p.toLowerCase()) && h(_) && _.length > 0
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
function Dt(t, e) {
  const i = new Set((t.optionalAttributeKeys ?? []).map((n) => n.toLowerCase()));
  return t.attributeKeys.filter(
    (n) => !i.has(n.toLowerCase()) && N($(e, n))
  );
}
function ge(t, e, i) {
  const n = t.filteredUser?.getAllUserAttributes?.() || {}, r = new Set(i.identityKeys ?? []);
  let s;
  const a = {};
  for (const o of i.attributeKeys) {
    const c = t.getEventAttributeValue(e, o);
    let l = N(c) ? $(t.userAttributes, o) ?? $(n, o) : c;
    if (N(l) && r.has(o)) {
      s || (s = t.getUserIdentities?.() ?? {});
      const u = $(s, o);
      l = h(u) && u !== "" ? u : void 0;
    }
    N(l) || (a[o] = l);
  }
  return {
    collected: a,
    missingKeys: Dt(i, a)
  };
}
function Oi(t, e) {
  Promise.resolve(t.selectPlacements(e)).catch((i) => {
    const n = i instanceof Error ? i.message : String(i);
    t.log({
      message: `Rokt Kit: Preselect selectPlacements call failed: ${n}`,
      code: "PRESELECT_DISPATCH_FAILED"
    });
  });
}
function Ct(t, e, i) {
  try {
    return Se(
      JSON.stringify(
        Rt(
          i,
          oe(t, e)?.preselectAttributeOverrides
        )
      )
    );
  } catch {
    return;
  }
}
function Nt(t, e, i, n, r, s, a, o = !1, c = !1, l = o) {
  if (t.isTargetingDisabled?.() || c && t.isIntentPrivacyAllowed?.() === !1) return !1;
  const u = _t(e, i);
  if (o && ie(u)?.byEvent)
    return t.logPlacementDiagnostic(y("skipped", "active_preselection")), !1;
  const d = Ct(e, n, r);
  if (d !== void 0) {
    if (ie(u)?.attributesDigest === d)
      return t.logPlacementDiagnostic(y("skipped", "active_preselection")), !0;
    si(
      u,
      d,
      l || c && ie(u)?.byEvent === !0
    );
  }
  return t.logPlacementDiagnostic(
    y("fired", s, {
      identity_types: ce(ee(t.filteredUser))
    })
  ), pi(e, n), Oi(t, {
    attributes: { ...r, [bi]: a },
    preselect: !0,
    identifier: n,
    omitUrl: !0
  }), !0;
}
function Ui(t, e) {
  if (!e.accountId || !e.isKitReady())
    return;
  const i = ke(e.accountId);
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
  if (!S(e.filteredUser) || (x(e.accountId), R(e.filteredUser) !== i.mpid))
    return;
  const n = V(e.accountId, i.pathname);
  if (!n || n.targetPageIdentifier !== i.identifier)
    return;
  const r = j(i.attributes), s = Dt(n, r);
  if (s.length > 0) {
    for (const a of s)
      e.logPlacementDiagnostic(y("missed", `missing_persisted_attribute:${a}`));
    return;
  }
  Nt(
    e,
    e.accountId,
    i.identifier,
    i.identifier,
    r,
    "recovered",
    wt("recovered", n)
  );
}
function Ue(t) {
  return !t.isTargetingDisabled?.() && t.isKitReady() && t.isPreselectionEnabled();
}
function Ke(t) {
  return t === void 0 ? {} : { since_trigger_ms: Date.now() - t };
}
function ve(t, e) {
  Ue(t) && t.logPlacementDiagnostic(
    y("missed", "left_trigger_path", {
      waiting_for: e.waitingFor,
      has_identity: S(t.filteredUser),
      ...Ke(e.triggeredAt)
    })
  );
}
function te(t, e, i, n = window.location.pathname, r, s = Date.now(), a) {
  const o = t.pending.filter((u) => u.pathname !== n);
  if (o.length > 0) {
    const u = e.accountId ? ke(e.accountId) : null;
    e.accountId && u && o.some((d) => d.pathname === u.pathname) && x(e.accountId), o.forEach((d) => ve(e, d)), t.pending = t.pending.filter((d) => d.pathname === n);
  }
  const c = Oe(t), l = c !== void 0 && c.pathname === n && Y(c.event);
  if (c && !l) {
    const u = V(e.accountId, c.pathname);
    I(c.pathname) !== I(n) && u?.releaseHoldOnRouteChange ? (Ot(t, e, c, "hold_released_on_route_change"), t.pending = t.pending.filter((d) => d.pathname === c.pathname ? (ve(e, d), !1) : !0)) : Be(e, c, n);
  }
  Ki(t, e, i, n, r, s, l, a), l && t.scheduledDispatch === void 0 && Be(e, c, n);
}
function Be(t, e, i) {
  t.logPlacementDiagnostic(
    y("missed", "hold_cancelled", {
      held_ms: Date.now() - e.heldAt,
      same_path: e.pathname === i
    })
  );
}
function Ki(t, e, i, n, r, s, a, o) {
  const c = t.pending.find((u) => I(u.pathname) === I(n));
  if (o ?? (o = Q(i) ?? c?.intentSeen ?? Q(c?.event)), o && e.isIntentPrivacyAllowed?.() === !1 || e.isTargetingDisabled?.())
    return;
  const l = V(e.accountId, n);
  if (l && !(r !== void 0 && R(e.filteredUser) !== r)) {
    if (!e.isKitReady()) {
      if (kt(t, e, i, n))
        return;
      const u = [], d = R(e.filteredUser);
      if (e.accountId && d && S(e.filteredUser)) {
        const { collected: f, missingKeys: p } = ge(e, i, l);
        if (p.length === 0) {
          const _ = j(f);
          li(
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
      if (e.accountId && gi(e.accountId, l.targetPageIdentifier, S(e.filteredUser)), !S(e.filteredUser)) {
        e.logPlacementDiagnostic(
          y("missed", "no_valid_identity", Lt(e, l))
        ), Z(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: o, waitingFor: "identity" });
        return;
      }
      if (l.dispatchDelayMs !== void 0 && !Ne(l, i) && !fe(i) && !o) {
        const u = R(e.filteredUser), d = Math.min(
          l.dispatchDelayMs,
          Math.max(0, s + l.dispatchDelayMs - Date.now())
        );
        t.scheduledDispatch = { event: i, pathname: n, heldAt: Date.now(), heldForUserId: u, triggeredAt: s }, a || e.logPlacementDiagnostic(y("held", "dispatch_delay", { delay_ms: d })), t.dispatchTimer = setTimeout(() => {
          t.dispatchTimer = void 0, t.scheduledDispatch = void 0, Ut(t, e.getCurrentHost?.() ?? e, i, n, u, s);
        }, d);
        return;
      }
      Kt(
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
function Ot(t, e, i, n, r) {
  Ut(
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
function Ut(t, e, i, n, r, s, a, o) {
  if (o && e.isIntentPrivacyAllowed?.() === !1) return;
  const c = V(e.accountId, n);
  if (!(!c || e.isTargetingDisabled?.())) {
    if (!e.isKitReady()) {
      Z(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: o, waitingFor: "launcher" });
      return;
    }
    if (e.isPreselectionEnabled()) {
      if (!S(e.filteredUser)) {
        e.logPlacementDiagnostic(
          y("missed", "no_valid_identity", Lt(e, c))
        ), Z(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: o, waitingFor: "identity" });
        return;
      }
      R(e.filteredUser) === r && Kt(t, e, i, n, c, r, s, a, o);
    }
  }
}
function Kt(t, e, i, n, r, s, a, o, c, l) {
  if (c && e.isIntentPrivacyAllowed?.() === !1) return;
  const { collected: u, missingKeys: d } = ge(e, i, r), f = t.lastResolvedPageView, p = C[C.length - 1], _ = I(n);
  if (fe(i) && f && f.accountId === e.accountId && f.pathname === _ && f.route === p && f.userId === R(e.filteredUser) && f.identifier === r.targetPageIdentifier && f.attributeKeys.some(
    (b) => r.attributeKeys.includes(b) && N($(u, b))
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
  const A = Ne(r, i), w = c ?? Q(i), U = w ?? (A ? "event" : Y(i) ? "pathname" : "pageview");
  Nt(
    e,
    e.accountId || "",
    I(n),
    r.targetPageIdentifier,
    u,
    o ?? (w ? "intent" : A ? "event_trigger" : "fired"),
    wt(U, r),
    A && !w,
    !!w,
    A
  ) && r.intentTrigger && (ae(i) || A) && (t.lastResolvedPageView = {
    accountId: e.accountId,
    pathname: _,
    route: p,
    userId: R(e.filteredUser),
    identifier: r.targetPageIdentifier,
    attributeKeys: Object.keys(u)
  });
}
function xi(t, e, i = window.location.pathname) {
  if (Ui(t, e), t.pending.length === 0)
    return;
  const n = t.pending;
  t.pending = [], n.forEach(({ event: r, pathname: s, storedDiagnostics: a, triggeringUserId: o, triggeredAt: c, waitingFor: l, intentSeen: u }) => {
    const d = Ue(e), f = S(e.filteredUser), p = Ke(c);
    if (d && l === "identity" && f && e.logPlacementDiagnostic(
      y("identity_arrived", "pending_identity", {
        ...p,
        on_trigger_path: s === i
      })
    ), s !== i) {
      ve(e, { waitingFor: l, triggeredAt: c });
      return;
    }
    d && a?.forEach((_) => e.logPlacementDiagnostic(_)), t.scheduledDispatch?.pathname !== s && te(t, e, r, s, o, c, u);
  });
}
function Fi(t, e) {
  if (!t.accountId || !Ue(t))
    return;
  const i = oe(t.accountId, e);
  if (!i)
    return;
  const n = mi(t.accountId, i.targetPageIdentifier);
  if (!n || n.firedAt !== void 0)
    return;
  const r = n.triggeredAt !== void 0;
  t.logPlacementDiagnostic(
    y("missed", "arrival_without_fire", {
      trigger_seen: r,
      identity_seen_on_trigger_path: n.identitySeenAt !== void 0,
      has_identity: S(t.filteredUser),
      // Another tab's checkout caches its offers in that tab, so this arrival still misses. This tab's
      // own trigger counts too: the device marker can expire, be cleared by another tab or fail to save.
      trigger_seen_any_tab: r || hi(t.accountId, i.targetPageIdentifier),
      ...Ke(n.triggeredAt)
    })
  );
}
function Mi() {
  return {
    context: null,
    lifecycle: "idle",
    recreateInFlight: null
  };
}
function Vi(t, e) {
  t.context = {
    accountId: e.accountId,
    launcherOptions: { ...e.launcherOptions },
    legacyRoktExtensions: [...e.legacyRoktExtensions]
  };
}
function Hi(t) {
  t.lifecycle = "attached";
}
function ji(t) {
  t.lifecycle !== "idle" && (t.lifecycle = "terminated");
}
function $i(t) {
  t.lifecycle = "terminated";
}
function Yi(t) {
  t.context = null, t.lifecycle = "idle", t.recreateInFlight = null;
}
function Gi(t, e, i) {
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
const v = "Rokt", ne = 181, Wi = "selectPlacements", zi = "apps.roktecommerce.com", Bi = 0.1, Xi = "ThankYouPageJourney", qi = "rokt-launcher", Ji = "rokt-thank-you-element", Qi = "userIdentifiedInWorkspace", Xe = 3, Zi = 2, en = "page_events", tn = "page_view_attributes", nn = "mparticle_session_id", rn = "mparticle_device_id", qe = "rokt:intent", Je = "LEAD_CAPTURE_SUBMITTED", _e = "exit-intent", sn = [
  "3479519924056514560",
  "3484183287406608384",
  "3198447216177237634",
  "3292347205549055462"
], on = "exit-intent-placement", Qe = 500, xe = {
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  UNHANDLED_EXCEPTION: "UNHANDLED_EXCEPTION",
  IDENTITY_REQUEST: "IDENTITY_REQUEST",
  LOG_DELIVERY_FAILURE: "LOG_DELIVERY_FAILURE"
}, q = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARNING: "WARNING"
}, an = "apps.rokt-api.com", cn = "/v1/log", ln = "/v1/errors", un = 10;
function g() {
  return window.mParticle;
}
function Ze(t, e) {
  const n = [he(t), "/wsdk/integrations/launcher.js"].join("");
  return !e || e.length === 0 ? n : n + "?extensions=" + e.join(",");
}
function et(t) {
  return [he(t), "/rokt-elements/rokt-element-thank-you.js"].join("");
}
function he(t) {
  const e = t !== void 0 ? t : an;
  return e.includes("://") ? e.replace(/\/+$/, "") : ["https://", e].join("");
}
function xt(t, e, i) {
  if (t)
    return t.startsWith("http://") || t.startsWith("https://") ? t : "https://" + t;
  const r = e?.includes("://") && !/^https?:\/\//i.test(e) ? void 0 : e;
  return he(r) + i;
}
function tt(t, e, i) {
  if (document.getElementById(t)) return;
  const n = document.head || document.body, r = document.createElement("script");
  r.id = t, r.type = "text/javascript", r.src = e, r.async = !0, r.crossOrigin = "anonymous", r.fetchPriority = "high", i?.onLoad && (r.onload = i.onLoad), i?.onError && (r.onerror = i.onError), n.appendChild(r);
}
function re(t) {
  if (!t)
    return [];
  const e = dt(t);
  return e === void 0 ? (console.error("Settings string contains invalid JSON"), []) : e;
}
function it(t) {
  const e = t ? re(t) : [], i = [], n = [];
  let r = !1;
  for (let s = 0; s < e.length; s++) {
    const a = e[s].value;
    a === "thank-you-journey" ? (r = !0, n.push(Xi)) : i.push(a);
  }
  return {
    roktExtensionsQueryParams: i,
    legacyRoktExtensions: n,
    loadThankYouElement: r
  };
}
async function dn(t, e) {
  const i = [];
  if (e)
    for (const n of t)
      i.push(e.use(n));
  return Promise.all(i);
}
function nt(t) {
  if (!t)
    return {};
  const e = {};
  for (let i = 0; i < t.length; i++) {
    const n = t[i];
    e[n.jsmap] = n.value;
  }
  return e;
}
function rt(t) {
  const e = {};
  if (!Array.isArray(t))
    return e;
  for (let i = 0; i < t.length; i++) {
    const n = t[i];
    if (!n || !h(n.value) || !h(n.map))
      continue;
    const r = n.value, s = n.map;
    e[r] || (e[r] = []), e[r].push({
      eventAttributeKey: s,
      conditions: Array.isArray(n.conditions) ? n.conditions : []
    });
  }
  return e;
}
function st(t, e, i) {
  return g().generateHash([t, e, i].join(""));
}
function fn(t) {
  let n = "mParticle_wsdkv_" + g().getVersion() + "_kitv_" + "3.16.1";
  return t && (n += "_" + t), n;
}
function ot(t) {
  return !!(t && sn.includes(t));
}
function Ae(t) {
  const e = document.createElement("iframe");
  e.style.display = "none", e.setAttribute("sandbox", "allow-scripts allow-same-origin"), e.src = t, e.onload = function() {
    e.onload = null, e.parentNode && e.parentNode.removeChild(e);
  };
  const i = document.body || document.head;
  i && i.appendChild(e);
}
function at(t, e) {
  const i = Se(window.location.origin);
  if (G._allowedOriginHashes.indexOf(i) === -1 || Math.random() >= Bi)
    return;
  const r = window.__rokt_li_guid__;
  if (!r || t && t.includes("://") && !/^https:\/\//i.test(t))
    return;
  const s = Pe(window.location.href), a = "version=" + encodeURIComponent(e ?? "") + "&launcherInstanceGuid=" + encodeURIComponent(r) + "&pageUrl=" + encodeURIComponent(s), o = t ? he(t) : "https://apps.rokt.com";
  Ae(o + "/v1/wsdk-init/index.html?" + a), Ae(
    "https://" + zi + "/v1/wsdk-init/index.html?" + a + "&isControl=true"
  );
}
function gn() {
  return typeof window < "u" && !!window.location?.search?.toLowerCase().includes("mp_enable_logging=true");
}
function hn() {
  if (typeof window > "u")
    return;
  const t = window.location?.href;
  return t ? Pe(t) : void 0;
}
function pn() {
  return typeof window < "u" ? window.navigator?.userAgent : void 0;
}
class Ft {
  constructor() {
    this._logCount = {};
  }
  incrementAndCheck(e) {
    const n = (this._logCount[e] || 0) + 1;
    return this._logCount[e] = n, n > un;
  }
}
class le {
  constructor(e, i, n, r, s) {
    this._reporter = "mp-wsdk";
    const a = e.isLoggingEnabled;
    this._integrationName = i || "", this._launcherInstanceGuid = n, this._accountId = r || null, this._rateLimiter = s || new Ft(), this._isEnabled = gn() || a;
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
          code: r || xe.UNKNOWN_ERROR,
          url: hn(),
          deviceInfo: pn(),
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
class ct {
  constructor(e, i, n, r, s) {
    this._transport = new le(e, i, n, r, s), this._errorUrl = xt(e?.errorUrl, e?.integrationDomain, ln);
  }
  report(e) {
    if (!e) return;
    const i = e.severity || q.ERROR;
    this._transport.send(this._errorUrl, i, e.message, e.code, e.stackTrace);
  }
}
class lt {
  constructor(e, i, n, r, s, a) {
    this._intentObserveLines = 0, this._transport = new le(e, n, r, s, a), this._placementDiagnosticTransport = new le(
      e,
      n,
      r,
      s
    ), this._loggingUrl = xt(e?.loggingUrl, e?.integrationDomain, cn), this._errorReportingService = i;
  }
  log(e) {
    e && this._send(this._transport, e);
  }
  logPlacementDiagnostic(e) {
    if (e) {
      if (e.code === "PRESELECT_SKIPPED" && e.message.includes("[reason=intent_observed]")) {
        if (this._intentObserveLines >= 2) return;
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
            code: xe.LOG_DELIVERY_FAILURE,
            severity: r ? q.ERROR : q.WARNING
          });
        }
      }
    );
  }
}
function mn(t) {
  const e = ft(window.location.href), i = t.EventAttributes?.title || document.title, n = Jt(), r = t.ActiveTimeOnSite;
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
    this.name = v, this.id = ne, this.moduleId = ne, this.isInitialized = !1, this.launcher = null, this.filters = {}, this.userAttributes = {}, this.userIdentifiedInWorkspace = !1, this.testHelpers = null, this.placementEventMappingLookup = {}, this.placementEventAttributeMappingLookup = {}, this.integrationName = null, this.errorReportingService = null, this.loggingService = null, this._thankYouElementOnLoadCallback = null, this._isThankYouElementLoaded = !1, this._workspaceSearchInFlightPromise = null, this._launcherAttachState = Mi(), this._exitIntentConfig = null, this._exitIntentDispatchedForPageView = !1, this._exitIntentEnabledForAccount = !1, this._pendingInitWarnings = [], this.accountId = null, this._preselectState = Di();
  }
  // ---- Private helpers ----
  getEventAttributeValue(e, i) {
    const n = e && e.EventAttributes;
    if (!n)
      return null;
    const r = $(n, i);
    return r === void 0 ? null : r;
  }
  doesEventAttributeConditionMatch(e, i) {
    if (!e || !h(e.operator))
      return !1;
    const n = e.operator.toLowerCase(), r = e.attributeValue;
    return n === "exists" ? i !== null : i == null ? !1 : n === "equals" ? String(i) === String(r) : n === "contains" ? String(i).indexOf(String(r)) !== -1 : !1;
  }
  doesEventMatchRule(e, i) {
    if (!i || !h(i.eventAttributeKey))
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
      a && g().Rokt.setLocalSessionAttribute?.(r, !0);
    }
  }
  capturePageView(e) {
    let i;
    try {
      i = Pe(window.location.href);
      const n = je(), r = mn(e);
      n.push(r);
      const s = Math.min(n.length, pt), a = zt(n);
      if (a === 0) {
        const o = Ee() ? "quota" : "ls_unavailable";
        this.loggingService?.log({
          message: `Rokt Kit: Failed to persist page view for ${i} [reason: ${o}]`,
          code: "PAGE_VIEW_CAPTURE_FAILED"
        });
      } else a < s && this.loggingService?.log({
        message: `Rokt Kit: Page view storage reduced from ${s} to ${a} record(s) under quota pressure [reason: quota_eviction]`,
        code: "PAGE_VIEW_QUOTA_EVICTION"
      });
    } catch (n) {
      const r = Ee() ? "exception" : "ls_unavailable", s = n instanceof Error ? n.message : String(n);
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
      getCurrentUser: () => g().Identity?.getCurrentUser?.(),
      getCurrentHost: () => this.buildPreselectHost(),
      isTargetingDisabled: () => this.isTargetingDisabled(),
      getUserIdentities: () => this.returnUserIdentities(this.filters.filteredUser),
      mappedEmailSha256Key: this._mappedEmailSha256Key
    };
  }
  flushPendingPreselectDispatches() {
    xi(this._preselectState, this.buildPreselectHost());
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
    return !g().Rokt || typeof g().Rokt.getLocalSessionAttributes != "function" ? {} : g().Rokt.getLocalSessionAttributes();
  }
  replaceOtherIdentityWithEmailsha256(e) {
    const i = { ...e || {} }, n = this._mappedEmailSha256Key;
    return n && e[n] && (i[D.EMAIL_SHA256_KEY] = e[n]), n && delete i[n], i;
  }
  logSelectPlacementsEvent(e) {
    if (!window.mParticle || typeof g().logEvent != "function" || !E(e))
      return;
    const i = g().EventType.Other;
    g().logEvent(Wi, i, e);
  }
  setRoktSessionId(e) {
    if (!(!e || typeof e != "string"))
      try {
        const i = g().getInstance();
        i && H(i.setIntegrationAttribute) && i.setIntegrationAttribute(ne, {
          roktSessionId: e
        });
      } catch {
      }
  }
  readMpSessionId() {
    const e = g()?.sessionManager, i = e?.getSessionId ?? e?.getSession;
    if (H(i))
      return i.call(e) || void 0;
  }
  readMpDeviceId() {
    return g()?.getDeviceId?.() || void 0;
  }
  attachLauncher(e, i, n = []) {
    Vi(this._launcherAttachState, {
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
      await dn([...n], a), this.initRoktLauncher(a);
    }).catch((a) => {
      const o = this._launcherAttachState.lifecycle === "attached";
      if ($i(this._launcherAttachState), !o) {
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
    return Gi(
      this._launcherAttachState,
      this.isLauncherReadyToAttach(),
      (e) => this.attachLauncher(e.accountId, e.launcherOptions, e.legacyRoktExtensions)
    );
  }
  initRoktLauncher(e) {
    window.Rokt && (window.Rokt.currentLauncher = e), this.launcher = e, Hi(this._launcherAttachState);
    const i = g().Rokt?.filters;
    i ? (!this.isInitialized && this.filters.filteredUser && (i.filteredUser = this.filters.filteredUser), this.filters = i, i.filteredUser ? this._workspaceSearchInFlightPromise = this.search(i.filteredUser) : console.warn("Rokt Kit: No filtered user has been set.")) : console.warn("Rokt Kit: No filters have been set."), this.isInitialized = !0, Ii(e, this.accountId, (n) => {
      try {
        yi(this._preselectState, this.buildPreselectHost(), n);
      } catch {
        return;
      }
    }), at(this.domain, this.integrationName), g().Rokt.attachKit(this), this.pushExitIntentExtensionConfig(), this.flushPendingPreselectDispatches();
  }
  // Leaving the hook unset is what keeps History unpatched for workspaces that never
  // preselect.
  armPreselectPathnameTrigger() {
    me(window.location.pathname), this.onRouteChange = Ai(this.accountId) ? () => this.evaluatePreselectPathname() : void 0;
  }
  evaluatePreselectPathname() {
    const e = window.location.pathname;
    me(e), e !== this._lastPreselectPathname && (this.isTargetingDisabled() || (this._lastPreselectPathname = e, Pi(this._preselectState, this.buildPreselectHost(), e)));
  }
  fetchOptimizely() {
    const e = g()._getActiveForwarders().filter((i) => i.name === "Optimizely");
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
    return g().Rokt?.launcherOptions?.noTargeting === !0;
  }
  isIntentPrivacyAllowed() {
    return g().Rokt?.launcherOptions?.doNotShareOrSell !== !0 && navigator.globalPrivacyControl !== !0;
  }
  isPartnerInLocalLauncherTestGroup() {
    return !!(g().config && g().config.isLocalLauncherEnabled && this.isAssignedToSampleGroup());
  }
  isAssignedToSampleGroup() {
    return Math.random() > 0.5;
  }
  getEffectiveExitIntentConfig(e) {
    return ot(e) ? {
      identifier: on,
      signals: {
        mouseExitTop: !0,
        scrollUpFast: !0,
        idle: !0
      }
    } : null;
  }
  applyExitIntentExtensionOverride(e, i) {
    return e ? i.includes(_e) ? i : [...i, _e] : i;
  }
  extractExitIntentIdentifier(e) {
    return e ? h(e.identifier) && e.identifier.length > 0 ? e.identifier : h(e.placementIdentifier) && e.placementIdentifier.length > 0 ? e.placementIdentifier : null : null;
  }
  processLeadCaptureSubmittedEvent(e) {
    if (!(e instanceof CustomEvent) || !E(e.detail))
      return;
    const i = e.detail, n = E(i.body) ? i.body : {};
    let r = h(n.email) ? n.email : void 0, s = h(n.mobile_number) ? n.mobile_number : void 0;
    if (!r || !s) {
      const d = Array.isArray(i.fields) ? i.fields : [];
      for (let f = 0; f < d.length; f += 1) {
        const p = d[f];
        if (!h(p.fieldKey) || !h(p.value))
          continue;
        const _ = p.fieldKey.toLowerCase().replace(/[^a-z]/g, "");
        !r && (_ === "email" || _ === "emailaddress") && p.value.length > 0 && (r = p.value), !s && (_ === "mobile" || _ === "mobilenumber" || _ === "phone" || _ === "phonenumber") && (s = p.value);
      }
    }
    const a = {};
    h(r) && r.length > 0 && (a.email = r), h(s) && s.length > 0 && (a.mobile_number = s);
    const o = {};
    this.mergeLeadCaptureUserAttributes(o, E(n.userAttributes) ? n.userAttributes : null), this.mergeLeadCaptureUserAttributes(
      o,
      E(i.userAttributes) ? i.userAttributes : null
    );
    const c = h(n.rclid) ? n.rclid : h(i.rclid) ? i.rclid : void 0;
    c && c.length > 0 && (o.rokt_rclid = c);
    const l = h(n.accountID) ? n.accountID : h(i.accountID) ? i.accountID : void 0;
    l && l.length > 0 && (o.rokt_account_id = l);
    const u = h(n.referralCreativeID) ? n.referralCreativeID : h(i.referralCreativeID) ? i.referralCreativeID : void 0;
    u && u.length > 0 && (o.rokt_referral_creative_id = u), this.applyIdentityCapturePayload(a, o);
  }
  isSafeLeadCaptureUserAttributeKey(e) {
    return e === "__proto__" || e === "constructor" || e === "prototype" ? !1 : /^[a-zA-Z0-9_.-]+$/.test(e);
  }
  isSupportedLeadCaptureUserAttributeValue(e) {
    return h(e) || typeof e == "number" || typeof e == "boolean" ? !0 : Array.isArray(e) ? e.every((i) => h(i)) : !1;
  }
  mergeLeadCaptureUserAttributes(e, i) {
    if (i)
      for (const [n, r] of Object.entries(i))
        this.isSafeLeadCaptureUserAttributeKey(n) && this.isSupportedLeadCaptureUserAttributeValue(r) && (e[n] = r);
  }
  applyIdentityCapturePayload(e, i) {
    const n = {}, r = e.email;
    h(r) && r.length > 0 && (n.email = r);
    const s = e.mobile_number;
    h(s) && s.length > 0 && (n.mobile_number = s);
    const a = g().Identity?.modify;
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
    const o = g().Identity?.getCurrentUser?.();
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
    if (this._exitIntentConfig = this.isTargetingDisabled() ? null : e, this._exitIntentDispatchedForPageView = !1, this._exitIntentListener && (window.removeEventListener(qe, this._exitIntentListener), this._exitIntentListener = void 0), this._exitIntentLeadCaptureSubmittedListener && (window.removeEventListener(
      Je,
      this._exitIntentLeadCaptureSubmittedListener
    ), this._exitIntentLeadCaptureSubmittedListener = void 0), this._isIdentityCaptureBridgeEnabled(this._exitIntentConfig) && (this._exitIntentLeadCaptureSubmittedListener = (n) => {
      this.processLeadCaptureSubmittedEvent(n);
    }, window.addEventListener(
      Je,
      this._exitIntentLeadCaptureSubmittedListener
    )), !this._isExitIntentBridgeEnabled(this._exitIntentConfig))
      return;
    const i = this.extractExitIntentIdentifier(this._exitIntentConfig);
    i && (this._exitIntentListener = (n) => {
      const r = n instanceof CustomEvent && n.detail && h(n.detail.reason) ? n.detail.reason : "unknown";
      if (this._exitIntentDispatchedForPageView || !this.isKitReady() || !(r === "mouse-exit-top" || r === "scroll-up-fast" || r === "idle" || r === "leave-link"))
        return;
      this._exitIntentDispatchedForPageView = !0;
      const a = E(this._exitIntentConfig?.attributes) ? this._exitIntentConfig.attributes : {};
      try {
        const o = g().Rokt?.selectPlacements?.({
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
    }, window.addEventListener(qe, this._exitIntentListener));
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
      [_e]: this._exitIntentConfig
    });
  }
  captureTiming(e) {
    window && g() && g().captureTiming && e && g().captureTiming(e);
  }
  // ---- Public methods (mParticle Kit Callbacks) ----
  /**
   * Initializes the Rokt forwarder with settings from the mParticle server.
   */
  init(e, i, n, r, s) {
    const a = g().Rokt?.launcherOptions?.noFunctional === !0;
    Yt(a), a || this.isTargetingDisabled() ? Gt() : (oi(), ui()), this.isTargetingDisabled() && ($e(), Ye());
    const o = e, c = o.accountId;
    this._exitIntentEnabledForAccount = ot(c);
    const l = this._exitIntentEnabledForAccount ? this.getEffectiveExitIntentConfig(c) : null;
    this._exitIntentEnabledForAccount ? this.configureExitIntentBridge(l) : this.configureExitIntentBridge(null), this.accountId = c || null;
    const u = this.accountId ? _i(this.accountId, o.preselectionConfig) : void 0;
    this.userAttributes = j(s), this.armPreselectPathnameTrigger(), this._onboardingExpProvider = o.onboardingExpProvider;
    const d = re(o.placementEventMapping);
    this.placementEventMappingLookup = nt(d);
    const f = re(
      o.placementEventAttributeMapping
    );
    this.placementEventAttributeMappingLookup = rt(f), o.hashedEmailUserIdentityType && (this._mappedEmailSha256Key = o.hashedEmailUserIdentityType.toLowerCase()), this._workspaceIdSyncApiKey = h(o.workspaceIdSyncApiKey) ? o.workspaceIdSyncApiKey : void 0;
    const p = g().Rokt?.domain, { roktExtensionsQueryParams: _, legacyRoktExtensions: A, loadThankYouElement: w } = it(
      o.roktExtensions
    ), U = this.applyExitIntentExtensionOverride(
      l,
      _
    ), k = {
      ...g().Rokt?.launcherOptions || {}
    };
    this.integrationName = fn(k.integrationName), k.integrationName = this.integrationName, this.domain = p;
    const b = {
      loggingUrl: o.loggingUrl,
      errorUrl: o.errorUrl,
      integrationDomain: p,
      isLoggingEnabled: g().config?.isLoggingEnabled === !0
    }, P = new ct(
      b,
      this.integrationName,
      window.__rokt_li_guid__,
      o.accountId
    ), L = new lt(
      b,
      P,
      this.integrationName,
      window.__rokt_li_guid__,
      o.accountId
    );
    return this.errorReportingService = P, this.loggingService = L, this._flushInitWarnings(), u && L.log({
      message: `Rokt Kit: preselectionConfig setting is invalid [reason=${u}], using the built-in preselection config`,
      code: "PRESELECT_CONFIG_INVALID"
    }), g()._registerErrorReportingService && g()._registerErrorReportingService(P), g()._registerLoggingService && g()._registerLoggingService(L), n ? (this.testHelpers = {
      generateLauncherScript: Ze,
      generateThankYouElementScript: et,
      extractRoktExtensionConfig: it,
      hashEventMessage: st,
      parseSettingsString: re,
      generateMappedEventLookup: nt,
      generateMappedEventAttributeLookup: rt,
      sendAdBlockMeasurementSignals: at,
      createAutoRemovedIframe: Ae,
      djb2: Se,
      setAllowedOriginHashes: (K) => {
        D._allowedOriginHashes = K;
      },
      ReportingTransport: le,
      ErrorReportingService: ct,
      LoggingService: lt,
      RateLimiter: Ft,
      ErrorCodes: xe,
      WSDKErrorSeverity: q,
      resetLauncherAttachState: () => Yi(this._launcherAttachState)
    }, this.attachLauncher(c, k), "Successfully initialized: " + v) : (w && (g().Rokt.flushOnShoppableAdsReadyMessageQueue?.(this), tt(Ji, et(p), {
      onLoad: () => {
        this._isThankYouElementLoaded = !0, this._thankYouElementOnLoadCallback && this._thankYouElementOnLoadCallback();
      },
      onError: (K) => {
        console.error("Error loading Rokt Thank You Element script:", K);
      }
    })), this.isLauncherReadyToAttach() ? this.attachLauncher(c, k, A) : (tt(qi, Ze(p, U), {
      onLoad: () => {
        this.isLauncherReadyToAttach() ? this.attachLauncher(c, k, A) : console.error("Rokt object is not available after script load.");
      },
      onError: (K) => {
        console.error("Error loading Rokt launcher script:", K);
      }
    }), this.captureTiming(D.PERFORMANCE_MARKS.RoktScriptAppended)), "Successfully initialized: " + v);
  }
  process(e) {
    if (e.EventDataType === Xe && me(window.location.pathname), this.isTargetingDisabled() || (e.EventDataType === Xe && (this._exitIntentEnabledForAccount && (this._exitIntentDispatchedForPageView = !1), Xt(this.loggingService), this.capturePageView(e), te(this._preselectState, this.buildPreselectHost(), e)), Si(this.accountId, e.EventName) && ki(this._preselectState, this.buildPreselectHost(), e)), e.EventDataType === Zi && ($e(), Ye(), Oe(this._preselectState), this.accountId && (x(this.accountId), Ge(this.accountId), We(this.accountId))), !this.isKitReady())
      return "Kit not ready for forwarder: " + v;
    if (H(g().Rokt?.setLocalSessionAttribute) && (N(this.placementEventAttributeMappingLookup) || this.applyPlacementEventAttributeMapping(e), !N(this.placementEventMappingLookup))) {
      const i = st(e.EventDataType, e.EventCategory, e.EventName ?? "");
      this.placementEventMappingLookup[String(i)] && g().Rokt.setLocalSessionAttribute?.(this.placementEventMappingLookup[String(i)], !0);
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
    return ut(e) || (this.userAttributes[e] = i), Li(this.accountId, e) && this.flushPendingPreselectDispatches(), "Successfully set user attribute for forwarder: " + v;
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
    const n = g().Identity?.search;
    if (typeof n != "function")
      return this.userIdentifiedInWorkspace = !1, this._workspaceLastSearchedIdentitiesKey = void 0, Promise.resolve();
    const r = e.getUserIdentities ? e.getUserIdentities().userIdentities : null, s = {};
    if (r)
      for (const c of Object.keys(r)) {
        const l = r[c];
        h(l) && l.length > 0 && (s[c] = l);
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
    return this.userIdentifiedInWorkspace = !1, this._workspaceSearchInFlightPromise = null, this._workspaceLastSearchedIdentitiesKey = void 0, this.accountId && (x(this.accountId), Ge(this.accountId), We(this.accountId)), this.handleIdentityComplete(e, "onLogoutComplete");
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
        new Promise((s) => setTimeout(s, Qe))
      ]) : Promise.resolve();
      return Promise.all([i, r]).then(
        () => this._dispatchPlacements(e)
      );
    }
    if (this._workspaceSearchInFlightPromise) {
      const n = this._workspaceSearchInFlightPromise;
      return Promise.race([
        n,
        new Promise((r) => setTimeout(r, Qe))
      ]).then(() => this._dispatchPlacements(e));
    }
    return this._dispatchPlacements(e);
  }
  _dispatchPlacements(e) {
    const i = e && e.attributes || {}, r = { ...j(this.userAttributes), ...i }, s = this.filters || {}, a = s.userAttributeFilters || [], o = s.filteredUser || null, c = o ? o.getMPID() : null;
    let l;
    s ? s.filterUserAttributes ? l = s.filterUserAttributes(r, a) : l = r : (console.warn("Rokt Kit: No filters available, using user attributes"), l = r), this.userAttributes = j(l);
    const u = this._onboardingExpProvider === "Optimizely" ? this.fetchOptimizely() : {}, d = this.returnUserIdentities(o), f = this.returnLocalSessionAttributes(), p = Bt(je()), _ = qt(), A = this.readMpSessionId(), w = this.readMpDeviceId(), U = typeof e.identifier == "string" ? e.identifier : void 0;
    e.preselect !== !0 && Fi(this.buildPreselectHost(), U);
    const k = e.preselect === !0 ? Rt(l, this.buildPreselectAttributeOverrides(U)) : l, b = {
      ...d,
      ...k,
      ...u,
      ...f,
      ...p.length ? { [en]: JSON.stringify(p) } : {},
      ..._ ? { [tn]: _ } : {},
      ...this.userIdentifiedInWorkspace ? { [Qi]: !0 } : {},
      ...A ? { [nn]: A } : {},
      ...w ? { [rn]: w } : {},
      mpid: c
    }, P = this.findCacheConfigEntry(U), L = P?.identityKeys, K = {
      ...e,
      attributes: b,
      ...P ? { cacheMatchKeys: vi(P) } : {},
      ...L ? { cacheIdentityKeys: L } : {}
    }, Fe = this.launcher.selectPlacements(K), Me = e.preselect === !0, Mt = () => {
      Me || this.logSelectPlacementsEvent(b);
    };
    return Promise.resolve(Fe).then((Vt) => {
      if (!Me)
        return Vt?.context?.sessionId?.then((Ht) => this.setRoktSessionId(Ht));
    }).catch(() => {
    }).finally(Mt), Fe;
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
    return this.isKitReady() ? !e || !h(e) ? Promise.reject(new Error("Rokt Kit: Invalid extension name")) : this.launcher.use(e) : (console.error("Rokt Kit: Not initialized"), Promise.reject(new Error("Rokt Kit: Not initialized")));
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
    return this.isKitReady() ? (ji(this._launcherAttachState), this.launcher.terminate()) : (console.error("Rokt Kit: Not initialized"), Promise.resolve());
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
let G = D;
function _n() {
  return ne;
}
function En(t) {
  if (!t) {
    window.console.log("You must pass a config object to register the kit " + v);
    return;
  }
  if (!E(t)) {
    window.console.log("'config' must be an object. You passed in a " + typeof t);
    return;
  }
  E(t.kits) ? t.kits[v] = {
    constructor: G
  } : (t.kits = {}, t.kits[v] = {
    constructor: G
  }), window.console.log("Successfully registered " + v + " to your mParticle configuration");
}
typeof window < "u" && window.mParticle && g().addForwarder && g().addForwarder({
  name: v,
  constructor: G,
  getId: _n
});
export {
  En as register
};
//# sourceMappingURL=Rokt-Kit.esm.js.map
