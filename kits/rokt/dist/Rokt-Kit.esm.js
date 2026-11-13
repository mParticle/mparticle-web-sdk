const Hn = [
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
  "rokt.preselectdefaulted",
  // PRESELECT_DEFAULTED_ATTRIBUTE: describes one speculative call only
  "rokt.preselecttrigger",
  // PRESELECT_TRIGGER_ATTRIBUTE: describes one speculative call only
  "shippingaddress1",
  "shippingcity",
  "shippingcountry",
  "shippingmethod",
  "shippingstate",
  "shippingzipcode",
  "totalprice"
], Wn = new Set(Hn);
function Hi(t) {
  return Wn.has(t.toLowerCase());
}
function ne(t) {
  const e = {}, i = t || {}, n = Object.keys(i);
  for (let r = 0; r < n.length; r++) {
    const s = n[r];
    Hi(s) || (e[s] = i[s]);
  }
  return e;
}
function E(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function p(t) {
  return typeof t == "string";
}
function j(t) {
  return typeof t == "function";
}
function Wi(t) {
  try {
    return JSON.parse(t.replace(/&quot;/g, '"'));
  } catch {
    return;
  }
}
function k(t) {
  return t == null ? !0 : typeof t == "string" ? t.length === 0 : typeof t == "object" ? Object.keys(t).length === 0 : !1;
}
function T(t, e) {
  return Object.prototype.hasOwnProperty.call(t, e) ? t[e] : void 0;
}
function We(t) {
  const e = $i(), i = e ? e(t, "full") : t, n = i.indexOf("#"), r = n === -1 ? "" : i.slice(n);
  return (n === -1 ? i : i.slice(0, n)).split("?")[0] + r.split("?")[0];
}
function Rt(t) {
  const e = $i();
  return e ? e(t, "report") : t.split(/[?#]/)[0];
}
function $i() {
  const t = window.mParticle;
  return t && typeof t._cleanUrl == "function" ? t._cleanUrl : void 0;
}
function J(t) {
  let e = 5381;
  for (let i = 0; i < t.length; i++)
    e = (e << 5) + e + t.charCodeAt(i), e = e & e;
  return e;
}
const I = "mp-rokt-kit", ai = "__rokt_ls_probe__";
function ci() {
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
let le = null;
function $n(t) {
  t ? le || (le = { local: ci(), session: ci() }) : le = null;
}
function Gn() {
  return le !== null;
}
const Z = () => le?.local ?? window.localStorage, U = () => le?.session ?? window.sessionStorage;
function mt() {
  try {
    const t = Z();
    return t.setItem(ai, "1"), t.removeItem(ai), !0;
  } catch {
    return !1;
  }
}
function qe(t, e = Z) {
  try {
    const i = e().getItem(t);
    return i === null ? null : JSON.parse(i);
  } catch {
    return null;
  }
}
function Gi(t, e, i = Z) {
  try {
    return i().setItem(t, JSON.stringify(e)), !0;
  } catch {
    return !1;
  }
}
function ht(t, e = Z) {
  try {
    e().removeItem(t);
  } catch {
  }
}
function Yn() {
  ht(I, () => window.localStorage), ht(I, () => window.sessionStorage);
}
function V(t, e, i = Z) {
  const n = qe(t, i);
  return E(n) ? n[e] : void 0;
}
function H(t, e, i, n = Z) {
  const r = qe(t, n), s = E(r) ? { ...r } : {};
  return s[e] = i, Gi(t, s, n);
}
function Yi(t, e, i) {
  Object.keys(e).length === 0 ? ht(t, i) : Gi(t, e, i);
}
function ee(t, e, i = Z) {
  const n = qe(t, i);
  if (!E(n) || !(e in n))
    return;
  const r = { ...n };
  delete r[e], Yi(t, r, i);
}
function ue(t, e, i = Z) {
  const n = qe(t, i);
  if (!E(n))
    return;
  const r = Object.keys(n).filter((o) => o.startsWith(e));
  if (r.length === 0)
    return;
  const s = { ...n };
  r.forEach((o) => delete s[o]), Yi(t, s, i);
}
const Dt = "pageViews", $e = "utmParams", Bi = 25, Bn = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
function zi(t) {
  return t.slice(-Bi);
}
function li() {
  const t = V(I, Dt);
  return Array.isArray(t) ? t.filter(E).map(zn) : [];
}
function zn(t) {
  return {
    ...t,
    ...p(t.pageUrl) ? { pageUrl: We(t.pageUrl) } : {},
    ...p(t.canonicalUrl) ? { canonicalUrl: We(t.canonicalUrl) } : {}
  };
}
function Xn(t) {
  const e = zi(t);
  for (let i = 0; i < e.length; i++) {
    const n = e.slice(i);
    if (H(I, Dt, n))
      return n.length;
  }
  return 0;
}
function ut() {
  ee(I, Dt);
}
function qn(t) {
  const e = zi(t);
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
function Xi(t, e = !1) {
  return e || !!t && t.is_auto_page_view === !0;
}
function Jn(t, e, i = !1) {
  if (V(I, $e) !== void 0)
    return;
  const n = Xi(e, i), r = new URLSearchParams(window.location.search), s = {};
  for (const a of Bn) {
    const c = n ? (e || {})[a] : r.get(a);
    p(c) && c && (s[a] = c);
  }
  if (Object.keys(s).length === 0)
    return;
  const o = Object.keys(s).join(", ");
  if (!H(I, $e, s)) {
    const a = mt() ? "quota" : "ls_unavailable";
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
function Qn() {
  const t = V(I, $e);
  return E(t) ? t : null;
}
function dt() {
  ee(I, $e);
}
function Zn() {
  const e = document.querySelector('link[rel="canonical"]')?.href;
  if (e)
    return We(e);
}
const qi = "skip", er = [
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
], _t = {
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
}, tr = /\b(?:gift cards?|store credit|rewards?|points?|balance|vouchers?|promo codes?|coupons?)\b/g, ir = 12;
function nr(t) {
  return t.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/[^a-z]+/g, " ").trim();
}
function Ot(t) {
  if (typeof t != "string" || t.length > 128)
    return;
  const e = nr(t).replace(tr, " ").replace(/\s+/g, " ").trim();
  if (!e || e.split(" ").length > ir)
    return;
  const i = Object.keys(_t).filter((r) => _t[r].test(e)), n = i.filter((r) => r !== "card");
  return n.length === 1 ? n[0] : n.length === 0 && i.length === 1 ? i[0] : void 0;
}
function Ut(t) {
  return typeof t == "string" && Object.prototype.hasOwnProperty.call(_t, t);
}
const rr = "radio", sr = ["button", "role", "wallet"], or = ["label", "aria_label", "test_id", "element_id", "element_name"];
function ar(t) {
  if (!t)
    return;
  const e = String(t.checked), i = t.type === rr;
  if (!(e === "false" || i && e !== "true" || t.type === "checkbox" || t.element === "link") && !(!i && t.type === void 0 && !sr.includes(String(t.element))))
    for (const n of or) {
      const r = Ot(t[n]);
      if (r && (i || r !== "card"))
        return r;
    }
}
function cr(t) {
  if (Ut(t.family))
    return t.family;
  for (const e of Array.isArray(t.names) ? t.names : []) {
    const i = Ot(e);
    if (i)
      return i;
  }
}
const lr = ["paymenttype", "payment_type", "paymentmethod", "payment_method"];
function ur(t) {
  const e = t ? Object.keys(t).find((n) => lr.includes(n.toLowerCase())) : void 0, i = e ? t[e] : void 0;
  return typeof i != "string" || !i.trim() ? "absent" : Ot(i) ?? "other";
}
const dr = 1, fr = 6e4;
function D(t) {
  return Array.isArray(t) && t.every(p);
}
function ie(t) {
  return p(t) && t !== "";
}
const gr = ["DesktopWeb", "MobileWeb"], pr = 50;
function mr(t, e) {
  if (!Array.isArray(t) || t.length === 0 || !t.every((r) => D(r) && r.length >= 2 && r.every(ie)))
    return !1;
  const i = t.flat();
  if (i.length > pr || new Set(i).size !== i.length)
    return !1;
  const n = D(e) ? e.map((r) => r.toLowerCase()) : [];
  return !i.some((r) => n.includes(r.toLowerCase()));
}
const hr = 10, _r = 256, yr = ["commit", "checkoutStep"];
function Er(t) {
  if (!E(t))
    return !1;
  const e = yr.filter((i) => t[i] !== void 0);
  return e.length > 0 && e.every((i) => {
    const n = t[i];
    return D(n) && n.length > 0 && n.length <= hr && n.every((r) => r.trim() !== "" && r.length <= _r);
  });
}
function Ir(t) {
  if (ie(t))
    return !0;
  if (!E(t))
    return !1;
  const { byClientType: e, byHostname: i, byPaymentPick: n, skipRemembered: r, skipValues: s, matchGroups: o } = t;
  if (t.value !== void 0 && !ie(t.value) || e !== void 0 && (!E(e) || !Object.entries(e).every(
    ([a, c]) => gr.includes(a) && ie(c)
  )) || i !== void 0 && (!E(i) || !Object.entries(i).every(
    ([a, c]) => a !== "" && a === a.toLowerCase() && ie(c)
  )) || n !== void 0 && (!E(n) || Object.keys(n).length === 0 || !Object.entries(n).every(
    ([a, c]) => Ut(a) && ie(c)
  )) || r !== void 0 && typeof r != "boolean" || s !== void 0 && (!D(s) || s.length === 0 || !s.every(ie)))
    return !1;
  if (D(s)) {
    const a = s.map((l) => l.toLowerCase());
    if ([
      t.value,
      ...Object.values(e ?? {}).filter((l) => l !== qi),
      ...Object.values(i ?? {}),
      ...Object.values(n ?? {})
    ].some((l) => p(l) && a.includes(l.toLowerCase())))
      return !1;
  }
  return o !== void 0 && !mr(o, s) ? !1 : t.value !== void 0 || e !== void 0 || i !== void 0 || n !== void 0;
}
function Ar(t, e) {
  if (!E(e))
    return "not an object";
  const { pathname: i, targetPageIdentifier: n, attributeKeys: r, optionalAttributeKeys: s, identityKeys: o, dispatchDelayMs: a } = e, { triggerEventNames: c, releaseHoldOnRouteChange: l, readEmailInput: u, cartIntent: d, cartUserAttribute: m } = e, { checkoutStepIntent: h, intentSelectors: y } = e, v = e.preselectAttributeOverrides, P = e.preselectAttributeDefaults !== void 0 ? e.preselectAttributeDefaults : v, f = e.widenedOptionalAttributeKeys;
  if (e.accountId !== void 0 && e.accountId !== t)
    return "accountId";
  if (!p(i) || !i.startsWith("/"))
    return "pathname";
  if (!p(n) || n === "")
    return "targetPageIdentifier";
  if (!D(r) || r.length === 0)
    return "attributeKeys";
  if (s !== void 0 && (!D(s) || !s.every((A) => r.includes(A))))
    return "optionalAttributeKeys";
  if (f !== void 0 && (!D(f) || !f.every((A) => r.includes(A))))
    return "widenedOptionalAttributeKeys";
  if (o !== void 0 && (!D(o) || o.length === 0 || !o.every((A) => r.includes(A))))
    return "identityKeys";
  if (D(f) && f.length > 0) {
    const A = (D(s) ? s : []).concat(f).map((O) => O.toLowerCase());
    if (!D(o) || o.some((O) => A.includes(O.toLowerCase())))
      return "identityKeys";
  }
  if (a !== void 0 && (!Number.isInteger(a) || a < 0 || a > fr))
    return "dispatchDelayMs";
  if (l !== void 0 && typeof l != "boolean")
    return "releaseHoldOnRouteChange";
  if (h !== void 0 && typeof h != "boolean")
    return "checkoutStepIntent";
  if (d !== void 0 && typeof d != "boolean")
    return "cartIntent";
  if (y !== void 0 && !Er(y))
    return "intentSelectors";
  if (u !== void 0 && (typeof u != "boolean" || !r.includes("email") || D(s) && s.includes("email") || // The runtime matches optional keys in any casing, so an 'Email' key would make email optional too.
  D(f) && f.some((A) => A.toLowerCase() === "email") || // A default makes its key optional too, and would send a guessed email as the shopper's.
  E(P) && Object.keys(P).some((A) => A.toLowerCase() === "email")))
    return "readEmailInput";
  if (e.preselectAttributeDefaults !== void 0 && v !== void 0)
    return "preselectAttributeDefaults";
  let _;
  if (P !== void 0) {
    const A = e.preselectAttributeDefaults !== void 0 ? "preselectAttributeDefaults" : "preselectAttributeOverrides";
    if (!E(P))
      return A;
    const O = (D(o) ? o : []).map((R) => R.toLowerCase()), L = ([R, B]) => Ir(B) && r.includes(R) && !["email", "emailsha256"].includes(R.toLowerCase()) && !O.includes(R.toLowerCase()), Y = ([R, B]) => v !== void 0 && p(B) && r.includes(R) && !(D(o) && o.includes(R)), te = Object.entries(P);
    if (!te.every((R) => L(R) || Y(R)))
      return A;
    _ = Object.fromEntries(te.filter(L));
  }
  if (c !== void 0 && (!D(c) || c.length === 0 || c.some((A) => A === "")))
    return "triggerEventNames";
  const b = { accountId: t, pathname: i, targetPageIdentifier: n, attributeKeys: r };
  return s !== void 0 && (b.optionalAttributeKeys = s), f !== void 0 && (b.widenedOptionalAttributeKeys = f), o !== void 0 && (b.identityKeys = o), a !== void 0 && (b.dispatchDelayMs = a), l !== void 0 && (b.releaseHoldOnRouteChange = l), h !== void 0 && (b.checkoutStepIntent = h), y !== void 0 && (b.intentSelectors = y), u !== void 0 && (b.readEmailInput = u), _ !== void 0 && (b.preselectAttributeDefaults = _), c !== void 0 && (b.triggerEventNames = c), d !== void 0 && (b.cartIntent = d), d === !0 && p(m) && m !== "" && (b.cartUserAttribute = m), b;
}
function vr(t, e) {
  const i = Wi(e);
  if (i === void 0)
    return { error: "invalid JSON" };
  if (!E(i))
    return { error: "not an object" };
  if (i.schemaVersion !== dr)
    return { error: "schemaVersion" };
  if (!Array.isArray(i.entries))
    return { error: "entries" };
  const n = [];
  for (let r = 0; r < i.entries.length; r++) {
    const s = Ar(t, i.entries[r]);
    if (p(s))
      return { error: `entry ${r + 1} ${s}` };
    if (n.some((o) => o.targetPageIdentifier === s.targetPageIdentifier))
      return { error: `entry ${r + 1} targetPageIdentifier` };
    n.push(s);
  }
  return { entries: n };
}
const Pr = 6e4, Kt = "activePreselect:";
function br(t) {
  return E(t) && typeof t.expiresAt == "number" && typeof t.attributesDigest == "number";
}
function Nt(t, e) {
  return `${Kt}${t}:${e}`;
}
function de(t) {
  const e = V(I, t, U);
  return br(e) && e.expiresAt > Date.now() ? e : null;
}
function wr(t, e, i = !1) {
  H(
    I,
    t,
    { expiresAt: Date.now() + Pr, attributesDigest: e, ...i ? { byEvent: !0 } : {} },
    U
  );
}
function Sr(t, e, i) {
  const n = de(t);
  n && n.attributesDigest !== i || (e && e.expiresAt > Date.now() ? H(I, t, e, U) : ee(I, t, U));
}
function ui(t) {
  ue(
    I,
    `${Kt}${t}:`,
    U
  );
}
function Tr() {
  ue(I, Kt);
}
const kr = 5 * 6e4, Ji = "pendingPreselect:";
function Lr(t) {
  return E(t) && typeof t.expiresAt == "number" && p(t.pathname) && p(t.identifier) && E(t.attributes) && p(t.mpid);
}
function Ft(t) {
  return `${Ji}${t}`;
}
function Mt(t) {
  const e = Ft(t), i = V(I, e, U);
  return Lr(i) ? i.expiresAt <= Date.now() ? (ee(I, e, U), null) : i : null;
}
function di(t, e, i, n, r, s = !1) {
  return H(
    I,
    Ft(t),
    {
      expiresAt: Date.now() + kr,
      pathname: e,
      identifier: i,
      attributes: n,
      mpid: r,
      ...s ? { byEvent: !0 } : {}
    },
    U
  );
}
function re(t) {
  ee(I, Ft(t), U);
}
function Cr() {
  ue(I, Ji);
}
const Qi = "preselectArrival:", Zi = "preselectTriggerAnyTab:", Je = "preselectCartAdd:", en = "preselectTargetPath:", tn = "preselectCartArrival:", Rr = 30 * 6e4, ge = 30 * 6e4, Dr = 10080 * 6e4, Or = 10080 * 6e4, yt = ["commit", "wallet", "frame", "checkout_step", "cart"], Ur = [
  "triggeredAt",
  "identitySeenAt",
  "firedAt",
  "firedDigest",
  "arrivedAt",
  "nearMissAt",
  "paymentPickAt"
], Kr = ["paymentPick", "paymentAtFire"];
function W(t, e) {
  return `${Qi}${t}:${e}`;
}
function nn(t, e) {
  return `${Zi}${t}:${e}`;
}
function Ce(t) {
  const e = V(I, t, U), i = {};
  if (!E(e))
    return i;
  for (const n of Ur)
    typeof e[n] == "number" && (i[n] = e[n]);
  typeof e.intentAt == "number" && yt.includes(e.intentKind) && (i.intentAt = e.intentAt, i.intentKind = e.intentKind);
  for (const n of Kr)
    Ut(e[n]) && (i[n] = e[n]);
  return i.firedAt !== void 0 && e.firedByCart === !0 && (i.firedByCart = !0), i;
}
function se(t, e) {
  return H(I, t, e, U);
}
function oe(t) {
  const e = Ce(t);
  return e.arrivedAt === void 0 ? e : e.paymentPick !== void 0 && e.paymentPickAt !== void 0 && e.paymentPickAt > e.arrivedAt ? { paymentPick: e.paymentPick, paymentPickAt: e.paymentPickAt } : {};
}
function Nr(t, e, i) {
  const n = W(t, e), r = oe(n), s = Date.now();
  se(n, {
    ...r,
    triggeredAt: r.triggeredAt ?? s,
    ...i ? { identitySeenAt: r.identitySeenAt ?? s } : {}
  }), H(I, nn(t, e), {
    triggeredAt: s
  });
}
function Fr(t, e) {
  const i = V(I, nn(t, e));
  if (!E(i) || typeof i.triggeredAt != "number")
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < Rr;
}
function Mr(t, e, i) {
  const n = `${Je}${t}`, r = V(I, n), s = E(r) ? r.addedAt ?? r.forgottenAt : void 0;
  typeof s == "number" && e <= s || H(I, n, { addedAt: e, mpid: i });
}
function xr(t, e) {
  const i = `${Je}${t}`, n = V(I, i);
  if (!E(n))
    return !1;
  const r = typeof n.addedAt == "number" ? n.addedAt : void 0, s = r ?? n.forgottenAt;
  if (typeof s != "number")
    return !1;
  const o = Date.now() - s;
  return o >= 0 && o < Dr ? r !== void 0 && e !== null && n.mpid === e : (ee(I, i), !1);
}
function Vr(t, e) {
  const i = `${Je}${t}`;
  e ? H(I, i, { forgottenAt: Date.now() }) : ee(I, i);
}
function jr(t, e) {
  const i = W(t, e), n = Ce(i);
  n.arrivedAt !== void 0 || n.nearMissAt !== void 0 || se(i, { ...n, nearMissAt: Date.now() });
}
function Hr(t, e, i, n = !1) {
  const r = W(t, e), s = oe(r), o = s.firedAt !== void 0 && Se(s.firedAt) ? {
    firedAt: s.firedAt,
    ...s.firedDigest !== void 0 ? { firedDigest: s.firedDigest } : {},
    ...s.firedByCart ? { firedByCart: !0 } : {},
    ...s.paymentAtFire !== void 0 ? { paymentAtFire: s.paymentAtFire } : {}
  } : void 0, a = s.paymentPick !== void 0 && s.paymentPickAt !== void 0 && Se(s.paymentPickAt) ? s.paymentPick : void 0;
  return se(
    r,
    rn(s, {
      firedAt: o && !(o.firedByCart && !n) ? o.firedAt : Date.now(),
      firedDigest: i,
      ...n ? { firedByCart: !0 } : {},
      paymentAtFire: a
    })
  ), o;
}
function Wr(t, e, i, n) {
  const r = W(t, e), s = oe(r);
  s.firedAt === void 0 || s.firedDigest !== n || se(r, rn(s, i));
}
function rn(t, e) {
  const i = { ...t };
  return delete i.firedAt, delete i.firedDigest, delete i.firedByCart, delete i.paymentAtFire, e ? {
    ...i,
    firedAt: e.firedAt,
    ...e.firedDigest !== void 0 ? { firedDigest: e.firedDigest } : {},
    ...e.firedByCart ? { firedByCart: !0 } : {},
    ...e.paymentAtFire !== void 0 ? { paymentAtFire: e.paymentAtFire } : {}
  } : i;
}
function $r(t, e) {
  const i = oe(W(t, e));
  if (i.triggeredAt === void 0)
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < ge;
}
function fi(t, e, i, n = !1) {
  const r = oe(W(t, e));
  if (r.firedAt === void 0 || n && r.firedByCart || i !== void 0 && r.firedDigest !== void 0 && r.firedDigest !== i)
    return !1;
  const s = Date.now() - r.firedAt;
  return s >= 0 && s < ge;
}
function Gr(t, e, i, n) {
  const r = W(t, e), s = oe(r);
  if (s.intentAt !== void 0 && s.intentKind !== void 0 && Yr(s.intentAt)) {
    const o = yt.indexOf(s.intentKind), a = yt.indexOf(i);
    if (o < a || o === a && s.intentAt >= n)
      return;
  }
  se(r, { ...s, intentAt: n, intentKind: i });
}
function Se(t) {
  const e = Date.now() - t;
  return e >= 0 && e < ge;
}
function Yr(t) {
  return Se(t);
}
function Br(t, e, i, n) {
  const r = W(t, e), s = Ce(r);
  s.arrivedAt !== void 0 && n <= s.arrivedAt || s.paymentPickAt !== void 0 && s.paymentPickAt > n || se(r, { ...s, paymentPick: i, paymentPickAt: n });
}
function zr(t, e) {
  const i = oe(W(t, e));
  return i.paymentPick !== void 0 && i.paymentPickAt !== void 0 && Se(i.paymentPickAt) ? i.paymentPick : void 0;
}
function Xr(t, e) {
  const i = W(t, e), n = Ce(i);
  if (n.arrivedAt !== void 0)
    return;
  const r = { ...n, arrivedAt: Date.now() };
  if (delete r.paymentPick, delete r.paymentPickAt, !!se(i, r))
    return n;
}
function sn(t, e) {
  return `${tn}${t}:${e}`;
}
function qr(t, e, i, n) {
  const r = sn(t, e);
  if (i === void 0 || n === null) {
    ee(I, r, U);
    return;
  }
  H(
    I,
    r,
    { arrivedAt: Date.now(), cartDigest: i, mpid: n },
    U
  );
}
function Jr(t, e, i, n) {
  const r = V(
    I,
    sn(t, e),
    U
  );
  if (!E(r) || typeof r.arrivedAt != "number" || r.cartDigest !== i || n === null || r.mpid !== n)
    return !1;
  const { firedAt: s } = Ce(W(t, e)), o = V(I, `${Je}${t}`), a = E(o) && typeof o.addedAt == "number" && o.mpid === n ? o.addedAt : void 0;
  return Se(r.arrivedAt) && !(s !== void 0 && s >= r.arrivedAt) && !(a !== void 0 && a >= r.arrivedAt);
}
function Qr(t, e, i) {
  H(I, `${en}${t}:${e}`, {
    pathDigest: i,
    learnedAt: Date.now()
  });
}
function Zr(t, e, i) {
  const n = V(
    I,
    `${en}${t}:${e}`
  );
  if (!E(n) || n.pathDigest !== i || typeof n.learnedAt != "number")
    return !1;
  const r = Date.now() - n.learnedAt;
  return r >= 0 && r < Or;
}
function gi(t) {
  ue(
    I,
    `${Qi}${t}:`,
    U
  ), ue(
    I,
    `${tn}${t}:`,
    U
  ), ue(I, `${Zi}${t}:`);
}
function w(t, e, i = {}) {
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
const Et = /* @__PURE__ */ new Map();
function es(t, e) {
  if (Et.delete(t), !e)
    return;
  const i = vr(t, e);
  if ("error" in i)
    return i.error;
  Et.set(t, i.entries);
}
function x(t) {
  return Et.get(t) ?? er.filter((e) => e.accountId === t);
}
function ve(t, e) {
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
function ts(t, e) {
  const i = S(t).toLowerCase(), n = S(e).toLowerCase().split("/"), r = i.split("/").length;
  return ve(i, n.join("/")) || ve(i, ["", ...n.slice(2)].join("/")) || n.length > r && ve(i, n.slice(0, r).join("/"));
}
const on = {}, an = {}, cn = {}, xt = {}, ln = {}, is = {}, ns = ["commit", "wallet", "checkout_step", "frame", "cart"], rs = ["vendor", "label", "brand", "frame", "submit", "name", "api", "selector"], ss = 512;
function un(t) {
  return t === "commit" ? "intent_commit" : t === "checkout_step" ? "intent_checkout_step" : t === "cart" ? "intent_cart" : "intent_wallet";
}
function dn(t) {
  return t === "intent_commit" ? an : t === "intent_checkout_step" ? xt : t === "intent_cart" ? ln : cn;
}
const os = 1e3;
function It(t) {
  const e = Date.now() - t.t;
  return e >= 0 && e < os;
}
function Qe(t) {
  return x(t).filter((e) => e.cartIntent === !0);
}
function Ze(t) {
  return typeof t.source == "string" && rs.includes(t.source) ? t.source : void 0;
}
function fn(t) {
  return [...new Set(x(t).map((i) => i.targetPageIdentifier))].some((i) => $r(t, i)) ? "left" : "before_entry";
}
function et(t, e, i, n, r = {}, s = !1) {
  const o = `${n}:${i}:${e.kind}${s ? ":wait" : ""}`;
  if (vt.has(o)) return;
  vt.add(o);
  const a = Ze(e);
  t.logPlacementDiagnostic(
    w("skipped", "intent_observed", {
      intent_kind: e.kind,
      intent_route: i,
      ...a ? { intent_source: a } : {},
      has_email: Ke(t, {}),
      has_identity: K(t.filteredUser),
      ...r
    })
  );
}
function Vt(t) {
  const e = C(t.filteredUser), i = t.getCurrentUser?.();
  return e !== null && C(i) === e && i?.isLoggedIn?.() === !0;
}
function At(t, e, i, n, r, s = !1) {
  const o = e.accountId, a = fn(o), c = Vt(e), l = (b) => et(e, i, a, r, { logged_in: c, ...b ? { cause: b } : {} }, s), u = i.kind === "cart", d = i.kind === "wallet" && !c && (s || !K(e.filteredUser));
  if (!u && !c && (s || l(), !d))
    return;
  const m = u ? Qe(o) : x(o).filter((b) => b.cartIntent !== !0);
  if (m.length === 0) return l("cart_entry_only");
  if (m.length !== 1) return l("multiple_entries");
  if (n !== S(window.location.pathname) && !(u && It(i)))
    return l("path_changed");
  const h = m[0];
  if (!K(e.filteredUser))
    return d && !s ? cs(t, e, i, n, r) : l("no_valid_identity");
  const y = un(i.kind), v = `${y}_off_entry`, { collected: P, missingKeys: f } = ae(e, dn(y), h, !1), _ = nt(e, o, h.targetPageIdentifier, P);
  if (Jt(o, h.targetPageIdentifier, _, !u))
    return l("active_preselection");
  if (f.length > 0) return l("missing_attribute");
  if (!Ke(e, P, h.targetPageIdentifier)) return l("no_strict_email");
  Ne(
    e,
    o,
    h.targetPageIdentifier,
    h.targetPageIdentifier,
    P,
    "intent",
    De(v, h),
    !1,
    y,
    !1,
    void 0,
    Ze(i),
    { route: a, loggedIn: c, requireLogin: !u && !d }
  );
}
function as(t, e, i, n) {
  const r = (a) => et(t, e, "entry", n, { cause: a });
  if (!K(t.filteredUser)) return r("no_valid_identity");
  const { collected: s, missingKeys: o } = ae(t, xt, i, !1);
  if (o.length > 0) return r("missing_attribute");
  if (!Ke(t, s, i.targetPageIdentifier)) return r("no_strict_email");
  Ne(
    t,
    t.accountId,
    i.targetPageIdentifier,
    i.targetPageIdentifier,
    s,
    "intent",
    De("intent_checkout_step", i),
    !1,
    "intent_checkout_step",
    !1,
    void 0,
    Ze(e),
    { route: "entry", loggedIn: Vt(t), requireLogin: !1 }
  );
}
const gn = 2e4;
function cs(t, e, i, n, r) {
  pn(t);
  const s = () => {
    t.identityWait = void 0;
    const a = e.getCurrentHost?.() ?? e;
    jt(a) && mn(a, o);
  }, o = {
    signal: i,
    clickPathname: n,
    visitKey: r,
    route: N[N.length - 1],
    timer: setTimeout(s, Math.max(0, i.t + gn - Date.now()))
  };
  t.identityWait = o;
}
function pn(t) {
  t.identityWait && clearTimeout(t.identityWait.timer), t.identityWait = void 0;
}
function mn(t, e) {
  const i = fn(t.accountId), n = { logged_in: Vt(t), cause: "identity_wait_expired" };
  et(t, e.signal, i, e.visitKey, n, !0);
}
function ls(t, e) {
  const i = t.identityWait;
  if (!i || !K(e.filteredUser) || (pn(t), !jt(e))) return;
  if (e.logPlacementDiagnostic(
    w("identity_arrived", "pending_identity", {
      intent_kind: i.signal.kind,
      ...rt(i.signal.t)
    })
  ), N[N.length - 1] !== i.route || i.clickPathname !== S(window.location.pathname) || Date.now() - i.signal.t >= gn) return mn(e, i);
  At(t, e, i.signal, i.clickPathname, i.visitKey, !0);
}
function us(t) {
  const e = t.pathname;
  return typeof e == "string" && e.charAt(0) === "/" && e.length <= ss ? S(e) : void 0;
}
const Ee = /* @__PURE__ */ new Set(), vt = /* @__PURE__ */ new Set(), N = [];
function Te(t) {
  if (t === an) return "intent_commit";
  if (t === cn) return "intent_wallet";
  if (t === xt) return "intent_checkout_step";
  if (t === ln) return "intent_cart";
}
function Re(t) {
  return Te(t) !== void 0;
}
function ft(t, e = Date.now()) {
  t = S(t), N[N.length - 1]?.pathname !== t && (N.push({ pathname: t, since: e }), N.length > 8 && N.shift(), vt.clear());
}
function ds(t, e, i) {
  if (!i || !ns.includes(i.kind) || typeof i.t != "number" || !Number.isFinite(i.t))
    return;
  const n = `${i.kind}:${i.t}${i.adds === !0 ? ":adds" : ""}`;
  if (Ee.has(n) || (Ee.add(n), Ee.size > 4096 && Ee.delete(Ee.values().next().value), !jt(e)) || i.kind === "cart" && Qe(e.accountId).length === 0) return;
  fs(e.accountId, i);
  const r = C(e.filteredUser);
  i.kind === "cart" && i.adds === !0 && r !== null && _e(e.accountId) && Mr(e.accountId, i.t, r);
  const s = [...N].reverse().find((_) => _.since <= i.t), o = us(i) ?? s?.pathname;
  if (!o) return;
  const a = s && s.pathname === o ? s.since : 0, c = `${o}:${a}`, l = i.kind === "cart", u = i.kind === "commit" || i.kind === "wallet" || l, d = F(e.accountId, o);
  if (!d || (l ? d.cartIntent !== !0 : d.cartIntent === !0)) {
    u && At(t, e, i, o, c);
    return;
  }
  const m = window.location.pathname, h = o === S(m);
  if (l && !h && It(i)) {
    At(t, e, i, o, c);
    return;
  }
  const y = i.kind === "checkout_step" && d.checkoutStepIntent === !0;
  if (y && !h && It(i)) {
    as(e, i, d, c);
    return;
  }
  if (!(u || y) || !h) {
    et(e, i, "entry", c);
    return;
  }
  t.intentSource = Ze(i);
  const v = un(i.kind), P = t.scheduledDispatch;
  if (P && S(P.pathname) === S(m)) {
    Gt(t), Cn(t, e, P, "intent_released", v);
    return;
  }
  const f = t.pending.find(
    (_) => S(_.pathname) === S(m)
  );
  if (f) {
    f.intentSeen = v, f.waitingFor === "intent" && (t.pending = t.pending.filter((_) => _ !== f), me(
      t,
      e,
      f.event,
      m,
      f.triggeringUserId,
      f.triggeredAt,
      v
    ));
    return;
  }
  me(t, e, dn(v), m, void 0, i.t);
}
function jt(t) {
  return !t.isTargetingDisabled?.() && t.isForwardingAllowed?.() !== !1 && st(t) && t.isKitReady() && t.isPreselectionEnabled() && Pe(t.accountId);
}
function fs(t, e) {
  const i = e.kind === "cart" ? Qe(t) : x(t);
  new Set(i.map((r) => r.targetPageIdentifier)).forEach((r) => Gr(t, r, e.kind, e.t));
}
function pe(t) {
  return t === on;
}
const tt = 4, gs = ["Auto Button Click", "Auto Link Click"], ps = ["is_auto_button_click", "is_auto_link_click"];
function Ge(t) {
  return t.EventDataType === tt && gs.includes(t.EventName ?? "") || ps.some((e) => String(t.EventAttributes?.[e]) === "true");
}
function hn(t) {
  const e = t.accountId;
  if (!(!e || !Pe(e) || t.isTargetingDisabled?.() || t.isForwardingAllowed?.() === !1 || !st(t) || !t.isKitReady() || !t.isPreselectionEnabled()))
    return e;
}
function _n(t, e, i) {
  if (!e) return;
  const n = new Set(x(t).map((o) => o.targetPageIdentifier)), r = Date.now(), s = typeof i == "number" && Number.isFinite(i) && i <= r ? i : r;
  n.forEach((o) => Br(t, o, e, s));
}
function ms(t, e) {
  const i = Ge(e) ? hn(t) : void 0;
  i && _n(
    i,
    ar(e.EventAttributes),
    e.Timestamp
  );
}
function hs(t, e) {
  const i = hn(t);
  i && _n(i, cr(e), e?.t);
}
function fe(t, e) {
  return e.EventDataType === tt && p(e.EventName) && !Ge(e) && (t.triggerEventNames ?? []).includes(e.EventName);
}
const yn = "rokt.preselecttrigger", pi = "rokt.preselectdefaulted", _s = /^[A-Za-z][A-Za-z0-9_.]{0,63}$/, ys = 16, Ye = "preselectFormEmail", Pt = "preselectBoundUser";
function De(t, e) {
  return `${t}|${e.pathname}`;
}
function F(t, e) {
  if (t)
    return x(t).find((i) => ve(i.pathname, e));
}
function ke(t, e) {
  if (!(!t || !p(e)))
    return x(t).find((i) => i.targetPageIdentifier === e);
}
function bt(t, e) {
  if (!e)
    return t;
  const i = new Set(Object.keys(e).map((r) => r.toLowerCase())), n = {};
  for (const [r, s] of Object.entries(t))
    i.has(r.toLowerCase()) || (n[r] = s);
  return { ...n, ...e };
}
function Ht(t) {
  return t.getPreselectVariant?.() === "widened";
}
const Es = /iP(hone|od|ad)|Android|BlackBerry|BB10|IEMobile|Kindle/, Is = /Win(dows|16|95|98|CE)|Pocket Internet Explorer|OpenBSD|SunOS|CrOS|Linux|X11|Mac_PowerPC|Macintosh|QNX|BeOS|OS\/2/;
function As(t) {
  return Es.test(t) ? "MobileWeb" : Is.test(t) ? "DesktopWeb" : void 0;
}
function En(t, e) {
  if (p(t))
    return t;
  const i = As(navigator.userAgent), n = i ? t.byClientType?.[i] : void 0;
  if (n === qi)
    return;
  const r = e && t.byPaymentPick ? T(t.byPaymentPick, e) : void 0, s = t.byHostname ? T(t.byHostname, window.location.hostname) : void 0;
  return r ?? s ?? n ?? t.value;
}
function In(t) {
  return Object.values(t.preselectAttributeDefaults ?? {}).some((i) => E(i) && i.byPaymentPick) ? zr(t.accountId, t.targetPageIdentifier) : void 0;
}
function gt(t) {
  return new Set(
    Object.keys(t).filter((e) => !k(t[e])).map((e) => e.toLowerCase())
  );
}
function it(t, e, i) {
  const n = e.preselectAttributeDefaults;
  if (!n || Ht(t))
    return {};
  const r = /* @__PURE__ */ new Set([...gt(t.getUserIdentities?.() ?? {}), ...gt(i)]), s = gt(t.userAttributes ?? {}), o = In(e), a = {};
  for (const c of Object.keys(n)) {
    const l = c.toLowerCase();
    if (Ue(c, t.mappedEmailSha256Key) || r.has(l) || s.has(l) && !An(t, e, c))
      continue;
    const u = En(n[c], o);
    u !== void 0 && (a[c] = u);
  }
  return a;
}
function An(t, e, i) {
  const n = T(e.preselectAttributeDefaults ?? {}, i);
  return E(n) && n.skipRemembered === !0 && !Ht(t) && !Ue(i, t.mappedEmailSha256Key) && En(
    n,
    In(e)
  ) !== void 0;
}
function vs(t, e, i, n, r) {
  const s = e.preselectAttributeDefaults ?? {};
  return Object.keys(s).find((o) => {
    const a = s[o];
    if (p(a) || !a.skipValues)
      return !1;
    const c = a.skipValues.map((u) => u.toLowerCase()), l = n ?? {
      ...t.getUserIdentities?.() ?? {},
      ...T(r, o) !== void 0 ? {} : t.userAttributes ?? {},
      ...i
    };
    return Object.keys(l).some((u) => {
      const d = l[u];
      return u.toLowerCase() === o.toLowerCase() && (p(d) || typeof d == "number" || typeof d == "boolean") && c.includes(String(d).toLowerCase());
    });
  });
}
function Wt(t) {
  const e = t.getPreselectVariant?.();
  return e === "widened" || e === "standard" ? { variant: e } : {};
}
function Ps(t, e, i) {
  const n = t?.identityKeys;
  if (!n?.length || !e)
    return n;
  const r = $t(e, i);
  return r.length > 0 ? [...n, ...r] : n;
}
function bs(t, e, i) {
  const n = t?.preselectAttributeDefaults;
  if (!n || !e)
    return;
  const r = {};
  return $t(e, i).forEach((s) => {
    const o = n[s], a = p(o) ? void 0 : o?.matchGroups?.find((c) => c.includes(e[s]));
    a && (r[s] = a);
  }), Object.keys(r).length > 0 ? r : void 0;
}
function $t(t, e) {
  const i = Object.keys(e);
  return Object.keys(t).filter(
    (n) => T(e, n) === t[n] && !i.some((r) => r !== n && r.toLowerCase() === n.toLowerCase() && !k(e[r]))
  );
}
function vn(t, e) {
  if (!t)
    return;
  const i = $t(t, e).filter((n) => _s.test(n)).slice(0, ys);
  return i.length > 0 ? i.join(",") : void 0;
}
function Pn(t) {
  const e = Object.keys(t.preselectAttributeDefaults ?? {});
  return [...t.attributeKeys, ...e.filter((i) => !t.attributeKeys.includes(i))];
}
function ws(t) {
  if (!t)
    return;
  const e = x(t), i = [...new Set(e.flatMap((r) => r.intentSelectors?.commit ?? []))], n = [...new Set(e.flatMap((r) => r.intentSelectors?.checkoutStep ?? []))];
  if (!(i.length === 0 && n.length === 0))
    return {
      ...i.length > 0 ? { commit: i } : {},
      ...n.length > 0 ? { checkout_step: n } : {}
    };
}
function Pe(t) {
  return t ? x(t).length > 0 : !1;
}
function Ss(t, e, i = window.location.pathname) {
  if (t.pending.some((r) => r.pathname === i && !pe(r.event)))
    return;
  const n = t.scheduledDispatch;
  n && n.pathname === i && !pe(n.event) || me(t, e, on, i);
}
function Ts(t, e) {
  return !t || !p(e) ? !1 : x(t).some((i) => (i.triggerEventNames ?? []).includes(e));
}
function Be(t) {
  return !pe(t) && !Re(t) && t.EventDataType !== tt;
}
function ks(t, e) {
  const i = t.scheduledDispatch;
  return i && i.pathname === e && Be(i.event) ? !0 : t.pending.some((n) => n.pathname === e && Be(n.event));
}
function Ls(t, e, i, n) {
  if (!t.isKitReady() || !t.isPreselectionEnabled() || !zt(t, i))
    return "waits";
  const { collected: r, missingKeys: s } = ae(t, e, i);
  if (s.length > 0)
    return "waits";
  const o = t.accountId || "", a = de(Nt(o, S(n)));
  if (!a)
    return "now";
  const c = nt(t, o, i.targetPageIdentifier, r);
  return a.byEvent || qt(a.attributesDigest, c) ? "skipped" : "now";
}
function Cs(t, e, i) {
  t.pending = t.pending.filter((r) => r.pathname !== i);
  const n = e.accountId ? Mt(e.accountId) : null;
  e.accountId && n && n.pathname === i && re(e.accountId);
}
function Rs(t, e, i, n = window.location.pathname) {
  const r = F(e.accountId, n);
  if (!r || !fe(r, i))
    return;
  const s = Ls(e, i, r, n);
  if (s === "now")
    Cs(t, e, n);
  else if (ks(t, n) || s === "skipped" && t.scheduledDispatch?.pathname === n)
    return;
  me(t, e, i, n);
}
function Ds(t, e) {
  return t ? x(t).some((i) => i.attributeKeys.includes(e)) : !1;
}
function Os() {
  return { pending: [] };
}
function Gt(t) {
  if (t.dispatchTimer === void 0)
    return;
  const e = t.scheduledDispatch;
  return clearTimeout(t.dispatchTimer), t.dispatchTimer = void 0, t.scheduledDispatch = void 0, e;
}
function Us(t, e) {
  return t === void 0 ? e : e === void 0 ? t : Math.min(t, e);
}
function mi(t) {
  return pe(t) ? 0 : Re(t) || t.EventDataType === tt ? 2 : 1;
}
function Ks(t, e) {
  const i = F(t.accountId, e.pathname);
  return !!i && ae(t, e.event, i).missingKeys.length > 0;
}
function bn(t, e, i, n) {
  const r = t.pending.find((s) => s.pathname === n);
  return !!r && mi(i) < mi(r.event) && !(Be(i) && Ks(e, r));
}
function Q(t, e, i) {
  const n = t.pending.findIndex((r) => r.pathname === i.pathname);
  if (n >= 0) {
    if (bn(t, e, i.event, i.pathname))
      return;
    const r = t.pending[n];
    t.pending[n] = {
      ...i,
      triggeredAt: Us(r.triggeredAt, i.triggeredAt),
      intentSeen: i.intentSeen ?? r.intentSeen ?? Te(r.event)
    };
    return;
  }
  t.pending.push(i);
}
function Le(t) {
  if (!t?.getUserIdentities)
    return [];
  const e = t.getUserIdentities().userIdentities;
  return e ? Object.keys(e).filter((i) => {
    const n = e[i];
    return p(n) && n.length > 0;
  }).sort() : [];
}
function K(t) {
  return Le(t).length > 0;
}
const wt = /^[^\s@]+@[^\s@]+\.(?:[a-zA-Z]{2,}|xn--[a-zA-Z0-9-]+|[^\s@.\x00-\x7F]{2,})$/, q = /* @__PURE__ */ new WeakSet(), Ie = /* @__PURE__ */ new WeakSet(), ce = /* @__PURE__ */ new WeakSet(), Ae = /* @__PURE__ */ new WeakSet(), St = /* @__PURE__ */ new WeakSet(), hi = /* @__PURE__ */ new WeakSet();
function ze(t) {
  if (!(t instanceof HTMLInputElement)) return !1;
  const e = t.type;
  return e === "text" || e === "email" || t.getAttribute("autocomplete") === "email" && e !== "hidden" && e !== "password";
}
function Tt(t) {
  const e = t.target;
  if (!(e instanceof HTMLInputElement)) return;
  if (t.type === "blur" || t.type === "focusout") {
    if (t.isTrusted !== !0) return;
    !ze(e) || !Ie.has(e) ? (q.delete(e), ce.delete(e)) : q.has(e) || Ae.add(e);
    return;
  }
  const i = !hi.has(t);
  if (hi.add(t), t.isTrusted !== !0) {
    St.add(e), q.delete(e), Ie.delete(e), ce.delete(e), Ae.delete(e);
    return;
  }
  if (i && St.delete(e), !ze(e)) {
    q.delete(e), Ie.delete(e), ce.delete(e), Ae.delete(e);
    return;
  }
  i && (ce.add(e), Ae.delete(e), e.addEventListener("input", Tt, !0), e.addEventListener("change", Tt, !0), t.type === "change" ? (q.add(e), Ie.add(e)) : q.delete(e));
}
function Ns(t) {
  return ze(t) && (t.type === "email" || t.getAttribute("autocomplete") === "email" || wt.test(t.value.trim()));
}
function Oe(t) {
  return t.attributeKeys.find((e) => e.toLowerCase() === "email");
}
const Fs = 254;
function Ms(t) {
  return t.type === "email" || t.getAttribute("autocomplete") === "email" || t.value.includes("@");
}
function xs(t) {
  return Ms(t) || Ie.has(t) && !q.has(t) && !(Ae.has(t) && t !== document.activeElement);
}
function wn(t) {
  const e = /* @__PURE__ */ new Map(), i = [];
  let n = 0;
  document.querySelectorAll("input").forEach((o) => {
    if (!ze(o)) return;
    const a = q.has(o), c = ce.has(o);
    if (!a) {
      c && xs(o) && (n += 1), t && i.push(o);
      return;
    }
    const l = o.value.trim();
    wt.test(l) && !e.has(l.toLowerCase()) && e.set(l.toLowerCase(), l);
  });
  const r = e.size > 0 && n > 0;
  let s;
  return t && !r && e.size === 0 && i.forEach((o) => {
    const a = o.value.trim();
    a.length > Fs || !wt.test(a) || (St.has(o) ? s = "untrusted_fill" : s !== "untrusted_fill" && (ce.has(o) || o === document.activeElement ? s = "uncommitted_fill" : s !== "uncommitted_fill" && (s = "unseen_fill")));
  }), { emails: e, ambiguous: r, unfilled: s };
}
function Vs() {
  const { emails: t, ambiguous: e } = wn(!1);
  return t.size === 1 && !e ? t.values().next().value : void 0;
}
function Yt(t, e, i = {}) {
  const n = new Set(
    [e, "emailsha256", t.mappedEmailSha256Key].filter(p).map((o) => o.toLowerCase())
  ), r = t.getCurrentUser?.();
  return [
    i,
    t.userAttributes,
    t.filteredUser?.getAllUserAttributes?.() ?? {},
    t.getUserIdentities?.() ?? {},
    r?.getAllUserAttributes?.() ?? {},
    r?.getUserIdentities?.().userIdentities ?? {}
  ].some(
    (o) => Object.keys(o).some((a) => n.has(a.toLowerCase()) && !k(T(o, a)))
  );
}
const js = ["email", "emailsha256"];
function Ue(t, e) {
  const i = t.toLowerCase();
  return js.includes(i) || p(e) && i === e.toLowerCase();
}
function Ke(t, e, i) {
  return t.getOutgoingAttributes ? Ve(t.getOutgoingAttributes(e, i), t.mappedEmailSha256Key) : Ve(e, t.mappedEmailSha256Key) || Ve(t.getUserIdentities?.() ?? {}, t.mappedEmailSha256Key);
}
function Ve(t, e) {
  return Object.keys(t).some(
    (i) => Ue(i, e) && !k(T(t, i))
  );
}
function Bt(t, e, i, n = {}) {
  return e.readEmailInput !== !0 ? "read_disabled" : ve(e.pathname, window.location.pathname) ? t.isForwardingAllowed?.() !== !0 || t.isPreselectionPrivacyAllowed?.() === !1 || t.isTargetingDisabled?.() === !0 ? "privacy_blocked" : t.isEmailIdentityFiltered?.() === !0 ? "email_filtered" : Yt(t, i, n) ? "partner_email" : void 0 : "off_route";
}
function Hs(t, e, i, n) {
  const r = Bt(t, e, i, n.EventAttributes ?? {});
  if (r) return r;
  const { emails: s, ambiguous: o, unfilled: a } = wn(!0);
  return s.size > 1 || o ? "multiple_emails" : a ?? "no_field";
}
function Ws(t, e, i) {
  const n = window.location.pathname, r = F(e.accountId, n), s = r && Oe(r);
  return !!s && t.pending.some(
    (o) => o.pathname === n && !Bt(e, r, s, o.event.EventAttributes ?? {})
  ) && i.isTrusted === !0 && Ns(i.target);
}
function Sn(t, e, i, n) {
  const r = Oe(e);
  if (!r || !k(T(i, r)) || Bt(t, e, r, n.EventAttributes ?? {}))
    return;
  const s = Vs();
  if (s)
    return i[r] = s, r;
}
function zt(t, e) {
  const i = Oe(e);
  return K(t.filteredUser) || e.readEmailInput === !0 && !!i && Xt(t, e, {}).includes(i);
}
function $s(t) {
  return !!t && x(t).some((e) => e.readEmailInput === !0);
}
function Xe(t) {
  return t.length > 0 ? t.join(",") : "none";
}
function C(t) {
  const e = t?.getMPID?.();
  return e == null ? null : String(e);
}
function Tn(t, e) {
  const i = Le(t.filteredUser), n = t.getCurrentUser?.(), r = Le(n), s = C(t.filteredUser), o = C(n), a = [...e.identityKeys ?? [], "email", "emailsha256"];
  t.mappedEmailSha256Key && a.push(t.mappedEmailSha256Key);
  const c = new Set(a.map((m) => m.toLowerCase())), l = n?.getAllUserAttributes?.() ?? {}, u = [t.userAttributes, l].some(
    (m) => Object.entries(m).some(
      ([h, y]) => c.has(h.toLowerCase()) && p(y) && y.length > 0
    )
  );
  let d = "no_identities";
  return t.filteredUser ? o !== null && s !== o ? d = "mpid_mismatch" : r.length > 0 && (d = "kit_user_lacks_identities") : d = "no_filtered_user", {
    identity_reason: d,
    kit_identity_types: Xe(i),
    current_identity_types: Xe(r),
    mpid_match: o === null ? "unknown" : s === o,
    identity_attribute_present: u
  };
}
function Xt(t, e, i) {
  const n = Ht(t) ? e.widenedOptionalAttributeKeys ?? [] : [], r = new Set(
    [...e.optionalAttributeKeys ?? [], ...n].map((o) => o.toLowerCase())
  ), s = it(t, e, i);
  return e.attributeKeys.filter(
    (o) => !r.has(o.toLowerCase()) && k(T(i, o)) && T(s, o) === void 0
  );
}
function ae(t, e, i, n = !0) {
  const r = t.filteredUser?.getAllUserAttributes?.() || {}, s = new Set(i.identityKeys ?? []);
  let o;
  const a = {};
  for (const u of i.attributeKeys) {
    const d = t.getEventAttributeValue(e, u), m = T(t.userAttributes, u);
    let h = !k(d) || An(t, i, u) ? d : k(m) ? T(r, u) : m;
    if (k(h) && s.has(u)) {
      o || (o = t.getUserIdentities?.() ?? {});
      const y = T(o, u);
      h = p(y) && y !== "" ? y : void 0;
    }
    k(h) || (a[u] = h);
  }
  const c = e.EventAttributes ?? {};
  for (const u of Object.keys(i.preselectAttributeDefaults ?? {})) {
    if (!k(t.getEventAttributeValue(e, u)))
      continue;
    const d = Object.keys(c).find(
      (m) => m.toLowerCase() === u.toLowerCase() && !k(c[m])
    );
    d !== void 0 && (a[d] = c[d]);
  }
  const l = n ? Sn(t, i, a, e) : void 0;
  return {
    collected: a,
    missingKeys: Xt(t, i, a),
    formEmailKey: l
  };
}
const kn = /* @__PURE__ */ new WeakMap();
function Gs(t) {
  return kn.get(t);
}
function Ys(t, e, i) {
  i && kn.set(e, i);
  const n = (s) => {
    i?.();
    const o = e[Ye] ? "redacted" : s instanceof Error ? s.message : String(s);
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
const _i = /* @__PURE__ */ new Map(), yi = /* @__PURE__ */ new Map();
function Ei(t, e, i) {
  const n = t.get(e), r = { previous: i, earlier: n };
  return n && (n.later = r), t.set(e, r), r;
}
function Ii(t, e, i, n) {
  const { earlier: r, later: s } = i;
  if (s) {
    s.previous = i.previous, s.earlier = r, r && (r.later = s);
    return;
  }
  n(i.previous), r && (r.later = void 0), t.get(e) === i && (r ? t.set(e, r) : t.delete(e));
}
function nt(t, e, i, n) {
  try {
    const r = ke(e, i), s = r ? it(t, r, n) : void 0, o = bt(n, s), a = t.getOutgoingAttributes ? t.getOutgoingAttributes(n, i) : { ...t.getUserIdentities?.() ?? {}, ...o }, c = Object.keys(a).sort().filter((f) => Ue(f, t.mappedEmailSha256Key) && !k(T(a, f))).map((f) => [f, T(a, f)]), l = Object.keys(r?.preselectAttributeDefaults ?? {}), u = (f) => l.some((_) => _.toLowerCase() === f.toLowerCase()), d = {};
    for (const [f, _] of Object.entries(o))
      u(f) || (d[f] = _);
    for (const f of l) {
      const _ = Object.keys(a).filter((b) => b.toLowerCase() === f.toLowerCase() && !k(a[b])).sort().map((b) => [b, a[b]]);
      _.length > 0 && (d[f] = _);
    }
    const m = JSON.stringify(d), h = [.../* @__PURE__ */ new Set([...r?.attributeKeys ?? [], ...Object.keys(o)])].filter((f) => !u(f)).sort().filter((f) => {
      const _ = T(a, f);
      return _ !== void 0 && _ !== T(o, f);
    }).map((f) => [f, T(a, f)]), y = c.length > 0 ? `${m}|${JSON.stringify(c)}` : m, v = h.length > 0 ? `${y}>${JSON.stringify(h)}` : y, P = vn(t.getPreselectFills?.(n, i) ?? s, a);
    return P ? { digest: J(`${v}#${P}`), unmarkedDigest: J(v) } : { digest: J(v) };
  } catch {
    return {};
  }
}
function qt(t, e) {
  return t !== void 0 && e.digest !== void 0 && (t === e.digest || t === e.unmarkedDigest);
}
function Jt(t, e, i, n) {
  return fi(t, e, i.digest, n) || i.unmarkedDigest !== void 0 && fi(t, e, i.unmarkedDigest, n);
}
function Qt(t) {
  return !t.isTargetingDisabled?.() && t.isPreselectionPrivacyAllowed?.() !== !1 && t.isForwardingAllowed?.() !== !1;
}
function Ne(t, e, i, n, r, s, o, a = !1, c, l = a, u, d, m) {
  if (!Qt(t))
    return !1;
  const h = c ? { intent_kind: c.replace("intent_", "") } : {}, y = ke(e, n), v = y ? it(t, y, r) : {}, P = t.getOutgoingAttributes?.(r, n), f = y ? vs(t, y, r, P, v) : void 0;
  if (f)
    return t.logPlacementDiagnostic(
      w("skipped", `skip_value:${f}`, h)
    ), !1;
  const _ = Nt(e, i), b = nt(t, e, n, r), A = b.digest;
  if (c && Jt(e, n, b, c !== "intent_cart"))
    return t.logPlacementDiagnostic(w("skipped", "active_preselection", h)), !0;
  if (a && de(_)?.byEvent)
    return t.logPlacementDiagnostic(w("skipped", "active_preselection")), !1;
  const O = A !== void 0 ? de(_) : null;
  if (A !== void 0) {
    if (qt(O?.attributesDigest, b))
      return t.logPlacementDiagnostic(w("skipped", "active_preselection", h)), !0;
    wr(
      _,
      A,
      l || !!c && de(_)?.byEvent === !0
    );
  }
  const L = Object.keys(v).filter(($) => !P || T(P, $) === v[$]);
  t.logPlacementDiagnostic(
    w("fired", s, {
      identity_types: Xe(Le(t.filteredUser)),
      ...u ? { email_source: "input" } : {},
      ...c ? {
        ...h,
        intent_route: m ? m.route : "entry",
        ...d ? { intent_source: d } : {},
        ...m ? { logged_in: m.loggedIn } : {}
      } : {},
      ...Wt(t),
      ...L.length > 0 ? { defaulted_keys: L.join(",") } : {}
    })
  );
  const Y = `${e}:${n}`, te = Ei(
    _i,
    Y,
    Hr(e, n, A, c === "intent_cart")
  ), R = A !== void 0 ? Ei(yi, _, O) : void 0;
  let B = !1;
  const Fe = () => {
    B || (B = !0, R && Ii(
      yi,
      _,
      R,
      ($) => Sr(_, $, A)
    ), Ii(
      _i,
      Y,
      te,
      ($) => Wr(e, n, $, A)
    ));
  };
  return Ys(t, {
    attributes: { ...r, [yn]: o },
    preselect: !0,
    identifier: n,
    omitUrl: !0,
    ...u ? { [Ye]: { key: u, mpid: C(t.filteredUser) } } : {},
    ...m ? { [Pt]: { mpid: C(t.filteredUser), requireLogin: m.requireLogin } } : {}
  }, Fe), !0;
}
function Bs(t, e) {
  if (!e.accountId || !e.isKitReady())
    return;
  const i = Mt(e.accountId);
  if (!i)
    return;
  if (t.pending.some((o) => o.pathname === i.pathname)) {
    re(e.accountId);
    return;
  }
  if (!e.isPreselectionEnabled()) {
    re(e.accountId);
    return;
  }
  if (!K(e.filteredUser) || (re(e.accountId), C(e.filteredUser) !== i.mpid))
    return;
  const n = F(e.accountId, i.pathname);
  if (!n || n.targetPageIdentifier !== i.identifier)
    return;
  if (!i.byEvent && ot(e)) {
    e.logPlacementDiagnostic(w("missed", "recovery_awaits_intent"));
    return;
  }
  const r = ne(i.attributes), s = Xt(e, n, r);
  if (s.length > 0) {
    for (const o of s)
      e.logPlacementDiagnostic(
        w("missed", `missing_persisted_attribute:${o}`, Wt(e))
      );
    return;
  }
  Ne(
    e,
    e.accountId,
    i.identifier,
    i.identifier,
    r,
    "recovered",
    De("recovered", n)
  );
}
function Zt(t) {
  return !t.isTargetingDisabled?.() && t.isPreselectionPrivacyAllowed?.() !== !1 && t.isKitReady() && t.isPreselectionEnabled();
}
function rt(t) {
  return t === void 0 ? {} : { since_trigger_ms: Date.now() - t };
}
function Ln(t, e, i) {
  if (e.waitingFor !== "intent" || e.intentSeen)
    return !1;
  const n = F(t.accountId, e.pathname);
  return !!n && n === F(t.accountId, i);
}
function kt(t, e) {
  Zt(t) && t.logPlacementDiagnostic(
    w("missed", "left_trigger_path", {
      waiting_for: e.waitingFor,
      has_identity: K(t.filteredUser),
      ...rt(e.triggeredAt)
    })
  );
}
function me(t, e, i, n = window.location.pathname, r, s = Date.now(), o) {
  const a = t.pending.filter((u) => u.pathname !== n);
  if (a.length > 0) {
    const u = e.accountId ? Mt(e.accountId) : null;
    e.accountId && u && a.some((d) => d.pathname === u.pathname) && re(e.accountId), a.forEach((d) => {
      Ln(e, d, n) ? t.intentWaitMovedWithin = F(e.accountId, n) : kt(e, d);
    }), t.pending = t.pending.filter((d) => d.pathname === n);
  }
  const c = Gt(t), l = c !== void 0 && c.pathname === n && pe(c.event);
  if (c && !l) {
    const u = F(e.accountId, c.pathname);
    S(c.pathname) !== S(n) && u?.releaseHoldOnRouteChange ? (Cn(t, e, c, "hold_released_on_route_change"), t.pending = t.pending.filter((d) => d.pathname === c.pathname ? (kt(e, d), !1) : !0)) : Ai(e, c, n);
  }
  zs(t, e, i, n, r, s, l, o), l && t.scheduledDispatch === void 0 && Ai(e, c, n);
}
function Ai(t, e, i) {
  t.logPlacementDiagnostic(
    w("missed", "hold_cancelled", {
      held_ms: Date.now() - e.heldAt,
      same_path: e.pathname === i
    })
  );
}
function zs(t, e, i, n, r, s, o, a) {
  const c = t.pending.find((u) => S(u.pathname) === S(n));
  if (a ?? (a = Te(i) ?? c?.intentSeen ?? Te(c?.event)), e.isTargetingDisabled?.() || e.isPreselectionPrivacyAllowed?.() === !1)
    return;
  const l = F(e.accountId, n);
  if (!l) {
    Xs(e, n);
    return;
  }
  if (!(r !== void 0 && C(e.filteredUser) !== r)) {
    if (!a && !fe(l, i) && ot(e)) {
      const u = t.intentWaitMovedWithin === l;
      t.intentWaitMovedWithin = void 0;
      const d = u || c?.waitingFor === "intent" && c.awaitingIntentLogged === !0, m = e.isKitReady() && e.isPreselectionEnabled();
      Q(t, e, {
        event: i,
        pathname: n,
        // Bound to an identified shopper, as a timer hold is, so another user's click never sends
        // this page view's attributes. A guest stays unbound so signing in at checkout still fires.
        triggeringUserId: r ?? (K(e.filteredUser) ? C(e.filteredUser) : void 0),
        triggeredAt: s,
        waitingFor: "intent",
        awaitingIntentLogged: d || m
      }), !d && m && e.logPlacementDiagnostic(w("held", "awaiting_intent")), m && Lt(e, l, i);
      return;
    }
    if (!e.isKitReady()) {
      if (bn(t, e, i, n))
        return;
      const u = [], d = C(e.filteredUser);
      if (e.accountId && d && K(e.filteredUser)) {
        const { collected: m, missingKeys: h, formEmailKey: y } = ae(e, i, l);
        if (h.length === 0 && !y) {
          const v = ne(m);
          (fe(l, i) || !!a ? di(
            e.accountId,
            n,
            l.targetPageIdentifier,
            v,
            d,
            !0
          ) : di(e.accountId, n, l.targetPageIdentifier, v, d)) || u.push(w("queued", "persist_failed"));
        }
      }
      Q(t, e, {
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
      if (Lt(e, l, i), !zt(e, l)) {
        e.logPlacementDiagnostic(
          w("missed", "no_valid_identity", Tn(e, l))
        ), Q(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "identity" });
        return;
      }
      if (l.dispatchDelayMs !== void 0 && !fe(l, i) && !Re(i) && !a) {
        const u = C(e.filteredUser), d = Math.min(
          l.dispatchDelayMs,
          Math.max(0, s + l.dispatchDelayMs - Date.now())
        );
        t.scheduledDispatch = { event: i, pathname: n, heldAt: Date.now(), heldForUserId: u, triggeredAt: s }, o || e.logPlacementDiagnostic(w("held", "dispatch_delay", { delay_ms: d })), t.dispatchTimer = setTimeout(() => {
          t.dispatchTimer = void 0, t.scheduledDispatch = void 0, Rn(t, e.getCurrentHost?.() ?? e, i, n, u, s);
        }, d);
        return;
      }
      Dn(
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
function Lt(t, e, i) {
  if (!t.accountId) return;
  const n = Oe(e), r = e.readEmailInput === !0 && !!n && (Yt(t, n, i.EventAttributes ?? {}) || Sn(t, e, {}, i) !== void 0);
  Nr(
    t.accountId,
    e.targetPageIdentifier,
    K(t.filteredUser) || r
  );
}
function Xs(t, e) {
  const i = t.accountId;
  !i || t.isKitReady() && !t.isPreselectionEnabled() || x(i).forEach((n) => {
    ts(n.pathname, e) && jr(i, n.targetPageIdentifier);
  });
}
function qs(t) {
  const e = N[N.length - 1];
  return t !== void 0 && (e === void 0 || t < e.since);
}
function Js() {
  try {
    return new URL(document.referrer).origin === window.location.origin ? "same_origin" : "other_origin";
  } catch {
    return "none";
  }
}
function st(t) {
  return t.isCheckoutIntentActive?.() === !0 && t.isPreselectionPrivacyAllowed?.() !== !1;
}
function ot(t) {
  return st(t) && t.isLinkIntentWithheld?.() !== !0;
}
function Cn(t, e, i, n, r) {
  Rn(
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
function Rn(t, e, i, n, r, s, o, a) {
  const c = F(e.accountId, n);
  if (!(!c || e.isTargetingDisabled?.() || e.isPreselectionPrivacyAllowed?.() === !1)) {
    if (!a && !fe(c, i) && !Re(i) && ot(e)) {
      const l = e.isKitReady() && e.isPreselectionEnabled();
      Q(t, e, {
        event: i,
        pathname: n,
        triggeringUserId: r,
        triggeredAt: s,
        waitingFor: "intent",
        awaitingIntentLogged: l
      }), l && e.logPlacementDiagnostic(w("held", "awaiting_intent"));
      return;
    }
    if (!e.isKitReady()) {
      Q(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "launcher" });
      return;
    }
    if (e.isPreselectionEnabled()) {
      if (!zt(e, c)) {
        e.logPlacementDiagnostic(
          w("missed", "no_valid_identity", Tn(e, c))
        ), Q(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "identity" });
        return;
      }
      C(e.filteredUser) === r && Dn(t, e, i, n, c, r, s, o, a);
    }
  }
}
function Dn(t, e, i, n, r, s, o, a, c, l) {
  if (e.isPreselectionPrivacyAllowed?.() === !1) return;
  const { collected: u, missingKeys: d, formEmailKey: m } = ae(e, i, r), h = t.lastResolvedPageView, y = N[N.length - 1], v = S(n);
  if (Re(i) && h && h.accountId === e.accountId && h.pathname === v && h.route === y && h.userId === C(e.filteredUser) && h.identifier === r.targetPageIdentifier && h.attributeKeys.some(
    (A) => r.attributeKeys.includes(A) && k(T(u, A))
  ))
    return;
  if (d.length > 0) {
    const A = Le(e.filteredUser), O = Oe(r);
    for (const L of d)
      e.logPlacementDiagnostic(
        w("missed", `missing_attribute:${L}`, {
          identity_types: Xe(A),
          key_is_identity: A.some((Y) => Y.toLowerCase() === L.toLowerCase()),
          ...L === O ? { email_reason: Hs(e, r, L, i) } : {},
          ...Wt(e)
        })
      );
    Q(t, e, {
      event: i,
      pathname: n,
      triggeringUserId: s,
      triggeredAt: o,
      intentSeen: c,
      waitingFor: "attribute"
    });
    return;
  }
  const P = c ?? Te(i);
  if (P && !Ke(e, u, r.targetPageIdentifier)) {
    t.noEmailLoggedPathname !== v && (t.noEmailLoggedPathname = v, e.logPlacementDiagnostic(
      w("missed", "no_strict_email", {
        intent_kind: P.replace("intent_", ""),
        has_identity: K(e.filteredUser)
      })
    )), Q(t, e, {
      event: i,
      pathname: n,
      triggeringUserId: s,
      triggeredAt: o,
      intentSeen: P,
      waitingFor: "attribute"
    });
    return;
  }
  t.noEmailLoggedPathname = void 0, l && (t.pending = t.pending.filter((A) => A !== l));
  const f = fe(r, i), _ = P ?? (f ? "event" : pe(i) ? "pathname" : "pageview");
  Ne(
    e,
    e.accountId || "",
    S(n),
    r.targetPageIdentifier,
    u,
    a ?? (P ? "intent" : f ? "event_trigger" : "fired"),
    De(_, r),
    f && !P,
    P,
    f,
    m,
    P ? t.intentSource : void 0
  ) && (Be(i) || f) && (t.lastResolvedPageView = {
    accountId: e.accountId,
    pathname: v,
    route: y,
    userId: C(e.filteredUser),
    identifier: r.targetPageIdentifier,
    attributeKeys: Object.keys(u)
  });
}
const Qs = ["", "0", "[]", "{}", "false", "null"];
function On(t) {
  if (k(t)) return !1;
  if (Array.isArray(t)) return !0;
  const e = String(t).trim();
  if (Qs.includes(e.toLowerCase())) return !1;
  try {
    const i = JSON.parse(e);
    return !Array.isArray(i) || i.length > 0;
  } catch {
    return !0;
  }
}
function _e(t) {
  const e = t ? Qe(t) : [];
  return e.length === 1 && e[0].cartUserAttribute ? e[0] : void 0;
}
function Zs(t) {
  return _e(t) !== void 0;
}
function vi(t, e) {
  const i = _e(t)?.cartUserAttribute;
  return p(i) && i.toLowerCase() === e.toLowerCase();
}
function Pi(t, e, i) {
  const n = _e(t)?.cartUserAttribute?.toLowerCase();
  if (!n || i && Pn(i).some((s) => s.toLowerCase() === n))
    return e;
  const r = {};
  for (const [s, o] of Object.entries(e))
    s.toLowerCase() !== n && (r[s] = o);
  return r;
}
function Un(t, e) {
  const i = t.filteredUser?.getAllUserAttributes?.() ?? {}, n = Object.keys(i).find((r) => r.toLowerCase() === e.toLowerCase());
  return n === void 0 ? void 0 : i[n];
}
function Kn(t) {
  const { search: e, hash: i } = window.location, n = /^#!|^#[^?&]*\//.test(i);
  return S(t) + e + (n ? i : "");
}
function Nn(t) {
  try {
    return J(p(t) ? t : JSON.stringify(t) ?? "");
  } catch {
    return;
  }
}
function bi(t, e, i = window.location.pathname) {
  t.cartPageViewPathname = S(i), Fn(t, e, i);
}
function Fn(t, e, i) {
  const n = _e(e.accountId);
  if (!n || t.cartPageViewPathname !== S(i) || // The cart entry's own route waits for its add-to-cart click, and another entry's route is a checkout step the
  // shopper reaches after the cart, where a call made for the cart page is rarely used.
  F(e.accountId, i) !== void 0 || !Qt(e)) {
    t.cartPageViewPathname = void 0;
    return;
  }
  if (!e.isKitReady()) return;
  if (!e.isPreselectionEnabled()) {
    t.cartPageViewPathname = void 0;
    return;
  }
  const r = e.accountId;
  if (Zr(r, n.targetPageIdentifier, J(Kn(i)))) {
    t.cartPageViewPathname = void 0;
    return;
  }
  const s = Un(e, n.cartUserAttribute);
  if (!(On(s) || xr(r, C(e.filteredUser))) || !K(e.filteredUser)) return;
  const a = Nn(s);
  if (a !== void 0 && Jr(r, n.targetPageIdentifier, a, C(e.filteredUser)))
    return;
  const { collected: c, missingKeys: l } = ae(e, is, n, !1);
  if (l.length > 0 || !Ke(e, c, n.targetPageIdentifier)) return;
  t.cartPageViewPathname = void 0;
  const u = nt(e, r, n.targetPageIdentifier, c), d = de(Nt(r, n.targetPageIdentifier));
  Jt(r, n.targetPageIdentifier, u) || qt(d?.attributesDigest, u) || Ne(
    e,
    r,
    n.targetPageIdentifier,
    n.targetPageIdentifier,
    c,
    "fired",
    De("pageview_cart", n),
    !1,
    void 0,
    !1,
    void 0,
    void 0,
    { requireLogin: !1 }
  );
}
function eo(t, e, i = window.location.pathname) {
  if (Bs(t, e), ls(t, e), t.cartPageViewPathname !== void 0 && Fn(t, e, i), t.pending.length === 0)
    return;
  const n = t.pending;
  t.pending = [], n.forEach((r) => {
    const { event: s, pathname: o, storedDiagnostics: a, triggeringUserId: c, triggeredAt: l, waitingFor: u, intentSeen: d } = r, m = Zt(e), h = K(e.filteredUser), y = rt(l);
    if (m && u === "identity" && h && e.logPlacementDiagnostic(
      w("identity_arrived", "pending_identity", {
        ...y,
        on_trigger_path: o === i
      })
    ), o !== i) {
      Ln(e, r, i) ? t.intentWaitMovedWithin = F(e.accountId, i) : kt(e, { waitingFor: u, triggeredAt: l });
      return;
    }
    if (u === "intent" && !d) {
      const v = F(e.accountId, o);
      if (v && ot(e)) {
        !r.awaitingIntentLogged && e.isKitReady() && e.isPreselectionEnabled() && (e.logPlacementDiagnostic(w("held", "awaiting_intent")), Lt(e, v, s), r.awaitingIntentLogged = !0), t.pending.push(r);
        return;
      }
    }
    m && a?.forEach((v) => e.logPlacementDiagnostic(v)), t.scheduledDispatch?.pathname !== o && me(t, e, s, o, c, l, d);
  });
}
function to(t, e, i) {
  if (!t.accountId || !Zt(t))
    return;
  const n = ke(t.accountId, e);
  if (!n)
    return;
  const r = _e(t.accountId);
  if (r?.targetPageIdentifier === n.targetPageIdentifier) {
    const a = Kn(window.location.pathname);
    a !== "/" && Qr(t.accountId, n.targetPageIdentifier, J(a));
    const c = Un(t, r.cartUserAttribute);
    qr(
      t.accountId,
      n.targetPageIdentifier,
      On(c) ? Nn(c) : void 0,
      C(t.filteredUser)
    );
  }
  const s = Xr(t.accountId, n.targetPageIdentifier);
  if (!s || (st(t) && t.isForwardingAllowed?.() !== !1 && t.logPlacementDiagnostic(
    w("arrived", "intent_arrival", {
      ...io(s),
      ...no(s, i)
    })
  ), s.firedAt !== void 0))
    return;
  const o = s.triggeredAt !== void 0;
  t.logPlacementDiagnostic(
    w("missed", "arrival_without_fire", {
      trigger_seen: o,
      identity_seen_on_trigger_path: s.identitySeenAt !== void 0,
      has_identity: K(t.filteredUser),
      // Another tab's checkout caches its offers in that tab, so this arrival still misses. This tab's
      // own trigger counts too: the device marker can expire, be cleared by another tab or fail to save.
      trigger_seen_any_tab: o || Fr(t.accountId, n.targetPageIdentifier),
      ...rt(s.triggeredAt),
      near_miss_seen: qs(s.nearMissAt),
      // Page memory loses the trigger record on a full navigation, so trigger_seen reads false.
      storage: Gn() ? "page" : "device",
      referrer: Js()
    })
  );
}
function io(t) {
  const e = t.intentAt === void 0 || t.intentKind === void 0 ? "none" : so(Date.now() - t.intentAt);
  return {
    intent_seen: e === "none" ? "none" : t.intentKind,
    lead: e,
    fired: t.firedAt !== void 0
  };
}
function no(t, e) {
  const i = ur(e), n = t.paymentPickAt === void 0 ? -1 : Date.now() - t.paymentPickAt, r = t.paymentPick && n >= 0 && n < ge ? t.paymentPick : "none";
  if (r === "none" && i === "absent")
    return {};
  const s = t.firedAt === void 0 ? -1 : Date.now() - t.firedAt, o = t.paymentAtFire && s >= 0 && s < ge ? t.paymentAtFire : "none";
  return {
    payment_guess: o,
    payment_pick: r,
    payment_arrival: i,
    payment_match: o !== "none" && i !== "absent" && i !== "other" ? o === i : "n/a"
  };
}
const ro = [
  [1e3, "lt1s"],
  [2e3, "1s_2s"],
  [5e3, "2s_5s"],
  [1e4, "5s_10s"],
  [2e4, "10s_20s"],
  [6e4, "20s_60s"],
  [3e5, "60s_300s"],
  [ge, "300s_1800s"]
];
function so(t) {
  if (t < 0)
    return "none";
  const e = ro.find(([i]) => t < i);
  return e ? e[1] : "none";
}
function oo() {
  return {
    context: null,
    lifecycle: "idle",
    recreateInFlight: null
  };
}
function ao(t, e) {
  t.context = {
    accountId: e.accountId,
    launcherOptions: { ...e.launcherOptions },
    legacyRoktExtensions: [...e.legacyRoktExtensions]
  };
}
function co(t) {
  t.lifecycle = "attached";
}
function lo(t) {
  t.lifecycle !== "idle" && (t.lifecycle = "terminated");
}
function uo(t) {
  t.lifecycle = "terminated";
}
function fo(t) {
  t.context = null, t.lifecycle = "idle", t.recreateInFlight = null;
}
function go(t, e, i) {
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
const wi = "rokt:intent", Si = "LEAD_CAPTURE_SUBMITTED";
class po {
  constructor(e) {
    this.handlers = e, this.config = null, this.dispatchedForPageView = !1;
  }
  configure(e) {
    this.config = e, this.dispatchedForPageView = !1, this.detachListeners(), this.isIdentityCaptureBridgeEnabled(this.config) && (this.leadCaptureSubmittedListener = (i) => {
      const n = this.parseLeadCaptureSubmittedPayload(i);
      n && this.handlers.onLeadCaptureSubmitted(n);
    }, window.addEventListener(Si, this.leadCaptureSubmittedListener)), this.isExitIntentBridgeEnabled(this.config) && (this.exitIntentListener = (i) => this.handleExitIntentEvent(i), window.addEventListener(wi, this.exitIntentListener));
  }
  resetPageViewState() {
    this.dispatchedForPageView = !1;
  }
  dispose() {
    this.detachListeners(), this.config = null, this.dispatchedForPageView = !1;
  }
  detachListeners() {
    this.exitIntentListener && (window.removeEventListener(wi, this.exitIntentListener), this.exitIntentListener = void 0), this.leadCaptureSubmittedListener && (window.removeEventListener(Si, this.leadCaptureSubmittedListener), this.leadCaptureSubmittedListener = void 0);
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
    const r = n.filter((s) => p(s)).map((s) => s.trim()).filter((s) => s.length > 0);
    return new Set(r);
  }
  extractExitIntentReason(e) {
    return e instanceof CustomEvent && e.detail && p(e.detail.reason) ? e.detail.reason : "unknown";
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
    const n = i.body, r = p(n.email) ? n.email : void 0, s = p(n.mobile_number) ? n.mobile_number : void 0, o = {};
    p(r) && r.length > 0 && (o.email = r), p(s) && s.length > 0 && (o.mobile_number = s);
    const a = {}, c = this.allowCustomUserAttributes(this.config), l = this.getAllowedUserAttributeKeys(this.config);
    this.mergeLeadCaptureUserAttributes(
      a,
      E(n.userAttributes) ? n.userAttributes : null,
      c,
      l
    );
    const u = p(n.rclid) ? n.rclid : void 0;
    u && u.length > 0 && (a.rokt_rclid = u);
    const d = p(n.accountID) ? n.accountID : void 0;
    d && d.length > 0 && (a.rokt_account_id = d);
    const m = p(n.referralCreativeID) ? n.referralCreativeID : void 0;
    return m && m.length > 0 && (a.rokt_referral_creative_id = m), { identities: o, userAttributes: a };
  }
  isSafeLeadCaptureUserAttributeKey(e) {
    return e === "__proto__" || e === "constructor" || e === "prototype" ? !1 : /^[a-zA-Z0-9_.-]+$/.test(e);
  }
  isSupportedLeadCaptureUserAttributeValue(e) {
    return p(e) || typeof e == "number" || typeof e == "boolean" ? !0 : Array.isArray(e) ? e.every((i) => p(i)) : !1;
  }
  mergeLeadCaptureUserAttributes(e, i, n, r) {
    if (i)
      for (const [s, o] of Object.entries(i))
        !n || !r.has(s) || this.isSafeLeadCaptureUserAttributeKey(s) && this.isSupportedLeadCaptureUserAttributeValue(o) && (e[s] = o);
  }
}
const M = "Rokt", mo = 7, je = 181, ho = "selectPlacements", _o = ["paypalpayerid"], yo = "Auto Button Click", Eo = "Auto Link Click", Ti = "rokt_placement", Io = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/, Ao = 500, vo = "apps.roktecommerce.com", Po = 0.1, bo = "ThankYouPageJourney", wo = "rokt-launcher", So = "rokt-thank-you-element", To = "userIdentifiedInWorkspace", ki = 3, ko = 2, Lo = "page_events", Co = "page_view_attributes", Ro = "mparticle_session_id", Li = "mparticle_device_id", pt = "exit-intent", Do = [
  "3479519924056514560",
  "3484183287406608384",
  "3198447216177237634",
  "3292347205549055462"
], Oo = "exit-intent-placement", Ci = 500, ei = {
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  UNHANDLED_EXCEPTION: "UNHANDLED_EXCEPTION",
  IDENTITY_REQUEST: "IDENTITY_REQUEST",
  LOG_DELIVERY_FAILURE: "LOG_DELIVERY_FAILURE"
}, be = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARNING: "WARNING"
}, Uo = "apps.rokt-api.com", Ko = "/v1/log", No = "/v1/errors", Fo = 10;
function g() {
  return window.mParticle;
}
function Ri(t, e) {
  const n = [at(t), "/wsdk/integrations/launcher.js"].join("");
  return !e || e.length === 0 ? n : n + "?extensions=" + e.join(",");
}
function Di(t) {
  return [at(t), "/rokt-elements/rokt-element-thank-you.js"].join("");
}
function at(t) {
  const e = t !== void 0 ? t : Uo;
  return e.includes("://") ? e.replace(/\/+$/, "") : ["https://", e].join("");
}
function Mn(t, e, i) {
  if (t)
    return t.startsWith("http://") || t.startsWith("https://") ? t : "https://" + t;
  const r = e?.includes("://") && !/^https?:\/\//i.test(e) ? void 0 : e;
  return at(r) + i;
}
function Oi(t, e, i) {
  if (document.getElementById(t)) return;
  const n = document.head || document.body, r = document.createElement("script");
  r.id = t, r.type = "text/javascript", r.src = e, r.async = !0, r.crossOrigin = "anonymous", r.fetchPriority = "high", i?.onLoad && (r.onload = i.onLoad), i?.onError && (r.onerror = i.onError), n.appendChild(r);
}
function He(t) {
  if (!t)
    return [];
  const e = Wi(t);
  return e === void 0 ? (console.error("Settings string contains invalid JSON"), []) : e;
}
function Ui(t) {
  const e = t ? He(t) : [], i = [], n = [];
  let r = !1;
  for (let s = 0; s < e.length; s++) {
    const o = e[s].value;
    o === "thank-you-journey" ? (r = !0, n.push(bo)) : i.push(o);
  }
  return {
    roktExtensionsQueryParams: i,
    legacyRoktExtensions: n,
    loadThankYouElement: r
  };
}
async function Mo(t, e) {
  const i = [];
  if (e)
    for (const n of t)
      i.push(e.use(n));
  return Promise.all(i);
}
function Ki(t) {
  if (!t)
    return {};
  const e = {};
  for (let i = 0; i < t.length; i++) {
    const n = t[i];
    e[n.jsmap] = n.value;
  }
  return e;
}
function Ni(t) {
  const e = {};
  if (!Array.isArray(t))
    return e;
  for (let i = 0; i < t.length; i++) {
    const n = t[i];
    if (!n || !p(n.value) || !p(n.map))
      continue;
    const r = n.value, s = n.map;
    e[r] || (e[r] = []), e[r].push({
      eventAttributeKey: s,
      conditions: Array.isArray(n.conditions) ? n.conditions : []
    });
  }
  return e;
}
function Fi(t, e, i) {
  return g().generateHash([t, e, i].join(""));
}
function xo(t) {
  let n = "mParticle_wsdkv_" + g().getVersion() + "_kitv_" + "3.33.0";
  return t && (n += "_" + t), n;
}
function Mi(t) {
  return !!(t && Do.includes(t));
}
function Ct(t) {
  const e = document.createElement("iframe");
  e.style.display = "none", e.setAttribute("sandbox", "allow-scripts allow-same-origin"), e.src = t, e.onload = function() {
    e.onload = null, e.parentNode && e.parentNode.removeChild(e);
  };
  const i = document.body || document.head;
  i && i.appendChild(e);
}
function xi(t, e) {
  const i = J(window.location.origin);
  if (he._allowedOriginHashes.indexOf(i) === -1 || Math.random() >= Po)
    return;
  const r = window.__rokt_li_guid__;
  if (!r || t && t.includes("://") && !/^https:\/\//i.test(t))
    return;
  const s = Rt(window.location.href), o = "version=" + encodeURIComponent(e ?? "") + "&launcherInstanceGuid=" + encodeURIComponent(r) + "&pageUrl=" + encodeURIComponent(s), a = t ? at(t) : "https://apps.rokt.com";
  Ct(a + "/v1/wsdk-init/index.html?" + o), Ct(
    "https://" + vo + "/v1/wsdk-init/index.html?" + o + "&isControl=true"
  );
}
function Vo() {
  return typeof window < "u" && !!window.location?.search?.toLowerCase().includes("mp_enable_logging=true");
}
function jo() {
  if (typeof window > "u")
    return;
  const t = window.location?.href;
  return t ? Rt(t) : void 0;
}
function Ho() {
  return typeof window < "u" ? window.navigator?.userAgent : void 0;
}
class xn {
  constructor() {
    this._logCount = {};
  }
  incrementAndCheck(e) {
    const n = (this._logCount[e] || 0) + 1;
    return this._logCount[e] = n, n > Fo;
  }
}
class we {
  constructor(e, i, n, r, s) {
    this._reporter = "mp-wsdk";
    const o = e.isLoggingEnabled;
    this._integrationName = i || "", this._launcherInstanceGuid = n, this._accountId = r || null, this._rateLimiter = s || new xn(), this._isEnabled = Vo() || o;
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
          code: r || ei.UNKNOWN_ERROR,
          url: jo(),
          deviceInfo: Ho(),
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
class Vi {
  constructor(e, i, n, r, s) {
    this._transport = new we(e, i, n, r, s), this._errorUrl = Mn(e?.errorUrl, e?.integrationDomain, No);
  }
  report(e) {
    if (!e) return;
    const i = e.severity || be.ERROR;
    this._transport.send(this._errorUrl, i, e.message, e.code, e.stackTrace);
  }
}
class ji {
  constructor(e, i, n, r, s, o) {
    this._intentObserveLines = 0, this._transport = new we(e, n, r, s, o), this._placementDiagnosticTransport = new we(
      e,
      n,
      r,
      s
    ), this._preselectOutcomeTransport = new we(e, n, r, s), this._loggingUrl = Mn(e?.loggingUrl, e?.integrationDomain, Ko), this._errorReportingService = i;
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
      be.INFO,
      i.message,
      i.code,
      void 0,
      (n) => {
        if (this._errorReportingService) {
          const r = typeof n.statusCode == "number";
          this._errorReportingService.report({
            message: "LoggingService: Failed to send log: " + n.message,
            code: ei.LOG_DELIVERY_FAILURE,
            severity: r ? be.ERROR : be.WARNING
          });
        }
      }
    );
  }
}
function Wo(t, e) {
  const i = We(window.location.href), n = t.EventAttributes?.title, r = p(n) ? n : void 0, s = Xi(t.EventAttributes, e) ? r : r || document.title, o = Zn(), a = t.ActiveTimeOnSite;
  return {
    pageUrl: i,
    sourceMessageId: t.SourceMessageId,
    timestamp: t.Timestamp,
    ...s ? { pageTitle: s } : {},
    ...o !== void 0 ? { canonicalUrl: o } : {},
    ...Number.isFinite(a) ? { activeTimeOnSite: a } : {}
  };
}
const z = class z {
  constructor() {
    this.name = M, this.id = je, this.moduleId = je, this.isInitialized = !1, this.launcher = null, this.filters = {}, this.userAttributes = {}, this.userIdentifiedInWorkspace = !1, this.testHelpers = null, this.placementEventMappingLookup = {}, this.placementEventAttributeMappingLookup = {}, this.integrationName = null, this.errorReportingService = null, this.loggingService = null, this._thankYouElementOnLoadCallback = null, this._isThankYouElementLoaded = !1, this._workspaceSearchInFlightPromise = null, this._launcherAttachState = oo(), this._exitIntentConfig = null, this._exitIntentWatcher = new po({
      isKitReady: () => this.isKitReady(),
      onExitIntent: (e, i) => this.handleExitIntent(e, i),
      onLeadCaptureSubmitted: (e) => this.applyIdentityCapturePayload(e.identities, e.userAttributes)
    }), this._exitIntentEnabledForAccount = !1, this._pendingInitWarnings = [], this.accountId = null, this._preselectState = Os();
  }
  // ---- Private helpers ----
  getEventAttributeValue(e, i) {
    const n = e && e.EventAttributes;
    if (!n)
      return null;
    const r = T(n, i);
    return r === void 0 ? null : r;
  }
  doesEventAttributeConditionMatch(e, i) {
    if (!e || !p(e.operator))
      return !1;
    const n = e.operator.toLowerCase(), r = e.attributeValue;
    return n === "exists" ? i !== null : i == null ? !1 : n === "equals" ? String(i) === String(r) : n === "contains" ? String(i).indexOf(String(r)) !== -1 : !1;
  }
  doesEventMatchRule(e, i) {
    if (!i || !p(i.eventAttributeKey))
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
      if (k(s))
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
  capturePageView(e, i) {
    let n;
    try {
      n = Rt(window.location.href);
      const r = li(), s = Wo(e, i);
      r.push(s);
      const o = Math.min(r.length, Bi), a = Xn(r);
      if (a === 0) {
        const c = mt() ? "quota" : "ls_unavailable";
        this.loggingService?.log({
          message: `Rokt Kit: Failed to persist page view for ${n} [reason: ${c}]`,
          code: "PAGE_VIEW_CAPTURE_FAILED"
        });
      } else a < o && this.loggingService?.log({
        message: `Rokt Kit: Page view storage reduced from ${o} to ${a} record(s) under quota pressure [reason: quota_eviction]`,
        code: "PAGE_VIEW_QUOTA_EVICTION"
      });
    } catch (r) {
      const s = mt() ? "exception" : "ls_unavailable", o = r instanceof Error ? r.message : String(r);
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
      return ke(this.accountId, e);
  }
  // What the speculative call fills in over these attributes, the ones it was fired with. An identity the call
  // carries already holds its key, so a default never stands in for it.
  buildPreselectAttributeDefaults(e, i) {
    if (!this.isPreselectionEnabled())
      return;
    const n = ke(this.accountId, e);
    if (!n)
      return;
    const r = it(this.buildPreselectHost(), n, i), s = this.filters || {};
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
      getCurrentUser: () => g().Identity?.getCurrentUser?.(),
      getCurrentHost: () => this.buildPreselectHost(),
      isTargetingDisabled: () => this.isTargetingDisabled(),
      getUserIdentities: () => this.returnUserIdentities(this.filters.filteredUser),
      getOutgoingAttributes: (e, i) => this.getOutgoingPreselectAttributes(e, i),
      getPreselectFills: (e, i) => this.buildPreselectAttributeDefaults(i, e),
      mappedEmailSha256Key: this._mappedEmailSha256Key,
      isForwardingAllowed: () => this.isForwardingAllowed(),
      isCheckoutIntentActive: () => this.isCheckoutIntentActive(),
      isLinkIntentWithheld: () => this.isLinkIntentWithheld(),
      isEmailIdentityFiltered: () => this.isEmailIdentityFiltered()
    };
  }
  flushPendingPreselectDispatches() {
    eo(this._preselectState, this.buildPreselectHost());
  }
  isLauncherReadyToAttach() {
    return !!window.Rokt && j(window.Rokt.createLauncher);
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
    return n && e[n] && (i[z.EMAIL_SHA256_KEY] = e[n]), n && delete i[n], i;
  }
  logSelectPlacementsEvent(e) {
    if (!window.mParticle || typeof g().logEvent != "function" || !E(e))
      return;
    const i = g().EventType.Other, n = {}, r = Object.keys(e);
    for (let s = 0; s < r.length; s++)
      _o.indexOf(r[s].toLowerCase()) === -1 && (n[r[s]] = e[r[s]]);
    g().logEvent(ho, i, n);
  }
  setRoktSessionId(e) {
    if (!(!e || typeof e != "string"))
      try {
        const i = g().getInstance();
        i && j(i.setIntegrationAttribute) && i.setIntegrationAttribute(je, {
          roktSessionId: e
        });
      } catch {
      }
  }
  readMpSessionId() {
    const e = g()?.sessionManager, i = e?.getSessionId ?? e?.getSession;
    if (j(i))
      return i.call(e) || void 0;
  }
  readMpDeviceId() {
    if (!this.isDeviceIdDisabled())
      return g()?.getDeviceId?.() || void 0;
  }
  attachLauncher(e, i, n = []) {
    ao(this._launcherAttachState, {
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
      await Mo([...n], o), this.initRoktLauncher(o);
    }).catch((o) => {
      const a = this._launcherAttachState.lifecycle === "attached";
      if (uo(this._launcherAttachState), !a) {
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
    return go(
      this._launcherAttachState,
      this.isLauncherReadyToAttach(),
      (e) => this.attachLauncher(e.accountId, e.launcherOptions, e.legacyRoktExtensions)
    );
  }
  initRoktLauncher(e) {
    window.Rokt && (window.Rokt.currentLauncher = e), this.launcher = e, co(this._launcherAttachState);
    const i = g().Rokt?.filters;
    i ? (!this.isInitialized && this.filters.filteredUser && (i.filteredUser = this.filters.filteredUser), this.filters = i, i.filteredUser ? this._workspaceSearchInFlightPromise = this.search(i.filteredUser) : console.warn("Rokt Kit: No filtered user has been set.")) : console.warn("Rokt Kit: No filters have been set."), this.isInitialized = !0, xi(this.domain, this.integrationName), g().Rokt.attachKit(this), this.pushExitIntentExtensionConfig(), this.flushPendingPreselectDispatches();
  }
  // Leaving the hook unset is what keeps History unpatched for workspaces that never
  // preselect. The core SDK reads onCheckoutIntent when it has a signal, so an account without
  // pre-selection entries never hears one.
  armPreselectPathnameTrigger() {
    ft(window.location.pathname), this.onRouteChange = Pe(this.accountId) ? () => this.evaluatePreselectPathname() : void 0, this.armPreselectEmailInputListener(), this.onCheckoutIntent = Pe(this.accountId) ? (e) => {
      try {
        ds(this._preselectState, this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0, this.checkoutIntentSelectors = ws(this.accountId), this.onPaymentPick = Pe(this.accountId) ? (e) => {
      try {
        hs(this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0;
  }
  // A guest often types their email after the trigger page view has queued for want of one, so a
  // committed email input retries the queue. Only accounts with an entry that reads the form listen.
  armPreselectEmailInputListener() {
    this._preselectEmailInputListener && (document.removeEventListener("input", this._preselectEmailInputListener, !0), document.removeEventListener("change", this._preselectEmailInputListener, !0), document.removeEventListener("blur", this._preselectEmailInputListener, !0), this._preselectEmailInputListener = void 0), $s(this.accountId) && (this._preselectEmailInputListener = (e) => {
      Tt(e), e.type === "change" && this._preselectState.pending.length > 0 && Ws(this._preselectState, this.buildPreselectHost(), e) && this.flushPendingPreselectDispatches();
    }, document.addEventListener("input", this._preselectEmailInputListener, !0), document.addEventListener("change", this._preselectEmailInputListener, !0), document.addEventListener("blur", this._preselectEmailInputListener, !0));
  }
  // A core released without the check reads false, so its page views are judged by their marker alone.
  isAutoLogPageViewOn() {
    const e = g().Rokt;
    try {
      return j(e?.isAutoLogPageViewEnabled) && e.isAutoLogPageViewEnabled() === !0;
    } catch {
      return !1;
    }
  }
  // True while the core SDK says the confirm click can be waited for: auto button tracking is on, no
  // opt-out or privacy option suppresses it, and the browser supports the detector. A core released
  // without the check reads false, so its entries keep dispatchDelayMs.
  isCheckoutIntentActive() {
    const e = g().Rokt;
    try {
      return j(e?.isCheckoutIntentLive) && e.isCheckoutIntentLive() === !0;
    } catch {
      return !1;
    }
  }
  // True when the core SDK gives link clicks no checkout intent because this connection does not receive Auto Link
  // Click events. A core released without the check reads false, and turns intent off entirely in that case.
  isLinkIntentWithheld() {
    const e = g().Rokt;
    try {
      return j(e?.areAutoLinkClicksForwarded) && e.areAutoLinkClicksForwarded() === !1;
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
    if (this.isTargetingDisabled() || !this.isPreselectionPrivacyAllowed()) return "privacy_signal";
    if (String(this.filters?.filteredUser?.getMPID?.() ?? "") !== String(i ?? "")) return "user_changed";
    if (Yt(this.buildPreselectHost(), e)) return "partner_email";
  }
  // Whether this connection filters out the Email identity, or the identity mapped to the hashed email.
  isEmailIdentityFiltered() {
    const e = this.userIdentityFilters || [];
    if (e.includes(mo))
      return !0;
    const i = this._mappedEmailSha256Key, n = g().IdentityType || {}, r = i ? Object.keys(n).find((o) => o.toLowerCase() === i) : void 0, s = r ? n[r] : void 0;
    return typeof s == "number" && e.includes(s);
  }
  evaluatePreselectPathname() {
    const e = window.location.pathname;
    ft(e), e !== this._lastPreselectPathname && (this.isTargetingDisabled() || (this._lastPreselectPathname = e, Ss(this._preselectState, this.buildPreselectHost(), e), bi(this._preselectState, this.buildPreselectHost(), e)));
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
    return g().Rokt?.launcherOptions?.noTargeting === !0 || this.isDeviceIdDisabled();
  }
  // Core's normalizeRoktLauncherOptions turns noDeviceId or noDeviceID into noDeviceId, noFunctional and
  // noTargeting, but an older core passes either spelling through as written, so the kit applies the same rule.
  isDeviceIdDisabled() {
    const e = g()?.Rokt?.launcherOptions;
    return e?.noDeviceId === !0 || e?.noDeviceID === !0;
  }
  isPreselectionPrivacyAllowed() {
    return g().Rokt?.launcherOptions?.doNotShareOrSell !== !0 && navigator.globalPrivacyControl !== !0;
  }
  isPageHistoryAllowed() {
    return !this.isTargetingDisabled() && this.isPreselectionPrivacyAllowed();
  }
  isPartnerInLocalLauncherTestGroup() {
    return !!(g().config && g().config.isLocalLauncherEnabled && this.isAssignedToSampleGroup());
  }
  isAssignedToSampleGroup() {
    return Math.random() > 0.5;
  }
  getEffectiveExitIntentConfig(e) {
    return Mi(e) ? {
      identifier: Oo,
      signals: {
        mouseExitTop: !0,
        scrollUpFast: !0,
        idle: !0
      }
    } : null;
  }
  applyExitIntentExtensionOverride(e, i) {
    return e ? i.includes(pt) ? i : [...i, pt] : i;
  }
  extractExitIntentIdentifier(e) {
    return e ? p(e.identifier) && e.identifier.length > 0 ? e.identifier : p(e.placementIdentifier) && e.placementIdentifier.length > 0 ? e.placementIdentifier : null : null;
  }
  applyIdentityCapturePayload(e, i) {
    const n = {}, r = e.email;
    p(r) && r.length > 0 && (n.email = r);
    const s = e.mobile_number;
    p(s) && s.length > 0 && (n.mobile_number = s);
    const o = g().Identity?.modify;
    if (j(o) && Object.keys(n).length > 0)
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
    this._exitIntentConfig = this.isTargetingDisabled() ? null : e, this._exitIntentWatcher.configure(this._exitIntentConfig);
  }
  handleExitIntent(e, i) {
    if (!this._exitIntentConfig)
      return !1;
    const n = this.extractExitIntentIdentifier(this._exitIntentConfig);
    if (!n)
      return !1;
    try {
      const r = g().Rokt?.selectPlacements?.({
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
    !this._exitIntentConfig || !j(window.Rokt?.setExtensionData) || window.Rokt.setExtensionData({
      [pt]: this._exitIntentConfig
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
    const o = g().Rokt?.launcherOptions?.noFunctional === !0 || this.isDeviceIdDisabled();
    $n(o), o || this.isTargetingDisabled() ? Yn() : (Tr(), Cr()), this.isPageHistoryAllowed() || (ut(), dt());
    const a = e, c = a.accountId;
    this._exitIntentEnabledForAccount = Mi(c);
    const l = this._exitIntentEnabledForAccount ? this.getEffectiveExitIntentConfig(c) : null;
    this._exitIntentEnabledForAccount ? this.configureExitIntentBridge(l) : this.configureExitIntentBridge(null), this.accountId = c || null;
    const u = this.accountId ? es(this.accountId, a.preselectionConfig) : void 0;
    this.userAttributes = ne(s), this.armPreselectPathnameTrigger(), this._onboardingExpProvider = a.onboardingExpProvider;
    const d = He(a.placementEventMapping);
    this.placementEventMappingLookup = Ki(d);
    const m = He(
      a.placementEventAttributeMapping
    );
    this.placementEventAttributeMappingLookup = Ni(m), a.hashedEmailUserIdentityType && (this._mappedEmailSha256Key = a.hashedEmailUserIdentityType.toLowerCase()), this._workspaceIdSyncApiKey = p(a.workspaceIdSyncApiKey) ? a.workspaceIdSyncApiKey : void 0;
    const h = g().Rokt?.domain, { roktExtensionsQueryParams: y, legacyRoktExtensions: v, loadThankYouElement: P } = Ui(
      a.roktExtensions
    ), f = this.applyExitIntentExtensionOverride(
      l,
      y
    ), _ = {
      ...g().Rokt?.launcherOptions || {}
    };
    this.integrationName = xo(_.integrationName), _.integrationName = this.integrationName, this.domain = h;
    const b = {
      loggingUrl: a.loggingUrl,
      errorUrl: a.errorUrl,
      integrationDomain: h,
      isLoggingEnabled: g().config?.isLoggingEnabled === !0
    }, A = new Vi(
      b,
      this.integrationName,
      window.__rokt_li_guid__,
      a.accountId
    ), O = new ji(
      b,
      A,
      this.integrationName,
      window.__rokt_li_guid__,
      a.accountId
    );
    return this.errorReportingService = A, this.loggingService = O, this._flushInitWarnings(), u && O.log({
      message: `Rokt Kit: preselectionConfig setting is invalid [reason=${u}], using the built-in preselection config`,
      code: "PRESELECT_CONFIG_INVALID"
    }), g()._registerErrorReportingService && g()._registerErrorReportingService(A), g()._registerLoggingService && g()._registerLoggingService(O), n ? (this.testHelpers = {
      generateLauncherScript: Ri,
      generateThankYouElementScript: Di,
      extractRoktExtensionConfig: Ui,
      hashEventMessage: Fi,
      parseSettingsString: He,
      generateMappedEventLookup: Ki,
      generateMappedEventAttributeLookup: Ni,
      sendAdBlockMeasurementSignals: xi,
      createAutoRemovedIframe: Ct,
      djb2: J,
      setAllowedOriginHashes: (L) => {
        z._allowedOriginHashes = L;
      },
      ReportingTransport: we,
      ErrorReportingService: Vi,
      LoggingService: ji,
      RateLimiter: xn,
      ErrorCodes: ei,
      WSDKErrorSeverity: be,
      resetLauncherAttachState: () => fo(this._launcherAttachState)
    }, this.attachLauncher(c, _), "Successfully initialized: " + M) : (P && (g().Rokt.flushOnShoppableAdsReadyMessageQueue?.(this), Oi(So, Di(h), {
      onLoad: () => {
        this._isThankYouElementLoaded = !0, this._thankYouElementOnLoadCallback && this._thankYouElementOnLoadCallback();
      },
      onError: (L) => {
        console.error("Error loading Rokt Thank You Element script:", L);
      }
    })), this.isLauncherReadyToAttach() ? this.attachLauncher(c, _, v) : (Oi(wo, Ri(h, f), {
      onLoad: () => {
        this.isLauncherReadyToAttach() ? this.attachLauncher(c, _, v) : console.error("Rokt object is not available after script load.");
      },
      onError: (L) => {
        console.error("Error loading Rokt launcher script:", L);
      }
    }), this.captureTiming(z.PERFORMANCE_MARKS.RoktScriptAppended)), "Successfully initialized: " + M);
  }
  process(e) {
    if (e.EventDataType === ki && ft(window.location.pathname), !this.isTargetingDisabled()) {
      if (e.EventDataType === ki) {
        if (this._exitIntentEnabledForAccount && this._exitIntentWatcher.resetPageViewState(), this.isPageHistoryAllowed()) {
          const i = this.isAutoLogPageViewOn();
          Jn(this.loggingService, e.EventAttributes, i), this.capturePageView(e, i);
        } else
          ut(), dt();
        me(this._preselectState, this.buildPreselectHost(), e), bi(this._preselectState, this.buildPreselectHost());
      }
      Ge(e) && ms(this.buildPreselectHost(), e), Ts(this.accountId, e.EventName) && Rs(this._preselectState, this.buildPreselectHost(), e);
    }
    if (e.EventDataType === ko && (ut(), dt(), Gt(this._preselectState), this.accountId && (re(this.accountId), ui(this.accountId), gi(this.accountId))), !this.isKitReady())
      return "Kit not ready for forwarder: " + M;
    if (j(g().Rokt?.setLocalSessionAttribute) && !Ge(e) && (k(this.placementEventAttributeMappingLookup) || this.applyPlacementEventAttributeMapping(e), !k(this.placementEventMappingLookup))) {
      const i = Fi(e.EventDataType, e.EventCategory, e.EventName ?? "");
      this.placementEventMappingLookup[String(i)] && g().Rokt.setLocalSessionAttribute?.(this.placementEventMappingLookup[String(i)], !0);
    }
    return "Successfully sent to forwarder: " + M;
  }
  setExtensionData(e) {
    if (!this.isKitReady()) {
      console.error("Rokt Kit: Not initialized");
      return;
    }
    window.Rokt.setExtensionData(e);
  }
  setUserAttribute(e, i) {
    Hi(e) || (this.userAttributes[e] = i);
    const n = vi(this.accountId, e);
    return n && this.forgetCartAdd(), (Ds(this.accountId, e) || Ue(e, this._mappedEmailSha256Key) || n) && this.flushPendingPreselectDispatches(), "Successfully set user attribute for forwarder: " + M;
  }
  // The page's cart attribute or a logout replaces a remembered add-to-cart click. Under noTargeting, or for an account
  // that never remembers one, nothing is written to the device.
  forgetCartAdd() {
    this.accountId && Vr(this.accountId, !this.isTargetingDisabled() && Zs(this.accountId));
  }
  removeUserAttribute(e) {
    return delete this.userAttributes[e], vi(this.accountId, e) && this.forgetCartAdd(), "Successfully removed user attribute for forwarder: " + M;
  }
  handleIdentityComplete(e, i) {
    return this.userAttributes = ne(e.getAllUserAttributes()), "Successfully called " + i + " for forwarder: " + M;
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
        p(l) && l.length > 0 && (s[c] = l);
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
    return this.userIdentifiedInWorkspace = !1, this._workspaceSearchInFlightPromise = null, this._workspaceLastSearchedIdentitiesKey = void 0, this.accountId && (re(this.accountId), ui(this.accountId), gi(this.accountId), this.forgetCartAdd()), this.handleIdentityComplete(e, "onLogoutComplete");
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
    const i = this.currentUserSnapshot(), n = this.recreateLauncherIfTerminated();
    if (n) {
      const r = this._workspaceSearchInFlightPromise, s = r ? Promise.race([
        r,
        new Promise((o) => setTimeout(o, Ci))
      ]) : Promise.resolve();
      return Promise.all([n, s]).then(
        () => this._dispatchPlacements(e, i)
      );
    }
    if (this._workspaceSearchInFlightPromise) {
      const r = this._workspaceSearchInFlightPromise;
      return Promise.race([
        r,
        new Promise((s) => setTimeout(s, Ci))
      ]).then(() => this._dispatchPlacements(e, i));
    }
    return this._dispatchPlacements(e);
  }
  // What a pre-selection call with these attributes would send, mirroring _dispatchPlacements: identities,
  // then the cached user attributes merged in, filtered and overridden for the target page, then the
  // session attributes, so a later source wins as it does on the wire.
  getOutgoingPreselectAttributes(e, i) {
    const n = { ...ne(this.userAttributes), ...e }, r = this.filters || {}, s = r.filterUserAttributes ? r.filterUserAttributes(n, r.userAttributeFilters || []) : n, o = this.returnUserIdentities(r.filteredUser || null), a = Pi(
      this.accountId,
      i ? bt(s, this.buildPreselectAttributeDefaults(i, e)) : s,
      this.findCacheConfigEntry(i)
    );
    return {
      ...o,
      ...a,
      ...this.returnLocalSessionAttributes()
    };
  }
  isStillCurrentUser(e, i) {
    const n = g().Identity?.getCurrentUser?.();
    return e !== "" && String(this.filters?.filteredUser?.getMPID?.() ?? "") === e && String(n?.getMPID?.() ?? "") === e && (!i || n?.isLoggedIn?.() === !0);
  }
  currentUserSnapshot() {
    const e = g()?.Identity?.getCurrentUser?.();
    return {
      mpid: String(e?.getMPID?.() ?? ""),
      loggedIn: e?.isLoggedIn?.() === !0,
      hasIdentities: Object.values(e?.getUserIdentities?.()?.userIdentities || {}).some(
        (i) => p(i) && i !== ""
      )
    };
  }
  hasUserChangedSince(e) {
    const i = g().Identity?.getCurrentUser?.();
    return String(i?.getMPID?.() ?? "") !== e.mpid || e.loggedIn && i?.isLoggedIn?.() !== !0;
  }
  // A call whose user changed while it waited goes out for the new user only when nothing it carries belongs to
  // someone else: its user had no identities and it carries no email, as when an anonymous shopper logs in, or the
  // new user holds every email form it carries, as when core identifies with a passed email that differs from the
  // user's. A logout drops it even when the email survives the logout.
  mayGoOutForNewUser(e, i) {
    const n = g().Identity?.getCurrentUser?.();
    if (e.loggedIn && n?.isLoggedIn?.() !== !0)
      return !1;
    const r = n?.getUserIdentities?.()?.userIdentities || {}, s = this._mappedEmailSha256Key, o = i[z.EMAIL_SHA256_KEY] || (s ? i[s] : void 0), a = [];
    return i.email && a.push([i.email, r.email]), o && a.push([o, s ? r[s] : void 0]), a.length === 0 ? !e.hasIdentities : a.every(([c, l]) => p(c) && c === l);
  }
  _dispatchPlacements(e, i) {
    const n = e ? Gs(e) : void 0;
    if (e?.preselect === !0 && !Qt(this.buildPreselectHost())) {
      n?.();
      return;
    }
    const r = e?.[Ye], s = e?.[Pt], o = { ...e };
    if (delete o[Ye], delete o[Pt], e = o, s !== void 0) {
      const X = E(s) ? s : {}, xe = X.requireLogin !== !1;
      if (!this.isStillCurrentUser(String(X.mpid ?? ""), xe)) {
        this.loggingService?.logPlacementDiagnostic(
          w("missed", xe ? "logged_in_dropped" : "user_changed_dropped")
        ), n?.();
        return;
      }
    }
    const a = i !== void 0 && this.hasUserChangedSince(i), c = a && i?.hasIdentities === !0;
    if (i && a && !this.mayGoOutForNewUser(i, E(e.attributes) ? e.attributes : {})) {
      e.preselect === !0 ? this.loggingService?.logPlacementDiagnostic(
        w("missed", i.loggedIn ? "logged_in_dropped" : "user_changed_dropped")
      ) : this.loggingService?.log({
        message: "Rokt Kit: Dropped a selectPlacements call whose user changed while it waited",
        code: "SELECT_PLACEMENTS_USER_CHANGED"
      }), n?.();
      return;
    }
    const l = E(r) ? r : void 0, u = l && p(l.key) ? l.key : void 0;
    if (u) {
      const X = this.getFormEmailDropCause(u, l.mpid);
      if (X) {
        this.loggingService?.logPlacementDiagnostic(
          w("missed", "form_email_dropped", { cause: X })
        ), n?.();
        return;
      }
    }
    const d = e.attributes || {}, m = ne(this.userAttributes), h = { ...m, ...d }, y = this.filters || {}, v = y.userAttributeFilters || [], P = y.filteredUser || null, f = P ? P.getMPID() : null;
    let _;
    y ? y.filterUserAttributes ? _ = y.filterUserAttributes(h, v) : _ = h : (console.warn("Rokt Kit: No filters available, using user attributes"), _ = h);
    const b = ne(_);
    u && (Object.prototype.hasOwnProperty.call(m, u) ? b[u] = m[u] : delete b[u]), this.userAttributes = b;
    const A = this._onboardingExpProvider === "Optimizely" ? this.fetchOptimizely() : {}, O = this.returnUserIdentities(P), L = this.returnLocalSessionAttributes(), Y = this.isPageHistoryAllowed(), te = Y ? qn(li()) : [], R = Y ? Qn() : null, B = this.readMpSessionId(), Fe = this.readMpDeviceId(), $ = typeof e.identifier == "string" ? e.identifier : void 0, ye = this.findCacheConfigEntry($), Me = e.preselect === !0 ? this.buildPreselectAttributeDefaults($, d) : void 0, ti = e.preselect === !0 ? Pi(
      this.accountId,
      bt(_, Me),
      ye
    ) : _, G = {
      ...O,
      ...ti,
      ...A,
      ...L,
      ...te.length ? { [Lo]: JSON.stringify(te) } : {},
      ...R ? { [Co]: R } : {},
      ...!c && this.userIdentifiedInWorkspace ? { [To]: !0 } : {},
      ...B ? { [Ro]: B } : {},
      ...Fe ? { [Li]: Fe } : {},
      mpid: f
    };
    this.isDeviceIdDisabled() && delete G[Li], e.preselect !== !0 && to(this.buildPreselectHost(), $, G);
    const ct = ti[yn];
    if (e.preselect === !0 && p(ct) && (ct.indexOf("intent_") === 0 || ct.indexOf("pageview_cart|") === 0) && !Ve(G, this._mappedEmailSha256Key)) {
      this.loggingService?.logPlacementDiagnostic(
        w("missed", "no_strict_email", { cause: "lost_before_dispatch" })
      ), n?.();
      return;
    }
    const ii = Ps(
      ye,
      Me,
      G
    ), ni = bs(ye, Me, G);
    delete G[pi];
    const ri = vn(Me, G);
    ri && (G[pi] = ri);
    const Vn = {
      ...e,
      attributes: G,
      ...ye ? { cacheMatchKeys: Pn(ye) } : {},
      ...ii ? { cacheIdentityKeys: ii } : {},
      ...ni ? { cacheMatchValues: ni } : {}
    }, lt = this.currentUserSnapshot(), si = this.launcher.selectPlacements(Vn), oi = e.preselect === !0, jn = () => {
      if (!oi) {
        if (this.hasUserChangedSince(lt) && (lt.loggedIn || lt.hasIdentities)) {
          this.loggingService?.log({
            message: "Rokt Kit: Skipped the selectPlacements event because its user changed before the selection resolved",
            code: "SELECT_PLACEMENTS_EVENT_USER_CHANGED"
          });
          return;
        }
        this.logSelectPlacementsEvent(G);
      }
    };
    return Promise.resolve(si).then((X) => {
      if (!oi)
        return this.trackPlacementEngagement(X), X?.context?.sessionId?.then((xe) => this.setRoktSessionId(xe));
    }).catch(() => {
    }).finally(jn), si;
  }
  // Logs each press of a placement's response buttons, and each close, as an auto button click. The
  // placement's frame keeps its buttons and text from the page, so only the response kind goes out.
  trackPlacementEngagement(e) {
    if (!e || !j(e.on))
      return;
    const i = {}, n = (s, o, a) => {
      const c = i[s] || [];
      c.splice(c.indexOf(o), 1), clearTimeout(o), this.logPlacementEngagement(s, a);
    }, r = (s, o) => {
      try {
        e.on(s)?.subscribe?.((a) => o(String(a?.placement?.id ?? ""), a));
      } catch {
      }
    };
    r("OFFER_ENGAGEMENT", (s) => {
      if (!this.canLogPlacementClick())
        return;
      const o = setTimeout(
        () => n(s, o, "negative"),
        Ao
      );
      (i[s] = i[s] || []).push(o);
    }), r("POSITIVE_ENGAGEMENT", (s) => {
      const o = (i[s] || [])[0];
      o !== void 0 && n(s, o, "positive");
    }), r("PLACEMENT_CLOSED", (s) => {
      (i[s] || []).slice().forEach((o) => n(s, o, "negative")), this.logPlacementEngagement(s, "close");
    }), r("LINK_ENGAGEMENT", (s, o) => {
      const a = o?.body?.domain;
      this.logPlacementLink(
        s,
        typeof a == "string" && a.length <= 253 && Io.test(a.toLowerCase()) ? a.toLowerCase() : void 0
      );
    });
  }
  // Checked when each click is logged, since the launcher calls back outside core's own gates.
  canLogPlacementClick() {
    return this.isCheckoutIntentActive() && this.isForwardingAllowed() && j(g().logEvent);
  }
  logPlacementEngagement(e, i) {
    this.canLogPlacementClick() && g().logEvent(yo, g().EventType.Other, {
      is_auto_button_click: !0,
      is_rokt_placement_click: !0,
      element: "button",
      type: "button",
      label_source: Ti,
      hostname: window.location.hostname,
      rokt_response: i,
      rokt_placement_id: e
    });
  }
  // A link pressed inside a placement, logged like an auto link click to another site.
  logPlacementLink(e, i) {
    if (!this.canLogPlacementClick())
      return;
    const n = {
      is_auto_link_click: !0,
      is_rokt_placement_click: !0,
      element: "link",
      type: "link",
      label_source: Ti,
      hostname: window.location.hostname,
      link_type: "external",
      rokt_placement_id: e
    };
    i && (n.link_domain = i), g().logEvent(Eo, g().EventType.Other, n);
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
   * Tears down the Rokt launcher and the placements it rendered.
   *
   * The kit's launcher reference is left in place so isKitReady() stays true.
   * The Web SDK clears its memoized launcher on terminate, so a later
   * createLauncher (SPA navigation) produces a new instance. The next
   * selectPlacements call re-attaches that instance. Nulling the reference
   * here would flip the kit to not-ready with no drain path for queued calls.
   */
  terminate() {
    return this.isKitReady() ? (lo(this._launcherAttachState), this.launcher.terminate()) : (console.error("Rokt Kit: Not initialized"), Promise.resolve());
  }
  /**
   * Registers a callback to be invoked once rokt-thank-you-element.js becomes available.
   */
  onShoppableAdsReady(e) {
    this._isThankYouElementLoaded ? e() : this._thankYouElementOnLoadCallback = e;
  }
};
z._allowedOriginHashes = [-553112570, 549508659], z.PERFORMANCE_MARKS = {
  RoktScriptAppended: "mp:RoktScriptAppended"
}, z.EMAIL_SHA256_KEY = "emailsha256";
let he = z;
function $o() {
  return je;
}
function Go(t) {
  if (!t) {
    window.console.log("You must pass a config object to register the kit " + M);
    return;
  }
  if (!E(t)) {
    window.console.log("'config' must be an object. You passed in a " + typeof t);
    return;
  }
  E(t.kits) ? t.kits[M] = {
    constructor: he
  } : (t.kits = {}, t.kits[M] = {
    constructor: he
  }), window.console.log("Successfully registered " + M + " to your mParticle configuration");
}
typeof window < "u" && window.mParticle && g().addForwarder && g().addForwarder({
  name: M,
  constructor: he,
  getId: $o
});
export {
  Go as register
};
//# sourceMappingURL=Rokt-Kit.esm.js.map
