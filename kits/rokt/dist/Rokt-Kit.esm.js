const Lr = [
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
], kr = new Set(Lr);
function Ht(t) {
  return kr.has(t.toLowerCase());
}
function le(t) {
  const e = {}, i = t || {}, n = Object.keys(i);
  for (let r = 0; r < n.length; r++) {
    const s = n[r];
    Ht(s) || (e[s] = i[s]);
  }
  return e;
}
function E(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function f(t) {
  return typeof t == "string";
}
function W(t) {
  return typeof t == "function";
}
function ln(t) {
  try {
    return JSON.parse(t.replace(/&quot;/g, '"'));
  } catch {
    return;
  }
}
function R(t) {
  return t == null ? !0 : typeof t == "string" ? t.length === 0 : typeof t == "object" ? Object.keys(t).length === 0 : !1;
}
function L(t, e) {
  return Object.prototype.hasOwnProperty.call(t, e) ? t[e] : void 0;
}
function Be(t) {
  const e = un(), i = e ? e(t, "full") : t, n = i.indexOf("#"), r = n === -1 ? "" : i.slice(n);
  return (n === -1 ? i : i.slice(0, n)).split("?")[0] + r.split("?")[0];
}
function Wt(t) {
  const e = un();
  return e ? e(t, "report") : t.split(/[?#]/)[0];
}
function un() {
  const t = window.mParticle;
  return t && typeof t._cleanUrl == "function" ? t._cleanUrl : void 0;
}
function re(t) {
  let e = 5381;
  for (let i = 0; i < t.length; i++)
    e = (e << 5) + e + t.charCodeAt(i), e = e & e;
  return e;
}
const P = "mp-rokt-kit", bi = "__rokt_ls_probe__";
function wi() {
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
let ye = null;
function Ci(t) {
  t ? ye || (ye = { local: wi(), session: wi() }) : ye = null;
}
function Rr() {
  return ye !== null;
}
const oe = () => ye?.local ?? window.localStorage, K = () => ye?.session ?? window.sessionStorage;
function wt() {
  try {
    const t = oe();
    return t.setItem(bi, "1"), t.removeItem(bi), !0;
  } catch {
    return !1;
  }
}
function rt(t, e = oe) {
  try {
    const i = e().getItem(t);
    return i === null ? null : JSON.parse(i);
  } catch {
    return null;
  }
}
function dn(t, e, i = oe) {
  try {
    return i().setItem(t, JSON.stringify(e)), !0;
  } catch {
    return !1;
  }
}
function Ct(t, e = oe) {
  try {
    e().removeItem(t);
  } catch {
  }
}
function Ti() {
  Ct(P, () => window.localStorage), Ct(P, () => window.sessionStorage);
}
function Y(t, e, i = oe) {
  const n = rt(t, i);
  return E(n) ? n[e] : void 0;
}
function J(t, e, i, n = oe) {
  const r = rt(t, n), s = E(r) ? { ...r } : {};
  return s[e] = i, dn(t, s, n);
}
function fn(t, e, i) {
  Object.keys(e).length === 0 ? Ct(t, i) : dn(t, e, i);
}
function ae(t, e, i = oe) {
  const n = rt(t, i);
  if (!E(n) || !(e in n))
    return;
  const r = { ...n };
  delete r[e], fn(t, r, i);
}
function _e(t, e, i = oe) {
  const n = rt(t, i);
  if (!E(n))
    return;
  const r = Object.keys(n).filter((o) => o.startsWith(e));
  if (r.length === 0)
    return;
  const s = { ...n };
  r.forEach((o) => delete s[o]), fn(t, s, i);
}
const Gt = "pageViews", ze = "utmParams", gn = 25, Or = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
function hn(t) {
  return t.slice(-gn);
}
function Si() {
  const t = Y(P, Gt);
  return Array.isArray(t) ? t.filter(E).map(Dr) : [];
}
function Dr(t) {
  return {
    ...t,
    ...f(t.pageUrl) ? { pageUrl: Be(t.pageUrl) } : {},
    ...f(t.canonicalUrl) ? { canonicalUrl: Be(t.canonicalUrl) } : {}
  };
}
function Nr(t) {
  const e = hn(t);
  for (let i = 0; i < e.length; i++) {
    const n = e.slice(i);
    if (J(P, Gt, n))
      return n.length;
  }
  return 0;
}
function je() {
  ae(P, Gt);
}
function Fr(t) {
  const e = hn(t);
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
function pn(t, e = !1) {
  return e || !!t && t.is_auto_page_view === !0;
}
function Ur(t, e, i = !1) {
  if (Y(P, ze) !== void 0)
    return;
  const n = pn(e, i), r = new URLSearchParams(window.location.search), s = {};
  for (const a of Or) {
    const c = n ? (e || {})[a] : r.get(a);
    f(c) && c && (s[a] = c);
  }
  if (Object.keys(s).length === 0)
    return;
  const o = Object.keys(s).join(", ");
  if (!J(P, ze, s)) {
    const a = wt() ? "quota" : "ls_unavailable";
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
function Kr() {
  const t = Y(P, ze);
  return E(t) ? t : null;
}
function $e() {
  ae(P, ze);
}
function Mr() {
  const e = document.querySelector('link[rel="canonical"]')?.href;
  if (e)
    return Be(e);
}
const xr = 6e4, Yt = "activePreselect:";
function Vr(t) {
  return E(t) && typeof t.expiresAt == "number" && typeof t.attributesDigest == "number";
}
function jr(t, e) {
  return `${Yt}${t}:${e}`;
}
function ve(t) {
  const e = Y(P, t, K);
  return Vr(e) && e.expiresAt > Date.now() ? e : null;
}
function $r(t, e, i = !1) {
  J(
    P,
    t,
    { expiresAt: Date.now() + xr, attributesDigest: e, ...i ? { byEvent: !0 } : {} },
    K
  );
}
function Hr(t, e, i) {
  const n = ve(t);
  n && n.attributesDigest !== i || (e && e.expiresAt > Date.now() ? J(P, t, e, K) : ae(P, t, K));
}
function Li(t) {
  _e(
    P,
    `${Yt}${t}:`,
    K
  );
}
function Wr() {
  _e(P, Yt);
}
const Gr = 5 * 6e4, mn = "pendingPreselect:";
function Yr(t) {
  return E(t) && typeof t.expiresAt == "number" && f(t.pathname) && f(t.identifier) && E(t.attributes) && f(t.mpid);
}
function Bt(t) {
  return `${mn}${t}`;
}
function zt(t) {
  const e = Bt(t), i = Y(P, e, K);
  return Yr(i) ? i.expiresAt <= Date.now() ? (ae(P, e, K), null) : i : null;
}
function ki(t, e, i, n, r, s = !1) {
  return J(
    P,
    Bt(t),
    {
      expiresAt: Date.now() + Gr,
      pathname: e,
      identifier: i,
      attributes: n,
      mpid: r,
      ...s ? { byEvent: !0 } : {}
    },
    K
  );
}
function ue(t) {
  ae(P, Bt(t), K);
}
function Br() {
  _e(P, mn);
}
const Tt = {
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
}, zr = /\b(?:gift cards?|store credit|rewards?|points?|balance|vouchers?|promo codes?|coupons?)\b/g, Xr = 12;
function qr(t) {
  return t.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/[^a-z]+/g, " ").trim();
}
function De(t) {
  if (typeof t != "string" || t.length > 128)
    return;
  const e = qr(t).replace(zr, " ").replace(/\s+/g, " ").trim();
  if (!e || e.split(" ").length > Xr)
    return;
  const i = Object.keys(Tt).filter((r) => Tt[r].test(e)), n = i.filter((r) => r !== "card");
  return n.length === 1 ? n[0] : n.length === 0 && i.length === 1 ? i[0] : void 0;
}
function st(t) {
  return typeof t == "string" && Object.prototype.hasOwnProperty.call(Tt, t);
}
const Jr = "radio", Qr = ["button", "role", "wallet"], Zr = ["label", "aria_label", "test_id", "element_id", "element_name"], es = ["label", "aria_label"];
function ts(t) {
  return !!t.label && t.label_source !== "heading" || !!t.aria_label;
}
function is(t) {
  if (!t)
    return;
  const e = String(t.checked), i = t.type === Jr;
  if (e === "false" || i && e !== "true" || t.type === "checkbox" || t.element === "link" || !i && t.type === void 0 && !Qr.includes(String(t.element)))
    return;
  const n = !i && ts(t) ? es : Zr;
  for (const r of n) {
    const s = De(t[r]);
    if (s && (i || s !== "card"))
      return s;
  }
}
function ns(t) {
  if (st(t.family))
    return t.family;
  for (const e of Array.isArray(t.names) ? t.names : []) {
    const i = De(e);
    if (i)
      return i;
  }
}
const rs = ["paymenttype", "payment_type", "paymentmethod", "payment_method"];
function ss(t) {
  const e = t ? Object.keys(t).find((n) => rs.includes(n.toLowerCase())) : void 0, i = e ? t[e] : void 0;
  return typeof i != "string" || !i.trim() ? "absent" : De(i) ?? "other";
}
const yn = "preselectArrival:", _n = "preselectTriggerAnyTab:", ot = "preselectCartAdd:", vn = "preselectTargetPath:", En = "preselectCartArrival:", os = 30 * 6e4, Xe = 30 * 6e4, as = 10080 * 6e4, cs = 10080 * 6e4, St = ["commit", "wallet", "frame", "checkout_step", "cart"], ls = [
  "triggeredAt",
  "identitySeenAt",
  "firedAt",
  "firedDigest",
  "arrivedAt",
  "nearMissAt",
  "paymentPickAt"
], us = ["paymentPick", "paymentAtFire"];
function B(t, e) {
  return `${yn}${t}:${e}`;
}
function In(t, e) {
  return `${_n}${t}:${e}`;
}
function Ne(t) {
  const e = Y(P, t, K), i = {};
  if (!E(e))
    return i;
  for (const n of ls)
    typeof e[n] == "number" && (i[n] = e[n]);
  typeof e.intentAt == "number" && St.includes(e.intentKind) && (i.intentAt = e.intentAt, i.intentKind = e.intentKind);
  for (const n of us)
    st(e[n]) && (i[n] = e[n]);
  return i.firedAt !== void 0 && e.firedByCart === !0 && (i.firedByCart = !0), i;
}
function fe(t, e) {
  return J(P, t, e, K);
}
function ce(t) {
  const e = Ne(t);
  return e.arrivedAt === void 0 ? e : e.paymentPick !== void 0 && e.paymentPickAt !== void 0 && e.paymentPickAt > e.arrivedAt ? { paymentPick: e.paymentPick, paymentPickAt: e.paymentPickAt } : {};
}
function ds(t, e, i) {
  const n = B(t, e), r = ce(n), s = Date.now();
  fe(n, {
    ...r,
    triggeredAt: r.triggeredAt ?? s,
    ...i ? { identitySeenAt: r.identitySeenAt ?? s } : {}
  }), J(P, In(t, e), {
    triggeredAt: s
  });
}
function fs(t, e) {
  const i = Y(P, In(t, e));
  return !E(i) || typeof i.triggeredAt != "number" ? !1 : q(i.triggeredAt, os);
}
function gs(t, e, i) {
  const n = `${ot}${t}`, r = Y(P, n), s = E(r) ? r.addedAt ?? r.forgottenAt : void 0;
  typeof s == "number" && e <= s || J(P, n, { addedAt: e, mpid: i });
}
function hs(t, e) {
  const i = `${ot}${t}`, n = Y(P, i);
  if (!E(n))
    return !1;
  const r = typeof n.addedAt == "number" ? n.addedAt : void 0, s = r ?? n.forgottenAt;
  return typeof s != "number" ? !1 : q(s, as) ? r !== void 0 && e !== null && n.mpid === e : (ae(P, i), !1);
}
function ps(t, e) {
  const i = `${ot}${t}`;
  e ? J(P, i, { forgottenAt: Date.now() }) : ae(P, i);
}
function ms(t, e) {
  const i = B(t, e), n = Ne(i);
  n.arrivedAt !== void 0 || n.nearMissAt !== void 0 || fe(i, { ...n, nearMissAt: Date.now() });
}
function ys(t, e, i, n = !1, r) {
  const s = B(t, e), o = ce(s), a = o.firedAt !== void 0 && q(o.firedAt) ? {
    firedAt: o.firedAt,
    ...o.firedDigest !== void 0 ? { firedDigest: o.firedDigest } : {},
    ...o.firedByCart ? { firedByCart: !0 } : {},
    ...o.paymentAtFire !== void 0 ? { paymentAtFire: o.paymentAtFire } : {}
  } : void 0, c = r !== void 0 ? r ?? void 0 : o.paymentPick !== void 0 && o.paymentPickAt !== void 0 && q(o.paymentPickAt) ? o.paymentPick : void 0;
  return fe(
    s,
    Pn(o, {
      firedAt: a && !(a.firedByCart && !n) ? a.firedAt : Date.now(),
      firedDigest: i,
      ...n ? { firedByCart: !0 } : {},
      paymentAtFire: c
    })
  ), a;
}
function _s(t, e, i, n) {
  const r = B(t, e), s = ce(r);
  s.firedAt === void 0 || s.firedDigest !== n || fe(r, Pn(s, i));
}
function Pn(t, e) {
  const i = { ...t };
  return delete i.firedAt, delete i.firedDigest, delete i.firedByCart, delete i.paymentAtFire, e ? {
    ...i,
    firedAt: e.firedAt,
    ...e.firedDigest !== void 0 ? { firedDigest: e.firedDigest } : {},
    ...e.firedByCart ? { firedByCart: !0 } : {},
    ...e.paymentAtFire !== void 0 ? { paymentAtFire: e.paymentAtFire } : {}
  } : i;
}
function vs(t, e) {
  const i = ce(B(t, e));
  return i.triggeredAt === void 0 ? !1 : q(i.triggeredAt);
}
function Lt(t, e, i, n = !1) {
  const r = ce(B(t, e));
  return r.firedAt === void 0 || n && r.firedByCart || i !== void 0 && r.firedDigest !== void 0 && r.firedDigest !== i ? !1 : q(r.firedAt);
}
function Es(t, e, i, n) {
  const r = B(t, e), s = ce(r);
  if (s.intentAt !== void 0 && s.intentKind !== void 0 && q(s.intentAt)) {
    const o = St.indexOf(s.intentKind), a = St.indexOf(i);
    if (o < a || o === a && s.intentAt >= n)
      return;
  }
  fe(r, { ...s, intentAt: n, intentKind: i });
}
function q(t, e = Xe) {
  const i = Date.now() - t;
  return i >= 0 && i < e;
}
function Is(t, e, i, n) {
  const r = B(t, e), s = Ne(r);
  s.arrivedAt !== void 0 && n <= s.arrivedAt || s.paymentPickAt !== void 0 && s.paymentPickAt > n || fe(r, { ...s, paymentPick: i, paymentPickAt: n });
}
function Ps(t, e) {
  const i = ce(B(t, e));
  return i.firedAt !== void 0 && q(i.firedAt) ? i.paymentAtFire : void 0;
}
function Ri(t, e, i) {
  const n = ce(B(t, e));
  return n.paymentPick !== void 0 && n.paymentPickAt !== void 0 && q(n.paymentPickAt) && (i === void 0 || n.paymentPickAt >= i) ? n.paymentPick : void 0;
}
function As(t, e) {
  const i = B(t, e), n = Ne(i);
  if (n.arrivedAt !== void 0)
    return;
  const r = { ...n, arrivedAt: Date.now() };
  if (delete r.paymentPick, delete r.paymentPickAt, !!fe(i, r))
    return n;
}
function An(t, e) {
  return `${En}${t}:${e}`;
}
function bs(t, e, i, n) {
  const r = An(t, e);
  if (i === void 0 || n === null) {
    ae(P, r, K);
    return;
  }
  J(
    P,
    r,
    { arrivedAt: Date.now(), cartDigest: i, mpid: n },
    K
  );
}
function ws(t, e, i, n) {
  const r = Y(
    P,
    An(t, e),
    K
  );
  if (!E(r) || typeof r.arrivedAt != "number" || r.cartDigest !== i || n === null || r.mpid !== n)
    return !1;
  const { firedAt: s } = Ne(B(t, e)), o = Y(P, `${ot}${t}`), a = E(o) && typeof o.addedAt == "number" && o.mpid === n ? o.addedAt : void 0;
  return q(r.arrivedAt) && !(s !== void 0 && s >= r.arrivedAt) && !(a !== void 0 && a >= r.arrivedAt);
}
function Cs(t, e, i) {
  J(P, `${vn}${t}:${e}`, {
    pathDigest: i,
    learnedAt: Date.now()
  });
}
function Ts(t, e, i) {
  const n = Y(
    P,
    `${vn}${t}:${e}`
  );
  return !E(n) || n.pathDigest !== i || typeof n.learnedAt != "number" ? !1 : q(n.learnedAt, cs);
}
function Oi(t) {
  _e(
    P,
    `${yn}${t}:`,
    K
  ), _e(
    P,
    `${En}${t}:`,
    K
  ), _e(P, `${_n}${t}:`);
}
function Xt(t, e, i = {}) {
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
function at(t) {
  return t === void 0 ? {} : { since_trigger_ms: Date.now() - t };
}
const bn = /^[^\s@]+@[^\s@]+\.(?:[a-zA-Z]{2,}|xn--[a-zA-Z0-9-]+|[^\s@.\x00-\x7F]{2,})$/, wn = 254;
function qe(t) {
  return t.length <= wn && bn.test(t);
}
const ne = /* @__PURE__ */ new WeakSet(), Te = /* @__PURE__ */ new WeakSet(), me = /* @__PURE__ */ new WeakSet(), Se = /* @__PURE__ */ new WeakSet(), kt = /* @__PURE__ */ new WeakSet(), Di = /* @__PURE__ */ new WeakSet();
function Je(t) {
  if (!(t instanceof HTMLInputElement)) return !1;
  const e = t.type;
  return e === "text" || e === "email" || t.getAttribute("autocomplete") === "email" && e !== "hidden" && e !== "password";
}
function Rt(t) {
  const e = t.target;
  if (!(e instanceof HTMLInputElement)) return;
  if (t.type === "blur" || t.type === "focusout") {
    if (t.isTrusted !== !0) return;
    !Je(e) || !Te.has(e) ? (ne.delete(e), me.delete(e)) : ne.has(e) || Se.add(e);
    return;
  }
  const i = !Di.has(t);
  if (Di.add(t), t.isTrusted !== !0) {
    kt.add(e), ne.delete(e), Te.delete(e), me.delete(e), Se.delete(e);
    return;
  }
  if (i && kt.delete(e), !Je(e)) {
    ne.delete(e), Te.delete(e), me.delete(e), Se.delete(e);
    return;
  }
  i && (me.add(e), Se.delete(e), e.addEventListener("input", Rt, !0), e.addEventListener("change", Rt, !0), t.type === "change" ? (ne.add(e), Te.add(e)) : ne.delete(e));
}
function Ss(t) {
  return Je(t) && (t.type === "email" || t.getAttribute("autocomplete") === "email" || qe(t.value.trim()));
}
function Cn(t) {
  return !qe(t.trim());
}
function Ls(t) {
  return t.type === "email" || t.getAttribute("autocomplete") === "email" || t.value.includes("@");
}
function ks(t) {
  return Ls(t) || Te.has(t) && !ne.has(t) && !(Se.has(t) && t !== document.activeElement);
}
function Tn(t) {
  const e = /* @__PURE__ */ new Map(), i = [];
  let n = 0, r = !1;
  document.querySelectorAll("input").forEach((a) => {
    if (!Je(a)) return;
    const c = ne.has(a), l = me.has(a);
    if (!c) {
      l && ks(a) && (n += 1), t && i.push(a);
      return;
    }
    const u = a.value.trim();
    qe(u) ? e.has(u.toLowerCase()) || e.set(u.toLowerCase(), u) : u.length > wn && bn.test(u) && (r = !0);
  });
  const s = e.size > 0 && (n > 0 || r);
  let o;
  return t && !s && e.size === 0 && i.forEach((a) => {
    const c = a.value.trim();
    qe(c) && (kt.has(a) ? o = "untrusted_fill" : o !== "untrusted_fill" && (me.has(a) || a === document.activeElement ? o = "uncommitted_fill" : o !== "uncommitted_fill" && (o = "unseen_fill")));
  }), { emails: e, ambiguous: s, unfilled: o };
}
function Rs() {
  const { emails: t, ambiguous: e } = Tn(!1);
  return t.size === 1 && !e ? t.values().next().value : void 0;
}
function qt(t) {
  const e = D(t.filteredUser), i = t.getCurrentUser();
  return e !== null && D(i) === e && i?.isLoggedIn?.() === !0;
}
function Oe(t) {
  if (!t?.getUserIdentities)
    return [];
  const e = t.getUserIdentities().userIdentities;
  return e ? Object.keys(e).filter((i) => {
    const n = e[i];
    return f(n) && n.length > 0;
  }).sort() : [];
}
function V(t) {
  return Oe(t).length > 0;
}
function Qe(t) {
  return t.length > 0 ? t.join(",") : "none";
}
function D(t) {
  const e = t?.getMPID?.();
  return e == null ? null : String(e);
}
function Jt(t) {
  return !t.isTargetingDisabled() && t.isPreselectionPrivacyAllowed() && t.isForwardingAllowed();
}
function Qt(t) {
  return !t.isTargetingDisabled() && t.isPreselectionPrivacyAllowed() && t.isKitReady() && t.isPreselectionEnabled();
}
function Zt(t) {
  return t.isCheckoutIntentActive() && t.isPreselectionPrivacyAllowed();
}
function ct(t) {
  return Zt(t) && !t.isLinkIntentWithheld();
}
function O(t, e, i, n) {
  t.logPlacementDiagnostic(Xt(e, i, n));
}
const Sn = "skip", Os = [], Ds = 8, Ns = /^[\w$-]{1,64}$/, Fs = ["__proto__", "constructor", "prototype"];
function Ln(t) {
  if (!f(t))
    return !1;
  const e = t.split(".");
  return e.length <= Ds && e.every((i) => Ns.test(i) && !Fs.includes(i));
}
function Us(t) {
  if (Ln(t))
    try {
      let e = window;
      for (const i of t.split(".")) {
        if (typeof e != "object" || e === null)
          return;
        const n = Object.getOwnPropertyDescriptor(e, i);
        if (!n || !("value" in n))
          return;
        e = n.value;
      }
      return f(e) ? e : typeof e == "number" && Number.isFinite(e) ? String(e) : void 0;
    } catch {
      return;
    }
}
function Ks({ path: t, values: e }) {
  const i = Us(t);
  return i === void 0 ? void 0 : L(e, i.trim().toLowerCase());
}
const Ms = 1, xs = 6e4;
function N(t) {
  return Array.isArray(t) && t.every(f);
}
function te(t) {
  return f(t) && t !== "";
}
const kn = ["DesktopWeb", "MobileWeb"], Vs = 50;
function js(t, e) {
  if (!Array.isArray(t) || t.length === 0 || !t.every((r) => N(r) && r.length >= 2 && r.every(te)))
    return !1;
  const i = t.flat();
  if (i.length > Vs || new Set(i).size !== i.length)
    return !1;
  const n = N(e) ? e.map((r) => r.toLowerCase()) : [];
  return !i.some((r) => n.includes(r.toLowerCase()));
}
const $s = 10, Hs = 256, Ws = ["commit", "checkoutStep"];
function Gs(t) {
  if (!E(t))
    return !1;
  const e = Ws.filter((i) => t[i] !== void 0);
  return e.length > 0 && e.every((i) => {
    const n = t[i];
    return N(n) && n.length > 0 && n.length <= $s && n.every((r) => r.trim() !== "" && r.length <= Hs);
  });
}
function Ys(t) {
  return E(t) && Ln(t.path) && E(t.values) && Object.keys(t.values).length > 0 && Object.entries(t.values).every(
    ([e, i]) => e !== "" && e === e.trim().toLowerCase() && te(i)
  );
}
function Bs(t) {
  if (te(t))
    return !0;
  if (!E(t))
    return !1;
  const { byClientType: e, byHostname: i, byPaymentPick: n, skipRemembered: r, skipValues: s, matchGroups: o, matchPaymentFamily: a } = t, { byPageValue: c } = t;
  if (t.value !== void 0 && !te(t.value) || c !== void 0 && !Ys(c) || e !== void 0 && (!E(e) || !Object.entries(e).every(
    ([l, u]) => kn.includes(l) && te(u)
  )) || i !== void 0 && (!E(i) || !Object.entries(i).every(
    ([l, u]) => l !== "" && l === l.toLowerCase() && te(u)
  )) || n !== void 0 && (!E(n) || Object.keys(n).length === 0 || !Object.entries(n).every(
    ([l, u]) => st(l) && te(u)
  )) || r !== void 0 && typeof r != "boolean" || a !== void 0 && typeof a != "boolean" || s !== void 0 && (!N(s) || s.length === 0 || !s.every(te)))
    return !1;
  if (N(s)) {
    const l = s.map((d) => d.toLowerCase());
    if ([
      t.value,
      ...Object.values(e ?? {}).filter((d) => d !== Sn),
      ...Object.values(i ?? {}),
      ...Object.values(n ?? {}),
      ...Object.values(c?.values ?? {})
    ].some((d) => f(d) && l.includes(d.toLowerCase())))
      return !1;
  }
  return o !== void 0 && !js(o, s) ? !1 : t.value !== void 0 || e !== void 0 || i !== void 0 || n !== void 0;
}
function Rn(t) {
  return te(t) && !/\s/.test(t) && !Array.from(t).some(
    (e) => e.charCodeAt(0) < 32 || e.charCodeAt(0) >= 127 && e.charCodeAt(0) <= 159
  );
}
function zs(t, e) {
  return E(t) && Object.keys(t).length > 0 && Object.entries(t).every(([i, n]) => e(i) && Rn(n));
}
function Xs(t) {
  if (!E(t))
    return !1;
  const { byPaymentPick: e, byHostname: i, byClientType: n } = t, s = [
    [e, st],
    [i, (o) => o !== "" && o === o.toLowerCase()],
    [n, (o) => kn.includes(o)]
  ].filter(([o]) => o !== void 0);
  return s.length > 0 && s.every(([o, a]) => zs(o, a));
}
function Ot(t) {
  const e = t.alternateTargetPageIdentifiers;
  return [
    t.targetPageIdentifier,
    ...Object.values(e?.byPaymentPick ?? {}),
    ...Object.values(e?.byHostname ?? {}),
    ...Object.values(e?.byClientType ?? {})
  ];
}
function qs(t, e) {
  if (!E(e))
    return "not an object";
  const { pathname: i, pathnames: n, targetPageIdentifier: r, attributeKeys: s, optionalAttributeKeys: o, identityKeys: a, dispatchDelayMs: c } = e, { triggerEventNames: l, releaseHoldOnRouteChange: u, readEmailInput: d, cartIntent: h, cartUserAttribute: v } = e, { checkoutStepIntent: g, intentSelectors: m, hosts: T } = e, A = e.preselectAttributeOverrides, C = e.preselectAttributeDefaults !== void 0 ? e.preselectAttributeDefaults : A, _ = e.widenedOptionalAttributeKeys, { targetPageIdentifierAttribute: k } = e, b = e.alternateTargetPageIdentifiers;
  if (e.accountId !== void 0 && e.accountId !== t)
    return "accountId";
  if (!f(i) || !i.startsWith("/"))
    return "pathname";
  if (n !== void 0 && (!N(n) || n.length === 0 || !n.every((w) => w.startsWith("/"))))
    return "pathnames";
  if (!f(r) || r === "")
    return "targetPageIdentifier";
  if (k !== void 0 && (!f(k) || k.trim() === "" || Ht(k.trim())))
    return "targetPageIdentifierAttribute";
  if (b !== void 0 && (k !== void 0 || !Xs(b)))
    return "alternateTargetPageIdentifiers";
  if (!N(s) || s.length === 0)
    return "attributeKeys";
  if (o !== void 0 && (!N(o) || !o.every((w) => s.includes(w))))
    return "optionalAttributeKeys";
  if (_ !== void 0 && (!N(_) || !_.every((w) => s.includes(w))))
    return "widenedOptionalAttributeKeys";
  if (a !== void 0 && (!N(a) || a.length === 0 || !a.every((w) => s.includes(w))))
    return "identityKeys";
  if (N(_) && _.length > 0) {
    const w = (N(o) ? o : []).concat(_).map((H) => H.toLowerCase());
    if (!N(a) || a.some((H) => w.includes(H.toLowerCase())))
      return "identityKeys";
  }
  if (c !== void 0 && (!Number.isInteger(c) || c < 0 || c > xs))
    return "dispatchDelayMs";
  if (u !== void 0 && typeof u != "boolean")
    return "releaseHoldOnRouteChange";
  if (g !== void 0 && typeof g != "boolean")
    return "checkoutStepIntent";
  if (h !== void 0 && typeof h != "boolean")
    return "cartIntent";
  if (m !== void 0 && !Gs(m))
    return "intentSelectors";
  if (T !== void 0 && (!N(T) || T.length === 0 || !T.every((w) => w !== "" && w === w.toLowerCase())))
    return "hosts";
  if (d !== void 0 && (typeof d != "boolean" || !s.includes("email") || N(o) && o.includes("email") || // The runtime matches optional keys in any casing, so an 'Email' key would make email optional too.
  N(_) && _.some((w) => w.toLowerCase() === "email") || // A default makes its key optional too, and would send a guessed email as the shopper's.
  E(C) && Object.keys(C).some((w) => w.toLowerCase() === "email")))
    return "readEmailInput";
  if (e.preselectAttributeDefaults !== void 0 && A !== void 0)
    return "preselectAttributeDefaults";
  let y;
  if (C !== void 0) {
    const w = e.preselectAttributeDefaults !== void 0 ? "preselectAttributeDefaults" : "preselectAttributeOverrides";
    if (!E(C))
      return w;
    const H = (N(a) ? a : []).map((U) => U.toLowerCase()), Z = ([U, x]) => Bs(x) && s.includes(U) && !["email", "emailsha256"].includes(U.toLowerCase()) && !H.includes(U.toLowerCase()), z = ([U, x]) => A !== void 0 && f(x) && s.includes(U) && !(N(a) && a.includes(U)), Q = Object.entries(C);
    if (!Q.every((U) => Z(U) || z(U)))
      return w;
    y = Object.fromEntries(Q.filter(Z));
  }
  if (l !== void 0 && (!N(l) || l.length === 0 || l.some((w) => w === "")))
    return "triggerEventNames";
  const I = { accountId: t, pathname: i, targetPageIdentifier: r, attributeKeys: s }, F = (w, H, Z) => Z.forEach((z) => {
    w[z] !== void 0 && (H[z] = w[z]);
  });
  return F(e, I, ["pathnames"]), k !== void 0 && (I.targetPageIdentifierAttribute = k.trim()), b !== void 0 && (I.alternateTargetPageIdentifiers = {}, F(b, I.alternateTargetPageIdentifiers, [
    "byPaymentPick",
    "byHostname",
    "byClientType"
  ])), F(e, I, [
    "optionalAttributeKeys",
    "widenedOptionalAttributeKeys",
    "identityKeys",
    "dispatchDelayMs",
    "releaseHoldOnRouteChange",
    "checkoutStepIntent",
    "intentSelectors",
    "hosts",
    "readEmailInput"
  ]), y !== void 0 && (I.preselectAttributeDefaults = y), F(e, I, ["triggerEventNames", "cartIntent"]), h === !0 && f(v) && v !== "" && (I.cartUserAttribute = v), I;
}
function Js(t, e) {
  const i = ln(e);
  if (i === void 0)
    return { error: "invalid JSON" };
  if (!E(i))
    return { error: "not an object" };
  if (i.schemaVersion !== Ms)
    return { error: "schemaVersion" };
  if (!Array.isArray(i.entries))
    return { error: "entries" };
  const n = [];
  for (let r = 0; r < i.entries.length; r++) {
    const s = qs(t, i.entries[r]);
    if (f(s))
      return { error: `entry ${r + 1} ${s}` };
    const o = Ot(s);
    if (n.some((a) => Ot(a).some((c) => o.includes(c))))
      return { error: `entry ${r + 1} targetPageIdentifier` };
    n.push(s);
  }
  return { entries: n };
}
const Dt = /* @__PURE__ */ new Map();
function Qs(t, e) {
  if (Dt.delete(t), !e)
    return;
  const i = Js(t, e);
  if ("error" in i)
    return i.error;
  Dt.set(t, i.entries);
}
function j(t) {
  return Dt.get(t) ?? Os.filter((e) => e.accountId === t);
}
function On(t) {
  return t.pathnames ? [t.pathname, ...t.pathnames] : [t.pathname];
}
function Dn(t, e) {
  return On(t).find((i) => We(i, e));
}
function Nn(t, e) {
  return Dn(t, e) !== void 0;
}
function We(t, e) {
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
function Zs(t, e) {
  const i = S(t).toLowerCase(), n = S(e).toLowerCase().split("/"), r = i.split("/").length;
  return We(i, n.join("/")) || We(i, ["", ...n.slice(2)].join("/")) || n.length > r && We(i, n.slice(0, r).join("/"));
}
function lt(t) {
  return j(t).filter((e) => e.cartIntent === !0);
}
function M(t, e) {
  if (t)
    return j(t).find((i) => Nn(i, e));
}
function eo(t, e) {
  const i = new Set(
    Object.keys(e).filter((r) => !R(e[r])).map((r) => r.toLowerCase())
  ), n = {};
  for (const r of Object.keys(t))
    i.has(r.toLowerCase()) || (n[r] = t[r]);
  for (const r of Object.keys(e))
    R(e[r]) || (n[r] = e[r]);
  return n;
}
function Fn(t) {
  return !!t && j(t).some((e) => e.targetPageIdentifierAttribute !== void 0);
}
function Ze(t, e) {
  if (!(!t || e === void 0))
    return j(t).find((i) => i.targetPageIdentifier === e);
}
function Ge(t) {
  return t ? j(t).length > 0 : !1;
}
function to(t) {
  return !!t && j(t).some((e) => e.readEmailInput === !0);
}
const ei = "enc", Ni = ["email", "emailsha256"];
function Un(t) {
  return f(t) && t !== "" ? [...Ni, t.toLowerCase()] : Ni;
}
function Fe(t, e) {
  const i = t.toLowerCase();
  return Un(e).some(
    (n) => i === n || i === n + ei
  );
}
function io(t, e) {
  const i = t.toLowerCase();
  return Un(e).some((n) => i === n + ei);
}
function Kn(t, e) {
  return Object.keys(t).some(
    (i) => Fe(i, e) && !R(L(t, i))
  );
}
const Fi = "rokt.preselectdefaulted", no = /^[A-Za-z][A-Za-z0-9_.]{0,63}$/, ro = 16;
function ti(t, e, i) {
  if (!t || !f(e))
    return;
  const n = j(t).filter(
    (r) => r.targetPageIdentifierAttribute === void 0 ? Ot(r).includes(e) : i !== void 0 && Ie(r, i) === e
  );
  return n.length === 1 ? n[0] : void 0;
}
function Mn(t, e) {
  const i = L(t, e);
  if (!R(i))
    return i;
  const n = e.toLowerCase(), r = Object.keys(t).filter((s) => s.toLowerCase() === n && !R(t[s])).map((s) => t[s]);
  return r.length > 0 && r.every((s) => s === r[0]) ? r[0] : void 0;
}
const so = Date.now(), Nt = /* @__PURE__ */ new Map();
function oo(t, e) {
  const i = `${t.accountId}:${t.targetPageIdentifier}`;
  Nt.set(i, Math.max(Nt.get(i) ?? 0, e));
}
function ii(t) {
  const { accountId: e, targetPageIdentifier: i } = t;
  if (!t.alternateTargetPageIdentifiers)
    return Ri(e, i);
  const n = Nt.get(`${e}:${i}`) ?? so;
  return Ri(e, i, n);
}
function ao(t, e) {
  return xn(
    e,
    e.byPaymentPick ? ii(t) : void 0
  );
}
function xn(t, e) {
  const { byPaymentPick: i, byHostname: n, byClientType: r } = t, s = r ? jn(navigator.userAgent) : void 0;
  return [
    i && e ? L(i, e) : void 0,
    n ? L(n, window.location.hostname) : void 0,
    r && s ? L(r, s) : void 0
  ].find(f);
}
function Ie(t, e) {
  const i = t.targetPageIdentifierAttribute;
  if (i === void 0) {
    const s = t.alternateTargetPageIdentifiers;
    return (s ? ao(t, s) : void 0) ?? t.targetPageIdentifier;
  }
  const n = Mn(e, i);
  if (!f(n))
    return;
  const r = n.trim();
  return Rn(r) ? r : void 0;
}
function Ft(t, e) {
  if (!e)
    return t;
  const i = new Set(Object.keys(e).map((r) => r.toLowerCase())), n = {};
  for (const [r, s] of Object.entries(t))
    i.has(r.toLowerCase()) || (n[r] = s);
  return { ...n, ...e };
}
function Vn(t) {
  return t.getPreselectVariant() === "widened";
}
const co = /iP(hone|od|ad)|Android|BlackBerry|BB10|IEMobile|Kindle/, lo = /Win(dows|16|95|98|CE)|Pocket Internet Explorer|OpenBSD|SunOS|CrOS|Linux|X11|Mac_PowerPC|Macintosh|QNX|BeOS|OS\/2/;
function jn(t) {
  return co.test(t) ? "MobileWeb" : lo.test(t) ? "DesktopWeb" : void 0;
}
function et(t, e) {
  if (f(t))
    return t;
  const i = jn(navigator.userAgent), n = i ? t.byClientType?.[i] : void 0;
  if (n === Sn)
    return;
  const r = e && t.byPaymentPick ? L(t.byPaymentPick, e) : void 0, s = t.byHostname ? L(t.byHostname, window.location.hostname) : void 0;
  return (t.byPageValue ? Ks(t.byPageValue) : void 0) ?? r ?? s ?? n ?? t.value;
}
function $n(t) {
  return Object.values(t.preselectAttributeDefaults ?? {}).some((i) => E(i) && i.byPaymentPick) ? ii(t) : void 0;
}
function It(t) {
  return new Set(
    Object.keys(t).filter((e) => !R(t[e])).map((e) => e.toLowerCase())
  );
}
function Hn(t, e) {
  return !Vn(t) || !f(e) && !!(e.matchGroups || e.skipValues);
}
function ut(t, e, i) {
  const n = e.preselectAttributeDefaults;
  if (!n)
    return {};
  const r = /* @__PURE__ */ new Set([...It(t.getUserIdentities()), ...It(i)]), s = It(t.userAttributes ?? {}), o = $n(e), a = {};
  for (const c of Object.keys(n)) {
    const l = c.toLowerCase();
    if (!Hn(t, n[c]) || Fe(c, t.mappedEmailSha256Key) || r.has(l) || s.has(l) && !Wn(t, e, c))
      continue;
    const u = et(n[c], o);
    u !== void 0 && (a[c] = u);
  }
  return a;
}
function Wn(t, e, i) {
  const n = L(e.preselectAttributeDefaults ?? {}, i);
  return E(n) && n.skipRemembered === !0 && Hn(t, n) && !Fe(i, t.mappedEmailSha256Key) && et(
    n,
    $n(e)
  ) !== void 0;
}
function uo(t, e) {
  const i = t.preselectAttributeDefaults ?? {};
  return Object.keys(i).find((n) => {
    const r = i[n];
    if (f(r) || !r.skipValues)
      return !1;
    const s = r.skipValues.map((o) => o.toLowerCase());
    return Object.keys(e).some((o) => {
      const a = e[o];
      return o.toLowerCase() === n.toLowerCase() && (f(a) || typeof a == "number" || typeof a == "boolean") && s.includes(String(a).toLowerCase());
    });
  });
}
function ni(t) {
  const e = t.getPreselectVariant();
  return e === "widened" || e === "standard" ? { variant: e } : {};
}
function fo(t, e, i, n) {
  const r = t?.identityKeys;
  if (!t || !r?.length || !e)
    return r;
  const s = t.preselectAttributeDefaults, o = !Fn(t.accountId) && ti(t.accountId, n) === t, a = ri(e, i).filter(
    (c) => !(o && Gn(s?.[c]) && De(e[c]) !== void 0)
  );
  return a.length > 0 ? [...r, ...a] : r;
}
function go(t, e, i) {
  const n = t?.preselectAttributeDefaults;
  if (!n || !e)
    return;
  const r = {};
  return ri(e, i).forEach((s) => {
    const o = n[s], a = f(o) ? void 0 : o?.matchGroups?.find((c) => c.includes(e[s]));
    a && (r[s] = a);
  }), Object.keys(r).length > 0 ? r : void 0;
}
const ho = "none";
function Gn(t) {
  return !f(t) && t?.matchPaymentFamily === !0;
}
function po(t, e, i) {
  const n = t?.preselectAttributeDefaults;
  if (!n)
    return;
  const r = {};
  return Object.keys(n).forEach((s) => {
    if (!Gn(n[s]))
      return;
    const o = L(e, s), a = Yn(e, s) || R(o), c = a ? void 0 : De(o);
    c ? r[s] = c : a && i && (r[s] = ho);
  }), Object.keys(r).length > 0 ? r : void 0;
}
function ri(t, e) {
  return Object.keys(t).filter(
    (i) => L(e, i) === t[i] && !Yn(e, i)
  );
}
function Yn(t, e) {
  return Object.keys(t).some(
    (i) => i !== e && i.toLowerCase() === e.toLowerCase() && !R(t[i])
  );
}
function Bn(t, e) {
  if (!t)
    return;
  const i = ri(t, e).filter((n) => no.test(n)).slice(0, ro);
  return i.length > 0 ? i.join(",") : void 0;
}
function zn(t) {
  const e = Object.keys(t.preselectAttributeDefaults ?? {});
  return [...t.attributeKeys, ...e.filter((i) => !t.attributeKeys.includes(i))];
}
const mo = ["", "0", "[]", "{}", "false", "null"];
function Xn(t) {
  if (R(t)) return !1;
  if (Array.isArray(t)) return !0;
  const e = String(t).trim();
  if (mo.includes(e.toLowerCase())) return !1;
  try {
    const i = JSON.parse(e);
    return !Array.isArray(i) || i.length > 0;
  } catch {
    return !0;
  }
}
function we(t) {
  const e = t ? lt(t) : [];
  return e.length === 1 && e[0].cartUserAttribute ? e[0] : void 0;
}
function yo(t) {
  return we(t) !== void 0;
}
function Ui(t, e) {
  const i = we(t)?.cartUserAttribute;
  return f(i) && i.toLowerCase() === e.toLowerCase();
}
function Ki(t, e, i) {
  const n = we(t)?.cartUserAttribute?.toLowerCase();
  if (!n || i && zn(i).some((s) => s.toLowerCase() === n))
    return e;
  const r = {};
  for (const [s, o] of Object.entries(e))
    s.toLowerCase() !== n && (r[s] = o);
  return r;
}
function qn(t, e) {
  const i = t.filteredUser?.getAllUserAttributes?.() ?? {}, n = Object.keys(i).find((r) => r.toLowerCase() === e.toLowerCase());
  return n === void 0 ? void 0 : i[n];
}
function Jn(t) {
  const { search: e, hash: i } = window.location, n = /^#!|^#[^?&]*\//.test(i);
  return S(t) + e + (n ? i : "");
}
function Qn(t) {
  try {
    return re(f(t) ? t : JSON.stringify(t) ?? "");
  } catch {
    return;
  }
}
const $ = [];
function _o(t) {
  const e = $[$.length - 1];
  return t !== void 0 && (e === void 0 || t < e.since);
}
function vo() {
  try {
    return new URL(document.referrer).origin === window.location.origin ? "same_origin" : "other_origin";
  } catch {
    return "none";
  }
}
function Eo(t, e, i, n = i) {
  if (!t.accountId || !Qt(t))
    return;
  const r = ti(t.accountId, e, n);
  if (!r)
    return;
  const s = we(t.accountId);
  if (s?.targetPageIdentifier === r.targetPageIdentifier) {
    const c = Jn(window.location.pathname);
    c !== "/" && Cs(t.accountId, r.targetPageIdentifier, re(c));
    const l = qn(t, s.cartUserAttribute);
    bs(
      t.accountId,
      r.targetPageIdentifier,
      Xn(l) ? Qn(l) : void 0,
      D(t.filteredUser)
    );
  }
  const o = As(t.accountId, r.targetPageIdentifier);
  if (!o || (Zt(t) && t.isForwardingAllowed() && O(t, "arrived", "intent_arrival", {
    ...Io(o),
    ...Po(o, i)
  }), o.firedAt !== void 0))
    return;
  const a = o.triggeredAt !== void 0;
  O(t, "missed", "arrival_without_fire", {
    trigger_seen: a,
    identity_seen_on_trigger_path: o.identitySeenAt !== void 0,
    has_identity: V(t.filteredUser),
    // Another tab's checkout caches its offers in that tab, so this arrival still misses. This tab's
    // own trigger counts too: the device marker can expire, be cleared by another tab or fail to save.
    trigger_seen_any_tab: a || fs(t.accountId, r.targetPageIdentifier),
    ...at(o.triggeredAt),
    near_miss_seen: _o(o.nearMissAt),
    // Page memory loses the trigger record on a full navigation, so trigger_seen reads false.
    storage: Rr() ? "page" : "device",
    referrer: vo()
  });
}
function Io(t) {
  const e = t.intentAt === void 0 || t.intentKind === void 0 ? "none" : bo(Date.now() - t.intentAt);
  return {
    intent_seen: e === "none" ? "none" : t.intentKind,
    lead: e,
    fired: t.firedAt !== void 0
  };
}
function Po(t, e) {
  const i = ss(e), n = t.paymentPickAt === void 0 ? -1 : Date.now() - t.paymentPickAt, r = t.paymentPick && n >= 0 && n < Xe ? t.paymentPick : "none";
  if (r === "none" && i === "absent")
    return {};
  const s = t.firedAt === void 0 ? -1 : Date.now() - t.firedAt, o = t.paymentAtFire && s >= 0 && s < Xe ? t.paymentAtFire : "none";
  return {
    payment_guess: o,
    payment_pick: r,
    payment_arrival: i,
    payment_match: o !== "none" && i !== "absent" && i !== "other" ? o === i : "n/a"
  };
}
const Ao = [
  [1e3, "lt1s"],
  [2e3, "1s_2s"],
  [5e3, "2s_5s"],
  [1e4, "5s_10s"],
  [2e4, "10s_20s"],
  [6e4, "20s_60s"],
  [3e5, "60s_300s"],
  [Xe, "300s_1800s"]
];
function bo(t) {
  if (t < 0)
    return "none";
  const e = Ao.find(([i]) => t < i);
  return e ? e[1] : "none";
}
const Zn = {}, er = {}, tr = {}, si = {}, ir = {}, wo = {}, Co = ["commit", "wallet", "checkout_step", "frame", "cart"], To = ["vendor", "label", "brand", "frame", "submit", "name", "api", "selector"], So = 512;
function nr(t) {
  return t === "commit" ? "intent_commit" : t === "checkout_step" ? "intent_checkout_step" : t === "cart" ? "intent_cart" : "intent_wallet";
}
function rr(t) {
  return t === "intent_commit" ? er : t === "intent_checkout_step" ? si : t === "intent_cart" ? ir : tr;
}
const Lo = 1e3;
function Ut(t) {
  const e = Date.now() - t.t;
  return e >= 0 && e < Lo;
}
function dt(t) {
  return typeof t.source == "string" && To.includes(t.source) ? t.source : void 0;
}
function sr(t) {
  return [...new Set(j(t).map((i) => i.targetPageIdentifier))].some((i) => vs(t, i)) ? "left" : "before_entry";
}
const or = 2e4;
function ko(t) {
  const e = t.pathname;
  return typeof e == "string" && e.charAt(0) === "/" && e.length <= So ? S(e) : void 0;
}
const Ce = /* @__PURE__ */ new Set(), Kt = /* @__PURE__ */ new Set();
function Ee(t) {
  if (t === er) return "intent_commit";
  if (t === tr) return "intent_wallet";
  if (t === si) return "intent_checkout_step";
  if (t === ir) return "intent_cart";
}
function Ue(t) {
  return Ee(t) !== void 0;
}
function Pt(t, e = Date.now()) {
  t = S(t), $[$.length - 1]?.pathname !== t && ($.push({ pathname: t, since: e }), $.length > 8 && $.shift(), Kt.clear());
}
function ft(t) {
  return !t.isTargetingDisabled() && t.isForwardingAllowed() && Zt(t) && t.isKitReady() && t.isPreselectionEnabled() && Ge(t.accountId);
}
function Ro(t, e) {
  const i = e.kind === "cart" ? lt(t) : j(t);
  new Set(i.map((r) => r.targetPageIdentifier)).forEach((r) => Es(t, r, e.kind, e.t));
}
function Pe(t) {
  return t === Zn;
}
function ar(t) {
  return ft(t) ? t.accountId : void 0;
}
function cr(t) {
  const e = Date.now();
  return typeof t == "number" && Number.isFinite(t) && t <= e ? t : e;
}
function lr(t, e, i) {
  if (!e) return;
  const n = new Set(j(t).map((s) => s.targetPageIdentifier)), r = cr(i);
  n.forEach((s) => Is(t, s, e, r));
}
const Oo = 1e3;
function gt(t, e, i, n, r = {}, s = !1) {
  const o = `${n}:${i}:${e.kind}${s ? ":wait" : ""}`;
  if (Kt.has(o)) return;
  Kt.add(o);
  const a = dt(e);
  O(t, "skipped", "intent_observed", {
    intent_kind: e.kind,
    intent_route: i,
    ...a ? { intent_source: a } : {},
    has_email: xe(t, {}),
    has_identity: V(t.filteredUser),
    ...r
  });
}
function Mt(t, e, i, n, r, s = !1) {
  const o = e.accountId, a = sr(o), c = qt(e), l = (_, k = s) => gt(e, i, a, r, { logged_in: c, ..._ ? { cause: _ } : {} }, k), u = i.kind === "cart", d = i.kind === "wallet" && !c && (s || !V(e.filteredUser));
  if (!u && !c && (s || l(), !d))
    return;
  const h = u ? lt(o) : j(o).filter((_) => _.cartIntent !== !0);
  if (h.length === 0) return l("cart_entry_only");
  if (h.length !== 1) return l("multiple_entries");
  if (n !== S(window.location.pathname) && !(u && Ut(i)))
    return l("path_changed");
  const v = h[0];
  if (v.hosts && !v.hosts.includes(window.location.hostname) && M(o, n)?.targetPageIdentifier !== v.targetPageIdentifier)
    return l("unlisted_host", d);
  if (!V(e.filteredUser))
    return d && !s ? No(t, e, i, n, r) : l("no_valid_identity");
  const g = nr(i.kind), m = `${g}_off_entry`, { collected: T, missingKeys: A } = ge(e, rr(g), v, !1), C = pt(e, o, v.targetPageIdentifier, T);
  if (gi(o, v.targetPageIdentifier, C, !u))
    return l("active_preselection");
  if (A.length > 0) return l("missing_attribute");
  if (!xe(e, T, v.targetPageIdentifier)) return l("no_strict_email");
  mt(
    e,
    o,
    v.targetPageIdentifier,
    T,
    "intent",
    Ke(m, v),
    g,
    dt(i),
    { route: a, loggedIn: c, requireLogin: !u && !d }
  );
}
function Do(t, e, i, n, r) {
  const s = (c) => gt(t, e, "entry", r, { cause: c });
  if (!V(t.filteredUser)) return s("no_valid_identity");
  const { collected: o, missingKeys: a } = ge(t, si, i, !1);
  if (a.length > 0) return s("missing_attribute");
  if (!xe(t, o, i.targetPageIdentifier)) return s("no_strict_email");
  mt(
    t,
    t.accountId,
    i.targetPageIdentifier,
    o,
    "intent",
    Ke("intent_checkout_step", i, n),
    "intent_checkout_step",
    dt(e),
    { route: "entry", loggedIn: qt(t), requireLogin: !1 }
  );
}
function No(t, e, i, n, r) {
  ur(t);
  const s = () => {
    t.identityWait = void 0;
    const a = e.getCurrentHost();
    ft(a) && dr(a, o);
  }, o = {
    signal: i,
    clickPathname: n,
    visitKey: r,
    route: $[$.length - 1],
    timer: setTimeout(s, Math.max(0, i.t + or - Date.now()))
  };
  t.identityWait = o;
}
function ur(t) {
  t.identityWait && clearTimeout(t.identityWait.timer), t.identityWait = void 0;
}
function dr(t, e) {
  const i = sr(t.accountId), n = { logged_in: qt(t), cause: "identity_wait_expired" };
  gt(t, e.signal, i, e.visitKey, n, !0);
}
function Fo(t, e) {
  const i = t.identityWait;
  if (!i || !V(e.filteredUser) || (ur(t), !ft(e))) return;
  if (O(e, "identity_arrived", "pending_identity", {
    intent_kind: i.signal.kind,
    ...at(i.signal.t)
  }), $[$.length - 1] !== i.route || i.clickPathname !== S(window.location.pathname) || Date.now() - i.signal.t >= or) return dr(e, i);
  Mt(t, e, i.signal, i.clickPathname, i.visitKey, !0);
}
function Uo(t, e, i) {
  if (!i || !Co.includes(i.kind) || typeof i.t != "number" || !Number.isFinite(i.t))
    return;
  const n = `${i.kind}:${i.t}${i.adds === !0 ? ":adds" : ""}`;
  if (Ce.has(n) || (Ce.add(n), Ce.size > 4096 && Ce.delete(Ce.values().next().value), !ft(e)) || i.kind === "cart" && lt(e.accountId).length === 0) return;
  Ro(e.accountId, i);
  const r = D(e.filteredUser);
  i.kind === "cart" && i.adds === !0 && r !== null && we(e.accountId) && gs(e.accountId, i.t, r);
  const s = [...$].reverse().find((_) => _.since <= i.t), o = ko(i) ?? s?.pathname;
  if (!o) return;
  const a = s && s.pathname === o ? s.since : 0, c = `${o}:${a}`, l = i.kind === "cart", u = i.kind === "commit" || i.kind === "wallet" || l, d = M(e.accountId, o);
  if (!d || (l ? d.cartIntent !== !0 : d.cartIntent === !0)) {
    u && Mt(t, e, i, o, c);
    return;
  }
  const h = window.location.pathname, v = o === S(h);
  if (l && !v && Ut(i)) {
    Mt(t, e, i, o, c);
    return;
  }
  const g = i.kind === "checkout_step" && d.checkoutStepIntent === !0;
  if (g && !v && Ut(i)) {
    Do(e, i, d, o, c);
    return;
  }
  if (!(u || g) || !v) {
    gt(e, i, "entry", c);
    return;
  }
  t.intentSource = dt(i);
  const m = nr(i.kind), T = (_) => (t.latestIntentFire = l ? void 0 : { pathname: S(h), t: i.t, userId: D(e.filteredUser), refire: _ }, _), A = t.scheduledDispatch;
  if (A && S(A.pathname) === S(h)) {
    ai(t), T((_) => Ir(t, _, A, "intent_released", m))(e);
    return;
  }
  const C = t.pending.find(
    (_) => S(_.pathname) === S(h)
  );
  if (C) {
    C.intentSeen = m, C.lateRefire = void 0;
    const { event: _, triggeringUserId: k, triggeredAt: b } = C, y = T(
      (I) => Ae(t, I, _, h, k, b, m)
    );
    C.waitingFor === "intent" && (t.pending = t.pending.filter((I) => I !== C), y(e));
    return;
  }
  T(
    (_) => Ae(t, _, rr(m), h, void 0, i.t)
  )(e);
}
const ht = 4, Ko = ["Auto Button Click", "Auto Link Click"], Mo = ["is_auto_button_click", "is_auto_link_click"];
function tt(t) {
  return t.EventDataType === ht && Ko.includes(t.EventName ?? "") || Mo.some((e) => String(t.EventAttributes?.[e]) === "true");
}
function xo(t, e) {
  const i = tt(e) ? ar(t) : void 0;
  i && lr(
    i,
    is(e.EventAttributes),
    e.Timestamp
  );
}
function Vo(t, e, i) {
  const n = ar(e);
  if (!n) return;
  const r = ns(i), s = jo(t, e, n, r, i?.t);
  lr(n, r, i?.t), s && (t.latestIntentFire = void 0, fr(t, !0, () => s.refire(e)));
}
function fr(t, e, i) {
  const n = t.lateRefire;
  t.lateRefire = e;
  try {
    i();
  } finally {
    t.lateRefire = n;
  }
}
function jo(t, e, i, n, r) {
  const s = t.latestIntentFire;
  if (!s || !n) return;
  const o = cr(r) - s.t, a = S(window.location.pathname);
  if (o < 0 || o > Oo || a !== s.pathname || D(e.filteredUser) !== s.userId) return;
  const l = t.pending.some((u) => S(u.pathname) === a) || t.scheduledDispatch !== void 0 && S(t.scheduledDispatch.pathname) === a ? void 0 : M(i, a);
  if (!(!l || l.cartIntent === !0 || !Lt(i, l.targetPageIdentifier)))
    return $o(l, Ps(i, l.targetPageIdentifier), n) ? s : void 0;
}
function $o(t, e, i) {
  if (e === i) return !1;
  const n = Object.values(t.preselectAttributeDefaults ?? {}).some(
    (o) => E(o) && o.byPaymentPick !== void 0 && et(o, e) !== et(o, i)
  ), r = t.targetPageIdentifierAttribute === void 0 ? t.alternateTargetPageIdentifiers : void 0, s = (o) => (r ? xn(r, o) : void 0) ?? t.targetPageIdentifier;
  return n || s(e) !== s(i);
}
function de(t, e) {
  return e.EventDataType === ht && f(e.EventName) && !tt(e) && (t.triggerEventNames ?? []).includes(e.EventName);
}
const gr = "rokt.preselecttrigger", it = "preselectFormEmail", xt = "preselectBoundUser", Vt = "preselectEntry";
function Ke(t, e, i) {
  const n = (i !== void 0 ? Dn(e, i) : void 0) ?? e.pathname;
  return `${t}|${n}`;
}
function Ho(t) {
  if (!t)
    return;
  const e = j(t), i = [...new Set(e.flatMap((r) => r.intentSelectors?.commit ?? []))], n = [...new Set(e.flatMap((r) => r.intentSelectors?.checkoutStep ?? []))];
  if (!(i.length === 0 && n.length === 0))
    return {
      ...i.length > 0 ? { commit: i } : {},
      ...n.length > 0 ? { checkout_step: n } : {}
    };
}
function Wo(t, e, i = window.location.pathname) {
  if (t.pending.some((r) => r.pathname === i && !Pe(r.event)))
    return;
  const n = t.scheduledDispatch;
  n && n.pathname === i && !Pe(n.event) || Ae(t, e, Zn, i);
}
function Go(t, e) {
  return !t || !f(e) ? !1 : j(t).some((i) => (i.triggerEventNames ?? []).includes(e));
}
function nt(t) {
  return !Pe(t) && !Ue(t) && t.EventDataType !== ht;
}
function Yo(t, e) {
  const i = t.scheduledDispatch;
  return i && i.pathname === e && nt(i.event) ? !0 : t.pending.some((n) => n.pathname === e && nt(n.event));
}
function oi(t, e, i, n) {
  const r = i?.alternateTargetPageIdentifiers ? Ie(i, n) : void 0;
  return jr(
    t,
    r !== void 0 && r !== i?.targetPageIdentifier ? `${e}@${r}` : e
  );
}
function Bo(t, e, i, n) {
  if (!t.isKitReady() || !t.isPreselectionEnabled() || !ui(t, i))
    return "waits";
  const { collected: r, missingKeys: s } = ge(t, e, i);
  if (s.length > 0)
    return "waits";
  const o = t.accountId || "", a = ve(
    oi(o, S(n), i, r)
  );
  if (!a)
    return "now";
  const c = pt(t, o, i.targetPageIdentifier, r);
  return a.byEvent || fi(a.attributesDigest, c) ? "skipped" : "now";
}
function zo(t, e, i) {
  t.pending = t.pending.filter((r) => r.pathname !== i);
  const n = e.accountId ? zt(e.accountId) : null;
  e.accountId && n && n.pathname === i && ue(e.accountId);
}
function Xo(t, e, i, n = window.location.pathname) {
  const r = M(e.accountId, n);
  if (!r || !de(r, i))
    return;
  const s = Bo(e, i, r, n);
  if (s === "now")
    zo(t, e, n);
  else if (Yo(t, n) || s === "skipped" && t.scheduledDispatch?.pathname === n)
    return;
  Ae(t, e, i, n);
}
function qo(t, e) {
  return t ? j(t).some((i) => i.attributeKeys.includes(e)) : !1;
}
function Jo() {
  return { pending: [] };
}
function ai(t) {
  if (t.dispatchTimer === void 0)
    return;
  const e = t.scheduledDispatch;
  return clearTimeout(t.dispatchTimer), t.dispatchTimer = void 0, t.scheduledDispatch = void 0, e;
}
function Qo(t, e) {
  return t === void 0 ? e : e === void 0 ? t : Math.min(t, e);
}
function Mi(t) {
  return Pe(t) ? 0 : Ue(t) || t.EventDataType === ht ? 2 : 1;
}
function Zo(t, e) {
  const i = M(t.accountId, e.pathname);
  return !!i && ge(t, e.event, i).missingKeys.length > 0;
}
function hr(t, e, i, n) {
  const r = t.pending.find((s) => s.pathname === n);
  return !!r && Mi(i) < Mi(r.event) && !(nt(i) && Zo(e, r));
}
function se(t, e, i) {
  const n = t.pending.findIndex((r) => r.pathname === i.pathname);
  if (n >= 0) {
    if (hr(t, e, i.event, i.pathname))
      return;
    const r = t.pending[n];
    t.pending[n] = {
      ...i,
      triggeredAt: Qo(r.triggeredAt, i.triggeredAt),
      intentSeen: i.intentSeen ?? r.intentSeen ?? Ee(r.event),
      ...t.lateRefire || r.lateRefire ? { lateRefire: !0 } : {}
    };
    return;
  }
  t.pending.push(t.lateRefire ? { ...i, lateRefire: !0 } : i);
}
function Me(t) {
  return t.attributeKeys.find((e) => e.toLowerCase() === "email");
}
function ci(t, e, i = {}, n = () => !0) {
  const r = e.toLowerCase(), s = new Set(
    [e, "emailsha256", t.mappedEmailSha256Key].filter((c) => f(c) && c !== "").flatMap((c) => [c.toLowerCase(), c.toLowerCase() + ei])
  ), o = t.getCurrentUser();
  return [
    i,
    t.userAttributes,
    t.filteredUser?.getAllUserAttributes?.() ?? {},
    t.getUserIdentities(),
    o?.getAllUserAttributes?.() ?? {},
    o?.getUserIdentities?.().userIdentities ?? {}
  ].some(
    (c) => Object.keys(c).some((l) => {
      const u = l.toLowerCase(), d = L(c, l);
      return s.has(u) && !R(d) && (u !== r || n(d));
    })
  );
}
function pr(t) {
  return (e) => !f(e) || !Cn(e) && (t === void 0 || e.trim().toLowerCase() !== t.toLowerCase());
}
function xe(t, e, i) {
  return Kn(t.getOutgoingAttributes(e, i), t.mappedEmailSha256Key);
}
function li(t, e, i, n = {}, r) {
  return e.readEmailInput !== !0 ? "read_disabled" : Nn(e, window.location.pathname) ? !t.isForwardingAllowed() || !t.isPreselectionPrivacyAllowed() || t.isTargetingDisabled() ? "privacy_blocked" : t.isEmailIdentityFiltered() ? "email_filtered" : ci(t, i, n, r) ? "partner_email" : void 0 : "off_route";
}
function ea(t, e, i, n) {
  const r = li(t, e, i, n.EventAttributes ?? {});
  if (r) return r;
  const { emails: s, ambiguous: o, unfilled: a } = Tn(!0);
  return s.size > 1 || o ? "multiple_emails" : a ?? "no_field";
}
function ta(t, e, i) {
  const n = window.location.pathname, r = M(e.accountId, n), s = r && Me(r);
  return !!s && t.pending.some(
    (o) => o.pathname === n && !li(e, r, s, o.event.EventAttributes ?? {})
  ) && i.isTrusted === !0 && Ss(i.target);
}
function mr(t, e, i, n) {
  const r = Me(e);
  if (!r) return;
  const s = L(i, r), o = !R(s), a = n.EventAttributes ?? {};
  if (o && !(f(s) && Cn(s)) || li(t, e, r, a, o ? pr() : void 0))
    return;
  const c = Rs();
  if (c)
    return i[r] = c, { key: r, replaced: o };
}
function ui(t, e) {
  const i = Me(e);
  return V(t.filteredUser) || e.readEmailInput === !0 && !!i && di(t, e, {}).includes(i);
}
function yr(t, e) {
  const i = Oe(t.filteredUser), n = t.getCurrentUser(), r = Oe(n), s = D(t.filteredUser), o = D(n), a = [...e.identityKeys ?? [], "email", "emailsha256"];
  t.mappedEmailSha256Key && a.push(t.mappedEmailSha256Key);
  const c = new Set(a.map((h) => h.toLowerCase())), l = n?.getAllUserAttributes?.() ?? {}, u = [t.userAttributes, l].some(
    (h) => Object.entries(h).some(
      ([v, g]) => c.has(v.toLowerCase()) && f(g) && g.length > 0
    )
  );
  let d = "no_identities";
  return t.filteredUser ? o !== null && s !== o ? d = "mpid_mismatch" : r.length > 0 && (d = "kit_user_lacks_identities") : d = "no_filtered_user", {
    identity_reason: d,
    kit_identity_types: Qe(i),
    current_identity_types: Qe(r),
    mpid_match: o === null ? "unknown" : s === o,
    identity_attribute_present: u
  };
}
function di(t, e, i) {
  const n = Vn(t) ? e.widenedOptionalAttributeKeys ?? [] : [], r = new Set(
    [...e.optionalAttributeKeys ?? [], ...n].map((o) => o.toLowerCase())
  ), s = ut(t, e, i);
  return e.attributeKeys.filter(
    (o) => !r.has(o.toLowerCase()) && R(L(i, o)) && L(s, o) === void 0
  );
}
function ge(t, e, i, n = !0) {
  const r = t.filteredUser?.getAllUserAttributes?.() || {}, s = new Set(i.identityKeys ?? []);
  let o;
  const a = {};
  for (const d of i.attributeKeys) {
    const h = t.getEventAttributeValue(e, d), v = L(t.userAttributes, d);
    let g = !R(h) || Wn(t, i, d) ? h : R(v) ? L(r, d) : v;
    if (R(g) && s.has(d)) {
      o || (o = t.getUserIdentities());
      const m = L(o, d);
      g = f(m) && m !== "" ? m : void 0;
    }
    R(g) || (a[d] = g);
  }
  const c = i.targetPageIdentifierAttribute;
  if (c !== void 0) {
    const d = [e.EventAttributes ?? {}, t.userAttributes, r].map((h) => Mn(h, c)).find((h) => !R(h));
    if (d !== void 0) {
      const h = c.toLowerCase(), v = Object.keys(a).filter((g) => g.toLowerCase() === h);
      for (const g of v.length > 0 ? v : [c])
        a[g] = d;
    }
  }
  const l = e.EventAttributes ?? {};
  for (const d of Object.keys(i.preselectAttributeDefaults ?? {})) {
    if (!R(t.getEventAttributeValue(e, d)))
      continue;
    const h = Object.keys(l).find(
      (v) => v.toLowerCase() === d.toLowerCase() && !R(l[v])
    );
    h !== void 0 && (a[h] = l[h]);
  }
  const u = n ? mr(t, i, a, e) : void 0;
  return {
    collected: a,
    missingKeys: di(t, i, a),
    formEmail: u
  };
}
const _r = /* @__PURE__ */ new WeakMap();
function ia(t) {
  return _r.get(t);
}
function na(t, e, i) {
  i && _r.set(e, i);
  const n = (s) => {
    i?.();
    const o = e[it] ? "redacted" : s instanceof Error ? s.message : String(s);
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
const xi = /* @__PURE__ */ new Map(), Vi = /* @__PURE__ */ new Map();
function ji(t, e, i) {
  const n = t.get(e), r = { previous: i, earlier: n };
  return n && (n.later = r), t.set(e, r), r;
}
function $i(t, e, i, n) {
  const { earlier: r, later: s } = i;
  if (s) {
    s.previous = i.previous, s.earlier = r, r && (r.later = s);
    return;
  }
  n(i.previous), r && (r.later = void 0), t.get(e) === i && (r ? t.set(e, r) : t.delete(e));
}
function pt(t, e, i, n) {
  try {
    const r = Ze(e, i), s = r ? ut(t, r, n) : void 0, o = Ft(n, s), a = t.getOutgoingAttributes(n, i), c = Object.keys(a).sort().filter((y) => Fe(y, t.mappedEmailSha256Key) && !R(L(a, y))), l = (y) => io(y, t.mappedEmailSha256Key), u = [...new Set(c.filter(l).map((y) => y.toLowerCase()))].sort().map((y) => [y, !0]), d = [
      ...c.filter((y) => !l(y)).map((y) => [y, L(a, y)]),
      ...u
    ], h = Object.keys(r?.preselectAttributeDefaults ?? {}), v = (y) => h.some((I) => I.toLowerCase() === y.toLowerCase()), g = {};
    for (const [y, I] of Object.entries(o))
      v(y) || (g[y] = l(y) ? !R(I) : I);
    for (const y of h) {
      const I = Object.keys(a).filter((F) => F.toLowerCase() === y.toLowerCase() && !R(a[F])).sort().map((F) => [F, a[F]]);
      I.length > 0 && (g[y] = l(y) ? !0 : I);
    }
    const m = JSON.stringify(g), T = [.../* @__PURE__ */ new Set([...r?.attributeKeys ?? [], ...Object.keys(o)])].filter((y) => !v(y) && !l(y)).sort().filter((y) => {
      const I = L(a, y);
      return I !== void 0 && I !== L(o, y);
    }).map((y) => [y, L(a, y)]), A = d.length > 0 ? `${m}|${JSON.stringify(d)}` : m, C = T.length > 0 ? `${A}>${JSON.stringify(T)}` : A, _ = r?.alternateTargetPageIdentifiers ? Ie(r, n) : void 0, k = _ !== void 0 && _ !== i ? `${C}@${_}` : C, b = Bn(t.getPreselectFills(n, i) ?? s, a);
    return b ? { digest: re(`${k}#${b}`), unmarkedDigest: re(k) } : { digest: re(k) };
  } catch {
    return {};
  }
}
function fi(t, e) {
  return t !== void 0 && e.digest !== void 0 && (t === e.digest || t === e.unmarkedDigest);
}
function gi(t, e, i, n) {
  return Lt(t, e, i.digest, n) || i.unmarkedDigest !== void 0 && Lt(t, e, i.unmarkedDigest, n);
}
function vr(t, e, i, n, r, s, o, a = !1, c, l = a, u, d, h, v = !1) {
  if (!Jt(t))
    return !1;
  const g = c ? { intent_kind: c.replace("intent_", "") } : {}, m = Ze(e, n), T = m?.targetPageIdentifierAttribute !== void 0, A = m && (T || m.alternateTargetPageIdentifiers) ? Ie(m, t.filterAttributes(r)) : n;
  if (A === void 0) {
    const x = m !== void 0 && Ie(m, r) !== void 0;
    return O(t, "missed", "no_target_page_identifier", {
      ...g,
      ...x ? { cause: "filtered" } : {}
    }), !1;
  }
  const C = m ? ut(t, m, r) : {}, _ = t.getOutgoingAttributes(r, n), k = m ? uo(m, _) : void 0;
  if (k)
    return O(t, "skipped", `skip_value:${k}`, g), !1;
  const b = oi(e, i, m, r), y = pt(t, e, n, r), I = y.digest;
  if (c && gi(e, n, y, c !== "intent_cart"))
    return O(t, "skipped", "active_preselection", g), !0;
  if (a && ve(b)?.byEvent)
    return O(t, "skipped", "active_preselection"), !1;
  const F = I !== void 0 ? ve(b) : null;
  if (I !== void 0) {
    if (fi(F?.attributesDigest, y))
      return O(t, "skipped", "active_preselection", g), !0;
    $r(
      b,
      I,
      l || !!c && ve(b)?.byEvent === !0
    );
  }
  const w = Object.keys(C).filter((x) => L(_, x) === C[x]);
  O(t, "fired", v ? "intent_refire" : s, {
    identity_types: Qe(Oe(t.filteredUser)),
    ...u ? { email_source: "input" } : {},
    ...u?.replaced ? { email_replaced: !0 } : {},
    ...c ? {
      ...g,
      intent_route: h ? h.route : "entry",
      ...d ? { intent_source: d } : {},
      ...h ? { logged_in: h.loggedIn } : {}
    } : {},
    ...ni(t),
    ...w.length > 0 ? { defaulted_keys: w.join(",") } : {}
  });
  const H = `${e}:${n}`, Z = ji(
    xi,
    H,
    ys(
      e,
      n,
      I,
      c === "intent_cart",
      m ? ii(m) ?? null : void 0
    )
  ), z = I !== void 0 ? ji(Vi, b, F) : void 0;
  let Q = !1;
  const U = () => {
    Q || (Q = !0, z && $i(
      Vi,
      b,
      z,
      (x) => Hr(b, x, I)
    ), $i(
      xi,
      H,
      Z,
      (x) => _s(e, n, x, I)
    ));
  };
  return na(t, {
    attributes: { ...r, [gr]: o },
    preselect: !0,
    identifier: A,
    // The entry that fired travels with the call, so its defaults and cache keys never come from another entry whose
    // target value the call's identifier also matches.
    ...A !== n ? { [Vt]: n } : {},
    omitUrl: !0,
    ...u ? {
      [it]: {
        key: u.key,
        mpid: D(t.filteredUser),
        ...u.replaced ? { replaced: !0 } : {}
      }
    } : {},
    ...h ? { [xt]: { mpid: D(t.filteredUser), requireLogin: h.requireLogin } } : {}
  }, U), !0;
}
function mt(t, e, i, n, r, s, o, a, c) {
  return vr(
    t,
    e,
    i,
    i,
    n,
    r,
    s,
    !1,
    o,
    !1,
    void 0,
    a,
    c
  );
}
function ra(t, e) {
  if (!e.accountId || !e.isKitReady())
    return;
  const i = zt(e.accountId);
  if (!i)
    return;
  if (t.pending.some((o) => o.pathname === i.pathname)) {
    ue(e.accountId);
    return;
  }
  if (!e.isPreselectionEnabled()) {
    ue(e.accountId);
    return;
  }
  if (!V(e.filteredUser) || (ue(e.accountId), D(e.filteredUser) !== i.mpid))
    return;
  const n = M(e.accountId, i.pathname);
  if (!n || n.targetPageIdentifier !== i.identifier)
    return;
  if (!i.byEvent && ct(e)) {
    O(e, "missed", "recovery_awaits_intent");
    return;
  }
  const r = le(i.attributes), s = di(e, n, r);
  if (s.length > 0) {
    for (const o of s)
      O(e, "missed", `missing_persisted_attribute:${o}`, ni(e));
    return;
  }
  mt(
    e,
    e.accountId,
    i.identifier,
    r,
    "recovered",
    Ke("recovered", n, i.pathname)
  );
}
function Er(t, e, i) {
  if (e.waitingFor !== "intent" || e.intentSeen)
    return !1;
  const n = M(t.accountId, e.pathname);
  return !!n && n === M(t.accountId, i);
}
function jt(t, e) {
  Qt(t) && O(t, "missed", "left_trigger_path", {
    waiting_for: e.waitingFor,
    has_identity: V(t.filteredUser),
    ...at(e.triggeredAt)
  });
}
function Ae(t, e, i, n = window.location.pathname, r, s = Date.now(), o) {
  const a = t.pending.filter((u) => u.pathname !== n);
  if (a.length > 0) {
    const u = e.accountId ? zt(e.accountId) : null;
    e.accountId && u && a.some((d) => d.pathname === u.pathname) && ue(e.accountId), a.forEach((d) => {
      Er(e, d, n) ? t.intentWaitMovedWithin = M(e.accountId, n) : jt(e, d);
    }), t.pending = t.pending.filter((d) => d.pathname === n);
  }
  const c = ai(t), l = c !== void 0 && c.pathname === n && Pe(c.event);
  if (c && !l) {
    const u = M(e.accountId, c.pathname);
    S(c.pathname) !== S(n) && u?.releaseHoldOnRouteChange ? (Ir(t, e, c, "hold_released_on_route_change"), t.pending = t.pending.filter((d) => d.pathname === c.pathname ? (jt(e, d), !1) : !0)) : Hi(e, c, n);
  }
  sa(t, e, i, n, r, s, l, o), l && t.scheduledDispatch === void 0 && Hi(e, c, n);
}
function Hi(t, e, i) {
  O(t, "missed", "hold_cancelled", {
    held_ms: Date.now() - e.heldAt,
    same_path: e.pathname === i
  });
}
function sa(t, e, i, n, r, s, o, a) {
  const c = t.pending.find((d) => S(d.pathname) === S(n));
  a ?? (a = Ee(i) ?? c?.intentSeen ?? Ee(c?.event));
  const l = { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a };
  if (e.isTargetingDisabled() || !e.isPreselectionPrivacyAllowed())
    return;
  const u = M(e.accountId, n);
  if (!u) {
    la(e, n);
    return;
  }
  if (u.alternateTargetPageIdentifiers && !Ee(i) && !de(u, i) && oo(u, s), !(r !== void 0 && D(e.filteredUser) !== r)) {
    if (!a && !de(u, i) && ct(e))
      return oa(t, e, l, u, c);
    if (!e.isKitReady())
      return aa(t, e, l, u);
    if (e.isPreselectionEnabled()) {
      if (hi(e, u, i), !ui(e, u)) {
        O(e, "missed", "no_valid_identity", yr(e, u)), se(t, e, { ...l, waitingFor: "identity" });
        return;
      }
      if (u.dispatchDelayMs !== void 0 && !de(u, i) && !Ue(i) && !a)
        return ca(t, e, l, u.dispatchDelayMs, o);
      Ar(
        t,
        e,
        i,
        n,
        u,
        r,
        s,
        void 0,
        a,
        a ? c : void 0
      );
    }
  }
}
function oa(t, e, i, n, r) {
  const s = t.intentWaitMovedWithin === n;
  t.intentWaitMovedWithin = void 0;
  const o = s || r?.waitingFor === "intent" && r.awaitingIntentLogged === !0, a = e.isKitReady() && e.isPreselectionEnabled();
  se(t, e, {
    ...i,
    // Bound to an identified shopper, as a timer hold is, so another user's click never sends
    // this page view's attributes. A guest stays unbound so signing in at checkout still fires.
    triggeringUserId: i.triggeringUserId ?? (V(e.filteredUser) ? D(e.filteredUser) : void 0),
    waitingFor: "intent",
    awaitingIntentLogged: o || a
  }), !o && a && O(e, "held", "awaiting_intent"), a && hi(e, n, i.event);
}
function aa(t, e, i, n) {
  const { event: r, pathname: s, intentSeen: o } = i;
  if (hr(t, e, r, s))
    return;
  const a = [], c = D(e.filteredUser);
  if (e.accountId && c && V(e.filteredUser)) {
    const { collected: l, missingKeys: u, formEmail: d } = ge(e, r, n);
    if (u.length === 0 && !d) {
      const h = le(l);
      (de(n, r) || !!o ? ki(
        e.accountId,
        s,
        n.targetPageIdentifier,
        h,
        c,
        !0
      ) : ki(e.accountId, s, n.targetPageIdentifier, h, c)) || a.push(Xt("queued", "persist_failed"));
    }
  }
  se(t, e, { ...i, storedDiagnostics: a, waitingFor: "launcher" });
}
function ca(t, e, i, n, r) {
  const { event: s, pathname: o, triggeredAt: a } = i, c = D(e.filteredUser), l = Math.min(n, Math.max(0, a + n - Date.now()));
  t.scheduledDispatch = { event: s, pathname: o, heldAt: Date.now(), heldForUserId: c, triggeredAt: a }, r || O(e, "held", "dispatch_delay", { delay_ms: l }), t.dispatchTimer = setTimeout(() => {
    t.dispatchTimer = void 0, t.scheduledDispatch = void 0, Pr(t, e.getCurrentHost(), s, o, c, a);
  }, l);
}
function hi(t, e, i) {
  if (!t.accountId) return;
  const n = Me(e), r = e.readEmailInput === !0 && !!n && (ci(t, n, i.EventAttributes ?? {}) || mr(t, e, {}, i) !== void 0);
  ds(
    t.accountId,
    e.targetPageIdentifier,
    V(t.filteredUser) || r
  );
}
function la(t, e) {
  const i = t.accountId;
  !i || t.isKitReady() && !t.isPreselectionEnabled() || j(i).forEach((n) => {
    On(n).some((r) => Zs(r, e)) && ms(i, n.targetPageIdentifier);
  });
}
function Ir(t, e, i, n, r) {
  Pr(
    t,
    e.getCurrentHost(),
    i.event,
    i.pathname,
    i.heldForUserId,
    i.triggeredAt,
    n,
    r
  );
}
function Pr(t, e, i, n, r, s, o, a) {
  const c = M(e.accountId, n);
  if (!c || e.isTargetingDisabled() || !e.isPreselectionPrivacyAllowed())
    return;
  const l = { event: i, pathname: n, triggeringUserId: r, triggeredAt: s, intentSeen: a };
  if (!a && !de(c, i) && !Ue(i) && ct(e)) {
    const u = e.isKitReady() && e.isPreselectionEnabled();
    se(t, e, { ...l, waitingFor: "intent", awaitingIntentLogged: u }), u && O(e, "held", "awaiting_intent");
    return;
  }
  if (!e.isKitReady()) {
    se(t, e, { ...l, waitingFor: "launcher" });
    return;
  }
  if (e.isPreselectionEnabled()) {
    if (!ui(e, c)) {
      O(e, "missed", "no_valid_identity", yr(e, c)), se(t, e, { ...l, waitingFor: "identity" });
      return;
    }
    D(e.filteredUser) === r && Ar(t, e, i, n, c, r, s, o, a);
  }
}
function Ar(t, e, i, n, r, s, o, a, c, l) {
  if (!e.isPreselectionPrivacyAllowed()) return;
  const { collected: u, missingKeys: d, formEmail: h } = ge(e, i, r), v = { event: i, pathname: n, triggeringUserId: s, triggeredAt: o, intentSeen: c }, g = t.lastResolvedPageView, m = $[$.length - 1], T = S(n);
  if (Ue(i) && g && g.accountId === e.accountId && g.pathname === T && g.route === m && g.userId === D(e.filteredUser) && g.identifier === r.targetPageIdentifier && g.attributeKeys.some(
    (b) => r.attributeKeys.includes(b) && R(L(u, b))
  ))
    return;
  if (d.length > 0) {
    const b = Oe(e.filteredUser), y = Me(r);
    for (const I of d)
      O(e, "missed", `missing_attribute:${I}`, {
        identity_types: Qe(b),
        key_is_identity: b.some((F) => F.toLowerCase() === I.toLowerCase()),
        ...I === y ? { email_reason: ea(e, r, I, i) } : {},
        ...ni(e)
      });
    se(t, e, { ...v, waitingFor: "attribute" });
    return;
  }
  const A = c ?? Ee(i);
  if (A && !xe(e, u, r.targetPageIdentifier)) {
    t.noEmailLoggedPathname !== T && (t.noEmailLoggedPathname = T, O(e, "missed", "no_strict_email", {
      intent_kind: A.replace("intent_", ""),
      has_identity: V(e.filteredUser)
    })), se(t, e, { ...v, intentSeen: A, waitingFor: "attribute" });
    return;
  }
  t.noEmailLoggedPathname = void 0, l && (t.pending = t.pending.filter((b) => b !== l));
  const C = de(r, i), _ = A ?? (C ? "event" : Pe(i) ? "pathname" : "pageview");
  vr(
    e,
    e.accountId || "",
    S(n),
    r.targetPageIdentifier,
    u,
    a ?? (A ? "intent" : C ? "event_trigger" : "fired"),
    Ke(_, r, n),
    C && !A,
    A,
    C,
    h,
    A ? t.intentSource : void 0,
    void 0,
    t.lateRefire === !0
  ) && (nt(i) || C) && (t.lastResolvedPageView = {
    accountId: e.accountId,
    pathname: T,
    route: m,
    userId: D(e.filteredUser),
    identifier: r.targetPageIdentifier,
    attributeKeys: Object.keys(u)
  });
}
function Wi(t, e, i = window.location.pathname) {
  t.cartPageViewPathname = S(i), br(t, e, i);
}
function br(t, e, i) {
  const n = we(e.accountId);
  if (!n || t.cartPageViewPathname !== S(i) || // The cart entry's own route waits for its add-to-cart click, and another entry's route is a checkout step the
  // shopper reaches after the cart, where a call made for the cart page is rarely used.
  M(e.accountId, i) !== void 0 || !Jt(e)) {
    t.cartPageViewPathname = void 0;
    return;
  }
  if (!e.isKitReady()) return;
  if (!e.isPreselectionEnabled()) {
    t.cartPageViewPathname = void 0;
    return;
  }
  const r = e.accountId;
  if (Ts(r, n.targetPageIdentifier, re(Jn(i)))) {
    t.cartPageViewPathname = void 0;
    return;
  }
  const s = qn(e, n.cartUserAttribute);
  if (!(Xn(s) || hs(r, D(e.filteredUser))) || !V(e.filteredUser)) return;
  const a = Qn(s);
  if (a !== void 0 && ws(r, n.targetPageIdentifier, a, D(e.filteredUser)))
    return;
  const { collected: c, missingKeys: l } = ge(e, wo, n, !1);
  if (l.length > 0 || !xe(e, c, n.targetPageIdentifier)) return;
  t.cartPageViewPathname = void 0;
  const u = pt(e, r, n.targetPageIdentifier, c), d = ve(oi(r, n.targetPageIdentifier, n, c));
  gi(r, n.targetPageIdentifier, u) || fi(d?.attributesDigest, u) || mt(
    e,
    r,
    n.targetPageIdentifier,
    c,
    "fired",
    Ke("pageview_cart", n),
    void 0,
    void 0,
    { requireLogin: !1 }
  );
}
function ua(t, e, i = window.location.pathname) {
  if (ra(t, e), Fo(t, e), t.cartPageViewPathname !== void 0 && br(t, e, i), t.pending.length === 0)
    return;
  const n = t.pending;
  t.pending = [], n.forEach((r) => {
    const { event: s, pathname: o, storedDiagnostics: a, triggeringUserId: c, triggeredAt: l, waitingFor: u, intentSeen: d } = r, h = Qt(e), v = V(e.filteredUser), g = at(l);
    if (h && u === "identity" && v && O(e, "identity_arrived", "pending_identity", {
      ...g,
      on_trigger_path: o === i
    }), o !== i) {
      Er(e, r, i) ? t.intentWaitMovedWithin = M(e.accountId, i) : jt(e, { waitingFor: u, triggeredAt: l });
      return;
    }
    if (u === "intent" && !d) {
      const m = M(e.accountId, o);
      if (m && ct(e)) {
        !r.awaitingIntentLogged && e.isKitReady() && e.isPreselectionEnabled() && (O(e, "held", "awaiting_intent"), hi(e, m, s), r.awaitingIntentLogged = !0), t.pending.push(r);
        return;
      }
    }
    h && a?.forEach((m) => e.logPlacementDiagnostic(m)), t.scheduledDispatch?.pathname !== o && fr(
      t,
      r.lateRefire === !0,
      () => Ae(t, e, s, o, c, l, d)
    );
  });
}
function da() {
  return {
    context: null,
    lifecycle: "idle",
    recreateInFlight: null
  };
}
function fa(t, e) {
  t.context = {
    accountId: e.accountId,
    launcherOptions: { ...e.launcherOptions },
    legacyRoktExtensions: [...e.legacyRoktExtensions]
  };
}
function ga(t) {
  t.lifecycle = "attached";
}
function ha(t) {
  t.lifecycle !== "idle" && (t.lifecycle = "terminated");
}
function pa(t) {
  t.lifecycle = "terminated";
}
function ma(t) {
  t.context = null, t.lifecycle = "idle", t.recreateInFlight = null;
}
function ya(t, e, i) {
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
const Gi = "rokt:intent", Yi = "LEAD_CAPTURE_SUBMITTED";
class _a {
  constructor(e) {
    this.handlers = e, this.config = null, this.dispatchedForPageView = !1;
  }
  configure(e) {
    this.config = e, this.dispatchedForPageView = !1, this.detachListeners(), this.isIdentityCaptureBridgeEnabled(this.config) && (this.leadCaptureSubmittedListener = (i) => {
      const n = this.parseLeadCaptureSubmittedPayload(i);
      n && this.handlers.onLeadCaptureSubmitted(n);
    }, window.addEventListener(Yi, this.leadCaptureSubmittedListener)), this.isExitIntentBridgeEnabled(this.config) && (this.exitIntentListener = (i) => this.handleExitIntentEvent(i), window.addEventListener(Gi, this.exitIntentListener));
  }
  resetPageViewState() {
    this.dispatchedForPageView = !1;
  }
  dispose() {
    this.detachListeners(), this.config = null, this.dispatchedForPageView = !1;
  }
  detachListeners() {
    this.exitIntentListener && (window.removeEventListener(Gi, this.exitIntentListener), this.exitIntentListener = void 0), this.leadCaptureSubmittedListener && (window.removeEventListener(Yi, this.leadCaptureSubmittedListener), this.leadCaptureSubmittedListener = void 0);
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
    const r = n.filter((s) => f(s)).map((s) => s.trim()).filter((s) => s.length > 0);
    return new Set(r);
  }
  extractExitIntentReason(e) {
    return e instanceof CustomEvent && e.detail && f(e.detail.reason) ? e.detail.reason : "unknown";
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
    const n = i.body, r = f(n.email) ? n.email : void 0, s = f(n.mobile_number) ? n.mobile_number : void 0, o = {};
    f(r) && r.length > 0 && (o.email = r), f(s) && s.length > 0 && (o.mobile_number = s);
    const a = {}, c = this.allowCustomUserAttributes(this.config), l = this.getAllowedUserAttributeKeys(this.config);
    this.mergeLeadCaptureUserAttributes(
      a,
      E(n.userAttributes) ? n.userAttributes : null,
      c,
      l
    );
    const u = f(n.rclid) ? n.rclid : void 0;
    u && u.length > 0 && (a.rokt_rclid = u);
    const d = f(n.accountID) ? n.accountID : void 0;
    d && d.length > 0 && (a.rokt_account_id = d);
    const h = f(n.referralCreativeID) ? n.referralCreativeID : void 0;
    return h && h.length > 0 && (a.rokt_referral_creative_id = h), { identities: o, userAttributes: a };
  }
  isSafeLeadCaptureUserAttributeKey(e) {
    return e === "__proto__" || e === "constructor" || e === "prototype" ? !1 : /^[a-zA-Z0-9_.-]+$/.test(e);
  }
  isSupportedLeadCaptureUserAttributeValue(e) {
    return f(e) || typeof e == "number" || typeof e == "boolean" ? !0 : Array.isArray(e) ? e.every((i) => f(i)) : !1;
  }
  mergeLeadCaptureUserAttributes(e, i, n, r) {
    if (i)
      for (const [s, o] of Object.entries(i))
        !n || !r.has(s) || this.isSafeLeadCaptureUserAttributeKey(s) && this.isSupportedLeadCaptureUserAttributeValue(o) && (e[s] = o);
  }
}
const He = ["noTargeting", "noFunctional", "doNotShareOrSell"], va = { noTargeting: !1, noFunctional: !1, doNotShareOrSell: !1 }, G = "Rokt", Ea = 7, Ye = 181, Ia = "selectPlacements", Pa = ["paypalpayerid"], Aa = "Auto Button Click", ba = "Auto Link Click", Bi = "rokt_placement", wa = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/, Ca = 500, Ta = "apps.roktecommerce.com", Sa = 0.1, La = "ThankYouPageJourney", ka = "rokt-launcher", Ra = "rokt-thank-you-element", Oa = "userIdentifiedInWorkspace", zi = 3, Da = 2, Na = "page_events", Fa = "page_view_attributes", Ua = "mparticle_session_id", Xi = "mparticle_device_id", At = "exit-intent", Ka = [
  "3479519924056514560",
  "3484183287406608384",
  "3198447216177237634",
  "3292347205549055462"
], Ma = "exit-intent-placement", bt = "exitIntentOrigin", qi = 500, pi = {
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  UNHANDLED_EXCEPTION: "UNHANDLED_EXCEPTION",
  IDENTITY_REQUEST: "IDENTITY_REQUEST",
  LOG_DELIVERY_FAILURE: "LOG_DELIVERY_FAILURE"
}, ke = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARNING: "WARNING"
}, xa = "apps.rokt-api.com", Va = "/v1/log", ja = "/v1/errors", $a = 10;
function p() {
  return window.mParticle;
}
function Ji(t, e) {
  const n = [yt(t), "/wsdk/integrations/launcher.js"].join("");
  return !e || e.length === 0 ? n : n + "?extensions=" + e.join(",");
}
function Qi(t) {
  return [yt(t), "/rokt-elements/rokt-element-thank-you.js"].join("");
}
function yt(t) {
  const e = t !== void 0 ? t : xa;
  return e.includes("://") ? e.replace(/\/+$/, "") : ["https://", e].join("");
}
function wr(t, e, i) {
  if (t)
    return t.startsWith("http://") || t.startsWith("https://") ? t : "https://" + t;
  const r = e?.includes("://") && !/^https?:\/\//i.test(e) ? void 0 : e;
  return yt(r) + i;
}
function Zi(t, e, i) {
  if (document.getElementById(t)) return;
  const n = document.head || document.body, r = document.createElement("script");
  r.id = t, r.type = "text/javascript", r.src = e, r.async = !0, r.crossOrigin = "anonymous", r.fetchPriority = "high", i?.onLoad && (r.onload = i.onLoad), i?.onError && (r.onerror = i.onError), n.appendChild(r);
}
function Le(t) {
  if (!t)
    return [];
  const e = ln(t);
  return e === void 0 ? (console.error("Settings string contains invalid JSON"), []) : e;
}
function en(t) {
  const e = t ? Le(t) : [], i = [], n = [];
  let r = !1;
  for (let s = 0; s < e.length; s++) {
    const o = e[s].value;
    o === "thank-you-journey" ? (r = !0, n.push(La)) : i.push(o);
  }
  return {
    roktExtensionsQueryParams: i,
    legacyRoktExtensions: n,
    loadThankYouElement: r
  };
}
async function Ha(t, e) {
  const i = [];
  if (e)
    for (const n of t)
      i.push(e.use(n));
  return Promise.all(i);
}
function tn(t) {
  if (!t)
    return {};
  const e = {};
  for (let i = 0; i < t.length; i++) {
    const n = t[i];
    e[n.jsmap] = n.value;
  }
  return e;
}
function nn(t) {
  const e = {};
  if (!Array.isArray(t))
    return e;
  for (let i = 0; i < t.length; i++) {
    const n = t[i];
    if (!n || !f(n.value) || !f(n.map))
      continue;
    const r = n.value, s = n.map;
    e[r] || (e[r] = []), e[r].push({
      eventAttributeKey: s,
      conditions: Array.isArray(n.conditions) ? n.conditions : []
    });
  }
  return e;
}
function rn(t, e, i) {
  return p().generateHash([t, e, i].join(""));
}
function Wa(t) {
  let n = "mParticle_wsdkv_" + p().getVersion() + "_kitv_" + "3.40.0";
  return t && (n += "_" + t), n;
}
function sn(t) {
  return !!(t && Ka.includes(t));
}
function $t(t) {
  const e = document.createElement("iframe");
  e.style.display = "none", e.setAttribute("sandbox", "allow-scripts allow-same-origin"), e.src = t, e.onload = function() {
    e.onload = null, e.parentNode && e.parentNode.removeChild(e);
  };
  const i = document.body || document.head;
  i && i.appendChild(e);
}
function on(t, e) {
  const i = re(window.location.origin);
  if (be._allowedOriginHashes.indexOf(i) === -1 || Math.random() >= Sa)
    return;
  const r = window.__rokt_li_guid__;
  if (!r || t && t.includes("://") && !/^https:\/\//i.test(t))
    return;
  const s = Wt(window.location.href), o = "version=" + encodeURIComponent(e ?? "") + "&launcherInstanceGuid=" + encodeURIComponent(r) + "&pageUrl=" + encodeURIComponent(s), a = t ? yt(t) : "https://apps.rokt.com";
  $t(a + "/v1/wsdk-init/index.html?" + o), $t(
    "https://" + Ta + "/v1/wsdk-init/index.html?" + o + "&isControl=true"
  );
}
function Ga() {
  return typeof window < "u" && !!window.location?.search?.toLowerCase().includes("mp_enable_logging=true");
}
function Ya() {
  if (typeof window > "u")
    return;
  const t = window.location?.href;
  return t ? Wt(t) : void 0;
}
function Ba() {
  return typeof window < "u" ? window.navigator?.userAgent : void 0;
}
class Cr {
  constructor() {
    this._logCount = {};
  }
  incrementAndCheck(e) {
    const n = (this._logCount[e] || 0) + 1;
    return this._logCount[e] = n, n > $a;
  }
}
class Re {
  constructor(e, i, n, r, s) {
    this._reporter = "mp-wsdk";
    const o = e.isLoggingEnabled;
    this._integrationName = i || "", this._launcherInstanceGuid = n, this._accountId = r || null, this._rateLimiter = s || new Cr(), this._isEnabled = Ga() || o;
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
          code: r || pi.UNKNOWN_ERROR,
          url: Ya(),
          deviceInfo: Ba(),
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
class an {
  constructor(e, i, n, r, s) {
    this._transport = new Re(e, i, n, r, s), this._errorUrl = wr(e?.errorUrl, e?.integrationDomain, ja);
  }
  report(e) {
    if (!e) return;
    const i = e.severity || ke.ERROR;
    this._transport.send(this._errorUrl, i, e.message, e.code, e.stackTrace);
  }
}
class cn {
  constructor(e, i, n, r, s, o) {
    this._intentObserveLines = 0, this._transport = new Re(e, n, r, s, o), this._placementDiagnosticTransport = new Re(
      e,
      n,
      r,
      s
    ), this._preselectOutcomeTransport = new Re(e, n, r, s), this._loggingUrl = wr(e?.loggingUrl, e?.integrationDomain, Va), this._errorReportingService = i;
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
      ke.INFO,
      i.message,
      i.code,
      void 0,
      (n) => {
        if (this._errorReportingService) {
          const r = typeof n.statusCode == "number";
          this._errorReportingService.report({
            message: "LoggingService: Failed to send log: " + n.message,
            code: pi.LOG_DELIVERY_FAILURE,
            severity: r ? ke.ERROR : ke.WARNING
          });
        }
      }
    );
  }
}
function za(t, e) {
  const i = Be(window.location.href), n = t.EventAttributes?.title, r = f(n) ? n : void 0, s = pn(t.EventAttributes, e) ? r : r || document.title, o = Mr(), a = t.ActiveTimeOnSite;
  return {
    pageUrl: i,
    sourceMessageId: t.SourceMessageId,
    timestamp: t.Timestamp,
    ...s ? { pageTitle: s } : {},
    ...o !== void 0 ? { canonicalUrl: o } : {},
    ...Number.isFinite(a) ? { activeTimeOnSite: a } : {}
  };
}
const ee = class ee {
  constructor() {
    this.name = G, this.id = Ye, this.moduleId = Ye, this.isInitialized = !1, this.launcher = null, this.filters = {}, this.userAttributes = {}, this.userIdentifiedInWorkspace = !1, this.testHelpers = null, this.placementEventMappingLookup = {}, this.placementEventAttributeMappingLookup = {}, this.integrationName = null, this.errorReportingService = null, this.loggingService = null, this._thankYouElementOnLoadCallback = null, this._isThankYouElementLoaded = !1, this._workspaceSearchInFlightPromise = null, this._launcherAttachState = da(), this._exitIntentConfig = null, this._exitIntentWatcher = new _a({
      isKitReady: () => this.isKitReady(),
      onExitIntent: (e, i) => this.handleExitIntent(e, i),
      onLeadCaptureSubmitted: (e) => this.applyIdentityCapturePayload(e.identities, e.userAttributes)
    }), this._exitIntentEnabledForAccount = !1, this._pendingInitWarnings = [], this._consentPrivacyWarnings = /* @__PURE__ */ new Set(), this._consentMappings = [], this._effectivePrivacyFlags = null, this._privacyControlLauncher = null, this._privacyControlUnsent = !1, this._isRefreshingConsentPrivacy = !1, this._hasDerivedPrivacyFlags = !1, this._isLauncherCreatedRestricted = !1, this._launcherBeforeCreation = null, this.accountId = null, this._preselectState = Jo(), this._identityCallCount = 0, this._lastNonModifyCallCount = 0, this._isModifyIdentityCallInProgress = !1;
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
    if (!e || !f(e.operator))
      return !1;
    const n = e.operator.toLowerCase(), r = e.attributeValue;
    return n === "exists" ? i !== null : i == null ? !1 : n === "equals" ? String(i) === String(r) : n === "contains" ? String(i).indexOf(String(r)) !== -1 : !1;
  }
  doesEventMatchRule(e, i) {
    if (!i || !f(i.eventAttributeKey))
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
      if (R(s))
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
      const r = Si(), s = za(e, i);
      r.push(s);
      const o = Math.min(r.length, gn), a = Nr(r);
      if (a === 0) {
        const c = wt() ? "quota" : "ls_unavailable";
        this.loggingService?.log({
          message: `Rokt Kit: Failed to persist page view for ${n} [reason: ${c}]`,
          code: "PAGE_VIEW_CAPTURE_FAILED"
        });
      } else a < o && this.loggingService?.log({
        message: `Rokt Kit: Page view storage reduced from ${o} to ${a} record(s) under quota pressure [reason: quota_eviction]`,
        code: "PAGE_VIEW_QUOTA_EVICTION"
      });
    } catch (r) {
      const s = wt() ? "exception" : "ls_unavailable", o = r instanceof Error ? r.message : String(r);
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
      return ti(this.accountId, e, i);
  }
  // The entry a speculative call was fired for, by the targetPageIdentifier its fire keys its records under.
  findFiredEntry(e) {
    if (this.isPreselectionEnabled())
      return Ze(this.accountId, e);
  }
  // What the speculative call for the entry keyed entryKey fills in over these attributes, the ones it was fired with.
  // An identity the call carries already holds its key, so a default never stands in for it.
  buildPreselectAttributeDefaults(e, i) {
    const n = this.findFiredEntry(e);
    if (!n)
      return;
    const r = ut(this.buildPreselectHost(), n, i), s = this.filters || {};
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
      isPreselectionPrivacyAllowed: () => this.isPreselectionPrivacyAllowedNow(),
      getCurrentUser: () => p().Identity?.getCurrentUser?.(),
      getCurrentHost: () => this.buildPreselectHost(),
      isTargetingDisabled: () => this.isTargetingDisabledNow(),
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
    ua(this._preselectState, this.buildPreselectHost());
  }
  isLauncherReadyToAttach() {
    return !!window.Rokt && W(window.Rokt.createLauncher);
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
    return n && e[n] && (i[ee.EMAIL_SHA256_KEY] = e[n]), n && delete i[n], i;
  }
  logSelectPlacementsEvent(e) {
    if (!window.mParticle || typeof p().logEvent != "function" || !E(e))
      return;
    const i = p().EventType.Other, n = {}, r = Object.keys(e);
    for (let s = 0; s < r.length; s++)
      Pa.indexOf(r[s].toLowerCase()) === -1 && (n[r[s]] = e[r[s]]);
    p().logEvent(Ia, i, n);
  }
  setRoktSessionId(e) {
    if (!(!e || typeof e != "string"))
      try {
        const i = p().getInstance();
        i && W(i.setIntegrationAttribute) && i.setIntegrationAttribute(Ye, {
          roktSessionId: e
        });
      } catch {
      }
  }
  readMpSessionId() {
    const e = p()?.sessionManager, i = e?.getSessionId ?? e?.getSession;
    if (W(i))
      return i.call(e) || void 0;
  }
  readMpDeviceId() {
    if (!this.isDeviceIdDisabled())
      return p()?.getDeviceId?.() || void 0;
  }
  attachLauncher(e, i, n = []) {
    fa(this._launcherAttachState, {
      accountId: e,
      launcherOptions: i || {},
      legacyRoktExtensions: n
    });
    const r = {
      accountId: e,
      ...i || {}
    };
    this.applyPrivacyFlagsToOptions(r, this._effectivePrivacyFlags || va), this._isLauncherCreatedRestricted = this._effectivePrivacyFlags !== null, this._launcherBeforeCreation = this.launcher;
    let s;
    return this.isPartnerInLocalLauncherTestGroup() ? s = Promise.resolve(window.Rokt.createLocalLauncher(r)) : s = window.Rokt.createLauncher(r), s.then(async (o) => {
      await Ha([...n], o), this.initRoktLauncher(o);
    }).catch((o) => {
      const a = this._launcherAttachState.lifecycle === "attached";
      if (pa(this._launcherAttachState), !a) {
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
    return ya(
      this._launcherAttachState,
      this.isLauncherReadyToAttach(),
      (e) => this.attachLauncher(e.accountId, e.launcherOptions, e.legacyRoktExtensions)
    );
  }
  initRoktLauncher(e) {
    window.Rokt && (window.Rokt.currentLauncher = e), this.launcher = e, this.refreshConsentPrivacy(), ga(this._launcherAttachState);
    const i = p().Rokt?.filters;
    i ? (!this.isInitialized && this.filters.filteredUser && (i.filteredUser = this.filters.filteredUser), this.filters = i, i.filteredUser ? this._workspaceSearchInFlightPromise = this.search(i.filteredUser) : console.warn("Rokt Kit: No filtered user has been set.")) : console.warn("Rokt Kit: No filters have been set."), this.isInitialized = !0, on(this.domain, this.integrationName), p().Rokt.attachKit(this), this.pushExitIntentExtensionConfig(), this.flushPendingPreselectDispatches();
  }
  // Leaving the hook unset is what keeps History unpatched for workspaces that never
  // preselect. The core SDK reads onCheckoutIntent when it has a signal, so an account without
  // pre-selection entries never hears one.
  armPreselectPathnameTrigger() {
    Pt(window.location.pathname), this.onRouteChange = Ge(this.accountId) ? () => {
      this.refreshConsentPrivacy(), this.evaluatePreselectPathname();
    } : void 0, this.armPreselectEmailInputListener(), this.onCheckoutIntent = Ge(this.accountId) ? (e) => {
      try {
        this.refreshConsentPrivacy(), Uo(this._preselectState, this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0, this.checkoutIntentSelectors = Ho(this.accountId), this.onPaymentPick = Ge(this.accountId) ? (e) => {
      try {
        this.refreshConsentPrivacy(), Vo(this._preselectState, this.buildPreselectHost(), e);
      } catch {
        return;
      }
    } : void 0;
  }
  // A guest often types their email after the trigger page view has queued for want of one, so a
  // committed email input retries the queue. Only accounts with an entry that reads the form listen.
  armPreselectEmailInputListener() {
    this._preselectEmailInputListener && (document.removeEventListener("input", this._preselectEmailInputListener, !0), document.removeEventListener("change", this._preselectEmailInputListener, !0), document.removeEventListener("blur", this._preselectEmailInputListener, !0), this._preselectEmailInputListener = void 0), to(this.accountId) && (this._preselectEmailInputListener = (e) => {
      this.refreshConsentPrivacy(), Rt(e), e.type === "change" && this._preselectState.pending.length > 0 && ta(this._preselectState, this.buildPreselectHost(), e) && this.flushPendingPreselectDispatches();
    }, document.addEventListener("input", this._preselectEmailInputListener, !0), document.addEventListener("change", this._preselectEmailInputListener, !0), document.addEventListener("blur", this._preselectEmailInputListener, !0));
  }
  // A core released without the check reads false, so its page views are judged by their marker alone.
  isAutoLogPageViewOn() {
    const e = p().Rokt;
    try {
      return W(e?.isAutoLogPageViewEnabled) && e.isAutoLogPageViewEnabled() === !0;
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
      return W(e?.isCheckoutIntentLive) && e.isCheckoutIntentLive() === !0;
    } catch {
      return !1;
    }
  }
  // True when the core SDK gives link clicks no checkout intent because this connection does not receive Auto Link
  // Click events. A core released without the check reads false, and turns intent off entirely in that case.
  isLinkIntentWithheld() {
    const e = p().Rokt;
    try {
      return W(e?.areAutoLinkClicksForwarded) && e.areAutoLinkClicksForwarded() === !1;
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
  // email has appeared, filtered or not; for a form email that replaced a malformed one, a malformed raw email or the
  // same address doesn't count.
  getFormEmailDropCause(e, i, n) {
    if (!this.isForwardingAllowed()) return "forwarding_disallowed";
    if (this.isTargetingDisabledNow() || !this.isPreselectionPrivacyAllowedNow()) return "privacy_signal";
    if (String(this.filters?.filteredUser?.getMPID?.() ?? "") !== String(i ?? "")) return "user_changed";
    const r = n === void 0 ? void 0 : pr(n);
    if (ci(this.buildPreselectHost(), e, {}, r)) return "partner_email";
  }
  // Whether this connection filters out the Email identity, or the identity mapped to the hashed email.
  isEmailIdentityFiltered() {
    const e = this.userIdentityFilters || [];
    if (e.includes(Ea))
      return !0;
    const i = this._mappedEmailSha256Key, n = p().IdentityType || {}, r = i ? Object.keys(n).find((o) => o.toLowerCase() === i) : void 0, s = r ? n[r] : void 0;
    return typeof s == "number" && e.includes(s);
  }
  evaluatePreselectPathname() {
    const e = window.location.pathname;
    Pt(e), e !== this._lastPreselectPathname && (this.isTargetingDisabled() || (this._lastPreselectPathname = e, Wo(this._preselectState, this.buildPreselectHost(), e), Wi(this._preselectState, this.buildPreselectHost(), e)));
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
  // What init launcherOptions already restrict today, with noDeviceId implying noTargeting and noFunctional.
  getInitPrivacyFlags() {
    const e = p().Rokt?.launcherOptions || {}, i = this.isDeviceIdDisabled();
    return {
      noTargeting: e.noTargeting === !0 || i,
      noFunctional: e.noFunctional === !0 || i,
      doNotShareOrSell: e.doNotShareOrSell === !0
    };
  }
  // Writes restricting flags into launcher options; an unrestricted flag goes back to its init value.
  applyPrivacyFlagsToOptions(e, i) {
    const n = p().Rokt?.launcherOptions || {};
    for (const r of He)
      i[r] ? e[r] = !0 : Object.prototype.hasOwnProperty.call(n, r) ? e[r] = n[r] : delete e[r];
  }
  // Values match the flag names in any letter case; an unknown value is reported rather than dropped silently.
  parseConsentMappings(e) {
    if (!Array.isArray(e)) return [];
    const i = [];
    for (const n of e) {
      if (!n || !f(n.map) || !f(n.value)) continue;
      const r = n.value.trim().toLowerCase(), s = He.find((a) => a.toLowerCase() === r);
      if (!s) {
        this.warnConsentPrivacyOnce(
          `mapping_value:${r}`,
          `Rokt Kit: consent mapping value "${n.value}" is not a privacy flag and is ignored`
        );
        continue;
      }
      const o = n.map.trim().toLowerCase();
      o.length > 0 && i.push({ map: o, value: s });
    }
    return i;
  }
  // Replaces only consent's contribution in core; never feeds combined flags back as init or page flags.
  // The effective flags are init launcherOptions OR core's flags (init, page and consent-derived). While they
  // restrict no more than init launcherOptions do, nothing here acts, so integrations without a mapping or a
  // page opt-out keep today's launcher options, storage and attributes.
  refreshConsentPrivacy(e = !1) {
    if (!this._isRefreshingConsentPrivacy) {
      this._isRefreshingConsentPrivacy = !0;
      try {
        this.applyConsentPrivacy(e);
      } finally {
        this._isRefreshingConsentPrivacy = !1;
      }
    }
  }
  applyConsentPrivacy(e) {
    const i = p().getInstance?.()?._CookieConsentManager, n = p().Identity?.getCurrentUser?.() || null, r = { noTargeting: !1, noFunctional: !1, doNotShareOrSell: !1 };
    if (this._consentMappings.length || this._hasDerivedPrivacyFlags) {
      const g = n?.getConsentState?.()?.getGDPRConsentState?.() || {};
      for (const m of this._consentMappings)
        Object.prototype.hasOwnProperty.call(g, m.map) && g[m.map]?.Consented === !1 && (r[m.value] = !0);
      i?.replaceDerivedFlags?.(r), this._hasDerivedPrivacyFlags = this._consentMappings.length > 0;
    }
    const s = this.getInitPrivacyFlags(), o = {
      noTargeting: s.noTargeting || r.noTargeting || i?.getNoTargeting?.() === !0,
      noFunctional: s.noFunctional || r.noFunctional || i?.getNoFunctional?.() === !0,
      doNotShareOrSell: s.doNotShareOrSell || r.doNotShareOrSell || i?.getDoNotShareOrSell?.() === !0
    }, a = He.some((g) => o[g] !== s[g]), c = this._effectivePrivacyFlags || s, l = !!this.launcher && this.launcher !== this._launcherBeforeCreation, u = this._isLauncherCreatedRestricted && l && this._privacyControlLauncher !== this.launcher;
    if (!a && !this._effectivePrivacyFlags && !u && !this._privacyControlUnsent || (this._effectivePrivacyFlags = a ? o : null, e)) return;
    c.noFunctional !== o.noFunctional && Ci(o.noFunctional), (o.noFunctional || o.noTargeting) && !(c.noFunctional || c.noTargeting) && Ti(), this.isPageHistoryAllowed() || (je(), $e()), c.noTargeting !== o.noTargeting && this._exitIntentEnabledForAccount && (this.configureExitIntentBridge(this.getEffectiveExitIntentConfig(this.accountId)), this.launcher && this.pushExitIntentExtensionConfig());
    const d = n?.getMPID?.() ?? null;
    if (n && (c.noTargeting !== o.noTargeting || o.noTargeting !== s.noTargeting && this._noTargetingSyncedMpid !== d)) {
      this._noTargetingSyncedMpid = d;
      try {
        i?.syncNoTargetingAttribute?.(n);
      } catch (g) {
        this.warnConsentPrivacyOnce(
          "no_targeting_sync",
          `Rokt Kit: $NoTargeting sync failed: ${g instanceof Error ? g.message : String(g)}`
        );
      }
    }
    const h = this._launcherAttachState.context;
    h && this.applyPrivacyFlagsToOptions(h.launcherOptions, o);
    const v = He.some((g) => c[g] !== o[g]);
    this.launcher && (v || this._privacyControlLauncher !== this.launcher) && this.sendPrivacyControl(this.launcher, o, l);
  }
  // A launcher marked as sent is never sent the same flags again, so it is marked only once the call is made,
  // and unmarked if the call fails, so the next refresh retries it.
  sendPrivacyControl(e, i, n) {
    if (n && (this._isLauncherCreatedRestricted = !1), !W(e.setPrivacyControl)) {
      this._privacyControlLauncher = e, this._consentMappings.length && this.warnConsentPrivacyOnce(
        "launcher_setter",
        "Rokt Kit: consent mapping is configured but the launcher cannot apply privacy changes after it loads"
      );
      return;
    }
    const r = (s) => {
      this._privacyControlLauncher === e && (this._privacyControlLauncher = null, this._privacyControlUnsent = !0), this.warnConsentPrivacyOnce(
        "launcher_setter_failed",
        `Rokt Kit: setPrivacyControl failed: ${s instanceof Error ? s.message : String(s)}`
      );
    };
    try {
      const s = e.setPrivacyControl(i);
      this._privacyControlLauncher = e, this._privacyControlUnsent = !1, Promise.resolve(s).catch(r);
    } catch (s) {
      r(s);
    }
  }
  // When the partner has opted out of targeting (noTargeting launcher option),
  // the kit must not collect behavioral targeting signals such as page views.
  isTargetingDisabled() {
    return this._effectivePrivacyFlags?.noTargeting === !0 || p().Rokt?.launcherOptions?.noTargeting === !0 || this.isDeviceIdDisabled();
  }
  // Core's normalizeRoktLauncherOptions turns noDeviceId or noDeviceID into noDeviceId, noFunctional and
  // noTargeting, but an older core passes either spelling through as written, so the kit applies the same rule.
  isDeviceIdDisabled() {
    const e = p()?.Rokt?.launcherOptions;
    return e?.noDeviceId === !0 || e?.noDeviceID === !0;
  }
  isPreselectionPrivacyAllowed() {
    return this._effectivePrivacyFlags?.doNotShareOrSell !== !0 && p().Rokt?.launcherOptions?.doNotShareOrSell !== !0 && navigator.globalPrivacyControl !== !0;
  }
  // Preselection reads the form and writes storage from browser callbacks and timers, outside any placement
  // dispatch, so its gates apply a consent change made since the last refresh before answering.
  isTargetingDisabledNow() {
    return this.refreshConsentPrivacy(), this.isTargetingDisabled();
  }
  isPreselectionPrivacyAllowedNow() {
    return this.refreshConsentPrivacy(), this.isPreselectionPrivacyAllowed();
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
    return sn(e) ? {
      identifier: Ma,
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
    return e ? f(e.identifier) && e.identifier.length > 0 ? e.identifier : f(e.placementIdentifier) && e.placementIdentifier.length > 0 ? e.placementIdentifier : null : null;
  }
  applyIdentityCapturePayload(e, i) {
    const n = {}, r = e.email;
    f(r) && r.length > 0 && (n.email = r);
    const s = e.mobile_number;
    f(s) && s.length > 0 && (n.mobile_number = s);
    const o = p().Identity?.modify;
    if (W(o) && Object.keys(n).length > 0)
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
    if (this.refreshConsentPrivacy(), !this._exitIntentConfig)
      return !1;
    const n = this.extractExitIntentIdentifier(this._exitIntentConfig);
    if (!n)
      return !1;
    try {
      const r = {
        identifier: n,
        attributes: {
          ...i,
          exitIntentReason: e
        }
      };
      r[bt] = !0;
      const s = p().Rokt?.selectPlacements?.(r);
      return Promise.resolve(s).catch(() => {
      }), !0;
    } catch {
      return !1;
    }
  }
  _recordInitWarning(e, i = "EXIT_INTENT_CONFIG_INVALID") {
    if (this.loggingService) {
      this.loggingService.log({ message: e, code: i });
      return;
    }
    this._pendingInitWarnings.push({ message: e, code: i });
  }
  // Each consent privacy problem is reported once per page, so a mapping that cannot apply is visible.
  warnConsentPrivacyOnce(e, i) {
    this._consentPrivacyWarnings.has(e) || (this._consentPrivacyWarnings.add(e), this._recordInitWarning(i, "CONSENT_PRIVACY_WARNING"));
  }
  _flushInitWarnings() {
    if (!(!this.loggingService || this._pendingInitWarnings.length === 0)) {
      for (let e = 0; e < this._pendingInitWarnings.length; e += 1)
        this.loggingService.log(this._pendingInitWarnings[e]);
      this._pendingInitWarnings = [];
    }
  }
  pushExitIntentExtensionConfig() {
    !this._exitIntentConfig || !W(window.Rokt?.setExtensionData) || window.Rokt.setExtensionData({
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
    const o = Le(e.consentMappingSDK);
    this._consentMappings = this.parseConsentMappings(o), this._consentMappings.length && !W(p().getInstance?.()?._CookieConsentManager?.replaceDerivedFlags) && this.warnConsentPrivacyOnce(
      "core_derived_flags",
      "Rokt Kit: consent mapping is configured but this mParticle SDK version cannot apply it"
    ), this.refreshConsentPrivacy(!0);
    const a = this._effectivePrivacyFlags?.noFunctional === !0 || p().Rokt?.launcherOptions?.noFunctional === !0 || this.isDeviceIdDisabled();
    Ci(a), a || this.isTargetingDisabled() ? Ti() : (Wr(), Br()), this.isPageHistoryAllowed() || (je(), $e());
    const c = e, l = c.accountId;
    this._identityCallCount = 0, this._lastNonModifyCallCount = 0, this._isModifyIdentityCallInProgress = !1, this._exitIntentEnabledForAccount = sn(l);
    const u = this._exitIntentEnabledForAccount ? this.getEffectiveExitIntentConfig(l) : null;
    this._exitIntentEnabledForAccount ? this.configureExitIntentBridge(u) : this.configureExitIntentBridge(null), this.accountId = l || null;
    const d = this.accountId ? Qs(this.accountId, c.preselectionConfig) : void 0;
    this.userAttributes = le(s), this.armPreselectPathnameTrigger(), this._onboardingExpProvider = c.onboardingExpProvider;
    const h = Le(c.placementEventMapping);
    this.placementEventMappingLookup = tn(h);
    const v = Le(
      c.placementEventAttributeMapping
    );
    this.placementEventAttributeMappingLookup = nn(v), c.hashedEmailUserIdentityType && (this._mappedEmailSha256Key = c.hashedEmailUserIdentityType.toLowerCase()), this._workspaceIdSyncApiKey = f(c.workspaceIdSyncApiKey) ? c.workspaceIdSyncApiKey : void 0;
    const g = p().Rokt?.domain, { roktExtensionsQueryParams: m, legacyRoktExtensions: T, loadThankYouElement: A } = en(
      c.roktExtensions
    ), C = this.applyExitIntentExtensionOverride(
      u,
      m
    ), _ = {
      ...p().Rokt?.launcherOptions || {}
    };
    this._effectivePrivacyFlags && this.applyPrivacyFlagsToOptions(_, this._effectivePrivacyFlags), this.integrationName = Wa(_.integrationName), _.integrationName = this.integrationName, this.domain = g;
    const k = {
      loggingUrl: c.loggingUrl,
      errorUrl: c.errorUrl,
      integrationDomain: g,
      isLoggingEnabled: p().config?.isLoggingEnabled === !0
    }, b = new an(
      k,
      this.integrationName,
      window.__rokt_li_guid__,
      c.accountId
    ), y = new cn(
      k,
      b,
      this.integrationName,
      window.__rokt_li_guid__,
      c.accountId
    );
    return this.errorReportingService = b, this.loggingService = y, this._flushInitWarnings(), d && y.log({
      message: `Rokt Kit: preselectionConfig setting is invalid [reason=${d}], using the built-in preselection config`,
      code: "PRESELECT_CONFIG_INVALID"
    }), p()._registerErrorReportingService && p()._registerErrorReportingService(b), p()._registerLoggingService && p()._registerLoggingService(y), n ? (this.testHelpers = {
      generateLauncherScript: Ji,
      generateThankYouElementScript: Qi,
      extractRoktExtensionConfig: en,
      hashEventMessage: rn,
      parseSettingsString: Le,
      generateMappedEventLookup: tn,
      generateMappedEventAttributeLookup: nn,
      sendAdBlockMeasurementSignals: on,
      createAutoRemovedIframe: $t,
      djb2: re,
      setAllowedOriginHashes: (I) => {
        ee._allowedOriginHashes = I;
      },
      ReportingTransport: Re,
      ErrorReportingService: an,
      LoggingService: cn,
      RateLimiter: Cr,
      ErrorCodes: pi,
      WSDKErrorSeverity: ke,
      resetLauncherAttachState: () => ma(this._launcherAttachState)
    }, this.attachLauncher(l, _), "Successfully initialized: " + G) : (A && (p().Rokt.flushOnShoppableAdsReadyMessageQueue?.(this), Zi(Ra, Qi(g), {
      onLoad: () => {
        this._isThankYouElementLoaded = !0, this._thankYouElementOnLoadCallback && this._thankYouElementOnLoadCallback();
      },
      onError: (I) => {
        console.error("Error loading Rokt Thank You Element script:", I);
      }
    })), this.isLauncherReadyToAttach() ? this.attachLauncher(l, _, T) : (Zi(ka, Ji(g, C), {
      onLoad: () => {
        this.isLauncherReadyToAttach() ? (this.refreshConsentPrivacy(), this.attachLauncher(l, _, T)) : console.error("Rokt object is not available after script load.");
      },
      onError: (I) => {
        console.error("Error loading Rokt launcher script:", I);
      }
    }), this.captureTiming(ee.PERFORMANCE_MARKS.RoktScriptAppended)), "Successfully initialized: " + G);
  }
  process(e) {
    if (this.refreshConsentPrivacy(), e.EventDataType === zi && Pt(window.location.pathname), !this.isTargetingDisabled()) {
      if (e.EventDataType === zi) {
        if (this._exitIntentEnabledForAccount && this._exitIntentWatcher.resetPageViewState(), this.isPageHistoryAllowed()) {
          const i = this.isAutoLogPageViewOn();
          Ur(this.loggingService, e.EventAttributes, i), this.capturePageView(e, i);
        } else
          je(), $e();
        Ae(this._preselectState, this.buildPreselectHost(), e), Wi(this._preselectState, this.buildPreselectHost());
      }
      tt(e) && xo(this.buildPreselectHost(), e), Go(this.accountId, e.EventName) && Xo(this._preselectState, this.buildPreselectHost(), e);
    }
    if (e.EventDataType === Da && (je(), $e(), ai(this._preselectState), this.accountId && (ue(this.accountId), Li(this.accountId), Oi(this.accountId))), !this.isKitReady())
      return "Kit not ready for forwarder: " + G;
    if (W(p().Rokt?.setLocalSessionAttribute) && !tt(e) && (R(this.placementEventAttributeMappingLookup) || this.applyPlacementEventAttributeMapping(e), !R(this.placementEventMappingLookup))) {
      const i = rn(e.EventDataType, e.EventCategory, e.EventName ?? "");
      this.placementEventMappingLookup[String(i)] && p().Rokt.setLocalSessionAttribute?.(this.placementEventMappingLookup[String(i)], !0);
    }
    return "Successfully sent to forwarder: " + G;
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
    return n && this.forgetCartAdd(), (qo(this.accountId, e) || Fe(e, this._mappedEmailSha256Key) || n) && this.flushPendingPreselectDispatches(), "Successfully set user attribute for forwarder: " + G;
  }
  // The page's cart attribute or a logout replaces a remembered add-to-cart click. Under noTargeting, or for an account
  // that never remembers one, nothing is written to the device.
  forgetCartAdd() {
    this.refreshConsentPrivacy(), this.accountId && ps(this.accountId, !this.isTargetingDisabled() && yo(this.accountId));
  }
  removeUserAttribute(e) {
    return delete this.userAttributes[e], Ui(this.accountId, e) && this.forgetCartAdd(), "Successfully removed user attribute for forwarder: " + G;
  }
  handleIdentityComplete(e, i) {
    return this.userAttributes = le(e.getAllUserAttributes()), "Successfully called " + i + " for forwarder: " + G;
  }
  onUserIdentified(e) {
    this._isModifyIdentityCallInProgress ? this._isModifyIdentityCallInProgress = !1 : (this._identityCallCount += 1, this._lastNonModifyCallCount = this._identityCallCount), this.refreshConsentPrivacy();
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
        f(l) && l.length > 0 && (s[c] = l);
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
    return this._isModifyIdentityCallInProgress = !1, this._identityCallCount += 1, this._lastNonModifyCallCount = this._identityCallCount, this.userIdentifiedInWorkspace = !1, this._workspaceSearchInFlightPromise = null, this._workspaceLastSearchedIdentitiesKey = void 0, this.accountId && (ue(this.accountId), Li(this.accountId), Oi(this.accountId), this.forgetCartAdd()), this.handleIdentityComplete(e, "onLogoutComplete");
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
    this.refreshConsentPrivacy();
    const i = this.currentUserSnapshot(), n = this.recreateLauncherIfTerminated();
    if (n) {
      const r = this._workspaceSearchInFlightPromise, s = r ? Promise.race([
        r,
        new Promise((o) => setTimeout(o, qi))
      ]) : Promise.resolve();
      return Promise.all([n, s]).then(
        () => this._dispatchPlacements(e, i)
      );
    }
    if (this._workspaceSearchInFlightPromise) {
      const r = this._workspaceSearchInFlightPromise;
      return Promise.race([
        r,
        new Promise((s) => setTimeout(s, qi))
      ]).then(() => this._dispatchPlacements(e, i));
    }
    return this._dispatchPlacements(e);
  }
  // Whether a pre-selection call's identifier is still the value of its entry's targetPageIdentifierAttribute among the
  // attributes the workspace's attribute filter lets the call send. A call for an entry with a fixed
  // targetPageIdentifier always is. The entry is the one the fire named, else the one its identifier keys.
  isPreselectTargetAllowed(e, i) {
    const n = i.identifier, r = f(e) ? e : f(n) ? n : void 0, s = Ze(this.accountId, r);
    if (s?.targetPageIdentifierAttribute === void 0)
      return !0;
    const o = E(i.attributes) ? i.attributes : {};
    return Ie(s, this.filterPreselectAttributes(o)) === n;
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
    const n = { ...le(this.userAttributes), ...e }, r = this.filterPreselectAttributes(n), s = this.returnUserIdentities(this.filters?.filteredUser || null), o = Ki(
      this.accountId,
      i ? Ft(r, this.buildPreselectAttributeDefaults(i, e)) : r,
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
        (i) => f(i) && i !== ""
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
    const r = n?.getUserIdentities?.()?.userIdentities || {}, s = this._mappedEmailSha256Key, o = i[ee.EMAIL_SHA256_KEY] || (s ? i[s] : void 0), a = [];
    return i.email && a.push([i.email, r.email]), o && a.push([o, s ? r[s] : void 0]), a.length === 0 ? !e.hasIdentities : a.every(([c, l]) => f(c) && c === l);
  }
  // Reports why a pre-selection call was dropped and undoes the records its fire wrote: a dropped call is not the
  // checkout's pre-selection, so it must not hold off the next fire.
  dropPreselect(e, i, n) {
    this.loggingService?.logPlacementDiagnostic(Xt("missed", i, n)), e?.();
  }
  _dispatchPlacements(e, i) {
    this.refreshConsentPrivacy();
    const n = e ? ia(e) : void 0;
    if (e?.preselect === !0 && !Jt(this.buildPreselectHost())) {
      n?.();
      return;
    }
    if (e?.[bt] === !0 && this.isTargetingDisabled())
      return;
    const r = e?.[it], s = e?.[xt], o = e?.[Vt], a = { ...e };
    if (delete a[it], delete a[xt], delete a[Vt], delete a[bt], e = a, e.preselect === !0 && !this.isPreselectTargetAllowed(o, e))
      return this.dropPreselect(n, "no_target_page_identifier", { cause: "filtered" });
    if (s !== void 0) {
      const ie = E(s) ? s : {}, pe = ie.requireLogin !== !1;
      if (!this.isStillCurrentUser(String(ie.mpid ?? ""), pe))
        return this.dropPreselect(n, pe ? "logged_in_dropped" : "user_changed_dropped");
    }
    const c = i !== void 0 && this.hasUserChangedSince(i), l = c && i?.hasIdentities === !0;
    if (i && c && !this.mayGoOutForNewUser(i, E(e.attributes) ? e.attributes : {})) {
      if (e.preselect === !0)
        return this.dropPreselect(n, i.loggedIn ? "logged_in_dropped" : "user_changed_dropped");
      this.loggingService?.log({
        message: "Rokt Kit: Dropped a selectPlacements call whose user changed while it waited",
        code: "SELECT_PLACEMENTS_USER_CHANGED"
      }), n?.();
      return;
    }
    const u = E(r) ? r : void 0, d = u && f(u.key) ? u.key : void 0;
    if (d) {
      const ie = L(e.attributes || {}, d), pe = u.replaced === !0 && f(ie) ? ie : void 0, Ai = this.getFormEmailDropCause(d, u.mpid, pe);
      if (Ai)
        return this.dropPreselect(n, "form_email_dropped", { cause: Ai });
    }
    const h = e.attributes || {}, v = le(this.userAttributes), g = { ...v, ...h }, m = this.filters || {}, T = m.userAttributeFilters || [], A = m.filteredUser || null, C = A ? A.getMPID() : null;
    let _;
    m ? m.filterUserAttributes ? _ = m.filterUserAttributes(g, T) : _ = g : (console.warn("Rokt Kit: No filters available, using user attributes"), _ = g);
    const k = le(_);
    d && (Object.prototype.hasOwnProperty.call(v, d) ? k[d] = v[d] : delete k[d]), this.userAttributes = k;
    const b = this._onboardingExpProvider === "Optimizely" ? this.fetchOptimizely() : {}, y = this.returnUserIdentities(A), I = this.returnLocalSessionAttributes(), F = this.isPageHistoryAllowed(), w = F ? Fr(Si()) : [], H = F ? Kr() : null, Z = this.readMpSessionId(), z = this.readMpDeviceId(), Q = typeof e.identifier == "string" ? e.identifier : void 0, U = f(o) ? o : Q, x = e.preselect !== !0 && this.isPreselectionEnabled() && Fn(this.accountId) ? this.filterPreselectAttributes(eo(v, h)) : {}, he = e.preselect === !0 ? this.findFiredEntry(U) : this.findCacheConfigEntry(Q, x), Ve = e.preselect === !0 ? this.buildPreselectAttributeDefaults(U, h) : void 0, mi = e.preselect === !0 ? Ki(
      this.accountId,
      Ft(_, Ve),
      he
    ) : _, X = {
      ...y,
      ...mi,
      ...b,
      ...I,
      ...w.length ? { [Na]: JSON.stringify(w) } : {},
      ...H ? { [Fa]: H } : {},
      ...!l && this.userIdentifiedInWorkspace ? { [Oa]: !0 } : {},
      ...Z ? { [Ua]: Z } : {},
      ...z ? { [Xi]: z } : {},
      mpid: C
    };
    this.isDeviceIdDisabled() && delete X[Xi], e.preselect !== !0 && Eo(this.buildPreselectHost(), Q, X, x);
    const _t = mi[gr];
    if (e.preselect === !0 && f(_t) && (_t.indexOf("intent_") === 0 || _t.indexOf("pageview_cart|") === 0) && !Kn(X, this._mappedEmailSha256Key))
      return this.dropPreselect(n, "no_strict_email", { cause: "lost_before_dispatch" });
    const yi = fo(
      he,
      Ve,
      X,
      Q
    ), _i = go(he, Ve, X), vi = po(
      he,
      X,
      e.preselect !== !0
    );
    delete X[Fi];
    const Ei = Bn(Ve, X);
    Ei && (X[Fi] = Ei);
    const Tr = {
      ...e,
      attributes: X,
      ...he ? { cacheMatchKeys: zn(he) } : {},
      ...yi ? { cacheIdentityKeys: yi } : {},
      ..._i ? { cacheMatchValues: _i } : {},
      ...vi ? { cacheMatchTokens: vi } : {}
    }, vt = this.currentUserSnapshot(), Et = i?.loggedIn && !c && !vt.loggedIn ? { ...vt, loggedIn: !0, identityCallCount: i.identityCallCount } : vt, Ii = this.launcher.selectPlacements(Tr), Pi = e.preselect === !0, Sr = () => {
      if (!Pi) {
        if (this.hasUserChangedSince(Et) && (Et.loggedIn || Et.hasIdentities)) {
          this.loggingService?.log({
            message: "Rokt Kit: Skipped the selectPlacements event because its user changed before the selection resolved",
            code: "SELECT_PLACEMENTS_EVENT_USER_CHANGED"
          });
          return;
        }
        this.logSelectPlacementsEvent(X);
      }
    };
    return Promise.resolve(Ii).then((ie) => {
      if (!Pi)
        return this.trackPlacementEngagement(ie), ie?.context?.sessionId?.then((pe) => this.setRoktSessionId(pe));
    }).catch(() => {
    }).finally(Sr), Ii;
  }
  // Logs each press of a placement's response buttons, and each close, as an auto button click. The
  // placement's frame keeps its buttons and text from the page, so only the response kind goes out.
  trackPlacementEngagement(e) {
    if (!e || !W(e.on))
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
        Ca
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
        typeof a == "string" && a.length <= 253 && wa.test(a.toLowerCase()) ? a.toLowerCase() : void 0
      );
    });
  }
  // Checked when each click is logged, since the launcher calls back outside core's own gates.
  canLogPlacementClick() {
    return this.isCheckoutIntentActive() && this.isForwardingAllowed() && W(p().logEvent);
  }
  logPlacementEngagement(e, i) {
    this.canLogPlacementClick() && p().logEvent(Aa, p().EventType.Other, {
      is_auto_button_click: !0,
      is_rokt_placement_click: !0,
      element: "button",
      type: "button",
      label_source: Bi,
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
      label_source: Bi,
      hostname: window.location.hostname,
      link_type: "external",
      rokt_placement_id: e
    };
    i && (n.link_domain = i), p().logEvent(ba, p().EventType.Other, n);
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
    return this.isKitReady() ? !e || !f(e) ? Promise.reject(new Error("Rokt Kit: Invalid extension name")) : this.launcher.use(e) : (console.error("Rokt Kit: Not initialized"), Promise.reject(new Error("Rokt Kit: Not initialized")));
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
    return this.isKitReady() ? (ha(this._launcherAttachState), this.launcher.terminate()) : (console.error("Rokt Kit: Not initialized"), Promise.resolve());
  }
  /**
   * Registers a callback to be invoked once rokt-thank-you-element.js becomes available.
   */
  onShoppableAdsReady(e) {
    this._isThankYouElementLoaded ? e() : this._thankYouElementOnLoadCallback = e;
  }
};
ee._allowedOriginHashes = [-553112570, 549508659], ee.PERFORMANCE_MARKS = {
  RoktScriptAppended: "mp:RoktScriptAppended"
}, ee.EMAIL_SHA256_KEY = "emailsha256";
let be = ee;
function Xa() {
  return Ye;
}
function qa(t) {
  if (!t) {
    window.console.log("You must pass a config object to register the kit " + G);
    return;
  }
  if (!E(t)) {
    window.console.log("'config' must be an object. You passed in a " + typeof t);
    return;
  }
  E(t.kits) ? t.kits[G] = {
    constructor: be
  } : (t.kits = {}, t.kits[G] = {
    constructor: be
  }), window.console.log("Successfully registered " + G + " to your mParticle configuration");
}
typeof window < "u" && window.mParticle && p().addForwarder && p().addForwarder({
  name: G,
  constructor: be,
  getId: Xa
});
export {
  qa as register
};
//# sourceMappingURL=Rokt-Kit.esm.js.map
