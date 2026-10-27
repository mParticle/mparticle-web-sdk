const yn = [
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
], En = new Set(yn);
function Ti(t) {
  return En.has(t.toLowerCase());
}
function J(t) {
  const e = {}, i = t || {}, n = Object.keys(i);
  for (let r = 0; r < n.length; r++) {
    const s = n[r];
    Ti(s) || (e[s] = i[s]);
  }
  return e;
}
function I(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function h(t) {
  return typeof t == "string";
}
function B(t) {
  return typeof t == "function";
}
function Li(t) {
  try {
    return JSON.parse(t.replace(/&quot;/g, '"'));
  } catch {
    return;
  }
}
function T(t) {
  return t == null ? !0 : typeof t == "string" ? t.length === 0 : typeof t == "object" ? Object.keys(t).length === 0 : !1;
}
function L(t, e) {
  return Object.prototype.hasOwnProperty.call(t, e) ? t[e] : void 0;
}
function Oe(t) {
  const e = ki(), i = e ? e(t, "full") : t, n = i.indexOf("#"), r = n === -1 ? "" : i.slice(n);
  return (n === -1 ? i : i.slice(0, n)).split("?")[0] + r.split("?")[0];
}
function Et(t) {
  const e = ki();
  return e ? e(t, "path") : t.split(/[?#]/)[0];
}
function ki() {
  const t = window.mParticle;
  return t && typeof t._cleanUrl == "function" ? t._cleanUrl : void 0;
}
function It(t) {
  let e = 5381;
  for (let i = 0; i < t.length; i++)
    e = (e << 5) + e + t.charCodeAt(i), e = e & e;
  return e;
}
const A = "mp-rokt-kit", qt = "__rokt_ls_probe__";
function Xt() {
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
let ne = null;
function In(t) {
  t ? ne || (ne = { local: Xt(), session: Xt() }) : ne = null;
}
function An() {
  return ne !== null;
}
const q = () => ne?.local ?? window.localStorage, M = () => ne?.session ?? window.sessionStorage;
function tt() {
  try {
    const t = q();
    return t.setItem(qt, "1"), t.removeItem(qt), !0;
  } catch {
    return !1;
  }
}
function xe(t, e = q) {
  try {
    const i = e().getItem(t);
    return i === null ? null : JSON.parse(i);
  } catch {
    return null;
  }
}
function Ci(t, e, i = q) {
  try {
    return i().setItem(t, JSON.stringify(e)), !0;
  } catch {
    return !1;
  }
}
function it(t, e = q) {
  try {
    e().removeItem(t);
  } catch {
  }
}
function vn() {
  it(A, () => window.localStorage), it(A, () => window.sessionStorage);
}
function j(t, e, i = q) {
  const n = xe(t, i);
  return I(n) ? n[e] : void 0;
}
function $(t, e, i, n = q) {
  const r = xe(t, n), s = I(r) ? { ...r } : {};
  return s[e] = i, Ci(t, s, n);
}
function Ri(t, e, i) {
  Object.keys(e).length === 0 ? it(t, i) : Ci(t, e, i);
}
function Z(t, e, i = q) {
  const n = xe(t, i);
  if (!I(n) || !(e in n))
    return;
  const r = { ...n };
  delete r[e], Ri(t, r, i);
}
function ye(t, e, i = q) {
  const n = xe(t, i);
  if (!I(n))
    return;
  const r = Object.keys(n).filter((o) => o.startsWith(e));
  if (r.length === 0)
    return;
  const s = { ...n };
  r.forEach((o) => delete s[o]), Ri(t, s, i);
}
const At = "pageViews", Ke = "utmParams", Di = 25, bn = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
function Oi(t) {
  return t.slice(-Di);
}
function Jt() {
  const t = j(A, At);
  return Array.isArray(t) ? t.filter(I).map(Pn) : [];
}
function Pn(t) {
  return {
    ...t,
    ...h(t.pageUrl) ? { pageUrl: Oe(t.pageUrl) } : {},
    ...h(t.canonicalUrl) ? { canonicalUrl: Oe(t.canonicalUrl) } : {}
  };
}
function wn(t) {
  const e = Oi(t);
  for (let i = 0; i < e.length; i++) {
    const n = e.slice(i);
    if ($(A, At, n))
      return n.length;
  }
  return 0;
}
function Xe() {
  Z(A, At);
}
function Sn(t) {
  const e = Oi(t);
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
function Ki(t, e = !1) {
  return e || !!t && t.is_auto_page_view === !0;
}
function Tn(t, e, i = !1) {
  if (j(A, Ke) !== void 0)
    return;
  const n = Ki(e, i), r = new URLSearchParams(window.location.search), s = {};
  for (const a of bn) {
    const c = n ? (e || {})[a] : r.get(a);
    h(c) && c && (s[a] = c);
  }
  if (Object.keys(s).length === 0)
    return;
  const o = Object.keys(s).join(", ");
  if (!$(A, Ke, s)) {
    const a = tt() ? "quota" : "ls_unavailable";
    t?.log({
      message: `Rokt Kit: Failed to persist UTM params [reason: ${a}]`,
      code: "UTM_CAPTURE_FAILED"
    });
    return;
  }
  t?.log({
    message: `Rokt Kit: Captured UTM params [${o}]`,
    code: "UTM_CAPTURE_SUCCESS"
  });
}
function Ln() {
  const t = j(A, Ke);
  return I(t) ? t : null;
}
function Je() {
  Z(A, Ke);
}
function kn() {
  const e = document.querySelector('link[rel="canonical"]')?.href;
  if (e)
    return Oe(e);
}
const Cn = "skip", Rn = [
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
    preselectAttributeDefaults: {
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
], Dn = 1, On = 6e4;
function F(t) {
  return Array.isArray(t) && t.every(h);
}
function ke(t) {
  return h(t) && t !== "";
}
const Kn = ["DesktopWeb", "MobileWeb"];
function Un(t) {
  if (ke(t))
    return !0;
  if (!I(t))
    return !1;
  const { byClientType: e, byHostname: i, skipRemembered: n } = t;
  return t.value !== void 0 && !ke(t.value) || e !== void 0 && (!I(e) || !Object.entries(e).every(
    ([r, s]) => Kn.includes(r) && ke(s)
  )) || i !== void 0 && (!I(i) || !Object.entries(i).every(
    ([r, s]) => r !== "" && r === r.toLowerCase() && ke(s)
  )) || n !== void 0 && typeof n != "boolean" ? !1 : t.value !== void 0 || e !== void 0 || i !== void 0;
}
function Nn(t, e) {
  if (!I(e))
    return "not an object";
  const { pathname: i, targetPageIdentifier: n, attributeKeys: r, optionalAttributeKeys: s, identityKeys: o, dispatchDelayMs: a } = e, { triggerEventNames: c, releaseHoldOnRouteChange: l, readEmailInput: u, cartIntent: d, cartUserAttribute: p } = e, { checkoutStepIntent: g } = e, f = e.preselectAttributeOverrides, m = e.preselectAttributeDefaults !== void 0 ? e.preselectAttributeDefaults : f, y = e.widenedOptionalAttributeKeys;
  if (e.accountId !== void 0 && e.accountId !== t)
    return "accountId";
  if (!h(i) || !i.startsWith("/"))
    return "pathname";
  if (!h(n) || n === "")
    return "targetPageIdentifier";
  if (!F(r) || r.length === 0)
    return "attributeKeys";
  if (s !== void 0 && (!F(s) || !s.every((v) => r.includes(v))))
    return "optionalAttributeKeys";
  if (y !== void 0 && (!F(y) || !y.every((v) => r.includes(v))))
    return "widenedOptionalAttributeKeys";
  if (o !== void 0 && (!F(o) || o.length === 0 || !o.every((v) => r.includes(v))))
    return "identityKeys";
  if (F(y) && y.length > 0) {
    const v = (F(s) ? s : []).concat(y).map((w) => w.toLowerCase());
    if (!F(o) || o.some((w) => v.includes(w.toLowerCase())))
      return "identityKeys";
  }
  if (a !== void 0 && (!Number.isInteger(a) || a < 0 || a > On))
    return "dispatchDelayMs";
  if (l !== void 0 && typeof l != "boolean")
    return "releaseHoldOnRouteChange";
  if (g !== void 0 && typeof g != "boolean")
    return "checkoutStepIntent";
  if (d !== void 0 && typeof d != "boolean")
    return "cartIntent";
  if (u !== void 0 && (typeof u != "boolean" || !r.includes("email") || F(s) && s.includes("email") || // The runtime matches optional keys in any casing, so an 'Email' key would make email optional too.
  F(y) && y.some((v) => v.toLowerCase() === "email") || // A default makes its key optional too, and would send a guessed email as the shopper's.
  I(m) && Object.keys(m).some((v) => v.toLowerCase() === "email")))
    return "readEmailInput";
  if (e.preselectAttributeDefaults !== void 0 && f !== void 0)
    return "preselectAttributeDefaults";
  let b;
  if (m !== void 0) {
    const v = e.preselectAttributeDefaults !== void 0 ? "preselectAttributeDefaults" : "preselectAttributeOverrides";
    if (!I(m))
      return v;
    const w = (F(o) ? o : []).map((C) => C.toLowerCase()), O = ([C, W]) => Un(W) && r.includes(C) && !["email", "emailsha256"].includes(C.toLowerCase()) && !w.includes(C.toLowerCase()), k = ([C, W]) => f !== void 0 && h(W) && r.includes(C) && !(F(o) && o.includes(C)), H = Object.entries(m);
    if (!H.every((C) => O(C) || k(C)))
      return v;
    b = Object.fromEntries(H.filter(O));
  }
  if (c !== void 0 && (!F(c) || c.length === 0 || c.some((v) => v === "")))
    return "triggerEventNames";
  const E = { accountId: t, pathname: i, targetPageIdentifier: n, attributeKeys: r };
  return s !== void 0 && (E.optionalAttributeKeys = s), y !== void 0 && (E.widenedOptionalAttributeKeys = y), o !== void 0 && (E.identityKeys = o), a !== void 0 && (E.dispatchDelayMs = a), l !== void 0 && (E.releaseHoldOnRouteChange = l), g !== void 0 && (E.checkoutStepIntent = g), u !== void 0 && (E.readEmailInput = u), b !== void 0 && (E.preselectAttributeDefaults = b), c !== void 0 && (E.triggerEventNames = c), d !== void 0 && (E.cartIntent = d), d === !0 && h(p) && p !== "" && (E.cartUserAttribute = p), E;
}
function Fn(t, e) {
  const i = Li(e);
  if (i === void 0)
    return { error: "invalid JSON" };
  if (!I(i))
    return { error: "not an object" };
  if (i.schemaVersion !== Dn)
    return { error: "schemaVersion" };
  if (!Array.isArray(i.entries))
    return { error: "entries" };
  const n = [];
  for (let r = 0; r < i.entries.length; r++) {
    const s = Nn(t, i.entries[r]);
    if (h(s))
      return { error: `entry ${r + 1} ${s}` };
    if (n.some((o) => o.targetPageIdentifier === s.targetPageIdentifier))
      return { error: `entry ${r + 1} targetPageIdentifier` };
    n.push(s);
  }
  return { entries: n };
}
const Mn = 6e4, vt = "activePreselect:";
function xn(t) {
  return I(t) && typeof t.expiresAt == "number" && typeof t.attributesDigest == "number";
}
function bt(t, e) {
  return `${vt}${t}:${e}`;
}
function re(t) {
  const e = j(A, t, M);
  return xn(e) && e.expiresAt > Date.now() ? e : null;
}
function Vn(t, e, i = !1) {
  $(
    A,
    t,
    { expiresAt: Date.now() + Mn, attributesDigest: e, ...i ? { byEvent: !0 } : {} },
    M
  );
}
function Hn(t, e, i) {
  const n = re(t);
  n && n.attributesDigest !== i || (e && e.expiresAt > Date.now() ? $(A, t, e, M) : Z(A, t, M));
}
function Qt(t) {
  ye(
    A,
    `${vt}${t}:`,
    M
  );
}
function Wn() {
  ye(A, vt);
}
const jn = 5 * 6e4, Ui = "pendingPreselect:";
function $n(t) {
  return I(t) && typeof t.expiresAt == "number" && h(t.pathname) && h(t.identifier) && I(t.attributes) && h(t.mpid);
}
function Pt(t) {
  return `${Ui}${t}`;
}
function wt(t) {
  const e = Pt(t), i = j(A, e, M);
  return $n(i) ? i.expiresAt <= Date.now() ? (Z(A, e, M), null) : i : null;
}
function Zt(t, e, i, n, r, s = !1) {
  return $(
    A,
    Pt(t),
    {
      expiresAt: Date.now() + jn,
      pathname: e,
      identifier: i,
      attributes: n,
      mpid: r,
      ...s ? { byEvent: !0 } : {}
    },
    M
  );
}
function Q(t) {
  Z(A, Pt(t), M);
}
function Yn() {
  ye(A, Ui);
}
const nt = {
  apple_pay: /\bapple ?pay\b/,
  google_pay: /\b(?:google ?pay|g ?pay|android ?pay)\b/,
  venmo: /\bvenmo\b/,
  paypal: /\bpay ?pal\b/,
  amazon_pay: /\bamazon ?pay\b/,
  shop_pay: /\bshop ?pay\b/,
  klarna: /\bklarna\b/,
  afterpay: /\b(?:after ?pay|clear ?pay)\b/,
  affirm: /\baffirm\b/,
  cash_app: /\bcash ?app\b/,
  sezzle: /\bsezzle\b/,
  samsung_pay: /\bsamsung ?pay\b/,
  card: /\b(?:credit ?card|debit ?card|credit|debit|cards?|visa|master ?card|mc|am ?ex|american ?express|discover)\b/
}, Bn = /\b(?:gift cards?|store credit|rewards?|points?|balance|vouchers?|promo codes?|coupons?)\b/g, Gn = 12;
function zn(t) {
  return t.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/[^a-z]+/g, " ").trim();
}
function St(t) {
  if (typeof t != "string" || t.length > 128)
    return;
  const e = zn(t).replace(Bn, " ").replace(/\s+/g, " ").trim();
  if (!e || e.split(" ").length > Gn)
    return;
  const i = Object.keys(nt).filter((r) => nt[r].test(e)), n = i.filter((r) => r !== "card");
  return n.length === 1 ? n[0] : n.length === 0 && i.length === 1 ? i[0] : void 0;
}
function Ni(t) {
  return typeof t == "string" && Object.prototype.hasOwnProperty.call(nt, t);
}
const qn = "radio", Xn = ["button", "role", "wallet"], Jn = ["label", "aria_label", "test_id", "element_id", "element_name"];
function Qn(t) {
  if (!t)
    return;
  const e = String(t.checked), i = t.type === qn;
  if (!(e === "false" || i && e !== "true" || t.type === "checkbox" || t.element === "link") && !(!i && t.type === void 0 && !Xn.includes(String(t.element))))
    for (const n of Jn) {
      const r = St(t[n]);
      if (r && (i || r !== "card"))
        return r;
    }
}
function Zn(t) {
  if (Ni(t.family))
    return t.family;
  for (const e of Array.isArray(t.names) ? t.names : []) {
    const i = St(e);
    if (i)
      return i;
  }
}
const er = ["paymenttype", "payment_type", "paymentmethod", "payment_method"];
function tr(t) {
  const e = t ? Object.keys(t).find((n) => er.includes(n.toLowerCase())) : void 0, i = e ? t[e] : void 0;
  return typeof i != "string" || !i.trim() ? "absent" : St(i) ?? "other";
}
const Fi = "preselectArrival:", Mi = "preselectTriggerAnyTab:", Tt = "preselectCartAdd:", ir = 30 * 6e4, ae = 30 * 6e4, nr = 10080 * 6e4, rt = ["commit", "wallet", "frame", "checkout_step", "cart"], rr = [
  "triggeredAt",
  "identitySeenAt",
  "firedAt",
  "firedDigest",
  "arrivedAt",
  "nearMissAt",
  "paymentPickAt"
], sr = ["paymentPick", "paymentAtFire"];
function Y(t, e) {
  return `${Fi}${t}:${e}`;
}
function xi(t, e) {
  return `${Mi}${t}:${e}`;
}
function Ve(t) {
  const e = j(A, t, M), i = {};
  if (!I(e))
    return i;
  for (const n of rr)
    typeof e[n] == "number" && (i[n] = e[n]);
  typeof e.intentAt == "number" && rt.includes(e.intentKind) && (i.intentAt = e.intentAt, i.intentKind = e.intentKind);
  for (const n of sr)
    Ni(e[n]) && (i[n] = e[n]);
  return i.firedAt !== void 0 && e.firedByCart === !0 && (i.firedByCart = !0), i;
}
function ee(t, e) {
  return $(A, t, e, M);
}
function de(t) {
  const e = Ve(t);
  return e.arrivedAt === void 0 ? e : {};
}
function or(t, e, i) {
  const n = Y(t, e), r = de(n), s = Date.now();
  ee(n, {
    ...r,
    triggeredAt: r.triggeredAt ?? s,
    ...i ? { identitySeenAt: r.identitySeenAt ?? s } : {}
  }), $(A, xi(t, e), {
    triggeredAt: s
  });
}
function ar(t, e) {
  const i = j(A, xi(t, e));
  if (!I(i) || typeof i.triggeredAt != "number")
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < ir;
}
function cr(t, e, i) {
  const n = `${Tt}${t}`, r = j(A, n), s = I(r) ? r.addedAt ?? r.forgottenAt : void 0;
  typeof s == "number" && e <= s || $(A, n, { addedAt: e, mpid: i });
}
function lr(t, e) {
  const i = `${Tt}${t}`, n = j(A, i);
  if (!I(n))
    return !1;
  const r = typeof n.addedAt == "number" ? n.addedAt : void 0, s = r ?? n.forgottenAt;
  if (typeof s != "number")
    return !1;
  const o = Date.now() - s;
  return o >= 0 && o < nr ? r !== void 0 && e !== null && n.mpid === e : (Z(A, i), !1);
}
function ur(t, e) {
  const i = `${Tt}${t}`;
  e ? $(A, i, { forgottenAt: Date.now() }) : Z(A, i);
}
function dr(t, e) {
  const i = Y(t, e), n = Ve(i);
  n.arrivedAt !== void 0 || n.nearMissAt !== void 0 || ee(i, { ...n, nearMissAt: Date.now() });
}
function fr(t, e, i, n = !1) {
  const r = Y(t, e), s = de(r), o = s.firedAt !== void 0 && st(s.firedAt) ? {
    firedAt: s.firedAt,
    ...s.firedDigest !== void 0 ? { firedDigest: s.firedDigest } : {},
    ...s.firedByCart ? { firedByCart: !0 } : {},
    ...s.paymentAtFire !== void 0 ? { paymentAtFire: s.paymentAtFire } : {}
  } : void 0, a = s.paymentPick !== void 0 && s.paymentPickAt !== void 0 && st(s.paymentPickAt) ? s.paymentPick : void 0;
  return ee(
    r,
    Vi(s, {
      firedAt: o && !(o.firedByCart && !n) ? o.firedAt : Date.now(),
      firedDigest: i,
      ...n ? { firedByCart: !0 } : {},
      paymentAtFire: a
    })
  ), o;
}
function gr(t, e, i, n) {
  const r = Y(t, e), s = de(r);
  s.firedAt === void 0 || s.firedDigest !== n || ee(r, Vi(s, i));
}
function Vi(t, e) {
  const i = { ...t };
  return delete i.firedAt, delete i.firedDigest, delete i.firedByCart, delete i.paymentAtFire, e ? {
    ...i,
    firedAt: e.firedAt,
    ...e.firedDigest !== void 0 ? { firedDigest: e.firedDigest } : {},
    ...e.firedByCart ? { firedByCart: !0 } : {},
    ...e.paymentAtFire !== void 0 ? { paymentAtFire: e.paymentAtFire } : {}
  } : i;
}
function pr(t, e) {
  const i = de(Y(t, e));
  if (i.triggeredAt === void 0)
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < ae;
}
function Lt(t, e, i, n = !1) {
  const r = de(Y(t, e));
  if (r.firedAt === void 0 || n && r.firedByCart || i !== void 0 && r.firedDigest !== void 0 && r.firedDigest !== i)
    return !1;
  const s = Date.now() - r.firedAt;
  return s >= 0 && s < ae;
}
function mr(t, e, i, n) {
  const r = Y(t, e), s = de(r);
  if (s.intentAt !== void 0 && s.intentKind !== void 0 && hr(s.intentAt)) {
    const o = rt.indexOf(s.intentKind), a = rt.indexOf(i);
    if (o < a || o === a && s.intentAt >= n)
      return;
  }
  ee(r, { ...s, intentAt: n, intentKind: i });
}
function st(t) {
  const e = Date.now() - t;
  return e >= 0 && e < ae;
}
function hr(t) {
  return st(t);
}
function _r(t, e, i, n) {
  const r = Y(t, e), s = Ve(r);
  s.arrivedAt !== void 0 || s.paymentPickAt !== void 0 && s.paymentPickAt > n || ee(r, { ...s, paymentPick: i, paymentPickAt: n });
}
function yr(t, e) {
  const i = Y(t, e), n = Ve(i);
  if (n.arrivedAt === void 0 && ee(i, { ...n, arrivedAt: Date.now() }))
    return n;
}
function ei(t) {
  ye(
    A,
    `${Fi}${t}:`,
    M
  ), ye(A, `${Mi}${t}:`);
}
function P(t, e, i = {}) {
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
const ot = /* @__PURE__ */ new Map();
function Er(t, e) {
  if (ot.delete(t), !e)
    return;
  const i = Fn(t, e);
  if ("error" in i)
    return i.error;
  ot.set(t, i.entries);
}
function x(t) {
  return ot.get(t) ?? Rn.filter((e) => e.accountId === t);
}
function se(t, e) {
  const i = S(t), n = S(e);
  if (!i.includes("*"))
    return i === n;
  const r = i.split("/"), s = n.split("/");
  return r.length !== s.length ? !1 : r.every(
    (o, a) => o === "*" ? s[a] !== "" : o === s[a]
  );
}
function S(t) {
  return t.length > 1 && t.endsWith("/") ? t.slice(0, -1) : t;
}
function Ir(t, e) {
  const i = S(t).toLowerCase(), n = S(e).toLowerCase().split("/"), r = i.split("/").length;
  return se(i, n.join("/")) || se(i, ["", ...n.slice(2)].join("/")) || n.length > r && se(i, n.slice(0, r).join("/"));
}
const Hi = {}, Wi = {}, ji = {}, kt = {}, $i = {}, Ar = {}, vr = ["commit", "wallet", "checkout_step", "frame", "cart"], br = ["vendor", "label", "brand", "frame", "submit", "name", "api"], Pr = 512;
function Yi(t) {
  return t === "commit" ? "intent_commit" : t === "checkout_step" ? "intent_checkout_step" : t === "cart" ? "intent_cart" : "intent_wallet";
}
function Bi(t) {
  return t === "intent_commit" ? Wi : t === "intent_checkout_step" ? kt : t === "intent_cart" ? $i : ji;
}
const wr = 1e3;
function at(t) {
  const e = Date.now() - t.t;
  return e >= 0 && e < wr;
}
function He(t) {
  return x(t).filter((e) => e.cartIntent === !0);
}
function We(t) {
  return typeof t.source == "string" && br.includes(t.source) ? t.source : void 0;
}
function Gi(t) {
  return [...new Set(x(t).map((i) => i.targetPageIdentifier))].some((i) => pr(t, i)) ? "left" : "before_entry";
}
function je(t, e, i, n, r = {}, s = !1) {
  const o = `${n}:${i}:${e.kind}${s ? ":wait" : ""}`;
  if (lt.has(o)) return;
  lt.add(o);
  const a = We(e);
  t.logPlacementDiagnostic(
    P("skipped", "intent_observed", {
      intent_kind: e.kind,
      intent_route: i,
      ...a ? { intent_source: a } : {},
      has_email: Se(t, {}),
      has_identity: D(t.filteredUser),
      ...r
    })
  );
}
function Ct(t) {
  const e = R(t.filteredUser), i = t.getCurrentUser?.();
  return e !== null && R(i) === e && i?.isLoggedIn?.() === !0;
}
function ct(t, e, i, n, r, s = !1) {
  const o = e.accountId, a = Gi(o), c = Ct(e), l = (v) => je(e, i, a, r, { logged_in: c, ...v ? { cause: v } : {} }, s), u = i.kind === "cart", d = i.kind === "wallet" && !c && (s || !D(e.filteredUser));
  if (!u && !c && (s || l(), !d))
    return;
  const p = u ? He(o) : x(o).filter((v) => v.cartIntent !== !0);
  if (p.length === 0) return l("cart_entry_only");
  if (p.length !== 1) return l("multiple_entries");
  if (n !== S(window.location.pathname) && !(u && at(i)))
    return l("path_changed");
  const g = p[0];
  if (!D(e.filteredUser))
    return d && !s ? Tr(t, e, i, n, r) : l("no_valid_identity");
  const f = Yi(i.kind), m = `${f}_off_entry`, { collected: y, missingKeys: b } = te(e, Bi(f), g, !1), E = Be(e, o, g.targetPageIdentifier, y);
  if (Lt(o, g.targetPageIdentifier, E, !u))
    return l("active_preselection");
  if (b.length > 0) return l("missing_attribute");
  if (!Se(e, y, g.targetPageIdentifier)) return l("no_strict_email");
  Te(
    e,
    o,
    g.targetPageIdentifier,
    g.targetPageIdentifier,
    y,
    "intent",
    be(m, g),
    !1,
    f,
    !1,
    void 0,
    We(i),
    { route: a, loggedIn: c, requireLogin: !u && !d }
  );
}
function Sr(t, e, i, n) {
  const r = (a) => je(t, e, "entry", n, { cause: a });
  if (!D(t.filteredUser)) return r("no_valid_identity");
  const { collected: s, missingKeys: o } = te(t, kt, i, !1);
  if (o.length > 0) return r("missing_attribute");
  if (!Se(t, s, i.targetPageIdentifier)) return r("no_strict_email");
  Te(
    t,
    t.accountId,
    i.targetPageIdentifier,
    i.targetPageIdentifier,
    s,
    "intent",
    be("intent_checkout_step", i),
    !1,
    "intent_checkout_step",
    !1,
    void 0,
    We(e),
    { route: "entry", loggedIn: Ct(t), requireLogin: !1 }
  );
}
const zi = 2e4;
function Tr(t, e, i, n, r) {
  qi(t);
  const s = () => {
    t.identityWait = void 0;
    const a = e.getCurrentHost?.() ?? e;
    Rt(a) && Xi(a, o);
  }, o = {
    signal: i,
    clickPathname: n,
    visitKey: r,
    route: K[K.length - 1],
    timer: setTimeout(s, Math.max(0, i.t + zi - Date.now()))
  };
  t.identityWait = o;
}
function qi(t) {
  t.identityWait && clearTimeout(t.identityWait.timer), t.identityWait = void 0;
}
function Xi(t, e) {
  const i = Gi(t.accountId), n = { logged_in: Ct(t), cause: "identity_wait_expired" };
  je(t, e.signal, i, e.visitKey, n, !0);
}
function Lr(t, e) {
  const i = t.identityWait;
  if (!i || !D(e.filteredUser) || (qi(t), !Rt(e))) return;
  if (e.logPlacementDiagnostic(
    P("identity_arrived", "pending_identity", {
      intent_kind: i.signal.kind,
      ...Ge(i.signal.t)
    })
  ), K[K.length - 1] !== i.route || i.clickPathname !== S(window.location.pathname) || Date.now() - i.signal.t >= zi) return Xi(e, i);
  ct(t, e, i.signal, i.clickPathname, i.visitKey, !0);
}
function kr(t) {
  const e = t.pathname;
  return typeof e == "string" && e.charAt(0) === "/" && e.length <= Pr ? S(e) : void 0;
}
const pe = /* @__PURE__ */ new Set(), lt = /* @__PURE__ */ new Set(), K = [];
function Ee(t) {
  if (t === Wi) return "intent_commit";
  if (t === ji) return "intent_wallet";
  if (t === kt) return "intent_checkout_step";
  if (t === $i) return "intent_cart";
}
function ve(t) {
  return Ee(t) !== void 0;
}
function Qe(t, e = Date.now()) {
  t = S(t), K[K.length - 1]?.pathname !== t && (K.push({ pathname: t, since: e }), K.length > 8 && K.shift(), lt.clear());
}
function Cr(t, e, i) {
  if (!i || !vr.includes(i.kind) || typeof i.t != "number" || !Number.isFinite(i.t))
    return;
  const n = `${i.kind}:${i.t}${i.adds === !0 ? ":adds" : ""}`;
  if (pe.has(n) || (pe.add(n), pe.size > 4096 && pe.delete(pe.values().next().value), !Rt(e)) || i.kind === "cart" && He(e.accountId).length === 0) return;
  Rr(e.accountId, i);
  const r = R(e.filteredUser);
  i.kind === "cart" && i.adds === !0 && r !== null && Le(e.accountId) && cr(e.accountId, i.t, r);
  const s = [...K].reverse().find((E) => E.since <= i.t), o = kr(i) ?? s?.pathname;
  if (!o) return;
  const a = s && s.pathname === o ? s.since : 0, c = `${o}:${a}`, l = i.kind === "cart", u = i.kind === "commit" || i.kind === "wallet" || l, d = N(e.accountId, o);
  if (!d || (l ? d.cartIntent !== !0 : d.cartIntent === !0)) {
    u && ct(t, e, i, o, c);
    return;
  }
  const p = window.location.pathname, g = o === S(p);
  if (l && !g && at(i)) {
    ct(t, e, i, o, c);
    return;
  }
  const f = i.kind === "checkout_step" && d.checkoutStepIntent === !0;
  if (f && !g && at(i)) {
    Sr(e, i, d, c);
    return;
  }
  if (!(u || f) || !g) {
    je(e, i, "entry", c);
    return;
  }
  t.intentSource = We(i);
  const m = Yi(i.kind), y = t.scheduledDispatch;
  if (y && S(y.pathname) === S(p)) {
    Kt(t), un(t, e, y, "intent_released", m);
    return;
  }
  const b = t.pending.find(
    (E) => S(E.pathname) === S(p)
  );
  if (b) {
    b.intentSeen = m, b.waitingFor === "intent" && (t.pending = t.pending.filter((E) => E !== b), le(
      t,
      e,
      b.event,
      p,
      b.triggeringUserId,
      b.triggeredAt,
      m
    ));
    return;
  }
  le(t, e, Bi(m), p, void 0, i.t);
}
function Rt(t) {
  return !t.isTargetingDisabled?.() && t.isForwardingAllowed?.() !== !1 && ie(t) && t.isKitReady() && t.isPreselectionEnabled() && me(t.accountId);
}
function Rr(t, e) {
  const i = e.kind === "cart" ? He(t) : x(t);
  new Set(i.map((r) => r.targetPageIdentifier)).forEach((r) => mr(t, r, e.kind, e.t));
}
function ce(t) {
  return t === Hi;
}
const $e = 4, Dr = ["Auto Button Click", "Auto Link Click"], Or = ["is_auto_button_click", "is_auto_link_click"];
function Ue(t) {
  return t.EventDataType === $e && Dr.includes(t.EventName ?? "") || Or.some((e) => String(t.EventAttributes?.[e]) === "true");
}
function Ji(t) {
  const e = t.accountId;
  if (!(!e || !me(e) || t.isTargetingDisabled?.() || t.isForwardingAllowed?.() === !1 || !ie(t) || !t.isKitReady() || !t.isPreselectionEnabled()))
    return e;
}
function Qi(t, e) {
  if (!e) return;
  const i = new Set(x(t).map((r) => r.targetPageIdentifier)), n = Date.now();
  i.forEach((r) => _r(t, r, e, n));
}
function Kr(t, e) {
  const i = Ue(e) ? Ji(t) : void 0;
  i && Qi(i, Qn(e.EventAttributes));
}
function Ur(t, e) {
  const i = Ji(t);
  i && Qi(i, Zn(e));
}
function oe(t, e) {
  return e.EventDataType === $e && h(e.EventName) && !Ue(e) && (t.triggerEventNames ?? []).includes(e.EventName);
}
const Zi = "rokt.preselecttrigger", Ne = "preselectFormEmail", ut = "preselectBoundUser";
function be(t, e) {
  return `${t}|${e.pathname}`;
}
function N(t, e) {
  if (t)
    return x(t).find((i) => se(i.pathname, e));
}
function Ie(t, e) {
  if (!(!t || !h(e)))
    return x(t).find((i) => i.targetPageIdentifier === e);
}
function dt(t, e) {
  if (!e)
    return t;
  const i = new Set(Object.keys(e).map((r) => r.toLowerCase())), n = {};
  for (const [r, s] of Object.entries(t))
    i.has(r.toLowerCase()) || (n[r] = s);
  return { ...n, ...e };
}
function Dt(t) {
  return t.getPreselectVariant?.() === "widened";
}
const Nr = /iP(hone|od|ad)|Android|BlackBerry|BB10|IEMobile|Kindle/, Fr = /Win(dows|16|95|98|CE)|Pocket Internet Explorer|OpenBSD|SunOS|CrOS|Linux|X11|Mac_PowerPC|Macintosh|QNX|BeOS|OS\/2/;
function Mr(t) {
  return Nr.test(t) ? "MobileWeb" : Fr.test(t) ? "DesktopWeb" : void 0;
}
function en(t) {
  if (h(t))
    return t;
  const e = Mr(navigator.userAgent), i = e ? t.byClientType?.[e] : void 0;
  return i === Cn ? void 0 : (t.byHostname ? L(t.byHostname, window.location.hostname) : void 0) ?? i ?? t.value;
}
function Ze(t) {
  return new Set(
    Object.keys(t).filter((e) => !T(t[e])).map((e) => e.toLowerCase())
  );
}
function Ye(t, e, i) {
  const n = e.preselectAttributeDefaults;
  if (!n || Dt(t))
    return {};
  const r = /* @__PURE__ */ new Set([...Ze(t.getUserIdentities?.() ?? {}), ...Ze(i)]), s = Ze(t.userAttributes ?? {}), o = {};
  for (const a of Object.keys(n)) {
    const c = a.toLowerCase();
    if (we(a, t.mappedEmailSha256Key) || r.has(c) || s.has(c) && !tn(t, e, a))
      continue;
    const l = en(n[a]);
    l !== void 0 && (o[a] = l);
  }
  return o;
}
function tn(t, e, i) {
  const n = L(e.preselectAttributeDefaults ?? {}, i);
  return I(n) && n.skipRemembered === !0 && !Dt(t) && !we(i, t.mappedEmailSha256Key) && en(n) !== void 0;
}
function Ot(t) {
  const e = t.getPreselectVariant?.();
  return e === "widened" || e === "standard" ? { variant: e } : {};
}
function nn(t) {
  const e = Object.keys(t.preselectAttributeDefaults ?? {});
  return [...t.attributeKeys, ...e.filter((i) => !t.attributeKeys.includes(i))];
}
function me(t) {
  return t ? x(t).length > 0 : !1;
}
function xr(t, e, i = window.location.pathname) {
  if (t.pending.some((r) => r.pathname === i && !ce(r.event)))
    return;
  const n = t.scheduledDispatch;
  n && n.pathname === i && !ce(n.event) || le(t, e, Hi, i);
}
function Vr(t, e) {
  return !t || !h(e) ? !1 : x(t).some((i) => (i.triggerEventNames ?? []).includes(e));
}
function Fe(t) {
  return !ce(t) && !ve(t) && t.EventDataType !== $e;
}
function Hr(t, e) {
  const i = t.scheduledDispatch;
  return i && i.pathname === e && Fe(i.event) ? !0 : t.pending.some((n) => n.pathname === e && Fe(n.event));
}
function Wr(t, e, i, n) {
  if (!t.isKitReady() || !t.isPreselectionEnabled() || !Mt(t, i))
    return "waits";
  const { collected: r, missingKeys: s } = te(t, e, i);
  if (s.length > 0)
    return "waits";
  const o = t.accountId || "", a = re(bt(o, S(n)));
  if (!a)
    return "now";
  const c = Be(t, o, i.targetPageIdentifier, r);
  return a.byEvent || c !== void 0 && c === a.attributesDigest ? "skipped" : "now";
}
function jr(t, e, i) {
  t.pending = t.pending.filter((r) => r.pathname !== i);
  const n = e.accountId ? wt(e.accountId) : null;
  e.accountId && n && n.pathname === i && Q(e.accountId);
}
function $r(t, e, i, n = window.location.pathname) {
  const r = N(e.accountId, n);
  if (!r || !oe(r, i))
    return;
  const s = Wr(e, i, r, n);
  if (s === "now")
    jr(t, e, n);
  else if (Hr(t, n) || s === "skipped" && t.scheduledDispatch?.pathname === n)
    return;
  le(t, e, i, n);
}
function Yr(t, e) {
  return t ? x(t).some((i) => i.attributeKeys.includes(e)) : !1;
}
function Br() {
  return { pending: [] };
}
function Kt(t) {
  if (t.dispatchTimer === void 0)
    return;
  const e = t.scheduledDispatch;
  return clearTimeout(t.dispatchTimer), t.dispatchTimer = void 0, t.scheduledDispatch = void 0, e;
}
function Gr(t, e) {
  return t === void 0 ? e : e === void 0 ? t : Math.min(t, e);
}
function ti(t) {
  return ce(t) ? 0 : ve(t) || t.EventDataType === $e ? 2 : 1;
}
function zr(t, e) {
  const i = N(t.accountId, e.pathname);
  return !!i && te(t, e.event, i).missingKeys.length > 0;
}
function rn(t, e, i, n) {
  const r = t.pending.find((s) => s.pathname === n);
  return !!r && ti(i) < ti(r.event) && !(Fe(i) && zr(e, r));
}
function z(t, e, i) {
  const n = t.pending.findIndex((r) => r.pathname === i.pathname);
  if (n >= 0) {
    if (rn(t, e, i.event, i.pathname))
      return;
    const r = t.pending[n];
    t.pending[n] = {
      ...i,
      triggeredAt: Gr(r.triggeredAt, i.triggeredAt),
      intentSeen: i.intentSeen ?? r.intentSeen ?? Ee(r.event)
    };
    return;
  }
  t.pending.push(i);
}
function Ae(t) {
  if (!t?.getUserIdentities)
    return [];
  const e = t.getUserIdentities().userIdentities;
  return e ? Object.keys(e).filter((i) => {
    const n = e[i];
    return h(n) && n.length > 0;
  }).sort() : [];
}
function D(t) {
  return Ae(t).length > 0;
}
const ft = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, gt = /* @__PURE__ */ new WeakSet(), pt = /* @__PURE__ */ new WeakSet(), ii = /* @__PURE__ */ new WeakSet();
function Ut(t) {
  if (!(t instanceof HTMLInputElement)) return !1;
  const e = t.type;
  return e === "text" || e === "email" || t.getAttribute("autocomplete") === "email" && e !== "hidden" && e !== "password";
}
function mt(t) {
  const e = t.target;
  if (!(e instanceof HTMLInputElement)) return;
  const i = !ii.has(t);
  if (ii.add(t), t.isTrusted !== !0 ? pt.add(e) : i && pt.delete(e), t.isTrusted === !0 && Ut(e)) {
    if (!i) return;
    gt.add(e), e.addEventListener("input", mt, !0), e.addEventListener("change", mt, !0);
  } else
    gt.delete(e);
}
function qr(t) {
  return Ut(t) && (t.type === "email" || t.getAttribute("autocomplete") === "email" || ft.test(t.value.trim()));
}
function Pe(t) {
  return t.attributeKeys.find((e) => e.toLowerCase() === "email");
}
const Xr = 254;
function sn(t) {
  const e = /* @__PURE__ */ new Map();
  let i;
  return document.querySelectorAll("input").forEach((n) => {
    const r = gt.has(n);
    if (!r && !t || !Ut(n)) return;
    const s = n.value.trim();
    r ? ft.test(s) && !e.has(s.toLowerCase()) && e.set(s.toLowerCase(), s) : i !== "untrusted_fill" && s.length <= Xr && ft.test(s) && (i = pt.has(n) ? "untrusted_fill" : "unseen_fill");
  }), { emails: e, unfilled: i };
}
function Jr() {
  const { emails: t } = sn(!1);
  return t.size === 1 ? t.values().next().value : void 0;
}
function Nt(t, e, i = {}) {
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
    (o) => Object.keys(o).some((a) => n.has(a.toLowerCase()) && !T(L(o, a)))
  );
}
const Qr = ["email", "emailsha256"];
function we(t, e) {
  const i = t.toLowerCase();
  return Qr.includes(i) || h(e) && i === e.toLowerCase();
}
function Se(t, e, i) {
  return t.getOutgoingAttributes ? Ce(t.getOutgoingAttributes(e, i), t.mappedEmailSha256Key) : Ce(e, t.mappedEmailSha256Key) || Ce(t.getUserIdentities?.() ?? {}, t.mappedEmailSha256Key);
}
function Ce(t, e) {
  return Object.keys(t).some(
    (i) => we(i, e) && !T(L(t, i))
  );
}
function Ft(t, e, i, n = {}) {
  return e.readEmailInput !== !0 ? "read_disabled" : se(e.pathname, window.location.pathname) ? t.isForwardingAllowed?.() !== !0 || t.isPreselectionPrivacyAllowed?.() === !1 || t.isTargetingDisabled?.() === !0 ? "privacy_blocked" : t.isEmailIdentityFiltered?.() === !0 ? "email_filtered" : Nt(t, i, n) ? "partner_email" : void 0 : "off_route";
}
function Zr(t, e, i, n) {
  const r = Ft(t, e, i, n.EventAttributes ?? {});
  if (r) return r;
  const { emails: s, unfilled: o } = sn(!0);
  return s.size > 1 ? "multiple_emails" : o ?? "no_field";
}
function es(t, e, i) {
  const n = window.location.pathname, r = N(e.accountId, n), s = r && Pe(r);
  return !!s && t.pending.some(
    (o) => o.pathname === n && !Ft(e, r, s, o.event.EventAttributes ?? {})
  ) && i.isTrusted === !0 && qr(i.target);
}
function on(t, e, i, n) {
  const r = Pe(e);
  if (!r || !T(L(i, r)) || Ft(t, e, r, n.EventAttributes ?? {}))
    return;
  const s = Jr();
  if (s)
    return i[r] = s, r;
}
function Mt(t, e) {
  const i = Pe(e);
  return D(t.filteredUser) || e.readEmailInput === !0 && !!i && xt(t, e, {}).includes(i);
}
function ts(t) {
  return !!t && x(t).some((e) => e.readEmailInput === !0);
}
function Me(t) {
  return t.length > 0 ? t.join(",") : "none";
}
function R(t) {
  const e = t?.getMPID?.();
  return e == null ? null : String(e);
}
function an(t, e) {
  const i = Ae(t.filteredUser), n = t.getCurrentUser?.(), r = Ae(n), s = R(t.filteredUser), o = R(n), a = [...e.identityKeys ?? [], "email", "emailsha256"];
  t.mappedEmailSha256Key && a.push(t.mappedEmailSha256Key);
  const c = new Set(a.map((p) => p.toLowerCase())), l = n?.getAllUserAttributes?.() ?? {}, u = [t.userAttributes, l].some(
    (p) => Object.entries(p).some(
      ([g, f]) => c.has(g.toLowerCase()) && h(f) && f.length > 0
    )
  );
  let d = "no_identities";
  return t.filteredUser ? o !== null && s !== o ? d = "mpid_mismatch" : r.length > 0 && (d = "kit_user_lacks_identities") : d = "no_filtered_user", {
    identity_reason: d,
    kit_identity_types: Me(i),
    current_identity_types: Me(r),
    mpid_match: o === null ? "unknown" : s === o,
    identity_attribute_present: u
  };
}
function xt(t, e, i) {
  const n = Dt(t) ? e.widenedOptionalAttributeKeys ?? [] : [], r = new Set(
    [...e.optionalAttributeKeys ?? [], ...n].map((o) => o.toLowerCase())
  ), s = Ye(t, e, i);
  return e.attributeKeys.filter(
    (o) => !r.has(o.toLowerCase()) && T(L(i, o)) && L(s, o) === void 0
  );
}
function te(t, e, i, n = !0) {
  const r = t.filteredUser?.getAllUserAttributes?.() || {}, s = new Set(i.identityKeys ?? []);
  let o;
  const a = {};
  for (const u of i.attributeKeys) {
    const d = t.getEventAttributeValue(e, u), p = L(t.userAttributes, u);
    let g = !T(d) || tn(t, i, u) ? d : T(p) ? L(r, u) : p;
    if (T(g) && s.has(u)) {
      o || (o = t.getUserIdentities?.() ?? {});
      const f = L(o, u);
      g = h(f) && f !== "" ? f : void 0;
    }
    T(g) || (a[u] = g);
  }
  const c = e.EventAttributes ?? {};
  for (const u of Object.keys(i.preselectAttributeDefaults ?? {})) {
    if (!T(t.getEventAttributeValue(e, u)))
      continue;
    const d = Object.keys(c).find(
      (p) => p.toLowerCase() === u.toLowerCase() && !T(c[p])
    );
    d !== void 0 && (a[d] = c[d]);
  }
  const l = n ? on(t, i, a, e) : void 0;
  return {
    collected: a,
    missingKeys: xt(t, i, a),
    formEmailKey: l
  };
}
const cn = /* @__PURE__ */ new WeakMap();
function is(t) {
  return cn.get(t);
}
function ns(t, e, i) {
  i && cn.set(e, i);
  const n = (s) => {
    i?.();
    const o = e[Ne] ? "redacted" : s instanceof Error ? s.message : String(s);
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
const ni = /* @__PURE__ */ new Map(), ri = /* @__PURE__ */ new Map();
function si(t, e, i) {
  const n = t.get(e), r = { previous: i, earlier: n };
  return n && (n.later = r), t.set(e, r), r;
}
function oi(t, e, i, n) {
  const { earlier: r, later: s } = i;
  if (s) {
    s.previous = i.previous, s.earlier = r, r && (r.later = s);
    return;
  }
  n(i.previous), r && (r.later = void 0), t.get(e) === i && (r ? t.set(e, r) : t.delete(e));
}
function Be(t, e, i, n) {
  try {
    const r = Ie(e, i), s = r ? dt(n, Ye(t, r, n)) : n, o = t.getOutgoingAttributes ? t.getOutgoingAttributes(n, i) : { ...t.getUserIdentities?.() ?? {}, ...s }, a = Object.keys(o).sort().filter((f) => we(f, t.mappedEmailSha256Key) && !T(L(o, f))).map((f) => [f, L(o, f)]), c = Object.keys(r?.preselectAttributeDefaults ?? {}), l = (f) => c.some((m) => m.toLowerCase() === f.toLowerCase()), u = {};
    for (const [f, m] of Object.entries(s))
      l(f) || (u[f] = m);
    for (const f of c) {
      const m = Object.keys(o).filter((y) => y.toLowerCase() === f.toLowerCase() && !T(o[y])).sort().map((y) => [y, o[y]]);
      m.length > 0 && (u[f] = m);
    }
    const d = JSON.stringify(u), p = [.../* @__PURE__ */ new Set([...r?.attributeKeys ?? [], ...Object.keys(s)])].filter((f) => !l(f)).sort().filter((f) => {
      const m = L(o, f);
      return m !== void 0 && m !== L(s, f);
    }).map((f) => [f, L(o, f)]), g = a.length > 0 ? `${d}|${JSON.stringify(a)}` : d;
    return It(p.length > 0 ? `${g}>${JSON.stringify(p)}` : g);
  } catch {
    return;
  }
}
function Vt(t) {
  return !t.isTargetingDisabled?.() && t.isPreselectionPrivacyAllowed?.() !== !1 && t.isForwardingAllowed?.() !== !1;
}
function Te(t, e, i, n, r, s, o, a = !1, c, l = a, u, d, p) {
  if (!Vt(t))
    return !1;
  const g = bt(e, i), f = Be(t, e, n, r), m = c ? { intent_kind: c.replace("intent_", "") } : {};
  if (c && Lt(e, n, f, c !== "intent_cart"))
    return t.logPlacementDiagnostic(P("skipped", "active_preselection", m)), !0;
  if (a && re(g)?.byEvent)
    return t.logPlacementDiagnostic(P("skipped", "active_preselection")), !1;
  const y = f !== void 0 ? re(g) : null;
  if (f !== void 0) {
    if (y?.attributesDigest === f)
      return t.logPlacementDiagnostic(P("skipped", "active_preselection", m)), !0;
    Vn(
      g,
      f,
      l || !!c && re(g)?.byEvent === !0
    );
  }
  const b = Ie(e, n), E = b ? Ye(t, b, r) : {}, v = t.getOutgoingAttributes?.(r, n), w = Object.keys(E).filter((V) => !v || L(v, V) === E[V]);
  t.logPlacementDiagnostic(
    P("fired", s, {
      identity_types: Me(Ae(t.filteredUser)),
      ...u ? { email_source: "input" } : {},
      ...c ? {
        ...m,
        intent_route: p ? p.route : "entry",
        ...d ? { intent_source: d } : {},
        ...p ? { logged_in: p.loggedIn } : {}
      } : {},
      ...Ot(t),
      ...w.length > 0 ? { defaulted_keys: w.join(",") } : {}
    })
  );
  const O = `${e}:${n}`, k = si(
    ni,
    O,
    fr(e, n, f, c === "intent_cart")
  ), H = f !== void 0 ? si(ri, g, y) : void 0;
  let C = !1;
  const W = () => {
    C || (C = !0, H && oi(
      ri,
      g,
      H,
      (V) => Hn(g, V, f)
    ), oi(
      ni,
      O,
      k,
      (V) => gr(e, n, V, f)
    ));
  };
  return ns(t, {
    attributes: { ...r, [Zi]: o },
    preselect: !0,
    identifier: n,
    omitUrl: !0,
    ...u ? { [Ne]: { key: u, mpid: R(t.filteredUser) } } : {},
    ...p ? { [ut]: { mpid: R(t.filteredUser), requireLogin: p.requireLogin } } : {}
  }, W), !0;
}
function rs(t, e) {
  if (!e.accountId || !e.isKitReady())
    return;
  const i = wt(e.accountId);
  if (!i)
    return;
  if (t.pending.some((o) => o.pathname === i.pathname)) {
    Q(e.accountId);
    return;
  }
  if (!e.isPreselectionEnabled()) {
    Q(e.accountId);
    return;
  }
  if (!D(e.filteredUser) || (Q(e.accountId), R(e.filteredUser) !== i.mpid))
    return;
  const n = N(e.accountId, i.pathname);
  if (!n || n.targetPageIdentifier !== i.identifier)
    return;
  if (!i.byEvent && ie(e)) {
    e.logPlacementDiagnostic(P("missed", "recovery_awaits_intent"));
    return;
  }
  const r = J(i.attributes), s = xt(e, n, r);
  if (s.length > 0) {
    for (const o of s)
      e.logPlacementDiagnostic(
        P("missed", `missing_persisted_attribute:${o}`, Ot(e))
      );
    return;
  }
  Te(
    e,
    e.accountId,
    i.identifier,
    i.identifier,
    r,
    "recovered",
    be("recovered", n)
  );
}
function Ht(t) {
  return !t.isTargetingDisabled?.() && t.isPreselectionPrivacyAllowed?.() !== !1 && t.isKitReady() && t.isPreselectionEnabled();
}
function Ge(t) {
  return t === void 0 ? {} : { since_trigger_ms: Date.now() - t };
}
function ln(t, e, i) {
  if (e.waitingFor !== "intent" || e.intentSeen)
    return !1;
  const n = N(t.accountId, e.pathname);
  return !!n && n === N(t.accountId, i);
}
function ht(t, e) {
  Ht(t) && t.logPlacementDiagnostic(
    P("missed", "left_trigger_path", {
      waiting_for: e.waitingFor,
      has_identity: D(t.filteredUser),
      ...Ge(e.triggeredAt)
    })
  );
}
function le(t, e, i, n = window.location.pathname, r, s = Date.now(), o) {
  const a = t.pending.filter((u) => u.pathname !== n);
  if (a.length > 0) {
    const u = e.accountId ? wt(e.accountId) : null;
    e.accountId && u && a.some((d) => d.pathname === u.pathname) && Q(e.accountId), a.forEach((d) => {
      ln(e, d, n) ? t.intentWaitMovedWithin = N(e.accountId, n) : ht(e, d);
    }), t.pending = t.pending.filter((d) => d.pathname === n);
  }
  const c = Kt(t), l = c !== void 0 && c.pathname === n && ce(c.event);
  if (c && !l) {
    const u = N(e.accountId, c.pathname);
    S(c.pathname) !== S(n) && u?.releaseHoldOnRouteChange ? (un(t, e, c, "hold_released_on_route_change"), t.pending = t.pending.filter((d) => d.pathname === c.pathname ? (ht(e, d), !1) : !0)) : ai(e, c, n);
  }
  ss(t, e, i, n, r, s, l, o), l && t.scheduledDispatch === void 0 && ai(e, c, n);
}
function ai(t, e, i) {
  t.logPlacementDiagnostic(
    P("missed", "hold_cancelled", {
      held_ms: Date.now() - e.heldAt,
      same_path: e.pathname === i
    })
  );
}
function ss(t, e, i, n, r, s, o, a) {
  const c = t.pending.find((u) => S(u.pathname) === S(n));
  if (a ?? (a = Ee(i) ?? c?.intentSeen ?? Ee(c?.event)), e.isTargetingDisabled?.() || e.isPreselectionPrivacyAllowed?.() === !1)
    return;
  const l = N(e.accountId, n);
  if (!l) {
    os(e, n);
    return;
  }
  if (!(r !== void 0 && R(e.filteredUser) !== r)) {
    if (!a && !oe(l, i) && ie(e)) {
      const u = t.intentWaitMovedWithin === l;
      t.intentWaitMovedWithin = void 0;
      const d = u || c?.waitingFor === "intent" && c.awaitingIntentLogged === !0, p = e.isKitReady() && e.isPreselectionEnabled();
      z(t, e, {
        event: i,
        pathname: n,
        // Bound to an identified shopper, as a timer hold is, so another user's click never sends
        // this page view's attributes. A guest stays unbound so signing in at checkout still fires.
        triggeringUserId: r ?? (D(e.filteredUser) ? R(e.filteredUser) : void 0),
        triggeredAt: s,
        waitingFor: "intent",
        awaitingIntentLogged: d || p
      }), !d && p && e.logPlacementDiagnostic(P("held", "awaiting_intent")), p && _t(e, l, i);
      return;
    }
    if (!e.isKitReady()) {
      if (rn(t, e, i, n))
        return;
      const u = [], d = R(e.filteredUser);
      if (e.accountId && d && D(e.filteredUser)) {
        const { collected: p, missingKeys: g, formEmailKey: f } = te(e, i, l);
        if (g.length === 0 && !f) {
          const m = J(p);
          (oe(l, i) || !!a ? Zt(
            e.accountId,
            n,
            l.targetPageIdentifier,
            m,
            d,
            !0
          ) : Zt(e.accountId, n, l.targetPageIdentifier, m, d)) || u.push(P("queued", "persist_failed"));
        }
      }
      z(t, e, {
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
      if (_t(e, l, i), !Mt(e, l)) {
        e.logPlacementDiagnostic(
          P("missed", "no_valid_identity", an(e, l))
        ), z(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "identity" });
        return;
      }
      if (l.dispatchDelayMs !== void 0 && !oe(l, i) && !ve(i) && !a) {
        const u = R(e.filteredUser), d = Math.min(
          l.dispatchDelayMs,
          Math.max(0, s + l.dispatchDelayMs - Date.now())
        );
        t.scheduledDispatch = { event: i, pathname: n, heldAt: Date.now(), heldForUserId: u, triggeredAt: s }, o || e.logPlacementDiagnostic(P("held", "dispatch_delay", { delay_ms: d })), t.dispatchTimer = setTimeout(() => {
          t.dispatchTimer = void 0, t.scheduledDispatch = void 0, dn(t, e.getCurrentHost?.() ?? e, i, n, u, s);
        }, d);
        return;
      }
      fn(
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
function _t(t, e, i) {
  if (!t.accountId) return;
  const n = Pe(e), r = e.readEmailInput === !0 && !!n && (Nt(t, n, i.EventAttributes ?? {}) || on(t, e, {}, i) !== void 0);
  or(
    t.accountId,
    e.targetPageIdentifier,
    D(t.filteredUser) || r
  );
}
function os(t, e) {
  const i = t.accountId;
  !i || t.isKitReady() && !t.isPreselectionEnabled() || x(i).forEach((n) => {
    Ir(n.pathname, e) && dr(i, n.targetPageIdentifier);
  });
}
function as(t) {
  const e = K[K.length - 1];
  return t !== void 0 && (e === void 0 || t < e.since);
}
function cs() {
  try {
    return new URL(document.referrer).origin === window.location.origin ? "same_origin" : "other_origin";
  } catch {
    return "none";
  }
}
function ie(t) {
  return t.isCheckoutIntentActive?.() === !0 && t.isPreselectionPrivacyAllowed?.() !== !1;
}
function un(t, e, i, n, r) {
  dn(
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
function dn(t, e, i, n, r, s, o, a) {
  const c = N(e.accountId, n);
  if (!(!c || e.isTargetingDisabled?.() || e.isPreselectionPrivacyAllowed?.() === !1)) {
    if (!a && !oe(c, i) && !ve(i) && ie(e)) {
      const l = e.isKitReady() && e.isPreselectionEnabled();
      z(t, e, {
        event: i,
        pathname: n,
        triggeringUserId: r,
        triggeredAt: s,
        waitingFor: "intent",
        awaitingIntentLogged: l
      }), l && e.logPlacementDiagnostic(P("held", "awaiting_intent"));
      return;
    }
    if (!e.isKitReady()) {
      z(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "launcher" });
      return;
    }
    if (e.isPreselectionEnabled()) {
      if (!Mt(e, c)) {
        e.logPlacementDiagnostic(
          P("missed", "no_valid_identity", an(e, c))
        ), z(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "identity" });
        return;
      }
      R(e.filteredUser) === r && fn(t, e, i, n, c, r, s, o, a);
    }
  }
}
function fn(t, e, i, n, r, s, o, a, c, l) {
  if (e.isPreselectionPrivacyAllowed?.() === !1) return;
  const { collected: u, missingKeys: d, formEmailKey: p } = te(e, i, r), g = t.lastResolvedPageView, f = K[K.length - 1], m = S(n);
  if (ve(i) && g && g.accountId === e.accountId && g.pathname === m && g.route === f && g.userId === R(e.filteredUser) && g.identifier === r.targetPageIdentifier && g.attributeKeys.some(
    (w) => r.attributeKeys.includes(w) && T(L(u, w))
  ))
    return;
  if (d.length > 0) {
    const w = Ae(e.filteredUser), O = Pe(r);
    for (const k of d)
      e.logPlacementDiagnostic(
        P("missed", `missing_attribute:${k}`, {
          identity_types: Me(w),
          key_is_identity: w.some((H) => H.toLowerCase() === k.toLowerCase()),
          ...k === O ? { email_reason: Zr(e, r, k, i) } : {},
          ...Ot(e)
        })
      );
    z(t, e, {
      event: i,
      pathname: n,
      triggeringUserId: s,
      triggeredAt: o,
      intentSeen: c,
      waitingFor: "attribute"
    });
    return;
  }
  const y = c ?? Ee(i);
  if (y && !Se(e, u, r.targetPageIdentifier)) {
    t.noEmailLoggedPathname !== m && (t.noEmailLoggedPathname = m, e.logPlacementDiagnostic(
      P("missed", "no_strict_email", {
        intent_kind: y.replace("intent_", ""),
        has_identity: D(e.filteredUser)
      })
    )), z(t, e, {
      event: i,
      pathname: n,
      triggeringUserId: s,
      triggeredAt: o,
      intentSeen: y,
      waitingFor: "attribute"
    });
    return;
  }
  t.noEmailLoggedPathname = void 0, l && (t.pending = t.pending.filter((w) => w !== l));
  const b = oe(r, i), E = y ?? (b ? "event" : ce(i) ? "pathname" : "pageview");
  Te(
    e,
    e.accountId || "",
    S(n),
    r.targetPageIdentifier,
    u,
    a ?? (y ? "intent" : b ? "event_trigger" : "fired"),
    be(E, r),
    b && !y,
    y,
    b,
    p,
    y ? t.intentSource : void 0
  ) && (Fe(i) || b) && (t.lastResolvedPageView = {
    accountId: e.accountId,
    pathname: m,
    route: f,
    userId: R(e.filteredUser),
    identifier: r.targetPageIdentifier,
    attributeKeys: Object.keys(u)
  });
}
const ls = ["", "0", "[]", "{}", "false", "null"];
function us(t) {
  if (T(t)) return !1;
  if (Array.isArray(t)) return !0;
  const e = String(t).trim();
  if (ls.includes(e.toLowerCase())) return !1;
  try {
    const i = JSON.parse(e);
    return !Array.isArray(i) || i.length > 0;
  } catch {
    return !0;
  }
}
function Le(t) {
  const e = t ? He(t) : [];
  return e.length === 1 && e[0].cartUserAttribute ? e[0] : void 0;
}
function ds(t) {
  return Le(t) !== void 0;
}
function ci(t, e) {
  const i = Le(t)?.cartUserAttribute;
  return h(i) && i.toLowerCase() === e.toLowerCase();
}
function li(t, e, i) {
  const n = Le(t)?.cartUserAttribute?.toLowerCase();
  if (!n || i && nn(i).some((s) => s.toLowerCase() === n))
    return e;
  const r = {};
  for (const [s, o] of Object.entries(e))
    s.toLowerCase() !== n && (r[s] = o);
  return r;
}
function fs(t, e) {
  const i = t.filteredUser?.getAllUserAttributes?.() ?? {}, n = Object.keys(i).find((r) => r.toLowerCase() === e.toLowerCase());
  return n === void 0 ? void 0 : i[n];
}
function ui(t, e, i = window.location.pathname) {
  t.cartPageViewPathname = S(i), gn(t, e, i);
}
function gn(t, e, i) {
  const n = Le(e.accountId);
  if (!n || t.cartPageViewPathname !== S(i) || se(n.pathname, i) || !Vt(e)) {
    t.cartPageViewPathname = void 0;
    return;
  }
  if (!e.isKitReady()) return;
  if (!e.isPreselectionEnabled()) {
    t.cartPageViewPathname = void 0;
    return;
  }
  const r = e.accountId;
  if (!(us(fs(e, n.cartUserAttribute)) || lr(r, R(e.filteredUser))) || !D(e.filteredUser)) return;
  const { collected: o, missingKeys: a } = te(e, Ar, n, !1);
  if (a.length > 0 || !Se(e, o, n.targetPageIdentifier)) return;
  t.cartPageViewPathname = void 0;
  const c = Be(e, r, n.targetPageIdentifier, o), l = re(bt(r, n.targetPageIdentifier));
  Lt(r, n.targetPageIdentifier, c) || c !== void 0 && l?.attributesDigest === c || Te(
    e,
    r,
    n.targetPageIdentifier,
    n.targetPageIdentifier,
    o,
    "fired",
    be("pageview_cart", n),
    !1,
    void 0,
    !1,
    void 0,
    void 0,
    { requireLogin: !1 }
  );
}
function gs(t, e, i = window.location.pathname) {
  if (rs(t, e), Lr(t, e), t.cartPageViewPathname !== void 0 && gn(t, e, i), t.pending.length === 0)
    return;
  const n = t.pending;
  t.pending = [], n.forEach((r) => {
    const { event: s, pathname: o, storedDiagnostics: a, triggeringUserId: c, triggeredAt: l, waitingFor: u, intentSeen: d } = r, p = Ht(e), g = D(e.filteredUser), f = Ge(l);
    if (p && u === "identity" && g && e.logPlacementDiagnostic(
      P("identity_arrived", "pending_identity", {
        ...f,
        on_trigger_path: o === i
      })
    ), o !== i) {
      ln(e, r, i) ? t.intentWaitMovedWithin = N(e.accountId, i) : ht(e, { waitingFor: u, triggeredAt: l });
      return;
    }
    if (u === "intent" && !d) {
      const m = N(e.accountId, o);
      if (m && ie(e)) {
        !r.awaitingIntentLogged && e.isKitReady() && e.isPreselectionEnabled() && (e.logPlacementDiagnostic(P("held", "awaiting_intent")), _t(e, m, s), r.awaitingIntentLogged = !0), t.pending.push(r);
        return;
      }
    }
    p && a?.forEach((m) => e.logPlacementDiagnostic(m)), t.scheduledDispatch?.pathname !== o && le(t, e, s, o, c, l, d);
  });
}
function ps(t, e, i) {
  if (!t.accountId || !Ht(t))
    return;
  const n = Ie(t.accountId, e);
  if (!n)
    return;
  const r = yr(t.accountId, n.targetPageIdentifier);
  if (!r || (ie(t) && t.isForwardingAllowed?.() !== !1 && t.logPlacementDiagnostic(
    P("arrived", "intent_arrival", {
      ...ms(r),
      ...hs(r, i)
    })
  ), r.firedAt !== void 0))
    return;
  const s = r.triggeredAt !== void 0;
  t.logPlacementDiagnostic(
    P("missed", "arrival_without_fire", {
      trigger_seen: s,
      identity_seen_on_trigger_path: r.identitySeenAt !== void 0,
      has_identity: D(t.filteredUser),
      // Another tab's checkout caches its offers in that tab, so this arrival still misses. This tab's
      // own trigger counts too: the device marker can expire, be cleared by another tab or fail to save.
      trigger_seen_any_tab: s || ar(t.accountId, n.targetPageIdentifier),
      ...Ge(r.triggeredAt),
      near_miss_seen: as(r.nearMissAt),
      // Page memory loses the trigger record on a full navigation, so trigger_seen reads false.
      storage: An() ? "page" : "device",
      referrer: cs()
    })
  );
}
function ms(t) {
  const e = t.intentAt === void 0 || t.intentKind === void 0 ? "none" : ys(Date.now() - t.intentAt);
  return {
    intent_seen: e === "none" ? "none" : t.intentKind,
    lead: e,
    fired: t.firedAt !== void 0
  };
}
function hs(t, e) {
  const i = tr(e), n = t.paymentPickAt === void 0 ? -1 : Date.now() - t.paymentPickAt, r = t.paymentPick && n >= 0 && n < ae ? t.paymentPick : "none";
  if (r === "none" && i === "absent")
    return {};
  const s = t.firedAt === void 0 ? -1 : Date.now() - t.firedAt, o = t.paymentAtFire && s >= 0 && s < ae ? t.paymentAtFire : "none";
  return {
    payment_guess: o,
    payment_pick: r,
    payment_arrival: i,
    payment_match: o !== "none" && i !== "absent" && i !== "other" ? o === i : "n/a"
  };
}
const _s = [
  [1e3, "lt1s"],
  [2e3, "1s_2s"],
  [5e3, "2s_5s"],
  [1e4, "5s_10s"],
  [2e4, "10s_20s"],
  [6e4, "20s_60s"],
  [3e5, "60s_300s"],
  [ae, "300s_1800s"]
];
function ys(t) {
  if (t < 0)
    return "none";
  const e = _s.find(([i]) => t < i);
  return e ? e[1] : "none";
}
function Es() {
  return {
    context: null,
    lifecycle: "idle",
    recreateInFlight: null
  };
}
function Is(t, e) {
  t.context = {
    accountId: e.accountId,
    launcherOptions: { ...e.launcherOptions },
    legacyRoktExtensions: [...e.legacyRoktExtensions]
  };
}
function As(t) {
  t.lifecycle = "attached";
}
function vs(t) {
  t.lifecycle !== "idle" && (t.lifecycle = "terminated");
}
function bs(t) {
  t.lifecycle = "terminated";
}
function Ps(t) {
  t.context = null, t.lifecycle = "idle", t.recreateInFlight = null;
}
function ws(t, e, i) {
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
const di = "rokt:intent", fi = "LEAD_CAPTURE_SUBMITTED";
class Ss {
  constructor(e) {
    this.handlers = e, this.config = null, this.dispatchedForPageView = !1;
  }
  configure(e) {
    this.config = e, this.dispatchedForPageView = !1, this.detachListeners(), this.isIdentityCaptureBridgeEnabled(this.config) && (this.leadCaptureSubmittedListener = (i) => {
      const n = this.parseLeadCaptureSubmittedPayload(i);
      n && this.handlers.onLeadCaptureSubmitted(n);
    }, window.addEventListener(fi, this.leadCaptureSubmittedListener)), this.isExitIntentBridgeEnabled(this.config) && (this.exitIntentListener = (i) => this.handleExitIntentEvent(i), window.addEventListener(di, this.exitIntentListener));
  }
  resetPageViewState() {
    this.dispatchedForPageView = !1;
  }
  dispose() {
    this.detachListeners(), this.config = null, this.dispatchedForPageView = !1;
  }
  detachListeners() {
    this.exitIntentListener && (window.removeEventListener(di, this.exitIntentListener), this.exitIntentListener = void 0), this.leadCaptureSubmittedListener && (window.removeEventListener(fi, this.leadCaptureSubmittedListener), this.leadCaptureSubmittedListener = void 0);
  }
  isExitIntentBridgeEnabled(e) {
    return !!(e && e.enabled !== !1);
  }
  isIdentityCaptureBridgeEnabled(e) {
    if (!this.isExitIntentBridgeEnabled(e))
      return !1;
    const i = e ? e.identityCapture : void 0;
    return I(i) ? i.enabled === !0 : !1;
  }
  allowCustomUserAttributes(e) {
    const i = e ? e.identityCapture : void 0;
    return I(i) ? i.allowCustomUserAttributes === !0 : !1;
  }
  getAllowedUserAttributeKeys(e) {
    const i = e ? e.identityCapture : void 0;
    if (!I(i))
      return /* @__PURE__ */ new Set();
    const n = i.allowedUserAttributeKeys;
    if (!Array.isArray(n))
      return /* @__PURE__ */ new Set();
    const r = n.filter((s) => h(s)).map((s) => s.trim()).filter((s) => s.length > 0);
    return new Set(r);
  }
  extractExitIntentReason(e) {
    return e instanceof CustomEvent && e.detail && h(e.detail.reason) ? e.detail.reason : "unknown";
  }
  handleExitIntentEvent(e) {
    const i = this.extractExitIntentReason(e);
    if (this.dispatchedForPageView || !this.handlers.isKitReady() || !(i === "mouse-exit-top" || i === "scroll-up-fast" || i === "idle" || i === "leave-link"))
      return;
    this.dispatchedForPageView = !0;
    const r = this.config && I(this.config.attributes) ? this.config.attributes : {};
    this.handlers.onExitIntent(
      i,
      r
    ) || (this.dispatchedForPageView = !1);
  }
  parseLeadCaptureSubmittedPayload(e) {
    if (!(e instanceof CustomEvent) || !I(e.detail))
      return null;
    const i = e.detail;
    if (!I(i.body))
      return null;
    const n = i.body, r = h(n.email) ? n.email : void 0, s = h(n.mobile_number) ? n.mobile_number : void 0, o = {};
    h(r) && r.length > 0 && (o.email = r), h(s) && s.length > 0 && (o.mobile_number = s);
    const a = {}, c = this.allowCustomUserAttributes(this.config), l = this.getAllowedUserAttributeKeys(this.config);
    this.mergeLeadCaptureUserAttributes(
      a,
      I(n.userAttributes) ? n.userAttributes : null,
      c,
      l
    );
    const u = h(n.rclid) ? n.rclid : void 0;
    u && u.length > 0 && (a.rokt_rclid = u);
    const d = h(n.accountID) ? n.accountID : void 0;
    d && d.length > 0 && (a.rokt_account_id = d);
    const p = h(n.referralCreativeID) ? n.referralCreativeID : void 0;
    return p && p.length > 0 && (a.rokt_referral_creative_id = p), { identities: o, userAttributes: a };
  }
  isSafeLeadCaptureUserAttributeKey(e) {
    return e === "__proto__" || e === "constructor" || e === "prototype" ? !1 : /^[a-zA-Z0-9_.-]+$/.test(e);
  }
  isSupportedLeadCaptureUserAttributeValue(e) {
    return h(e) || typeof e == "number" || typeof e == "boolean" ? !0 : Array.isArray(e) ? e.every((i) => h(i)) : !1;
  }
  mergeLeadCaptureUserAttributes(e, i, n, r) {
    if (i)
      for (const [s, o] of Object.entries(i))
        !n || !r.has(s) || this.isSafeLeadCaptureUserAttributeKey(s) && this.isSupportedLeadCaptureUserAttributeValue(o) && (e[s] = o);
  }
}
const U = "Rokt", Ts = 7, Re = 181, Ls = "selectPlacements", ks = "apps.roktecommerce.com", Cs = 0.1, Rs = "ThankYouPageJourney", Ds = "rokt-launcher", Os = "rokt-thank-you-element", Ks = "userIdentifiedInWorkspace", gi = 3, Us = 2, Ns = "page_events", Fs = "page_view_attributes", Ms = "mparticle_session_id", pi = "mparticle_device_id", et = "exit-intent", xs = [
  "3479519924056514560",
  "3484183287406608384",
  "3198447216177237634",
  "3292347205549055462"
], Vs = "exit-intent-placement", mi = 500, Wt = {
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  UNHANDLED_EXCEPTION: "UNHANDLED_EXCEPTION",
  IDENTITY_REQUEST: "IDENTITY_REQUEST",
  LOG_DELIVERY_FAILURE: "LOG_DELIVERY_FAILURE"
}, he = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARNING: "WARNING"
}, Hs = "apps.rokt-api.com", Ws = "/v1/log", js = "/v1/errors", $s = 10;
function _() {
  return window.mParticle;
}
function hi(t, e) {
  const n = [ze(t), "/wsdk/integrations/launcher.js"].join("");
  return !e || e.length === 0 ? n : n + "?extensions=" + e.join(",");
}
function _i(t) {
  return [ze(t), "/rokt-elements/rokt-element-thank-you.js"].join("");
}
function ze(t) {
  const e = t !== void 0 ? t : Hs;
  return e.includes("://") ? e.replace(/\/+$/, "") : ["https://", e].join("");
}
function pn(t, e, i) {
  if (t)
    return t.startsWith("http://") || t.startsWith("https://") ? t : "https://" + t;
  const r = e?.includes("://") && !/^https?:\/\//i.test(e) ? void 0 : e;
  return ze(r) + i;
}
function yi(t, e, i) {
  if (document.getElementById(t)) return;
  const n = document.head || document.body, r = document.createElement("script");
  r.id = t, r.type = "text/javascript", r.src = e, r.async = !0, r.crossOrigin = "anonymous", r.fetchPriority = "high", i?.onLoad && (r.onload = i.onLoad), i?.onError && (r.onerror = i.onError), n.appendChild(r);
}
function De(t) {
  if (!t)
    return [];
  const e = Li(t);
  return e === void 0 ? (console.error("Settings string contains invalid JSON"), []) : e;
}
function Ei(t) {
  const e = t ? De(t) : [], i = [], n = [];
  let r = !1;
  for (let s = 0; s < e.length; s++) {
    const o = e[s].value;
    o === "thank-you-journey" ? (r = !0, n.push(Rs)) : i.push(o);
  }
  return {
    roktExtensionsQueryParams: i,
    legacyRoktExtensions: n,
    loadThankYouElement: r
  };
}
async function Ys(t, e) {
  const i = [];
  if (e)
    for (const n of t)
      i.push(e.use(n));
  return Promise.all(i);
}
function Ii(t) {
  if (!t)
    return {};
  const e = {};
  for (let i = 0; i < t.length; i++) {
    const n = t[i];
    e[n.jsmap] = n.value;
  }
  return e;
}
function Ai(t) {
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
function vi(t, e, i) {
  return _().generateHash([t, e, i].join(""));
}
function Bs(t) {
  let n = "mParticle_wsdkv_" + _().getVersion() + "_kitv_" + "3.26.0";
  return t && (n += "_" + t), n;
}
function bi(t) {
  return !!(t && xs.includes(t));
}
function yt(t) {
  const e = document.createElement("iframe");
  e.style.display = "none", e.setAttribute("sandbox", "allow-scripts allow-same-origin"), e.src = t, e.onload = function() {
    e.onload = null, e.parentNode && e.parentNode.removeChild(e);
  };
  const i = document.body || document.head;
  i && i.appendChild(e);
}
function Pi(t, e) {
  const i = It(window.location.origin);
  if (ue._allowedOriginHashes.indexOf(i) === -1 || Math.random() >= Cs)
    return;
  const r = window.__rokt_li_guid__;
  if (!r || t && t.includes("://") && !/^https:\/\//i.test(t))
    return;
  const s = Et(window.location.href), o = "version=" + encodeURIComponent(e ?? "") + "&launcherInstanceGuid=" + encodeURIComponent(r) + "&pageUrl=" + encodeURIComponent(s), a = t ? ze(t) : "https://apps.rokt.com";
  yt(a + "/v1/wsdk-init/index.html?" + o), yt(
    "https://" + ks + "/v1/wsdk-init/index.html?" + o + "&isControl=true"
  );
}
function Gs() {
  return typeof window < "u" && !!window.location?.search?.toLowerCase().includes("mp_enable_logging=true");
}
function zs() {
  if (typeof window > "u")
    return;
  const t = window.location?.href;
  return t ? Et(t) : void 0;
}
function qs() {
  return typeof window < "u" ? window.navigator?.userAgent : void 0;
}
class mn {
  constructor() {
    this._logCount = {};
  }
  incrementAndCheck(e) {
    const n = (this._logCount[e] || 0) + 1;
    return this._logCount[e] = n, n > $s;
  }
}
class _e {
  constructor(e, i, n, r, s) {
    this._reporter = "mp-wsdk";
    const o = e.isLoggingEnabled;
    this._integrationName = i || "", this._launcherInstanceGuid = n, this._accountId = r || null, this._rateLimiter = s || new mn(), this._isEnabled = Gs() || o;
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
          code: r || Wt.UNKNOWN_ERROR,
          url: zs(),
          deviceInfo: qs(),
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
class wi {
  constructor(e, i, n, r, s) {
    this._transport = new _e(e, i, n, r, s), this._errorUrl = pn(e?.errorUrl, e?.integrationDomain, js);
  }
  report(e) {
    if (!e) return;
    const i = e.severity || he.ERROR;
    this._transport.send(this._errorUrl, i, e.message, e.code, e.stackTrace);
  }
}
class Si {
  constructor(e, i, n, r, s, o) {
    this._intentObserveLines = 0, this._transport = new _e(e, n, r, s, o), this._placementDiagnosticTransport = new _e(
      e,
      n,
      r,
      s
    ), this._preselectOutcomeTransport = new _e(e, n, r, s), this._loggingUrl = pn(e?.loggingUrl, e?.integrationDomain, Ws), this._errorReportingService = i;
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
      he.INFO,
      i.message,
      i.code,
      void 0,
      (n) => {
        if (this._errorReportingService) {
          const r = typeof n.statusCode == "number";
          this._errorReportingService.report({
            message: "LoggingService: Failed to send log: " + n.message,
            code: Wt.LOG_DELIVERY_FAILURE,
            severity: r ? he.ERROR : he.WARNING
          });
        }
      }
    );
  }
}
function Xs(t, e) {
  const i = Oe(window.location.href), n = t.EventAttributes?.title, r = h(n) ? n : void 0, s = Ki(t.EventAttributes, e) ? r : r || document.title, o = kn(), a = t.ActiveTimeOnSite;
  return {
    pageUrl: i,
    sourceMessageId: t.SourceMessageId,
    timestamp: t.Timestamp,
    ...s ? { pageTitle: s } : {},
    ...o !== void 0 ? { canonicalUrl: o } : {},
    ...Number.isFinite(a) ? { activeTimeOnSite: a } : {}
  };
}
const G = class G {
  constructor() {
    this.name = U, this.id = Re, this.moduleId = Re, this.isInitialized = !1, this.launcher = null, this.filters = {}, this.userAttributes = {}, this.userIdentifiedInWorkspace = !1, this.testHelpers = null, this.placementEventMappingLookup = {}, this.placementEventAttributeMappingLookup = {}, this.integrationName = null, this.errorReportingService = null, this.loggingService = null, this._thankYouElementOnLoadCallback = null, this._isThankYouElementLoaded = !1, this._workspaceSearchInFlightPromise = null, this._launcherAttachState = Es(), this._exitIntentConfig = null, this._exitIntentWatcher = new Ss({
      isKitReady: () => this.isKitReady(),
      onExitIntent: (e, i) => this.handleExitIntent(e, i),
      onLeadCaptureSubmitted: (e) => this.applyIdentityCapturePayload(e.identities, e.userAttributes)
    }), this._exitIntentEnabledForAccount = !1, this._pendingInitWarnings = [], this.accountId = null, this._preselectState = Br();
  }
  // ---- Private helpers ----
  getEventAttributeValue(e, i) {
    const n = e && e.EventAttributes;
    if (!n)
      return null;
    const r = L(n, i);
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
      if (T(s))
        continue;
      let o = !0;
      for (let a = 0; a < s.length; a++)
        if (!this.doesEventMatchRule(e, s[a])) {
          o = !1;
          break;
        }
      o && _().Rokt.setLocalSessionAttribute?.(r, !0);
    }
  }
  capturePageView(e, i) {
    let n;
    try {
      n = Et(window.location.href);
      const r = Jt(), s = Xs(e, i);
      r.push(s);
      const o = Math.min(r.length, Di), a = wn(r);
      if (a === 0) {
        const c = tt() ? "quota" : "ls_unavailable";
        this.loggingService?.log({
          message: `Rokt Kit: Failed to persist page view for ${n} [reason: ${c}]`,
          code: "PAGE_VIEW_CAPTURE_FAILED"
        });
      } else a < o && this.loggingService?.log({
        message: `Rokt Kit: Page view storage reduced from ${o} to ${a} record(s) under quota pressure [reason: quota_eviction]`,
        code: "PAGE_VIEW_QUOTA_EVICTION"
      });
    } catch (r) {
      const s = tt() ? "exception" : "ls_unavailable", o = r instanceof Error ? r.message : String(r);
      this.loggingService?.log({
        message: `Rokt Kit: Failed to capture page view for ${n}: ${o} [reason: ${s}]`,
        code: "PAGE_VIEW_CAPTURE_FAILED"
      });
    }
  }
  isPreselectionEnabled() {
    return this.launcher?.enablePreselection === !0;
  }
  findCacheConfigEntry(e) {
    if (this.isPreselectionEnabled())
      return Ie(this.accountId, e);
  }
  // What the speculative call fills in over these attributes, the ones it was fired with. An identity the call
  // carries already holds its key, so a default never stands in for it.
  buildPreselectAttributeDefaults(e, i) {
    if (!this.isPreselectionEnabled())
      return;
    const n = Ie(this.accountId, e);
    if (!n)
      return;
    const r = Ye(this.buildPreselectHost(), n, i), s = this.filters || {};
    if (!s.filterUserAttributes)
      return r;
    const o = s.userAttributeFilters || [];
    return s.filterUserAttributes(r, o);
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
      getCurrentUser: () => _().Identity?.getCurrentUser?.(),
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
    gs(this._preselectState, this.buildPreselectHost());
  }
  isLauncherReadyToAttach() {
    return !!window.Rokt && B(window.Rokt.createLauncher);
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
    return !_().Rokt || typeof _().Rokt.getLocalSessionAttributes != "function" ? {} : _().Rokt.getLocalSessionAttributes();
  }
  replaceOtherIdentityWithEmailsha256(e) {
    const i = { ...e || {} }, n = this._mappedEmailSha256Key;
    return n && e[n] && (i[G.EMAIL_SHA256_KEY] = e[n]), n && delete i[n], i;
  }
  logSelectPlacementsEvent(e) {
    if (!window.mParticle || typeof _().logEvent != "function" || !I(e))
      return;
    const i = _().EventType.Other;
    _().logEvent(Ls, i, e);
  }
  setRoktSessionId(e) {
    if (!(!e || typeof e != "string"))
      try {
        const i = _().getInstance();
        i && B(i.setIntegrationAttribute) && i.setIntegrationAttribute(Re, {
          roktSessionId: e
        });
      } catch {
      }
  }
  readMpSessionId() {
    const e = _()?.sessionManager, i = e?.getSessionId ?? e?.getSession;
    if (B(i))
      return i.call(e) || void 0;
  }
  readMpDeviceId() {
    if (!this.isDeviceIdDisabled())
      return _()?.getDeviceId?.() || void 0;
  }
  attachLauncher(e, i, n = []) {
    Is(this._launcherAttachState, {
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
      await Ys([...n], o), this.initRoktLauncher(o);
    }).catch((o) => {
      const a = this._launcherAttachState.lifecycle === "attached";
      if (bs(this._launcherAttachState), !a) {
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
    return ws(
      this._launcherAttachState,
      this.isLauncherReadyToAttach(),
      (e) => this.attachLauncher(e.accountId, e.launcherOptions, e.legacyRoktExtensions)
    );
  }
  initRoktLauncher(e) {
    window.Rokt && (window.Rokt.currentLauncher = e), this.launcher = e, As(this._launcherAttachState);
    const i = _().Rokt?.filters;
    i ? (!this.isInitialized && this.filters.filteredUser && (i.filteredUser = this.filters.filteredUser), this.filters = i, i.filteredUser ? this._workspaceSearchInFlightPromise = this.search(i.filteredUser) : console.warn("Rokt Kit: No filtered user has been set.")) : console.warn("Rokt Kit: No filters have been set."), this.isInitialized = !0, Pi(this.domain, this.integrationName), _().Rokt.attachKit(this), this.pushExitIntentExtensionConfig(), this.flushPendingPreselectDispatches();
  }
  // Leaving the hook unset is what keeps History unpatched for workspaces that never
  // preselect. The core SDK reads onCheckoutIntent when it has a signal, so an account without
  // pre-selection entries never hears one.
  armPreselectPathnameTrigger() {
    Qe(window.location.pathname), this.onRouteChange = me(this.accountId) ? () => this.evaluatePreselectPathname() : void 0, this.armPreselectEmailInputListener(), this.onCheckoutIntent = me(this.accountId) ? (e) => {
      try {
        Cr(this._preselectState, this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0, this.onPaymentPick = me(this.accountId) ? (e) => {
      try {
        Ur(this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0;
  }
  // A guest often types their email after the trigger page view has queued for want of one, so a
  // committed email input retries the queue. Only accounts with an entry that reads the form listen.
  armPreselectEmailInputListener() {
    this._preselectEmailInputListener && (document.removeEventListener("input", this._preselectEmailInputListener, !0), document.removeEventListener("change", this._preselectEmailInputListener, !0), this._preselectEmailInputListener = void 0), ts(this.accountId) && (this._preselectEmailInputListener = (e) => {
      mt(e), e.type === "change" && this._preselectState.pending.length > 0 && es(this._preselectState, this.buildPreselectHost(), e) && this.flushPendingPreselectDispatches();
    }, document.addEventListener("input", this._preselectEmailInputListener, !0), document.addEventListener("change", this._preselectEmailInputListener, !0));
  }
  // A core released without the check reads false, so its page views are judged by their marker alone.
  isAutoLogPageViewOn() {
    const e = _().Rokt;
    try {
      return B(e?.isAutoLogPageViewEnabled) && e.isAutoLogPageViewEnabled() === !0;
    } catch {
      return !1;
    }
  }
  // True while the core SDK says the confirm click can be waited for: auto button tracking is on, no
  // opt-out or privacy option suppresses it, and the browser supports the detector. A core released
  // without the check reads false, so its entries keep dispatchDelayMs.
  isCheckoutIntentActive() {
    const e = _().Rokt;
    try {
      return B(e?.isCheckoutIntentLive) && e.isCheckoutIntentLive() === !0;
    } catch {
      return !1;
    }
  }
  // Core gates every kit callback on opt-out and consent, but a DOM listener is called by the browser
  // directly, so it checks both itself.
  isForwardingAllowed() {
    return _().getInstance?.()?._Store?.isEnabled !== !1 && _()._getActiveForwarders().some((i) => i === this);
  }
  // A call carrying a form email can wait on identity search or launcher setup. A skipped one costs only
  // the cached hit, so it goes out only if nothing changed: same user, still allowed, and no partner
  // email has appeared, filtered or not.
  getFormEmailDropCause(e, i) {
    if (!this.isForwardingAllowed()) return "forwarding_disallowed";
    if (this.isTargetingDisabled() || !this.isPreselectionPrivacyAllowed()) return "privacy_signal";
    if (String(this.filters?.filteredUser?.getMPID?.() ?? "") !== String(i ?? "")) return "user_changed";
    if (Nt(this.buildPreselectHost(), e)) return "partner_email";
  }
  // Whether this connection filters out the Email identity, or the identity mapped to the hashed email.
  isEmailIdentityFiltered() {
    const e = this.userIdentityFilters || [];
    if (e.includes(Ts))
      return !0;
    const i = this._mappedEmailSha256Key, n = _().IdentityType || {}, r = i ? Object.keys(n).find((o) => o.toLowerCase() === i) : void 0, s = r ? n[r] : void 0;
    return typeof s == "number" && e.includes(s);
  }
  evaluatePreselectPathname() {
    const e = window.location.pathname;
    Qe(e), e !== this._lastPreselectPathname && (this.isTargetingDisabled() || (this._lastPreselectPathname = e, xr(this._preselectState, this.buildPreselectHost(), e), ui(this._preselectState, this.buildPreselectHost(), e)));
  }
  fetchOptimizely() {
    const e = _()._getActiveForwarders().filter((i) => i.name === "Optimizely");
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
    return _().Rokt?.launcherOptions?.noTargeting === !0 || this.isDeviceIdDisabled();
  }
  // Core's normalizeRoktLauncherOptions turns noDeviceId or noDeviceID into noDeviceId, noFunctional and
  // noTargeting, but an older core passes either spelling through as written, so the kit applies the same rule.
  isDeviceIdDisabled() {
    const e = _()?.Rokt?.launcherOptions;
    return e?.noDeviceId === !0 || e?.noDeviceID === !0;
  }
  isPreselectionPrivacyAllowed() {
    return _().Rokt?.launcherOptions?.doNotShareOrSell !== !0 && navigator.globalPrivacyControl !== !0;
  }
  isPageHistoryAllowed() {
    return !this.isTargetingDisabled() && this.isPreselectionPrivacyAllowed();
  }
  isPartnerInLocalLauncherTestGroup() {
    return !!(_().config && _().config.isLocalLauncherEnabled && this.isAssignedToSampleGroup());
  }
  isAssignedToSampleGroup() {
    return Math.random() > 0.5;
  }
  getEffectiveExitIntentConfig(e) {
    return bi(e) ? {
      identifier: Vs,
      signals: {
        mouseExitTop: !0,
        scrollUpFast: !0,
        idle: !0
      }
    } : null;
  }
  applyExitIntentExtensionOverride(e, i) {
    return e ? i.includes(et) ? i : [...i, et] : i;
  }
  extractExitIntentIdentifier(e) {
    return e ? h(e.identifier) && e.identifier.length > 0 ? e.identifier : h(e.placementIdentifier) && e.placementIdentifier.length > 0 ? e.placementIdentifier : null : null;
  }
  applyIdentityCapturePayload(e, i) {
    const n = {}, r = e.email;
    h(r) && r.length > 0 && (n.email = r);
    const s = e.mobile_number;
    h(s) && s.length > 0 && (n.mobile_number = s);
    const o = _().Identity?.modify;
    if (B(o) && Object.keys(n).length > 0)
      try {
        o({ userIdentities: n });
      } catch (c) {
        this.loggingService?.log({
          message: "Rokt Kit: identity capture modify failed",
          code: "EXIT_INTENT_IDENTITY_MODIFY_FAILED",
          additional_info: c instanceof Error ? { errorName: c.name, errorMessage: c.message } : void 0
        });
      }
    const a = _().Identity?.getCurrentUser?.();
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
    this._exitIntentConfig = this.isTargetingDisabled() ? null : e, this._exitIntentWatcher.configure(this._exitIntentConfig);
  }
  handleExitIntent(e, i) {
    if (!this._exitIntentConfig)
      return !1;
    const n = this.extractExitIntentIdentifier(this._exitIntentConfig);
    if (!n)
      return !1;
    try {
      const r = _().Rokt?.selectPlacements?.({
        identifier: n,
        attributes: {
          ...i,
          exitIntentReason: e
        }
      });
      return Promise.resolve(r).catch(() => {
      }), !0;
    } catch {
      return !1;
    }
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
    !this._exitIntentConfig || !B(window.Rokt?.setExtensionData) || window.Rokt.setExtensionData({
      [et]: this._exitIntentConfig
    });
  }
  captureTiming(e) {
    window && _() && _().captureTiming && e && _().captureTiming(e);
  }
  // ---- Public methods (mParticle Kit Callbacks) ----
  /**
   * Initializes the Rokt forwarder with settings from the mParticle server.
   */
  init(e, i, n, r, s) {
    const o = _().Rokt?.launcherOptions?.noFunctional === !0 || this.isDeviceIdDisabled();
    In(o), o || this.isTargetingDisabled() ? vn() : (Wn(), Yn()), this.isPageHistoryAllowed() || (Xe(), Je());
    const a = e, c = a.accountId;
    this._exitIntentEnabledForAccount = bi(c);
    const l = this._exitIntentEnabledForAccount ? this.getEffectiveExitIntentConfig(c) : null;
    this._exitIntentEnabledForAccount ? this.configureExitIntentBridge(l) : this.configureExitIntentBridge(null), this.accountId = c || null;
    const u = this.accountId ? Er(this.accountId, a.preselectionConfig) : void 0;
    this.userAttributes = J(s), this.armPreselectPathnameTrigger(), this._onboardingExpProvider = a.onboardingExpProvider;
    const d = De(a.placementEventMapping);
    this.placementEventMappingLookup = Ii(d);
    const p = De(
      a.placementEventAttributeMapping
    );
    this.placementEventAttributeMappingLookup = Ai(p), a.hashedEmailUserIdentityType && (this._mappedEmailSha256Key = a.hashedEmailUserIdentityType.toLowerCase()), this._workspaceIdSyncApiKey = h(a.workspaceIdSyncApiKey) ? a.workspaceIdSyncApiKey : void 0;
    const g = _().Rokt?.domain, { roktExtensionsQueryParams: f, legacyRoktExtensions: m, loadThankYouElement: y } = Ei(
      a.roktExtensions
    ), b = this.applyExitIntentExtensionOverride(
      l,
      f
    ), E = {
      ..._().Rokt?.launcherOptions || {}
    };
    this.integrationName = Bs(E.integrationName), E.integrationName = this.integrationName, this.domain = g;
    const v = {
      loggingUrl: a.loggingUrl,
      errorUrl: a.errorUrl,
      integrationDomain: g,
      isLoggingEnabled: _().config?.isLoggingEnabled === !0
    }, w = new wi(
      v,
      this.integrationName,
      window.__rokt_li_guid__,
      a.accountId
    ), O = new Si(
      v,
      w,
      this.integrationName,
      window.__rokt_li_guid__,
      a.accountId
    );
    return this.errorReportingService = w, this.loggingService = O, this._flushInitWarnings(), u && O.log({
      message: `Rokt Kit: preselectionConfig setting is invalid [reason=${u}], using the built-in preselection config`,
      code: "PRESELECT_CONFIG_INVALID"
    }), _()._registerErrorReportingService && _()._registerErrorReportingService(w), _()._registerLoggingService && _()._registerLoggingService(O), n ? (this.testHelpers = {
      generateLauncherScript: hi,
      generateThankYouElementScript: _i,
      extractRoktExtensionConfig: Ei,
      hashEventMessage: vi,
      parseSettingsString: De,
      generateMappedEventLookup: Ii,
      generateMappedEventAttributeLookup: Ai,
      sendAdBlockMeasurementSignals: Pi,
      createAutoRemovedIframe: yt,
      djb2: It,
      setAllowedOriginHashes: (k) => {
        G._allowedOriginHashes = k;
      },
      ReportingTransport: _e,
      ErrorReportingService: wi,
      LoggingService: Si,
      RateLimiter: mn,
      ErrorCodes: Wt,
      WSDKErrorSeverity: he,
      resetLauncherAttachState: () => Ps(this._launcherAttachState)
    }, this.attachLauncher(c, E), "Successfully initialized: " + U) : (y && (_().Rokt.flushOnShoppableAdsReadyMessageQueue?.(this), yi(Os, _i(g), {
      onLoad: () => {
        this._isThankYouElementLoaded = !0, this._thankYouElementOnLoadCallback && this._thankYouElementOnLoadCallback();
      },
      onError: (k) => {
        console.error("Error loading Rokt Thank You Element script:", k);
      }
    })), this.isLauncherReadyToAttach() ? this.attachLauncher(c, E, m) : (yi(Ds, hi(g, b), {
      onLoad: () => {
        this.isLauncherReadyToAttach() ? this.attachLauncher(c, E, m) : console.error("Rokt object is not available after script load.");
      },
      onError: (k) => {
        console.error("Error loading Rokt launcher script:", k);
      }
    }), this.captureTiming(G.PERFORMANCE_MARKS.RoktScriptAppended)), "Successfully initialized: " + U);
  }
  process(e) {
    if (e.EventDataType === gi && Qe(window.location.pathname), !this.isTargetingDisabled()) {
      if (e.EventDataType === gi) {
        if (this._exitIntentEnabledForAccount && this._exitIntentWatcher.resetPageViewState(), this.isPageHistoryAllowed()) {
          const i = this.isAutoLogPageViewOn();
          Tn(this.loggingService, e.EventAttributes, i), this.capturePageView(e, i);
        } else
          Xe(), Je();
        le(this._preselectState, this.buildPreselectHost(), e), ui(this._preselectState, this.buildPreselectHost());
      }
      Ue(e) && Kr(this.buildPreselectHost(), e), Vr(this.accountId, e.EventName) && $r(this._preselectState, this.buildPreselectHost(), e);
    }
    if (e.EventDataType === Us && (Xe(), Je(), Kt(this._preselectState), this.accountId && (Q(this.accountId), Qt(this.accountId), ei(this.accountId))), !this.isKitReady())
      return "Kit not ready for forwarder: " + U;
    if (B(_().Rokt?.setLocalSessionAttribute) && !Ue(e) && (T(this.placementEventAttributeMappingLookup) || this.applyPlacementEventAttributeMapping(e), !T(this.placementEventMappingLookup))) {
      const i = vi(e.EventDataType, e.EventCategory, e.EventName ?? "");
      this.placementEventMappingLookup[String(i)] && _().Rokt.setLocalSessionAttribute?.(this.placementEventMappingLookup[String(i)], !0);
    }
    return "Successfully sent to forwarder: " + U;
  }
  setExtensionData(e) {
    if (!this.isKitReady()) {
      console.error("Rokt Kit: Not initialized");
      return;
    }
    window.Rokt.setExtensionData(e);
  }
  setUserAttribute(e, i) {
    Ti(e) || (this.userAttributes[e] = i);
    const n = ci(this.accountId, e);
    return n && this.forgetCartAdd(), (Yr(this.accountId, e) || we(e, this._mappedEmailSha256Key) || n) && this.flushPendingPreselectDispatches(), "Successfully set user attribute for forwarder: " + U;
  }
  // The page's cart attribute or a logout replaces a remembered add-to-cart click. Under noTargeting, or for an account
  // that never remembers one, nothing is written to the device.
  forgetCartAdd() {
    this.accountId && ur(this.accountId, !this.isTargetingDisabled() && ds(this.accountId));
  }
  removeUserAttribute(e) {
    return delete this.userAttributes[e], ci(this.accountId, e) && this.forgetCartAdd(), "Successfully removed user attribute for forwarder: " + U;
  }
  handleIdentityComplete(e, i) {
    return this.userAttributes = J(e.getAllUserAttributes()), "Successfully called " + i + " for forwarder: " + U;
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
    const n = _().Identity?.search;
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
    return this.userIdentifiedInWorkspace = !1, this._workspaceSearchInFlightPromise = null, this._workspaceLastSearchedIdentitiesKey = void 0, this.accountId && (Q(this.accountId), Qt(this.accountId), ei(this.accountId), this.forgetCartAdd()), this.handleIdentityComplete(e, "onLogoutComplete");
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
        new Promise((s) => setTimeout(s, mi))
      ]) : Promise.resolve();
      return Promise.all([i, r]).then(
        () => this._dispatchPlacements(e)
      );
    }
    if (this._workspaceSearchInFlightPromise) {
      const n = this._workspaceSearchInFlightPromise;
      return Promise.race([
        n,
        new Promise((r) => setTimeout(r, mi))
      ]).then(() => this._dispatchPlacements(e));
    }
    return this._dispatchPlacements(e);
  }
  // What a pre-selection call with these attributes would send, mirroring _dispatchPlacements: identities,
  // then the cached user attributes merged in, filtered and overridden for the target page, then the
  // session attributes, so a later source wins as it does on the wire.
  getOutgoingPreselectAttributes(e, i) {
    const n = { ...J(this.userAttributes), ...e }, r = this.filters || {}, s = r.filterUserAttributes ? r.filterUserAttributes(n, r.userAttributeFilters || []) : n, o = this.returnUserIdentities(r.filteredUser || null), a = li(
      this.accountId,
      i ? dt(s, this.buildPreselectAttributeDefaults(i, e)) : s,
      this.findCacheConfigEntry(i)
    );
    return {
      ...o,
      ...a,
      ...this.returnLocalSessionAttributes()
    };
  }
  _dispatchPlacements(e) {
    const i = e ? is(e) : void 0;
    if (e?.preselect === !0 && !Vt(this.buildPreselectHost())) {
      i?.();
      return;
    }
    const n = e?.[Ne], r = e?.[ut], s = { ...e };
    if (delete s[Ne], delete s[ut], e = s, r !== void 0) {
      const X = I(r) ? r : {}, ge = String(X.mpid ?? ""), Gt = X.requireLogin !== !1, zt = _().Identity?.getCurrentUser?.();
      if (ge === "" || String(this.filters?.filteredUser?.getMPID?.() ?? "") !== ge || String(zt?.getMPID?.() ?? "") !== ge || Gt && zt?.isLoggedIn?.() !== !0) {
        this.loggingService?.logPlacementDiagnostic(
          P("missed", Gt ? "logged_in_dropped" : "user_changed_dropped")
        ), i?.();
        return;
      }
    }
    const o = I(n) ? n : void 0, a = o && h(o.key) ? o.key : void 0;
    if (a) {
      const X = this.getFormEmailDropCause(a, o.mpid);
      if (X) {
        this.loggingService?.logPlacementDiagnostic(
          P("missed", "form_email_dropped", { cause: X })
        ), i?.();
        return;
      }
    }
    const c = e.attributes || {}, l = J(this.userAttributes), u = { ...l, ...c }, d = this.filters || {}, p = d.userAttributeFilters || [], g = d.filteredUser || null, f = g ? g.getMPID() : null;
    let m;
    d ? d.filterUserAttributes ? m = d.filterUserAttributes(u, p) : m = u : (console.warn("Rokt Kit: No filters available, using user attributes"), m = u);
    const y = J(m);
    a && (Object.prototype.hasOwnProperty.call(l, a) ? y[a] = l[a] : delete y[a]), this.userAttributes = y;
    const b = this._onboardingExpProvider === "Optimizely" ? this.fetchOptimizely() : {}, E = this.returnUserIdentities(g), v = this.returnLocalSessionAttributes(), w = this.isPageHistoryAllowed(), O = w ? Sn(Jt()) : [], k = w ? Ln() : null, H = this.readMpSessionId(), C = this.readMpDeviceId(), W = typeof e.identifier == "string" ? e.identifier : void 0, V = this.findCacheConfigEntry(W), jt = e.preselect === !0 ? li(
      this.accountId,
      dt(
        m,
        this.buildPreselectAttributeDefaults(W, c)
      ),
      V
    ) : m, fe = {
      ...E,
      ...jt,
      ...b,
      ...v,
      ...O.length ? { [Ns]: JSON.stringify(O) } : {},
      ...k ? { [Fs]: k } : {},
      ...this.userIdentifiedInWorkspace ? { [Ks]: !0 } : {},
      ...H ? { [Ms]: H } : {},
      ...C ? { [pi]: C } : {},
      mpid: f
    };
    this.isDeviceIdDisabled() && delete fe[pi], e.preselect !== !0 && ps(this.buildPreselectHost(), W, fe);
    const qe = jt[Zi];
    if (e.preselect === !0 && h(qe) && (qe.indexOf("intent_") === 0 || qe.indexOf("pageview_cart|") === 0) && !Ce(fe, this._mappedEmailSha256Key)) {
      this.loggingService?.logPlacementDiagnostic(
        P("missed", "no_strict_email", { cause: "lost_before_dispatch" })
      ), i?.();
      return;
    }
    const $t = V?.identityKeys, hn = {
      ...e,
      attributes: fe,
      ...V ? { cacheMatchKeys: nn(V) } : {},
      ...$t ? { cacheIdentityKeys: $t } : {}
    }, Yt = this.launcher.selectPlacements(hn), Bt = e.preselect === !0, _n = () => {
      Bt || this.logSelectPlacementsEvent(fe);
    };
    return Promise.resolve(Yt).then((X) => {
      if (!Bt)
        return X?.context?.sessionId?.then((ge) => this.setRoktSessionId(ge));
    }).catch(() => {
    }).finally(_n), Yt;
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
    return this.isKitReady() ? (vs(this._launcherAttachState), this.launcher.terminate()) : (console.error("Rokt Kit: Not initialized"), Promise.resolve());
  }
  /**
   * Registers a callback to be invoked once rokt-thank-you-element.js becomes available.
   */
  onShoppableAdsReady(e) {
    this._isThankYouElementLoaded ? e() : this._thankYouElementOnLoadCallback = e;
  }
};
G._allowedOriginHashes = [-553112570, 549508659], G.PERFORMANCE_MARKS = {
  RoktScriptAppended: "mp:RoktScriptAppended"
}, G.EMAIL_SHA256_KEY = "emailsha256";
let ue = G;
function Js() {
  return Re;
}
function Qs(t) {
  if (!t) {
    window.console.log("You must pass a config object to register the kit " + U);
    return;
  }
  if (!I(t)) {
    window.console.log("'config' must be an object. You passed in a " + typeof t);
    return;
  }
  I(t.kits) ? t.kits[U] = {
    constructor: ue
  } : (t.kits = {}, t.kits[U] = {
    constructor: ue
  }), window.console.log("Successfully registered " + U + " to your mParticle configuration");
}
typeof window < "u" && window.mParticle && _().addForwarder && _().addForwarder({
  name: U,
  constructor: ue,
  getId: Js
});
export {
  Qs as register
};
//# sourceMappingURL=Rokt-Kit.esm.js.map
