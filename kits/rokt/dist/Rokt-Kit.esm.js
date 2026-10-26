const cn = [
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
], ln = new Set(cn);
function _i(t) {
  return ln.has(t.toLowerCase());
}
function Y(t) {
  const e = {}, i = t || {}, n = Object.keys(i);
  for (let r = 0; r < n.length; r++) {
    const s = n[r];
    _i(s) || (e[s] = i[s]);
  }
  return e;
}
function E(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function m(t) {
  return typeof t == "string";
}
function V(t) {
  return typeof t == "function";
}
function yi(t) {
  try {
    return JSON.parse(t.replace(/&quot;/g, '"'));
  } catch {
    return;
  }
}
function T(t) {
  return t == null ? !0 : typeof t == "string" ? t.length === 0 : typeof t == "object" ? Object.keys(t).length === 0 : !1;
}
function F(t, e) {
  return Object.prototype.hasOwnProperty.call(t, e) ? t[e] : void 0;
}
function Pe(t) {
  const e = Ei(), i = e ? e(t, "full") : t, n = i.indexOf("#"), r = n === -1 ? "" : i.slice(n);
  return (n === -1 ? i : i.slice(0, n)).split("?")[0] + r.split("?")[0];
}
function ut(t) {
  const e = Ei();
  return e ? e(t, "path") : t.split(/[?#]/)[0];
}
function Ei() {
  const t = window.mParticle;
  return t && typeof t._cleanUrl == "function" ? t._cleanUrl : void 0;
}
function dt(t) {
  let e = 5381;
  for (let i = 0; i < t.length; i++)
    e = (e << 5) + e + t.charCodeAt(i), e = e & e;
  return e;
}
const I = "mp-rokt-kit", Vt = "__rokt_ls_probe__";
function Wt() {
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
let J = null;
function un(t) {
  t ? J || (J = { local: Wt(), session: Wt() }) : J = null;
}
function dn() {
  return J !== null;
}
const j = () => J?.local ?? window.localStorage, U = () => J?.session ?? window.sessionStorage;
function Be() {
  try {
    const t = j();
    return t.setItem(Vt, "1"), t.removeItem(Vt), !0;
  } catch {
    return !1;
  }
}
function Ce(t, e = j) {
  try {
    const i = e().getItem(t);
    return i === null ? null : JSON.parse(i);
  } catch {
    return null;
  }
}
function Ii(t, e, i = j) {
  try {
    return i().setItem(t, JSON.stringify(e)), !0;
  } catch {
    return !1;
  }
}
function ze(t, e = j) {
  try {
    e().removeItem(t);
  } catch {
  }
}
function fn() {
  ze(I, () => window.localStorage), ze(I, () => window.sessionStorage);
}
function B(t, e, i = j) {
  const n = Ce(t, i);
  return E(n) ? n[e] : void 0;
}
function z(t, e, i, n = j) {
  const r = Ce(t, n), s = E(r) ? { ...r } : {};
  return s[e] = i, Ii(t, s, n);
}
function Ai(t, e, i) {
  Object.keys(e).length === 0 ? ze(t, i) : Ii(t, e, i);
}
function he(t, e, i = j) {
  const n = Ce(t, i);
  if (!E(n) || !(e in n))
    return;
  const r = { ...n };
  delete r[e], Ai(t, r, i);
}
function ge(t, e, i = j) {
  const n = Ce(t, i);
  if (!E(n))
    return;
  const r = Object.keys(n).filter((o) => o.startsWith(e));
  if (r.length === 0)
    return;
  const s = { ...n };
  r.forEach((o) => delete s[o]), Ai(t, s, i);
}
const ft = "pageViews", we = "utmParams", vi = 25, gn = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
function bi(t) {
  return t.slice(-vi);
}
function Ht() {
  const t = B(I, ft);
  return Array.isArray(t) ? t.filter(E).map(pn) : [];
}
function pn(t) {
  return {
    ...t,
    ...m(t.pageUrl) ? { pageUrl: Pe(t.pageUrl) } : {},
    ...m(t.canonicalUrl) ? { canonicalUrl: Pe(t.canonicalUrl) } : {}
  };
}
function mn(t) {
  const e = bi(t);
  for (let i = 0; i < e.length; i++) {
    const n = e.slice(i);
    if (z(I, ft, n))
      return n.length;
  }
  return 0;
}
function je() {
  he(I, ft);
}
function hn(t) {
  const e = bi(t);
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
function Pi(t, e = !1) {
  return e || !!t && t.is_auto_page_view === !0;
}
function _n(t, e, i = !1) {
  if (B(I, we) !== void 0)
    return;
  const n = Pi(e, i), r = new URLSearchParams(window.location.search), s = {};
  for (const a of gn) {
    const c = n ? (e || {})[a] : r.get(a);
    m(c) && c && (s[a] = c);
  }
  if (Object.keys(s).length === 0)
    return;
  const o = Object.keys(s).join(", ");
  if (!z(I, we, s)) {
    const a = Be() ? "quota" : "ls_unavailable";
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
function yn() {
  const t = B(I, we);
  return E(t) ? t : null;
}
function $e() {
  he(I, we);
}
function En() {
  const e = document.querySelector('link[rel="canonical"]')?.href;
  if (e)
    return Pe(e);
}
const In = [
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
], An = 1, vn = 6e4;
function N(t) {
  return Array.isArray(t) && t.every(m);
}
function bn(t, e) {
  if (!E(e))
    return "not an object";
  const { pathname: i, targetPageIdentifier: n, attributeKeys: r, optionalAttributeKeys: s, identityKeys: o, dispatchDelayMs: a } = e, { triggerEventNames: c, releaseHoldOnRouteChange: l, readEmailInput: u, cartIntent: d, cartUserAttribute: h } = e, f = e.preselectAttributeOverrides, y = e.widenedOptionalAttributeKeys;
  if (e.accountId !== void 0 && e.accountId !== t)
    return "accountId";
  if (!m(i) || !i.startsWith("/"))
    return "pathname";
  if (!m(n) || n === "")
    return "targetPageIdentifier";
  if (!N(r) || r.length === 0)
    return "attributeKeys";
  if (s !== void 0 && (!N(s) || !s.every((_) => r.includes(_))))
    return "optionalAttributeKeys";
  if (y !== void 0 && (!N(y) || !y.every((_) => r.includes(_))))
    return "widenedOptionalAttributeKeys";
  if (o !== void 0 && (!N(o) || o.length === 0 || !o.every((_) => r.includes(_))))
    return "identityKeys";
  if (N(y) && y.length > 0) {
    const _ = (N(s) ? s : []).concat(y).map((b) => b.toLowerCase());
    if (!N(o) || o.some((b) => _.includes(b.toLowerCase())))
      return "identityKeys";
  }
  if (a !== void 0 && (!Number.isInteger(a) || a < 0 || a > vn))
    return "dispatchDelayMs";
  if (l !== void 0 && typeof l != "boolean")
    return "releaseHoldOnRouteChange";
  if (d !== void 0 && typeof d != "boolean")
    return "cartIntent";
  if (u !== void 0 && (typeof u != "boolean" || !r.includes("email") || N(s) && s.includes("email") || // The runtime matches optional keys in any casing, so an 'Email' key would make email optional too.
  N(y) && y.some((_) => _.toLowerCase() === "email")))
    return "readEmailInput";
  if (f !== void 0 && (!E(f) || !Object.entries(f).every(
    ([_, b]) => m(b) && r.includes(_) && !(N(o) && o.includes(_))
  )))
    return "preselectAttributeOverrides";
  if (c !== void 0 && (!N(c) || c.length === 0 || c.some((_) => _ === "")))
    return "triggerEventNames";
  const g = { accountId: t, pathname: i, targetPageIdentifier: n, attributeKeys: r };
  return s !== void 0 && (g.optionalAttributeKeys = s), y !== void 0 && (g.widenedOptionalAttributeKeys = y), o !== void 0 && (g.identityKeys = o), a !== void 0 && (g.dispatchDelayMs = a), l !== void 0 && (g.releaseHoldOnRouteChange = l), u !== void 0 && (g.readEmailInput = u), f !== void 0 && (g.preselectAttributeOverrides = f), c !== void 0 && (g.triggerEventNames = c), d !== void 0 && (g.cartIntent = d), d === !0 && m(h) && h !== "" && (g.cartUserAttribute = h), g;
}
function Pn(t, e) {
  const i = yi(e);
  if (i === void 0)
    return { error: "invalid JSON" };
  if (!E(i))
    return { error: "not an object" };
  if (i.schemaVersion !== An)
    return { error: "schemaVersion" };
  if (!Array.isArray(i.entries))
    return { error: "entries" };
  const n = [];
  for (let r = 0; r < i.entries.length; r++) {
    const s = bn(t, i.entries[r]);
    if (m(s))
      return { error: `entry ${r + 1} ${s}` };
    if (n.some((o) => o.targetPageIdentifier === s.targetPageIdentifier))
      return { error: `entry ${r + 1} targetPageIdentifier` };
    n.push(s);
  }
  return { entries: n };
}
const wn = 6e4, gt = "activePreselect:";
function Sn(t) {
  return E(t) && typeof t.expiresAt == "number" && typeof t.attributesDigest == "number";
}
function pt(t, e) {
  return `${gt}${t}:${e}`;
}
function Q(t) {
  const e = B(I, t, U);
  return Sn(e) && e.expiresAt > Date.now() ? e : null;
}
function Tn(t, e, i = !1) {
  z(
    I,
    t,
    { expiresAt: Date.now() + wn, attributesDigest: e, ...i ? { byEvent: !0 } : {} },
    U
  );
}
function Ln(t, e, i) {
  const n = Q(t);
  n && n.attributesDigest !== i || (e && e.expiresAt > Date.now() ? z(I, t, e, U) : he(I, t, U));
}
function jt(t) {
  ge(
    I,
    `${gt}${t}:`,
    U
  );
}
function kn() {
  ge(I, gt);
}
const Rn = 5 * 6e4, wi = "pendingPreselect:";
function Cn(t) {
  return E(t) && typeof t.expiresAt == "number" && m(t.pathname) && m(t.identifier) && E(t.attributes) && m(t.mpid);
}
function mt(t) {
  return `${wi}${t}`;
}
function ht(t) {
  const e = mt(t), i = B(I, e, U);
  return Cn(i) ? i.expiresAt <= Date.now() ? (he(I, e, U), null) : i : null;
}
function $t(t, e, i, n, r, s = !1) {
  return z(
    I,
    mt(t),
    {
      expiresAt: Date.now() + Rn,
      pathname: e,
      identifier: i,
      attributes: n,
      mpid: r,
      ...s ? { byEvent: !0 } : {}
    },
    U
  );
}
function G(t) {
  he(I, mt(t), U);
}
function Dn() {
  ge(I, wi);
}
const qe = {
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
}, On = /\b(?:gift cards?|store credit|rewards?|points?|balance|vouchers?|promo codes?|coupons?)\b/g, Un = 12;
function Kn(t) {
  return t.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/[^a-z]+/g, " ").trim();
}
function _t(t) {
  if (typeof t != "string" || t.length > 128)
    return;
  const e = Kn(t).replace(On, " ").replace(/\s+/g, " ").trim();
  if (!e || e.split(" ").length > Un)
    return;
  const i = Object.keys(qe).filter((r) => qe[r].test(e)), n = i.filter((r) => r !== "card");
  return n.length === 1 ? n[0] : n.length === 0 && i.length === 1 ? i[0] : void 0;
}
function Si(t) {
  return typeof t == "string" && Object.prototype.hasOwnProperty.call(qe, t);
}
const Nn = "radio", Fn = ["button", "role", "wallet"], Mn = ["label", "aria_label", "test_id", "element_id", "element_name"];
function xn(t) {
  if (!t)
    return;
  const e = String(t.checked), i = t.type === Nn;
  if (!(e === "false" || i && e !== "true" || t.type === "checkbox" || t.element === "link") && !(!i && t.type === void 0 && !Fn.includes(String(t.element))))
    for (const n of Mn) {
      const r = _t(t[n]);
      if (r && (i || r !== "card"))
        return r;
    }
}
function Vn(t) {
  if (Si(t.family))
    return t.family;
  for (const e of Array.isArray(t.names) ? t.names : []) {
    const i = _t(e);
    if (i)
      return i;
  }
}
const Wn = ["paymenttype", "payment_type", "paymentmethod", "payment_method"];
function Hn(t) {
  const e = t ? Object.keys(t).find((n) => Wn.includes(n.toLowerCase())) : void 0, i = e ? t[e] : void 0;
  return typeof i != "string" || !i.trim() ? "absent" : _t(i) ?? "other";
}
const Ti = "preselectArrival:", Li = "preselectTriggerAnyTab:", jn = 30 * 6e4, te = 30 * 6e4, Xe = ["commit", "wallet", "frame", "checkout_step", "cart"], $n = [
  "triggeredAt",
  "identitySeenAt",
  "firedAt",
  "firedDigest",
  "arrivedAt",
  "nearMissAt",
  "paymentPickAt"
], Yn = ["paymentPick", "paymentAtFire"];
function x(t, e) {
  return `${Ti}${t}:${e}`;
}
function ki(t, e) {
  return `${Li}${t}:${e}`;
}
function De(t) {
  const e = B(I, t, U), i = {};
  if (!E(e))
    return i;
  for (const n of $n)
    typeof e[n] == "number" && (i[n] = e[n]);
  typeof e.intentAt == "number" && Xe.includes(e.intentKind) && (i.intentAt = e.intentAt, i.intentKind = e.intentKind);
  for (const n of Yn)
    Si(e[n]) && (i[n] = e[n]);
  return i.firedAt !== void 0 && e.firedByCart === !0 && (i.firedByCart = !0), i;
}
function q(t, e) {
  return z(I, t, e, U);
}
function se(t) {
  const e = De(t);
  return e.arrivedAt === void 0 ? e : {};
}
function Gn(t, e, i) {
  const n = x(t, e), r = se(n), s = Date.now();
  q(n, {
    ...r,
    triggeredAt: r.triggeredAt ?? s,
    ...i ? { identitySeenAt: r.identitySeenAt ?? s } : {}
  }), z(I, ki(t, e), {
    triggeredAt: s
  });
}
function Bn(t, e) {
  const i = B(I, ki(t, e));
  if (!E(i) || typeof i.triggeredAt != "number")
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < jn;
}
function zn(t, e) {
  const i = x(t, e), n = De(i);
  n.arrivedAt !== void 0 || n.nearMissAt !== void 0 || q(i, { ...n, nearMissAt: Date.now() });
}
function qn(t, e, i, n = !1) {
  const r = x(t, e), s = se(r), o = s.firedAt !== void 0 && Je(s.firedAt) ? {
    firedAt: s.firedAt,
    ...s.firedDigest !== void 0 ? { firedDigest: s.firedDigest } : {},
    ...s.firedByCart ? { firedByCart: !0 } : {},
    ...s.paymentAtFire !== void 0 ? { paymentAtFire: s.paymentAtFire } : {}
  } : void 0, a = s.paymentPick !== void 0 && s.paymentPickAt !== void 0 && Je(s.paymentPickAt) ? s.paymentPick : void 0;
  return q(
    r,
    Ri(s, {
      firedAt: o && !(o.firedByCart && !n) ? o.firedAt : Date.now(),
      firedDigest: i,
      ...n ? { firedByCart: !0 } : {},
      paymentAtFire: a
    })
  ), o;
}
function Xn(t, e, i, n) {
  const r = x(t, e), s = se(r);
  s.firedAt === void 0 || s.firedDigest !== n || q(r, Ri(s, i));
}
function Ri(t, e) {
  const i = { ...t };
  return delete i.firedAt, delete i.firedDigest, delete i.firedByCart, delete i.paymentAtFire, e ? {
    ...i,
    firedAt: e.firedAt,
    ...e.firedDigest !== void 0 ? { firedDigest: e.firedDigest } : {},
    ...e.firedByCart ? { firedByCart: !0 } : {},
    ...e.paymentAtFire !== void 0 ? { paymentAtFire: e.paymentAtFire } : {}
  } : i;
}
function Jn(t, e) {
  const i = se(x(t, e));
  if (i.triggeredAt === void 0)
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < te;
}
function yt(t, e, i, n = !1) {
  const r = se(x(t, e));
  if (r.firedAt === void 0 || n && r.firedByCart || i !== void 0 && r.firedDigest !== void 0 && r.firedDigest !== i)
    return !1;
  const s = Date.now() - r.firedAt;
  return s >= 0 && s < te;
}
function Qn(t, e, i, n) {
  const r = x(t, e), s = se(r);
  if (s.intentAt !== void 0 && s.intentKind !== void 0 && Zn(s.intentAt)) {
    const o = Xe.indexOf(s.intentKind), a = Xe.indexOf(i);
    if (o < a || o === a && s.intentAt >= n)
      return;
  }
  q(r, { ...s, intentAt: n, intentKind: i });
}
function Je(t) {
  const e = Date.now() - t;
  return e >= 0 && e < te;
}
function Zn(t) {
  return Je(t);
}
function er(t, e, i, n) {
  const r = x(t, e), s = De(r);
  s.arrivedAt !== void 0 || s.paymentPickAt !== void 0 && s.paymentPickAt > n || q(r, { ...s, paymentPick: i, paymentPickAt: n });
}
function tr(t, e) {
  const i = x(t, e), n = De(i);
  if (n.arrivedAt === void 0 && q(i, { ...n, arrivedAt: Date.now() }))
    return n;
}
function Yt(t) {
  ge(
    I,
    `${Ti}${t}:`,
    U
  ), ge(I, `${Li}${t}:`);
}
function A(t, e, i = {}) {
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
const Qe = /* @__PURE__ */ new Map();
function ir(t, e) {
  if (Qe.delete(t), !e)
    return;
  const i = Pn(t, e);
  if ("error" in i)
    return i.error;
  Qe.set(t, i.entries);
}
function K(t) {
  return Qe.get(t) ?? In.filter((e) => e.accountId === t);
}
function Z(t, e) {
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
function nr(t, e) {
  const i = v(t).toLowerCase(), n = v(e).toLowerCase().split("/"), r = i.split("/").length;
  return Z(i, n.join("/")) || Z(i, ["", ...n.slice(2)].join("/")) || n.length > r && Z(i, n.slice(0, r).join("/"));
}
const Ci = {}, Di = {}, Oi = {}, Ui = {}, rr = {}, sr = ["commit", "wallet", "checkout_step", "frame", "cart"], or = ["vendor", "label", "brand", "frame", "submit", "name", "api"], ar = 512;
function Ki(t) {
  return t === "commit" ? "intent_commit" : t === "cart" ? "intent_cart" : "intent_wallet";
}
function Ni(t) {
  return t === "intent_commit" ? Di : t === "intent_cart" ? Ui : Oi;
}
const cr = 1e3;
function Fi(t) {
  const e = Date.now() - t.t;
  return e >= 0 && e < cr;
}
function Oe(t) {
  return K(t).filter((e) => e.cartIntent === !0);
}
function Et(t) {
  return typeof t.source == "string" && or.includes(t.source) ? t.source : void 0;
}
function Mi(t) {
  return [...new Set(K(t).map((i) => i.targetPageIdentifier))].some((i) => Jn(t, i)) ? "left" : "before_entry";
}
function It(t, e, i, n, r = {}, s = !1) {
  const o = `${n}:${i}:${e.kind}${s ? ":wait" : ""}`;
  if (et.has(o)) return;
  et.add(o);
  const a = Et(e);
  t.logPlacementDiagnostic(
    A("skipped", "intent_observed", {
      intent_kind: e.kind,
      intent_route: i,
      ...a ? { intent_source: a } : {},
      has_email: Ne(t, {}),
      has_identity: k(t.filteredUser),
      ...r
    })
  );
}
function xi(t) {
  const e = L(t.filteredUser), i = t.getCurrentUser?.();
  return e !== null && L(i) === e && i?.isLoggedIn?.() === !0;
}
function Ze(t, e, i, n, r, s = !1) {
  const o = e.accountId, a = Mi(o), c = xi(e), l = (C) => It(e, i, a, r, { logged_in: c, ...C ? { cause: C } : {} }, s), u = i.kind === "cart", d = i.kind === "wallet" && !c && (s || !k(e.filteredUser));
  if (!u && !c && (s || l(), !d))
    return;
  const h = u ? Oe(o) : K(o).filter((C) => C.cartIntent !== !0);
  if (h.length === 0) return l("cart_entry_only");
  if (h.length !== 1) return l("multiple_entries");
  if (n !== v(window.location.pathname) && !(u && Fi(i)))
    return l("path_changed");
  const f = h[0];
  if (!k(e.filteredUser))
    return d && !s ? lr(t, e, i, n, r) : l("no_valid_identity");
  const y = Ki(i.kind), g = `${y}_off_entry`, { collected: _, missingKeys: b } = oe(e, Ni(y), f, !1), R = Fe(e, o, f.targetPageIdentifier, _);
  if (yt(o, f.targetPageIdentifier, R, !u))
    return l("active_preselection");
  if (b.length > 0) return l("missing_attribute");
  if (!Ne(e, _, f.targetPageIdentifier)) return l("no_strict_email");
  Me(
    e,
    o,
    f.targetPageIdentifier,
    f.targetPageIdentifier,
    _,
    "intent",
    Ke(g, f),
    !1,
    y,
    !1,
    void 0,
    Et(i),
    { route: a, loggedIn: c, requireLogin: !u && !d }
  );
}
const Vi = 2e4;
function lr(t, e, i, n, r) {
  Wi(t);
  const s = () => {
    t.identityWait = void 0;
    const a = e.getCurrentHost?.() ?? e;
    At(a) && Hi(a, o);
  }, o = {
    signal: i,
    clickPathname: n,
    visitKey: r,
    route: S[S.length - 1],
    timer: setTimeout(s, Math.max(0, i.t + Vi - Date.now()))
  };
  t.identityWait = o;
}
function Wi(t) {
  t.identityWait && clearTimeout(t.identityWait.timer), t.identityWait = void 0;
}
function Hi(t, e) {
  const i = Mi(t.accountId), n = { logged_in: xi(t), cause: "identity_wait_expired" };
  It(t, e.signal, i, e.visitKey, n, !0);
}
function ur(t, e) {
  const i = t.identityWait;
  if (!i || !k(e.filteredUser) || (Wi(t), !At(e))) return;
  if (e.logPlacementDiagnostic(
    A("identity_arrived", "pending_identity", {
      intent_kind: i.signal.kind,
      ...xe(i.signal.t)
    })
  ), S[S.length - 1] !== i.route || i.clickPathname !== v(window.location.pathname) || Date.now() - i.signal.t >= Vi) return Hi(e, i);
  Ze(t, e, i.signal, i.clickPathname, i.visitKey, !0);
}
function dr(t) {
  const e = t.pathname;
  return typeof e == "string" && e.charAt(0) === "/" && e.length <= ar ? v(e) : void 0;
}
const le = /* @__PURE__ */ new Set(), et = /* @__PURE__ */ new Set(), S = [];
function pe(t) {
  if (t === Di) return "intent_commit";
  if (t === Oi) return "intent_wallet";
  if (t === Ui) return "intent_cart";
}
function _e(t) {
  return pe(t) !== void 0;
}
function Ye(t, e = Date.now()) {
  t = v(t), S[S.length - 1]?.pathname !== t && (S.push({ pathname: t, since: e }), S.length > 8 && S.shift(), et.clear());
}
function fr(t, e, i) {
  if (!i || !sr.includes(i.kind) || typeof i.t != "number" || !Number.isFinite(i.t))
    return;
  const n = `${i.kind}:${i.t}`;
  if (le.has(n) || (le.add(n), le.size > 4096 && le.delete(le.values().next().value), !At(e)) || i.kind === "cart" && Oe(e.accountId).length === 0) return;
  gr(e.accountId, i);
  const r = [...S].reverse().find((_) => _.since <= i.t), s = dr(i) ?? r?.pathname;
  if (!s) return;
  const o = r && r.pathname === s ? r.since : 0, a = `${s}:${o}`, c = i.kind === "cart", l = i.kind === "commit" || i.kind === "wallet" || c, u = O(e.accountId, s);
  if (!u || (c ? u.cartIntent !== !0 : u.cartIntent === !0)) {
    l && Ze(t, e, i, s, a);
    return;
  }
  const d = window.location.pathname, h = s === v(d);
  if (c && !h && Fi(i)) {
    Ze(t, e, i, s, a);
    return;
  }
  if (!l || !h) {
    It(e, i, "entry", a);
    return;
  }
  t.intentSource = Et(i);
  const f = Ki(i.kind), y = t.scheduledDispatch;
  if (y && v(y.pathname) === v(d)) {
    vt(t), Zi(t, e, y, "intent_released", f);
    return;
  }
  const g = t.pending.find(
    (_) => v(_.pathname) === v(d)
  );
  if (g) {
    g.intentSeen = f, g.waitingFor === "intent" && (t.pending = t.pending.filter((_) => _ !== g), ne(
      t,
      e,
      g.event,
      d,
      g.triggeringUserId,
      g.triggeredAt,
      f
    ));
    return;
  }
  ne(t, e, Ni(f), d, void 0, i.t);
}
function At(t) {
  return !t.isTargetingDisabled?.() && t.isForwardingAllowed?.() !== !1 && X(t) && t.isKitReady() && t.isPreselectionEnabled() && ue(t.accountId);
}
function gr(t, e) {
  const i = e.kind === "cart" ? Oe(t) : K(t);
  new Set(i.map((r) => r.targetPageIdentifier)).forEach((r) => Qn(t, r, e.kind, e.t));
}
function ie(t) {
  return t === Ci;
}
const Ue = 4, pr = ["Auto Button Click", "Auto Link Click"], mr = ["is_auto_button_click", "is_auto_link_click"];
function Se(t) {
  return t.EventDataType === Ue && pr.includes(t.EventName ?? "") || mr.some((e) => String(t.EventAttributes?.[e]) === "true");
}
function ji(t) {
  const e = t.accountId;
  if (!(!e || !ue(e) || t.isTargetingDisabled?.() || t.isForwardingAllowed?.() === !1 || !X(t) || !t.isKitReady() || !t.isPreselectionEnabled()))
    return e;
}
function $i(t, e) {
  if (!e) return;
  const i = new Set(K(t).map((r) => r.targetPageIdentifier)), n = Date.now();
  i.forEach((r) => er(t, r, e, n));
}
function hr(t, e) {
  const i = Se(e) ? ji(t) : void 0;
  i && $i(i, xn(e.EventAttributes));
}
function _r(t, e) {
  const i = ji(t);
  i && $i(i, Vn(e));
}
function ee(t, e) {
  return e.EventDataType === Ue && m(e.EventName) && !Se(e) && (t.triggerEventNames ?? []).includes(e.EventName);
}
const Yi = "rokt.preselecttrigger", Te = "preselectFormEmail", tt = "preselectBoundUser";
function Ke(t, e) {
  return `${t}|${e.pathname}`;
}
function O(t, e) {
  if (t)
    return K(t).find((i) => Z(i.pathname, e));
}
function Le(t, e) {
  if (!(!t || !m(e)))
    return K(t).find((i) => i.targetPageIdentifier === e);
}
function it(t, e) {
  if (!e)
    return t;
  const i = new Set(Object.keys(e).map((r) => r.toLowerCase())), n = {};
  for (const [r, s] of Object.entries(t))
    i.has(r.toLowerCase()) || (n[r] = s);
  return { ...n, ...e };
}
function Gi(t) {
  const e = Object.keys(t.preselectAttributeOverrides ?? {});
  return [...t.attributeKeys, ...e.filter((i) => !t.attributeKeys.includes(i))];
}
function ue(t) {
  return t ? K(t).length > 0 : !1;
}
function yr(t, e, i = window.location.pathname) {
  if (t.pending.some((r) => r.pathname === i && !ie(r.event)))
    return;
  const n = t.scheduledDispatch;
  n && n.pathname === i && !ie(n.event) || ne(t, e, Ci, i);
}
function Er(t, e) {
  return !t || !m(e) ? !1 : K(t).some((i) => (i.triggerEventNames ?? []).includes(e));
}
function ke(t) {
  return !ie(t) && !_e(t) && t.EventDataType !== Ue;
}
function Ir(t, e) {
  const i = t.scheduledDispatch;
  return i && i.pathname === e && ke(i.event) ? !0 : t.pending.some((n) => n.pathname === e && ke(n.event));
}
function Ar(t, e, i, n) {
  if (!t.isKitReady() || !t.isPreselectionEnabled() || !Tt(t, i))
    return "waits";
  const { collected: r, missingKeys: s } = oe(t, e, i);
  if (s.length > 0)
    return "waits";
  const o = t.accountId || "", a = Q(pt(o, v(n)));
  if (!a)
    return "now";
  const c = Fe(t, o, i.targetPageIdentifier, r);
  return a.byEvent || c !== void 0 && c === a.attributesDigest ? "skipped" : "now";
}
function vr(t, e, i) {
  t.pending = t.pending.filter((r) => r.pathname !== i);
  const n = e.accountId ? ht(e.accountId) : null;
  e.accountId && n && n.pathname === i && G(e.accountId);
}
function br(t, e, i, n = window.location.pathname) {
  const r = O(e.accountId, n);
  if (!r || !ee(r, i))
    return;
  const s = Ar(e, i, r, n);
  if (s === "now")
    vr(t, e, n);
  else if (Ir(t, n) || s === "skipped" && t.scheduledDispatch?.pathname === n)
    return;
  ne(t, e, i, n);
}
function Pr(t, e) {
  return t ? K(t).some((i) => i.attributeKeys.includes(e)) : !1;
}
function wr() {
  return { pending: [] };
}
function vt(t) {
  if (t.dispatchTimer === void 0)
    return;
  const e = t.scheduledDispatch;
  return clearTimeout(t.dispatchTimer), t.dispatchTimer = void 0, t.scheduledDispatch = void 0, e;
}
function Sr(t, e) {
  return t === void 0 ? e : e === void 0 ? t : Math.min(t, e);
}
function Gt(t) {
  return ie(t) ? 0 : _e(t) || t.EventDataType === Ue ? 2 : 1;
}
function Tr(t, e) {
  const i = O(t.accountId, e.pathname);
  return !!i && oe(t, e.event, i).missingKeys.length > 0;
}
function Bi(t, e, i, n) {
  const r = t.pending.find((s) => s.pathname === n);
  return !!r && Gt(i) < Gt(r.event) && !(ke(i) && Tr(e, r));
}
function H(t, e, i) {
  const n = t.pending.findIndex((r) => r.pathname === i.pathname);
  if (n >= 0) {
    if (Bi(t, e, i.event, i.pathname))
      return;
    const r = t.pending[n];
    t.pending[n] = {
      ...i,
      triggeredAt: Sr(r.triggeredAt, i.triggeredAt),
      intentSeen: i.intentSeen ?? r.intentSeen ?? pe(r.event)
    };
    return;
  }
  t.pending.push(i);
}
function me(t) {
  if (!t?.getUserIdentities)
    return [];
  const e = t.getUserIdentities().userIdentities;
  return e ? Object.keys(e).filter((i) => {
    const n = e[i];
    return m(n) && n.length > 0;
  }).sort() : [];
}
function k(t) {
  return me(t).length > 0;
}
const nt = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, rt = /* @__PURE__ */ new WeakSet(), st = /* @__PURE__ */ new WeakSet(), Bt = /* @__PURE__ */ new WeakSet();
function bt(t) {
  if (!(t instanceof HTMLInputElement)) return !1;
  const e = t.type;
  return e === "text" || e === "email" || t.getAttribute("autocomplete") === "email" && e !== "hidden" && e !== "password";
}
function ot(t) {
  const e = t.target;
  if (!(e instanceof HTMLInputElement)) return;
  const i = !Bt.has(t);
  if (Bt.add(t), t.isTrusted !== !0 ? st.add(e) : i && st.delete(e), t.isTrusted === !0 && bt(e)) {
    if (!i) return;
    rt.add(e), e.addEventListener("input", ot, !0), e.addEventListener("change", ot, !0);
  } else
    rt.delete(e);
}
function Lr(t) {
  return bt(t) && (t.type === "email" || t.getAttribute("autocomplete") === "email" || nt.test(t.value.trim()));
}
function ye(t) {
  return t.attributeKeys.find((e) => e.toLowerCase() === "email");
}
const kr = 254;
function zi(t) {
  const e = /* @__PURE__ */ new Map();
  let i;
  return document.querySelectorAll("input").forEach((n) => {
    const r = rt.has(n);
    if (!r && !t || !bt(n)) return;
    const s = n.value.trim();
    r ? nt.test(s) && !e.has(s.toLowerCase()) && e.set(s.toLowerCase(), s) : i !== "untrusted_fill" && s.length <= kr && nt.test(s) && (i = st.has(n) ? "untrusted_fill" : "unseen_fill");
  }), { emails: e, unfilled: i };
}
function Rr() {
  const { emails: t } = zi(!1);
  return t.size === 1 ? t.values().next().value : void 0;
}
function Pt(t, e, i = {}) {
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
    (o) => Object.keys(o).some((a) => n.has(a.toLowerCase()) && !T(F(o, a)))
  );
}
const Cr = ["email", "emailsha256"];
function wt(t, e) {
  const i = t.toLowerCase();
  return Cr.includes(i) || m(e) && i === e.toLowerCase();
}
function Ne(t, e, i) {
  return t.getOutgoingAttributes ? Ae(t.getOutgoingAttributes(e, i), t.mappedEmailSha256Key) : Ae(e, t.mappedEmailSha256Key) || Ae(t.getUserIdentities?.() ?? {}, t.mappedEmailSha256Key);
}
function Ae(t, e) {
  return Object.keys(t).some(
    (i) => wt(i, e) && !T(F(t, i))
  );
}
function St(t, e, i, n = {}) {
  return e.readEmailInput !== !0 ? "read_disabled" : Z(e.pathname, window.location.pathname) ? t.isForwardingAllowed?.() !== !0 || t.isPreselectionPrivacyAllowed?.() === !1 || t.isTargetingDisabled?.() === !0 ? "privacy_blocked" : t.isEmailIdentityFiltered?.() === !0 ? "email_filtered" : Pt(t, i, n) ? "partner_email" : void 0 : "off_route";
}
function Dr(t, e, i, n) {
  const r = St(t, e, i, n.EventAttributes ?? {});
  if (r) return r;
  const { emails: s, unfilled: o } = zi(!0);
  return s.size > 1 ? "multiple_emails" : o ?? "no_field";
}
function Or(t, e, i) {
  const n = window.location.pathname, r = O(e.accountId, n), s = r && ye(r);
  return !!s && t.pending.some(
    (o) => o.pathname === n && !St(e, r, s, o.event.EventAttributes ?? {})
  ) && i.isTrusted === !0 && Lr(i.target);
}
function qi(t, e, i, n) {
  const r = ye(e);
  if (!r || !T(F(i, r)) || St(t, e, r, n.EventAttributes ?? {}))
    return;
  const s = Rr();
  if (s)
    return i[r] = s, r;
}
function Tt(t, e) {
  const i = ye(e);
  return k(t.filteredUser) || e.readEmailInput === !0 && !!i && Lt(t, e, {}).includes(i);
}
function Ur(t) {
  return !!t && K(t).some((e) => e.readEmailInput === !0);
}
function Re(t) {
  return t.length > 0 ? t.join(",") : "none";
}
function L(t) {
  const e = t?.getMPID?.();
  return e == null ? null : String(e);
}
function Xi(t, e) {
  const i = me(t.filteredUser), n = t.getCurrentUser?.(), r = me(n), s = L(t.filteredUser), o = L(n), a = [...e.identityKeys ?? [], "email", "emailsha256"];
  t.mappedEmailSha256Key && a.push(t.mappedEmailSha256Key);
  const c = new Set(a.map((h) => h.toLowerCase())), l = n?.getAllUserAttributes?.() ?? {}, u = [t.userAttributes, l].some(
    (h) => Object.entries(h).some(
      ([f, y]) => c.has(f.toLowerCase()) && m(y) && y.length > 0
    )
  );
  let d = "no_identities";
  return t.filteredUser ? o !== null && s !== o ? d = "mpid_mismatch" : r.length > 0 && (d = "kit_user_lacks_identities") : d = "no_filtered_user", {
    identity_reason: d,
    kit_identity_types: Re(i),
    current_identity_types: Re(r),
    mpid_match: o === null ? "unknown" : s === o,
    identity_attribute_present: u
  };
}
function Lt(t, e, i) {
  const n = t.getPreselectVariant?.() === "widened" ? e.widenedOptionalAttributeKeys ?? [] : [], r = new Set(
    [...e.optionalAttributeKeys ?? [], ...n].map((s) => s.toLowerCase())
  );
  return e.attributeKeys.filter(
    (s) => !r.has(s.toLowerCase()) && T(F(i, s))
  );
}
function oe(t, e, i, n = !0) {
  const r = t.filteredUser?.getAllUserAttributes?.() || {}, s = new Set(i.identityKeys ?? []);
  let o;
  const a = {};
  for (const l of i.attributeKeys) {
    const u = t.getEventAttributeValue(e, l), d = F(t.userAttributes, l);
    let h = T(u) ? T(d) ? F(r, l) : d : u;
    if (T(h) && s.has(l)) {
      o || (o = t.getUserIdentities?.() ?? {});
      const f = F(o, l);
      h = m(f) && f !== "" ? f : void 0;
    }
    T(h) || (a[l] = h);
  }
  const c = n ? qi(t, i, a, e) : void 0;
  return {
    collected: a,
    missingKeys: Lt(t, i, a),
    formEmailKey: c
  };
}
const Ji = /* @__PURE__ */ new WeakMap();
function Kr(t) {
  return Ji.get(t);
}
function Nr(t, e, i) {
  i && Ji.set(e, i);
  const n = (s) => {
    i?.();
    const o = e[Te] ? "redacted" : s instanceof Error ? s.message : String(s);
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
const zt = /* @__PURE__ */ new Map(), qt = /* @__PURE__ */ new Map();
function Xt(t, e, i) {
  const n = t.get(e), r = { previous: i, earlier: n };
  return n && (n.later = r), t.set(e, r), r;
}
function Jt(t, e, i, n) {
  const { earlier: r, later: s } = i;
  if (s) {
    s.previous = i.previous, s.earlier = r, r && (r.later = s);
    return;
  }
  n(i.previous), r && (r.later = void 0), t.get(e) === i && (r ? t.set(e, r) : t.delete(e));
}
function Fe(t, e, i, n) {
  try {
    const r = JSON.stringify(
      it(
        n,
        Le(e, i)?.preselectAttributeOverrides
      )
    ), s = t.getOutgoingAttributes ? t.getOutgoingAttributes(n, i) : { ...t.getUserIdentities?.() ?? {}, ...n }, o = Object.keys(s).sort().filter((a) => wt(a, t.mappedEmailSha256Key) && !T(F(s, a))).map((a) => [a, F(s, a)]);
    return dt(o.length > 0 ? `${r}|${JSON.stringify(o)}` : r);
  } catch {
    return;
  }
}
function kt(t) {
  return !t.isTargetingDisabled?.() && t.isPreselectionPrivacyAllowed?.() !== !1 && t.isForwardingAllowed?.() !== !1;
}
function Me(t, e, i, n, r, s, o, a = !1, c, l = a, u, d, h) {
  if (!kt(t))
    return !1;
  const f = pt(e, i), y = Fe(t, e, n, r), g = c ? { intent_kind: c.replace("intent_", "") } : {};
  if (c && yt(e, n, y, c !== "intent_cart"))
    return t.logPlacementDiagnostic(A("skipped", "active_preselection", g)), !0;
  if (a && Q(f)?.byEvent)
    return t.logPlacementDiagnostic(A("skipped", "active_preselection")), !1;
  const _ = y !== void 0 ? Q(f) : null;
  if (y !== void 0) {
    if (_?.attributesDigest === y)
      return t.logPlacementDiagnostic(A("skipped", "active_preselection", g)), !0;
    Tn(
      f,
      y,
      l || !!c && Q(f)?.byEvent === !0
    );
  }
  t.logPlacementDiagnostic(
    A("fired", s, {
      identity_types: Re(me(t.filteredUser)),
      ...u ? { email_source: "input" } : {},
      ...c ? {
        ...g,
        intent_route: h ? h.route : "entry",
        ...d ? { intent_source: d } : {},
        ...h ? { logged_in: h.loggedIn } : {}
      } : {}
    })
  );
  const b = `${e}:${n}`, R = Xt(
    zt,
    b,
    qn(e, n, y, c === "intent_cart")
  ), C = y !== void 0 ? Xt(qt, f, _) : void 0;
  let P = !1;
  const M = () => {
    P || (P = !0, C && Jt(
      qt,
      f,
      C,
      (w) => Ln(f, w, y)
    ), Jt(
      zt,
      b,
      R,
      (w) => Xn(e, n, w, y)
    ));
  };
  return Nr(t, {
    attributes: { ...r, [Yi]: o },
    preselect: !0,
    identifier: n,
    omitUrl: !0,
    ...u ? { [Te]: { key: u, mpid: L(t.filteredUser) } } : {},
    ...h ? { [tt]: { mpid: L(t.filteredUser), requireLogin: h.requireLogin } } : {}
  }, M), !0;
}
function Fr(t, e) {
  if (!e.accountId || !e.isKitReady())
    return;
  const i = ht(e.accountId);
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
  if (!k(e.filteredUser) || (G(e.accountId), L(e.filteredUser) !== i.mpid))
    return;
  const n = O(e.accountId, i.pathname);
  if (!n || n.targetPageIdentifier !== i.identifier)
    return;
  if (!i.byEvent && X(e)) {
    e.logPlacementDiagnostic(A("missed", "recovery_awaits_intent"));
    return;
  }
  const r = Y(i.attributes), s = Lt(e, n, r);
  if (s.length > 0) {
    for (const o of s)
      e.logPlacementDiagnostic(A("missed", `missing_persisted_attribute:${o}`));
    return;
  }
  Me(
    e,
    e.accountId,
    i.identifier,
    i.identifier,
    r,
    "recovered",
    Ke("recovered", n)
  );
}
function Rt(t) {
  return !t.isTargetingDisabled?.() && t.isPreselectionPrivacyAllowed?.() !== !1 && t.isKitReady() && t.isPreselectionEnabled();
}
function xe(t) {
  return t === void 0 ? {} : { since_trigger_ms: Date.now() - t };
}
function Qi(t, e, i) {
  if (e.waitingFor !== "intent" || e.intentSeen)
    return !1;
  const n = O(t.accountId, e.pathname);
  return !!n && n === O(t.accountId, i);
}
function at(t, e) {
  Rt(t) && t.logPlacementDiagnostic(
    A("missed", "left_trigger_path", {
      waiting_for: e.waitingFor,
      has_identity: k(t.filteredUser),
      ...xe(e.triggeredAt)
    })
  );
}
function ne(t, e, i, n = window.location.pathname, r, s = Date.now(), o) {
  const a = t.pending.filter((u) => u.pathname !== n);
  if (a.length > 0) {
    const u = e.accountId ? ht(e.accountId) : null;
    e.accountId && u && a.some((d) => d.pathname === u.pathname) && G(e.accountId), a.forEach((d) => {
      Qi(e, d, n) ? t.intentWaitMovedWithin = O(e.accountId, n) : at(e, d);
    }), t.pending = t.pending.filter((d) => d.pathname === n);
  }
  const c = vt(t), l = c !== void 0 && c.pathname === n && ie(c.event);
  if (c && !l) {
    const u = O(e.accountId, c.pathname);
    v(c.pathname) !== v(n) && u?.releaseHoldOnRouteChange ? (Zi(t, e, c, "hold_released_on_route_change"), t.pending = t.pending.filter((d) => d.pathname === c.pathname ? (at(e, d), !1) : !0)) : Qt(e, c, n);
  }
  Mr(t, e, i, n, r, s, l, o), l && t.scheduledDispatch === void 0 && Qt(e, c, n);
}
function Qt(t, e, i) {
  t.logPlacementDiagnostic(
    A("missed", "hold_cancelled", {
      held_ms: Date.now() - e.heldAt,
      same_path: e.pathname === i
    })
  );
}
function Mr(t, e, i, n, r, s, o, a) {
  const c = t.pending.find((u) => v(u.pathname) === v(n));
  if (a ?? (a = pe(i) ?? c?.intentSeen ?? pe(c?.event)), e.isTargetingDisabled?.() || e.isPreselectionPrivacyAllowed?.() === !1)
    return;
  const l = O(e.accountId, n);
  if (!l) {
    xr(e, n);
    return;
  }
  if (!(r !== void 0 && L(e.filteredUser) !== r)) {
    if (!a && !ee(l, i) && X(e)) {
      const u = t.intentWaitMovedWithin === l;
      t.intentWaitMovedWithin = void 0;
      const d = u || c?.waitingFor === "intent" && c.awaitingIntentLogged === !0, h = e.isKitReady() && e.isPreselectionEnabled();
      H(t, e, {
        event: i,
        pathname: n,
        // Bound to an identified shopper, as a timer hold is, so another user's click never sends
        // this page view's attributes. A guest stays unbound so signing in at checkout still fires.
        triggeringUserId: r ?? (k(e.filteredUser) ? L(e.filteredUser) : void 0),
        triggeredAt: s,
        waitingFor: "intent",
        awaitingIntentLogged: d || h
      }), !d && h && e.logPlacementDiagnostic(A("held", "awaiting_intent")), h && ct(e, l, i);
      return;
    }
    if (!e.isKitReady()) {
      if (Bi(t, e, i, n))
        return;
      const u = [], d = L(e.filteredUser);
      if (e.accountId && d && k(e.filteredUser)) {
        const { collected: h, missingKeys: f, formEmailKey: y } = oe(e, i, l);
        if (f.length === 0 && !y) {
          const g = Y(h);
          (ee(l, i) || !!a ? $t(
            e.accountId,
            n,
            l.targetPageIdentifier,
            g,
            d,
            !0
          ) : $t(e.accountId, n, l.targetPageIdentifier, g, d)) || u.push(A("queued", "persist_failed"));
        }
      }
      H(t, e, {
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
      if (ct(e, l, i), !Tt(e, l)) {
        e.logPlacementDiagnostic(
          A("missed", "no_valid_identity", Xi(e, l))
        ), H(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "identity" });
        return;
      }
      if (l.dispatchDelayMs !== void 0 && !ee(l, i) && !_e(i) && !a) {
        const u = L(e.filteredUser), d = Math.min(
          l.dispatchDelayMs,
          Math.max(0, s + l.dispatchDelayMs - Date.now())
        );
        t.scheduledDispatch = { event: i, pathname: n, heldAt: Date.now(), heldForUserId: u, triggeredAt: s }, o || e.logPlacementDiagnostic(A("held", "dispatch_delay", { delay_ms: d })), t.dispatchTimer = setTimeout(() => {
          t.dispatchTimer = void 0, t.scheduledDispatch = void 0, en(t, e.getCurrentHost?.() ?? e, i, n, u, s);
        }, d);
        return;
      }
      tn(
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
function ct(t, e, i) {
  if (!t.accountId) return;
  const n = ye(e), r = e.readEmailInput === !0 && !!n && (Pt(t, n, i.EventAttributes ?? {}) || qi(t, e, {}, i) !== void 0);
  Gn(
    t.accountId,
    e.targetPageIdentifier,
    k(t.filteredUser) || r
  );
}
function xr(t, e) {
  const i = t.accountId;
  !i || t.isKitReady() && !t.isPreselectionEnabled() || K(i).forEach((n) => {
    nr(n.pathname, e) && zn(i, n.targetPageIdentifier);
  });
}
function Vr(t) {
  const e = S[S.length - 1];
  return t !== void 0 && (e === void 0 || t < e.since);
}
function Wr() {
  try {
    return new URL(document.referrer).origin === window.location.origin ? "same_origin" : "other_origin";
  } catch {
    return "none";
  }
}
function X(t) {
  return t.isCheckoutIntentActive?.() === !0 && t.isPreselectionPrivacyAllowed?.() !== !1;
}
function Zi(t, e, i, n, r) {
  en(
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
function en(t, e, i, n, r, s, o, a) {
  const c = O(e.accountId, n);
  if (!(!c || e.isTargetingDisabled?.() || e.isPreselectionPrivacyAllowed?.() === !1)) {
    if (!a && !ee(c, i) && !_e(i) && X(e)) {
      const l = e.isKitReady() && e.isPreselectionEnabled();
      H(t, e, {
        event: i,
        pathname: n,
        triggeringUserId: r,
        triggeredAt: s,
        waitingFor: "intent",
        awaitingIntentLogged: l
      }), l && e.logPlacementDiagnostic(A("held", "awaiting_intent"));
      return;
    }
    if (!e.isKitReady()) {
      H(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "launcher" });
      return;
    }
    if (e.isPreselectionEnabled()) {
      if (!Tt(e, c)) {
        e.logPlacementDiagnostic(
          A("missed", "no_valid_identity", Xi(e, c))
        ), H(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "identity" });
        return;
      }
      L(e.filteredUser) === r && tn(t, e, i, n, c, r, s, o, a);
    }
  }
}
function tn(t, e, i, n, r, s, o, a, c, l) {
  if (e.isPreselectionPrivacyAllowed?.() === !1) return;
  const { collected: u, missingKeys: d, formEmailKey: h } = oe(e, i, r), f = t.lastResolvedPageView, y = S[S.length - 1], g = v(n);
  if (_e(i) && f && f.accountId === e.accountId && f.pathname === g && f.route === y && f.userId === L(e.filteredUser) && f.identifier === r.targetPageIdentifier && f.attributeKeys.some(
    (P) => r.attributeKeys.includes(P) && T(F(u, P))
  ))
    return;
  if (d.length > 0) {
    const P = me(e.filteredUser), M = ye(r);
    for (const w of d)
      e.logPlacementDiagnostic(
        A("missed", `missing_attribute:${w}`, {
          identity_types: Re(P),
          key_is_identity: P.some((Ee) => Ee.toLowerCase() === w.toLowerCase()),
          ...w === M ? { email_reason: Dr(e, r, w, i) } : {}
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
  const _ = c ?? pe(i);
  if (_ && !Ne(e, u, r.targetPageIdentifier)) {
    t.noEmailLoggedPathname !== g && (t.noEmailLoggedPathname = g, e.logPlacementDiagnostic(
      A("missed", "no_strict_email", {
        intent_kind: _.replace("intent_", ""),
        has_identity: k(e.filteredUser)
      })
    )), H(t, e, {
      event: i,
      pathname: n,
      triggeringUserId: s,
      triggeredAt: o,
      intentSeen: _,
      waitingFor: "attribute"
    });
    return;
  }
  t.noEmailLoggedPathname = void 0, l && (t.pending = t.pending.filter((P) => P !== l));
  const b = ee(r, i), R = _ ?? (b ? "event" : ie(i) ? "pathname" : "pageview");
  Me(
    e,
    e.accountId || "",
    v(n),
    r.targetPageIdentifier,
    u,
    a ?? (_ ? "intent" : b ? "event_trigger" : "fired"),
    Ke(R, r),
    b && !_,
    _,
    b,
    h,
    _ ? t.intentSource : void 0
  ) && (ke(i) || b) && (t.lastResolvedPageView = {
    accountId: e.accountId,
    pathname: g,
    route: y,
    userId: L(e.filteredUser),
    identifier: r.targetPageIdentifier,
    attributeKeys: Object.keys(u)
  });
}
const Hr = ["", "0", "[]", "{}", "false", "null"];
function jr(t) {
  if (T(t)) return !1;
  if (Array.isArray(t)) return !0;
  const e = String(t).trim();
  if (Hr.includes(e.toLowerCase())) return !1;
  try {
    const i = JSON.parse(e);
    return !Array.isArray(i) || i.length > 0;
  } catch {
    return !0;
  }
}
function Ct(t) {
  const e = t ? Oe(t) : [];
  return e.length === 1 && e[0].cartUserAttribute ? e[0] : void 0;
}
function $r(t, e) {
  const i = Ct(t)?.cartUserAttribute;
  return m(i) && i.toLowerCase() === e.toLowerCase();
}
function Zt(t, e, i) {
  const n = Ct(t)?.cartUserAttribute?.toLowerCase();
  if (!n || i && Gi(i).some((s) => s.toLowerCase() === n))
    return e;
  const r = {};
  for (const [s, o] of Object.entries(e))
    s.toLowerCase() !== n && (r[s] = o);
  return r;
}
function Yr(t, e) {
  const i = t.filteredUser?.getAllUserAttributes?.() ?? {}, n = Object.keys(i).find((r) => r.toLowerCase() === e.toLowerCase());
  return n === void 0 ? void 0 : i[n];
}
function ei(t, e, i = window.location.pathname) {
  t.cartPageViewPathname = v(i), nn(t, e, i);
}
function nn(t, e, i) {
  const n = Ct(e.accountId);
  if (!n || t.cartPageViewPathname !== v(i) || Z(n.pathname, i) || !kt(e)) {
    t.cartPageViewPathname = void 0;
    return;
  }
  if (!e.isKitReady()) return;
  if (!e.isPreselectionEnabled()) {
    t.cartPageViewPathname = void 0;
    return;
  }
  if (!jr(Yr(e, n.cartUserAttribute)) || !k(e.filteredUser)) return;
  const r = e.accountId, { collected: s, missingKeys: o } = oe(e, rr, n, !1);
  if (o.length > 0 || !Ne(e, s, n.targetPageIdentifier)) return;
  t.cartPageViewPathname = void 0;
  const a = Fe(e, r, n.targetPageIdentifier, s), c = Q(pt(r, n.targetPageIdentifier));
  yt(r, n.targetPageIdentifier, a) || a !== void 0 && c?.attributesDigest === a || Me(
    e,
    r,
    n.targetPageIdentifier,
    n.targetPageIdentifier,
    s,
    "fired",
    Ke("pageview_cart", n),
    !1,
    void 0,
    !1,
    void 0,
    void 0,
    { requireLogin: !1 }
  );
}
function Gr(t, e, i = window.location.pathname) {
  if (Fr(t, e), ur(t, e), t.cartPageViewPathname !== void 0 && nn(t, e, i), t.pending.length === 0)
    return;
  const n = t.pending;
  t.pending = [], n.forEach((r) => {
    const { event: s, pathname: o, storedDiagnostics: a, triggeringUserId: c, triggeredAt: l, waitingFor: u, intentSeen: d } = r, h = Rt(e), f = k(e.filteredUser), y = xe(l);
    if (h && u === "identity" && f && e.logPlacementDiagnostic(
      A("identity_arrived", "pending_identity", {
        ...y,
        on_trigger_path: o === i
      })
    ), o !== i) {
      Qi(e, r, i) ? t.intentWaitMovedWithin = O(e.accountId, i) : at(e, { waitingFor: u, triggeredAt: l });
      return;
    }
    if (u === "intent" && !d) {
      const g = O(e.accountId, o);
      if (g && X(e)) {
        !r.awaitingIntentLogged && e.isKitReady() && e.isPreselectionEnabled() && (e.logPlacementDiagnostic(A("held", "awaiting_intent")), ct(e, g, s), r.awaitingIntentLogged = !0), t.pending.push(r);
        return;
      }
    }
    h && a?.forEach((g) => e.logPlacementDiagnostic(g)), t.scheduledDispatch?.pathname !== o && ne(t, e, s, o, c, l, d);
  });
}
function Br(t, e, i) {
  if (!t.accountId || !Rt(t))
    return;
  const n = Le(t.accountId, e);
  if (!n)
    return;
  const r = tr(t.accountId, n.targetPageIdentifier);
  if (!r || (X(t) && t.isForwardingAllowed?.() !== !1 && t.logPlacementDiagnostic(
    A("arrived", "intent_arrival", {
      ...zr(r),
      ...qr(r, i)
    })
  ), r.firedAt !== void 0))
    return;
  const s = r.triggeredAt !== void 0;
  t.logPlacementDiagnostic(
    A("missed", "arrival_without_fire", {
      trigger_seen: s,
      identity_seen_on_trigger_path: r.identitySeenAt !== void 0,
      has_identity: k(t.filteredUser),
      // Another tab's checkout caches its offers in that tab, so this arrival still misses. This tab's
      // own trigger counts too: the device marker can expire, be cleared by another tab or fail to save.
      trigger_seen_any_tab: s || Bn(t.accountId, n.targetPageIdentifier),
      ...xe(r.triggeredAt),
      near_miss_seen: Vr(r.nearMissAt),
      // Page memory loses the trigger record on a full navigation, so trigger_seen reads false.
      storage: dn() ? "page" : "device",
      referrer: Wr()
    })
  );
}
function zr(t) {
  const e = t.intentAt === void 0 || t.intentKind === void 0 ? "none" : Jr(Date.now() - t.intentAt);
  return {
    intent_seen: e === "none" ? "none" : t.intentKind,
    lead: e,
    fired: t.firedAt !== void 0
  };
}
function qr(t, e) {
  const i = Hn(e), n = t.paymentPickAt === void 0 ? -1 : Date.now() - t.paymentPickAt, r = t.paymentPick && n >= 0 && n < te ? t.paymentPick : "none";
  if (r === "none" && i === "absent")
    return {};
  const s = t.firedAt === void 0 ? -1 : Date.now() - t.firedAt, o = t.paymentAtFire && s >= 0 && s < te ? t.paymentAtFire : "none";
  return {
    payment_guess: o,
    payment_pick: r,
    payment_arrival: i,
    payment_match: o !== "none" && i !== "absent" && i !== "other" ? o === i : "n/a"
  };
}
const Xr = [
  [1e3, "lt1s"],
  [2e3, "1s_2s"],
  [5e3, "2s_5s"],
  [1e4, "5s_10s"],
  [2e4, "10s_20s"],
  [6e4, "20s_60s"],
  [3e5, "60s_300s"],
  [te, "300s_1800s"]
];
function Jr(t) {
  if (t < 0)
    return "none";
  const e = Xr.find(([i]) => t < i);
  return e ? e[1] : "none";
}
function Qr() {
  return {
    context: null,
    lifecycle: "idle",
    recreateInFlight: null
  };
}
function Zr(t, e) {
  t.context = {
    accountId: e.accountId,
    launcherOptions: { ...e.launcherOptions },
    legacyRoktExtensions: [...e.legacyRoktExtensions]
  };
}
function es(t) {
  t.lifecycle = "attached";
}
function ts(t) {
  t.lifecycle !== "idle" && (t.lifecycle = "terminated");
}
function is(t) {
  t.lifecycle = "terminated";
}
function ns(t) {
  t.context = null, t.lifecycle = "idle", t.recreateInFlight = null;
}
function rs(t, e, i) {
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
const ti = "rokt:intent", ii = "LEAD_CAPTURE_SUBMITTED";
class ss {
  constructor(e) {
    this.handlers = e, this.config = null, this.dispatchedForPageView = !1;
  }
  configure(e) {
    this.config = e, this.dispatchedForPageView = !1, this.detachListeners(), this.isIdentityCaptureBridgeEnabled(this.config) && (this.leadCaptureSubmittedListener = (i) => {
      const n = this.parseLeadCaptureSubmittedPayload(i);
      n && this.handlers.onLeadCaptureSubmitted(n);
    }, window.addEventListener(ii, this.leadCaptureSubmittedListener)), this.isExitIntentBridgeEnabled(this.config) && (this.exitIntentListener = (i) => this.handleExitIntentEvent(i), window.addEventListener(ti, this.exitIntentListener));
  }
  resetPageViewState() {
    this.dispatchedForPageView = !1;
  }
  dispose() {
    this.detachListeners(), this.config = null, this.dispatchedForPageView = !1;
  }
  detachListeners() {
    this.exitIntentListener && (window.removeEventListener(ti, this.exitIntentListener), this.exitIntentListener = void 0), this.leadCaptureSubmittedListener && (window.removeEventListener(ii, this.leadCaptureSubmittedListener), this.leadCaptureSubmittedListener = void 0);
  }
  isExitIntentBridgeEnabled(e) {
    return !!(e && e.enabled !== !1);
  }
  isIdentityCaptureBridgeEnabled(e) {
    if (!this.isExitIntentBridgeEnabled(e))
      return !1;
    const i = e ? e.identityCapture : void 0;
    return E(i) ? i.enabled === !0 : !1;
  }
  allowCustomUserAttributes(e) {
    const i = e ? e.identityCapture : void 0;
    return E(i) ? i.allowCustomUserAttributes === !0 : !1;
  }
  getAllowedUserAttributeKeys(e) {
    const i = e ? e.identityCapture : void 0;
    if (!E(i))
      return /* @__PURE__ */ new Set();
    const n = i.allowedUserAttributeKeys;
    if (!Array.isArray(n))
      return /* @__PURE__ */ new Set();
    const r = n.filter((s) => m(s)).map((s) => s.trim()).filter((s) => s.length > 0);
    return new Set(r);
  }
  extractExitIntentReason(e) {
    return e instanceof CustomEvent && e.detail && m(e.detail.reason) ? e.detail.reason : "unknown";
  }
  handleExitIntentEvent(e) {
    const i = this.extractExitIntentReason(e);
    if (this.dispatchedForPageView || !this.handlers.isKitReady() || !(i === "mouse-exit-top" || i === "scroll-up-fast" || i === "idle" || i === "leave-link"))
      return;
    this.dispatchedForPageView = !0;
    const r = this.config && E(this.config.attributes) ? this.config.attributes : {};
    this.handlers.onExitIntent(
      i,
      r
    ) || (this.dispatchedForPageView = !1);
  }
  parseLeadCaptureSubmittedPayload(e) {
    if (!(e instanceof CustomEvent) || !E(e.detail))
      return null;
    const i = e.detail;
    if (!E(i.body))
      return null;
    const n = i.body, r = m(n.email) ? n.email : void 0, s = m(n.mobile_number) ? n.mobile_number : void 0, o = {};
    m(r) && r.length > 0 && (o.email = r), m(s) && s.length > 0 && (o.mobile_number = s);
    const a = {}, c = this.allowCustomUserAttributes(this.config), l = this.getAllowedUserAttributeKeys(this.config);
    this.mergeLeadCaptureUserAttributes(
      a,
      E(n.userAttributes) ? n.userAttributes : null,
      c,
      l
    );
    const u = m(n.rclid) ? n.rclid : void 0;
    u && u.length > 0 && (a.rokt_rclid = u);
    const d = m(n.accountID) ? n.accountID : void 0;
    d && d.length > 0 && (a.rokt_account_id = d);
    const h = m(n.referralCreativeID) ? n.referralCreativeID : void 0;
    return h && h.length > 0 && (a.rokt_referral_creative_id = h), { identities: o, userAttributes: a };
  }
  isSafeLeadCaptureUserAttributeKey(e) {
    return e === "__proto__" || e === "constructor" || e === "prototype" ? !1 : /^[a-zA-Z0-9_.-]+$/.test(e);
  }
  isSupportedLeadCaptureUserAttributeValue(e) {
    return m(e) || typeof e == "number" || typeof e == "boolean" ? !0 : Array.isArray(e) ? e.every((i) => m(i)) : !1;
  }
  mergeLeadCaptureUserAttributes(e, i, n, r) {
    if (i)
      for (const [s, o] of Object.entries(i))
        !n || !r.has(s) || this.isSafeLeadCaptureUserAttributeKey(s) && this.isSupportedLeadCaptureUserAttributeValue(o) && (e[s] = o);
  }
}
const D = "Rokt", os = 7, ve = 181, as = "selectPlacements", cs = "apps.roktecommerce.com", ls = 0.1, us = "ThankYouPageJourney", ds = "rokt-launcher", fs = "rokt-thank-you-element", gs = "userIdentifiedInWorkspace", ni = 3, ps = 2, ms = "page_events", hs = "page_view_attributes", _s = "mparticle_session_id", ri = "mparticle_device_id", Ge = "exit-intent", ys = [
  "3479519924056514560",
  "3484183287406608384",
  "3198447216177237634",
  "3292347205549055462"
], Es = "exit-intent-placement", si = 500, Dt = {
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  UNHANDLED_EXCEPTION: "UNHANDLED_EXCEPTION",
  IDENTITY_REQUEST: "IDENTITY_REQUEST",
  LOG_DELIVERY_FAILURE: "LOG_DELIVERY_FAILURE"
}, de = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARNING: "WARNING"
}, Is = "apps.rokt-api.com", As = "/v1/log", vs = "/v1/errors", bs = 10;
function p() {
  return window.mParticle;
}
function oi(t, e) {
  const n = [Ve(t), "/wsdk/integrations/launcher.js"].join("");
  return !e || e.length === 0 ? n : n + "?extensions=" + e.join(",");
}
function ai(t) {
  return [Ve(t), "/rokt-elements/rokt-element-thank-you.js"].join("");
}
function Ve(t) {
  const e = t !== void 0 ? t : Is;
  return e.includes("://") ? e.replace(/\/+$/, "") : ["https://", e].join("");
}
function rn(t, e, i) {
  if (t)
    return t.startsWith("http://") || t.startsWith("https://") ? t : "https://" + t;
  const r = e?.includes("://") && !/^https?:\/\//i.test(e) ? void 0 : e;
  return Ve(r) + i;
}
function ci(t, e, i) {
  if (document.getElementById(t)) return;
  const n = document.head || document.body, r = document.createElement("script");
  r.id = t, r.type = "text/javascript", r.src = e, r.async = !0, r.crossOrigin = "anonymous", r.fetchPriority = "high", i?.onLoad && (r.onload = i.onLoad), i?.onError && (r.onerror = i.onError), n.appendChild(r);
}
function be(t) {
  if (!t)
    return [];
  const e = yi(t);
  return e === void 0 ? (console.error("Settings string contains invalid JSON"), []) : e;
}
function li(t) {
  const e = t ? be(t) : [], i = [], n = [];
  let r = !1;
  for (let s = 0; s < e.length; s++) {
    const o = e[s].value;
    o === "thank-you-journey" ? (r = !0, n.push(us)) : i.push(o);
  }
  return {
    roktExtensionsQueryParams: i,
    legacyRoktExtensions: n,
    loadThankYouElement: r
  };
}
async function Ps(t, e) {
  const i = [];
  if (e)
    for (const n of t)
      i.push(e.use(n));
  return Promise.all(i);
}
function ui(t) {
  if (!t)
    return {};
  const e = {};
  for (let i = 0; i < t.length; i++) {
    const n = t[i];
    e[n.jsmap] = n.value;
  }
  return e;
}
function di(t) {
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
function fi(t, e, i) {
  return p().generateHash([t, e, i].join(""));
}
function ws(t) {
  let n = "mParticle_wsdkv_" + p().getVersion() + "_kitv_" + "3.25.0";
  return t && (n += "_" + t), n;
}
function gi(t) {
  return !!(t && ys.includes(t));
}
function lt(t) {
  const e = document.createElement("iframe");
  e.style.display = "none", e.setAttribute("sandbox", "allow-scripts allow-same-origin"), e.src = t, e.onload = function() {
    e.onload = null, e.parentNode && e.parentNode.removeChild(e);
  };
  const i = document.body || document.head;
  i && i.appendChild(e);
}
function pi(t, e) {
  const i = dt(window.location.origin);
  if (re._allowedOriginHashes.indexOf(i) === -1 || Math.random() >= ls)
    return;
  const r = window.__rokt_li_guid__;
  if (!r || t && t.includes("://") && !/^https:\/\//i.test(t))
    return;
  const s = ut(window.location.href), o = "version=" + encodeURIComponent(e ?? "") + "&launcherInstanceGuid=" + encodeURIComponent(r) + "&pageUrl=" + encodeURIComponent(s), a = t ? Ve(t) : "https://apps.rokt.com";
  lt(a + "/v1/wsdk-init/index.html?" + o), lt(
    "https://" + cs + "/v1/wsdk-init/index.html?" + o + "&isControl=true"
  );
}
function Ss() {
  return typeof window < "u" && !!window.location?.search?.toLowerCase().includes("mp_enable_logging=true");
}
function Ts() {
  if (typeof window > "u")
    return;
  const t = window.location?.href;
  return t ? ut(t) : void 0;
}
function Ls() {
  return typeof window < "u" ? window.navigator?.userAgent : void 0;
}
class sn {
  constructor() {
    this._logCount = {};
  }
  incrementAndCheck(e) {
    const n = (this._logCount[e] || 0) + 1;
    return this._logCount[e] = n, n > bs;
  }
}
class fe {
  constructor(e, i, n, r, s) {
    this._reporter = "mp-wsdk";
    const o = e.isLoggingEnabled;
    this._integrationName = i || "", this._launcherInstanceGuid = n, this._accountId = r || null, this._rateLimiter = s || new sn(), this._isEnabled = Ss() || o;
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
          code: r || Dt.UNKNOWN_ERROR,
          url: Ts(),
          deviceInfo: Ls(),
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
class mi {
  constructor(e, i, n, r, s) {
    this._transport = new fe(e, i, n, r, s), this._errorUrl = rn(e?.errorUrl, e?.integrationDomain, vs);
  }
  report(e) {
    if (!e) return;
    const i = e.severity || de.ERROR;
    this._transport.send(this._errorUrl, i, e.message, e.code, e.stackTrace);
  }
}
class hi {
  constructor(e, i, n, r, s, o) {
    this._intentObserveLines = 0, this._transport = new fe(e, n, r, s, o), this._placementDiagnosticTransport = new fe(
      e,
      n,
      r,
      s
    ), this._preselectOutcomeTransport = new fe(e, n, r, s), this._loggingUrl = rn(e?.loggingUrl, e?.integrationDomain, As), this._errorReportingService = i;
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
      de.INFO,
      i.message,
      i.code,
      void 0,
      (n) => {
        if (this._errorReportingService) {
          const r = typeof n.statusCode == "number";
          this._errorReportingService.report({
            message: "LoggingService: Failed to send log: " + n.message,
            code: Dt.LOG_DELIVERY_FAILURE,
            severity: r ? de.ERROR : de.WARNING
          });
        }
      }
    );
  }
}
function ks(t, e) {
  const i = Pe(window.location.href), n = t.EventAttributes?.title, r = m(n) ? n : void 0, s = Pi(t.EventAttributes, e) ? r : r || document.title, o = En(), a = t.ActiveTimeOnSite;
  return {
    pageUrl: i,
    sourceMessageId: t.SourceMessageId,
    timestamp: t.Timestamp,
    ...s ? { pageTitle: s } : {},
    ...o !== void 0 ? { canonicalUrl: o } : {},
    ...Number.isFinite(a) ? { activeTimeOnSite: a } : {}
  };
}
const W = class W {
  constructor() {
    this.name = D, this.id = ve, this.moduleId = ve, this.isInitialized = !1, this.launcher = null, this.filters = {}, this.userAttributes = {}, this.userIdentifiedInWorkspace = !1, this.testHelpers = null, this.placementEventMappingLookup = {}, this.placementEventAttributeMappingLookup = {}, this.integrationName = null, this.errorReportingService = null, this.loggingService = null, this._thankYouElementOnLoadCallback = null, this._isThankYouElementLoaded = !1, this._workspaceSearchInFlightPromise = null, this._launcherAttachState = Qr(), this._exitIntentConfig = null, this._exitIntentWatcher = new ss({
      isKitReady: () => this.isKitReady(),
      onExitIntent: (e, i) => this.handleExitIntent(e, i),
      onLeadCaptureSubmitted: (e) => this.applyIdentityCapturePayload(e.identities, e.userAttributes)
    }), this._exitIntentEnabledForAccount = !1, this._pendingInitWarnings = [], this.accountId = null, this._preselectState = wr();
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
      o && p().Rokt.setLocalSessionAttribute?.(r, !0);
    }
  }
  capturePageView(e, i) {
    let n;
    try {
      n = ut(window.location.href);
      const r = Ht(), s = ks(e, i);
      r.push(s);
      const o = Math.min(r.length, vi), a = mn(r);
      if (a === 0) {
        const c = Be() ? "quota" : "ls_unavailable";
        this.loggingService?.log({
          message: `Rokt Kit: Failed to persist page view for ${n} [reason: ${c}]`,
          code: "PAGE_VIEW_CAPTURE_FAILED"
        });
      } else a < o && this.loggingService?.log({
        message: `Rokt Kit: Page view storage reduced from ${o} to ${a} record(s) under quota pressure [reason: quota_eviction]`,
        code: "PAGE_VIEW_QUOTA_EVICTION"
      });
    } catch (r) {
      const s = Be() ? "exception" : "ls_unavailable", o = r instanceof Error ? r.message : String(r);
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
      return Le(this.accountId, e);
  }
  buildPreselectAttributeOverrides(e) {
    if (!this.isPreselectionEnabled())
      return;
    const i = Le(this.accountId, e)?.preselectAttributeOverrides, n = this.filters || {};
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
      getCurrentUser: () => p().Identity?.getCurrentUser?.(),
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
    Gr(this._preselectState, this.buildPreselectHost());
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
    return !p().Rokt || typeof p().Rokt.getLocalSessionAttributes != "function" ? {} : p().Rokt.getLocalSessionAttributes();
  }
  replaceOtherIdentityWithEmailsha256(e) {
    const i = { ...e || {} }, n = this._mappedEmailSha256Key;
    return n && e[n] && (i[W.EMAIL_SHA256_KEY] = e[n]), n && delete i[n], i;
  }
  logSelectPlacementsEvent(e) {
    if (!window.mParticle || typeof p().logEvent != "function" || !E(e))
      return;
    const i = p().EventType.Other;
    p().logEvent(as, i, e);
  }
  setRoktSessionId(e) {
    if (!(!e || typeof e != "string"))
      try {
        const i = p().getInstance();
        i && V(i.setIntegrationAttribute) && i.setIntegrationAttribute(ve, {
          roktSessionId: e
        });
      } catch {
      }
  }
  readMpSessionId() {
    const e = p()?.sessionManager, i = e?.getSessionId ?? e?.getSession;
    if (V(i))
      return i.call(e) || void 0;
  }
  readMpDeviceId() {
    if (!this.isDeviceIdDisabled())
      return p()?.getDeviceId?.() || void 0;
  }
  attachLauncher(e, i, n = []) {
    Zr(this._launcherAttachState, {
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
      await Ps([...n], o), this.initRoktLauncher(o);
    }).catch((o) => {
      const a = this._launcherAttachState.lifecycle === "attached";
      if (is(this._launcherAttachState), !a) {
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
    return rs(
      this._launcherAttachState,
      this.isLauncherReadyToAttach(),
      (e) => this.attachLauncher(e.accountId, e.launcherOptions, e.legacyRoktExtensions)
    );
  }
  initRoktLauncher(e) {
    window.Rokt && (window.Rokt.currentLauncher = e), this.launcher = e, es(this._launcherAttachState);
    const i = p().Rokt?.filters;
    i ? (!this.isInitialized && this.filters.filteredUser && (i.filteredUser = this.filters.filteredUser), this.filters = i, i.filteredUser ? this._workspaceSearchInFlightPromise = this.search(i.filteredUser) : console.warn("Rokt Kit: No filtered user has been set.")) : console.warn("Rokt Kit: No filters have been set."), this.isInitialized = !0, pi(this.domain, this.integrationName), p().Rokt.attachKit(this), this.pushExitIntentExtensionConfig(), this.flushPendingPreselectDispatches();
  }
  // Leaving the hook unset is what keeps History unpatched for workspaces that never
  // preselect. The core SDK reads onCheckoutIntent when it has a signal, so an account without
  // pre-selection entries never hears one.
  armPreselectPathnameTrigger() {
    Ye(window.location.pathname), this.onRouteChange = ue(this.accountId) ? () => this.evaluatePreselectPathname() : void 0, this.armPreselectEmailInputListener(), this.onCheckoutIntent = ue(this.accountId) ? (e) => {
      try {
        fr(this._preselectState, this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0, this.onPaymentPick = ue(this.accountId) ? (e) => {
      try {
        _r(this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0;
  }
  // A guest often types their email after the trigger page view has queued for want of one, so a
  // committed email input retries the queue. Only accounts with an entry that reads the form listen.
  armPreselectEmailInputListener() {
    this._preselectEmailInputListener && (document.removeEventListener("input", this._preselectEmailInputListener, !0), document.removeEventListener("change", this._preselectEmailInputListener, !0), this._preselectEmailInputListener = void 0), Ur(this.accountId) && (this._preselectEmailInputListener = (e) => {
      ot(e), e.type === "change" && this._preselectState.pending.length > 0 && Or(this._preselectState, this.buildPreselectHost(), e) && this.flushPendingPreselectDispatches();
    }, document.addEventListener("input", this._preselectEmailInputListener, !0), document.addEventListener("change", this._preselectEmailInputListener, !0));
  }
  // A core released without the check reads false, so its page views are judged by their marker alone.
  isAutoLogPageViewOn() {
    const e = p().Rokt;
    try {
      return V(e?.isAutoLogPageViewEnabled) && e.isAutoLogPageViewEnabled() === !0;
    } catch {
      return !1;
    }
  }
  // True while the core SDK says the confirm click can be waited for: auto button tracking is on, no
  // opt-out or privacy option suppresses it, and the browser supports the detector. A core released
  // without the check reads false, so its entries keep dispatchDelayMs.
  isCheckoutIntentActive() {
    const e = p().Rokt;
    try {
      return V(e?.isCheckoutIntentLive) && e.isCheckoutIntentLive() === !0;
    } catch {
      return !1;
    }
  }
  // Core gates every kit callback on opt-out and consent, but a DOM listener is called by the browser
  // directly, so it checks both itself.
  isForwardingAllowed() {
    return p().getInstance?.()?._Store?.isEnabled !== !1 && p()._getActiveForwarders().some((i) => i === this);
  }
  // A call carrying a form email can wait on identity search or launcher setup. A skipped one costs only
  // the cached hit, so it goes out only if nothing changed: same user, still allowed, and no partner
  // email has appeared, filtered or not.
  getFormEmailDropCause(e, i) {
    if (!this.isForwardingAllowed()) return "forwarding_disallowed";
    if (this.isTargetingDisabled() || !this.isPreselectionPrivacyAllowed()) return "privacy_signal";
    if (String(this.filters?.filteredUser?.getMPID?.() ?? "") !== String(i ?? "")) return "user_changed";
    if (Pt(this.buildPreselectHost(), e)) return "partner_email";
  }
  // Whether this connection filters out the Email identity, or the identity mapped to the hashed email.
  isEmailIdentityFiltered() {
    const e = this.userIdentityFilters || [];
    if (e.includes(os))
      return !0;
    const i = this._mappedEmailSha256Key, n = p().IdentityType || {}, r = i ? Object.keys(n).find((o) => o.toLowerCase() === i) : void 0, s = r ? n[r] : void 0;
    return typeof s == "number" && e.includes(s);
  }
  evaluatePreselectPathname() {
    const e = window.location.pathname;
    Ye(e), e !== this._lastPreselectPathname && (this.isTargetingDisabled() || (this._lastPreselectPathname = e, yr(this._preselectState, this.buildPreselectHost(), e), ei(this._preselectState, this.buildPreselectHost(), e)));
  }
  fetchOptimizely() {
    const e = p()._getActiveForwarders().filter((i) => i.name === "Optimizely");
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
    return p().Rokt?.launcherOptions?.noTargeting === !0 || this.isDeviceIdDisabled();
  }
  // Core's normalizeRoktLauncherOptions turns noDeviceId or noDeviceID into noDeviceId, noFunctional and
  // noTargeting, but an older core passes either spelling through as written, so the kit applies the same rule.
  isDeviceIdDisabled() {
    const e = p()?.Rokt?.launcherOptions;
    return e?.noDeviceId === !0 || e?.noDeviceID === !0;
  }
  isPreselectionPrivacyAllowed() {
    return p().Rokt?.launcherOptions?.doNotShareOrSell !== !0 && navigator.globalPrivacyControl !== !0;
  }
  isPageHistoryAllowed() {
    return !this.isTargetingDisabled() && this.isPreselectionPrivacyAllowed();
  }
  isPartnerInLocalLauncherTestGroup() {
    return !!(p().config && p().config.isLocalLauncherEnabled && this.isAssignedToSampleGroup());
  }
  isAssignedToSampleGroup() {
    return Math.random() > 0.5;
  }
  getEffectiveExitIntentConfig(e) {
    return gi(e) ? {
      identifier: Es,
      signals: {
        mouseExitTop: !0,
        scrollUpFast: !0,
        idle: !0
      }
    } : null;
  }
  applyExitIntentExtensionOverride(e, i) {
    return e ? i.includes(Ge) ? i : [...i, Ge] : i;
  }
  extractExitIntentIdentifier(e) {
    return e ? m(e.identifier) && e.identifier.length > 0 ? e.identifier : m(e.placementIdentifier) && e.placementIdentifier.length > 0 ? e.placementIdentifier : null : null;
  }
  applyIdentityCapturePayload(e, i) {
    const n = {}, r = e.email;
    m(r) && r.length > 0 && (n.email = r);
    const s = e.mobile_number;
    m(s) && s.length > 0 && (n.mobile_number = s);
    const o = p().Identity?.modify;
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
    const a = p().Identity?.getCurrentUser?.();
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
      const r = p().Rokt?.selectPlacements?.({
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
    !this._exitIntentConfig || !V(window.Rokt?.setExtensionData) || window.Rokt.setExtensionData({
      [Ge]: this._exitIntentConfig
    });
  }
  captureTiming(e) {
    window && p() && p().captureTiming && e && p().captureTiming(e);
  }
  // ---- Public methods (mParticle Kit Callbacks) ----
  /**
   * Initializes the Rokt forwarder with settings from the mParticle server.
   */
  init(e, i, n, r, s) {
    const o = p().Rokt?.launcherOptions?.noFunctional === !0 || this.isDeviceIdDisabled();
    un(o), o || this.isTargetingDisabled() ? fn() : (kn(), Dn()), this.isPageHistoryAllowed() || (je(), $e());
    const a = e, c = a.accountId;
    this._exitIntentEnabledForAccount = gi(c);
    const l = this._exitIntentEnabledForAccount ? this.getEffectiveExitIntentConfig(c) : null;
    this._exitIntentEnabledForAccount ? this.configureExitIntentBridge(l) : this.configureExitIntentBridge(null), this.accountId = c || null;
    const u = this.accountId ? ir(this.accountId, a.preselectionConfig) : void 0;
    this.userAttributes = Y(s), this.armPreselectPathnameTrigger(), this._onboardingExpProvider = a.onboardingExpProvider;
    const d = be(a.placementEventMapping);
    this.placementEventMappingLookup = ui(d);
    const h = be(
      a.placementEventAttributeMapping
    );
    this.placementEventAttributeMappingLookup = di(h), a.hashedEmailUserIdentityType && (this._mappedEmailSha256Key = a.hashedEmailUserIdentityType.toLowerCase()), this._workspaceIdSyncApiKey = m(a.workspaceIdSyncApiKey) ? a.workspaceIdSyncApiKey : void 0;
    const f = p().Rokt?.domain, { roktExtensionsQueryParams: y, legacyRoktExtensions: g, loadThankYouElement: _ } = li(
      a.roktExtensions
    ), b = this.applyExitIntentExtensionOverride(
      l,
      y
    ), R = {
      ...p().Rokt?.launcherOptions || {}
    };
    this.integrationName = ws(R.integrationName), R.integrationName = this.integrationName, this.domain = f;
    const C = {
      loggingUrl: a.loggingUrl,
      errorUrl: a.errorUrl,
      integrationDomain: f,
      isLoggingEnabled: p().config?.isLoggingEnabled === !0
    }, P = new mi(
      C,
      this.integrationName,
      window.__rokt_li_guid__,
      a.accountId
    ), M = new hi(
      C,
      P,
      this.integrationName,
      window.__rokt_li_guid__,
      a.accountId
    );
    return this.errorReportingService = P, this.loggingService = M, this._flushInitWarnings(), u && M.log({
      message: `Rokt Kit: preselectionConfig setting is invalid [reason=${u}], using the built-in preselection config`,
      code: "PRESELECT_CONFIG_INVALID"
    }), p()._registerErrorReportingService && p()._registerErrorReportingService(P), p()._registerLoggingService && p()._registerLoggingService(M), n ? (this.testHelpers = {
      generateLauncherScript: oi,
      generateThankYouElementScript: ai,
      extractRoktExtensionConfig: li,
      hashEventMessage: fi,
      parseSettingsString: be,
      generateMappedEventLookup: ui,
      generateMappedEventAttributeLookup: di,
      sendAdBlockMeasurementSignals: pi,
      createAutoRemovedIframe: lt,
      djb2: dt,
      setAllowedOriginHashes: (w) => {
        W._allowedOriginHashes = w;
      },
      ReportingTransport: fe,
      ErrorReportingService: mi,
      LoggingService: hi,
      RateLimiter: sn,
      ErrorCodes: Dt,
      WSDKErrorSeverity: de,
      resetLauncherAttachState: () => ns(this._launcherAttachState)
    }, this.attachLauncher(c, R), "Successfully initialized: " + D) : (_ && (p().Rokt.flushOnShoppableAdsReadyMessageQueue?.(this), ci(fs, ai(f), {
      onLoad: () => {
        this._isThankYouElementLoaded = !0, this._thankYouElementOnLoadCallback && this._thankYouElementOnLoadCallback();
      },
      onError: (w) => {
        console.error("Error loading Rokt Thank You Element script:", w);
      }
    })), this.isLauncherReadyToAttach() ? this.attachLauncher(c, R, g) : (ci(ds, oi(f, b), {
      onLoad: () => {
        this.isLauncherReadyToAttach() ? this.attachLauncher(c, R, g) : console.error("Rokt object is not available after script load.");
      },
      onError: (w) => {
        console.error("Error loading Rokt launcher script:", w);
      }
    }), this.captureTiming(W.PERFORMANCE_MARKS.RoktScriptAppended)), "Successfully initialized: " + D);
  }
  process(e) {
    if (e.EventDataType === ni && Ye(window.location.pathname), !this.isTargetingDisabled()) {
      if (e.EventDataType === ni) {
        if (this._exitIntentEnabledForAccount && this._exitIntentWatcher.resetPageViewState(), this.isPageHistoryAllowed()) {
          const i = this.isAutoLogPageViewOn();
          _n(this.loggingService, e.EventAttributes, i), this.capturePageView(e, i);
        } else
          je(), $e();
        ne(this._preselectState, this.buildPreselectHost(), e), ei(this._preselectState, this.buildPreselectHost());
      }
      Se(e) && hr(this.buildPreselectHost(), e), Er(this.accountId, e.EventName) && br(this._preselectState, this.buildPreselectHost(), e);
    }
    if (e.EventDataType === ps && (je(), $e(), vt(this._preselectState), this.accountId && (G(this.accountId), jt(this.accountId), Yt(this.accountId))), !this.isKitReady())
      return "Kit not ready for forwarder: " + D;
    if (V(p().Rokt?.setLocalSessionAttribute) && !Se(e) && (T(this.placementEventAttributeMappingLookup) || this.applyPlacementEventAttributeMapping(e), !T(this.placementEventMappingLookup))) {
      const i = fi(e.EventDataType, e.EventCategory, e.EventName ?? "");
      this.placementEventMappingLookup[String(i)] && p().Rokt.setLocalSessionAttribute?.(this.placementEventMappingLookup[String(i)], !0);
    }
    return "Successfully sent to forwarder: " + D;
  }
  setExtensionData(e) {
    if (!this.isKitReady()) {
      console.error("Rokt Kit: Not initialized");
      return;
    }
    window.Rokt.setExtensionData(e);
  }
  setUserAttribute(e, i) {
    return _i(e) || (this.userAttributes[e] = i), (Pr(this.accountId, e) || wt(e, this._mappedEmailSha256Key) || $r(this.accountId, e)) && this.flushPendingPreselectDispatches(), "Successfully set user attribute for forwarder: " + D;
  }
  removeUserAttribute(e) {
    return delete this.userAttributes[e], "Successfully removed user attribute for forwarder: " + D;
  }
  handleIdentityComplete(e, i) {
    return this.userAttributes = Y(e.getAllUserAttributes()), "Successfully called " + i + " for forwarder: " + D;
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
    const n = p().Identity?.search;
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
    return this.userIdentifiedInWorkspace = !1, this._workspaceSearchInFlightPromise = null, this._workspaceLastSearchedIdentitiesKey = void 0, this.accountId && (G(this.accountId), jt(this.accountId), Yt(this.accountId)), this.handleIdentityComplete(e, "onLogoutComplete");
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
        new Promise((s) => setTimeout(s, si))
      ]) : Promise.resolve();
      return Promise.all([i, r]).then(
        () => this._dispatchPlacements(e)
      );
    }
    if (this._workspaceSearchInFlightPromise) {
      const n = this._workspaceSearchInFlightPromise;
      return Promise.race([
        n,
        new Promise((r) => setTimeout(r, si))
      ]).then(() => this._dispatchPlacements(e));
    }
    return this._dispatchPlacements(e);
  }
  // What a pre-selection call with these attributes would send, mirroring _dispatchPlacements: identities,
  // then the cached user attributes merged in, filtered and overridden for the target page, then the
  // session attributes, so a later source wins as it does on the wire.
  getOutgoingPreselectAttributes(e, i) {
    const n = { ...Y(this.userAttributes), ...e }, r = this.filters || {}, s = r.filterUserAttributes ? r.filterUserAttributes(n, r.userAttributeFilters || []) : n, o = Zt(
      this.accountId,
      i ? it(s, this.buildPreselectAttributeOverrides(i)) : s,
      this.findCacheConfigEntry(i)
    );
    return {
      ...this.returnUserIdentities(r.filteredUser || null),
      ...o,
      ...this.returnLocalSessionAttributes()
    };
  }
  _dispatchPlacements(e) {
    const i = e ? Kr(e) : void 0;
    if (e?.preselect === !0 && !kt(this.buildPreselectHost())) {
      i?.();
      return;
    }
    const n = e?.[Te], r = e?.[tt], s = { ...e };
    if (delete s[Te], delete s[tt], e = s, r !== void 0) {
      const $ = E(r) ? r : {}, ce = String($.mpid ?? ""), Mt = $.requireLogin !== !1, xt = p().Identity?.getCurrentUser?.();
      if (ce === "" || String(this.filters?.filteredUser?.getMPID?.() ?? "") !== ce || String(xt?.getMPID?.() ?? "") !== ce || Mt && xt?.isLoggedIn?.() !== !0) {
        this.loggingService?.logPlacementDiagnostic(
          A("missed", Mt ? "logged_in_dropped" : "user_changed_dropped")
        ), i?.();
        return;
      }
    }
    const o = E(n) ? n : void 0, a = o && m(o.key) ? o.key : void 0;
    if (a) {
      const $ = this.getFormEmailDropCause(a, o.mpid);
      if ($) {
        this.loggingService?.logPlacementDiagnostic(
          A("missed", "form_email_dropped", { cause: $ })
        ), i?.();
        return;
      }
    }
    const c = e.attributes || {}, l = Y(this.userAttributes), u = { ...l, ...c }, d = this.filters || {}, h = d.userAttributeFilters || [], f = d.filteredUser || null, y = f ? f.getMPID() : null;
    let g;
    d ? d.filterUserAttributes ? g = d.filterUserAttributes(u, h) : g = u : (console.warn("Rokt Kit: No filters available, using user attributes"), g = u);
    const _ = Y(g);
    a && (Object.prototype.hasOwnProperty.call(l, a) ? _[a] = l[a] : delete _[a]), this.userAttributes = _;
    const b = this._onboardingExpProvider === "Optimizely" ? this.fetchOptimizely() : {}, R = this.returnUserIdentities(f), C = this.returnLocalSessionAttributes(), P = this.isPageHistoryAllowed(), M = P ? hn(Ht()) : [], w = P ? yn() : null, Ee = this.readMpSessionId(), Ot = this.readMpDeviceId(), We = typeof e.identifier == "string" ? e.identifier : void 0, Ie = this.findCacheConfigEntry(We), Ut = e.preselect === !0 ? Zt(
      this.accountId,
      it(g, this.buildPreselectAttributeOverrides(We)),
      Ie
    ) : g, ae = {
      ...R,
      ...Ut,
      ...b,
      ...C,
      ...M.length ? { [ms]: JSON.stringify(M) } : {},
      ...w ? { [hs]: w } : {},
      ...this.userIdentifiedInWorkspace ? { [gs]: !0 } : {},
      ...Ee ? { [_s]: Ee } : {},
      ...Ot ? { [ri]: Ot } : {},
      mpid: y
    };
    this.isDeviceIdDisabled() && delete ae[ri], e.preselect !== !0 && Br(this.buildPreselectHost(), We, ae);
    const He = Ut[Yi];
    if (e.preselect === !0 && m(He) && (He.indexOf("intent_") === 0 || He.indexOf("pageview_cart|") === 0) && !Ae(ae, this._mappedEmailSha256Key)) {
      this.loggingService?.logPlacementDiagnostic(
        A("missed", "no_strict_email", { cause: "lost_before_dispatch" })
      ), i?.();
      return;
    }
    const Kt = Ie?.identityKeys, on = {
      ...e,
      attributes: ae,
      ...Ie ? { cacheMatchKeys: Gi(Ie) } : {},
      ...Kt ? { cacheIdentityKeys: Kt } : {}
    }, Nt = this.launcher.selectPlacements(on), Ft = e.preselect === !0, an = () => {
      Ft || this.logSelectPlacementsEvent(ae);
    };
    return Promise.resolve(Nt).then(($) => {
      if (!Ft)
        return $?.context?.sessionId?.then((ce) => this.setRoktSessionId(ce));
    }).catch(() => {
    }).finally(an), Nt;
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
    return this.isKitReady() ? (ts(this._launcherAttachState), this.launcher.terminate()) : (console.error("Rokt Kit: Not initialized"), Promise.resolve());
  }
  /**
   * Registers a callback to be invoked once rokt-thank-you-element.js becomes available.
   */
  onShoppableAdsReady(e) {
    this._isThankYouElementLoaded ? e() : this._thankYouElementOnLoadCallback = e;
  }
};
W._allowedOriginHashes = [-553112570, 549508659], W.PERFORMANCE_MARKS = {
  RoktScriptAppended: "mp:RoktScriptAppended"
}, W.EMAIL_SHA256_KEY = "emailsha256";
let re = W;
function Rs() {
  return ve;
}
function Cs(t) {
  if (!t) {
    window.console.log("You must pass a config object to register the kit " + D);
    return;
  }
  if (!E(t)) {
    window.console.log("'config' must be an object. You passed in a " + typeof t);
    return;
  }
  E(t.kits) ? t.kits[D] = {
    constructor: re
  } : (t.kits = {}, t.kits[D] = {
    constructor: re
  }), window.console.log("Successfully registered " + D + " to your mParticle configuration");
}
typeof window < "u" && window.mParticle && p().addForwarder && p().addForwarder({
  name: D,
  constructor: re,
  getId: Rs
});
export {
  Cs as register
};
//# sourceMappingURL=Rokt-Kit.esm.js.map
