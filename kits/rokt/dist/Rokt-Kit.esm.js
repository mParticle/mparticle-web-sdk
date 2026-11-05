const Nn = [
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
], Fn = new Set(Nn);
function Ni(t) {
  return Fn.has(t.toLowerCase());
}
function te(t) {
  const e = {}, i = t || {}, n = Object.keys(i);
  for (let r = 0; r < n.length; r++) {
    const s = n[r];
    Ni(s) || (e[s] = i[s]);
  }
  return e;
}
function b(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function g(t) {
  return typeof t == "string";
}
function $(t) {
  return typeof t == "function";
}
function Fi(t) {
  try {
    return JSON.parse(t.replace(/&quot;/g, '"'));
  } catch {
    return;
  }
}
function k(t) {
  return t == null ? !0 : typeof t == "string" ? t.length === 0 : typeof t == "object" ? Object.keys(t).length === 0 : !1;
}
function S(t, e) {
  return Object.prototype.hasOwnProperty.call(t, e) ? t[e] : void 0;
}
function Ne(t) {
  const e = Mi(), i = e ? e(t, "full") : t, n = i.indexOf("#"), r = n === -1 ? "" : i.slice(n);
  return (n === -1 ? i : i.slice(0, n)).split("?")[0] + r.split("?")[0];
}
function Pt(t) {
  const e = Mi();
  return e ? e(t, "report") : t.split(/[?#]/)[0];
}
function Mi() {
  const t = window.mParticle;
  return t && typeof t._cleanUrl == "function" ? t._cleanUrl : void 0;
}
function J(t) {
  let e = 5381;
  for (let i = 0; i < t.length; i++)
    e = (e << 5) + e + t.charCodeAt(i), e = e & e;
  return e;
}
const I = "mp-rokt-kit", ti = "__rokt_ls_probe__";
function ii() {
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
let ae = null;
function Mn(t) {
  t ? ae || (ae = { local: ii(), session: ii() }) : ae = null;
}
function xn() {
  return ae !== null;
}
const Z = () => ae?.local ?? window.localStorage, O = () => ae?.session ?? window.sessionStorage;
function at() {
  try {
    const t = Z();
    return t.setItem(ti, "1"), t.removeItem(ti), !0;
  } catch {
    return !1;
  }
}
function je(t, e = Z) {
  try {
    const i = e().getItem(t);
    return i === null ? null : JSON.parse(i);
  } catch {
    return null;
  }
}
function xi(t, e, i = Z) {
  try {
    return i().setItem(t, JSON.stringify(e)), !0;
  } catch {
    return !1;
  }
}
function ct(t, e = Z) {
  try {
    e().removeItem(t);
  } catch {
  }
}
function Vn() {
  ct(I, () => window.localStorage), ct(I, () => window.sessionStorage);
}
function x(t, e, i = Z) {
  const n = je(t, i);
  return b(n) ? n[e] : void 0;
}
function W(t, e, i, n = Z) {
  const r = je(t, n), s = b(r) ? { ...r } : {};
  return s[e] = i, xi(t, s, n);
}
function Vi(t, e, i) {
  Object.keys(e).length === 0 ? ct(t, i) : xi(t, e, i);
}
function ee(t, e, i = Z) {
  const n = je(t, i);
  if (!b(n) || !(e in n))
    return;
  const r = { ...n };
  delete r[e], Vi(t, r, i);
}
function ce(t, e, i = Z) {
  const n = je(t, i);
  if (!b(n))
    return;
  const r = Object.keys(n).filter((o) => o.startsWith(e));
  if (r.length === 0)
    return;
  const s = { ...n };
  r.forEach((o) => delete s[o]), Vi(t, s, i);
}
const wt = "pageViews", Fe = "utmParams", $i = 25, $n = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
function Wi(t) {
  return t.slice(-$i);
}
function ni() {
  const t = x(I, wt);
  return Array.isArray(t) ? t.filter(b).map(Wn) : [];
}
function Wn(t) {
  return {
    ...t,
    ...g(t.pageUrl) ? { pageUrl: Ne(t.pageUrl) } : {},
    ...g(t.canonicalUrl) ? { canonicalUrl: Ne(t.canonicalUrl) } : {}
  };
}
function jn(t) {
  const e = Wi(t);
  for (let i = 0; i < e.length; i++) {
    const n = e.slice(i);
    if (W(I, wt, n))
      return n.length;
  }
  return 0;
}
function it() {
  ee(I, wt);
}
function Hn(t) {
  const e = Wi(t);
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
function ji(t, e = !1) {
  return e || !!t && t.is_auto_page_view === !0;
}
function Gn(t, e, i = !1) {
  if (x(I, Fe) !== void 0)
    return;
  const n = ji(e, i), r = new URLSearchParams(window.location.search), s = {};
  for (const a of $n) {
    const c = n ? (e || {})[a] : r.get(a);
    g(c) && c && (s[a] = c);
  }
  if (Object.keys(s).length === 0)
    return;
  const o = Object.keys(s).join(", ");
  if (!W(I, Fe, s)) {
    const a = at() ? "quota" : "ls_unavailable";
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
function Yn() {
  const t = x(I, Fe);
  return b(t) ? t : null;
}
function nt() {
  ee(I, Fe);
}
function Bn() {
  const e = document.querySelector('link[rel="canonical"]')?.href;
  if (e)
    return Ne(e);
}
const Hi = "skip", zn = [
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
], Xn = 1, qn = 6e4;
function R(t) {
  return Array.isArray(t) && t.every(g);
}
function oe(t) {
  return g(t) && t !== "";
}
const Jn = ["DesktopWeb", "MobileWeb"], Qn = 50;
function Zn(t, e) {
  if (!Array.isArray(t) || t.length === 0 || !t.every((r) => R(r) && r.length >= 2 && r.every(oe)))
    return !1;
  const i = t.flat();
  if (i.length > Qn || new Set(i).size !== i.length)
    return !1;
  const n = R(e) ? e.map((r) => r.toLowerCase()) : [];
  return !i.some((r) => n.includes(r.toLowerCase()));
}
function er(t) {
  if (oe(t))
    return !0;
  if (!b(t))
    return !1;
  const { byClientType: e, byHostname: i, skipRemembered: n, skipValues: r, matchGroups: s } = t;
  if (t.value !== void 0 && !oe(t.value) || e !== void 0 && (!b(e) || !Object.entries(e).every(
    ([o, a]) => Jn.includes(o) && oe(a)
  )) || i !== void 0 && (!b(i) || !Object.entries(i).every(
    ([o, a]) => o !== "" && o === o.toLowerCase() && oe(a)
  )) || n !== void 0 && typeof n != "boolean" || r !== void 0 && (!R(r) || r.length === 0 || !r.every(oe)))
    return !1;
  if (R(r)) {
    const o = r.map((c) => c.toLowerCase());
    if ([
      t.value,
      ...Object.values(e ?? {}).filter((c) => c !== Hi),
      ...Object.values(i ?? {})
    ].some((c) => g(c) && o.includes(c.toLowerCase())))
      return !1;
  }
  return s !== void 0 && !Zn(s, r) ? !1 : t.value !== void 0 || e !== void 0 || i !== void 0;
}
function tr(t, e) {
  if (!b(e))
    return "not an object";
  const { pathname: i, targetPageIdentifier: n, attributeKeys: r, optionalAttributeKeys: s, identityKeys: o, dispatchDelayMs: a } = e, { triggerEventNames: c, releaseHoldOnRouteChange: l, readEmailInput: u, cartIntent: d, cartUserAttribute: p } = e, { checkoutStepIntent: m } = e, v = e.preselectAttributeOverrides, E = e.preselectAttributeDefaults !== void 0 ? e.preselectAttributeDefaults : v, y = e.widenedOptionalAttributeKeys;
  if (e.accountId !== void 0 && e.accountId !== t)
    return "accountId";
  if (!g(i) || !i.startsWith("/"))
    return "pathname";
  if (!g(n) || n === "")
    return "targetPageIdentifier";
  if (!R(r) || r.length === 0)
    return "attributeKeys";
  if (s !== void 0 && (!R(s) || !s.every((A) => r.includes(A))))
    return "optionalAttributeKeys";
  if (y !== void 0 && (!R(y) || !y.every((A) => r.includes(A))))
    return "widenedOptionalAttributeKeys";
  if (o !== void 0 && (!R(o) || o.length === 0 || !o.every((A) => r.includes(A))))
    return "identityKeys";
  if (R(y) && y.length > 0) {
    const A = (R(s) ? s : []).concat(y).map((P) => P.toLowerCase());
    if (!R(o) || o.some((P) => A.includes(P.toLowerCase())))
      return "identityKeys";
  }
  if (a !== void 0 && (!Number.isInteger(a) || a < 0 || a > qn))
    return "dispatchDelayMs";
  if (l !== void 0 && typeof l != "boolean")
    return "releaseHoldOnRouteChange";
  if (m !== void 0 && typeof m != "boolean")
    return "checkoutStepIntent";
  if (d !== void 0 && typeof d != "boolean")
    return "cartIntent";
  if (u !== void 0 && (typeof u != "boolean" || !r.includes("email") || R(s) && s.includes("email") || // The runtime matches optional keys in any casing, so an 'Email' key would make email optional too.
  R(y) && y.some((A) => A.toLowerCase() === "email") || // A default makes its key optional too, and would send a guessed email as the shopper's.
  b(E) && Object.keys(E).some((A) => A.toLowerCase() === "email")))
    return "readEmailInput";
  if (e.preselectAttributeDefaults !== void 0 && v !== void 0)
    return "preselectAttributeDefaults";
  let h;
  if (E !== void 0) {
    const A = e.preselectAttributeDefaults !== void 0 ? "preselectAttributeDefaults" : "preselectAttributeOverrides";
    if (!b(E))
      return A;
    const P = (R(o) ? o : []).map((D) => D.toLowerCase()), U = ([D, H]) => er(H) && r.includes(D) && !["email", "emailsha256"].includes(D.toLowerCase()) && !P.includes(D.toLowerCase()), L = ([D, H]) => v !== void 0 && g(H) && r.includes(D) && !(R(o) && o.includes(D)), j = Object.entries(E);
    if (!j.every((D) => U(D) || L(D)))
      return A;
    h = Object.fromEntries(j.filter(U));
  }
  if (c !== void 0 && (!R(c) || c.length === 0 || c.some((A) => A === "")))
    return "triggerEventNames";
  const _ = { accountId: t, pathname: i, targetPageIdentifier: n, attributeKeys: r };
  return s !== void 0 && (_.optionalAttributeKeys = s), y !== void 0 && (_.widenedOptionalAttributeKeys = y), o !== void 0 && (_.identityKeys = o), a !== void 0 && (_.dispatchDelayMs = a), l !== void 0 && (_.releaseHoldOnRouteChange = l), m !== void 0 && (_.checkoutStepIntent = m), u !== void 0 && (_.readEmailInput = u), h !== void 0 && (_.preselectAttributeDefaults = h), c !== void 0 && (_.triggerEventNames = c), d !== void 0 && (_.cartIntent = d), d === !0 && g(p) && p !== "" && (_.cartUserAttribute = p), _;
}
function ir(t, e) {
  const i = Fi(e);
  if (i === void 0)
    return { error: "invalid JSON" };
  if (!b(i))
    return { error: "not an object" };
  if (i.schemaVersion !== Xn)
    return { error: "schemaVersion" };
  if (!Array.isArray(i.entries))
    return { error: "entries" };
  const n = [];
  for (let r = 0; r < i.entries.length; r++) {
    const s = tr(t, i.entries[r]);
    if (g(s))
      return { error: `entry ${r + 1} ${s}` };
    if (n.some((o) => o.targetPageIdentifier === s.targetPageIdentifier))
      return { error: `entry ${r + 1} targetPageIdentifier` };
    n.push(s);
  }
  return { entries: n };
}
const nr = 6e4, Tt = "activePreselect:";
function rr(t) {
  return b(t) && typeof t.expiresAt == "number" && typeof t.attributesDigest == "number";
}
function St(t, e) {
  return `${Tt}${t}:${e}`;
}
function le(t) {
  const e = x(I, t, O);
  return rr(e) && e.expiresAt > Date.now() ? e : null;
}
function sr(t, e, i = !1) {
  W(
    I,
    t,
    { expiresAt: Date.now() + nr, attributesDigest: e, ...i ? { byEvent: !0 } : {} },
    O
  );
}
function or(t, e, i) {
  const n = le(t);
  n && n.attributesDigest !== i || (e && e.expiresAt > Date.now() ? W(I, t, e, O) : ee(I, t, O));
}
function ri(t) {
  ce(
    I,
    `${Tt}${t}:`,
    O
  );
}
function ar() {
  ce(I, Tt);
}
const cr = 5 * 6e4, Gi = "pendingPreselect:";
function lr(t) {
  return b(t) && typeof t.expiresAt == "number" && g(t.pathname) && g(t.identifier) && b(t.attributes) && g(t.mpid);
}
function kt(t) {
  return `${Gi}${t}`;
}
function Lt(t) {
  const e = kt(t), i = x(I, e, O);
  return lr(i) ? i.expiresAt <= Date.now() ? (ee(I, e, O), null) : i : null;
}
function si(t, e, i, n, r, s = !1) {
  return W(
    I,
    kt(t),
    {
      expiresAt: Date.now() + cr,
      pathname: e,
      identifier: i,
      attributes: n,
      mpid: r,
      ...s ? { byEvent: !0 } : {}
    },
    O
  );
}
function ie(t) {
  ee(I, kt(t), O);
}
function ur() {
  ce(I, Gi);
}
const lt = {
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
}, dr = /\b(?:gift cards?|store credit|rewards?|points?|balance|vouchers?|promo codes?|coupons?)\b/g, fr = 12;
function gr(t) {
  return t.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/[^a-z]+/g, " ").trim();
}
function Ct(t) {
  if (typeof t != "string" || t.length > 128)
    return;
  const e = gr(t).replace(dr, " ").replace(/\s+/g, " ").trim();
  if (!e || e.split(" ").length > fr)
    return;
  const i = Object.keys(lt).filter((r) => lt[r].test(e)), n = i.filter((r) => r !== "card");
  return n.length === 1 ? n[0] : n.length === 0 && i.length === 1 ? i[0] : void 0;
}
function Yi(t) {
  return typeof t == "string" && Object.prototype.hasOwnProperty.call(lt, t);
}
const pr = "radio", mr = ["button", "role", "wallet"], hr = ["label", "aria_label", "test_id", "element_id", "element_name"];
function _r(t) {
  if (!t)
    return;
  const e = String(t.checked), i = t.type === pr;
  if (!(e === "false" || i && e !== "true" || t.type === "checkbox" || t.element === "link") && !(!i && t.type === void 0 && !mr.includes(String(t.element))))
    for (const n of hr) {
      const r = Ct(t[n]);
      if (r && (i || r !== "card"))
        return r;
    }
}
function Er(t) {
  if (Yi(t.family))
    return t.family;
  for (const e of Array.isArray(t.names) ? t.names : []) {
    const i = Ct(e);
    if (i)
      return i;
  }
}
const yr = ["paymenttype", "payment_type", "paymentmethod", "payment_method"];
function Ir(t) {
  const e = t ? Object.keys(t).find((n) => yr.includes(n.toLowerCase())) : void 0, i = e ? t[e] : void 0;
  return typeof i != "string" || !i.trim() ? "absent" : Ct(i) ?? "other";
}
const Bi = "preselectArrival:", zi = "preselectTriggerAnyTab:", He = "preselectCartAdd:", Xi = "preselectTargetPath:", qi = "preselectCartArrival:", Ar = 30 * 6e4, fe = 30 * 6e4, vr = 10080 * 6e4, br = 10080 * 6e4, ut = ["commit", "wallet", "frame", "checkout_step", "cart"], Pr = [
  "triggeredAt",
  "identitySeenAt",
  "firedAt",
  "firedDigest",
  "arrivedAt",
  "nearMissAt",
  "paymentPickAt"
], wr = ["paymentPick", "paymentAtFire"];
function Y(t, e) {
  return `${Bi}${t}:${e}`;
}
function Ji(t, e) {
  return `${zi}${t}:${e}`;
}
function Te(t) {
  const e = x(I, t, O), i = {};
  if (!b(e))
    return i;
  for (const n of Pr)
    typeof e[n] == "number" && (i[n] = e[n]);
  typeof e.intentAt == "number" && ut.includes(e.intentKind) && (i.intentAt = e.intentAt, i.intentKind = e.intentKind);
  for (const n of wr)
    Yi(e[n]) && (i[n] = e[n]);
  return i.firedAt !== void 0 && e.firedByCart === !0 && (i.firedByCart = !0), i;
}
function ne(t, e) {
  return W(I, t, e, O);
}
function he(t) {
  const e = Te(t);
  return e.arrivedAt === void 0 ? e : {};
}
function Tr(t, e, i) {
  const n = Y(t, e), r = he(n), s = Date.now();
  ne(n, {
    ...r,
    triggeredAt: r.triggeredAt ?? s,
    ...i ? { identitySeenAt: r.identitySeenAt ?? s } : {}
  }), W(I, Ji(t, e), {
    triggeredAt: s
  });
}
function Sr(t, e) {
  const i = x(I, Ji(t, e));
  if (!b(i) || typeof i.triggeredAt != "number")
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < Ar;
}
function kr(t, e, i) {
  const n = `${He}${t}`, r = x(I, n), s = b(r) ? r.addedAt ?? r.forgottenAt : void 0;
  typeof s == "number" && e <= s || W(I, n, { addedAt: e, mpid: i });
}
function Lr(t, e) {
  const i = `${He}${t}`, n = x(I, i);
  if (!b(n))
    return !1;
  const r = typeof n.addedAt == "number" ? n.addedAt : void 0, s = r ?? n.forgottenAt;
  if (typeof s != "number")
    return !1;
  const o = Date.now() - s;
  return o >= 0 && o < vr ? r !== void 0 && e !== null && n.mpid === e : (ee(I, i), !1);
}
function Cr(t, e) {
  const i = `${He}${t}`;
  e ? W(I, i, { forgottenAt: Date.now() }) : ee(I, i);
}
function Dr(t, e) {
  const i = Y(t, e), n = Te(i);
  n.arrivedAt !== void 0 || n.nearMissAt !== void 0 || ne(i, { ...n, nearMissAt: Date.now() });
}
function Rr(t, e, i, n = !1) {
  const r = Y(t, e), s = he(r), o = s.firedAt !== void 0 && Me(s.firedAt) ? {
    firedAt: s.firedAt,
    ...s.firedDigest !== void 0 ? { firedDigest: s.firedDigest } : {},
    ...s.firedByCart ? { firedByCart: !0 } : {},
    ...s.paymentAtFire !== void 0 ? { paymentAtFire: s.paymentAtFire } : {}
  } : void 0, a = s.paymentPick !== void 0 && s.paymentPickAt !== void 0 && Me(s.paymentPickAt) ? s.paymentPick : void 0;
  return ne(
    r,
    Qi(s, {
      firedAt: o && !(o.firedByCart && !n) ? o.firedAt : Date.now(),
      firedDigest: i,
      ...n ? { firedByCart: !0 } : {},
      paymentAtFire: a
    })
  ), o;
}
function Or(t, e, i, n) {
  const r = Y(t, e), s = he(r);
  s.firedAt === void 0 || s.firedDigest !== n || ne(r, Qi(s, i));
}
function Qi(t, e) {
  const i = { ...t };
  return delete i.firedAt, delete i.firedDigest, delete i.firedByCart, delete i.paymentAtFire, e ? {
    ...i,
    firedAt: e.firedAt,
    ...e.firedDigest !== void 0 ? { firedDigest: e.firedDigest } : {},
    ...e.firedByCart ? { firedByCart: !0 } : {},
    ...e.paymentAtFire !== void 0 ? { paymentAtFire: e.paymentAtFire } : {}
  } : i;
}
function Kr(t, e) {
  const i = he(Y(t, e));
  if (i.triggeredAt === void 0)
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < fe;
}
function oi(t, e, i, n = !1) {
  const r = he(Y(t, e));
  if (r.firedAt === void 0 || n && r.firedByCart || i !== void 0 && r.firedDigest !== void 0 && r.firedDigest !== i)
    return !1;
  const s = Date.now() - r.firedAt;
  return s >= 0 && s < fe;
}
function Ur(t, e, i, n) {
  const r = Y(t, e), s = he(r);
  if (s.intentAt !== void 0 && s.intentKind !== void 0 && Nr(s.intentAt)) {
    const o = ut.indexOf(s.intentKind), a = ut.indexOf(i);
    if (o < a || o === a && s.intentAt >= n)
      return;
  }
  ne(r, { ...s, intentAt: n, intentKind: i });
}
function Me(t) {
  const e = Date.now() - t;
  return e >= 0 && e < fe;
}
function Nr(t) {
  return Me(t);
}
function Fr(t, e, i, n) {
  const r = Y(t, e), s = Te(r);
  s.arrivedAt !== void 0 || s.paymentPickAt !== void 0 && s.paymentPickAt > n || ne(r, { ...s, paymentPick: i, paymentPickAt: n });
}
function Mr(t, e) {
  const i = Y(t, e), n = Te(i);
  if (n.arrivedAt === void 0 && ne(i, { ...n, arrivedAt: Date.now() }))
    return n;
}
function Zi(t, e) {
  return `${qi}${t}:${e}`;
}
function xr(t, e, i, n) {
  const r = Zi(t, e);
  if (i === void 0 || n === null) {
    ee(I, r, O);
    return;
  }
  W(
    I,
    r,
    { arrivedAt: Date.now(), cartDigest: i, mpid: n },
    O
  );
}
function Vr(t, e, i, n) {
  const r = x(
    I,
    Zi(t, e),
    O
  );
  if (!b(r) || typeof r.arrivedAt != "number" || r.cartDigest !== i || n === null || r.mpid !== n)
    return !1;
  const { firedAt: s } = Te(Y(t, e)), o = x(I, `${He}${t}`), a = b(o) && typeof o.addedAt == "number" && o.mpid === n ? o.addedAt : void 0;
  return Me(r.arrivedAt) && !(s !== void 0 && s >= r.arrivedAt) && !(a !== void 0 && a >= r.arrivedAt);
}
function $r(t, e, i) {
  W(I, `${Xi}${t}:${e}`, {
    pathDigest: i,
    learnedAt: Date.now()
  });
}
function Wr(t, e, i) {
  const n = x(
    I,
    `${Xi}${t}:${e}`
  );
  if (!b(n) || n.pathDigest !== i || typeof n.learnedAt != "number")
    return !1;
  const r = Date.now() - n.learnedAt;
  return r >= 0 && r < br;
}
function ai(t) {
  ce(
    I,
    `${Bi}${t}:`,
    O
  ), ce(
    I,
    `${qi}${t}:`,
    O
  ), ce(I, `${zi}${t}:`);
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
const dt = /* @__PURE__ */ new Map();
function jr(t, e) {
  if (dt.delete(t), !e)
    return;
  const i = ir(t, e);
  if ("error" in i)
    return i.error;
  dt.set(t, i.entries);
}
function V(t) {
  return dt.get(t) ?? zn.filter((e) => e.accountId === t);
}
function ue(t, e) {
  const i = T(t), n = T(e);
  if (!i.includes("*"))
    return i === n;
  const r = i.split("/"), s = n.split("/");
  return r.length !== s.length ? !1 : r.every(
    (o, a) => o === "*" ? s[a] !== "" : o === s[a]
  );
}
function T(t) {
  return t.length > 1 && t.endsWith("/") ? t.slice(0, -1) : t;
}
function Hr(t, e) {
  const i = T(t).toLowerCase(), n = T(e).toLowerCase().split("/"), r = i.split("/").length;
  return ue(i, n.join("/")) || ue(i, ["", ...n.slice(2)].join("/")) || n.length > r && ue(i, n.slice(0, r).join("/"));
}
const en = {}, tn = {}, nn = {}, Dt = {}, rn = {}, Gr = {}, Yr = ["commit", "wallet", "checkout_step", "frame", "cart"], Br = ["vendor", "label", "brand", "frame", "submit", "name", "api"], zr = 512;
function sn(t) {
  return t === "commit" ? "intent_commit" : t === "checkout_step" ? "intent_checkout_step" : t === "cart" ? "intent_cart" : "intent_wallet";
}
function on(t) {
  return t === "intent_commit" ? tn : t === "intent_checkout_step" ? Dt : t === "intent_cart" ? rn : nn;
}
const Xr = 1e3;
function ft(t) {
  const e = Date.now() - t.t;
  return e >= 0 && e < Xr;
}
function Ge(t) {
  return V(t).filter((e) => e.cartIntent === !0);
}
function Ye(t) {
  return typeof t.source == "string" && Br.includes(t.source) ? t.source : void 0;
}
function an(t) {
  return [...new Set(V(t).map((i) => i.targetPageIdentifier))].some((i) => Kr(t, i)) ? "left" : "before_entry";
}
function Be(t, e, i, n, r = {}, s = !1) {
  const o = `${n}:${i}:${e.kind}${s ? ":wait" : ""}`;
  if (pt.has(o)) return;
  pt.add(o);
  const a = Ye(e);
  t.logPlacementDiagnostic(
    w("skipped", "intent_observed", {
      intent_kind: e.kind,
      intent_route: i,
      ...a ? { intent_source: a } : {},
      has_email: De(t, {}),
      has_identity: K(t.filteredUser),
      ...r
    })
  );
}
function Rt(t) {
  const e = C(t.filteredUser), i = t.getCurrentUser?.();
  return e !== null && C(i) === e && i?.isLoggedIn?.() === !0;
}
function gt(t, e, i, n, r, s = !1) {
  const o = e.accountId, a = an(o), c = Rt(e), l = (A) => Be(e, i, a, r, { logged_in: c, ...A ? { cause: A } : {} }, s), u = i.kind === "cart", d = i.kind === "wallet" && !c && (s || !K(e.filteredUser));
  if (!u && !c && (s || l(), !d))
    return;
  const p = u ? Ge(o) : V(o).filter((A) => A.cartIntent !== !0);
  if (p.length === 0) return l("cart_entry_only");
  if (p.length !== 1) return l("multiple_entries");
  if (n !== T(window.location.pathname) && !(u && ft(i)))
    return l("path_changed");
  const m = p[0];
  if (!K(e.filteredUser))
    return d && !s ? Jr(t, e, i, n, r) : l("no_valid_identity");
  const v = sn(i.kind), E = `${v}_off_entry`, { collected: y, missingKeys: h } = re(e, on(v), m, !1), _ = qe(e, o, m.targetPageIdentifier, y);
  if (Ht(o, m.targetPageIdentifier, _, !u))
    return l("active_preselection");
  if (h.length > 0) return l("missing_attribute");
  if (!De(e, y, m.targetPageIdentifier)) return l("no_strict_email");
  Re(
    e,
    o,
    m.targetPageIdentifier,
    m.targetPageIdentifier,
    y,
    "intent",
    ke(E, m),
    !1,
    v,
    !1,
    void 0,
    Ye(i),
    { route: a, loggedIn: c, requireLogin: !u && !d }
  );
}
function qr(t, e, i, n) {
  const r = (a) => Be(t, e, "entry", n, { cause: a });
  if (!K(t.filteredUser)) return r("no_valid_identity");
  const { collected: s, missingKeys: o } = re(t, Dt, i, !1);
  if (o.length > 0) return r("missing_attribute");
  if (!De(t, s, i.targetPageIdentifier)) return r("no_strict_email");
  Re(
    t,
    t.accountId,
    i.targetPageIdentifier,
    i.targetPageIdentifier,
    s,
    "intent",
    ke("intent_checkout_step", i),
    !1,
    "intent_checkout_step",
    !1,
    void 0,
    Ye(e),
    { route: "entry", loggedIn: Rt(t), requireLogin: !1 }
  );
}
const cn = 2e4;
function Jr(t, e, i, n, r) {
  ln(t);
  const s = () => {
    t.identityWait = void 0;
    const a = e.getCurrentHost?.() ?? e;
    Ot(a) && un(a, o);
  }, o = {
    signal: i,
    clickPathname: n,
    visitKey: r,
    route: N[N.length - 1],
    timer: setTimeout(s, Math.max(0, i.t + cn - Date.now()))
  };
  t.identityWait = o;
}
function ln(t) {
  t.identityWait && clearTimeout(t.identityWait.timer), t.identityWait = void 0;
}
function un(t, e) {
  const i = an(t.accountId), n = { logged_in: Rt(t), cause: "identity_wait_expired" };
  Be(t, e.signal, i, e.visitKey, n, !0);
}
function Qr(t, e) {
  const i = t.identityWait;
  if (!i || !K(e.filteredUser) || (ln(t), !Ot(e))) return;
  if (e.logPlacementDiagnostic(
    w("identity_arrived", "pending_identity", {
      intent_kind: i.signal.kind,
      ...Je(i.signal.t)
    })
  ), N[N.length - 1] !== i.route || i.clickPathname !== T(window.location.pathname) || Date.now() - i.signal.t >= cn) return un(e, i);
  gt(t, e, i.signal, i.clickPathname, i.visitKey, !0);
}
function Zr(t) {
  const e = t.pathname;
  return typeof e == "string" && e.charAt(0) === "/" && e.length <= zr ? T(e) : void 0;
}
const ye = /* @__PURE__ */ new Set(), pt = /* @__PURE__ */ new Set(), N = [];
function be(t) {
  if (t === tn) return "intent_commit";
  if (t === nn) return "intent_wallet";
  if (t === Dt) return "intent_checkout_step";
  if (t === rn) return "intent_cart";
}
function Se(t) {
  return be(t) !== void 0;
}
function rt(t, e = Date.now()) {
  t = T(t), N[N.length - 1]?.pathname !== t && (N.push({ pathname: t, since: e }), N.length > 8 && N.shift(), pt.clear());
}
function es(t, e, i) {
  if (!i || !Yr.includes(i.kind) || typeof i.t != "number" || !Number.isFinite(i.t))
    return;
  const n = `${i.kind}:${i.t}${i.adds === !0 ? ":adds" : ""}`;
  if (ye.has(n) || (ye.add(n), ye.size > 4096 && ye.delete(ye.values().next().value), !Ot(e)) || i.kind === "cart" && Ge(e.accountId).length === 0) return;
  ts(e.accountId, i);
  const r = C(e.filteredUser);
  i.kind === "cart" && i.adds === !0 && r !== null && _e(e.accountId) && kr(e.accountId, i.t, r);
  const s = [...N].reverse().find((_) => _.since <= i.t), o = Zr(i) ?? s?.pathname;
  if (!o) return;
  const a = s && s.pathname === o ? s.since : 0, c = `${o}:${a}`, l = i.kind === "cart", u = i.kind === "commit" || i.kind === "wallet" || l, d = M(e.accountId, o);
  if (!d || (l ? d.cartIntent !== !0 : d.cartIntent === !0)) {
    u && gt(t, e, i, o, c);
    return;
  }
  const p = window.location.pathname, m = o === T(p);
  if (l && !m && ft(i)) {
    gt(t, e, i, o, c);
    return;
  }
  const v = i.kind === "checkout_step" && d.checkoutStepIntent === !0;
  if (v && !m && ft(i)) {
    qr(e, i, d, c);
    return;
  }
  if (!(u || v) || !m) {
    Be(e, i, "entry", c);
    return;
  }
  t.intentSource = Ye(i);
  const E = sn(i.kind), y = t.scheduledDispatch;
  if (y && T(y.pathname) === T(p)) {
    Ft(t), Pn(t, e, y, "intent_released", E);
    return;
  }
  const h = t.pending.find(
    (_) => T(_.pathname) === T(p)
  );
  if (h) {
    h.intentSeen = E, h.waitingFor === "intent" && (t.pending = t.pending.filter((_) => _ !== h), pe(
      t,
      e,
      h.event,
      p,
      h.triggeringUserId,
      h.triggeredAt,
      E
    ));
    return;
  }
  pe(t, e, on(E), p, void 0, i.t);
}
function Ot(t) {
  return !t.isTargetingDisabled?.() && t.isForwardingAllowed?.() !== !1 && Qe(t) && t.isKitReady() && t.isPreselectionEnabled() && Ie(t.accountId);
}
function ts(t, e) {
  const i = e.kind === "cart" ? Ge(t) : V(t);
  new Set(i.map((r) => r.targetPageIdentifier)).forEach((r) => Ur(t, r, e.kind, e.t));
}
function ge(t) {
  return t === en;
}
const ze = 4, is = ["Auto Button Click", "Auto Link Click"], ns = ["is_auto_button_click", "is_auto_link_click"];
function xe(t) {
  return t.EventDataType === ze && is.includes(t.EventName ?? "") || ns.some((e) => String(t.EventAttributes?.[e]) === "true");
}
function dn(t) {
  const e = t.accountId;
  if (!(!e || !Ie(e) || t.isTargetingDisabled?.() || t.isForwardingAllowed?.() === !1 || !Qe(t) || !t.isKitReady() || !t.isPreselectionEnabled()))
    return e;
}
function fn(t, e) {
  if (!e) return;
  const i = new Set(V(t).map((r) => r.targetPageIdentifier)), n = Date.now();
  i.forEach((r) => Fr(t, r, e, n));
}
function rs(t, e) {
  const i = xe(e) ? dn(t) : void 0;
  i && fn(i, _r(e.EventAttributes));
}
function ss(t, e) {
  const i = dn(t);
  i && fn(i, Er(e));
}
function de(t, e) {
  return e.EventDataType === ze && g(e.EventName) && !xe(e) && (t.triggerEventNames ?? []).includes(e.EventName);
}
const gn = "rokt.preselecttrigger", ci = "rokt.preselectdefaulted", os = /^[A-Za-z][A-Za-z0-9_.]{0,63}$/, as = 16, Ve = "preselectFormEmail", mt = "preselectBoundUser";
function ke(t, e) {
  return `${t}|${e.pathname}`;
}
function M(t, e) {
  if (t)
    return V(t).find((i) => ue(i.pathname, e));
}
function Pe(t, e) {
  if (!(!t || !g(e)))
    return V(t).find((i) => i.targetPageIdentifier === e);
}
function ht(t, e) {
  if (!e)
    return t;
  const i = new Set(Object.keys(e).map((r) => r.toLowerCase())), n = {};
  for (const [r, s] of Object.entries(t))
    i.has(r.toLowerCase()) || (n[r] = s);
  return { ...n, ...e };
}
function Kt(t) {
  return t.getPreselectVariant?.() === "widened";
}
const cs = /iP(hone|od|ad)|Android|BlackBerry|BB10|IEMobile|Kindle/, ls = /Win(dows|16|95|98|CE)|Pocket Internet Explorer|OpenBSD|SunOS|CrOS|Linux|X11|Mac_PowerPC|Macintosh|QNX|BeOS|OS\/2/;
function us(t) {
  return cs.test(t) ? "MobileWeb" : ls.test(t) ? "DesktopWeb" : void 0;
}
function pn(t) {
  if (g(t))
    return t;
  const e = us(navigator.userAgent), i = e ? t.byClientType?.[e] : void 0;
  return i === Hi ? void 0 : (t.byHostname ? S(t.byHostname, window.location.hostname) : void 0) ?? i ?? t.value;
}
function st(t) {
  return new Set(
    Object.keys(t).filter((e) => !k(t[e])).map((e) => e.toLowerCase())
  );
}
function Xe(t, e, i) {
  const n = e.preselectAttributeDefaults;
  if (!n || Kt(t))
    return {};
  const r = /* @__PURE__ */ new Set([...st(t.getUserIdentities?.() ?? {}), ...st(i)]), s = st(t.userAttributes ?? {}), o = {};
  for (const a of Object.keys(n)) {
    const c = a.toLowerCase();
    if (Ce(a, t.mappedEmailSha256Key) || r.has(c) || s.has(c) && !mn(t, e, a))
      continue;
    const l = pn(n[a]);
    l !== void 0 && (o[a] = l);
  }
  return o;
}
function mn(t, e, i) {
  const n = S(e.preselectAttributeDefaults ?? {}, i);
  return b(n) && n.skipRemembered === !0 && !Kt(t) && !Ce(i, t.mappedEmailSha256Key) && pn(n) !== void 0;
}
function ds(t, e, i, n, r) {
  const s = e.preselectAttributeDefaults ?? {};
  return Object.keys(s).find((o) => {
    const a = s[o];
    if (g(a) || !a.skipValues)
      return !1;
    const c = a.skipValues.map((u) => u.toLowerCase()), l = n ?? {
      ...t.getUserIdentities?.() ?? {},
      ...S(r, o) !== void 0 ? {} : t.userAttributes ?? {},
      ...i
    };
    return Object.keys(l).some((u) => {
      const d = l[u];
      return u.toLowerCase() === o.toLowerCase() && (g(d) || typeof d == "number" || typeof d == "boolean") && c.includes(String(d).toLowerCase());
    });
  });
}
function Ut(t) {
  const e = t.getPreselectVariant?.();
  return e === "widened" || e === "standard" ? { variant: e } : {};
}
function fs(t, e, i) {
  const n = t?.identityKeys;
  if (!n?.length || !e)
    return n;
  const r = Nt(e, i);
  return r.length > 0 ? [...n, ...r] : n;
}
function gs(t, e, i) {
  const n = t?.preselectAttributeDefaults;
  if (!n || !e)
    return;
  const r = {};
  return Nt(e, i).forEach((s) => {
    const o = n[s], a = g(o) ? void 0 : o?.matchGroups?.find((c) => c.includes(e[s]));
    a && (r[s] = a);
  }), Object.keys(r).length > 0 ? r : void 0;
}
function Nt(t, e) {
  const i = Object.keys(e);
  return Object.keys(t).filter(
    (n) => S(e, n) === t[n] && !i.some((r) => r !== n && r.toLowerCase() === n.toLowerCase() && !k(e[r]))
  );
}
function hn(t, e) {
  if (!t)
    return;
  const i = Nt(t, e).filter((n) => os.test(n)).slice(0, as);
  return i.length > 0 ? i.join(",") : void 0;
}
function _n(t) {
  const e = Object.keys(t.preselectAttributeDefaults ?? {});
  return [...t.attributeKeys, ...e.filter((i) => !t.attributeKeys.includes(i))];
}
function Ie(t) {
  return t ? V(t).length > 0 : !1;
}
function ps(t, e, i = window.location.pathname) {
  if (t.pending.some((r) => r.pathname === i && !ge(r.event)))
    return;
  const n = t.scheduledDispatch;
  n && n.pathname === i && !ge(n.event) || pe(t, e, en, i);
}
function ms(t, e) {
  return !t || !g(e) ? !1 : V(t).some((i) => (i.triggerEventNames ?? []).includes(e));
}
function $e(t) {
  return !ge(t) && !Se(t) && t.EventDataType !== ze;
}
function hs(t, e) {
  const i = t.scheduledDispatch;
  return i && i.pathname === e && $e(i.event) ? !0 : t.pending.some((n) => n.pathname === e && $e(n.event));
}
function _s(t, e, i, n) {
  if (!t.isKitReady() || !t.isPreselectionEnabled() || !$t(t, i))
    return "waits";
  const { collected: r, missingKeys: s } = re(t, e, i);
  if (s.length > 0)
    return "waits";
  const o = t.accountId || "", a = le(St(o, T(n)));
  if (!a)
    return "now";
  const c = qe(t, o, i.targetPageIdentifier, r);
  return a.byEvent || jt(a.attributesDigest, c) ? "skipped" : "now";
}
function Es(t, e, i) {
  t.pending = t.pending.filter((r) => r.pathname !== i);
  const n = e.accountId ? Lt(e.accountId) : null;
  e.accountId && n && n.pathname === i && ie(e.accountId);
}
function ys(t, e, i, n = window.location.pathname) {
  const r = M(e.accountId, n);
  if (!r || !de(r, i))
    return;
  const s = _s(e, i, r, n);
  if (s === "now")
    Es(t, e, n);
  else if (hs(t, n) || s === "skipped" && t.scheduledDispatch?.pathname === n)
    return;
  pe(t, e, i, n);
}
function Is(t, e) {
  return t ? V(t).some((i) => i.attributeKeys.includes(e)) : !1;
}
function As() {
  return { pending: [] };
}
function Ft(t) {
  if (t.dispatchTimer === void 0)
    return;
  const e = t.scheduledDispatch;
  return clearTimeout(t.dispatchTimer), t.dispatchTimer = void 0, t.scheduledDispatch = void 0, e;
}
function vs(t, e) {
  return t === void 0 ? e : e === void 0 ? t : Math.min(t, e);
}
function li(t) {
  return ge(t) ? 0 : Se(t) || t.EventDataType === ze ? 2 : 1;
}
function bs(t, e) {
  const i = M(t.accountId, e.pathname);
  return !!i && re(t, e.event, i).missingKeys.length > 0;
}
function En(t, e, i, n) {
  const r = t.pending.find((s) => s.pathname === n);
  return !!r && li(i) < li(r.event) && !($e(i) && bs(e, r));
}
function Q(t, e, i) {
  const n = t.pending.findIndex((r) => r.pathname === i.pathname);
  if (n >= 0) {
    if (En(t, e, i.event, i.pathname))
      return;
    const r = t.pending[n];
    t.pending[n] = {
      ...i,
      triggeredAt: vs(r.triggeredAt, i.triggeredAt),
      intentSeen: i.intentSeen ?? r.intentSeen ?? be(r.event)
    };
    return;
  }
  t.pending.push(i);
}
function we(t) {
  if (!t?.getUserIdentities)
    return [];
  const e = t.getUserIdentities().userIdentities;
  return e ? Object.keys(e).filter((i) => {
    const n = e[i];
    return g(n) && n.length > 0;
  }).sort() : [];
}
function K(t) {
  return we(t).length > 0;
}
const _t = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, Et = /* @__PURE__ */ new WeakSet(), yt = /* @__PURE__ */ new WeakSet(), ui = /* @__PURE__ */ new WeakSet();
function Mt(t) {
  if (!(t instanceof HTMLInputElement)) return !1;
  const e = t.type;
  return e === "text" || e === "email" || t.getAttribute("autocomplete") === "email" && e !== "hidden" && e !== "password";
}
function It(t) {
  const e = t.target;
  if (!(e instanceof HTMLInputElement)) return;
  const i = !ui.has(t);
  if (ui.add(t), t.isTrusted !== !0 ? yt.add(e) : i && yt.delete(e), t.isTrusted === !0 && Mt(e)) {
    if (!i) return;
    Et.add(e), e.addEventListener("input", It, !0), e.addEventListener("change", It, !0);
  } else
    Et.delete(e);
}
function Ps(t) {
  return Mt(t) && (t.type === "email" || t.getAttribute("autocomplete") === "email" || _t.test(t.value.trim()));
}
function Le(t) {
  return t.attributeKeys.find((e) => e.toLowerCase() === "email");
}
const ws = 254;
function yn(t) {
  const e = /* @__PURE__ */ new Map();
  let i;
  return document.querySelectorAll("input").forEach((n) => {
    const r = Et.has(n);
    if (!r && !t || !Mt(n)) return;
    const s = n.value.trim();
    r ? _t.test(s) && !e.has(s.toLowerCase()) && e.set(s.toLowerCase(), s) : i !== "untrusted_fill" && s.length <= ws && _t.test(s) && (i = yt.has(n) ? "untrusted_fill" : "unseen_fill");
  }), { emails: e, unfilled: i };
}
function Ts() {
  const { emails: t } = yn(!1);
  return t.size === 1 ? t.values().next().value : void 0;
}
function xt(t, e, i = {}) {
  const n = new Set(
    [e, "emailsha256", t.mappedEmailSha256Key].filter(g).map((o) => o.toLowerCase())
  ), r = t.getCurrentUser?.();
  return [
    i,
    t.userAttributes,
    t.filteredUser?.getAllUserAttributes?.() ?? {},
    t.getUserIdentities?.() ?? {},
    r?.getAllUserAttributes?.() ?? {},
    r?.getUserIdentities?.().userIdentities ?? {}
  ].some(
    (o) => Object.keys(o).some((a) => n.has(a.toLowerCase()) && !k(S(o, a)))
  );
}
const Ss = ["email", "emailsha256"];
function Ce(t, e) {
  const i = t.toLowerCase();
  return Ss.includes(i) || g(e) && i === e.toLowerCase();
}
function De(t, e, i) {
  return t.getOutgoingAttributes ? Oe(t.getOutgoingAttributes(e, i), t.mappedEmailSha256Key) : Oe(e, t.mappedEmailSha256Key) || Oe(t.getUserIdentities?.() ?? {}, t.mappedEmailSha256Key);
}
function Oe(t, e) {
  return Object.keys(t).some(
    (i) => Ce(i, e) && !k(S(t, i))
  );
}
function Vt(t, e, i, n = {}) {
  return e.readEmailInput !== !0 ? "read_disabled" : ue(e.pathname, window.location.pathname) ? t.isForwardingAllowed?.() !== !0 || t.isPreselectionPrivacyAllowed?.() === !1 || t.isTargetingDisabled?.() === !0 ? "privacy_blocked" : t.isEmailIdentityFiltered?.() === !0 ? "email_filtered" : xt(t, i, n) ? "partner_email" : void 0 : "off_route";
}
function ks(t, e, i, n) {
  const r = Vt(t, e, i, n.EventAttributes ?? {});
  if (r) return r;
  const { emails: s, unfilled: o } = yn(!0);
  return s.size > 1 ? "multiple_emails" : o ?? "no_field";
}
function Ls(t, e, i) {
  const n = window.location.pathname, r = M(e.accountId, n), s = r && Le(r);
  return !!s && t.pending.some(
    (o) => o.pathname === n && !Vt(e, r, s, o.event.EventAttributes ?? {})
  ) && i.isTrusted === !0 && Ps(i.target);
}
function In(t, e, i, n) {
  const r = Le(e);
  if (!r || !k(S(i, r)) || Vt(t, e, r, n.EventAttributes ?? {}))
    return;
  const s = Ts();
  if (s)
    return i[r] = s, r;
}
function $t(t, e) {
  const i = Le(e);
  return K(t.filteredUser) || e.readEmailInput === !0 && !!i && Wt(t, e, {}).includes(i);
}
function Cs(t) {
  return !!t && V(t).some((e) => e.readEmailInput === !0);
}
function We(t) {
  return t.length > 0 ? t.join(",") : "none";
}
function C(t) {
  const e = t?.getMPID?.();
  return e == null ? null : String(e);
}
function An(t, e) {
  const i = we(t.filteredUser), n = t.getCurrentUser?.(), r = we(n), s = C(t.filteredUser), o = C(n), a = [...e.identityKeys ?? [], "email", "emailsha256"];
  t.mappedEmailSha256Key && a.push(t.mappedEmailSha256Key);
  const c = new Set(a.map((p) => p.toLowerCase())), l = n?.getAllUserAttributes?.() ?? {}, u = [t.userAttributes, l].some(
    (p) => Object.entries(p).some(
      ([m, v]) => c.has(m.toLowerCase()) && g(v) && v.length > 0
    )
  );
  let d = "no_identities";
  return t.filteredUser ? o !== null && s !== o ? d = "mpid_mismatch" : r.length > 0 && (d = "kit_user_lacks_identities") : d = "no_filtered_user", {
    identity_reason: d,
    kit_identity_types: We(i),
    current_identity_types: We(r),
    mpid_match: o === null ? "unknown" : s === o,
    identity_attribute_present: u
  };
}
function Wt(t, e, i) {
  const n = Kt(t) ? e.widenedOptionalAttributeKeys ?? [] : [], r = new Set(
    [...e.optionalAttributeKeys ?? [], ...n].map((o) => o.toLowerCase())
  ), s = Xe(t, e, i);
  return e.attributeKeys.filter(
    (o) => !r.has(o.toLowerCase()) && k(S(i, o)) && S(s, o) === void 0
  );
}
function re(t, e, i, n = !0) {
  const r = t.filteredUser?.getAllUserAttributes?.() || {}, s = new Set(i.identityKeys ?? []);
  let o;
  const a = {};
  for (const u of i.attributeKeys) {
    const d = t.getEventAttributeValue(e, u), p = S(t.userAttributes, u);
    let m = !k(d) || mn(t, i, u) ? d : k(p) ? S(r, u) : p;
    if (k(m) && s.has(u)) {
      o || (o = t.getUserIdentities?.() ?? {});
      const v = S(o, u);
      m = g(v) && v !== "" ? v : void 0;
    }
    k(m) || (a[u] = m);
  }
  const c = e.EventAttributes ?? {};
  for (const u of Object.keys(i.preselectAttributeDefaults ?? {})) {
    if (!k(t.getEventAttributeValue(e, u)))
      continue;
    const d = Object.keys(c).find(
      (p) => p.toLowerCase() === u.toLowerCase() && !k(c[p])
    );
    d !== void 0 && (a[d] = c[d]);
  }
  const l = n ? In(t, i, a, e) : void 0;
  return {
    collected: a,
    missingKeys: Wt(t, i, a),
    formEmailKey: l
  };
}
const vn = /* @__PURE__ */ new WeakMap();
function Ds(t) {
  return vn.get(t);
}
function Rs(t, e, i) {
  i && vn.set(e, i);
  const n = (s) => {
    i?.();
    const o = e[Ve] ? "redacted" : s instanceof Error ? s.message : String(s);
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
const di = /* @__PURE__ */ new Map(), fi = /* @__PURE__ */ new Map();
function gi(t, e, i) {
  const n = t.get(e), r = { previous: i, earlier: n };
  return n && (n.later = r), t.set(e, r), r;
}
function pi(t, e, i, n) {
  const { earlier: r, later: s } = i;
  if (s) {
    s.previous = i.previous, s.earlier = r, r && (r.later = s);
    return;
  }
  n(i.previous), r && (r.later = void 0), t.get(e) === i && (r ? t.set(e, r) : t.delete(e));
}
function qe(t, e, i, n) {
  try {
    const r = Pe(e, i), s = r ? Xe(t, r, n) : void 0, o = ht(n, s), a = t.getOutgoingAttributes ? t.getOutgoingAttributes(n, i) : { ...t.getUserIdentities?.() ?? {}, ...o }, c = Object.keys(a).sort().filter((h) => Ce(h, t.mappedEmailSha256Key) && !k(S(a, h))).map((h) => [h, S(a, h)]), l = Object.keys(r?.preselectAttributeDefaults ?? {}), u = (h) => l.some((_) => _.toLowerCase() === h.toLowerCase()), d = {};
    for (const [h, _] of Object.entries(o))
      u(h) || (d[h] = _);
    for (const h of l) {
      const _ = Object.keys(a).filter((A) => A.toLowerCase() === h.toLowerCase() && !k(a[A])).sort().map((A) => [A, a[A]]);
      _.length > 0 && (d[h] = _);
    }
    const p = JSON.stringify(d), m = [.../* @__PURE__ */ new Set([...r?.attributeKeys ?? [], ...Object.keys(o)])].filter((h) => !u(h)).sort().filter((h) => {
      const _ = S(a, h);
      return _ !== void 0 && _ !== S(o, h);
    }).map((h) => [h, S(a, h)]), v = c.length > 0 ? `${p}|${JSON.stringify(c)}` : p, E = m.length > 0 ? `${v}>${JSON.stringify(m)}` : v, y = hn(t.getPreselectFills?.(n, i) ?? s, a);
    return y ? { digest: J(`${E}#${y}`), unmarkedDigest: J(E) } : { digest: J(E) };
  } catch {
    return {};
  }
}
function jt(t, e) {
  return t !== void 0 && e.digest !== void 0 && (t === e.digest || t === e.unmarkedDigest);
}
function Ht(t, e, i, n) {
  return oi(t, e, i.digest, n) || i.unmarkedDigest !== void 0 && oi(t, e, i.unmarkedDigest, n);
}
function Gt(t) {
  return !t.isTargetingDisabled?.() && t.isPreselectionPrivacyAllowed?.() !== !1 && t.isForwardingAllowed?.() !== !1;
}
function Re(t, e, i, n, r, s, o, a = !1, c, l = a, u, d, p) {
  if (!Gt(t))
    return !1;
  const m = c ? { intent_kind: c.replace("intent_", "") } : {}, v = Pe(e, n), E = v ? Xe(t, v, r) : {}, y = t.getOutgoingAttributes?.(r, n), h = v ? ds(t, v, r, y, E) : void 0;
  if (h)
    return t.logPlacementDiagnostic(
      w("skipped", `skip_value:${h}`, m)
    ), !1;
  const _ = St(e, i), A = qe(t, e, n, r), P = A.digest;
  if (c && Ht(e, n, A, c !== "intent_cart"))
    return t.logPlacementDiagnostic(w("skipped", "active_preselection", m)), !0;
  if (a && le(_)?.byEvent)
    return t.logPlacementDiagnostic(w("skipped", "active_preselection")), !1;
  const U = P !== void 0 ? le(_) : null;
  if (P !== void 0) {
    if (jt(U?.attributesDigest, A))
      return t.logPlacementDiagnostic(w("skipped", "active_preselection", m)), !0;
    sr(
      _,
      P,
      l || !!c && le(_)?.byEvent === !0
    );
  }
  const L = Object.keys(E).filter((B) => !y || S(y, B) === E[B]);
  t.logPlacementDiagnostic(
    w("fired", s, {
      identity_types: We(we(t.filteredUser)),
      ...u ? { email_source: "input" } : {},
      ...c ? {
        ...m,
        intent_route: p ? p.route : "entry",
        ...d ? { intent_source: d } : {},
        ...p ? { logged_in: p.loggedIn } : {}
      } : {},
      ...Ut(t),
      ...L.length > 0 ? { defaulted_keys: L.join(",") } : {}
    })
  );
  const j = `${e}:${n}`, D = gi(
    di,
    j,
    Rr(e, n, P, c === "intent_cart")
  ), H = P !== void 0 ? gi(fi, _, U) : void 0;
  let z = !1;
  const se = () => {
    z || (z = !0, H && pi(
      fi,
      _,
      H,
      (B) => or(_, B, P)
    ), pi(
      di,
      j,
      D,
      (B) => Or(e, n, B, P)
    ));
  };
  return Rs(t, {
    attributes: { ...r, [gn]: o },
    preselect: !0,
    identifier: n,
    omitUrl: !0,
    ...u ? { [Ve]: { key: u, mpid: C(t.filteredUser) } } : {},
    ...p ? { [mt]: { mpid: C(t.filteredUser), requireLogin: p.requireLogin } } : {}
  }, se), !0;
}
function Os(t, e) {
  if (!e.accountId || !e.isKitReady())
    return;
  const i = Lt(e.accountId);
  if (!i)
    return;
  if (t.pending.some((o) => o.pathname === i.pathname)) {
    ie(e.accountId);
    return;
  }
  if (!e.isPreselectionEnabled()) {
    ie(e.accountId);
    return;
  }
  if (!K(e.filteredUser) || (ie(e.accountId), C(e.filteredUser) !== i.mpid))
    return;
  const n = M(e.accountId, i.pathname);
  if (!n || n.targetPageIdentifier !== i.identifier)
    return;
  if (!i.byEvent && Ze(e)) {
    e.logPlacementDiagnostic(w("missed", "recovery_awaits_intent"));
    return;
  }
  const r = te(i.attributes), s = Wt(e, n, r);
  if (s.length > 0) {
    for (const o of s)
      e.logPlacementDiagnostic(
        w("missed", `missing_persisted_attribute:${o}`, Ut(e))
      );
    return;
  }
  Re(
    e,
    e.accountId,
    i.identifier,
    i.identifier,
    r,
    "recovered",
    ke("recovered", n)
  );
}
function Yt(t) {
  return !t.isTargetingDisabled?.() && t.isPreselectionPrivacyAllowed?.() !== !1 && t.isKitReady() && t.isPreselectionEnabled();
}
function Je(t) {
  return t === void 0 ? {} : { since_trigger_ms: Date.now() - t };
}
function bn(t, e, i) {
  if (e.waitingFor !== "intent" || e.intentSeen)
    return !1;
  const n = M(t.accountId, e.pathname);
  return !!n && n === M(t.accountId, i);
}
function At(t, e) {
  Yt(t) && t.logPlacementDiagnostic(
    w("missed", "left_trigger_path", {
      waiting_for: e.waitingFor,
      has_identity: K(t.filteredUser),
      ...Je(e.triggeredAt)
    })
  );
}
function pe(t, e, i, n = window.location.pathname, r, s = Date.now(), o) {
  const a = t.pending.filter((u) => u.pathname !== n);
  if (a.length > 0) {
    const u = e.accountId ? Lt(e.accountId) : null;
    e.accountId && u && a.some((d) => d.pathname === u.pathname) && ie(e.accountId), a.forEach((d) => {
      bn(e, d, n) ? t.intentWaitMovedWithin = M(e.accountId, n) : At(e, d);
    }), t.pending = t.pending.filter((d) => d.pathname === n);
  }
  const c = Ft(t), l = c !== void 0 && c.pathname === n && ge(c.event);
  if (c && !l) {
    const u = M(e.accountId, c.pathname);
    T(c.pathname) !== T(n) && u?.releaseHoldOnRouteChange ? (Pn(t, e, c, "hold_released_on_route_change"), t.pending = t.pending.filter((d) => d.pathname === c.pathname ? (At(e, d), !1) : !0)) : mi(e, c, n);
  }
  Ks(t, e, i, n, r, s, l, o), l && t.scheduledDispatch === void 0 && mi(e, c, n);
}
function mi(t, e, i) {
  t.logPlacementDiagnostic(
    w("missed", "hold_cancelled", {
      held_ms: Date.now() - e.heldAt,
      same_path: e.pathname === i
    })
  );
}
function Ks(t, e, i, n, r, s, o, a) {
  const c = t.pending.find((u) => T(u.pathname) === T(n));
  if (a ?? (a = be(i) ?? c?.intentSeen ?? be(c?.event)), e.isTargetingDisabled?.() || e.isPreselectionPrivacyAllowed?.() === !1)
    return;
  const l = M(e.accountId, n);
  if (!l) {
    Us(e, n);
    return;
  }
  if (!(r !== void 0 && C(e.filteredUser) !== r)) {
    if (!a && !de(l, i) && Ze(e)) {
      const u = t.intentWaitMovedWithin === l;
      t.intentWaitMovedWithin = void 0;
      const d = u || c?.waitingFor === "intent" && c.awaitingIntentLogged === !0, p = e.isKitReady() && e.isPreselectionEnabled();
      Q(t, e, {
        event: i,
        pathname: n,
        // Bound to an identified shopper, as a timer hold is, so another user's click never sends
        // this page view's attributes. A guest stays unbound so signing in at checkout still fires.
        triggeringUserId: r ?? (K(e.filteredUser) ? C(e.filteredUser) : void 0),
        triggeredAt: s,
        waitingFor: "intent",
        awaitingIntentLogged: d || p
      }), !d && p && e.logPlacementDiagnostic(w("held", "awaiting_intent")), p && vt(e, l, i);
      return;
    }
    if (!e.isKitReady()) {
      if (En(t, e, i, n))
        return;
      const u = [], d = C(e.filteredUser);
      if (e.accountId && d && K(e.filteredUser)) {
        const { collected: p, missingKeys: m, formEmailKey: v } = re(e, i, l);
        if (m.length === 0 && !v) {
          const E = te(p);
          (de(l, i) || !!a ? si(
            e.accountId,
            n,
            l.targetPageIdentifier,
            E,
            d,
            !0
          ) : si(e.accountId, n, l.targetPageIdentifier, E, d)) || u.push(w("queued", "persist_failed"));
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
      if (vt(e, l, i), !$t(e, l)) {
        e.logPlacementDiagnostic(
          w("missed", "no_valid_identity", An(e, l))
        ), Q(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "identity" });
        return;
      }
      if (l.dispatchDelayMs !== void 0 && !de(l, i) && !Se(i) && !a) {
        const u = C(e.filteredUser), d = Math.min(
          l.dispatchDelayMs,
          Math.max(0, s + l.dispatchDelayMs - Date.now())
        );
        t.scheduledDispatch = { event: i, pathname: n, heldAt: Date.now(), heldForUserId: u, triggeredAt: s }, o || e.logPlacementDiagnostic(w("held", "dispatch_delay", { delay_ms: d })), t.dispatchTimer = setTimeout(() => {
          t.dispatchTimer = void 0, t.scheduledDispatch = void 0, wn(t, e.getCurrentHost?.() ?? e, i, n, u, s);
        }, d);
        return;
      }
      Tn(
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
function vt(t, e, i) {
  if (!t.accountId) return;
  const n = Le(e), r = e.readEmailInput === !0 && !!n && (xt(t, n, i.EventAttributes ?? {}) || In(t, e, {}, i) !== void 0);
  Tr(
    t.accountId,
    e.targetPageIdentifier,
    K(t.filteredUser) || r
  );
}
function Us(t, e) {
  const i = t.accountId;
  !i || t.isKitReady() && !t.isPreselectionEnabled() || V(i).forEach((n) => {
    Hr(n.pathname, e) && Dr(i, n.targetPageIdentifier);
  });
}
function Ns(t) {
  const e = N[N.length - 1];
  return t !== void 0 && (e === void 0 || t < e.since);
}
function Fs() {
  try {
    return new URL(document.referrer).origin === window.location.origin ? "same_origin" : "other_origin";
  } catch {
    return "none";
  }
}
function Qe(t) {
  return t.isCheckoutIntentActive?.() === !0 && t.isPreselectionPrivacyAllowed?.() !== !1;
}
function Ze(t) {
  return Qe(t) && t.isLinkIntentWithheld?.() !== !0;
}
function Pn(t, e, i, n, r) {
  wn(
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
function wn(t, e, i, n, r, s, o, a) {
  const c = M(e.accountId, n);
  if (!(!c || e.isTargetingDisabled?.() || e.isPreselectionPrivacyAllowed?.() === !1)) {
    if (!a && !de(c, i) && !Se(i) && Ze(e)) {
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
      if (!$t(e, c)) {
        e.logPlacementDiagnostic(
          w("missed", "no_valid_identity", An(e, c))
        ), Q(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "identity" });
        return;
      }
      C(e.filteredUser) === r && Tn(t, e, i, n, c, r, s, o, a);
    }
  }
}
function Tn(t, e, i, n, r, s, o, a, c, l) {
  if (e.isPreselectionPrivacyAllowed?.() === !1) return;
  const { collected: u, missingKeys: d, formEmailKey: p } = re(e, i, r), m = t.lastResolvedPageView, v = N[N.length - 1], E = T(n);
  if (Se(i) && m && m.accountId === e.accountId && m.pathname === E && m.route === v && m.userId === C(e.filteredUser) && m.identifier === r.targetPageIdentifier && m.attributeKeys.some(
    (P) => r.attributeKeys.includes(P) && k(S(u, P))
  ))
    return;
  if (d.length > 0) {
    const P = we(e.filteredUser), U = Le(r);
    for (const L of d)
      e.logPlacementDiagnostic(
        w("missed", `missing_attribute:${L}`, {
          identity_types: We(P),
          key_is_identity: P.some((j) => j.toLowerCase() === L.toLowerCase()),
          ...L === U ? { email_reason: ks(e, r, L, i) } : {},
          ...Ut(e)
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
  const y = c ?? be(i);
  if (y && !De(e, u, r.targetPageIdentifier)) {
    t.noEmailLoggedPathname !== E && (t.noEmailLoggedPathname = E, e.logPlacementDiagnostic(
      w("missed", "no_strict_email", {
        intent_kind: y.replace("intent_", ""),
        has_identity: K(e.filteredUser)
      })
    )), Q(t, e, {
      event: i,
      pathname: n,
      triggeringUserId: s,
      triggeredAt: o,
      intentSeen: y,
      waitingFor: "attribute"
    });
    return;
  }
  t.noEmailLoggedPathname = void 0, l && (t.pending = t.pending.filter((P) => P !== l));
  const h = de(r, i), _ = y ?? (h ? "event" : ge(i) ? "pathname" : "pageview");
  Re(
    e,
    e.accountId || "",
    T(n),
    r.targetPageIdentifier,
    u,
    a ?? (y ? "intent" : h ? "event_trigger" : "fired"),
    ke(_, r),
    h && !y,
    y,
    h,
    p,
    y ? t.intentSource : void 0
  ) && ($e(i) || h) && (t.lastResolvedPageView = {
    accountId: e.accountId,
    pathname: E,
    route: v,
    userId: C(e.filteredUser),
    identifier: r.targetPageIdentifier,
    attributeKeys: Object.keys(u)
  });
}
const Ms = ["", "0", "[]", "{}", "false", "null"];
function Sn(t) {
  if (k(t)) return !1;
  if (Array.isArray(t)) return !0;
  const e = String(t).trim();
  if (Ms.includes(e.toLowerCase())) return !1;
  try {
    const i = JSON.parse(e);
    return !Array.isArray(i) || i.length > 0;
  } catch {
    return !0;
  }
}
function _e(t) {
  const e = t ? Ge(t) : [];
  return e.length === 1 && e[0].cartUserAttribute ? e[0] : void 0;
}
function xs(t) {
  return _e(t) !== void 0;
}
function hi(t, e) {
  const i = _e(t)?.cartUserAttribute;
  return g(i) && i.toLowerCase() === e.toLowerCase();
}
function _i(t, e, i) {
  const n = _e(t)?.cartUserAttribute?.toLowerCase();
  if (!n || i && _n(i).some((s) => s.toLowerCase() === n))
    return e;
  const r = {};
  for (const [s, o] of Object.entries(e))
    s.toLowerCase() !== n && (r[s] = o);
  return r;
}
function kn(t, e) {
  const i = t.filteredUser?.getAllUserAttributes?.() ?? {}, n = Object.keys(i).find((r) => r.toLowerCase() === e.toLowerCase());
  return n === void 0 ? void 0 : i[n];
}
function Ln(t) {
  const { search: e, hash: i } = window.location, n = /^#!|^#[^?&]*\//.test(i);
  return T(t) + e + (n ? i : "");
}
function Cn(t) {
  try {
    return J(g(t) ? t : JSON.stringify(t) ?? "");
  } catch {
    return;
  }
}
function Ei(t, e, i = window.location.pathname) {
  t.cartPageViewPathname = T(i), Dn(t, e, i);
}
function Dn(t, e, i) {
  const n = _e(e.accountId);
  if (!n || t.cartPageViewPathname !== T(i) || ue(n.pathname, i) || !Gt(e)) {
    t.cartPageViewPathname = void 0;
    return;
  }
  if (!e.isKitReady()) return;
  if (!e.isPreselectionEnabled()) {
    t.cartPageViewPathname = void 0;
    return;
  }
  const r = e.accountId;
  if (Wr(r, n.targetPageIdentifier, J(Ln(i)))) {
    t.cartPageViewPathname = void 0;
    return;
  }
  const s = kn(e, n.cartUserAttribute);
  if (!(Sn(s) || Lr(r, C(e.filteredUser))) || !K(e.filteredUser)) return;
  const a = Cn(s);
  if (a !== void 0 && Vr(r, n.targetPageIdentifier, a, C(e.filteredUser)))
    return;
  const { collected: c, missingKeys: l } = re(e, Gr, n, !1);
  if (l.length > 0 || !De(e, c, n.targetPageIdentifier)) return;
  t.cartPageViewPathname = void 0;
  const u = qe(e, r, n.targetPageIdentifier, c), d = le(St(r, n.targetPageIdentifier));
  Ht(r, n.targetPageIdentifier, u) || jt(d?.attributesDigest, u) || Re(
    e,
    r,
    n.targetPageIdentifier,
    n.targetPageIdentifier,
    c,
    "fired",
    ke("pageview_cart", n),
    !1,
    void 0,
    !1,
    void 0,
    void 0,
    { requireLogin: !1 }
  );
}
function Vs(t, e, i = window.location.pathname) {
  if (Os(t, e), Qr(t, e), t.cartPageViewPathname !== void 0 && Dn(t, e, i), t.pending.length === 0)
    return;
  const n = t.pending;
  t.pending = [], n.forEach((r) => {
    const { event: s, pathname: o, storedDiagnostics: a, triggeringUserId: c, triggeredAt: l, waitingFor: u, intentSeen: d } = r, p = Yt(e), m = K(e.filteredUser), v = Je(l);
    if (p && u === "identity" && m && e.logPlacementDiagnostic(
      w("identity_arrived", "pending_identity", {
        ...v,
        on_trigger_path: o === i
      })
    ), o !== i) {
      bn(e, r, i) ? t.intentWaitMovedWithin = M(e.accountId, i) : At(e, { waitingFor: u, triggeredAt: l });
      return;
    }
    if (u === "intent" && !d) {
      const E = M(e.accountId, o);
      if (E && Ze(e)) {
        !r.awaitingIntentLogged && e.isKitReady() && e.isPreselectionEnabled() && (e.logPlacementDiagnostic(w("held", "awaiting_intent")), vt(e, E, s), r.awaitingIntentLogged = !0), t.pending.push(r);
        return;
      }
    }
    p && a?.forEach((E) => e.logPlacementDiagnostic(E)), t.scheduledDispatch?.pathname !== o && pe(t, e, s, o, c, l, d);
  });
}
function $s(t, e, i) {
  if (!t.accountId || !Yt(t))
    return;
  const n = Pe(t.accountId, e);
  if (!n)
    return;
  const r = _e(t.accountId);
  if (r?.targetPageIdentifier === n.targetPageIdentifier) {
    const a = Ln(window.location.pathname);
    a !== "/" && $r(t.accountId, n.targetPageIdentifier, J(a));
    const c = kn(t, r.cartUserAttribute);
    xr(
      t.accountId,
      n.targetPageIdentifier,
      Sn(c) ? Cn(c) : void 0,
      C(t.filteredUser)
    );
  }
  const s = Mr(t.accountId, n.targetPageIdentifier);
  if (!s || (Qe(t) && t.isForwardingAllowed?.() !== !1 && t.logPlacementDiagnostic(
    w("arrived", "intent_arrival", {
      ...Ws(s),
      ...js(s, i)
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
      trigger_seen_any_tab: o || Sr(t.accountId, n.targetPageIdentifier),
      ...Je(s.triggeredAt),
      near_miss_seen: Ns(s.nearMissAt),
      // Page memory loses the trigger record on a full navigation, so trigger_seen reads false.
      storage: xn() ? "page" : "device",
      referrer: Fs()
    })
  );
}
function Ws(t) {
  const e = t.intentAt === void 0 || t.intentKind === void 0 ? "none" : Gs(Date.now() - t.intentAt);
  return {
    intent_seen: e === "none" ? "none" : t.intentKind,
    lead: e,
    fired: t.firedAt !== void 0
  };
}
function js(t, e) {
  const i = Ir(e), n = t.paymentPickAt === void 0 ? -1 : Date.now() - t.paymentPickAt, r = t.paymentPick && n >= 0 && n < fe ? t.paymentPick : "none";
  if (r === "none" && i === "absent")
    return {};
  const s = t.firedAt === void 0 ? -1 : Date.now() - t.firedAt, o = t.paymentAtFire && s >= 0 && s < fe ? t.paymentAtFire : "none";
  return {
    payment_guess: o,
    payment_pick: r,
    payment_arrival: i,
    payment_match: o !== "none" && i !== "absent" && i !== "other" ? o === i : "n/a"
  };
}
const Hs = [
  [1e3, "lt1s"],
  [2e3, "1s_2s"],
  [5e3, "2s_5s"],
  [1e4, "5s_10s"],
  [2e4, "10s_20s"],
  [6e4, "20s_60s"],
  [3e5, "60s_300s"],
  [fe, "300s_1800s"]
];
function Gs(t) {
  if (t < 0)
    return "none";
  const e = Hs.find(([i]) => t < i);
  return e ? e[1] : "none";
}
function Ys() {
  return {
    context: null,
    lifecycle: "idle",
    recreateInFlight: null
  };
}
function Bs(t, e) {
  t.context = {
    accountId: e.accountId,
    launcherOptions: { ...e.launcherOptions },
    legacyRoktExtensions: [...e.legacyRoktExtensions]
  };
}
function zs(t) {
  t.lifecycle = "attached";
}
function Xs(t) {
  t.lifecycle !== "idle" && (t.lifecycle = "terminated");
}
function qs(t) {
  t.lifecycle = "terminated";
}
function Js(t) {
  t.context = null, t.lifecycle = "idle", t.recreateInFlight = null;
}
function Qs(t, e, i) {
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
const yi = "rokt:intent", Ii = "LEAD_CAPTURE_SUBMITTED";
class Zs {
  constructor(e) {
    this.handlers = e, this.config = null, this.dispatchedForPageView = !1;
  }
  configure(e) {
    this.config = e, this.dispatchedForPageView = !1, this.detachListeners(), this.isIdentityCaptureBridgeEnabled(this.config) && (this.leadCaptureSubmittedListener = (i) => {
      const n = this.parseLeadCaptureSubmittedPayload(i);
      n && this.handlers.onLeadCaptureSubmitted(n);
    }, window.addEventListener(Ii, this.leadCaptureSubmittedListener)), this.isExitIntentBridgeEnabled(this.config) && (this.exitIntentListener = (i) => this.handleExitIntentEvent(i), window.addEventListener(yi, this.exitIntentListener));
  }
  resetPageViewState() {
    this.dispatchedForPageView = !1;
  }
  dispose() {
    this.detachListeners(), this.config = null, this.dispatchedForPageView = !1;
  }
  detachListeners() {
    this.exitIntentListener && (window.removeEventListener(yi, this.exitIntentListener), this.exitIntentListener = void 0), this.leadCaptureSubmittedListener && (window.removeEventListener(Ii, this.leadCaptureSubmittedListener), this.leadCaptureSubmittedListener = void 0);
  }
  isExitIntentBridgeEnabled(e) {
    return !!(e && e.enabled !== !1);
  }
  isIdentityCaptureBridgeEnabled(e) {
    if (!this.isExitIntentBridgeEnabled(e))
      return !1;
    const i = e ? e.identityCapture : void 0;
    return b(i) ? i.enabled === !0 : !1;
  }
  allowCustomUserAttributes(e) {
    const i = e ? e.identityCapture : void 0;
    return b(i) ? i.allowCustomUserAttributes === !0 : !1;
  }
  getAllowedUserAttributeKeys(e) {
    const i = e ? e.identityCapture : void 0;
    if (!b(i))
      return /* @__PURE__ */ new Set();
    const n = i.allowedUserAttributeKeys;
    if (!Array.isArray(n))
      return /* @__PURE__ */ new Set();
    const r = n.filter((s) => g(s)).map((s) => s.trim()).filter((s) => s.length > 0);
    return new Set(r);
  }
  extractExitIntentReason(e) {
    return e instanceof CustomEvent && e.detail && g(e.detail.reason) ? e.detail.reason : "unknown";
  }
  handleExitIntentEvent(e) {
    const i = this.extractExitIntentReason(e);
    if (this.dispatchedForPageView || !this.handlers.isKitReady() || !(i === "mouse-exit-top" || i === "scroll-up-fast" || i === "idle" || i === "leave-link"))
      return;
    this.dispatchedForPageView = !0;
    const r = this.config && b(this.config.attributes) ? this.config.attributes : {};
    this.handlers.onExitIntent(
      i,
      r
    ) || (this.dispatchedForPageView = !1);
  }
  parseLeadCaptureSubmittedPayload(e) {
    if (!(e instanceof CustomEvent) || !b(e.detail))
      return null;
    const i = e.detail;
    if (!b(i.body))
      return null;
    const n = i.body, r = g(n.email) ? n.email : void 0, s = g(n.mobile_number) ? n.mobile_number : void 0, o = {};
    g(r) && r.length > 0 && (o.email = r), g(s) && s.length > 0 && (o.mobile_number = s);
    const a = {}, c = this.allowCustomUserAttributes(this.config), l = this.getAllowedUserAttributeKeys(this.config);
    this.mergeLeadCaptureUserAttributes(
      a,
      b(n.userAttributes) ? n.userAttributes : null,
      c,
      l
    );
    const u = g(n.rclid) ? n.rclid : void 0;
    u && u.length > 0 && (a.rokt_rclid = u);
    const d = g(n.accountID) ? n.accountID : void 0;
    d && d.length > 0 && (a.rokt_account_id = d);
    const p = g(n.referralCreativeID) ? n.referralCreativeID : void 0;
    return p && p.length > 0 && (a.rokt_referral_creative_id = p), { identities: o, userAttributes: a };
  }
  isSafeLeadCaptureUserAttributeKey(e) {
    return e === "__proto__" || e === "constructor" || e === "prototype" ? !1 : /^[a-zA-Z0-9_.-]+$/.test(e);
  }
  isSupportedLeadCaptureUserAttributeValue(e) {
    return g(e) || typeof e == "number" || typeof e == "boolean" ? !0 : Array.isArray(e) ? e.every((i) => g(i)) : !1;
  }
  mergeLeadCaptureUserAttributes(e, i, n, r) {
    if (i)
      for (const [s, o] of Object.entries(i))
        !n || !r.has(s) || this.isSafeLeadCaptureUserAttributeKey(s) && this.isSupportedLeadCaptureUserAttributeValue(o) && (e[s] = o);
  }
}
const F = "Rokt", eo = 7, Ke = 181, to = "selectPlacements", io = "Auto Button Click", no = "Auto Link Click", Ai = "rokt_placement", ro = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/, so = 500, oo = "apps.roktecommerce.com", ao = 0.1, co = "ThankYouPageJourney", lo = "rokt-launcher", uo = "rokt-thank-you-element", fo = "userIdentifiedInWorkspace", vi = 3, go = 2, po = "page_events", mo = "page_view_attributes", ho = "mparticle_session_id", bi = "mparticle_device_id", ot = "exit-intent", _o = [
  "3479519924056514560",
  "3484183287406608384",
  "3198447216177237634",
  "3292347205549055462"
], Eo = "exit-intent-placement", Pi = 500, Bt = {
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  UNHANDLED_EXCEPTION: "UNHANDLED_EXCEPTION",
  IDENTITY_REQUEST: "IDENTITY_REQUEST",
  LOG_DELIVERY_FAILURE: "LOG_DELIVERY_FAILURE"
}, Ae = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARNING: "WARNING"
}, yo = "apps.rokt-api.com", Io = "/v1/log", Ao = "/v1/errors", vo = 10;
function f() {
  return window.mParticle;
}
function wi(t, e) {
  const n = [et(t), "/wsdk/integrations/launcher.js"].join("");
  return !e || e.length === 0 ? n : n + "?extensions=" + e.join(",");
}
function Ti(t) {
  return [et(t), "/rokt-elements/rokt-element-thank-you.js"].join("");
}
function et(t) {
  const e = t !== void 0 ? t : yo;
  return e.includes("://") ? e.replace(/\/+$/, "") : ["https://", e].join("");
}
function Rn(t, e, i) {
  if (t)
    return t.startsWith("http://") || t.startsWith("https://") ? t : "https://" + t;
  const r = e?.includes("://") && !/^https?:\/\//i.test(e) ? void 0 : e;
  return et(r) + i;
}
function Si(t, e, i) {
  if (document.getElementById(t)) return;
  const n = document.head || document.body, r = document.createElement("script");
  r.id = t, r.type = "text/javascript", r.src = e, r.async = !0, r.crossOrigin = "anonymous", r.fetchPriority = "high", i?.onLoad && (r.onload = i.onLoad), i?.onError && (r.onerror = i.onError), n.appendChild(r);
}
function Ue(t) {
  if (!t)
    return [];
  const e = Fi(t);
  return e === void 0 ? (console.error("Settings string contains invalid JSON"), []) : e;
}
function ki(t) {
  const e = t ? Ue(t) : [], i = [], n = [];
  let r = !1;
  for (let s = 0; s < e.length; s++) {
    const o = e[s].value;
    o === "thank-you-journey" ? (r = !0, n.push(co)) : i.push(o);
  }
  return {
    roktExtensionsQueryParams: i,
    legacyRoktExtensions: n,
    loadThankYouElement: r
  };
}
async function bo(t, e) {
  const i = [];
  if (e)
    for (const n of t)
      i.push(e.use(n));
  return Promise.all(i);
}
function Li(t) {
  if (!t)
    return {};
  const e = {};
  for (let i = 0; i < t.length; i++) {
    const n = t[i];
    e[n.jsmap] = n.value;
  }
  return e;
}
function Ci(t) {
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
function Di(t, e, i) {
  return f().generateHash([t, e, i].join(""));
}
function Po(t) {
  let n = "mParticle_wsdkv_" + f().getVersion() + "_kitv_" + "3.29.1";
  return t && (n += "_" + t), n;
}
function Ri(t) {
  return !!(t && _o.includes(t));
}
function bt(t) {
  const e = document.createElement("iframe");
  e.style.display = "none", e.setAttribute("sandbox", "allow-scripts allow-same-origin"), e.src = t, e.onload = function() {
    e.onload = null, e.parentNode && e.parentNode.removeChild(e);
  };
  const i = document.body || document.head;
  i && i.appendChild(e);
}
function Oi(t, e) {
  const i = J(window.location.origin);
  if (me._allowedOriginHashes.indexOf(i) === -1 || Math.random() >= ao)
    return;
  const r = window.__rokt_li_guid__;
  if (!r || t && t.includes("://") && !/^https:\/\//i.test(t))
    return;
  const s = Pt(window.location.href), o = "version=" + encodeURIComponent(e ?? "") + "&launcherInstanceGuid=" + encodeURIComponent(r) + "&pageUrl=" + encodeURIComponent(s), a = t ? et(t) : "https://apps.rokt.com";
  bt(a + "/v1/wsdk-init/index.html?" + o), bt(
    "https://" + oo + "/v1/wsdk-init/index.html?" + o + "&isControl=true"
  );
}
function wo() {
  return typeof window < "u" && !!window.location?.search?.toLowerCase().includes("mp_enable_logging=true");
}
function To() {
  if (typeof window > "u")
    return;
  const t = window.location?.href;
  return t ? Pt(t) : void 0;
}
function So() {
  return typeof window < "u" ? window.navigator?.userAgent : void 0;
}
class On {
  constructor() {
    this._logCount = {};
  }
  incrementAndCheck(e) {
    const n = (this._logCount[e] || 0) + 1;
    return this._logCount[e] = n, n > vo;
  }
}
class ve {
  constructor(e, i, n, r, s) {
    this._reporter = "mp-wsdk";
    const o = e.isLoggingEnabled;
    this._integrationName = i || "", this._launcherInstanceGuid = n, this._accountId = r || null, this._rateLimiter = s || new On(), this._isEnabled = wo() || o;
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
          code: r || Bt.UNKNOWN_ERROR,
          url: To(),
          deviceInfo: So(),
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
class Ki {
  constructor(e, i, n, r, s) {
    this._transport = new ve(e, i, n, r, s), this._errorUrl = Rn(e?.errorUrl, e?.integrationDomain, Ao);
  }
  report(e) {
    if (!e) return;
    const i = e.severity || Ae.ERROR;
    this._transport.send(this._errorUrl, i, e.message, e.code, e.stackTrace);
  }
}
class Ui {
  constructor(e, i, n, r, s, o) {
    this._intentObserveLines = 0, this._transport = new ve(e, n, r, s, o), this._placementDiagnosticTransport = new ve(
      e,
      n,
      r,
      s
    ), this._preselectOutcomeTransport = new ve(e, n, r, s), this._loggingUrl = Rn(e?.loggingUrl, e?.integrationDomain, Io), this._errorReportingService = i;
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
      Ae.INFO,
      i.message,
      i.code,
      void 0,
      (n) => {
        if (this._errorReportingService) {
          const r = typeof n.statusCode == "number";
          this._errorReportingService.report({
            message: "LoggingService: Failed to send log: " + n.message,
            code: Bt.LOG_DELIVERY_FAILURE,
            severity: r ? Ae.ERROR : Ae.WARNING
          });
        }
      }
    );
  }
}
function ko(t, e) {
  const i = Ne(window.location.href), n = t.EventAttributes?.title, r = g(n) ? n : void 0, s = ji(t.EventAttributes, e) ? r : r || document.title, o = Bn(), a = t.ActiveTimeOnSite;
  return {
    pageUrl: i,
    sourceMessageId: t.SourceMessageId,
    timestamp: t.Timestamp,
    ...s ? { pageTitle: s } : {},
    ...o !== void 0 ? { canonicalUrl: o } : {},
    ...Number.isFinite(a) ? { activeTimeOnSite: a } : {}
  };
}
const q = class q {
  constructor() {
    this.name = F, this.id = Ke, this.moduleId = Ke, this.isInitialized = !1, this.launcher = null, this.filters = {}, this.userAttributes = {}, this.userIdentifiedInWorkspace = !1, this.testHelpers = null, this.placementEventMappingLookup = {}, this.placementEventAttributeMappingLookup = {}, this.integrationName = null, this.errorReportingService = null, this.loggingService = null, this._thankYouElementOnLoadCallback = null, this._isThankYouElementLoaded = !1, this._workspaceSearchInFlightPromise = null, this._launcherAttachState = Ys(), this._exitIntentConfig = null, this._exitIntentWatcher = new Zs({
      isKitReady: () => this.isKitReady(),
      onExitIntent: (e, i) => this.handleExitIntent(e, i),
      onLeadCaptureSubmitted: (e) => this.applyIdentityCapturePayload(e.identities, e.userAttributes)
    }), this._exitIntentEnabledForAccount = !1, this._pendingInitWarnings = [], this.accountId = null, this._preselectState = As();
  }
  // ---- Private helpers ----
  getEventAttributeValue(e, i) {
    const n = e && e.EventAttributes;
    if (!n)
      return null;
    const r = S(n, i);
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
      if (k(s))
        continue;
      let o = !0;
      for (let a = 0; a < s.length; a++)
        if (!this.doesEventMatchRule(e, s[a])) {
          o = !1;
          break;
        }
      o && f().Rokt.setLocalSessionAttribute?.(r, !0);
    }
  }
  capturePageView(e, i) {
    let n;
    try {
      n = Pt(window.location.href);
      const r = ni(), s = ko(e, i);
      r.push(s);
      const o = Math.min(r.length, $i), a = jn(r);
      if (a === 0) {
        const c = at() ? "quota" : "ls_unavailable";
        this.loggingService?.log({
          message: `Rokt Kit: Failed to persist page view for ${n} [reason: ${c}]`,
          code: "PAGE_VIEW_CAPTURE_FAILED"
        });
      } else a < o && this.loggingService?.log({
        message: `Rokt Kit: Page view storage reduced from ${o} to ${a} record(s) under quota pressure [reason: quota_eviction]`,
        code: "PAGE_VIEW_QUOTA_EVICTION"
      });
    } catch (r) {
      const s = at() ? "exception" : "ls_unavailable", o = r instanceof Error ? r.message : String(r);
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
      return Pe(this.accountId, e);
  }
  // What the speculative call fills in over these attributes, the ones it was fired with. An identity the call
  // carries already holds its key, so a default never stands in for it.
  buildPreselectAttributeDefaults(e, i) {
    if (!this.isPreselectionEnabled())
      return;
    const n = Pe(this.accountId, e);
    if (!n)
      return;
    const r = Xe(this.buildPreselectHost(), n, i), s = this.filters || {};
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
      getCurrentUser: () => f().Identity?.getCurrentUser?.(),
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
    Vs(this._preselectState, this.buildPreselectHost());
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
    return !f().Rokt || typeof f().Rokt.getLocalSessionAttributes != "function" ? {} : f().Rokt.getLocalSessionAttributes();
  }
  replaceOtherIdentityWithEmailsha256(e) {
    const i = { ...e || {} }, n = this._mappedEmailSha256Key;
    return n && e[n] && (i[q.EMAIL_SHA256_KEY] = e[n]), n && delete i[n], i;
  }
  logSelectPlacementsEvent(e) {
    if (!window.mParticle || typeof f().logEvent != "function" || !b(e))
      return;
    const i = f().EventType.Other;
    f().logEvent(to, i, e);
  }
  setRoktSessionId(e) {
    if (!(!e || typeof e != "string"))
      try {
        const i = f().getInstance();
        i && $(i.setIntegrationAttribute) && i.setIntegrationAttribute(Ke, {
          roktSessionId: e
        });
      } catch {
      }
  }
  readMpSessionId() {
    const e = f()?.sessionManager, i = e?.getSessionId ?? e?.getSession;
    if ($(i))
      return i.call(e) || void 0;
  }
  readMpDeviceId() {
    if (!this.isDeviceIdDisabled())
      return f()?.getDeviceId?.() || void 0;
  }
  attachLauncher(e, i, n = []) {
    Bs(this._launcherAttachState, {
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
      await bo([...n], o), this.initRoktLauncher(o);
    }).catch((o) => {
      const a = this._launcherAttachState.lifecycle === "attached";
      if (qs(this._launcherAttachState), !a) {
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
    return Qs(
      this._launcherAttachState,
      this.isLauncherReadyToAttach(),
      (e) => this.attachLauncher(e.accountId, e.launcherOptions, e.legacyRoktExtensions)
    );
  }
  initRoktLauncher(e) {
    window.Rokt && (window.Rokt.currentLauncher = e), this.launcher = e, zs(this._launcherAttachState);
    const i = f().Rokt?.filters;
    i ? (!this.isInitialized && this.filters.filteredUser && (i.filteredUser = this.filters.filteredUser), this.filters = i, i.filteredUser ? this._workspaceSearchInFlightPromise = this.search(i.filteredUser) : console.warn("Rokt Kit: No filtered user has been set.")) : console.warn("Rokt Kit: No filters have been set."), this.isInitialized = !0, Oi(this.domain, this.integrationName), f().Rokt.attachKit(this), this.pushExitIntentExtensionConfig(), this.flushPendingPreselectDispatches();
  }
  // Leaving the hook unset is what keeps History unpatched for workspaces that never
  // preselect. The core SDK reads onCheckoutIntent when it has a signal, so an account without
  // pre-selection entries never hears one.
  armPreselectPathnameTrigger() {
    rt(window.location.pathname), this.onRouteChange = Ie(this.accountId) ? () => this.evaluatePreselectPathname() : void 0, this.armPreselectEmailInputListener(), this.onCheckoutIntent = Ie(this.accountId) ? (e) => {
      try {
        es(this._preselectState, this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0, this.onPaymentPick = Ie(this.accountId) ? (e) => {
      try {
        ss(this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0;
  }
  // A guest often types their email after the trigger page view has queued for want of one, so a
  // committed email input retries the queue. Only accounts with an entry that reads the form listen.
  armPreselectEmailInputListener() {
    this._preselectEmailInputListener && (document.removeEventListener("input", this._preselectEmailInputListener, !0), document.removeEventListener("change", this._preselectEmailInputListener, !0), this._preselectEmailInputListener = void 0), Cs(this.accountId) && (this._preselectEmailInputListener = (e) => {
      It(e), e.type === "change" && this._preselectState.pending.length > 0 && Ls(this._preselectState, this.buildPreselectHost(), e) && this.flushPendingPreselectDispatches();
    }, document.addEventListener("input", this._preselectEmailInputListener, !0), document.addEventListener("change", this._preselectEmailInputListener, !0));
  }
  // A core released without the check reads false, so its page views are judged by their marker alone.
  isAutoLogPageViewOn() {
    const e = f().Rokt;
    try {
      return $(e?.isAutoLogPageViewEnabled) && e.isAutoLogPageViewEnabled() === !0;
    } catch {
      return !1;
    }
  }
  // True while the core SDK says the confirm click can be waited for: auto button tracking is on, no
  // opt-out or privacy option suppresses it, and the browser supports the detector. A core released
  // without the check reads false, so its entries keep dispatchDelayMs.
  isCheckoutIntentActive() {
    const e = f().Rokt;
    try {
      return $(e?.isCheckoutIntentLive) && e.isCheckoutIntentLive() === !0;
    } catch {
      return !1;
    }
  }
  // True when the core SDK gives link clicks no checkout intent because this connection does not receive Auto Link
  // Click events. A core released without the check reads false, and turns intent off entirely in that case.
  isLinkIntentWithheld() {
    const e = f().Rokt;
    try {
      return $(e?.areAutoLinkClicksForwarded) && e.areAutoLinkClicksForwarded() === !1;
    } catch {
      return !1;
    }
  }
  // Core gates every kit callback on opt-out and consent, but a DOM listener is called by the browser
  // directly, so it checks both itself.
  isForwardingAllowed() {
    return f().getInstance?.()?._Store?.isEnabled !== !1 && f()._getActiveForwarders().some((i) => i === this);
  }
  // A call carrying a form email can wait on identity search or launcher setup. A skipped one costs only
  // the cached hit, so it goes out only if nothing changed: same user, still allowed, and no partner
  // email has appeared, filtered or not.
  getFormEmailDropCause(e, i) {
    if (!this.isForwardingAllowed()) return "forwarding_disallowed";
    if (this.isTargetingDisabled() || !this.isPreselectionPrivacyAllowed()) return "privacy_signal";
    if (String(this.filters?.filteredUser?.getMPID?.() ?? "") !== String(i ?? "")) return "user_changed";
    if (xt(this.buildPreselectHost(), e)) return "partner_email";
  }
  // Whether this connection filters out the Email identity, or the identity mapped to the hashed email.
  isEmailIdentityFiltered() {
    const e = this.userIdentityFilters || [];
    if (e.includes(eo))
      return !0;
    const i = this._mappedEmailSha256Key, n = f().IdentityType || {}, r = i ? Object.keys(n).find((o) => o.toLowerCase() === i) : void 0, s = r ? n[r] : void 0;
    return typeof s == "number" && e.includes(s);
  }
  evaluatePreselectPathname() {
    const e = window.location.pathname;
    rt(e), e !== this._lastPreselectPathname && (this.isTargetingDisabled() || (this._lastPreselectPathname = e, ps(this._preselectState, this.buildPreselectHost(), e), Ei(this._preselectState, this.buildPreselectHost(), e)));
  }
  fetchOptimizely() {
    const e = f()._getActiveForwarders().filter((i) => i.name === "Optimizely");
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
    return f().Rokt?.launcherOptions?.noTargeting === !0 || this.isDeviceIdDisabled();
  }
  // Core's normalizeRoktLauncherOptions turns noDeviceId or noDeviceID into noDeviceId, noFunctional and
  // noTargeting, but an older core passes either spelling through as written, so the kit applies the same rule.
  isDeviceIdDisabled() {
    const e = f()?.Rokt?.launcherOptions;
    return e?.noDeviceId === !0 || e?.noDeviceID === !0;
  }
  isPreselectionPrivacyAllowed() {
    return f().Rokt?.launcherOptions?.doNotShareOrSell !== !0 && navigator.globalPrivacyControl !== !0;
  }
  isPageHistoryAllowed() {
    return !this.isTargetingDisabled() && this.isPreselectionPrivacyAllowed();
  }
  isPartnerInLocalLauncherTestGroup() {
    return !!(f().config && f().config.isLocalLauncherEnabled && this.isAssignedToSampleGroup());
  }
  isAssignedToSampleGroup() {
    return Math.random() > 0.5;
  }
  getEffectiveExitIntentConfig(e) {
    return Ri(e) ? {
      identifier: Eo,
      signals: {
        mouseExitTop: !0,
        scrollUpFast: !0,
        idle: !0
      }
    } : null;
  }
  applyExitIntentExtensionOverride(e, i) {
    return e ? i.includes(ot) ? i : [...i, ot] : i;
  }
  extractExitIntentIdentifier(e) {
    return e ? g(e.identifier) && e.identifier.length > 0 ? e.identifier : g(e.placementIdentifier) && e.placementIdentifier.length > 0 ? e.placementIdentifier : null : null;
  }
  applyIdentityCapturePayload(e, i) {
    const n = {}, r = e.email;
    g(r) && r.length > 0 && (n.email = r);
    const s = e.mobile_number;
    g(s) && s.length > 0 && (n.mobile_number = s);
    const o = f().Identity?.modify;
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
    const a = f().Identity?.getCurrentUser?.();
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
      const r = f().Rokt?.selectPlacements?.({
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
    !this._exitIntentConfig || !$(window.Rokt?.setExtensionData) || window.Rokt.setExtensionData({
      [ot]: this._exitIntentConfig
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
    const o = f().Rokt?.launcherOptions?.noFunctional === !0 || this.isDeviceIdDisabled();
    Mn(o), o || this.isTargetingDisabled() ? Vn() : (ar(), ur()), this.isPageHistoryAllowed() || (it(), nt());
    const a = e, c = a.accountId;
    this._exitIntentEnabledForAccount = Ri(c);
    const l = this._exitIntentEnabledForAccount ? this.getEffectiveExitIntentConfig(c) : null;
    this._exitIntentEnabledForAccount ? this.configureExitIntentBridge(l) : this.configureExitIntentBridge(null), this.accountId = c || null;
    const u = this.accountId ? jr(this.accountId, a.preselectionConfig) : void 0;
    this.userAttributes = te(s), this.armPreselectPathnameTrigger(), this._onboardingExpProvider = a.onboardingExpProvider;
    const d = Ue(a.placementEventMapping);
    this.placementEventMappingLookup = Li(d);
    const p = Ue(
      a.placementEventAttributeMapping
    );
    this.placementEventAttributeMappingLookup = Ci(p), a.hashedEmailUserIdentityType && (this._mappedEmailSha256Key = a.hashedEmailUserIdentityType.toLowerCase()), this._workspaceIdSyncApiKey = g(a.workspaceIdSyncApiKey) ? a.workspaceIdSyncApiKey : void 0;
    const m = f().Rokt?.domain, { roktExtensionsQueryParams: v, legacyRoktExtensions: E, loadThankYouElement: y } = ki(
      a.roktExtensions
    ), h = this.applyExitIntentExtensionOverride(
      l,
      v
    ), _ = {
      ...f().Rokt?.launcherOptions || {}
    };
    this.integrationName = Po(_.integrationName), _.integrationName = this.integrationName, this.domain = m;
    const A = {
      loggingUrl: a.loggingUrl,
      errorUrl: a.errorUrl,
      integrationDomain: m,
      isLoggingEnabled: f().config?.isLoggingEnabled === !0
    }, P = new Ki(
      A,
      this.integrationName,
      window.__rokt_li_guid__,
      a.accountId
    ), U = new Ui(
      A,
      P,
      this.integrationName,
      window.__rokt_li_guid__,
      a.accountId
    );
    return this.errorReportingService = P, this.loggingService = U, this._flushInitWarnings(), u && U.log({
      message: `Rokt Kit: preselectionConfig setting is invalid [reason=${u}], using the built-in preselection config`,
      code: "PRESELECT_CONFIG_INVALID"
    }), f()._registerErrorReportingService && f()._registerErrorReportingService(P), f()._registerLoggingService && f()._registerLoggingService(U), n ? (this.testHelpers = {
      generateLauncherScript: wi,
      generateThankYouElementScript: Ti,
      extractRoktExtensionConfig: ki,
      hashEventMessage: Di,
      parseSettingsString: Ue,
      generateMappedEventLookup: Li,
      generateMappedEventAttributeLookup: Ci,
      sendAdBlockMeasurementSignals: Oi,
      createAutoRemovedIframe: bt,
      djb2: J,
      setAllowedOriginHashes: (L) => {
        q._allowedOriginHashes = L;
      },
      ReportingTransport: ve,
      ErrorReportingService: Ki,
      LoggingService: Ui,
      RateLimiter: On,
      ErrorCodes: Bt,
      WSDKErrorSeverity: Ae,
      resetLauncherAttachState: () => Js(this._launcherAttachState)
    }, this.attachLauncher(c, _), "Successfully initialized: " + F) : (y && (f().Rokt.flushOnShoppableAdsReadyMessageQueue?.(this), Si(uo, Ti(m), {
      onLoad: () => {
        this._isThankYouElementLoaded = !0, this._thankYouElementOnLoadCallback && this._thankYouElementOnLoadCallback();
      },
      onError: (L) => {
        console.error("Error loading Rokt Thank You Element script:", L);
      }
    })), this.isLauncherReadyToAttach() ? this.attachLauncher(c, _, E) : (Si(lo, wi(m, h), {
      onLoad: () => {
        this.isLauncherReadyToAttach() ? this.attachLauncher(c, _, E) : console.error("Rokt object is not available after script load.");
      },
      onError: (L) => {
        console.error("Error loading Rokt launcher script:", L);
      }
    }), this.captureTiming(q.PERFORMANCE_MARKS.RoktScriptAppended)), "Successfully initialized: " + F);
  }
  process(e) {
    if (e.EventDataType === vi && rt(window.location.pathname), !this.isTargetingDisabled()) {
      if (e.EventDataType === vi) {
        if (this._exitIntentEnabledForAccount && this._exitIntentWatcher.resetPageViewState(), this.isPageHistoryAllowed()) {
          const i = this.isAutoLogPageViewOn();
          Gn(this.loggingService, e.EventAttributes, i), this.capturePageView(e, i);
        } else
          it(), nt();
        pe(this._preselectState, this.buildPreselectHost(), e), Ei(this._preselectState, this.buildPreselectHost());
      }
      xe(e) && rs(this.buildPreselectHost(), e), ms(this.accountId, e.EventName) && ys(this._preselectState, this.buildPreselectHost(), e);
    }
    if (e.EventDataType === go && (it(), nt(), Ft(this._preselectState), this.accountId && (ie(this.accountId), ri(this.accountId), ai(this.accountId))), !this.isKitReady())
      return "Kit not ready for forwarder: " + F;
    if ($(f().Rokt?.setLocalSessionAttribute) && !xe(e) && (k(this.placementEventAttributeMappingLookup) || this.applyPlacementEventAttributeMapping(e), !k(this.placementEventMappingLookup))) {
      const i = Di(e.EventDataType, e.EventCategory, e.EventName ?? "");
      this.placementEventMappingLookup[String(i)] && f().Rokt.setLocalSessionAttribute?.(this.placementEventMappingLookup[String(i)], !0);
    }
    return "Successfully sent to forwarder: " + F;
  }
  setExtensionData(e) {
    if (!this.isKitReady()) {
      console.error("Rokt Kit: Not initialized");
      return;
    }
    window.Rokt.setExtensionData(e);
  }
  setUserAttribute(e, i) {
    Ni(e) || (this.userAttributes[e] = i);
    const n = hi(this.accountId, e);
    return n && this.forgetCartAdd(), (Is(this.accountId, e) || Ce(e, this._mappedEmailSha256Key) || n) && this.flushPendingPreselectDispatches(), "Successfully set user attribute for forwarder: " + F;
  }
  // The page's cart attribute or a logout replaces a remembered add-to-cart click. Under noTargeting, or for an account
  // that never remembers one, nothing is written to the device.
  forgetCartAdd() {
    this.accountId && Cr(this.accountId, !this.isTargetingDisabled() && xs(this.accountId));
  }
  removeUserAttribute(e) {
    return delete this.userAttributes[e], hi(this.accountId, e) && this.forgetCartAdd(), "Successfully removed user attribute for forwarder: " + F;
  }
  handleIdentityComplete(e, i) {
    return this.userAttributes = te(e.getAllUserAttributes()), "Successfully called " + i + " for forwarder: " + F;
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
    return this.userIdentifiedInWorkspace = !1, this._workspaceSearchInFlightPromise = null, this._workspaceLastSearchedIdentitiesKey = void 0, this.accountId && (ie(this.accountId), ri(this.accountId), ai(this.accountId), this.forgetCartAdd()), this.handleIdentityComplete(e, "onLogoutComplete");
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
        new Promise((s) => setTimeout(s, Pi))
      ]) : Promise.resolve();
      return Promise.all([i, r]).then(
        () => this._dispatchPlacements(e)
      );
    }
    if (this._workspaceSearchInFlightPromise) {
      const n = this._workspaceSearchInFlightPromise;
      return Promise.race([
        n,
        new Promise((r) => setTimeout(r, Pi))
      ]).then(() => this._dispatchPlacements(e));
    }
    return this._dispatchPlacements(e);
  }
  // What a pre-selection call with these attributes would send, mirroring _dispatchPlacements: identities,
  // then the cached user attributes merged in, filtered and overridden for the target page, then the
  // session attributes, so a later source wins as it does on the wire.
  getOutgoingPreselectAttributes(e, i) {
    const n = { ...te(this.userAttributes), ...e }, r = this.filters || {}, s = r.filterUserAttributes ? r.filterUserAttributes(n, r.userAttributeFilters || []) : n, o = this.returnUserIdentities(r.filteredUser || null), a = _i(
      this.accountId,
      i ? ht(s, this.buildPreselectAttributeDefaults(i, e)) : s,
      this.findCacheConfigEntry(i)
    );
    return {
      ...o,
      ...a,
      ...this.returnLocalSessionAttributes()
    };
  }
  _dispatchPlacements(e) {
    const i = e ? Ds(e) : void 0;
    if (e?.preselect === !0 && !Gt(this.buildPreselectHost())) {
      i?.();
      return;
    }
    const n = e?.[Ve], r = e?.[mt], s = { ...e };
    if (delete s[Ve], delete s[mt], e = s, r !== void 0) {
      const X = b(r) ? r : {}, Ee = String(X.mpid ?? ""), Zt = X.requireLogin !== !1, ei = f().Identity?.getCurrentUser?.();
      if (Ee === "" || String(this.filters?.filteredUser?.getMPID?.() ?? "") !== Ee || String(ei?.getMPID?.() ?? "") !== Ee || Zt && ei?.isLoggedIn?.() !== !0) {
        this.loggingService?.logPlacementDiagnostic(
          w("missed", Zt ? "logged_in_dropped" : "user_changed_dropped")
        ), i?.();
        return;
      }
    }
    const o = b(n) ? n : void 0, a = o && g(o.key) ? o.key : void 0;
    if (a) {
      const X = this.getFormEmailDropCause(a, o.mpid);
      if (X) {
        this.loggingService?.logPlacementDiagnostic(
          w("missed", "form_email_dropped", { cause: X })
        ), i?.();
        return;
      }
    }
    const c = e.attributes || {}, l = te(this.userAttributes), u = { ...l, ...c }, d = this.filters || {}, p = d.userAttributeFilters || [], m = d.filteredUser || null, v = m ? m.getMPID() : null;
    let E;
    d ? d.filterUserAttributes ? E = d.filterUserAttributes(u, p) : E = u : (console.warn("Rokt Kit: No filters available, using user attributes"), E = u);
    const y = te(E);
    a && (Object.prototype.hasOwnProperty.call(l, a) ? y[a] = l[a] : delete y[a]), this.userAttributes = y;
    const h = this._onboardingExpProvider === "Optimizely" ? this.fetchOptimizely() : {}, _ = this.returnUserIdentities(m), A = this.returnLocalSessionAttributes(), P = this.isPageHistoryAllowed(), U = P ? Hn(ni()) : [], L = P ? Yn() : null, j = this.readMpSessionId(), D = this.readMpDeviceId(), H = typeof e.identifier == "string" ? e.identifier : void 0, z = this.findCacheConfigEntry(H), se = e.preselect === !0 ? this.buildPreselectAttributeDefaults(H, c) : void 0, B = e.preselect === !0 ? _i(
      this.accountId,
      ht(E, se),
      z
    ) : E, G = {
      ..._,
      ...B,
      ...h,
      ...A,
      ...U.length ? { [po]: JSON.stringify(U) } : {},
      ...L ? { [mo]: L } : {},
      ...this.userIdentifiedInWorkspace ? { [fo]: !0 } : {},
      ...j ? { [ho]: j } : {},
      ...D ? { [bi]: D } : {},
      mpid: v
    };
    this.isDeviceIdDisabled() && delete G[bi], e.preselect !== !0 && $s(this.buildPreselectHost(), H, G);
    const tt = B[gn];
    if (e.preselect === !0 && g(tt) && (tt.indexOf("intent_") === 0 || tt.indexOf("pageview_cart|") === 0) && !Oe(G, this._mappedEmailSha256Key)) {
      this.loggingService?.logPlacementDiagnostic(
        w("missed", "no_strict_email", { cause: "lost_before_dispatch" })
      ), i?.();
      return;
    }
    const zt = fs(
      z,
      se,
      G
    ), Xt = gs(z, se, G);
    delete G[ci];
    const qt = hn(se, G);
    qt && (G[ci] = qt);
    const Kn = {
      ...e,
      attributes: G,
      ...z ? { cacheMatchKeys: _n(z) } : {},
      ...zt ? { cacheIdentityKeys: zt } : {},
      ...Xt ? { cacheMatchValues: Xt } : {}
    }, Jt = this.launcher.selectPlacements(Kn), Qt = e.preselect === !0, Un = () => {
      Qt || this.logSelectPlacementsEvent(G);
    };
    return Promise.resolve(Jt).then((X) => {
      if (!Qt)
        return this.trackPlacementEngagement(X), X?.context?.sessionId?.then((Ee) => this.setRoktSessionId(Ee));
    }).catch(() => {
    }).finally(Un), Jt;
  }
  // Logs each press of a placement's response buttons, and each close, as an auto button click. The
  // placement's frame keeps its buttons and text from the page, so only the response kind goes out.
  trackPlacementEngagement(e) {
    if (!e || !$(e.on))
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
        so
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
        typeof a == "string" && a.length <= 253 && ro.test(a.toLowerCase()) ? a.toLowerCase() : void 0
      );
    });
  }
  // Checked when each click is logged, since the launcher calls back outside core's own gates.
  canLogPlacementClick() {
    return this.isCheckoutIntentActive() && this.isForwardingAllowed() && $(f().logEvent);
  }
  logPlacementEngagement(e, i) {
    this.canLogPlacementClick() && f().logEvent(io, f().EventType.Other, {
      is_auto_button_click: !0,
      is_rokt_placement_click: !0,
      element: "button",
      type: "button",
      label_source: Ai,
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
      label_source: Ai,
      hostname: window.location.hostname,
      link_type: "external",
      rokt_placement_id: e
    };
    i && (n.link_domain = i), f().logEvent(no, f().EventType.Other, n);
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
    return this.isKitReady() ? (Xs(this._launcherAttachState), this.launcher.terminate()) : (console.error("Rokt Kit: Not initialized"), Promise.resolve());
  }
  /**
   * Registers a callback to be invoked once rokt-thank-you-element.js becomes available.
   */
  onShoppableAdsReady(e) {
    this._isThankYouElementLoaded ? e() : this._thankYouElementOnLoadCallback = e;
  }
};
q._allowedOriginHashes = [-553112570, 549508659], q.PERFORMANCE_MARKS = {
  RoktScriptAppended: "mp:RoktScriptAppended"
}, q.EMAIL_SHA256_KEY = "emailsha256";
let me = q;
function Lo() {
  return Ke;
}
function Co(t) {
  if (!t) {
    window.console.log("You must pass a config object to register the kit " + F);
    return;
  }
  if (!b(t)) {
    window.console.log("'config' must be an object. You passed in a " + typeof t);
    return;
  }
  b(t.kits) ? t.kits[F] = {
    constructor: me
  } : (t.kits = {}, t.kits[F] = {
    constructor: me
  }), window.console.log("Successfully registered " + F + " to your mParticle configuration");
}
typeof window < "u" && window.mParticle && f().addForwarder && f().addForwarder({
  name: F,
  constructor: me,
  getId: Lo
});
export {
  Co as register
};
//# sourceMappingURL=Rokt-Kit.esm.js.map
