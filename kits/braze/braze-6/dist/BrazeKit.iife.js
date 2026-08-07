console.info('[mParticle QA kit path smoke] Loaded kits/braze/braze-6/dist/BrazeKit.iife.js from monorepo GitHub path');
var mpBrazeKitV6 = (function (exports) {

	function getAugmentedNamespace(n) {
	  var f = n.default;
		if (typeof f == "function") {
			var a = function () {
				return f.apply(this, arguments);
			};
			a.prototype = f.prototype;
	  } else a = {};
	  Object.defineProperty(a, '__esModule', {value: true});
		Object.keys(n).forEach(function (k) {
			var d = Object.getOwnPropertyDescriptor(n, k);
			Object.defineProperty(a, k, d.get ? d : {
				enumerable: true,
				get: function () {
					return n[k];
				}
			});
		});
		return a;
	}

	const E = {
	  init: function (n) {
	    (void 0 === n && void 0 !== E.zg) || (E.zg = !!n), E.i || (E.i = !0);
	  },
	  destroy: function () {
	    (E.i = !1), (E.zg = void 0), (E.Rd = void 0);
	  },
	  setLogger: function (n) {
	    "function" == typeof n
	      ? (E.init(), (E.Rd = n))
	      : E.info("Ignoring setLogger call since logger is not a function");
	  },
	  toggleLogging: function () {
	    E.init(),
	      E.zg
	        ? (console.log("Disabling Braze logging"), (E.zg = !1))
	        : (console.log("Enabled Braze logging"), (E.zg = !0));
	  },
	  info: function (n) {
	    if (E.zg) {
	      const o = "Braze: " + n;
	      null != E.Rd ? E.Rd(o) : console.log(o);
	    }
	  },
	  warn: function (n) {
	    if (E.zg) {
	      const o = "Braze SDK Warning: " + n + " (v6.5.0)";
	      null != E.Rd ? E.Rd(o) : console.warn(o);
	    }
	  },
	  error: function (n) {
	    if (E.zg) {
	      const o = "Braze SDK Error: " + n + " (v6.5.0)";
	      null != E.Rd ? E.Rd(o) : console.error(o);
	    }
	  },
	};
	var E$1 = E;

	const ui = {
	  Nu: function (t) {
	    const r = (t + "=".repeat((4 - (t.length % 4)) % 4))
	        .replace(/\-/g, "+")
	        .replace(/_/g, "/"),
	      n = atob(r),
	      o = new Uint8Array(n.length);
	    for (let t = 0; t < n.length; ++t) o[t] = n.charCodeAt(t);
	    return o;
	  },
	};

	const f = {
	    CustomEvent: "ce",
	    Pr: "p",
	    jd: "pc",
	    ev: "ca",
	    Fl: "i",
	    wl: "ie",
	    Xt: "cci",
	    Zt: "ccic",
	    Lt: "ccc",
	    Qt: "ccd",
	    Sm: "ss",
	    hm: "se",
	    wn: "si",
	    zn: "sc",
	    Sn: "sbc",
	    tv: "sfe",
	    om: "iec",
	    yd: "lr",
	    kd: "uae",
	    Dd: "lcaa",
	    Ad: "lcar",
	    Zu: "inc",
	    Qu: "add",
	    Xu: "rem",
	    Yu: "set",
	    Vu: "ncam",
	    $d: "sgu",
	    xo: "ffi",
	    ro: "bi",
	    ut: "bc",
	  };

	const P = {
	  se: function () {
	    if ("undefined" != typeof window && window.crypto) {
	      if ("function" == typeof window.crypto.randomUUID)
	        return window.crypto.randomUUID();
	      if ("function" == typeof window.crypto.getRandomValues)
	        try {
	          const n = new Uint8Array(16);
	          window.crypto.getRandomValues(n),
	            (n[6] = (15 & n[6]) | 64),
	            (n[8] = (63 & n[8]) | 128);
	          const t = Array.from(n, (n) => ("0" + n.toString(16)).slice(-2));
	          return [
	            t.slice(0, 4).join(""),
	            t.slice(4, 6).join(""),
	            t.slice(6, 8).join(""),
	            t.slice(8, 10).join(""),
	            t.slice(10, 16).join(""),
	          ].join("-");
	        } catch (n) {}
	    }
	    const n = (n = !1) => {
	      const t = (Math.random().toString(16) + "000000000").substr(2, 8);
	      return n ? "-" + t.substr(0, 4) + "-" + t.substr(4, 4) : t;
	    };
	    return n() + n(!0) + n(!0) + n();
	  },
	};
	var P$1 = P;

	class et {
	  constructor(t, e) {
	    (this.database = t),
	      (this.Rd = e),
	      (this.parent = "undefined" == typeof window ? self : window),
	      (this.database = t),
	      (this.Rd = e);
	  }
	  Ud() {
	    if ("indexedDB" in this.parent) return this.parent.indexedDB;
	  }
	  isSupported() {
	    var t;
	    try {
	      if (null == this.Ud()) return !1;
	      {
	        const e =
	          null === (t = this.Ud()) || void 0 === t
	            ? void 0
	            : t.open("Braze IndexedDB Support Test");
	        if (
	          (e &&
	            ((e.onupgradeneeded = () => e.result.close()),
	            (e.onsuccess = () => e.result.close())),
	          "undefined" != typeof window)
	        ) {
	          const t = window,
	            e = t.chrome || t.browser || t.Od;
	          if (e && e.runtime && e.runtime.id)
	            return (
	              this.Rd.info(
	                "Not using IndexedDB for storage because we are running inside an extension",
	              ),
	              !1
	            );
	        }
	        return !0;
	      }
	    } catch (t) {
	      return (
	        this.Rd.info(
	          "Not using IndexedDB for storage due to following error: " + t,
	        ),
	        !1
	      );
	    }
	  }
	  Kd(t, e) {
	    var n;
	    const o =
	      null === (n = this.Ud()) || void 0 === n
	        ? void 0
	        : n.open(this.database.Ld, this.database.VERSION);
	    if (null == o) return "function" == typeof e && e(), !1;
	    const i = this;
	    return (
	      (o.onupgradeneeded = (t) => {
	        var e;
	        i.Rd.info(
	          "Upgrading indexedDB " +
	            i.database.Ld +
	            " to v" +
	            i.database.VERSION +
	            "...",
	        );
	        const n = null === (e = t.target) || void 0 === e ? void 0 : e.result;
	        for (const t in i.database.Fs) {
	          const e = t;
	          i.database.Fs.hasOwnProperty(t) &&
	            !n.objectStoreNames.contains(i.database.Fs[e]) &&
	            n.createObjectStore(i.database.Fs[e]);
	        }
	      }),
	      (o.onsuccess = (n) => {
	        var o;
	        const r = null === (o = n.target) || void 0 === o ? void 0 : o.result;
	        (r.onversionchange = () => {
	          r.close(),
	            "function" == typeof e && e(),
	            i.Rd.error(
	              "Needed to close the database unexpectedly because of an upgrade in another tab",
	            );
	        }),
	          t(r);
	      }),
	      (o.onerror = (t) => {
	        var n;
	        const o = t;
	        return (
	          i.Rd.info(
	            "Could not open indexedDB " +
	              i.database.Ld +
	              " v" +
	              i.database.VERSION +
	              ": " +
	              (null === (n = o.target) || void 0 === n ? void 0 : n.errorCode),
	          ),
	          "function" == typeof e && e(),
	          !0
	        );
	      }),
	      !0
	    );
	  }
	  setItem(t, e, n, o, i) {
	    if (!this.isSupported()) return "function" == typeof i && i(), !1;
	    const r = this;
	    return this.Kd((d) => {
	      if (!d.objectStoreNames.contains(t))
	        return (
	          r.Rd.error(
	            "Could not store object " +
	              e +
	              " in " +
	              t +
	              " on indexedDB " +
	              r.database.Ld +
	              " - " +
	              t +
	              " is not a valid objectStore",
	          ),
	          "function" == typeof i && i(),
	          void d.close()
	        );
	      const s = d.transaction([t], "readwrite");
	      s.oncomplete = () => d.close();
	      const u = s.objectStore(t).put(n, e);
	      (u.onerror = () => {
	        r.Rd.error(
	          "Could not store object " +
	            e +
	            " in " +
	            t +
	            " on indexedDB " +
	            r.database.Ld,
	        ),
	          "function" == typeof i && i();
	      }),
	        (u.onsuccess = () => {
	          "function" == typeof o && o();
	        });
	    }, i);
	  }
	  getItem(t, e, n) {
	    if (!this.isSupported()) return !1;
	    const o = this;
	    return this.Kd((i) => {
	      if (!i.objectStoreNames.contains(t))
	        return (
	          o.Rd.error(
	            "Could not retrieve object " +
	              e +
	              " in " +
	              t +
	              " on indexedDB " +
	              o.database.Ld +
	              " - " +
	              t +
	              " is not a valid objectStore",
	          ),
	          void i.close()
	        );
	      const r = i.transaction([t], "readonly");
	      r.oncomplete = () => i.close();
	      const d = r.objectStore(t).get(e);
	      (d.onerror = () => {
	        o.Rd.error(
	          "Could not retrieve object " +
	            e +
	            " in " +
	            t +
	            " on indexedDB " +
	            o.database.Ld,
	        );
	      }),
	        (d.onsuccess = (t) => {
	          var e;
	          const o = null === (e = t.target) || void 0 === e ? void 0 : e.result;
	          null != o && n(o);
	        });
	    });
	  }
	  kr(t, e, n) {
	    if (!this.isSupported()) return "function" == typeof n && n(), !1;
	    const o = this;
	    return this.Kd((i) => {
	      if (!i.objectStoreNames.contains(t))
	        return (
	          o.Rd.error(
	            "Could not retrieve last record from " +
	              t +
	              " on indexedDB " +
	              o.database.Ld +
	              " - " +
	              t +
	              " is not a valid objectStore",
	          ),
	          "function" == typeof n && n(),
	          void i.close()
	        );
	      const r = i.transaction([t], "readonly");
	      r.oncomplete = () => i.close();
	      const d = r.objectStore(t).openCursor(null, "prev");
	      (d.onerror = () => {
	        o.Rd.error(
	          "Could not open cursor for " + t + " on indexedDB " + o.database.Ld,
	        ),
	          "function" == typeof n && n();
	      }),
	        (d.onsuccess = (t) => {
	          var o;
	          const i = null === (o = t.target) || void 0 === o ? void 0 : o.result;
	          null != i && null != i.value && null != i.key
	            ? e(i.key, i.value)
	            : "function" == typeof n && n();
	        });
	    }, n);
	  }
	  je(t, e) {
	    if (!this.isSupported()) return !1;
	    const n = this;
	    return this.Kd((o) => {
	      if (!o.objectStoreNames.contains(t))
	        return (
	          n.Rd.error(
	            "Could not delete record " +
	              e +
	              " from " +
	              t +
	              " on indexedDB " +
	              n.database.Ld +
	              " - " +
	              t +
	              " is not a valid objectStore",
	          ),
	          void o.close()
	        );
	      const i = o.transaction([t], "readwrite");
	      i.oncomplete = () => o.close();
	      i.objectStore(t).delete(e).onerror = () => {
	        n.Rd.error(
	          "Could not delete record " +
	            e +
	            " from " +
	            t +
	            " on indexedDB " +
	            n.database.Ld,
	        );
	      };
	    });
	  }
	  Ds(t, e) {
	    if (!this.isSupported()) return !1;
	    const n = this;
	    return this.Kd((o) => {
	      if (!o.objectStoreNames.contains(t))
	        return (
	          n.Rd.error(
	            "Could not retrieve objects from " +
	              t +
	              " on indexedDB " +
	              n.database.Ld +
	              " - " +
	              t +
	              " is not a valid objectStore",
	          ),
	          void o.close()
	        );
	      const i = o.transaction([t], "readwrite");
	      i.oncomplete = () => o.close();
	      const r = i.objectStore(t),
	        d = r.openCursor(),
	        s = [];
	      (d.onerror = () => {
	        s.length > 0
	          ? (n.Rd.info(
	              "Cursor closed midway through for " +
	                t +
	                " on indexedDB " +
	                n.database.Ld,
	            ),
	            e(s))
	          : n.Rd.error(
	              "Could not open cursor for " +
	                t +
	                " on indexedDB " +
	                n.database.Ld,
	            );
	      }),
	        (d.onsuccess = (t) => {
	          var n;
	          const o = null === (n = t.target) || void 0 === n ? void 0 : n.result;
	          if (null != o) {
	            if (null != o.value && null != o.key) {
	              r.delete(o.key).onsuccess = () => {
	                s.push(o.value);
	              };
	            }
	            "function" == typeof o.continue && o.continue();
	          } else s.length > 0 && e(s);
	        });
	    });
	  }
	  clearData() {
	    if (!this.isSupported()) return !1;
	    const t = [];
	    for (const e in this.database.Fs) {
	      const n = e;
	      this.database.Fs.hasOwnProperty(e) &&
	        this.database.Fs[n] !== this.database.Fs.be &&
	        t.push(this.database.Fs[n]);
	    }
	    const e = this;
	    return this.Kd(function (n) {
	      const o = n.transaction(t, "readwrite");
	      o.oncomplete = () => n.close();
	      for (let n = 0; n < t.length; n++) {
	        const i = t[n];
	        o.objectStore(i).clear().onerror = function () {
	          e.Rd.error(
	            "Could not clear " +
	              this.source.name +
	              " on indexedDB " +
	              e.database.Ld,
	          );
	        };
	      }
	      o.onerror = function () {
	        e.Rd.error(
	          "Could not clear object stores on indexedDB " + e.database.Ld,
	        );
	      };
	    });
	  }
	}
	et.Us = {
	  Rs: {
	    Ld: "AppboyServiceWorkerAsyncStorage",
	    VERSION: 6,
	    Fs: {
	      Ze: "data",
	      vr: "pushClicks",
	      Fu: "pushSubscribed",
	      Gd: "fallbackDevice",
	      As: "cardUpdates",
	      be: "optOut",
	      zr: "pendingData",
	      qh: "sdkAuthenticationSignature",
	    },
	    fe: 1,
	  },
	};

	var $t = {
	  Ph: "allowCrawlerActivity",
	  Wh: "baseUrl",
	  Vh: "noCookies",
	  Kh: "devicePropertyAllowlist",
	  La: "disablePushTokenMaintenance",
	  $h: "enableLogging",
	  Yh: "enableSdkAuthentication",
	  Ka: "manageServiceWorkerExternally",
	  Xh: "minimumIntervalBetweenTriggerActionsInSeconds",
	  Zh: "sessionTimeoutInSeconds",
	  Qh: "appVersion",
	  Xa: "appVersionNumber",
	  Ga: "serviceWorkerLocation",
	  Ia: "safariWebsitePushId",
	  Wa: "localization",
	  er: "contentSecurityNonce",
	  te: "allowUserSuppliedJavascript",
	  $a: "inAppMessageZIndex",
	  Ja: "openInAppMessagesInNewTab",
	  Oh: "requireExplicitInAppMessageDismissal",
	  Za: "doNotLoadFontAwesome",
	  tl: "deviceId",
	  Ha: "serviceWorkerScope",
	  Ne: "dustHost",
	  il: "sdkFlavor",
	  tn: "openCardsInNewTab",
	};

	function values(t) {
	  const e = [];
	  let r;
	  for (const n in t)
	    (r = n),
	      Object.prototype.hasOwnProperty.call(t, r) &&
	        void 0 !== t[r] &&
	        e.push(t[r]);
	  return e;
	}
	function validateValueIsFromEnum(t, e, r, n) {
	  const o = values(t);
	  return (
	    -1 !== o.indexOf(e) ||
	    (E$1.error(`${r} Valid values from ${n} are "${o.join('"/"')}".`), !1)
	  );
	}
	function isArray(t) {
	  return Array.isArray
	    ? Array.isArray(t)
	    : "[object Array]" === Object.prototype.toString.call(t);
	}
	function isDate(t) {
	  return "[object Date]" === Object.prototype.toString.call(t);
	}
	function isObject$1(t) {
	  return "[object Object]" === Object.prototype.toString.call(t);
	}
	function keys(t) {
	  const e = [];
	  for (const r in t) Object.prototype.hasOwnProperty.call(t, r) && e.push(r);
	  return e;
	}
	function isEqual(t, e) {
	  if (t === e) return 0 !== t || 1 / t == 1 / e;
	  if (null == t || null == e) return t === e;
	  const r = t.toString();
	  if (r !== e.toString()) return !1;
	  switch (r) {
	    case "[object RegExp]":
	    case "[object String]":
	      return "" + t == "" + e;
	    case "[object Number]":
	      return +t != +t ? +e != +e : 0 == +t ? 1 / +t == 1 / e : +t == +e;
	    case "[object Date]":
	    case "[object Boolean]":
	      return +t == +e;
	  }
	  const n = "[object Array]" === r;
	  if (!n) {
	    if ("object" != typeof t || "object" != typeof e) return !1;
	    const r = t.constructor,
	      n = e.constructor;
	    if (
	      r !== n &&
	      !(
	        "function" == typeof r &&
	        r instanceof r &&
	        "function" == typeof n &&
	        n instanceof n
	      ) &&
	      "constructor" in t &&
	      "constructor" in e
	    )
	      return !1;
	  }
	  const o = [],
	    c = [];
	  let i = o.length;
	  for (; i--; ) if (o[i] === t) return c[i] === e;
	  if ((o.push(t), c.push(e), n)) {
	    if (((i = t.length), i !== e.length)) return !1;
	    for (; i--; ) if (!isEqual(t[i], e[i])) return !1;
	  } else {
	    const r = keys(t);
	    let n;
	    if (((i = r.length), keys(e).length !== i)) return !1;
	    for (; i--; )
	      if (
	        ((n = r[i]),
	        !Object.prototype.hasOwnProperty.call(e, n) || !isEqual(t[n], e[n]))
	      )
	        return !1;
	  }
	  return o.pop(), c.pop(), !0;
	}

	function convertMsToSeconds(e, n = !1) {
	  let t = e / 1e3;
	  return n && (t = Math.floor(t)), t;
	}
	function convertSecondsToMs(e) {
	  return 1e3 * e;
	}
	function dateFromUnixTimestamp(e) {
	  if (null == e) return null;
	  const n = parseInt(e.toString());
	  return isNaN(n) ? null : new Date(1e3 * n);
	}
	function toValidBackendTimeString(e) {
	  return null != e && isDate(e) ? e.toISOString().replace(/\.[0-9]{3}Z$/, "") : e;
	}
	function rehydrateDateAfterJsonization(e) {
	  return null == e || "" === e ? null : new Date(e);
	}
	function timestampOrNow(e) {
	  return null == e || "" === e ? new Date().valueOf() : e;
	}
	function secondsAgo(e) {
	  return (new Date().valueOf() - e.valueOf()) / 1e3;
	}
	function secondsInTheFuture(e) {
	  return (e.valueOf() - new Date().valueOf()) / 1e3;
	}

	const MAX_PURCHASE_QUANTITY = 100;
	const FEED_ANIMATION_DURATION = 500;
	const GLOBAL_RATE_LIMIT_CAPACITY_DEFAULT = 30;
	const GLOBAL_RATE_LIMIT_REFILL_RATE_DEFAULT = 30;
	const LAST_REQUEST_TO_ENDPOINT_MS_AGO_DEFAULT = 72e5;
	const MAX_RETRY_COUNT_PER_REQUEST = 15;
	const REQUEST_ATTEMPT_DEFAULT = 1;
	const REQUEST_BACKOFF_MIN_SLEEP_MS_DEFAULT = 1e4;
	const REQUEST_BACKOFF_SCALE_FACTOR_DEFAULT = 3;
	const REQUEST_BACKOFF_MAX_SLEEP_MS_DEFAULT = 3e5;
	const CoreStrings = {
	  ee: "Braze must be initialized before calling methods.",
	  $e: "logCustomEvent",
	  Ku: "setCustomUserAttribute",
	};

	class m {
	  constructor() {
	    this.jn = {};
	  }
	  Rt(t) {
	    if ("function" != typeof t) return null;
	    const i = P$1.se();
	    return (this.jn[i] = t), i;
	  }
	  removeSubscription(t) {
	    delete this.jn[t];
	  }
	  removeAllSubscriptions() {
	    this.jn = {};
	  }
	  De() {
	    return Object.keys(this.jn).length;
	  }
	  L(t) {
	    const i = [];
	    for (const s in this.jn) {
	      const r = this.jn[s];
	      i.push(r(t));
	    }
	    return i;
	  }
	}

	class Card {
	  constructor(t, i, s, h, l, n, e, r, u, E, T, o, a, I, N, A) {
	    (this.id = t),
	      (this.viewed = i),
	      (this.title = s),
	      (this.imageUrl = h),
	      (this.description = l),
	      (this.updated = n),
	      (this.expiresAt = e),
	      (this.url = r),
	      (this.linkText = u),
	      (this.aspectRatio = E),
	      (this.extras = T),
	      (this.pinned = o),
	      (this.dismissible = a),
	      (this.clicked = I),
	      (this.language = N),
	      (this.altImageText = A),
	      (this.id = t),
	      (this.viewed = i || !1),
	      (this.title = s || ""),
	      (this.imageUrl = h),
	      (this.description = l || ""),
	      (this.updated = n || null),
	      (this.expiresAt = e || null),
	      (this.url = r),
	      (this.linkText = u),
	      null == E
	        ? (this.aspectRatio = null)
	        : ((E = parseFloat(E.toString())),
	          (this.aspectRatio = isNaN(E) ? null : E)),
	      (this.extras = T || {}),
	      (this.pinned = o || !1),
	      (this.dismissible = a || !1),
	      (this.dismissed = !1),
	      (this.clicked = I || !1),
	      (this.isControl = !1),
	      (this.language = N || null),
	      (this.altImageText = A || null),
	      (this.test = !1),
	      (this.ti = null),
	      (this.ii = null),
	      (this.si = null);
	  }
	  subscribeToClickedEvent(t) {
	    return this.hi().Rt(t);
	  }
	  subscribeToDismissedEvent(t) {
	    return this.li().Rt(t);
	  }
	  removeSubscription(t) {
	    this.hi().removeSubscription(t), this.li().removeSubscription(t);
	  }
	  removeAllSubscriptions() {
	    this.hi().removeAllSubscriptions(), this.li().removeAllSubscriptions();
	  }
	  dismissCard() {
	    if (!this.dismissible || this.dismissed) return;
	    "function" == typeof this.logCardDismissal && this.logCardDismissal();
	    let t = this.ae;
	    !t && this.id && (t = document.getElementById(this.id)),
	      t &&
	        ((t.style.height = t.offsetHeight + "px"),
	        (t.className = t.className + " ab-hide"),
	        setTimeout(function () {
	          t &&
	            t.parentNode &&
	            ((t.style.height = "0"),
	            (t.style.margin = "0"),
	            setTimeout(function () {
	              t && t.parentNode && t.parentNode.removeChild(t);
	            }, Card.ni));
	        }, FEED_ANIMATION_DURATION));
	  }
	  hi() {
	    return null == this.ti && (this.ti = new m()), this.ti;
	  }
	  li() {
	    return null == this.ii && (this.ii = new m()), this.ii;
	  }
	  Wt() {
	    const t = new Date().valueOf();
	    return (
	      !(null != this.si && t - this.si < Card.ei) &&
	      ((this.si = t), (this.viewed = !0), !0)
	    );
	  }
	  $t() {
	    (this.viewed = !0), (this.clicked = !0), this.hi().L();
	  }
	  Ot() {
	    return (
	      !(!this.dismissible || this.dismissed) &&
	      ((this.dismissed = !0), this.li().L(), !0)
	    );
	  }
	  ri(t) {
	    if (null == t || t[Card.ui.rs] !== this.id) return !0;
	    if (t[Card.ui.Ei]) return !1;
	    if (
	      null != t[Card.ui.ps] &&
	      null != this.updated &&
	      parseInt(t[Card.ui.ps]) < convertMsToSeconds(this.updated.valueOf())
	    )
	      return !0;
	    if (
	      (t[Card.ui.os] && !this.viewed && (this.viewed = !0),
	      t[Card.ui.js] && !this.clicked && (this.clicked = t[Card.ui.js]),
	      null != t[Card.ui.cs] && (this.title = t[Card.ui.cs]),
	      null != t[Card.ui.ns] && (this.imageUrl = t[Card.ui.ns]),
	      null != t[Card.ui.ds] && (this.description = t[Card.ui.ds]),
	      null != t[Card.ui.ps])
	    ) {
	      const i = dateFromUnixTimestamp(t[Card.ui.ps]);
	      null != i && (this.updated = i);
	    }
	    if (null != t[Card.ui.us]) {
	      let i;
	      (i = t[Card.ui.us] === Card.Ti ? null : dateFromUnixTimestamp(t[Card.ui.us])),
	        (this.expiresAt = i);
	    }
	    if (
	      (null != t[Card.ui.URL] && (this.url = t[Card.ui.URL]),
	      null != t[Card.ui.ls] && (this.linkText = t[Card.ui.ls]),
	      null != t[Card.ui.fs])
	    ) {
	      const i = parseFloat(t[Card.ui.fs].toString());
	      this.aspectRatio = isNaN(i) ? null : i;
	    }
	    return (
	      null != t[Card.ui.xs] && (this.extras = t[Card.ui.xs]),
	      null != t[Card.ui.bs] && (this.pinned = t[Card.ui.bs]),
	      null != t[Card.ui.gs] && (this.dismissible = t[Card.ui.gs]),
	      null != t[Card.ui.zs] && (this.language = t[Card.ui.zs]),
	      null != t[Card.ui.ks] && (this.altImageText = t[Card.ui.ks]),
	      null != t[Card.ui.qs] && (this.test = t[Card.ui.qs]),
	      !0
	    );
	  }
	  gt() {
	    E$1.error("Must be implemented in a subclass");
	  }
	}
	(Card.Ti = -1),
	  (Card.ui = {
	    rs: "id",
	    os: "v",
	    gs: "db",
	    Ei: "r",
	    ps: "ca",
	    bs: "p",
	    us: "ea",
	    xs: "e",
	    ts: "tp",
	    ns: "i",
	    cs: "tt",
	    ds: "ds",
	    URL: "u",
	    ls: "dm",
	    fs: "ar",
	    js: "cl",
	    qs: "t",
	    zs: "language",
	    ks: "image_alt",
	  }),
	  (Card.es = {
	    hs: "captioned_image",
	    oi: "text_announcement",
	    ai: "short_news",
	    Ii: "banner_image",
	    Ni: "control",
	  }),
	  (Card.ss = {
	    rs: "id",
	    os: "v",
	    gs: "db",
	    Ai: "cr",
	    ps: "ca",
	    bs: "p",
	    ci: "t",
	    us: "ea",
	    xs: "e",
	    ts: "tp",
	    ns: "i",
	    cs: "tt",
	    ds: "ds",
	    URL: "u",
	    ls: "dm",
	    fs: "ar",
	    js: "cl",
	    qs: "s",
	    zs: "l",
	    ks: "ia",
	  }),
	  (Card.mi = {
	    Si: "ADVERTISING",
	    Di: "ANNOUNCEMENTS",
	    pi: "NEWS",
	    di: "SOCIAL",
	  }),
	  (Card.ni = 400),
	  (Card.ei = 1e4);

	class ImageOnly extends Card {
	  constructor(s, t, i, h, l, r, e, n, o, u, a, c, d) {
	    super(s, t, null, i, null, h, l, r, null, e, n, o, u, a, c, d),
	      (this.ie = "ab-image-only"),
	      (this.ne = !1),
	      (this.test = !1);
	  }
	  gt() {
	    const s = {};
	    return (
	      (s[Card.ss.ts] = Card.es.Ii),
	      (s[Card.ss.rs] = this.id),
	      (s[Card.ss.os] = this.viewed),
	      (s[Card.ss.ns] = this.imageUrl),
	      (s[Card.ss.ps] = this.updated),
	      (s[Card.ss.us] = this.expiresAt),
	      (s[Card.ss.URL] = this.url),
	      (s[Card.ss.fs] = this.aspectRatio),
	      (s[Card.ss.xs] = this.extras),
	      (s[Card.ss.bs] = this.pinned),
	      (s[Card.ss.gs] = this.dismissible),
	      (s[Card.ss.js] = this.clicked),
	      (s[Card.ss.zs] = this.language),
	      (s[Card.ss.ks] = this.altImageText),
	      (s[Card.ss.qs] = this.test),
	      s
	    );
	  }
	}

	class CaptionedImage extends Card {
	  constructor(t, s, i, h, e, r, a, o, c, n, d, p, u, l, m, f) {
	    super(t, s, i, h, e, r, a, o, c, n, d, p, u, l, m, f),
	      (this.ie = "ab-captioned-image"),
	      (this.ne = !0),
	      (this.test = !1);
	  }
	  gt() {
	    const t = {};
	    return (
	      (t[Card.ss.ts] = Card.es.hs),
	      (t[Card.ss.rs] = this.id),
	      (t[Card.ss.os] = this.viewed),
	      (t[Card.ss.cs] = this.title),
	      (t[Card.ss.ns] = this.imageUrl),
	      (t[Card.ss.ds] = this.description),
	      (t[Card.ss.ps] = this.updated),
	      (t[Card.ss.us] = this.expiresAt),
	      (t[Card.ss.URL] = this.url),
	      (t[Card.ss.ls] = this.linkText),
	      (t[Card.ss.fs] = this.aspectRatio),
	      (t[Card.ss.xs] = this.extras),
	      (t[Card.ss.bs] = this.pinned),
	      (t[Card.ss.gs] = this.dismissible),
	      (t[Card.ss.js] = this.clicked),
	      (t[Card.ss.zs] = this.language),
	      (t[Card.ss.ks] = this.altImageText),
	      (t[Card.ss.qs] = this.test),
	      t
	    );
	  }
	}

	class ClassicCard extends Card {
	  constructor(s, t, i, h, r, c, e, a, o, d, l, n, u, p, f, m) {
	    super(s, t, i, h, r, c, e, a, o, d, l, n, u, p, f, m),
	      (this.ie = "ab-classic-card"),
	      (this.ne = !0);
	  }
	  gt() {
	    const s = {};
	    return (
	      (s[Card.ss.ts] = Card.es.ai),
	      (s[Card.ss.rs] = this.id),
	      (s[Card.ss.os] = this.viewed),
	      (s[Card.ss.cs] = this.title),
	      (s[Card.ss.ns] = this.imageUrl),
	      (s[Card.ss.ds] = this.description),
	      (s[Card.ss.ps] = this.updated),
	      (s[Card.ss.us] = this.expiresAt),
	      (s[Card.ss.URL] = this.url),
	      (s[Card.ss.ls] = this.linkText),
	      (s[Card.ss.fs] = this.aspectRatio),
	      (s[Card.ss.xs] = this.extras),
	      (s[Card.ss.bs] = this.pinned),
	      (s[Card.ss.gs] = this.dismissible),
	      (s[Card.ss.js] = this.clicked),
	      (s[Card.ss.zs] = this.language),
	      (s[Card.ss.ks] = this.altImageText),
	      (s[Card.ss.qs] = this.test),
	      s
	    );
	  }
	}

	class ControlCard extends Card {
	  constructor(t, s, l, i, r, n) {
	    super(t, s, null, null, null, l, i, null, null, null, r, n),
	      (this.isControl = !0),
	      (this.ie = "ab-control-card"),
	      (this.ne = !1);
	  }
	  gt() {
	    const t = {};
	    return (
	      (t[Card.ss.ts] = Card.es.Ni),
	      (t[Card.ss.rs] = this.id),
	      (t[Card.ss.os] = this.viewed),
	      (t[Card.ss.ps] = this.updated),
	      (t[Card.ss.us] = this.expiresAt),
	      (t[Card.ss.xs] = this.extras),
	      (t[Card.ss.bs] = this.pinned),
	      (t[Card.ss.qs] = this.test),
	      t
	    );
	  }
	}

	function getAlias(e) {
	  const t = null == e ? void 0 : e.dt(STORAGE_KEYS.ft.uE);
	  let n;
	  return t && (n = { label: t.l, name: t.a }), n;
	}

	class De {
	  constructor(t, s, i, r, e) {
	    (this.userId = t),
	      (this.type = s),
	      (this.time = i),
	      (this.sessionId = r),
	      (this.data = e),
	      (this.userId = t),
	      (this.type = s),
	      (this.time = timestampOrNow(i)),
	      (this.sessionId = r),
	      (this.data = e);
	  }
	  Hn() {
	    var t;
	    const s = {
	      name: this.type,
	      time: convertMsToSeconds(this.time),
	      data: this.data || {},
	      session_id: this.sessionId,
	    };
	    null != this.userId && (s.user_id = this.userId);
	    const i = (null === (t = r.Sr()) || void 0 === t ? void 0 : t.wh()) || !1;
	    if (!s.user_id && !i) {
	      const t = getAlias(r.p());
	      t && (s.alias = t);
	    }
	    return s;
	  }
	  gt() {
	    return {
	      u: this.userId,
	      t: this.type,
	      ts: this.time,
	      s: this.sessionId,
	      d: this.data,
	    };
	  }
	  static fromJson(t) {
	    return new De(t.user_id, t.name, t.time, t.session_id, t.data);
	  }
	  static gE(t) {
	    return null != t && isObject$1(t) && null != t.t && "" !== t.t;
	  }
	  static _u(t) {
	    return new De(t.u, t.t, t.ts, t.s, t.d);
	  }
	}

	const getErrorMessage = (r) =>
	  r instanceof Error ? r.message : String(r);

	class _t {
	  constructor(t, e, i) {
	    (this.Tu = t),
	      null == t && (t = P$1.se()),
	      !i || isNaN(i) ? (this.lm = new Date().valueOf()) : (this.lm = i),
	      (this.Tu = t),
	      (this.gm = new Date().valueOf()),
	      (this.pm = e);
	  }
	  gt() {
	    return `g:${encodeURIComponent(this.Tu)}|e:${this.pm}|c:${this.lm}|l:${
      this.gm
    }`;
	  }
	  static AE(t) {
	    if ("string" != typeof t) return null;
	    const e = t.lastIndexOf("|e:"),
	      i = t.substring(0, e),
	      r = i.split("g:")[1];
	    let n;
	    return (
	      (n = /[|:]/.test(r) ? encodeURIComponent(r) : r),
	      (t = t.replace(i, `g:${n}`))
	    );
	  }
	  static _u(t) {
	    let e;
	    if ("string" == typeof t)
	      try {
	        const i = t.split("|");
	        if (!isArray(i) || 4 !== i.length) return null;
	        const r = (t) => t.split(":")[1],
	          n = (t) => {
	            const e = parseInt(r(t));
	            if (!isNaN(e)) return e;
	          };
	        (e = new _t(decodeURIComponent(r(i[0])), n(i[1]), n(i[2]))),
	          (e.gm = n(i[3]));
	      } catch (e) {
	        E$1.info(
	          `Unable to parse cookie string ${t}, failed with error: ${getErrorMessage(e)}`,
	        );
	      }
	    else {
	      if (null == t || null == t.g) return null;
	      (e = new _t(t.g, t.e, t.c)), (e.gm = t.l);
	    }
	    return e;
	  }
	}

	function getByteLength(t) {
	  let e = t.length;
	  for (let n = t.length - 1; n >= 0; n--) {
	    const r = t.charCodeAt(n);
	    r > 127 && r <= 2047 ? e++ : r > 2047 && r <= 65535 && (e += 2),
	      r >= 56320 && r <= 57343 && n--;
	  }
	  return e;
	}
	function decodeBrazeActions(t) {
	  try {
	    t = t.replace(/-/g, "+").replace(/_/g, "/");
	    const e = window.atob(t),
	      n = new Uint8Array(e.length);
	    for (let t = 0; t < e.length; t++) n[t] = e.charCodeAt(t);
	    const r = new Uint16Array(n.buffer);
	    return String.fromCharCode(...r);
	  } catch (t) {
	    return E$1.error("Unable to decode Base64: " + t), null;
	  }
	}

	const BRAZE_ACTIONS = {
	  types: {
	    io: "container",
	    logCustomEvent: "logCustomEvent",
	    setEmailNotificationSubscriptionType:
	      "setEmailNotificationSubscriptionType",
	    setPushNotificationSubscriptionType: "setPushNotificationSubscriptionType",
	    setCustomUserAttribute: "setCustomUserAttribute",
	    requestPushPermission: "requestPushPermission",
	    addToSubscriptionGroup: "addToSubscriptionGroup",
	    removeFromSubscriptionGroup: "removeFromSubscriptionGroup",
	    addToCustomAttributeArray: "addToCustomAttributeArray",
	    removeFromCustomAttributeArray: "removeFromCustomAttributeArray",
	    mo: "openLink",
	    uo: "openLinkInWebView",
	  },
	  properties: { type: "type", eo: "steps", so: "args" },
	};
	const INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES = {
	  Pn: "unknownBrazeAction",
	  cp: "noPushPrompt",
	};
	const ineligibleBrazeActionURLErrorMessage = (t, o) =>
	  t === INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES.Pn
	    ? `${o} contains an unknown braze action type and will not be displayed.`
	    : "";
	function getDecodedBrazeAction(t) {
	  try {
	    const o = t.match(BRAZE_ACTION_URI_REGEX),
	      r = o ? o[0].length : null,
	      n = r ? t.substring(r) : null;
	    if (null == r || r > t.length - 1 || !n)
	      return void E$1.error(
	        `Did not find base64 encoded brazeAction in url to process : ${t}`,
	      );
	    const e = decodeBrazeActions(n);
	    return e
	      ? JSON.parse(e)
	      : void E$1.error(`Failed to decode base64 encoded brazeAction: ${n}`);
	  } catch (o) {
	    return void E$1.error(`Failed to process brazeAction URL ${t} : ${getErrorMessage(o)}`);
	  }
	}
	function po(t, o) {
	  let r = !1;
	  if (o) for (const n of o) if (((r = r || t(n)), r)) return !0;
	  return !1;
	}
	function containsUnknownBrazeAction(t) {
	  const o = BRAZE_ACTIONS.properties.type,
	    r = BRAZE_ACTIONS.properties.eo;
	  try {
	    if (null == t) return !0;
	    const n = t[o];
	    return n === BRAZE_ACTIONS.types.io
	      ? po(containsUnknownBrazeAction, t[r])
	      : !isValidBrazeActionType(n);
	  } catch (t) {
	    return !0;
	  }
	}
	function containsPushPrimerBrazeAction(t) {
	  if (!t || !isValidBrazeActionJson(t)) return !1;
	  const o = BRAZE_ACTIONS.properties.type,
	    r = BRAZE_ACTIONS.properties.eo,
	    n = t[o];
	  return n === BRAZE_ACTIONS.types.io
	    ? po(containsPushPrimerBrazeAction, t[r])
	    : n === BRAZE_ACTIONS.types.requestPushPermission;
	}

	const CUSTOM_DATA_REGEX = /^[^\x00-\x1F\x22]+$/;
	const CUSTOM_ATTRIBUTE_SPECIAL_CHARS_REGEX = /[$.]/;
	const CUSTOM_ATTRIBUTE_RESERVED_OPERATORS = [
	  "$add",
	  "$update",
	  "$remove",
	  "$identifier_key",
	  "$identifier_value",
	  "$new_object",
	  "$time",
	  "$google_ad_personalization",
	  "$google_ad_user_data",
	];
	const EMAIL_ADDRESS_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
	const BRAZE_ACTION_URI_REGEX = /^brazeActions:\/\/v\d+\//;
	const VALID_UTF8_STRING_NO_WHITESPACES_REGEX = /^[^\s]+$/;
	function validateCustomString(t, e, r) {
	  const n =
	    null != t &&
	    "string" == typeof t &&
	    ("" === t || null != t.match(CUSTOM_DATA_REGEX));
	  return n || E$1.error(`Cannot ${e} because ${r} "${t}" is invalid.`), n;
	}
	function validateCustomAttributeKey(t) {
	  return (
	    null != t &&
	      t.match(CUSTOM_ATTRIBUTE_SPECIAL_CHARS_REGEX) &&
	      -1 === CUSTOM_ATTRIBUTE_RESERVED_OPERATORS.indexOf(t) &&
	      E$1.warn("Custom attribute keys cannot contain '$' or '.'"),
	    validateCustomString(t, "set custom user attribute", "the given key")
	  );
	}
	function validatePropertyType(t) {
	  const e = typeof t;
	  return (
	    null == t || "number" === e || "boolean" === e || isDate(t) || "string" === e
	  );
	}
	function _validateNestedProperties(t, e, r) {
	  const n = -1 !== r;
	  if (n && r > 50)
	    return E$1.error("Nested attributes cannot be more than 50 levels deep."), !1;
	  const o = n ? r + 1 : -1;
	  if (isArray(t) && isArray(e)) {
	    for (let r = 0; r < t.length && r < e.length; r++)
	      if (
	        (isDate(t[r]) && (e[r] = toValidBackendTimeString(t[r])),
	        !_validateNestedProperties(t[r], e[r], o))
	      )
	        return !1;
	  } else {
	    if (!isObject$1(t)) return validatePropertyType(t);
	    for (const r of keys(t)) {
	      const i = t[r];
	      if (n && !validateCustomAttributeKey(r)) return !1;
	      if (isDate(i)) {
	        e[r] = toValidBackendTimeString(i);
	      }
	      if (!_validateNestedProperties(i, e[r], o)) return !1;
	    }
	  }
	  return !0;
	}
	function _validateEventPropertyValue(t, e, r, n, o) {
	  let i;
	  return (
	    (i =
	      isObject$1(t) || isArray(t)
	        ? _validateNestedProperties(t, e, o ? 1 : -1)
	        : validatePropertyType(t)),
	    i || E$1.error(`Cannot ${r} because ${n} "${t}" is invalid.`),
	    i
	  );
	}
	function validateStandardString(t, e, r, n = !1) {
	  const o = "string" == typeof t || (null === t && n);
	  return o || E$1.error(`Cannot ${e} because ${r} "${t}" is invalid.`), o;
	}
	function validateCustomProperties(t, e, r, n, o) {
	  if ((null == t && (t = {}), "object" != typeof t || isArray(t)))
	    return (
	      E$1.error(`${e} requires that ${r} be an object. Ignoring ${o}.`),
	      [!1, null]
	    );
	  let i, a;
	  e === CoreStrings.Ku ? ((i = 76800), (a = "75KB")) : ((i = 51200), (a = "50KB"));
	  const s = JSON.stringify(t);
	  if (getByteLength(s) > i)
	    return (
	      E$1.error(
	        `Could not ${n} because ${r} was greater than the max size of ${a}.`,
	      ),
	      [!1, null]
	    );
	  let u;
	  try {
	    u = JSON.parse(s);
	  } catch (t) {
	    return (
	      E$1.error(`Could not ${n} because ${r} did not contain valid JSON.`),
	      [!1, null]
	    );
	  }
	  for (const r in t) {
	    if (e === CoreStrings.Ku && !validateCustomAttributeKey(r)) return [!1, null];
	    if (!validateCustomString(r, n, `the ${o} property name`))
	      return [!1, null];
	    const i = t[r];
	    if (e !== CoreStrings.Ku && null == i) {
	      delete t[r], delete u[r];
	      continue;
	    }
	    isDate(i) && (u[r] = toValidBackendTimeString(i));
	    if (
	      !_validateEventPropertyValue(
	        i,
	        u[r],
	        n,
	        `the ${o} property "${r}"`,
	        e === CoreStrings.Ku,
	      )
	    )
	      return [!1, null];
	  }
	  return [!0, u];
	}
	function validateCustomAttributeArrayType(t, e) {
	  let r = !1,
	    n = !1;
	  const o = () => {
	    E$1.error(
	      "Custom attribute arrays must be either string arrays or object arrays.",
	    );
	  };
	  for (const i of e)
	    if ("string" == typeof i) {
	      if (n) return o(), [!1, !1];
	      if (
	        !validateCustomString(
	          i,
	          `set custom user attribute "${t}"`,
	          "the element in the given array",
	        )
	      )
	        return [!1, !1];
	      r = !0;
	    } else {
	      if (!isObject$1(i)) return o(), [!1, !1];
	      if (r) return o(), [!1, !1];
	      if (
	        !validateCustomProperties(
	          i,
	          CoreStrings.Ku,
	          "attribute value",
	          `set custom user attribute "${t}"`,
	          "custom user attribute",
	        )
	      )
	        return [!1, !1];
	      n = !0;
	    }
	  return [r, n];
	}
	function isValidEmail(t) {
	  if ("string" != typeof t) return !1;
	  const e = t.length;
	  return !(0 === e || e > 256) && EMAIL_ADDRESS_REGEX.test(t.toLowerCase());
	}
	function isValidBrazeActionJson(t) {
	  if (!(BRAZE_ACTIONS.properties.type in t)) return !1;
	  switch (t[BRAZE_ACTIONS.properties.type]) {
	    case BRAZE_ACTIONS.types.io:
	      if (BRAZE_ACTIONS.properties.eo in t) return !0;
	      break;
	    case BRAZE_ACTIONS.types.logCustomEvent:
	    case BRAZE_ACTIONS.types.setEmailNotificationSubscriptionType:
	    case BRAZE_ACTIONS.types.setPushNotificationSubscriptionType:
	    case BRAZE_ACTIONS.types.setCustomUserAttribute:
	    case BRAZE_ACTIONS.types.addToSubscriptionGroup:
	    case BRAZE_ACTIONS.types.removeFromSubscriptionGroup:
	    case BRAZE_ACTIONS.types.addToCustomAttributeArray:
	    case BRAZE_ACTIONS.types.removeFromCustomAttributeArray:
	    case BRAZE_ACTIONS.types.mo:
	    case BRAZE_ACTIONS.types.uo:
	      if (BRAZE_ACTIONS.properties.so in t) return !0;
	      break;
	    case BRAZE_ACTIONS.types.requestPushPermission:
	      return !0;
	    default:
	      return !1;
	  }
	  return !1;
	}
	function isValidBrazeActionType(t) {
	  let e = !1;
	  return (
	    Object.keys(BRAZE_ACTIONS.types).forEach((r) => {
	      BRAZE_ACTIONS.types[r] !== t.toString() || (e = !0);
	    }),
	    e
	  );
	}
	function isValidBannerPlacementId(t) {
	  return VALID_UTF8_STRING_NO_WHITESPACES_REGEX.test(t);
	}

	class User {
	  constructor(t, e) {
	    (this.vs = t), (this.Ru = e), (this.vs = t), (this.Ru = e);
	  }
	  getUserId(t) {
	    const e = this.vs.getUserId();
	    if ("function" != typeof t) return e;
	    E$1.warn(
	      "The callback for getUserId is deprecated. You can access its return value directly instead (e.g. `const id = braze.getUser().getUserId()`)",
	    ),
	      t(e);
	  }
	  addAlias(t, e) {
	    return !validateStandardString(t, "add alias", "the alias", !1) || t.length <= 0
	      ? (E$1.error("addAlias requires a non-empty alias"), !1)
	      : !validateStandardString(e, "add alias", "the label", !1) || e.length <= 0
	      ? (E$1.error("addAlias requires a non-empty label"), !1)
	      : this.Ru.Gu(t, e).W;
	  }
	  setFirstName(t) {
	    return (
	      !!validateStandardString(t, "set first name", "the firstName", !0) &&
	      this.vs.zu("first_name", t)
	    );
	  }
	  setLastName(t) {
	    return (
	      !!validateStandardString(t, "set last name", "the lastName", !0) && this.vs.zu("last_name", t)
	    );
	  }
	  setEmail(t) {
	    return null === t || isValidEmail(t)
	      ? this.vs.zu("email", t)
	      : (E$1.error(
	          `Cannot set email address - "${t}" did not pass RFC-5322 validation.`,
	        ),
	        !1);
	  }
	  setGender(t) {
	    return (
	      "string" == typeof t && (t = t.toLowerCase()),
	      !(
	        null !== t &&
	        !validateValueIsFromEnum(
	          User.Genders,
	          t,
	          `Gender "${t}" is not a valid gender.`,
	          "User.Genders",
	        )
	      ) && this.vs.zu("gender", t)
	    );
	  }
	  setDateOfBirth(t, e, r) {
	    return null === t && null === e && null === r
	      ? this.vs.zu("dob", null)
	      : ((t = null != t ? parseInt(t.toString()) : null),
	        (e = null != e ? parseInt(e.toString()) : null),
	        (r = null != r ? parseInt(r.toString()) : null),
	        null == t ||
	        null == e ||
	        null == r ||
	        isNaN(t) ||
	        isNaN(e) ||
	        isNaN(r) ||
	        e > 12 ||
	        e < 1 ||
	        r > 31 ||
	        r < 1
	          ? (E$1.error(
	              "Cannot set date of birth - parameters should comprise a valid date e.g. setDateOfBirth(1776, 7, 4);",
	            ),
	            !1)
	          : this.vs.zu("dob", `${t}-${e}-${r}`));
	  }
	  setCountry(t) {
	    return (
	      !!validateStandardString(t, "set country", "the country", !0) && this.vs.zu("country", t)
	    );
	  }
	  setHomeCity(t) {
	    return (
	      !!validateStandardString(t, "set home city", "the homeCity", !0) && this.vs.zu("home_city", t)
	    );
	  }
	  setLanguage(t) {
	    return (
	      !!validateStandardString(t, "set language", "the language", !0) && this.vs.zu("language", t)
	    );
	  }
	  setEmailNotificationSubscriptionType(t) {
	    return (
	      !!validateValueIsFromEnum(
	        User.NotificationSubscriptionTypes,
	        t,
	        `Email notification setting "${t}" is not a valid subscription type.`,
	        "User.NotificationSubscriptionTypes",
	      ) && this.vs.zu("email_subscribe", t)
	    );
	  }
	  setPushNotificationSubscriptionType(t) {
	    return (
	      !!validateValueIsFromEnum(
	        User.NotificationSubscriptionTypes,
	        t,
	        `Push notification setting "${t}" is not a valid subscription type.`,
	        "User.NotificationSubscriptionTypes",
	      ) && this.vs.zu("push_subscribe", t)
	    );
	  }
	  setPhoneNumber(t) {
	    return (
	      !!validateStandardString(t, "set phone number", "the phoneNumber", !0) &&
	      (null === t || t.match(User.Hu)
	        ? this.vs.zu("phone", t)
	        : (E$1.error(`Cannot set phone number - "${t}" did not pass validation.`),
	          !1))
	    );
	  }
	  setLastKnownLocation(t, e, r, s, n) {
	    return null == t || null == e
	      ? (E$1.error(
	          "Cannot set last-known location - latitude and longitude are required.",
	        ),
	        !1)
	      : ((t = parseFloat(t.toString())),
	        (e = parseFloat(e.toString())),
	        null != r && (r = parseFloat(r.toString())),
	        null != s && (s = parseFloat(s.toString())),
	        null != n && (n = parseFloat(n.toString())),
	        isNaN(t) ||
	        isNaN(e) ||
	        (null != r && isNaN(r)) ||
	        (null != s && isNaN(s)) ||
	        (null != n && isNaN(n))
	          ? (E$1.error(
	              "Cannot set last-known location - all supplied parameters must be numeric.",
	            ),
	            !1)
	          : t > 90 || t < -90 || e > 180 || e < -180
	          ? (E$1.error(
	              "Cannot set last-known location - latitude and longitude are bounded by ±90 and ±180 respectively.",
	            ),
	            !1)
	          : (null != r && r < 0) || (null != n && n < 0)
	          ? (E$1.error(
	              "Cannot set last-known location - accuracy and altitudeAccuracy may not be negative.",
	            ),
	            !1)
	          : this.Ru.setLastKnownLocation(this.vs.getUserId(), t, e, s, r, n).W);
	  }
	  setCustomUserAttribute(t, e, r) {
	    if (!validateCustomAttributeKey(t)) return !1;
	    const s = (e) => {
	      const [r] = validateCustomProperties(
	        e,
	        CoreStrings.Ku,
	        "attribute value",
	        `set custom user attribute "${t}"`,
	        "custom user attribute",
	      );
	      return r;
	    };
	    if (isArray(e)) {
	      const [r, n] = validateCustomAttributeArrayType(t, e);
	      if (!r && !n && 0 !== e.length) return !1;
	      if (r || 0 === e.length) return this.Ru.Mu(f.Yu, t, e).W;
	      for (const t of e) if (!s(t)) return !1;
	    } else if (isObject$1(e)) {
	      if (!s(e)) return !1;
	      if (r) return this.Ru.Mu(f.Vu, t, e).W;
	    } else {
	      if (!(void 0 !== e && validatePropertyType(e))) return !1;
	      if (
	        (isDate(e) && (e = toValidBackendTimeString(e)),
	        "string" == typeof e &&
	          !validateCustomString(
	            e,
	            `set custom user attribute "${t}"`,
	            "the element in the given array",
	          ))
	      )
	        return !1;
	    }
	    return this.vs.setCustomUserAttribute(t, e);
	  }
	  addToCustomAttributeArray(t, e) {
	    return (
	      !!validateCustomString(t, "add to custom user attribute array", "the given key") &&
	      !(
	        null != e &&
	        !validateCustomString(e, "add to custom user attribute array", "the given value")
	      ) &&
	      this.Ru.Mu(f.Qu, t, e).W
	    );
	  }
	  removeFromCustomAttributeArray(t, e) {
	    return (
	      !!validateCustomString(t, "remove from custom user attribute array", "the given key") &&
	      !(
	        null != e &&
	        !validateCustomString(e, "remove from custom user attribute array", "the given value")
	      ) &&
	      this.Ru.Mu(f.Xu, t, e).W
	    );
	  }
	  incrementCustomUserAttribute(t, e) {
	    if (!validateCustomString(t, "increment custom user attribute", "the given key")) return !1;
	    null == e && (e = 1);
	    const r = parseInt(e.toString());
	    return isNaN(r) || r !== parseFloat(e.toString())
	      ? (E$1.error(
	          `Cannot increment custom user attribute because the given incrementValue "${e}" is not an integer.`,
	        ),
	        !1)
	      : this.Ru.Mu(f.Zu, t, r).W;
	  }
	  setCustomLocationAttribute(t, e, r) {
	    return (
	      !!validateCustomString(t, "set custom location attribute", "the given key") &&
	      ((null !== e || null !== r) &&
	      ((e = null != e ? parseFloat(e.toString()) : null),
	      (r = null != r ? parseFloat(r.toString()) : null),
	      (null == e && null != r) ||
	        (null != e && null == r) ||
	        (null != e && (isNaN(e) || e > 90 || e < -90)) ||
	        (null != r && (isNaN(r) || r > 180 || r < -180)))
	        ? (E$1.error(
	            "Received invalid values for latitude and/or longitude. Latitude and longitude are bounded by ±90 and ±180 respectively, or must both be null for removal.",
	          ),
	          !1)
	        : this.Ru.Na(t, e, r).W)
	    );
	  }
	  addToSubscriptionGroup(t) {
	    return !validateStandardString(
	      t,
	      "add user to subscription group",
	      "subscription group ID",
	      !1,
	    ) || t.length <= 0
	      ? (E$1.error(
	          "addToSubscriptionGroup requires a non-empty subscription group ID",
	        ),
	        !1)
	      : this.Ru.Ra(t, User.Pa.SUBSCRIBED).W;
	  }
	  removeFromSubscriptionGroup(t) {
	    return !validateStandardString(
	      t,
	      "remove user from subscription group",
	      "subscription group ID",
	      !1,
	    ) || t.length <= 0
	      ? (E$1.error(
	          "removeFromSubscriptionGroup requires a non-empty subscription group ID",
	        ),
	        !1)
	      : this.Ru.Ra(t, User.Pa.UNSUBSCRIBED).W;
	  }
	  setLineId(t) {
	    return validateStandardString(t, "set LINE user ID", "the ID", !0) &&
	      0 !== (null == t ? void 0 : t.length)
	      ? t && t.length > User.Oa
	        ? (E$1.error(
	            `Rejected LINE user ID ${t} because it is longer than ${User.Oa} characters.`,
	          ),
	          !1)
	        : this.vs.zu("native_line_id", t)
	      : (E$1.error("setLineId requires a non-empty ID"), !1);
	  }
	  gu(t, e, r, s, n) {
	    this.vs.gu(t, e, r, s, n), this.Ru.Ya();
	  }
	  wu(t) {
	    this.vs.wu(t);
	  }
	}
	(User.Genders = {
	  MALE: "m",
	  FEMALE: "f",
	  OTHER: "o",
	  UNKNOWN: "u",
	  NOT_APPLICABLE: "n",
	  PREFER_NOT_TO_SAY: "p",
	}),
	  (User.NotificationSubscriptionTypes = {
	    OPTED_IN: "opted_in",
	    SUBSCRIBED: "subscribed",
	    UNSUBSCRIBED: "unsubscribed",
	  }),
	  (User.Hu = /^[0-9 .\\(\\)\\+\\-]+$/),
	  (User.Pa = { SUBSCRIBED: "subscribed", UNSUBSCRIBED: "unsubscribed" }),
	  (User.Va = "user_id"),
	  (User.Bu = "custom"),
	  (User.mr = 997),
	  (User.Oa = 33);

	class Oe {
	  constructor() {}
	  ff() {}
	  cf() {}
	  rc(t) {}
	  static lf(t, e) {
	    if (t && e)
	      if (((t = t.toLowerCase()), isArray(e.uf))) {
	        for (let r = 0; r < e.uf.length; r++)
	          if (-1 !== t.indexOf(e.uf[r].toLowerCase())) return e.identity;
	      } else if (-1 !== t.indexOf(e.uf.toLowerCase())) return e.identity;
	  }
	}

	const Browsers = {
	  rO: "Chrome",
	  eO: "Edge",
	  oO: "Opera",
	  Bg: "Safari",
	  OO: "Firefox",
	  Sg: "ChatGPTBrowser",
	};
	const OperatingSystems = {
	  Dg: "Android",
	  co: "iOS",
	  Pg: "Mac",
	  kg: "Windows",
	};

	class gi extends Oe {
	  constructor() {
	    if (
	      (super(),
	      (this.userAgentData = navigator.userAgentData),
	      (this.browser = null),
	      (this.version = null),
	      this.userAgentData)
	    ) {
	      const t = this.hf();
	      (this.browser = t.browser || "Unknown Browser"),
	        (this.version = t.version || "Unknown Version");
	    }
	    this.OS = null;
	  }
	  ff() {
	    return this.browser;
	  }
	  cf() {
	    return this.version;
	  }
	  rc(t) {
	    if (this.OS) return Promise.resolve(this.OS);
	    const s = (s) => {
	      for (let r = 0; r < t.length; r++) {
	        const i = gi.lf(s, t[r]);
	        if (i) return (this.OS = i), this.OS;
	      }
	      return s;
	    };
	    return this.userAgentData.platform
	      ? Promise.resolve(s(this.userAgentData.platform))
	      : this.getHighEntropyValues()
	          .then((t) => (t.platform ? s(t.platform) : navigator.platform))
	          .catch(() => navigator.platform);
	  }
	  hf() {
	    const t = {},
	      s = this.userAgentData.brands;
	    if (s && s.length)
	      for (const r of s) {
	        const s = this.af(Browsers),
	          i = r.brand.match(s);
	        if (i && i.length > 0) {
	          (t.browser = i[0]), (t.version = r.version);
	          break;
	        }
	      }
	    return t;
	  }
	  af(t) {
	    const s = [];
	    for (const r in t) {
	      const i = r;
	      s.push(t[i]);
	    }
	    return new RegExp("(" + s.join("|") + ")", "i");
	  }
	  getHighEntropyValues() {
	    return this.userAgentData.getHighEntropyValues
	      ? this.userAgentData.getHighEntropyValues(["platform"])
	      : Promise.reject();
	  }
	}

	class Si extends Oe {
	  constructor() {
	    super(), (this.Vd = Si.hf(navigator.userAgent || ""));
	  }
	  ff() {
	    return this.Vd[0] || "Unknown Browser";
	  }
	  cf() {
	    return this.Vd[1] || "Unknown Version";
	  }
	  rc(r) {
	    for (let n = 0; n < r.length; n++) {
	      const e = r[n].string;
	      let i = Si.lf(e, r[n]);
	      if (i)
	        return (
	          i === OperatingSystems.Pg && navigator.maxTouchPoints > 1 && (i = OperatingSystems.co),
	          Promise.resolve(i)
	        );
	    }
	    return Promise.resolve(navigator.platform);
	  }
	  static hf(r) {
	    let n,
	      e =
	        r.match(
	          /(samsungbrowser|tizen|roku|konqueror|icab|crios|opera|ucbrowser|chatgptbrowser|chrome|safari|firefox|camino|msie|trident(?=\/))\/?\s*(\.?\d+(\.\d+)*)/i,
	        ) || [];
	    if (-1 !== r.indexOf("(Web0S; Linux/SmartTV)"))
	      return ["LG Smart TV", null];
	    if (-1 !== r.indexOf("CrKey")) return ["Chromecast", null];
	    if (
	      -1 !== r.indexOf("BRAVIA") ||
	      -1 !== r.indexOf("SonyCEBrowser") ||
	      -1 !== r.indexOf("SonyDTV")
	    )
	      return ["Sony Smart TV", null];
	    if (-1 !== r.indexOf("PhilipsTV")) return ["Philips Smart TV", null];
	    if (r.match(/\b(Roku)\b/)) return ["Roku", null];
	    if (r.match(/\bAFTM\b/)) return ["Amazon Fire Stick", null];
	    if (e[1] === Browsers.rO) {
	      if (r.includes(Browsers.Sg)) return [Browsers.Sg, e[2]];
	      if (
	        ((n = r.match(/\b(OPR|Edge|EdgA|Edg|UCBrowser)\/(\.?\d+(\.\d+)*)/)),
	        null != n)
	      )
	        return (
	          (n = n.slice(1)),
	          (n[0] = n[0].replace("OPR", Browsers.oO)),
	          (n[0] = n[0].replace("EdgA", Browsers.eO)),
	          "Edg" === n[0] && (n[0] = Browsers.eO),
	          [n[0], n[1]]
	        );
	    }
	    if (
	      e[1] === Browsers.Bg &&
	      ((n = r.match(/\b(EdgiOS)\/(\.?\d+(\.\d+)*)/)), null != n)
	    )
	      return (
	        (n = n.slice(1)), (n[0] = n[0].replace("EdgiOS", Browsers.eO)), [n[0], n[1]]
	      );
	    if (
	      ((e = e[2] ? [e[1], e[2]] : [null, null]),
	      e[0] === Browsers.Bg &&
	        null != (n = r.match(/version\/(\.?\d+(\.\d+)*)/i)) &&
	        e.splice(1, 1, n[1]),
	      null != (n = r.match(/\b(UCBrowser)\/(\.?\d+(\.\d+)*)/)) &&
	        e.splice(1, 1, n[2]),
	      e[0] === Browsers.oO && null != (n = r.match(/mini\/(\.?\d+(\.\d+)*)/i)))
	    )
	      return ["Opera Mini", n[1] || ""];
	    if (e[0]) {
	      const r = e[0].toLowerCase();
	      "crios" === r && (e[0] = Browsers.rO),
	        "tizen" === r && ((e[0] = "Samsung Smart TV"), (e[1] = null)),
	        "samsungbrowser" === r && (e[0] = "Samsung Browser");
	    }
	    return e;
	  }
	}

	class vi {
	  constructor() {
	    let t;
	    (t =
	      navigator.userAgent.toLowerCase().includes(Browsers.Sg.toLowerCase()) ||
	      !navigator.userAgentData
	        ? Si
	        : gi),
	      (this.vg = new t()),
	      (this.userAgent = navigator.userAgent),
	      (this.browser = this.vg.ff()),
	      (this.version = this.vg.cf()),
	      (this.OS = null),
	      this.rc().then((t) => (this.OS = t));
	    const i = navigator;
	    (this.language = (
	      i.userLanguage ||
	      i.language ||
	      i.browserLanguage ||
	      i.systemLanguage ||
	      ""
	    ).toLowerCase()),
	      (this.Il = vi.xg(this.userAgent));
	  }
	  fE() {
	    return this.browser === Browsers.Bg;
	  }
	  nc() {
	    return this.OS || null;
	  }
	  rc() {
	    return this.OS
	      ? Promise.resolve(this.OS)
	      : this.vg.rc(vi.Og).then((t) => ((this.OS = t), t));
	  }
	  static xg(t) {
	    t = t.toLowerCase();
	    const i = [
	      "bot",
	      "slurp",
	      "baiduspider",
	      "yandex",
	      "facebookexternalhit",
	      "sogou",
	      "ia_archiver",
	      "https://github.com/prerender/prerender",
	      "aolbuild",
	      "bingpreview",
	      "mediapartners-google",
	      "teoma",
	      "taiko",
	      "facebookexternalhit",
	      "facebookcatalog",
	      "meta-webindexer",
	      "meta-externalads",
	      "meta-externalagent",
	      "meta-externalfetcher",
	    ];
	    for (let n = 0; n < i.length; n++) if (-1 !== t.indexOf(i[n])) return !0;
	    return !1;
	  }
	}
	vi.Og = [
	  { string: navigator.platform, uf: "Win", identity: OperatingSystems.kg },
	  { string: navigator.platform, uf: "Mac", identity: OperatingSystems.Pg },
	  { string: navigator.platform, uf: "BlackBerry", identity: "BlackBerry" },
	  { string: navigator.platform, uf: "FreeBSD", identity: "FreeBSD" },
	  { string: navigator.platform, uf: "OpenBSD", identity: "OpenBSD" },
	  { string: navigator.platform, uf: "Nintendo", identity: "Nintendo" },
	  { string: navigator.platform, uf: "SunOS", identity: "SunOS" },
	  { string: navigator.platform, uf: "PlayStation", identity: "PlayStation" },
	  { string: navigator.platform, uf: "X11", identity: "X11" },
	  {
	    string: navigator.userAgent,
	    uf: ["iPhone", "iPad", "iPod"],
	    identity: OperatingSystems.co,
	  },
	  { string: navigator.platform, uf: "Pike v", identity: OperatingSystems.co },
	  { string: navigator.userAgent, uf: ["Web0S"], identity: "WebOS" },
	  { string: navigator.userAgent, uf: "Tizen", identity: "Tizen" },
	  { string: navigator.userAgent, uf: "Coolita", identity: "Other Smart TV" },
	  { string: navigator.userAgent, uf: "WhaleTV", identity: "Other Smart TV" },
	  {
	    string: navigator.platform,
	    uf: ["Linux armv7l", "Android"],
	    identity: OperatingSystems.Dg,
	  },
	  { string: navigator.userAgent, uf: ["Android"], identity: OperatingSystems.Dg },
	  { string: navigator.platform, uf: "Linux", identity: "Linux" },
	];
	const ro = new vi();

	const STORAGE_KEYS = {
	  Ou: {
	    Cu: "ab.storage.userId",
	    tl: "ab.storage.deviceId",
	    um: "ab.storage.sessionId",
	  },
	  ft: {
	    Qc: "ab.test",
	    tE: "ab.storage.events",
	    eE: "ab.storage.attributes",
	    sE: "ab.storage.attributes.anonymous_user",
	    ac: "ab.storage.device",
	    Dl: "ab.storage.sdk_metadata",
	    Tl: "ab.storage.session_id_for_cached_metadata",
	    Uu: "ab.storage.pushToken",
	    rE: "ab.storage.cardImpressions",
	    jc: "ab.storage.serverConfig",
	    oE: "ab.storage.triggers",
	    nE: "ab.storage.triggers.ts",
	    dm: "ab.storage.messagingSessionStart",
	    Ps: "ab.storage.cc",
	    Gs: "ab.storage.ccLastFullSync",
	    Hs: "ab.storage.ccLastCardUpdated",
	    uc: "ab.storage.globalRateLimitCurrentTokenCount",
	    fc: "ab.storage.dynamicRateLimitCurrentTokenCount",
	    Jt: "ab.storage.ccClicks",
	    Vt: "ab.storage.ccImpressions",
	    Pt: "ab.storage.ccDismissals",
	    aE: "ab.storage.lastDisplayedTriggerTimesById",
	    iE: "ab.storage.lastDisplayedTriggerTime",
	    EE: "ab.storage.triggerFireInstancesById",
	    xh: "ab.storage.signature",
	    SE: "ab.storage.brazeSyncRetryCount",
	    Qs: "ab.storage.sdkVersion",
	    lo: "ab.storage.ff",
	    vo: "ab.storage.ffImpressions",
	    Do: "ab.storage.ffLastRefreshAt",
	    Co: "ab.storage.ff.sessionId",
	    lE: "ab.storage.lastReqToEndpoint",
	    _E: "ab.storage.requestAttempts",
	    Wn: "ab.storage.deferredIam",
	    Jl: "ab.storage.lastSdkReq",
	    uE: "ab.storage.alias",
	    vt: "ab.storage.banners",
	    Dt: "ab.storage.banners.impressions",
	    Bt: "ab.storage.banners.sessionId",
	    Ue: "ab.storage.dust.mite",
	    Ne: "ab.storage.dust.host",
	    Te: "ab.storage.dust.auth",
	    ze: "ab.storage.dust.expiration",
	  },
	  pe: "ab.optOut",
	};
	class ee {
	  constructor(t, e) {
	    (this.TE = t), (this.cE = e), (this.TE = t), (this.cE = e);
	  }
	  Sl(t) {
	    const e = keys(STORAGE_KEYS.Ou),
	      s = new ee.le(t);
	    for (const t of e) s.remove(STORAGE_KEYS.Ou[t]);
	  }
	  Iu(t, e) {
	    let s = null;
	    null != e && e instanceof _t && (s = e.gt()), this.TE.store(t, s);
	  }
	  hE(t) {
	    const e = this.$u(t);
	    null != e && ((e.gm = new Date().valueOf()), this.Iu(t, e));
	  }
	  $u(t) {
	    const e = this.TE.jr(t),
	      s = ((t) => {
	        let e;
	        try {
	          e = JSON.parse(t);
	        } catch (t) {
	          e = null;
	        }
	        return e;
	      })(e);
	    let r;
	    if (s) (r = _t._u(s) || null), r && this.Iu(t, r);
	    else {
	      const s = _t.AE(e);
	      (r = _t._u(s) || null), s !== e && r && this.Iu(t, r);
	    }
	    return r;
	  }
	  xm(t) {
	    this.TE.remove(t);
	  }
	  Al() {
	    const t = keys(STORAGE_KEYS.Ou);
	    let e;
	    for (const s of t)
	      (e = this.$u(STORAGE_KEYS.Ou[s])),
	        null != e && this.Iu(STORAGE_KEYS.Ou[s], e);
	  }
	  ol(t) {
	    let e;
	    if (null == t || 0 === t.length) return !1;
	    e = isArray(t) ? t : [t];
	    let s = this.cE.jr(STORAGE_KEYS.ft.tE);
	    (null != s && isArray(s)) || (s = []);
	    for (let t = 0; t < e.length; t++) s.push(e[t].gt());
	    return this.cE.store(STORAGE_KEYS.ft.tE, s);
	  }
	  wm(t) {
	    return null != t && this.ol([t]);
	  }
	  RE() {
	    let t = this.cE.jr(STORAGE_KEYS.ft.tE);
	    this.cE.remove(STORAGE_KEYS.ft.tE), null == t && (t = []);
	    const e = [];
	    let s = !1,
	      r = null;
	    if (isArray(t))
	      for (let s = 0; s < t.length; s++)
	        De.gE(t[s]) ? e.push(De._u(t[s])) : (r = s);
	    else s = !0;
	    if (s || null != r) {
	      let o = "Stored events could not be deserialized as Events";
	      s &&
	        (o += ", was " + Object.prototype.toString.call(t) + " not an array"),
	        null != r &&
	          (o += ", value at index " + r + " does not look like an event"),
	        (o +=
	          ", serialized values were of type " +
	          typeof t +
	          ": " +
	          JSON.stringify(t)),
	        e.push(new De(null, f.wl, new Date().valueOf(), null, { e: o }));
	    }
	    return e;
	  }
	  bt(t, e) {
	    return (
	      !!validateValueIsFromEnum(
	        STORAGE_KEYS.ft,
	        t,
	        "StorageManager cannot store object.",
	        "STORAGE_KEYS.OBJECTS",
	      ) && this.cE.store(t, e)
	    );
	  }
	  dt(t) {
	    return (
	      !!validateValueIsFromEnum(
	        STORAGE_KEYS.ft,
	        t,
	        "StorageManager cannot retrieve object.",
	        "STORAGE_KEYS.OBJECTS",
	      ) && this.cE.jr(t)
	    );
	  }
	  zt(t) {
	    return (
	      !!validateValueIsFromEnum(
	        STORAGE_KEYS.ft,
	        t,
	        "StorageManager cannot remove object.",
	        "STORAGE_KEYS.OBJECTS",
	      ) && (this.cE.remove(t), !0)
	    );
	  }
	  clearData() {
	    const t = keys(STORAGE_KEYS.Ou),
	      e = keys(STORAGE_KEYS.ft);
	    for (let e = 0; e < t.length; e++) {
	      const s = t[e];
	      this.TE.remove(STORAGE_KEYS.Ou[s]);
	    }
	    for (let t = 0; t < e.length; t++) {
	      const s = e[t];
	      this.cE.remove(STORAGE_KEYS.ft[s]);
	    }
	  }
	  OE(t) {
	    return t || STORAGE_KEYS.ft.sE;
	  }
	  Xl(t) {
	    let e = this.cE.jr(STORAGE_KEYS.ft.eE);
	    null == e && (e = {});
	    const s = this.OE(t[User.Va]),
	      r = e[s];
	    for (const o in t)
	      o !== User.Va &&
	        (null == e[s] || (r && null == r[o])) &&
	        this.Eu(t[User.Va], o, t[o]);
	  }
	  Eu(t, e, s) {
	    let r = this.cE.jr(STORAGE_KEYS.ft.eE);
	    null == r && (r = {});
	    const o = this.OE(t);
	    let n = r[o];
	    if (
	      (null == n && ((n = {}), null != t && (n[User.Va] = t)), e === User.Bu)
	    ) {
	      null == n[e] && (n[e] = {});
	      for (const t in s) n[e][t] = s[t];
	    } else n[e] = s;
	    return (r[o] = n), this.cE.store(STORAGE_KEYS.ft.eE, r);
	  }
	  IE() {
	    const t = this.cE.jr(STORAGE_KEYS.ft.eE);
	    this.cE.remove(STORAGE_KEYS.ft.eE);
	    const e = [];
	    for (const s in t) null != t[s] && e.push(t[s]);
	    return e;
	  }
	  Lu(t) {
	    const e = this.cE.jr(STORAGE_KEYS.ft.eE);
	    if (null != e) {
	      const s = this.OE(null),
	        r = e[s];
	      null != r &&
	        ((e[s] = void 0),
	        this.cE.store(STORAGE_KEYS.ft.eE, e),
	        (r[User.Va] = t),
	        this.Xl(r));
	    }
	    const s = this.$u(STORAGE_KEYS.Ou.um);
	    let r = null;
	    null != s && (r = s.Tu);
	    const o = this.RE();
	    if (null != o)
	      for (let e = 0; e < o.length; e++) {
	        const s = o[e];
	        null == s.userId && s.sessionId == r && (s.userId = t), this.wm(s);
	      }
	  }
	  dE() {
	    return this.cE.bE;
	  }
	}
	(ee.Wc = class {
	  constructor(t) {
	    (this.tu = t), (this.tu = t), (this.bE = ro.fE() ? 3 : 10);
	  }
	  mE(t) {
	    return t + "." + this.tu;
	  }
	  store(t, e) {
	    const s = { v: e };
	    try {
	      return localStorage.setItem(this.mE(t), JSON.stringify(s)), !0;
	    } catch (t) {
	      return E$1.info("Storage failure: " + getErrorMessage(t)), !1;
	    }
	  }
	  jr(t) {
	    try {
	      let e = null;
	      const s = localStorage.getItem(this.mE(t));
	      return null != s && (e = JSON.parse(s)), null == e ? null : e.v;
	    } catch (t) {
	      return E$1.info("Storage retrieval failure: " + getErrorMessage(t)), null;
	    }
	  }
	  remove(t) {
	    try {
	      localStorage.removeItem(this.mE(t));
	    } catch (t) {
	      return E$1.info("Storage removal failure: " + getErrorMessage(t)), !1;
	    }
	  }
	}),
	  (ee.Xc = class {
	    constructor() {
	      (this.KE = {}), (this.YE = 5242880), (this.bE = 3);
	    }
	    store(t, e) {
	      const s = { value: e },
	        r = this.NE(e);
	      return r > this.YE
	        ? (E$1.info(
	            "Storage failure: object is ≈" +
	              r +
	              " bytes which is greater than the max of " +
	              this.YE,
	          ),
	          !1)
	        : ((this.KE[t] = s), !0);
	    }
	    NE(t) {
	      const e = [],
	        s = [t];
	      let r = 0;
	      for (; s.length; ) {
	        const t = s.pop();
	        if ("boolean" == typeof t) r += 4;
	        else if ("string" == typeof t) r += 2 * t.length;
	        else if ("number" == typeof t) r += 8;
	        else if ("object" == typeof t && -1 === e.indexOf(t)) {
	          let r, o;
	          e.push(t);
	          for (const e in t) (o = t), (r = e), s.push(o[r]);
	        }
	      }
	      return r;
	    }
	    jr(t) {
	      const e = this.KE[t];
	      return null == e ? null : e.value;
	    }
	    remove(t) {
	      this.KE[t] = null;
	    }
	  }),
	  (ee.le = class {
	    constructor(t, e) {
	      (this.tu = t),
	        (this.DE = e),
	        (this.tu = t),
	        (this.GE = this.CE()),
	        (this.ME = 576e3),
	        (this.DE = !!e);
	    }
	    mE(t) {
	      return null != this.tu ? t + "." + this.tu : t;
	    }
	    CE() {
	      let t = 0,
	        e = document.location.hostname;
	      const s = e.split("."),
	        r = "ab._gd";
	      for (; t < s.length - 1 && -1 === document.cookie.indexOf(r + "=" + r); )
	        t++,
	          (e = "." + s.slice(-1 - t).join(".")),
	          (document.cookie = r + "=" + r + ";domain=" + e + ";");
	      return (
	        (document.cookie =
	          r + "=;expires=" + new Date(0).toUTCString() + ";domain=" + e + ";"),
	        e
	      );
	    }
	    me() {
	      const t = new Date();
	      return t.setTime(t.getTime() + 60 * this.ME * 1e3), t.getFullYear();
	    }
	    pE() {
	      const t = values(STORAGE_KEYS.Ou),
	        e = document.cookie.split(";");
	      for (let s = 0; s < e.length; s++) {
	        let r = e[s];
	        for (; " " === r.charAt(0); ) r = r.substring(1);
	        let o = !1;
	        for (let e = 0; e < t.length; e++)
	          if (0 === r.indexOf(t[e])) {
	            o = !0;
	            break;
	          }
	        if (o) {
	          const t = r.split("=")[0];
	          -1 === t.indexOf("." + this.tu) && this.UE(t);
	        }
	      }
	    }
	    store(t, e) {
	      this.pE();
	      const s = new Date();
	      s.setTime(s.getTime() + 60 * this.ME * 1e3);
	      const r = "expires=" + s.toUTCString(),
	        o = "domain=" + this.GE;
	      let n;
	      n = this.DE ? e : encodeURIComponent(e);
	      const a = this.mE(t) + "=" + n + ";" + r + ";" + o + ";path=/";
	      return a.length >= 4093
	        ? (E$1.info(
	            "Storage failure: string is " +
	              a.length +
	              " chars which is too large to store as a cookie.",
	          ),
	          !1)
	        : ((document.cookie = a), !0);
	    }
	    jr(t) {
	      const e = [],
	        s = this.mE(t) + "=",
	        r = document.cookie.split(";");
	      for (let o = 0; o < r.length; o++) {
	        let n = r[o];
	        for (; " " === n.charAt(0); ) n = n.substring(1);
	        if (0 === n.indexOf(s))
	          try {
	            let t;
	            (t = this.DE
	              ? n.substring(s.length, n.length)
	              : decodeURIComponent(n.substring(s.length, n.length))),
	              e.push(t);
	          } catch (e) {
	            return (
	              E$1.info("Storage retrieval failure: " + getErrorMessage(e)),
	              this.remove(t),
	              null
	            );
	          }
	      }
	      return e.length > 0 ? e[e.length - 1] : null;
	    }
	    remove(t) {
	      this.UE(this.mE(t));
	    }
	    UE(t) {
	      const e = t + "=;expires=" + new Date(0).toUTCString();
	      (document.cookie = e), (document.cookie = e + ";path=/");
	      const s = e + ";domain=" + this.GE;
	      (document.cookie = s), (document.cookie = s + ";path=/");
	    }
	  }),
	  (ee.Jc = class {
	    constructor(t, e, s) {
	      (this.tu = t),
	        (this.vE = []),
	        e && this.vE.push(new ee.le(t)),
	        s && this.vE.push(new ee.Wc(t)),
	        this.vE.push(new ee.Xc());
	    }
	    store(t, e) {
	      let s = !0;
	      for (let r = 0; r < this.vE.length; r++) s = this.vE[r].store(t, e) && s;
	      return s;
	    }
	    jr(t) {
	      for (let e = 0; e < this.vE.length; e++) {
	        const s = this.vE[e].jr(t);
	        if (null != s) return s;
	      }
	      return null;
	    }
	    remove(t) {
	      new ee.le(this.tu).remove(t);
	      for (let e = 0; e < this.vE.length; e++) this.vE[e].remove(t);
	    }
	  });

	class kt {
	  constructor(t, i, s) {
	    (this.B = t),
	      (this.gh = i),
	      (this.ph = s),
	      (this.B = t),
	      (this.gh = i || !1),
	      (this.ph = s),
	      (this.Fh = new m()),
	      (this.kh = 0),
	      (this.fh = 1);
	  }
	  wh() {
	    return this.gh;
	  }
	  jh() {
	    return this.B.dt(STORAGE_KEYS.ft.xh);
	  }
	  setSdkAuthenticationSignature(t) {
	    const i = this.jh();
	    this.B.bt(STORAGE_KEYS.ft.xh, t);
	    const e = et.Us.Rs;
	    new et(e, E$1).setItem(e.Fs.qh, this.fh, t), i !== t && this.Z();
	  }
	  yh() {
	    this.B.zt(STORAGE_KEYS.ft.xh);
	    const t = et.Us.Rs;
	    new et(t, E$1).je(t.Fs.qh, this.fh);
	  }
	  subscribeToSdkAuthenticationFailures(t) {
	    return this.ph.Rt(t);
	  }
	  Bh(t) {
	    this.ph.L(t);
	  }
	  Gh() {
	    this.Fh.removeAllSubscriptions();
	  }
	  Hh() {
	    this.kh += 1;
	  }
	  Jh() {
	    return this.kh;
	  }
	  Z() {
	    this.kh = 0;
	  }
	}

	class t {
	  constructor() {}
	  N(a) {}
	  changeUser(a = !1) {}
	  clearData(a = !1) {}
	}

	class Jt {
	  constructor(s) {
	    (this.id = s), (this.id = s);
	  }
	  Hn() {
	    const s = {};
	    return (
	      null != this.browser && (s.browser = this.browser),
	      null != this.ec && (s.browser_version = this.ec),
	      null != this.os && (s.os_version = this.os),
	      null != this.resolution && (s.resolution = this.resolution),
	      null != this.language && (s.locale = this.language),
	      null != this.timeZone && (s.time_zone = this.timeZone),
	      null != this.userAgent && (s.user_agent = this.userAgent),
	      s
	    );
	  }
	}

	var DeviceProperties = {
	  BROWSER: "browser",
	  BROWSER_VERSION: "browserVersion",
	  OS: "os",
	  RESOLUTION: "resolution",
	  LANGUAGE: "language",
	  TIME_ZONE: "timeZone",
	  USER_AGENT: "userAgent",
	};

	class Ot {
	  constructor(t, e) {
	    (this.B = t),
	      (this.tc = e),
	      (this.B = t),
	      null == e && (e = values(DeviceProperties)),
	      (this.tc = e);
	  }
	  ve(t = !0) {
	    let e = this.B.$u(STORAGE_KEYS.Ou.tl);
	    null == e && ((e = new _t(P$1.se())), t && this.B.Iu(STORAGE_KEYS.Ou.tl, e));
	    const r = new Jt(e.Tu);
	    for (let t = 0; t < this.tc.length; t++) {
	      switch (this.tc[t]) {
	        case DeviceProperties.BROWSER:
	          r.browser = ro.browser;
	          break;
	        case DeviceProperties.BROWSER_VERSION:
	          r.ec = ro.version;
	          break;
	        case DeviceProperties.OS:
	          r.os = this.rc();
	          break;
	        case DeviceProperties.RESOLUTION:
	          r.sc = screen.width + "x" + screen.height;
	          break;
	        case DeviceProperties.LANGUAGE:
	          r.language = ro.language;
	          break;
	        case DeviceProperties.TIME_ZONE:
	          r.timeZone = this.oc(new Date());
	          break;
	        case DeviceProperties.USER_AGENT:
	          r.userAgent = ro.userAgent;
	      }
	    }
	    return r;
	  }
	  rc() {
	    if (ro.nc()) return ro.nc();
	    const t = this.B.dt(STORAGE_KEYS.ft.ac);
	    return t && t.os_version ? t.os_version : ro.rc();
	  }
	  oc(t) {
	    let e = !1;
	    if ("undefined" != typeof Intl && "function" == typeof Intl.DateTimeFormat)
	      try {
	        if ("function" == typeof Intl.DateTimeFormat().resolvedOptions) {
	          const t = Intl.DateTimeFormat().resolvedOptions().timeZone;
	          if (null != t && "" !== t) return t;
	        }
	      } catch (t) {
	        E$1.info(
	          "Intl.DateTimeFormat threw an error, cannot detect user's time zone:" +
	            getErrorMessage(t),
	        ),
	          (e = !0);
	      }
	    if (e) return "";
	    const r = t.getTimezoneOffset();
	    return this.cc(r);
	  }
	  cc(t) {
	    const e = Math.trunc(t / 60),
	      r = Math.trunc(t % 60);
	    let s = "GMT";
	    return (
	      0 !== t &&
	        ((s += t < 0 ? "+" : "-"),
	        (s +=
	          ("00" + Math.abs(e)).slice(-2) +
	          ":" +
	          ("00" + Math.abs(r)).slice(-2))),
	      s
	    );
	  }
	}

	var Xt = {
	  Bl: "invalid_api_key",
	  zl: "blacklisted",
	  jl: "no_device_identifier",
	  Cl: "invalid_json_response",
	  yl: "empty_response",
	  __: "sdk_auth_error",
	};

	const h = {
	  H: {
	    Ze: "data",
	    vi: "content_cards/sync",
	    wo: "feature_flags/sync",
	    On: "template",
	    G: "banners/sync",
	  },
	  bc: (t) => (null == t ? void 0 : t.dt(STORAGE_KEYS.ft.lE)),
	  Am: (t) => (null == t ? void 0 : t.dt(STORAGE_KEYS.ft._E)),
	  Rm: (t, e) => {
	    null == t || t.bt(STORAGE_KEYS.ft.lE, e);
	  },
	  qm: (t, e) => {
	    null == t || t.bt(STORAGE_KEYS.ft._E, e);
	  },
	  Pl: (t, e) => {
	    if (!t || !e) return -1;
	    const s = h.bc(t);
	    if (null == s) return -1;
	    const n = s[e];
	    return null == n || isNaN(n) ? -1 : n;
	  },
	  Ul: (t, e) => {
	    let s = REQUEST_ATTEMPT_DEFAULT;
	    if (!t || !e) return s;
	    const n = h.Am(t);
	    return null == n ? s : ((s = n[e]), null == s || isNaN(s) ? REQUEST_ATTEMPT_DEFAULT : s);
	  },
	  K: (t, e, s) => {
	    if (!t || !e) return;
	    let n = h.bc(t);
	    null == n && (n = {}), (n[e] = s), h.Rm(t, n);
	  },
	  xl: (t, e, s) => {
	    if (!t || !e) return;
	    let n = h.Am(t);
	    null == n && (n = {}), (n[e] = s), h.qm(t, n);
	  },
	  fi: (t, e) => {
	    t && e && h.xl(t, e, REQUEST_ATTEMPT_DEFAULT);
	  },
	  Zl: (t, e) => {
	    if (!t || !e) return;
	    const s = h.Ul(t, e);
	    h.xl(t, e, s + 1);
	  },
	};

	const l = {
	  O: (t) => {
	    let e, o;
	    try {
	      const r = () => {
	        E$1.error("This browser does not have any supported ajax options!");
	      };
	      let n = !1;
	      if ((window.XMLHttpRequest && (n = !0), !n)) return void r();
	      e = new XMLHttpRequest();
	      const s = (o) => {
	        "function" == typeof t.error && t.error(e.status),
	          "function" == typeof t.tt && t.tt(!1, o);
	      };
	      (e.onload = () => {
	        let o = !1;
	        if (4 !== e.readyState) return;
	        o = (e.status >= 200 && e.status < 300) || 304 === e.status;
	        const r = e.getAllResponseHeaders();
	        if (o) {
	          if ("function" == typeof t.W) {
	            let o;
	            try {
	              o = JSON.parse(e.responseText);
	            } catch (o) {
	              const n = {
	                error: "" === e.responseText ? Xt.yl : Xt.Cl,
	                response: e.responseText,
	              };
	              (0, t.W)(n, r);
	            }
	            o && t.W(o, r);
	          }
	          "function" == typeof t.tt && t.tt(!0, r);
	        } else s(r);
	      }),
	        (e.onerror = () => {
	          s(e.getAllResponseHeaders());
	        }),
	        (e.ontimeout = () => {
	          s();
	        }),
	        (o = JSON.stringify(t.data)),
	        e.open("POST", t.url, !0),
	        e.setRequestHeader("Content-type", "application/json"),
	        e.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	      const i = t.headers || [];
	      for (const t of i) e.setRequestHeader(t[0], t[1]);
	      e.send(o);
	    } catch (t) {
	      E$1.error(`Network request error: ${getErrorMessage(t)}`);
	    }
	  },
	};
	const readResponseHeaders = (t) => {
	  const e = {},
	    o = t.toString().split("\r\n");
	  if (!o) return e;
	  let r, n;
	  for (const t of o)
	    t &&
	      ((r = t.slice(0, t.indexOf(":")).toLowerCase().trim()),
	      (n = t.slice(t.indexOf(":") + 1).trim()),
	      (e[r] = n));
	  return e;
	};

	class Mt {
	  constructor(t, e, i, s, r, n, o, a, h, u, l, c) {
	    (this.eu = t),
	      (this.B = e),
	      (this.hl = i),
	      (this.vs = s),
	      (this.C = r),
	      (this.h = n),
	      (this.tu = o),
	      (this.al = a),
	      (this.sl = h),
	      (this.rl = u),
	      (this.appVersion = l),
	      (this.vl = c),
	      (this.Rl = (t) => (null == t ? "" : `${t} `)),
	      (this.eu = t),
	      (this.B = e),
	      (this.hl = i),
	      (this.vs = s),
	      (this.C = r),
	      (this.h = n),
	      (this.tu = o),
	      (this.al = a),
	      (this.sl = h),
	      (this.rl = u),
	      (this.appVersion = l),
	      (this.vl = c),
	      (this.bl = ["npm"]),
	      (this.ql = {});
	  }
	  $(t, e = !1, i = !1) {
	    const r = this.eu.ve(!i),
	      n = r.Hn(),
	      o = this.B.dt(STORAGE_KEYS.ft.ac);
	    isEqual(o, n) || (t.device = n),
	      (t.api_key = this.tu),
	      (t.time = convertMsToSeconds(new Date().valueOf(), !0));
	    const a = this.B.dt(STORAGE_KEYS.ft.Dl) || [],
	      h = this.B.dt(STORAGE_KEYS.ft.Tl) || "";
	    this.bl.length > 0 &&
	      (!isEqual(a, this.bl) || h !== this.C.yt()) &&
	      (t.sdk_metadata = this.bl),
	      (t.sdk_version = this.sl),
	      this.rl && (t.sdk_flavor = this.rl),
	      (t.app_version = this.appVersion),
	      (t.app_version_code = this.vl),
	      (t.device_id = r.id);
	    const u = this.vs.getUserId();
	    if ((e && null !== u && (t.user_id = u), !u && !this.hl.wh())) {
	      const e = getAlias(this.B);
	      e && (t.alias = e);
	    }
	    return t;
	  }
	  Y(t, e, i) {
	    const s = e.auth_error,
	      r = e.error;
	    if (!s && !r) return !0;
	    if (s) {
	      let e;
	      this.hl.Hh();
	      const r = { errorCode: s.error_code };
	      for (const t of i)
	        isArray(t) && "X-Braze-Auth-Signature" === t[0] && (r.signature = t[1]);
	      t.respond_with && t.respond_with.user_id
	        ? (r.userId = t.respond_with.user_id)
	        : t.user_id && (r.userId = t.user_id);
	      const n = s.reason;
	      return (
	        n
	          ? ((r.reason = n), (e = `due to ${n}`))
	          : (e = `with error code ${s.error_code}.`),
	        this.hl.wh() ||
	          (e +=
	            ' Please use the "enableSdkAuthentication" initialization option to enable authentication.'),
	        E$1.error(`SDK Authentication failed ${e}`),
	        this.kl(t.events || [], t.attributes || []),
	        this.hl.Bh(r),
	        !1
	      );
	    }
	    if (r) {
	      let i,
	        s = r;
	      switch (s) {
	        case Xt.yl:
	          return (
	            (i = "Received successful response with empty body."),
	            v$1.lt(f.wl, { e: i }),
	            E$1.info(i),
	            !1
	          );
	        case Xt.Cl:
	          return (
	            (i = "Received successful response with invalid JSON"),
	            v$1.lt(f.wl, { e: i + ": " + e.response }),
	            E$1.info(i),
	            !1
	          );
	        case Xt.Bl:
	          s = `The API key "${t.api_key}" is invalid for the baseUrl ${this.al}`;
	          break;
	        case Xt.zl:
	          s =
	            "Sorry, we are not currently accepting your requests. If you think this is in error, please contact us.";
	          break;
	        case Xt.jl:
	          s = "No device identifier. Please contact support@braze.com";
	      }
	      E$1.error("Backend error: " + s);
	    }
	    return !1;
	  }
	  Ml(t, e, i) {
	    return !!((t && 0 !== t.length) || (e && 0 !== e.length) || i);
	  }
	  $l(t, e, i, s = !1) {
	    const r = [],
	      n = (t) => t || "",
	      o = n(this.vs.getUserId());
	    let a = this.Xn(t);
	    const u = [],
	      l = [];
	    let c,
	      d = null;
	    if (e.length > 0) {
	      const t = [];
	      for (const i of e) {
	        if (((c = i.Hn()), this.hl.wh())) {
	          if (o && !c.user_id) {
	            d || (d = {}), d.events || (d.events = []), d.events.push(c);
	            continue;
	          }
	          if (n(c.user_id) !== o) {
	            l.push(c);
	            continue;
	          }
	        }
	        t.push(c);
	      }
	      t.length > 0 && (a.events = t);
	    }
	    if (i.length > 0) {
	      const t = [];
	      for (const e of i)
	        e && (this.hl.wh() && n(e.user_id) !== o ? u.push(e) : t.push(e));
	      t.length > 0 && (a.attributes = t);
	    }
	    if ((this.kl(l, u), (a = this.$(a, !1, s)), d)) {
	      d = this.$(d, !1, s);
	      const t = { requestData: d, headers: this.A(d, h.H.Ze) };
	      r.push(t);
	    }
	    if (a && !this.Ml(a.events, a.attributes, t)) return d ? r : null;
	    const f = { requestData: a, headers: this.A(a, h.H.Ze) };
	    return r.push(f), r;
	  }
	  kl(t, e) {
	    if (t) {
	      const e = [];
	      for (const i of t) {
	        const t = De.fromJson(i);
	        (t.time = convertSecondsToMs(t.time)), e.push(t);
	      }
	      this.B.ol(e);
	    }
	    if (e) for (const t of e) this.B.Xl(t);
	  }
	  _(t, e) {
	    let i = "HTTP error ";
	    null != t && (i += t + " "), (i += e), E$1.error(i);
	  }
	  Ll(t) {
	    return v$1.lt(f.Fl, { n: t });
	  }
	  Xn(t, e) {
	    const i = {};
	    t && (i.triggers = !0);
	    const s = null != e ? e : this.vs.getUserId();
	    if ((s && (i.user_id = s), !i.user_id && !this.hl.wh())) {
	      const t = getAlias(this.B);
	      t && (i.alias = t);
	    }
	    return (i.config = { config_time: this.h.xt() }), { respond_with: i };
	  }
	  Kl(t) {
	    const e = new Date().valueOf();
	    let i = LAST_REQUEST_TO_ENDPOINT_MS_AGO_DEFAULT.toString();
	    const s = h.Pl(this.B, t);
	    if (-1 !== s) {
	      i = (e - s).toString();
	    }
	    return i;
	  }
	  A(t, e, i = !1) {
	    const s = [["X-Braze-Api-Key", this.tu]],
	      r = this.Kl(e);
	    s.push(["X-Braze-Last-Req-Ms-Ago", r]);
	    const n = h.Ul(this.B, e).toString();
	    s.push(["X-Braze-Req-Attempt", n]);
	    let o = !1;
	    if (
	      (null != t.respond_with &&
	        t.respond_with.triggers &&
	        (s.push(["X-Braze-TriggersRequest", "true"]), (o = !0)),
	      e === h.H.vi)
	    ) {
	      s.push(["X-Braze-ContentCardsRequest", "true"]);
	      let t = h.Ul(this.B, h.H.vi);
	      (t && !i) || ((t = 1), h.xl(this.B, h.H.vi, t));
	      const e = Math.max(0, t - 1);
	      s.push(["BRAZE-SYNC-RETRY-COUNT", e.toString()]), (o = !0);
	    }
	    if (
	      (e === h.H.wo &&
	        (s.push(["X-Braze-FeatureFlagsRequest", "true"]), (o = !0)),
	      o && s.push(["X-Braze-DataRequest", "true"]),
	      this.hl.wh())
	    ) {
	      const t = this.hl.jh();
	      null != t && s.push(["X-Braze-Auth-Signature", t]);
	    }
	    return s;
	  }
	  Hl(t, e, i, s) {
	    if (this.ql[s]) return;
	    const r = window.setTimeout(() => {
	      E$1.info(`Retrying rate limited ${this.Rl(s)}SDK request.`),
	        this.J(e, i, s);
	    }, t);
	    this.ql[s] = r;
	  }
	  fo() {
	    for (const t in this.ql) {
	      const e = this.ql[t];
	      window.clearTimeout(e);
	    }
	    this.ql = {};
	  }
	  J(t, e, i, r) {
	    if (!this.Ol(i))
	      return (
	        E$1.info(`${this.Rl(i)}SDK request being rate limited.`),
	        void ("function" == typeof r && r())
	      );
	    const n = this.Gl();
	    if (!n.Wl)
	      return (
	        this.Hl(n.Yl, t, e, i),
	        void E$1.info(
	          `${this.Rl(
            i,
          )}SDK request being rate limited. Request will be retried in ${Math.trunc(
            n.Yl / 1e3,
          )} seconds.`,
	        )
	      );
	    this.B.bt(STORAGE_KEYS.ft.Jl, new Date().valueOf());
	    const o = t.device;
	    o && o.os_version instanceof Promise
	      ? o.os_version.then((i) => {
	          (t.device.os_version = i), e(n.Ql);
	        })
	      : e(n.Ql);
	  }
	  Vl(t) {
	    const e = t ? readResponseHeaders(t) : null;
	    if (!e || !e["retry-after"]) return null;
	    const i = e["retry-after"];
	    if (isNaN(i) && !isNaN(Date.parse(i)))
	      return { type: "date", value: Date.parse(i) };
	    if (!isNaN(parseFloat(i.toString())))
	      return { type: "timestamp", value: 1e3 * parseFloat(i.toString()) };
	    {
	      const t =
	        "Received unexpected value for retry-after header in /sync response";
	      v$1.lt(f.wl, { e: t + ": " + i });
	    }
	    return null;
	  }
	  et(t, e, i, s, r, n) {
	    if (h.Ul(this.B, i) >= MAX_RETRY_COUNT_PER_REQUEST) return;
	    let o;
	    n = n || 0;
	    const a = this.Vl(t);
	    r();
	    const u = (t) => {
	      const r = window.setTimeout(() => {
	        e();
	      }, t);
	      s(r), h.Zl(this.B, i);
	    };
	    if (a && !isNaN(a.value)) {
	      switch (a.type) {
	        case "date":
	          (o = a.value - new Date().getTime() + n), o < 0 && e();
	          break;
	        case "timestamp":
	          o = a.value + n;
	      }
	      u(o);
	    } else n ? u(n) : h.fi(this.B, i);
	  }
	  hc(t) {
	    var e;
	    null === (e = this.B) || void 0 === e || e.bt(STORAGE_KEYS.ft.uc, t);
	  }
	  lc(t, e) {
	    let i = this.dc();
	    null == i && (i = {}), (i[t] = e), this.B.bt(STORAGE_KEYS.ft.fc, i);
	  }
	  mc() {
	    var t;
	    return null === (t = this.B) || void 0 === t ? void 0 : t.dt(STORAGE_KEYS.ft.uc);
	  }
	  dc() {
	    var t;
	    return null === (t = this.B) || void 0 === t ? void 0 : t.dt(STORAGE_KEYS.ft.fc);
	  }
	  vc(t, e, i, s, r = "") {
	    let n;
	    if (r) {
	      const t = this.dc();
	      n = null == t || isNaN(t[r]) ? e : t[r];
	    } else (n = this.mc()), (null == n || isNaN(n)) && (n = e);
	    const o = (t - s) / 1e3;
	    return (n = Math.min(n + o / i, e)), n;
	  }
	  Rc(t, e) {
	    return Math.max(0, (1 - t) * e * 1e3);
	  }
	  gc(t, e = "") {
	    var i, r, n, o, a;
	    const u = { Wl: !0, Ql: -1, Yl: 0 };
	    if ((null == t && (t = !0), !t && !e)) return u;
	    let l,
	      c,
	      d = null;
	    if (t) d = null === (i = this.B) || void 0 === i ? void 0 : i.dt(STORAGE_KEYS.ft.Jl);
	    else {
	      const t = h.bc(this.B);
	      if (null == t || null == t[e]) return u;
	      d = t[e];
	    }
	    if (null == d || isNaN(d)) return u;
	    if (
	      (t
	        ? ((l =
	            (null === (r = this.h) || void 0 === r ? void 0 : r.qc()) || -1),
	          (c = (null === (n = this.h) || void 0 === n ? void 0 : n.Ac()) || -1))
	        : ((l =
	            (null === (o = this.h) || void 0 === o ? void 0 : o.Dc(e)) || -1),
	          (c =
	            (null === (a = this.h) || void 0 === a ? void 0 : a.Tc(e)) || -1)),
	      -1 === l || -1 === c)
	    )
	      return u;
	    const f = new Date().valueOf();
	    let m = this.vc(f, l, c, d, e);
	    return m < 1
	      ? ((u.Wl = !1), (u.Yl = this.Rc(m, c)), u)
	      : ((m = Math.trunc(m) - 1),
	        (u.Ql = m),
	        t ? this.hc(m) : this.lc(e, m),
	        u);
	  }
	  Gl() {
	    return this.gc(!0);
	  }
	  Ol(t) {
	    const e = this.gc(!1, t);
	    return !(e && !e.Wl);
	  }
	  Z() {
	    this.hl.Z();
	  }
	  V() {
	    return this.al;
	  }
	  addSdkMetadata(t) {
	    for (const e of t) -1 === this.bl.indexOf(e) && this.bl.push(e);
	  }
	}

	const randomInclusive = (t, a) => (
	  (t = Math.ceil(t)),
	  (a = Math.floor(a)),
	  Math.floor(Math.random() * (a - t + 1)) + t
	);

	class H {
	  constructor(t = !1, s = []) {
	    (this.W = t), (this.Ee = s), (this.W = t), (this.Ee = s);
	  }
	  Yt(t) {
	    (this.W = this.W && t.W), this.Ee.push(...t.Ee);
	  }
	}

	const vt = {
	  cu: () =>
	    "serviceWorker" in navigator &&
	    "undefined" != typeof ServiceWorkerRegistration &&
	    "showNotification" in ServiceWorkerRegistration.prototype &&
	    "PushManager" in window,
	  lu: () =>
	    "safari" in window &&
	    "pushNotification" in window.safari &&
	    "function" == typeof window.safari.pushNotification.permission &&
	    "function" == typeof window.safari.pushNotification.requestPermission,
	  isPushSupported: () => vt.cu() || vt.lu(),
	  isPushBlocked: () => {
	    const o =
	        vt.isPushSupported() &&
	        "Notification" in window &&
	        null != window.Notification &&
	        null != window.Notification.permission &&
	        "denied" === window.Notification.permission,
	      i =
	        vt.isPushSupported() &&
	        (!("Notification" in window) || null == window.Notification);
	    return o || i;
	  },
	  isPushPermissionGranted: () =>
	    vt.isPushSupported() &&
	    "Notification" in window &&
	    null != window.Notification &&
	    null != window.Notification.permission &&
	    "granted" === window.Notification.permission,
	  En: () =>
	    vt.isPushBlocked()
	      ? { Gn: !1, reason: "blocked" }
	      : vt.isPushSupported()
	      ? vt.isPushPermissionGranted()
	        ? { Gn: !1, reason: "permissionGranted" }
	        : { Gn: !0 }
	      : { Gn: !1, reason: "unsupported" },
	  Nn: (o, i) =>
	    "blocked" === o
	      ? `${i} containing a push prompt is not being shown because the user has already declined push permission prompt.`
	      : "unsupported" === o
	      ? `${i} containing a push prompt is not being shown because the browser doesn't support push notifications.`
	      : `${i} containing a push prompt is not being shown because the user has already accepted the permission prompt.`,
	};
	var vt$1 = vt;

	const IamStrings = {
	  sS: "inAppMessage must be an InAppMessage object",
	  eS: "ab-pause-scrolling",
	};

	function removeAllVisibleInAppMessages() {
	  const o = document.querySelectorAll(".ab-iam-root");
	  for (let t = 0; t < o.length; t++) {
	    const s = o[t];
	    if (s.id) {
	      const o = s.id + "-css",
	        t = document.getElementById(o);
	      t && t.parentNode && t.parentNode.removeChild(t);
	    }
	    s.parentNode && s.parentNode.removeChild(s);
	  }
	  const t = document.getElementsByClassName(IamStrings.eS);
	  for (let o = 0; o < t.length; o++) {
	    const s = t[o].classList;
	    s.contains(IamStrings.eS) && s.remove(IamStrings.eS);
	  }
	}

	class Wt {
	  constructor(t, i, s, e, h, n, o, r, l, u) {
	    (this.tu = t),
	      (this.baseUrl = i),
	      (this.C = s),
	      (this.eu = e),
	      (this.vs = h),
	      (this.h = n),
	      (this.B = o),
	      (this.$c = r),
	      (this.hl = l),
	      (this.j = u),
	      (this.tu = t),
	      (this.baseUrl = i),
	      (this.Zc = 0),
	      (this.bE = o.dE() || 0),
	      (this.sd = null),
	      (this.C = s),
	      (this.eu = e),
	      (this.vs = h),
	      (this.h = n),
	      (this.B = o),
	      (this.hl = l),
	      (this.j = u),
	      (this.$c = r),
	      (this.hd = new m()),
	      (this.nd = null),
	      (this.rd = 50),
	      (this.ld = !1),
	      (this.ud = !1);
	  }
	  ad(t, i) {
	    return !t && !i && this.hl.Jh() >= this.rd;
	  }
	  md(t) {
	    let i = this.C.am();
	    if (t.length > 0) {
	      const s = this.vs.getUserId();
	      for (const e of t) {
	        const t = (!e.userId && !s) || e.userId === s;
	        e.type === f.Sm && t && (i = !0);
	      }
	    }
	    return i;
	  }
	  fd(t = !1, i = !0, e, n, o, r = !1, u = !1) {
	    i && this.gd();
	    const c = this.B.RE(),
	      d = this.B.IE();
	    let m = !1;
	    const f = (t, r, u = -1) => {
	        const c = new Date().valueOf();
	        h.K(this.B, h.H.Ze, c),
	          -1 !== u && r.push(["X-Braze-Req-Tokens-Remaining", u.toString()]);
	        let d = !1;
	        l.O({
	          url: this.baseUrl + "/data/",
	          data: t,
	          headers: r,
	          W: (i) => {
	            null != t.respond_with &&
	              t.respond_with.triggers &&
	              (this.Zc = Math.max(this.Zc - 1, 0)),
	              this.j.Y(t, i, r)
	                ? (this.hl.Z(),
	                  this.h.Sc(i),
	                  (null != t.respond_with &&
	                    t.respond_with.user_id != this.vs.getUserId()) ||
	                    (null != t.device && this.B.bt(STORAGE_KEYS.ft.ac, t.device),
	                    null != t.sdk_metadata &&
	                      (this.B.bt(STORAGE_KEYS.ft.Dl, t.sdk_metadata),
	                      this.B.bt(STORAGE_KEYS.ft.Tl, this.C.yt())),
	                    this.$c(i),
	                    h.xl(this.B, h.H.Ze, 1),
	                    "function" == typeof e && e()))
	                : i.auth_error && (d = !0);
	          },
	          error: () => {
	            (d = !0),
	              null != t.respond_with &&
	                t.respond_with.triggers &&
	                (this.Zc = Math.max(this.Zc - 1, 0)),
	              this.j.kl(t.events, t.attributes),
	              "function" == typeof n && n();
	          },
	          tt: (t, s) => {
	            "function" == typeof o && o(!d);
	            const e = this.j.Vl(s);
	            let n = 0;
	            if (e)
	              switch (e.type) {
	                case "date":
	                  n = Math.max(e.value - new Date().valueOf(), 0);
	                  break;
	                case "timestamp":
	                  n = e.value;
	              }
	            if (i && !m) {
	              if (d) {
	                h.Zl(this.B, h.H.Ze);
	                const t = this.h.st(),
	                  i = this.h.it(),
	                  s = this.h.nt();
	                let e = this.sd;
	                (null == e || e < t) && (e = t);
	                const o = Math.min(s, randomInclusive(t, e * i)) + n;
	                this.pd(o);
	              } else this.pd(Math.max(1e3 * this.bE, n));
	              m = !0;
	            }
	          },
	        });
	      },
	      g = this.md(c),
	      p = t || g;
	    if (this.ad(r, g))
	      return void E$1.info(
	        "Declining to flush data due to 50 consecutive authentication failures",
	      );
	    if (i && !this.j.Ml(c, d, p))
	      return this.pd(), void ("function" == typeof o && o(!0));
	    const v = this.j.$l(p, c, d, u);
	    p && this.Zc++;
	    let b = !1;
	    if (v)
	      for (const t of v)
	        this.j.J(
	          t.requestData,
	          (i) => f(t.requestData, t.headers, i),
	          h.H.Ze,
	          n,
	        ),
	          (b = !0);
	    this.hl.wh() && i && !b
	      ? this.pd()
	      : g &&
	        (E$1.info("Invoking new session subscriptions"),
	        this.hd.L(),
	        (this.ud = !0));
	  }
	  vd() {
	    return this.Zc > 0;
	  }
	  pd(t = 1e3 * this.bE) {
	    this.ld ||
	      (this.gd(),
	      (this.nd = window.setTimeout(() => {
	        if (document.hidden) {
	          const t = "visibilitychange",
	            i = () => {
	              document.hidden ||
	                (document.removeEventListener(t, i, !1), this.fd());
	            };
	          document.addEventListener(t, i, !1);
	        } else this.fd();
	      }, t)),
	      (this.sd = t));
	  }
	  gd() {
	    null != this.nd && (clearTimeout(this.nd), (this.nd = null));
	  }
	  initialize() {
	    (this.ld = !1), this.pd();
	  }
	  destroy() {
	    this.hd.removeAllSubscriptions(),
	      this.hl.Gh(),
	      this.gd(),
	      (this.ld = !0),
	      this.fd(void 0, !1, void 0, void 0, void 0, void 0, !0),
	      (this.nd = null),
	      (this.ud = !1);
	  }
	  rn(t) {
	    return this.ud ? (t(), null) : this.hd.Rt(t);
	  }
	  openSession() {
	    const t = this.C.yt() !== this.C.el();
	    t && (this.B.hE(STORAGE_KEYS.Ou.tl), this.B.hE(STORAGE_KEYS.Ou.Cu)),
	      this.fd(!1, void 0, () => {
	        t && (this.B.zt(STORAGE_KEYS.ft.vo), this.B.zt(STORAGE_KEYS.ft.Dt));
	      }),
	      this.Ya(),
	      t &&
	        Promise.resolve().then(function () { return pushManagerFactory; }).then((t) => {
	          if (this.ld) return;
	          const i = t.default.ra();
	          if (
	            null != i &&
	            (vt$1.isPushPermissionGranted() || vt$1.isPushBlocked())
	          ) {
	            const t = () => {
	                i.du()
	                  ? E$1.info(
	                      "Push token maintenance is disabled, not refreshing token for backend.",
	                    )
	                  : i.subscribe();
	              },
	              e = (i, s) => {
	                s && t();
	              },
	              h = () => {
	                const i = this.B.dt(STORAGE_KEYS.ft.Uu);
	                (null == i || i) && t();
	              },
	              n = et.Us.Rs;
	            new et(n, E$1).kr(n.Fs.Fu, e, h);
	          }
	        });
	  }
	  bd() {
	    this.B.zt(STORAGE_KEYS.ft.lo), this.B.zt(STORAGE_KEYS.ft.Ps), this.B.zt(STORAGE_KEYS.ft.Wn);
	  }
	  wd() {
	    var t, i;
	    this.B.zt(STORAGE_KEYS.ft.Jl), this.B.zt(STORAGE_KEYS.ft.lE);
	    const e = h.H;
	    for (const i in e) {
	      const s = e[i];
	      this.j.lc(s, null === (t = this.h) || void 0 === t ? void 0 : t.Dc(s));
	    }
	    this.j.hc(null === (i = this.h) || void 0 === i ? void 0 : i.qc());
	  }
	  changeUser(t, i, e) {
	    const h = this.vs.getUserId();
	    if (h !== t) {
	      this.C.jm(),
	        this.bd(),
	        removeAllVisibleInAppMessages(),
	        null != h && this.fd(void 0, !1, void 0, void 0, void 0),
	        this.vs.Ju(t),
	        e ? this.hl.setSdkAuthenticationSignature(e) : this.hl.yh();
	      for (let t = 0; t < i.length; t++) i[t].changeUser(null == h);
	      this.j.fo(),
	        null != h && this.B.zt(STORAGE_KEYS.ft.rE),
	        this.B.zt(STORAGE_KEYS.ft.ac),
	        this.B.zt(STORAGE_KEYS.ft.uE),
	        this.wd(),
	        this.openSession(),
	        E$1.info('Changed user to "' + t + '".');
	    } else {
	      let i = "Doing nothing.";
	      e &&
	        this.hl.jh() !== e &&
	        (this.hl.setSdkAuthenticationSignature(e),
	        (i = "Updated SDK authentication signature")),
	        E$1.info(`Current user is already ${t}. ${i}`);
	    }
	  }
	  requestImmediateDataFlush(t) {
	    this.gd(), this.C.el();
	    this.fd(
	      void 0,
	      void 0,
	      void 0,
	      () => {
	        E$1.error("Failed to flush data, request will be retried automatically.");
	      },
	      t,
	      !0,
	    );
	  }
	  yr(t, i) {
	    this.C.el(),
	      E$1.info("Requesting explicit trigger refresh."),
	      this.fd(!0, void 0, t, i);
	  }
	  Gu(t, i) {
	    const e = f.kd,
	      h = { a: t, l: i },
	      n = v$1.lt(e, h);
	    return (
	      n && (E$1.info(`Logged alias ${t} with label ${i}`), this.B.bt(STORAGE_KEYS.ft.uE, h)),
	      n
	    );
	  }
	  Mu(t, i, s) {
	    if (this.h.qu(i))
	      return (
	        E$1.info(`Custom Attribute "${i}" is blocklisted, ignoring.`), new H()
	      );
	    const e = { key: i, value: s },
	      h = v$1.lt(t, e);
	    if (h) {
	      const t = "object" == typeof s ? JSON.stringify(s, null, 2) : s;
	      E$1.info(`Logged custom attribute: ${i} with value: ${t}`);
	    }
	    return h;
	  }
	  setLastKnownLocation(t, i, s, e, h, n) {
	    const o = { latitude: i, longitude: s };
	    null != e && (o.altitude = e),
	      null != h && (o.ll_accuracy = h),
	      null != n && (o.alt_accuracy = n);
	    const r = v$1.lt(f.yd, o, t || void 0);
	    return (
	      r &&
	        E$1.info(`Set user last known location as ${JSON.stringify(o, null, 2)}`),
	      r
	    );
	  }
	  $r(t, i) {
	    const s = this.C.el();
	    return new De(this.vs.getUserId(), f.jd, t, s, { cid: i });
	  }
	  Sd(t, i) {
	    return new et(t, i);
	  }
	  Ya() {
	    const t = et.Us.Rs;
	    this.Sd(t, E$1).setItem(t.Fs.Ze, 1, {
	      baseUrl: this.baseUrl,
	      data: { api_key: this.tu, device_id: this.eu.ve().id },
	      userId: this.vs.getUserId(),
	      sdkAuthEnabled: this.hl.wh(),
	    });
	  }
	  Fr(t) {
	    for (const i of t)
	      if (i.api_key === this.tu) this.j.kl(i.events, i.attributes);
	      else {
	        const t = et.Us.Rs;
	        new et(t, E$1).setItem(t.Fs.zr, P$1.se(), i);
	      }
	  }
	  Na(t, i, s) {
	    if (this.h.qu(t))
	      return (
	        E$1.info(`Custom Attribute "${t}" is blocklisted, ignoring.`), new H()
	      );
	    let e, h;
	    return (
	      null === i && null === s
	        ? ((e = f.Ad), (h = { key: t }))
	        : ((e = f.Dd), (h = { key: t, latitude: i, longitude: s })),
	      v$1.lt(e, h)
	    );
	  }
	  Ra(t, i) {
	    const s = { group_id: t, status: i };
	    return v$1.lt(f.$d, s);
	  }
	}

	class li {
	  constructor(
	    t = 0,
	    i = [],
	    s = [],
	    h = [],
	    e = null,
	    l = null,
	    r = { enabled: !1 },
	    n = { enabled: !1, refresh_rate_limit: void 0 },
	    a = { enabled: !0, capacity: GLOBAL_RATE_LIMIT_CAPACITY_DEFAULT, refill_rate: GLOBAL_RATE_LIMIT_REFILL_RATE_DEFAULT, endpoint_overrides: {} },
	    o = null,
	    u = null,
	    c = null,
	  ) {
	    (this.kc = t),
	      (this.Ic = i),
	      (this.Kc = s),
	      (this.Pc = h),
	      (this.Oc = e),
	      (this.xc = l),
	      (this.Gc = r),
	      (this.Xr = n),
	      (this.Nc = a),
	      (this.banners = o),
	      (this.dust = u),
	      (this.Hc = c),
	      (this.kc = t),
	      (this.Ic = i),
	      (this.Kc = s),
	      (this.Pc = h),
	      (this.Oc = e),
	      (this.xc = l),
	      (this.Gc = r),
	      (this.Xr = n),
	      (this.Nc = a),
	      (this.banners = o),
	      (this.dust = u),
	      (this.Hc = c);
	  }
	  gt() {
	    return {
	      s: "6.5.0",
	      l: this.kc,
	      e: this.Ic,
	      a: this.Kc,
	      p: this.Pc,
	      m: this.Oc,
	      v: this.xc,
	      c: this.Gc,
	      f: this.Xr,
	      grl: this.Nc,
	      b: this.banners,
	      d: this.dust,
	      rb: this.Hc,
	    };
	  }
	  static _u(t) {
	    let i = t.l;
	    return (
	      "6.5.0" !== t.s && (i = 0),
	      new li(i, t.e, t.a, t.p, t.m, t.v, t.c, t.f, t.grl, t.b, t.d, t.rb)
	    );
	  }
	}

	class Bt {
	  constructor(t) {
	    (this.B = t),
	      (this.B = t),
	      (this.Ec = new m()),
	      (this.Bc = new m()),
	      (this.wc = new m()),
	      (this.Cc = new m()),
	      (this.yc = new m()),
	      (this.Fc = null),
	      (this.Lc = null);
	  }
	  Mc() {
	    if (null == this.Lc) {
	      const t = this.B.dt(STORAGE_KEYS.ft.jc);
	      this.Lc = null != t ? li._u(t) : new li();
	    }
	    return this.Lc;
	  }
	  xt() {
	    return this.Mc().kc;
	  }
	  Sc(t) {
	    var i, e, n, r;
	    if (null != t && null != t.config) {
	      const l = t.config;
	      if (l.time > this.Mc().kc) {
	        const t = (t) => (null == t ? this.Mc().Nc : t),
	          u = new li(
	            l.time,
	            l.events_blacklist,
	            l.attributes_blacklist,
	            l.purchases_blacklist,
	            l.messaging_session_timeout,
	            l.vapid_public_key,
	            l.content_cards,
	            l.feature_flags,
	            t(l.global_request_rate_limit),
	            l.banners,
	            l.dust,
	            l.request_backoff,
	          );
	        let o = !1;
	        null != u.xc && this.ju() !== u.xc && (o = !0);
	        let a = !1;
	        null != u.Gc.enabled && this.wi() !== u.Gc.enabled && (a = !0);
	        let h = !1;
	        null != u.Xr.enabled && this.Yr() !== u.Xr.enabled && (h = !0);
	        let c = !1;
	        null !=
	          (null === (i = u.banners) || void 0 === i ? void 0 : i.enabled) &&
	          this.kt() !==
	            (null === (e = u.banners) || void 0 === e ? void 0 : e.enabled) &&
	          (c = !0);
	        let d = !1;
	        null != (null === (n = u.dust) || void 0 === n ? void 0 : n.enabled) &&
	          this.Ye() !==
	            (null === (r = u.dust) || void 0 === r ? void 0 : r.enabled) &&
	          (d = !0),
	          (this.Lc = u),
	          this.B.bt(STORAGE_KEYS.ft.jc, u.gt()),
	          o && this.Ec.L(),
	          a && this.Bc.L(),
	          h && this.wc.L(),
	          c && this.Cc.L(),
	          d && this.yc.L();
	      }
	    }
	  }
	  xu(t) {
	    const i = this.Ec.Rt(t);
	    return this.Fc && this.Ec.removeSubscription(this.Fc), (this.Fc = i), i;
	  }
	  Ci(t) {
	    return this.Bc.Rt(t);
	  }
	  jo(t) {
	    return this.wc.Rt(t);
	  }
	  P(t) {
	    return this.Cc.Rt(t);
	  }
	  Tr(t) {
	    return this.yc.Rt(t);
	  }
	  Ce(t) {
	    return -1 !== this.Mc().Ic.indexOf(t);
	  }
	  qu(t) {
	    return -1 !== this.Mc().Kc.indexOf(t);
	  }
	  Dr(t) {
	    return -1 !== this.Mc().Pc.indexOf(t);
	  }
	  _c() {
	    return this.Mc().Oc;
	  }
	  ju() {
	    return this.Mc().xc;
	  }
	  wi() {
	    return this.Mc().Gc.enabled || !1;
	  }
	  Vc() {
	    const t = this.Mc().Nc;
	    return !(!t || null == t.enabled) && t.enabled;
	  }
	  qc() {
	    if (!this.Vc()) return -1;
	    const t = this.Mc().Nc;
	    return null == t.capacity || t.capacity < 10 ? -1 : t.capacity;
	  }
	  Ac() {
	    if (!this.Vc()) return -1;
	    const t = this.Mc().Nc;
	    return null == t.refill_rate || t.refill_rate <= 0 ? -1 : t.refill_rate;
	  }
	  zc(t) {
	    const i = this.Mc().Nc.endpoint_overrides;
	    return null == i ? null : i[t];
	  }
	  Dc(t) {
	    const i = this.zc(t);
	    return null == i || isNaN(i.capacity) || i.capacity <= 0 ? -1 : i.capacity;
	  }
	  Tc(t) {
	    const i = this.zc(t);
	    return null == i || isNaN(i.refill_rate) || i.refill_rate <= 0
	      ? -1
	      : i.refill_rate;
	  }
	  Yr() {
	    return this.Mc().Xr.enabled && null == this.yo()
	      ? (v$1.lt(f.wl, { e: "Missing feature flag refresh_rate_limit." }), !1)
	      : this.Mc().Xr.enabled || !1;
	  }
	  yo() {
	    return this.Mc().Xr.refresh_rate_limit;
	  }
	  kt() {
	    var t;
	    return (
	      (null === (t = this.Mc().banners) || void 0 === t ? void 0 : t.enabled) ||
	      null
	    );
	  }
	  oe() {
	    var t;
	    return (
	      (null === (t = this.Mc().banners) || void 0 === t
	        ? void 0
	        : t.max_placements) || 0
	    );
	  }
	  Ye() {
	    var t;
	    return (
	      (null === (t = this.Mc().dust) || void 0 === t ? void 0 : t.enabled) || !1
	    );
	  }
	  st() {
	    var t;
	    const i =
	      null === (t = this.Mc().Hc) || void 0 === t
	        ? void 0
	        : t.min_sleep_duration_ms;
	    return null != i ? i : REQUEST_BACKOFF_MIN_SLEEP_MS_DEFAULT;
	  }
	  it() {
	    var t;
	    const i =
	      null === (t = this.Mc().Hc) || void 0 === t ? void 0 : t.scale_factor;
	    return null != i ? i : REQUEST_BACKOFF_SCALE_FACTOR_DEFAULT;
	  }
	  nt() {
	    var t;
	    const i =
	      null === (t = this.Mc().Hc) || void 0 === t
	        ? void 0
	        : t.max_sleep_duration_ms;
	    return null != i ? i : REQUEST_BACKOFF_MAX_SLEEP_MS_DEFAULT;
	  }
	}

	class Vt {
	  constructor(s, t, i, e) {
	    (this.B = s),
	      (this.vs = t),
	      (this.h = i),
	      (this.tm = e),
	      (this.B = s),
	      (this.vs = t),
	      (this.h = i),
	      (this.im = 1e3),
	      (null == e || isNaN(e)) && (e = 1800),
	      e < this.im / 1e3 &&
	        (E$1.info(
	          "Specified session timeout of " +
	            e +
	            "s is too small, using the minimum session timeout of " +
	            this.im / 1e3 +
	            "s instead.",
	        ),
	        (e = this.im / 1e3)),
	      (this.tm = e);
	  }
	  nm(s, t) {
	    return new De(this.vs.getUserId(), f.hm, s, t.Tu, { d: convertMsToSeconds(s - t.lm) });
	  }
	  yt() {
	    const t = this.B.$u(STORAGE_KEYS.Ou.um);
	    return null == t ? null : t.Tu;
	  }
	  am() {
	    const t = new Date().valueOf(),
	      i = this.h._c();
	    if (null == i) return !1;
	    const e = this.B.dt(STORAGE_KEYS.ft.dm),
	      n = null == e || t - e > 1e3 * i;
	    return n && this.B.bt(STORAGE_KEYS.ft.dm, t), n;
	  }
	  fm(s, t) {
	    return null == t || null == t.pm || (!(s - t.lm < this.im) && t.pm < s);
	  }
	  el() {
	    const t = new Date().valueOf(),
	      i = t + 1e3 * this.tm,
	      e = this.B.$u(STORAGE_KEYS.Ou.um);
	    if (this.fm(t, e)) {
	      let n = "Generating session start event with time " + t;
	      if (null != e) {
	        let s = e.gm;
	        s - e.lm < this.im && (s = e.lm + this.im),
	          this.B.wm(this.nm(s, e)),
	          (n += " (old session ended " + s + ")");
	      }
	      (n += ". Will expire " + i.valueOf()), E$1.info(n);
	      const o = new _t(P$1.se(), i);
	      this.B.wm(new De(this.vs.getUserId(), f.Sm, t, o.Tu)),
	        this.B.Iu(STORAGE_KEYS.Ou.um, o);
	      return null == this.B.dt(STORAGE_KEYS.ft.dm) && this.B.bt(STORAGE_KEYS.ft.dm, t), o.Tu;
	    }
	    if (null != e) return (e.gm = t), (e.pm = i), this.B.Iu(STORAGE_KEYS.Ou.um, e), e.Tu;
	  }
	  jm() {
	    const t = this.B.$u(STORAGE_KEYS.Ou.um);
	    null != t &&
	      (this.B.xm(STORAGE_KEYS.Ou.um), this.B.wm(this.nm(new Date().valueOf(), t)));
	  }
	}

	const Kt = {
	  _l: function (e, o = !1) {
	    let t = !1;
	    try {
	      if (localStorage && localStorage.getItem)
	        try {
	          localStorage.setItem(STORAGE_KEYS.ft.Qc, "true"),
	            localStorage.getItem(STORAGE_KEYS.ft.Qc) &&
	              (localStorage.removeItem(STORAGE_KEYS.ft.Qc), (t = !0));
	        } catch (e) {
	          if (
	            !(
	              e instanceof Error &&
	              ("QuotaExceededError" === e.name ||
	                "NS_ERROR_DOM_QUOTA_REACHED" === e.name) &&
	              localStorage.length > 0
	            )
	          )
	            throw e;
	          t = !0;
	        }
	    } catch (e) {
	      E$1.info("Local Storage not supported!");
	    }
	    const r = Kt.Uc(),
	      a = new ee.Jc(e, r && !o, t);
	    let n;
	    return (n = t ? new ee.Wc(e) : new ee.Xc()), new ee(a, n);
	  },
	  Uc: function () {
	    return (
	      navigator.cookieEnabled ||
	      ("cookie" in document &&
	        (document.cookie.length > 0 ||
	          (document.cookie = "test").indexOf.call(document.cookie, "test") >
	            -1))
	    );
	  },
	};

	class ControlMessage {
	  constructor(s, t) {
	    (this.triggerId = s),
	      (this.messageExtras = t),
	      (this.triggerId = s),
	      (this.messageExtras = t),
	      (this.extras = {}),
	      (this.isControl = !0),
	      (this.Gt = !1);
	  }
	  static fromJson(s) {
	    return new ControlMessage(s.trigger_id, s.message_extras);
	  }
	  Wt() {
	    return !this.Gt && ((this.Gt = !0), !0);
	  }
	  sm() {
	    return this.Gt;
	  }
	}

	function _isInView(t, n = !1, e = !1, s = !1) {
	  if (null == t) return !1;
	  (n = n || !1), (e = e || !1);
	  const i = t.getBoundingClientRect();
	  return (
	    null != i &&
	    ((i.top >= 0 &&
	      i.top <= (window.innerHeight || document.documentElement.clientHeight)) ||
	      !n) &&
	    (i.left >= 0 || !s) &&
	    ((i.bottom >= 0 &&
	      i.bottom <=
	        (window.innerHeight || document.documentElement.clientHeight)) ||
	      !e) &&
	    (i.right <= (window.innerWidth || document.documentElement.clientWidth) ||
	      !s)
	  );
	}
	const DOMUtils = { lp: null, td: _isInView };
	const DIRECTIONS = { Uo: "up", Vo: "down", de: "left", ce: "right" };
	function supportsPassive() {
	  if (null == DOMUtils.lp) {
	    DOMUtils.lp = !1;
	    try {
	      const t = Object.defineProperty({}, "passive", {
	        get: () => {
	          DOMUtils.lp = !0;
	        },
	      });
	      window.addEventListener("testPassive", () => {}, t),
	        window.removeEventListener("testPassive", () => {}, t);
	    } catch (t) {
	      E$1.error(getErrorMessage(t));
	    }
	  }
	  return DOMUtils.lp;
	}
	function addPassiveEventListener(t, n, e = () => {}) {
	  t.addEventListener(n, e, !!supportsPassive() && { passive: !0 });
	}
	function topIsInView(t) {
	  return DOMUtils.td(t, !0, !1, !1);
	}
	function bottomIsInView(t) {
	  return DOMUtils.td(t, !1, !0, !1);
	}
	function clickElement(t) {
	  if (t.onclick) {
	    const n = document.createEvent("MouseEvents");
	    n.initEvent("click", !0, !0), t.onclick.apply(t, [n]);
	  }
	}
	function detectSwipe(t, n, e) {
	  let s = null,
	    i = null;
	  addPassiveEventListener(t, "touchstart", (t) => {
	    (s = t.touches[0].clientX), (i = t.touches[0].clientY);
	  }),
	    addPassiveEventListener(t, "touchmove", (o) => {
	      if (null == s || null == i) return;
	      const l = s - o.touches[0].clientX,
	        u = i - o.touches[0].clientY;
	      Math.abs(l) > Math.abs(u) && Math.abs(l) >= 25
	        ? (((l > 0 && n === DIRECTIONS.de) || (l < 0 && n === DIRECTIONS.ce)) &&
	            e(o),
	          (s = null),
	          (i = null))
	        : Math.abs(u) >= 25 &&
	          (((u > 0 &&
	            n === DIRECTIONS.Uo &&
	            t.scrollTop === t.scrollHeight - t.offsetHeight) ||
	            (u < 0 && n === DIRECTIONS.Vo && 0 === t.scrollTop)) &&
	            e(o),
	          (s = null),
	          (i = null));
	    });
	}
	function buildSvg(t, n, e) {
	  const s = "http://www.w3.org/2000/svg",
	    i = document.createElementNS(s, "svg");
	  i.setAttribute("viewBox", t), i.setAttribute("xmlns", s);
	  const o = document.createElementNS(s, "path");
	  return (
	    o.setAttribute("d", n),
	    null != e && o.setAttribute("fill", e),
	    i.appendChild(o),
	    i
	  );
	}

	const KeyCodes = { Ho: 32, Wo: 9, Go: 13, Ih: 27 };

	const isIFrame = (e) => null !== e && "IFRAME" === e.tagName;

	class InAppMessage {
	  constructor(
	    t,
	    s,
	    i,
	    h,
	    e,
	    E,
	    n,
	    T,
	    o,
	    r,
	    l,
	    u,
	    a,
	    A,
	    I,
	    c,
	    O,
	    L,
	    _,
	    N,
	    R,
	    S,
	    M,
	    D,
	    C,
	    d,
	    U,
	    b,
	    P,
	    p,
	    f,
	    G,
	  ) {
	    (this.message = t),
	      (this.messageAlignment = s),
	      (this.slideFrom = i),
	      (this.extras = h),
	      (this.triggerId = e),
	      (this.clickAction = E),
	      (this.uri = n),
	      (this.openTarget = T),
	      (this.dismissType = o),
	      (this.duration = r),
	      (this.icon = l),
	      (this.imageUrl = u),
	      (this.imageStyle = a),
	      (this.iconColor = A),
	      (this.iconBackgroundColor = I),
	      (this.backgroundColor = c),
	      (this.textColor = O),
	      (this.closeButtonColor = L),
	      (this.animateIn = _),
	      (this.animateOut = N),
	      (this.header = R),
	      (this.headerAlignment = S),
	      (this.headerTextColor = M),
	      (this.frameColor = D),
	      (this.buttons = C),
	      (this.cropType = d),
	      (this.orientation = U),
	      (this.htmlId = b),
	      (this.css = P),
	      (this.messageExtras = p),
	      (this.language = f),
	      (this.altImageText = G),
	      (this.message = t),
	      (this.messageAlignment = s || InAppMessage.TextAlignment.CENTER),
	      (this.duration = r || 5e3),
	      (this.slideFrom = i || InAppMessage.SlideFrom.BOTTOM),
	      (this.extras = h || {}),
	      (this.triggerId = e),
	      (this.clickAction = E || InAppMessage.ClickAction.NONE),
	      (this.uri = n),
	      (this.openTarget = T || InAppMessage.OpenTarget.NONE),
	      (this.dismissType = o || InAppMessage.DismissType.AUTO_DISMISS),
	      (this.icon = l),
	      (this.imageUrl = u),
	      (this.imageStyle = a || InAppMessage.ImageStyle.TOP),
	      (this.iconColor = A || InAppMessage.th.ih),
	      (this.iconBackgroundColor = I || InAppMessage.th.sh),
	      (this.backgroundColor = c || InAppMessage.th.ih),
	      (this.textColor = O || InAppMessage.th.hh),
	      (this.closeButtonColor = L || InAppMessage.th.eh),
	      (this.animateIn = _),
	      null == this.animateIn && (this.animateIn = !0),
	      (this.animateOut = N),
	      null == this.animateOut && (this.animateOut = !0),
	      (this.header = R),
	      (this.headerAlignment = S || InAppMessage.TextAlignment.CENTER),
	      (this.headerTextColor = M || InAppMessage.th.hh),
	      (this.frameColor = D || InAppMessage.th.Eh),
	      (this.buttons = C || []),
	      (this.cropType = d || InAppMessage.CropType.FIT_CENTER),
	      (this.orientation = U),
	      (this.htmlId = b),
	      (this.css = P),
	      (this.isControl = !1),
	      (this.messageExtras = p),
	      (this.language = f),
	      (this.altImageText = G),
	      (this.nh = !1),
	      (this.Gt = !1),
	      (this.dd = !1),
	      (this.Th = !1),
	      (this.qo = null),
	      (this.$o = null),
	      (this.ti = new m()),
	      (this.oh = new m()),
	      (this.Io = InAppMessage.TextAlignment.CENTER);
	  }
	  subscribeToClickedEvent(t) {
	    return this.ti.Rt(t);
	  }
	  subscribeToDismissedEvent(t) {
	    return this.oh.Rt(t);
	  }
	  removeSubscription(t) {
	    this.ti.removeSubscription(t), this.oh.removeSubscription(t);
	  }
	  removeAllSubscriptions() {
	    this.ti.removeAllSubscriptions(), this.oh.removeAllSubscriptions();
	  }
	  closeMessage() {
	    this.ll(this.qo);
	  }
	  zo() {
	    return !0;
	  }
	  od() {
	    return this.zo();
	  }
	  _o() {
	    return null != this.htmlId && this.htmlId.length > 4;
	  }
	  Mo() {
	    return this._o() && null != this.css && this.css.length > 0;
	  }
	  Oo() {
	    if (this._o() && this.Mo()) return this.htmlId + "-css";
	  }
	  Wt() {
	    return !this.Gt && ((this.Gt = !0), !0);
	  }
	  sm() {
	    return this.Gt;
	  }
	  $t(t) {
	    return !this.dd && ((this.dd = !0), this.ti.L(), !0);
	  }
	  Ot() {
	    return !this.Th && ((this.Th = !0), this.oh.L(), !0);
	  }
	  hide(t) {
	    if (t && t.parentNode) {
	      let s = t.closest(".ab-iam-root");
	      if ((null == s && (s = t), this.zo() && null != s.parentNode)) {
	        const t = s.parentNode.classList;
	        t && t.contains(IamStrings.eS) && t.remove(IamStrings.eS),
	          document.body.removeEventListener("touchmove", InAppMessage.rh);
	      }
	      s.className = s.className.replace(InAppMessage.lh, InAppMessage.uh);
	    }
	    return this.animateOut || !1;
	  }
	  ll(t, s) {
	    if (null == t) return;
	    let i;
	    (this.qo = null),
	      (i =
	        -1 === t.className.indexOf("ab-in-app-message")
	          ? t.getElementsByClassName("ab-in-app-message")[0]
	          : t);
	    let h = !1;
	    i && (h = this.hide(i));
	    const e = document.body;
	    let E;
	    null != e && (E = e.scrollTop);
	    const n = () => {
	      if (t && t.parentNode) {
	        let s = t.closest(".ab-iam-root");
	        null == s && (s = t), s.parentNode && s.parentNode.removeChild(s);
	      }
	      const i = this.Oo();
	      if (null != i) {
	        const t = document.getElementById(i);
	        t && t.parentNode && t.parentNode.removeChild(t);
	      }
	      null != e && "Safari" === ro.browser && (e.scrollTop = E),
	        s ? s() : this.Ot();
	    };
	    h ? setTimeout(n, InAppMessage.hr) : n(), this.$o && this.$o.focus();
	  }
	  No() {
	    return document.createTextNode(this.message || "");
	  }
	  Jo(t) {
	    t.setAttribute("alt", this.altImageText || "");
	  }
	  static rh(t) {
	    if (t.targetTouches && t.targetTouches.length > 1) return;
	    const s = t.target;
	    (s &&
	      s.classList &&
	      s.classList.contains("ab-message-text") &&
	      s.scrollHeight > s.clientHeight) ||
	      (document.querySelector(`.${IamStrings.eS}`) &&
	        t.cancelable &&
	        t.preventDefault());
	  }
	  ah(t) {
	    const s = t.parentNode;
	    this.zo() &&
	      null != s &&
	      this.orientation !== InAppMessage.Orientation.LANDSCAPE &&
	      (null != s.classList && s.classList.add(IamStrings.eS),
	      document.body.addEventListener(
	        "touchmove",
	        InAppMessage.rh,
	        !!supportsPassive() && { passive: !1 },
	      )),
	      (t.className += " " + InAppMessage.lh);
	  }
	  static Ah(t) {
	    if (
	      t.keyCode === KeyCodes.Ih &&
	      !r.re(D.Oh) &&
	      document.querySelectorAll(".ab-modal-interactions").length > 0
	    ) {
	      const t = document.getElementsByClassName("ab-html-message");
	      let s = !1;
	      for (const i of t) {
	        let t = null;
	        isIFrame(i) &&
	          i.contentWindow &&
	          (t = i.contentWindow.document.getElementsByClassName(
	            "ab-programmatic-close-button",
	          )[0]),
	          null != t && (clickElement(t), (s = !0));
	      }
	      if (!s) {
	        const t = document.querySelectorAll(
	          ".ab-modal-interactions > .ab-close-button",
	        )[0];
	        null != t && clickElement(t);
	      }
	    }
	  }
	  Lh() {
	    this.nh ||
	      r.re(D.Oh) ||
	      (document.addEventListener("keydown", InAppMessage.Ah, !1),
	      r.mh(() => {
	        document.removeEventListener("keydown", InAppMessage.Ah);
	      }),
	      (this.nh = !0));
	  }
	  gt(t) {
	    const s = {};
	    return t
	      ? ((s[InAppMessage.ss.pa] = this.message),
	        (s[InAppMessage.ss.ma] = this.messageAlignment),
	        (s[InAppMessage.ss._h] = this.slideFrom),
	        (s[InAppMessage.ss.xs] = this.extras),
	        (s[InAppMessage.ss.ua] = this.triggerId),
	        (s[InAppMessage.ss.ca] = this.clickAction),
	        (s[InAppMessage.ss.URI] = this.uri),
	        (s[InAppMessage.ss.fa] = this.openTarget),
	        (s[InAppMessage.ss.da] = this.dismissType),
	        (s[InAppMessage.ss.la] = this.duration),
	        (s[InAppMessage.ss.ga] = this.icon),
	        (s[InAppMessage.ss.ns] = this.imageUrl),
	        (s[InAppMessage.ss.ja] = this.imageStyle),
	        (s[InAppMessage.ss.xa] = this.iconColor),
	        (s[InAppMessage.ss.za] = this.iconBackgroundColor),
	        (s[InAppMessage.ss.ha] = this.backgroundColor),
	        (s[InAppMessage.ss.va] = this.textColor),
	        (s[InAppMessage.ss.wa] = this.closeButtonColor),
	        (s[InAppMessage.ss.ya] = this.animateIn),
	        (s[InAppMessage.ss.Sa] = this.animateOut),
	        (s[InAppMessage.ss.ba] = this.header),
	        (s[InAppMessage.ss.ka] = this.headerAlignment),
	        (s[InAppMessage.ss.qa] = this.headerTextColor),
	        (s[InAppMessage.ss.Aa] = this.frameColor),
	        (s[InAppMessage.ss.Ba] = this.buttons),
	        (s[InAppMessage.ss.Ca] = this.cropType),
	        (s[InAppMessage.ss.Da] = this.orientation),
	        (s[InAppMessage.ss.Ea] = this.htmlId),
	        (s[InAppMessage.ss.CSS] = this.css),
	        (s[InAppMessage.ss.ts] = t),
	        (s[InAppMessage.ss.Fa] = this.messageExtras),
	        (s[InAppMessage.ss.LANGUAGE] = this.language),
	        (s[InAppMessage.ss.ks] = this.altImageText),
	        s)
	      : s;
	  }
	}
	(InAppMessage.th = {
	  hh: 4281545523,
	  ih: 4294967295,
	  sh: 4278219733,
	  Nh: 4293914607,
	  Rh: 4283782485,
	  Eh: 3224580915,
	  eh: 4288387995,
	}),
	  (InAppMessage.Ao = {
	    Sh: "hd",
	    Lo: "ias",
	    Mh: "of",
	    Dh: "do",
	    Ch: "umt",
	    dh: "tf",
	    Uh: "te",
	  }),
	  (InAppMessage.SlideFrom = { TOP: "TOP", BOTTOM: "BOTTOM" }),
	  (InAppMessage.ClickAction = { URI: "URI", NONE: "NONE" }),
	  (InAppMessage.DismissType = {
	    AUTO_DISMISS: "AUTO_DISMISS",
	    MANUAL: "SWIPE",
	  }),
	  (InAppMessage.OpenTarget = { NONE: "NONE", BLANK: "BLANK" }),
	  (InAppMessage.ImageStyle = { TOP: "TOP", GRAPHIC: "GRAPHIC" }),
	  (InAppMessage.Orientation = { PORTRAIT: "PORTRAIT", LANDSCAPE: "LANDSCAPE" }),
	  (InAppMessage.TextAlignment = {
	    START: "START",
	    CENTER: "CENTER",
	    END: "END",
	  }),
	  (InAppMessage.CropType = {
	    CENTER_CROP: "CENTER_CROP",
	    FIT_CENTER: "FIT_CENTER",
	  }),
	  (InAppMessage.Eo = {
	    ia: "SLIDEUP",
	    ta: "MODAL",
	    Xo: "MODAL_STYLED",
	    Yn: "FULL",
	    Zo: "WEB_HTML",
	    Bo: "HTML",
	    Yo: "HTML_FULL",
	  }),
	  (InAppMessage.hr = 500),
	  (InAppMessage.bh = 200),
	  (InAppMessage.lh = "ab-show"),
	  (InAppMessage.uh = "ab-hide"),
	  (InAppMessage.ss = {
	    pa: "m",
	    ma: "ma",
	    _h: "sf",
	    xs: "e",
	    ua: "ti",
	    ca: "ca",
	    URI: "u",
	    fa: "oa",
	    da: "dt",
	    la: "d",
	    ga: "i",
	    ns: "iu",
	    ja: "is",
	    xa: "ic",
	    za: "ibc",
	    ha: "bc",
	    va: "tc",
	    wa: "cbc",
	    ya: "ai",
	    Sa: "ao",
	    ba: "h",
	    ka: "ha",
	    qa: "htc",
	    Aa: "fc",
	    Ba: "b",
	    Ca: "ct",
	    Da: "o",
	    Ea: "hi",
	    CSS: "css",
	    ts: "type",
	    ed: "messageFields",
	    Fa: "me",
	    LANGUAGE: "l",
	    ks: "ia",
	  });

	class HtmlMessage extends InAppMessage {
	  constructor(i, o, d, e, r, t, s, v, n, u, a, c) {
	    super(
	      i,
	      void 0,
	      void 0,
	      o,
	      d,
	      void 0,
	      void 0,
	      void 0,
	      (e = e || InAppMessage.DismissType.MANUAL),
	      r,
	      void 0,
	      void 0,
	      void 0,
	      void 0,
	      void 0,
	      void 0,
	      void 0,
	      void 0,
	      t,
	      s,
	      void 0,
	      void 0,
	      void 0,
	      v,
	      void 0,
	      void 0,
	      void 0,
	      n,
	      u,
	      c,
	      void 0,
	      void 0,
	    ),
	      (this.messageFields = a),
	      (this.messageFields = a);
	  }
	  od() {
	    return !1;
	  }
	  $t(i) {
	    if (this.ko === InAppMessage.Eo.Zo) {
	      if (this.dd) return !1;
	      this.dd = !0;
	    }
	    return this.ti.L(i), !0;
	  }
	  gt() {
	    const i = super.gt(HtmlMessage.es);
	    return (i[InAppMessage.ss.ed] = this.messageFields), i;
	  }
	  static Zn(i) {
	    return new HtmlMessage(
	      i[InAppMessage.ss.pa],
	      i[InAppMessage.ss.xs],
	      i[InAppMessage.ss.ua],
	      i[InAppMessage.ss.da],
	      i[InAppMessage.ss.la],
	      i[InAppMessage.ss.ya],
	      i[InAppMessage.ss.Sa],
	      i[InAppMessage.ss.Aa],
	      i[InAppMessage.ss.Ea],
	      i[InAppMessage.ss.CSS],
	      i[InAppMessage.ss.ed],
	      i[InAppMessage.ss.Fa],
	    );
	  }
	}
	HtmlMessage.es = InAppMessage.Eo.Zo;

	class InAppMessageButton {
	  constructor(s, t, i, r, h, e, n) {
	    (this.text = s),
	      (this.backgroundColor = t),
	      (this.textColor = i),
	      (this.borderColor = r),
	      (this.clickAction = h),
	      (this.uri = e),
	      (this.id = n),
	      (this.text = s || ""),
	      (this.backgroundColor = t || InAppMessage.th.sh),
	      (this.textColor = i || InAppMessage.th.ih),
	      (this.borderColor = r || this.backgroundColor),
	      (this.clickAction = h || InAppMessage.ClickAction.NONE),
	      (this.uri = e),
	      null == n && (n = InAppMessageButton._n),
	      (this.id = n),
	      (this.dd = !1),
	      (this.ti = new m());
	  }
	  subscribeToClickedEvent(s) {
	    return this.ti.Rt(s);
	  }
	  removeSubscription(s) {
	    this.ti.removeSubscription(s);
	  }
	  removeAllSubscriptions() {
	    this.ti.removeAllSubscriptions();
	  }
	  $t() {
	    return !this.dd && ((this.dd = !0), this.ti.L(), !0);
	  }
	  static fromJson(s) {
	    return new InAppMessageButton(
	      s.text,
	      s.bg_color,
	      s.text_color,
	      s.border_color,
	      s.click_action,
	      s.uri,
	      s.id,
	    );
	  }
	}
	InAppMessageButton._n = -1;

	class FullScreenMessage extends InAppMessage {
	  constructor(
	    e,
	    r,
	    s,
	    t,
	    i,
	    a,
	    o,
	    p,
	    m,
	    n,
	    u,
	    c,
	    f,
	    d,
	    l,
	    g,
	    j,
	    x,
	    z,
	    h,
	    v,
	    w,
	    y,
	    S,
	    b,
	    k,
	    q,
	    A,
	    B,
	    C,
	    D,
	  ) {
	    (p = p || InAppMessage.DismissType.MANUAL),
	      (k = k || InAppMessage.Orientation.PORTRAIT),
	      super(
	        e,
	        r,
	        void 0,
	        s,
	        t,
	        i,
	        a,
	        o,
	        p,
	        m,
	        n,
	        u,
	        c,
	        f,
	        d,
	        l,
	        g,
	        j,
	        x,
	        z,
	        h,
	        v,
	        w,
	        y,
	        S,
	        (b = b || InAppMessage.CropType.CENTER_CROP),
	        k,
	        q,
	        A,
	        B,
	        C,
	        D,
	      ),
	      (this.Io = InAppMessage.TextAlignment.CENTER);
	  }
	  gt() {
	    return super.gt(FullScreenMessage.es);
	  }
	  static Zn(e) {
	    return new FullScreenMessage(
	      e[InAppMessage.ss.pa],
	      e[InAppMessage.ss.ma],
	      e[InAppMessage.ss.xs],
	      e[InAppMessage.ss.ua],
	      e[InAppMessage.ss.ca],
	      e[InAppMessage.ss.URI],
	      e[InAppMessage.ss.fa],
	      e[InAppMessage.ss.da],
	      e[InAppMessage.ss.la],
	      e[InAppMessage.ss.ga],
	      e[InAppMessage.ss.ns],
	      e[InAppMessage.ss.ja],
	      e[InAppMessage.ss.xa],
	      e[InAppMessage.ss.za],
	      e[InAppMessage.ss.ha],
	      e[InAppMessage.ss.va],
	      e[InAppMessage.ss.wa],
	      e[InAppMessage.ss.ya],
	      e[InAppMessage.ss.Sa],
	      e[InAppMessage.ss.ba],
	      e[InAppMessage.ss.ka],
	      e[InAppMessage.ss.qa],
	      e[InAppMessage.ss.Aa],
	      buttonsFromSerializedInAppMessage(e[InAppMessage.ss.Ba]),
	      e[InAppMessage.ss.Ca],
	      e[InAppMessage.ss.Da],
	      e[InAppMessage.ss.Ea],
	      e[InAppMessage.ss.CSS],
	      e[InAppMessage.ss.Fa],
	      e[InAppMessage.ss.LANGUAGE],
	      e[InAppMessage.ss.ks],
	    );
	  }
	}
	FullScreenMessage.es = InAppMessage.Eo.Yn;

	class ModalMessage extends InAppMessage {
	  constructor(
	    e,
	    r,
	    s,
	    t,
	    i,
	    o,
	    a,
	    p,
	    m,
	    n,
	    u,
	    c,
	    d,
	    f,
	    l,
	    g,
	    j,
	    v,
	    x,
	    z,
	    h,
	    w,
	    y,
	    S,
	    b,
	    k,
	    q,
	    A,
	    B,
	    C,
	  ) {
	    super(
	      e,
	      r,
	      void 0,
	      s,
	      t,
	      i,
	      o,
	      a,
	      (p = p || InAppMessage.DismissType.MANUAL),
	      m,
	      n,
	      u,
	      c,
	      d,
	      f,
	      l,
	      g,
	      j,
	      v,
	      x,
	      z,
	      h,
	      w,
	      y,
	      S,
	      (b = b || InAppMessage.CropType.FIT_CENTER),
	      void 0,
	      k,
	      q,
	      A,
	      B,
	      C,
	    ),
	      (this.Io = InAppMessage.TextAlignment.CENTER);
	  }
	  gt() {
	    return super.gt(ModalMessage.es);
	  }
	  static Zn(e) {
	    return new ModalMessage(
	      e[InAppMessage.ss.pa],
	      e[InAppMessage.ss.ma],
	      e[InAppMessage.ss.xs],
	      e[InAppMessage.ss.ua],
	      e[InAppMessage.ss.ca],
	      e[InAppMessage.ss.URI],
	      e[InAppMessage.ss.fa],
	      e[InAppMessage.ss.da],
	      e[InAppMessage.ss.la],
	      e[InAppMessage.ss.ga],
	      e[InAppMessage.ss.ns],
	      e[InAppMessage.ss.ja],
	      e[InAppMessage.ss.xa],
	      e[InAppMessage.ss.za],
	      e[InAppMessage.ss.ha],
	      e[InAppMessage.ss.va],
	      e[InAppMessage.ss.wa],
	      e[InAppMessage.ss.ya],
	      e[InAppMessage.ss.Sa],
	      e[InAppMessage.ss.ba],
	      e[InAppMessage.ss.ka],
	      e[InAppMessage.ss.qa],
	      e[InAppMessage.ss.Aa],
	      buttonsFromSerializedInAppMessage(e[InAppMessage.ss.Ba]),
	      e[InAppMessage.ss.Ca],
	      e[InAppMessage.ss.Ea],
	      e[InAppMessage.ss.CSS],
	      e[InAppMessage.ss.Fa],
	      e[InAppMessage.ss.LANGUAGE],
	      e[InAppMessage.ss.ks],
	    );
	  }
	}
	ModalMessage.es = InAppMessage.Eo.ta;

	class SlideUpMessage extends InAppMessage {
	  constructor(
	    e,
	    t,
	    s,
	    o,
	    i,
	    r,
	    n,
	    d,
	    a,
	    u,
	    p,
	    m,
	    c,
	    l,
	    v,
	    x,
	    f,
	    h,
	    g,
	    I,
	    M,
	    b,
	    j,
	    z,
	  ) {
	    (x = x || InAppMessage.th.Rh),
	      (v = v || InAppMessage.th.Nh),
	      super(
	        e,
	        (t = t || InAppMessage.TextAlignment.START),
	        s,
	        o,
	        i,
	        r,
	        n,
	        d,
	        a,
	        u,
	        p,
	        m,
	        void 0,
	        c,
	        l,
	        v,
	        x,
	        f,
	        h,
	        g,
	        void 0,
	        void 0,
	        void 0,
	        void 0,
	        void 0,
	        void 0,
	        void 0,
	        I,
	        M,
	        b,
	        j,
	        z,
	      ),
	      (this.Io = InAppMessage.TextAlignment.START);
	  }
	  zo() {
	    return !1;
	  }
	  No() {
	    const e = document.createElement("span");
	    return e.appendChild(document.createTextNode(this.message || "")), e;
	  }
	  ah(e) {
	    const t = e.getElementsByClassName("ab-in-app-message")[0];
	    DOMUtils.td(t, !0, !0) ||
	      (this.slideFrom === InAppMessage.SlideFrom.TOP
	        ? (t.style.top = "0px")
	        : (t.style.bottom = "0px")),
	      super.ah(e);
	  }
	  gt() {
	    return super.gt(SlideUpMessage.es);
	  }
	  static Zn(e) {
	    return new SlideUpMessage(
	      e[InAppMessage.ss.pa],
	      e[InAppMessage.ss.ma],
	      e[InAppMessage.ss._h],
	      e[InAppMessage.ss.xs],
	      e[InAppMessage.ss.ua],
	      e[InAppMessage.ss.ca],
	      e[InAppMessage.ss.URI],
	      e[InAppMessage.ss.fa],
	      e[InAppMessage.ss.da],
	      e[InAppMessage.ss.la],
	      e[InAppMessage.ss.ga],
	      e[InAppMessage.ss.ns],
	      e[InAppMessage.ss.xa],
	      e[InAppMessage.ss.za],
	      e[InAppMessage.ss.ha],
	      e[InAppMessage.ss.va],
	      e[InAppMessage.ss.wa],
	      e[InAppMessage.ss.ya],
	      e[InAppMessage.ss.Sa],
	      e[InAppMessage.ss.Ea],
	      e[InAppMessage.ss.CSS],
	      e[InAppMessage.ss.Fa],
	      e[InAppMessage.ss.LANGUAGE],
	      e[InAppMessage.ss.ks],
	    );
	  }
	}
	SlideUpMessage.es = InAppMessage.Eo.ia;

	function newInAppMessageFromJson(e) {
	  if (!e) return null;
	  if (e.is_control) return ControlMessage.fromJson(e);
	  let o = e.type;
	  null != o && (o = o.toUpperCase());
	  const s = e.message,
	    n = e.text_align_message,
	    r = e.slide_from,
	    t = e.extras,
	    m = e.trigger_id,
	    l = e.click_action,
	    i = e.uri,
	    f = e.open_target,
	    p = e.message_close,
	    u = e.duration,
	    a = e.icon,
	    d = e.image_url,
	    g = e.image_style,
	    c = e.icon_color,
	    j = e.icon_bg_color,
	    w = e.bg_color,
	    b = e.text_color,
	    h = e.close_btn_color,
	    v = e.header,
	    x = e.text_align_header,
	    I = e.header_text_color,
	    A = e.frame_color,
	    F = [];
	  let M = e.btns;
	  null == M && (M = []);
	  for (let e = 0; e < M.length; e++) F.push(InAppMessageButton.fromJson(M[e]));
	  const k = e.crop_type,
	    y = e.orientation,
	    z = e.animate_in,
	    J = e.animate_out;
	  let S = e.html_id,
	    q = e.css;
	  (null != S && "" !== S && null != q && "" !== q) ||
	    ((S = void 0), (q = void 0));
	  const B = e.message_extras,
	    C = e.language,
	    D = e.image_alt;
	  let G;
	  if (o === ModalMessage.es || o === InAppMessage.Eo.Xo)
	    G = new ModalMessage(
	      s,
	      n,
	      t,
	      m,
	      l,
	      i,
	      f,
	      p,
	      u,
	      a,
	      d,
	      g,
	      c,
	      j,
	      w,
	      b,
	      h,
	      z,
	      J,
	      v,
	      x,
	      I,
	      A,
	      F,
	      k,
	      S,
	      q,
	      B,
	      C,
	      D,
	    );
	  else if (o === FullScreenMessage.es)
	    G = new FullScreenMessage(
	      s,
	      n,
	      t,
	      m,
	      l,
	      i,
	      f,
	      p,
	      u,
	      a,
	      d,
	      g,
	      c,
	      j,
	      w,
	      b,
	      h,
	      z,
	      J,
	      v,
	      x,
	      I,
	      A,
	      F,
	      k,
	      y,
	      S,
	      q,
	      B,
	      C,
	      D,
	    );
	  else if (o === SlideUpMessage.es)
	    G = new SlideUpMessage(
	      s,
	      n,
	      r,
	      t,
	      m,
	      l,
	      i,
	      f,
	      p,
	      u,
	      a,
	      d,
	      c,
	      j,
	      w,
	      b,
	      h,
	      z,
	      J,
	      S,
	      q,
	      B,
	      C,
	      D,
	    );
	  else {
	    if (
	      o !== HtmlMessage.es &&
	      o !== InAppMessage.Eo.Bo &&
	      o !== InAppMessage.Eo.Yo
	    )
	      return void E$1.error("Ignoring message with unknown type " + o);
	    {
	      const o = e.message_fields;
	      (G = new HtmlMessage(s, t, m, p, u, z, J, A, S, q, o, B)),
	        (G.trusted = e.trusted || !1);
	    }
	  }
	  return (G.ko = o), G;
	}
	function buttonsFromSerializedInAppMessage(e) {
	  const o = [];
	  for (const s of e)
	    o.push(
	      new InAppMessageButton(
	        s.text,
	        s.backgroundColor,
	        s.textColor,
	        s.borderColor,
	        s.clickAction,
	        s.uri,
	        s.id,
	      ),
	    );
	  return o;
	}

	class rs {
	  constructor(t) {
	    (this.tf = t), (this.tf = t);
	  }
	  sf(t) {
	    return null == this.tf || this.tf === t[0];
	  }
	  static fromJson(t) {
	    return new rs(t ? t.event_name : null);
	  }
	  gt() {
	    return this.tf;
	  }
	}

	class cr {
	  constructor(t, s, e, i) {
	    (this.yE = t),
	      (this.HE = s),
	      (this.comparator = e),
	      (this.LE = i),
	      (this.yE = t),
	      (this.HE = s),
	      (this.comparator = e),
	      (this.LE = i),
	      this.HE === cr.XE.QE &&
	        this.comparator !== cr.BE.wE &&
	        this.comparator !== cr.BE.jE &&
	        this.comparator !== cr.BE.zE &&
	        this.comparator !== cr.BE.FE &&
	        (this.LE = dateFromUnixTimestamp(this.LE));
	  }
	  sf(t) {
	    let s = null;
	    switch ((null != t && (s = t[this.yE]), this.comparator)) {
	      case cr.BE.kE:
	        return null != s && s.valueOf() === this.LE.valueOf();
	      case cr.BE.xE:
	        return null == s || s.valueOf() !== this.LE.valueOf();
	      case cr.BE.JE:
	        return null != s && typeof s == typeof this.LE && s > this.LE;
	      case cr.BE.wE:
	        return this.HE === cr.XE.QE
	          ? null != s && isDate(s) && secondsAgo(s) <= this.LE.valueOf()
	          : null != s && typeof s == typeof this.LE && s >= this.LE;
	      case cr.BE.VE:
	        return null != s && typeof s == typeof this.LE && s < this.LE;
	      case cr.BE.jE:
	        return this.HE === cr.XE.QE
	          ? null != s && isDate(s) && secondsAgo(s) >= this.LE.valueOf()
	          : null != s && typeof s == typeof this.LE && s <= this.LE;
	      case cr.BE.qE:
	        return (
	          null != s &&
	          "string" == typeof s &&
	          typeof s == typeof this.LE &&
	          null != s.match(this.LE)
	        );
	      case cr.BE.PE:
	        return null != s;
	      case cr.BE.WE:
	        return null == s;
	      case cr.BE.zE:
	        return null != s && isDate(s) && secondsInTheFuture(s) < this.LE;
	      case cr.BE.FE:
	        return null != s && isDate(s) && secondsInTheFuture(s) > this.LE;
	      case cr.BE.ZE:
	        return (
	          null == s ||
	          typeof s != typeof this.LE ||
	          "string" != typeof s ||
	          null == s.match(this.LE)
	        );
	    }
	    return !1;
	  }
	  static fromJson(t) {
	    return new cr(
	      t.property_key,
	      t.property_type,
	      t.comparator,
	      t.property_value,
	    );
	  }
	  gt() {
	    let t = this.LE;
	    return (
	      isDate(this.LE) && (t = convertMsToSeconds(t.valueOf())),
	      { k: this.yE, t: this.HE, c: this.comparator, v: t }
	    );
	  }
	  static _u(t) {
	    return new cr(t.k, t.t, t.c, t.v);
	  }
	}
	(cr.XE = { $E: "boolean", tT: "number", sT: "string", QE: "date" }),
	  (cr.BE = {
	    kE: 1,
	    xE: 2,
	    JE: 3,
	    wE: 4,
	    VE: 5,
	    jE: 6,
	    qE: 10,
	    PE: 11,
	    WE: 12,
	    zE: 15,
	    FE: 16,
	    ZE: 17,
	  });

	class is {
	  constructor(t) {
	    (this.filters = t), (this.filters = t);
	  }
	  sf(t) {
	    let r = !0;
	    for (let e = 0; e < this.filters.length; e++) {
	      const o = this.filters[e];
	      let s = !1;
	      for (let r = 0; r < o.length; r++)
	        if (o[r].sf(t)) {
	          s = !0;
	          break;
	        }
	      if (!s) {
	        r = !1;
	        break;
	      }
	    }
	    return r;
	  }
	  static fromJson(t) {
	    if (null == t || !isArray(t)) return null;
	    const r = [];
	    for (let e = 0; e < t.length; e++) {
	      const o = [],
	        s = t[e];
	      for (let t = 0; t < s.length; t++) o.push(cr.fromJson(s[t]));
	      r.push(o);
	    }
	    return new is(r);
	  }
	  gt() {
	    const t = [];
	    for (let r = 0; r < this.filters.length; r++) {
	      const e = this.filters[r],
	        o = [];
	      for (let t = 0; t < e.length; t++) o.push(e[t].gt());
	      t.push(o);
	    }
	    return t;
	  }
	  static _u(t) {
	    const r = [];
	    for (let e = 0; e < t.length; e++) {
	      const o = [],
	        s = t[e];
	      for (let t = 0; t < s.length; t++) o.push(cr._u(s[t]));
	      r.push(o);
	    }
	    return new is(r);
	  }
	}

	class ls {
	  constructor(t, s) {
	    (this.tf = t), (this.if = s), (this.tf = t), (this.if = s);
	  }
	  sf(t) {
	    if (null == this.tf || null == this.if) return !1;
	    const s = t[0],
	      i = t[1];
	    return s === this.tf && this.if.sf(i);
	  }
	  static fromJson(t) {
	    return new ls(
	      t ? t.event_name : null,
	      t ? is.fromJson(t.property_filters) : null,
	    );
	  }
	  gt() {
	    return { e: this.tf, pf: this.if ? this.if.gt() : null };
	  }
	}

	class mi {
	  constructor(t, i) {
	    (this.rf = t), (this.nf = i), (this.rf = t), (this.nf = i);
	  }
	  sf(t) {
	    if (null == this.rf) return !1;
	    const i = fi.ef(t[0], this.rf);
	    if (!i) return !1;
	    let r = null == this.nf || 0 === this.nf.length;
	    if (null != this.nf)
	      for (let i = 0; i < this.nf.length; i++)
	        if (this.nf[i] === t[1]) {
	          r = !0;
	          break;
	        }
	    return i && r;
	  }
	  static fromJson(t) {
	    return new mi(t ? t.id : null, t ? t.buttons : null);
	  }
	  gt() {
	    return this.rf;
	  }
	}

	class ns {
	  constructor(t) {
	    (this.productId = t), (this.productId = t);
	  }
	  sf(t) {
	    return null == this.productId || t[0] === this.productId;
	  }
	  static fromJson(t) {
	    return new ns(t ? t.product_id : null);
	  }
	  gt() {
	    return this.productId;
	  }
	}

	class us {
	  constructor(t, s) {
	    (this.productId = t), (this.if = s), (this.productId = t), (this.if = s);
	  }
	  sf(t) {
	    if (null == this.productId || null == this.if) return !1;
	    const s = t[0],
	      i = t[1];
	    return s === this.productId && this.if.sf(i);
	  }
	  static fromJson(t) {
	    return new us(
	      t ? t.product_id : null,
	      t ? is.fromJson(t.property_filters) : null,
	    );
	  }
	  gt() {
	    return { id: this.productId, pf: this.if ? this.if.gt() : null };
	  }
	}

	class ur {
	  constructor(t) {
	    (this.rf = t), (this.rf = t);
	  }
	  sf(t) {
	    return null == this.rf || fi.ef(t[0], this.rf);
	  }
	  static fromJson(t) {
	    return new ur(t ? t.campaign_id : null);
	  }
	  gt() {
	    return this.rf;
	  }
	}

	var ot = {
	  OPEN: "open",
	  Rr: "purchase",
	  wr: "push_click",
	  xe: "custom_event",
	  rm: "iam_click",
	  qs: "test",
	};

	class fi {
	  constructor(e, t) {
	    (this.type = e), (this.data = t), (this.type = e), (this.data = t);
	  }
	  km(e, t) {
	    return fi._m[this.type] === e && (null == this.data || this.data.sf(t));
	  }
	  static ef(e, t) {
	    let r = null;
	    try {
	      r = window.atob(e);
	    } catch (t) {
	      return E$1.info("Failed to unencode analytics id " + e + ": " + getErrorMessage(t)), !1;
	    }
	    return t === r.split("_")[0];
	  }
	  static fromJson(e) {
	    const t = e.type;
	    let r = null;
	    switch (t) {
	      case fi.Ln.OPEN:
	      case fi.Ln.qs:
	        break;
	      case fi.Ln.Rr:
	        r = ns.fromJson(e.data);
	        break;
	      case fi.Ln.bm:
	        r = us.fromJson(e.data);
	        break;
	      case fi.Ln.wr:
	        r = ur.fromJson(e.data);
	        break;
	      case fi.Ln.xe:
	        r = rs.fromJson(e.data);
	        break;
	      case fi.Ln.Em:
	        r = ls.fromJson(e.data);
	        break;
	      case fi.Ln.rm:
	        r = mi.fromJson(e.data);
	    }
	    return new fi(t, r);
	  }
	  gt() {
	    return { t: this.type, d: this.data ? this.data.gt() : null };
	  }
	  static _u(e) {
	    let t,
	      r = null;
	    switch (e.t) {
	      case fi.Ln.OPEN:
	      case fi.Ln.qs:
	        break;
	      case fi.Ln.Rr:
	        r = new ns(e.d);
	        break;
	      case fi.Ln.bm:
	        (t = e.d || {}), (r = new us(t.id, is._u(t.pf || [])));
	        break;
	      case fi.Ln.wr:
	        r = new ur(e.d);
	        break;
	      case fi.Ln.xe:
	        r = new rs(e.d);
	        break;
	      case fi.Ln.Em:
	        (t = e.d || {}), (r = new ls(t.e, is._u(t.pf || [])));
	        break;
	      case fi.Ln.rm:
	        r = new mi(e.d);
	    }
	    return new fi(e.t, r);
	  }
	}
	(fi.Ln = {
	  OPEN: "open",
	  Rr: "purchase",
	  bm: "purchase_property",
	  wr: "push_click",
	  xe: "custom_event",
	  Em: "custom_event_property",
	  rm: "iam_click",
	  qs: "test",
	}),
	  (fi._m = {}),
	  (fi._m[fi.Ln.OPEN] = ot.OPEN),
	  (fi._m[fi.Ln.Rr] = ot.Rr),
	  (fi._m[fi.Ln.bm] = ot.Rr),
	  (fi._m[fi.Ln.wr] = ot.wr),
	  (fi._m[fi.Ln.xe] = ot.xe),
	  (fi._m[fi.Ln.Em] = ot.xe),
	  (fi._m[fi.Ln.rm] = ot.rm),
	  (fi._m[fi.Ln.qs] = ot.qs);

	class pt {
	  constructor(t, i = [], s, e, r = 0, h, l, o = 0, n = pt.Td, a, u, d) {
	    (this.id = t),
	      (this.Pd = i),
	      (this.startTime = s),
	      (this.endTime = e),
	      (this.priority = r),
	      (this.type = h),
	      (this.data = l),
	      (this.Ed = o),
	      (this.Nd = n),
	      (this.Vn = a),
	      (this._d = u),
	      (this.Id = d),
	      (this.id = t),
	      (this.Pd = i || []),
	      void 0 === s && (s = null),
	      (this.startTime = s),
	      void 0 === e && (e = null),
	      (this.endTime = e),
	      (this.priority = r || 0),
	      (this.type = h),
	      (this.Ed = o || 0),
	      null == a && (a = 1e3 * (this.Ed + 30)),
	      (this.Vn = a),
	      (this.data = l),
	      null != n && (this.Nd = n),
	      (this._d = u),
	      (this.Id = d || null);
	  }
	  xd(t) {
	    return (
	      null == this.Id || (this.Nd !== pt.Td && t - this.Id >= 1e3 * this.Nd)
	    );
	  }
	  zd(t) {
	    this.Id = t;
	  }
	  Md(t) {
	    const i = t + 1e3 * this.Ed;
	    return Math.max(i - new Date().valueOf(), 0);
	  }
	  Bd(t) {
	    const i = new Date().valueOf() - t,
	      s = null == t || isNaN(i) || null == this.Vn || i < this.Vn;
	    return (
	      s ||
	        E$1.info(
	          `Trigger action ${this.type} is no longer eligible for display - fired ${i}ms ago and has a timeout of ${this.Vn}ms.`,
	        ),
	      !s
	    );
	  }
	  static fromJson(t) {
	    const i = t.id,
	      s = [];
	    for (let i = 0; i < t.trigger_condition.length; i++)
	      s.push(fi.fromJson(t.trigger_condition[i]));
	    const e = dateFromUnixTimestamp(t.start_time),
	      r = dateFromUnixTimestamp(t.end_time),
	      h = t.priority,
	      l = t.type,
	      o = t.delay,
	      n = t.re_eligibility,
	      a = t.timeout,
	      u = t.data,
	      d = t.min_seconds_since_last_trigger;
	    return validateValueIsFromEnum(
	      pt.Ln,
	      l,
	      "Could not construct Trigger from server data",
	      "Trigger.Types",
	    )
	      ? new pt(i, s, e, r, h, l, u, o, n, a, d)
	      : null;
	  }
	  gt() {
	    const t = [];
	    for (let i = 0; i < this.Pd.length; i++) t.push(this.Pd[i].gt());
	    return {
	      i: this.id,
	      c: t,
	      s: this.startTime,
	      e: this.endTime,
	      p: this.priority,
	      t: this.type,
	      da: this.data,
	      d: this.Ed,
	      r: this.Nd,
	      tm: this.Vn,
	      ss: this._d,
	      ld: this.Id,
	    };
	  }
	  static _u(t) {
	    const i = [],
	      s = t.c || [];
	    for (let t = 0; t < s.length; t++) i.push(fi._u(s[t]));
	    return new pt(
	      t.i,
	      i,
	      rehydrateDateAfterJsonization(t.s),
	      rehydrateDateAfterJsonization(t.e),
	      t.p,
	      t.t,
	      t.da,
	      t.d,
	      t.r,
	      t.tm,
	      t.ss,
	      t.ld,
	    );
	  }
	}
	(pt.Ln = { Kn: "inapp", Cd: "templated_iam" }), (pt.Td = -1);

	function attachCSS(n, t, o) {
	  const c = n || document.querySelector("head"),
	    e = `ab-${t}-css-definitions-${"6.5.0".replace(/\./g, "-")}`;
	  if (!c) return;
	  const s = c.ownerDocument || document;
	  if (null == s.getElementById(e)) {
	    const n = s.createElement("style");
	    (n.innerHTML = o || ""), (n.id = e);
	    const t = r.re(D.er);
	    null != t && n.setAttribute("nonce", t), c.appendChild(n);
	  }
	}

	function loadFontAwesome() {
	  if (r.re(D.Za)) return;
	  const e = "https://use.fontawesome.com/7f85a56ba4.css";
	  if (
	    !(null !== document.querySelector('link[rel=stylesheet][href="' + e + '"]'))
	  ) {
	    const t = document.createElement("link");
	    t.setAttribute("rel", "stylesheet"),
	      t.setAttribute("href", e),
	      document.getElementsByTagName("head")[0].appendChild(t);
	  }
	}

	function attachFeedCSS(t) {
	  attachCSS(
	    t,
	    "feed",
	    "body>.ab-feed{position:fixed;top:0;right:0;bottom:0;width:421px;-webkit-border-radius:0;-moz-border-radius:0;border-radius:0}body>.ab-feed .ab-feed-body{position:absolute;top:0;left:0;right:0;border:none;border-left:1px solid #d0d0d0;padding-top:70px;min-height:100%}body>.ab-feed .ab-initial-spinner{float:none}body>.ab-feed .ab-no-cards-message{position:absolute;width:100%;margin-left:-20px;top:40%}.ab-feed{-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;-webkit-box-shadow:0 1px 7px 1px rgba(66,82,113,.15);-moz-box-shadow:0 1px 7px 1px rgba(66,82,113,.15);box-shadow:0 1px 7px 1px rgba(66,82,113,.15);width:402px;background-color:#eee;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif;font-size:13px;line-height:130%;letter-spacing:normal;overflow-y:auto;overflow-x:visible;z-index:9011;-webkit-overflow-scrolling:touch}.ab-feed :focus,.ab-feed:focus{outline:0}.ab-feed .ab-feed-body{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;border:1px solid #d0d0d0;border-top:none;padding:20px 20px 0 20px}.ab-feed.ab-effect-slide{-webkit-transform:translateX(450px);-moz-transform:translateX(450px);-ms-transform:translateX(450px);transform:translateX(450px);-webkit-transition:transform .5s ease-in-out;-moz-transition:transform .5s ease-in-out;-o-transition:transform .5s ease-in-out;transition:transform .5s ease-in-out}.ab-feed.ab-effect-slide.ab-show{-webkit-transform:translateX(0);-moz-transform:translateX(0);-ms-transform:translateX(0);transform:translateX(0)}.ab-feed.ab-effect-slide.ab-hide{-webkit-transform:translateX(450px);-moz-transform:translateX(450px);-ms-transform:translateX(450px);transform:translateX(450px)}.ab-feed .ab-card{position:relative;-webkit-box-shadow:0 2px 3px 0 rgba(178,178,178,.5);-moz-box-shadow:0 2px 3px 0 rgba(178,178,178,.5);box-shadow:0 2px 3px 0 rgba(178,178,178,.5);-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;width:100%;border:1px solid #d0d0d0;margin-bottom:20px;overflow:hidden;background-color:#fff;-webkit-transition:height .4s ease-in-out,margin .4s ease-in-out;-moz-transition:height .4s ease-in-out,margin .4s ease-in-out;-o-transition:height .4s ease-in-out,margin .4s ease-in-out;transition:height .4s ease-in-out,margin .4s ease-in-out}.ab-feed .ab-card .ab-pinned-indicator{position:absolute;right:0;top:0;margin-right:-1px;width:0;height:0;border-style:solid;border-width:0 24px 24px 0;border-color:transparent #1676d0 transparent transparent}.ab-feed .ab-card .ab-pinned-indicator .fa-star{position:absolute;right:-21px;top:2px;font-size:9px;color:#fff}.ab-feed .ab-card.ab-effect-card.ab-hide{-webkit-transition:all .5s ease-in-out;-moz-transition:all .5s ease-in-out;-o-transition:all .5s ease-in-out;transition:all .5s ease-in-out}.ab-feed .ab-card.ab-effect-card.ab-hide.ab-swiped-left{-webkit-transform:translateX(-450px);-moz-transform:translateX(-450px);-ms-transform:translateX(-450px);transform:translateX(-450px)}.ab-feed .ab-card.ab-effect-card.ab-hide.ab-swiped-right{-webkit-transform:translateX(450px);-moz-transform:translateX(450px);-ms-transform:translateX(450px);transform:translateX(450px)}.ab-feed .ab-card.ab-effect-card.ab-hide:not(.ab-swiped-left):not(.ab-swiped-right){opacity:0}.ab-feed .ab-card .ab-close-button{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;background-color:transparent;background-size:15px;border:none;width:15px;min-width:15px;height:15px;cursor:pointer;display:block;font-size:15px;line-height:0;padding-top:15px;padding-right:15px;padding-left:15px;padding-bottom:15px;position:absolute;top:0;z-index:9021;opacity:0;-webkit-transition:.5s;-moz-transition:.5s;-o-transition:.5s;transition:.5s}.ab-feed .ab-card .ab-close-button[dir=rtl]{left:0}.ab-feed .ab-card .ab-close-button[dir=ltr]{right:0}.ab-feed .ab-card .ab-close-button svg{-webkit-transition:.2s ease;-moz-transition:.2s ease;-o-transition:.2s ease;transition:.2s ease;fill:#9b9b9b;height:auto;width:100%}.ab-feed .ab-card .ab-close-button svg.ab-chevron{display:none}.ab-feed .ab-card .ab-close-button:active{background-color:transparent}.ab-feed .ab-card .ab-close-button:focus{background-color:transparent}.ab-feed .ab-card .ab-close-button:hover{background-color:transparent}.ab-feed .ab-card .ab-close-button:hover svg{fill-opacity:.8}.ab-feed .ab-card .ab-close-button:hover{opacity:1}.ab-feed .ab-card .ab-close-button:focus{opacity:1}.ab-feed .ab-card a{float:none;color:inherit;text-decoration:none}.ab-feed .ab-card a:hover{text-decoration:underline}.ab-feed .ab-card .ab-image-area{float:none;display:inline-block;vertical-align:top;line-height:0;overflow:hidden;width:100%;-webkit-box-sizing:initial;-moz-box-sizing:initial;box-sizing:initial}.ab-feed .ab-card .ab-image-area img{float:none;height:auto;width:100%}.ab-feed .ab-card.ab-image-only .ab-card-body{display:none}.ab-feed .ab-card .ab-card-body{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;display:inline-block;width:100%;position:relative}.ab-feed .ab-card .ab-unread-indicator{position:absolute;bottom:0;margin-right:-1px;width:100%;height:5px;background-color:#1676d0}.ab-feed .ab-card .ab-unread-indicator.read{background-color:transparent}.ab-feed .ab-card .ab-title{float:none;letter-spacing:0;margin:0;font-weight:700;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif;display:block;overflow:hidden;word-wrap:break-word;text-overflow:ellipsis;font-size:18px;line-height:130%;padding:20px 25px 0 25px}.ab-feed .ab-card .ab-description{float:none;color:#545454;padding:15px 25px 20px 25px;word-wrap:break-word;white-space:pre-wrap}.ab-feed .ab-card .ab-description.ab-no-title{padding-top:20px}.ab-feed .ab-card .ab-url-area{float:none;color:#1676d0;margin-top:12px;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif}.ab-feed .ab-card.ab-classic-card .ab-card-body{min-height:40px;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px}.ab-feed .ab-card.ab-classic-card.with-image .ab-card-body{min-height:100px}.ab-feed .ab-card.ab-classic-card.with-image .ab-card-body[dir=ltr]{padding-left:72px}.ab-feed .ab-card.ab-classic-card.with-image .ab-card-body[dir=rtl]{padding-right:72px}.ab-feed .ab-card.ab-classic-card.with-image .ab-image-area{width:60px;height:60px;padding:20px 0 25px 25px;position:absolute}.ab-feed .ab-card.ab-classic-card.with-image .ab-image-area[dir=rtl]{padding:20px 25px 25px 0}.ab-feed .ab-card.ab-classic-card.with-image .ab-image-area img{-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;max-width:100%;max-height:100%;width:auto;height:auto}.ab-feed .ab-card.ab-classic-card.with-image .ab-title{background-color:transparent;font-size:16px}.ab-feed .ab-card.ab-classic-card.with-image .ab-description{padding-top:10px}.ab-feed .ab-card.ab-control-card{height:0;width:0;margin:0;border:0}.ab-feed .ab-feed-buttons-wrapper{float:none;position:relative;background-color:#282828;height:50px;-webkit-box-shadow:0 2px 3px 0 rgba(178,178,178,.5);-moz-box-shadow:0 2px 3px 0 rgba(178,178,178,.5);box-shadow:0 2px 3px 0 rgba(178,178,178,.5);z-index:1}.ab-feed .ab-feed-buttons-wrapper .ab-close-button,.ab-feed .ab-feed-buttons-wrapper .ab-refresh-button{float:none;cursor:pointer;color:#fff;font-size:18px;padding:16px;-webkit-transition:.2s;-moz-transition:.2s;-o-transition:.2s;transition:.2s}.ab-feed .ab-feed-buttons-wrapper .ab-close-button:hover,.ab-feed .ab-feed-buttons-wrapper .ab-refresh-button:hover{font-size:22px}.ab-feed .ab-feed-buttons-wrapper .ab-close-button{float:right}.ab-feed .ab-feed-buttons-wrapper .ab-close-button:hover{padding-top:12px;padding-right:14px}.ab-feed .ab-feed-buttons-wrapper .ab-refresh-button{padding-left:17px}.ab-feed .ab-feed-buttons-wrapper .ab-refresh-button:hover{padding-top:13px;padding-left:14px}.ab-feed .ab-no-cards-message{text-align:center;margin-bottom:20px}@media (max-width:600px){body>.ab-feed{width:100%}}",
	  );
	}
	function setupFeedUI() {
	  attachFeedCSS(), loadFontAwesome();
	}

	function attachInAppMessageCSS(t) {
	  attachCSS(
	    t,
	    "iam",
	    ".ab-pause-scrolling,body.ab-pause-scrolling,html.ab-pause-scrolling{overflow:hidden;touch-action:none}.ab-iam-root.v3{position:fixed;top:0;right:0;bottom:0;left:0;pointer-events:none;z-index:9011;-webkit-tap-highlight-color:transparent}.ab-iam-root.v3:focus{outline:0}.ab-iam-root.v3.ab-effect-fullscreen,.ab-iam-root.v3.ab-effect-html,.ab-iam-root.v3.ab-effect-modal{opacity:0}.ab-iam-root.v3.ab-effect-fullscreen.ab-show,.ab-iam-root.v3.ab-effect-html.ab-show,.ab-iam-root.v3.ab-effect-modal.ab-show{opacity:1}.ab-iam-root.v3.ab-effect-fullscreen.ab-show.ab-animate-in,.ab-iam-root.v3.ab-effect-html.ab-show.ab-animate-in,.ab-iam-root.v3.ab-effect-modal.ab-show.ab-animate-in{-webkit-transition:opacity .5s;-moz-transition:opacity .5s;-o-transition:opacity .5s;transition:opacity .5s}.ab-iam-root.v3.ab-effect-fullscreen.ab-hide,.ab-iam-root.v3.ab-effect-html.ab-hide,.ab-iam-root.v3.ab-effect-modal.ab-hide{opacity:0}.ab-iam-root.v3.ab-effect-fullscreen.ab-hide.ab-animate-out,.ab-iam-root.v3.ab-effect-html.ab-hide.ab-animate-out,.ab-iam-root.v3.ab-effect-modal.ab-hide.ab-animate-out{-webkit-transition:opacity .5s;-moz-transition:opacity .5s;-o-transition:opacity .5s;transition:opacity .5s}.ab-iam-root.v3.ab-effect-slide .ab-in-app-message{-webkit-transform:translateX(535px);-moz-transform:translateX(535px);-ms-transform:translateX(535px);transform:translateX(535px)}.ab-iam-root.v3.ab-effect-slide.ab-show .ab-in-app-message{-webkit-transform:translateX(0);-moz-transform:translateX(0);-ms-transform:translateX(0);transform:translateX(0)}.ab-iam-root.v3.ab-effect-slide.ab-show.ab-animate-in .ab-in-app-message{-webkit-transition:transform .5s ease-in-out;-moz-transition:transform .5s ease-in-out;-o-transition:transform .5s ease-in-out;transition:transform .5s ease-in-out}.ab-iam-root.v3.ab-effect-slide.ab-hide .ab-in-app-message{-webkit-transform:translateX(535px);-moz-transform:translateX(535px);-ms-transform:translateX(535px);transform:translateX(535px)}.ab-iam-root.v3.ab-effect-slide.ab-hide .ab-in-app-message.ab-swiped-left{-webkit-transform:translateX(-535px);-moz-transform:translateX(-535px);-ms-transform:translateX(-535px);transform:translateX(-535px)}.ab-iam-root.v3.ab-effect-slide.ab-hide .ab-in-app-message.ab-swiped-up{-webkit-transform:translateY(-535px);-moz-transform:translateY(-535px);-ms-transform:translateY(-535px);transform:translateY(-535px)}.ab-iam-root.v3.ab-effect-slide.ab-hide .ab-in-app-message.ab-swiped-down{-webkit-transform:translateY(535px);-moz-transform:translateY(535px);-ms-transform:translateY(535px);transform:translateY(535px)}.ab-iam-root.v3.ab-effect-slide.ab-hide.ab-animate-out .ab-in-app-message{-webkit-transition:transform .5s ease-in-out;-moz-transition:transform .5s ease-in-out;-o-transition:transform .5s ease-in-out;transition:transform .5s ease-in-out}.ab-iam-root.v3 .ab-ios-scroll-wrapper{position:fixed;top:0;right:0;bottom:0;left:0;overflow:auto;pointer-events:all;touch-action:auto;-webkit-overflow-scrolling:touch}.ab-iam-root.v3 .ab-in-app-message{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:fixed;text-align:center;-webkit-box-shadow:0 0 4px rgba(0,0,0,.3);-moz-box-shadow:0 0 4px rgba(0,0,0,.3);box-shadow:0 0 4px rgba(0,0,0,.3);line-height:normal;letter-spacing:normal;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif;z-index:9011;max-width:100%;overflow:hidden;display:inline-block;pointer-events:all;color:#333;color-scheme:normal}.ab-iam-root.v3 .ab-in-app-message.ab-no-shadow{-webkit-box-shadow:none;-moz-box-shadow:none;box-shadow:none}.ab-iam-root.v3 .ab-in-app-message :focus,.ab-iam-root.v3 .ab-in-app-message:focus{outline:0}.ab-iam-root.v3 .ab-in-app-message.ab-clickable{cursor:pointer}.ab-iam-root.v3 .ab-in-app-message.ab-background{background-color:#fff}.ab-iam-root.v3 .ab-in-app-message .ab-close-button{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;background-color:transparent;background-size:15px;border:none;width:15px;min-width:15px;height:15px;cursor:pointer;display:block;font-size:15px;line-height:0;padding-top:15px;padding-right:15px;padding-left:15px;padding-bottom:15px;position:absolute;top:0;z-index:9021}.ab-iam-root.v3 .ab-in-app-message .ab-close-button[dir=rtl]{left:0}.ab-iam-root.v3 .ab-in-app-message .ab-close-button[dir=ltr]{right:0}.ab-iam-root.v3 .ab-in-app-message .ab-close-button svg{-webkit-transition:.2s ease;-moz-transition:.2s ease;-o-transition:.2s ease;transition:.2s ease;fill:#9b9b9b;height:auto;width:100%}.ab-iam-root.v3 .ab-in-app-message .ab-close-button svg.ab-chevron{display:none}.ab-iam-root.v3 .ab-in-app-message .ab-close-button:active{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message .ab-close-button:focus{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message .ab-close-button:hover{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message .ab-close-button:hover svg{fill-opacity:.8}.ab-iam-root.v3 .ab-in-app-message .ab-message-text{float:none;line-height:1.5;margin:20px 25px;max-width:100%;overflow:hidden;overflow-y:auto;vertical-align:text-bottom;word-wrap:break-word;white-space:pre-wrap;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif}.ab-iam-root.v3 .ab-in-app-message .ab-message-text.start-aligned{text-align:start}.ab-iam-root.v3 .ab-in-app-message .ab-message-text.end-aligned{text-align:end}.ab-iam-root.v3 .ab-in-app-message .ab-message-text.center-aligned{text-align:center}.ab-iam-root.v3 .ab-in-app-message .ab-message-text::-webkit-scrollbar{-webkit-appearance:none;width:14px}.ab-iam-root.v3 .ab-in-app-message .ab-message-text::-webkit-scrollbar-thumb{-webkit-appearance:none;border:4px solid transparent;background-clip:padding-box;-webkit-border-radius:7px;-moz-border-radius:7px;border-radius:7px;background-color:rgba(0,0,0,.2)}.ab-iam-root.v3 .ab-in-app-message .ab-message-text::-webkit-scrollbar-button{width:0;height:0;display:none}.ab-iam-root.v3 .ab-in-app-message .ab-message-text::-webkit-scrollbar-corner{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message .ab-message-header{float:none;letter-spacing:0;margin:0;font-weight:700;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif;display:block;font-size:20px;margin-bottom:10px;line-height:1.3}.ab-iam-root.v3 .ab-in-app-message .ab-message-header.start-aligned{text-align:start}.ab-iam-root.v3 .ab-in-app-message .ab-message-header.end-aligned{text-align:end}.ab-iam-root.v3 .ab-in-app-message .ab-message-header.center-aligned{text-align:center}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen,.ab-iam-root.v3 .ab-in-app-message.ab-modal,.ab-iam-root.v3 .ab-in-app-message.ab-slideup{-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;cursor:pointer;overflow:hidden;word-wrap:break-word;text-overflow:ellipsis;font-size:14px;font-weight:700;margin:20px;margin-top:calc(constant(safe-area-inset-top,0) + 20px);margin-right:calc(constant(safe-area-inset-right,0) + 20px);margin-bottom:calc(constant(safe-area-inset-bottom,0) + 20px);margin-left:calc(constant(safe-area-inset-left,0) + 20px);margin-top:calc(env(safe-area-inset-top,0) + 20px);margin-right:calc(env(safe-area-inset-right,0) + 20px);margin-bottom:calc(env(safe-area-inset-bottom,0) + 20px);margin-left:calc(env(safe-area-inset-left,0) + 20px);max-height:150px;padding:10px;right:0;background-color:#efefef}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone{max-height:66px;margin:10px;margin-top:calc(constant(safe-area-inset-top,0) + 10px);margin-right:calc(constant(safe-area-inset-right,0) + 10px);margin-bottom:calc(constant(safe-area-inset-bottom,0) + 10px);margin-left:calc(constant(safe-area-inset-left,0) + 10px);margin-top:calc(env(safe-area-inset-top,0) + 10px);margin-right:calc(env(safe-area-inset-right,0) + 10px);margin-bottom:calc(env(safe-area-inset-bottom,0) + 10px);margin-left:calc(env(safe-area-inset-left,0) + 10px);max-width:90%;max-width:calc(100% - 40px);min-width:90%;min-width:calc(100% - 40px)}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-close-button{display:none}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-close-button svg:not(.ab-chevron){display:none}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone.ab-clickable .ab-close-button{display:block;height:20px;padding:0 20px 0 18px;pointer-events:none;top:50%;-webkit-transform:translateY(-50%);-moz-transform:translateY(-50%);-ms-transform:translateY(-50%);transform:translateY(-50%);width:12px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone.ab-clickable .ab-close-button svg.ab-chevron{display:inline}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone.ab-clickable .ab-close-button svg.ab-chevron.rtl{-webkit-transform:scaleX(-1);-moz-transform:scaleX(-1);-ms-transform:scaleX(-1);transform:scaleX(-1)}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone.ab-clickable .ab-message-text{border-right-width:40px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-message-text{max-width:100%;border-right-width:10px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-message-text span{max-height:66px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-message-text.ab-with-icon,.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-message-text.ab-with-image{max-width:80%;max-width:calc(100% - 50px - 5px - 10px - 25px)}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-image-area{width:50px;height:50px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.simulate-phone .ab-image-area img{max-width:100%;max-height:100%;width:auto;height:auto}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable:active .ab-message-text,.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable:focus .ab-message-text,.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable:hover .ab-message-text{opacity:.8}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable:active .ab-close-button svg.ab-chevron,.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable:focus .ab-close-button svg.ab-chevron,.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable:hover .ab-close-button svg.ab-chevron{fill-opacity:.8}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:table-cell;border-color:transparent;border-style:solid;border-width:5px 25px 5px 10px;max-width:430px;vertical-align:middle;margin:0}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text[dir=rtl]{border-width:5px 10px 5px 25px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text span{display:block;max-height:150px;overflow:auto}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text.ab-with-icon,.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text.ab-with-image{max-width:365px;border-top:0;border-bottom:0}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;background-color:transparent;background-size:15px;border:none;width:15px;min-width:15px;height:15px;cursor:pointer;display:block;font-size:15px;line-height:0;padding-top:15px;padding-right:15px;padding-left:15px;padding-bottom:15px;position:absolute;top:0;z-index:9021}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button[dir=rtl]{left:0}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button[dir=ltr]{right:0}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button svg{-webkit-transition:.2s ease;-moz-transition:.2s ease;-o-transition:.2s ease;transition:.2s ease;fill:#9b9b9b;height:auto;width:100%}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button svg.ab-chevron{display:none}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button:active{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button:focus{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button:hover{background-color:transparent}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button:hover svg{fill-opacity:.8}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-image-area{float:none;-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:table-cell;border-color:transparent;border-style:solid;border-width:5px 0 5px 5px;vertical-align:top;width:60px;margin:0}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-image-area.ab-icon-area{width:auto}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-image-area img{float:none;width:100%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen,.ab-iam-root.v3 .ab-in-app-message.ab-modal{font-size:14px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-image-area,.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-image-area{float:none;position:relative;display:block;overflow:hidden}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-image-area .ab-center-cropped-img,.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-image-area .ab-center-cropped-img{position:absolute;top:0;right:0;bottom:0;left:0}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-image-area .ab-center-cropped-img img,.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-image-area .ab-center-cropped-img img{width:100%;height:100%;object-fit:cover;object-position:center}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-icon,.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-icon{margin-top:20px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.graphic,.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic{padding:0}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.graphic .ab-message-text,.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic .ab-message-text{display:none}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.graphic .ab-message-buttons,.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic .ab-message-buttons{bottom:0;left:0}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.graphic .ab-image-area,.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic .ab-image-area{float:none;height:auto;margin:0}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.graphic .ab-image-area img,.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic .ab-image-area img{display:block;top:0;-webkit-transform:none;-moz-transform:none;-ms-transform:none;transform:none}.ab-iam-root.v3 .ab-in-app-message.ab-modal{padding-top:20px;width:450px;max-width:450px;max-height:720px}.ab-iam-root.v3 .ab-in-app-message.ab-modal.simulate-phone{max-width:91%;max-width:calc(100% - 30px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal.simulate-phone.graphic .ab-image-area img{max-width:91vw;max-width:calc(100vw - 30px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-message-text{max-height:660px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-message-text.ab-with-image{max-height:524.82758621px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-message-text.ab-with-icon{max-height:610px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-message-text.ab-with-buttons{margin-bottom:93px;max-height:587px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-message-text.ab-with-buttons.ab-with-image{max-height:451.82758621px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-message-text.ab-with-buttons.ab-with-icon{max-height:537px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-image-area{margin-top:-20px;max-height:155.17241379px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-image-area img{max-width:100%;max-height:155.17241379px}.ab-iam-root.v3 .ab-in-app-message.ab-modal .ab-image-area.ab-icon-area{height:auto}.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic{width:auto;overflow:hidden}.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic .ab-image-area{display:inline}.ab-iam-root.v3 .ab-in-app-message.ab-modal.graphic .ab-image-area img{width:auto;max-height:720px;max-width:450px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen{width:450px;max-height:720px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape{width:720px;max-height:450px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape .ab-image-area{height:225px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape.graphic .ab-image-area{height:450px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape .ab-message-text{max-height:112px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-message-text{max-height:247px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-message-text.ab-with-buttons{margin-bottom:93px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-image-area{height:360px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.graphic .ab-image-area{height:720px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone{-webkit-transition:top none;-moz-transition:top none;-o-transition:top none;transition:top none;top:0;right:0;bottom:0;left:0;height:100%;width:100%;max-height:none;-webkit-border-radius:0;-moz-border-radius:0;border-radius:0;-webkit-transform:none;-moz-transform:none;-ms-transform:none;transform:none;height:auto!important}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone.landscape .ab-close-button{margin-right:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-right:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0));margin-left:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-left:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0))}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone .ab-image-area,.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone.landscape .ab-image-area{height:50%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone .ab-message-text{max-height:48%;max-height:calc(50% - 20px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone .ab-message-text.ab-with-buttons{margin-bottom:20px;max-height:30%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone.landscape .ab-message-text.ab-with-buttons{max-height:20%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone:not(.graphic){padding-bottom:0;padding-bottom:constant(safe-area-inset-bottom,0);padding-bottom:env(safe-area-inset-bottom,0)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone:not(.graphic) .ab-message-buttons{padding-top:0;position:relative}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone.graphic{display:block}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone.graphic .ab-image-area{height:100%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.simulate-phone.graphic .ab-message-button{margin-bottom:0;margin-bottom:constant(safe-area-inset-bottom,0);margin-bottom:env(safe-area-inset-bottom,0)}.ab-iam-root.v3 .ab-in-app-message.ab-html-message{background-color:transparent;border:none;height:100%;overflow:auto;position:relative;touch-action:auto;width:100%}.ab-iam-root.v3 .ab-in-app-message .ab-message-buttons{position:absolute;bottom:0;width:100%;padding:17px 25px 30px 25px;z-index:inherit;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.ab-iam-root.v3 .ab-in-app-message .ab-message-button{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;-webkit-border-radius:5px;-moz-border-radius:5px;border-radius:5px;-webkit-box-shadow:none;-moz-box-shadow:none;box-shadow:none;cursor:pointer;display:inline-block;font-size:14px;font-weight:700;font-family:'Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif;height:44px;line-height:normal;letter-spacing:normal;margin:0;max-width:100%;min-width:80px;padding:0 12px;position:relative;text-transform:none;width:48%;width:calc(50% - 5px);border:1px solid #1b78cf;-webkit-transition:.2s ease;-moz-transition:.2s ease;-o-transition:.2s ease;transition:.2s ease;overflow:hidden;word-wrap:break-word;text-overflow:ellipsis;word-wrap:normal;white-space:nowrap}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:first-of-type{float:left;background-color:#fff;color:#1b78cf}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:last-of-type{float:right;background-color:#1b78cf;color:#fff}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:first-of-type:last-of-type{float:none;width:auto}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:after{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background-color:transparent}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:after{-webkit-transition:.2s ease;-moz-transition:.2s ease;-o-transition:.2s ease;transition:.2s ease}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:hover{opacity:.8}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:active:after{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.08)}.ab-iam-root.v3 .ab-in-app-message .ab-message-button:focus:after{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.15)}.ab-iam-root.v3 .ab-in-app-message .ab-message-button a{color:inherit;text-decoration:inherit}.ab-iam-root.v3 .ab-in-app-message img{float:none;display:inline-block}.ab-iam-root.v3 .ab-in-app-message .ab-icon{float:none;display:inline-block;padding:10px;-webkit-border-radius:8px;-moz-border-radius:8px;border-radius:8px}.ab-iam-root.v3 .ab-in-app-message .ab-icon .fa{float:none;font-size:30px;width:30px}.ab-iam-root.v3 .ab-start-hidden{visibility:hidden}.ab-iam-root.v3 .ab-centered{margin:auto;position:absolute;top:50%;left:50%;-webkit-transform:translate(-50%,-50%);-moz-transform:translate(-50%,-50%);-ms-transform:translate(-50%,-50%);transform:translate(-50%,-50%)}.ab-iam-root.v3{-webkit-border-radius:0;-moz-border-radius:0;border-radius:0}.ab-iam-root.v3 .ab-page-blocker{position:fixed;top:0;left:0;width:100%;height:100%;z-index:9001;pointer-events:all;background-color:rgba(51,51,51,.75)}@media (max-width:600px){.ab-iam-root.v3 .ab-in-app-message.ab-slideup{max-height:66px;margin:10px;margin-top:calc(constant(safe-area-inset-top,0) + 10px);margin-right:calc(constant(safe-area-inset-right,0) + 10px);margin-bottom:calc(constant(safe-area-inset-bottom,0) + 10px);margin-left:calc(constant(safe-area-inset-left,0) + 10px);margin-top:calc(env(safe-area-inset-top,0) + 10px);margin-right:calc(env(safe-area-inset-right,0) + 10px);margin-bottom:calc(env(safe-area-inset-bottom,0) + 10px);margin-left:calc(env(safe-area-inset-left,0) + 10px);max-width:90%;max-width:calc(100% - 40px);min-width:90%;min-width:calc(100% - 40px)}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button{display:none}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-close-button svg:not(.ab-chevron){display:none}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable .ab-close-button{display:block;height:20px;padding:0 20px 0 18px;pointer-events:none;top:50%;-webkit-transform:translateY(-50%);-moz-transform:translateY(-50%);-ms-transform:translateY(-50%);transform:translateY(-50%);width:12px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable .ab-close-button svg.ab-chevron{display:inline}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable .ab-close-button svg.ab-chevron.rtl{-webkit-transform:scaleX(-1);-moz-transform:scaleX(-1);-ms-transform:scaleX(-1);transform:scaleX(-1)}.ab-iam-root.v3 .ab-in-app-message.ab-slideup.ab-clickable .ab-message-text{border-right-width:40px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text{max-width:100%;border-right-width:10px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text span{max-height:66px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text.ab-with-icon,.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-message-text.ab-with-image{max-width:80%;max-width:calc(100% - 50px - 5px - 10px - 25px)}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-image-area{width:50px;height:50px}.ab-iam-root.v3 .ab-in-app-message.ab-slideup .ab-image-area img{max-width:100%;max-height:100%;width:auto;height:auto}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape{-webkit-transition:top none;-moz-transition:top none;-o-transition:top none;transition:top none;top:0;right:0;bottom:0;left:0;height:100%;width:100%;max-height:none;-webkit-border-radius:0;-moz-border-radius:0;border-radius:0;-webkit-transform:none;-moz-transform:none;-ms-transform:none;transform:none;height:auto!important}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape .ab-close-button,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape.landscape .ab-close-button{margin-right:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-right:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0));margin-left:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-left:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0))}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen .ab-image-area,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape .ab-image-area,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape.landscape .ab-image-area{height:50%}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen .ab-message-text,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape .ab-message-text{max-height:48%;max-height:calc(50% - 20px - 20px)}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen .ab-message-text.ab-with-buttons,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape .ab-message-text.ab-with-buttons{margin-bottom:20px;max-height:30%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape .ab-message-text.ab-with-buttons,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape.landscape .ab-message-text.ab-with-buttons{max-height:20%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape:not(.graphic),.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen:not(.graphic){padding-bottom:0;padding-bottom:constant(safe-area-inset-bottom,0);padding-bottom:env(safe-area-inset-bottom,0)}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape:not(.graphic) .ab-message-buttons,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen:not(.graphic) .ab-message-buttons{padding-top:0;position:relative}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.graphic,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape.graphic{display:block}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.graphic .ab-image-area,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape.graphic .ab-image-area{height:100%}.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.graphic .ab-message-button,.ab-iam-root.v3 .ab-in-app-message:not(.force-desktop).ab-fullscreen.landscape.graphic .ab-message-button{margin-bottom:0;margin-bottom:constant(safe-area-inset-bottom,0);margin-bottom:env(safe-area-inset-bottom,0)}}@media (max-width:480px){.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop){max-width:91%;max-width:calc(100% - 30px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop).graphic .ab-image-area img{max-width:91vw;max-width:calc(100vw - 30px)}}@media (max-height:750px){.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop){max-height:91%;max-height:calc(100% - 30px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop).graphic .ab-image-area img{max-height:91vh;max-height:calc(100vh - 30px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop) .ab-message-text{max-height:65vh;max-height:calc(100vh - 30px - 60px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop) .ab-message-text.ab-with-image{max-height:45vh;max-height:calc(100vh - 30px - 155.17241379310346px - 40px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop) .ab-message-text.ab-with-icon{max-height:45vh;max-height:calc(100vh - 30px - 70px - 40px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop) .ab-message-text.ab-with-buttons{max-height:50vh;max-height:calc(100vh - 30px - 93px - 40px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop) .ab-message-text.ab-with-buttons.ab-with-image{max-height:30vh;max-height:calc(100vh - 30px - 155.17241379310346px - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-modal:not(.force-desktop) .ab-message-text.ab-with-buttons.ab-with-icon{max-height:30vh;max-height:calc(100vh - 30px - 70px - 93px - 20px)}}@media (min-width:601px){.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen .ab-image-area img{max-height:100%;max-width:100%}}@media (max-height:750px) and (min-width:601px){.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop){-webkit-transition:top none;-moz-transition:top none;-o-transition:top none;transition:top none;top:0;right:0;bottom:0;left:0;height:100%;width:100%;max-height:none;-webkit-border-radius:0;-moz-border-radius:0;border-radius:0;-webkit-transform:none;-moz-transform:none;-ms-transform:none;transform:none;height:auto!important;width:450px}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop).landscape .ab-close-button{margin-right:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-right:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0));margin-left:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-left:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0))}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop) .ab-image-area,.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop).landscape .ab-image-area{height:50%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop) .ab-message-text{max-height:48%;max-height:calc(50% - 20px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop) .ab-message-text.ab-with-buttons{margin-bottom:20px;max-height:30%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop).landscape .ab-message-text.ab-with-buttons{max-height:20%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop):not(.graphic){padding-bottom:0;padding-bottom:constant(safe-area-inset-bottom,0);padding-bottom:env(safe-area-inset-bottom,0)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop):not(.graphic) .ab-message-buttons{padding-top:0;position:relative}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop).graphic{display:block}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop).graphic .ab-image-area{height:100%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen:not(.landscape):not(.force-desktop).graphic .ab-message-button{margin-bottom:0;margin-bottom:constant(safe-area-inset-bottom,0);margin-bottom:env(safe-area-inset-bottom,0)}}@media (max-height:480px){.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop){-webkit-transition:top none;-moz-transition:top none;-o-transition:top none;transition:top none;top:0;right:0;bottom:0;left:0;height:100%;width:100%;max-height:none;-webkit-border-radius:0;-moz-border-radius:0;border-radius:0;-webkit-transform:none;-moz-transform:none;-ms-transform:none;transform:none;height:auto!important}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).landscape .ab-close-button{margin-right:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-right:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0));margin-left:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-left:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0))}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop) .ab-image-area,.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).landscape .ab-image-area{height:50%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop) .ab-message-text{max-height:48%;max-height:calc(50% - 20px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop) .ab-message-text.ab-with-buttons{margin-bottom:20px;max-height:30%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).landscape .ab-message-text.ab-with-buttons{max-height:20%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop):not(.graphic){padding-bottom:0;padding-bottom:constant(safe-area-inset-bottom,0);padding-bottom:env(safe-area-inset-bottom,0)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop):not(.graphic) .ab-message-buttons{padding-top:0;position:relative}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).graphic{display:block}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).graphic .ab-image-area{height:100%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).graphic .ab-message-button{margin-bottom:0;margin-bottom:constant(safe-area-inset-bottom,0);margin-bottom:env(safe-area-inset-bottom,0)}}@media (max-width:750px){.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop){-webkit-transition:top none;-moz-transition:top none;-o-transition:top none;transition:top none;top:0;right:0;bottom:0;left:0;height:100%;width:100%;max-height:none;-webkit-border-radius:0;-moz-border-radius:0;border-radius:0;-webkit-transform:none;-moz-transform:none;-ms-transform:none;transform:none;height:auto!important}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).landscape .ab-close-button{margin-right:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-right:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0));margin-left:calc(constant(safe-area-inset-bottom,0) + constant(safe-area-inset-top,0));margin-left:calc(env(safe-area-inset-bottom,0) + env(safe-area-inset-top,0))}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop) .ab-image-area,.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).landscape .ab-image-area{height:50%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop) .ab-message-text{max-height:48%;max-height:calc(50% - 20px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop) .ab-message-text.ab-with-buttons{margin-bottom:20px;max-height:30%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).landscape .ab-message-text.ab-with-buttons{max-height:20%;max-height:calc(50% - 93px - 20px)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop):not(.graphic){padding-bottom:0;padding-bottom:constant(safe-area-inset-bottom,0);padding-bottom:env(safe-area-inset-bottom,0)}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop):not(.graphic) .ab-message-buttons{padding-top:0;position:relative}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).graphic{display:block}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).graphic .ab-image-area{height:100%}.ab-iam-root.v3 .ab-in-app-message.ab-fullscreen.landscape:not(.force-desktop).graphic .ab-message-button{margin-bottom:0;margin-bottom:constant(safe-area-inset-bottom,0);margin-bottom:env(safe-area-inset-bottom,0)}}",
	  );
	}
	function setupInAppMessageUI() {
	  attachInAppMessageCSS(), loadFontAwesome();
	}

	function attachBannerCSS(n) {
	  attachCSS(
	    n,
	    "banner",
	    ".ab-html-banner{width:100%;height:100%;border:none;display:block}.ab-html-control-banner{width:0;height:0;margin:0;border:none}",
	  );
	}
	function setupBannerUI() {
	  attachBannerCSS();
	}

	function be(e) {
	  let s = "";
	  return (
	    e.animateIn && (s += " ab-animate-in"),
	    e.animateOut && (s += " ab-animate-out"),
	    e instanceof FullScreenMessage
	      ? (s += " ab-effect-fullscreen")
	      : e instanceof HtmlMessage
	      ? (s += " ab-effect-html")
	      : e instanceof ModalMessage
	      ? (s += " ab-effect-modal")
	      : e instanceof SlideUpMessage && (s += " ab-effect-slide"),
	    s
	  );
	}

	function createCloseButton(t, o, e, r = "ltr") {
	  const n = document.createElement("button");
	  n.setAttribute("aria-label", t),
	    n.setAttribute("role", "button"),
	    (n.dir = r),
	    addPassiveEventListener(n, "touchstart"),
	    (n.className = "ab-close-button");
	  const l = buildSvg(
	    "0 0 15 15",
	    "M15 1.5L13.5 0l-6 6-6-6L0 1.5l6 6-6 6L1.5 15l6-6 6 6 1.5-1.5-6-6 6-6z",
	    o,
	  );
	  return (
	    n.appendChild(l),
	    l.setAttribute("aria-hidden", "true"),
	    n.addEventListener("keydown", (t) => {
	      (t.keyCode !== KeyCodes.Ho && t.keyCode !== KeyCodes.Go) ||
	        (e(), t.stopPropagation());
	    }),
	    (n.onclick = (t) => {
	      e(), t.stopPropagation();
	    }),
	    n
	  );
	}

	function isTransparent(r) {
	  return (
	    null != r &&
	    ((r = parseInt(r.toString())), !isNaN(r) && (4278190080 & r) >>> 24 == 0)
	  );
	}
	function toRgba(r, n) {
	  if (null == r) return "";
	  if (((r = parseInt(r.toString())), isNaN(r))) return "";
	  (n && !isNaN(parseFloat(n.toString()))) || (n = 1);
	  return (
	    "rgba(" +
	    [
	      (16711680 & (r >>>= 0)) >>> 16,
	      (65280 & r) >>> 8,
	      255 & r,
	      (((4278190080 & r) >>> 24) / 255) * n,
	    ].join(",") +
	    ")"
	  );
	}

	function logInAppMessageImpression(s) {
	  if (!r.rr()) return !1;
	  if (!(s instanceof InAppMessage || s instanceof ControlMessage))
	    return E$1.error(IamStrings.sS), !1;
	  const o = s instanceof ControlMessage ? f.om : f.wn;
	  return je$1.ra().lt(s, o).W;
	}

	function logInAppMessageClick(s) {
	  if (!r.rr()) return !1;
	  if (!(s instanceof InAppMessage)) return E$1.error(IamStrings.sS), !1;
	  const e = je$1.ra().lt(s, f.zn);
	  if (e) {
	    s.sm() || logInAppMessageImpression(s);
	    for (let r = 0; r < e.Ee.length; r++)
	      TriggersProviderFactory.o().he(ot.rm, [s.triggerId], e.Ee[r]);
	  }
	  return e.W;
	}

	const ORIENTATION = { PORTRAIT: 0, LANDSCAPE: 1 };
	function _isPhone() {
	  return screen.width <= 600;
	}
	function _getOrientation() {
	  if ("orientation" in window)
	    return 90 === Math.abs(window.orientation) || 270 === window.orientation
	      ? ORIENTATION.LANDSCAPE
	      : ORIENTATION.PORTRAIT;
	  const n = window;
	  if ("screen" in n) {
	    let e =
	      n.screen.orientation || screen.mozOrientation || screen.msOrientation;
	    return (
	      null != e && "object" == typeof e && (e = e.type),
	      "landscape-primary" === e || "landscape-secondary" === e
	        ? ORIENTATION.LANDSCAPE
	        : ORIENTATION.PORTRAIT
	    );
	  }
	  return ORIENTATION.PORTRAIT;
	}
	function _openUri(n, e, t) {
	  n && (e || (null != t && t.metaKey) ? window.open(n) : (window.location = n));
	}
	function _getCurrentUrl() {
	  return window.location.href;
	}
	const WindowUtils = {
	  openUri: _openUri,
	  Ua: _isPhone,
	  Ma: _getOrientation,
	  gl: _getCurrentUrl,
	};

	function getUser() {
	  if (r.rr()) return r.br();
	}

	function _handleBrazeAction(o, e, s) {
	  if (r.rr())
	    if (BRAZE_ACTION_URI_REGEX.test(o)) {
	      const e = getDecodedBrazeAction(o);
	      if (!e) return;
	      const s = (o) => {
	        if (!isValidBrazeActionJson(o))
	          return void E$1.error(
	            `Decoded Braze Action json is invalid: ${JSON.stringify(
              o,
              null,
              2,
            )}`,
	          );
	        const e = BRAZE_ACTIONS.properties.type,
	          t = BRAZE_ACTIONS.properties.eo,
	          i = BRAZE_ACTIONS.properties.so,
	          n = o[e];
	        if (n === BRAZE_ACTIONS.types.io) {
	          const e = o[t];
	          for (const o of e) s(o);
	        } else {
	          const e = o[i];
	          let s, t;
	          switch (n) {
	            case BRAZE_ACTIONS.types.logCustomEvent:
	              Promise.resolve().then(function () { return logCustomEvent$1; }).then(
	                ({ logCustomEvent: logCustomEvent }) => {
	                  r.ao()
	                    ? ((t = Array.prototype.slice.call(e)),
	                      logCustomEvent(...t))
	                    : E$1.error(CoreStrings.ee);
	                },
	              );
	              break;
	            case BRAZE_ACTIONS.types.requestPushPermission:
	              Promise.resolve().then(function () { return requestPushPermission$1; }).then(
	                ({ requestPushPermission: requestPushPermission }) => {
	                  r.ao()
	                    ? "Safari" === ro.browser && ro.OS === OperatingSystems.co
	                      ? window.navigator.standalone && requestPushPermission()
	                      : requestPushPermission()
	                    : E$1.error(CoreStrings.ee);
	                },
	              );
	              break;
	            case BRAZE_ACTIONS.types.setEmailNotificationSubscriptionType:
	            case BRAZE_ACTIONS.types.setPushNotificationSubscriptionType:
	            case BRAZE_ACTIONS.types.setCustomUserAttribute:
	            case BRAZE_ACTIONS.types.addToSubscriptionGroup:
	            case BRAZE_ACTIONS.types.removeFromSubscriptionGroup:
	            case BRAZE_ACTIONS.types.addToCustomAttributeArray:
	            case BRAZE_ACTIONS.types.removeFromCustomAttributeArray:
	              if (((s = getUser()), s)) {
	                s[n](...Array.prototype.slice.call(e));
	              }
	              break;
	            case BRAZE_ACTIONS.types.mo:
	            case BRAZE_ACTIONS.types.uo:
	              (t = Array.prototype.slice.call(e)), WindowUtils.openUri(...t);
	              break;
	            default:
	              E$1.info(`Ignoring unknown Braze Action: ${n}`);
	          }
	        }
	      };
	      s(e);
	    } else WindowUtils.openUri(o, e, s);
	}
	function handleBrazeAction(o, e) {
	  _handleBrazeAction(o, e);
	}

	function parseQueryStringKeyValues(t) {
	  null == t && (t = "");
	  const r = t.split("?").slice(1).join("?"),
	    n = {};
	  if (null != r) {
	    const t = r.split("&");
	    for (let r = 0; r < t.length; r++) {
	      const a = t[r].split("=");
	      "" !== a[0] && (n[a[0]] = a[1]);
	    }
	  }
	  return n;
	}
	function isURIJavascriptOrData(t) {
	  return !(
	    !t ||
	    (0 !== (t = t.toString().toLowerCase()).lastIndexOf("javascript:", 0) &&
	      0 !== t.lastIndexOf("data:", 0))
	  );
	}

	function logInAppMessageHtmlClick(e, t, s) {
	  if (!r.rr()) return !1;
	  if (!(e instanceof HtmlMessage))
	    return (
	      E$1.error(
	        "inAppMessage argument to logInAppMessageHtmlClick must be an HtmlMessage object.",
	      ),
	      !1
	    );
	  let o = f.zn;
	  null != t && (o = f.Sn);
	  const m = je$1.ra().lt(e, o, t, s);
	  if (m.W)
	    for (let r = 0; r < m.Ee.length; r++)
	      TriggersProviderFactory.o().he(ot.rm, [e.triggerId, t], m.Ee[r]);
	  return m.W;
	}

	const buildHtmlClickHandler = (l, t, i, o) => {
	  const r = i.getAttribute("href"),
	    e = i.onclick;
	  return (n) => {
	    if (null != e && "function" == typeof e && !1 === e.bind(i)(n)) return;
	    let s = parseQueryStringKeyValues(r).abButtonId;
	    if (
	      ((null != s && "" !== s) || (s = i.getAttribute("id") || void 0),
	      null != r && "" !== r && 0 !== r.indexOf("#"))
	    ) {
	      const e =
	          "blank" ===
	          (i.getAttribute("target") || "").toLowerCase().replace("_", ""),
	        m = o || l.openTarget === InAppMessage.OpenTarget.BLANK || e,
	        u = () => {
	          logInAppMessageHtmlClick(l, s, r), WindowUtils.openUri(r, m, n);
	        };
	      m ? u() : l.ll(t, u);
	    } else logInAppMessageHtmlClick(l, s, r || void 0);
	    return n.stopPropagation(), !1;
	  };
	};

	const buildBrazeBridge = (t, e) => {
	  const o = { display: {}, web: {} },
	    requestPushPermission = function () {
	      return function () {
	        const t = arguments;
	        Promise.resolve().then(function () { return requestPushPermission$1; }).then((e) => {
	          r.ao()
	            ? e.requestPushPermission(...Array.prototype.slice.call(t))
	            : E$1.error(CoreStrings.ee);
	        });
	      };
	    },
	    n = {
	      requestImmediateDataFlush: function () {
	        const t = arguments;
	        Promise.resolve().then(function () { return requestImmediateDataFlush$1; }).then(
	          ({ requestImmediateDataFlush: requestImmediateDataFlush }) => {
	            r.ao()
	              ? requestImmediateDataFlush(...Array.prototype.slice.call(t))
	              : E$1.error(CoreStrings.ee);
	          },
	        );
	      },
	      logCustomEvent: function () {
	        const t = arguments;
	        Promise.resolve().then(function () { return logCustomEvent$1; }).then(
	          ({ logCustomEvent: logCustomEvent }) => {
	            if (!r.ao()) return void E$1.error(CoreStrings.ee);
	            logCustomEvent(...Array.prototype.slice.call(t));
	          },
	        );
	      },
	      logPurchase: function () {
	        const t = arguments;
	        Promise.resolve().then(function () { return logPurchase$1; }).then(
	          ({ logPurchase: logPurchase }) => {
	            if (!r.ao()) return void E$1.error(CoreStrings.ee);
	            logPurchase(...Array.prototype.slice.call(t));
	          },
	        );
	      },
	      unregisterPush: function () {
	        const t = arguments;
	        Promise.resolve().then(function () { return unregisterPush$1; }).then(
	          ({ unregisterPush: unregisterPush }) => {
	            r.ao()
	              ? unregisterPush(...Array.prototype.slice.call(t))
	              : E$1.error(CoreStrings.ee);
	          },
	        );
	      },
	      requestPushPermission: requestPushPermission(),
	      changeUser: function () {
	        const t = arguments;
	        Promise.resolve().then(function () { return changeUser$1; }).then(({ changeUser: changeUser }) => {
	          if (!r.ao()) return void E$1.error(CoreStrings.ee);
	          changeUser(...Array.prototype.slice.call(t));
	        });
	      },
	    },
	    s = function (t) {
	      return function () {
	        n[t](...Array.prototype.slice.call(arguments));
	      };
	    };
	  for (const t of keys(n)) o[t] = s(t);
	  const i = [
	      "setFirstName",
	      "setLastName",
	      "setEmail",
	      "setGender",
	      "setDateOfBirth",
	      "setCountry",
	      "setHomeCity",
	      "setEmailNotificationSubscriptionType",
	      "setLanguage",
	      "addAlias",
	      "setPushNotificationSubscriptionType",
	      "setPhoneNumber",
	      "setCustomUserAttribute",
	      "addToCustomAttributeArray",
	      "removeFromCustomAttributeArray",
	      "incrementCustomUserAttribute",
	      "setCustomLocationAttribute",
	      "addToSubscriptionGroup",
	      "removeFromSubscriptionGroup",
	      "setLineId",
	    ],
	    u = function (t) {
	      return function () {
	        const e = getUser();
	        e && e[t](...Array.prototype.slice.call(arguments));
	      };
	    },
	    c = {};
	  for (let t = 0; t < i.length; t++) c[i[t]] = u(i[t]);
	  o.getUser = function () {
	    return c;
	  };
	  const a = {},
	    m = function (r) {
	      return function () {
	        const o = arguments;
	        "function" != typeof e
	          ? a[r](...Array.prototype.slice.call(o))
	          : e(t, function () {
	              a[r](...Array.prototype.slice.call(o));
	            });
	      };
	    },
	    f = o.display;
	  for (const t of keys(a)) f[t] = m(t);
	  const l = { registerAppboyPushMessages: requestPushPermission() },
	    p = function (t) {
	      return function () {
	        l[t](...Array.prototype.slice.call(arguments));
	      };
	    },
	    y = o.web;
	  for (const t of keys(l)) y[t] = p(t);
	  return (
	    (o.NotificationSubscriptionTypes = User.NotificationSubscriptionTypes), o
	  );
	};
	const applyNonceToDynamicallyCreatedTags = (t, e, r) => {
	  const o = `([\\w]+)\\s*=\\s*document.createElement\\(['"]${r}['"]\\)`,
	    n = t.match(new RegExp(o));
	  if (n) {
	    const r = `${n[1]}.setAttribute("nonce", "${e}")`;
	    return `${t.slice(0, n.index + n[0].length)};${r};${t.slice(
      n.index + n[0].length,
    )}`;
	  }
	  return null;
	};
	const attachHtmlToIframeWithNonce = (t, e, r) => {
	  let o = null;
	  if (null != r) {
	    (o = document.createElement("html")), (o.innerHTML = e || "");
	    const t = o.getElementsByTagName("style");
	    for (let e = 0; e < t.length; e++) t[e].setAttribute("nonce", r);
	    const n = o.getElementsByTagName("script");
	    for (let t = 0; t < n.length; t++) {
	      n[t].setAttribute("nonce", r),
	        (n[t].innerHTML = n[t].innerHTML.replace(
	          /<style>/g,
	          `<style nonce='${r}'>`,
	        ));
	      const e = applyNonceToDynamicallyCreatedTags(n[t].innerHTML, r, "script");
	      e && (n[t].innerHTML = e);
	      const o = applyNonceToDynamicallyCreatedTags(n[t].innerHTML, r, "style");
	      o && (n[t].innerHTML = o);
	    }
	  }
	  t.srcdoc = o ? o.innerHTML : e || "";
	};

	function ct(t, e, o, s, n) {
	  const i = document.createElement("iframe");
	  i.setAttribute("title", "Modal Message"),
	    s && (i.style.zIndex = (s + 1).toString());
	  if (
	    (attachHtmlToIframeWithNonce(i, t.message, n),
	    (i.onload = () => {
	      const s = i.contentWindow;
	      s.focus();
	      const l = s.document.getElementsByTagName("head")[0];
	      if (null != l) {
	        if (t.Mo()) {
	          const e = document.createElement("style");
	          (e.innerHTML = t.css || ""),
	            (e.id = t.Oo() || ""),
	            null != n && e.setAttribute("nonce", n),
	            l.appendChild(e);
	        }
	        const e = s.document.createElement("base");
	        null != e && (e.setAttribute("target", "_parent"), l.appendChild(e));
	      }
	      const a = s.document.getElementsByTagName("title");
	      a && a.length > 0 && i.setAttribute("title", a[0].textContent || "");
	      const r = Object.assign(
	        Object.assign(
	          {},
	          buildBrazeBridge(i, (e, o) => t.ll(e, o)),
	        ),
	        {
	          closeMessage: function () {
	            t.ll(i);
	          },
	          logClick: function () {
	            logInAppMessageHtmlClick(t, ...arguments);
	          },
	        },
	      );
	      if (
	        ((s.appboyBridge = r), (s.brazeBridge = r), t.ko !== InAppMessage.Eo.Bo)
	      ) {
	        const e = s.document.getElementsByTagName("a");
	        for (let s = 0; s < e.length; s++) e[s].onclick = buildHtmlClickHandler(t, i, e[s], o);
	        const n = s.document.getElementsByTagName("button");
	        for (let e = 0; e < n.length; e++) n[e].onclick = buildHtmlClickHandler(t, i, n[e], o);
	      }
	      const c = s.document.body;
	      if (null != c) {
	        t._o() && (c.id = t.htmlId || "");
	        const e = document.createElement("hidden");
	        (e.onclick = r.closeMessage),
	          (e.className = "ab-programmatic-close-button"),
	          c.appendChild(e);
	      }
	      s.dispatchEvent(new CustomEvent("ab.BridgeReady")),
	        -1 !== i.className.indexOf("ab-start-hidden") &&
	          ((i.className = i.className.replace("ab-start-hidden", "")), e(i));
	    }),
	    (i.className =
	      "ab-in-app-message ab-start-hidden ab-html-message ab-modal-interactions"),
	    ro.OS === OperatingSystems.co)
	  ) {
	    const e = document.createElement("div");
	    return (
	      (e.className = "ab-ios-scroll-wrapper"), e.appendChild(i), (t.qo = e), e
	    );
	  }
	  return (t.qo = i), i;
	}

	function logInAppMessageButtonClick(t, o) {
	  var e;
	  if (!r.rr()) return !1;
	  if (!(t instanceof InAppMessageButton))
	    return E$1.error("button must be an InAppMessageButton object"), !1;
	  if (!(o instanceof InAppMessage)) return E$1.error(IamStrings.sS), !1;
	  const s = je$1.ra().Rn(t, o);
	  if (s.W)
	    for (let r = 0; r < s.Ee.length; r++)
	      TriggersProviderFactory.o().he(
	        ot.rm,
	        [
	          o.triggerId,
	          null === (e = t.id) || void 0 === e ? void 0 : e.toString(),
	        ],
	        s.Ee[r],
	      );
	  return s.W;
	}

	const xe = {
	  Qo: (t) => {
	    const o = t.querySelectorAll(".ab-close-button, .ab-message-button");
	    let e;
	    for (let t = 0; t < o.length; t++) (e = o[t]), (e.tabIndex = 0);
	    if (o.length > 0) {
	      const e = o[0],
	        s = o[o.length - 1];
	      t.addEventListener("keydown", (o) => {
	        const a = document.activeElement;
	        o.keyCode === KeyCodes.Wo &&
	          (o.shiftKey || (a !== s && a !== t)
	            ? !o.shiftKey ||
	              (a !== e && a !== t) ||
	              (o.preventDefault(), s.focus())
	            : (o.preventDefault(), e.focus()));
	      });
	    }
	  },
	  So: (t, o) => {
	    o.setAttribute("role", "dialog"),
	      o.setAttribute("aria-modal", "true"),
	      t
	        ? o.setAttribute("aria-labelledby", t)
	        : o.setAttribute("aria-label", "Modal Message");
	  },
	  Po: (t, o, e) => {
	    if (t.buttons && t.buttons.length > 0) {
	      const s = document.createElement("div");
	      (s.className = "ab-message-buttons"), o.appendChild(s);
	      const a = o.getElementsByClassName("ab-message-text")[0];
	      null != a && (a.className += " ab-with-buttons");
	      const l = (s) => (a) => (
	        t.ll(o, () => {
	          logInAppMessageButtonClick(s, t),
	            s.clickAction === InAppMessage.ClickAction.URI &&
	              _handleBrazeAction(
	                s.uri || "",
	                e || t.openTarget === InAppMessage.OpenTarget.BLANK,
	                a,
	              );
	        }),
	        a.stopPropagation(),
	        !1
	      );
	      for (let o = 0; o < t.buttons.length; o++) {
	        const e = t.buttons[o],
	          a = document.createElement("button");
	        (a.className = "ab-message-button"),
	          a.setAttribute("type", "button"),
	          addPassiveEventListener(a, "touchstart");
	        let n = e.text;
	        "" === e.text && (n = " "),
	          a.appendChild(document.createTextNode(n)),
	          t.Mo() ||
	            ((a.style.backgroundColor = toRgba(e.backgroundColor)),
	            (a.style.color = toRgba(e.textColor)),
	            (a.style.borderColor = toRgba(e.borderColor))),
	          (a.onclick = l(e)),
	          s.appendChild(a);
	      }
	    }
	  },
	};

	function $e(e, o, t, a, n, i, s = document.body, m = "ltr") {
	  if (((e.$o = document.activeElement), e instanceof HtmlMessage))
	    return ct(e, o, a, n, i);
	  const l = (function (e, o, t, a, n, i = document.body, s = "ltr") {
	    let m = null;
	    const l = document.createElement("div");
	    (l.dir = s),
	      (l.className = "ab-in-app-message ab-start-hidden ab-background"),
	      n && (l.style.zIndex = (n + 1).toString()),
	      e.zo() &&
	        ((l.className += " ab-modal-interactions"),
	        l.setAttribute("tabindex", "-1")),
	      e.Mo() ||
	        ((l.style.color = toRgba(e.textColor)),
	        (l.style.backgroundColor = toRgba(e.backgroundColor)),
	        isTransparent(e.backgroundColor) && (l.className += " ab-no-shadow"));
	    const c = () => {
	        -1 !== l.className.indexOf("ab-start-hidden") &&
	          ((l.className = l.className.replace("ab-start-hidden", "")),
	          document.querySelectorAll(".ab-iam-img-loading").length > 0
	            ? t(
	                `Cannot show in-app message ${e.message} because another message is being shown.`,
	                InAppMessage.Ao.Lo,
	              )
	            : o(l));
	      },
	      r = (o = !0) => {
	        let t = document.querySelectorAll(".ab-iam-root");
	        (t && 0 !== t.length) || (t = i.querySelectorAll(".ab-iam-root")),
	          t &&
	            t.length > 0 &&
	            (t[0].classList.remove("ab-iam-img-loading"),
	            m && (clearTimeout(m), (m = null)),
	            o
	              ? c()
	              : E$1.error(
	                  `Cannot show in-app message ${e.message} because the image failed to load.`,
	                ));
	      };
	    if (
	      (e.imageStyle === InAppMessage.ImageStyle.GRAPHIC &&
	        (l.className += " graphic"),
	      e.orientation === InAppMessage.Orientation.LANDSCAPE &&
	        (l.className += " landscape"),
	      null != e.buttons && 0 === e.buttons.length)
	    ) {
	      e.clickAction !== InAppMessage.ClickAction.NONE &&
	        (l.className += " ab-clickable");
	      const o = (o) => (
	        e.ll(l, () => {
	          logInAppMessageClick(e),
	            e.clickAction === InAppMessage.ClickAction.URI &&
	              _handleBrazeAction(
	                e.uri || "",
	                a || e.openTarget === InAppMessage.OpenTarget.BLANK,
	                o,
	              );
	        }),
	        o.stopPropagation(),
	        !1
	      );
	      (l.onclick = o),
	        l.addEventListener("keydown", (e) => {
	          if (e.keyCode === KeyCodes.Go || e.keyCode === KeyCodes.Ho) return o(e);
	        });
	    }
	    const d = createCloseButton(
	      "Close Message",
	      e.Mo() ? void 0 : toRgba(e.closeButtonColor),
	      () => {
	        e.ll(l);
	      },
	      s,
	    );
	    l.appendChild(d), n && (d.style.zIndex = (n + 2).toString());
	    const u = document.createElement("div");
	    (u.className = "ab-message-text"),
	      (u.dir = s),
	      u.setAttribute("role", "article");
	    const b = (e.messageAlignment || e.Io).toLowerCase();
	    u.className += " " + b + "-aligned";
	    let f = !1;
	    const p = document.createElement("div");
	    if (((p.className = "ab-image-area"), e.imageUrl)) {
	      const o = document.createElement("img");
	      if (
	        (o.setAttribute("src", e.imageUrl),
	        e.Jo(o),
	        0 === document.querySelectorAll(".ab-iam-img-loading").length)
	      ) {
	        f = !0;
	        const e = document.querySelectorAll(".ab-iam-root");
	        e && e.length > 0 && e[0].classList.add("ab-iam-img-loading"),
	          (m = window.setTimeout(() => {
	            r(!1);
	          }, 6e4)),
	          (o.onload = () => {
	            r();
	          }),
	          (o.onerror = () => {
	            r(!1);
	          });
	      }
	      if (e.cropType === InAppMessage.CropType.CENTER_CROP) {
	        const e = document.createElement("div");
	        (e.className = "ab-center-cropped-img"),
	          e.appendChild(o),
	          p.appendChild(e);
	      } else p.appendChild(o);
	      l.appendChild(p), (u.className += " ab-with-image");
	    } else if (e.icon) {
	      p.className += " ab-icon-area";
	      const o = document.createElement("span");
	      (o.className = "ab-icon"),
	        e.Mo() ||
	          ((o.style.backgroundColor = toRgba(e.iconBackgroundColor)),
	          (o.style.color = toRgba(e.iconColor)));
	      const t = document.createElement("i");
	      (t.className = "fa"),
	        t.appendChild(document.createTextNode(e.icon)),
	        t.setAttribute("aria-hidden", "true"),
	        o.appendChild(t),
	        p.appendChild(o),
	        l.appendChild(p),
	        (u.className += " ab-with-icon");
	    }
	    if ((addPassiveEventListener(u, "touchstart"), e.header && e.header.length > 0)) {
	      const o = document.createElement("h1");
	      (o.className = "ab-message-header"), (e.Ko = P$1.se()), (o.id = e.Ko);
	      const t = (
	        e.headerAlignment || InAppMessage.TextAlignment.CENTER
	      ).toLowerCase();
	      (o.className += " " + t + "-aligned"),
	        e.Mo() || (o.style.color = toRgba(e.headerTextColor)),
	        o.appendChild(document.createTextNode(e.header)),
	        u.appendChild(o);
	    }
	    const g = e.No();
	    return u.appendChild(g), l.appendChild(u), f || c(), (e.qo = l), l;
	  })(e, o, t, a, n, s, m);
	  if (e instanceof FullScreenMessage || e instanceof ModalMessage) {
	    const o = e instanceof FullScreenMessage ? "ab-fullscreen" : "ab-modal";
	    (l.className += ` ${o} ab-centered`),
	      xe.Po(e, l, a),
	      xe.Qo(l),
	      xe.So(e.Ko, l);
	  } else if (e instanceof SlideUpMessage) {
	    (l.className += " ab-slideup"),
	      l.setAttribute("tabindex", "0"),
	      l.setAttribute("role", "alert");
	    const o = l.getElementsByClassName("ab-close-button")[0];
	    if (null != o) {
	      const t = buildSvg(
	        "0 0 11.38 19.44",
	        "M11.38 9.72l-9.33 9.72L0 17.3l7.27-7.58L0 2.14 2.05 0l9.33 9.72z",
	        e.Mo() ? void 0 : toRgba(e.closeButtonColor),
	      );
	      t.setAttribute("class", `ab-chevron ${m}`), o.appendChild(t);
	    }
	    let t, a;
	    detectSwipe(l, DIRECTIONS.de, (e) => {
	      (l.className += " ab-swiped-left"),
	        null != o && null != o.onclick && o.onclick(e);
	    }),
	      detectSwipe(l, DIRECTIONS.ce, (e) => {
	        (l.className += " ab-swiped-right"),
	          null != o && null != o.onclick && o.onclick(e);
	      }),
	      e.slideFrom === InAppMessage.SlideFrom.TOP
	        ? ((t = DIRECTIONS.Uo), (a = " ab-swiped-up"))
	        : ((t = DIRECTIONS.Vo), (a = " ab-swiped-down")),
	      detectSwipe(l, t, (e) => {
	        (l.className += a), null != o && null != o.onclick && o.onclick(e);
	      });
	  }
	  return l;
	}

	var zt = {
	  en: {
	    NO_CARDS_MESSAGE:
	      "We have no updates for you at this time.<br/>Please check again later.",
	    FEED_TIMEOUT_MESSAGE:
	      "Sorry, this refresh timed out.<br/>Please try again later.",
	  },
	  ar: {
	    NO_CARDS_MESSAGE: "ليس لدينا أي تحديث. يرجى التحقق مرة أخرى لاحقاً",
	    FEED_TIMEOUT_MESSAGE: "يرجى تكرار المحاولة لاحقا",
	  },
	  cs: {
	    NO_CARDS_MESSAGE:
	      "V tuto chvíli pro vás nemáme žádné aktualizace.<br/>Zkontrolujte prosím znovu později.",
	    FEED_TIMEOUT_MESSAGE: "Prosím zkuste to znovu později.",
	  },
	  da: {
	    NO_CARDS_MESSAGE: "Vi har ingen updates.<br/>Prøv venligst senere.",
	    FEED_TIMEOUT_MESSAGE: "Prøv venligst senere.",
	  },
	  de: {
	    NO_CARDS_MESSAGE:
	      "Derzeit sind keine Updates verfügbar.<br/>Bitte später noch einmal versuchen.",
	    FEED_TIMEOUT_MESSAGE: "Bitte später noch einmal versuchen.",
	  },
	  es: {
	    NO_CARDS_MESSAGE:
	      "No tenemos actualizaciones.<br/>Por favor compruébelo más tarde.",
	    FEED_TIMEOUT_MESSAGE: "Por favor inténtelo más tarde.",
	  },
	  "es-mx": {
	    NO_CARDS_MESSAGE:
	      "No tenemos ninguna actualización.<br/>Vuelva a verificar más tarde.",
	    FEED_TIMEOUT_MESSAGE: "Por favor, vuelva a intentarlo más tarde.",
	  },
	  et: {
	    NO_CARDS_MESSAGE:
	      "Uuendusi pole praegu saadaval.<br/>Proovige hiljem uuesti.",
	    FEED_TIMEOUT_MESSAGE: "Palun proovige hiljem uuesti.",
	  },
	  fi: {
	    NO_CARDS_MESSAGE:
	      "Päivityksiä ei ole saatavilla.<br/>Tarkista myöhemmin uudelleen.",
	    FEED_TIMEOUT_MESSAGE: "Yritä myöhemmin uudelleen.",
	  },
	  fr: {
	    NO_CARDS_MESSAGE:
	      "Aucune mise à jour disponible.<br/>Veuillez vérifier ultérieurement.",
	    FEED_TIMEOUT_MESSAGE: "Veuillez réessayer ultérieurement.",
	  },
	  he: {
	    NO_CARDS_MESSAGE: ".אין לנו עדכונים. בבקשה בדוק שוב בקרוב",
	    FEED_TIMEOUT_MESSAGE: ".בבקשה נסה שוב בקרוב",
	  },
	  hi: {
	    NO_CARDS_MESSAGE:
	      "हमारे पास कोई अपडेट नहीं हैं। कृपया बाद में फिर से जाँच करें.।",
	    FEED_TIMEOUT_MESSAGE: "कृपया बाद में दोबारा प्रयास करें।.",
	  },
	  id: {
	    NO_CARDS_MESSAGE: "Kami tidak memiliki pembaruan. Coba lagi nanti.",
	    FEED_TIMEOUT_MESSAGE: "Coba lagi nanti.",
	  },
	  it: {
	    NO_CARDS_MESSAGE: "Non ci sono aggiornamenti.<br/>Ricontrollare più tardi.",
	    FEED_TIMEOUT_MESSAGE: "Riprovare più tardi.",
	  },
	  ja: {
	    NO_CARDS_MESSAGE:
	      "アップデートはありません。<br/>後でもう一度確認してください。",
	    FEED_TIMEOUT_MESSAGE: "後でもう一度試してください。",
	  },
	  ko: {
	    NO_CARDS_MESSAGE: "업데이트가 없습니다. 다음에 다시 확인해 주십시오.",
	    FEED_TIMEOUT_MESSAGE: "나중에 다시 시도해 주십시오.",
	  },
	  ms: {
	    NO_CARDS_MESSAGE: "Tiada kemas kini. Sila periksa kemudian.",
	    FEED_TIMEOUT_MESSAGE: "Sila cuba kemudian.",
	  },
	  nl: {
	    NO_CARDS_MESSAGE: "Er zijn geen updates.<br/>Probeer het later opnieuw.",
	    FEED_TIMEOUT_MESSAGE: "Probeer het later opnieuw.",
	  },
	  no: {
	    NO_CARDS_MESSAGE:
	      "Vi har ingen oppdateringer.<br/>Vennligst sjekk igjen senere.",
	    FEED_TIMEOUT_MESSAGE: "Vennligst prøv igjen senere.",
	  },
	  pl: {
	    NO_CARDS_MESSAGE:
	      "Brak aktualizacji.<br/>Proszę sprawdzić ponownie później.",
	    FEED_TIMEOUT_MESSAGE: "Proszę spróbować ponownie później.",
	  },
	  pt: {
	    NO_CARDS_MESSAGE:
	      "Não temos atualizações.<br/>Por favor, verifique mais tarde.",
	    FEED_TIMEOUT_MESSAGE: "Por favor, tente mais tarde.",
	  },
	  "pt-br": {
	    NO_CARDS_MESSAGE:
	      "Não temos nenhuma atualização.<br/>Verifique novamente mais tarde.",
	    FEED_TIMEOUT_MESSAGE: "Tente novamente mais tarde.",
	  },
	  ru: {
	    NO_CARDS_MESSAGE:
	      "Обновления недоступны.<br/>Пожалуйста, проверьте снова позже.",
	    FEED_TIMEOUT_MESSAGE: "Пожалуйста, повторите попытку позже.",
	  },
	  sv: {
	    NO_CARDS_MESSAGE: "Det finns inga uppdateringar.<br/>Försök igen senare.",
	    FEED_TIMEOUT_MESSAGE: "Försök igen senare.",
	  },
	  th: {
	    NO_CARDS_MESSAGE: "เราไม่มีการอัพเดต กรุณาตรวจสอบภายหลัง.",
	    FEED_TIMEOUT_MESSAGE: "กรุณาลองใหม่ภายหลัง.",
	  },
	  uk: {
	    NO_CARDS_MESSAGE:
	      "Оновлення недоступні.<br/>ласка, перевірте знову пізніше.",
	    FEED_TIMEOUT_MESSAGE: "Будь ласка, спробуйте ще раз пізніше.",
	  },
	  vi: {
	    NO_CARDS_MESSAGE:
	      "Chúng tôi không có cập nhật nào.<br/>Vui lòng kiểm tra lại sau.",
	    FEED_TIMEOUT_MESSAGE: "Vui lòng thử lại sau.",
	  },
	  "zh-hk": {
	    NO_CARDS_MESSAGE: "暫時沒有更新.<br/>請稍候再試.",
	    FEED_TIMEOUT_MESSAGE: "請稍候再試.",
	  },
	  "zh-hans": {
	    NO_CARDS_MESSAGE: "暂时没有更新.<br/>请稍后再试.",
	    FEED_TIMEOUT_MESSAGE: "请稍候再试.",
	  },
	  "zh-hant": {
	    NO_CARDS_MESSAGE: "暫時沒有更新.<br/>請稍候再試.",
	    FEED_TIMEOUT_MESSAGE: "請稍候再試.",
	  },
	  "zh-tw": {
	    NO_CARDS_MESSAGE: "暫時沒有更新.<br/>請稍候再試.",
	    FEED_TIMEOUT_MESSAGE: "請稍候再試.",
	  },
	  zh: {
	    NO_CARDS_MESSAGE: "暂时没有更新.<br/>请稍后再试.",
	    FEED_TIMEOUT_MESSAGE: "请稍候再试.",
	  },
	};

	class mr {
	  constructor(t, e = !1) {
	    if (
	      ((this.language = t),
	      null != t && (t = t.toLowerCase()),
	      null != t && null == zt[t])
	    ) {
	      const e = t.indexOf("-");
	      e > 0 && (t = t.substring(0, e));
	    }
	    if (null == zt[t]) {
	      const a =
	        "Braze does not yet have a localization for language " +
	        t +
	        ", defaulting to English. Please contact us if you are willing and able to help us translate our SDK into this language.";
	      e ? E$1.error(a) : E$1.info(a), (t = "en");
	    }
	    this.language = t;
	  }
	  get(t) {
	    return zt[this.language][t];
	  }
	  Ta() {
	    switch (this.language) {
	      case "ar":
	      case "he":
	      case "fa":
	        return "rtl";
	      default:
	        return "ltr";
	    }
	  }
	}

	const Me = {
	  i: !1,
	  na: null,
	  ra: () => {
	    if ((Me.t(), !Me.na)) {
	      let e = ro.language,
	        t = !1;
	      r.re(D.Wa) && ((e = r.re(D.Wa)), (t = !0)), (Me.na = new mr(e, t));
	    }
	    return Me.na;
	  },
	  t: () => {
	    Me.i || (r.g(Me), (Me.i = !0));
	  },
	  destroy: () => {
	    (Me.na = null), (Me.i = !1);
	  },
	};

	function showInAppMessage(e, t, s) {
	  if (!r.rr()) return;
	  if ((setupInAppMessageUI(), null == e)) return !1;
	  if (e instanceof ControlMessage)
	    return (
	      E$1.info(
	        "User received control for a multivariate test, logging to Braze servers.",
	      ),
	      logInAppMessageImpression(e),
	      !0
	    );
	  if (!(e instanceof InAppMessage)) return !1;
	  if (e.constructor === InAppMessage) return !1;
	  e.Lh();
	  const o = e instanceof HtmlMessage;
	  if (o && !e.trusted && !r.nr())
	    return (
	      E$1.error(
	        'HTML in-app messages are disabled. Use the "allowUserSuppliedJavascript" option for braze.initialize to enable these messages.',
	      ),
	      !1
	    );
	  if ((null == t && (t = document.body), e.zo())) {
	    if (t.querySelectorAll(".ab-modal-interactions").length > 0)
	      return (
	        E$1.info(
	          `Cannot show in-app message ${e.message} because another message is being shown.`,
	        ),
	        !1
	      );
	  }
	  if (WindowUtils.Ua()) {
	    const t = WindowUtils.Ma();
	    if (
	      (t === ORIENTATION.PORTRAIT &&
	        e.orientation === InAppMessage.Orientation.LANDSCAPE) ||
	      (t === ORIENTATION.LANDSCAPE &&
	        e.orientation === InAppMessage.Orientation.PORTRAIT)
	    ) {
	      const s = t === ORIENTATION.PORTRAIT ? "portrait" : "landscape",
	        o =
	          e.orientation === InAppMessage.Orientation.PORTRAIT
	            ? "portrait"
	            : "landscape";
	      return (
	        E$1.info(
	          `Not showing ${o} in-app message ${e.message} because the screen is currently ${s}`,
	        ),
	        !1
	      );
	    }
	  }
	  if (!r.nr()) {
	    let t = !1;
	    if (e.buttons && e.buttons.length > 0) {
	      const s = e.buttons;
	      for (let e = 0; e < s.length; e++)
	        if (s[e].clickAction === InAppMessage.ClickAction.URI) {
	          const o = s[e].uri;
	          t = isURIJavascriptOrData(o);
	        }
	    } else e.clickAction === InAppMessage.ClickAction.URI && (t = isURIJavascriptOrData(e.uri));
	    if (t)
	      return (
	        E$1.error(
	          'Javascript click actions are disabled. Use the "allowUserSuppliedJavascript" option for braze.initialize to enable these actions.',
	        ),
	        !1
	      );
	  }
	  const i = document.createElement("div");
	  if (
	    ((i.className = "ab-iam-root v3"),
	    (i.className += be(e)),
	    e.language && !o && (i.lang = e.language),
	    e._o() && (i.id = e.htmlId),
	    r.re(D.$a) && (i.style.zIndex = (r.re(D.$a) + 1).toString()),
	    t.appendChild(i),
	    e.Mo())
	  ) {
	    const t = document.createElement("style");
	    (t.innerHTML = e.css),
	      (t.id = e.Oo()),
	      null != r.re(D.er) && t.setAttribute("nonce", r.re(D.er)),
	      document.getElementsByTagName("head")[0].appendChild(t);
	  }
	  const n = e instanceof SlideUpMessage,
	    a = $e(
	      e,
	      (t) => {
	        if (e.zo() && e.od()) {
	          const s = document.createElement("div");
	          if (
	            ((s.className = "ab-page-blocker"),
	            e.Mo() || (s.style.backgroundColor = toRgba(e.frameColor)),
	            r.re(D.$a) && (s.style.zIndex = r.re(D.$a).toString()),
	            i.appendChild(s),
	            !r.re(D.Oh))
	          ) {
	            const o = new Date().valueOf();
	            s.onclick = (s) => {
	              new Date().valueOf() - o > InAppMessage.bh &&
	                (e.ll(t), s.stopPropagation());
	            };
	          }
	          i.appendChild(t), t.focus(), e.ah(i);
	        } else if (n) {
	          const s = document.querySelectorAll(".ab-slideup");
	          let o = null;
	          for (let e = s.length - 1; e >= 0; e--)
	            if (s[e] !== t) {
	              o = s[e];
	              break;
	            }
	          if (e.slideFrom === InAppMessage.SlideFrom.TOP) {
	            let e = 0;
	            null != o && (e = o.offsetTop + o.offsetHeight),
	              (t.style.top = Math.max(e, 0) + "px");
	          } else {
	            let e = 0;
	            null != o &&
	              (e =
	                (window.innerHeight || document.documentElement.clientHeight) -
	                o.offsetTop),
	              (t.style.bottom = Math.max(e, 0) + "px");
	          }
	        } else if (o && !r.re(D.Oh)) {
	          const s = e;
	          isIFrame(t) &&
	            t.contentWindow &&
	            t.contentWindow.addEventListener("keydown", function (e) {
	              e.keyCode === KeyCodes.Ih && s.closeMessage();
	            });
	        }
	        logInAppMessageImpression(e),
	          e.dismissType === InAppMessage.DismissType.AUTO_DISMISS &&
	            setTimeout(() => {
	              i.contains(t) && e.ll(t);
	            }, e.duration),
	          "function" == typeof s && s();
	      },
	      (e) => {
	        E$1.info(e);
	      },
	      r.re(D.Ja),
	      r.re(D.$a),
	      r.re(D.er),
	      t,
	      Me.ra().Ta(),
	    );
	  return (o || n) && (i.appendChild(a), e.ah(i)), !0;
	}

	function subscribeToInAppMessage(n) {
	  if (r.rr())
	    return "function" != typeof n
	      ? null
	      : je$1.ra().Tn(function (r) {
	          return n(r[0]), r.slice(1);
	        });
	}

	function automaticallyShowInAppMessages() {
	  if (!r.rr()) return;
	  setupInAppMessageUI();
	  const s = je$1.ra();
	  if (null == s.kn()) {
	    const r = subscribeToInAppMessage((s) => showInAppMessage(s));
	    s.Dn(r);
	  }
	  return s.kn();
	}

	function deferInAppMessage(e) {
	  if (r.rr())
	    return e instanceof ControlMessage
	      ? (E$1.info("Not deferring since this is a ControlMessage."), !1)
	      : e instanceof InAppMessage
	      ? je$1.ra().fn(e)
	      : (E$1.info("Not an instance of InAppMessage, ignoring."), !1);
	}

	function getDeferredInAppMessage() {
	  if (r.rr()) return je$1.ra().sa();
	}

	class ea {
	  constructor(t, e, s, i) {
	    (this.j = t),
	      (this.C = e),
	      (this.B = s),
	      (this.vs = i),
	      (this.j = t),
	      (this.C = e),
	      (this.B = s),
	      (this.vs = i),
	      (this.jn = new m()),
	      r.q(this.jn),
	      (this.vn = 1e3),
	      (this.yn = 6e4),
	      (this.bn = null),
	      (this.In = null),
	      (this.Mn = null);
	  }
	  An() {
	    return this.jn;
	  }
	  Tn(t) {
	    return this.jn.Rt(t);
	  }
	  kn() {
	    return this.bn;
	  }
	  Dn(t) {
	    this.bn = t;
	  }
	  lt(t, e, s, i) {
	    const r = new H();
	    let n;
	    if (e === f.wn || t instanceof ControlMessage) {
	      if (!t.Wt())
	        return (
	          E$1.info(
	            "This in-app message has already received an impression. Ignoring analytics event.",
	          ),
	          r
	        );
	    } else if (e === f.zn || (t instanceof HtmlMessage && e === f.Sn)) {
	      if (!t.$t(i))
	        return (
	          E$1.info(
	            "This in-app message has already received a click. Ignoring analytics event.",
	          ),
	          r
	        );
	    }
	    return (
	      (n =
	        t instanceof ControlMessage
	          ? { trigger_ids: [t.triggerId] }
	          : this.Bn(t)),
	      null == n
	        ? r
	        : (t.messageExtras && (n.message_extras = t.messageExtras),
	          null != s && (n.bid = s),
	          v$1.lt(e, n))
	    );
	  }
	  Rn(t, e) {
	    const s = new H();
	    if (!t.$t())
	      return (
	        E$1.info(
	          "This in-app message button has already received a click. Ignoring analytics event.",
	        ),
	        s
	      );
	    const i = this.Bn(e);
	    return null == i
	      ? s
	      : t.id === InAppMessageButton._n
	      ? (E$1.info(
	          "This in-app message button does not have a tracking id. Not logging event to Braze servers.",
	        ),
	        s)
	      : (null != t.id && (i.bid = t.id), v$1.lt(f.Sn, i));
	  }
	  qn(t) {
	    const e = t.messageFields;
	    return (null != e && e.is_push_primer) || !1;
	  }
	  xn(t) {
	    if (!(t instanceof InAppMessage)) return;
	    const e = (t) => {
	      if (!t) return;
	      const e = getDecodedBrazeAction(t);
	      if (containsUnknownBrazeAction(e)) return ineligibleBrazeActionURLErrorMessage(INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES.Pn, "In-App Message");
	      if (containsPushPrimerBrazeAction(e)) {
	        const t = vt$1.En();
	        if (!t.Gn) return vt$1.Nn(t.reason, "In-App Message");
	      }
	    };
	    if (this.qn(t)) {
	      const t = vt$1.En();
	      if (!t.Gn) return vt$1.Nn(t.reason, "In-App Message");
	    }
	    const s = t.buttons || [];
	    let i;
	    for (const t of s)
	      if (
	        t.clickAction === InAppMessage.ClickAction.URI &&
	        t.uri &&
	        BRAZE_ACTION_URI_REGEX.test(t.uri) &&
	        ((i = e(t.uri)), i)
	      )
	        return i;
	    return t.clickAction === InAppMessage.ClickAction.URI &&
	      t.uri &&
	      BRAZE_ACTION_URI_REGEX.test(t.uri)
	      ? e(t.uri)
	      : void 0;
	  }
	  $n(t, e) {
	    e !== this.Mn && this.Cn(), (this.In = t), (this.Mn = e);
	  }
	  Cn() {
	    null != this.In &&
	      (clearTimeout(this.In), (this.In = null), (this.Mn = null));
	  }
	  Fn(t, e, s, i) {
	    const r = this.j;
	    if (!r) return;
	    this.Mn && t.triggerId !== this.Mn && (this.Cn(), h.fi(this.B, h.H.On));
	    const n = r.Xn(!1),
	      o = r.$(n);
	    (o.template = { trigger_id: t.triggerId, trigger_event_type: e }),
	      null != s && (o.template.data = s.Hn());
	    const u = r.A(o, h.H.On);
	    r.J(
	      o,
	      (r = -1) => {
	        const n = this.j;
	        if (!n) return;
	        const m = new Date().valueOf();
	        h.K(this.B, h.H.On, m),
	          -1 !== r && u.push(["X-Braze-Req-Tokens-Remaining", r.toString()]);
	        let c,
	          p,
	          f = !1;
	        l.O({
	          url: `${n.V()}/template/`,
	          data: o,
	          headers: u,
	          W: (e) => {
	            if (!n.Y(o, e, u))
	              return void ("function" == typeof t.Jn && t.Jn());
	            if ((n.Z(), null == e || null == e.templated_message)) return;
	            const s = e.templated_message;
	            if (s.type !== pt.Ln.Kn) return;
	            const i = newInAppMessageFromJson(s.data);
	            if (null == i) return;
	            const r = this.xn(i);
	            if (r)
	              return E$1.error(r), void ("function" == typeof t.Jn && t.Jn());
	            "function" == typeof t.Qn && t.Qn(i);
	          },
	          error: (e) => {
	            (f = !0),
	              (c = e),
	              (p = `getting user personalization for message ${t.triggerId}.`);
	          },
	          tt: (r, o) => {
	            if (new Date().valueOf() - t.Un < t.Vn) {
	              let r = 0;
	              if (f) {
	                const e = Math.min(t.Vn, this.yn),
	                  s = this.vn;
	                null == i && (i = s), (r = Math.min(e, randomInclusive(s, 3 * i)));
	              }
	              n.et(
	                o,
	                () => {
	                  this.Fn(t, e, s, r);
	                },
	                h.H.On,
	                (e) => this.$n(e, t.triggerId),
	                () => this.Cn(),
	                r,
	              );
	            }
	            f && n._(c, p);
	          },
	        });
	      },
	      h.H.On,
	    );
	  }
	  Bn(t) {
	    if (null == t.triggerId)
	      return (
	        E$1.info(
	          "The in-app message has no analytics id. Not logging event to Braze servers.",
	        ),
	        null
	      );
	    const e = {};
	    return null != t.triggerId && (e.trigger_ids = [t.triggerId]), e;
	  }
	  fn(t) {
	    return (
	      !!this.B &&
	      !(
	        !(t && t instanceof InAppMessage && t.constructor !== InAppMessage) ||
	        t instanceof ControlMessage
	      ) &&
	      this.B.bt(STORAGE_KEYS.ft.Wn, t.gt())
	    );
	  }
	  sa() {
	    if (!this.B) return null;
	    const t = this.B.dt(STORAGE_KEYS.ft.Wn);
	    if (!t) return null;
	    let e;
	    switch (t.type) {
	      case InAppMessage.Eo.Yn:
	        e = FullScreenMessage.Zn(t);
	        break;
	      case InAppMessage.Eo.Zo:
	      case InAppMessage.Eo.Bo:
	      case InAppMessage.Eo.Yo:
	        e = HtmlMessage.Zn(t);
	        break;
	      case InAppMessage.Eo.ta:
	      case InAppMessage.Eo.Xo:
	        e = ModalMessage.Zn(t);
	        break;
	      case InAppMessage.Eo.ia:
	        e = SlideUpMessage.Zn(t);
	    }
	    return e && this.oa(), e;
	  }
	  oa() {
	    this.B && this.B.zt(STORAGE_KEYS.ft.Wn);
	  }
	}

	const je = {
	  na: null,
	  i: !1,
	  ra: () => (
	    je.t(), je.na || (je.na = new ea(r.m(), r.u(), r.p(), r.ir())), je.na
	  ),
	  t: () => {
	    je.i || (r.g(je), (je.i = !0));
	  },
	  destroy: () => {
	    (je.na = null), (je.i = !1);
	  },
	};
	var je$1 = je;

	class wt {
	  constructor(t, s, i, h, l) {
	    (this.triggerId = t),
	      (this.Qn = s),
	      (this.Jn = i),
	      (this.Un = h),
	      (this.Vn = l),
	      (this.triggerId = t),
	      (this.Qn = s),
	      (this.Jn = i),
	      (this.Un = h),
	      (this.Vn = l);
	  }
	  static fromJson(t, s, i, h, l) {
	    return null == t || null == t.trigger_id
	      ? null
	      : new wt(t.trigger_id, s, i, h, l);
	  }
	}

	class gr extends t {
	  constructor(t, i, s, e, r) {
	    super(),
	      (this.tg = t),
	      (this.ws = i),
	      (this.B = s),
	      (this.Ru = e),
	      (this.ig = r),
	      (this.tg = t),
	      (this.ws = i),
	      (this.B = s),
	      (this.Ru = e),
	      (this.ig = r),
	      (this.sg = []),
	      (this.eg = []),
	      (this.hg = null),
	      (this.ng = {}),
	      (this.og = {}),
	      (this.triggers = []),
	      (this.lg = 0),
	      this.ag(),
	      this.gg();
	  }
	  fg() {
	    if (this.B) {
	      (this.hg = this.B.dt(STORAGE_KEYS.ft.iE) || this.hg),
	        (this.ng = this.B.dt(STORAGE_KEYS.ft.EE) || this.ng),
	        (this.og = this.B.dt(STORAGE_KEYS.ft.aE) || this.og);
	      for (let t = 0; t < this.triggers.length; t++) {
	        const i = this.triggers[t];
	        i.id && null != this.og[i.id] && i.zd(this.og[i.id]);
	      }
	    }
	  }
	  ag() {
	    if (!this.B) return;
	    this.lg = this.B.dt(STORAGE_KEYS.ft.nE) || 0;
	    const t = this.B.dt(STORAGE_KEYS.ft.oE) || [],
	      i = [];
	    for (let s = 0; s < t.length; s++) i.push(pt._u(t[s]));
	    (this.triggers = i), this.fg();
	  }
	  gg() {
	    const t = this,
	      i = function (i, s, e, r, h) {
	        return function () {
	          t.cg(i, s, e, r, h);
	        };
	      },
	      e = {};
	    for (const t of this.triggers) t.id && (e[t.id] = t);
	    let r = !1;
	    for (let t = 0; t < this.triggers.length; t++) {
	      const s = this.triggers[t];
	      if (s.id && null != this.ng[s.id]) {
	        const t = this.ng[s.id],
	          h = [];
	        for (let r = 0; r < t.length; r++) {
	          const n = t[r],
	            o = s.Md(n.Un || 0);
	          if (o > 0) {
	            let t, r;
	            h.push(n),
	              null != n.ug && (t = n.ug),
	              null != n.dg && De.gE(n.dg) && (r = De._u(n.dg));
	            const l = [];
	            if (n.pg && isArray(n.pg))
	              for (let t = 0; t < n.pg.length; t++) {
	                const i = e[n.pg[t]];
	                null != i && l.push(i);
	              }
	            this.eg.push(window.setTimeout(i(s, n.Un || 0, t, r, l), o));
	          }
	        }
	        this.ng[s.id].length > h.length &&
	          ((this.ng[s.id] = h),
	          (r = !0),
	          0 === this.ng[s.id].length && delete this.ng[s.id]);
	      }
	    }
	    r && this.B && this.B.bt(STORAGE_KEYS.ft.EE, this.ng);
	  }
	  mg() {
	    if (!this.B) return;
	    const t = [];
	    for (let i = 0; i < this.triggers.length; i++)
	      t.push(this.triggers[i].gt());
	    (this.lg = new Date().valueOf()),
	      this.B.bt(STORAGE_KEYS.ft.oE, t),
	      this.B.bt(STORAGE_KEYS.ft.nE, this.lg);
	  }
	  bg() {
	    if (!this.B) return;
	    (this.B.dt(STORAGE_KEYS.ft.nE) || 0) > this.lg ? this.ag() : this.fg();
	  }
	  N(t) {
	    let i = !1;
	    if (null != t && t.triggers) {
	      this.ig.oa(), this.fg();
	      const e = {},
	        r = {};
	      this.triggers = [];
	      for (let s = 0; s < t.triggers.length; s++) {
	        const h = pt.fromJson(t.triggers[s]);
	        if (h) {
	          h.id &&
	            null != this.og[h.id] &&
	            (h.zd(this.og[h.id]), (e[h.id] = this.og[h.id])),
	            h.id && null != this.ng[h.id] && (r[h.id] = this.ng[h.id]);
	          for (let t = 0; t < h.Pd.length; t++)
	            if (h.Pd[t].km(ot.qs, null)) {
	              i = !0;
	              break;
	            }
	          this.triggers.push(h);
	        }
	      }
	      isEqual(this.og, e) || ((this.og = e), this.B && this.B.bt(STORAGE_KEYS.ft.aE, this.og)),
	        isEqual(this.ng, r) ||
	          ((this.ng = r), this.B && this.B.bt(STORAGE_KEYS.ft.EE, this.ng)),
	        this.mg(),
	        i &&
	          (E$1.info("Trigger with test condition found, firing test."),
	          this.he(ot.qs)),
	        this.he(ot.OPEN);
	      const h = this.sg;
	      let n;
	      this.sg = [];
	      for (let t = 0; t < h.length; t++)
	        (n = Array.prototype.slice.call(h[t])), this.he(...n);
	    }
	  }
	  cg(t, i, s, e, r) {
	    const h = (e) => {
	        this.fg();
	        const r = new Date().valueOf();
	        t.Bd(i) ||
	          (!1 === navigator.onLine && t.type === pt.Ln.Kn && e.imageUrl
	            ? E$1.info(
	                `Not showing ${t.type} trigger action ${t.id} due to offline state.`,
	              )
	            : t.xd(r) && this.wg(t, r, s)
	            ? 0 === this.ws.De()
	              ? E$1.info(
	                  `Not displaying trigger ${t.id} because neither automaticallyShowInAppMessages() nor subscribeToInAppMessage() were called.`,
	                )
	              : (this.ws.L([e]), this.yg(t, r))
	            : E$1.info(
	                `Not displaying trigger ${t.id} because display time fell outside of the acceptable time window.`,
	              ));
	      },
	      n = () => {
	        this.fg();
	        const h = r.pop();
	        if (null != h)
	          if ((this.Tg(h, i, s, e, r), h.Bd(i))) {
	            let t = `Server aborted in-app message display, but the timeout on fallback trigger ${h.id} has already elapsed.`;
	            r.length > 0 && (t += " Continuing to fall back."), E$1.info(t), n();
	          } else {
	            E$1.info(
	              `Server aborted in-app message display. Falling back to lower priority ${h.type} trigger action ${t.id}.`,
	            );
	            const n = 1e3 * h.Ed - (new Date().valueOf() - i);
	            n > 0
	              ? this.eg.push(
	                  window.setTimeout(() => {
	                    this.cg(h, i, s, e, r);
	                  }, n),
	                )
	              : this.cg(h, i, s, e, r);
	          }
	      };
	    let o, l, a;
	    switch (t.type) {
	      case pt.Ln.Kn:
	        if (((o = newInAppMessageFromJson(t.data)), null == o)) {
	          E$1.error(
	            `Could not parse trigger data for trigger ${t.id}, ignoring.`,
	          );
	          break;
	        }
	        if (((l = this.ig.xn(o)), l)) {
	          E$1.error(l), n();
	          break;
	        }
	        h(o);
	        break;
	      case pt.Ln.Cd:
	        if (((a = wt.fromJson(t.data, h, n, i, t.Vn || 0)), null == a)) {
	          E$1.error(
	            `Could not parse trigger data for trigger ${t.id}, ignoring.`,
	          );
	          break;
	        }
	        this.ig.Fn(a, s, e);
	        break;
	      default:
	        E$1.error(`Trigger ${t.id} was of unexpected type ${t.type}, ignoring.`);
	    }
	  }
	  he(t, i = null, s) {
	    if (!validateValueIsFromEnum(ot, t, "Cannot fire trigger action.", "TriggerEvents")) return;
	    if (this.Ru && this.Ru.vd())
	      return (
	        E$1.info(
	          "Trigger sync is currently in progress, awaiting sync completion before firing trigger event.",
	        ),
	        void this.sg.push(arguments)
	      );
	    this.bg();
	    const e = new Date().valueOf(),
	      r = e - (this.hg || 0);
	    let h = !0,
	      n = !0;
	    const o = [];
	    for (let s = 0; s < this.triggers.length; s++) {
	      const r = this.triggers[s],
	        l = e + 1e3 * r.Ed;
	      if (
	        r.xd(l) &&
	        (null == r.startTime || r.startTime.valueOf() <= e) &&
	        (null == r.endTime || r.endTime.valueOf() >= e)
	      ) {
	        let s = !1;
	        for (let e = 0; e < r.Pd.length; e++)
	          if (r.Pd[e].km(t, i)) {
	            s = !0;
	            break;
	          }
	        s && ((h = !1), this.wg(r, l, t) && ((n = !1), o.push(r)));
	      }
	    }
	    if (h)
	      return void E$1.info(
	        `Trigger event ${t} did not match any trigger conditions.`,
	      );
	    if (n)
	      return void E$1.info(
	        `Ignoring ${t} trigger event because a trigger was displayed ${
          r / 1e3
        }s ago.`,
	      );
	    o.sort((t, i) => t.priority - i.priority);
	    const l = o.pop();
	    null != l &&
	      (E$1.info(
	        `Firing ${l.type} trigger action ${l.id} from trigger event ${t}.`,
	      ),
	      this.Tg(l, e, t, s, o),
	      0 === l.Ed
	        ? this.cg(l, e, t, s, o)
	        : this.eg.push(
	            window.setTimeout(() => {
	              this.cg(l, e, t, s, o);
	            }, 1e3 * l.Ed),
	          ));
	  }
	  changeUser(t = !1) {
	    if (((this.triggers = []), this.B && this.B.zt(STORAGE_KEYS.ft.oE), !t)) {
	      (this.sg = []), (this.hg = null), (this.og = {}), (this.ng = {});
	      for (let t = 0; t < this.eg.length; t++) clearTimeout(this.eg[t]);
	      (this.eg = []),
	        this.B && (this.B.zt(STORAGE_KEYS.ft.iE), this.B.zt(STORAGE_KEYS.ft.aE), this.B.zt(STORAGE_KEYS.ft.EE));
	    }
	  }
	  clearData() {
	    (this.triggers = []), (this.hg = null), (this.og = {}), (this.ng = {});
	    for (let t = 0; t < this.eg.length; t++) clearTimeout(this.eg[t]);
	    this.eg = [];
	  }
	  wg(t, i, s) {
	    if (null == this.hg) return !0;
	    if (s === ot.qs)
	      return (
	        E$1.info(
	          "Ignoring minimum interval between trigger because it is a test type.",
	        ),
	        !0
	      );
	    let e = t._d;
	    return null == e && (e = this.tg), i - this.hg >= 1e3 * e;
	  }
	  Tg(t, i, e, r, h) {
	    this.fg(), t.id && (this.ng[t.id] = this.ng[t.id] || []);
	    const n = {};
	    let o;
	    (n.Un = i), (n.ug = e), null != r && (o = r.gt()), (n.dg = o);
	    const l = [];
	    for (const t of h) t.id && l.push(t.id);
	    (n.pg = l),
	      t.id && this.ng[t.id].push(n),
	      this.B && this.B.bt(STORAGE_KEYS.ft.EE, this.ng);
	  }
	  yg(t, i) {
	    this.fg(),
	      t.zd(i),
	      (this.hg = i),
	      t.id && (this.og[t.id] = i),
	      this.B && (this.B.bt(STORAGE_KEYS.ft.iE, i), this.B.bt(STORAGE_KEYS.ft.aE, this.og));
	  }
	}

	const TriggersProviderFactory = {
	  i: !1,
	  provider: null,
	  o: () => (
	    TriggersProviderFactory.t(),
	    TriggersProviderFactory.provider || TriggersProviderFactory.rg(),
	    TriggersProviderFactory.provider
	  ),
	  rg: () => {
	    if (!TriggersProviderFactory.provider) {
	      const i = r.re(D.Xh);
	      (TriggersProviderFactory.provider = new gr(
	        null != i ? i : 30,
	        je$1.ra().An(),
	        r.p(),
	        r.nn(),
	        je$1.ra(),
	      )),
	        r.v(TriggersProviderFactory.provider);
	    }
	  },
	  t: () => {
	    TriggersProviderFactory.i ||
	      (TriggersProviderFactory.rg(),
	      r.g(TriggersProviderFactory),
	      (TriggersProviderFactory.i = !0));
	  },
	  destroy: () => {
	    (TriggersProviderFactory.provider = null), (TriggersProviderFactory.i = !1);
	  },
	};

	const MAX_RETRIES = 5;
	function buildSseUrl(t, e, n, o, r) {
	  const c = /^https?:\/\//i.test(t) ? t : `https://${t}`;
	  let p = `mite=${encodeURIComponent(e)}&attempts=${n}`;
	  return (
	    o && (p += `&auth=${encodeURIComponent(o)}`),
	    r && (p += `&rcs=${encodeURIComponent(r)}`),
	    `${c}/sse?${p}`
	  );
	}

	const DUST_SHARED_WORKER_CODE =
	  '\n"use strict";\nconst workerSelf = self;\nlet eventSource = null;\nlet currentConfig = null;\nlet retryCount = 0;\nlet retryTimeoutId = null;\nlet connectionInProgress = false;\nconst maxRetries = 5;\nconst connectedPorts = new Map();\nlet lastSleepMs = null;\nlet currentRcs = null;\nlet ttlTimeoutId = null;\nlet leaderPortId = null;\nlet ddrTimeoutId = null;\nconst fn = {\n    startConnection: null,\n    handleMessage: null,\n};\nfunction broadcast(message) {\n    connectedPorts.forEach((portInfo, portId) => {\n        try {\n            portInfo.port.postMessage(message);\n        }\n        catch (_a) {\n            connectedPorts.delete(portId);\n        }\n    });\n}\nfunction randomInclusive(min, max) {\n    return Math.floor(Math.random() * (max - min + 1)) + min;\n}\nfunction electLeader() {\n    if (leaderPortId && connectedPorts.has(leaderPortId)) {\n        return;\n    }\n    const firstPortId = connectedPorts.keys().next().value;\n    leaderPortId = firstPortId || null;\n    if (leaderPortId) {\n        console.log("[Braze Real-Time] Elected leader port:", leaderPortId);\n    }\n}\nfunction promoteToLeader(portId) {\n    if (connectedPorts.has(portId) && leaderPortId !== portId) {\n        leaderPortId = portId;\n        console.log("[Braze Real-Time] Promoted to leader (tab became active):", portId);\n    }\n}\nfunction sendToLeader(message) {\n    electLeader();\n    if (!leaderPortId) {\n        console.warn("[Braze Real-Time] No leader to send message to");\n        return;\n    }\n    const leader = connectedPorts.get(leaderPortId);\n    if (leader) {\n        try {\n            leader.port.postMessage(message);\n        }\n        catch (_a) {\n            connectedPorts.delete(leaderPortId);\n            leaderPortId = null;\n            sendToLeader(message);\n        }\n    }\n}\nfunction closeConnection() {\n    connectionInProgress = false;\n    if (retryTimeoutId !== null) {\n        clearTimeout(retryTimeoutId);\n        retryTimeoutId = null;\n    }\n    if (ttlTimeoutId !== null) {\n        clearTimeout(ttlTimeoutId);\n        ttlTimeoutId = null;\n    }\n    if (ddrTimeoutId !== null) {\n        clearTimeout(ddrTimeoutId);\n        ddrTimeoutId = null;\n    }\n    if (eventSource) {\n        eventSource.close();\n        eventSource = null;\n        broadcast({ type: "disconnected" });\n    }\n}\nfunction retryWithBackoff() {\n    if (!currentConfig) {\n        return;\n    }\n    retryCount++;\n    const { minSleepMs, maxSleepMs, scaleFactor } = currentConfig.backoff;\n    let previousSleepMs = lastSleepMs;\n    if (previousSleepMs == null || previousSleepMs < minSleepMs) {\n        previousSleepMs = minSleepMs;\n    }\n    const backoffMs = Math.min(maxSleepMs, randomInclusive(minSleepMs, previousSleepMs * scaleFactor));\n    lastSleepMs = backoffMs;\n    console.log("[Braze Real-Time] Retrying in " + backoffMs + "ms (attempt " + retryCount + "/" + maxRetries + ")");\n    retryTimeoutId = setTimeout(function () {\n        retryTimeoutId = null;\n        fn.startConnection();\n    }, backoffMs);\n}\nfunction startConnection(oldEventSourceToClose) {\n    if (!currentConfig) {\n        return;\n    }\n    if (eventSource && !oldEventSourceToClose) {\n        console.warn("[Braze Real-Time] Connection already exists");\n        return;\n    }\n    if (connectionInProgress && !oldEventSourceToClose) {\n        console.warn("[Braze Real-Time] Connection attempt already in progress");\n        return;\n    }\n    connectionInProgress = true;\n    const { dustHost, mite, auth } = currentConfig;\n    const dustHostWithScheme = /^https?:\\/\\//i.test(dustHost) ? dustHost : "https://" + dustHost;\n    let queryString = "mite=" + encodeURIComponent(mite) + "&attempts=" + retryCount;\n    if (auth) {\n        queryString += "&auth=" + encodeURIComponent(auth);\n    }\n    if (currentRcs) {\n        queryString += "&rcs=" + encodeURIComponent(currentRcs);\n    }\n    const subscribeUrl = dustHostWithScheme + "/sse?" + queryString;\n    try {\n        const newEventSource = new EventSource(subscribeUrl);\n        newEventSource.onopen = function () {\n            if (oldEventSourceToClose) {\n                console.log("[Braze Real-Time] Gapless reconnection: new connection established, closing old connection");\n                oldEventSourceToClose.close();\n            }\n            else {\n                console.log("[Braze Real-Time] Connection established");\n            }\n            eventSource = newEventSource;\n            connectionInProgress = false;\n            retryCount = 0;\n            lastSleepMs = null;\n            broadcast({ type: "connected" });\n        };\n        newEventSource.addEventListener("msg", function (event) {\n            fn.handleMessage(event.data);\n        });\n        newEventSource.onerror = function () {\n            const readyState = newEventSource ? newEventSource.readyState : -1;\n            if (readyState === 0) {\n                console.log("[Braze Real-Time] Failed to connect");\n            }\n            else {\n                console.log("[Braze Real-Time] Connection lost");\n            }\n            if (oldEventSourceToClose && eventSource !== newEventSource) {\n                console.log("[Braze Real-Time] Gapless reconnection failed, keeping old connection");\n                newEventSource.close();\n                connectionInProgress = false;\n                if (retryCount < maxRetries) {\n                    retryWithBackoff();\n                }\n                return;\n            }\n            closeConnection();\n            if (retryCount < maxRetries) {\n                retryWithBackoff();\n            }\n            else {\n                console.error("[Braze Real-Time] Max retries reached");\n                broadcast({ type: "error", error: "Max retry attempts reached" });\n            }\n        };\n    }\n    catch (error) {\n        connectionInProgress = false;\n        console.error("[Braze Real-Time] Failed to create EventSource:", error);\n        broadcast({ type: "error", error: String(error) });\n    }\n}\nfunction handleTtlMessage(tMs, rcs) {\n    if (typeof tMs !== "number") {\n        return;\n    }\n    if (typeof rcs === "string") {\n        currentRcs = rcs;\n    }\n    console.log("[Braze Real-Time] TTL set to " + tMs + "ms, will perform gapless reconnection when expired");\n    if (ttlTimeoutId !== null) {\n        clearTimeout(ttlTimeoutId);\n    }\n    ttlTimeoutId = setTimeout(function () {\n        ttlTimeoutId = null;\n        console.log("[Braze Real-Time] TTL expired, performing gapless reconnection");\n        startConnection(eventSource || undefined);\n    }, tMs);\n}\nfunction handleDdrMessage(rMs, reason) {\n    if (typeof rMs !== "number") {\n        return;\n    }\n    const jitter = Math.random() * rMs * 0.3;\n    const waitMs = Math.round(rMs + jitter);\n    const reasonStr = reason ? " (" + reason + ")" : "";\n    console.log("[Braze Real-Time] Admin requested disconnect" + reasonStr + ", reconnecting in " + waitMs + "ms");\n    if (ddrTimeoutId !== null) {\n        clearTimeout(ddrTimeoutId);\n    }\n    closeConnection();\n    ddrTimeoutId = setTimeout(function () {\n        ddrTimeoutId = null;\n        fn.startConnection();\n    }, waitMs);\n}\nfunction handleMessage(data) {\n    try {\n        const message = JSON.parse(data);\n        if (!message.type) {\n            console.warn("[Braze Real-Time] Message without type:", message);\n            return;\n        }\n        if (message.type === "ttl" && message.body) {\n            handleTtlMessage(message.body.t_ms, message.body.rcs);\n            return;\n        }\n        if (message.type === "ddr" && message.body) {\n            handleDdrMessage(message.body.r_ms, message.body.e);\n            return;\n        }\n        console.log("[Braze Real-Time] Routing \'" + message.type + "\' message to leader");\n        sendToLeader({ type: "message", data: message });\n    }\n    catch (error) {\n        console.warn("[Braze Real-Time] Failed to parse message:", error);\n    }\n}\nfn.startConnection = startConnection;\nfn.handleMessage = handleMessage;\nfunction handlePortMessage(port, portId, message) {\n    switch (message.type) {\n        case "connect":\n            if (currentConfig &&\n                (currentConfig.mite !== message.config.mite || currentConfig.dustHost !== message.config.dustHost)) {\n                console.log("[Braze Real-Time] Config changed, reconnecting");\n                closeConnection();\n                retryCount = 0;\n                lastSleepMs = null;\n                currentRcs = null;\n            }\n            currentConfig = message.config;\n            electLeader();\n            if (!eventSource && !connectionInProgress) {\n                startConnection();\n            }\n            else if (eventSource) {\n                port.postMessage({ type: "connected" });\n            }\n            break;\n        case "disconnect":\n            connectedPorts.delete(portId);\n            if (portId === leaderPortId) {\n                leaderPortId = null;\n                electLeader();\n            }\n            if (connectedPorts.size === 0) {\n                console.log("[Braze Real-Time] No more ports, closing connection");\n                closeConnection();\n                currentConfig = null;\n                currentRcs = null;\n                leaderPortId = null;\n            }\n            break;\n        case "tab_active":\n            promoteToLeader(portId);\n            break;\n        case "ping":\n            port.postMessage({ type: "pong" });\n            break;\n        default:\n            console.warn("[Braze Real-Time] Unknown message type:", message.type);\n    }\n}\nworkerSelf.onconnect = function (event) {\n    const port = event.ports[0];\n    const portId = "port-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);\n    connectedPorts.set(portId, { port: port });\n    port.onmessage = function (messageEvent) {\n        try {\n            handlePortMessage(port, portId, messageEvent.data);\n        }\n        catch (error) {\n            console.error("[Braze Real-Time] Error handling message:", error);\n        }\n    };\n    port.onmessageerror = function () {\n        console.warn("[Braze Real-Time] Message error from port:", portId);\n        connectedPorts.delete(portId);\n    };\n    port.start();\n};\n';

	function isSharedWorkerSupported() {
	  return "undefined" != typeof SharedWorker;
	}
	class DustWorkerBridge {
	  constructor(i) {
	    (this.Wr = null),
	      (this.Lr = null),
	      (this.isConnected = !1),
	      (this.Ir = null),
	      (this.Mr = null),
	      (this.we = i.we),
	      (this.ke = i.ke),
	      (this.Re = i.Re),
	      (this.Me = i.Me);
	  }
	  initialize() {
	    if (!isSharedWorkerSupported())
	      return (
	        E$1.info("SharedWorker not supported, will use direct connection"), !1
	      );
	    try {
	      const i = new Blob([DUST_SHARED_WORKER_CODE], { type: "application/javascript" });
	      return (
	        (this.Lr = URL.createObjectURL(i)),
	        (this.Wr = new SharedWorker(this.Lr, { name: "braze-dust-worker" })),
	        (this.Wr.port.onmessage = (i) => {
	          this.Br(i.data);
	        }),
	        (this.Wr.port.onmessageerror = () => {
	          E$1.warn("Message error from real-time messaging worker");
	        }),
	        (this.Wr.onerror = (i) => {
	          var e;
	          E$1.error(
	            `Real-time messaging worker error: ${i.message || "unknown error"}`,
	          ),
	            null === (e = this.Me) ||
	              void 0 === e ||
	              e.call(this, "SharedWorker error");
	        }),
	        this.Wr.port.start(),
	        this.Ur(),
	        this.Vr(),
	        E$1.info("Real-time messaging worker initialized"),
	        !0
	      );
	    } catch (i) {
	      return (
	        E$1.error(
	          `Failed to create real-time messaging worker: ${
            i instanceof Error ? i.message : String(i)
          }`,
	        ),
	        this.Er(),
	        !1
	      );
	    }
	  }
	  Br(i) {
	    var e, t, s;
	    switch (i.type) {
	      case "connected":
	        E$1.info("Real-time messaging connection established via SharedWorker"),
	          (this.isConnected = !0),
	          null === (e = this.ke) || void 0 === e || e.call(this);
	        break;
	      case "disconnected":
	        E$1.info("Real-time messaging connection closed via SharedWorker"),
	          (this.isConnected = !1),
	          null === (t = this.Re) || void 0 === t || t.call(this);
	        break;
	      case "message":
	        this.we(i.data);
	        break;
	      case "error":
	        E$1.error(`Real-time messaging error: ${i.error}`),
	          null === (s = this.Me) || void 0 === s || s.call(this, i.error);
	    }
	  }
	  Ur() {
	    this.Ir = window.setInterval(() => {
	      this.Wr && this._r({ type: "ping" });
	    }, 3e4);
	  }
	  qr() {
	    null !== this.Ir && (window.clearInterval(this.Ir), (this.Ir = null));
	  }
	  Vr() {
	    (this.Mr = () => {
	      "visible" === document.visibilityState &&
	        this.Wr &&
	        this._r({ type: "tab_active" });
	    }),
	      document.addEventListener("visibilitychange", this.Mr);
	  }
	  Ar() {
	    this.Mr &&
	      (document.removeEventListener("visibilitychange", this.Mr),
	      (this.Mr = null));
	  }
	  _r(i) {
	    this.Wr && this.Wr.port.postMessage(i);
	  }
	  connect(i) {
	    this.Wr
	      ? (this._r({ type: "connect", pn: i }),
	        E$1.info("Connecting to real-time messaging"))
	      : E$1.error("Cannot connect: real-time messaging worker not initialized");
	  }
	  disconnect() {
	    this.Wr &&
	      (this._r({ type: "disconnect" }),
	      (this.isConnected = !1),
	      E$1.info("Disconnecting from real-time messaging"));
	  }
	  Ie() {
	    return this.isConnected;
	  }
	  isInitialized() {
	    return null !== this.Wr;
	  }
	  Er() {
	    this.qr(),
	      this.Ar(),
	      this.Wr && (this.Wr.port.close(), (this.Wr = null)),
	      this.Lr && (URL.revokeObjectURL(this.Lr), (this.Lr = null)),
	      (this.isConnected = !1);
	  }
	  destroy() {
	    this.disconnect(),
	      this.Er(),
	      E$1.info("Real-time messaging worker destroyed");
	  }
	}

	class tr extends t {
	  constructor(i, t, s, e, n = !0) {
	    super(),
	      (this.j = i),
	      (this.B = t),
	      (this.h = s),
	      (this.j = i),
	      (this.B = t),
	      (this.h = s),
	      (this.mite = null),
	      (this.ki = null),
	      (this.yi = null),
	      (this.$i = null),
	      (this.Ri = e || null),
	      (this.Mi = null),
	      (this.xi = null),
	      (this.D = null),
	      (this.ji = 0),
	      (this.Wi = MAX_RETRIES),
	      (this.Fi = null),
	      (this.Ui = null),
	      (this.zi = !0),
	      (this.Bi = null),
	      (this.Gi = null),
	      (this.Pi = null),
	      (this.qi = null),
	      (this.Hi = !1),
	      (this.Ji = new Map()),
	      (this.Li = null),
	      (this.Oi = null),
	      (this.Ki = null),
	      (this.Qi = this.Vi(n)),
	      (this.Xi = !1),
	      (this.Yi = 0),
	      this.Zi();
	  }
	  Vi(i) {
	    return i
	      ? isSharedWorkerSupported()
	        ? "sharedworker"
	        : (E$1.info(
	            "SharedWorker not supported, using direct EventSource (multi-tab will gracefully degrade)",
	          ),
	          "direct")
	      : (E$1.info("Shared connection disabled, using direct EventSource"),
	        "direct");
	  }
	  _i() {
	    this.Ki = new DustWorkerBridge({
	      we: (i) => {
	        this.Se(i);
	      },
	      ke: () => {
	        this.ye();
	      },
	      Re: () => {},
	      Me: (i) => {
	        E$1.error(`Real-time messaging SharedWorker error: ${i}`);
	      },
	    });
	    this.Ki.initialize() ||
	      (E$1.info(
	        "SharedWorker initialization failed, falling back to direct EventSource",
	      ),
	      (this.Qi = "direct"),
	      (this.Ki = null));
	  }
	  ye() {
	    (this.ji = 0),
	      (this.Bi = null),
	      (this.zi = !0),
	      (this.Xi = !1),
	      (this.Yi = 0);
	  }
	  Se(i) {
	    if (!i.type)
	      return void E$1.warn(
	        `Received real-time message without type: ${JSON.stringify(i)}`,
	      );
	    const t = "sharedworker" === this.Qi ? "SharedWorker" : "Direct";
	    E$1.info(`Received real-time message of type '${i.type}' via ${t}`);
	    const s = this.Ji.get(i.type);
	    if (s && s.De() > 0)
	      try {
	        s.L(i);
	      } catch (t) {
	        E$1.error(
	          `Error invoking subscription for message type '${i.type}': ${t}`,
	        );
	      }
	    else E$1.info(`No subscribers for real-time message type '${i.type}'`);
	  }
	  We() {
	    return "sharedworker" === this.Qi;
	  }
	  Fe() {
	    return this.Qi;
	  }
	  Zi() {
	    if (this.B) {
	      const i = this.B.dt(STORAGE_KEYS.ft.Ue),
	        t = this.B.dt(STORAGE_KEYS.ft.Ne),
	        e = this.B.dt(STORAGE_KEYS.ft.Te),
	        n = this.B.dt(STORAGE_KEYS.ft.ze);
	      i && t
	        ? ((this.mite = i),
	          (this.ki = t),
	          (this.yi = e),
	          (this.$i = n),
	          E$1.info("Restored real-time messaging configuration from storage"))
	        : (i || t) &&
	          (E$1.warn(
	            "Incomplete real-time messaging configuration in storage, clearing",
	          ),
	          this.Ae());
	    }
	  }
	  Hr() {
	    this.Li ||
	      this.Oi ||
	      ((this.Li = this.Be("ddr", (i) => {
	        if (!i.body || "number" != typeof i.body.Ge) return;
	        const t = Math.random() * i.body.Ge * 0.3,
	          s = Math.round(i.body.Ge + t),
	          e = i.body.e ? ` (${i.body.e})` : "";
	        E$1.info(`Admin requested disconnect${e}, reconnecting in ${s}ms`),
	          this.Pe(),
	          setTimeout(() => this.qe(), s);
	      })),
	      (this.Oi = this.Be("ttl", (i) => {
	        if (!i.body || "number" != typeof i.body.He) return;
	        const t = i.body.He;
	        E$1.info(`Time to live set to ${t}ms, will reconnect when expired`),
	          "sharedworker" !== this.Qi &&
	            ("string" == typeof i.body.Je && (this.Mi = i.body.Je),
	            null !== this.Ui && window.clearTimeout(this.Ui),
	            (this.Ui = window.setTimeout(() => {
	              (this.Ui = null),
	                E$1.info("Time to live expired, performing gapless reconnection"),
	                this.Le();
	            }, t)));
	      })));
	  }
	  Oe() {
	    this.Gi ||
	      this.Pi ||
	      ((this.qi = () => {
	        (this.Hi = !0), (this.zi = !1);
	      }),
	      window.addEventListener("beforeunload", this.qi),
	      (this.Gi = () => {
	        var i;
	        this.Hi = !0;
	        (this.xi ||
	          (null === (i = this.Ki) || void 0 === i ? void 0 : i.Ie())) &&
	          (E$1.info("Page unloading, closing real-time connection gracefully"),
	          (this.zi = !1),
	          this.Pe());
	      }),
	      window.addEventListener("pagehide", this.Gi),
	      (this.Pi = (i) => {
	        var t;
	        const s =
	          this.xi || (null === (t = this.Ki) || void 0 === t ? void 0 : t.Ie());
	        i.persisted &&
	          this.Ke() &&
	          !s &&
	          (E$1.info("Page restored from bfcache, reconnecting"),
	          (this.Hi = !1),
	          this.ye(),
	          this.qe());
	      }),
	      window.addEventListener("pageshow", this.Pi));
	  }
	  St() {
	    return this.D;
	  }
	  wt(i) {
	    this.D = i;
	  }
	  Be(i, t) {
	    if ("function" != typeof t) return null;
	    let s = this.Ji.get(i);
	    return s || ((s = new m()), this.Ji.set(i, s), r.q(s)), s.Rt(t);
	  }
	  Qe(i, t) {
	    const s = this.Ji.get(i);
	    s && s.removeSubscription(t);
	  }
	  Ke() {
	    return Boolean(this.mite && this.ki);
	  }
	  Ve() {
	    if (!this.$i) return !1;
	    return Math.floor(new Date().valueOf() / 1e3) >= this.$i;
	  }
	  Ae() {
	    (this.mite = null),
	      (this.ki = null),
	      (this.yi = null),
	      (this.$i = null),
	      (this.Mi = null),
	      this.B &&
	        (this.B.zt(STORAGE_KEYS.ft.Ue),
	        this.B.zt(STORAGE_KEYS.ft.Ne),
	        this.B.zt(STORAGE_KEYS.ft.Te),
	        this.B.zt(STORAGE_KEYS.ft.ze));
	  }
	  Xe(i, t) {
	    const e = () => {
	        "function" == typeof t && t();
	      },
	      n = this.j,
	      r = this.B;
	    if (!n || !r)
	      return (
	        E$1.error("NetworkManager or StorageManager not available"), void e()
	      );
	    if (!this.h || !this.h.Ye())
	      return (
	        E$1.info("Real-time messaging is not enabled, skipping refresh"), void e()
	      );
	    this.Ke()
	      ? E$1.info("Refreshing real-time messaging configuration")
	      : E$1.info("Fetching initial real-time messaging configuration");
	    const o = n.$({}, !0),
	      a = n.A(o, h.H.Ze, !1),
	      c = new Date().valueOf();
	    h.K(r, h.H.Ze, c),
	      l.O({
	        url: `${n.V()}/dust/config`,
	        headers: a,
	        data: o,
	        W: (t) => {
	          if (!n.Y(o, t, a))
	            return (
	              E$1.error(
	                "Failed to validate server response for real-time messaging configuration",
	              ),
	              void e()
	            );
	          n.Z(),
	            t.mite && t.host
	              ? ((this.mite = t.mite),
	                (this.ki = t.host),
	                (this.yi = t.auth || null),
	                (this.$i = t.expiration || null),
	                E$1.info(
	                  "Received real-time messaging configuration from server",
	                ),
	                r.bt(STORAGE_KEYS.ft.Ue, t.mite),
	                r.bt(STORAGE_KEYS.ft.Ne, t.host),
	                t.auth ? r.bt(STORAGE_KEYS.ft.Te, t.auth) : r.zt(STORAGE_KEYS.ft.Te),
	                t.expiration ? r.bt(STORAGE_KEYS.ft.ze, t.expiration) : r.zt(STORAGE_KEYS.ft.ze),
	                this.qe(),
	                "function" == typeof i && i())
	              : (E$1.info(
	                  "Real-time messaging configuration not available - this SDK version may not be supported",
	                ),
	                this.Ae(),
	                e());
	        },
	        error: (i) => {
	          n._(i, "retrieving DUST config"), e();
	        },
	      });
	  }
	  qe() {
	    if (!this.h || !this.h.Ye()) return;
	    if (!this.Ke())
	      return void E$1.error(
	        "Cannot start real-time subscription without configuration",
	      );
	    if (this.Ve())
	      return (
	        E$1.info(
	          "Real-time messaging auth token has expired, refreshing configuration",
	        ),
	        void this.Xe(
	          () => {
	            this.qe();
	          },
	          () => {
	            E$1.error(
	              "Failed to refresh expired real-time messaging configuration",
	            );
	          },
	        )
	      );
	    const i = this.mite,
	      t = this.Ri || this.ki;
	    if (i && t)
	      switch (this.Qi) {
	        case "sharedworker":
	          this._e(i, t);
	          break;
	        case "direct":
	          this.xi &&
	            (E$1.info(
	              "Real-time connection already exists, closing before starting new subscription",
	            ),
	            this.Pe()),
	            this.sn();
	      }
	  }
	  en() {
	    const i = this.mite,
	      t = this.Ri || this.ki;
	    return i && t
	      ? buildSseUrl(t, i, this.ji, this.yi || void 0, this.Mi || void 0)
	      : null;
	  }
	  _e(i, t) {
	    var s, e, n;
	    if ((this.Ki || this._i(), !this.Ki))
	      return (
	        E$1.info(
	          "SharedWorker initialization failed, falling back to direct EventSource",
	        ),
	        (this.Qi = "direct"),
	        void this.on()
	      );
	    this.Ri && E$1.info(`Using custom real-time messaging host: ${this.Ri}`),
	      E$1.info("Starting real-time subscription via SharedWorker");
	    const r = (null === (s = this.h) || void 0 === s ? void 0 : s.st()) || REQUEST_BACKOFF_MIN_SLEEP_MS_DEFAULT,
	      o = (null === (e = this.h) || void 0 === e ? void 0 : e.nt()) || REQUEST_BACKOFF_MAX_SLEEP_MS_DEFAULT,
	      h = (null === (n = this.h) || void 0 === n ? void 0 : n.it()) || REQUEST_BACKOFF_SCALE_FACTOR_DEFAULT;
	    this.Ki.connect({
	      mite: i,
	      ki: t,
	      auth: this.yi || void 0,
	      hn: { an: r, ln: o, cn: h },
	    });
	  }
	  on() {
	    this.xi &&
	      (E$1.info(
	        "Real-time connection already exists, closing before starting new subscription",
	      ),
	      this.un()),
	      this.sn();
	  }
	  sn(i) {
	    const t = this.en();
	    if (t) {
	      this.Ri && E$1.info(`Using custom real-time messaging host: ${this.Ri}`);
	      try {
	        const s = new EventSource(t);
	        (s.onopen = () => {
	          i
	            ? (E$1.info(
	                "Gapless reconnection: new connection established, closing old connection",
	              ),
	              i.close())
	            : E$1.info("Real-time messaging connection established"),
	            (this.xi = s),
	            (this.ji = 0),
	            (this.Bi = null),
	            (this.zi = !0),
	            (this.Xi = !0);
	        }),
	          s.addEventListener("msg", (i) => {
	            this.dn(i.data);
	          }),
	          (s.onerror = () => {
	            const t = s.readyState;
	            return (
	              this.Hi ||
	                (0 === t
	                  ? E$1.info("Real-time messaging failed to connect")
	                  : E$1.info("Real-time messaging connection lost")),
	              i && this.xi !== s
	                ? (E$1.info(
	                    "Gapless reconnection failed, keeping old connection",
	                  ),
	                  s.close(),
	                  void (this.zi && this.ji < this.Wi && this.gn()))
	                : (this.un(),
	                  this.Xi && (this.Yi++, this.Yi > 1)
	                    ? (E$1.info(
	                        "Real-time messaging connection lost twice after successful connect (likely multi-tab conflict), yielding to other tab",
	                      ),
	                      void (this.zi = !1))
	                    : void (this.zi && this.ji < this.Wi
	                        ? this.gn()
	                        : (this.ji >= this.Wi &&
	                            E$1.error(
	                              `Max retry attempts (${this.Wi}) reached for real-time messaging, giving up for current session`,
	                            ),
	                          (this.zi = !1))))
	            );
	          });
	      } catch (i) {
	        E$1.error(
	          `Failed to create real-time messaging connection: ${
            i instanceof Error ? i.message : String(i)
          }`,
	        );
	      }
	    }
	  }
	  gn() {
	    var i, t, s;
	    this.ji++;
	    const e = (null === (i = this.h) || void 0 === i ? void 0 : i.st()) || REQUEST_BACKOFF_MIN_SLEEP_MS_DEFAULT,
	      n = (null === (t = this.h) || void 0 === t ? void 0 : t.it()) || REQUEST_BACKOFF_SCALE_FACTOR_DEFAULT,
	      r = (null === (s = this.h) || void 0 === s ? void 0 : s.nt()) || REQUEST_BACKOFF_MAX_SLEEP_MS_DEFAULT;
	    let o = this.Bi;
	    (null == o || o < e) && (o = e);
	    const h = Math.min(r, randomInclusive(e, o * n));
	    (this.Bi = h),
	      E$1.info(
	        `Retrying real-time messaging connection in ${h}ms (attempt ${this.ji}/${this.Wi})`,
	      ),
	      (this.Fi = window.setTimeout(() => {
	        (this.Fi = null), this.qe();
	      }, h));
	  }
	  Le() {
	    if (this.Ke()) {
	      if (this.Ve())
	        return (
	          E$1.info(
	            "Auth token expired during gapless reconnection, falling back to regular reconnection",
	          ),
	          this.Pe(),
	          void this.qe()
	        );
	      null !== this.Ui && (window.clearTimeout(this.Ui), (this.Ui = null)),
	        this.sn(this.xi || void 0);
	    } else E$1.error("Cannot perform gapless reconnection without configuration");
	  }
	  Pe() {
	    var i;
	    switch (this.Qi) {
	      case "sharedworker":
	        null === (i = this.Ki) || void 0 === i || i.disconnect();
	        break;
	      case "direct":
	        this.un();
	    }
	  }
	  un() {
	    null !== this.Fi && (window.clearTimeout(this.Fi), (this.Fi = null)),
	      null !== this.Ui && (window.clearTimeout(this.Ui), (this.Ui = null)),
	      this.xi &&
	        (this.xi.close(),
	        (this.xi = null),
	        E$1.info("Real-time messaging connection closed"));
	  }
	  dn(i) {
	    try {
	      const t = JSON.parse(i);
	      this.Se(t);
	    } catch (i) {
	      E$1.warn(
	        `Failed to parse real-time message: ${
          i instanceof Error ? i.message : String(i)
        }`,
	      );
	    }
	  }
	  changeUser(i = !1) {
	    this.Pe(),
	      i ||
	        (this.Ke() &&
	          E$1.info(
	            "Clearing cached real-time messaging configuration for user change",
	          ),
	        this.Ae()),
	      this.ye();
	  }
	  clearData(i = !1) {
	    (this.zi = !1),
	      this.Pe(),
	      i &&
	        (this.Ke() &&
	          E$1.info(
	            "Clearing cached real-time messaging configuration (wipeData)",
	          ),
	        this.Ae()),
	      this.ye();
	  }
	  destroy() {
	    (this.zi = !1),
	      this.Pe(),
	      this.Ae(),
	      this.Ki && (this.Ki.destroy(), (this.Ki = null)),
	      this.Li && (this.Qe("ddr", this.Li), (this.Li = null)),
	      this.Oi && (this.Qe("ttl", this.Oi), (this.Oi = null)),
	      this.qi &&
	        (window.removeEventListener("beforeunload", this.qi), (this.qi = null)),
	      this.Gi &&
	        (window.removeEventListener("pagehide", this.Gi), (this.Gi = null)),
	      this.Pi &&
	        (window.removeEventListener("pageshow", this.Pi), (this.Pi = null)),
	      this.D && (r.removeSubscription(this.D), (this.D = null));
	  }
	}

	const nr = {
	  i: !1,
	  provider: null,
	  o: () => {
	    if ((nr.t(), !nr.provider)) {
	      const t = r.re("dustHost");
	      (nr.provider = new tr(r.m(), r.p(), r.l(), t)),
	        r.v(nr.provider),
	        nr.provider.Hr();
	    }
	    return nr.provider;
	  },
	  t: () => {
	    nr.i || (r.g(nr), (nr.i = !0));
	  },
	  destroy: () => {
	    nr.provider && nr.provider.destroy(), (nr.provider = null), (nr.i = !1);
	  },
	};

	function subscribeToDust() {
	  const t = r.l(),
	    n = r.nn();
	  if (!t || !n) return null;
	  const o = nr.o(),
	    s = () => {
	      if (!o.St()) {
	        o.Oe();
	        const r = n.rn(() => {
	          t.Ye() && o.Xe();
	        });
	        return r && o.wt(r), o.Ke() && o.qe(), r;
	      }
	      return o.St();
	    };
	  return (
	    t.Tr(() => {
	      r.ao() && (t.Ye() ? (o.Xe(), s()) : (o.Pe(), o.Ke() && o.Ae()));
	    }),
	    t.Ye() ? s() : null
	  );
	}

	class oi {
	  constructor(t, i, s, l, h) {
	    (this.endpoint = t),
	      (this.Wu = i),
	      (this.publicKey = s),
	      (this.Yc = l),
	      (this.xc = h),
	      (this.endpoint = t || null),
	      (this.Wu = i || null),
	      (this.publicKey = s || null),
	      (this.Yc = l || null),
	      (this.xc = h || null);
	  }
	  gt() {
	    return {
	      e: this.endpoint,
	      c: this.Wu,
	      p: this.publicKey,
	      u: this.Yc,
	      v: this.xc,
	    };
	  }
	  static _u(t) {
	    return new oi(t.e, rehydrateDateAfterJsonization(t.c), t.p, t.u, t.v);
	  }
	}

	class bt {
	  constructor(t, s) {
	    (this.h = t), (this.B = s), (this.h = t), (this.B = s);
	  }
	  getUserId() {
	    const t = this.B.$u(STORAGE_KEYS.Ou.Cu);
	    if (null == t) return null;
	    let i = t.Tu,
	      e = getByteLength(i);
	    if (e > User.mr) {
	      for (; e > User.mr; ) (i = i.slice(0, i.length - 1)), (e = getByteLength(i));
	      (t.Tu = i), this.B.Iu(STORAGE_KEYS.Ou.Cu, t);
	    }
	    return i;
	  }
	  Ju(t) {
	    const i = null == this.getUserId();
	    this.B.Iu(STORAGE_KEYS.Ou.Cu, new _t(t)), i && this.B.Lu(t);
	  }
	  setCustomUserAttribute(t, s) {
	    if (this.h.qu(t))
	      return (
	        E$1.info('Custom Attribute "' + t + '" is blocklisted, ignoring.'), !1
	      );
	    const i = {};
	    return (i[t] = s), this.zu(User.Bu, i, !0);
	  }
	  zu(t, s, i = !1, e = !1) {
	    const u = this.B.Eu(this.getUserId(), t, s);
	    let o = "",
	      r = t,
	      h = s;
	    return (
	      i &&
	        ((o = " custom"),
	        "object" == typeof s &&
	          ((r = Object.keys(s)[0]),
	          (h = s[r]),
	          "object" == typeof h && (h = JSON.stringify(h, null, 2)))),
	      !e && u && E$1.info(`Logged${o} attribute ${r} with value ${h}`),
	      u
	    );
	  }
	  gu(t, i, e, u, o) {
	    this.zu("push_token", t, !1, !0),
	      this.zu("custom_push_public_key", e, !1, !0),
	      this.zu("custom_push_user_auth", u, !1, !0),
	      this.zu("custom_push_vapid_public_key", o, !1, !0);
	    const r = et.Us.Rs,
	      h = new et(r, E$1),
	      n = new oi(t, i, e, u, o);
	    this.B.bt(STORAGE_KEYS.ft.Uu, n.gt()), h.setItem(r.Fs.Fu, r.fe, !0);
	  }
	  wu(t) {
	    if (
	      (this.zu("push_token", null, !1, !0),
	      this.zu("custom_push_public_key", null, !1, !0),
	      this.zu("custom_push_user_auth", null, !1, !0),
	      this.zu("custom_push_vapid_public_key", null, !1, !0),
	      t)
	    ) {
	      const t = et.Us.Rs,
	        i = new et(t, E$1);
	      this.B.bt(STORAGE_KEYS.ft.Uu, !1), i.setItem(t.Fs.Fu, t.fe, !1);
	    }
	  }
	}

	const D = {
	  Ph: "allowCrawlerActivity",
	  Wh: "baseUrl",
	  Vh: "noCookies",
	  Kh: "devicePropertyAllowlist",
	  La: "disablePushTokenMaintenance",
	  $h: "enableLogging",
	  Yh: "enableSdkAuthentication",
	  Ka: "manageServiceWorkerExternally",
	  Xh: "minimumIntervalBetweenTriggerActionsInSeconds",
	  Zh: "sessionTimeoutInSeconds",
	  Qh: "appVersion",
	  Xa: "appVersionNumber",
	  Ga: "serviceWorkerLocation",
	  Ia: "safariWebsitePushId",
	  Wa: "localization",
	  er: "contentSecurityNonce",
	  te: "allowUserSuppliedJavascript",
	  $a: "inAppMessageZIndex",
	  Ja: "openInAppMessagesInNewTab",
	  tn: "openCardsInNewTab",
	  Oh: "requireExplicitInAppMessageDismissal",
	  Za: "doNotLoadFontAwesome",
	  tl: "deviceId",
	  Ha: "serviceWorkerScope",
	  Ne: "dustHost",
	  il: "sdkFlavor",
	};
	class qt {
	  constructor() {
	    (this.tu = ""),
	      (this.sl = ""),
	      (this.rl = void 0),
	      (this.hl = null),
	      (this.eu = null),
	      (this.j = null),
	      (this.Ru = null),
	      (this.h = null),
	      (this.C = null),
	      (this.B = null),
	      (this.vs = null),
	      (this.al = ""),
	      (this.isInitialized = !1),
	      (this.ul = !1),
	      (this.cl = new m()),
	      (this.fl = new m()),
	      (this.options = {}),
	      (this.ml = []),
	      (this.dl = []),
	      (this.jn = []),
	      (this.sl = "6.5.0");
	  }
	  El(t) {
	    this.cl.Rt(t);
	  }
	  mh(t) {
	    this.fl.Rt(t);
	  }
	  initialize(t, i) {
	    if (this.ao())
	      return E$1.info("Braze has already been initialized with an API key."), !0;
	    this.options = i || {};
	    let e = this.re(D.$h);
	    const r = parseQueryStringKeyValues(WindowUtils.gl());
	    if (
	      (r && "true" === r.brazeLogging && (e = !0),
	      E$1.init(e),
	      E$1.info(
	        `Initialization Options: ${JSON.stringify(this.options, null, 2)}`,
	      ),
	      null == t || "" === t || "string" != typeof t)
	    )
	      return E$1.error("Braze requires a valid API key to be initialized."), !1;
	    this.tu = t;
	    let o = this.re(D.Wh);
	    if (null == o || "" === o || "string" != typeof o)
	      return E$1.error("Braze requires a valid baseUrl to be initialized."), !1;
	    !1 === /^https?:/.test(o) && (o = `https://${o}`);
	    const n = o;
	    if (
	      ((o = document.createElement("a")),
	      (o.href = n),
	      "/" === o.pathname && (o = `${o}api/v3`),
	      (this.al = o.toString()),
	      ro.Il && !this.re(D.Ph))
	    )
	      return (
	        E$1.info("Ignoring activity from crawler bot " + navigator.userAgent),
	        (this.ul = !0),
	        !1
	      );
	    const h = this.re(D.Vh) || !1;
	    if (
	      ((this.B = Kt._l(t, h)), h && this.B.Sl(t), new ee.le(null, !0).jr(STORAGE_KEYS.pe))
	    )
	      return (
	        E$1.info("Ignoring all activity due to previous opt out"),
	        (this.ul = !0),
	        !1
	      );
	    for (const t of keys(this.options))
	      -1 === values($t).indexOf(t) &&
	        E$1.warn(`Ignoring unknown initialization option '${t}'.`);
	    const a = ["mparticle", "wordpress", "tealium"];
	    if (null != this.re(D.il)) {
	      const t = this.re(D.il);
	      -1 !== a.indexOf(t)
	        ? (this.rl = t)
	        : E$1.error("Invalid sdk flavor passed: " + t);
	    }
	    let l = this.re($t.Kh);
	    if (null != l)
	      if (isArray(l)) {
	        const t = [];
	        for (let i = 0; i < l.length; i++)
	          validateValueIsFromEnum(
	            DeviceProperties,
	            l[i],
	            "devicePropertyAllowlist contained an invalid value.",
	            "DeviceProperties",
	          ) && t.push(l[i]);
	        l = t;
	      } else
	        E$1.error(
	          "devicePropertyAllowlist must be an array. Defaulting to all properties.",
	        ),
	          (l = null);
	    const u = this.re(D.tl);
	    if (u) {
	      const t = new _t(u);
	      this.B.Iu(STORAGE_KEYS.Ou.tl, t);
	    }
	    (this.eu = new Ot(this.B, l)),
	      (this.h = new Bt(this.B)),
	      (this.vs = new bt(this.h, this.B)),
	      (this.C = new Vt(this.B, this.vs, this.h, this.re(D.Zh)));
	    const c = new m();
	    return (
	      (this.hl = new kt(this.B, this.re(D.Yh), c)),
	      this.q(c),
	      (this.j = new Mt(
	        this.eu,
	        this.B,
	        this.hl,
	        this.vs,
	        this.C,
	        this.h,
	        this.tu,
	        this.al,
	        this.sl,
	        this.rl || "",
	        this.re(D.Qh),
	        this.re(D.Xa),
	      )),
	      (this.Ru = new Wt(
	        this.tu,
	        this.al,
	        this.C,
	        this.eu,
	        this.vs,
	        this.h,
	        this.B,
	        (t) => {
	          if (this.ao()) for (const i of this.gr()) i.N(t);
	        },
	        this.hl,
	        this.j,
	      )),
	      this.Ru.initialize(),
	      h || this.B.Al(),
	      E$1.info(
	        `Initialized for the Braze backend at "${this.re(
          D.Wh,
        )}" with API key "${this.tu}".`,
	      ),
	      TriggersProviderFactory.t(),
	      subscribeToDust(),
	      this.h.jo(() => {
	        var t;
	        this.isInitialized &&
	          (null === (t = this.h) || void 0 === t ? void 0 : t.Yr()) &&
	          Promise.resolve().then(function () { return refreshFeatureFlags$1; }).then((t) => {
	            if (!this.isInitialized) return;
	            (0, t.default)();
	          });
	      }),
	      this.Ru.rn(() => {
	        var t;
	        this.isInitialized &&
	          (null === (t = this.h) || void 0 === t ? void 0 : t.Yr()) &&
	          Promise.resolve().then(function () { return refreshFeatureFlags$1; }).then((t) => {
	            if (!this.isInitialized) return;
	            (0, t.default)(void 0, void 0, !0);
	          });
	      }),
	      this.cl.L(this.options),
	      (this.isInitialized = !0),
	      window.dispatchEvent(new CustomEvent("braze.initialized")),
	      !0
	    );
	  }
	  destroy(t) {
	    if ((E$1.destroy(), this.ao())) {
	      this.fl.L(), this.fl.removeAllSubscriptions();
	      for (const t of this.ml) t.destroy();
	      this.ml = [];
	      for (const t of this.dl) t.clearData(!1);
	      this.j && this.j.fo(),
	        (this.dl = []),
	        this.removeAllSubscriptions(),
	        (this.jn = []),
	        null != this.Ru && this.Ru.destroy(),
	        (this.Ru = null),
	        (this.hl = null),
	        (this.eu = null),
	        (this.j = null),
	        (this.h = null),
	        (this.C = null),
	        (this.vs = null),
	        (this.options = {}),
	        (this.rl = void 0),
	        (this.isInitialized = !1),
	        (this.ul = !1),
	        t && (this.B = null);
	    }
	  }
	  rr() {
	    return !this.Nl() && (!!this.ao() || (console.warn(CoreStrings.ee), !1));
	  }
	  _a() {
	    return this.tu;
	  }
	  Sr() {
	    return this.hl;
	  }
	  V() {
	    return this.al;
	  }
	  ue() {
	    return this.eu;
	  }
	  m() {
	    return this.j;
	  }
	  re(t) {
	    return this.options[t];
	  }
	  gr() {
	    return this.dl;
	  }
	  nn() {
	    return this.Ru;
	  }
	  l() {
	    return this.h;
	  }
	  u() {
	    return this.C;
	  }
	  p() {
	    return this.B;
	  }
	  br() {
	    if (this.vs && this.Ru) return new User(this.vs, this.Ru);
	  }
	  ir() {
	    return this.vs;
	  }
	  nr() {
	    return !0 === this.re(D.te);
	  }
	  g(t) {
	    let i = !1;
	    for (const s of this.ml) s === t && (i = !0);
	    i || this.ml.push(t);
	  }
	  v(i) {
	    let s = !1;
	    for (const t of this.dl) t.constructor === i.constructor && (s = !0);
	    i instanceof t && !s && this.dl.push(i);
	  }
	  q(t) {
	    t instanceof m && this.jn.push(t);
	  }
	  removeAllSubscriptions() {
	    if (this.rr()) for (const t of this.jn) t.removeAllSubscriptions();
	  }
	  removeSubscription(t) {
	    if (this.rr()) for (const i of this.jn) i.removeSubscription(t);
	  }
	  ge(t) {
	    this.ul = t;
	  }
	  ao() {
	    return this.isInitialized;
	  }
	  Nl() {
	    return this.ul;
	  }
	  tr(t, i) {
	    if (!this.rr()) return null;
	    return nr.o().Be(t, i);
	  }
	  Vs() {
	    return this.sl;
	  }
	}
	const r = new qt();

	const v = {
	  lt: (e, o, t) => {
	    var n, s;
	    const i = new H(),
	      l = r.u();
	    if (!l)
	      return (
	        E$1.info(
	          `Not logging event with type "${e}" because the current session ID could not be found.`,
	        ),
	        i
	      );
	    const d = l.el();
	    return (
	      i.Ee.push(
	        new De(
	          t || (null === (n = r.ir()) || void 0 === n ? void 0 : n.getUserId()),
	          e,
	          new Date().valueOf(),
	          d,
	          o,
	        ),
	      ),
	      (i.W =
	        (null === (s = r.p()) || void 0 === s ? void 0 : s.ol(i.Ee)) || !1),
	      i
	    );
	  },
	};
	var v$1 = v;

	class M {
	  constructor(t) {
	    (this.B = t), (this.B = t);
	  }
	  logClick(t) {
	    const n = new H();
	    if ((t.$t(), null == t.url || "" === t.url))
	      return (
	        E$1.info(`Card ${t.id} has no url. Not logging click to Braze servers.`),
	        n
	      );
	    if (t.id && this.B) {
	      const n = this.B.dt(STORAGE_KEYS.ft.Jt) || {};
	      (n[t.id] = !0), this.B.bt(STORAGE_KEYS.ft.Jt, n);
	    }
	    const r = this.Kt([t]);
	    if (null == r) return n;
	    const i = f.Lt;
	    return v$1.lt(i, r);
	  }
	  Mt(t) {
	    const n = new H();
	    if (!t.Ot())
	      return (
	        E$1.info(
	          `Card ${t.id} refused this dismissal. Ignoring analytics event.`,
	        ),
	        n
	      );
	    if (t.id && this.B) {
	      const n = this.B.dt(STORAGE_KEYS.ft.Pt) || {};
	      (n[t.id] = !0), this.B.bt(STORAGE_KEYS.ft.Pt, n);
	    }
	    const r = this.Kt([t]);
	    return null == r ? n : v$1.lt(f.Qt, r);
	  }
	  Ut(t) {
	    const n = new H(!0),
	      r = [],
	      i = [];
	    let o = {};
	    this.B && (o = this.B.dt(STORAGE_KEYS.ft.Vt) || {});
	    for (const s of t) {
	      s.Wt()
	        ? (s instanceof ControlCard ? i.push(s) : r.push(s),
	          s.id && (o[s.id] = !0))
	        : E$1.info(
	            `Card ${s.id} logged an impression too recently. Ignoring analytics event.`,
	          );
	    }
	    const e = this.Kt(r),
	      l = this.Kt(i);
	    if (null == e && null == l) return (n.W = !1), n;
	    if ((this.B && this.B.bt(STORAGE_KEYS.ft.Vt, o), null != e)) {
	      const t = f.Xt,
	        s = v$1.lt(t, e);
	      n.Yt(s);
	    }
	    if (null != l) {
	      const t = v$1.lt(f.Zt, l);
	      n.Yt(t);
	    }
	    return n;
	  }
	  Kt(t) {
	    let s,
	      n = null;
	    for (let r = 0; r < t.length; r++)
	      (s = t[r].id),
	        null != s &&
	          "" !== s &&
	          ((n = n || {}), (n.ids = n.ids || []), n.ids.push(s));
	    return n;
	  }
	}

	const _ = {
	  i: !1,
	  na: null,
	  ra: () => (_.t(), _.na || (_.na = new M(r.p())), _.na),
	  t: () => {
	    _.i || (r.g(_), (_.i = !0));
	  },
	  destroy: () => {
	    (_.na = null), (_.i = !1);
	  },
	};
	var _$1 = _;

	const CardStrings = { _t: "must be a Card object" };

	function logCardDismissal(o) {
	  return (
	    !!r.rr() &&
	    (o instanceof Card ? _$1.ra().Mt(o).W : (E$1.error("card " + CardStrings._t), !1))
	  );
	}

	function logContentCardImpressions(o) {
	  if (!r.rr()) return !1;
	  if (!isArray(o)) return E$1.error("cards must be an array"), !1;
	  for (const r of o)
	    if (!(r instanceof Card)) return E$1.error(`Each card in cards ${CardStrings._t}`), !1;
	  return _$1.ra().Ut(o).W;
	}

	function logContentCardClick(o) {
	  return (
	    !!r.rr() &&
	    (o instanceof Card ? _$1.ra().logClick(o).W : (E$1.error("card " + CardStrings._t), !1))
	  );
	}

	function newCard(e, n, r, t, i, o, l, u, d, a, f, s, w, m, p, C, c, x) {
	  let j;
	  if (n === Card.es.oi || n === Card.es.ai)
	    j = new ClassicCard(e, r, t, i, o, l, u, d, a, f, s, w, m, p, c, x);
	  else if (n === Card.es.hs)
	    j = new CaptionedImage(e, r, t, i, o, l, u, d, a, f, s, w, m, p, c, x);
	  else if (n === Card.es.Ii)
	    j = new ImageOnly(e, r, i, l, u, d, f, s, w, m, p, c, x);
	  else {
	    if (n !== Card.es.Ni)
	      return E$1.error("Ignoring card with unknown type " + n), null;
	    j = new ControlCard(e, r, l, u, s, w);
	  }
	  return C && (j.test = C), j;
	}
	function newCardFromContentCardsJson(e) {
	  if (e[Card.ui.Ei]) return null;
	  const n = e[Card.ui.rs],
	    r = e[Card.ui.ts],
	    t = e[Card.ui.os],
	    i = e[Card.ui.cs],
	    o = e[Card.ui.ns],
	    l = e[Card.ui.ds],
	    u = dateFromUnixTimestamp(e[Card.ui.ps]);
	  let d;
	  d = e[Card.ui.us] === Card.Ti ? null : dateFromUnixTimestamp(e[Card.ui.us]);
	  return newCard(
	    n,
	    r,
	    t,
	    i,
	    o,
	    l,
	    u,
	    d,
	    e[Card.ui.URL],
	    e[Card.ui.ls],
	    e[Card.ui.fs],
	    e[Card.ui.xs],
	    e[Card.ui.bs],
	    e[Card.ui.gs],
	    e[Card.ui.js],
	    e[Card.ui.qs] || !1,
	    e[Card.ui.zs],
	    e[Card.ui.ks],
	  );
	}
	function newCardFromSerializedValue(e) {
	  return (
	    newCard(
	      e[Card.ss.rs],
	      e[Card.ss.ts],
	      e[Card.ss.os],
	      e[Card.ss.cs],
	      e[Card.ss.ns],
	      e[Card.ss.ds],
	      rehydrateDateAfterJsonization(e[Card.ss.ps]),
	      rehydrateDateAfterJsonization(e[Card.ss.us]),
	      e[Card.ss.URL],
	      e[Card.ss.ls],
	      e[Card.ss.fs],
	      e[Card.ss.xs],
	      e[Card.ss.bs],
	      e[Card.ss.gs],
	      e[Card.ss.js],
	      e[Card.ss.qs] || !1,
	      e[Card.ss.zs],
	      e[Card.ss.ks],
	    ) || void 0
	  );
	}

	class Z extends t {
	  constructor(t, s, i, e, h) {
	    super(),
	      (this.vs = t),
	      (this.B = s),
	      (this.h = i),
	      (this.Cs = e),
	      (this.j = h),
	      (this.vs = t),
	      (this.B = s),
	      (this.h = i),
	      (this.Cs = e),
	      (this.j = h),
	      (this.ws = new m()),
	      r.q(this.ws),
	      (this.ys = 0),
	      (this.Ss = 0),
	      (this.cards = []),
	      this.Ts();
	    const n = et.Us.Rs;
	    new et(n, E$1).Ds(n.Fs.As, (t) => {
	      this.Ls(t);
	    }),
	      (this.Ns = null),
	      (this.D = null),
	      (this.Js = null),
	      (this.Ms = null),
	      (this.$s = 10);
	  }
	  Bs() {
	    return this.Ns;
	  }
	  Es(t) {
	    this.Ns = t;
	  }
	  St() {
	    return this.D;
	  }
	  wt(t) {
	    this.D = t;
	  }
	  Ts() {
	    if (!this.B) return;
	    const t = this.B.dt(STORAGE_KEYS.ft.Ps) || [],
	      i = [];
	    for (let s = 0; s < t.length; s++) {
	      const e = newCardFromSerializedValue(t[s]);
	      null != e && i.push(e);
	    }
	    (this.cards = this.Xs(this._s(i, !1))),
	      (this.ys = this.B.dt(STORAGE_KEYS.ft.Gs) || this.ys),
	      (this.Ss = this.B.dt(STORAGE_KEYS.ft.Hs) || this.Ss);
	  }
	  Is(t, i = !1, e = 0, h = 0) {
	    let r;
	    if (i) {
	      r = [];
	      for (const t of this.cards) t.test && r.push(t);
	    } else r = this.cards.slice();
	    for (let s = 0; s < t.length; s++) {
	      const e = t[s];
	      let h = null;
	      for (let t = 0; t < this.cards.length; t++)
	        if (e.id === this.cards[t].id) {
	          h = this.cards[t];
	          break;
	        }
	      if (i) {
	        const t = newCardFromContentCardsJson(e);
	        null != h && h.viewed && t && (t.viewed = !0), null != t && r.push(t);
	      } else if (null == h) {
	        const t = newCardFromContentCardsJson(e);
	        null != t && r.push(t);
	      } else {
	        if (!h.ri(e))
	          for (let t = 0; t < r.length; t++)
	            if (e.id === r[t].id) {
	              r.splice(t, 1);
	              break;
	            }
	      }
	    }
	    (this.cards = this.Xs(this._s(r, i))),
	      this.Ks(),
	      (this.ys = e),
	      (this.Ss = h),
	      this.B && (this.B.bt(STORAGE_KEYS.ft.Gs, this.ys), this.B.bt(STORAGE_KEYS.ft.Hs, this.Ss));
	  }
	  N(t) {
	    if (this.Os() && null != t && t.cards) {
	      this.B && this.B.bt(STORAGE_KEYS.ft.Qs, r.Vs());
	      const i = t.full_sync;
	      i || this.Ts(),
	        this.Is(t.cards, i, t.last_full_sync_at, t.last_card_updated_at),
	        this.ws.L(this.Ws(!0));
	    }
	  }
	  Ys(t) {
	    this.Zs(), (this.Js = t);
	  }
	  Ls(t) {
	    var s;
	    if (!this.Os()) return;
	    this.Ts();
	    const i = this.cards.slice();
	    let e = null;
	    e = null === (s = this.vs) || void 0 === s ? void 0 : s.getUserId();
	    for (let s = 0; s < t.length; s++)
	      if (e === t[s].userId || (null == e && null == t[s].userId)) {
	        const e = t[s].card;
	        let h = null;
	        for (let t = 0; t < this.cards.length; t++)
	          if (e.id === this.cards[t].id) {
	            h = this.cards[t];
	            break;
	          }
	        if (null == h) {
	          const t = newCardFromContentCardsJson(e);
	          null != t && i.push(t);
	        } else {
	          if (!h.ri(e))
	            for (let t = 0; t < i.length; t++)
	              if (e.id === i[t].id) {
	                i.splice(t, 1);
	                break;
	              }
	        }
	      }
	    (this.cards = this.Xs(this._s(i, !1))), this.Ks(), this.ws.L(this.Ws(!0));
	  }
	  _s(t, i) {
	    let e = {},
	      h = {},
	      r = {};
	    this.B &&
	      ((e = this.B.dt(STORAGE_KEYS.ft.Jt) || {}),
	      (h = this.B.dt(STORAGE_KEYS.ft.Vt) || {}),
	      (r = this.B.dt(STORAGE_KEYS.ft.Pt) || {}));
	    const n = {},
	      o = {},
	      l = {};
	    for (let s = 0; s < t.length; s++) {
	      const i = t[s].id;
	      i &&
	        (e[i] && ((t[s].clicked = !0), (n[i] = !0)),
	        h[i] && ((t[s].viewed = !0), (o[i] = !0)),
	        r[i] && ((t[s].dismissed = !0), (l[i] = !0)));
	    }
	    return (
	      i &&
	        this.B &&
	        (this.B.bt(STORAGE_KEYS.ft.Jt, n), this.B.bt(STORAGE_KEYS.ft.Vt, o), this.B.bt(STORAGE_KEYS.ft.Pt, l)),
	      t
	    );
	  }
	  Xs(t) {
	    const i = [],
	      e = new Date();
	    let h = {};
	    this.B && (h = this.B.dt(STORAGE_KEYS.ft.Pt) || {});
	    let r = !1;
	    for (let s = 0; s < t.length; s++) {
	      const n = t[s].url;
	      if (!this.Cs && n && isURIJavascriptOrData(n)) {
	        E$1.error(
	          `Card with url ${n} will not be displayed because Javascript URLs are disabled. Use the "allowUserSuppliedJavascript" option for braze.initialize to enable this card.`,
	        );
	        continue;
	      }
	      const o = t[s].expiresAt;
	      let l = !0;
	      if ((null != o && (l = o >= e), (l = l && !t[s].dismissed), l))
	        i.push(t[s]);
	      else {
	        const i = t[s].id;
	        i && (h[i] = !0), (r = !0);
	      }
	    }
	    return r && this.B && this.B.bt(STORAGE_KEYS.ft.Pt, h), i;
	  }
	  Ks() {
	    var t;
	    const i = [];
	    for (let t = 0; t < this.cards.length; t++) i.push(this.cards[t].gt());
	    null === (t = this.B) || void 0 === t || t.bt(STORAGE_KEYS.ft.Ps, i);
	  }
	  Zs() {
	    this.Js && (clearTimeout(this.Js), (this.Js = null));
	  }
	  ar(t, i, e = !1) {
	    var n;
	    const o = this.j,
	      f = this.B;
	    if (!o || !f) return void ("function" == typeof i && i());
	    if ((e && (h.fi(f, h.H.vi), this.Zs()), !this.Os()))
	      return void (
	        null === (n = this.h) ||
	        void 0 === n ||
	        n.Ci(() => {
	          this.ar(t, i, !0);
	        })
	      );
	    const m = o.$({}, !0);
	    f.dt(STORAGE_KEYS.ft.Qs) !== r.Vs() && this.bi(),
	      (m.last_full_sync_at = this.ys),
	      (m.last_card_updated_at = this.Ss);
	    const p = o.A(m, h.H.vi, e);
	    let v = !1;
	    o.J(
	      m,
	      (s = -1) => {
	        if (this.B) {
	          const t = new Date().valueOf();
	          h.K(this.B, h.H.vi, t);
	        }
	        -1 !== s && p.push(["X-Braze-Req-Tokens-Remaining", s.toString()]),
	          l.O({
	            url: `${o.V()}/content_cards/sync`,
	            data: m,
	            headers: p,
	            W: (s) => {
	              if (!o.Y(m, s, p))
	                return (v = !0), void ("function" == typeof i && i());
	              o.Z(), this.N(s), (v = !1), "function" == typeof t && t();
	            },
	            error: (t) => {
	              o._(t, "retrieving content cards"),
	                (v = !0),
	                "function" == typeof i && i();
	            },
	            tt: (s, e) => {
	              var r, n, l;
	              let f;
	              if (v) {
	                const t =
	                    (null === (r = this.h) || void 0 === r ? void 0 : r.st()) ||
	                    REQUEST_BACKOFF_MIN_SLEEP_MS_DEFAULT,
	                  s =
	                    (null === (n = this.h) || void 0 === n ? void 0 : n.it()) ||
	                    REQUEST_BACKOFF_SCALE_FACTOR_DEFAULT,
	                  i =
	                    (null === (l = this.h) || void 0 === l ? void 0 : l.nt()) ||
	                    REQUEST_BACKOFF_MAX_SLEEP_MS_DEFAULT;
	                let e = this.Ms;
	                (null == e || e < t) && (e = t), (f = Math.min(i, randomInclusive(t, e * s)));
	              }
	              o.et(
	                e,
	                () => {
	                  this.ar(t, i, !1);
	                },
	                h.H.vi,
	                (t) => this.Ys(t),
	                () => this.Zs(),
	                f,
	              );
	            },
	          });
	      },
	      h.H.vi,
	      i,
	    );
	  }
	  Ws(t) {
	    t || this.Ts();
	    const i = this.Xs(this.cards);
	    i.sort((t, s) =>
	      t.pinned && !s.pinned
	        ? -1
	        : s.pinned && !t.pinned
	        ? 1
	        : t.updated && s.updated && t.updated > s.updated
	        ? -1
	        : t.updated && s.updated && s.updated > t.updated
	        ? 1
	        : 0,
	    );
	    let e = Math.max(this.Ss || 0, this.ys || 0);
	    return (
	      0 === e && (e = void 0),
	      this.B && this.B.dt(STORAGE_KEYS.ft.Hs) === this.Ss && void 0 === e && (e = this.Ss),
	      new ContentCards(i, dateFromUnixTimestamp(e))
	    );
	  }
	  It(t) {
	    return this.ws.Rt(t);
	  }
	  bi() {
	    (this.ys = 0),
	      (this.Ss = 0),
	      this.B && (this.B.zt(STORAGE_KEYS.ft.Gs), this.B.zt(STORAGE_KEYS.ft.Hs));
	  }
	  changeUser(t) {
	    t ||
	      ((this.cards = []),
	      this.ws.L(new ContentCards(this.cards.slice(), null)),
	      this.B &&
	        (this.B.zt(STORAGE_KEYS.ft.Ps),
	        this.B.zt(STORAGE_KEYS.ft.Jt),
	        this.B.zt(STORAGE_KEYS.ft.Vt),
	        this.B.zt(STORAGE_KEYS.ft.Pt))),
	      this.Zs(),
	      this.bi();
	  }
	  clearData(t) {
	    (this.ys = 0),
	      (this.Ss = 0),
	      (this.cards = []),
	      this.ws.L(new ContentCards(this.cards.slice(), null)),
	      t &&
	        this.B &&
	        (this.B.zt(STORAGE_KEYS.ft.Ps),
	        this.B.zt(STORAGE_KEYS.ft.Jt),
	        this.B.zt(STORAGE_KEYS.ft.Vt),
	        this.B.zt(STORAGE_KEYS.ft.Pt),
	        this.B.zt(STORAGE_KEYS.ft.Gs),
	        this.B.zt(STORAGE_KEYS.ft.Hs)),
	      this.Zs();
	  }
	  Os() {
	    return !!this.h && (!!this.h.wi() || (0 !== this.h.xt() && this.gi(), !1));
	  }
	  gi() {
	    this.ws.L(new ContentCards([], new Date())), this.B && this.B.zt(STORAGE_KEYS.ft.Ps);
	  }
	}

	const rr = {
	  i: !1,
	  provider: null,
	  o: () => (
	    rr.t(),
	    rr.provider ||
	      ((rr.provider = new Z(r.ir(), r.p(), r.l(), r.nr(), r.m())),
	      r.v(rr.provider),
	      r.tr("ccr", () => {
	        var r;
	        null === (r = rr.provider) || void 0 === r || r.ar();
	      })),
	    rr.provider
	  ),
	  t: () => {
	    rr.i || (r.g(rr), (rr.i = !0));
	  },
	  destroy: () => {
	    (rr.provider = null), (rr.i = !1);
	  },
	};
	var rr$1 = rr;

	function requestContentCardsRefresh(e, t) {
	  if (r.rr()) return rr$1.o().ar(e, t, !0);
	}

	class ContentCards {
	  constructor(r, t) {
	    (this.cards = r),
	      (this.lastUpdated = t),
	      (this.cards = r),
	      (this.lastUpdated = t);
	  }
	  getUnviewedCardCount() {
	    let r = 0;
	    for (const t of this.cards) t.viewed || t instanceof ControlCard || r++;
	    return r;
	  }
	  sr(r) {
	    logContentCardImpressions(r);
	  }
	  dr(r) {
	    return logContentCardClick(r);
	  }
	  ur() {
	    requestContentCardsRefresh();
	  }
	  cr() {
	    return !0;
	  }
	}
	(ContentCards.Cr = 6e4), (ContentCards.hr = 500), (ContentCards.lr = 1e4);

	function getCachedContentCards() {
	  if (r.rr()) return rr$1.o().Ws(!1);
	}

	function markCardAsRead(t) {
	  if (null != t) {
	    const e = t.querySelectorAll(".ab-unread-indicator")[0];
	    null == e || e.classList.contains("read") || (e.className += " read");
	  }
	}
	function getCardId(t) {
	  return t.getAttribute("data-ab-card-id");
	}
	function _setImageAltText(t, e) {
	  e.setAttribute("alt", t.altImageText || "");
	}
	function setCardHeight(t, e) {
	  const a = e.querySelectorAll(".ab-image-area");
	  let o,
	    i = 0;
	  a.length > 0 && (i = a[0].offsetWidth);
	  for (const e of t)
	    if (((o = e.ae), o && e.imageUrl && "number" == typeof e.aspectRatio)) {
	      const t = i / e.aspectRatio;
	      t && (o.style.height = `${t}px`);
	    }
	}
	function cardToHtml(t, e, a, o = "ltr") {
	  const i = document.createElement("div");
	  (i.dir = o),
	    t.language && (i.lang = t.language),
	    (i.className = "ab-card ab-effect-card " + t.ie),
	    t.id &&
	      (i.setAttribute("data-ab-card-id", t.id), i.setAttribute("id", t.id)),
	    i.setAttribute("role", "article");
	  let n = "",
	    d = !1;
	  t.url && "" !== t.url && ((n = t.url), (d = !0));
	  const r = (o) => (markCardAsRead(i), d && (e(t), _handleBrazeAction(n, a, o)), !1);
	  if (t.pinned) {
	    const t = document.createElement("div");
	    t.className = "ab-pinned-indicator";
	    const e = document.createElement("i");
	    (e.className = "fa fa-star"), t.appendChild(e), i.appendChild(t);
	  }
	  if (t.imageUrl && "" !== t.imageUrl) {
	    const e = document.createElement("div");
	    (e.dir = o), (e.className = "ab-image-area");
	    const a = document.createElement("img");
	    if (
	      (a.setAttribute("src", t.imageUrl),
	      (a.onload = () => {
	        i.style.height = "auto";
	      }),
	      _setImageAltText(t, a),
	      e.appendChild(a),
	      (i.className += " with-image"),
	      d && !t.ne)
	    ) {
	      const a = document.createElement("a");
	      a.setAttribute("href", n),
	        (a.onclick = r),
	        t.altImageText ||
	          (t.title
	            ? a.setAttribute("aria-label", t.title)
	            : a.setAttribute("aria-label", "Feed Image")),
	        a.appendChild(e),
	        i.appendChild(a);
	    } else i.appendChild(e);
	  }
	  const c = document.createElement("div");
	  if (((c.className = "ab-card-body"), (c.dir = o), t.dismissible)) {
	    t.logCardDismissal = () => logCardDismissal(t);
	    const e = createCloseButton("Dismiss Card", void 0, t.dismissCard.bind(t), o);
	    i.appendChild(e),
	      detectSwipe(c, DIRECTIONS.de, (t) => {
	        (i.className += " ab-swiped-left"), e.onclick(t);
	      }),
	      detectSwipe(c, DIRECTIONS.ce, (t) => {
	        (i.className += " ab-swiped-right"), e.onclick(t);
	      });
	  }
	  let s = "",
	    m = !1;
	  if ((t.title && "" !== t.title && ((s = t.title), (m = !0)), m)) {
	    const t = document.createElement("h1");
	    if (
	      ((t.className = "ab-title"),
	      (t.id = P$1.se()),
	      i.setAttribute("aria-labelledby", t.id),
	      d)
	    ) {
	      const e = document.createElement("a");
	      e.setAttribute("href", n),
	        (e.onclick = r),
	        e.appendChild(document.createTextNode(s)),
	        t.appendChild(e);
	    } else t.appendChild(document.createTextNode(s));
	    c.appendChild(t);
	  }
	  const u = document.createElement("div");
	  if (
	    ((u.className = m ? "ab-description" : "ab-description ab-no-title"),
	    t.language && (u.lang = t.language),
	    t.description && u.appendChild(document.createTextNode(t.description)),
	    d)
	  ) {
	    const e = document.createElement("div");
	    e.className = "ab-url-area";
	    const a = document.createElement("a");
	    a.setAttribute("href", n),
	      t.linkText && a.appendChild(document.createTextNode(t.linkText)),
	      (a.onclick = r),
	      e.appendChild(a),
	      u.appendChild(e);
	  }
	  c.appendChild(u), i.appendChild(c);
	  const l = document.createElement("div");
	  return (
	    (l.className = "ab-unread-indicator"),
	    t.viewed && (l.className += " read"),
	    i.appendChild(l),
	    (t.ae = i),
	    i
	  );
	}

	function removeSubscription(e) {
	  r.rr() && r.removeSubscription(e);
	}

	function topHadImpression(o) {
	  return null != o && !!o.getAttribute("data-ab-had-top-impression");
	}
	function impressOnTop(o) {
	  null != o && o.setAttribute("data-ab-had-top-impression", "true");
	}
	function bottomHadImpression(o) {
	  return null != o && !!o.getAttribute("data-ab-had-bottom-impression");
	}
	function impressOnBottom(o) {
	  null != o && o.setAttribute("data-ab-had-bottom-impression", "true");
	}
	const detectImpression = {
	  oo: topHadImpression,
	  no: bottomHadImpression,
	};

	const BannerStrings = {
	  aa: "Banners are disabled. Make sure you have at least one campaign and relaunch the app.",
	  ea: "data-update-subscription-id",
	};

	const LAST_REQUESTED_REFRESH_DATA_ATTRIBUTE =
	  "data-last-requested-refresh";
	const scrollListeners = {};
	function destroyContentCardsHtml(t) {
	  t &&
	    ((t.className = t.className.replace("ab-show", "ab-hide")),
	    setTimeout(() => {
	      t && t.parentNode && t.parentNode.removeChild(t);
	    }, ContentCards.hr));
	  const e = t.getAttribute(BannerStrings.ea);
	  null != e && removeSubscription(e);
	  const n = t.getAttribute("data-listener-id");
	  null != n &&
	    (window.removeEventListener("scroll", scrollListeners[n]),
	    delete scrollListeners[n]);
	}
	function generateContentCardsUI(t, e) {
	  const n = Me.ra(),
	    o = document.createElement("div");
	  if (
	    ((o.className = "ab-feed-body"),
	    o.setAttribute("aria-label", "Feed"),
	    o.setAttribute("role", "feed"),
	    null == t.lastUpdated)
	  ) {
	    const t = document.createElement("div");
	    t.className = "ab-no-cards-message";
	    const e = document.createElement("i");
	    (e.className = "fa fa-spinner fa-spin fa-4x ab-initial-spinner"),
	      t.appendChild(e),
	      o.appendChild(t);
	  } else {
	    let s = !1;
	    const r = (e) => t.dr(e);
	    for (const a of t.cards) {
	      const i = a instanceof ControlCard;
	      !i || t.cr()
	        ? (o.appendChild(cardToHtml(a, r, e, n.Ta())), (s = s || !i))
	        : E$1.error(
	            "Received a control card for a legacy news feed. Control cards are only supported with content cards.",
	          );
	    }
	    if (!s) {
	      const t = document.createElement("div");
	      (t.className = "ab-no-cards-message"),
	        (t.innerHTML = n.get("NO_CARDS_MESSAGE") || ""),
	        t.setAttribute("role", "article"),
	        o.appendChild(t);
	    }
	  }
	  return o;
	}
	function detectContentCardsImpressions(t, e) {
	  if (null != t && null != e) {
	    const n = [],
	      o = e.querySelectorAll(".ab-card");
	    t.Qa || (t.Qa = {});
	    for (let e = 0; e < o.length; e++) {
	      const s = getCardId(o[e]),
	        r = topIsInView(o[e]),
	        a = bottomIsInView(o[e]);
	      if (t.Qa[s]) {
	        r || a || markCardAsRead(o[e]);
	        continue;
	      }
	      let i = topHadImpression(o[e]),
	        l = bottomHadImpression(o[e]);
	      const d = i,
	        c = l;
	      if (
	        (!i && r && ((i = !0), impressOnTop(o[e])), !l && a && ((l = !0), impressOnBottom(o[e])), i && l)
	      ) {
	        if (d && c) continue;
	        for (const e of t.cards)
	          if (e.id === s) {
	            (t.Qa[e.id] = !0), n.push(e);
	            break;
	          }
	      }
	    }
	    n.length > 0 && t.sr(n);
	  }
	}
	function refreshContentCardsUI(t, e) {
	  if (null == t || null == e) return;
	  e.setAttribute("aria-busy", "true");
	  const n = e.querySelectorAll(".ab-refresh-button")[0];
	  null != n && (n.className += " fa-spin");
	  const o = new Date().valueOf().toString();
	  e.setAttribute("data-last-requested-refresh", o),
	    setTimeout(() => {
	      if (e.getAttribute("data-last-requested-refresh") === o) {
	        const t = e.querySelectorAll(".fa-spin");
	        for (let e = 0; e < t.length; e++)
	          t[e].className = t[e].className.replace(/fa-spin/g, "");
	        const n = e.querySelectorAll(".ab-initial-spinner")[0];
	        if (null != n) {
	          const t = document.createElement("span");
	          (t.innerHTML = Me.ra().get("FEED_TIMEOUT_MESSAGE") || ""),
	            null != n.parentNode &&
	              (n.parentNode.appendChild(t), n.parentNode.removeChild(n));
	        }
	        "true" === e.getAttribute("aria-busy") &&
	          e.setAttribute("aria-busy", "false");
	      }
	    }, ContentCards.lr),
	    t.ur();
	}
	function contentCardsToHtml(t, e, n) {
	  const o = document.createElement("div");
	  (o.className = "ab-feed ab-hide ab-effect-slide"),
	    o.setAttribute("role", "dialog"),
	    o.setAttribute("aria-label", "Feed"),
	    o.setAttribute("tabindex", "-1");
	  const s = document.createElement("div");
	  (s.className = "ab-feed-buttons-wrapper"),
	    s.setAttribute("role", "group"),
	    o.appendChild(s);
	  const r = document.createElement("i");
	  (r.className = "fa fa-times ab-close-button"),
	    r.setAttribute("aria-label", "Close Feed"),
	    r.setAttribute("tabindex", "0"),
	    r.setAttribute("role", "button");
	  const a = (t) => {
	    destroyContentCardsHtml(o), t.stopPropagation();
	  };
	  r.addEventListener("keydown", (t) => {
	    (t.keyCode !== KeyCodes.Ho && t.keyCode !== KeyCodes.Go) || a(t);
	  }),
	    (r.onclick = a);
	  const i = document.createElement("i");
	  (i.className = "fa fa-refresh ab-refresh-button"),
	    t && null == t.lastUpdated && (i.className += " fa-spin"),
	    i.setAttribute("aria-label", "Refresh Feed"),
	    i.setAttribute("tabindex", "0"),
	    i.setAttribute("role", "button");
	  const l = (e) => {
	    refreshContentCardsUI(t, o), e.stopPropagation();
	  };
	  i.addEventListener("keydown", (t) => {
	    (t.keyCode !== KeyCodes.Ho && t.keyCode !== KeyCodes.Go) || l(t);
	  }),
	    (i.onclick = l),
	    s.appendChild(i),
	    s.appendChild(r),
	    o.appendChild(generateContentCardsUI(t, e));
	  const d = () => detectContentCardsImpressions(t, o);
	  if ((o.addEventListener("scroll", d), !n)) {
	    window.addEventListener("scroll", d);
	    const t = P$1.se();
	    (scrollListeners[t] = d), o.setAttribute("data-listener-id", t);
	  }
	  return o;
	}
	function updateContentCards(t, e, n, o, s) {
	  if (!isArray(e)) return;
	  const r = [];
	  for (const t of e)
	    if (t instanceof Card) {
	      if (t.url && BRAZE_ACTION_URI_REGEX.test(t.url)) {
	        const e = getDecodedBrazeAction(t.url);
	        if (containsUnknownBrazeAction(e)) {
	          E$1.error(ineligibleBrazeActionURLErrorMessage(INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES.Pn, "Content Card"));
	          continue;
	        }
	      }
	      r.push(t);
	    }
	  if (((t.cards = r), (t.lastUpdated = n), null != o))
	    if ((o.setAttribute("aria-busy", "false"), null == t.lastUpdated))
	      destroyContentCardsHtml(o);
	    else {
	      const e = o.querySelectorAll(".ab-feed-body")[0];
	      if (null != e) {
	        const n = generateContentCardsUI(t, s);
	        e.parentNode && e.parentNode.replaceChild(n, e),
	          detectContentCardsImpressions(t, n.parentNode);
	      }
	    }
	}
	function registerContentCardsSubscriptionId(t, e) {
	  t && e.setAttribute(BannerStrings.ea, t);
	}

	function hideContentCards(n) {
	  if (!r.rr()) return;
	  const o = document.querySelectorAll(".ab-feed");
	  for (let t = 0; t < o.length; t++)
	    (null == n || (null != n && o[t].parentNode === n)) && destroyContentCardsHtml(o[t]);
	}

	function showContentCards(n, t) {
	  if (!r.rr()) return;
	  setupFeedUI();
	  let e = !1;
	  null == n && ((n = document.body), (e = !0));
	  const o = r.re(D.tn) || !1,
	    s = rr$1.o().Ws(!1);
	  "function" == typeof t && updateContentCards(s, t(s.cards.slice()), s.lastUpdated, null, o);
	  const a = contentCardsToHtml(s, o, e),
	    i = rr$1.o(),
	    c = i.Bs();
	  (null == s.lastUpdated ||
	    new Date().valueOf() - s.lastUpdated.valueOf() > ContentCards.Cr) &&
	    (null == c || new Date().valueOf() - c > ContentCards.Cr) &&
	    (E$1.info(
	      `Cached content cards were older than max TTL of ${ContentCards.Cr} ms, requesting an update from the server.`,
	    ),
	    refreshContentCardsUI(s, a),
	    i.Es(new Date().valueOf()));
	  const f = new Date().valueOf(),
	    l = subscribeToContentCardsUpdates(function (n) {
	      const e = a.querySelectorAll(".ab-refresh-button")[0];
	      if (null != e) {
	        let n = 500,
	          t = (n -= new Date().valueOf() - f);
	        const o = a.getAttribute(LAST_REQUESTED_REFRESH_DATA_ATTRIBUTE);
	        o && ((t = parseInt(o)), isNaN(t) || (n -= new Date().valueOf() - t)),
	          setTimeout(
	            function () {
	              e.className = e.className.replace(/fa-spin/g, "");
	            },
	            Math.max(n, 0),
	          );
	      }
	      let r = n.cards;
	      "function" == typeof t && (r = t(r.slice())),
	        updateContentCards(s, r, n.lastUpdated, a, o);
	    });
	  registerContentCardsSubscriptionId(l, a);
	  const u = function (n) {
	    const t = n.querySelectorAll(".ab-feed");
	    let o = null;
	    for (let e = 0; e < t.length; e++) t[e].parentNode === n && (o = t[e]);
	    null != o
	      ? (destroyContentCardsHtml(o), null != o.parentNode && o.parentNode.replaceChild(a, o))
	      : n.appendChild(a),
	      setTimeout(function () {
	        a.className = a.className.replace("ab-hide", "ab-show");
	      }, 0),
	      e && a.focus(),
	      detectContentCardsImpressions(s, a),
	      setCardHeight(s.cards, n);
	  };
	  var d;
	  null != n
	    ? u(n)
	    : (window.onload =
	        ((d = window.onload),
	        function () {
	          "function" == typeof d && d(new Event("oldLoad")), u(document.body);
	        }));
	}

	function subscribeToContentCardsUpdates(o) {
	  if (!r.rr()) return;
	  const t = rr$1.o(),
	    n = t.It(o);
	  if (!t.St()) {
	    const o = r.nn();
	    if (o) {
	      const r = o.rn(() => {
	        t.ar(void 0, void 0, !0);
	      });
	      r && t.wt(r);
	    }
	  }
	  return n;
	}

	function toggleContentCards(e, n) {
	  r.rr() &&
	    (document.querySelectorAll(".ab-feed").length > 0
	      ? hideContentCards()
	      : showContentCards(e, n));
	}

	var BrazeSdkMetadata = {
	  GOOGLE_TAG_MANAGER: "gg",
	  MPARTICLE: "mp",
	  SEGMENT: "sg",
	  TEALIUM: "tl",
	  MANUAL: "manu",
	  NPM: "npm",
	  CDN: "wcd",
	  SHOPIFY: "shp",
	};

	function addSdkMetadata(a) {
	  if (!r.rr()) return;
	  const t = r.m();
	  if (t) {
	    if (!isArray(a))
	      return (
	        E$1.error("Cannot set SDK metadata because metadata is not an array."), !1
	      );
	    for (const t of a)
	      if (
	        !validateValueIsFromEnum(
	          BrazeSdkMetadata,
	          t,
	          "sdkMetadata contained an invalid value.",
	          "BrazeSdkMetadata",
	        )
	      )
	        return !1;
	    return t.addSdkMetadata(a), !0;
	  }
	}

	function changeUser(e, i) {
	  if (!r.rr()) return;
	  if (null == e || 0 === e.length || e != e)
	    return void E$1.error("changeUser requires a non-empty userId.");
	  if (getByteLength(e) > User.mr)
	    return void E$1.error(
	      `Rejected user id "${e}" because it is longer than ${User.mr} bytes.`,
	    );
	  if (null != i && !validateStandardString(i, "set signature for new user", "signature")) return;
	  const t = r.nn();
	  t && t.changeUser(e.toString(), r.gr(), i);
	}

	var changeUser$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		changeUser: changeUser
	});

	function destroy() {
	  E$1.info("Destroying Braze instance"), r.destroy(!0);
	}

	function disableSDK() {
	  const e = r.nn();
	  e && e.requestImmediateDataFlush();
	  const n = new ee.le(null, !0),
	    a = "This-cookie-will-expire-in-" + n.me();
	  n.store(STORAGE_KEYS.pe, a);
	  const i = et.Us.Rs;
	  new et(i, E$1).setItem(i.Fs.be, i.fe, !0),
	    E$1.info("disableSDK was called"),
	    r.destroy(!1),
	    r.ge(!0);
	}

	function enableSDK() {
	  new ee.le(null, !0).remove(STORAGE_KEYS.pe);
	  const e = et.Us.Rs;
	  new et(e, E$1).je(e.Fs.be, e.fe),
	    E$1.info("enableSDK was called"),
	    r.destroy(!1),
	    r.ge(!1);
	}

	function getDeviceId(e) {
	  if (!r.rr()) return;
	  const t = r.ue();
	  if (!t) return;
	  const i = t.ve().id;
	  if ("function" != typeof e) return i;
	  E$1.warn(
	    "The callback for getDeviceId is deprecated. You can access its return value directly instead (e.g. `const id = braze.getDeviceId()`)",
	  ),
	    e(i);
	}

	function initialize(i, n) {
	  return r.initialize(i, n);
	}

	function isDisabled() {
	  return !!new ee.le(null, !0).jr(STORAGE_KEYS.pe);
	}

	function isInitialized() {
	  return r.ao();
	}

	function logCustomEvent(t, e) {
	  if (!r.rr()) return !1;
	  if (null == t || t.length <= 0)
	    return (
	      E$1.error(
	        `logCustomEvent requires a non-empty eventName, got "${t}". Ignoring event.`,
	      ),
	      !1
	    );
	  if (!validateCustomString(t, "log custom event", "the event name")) return !1;
	  const [o, n] = validateCustomProperties(
	    e,
	    CoreStrings.$e,
	    "eventProperties",
	    `log custom event "${t}"`,
	    "event",
	  );
	  if (!o) return !1;
	  const i = r.l();
	  if (i && i.Ce(t))
	    return E$1.info(`Custom Event "${t}" is blocklisted, ignoring.`), !1;
	  const s = v$1.lt(f.CustomEvent, { n: t, p: n });
	  if (s.W) {
	    E$1.info(`Logged custom event "${t}".`);
	    for (const o of s.Ee) TriggersProviderFactory.o().he(ot.xe, [t, e], o);
	  }
	  return s.W;
	}

	var logCustomEvent$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		logCustomEvent: logCustomEvent
	});

	function logPurchase(e, o, i, n, t) {
	  if (!r.rr()) return !1;
	  if (
	    (null == i && (i = "USD"), null == n && (n = 1), null == e || e.length <= 0)
	  )
	    return (
	      E$1.error(
	        `logPurchase requires a non-empty productId, got "${e}", ignoring.`,
	      ),
	      !1
	    );
	  if (!validateCustomString(e, "log purchase", "the purchase name")) return !1;
	  if (null == o || isNaN(parseFloat(o.toString())))
	    return (
	      E$1.error(`logPurchase requires a numeric price, got ${o}, ignoring.`), !1
	    );
	  const s = parseFloat(o.toString()).toFixed(2);
	  if (null == n || isNaN(parseInt(n.toString())))
	    return (
	      E$1.error(`logPurchase requires an integer quantity, got ${n}, ignoring.`),
	      !1
	    );
	  const D = parseInt(n.toString());
	  if (D < 1 || D > MAX_PURCHASE_QUANTITY)
	    return (
	      E$1.error(
	        `logPurchase requires a quantity >1 and <${MAX_PURCHASE_QUANTITY}, got ${D}, ignoring.`,
	      ),
	      !1
	    );
	  i = null != i ? i.toUpperCase() : i;
	  if (
	    -1 ===
	    [
	      "AED",
	      "AFN",
	      "ALL",
	      "AMD",
	      "ANG",
	      "AOA",
	      "ARS",
	      "AUD",
	      "AWG",
	      "AZN",
	      "BAM",
	      "BBD",
	      "BDT",
	      "BGN",
	      "BHD",
	      "BIF",
	      "BMD",
	      "BND",
	      "BOB",
	      "BRL",
	      "BSD",
	      "BTC",
	      "BTN",
	      "BWP",
	      "BYR",
	      "BZD",
	      "CAD",
	      "CDF",
	      "CHF",
	      "CLF",
	      "CLP",
	      "CNY",
	      "COP",
	      "CRC",
	      "CUC",
	      "CUP",
	      "CVE",
	      "CZK",
	      "DJF",
	      "DKK",
	      "DOP",
	      "DZD",
	      "EEK",
	      "EGP",
	      "ERN",
	      "ETB",
	      "EUR",
	      "FJD",
	      "FKP",
	      "GBP",
	      "GEL",
	      "GGP",
	      "GHS",
	      "GIP",
	      "GMD",
	      "GNF",
	      "GTQ",
	      "GYD",
	      "HKD",
	      "HNL",
	      "HRK",
	      "HTG",
	      "HUF",
	      "IDR",
	      "ILS",
	      "IMP",
	      "INR",
	      "IQD",
	      "IRR",
	      "ISK",
	      "JEP",
	      "JMD",
	      "JOD",
	      "JPY",
	      "KES",
	      "KGS",
	      "KHR",
	      "KMF",
	      "KPW",
	      "KRW",
	      "KWD",
	      "KYD",
	      "KZT",
	      "LAK",
	      "LBP",
	      "LKR",
	      "LRD",
	      "LSL",
	      "LTL",
	      "LVL",
	      "LYD",
	      "MAD",
	      "MDL",
	      "MGA",
	      "MKD",
	      "MMK",
	      "MNT",
	      "MOP",
	      "MRO",
	      "MTL",
	      "MUR",
	      "MVR",
	      "MWK",
	      "MXN",
	      "MYR",
	      "MZN",
	      "NAD",
	      "NGN",
	      "NIO",
	      "NOK",
	      "NPR",
	      "NZD",
	      "OMR",
	      "PAB",
	      "PEN",
	      "PGK",
	      "PHP",
	      "PKR",
	      "PLN",
	      "PYG",
	      "QAR",
	      "RON",
	      "RSD",
	      "RUB",
	      "RWF",
	      "SAR",
	      "SBD",
	      "SCR",
	      "SDG",
	      "SEK",
	      "SGD",
	      "SHP",
	      "SLL",
	      "SOS",
	      "SRD",
	      "STD",
	      "SVC",
	      "SYP",
	      "SZL",
	      "THB",
	      "TJS",
	      "TMT",
	      "TND",
	      "TOP",
	      "TRY",
	      "TTD",
	      "TWD",
	      "TZS",
	      "UAH",
	      "UGX",
	      "USD",
	      "UYU",
	      "UZS",
	      "VEF",
	      "VND",
	      "VUV",
	      "WST",
	      "XAF",
	      "XAG",
	      "XAU",
	      "XCD",
	      "XDR",
	      "XOF",
	      "XPD",
	      "XPF",
	      "XPT",
	      "YER",
	      "ZAR",
	      "ZMK",
	      "ZMW",
	      "ZWL",
	    ].indexOf(i)
	  )
	    return (
	      E$1.error(`logPurchase requires a valid currencyCode, got ${i}, ignoring.`),
	      !1
	    );
	  const [u, a] = validateCustomProperties(
	    t,
	    "logPurchase",
	    "purchaseProperties",
	    `log purchase "${e}"`,
	    "purchase",
	  );
	  if (!u) return !1;
	  const g = r.l();
	  if (g && g.Dr(e))
	    return E$1.info(`Purchase "${e}" is blocklisted, ignoring.`), !1;
	  const P = v$1.lt(f.Pr, { pid: e, c: i, p: s, q: D, pr: a });
	  if (P.W) {
	    E$1.info(`Logged ${D} purchase${D > 1 ? "s" : ""} of "${e}" for ${i} ${s}.`);
	    for (const r of P.Ee) TriggersProviderFactory.o().he(ot.Rr, [e, t], r);
	  }
	  return P.W;
	}

	var logPurchase$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		logPurchase: logPurchase
	});

	function openSession() {
	  if (!r.rr()) return;
	  const i = r.nn();
	  if (!i) return;
	  i.openSession();
	  const t = et.Us.Rs,
	    o = new et(t, E$1);
	  o.kr(t.Fs.vr, (r, n) => {
	    const e = n.lastClick,
	      s = n.trackingString;
	    E$1.info(`Firing push click trigger from ${s} push click at ${e}`);
	    const c = i.$r(e, s),
	      g = function () {
	        TriggersProviderFactory.o().he(ot.wr, [s], c);
	      };
	    i.yr(g, g), o.je(t.Fs.vr, r);
	  }),
	    o.Ds(t.Fs.zr, function (r) {
	      i.Fr(r);
	    });
	}

	function removeAllSubscriptions() {
	  r.rr() && r.removeAllSubscriptions();
	}

	function requestImmediateDataFlush(e) {
	  if (!r.rr()) return;
	  const t = r.nn();
	  t && t.requestImmediateDataFlush(e);
	}

	var requestImmediateDataFlush$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		requestImmediateDataFlush: requestImmediateDataFlush
	});

	function setLogger(e) {
	  E$1.setLogger(e);
	}

	function setSdkAuthenticationSignature(t) {
	  if (!r.rr()) return !1;
	  if ("" === t || !validateStandardString(t, "set signature", "signature", !1)) return !1;
	  const i = r.Sr();
	  return !!i && (i.setSdkAuthenticationSignature(t), !0);
	}

	function subscribeToSdkAuthenticationFailures(i) {
	  var n;
	  if (r.rr())
	    return null === (n = r.Sr()) || void 0 === n
	      ? void 0
	      : n.subscribeToSdkAuthenticationFailures(i);
	}

	function toggleLogging() {
	  E$1.toggleLogging();
	}

	function wipeData() {
	  const o = r.p();
	  if (null == o) return void E$1.warn(CoreStrings.ee);
	  o.clearData();
	  const t = keys(et.Us);
	  for (let o = 0; o < t.length; o++) {
	    const n = t[o],
	      r = et.Us[n];
	    new et(r, E$1).clearData();
	  }
	  if (r.rr()) for (const o of r.gr()) o.clearData(!0);
	  const n = r.m();
	  n && n.fo();
	}

	function isPushBlocked() {
	  if (r.rr()) return vt$1.isPushBlocked();
	}

	function isPushPermissionGranted() {
	  if (r.rr()) return vt$1.isPushPermissionGranted();
	}

	function isPushSupported() {
	  if (r.rr()) return vt$1.isPushSupported();
	}

	class na {
	  constructor(i, t, e, s, r, n, o, u, a, h, c) {
	    (this.iu = i),
	      (this.tu = t),
	      (this.eu = e),
	      (this.su = r),
	      (this.ru = n),
	      (this.nu = o),
	      (this.h = u),
	      (this.ou = a),
	      (this.uu = h),
	      (this.B = c),
	      (this.iu = i),
	      (this.tu = t),
	      (this.eu = e),
	      (this.au = s + "/safari/" + t),
	      (this.su = r || "/service-worker.js"),
	      (this.nu = o),
	      (this.h = u),
	      (this.ou = a || !1),
	      (this.uu = h || !1),
	      (this.B = c),
	      (this.hu = vt$1.cu()),
	      (this.fu = vt$1.lu());
	  }
	  du() {
	    return this.uu;
	  }
	  pu(i, t, e, s, r) {
	    i.unsubscribe()
	      .then((i) => {
	        i
	          ? this.bu(t, e, s, r)
	          : (E$1.error("Failed to unsubscribe device from push."),
	            "function" == typeof r && r(!1));
	      })
	      .catch((i) => {
	        E$1.error("Push unsubscription error: " + i),
	          "function" == typeof r && r(!1);
	      });
	  }
	  yu(i, t, e) {
	    var s;
	    const r = ((i) => {
	      if ("string" == typeof i) return i;
	      if (0 !== i.endpoint.indexOf("https://android.googleapis.com/gcm/send"))
	        return i.endpoint;
	      let t = i.endpoint;
	      const e = i;
	      return (
	        e.mu &&
	          -1 === i.endpoint.indexOf(e.mu) &&
	          (t = i.endpoint + "/" + e.mu),
	        t
	      );
	    })(i);
	    let n = null,
	      o = null;
	    const u = i;
	    if (null != u.getKey)
	      try {
	        const i = Array.from(new Uint8Array(u.getKey("p256dh"))),
	          t = Array.from(new Uint8Array(u.getKey("auth")));
	        (n = btoa(String.fromCharCode.apply(null, i))),
	          (o = btoa(String.fromCharCode.apply(null, t)));
	      } catch (i) {
	        E$1.error(getErrorMessage(i));
	      }
	    const a = ((i) => {
	      let t;
	      return i.options &&
	        (t = i.options.applicationServerKey) &&
	        t.byteLength &&
	        t.byteLength > 0
	        ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(t))))
	            .replace(/\+/g, "-")
	            .replace(/\//g, "_")
	        : null;
	    })(u);
	    null === (s = this.iu) || void 0 === s || s.gu(r, t, n, o, a),
	      r && "function" == typeof e && e(r, n, o);
	  }
	  vu() {
	    var i;
	    null === (i = this.iu) || void 0 === i || i.wu(!0);
	  }
	  ku(i, t) {
	    var e;
	    null === (e = this.iu) || void 0 === e || e.wu(!1),
	      E$1.info(i),
	      "function" == typeof t && t(!1);
	  }
	  Pu(i, t, e, s) {
	    var r;
	    if ("default" === t.permission)
	      try {
	        window.safari.pushNotification.requestPermission(
	          this.au,
	          i,
	          {
	            api_key: this.tu,
	            device_id:
	              (null === (r = this.eu) || void 0 === r ? void 0 : r.ve().id) ||
	              "",
	          },
	          (t) => {
	            "granted" === t.permission &&
	              this.iu &&
	              this.iu.setPushNotificationSubscriptionType(
	                User.NotificationSubscriptionTypes.OPTED_IN,
	              ),
	              this.Pu(i, t, e, s);
	          },
	        );
	      } catch (i) {
	        this.ku("Could not request permission for push: " + i, s);
	      }
	    else
	      "denied" === t.permission
	        ? this.ku(
	            "The user has blocked notifications from this site, or Safari push is not configured in the Braze dashboard.",
	            s,
	          )
	        : "granted" === t.permission &&
	          (E$1.info("Device successfully subscribed to push."),
	          this.yu(t.deviceToken, new Date(), e));
	  }
	  requestPermission(i, t, e) {
	    const s = (s) => {
	      switch (s) {
	        case "granted":
	          return void ("function" == typeof i && i());
	        case "default":
	          return void ("function" == typeof t && t());
	        case "denied":
	          return void ("function" == typeof e && e());
	        default:
	          E$1.error("Received unexpected permission result " + s);
	      }
	    };
	    let r = !1;
	    if ("default" !== window.Notification.permission)
	      s(Notification.permission);
	    else {
	      const i = window.Notification.requestPermission((i) => {
	        r && s(i);
	      });
	      i
	        ? i.then((i) => {
	            s(i);
	          })
	        : (r = !0);
	    }
	  }
	  bu(i, t, e, s) {
	    const r = { userVisibleOnly: !0 };
	    null != t && (r.applicationServerKey = t),
	      i.pushManager
	        .subscribe(r)
	        .then((i) => {
	          E$1.info("Device successfully subscribed to push."),
	            this.yu(i, new Date(), e);
	        })
	        .catch((i) => {
	          vt$1.isPushBlocked()
	            ? (E$1.info("Permission for push notifications was denied."),
	              "function" == typeof s && s(!1))
	            : (E$1.error("Push subscription failed: " + i),
	              "function" == typeof s && s(!0));
	        });
	  }
	  Du() {
	    if (this.ou) return navigator.serviceWorker.getRegistration(this.su);
	    const i = this.ru ? { scope: this.ru } : void 0;
	    return navigator.serviceWorker.register(this.su, i).then(() =>
	      navigator.serviceWorker.ready.then(
	        (i) => (
	          i &&
	            "function" == typeof i.update &&
	            i.update().catch((i) => {
	              E$1.info("ServiceWorker update failed: " + i);
	            }),
	          i
	        ),
	      ),
	    );
	  }
	  Su(i) {
	    this.ou ||
	      (i.unregister(), E$1.info("Service worker successfully unregistered."));
	  }
	  subscribe(i, t) {
	    if (!vt$1.isPushSupported())
	      return E$1.info(na.Au), void ("function" == typeof t && t(!1));
	    if (this.hu) {
	      if (!this.ou && null != window.location) {
	        let i = this.su;
	        -1 === i.indexOf(window.location.host) &&
	          (i = window.location.host + i),
	          -1 === i.indexOf(window.location.protocol) &&
	            (i = window.location.protocol + "//" + i);
	      }
	      if (vt$1.isPushBlocked())
	        return void this.ku(
	          "Notifications from this site are blocked. This may be a temporary embargo or a permanent denial.",
	          t,
	        );
	      if (this.h && !this.h.ju() && 0 === this.h.xt())
	        return (
	          E$1.info(
	            "Waiting for VAPID key from server config before subscribing to push.",
	          ),
	          void this.h.xu(() => {
	            this.subscribe(i, t);
	          })
	        );
	      const e = () => {
	          E$1.info("Permission for push notifications was denied."),
	            "function" == typeof t && t(!1);
	        },
	        r = () => {
	          let i = "Permission for push notifications was ignored.";
	          vt$1.isPushBlocked() &&
	            (i +=
	              " The browser has automatically blocked further permission requests for a period (probably 1 week)."),
	            E$1.info(i),
	            "function" == typeof t && t(!0);
	        },
	        n = vt$1.isPushPermissionGranted(),
	        o = () => {
	          !n &&
	            this.iu &&
	            this.iu.setPushNotificationSubscriptionType(
	              User.NotificationSubscriptionTypes.OPTED_IN,
	            ),
	            this.Du()
	              .then((e) => {
	                if (null == e)
	                  return (
	                    E$1.error(
	                      "No service worker registration. Set the `manageServiceWorkerExternally` initialization option to false or ensure that your service worker is registered before calling registerPush.",
	                    ),
	                    void ("function" == typeof t && t(!0))
	                  );
	                e.pushManager
	                  .getSubscription()
	                  .then((r) => {
	                    var n;
	                    let o = null;
	                    if (
	                      (null !=
	                        (null === (n = this.h) || void 0 === n
	                          ? void 0
	                          : n.ju()) && (o = ui.Nu(this.h.ju())),
	                      r)
	                    ) {
	                      let n,
	                        u = null,
	                        a = null;
	                      if ((this.B && (n = this.B.dt(STORAGE_KEYS.ft.Uu)), n && !isArray(n))) {
	                        let i;
	                        try {
	                          i = oi._u(n).Wu;
	                        } catch (t) {
	                          i = null;
	                        }
	                        null == i ||
	                          isNaN(i.getTime()) ||
	                          0 === i.getTime() ||
	                          ((u = i),
	                          (a = new Date(u)),
	                          a.setMonth(u.getMonth() + 6));
	                      }
	                      null != o &&
	                      r.options &&
	                      r.options.applicationServerKey &&
	                      r.options.applicationServerKey.byteLength &&
	                      r.options.applicationServerKey.byteLength > 0 &&
	                      !isEqual(o, new Uint8Array(r.options.applicationServerKey))
	                        ? (r.options.applicationServerKey.byteLength > 12
	                            ? E$1.info(
	                                "Device was already subscribed to push using a different VAPID provider, creating new subscription.",
	                              )
	                            : E$1.info(
	                                "Attempting to upgrade a gcm_sender_id-based push registration to VAPID - depending on the browser this may or may not result in the same gcm_sender_id-based subscription.",
	                              ),
	                          this.pu(r, e, o, i, t))
	                        : r.expirationTime &&
	                          new Date(r.expirationTime).valueOf() <=
	                            new Date().valueOf()
	                        ? (E$1.info(
	                            "Push subscription is expired, creating new subscription.",
	                          ),
	                          this.pu(r, e, o, i, t))
	                        : n && isArray(n)
	                        ? this.pu(r, e, o, i, t)
	                        : null == a
	                        ? (E$1.info(
	                            "No push subscription creation date found, creating new subscription.",
	                          ),
	                          this.pu(r, e, o, i, t))
	                        : a.valueOf() <= new Date().valueOf()
	                        ? (E$1.info(
	                            "Push subscription older than 6 months, creating new subscription.",
	                          ),
	                          this.pu(r, e, o, i, t))
	                        : (E$1.info(
	                            "Device already subscribed to push, sending existing subscription to backend.",
	                          ),
	                          this.yu(r, u, i));
	                    } else this.bu(e, o, i, t);
	                  })
	                  .catch((i) => {
	                    E$1.error("Error checking current push subscriptions: " + i);
	                  });
	              })
	              .catch((i) => {
	                E$1.error("ServiceWorker registration failed: " + i);
	              });
	        };
	      this.requestPermission(o, r, e);
	    } else if (this.fu) {
	      if (null == this.nu || "" === this.nu)
	        return (
	          E$1.error(
	            "You must supply the safariWebsitePushId initialization option in order to use registerPush on Safari",
	          ),
	          void ("function" == typeof t && t(!0))
	        );
	      const e = window.safari.pushNotification.permission(this.nu);
	      this.Pu(this.nu, e, i, t);
	    }
	  }
	  unsubscribe(i, t) {
	    if (!vt$1.isPushSupported())
	      return E$1.info(na.Au), void ("function" == typeof t && t());
	    this.hu
	      ? navigator.serviceWorker.getRegistration(this.su).then((e) => {
	          e
	            ? e.pushManager
	                .getSubscription()
	                .then((s) => {
	                  s
	                    ? (this.vu(),
	                      s
	                        .unsubscribe()
	                        .then((s) => {
	                          s
	                            ? (E$1.info(
	                                "Device successfully unsubscribed from push.",
	                              ),
	                              "function" == typeof i && i())
	                            : (E$1.error(
	                                "Failed to unsubscribe device from push.",
	                              ),
	                              "function" == typeof t && t()),
	                            this.Su(e);
	                        })
	                        .catch((i) => {
	                          E$1.error("Push unsubscription error: " + i),
	                            "function" == typeof t && t();
	                        }))
	                    : (E$1.info("Device already unsubscribed from push."),
	                      "function" == typeof i && i());
	                })
	                .catch((i) => {
	                  E$1.error("Error unsubscribing from push: " + i),
	                    "function" == typeof t && t();
	                })
	            : (E$1.info("Device already unsubscribed from push."),
	              "function" == typeof i && i());
	        })
	      : this.fu &&
	        (this.vu(),
	        E$1.info("Device unsubscribed from push."),
	        "function" == typeof i && i());
	  }
	}
	na.Au = "Push notifications are not supported in this browser.";

	const ra = {
	  i: !1,
	  na: null,
	  ra: () => (
	    ra.t(),
	    ra.na ||
	      (ra.na = new na(
	        r.br(),
	        r._a(),
	        r.ue(),
	        r.V(),
	        r.re(D.Ga),
	        r.re(D.Ha),
	        r.re(D.Ia),
	        r.l(),
	        r.re(D.Ka),
	        r.re(D.La),
	        r.p(),
	      )),
	    ra.na
	  ),
	  t: () => {
	    ra.i || (r.g(ra), (ra.i = !0));
	  },
	  destroy: () => {
	    (ra.na = null), (ra.i = !1);
	  },
	};
	var ra$1 = ra;

	var pushManagerFactory = /*#__PURE__*/Object.freeze({
		__proto__: null,
		'default': ra$1
	});

	function requestPushPermission(n, o) {
	  if (r.rr())
	    return ra$1.ra().subscribe((o, t, e) => {
	      const s = r.nn();
	      s && s.requestImmediateDataFlush(), "function" == typeof n && n(o, t, e);
	    }, o);
	}

	var requestPushPermission$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		requestPushPermission: requestPushPermission
	});

	function unregisterPush(e, n) {
	  if (r.rr()) return ra$1.ra().unsubscribe(e, n);
	}

	var unregisterPush$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		unregisterPush: unregisterPush
	});

	class PropertiesBase {
	  constructor(t) {
	    (this.properties = t), (this.properties = t || {});
	  }
	  tp(t, r, e) {
	    const o = this.properties[t];
	    return null == o ? (this.rp(t), null) : r(o) ? o.value : (this.ep(e), null);
	  }
	  getStringProperty(t) {
	    return this.tp(t, this.op, "string");
	  }
	  getNumberProperty(t) {
	    return this.tp(t, this.sp, "number");
	  }
	  getBooleanProperty(t) {
	    return this.tp(t, this.ip, "boolean");
	  }
	  getImageProperty(t) {
	    return this.tp(t, this.np, "image");
	  }
	  getJsonProperty(t) {
	    return this.tp(t, this.pp, "jsonobject");
	  }
	  getTimestampProperty(t) {
	    return this.tp(t, this.up, "datetime");
	  }
	  ep(t) {
	    E$1.info(`Property is not of type ${t}.`);
	  }
	  rp(t) {
	    E$1.info(`${t} not found in properties.`);
	  }
	  op(t) {
	    return "string" === t.type && "string" == typeof t.value;
	  }
	  sp(t) {
	    return "number" === t.type && "number" == typeof t.value;
	  }
	  ip(t) {
	    return "boolean" === t.type && "boolean" == typeof t.value;
	  }
	  np(t) {
	    return "image" === t.type && "string" == typeof t.value;
	  }
	  pp(t) {
	    return (
	      "jsonobject" === t.type &&
	      "object" == typeof t.value &&
	      t.value.constructor == Object
	    );
	  }
	  up(t) {
	    return "datetime" === t.type && "number" == typeof t.value;
	  }
	}

	class FeatureFlag extends PropertiesBase {
	  constructor(s, t = !1, i = {}, e) {
	    super(i),
	      (this.id = s),
	      (this.enabled = t),
	      (this.trackingString = e),
	      (this.id = s),
	      (this.enabled = t),
	      (this.trackingString = e);
	  }
	  gt() {
	    const s = {};
	    return (
	      (s[FeatureFlag.ss.rs] = this.id),
	      (s[FeatureFlag.ss.Jr] = this.enabled),
	      (s[FeatureFlag.ss.Nr] = this.properties),
	      (s[FeatureFlag.ss.Or] = this.trackingString),
	      s
	    );
	  }
	}
	(FeatureFlag.ss = { rs: "id", Jr: "e", Nr: "pr", Or: "fts" }),
	  (FeatureFlag.ui = { rs: "id", Jr: "enabled", Nr: "properties", Or: "fts" });

	function newFeatureFlagFromJson(e) {
	  if (e[FeatureFlag.ui.rs] && "boolean" == typeof e[FeatureFlag.ui.Jr])
	    return new FeatureFlag(
	      e[FeatureFlag.ui.rs],
	      e[FeatureFlag.ui.Jr],
	      e[FeatureFlag.ui.Nr],
	      e[FeatureFlag.ui.Or],
	    );
	  E$1.info(`Unable to create feature flag from ${JSON.stringify(e, null, 2)}`);
	}
	function newFeatureFlagFromSerializedValue(e) {
	  if (e[FeatureFlag.ss.rs] && "boolean" == typeof e[FeatureFlag.ss.Jr])
	    return new FeatureFlag(
	      e[FeatureFlag.ss.rs],
	      e[FeatureFlag.ss.Jr],
	      e[FeatureFlag.ss.Nr],
	      e[FeatureFlag.ss.Or],
	    );
	  E$1.info(
	    `Unable to deserialize feature flag from ${JSON.stringify(e, null, 2)}`,
	  );
	}

	class ar extends t {
	  constructor(t, s, i, e) {
	    super(),
	      (this.h = t),
	      (this.j = s),
	      (this.B = i),
	      (this.C = e),
	      (this.Xr = []),
	      (this.Gr = 0),
	      (this.h = t),
	      (this.j = s),
	      (this.B = i),
	      (this.C = e),
	      (this.Kr = null),
	      (this.Qr = new m()),
	      (this.S = 10),
	      (this.T = null),
	      (this.I = null),
	      r.q(this.Qr);
	  }
	  N(t) {
	    var s;
	    if (
	      (null === (s = this.h) || void 0 === s ? void 0 : s.Yr()) &&
	      null != t &&
	      t.feature_flags
	    ) {
	      this.Xr = [];
	      for (const s of t.feature_flags) {
	        const t = newFeatureFlagFromJson(s);
	        t && this.Xr.push(t);
	      }
	      (this.Gr = new Date().getTime()), this.Zr(), this.Qr.L(this.Xr);
	    }
	  }
	  ho() {
	    let t = {};
	    this.B && (t = this.B.dt(STORAGE_KEYS.ft.lo));
	    const i = {};
	    for (const s in t) {
	      const e = newFeatureFlagFromSerializedValue(t[s]);
	      e && (i[e.id] = e);
	    }
	    return i;
	  }
	  do() {
	    var t;
	    return (
	      (null === (t = this.B) || void 0 === t ? void 0 : t.dt(STORAGE_KEYS.ft.vo)) || {}
	    );
	  }
	  Fo(t) {
	    this.B && this.B.bt(STORAGE_KEYS.ft.vo, t);
	  }
	  It(t) {
	    return this.Qr.Rt(t);
	  }
	  refreshFeatureFlags(t, s, i = !1, e = !0) {
	    const r = () => {
	      "function" == typeof s && s(), this.Qr.L(this.Xr);
	    };
	    if (!this.po(i))
	      return (
	        !this.Kr &&
	          this.h &&
	          (this.Kr = this.h.jo(() => {
	            this.refreshFeatureFlags(t, s);
	          })),
	        void r()
	      );
	    const o = this.j;
	    if (!o) return void r();
	    e && this.X();
	    const n = o.$({}, !0),
	      f = o.A(n, h.H.wo);
	    let m = !1;
	    o.J(
	      n,
	      (e = -1) => {
	        const o = this.j;
	        if (!o) return void r();
	        const v = new Date().valueOf();
	        h.K(this.B, h.H.wo, v),
	          -1 !== e && f.push(["X-Braze-Req-Tokens-Remaining", e.toString()]),
	          l.O({
	            url: `${o.V()}/feature_flags/sync`,
	            headers: f,
	            data: n,
	            W: (s) => {
	              if (!o.Y(n, s, f)) return (m = !0), void r();
	              o.Z(), this.N(s), (m = !1), "function" == typeof t && t();
	            },
	            error: (t) => {
	              o._(t, "retrieving feature flags"), (m = !0), r();
	            },
	            tt: (e, r) => {
	              var n, l, f;
	              let v;
	              if (m) {
	                const t =
	                    (null === (n = this.h) || void 0 === n ? void 0 : n.st()) ||
	                    REQUEST_BACKOFF_MIN_SLEEP_MS_DEFAULT,
	                  s =
	                    (null === (l = this.h) || void 0 === l ? void 0 : l.it()) ||
	                    REQUEST_BACKOFF_SCALE_FACTOR_DEFAULT,
	                  i =
	                    (null === (f = this.h) || void 0 === f ? void 0 : f.nt()) ||
	                    REQUEST_BACKOFF_MAX_SLEEP_MS_DEFAULT;
	                let e = this.T;
	                (null == e || e < t) && (e = t), (v = Math.min(i, randomInclusive(t, e * s)));
	              }
	              o.et(
	                r,
	                () => {
	                  this.refreshFeatureFlags(t, s, i, !0);
	                },
	                h.H.wo,
	                (t) => this.rt(t),
	                () => this.X(),
	                v,
	              );
	            },
	          });
	      },
	      h.H.wo,
	      s,
	    );
	  }
	  X() {
	    null != this.I && (clearTimeout(this.I), (this.I = null));
	  }
	  rt(t) {
	    this.X(), (this.I = t);
	  }
	  po(t) {
	    if (!this.h) return !1;
	    if (!t) {
	      const t = this.h.yo();
	      if (null == t) return !1;
	      let s = !1;
	      if (!isNaN(t)) {
	        if (-1 === t) return E$1.info("Feature flag refreshes not allowed"), !1;
	        s = new Date().getTime() >= (this.Gr || 0) + 1e3 * t;
	      }
	      if (!s)
	        return (
	          E$1.info(`Feature flag refreshes were rate limited to ${t} seconds`), !1
	        );
	    }
	    return this.h.Yr();
	  }
	  bo() {
	    var t;
	    return (
	      (null === (t = this.B) || void 0 === t ? void 0 : t.dt(STORAGE_KEYS.ft.Co)) || null
	    );
	  }
	  Ro() {
	    var t, i;
	    null === (t = this.B) ||
	      void 0 === t ||
	      t.bt(STORAGE_KEYS.ft.Co, null === (i = this.C) || void 0 === i ? void 0 : i.yt());
	  }
	  To() {
	    var t;
	    const s = null === (t = this.C) || void 0 === t ? void 0 : t.yt(),
	      i = this.bo();
	    return null == i || s === i;
	  }
	  Zr() {
	    if (!this.B) return;
	    const t = {};
	    for (const s of this.Xr) {
	      const i = s.gt();
	      t[s.id] = i;
	    }
	    this.B.bt(STORAGE_KEYS.ft.lo, t), this.B.bt(STORAGE_KEYS.ft.Do, this.Gr), this.Ro();
	  }
	  changeUser() {
	    this.X();
	  }
	  clearData() {
	    this.X();
	  }
	}

	const lr = {
	  i: !1,
	  provider: null,
	  o: () => (
	    lr.t(),
	    lr.provider ||
	      ((lr.provider = new ar(r.l(), r.m(), r.p(), r.u())), r.v(lr.provider)),
	    lr.provider
	  ),
	  t: () => {
	    lr.i || (r.g(lr), (lr.i = !0));
	  },
	  destroy: () => {
	    (lr.provider = null), (lr.i = !1);
	  },
	};
	var lr$1 = lr;

	function fr(e, t, a = !1) {
	  if (r.rr()) return lr$1.o().refreshFeatureFlags(e, t, a);
	}
	function refreshFeatureFlags(r, e) {
	  fr(r, e);
	}

	var refreshFeatureFlags$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		refreshFeatureFlags: refreshFeatureFlags,
		'default': fr
	});

	function getFeatureFlag(t) {
	  if (!r.rr()) return;
	  const e = r.l();
	  if (e && !e.Yr()) return null;
	  const n = lr$1.o().ho();
	  return n[t] ? n[t] : null;
	}

	function getAllFeatureFlags() {
	  if (!r.rr()) return;
	  const t = [],
	    e = r.l();
	  if (e && !e.Yr()) return t;
	  const n = lr$1.o().ho();
	  for (const r in n) t.push(n[r]);
	  return t;
	}

	function subscribeToFeatureFlagsUpdates(t) {
	  if (!r.rr()) return;
	  const e = lr$1.o();
	  if (e.To()) {
	    const r = getAllFeatureFlags();
	    r && "function" == typeof t && t(r);
	  }
	  return e.It(t);
	}

	function logFeatureFlagImpression(e) {
	  if (!r.rr()) return;
	  if (!e) return !1;
	  const t =
	      "Not logging a feature flag impression. The feature flag was not part of any matching experiment.",
	    o = lr$1.o().ho();
	  if (!o[e]) return E$1.info(t), !1;
	  const n = o[e].trackingString;
	  if (!n) return E$1.info(t), !1;
	  const i = lr$1.o().do();
	  if (i[n])
	    return (
	      E$1.info(
	        "Not logging another feature flag impression. This ID was already logged this session.",
	      ),
	      !1
	    );
	  (i[n] = !0), lr$1.o().Fo(i);
	  const s = { fid: e, fts: n };
	  return v$1.lt(f.xo, s).W;
	}

	class Banner extends PropertiesBase {
	  constructor(t, s, i, h = !1, r = !1, e = -1, o = {}) {
	    super(o),
	      (this.id = t),
	      (this.placementId = s),
	      (this.html = i),
	      (this.At = h),
	      (this.isControl = r),
	      (this.Et = e),
	      (this.id = t),
	      (this.placementId = s),
	      (this.html = i),
	      (this.At = h),
	      (this.isControl = r),
	      (this.Et = e),
	      (this.Gt = !1);
	  }
	  Ht() {
	    return this.isControl;
	  }
	  gt() {
	    return {
	      id: this.id,
	      pid: this.placementId,
	      html: this.html,
	      its: this.At,
	      ic: this.isControl,
	      eat: this.Et,
	      pr: this.properties,
	    };
	  }
	}

	function newBannerFromSerializedValue(n) {
	  return new Banner(n.id, n.pid, n.html, n.its, n.ic, n.eat, n.pr);
	}
	function newBannerFromJson(n) {
	  return new Banner(
	    n.id,
	    n.placement_id,
	    n.html,
	    n.is_test_send,
	    n.is_control,
	    n.expires_at,
	    n.properties,
	  );
	}

	class e extends t {
	  constructor(t, s, i, n) {
	    super(),
	      (this.h = t),
	      (this.j = s),
	      (this.B = i),
	      (this.C = n),
	      (this.banners = {}),
	      (this.h = t),
	      (this.j = s),
	      (this.B = i),
	      (this.C = n),
	      (this.S = 10),
	      (this.T = null),
	      (this.I = null),
	      (this.R = new m()),
	      r.q(this.R),
	      (this.D = null),
	      (this.F = null);
	  }
	  N(t) {
	    if (this.k() && null != t && t.banners) {
	      this.banners = {};
	      const s = t.banners;
	      for (const t in s) {
	        const i = s[t];
	        let e = null;
	        null != i && null != i.banner && (e = newBannerFromJson(i.banner)),
	          e && (this.banners[t] = e);
	      }
	      this.U(), this.R.L(this.banners);
	    }
	  }
	  M(t, s, i, n = !0) {
	    var e;
	    const r = () => {
	      "function" == typeof i && i();
	    };
	    if (!this.k())
	      return void (
	        null === (e = this.h) ||
	        void 0 === e ||
	        e.P(() => {
	          this.M(t, s, i);
	        })
	      );
	    const o = this.j;
	    if (!o) return void r();
	    n && this.X();
	    const m = o.$({}, !0),
	      v = [];
	    for (const s of t) v.push({ id: s });
	    m.placements = v;
	    const f = o.A(m, h.H.G);
	    let p = !1;
	    o.J(
	      m,
	      (n = -1) => {
	        const e = this.j;
	        if (!e) return void r();
	        const o = new Date().valueOf();
	        h.K(this.B, h.H.G, o),
	          -1 !== n && f.push(["X-Braze-Req-Tokens-Remaining", n.toString()]),
	          l.O({
	            url: `${e.V()}/banners/sync`,
	            headers: f,
	            data: m,
	            W: (t) => {
	              if (!e.Y(m, t, f)) return (p = !0), void r();
	              e.Z(), this.N(t), (p = !1), "function" == typeof s && s();
	            },
	            error: (t) => {
	              e._(t, "retrieving banners"), (p = !0), r();
	            },
	            tt: (n, r) => {
	              var o, l, m;
	              let v;
	              if (((this.F = t), p)) {
	                const t =
	                    (null === (o = this.h) || void 0 === o ? void 0 : o.st()) ||
	                    REQUEST_BACKOFF_MIN_SLEEP_MS_DEFAULT,
	                  s =
	                    (null === (l = this.h) || void 0 === l ? void 0 : l.it()) ||
	                    REQUEST_BACKOFF_SCALE_FACTOR_DEFAULT,
	                  i =
	                    (null === (m = this.h) || void 0 === m ? void 0 : m.nt()) ||
	                    REQUEST_BACKOFF_MAX_SLEEP_MS_DEFAULT;
	                let n = this.T;
	                (null == n || n < t) && (n = t), (v = Math.min(i, randomInclusive(t, n * s)));
	              }
	              e.et(
	                r,
	                () => {
	                  this.M(t, s, i, !1);
	                },
	                h.H.G,
	                (t) => this.rt(t),
	                () => this.X(),
	                v,
	              );
	            },
	          });
	      },
	      h.H.G,
	      i,
	    );
	  }
	  ot() {
	    return this.F;
	  }
	  ht(t, s) {
	    const i = { id: t.id };
	    s && (i.bid = s);
	    return v$1.lt(f.ut, i).W;
	  }
	  X() {
	    null != this.I && (clearTimeout(this.I), (this.I = null));
	  }
	  rt(t) {
	    this.X(), (this.I = t);
	  }
	  ct() {
	    let t = {};
	    this.B && (t = this.B.dt(STORAGE_KEYS.ft.vt));
	    const i = {};
	    for (const s in t) {
	      let n = null;
	      null != t[s] && (n = newBannerFromSerializedValue(t[s])), n && (i[n.placementId] = n);
	    }
	    return i;
	  }
	  U() {
	    var t;
	    if (!this.B) return;
	    const i = {};
	    for (const s in this.banners) {
	      const n =
	        (null === (t = this.banners[s]) || void 0 === t ? void 0 : t.gt()) ||
	        null;
	      i[s] = n;
	    }
	    this.B.bt(STORAGE_KEYS.ft.vt, i), this.jt();
	  }
	  jt() {
	    var t, i;
	    null === (t = this.B) ||
	      void 0 === t ||
	      t.bt(STORAGE_KEYS.ft.Bt, null === (i = this.C) || void 0 === i ? void 0 : i.yt());
	  }
	  Ct() {
	    var t;
	    return (
	      (null === (t = this.B) || void 0 === t ? void 0 : t.dt(STORAGE_KEYS.ft.Bt)) || null
	    );
	  }
	  St() {
	    return this.D;
	  }
	  wt(t) {
	    this.D = t;
	  }
	  Tt() {
	    var t;
	    const s = null === (t = this.C) || void 0 === t ? void 0 : t.yt(),
	      i = this.Ct();
	    return null == i || s === i;
	  }
	  It(t) {
	    return this.R.Rt(t);
	  }
	  qt() {
	    var t;
	    return (
	      (null === (t = this.B) || void 0 === t ? void 0 : t.dt(STORAGE_KEYS.ft.Dt)) || {}
	    );
	  }
	  Ft(t) {
	    this.B && this.B.bt(STORAGE_KEYS.ft.Dt, t);
	  }
	  changeUser() {
	    this.Nt(), this.X();
	  }
	  clearData() {
	    this.X();
	  }
	  k() {
	    return !!this.h && (!!this.h.kt() || (0 !== this.h.xt() && this.Nt(), !1));
	  }
	  Nt() {
	    (this.banners = {}),
	      this.B && (this.B.zt(STORAGE_KEYS.ft.vt), this.B.zt(STORAGE_KEYS.ft.Dt)),
	      this.R.L({});
	  }
	}

	const i = {
	  i: !1,
	  provider: null,
	  o: () => (
	    i.t(),
	    i.provider ||
	      ((i.provider = new e(r.l(), r.m(), r.p(), r.u())), r.v(i.provider)),
	    i.provider
	  ),
	  t: () => {
	    i.i || (r.g(i), (i.i = !0));
	  },
	  destroy: () => {
	    (i.provider = null), (i.i = !1);
	  },
	};

	function getBannerIfNotExpired(n, r) {
	  const e = n[r];
	  if (!e) return null;
	  const t = e.Et,
	    o = new Date().valueOf();
	  return -1 !== t && 1e3 * t < o
	    ? (E$1.info(`Banner with ID: ${e.id} and placement ID: ${r} has expired.`),
	      null)
	    : e;
	}
	function getBanner(n) {
	  var e;
	  if (!r.rr()) return;
	  !1 === (null === (e = r.l()) || void 0 === e ? void 0 : e.kt()) &&
	    E$1.error(BannerStrings.aa);
	  const t = i.o();
	  if (!t.k()) return null;
	  return getBannerIfNotExpired(t.ct(), n);
	}

	function logBannerClick(n, o) {
	  if (!r.rr()) return;
	  if (!(n instanceof Banner))
	    return (
	      E$1.error("Banner argument to logBannerClick must be an Banner object."), !1
	    );
	  const e = i.o(),
	    t = e.ct();
	  return 0 === keys(t).length
	    ? (E$1.info("Not logging banner click. No banners exist."), !1)
	    : t[n.placementId]
	    ? e.ht(n, o)
	    : (E$1.info(
	        `Not logging banner click for ID ${n.placementId}. The placement ID did not correspond to any banner.`,
	      ),
	      !1);
	}

	const BANNER_PLACEMENT_ID = "data-ab-banner-placement-id";
	const BANNER_HTML_CLASS = "ab-html-banner";
	const CONTROL_BANNER_HTML_CLASS = "ab-html-control-banner";
	function controlBannerToHtml(n) {
	  const t = document.createElement("div");
	  return (
	    (t.id = n.id),
	    (t.className = "ab-html-control-banner"),
	    t.setAttribute(BANNER_PLACEMENT_ID, n.placementId),
	    t
	  );
	}
	function bannerToHtml(n, t) {
	  if (n.Ht()) return controlBannerToHtml(n);
	  const e = document.createElement("iframe");
	  return (
	    (e.id = n.id),
	    t && e.setAttribute("nonce", t),
	    (e.className = "ab-html-banner"),
	    e.setAttribute(BANNER_PLACEMENT_ID, n.placementId),
	    e.setAttribute("title", "Banner"),
	    attachHtmlToIframeWithNonce(e, n.html, t),
	    (e.onload = () => {
	      const t = e.contentWindow,
	        o = t.document.getElementsByTagName("title");
	      o && o.length > 0 && e.setAttribute("title", o[0].textContent || "");
	      const r = Object.assign(Object.assign({}, buildBrazeBridge(e)), {
	        logClick: function () {
	          logBannerClick(n, ...arguments);
	        },
	        closeMessage: function () {},
	        setBannerHeight: (n) => {
	          isNaN(n) || !isFinite(n) || n < 0
	            ? E$1.warn(`Invalid banner height: ${n}`)
	            : (e.style.height = `${n}px`);
	        },
	      });
	      (t.brazeBridge = r),
	        (t.appboyBridge = r),
	        t.dispatchEvent(new CustomEvent("ab.BridgeReady"));
	    }),
	    e
	  );
	}

	function destroyBannerHtml(o) {
	  const r = o.getAttribute(BannerStrings.ea);
	  null != r && removeSubscription(r),
	    o && o.parentNode && o.parentNode.removeChild(o);
	}

	function logBannerImpressions(o) {
	  if (!r.rr()) return;
	  if (!o || o.length <= 0) return !1;
	  const n = i.o(),
	    s = n.ct();
	  if (0 === keys(s).length)
	    return E$1.info("Not logging banners impression. No banners exist."), !1;
	  const e = n.qt(),
	    t = [];
	  for (const r of o) {
	    const o = s[r];
	    o
	      ? e[o.placementId]
	        ? E$1.info(
	            `Not logging banners impression for ID ${r}. This ID was already logged this session.`,
	          )
	        : ((e[o.placementId] = !0), t.push(o.id))
	      : E$1.info(
	          `Not logging banners impression for ID ${r}. The placement ID did not correspond to any banner.`,
	        );
	  }
	  if (0 === t.length) return !1;
	  n.Ft(e);
	  const a = { ids: t };
	  return v$1.lt(f.ro, a).W;
	}

	function detectBannerImpressions() {
	  const o = document.querySelectorAll(`.${BANNER_HTML_CLASS}, .${CONTROL_BANNER_HTML_CLASS}`),
	    t = [];
	  for (let n = 0; n < o.length; n++) {
	    const s = o[n],
	      i = s.getAttribute(BANNER_PLACEMENT_ID);
	    if (!i) continue;
	    const m = detectImpression.oo(s),
	      r = detectImpression.no(s);
	    if (m && r) continue;
	    const e = topIsInView(s),
	      c = bottomIsInView(s);
	    e && !m && impressOnTop(s), c && !r && impressOnBottom(s), detectImpression.oo(s) && detectImpression.no(s) && t.push(i);
	  }
	  t.length > 0 && logBannerImpressions(t);
	}

	function getAllBanners() {
	  if (!r.rr()) return;
	  const n = {},
	    o = r.l();
	  if (
	    (!1 === (null == o ? void 0 : o.kt()) && E$1.error(BannerStrings.aa),
	    !(null == o ? void 0 : o.kt()))
	  )
	    return n;
	  const t = i.o().ct();
	  for (const r in t) n[r] = getBannerIfNotExpired(t, r);
	  return n;
	}

	function subscribeToBannersUpdates(n) {
	  var o;
	  if (!r.rr()) return;
	  const t = i.o();
	  if (t.Tt()) {
	    const r = getAllBanners();
	    r && "function" == typeof n && n(r);
	  }
	  const s = t.It(n);
	  if (!t.St()) {
	    const n =
	      null === (o = r.nn()) || void 0 === o
	        ? void 0
	        : o.rn(() => {
	            const n = t.ot();
	            n && n.length > 0 && t.M(n);
	          });
	    n && t.wt(n);
	  }
	  return s;
	}

	function insertBanner(e, n) {
	  if (!r.rr()) return;
	  if (!e) return void E$1.error("Not inserting banner: banner was not provided.");
	  if (!n)
	    return void E$1.error("Not inserting banner: parentNode was not provided.");
	  if (!r.re(D.te))
	    return void E$1.error(
	      "Banners are disabled. Use the 'allowUserSuppliedJavascript' option for braze.initialize to enable these messages.",
	    );
	  setupBannerUI();
	  const o = bannerToHtml(e, r.re(D.er)),
	    s = subscribeToBannersUpdates((s) => {
	      const i = s[e.placementId];
	      i ? n.replaceChildren(bannerToHtml(i, r.re(D.er))) : destroyBannerHtml(o);
	    });
	  s && o.setAttribute(BannerStrings.ea, s),
	    n.replaceChildren(o),
	    addPassiveEventListener(window, "scroll", detectBannerImpressions),
	    detectBannerImpressions();
	}

	function requestBannersRefresh(e, t, o) {
	  if (!r.rr()) return void E$1.warn(CoreStrings.ee);
	  const s = r.l();
	  if (!s) return;
	  if (!isArray(e) || 0 === e.length)
	    return void E$1.warn("placementIds should be a non-empty array.");
	  if (!r.re(D.te))
	    return void E$1.error(
	      "Banners are disabled. Use the 'allowUserSuppliedJavascript' option for braze.initialize to enable these messages.",
	    );
	  const n = i.o();
	  if ((!1 === s.kt() && E$1.error(BannerStrings.aa), !n.k()))
	    return void s.P(() => {
	      requestBannersRefresh(e, t, o);
	    });
	  const a = s.oe();
	  e.length > a &&
	    (E$1.warn(
	      `Number of placement IDs requested exceeds the max allowed. Trimming placementIds array from length ${e.length} to ${a} (max allowed).`,
	    ),
	    (e = e.slice(0, a))),
	    0 !==
	      (e = e.filter(
	        (e) =>
	          !!isValidBannerPlacementId(e) ||
	          (E$1.warn(
	            `Placement ID should be a valid utf8 string with no whitespaces, filtering out: ${e}`,
	          ),
	          !1),
	      )).length &&
	      (E$1.info(`Requesting banners for placement IDs: ${JSON.stringify(e)}`),
	      n.M(e, t, o));
	}

	var src = /*#__PURE__*/Object.freeze({
		__proto__: null,
		WindowUtils: WindowUtils,
		logCardDismissal: logCardDismissal,
		logContentCardImpressions: logContentCardImpressions,
		logContentCardClick: logContentCardClick,
		Card: Card,
		ImageOnly: ImageOnly,
		CaptionedImage: CaptionedImage,
		ClassicCard: ClassicCard,
		ControlCard: ControlCard,
		ContentCards: ContentCards,
		getCachedContentCards: getCachedContentCards,
		hideContentCards: hideContentCards,
		requestContentCardsRefresh: requestContentCardsRefresh,
		showContentCards: showContentCards,
		subscribeToContentCardsUpdates: subscribeToContentCardsUpdates,
		toggleContentCards: toggleContentCards,
		addSdkMetadata: addSdkMetadata,
		changeUser: changeUser,
		destroy: destroy,
		BrazeSdkMetadata: BrazeSdkMetadata,
		DeviceProperties: DeviceProperties,
		disableSDK: disableSDK,
		enableSDK: enableSDK,
		getDeviceId: getDeviceId,
		getUser: getUser,
		initialize: initialize,
		isDisabled: isDisabled,
		isInitialized: isInitialized,
		logCustomEvent: logCustomEvent,
		logPurchase: logPurchase,
		openSession: openSession,
		removeAllSubscriptions: removeAllSubscriptions,
		removeSubscription: removeSubscription,
		requestImmediateDataFlush: requestImmediateDataFlush,
		setLogger: setLogger,
		setSdkAuthenticationSignature: setSdkAuthenticationSignature,
		subscribeToSdkAuthenticationFailures: subscribeToSdkAuthenticationFailures,
		toggleLogging: toggleLogging,
		wipeData: wipeData,
		handleBrazeAction: handleBrazeAction,
		InAppMessage: InAppMessage,
		InAppMessageButton: InAppMessageButton,
		ControlMessage: ControlMessage,
		FullScreenMessage: FullScreenMessage,
		HtmlMessage: HtmlMessage,
		ModalMessage: ModalMessage,
		SlideUpMessage: SlideUpMessage,
		automaticallyShowInAppMessages: automaticallyShowInAppMessages,
		logInAppMessageButtonClick: logInAppMessageButtonClick,
		logInAppMessageClick: logInAppMessageClick,
		logInAppMessageHtmlClick: logInAppMessageHtmlClick,
		logInAppMessageImpression: logInAppMessageImpression,
		showInAppMessage: showInAppMessage,
		subscribeToInAppMessage: subscribeToInAppMessage,
		deferInAppMessage: deferInAppMessage,
		getDeferredInAppMessage: getDeferredInAppMessage,
		isPushBlocked: isPushBlocked,
		isPushPermissionGranted: isPushPermissionGranted,
		isPushSupported: isPushSupported,
		requestPushPermission: requestPushPermission,
		unregisterPush: unregisterPush,
		User: User,
		FeatureFlag: FeatureFlag,
		refreshFeatureFlags: refreshFeatureFlags,
		getFeatureFlag: getFeatureFlag,
		subscribeToFeatureFlagsUpdates: subscribeToFeatureFlagsUpdates,
		getAllFeatureFlags: getAllFeatureFlags,
		logFeatureFlagImpression: logFeatureFlagImpression,
		Banner: Banner,
		getBanner: getBanner,
		insertBanner: insertBanner,
		requestBannersRefresh: requestBannersRefresh,
		getAllBanners: getAllBanners,
		subscribeToBannersUpdates: subscribeToBannersUpdates,
		logBannerImpressions: logBannerImpressions,
		logBannerClick: logBannerClick
	});

	var require$$0 = /*@__PURE__*/getAugmentedNamespace(src);

	window.braze = require$$0;
	//  Copyright 2015 mParticle, Inc.
	//
	//  Licensed under the Apache License, Version 2.0 (the "License");
	//  you may not use this file except in compliance with the License.
	//  You may obtain a copy of the License at
	//
	//      http://www.apache.org/licenses/LICENSE-2.0
	//
	//  Unless required by applicable law or agreed to in writing, software
	//  distributed under the License is distributed on an "AS IS" BASIS,
	//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	//  See the License for the specific language governing permissions and
	//  limitations under the License.

	// This should remain Appboy and not Braze until the core SDK is able to parse the moduleID and not the name (go.mparticle.com/work/SQDSDKS-4655)
	var name = 'Appboy',
	    suffix = 'v6',
	    moduleId = 28,
	    version = '6.0.0',
	    MessageType = {
	        PageView: 3,
	        PageEvent: 4,
	        Commerce: 16,
	    },
	    CommerceEventType = mParticle.CommerceEventType;

	var clusterMapping = {
	    '01': 'sdk.iad-01.braze.com',
	    '02': 'sdk.iad-02.braze.com',
	    '03': 'sdk.iad-03.braze.com',
	    '04': 'sdk.iad-04.braze.com',
	    '05': 'sdk.iad-05.braze.com',
	    '06': 'sdk.iad-06.braze.com',
	    '07': 'sdk.iad-07.braze.com',
	    '08': 'sdk.iad-08.braze.com',
	    EU: 'sdk.fra-01.braze.eu',
	    EU02: 'sdk.fra-02.braze.eu',
	    AU: 'sdk.au-01.braze.com',
	};

	var constructor = function() {
	    var self = this,
	        forwarderSettings,
	        options = {},
	        reportingService,
	        hasConsentMappings,
	        parsedConsentMappings,
	        parsedSubscriptionGroupMapping = {},
	        mpCustomFlags;

	    self.name = name;
	    self.suffix = suffix;

	    var DefaultAttributeMethods = {
	        $LastName: 'setLastName',
	        $FirstName: 'setFirstName',
	        Email: 'setEmail',
	        $Gender: 'setGender',
	        $Country: 'setCountry',
	        $City: 'setHomeCity',
	        $Mobile: 'setPhoneNumber',
	        $Age: 'setDateOfBirth',
	        last_name: 'setLastName',
	        first_name: 'setFirstName',
	        email: 'setEmail',
	        gender: 'setGender',
	        country: 'setCountry',
	        home_city: 'setHomeCity',
	        email_subscribe: 'setEmailNotificationSubscriptionType',
	        push_subscribe: 'setPushNotificationSubscriptionType',
	        phone: 'setPhoneNumber',
	        dob: 'setDateOfBirth',
	    };

	    var bundleCommerceEventData = false;
	    var forwardSkuAsProductName = false;

	    var brazeConsentKeys = [
	        '$google_ad_user_data',
	        '$google_ad_personalization',
	    ];

	    var latestUserBrazeConsentString;

	    // A purchase event can either log a single event with all products
	    // or multiple purchase events (one per product)
	    function logPurchaseEvent(event) {
	        var reportEvent = false;

	        if (bundleCommerceEventData) {
	            reportEvent = logSinglePurchaseEventWithProducts(event);
	        } else {
	            reportEvent = logPurchaseEventPerProduct(event);
	        }
	        return reportEvent === true;
	    }

	    function logSinglePurchaseEventWithProducts(event) {
	        var quantity = 1;
	        var eventAttributes = mergeObjects(event.EventAttributes, {
	            products: [],
	        });
	        var eventName = getCommerceEventName(event.EventCategory);

	        // All commerce events except for promotion/impression events will have a
	        // ProductAction property, but if this ever changes in the future, this
	        // check will prevent errors
	        if (!event.ProductAction) {
	            return false;
	        }

	        if (event.ProductAction.TransactionId) {
	            eventAttributes['Transaction Id'] =
	                event.ProductAction.TransactionId;
	        }

	        if (
	            event.ProductAction.ProductList &&
	            event.ProductAction.ProductList.length
	        ) {
	            eventAttributes.products = addProducts(
	                event.ProductAction.ProductList
	            );
	        }

	        kitLogger(
	            'braze.logPurchase',
	            eventName,
	            event.ProductAction.TotalAmount,
	            event.CurrencyCode,
	            quantity,
	            eventAttributes
	        );

	        var reportEvent = braze.logPurchase(
	            eventName,
	            event.ProductAction.TotalAmount,
	            event.CurrencyCode,
	            quantity,
	            eventAttributes
	        );

	        return reportEvent === true;
	    }

	    function logPurchaseEventPerProduct(event) {
	        var reportEvent = false;
	        if (event.ProductAction.ProductList) {
	            event.ProductAction.ProductList.forEach(function(product) {
	                var productName;

	                if (forwardSkuAsProductName) {
	                    productName = product.Sku;
	                } else {
	                    productName = product.Name;
	                }
	                var sanitizedProductName = getSanitizedValueForBraze(
	                    productName
	                );

	                if (product.Attributes == null) {
	                    product.Attributes = {};
	                }

	                product.Attributes['Sku'] = product.Sku;

	                var productAttributes = mergeObjects(product.Attributes, {
	                    'Transaction Id': event.ProductAction.TransactionId,
	                });

	                var sanitizedProperties = getSanitizedCustomProperties(
	                    productAttributes
	                );

	                if (sanitizedProperties == null) {
	                    return (
	                        'Properties did not pass validation for ' +
	                        sanitizedProductName
	                    );
	                }
	                var price = parseFloat(product.Price);

	                kitLogger(
	                    'braze.logPurchase',
	                    sanitizedProductName,
	                    price,
	                    event.CurrencyCode,
	                    product.Quantity,
	                    sanitizedProperties
	                );

	                reportEvent = braze.logPurchase(
	                    sanitizedProductName,
	                    price,
	                    event.CurrencyCode,
	                    product.Quantity,
	                    sanitizedProperties
	                );
	            });
	        }
	        return reportEvent === true;
	    }

	    function getCommerceEventName(eventType) {
	        const eventNamePrefix = 'eCommerce';
	        let eventName;

	        switch (eventType) {
	            case CommerceEventType.ProductAddToCart:
	                eventName = 'add_to_cart';
	                break;
	            case CommerceEventType.ProductRemoveFromCart:
	                eventName = 'remove_from_cart';
	                break;
	            case CommerceEventType.ProductCheckout:
	                eventName = 'checkout';
	                break;
	            case CommerceEventType.ProductCheckoutOption:
	                eventName = 'checkout_option';
	                break;
	            case CommerceEventType.ProductClick:
	                eventName = 'click';
	                break;
	            case CommerceEventType.ProductViewDetail:
	                eventName = 'view_detail';
	                break;
	            case CommerceEventType.ProductPurchase:
	                eventName = 'purchase';
	                break;
	            case CommerceEventType.ProductRefund:
	                eventName = 'refund';
	                break;
	            case CommerceEventType.ProductAddToWishlist:
	                eventName = 'add_to_wishlist';
	                break;
	            case CommerceEventType.ProductRemoveFromWishlist:
	                eventName = 'remove_from_wishlist';
	                break;
	            case CommerceEventType.PromotionView:
	                eventName = 'view';
	                break;
	            case CommerceEventType.PromotionClick:
	                eventName = 'click';
	                break;
	            case CommerceEventType.ProductImpression:
	                eventName = 'Impression';
	                break;
	            default:
	                eventName = 'unknown';
	                break;
	        }
	        return [eventNamePrefix, eventName].join(' - ');
	    }

	    function logBrazePageViewEvent(event) {
	        var sanitizedEventName,
	            sanitizedAttrs,
	            eventName,
	            attrs = event.EventAttributes || {};

	        attrs.hostname = window.location.hostname;
	        attrs.title = window.document.title;

	        if (forwarderSettings.setEventNameForPageView === 'True') {
	            eventName = event.EventName;
	        } else {
	            eventName = window.location.pathname;
	        }
	        sanitizedEventName = getSanitizedValueForBraze(eventName);
	        sanitizedAttrs = getSanitizedCustomProperties(attrs);

	        kitLogger('braze.logCustomEvent', sanitizedEventName, sanitizedAttrs);

	        var reportEvent = braze.logCustomEvent(
	            sanitizedEventName,
	            sanitizedAttrs
	        );
	        return reportEvent === true;
	    }

	    function setDefaultAttribute(key, value) {
	        if (key === 'dob') {
	            if (!(value instanceof Date)) {
	                return (
	                    "Can't call removeUserAttribute or setUserAttribute on forwarder " +
	                    name +
	                    ", removeUserAttribute or setUserAttribute must set 'dob' to a date"
	                );
	            } else {
	                kitLogger(
	                    'braze.getUser().setDateOfBirth',
	                    value.getFullYear(),
	                    value.getMonth() + 1,
	                    value.getDate()
	                );

	                braze
	                    .getUser()
	                    .setDateOfBirth(
	                        value.getFullYear(),
	                        value.getMonth() + 1,
	                        value.getDate()
	                    );
	            }
	        } else if (key === '$Age') {
	            if (typeof value === 'number') {
	                var year = new Date().getFullYear() - value;

	                kitLogger('braze.getUser().setDateOfBirth', year, 1, 1);

	                braze.getUser().setDateOfBirth(year, 1, 1);
	            } else {
	                return '$Age must be a number';
	            }
	        } else {
	            if (value == null) {
	                value = '';
	            }
	            if (!(typeof value === 'string')) {
	                return (
	                    "Can't call removeUserAttribute or setUserAttribute on forwarder " +
	                    name +
	                    ', removeUserAttribute or setUserAttribute must set this value to a string'
	                );
	            }
	            var params = [];
	            params.push(value);

	            kitLogger(
	                'braze.getUser().' + DefaultAttributeMethods[key],
	                params
	            );

	            var u = braze.getUser();

	            //This method uses the setLastName, setFirstName, setEmail, setCountry, setHomeCity, setPhoneNumber, setAvatarImageUrl, setDateOfBirth, setGender, setEmailNotificationSubscriptionType, and setPushNotificationSubscriptionType methods
	            if (!u[DefaultAttributeMethods[key]].apply(u, params)) {
	                return (
	                    'removeUserAttribute or setUserAttribute on forwarder ' +
	                    name +
	                    ' failed to call, an invalid attribute value was passed in'
	                );
	            }
	        }
	    }

	    function logBrazeEvent(event) {
	        var sanitizedEventName = getSanitizedValueForBraze(event.EventName);
	        var sanitizedProperties = getSanitizedCustomProperties(
	            event.EventAttributes
	        );

	        if (sanitizedProperties == null) {
	            return (
	                'Properties did not pass validation for ' + sanitizedEventName
	            );
	        }

	        kitLogger(
	            'braze.logCustomEvent',
	            sanitizedEventName,
	            sanitizedProperties
	        );

	        var reportEvent = braze.logCustomEvent(
	            sanitizedEventName,
	            sanitizedProperties
	        );

	        return reportEvent === true;
	    }

	    /**************************/
	    /** Begin mParticle API **/
	    /**************************/
	    function processEvent(event) {
	        var reportEvent = false;
	        maybeSetConsentBeforeEventLogged(event);

	        if (event.EventDataType == MessageType.Commerce) {
	            reportEvent = logCommerceEvent(event);
	        } else if (event.EventDataType == MessageType.PageEvent) {
	            reportEvent = logBrazeEvent(event);
	        } else if (event.EventDataType == MessageType.PageView) {
	            if (forwarderSettings.forwardScreenViews == 'True') {
	                reportEvent = logBrazePageViewEvent(event);
	            }
	        } else {
	            return (
	                "Can't send event type to forwarder " +
	                name +
	                ', event type is not supported'
	            );
	        }

	        if (reportEvent === true && reportingService) {
	            reportingService(self, event);
	        }
	    }

	    // mParticle commerce events use different Braze methods depending on if they are
	    // a purchase event or a non-purchase commerce event
	    function logCommerceEvent(event) {
	        var reportEvent = false;
	        if (event.EventCategory === CommerceEventType.ProductPurchase) {
	            reportEvent = logPurchaseEvent(event);
	            return reportEvent === true;
	        } else {
	            reportEvent = logNonPurchaseCommerceEvent(event);
	            return reportEvent === true;
	        }
	    }

	    // A non-purchase commerce event can either log a single event with all products
	    // or one event per product when the commerce event is expanded
	    function logNonPurchaseCommerceEvent(event) {
	        if (bundleCommerceEventData) {
	            return logNonPurchaseCommerceEventWithProducts(event);
	        } else {
	            return logExpandedNonPurchaseCommerceEvents(event);
	        }
	    }

	    function logNonPurchaseCommerceEventWithProducts(mpEvent) {
	        const commerceEventAttrs = {};
	        const eventName = getCommerceEventName(mpEvent.EventCategory);

	        try {
	            switch (mpEvent.EventCategory) {
	                case CommerceEventType.PromotionClick:
	                case CommerceEventType.PromotionView:
	                    commerceEventAttrs.promotions = addPromotions(
	                        mpEvent.PromotionAction
	                    );
	                    break;
	                case CommerceEventType.ProductImpression:
	                    commerceEventAttrs.impressions = addImpressions(
	                        mpEvent.ProductImpressions
	                    );
	                    break;
	                default:
	                    if (mpEvent.ProductAction.ProductList) {
	                        commerceEventAttrs.products = addProducts(
	                            mpEvent.ProductAction.ProductList
	                        );
	                    }
	                    var transactionId = mpEvent.ProductAction.TransactionId;
	                    var totalAmount = mpEvent.ProductAction.TotalAmount;
	                    var taxAmount = mpEvent.ProductAction.TaxAmount;
	                    var shippingAmount = mpEvent.ProductAction.ShippingAmount;
	                    var affiliation = mpEvent.ProductAction.Affiliation;

	                    if (transactionId) {
	                        commerceEventAttrs['Transaction Id'] = transactionId;
	                    }
	                    if (totalAmount) {
	                        commerceEventAttrs['Total Amount'] = totalAmount;
	                    }
	                    if (taxAmount) {
	                        commerceEventAttrs['Tax Amount'] = taxAmount;
	                    }
	                    if (shippingAmount) {
	                        commerceEventAttrs['Shipping Amount'] = shippingAmount;
	                    }
	                    if (affiliation) {
	                        commerceEventAttrs['Affiliation'] = affiliation;
	                    }
	            }

	            var sanitizedProperties = getSanitizedCustomProperties(
	                mpEvent.EventAttributes
	            );

	            const brazeEvent = {
	                EventName: eventName,
	                EventAttributes: mergeObjects(
	                    commerceEventAttrs,
	                    sanitizedProperties
	                ),
	            };

	            var reportEvent = logBrazeEvent(brazeEvent);
	            return reportEvent;
	        } catch (err) {
	            return 'Error logging commerce event' + err.message;
	        }
	    }

	    function addPromotions(promotionAction) {
	        if (promotionAction && promotionAction.PromotionList) {
	            return promotionAction.PromotionList;
	        }
	        return [];
	    }

	    function addImpressions(productImpressions) {
	        if (productImpressions.length) {
	            return productImpressions.map(function(impression) {
	                return {
	                    'Product Impression List': impression.ProductImpressionList,
	                    products: addProducts(impression.ProductList),
	                };
	            });
	        } else {
	            return [];
	        }
	    }

	    function addProducts(productList) {
	        const productArray = [];
	        if (!productList || productList.length === 0) {
	            return productArray;
	        }

	        productList.forEach(function(product) {
	            {
	                var sanitizedProduct = parseProduct(
	                    getSanitizedCustomProperties(product)
	                );
	                productArray.push(sanitizedProduct);
	            }
	        });

	        return productArray;
	    }

	    function parseProduct(_product) {
	        var product = {};
	        for (var key in _product) {
	            switch (key) {
	                case 'Sku':
	                    product.Id = _product[key];
	                    break;
	                case 'Name':
	                    product.Name = forwardSkuAsProductName
	                        ? _product.Sku
	                        : _product.Name;
	                    break;
	                case 'CouponCode':
	                    product['Coupon Code'] = _product[key];
	                    break;
	                case 'TotalAmount':
	                    product['Total Product Amount'] = _product[key];
	                    break;
	                default:
	                    product[key] = _product[key];
	            }
	        }

	        return product;
	    }

	    function logExpandedNonPurchaseCommerceEvents(event) {
	        var reportEvent = false;
	        var listOfPageEvents = mParticle.eCommerce.expandCommerceEvent(event);
	        if (listOfPageEvents !== null) {
	            for (var i = 0; i < listOfPageEvents.length; i++) {
	                // finalLoopResult keeps track of if any logBrazeEvent in this loop returns true or not
	                var finalLoopResult = false;
	                try {
	                    reportEvent = logBrazeEvent(listOfPageEvents[i]);
	                    if (reportEvent === true) {
	                        finalLoopResult = true;
	                    }
	                } catch (err) {
	                    return 'Error logging page event' + err.message;
	                }
	            }
	            reportEvent = finalLoopResult === true;
	        }
	        return reportEvent;
	    }

	    function setSubscriptionGroups(key, value) {
	        var subscriptionGroupId = parsedSubscriptionGroupMapping[key];

	        if (typeof value !== 'boolean') {
	            kitLogger(
	                "Can't call setSubscriptionGroups on forwarder " +
	                    name +
	                    ', setSubscriptionGroups must set this value to a boolean'
	            );
	            return;
	        }

	        var action = value
	            ? 'addToSubscriptionGroup'
	            : 'removeFromSubscriptionGroup';
	        kitLogger('braze.getUser().' + action, subscriptionGroupId);
	        braze.getUser()[action](subscriptionGroupId);
	    }

	    function removeUserAttribute(key) {
	        if (!(key in DefaultAttributeMethods)) {
	            var sanitizedKey = getSanitizedValueForBraze(key);

	            kitLogger(
	                'braze.getUser().setCustomUserAttribute',
	                sanitizedKey,
	                null
	            );

	            braze.getUser().setCustomUserAttribute(sanitizedKey, null);
	        } else {
	            return setDefaultAttribute(key, null);
	        }
	    }

	    function setUserAttribute(key, value) {
	        if (key in DefaultAttributeMethods) {
	            return setDefaultAttribute(key, value);
	        }

	        if (parsedSubscriptionGroupMapping[key]) {
	            setSubscriptionGroups(key, value);
	            return;
	        }

	        var sanitizedKey = getSanitizedValueForBraze(key);
	        var sanitizedValue = getSanitizedValueForBraze(value);

	        if (value != null && sanitizedValue == null) {
	            return 'Value did not pass validation for ' + key;
	        }

	        kitLogger(
	            'braze.getUser().setCustomUserAttribute',
	            sanitizedKey,
	            sanitizedValue
	        );

	        braze.getUser().setCustomUserAttribute(sanitizedKey, sanitizedValue);
	    }

	    function setUserIdentity(id, type) {
	        // Only use this method when mParicle core SDK is version 1
	        // Other versions use onUserIdentified, which is called after setUserIdentity from core SDK
	        if (window.mParticle.getVersion().split('.')[0] === '1') {
	            if (type == window.mParticle.IdentityType.CustomerId) {
	                kitLogger('braze.changeUser', id);

	                braze.changeUser(id);
	            } else if (type == window.mParticle.IdentityType.Email) {
	                kitLogger('braze.getUser().setEmail', id);

	                braze.getUser().setEmail(id);
	            } else {
	                return (
	                    "Can't call setUserIdentity on forwarder " +
	                    name +
	                    ', identity type not supported.'
	                );
	            }
	        }
	    }

	    // onUserIdentified is not used in version 1 so there is no need to check for version number
	    function onUserIdentified(user) {
	        kitLogger('calling MpBrazeKit.onUserIdentified');

	        try {
	            var brazeUserIDType,
	                userIdentities = user.getUserIdentities().userIdentities;

	            if (forwarderSettings.userIdentificationType === 'MPID') {
	                brazeUserIDType = user.getMPID();
	            } else {
	                brazeUserIDType =
	                    userIdentities[
	                        forwarderSettings.userIdentificationType.toLowerCase()
	                    ];
	            }

	            if (brazeUserIDType) {
	                kitLogger('braze.changeUser', brazeUserIDType);

	                braze.changeUser(brazeUserIDType);
	            }

	            if (userIdentities.email) {
	                kitLogger('braze.getUser().setEmail', userIdentities.email);

	                braze.getUser().setEmail(userIdentities.email);
	            }
	        } catch (e) {
	            kitLogger(
	                'Error in calling MpBrazeKit.onUserIdentified',
	                e.message
	            );
	        }
	    }

	    function primeBrazeWebPush() {
	        // The following code block is based on Braze's best practice for implementing
	        // their push primer.  We only modify it to include pushPrimer and register_inapp settings.
	        // https://www.braze.com/docs/developer_guide/platform_integration_guides/web/push_notifications/soft_push_prompt
	        braze.subscribeToInAppMessage(function(inAppMessage) {
	            var shouldDisplay = true;
	            var pushPrimer = false;
	            if (inAppMessage instanceof braze.InAppMessage) {
	                // access the key-value pairs, defined as `extras`
	                const keyValuePairs = inAppMessage.extras || {};
	                // check the value of our key `msg-id` defined in the Braze dashboard
	                if (keyValuePairs['msg-id'] === 'push-primer') {
	                    pushPrimer = true;
	                    // We don't want to display the soft push prompt to users on browsers
	                    // that don't support push, or if the user has already granted/blocked permission
	                    if (
	                        braze.isPushSupported() === false ||
	                        braze.isPushPermissionGranted() ||
	                        braze.isPushBlocked()
	                    ) {
	                        // do not call `showInAppMessage`
	                        shouldDisplay = false;
	                        return;
	                    }

	                    // user is eligible to receive the native prompt
	                    // register a click handler on one of the two buttons
	                    if (inAppMessage.buttons[0]) {
	                        // Prompt the user when the first button is clicked
	                        inAppMessage.buttons[0].subscribeToClickedEvent(
	                            function() {
	                                braze.requestPushPermission();
	                            }
	                        );
	                    }
	                }
	            }

	            // Display the message if it's a push primer message and shouldDisplay is true
	            // If it is not a push primer, we should show the message if the setting for register_inapp === 'True'
	            if (
	                (pushPrimer && shouldDisplay) ||
	                (!pushPrimer && forwarderSettings.register_inapp === 'True')
	            ) {
	                braze.showInAppMessage(inAppMessage);
	            }
	        });
	    }

	    function openSession(forwarderSettings) {
	        braze.openSession();
	        if (forwarderSettings.softPushCustomEventName) {
	            kitLogger(
	                'braze.logCustomEvent',
	                forwarderSettings.softPushCustomEventName
	            );

	            braze.logCustomEvent(forwarderSettings.softPushCustomEventName);
	        }
	    }

	    function prepareInitialConsent(user) {
	        var userConsentState = getUserConsentState(user);

	        var currentConsentPayload = generateBrazeConsentStatePayload(
	            userConsentState
	        );

	        if (!isEmpty(currentConsentPayload)) {
	            latestUserBrazeConsentString = JSON.stringify(
	                currentConsentPayload
	            );

	            setConsentOnBraze(currentConsentPayload);
	        }
	    }

	    function setConsentOnBraze(currentConsentPayload) {
	        for (var key in currentConsentPayload) {
	            braze
	                .getUser()
	                .setCustomUserAttribute(key, currentConsentPayload[key]);
	        }
	    }

	    function maybeSetConsentBeforeEventLogged(event) {
	        if (latestUserBrazeConsentString && !isEmpty(parsedConsentMappings)) {
	            var eventConsentState = getEventConsentState(event.ConsentState);

	            if (!isEmpty(eventConsentState)) {
	                var eventBrazeConsent = generateBrazeConsentStatePayload(
	                    eventConsentState
	                );
	                var eventBrazeConsentAsString = JSON.stringify(
	                    eventBrazeConsent
	                );

	                if (
	                    eventBrazeConsentAsString !== latestUserBrazeConsentString
	                ) {
	                    setConsentOnBraze(eventBrazeConsent);
	                    latestUserBrazeConsentString = eventBrazeConsentAsString;
	                }
	            }
	        }
	    }

	    function getEventConsentState(eventConsentState) {
	        return eventConsentState && eventConsentState.getGDPRConsentState
	            ? eventConsentState.getGDPRConsentState()
	            : {};
	    }

	    function generateBrazeConsentStatePayload(consentState) {
	        if (!parsedConsentMappings) return {};

	        var payload = {};

	        // These are Braze's consent constants for Braze's Audience Sync to Google
	        // https://www.braze.com/docs/partners/canvas_steps/google_audience_sync

	        var googleToBrazeConsentMap = {
	            google_ad_user_data: '$google_ad_user_data',
	            google_ad_personalization: '$google_ad_personalization',
	        };

	        for (var i = 0; i <= parsedConsentMappings.length - 1; i++) {
	            var mappingEntry = parsedConsentMappings[i];
	            // Although consent purposes can be inputted into the UI in any casing
	            // the SDK will automatically lowercase them to prevent pseudo-duplicate
	            // consent purposes, so we call `toLowerCase` on the consentMapping purposes here
	            var mpMappedConsentName = mappingEntry.map.toLowerCase();
	            // that mappingEntry.value returned from the server does not have a $ appended, so we have to add it
	            var brazeMappedConsentName =
	                googleToBrazeConsentMap[mappingEntry.value];

	            if (
	                consentState[mpMappedConsentName] &&
	                brazeMappedConsentName &&
	                brazeConsentKeys.indexOf(brazeMappedConsentName) !== -1
	            ) {
	                payload[brazeMappedConsentName] =
	                    consentState[mpMappedConsentName].Consented;
	            }
	        }

	        return payload;
	    }

	    function getUserConsentState(user) {
	        var userConsentState = {};

	        var consentState = user.getConsentState();

	        if (consentState && consentState.getGDPRConsentState) {
	            userConsentState = consentState.getGDPRConsentState();
	        }

	        return userConsentState;
	    }

	    function parseConsentSettingsString(consentMappingString) {
	        return JSON.parse(consentMappingString.replace(/&quot;/g, '"'));
	    }

	    function initForwarder(
	        settings,
	        service,
	        testMode,
	        trackerId,
	        userAttributes,
	        userIdentities,
	        appVersion,
	        appName,
	        customFlags
	    ) {
	        // check to see if there is a logger for backwards compatibility, and if not, mock one to avoid errors
	        if (!self.logger) {
	            // create a logger
	            self.logger = {
	                verbose: function() {},
	            };
	        }
	        // eslint-disable-line no-unused-vars
	        mpCustomFlags = customFlags;
	        try {
	            forwarderSettings = settings;
	            bundleCommerceEventData =
	                forwarderSettings.bundleCommerceEventData === 'True';
	            forwardSkuAsProductName =
	                forwarderSettings.forwardSkuAsProductName === 'True';
	            reportingService = service;
	            // 30 min is Braze default
	            options.sessionTimeoutInSeconds =
	                forwarderSettings.ABKSessionTimeoutKey || 1800;
	            options.sdkFlavor = 'mparticle';
	            options.allowUserSuppliedJavascript =
	                forwarderSettings.enableHtmlInAppMessages == 'True';
	            options.doNotLoadFontAwesome =
	                forwarderSettings.doNotLoadFontAwesome == 'True';

	            if (forwarderSettings.safariWebsitePushId) {
	                options.safariWebsitePushId =
	                    forwarderSettings.safariWebsitePushId;
	            }

	            if (forwarderSettings.serviceWorkerLocation) {
	                options.serviceWorkerLocation =
	                    forwarderSettings.serviceWorkerLocation;
	            }

	            if (forwarderSettings.consentMappingSDK) {
	                parsedConsentMappings = parseConsentSettingsString(
	                    forwarderSettings.consentMappingSDK
	                );
	                if (parsedConsentMappings.length) {
	                    hasConsentMappings = true;
	                }
	            }

	            if (forwarderSettings.subscriptionGroupMapping) {
	                parsedSubscriptionGroupMapping = decodeSubscriptionGroupMappings(
	                    forwarderSettings.subscriptionGroupMapping
	                );
	            }

	            var cluster =
	                forwarderSettings.cluster ||
	                forwarderSettings.dataCenterLocation;

	            if (clusterMapping.hasOwnProperty(cluster)) {
	                options.baseUrl = clusterMapping[cluster];
	            } else {
	                var customUrl = decodeClusterSetting(cluster);
	                if (customUrl) {
	                    options.baseUrl = customUrl;
	                }
	            }

	            if (mpCustomFlags && mpCustomFlags[moduleId.toString()]) {
	                var brazeFlags = mpCustomFlags[moduleId.toString()];
	                if (typeof brazeFlags.initOptions === 'function') {
	                    brazeFlags.initOptions(options);
	                }
	            }

	            if (testMode !== true) {
	                braze.initialize(forwarderSettings.apiKey, options);
	                finishBrazeInitialization(forwarderSettings);
	            } else {
	                if (!braze.initialize(forwarderSettings.apiKey, options)) {
	                    return 'Failed to initialize: ' + name;
	                }
	                finishBrazeInitialization(forwarderSettings);
	            }
	            return 'Successfully initialized: ' + name;
	        } catch (e) {
	            return (
	                'Failed to initialize: ' + name + ' with error: ' + e.message
	            );
	        }
	    }

	    function finishBrazeInitialization(forwarderSettings) {
	        braze.addSdkMetadata(['mp']);
	        primeBrazeWebPush();

	        const currentUser =
	            mParticle.Identity !== null
	                ? mParticle.Identity.getCurrentUser()
	                : null;
	        const mpid = currentUser ? currentUser.getMPID() : null;

	        if (currentUser && mpid) {
	            onUserIdentified(currentUser);
	            if (hasConsentMappings) {
	                prepareInitialConsent(currentUser);
	            }
	        }

	        openSession(forwarderSettings);
	    }

	    /**************************/
	    /** End mParticle API **/
	    /**************************/

	    function decodeClusterSetting(clusterSetting) {
	        if (clusterSetting) {
	            var decodedSetting = clusterSetting.replace(/&amp;/g, '&');
	            decodedSetting = clusterSetting.replace(/&quot;/g, '"');
	            try {
	                var clusterSettingObject = JSON.parse(decodedSetting);
	                if (clusterSettingObject && clusterSettingObject.JS) {
	                    return 'https://' + clusterSettingObject.JS + '/api/v3';
	                }
	            } catch (e) {
	                console.log(
	                    'Unable to configure custom Braze cluster: ' + e.toString()
	                );
	            }
	        }
	    }

	    function decodeSubscriptionGroupMappings(subscriptionGroupSetting) {
	        var subscriptionGroupIds = {};
	        try {
	            var decodedSetting = subscriptionGroupSetting.replace(
	                /&quot;/g,
	                '"'
	            );
	            var parsedSetting = JSON.parse(decodedSetting);
	            for (let subscriptionGroupMap of parsedSetting) {
	                var key = subscriptionGroupMap.map;
	                var value = subscriptionGroupMap.value;
	                subscriptionGroupIds[key] = value;
	            }
	        } catch (e) {
	            console.error(
	                'Unable to configure custom Braze subscription group mappings.'
	            );
	        }
	        return subscriptionGroupIds;
	    }

	    function getSanitizedStringForBraze(value) {
	        if (typeof value === 'string') {
	            if (value.substr(0, 1) === '$') {
	                return value.replace(/^\$+/g, '');
	            } else {
	                return value;
	            }
	        }
	        return null;
	    }

	    function getSanitizedValueForBraze(value) {
	        if (typeof value === 'string') {
	            return getSanitizedStringForBraze(value);
	        }

	        if (Array.isArray(value)) {
	            var sanitizedArray = [];
	            for (var i in value) {
	                var element = value[i];
	                var sanitizedElement = getSanitizedStringForBraze(element);
	                if (sanitizedElement == null) {
	                    return null;
	                }
	                sanitizedArray.push(sanitizedElement);
	            }
	            return sanitizedArray;
	        }
	        return value;
	    }

	    function getSanitizedCustomProperties(customProperties) {
	        var sanitizedProperties = {},
	            value,
	            sanitizedPropertyName,
	            sanitizedValue;

	        if (customProperties == null) {
	            customProperties = {};
	        }

	        if (typeof customProperties !== 'object') {
	            return null;
	        }

	        for (var propertyName in customProperties) {
	            value = customProperties[propertyName];
	            sanitizedPropertyName = getSanitizedValueForBraze(propertyName);
	            sanitizedValue =
	                typeof value === 'string'
	                    ? getSanitizedValueForBraze(value)
	                    : value;
	            sanitizedProperties[sanitizedPropertyName] = sanitizedValue;
	        }
	        return sanitizedProperties;
	    }

	    this.init = initForwarder;
	    this.process = processEvent;
	    this.setUserIdentity = setUserIdentity;
	    this.setUserAttribute = setUserAttribute;
	    this.onUserIdentified = onUserIdentified;
	    this.removeUserAttribute = removeUserAttribute;
	    this.decodeClusterSetting = decodeClusterSetting;
	    this.decodeSubscriptionGroupMappings = decodeSubscriptionGroupMappings;

	    /* An example output of this logger if we pass in a purchase event for 1 iPhone
	     with a SKU of iphoneSku that cost $999 with a product attribute of 
	     color: blue would be:
	     mParticle - Braze Web Kit log:
	     braze.logPurchase:
	     iphone,
	     999,
	     USD,
	     1,
	     {\"color\":\"blue\",\"Sku":"iphoneSKU"},\n`;
	     */
	    function kitLogger(method) {
	        var msg = 'mParticle - Braze Web Kit log:';

	        var nonMethodArguments = Array.prototype.slice.call(arguments, 1);
	        msg += '\n' + method + ':\n';

	        nonMethodArguments.forEach(function(arg) {
	            if (isObject(arg) || Array.isArray(arg)) {
	                msg += JSON.stringify(arg);
	            } else {
	                msg += arg;
	            }
	            msg += ',\n';
	        });

	        self.logger.verbose(msg);
	    }
	};

	function getId() {
	    return moduleId;
	}

	function register(config) {
	    var forwarderNameWithSuffix = [name, suffix].join('-');
	    if (!config) {
	        window.console.log(
	            'You must pass a config object to register the kit ' +
	                forwarderNameWithSuffix
	        );
	        return;
	    }

	    if (!isObject(config)) {
	        window.console.log(
	            "'config' must be an object. You passed in a " + typeof config
	        );
	        return;
	    }

	    if (isObject(config.kits)) {
	        config.kits[forwarderNameWithSuffix] = {
	            constructor: constructor,
	        };
	    } else {
	        config.kits = {};
	        config.kits[forwarderNameWithSuffix] = {
	            constructor: constructor,
	        };
	    }
	    window.console.log(
	        'Successfully registered ' +
	            forwarderNameWithSuffix +
	            ' to your mParticle configuration'
	    );
	}

	if (window && window.mParticle && window.mParticle.addForwarder) {
	    window.mParticle.addForwarder({
	        name: name,
	        constructor: constructor,
	        getId: getId,
	        // A suffix is added if there are multiple different versions of
	        // a client kit.  This matches the suffix in the DB.
	        suffix: suffix,
	    });
	}

	function mergeObjects() {
	    var resObj = {};
	    for (var i = 0; i < arguments.length; i += 1) {
	        var obj = arguments[i],
	            keys = Object.keys(obj);
	        for (var j = 0; j < keys.length; j += 1) {
	            resObj[keys[j]] = obj[keys[j]];
	        }
	    }
	    return resObj;
	}

	function isObject(val) {
	    return (
	        val != null && typeof val === 'object' && Array.isArray(val) === false
	    );
	}

	function isEmpty(value) {
	    return value == null || !(Object.keys(value) || value).length;
	}

	var BrazeKitDev = {
	    register: register,
	    getVersion: function() {
	        return version;
	    },
	};

	exports["default"] = BrazeKitDev;

	Object.defineProperty(exports, '__esModule', { value: true });

	return exports;

})({});
