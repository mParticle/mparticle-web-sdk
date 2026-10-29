const On = [
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
], Kn = new Set(On);
function Ri(t) {
  return Kn.has(t.toLowerCase());
}
function te(t) {
  const e = {}, i = t || {}, n = Object.keys(i);
  for (let r = 0; r < n.length; r++) {
    const s = n[r];
    Ri(s) || (e[s] = i[s]);
  }
  return e;
}
function b(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function p(t) {
  return typeof t == "string";
}
function G(t) {
  return typeof t == "function";
}
function Oi(t) {
  try {
    return JSON.parse(t.replace(/&quot;/g, '"'));
  } catch {
    return;
  }
}
function L(t) {
  return t == null ? !0 : typeof t == "string" ? t.length === 0 : typeof t == "object" ? Object.keys(t).length === 0 : !1;
}
function T(t, e) {
  return Object.prototype.hasOwnProperty.call(t, e) ? t[e] : void 0;
}
function Fe(t) {
  const e = Ki(), i = e ? e(t, "full") : t, n = i.indexOf("#"), r = n === -1 ? "" : i.slice(n);
  return (n === -1 ? i : i.slice(0, n)).split("?")[0] + r.split("?")[0];
}
function bt(t) {
  const e = Ki();
  return e ? e(t, "report") : t.split(/[?#]/)[0];
}
function Ki() {
  const t = window.mParticle;
  return t && typeof t._cleanUrl == "function" ? t._cleanUrl : void 0;
}
function X(t) {
  let e = 5381;
  for (let i = 0; i < t.length; i++)
    e = (e << 5) + e + t.charCodeAt(i), e = e & e;
  return e;
}
const I = "mp-rokt-kit", Qt = "__rokt_ls_probe__";
function Zt() {
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
let oe = null;
function Un(t) {
  t ? oe || (oe = { local: Zt(), session: Zt() }) : oe = null;
}
function Nn() {
  return oe !== null;
}
const J = () => oe?.local ?? window.localStorage, R = () => oe?.session ?? window.sessionStorage;
function ot() {
  try {
    const t = J();
    return t.setItem(Qt, "1"), t.removeItem(Qt), !0;
  } catch {
    return !1;
  }
}
function We(t, e = J) {
  try {
    const i = e().getItem(t);
    return i === null ? null : JSON.parse(i);
  } catch {
    return null;
  }
}
function Ui(t, e, i = J) {
  try {
    return i().setItem(t, JSON.stringify(e)), !0;
  } catch {
    return !1;
  }
}
function at(t, e = J) {
  try {
    e().removeItem(t);
  } catch {
  }
}
function Fn() {
  at(I, () => window.localStorage), at(I, () => window.sessionStorage);
}
function x(t, e, i = J) {
  const n = We(t, i);
  return b(n) ? n[e] : void 0;
}
function $(t, e, i, n = J) {
  const r = We(t, n), s = b(r) ? { ...r } : {};
  return s[e] = i, Ui(t, s, n);
}
function Ni(t, e, i) {
  Object.keys(e).length === 0 ? at(t, i) : Ui(t, e, i);
}
function Q(t, e, i = J) {
  const n = We(t, i);
  if (!b(n) || !(e in n))
    return;
  const r = { ...n };
  delete r[e], Ni(t, r, i);
}
function ae(t, e, i = J) {
  const n = We(t, i);
  if (!b(n))
    return;
  const r = Object.keys(n).filter((o) => o.startsWith(e));
  if (r.length === 0)
    return;
  const s = { ...n };
  r.forEach((o) => delete s[o]), Ni(t, s, i);
}
const Pt = "pageViews", Me = "utmParams", Fi = 25, Mn = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
function Mi(t) {
  return t.slice(-Fi);
}
function ei() {
  const t = x(I, Pt);
  return Array.isArray(t) ? t.filter(b).map(xn) : [];
}
function xn(t) {
  return {
    ...t,
    ...p(t.pageUrl) ? { pageUrl: Fe(t.pageUrl) } : {},
    ...p(t.canonicalUrl) ? { canonicalUrl: Fe(t.canonicalUrl) } : {}
  };
}
function Vn(t) {
  const e = Mi(t);
  for (let i = 0; i < e.length; i++) {
    const n = e.slice(i);
    if ($(I, Pt, n))
      return n.length;
  }
  return 0;
}
function tt() {
  Q(I, Pt);
}
function $n(t) {
  const e = Mi(t);
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
function xi(t, e = !1) {
  return e || !!t && t.is_auto_page_view === !0;
}
function jn(t, e, i = !1) {
  if (x(I, Me) !== void 0)
    return;
  const n = xi(e, i), r = new URLSearchParams(window.location.search), s = {};
  for (const a of Mn) {
    const c = n ? (e || {})[a] : r.get(a);
    p(c) && c && (s[a] = c);
  }
  if (Object.keys(s).length === 0)
    return;
  const o = Object.keys(s).join(", ");
  if (!$(I, Me, s)) {
    const a = ot() ? "quota" : "ls_unavailable";
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
function Hn() {
  const t = x(I, Me);
  return b(t) ? t : null;
}
function it() {
  Q(I, Me);
}
function Wn() {
  const e = document.querySelector('link[rel="canonical"]')?.href;
  if (e)
    return Fe(e);
}
const Vi = "skip", Yn = [
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
], Bn = 1, Gn = 6e4;
function U(t) {
  return Array.isArray(t) && t.every(p);
}
function Ee(t) {
  return p(t) && t !== "";
}
const zn = ["DesktopWeb", "MobileWeb"];
function Xn(t) {
  if (Ee(t))
    return !0;
  if (!b(t))
    return !1;
  const { byClientType: e, byHostname: i, skipRemembered: n, skipValues: r } = t;
  if (t.value !== void 0 && !Ee(t.value) || e !== void 0 && (!b(e) || !Object.entries(e).every(
    ([s, o]) => zn.includes(s) && Ee(o)
  )) || i !== void 0 && (!b(i) || !Object.entries(i).every(
    ([s, o]) => s !== "" && s === s.toLowerCase() && Ee(o)
  )) || n !== void 0 && typeof n != "boolean" || r !== void 0 && (!U(r) || r.length === 0 || !r.every(Ee)))
    return !1;
  if (U(r)) {
    const s = r.map((a) => a.toLowerCase());
    if ([
      t.value,
      ...Object.values(e ?? {}).filter((a) => a !== Vi),
      ...Object.values(i ?? {})
    ].some((a) => p(a) && s.includes(a.toLowerCase())))
      return !1;
  }
  return t.value !== void 0 || e !== void 0 || i !== void 0;
}
function qn(t, e) {
  if (!b(e))
    return "not an object";
  const { pathname: i, targetPageIdentifier: n, attributeKeys: r, optionalAttributeKeys: s, identityKeys: o, dispatchDelayMs: a } = e, { triggerEventNames: c, releaseHoldOnRouteChange: l, readEmailInput: u, cartIntent: d, cartUserAttribute: f } = e, { checkoutStepIntent: g } = e, v = e.preselectAttributeOverrides, y = e.preselectAttributeDefaults !== void 0 ? e.preselectAttributeDefaults : v, E = e.widenedOptionalAttributeKeys;
  if (e.accountId !== void 0 && e.accountId !== t)
    return "accountId";
  if (!p(i) || !i.startsWith("/"))
    return "pathname";
  if (!p(n) || n === "")
    return "targetPageIdentifier";
  if (!U(r) || r.length === 0)
    return "attributeKeys";
  if (s !== void 0 && (!U(s) || !s.every((A) => r.includes(A))))
    return "optionalAttributeKeys";
  if (E !== void 0 && (!U(E) || !E.every((A) => r.includes(A))))
    return "widenedOptionalAttributeKeys";
  if (o !== void 0 && (!U(o) || o.length === 0 || !o.every((A) => r.includes(A))))
    return "identityKeys";
  if (U(E) && E.length > 0) {
    const A = (U(s) ? s : []).concat(E).map((P) => P.toLowerCase());
    if (!U(o) || o.some((P) => A.includes(P.toLowerCase())))
      return "identityKeys";
  }
  if (a !== void 0 && (!Number.isInteger(a) || a < 0 || a > Gn))
    return "dispatchDelayMs";
  if (l !== void 0 && typeof l != "boolean")
    return "releaseHoldOnRouteChange";
  if (g !== void 0 && typeof g != "boolean")
    return "checkoutStepIntent";
  if (d !== void 0 && typeof d != "boolean")
    return "cartIntent";
  if (u !== void 0 && (typeof u != "boolean" || !r.includes("email") || U(s) && s.includes("email") || // The runtime matches optional keys in any casing, so an 'Email' key would make email optional too.
  U(E) && E.some((A) => A.toLowerCase() === "email") || // A default makes its key optional too, and would send a guessed email as the shopper's.
  b(y) && Object.keys(y).some((A) => A.toLowerCase() === "email")))
    return "readEmailInput";
  if (e.preselectAttributeDefaults !== void 0 && v !== void 0)
    return "preselectAttributeDefaults";
  let m;
  if (y !== void 0) {
    const A = e.preselectAttributeDefaults !== void 0 ? "preselectAttributeDefaults" : "preselectAttributeOverrides";
    if (!b(y))
      return A;
    const P = (U(o) ? o : []).map((D) => D.toLowerCase()), K = ([D, H]) => Xn(H) && r.includes(D) && !["email", "emailsha256"].includes(D.toLowerCase()) && !P.includes(D.toLowerCase()), k = ([D, H]) => v !== void 0 && p(H) && r.includes(D) && !(U(o) && o.includes(D)), j = Object.entries(y);
    if (!j.every((D) => K(D) || k(D)))
      return A;
    m = Object.fromEntries(j.filter(K));
  }
  if (c !== void 0 && (!U(c) || c.length === 0 || c.some((A) => A === "")))
    return "triggerEventNames";
  const h = { accountId: t, pathname: i, targetPageIdentifier: n, attributeKeys: r };
  return s !== void 0 && (h.optionalAttributeKeys = s), E !== void 0 && (h.widenedOptionalAttributeKeys = E), o !== void 0 && (h.identityKeys = o), a !== void 0 && (h.dispatchDelayMs = a), l !== void 0 && (h.releaseHoldOnRouteChange = l), g !== void 0 && (h.checkoutStepIntent = g), u !== void 0 && (h.readEmailInput = u), m !== void 0 && (h.preselectAttributeDefaults = m), c !== void 0 && (h.triggerEventNames = c), d !== void 0 && (h.cartIntent = d), d === !0 && p(f) && f !== "" && (h.cartUserAttribute = f), h;
}
function Jn(t, e) {
  const i = Oi(e);
  if (i === void 0)
    return { error: "invalid JSON" };
  if (!b(i))
    return { error: "not an object" };
  if (i.schemaVersion !== Bn)
    return { error: "schemaVersion" };
  if (!Array.isArray(i.entries))
    return { error: "entries" };
  const n = [];
  for (let r = 0; r < i.entries.length; r++) {
    const s = qn(t, i.entries[r]);
    if (p(s))
      return { error: `entry ${r + 1} ${s}` };
    if (n.some((o) => o.targetPageIdentifier === s.targetPageIdentifier))
      return { error: `entry ${r + 1} targetPageIdentifier` };
    n.push(s);
  }
  return { entries: n };
}
const Qn = 6e4, wt = "activePreselect:";
function Zn(t) {
  return b(t) && typeof t.expiresAt == "number" && typeof t.attributesDigest == "number";
}
function St(t, e) {
  return `${wt}${t}:${e}`;
}
function ce(t) {
  const e = x(I, t, R);
  return Zn(e) && e.expiresAt > Date.now() ? e : null;
}
function er(t, e, i = !1) {
  $(
    I,
    t,
    { expiresAt: Date.now() + Qn, attributesDigest: e, ...i ? { byEvent: !0 } : {} },
    R
  );
}
function tr(t, e, i) {
  const n = ce(t);
  n && n.attributesDigest !== i || (e && e.expiresAt > Date.now() ? $(I, t, e, R) : Q(I, t, R));
}
function ti(t) {
  ae(
    I,
    `${wt}${t}:`,
    R
  );
}
function ir() {
  ae(I, wt);
}
const nr = 5 * 6e4, $i = "pendingPreselect:";
function rr(t) {
  return b(t) && typeof t.expiresAt == "number" && p(t.pathname) && p(t.identifier) && b(t.attributes) && p(t.mpid);
}
function Tt(t) {
  return `${$i}${t}`;
}
function Lt(t) {
  const e = Tt(t), i = x(I, e, R);
  return rr(i) ? i.expiresAt <= Date.now() ? (Q(I, e, R), null) : i : null;
}
function ii(t, e, i, n, r, s = !1) {
  return $(
    I,
    Tt(t),
    {
      expiresAt: Date.now() + nr,
      pathname: e,
      identifier: i,
      attributes: n,
      mpid: r,
      ...s ? { byEvent: !0 } : {}
    },
    R
  );
}
function ie(t) {
  Q(I, Tt(t), R);
}
function sr() {
  ae(I, $i);
}
const ct = {
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
}, or = /\b(?:gift cards?|store credit|rewards?|points?|balance|vouchers?|promo codes?|coupons?)\b/g, ar = 12;
function cr(t) {
  return t.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/[^a-z]+/g, " ").trim();
}
function kt(t) {
  if (typeof t != "string" || t.length > 128)
    return;
  const e = cr(t).replace(or, " ").replace(/\s+/g, " ").trim();
  if (!e || e.split(" ").length > ar)
    return;
  const i = Object.keys(ct).filter((r) => ct[r].test(e)), n = i.filter((r) => r !== "card");
  return n.length === 1 ? n[0] : n.length === 0 && i.length === 1 ? i[0] : void 0;
}
function ji(t) {
  return typeof t == "string" && Object.prototype.hasOwnProperty.call(ct, t);
}
const lr = "radio", ur = ["button", "role", "wallet"], dr = ["label", "aria_label", "test_id", "element_id", "element_name"];
function fr(t) {
  if (!t)
    return;
  const e = String(t.checked), i = t.type === lr;
  if (!(e === "false" || i && e !== "true" || t.type === "checkbox" || t.element === "link") && !(!i && t.type === void 0 && !ur.includes(String(t.element))))
    for (const n of dr) {
      const r = kt(t[n]);
      if (r && (i || r !== "card"))
        return r;
    }
}
function gr(t) {
  if (ji(t.family))
    return t.family;
  for (const e of Array.isArray(t.names) ? t.names : []) {
    const i = kt(e);
    if (i)
      return i;
  }
}
const pr = ["paymenttype", "payment_type", "paymentmethod", "payment_method"];
function mr(t) {
  const e = t ? Object.keys(t).find((n) => pr.includes(n.toLowerCase())) : void 0, i = e ? t[e] : void 0;
  return typeof i != "string" || !i.trim() ? "absent" : kt(i) ?? "other";
}
const Hi = "preselectArrival:", Wi = "preselectTriggerAnyTab:", Ye = "preselectCartAdd:", Yi = "preselectTargetPath:", Bi = "preselectCartArrival:", hr = 30 * 6e4, de = 30 * 6e4, _r = 10080 * 6e4, yr = 10080 * 6e4, lt = ["commit", "wallet", "frame", "checkout_step", "cart"], Er = [
  "triggeredAt",
  "identitySeenAt",
  "firedAt",
  "firedDigest",
  "arrivedAt",
  "nearMissAt",
  "paymentPickAt"
], Ir = ["paymentPick", "paymentAtFire"];
function W(t, e) {
  return `${Hi}${t}:${e}`;
}
function Gi(t, e) {
  return `${Wi}${t}:${e}`;
}
function Te(t) {
  const e = x(I, t, R), i = {};
  if (!b(e))
    return i;
  for (const n of Er)
    typeof e[n] == "number" && (i[n] = e[n]);
  typeof e.intentAt == "number" && lt.includes(e.intentKind) && (i.intentAt = e.intentAt, i.intentKind = e.intentKind);
  for (const n of Ir)
    ji(e[n]) && (i[n] = e[n]);
  return i.firedAt !== void 0 && e.firedByCart === !0 && (i.firedByCart = !0), i;
}
function ne(t, e) {
  return $(I, t, e, R);
}
function me(t) {
  const e = Te(t);
  return e.arrivedAt === void 0 ? e : {};
}
function Ar(t, e, i) {
  const n = W(t, e), r = me(n), s = Date.now();
  ne(n, {
    ...r,
    triggeredAt: r.triggeredAt ?? s,
    ...i ? { identitySeenAt: r.identitySeenAt ?? s } : {}
  }), $(I, Gi(t, e), {
    triggeredAt: s
  });
}
function vr(t, e) {
  const i = x(I, Gi(t, e));
  if (!b(i) || typeof i.triggeredAt != "number")
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < hr;
}
function br(t, e, i) {
  const n = `${Ye}${t}`, r = x(I, n), s = b(r) ? r.addedAt ?? r.forgottenAt : void 0;
  typeof s == "number" && e <= s || $(I, n, { addedAt: e, mpid: i });
}
function Pr(t, e) {
  const i = `${Ye}${t}`, n = x(I, i);
  if (!b(n))
    return !1;
  const r = typeof n.addedAt == "number" ? n.addedAt : void 0, s = r ?? n.forgottenAt;
  if (typeof s != "number")
    return !1;
  const o = Date.now() - s;
  return o >= 0 && o < _r ? r !== void 0 && e !== null && n.mpid === e : (Q(I, i), !1);
}
function wr(t, e) {
  const i = `${Ye}${t}`;
  e ? $(I, i, { forgottenAt: Date.now() }) : Q(I, i);
}
function Sr(t, e) {
  const i = W(t, e), n = Te(i);
  n.arrivedAt !== void 0 || n.nearMissAt !== void 0 || ne(i, { ...n, nearMissAt: Date.now() });
}
function Tr(t, e, i, n = !1) {
  const r = W(t, e), s = me(r), o = s.firedAt !== void 0 && xe(s.firedAt) ? {
    firedAt: s.firedAt,
    ...s.firedDigest !== void 0 ? { firedDigest: s.firedDigest } : {},
    ...s.firedByCart ? { firedByCart: !0 } : {},
    ...s.paymentAtFire !== void 0 ? { paymentAtFire: s.paymentAtFire } : {}
  } : void 0, a = s.paymentPick !== void 0 && s.paymentPickAt !== void 0 && xe(s.paymentPickAt) ? s.paymentPick : void 0;
  return ne(
    r,
    zi(s, {
      firedAt: o && !(o.firedByCart && !n) ? o.firedAt : Date.now(),
      firedDigest: i,
      ...n ? { firedByCart: !0 } : {},
      paymentAtFire: a
    })
  ), o;
}
function Lr(t, e, i, n) {
  const r = W(t, e), s = me(r);
  s.firedAt === void 0 || s.firedDigest !== n || ne(r, zi(s, i));
}
function zi(t, e) {
  const i = { ...t };
  return delete i.firedAt, delete i.firedDigest, delete i.firedByCart, delete i.paymentAtFire, e ? {
    ...i,
    firedAt: e.firedAt,
    ...e.firedDigest !== void 0 ? { firedDigest: e.firedDigest } : {},
    ...e.firedByCart ? { firedByCart: !0 } : {},
    ...e.paymentAtFire !== void 0 ? { paymentAtFire: e.paymentAtFire } : {}
  } : i;
}
function kr(t, e) {
  const i = me(W(t, e));
  if (i.triggeredAt === void 0)
    return !1;
  const n = Date.now() - i.triggeredAt;
  return n >= 0 && n < de;
}
function ni(t, e, i, n = !1) {
  const r = me(W(t, e));
  if (r.firedAt === void 0 || n && r.firedByCart || i !== void 0 && r.firedDigest !== void 0 && r.firedDigest !== i)
    return !1;
  const s = Date.now() - r.firedAt;
  return s >= 0 && s < de;
}
function Cr(t, e, i, n) {
  const r = W(t, e), s = me(r);
  if (s.intentAt !== void 0 && s.intentKind !== void 0 && Dr(s.intentAt)) {
    const o = lt.indexOf(s.intentKind), a = lt.indexOf(i);
    if (o < a || o === a && s.intentAt >= n)
      return;
  }
  ne(r, { ...s, intentAt: n, intentKind: i });
}
function xe(t) {
  const e = Date.now() - t;
  return e >= 0 && e < de;
}
function Dr(t) {
  return xe(t);
}
function Rr(t, e, i, n) {
  const r = W(t, e), s = Te(r);
  s.arrivedAt !== void 0 || s.paymentPickAt !== void 0 && s.paymentPickAt > n || ne(r, { ...s, paymentPick: i, paymentPickAt: n });
}
function Or(t, e) {
  const i = W(t, e), n = Te(i);
  if (n.arrivedAt === void 0 && ne(i, { ...n, arrivedAt: Date.now() }))
    return n;
}
function Xi(t, e) {
  return `${Bi}${t}:${e}`;
}
function Kr(t, e, i, n) {
  const r = Xi(t, e);
  if (i === void 0 || n === null) {
    Q(I, r, R);
    return;
  }
  $(
    I,
    r,
    { arrivedAt: Date.now(), cartDigest: i, mpid: n },
    R
  );
}
function Ur(t, e, i, n) {
  const r = x(
    I,
    Xi(t, e),
    R
  );
  if (!b(r) || typeof r.arrivedAt != "number" || r.cartDigest !== i || n === null || r.mpid !== n)
    return !1;
  const { firedAt: s } = Te(W(t, e)), o = x(I, `${Ye}${t}`), a = b(o) && typeof o.addedAt == "number" && o.mpid === n ? o.addedAt : void 0;
  return xe(r.arrivedAt) && !(s !== void 0 && s >= r.arrivedAt) && !(a !== void 0 && a >= r.arrivedAt);
}
function Nr(t, e, i) {
  $(I, `${Yi}${t}:${e}`, {
    pathDigest: i,
    learnedAt: Date.now()
  });
}
function Fr(t, e, i) {
  const n = x(
    I,
    `${Yi}${t}:${e}`
  );
  if (!b(n) || n.pathDigest !== i || typeof n.learnedAt != "number")
    return !1;
  const r = Date.now() - n.learnedAt;
  return r >= 0 && r < yr;
}
function ri(t) {
  ae(
    I,
    `${Hi}${t}:`,
    R
  ), ae(
    I,
    `${Bi}${t}:`,
    R
  ), ae(I, `${Wi}${t}:`);
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
const ut = /* @__PURE__ */ new Map();
function Mr(t, e) {
  if (ut.delete(t), !e)
    return;
  const i = Jn(t, e);
  if ("error" in i)
    return i.error;
  ut.set(t, i.entries);
}
function V(t) {
  return ut.get(t) ?? Yn.filter((e) => e.accountId === t);
}
function le(t, e) {
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
function xr(t, e) {
  const i = S(t).toLowerCase(), n = S(e).toLowerCase().split("/"), r = i.split("/").length;
  return le(i, n.join("/")) || le(i, ["", ...n.slice(2)].join("/")) || n.length > r && le(i, n.slice(0, r).join("/"));
}
const qi = {}, Ji = {}, Qi = {}, Ct = {}, Zi = {}, Vr = {}, $r = ["commit", "wallet", "checkout_step", "frame", "cart"], jr = ["vendor", "label", "brand", "frame", "submit", "name", "api"], Hr = 512;
function en(t) {
  return t === "commit" ? "intent_commit" : t === "checkout_step" ? "intent_checkout_step" : t === "cart" ? "intent_cart" : "intent_wallet";
}
function tn(t) {
  return t === "intent_commit" ? Ji : t === "intent_checkout_step" ? Ct : t === "intent_cart" ? Zi : Qi;
}
const Wr = 1e3;
function dt(t) {
  const e = Date.now() - t.t;
  return e >= 0 && e < Wr;
}
function Be(t) {
  return V(t).filter((e) => e.cartIntent === !0);
}
function Ge(t) {
  return typeof t.source == "string" && jr.includes(t.source) ? t.source : void 0;
}
function nn(t) {
  return [...new Set(V(t).map((i) => i.targetPageIdentifier))].some((i) => kr(t, i)) ? "left" : "before_entry";
}
function ze(t, e, i, n, r = {}, s = !1) {
  const o = `${n}:${i}:${e.kind}${s ? ":wait" : ""}`;
  if (gt.has(o)) return;
  gt.add(o);
  const a = Ge(e);
  t.logPlacementDiagnostic(
    w("skipped", "intent_observed", {
      intent_kind: e.kind,
      intent_route: i,
      ...a ? { intent_source: a } : {},
      has_email: Re(t, {}),
      has_identity: O(t.filteredUser),
      ...r
    })
  );
}
function Dt(t) {
  const e = C(t.filteredUser), i = t.getCurrentUser?.();
  return e !== null && C(i) === e && i?.isLoggedIn?.() === !0;
}
function ft(t, e, i, n, r, s = !1) {
  const o = e.accountId, a = nn(o), c = Dt(e), l = (A) => ze(e, i, a, r, { logged_in: c, ...A ? { cause: A } : {} }, s), u = i.kind === "cart", d = i.kind === "wallet" && !c && (s || !O(e.filteredUser));
  if (!u && !c && (s || l(), !d))
    return;
  const f = u ? Be(o) : V(o).filter((A) => A.cartIntent !== !0);
  if (f.length === 0) return l("cart_entry_only");
  if (f.length !== 1) return l("multiple_entries");
  if (n !== S(window.location.pathname) && !(u && dt(i)))
    return l("path_changed");
  const g = f[0];
  if (!O(e.filteredUser))
    return d && !s ? Br(t, e, i, n, r) : l("no_valid_identity");
  const v = en(i.kind), y = `${v}_off_entry`, { collected: E, missingKeys: m } = re(e, tn(v), g, !1), h = Je(e, o, g.targetPageIdentifier, E);
  if (jt(o, g.targetPageIdentifier, h, !u))
    return l("active_preselection");
  if (m.length > 0) return l("missing_attribute");
  if (!Re(e, E, g.targetPageIdentifier)) return l("no_strict_email");
  Oe(
    e,
    o,
    g.targetPageIdentifier,
    g.targetPageIdentifier,
    E,
    "intent",
    ke(y, g),
    !1,
    v,
    !1,
    void 0,
    Ge(i),
    { route: a, loggedIn: c, requireLogin: !u && !d }
  );
}
function Yr(t, e, i, n) {
  const r = (a) => ze(t, e, "entry", n, { cause: a });
  if (!O(t.filteredUser)) return r("no_valid_identity");
  const { collected: s, missingKeys: o } = re(t, Ct, i, !1);
  if (o.length > 0) return r("missing_attribute");
  if (!Re(t, s, i.targetPageIdentifier)) return r("no_strict_email");
  Oe(
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
    Ge(e),
    { route: "entry", loggedIn: Dt(t), requireLogin: !1 }
  );
}
const rn = 2e4;
function Br(t, e, i, n, r) {
  sn(t);
  const s = () => {
    t.identityWait = void 0;
    const a = e.getCurrentHost?.() ?? e;
    Rt(a) && on(a, o);
  }, o = {
    signal: i,
    clickPathname: n,
    visitKey: r,
    route: N[N.length - 1],
    timer: setTimeout(s, Math.max(0, i.t + rn - Date.now()))
  };
  t.identityWait = o;
}
function sn(t) {
  t.identityWait && clearTimeout(t.identityWait.timer), t.identityWait = void 0;
}
function on(t, e) {
  const i = nn(t.accountId), n = { logged_in: Dt(t), cause: "identity_wait_expired" };
  ze(t, e.signal, i, e.visitKey, n, !0);
}
function Gr(t, e) {
  const i = t.identityWait;
  if (!i || !O(e.filteredUser) || (sn(t), !Rt(e))) return;
  if (e.logPlacementDiagnostic(
    w("identity_arrived", "pending_identity", {
      intent_kind: i.signal.kind,
      ...Qe(i.signal.t)
    })
  ), N[N.length - 1] !== i.route || i.clickPathname !== S(window.location.pathname) || Date.now() - i.signal.t >= rn) return on(e, i);
  ft(t, e, i.signal, i.clickPathname, i.visitKey, !0);
}
function zr(t) {
  const e = t.pathname;
  return typeof e == "string" && e.charAt(0) === "/" && e.length <= Hr ? S(e) : void 0;
}
const Ie = /* @__PURE__ */ new Set(), gt = /* @__PURE__ */ new Set(), N = [];
function Pe(t) {
  if (t === Ji) return "intent_commit";
  if (t === Qi) return "intent_wallet";
  if (t === Ct) return "intent_checkout_step";
  if (t === Zi) return "intent_cart";
}
function Le(t) {
  return Pe(t) !== void 0;
}
function nt(t, e = Date.now()) {
  t = S(t), N[N.length - 1]?.pathname !== t && (N.push({ pathname: t, since: e }), N.length > 8 && N.shift(), gt.clear());
}
function Xr(t, e, i) {
  if (!i || !$r.includes(i.kind) || typeof i.t != "number" || !Number.isFinite(i.t))
    return;
  const n = `${i.kind}:${i.t}${i.adds === !0 ? ":adds" : ""}`;
  if (Ie.has(n) || (Ie.add(n), Ie.size > 4096 && Ie.delete(Ie.values().next().value), !Rt(e)) || i.kind === "cart" && Be(e.accountId).length === 0) return;
  qr(e.accountId, i);
  const r = C(e.filteredUser);
  i.kind === "cart" && i.adds === !0 && r !== null && he(e.accountId) && br(e.accountId, i.t, r);
  const s = [...N].reverse().find((h) => h.since <= i.t), o = zr(i) ?? s?.pathname;
  if (!o) return;
  const a = s && s.pathname === o ? s.since : 0, c = `${o}:${a}`, l = i.kind === "cart", u = i.kind === "commit" || i.kind === "wallet" || l, d = M(e.accountId, o);
  if (!d || (l ? d.cartIntent !== !0 : d.cartIntent === !0)) {
    u && ft(t, e, i, o, c);
    return;
  }
  const f = window.location.pathname, g = o === S(f);
  if (l && !g && dt(i)) {
    ft(t, e, i, o, c);
    return;
  }
  const v = i.kind === "checkout_step" && d.checkoutStepIntent === !0;
  if (v && !g && dt(i)) {
    Yr(e, i, d, c);
    return;
  }
  if (!(u || v) || !g) {
    ze(e, i, "entry", c);
    return;
  }
  t.intentSource = Ge(i);
  const y = en(i.kind), E = t.scheduledDispatch;
  if (E && S(E.pathname) === S(f)) {
    Ut(t), An(t, e, E, "intent_released", y);
    return;
  }
  const m = t.pending.find(
    (h) => S(h.pathname) === S(f)
  );
  if (m) {
    m.intentSeen = y, m.waitingFor === "intent" && (t.pending = t.pending.filter((h) => h !== m), ge(
      t,
      e,
      m.event,
      f,
      m.triggeringUserId,
      m.triggeredAt,
      y
    ));
    return;
  }
  ge(t, e, tn(y), f, void 0, i.t);
}
function Rt(t) {
  return !t.isTargetingDisabled?.() && t.isForwardingAllowed?.() !== !1 && se(t) && t.isKitReady() && t.isPreselectionEnabled() && Ae(t.accountId);
}
function qr(t, e) {
  const i = e.kind === "cart" ? Be(t) : V(t);
  new Set(i.map((r) => r.targetPageIdentifier)).forEach((r) => Cr(t, r, e.kind, e.t));
}
function fe(t) {
  return t === qi;
}
const Xe = 4, Jr = ["Auto Button Click", "Auto Link Click"], Qr = ["is_auto_button_click", "is_auto_link_click"];
function Ve(t) {
  return t.EventDataType === Xe && Jr.includes(t.EventName ?? "") || Qr.some((e) => String(t.EventAttributes?.[e]) === "true");
}
function an(t) {
  const e = t.accountId;
  if (!(!e || !Ae(e) || t.isTargetingDisabled?.() || t.isForwardingAllowed?.() === !1 || !se(t) || !t.isKitReady() || !t.isPreselectionEnabled()))
    return e;
}
function cn(t, e) {
  if (!e) return;
  const i = new Set(V(t).map((r) => r.targetPageIdentifier)), n = Date.now();
  i.forEach((r) => Rr(t, r, e, n));
}
function Zr(t, e) {
  const i = Ve(e) ? an(t) : void 0;
  i && cn(i, fr(e.EventAttributes));
}
function es(t, e) {
  const i = an(t);
  i && cn(i, gr(e));
}
function ue(t, e) {
  return e.EventDataType === Xe && p(e.EventName) && !Ve(e) && (t.triggerEventNames ?? []).includes(e.EventName);
}
const ln = "rokt.preselecttrigger", si = "rokt.preselectdefaulted", ts = /^[A-Za-z][A-Za-z0-9_.]{0,63}$/, is = 16, $e = "preselectFormEmail", pt = "preselectBoundUser";
function ke(t, e) {
  return `${t}|${e.pathname}`;
}
function M(t, e) {
  if (t)
    return V(t).find((i) => le(i.pathname, e));
}
function we(t, e) {
  if (!(!t || !p(e)))
    return V(t).find((i) => i.targetPageIdentifier === e);
}
function mt(t, e) {
  if (!e)
    return t;
  const i = new Set(Object.keys(e).map((r) => r.toLowerCase())), n = {};
  for (const [r, s] of Object.entries(t))
    i.has(r.toLowerCase()) || (n[r] = s);
  return { ...n, ...e };
}
function Ot(t) {
  return t.getPreselectVariant?.() === "widened";
}
const ns = /iP(hone|od|ad)|Android|BlackBerry|BB10|IEMobile|Kindle/, rs = /Win(dows|16|95|98|CE)|Pocket Internet Explorer|OpenBSD|SunOS|CrOS|Linux|X11|Mac_PowerPC|Macintosh|QNX|BeOS|OS\/2/;
function ss(t) {
  return ns.test(t) ? "MobileWeb" : rs.test(t) ? "DesktopWeb" : void 0;
}
function un(t) {
  if (p(t))
    return t;
  const e = ss(navigator.userAgent), i = e ? t.byClientType?.[e] : void 0;
  return i === Vi ? void 0 : (t.byHostname ? T(t.byHostname, window.location.hostname) : void 0) ?? i ?? t.value;
}
function rt(t) {
  return new Set(
    Object.keys(t).filter((e) => !L(t[e])).map((e) => e.toLowerCase())
  );
}
function qe(t, e, i) {
  const n = e.preselectAttributeDefaults;
  if (!n || Ot(t))
    return {};
  const r = /* @__PURE__ */ new Set([...rt(t.getUserIdentities?.() ?? {}), ...rt(i)]), s = rt(t.userAttributes ?? {}), o = {};
  for (const a of Object.keys(n)) {
    const c = a.toLowerCase();
    if (De(a, t.mappedEmailSha256Key) || r.has(c) || s.has(c) && !dn(t, e, a))
      continue;
    const l = un(n[a]);
    l !== void 0 && (o[a] = l);
  }
  return o;
}
function dn(t, e, i) {
  const n = T(e.preselectAttributeDefaults ?? {}, i);
  return b(n) && n.skipRemembered === !0 && !Ot(t) && !De(i, t.mappedEmailSha256Key) && un(n) !== void 0;
}
function os(t, e, i, n, r) {
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
function Kt(t) {
  const e = t.getPreselectVariant?.();
  return e === "widened" || e === "standard" ? { variant: e } : {};
}
function as(t, e, i) {
  const n = t?.identityKeys;
  if (!n?.length || !e)
    return n;
  const r = fn(e, i);
  return r.length > 0 ? [...n, ...r] : n;
}
function fn(t, e) {
  const i = Object.keys(e);
  return Object.keys(t).filter(
    (n) => T(e, n) === t[n] && !i.some((r) => r !== n && r.toLowerCase() === n.toLowerCase() && !L(e[r]))
  );
}
function gn(t, e) {
  if (!t)
    return;
  const i = fn(t, e).filter((n) => ts.test(n)).slice(0, is);
  return i.length > 0 ? i.join(",") : void 0;
}
function pn(t) {
  const e = Object.keys(t.preselectAttributeDefaults ?? {});
  return [...t.attributeKeys, ...e.filter((i) => !t.attributeKeys.includes(i))];
}
function Ae(t) {
  return t ? V(t).length > 0 : !1;
}
function cs(t, e, i = window.location.pathname) {
  if (t.pending.some((r) => r.pathname === i && !fe(r.event)))
    return;
  const n = t.scheduledDispatch;
  n && n.pathname === i && !fe(n.event) || ge(t, e, qi, i);
}
function ls(t, e) {
  return !t || !p(e) ? !1 : V(t).some((i) => (i.triggerEventNames ?? []).includes(e));
}
function je(t) {
  return !fe(t) && !Le(t) && t.EventDataType !== Xe;
}
function us(t, e) {
  const i = t.scheduledDispatch;
  return i && i.pathname === e && je(i.event) ? !0 : t.pending.some((n) => n.pathname === e && je(n.event));
}
function ds(t, e, i, n) {
  if (!t.isKitReady() || !t.isPreselectionEnabled() || !xt(t, i))
    return "waits";
  const { collected: r, missingKeys: s } = re(t, e, i);
  if (s.length > 0)
    return "waits";
  const o = t.accountId || "", a = ce(St(o, S(n)));
  if (!a)
    return "now";
  const c = Je(t, o, i.targetPageIdentifier, r);
  return a.byEvent || $t(a.attributesDigest, c) ? "skipped" : "now";
}
function fs(t, e, i) {
  t.pending = t.pending.filter((r) => r.pathname !== i);
  const n = e.accountId ? Lt(e.accountId) : null;
  e.accountId && n && n.pathname === i && ie(e.accountId);
}
function gs(t, e, i, n = window.location.pathname) {
  const r = M(e.accountId, n);
  if (!r || !ue(r, i))
    return;
  const s = ds(e, i, r, n);
  if (s === "now")
    fs(t, e, n);
  else if (us(t, n) || s === "skipped" && t.scheduledDispatch?.pathname === n)
    return;
  ge(t, e, i, n);
}
function ps(t, e) {
  return t ? V(t).some((i) => i.attributeKeys.includes(e)) : !1;
}
function ms() {
  return { pending: [] };
}
function Ut(t) {
  if (t.dispatchTimer === void 0)
    return;
  const e = t.scheduledDispatch;
  return clearTimeout(t.dispatchTimer), t.dispatchTimer = void 0, t.scheduledDispatch = void 0, e;
}
function hs(t, e) {
  return t === void 0 ? e : e === void 0 ? t : Math.min(t, e);
}
function oi(t) {
  return fe(t) ? 0 : Le(t) || t.EventDataType === Xe ? 2 : 1;
}
function _s(t, e) {
  const i = M(t.accountId, e.pathname);
  return !!i && re(t, e.event, i).missingKeys.length > 0;
}
function mn(t, e, i, n) {
  const r = t.pending.find((s) => s.pathname === n);
  return !!r && oi(i) < oi(r.event) && !(je(i) && _s(e, r));
}
function q(t, e, i) {
  const n = t.pending.findIndex((r) => r.pathname === i.pathname);
  if (n >= 0) {
    if (mn(t, e, i.event, i.pathname))
      return;
    const r = t.pending[n];
    t.pending[n] = {
      ...i,
      triggeredAt: hs(r.triggeredAt, i.triggeredAt),
      intentSeen: i.intentSeen ?? r.intentSeen ?? Pe(r.event)
    };
    return;
  }
  t.pending.push(i);
}
function Se(t) {
  if (!t?.getUserIdentities)
    return [];
  const e = t.getUserIdentities().userIdentities;
  return e ? Object.keys(e).filter((i) => {
    const n = e[i];
    return p(n) && n.length > 0;
  }).sort() : [];
}
function O(t) {
  return Se(t).length > 0;
}
const ht = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, _t = /* @__PURE__ */ new WeakSet(), yt = /* @__PURE__ */ new WeakSet(), ai = /* @__PURE__ */ new WeakSet();
function Nt(t) {
  if (!(t instanceof HTMLInputElement)) return !1;
  const e = t.type;
  return e === "text" || e === "email" || t.getAttribute("autocomplete") === "email" && e !== "hidden" && e !== "password";
}
function Et(t) {
  const e = t.target;
  if (!(e instanceof HTMLInputElement)) return;
  const i = !ai.has(t);
  if (ai.add(t), t.isTrusted !== !0 ? yt.add(e) : i && yt.delete(e), t.isTrusted === !0 && Nt(e)) {
    if (!i) return;
    _t.add(e), e.addEventListener("input", Et, !0), e.addEventListener("change", Et, !0);
  } else
    _t.delete(e);
}
function ys(t) {
  return Nt(t) && (t.type === "email" || t.getAttribute("autocomplete") === "email" || ht.test(t.value.trim()));
}
function Ce(t) {
  return t.attributeKeys.find((e) => e.toLowerCase() === "email");
}
const Es = 254;
function hn(t) {
  const e = /* @__PURE__ */ new Map();
  let i;
  return document.querySelectorAll("input").forEach((n) => {
    const r = _t.has(n);
    if (!r && !t || !Nt(n)) return;
    const s = n.value.trim();
    r ? ht.test(s) && !e.has(s.toLowerCase()) && e.set(s.toLowerCase(), s) : i !== "untrusted_fill" && s.length <= Es && ht.test(s) && (i = yt.has(n) ? "untrusted_fill" : "unseen_fill");
  }), { emails: e, unfilled: i };
}
function Is() {
  const { emails: t } = hn(!1);
  return t.size === 1 ? t.values().next().value : void 0;
}
function Ft(t, e, i = {}) {
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
    (o) => Object.keys(o).some((a) => n.has(a.toLowerCase()) && !L(T(o, a)))
  );
}
const As = ["email", "emailsha256"];
function De(t, e) {
  const i = t.toLowerCase();
  return As.includes(i) || p(e) && i === e.toLowerCase();
}
function Re(t, e, i) {
  return t.getOutgoingAttributes ? Ke(t.getOutgoingAttributes(e, i), t.mappedEmailSha256Key) : Ke(e, t.mappedEmailSha256Key) || Ke(t.getUserIdentities?.() ?? {}, t.mappedEmailSha256Key);
}
function Ke(t, e) {
  return Object.keys(t).some(
    (i) => De(i, e) && !L(T(t, i))
  );
}
function Mt(t, e, i, n = {}) {
  return e.readEmailInput !== !0 ? "read_disabled" : le(e.pathname, window.location.pathname) ? t.isForwardingAllowed?.() !== !0 || t.isPreselectionPrivacyAllowed?.() === !1 || t.isTargetingDisabled?.() === !0 ? "privacy_blocked" : t.isEmailIdentityFiltered?.() === !0 ? "email_filtered" : Ft(t, i, n) ? "partner_email" : void 0 : "off_route";
}
function vs(t, e, i, n) {
  const r = Mt(t, e, i, n.EventAttributes ?? {});
  if (r) return r;
  const { emails: s, unfilled: o } = hn(!0);
  return s.size > 1 ? "multiple_emails" : o ?? "no_field";
}
function bs(t, e, i) {
  const n = window.location.pathname, r = M(e.accountId, n), s = r && Ce(r);
  return !!s && t.pending.some(
    (o) => o.pathname === n && !Mt(e, r, s, o.event.EventAttributes ?? {})
  ) && i.isTrusted === !0 && ys(i.target);
}
function _n(t, e, i, n) {
  const r = Ce(e);
  if (!r || !L(T(i, r)) || Mt(t, e, r, n.EventAttributes ?? {}))
    return;
  const s = Is();
  if (s)
    return i[r] = s, r;
}
function xt(t, e) {
  const i = Ce(e);
  return O(t.filteredUser) || e.readEmailInput === !0 && !!i && Vt(t, e, {}).includes(i);
}
function Ps(t) {
  return !!t && V(t).some((e) => e.readEmailInput === !0);
}
function He(t) {
  return t.length > 0 ? t.join(",") : "none";
}
function C(t) {
  const e = t?.getMPID?.();
  return e == null ? null : String(e);
}
function yn(t, e) {
  const i = Se(t.filteredUser), n = t.getCurrentUser?.(), r = Se(n), s = C(t.filteredUser), o = C(n), a = [...e.identityKeys ?? [], "email", "emailsha256"];
  t.mappedEmailSha256Key && a.push(t.mappedEmailSha256Key);
  const c = new Set(a.map((f) => f.toLowerCase())), l = n?.getAllUserAttributes?.() ?? {}, u = [t.userAttributes, l].some(
    (f) => Object.entries(f).some(
      ([g, v]) => c.has(g.toLowerCase()) && p(v) && v.length > 0
    )
  );
  let d = "no_identities";
  return t.filteredUser ? o !== null && s !== o ? d = "mpid_mismatch" : r.length > 0 && (d = "kit_user_lacks_identities") : d = "no_filtered_user", {
    identity_reason: d,
    kit_identity_types: He(i),
    current_identity_types: He(r),
    mpid_match: o === null ? "unknown" : s === o,
    identity_attribute_present: u
  };
}
function Vt(t, e, i) {
  const n = Ot(t) ? e.widenedOptionalAttributeKeys ?? [] : [], r = new Set(
    [...e.optionalAttributeKeys ?? [], ...n].map((o) => o.toLowerCase())
  ), s = qe(t, e, i);
  return e.attributeKeys.filter(
    (o) => !r.has(o.toLowerCase()) && L(T(i, o)) && T(s, o) === void 0
  );
}
function re(t, e, i, n = !0) {
  const r = t.filteredUser?.getAllUserAttributes?.() || {}, s = new Set(i.identityKeys ?? []);
  let o;
  const a = {};
  for (const u of i.attributeKeys) {
    const d = t.getEventAttributeValue(e, u), f = T(t.userAttributes, u);
    let g = !L(d) || dn(t, i, u) ? d : L(f) ? T(r, u) : f;
    if (L(g) && s.has(u)) {
      o || (o = t.getUserIdentities?.() ?? {});
      const v = T(o, u);
      g = p(v) && v !== "" ? v : void 0;
    }
    L(g) || (a[u] = g);
  }
  const c = e.EventAttributes ?? {};
  for (const u of Object.keys(i.preselectAttributeDefaults ?? {})) {
    if (!L(t.getEventAttributeValue(e, u)))
      continue;
    const d = Object.keys(c).find(
      (f) => f.toLowerCase() === u.toLowerCase() && !L(c[f])
    );
    d !== void 0 && (a[d] = c[d]);
  }
  const l = n ? _n(t, i, a, e) : void 0;
  return {
    collected: a,
    missingKeys: Vt(t, i, a),
    formEmailKey: l
  };
}
const En = /* @__PURE__ */ new WeakMap();
function ws(t) {
  return En.get(t);
}
function Ss(t, e, i) {
  i && En.set(e, i);
  const n = (s) => {
    i?.();
    const o = e[$e] ? "redacted" : s instanceof Error ? s.message : String(s);
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
const ci = /* @__PURE__ */ new Map(), li = /* @__PURE__ */ new Map();
function ui(t, e, i) {
  const n = t.get(e), r = { previous: i, earlier: n };
  return n && (n.later = r), t.set(e, r), r;
}
function di(t, e, i, n) {
  const { earlier: r, later: s } = i;
  if (s) {
    s.previous = i.previous, s.earlier = r, r && (r.later = s);
    return;
  }
  n(i.previous), r && (r.later = void 0), t.get(e) === i && (r ? t.set(e, r) : t.delete(e));
}
function Je(t, e, i, n) {
  try {
    const r = we(e, i), s = r ? qe(t, r, n) : void 0, o = mt(n, s), a = t.getOutgoingAttributes ? t.getOutgoingAttributes(n, i) : { ...t.getUserIdentities?.() ?? {}, ...o }, c = Object.keys(a).sort().filter((m) => De(m, t.mappedEmailSha256Key) && !L(T(a, m))).map((m) => [m, T(a, m)]), l = Object.keys(r?.preselectAttributeDefaults ?? {}), u = (m) => l.some((h) => h.toLowerCase() === m.toLowerCase()), d = {};
    for (const [m, h] of Object.entries(o))
      u(m) || (d[m] = h);
    for (const m of l) {
      const h = Object.keys(a).filter((A) => A.toLowerCase() === m.toLowerCase() && !L(a[A])).sort().map((A) => [A, a[A]]);
      h.length > 0 && (d[m] = h);
    }
    const f = JSON.stringify(d), g = [.../* @__PURE__ */ new Set([...r?.attributeKeys ?? [], ...Object.keys(o)])].filter((m) => !u(m)).sort().filter((m) => {
      const h = T(a, m);
      return h !== void 0 && h !== T(o, m);
    }).map((m) => [m, T(a, m)]), v = c.length > 0 ? `${f}|${JSON.stringify(c)}` : f, y = g.length > 0 ? `${v}>${JSON.stringify(g)}` : v, E = gn(t.getPreselectFills?.(n, i) ?? s, a);
    return E ? { digest: X(`${y}#${E}`), unmarkedDigest: X(y) } : { digest: X(y) };
  } catch {
    return {};
  }
}
function $t(t, e) {
  return t !== void 0 && e.digest !== void 0 && (t === e.digest || t === e.unmarkedDigest);
}
function jt(t, e, i, n) {
  return ni(t, e, i.digest, n) || i.unmarkedDigest !== void 0 && ni(t, e, i.unmarkedDigest, n);
}
function Ht(t) {
  return !t.isTargetingDisabled?.() && t.isPreselectionPrivacyAllowed?.() !== !1 && t.isForwardingAllowed?.() !== !1;
}
function Oe(t, e, i, n, r, s, o, a = !1, c, l = a, u, d, f) {
  if (!Ht(t))
    return !1;
  const g = c ? { intent_kind: c.replace("intent_", "") } : {}, v = we(e, n), y = v ? qe(t, v, r) : {}, E = t.getOutgoingAttributes?.(r, n), m = v ? os(t, v, r, E, y) : void 0;
  if (m)
    return t.logPlacementDiagnostic(
      w("skipped", `skip_value:${m}`, g)
    ), !1;
  const h = St(e, i), A = Je(t, e, n, r), P = A.digest;
  if (c && jt(e, n, A, c !== "intent_cart"))
    return t.logPlacementDiagnostic(w("skipped", "active_preselection", g)), !0;
  if (a && ce(h)?.byEvent)
    return t.logPlacementDiagnostic(w("skipped", "active_preselection")), !1;
  const K = P !== void 0 ? ce(h) : null;
  if (P !== void 0) {
    if ($t(K?.attributesDigest, A))
      return t.logPlacementDiagnostic(w("skipped", "active_preselection", g)), !0;
    er(
      h,
      P,
      l || !!c && ce(h)?.byEvent === !0
    );
  }
  const k = Object.keys(y).filter((Y) => !E || T(E, Y) === y[Y]);
  t.logPlacementDiagnostic(
    w("fired", s, {
      identity_types: He(Se(t.filteredUser)),
      ...u ? { email_source: "input" } : {},
      ...c ? {
        ...g,
        intent_route: f ? f.route : "entry",
        ...d ? { intent_source: d } : {},
        ...f ? { logged_in: f.loggedIn } : {}
      } : {},
      ...Kt(t),
      ...k.length > 0 ? { defaulted_keys: k.join(",") } : {}
    })
  );
  const j = `${e}:${n}`, D = ui(
    ci,
    j,
    Tr(e, n, P, c === "intent_cart")
  ), H = P !== void 0 ? ui(li, h, K) : void 0;
  let Z = !1;
  const _e = () => {
    Z || (Z = !0, H && di(
      li,
      h,
      H,
      (Y) => tr(h, Y, P)
    ), di(
      ci,
      j,
      D,
      (Y) => Lr(e, n, Y, P)
    ));
  };
  return Ss(t, {
    attributes: { ...r, [ln]: o },
    preselect: !0,
    identifier: n,
    omitUrl: !0,
    ...u ? { [$e]: { key: u, mpid: C(t.filteredUser) } } : {},
    ...f ? { [pt]: { mpid: C(t.filteredUser), requireLogin: f.requireLogin } } : {}
  }, _e), !0;
}
function Ts(t, e) {
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
  if (!O(e.filteredUser) || (ie(e.accountId), C(e.filteredUser) !== i.mpid))
    return;
  const n = M(e.accountId, i.pathname);
  if (!n || n.targetPageIdentifier !== i.identifier)
    return;
  if (!i.byEvent && se(e)) {
    e.logPlacementDiagnostic(w("missed", "recovery_awaits_intent"));
    return;
  }
  const r = te(i.attributes), s = Vt(e, n, r);
  if (s.length > 0) {
    for (const o of s)
      e.logPlacementDiagnostic(
        w("missed", `missing_persisted_attribute:${o}`, Kt(e))
      );
    return;
  }
  Oe(
    e,
    e.accountId,
    i.identifier,
    i.identifier,
    r,
    "recovered",
    ke("recovered", n)
  );
}
function Wt(t) {
  return !t.isTargetingDisabled?.() && t.isPreselectionPrivacyAllowed?.() !== !1 && t.isKitReady() && t.isPreselectionEnabled();
}
function Qe(t) {
  return t === void 0 ? {} : { since_trigger_ms: Date.now() - t };
}
function In(t, e, i) {
  if (e.waitingFor !== "intent" || e.intentSeen)
    return !1;
  const n = M(t.accountId, e.pathname);
  return !!n && n === M(t.accountId, i);
}
function It(t, e) {
  Wt(t) && t.logPlacementDiagnostic(
    w("missed", "left_trigger_path", {
      waiting_for: e.waitingFor,
      has_identity: O(t.filteredUser),
      ...Qe(e.triggeredAt)
    })
  );
}
function ge(t, e, i, n = window.location.pathname, r, s = Date.now(), o) {
  const a = t.pending.filter((u) => u.pathname !== n);
  if (a.length > 0) {
    const u = e.accountId ? Lt(e.accountId) : null;
    e.accountId && u && a.some((d) => d.pathname === u.pathname) && ie(e.accountId), a.forEach((d) => {
      In(e, d, n) ? t.intentWaitMovedWithin = M(e.accountId, n) : It(e, d);
    }), t.pending = t.pending.filter((d) => d.pathname === n);
  }
  const c = Ut(t), l = c !== void 0 && c.pathname === n && fe(c.event);
  if (c && !l) {
    const u = M(e.accountId, c.pathname);
    S(c.pathname) !== S(n) && u?.releaseHoldOnRouteChange ? (An(t, e, c, "hold_released_on_route_change"), t.pending = t.pending.filter((d) => d.pathname === c.pathname ? (It(e, d), !1) : !0)) : fi(e, c, n);
  }
  Ls(t, e, i, n, r, s, l, o), l && t.scheduledDispatch === void 0 && fi(e, c, n);
}
function fi(t, e, i) {
  t.logPlacementDiagnostic(
    w("missed", "hold_cancelled", {
      held_ms: Date.now() - e.heldAt,
      same_path: e.pathname === i
    })
  );
}
function Ls(t, e, i, n, r, s, o, a) {
  const c = t.pending.find((u) => S(u.pathname) === S(n));
  if (a ?? (a = Pe(i) ?? c?.intentSeen ?? Pe(c?.event)), e.isTargetingDisabled?.() || e.isPreselectionPrivacyAllowed?.() === !1)
    return;
  const l = M(e.accountId, n);
  if (!l) {
    ks(e, n);
    return;
  }
  if (!(r !== void 0 && C(e.filteredUser) !== r)) {
    if (!a && !ue(l, i) && se(e)) {
      const u = t.intentWaitMovedWithin === l;
      t.intentWaitMovedWithin = void 0;
      const d = u || c?.waitingFor === "intent" && c.awaitingIntentLogged === !0, f = e.isKitReady() && e.isPreselectionEnabled();
      q(t, e, {
        event: i,
        pathname: n,
        // Bound to an identified shopper, as a timer hold is, so another user's click never sends
        // this page view's attributes. A guest stays unbound so signing in at checkout still fires.
        triggeringUserId: r ?? (O(e.filteredUser) ? C(e.filteredUser) : void 0),
        triggeredAt: s,
        waitingFor: "intent",
        awaitingIntentLogged: d || f
      }), !d && f && e.logPlacementDiagnostic(w("held", "awaiting_intent")), f && At(e, l, i);
      return;
    }
    if (!e.isKitReady()) {
      if (mn(t, e, i, n))
        return;
      const u = [], d = C(e.filteredUser);
      if (e.accountId && d && O(e.filteredUser)) {
        const { collected: f, missingKeys: g, formEmailKey: v } = re(e, i, l);
        if (g.length === 0 && !v) {
          const y = te(f);
          (ue(l, i) || !!a ? ii(
            e.accountId,
            n,
            l.targetPageIdentifier,
            y,
            d,
            !0
          ) : ii(e.accountId, n, l.targetPageIdentifier, y, d)) || u.push(w("queued", "persist_failed"));
        }
      }
      q(t, e, {
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
      if (At(e, l, i), !xt(e, l)) {
        e.logPlacementDiagnostic(
          w("missed", "no_valid_identity", yn(e, l))
        ), q(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "identity" });
        return;
      }
      if (l.dispatchDelayMs !== void 0 && !ue(l, i) && !Le(i) && !a) {
        const u = C(e.filteredUser), d = Math.min(
          l.dispatchDelayMs,
          Math.max(0, s + l.dispatchDelayMs - Date.now())
        );
        t.scheduledDispatch = { event: i, pathname: n, heldAt: Date.now(), heldForUserId: u, triggeredAt: s }, o || e.logPlacementDiagnostic(w("held", "dispatch_delay", { delay_ms: d })), t.dispatchTimer = setTimeout(() => {
          t.dispatchTimer = void 0, t.scheduledDispatch = void 0, vn(t, e.getCurrentHost?.() ?? e, i, n, u, s);
        }, d);
        return;
      }
      bn(
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
function At(t, e, i) {
  if (!t.accountId) return;
  const n = Ce(e), r = e.readEmailInput === !0 && !!n && (Ft(t, n, i.EventAttributes ?? {}) || _n(t, e, {}, i) !== void 0);
  Ar(
    t.accountId,
    e.targetPageIdentifier,
    O(t.filteredUser) || r
  );
}
function ks(t, e) {
  const i = t.accountId;
  !i || t.isKitReady() && !t.isPreselectionEnabled() || V(i).forEach((n) => {
    xr(n.pathname, e) && Sr(i, n.targetPageIdentifier);
  });
}
function Cs(t) {
  const e = N[N.length - 1];
  return t !== void 0 && (e === void 0 || t < e.since);
}
function Ds() {
  try {
    return new URL(document.referrer).origin === window.location.origin ? "same_origin" : "other_origin";
  } catch {
    return "none";
  }
}
function se(t) {
  return t.isCheckoutIntentActive?.() === !0 && t.isPreselectionPrivacyAllowed?.() !== !1;
}
function An(t, e, i, n, r) {
  vn(
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
function vn(t, e, i, n, r, s, o, a) {
  const c = M(e.accountId, n);
  if (!(!c || e.isTargetingDisabled?.() || e.isPreselectionPrivacyAllowed?.() === !1)) {
    if (!a && !ue(c, i) && !Le(i) && se(e)) {
      const l = e.isKitReady() && e.isPreselectionEnabled();
      q(t, e, {
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
      q(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "launcher" });
      return;
    }
    if (e.isPreselectionEnabled()) {
      if (!xt(e, c)) {
        e.logPlacementDiagnostic(
          w("missed", "no_valid_identity", yn(e, c))
        ), q(t, e, { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a, waitingFor: "identity" });
        return;
      }
      C(e.filteredUser) === r && bn(t, e, i, n, c, r, s, o, a);
    }
  }
}
function bn(t, e, i, n, r, s, o, a, c, l) {
  if (e.isPreselectionPrivacyAllowed?.() === !1) return;
  const { collected: u, missingKeys: d, formEmailKey: f } = re(e, i, r), g = t.lastResolvedPageView, v = N[N.length - 1], y = S(n);
  if (Le(i) && g && g.accountId === e.accountId && g.pathname === y && g.route === v && g.userId === C(e.filteredUser) && g.identifier === r.targetPageIdentifier && g.attributeKeys.some(
    (P) => r.attributeKeys.includes(P) && L(T(u, P))
  ))
    return;
  if (d.length > 0) {
    const P = Se(e.filteredUser), K = Ce(r);
    for (const k of d)
      e.logPlacementDiagnostic(
        w("missed", `missing_attribute:${k}`, {
          identity_types: He(P),
          key_is_identity: P.some((j) => j.toLowerCase() === k.toLowerCase()),
          ...k === K ? { email_reason: vs(e, r, k, i) } : {},
          ...Kt(e)
        })
      );
    q(t, e, {
      event: i,
      pathname: n,
      triggeringUserId: s,
      triggeredAt: o,
      intentSeen: c,
      waitingFor: "attribute"
    });
    return;
  }
  const E = c ?? Pe(i);
  if (E && !Re(e, u, r.targetPageIdentifier)) {
    t.noEmailLoggedPathname !== y && (t.noEmailLoggedPathname = y, e.logPlacementDiagnostic(
      w("missed", "no_strict_email", {
        intent_kind: E.replace("intent_", ""),
        has_identity: O(e.filteredUser)
      })
    )), q(t, e, {
      event: i,
      pathname: n,
      triggeringUserId: s,
      triggeredAt: o,
      intentSeen: E,
      waitingFor: "attribute"
    });
    return;
  }
  t.noEmailLoggedPathname = void 0, l && (t.pending = t.pending.filter((P) => P !== l));
  const m = ue(r, i), h = E ?? (m ? "event" : fe(i) ? "pathname" : "pageview");
  Oe(
    e,
    e.accountId || "",
    S(n),
    r.targetPageIdentifier,
    u,
    a ?? (E ? "intent" : m ? "event_trigger" : "fired"),
    ke(h, r),
    m && !E,
    E,
    m,
    f,
    E ? t.intentSource : void 0
  ) && (je(i) || m) && (t.lastResolvedPageView = {
    accountId: e.accountId,
    pathname: y,
    route: v,
    userId: C(e.filteredUser),
    identifier: r.targetPageIdentifier,
    attributeKeys: Object.keys(u)
  });
}
const Rs = ["", "0", "[]", "{}", "false", "null"];
function Pn(t) {
  if (L(t)) return !1;
  if (Array.isArray(t)) return !0;
  const e = String(t).trim();
  if (Rs.includes(e.toLowerCase())) return !1;
  try {
    const i = JSON.parse(e);
    return !Array.isArray(i) || i.length > 0;
  } catch {
    return !0;
  }
}
function he(t) {
  const e = t ? Be(t) : [];
  return e.length === 1 && e[0].cartUserAttribute ? e[0] : void 0;
}
function Os(t) {
  return he(t) !== void 0;
}
function gi(t, e) {
  const i = he(t)?.cartUserAttribute;
  return p(i) && i.toLowerCase() === e.toLowerCase();
}
function pi(t, e, i) {
  const n = he(t)?.cartUserAttribute?.toLowerCase();
  if (!n || i && pn(i).some((s) => s.toLowerCase() === n))
    return e;
  const r = {};
  for (const [s, o] of Object.entries(e))
    s.toLowerCase() !== n && (r[s] = o);
  return r;
}
function wn(t, e) {
  const i = t.filteredUser?.getAllUserAttributes?.() ?? {}, n = Object.keys(i).find((r) => r.toLowerCase() === e.toLowerCase());
  return n === void 0 ? void 0 : i[n];
}
function Sn(t) {
  const { search: e, hash: i } = window.location, n = /^#!|^#[^?&]*\//.test(i);
  return S(t) + e + (n ? i : "");
}
function Tn(t) {
  try {
    return X(p(t) ? t : JSON.stringify(t) ?? "");
  } catch {
    return;
  }
}
function mi(t, e, i = window.location.pathname) {
  t.cartPageViewPathname = S(i), Ln(t, e, i);
}
function Ln(t, e, i) {
  const n = he(e.accountId);
  if (!n || t.cartPageViewPathname !== S(i) || le(n.pathname, i) || !Ht(e)) {
    t.cartPageViewPathname = void 0;
    return;
  }
  if (!e.isKitReady()) return;
  if (!e.isPreselectionEnabled()) {
    t.cartPageViewPathname = void 0;
    return;
  }
  const r = e.accountId;
  if (Fr(r, n.targetPageIdentifier, X(Sn(i)))) {
    t.cartPageViewPathname = void 0;
    return;
  }
  const s = wn(e, n.cartUserAttribute);
  if (!(Pn(s) || Pr(r, C(e.filteredUser))) || !O(e.filteredUser)) return;
  const a = Tn(s);
  if (a !== void 0 && Ur(r, n.targetPageIdentifier, a, C(e.filteredUser)))
    return;
  const { collected: c, missingKeys: l } = re(e, Vr, n, !1);
  if (l.length > 0 || !Re(e, c, n.targetPageIdentifier)) return;
  t.cartPageViewPathname = void 0;
  const u = Je(e, r, n.targetPageIdentifier, c), d = ce(St(r, n.targetPageIdentifier));
  jt(r, n.targetPageIdentifier, u) || $t(d?.attributesDigest, u) || Oe(
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
function Ks(t, e, i = window.location.pathname) {
  if (Ts(t, e), Gr(t, e), t.cartPageViewPathname !== void 0 && Ln(t, e, i), t.pending.length === 0)
    return;
  const n = t.pending;
  t.pending = [], n.forEach((r) => {
    const { event: s, pathname: o, storedDiagnostics: a, triggeringUserId: c, triggeredAt: l, waitingFor: u, intentSeen: d } = r, f = Wt(e), g = O(e.filteredUser), v = Qe(l);
    if (f && u === "identity" && g && e.logPlacementDiagnostic(
      w("identity_arrived", "pending_identity", {
        ...v,
        on_trigger_path: o === i
      })
    ), o !== i) {
      In(e, r, i) ? t.intentWaitMovedWithin = M(e.accountId, i) : It(e, { waitingFor: u, triggeredAt: l });
      return;
    }
    if (u === "intent" && !d) {
      const y = M(e.accountId, o);
      if (y && se(e)) {
        !r.awaitingIntentLogged && e.isKitReady() && e.isPreselectionEnabled() && (e.logPlacementDiagnostic(w("held", "awaiting_intent")), At(e, y, s), r.awaitingIntentLogged = !0), t.pending.push(r);
        return;
      }
    }
    f && a?.forEach((y) => e.logPlacementDiagnostic(y)), t.scheduledDispatch?.pathname !== o && ge(t, e, s, o, c, l, d);
  });
}
function Us(t, e, i) {
  if (!t.accountId || !Wt(t))
    return;
  const n = we(t.accountId, e);
  if (!n)
    return;
  const r = he(t.accountId);
  if (r?.targetPageIdentifier === n.targetPageIdentifier) {
    const a = Sn(window.location.pathname);
    a !== "/" && Nr(t.accountId, n.targetPageIdentifier, X(a));
    const c = wn(t, r.cartUserAttribute);
    Kr(
      t.accountId,
      n.targetPageIdentifier,
      Pn(c) ? Tn(c) : void 0,
      C(t.filteredUser)
    );
  }
  const s = Or(t.accountId, n.targetPageIdentifier);
  if (!s || (se(t) && t.isForwardingAllowed?.() !== !1 && t.logPlacementDiagnostic(
    w("arrived", "intent_arrival", {
      ...Ns(s),
      ...Fs(s, i)
    })
  ), s.firedAt !== void 0))
    return;
  const o = s.triggeredAt !== void 0;
  t.logPlacementDiagnostic(
    w("missed", "arrival_without_fire", {
      trigger_seen: o,
      identity_seen_on_trigger_path: s.identitySeenAt !== void 0,
      has_identity: O(t.filteredUser),
      // Another tab's checkout caches its offers in that tab, so this arrival still misses. This tab's
      // own trigger counts too: the device marker can expire, be cleared by another tab or fail to save.
      trigger_seen_any_tab: o || vr(t.accountId, n.targetPageIdentifier),
      ...Qe(s.triggeredAt),
      near_miss_seen: Cs(s.nearMissAt),
      // Page memory loses the trigger record on a full navigation, so trigger_seen reads false.
      storage: Nn() ? "page" : "device",
      referrer: Ds()
    })
  );
}
function Ns(t) {
  const e = t.intentAt === void 0 || t.intentKind === void 0 ? "none" : xs(Date.now() - t.intentAt);
  return {
    intent_seen: e === "none" ? "none" : t.intentKind,
    lead: e,
    fired: t.firedAt !== void 0
  };
}
function Fs(t, e) {
  const i = mr(e), n = t.paymentPickAt === void 0 ? -1 : Date.now() - t.paymentPickAt, r = t.paymentPick && n >= 0 && n < de ? t.paymentPick : "none";
  if (r === "none" && i === "absent")
    return {};
  const s = t.firedAt === void 0 ? -1 : Date.now() - t.firedAt, o = t.paymentAtFire && s >= 0 && s < de ? t.paymentAtFire : "none";
  return {
    payment_guess: o,
    payment_pick: r,
    payment_arrival: i,
    payment_match: o !== "none" && i !== "absent" && i !== "other" ? o === i : "n/a"
  };
}
const Ms = [
  [1e3, "lt1s"],
  [2e3, "1s_2s"],
  [5e3, "2s_5s"],
  [1e4, "5s_10s"],
  [2e4, "10s_20s"],
  [6e4, "20s_60s"],
  [3e5, "60s_300s"],
  [de, "300s_1800s"]
];
function xs(t) {
  if (t < 0)
    return "none";
  const e = Ms.find(([i]) => t < i);
  return e ? e[1] : "none";
}
function Vs() {
  return {
    context: null,
    lifecycle: "idle",
    recreateInFlight: null
  };
}
function $s(t, e) {
  t.context = {
    accountId: e.accountId,
    launcherOptions: { ...e.launcherOptions },
    legacyRoktExtensions: [...e.legacyRoktExtensions]
  };
}
function js(t) {
  t.lifecycle = "attached";
}
function Hs(t) {
  t.lifecycle !== "idle" && (t.lifecycle = "terminated");
}
function Ws(t) {
  t.lifecycle = "terminated";
}
function Ys(t) {
  t.context = null, t.lifecycle = "idle", t.recreateInFlight = null;
}
function Bs(t, e, i) {
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
const hi = "rokt:intent", _i = "LEAD_CAPTURE_SUBMITTED";
class Gs {
  constructor(e) {
    this.handlers = e, this.config = null, this.dispatchedForPageView = !1;
  }
  configure(e) {
    this.config = e, this.dispatchedForPageView = !1, this.detachListeners(), this.isIdentityCaptureBridgeEnabled(this.config) && (this.leadCaptureSubmittedListener = (i) => {
      const n = this.parseLeadCaptureSubmittedPayload(i);
      n && this.handlers.onLeadCaptureSubmitted(n);
    }, window.addEventListener(_i, this.leadCaptureSubmittedListener)), this.isExitIntentBridgeEnabled(this.config) && (this.exitIntentListener = (i) => this.handleExitIntentEvent(i), window.addEventListener(hi, this.exitIntentListener));
  }
  resetPageViewState() {
    this.dispatchedForPageView = !1;
  }
  dispose() {
    this.detachListeners(), this.config = null, this.dispatchedForPageView = !1;
  }
  detachListeners() {
    this.exitIntentListener && (window.removeEventListener(hi, this.exitIntentListener), this.exitIntentListener = void 0), this.leadCaptureSubmittedListener && (window.removeEventListener(_i, this.leadCaptureSubmittedListener), this.leadCaptureSubmittedListener = void 0);
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
    const n = i.body, r = p(n.email) ? n.email : void 0, s = p(n.mobile_number) ? n.mobile_number : void 0, o = {};
    p(r) && r.length > 0 && (o.email = r), p(s) && s.length > 0 && (o.mobile_number = s);
    const a = {}, c = this.allowCustomUserAttributes(this.config), l = this.getAllowedUserAttributeKeys(this.config);
    this.mergeLeadCaptureUserAttributes(
      a,
      b(n.userAttributes) ? n.userAttributes : null,
      c,
      l
    );
    const u = p(n.rclid) ? n.rclid : void 0;
    u && u.length > 0 && (a.rokt_rclid = u);
    const d = p(n.accountID) ? n.accountID : void 0;
    d && d.length > 0 && (a.rokt_account_id = d);
    const f = p(n.referralCreativeID) ? n.referralCreativeID : void 0;
    return f && f.length > 0 && (a.rokt_referral_creative_id = f), { identities: o, userAttributes: a };
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
const F = "Rokt", zs = 7, Ue = 181, Xs = "selectPlacements", qs = "apps.roktecommerce.com", Js = 0.1, Qs = "ThankYouPageJourney", Zs = "rokt-launcher", eo = "rokt-thank-you-element", to = "userIdentifiedInWorkspace", yi = 3, io = 2, no = "page_events", ro = "page_view_attributes", so = "mparticle_session_id", Ei = "mparticle_device_id", st = "exit-intent", oo = [
  "3479519924056514560",
  "3484183287406608384",
  "3198447216177237634",
  "3292347205549055462"
], ao = "exit-intent-placement", Ii = 500, Yt = {
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  UNHANDLED_EXCEPTION: "UNHANDLED_EXCEPTION",
  IDENTITY_REQUEST: "IDENTITY_REQUEST",
  LOG_DELIVERY_FAILURE: "LOG_DELIVERY_FAILURE"
}, ve = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARNING: "WARNING"
}, co = "apps.rokt-api.com", lo = "/v1/log", uo = "/v1/errors", fo = 10;
function _() {
  return window.mParticle;
}
function Ai(t, e) {
  const n = [Ze(t), "/wsdk/integrations/launcher.js"].join("");
  return !e || e.length === 0 ? n : n + "?extensions=" + e.join(",");
}
function vi(t) {
  return [Ze(t), "/rokt-elements/rokt-element-thank-you.js"].join("");
}
function Ze(t) {
  const e = t !== void 0 ? t : co;
  return e.includes("://") ? e.replace(/\/+$/, "") : ["https://", e].join("");
}
function kn(t, e, i) {
  if (t)
    return t.startsWith("http://") || t.startsWith("https://") ? t : "https://" + t;
  const r = e?.includes("://") && !/^https?:\/\//i.test(e) ? void 0 : e;
  return Ze(r) + i;
}
function bi(t, e, i) {
  if (document.getElementById(t)) return;
  const n = document.head || document.body, r = document.createElement("script");
  r.id = t, r.type = "text/javascript", r.src = e, r.async = !0, r.crossOrigin = "anonymous", r.fetchPriority = "high", i?.onLoad && (r.onload = i.onLoad), i?.onError && (r.onerror = i.onError), n.appendChild(r);
}
function Ne(t) {
  if (!t)
    return [];
  const e = Oi(t);
  return e === void 0 ? (console.error("Settings string contains invalid JSON"), []) : e;
}
function Pi(t) {
  const e = t ? Ne(t) : [], i = [], n = [];
  let r = !1;
  for (let s = 0; s < e.length; s++) {
    const o = e[s].value;
    o === "thank-you-journey" ? (r = !0, n.push(Qs)) : i.push(o);
  }
  return {
    roktExtensionsQueryParams: i,
    legacyRoktExtensions: n,
    loadThankYouElement: r
  };
}
async function go(t, e) {
  const i = [];
  if (e)
    for (const n of t)
      i.push(e.use(n));
  return Promise.all(i);
}
function wi(t) {
  if (!t)
    return {};
  const e = {};
  for (let i = 0; i < t.length; i++) {
    const n = t[i];
    e[n.jsmap] = n.value;
  }
  return e;
}
function Si(t) {
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
function Ti(t, e, i) {
  return _().generateHash([t, e, i].join(""));
}
function po(t) {
  let n = "mParticle_wsdkv_" + _().getVersion() + "_kitv_" + "3.27.0";
  return t && (n += "_" + t), n;
}
function Li(t) {
  return !!(t && oo.includes(t));
}
function vt(t) {
  const e = document.createElement("iframe");
  e.style.display = "none", e.setAttribute("sandbox", "allow-scripts allow-same-origin"), e.src = t, e.onload = function() {
    e.onload = null, e.parentNode && e.parentNode.removeChild(e);
  };
  const i = document.body || document.head;
  i && i.appendChild(e);
}
function ki(t, e) {
  const i = X(window.location.origin);
  if (pe._allowedOriginHashes.indexOf(i) === -1 || Math.random() >= Js)
    return;
  const r = window.__rokt_li_guid__;
  if (!r || t && t.includes("://") && !/^https:\/\//i.test(t))
    return;
  const s = bt(window.location.href), o = "version=" + encodeURIComponent(e ?? "") + "&launcherInstanceGuid=" + encodeURIComponent(r) + "&pageUrl=" + encodeURIComponent(s), a = t ? Ze(t) : "https://apps.rokt.com";
  vt(a + "/v1/wsdk-init/index.html?" + o), vt(
    "https://" + qs + "/v1/wsdk-init/index.html?" + o + "&isControl=true"
  );
}
function mo() {
  return typeof window < "u" && !!window.location?.search?.toLowerCase().includes("mp_enable_logging=true");
}
function ho() {
  if (typeof window > "u")
    return;
  const t = window.location?.href;
  return t ? bt(t) : void 0;
}
function _o() {
  return typeof window < "u" ? window.navigator?.userAgent : void 0;
}
class Cn {
  constructor() {
    this._logCount = {};
  }
  incrementAndCheck(e) {
    const n = (this._logCount[e] || 0) + 1;
    return this._logCount[e] = n, n > fo;
  }
}
class be {
  constructor(e, i, n, r, s) {
    this._reporter = "mp-wsdk";
    const o = e.isLoggingEnabled;
    this._integrationName = i || "", this._launcherInstanceGuid = n, this._accountId = r || null, this._rateLimiter = s || new Cn(), this._isEnabled = mo() || o;
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
          code: r || Yt.UNKNOWN_ERROR,
          url: ho(),
          deviceInfo: _o(),
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
class Ci {
  constructor(e, i, n, r, s) {
    this._transport = new be(e, i, n, r, s), this._errorUrl = kn(e?.errorUrl, e?.integrationDomain, uo);
  }
  report(e) {
    if (!e) return;
    const i = e.severity || ve.ERROR;
    this._transport.send(this._errorUrl, i, e.message, e.code, e.stackTrace);
  }
}
class Di {
  constructor(e, i, n, r, s, o) {
    this._intentObserveLines = 0, this._transport = new be(e, n, r, s, o), this._placementDiagnosticTransport = new be(
      e,
      n,
      r,
      s
    ), this._preselectOutcomeTransport = new be(e, n, r, s), this._loggingUrl = kn(e?.loggingUrl, e?.integrationDomain, lo), this._errorReportingService = i;
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
      ve.INFO,
      i.message,
      i.code,
      void 0,
      (n) => {
        if (this._errorReportingService) {
          const r = typeof n.statusCode == "number";
          this._errorReportingService.report({
            message: "LoggingService: Failed to send log: " + n.message,
            code: Yt.LOG_DELIVERY_FAILURE,
            severity: r ? ve.ERROR : ve.WARNING
          });
        }
      }
    );
  }
}
function yo(t, e) {
  const i = Fe(window.location.href), n = t.EventAttributes?.title, r = p(n) ? n : void 0, s = xi(t.EventAttributes, e) ? r : r || document.title, o = Wn(), a = t.ActiveTimeOnSite;
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
    this.name = F, this.id = Ue, this.moduleId = Ue, this.isInitialized = !1, this.launcher = null, this.filters = {}, this.userAttributes = {}, this.userIdentifiedInWorkspace = !1, this.testHelpers = null, this.placementEventMappingLookup = {}, this.placementEventAttributeMappingLookup = {}, this.integrationName = null, this.errorReportingService = null, this.loggingService = null, this._thankYouElementOnLoadCallback = null, this._isThankYouElementLoaded = !1, this._workspaceSearchInFlightPromise = null, this._launcherAttachState = Vs(), this._exitIntentConfig = null, this._exitIntentWatcher = new Gs({
      isKitReady: () => this.isKitReady(),
      onExitIntent: (e, i) => this.handleExitIntent(e, i),
      onLeadCaptureSubmitted: (e) => this.applyIdentityCapturePayload(e.identities, e.userAttributes)
    }), this._exitIntentEnabledForAccount = !1, this._pendingInitWarnings = [], this.accountId = null, this._preselectState = ms();
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
      if (L(s))
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
      n = bt(window.location.href);
      const r = ei(), s = yo(e, i);
      r.push(s);
      const o = Math.min(r.length, Fi), a = Vn(r);
      if (a === 0) {
        const c = ot() ? "quota" : "ls_unavailable";
        this.loggingService?.log({
          message: `Rokt Kit: Failed to persist page view for ${n} [reason: ${c}]`,
          code: "PAGE_VIEW_CAPTURE_FAILED"
        });
      } else a < o && this.loggingService?.log({
        message: `Rokt Kit: Page view storage reduced from ${o} to ${a} record(s) under quota pressure [reason: quota_eviction]`,
        code: "PAGE_VIEW_QUOTA_EVICTION"
      });
    } catch (r) {
      const s = ot() ? "exception" : "ls_unavailable", o = r instanceof Error ? r.message : String(r);
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
      return we(this.accountId, e);
  }
  // What the speculative call fills in over these attributes, the ones it was fired with. An identity the call
  // carries already holds its key, so a default never stands in for it.
  buildPreselectAttributeDefaults(e, i) {
    if (!this.isPreselectionEnabled())
      return;
    const n = we(this.accountId, e);
    if (!n)
      return;
    const r = qe(this.buildPreselectHost(), n, i), s = this.filters || {};
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
      getPreselectFills: (e, i) => this.buildPreselectAttributeDefaults(i, e),
      mappedEmailSha256Key: this._mappedEmailSha256Key,
      isForwardingAllowed: () => this.isForwardingAllowed(),
      isCheckoutIntentActive: () => this.isCheckoutIntentActive(),
      isEmailIdentityFiltered: () => this.isEmailIdentityFiltered()
    };
  }
  flushPendingPreselectDispatches() {
    Ks(this._preselectState, this.buildPreselectHost());
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
    return !_().Rokt || typeof _().Rokt.getLocalSessionAttributes != "function" ? {} : _().Rokt.getLocalSessionAttributes();
  }
  replaceOtherIdentityWithEmailsha256(e) {
    const i = { ...e || {} }, n = this._mappedEmailSha256Key;
    return n && e[n] && (i[z.EMAIL_SHA256_KEY] = e[n]), n && delete i[n], i;
  }
  logSelectPlacementsEvent(e) {
    if (!window.mParticle || typeof _().logEvent != "function" || !b(e))
      return;
    const i = _().EventType.Other;
    _().logEvent(Xs, i, e);
  }
  setRoktSessionId(e) {
    if (!(!e || typeof e != "string"))
      try {
        const i = _().getInstance();
        i && G(i.setIntegrationAttribute) && i.setIntegrationAttribute(Ue, {
          roktSessionId: e
        });
      } catch {
      }
  }
  readMpSessionId() {
    const e = _()?.sessionManager, i = e?.getSessionId ?? e?.getSession;
    if (G(i))
      return i.call(e) || void 0;
  }
  readMpDeviceId() {
    if (!this.isDeviceIdDisabled())
      return _()?.getDeviceId?.() || void 0;
  }
  attachLauncher(e, i, n = []) {
    $s(this._launcherAttachState, {
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
      await go([...n], o), this.initRoktLauncher(o);
    }).catch((o) => {
      const a = this._launcherAttachState.lifecycle === "attached";
      if (Ws(this._launcherAttachState), !a) {
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
    return Bs(
      this._launcherAttachState,
      this.isLauncherReadyToAttach(),
      (e) => this.attachLauncher(e.accountId, e.launcherOptions, e.legacyRoktExtensions)
    );
  }
  initRoktLauncher(e) {
    window.Rokt && (window.Rokt.currentLauncher = e), this.launcher = e, js(this._launcherAttachState);
    const i = _().Rokt?.filters;
    i ? (!this.isInitialized && this.filters.filteredUser && (i.filteredUser = this.filters.filteredUser), this.filters = i, i.filteredUser ? this._workspaceSearchInFlightPromise = this.search(i.filteredUser) : console.warn("Rokt Kit: No filtered user has been set.")) : console.warn("Rokt Kit: No filters have been set."), this.isInitialized = !0, ki(this.domain, this.integrationName), _().Rokt.attachKit(this), this.pushExitIntentExtensionConfig(), this.flushPendingPreselectDispatches();
  }
  // Leaving the hook unset is what keeps History unpatched for workspaces that never
  // preselect. The core SDK reads onCheckoutIntent when it has a signal, so an account without
  // pre-selection entries never hears one.
  armPreselectPathnameTrigger() {
    nt(window.location.pathname), this.onRouteChange = Ae(this.accountId) ? () => this.evaluatePreselectPathname() : void 0, this.armPreselectEmailInputListener(), this.onCheckoutIntent = Ae(this.accountId) ? (e) => {
      try {
        Xr(this._preselectState, this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0, this.onPaymentPick = Ae(this.accountId) ? (e) => {
      try {
        es(this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0;
  }
  // A guest often types their email after the trigger page view has queued for want of one, so a
  // committed email input retries the queue. Only accounts with an entry that reads the form listen.
  armPreselectEmailInputListener() {
    this._preselectEmailInputListener && (document.removeEventListener("input", this._preselectEmailInputListener, !0), document.removeEventListener("change", this._preselectEmailInputListener, !0), this._preselectEmailInputListener = void 0), Ps(this.accountId) && (this._preselectEmailInputListener = (e) => {
      Et(e), e.type === "change" && this._preselectState.pending.length > 0 && bs(this._preselectState, this.buildPreselectHost(), e) && this.flushPendingPreselectDispatches();
    }, document.addEventListener("input", this._preselectEmailInputListener, !0), document.addEventListener("change", this._preselectEmailInputListener, !0));
  }
  // A core released without the check reads false, so its page views are judged by their marker alone.
  isAutoLogPageViewOn() {
    const e = _().Rokt;
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
    const e = _().Rokt;
    try {
      return G(e?.isCheckoutIntentLive) && e.isCheckoutIntentLive() === !0;
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
    if (Ft(this.buildPreselectHost(), e)) return "partner_email";
  }
  // Whether this connection filters out the Email identity, or the identity mapped to the hashed email.
  isEmailIdentityFiltered() {
    const e = this.userIdentityFilters || [];
    if (e.includes(zs))
      return !0;
    const i = this._mappedEmailSha256Key, n = _().IdentityType || {}, r = i ? Object.keys(n).find((o) => o.toLowerCase() === i) : void 0, s = r ? n[r] : void 0;
    return typeof s == "number" && e.includes(s);
  }
  evaluatePreselectPathname() {
    const e = window.location.pathname;
    nt(e), e !== this._lastPreselectPathname && (this.isTargetingDisabled() || (this._lastPreselectPathname = e, cs(this._preselectState, this.buildPreselectHost(), e), mi(this._preselectState, this.buildPreselectHost(), e)));
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
    return Li(e) ? {
      identifier: ao,
      signals: {
        mouseExitTop: !0,
        scrollUpFast: !0,
        idle: !0
      }
    } : null;
  }
  applyExitIntentExtensionOverride(e, i) {
    return e ? i.includes(st) ? i : [...i, st] : i;
  }
  extractExitIntentIdentifier(e) {
    return e ? p(e.identifier) && e.identifier.length > 0 ? e.identifier : p(e.placementIdentifier) && e.placementIdentifier.length > 0 ? e.placementIdentifier : null : null;
  }
  applyIdentityCapturePayload(e, i) {
    const n = {}, r = e.email;
    p(r) && r.length > 0 && (n.email = r);
    const s = e.mobile_number;
    p(s) && s.length > 0 && (n.mobile_number = s);
    const o = _().Identity?.modify;
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
    !this._exitIntentConfig || !G(window.Rokt?.setExtensionData) || window.Rokt.setExtensionData({
      [st]: this._exitIntentConfig
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
    Un(o), o || this.isTargetingDisabled() ? Fn() : (ir(), sr()), this.isPageHistoryAllowed() || (tt(), it());
    const a = e, c = a.accountId;
    this._exitIntentEnabledForAccount = Li(c);
    const l = this._exitIntentEnabledForAccount ? this.getEffectiveExitIntentConfig(c) : null;
    this._exitIntentEnabledForAccount ? this.configureExitIntentBridge(l) : this.configureExitIntentBridge(null), this.accountId = c || null;
    const u = this.accountId ? Mr(this.accountId, a.preselectionConfig) : void 0;
    this.userAttributes = te(s), this.armPreselectPathnameTrigger(), this._onboardingExpProvider = a.onboardingExpProvider;
    const d = Ne(a.placementEventMapping);
    this.placementEventMappingLookup = wi(d);
    const f = Ne(
      a.placementEventAttributeMapping
    );
    this.placementEventAttributeMappingLookup = Si(f), a.hashedEmailUserIdentityType && (this._mappedEmailSha256Key = a.hashedEmailUserIdentityType.toLowerCase()), this._workspaceIdSyncApiKey = p(a.workspaceIdSyncApiKey) ? a.workspaceIdSyncApiKey : void 0;
    const g = _().Rokt?.domain, { roktExtensionsQueryParams: v, legacyRoktExtensions: y, loadThankYouElement: E } = Pi(
      a.roktExtensions
    ), m = this.applyExitIntentExtensionOverride(
      l,
      v
    ), h = {
      ..._().Rokt?.launcherOptions || {}
    };
    this.integrationName = po(h.integrationName), h.integrationName = this.integrationName, this.domain = g;
    const A = {
      loggingUrl: a.loggingUrl,
      errorUrl: a.errorUrl,
      integrationDomain: g,
      isLoggingEnabled: _().config?.isLoggingEnabled === !0
    }, P = new Ci(
      A,
      this.integrationName,
      window.__rokt_li_guid__,
      a.accountId
    ), K = new Di(
      A,
      P,
      this.integrationName,
      window.__rokt_li_guid__,
      a.accountId
    );
    return this.errorReportingService = P, this.loggingService = K, this._flushInitWarnings(), u && K.log({
      message: `Rokt Kit: preselectionConfig setting is invalid [reason=${u}], using the built-in preselection config`,
      code: "PRESELECT_CONFIG_INVALID"
    }), _()._registerErrorReportingService && _()._registerErrorReportingService(P), _()._registerLoggingService && _()._registerLoggingService(K), n ? (this.testHelpers = {
      generateLauncherScript: Ai,
      generateThankYouElementScript: vi,
      extractRoktExtensionConfig: Pi,
      hashEventMessage: Ti,
      parseSettingsString: Ne,
      generateMappedEventLookup: wi,
      generateMappedEventAttributeLookup: Si,
      sendAdBlockMeasurementSignals: ki,
      createAutoRemovedIframe: vt,
      djb2: X,
      setAllowedOriginHashes: (k) => {
        z._allowedOriginHashes = k;
      },
      ReportingTransport: be,
      ErrorReportingService: Ci,
      LoggingService: Di,
      RateLimiter: Cn,
      ErrorCodes: Yt,
      WSDKErrorSeverity: ve,
      resetLauncherAttachState: () => Ys(this._launcherAttachState)
    }, this.attachLauncher(c, h), "Successfully initialized: " + F) : (E && (_().Rokt.flushOnShoppableAdsReadyMessageQueue?.(this), bi(eo, vi(g), {
      onLoad: () => {
        this._isThankYouElementLoaded = !0, this._thankYouElementOnLoadCallback && this._thankYouElementOnLoadCallback();
      },
      onError: (k) => {
        console.error("Error loading Rokt Thank You Element script:", k);
      }
    })), this.isLauncherReadyToAttach() ? this.attachLauncher(c, h, y) : (bi(Zs, Ai(g, m), {
      onLoad: () => {
        this.isLauncherReadyToAttach() ? this.attachLauncher(c, h, y) : console.error("Rokt object is not available after script load.");
      },
      onError: (k) => {
        console.error("Error loading Rokt launcher script:", k);
      }
    }), this.captureTiming(z.PERFORMANCE_MARKS.RoktScriptAppended)), "Successfully initialized: " + F);
  }
  process(e) {
    if (e.EventDataType === yi && nt(window.location.pathname), !this.isTargetingDisabled()) {
      if (e.EventDataType === yi) {
        if (this._exitIntentEnabledForAccount && this._exitIntentWatcher.resetPageViewState(), this.isPageHistoryAllowed()) {
          const i = this.isAutoLogPageViewOn();
          jn(this.loggingService, e.EventAttributes, i), this.capturePageView(e, i);
        } else
          tt(), it();
        ge(this._preselectState, this.buildPreselectHost(), e), mi(this._preselectState, this.buildPreselectHost());
      }
      Ve(e) && Zr(this.buildPreselectHost(), e), ls(this.accountId, e.EventName) && gs(this._preselectState, this.buildPreselectHost(), e);
    }
    if (e.EventDataType === io && (tt(), it(), Ut(this._preselectState), this.accountId && (ie(this.accountId), ti(this.accountId), ri(this.accountId))), !this.isKitReady())
      return "Kit not ready for forwarder: " + F;
    if (G(_().Rokt?.setLocalSessionAttribute) && !Ve(e) && (L(this.placementEventAttributeMappingLookup) || this.applyPlacementEventAttributeMapping(e), !L(this.placementEventMappingLookup))) {
      const i = Ti(e.EventDataType, e.EventCategory, e.EventName ?? "");
      this.placementEventMappingLookup[String(i)] && _().Rokt.setLocalSessionAttribute?.(this.placementEventMappingLookup[String(i)], !0);
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
    Ri(e) || (this.userAttributes[e] = i);
    const n = gi(this.accountId, e);
    return n && this.forgetCartAdd(), (ps(this.accountId, e) || De(e, this._mappedEmailSha256Key) || n) && this.flushPendingPreselectDispatches(), "Successfully set user attribute for forwarder: " + F;
  }
  // The page's cart attribute or a logout replaces a remembered add-to-cart click. Under noTargeting, or for an account
  // that never remembers one, nothing is written to the device.
  forgetCartAdd() {
    this.accountId && wr(this.accountId, !this.isTargetingDisabled() && Os(this.accountId));
  }
  removeUserAttribute(e) {
    return delete this.userAttributes[e], gi(this.accountId, e) && this.forgetCartAdd(), "Successfully removed user attribute for forwarder: " + F;
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
    const n = _().Identity?.search;
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
    return this.userIdentifiedInWorkspace = !1, this._workspaceSearchInFlightPromise = null, this._workspaceLastSearchedIdentitiesKey = void 0, this.accountId && (ie(this.accountId), ti(this.accountId), ri(this.accountId), this.forgetCartAdd()), this.handleIdentityComplete(e, "onLogoutComplete");
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
        new Promise((s) => setTimeout(s, Ii))
      ]) : Promise.resolve();
      return Promise.all([i, r]).then(
        () => this._dispatchPlacements(e)
      );
    }
    if (this._workspaceSearchInFlightPromise) {
      const n = this._workspaceSearchInFlightPromise;
      return Promise.race([
        n,
        new Promise((r) => setTimeout(r, Ii))
      ]).then(() => this._dispatchPlacements(e));
    }
    return this._dispatchPlacements(e);
  }
  // What a pre-selection call with these attributes would send, mirroring _dispatchPlacements: identities,
  // then the cached user attributes merged in, filtered and overridden for the target page, then the
  // session attributes, so a later source wins as it does on the wire.
  getOutgoingPreselectAttributes(e, i) {
    const n = { ...te(this.userAttributes), ...e }, r = this.filters || {}, s = r.filterUserAttributes ? r.filterUserAttributes(n, r.userAttributeFilters || []) : n, o = this.returnUserIdentities(r.filteredUser || null), a = pi(
      this.accountId,
      i ? mt(s, this.buildPreselectAttributeDefaults(i, e)) : s,
      this.findCacheConfigEntry(i)
    );
    return {
      ...o,
      ...a,
      ...this.returnLocalSessionAttributes()
    };
  }
  _dispatchPlacements(e) {
    const i = e ? ws(e) : void 0;
    if (e?.preselect === !0 && !Ht(this.buildPreselectHost())) {
      i?.();
      return;
    }
    const n = e?.[$e], r = e?.[pt], s = { ...e };
    if (delete s[$e], delete s[pt], e = s, r !== void 0) {
      const ee = b(r) ? r : {}, ye = String(ee.mpid ?? ""), qt = ee.requireLogin !== !1, Jt = _().Identity?.getCurrentUser?.();
      if (ye === "" || String(this.filters?.filteredUser?.getMPID?.() ?? "") !== ye || String(Jt?.getMPID?.() ?? "") !== ye || qt && Jt?.isLoggedIn?.() !== !0) {
        this.loggingService?.logPlacementDiagnostic(
          w("missed", qt ? "logged_in_dropped" : "user_changed_dropped")
        ), i?.();
        return;
      }
    }
    const o = b(n) ? n : void 0, a = o && p(o.key) ? o.key : void 0;
    if (a) {
      const ee = this.getFormEmailDropCause(a, o.mpid);
      if (ee) {
        this.loggingService?.logPlacementDiagnostic(
          w("missed", "form_email_dropped", { cause: ee })
        ), i?.();
        return;
      }
    }
    const c = e.attributes || {}, l = te(this.userAttributes), u = { ...l, ...c }, d = this.filters || {}, f = d.userAttributeFilters || [], g = d.filteredUser || null, v = g ? g.getMPID() : null;
    let y;
    d ? d.filterUserAttributes ? y = d.filterUserAttributes(u, f) : y = u : (console.warn("Rokt Kit: No filters available, using user attributes"), y = u);
    const E = te(y);
    a && (Object.prototype.hasOwnProperty.call(l, a) ? E[a] = l[a] : delete E[a]), this.userAttributes = E;
    const m = this._onboardingExpProvider === "Optimizely" ? this.fetchOptimizely() : {}, h = this.returnUserIdentities(g), A = this.returnLocalSessionAttributes(), P = this.isPageHistoryAllowed(), K = P ? $n(ei()) : [], k = P ? Hn() : null, j = this.readMpSessionId(), D = this.readMpDeviceId(), H = typeof e.identifier == "string" ? e.identifier : void 0, Z = this.findCacheConfigEntry(H), _e = e.preselect === !0 ? this.buildPreselectAttributeDefaults(H, c) : void 0, Y = e.preselect === !0 ? pi(
      this.accountId,
      mt(y, _e),
      Z
    ) : y, B = {
      ...h,
      ...Y,
      ...m,
      ...A,
      ...K.length ? { [no]: JSON.stringify(K) } : {},
      ...k ? { [ro]: k } : {},
      ...this.userIdentifiedInWorkspace ? { [to]: !0 } : {},
      ...j ? { [so]: j } : {},
      ...D ? { [Ei]: D } : {},
      mpid: v
    };
    this.isDeviceIdDisabled() && delete B[Ei], e.preselect !== !0 && Us(this.buildPreselectHost(), H, B);
    const et = Y[ln];
    if (e.preselect === !0 && p(et) && (et.indexOf("intent_") === 0 || et.indexOf("pageview_cart|") === 0) && !Ke(B, this._mappedEmailSha256Key)) {
      this.loggingService?.logPlacementDiagnostic(
        w("missed", "no_strict_email", { cause: "lost_before_dispatch" })
      ), i?.();
      return;
    }
    const Bt = as(
      Z,
      _e,
      B
    );
    delete B[si];
    const Gt = gn(_e, B);
    Gt && (B[si] = Gt);
    const Dn = {
      ...e,
      attributes: B,
      ...Z ? { cacheMatchKeys: pn(Z) } : {},
      ...Bt ? { cacheIdentityKeys: Bt } : {}
    }, zt = this.launcher.selectPlacements(Dn), Xt = e.preselect === !0, Rn = () => {
      Xt || this.logSelectPlacementsEvent(B);
    };
    return Promise.resolve(zt).then((ee) => {
      if (!Xt)
        return ee?.context?.sessionId?.then((ye) => this.setRoktSessionId(ye));
    }).catch(() => {
    }).finally(Rn), zt;
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
    return this.isKitReady() ? (Hs(this._launcherAttachState), this.launcher.terminate()) : (console.error("Rokt Kit: Not initialized"), Promise.resolve());
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
let pe = z;
function Eo() {
  return Ue;
}
function Io(t) {
  if (!t) {
    window.console.log("You must pass a config object to register the kit " + F);
    return;
  }
  if (!b(t)) {
    window.console.log("'config' must be an object. You passed in a " + typeof t);
    return;
  }
  b(t.kits) ? t.kits[F] = {
    constructor: pe
  } : (t.kits = {}, t.kits[F] = {
    constructor: pe
  }), window.console.log("Successfully registered " + F + " to your mParticle configuration");
}
typeof window < "u" && window.mParticle && _().addForwarder && _().addForwarder({
  name: F,
  constructor: pe,
  getId: Eo
});
export {
  Io as register
};
//# sourceMappingURL=Rokt-Kit.esm.js.map
