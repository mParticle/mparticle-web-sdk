const gr = [
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
], pr = new Set(gr);
function Ht(t) {
  return pr.has(t.toLowerCase());
}
function ae(t) {
  const e = {}, i = t || {}, n = Object.keys(i);
  for (let r = 0; r < n.length; r++) {
    const s = n[r];
    Ht(s) || (e[s] = i[s]);
  }
  return e;
}
function v(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function g(t) {
  return typeof t == "string";
}
function z(t) {
  return typeof t == "function";
}
function nn(t) {
  try {
    return JSON.parse(t.replace(/&quot;/g, '"'));
  } catch {
    return;
  }
}
function D(t) {
  return t == null ? !0 : typeof t == "string" ? t.length === 0 : typeof t == "object" ? Object.keys(t).length === 0 : !1;
}
function L(t, e) {
  return Object.prototype.hasOwnProperty.call(t, e) ? t[e] : void 0;
}
function Ye(t) {
  const e = rn(), i = e ? e(t, "full") : t, n = i.indexOf("#"), r = n === -1 ? "" : i.slice(n);
  return (n === -1 ? i : i.slice(0, n)).split("?")[0] + r.split("?")[0];
}
function Wt(t) {
  const e = rn();
  return e ? e(t, "report") : t.split(/[?#]/)[0];
}
function rn() {
  const t = window.mParticle;
  return t && typeof t._cleanUrl == "function" ? t._cleanUrl : void 0;
}
function ie(t) {
  let e = 5381;
  for (let i = 0; i < t.length; i++)
    e = (e << 5) + e + t.charCodeAt(i), e = e & e;
  return e;
}
const A = "mp-rokt-kit", Ii = "__rokt_ls_probe__";
function vi() {
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
let me = null;
function mr(t) {
  t ? me || (me = { local: vi(), session: vi() }) : me = null;
}
function hr() {
  return me !== null;
}
const re = () => me?.local ?? window.localStorage, U = () => me?.session ?? window.sessionStorage;
function Pt() {
  try {
    const t = re();
    return t.setItem(Ii, "1"), t.removeItem(Ii), !0;
  } catch {
    return !1;
  }
}
function tt(t, e = re) {
  try {
    const i = e().getItem(t);
    return i === null ? null : JSON.parse(i);
  } catch {
    return null;
  }
}
function sn(t, e, i = re) {
  try {
    return i().setItem(t, JSON.stringify(e)), !0;
  } catch {
    return !1;
  }
}
function bt(t, e = re) {
  try {
    e().removeItem(t);
  } catch {
  }
}
function yr() {
  bt(A, () => window.localStorage), bt(A, () => window.sessionStorage);
}
function H(t, e, i = re) {
  const n = tt(t, i);
  return v(n) ? n[e] : void 0;
}
function X(t, e, i, n = re) {
  const r = tt(t, n), s = v(r) ? { ...r } : {};
  return s[e] = i, sn(t, s, n);
}
function on(t, e, i) {
  Object.keys(e).length === 0 ? bt(t, i) : sn(t, e, i);
}
function se(t, e, i = re) {
  const n = tt(t, i);
  if (!v(n) || !(e in n))
    return;
  const r = { ...n };
  delete r[e], on(t, r, i);
}
function he(t, e, i = re) {
  const n = tt(t, i);
  if (!v(n))
    return;
  const r = Object.keys(n).filter((o) => o.startsWith(e));
  if (r.length === 0)
    return;
  const s = { ...n };
  r.forEach((o) => delete s[o]), on(t, s, i);
}
const Gt = "pageViews", Be = "utmParams", an = 25, _r = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
function cn(t) {
  return t.slice(-an);
}
function Ai() {
  const t = H(A, Gt);
  return Array.isArray(t) ? t.filter(v).map(Er) : [];
}
function Er(t) {
  return {
    ...t,
    ...g(t.pageUrl) ? { pageUrl: Ye(t.pageUrl) } : {},
    ...g(t.canonicalUrl) ? { canonicalUrl: Ye(t.canonicalUrl) } : {}
  };
}
function Ir(t) {
  const e = cn(t);
  for (let i = 0; i < e.length; i++) {
    const n = e.slice(i);
    if (X(A, Gt, n))
      return n.length;
  }
  return 0;
}
function _t() {
  se(A, Gt);
}
function vr(t) {
  const e = cn(t);
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
function ln(t, e = !1) {
  return e || !!t && t.is_auto_page_view === !0;
}
function Ar(t, e, i = !1) {
  if (H(A, Be) !== void 0)
    return;
  const n = ln(e, i), r = new URLSearchParams(window.location.search), s = {};
  for (const a of _r) {
    const c = n ? (e || {})[a] : r.get(a);
    g(c) && c && (s[a] = c);
  }
  if (Object.keys(s).length === 0)
    return;
  const o = Object.keys(s).join(", ");
  if (!X(A, Be, s)) {
    const a = Pt() ? "quota" : "ls_unavailable";
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
function Pr() {
  const t = H(A, Be);
  return v(t) ? t : null;
}
function Et() {
  se(A, Be);
}
function br() {
  const e = document.querySelector('link[rel="canonical"]')?.href;
  if (e)
    return Ye(e);
}
const dn = "skip", wr = [
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
], wt = {
  apple_pay: /\bapple ?pay\b/,
  google_pay: /\b(?:google ?pay|g ?pay|android ?pay)\b/,
  venmo: /\bvenmo\b/,
  paypal: /\bpay ?pal\b/,
  amazon_pay: /\bamazon ?pay\b/,
  shop_pay: /\bshop ?pay\b/,
  klarna: /\bklarna\b/,
  afterpay: /\b(?:after ?pay|clear ?pay)\b/,
  affirm: /\baffirm\b/,
  // "Cash App Afterpay" is Afterpay under its newer name, so Cash App ahead of Afterpay is not a second wallet.
  cash_app: /\bcash ?app\b(?! after ?pay\b)/,
  sezzle: /\bsezzle\b/,
  samsung_pay: /\bsamsung ?pay\b/,
  card: /\b(?:credit ?card|debit ?card|credit|debit|cards?|visa|master ?card|mc|am ?ex|american ?express|discover)\b/
}, Tr = /\b(?:gift cards?|store credit|rewards?|points?|balance|vouchers?|promo codes?|coupons?)\b/g, Cr = 12;
function Sr(t) {
  return t.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/[^a-z]+/g, " ").trim();
}
function it(t) {
  if (typeof t != "string" || t.length > 128)
    return;
  const e = Sr(t).replace(Tr, " ").replace(/\s+/g, " ").trim();
  if (!e || e.split(" ").length > Cr)
    return;
  const i = Object.keys(wt).filter((r) => wt[r].test(e)), n = i.filter((r) => r !== "card");
  return n.length === 1 ? n[0] : n.length === 0 && i.length === 1 ? i[0] : void 0;
}
function nt(t) {
  return typeof t == "string" && Object.prototype.hasOwnProperty.call(wt, t);
}
const kr = "radio", Lr = ["button", "role", "wallet"], Rr = ["label", "aria_label", "test_id", "element_id", "element_name"], Dr = ["label", "aria_label"];
function Or(t) {
  return !!t.label && t.label_source !== "heading" || !!t.aria_label;
}
function Nr(t) {
  if (!t)
    return;
  const e = String(t.checked), i = t.type === kr;
  if (e === "false" || i && e !== "true" || t.type === "checkbox" || t.element === "link" || !i && t.type === void 0 && !Lr.includes(String(t.element)))
    return;
  const n = !i && Or(t) ? Dr : Rr;
  for (const r of n) {
    const s = it(t[r]);
    if (s && (i || s !== "card"))
      return s;
  }
}
function Kr(t) {
  if (nt(t.family))
    return t.family;
  for (const e of Array.isArray(t.names) ? t.names : []) {
    const i = it(e);
    if (i)
      return i;
  }
}
const Ur = ["paymenttype", "payment_type", "paymentmethod", "payment_method"];
function Fr(t) {
  const e = t ? Object.keys(t).find((n) => Ur.includes(n.toLowerCase())) : void 0, i = e ? t[e] : void 0;
  return typeof i != "string" || !i.trim() ? "absent" : it(i) ?? "other";
}
const Mr = 1, xr = 6e4;
function N(t) {
  return Array.isArray(t) && t.every(g);
}
function ee(t) {
  return g(t) && t !== "";
}
const un = ["DesktopWeb", "MobileWeb"], Vr = 50;
function jr(t, e) {
  if (!Array.isArray(t) || t.length === 0 || !t.every((r) => N(r) && r.length >= 2 && r.every(ee)))
    return !1;
  const i = t.flat();
  if (i.length > Vr || new Set(i).size !== i.length)
    return !1;
  const n = N(e) ? e.map((r) => r.toLowerCase()) : [];
  return !i.some((r) => n.includes(r.toLowerCase()));
}
const $r = 10, Hr = 256, Wr = ["commit", "checkoutStep"];
function Gr(t) {
  if (!v(t))
    return !1;
  const e = Wr.filter((i) => t[i] !== void 0);
  return e.length > 0 && e.every((i) => {
    const n = t[i];
    return N(n) && n.length > 0 && n.length <= $r && n.every((r) => r.trim() !== "" && r.length <= Hr);
  });
}
function Yr(t) {
  if (ee(t))
    return !0;
  if (!v(t))
    return !1;
  const { byClientType: e, byHostname: i, byPaymentPick: n, skipRemembered: r, skipValues: s, matchGroups: o, matchPaymentFamily: a } = t;
  if (t.value !== void 0 && !ee(t.value) || e !== void 0 && (!v(e) || !Object.entries(e).every(
    ([c, l]) => un.includes(c) && ee(l)
  )) || i !== void 0 && (!v(i) || !Object.entries(i).every(
    ([c, l]) => c !== "" && c === c.toLowerCase() && ee(l)
  )) || n !== void 0 && (!v(n) || Object.keys(n).length === 0 || !Object.entries(n).every(
    ([c, l]) => nt(c) && ee(l)
  )) || r !== void 0 && typeof r != "boolean" || a !== void 0 && typeof a != "boolean" || s !== void 0 && (!N(s) || s.length === 0 || !s.every(ee)))
    return !1;
  if (N(s)) {
    const c = s.map((u) => u.toLowerCase());
    if ([
      t.value,
      ...Object.values(e ?? {}).filter((u) => u !== dn),
      ...Object.values(i ?? {}),
      ...Object.values(n ?? {})
    ].some((u) => g(u) && c.includes(u.toLowerCase())))
      return !1;
  }
  return o !== void 0 && !jr(o, s) ? !1 : t.value !== void 0 || e !== void 0 || i !== void 0 || n !== void 0;
}
function Br(t) {
  return ee(t) && !/\s/.test(t) && !Array.from(t).some(
    (e) => e.charCodeAt(0) < 32 || e.charCodeAt(0) >= 127 && e.charCodeAt(0) <= 159
  );
}
function zr(t, e) {
  return v(t) && Object.keys(t).length > 0 && Object.entries(t).every(([i, n]) => e(i) && Br(n));
}
function Xr(t) {
  if (!v(t))
    return !1;
  const { byPaymentPick: e, byHostname: i, byClientType: n } = t, s = [
    [e, nt],
    [i, (o) => o !== "" && o === o.toLowerCase()],
    [n, (o) => un.includes(o)]
  ].filter(([o]) => o !== void 0);
  return s.length > 0 && s.every(([o, a]) => zr(o, a));
}
function Tt(t) {
  const e = t.alternateTargetPageIdentifiers;
  return [
    t.targetPageIdentifier,
    ...Object.values(e?.byPaymentPick ?? {}),
    ...Object.values(e?.byHostname ?? {}),
    ...Object.values(e?.byClientType ?? {})
  ];
}
function qr(t, e) {
  if (!v(e))
    return "not an object";
  const { pathname: i, pathnames: n, targetPageIdentifier: r, attributeKeys: s, optionalAttributeKeys: o, identityKeys: a, dispatchDelayMs: c } = e, { triggerEventNames: l, releaseHoldOnRouteChange: u, readEmailInput: d, cartIntent: f, cartUserAttribute: m } = e, { checkoutStepIntent: E, intentSelectors: y, hosts: w } = e, C = e.preselectAttributeOverrides, T = e.preselectAttributeDefaults !== void 0 ? e.preselectAttributeDefaults : C, _ = e.widenedOptionalAttributeKeys, { targetPageIdentifierAttribute: b } = e, R = e.alternateTargetPageIdentifiers;
  if (e.accountId !== void 0 && e.accountId !== t)
    return "accountId";
  if (!g(i) || !i.startsWith("/"))
    return "pathname";
  if (n !== void 0 && (!N(n) || n.length === 0 || !n.every((P) => P.startsWith("/"))))
    return "pathnames";
  if (!g(r) || r === "")
    return "targetPageIdentifier";
  if (b !== void 0 && (!g(b) || b.trim() === "" || Ht(b.trim())))
    return "targetPageIdentifierAttribute";
  if (R !== void 0 && (b !== void 0 || !Xr(R)))
    return "alternateTargetPageIdentifiers";
  if (!N(s) || s.length === 0)
    return "attributeKeys";
  if (o !== void 0 && (!N(o) || !o.every((P) => s.includes(P))))
    return "optionalAttributeKeys";
  if (_ !== void 0 && (!N(_) || !_.every((P) => s.includes(P))))
    return "widenedOptionalAttributeKeys";
  if (a !== void 0 && (!N(a) || a.length === 0 || !a.every((P) => s.includes(P))))
    return "identityKeys";
  if (N(_) && _.length > 0) {
    const P = (N(o) ? o : []).concat(_).map((V) => V.toLowerCase());
    if (!N(a) || a.some((V) => P.includes(V.toLowerCase())))
      return "identityKeys";
  }
  if (c !== void 0 && (!Number.isInteger(c) || c < 0 || c > xr))
    return "dispatchDelayMs";
  if (u !== void 0 && typeof u != "boolean")
    return "releaseHoldOnRouteChange";
  if (E !== void 0 && typeof E != "boolean")
    return "checkoutStepIntent";
  if (f !== void 0 && typeof f != "boolean")
    return "cartIntent";
  if (y !== void 0 && !Gr(y))
    return "intentSelectors";
  if (w !== void 0 && (!N(w) || w.length === 0 || !w.every((P) => P !== "" && P === P.toLowerCase())))
    return "hosts";
  if (d !== void 0 && (typeof d != "boolean" || !s.includes("email") || N(o) && o.includes("email") || // The runtime matches optional keys in any casing, so an 'Email' key would make email optional too.
  N(_) && _.some((P) => P.toLowerCase() === "email") || // A default makes its key optional too, and would send a guessed email as the shopper's.
  v(T) && Object.keys(T).some((P) => P.toLowerCase() === "email")))
    return "readEmailInput";
  if (e.preselectAttributeDefaults !== void 0 && C !== void 0)
    return "preselectAttributeDefaults";
  let h;
  if (T !== void 0) {
    const P = e.preselectAttributeDefaults !== void 0 ? "preselectAttributeDefaults" : "preselectAttributeOverrides";
    if (!v(T))
      return P;
    const V = (N(a) ? a : []).map((K) => K.toLowerCase()), G = ([K, Q]) => Yr(Q) && s.includes(K) && !["email", "emailsha256"].includes(K.toLowerCase()) && !V.includes(K.toLowerCase()), fe = ([K, Q]) => C !== void 0 && g(Q) && s.includes(K) && !(N(a) && a.includes(K)), J = Object.entries(T);
    if (!J.every((K) => G(K) || fe(K)))
      return P;
    h = Object.fromEntries(J.filter(G));
  }
  if (l !== void 0 && (!N(l) || l.length === 0 || l.some((P) => P === "")))
    return "triggerEventNames";
  const I = { accountId: t, pathname: i, targetPageIdentifier: r, attributeKeys: s };
  if (n !== void 0 && (I.pathnames = n), b !== void 0 && (I.targetPageIdentifierAttribute = b.trim()), R !== void 0) {
    const { byPaymentPick: P, byHostname: V, byClientType: G } = R;
    I.alternateTargetPageIdentifiers = {
      ...P !== void 0 ? { byPaymentPick: P } : {},
      ...V !== void 0 ? { byHostname: V } : {},
      ...G !== void 0 ? { byClientType: G } : {}
    };
  }
  return o !== void 0 && (I.optionalAttributeKeys = o), _ !== void 0 && (I.widenedOptionalAttributeKeys = _), a !== void 0 && (I.identityKeys = a), c !== void 0 && (I.dispatchDelayMs = c), u !== void 0 && (I.releaseHoldOnRouteChange = u), E !== void 0 && (I.checkoutStepIntent = E), y !== void 0 && (I.intentSelectors = y), w !== void 0 && (I.hosts = w), d !== void 0 && (I.readEmailInput = d), h !== void 0 && (I.preselectAttributeDefaults = h), l !== void 0 && (I.triggerEventNames = l), f !== void 0 && (I.cartIntent = f), f === !0 && g(m) && m !== "" && (I.cartUserAttribute = m), I;
}
function Jr(t, e) {
  const i = nn(e);
  if (i === void 0)
    return { error: "invalid JSON" };
  if (!v(i))
    return { error: "not an object" };
  if (i.schemaVersion !== Mr)
    return { error: "schemaVersion" };
  if (!Array.isArray(i.entries))
    return { error: "entries" };
  const n = [];
  for (let r = 0; r < i.entries.length; r++) {
    const s = qr(t, i.entries[r]);
    if (g(s))
      return { error: `entry ${r + 1} ${s}` };
    const o = Tt(s);
    if (n.some((a) => Tt(a).some((c) => o.includes(c))))
      return { error: `entry ${r + 1} targetPageIdentifier` };
    n.push(s);
  }
  return { entries: n };
}
const Qr = 6e4, Yt = "activePreselect:";
function Zr(t) {
  return v(t) && typeof t.expiresAt == "number" && typeof t.attributesDigest == "number";
}
function es(t, e) {
  return `${Yt}${t}:${e}`;
}
function ye(t) {
  const e = H(A, t, U);
  return Zr(e) && e.expiresAt > Date.now() ? e : null;
}
function ts(t, e, i = !1) {
  X(
    A,
    t,
    { expiresAt: Date.now() + Qr, attributesDigest: e, ...i ? { byEvent: !0 } : {} },
    U
  );
}
function is(t, e, i) {
  const n = ye(t);
  n && n.attributesDigest !== i || (e && e.expiresAt > Date.now() ? X(A, t, e, U) : se(A, t, U));
}
function Pi(t) {
  he(
    A,
    `${Yt}${t}:`,
    U
  );
}
function ns() {
  he(A, Yt);
}
const rs = 5 * 6e4, fn = "pendingPreselect:";
function ss(t) {
  return v(t) && typeof t.expiresAt == "number" && g(t.pathname) && g(t.identifier) && v(t.attributes) && g(t.mpid);
}
function Bt(t) {
  return `${fn}${t}`;
}
function zt(t) {
  const e = Bt(t), i = H(A, e, U);
  return ss(i) ? i.expiresAt <= Date.now() ? (se(A, e, U), null) : i : null;
}
function bi(t, e, i, n, r, s = !1) {
  return X(
    A,
    Bt(t),
    {
      expiresAt: Date.now() + rs,
      pathname: e,
      identifier: i,
      attributes: n,
      mpid: r,
      ...s ? { byEvent: !0 } : {}
    },
    U
  );
}
function le(t) {
  se(A, Bt(t), U);
}
function os() {
  he(A, fn);
}
const gn = "preselectArrival:", pn = "preselectTriggerAnyTab:", rt = "preselectCartAdd:", mn = "preselectTargetPath:", hn = "preselectCartArrival:", as = 30 * 6e4, Ee = 30 * 6e4, cs = 10080 * 6e4, ls = 10080 * 6e4, Ct = ["commit", "wallet", "frame", "checkout_step", "cart"], ds = [
  "triggeredAt",
  "identitySeenAt",
  "firedAt",
  "firedDigest",
  "arrivedAt",
  "nearMissAt",
  "paymentPickAt"
], us = ["paymentPick", "paymentAtFire"];
function W(t, e) {
  return `${gn}${t}:${e}`;
}
function yn(t, e) {
  return `${pn}${t}:${e}`;
}
function Oe(t) {
  const e = H(A, t, U), i = {};
  if (!v(e))
    return i;
  for (const n of ds)
    typeof e[n] == "number" && (i[n] = e[n]);
  typeof e.intentAt == "number" && Ct.includes(e.intentKind) && (i.intentAt = e.intentAt, i.intentKind = e.intentKind);
  for (const n of us)
    nt(e[n]) && (i[n] = e[n]);
  return i.firedAt !== void 0 && e.firedByCart === !0 && (i.firedByCart = !0), i;
}
function de(t, e) {
  return X(A, t, e, U);
}
function oe(t) {
  const e = Oe(t);
  return e.arrivedAt === void 0 ? e : e.paymentPick !== void 0 && e.paymentPickAt !== void 0 && e.paymentPickAt > e.arrivedAt ? { paymentPick: e.paymentPick, paymentPickAt: e.paymentPickAt } : {};
}
function fs(t, e, i) {
  const n = W(t, e), r = oe(n), s = Date.now();
  de(n, {
    ...r,
    triggeredAt: r.triggeredAt ?? s,
    ...i ? { identitySeenAt: r.identitySeenAt ?? s } : {}
  }), X(A, yn(t, e), {
    triggeredAt: s
  });
}
function gs(t, e) {
  const i = H(A, yn(t, e));
  if (!v(i) || typeof i.triggeredAt != "number")
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < as;
}
function ps(t, e, i) {
  const n = `${rt}${t}`, r = H(A, n), s = v(r) ? r.addedAt ?? r.forgottenAt : void 0;
  typeof s == "number" && e <= s || X(A, n, { addedAt: e, mpid: i });
}
function ms(t, e) {
  const i = `${rt}${t}`, n = H(A, i);
  if (!v(n))
    return !1;
  const r = typeof n.addedAt == "number" ? n.addedAt : void 0, s = r ?? n.forgottenAt;
  if (typeof s != "number")
    return !1;
  const o = Date.now() - s;
  return o >= 0 && o < cs ? r !== void 0 && e !== null && n.mpid === e : (se(A, i), !1);
}
function hs(t, e) {
  const i = `${rt}${t}`;
  e ? X(A, i, { forgottenAt: Date.now() }) : se(A, i);
}
function ys(t, e) {
  const i = W(t, e), n = Oe(i);
  n.arrivedAt !== void 0 || n.nearMissAt !== void 0 || de(i, { ...n, nearMissAt: Date.now() });
}
function _s(t, e, i, n = !1, r) {
  const s = W(t, e), o = oe(s), a = o.firedAt !== void 0 && Ie(o.firedAt) ? {
    firedAt: o.firedAt,
    ...o.firedDigest !== void 0 ? { firedDigest: o.firedDigest } : {},
    ...o.firedByCart ? { firedByCart: !0 } : {},
    ...o.paymentAtFire !== void 0 ? { paymentAtFire: o.paymentAtFire } : {}
  } : void 0, c = r !== void 0 ? r ?? void 0 : o.paymentPick !== void 0 && o.paymentPickAt !== void 0 && Ie(o.paymentPickAt) ? o.paymentPick : void 0;
  return de(
    s,
    _n(o, {
      firedAt: a && !(a.firedByCart && !n) ? a.firedAt : Date.now(),
      firedDigest: i,
      ...n ? { firedByCart: !0 } : {},
      paymentAtFire: c
    })
  ), a;
}
function Es(t, e, i, n) {
  const r = W(t, e), s = oe(r);
  s.firedAt === void 0 || s.firedDigest !== n || de(r, _n(s, i));
}
function _n(t, e) {
  const i = { ...t };
  return delete i.firedAt, delete i.firedDigest, delete i.firedByCart, delete i.paymentAtFire, e ? {
    ...i,
    firedAt: e.firedAt,
    ...e.firedDigest !== void 0 ? { firedDigest: e.firedDigest } : {},
    ...e.firedByCart ? { firedByCart: !0 } : {},
    ...e.paymentAtFire !== void 0 ? { paymentAtFire: e.paymentAtFire } : {}
  } : i;
}
function Is(t, e) {
  const i = oe(W(t, e));
  if (i.triggeredAt === void 0)
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < Ee;
}
function St(t, e, i, n = !1) {
  const r = oe(W(t, e));
  if (r.firedAt === void 0 || n && r.firedByCart || i !== void 0 && r.firedDigest !== void 0 && r.firedDigest !== i)
    return !1;
  const s = Date.now() - r.firedAt;
  return s >= 0 && s < Ee;
}
function vs(t, e, i, n) {
  const r = W(t, e), s = oe(r);
  if (s.intentAt !== void 0 && s.intentKind !== void 0 && As(s.intentAt)) {
    const o = Ct.indexOf(s.intentKind), a = Ct.indexOf(i);
    if (o < a || o === a && s.intentAt >= n)
      return;
  }
  de(r, { ...s, intentAt: n, intentKind: i });
}
function Ie(t) {
  const e = Date.now() - t;
  return e >= 0 && e < Ee;
}
function As(t) {
  return Ie(t);
}
function Ps(t, e, i, n) {
  const r = W(t, e), s = Oe(r);
  s.arrivedAt !== void 0 && n <= s.arrivedAt || s.paymentPickAt !== void 0 && s.paymentPickAt > n || de(r, { ...s, paymentPick: i, paymentPickAt: n });
}
function bs(t, e) {
  const i = oe(W(t, e));
  return i.firedAt !== void 0 && Ie(i.firedAt) ? i.paymentAtFire : void 0;
}
function wi(t, e, i) {
  const n = oe(W(t, e));
  return n.paymentPick !== void 0 && n.paymentPickAt !== void 0 && Ie(n.paymentPickAt) && (i === void 0 || n.paymentPickAt >= i) ? n.paymentPick : void 0;
}
function ws(t, e) {
  const i = W(t, e), n = Oe(i);
  if (n.arrivedAt !== void 0)
    return;
  const r = { ...n, arrivedAt: Date.now() };
  if (delete r.paymentPick, delete r.paymentPickAt, !!de(i, r))
    return n;
}
function En(t, e) {
  return `${hn}${t}:${e}`;
}
function Ts(t, e, i, n) {
  const r = En(t, e);
  if (i === void 0 || n === null) {
    se(A, r, U);
    return;
  }
  X(
    A,
    r,
    { arrivedAt: Date.now(), cartDigest: i, mpid: n },
    U
  );
}
function Cs(t, e, i, n) {
  const r = H(
    A,
    En(t, e),
    U
  );
  if (!v(r) || typeof r.arrivedAt != "number" || r.cartDigest !== i || n === null || r.mpid !== n)
    return !1;
  const { firedAt: s } = Oe(W(t, e)), o = H(A, `${rt}${t}`), a = v(o) && typeof o.addedAt == "number" && o.mpid === n ? o.addedAt : void 0;
  return Ie(r.arrivedAt) && !(s !== void 0 && s >= r.arrivedAt) && !(a !== void 0 && a >= r.arrivedAt);
}
function Ss(t, e, i) {
  X(A, `${mn}${t}:${e}`, {
    pathDigest: i,
    learnedAt: Date.now()
  });
}
function ks(t, e, i) {
  const n = H(
    A,
    `${mn}${t}:${e}`
  );
  if (!v(n) || n.pathDigest !== i || typeof n.learnedAt != "number")
    return !1;
  const r = Date.now() - n.learnedAt;
  return r >= 0 && r < ls;
}
function Ti(t) {
  he(
    A,
    `${gn}${t}:`,
    U
  ), he(
    A,
    `${hn}${t}:`,
    U
  ), he(A, `${pn}${t}:`);
}
function S(t, e, i = {}) {
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
const kt = /* @__PURE__ */ new Map();
function Ls(t, e) {
  if (kt.delete(t), !e)
    return;
  const i = Jr(t, e);
  if ("error" in i)
    return i.error;
  kt.set(t, i.entries);
}
function x(t) {
  return kt.get(t) ?? wr.filter((e) => e.accountId === t);
}
function In(t) {
  return t.pathnames ? [t.pathname, ...t.pathnames] : [t.pathname];
}
function vn(t, e) {
  return In(t).find((i) => $e(i, e));
}
function An(t, e) {
  return vn(t, e) !== void 0;
}
function $e(t, e) {
  const i = k(t), n = k(e);
  if (!i.includes("*"))
    return i === n;
  const r = i.split("/"), s = n.split("/");
  return r.length !== s.length ? !1 : r.every(
    (o, a) => o === "*" ? s[a] !== "" : o === s[a]
  );
}
function k(t) {
  return t.length > 1 && t.endsWith("/") ? t.slice(0, -1) : t;
}
function Rs(t, e) {
  const i = k(t).toLowerCase(), n = k(e).toLowerCase().split("/"), r = i.split("/").length;
  return $e(i, n.join("/")) || $e(i, ["", ...n.slice(2)].join("/")) || n.length > r && $e(i, n.slice(0, r).join("/"));
}
const Pn = {}, bn = {}, wn = {}, Xt = {}, Tn = {}, Ds = {}, Os = ["commit", "wallet", "checkout_step", "frame", "cart"], Ns = ["vendor", "label", "brand", "frame", "submit", "name", "api", "selector"], Ks = 512;
function Cn(t) {
  return t === "commit" ? "intent_commit" : t === "checkout_step" ? "intent_checkout_step" : t === "cart" ? "intent_cart" : "intent_wallet";
}
function Sn(t) {
  return t === "intent_commit" ? bn : t === "intent_checkout_step" ? Xt : t === "intent_cart" ? Tn : wn;
}
const Us = 1e3;
function Lt(t) {
  const e = Date.now() - t.t;
  return e >= 0 && e < Us;
}
function st(t) {
  return x(t).filter((e) => e.cartIntent === !0);
}
function ot(t) {
  return typeof t.source == "string" && Ns.includes(t.source) ? t.source : void 0;
}
function kn(t) {
  return [...new Set(x(t).map((i) => i.targetPageIdentifier))].some((i) => Is(t, i)) ? "left" : "before_entry";
}
function at(t, e, i, n, r = {}, s = !1) {
  const o = `${n}:${i}:${e.kind}${s ? ":wait" : ""}`;
  if (Dt.has(o)) return;
  Dt.add(o);
  const a = ot(e);
  t.logPlacementDiagnostic(
    S("skipped", "intent_observed", {
      intent_kind: e.kind,
      intent_route: i,
      ...a ? { intent_source: a } : {},
      has_email: Me(t, {}),
      has_identity: M(t.filteredUser),
      ...r
    })
  );
}
function qt(t) {
  const e = O(t.filteredUser), i = t.getCurrentUser?.();
  return e !== null && O(i) === e && i?.isLoggedIn?.() === !0;
}
function Rt(t, e, i, n, r, s = !1) {
  const o = e.accountId, a = kn(o), c = qt(e), l = (_, b = s) => at(e, i, a, r, { logged_in: c, ..._ ? { cause: _ } : {} }, b), u = i.kind === "cart", d = i.kind === "wallet" && !c && (s || !M(e.filteredUser));
  if (!u && !c && (s || l(), !d))
    return;
  const f = u ? st(o) : x(o).filter((_) => _.cartIntent !== !0);
  if (f.length === 0) return l("cart_entry_only");
  if (f.length !== 1) return l("multiple_entries");
  if (n !== k(window.location.pathname) && !(u && Lt(i)))
    return l("path_changed");
  const m = f[0];
  if (m.hosts && !m.hosts.includes(window.location.hostname) && F(o, n)?.targetPageIdentifier !== m.targetPageIdentifier)
    return l("unlisted_host", d);
  if (!M(e.filteredUser))
    return d && !s ? Ms(t, e, i, n, r) : l("no_valid_identity");
  const E = Cn(i.kind), y = `${E}_off_entry`, { collected: w, missingKeys: C } = ue(e, Sn(E), m, !1), T = dt(e, o, m.targetPageIdentifier, w);
  if (li(o, m.targetPageIdentifier, T, !u))
    return l("active_preselection");
  if (C.length > 0) return l("missing_attribute");
  if (!Me(e, w, m.targetPageIdentifier)) return l("no_strict_email");
  xe(
    e,
    o,
    m.targetPageIdentifier,
    m.targetPageIdentifier,
    w,
    "intent",
    Ke(y, m),
    !1,
    E,
    !1,
    void 0,
    ot(i),
    { route: a, loggedIn: c, requireLogin: !u && !d }
  );
}
function Fs(t, e, i, n, r) {
  const s = (c) => at(t, e, "entry", r, { cause: c });
  if (!M(t.filteredUser)) return s("no_valid_identity");
  const { collected: o, missingKeys: a } = ue(t, Xt, i, !1);
  if (a.length > 0) return s("missing_attribute");
  if (!Me(t, o, i.targetPageIdentifier)) return s("no_strict_email");
  xe(
    t,
    t.accountId,
    i.targetPageIdentifier,
    i.targetPageIdentifier,
    o,
    "intent",
    Ke("intent_checkout_step", i, n),
    !1,
    "intent_checkout_step",
    !1,
    void 0,
    ot(e),
    { route: "entry", loggedIn: qt(t), requireLogin: !1 }
  );
}
const Ln = 2e4;
function Ms(t, e, i, n, r) {
  Rn(t);
  const s = () => {
    t.identityWait = void 0;
    const a = e.getCurrentHost?.() ?? e;
    Jt(a) && Dn(a, o);
  }, o = {
    signal: i,
    clickPathname: n,
    visitKey: r,
    route: j[j.length - 1],
    timer: setTimeout(s, Math.max(0, i.t + Ln - Date.now()))
  };
  t.identityWait = o;
}
function Rn(t) {
  t.identityWait && clearTimeout(t.identityWait.timer), t.identityWait = void 0;
}
function Dn(t, e) {
  const i = kn(t.accountId), n = { logged_in: qt(t), cause: "identity_wait_expired" };
  at(t, e.signal, i, e.visitKey, n, !0);
}
function xs(t, e) {
  const i = t.identityWait;
  if (!i || !M(e.filteredUser) || (Rn(t), !Jt(e))) return;
  if (e.logPlacementDiagnostic(
    S("identity_arrived", "pending_identity", {
      intent_kind: i.signal.kind,
      ...ut(i.signal.t)
    })
  ), j[j.length - 1] !== i.route || i.clickPathname !== k(window.location.pathname) || Date.now() - i.signal.t >= Ln) return Dn(e, i);
  Rt(t, e, i.signal, i.clickPathname, i.visitKey, !0);
}
function Vs(t) {
  const e = t.pathname;
  return typeof e == "string" && e.charAt(0) === "/" && e.length <= Ks ? k(e) : void 0;
}
const Te = /* @__PURE__ */ new Set(), Dt = /* @__PURE__ */ new Set(), j = [];
function _e(t) {
  if (t === bn) return "intent_commit";
  if (t === wn) return "intent_wallet";
  if (t === Xt) return "intent_checkout_step";
  if (t === Tn) return "intent_cart";
}
function Ne(t) {
  return _e(t) !== void 0;
}
function It(t, e = Date.now()) {
  t = k(t), j[j.length - 1]?.pathname !== t && (j.push({ pathname: t, since: e }), j.length > 8 && j.shift(), Dt.clear());
}
function js(t, e, i) {
  if (!i || !Os.includes(i.kind) || typeof i.t != "number" || !Number.isFinite(i.t))
    return;
  const n = `${i.kind}:${i.t}${i.adds === !0 ? ":adds" : ""}`;
  if (Te.has(n) || (Te.add(n), Te.size > 4096 && Te.delete(Te.values().next().value), !Jt(e)) || i.kind === "cart" && st(e.accountId).length === 0) return;
  $s(e.accountId, i);
  const r = O(e.filteredUser);
  i.kind === "cart" && i.adds === !0 && r !== null && we(e.accountId) && ps(e.accountId, i.t, r);
  const s = [...j].reverse().find((_) => _.since <= i.t), o = Vs(i) ?? s?.pathname;
  if (!o) return;
  const a = s && s.pathname === o ? s.since : 0, c = `${o}:${a}`, l = i.kind === "cart", u = i.kind === "commit" || i.kind === "wallet" || l, d = F(e.accountId, o);
  if (!d || (l ? d.cartIntent !== !0 : d.cartIntent === !0)) {
    u && Rt(t, e, i, o, c);
    return;
  }
  const f = window.location.pathname, m = o === k(f);
  if (l && !m && Lt(i)) {
    Rt(t, e, i, o, c);
    return;
  }
  const E = i.kind === "checkout_step" && d.checkoutStepIntent === !0;
  if (E && !m && Lt(i)) {
    Fs(e, i, d, o, c);
    return;
  }
  if (!(u || E) || !m) {
    at(e, i, "entry", c);
    return;
  }
  t.intentSource = ot(i);
  const y = Cn(i.kind), w = (_) => (t.latestIntentFire = l ? void 0 : { pathname: k(f), t: i.t, userId: O(e.filteredUser), refire: _ }, _), C = t.scheduledDispatch;
  if (C && k(C.pathname) === k(f)) {
    ii(t), w((_) => tr(t, _, C, "intent_released", y))(e);
    return;
  }
  const T = t.pending.find(
    (_) => k(_.pathname) === k(f)
  );
  if (T) {
    T.intentSeen = y, T.lateRefire = void 0;
    const { event: _, triggeringUserId: b, triggeredAt: R } = T, h = w(
      (I) => Pe(t, I, _, f, b, R, y)
    );
    T.waitingFor === "intent" && (t.pending = t.pending.filter((I) => I !== T), h(e));
    return;
  }
  w(
    (_) => Pe(t, _, Sn(y), f, void 0, i.t)
  )(e);
}
function Jt(t) {
  return !t.isTargetingDisabled?.() && t.isForwardingAllowed?.() !== !1 && ft(t) && t.isKitReady() && t.isPreselectionEnabled() && ke(t.accountId);
}
function $s(t, e) {
  const i = e.kind === "cart" ? st(t) : x(t);
  new Set(i.map((r) => r.targetPageIdentifier)).forEach((r) => vs(t, r, e.kind, e.t));
}
function ve(t) {
  return t === Pn;
}
const ct = 4, Hs = ["Auto Button Click", "Auto Link Click"], Ws = ["is_auto_button_click", "is_auto_link_click"];
function ze(t) {
  return t.EventDataType === ct && Hs.includes(t.EventName ?? "") || Ws.some((e) => String(t.EventAttributes?.[e]) === "true");
}
function On(t) {
  const e = t.accountId;
  if (!(!e || !ke(e) || t.isTargetingDisabled?.() || t.isForwardingAllowed?.() === !1 || !ft(t) || !t.isKitReady() || !t.isPreselectionEnabled()))
    return e;
}
function Nn(t, e, i) {
  if (!e) return;
  const n = new Set(x(t).map((o) => o.targetPageIdentifier)), r = Date.now(), s = typeof i == "number" && Number.isFinite(i) && i <= r ? i : r;
  n.forEach((o) => Ps(t, o, e, s));
}
function Gs(t, e) {
  const i = ze(e) ? On(t) : void 0;
  i && Nn(
    i,
    Nr(e.EventAttributes),
    e.Timestamp
  );
}
function Ys(t, e, i) {
  const n = On(e);
  if (!n) return;
  const r = Kr(i), s = zs(t, e, n, r, i?.t);
  Nn(n, r, i?.t), s && (t.latestIntentFire = void 0, Kn(t, !0, () => s.refire(e)));
}
function Kn(t, e, i) {
  const n = t.lateRefire;
  t.lateRefire = e;
  try {
    i();
  } finally {
    t.lateRefire = n;
  }
}
const Bs = 1e3;
function zs(t, e, i, n, r) {
  const s = t.latestIntentFire;
  if (!s || !n) return;
  const o = Date.now(), c = (typeof r == "number" && Number.isFinite(r) && r <= o ? r : o) - s.t, l = k(window.location.pathname);
  if (c < 0 || c > Bs || l !== s.pathname || O(e.filteredUser) !== s.userId) return;
  const d = t.pending.some((f) => k(f.pathname) === l) || t.scheduledDispatch !== void 0 && k(t.scheduledDispatch.pathname) === l ? void 0 : F(i, l);
  if (!(!d || d.cartIntent === !0 || !St(i, d.targetPageIdentifier)))
    return Xs(d, bs(i, d.targetPageIdentifier), n) ? s : void 0;
}
function Xs(t, e, i) {
  if (e === i) return !1;
  const n = Object.values(t.preselectAttributeDefaults ?? {}).some(
    (o) => v(o) && o.byPaymentPick !== void 0 && Je(o, e) !== Je(o, i)
  ), r = t.targetPageIdentifierAttribute === void 0 ? t.alternateTargetPageIdentifiers : void 0, s = (o) => (r ? xn(r, o) : void 0) ?? t.targetPageIdentifier;
  return n || s(e) !== s(i);
}
function ce(t, e) {
  return e.EventDataType === ct && g(e.EventName) && !ze(e) && (t.triggerEventNames ?? []).includes(e.EventName);
}
const Un = "rokt.preselecttrigger", Ci = "rokt.preselectdefaulted", qs = /^[A-Za-z][A-Za-z0-9_.]{0,63}$/, Js = 16, Xe = "preselectFormEmail", Ot = "preselectBoundUser", Nt = "preselectEntry";
function Ke(t, e, i) {
  const n = (i !== void 0 ? vn(e, i) : void 0) ?? e.pathname;
  return `${t}|${n}`;
}
function F(t, e) {
  if (t)
    return x(t).find((i) => An(i, e));
}
function Fn(t, e, i) {
  if (!t || !g(e))
    return;
  const n = x(t).filter(
    (r) => r.targetPageIdentifierAttribute === void 0 ? Tt(r).includes(e) : i !== void 0 && Ae(r, i) === e
  );
  return n.length === 1 ? n[0] : void 0;
}
function Qs(t, e) {
  const i = new Set(
    Object.keys(e).filter((r) => !D(e[r])).map((r) => r.toLowerCase())
  ), n = {};
  for (const r of Object.keys(t))
    i.has(r.toLowerCase()) || (n[r] = t[r]);
  for (const r of Object.keys(e))
    D(e[r]) || (n[r] = e[r]);
  return n;
}
function Zs(t) {
  return !!t && x(t).some((e) => e.targetPageIdentifierAttribute !== void 0);
}
function qe(t, e) {
  if (!(!t || e === void 0))
    return x(t).find((i) => i.targetPageIdentifier === e);
}
function Mn(t, e) {
  const i = L(t, e);
  if (!D(i))
    return i;
  const n = e.toLowerCase(), r = Object.keys(t).filter((s) => s.toLowerCase() === n && !D(t[s])).map((s) => t[s]);
  return r.length > 0 && r.every((s) => s === r[0]) ? r[0] : void 0;
}
function eo(t) {
  const e = t.charCodeAt(0);
  return e < 32 || e >= 127 && e <= 159;
}
const to = Date.now(), Kt = /* @__PURE__ */ new Map();
function io(t, e) {
  const i = `${t.accountId}:${t.targetPageIdentifier}`;
  Kt.set(i, Math.max(Kt.get(i) ?? 0, e));
}
function Qt(t) {
  const { accountId: e, targetPageIdentifier: i } = t;
  if (!t.alternateTargetPageIdentifiers)
    return wi(e, i);
  const n = Kt.get(`${e}:${i}`) ?? to;
  return wi(e, i, n);
}
function no(t, e) {
  return xn(
    e,
    e.byPaymentPick ? Qt(t) : void 0
  );
}
function xn(t, e) {
  const { byPaymentPick: i, byHostname: n, byClientType: r } = t, s = r ? jn(navigator.userAgent) : void 0;
  return [
    i && e ? L(i, e) : void 0,
    n ? L(n, window.location.hostname) : void 0,
    r && s ? L(r, s) : void 0
  ].find(g);
}
function Ae(t, e) {
  const i = t.targetPageIdentifierAttribute;
  if (i === void 0) {
    const s = t.alternateTargetPageIdentifiers;
    return (s ? no(t, s) : void 0) ?? t.targetPageIdentifier;
  }
  const n = Mn(e, i);
  if (!g(n))
    return;
  const r = n.trim();
  return r !== "" && !/\s/.test(r) && !Array.from(r).some(eo) ? r : void 0;
}
function Ut(t, e) {
  if (!e)
    return t;
  const i = new Set(Object.keys(e).map((r) => r.toLowerCase())), n = {};
  for (const [r, s] of Object.entries(t))
    i.has(r.toLowerCase()) || (n[r] = s);
  return { ...n, ...e };
}
function Vn(t) {
  return t.getPreselectVariant?.() === "widened";
}
const ro = /iP(hone|od|ad)|Android|BlackBerry|BB10|IEMobile|Kindle/, so = /Win(dows|16|95|98|CE)|Pocket Internet Explorer|OpenBSD|SunOS|CrOS|Linux|X11|Mac_PowerPC|Macintosh|QNX|BeOS|OS\/2/;
function jn(t) {
  return ro.test(t) ? "MobileWeb" : so.test(t) ? "DesktopWeb" : void 0;
}
function Je(t, e) {
  if (g(t))
    return t;
  const i = jn(navigator.userAgent), n = i ? t.byClientType?.[i] : void 0;
  if (n === dn)
    return;
  const r = e && t.byPaymentPick ? L(t.byPaymentPick, e) : void 0, s = t.byHostname ? L(t.byHostname, window.location.hostname) : void 0;
  return r ?? s ?? n ?? t.value;
}
function $n(t) {
  return Object.values(t.preselectAttributeDefaults ?? {}).some((i) => v(i) && i.byPaymentPick) ? Qt(t) : void 0;
}
function vt(t) {
  return new Set(
    Object.keys(t).filter((e) => !D(t[e])).map((e) => e.toLowerCase())
  );
}
function Hn(t, e) {
  return !Vn(t) || !g(e) && !!(e.matchGroups || e.skipValues);
}
function lt(t, e, i) {
  const n = e.preselectAttributeDefaults;
  if (!n)
    return {};
  const r = /* @__PURE__ */ new Set([...vt(t.getUserIdentities?.() ?? {}), ...vt(i)]), s = vt(t.userAttributes ?? {}), o = $n(e), a = {};
  for (const c of Object.keys(n)) {
    const l = c.toLowerCase();
    if (!Hn(t, n[c]) || Fe(c, t.mappedEmailSha256Key) || r.has(l) || s.has(l) && !Wn(t, e, c))
      continue;
    const u = Je(n[c], o);
    u !== void 0 && (a[c] = u);
  }
  return a;
}
function Wn(t, e, i) {
  const n = L(e.preselectAttributeDefaults ?? {}, i);
  return v(n) && n.skipRemembered === !0 && Hn(t, n) && !Fe(i, t.mappedEmailSha256Key) && Je(
    n,
    $n(e)
  ) !== void 0;
}
function oo(t, e, i, n, r) {
  const s = e.preselectAttributeDefaults ?? {};
  return Object.keys(s).find((o) => {
    const a = s[o];
    if (g(a) || !a.skipValues)
      return !1;
    const c = a.skipValues.map((u) => u.toLowerCase()), l = n ?? {
      ...t.getUserIdentities?.() ?? {},
      ...L(r, o) !== void 0 ? {} : t.userAttributes ?? {},
      ...i
    };
    return Object.keys(l).some((u) => {
      const d = l[u];
      return u.toLowerCase() === o.toLowerCase() && (g(d) || typeof d == "number" || typeof d == "boolean") && c.includes(String(d).toLowerCase());
    });
  });
}
function Zt(t) {
  const e = t.getPreselectVariant?.();
  return e === "widened" || e === "standard" ? { variant: e } : {};
}
function ao(t, e, i) {
  const n = t?.identityKeys;
  if (!n?.length || !e)
    return n;
  const r = ei(e, i);
  return r.length > 0 ? [...n, ...r] : n;
}
function co(t, e, i) {
  const n = t?.preselectAttributeDefaults;
  if (!n || !e)
    return;
  const r = {};
  return ei(e, i).forEach((s) => {
    const o = n[s], a = g(o) ? void 0 : o?.matchGroups?.find((c) => c.includes(e[s]));
    a && (r[s] = a);
  }), Object.keys(r).length > 0 ? r : void 0;
}
function lo(t, e) {
  const i = t?.preselectAttributeDefaults;
  if (!i)
    return;
  const n = {};
  return Object.keys(i).forEach((r) => {
    const s = i[r];
    if (g(s) || s?.matchPaymentFamily !== !0)
      return;
    const o = Gn(e, r) ? void 0 : it(L(e, r));
    o && (n[r] = o);
  }), Object.keys(n).length > 0 ? n : void 0;
}
function ei(t, e) {
  return Object.keys(t).filter(
    (i) => L(e, i) === t[i] && !Gn(e, i)
  );
}
function Gn(t, e) {
  return Object.keys(t).some(
    (i) => i !== e && i.toLowerCase() === e.toLowerCase() && !D(t[i])
  );
}
function Yn(t, e) {
  if (!t)
    return;
  const i = ei(t, e).filter((n) => qs.test(n)).slice(0, Js);
  return i.length > 0 ? i.join(",") : void 0;
}
function Bn(t) {
  const e = Object.keys(t.preselectAttributeDefaults ?? {});
  return [...t.attributeKeys, ...e.filter((i) => !t.attributeKeys.includes(i))];
}
function uo(t) {
  if (!t)
    return;
  const e = x(t), i = [...new Set(e.flatMap((r) => r.intentSelectors?.commit ?? []))], n = [...new Set(e.flatMap((r) => r.intentSelectors?.checkoutStep ?? []))];
  if (!(i.length === 0 && n.length === 0))
    return {
      ...i.length > 0 ? { commit: i } : {},
      ...n.length > 0 ? { checkout_step: n } : {}
    };
}
function ke(t) {
  return t ? x(t).length > 0 : !1;
}
function fo(t, e, i = window.location.pathname) {
  if (t.pending.some((r) => r.pathname === i && !ve(r.event)))
    return;
  const n = t.scheduledDispatch;
  n && n.pathname === i && !ve(n.event) || Pe(t, e, Pn, i);
}
function go(t, e) {
  return !t || !g(e) ? !1 : x(t).some((i) => (i.triggerEventNames ?? []).includes(e));
}
function Qe(t) {
  return !ve(t) && !Ne(t) && t.EventDataType !== ct;
}
function po(t, e) {
  const i = t.scheduledDispatch;
  return i && i.pathname === e && Qe(i.event) ? !0 : t.pending.some((n) => n.pathname === e && Qe(n.event));
}
function ti(t, e, i, n) {
  const r = i?.alternateTargetPageIdentifiers ? Ae(i, n) : void 0;
  return es(
    t,
    r !== void 0 && r !== i?.targetPageIdentifier ? `${e}@${r}` : e
  );
}
function mo(t, e, i, n) {
  if (!t.isKitReady() || !t.isPreselectionEnabled() || !oi(t, i))
    return "waits";
  const { collected: r, missingKeys: s } = ue(t, e, i);
  if (s.length > 0)
    return "waits";
  const o = t.accountId || "", a = ye(
    ti(o, k(n), i, r)
  );
  if (!a)
    return "now";
  const c = dt(t, o, i.targetPageIdentifier, r);
  return a.byEvent || ci(a.attributesDigest, c) ? "skipped" : "now";
}
function ho(t, e, i) {
  t.pending = t.pending.filter((r) => r.pathname !== i);
  const n = e.accountId ? zt(e.accountId) : null;
  e.accountId && n && n.pathname === i && le(e.accountId);
}
function yo(t, e, i, n = window.location.pathname) {
  const r = F(e.accountId, n);
  if (!r || !ce(r, i))
    return;
  const s = mo(e, i, r, n);
  if (s === "now")
    ho(t, e, n);
  else if (po(t, n) || s === "skipped" && t.scheduledDispatch?.pathname === n)
    return;
  Pe(t, e, i, n);
}
function _o(t, e) {
  return t ? x(t).some((i) => i.attributeKeys.includes(e)) : !1;
}
function Eo() {
  return { pending: [] };
}
function ii(t) {
  if (t.dispatchTimer === void 0)
    return;
  const e = t.scheduledDispatch;
  return clearTimeout(t.dispatchTimer), t.dispatchTimer = void 0, t.scheduledDispatch = void 0, e;
}
function Io(t, e) {
  return t === void 0 ? e : e === void 0 ? t : Math.min(t, e);
}
function Si(t) {
  return ve(t) ? 0 : Ne(t) || t.EventDataType === ct ? 2 : 1;
}
function vo(t, e) {
  const i = F(t.accountId, e.pathname);
  return !!i && ue(t, e.event, i).missingKeys.length > 0;
}
function zn(t, e, i, n) {
  const r = t.pending.find((s) => s.pathname === n);
  return !!r && Si(i) < Si(r.event) && !(Qe(i) && vo(e, r));
}
function ne(t, e, i) {
  const n = t.pending.findIndex((r) => r.pathname === i.pathname);
  if (n >= 0) {
    if (zn(t, e, i.event, i.pathname))
      return;
    const r = t.pending[n];
    t.pending[n] = {
      ...i,
      triggeredAt: Io(r.triggeredAt, i.triggeredAt),
      intentSeen: i.intentSeen ?? r.intentSeen ?? _e(r.event),
      ...t.lateRefire || r.lateRefire ? { lateRefire: !0 } : {}
    };
    return;
  }
  t.pending.push(t.lateRefire ? { ...i, lateRefire: !0 } : i);
}
function De(t) {
  if (!t?.getUserIdentities)
    return [];
  const e = t.getUserIdentities().userIdentities;
  return e ? Object.keys(e).filter((i) => {
    const n = e[i];
    return g(n) && n.length > 0;
  }).sort() : [];
}
function M(t) {
  return De(t).length > 0;
}
const Ft = /^[^\s@]+@[^\s@]+\.(?:[a-zA-Z]{2,}|xn--[a-zA-Z0-9-]+|[^\s@.\x00-\x7F]{2,})$/, te = /* @__PURE__ */ new WeakSet(), Ce = /* @__PURE__ */ new WeakSet(), pe = /* @__PURE__ */ new WeakSet(), Se = /* @__PURE__ */ new WeakSet(), Mt = /* @__PURE__ */ new WeakSet(), ki = /* @__PURE__ */ new WeakSet();
function Ze(t) {
  if (!(t instanceof HTMLInputElement)) return !1;
  const e = t.type;
  return e === "text" || e === "email" || t.getAttribute("autocomplete") === "email" && e !== "hidden" && e !== "password";
}
function xt(t) {
  const e = t.target;
  if (!(e instanceof HTMLInputElement)) return;
  if (t.type === "blur" || t.type === "focusout") {
    if (t.isTrusted !== !0) return;
    !Ze(e) || !Ce.has(e) ? (te.delete(e), pe.delete(e)) : te.has(e) || Se.add(e);
    return;
  }
  const i = !ki.has(t);
  if (ki.add(t), t.isTrusted !== !0) {
    Mt.add(e), te.delete(e), Ce.delete(e), pe.delete(e), Se.delete(e);
    return;
  }
  if (i && Mt.delete(e), !Ze(e)) {
    te.delete(e), Ce.delete(e), pe.delete(e), Se.delete(e);
    return;
  }
  i && (pe.add(e), Se.delete(e), e.addEventListener("input", xt, !0), e.addEventListener("change", xt, !0), t.type === "change" ? (te.add(e), Ce.add(e)) : te.delete(e));
}
function Ao(t) {
  return Ze(t) && (t.type === "email" || t.getAttribute("autocomplete") === "email" || Ft.test(t.value.trim()));
}
function Ue(t) {
  return t.attributeKeys.find((e) => e.toLowerCase() === "email");
}
const Po = 254;
function bo(t) {
  return t.type === "email" || t.getAttribute("autocomplete") === "email" || t.value.includes("@");
}
function wo(t) {
  return bo(t) || Ce.has(t) && !te.has(t) && !(Se.has(t) && t !== document.activeElement);
}
function Xn(t) {
  const e = /* @__PURE__ */ new Map(), i = [];
  let n = 0;
  document.querySelectorAll("input").forEach((o) => {
    if (!Ze(o)) return;
    const a = te.has(o), c = pe.has(o);
    if (!a) {
      c && wo(o) && (n += 1), t && i.push(o);
      return;
    }
    const l = o.value.trim();
    Ft.test(l) && !e.has(l.toLowerCase()) && e.set(l.toLowerCase(), l);
  });
  const r = e.size > 0 && n > 0;
  let s;
  return t && !r && e.size === 0 && i.forEach((o) => {
    const a = o.value.trim();
    a.length > Po || !Ft.test(a) || (Mt.has(o) ? s = "untrusted_fill" : s !== "untrusted_fill" && (pe.has(o) || o === document.activeElement ? s = "uncommitted_fill" : s !== "uncommitted_fill" && (s = "unseen_fill")));
  }), { emails: e, ambiguous: r, unfilled: s };
}
function To() {
  const { emails: t, ambiguous: e } = Xn(!1);
  return t.size === 1 && !e ? t.values().next().value : void 0;
}
const ni = "enc";
function ri(t, e, i = {}) {
  const n = new Set(
    [e, "emailsha256", t.mappedEmailSha256Key].filter((o) => g(o) && o !== "").flatMap((o) => [o.toLowerCase(), o.toLowerCase() + ni])
  ), r = t.getCurrentUser?.();
  return [
    i,
    t.userAttributes,
    t.filteredUser?.getAllUserAttributes?.() ?? {},
    t.getUserIdentities?.() ?? {},
    r?.getAllUserAttributes?.() ?? {},
    r?.getUserIdentities?.().userIdentities ?? {}
  ].some(
    (o) => Object.keys(o).some((a) => n.has(a.toLowerCase()) && !D(L(o, a)))
  );
}
const Li = ["email", "emailsha256"];
function qn(t) {
  return g(t) && t !== "" ? [...Li, t.toLowerCase()] : Li;
}
function Fe(t, e) {
  const i = t.toLowerCase();
  return qn(e).some(
    (n) => i === n || i === n + ni
  );
}
function Co(t, e) {
  const i = t.toLowerCase();
  return qn(e).some((n) => i === n + ni);
}
function Me(t, e, i) {
  return t.getOutgoingAttributes ? He(t.getOutgoingAttributes(e, i), t.mappedEmailSha256Key) : He(e, t.mappedEmailSha256Key) || He(t.getUserIdentities?.() ?? {}, t.mappedEmailSha256Key);
}
function He(t, e) {
  return Object.keys(t).some(
    (i) => Fe(i, e) && !D(L(t, i))
  );
}
function si(t, e, i, n = {}) {
  return e.readEmailInput !== !0 ? "read_disabled" : An(e, window.location.pathname) ? t.isForwardingAllowed?.() !== !0 || t.isPreselectionPrivacyAllowed?.() === !1 || t.isTargetingDisabled?.() === !0 ? "privacy_blocked" : t.isEmailIdentityFiltered?.() === !0 ? "email_filtered" : ri(t, i, n) ? "partner_email" : void 0 : "off_route";
}
function So(t, e, i, n) {
  const r = si(t, e, i, n.EventAttributes ?? {});
  if (r) return r;
  const { emails: s, ambiguous: o, unfilled: a } = Xn(!0);
  return s.size > 1 || o ? "multiple_emails" : a ?? "no_field";
}
function ko(t, e, i) {
  const n = window.location.pathname, r = F(e.accountId, n), s = r && Ue(r);
  return !!s && t.pending.some(
    (o) => o.pathname === n && !si(e, r, s, o.event.EventAttributes ?? {})
  ) && i.isTrusted === !0 && Ao(i.target);
}
function Jn(t, e, i, n) {
  const r = Ue(e);
  if (!r || !D(L(i, r)) || si(t, e, r, n.EventAttributes ?? {}))
    return;
  const s = To();
  if (s)
    return i[r] = s, r;
}
function oi(t, e) {
  const i = Ue(e);
  return M(t.filteredUser) || e.readEmailInput === !0 && !!i && ai(t, e, {}).includes(i);
}
function Lo(t) {
  return !!t && x(t).some((e) => e.readEmailInput === !0);
}
function et(t) {
  return t.length > 0 ? t.join(",") : "none";
}
function O(t) {
  const e = t?.getMPID?.();
  return e == null ? null : String(e);
}
function Qn(t, e) {
  const i = De(t.filteredUser), n = t.getCurrentUser?.(), r = De(n), s = O(t.filteredUser), o = O(n), a = [...e.identityKeys ?? [], "email", "emailsha256"];
  t.mappedEmailSha256Key && a.push(t.mappedEmailSha256Key);
  const c = new Set(a.map((f) => f.toLowerCase())), l = n?.getAllUserAttributes?.() ?? {}, u = [t.userAttributes, l].some(
    (f) => Object.entries(f).some(
      ([m, E]) => c.has(m.toLowerCase()) && g(E) && E.length > 0
    )
  );
  let d = "no_identities";
  return t.filteredUser ? o !== null && s !== o ? d = "mpid_mismatch" : r.length > 0 && (d = "kit_user_lacks_identities") : d = "no_filtered_user", {
    identity_reason: d,
    kit_identity_types: et(i),
    current_identity_types: et(r),
    mpid_match: o === null ? "unknown" : s === o,
    identity_attribute_present: u
  };
}
function ai(t, e, i) {
  const n = Vn(t) ? e.widenedOptionalAttributeKeys ?? [] : [], r = new Set(
    [...e.optionalAttributeKeys ?? [], ...n].map((o) => o.toLowerCase())
  ), s = lt(t, e, i);
  return e.attributeKeys.filter(
    (o) => !r.has(o.toLowerCase()) && D(L(i, o)) && L(s, o) === void 0
  );
}
function ue(t, e, i, n = !0) {
  const r = t.filteredUser?.getAllUserAttributes?.() || {}, s = new Set(i.identityKeys ?? []);
  let o;
  const a = {};
  for (const d of i.attributeKeys) {
    const f = t.getEventAttributeValue(e, d), m = L(t.userAttributes, d);
    let E = !D(f) || Wn(t, i, d) ? f : D(m) ? L(r, d) : m;
    if (D(E) && s.has(d)) {
      o || (o = t.getUserIdentities?.() ?? {});
      const y = L(o, d);
      E = g(y) && y !== "" ? y : void 0;
    }
    D(E) || (a[d] = E);
  }
  const c = i.targetPageIdentifierAttribute;
  if (c !== void 0) {
    const d = [e.EventAttributes ?? {}, t.userAttributes, r].map((f) => Mn(f, c)).find((f) => !D(f));
    if (d !== void 0) {
      const f = c.toLowerCase(), m = Object.keys(a).filter((E) => E.toLowerCase() === f);
      for (const E of m.length > 0 ? m : [c])
        a[E] = d;
    }
  }
  const l = e.EventAttributes ?? {};
  for (const d of Object.keys(i.preselectAttributeDefaults ?? {})) {
    if (!D(t.getEventAttributeValue(e, d)))
      continue;
    const f = Object.keys(l).find(
      (m) => m.toLowerCase() === d.toLowerCase() && !D(l[m])
    );
    f !== void 0 && (a[f] = l[f]);
  }
  const u = n ? Jn(t, i, a, e) : void 0;
  return {
    collected: a,
    missingKeys: ai(t, i, a),
    formEmailKey: u
  };
}
const Zn = /* @__PURE__ */ new WeakMap();
function Ro(t) {
  return Zn.get(t);
}
function Do(t, e, i) {
  i && Zn.set(e, i);
  const n = (s) => {
    i?.();
    const o = e[Xe] ? "redacted" : s instanceof Error ? s.message : String(s);
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
const Ri = /* @__PURE__ */ new Map(), Di = /* @__PURE__ */ new Map();
function Oi(t, e, i) {
  const n = t.get(e), r = { previous: i, earlier: n };
  return n && (n.later = r), t.set(e, r), r;
}
function Ni(t, e, i, n) {
  const { earlier: r, later: s } = i;
  if (s) {
    s.previous = i.previous, s.earlier = r, r && (r.later = s);
    return;
  }
  n(i.previous), r && (r.later = void 0), t.get(e) === i && (r ? t.set(e, r) : t.delete(e));
}
function dt(t, e, i, n) {
  try {
    const r = qe(e, i), s = r ? lt(t, r, n) : void 0, o = Ut(n, s), a = t.getOutgoingAttributes ? t.getOutgoingAttributes(n, i) : { ...t.getUserIdentities?.() ?? {}, ...o }, c = Object.keys(a).sort().filter((h) => Fe(h, t.mappedEmailSha256Key) && !D(L(a, h))), l = (h) => Co(h, t.mappedEmailSha256Key), u = [...new Set(c.filter(l).map((h) => h.toLowerCase()))].sort().map((h) => [h, !0]), d = [
      ...c.filter((h) => !l(h)).map((h) => [h, L(a, h)]),
      ...u
    ], f = Object.keys(r?.preselectAttributeDefaults ?? {}), m = (h) => f.some((I) => I.toLowerCase() === h.toLowerCase()), E = {};
    for (const [h, I] of Object.entries(o))
      m(h) || (E[h] = l(h) ? !D(I) : I);
    for (const h of f) {
      const I = Object.keys(a).filter((P) => P.toLowerCase() === h.toLowerCase() && !D(a[P])).sort().map((P) => [P, a[P]]);
      I.length > 0 && (E[h] = l(h) ? !0 : I);
    }
    const y = JSON.stringify(E), w = [.../* @__PURE__ */ new Set([...r?.attributeKeys ?? [], ...Object.keys(o)])].filter((h) => !m(h) && !l(h)).sort().filter((h) => {
      const I = L(a, h);
      return I !== void 0 && I !== L(o, h);
    }).map((h) => [h, L(a, h)]), C = d.length > 0 ? `${y}|${JSON.stringify(d)}` : y, T = w.length > 0 ? `${C}>${JSON.stringify(w)}` : C, _ = r?.alternateTargetPageIdentifiers ? Ae(r, n) : void 0, b = _ !== void 0 && _ !== i ? `${T}@${_}` : T, R = Yn(t.getPreselectFills?.(n, i) ?? s, a);
    return R ? { digest: ie(`${b}#${R}`), unmarkedDigest: ie(b) } : { digest: ie(b) };
  } catch {
    return {};
  }
}
function ci(t, e) {
  return t !== void 0 && e.digest !== void 0 && (t === e.digest || t === e.unmarkedDigest);
}
function li(t, e, i, n) {
  return St(t, e, i.digest, n) || i.unmarkedDigest !== void 0 && St(t, e, i.unmarkedDigest, n);
}
function di(t) {
  return !t.isTargetingDisabled?.() && t.isPreselectionPrivacyAllowed?.() !== !1 && t.isForwardingAllowed?.() !== !1;
}
function xe(t, e, i, n, r, s, o, a = !1, c, l = a, u, d, f, m = !1) {
  if (!di(t))
    return !1;
  const E = c ? { intent_kind: c.replace("intent_", "") } : {}, y = qe(e, n), w = y?.targetPageIdentifierAttribute !== void 0, C = y && (w || y.alternateTargetPageIdentifiers) ? Ae(y, t.filterAttributes ? t.filterAttributes(r) : r) : n;
  if (C === void 0) {
    const Y = y !== void 0 && Ae(y, r) !== void 0;
    return t.logPlacementDiagnostic(
      S("missed", "no_target_page_identifier", {
        ...E,
        ...Y ? { cause: "filtered" } : {}
      })
    ), !1;
  }
  const T = y ? lt(t, y, r) : {}, _ = t.getOutgoingAttributes?.(r, n), b = y ? oo(t, y, r, _, T) : void 0;
  if (b)
    return t.logPlacementDiagnostic(
      S("skipped", `skip_value:${b}`, E)
    ), !1;
  const R = ti(e, i, y, r), h = dt(t, e, n, r), I = h.digest;
  if (c && li(e, n, h, c !== "intent_cart"))
    return t.logPlacementDiagnostic(S("skipped", "active_preselection", E)), !0;
  if (a && ye(R)?.byEvent)
    return t.logPlacementDiagnostic(S("skipped", "active_preselection")), !1;
  const P = I !== void 0 ? ye(R) : null;
  if (I !== void 0) {
    if (ci(P?.attributesDigest, h))
      return t.logPlacementDiagnostic(S("skipped", "active_preselection", E)), !0;
    ts(
      R,
      I,
      l || !!c && ye(R)?.byEvent === !0
    );
  }
  const V = Object.keys(T).filter((Y) => !_ || L(_, Y) === T[Y]);
  t.logPlacementDiagnostic(
    S("fired", m ? "intent_refire" : s, {
      identity_types: et(De(t.filteredUser)),
      ...u ? { email_source: "input" } : {},
      ...c ? {
        ...E,
        intent_route: f ? f.route : "entry",
        ...d ? { intent_source: d } : {},
        ...f ? { logged_in: f.loggedIn } : {}
      } : {},
      ...Zt(t),
      ...V.length > 0 ? { defaulted_keys: V.join(",") } : {}
    })
  );
  const G = `${e}:${n}`, fe = Oi(
    Ri,
    G,
    _s(
      e,
      n,
      I,
      c === "intent_cart",
      y ? Qt(y) ?? null : void 0
    )
  ), J = I !== void 0 ? Oi(Di, R, P) : void 0;
  let K = !1;
  const Q = () => {
    K || (K = !0, J && Ni(
      Di,
      R,
      J,
      (Y) => is(R, Y, I)
    ), Ni(
      Ri,
      G,
      fe,
      (Y) => Es(e, n, Y, I)
    ));
  };
  return Do(t, {
    attributes: { ...r, [Un]: o },
    preselect: !0,
    identifier: C,
    // The entry that fired travels with the call, so its defaults and cache keys never come from another entry whose
    // target value the call's identifier also matches.
    ...C !== n ? { [Nt]: n } : {},
    omitUrl: !0,
    ...u ? { [Xe]: { key: u, mpid: O(t.filteredUser) } } : {},
    ...f ? { [Ot]: { mpid: O(t.filteredUser), requireLogin: f.requireLogin } } : {}
  }, Q), !0;
}
function Oo(t, e) {
  if (!e.accountId || !e.isKitReady())
    return;
  const i = zt(e.accountId);
  if (!i)
    return;
  if (t.pending.some((o) => o.pathname === i.pathname)) {
    le(e.accountId);
    return;
  }
  if (!e.isPreselectionEnabled()) {
    le(e.accountId);
    return;
  }
  if (!M(e.filteredUser) || (le(e.accountId), O(e.filteredUser) !== i.mpid))
    return;
  const n = F(e.accountId, i.pathname);
  if (!n || n.targetPageIdentifier !== i.identifier)
    return;
  if (!i.byEvent && gt(e)) {
    e.logPlacementDiagnostic(S("missed", "recovery_awaits_intent"));
    return;
  }
  const r = ae(i.attributes), s = ai(e, n, r);
  if (s.length > 0) {
    for (const o of s)
      e.logPlacementDiagnostic(
        S("missed", `missing_persisted_attribute:${o}`, Zt(e))
      );
    return;
  }
  xe(
    e,
    e.accountId,
    i.identifier,
    i.identifier,
    r,
    "recovered",
    Ke("recovered", n, i.pathname)
  );
}
function ui(t) {
  return !t.isTargetingDisabled?.() && t.isPreselectionPrivacyAllowed?.() !== !1 && t.isKitReady() && t.isPreselectionEnabled();
}
function ut(t) {
  return t === void 0 ? {} : { since_trigger_ms: Date.now() - t };
}
function er(t, e, i) {
  if (e.waitingFor !== "intent" || e.intentSeen)
    return !1;
  const n = F(t.accountId, e.pathname);
  return !!n && n === F(t.accountId, i);
}
function Vt(t, e) {
  ui(t) && t.logPlacementDiagnostic(
    S("missed", "left_trigger_path", {
      waiting_for: e.waitingFor,
      has_identity: M(t.filteredUser),
      ...ut(e.triggeredAt)
    })
  );
}
function Pe(t, e, i, n = window.location.pathname, r, s = Date.now(), o) {
  const a = t.pending.filter((u) => u.pathname !== n);
  if (a.length > 0) {
    const u = e.accountId ? zt(e.accountId) : null;
    e.accountId && u && a.some((d) => d.pathname === u.pathname) && le(e.accountId), a.forEach((d) => {
      er(e, d, n) ? t.intentWaitMovedWithin = F(e.accountId, n) : Vt(e, d);
    }), t.pending = t.pending.filter((d) => d.pathname === n);
  }
  const c = ii(t), l = c !== void 0 && c.pathname === n && ve(c.event);
  if (c && !l) {
    const u = F(e.accountId, c.pathname);
    k(c.pathname) !== k(n) && u?.releaseHoldOnRouteChange ? (tr(t, e, c, "hold_released_on_route_change"), t.pending = t.pending.filter((d) => d.pathname === c.pathname ? (Vt(e, d), !1) : !0)) : Ki(e, c, n);
  }
  No(t, e, i, n, r, s, l, o), l && t.scheduledDispatch === void 0 && Ki(e, c, n);
}
function Ki(t, e, i) {
  t.logPlacementDiagnostic(
    S("missed", "hold_cancelled", {
      held_ms: Date.now() - e.heldAt,
      same_path: e.pathname === i
    })
  );
}
function No(t, e, i, n, r, s, o, a) {
  const c = t.pending.find((u) => k(u.pathname) === k(n));
  if (a ?? (a = _e(i) ?? c?.intentSeen ?? _e(c?.event)), e.isTargetingDisabled?.() || e.isPreselectionPrivacyAllowed?.() === !1)
    return;
  const l = F(e.accountId, n);
  if (!l) {
    Ko(e, n);
    return;
  }
  if (l.alternateTargetPageIdentifiers && !_e(i) && !ce(l, i) && io(l, s), !(r !== void 0 && O(e.filteredUser) !== r)) {
    if (!a && !ce(l, i) && gt(e)) {
      const u = t.intentWaitMovedWithin === l;
      t.intentWaitMovedWithin = void 0;
      const d = u || c?.waitingFor === "intent" && c.awaitingIntentLogged === !0, f = e.isKitReady() && e.isPreselectionEnabled();
      ne(t, e, {
        event: i,
        pathname: n,
        // Bound to an identified shopper, as a timer hold is, so another user's click never sends
        // this page view's attributes. A guest stays unbound so signing in at checkout still fires.
        triggeringUserId: r ?? (M(e.filteredUser) ? O(e.filteredUser) : void 0),
        triggeredAt: s,
        waitingFor: "intent",
        awaitingIntentLogged: d || f
      }), !d && f && e.logPlacementDiagnostic(S("held", "awaiting_intent")), f && jt(e, l, i);
      return;
    }
    if (!e.isKitReady()) {
      if (zn(t, e, i, n))
        return;
      const u = [], d = O(e.filteredUser);
      if (e.accountId && d && M(e.filteredUser)) {
        const { collected: f, missingKeys: m, formEmailKey: E } = ue(e, i, l);
        if (m.length === 0 && !E) {
          const y = ae(f);
          (ce(l, i) || !!a ? bi(
            e.accountId,
            n,
            l.targetPageIdentifier,
            y,
            d,
            !0
          ) : bi(e.accountId, n, l.targetPageIdentifier, y, d)) || u.push(S("queued", "persist_failed"));
        }
      }
      ne(t, e, {
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
      if (jt(e, l, i), !oi(e, l)) {
        e.logPlacementDiagnostic(
          S("missed", "no_valid_identity", Qn(e, l))
        ), ne(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "identity" });
        return;
      }
      if (l.dispatchDelayMs !== void 0 && !ce(l, i) && !Ne(i) && !a) {
        const u = O(e.filteredUser), d = Math.min(
          l.dispatchDelayMs,
          Math.max(0, s + l.dispatchDelayMs - Date.now())
        );
        t.scheduledDispatch = { event: i, pathname: n, heldAt: Date.now(), heldForUserId: u, triggeredAt: s }, o || e.logPlacementDiagnostic(S("held", "dispatch_delay", { delay_ms: d })), t.dispatchTimer = setTimeout(() => {
          t.dispatchTimer = void 0, t.scheduledDispatch = void 0, ir(t, e.getCurrentHost?.() ?? e, i, n, u, s);
        }, d);
        return;
      }
      nr(
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
function jt(t, e, i) {
  if (!t.accountId) return;
  const n = Ue(e), r = e.readEmailInput === !0 && !!n && (ri(t, n, i.EventAttributes ?? {}) || Jn(t, e, {}, i) !== void 0);
  fs(
    t.accountId,
    e.targetPageIdentifier,
    M(t.filteredUser) || r
  );
}
function Ko(t, e) {
  const i = t.accountId;
  !i || t.isKitReady() && !t.isPreselectionEnabled() || x(i).forEach((n) => {
    In(n).some((r) => Rs(r, e)) && ys(i, n.targetPageIdentifier);
  });
}
function Uo(t) {
  const e = j[j.length - 1];
  return t !== void 0 && (e === void 0 || t < e.since);
}
function Fo() {
  try {
    return new URL(document.referrer).origin === window.location.origin ? "same_origin" : "other_origin";
  } catch {
    return "none";
  }
}
function ft(t) {
  return t.isCheckoutIntentActive?.() === !0 && t.isPreselectionPrivacyAllowed?.() !== !1;
}
function gt(t) {
  return ft(t) && t.isLinkIntentWithheld?.() !== !0;
}
function tr(t, e, i, n, r) {
  ir(
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
function ir(t, e, i, n, r, s, o, a) {
  const c = F(e.accountId, n);
  if (!(!c || e.isTargetingDisabled?.() || e.isPreselectionPrivacyAllowed?.() === !1)) {
    if (!a && !ce(c, i) && !Ne(i) && gt(e)) {
      const l = e.isKitReady() && e.isPreselectionEnabled();
      ne(t, e, {
        event: i,
        pathname: n,
        triggeringUserId: r,
        triggeredAt: s,
        waitingFor: "intent",
        awaitingIntentLogged: l
      }), l && e.logPlacementDiagnostic(S("held", "awaiting_intent"));
      return;
    }
    if (!e.isKitReady()) {
      ne(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "launcher" });
      return;
    }
    if (e.isPreselectionEnabled()) {
      if (!oi(e, c)) {
        e.logPlacementDiagnostic(
          S("missed", "no_valid_identity", Qn(e, c))
        ), ne(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "identity" });
        return;
      }
      O(e.filteredUser) === r && nr(t, e, i, n, c, r, s, o, a);
    }
  }
}
function nr(t, e, i, n, r, s, o, a, c, l) {
  if (e.isPreselectionPrivacyAllowed?.() === !1) return;
  const { collected: u, missingKeys: d, formEmailKey: f } = ue(e, i, r), m = t.lastResolvedPageView, E = j[j.length - 1], y = k(n);
  if (Ne(i) && m && m.accountId === e.accountId && m.pathname === y && m.route === E && m.userId === O(e.filteredUser) && m.identifier === r.targetPageIdentifier && m.attributeKeys.some(
    (b) => r.attributeKeys.includes(b) && D(L(u, b))
  ))
    return;
  if (d.length > 0) {
    const b = De(e.filteredUser), R = Ue(r);
    for (const h of d)
      e.logPlacementDiagnostic(
        S("missed", `missing_attribute:${h}`, {
          identity_types: et(b),
          key_is_identity: b.some((I) => I.toLowerCase() === h.toLowerCase()),
          ...h === R ? { email_reason: So(e, r, h, i) } : {},
          ...Zt(e)
        })
      );
    ne(t, e, {
      event: i,
      pathname: n,
      triggeringUserId: s,
      triggeredAt: o,
      intentSeen: c,
      waitingFor: "attribute"
    });
    return;
  }
  const w = c ?? _e(i);
  if (w && !Me(e, u, r.targetPageIdentifier)) {
    t.noEmailLoggedPathname !== y && (t.noEmailLoggedPathname = y, e.logPlacementDiagnostic(
      S("missed", "no_strict_email", {
        intent_kind: w.replace("intent_", ""),
        has_identity: M(e.filteredUser)
      })
    )), ne(t, e, {
      event: i,
      pathname: n,
      triggeringUserId: s,
      triggeredAt: o,
      intentSeen: w,
      waitingFor: "attribute"
    });
    return;
  }
  t.noEmailLoggedPathname = void 0, l && (t.pending = t.pending.filter((b) => b !== l));
  const C = ce(r, i), T = w ?? (C ? "event" : ve(i) ? "pathname" : "pageview");
  xe(
    e,
    e.accountId || "",
    k(n),
    r.targetPageIdentifier,
    u,
    a ?? (w ? "intent" : C ? "event_trigger" : "fired"),
    Ke(T, r, n),
    C && !w,
    w,
    C,
    f,
    w ? t.intentSource : void 0,
    void 0,
    t.lateRefire === !0
  ) && (Qe(i) || C) && (t.lastResolvedPageView = {
    accountId: e.accountId,
    pathname: y,
    route: E,
    userId: O(e.filteredUser),
    identifier: r.targetPageIdentifier,
    attributeKeys: Object.keys(u)
  });
}
const Mo = ["", "0", "[]", "{}", "false", "null"];
function rr(t) {
  if (D(t)) return !1;
  if (Array.isArray(t)) return !0;
  const e = String(t).trim();
  if (Mo.includes(e.toLowerCase())) return !1;
  try {
    const i = JSON.parse(e);
    return !Array.isArray(i) || i.length > 0;
  } catch {
    return !0;
  }
}
function we(t) {
  const e = t ? st(t) : [];
  return e.length === 1 && e[0].cartUserAttribute ? e[0] : void 0;
}
function xo(t) {
  return we(t) !== void 0;
}
function Ui(t, e) {
  const i = we(t)?.cartUserAttribute;
  return g(i) && i.toLowerCase() === e.toLowerCase();
}
function Fi(t, e, i) {
  const n = we(t)?.cartUserAttribute?.toLowerCase();
  if (!n || i && Bn(i).some((s) => s.toLowerCase() === n))
    return e;
  const r = {};
  for (const [s, o] of Object.entries(e))
    s.toLowerCase() !== n && (r[s] = o);
  return r;
}
function sr(t, e) {
  const i = t.filteredUser?.getAllUserAttributes?.() ?? {}, n = Object.keys(i).find((r) => r.toLowerCase() === e.toLowerCase());
  return n === void 0 ? void 0 : i[n];
}
function or(t) {
  const { search: e, hash: i } = window.location, n = /^#!|^#[^?&]*\//.test(i);
  return k(t) + e + (n ? i : "");
}
function ar(t) {
  try {
    return ie(g(t) ? t : JSON.stringify(t) ?? "");
  } catch {
    return;
  }
}
function Mi(t, e, i = window.location.pathname) {
  t.cartPageViewPathname = k(i), cr(t, e, i);
}
function cr(t, e, i) {
  const n = we(e.accountId);
  if (!n || t.cartPageViewPathname !== k(i) || // The cart entry's own route waits for its add-to-cart click, and another entry's route is a checkout step the
  // shopper reaches after the cart, where a call made for the cart page is rarely used.
  F(e.accountId, i) !== void 0 || !di(e)) {
    t.cartPageViewPathname = void 0;
    return;
  }
  if (!e.isKitReady()) return;
  if (!e.isPreselectionEnabled()) {
    t.cartPageViewPathname = void 0;
    return;
  }
  const r = e.accountId;
  if (ks(r, n.targetPageIdentifier, ie(or(i)))) {
    t.cartPageViewPathname = void 0;
    return;
  }
  const s = sr(e, n.cartUserAttribute);
  if (!(rr(s) || ms(r, O(e.filteredUser))) || !M(e.filteredUser)) return;
  const a = ar(s);
  if (a !== void 0 && Cs(r, n.targetPageIdentifier, a, O(e.filteredUser)))
    return;
  const { collected: c, missingKeys: l } = ue(e, Ds, n, !1);
  if (l.length > 0 || !Me(e, c, n.targetPageIdentifier)) return;
  t.cartPageViewPathname = void 0;
  const u = dt(e, r, n.targetPageIdentifier, c), d = ye(ti(r, n.targetPageIdentifier, n, c));
  li(r, n.targetPageIdentifier, u) || ci(d?.attributesDigest, u) || xe(
    e,
    r,
    n.targetPageIdentifier,
    n.targetPageIdentifier,
    c,
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
function Vo(t, e, i = window.location.pathname) {
  if (Oo(t, e), xs(t, e), t.cartPageViewPathname !== void 0 && cr(t, e, i), t.pending.length === 0)
    return;
  const n = t.pending;
  t.pending = [], n.forEach((r) => {
    const { event: s, pathname: o, storedDiagnostics: a, triggeringUserId: c, triggeredAt: l, waitingFor: u, intentSeen: d } = r, f = ui(e), m = M(e.filteredUser), E = ut(l);
    if (f && u === "identity" && m && e.logPlacementDiagnostic(
      S("identity_arrived", "pending_identity", {
        ...E,
        on_trigger_path: o === i
      })
    ), o !== i) {
      er(e, r, i) ? t.intentWaitMovedWithin = F(e.accountId, i) : Vt(e, { waitingFor: u, triggeredAt: l });
      return;
    }
    if (u === "intent" && !d) {
      const y = F(e.accountId, o);
      if (y && gt(e)) {
        !r.awaitingIntentLogged && e.isKitReady() && e.isPreselectionEnabled() && (e.logPlacementDiagnostic(S("held", "awaiting_intent")), jt(e, y, s), r.awaitingIntentLogged = !0), t.pending.push(r);
        return;
      }
    }
    f && a?.forEach((y) => e.logPlacementDiagnostic(y)), t.scheduledDispatch?.pathname !== o && Kn(
      t,
      r.lateRefire === !0,
      () => Pe(t, e, s, o, c, l, d)
    );
  });
}
function jo(t, e, i, n = i) {
  if (!t.accountId || !ui(t))
    return;
  const r = Fn(t.accountId, e, n);
  if (!r)
    return;
  const s = we(t.accountId);
  if (s?.targetPageIdentifier === r.targetPageIdentifier) {
    const c = or(window.location.pathname);
    c !== "/" && Ss(t.accountId, r.targetPageIdentifier, ie(c));
    const l = sr(t, s.cartUserAttribute);
    Ts(
      t.accountId,
      r.targetPageIdentifier,
      rr(l) ? ar(l) : void 0,
      O(t.filteredUser)
    );
  }
  const o = ws(t.accountId, r.targetPageIdentifier);
  if (!o || (ft(t) && t.isForwardingAllowed?.() !== !1 && t.logPlacementDiagnostic(
    S("arrived", "intent_arrival", {
      ...$o(o),
      ...Ho(o, i)
    })
  ), o.firedAt !== void 0))
    return;
  const a = o.triggeredAt !== void 0;
  t.logPlacementDiagnostic(
    S("missed", "arrival_without_fire", {
      trigger_seen: a,
      identity_seen_on_trigger_path: o.identitySeenAt !== void 0,
      has_identity: M(t.filteredUser),
      // Another tab's checkout caches its offers in that tab, so this arrival still misses. This tab's
      // own trigger counts too: the device marker can expire, be cleared by another tab or fail to save.
      trigger_seen_any_tab: a || gs(t.accountId, r.targetPageIdentifier),
      ...ut(o.triggeredAt),
      near_miss_seen: Uo(o.nearMissAt),
      // Page memory loses the trigger record on a full navigation, so trigger_seen reads false.
      storage: hr() ? "page" : "device",
      referrer: Fo()
    })
  );
}
function $o(t) {
  const e = t.intentAt === void 0 || t.intentKind === void 0 ? "none" : Go(Date.now() - t.intentAt);
  return {
    intent_seen: e === "none" ? "none" : t.intentKind,
    lead: e,
    fired: t.firedAt !== void 0
  };
}
function Ho(t, e) {
  const i = Fr(e), n = t.paymentPickAt === void 0 ? -1 : Date.now() - t.paymentPickAt, r = t.paymentPick && n >= 0 && n < Ee ? t.paymentPick : "none";
  if (r === "none" && i === "absent")
    return {};
  const s = t.firedAt === void 0 ? -1 : Date.now() - t.firedAt, o = t.paymentAtFire && s >= 0 && s < Ee ? t.paymentAtFire : "none";
  return {
    payment_guess: o,
    payment_pick: r,
    payment_arrival: i,
    payment_match: o !== "none" && i !== "absent" && i !== "other" ? o === i : "n/a"
  };
}
const Wo = [
  [1e3, "lt1s"],
  [2e3, "1s_2s"],
  [5e3, "2s_5s"],
  [1e4, "5s_10s"],
  [2e4, "10s_20s"],
  [6e4, "20s_60s"],
  [3e5, "60s_300s"],
  [Ee, "300s_1800s"]
];
function Go(t) {
  if (t < 0)
    return "none";
  const e = Wo.find(([i]) => t < i);
  return e ? e[1] : "none";
}
function Yo() {
  return {
    context: null,
    lifecycle: "idle",
    recreateInFlight: null
  };
}
function Bo(t, e) {
  t.context = {
    accountId: e.accountId,
    launcherOptions: { ...e.launcherOptions },
    legacyRoktExtensions: [...e.legacyRoktExtensions]
  };
}
function zo(t) {
  t.lifecycle = "attached";
}
function Xo(t) {
  t.lifecycle !== "idle" && (t.lifecycle = "terminated");
}
function qo(t) {
  t.lifecycle = "terminated";
}
function Jo(t) {
  t.context = null, t.lifecycle = "idle", t.recreateInFlight = null;
}
function Qo(t, e, i) {
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
const xi = "rokt:intent", Vi = "LEAD_CAPTURE_SUBMITTED";
class Zo {
  constructor(e) {
    this.handlers = e, this.config = null, this.dispatchedForPageView = !1;
  }
  configure(e) {
    this.config = e, this.dispatchedForPageView = !1, this.detachListeners(), this.isIdentityCaptureBridgeEnabled(this.config) && (this.leadCaptureSubmittedListener = (i) => {
      const n = this.parseLeadCaptureSubmittedPayload(i);
      n && this.handlers.onLeadCaptureSubmitted(n);
    }, window.addEventListener(Vi, this.leadCaptureSubmittedListener)), this.isExitIntentBridgeEnabled(this.config) && (this.exitIntentListener = (i) => this.handleExitIntentEvent(i), window.addEventListener(xi, this.exitIntentListener));
  }
  resetPageViewState() {
    this.dispatchedForPageView = !1;
  }
  dispose() {
    this.detachListeners(), this.config = null, this.dispatchedForPageView = !1;
  }
  detachListeners() {
    this.exitIntentListener && (window.removeEventListener(xi, this.exitIntentListener), this.exitIntentListener = void 0), this.leadCaptureSubmittedListener && (window.removeEventListener(Vi, this.leadCaptureSubmittedListener), this.leadCaptureSubmittedListener = void 0);
  }
  isExitIntentBridgeEnabled(e) {
    return !!(e && e.enabled !== !1);
  }
  isIdentityCaptureBridgeEnabled(e) {
    if (!this.isExitIntentBridgeEnabled(e))
      return !1;
    const i = e ? e.identityCapture : void 0;
    return v(i) ? i.enabled === !0 : !1;
  }
  allowCustomUserAttributes(e) {
    const i = e ? e.identityCapture : void 0;
    return v(i) ? i.allowCustomUserAttributes === !0 : !1;
  }
  getAllowedUserAttributeKeys(e) {
    const i = e ? e.identityCapture : void 0;
    if (!v(i))
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
    const r = this.config && v(this.config.attributes) ? this.config.attributes : {};
    this.handlers.onExitIntent(
      i,
      r
    ) || (this.dispatchedForPageView = !1);
  }
  parseLeadCaptureSubmittedPayload(e) {
    if (!(e instanceof CustomEvent) || !v(e.detail))
      return null;
    const i = e.detail;
    if (!v(i.body))
      return null;
    const n = i.body, r = g(n.email) ? n.email : void 0, s = g(n.mobile_number) ? n.mobile_number : void 0, o = {};
    g(r) && r.length > 0 && (o.email = r), g(s) && s.length > 0 && (o.mobile_number = s);
    const a = {}, c = this.allowCustomUserAttributes(this.config), l = this.getAllowedUserAttributeKeys(this.config);
    this.mergeLeadCaptureUserAttributes(
      a,
      v(n.userAttributes) ? n.userAttributes : null,
      c,
      l
    );
    const u = g(n.rclid) ? n.rclid : void 0;
    u && u.length > 0 && (a.rokt_rclid = u);
    const d = g(n.accountID) ? n.accountID : void 0;
    d && d.length > 0 && (a.rokt_account_id = d);
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
const $ = "Rokt", ea = 7, We = 181, ta = "selectPlacements", ia = ["paypalpayerid"], na = "Auto Button Click", ra = "Auto Link Click", ji = "rokt_placement", sa = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/, oa = 500, aa = "apps.roktecommerce.com", ca = 0.1, la = "ThankYouPageJourney", da = "rokt-launcher", ua = "rokt-thank-you-element", fa = "userIdentifiedInWorkspace", $i = 3, ga = 2, pa = "page_events", ma = "page_view_attributes", ha = "mparticle_session_id", Hi = "mparticle_device_id", At = "exit-intent", ya = [
  "3479519924056514560",
  "3484183287406608384",
  "3198447216177237634",
  "3292347205549055462"
], _a = "exit-intent-placement", Wi = 500, fi = {
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  UNHANDLED_EXCEPTION: "UNHANDLED_EXCEPTION",
  IDENTITY_REQUEST: "IDENTITY_REQUEST",
  LOG_DELIVERY_FAILURE: "LOG_DELIVERY_FAILURE"
}, Le = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARNING: "WARNING"
}, Ea = "apps.rokt-api.com", Ia = "/v1/log", va = "/v1/errors", Aa = 10;
function p() {
  return window.mParticle;
}
function Gi(t, e) {
  const n = [pt(t), "/wsdk/integrations/launcher.js"].join("");
  return !e || e.length === 0 ? n : n + "?extensions=" + e.join(",");
}
function Yi(t) {
  return [pt(t), "/rokt-elements/rokt-element-thank-you.js"].join("");
}
function pt(t) {
  const e = t !== void 0 ? t : Ea;
  return e.includes("://") ? e.replace(/\/+$/, "") : ["https://", e].join("");
}
function lr(t, e, i) {
  if (t)
    return t.startsWith("http://") || t.startsWith("https://") ? t : "https://" + t;
  const r = e?.includes("://") && !/^https?:\/\//i.test(e) ? void 0 : e;
  return pt(r) + i;
}
function Bi(t, e, i) {
  if (document.getElementById(t)) return;
  const n = document.head || document.body, r = document.createElement("script");
  r.id = t, r.type = "text/javascript", r.src = e, r.async = !0, r.crossOrigin = "anonymous", r.fetchPriority = "high", i?.onLoad && (r.onload = i.onLoad), i?.onError && (r.onerror = i.onError), n.appendChild(r);
}
function Ge(t) {
  if (!t)
    return [];
  const e = nn(t);
  return e === void 0 ? (console.error("Settings string contains invalid JSON"), []) : e;
}
function zi(t) {
  const e = t ? Ge(t) : [], i = [], n = [];
  let r = !1;
  for (let s = 0; s < e.length; s++) {
    const o = e[s].value;
    o === "thank-you-journey" ? (r = !0, n.push(la)) : i.push(o);
  }
  return {
    roktExtensionsQueryParams: i,
    legacyRoktExtensions: n,
    loadThankYouElement: r
  };
}
async function Pa(t, e) {
  const i = [];
  if (e)
    for (const n of t)
      i.push(e.use(n));
  return Promise.all(i);
}
function Xi(t) {
  if (!t)
    return {};
  const e = {};
  for (let i = 0; i < t.length; i++) {
    const n = t[i];
    e[n.jsmap] = n.value;
  }
  return e;
}
function qi(t) {
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
function Ji(t, e, i) {
  return p().generateHash([t, e, i].join(""));
}
function ba(t) {
  let n = "mParticle_wsdkv_" + p().getVersion() + "_kitv_" + "3.36.1";
  return t && (n += "_" + t), n;
}
function Qi(t) {
  return !!(t && ya.includes(t));
}
function $t(t) {
  const e = document.createElement("iframe");
  e.style.display = "none", e.setAttribute("sandbox", "allow-scripts allow-same-origin"), e.src = t, e.onload = function() {
    e.onload = null, e.parentNode && e.parentNode.removeChild(e);
  };
  const i = document.body || document.head;
  i && i.appendChild(e);
}
function Zi(t, e) {
  const i = ie(window.location.origin);
  if (be._allowedOriginHashes.indexOf(i) === -1 || Math.random() >= ca)
    return;
  const r = window.__rokt_li_guid__;
  if (!r || t && t.includes("://") && !/^https:\/\//i.test(t))
    return;
  const s = Wt(window.location.href), o = "version=" + encodeURIComponent(e ?? "") + "&launcherInstanceGuid=" + encodeURIComponent(r) + "&pageUrl=" + encodeURIComponent(s), a = t ? pt(t) : "https://apps.rokt.com";
  $t(a + "/v1/wsdk-init/index.html?" + o), $t(
    "https://" + aa + "/v1/wsdk-init/index.html?" + o + "&isControl=true"
  );
}
function wa() {
  return typeof window < "u" && !!window.location?.search?.toLowerCase().includes("mp_enable_logging=true");
}
function Ta() {
  if (typeof window > "u")
    return;
  const t = window.location?.href;
  return t ? Wt(t) : void 0;
}
function Ca() {
  return typeof window < "u" ? window.navigator?.userAgent : void 0;
}
class dr {
  constructor() {
    this._logCount = {};
  }
  incrementAndCheck(e) {
    const n = (this._logCount[e] || 0) + 1;
    return this._logCount[e] = n, n > Aa;
  }
}
class Re {
  constructor(e, i, n, r, s) {
    this._reporter = "mp-wsdk";
    const o = e.isLoggingEnabled;
    this._integrationName = i || "", this._launcherInstanceGuid = n, this._accountId = r || null, this._rateLimiter = s || new dr(), this._isEnabled = wa() || o;
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
          code: r || fi.UNKNOWN_ERROR,
          url: Ta(),
          deviceInfo: Ca(),
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
class en {
  constructor(e, i, n, r, s) {
    this._transport = new Re(e, i, n, r, s), this._errorUrl = lr(e?.errorUrl, e?.integrationDomain, va);
  }
  report(e) {
    if (!e) return;
    const i = e.severity || Le.ERROR;
    this._transport.send(this._errorUrl, i, e.message, e.code, e.stackTrace);
  }
}
class tn {
  constructor(e, i, n, r, s, o) {
    this._intentObserveLines = 0, this._transport = new Re(e, n, r, s, o), this._placementDiagnosticTransport = new Re(
      e,
      n,
      r,
      s
    ), this._preselectOutcomeTransport = new Re(e, n, r, s), this._loggingUrl = lr(e?.loggingUrl, e?.integrationDomain, Ia), this._errorReportingService = i;
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
      Le.INFO,
      i.message,
      i.code,
      void 0,
      (n) => {
        if (this._errorReportingService) {
          const r = typeof n.statusCode == "number";
          this._errorReportingService.report({
            message: "LoggingService: Failed to send log: " + n.message,
            code: fi.LOG_DELIVERY_FAILURE,
            severity: r ? Le.ERROR : Le.WARNING
          });
        }
      }
    );
  }
}
function Sa(t, e) {
  const i = Ye(window.location.href), n = t.EventAttributes?.title, r = g(n) ? n : void 0, s = ln(t.EventAttributes, e) ? r : r || document.title, o = br(), a = t.ActiveTimeOnSite;
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
    this.name = $, this.id = We, this.moduleId = We, this.isInitialized = !1, this.launcher = null, this.filters = {}, this.userAttributes = {}, this.userIdentifiedInWorkspace = !1, this.testHelpers = null, this.placementEventMappingLookup = {}, this.placementEventAttributeMappingLookup = {}, this.integrationName = null, this.errorReportingService = null, this.loggingService = null, this._thankYouElementOnLoadCallback = null, this._isThankYouElementLoaded = !1, this._workspaceSearchInFlightPromise = null, this._launcherAttachState = Yo(), this._exitIntentConfig = null, this._exitIntentWatcher = new Zo({
      isKitReady: () => this.isKitReady(),
      onExitIntent: (e, i) => this.handleExitIntent(e, i),
      onLeadCaptureSubmitted: (e) => this.applyIdentityCapturePayload(e.identities, e.userAttributes)
    }), this._exitIntentEnabledForAccount = !1, this._pendingInitWarnings = [], this.accountId = null, this._preselectState = Eo(), this._identityCallCount = 0, this._lastNonModifyCallCount = 0, this._isModifyIdentityCallInProgress = !1;
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
      if (D(s))
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
      n = Wt(window.location.href);
      const r = Ai(), s = Sa(e, i);
      r.push(s);
      const o = Math.min(r.length, an), a = Ir(r);
      if (a === 0) {
        const c = Pt() ? "quota" : "ls_unavailable";
        this.loggingService?.log({
          message: `Rokt Kit: Failed to persist page view for ${n} [reason: ${c}]`,
          code: "PAGE_VIEW_CAPTURE_FAILED"
        });
      } else a < o && this.loggingService?.log({
        message: `Rokt Kit: Page view storage reduced from ${o} to ${a} record(s) under quota pressure [reason: quota_eviction]`,
        code: "PAGE_VIEW_QUOTA_EVICTION"
      });
    } catch (r) {
      const s = Pt() ? "exception" : "ls_unavailable", o = r instanceof Error ? r.message : String(r);
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
      return Fn(this.accountId, e, i);
  }
  // The entry a speculative call was fired for, by the targetPageIdentifier its fire keys its records under.
  findFiredEntry(e) {
    if (this.isPreselectionEnabled())
      return qe(this.accountId, e);
  }
  // What the speculative call for the entry keyed entryKey fills in over these attributes, the ones it was fired with.
  // An identity the call carries already holds its key, so a default never stands in for it.
  buildPreselectAttributeDefaults(e, i) {
    const n = this.findFiredEntry(e);
    if (!n)
      return;
    const r = lt(this.buildPreselectHost(), n, i), s = this.filters || {};
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
      getCurrentUser: () => p().Identity?.getCurrentUser?.(),
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
    Vo(this._preselectState, this.buildPreselectHost());
  }
  isLauncherReadyToAttach() {
    return !!window.Rokt && z(window.Rokt.createLauncher);
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
    return n && e[n] && (i[q.EMAIL_SHA256_KEY] = e[n]), n && delete i[n], i;
  }
  logSelectPlacementsEvent(e) {
    if (!window.mParticle || typeof p().logEvent != "function" || !v(e))
      return;
    const i = p().EventType.Other, n = {}, r = Object.keys(e);
    for (let s = 0; s < r.length; s++)
      ia.indexOf(r[s].toLowerCase()) === -1 && (n[r[s]] = e[r[s]]);
    p().logEvent(ta, i, n);
  }
  setRoktSessionId(e) {
    if (!(!e || typeof e != "string"))
      try {
        const i = p().getInstance();
        i && z(i.setIntegrationAttribute) && i.setIntegrationAttribute(We, {
          roktSessionId: e
        });
      } catch {
      }
  }
  readMpSessionId() {
    const e = p()?.sessionManager, i = e?.getSessionId ?? e?.getSession;
    if (z(i))
      return i.call(e) || void 0;
  }
  readMpDeviceId() {
    if (!this.isDeviceIdDisabled())
      return p()?.getDeviceId?.() || void 0;
  }
  attachLauncher(e, i, n = []) {
    Bo(this._launcherAttachState, {
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
      await Pa([...n], o), this.initRoktLauncher(o);
    }).catch((o) => {
      const a = this._launcherAttachState.lifecycle === "attached";
      if (qo(this._launcherAttachState), !a) {
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
    return Qo(
      this._launcherAttachState,
      this.isLauncherReadyToAttach(),
      (e) => this.attachLauncher(e.accountId, e.launcherOptions, e.legacyRoktExtensions)
    );
  }
  initRoktLauncher(e) {
    window.Rokt && (window.Rokt.currentLauncher = e), this.launcher = e, zo(this._launcherAttachState);
    const i = p().Rokt?.filters;
    i ? (!this.isInitialized && this.filters.filteredUser && (i.filteredUser = this.filters.filteredUser), this.filters = i, i.filteredUser ? this._workspaceSearchInFlightPromise = this.search(i.filteredUser) : console.warn("Rokt Kit: No filtered user has been set.")) : console.warn("Rokt Kit: No filters have been set."), this.isInitialized = !0, Zi(this.domain, this.integrationName), p().Rokt.attachKit(this), this.pushExitIntentExtensionConfig(), this.flushPendingPreselectDispatches();
  }
  // Leaving the hook unset is what keeps History unpatched for workspaces that never
  // preselect. The core SDK reads onCheckoutIntent when it has a signal, so an account without
  // pre-selection entries never hears one.
  armPreselectPathnameTrigger() {
    It(window.location.pathname), this.onRouteChange = ke(this.accountId) ? () => this.evaluatePreselectPathname() : void 0, this.armPreselectEmailInputListener(), this.onCheckoutIntent = ke(this.accountId) ? (e) => {
      try {
        js(this._preselectState, this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0, this.checkoutIntentSelectors = uo(this.accountId), this.onPaymentPick = ke(this.accountId) ? (e) => {
      try {
        Ys(this._preselectState, this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0;
  }
  // A guest often types their email after the trigger page view has queued for want of one, so a
  // committed email input retries the queue. Only accounts with an entry that reads the form listen.
  armPreselectEmailInputListener() {
    this._preselectEmailInputListener && (document.removeEventListener("input", this._preselectEmailInputListener, !0), document.removeEventListener("change", this._preselectEmailInputListener, !0), document.removeEventListener("blur", this._preselectEmailInputListener, !0), this._preselectEmailInputListener = void 0), Lo(this.accountId) && (this._preselectEmailInputListener = (e) => {
      xt(e), e.type === "change" && this._preselectState.pending.length > 0 && ko(this._preselectState, this.buildPreselectHost(), e) && this.flushPendingPreselectDispatches();
    }, document.addEventListener("input", this._preselectEmailInputListener, !0), document.addEventListener("change", this._preselectEmailInputListener, !0), document.addEventListener("blur", this._preselectEmailInputListener, !0));
  }
  // A core released without the check reads false, so its page views are judged by their marker alone.
  isAutoLogPageViewOn() {
    const e = p().Rokt;
    try {
      return z(e?.isAutoLogPageViewEnabled) && e.isAutoLogPageViewEnabled() === !0;
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
      return z(e?.isCheckoutIntentLive) && e.isCheckoutIntentLive() === !0;
    } catch {
      return !1;
    }
  }
  // True when the core SDK gives link clicks no checkout intent because this connection does not receive Auto Link
  // Click events. A core released without the check reads false, and turns intent off entirely in that case.
  isLinkIntentWithheld() {
    const e = p().Rokt;
    try {
      return z(e?.areAutoLinkClicksForwarded) && e.areAutoLinkClicksForwarded() === !1;
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
    if (ri(this.buildPreselectHost(), e)) return "partner_email";
  }
  // Whether this connection filters out the Email identity, or the identity mapped to the hashed email.
  isEmailIdentityFiltered() {
    const e = this.userIdentityFilters || [];
    if (e.includes(ea))
      return !0;
    const i = this._mappedEmailSha256Key, n = p().IdentityType || {}, r = i ? Object.keys(n).find((o) => o.toLowerCase() === i) : void 0, s = r ? n[r] : void 0;
    return typeof s == "number" && e.includes(s);
  }
  evaluatePreselectPathname() {
    const e = window.location.pathname;
    It(e), e !== this._lastPreselectPathname && (this.isTargetingDisabled() || (this._lastPreselectPathname = e, fo(this._preselectState, this.buildPreselectHost(), e), Mi(this._preselectState, this.buildPreselectHost(), e)));
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
    return Qi(e) ? {
      identifier: _a,
      signals: {
        mouseExitTop: !0,
        scrollUpFast: !0,
        idle: !0
      }
    } : null;
  }
  applyExitIntentExtensionOverride(e, i) {
    return e ? i.includes(At) ? i : [...i, At] : i;
  }
  extractExitIntentIdentifier(e) {
    return e ? g(e.identifier) && e.identifier.length > 0 ? e.identifier : g(e.placementIdentifier) && e.placementIdentifier.length > 0 ? e.placementIdentifier : null : null;
  }
  applyIdentityCapturePayload(e, i) {
    const n = {}, r = e.email;
    g(r) && r.length > 0 && (n.email = r);
    const s = e.mobile_number;
    g(s) && s.length > 0 && (n.mobile_number = s);
    const o = p().Identity?.modify;
    if (z(o) && Object.keys(n).length > 0)
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
    !this._exitIntentConfig || !z(window.Rokt?.setExtensionData) || window.Rokt.setExtensionData({
      [At]: this._exitIntentConfig
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
    mr(o), o || this.isTargetingDisabled() ? yr() : (ns(), os()), this.isPageHistoryAllowed() || (_t(), Et());
    const a = e, c = a.accountId;
    this._identityCallCount = 0, this._lastNonModifyCallCount = 0, this._isModifyIdentityCallInProgress = !1, this._exitIntentEnabledForAccount = Qi(c);
    const l = this._exitIntentEnabledForAccount ? this.getEffectiveExitIntentConfig(c) : null;
    this._exitIntentEnabledForAccount ? this.configureExitIntentBridge(l) : this.configureExitIntentBridge(null), this.accountId = c || null;
    const u = this.accountId ? Ls(this.accountId, a.preselectionConfig) : void 0;
    this.userAttributes = ae(s), this.armPreselectPathnameTrigger(), this._onboardingExpProvider = a.onboardingExpProvider;
    const d = Ge(a.placementEventMapping);
    this.placementEventMappingLookup = Xi(d);
    const f = Ge(
      a.placementEventAttributeMapping
    );
    this.placementEventAttributeMappingLookup = qi(f), a.hashedEmailUserIdentityType && (this._mappedEmailSha256Key = a.hashedEmailUserIdentityType.toLowerCase()), this._workspaceIdSyncApiKey = g(a.workspaceIdSyncApiKey) ? a.workspaceIdSyncApiKey : void 0;
    const m = p().Rokt?.domain, { roktExtensionsQueryParams: E, legacyRoktExtensions: y, loadThankYouElement: w } = zi(
      a.roktExtensions
    ), C = this.applyExitIntentExtensionOverride(
      l,
      E
    ), T = {
      ...p().Rokt?.launcherOptions || {}
    };
    this.integrationName = ba(T.integrationName), T.integrationName = this.integrationName, this.domain = m;
    const _ = {
      loggingUrl: a.loggingUrl,
      errorUrl: a.errorUrl,
      integrationDomain: m,
      isLoggingEnabled: p().config?.isLoggingEnabled === !0
    }, b = new en(
      _,
      this.integrationName,
      window.__rokt_li_guid__,
      a.accountId
    ), R = new tn(
      _,
      b,
      this.integrationName,
      window.__rokt_li_guid__,
      a.accountId
    );
    return this.errorReportingService = b, this.loggingService = R, this._flushInitWarnings(), u && R.log({
      message: `Rokt Kit: preselectionConfig setting is invalid [reason=${u}], using the built-in preselection config`,
      code: "PRESELECT_CONFIG_INVALID"
    }), p()._registerErrorReportingService && p()._registerErrorReportingService(b), p()._registerLoggingService && p()._registerLoggingService(R), n ? (this.testHelpers = {
      generateLauncherScript: Gi,
      generateThankYouElementScript: Yi,
      extractRoktExtensionConfig: zi,
      hashEventMessage: Ji,
      parseSettingsString: Ge,
      generateMappedEventLookup: Xi,
      generateMappedEventAttributeLookup: qi,
      sendAdBlockMeasurementSignals: Zi,
      createAutoRemovedIframe: $t,
      djb2: ie,
      setAllowedOriginHashes: (h) => {
        q._allowedOriginHashes = h;
      },
      ReportingTransport: Re,
      ErrorReportingService: en,
      LoggingService: tn,
      RateLimiter: dr,
      ErrorCodes: fi,
      WSDKErrorSeverity: Le,
      resetLauncherAttachState: () => Jo(this._launcherAttachState)
    }, this.attachLauncher(c, T), "Successfully initialized: " + $) : (w && (p().Rokt.flushOnShoppableAdsReadyMessageQueue?.(this), Bi(ua, Yi(m), {
      onLoad: () => {
        this._isThankYouElementLoaded = !0, this._thankYouElementOnLoadCallback && this._thankYouElementOnLoadCallback();
      },
      onError: (h) => {
        console.error("Error loading Rokt Thank You Element script:", h);
      }
    })), this.isLauncherReadyToAttach() ? this.attachLauncher(c, T, y) : (Bi(da, Gi(m, C), {
      onLoad: () => {
        this.isLauncherReadyToAttach() ? this.attachLauncher(c, T, y) : console.error("Rokt object is not available after script load.");
      },
      onError: (h) => {
        console.error("Error loading Rokt launcher script:", h);
      }
    }), this.captureTiming(q.PERFORMANCE_MARKS.RoktScriptAppended)), "Successfully initialized: " + $);
  }
  process(e) {
    if (e.EventDataType === $i && It(window.location.pathname), !this.isTargetingDisabled()) {
      if (e.EventDataType === $i) {
        if (this._exitIntentEnabledForAccount && this._exitIntentWatcher.resetPageViewState(), this.isPageHistoryAllowed()) {
          const i = this.isAutoLogPageViewOn();
          Ar(this.loggingService, e.EventAttributes, i), this.capturePageView(e, i);
        } else
          _t(), Et();
        Pe(this._preselectState, this.buildPreselectHost(), e), Mi(this._preselectState, this.buildPreselectHost());
      }
      ze(e) && Gs(this.buildPreselectHost(), e), go(this.accountId, e.EventName) && yo(this._preselectState, this.buildPreselectHost(), e);
    }
    if (e.EventDataType === ga && (_t(), Et(), ii(this._preselectState), this.accountId && (le(this.accountId), Pi(this.accountId), Ti(this.accountId))), !this.isKitReady())
      return "Kit not ready for forwarder: " + $;
    if (z(p().Rokt?.setLocalSessionAttribute) && !ze(e) && (D(this.placementEventAttributeMappingLookup) || this.applyPlacementEventAttributeMapping(e), !D(this.placementEventMappingLookup))) {
      const i = Ji(e.EventDataType, e.EventCategory, e.EventName ?? "");
      this.placementEventMappingLookup[String(i)] && p().Rokt.setLocalSessionAttribute?.(this.placementEventMappingLookup[String(i)], !0);
    }
    return "Successfully sent to forwarder: " + $;
  }
  setExtensionData(e) {
    if (!this.isKitReady()) {
      console.error("Rokt Kit: Not initialized");
      return;
    }
    window.Rokt.setExtensionData(e);
  }
  setUserAttribute(e, i) {
    Ht(e) || (this.userAttributes[e] = i);
    const n = Ui(this.accountId, e);
    return n && this.forgetCartAdd(), (_o(this.accountId, e) || Fe(e, this._mappedEmailSha256Key) || n) && this.flushPendingPreselectDispatches(), "Successfully set user attribute for forwarder: " + $;
  }
  // The page's cart attribute or a logout replaces a remembered add-to-cart click. Under noTargeting, or for an account
  // that never remembers one, nothing is written to the device.
  forgetCartAdd() {
    this.accountId && hs(this.accountId, !this.isTargetingDisabled() && xo(this.accountId));
  }
  removeUserAttribute(e) {
    return delete this.userAttributes[e], Ui(this.accountId, e) && this.forgetCartAdd(), "Successfully removed user attribute for forwarder: " + $;
  }
  handleIdentityComplete(e, i) {
    return this.userAttributes = ae(e.getAllUserAttributes()), "Successfully called " + i + " for forwarder: " + $;
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
    const n = p().Identity?.search;
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
    return this._isModifyIdentityCallInProgress = !1, this._identityCallCount += 1, this._lastNonModifyCallCount = this._identityCallCount, this.userIdentifiedInWorkspace = !1, this._workspaceSearchInFlightPromise = null, this._workspaceLastSearchedIdentitiesKey = void 0, this.accountId && (le(this.accountId), Pi(this.accountId), Ti(this.accountId), this.forgetCartAdd()), this.handleIdentityComplete(e, "onLogoutComplete");
  }
  onModifyComplete(e, i) {
    return this._identityCallCount += 1, this._isModifyIdentityCallInProgress = !0, p()?.Identity?.getCurrentUser?.()?.isLoggedIn?.() === !0 && (this._lastNonModifyCallCount = this._identityCallCount), this.handleIdentityComplete(e, "onModifyComplete");
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
        new Promise((o) => setTimeout(o, Wi))
      ]) : Promise.resolve();
      return Promise.all([n, s]).then(
        () => this._dispatchPlacements(e, i)
      );
    }
    if (this._workspaceSearchInFlightPromise) {
      const r = this._workspaceSearchInFlightPromise;
      return Promise.race([
        r,
        new Promise((s) => setTimeout(s, Wi))
      ]).then(() => this._dispatchPlacements(e, i));
    }
    return this._dispatchPlacements(e);
  }
  // Whether a pre-selection call's identifier is still the value of its entry's targetPageIdentifierAttribute among the
  // attributes the workspace's attribute filter lets the call send. A call for an entry with a fixed
  // targetPageIdentifier always is. The entry is the one the fire named, else the one its identifier keys.
  isPreselectTargetAllowed(e, i) {
    const n = i.identifier, r = g(e) ? e : g(n) ? n : void 0, s = qe(this.accountId, r);
    if (s?.targetPageIdentifierAttribute === void 0)
      return !0;
    const o = v(i.attributes) ? i.attributes : {};
    return Ae(s, this.filterPreselectAttributes(o)) === n;
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
    const n = { ...ae(this.userAttributes), ...e }, r = this.filterPreselectAttributes(n), s = this.returnUserIdentities(this.filters?.filteredUser || null), o = Fi(
      this.accountId,
      i ? Ut(r, this.buildPreselectAttributeDefaults(i, e)) : r,
      this.findFiredEntry(i)
    );
    return {
      ...s,
      ...o,
      ...this.returnLocalSessionAttributes()
    };
  }
  isStillCurrentUser(e, i) {
    const n = p().Identity?.getCurrentUser?.();
    return e !== "" && String(this.filters?.filteredUser?.getMPID?.() ?? "") === e && String(n?.getMPID?.() ?? "") === e && (!i || n?.isLoggedIn?.() === !0);
  }
  currentUserSnapshot() {
    const e = p()?.Identity?.getCurrentUser?.();
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
    const i = p().Identity?.getCurrentUser?.(), n = this._identityCallCount > e.identityCallCount && this._lastNonModifyCallCount <= e.identityCallCount;
    return String(i?.getMPID?.() ?? "") !== e.mpid || e.loggedIn && !n && i?.isLoggedIn?.() !== !0;
  }
  // A call whose user changed while it waited goes out for the new user only when nothing it carries belongs to
  // someone else: its user had no identities and it carries no email, as when an anonymous shopper logs in, or the
  // new user holds every email form it carries, as when core identifies with a passed email that differs from the
  // user's. A logout during the wait drops the call even when the email or MPID survives the logout.
  mayGoOutForNewUser(e, i) {
    const n = p().Identity?.getCurrentUser?.();
    if (e.loggedIn && n?.isLoggedIn?.() !== !0)
      return !1;
    const r = n?.getUserIdentities?.()?.userIdentities || {}, s = this._mappedEmailSha256Key, o = i[q.EMAIL_SHA256_KEY] || (s ? i[s] : void 0), a = [];
    return i.email && a.push([i.email, r.email]), o && a.push([o, s ? r[s] : void 0]), a.length === 0 ? !e.hasIdentities : a.every(([c, l]) => g(c) && c === l);
  }
  _dispatchPlacements(e, i) {
    const n = e ? Ro(e) : void 0;
    if (e?.preselect === !0 && !di(this.buildPreselectHost())) {
      n?.();
      return;
    }
    const r = e?.[Xe], s = e?.[Ot], o = e?.[Nt], a = { ...e };
    if (delete a[Xe], delete a[Ot], delete a[Nt], e = a, e.preselect === !0 && !this.isPreselectTargetAllowed(o, e)) {
      this.loggingService?.logPlacementDiagnostic(
        S("missed", "no_target_page_identifier", { cause: "filtered" })
      ), n?.();
      return;
    }
    if (s !== void 0) {
      const Z = v(s) ? s : {}, je = Z.requireLogin !== !1;
      if (!this.isStillCurrentUser(String(Z.mpid ?? ""), je)) {
        this.loggingService?.logPlacementDiagnostic(
          S("missed", je ? "logged_in_dropped" : "user_changed_dropped")
        ), n?.();
        return;
      }
    }
    const c = i !== void 0 && this.hasUserChangedSince(i), l = c && i?.hasIdentities === !0;
    if (i && c && !this.mayGoOutForNewUser(i, v(e.attributes) ? e.attributes : {})) {
      e.preselect === !0 ? this.loggingService?.logPlacementDiagnostic(
        S("missed", i.loggedIn ? "logged_in_dropped" : "user_changed_dropped")
      ) : this.loggingService?.log({
        message: "Rokt Kit: Dropped a selectPlacements call whose user changed while it waited",
        code: "SELECT_PLACEMENTS_USER_CHANGED"
      }), n?.();
      return;
    }
    const u = v(r) ? r : void 0, d = u && g(u.key) ? u.key : void 0;
    if (d) {
      const Z = this.getFormEmailDropCause(d, u.mpid);
      if (Z) {
        this.loggingService?.logPlacementDiagnostic(
          S("missed", "form_email_dropped", { cause: Z })
        ), n?.();
        return;
      }
    }
    const f = e.attributes || {}, m = ae(this.userAttributes), E = { ...m, ...f }, y = this.filters || {}, w = y.userAttributeFilters || [], C = y.filteredUser || null, T = C ? C.getMPID() : null;
    let _;
    y ? y.filterUserAttributes ? _ = y.filterUserAttributes(E, w) : _ = E : (console.warn("Rokt Kit: No filters available, using user attributes"), _ = E);
    const b = ae(_);
    d && (Object.prototype.hasOwnProperty.call(m, d) ? b[d] = m[d] : delete b[d]), this.userAttributes = b;
    const R = this._onboardingExpProvider === "Optimizely" ? this.fetchOptimizely() : {}, h = this.returnUserIdentities(C), I = this.returnLocalSessionAttributes(), P = this.isPageHistoryAllowed(), V = P ? vr(Ai()) : [], G = P ? Pr() : null, fe = this.readMpSessionId(), J = this.readMpDeviceId(), K = typeof e.identifier == "string" ? e.identifier : void 0, Q = g(o) ? o : K, Y = e.preselect !== !0 && this.isPreselectionEnabled() && Zs(this.accountId) ? this.filterPreselectAttributes(Qs(m, f)) : {}, ge = e.preselect === !0 ? this.findFiredEntry(Q) : this.findCacheConfigEntry(K, Y), Ve = e.preselect === !0 ? this.buildPreselectAttributeDefaults(Q, f) : void 0, gi = e.preselect === !0 ? Fi(
      this.accountId,
      Ut(_, Ve),
      ge
    ) : _, B = {
      ...h,
      ...gi,
      ...R,
      ...I,
      ...V.length ? { [pa]: JSON.stringify(V) } : {},
      ...G ? { [ma]: G } : {},
      ...!l && this.userIdentifiedInWorkspace ? { [fa]: !0 } : {},
      ...fe ? { [ha]: fe } : {},
      ...J ? { [Hi]: J } : {},
      mpid: T
    };
    this.isDeviceIdDisabled() && delete B[Hi], e.preselect !== !0 && jo(this.buildPreselectHost(), K, B, Y);
    const mt = gi[Un];
    if (e.preselect === !0 && g(mt) && (mt.indexOf("intent_") === 0 || mt.indexOf("pageview_cart|") === 0) && !He(B, this._mappedEmailSha256Key)) {
      this.loggingService?.logPlacementDiagnostic(
        S("missed", "no_strict_email", { cause: "lost_before_dispatch" })
      ), n?.();
      return;
    }
    const pi = ao(
      ge,
      Ve,
      B
    ), mi = co(ge, Ve, B), hi = lo(ge, B);
    delete B[Ci];
    const yi = Yn(Ve, B);
    yi && (B[Ci] = yi);
    const ur = {
      ...e,
      attributes: B,
      ...ge ? { cacheMatchKeys: Bn(ge) } : {},
      ...pi ? { cacheIdentityKeys: pi } : {},
      ...mi ? { cacheMatchValues: mi } : {},
      ...hi ? { cacheMatchTokens: hi } : {}
    }, ht = this.currentUserSnapshot(), yt = i?.loggedIn && !c && !ht.loggedIn ? { ...ht, loggedIn: !0, identityCallCount: i.identityCallCount } : ht, _i = this.launcher.selectPlacements(ur), Ei = e.preselect === !0, fr = () => {
      if (!Ei) {
        if (this.hasUserChangedSince(yt) && (yt.loggedIn || yt.hasIdentities)) {
          this.loggingService?.log({
            message: "Rokt Kit: Skipped the selectPlacements event because its user changed before the selection resolved",
            code: "SELECT_PLACEMENTS_EVENT_USER_CHANGED"
          });
          return;
        }
        this.logSelectPlacementsEvent(B);
      }
    };
    return Promise.resolve(_i).then((Z) => {
      if (!Ei)
        return this.trackPlacementEngagement(Z), Z?.context?.sessionId?.then((je) => this.setRoktSessionId(je));
    }).catch(() => {
    }).finally(fr), _i;
  }
  // Logs each press of a placement's response buttons, and each close, as an auto button click. The
  // placement's frame keeps its buttons and text from the page, so only the response kind goes out.
  trackPlacementEngagement(e) {
    if (!e || !z(e.on))
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
        oa
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
        typeof a == "string" && a.length <= 253 && sa.test(a.toLowerCase()) ? a.toLowerCase() : void 0
      );
    });
  }
  // Checked when each click is logged, since the launcher calls back outside core's own gates.
  canLogPlacementClick() {
    return this.isCheckoutIntentActive() && this.isForwardingAllowed() && z(p().logEvent);
  }
  logPlacementEngagement(e, i) {
    this.canLogPlacementClick() && p().logEvent(na, p().EventType.Other, {
      is_auto_button_click: !0,
      is_rokt_placement_click: !0,
      element: "button",
      type: "button",
      label_source: ji,
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
      label_source: ji,
      hostname: window.location.hostname,
      link_type: "external",
      rokt_placement_id: e
    };
    i && (n.link_domain = i), p().logEvent(ra, p().EventType.Other, n);
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
    return this.isKitReady() ? (Xo(this._launcherAttachState), this.launcher.terminate()) : (console.error("Rokt Kit: Not initialized"), Promise.resolve());
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
let be = q;
function ka() {
  return We;
}
function La(t) {
  if (!t) {
    window.console.log("You must pass a config object to register the kit " + $);
    return;
  }
  if (!v(t)) {
    window.console.log("'config' must be an object. You passed in a " + typeof t);
    return;
  }
  v(t.kits) ? t.kits[$] = {
    constructor: be
  } : (t.kits = {}, t.kits[$] = {
    constructor: be
  }), window.console.log("Successfully registered " + $ + " to your mParticle configuration");
}
typeof window < "u" && window.mParticle && p().addForwarder && p().addForwarder({
  name: $,
  constructor: be,
  getId: ka
});
export {
  La as register
};
//# sourceMappingURL=Rokt-Kit.esm.js.map
