const ir = [
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
], nr = new Set(ir);
function Ft(t) {
  return nr.has(t.toLowerCase());
}
function se(t) {
  const e = {}, i = t || {}, n = Object.keys(i);
  for (let r = 0; r < n.length; r++) {
    const s = n[r];
    Ft(s) || (e[s] = i[s]);
  }
  return e;
}
function E(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function g(t) {
  return typeof t == "string";
}
function G(t) {
  return typeof t == "function";
}
function Xi(t) {
  try {
    return JSON.parse(t.replace(/&quot;/g, '"'));
  } catch {
    return;
  }
}
function T(t) {
  return t == null ? !0 : typeof t == "string" ? t.length === 0 : typeof t == "object" ? Object.keys(t).length === 0 : !1;
}
function k(t, e) {
  return Object.prototype.hasOwnProperty.call(t, e) ? t[e] : void 0;
}
function $e(t) {
  const e = qi(), i = e ? e(t, "full") : t, n = i.indexOf("#"), r = n === -1 ? "" : i.slice(n);
  return (n === -1 ? i : i.slice(0, n)).split("?")[0] + r.split("?")[0];
}
function Mt(t) {
  const e = qi();
  return e ? e(t, "report") : t.split(/[?#]/)[0];
}
function qi() {
  const t = window.mParticle;
  return t && typeof t._cleanUrl == "function" ? t._cleanUrl : void 0;
}
function ee(t) {
  let e = 5381;
  for (let i = 0; i < t.length; i++)
    e = (e << 5) + e + t.charCodeAt(i), e = e & e;
  return e;
}
const I = "mp-rokt-kit", pi = "__rokt_ls_probe__";
function hi() {
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
let ge = null;
function rr(t) {
  t ? ge || (ge = { local: hi(), session: hi() }) : ge = null;
}
function sr() {
  return ge !== null;
}
const ie = () => ge?.local ?? window.localStorage, N = () => ge?.session ?? window.sessionStorage;
function It() {
  try {
    const t = ie();
    return t.setItem(pi, "1"), t.removeItem(pi), !0;
  } catch {
    return !1;
  }
}
function Ze(t, e = ie) {
  try {
    const i = e().getItem(t);
    return i === null ? null : JSON.parse(i);
  } catch {
    return null;
  }
}
function Ji(t, e, i = ie) {
  try {
    return i().setItem(t, JSON.stringify(e)), !0;
  } catch {
    return !1;
  }
}
function At(t, e = ie) {
  try {
    e().removeItem(t);
  } catch {
  }
}
function or() {
  At(I, () => window.localStorage), At(I, () => window.sessionStorage);
}
function j(t, e, i = ie) {
  const n = Ze(t, i);
  return E(n) ? n[e] : void 0;
}
function Y(t, e, i, n = ie) {
  const r = Ze(t, n), s = E(r) ? { ...r } : {};
  return s[e] = i, Ji(t, s, n);
}
function Qi(t, e, i) {
  Object.keys(e).length === 0 ? At(t, i) : Ji(t, e, i);
}
function ne(t, e, i = ie) {
  const n = Ze(t, i);
  if (!E(n) || !(e in n))
    return;
  const r = { ...n };
  delete r[e], Qi(t, r, i);
}
function pe(t, e, i = ie) {
  const n = Ze(t, i);
  if (!E(n))
    return;
  const r = Object.keys(n).filter((o) => o.startsWith(e));
  if (r.length === 0)
    return;
  const s = { ...n };
  r.forEach((o) => delete s[o]), Qi(t, s, i);
}
const xt = "pageViews", Ge = "utmParams", Zi = 25, ar = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
function en(t) {
  return t.slice(-Zi);
}
function mi() {
  const t = j(I, xt);
  return Array.isArray(t) ? t.filter(E).map(cr) : [];
}
function cr(t) {
  return {
    ...t,
    ...g(t.pageUrl) ? { pageUrl: $e(t.pageUrl) } : {},
    ...g(t.canonicalUrl) ? { canonicalUrl: $e(t.canonicalUrl) } : {}
  };
}
function lr(t) {
  const e = en(t);
  for (let i = 0; i < e.length; i++) {
    const n = e.slice(i);
    if (Y(I, xt, n))
      return n.length;
  }
  return 0;
}
function ht() {
  ne(I, xt);
}
function ur(t) {
  const e = en(t);
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
function tn(t, e = !1) {
  return e || !!t && t.is_auto_page_view === !0;
}
function dr(t, e, i = !1) {
  if (j(I, Ge) !== void 0)
    return;
  const n = tn(e, i), r = new URLSearchParams(window.location.search), s = {};
  for (const a of ar) {
    const c = n ? (e || {})[a] : r.get(a);
    g(c) && c && (s[a] = c);
  }
  if (Object.keys(s).length === 0)
    return;
  const o = Object.keys(s).join(", ");
  if (!Y(I, Ge, s)) {
    const a = It() ? "quota" : "ls_unavailable";
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
function fr() {
  const t = j(I, Ge);
  return E(t) ? t : null;
}
function mt() {
  ne(I, Ge);
}
function gr() {
  const e = document.querySelector('link[rel="canonical"]')?.href;
  if (e)
    return $e(e);
}
const nn = "skip", pr = [
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
], vt = {
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
}, hr = /\b(?:gift cards?|store credit|rewards?|points?|balance|vouchers?|promo codes?|coupons?)\b/g, mr = 12;
function yr(t) {
  return t.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/[^a-z]+/g, " ").trim();
}
function et(t) {
  if (typeof t != "string" || t.length > 128)
    return;
  const e = yr(t).replace(hr, " ").replace(/\s+/g, " ").trim();
  if (!e || e.split(" ").length > mr)
    return;
  const i = Object.keys(vt).filter((r) => vt[r].test(e)), n = i.filter((r) => r !== "card");
  return n.length === 1 ? n[0] : n.length === 0 && i.length === 1 ? i[0] : void 0;
}
function Vt(t) {
  return typeof t == "string" && Object.prototype.hasOwnProperty.call(vt, t);
}
const _r = "radio", Er = ["button", "role", "wallet"], Ir = ["label", "aria_label", "test_id", "element_id", "element_name"];
function Ar(t) {
  if (!t)
    return;
  const e = String(t.checked), i = t.type === _r;
  if (!(e === "false" || i && e !== "true" || t.type === "checkbox" || t.element === "link") && !(!i && t.type === void 0 && !Er.includes(String(t.element))))
    for (const n of Ir) {
      const r = et(t[n]);
      if (r && (i || r !== "card"))
        return r;
    }
}
function vr(t) {
  if (Vt(t.family))
    return t.family;
  for (const e of Array.isArray(t.names) ? t.names : []) {
    const i = et(e);
    if (i)
      return i;
  }
}
const Pr = ["paymenttype", "payment_type", "paymentmethod", "payment_method"];
function br(t) {
  const e = t ? Object.keys(t).find((n) => Pr.includes(n.toLowerCase())) : void 0, i = e ? t[e] : void 0;
  return typeof i != "string" || !i.trim() ? "absent" : et(i) ?? "other";
}
const wr = 1, Sr = 6e4;
function R(t) {
  return Array.isArray(t) && t.every(g);
}
function re(t) {
  return g(t) && t !== "";
}
const Cr = ["DesktopWeb", "MobileWeb"], Tr = 50;
function kr(t, e) {
  if (!Array.isArray(t) || t.length === 0 || !t.every((r) => R(r) && r.length >= 2 && r.every(re)))
    return !1;
  const i = t.flat();
  if (i.length > Tr || new Set(i).size !== i.length)
    return !1;
  const n = R(e) ? e.map((r) => r.toLowerCase()) : [];
  return !i.some((r) => n.includes(r.toLowerCase()));
}
const Lr = 10, Rr = 256, Dr = ["commit", "checkoutStep"];
function Or(t) {
  if (!E(t))
    return !1;
  const e = Dr.filter((i) => t[i] !== void 0);
  return e.length > 0 && e.every((i) => {
    const n = t[i];
    return R(n) && n.length > 0 && n.length <= Lr && n.every((r) => r.trim() !== "" && r.length <= Rr);
  });
}
function Nr(t) {
  if (re(t))
    return !0;
  if (!E(t))
    return !1;
  const { byClientType: e, byHostname: i, byPaymentPick: n, skipRemembered: r, skipValues: s, matchGroups: o, matchPaymentFamily: a } = t;
  if (t.value !== void 0 && !re(t.value) || e !== void 0 && (!E(e) || !Object.entries(e).every(
    ([c, l]) => Cr.includes(c) && re(l)
  )) || i !== void 0 && (!E(i) || !Object.entries(i).every(
    ([c, l]) => c !== "" && c === c.toLowerCase() && re(l)
  )) || n !== void 0 && (!E(n) || Object.keys(n).length === 0 || !Object.entries(n).every(
    ([c, l]) => Vt(c) && re(l)
  )) || r !== void 0 && typeof r != "boolean" || a !== void 0 && typeof a != "boolean" || s !== void 0 && (!R(s) || s.length === 0 || !s.every(re)))
    return !1;
  if (R(s)) {
    const c = s.map((d) => d.toLowerCase());
    if ([
      t.value,
      ...Object.values(e ?? {}).filter((d) => d !== nn),
      ...Object.values(i ?? {}),
      ...Object.values(n ?? {})
    ].some((d) => g(d) && c.includes(d.toLowerCase())))
      return !1;
  }
  return o !== void 0 && !kr(o, s) ? !1 : t.value !== void 0 || e !== void 0 || i !== void 0 || n !== void 0;
}
function Kr(t, e) {
  if (!E(e))
    return "not an object";
  const { pathname: i, pathnames: n, targetPageIdentifier: r, attributeKeys: s, optionalAttributeKeys: o, identityKeys: a, dispatchDelayMs: c } = e, { triggerEventNames: l, releaseHoldOnRouteChange: d, readEmailInput: u, cartIntent: f, cartUserAttribute: p } = e, { checkoutStepIntent: y, intentSelectors: _, hosts: P } = e, m = e.preselectAttributeOverrides, A = e.preselectAttributeDefaults !== void 0 ? e.preselectAttributeDefaults : m, b = e.widenedOptionalAttributeKeys, { targetPageIdentifierAttribute: w } = e;
  if (e.accountId !== void 0 && e.accountId !== t)
    return "accountId";
  if (!g(i) || !i.startsWith("/"))
    return "pathname";
  if (n !== void 0 && (!R(n) || n.length === 0 || !n.every((S) => S.startsWith("/"))))
    return "pathnames";
  if (!g(r) || r === "")
    return "targetPageIdentifier";
  if (w !== void 0 && (!g(w) || w.trim() === "" || Ft(w.trim())))
    return "targetPageIdentifierAttribute";
  if (!R(s) || s.length === 0)
    return "attributeKeys";
  if (o !== void 0 && (!R(o) || !o.every((S) => s.includes(S))))
    return "optionalAttributeKeys";
  if (b !== void 0 && (!R(b) || !b.every((S) => s.includes(S))))
    return "widenedOptionalAttributeKeys";
  if (a !== void 0 && (!R(a) || a.length === 0 || !a.every((S) => s.includes(S))))
    return "identityKeys";
  if (R(b) && b.length > 0) {
    const S = (R(o) ? o : []).concat(b).map((H) => H.toLowerCase());
    if (!R(a) || a.some((H) => S.includes(H.toLowerCase())))
      return "identityKeys";
  }
  if (c !== void 0 && (!Number.isInteger(c) || c < 0 || c > Sr))
    return "dispatchDelayMs";
  if (d !== void 0 && typeof d != "boolean")
    return "releaseHoldOnRouteChange";
  if (y !== void 0 && typeof y != "boolean")
    return "checkoutStepIntent";
  if (f !== void 0 && typeof f != "boolean")
    return "cartIntent";
  if (_ !== void 0 && !Or(_))
    return "intentSelectors";
  if (P !== void 0 && (!R(P) || P.length === 0 || !P.every((S) => S !== "" && S === S.toLowerCase())))
    return "hosts";
  if (u !== void 0 && (typeof u != "boolean" || !s.includes("email") || R(o) && o.includes("email") || // The runtime matches optional keys in any casing, so an 'Email' key would make email optional too.
  R(b) && b.some((S) => S.toLowerCase() === "email") || // A default makes its key optional too, and would send a guessed email as the shopper's.
  E(A) && Object.keys(A).some((S) => S.toLowerCase() === "email")))
    return "readEmailInput";
  if (e.preselectAttributeDefaults !== void 0 && m !== void 0)
    return "preselectAttributeDefaults";
  let K;
  if (A !== void 0) {
    const S = e.preselectAttributeDefaults !== void 0 ? "preselectAttributeDefaults" : "preselectAttributeOverrides";
    if (!E(A))
      return S;
    const H = (R(a) ? a : []).map((O) => O.toLowerCase()), q = ([O, z]) => Nr(z) && s.includes(O) && !["email", "emailsha256"].includes(O.toLowerCase()) && !H.includes(O.toLowerCase()), ue = ([O, z]) => m !== void 0 && g(z) && s.includes(O) && !(R(a) && a.includes(O)), J = Object.entries(A);
    if (!J.every((O) => q(O) || ue(O)))
      return S;
    K = Object.fromEntries(J.filter(q));
  }
  if (l !== void 0 && (!R(l) || l.length === 0 || l.some((S) => S === "")))
    return "triggerEventNames";
  const v = { accountId: t, pathname: i, targetPageIdentifier: r, attributeKeys: s };
  return n !== void 0 && (v.pathnames = n), w !== void 0 && (v.targetPageIdentifierAttribute = w.trim()), o !== void 0 && (v.optionalAttributeKeys = o), b !== void 0 && (v.widenedOptionalAttributeKeys = b), a !== void 0 && (v.identityKeys = a), c !== void 0 && (v.dispatchDelayMs = c), d !== void 0 && (v.releaseHoldOnRouteChange = d), y !== void 0 && (v.checkoutStepIntent = y), _ !== void 0 && (v.intentSelectors = _), P !== void 0 && (v.hosts = P), u !== void 0 && (v.readEmailInput = u), K !== void 0 && (v.preselectAttributeDefaults = K), l !== void 0 && (v.triggerEventNames = l), f !== void 0 && (v.cartIntent = f), f === !0 && g(p) && p !== "" && (v.cartUserAttribute = p), v;
}
function Ur(t, e) {
  const i = Xi(e);
  if (i === void 0)
    return { error: "invalid JSON" };
  if (!E(i))
    return { error: "not an object" };
  if (i.schemaVersion !== wr)
    return { error: "schemaVersion" };
  if (!Array.isArray(i.entries))
    return { error: "entries" };
  const n = [];
  for (let r = 0; r < i.entries.length; r++) {
    const s = Kr(t, i.entries[r]);
    if (g(s))
      return { error: `entry ${r + 1} ${s}` };
    if (n.some((o) => o.targetPageIdentifier === s.targetPageIdentifier))
      return { error: `entry ${r + 1} targetPageIdentifier` };
    n.push(s);
  }
  return { entries: n };
}
const Fr = 6e4, jt = "activePreselect:";
function Mr(t) {
  return E(t) && typeof t.expiresAt == "number" && typeof t.attributesDigest == "number";
}
function Ht(t, e) {
  return `${jt}${t}:${e}`;
}
function he(t) {
  const e = j(I, t, N);
  return Mr(e) && e.expiresAt > Date.now() ? e : null;
}
function xr(t, e, i = !1) {
  Y(
    I,
    t,
    { expiresAt: Date.now() + Fr, attributesDigest: e, ...i ? { byEvent: !0 } : {} },
    N
  );
}
function Vr(t, e, i) {
  const n = he(t);
  n && n.attributesDigest !== i || (e && e.expiresAt > Date.now() ? Y(I, t, e, N) : ne(I, t, N));
}
function yi(t) {
  pe(
    I,
    `${jt}${t}:`,
    N
  );
}
function jr() {
  pe(I, jt);
}
const Hr = 5 * 6e4, rn = "pendingPreselect:";
function Wr(t) {
  return E(t) && typeof t.expiresAt == "number" && g(t.pathname) && g(t.identifier) && E(t.attributes) && g(t.mpid);
}
function Wt(t) {
  return `${rn}${t}`;
}
function $t(t) {
  const e = Wt(t), i = j(I, e, N);
  return Wr(i) ? i.expiresAt <= Date.now() ? (ne(I, e, N), null) : i : null;
}
function _i(t, e, i, n, r, s = !1) {
  return Y(
    I,
    Wt(t),
    {
      expiresAt: Date.now() + Hr,
      pathname: e,
      identifier: i,
      attributes: n,
      mpid: r,
      ...s ? { byEvent: !0 } : {}
    },
    N
  );
}
function oe(t) {
  ne(I, Wt(t), N);
}
function $r() {
  pe(I, rn);
}
const sn = "preselectArrival:", on = "preselectTriggerAnyTab:", tt = "preselectCartAdd:", an = "preselectTargetPath:", cn = "preselectCartArrival:", Gr = 30 * 6e4, ye = 30 * 6e4, Yr = 10080 * 6e4, Br = 10080 * 6e4, Pt = ["commit", "wallet", "frame", "checkout_step", "cart"], zr = [
  "triggeredAt",
  "identitySeenAt",
  "firedAt",
  "firedDigest",
  "arrivedAt",
  "nearMissAt",
  "paymentPickAt"
], Xr = ["paymentPick", "paymentAtFire"];
function B(t, e) {
  return `${sn}${t}:${e}`;
}
function ln(t, e) {
  return `${on}${t}:${e}`;
}
function Re(t) {
  const e = j(I, t, N), i = {};
  if (!E(e))
    return i;
  for (const n of zr)
    typeof e[n] == "number" && (i[n] = e[n]);
  typeof e.intentAt == "number" && Pt.includes(e.intentKind) && (i.intentAt = e.intentAt, i.intentKind = e.intentKind);
  for (const n of Xr)
    Vt(e[n]) && (i[n] = e[n]);
  return i.firedAt !== void 0 && e.firedByCart === !0 && (i.firedByCart = !0), i;
}
function ae(t, e) {
  return Y(I, t, e, N);
}
function ce(t) {
  const e = Re(t);
  return e.arrivedAt === void 0 ? e : e.paymentPick !== void 0 && e.paymentPickAt !== void 0 && e.paymentPickAt > e.arrivedAt ? { paymentPick: e.paymentPick, paymentPickAt: e.paymentPickAt } : {};
}
function qr(t, e, i) {
  const n = B(t, e), r = ce(n), s = Date.now();
  ae(n, {
    ...r,
    triggeredAt: r.triggeredAt ?? s,
    ...i ? { identitySeenAt: r.identitySeenAt ?? s } : {}
  }), Y(I, ln(t, e), {
    triggeredAt: s
  });
}
function Jr(t, e) {
  const i = j(I, ln(t, e));
  if (!E(i) || typeof i.triggeredAt != "number")
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < Gr;
}
function Qr(t, e, i) {
  const n = `${tt}${t}`, r = j(I, n), s = E(r) ? r.addedAt ?? r.forgottenAt : void 0;
  typeof s == "number" && e <= s || Y(I, n, { addedAt: e, mpid: i });
}
function Zr(t, e) {
  const i = `${tt}${t}`, n = j(I, i);
  if (!E(n))
    return !1;
  const r = typeof n.addedAt == "number" ? n.addedAt : void 0, s = r ?? n.forgottenAt;
  if (typeof s != "number")
    return !1;
  const o = Date.now() - s;
  return o >= 0 && o < Yr ? r !== void 0 && e !== null && n.mpid === e : (ne(I, i), !1);
}
function es(t, e) {
  const i = `${tt}${t}`;
  e ? Y(I, i, { forgottenAt: Date.now() }) : ne(I, i);
}
function ts(t, e) {
  const i = B(t, e), n = Re(i);
  n.arrivedAt !== void 0 || n.nearMissAt !== void 0 || ae(i, { ...n, nearMissAt: Date.now() });
}
function is(t, e, i, n = !1) {
  const r = B(t, e), s = ce(r), o = s.firedAt !== void 0 && Te(s.firedAt) ? {
    firedAt: s.firedAt,
    ...s.firedDigest !== void 0 ? { firedDigest: s.firedDigest } : {},
    ...s.firedByCart ? { firedByCart: !0 } : {},
    ...s.paymentAtFire !== void 0 ? { paymentAtFire: s.paymentAtFire } : {}
  } : void 0, a = s.paymentPick !== void 0 && s.paymentPickAt !== void 0 && Te(s.paymentPickAt) ? s.paymentPick : void 0;
  return ae(
    r,
    un(s, {
      firedAt: o && !(o.firedByCart && !n) ? o.firedAt : Date.now(),
      firedDigest: i,
      ...n ? { firedByCart: !0 } : {},
      paymentAtFire: a
    })
  ), o;
}
function ns(t, e, i, n) {
  const r = B(t, e), s = ce(r);
  s.firedAt === void 0 || s.firedDigest !== n || ae(r, un(s, i));
}
function un(t, e) {
  const i = { ...t };
  return delete i.firedAt, delete i.firedDigest, delete i.firedByCart, delete i.paymentAtFire, e ? {
    ...i,
    firedAt: e.firedAt,
    ...e.firedDigest !== void 0 ? { firedDigest: e.firedDigest } : {},
    ...e.firedByCart ? { firedByCart: !0 } : {},
    ...e.paymentAtFire !== void 0 ? { paymentAtFire: e.paymentAtFire } : {}
  } : i;
}
function rs(t, e) {
  const i = ce(B(t, e));
  if (i.triggeredAt === void 0)
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < ye;
}
function Ei(t, e, i, n = !1) {
  const r = ce(B(t, e));
  if (r.firedAt === void 0 || n && r.firedByCart || i !== void 0 && r.firedDigest !== void 0 && r.firedDigest !== i)
    return !1;
  const s = Date.now() - r.firedAt;
  return s >= 0 && s < ye;
}
function ss(t, e, i, n) {
  const r = B(t, e), s = ce(r);
  if (s.intentAt !== void 0 && s.intentKind !== void 0 && os(s.intentAt)) {
    const o = Pt.indexOf(s.intentKind), a = Pt.indexOf(i);
    if (o < a || o === a && s.intentAt >= n)
      return;
  }
  ae(r, { ...s, intentAt: n, intentKind: i });
}
function Te(t) {
  const e = Date.now() - t;
  return e >= 0 && e < ye;
}
function os(t) {
  return Te(t);
}
function as(t, e, i, n) {
  const r = B(t, e), s = Re(r);
  s.arrivedAt !== void 0 && n <= s.arrivedAt || s.paymentPickAt !== void 0 && s.paymentPickAt > n || ae(r, { ...s, paymentPick: i, paymentPickAt: n });
}
function cs(t, e) {
  const i = ce(B(t, e));
  return i.paymentPick !== void 0 && i.paymentPickAt !== void 0 && Te(i.paymentPickAt) ? i.paymentPick : void 0;
}
function ls(t, e) {
  const i = B(t, e), n = Re(i);
  if (n.arrivedAt !== void 0)
    return;
  const r = { ...n, arrivedAt: Date.now() };
  if (delete r.paymentPick, delete r.paymentPickAt, !!ae(i, r))
    return n;
}
function dn(t, e) {
  return `${cn}${t}:${e}`;
}
function us(t, e, i, n) {
  const r = dn(t, e);
  if (i === void 0 || n === null) {
    ne(I, r, N);
    return;
  }
  Y(
    I,
    r,
    { arrivedAt: Date.now(), cartDigest: i, mpid: n },
    N
  );
}
function ds(t, e, i, n) {
  const r = j(
    I,
    dn(t, e),
    N
  );
  if (!E(r) || typeof r.arrivedAt != "number" || r.cartDigest !== i || n === null || r.mpid !== n)
    return !1;
  const { firedAt: s } = Re(B(t, e)), o = j(I, `${tt}${t}`), a = E(o) && typeof o.addedAt == "number" && o.mpid === n ? o.addedAt : void 0;
  return Te(r.arrivedAt) && !(s !== void 0 && s >= r.arrivedAt) && !(a !== void 0 && a >= r.arrivedAt);
}
function fs(t, e, i) {
  Y(I, `${an}${t}:${e}`, {
    pathDigest: i,
    learnedAt: Date.now()
  });
}
function gs(t, e, i) {
  const n = j(
    I,
    `${an}${t}:${e}`
  );
  if (!E(n) || n.pathDigest !== i || typeof n.learnedAt != "number")
    return !1;
  const r = Date.now() - n.learnedAt;
  return r >= 0 && r < Br;
}
function Ii(t) {
  pe(
    I,
    `${sn}${t}:`,
    N
  ), pe(
    I,
    `${cn}${t}:`,
    N
  ), pe(I, `${on}${t}:`);
}
function C(t, e, i = {}) {
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
const bt = /* @__PURE__ */ new Map();
function ps(t, e) {
  if (bt.delete(t), !e)
    return;
  const i = Ur(t, e);
  if ("error" in i)
    return i.error;
  bt.set(t, i.entries);
}
function M(t) {
  return bt.get(t) ?? pr.filter((e) => e.accountId === t);
}
function fn(t) {
  return t.pathnames ? [t.pathname, ...t.pathnames] : [t.pathname];
}
function gn(t, e) {
  return fn(t).find((i) => Ve(i, e));
}
function pn(t, e) {
  return gn(t, e) !== void 0;
}
function Ve(t, e) {
  const i = L(t), n = L(e);
  if (!i.includes("*"))
    return i === n;
  const r = i.split("/"), s = n.split("/");
  return r.length !== s.length ? !1 : r.every(
    (o, a) => o === "*" ? s[a] !== "" : o === s[a]
  );
}
function L(t) {
  return t.length > 1 && t.endsWith("/") ? t.slice(0, -1) : t;
}
function hs(t, e) {
  const i = L(t).toLowerCase(), n = L(e).toLowerCase().split("/"), r = i.split("/").length;
  return Ve(i, n.join("/")) || Ve(i, ["", ...n.slice(2)].join("/")) || n.length > r && Ve(i, n.slice(0, r).join("/"));
}
const hn = {}, mn = {}, yn = {}, Gt = {}, _n = {}, ms = {}, ys = ["commit", "wallet", "checkout_step", "frame", "cart"], _s = ["vendor", "label", "brand", "frame", "submit", "name", "api", "selector"], Es = 512;
function En(t) {
  return t === "commit" ? "intent_commit" : t === "checkout_step" ? "intent_checkout_step" : t === "cart" ? "intent_cart" : "intent_wallet";
}
function In(t) {
  return t === "intent_commit" ? mn : t === "intent_checkout_step" ? Gt : t === "intent_cart" ? _n : yn;
}
const Is = 1e3;
function wt(t) {
  const e = Date.now() - t.t;
  return e >= 0 && e < Is;
}
function it(t) {
  return M(t).filter((e) => e.cartIntent === !0);
}
function nt(t) {
  return typeof t.source == "string" && _s.includes(t.source) ? t.source : void 0;
}
function An(t) {
  return [...new Set(M(t).map((i) => i.targetPageIdentifier))].some((i) => rs(t, i)) ? "left" : "before_entry";
}
function rt(t, e, i, n, r = {}, s = !1) {
  const o = `${n}:${i}:${e.kind}${s ? ":wait" : ""}`;
  if (Ct.has(o)) return;
  Ct.add(o);
  const a = nt(e);
  t.logPlacementDiagnostic(
    C("skipped", "intent_observed", {
      intent_kind: e.kind,
      intent_route: i,
      ...a ? { intent_source: a } : {},
      has_email: Ue(t, {}),
      has_identity: F(t.filteredUser),
      ...r
    })
  );
}
function Yt(t) {
  const e = D(t.filteredUser), i = t.getCurrentUser?.();
  return e !== null && D(i) === e && i?.isLoggedIn?.() === !0;
}
function St(t, e, i, n, r, s = !1) {
  const o = e.accountId, a = An(o), c = Yt(e), l = (b, w = s) => rt(e, i, a, r, { logged_in: c, ...b ? { cause: b } : {} }, w), d = i.kind === "cart", u = i.kind === "wallet" && !c && (s || !F(e.filteredUser));
  if (!d && !c && (s || l(), !u))
    return;
  const f = d ? it(o) : M(o).filter((b) => b.cartIntent !== !0);
  if (f.length === 0) return l("cart_entry_only");
  if (f.length !== 1) return l("multiple_entries");
  if (n !== L(window.location.pathname) && !(d && wt(i)))
    return l("path_changed");
  const p = f[0];
  if (p.hosts && !p.hosts.includes(window.location.hostname) && U(o, n)?.targetPageIdentifier !== p.targetPageIdentifier)
    return l("unlisted_host", u);
  if (!F(e.filteredUser))
    return u && !s ? vs(t, e, i, n, r) : l("no_valid_identity");
  const y = En(i.kind), _ = `${y}_off_entry`, { collected: P, missingKeys: m } = le(e, In(y), p, !1), A = at(e, o, p.targetPageIdentifier, P);
  if (ii(o, p.targetPageIdentifier, A, !d))
    return l("active_preselection");
  if (m.length > 0) return l("missing_attribute");
  if (!Ue(e, P, p.targetPageIdentifier)) return l("no_strict_email");
  Fe(
    e,
    o,
    p.targetPageIdentifier,
    p.targetPageIdentifier,
    P,
    "intent",
    Oe(_, p),
    !1,
    y,
    !1,
    void 0,
    nt(i),
    { route: a, loggedIn: c, requireLogin: !d && !u }
  );
}
function As(t, e, i, n, r) {
  const s = (c) => rt(t, e, "entry", r, { cause: c });
  if (!F(t.filteredUser)) return s("no_valid_identity");
  const { collected: o, missingKeys: a } = le(t, Gt, i, !1);
  if (a.length > 0) return s("missing_attribute");
  if (!Ue(t, o, i.targetPageIdentifier)) return s("no_strict_email");
  Fe(
    t,
    t.accountId,
    i.targetPageIdentifier,
    i.targetPageIdentifier,
    o,
    "intent",
    Oe("intent_checkout_step", i, n),
    !1,
    "intent_checkout_step",
    !1,
    void 0,
    nt(e),
    { route: "entry", loggedIn: Yt(t), requireLogin: !1 }
  );
}
const vn = 2e4;
function vs(t, e, i, n, r) {
  Pn(t);
  const s = () => {
    t.identityWait = void 0;
    const a = e.getCurrentHost?.() ?? e;
    Bt(a) && bn(a, o);
  }, o = {
    signal: i,
    clickPathname: n,
    visitKey: r,
    route: x[x.length - 1],
    timer: setTimeout(s, Math.max(0, i.t + vn - Date.now()))
  };
  t.identityWait = o;
}
function Pn(t) {
  t.identityWait && clearTimeout(t.identityWait.timer), t.identityWait = void 0;
}
function bn(t, e) {
  const i = An(t.accountId), n = { logged_in: Yt(t), cause: "identity_wait_expired" };
  rt(t, e.signal, i, e.visitKey, n, !0);
}
function Ps(t, e) {
  const i = t.identityWait;
  if (!i || !F(e.filteredUser) || (Pn(t), !Bt(e))) return;
  if (e.logPlacementDiagnostic(
    C("identity_arrived", "pending_identity", {
      intent_kind: i.signal.kind,
      ...ct(i.signal.t)
    })
  ), x[x.length - 1] !== i.route || i.clickPathname !== L(window.location.pathname) || Date.now() - i.signal.t >= vn) return bn(e, i);
  St(t, e, i.signal, i.clickPathname, i.visitKey, !0);
}
function bs(t) {
  const e = t.pathname;
  return typeof e == "string" && e.charAt(0) === "/" && e.length <= Es ? L(e) : void 0;
}
const ve = /* @__PURE__ */ new Set(), Ct = /* @__PURE__ */ new Set(), x = [];
function ke(t) {
  if (t === mn) return "intent_commit";
  if (t === yn) return "intent_wallet";
  if (t === Gt) return "intent_checkout_step";
  if (t === _n) return "intent_cart";
}
function De(t) {
  return ke(t) !== void 0;
}
function yt(t, e = Date.now()) {
  t = L(t), x[x.length - 1]?.pathname !== t && (x.push({ pathname: t, since: e }), x.length > 8 && x.shift(), Ct.clear());
}
function ws(t, e, i) {
  if (!i || !ys.includes(i.kind) || typeof i.t != "number" || !Number.isFinite(i.t))
    return;
  const n = `${i.kind}:${i.t}${i.adds === !0 ? ":adds" : ""}`;
  if (ve.has(n) || (ve.add(n), ve.size > 4096 && ve.delete(ve.values().next().value), !Bt(e)) || i.kind === "cart" && it(e.accountId).length === 0) return;
  Ss(e.accountId, i);
  const r = D(e.filteredUser);
  i.kind === "cart" && i.adds === !0 && r !== null && Ae(e.accountId) && Qr(e.accountId, i.t, r);
  const s = [...x].reverse().find((A) => A.since <= i.t), o = bs(i) ?? s?.pathname;
  if (!o) return;
  const a = s && s.pathname === o ? s.since : 0, c = `${o}:${a}`, l = i.kind === "cart", d = i.kind === "commit" || i.kind === "wallet" || l, u = U(e.accountId, o);
  if (!u || (l ? u.cartIntent !== !0 : u.cartIntent === !0)) {
    d && St(t, e, i, o, c);
    return;
  }
  const f = window.location.pathname, p = o === L(f);
  if (l && !p && wt(i)) {
    St(t, e, i, o, c);
    return;
  }
  const y = i.kind === "checkout_step" && u.checkoutStepIntent === !0;
  if (y && !p && wt(i)) {
    As(e, i, u, o, c);
    return;
  }
  if (!(d || y) || !p) {
    rt(e, i, "entry", c);
    return;
  }
  t.intentSource = nt(i);
  const _ = En(i.kind), P = t.scheduledDispatch;
  if (P && L(P.pathname) === L(f)) {
    qt(t), $n(t, e, P, "intent_released", _);
    return;
  }
  const m = t.pending.find(
    (A) => L(A.pathname) === L(f)
  );
  if (m) {
    m.intentSeen = _, m.waitingFor === "intent" && (t.pending = t.pending.filter((A) => A !== m), Ee(
      t,
      e,
      m.event,
      f,
      m.triggeringUserId,
      m.triggeredAt,
      _
    ));
    return;
  }
  Ee(t, e, In(_), f, void 0, i.t);
}
function Bt(t) {
  return !t.isTargetingDisabled?.() && t.isForwardingAllowed?.() !== !1 && lt(t) && t.isKitReady() && t.isPreselectionEnabled() && we(t.accountId);
}
function Ss(t, e) {
  const i = e.kind === "cart" ? it(t) : M(t);
  new Set(i.map((r) => r.targetPageIdentifier)).forEach((r) => ss(t, r, e.kind, e.t));
}
function _e(t) {
  return t === hn;
}
const st = 4, Cs = ["Auto Button Click", "Auto Link Click"], Ts = ["is_auto_button_click", "is_auto_link_click"];
function Ye(t) {
  return t.EventDataType === st && Cs.includes(t.EventName ?? "") || Ts.some((e) => String(t.EventAttributes?.[e]) === "true");
}
function wn(t) {
  const e = t.accountId;
  if (!(!e || !we(e) || t.isTargetingDisabled?.() || t.isForwardingAllowed?.() === !1 || !lt(t) || !t.isKitReady() || !t.isPreselectionEnabled()))
    return e;
}
function Sn(t, e, i) {
  if (!e) return;
  const n = new Set(M(t).map((o) => o.targetPageIdentifier)), r = Date.now(), s = typeof i == "number" && Number.isFinite(i) && i <= r ? i : r;
  n.forEach((o) => as(t, o, e, s));
}
function ks(t, e) {
  const i = Ye(e) ? wn(t) : void 0;
  i && Sn(
    i,
    Ar(e.EventAttributes),
    e.Timestamp
  );
}
function Ls(t, e) {
  const i = wn(t);
  i && Sn(i, vr(e), e?.t);
}
function me(t, e) {
  return e.EventDataType === st && g(e.EventName) && !Ye(e) && (t.triggerEventNames ?? []).includes(e.EventName);
}
const Cn = "rokt.preselecttrigger", Ai = "rokt.preselectdefaulted", Rs = /^[A-Za-z][A-Za-z0-9_.]{0,63}$/, Ds = 16, Be = "preselectFormEmail", Tt = "preselectBoundUser", kt = "preselectEntry";
function Oe(t, e, i) {
  const n = (i !== void 0 ? gn(e, i) : void 0) ?? e.pathname;
  return `${t}|${n}`;
}
function U(t, e) {
  if (t)
    return M(t).find((i) => pn(i, e));
}
function Tn(t, e, i) {
  if (!t || !g(e))
    return;
  const n = M(t).filter(
    (r) => r.targetPageIdentifierAttribute === void 0 ? r.targetPageIdentifier === e : i !== void 0 && Xe(r, i) === e
  );
  return n.length === 1 ? n[0] : void 0;
}
function Os(t, e) {
  const i = new Set(
    Object.keys(e).filter((r) => !T(e[r])).map((r) => r.toLowerCase())
  ), n = {};
  for (const r of Object.keys(t))
    i.has(r.toLowerCase()) || (n[r] = t[r]);
  for (const r of Object.keys(e))
    T(e[r]) || (n[r] = e[r]);
  return n;
}
function Ns(t) {
  return !!t && M(t).some((e) => e.targetPageIdentifierAttribute !== void 0);
}
function ze(t, e) {
  if (!(!t || e === void 0))
    return M(t).find((i) => i.targetPageIdentifier === e);
}
function kn(t, e) {
  const i = k(t, e);
  if (!T(i))
    return i;
  const n = e.toLowerCase(), r = Object.keys(t).filter((s) => s.toLowerCase() === n && !T(t[s])).map((s) => t[s]);
  return r.length > 0 && r.every((s) => s === r[0]) ? r[0] : void 0;
}
function Ks(t) {
  const e = t.charCodeAt(0);
  return e < 32 || e >= 127 && e <= 159;
}
function Xe(t, e) {
  const i = t.targetPageIdentifierAttribute;
  if (i === void 0)
    return t.targetPageIdentifier;
  const n = kn(e, i);
  if (!g(n))
    return;
  const r = n.trim();
  return r !== "" && !/\s/.test(r) && !Array.from(r).some(Ks) ? r : void 0;
}
function Lt(t, e) {
  if (!e)
    return t;
  const i = new Set(Object.keys(e).map((r) => r.toLowerCase())), n = {};
  for (const [r, s] of Object.entries(t))
    i.has(r.toLowerCase()) || (n[r] = s);
  return { ...n, ...e };
}
function Ln(t) {
  return t.getPreselectVariant?.() === "widened";
}
const Us = /iP(hone|od|ad)|Android|BlackBerry|BB10|IEMobile|Kindle/, Fs = /Win(dows|16|95|98|CE)|Pocket Internet Explorer|OpenBSD|SunOS|CrOS|Linux|X11|Mac_PowerPC|Macintosh|QNX|BeOS|OS\/2/;
function Ms(t) {
  return Us.test(t) ? "MobileWeb" : Fs.test(t) ? "DesktopWeb" : void 0;
}
function Rn(t, e) {
  if (g(t))
    return t;
  const i = Ms(navigator.userAgent), n = i ? t.byClientType?.[i] : void 0;
  if (n === nn)
    return;
  const r = e && t.byPaymentPick ? k(t.byPaymentPick, e) : void 0, s = t.byHostname ? k(t.byHostname, window.location.hostname) : void 0;
  return r ?? s ?? n ?? t.value;
}
function Dn(t) {
  return Object.values(t.preselectAttributeDefaults ?? {}).some((i) => E(i) && i.byPaymentPick) ? cs(t.accountId, t.targetPageIdentifier) : void 0;
}
function _t(t) {
  return new Set(
    Object.keys(t).filter((e) => !T(t[e])).map((e) => e.toLowerCase())
  );
}
function On(t, e) {
  return !Ln(t) || !g(e) && !!(e.matchGroups || e.skipValues);
}
function ot(t, e, i) {
  const n = e.preselectAttributeDefaults;
  if (!n)
    return {};
  const r = /* @__PURE__ */ new Set([..._t(t.getUserIdentities?.() ?? {}), ..._t(i)]), s = _t(t.userAttributes ?? {}), o = Dn(e), a = {};
  for (const c of Object.keys(n)) {
    const l = c.toLowerCase();
    if (!On(t, n[c]) || Ke(c, t.mappedEmailSha256Key) || r.has(l) || s.has(l) && !Nn(t, e, c))
      continue;
    const d = Rn(n[c], o);
    d !== void 0 && (a[c] = d);
  }
  return a;
}
function Nn(t, e, i) {
  const n = k(e.preselectAttributeDefaults ?? {}, i);
  return E(n) && n.skipRemembered === !0 && On(t, n) && !Ke(i, t.mappedEmailSha256Key) && Rn(
    n,
    Dn(e)
  ) !== void 0;
}
function xs(t, e, i, n, r) {
  const s = e.preselectAttributeDefaults ?? {};
  return Object.keys(s).find((o) => {
    const a = s[o];
    if (g(a) || !a.skipValues)
      return !1;
    const c = a.skipValues.map((d) => d.toLowerCase()), l = n ?? {
      ...t.getUserIdentities?.() ?? {},
      ...k(r, o) !== void 0 ? {} : t.userAttributes ?? {},
      ...i
    };
    return Object.keys(l).some((d) => {
      const u = l[d];
      return d.toLowerCase() === o.toLowerCase() && (g(u) || typeof u == "number" || typeof u == "boolean") && c.includes(String(u).toLowerCase());
    });
  });
}
function zt(t) {
  const e = t.getPreselectVariant?.();
  return e === "widened" || e === "standard" ? { variant: e } : {};
}
function Vs(t, e, i) {
  const n = t?.identityKeys;
  if (!n?.length || !e)
    return n;
  const r = Xt(e, i);
  return r.length > 0 ? [...n, ...r] : n;
}
function js(t, e, i) {
  const n = t?.preselectAttributeDefaults;
  if (!n || !e)
    return;
  const r = {};
  return Xt(e, i).forEach((s) => {
    const o = n[s], a = g(o) ? void 0 : o?.matchGroups?.find((c) => c.includes(e[s]));
    a && (r[s] = a);
  }), Object.keys(r).length > 0 ? r : void 0;
}
function Hs(t, e) {
  const i = t?.preselectAttributeDefaults;
  if (!i)
    return;
  const n = {};
  return Object.keys(i).forEach((r) => {
    const s = i[r];
    if (g(s) || s?.matchPaymentFamily !== !0)
      return;
    const o = Kn(e, r) ? void 0 : et(k(e, r));
    o && (n[r] = o);
  }), Object.keys(n).length > 0 ? n : void 0;
}
function Xt(t, e) {
  return Object.keys(t).filter(
    (i) => k(e, i) === t[i] && !Kn(e, i)
  );
}
function Kn(t, e) {
  return Object.keys(t).some(
    (i) => i !== e && i.toLowerCase() === e.toLowerCase() && !T(t[i])
  );
}
function Un(t, e) {
  if (!t)
    return;
  const i = Xt(t, e).filter((n) => Rs.test(n)).slice(0, Ds);
  return i.length > 0 ? i.join(",") : void 0;
}
function Fn(t) {
  const e = Object.keys(t.preselectAttributeDefaults ?? {});
  return [...t.attributeKeys, ...e.filter((i) => !t.attributeKeys.includes(i))];
}
function Ws(t) {
  if (!t)
    return;
  const e = M(t), i = [...new Set(e.flatMap((r) => r.intentSelectors?.commit ?? []))], n = [...new Set(e.flatMap((r) => r.intentSelectors?.checkoutStep ?? []))];
  if (!(i.length === 0 && n.length === 0))
    return {
      ...i.length > 0 ? { commit: i } : {},
      ...n.length > 0 ? { checkout_step: n } : {}
    };
}
function we(t) {
  return t ? M(t).length > 0 : !1;
}
function $s(t, e, i = window.location.pathname) {
  if (t.pending.some((r) => r.pathname === i && !_e(r.event)))
    return;
  const n = t.scheduledDispatch;
  n && n.pathname === i && !_e(n.event) || Ee(t, e, hn, i);
}
function Gs(t, e) {
  return !t || !g(e) ? !1 : M(t).some((i) => (i.triggerEventNames ?? []).includes(e));
}
function qe(t) {
  return !_e(t) && !De(t) && t.EventDataType !== st;
}
function Ys(t, e) {
  const i = t.scheduledDispatch;
  return i && i.pathname === e && qe(i.event) ? !0 : t.pending.some((n) => n.pathname === e && qe(n.event));
}
function Bs(t, e, i, n) {
  if (!t.isKitReady() || !t.isPreselectionEnabled() || !Zt(t, i))
    return "waits";
  const { collected: r, missingKeys: s } = le(t, e, i);
  if (s.length > 0)
    return "waits";
  const o = t.accountId || "", a = he(Ht(o, L(n)));
  if (!a)
    return "now";
  const c = at(t, o, i.targetPageIdentifier, r);
  return a.byEvent || ti(a.attributesDigest, c) ? "skipped" : "now";
}
function zs(t, e, i) {
  t.pending = t.pending.filter((r) => r.pathname !== i);
  const n = e.accountId ? $t(e.accountId) : null;
  e.accountId && n && n.pathname === i && oe(e.accountId);
}
function Xs(t, e, i, n = window.location.pathname) {
  const r = U(e.accountId, n);
  if (!r || !me(r, i))
    return;
  const s = Bs(e, i, r, n);
  if (s === "now")
    zs(t, e, n);
  else if (Ys(t, n) || s === "skipped" && t.scheduledDispatch?.pathname === n)
    return;
  Ee(t, e, i, n);
}
function qs(t, e) {
  return t ? M(t).some((i) => i.attributeKeys.includes(e)) : !1;
}
function Js() {
  return { pending: [] };
}
function qt(t) {
  if (t.dispatchTimer === void 0)
    return;
  const e = t.scheduledDispatch;
  return clearTimeout(t.dispatchTimer), t.dispatchTimer = void 0, t.scheduledDispatch = void 0, e;
}
function Qs(t, e) {
  return t === void 0 ? e : e === void 0 ? t : Math.min(t, e);
}
function vi(t) {
  return _e(t) ? 0 : De(t) || t.EventDataType === st ? 2 : 1;
}
function Zs(t, e) {
  const i = U(t.accountId, e.pathname);
  return !!i && le(t, e.event, i).missingKeys.length > 0;
}
function Mn(t, e, i, n) {
  const r = t.pending.find((s) => s.pathname === n);
  return !!r && vi(i) < vi(r.event) && !(qe(i) && Zs(e, r));
}
function te(t, e, i) {
  const n = t.pending.findIndex((r) => r.pathname === i.pathname);
  if (n >= 0) {
    if (Mn(t, e, i.event, i.pathname))
      return;
    const r = t.pending[n];
    t.pending[n] = {
      ...i,
      triggeredAt: Qs(r.triggeredAt, i.triggeredAt),
      intentSeen: i.intentSeen ?? r.intentSeen ?? ke(r.event)
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
    return g(n) && n.length > 0;
  }).sort() : [];
}
function F(t) {
  return Le(t).length > 0;
}
const Rt = /^[^\s@]+@[^\s@]+\.(?:[a-zA-Z]{2,}|xn--[a-zA-Z0-9-]+|[^\s@.\x00-\x7F]{2,})$/, Z = /* @__PURE__ */ new WeakSet(), Pe = /* @__PURE__ */ new WeakSet(), fe = /* @__PURE__ */ new WeakSet(), be = /* @__PURE__ */ new WeakSet(), Dt = /* @__PURE__ */ new WeakSet(), Pi = /* @__PURE__ */ new WeakSet();
function Je(t) {
  if (!(t instanceof HTMLInputElement)) return !1;
  const e = t.type;
  return e === "text" || e === "email" || t.getAttribute("autocomplete") === "email" && e !== "hidden" && e !== "password";
}
function Ot(t) {
  const e = t.target;
  if (!(e instanceof HTMLInputElement)) return;
  if (t.type === "blur" || t.type === "focusout") {
    if (t.isTrusted !== !0) return;
    !Je(e) || !Pe.has(e) ? (Z.delete(e), fe.delete(e)) : Z.has(e) || be.add(e);
    return;
  }
  const i = !Pi.has(t);
  if (Pi.add(t), t.isTrusted !== !0) {
    Dt.add(e), Z.delete(e), Pe.delete(e), fe.delete(e), be.delete(e);
    return;
  }
  if (i && Dt.delete(e), !Je(e)) {
    Z.delete(e), Pe.delete(e), fe.delete(e), be.delete(e);
    return;
  }
  i && (fe.add(e), be.delete(e), e.addEventListener("input", Ot, !0), e.addEventListener("change", Ot, !0), t.type === "change" ? (Z.add(e), Pe.add(e)) : Z.delete(e));
}
function eo(t) {
  return Je(t) && (t.type === "email" || t.getAttribute("autocomplete") === "email" || Rt.test(t.value.trim()));
}
function Ne(t) {
  return t.attributeKeys.find((e) => e.toLowerCase() === "email");
}
const to = 254;
function io(t) {
  return t.type === "email" || t.getAttribute("autocomplete") === "email" || t.value.includes("@");
}
function no(t) {
  return io(t) || Pe.has(t) && !Z.has(t) && !(be.has(t) && t !== document.activeElement);
}
function xn(t) {
  const e = /* @__PURE__ */ new Map(), i = [];
  let n = 0;
  document.querySelectorAll("input").forEach((o) => {
    if (!Je(o)) return;
    const a = Z.has(o), c = fe.has(o);
    if (!a) {
      c && no(o) && (n += 1), t && i.push(o);
      return;
    }
    const l = o.value.trim();
    Rt.test(l) && !e.has(l.toLowerCase()) && e.set(l.toLowerCase(), l);
  });
  const r = e.size > 0 && n > 0;
  let s;
  return t && !r && e.size === 0 && i.forEach((o) => {
    const a = o.value.trim();
    a.length > to || !Rt.test(a) || (Dt.has(o) ? s = "untrusted_fill" : s !== "untrusted_fill" && (fe.has(o) || o === document.activeElement ? s = "uncommitted_fill" : s !== "uncommitted_fill" && (s = "unseen_fill")));
  }), { emails: e, ambiguous: r, unfilled: s };
}
function ro() {
  const { emails: t, ambiguous: e } = xn(!1);
  return t.size === 1 && !e ? t.values().next().value : void 0;
}
function Jt(t, e, i = {}) {
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
    (o) => Object.keys(o).some((a) => n.has(a.toLowerCase()) && !T(k(o, a)))
  );
}
const so = ["email", "emailsha256"];
function Ke(t, e) {
  const i = t.toLowerCase();
  return so.includes(i) || g(e) && i === e.toLowerCase();
}
function Ue(t, e, i) {
  return t.getOutgoingAttributes ? je(t.getOutgoingAttributes(e, i), t.mappedEmailSha256Key) : je(e, t.mappedEmailSha256Key) || je(t.getUserIdentities?.() ?? {}, t.mappedEmailSha256Key);
}
function je(t, e) {
  return Object.keys(t).some(
    (i) => Ke(i, e) && !T(k(t, i))
  );
}
function Qt(t, e, i, n = {}) {
  return e.readEmailInput !== !0 ? "read_disabled" : pn(e, window.location.pathname) ? t.isForwardingAllowed?.() !== !0 || t.isPreselectionPrivacyAllowed?.() === !1 || t.isTargetingDisabled?.() === !0 ? "privacy_blocked" : t.isEmailIdentityFiltered?.() === !0 ? "email_filtered" : Jt(t, i, n) ? "partner_email" : void 0 : "off_route";
}
function oo(t, e, i, n) {
  const r = Qt(t, e, i, n.EventAttributes ?? {});
  if (r) return r;
  const { emails: s, ambiguous: o, unfilled: a } = xn(!0);
  return s.size > 1 || o ? "multiple_emails" : a ?? "no_field";
}
function ao(t, e, i) {
  const n = window.location.pathname, r = U(e.accountId, n), s = r && Ne(r);
  return !!s && t.pending.some(
    (o) => o.pathname === n && !Qt(e, r, s, o.event.EventAttributes ?? {})
  ) && i.isTrusted === !0 && eo(i.target);
}
function Vn(t, e, i, n) {
  const r = Ne(e);
  if (!r || !T(k(i, r)) || Qt(t, e, r, n.EventAttributes ?? {}))
    return;
  const s = ro();
  if (s)
    return i[r] = s, r;
}
function Zt(t, e) {
  const i = Ne(e);
  return F(t.filteredUser) || e.readEmailInput === !0 && !!i && ei(t, e, {}).includes(i);
}
function co(t) {
  return !!t && M(t).some((e) => e.readEmailInput === !0);
}
function Qe(t) {
  return t.length > 0 ? t.join(",") : "none";
}
function D(t) {
  const e = t?.getMPID?.();
  return e == null ? null : String(e);
}
function jn(t, e) {
  const i = Le(t.filteredUser), n = t.getCurrentUser?.(), r = Le(n), s = D(t.filteredUser), o = D(n), a = [...e.identityKeys ?? [], "email", "emailsha256"];
  t.mappedEmailSha256Key && a.push(t.mappedEmailSha256Key);
  const c = new Set(a.map((f) => f.toLowerCase())), l = n?.getAllUserAttributes?.() ?? {}, d = [t.userAttributes, l].some(
    (f) => Object.entries(f).some(
      ([p, y]) => c.has(p.toLowerCase()) && g(y) && y.length > 0
    )
  );
  let u = "no_identities";
  return t.filteredUser ? o !== null && s !== o ? u = "mpid_mismatch" : r.length > 0 && (u = "kit_user_lacks_identities") : u = "no_filtered_user", {
    identity_reason: u,
    kit_identity_types: Qe(i),
    current_identity_types: Qe(r),
    mpid_match: o === null ? "unknown" : s === o,
    identity_attribute_present: d
  };
}
function ei(t, e, i) {
  const n = Ln(t) ? e.widenedOptionalAttributeKeys ?? [] : [], r = new Set(
    [...e.optionalAttributeKeys ?? [], ...n].map((o) => o.toLowerCase())
  ), s = ot(t, e, i);
  return e.attributeKeys.filter(
    (o) => !r.has(o.toLowerCase()) && T(k(i, o)) && k(s, o) === void 0
  );
}
function le(t, e, i, n = !0) {
  const r = t.filteredUser?.getAllUserAttributes?.() || {}, s = new Set(i.identityKeys ?? []);
  let o;
  const a = {};
  for (const u of i.attributeKeys) {
    const f = t.getEventAttributeValue(e, u), p = k(t.userAttributes, u);
    let y = !T(f) || Nn(t, i, u) ? f : T(p) ? k(r, u) : p;
    if (T(y) && s.has(u)) {
      o || (o = t.getUserIdentities?.() ?? {});
      const _ = k(o, u);
      y = g(_) && _ !== "" ? _ : void 0;
    }
    T(y) || (a[u] = y);
  }
  const c = i.targetPageIdentifierAttribute;
  if (c !== void 0) {
    const u = [e.EventAttributes ?? {}, t.userAttributes, r].map((f) => kn(f, c)).find((f) => !T(f));
    if (u !== void 0) {
      const f = c.toLowerCase(), p = Object.keys(a).filter((y) => y.toLowerCase() === f);
      for (const y of p.length > 0 ? p : [c])
        a[y] = u;
    }
  }
  const l = e.EventAttributes ?? {};
  for (const u of Object.keys(i.preselectAttributeDefaults ?? {})) {
    if (!T(t.getEventAttributeValue(e, u)))
      continue;
    const f = Object.keys(l).find(
      (p) => p.toLowerCase() === u.toLowerCase() && !T(l[p])
    );
    f !== void 0 && (a[f] = l[f]);
  }
  const d = n ? Vn(t, i, a, e) : void 0;
  return {
    collected: a,
    missingKeys: ei(t, i, a),
    formEmailKey: d
  };
}
const Hn = /* @__PURE__ */ new WeakMap();
function lo(t) {
  return Hn.get(t);
}
function uo(t, e, i) {
  i && Hn.set(e, i);
  const n = (s) => {
    i?.();
    const o = e[Be] ? "redacted" : s instanceof Error ? s.message : String(s);
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
const bi = /* @__PURE__ */ new Map(), wi = /* @__PURE__ */ new Map();
function Si(t, e, i) {
  const n = t.get(e), r = { previous: i, earlier: n };
  return n && (n.later = r), t.set(e, r), r;
}
function Ci(t, e, i, n) {
  const { earlier: r, later: s } = i;
  if (s) {
    s.previous = i.previous, s.earlier = r, r && (r.later = s);
    return;
  }
  n(i.previous), r && (r.later = void 0), t.get(e) === i && (r ? t.set(e, r) : t.delete(e));
}
function at(t, e, i, n) {
  try {
    const r = ze(e, i), s = r ? ot(t, r, n) : void 0, o = Lt(n, s), a = t.getOutgoingAttributes ? t.getOutgoingAttributes(n, i) : { ...t.getUserIdentities?.() ?? {}, ...o }, c = Object.keys(a).sort().filter((m) => Ke(m, t.mappedEmailSha256Key) && !T(k(a, m))).map((m) => [m, k(a, m)]), l = Object.keys(r?.preselectAttributeDefaults ?? {}), d = (m) => l.some((A) => A.toLowerCase() === m.toLowerCase()), u = {};
    for (const [m, A] of Object.entries(o))
      d(m) || (u[m] = A);
    for (const m of l) {
      const A = Object.keys(a).filter((b) => b.toLowerCase() === m.toLowerCase() && !T(a[b])).sort().map((b) => [b, a[b]]);
      A.length > 0 && (u[m] = A);
    }
    const f = JSON.stringify(u), p = [.../* @__PURE__ */ new Set([...r?.attributeKeys ?? [], ...Object.keys(o)])].filter((m) => !d(m)).sort().filter((m) => {
      const A = k(a, m);
      return A !== void 0 && A !== k(o, m);
    }).map((m) => [m, k(a, m)]), y = c.length > 0 ? `${f}|${JSON.stringify(c)}` : f, _ = p.length > 0 ? `${y}>${JSON.stringify(p)}` : y, P = Un(t.getPreselectFills?.(n, i) ?? s, a);
    return P ? { digest: ee(`${_}#${P}`), unmarkedDigest: ee(_) } : { digest: ee(_) };
  } catch {
    return {};
  }
}
function ti(t, e) {
  return t !== void 0 && e.digest !== void 0 && (t === e.digest || t === e.unmarkedDigest);
}
function ii(t, e, i, n) {
  return Ei(t, e, i.digest, n) || i.unmarkedDigest !== void 0 && Ei(t, e, i.unmarkedDigest, n);
}
function ni(t) {
  return !t.isTargetingDisabled?.() && t.isPreselectionPrivacyAllowed?.() !== !1 && t.isForwardingAllowed?.() !== !1;
}
function Fe(t, e, i, n, r, s, o, a = !1, c, l = a, d, u, f) {
  if (!ni(t))
    return !1;
  const p = c ? { intent_kind: c.replace("intent_", "") } : {}, y = ze(e, n), _ = y?.targetPageIdentifierAttribute !== void 0, P = y && _ ? Xe(y, t.filterAttributes ? t.filterAttributes(r) : r) : n;
  if (P === void 0) {
    const W = y !== void 0 && Xe(y, r) !== void 0;
    return t.logPlacementDiagnostic(
      C("missed", "no_target_page_identifier", {
        ...p,
        ...W ? { cause: "filtered" } : {}
      })
    ), !1;
  }
  const m = y ? ot(t, y, r) : {}, A = t.getOutgoingAttributes?.(r, n), b = y ? xs(t, y, r, A, m) : void 0;
  if (b)
    return t.logPlacementDiagnostic(
      C("skipped", `skip_value:${b}`, p)
    ), !1;
  const w = Ht(e, i), K = at(t, e, n, r), v = K.digest;
  if (c && ii(e, n, K, c !== "intent_cart"))
    return t.logPlacementDiagnostic(C("skipped", "active_preselection", p)), !0;
  if (a && he(w)?.byEvent)
    return t.logPlacementDiagnostic(C("skipped", "active_preselection")), !1;
  const S = v !== void 0 ? he(w) : null;
  if (v !== void 0) {
    if (ti(S?.attributesDigest, K))
      return t.logPlacementDiagnostic(C("skipped", "active_preselection", p)), !0;
    xr(
      w,
      v,
      l || !!c && he(w)?.byEvent === !0
    );
  }
  const H = Object.keys(m).filter((W) => !A || k(A, W) === m[W]);
  t.logPlacementDiagnostic(
    C("fired", s, {
      identity_types: Qe(Le(t.filteredUser)),
      ...d ? { email_source: "input" } : {},
      ...c ? {
        ...p,
        intent_route: f ? f.route : "entry",
        ...u ? { intent_source: u } : {},
        ...f ? { logged_in: f.loggedIn } : {}
      } : {},
      ...zt(t),
      ...H.length > 0 ? { defaulted_keys: H.join(",") } : {}
    })
  );
  const q = `${e}:${n}`, ue = Si(
    bi,
    q,
    is(e, n, v, c === "intent_cart")
  ), J = v !== void 0 ? Si(wi, w, S) : void 0;
  let O = !1;
  const z = () => {
    O || (O = !0, J && Ci(
      wi,
      w,
      J,
      (W) => Vr(w, W, v)
    ), Ci(
      bi,
      q,
      ue,
      (W) => ns(e, n, W, v)
    ));
  };
  return uo(t, {
    attributes: { ...r, [Cn]: o },
    preselect: !0,
    identifier: P,
    // The entry that fired travels with the call, so its defaults and cache keys never come from another entry whose
    // target value the call's identifier also matches.
    ...P !== n ? { [kt]: n } : {},
    omitUrl: !0,
    ...d ? { [Be]: { key: d, mpid: D(t.filteredUser) } } : {},
    ...f ? { [Tt]: { mpid: D(t.filteredUser), requireLogin: f.requireLogin } } : {}
  }, z), !0;
}
function fo(t, e) {
  if (!e.accountId || !e.isKitReady())
    return;
  const i = $t(e.accountId);
  if (!i)
    return;
  if (t.pending.some((o) => o.pathname === i.pathname)) {
    oe(e.accountId);
    return;
  }
  if (!e.isPreselectionEnabled()) {
    oe(e.accountId);
    return;
  }
  if (!F(e.filteredUser) || (oe(e.accountId), D(e.filteredUser) !== i.mpid))
    return;
  const n = U(e.accountId, i.pathname);
  if (!n || n.targetPageIdentifier !== i.identifier)
    return;
  if (!i.byEvent && ut(e)) {
    e.logPlacementDiagnostic(C("missed", "recovery_awaits_intent"));
    return;
  }
  const r = se(i.attributes), s = ei(e, n, r);
  if (s.length > 0) {
    for (const o of s)
      e.logPlacementDiagnostic(
        C("missed", `missing_persisted_attribute:${o}`, zt(e))
      );
    return;
  }
  Fe(
    e,
    e.accountId,
    i.identifier,
    i.identifier,
    r,
    "recovered",
    Oe("recovered", n, i.pathname)
  );
}
function ri(t) {
  return !t.isTargetingDisabled?.() && t.isPreselectionPrivacyAllowed?.() !== !1 && t.isKitReady() && t.isPreselectionEnabled();
}
function ct(t) {
  return t === void 0 ? {} : { since_trigger_ms: Date.now() - t };
}
function Wn(t, e, i) {
  if (e.waitingFor !== "intent" || e.intentSeen)
    return !1;
  const n = U(t.accountId, e.pathname);
  return !!n && n === U(t.accountId, i);
}
function Nt(t, e) {
  ri(t) && t.logPlacementDiagnostic(
    C("missed", "left_trigger_path", {
      waiting_for: e.waitingFor,
      has_identity: F(t.filteredUser),
      ...ct(e.triggeredAt)
    })
  );
}
function Ee(t, e, i, n = window.location.pathname, r, s = Date.now(), o) {
  const a = t.pending.filter((d) => d.pathname !== n);
  if (a.length > 0) {
    const d = e.accountId ? $t(e.accountId) : null;
    e.accountId && d && a.some((u) => u.pathname === d.pathname) && oe(e.accountId), a.forEach((u) => {
      Wn(e, u, n) ? t.intentWaitMovedWithin = U(e.accountId, n) : Nt(e, u);
    }), t.pending = t.pending.filter((u) => u.pathname === n);
  }
  const c = qt(t), l = c !== void 0 && c.pathname === n && _e(c.event);
  if (c && !l) {
    const d = U(e.accountId, c.pathname);
    L(c.pathname) !== L(n) && d?.releaseHoldOnRouteChange ? ($n(t, e, c, "hold_released_on_route_change"), t.pending = t.pending.filter((u) => u.pathname === c.pathname ? (Nt(e, u), !1) : !0)) : Ti(e, c, n);
  }
  go(t, e, i, n, r, s, l, o), l && t.scheduledDispatch === void 0 && Ti(e, c, n);
}
function Ti(t, e, i) {
  t.logPlacementDiagnostic(
    C("missed", "hold_cancelled", {
      held_ms: Date.now() - e.heldAt,
      same_path: e.pathname === i
    })
  );
}
function go(t, e, i, n, r, s, o, a) {
  const c = t.pending.find((d) => L(d.pathname) === L(n));
  if (a ?? (a = ke(i) ?? c?.intentSeen ?? ke(c?.event)), e.isTargetingDisabled?.() || e.isPreselectionPrivacyAllowed?.() === !1)
    return;
  const l = U(e.accountId, n);
  if (!l) {
    po(e, n);
    return;
  }
  if (!(r !== void 0 && D(e.filteredUser) !== r)) {
    if (!a && !me(l, i) && ut(e)) {
      const d = t.intentWaitMovedWithin === l;
      t.intentWaitMovedWithin = void 0;
      const u = d || c?.waitingFor === "intent" && c.awaitingIntentLogged === !0, f = e.isKitReady() && e.isPreselectionEnabled();
      te(t, e, {
        event: i,
        pathname: n,
        // Bound to an identified shopper, as a timer hold is, so another user's click never sends
        // this page view's attributes. A guest stays unbound so signing in at checkout still fires.
        triggeringUserId: r ?? (F(e.filteredUser) ? D(e.filteredUser) : void 0),
        triggeredAt: s,
        waitingFor: "intent",
        awaitingIntentLogged: u || f
      }), !u && f && e.logPlacementDiagnostic(C("held", "awaiting_intent")), f && Kt(e, l, i);
      return;
    }
    if (!e.isKitReady()) {
      if (Mn(t, e, i, n))
        return;
      const d = [], u = D(e.filteredUser);
      if (e.accountId && u && F(e.filteredUser)) {
        const { collected: f, missingKeys: p, formEmailKey: y } = le(e, i, l);
        if (p.length === 0 && !y) {
          const _ = se(f);
          (me(l, i) || !!a ? _i(
            e.accountId,
            n,
            l.targetPageIdentifier,
            _,
            u,
            !0
          ) : _i(e.accountId, n, l.targetPageIdentifier, _, u)) || d.push(C("queued", "persist_failed"));
        }
      }
      te(t, e, {
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
      if (Kt(e, l, i), !Zt(e, l)) {
        e.logPlacementDiagnostic(
          C("missed", "no_valid_identity", jn(e, l))
        ), te(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "identity" });
        return;
      }
      if (l.dispatchDelayMs !== void 0 && !me(l, i) && !De(i) && !a) {
        const d = D(e.filteredUser), u = Math.min(
          l.dispatchDelayMs,
          Math.max(0, s + l.dispatchDelayMs - Date.now())
        );
        t.scheduledDispatch = { event: i, pathname: n, heldAt: Date.now(), heldForUserId: d, triggeredAt: s }, o || e.logPlacementDiagnostic(C("held", "dispatch_delay", { delay_ms: u })), t.dispatchTimer = setTimeout(() => {
          t.dispatchTimer = void 0, t.scheduledDispatch = void 0, Gn(t, e.getCurrentHost?.() ?? e, i, n, d, s);
        }, u);
        return;
      }
      Yn(
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
function Kt(t, e, i) {
  if (!t.accountId) return;
  const n = Ne(e), r = e.readEmailInput === !0 && !!n && (Jt(t, n, i.EventAttributes ?? {}) || Vn(t, e, {}, i) !== void 0);
  qr(
    t.accountId,
    e.targetPageIdentifier,
    F(t.filteredUser) || r
  );
}
function po(t, e) {
  const i = t.accountId;
  !i || t.isKitReady() && !t.isPreselectionEnabled() || M(i).forEach((n) => {
    fn(n).some((r) => hs(r, e)) && ts(i, n.targetPageIdentifier);
  });
}
function ho(t) {
  const e = x[x.length - 1];
  return t !== void 0 && (e === void 0 || t < e.since);
}
function mo() {
  try {
    return new URL(document.referrer).origin === window.location.origin ? "same_origin" : "other_origin";
  } catch {
    return "none";
  }
}
function lt(t) {
  return t.isCheckoutIntentActive?.() === !0 && t.isPreselectionPrivacyAllowed?.() !== !1;
}
function ut(t) {
  return lt(t) && t.isLinkIntentWithheld?.() !== !0;
}
function $n(t, e, i, n, r) {
  Gn(
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
function Gn(t, e, i, n, r, s, o, a) {
  const c = U(e.accountId, n);
  if (!(!c || e.isTargetingDisabled?.() || e.isPreselectionPrivacyAllowed?.() === !1)) {
    if (!a && !me(c, i) && !De(i) && ut(e)) {
      const l = e.isKitReady() && e.isPreselectionEnabled();
      te(t, e, {
        event: i,
        pathname: n,
        triggeringUserId: r,
        triggeredAt: s,
        waitingFor: "intent",
        awaitingIntentLogged: l
      }), l && e.logPlacementDiagnostic(C("held", "awaiting_intent"));
      return;
    }
    if (!e.isKitReady()) {
      te(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "launcher" });
      return;
    }
    if (e.isPreselectionEnabled()) {
      if (!Zt(e, c)) {
        e.logPlacementDiagnostic(
          C("missed", "no_valid_identity", jn(e, c))
        ), te(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "identity" });
        return;
      }
      D(e.filteredUser) === r && Yn(t, e, i, n, c, r, s, o, a);
    }
  }
}
function Yn(t, e, i, n, r, s, o, a, c, l) {
  if (e.isPreselectionPrivacyAllowed?.() === !1) return;
  const { collected: d, missingKeys: u, formEmailKey: f } = le(e, i, r), p = t.lastResolvedPageView, y = x[x.length - 1], _ = L(n);
  if (De(i) && p && p.accountId === e.accountId && p.pathname === _ && p.route === y && p.userId === D(e.filteredUser) && p.identifier === r.targetPageIdentifier && p.attributeKeys.some(
    (w) => r.attributeKeys.includes(w) && T(k(d, w))
  ))
    return;
  if (u.length > 0) {
    const w = Le(e.filteredUser), K = Ne(r);
    for (const v of u)
      e.logPlacementDiagnostic(
        C("missed", `missing_attribute:${v}`, {
          identity_types: Qe(w),
          key_is_identity: w.some((S) => S.toLowerCase() === v.toLowerCase()),
          ...v === K ? { email_reason: oo(e, r, v, i) } : {},
          ...zt(e)
        })
      );
    te(t, e, {
      event: i,
      pathname: n,
      triggeringUserId: s,
      triggeredAt: o,
      intentSeen: c,
      waitingFor: "attribute"
    });
    return;
  }
  const P = c ?? ke(i);
  if (P && !Ue(e, d, r.targetPageIdentifier)) {
    t.noEmailLoggedPathname !== _ && (t.noEmailLoggedPathname = _, e.logPlacementDiagnostic(
      C("missed", "no_strict_email", {
        intent_kind: P.replace("intent_", ""),
        has_identity: F(e.filteredUser)
      })
    )), te(t, e, {
      event: i,
      pathname: n,
      triggeringUserId: s,
      triggeredAt: o,
      intentSeen: P,
      waitingFor: "attribute"
    });
    return;
  }
  t.noEmailLoggedPathname = void 0, l && (t.pending = t.pending.filter((w) => w !== l));
  const m = me(r, i), A = P ?? (m ? "event" : _e(i) ? "pathname" : "pageview");
  Fe(
    e,
    e.accountId || "",
    L(n),
    r.targetPageIdentifier,
    d,
    a ?? (P ? "intent" : m ? "event_trigger" : "fired"),
    Oe(A, r, n),
    m && !P,
    P,
    m,
    f,
    P ? t.intentSource : void 0
  ) && (qe(i) || m) && (t.lastResolvedPageView = {
    accountId: e.accountId,
    pathname: _,
    route: y,
    userId: D(e.filteredUser),
    identifier: r.targetPageIdentifier,
    attributeKeys: Object.keys(d)
  });
}
const yo = ["", "0", "[]", "{}", "false", "null"];
function Bn(t) {
  if (T(t)) return !1;
  if (Array.isArray(t)) return !0;
  const e = String(t).trim();
  if (yo.includes(e.toLowerCase())) return !1;
  try {
    const i = JSON.parse(e);
    return !Array.isArray(i) || i.length > 0;
  } catch {
    return !0;
  }
}
function Ae(t) {
  const e = t ? it(t) : [];
  return e.length === 1 && e[0].cartUserAttribute ? e[0] : void 0;
}
function _o(t) {
  return Ae(t) !== void 0;
}
function ki(t, e) {
  const i = Ae(t)?.cartUserAttribute;
  return g(i) && i.toLowerCase() === e.toLowerCase();
}
function Li(t, e, i) {
  const n = Ae(t)?.cartUserAttribute?.toLowerCase();
  if (!n || i && Fn(i).some((s) => s.toLowerCase() === n))
    return e;
  const r = {};
  for (const [s, o] of Object.entries(e))
    s.toLowerCase() !== n && (r[s] = o);
  return r;
}
function zn(t, e) {
  const i = t.filteredUser?.getAllUserAttributes?.() ?? {}, n = Object.keys(i).find((r) => r.toLowerCase() === e.toLowerCase());
  return n === void 0 ? void 0 : i[n];
}
function Xn(t) {
  const { search: e, hash: i } = window.location, n = /^#!|^#[^?&]*\//.test(i);
  return L(t) + e + (n ? i : "");
}
function qn(t) {
  try {
    return ee(g(t) ? t : JSON.stringify(t) ?? "");
  } catch {
    return;
  }
}
function Ri(t, e, i = window.location.pathname) {
  t.cartPageViewPathname = L(i), Jn(t, e, i);
}
function Jn(t, e, i) {
  const n = Ae(e.accountId);
  if (!n || t.cartPageViewPathname !== L(i) || // The cart entry's own route waits for its add-to-cart click, and another entry's route is a checkout step the
  // shopper reaches after the cart, where a call made for the cart page is rarely used.
  U(e.accountId, i) !== void 0 || !ni(e)) {
    t.cartPageViewPathname = void 0;
    return;
  }
  if (!e.isKitReady()) return;
  if (!e.isPreselectionEnabled()) {
    t.cartPageViewPathname = void 0;
    return;
  }
  const r = e.accountId;
  if (gs(r, n.targetPageIdentifier, ee(Xn(i)))) {
    t.cartPageViewPathname = void 0;
    return;
  }
  const s = zn(e, n.cartUserAttribute);
  if (!(Bn(s) || Zr(r, D(e.filteredUser))) || !F(e.filteredUser)) return;
  const a = qn(s);
  if (a !== void 0 && ds(r, n.targetPageIdentifier, a, D(e.filteredUser)))
    return;
  const { collected: c, missingKeys: l } = le(e, ms, n, !1);
  if (l.length > 0 || !Ue(e, c, n.targetPageIdentifier)) return;
  t.cartPageViewPathname = void 0;
  const d = at(e, r, n.targetPageIdentifier, c), u = he(Ht(r, n.targetPageIdentifier));
  ii(r, n.targetPageIdentifier, d) || ti(u?.attributesDigest, d) || Fe(
    e,
    r,
    n.targetPageIdentifier,
    n.targetPageIdentifier,
    c,
    "fired",
    Oe("pageview_cart", n),
    !1,
    void 0,
    !1,
    void 0,
    void 0,
    { requireLogin: !1 }
  );
}
function Eo(t, e, i = window.location.pathname) {
  if (fo(t, e), Ps(t, e), t.cartPageViewPathname !== void 0 && Jn(t, e, i), t.pending.length === 0)
    return;
  const n = t.pending;
  t.pending = [], n.forEach((r) => {
    const { event: s, pathname: o, storedDiagnostics: a, triggeringUserId: c, triggeredAt: l, waitingFor: d, intentSeen: u } = r, f = ri(e), p = F(e.filteredUser), y = ct(l);
    if (f && d === "identity" && p && e.logPlacementDiagnostic(
      C("identity_arrived", "pending_identity", {
        ...y,
        on_trigger_path: o === i
      })
    ), o !== i) {
      Wn(e, r, i) ? t.intentWaitMovedWithin = U(e.accountId, i) : Nt(e, { waitingFor: d, triggeredAt: l });
      return;
    }
    if (d === "intent" && !u) {
      const _ = U(e.accountId, o);
      if (_ && ut(e)) {
        !r.awaitingIntentLogged && e.isKitReady() && e.isPreselectionEnabled() && (e.logPlacementDiagnostic(C("held", "awaiting_intent")), Kt(e, _, s), r.awaitingIntentLogged = !0), t.pending.push(r);
        return;
      }
    }
    f && a?.forEach((_) => e.logPlacementDiagnostic(_)), t.scheduledDispatch?.pathname !== o && Ee(t, e, s, o, c, l, u);
  });
}
function Io(t, e, i, n = i) {
  if (!t.accountId || !ri(t))
    return;
  const r = Tn(t.accountId, e, n);
  if (!r)
    return;
  const s = Ae(t.accountId);
  if (s?.targetPageIdentifier === r.targetPageIdentifier) {
    const c = Xn(window.location.pathname);
    c !== "/" && fs(t.accountId, r.targetPageIdentifier, ee(c));
    const l = zn(t, s.cartUserAttribute);
    us(
      t.accountId,
      r.targetPageIdentifier,
      Bn(l) ? qn(l) : void 0,
      D(t.filteredUser)
    );
  }
  const o = ls(t.accountId, r.targetPageIdentifier);
  if (!o || (lt(t) && t.isForwardingAllowed?.() !== !1 && t.logPlacementDiagnostic(
    C("arrived", "intent_arrival", {
      ...Ao(o),
      ...vo(o, i)
    })
  ), o.firedAt !== void 0))
    return;
  const a = o.triggeredAt !== void 0;
  t.logPlacementDiagnostic(
    C("missed", "arrival_without_fire", {
      trigger_seen: a,
      identity_seen_on_trigger_path: o.identitySeenAt !== void 0,
      has_identity: F(t.filteredUser),
      // Another tab's checkout caches its offers in that tab, so this arrival still misses. This tab's
      // own trigger counts too: the device marker can expire, be cleared by another tab or fail to save.
      trigger_seen_any_tab: a || Jr(t.accountId, r.targetPageIdentifier),
      ...ct(o.triggeredAt),
      near_miss_seen: ho(o.nearMissAt),
      // Page memory loses the trigger record on a full navigation, so trigger_seen reads false.
      storage: sr() ? "page" : "device",
      referrer: mo()
    })
  );
}
function Ao(t) {
  const e = t.intentAt === void 0 || t.intentKind === void 0 ? "none" : bo(Date.now() - t.intentAt);
  return {
    intent_seen: e === "none" ? "none" : t.intentKind,
    lead: e,
    fired: t.firedAt !== void 0
  };
}
function vo(t, e) {
  const i = br(e), n = t.paymentPickAt === void 0 ? -1 : Date.now() - t.paymentPickAt, r = t.paymentPick && n >= 0 && n < ye ? t.paymentPick : "none";
  if (r === "none" && i === "absent")
    return {};
  const s = t.firedAt === void 0 ? -1 : Date.now() - t.firedAt, o = t.paymentAtFire && s >= 0 && s < ye ? t.paymentAtFire : "none";
  return {
    payment_guess: o,
    payment_pick: r,
    payment_arrival: i,
    payment_match: o !== "none" && i !== "absent" && i !== "other" ? o === i : "n/a"
  };
}
const Po = [
  [1e3, "lt1s"],
  [2e3, "1s_2s"],
  [5e3, "2s_5s"],
  [1e4, "5s_10s"],
  [2e4, "10s_20s"],
  [6e4, "20s_60s"],
  [3e5, "60s_300s"],
  [ye, "300s_1800s"]
];
function bo(t) {
  if (t < 0)
    return "none";
  const e = Po.find(([i]) => t < i);
  return e ? e[1] : "none";
}
function wo() {
  return {
    context: null,
    lifecycle: "idle",
    recreateInFlight: null
  };
}
function So(t, e) {
  t.context = {
    accountId: e.accountId,
    launcherOptions: { ...e.launcherOptions },
    legacyRoktExtensions: [...e.legacyRoktExtensions]
  };
}
function Co(t) {
  t.lifecycle = "attached";
}
function To(t) {
  t.lifecycle !== "idle" && (t.lifecycle = "terminated");
}
function ko(t) {
  t.lifecycle = "terminated";
}
function Lo(t) {
  t.context = null, t.lifecycle = "idle", t.recreateInFlight = null;
}
function Ro(t, e, i) {
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
const Di = "rokt:intent", Oi = "LEAD_CAPTURE_SUBMITTED";
class Do {
  constructor(e) {
    this.handlers = e, this.config = null, this.dispatchedForPageView = !1;
  }
  configure(e) {
    this.config = e, this.dispatchedForPageView = !1, this.detachListeners(), this.isIdentityCaptureBridgeEnabled(this.config) && (this.leadCaptureSubmittedListener = (i) => {
      const n = this.parseLeadCaptureSubmittedPayload(i);
      n && this.handlers.onLeadCaptureSubmitted(n);
    }, window.addEventListener(Oi, this.leadCaptureSubmittedListener)), this.isExitIntentBridgeEnabled(this.config) && (this.exitIntentListener = (i) => this.handleExitIntentEvent(i), window.addEventListener(Di, this.exitIntentListener));
  }
  resetPageViewState() {
    this.dispatchedForPageView = !1;
  }
  dispose() {
    this.detachListeners(), this.config = null, this.dispatchedForPageView = !1;
  }
  detachListeners() {
    this.exitIntentListener && (window.removeEventListener(Di, this.exitIntentListener), this.exitIntentListener = void 0), this.leadCaptureSubmittedListener && (window.removeEventListener(Oi, this.leadCaptureSubmittedListener), this.leadCaptureSubmittedListener = void 0);
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
    const n = i.body, r = g(n.email) ? n.email : void 0, s = g(n.mobile_number) ? n.mobile_number : void 0, o = {};
    g(r) && r.length > 0 && (o.email = r), g(s) && s.length > 0 && (o.mobile_number = s);
    const a = {}, c = this.allowCustomUserAttributes(this.config), l = this.getAllowedUserAttributeKeys(this.config);
    this.mergeLeadCaptureUserAttributes(
      a,
      E(n.userAttributes) ? n.userAttributes : null,
      c,
      l
    );
    const d = g(n.rclid) ? n.rclid : void 0;
    d && d.length > 0 && (a.rokt_rclid = d);
    const u = g(n.accountID) ? n.accountID : void 0;
    u && u.length > 0 && (a.rokt_account_id = u);
    const f = g(n.referralCreativeID) ? n.referralCreativeID : void 0;
    return f && f.length > 0 && (a.rokt_referral_creative_id = f), { identities: o, userAttributes: a };
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
const V = "Rokt", Oo = 7, He = 181, No = "selectPlacements", Ko = ["paypalpayerid"], Uo = "Auto Button Click", Fo = "Auto Link Click", Ni = "rokt_placement", Mo = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/, xo = 500, Vo = "apps.roktecommerce.com", jo = 0.1, Ho = "ThankYouPageJourney", Wo = "rokt-launcher", $o = "rokt-thank-you-element", Go = "userIdentifiedInWorkspace", Ki = 3, Yo = 2, Bo = "page_events", zo = "page_view_attributes", Xo = "mparticle_session_id", Ui = "mparticle_device_id", Et = "exit-intent", qo = [
  "3479519924056514560",
  "3484183287406608384",
  "3198447216177237634",
  "3292347205549055462"
], Jo = "exit-intent-placement", Fi = 500, si = {
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  UNHANDLED_EXCEPTION: "UNHANDLED_EXCEPTION",
  IDENTITY_REQUEST: "IDENTITY_REQUEST",
  LOG_DELIVERY_FAILURE: "LOG_DELIVERY_FAILURE"
}, Se = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARNING: "WARNING"
}, Qo = "apps.rokt-api.com", Zo = "/v1/log", ea = "/v1/errors", ta = 10;
function h() {
  return window.mParticle;
}
function Mi(t, e) {
  const n = [dt(t), "/wsdk/integrations/launcher.js"].join("");
  return !e || e.length === 0 ? n : n + "?extensions=" + e.join(",");
}
function xi(t) {
  return [dt(t), "/rokt-elements/rokt-element-thank-you.js"].join("");
}
function dt(t) {
  const e = t !== void 0 ? t : Qo;
  return e.includes("://") ? e.replace(/\/+$/, "") : ["https://", e].join("");
}
function Qn(t, e, i) {
  if (t)
    return t.startsWith("http://") || t.startsWith("https://") ? t : "https://" + t;
  const r = e?.includes("://") && !/^https?:\/\//i.test(e) ? void 0 : e;
  return dt(r) + i;
}
function Vi(t, e, i) {
  if (document.getElementById(t)) return;
  const n = document.head || document.body, r = document.createElement("script");
  r.id = t, r.type = "text/javascript", r.src = e, r.async = !0, r.crossOrigin = "anonymous", r.fetchPriority = "high", i?.onLoad && (r.onload = i.onLoad), i?.onError && (r.onerror = i.onError), n.appendChild(r);
}
function We(t) {
  if (!t)
    return [];
  const e = Xi(t);
  return e === void 0 ? (console.error("Settings string contains invalid JSON"), []) : e;
}
function ji(t) {
  const e = t ? We(t) : [], i = [], n = [];
  let r = !1;
  for (let s = 0; s < e.length; s++) {
    const o = e[s].value;
    o === "thank-you-journey" ? (r = !0, n.push(Ho)) : i.push(o);
  }
  return {
    roktExtensionsQueryParams: i,
    legacyRoktExtensions: n,
    loadThankYouElement: r
  };
}
async function ia(t, e) {
  const i = [];
  if (e)
    for (const n of t)
      i.push(e.use(n));
  return Promise.all(i);
}
function Hi(t) {
  if (!t)
    return {};
  const e = {};
  for (let i = 0; i < t.length; i++) {
    const n = t[i];
    e[n.jsmap] = n.value;
  }
  return e;
}
function Wi(t) {
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
function $i(t, e, i) {
  return h().generateHash([t, e, i].join(""));
}
function na(t) {
  let n = "mParticle_wsdkv_" + h().getVersion() + "_kitv_" + "3.34.0";
  return t && (n += "_" + t), n;
}
function Gi(t) {
  return !!(t && qo.includes(t));
}
function Ut(t) {
  const e = document.createElement("iframe");
  e.style.display = "none", e.setAttribute("sandbox", "allow-scripts allow-same-origin"), e.src = t, e.onload = function() {
    e.onload = null, e.parentNode && e.parentNode.removeChild(e);
  };
  const i = document.body || document.head;
  i && i.appendChild(e);
}
function Yi(t, e) {
  const i = ee(window.location.origin);
  if (Ie._allowedOriginHashes.indexOf(i) === -1 || Math.random() >= jo)
    return;
  const r = window.__rokt_li_guid__;
  if (!r || t && t.includes("://") && !/^https:\/\//i.test(t))
    return;
  const s = Mt(window.location.href), o = "version=" + encodeURIComponent(e ?? "") + "&launcherInstanceGuid=" + encodeURIComponent(r) + "&pageUrl=" + encodeURIComponent(s), a = t ? dt(t) : "https://apps.rokt.com";
  Ut(a + "/v1/wsdk-init/index.html?" + o), Ut(
    "https://" + Vo + "/v1/wsdk-init/index.html?" + o + "&isControl=true"
  );
}
function ra() {
  return typeof window < "u" && !!window.location?.search?.toLowerCase().includes("mp_enable_logging=true");
}
function sa() {
  if (typeof window > "u")
    return;
  const t = window.location?.href;
  return t ? Mt(t) : void 0;
}
function oa() {
  return typeof window < "u" ? window.navigator?.userAgent : void 0;
}
class Zn {
  constructor() {
    this._logCount = {};
  }
  incrementAndCheck(e) {
    const n = (this._logCount[e] || 0) + 1;
    return this._logCount[e] = n, n > ta;
  }
}
class Ce {
  constructor(e, i, n, r, s) {
    this._reporter = "mp-wsdk";
    const o = e.isLoggingEnabled;
    this._integrationName = i || "", this._launcherInstanceGuid = n, this._accountId = r || null, this._rateLimiter = s || new Zn(), this._isEnabled = ra() || o;
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
          code: r || si.UNKNOWN_ERROR,
          url: sa(),
          deviceInfo: oa(),
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
class Bi {
  constructor(e, i, n, r, s) {
    this._transport = new Ce(e, i, n, r, s), this._errorUrl = Qn(e?.errorUrl, e?.integrationDomain, ea);
  }
  report(e) {
    if (!e) return;
    const i = e.severity || Se.ERROR;
    this._transport.send(this._errorUrl, i, e.message, e.code, e.stackTrace);
  }
}
class zi {
  constructor(e, i, n, r, s, o) {
    this._intentObserveLines = 0, this._transport = new Ce(e, n, r, s, o), this._placementDiagnosticTransport = new Ce(
      e,
      n,
      r,
      s
    ), this._preselectOutcomeTransport = new Ce(e, n, r, s), this._loggingUrl = Qn(e?.loggingUrl, e?.integrationDomain, Zo), this._errorReportingService = i;
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
      Se.INFO,
      i.message,
      i.code,
      void 0,
      (n) => {
        if (this._errorReportingService) {
          const r = typeof n.statusCode == "number";
          this._errorReportingService.report({
            message: "LoggingService: Failed to send log: " + n.message,
            code: si.LOG_DELIVERY_FAILURE,
            severity: r ? Se.ERROR : Se.WARNING
          });
        }
      }
    );
  }
}
function aa(t, e) {
  const i = $e(window.location.href), n = t.EventAttributes?.title, r = g(n) ? n : void 0, s = tn(t.EventAttributes, e) ? r : r || document.title, o = gr(), a = t.ActiveTimeOnSite;
  return {
    pageUrl: i,
    sourceMessageId: t.SourceMessageId,
    timestamp: t.Timestamp,
    ...s ? { pageTitle: s } : {},
    ...o !== void 0 ? { canonicalUrl: o } : {},
    ...Number.isFinite(a) ? { activeTimeOnSite: a } : {}
  };
}
const X = class X {
  constructor() {
    this.name = V, this.id = He, this.moduleId = He, this.isInitialized = !1, this.launcher = null, this.filters = {}, this.userAttributes = {}, this.userIdentifiedInWorkspace = !1, this.testHelpers = null, this.placementEventMappingLookup = {}, this.placementEventAttributeMappingLookup = {}, this.integrationName = null, this.errorReportingService = null, this.loggingService = null, this._thankYouElementOnLoadCallback = null, this._isThankYouElementLoaded = !1, this._workspaceSearchInFlightPromise = null, this._launcherAttachState = wo(), this._exitIntentConfig = null, this._exitIntentWatcher = new Do({
      isKitReady: () => this.isKitReady(),
      onExitIntent: (e, i) => this.handleExitIntent(e, i),
      onLeadCaptureSubmitted: (e) => this.applyIdentityCapturePayload(e.identities, e.userAttributes)
    }), this._exitIntentEnabledForAccount = !1, this._pendingInitWarnings = [], this.accountId = null, this._preselectState = Js(), this._identityCallCount = 0, this._lastNonModifyCallCount = 0, this._isModifyIdentityCallInProgress = !1;
  }
  // ---- Private helpers ----
  getEventAttributeValue(e, i) {
    const n = e && e.EventAttributes;
    if (!n)
      return null;
    const r = k(n, i);
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
  capturePageView(e, i) {
    let n;
    try {
      n = Mt(window.location.href);
      const r = mi(), s = aa(e, i);
      r.push(s);
      const o = Math.min(r.length, Zi), a = lr(r);
      if (a === 0) {
        const c = It() ? "quota" : "ls_unavailable";
        this.loggingService?.log({
          message: `Rokt Kit: Failed to persist page view for ${n} [reason: ${c}]`,
          code: "PAGE_VIEW_CAPTURE_FAILED"
        });
      } else a < o && this.loggingService?.log({
        message: `Rokt Kit: Page view storage reduced from ${o} to ${a} record(s) under quota pressure [reason: quota_eviction]`,
        code: "PAGE_VIEW_QUOTA_EVICTION"
      });
    } catch (r) {
      const s = It() ? "exception" : "ls_unavailable", o = r instanceof Error ? r.message : String(r);
      this.loggingService?.log({
        message: `Rokt Kit: Failed to capture page view for ${n}: ${o} [reason: ${s}]`,
        code: "PAGE_VIEW_CAPTURE_FAILED"
      });
    }
  }
  isPreselectionEnabled() {
    return this.launcher?.enablePreselection === !0;
  }
  // The entry a target page's own call goes to, matched on the call's own attributes as well as its identifier.
  findCacheConfigEntry(e, i) {
    if (this.isPreselectionEnabled())
      return Tn(this.accountId, e, i);
  }
  // The entry a speculative call was fired for, by the targetPageIdentifier its fire keys its records under.
  findFiredEntry(e) {
    if (this.isPreselectionEnabled())
      return ze(this.accountId, e);
  }
  // What the speculative call for the entry keyed entryKey fills in over these attributes, the ones it was fired with.
  // An identity the call carries already holds its key, so a default never stands in for it.
  buildPreselectAttributeDefaults(e, i) {
    const n = this.findFiredEntry(e);
    if (!n)
      return;
    const r = ot(this.buildPreselectHost(), n, i), s = this.filters || {};
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
      getCurrentUser: () => h().Identity?.getCurrentUser?.(),
      getCurrentHost: () => this.buildPreselectHost(),
      isTargetingDisabled: () => this.isTargetingDisabled(),
      getUserIdentities: () => this.returnUserIdentities(this.filters.filteredUser),
      getOutgoingAttributes: (e, i) => this.getOutgoingPreselectAttributes(e, i),
      filterAttributes: (e) => this.filterPreselectAttributes(e),
      getPreselectFills: (e, i) => this.buildPreselectAttributeDefaults(i, e),
      mappedEmailSha256Key: this._mappedEmailSha256Key,
      isForwardingAllowed: () => this.isForwardingAllowed(),
      isCheckoutIntentActive: () => this.isCheckoutIntentActive(),
      isLinkIntentWithheld: () => this.isLinkIntentWithheld(),
      isEmailIdentityFiltered: () => this.isEmailIdentityFiltered()
    };
  }
  flushPendingPreselectDispatches() {
    Eo(this._preselectState, this.buildPreselectHost());
  }
  isLauncherReadyToAttach() {
    return !!window.Rokt && G(window.Rokt.createLauncher);
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
    return n && e[n] && (i[X.EMAIL_SHA256_KEY] = e[n]), n && delete i[n], i;
  }
  logSelectPlacementsEvent(e) {
    if (!window.mParticle || typeof h().logEvent != "function" || !E(e))
      return;
    const i = h().EventType.Other, n = {}, r = Object.keys(e);
    for (let s = 0; s < r.length; s++)
      Ko.indexOf(r[s].toLowerCase()) === -1 && (n[r[s]] = e[r[s]]);
    h().logEvent(No, i, n);
  }
  setRoktSessionId(e) {
    if (!(!e || typeof e != "string"))
      try {
        const i = h().getInstance();
        i && G(i.setIntegrationAttribute) && i.setIntegrationAttribute(He, {
          roktSessionId: e
        });
      } catch {
      }
  }
  readMpSessionId() {
    const e = h()?.sessionManager, i = e?.getSessionId ?? e?.getSession;
    if (G(i))
      return i.call(e) || void 0;
  }
  readMpDeviceId() {
    if (!this.isDeviceIdDisabled())
      return h()?.getDeviceId?.() || void 0;
  }
  attachLauncher(e, i, n = []) {
    So(this._launcherAttachState, {
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
      await ia([...n], o), this.initRoktLauncher(o);
    }).catch((o) => {
      const a = this._launcherAttachState.lifecycle === "attached";
      if (ko(this._launcherAttachState), !a) {
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
    return Ro(
      this._launcherAttachState,
      this.isLauncherReadyToAttach(),
      (e) => this.attachLauncher(e.accountId, e.launcherOptions, e.legacyRoktExtensions)
    );
  }
  initRoktLauncher(e) {
    window.Rokt && (window.Rokt.currentLauncher = e), this.launcher = e, Co(this._launcherAttachState);
    const i = h().Rokt?.filters;
    i ? (!this.isInitialized && this.filters.filteredUser && (i.filteredUser = this.filters.filteredUser), this.filters = i, i.filteredUser ? this._workspaceSearchInFlightPromise = this.search(i.filteredUser) : console.warn("Rokt Kit: No filtered user has been set.")) : console.warn("Rokt Kit: No filters have been set."), this.isInitialized = !0, Yi(this.domain, this.integrationName), h().Rokt.attachKit(this), this.pushExitIntentExtensionConfig(), this.flushPendingPreselectDispatches();
  }
  // Leaving the hook unset is what keeps History unpatched for workspaces that never
  // preselect. The core SDK reads onCheckoutIntent when it has a signal, so an account without
  // pre-selection entries never hears one.
  armPreselectPathnameTrigger() {
    yt(window.location.pathname), this.onRouteChange = we(this.accountId) ? () => this.evaluatePreselectPathname() : void 0, this.armPreselectEmailInputListener(), this.onCheckoutIntent = we(this.accountId) ? (e) => {
      try {
        ws(this._preselectState, this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0, this.checkoutIntentSelectors = Ws(this.accountId), this.onPaymentPick = we(this.accountId) ? (e) => {
      try {
        Ls(this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0;
  }
  // A guest often types their email after the trigger page view has queued for want of one, so a
  // committed email input retries the queue. Only accounts with an entry that reads the form listen.
  armPreselectEmailInputListener() {
    this._preselectEmailInputListener && (document.removeEventListener("input", this._preselectEmailInputListener, !0), document.removeEventListener("change", this._preselectEmailInputListener, !0), document.removeEventListener("blur", this._preselectEmailInputListener, !0), this._preselectEmailInputListener = void 0), co(this.accountId) && (this._preselectEmailInputListener = (e) => {
      Ot(e), e.type === "change" && this._preselectState.pending.length > 0 && ao(this._preselectState, this.buildPreselectHost(), e) && this.flushPendingPreselectDispatches();
    }, document.addEventListener("input", this._preselectEmailInputListener, !0), document.addEventListener("change", this._preselectEmailInputListener, !0), document.addEventListener("blur", this._preselectEmailInputListener, !0));
  }
  // A core released without the check reads false, so its page views are judged by their marker alone.
  isAutoLogPageViewOn() {
    const e = h().Rokt;
    try {
      return G(e?.isAutoLogPageViewEnabled) && e.isAutoLogPageViewEnabled() === !0;
    } catch {
      return !1;
    }
  }
  // True while the core SDK says the confirm click can be waited for: auto button tracking is on, no
  // opt-out or privacy option suppresses it, and the browser supports the detector. A core released
  // without the check reads false, so its entries keep dispatchDelayMs.
  isCheckoutIntentActive() {
    const e = h().Rokt;
    try {
      return G(e?.isCheckoutIntentLive) && e.isCheckoutIntentLive() === !0;
    } catch {
      return !1;
    }
  }
  // True when the core SDK gives link clicks no checkout intent because this connection does not receive Auto Link
  // Click events. A core released without the check reads false, and turns intent off entirely in that case.
  isLinkIntentWithheld() {
    const e = h().Rokt;
    try {
      return G(e?.areAutoLinkClicksForwarded) && e.areAutoLinkClicksForwarded() === !1;
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
    if (Jt(this.buildPreselectHost(), e)) return "partner_email";
  }
  // Whether this connection filters out the Email identity, or the identity mapped to the hashed email.
  isEmailIdentityFiltered() {
    const e = this.userIdentityFilters || [];
    if (e.includes(Oo))
      return !0;
    const i = this._mappedEmailSha256Key, n = h().IdentityType || {}, r = i ? Object.keys(n).find((o) => o.toLowerCase() === i) : void 0, s = r ? n[r] : void 0;
    return typeof s == "number" && e.includes(s);
  }
  evaluatePreselectPathname() {
    const e = window.location.pathname;
    yt(e), e !== this._lastPreselectPathname && (this.isTargetingDisabled() || (this._lastPreselectPathname = e, $s(this._preselectState, this.buildPreselectHost(), e), Ri(this._preselectState, this.buildPreselectHost(), e)));
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
    return h().Rokt?.launcherOptions?.noTargeting === !0 || this.isDeviceIdDisabled();
  }
  // Core's normalizeRoktLauncherOptions turns noDeviceId or noDeviceID into noDeviceId, noFunctional and
  // noTargeting, but an older core passes either spelling through as written, so the kit applies the same rule.
  isDeviceIdDisabled() {
    const e = h()?.Rokt?.launcherOptions;
    return e?.noDeviceId === !0 || e?.noDeviceID === !0;
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
    return Gi(e) ? {
      identifier: Jo,
      signals: {
        mouseExitTop: !0,
        scrollUpFast: !0,
        idle: !0
      }
    } : null;
  }
  applyExitIntentExtensionOverride(e, i) {
    return e ? i.includes(Et) ? i : [...i, Et] : i;
  }
  extractExitIntentIdentifier(e) {
    return e ? g(e.identifier) && e.identifier.length > 0 ? e.identifier : g(e.placementIdentifier) && e.placementIdentifier.length > 0 ? e.placementIdentifier : null : null;
  }
  applyIdentityCapturePayload(e, i) {
    const n = {}, r = e.email;
    g(r) && r.length > 0 && (n.email = r);
    const s = e.mobile_number;
    g(s) && s.length > 0 && (n.mobile_number = s);
    const o = h().Identity?.modify;
    if (G(o) && Object.keys(n).length > 0)
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
    this._exitIntentConfig = this.isTargetingDisabled() ? null : e, this._exitIntentWatcher.configure(this._exitIntentConfig);
  }
  handleExitIntent(e, i) {
    if (!this._exitIntentConfig)
      return !1;
    const n = this.extractExitIntentIdentifier(this._exitIntentConfig);
    if (!n)
      return !1;
    try {
      const r = h().Rokt?.selectPlacements?.({
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
    !this._exitIntentConfig || !G(window.Rokt?.setExtensionData) || window.Rokt.setExtensionData({
      [Et]: this._exitIntentConfig
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
    const o = h().Rokt?.launcherOptions?.noFunctional === !0 || this.isDeviceIdDisabled();
    rr(o), o || this.isTargetingDisabled() ? or() : (jr(), $r()), this.isPageHistoryAllowed() || (ht(), mt());
    const a = e, c = a.accountId;
    this._identityCallCount = 0, this._lastNonModifyCallCount = 0, this._isModifyIdentityCallInProgress = !1, this._exitIntentEnabledForAccount = Gi(c);
    const l = this._exitIntentEnabledForAccount ? this.getEffectiveExitIntentConfig(c) : null;
    this._exitIntentEnabledForAccount ? this.configureExitIntentBridge(l) : this.configureExitIntentBridge(null), this.accountId = c || null;
    const d = this.accountId ? ps(this.accountId, a.preselectionConfig) : void 0;
    this.userAttributes = se(s), this.armPreselectPathnameTrigger(), this._onboardingExpProvider = a.onboardingExpProvider;
    const u = We(a.placementEventMapping);
    this.placementEventMappingLookup = Hi(u);
    const f = We(
      a.placementEventAttributeMapping
    );
    this.placementEventAttributeMappingLookup = Wi(f), a.hashedEmailUserIdentityType && (this._mappedEmailSha256Key = a.hashedEmailUserIdentityType.toLowerCase()), this._workspaceIdSyncApiKey = g(a.workspaceIdSyncApiKey) ? a.workspaceIdSyncApiKey : void 0;
    const p = h().Rokt?.domain, { roktExtensionsQueryParams: y, legacyRoktExtensions: _, loadThankYouElement: P } = ji(
      a.roktExtensions
    ), m = this.applyExitIntentExtensionOverride(
      l,
      y
    ), A = {
      ...h().Rokt?.launcherOptions || {}
    };
    this.integrationName = na(A.integrationName), A.integrationName = this.integrationName, this.domain = p;
    const b = {
      loggingUrl: a.loggingUrl,
      errorUrl: a.errorUrl,
      integrationDomain: p,
      isLoggingEnabled: h().config?.isLoggingEnabled === !0
    }, w = new Bi(
      b,
      this.integrationName,
      window.__rokt_li_guid__,
      a.accountId
    ), K = new zi(
      b,
      w,
      this.integrationName,
      window.__rokt_li_guid__,
      a.accountId
    );
    return this.errorReportingService = w, this.loggingService = K, this._flushInitWarnings(), d && K.log({
      message: `Rokt Kit: preselectionConfig setting is invalid [reason=${d}], using the built-in preselection config`,
      code: "PRESELECT_CONFIG_INVALID"
    }), h()._registerErrorReportingService && h()._registerErrorReportingService(w), h()._registerLoggingService && h()._registerLoggingService(K), n ? (this.testHelpers = {
      generateLauncherScript: Mi,
      generateThankYouElementScript: xi,
      extractRoktExtensionConfig: ji,
      hashEventMessage: $i,
      parseSettingsString: We,
      generateMappedEventLookup: Hi,
      generateMappedEventAttributeLookup: Wi,
      sendAdBlockMeasurementSignals: Yi,
      createAutoRemovedIframe: Ut,
      djb2: ee,
      setAllowedOriginHashes: (v) => {
        X._allowedOriginHashes = v;
      },
      ReportingTransport: Ce,
      ErrorReportingService: Bi,
      LoggingService: zi,
      RateLimiter: Zn,
      ErrorCodes: si,
      WSDKErrorSeverity: Se,
      resetLauncherAttachState: () => Lo(this._launcherAttachState)
    }, this.attachLauncher(c, A), "Successfully initialized: " + V) : (P && (h().Rokt.flushOnShoppableAdsReadyMessageQueue?.(this), Vi($o, xi(p), {
      onLoad: () => {
        this._isThankYouElementLoaded = !0, this._thankYouElementOnLoadCallback && this._thankYouElementOnLoadCallback();
      },
      onError: (v) => {
        console.error("Error loading Rokt Thank You Element script:", v);
      }
    })), this.isLauncherReadyToAttach() ? this.attachLauncher(c, A, _) : (Vi(Wo, Mi(p, m), {
      onLoad: () => {
        this.isLauncherReadyToAttach() ? this.attachLauncher(c, A, _) : console.error("Rokt object is not available after script load.");
      },
      onError: (v) => {
        console.error("Error loading Rokt launcher script:", v);
      }
    }), this.captureTiming(X.PERFORMANCE_MARKS.RoktScriptAppended)), "Successfully initialized: " + V);
  }
  process(e) {
    if (e.EventDataType === Ki && yt(window.location.pathname), !this.isTargetingDisabled()) {
      if (e.EventDataType === Ki) {
        if (this._exitIntentEnabledForAccount && this._exitIntentWatcher.resetPageViewState(), this.isPageHistoryAllowed()) {
          const i = this.isAutoLogPageViewOn();
          dr(this.loggingService, e.EventAttributes, i), this.capturePageView(e, i);
        } else
          ht(), mt();
        Ee(this._preselectState, this.buildPreselectHost(), e), Ri(this._preselectState, this.buildPreselectHost());
      }
      Ye(e) && ks(this.buildPreselectHost(), e), Gs(this.accountId, e.EventName) && Xs(this._preselectState, this.buildPreselectHost(), e);
    }
    if (e.EventDataType === Yo && (ht(), mt(), qt(this._preselectState), this.accountId && (oe(this.accountId), yi(this.accountId), Ii(this.accountId))), !this.isKitReady())
      return "Kit not ready for forwarder: " + V;
    if (G(h().Rokt?.setLocalSessionAttribute) && !Ye(e) && (T(this.placementEventAttributeMappingLookup) || this.applyPlacementEventAttributeMapping(e), !T(this.placementEventMappingLookup))) {
      const i = $i(e.EventDataType, e.EventCategory, e.EventName ?? "");
      this.placementEventMappingLookup[String(i)] && h().Rokt.setLocalSessionAttribute?.(this.placementEventMappingLookup[String(i)], !0);
    }
    return "Successfully sent to forwarder: " + V;
  }
  setExtensionData(e) {
    if (!this.isKitReady()) {
      console.error("Rokt Kit: Not initialized");
      return;
    }
    window.Rokt.setExtensionData(e);
  }
  setUserAttribute(e, i) {
    Ft(e) || (this.userAttributes[e] = i);
    const n = ki(this.accountId, e);
    return n && this.forgetCartAdd(), (qs(this.accountId, e) || Ke(e, this._mappedEmailSha256Key) || n) && this.flushPendingPreselectDispatches(), "Successfully set user attribute for forwarder: " + V;
  }
  // The page's cart attribute or a logout replaces a remembered add-to-cart click. Under noTargeting, or for an account
  // that never remembers one, nothing is written to the device.
  forgetCartAdd() {
    this.accountId && es(this.accountId, !this.isTargetingDisabled() && _o(this.accountId));
  }
  removeUserAttribute(e) {
    return delete this.userAttributes[e], ki(this.accountId, e) && this.forgetCartAdd(), "Successfully removed user attribute for forwarder: " + V;
  }
  handleIdentityComplete(e, i) {
    return this.userAttributes = se(e.getAllUserAttributes()), "Successfully called " + i + " for forwarder: " + V;
  }
  onUserIdentified(e) {
    this._isModifyIdentityCallInProgress ? this._isModifyIdentityCallInProgress = !1 : (this._identityCallCount += 1, this._lastNonModifyCallCount = this._identityCallCount);
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
    return this._isModifyIdentityCallInProgress = !1, this._identityCallCount += 1, this._lastNonModifyCallCount = this._identityCallCount, this.handleIdentityComplete(e, "onLoginComplete");
  }
  onLogoutComplete(e, i) {
    return this._isModifyIdentityCallInProgress = !1, this._identityCallCount += 1, this._lastNonModifyCallCount = this._identityCallCount, this.userIdentifiedInWorkspace = !1, this._workspaceSearchInFlightPromise = null, this._workspaceLastSearchedIdentitiesKey = void 0, this.accountId && (oe(this.accountId), yi(this.accountId), Ii(this.accountId), this.forgetCartAdd()), this.handleIdentityComplete(e, "onLogoutComplete");
  }
  onModifyComplete(e, i) {
    return this._identityCallCount += 1, this._isModifyIdentityCallInProgress = !0, h()?.Identity?.getCurrentUser?.()?.isLoggedIn?.() === !0 && (this._lastNonModifyCallCount = this._identityCallCount), this.handleIdentityComplete(e, "onModifyComplete");
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
        new Promise((o) => setTimeout(o, Fi))
      ]) : Promise.resolve();
      return Promise.all([n, s]).then(
        () => this._dispatchPlacements(e, i)
      );
    }
    if (this._workspaceSearchInFlightPromise) {
      const r = this._workspaceSearchInFlightPromise;
      return Promise.race([
        r,
        new Promise((s) => setTimeout(s, Fi))
      ]).then(() => this._dispatchPlacements(e, i));
    }
    return this._dispatchPlacements(e);
  }
  // Whether a pre-selection call's identifier is still the value of its entry's targetPageIdentifierAttribute among the
  // attributes the workspace's attribute filter lets the call send. A call for an entry with a fixed
  // targetPageIdentifier always is. The entry is the one the fire named, else the one its identifier keys.
  isPreselectTargetAllowed(e, i) {
    const n = i.identifier, r = g(e) ? e : g(n) ? n : void 0, s = ze(this.accountId, r);
    if (s?.targetPageIdentifierAttribute === void 0)
      return !0;
    const o = E(i.attributes) ? i.attributes : {};
    return Xe(s, this.filterPreselectAttributes(o)) === n;
  }
  // These attributes less those the workspace's attribute filter keeps off this kit's calls.
  filterPreselectAttributes(e) {
    const i = this.filters || {};
    return i.filterUserAttributes ? i.filterUserAttributes(e, i.userAttributeFilters || []) : e;
  }
  // What a pre-selection call with these attributes would send, mirroring _dispatchPlacements: identities,
  // then the cached user attributes merged in, filtered and overridden for the target page, then the
  // session attributes, so a later source wins as it does on the wire.
  getOutgoingPreselectAttributes(e, i) {
    const n = { ...se(this.userAttributes), ...e }, r = this.filterPreselectAttributes(n), s = this.returnUserIdentities(this.filters?.filteredUser || null), o = Li(
      this.accountId,
      i ? Lt(r, this.buildPreselectAttributeDefaults(i, e)) : r,
      this.findFiredEntry(i)
    );
    return {
      ...s,
      ...o,
      ...this.returnLocalSessionAttributes()
    };
  }
  isStillCurrentUser(e, i) {
    const n = h().Identity?.getCurrentUser?.();
    return e !== "" && String(this.filters?.filteredUser?.getMPID?.() ?? "") === e && String(n?.getMPID?.() ?? "") === e && (!i || n?.isLoggedIn?.() === !0);
  }
  currentUserSnapshot() {
    const e = h()?.Identity?.getCurrentUser?.();
    return {
      mpid: String(e?.getMPID?.() ?? ""),
      loggedIn: e?.isLoggedIn?.() === !0,
      hasIdentities: Object.values(e?.getUserIdentities?.()?.userIdentities || {}).some(
        (i) => g(i) && i !== ""
      ),
      identityCallCount: this._identityCallCount
    };
  }
  // A modify response carries no login flag, so core can report the user as logged out after a modify while keeping
  // the MPID; exempt the cleared flag only when every identity callback since the snapshot was such a modify. A failed
  // identity call clears the flag without any kit callback, so a modify that left the flag set never takes it.
  hasUserChangedSince(e) {
    const i = h().Identity?.getCurrentUser?.(), n = this._identityCallCount > e.identityCallCount && this._lastNonModifyCallCount <= e.identityCallCount;
    return String(i?.getMPID?.() ?? "") !== e.mpid || e.loggedIn && !n && i?.isLoggedIn?.() !== !0;
  }
  // A call whose user changed while it waited goes out for the new user only when nothing it carries belongs to
  // someone else: its user had no identities and it carries no email, as when an anonymous shopper logs in, or the
  // new user holds every email form it carries, as when core identifies with a passed email that differs from the
  // user's. A logout during the wait drops the call even when the email or MPID survives the logout.
  mayGoOutForNewUser(e, i) {
    const n = h().Identity?.getCurrentUser?.();
    if (e.loggedIn && n?.isLoggedIn?.() !== !0)
      return !1;
    const r = n?.getUserIdentities?.()?.userIdentities || {}, s = this._mappedEmailSha256Key, o = i[X.EMAIL_SHA256_KEY] || (s ? i[s] : void 0), a = [];
    return i.email && a.push([i.email, r.email]), o && a.push([o, s ? r[s] : void 0]), a.length === 0 ? !e.hasIdentities : a.every(([c, l]) => g(c) && c === l);
  }
  _dispatchPlacements(e, i) {
    const n = e ? lo(e) : void 0;
    if (e?.preselect === !0 && !ni(this.buildPreselectHost())) {
      n?.();
      return;
    }
    const r = e?.[Be], s = e?.[Tt], o = e?.[kt], a = { ...e };
    if (delete a[Be], delete a[Tt], delete a[kt], e = a, e.preselect === !0 && !this.isPreselectTargetAllowed(o, e)) {
      this.loggingService?.logPlacementDiagnostic(
        C("missed", "no_target_page_identifier", { cause: "filtered" })
      ), n?.();
      return;
    }
    if (s !== void 0) {
      const Q = E(s) ? s : {}, xe = Q.requireLogin !== !1;
      if (!this.isStillCurrentUser(String(Q.mpid ?? ""), xe)) {
        this.loggingService?.logPlacementDiagnostic(
          C("missed", xe ? "logged_in_dropped" : "user_changed_dropped")
        ), n?.();
        return;
      }
    }
    const c = i !== void 0 && this.hasUserChangedSince(i), l = c && i?.hasIdentities === !0;
    if (i && c && !this.mayGoOutForNewUser(i, E(e.attributes) ? e.attributes : {})) {
      e.preselect === !0 ? this.loggingService?.logPlacementDiagnostic(
        C("missed", i.loggedIn ? "logged_in_dropped" : "user_changed_dropped")
      ) : this.loggingService?.log({
        message: "Rokt Kit: Dropped a selectPlacements call whose user changed while it waited",
        code: "SELECT_PLACEMENTS_USER_CHANGED"
      }), n?.();
      return;
    }
    const d = E(r) ? r : void 0, u = d && g(d.key) ? d.key : void 0;
    if (u) {
      const Q = this.getFormEmailDropCause(u, d.mpid);
      if (Q) {
        this.loggingService?.logPlacementDiagnostic(
          C("missed", "form_email_dropped", { cause: Q })
        ), n?.();
        return;
      }
    }
    const f = e.attributes || {}, p = se(this.userAttributes), y = { ...p, ...f }, _ = this.filters || {}, P = _.userAttributeFilters || [], m = _.filteredUser || null, A = m ? m.getMPID() : null;
    let b;
    _ ? _.filterUserAttributes ? b = _.filterUserAttributes(y, P) : b = y : (console.warn("Rokt Kit: No filters available, using user attributes"), b = y);
    const w = se(b);
    u && (Object.prototype.hasOwnProperty.call(p, u) ? w[u] = p[u] : delete w[u]), this.userAttributes = w;
    const K = this._onboardingExpProvider === "Optimizely" ? this.fetchOptimizely() : {}, v = this.returnUserIdentities(m), S = this.returnLocalSessionAttributes(), H = this.isPageHistoryAllowed(), q = H ? ur(mi()) : [], ue = H ? fr() : null, J = this.readMpSessionId(), O = this.readMpDeviceId(), z = typeof e.identifier == "string" ? e.identifier : void 0, W = g(o) ? o : z, oi = e.preselect !== !0 && this.isPreselectionEnabled() && Ns(this.accountId) ? this.filterPreselectAttributes(Os(p, f)) : {}, de = e.preselect === !0 ? this.findFiredEntry(W) : this.findCacheConfigEntry(z, oi), Me = e.preselect === !0 ? this.buildPreselectAttributeDefaults(W, f) : void 0, ai = e.preselect === !0 ? Li(
      this.accountId,
      Lt(b, Me),
      de
    ) : b, $ = {
      ...v,
      ...ai,
      ...K,
      ...S,
      ...q.length ? { [Bo]: JSON.stringify(q) } : {},
      ...ue ? { [zo]: ue } : {},
      ...!l && this.userIdentifiedInWorkspace ? { [Go]: !0 } : {},
      ...J ? { [Xo]: J } : {},
      ...O ? { [Ui]: O } : {},
      mpid: A
    };
    this.isDeviceIdDisabled() && delete $[Ui], e.preselect !== !0 && Io(this.buildPreselectHost(), z, $, oi);
    const ft = ai[Cn];
    if (e.preselect === !0 && g(ft) && (ft.indexOf("intent_") === 0 || ft.indexOf("pageview_cart|") === 0) && !je($, this._mappedEmailSha256Key)) {
      this.loggingService?.logPlacementDiagnostic(
        C("missed", "no_strict_email", { cause: "lost_before_dispatch" })
      ), n?.();
      return;
    }
    const ci = Vs(
      de,
      Me,
      $
    ), li = js(de, Me, $), ui = Hs(de, $);
    delete $[Ai];
    const di = Un(Me, $);
    di && ($[Ai] = di);
    const er = {
      ...e,
      attributes: $,
      ...de ? { cacheMatchKeys: Fn(de) } : {},
      ...ci ? { cacheIdentityKeys: ci } : {},
      ...li ? { cacheMatchValues: li } : {},
      ...ui ? { cacheMatchTokens: ui } : {}
    }, gt = this.currentUserSnapshot(), pt = i?.loggedIn && !c && !gt.loggedIn ? { ...gt, loggedIn: !0, identityCallCount: i.identityCallCount } : gt, fi = this.launcher.selectPlacements(er), gi = e.preselect === !0, tr = () => {
      if (!gi) {
        if (this.hasUserChangedSince(pt) && (pt.loggedIn || pt.hasIdentities)) {
          this.loggingService?.log({
            message: "Rokt Kit: Skipped the selectPlacements event because its user changed before the selection resolved",
            code: "SELECT_PLACEMENTS_EVENT_USER_CHANGED"
          });
          return;
        }
        this.logSelectPlacementsEvent($);
      }
    };
    return Promise.resolve(fi).then((Q) => {
      if (!gi)
        return this.trackPlacementEngagement(Q), Q?.context?.sessionId?.then((xe) => this.setRoktSessionId(xe));
    }).catch(() => {
    }).finally(tr), fi;
  }
  // Logs each press of a placement's response buttons, and each close, as an auto button click. The
  // placement's frame keeps its buttons and text from the page, so only the response kind goes out.
  trackPlacementEngagement(e) {
    if (!e || !G(e.on))
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
        xo
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
        typeof a == "string" && a.length <= 253 && Mo.test(a.toLowerCase()) ? a.toLowerCase() : void 0
      );
    });
  }
  // Checked when each click is logged, since the launcher calls back outside core's own gates.
  canLogPlacementClick() {
    return this.isCheckoutIntentActive() && this.isForwardingAllowed() && G(h().logEvent);
  }
  logPlacementEngagement(e, i) {
    this.canLogPlacementClick() && h().logEvent(Uo, h().EventType.Other, {
      is_auto_button_click: !0,
      is_rokt_placement_click: !0,
      element: "button",
      type: "button",
      label_source: Ni,
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
      label_source: Ni,
      hostname: window.location.hostname,
      link_type: "external",
      rokt_placement_id: e
    };
    i && (n.link_domain = i), h().logEvent(Fo, h().EventType.Other, n);
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
    return this.isKitReady() ? (To(this._launcherAttachState), this.launcher.terminate()) : (console.error("Rokt Kit: Not initialized"), Promise.resolve());
  }
  /**
   * Registers a callback to be invoked once rokt-thank-you-element.js becomes available.
   */
  onShoppableAdsReady(e) {
    this._isThankYouElementLoaded ? e() : this._thankYouElementOnLoadCallback = e;
  }
};
X._allowedOriginHashes = [-553112570, 549508659], X.PERFORMANCE_MARKS = {
  RoktScriptAppended: "mp:RoktScriptAppended"
}, X.EMAIL_SHA256_KEY = "emailsha256";
let Ie = X;
function ca() {
  return He;
}
function la(t) {
  if (!t) {
    window.console.log("You must pass a config object to register the kit " + V);
    return;
  }
  if (!E(t)) {
    window.console.log("'config' must be an object. You passed in a " + typeof t);
    return;
  }
  E(t.kits) ? t.kits[V] = {
    constructor: Ie
  } : (t.kits = {}, t.kits[V] = {
    constructor: Ie
  }), window.console.log("Successfully registered " + V + " to your mParticle configuration");
}
typeof window < "u" && window.mParticle && h().addForwarder && h().addForwarder({
  name: V,
  constructor: Ie,
  getId: ca
});
export {
  la as register
};
//# sourceMappingURL=Rokt-Kit.esm.js.map
