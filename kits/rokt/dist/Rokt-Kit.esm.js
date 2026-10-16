const gi = [
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
], pi = new Set(gi);
function Rt(t) {
  return pi.has(t.toLowerCase());
}
function W(t) {
  const e = {}, i = t || {}, n = Object.keys(i);
  for (let r = 0; r < n.length; r++) {
    const s = n[r];
    Rt(s) || (e[s] = i[s]);
  }
  return e;
}
function I(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function h(t) {
  return typeof t == "string";
}
function V(t) {
  return typeof t == "function";
}
function kt(t) {
  try {
    return JSON.parse(t.replace(/&quot;/g, '"'));
  } catch {
    return;
  }
}
function w(t) {
  return t == null ? !0 : typeof t == "string" ? t.length === 0 : typeof t == "object" ? Object.keys(t).length === 0 : !1;
}
function F(t, e) {
  return Object.prototype.hasOwnProperty.call(t, e) ? t[e] : void 0;
}
function Lt(t) {
  try {
    const e = new URL(t);
    return e.search = "", e.toString();
  } catch {
    return t.split("?")[0];
  }
}
function Fe(t) {
  try {
    const e = new URL(t);
    return e.search = "", e.hash = "", e.toString();
  } catch {
    return t.split(/[?#]/)[0];
  }
}
function Me(t) {
  let e = 5381;
  for (let i = 0; i < t.length; i++)
    e = (e << 5) + e + t.charCodeAt(i), e = e & e;
  return e;
}
const _ = "mp-rokt-kit", it = "__rokt_ls_probe__";
function nt() {
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
let Q = null;
function hi(t) {
  t ? Q || (Q = { local: nt(), session: nt() }) : Q = null;
}
const M = () => Q?.local ?? window.localStorage, k = () => Q?.session ?? window.sessionStorage;
function we() {
  try {
    const t = M();
    return t.setItem(it, "1"), t.removeItem(it), !0;
  } catch {
    return !1;
  }
}
function pe(t, e = M) {
  try {
    const i = e().getItem(t);
    return i === null ? null : JSON.parse(i);
  } catch {
    return null;
  }
}
function Dt(t, e, i = M) {
  try {
    return i().setItem(t, JSON.stringify(e)), !0;
  } catch {
    return !1;
  }
}
function Se(t, e = M) {
  try {
    e().removeItem(t);
  } catch {
  }
}
function mi() {
  Se(_, () => window.localStorage), Se(_, () => window.sessionStorage);
}
function Y(t, e, i = M) {
  const n = pe(t, i);
  return I(n) ? n[e] : void 0;
}
function X(t, e, i, n = M) {
  const r = pe(t, n), s = I(r) ? { ...r } : {};
  return s[e] = i, Dt(t, s, n);
}
function Ct(t, e, i) {
  Object.keys(e).length === 0 ? Se(t, i) : Dt(t, e, i);
}
function he(t, e, i = M) {
  const n = pe(t, i);
  if (!I(n) || !(e in n))
    return;
  const r = { ...n };
  delete r[e], Ct(t, r, i);
}
function ee(t, e, i = M) {
  const n = pe(t, i);
  if (!I(n))
    return;
  const r = Object.keys(n).filter((o) => o.startsWith(e));
  if (r.length === 0)
    return;
  const s = { ...n };
  r.forEach((o) => delete s[o]), Ct(t, s, i);
}
const xe = "pageViews", ce = "utmParams", Ot = 25, Ei = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
function Kt(t) {
  return t.slice(-Ot);
}
function rt() {
  const t = Y(_, xe);
  return Array.isArray(t) ? t : [];
}
function _i(t) {
  const e = Kt(t);
  for (let i = 0; i < e.length; i++) {
    const n = e.slice(i);
    if (X(_, xe, n))
      return n.length;
  }
  return 0;
}
function st() {
  he(_, xe);
}
function Ii(t) {
  const e = Kt(t);
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
function yi(t) {
  if (Y(_, ce) !== void 0)
    return;
  const e = new URLSearchParams(window.location.search), i = {};
  for (const r of Ei) {
    const s = e.get(r);
    s && (i[r] = s);
  }
  if (Object.keys(i).length === 0)
    return;
  const n = Object.keys(i).join(", ");
  if (!X(_, ce, i)) {
    const r = we() ? "quota" : "ls_unavailable";
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
function vi() {
  const t = Y(_, ce);
  return I(t) ? t : null;
}
function ot() {
  he(_, ce);
}
function bi() {
  const e = document.querySelector('link[rel="canonical"]')?.href;
  if (e)
    return Lt(e);
}
const Ai = [
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
    readEmailInput: !0,
    intentTrigger: "observe"
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
    dispatchDelayMs: 2e4,
    intentTrigger: "observe"
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
    dispatchDelayMs: 2e4,
    intentTrigger: "observe"
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
    dispatchDelayMs: 1e4,
    intentTrigger: "observe"
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
    dispatchDelayMs: 1e3,
    intentTrigger: "observe"
  }
], Pi = 1, Ti = 6e4;
function K(t) {
  return Array.isArray(t) && t.every(h);
}
function wi(t, e) {
  if (!I(e))
    return "not an object";
  const { pathname: i, targetPageIdentifier: n, attributeKeys: r, optionalAttributeKeys: s, identityKeys: o, dispatchDelayMs: a } = e, { triggerEventNames: c, releaseHoldOnRouteChange: l, intentTrigger: u, readEmailInput: d } = e, m = e.preselectAttributeOverrides, f = e.widenedOptionalAttributeKeys;
  if (e.accountId !== void 0 && e.accountId !== t)
    return "accountId";
  if (!h(i) || !i.startsWith("/"))
    return "pathname";
  if (!h(n) || n === "")
    return "targetPageIdentifier";
  if (!K(r) || r.length === 0)
    return "attributeKeys";
  if (s !== void 0 && (!K(s) || !s.every((E) => r.includes(E))))
    return "optionalAttributeKeys";
  if (f !== void 0 && (!K(f) || !f.every((E) => r.includes(E))))
    return "widenedOptionalAttributeKeys";
  if (o !== void 0 && (!K(o) || o.length === 0 || !o.every((E) => r.includes(E))))
    return "identityKeys";
  if (a !== void 0 && (!Number.isInteger(a) || a < 0 || a > Ti))
    return "dispatchDelayMs";
  if (u !== void 0 && u !== "observe" && u !== "fire")
    return "intentTrigger";
  if (l !== void 0 && typeof l != "boolean")
    return "releaseHoldOnRouteChange";
  if (d !== void 0 && (typeof d != "boolean" || !r.includes("email") || K(s) && s.includes("email") || // The runtime matches optional keys in any casing, so an 'Email' key would make email optional too.
  K(f) && f.some((E) => E.toLowerCase() === "email")))
    return "readEmailInput";
  if (m !== void 0 && (!I(m) || !Object.entries(m).every(
    ([E, P]) => h(P) && r.includes(E) && !(K(o) && o.includes(E))
  )))
    return "preselectAttributeOverrides";
  if (c !== void 0 && (!K(c) || c.length === 0 || c.some((E) => E === "")))
    return "triggerEventNames";
  const p = { accountId: t, pathname: i, targetPageIdentifier: n, attributeKeys: r };
  return s !== void 0 && (p.optionalAttributeKeys = s), f !== void 0 && (p.widenedOptionalAttributeKeys = f), o !== void 0 && (p.identityKeys = o), a !== void 0 && (p.dispatchDelayMs = a), l !== void 0 && (p.releaseHoldOnRouteChange = l), d !== void 0 && (p.readEmailInput = d), m !== void 0 && (p.preselectAttributeOverrides = m), c !== void 0 && (p.triggerEventNames = c), u !== void 0 && (p.intentTrigger = u), p;
}
function Si(t, e) {
  const i = kt(e);
  if (i === void 0)
    return { error: "invalid JSON" };
  if (!I(i))
    return { error: "not an object" };
  if (i.schemaVersion !== Pi)
    return { error: "schemaVersion" };
  if (!Array.isArray(i.entries))
    return { error: "entries" };
  const n = [];
  for (let r = 0; r < i.entries.length; r++) {
    const s = wi(t, i.entries[r]);
    if (h(s))
      return { error: `entry ${r + 1} ${s}` };
    if (n.some((o) => o.targetPageIdentifier === s.targetPageIdentifier))
      return { error: `entry ${r + 1} targetPageIdentifier` };
    n.push(s);
  }
  return { entries: n };
}
const Ri = 6e4, Ve = "activePreselect:";
function ki(t) {
  return I(t) && typeof t.expiresAt == "number" && typeof t.attributesDigest == "number";
}
function Nt(t, e) {
  return `${Ve}${t}:${e}`;
}
function se(t) {
  const e = Y(_, t, k);
  return ki(e) && e.expiresAt > Date.now() ? e : null;
}
function Li(t, e, i = !1) {
  X(
    _,
    t,
    { expiresAt: Date.now() + Ri, attributesDigest: e, ...i ? { byEvent: !0 } : {} },
    k
  );
}
function at(t) {
  ee(
    _,
    `${Ve}${t}:`,
    k
  );
}
function Di() {
  ee(_, Ve);
}
const Ci = 5 * 6e4, Ut = "pendingPreselect:";
function Oi(t) {
  return I(t) && typeof t.expiresAt == "number" && h(t.pathname) && h(t.identifier) && I(t.attributes) && h(t.mpid);
}
function He(t) {
  return `${Ut}${t}`;
}
function je(t) {
  const e = He(t), i = Y(_, e, k);
  return Oi(i) ? i.expiresAt <= Date.now() ? (he(_, e, k), null) : i : null;
}
function ct(t, e, i, n, r, s = !1) {
  return X(
    _,
    He(t),
    {
      expiresAt: Date.now() + Ci,
      pathname: e,
      identifier: i,
      attributes: n,
      mpid: r,
      ...s ? { byEvent: !0 } : {}
    },
    k
  );
}
function H(t) {
  he(_, He(t), k);
}
function Ki() {
  ee(_, Ut);
}
const Ft = "preselectArrival:", Mt = "preselectTriggerAnyTab:", Ni = 30 * 6e4, xt = 30 * 6e4, Re = ["commit", "wallet", "frame", "checkout_step"], Ui = ["triggeredAt", "identitySeenAt", "firedAt", "arrivedAt"];
function me(t, e) {
  return `${Ft}${t}:${e}`;
}
function Vt(t, e) {
  return `${Mt}${t}:${e}`;
}
function Ht(t) {
  const e = Y(_, t, k), i = {};
  if (!I(e))
    return i;
  for (const n of Ui)
    typeof e[n] == "number" && (i[n] = e[n]);
  return typeof e.intentAt == "number" && Re.includes(e.intentKind) && (i.intentAt = e.intentAt, i.intentKind = e.intentKind), i;
}
function Ee(t, e) {
  return X(_, t, e, k);
}
function Ye(t) {
  const e = Ht(t);
  return e.arrivedAt === void 0 ? e : {};
}
function Fi(t, e, i) {
  const n = me(t, e), r = Ye(n), s = Date.now();
  Ee(n, {
    ...r,
    triggeredAt: r.triggeredAt ?? s,
    ...i ? { identitySeenAt: r.identitySeenAt ?? s } : {}
  }), X(_, Vt(t, e), {
    triggeredAt: s
  });
}
function Mi(t, e) {
  const i = Y(_, Vt(t, e));
  if (!I(i) || typeof i.triggeredAt != "number")
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < Ni;
}
function xi(t, e) {
  const i = me(t, e), n = Ye(i);
  Ee(i, { ...n, firedAt: n.firedAt ?? Date.now() });
}
function Vi(t, e, i, n) {
  const r = me(t, e), s = Ye(r);
  if (s.intentAt !== void 0 && s.intentKind !== void 0 && Hi(s.intentAt)) {
    const o = Re.indexOf(s.intentKind), a = Re.indexOf(i);
    if (o < a || o === a && s.intentAt >= n)
      return;
  }
  Ee(r, { ...s, intentAt: n, intentKind: i });
}
function Hi(t) {
  const e = Date.now() - t;
  return e >= 0 && e < xt;
}
function ji(t, e) {
  const i = me(t, e), n = Ht(i);
  if (n.arrivedAt === void 0 && Ee(i, { ...n, arrivedAt: Date.now() }))
    return n;
}
function lt(t) {
  ee(
    _,
    `${Ft}${t}:`,
    k
  ), ee(_, `${Mt}${t}:`);
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
const ke = /* @__PURE__ */ new Map();
function Yi(t, e) {
  if (ke.delete(t), !e)
    return;
  const i = Si(t, e);
  if ("error" in i)
    return i.error;
  ke.set(t, i.entries);
}
function x(t) {
  return ke.get(t) ?? Ai.filter((e) => e.accountId === t);
}
function jt(t, e) {
  const i = v(t), n = v(e);
  if (!i.includes("*"))
    return i === n;
  const r = i.split("/"), s = n.split("/");
  return r.length !== s.length ? !1 : r.every(
    (o, a) => o === "*" ? s[a] !== "" : o === s[a]
  );
}
function v(t) {
  return t.length > 1 && t.endsWith("/") ? t.slice(0, -1) : t;
}
const Yt = {}, $t = {}, Wt = {}, $i = ["commit", "wallet", "checkout_step", "frame"], J = /* @__PURE__ */ new Set(), Le = /* @__PURE__ */ new Set(), U = [];
function te(t) {
  if (t === $t) return "intent_commit";
  if (t === Wt) return "intent_wallet";
}
function ne(t) {
  return te(t) !== void 0;
}
function Pe(t, e = Date.now()) {
  t = v(t), U[U.length - 1]?.pathname !== t && (U.push({ pathname: t, since: e }), U.length > 8 && U.shift(), Le.clear());
}
function Gt(t) {
  return !!t && x(t).some((e) => e.intentTrigger);
}
function zt(t, e) {
  return !e || e.intentTrigger === "observe" ? !1 : e.intentTrigger === "fire" || t.isCheckoutIntentActive?.() === !0;
}
function Wi(t, e, i) {
  if (!i || !$i.includes(i.kind) || typeof i.t != "number" || !Number.isFinite(i.t))
    return;
  const n = `${i.kind}:${i.t}`;
  if (J.has(n) || (J.add(n), J.size > 4096 && J.delete(J.values().next().value), e.isTargetingDisabled?.() || e.isIntentPrivacyAllowed?.() === !1 || !e.isKitReady() || !e.isPreselectionEnabled() || !(Gt(e.accountId) || e.isCheckoutIntentActive?.() === !0 && De(e.accountId))))
    return;
  Gi(e.accountId, i);
  const r = [...U].reverse().find((p) => p.since <= i.t);
  if (!r) return;
  const s = O(e.accountId, r.pathname), o = zt(e, s), a = !!s?.intentTrigger || o;
  if (!a) return;
  const c = window.location.pathname, l = v(r.pathname) === v(c), u = i.kind === "commit" || i.kind === "wallet";
  if (!o || !u || !l) {
    const p = `${r.since}:${i.kind}`;
    Le.has(p) || (Le.add(p), e.logPlacementDiagnostic(
      y("skipped", "intent_observed", {
        intent_kind: i.kind,
        has_identity: C(e.filteredUser),
        hold_running: !!t.scheduledDispatch,
        on_trigger_path: a
      })
    ));
    return;
  }
  const d = i.kind === "commit" ? "intent_commit" : "intent_wallet", m = t.scheduledDispatch;
  if (m && v(m.pathname) === v(c)) {
    $e(t), ri(t, e, m, "intent_released", d);
    return;
  }
  const f = t.pending.find(
    (p) => v(p.pathname) === v(c)
  );
  if (f) {
    f.intentSeen = d, f.waitingFor === "intent" && (t.pending = t.pending.filter((p) => p !== f), B(
      t,
      e,
      f.event,
      c,
      f.triggeringUserId,
      f.triggeredAt,
      d
    ));
    return;
  }
  B(
    t,
    e,
    i.kind === "commit" ? $t : Wt,
    c,
    void 0,
    i.t
  );
}
function Gi(t, e) {
  new Set(
    x(t).filter((n) => n.intentTrigger).map((n) => n.targetPageIdentifier)
  ).forEach((n) => Vi(t, n, e.kind, e.t));
}
function z(t) {
  return t === Yt;
}
const _e = 4, zi = "Auto Button Click", Bi = "is_auto_button_click";
function Bt(t) {
  return t.EventDataType === _e && t.EventName === zi || String(t.EventAttributes?.[Bi]) === "true";
}
function G(t, e) {
  return e.EventDataType === _e && h(e.EventName) && !Bt(e) && (t.triggerEventNames ?? []).includes(e.EventName);
}
const qi = "rokt.preselecttrigger", le = "preselectFormEmail";
function qt(t, e) {
  return `${t}|${e.pathname}`;
}
function O(t, e) {
  if (t)
    return x(t).find((i) => jt(i.pathname, e));
}
function ue(t, e) {
  if (!(!t || !h(e)))
    return x(t).find((i) => i.targetPageIdentifier === e);
}
function Xt(t, e) {
  if (!e)
    return t;
  const i = new Set(Object.keys(e).map((r) => r.toLowerCase())), n = {};
  for (const [r, s] of Object.entries(t))
    i.has(r.toLowerCase()) || (n[r] = s);
  return { ...n, ...e };
}
function Xi(t) {
  const e = Object.keys(t.preselectAttributeOverrides ?? {});
  return [...t.attributeKeys, ...e.filter((i) => !t.attributeKeys.includes(i))];
}
function De(t) {
  return t ? x(t).length > 0 : !1;
}
function Ji(t, e, i = window.location.pathname) {
  if (t.pending.some((r) => r.pathname === i && !z(r.event)))
    return;
  const n = t.scheduledDispatch;
  n && n.pathname === i && !z(n.event) || B(t, e, Yt, i);
}
function Qi(t, e) {
  return !t || !h(e) ? !1 : x(t).some((i) => (i.triggerEventNames ?? []).includes(e));
}
function de(t) {
  return !z(t) && !ne(t) && t.EventDataType !== _e;
}
function Zi(t, e) {
  const i = t.scheduledDispatch;
  return i && i.pathname === e && de(i.event) ? !0 : t.pending.some((n) => n.pathname === e && de(n.event));
}
function en(t, e, i, n) {
  if (!t.isKitReady() || !t.isPreselectionEnabled() || !ze(t, i))
    return "waits";
  const { collected: r, missingKeys: s } = ye(t, e, i);
  if (s.length > 0)
    return "waits";
  const o = t.accountId || "", a = se(Nt(o, v(n)));
  if (!a)
    return "now";
  const c = ii(o, i.targetPageIdentifier, r);
  return a.byEvent || c !== void 0 && c === a.attributesDigest ? "skipped" : "now";
}
function tn(t, e, i) {
  t.pending = t.pending.filter((r) => r.pathname !== i);
  const n = e.accountId ? je(e.accountId) : null;
  e.accountId && n && n.pathname === i && H(e.accountId);
}
function nn(t, e, i, n = window.location.pathname) {
  const r = O(e.accountId, n);
  if (!r || !G(r, i))
    return;
  const s = en(e, i, r, n);
  if (s === "now")
    tn(t, e, n);
  else if (Zi(t, n) || s === "skipped" && t.scheduledDispatch?.pathname === n)
    return;
  B(t, e, i, n);
}
function rn(t, e) {
  return t ? x(t).some((i) => i.attributeKeys.includes(e)) : !1;
}
function sn() {
  return { pending: [] };
}
function $e(t) {
  if (t.dispatchTimer === void 0)
    return;
  const e = t.scheduledDispatch;
  return clearTimeout(t.dispatchTimer), t.dispatchTimer = void 0, t.scheduledDispatch = void 0, e;
}
function on(t, e) {
  return t === void 0 ? e : e === void 0 ? t : Math.min(t, e);
}
function ut(t) {
  return z(t) ? 0 : ne(t) || t.EventDataType === _e ? 2 : 1;
}
function an(t, e) {
  const i = O(t.accountId, e.pathname);
  return !!i && ye(t, e.event, i).missingKeys.length > 0;
}
function Jt(t, e, i, n) {
  const r = t.pending.find((s) => s.pathname === n);
  return !!r && ut(i) < ut(r.event) && !(de(i) && an(e, r));
}
function j(t, e, i) {
  const n = t.pending.findIndex((r) => r.pathname === i.pathname);
  if (n >= 0) {
    if (Jt(t, e, i.event, i.pathname))
      return;
    const r = t.pending[n];
    t.pending[n] = {
      ...i,
      triggeredAt: on(r.triggeredAt, i.triggeredAt),
      intentSeen: i.intentSeen ?? r.intentSeen ?? te(r.event)
    };
    return;
  }
  t.pending.push(i);
}
function ie(t) {
  if (!t?.getUserIdentities)
    return [];
  const e = t.getUserIdentities().userIdentities;
  return e ? Object.keys(e).filter((i) => {
    const n = e[i];
    return h(n) && n.length > 0;
  }).sort() : [];
}
function C(t) {
  return ie(t).length > 0;
}
const Qt = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, Ce = /* @__PURE__ */ new WeakSet(), dt = /* @__PURE__ */ new WeakSet();
function We(t) {
  if (!(t instanceof HTMLInputElement)) return !1;
  const e = t.type;
  return e === "text" || e === "email" || t.getAttribute("autocomplete") === "email" && e !== "hidden" && e !== "password";
}
function Oe(t) {
  const e = t.target;
  if (!(e instanceof HTMLInputElement)) return;
  const i = !dt.has(t);
  if (dt.add(t), t.isTrusted === !0 && We(e)) {
    if (!i) return;
    Ce.add(e), e.addEventListener("input", Oe, !0), e.addEventListener("change", Oe, !0);
  } else
    Ce.delete(e);
}
function cn(t) {
  return We(t) && (t.type === "email" || t.getAttribute("autocomplete") === "email" || Qt.test(t.value.trim()));
}
function Ie(t) {
  return t.attributeKeys.find((e) => e.toLowerCase() === "email");
}
function ln() {
  const t = /* @__PURE__ */ new Map();
  return document.querySelectorAll("input").forEach((e) => {
    if (!Ce.has(e) || !We(e)) return;
    const i = e.value.trim();
    Qt.test(i) && !t.has(i.toLowerCase()) && t.set(i.toLowerCase(), i);
  }), t.size === 1 ? t.values().next().value : void 0;
}
function Ge(t, e, i = {}) {
  const n = new Set(
    [e, "emailsha256", t.mappedEmailSha256Key].filter(h).map((o) => o.toLowerCase())
  ), r = t.getCurrentUser?.();
  return [
    i,
    t.userAttributes,
    t.filteredUser?.getAllUserAttributes?.() ?? {},
    t.getUserIdentities?.() ?? {},
    r?.getAllUserAttributes?.() ?? {},
    r?.getUserIdentities?.().userIdentities ?? {}
  ].some(
    (o) => Object.keys(o).some((a) => n.has(a.toLowerCase()) && !w(F(o, a)))
  );
}
function Zt(t, e, i, n = {}) {
  return e.readEmailInput === !0 && jt(e.pathname, window.location.pathname) && t.isForwardingAllowed?.() === !0 && t.isIntentPrivacyAllowed?.() !== !1 && t.isTargetingDisabled?.() !== !0 && t.isEmailIdentityFiltered?.() !== !0 && !Ge(t, i, n);
}
function un(t, e, i) {
  const n = window.location.pathname, r = O(e.accountId, n), s = r && Ie(r);
  return !!s && t.pending.some(
    (o) => o.pathname === n && Zt(e, r, s, o.event.EventAttributes ?? {})
  ) && i.isTrusted === !0 && cn(i.target);
}
function ei(t, e, i, n) {
  const r = Ie(e);
  if (!r || !w(F(i, r)) || !Zt(t, e, r, n.EventAttributes ?? {}))
    return;
  const s = ln();
  if (s)
    return i[r] = s, r;
}
function ze(t, e) {
  const i = Ie(e);
  return C(t.filteredUser) || e.readEmailInput === !0 && !!i && Be(t, e, {}).includes(i);
}
function dn(t) {
  return !!t && x(t).some((e) => e.readEmailInput === !0);
}
function fe(t) {
  return t.length > 0 ? t.join(",") : "none";
}
function S(t) {
  const e = t?.getMPID?.();
  return e == null ? null : String(e);
}
function ti(t, e) {
  const i = ie(t.filteredUser), n = t.getCurrentUser?.(), r = ie(n), s = S(t.filteredUser), o = S(n), a = [...e.identityKeys ?? [], "email", "emailsha256"];
  t.mappedEmailSha256Key && a.push(t.mappedEmailSha256Key);
  const c = new Set(a.map((m) => m.toLowerCase())), l = n?.getAllUserAttributes?.() ?? {}, u = [t.userAttributes, l].some(
    (m) => Object.entries(m).some(
      ([f, p]) => c.has(f.toLowerCase()) && h(p) && p.length > 0
    )
  );
  let d = "no_identities";
  return t.filteredUser ? o !== null && s !== o ? d = "mpid_mismatch" : r.length > 0 && (d = "kit_user_lacks_identities") : d = "no_filtered_user", {
    identity_reason: d,
    kit_identity_types: fe(i),
    current_identity_types: fe(r),
    mpid_match: o === null ? "unknown" : s === o,
    identity_attribute_present: u
  };
}
function Be(t, e, i) {
  const n = t.getPreselectVariant?.() === "widened" ? e.widenedOptionalAttributeKeys ?? [] : [], r = new Set(
    [...e.optionalAttributeKeys ?? [], ...n].map((s) => s.toLowerCase())
  );
  return e.attributeKeys.filter(
    (s) => !r.has(s.toLowerCase()) && w(F(i, s))
  );
}
function ye(t, e, i) {
  const n = t.filteredUser?.getAllUserAttributes?.() || {}, r = new Set(i.identityKeys ?? []);
  let s;
  const o = {};
  for (const c of i.attributeKeys) {
    const l = t.getEventAttributeValue(e, c), u = F(t.userAttributes, c);
    let d = w(l) ? w(u) ? F(n, c) : u : l;
    if (w(d) && r.has(c)) {
      s || (s = t.getUserIdentities?.() ?? {});
      const m = F(s, c);
      d = h(m) && m !== "" ? m : void 0;
    }
    w(d) || (o[c] = d);
  }
  const a = ei(t, i, o, e);
  return {
    collected: o,
    missingKeys: Be(t, i, o),
    formEmailKey: a
  };
}
function fn(t, e) {
  const i = (r) => {
    const s = e[le] ? "redacted" : r instanceof Error ? r.message : String(r);
    t.log({
      message: `Rokt Kit: Preselect selectPlacements call failed: ${s}`,
      code: "PRESELECT_DISPATCH_FAILED"
    });
  };
  let n;
  try {
    n = t.selectPlacements(e);
  } catch (r) {
    i(r);
    return;
  }
  Promise.resolve(n).catch(i);
}
function ii(t, e, i) {
  try {
    return Me(
      JSON.stringify(
        Xt(
          i,
          ue(t, e)?.preselectAttributeOverrides
        )
      )
    );
  } catch {
    return;
  }
}
function ni(t, e, i, n, r, s, o, a = !1, c = !1, l = a, u) {
  if (t.isTargetingDisabled?.() || t.isForwardingAllowed?.() === !1 || c && t.isIntentPrivacyAllowed?.() === !1) return !1;
  const d = Nt(e, i);
  if (a && se(d)?.byEvent)
    return t.logPlacementDiagnostic(y("skipped", "active_preselection")), !1;
  const m = ii(e, n, r);
  if (m !== void 0) {
    if (se(d)?.attributesDigest === m)
      return t.logPlacementDiagnostic(y("skipped", "active_preselection")), !0;
    Li(
      d,
      m,
      l || c && se(d)?.byEvent === !0
    );
  }
  return t.logPlacementDiagnostic(
    y("fired", s, {
      identity_types: fe(ie(t.filteredUser)),
      ...u ? { email_source: "input" } : {}
    })
  ), xi(e, n), fn(t, {
    attributes: { ...r, [qi]: o },
    preselect: !0,
    identifier: n,
    omitUrl: !0,
    ...u ? { [le]: { key: u, mpid: S(t.filteredUser) } } : {}
  }), !0;
}
function gn(t, e) {
  if (!e.accountId || !e.isKitReady())
    return;
  const i = je(e.accountId);
  if (!i)
    return;
  if (t.pending.some((o) => o.pathname === i.pathname)) {
    H(e.accountId);
    return;
  }
  if (!e.isPreselectionEnabled()) {
    H(e.accountId);
    return;
  }
  if (!C(e.filteredUser) || (H(e.accountId), S(e.filteredUser) !== i.mpid))
    return;
  const n = O(e.accountId, i.pathname);
  if (!n || n.targetPageIdentifier !== i.identifier)
    return;
  if (!i.byEvent && ve(e, n)) {
    e.logPlacementDiagnostic(y("missed", "recovery_awaits_intent"));
    return;
  }
  const r = W(i.attributes), s = Be(e, n, r);
  if (s.length > 0) {
    for (const o of s)
      e.logPlacementDiagnostic(y("missed", `missing_persisted_attribute:${o}`));
    return;
  }
  ni(
    e,
    e.accountId,
    i.identifier,
    i.identifier,
    r,
    "recovered",
    qt("recovered", n)
  );
}
function qe(t) {
  return !t.isTargetingDisabled?.() && t.isKitReady() && t.isPreselectionEnabled();
}
function Xe(t) {
  return t === void 0 ? {} : { since_trigger_ms: Date.now() - t };
}
function Ke(t, e) {
  qe(t) && t.logPlacementDiagnostic(
    y("missed", "left_trigger_path", {
      waiting_for: e.waitingFor,
      has_identity: C(t.filteredUser),
      ...Xe(e.triggeredAt)
    })
  );
}
function B(t, e, i, n = window.location.pathname, r, s = Date.now(), o) {
  const a = t.pending.filter((u) => u.pathname !== n);
  if (a.length > 0) {
    const u = e.accountId ? je(e.accountId) : null;
    e.accountId && u && a.some((d) => d.pathname === u.pathname) && H(e.accountId), a.forEach((d) => Ke(e, d)), t.pending = t.pending.filter((d) => d.pathname === n);
  }
  const c = $e(t), l = c !== void 0 && c.pathname === n && z(c.event);
  if (c && !l) {
    const u = O(e.accountId, c.pathname);
    v(c.pathname) !== v(n) && u?.releaseHoldOnRouteChange ? (ri(t, e, c, "hold_released_on_route_change"), t.pending = t.pending.filter((d) => d.pathname === c.pathname ? (Ke(e, d), !1) : !0)) : ft(e, c, n);
  }
  pn(t, e, i, n, r, s, l, o), l && t.scheduledDispatch === void 0 && ft(e, c, n);
}
function ft(t, e, i) {
  t.logPlacementDiagnostic(
    y("missed", "hold_cancelled", {
      held_ms: Date.now() - e.heldAt,
      same_path: e.pathname === i
    })
  );
}
function pn(t, e, i, n, r, s, o, a) {
  const c = t.pending.find((u) => v(u.pathname) === v(n));
  if (a ?? (a = te(i) ?? c?.intentSeen ?? te(c?.event)), a && e.isIntentPrivacyAllowed?.() === !1 || e.isTargetingDisabled?.())
    return;
  const l = O(e.accountId, n);
  if (l && !(r !== void 0 && S(e.filteredUser) !== r)) {
    if (!a && !G(l, i) && ve(e, l)) {
      const u = c?.waitingFor === "intent" && c.awaitingIntentLogged === !0, d = e.isKitReady() && e.isPreselectionEnabled();
      j(t, e, {
        event: i,
        pathname: n,
        // Bound to an identified shopper, as a timer hold is, so another user's click never sends
        // this page view's attributes. A guest stays unbound so signing in at checkout still fires.
        triggeringUserId: r ?? (C(e.filteredUser) ? S(e.filteredUser) : void 0),
        triggeredAt: s,
        waitingFor: "intent",
        awaitingIntentLogged: u || d
      }), !u && d && e.logPlacementDiagnostic(y("held", "awaiting_intent")), d && Ne(e, l, i);
      return;
    }
    if (!e.isKitReady()) {
      if (Jt(t, e, i, n))
        return;
      const u = [], d = S(e.filteredUser);
      if (e.accountId && d && C(e.filteredUser)) {
        const { collected: m, missingKeys: f, formEmailKey: p } = ye(e, i, l);
        if (f.length === 0 && !p) {
          const E = W(m);
          (G(l, i) || !!a ? ct(
            e.accountId,
            n,
            l.targetPageIdentifier,
            E,
            d,
            !0
          ) : ct(e.accountId, n, l.targetPageIdentifier, E, d)) || u.push(y("queued", "persist_failed"));
        }
      }
      j(t, e, {
        event: i,
        pathname: n,
        storedDiagnostics: u,
        triggeringUserId: r,
        triggeredAt: s,
        waitingFor: "launcher",
        intentSeen: a
      });
      return;
    }
    if (e.isPreselectionEnabled()) {
      if (Ne(e, l, i), !ze(e, l)) {
        e.logPlacementDiagnostic(
          y("missed", "no_valid_identity", ti(e, l))
        ), j(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "identity" });
        return;
      }
      if (l.dispatchDelayMs !== void 0 && !G(l, i) && !ne(i) && !a) {
        const u = S(e.filteredUser), d = Math.min(
          l.dispatchDelayMs,
          Math.max(0, s + l.dispatchDelayMs - Date.now())
        );
        t.scheduledDispatch = { event: i, pathname: n, heldAt: Date.now(), heldForUserId: u, triggeredAt: s }, o || e.logPlacementDiagnostic(y("held", "dispatch_delay", { delay_ms: d })), t.dispatchTimer = setTimeout(() => {
          t.dispatchTimer = void 0, t.scheduledDispatch = void 0, si(t, e.getCurrentHost?.() ?? e, i, n, u, s);
        }, d);
        return;
      }
      oi(
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
function Ne(t, e, i) {
  if (!t.accountId) return;
  const n = Ie(e), r = e.readEmailInput === !0 && !!n && (Ge(t, n, i.EventAttributes ?? {}) || ei(t, e, {}, i) !== void 0);
  Fi(
    t.accountId,
    e.targetPageIdentifier,
    C(t.filteredUser) || r
  );
}
function ve(t, e) {
  return e.intentTrigger !== "observe" && t.isCheckoutIntentActive?.() === !0 && t.isIntentPrivacyAllowed?.() !== !1;
}
function ri(t, e, i, n, r) {
  si(
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
function si(t, e, i, n, r, s, o, a) {
  if (a && e.isIntentPrivacyAllowed?.() === !1) return;
  const c = O(e.accountId, n);
  if (!(!c || e.isTargetingDisabled?.())) {
    if (!a && !G(c, i) && !ne(i) && ve(e, c)) {
      const l = e.isKitReady() && e.isPreselectionEnabled();
      j(t, e, {
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
      j(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "launcher" });
      return;
    }
    if (e.isPreselectionEnabled()) {
      if (!ze(e, c)) {
        e.logPlacementDiagnostic(
          y("missed", "no_valid_identity", ti(e, c))
        ), j(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "identity" });
        return;
      }
      S(e.filteredUser) === r && oi(t, e, i, n, c, r, s, o, a);
    }
  }
}
function oi(t, e, i, n, r, s, o, a, c, l) {
  if (c && e.isIntentPrivacyAllowed?.() === !1) return;
  const { collected: u, missingKeys: d, formEmailKey: m } = ye(e, i, r), f = t.lastResolvedPageView, p = U[U.length - 1], E = v(n);
  if (ne(i) && f && f.accountId === e.accountId && f.pathname === E && f.route === p && f.userId === S(e.filteredUser) && f.identifier === r.targetPageIdentifier && f.attributeKeys.some(
    (b) => r.attributeKeys.includes(b) && w(F(u, b))
  ))
    return;
  if (d.length > 0) {
    const b = ie(e.filteredUser);
    for (const D of d)
      e.logPlacementDiagnostic(
        y("missed", `missing_attribute:${D}`, {
          identity_types: fe(b),
          key_is_identity: b.some((T) => T.toLowerCase() === D.toLowerCase())
        })
      );
    j(t, e, {
      event: i,
      pathname: n,
      triggeringUserId: s,
      triggeredAt: o,
      intentSeen: c,
      waitingFor: "attribute"
    });
    return;
  }
  l && (t.pending = t.pending.filter((b) => b !== l));
  const P = G(r, i), L = c ?? te(i), R = L ?? (P ? "event" : z(i) ? "pathname" : "pageview");
  ni(
    e,
    e.accountId || "",
    v(n),
    r.targetPageIdentifier,
    u,
    a ?? (L ? "intent" : P ? "event_trigger" : "fired"),
    qt(R, r),
    P && !L,
    !!L,
    P,
    m
  ) && (r.intentTrigger || zt(e, r)) && (de(i) || P) && (t.lastResolvedPageView = {
    accountId: e.accountId,
    pathname: E,
    route: p,
    userId: S(e.filteredUser),
    identifier: r.targetPageIdentifier,
    attributeKeys: Object.keys(u)
  });
}
function hn(t, e, i = window.location.pathname) {
  if (gn(t, e), t.pending.length === 0)
    return;
  const n = t.pending;
  t.pending = [], n.forEach((r) => {
    const { event: s, pathname: o, storedDiagnostics: a, triggeringUserId: c, triggeredAt: l, waitingFor: u, intentSeen: d } = r, m = qe(e), f = C(e.filteredUser), p = Xe(l);
    if (m && u === "identity" && f && e.logPlacementDiagnostic(
      y("identity_arrived", "pending_identity", {
        ...p,
        on_trigger_path: o === i
      })
    ), o !== i) {
      Ke(e, { waitingFor: u, triggeredAt: l });
      return;
    }
    if (u === "intent" && !d) {
      const E = O(e.accountId, o);
      if (E && ve(e, E)) {
        !r.awaitingIntentLogged && e.isKitReady() && e.isPreselectionEnabled() && (e.logPlacementDiagnostic(y("held", "awaiting_intent")), Ne(e, E, s), r.awaitingIntentLogged = !0), t.pending.push(r);
        return;
      }
    }
    m && a?.forEach((E) => e.logPlacementDiagnostic(E)), t.scheduledDispatch?.pathname !== o && B(t, e, s, o, c, l, d);
  });
}
function mn(t, e) {
  if (!t.accountId || !qe(t))
    return;
  const i = ue(t.accountId, e);
  if (!i)
    return;
  const n = ji(t.accountId, i.targetPageIdentifier);
  if (!n || (Gt(t.accountId) && t.isIntentPrivacyAllowed?.() !== !1 && t.logPlacementDiagnostic(
    y("arrived", "intent_arrival", En(n))
  ), n.firedAt !== void 0))
    return;
  const r = n.triggeredAt !== void 0;
  t.logPlacementDiagnostic(
    y("missed", "arrival_without_fire", {
      trigger_seen: r,
      identity_seen_on_trigger_path: n.identitySeenAt !== void 0,
      has_identity: C(t.filteredUser),
      // Another tab's checkout caches its offers in that tab, so this arrival still misses. This tab's
      // own trigger counts too: the device marker can expire, be cleared by another tab or fail to save.
      trigger_seen_any_tab: r || Mi(t.accountId, i.targetPageIdentifier),
      ...Xe(n.triggeredAt)
    })
  );
}
function En(t) {
  const e = t.intentAt === void 0 || t.intentKind === void 0 ? "none" : In(Date.now() - t.intentAt);
  return {
    intent_seen: e === "none" ? "none" : t.intentKind,
    lead: e,
    fired: t.firedAt !== void 0
  };
}
const _n = [
  [1e3, "lt1s"],
  [2e3, "1s_2s"],
  [5e3, "2s_5s"],
  [1e4, "5s_10s"],
  [2e4, "10s_20s"],
  [6e4, "20s_60s"],
  [3e5, "60s_300s"],
  [xt, "300s_1800s"]
];
function In(t) {
  if (t < 0)
    return "none";
  const e = _n.find(([i]) => t < i);
  return e ? e[1] : "none";
}
function yn() {
  return {
    context: null,
    lifecycle: "idle",
    recreateInFlight: null
  };
}
function vn(t, e) {
  t.context = {
    accountId: e.accountId,
    launcherOptions: { ...e.launcherOptions },
    legacyRoktExtensions: [...e.legacyRoktExtensions]
  };
}
function bn(t) {
  t.lifecycle = "attached";
}
function An(t) {
  t.lifecycle !== "idle" && (t.lifecycle = "terminated");
}
function Pn(t) {
  t.lifecycle = "terminated";
}
function Tn(t) {
  t.context = null, t.lifecycle = "idle", t.recreateInFlight = null;
}
function wn(t, e, i) {
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
const A = "Rokt", Sn = 7, oe = 181, Rn = "selectPlacements", kn = "apps.roktecommerce.com", Ln = 0.1, Dn = "ThankYouPageJourney", Cn = "rokt-launcher", On = "rokt-thank-you-element", Kn = "userIdentifiedInWorkspace", gt = 3, Nn = 2, Un = "page_events", Fn = "page_view_attributes", Mn = "mparticle_session_id", xn = "mparticle_device_id", pt = "rokt:intent", ht = "LEAD_CAPTURE_SUBMITTED", Te = "exit-intent", Vn = [
  "3479519924056514560",
  "3484183287406608384",
  "3198447216177237634",
  "3292347205549055462"
], Hn = "exit-intent-placement", mt = 500, Je = {
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  UNHANDLED_EXCEPTION: "UNHANDLED_EXCEPTION",
  IDENTITY_REQUEST: "IDENTITY_REQUEST",
  LOG_DELIVERY_FAILURE: "LOG_DELIVERY_FAILURE"
}, Z = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARNING: "WARNING"
}, jn = "apps.rokt-api.com", Yn = "/v1/log", $n = "/v1/errors", Wn = 10;
function g() {
  return window.mParticle;
}
function Et(t, e) {
  const n = [be(t), "/wsdk/integrations/launcher.js"].join("");
  return !e || e.length === 0 ? n : n + "?extensions=" + e.join(",");
}
function _t(t) {
  return [be(t), "/rokt-elements/rokt-element-thank-you.js"].join("");
}
function be(t) {
  const e = t !== void 0 ? t : jn;
  return e.includes("://") ? e.replace(/\/+$/, "") : ["https://", e].join("");
}
function ai(t, e, i) {
  if (t)
    return t.startsWith("http://") || t.startsWith("https://") ? t : "https://" + t;
  const r = e?.includes("://") && !/^https?:\/\//i.test(e) ? void 0 : e;
  return be(r) + i;
}
function It(t, e, i) {
  if (document.getElementById(t)) return;
  const n = document.head || document.body, r = document.createElement("script");
  r.id = t, r.type = "text/javascript", r.src = e, r.async = !0, r.crossOrigin = "anonymous", r.fetchPriority = "high", i?.onLoad && (r.onload = i.onLoad), i?.onError && (r.onerror = i.onError), n.appendChild(r);
}
function ae(t) {
  if (!t)
    return [];
  const e = kt(t);
  return e === void 0 ? (console.error("Settings string contains invalid JSON"), []) : e;
}
function yt(t) {
  const e = t ? ae(t) : [], i = [], n = [];
  let r = !1;
  for (let s = 0; s < e.length; s++) {
    const o = e[s].value;
    o === "thank-you-journey" ? (r = !0, n.push(Dn)) : i.push(o);
  }
  return {
    roktExtensionsQueryParams: i,
    legacyRoktExtensions: n,
    loadThankYouElement: r
  };
}
async function Gn(t, e) {
  const i = [];
  if (e)
    for (const n of t)
      i.push(e.use(n));
  return Promise.all(i);
}
function vt(t) {
  if (!t)
    return {};
  const e = {};
  for (let i = 0; i < t.length; i++) {
    const n = t[i];
    e[n.jsmap] = n.value;
  }
  return e;
}
function bt(t) {
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
function At(t, e, i) {
  return g().generateHash([t, e, i].join(""));
}
function zn(t) {
  let n = "mParticle_wsdkv_" + g().getVersion() + "_kitv_" + "3.20.0";
  return t && (n += "_" + t), n;
}
function Pt(t) {
  return !!(t && Vn.includes(t));
}
function Ue(t) {
  const e = document.createElement("iframe");
  e.style.display = "none", e.setAttribute("sandbox", "allow-scripts allow-same-origin"), e.src = t, e.onload = function() {
    e.onload = null, e.parentNode && e.parentNode.removeChild(e);
  };
  const i = document.body || document.head;
  i && i.appendChild(e);
}
function Tt(t, e) {
  const i = Me(window.location.origin);
  if (q._allowedOriginHashes.indexOf(i) === -1 || Math.random() >= Ln)
    return;
  const r = window.__rokt_li_guid__;
  if (!r || t && t.includes("://") && !/^https:\/\//i.test(t))
    return;
  const s = Fe(window.location.href), o = "version=" + encodeURIComponent(e ?? "") + "&launcherInstanceGuid=" + encodeURIComponent(r) + "&pageUrl=" + encodeURIComponent(s), a = t ? be(t) : "https://apps.rokt.com";
  Ue(a + "/v1/wsdk-init/index.html?" + o), Ue(
    "https://" + kn + "/v1/wsdk-init/index.html?" + o + "&isControl=true"
  );
}
function Bn() {
  return typeof window < "u" && !!window.location?.search?.toLowerCase().includes("mp_enable_logging=true");
}
function qn() {
  if (typeof window > "u")
    return;
  const t = window.location?.href;
  return t ? Fe(t) : void 0;
}
function Xn() {
  return typeof window < "u" ? window.navigator?.userAgent : void 0;
}
class ci {
  constructor() {
    this._logCount = {};
  }
  incrementAndCheck(e) {
    const n = (this._logCount[e] || 0) + 1;
    return this._logCount[e] = n, n > Wn;
  }
}
class ge {
  constructor(e, i, n, r, s) {
    this._reporter = "mp-wsdk";
    const o = e.isLoggingEnabled;
    this._integrationName = i || "", this._launcherInstanceGuid = n, this._accountId = r || null, this._rateLimiter = s || new ci(), this._isEnabled = Bn() || o;
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
          code: r || Je.UNKNOWN_ERROR,
          url: qn(),
          deviceInfo: Xn(),
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
            const u = new Error("HTTP " + l.status + " from log endpoint");
            throw u.statusCode = l.status, u;
          }
        }).catch((l) => {
          console.error("ReportingTransport: Failed to send log", l), o && o(l);
        });
      } catch (a) {
        console.error("ReportingTransport: Failed to send log", a), o && o(a);
      }
  }
}
class wt {
  constructor(e, i, n, r, s) {
    this._transport = new ge(e, i, n, r, s), this._errorUrl = ai(e?.errorUrl, e?.integrationDomain, $n);
  }
  report(e) {
    if (!e) return;
    const i = e.severity || Z.ERROR;
    this._transport.send(this._errorUrl, i, e.message, e.code, e.stackTrace);
  }
}
class St {
  constructor(e, i, n, r, s, o) {
    this._intentObserveLines = 0, this._transport = new ge(e, n, r, s, o), this._placementDiagnosticTransport = new ge(
      e,
      n,
      r,
      s
    ), this._loggingUrl = ai(e?.loggingUrl, e?.integrationDomain, Yn), this._errorReportingService = i;
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
      Z.INFO,
      i.message,
      i.code,
      void 0,
      (n) => {
        if (this._errorReportingService) {
          const r = typeof n.statusCode == "number";
          this._errorReportingService.report({
            message: "LoggingService: Failed to send log: " + n.message,
            code: Je.LOG_DELIVERY_FAILURE,
            severity: r ? Z.ERROR : Z.WARNING
          });
        }
      }
    );
  }
}
function Jn(t) {
  const e = Lt(window.location.href), i = t.EventAttributes?.title || document.title, n = bi(), r = t.ActiveTimeOnSite;
  return {
    pageUrl: e,
    sourceMessageId: t.SourceMessageId,
    timestamp: t.Timestamp,
    ...i ? { pageTitle: i } : {},
    ...n !== void 0 ? { canonicalUrl: n } : {},
    ...Number.isFinite(r) ? { activeTimeOnSite: r } : {}
  };
}
const N = class N {
  constructor() {
    this.name = A, this.id = oe, this.moduleId = oe, this.isInitialized = !1, this.launcher = null, this.filters = {}, this.userAttributes = {}, this.userIdentifiedInWorkspace = !1, this.testHelpers = null, this.placementEventMappingLookup = {}, this.placementEventAttributeMappingLookup = {}, this.integrationName = null, this.errorReportingService = null, this.loggingService = null, this._thankYouElementOnLoadCallback = null, this._isThankYouElementLoaded = !1, this._workspaceSearchInFlightPromise = null, this._launcherAttachState = yn(), this._exitIntentConfig = null, this._exitIntentDispatchedForPageView = !1, this._exitIntentEnabledForAccount = !1, this._pendingInitWarnings = [], this.accountId = null, this._preselectState = sn();
  }
  // ---- Private helpers ----
  getEventAttributeValue(e, i) {
    const n = e && e.EventAttributes;
    if (!n)
      return null;
    const r = F(n, i);
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
      if (w(s))
        continue;
      let o = !0;
      for (let a = 0; a < s.length; a++)
        if (!this.doesEventMatchRule(e, s[a])) {
          o = !1;
          break;
        }
      o && g().Rokt.setLocalSessionAttribute?.(r, !0);
    }
  }
  capturePageView(e) {
    let i;
    try {
      i = Fe(window.location.href);
      const n = rt(), r = Jn(e);
      n.push(r);
      const s = Math.min(n.length, Ot), o = _i(n);
      if (o === 0) {
        const a = we() ? "quota" : "ls_unavailable";
        this.loggingService?.log({
          message: `Rokt Kit: Failed to persist page view for ${i} [reason: ${a}]`,
          code: "PAGE_VIEW_CAPTURE_FAILED"
        });
      } else o < s && this.loggingService?.log({
        message: `Rokt Kit: Page view storage reduced from ${s} to ${o} record(s) under quota pressure [reason: quota_eviction]`,
        code: "PAGE_VIEW_QUOTA_EVICTION"
      });
    } catch (n) {
      const r = we() ? "exception" : "ls_unavailable", s = n instanceof Error ? n.message : String(n);
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
      return ue(this.accountId, e);
  }
  buildPreselectAttributeOverrides(e) {
    if (!this.isPreselectionEnabled())
      return;
    const i = ue(this.accountId, e)?.preselectAttributeOverrides, n = this.filters || {};
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
      isIntentPrivacyAllowed: () => this.isIntentPrivacyAllowed(),
      getCurrentUser: () => g().Identity?.getCurrentUser?.(),
      getCurrentHost: () => this.buildPreselectHost(),
      isTargetingDisabled: () => this.isTargetingDisabled(),
      getUserIdentities: () => this.returnUserIdentities(this.filters.filteredUser),
      mappedEmailSha256Key: this._mappedEmailSha256Key,
      isForwardingAllowed: () => this.isForwardingAllowed(),
      isCheckoutIntentActive: () => this.isCheckoutIntentActive(),
      isEmailIdentityFiltered: () => this.isEmailIdentityFiltered()
    };
  }
  flushPendingPreselectDispatches() {
    hn(this._preselectState, this.buildPreselectHost());
  }
  isLauncherReadyToAttach() {
    return !!window.Rokt && V(window.Rokt.createLauncher);
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
    return n && e[n] && (i[N.EMAIL_SHA256_KEY] = e[n]), n && delete i[n], i;
  }
  logSelectPlacementsEvent(e) {
    if (!window.mParticle || typeof g().logEvent != "function" || !I(e))
      return;
    const i = g().EventType.Other;
    g().logEvent(Rn, i, e);
  }
  setRoktSessionId(e) {
    if (!(!e || typeof e != "string"))
      try {
        const i = g().getInstance();
        i && V(i.setIntegrationAttribute) && i.setIntegrationAttribute(oe, {
          roktSessionId: e
        });
      } catch {
      }
  }
  readMpSessionId() {
    const e = g()?.sessionManager, i = e?.getSessionId ?? e?.getSession;
    if (V(i))
      return i.call(e) || void 0;
  }
  readMpDeviceId() {
    return g()?.getDeviceId?.() || void 0;
  }
  attachLauncher(e, i, n = []) {
    vn(this._launcherAttachState, {
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
      await Gn([...n], o), this.initRoktLauncher(o);
    }).catch((o) => {
      const a = this._launcherAttachState.lifecycle === "attached";
      if (Pn(this._launcherAttachState), !a) {
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
    return wn(
      this._launcherAttachState,
      this.isLauncherReadyToAttach(),
      (e) => this.attachLauncher(e.accountId, e.launcherOptions, e.legacyRoktExtensions)
    );
  }
  initRoktLauncher(e) {
    window.Rokt && (window.Rokt.currentLauncher = e), this.launcher = e, bn(this._launcherAttachState);
    const i = g().Rokt?.filters;
    i ? (!this.isInitialized && this.filters.filteredUser && (i.filteredUser = this.filters.filteredUser), this.filters = i, i.filteredUser ? this._workspaceSearchInFlightPromise = this.search(i.filteredUser) : console.warn("Rokt Kit: No filtered user has been set.")) : console.warn("Rokt Kit: No filters have been set."), this.isInitialized = !0, Tt(this.domain, this.integrationName), g().Rokt.attachKit(this), this.pushExitIntentExtensionConfig(), this.flushPendingPreselectDispatches();
  }
  // Leaving the hook unset is what keeps History unpatched for workspaces that never
  // preselect. The core SDK reads onCheckoutIntent when it has a signal, so an account without
  // intentTrigger entries never hears one.
  armPreselectPathnameTrigger() {
    Pe(window.location.pathname), this.onRouteChange = De(this.accountId) ? () => this.evaluatePreselectPathname() : void 0, this.armPreselectEmailInputListener(), this.onCheckoutIntent = De(this.accountId) ? (e) => {
      try {
        Wi(this._preselectState, this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0;
  }
  // A guest often types their email after the trigger page view has queued for want of one, so a
  // committed email input retries the queue. Only accounts with an entry that reads the form listen.
  armPreselectEmailInputListener() {
    this._preselectEmailInputListener && (document.removeEventListener("input", this._preselectEmailInputListener, !0), document.removeEventListener("change", this._preselectEmailInputListener, !0), this._preselectEmailInputListener = void 0), dn(this.accountId) && (this._preselectEmailInputListener = (e) => {
      Oe(e), e.type === "change" && this._preselectState.pending.length > 0 && un(this._preselectState, this.buildPreselectHost(), e) && this.flushPendingPreselectDispatches();
    }, document.addEventListener("input", this._preselectEmailInputListener, !0), document.addEventListener("change", this._preselectEmailInputListener, !0));
  }
  // True while the core SDK sends checkout intent signals for this workspace: auto button tracking is
  // on and no opt-out or privacy option suppresses them. An older core without the check reads false.
  isCheckoutIntentActive() {
    const e = g().Rokt;
    try {
      return V(e?.isCheckoutIntentSuppressed) && e.isCheckoutIntentSuppressed() === !1;
    } catch {
      return !1;
    }
  }
  // Core gates every kit callback on opt-out and consent, but a DOM listener is called by the browser
  // directly, so it checks both itself.
  isForwardingAllowed() {
    return g().getInstance?.()?._Store?.isEnabled !== !1 && g()._getActiveForwarders().some((i) => i === this);
  }
  // A call carrying a form email can wait on identity search or launcher setup. A skipped one costs only
  // the cached hit, so it goes out only if nothing changed: same user, still allowed, and no partner
  // email has appeared, filtered or not.
  getFormEmailDropCause(e, i) {
    if (!this.isForwardingAllowed()) return "forwarding_disallowed";
    if (this.isTargetingDisabled() || !this.isIntentPrivacyAllowed()) return "privacy_signal";
    if (String(this.filters?.filteredUser?.getMPID?.() ?? "") !== String(i ?? "")) return "user_changed";
    if (Ge(this.buildPreselectHost(), e)) return "partner_email";
  }
  // Whether this connection filters out the Email identity, or the identity mapped to the hashed email.
  isEmailIdentityFiltered() {
    const e = this.userIdentityFilters || [];
    if (e.includes(Sn))
      return !0;
    const i = this._mappedEmailSha256Key, n = g().IdentityType || {}, r = i ? Object.keys(n).find((o) => o.toLowerCase() === i) : void 0, s = r ? n[r] : void 0;
    return typeof s == "number" && e.includes(s);
  }
  evaluatePreselectPathname() {
    const e = window.location.pathname;
    Pe(e), e !== this._lastPreselectPathname && (this.isTargetingDisabled() || (this._lastPreselectPathname = e, Ji(this._preselectState, this.buildPreselectHost(), e)));
  }
  fetchOptimizely() {
    const e = g()._getActiveForwarders().filter((i) => i.name === "Optimizely");
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
    return Pt(e) ? {
      identifier: Hn,
      signals: {
        mouseExitTop: !0,
        scrollUpFast: !0,
        idle: !0
      }
    } : null;
  }
  applyExitIntentExtensionOverride(e, i) {
    return e ? i.includes(Te) ? i : [...i, Te] : i;
  }
  extractExitIntentIdentifier(e) {
    return e ? h(e.identifier) && e.identifier.length > 0 ? e.identifier : h(e.placementIdentifier) && e.placementIdentifier.length > 0 ? e.placementIdentifier : null : null;
  }
  processLeadCaptureSubmittedEvent(e) {
    if (!(e instanceof CustomEvent) || !I(e.detail))
      return;
    const i = e.detail, n = I(i.body) ? i.body : {};
    let r = h(n.email) ? n.email : void 0, s = h(n.mobile_number) ? n.mobile_number : void 0;
    if (!r || !s) {
      const d = Array.isArray(i.fields) ? i.fields : [];
      for (let m = 0; m < d.length; m += 1) {
        const f = d[m];
        if (!h(f.fieldKey) || !h(f.value))
          continue;
        const p = f.fieldKey.toLowerCase().replace(/[^a-z]/g, "");
        !r && (p === "email" || p === "emailaddress") && f.value.length > 0 && (r = f.value), !s && (p === "mobile" || p === "mobilenumber" || p === "phone" || p === "phonenumber") && (s = f.value);
      }
    }
    const o = {};
    h(r) && r.length > 0 && (o.email = r), h(s) && s.length > 0 && (o.mobile_number = s);
    const a = {};
    this.mergeLeadCaptureUserAttributes(a, I(n.userAttributes) ? n.userAttributes : null), this.mergeLeadCaptureUserAttributes(
      a,
      I(i.userAttributes) ? i.userAttributes : null
    );
    const c = h(n.rclid) ? n.rclid : h(i.rclid) ? i.rclid : void 0;
    c && c.length > 0 && (a.rokt_rclid = c);
    const l = h(n.accountID) ? n.accountID : h(i.accountID) ? i.accountID : void 0;
    l && l.length > 0 && (a.rokt_account_id = l);
    const u = h(n.referralCreativeID) ? n.referralCreativeID : h(i.referralCreativeID) ? i.referralCreativeID : void 0;
    u && u.length > 0 && (a.rokt_referral_creative_id = u), this.applyIdentityCapturePayload(o, a);
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
    const o = g().Identity?.modify;
    if (V(o) && Object.keys(n).length > 0)
      try {
        o({ userIdentities: n });
      } catch (c) {
        this.loggingService?.log({
          message: "Rokt Kit: identity capture modify failed",
          code: "EXIT_INTENT_IDENTITY_MODIFY_FAILED",
          additional_info: c instanceof Error ? { errorName: c.name, errorMessage: c.message } : void 0
        });
      }
    const a = g().Identity?.getCurrentUser?.();
    for (const [c, l] of Object.entries(i))
      if (a?.setUserAttribute)
        try {
          a.setUserAttribute(c, l);
        } catch (u) {
          this.loggingService?.log({
            message: "Rokt Kit: identity capture user attribute update failed",
            code: "EXIT_INTENT_IDENTITY_SET_ATTRIBUTE_FAILED",
            additional_info: u instanceof Error ? { errorName: u.name, errorMessage: u.message, key: c } : { key: c }
          });
        }
  }
  configureExitIntentBridge(e) {
    if (this._exitIntentConfig = this.isTargetingDisabled() ? null : e, this._exitIntentDispatchedForPageView = !1, this._exitIntentListener && (window.removeEventListener(pt, this._exitIntentListener), this._exitIntentListener = void 0), this._exitIntentLeadCaptureSubmittedListener && (window.removeEventListener(
      ht,
      this._exitIntentLeadCaptureSubmittedListener
    ), this._exitIntentLeadCaptureSubmittedListener = void 0), this._isIdentityCaptureBridgeEnabled(this._exitIntentConfig) && (this._exitIntentLeadCaptureSubmittedListener = (n) => {
      this.processLeadCaptureSubmittedEvent(n);
    }, window.addEventListener(
      ht,
      this._exitIntentLeadCaptureSubmittedListener
    )), !this._isExitIntentBridgeEnabled(this._exitIntentConfig))
      return;
    const i = this.extractExitIntentIdentifier(this._exitIntentConfig);
    i && (this._exitIntentListener = (n) => {
      const r = n instanceof CustomEvent && n.detail && h(n.detail.reason) ? n.detail.reason : "unknown";
      if (this._exitIntentDispatchedForPageView || !this.isKitReady() || !(r === "mouse-exit-top" || r === "scroll-up-fast" || r === "idle" || r === "leave-link"))
        return;
      this._exitIntentDispatchedForPageView = !0;
      const o = I(this._exitIntentConfig?.attributes) ? this._exitIntentConfig.attributes : {};
      try {
        const a = g().Rokt?.selectPlacements?.({
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
    }, window.addEventListener(pt, this._exitIntentListener));
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
    !this._exitIntentConfig || !V(window.Rokt?.setExtensionData) || window.Rokt.setExtensionData({
      [Te]: this._exitIntentConfig
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
    const o = g().Rokt?.launcherOptions?.noFunctional === !0;
    hi(o), o || this.isTargetingDisabled() ? mi() : (Di(), Ki()), this.isTargetingDisabled() && (st(), ot());
    const a = e, c = a.accountId;
    this._exitIntentEnabledForAccount = Pt(c);
    const l = this._exitIntentEnabledForAccount ? this.getEffectiveExitIntentConfig(c) : null;
    this._exitIntentEnabledForAccount ? this.configureExitIntentBridge(l) : this.configureExitIntentBridge(null), this.accountId = c || null;
    const u = this.accountId ? Yi(this.accountId, a.preselectionConfig) : void 0;
    this.userAttributes = W(s), this.armPreselectPathnameTrigger(), this._onboardingExpProvider = a.onboardingExpProvider;
    const d = ae(a.placementEventMapping);
    this.placementEventMappingLookup = vt(d);
    const m = ae(
      a.placementEventAttributeMapping
    );
    this.placementEventAttributeMappingLookup = bt(m), a.hashedEmailUserIdentityType && (this._mappedEmailSha256Key = a.hashedEmailUserIdentityType.toLowerCase()), this._workspaceIdSyncApiKey = h(a.workspaceIdSyncApiKey) ? a.workspaceIdSyncApiKey : void 0;
    const f = g().Rokt?.domain, { roktExtensionsQueryParams: p, legacyRoktExtensions: E, loadThankYouElement: P } = yt(
      a.roktExtensions
    ), L = this.applyExitIntentExtensionOverride(
      l,
      p
    ), R = {
      ...g().Rokt?.launcherOptions || {}
    };
    this.integrationName = zn(R.integrationName), R.integrationName = this.integrationName, this.domain = f;
    const $ = {
      loggingUrl: a.loggingUrl,
      errorUrl: a.errorUrl,
      integrationDomain: f,
      isLoggingEnabled: g().config?.isLoggingEnabled === !0
    }, b = new wt(
      $,
      this.integrationName,
      window.__rokt_li_guid__,
      a.accountId
    ), D = new St(
      $,
      b,
      this.integrationName,
      window.__rokt_li_guid__,
      a.accountId
    );
    return this.errorReportingService = b, this.loggingService = D, this._flushInitWarnings(), u && D.log({
      message: `Rokt Kit: preselectionConfig setting is invalid [reason=${u}], using the built-in preselection config`,
      code: "PRESELECT_CONFIG_INVALID"
    }), g()._registerErrorReportingService && g()._registerErrorReportingService(b), g()._registerLoggingService && g()._registerLoggingService(D), n ? (this.testHelpers = {
      generateLauncherScript: Et,
      generateThankYouElementScript: _t,
      extractRoktExtensionConfig: yt,
      hashEventMessage: At,
      parseSettingsString: ae,
      generateMappedEventLookup: vt,
      generateMappedEventAttributeLookup: bt,
      sendAdBlockMeasurementSignals: Tt,
      createAutoRemovedIframe: Ue,
      djb2: Me,
      setAllowedOriginHashes: (T) => {
        N._allowedOriginHashes = T;
      },
      ReportingTransport: ge,
      ErrorReportingService: wt,
      LoggingService: St,
      RateLimiter: ci,
      ErrorCodes: Je,
      WSDKErrorSeverity: Z,
      resetLauncherAttachState: () => Tn(this._launcherAttachState)
    }, this.attachLauncher(c, R), "Successfully initialized: " + A) : (P && (g().Rokt.flushOnShoppableAdsReadyMessageQueue?.(this), It(On, _t(f), {
      onLoad: () => {
        this._isThankYouElementLoaded = !0, this._thankYouElementOnLoadCallback && this._thankYouElementOnLoadCallback();
      },
      onError: (T) => {
        console.error("Error loading Rokt Thank You Element script:", T);
      }
    })), this.isLauncherReadyToAttach() ? this.attachLauncher(c, R, E) : (It(Cn, Et(f, L), {
      onLoad: () => {
        this.isLauncherReadyToAttach() ? this.attachLauncher(c, R, E) : console.error("Rokt object is not available after script load.");
      },
      onError: (T) => {
        console.error("Error loading Rokt launcher script:", T);
      }
    }), this.captureTiming(N.PERFORMANCE_MARKS.RoktScriptAppended)), "Successfully initialized: " + A);
  }
  process(e) {
    if (e.EventDataType === gt && Pe(window.location.pathname), this.isTargetingDisabled() || (e.EventDataType === gt && (this._exitIntentEnabledForAccount && (this._exitIntentDispatchedForPageView = !1), yi(this.loggingService), this.capturePageView(e), B(this._preselectState, this.buildPreselectHost(), e)), Qi(this.accountId, e.EventName) && nn(this._preselectState, this.buildPreselectHost(), e)), e.EventDataType === Nn && (st(), ot(), $e(this._preselectState), this.accountId && (H(this.accountId), at(this.accountId), lt(this.accountId))), !this.isKitReady())
      return "Kit not ready for forwarder: " + A;
    if (V(g().Rokt?.setLocalSessionAttribute) && !Bt(e) && (w(this.placementEventAttributeMappingLookup) || this.applyPlacementEventAttributeMapping(e), !w(this.placementEventMappingLookup))) {
      const i = At(e.EventDataType, e.EventCategory, e.EventName ?? "");
      this.placementEventMappingLookup[String(i)] && g().Rokt.setLocalSessionAttribute?.(this.placementEventMappingLookup[String(i)], !0);
    }
    return "Successfully sent to forwarder: " + A;
  }
  setExtensionData(e) {
    if (!this.isKitReady()) {
      console.error("Rokt Kit: Not initialized");
      return;
    }
    window.Rokt.setExtensionData(e);
  }
  setUserAttribute(e, i) {
    return Rt(e) || (this.userAttributes[e] = i), rn(this.accountId, e) && this.flushPendingPreselectDispatches(), "Successfully set user attribute for forwarder: " + A;
  }
  removeUserAttribute(e) {
    return delete this.userAttributes[e], "Successfully removed user attribute for forwarder: " + A;
  }
  handleIdentityComplete(e, i) {
    return this.userAttributes = W(e.getAllUserAttributes()), "Successfully called " + i + " for forwarder: " + A;
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
    return this.userIdentifiedInWorkspace = !1, this._workspaceSearchInFlightPromise = null, this._workspaceLastSearchedIdentitiesKey = void 0, this.accountId && (H(this.accountId), at(this.accountId), lt(this.accountId)), this.handleIdentityComplete(e, "onLogoutComplete");
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
        new Promise((s) => setTimeout(s, mt))
      ]) : Promise.resolve();
      return Promise.all([i, r]).then(
        () => this._dispatchPlacements(e)
      );
    }
    if (this._workspaceSearchInFlightPromise) {
      const n = this._workspaceSearchInFlightPromise;
      return Promise.race([
        n,
        new Promise((r) => setTimeout(r, mt))
      ]).then(() => this._dispatchPlacements(e));
    }
    return this._dispatchPlacements(e);
  }
  _dispatchPlacements(e) {
    const i = e?.[le], n = { ...e };
    delete n[le], e = n;
    const r = I(i) ? i : void 0, s = r && h(r.key) ? r.key : void 0;
    if (s) {
      const re = this.getFormEmailDropCause(s, r.mpid);
      if (re) {
        this.loggingService?.logPlacementDiagnostic(
          y("missed", "form_email_dropped", { cause: re })
        );
        return;
      }
    }
    const o = e.attributes || {}, a = W(this.userAttributes), c = { ...a, ...o }, l = this.filters || {}, u = l.userAttributeFilters || [], d = l.filteredUser || null, m = d ? d.getMPID() : null;
    let f;
    l ? l.filterUserAttributes ? f = l.filterUserAttributes(c, u) : f = c : (console.warn("Rokt Kit: No filters available, using user attributes"), f = c);
    const p = W(f);
    s && (Object.prototype.hasOwnProperty.call(a, s) ? p[s] = a[s] : delete p[s]), this.userAttributes = p;
    const E = this._onboardingExpProvider === "Optimizely" ? this.fetchOptimizely() : {}, P = this.returnUserIdentities(d), L = this.returnLocalSessionAttributes(), R = Ii(rt()), $ = vi(), b = this.readMpSessionId(), D = this.readMpDeviceId(), T = typeof e.identifier == "string" ? e.identifier : void 0;
    e.preselect !== !0 && mn(this.buildPreselectHost(), T);
    const li = e.preselect === !0 ? Xt(f, this.buildPreselectAttributeOverrides(T)) : f, Qe = {
      ...P,
      ...li,
      ...E,
      ...L,
      ...R.length ? { [Un]: JSON.stringify(R) } : {},
      ...$ ? { [Fn]: $ } : {},
      ...this.userIdentifiedInWorkspace ? { [Kn]: !0 } : {},
      ...b ? { [Mn]: b } : {},
      ...D ? { [xn]: D } : {},
      mpid: m
    }, Ae = this.findCacheConfigEntry(T), Ze = Ae?.identityKeys, ui = {
      ...e,
      attributes: Qe,
      ...Ae ? { cacheMatchKeys: Xi(Ae) } : {},
      ...Ze ? { cacheIdentityKeys: Ze } : {}
    }, et = this.launcher.selectPlacements(ui), tt = e.preselect === !0, di = () => {
      tt || this.logSelectPlacementsEvent(Qe);
    };
    return Promise.resolve(et).then((re) => {
      if (!tt)
        return re?.context?.sessionId?.then((fi) => this.setRoktSessionId(fi));
    }).catch(() => {
    }).finally(di), et;
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
    return this.isKitReady() ? (An(this._launcherAttachState), this.launcher.terminate()) : (console.error("Rokt Kit: Not initialized"), Promise.resolve());
  }
  /**
   * Registers a callback to be invoked once rokt-thank-you-element.js becomes available.
   */
  onShoppableAdsReady(e) {
    this._isThankYouElementLoaded ? e() : this._thankYouElementOnLoadCallback = e;
  }
};
N._allowedOriginHashes = [-553112570, 549508659], N.PERFORMANCE_MARKS = {
  RoktScriptAppended: "mp:RoktScriptAppended"
}, N.EMAIL_SHA256_KEY = "emailsha256";
let q = N;
function Qn() {
  return oe;
}
function Zn(t) {
  if (!t) {
    window.console.log("You must pass a config object to register the kit " + A);
    return;
  }
  if (!I(t)) {
    window.console.log("'config' must be an object. You passed in a " + typeof t);
    return;
  }
  I(t.kits) ? t.kits[A] = {
    constructor: q
  } : (t.kits = {}, t.kits[A] = {
    constructor: q
  }), window.console.log("Successfully registered " + A + " to your mParticle configuration");
}
typeof window < "u" && window.mParticle && g().addForwarder && g().addForwarder({
  name: A,
  constructor: q,
  getId: Qn
});
export {
  Zn as register
};
//# sourceMappingURL=Rokt-Kit.esm.js.map
