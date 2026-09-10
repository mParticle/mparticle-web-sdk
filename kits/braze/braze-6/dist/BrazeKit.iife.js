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

	const b = {
	  init: function (n) {
	    (void 0 === n && void 0 !== b.zg) || (b.zg = !!n), b.i || (b.i = !0);
	  },
	  destroy: function () {
	    (b.i = !1), (b.zg = void 0), (b.Bd = void 0);
	  },
	  setLogger: function (n) {
	    "function" == typeof n
	      ? (b.init(), (b.Bd = n))
	      : b.info("Ignoring setLogger call since logger is not a function");
	  },
	  toggleLogging: function () {
	    b.init(),
	      b.zg
	        ? (console.log("Disabling Braze logging"), (b.zg = !1))
	        : (console.log("Enabled Braze logging"), (b.zg = !0));
	  },
	  info: function (n) {
	    if (b.zg) {
	      const o = "Braze: " + n;
	      null != b.Bd ? b.Bd(o) : console.log(o);
	    }
	  },
	  warn: function (n) {
	    if (b.zg) {
	      const o = "Braze SDK Warning: " + n + " (v6.12.0)";
	      null != b.Bd ? b.Bd(o) : console.warn(o);
	    }
	  },
	  error: function (n) {
	    if (b.zg) {
	      const o = "Braze SDK Error: " + n + " (v6.12.0)";
	      null != b.Bd ? b.Bd(o) : console.error(o);
	    }
	  },
	};
	var b$1 = b;

	const oi = {
	  Tu: function (t) {
	    const r = (t + "=".repeat((4 - (t.length % 4)) % 4))
	        .replace(/\-/g, "+")
	        .replace(/_/g, "/"),
	      n = atob(r),
	      o = new Uint8Array(n.length);
	    for (let t = 0; t < n.length; ++t) o[t] = n.charCodeAt(t);
	    return o;
	  },
	};

	const p = {
	    CustomEvent: "ce",
	    Pr: "p",
	    $c: "pc",
	    Fc: "ca",
	    vl: "i",
	    _a: "ie",
	    vs: "cci",
	    ws: "ccic",
	    us: "ccc",
	    gs: "ccd",
	    wm: "ss",
	    hm: "se",
	    On: "si",
	    Hn: "sc",
	    Jn: "sbc",
	    Lc: "sfe",
	    om: "iec",
	    Dc: "lr",
	    Ac: "uae",
	    Mc: "lcaa",
	    Cc: "lcar",
	    Na: "inc",
	    Xu: "add",
	    Zu: "rem",
	    Vu: "set",
	    Qu: "ncam",
	    Tc: "sgu",
	    xo: "ffi",
	    ro: "bi",
	    Nt: "bc",
	    Rt: "bd",
	  };

	const V = {
	  de: function () {
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
	var V$1 = V;

	class et {
	  constructor(t, e) {
	    (this.database = t),
	      (this.Bd = e),
	      (this.parent = "undefined" == typeof window ? self : window),
	      (this.database = t),
	      (this.Bd = e);
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
	              this.Bd.info(
	                "Not using IndexedDB for storage because we are running inside an extension",
	              ),
	              !1
	            );
	        }
	        return !0;
	      }
	    } catch (t) {
	      return (
	        this.Bd.info(
	          "Not using IndexedDB for storage due to following error: " + t,
	        ),
	        !1
	      );
	    }
	  }
	  kd(t, e) {
	    var n;
	    const o =
	      null === (n = this.Ud()) || void 0 === n
	        ? void 0
	        : n.open(this.database.Kd, this.database.VERSION);
	    if (null == o) return "function" == typeof e && e(), !1;
	    const i = this;
	    return (
	      (o.onupgradeneeded = (t) => {
	        var e;
	        i.Bd.info(
	          "Upgrading indexedDB " +
	            i.database.Kd +
	            " to v" +
	            i.database.VERSION +
	            "...",
	        );
	        const n = null === (e = t.target) || void 0 === e ? void 0 : e.result;
	        for (const t in i.database.Ws) {
	          const e = t;
	          i.database.Ws.hasOwnProperty(t) &&
	            !n.objectStoreNames.contains(i.database.Ws[e]) &&
	            n.createObjectStore(i.database.Ws[e]);
	        }
	      }),
	      (o.onsuccess = (n) => {
	        var o;
	        const r = null === (o = n.target) || void 0 === o ? void 0 : o.result;
	        (r.onversionchange = () => {
	          r.close(),
	            "function" == typeof e && e(),
	            i.Bd.error(
	              "Needed to close the database unexpectedly because of an upgrade in another tab",
	            );
	        }),
	          t(r);
	      }),
	      (o.onerror = (t) => {
	        var n;
	        const o = t;
	        return (
	          i.Bd.info(
	            "Could not open indexedDB " +
	              i.database.Kd +
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
	    return this.kd((d) => {
	      if (!d.objectStoreNames.contains(t))
	        return (
	          r.Bd.error(
	            "Could not store object " +
	              e +
	              " in " +
	              t +
	              " on indexedDB " +
	              r.database.Kd +
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
	        r.Bd.error(
	          "Could not store object " +
	            e +
	            " in " +
	            t +
	            " on indexedDB " +
	            r.database.Kd,
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
	    return this.kd((i) => {
	      if (!i.objectStoreNames.contains(t))
	        return (
	          o.Bd.error(
	            "Could not retrieve object " +
	              e +
	              " in " +
	              t +
	              " on indexedDB " +
	              o.database.Kd +
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
	        o.Bd.error(
	          "Could not retrieve object " +
	            e +
	            " in " +
	            t +
	            " on indexedDB " +
	            o.database.Kd,
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
	    return this.kd((i) => {
	      if (!i.objectStoreNames.contains(t))
	        return (
	          o.Bd.error(
	            "Could not retrieve last record from " +
	              t +
	              " on indexedDB " +
	              o.database.Kd +
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
	        o.Bd.error(
	          "Could not open cursor for " + t + " on indexedDB " + o.database.Kd,
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
	  ge(t, e) {
	    if (!this.isSupported()) return !1;
	    const n = this;
	    return this.kd((o) => {
	      if (!o.objectStoreNames.contains(t))
	        return (
	          n.Bd.error(
	            "Could not delete record " +
	              e +
	              " from " +
	              t +
	              " on indexedDB " +
	              n.database.Kd +
	              " - " +
	              t +
	              " is not a valid objectStore",
	          ),
	          void o.close()
	        );
	      const i = o.transaction([t], "readwrite");
	      i.oncomplete = () => o.close();
	      i.objectStore(t).delete(e).onerror = () => {
	        n.Bd.error(
	          "Could not delete record " +
	            e +
	            " from " +
	            t +
	            " on indexedDB " +
	            n.database.Kd,
	        );
	      };
	    });
	  }
	  Qs(t, e) {
	    if (!this.isSupported()) return !1;
	    const n = this;
	    return this.kd((o) => {
	      if (!o.objectStoreNames.contains(t))
	        return (
	          n.Bd.error(
	            "Could not retrieve objects from " +
	              t +
	              " on indexedDB " +
	              n.database.Kd +
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
	          ? (n.Bd.info(
	              "Cursor closed midway through for " +
	                t +
	                " on indexedDB " +
	                n.database.Kd,
	            ),
	            e(s))
	          : n.Bd.error(
	              "Could not open cursor for " +
	                t +
	                " on indexedDB " +
	                n.database.Kd,
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
	    for (const e in this.database.Ws) {
	      const n = e;
	      this.database.Ws.hasOwnProperty(e) &&
	        this.database.Ws[n] !== this.database.Ws.pe &&
	        t.push(this.database.Ws[n]);
	    }
	    const e = this;
	    return this.kd(function (n) {
	      const o = n.transaction(t, "readwrite");
	      o.oncomplete = () => n.close();
	      for (let n = 0; n < t.length; n++) {
	        const i = t[n];
	        o.objectStore(i).clear().onerror = function () {
	          e.Bd.error(
	            "Could not clear " +
	              this.source.name +
	              " on indexedDB " +
	              e.database.Kd,
	          );
	        };
	      }
	      o.onerror = function () {
	        e.Bd.error(
	          "Could not clear object stores on indexedDB " + e.database.Kd,
	        );
	      };
	    });
	  }
	}
	et._s = {
	  Xs: {
	    Kd: "AppboyServiceWorkerAsyncStorage",
	    VERSION: 6,
	    Ws: {
	      Cn: "data",
	      yr: "pushClicks",
	      Gu: "pushSubscribed",
	      Gd: "fallbackDevice",
	      Vs: "cardUpdates",
	      pe: "optOut",
	      Br: "pendingData",
	      wh: "sdkAuthenticationSignature",
	    },
	    be: 1,
	  },
	};

	var pi = {
	  _h: "allowCrawlerActivity",
	  Nh: "baseUrl",
	  se: "cookieExpiryInDays",
	  Oh: "noCookies",
	  Th: "devicePropertyAllowlist",
	  xa: "disablePushTokenMaintenance",
	  Rh: "enableLogging",
	  Ph: "enableSdkAuthentication",
	  wa: "manageServiceWorkerExternally",
	  Dh: "minimumIntervalBetweenTriggerActionsInSeconds",
	  Lh: "sessionTimeoutInSeconds",
	  yh: "appVersion",
	  Mh: "appVersionNumber",
	  za: "serviceWorkerLocation",
	  ha: "safariWebsitePushId",
	  Ma: "localization",
	  sr: "contentSecurityNonce",
	  nr: "allowUserSuppliedJavascript",
	  ca: "inAppMessageZIndex",
	  da: "openInAppMessagesInNewTab",
	  lh: "requireExplicitInAppMessageDismissal",
	  Uh: "doNotLoadFontAwesome",
	  Wh: "deviceId",
	  ba: "serviceWorkerScope",
	  Oi: "dustHost",
	  Bh: "sdkFlavor",
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
	    (b$1.error(`${r} Valid values from ${n} are "${o.join('"/"')}".`), !1)
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
	const DISMISSALS_CACHE_SIZE_DEFAULT = 200;
	const REQUEST_BACKOFF_MIN_SLEEP_MS_DEFAULT = 1e4;
	const REQUEST_BACKOFF_SCALE_FACTOR_DEFAULT = 3;
	const REQUEST_BACKOFF_MAX_SLEEP_MS_DEFAULT = 3e5;
	const CoreStrings = {
	  ee: "Braze must be initialized before calling methods.",
	  je: "logCustomEvent",
	  QE: "logEcommerceEvent",
	  Mu: "setCustomUserAttribute",
	};

	class f {
	  constructor() {
	    this.In = {};
	  }
	  Ut(t) {
	    if ("function" != typeof t) return null;
	    const i = V$1.de();
	    return (this.In[i] = t), i;
	  }
	  removeSubscription(t) {
	    delete this.In[t];
	  }
	  removeAllSubscriptions() {
	    this.In = {};
	  }
	  an() {
	    return Object.keys(this.In).length;
	  }
	  A(t) {
	    const i = [];
	    for (const s in this.In) {
	      const r = this.In[s];
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
	      (this.es = null),
	      (this.ii = null);
	  }
	  subscribeToClickedEvent(t) {
	    return this.si().Ut(t);
	  }
	  subscribeToDismissedEvent(t) {
	    return this.ns().Ut(t);
	  }
	  removeSubscription(t) {
	    this.si().removeSubscription(t), this.ns().removeSubscription(t);
	  }
	  removeAllSubscriptions() {
	    this.si().removeAllSubscriptions(), this.ns().removeAllSubscriptions();
	  }
	  dismissCard() {
	    if (!this.dismissible || this.dismissed) return;
	    "function" == typeof this.logCardDismissal && this.logCardDismissal();
	    let t = this.te;
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
	            }, Card.hi));
	        }, FEED_ANIMATION_DURATION));
	  }
	  si() {
	    return null == this.ti && (this.ti = new f()), this.ti;
	  }
	  ns() {
	    return null == this.es && (this.es = new f()), this.es;
	  }
	  js() {
	    const t = new Date().valueOf();
	    return (
	      !(null != this.ii && t - this.ii < Card.li) &&
	      ((this.ii = t), (this.viewed = !0), !0)
	    );
	  }
	  Yt() {
	    (this.viewed = !0), (this.clicked = !0), this.si().A();
	  }
	  Ft() {
	    return (
	      !(!this.dismissible || this.dismissed) &&
	      ((this.dismissed = !0), this.ns().A(), !0)
	    );
	  }
	  ni(t) {
	    if (null == t || t[Card.ei.qs] !== this.id) return !0;
	    if (t[Card.ei.ri]) return !1;
	    if (
	      null != t[Card.ei.Es] &&
	      null != this.updated &&
	      parseInt(t[Card.ei.Es]) < convertMsToSeconds(this.updated.valueOf())
	    )
	      return !0;
	    if (
	      (t[Card.ei.ys] && !this.viewed && (this.viewed = !0),
	      t[Card.ei.Ls] && !this.clicked && (this.clicked = t[Card.ei.Ls]),
	      null != t[Card.ei.As] && (this.title = t[Card.ei.As]),
	      null != t[Card.ei.Bs] && (this.imageUrl = t[Card.ei.Bs]),
	      null != t[Card.ei.Ds] && (this.description = t[Card.ei.Ds]),
	      null != t[Card.ei.Es])
	    ) {
	      const i = dateFromUnixTimestamp(t[Card.ei.Es]);
	      null != i && (this.updated = i);
	    }
	    if (null != t[Card.ei.Fs]) {
	      let i;
	      (i = t[Card.ei.Fs] === Card.ui ? null : dateFromUnixTimestamp(t[Card.ei.Fs])),
	        (this.expiresAt = i);
	    }
	    if (
	      (null != t[Card.ei.URL] && (this.url = t[Card.ei.URL]),
	      null != t[Card.ei.Gs] && (this.linkText = t[Card.ei.Gs]),
	      null != t[Card.ei.Hs])
	    ) {
	      const i = parseFloat(t[Card.ei.Hs].toString());
	      this.aspectRatio = isNaN(i) ? null : i;
	    }
	    return (
	      null != t[Card.ei.Is] && (this.extras = t[Card.ei.Is]),
	      null != t[Card.ei.Js] && (this.pinned = t[Card.ei.Js]),
	      null != t[Card.ei.Ks] && (this.dismissible = t[Card.ei.Ks]),
	      null != t[Card.ei.Ms] && (this.language = t[Card.ei.Ms]),
	      null != t[Card.ei.Ns] && (this.altImageText = t[Card.ei.Ns]),
	      null != t[Card.ei.Os] && (this.test = t[Card.ei.Os]),
	      !0
	    );
	  }
	  qt() {
	    b$1.error("Must be implemented in a subclass");
	  }
	}
	(Card.ui = -1),
	  (Card.ei = {
	    qs: "id",
	    ys: "v",
	    Ks: "db",
	    ri: "r",
	    Es: "ca",
	    Js: "p",
	    Fs: "ea",
	    Is: "e",
	    xs: "tp",
	    Bs: "i",
	    As: "tt",
	    Ds: "ds",
	    URL: "u",
	    Gs: "dm",
	    Hs: "ar",
	    Ls: "cl",
	    Os: "t",
	    Ms: "language",
	    Ns: "image_alt",
	  }),
	  (Card.ks = {
	    zs: "captioned_image",
	    Ei: "text_announcement",
	    Ti: "short_news",
	    oi: "banner_image",
	    ai: "control",
	  }),
	  (Card.bs = {
	    qs: "id",
	    ys: "v",
	    Ks: "db",
	    Ii: "cr",
	    Es: "ca",
	    Js: "p",
	    Ni: "t",
	    Fs: "ea",
	    Is: "e",
	    xs: "tp",
	    Bs: "i",
	    As: "tt",
	    Ds: "ds",
	    URL: "u",
	    Gs: "dm",
	    Hs: "ar",
	    Ls: "cl",
	    Os: "s",
	    Ms: "l",
	    Ns: "ia",
	  }),
	  (Card.Ai = {
	    ci: "ADVERTISING",
	    mi: "ANNOUNCEMENTS",
	    Si: "NEWS",
	    Di: "SOCIAL",
	  }),
	  (Card.hi = 400),
	  (Card.li = 1e4);

	class ImageOnly extends Card {
	  constructor(s, t, i, h, l, r, e, n, o, u, a, c, d) {
	    super(s, t, null, i, null, h, l, r, null, e, n, o, u, a, c, d),
	      (this.ae = "ab-image-only"),
	      (this.oe = !1),
	      (this.test = !1);
	  }
	  qt() {
	    const s = {};
	    return (
	      (s[Card.bs.xs] = Card.ks.oi),
	      (s[Card.bs.qs] = this.id),
	      (s[Card.bs.ys] = this.viewed),
	      (s[Card.bs.Bs] = this.imageUrl),
	      (s[Card.bs.Es] = this.updated),
	      (s[Card.bs.Fs] = this.expiresAt),
	      (s[Card.bs.URL] = this.url),
	      (s[Card.bs.Hs] = this.aspectRatio),
	      (s[Card.bs.Is] = this.extras),
	      (s[Card.bs.Js] = this.pinned),
	      (s[Card.bs.Ks] = this.dismissible),
	      (s[Card.bs.Ls] = this.clicked),
	      (s[Card.bs.Ms] = this.language),
	      (s[Card.bs.Ns] = this.altImageText),
	      (s[Card.bs.Os] = this.test),
	      s
	    );
	  }
	}

	class CaptionedImage extends Card {
	  constructor(t, s, i, h, e, r, a, o, c, n, d, p, u, l, m, f) {
	    super(t, s, i, h, e, r, a, o, c, n, d, p, u, l, m, f),
	      (this.ae = "ab-captioned-image"),
	      (this.oe = !0),
	      (this.test = !1);
	  }
	  qt() {
	    const t = {};
	    return (
	      (t[Card.bs.xs] = Card.ks.zs),
	      (t[Card.bs.qs] = this.id),
	      (t[Card.bs.ys] = this.viewed),
	      (t[Card.bs.As] = this.title),
	      (t[Card.bs.Bs] = this.imageUrl),
	      (t[Card.bs.Ds] = this.description),
	      (t[Card.bs.Es] = this.updated),
	      (t[Card.bs.Fs] = this.expiresAt),
	      (t[Card.bs.URL] = this.url),
	      (t[Card.bs.Gs] = this.linkText),
	      (t[Card.bs.Hs] = this.aspectRatio),
	      (t[Card.bs.Is] = this.extras),
	      (t[Card.bs.Js] = this.pinned),
	      (t[Card.bs.Ks] = this.dismissible),
	      (t[Card.bs.Ls] = this.clicked),
	      (t[Card.bs.Ms] = this.language),
	      (t[Card.bs.Ns] = this.altImageText),
	      (t[Card.bs.Os] = this.test),
	      t
	    );
	  }
	}

	class ClassicCard extends Card {
	  constructor(s, t, i, h, r, c, e, a, o, d, l, n, u, p, f, m) {
	    super(s, t, i, h, r, c, e, a, o, d, l, n, u, p, f, m),
	      (this.ae = "ab-classic-card"),
	      (this.oe = !0);
	  }
	  qt() {
	    const s = {};
	    return (
	      (s[Card.bs.xs] = Card.ks.Ti),
	      (s[Card.bs.qs] = this.id),
	      (s[Card.bs.ys] = this.viewed),
	      (s[Card.bs.As] = this.title),
	      (s[Card.bs.Bs] = this.imageUrl),
	      (s[Card.bs.Ds] = this.description),
	      (s[Card.bs.Es] = this.updated),
	      (s[Card.bs.Fs] = this.expiresAt),
	      (s[Card.bs.URL] = this.url),
	      (s[Card.bs.Gs] = this.linkText),
	      (s[Card.bs.Hs] = this.aspectRatio),
	      (s[Card.bs.Is] = this.extras),
	      (s[Card.bs.Js] = this.pinned),
	      (s[Card.bs.Ks] = this.dismissible),
	      (s[Card.bs.Ls] = this.clicked),
	      (s[Card.bs.Ms] = this.language),
	      (s[Card.bs.Ns] = this.altImageText),
	      (s[Card.bs.Os] = this.test),
	      s
	    );
	  }
	}

	class ControlCard extends Card {
	  constructor(t, s, l, i, r, n) {
	    super(t, s, null, null, null, l, i, null, null, null, r, n),
	      (this.isControl = !0),
	      (this.ae = "ab-control-card"),
	      (this.oe = !1);
	  }
	  qt() {
	    const t = {};
	    return (
	      (t[Card.bs.xs] = Card.ks.ai),
	      (t[Card.bs.qs] = this.id),
	      (t[Card.bs.ys] = this.viewed),
	      (t[Card.bs.Es] = this.updated),
	      (t[Card.bs.Fs] = this.expiresAt),
	      (t[Card.bs.Is] = this.extras),
	      (t[Card.bs.Js] = this.pinned),
	      (t[Card.bs.Os] = this.test),
	      t
	    );
	  }
	}

	function getAlias(e) {
	  const t = null == e ? void 0 : e.St(STORAGE_KEYS.It.uS);
	  let n;
	  return t && (n = { label: t.l, name: t.a }), n;
	}

	class ve {
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
	  Uo() {
	    var t;
	    const s = {
	      name: this.type,
	      time: convertMsToSeconds(this.time),
	      data: this.data || {},
	      session_id: this.sessionId,
	    };
	    null != this.userId && (s.user_id = this.userId);
	    const i = (null === (t = r.Er()) || void 0 === t ? void 0 : t.Fh()) || !1;
	    if (!s.user_id && !i) {
	      const t = getAlias(r.p());
	      t && (s.alias = t);
	    }
	    return s;
	  }
	  qt() {
	    return {
	      u: this.userId,
	      t: this.type,
	      ts: this.time,
	      s: this.sessionId,
	      d: this.data,
	    };
	  }
	  static fromJson(t) {
	    return new ve(t.user_id, t.name, t.time, t.session_id, t.data);
	  }
	  static RS(t) {
	    return null != t && isObject$1(t) && null != t.t && "" !== t.t;
	  }
	  static _u(t) {
	    return new ve(t.u, t.t, t.ts, t.s, t.d);
	  }
	}

	const getErrorMessage = (r) =>
	  r instanceof Error ? r.message : String(r);

	class _t {
	  constructor(t, e, i) {
	    (this.Iu = t),
	      null == t && (t = V$1.de()),
	      !i || isNaN(i) ? (this.lm = new Date().valueOf()) : (this.lm = i),
	      (this.Iu = t),
	      (this.pm = new Date().valueOf()),
	      (this.fm = e);
	  }
	  qt() {
	    return `g:${encodeURIComponent(this.Iu)}|e:${this.fm}|c:${this.lm}|l:${
      this.pm
    }`;
	  }
	  static AS(t) {
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
	          (e.pm = n(i[3]));
	      } catch (e) {
	        b$1.info(
	          `Unable to parse cookie string ${t}, failed with error: ${getErrorMessage(e)}`,
	        );
	      }
	    else {
	      if (null == t || null == t.g) return null;
	      (e = new _t(t.g, t.e, t.c)), (e.pm = t.l);
	    }
	    return e;
	  }
	}

	function isAlphanumericChar(t) {
	  return (
	    (t >= "a" && t <= "z") || (t >= "A" && t <= "Z") || (t >= "0" && t <= "9")
	  );
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
	    return b$1.error("Unable to decode Base64: " + t), null;
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
	  Wn: "unknownBrazeAction",
	  Nc: "noPushPrompt",
	};
	const ineligibleBrazeActionURLErrorMessage = (t, o) =>
	  t === INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES.Wn
	    ? `${o} contains an unknown braze action type and will not be displayed.`
	    : "";
	function getDecodedBrazeAction(t) {
	  try {
	    const o = t.match(BRAZE_ACTION_URI_REGEX),
	      r = o ? o[0].length : null,
	      n = r ? t.substring(r) : null;
	    if (null == r || r > t.length - 1 || !n)
	      return void b$1.error(
	        `Did not find base64 encoded brazeAction in url to process : ${t}`,
	      );
	    const e = decodeBrazeActions(n);
	    return e
	      ? JSON.parse(e)
	      : void b$1.error(`Failed to decode base64 encoded brazeAction: ${n}`);
	  } catch (o) {
	    return void b$1.error(`Failed to process brazeAction URL ${t} : ${getErrorMessage(o)}`);
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
	  return n || b$1.error(`Cannot ${e} because ${r} "${t}" is invalid.`), n;
	}
	function validateCustomAttributeKey(t) {
	  return (
	    null != t &&
	      t.match(CUSTOM_ATTRIBUTE_SPECIAL_CHARS_REGEX) &&
	      -1 === CUSTOM_ATTRIBUTE_RESERVED_OPERATORS.indexOf(t) &&
	      b$1.warn("Custom attribute keys cannot contain '$' or '.'"),
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
	    return b$1.error("Nested attributes cannot be more than 50 levels deep."), !1;
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
	    i || b$1.error(`Cannot ${r} because ${n} "${t}" is invalid.`),
	    i
	  );
	}
	function validateStandardString(t, e, r, n = !1) {
	  const o = "string" == typeof t || (null === t && n);
	  return o || b$1.error(`Cannot ${e} because ${r} "${t}" is invalid.`), o;
	}
	function validateCustomProperties(t, e, r, n, o) {
	  if ((null == t && (t = {}), "object" != typeof t || isArray(t)))
	    return (
	      b$1.error(`${e} requires that ${r} be an object. Ignoring ${o}.`),
	      [!1, null]
	    );
	  let i, a;
	  e === CoreStrings.Mu ? ((i = 76800), (a = "75KB")) : ((i = 51200), (a = "50KB"));
	  const s = JSON.stringify(t);
	  if (getByteLength(s) > i)
	    return (
	      b$1.error(
	        `Could not ${n} because ${r} was greater than the max size of ${a}.`,
	      ),
	      [!1, null]
	    );
	  let u;
	  try {
	    u = JSON.parse(s);
	  } catch (t) {
	    return (
	      b$1.error(`Could not ${n} because ${r} did not contain valid JSON.`),
	      [!1, null]
	    );
	  }
	  for (const r in t) {
	    if (e === CoreStrings.Mu && !validateCustomAttributeKey(r)) return [!1, null];
	    if (!validateCustomString(r, n, `the ${o} property name`))
	      return [!1, null];
	    const i = t[r];
	    if (e !== CoreStrings.Mu && null == i) {
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
	        e === CoreStrings.Mu,
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
	    b$1.error(
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
	          CoreStrings.Mu,
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
	    (this.Ss = t), (this.Ru = e), (this.Ss = t), (this.Ru = e);
	  }
	  getUserId(t) {
	    const e = this.Ss.getUserId();
	    if ("function" != typeof t) return e;
	    b$1.warn(
	      "The callback for getUserId is deprecated. You can access its return value directly instead (e.g. `const id = braze.getUser().getUserId()`)",
	    ),
	      t(e);
	  }
	  addAlias(t, e) {
	    return !validateStandardString(t, "add alias", "the alias", !1) || t.length <= 0
	      ? (b$1.error("addAlias requires a non-empty alias"), !1)
	      : !validateStandardString(e, "add alias", "the label", !1) || e.length <= 0
	      ? (b$1.error("addAlias requires a non-empty label"), !1)
	      : this.Ru.Hu(t, e).lt;
	  }
	  setFirstName(t) {
	    return (
	      !!validateStandardString(t, "set first name", "the firstName", !0) &&
	      this.Ss.Bu("first_name", t)
	    );
	  }
	  setLastName(t) {
	    return (
	      !!validateStandardString(t, "set last name", "the lastName", !0) && this.Ss.Bu("last_name", t)
	    );
	  }
	  setEmail(t) {
	    return null === t || isValidEmail(t)
	      ? this.Ss.Bu("email", t)
	      : (b$1.error(
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
	      ) && this.Ss.Bu("gender", t)
	    );
	  }
	  setDateOfBirth(t, e, r) {
	    return null === t && null === e && null === r
	      ? this.Ss.Bu("dob", null)
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
	          ? (b$1.error(
	              "Cannot set date of birth - parameters should comprise a valid date e.g. setDateOfBirth(1776, 7, 4);",
	            ),
	            !1)
	          : this.Ss.Bu("dob", `${t}-${e}-${r}`));
	  }
	  setCountry(t) {
	    return (
	      !!validateStandardString(t, "set country", "the country", !0) && this.Ss.Bu("country", t)
	    );
	  }
	  setHomeCity(t) {
	    return (
	      !!validateStandardString(t, "set home city", "the homeCity", !0) && this.Ss.Bu("home_city", t)
	    );
	  }
	  setLanguage(t) {
	    return (
	      !!validateStandardString(t, "set language", "the language", !0) && this.Ss.Bu("language", t)
	    );
	  }
	  setEmailNotificationSubscriptionType(t) {
	    return (
	      !!validateValueIsFromEnum(
	        User.NotificationSubscriptionTypes,
	        t,
	        `Email notification setting "${t}" is not a valid subscription type.`,
	        "User.NotificationSubscriptionTypes",
	      ) && this.Ss.Bu("email_subscribe", t)
	    );
	  }
	  setPushNotificationSubscriptionType(t) {
	    return (
	      !!validateValueIsFromEnum(
	        User.NotificationSubscriptionTypes,
	        t,
	        `Push notification setting "${t}" is not a valid subscription type.`,
	        "User.NotificationSubscriptionTypes",
	      ) && this.Ss.Bu("push_subscribe", t)
	    );
	  }
	  setPhoneNumber(t) {
	    return (
	      !!validateStandardString(t, "set phone number", "the phoneNumber", !0) &&
	      (null === t || t.match(User.Ku)
	        ? this.Ss.Bu("phone", t)
	        : (b$1.error(`Cannot set phone number - "${t}" did not pass validation.`),
	          !1))
	    );
	  }
	  setLastKnownLocation(t, e, r, s, n) {
	    return null == t || null == e
	      ? (b$1.error(
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
	          ? (b$1.error(
	              "Cannot set last-known location - all supplied parameters must be numeric.",
	            ),
	            !1)
	          : t > 90 || t < -90 || e > 180 || e < -180
	          ? (b$1.error(
	              "Cannot set last-known location - latitude and longitude are bounded by ±90 and ±180 respectively.",
	            ),
	            !1)
	          : (null != r && r < 0) || (null != n && n < 0)
	          ? (b$1.error(
	              "Cannot set last-known location - accuracy and altitudeAccuracy may not be negative.",
	            ),
	            !1)
	          : this.Ru.setLastKnownLocation(this.Ss.getUserId(), t, e, s, r, n)
	              .lt);
	  }
	  setCustomUserAttribute(t, e, r) {
	    if (!validateCustomAttributeKey(t)) return !1;
	    const s = (e) => {
	      const [r] = validateCustomProperties(
	        e,
	        CoreStrings.Mu,
	        "attribute value",
	        `set custom user attribute "${t}"`,
	        "custom user attribute",
	      );
	      return r;
	    };
	    if (isArray(e)) {
	      const [r, n] = validateCustomAttributeArrayType(t, e);
	      if (!r && !n && 0 !== e.length) return !1;
	      if (r || 0 === e.length) return this.Ru.Yu(p.Vu, t, e).lt;
	      for (const t of e) if (!s(t)) return !1;
	    } else if (isObject$1(e)) {
	      if (!s(e)) return !1;
	      if (r) return this.Ru.Yu(p.Qu, t, e).lt;
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
	    return this.Ss.setCustomUserAttribute(t, e);
	  }
	  addToCustomAttributeArray(t, e) {
	    return (
	      !!validateCustomString(t, "add to custom user attribute array", "the given key") &&
	      !(
	        null != e &&
	        !validateCustomString(e, "add to custom user attribute array", "the given value")
	      ) &&
	      this.Ru.Yu(p.Xu, t, e).lt
	    );
	  }
	  removeFromCustomAttributeArray(t, e) {
	    return (
	      !!validateCustomString(t, "remove from custom user attribute array", "the given key") &&
	      !(
	        null != e &&
	        !validateCustomString(e, "remove from custom user attribute array", "the given value")
	      ) &&
	      this.Ru.Yu(p.Zu, t, e).lt
	    );
	  }
	  incrementCustomUserAttribute(t, e) {
	    if (!validateCustomString(t, "increment custom user attribute", "the given key")) return !1;
	    null == e && (e = 1);
	    const r = parseInt(e.toString());
	    return isNaN(r) || r !== parseFloat(e.toString())
	      ? (b$1.error(
	          `Cannot increment custom user attribute because the given incrementValue "${e}" is not an integer.`,
	        ),
	        !1)
	      : this.Ru.Yu(p.Na, t, r).lt;
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
	        ? (b$1.error(
	            "Received invalid values for latitude and/or longitude. Latitude and longitude are bounded by ±90 and ±180 respectively, or must both be null for removal.",
	          ),
	          !1)
	        : this.Ru.ya(t, e, r).lt)
	    );
	  }
	  addToSubscriptionGroup(t) {
	    return !validateStandardString(
	      t,
	      "add user to subscription group",
	      "subscription group ID",
	      !1,
	    ) || t.length <= 0
	      ? (b$1.error(
	          "addToSubscriptionGroup requires a non-empty subscription group ID",
	        ),
	        !1)
	      : this.Ru.va(t, User.Ia.SUBSCRIBED).lt;
	  }
	  removeFromSubscriptionGroup(t) {
	    return !validateStandardString(
	      t,
	      "remove user from subscription group",
	      "subscription group ID",
	      !1,
	    ) || t.length <= 0
	      ? (b$1.error(
	          "removeFromSubscriptionGroup requires a non-empty subscription group ID",
	        ),
	        !1)
	      : this.Ru.va(t, User.Ia.UNSUBSCRIBED).lt;
	  }
	  setLineId(t) {
	    return validateStandardString(t, "set LINE user ID", "the ID", !0) &&
	      0 !== (null == t ? void 0 : t.length)
	      ? t && t.length > User.Ca
	        ? (b$1.error(
	            `Rejected LINE user ID ${t} because it is longer than ${User.Ca} characters.`,
	          ),
	          !1)
	        : this.Ss.Bu("native_line_id", t)
	      : (b$1.error("setLineId requires a non-empty ID"), !1);
	  }
	  yu(t, e, r, s, n) {
	    this.Ss.yu(t, e, r, s, n), this.Ru.Ea();
	  }
	  wu(t) {
	    this.Ss.wu(t);
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
	  (User.Ku = /^[0-9 .\\(\\)\\+\\-]+$/),
	  (User.Ia = { SUBSCRIBED: "subscribed", UNSUBSCRIBED: "unsubscribed" }),
	  (User.Sa = "user_id"),
	  (User.Eu = "custom"),
	  (User.br = 997),
	  (User.Ca = 33);

	class Oe {
	  constructor() {}
	  ef() {}
	  ff() {}
	  Fa(t) {}
	  static nf(t, e) {
	    if (t && e)
	      if (((t = t.toLowerCase()), isArray(e.cf))) {
	        for (let r = 0; r < e.cf.length; r++)
	          if (-1 !== t.indexOf(e.cf[r].toLowerCase())) return e.identity;
	      } else if (-1 !== t.indexOf(e.cf.toLowerCase())) return e.identity;
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

	class Si extends Oe {
	  constructor() {
	    if (
	      (super(),
	      (this.userAgentData = navigator.userAgentData),
	      (this.browser = null),
	      (this.version = null),
	      this.userAgentData)
	    ) {
	      const t = this.Bc();
	      (this.browser = t.browser || "Unknown Browser"),
	        (this.version = t.version || "Unknown Version");
	    }
	    this.OS = null;
	  }
	  ef() {
	    return this.browser;
	  }
	  ff() {
	    return this.version;
	  }
	  Fa(t) {
	    if (this.OS) return Promise.resolve(this.OS);
	    const s = (s) => {
	      for (let r = 0; r < t.length; r++) {
	        const i = Si.nf(s, t[r]);
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
	  Bc() {
	    const t = {},
	      s = this.userAgentData.brands;
	    if (s && s.length)
	      for (const r of s) {
	        const s = this.Vc(Browsers),
	          i = r.brand.match(s);
	        if (i && i.length > 0) {
	          (t.browser = i[0]), (t.version = r.version);
	          break;
	        }
	      }
	    return t;
	  }
	  Vc(t) {
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

	class yi extends Oe {
	  constructor() {
	    super(), (this.Sd = yi.Bc(navigator.userAgent || ""));
	  }
	  ef() {
	    return this.Sd[0] || "Unknown Browser";
	  }
	  ff() {
	    return this.Sd[1] || "Unknown Version";
	  }
	  Fa(r) {
	    for (let n = 0; n < r.length; n++) {
	      const e = r[n].string;
	      let i = yi.nf(e, r[n]);
	      if (i)
	        return (
	          i === OperatingSystems.Pg && navigator.maxTouchPoints > 1 && (i = OperatingSystems.co),
	          Promise.resolve(i)
	        );
	    }
	    return Promise.resolve(navigator.platform);
	  }
	  static Bc(r) {
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

	class Bi {
	  constructor() {
	    let t;
	    (t =
	      navigator.userAgent.toLowerCase().includes(Browsers.Sg.toLowerCase()) ||
	      !navigator.userAgentData
	        ? yi
	        : Si),
	      (this.vg = new t()),
	      (this.userAgent = navigator.userAgent),
	      (this.browser = this.vg.ef()),
	      (this.version = this.vg.ff()),
	      (this.OS = null),
	      this.Fa().then((t) => (this.OS = t));
	    const i = navigator;
	    (this.language = (
	      i.userLanguage ||
	      i.language ||
	      i.browserLanguage ||
	      i.systemLanguage ||
	      ""
	    ).toLowerCase()),
	      (this.il = Bi.xg(this.userAgent));
	  }
	  mS() {
	    return this.browser === Browsers.Bg;
	  }
	  qa() {
	    return this.OS || null;
	  }
	  Fa() {
	    return this.OS
	      ? Promise.resolve(this.OS)
	      : this.vg.Fa(Bi.Og).then((t) => ((this.OS = t), t));
	  }
	  static xg(t) {
	    t = t.toLowerCase();
	    const i = [
	      "bot",
	      "spider",
	      "slurp",
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
	Bi.Og = [
	  { string: navigator.platform, cf: "Win", identity: OperatingSystems.kg },
	  { string: navigator.platform, cf: "Mac", identity: OperatingSystems.Pg },
	  { string: navigator.platform, cf: "BlackBerry", identity: "BlackBerry" },
	  { string: navigator.platform, cf: "FreeBSD", identity: "FreeBSD" },
	  { string: navigator.platform, cf: "OpenBSD", identity: "OpenBSD" },
	  { string: navigator.platform, cf: "Nintendo", identity: "Nintendo" },
	  { string: navigator.platform, cf: "SunOS", identity: "SunOS" },
	  { string: navigator.platform, cf: "PlayStation", identity: "PlayStation" },
	  { string: navigator.platform, cf: "X11", identity: "X11" },
	  {
	    string: navigator.userAgent,
	    cf: ["iPhone", "iPad", "iPod"],
	    identity: OperatingSystems.co,
	  },
	  { string: navigator.platform, cf: "Pike v", identity: OperatingSystems.co },
	  { string: navigator.userAgent, cf: ["Web0S"], identity: "WebOS" },
	  { string: navigator.userAgent, cf: "Tizen", identity: "Tizen" },
	  { string: navigator.userAgent, cf: "Coolita", identity: "Other Smart TV" },
	  { string: navigator.userAgent, cf: "WhaleTV", identity: "Other Smart TV" },
	  {
	    string: navigator.platform,
	    cf: ["Linux armv7l", "Android"],
	    identity: OperatingSystems.Dg,
	  },
	  { string: navigator.userAgent, cf: ["Android"], identity: OperatingSystems.Dg },
	  { string: navigator.platform, cf: "Linux", identity: "Linux" },
	];
	const ro = new Bi();

	const STORAGE_KEYS = {
	  Ou: {
	    Cu: "ab.storage.userId",
	    Wh: "ab.storage.deviceId",
	    um: "ab.storage.sessionId",
	  },
	  It: {
	    ac: "ab.test",
	    tS: "ab.storage.events",
	    eS: "ab.storage.attributes",
	    sS: "ab.storage.attributes.anonymous_user",
	    Aa: "ab.storage.device",
	    Ka: "ab.storage.sdk_metadata",
	    Pa: "ab.storage.session_id_for_cached_metadata",
	    xu: "ab.storage.pushToken",
	    rS: "ab.storage.cardImpressions",
	    Zl: "ab.storage.serverConfig",
	    oS: "ab.storage.triggers",
	    nS: "ab.storage.triggers.ts",
	    dm: "ab.storage.messagingSessionStart",
	    bi: "ab.storage.cc",
	    ji: "ab.storage.ccLastFullSync",
	    yi: "ab.storage.ccLastCardUpdated",
	    zl: "ab.storage.globalRateLimitCurrentTokenCount",
	    Xl: "ab.storage.dynamicRateLimitCurrentTokenCount",
	    Zt: "ab.storage.ccClicks",
	    ps: "ab.storage.ccImpressions",
	    fs: "ab.storage.ccDismissals",
	    aS: "ab.storage.lastDisplayedTriggerTimesById",
	    iS: "ab.storage.lastDisplayedTriggerTime",
	    SS: "ab.storage.triggerFireInstancesById",
	    fh: "ab.storage.signature",
	    ES: "ab.storage.brazeSyncRetryCount",
	    zi: "ab.storage.sdkVersion",
	    Vr: "ab.storage.ff",
	    Zr: "ab.storage.ffImpressions",
	    bo: "ab.storage.ffLastRefreshAt",
	    jo: "ab.storage.ff.sessionId",
	    lS: "ab.storage.lastReqToEndpoint",
	    _S: "ab.storage.requestAttempts",
	    la: "ab.storage.deferredIam",
	    wl: "ab.storage.lastSdkReq",
	    uS: "ab.storage.alias",
	    Tt: "ab.storage.banners",
	    At: "ab.storage.banners.impressions",
	    Xt: "ab.storage.banners.dismissals",
	    kt: "ab.storage.banners.sessionId",
	    Ht: "ab.storage.banners.lastRequestedTime",
	    _i: "ab.storage.dust.mite",
	    Oi: "ab.storage.dust.host",
	    Gi: "ab.storage.dust.auth",
	    Hi: "ab.storage.dust.expiration",
	    Zi: "ab.storage.dust.refreshLock",
	    _r: "ab.storage.dust.msgClaims",
	  },
	  ce: "ab.optOut",
	};
	class ne {
	  constructor(t, e) {
	    (this.cS = t), (this.TS = e), (this.cS = t), (this.TS = e);
	  }
	  hl(t) {
	    const e = keys(STORAGE_KEYS.Ou),
	      s = new ne.le(t);
	    for (const t of e) s.remove(STORAGE_KEYS.Ou[t]);
	  }
	  Ju(t, e) {
	    let s = null;
	    null != e && e instanceof _t && (s = e.qt()), this.cS.store(t, s);
	  }
	  hS(t) {
	    const e = this.$u(t);
	    null != e && ((e.pm = new Date().valueOf()), this.Ju(t, e));
	  }
	  $u(t) {
	    const e = this.cS.wr(t),
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
	    if (s) (r = _t._u(s) || null), r && this.Ju(t, r);
	    else {
	      const s = _t.AS(e);
	      (r = _t._u(s) || null), s !== e && r && this.Ju(t, r);
	    }
	    return r;
	  }
	  jm(t) {
	    this.cS.remove(t);
	  }
	  ll() {
	    const t = keys(STORAGE_KEYS.Ou);
	    let e;
	    for (const s of t)
	      (e = this.$u(STORAGE_KEYS.Ou[s])),
	        null != e && this.Ju(STORAGE_KEYS.Ou[s], e);
	  }
	  ol(t) {
	    let e;
	    if (null == t || 0 === t.length) return !1;
	    e = isArray(t) ? t : [t];
	    let s = this.TS.wr(STORAGE_KEYS.It.tS);
	    (null != s && isArray(s)) || (s = []);
	    for (let t = 0; t < e.length; t++) s.push(e[t].qt());
	    return this.TS.store(STORAGE_KEYS.It.tS, s);
	  }
	  gm(t) {
	    return null != t && this.ol([t]);
	  }
	  gS() {
	    let t = this.TS.wr(STORAGE_KEYS.It.tS);
	    this.TS.remove(STORAGE_KEYS.It.tS), null == t && (t = []);
	    const e = [];
	    let s = !1,
	      r = null;
	    if (isArray(t))
	      for (let s = 0; s < t.length; s++)
	        ve.RS(t[s]) ? e.push(ve._u(t[s])) : (r = s);
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
	        e.push(new ve(null, p._a, new Date().valueOf(), null, { e: o }));
	    }
	    return e;
	  }
	  Pt(t, e) {
	    return (
	      !!validateValueIsFromEnum(
	        STORAGE_KEYS.It,
	        t,
	        "StorageManager cannot store object.",
	        "STORAGE_KEYS.OBJECTS",
	      ) && this.TS.store(t, e)
	    );
	  }
	  St(t) {
	    return (
	      !!validateValueIsFromEnum(
	        STORAGE_KEYS.It,
	        t,
	        "StorageManager cannot retrieve object.",
	        "STORAGE_KEYS.OBJECTS",
	      ) && this.TS.wr(t)
	    );
	  }
	  Vt(t) {
	    return (
	      !!validateValueIsFromEnum(
	        STORAGE_KEYS.It,
	        t,
	        "StorageManager cannot remove object.",
	        "STORAGE_KEYS.OBJECTS",
	      ) && (this.TS.remove(t), !0)
	    );
	  }
	  clearData() {
	    const t = keys(STORAGE_KEYS.Ou),
	      e = keys(STORAGE_KEYS.It);
	    for (let e = 0; e < t.length; e++) {
	      const s = t[e];
	      this.cS.remove(STORAGE_KEYS.Ou[s]);
	    }
	    for (let t = 0; t < e.length; t++) {
	      const s = e[t];
	      this.TS.remove(STORAGE_KEYS.It[s]);
	    }
	  }
	  dS(t) {
	    return t || STORAGE_KEYS.It.sS;
	  }
	  fl(t) {
	    let e = this.TS.wr(STORAGE_KEYS.It.eS);
	    null == e && (e = {});
	    const s = this.dS(t[User.Sa]),
	      r = e[s];
	    for (const o in t)
	      o !== User.Sa &&
	        (null == e[s] || (r && null == r[o])) &&
	        this.Fu(t[User.Sa], o, t[o]);
	  }
	  Fu(t, e, s) {
	    let r = this.TS.wr(STORAGE_KEYS.It.eS);
	    null == r && (r = {});
	    const o = this.dS(t);
	    let n = r[o];
	    if (
	      (null == n && ((n = {}), null != t && (n[User.Sa] = t)), e === User.Eu)
	    ) {
	      null == n[e] && (n[e] = {});
	      for (const t in s) n[e][t] = s[t];
	    } else n[e] = s;
	    return (r[o] = n), this.TS.store(STORAGE_KEYS.It.eS, r);
	  }
	  IS() {
	    const t = this.TS.wr(STORAGE_KEYS.It.eS);
	    this.TS.remove(STORAGE_KEYS.It.eS);
	    const e = [];
	    for (const s in t) null != t[s] && e.push(t[s]);
	    return e;
	  }
	  qu(t) {
	    const e = this.TS.wr(STORAGE_KEYS.It.eS);
	    if (null != e) {
	      const s = this.dS(null),
	        r = e[s];
	      null != r &&
	        ((e[s] = void 0),
	        this.TS.store(STORAGE_KEYS.It.eS, e),
	        (r[User.Sa] = t),
	        this.fl(r));
	    }
	    const s = this.$u(STORAGE_KEYS.Ou.um);
	    let r = null;
	    null != s && (r = s.Iu);
	    const o = this.gS();
	    if (null != o)
	      for (let e = 0; e < o.length; e++) {
	        const s = o[e];
	        null == s.userId && s.sessionId == r && (s.userId = t), this.gm(s);
	      }
	  }
	  bS() {
	    return this.TS.fS;
	  }
	}
	(ne.ec = class {
	  constructor(t) {
	    (this.eu = t), (this.eu = t), (this.fS = ro.mS() ? 3 : 10);
	  }
	  KS(t) {
	    return t + "." + this.eu;
	  }
	  store(t, e) {
	    const s = { v: e };
	    try {
	      return localStorage.setItem(this.KS(t), JSON.stringify(s)), !0;
	    } catch (t) {
	      return b$1.info("Storage failure: " + getErrorMessage(t)), !1;
	    }
	  }
	  wr(t) {
	    try {
	      let e = null;
	      const s = localStorage.getItem(this.KS(t));
	      return null != s && (e = JSON.parse(s)), null == e ? null : e.v;
	    } catch (t) {
	      return b$1.info("Storage retrieval failure: " + getErrorMessage(t)), null;
	    }
	  }
	  remove(t) {
	    try {
	      localStorage.removeItem(this.KS(t));
	    } catch (t) {
	      return b$1.info("Storage removal failure: " + getErrorMessage(t)), !1;
	    }
	  }
	}),
	  (ne.rc = class {
	    constructor() {
	      (this.NS = {}), (this.YS = 5242880), (this.fS = 3);
	    }
	    store(t, e) {
	      const s = { value: e },
	        r = this.DS(e);
	      return r > this.YS
	        ? (b$1.info(
	            "Storage failure: object is ≈" +
	              r +
	              " bytes which is greater than the max of " +
	              this.YS,
	          ),
	          !1)
	        : ((this.NS[t] = s), !0);
	    }
	    DS(t) {
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
	    wr(t) {
	      const e = this.NS[t];
	      return null == e ? null : e.value;
	    }
	    remove(t) {
	      this.NS[t] = null;
	    }
	  }),
	  (ne.le = class {
	    constructor(t, e, s) {
	      (this.eu = t), (this.CS = e), (this.eu = t), (this.GS = this.MS());
	      const r = "number" == typeof s && s > 0 ? s : 400;
	      (this.US = 24 * r * 60), (this.pS = {}), (this.CS = !!e);
	    }
	    KS(t) {
	      return null != this.eu ? t + "." + this.eu : t;
	    }
	    MS() {
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
	      return t.setTime(t.getTime() + 60 * this.US * 1e3), t.getFullYear();
	    }
	    vS() {
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
	          -1 === t.indexOf("." + this.eu) && this.yS(t);
	        }
	      }
	    }
	    store(t, e) {
	      this.vS();
	      const s = this.KS(t),
	        r = new Date();
	      r.setTime(r.getTime() + 60 * this.US * 1e3);
	      const o = "expires=" + r.toUTCString(),
	        n = "domain=" + this.GS;
	      let a;
	      a = this.CS ? e : encodeURIComponent(e);
	      const i = s + "=" + a + ";" + o + ";" + n + ";path=/";
	      if (i.length >= 4093)
	        return (
	          b$1.info(
	            "Storage failure: string is " +
	              i.length +
	              " chars which is too large to store as a cookie.",
	          ),
	          (this.pS[s] = !0),
	          this.yS(s),
	          !1
	        );
	      try {
	        document.cookie = i;
	      } catch (t) {
	        return b$1.info("Storage failure: " + getErrorMessage(t)), (this.pS[s] = !0), !1;
	      }
	      const S = this.CS ? String(a) : decodeURIComponent(a);
	      return this.LS(s) !== S
	        ? (b$1.info(
	            `Storage failure: unable to verify cookie write for "${s}". Falling back to other storage.`,
	          ),
	          (this.pS[s] = !0),
	          this.yS(s),
	          !1)
	        : (delete this.pS[s], !0);
	    }
	    wr(t) {
	      const e = this.KS(t);
	      return this.pS[e] ? null : this.LS(e);
	    }
	    LS(t) {
	      const e = [],
	        s = t + "=",
	        r = document.cookie.split(";");
	      for (let o = 0; o < r.length; o++) {
	        let n = r[o];
	        for (; " " === n.charAt(0); ) n = n.substring(1);
	        if (0 === n.indexOf(s))
	          try {
	            let t;
	            (t = this.CS
	              ? n.substring(s.length, n.length)
	              : decodeURIComponent(n.substring(s.length, n.length))),
	              e.push(t);
	          } catch (e) {
	            return (
	              b$1.info("Storage retrieval failure: " + getErrorMessage(e)), this.yS(t), null
	            );
	          }
	      }
	      return e.length > 0 ? e[e.length - 1] : null;
	    }
	    remove(t) {
	      this.yS(this.KS(t));
	    }
	    yS(t) {
	      const e = t + "=;expires=" + new Date(0).toUTCString();
	      (document.cookie = e), (document.cookie = e + ";path=/");
	      const s = e + ";domain=" + this.GS;
	      (document.cookie = s), (document.cookie = s + ";path=/");
	    }
	  }),
	  (ne.tc = class {
	    constructor(t, e, s, r) {
	      (this.eu = t),
	        (this.BS = []),
	        e && this.BS.push(new ne.le(t, void 0, r)),
	        s && this.BS.push(new ne.ec(t)),
	        this.BS.push(new ne.rc());
	    }
	    store(t, e) {
	      let s = !0;
	      for (let r = 0; r < this.BS.length; r++) s = this.BS[r].store(t, e) && s;
	      return s;
	    }
	    wr(t) {
	      for (let e = 0; e < this.BS.length; e++) {
	        const s = this.BS[e].wr(t);
	        if (null != s) return s;
	      }
	      return null;
	    }
	    remove(t) {
	      new ne.le(this.eu).remove(t);
	      for (let e = 0; e < this.BS.length; e++) this.BS[e].remove(t);
	    }
	  });

	class Vt {
	  constructor(t, i, s) {
	    (this.j = t),
	      (this.gh = i),
	      (this.bh = s),
	      (this.j = t),
	      (this.gh = i || !1),
	      (this.bh = s),
	      (this.Sh = new f()),
	      (this.Ah = 0),
	      (this.ph = 1);
	  }
	  Fh() {
	    return this.gh;
	  }
	  kh() {
	    return this.j.St(STORAGE_KEYS.It.fh);
	  }
	  setSdkAuthenticationSignature(t) {
	    const i = this.kh();
	    this.j.Pt(STORAGE_KEYS.It.fh, t);
	    const e = et._s.Xs;
	    new et(e, b$1).setItem(e.Ws.wh, this.ph, t), i !== t && this.ct();
	  }
	  jh() {
	    this.j.Vt(STORAGE_KEYS.It.fh);
	    const t = et._s.Xs;
	    new et(t, b$1).ge(t.Ws.wh, this.ph);
	  }
	  subscribeToSdkAuthenticationFailures(t) {
	    return this.bh.Ut(t);
	  }
	  Ch(t) {
	    this.bh.A(t);
	  }
	  xh() {
	    this.Sh.removeAllSubscriptions();
	  }
	  Eh() {
	    this.Ah += 1;
	  }
	  Ih() {
	    return this.Ah;
	  }
	  ct() {
	    this.Ah = 0;
	  }
	}

	class t {
	  constructor() {}
	  q(a) {}
	  changeUser(a = !1) {}
	  clearData(a = !1) {}
	}

	class ke {
	  constructor(s) {
	    (this.id = s), (this.id = s);
	  }
	  Uo() {
	    const s = {};
	    return (
	      null != this.browser && (s.browser = this.browser),
	      null != this.Oa && (s.browser_version = this.Oa),
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

	class Wt {
	  constructor(t, e) {
	    (this.j = t),
	      (this.Da = e),
	      (this.j = t),
	      null == e && (e = values(DeviceProperties)),
	      (this.Da = e);
	  }
	  ve(t = !0) {
	    let e = this.j.$u(STORAGE_KEYS.Ou.Wh);
	    null == e && ((e = new _t(V$1.de())), t && this.j.Ju(STORAGE_KEYS.Ou.Wh, e));
	    const r = new ke(e.Iu);
	    for (let t = 0; t < this.Da.length; t++) {
	      switch (this.Da[t]) {
	        case DeviceProperties.BROWSER:
	          r.browser = ro.browser;
	          break;
	        case DeviceProperties.BROWSER_VERSION:
	          r.Oa = ro.version;
	          break;
	        case DeviceProperties.OS:
	          r.os = this.Fa();
	          break;
	        case DeviceProperties.RESOLUTION:
	          r.Ga = screen.width + "x" + screen.height;
	          break;
	        case DeviceProperties.LANGUAGE:
	          r.language = ro.language;
	          break;
	        case DeviceProperties.TIME_ZONE:
	          r.timeZone = this.Ja(new Date());
	          break;
	        case DeviceProperties.USER_AGENT:
	          r.userAgent = ro.userAgent;
	      }
	    }
	    return r;
	  }
	  Fa() {
	    if (ro.qa()) return ro.qa();
	    const t = this.j.St(STORAGE_KEYS.It.Aa);
	    return t && t.os_version ? t.os_version : ro.Fa();
	  }
	  Ja(t) {
	    let e = !1;
	    if ("undefined" != typeof Intl && "function" == typeof Intl.DateTimeFormat)
	      try {
	        if ("function" == typeof Intl.DateTimeFormat().resolvedOptions) {
	          const t = Intl.DateTimeFormat().resolvedOptions().timeZone;
	          if (null != t && "" !== t) return t;
	        }
	      } catch (t) {
	        b$1.info(
	          "Intl.DateTimeFormat threw an error, cannot detect user's time zone:" +
	            getErrorMessage(t),
	        ),
	          (e = !0);
	      }
	    if (e) return "";
	    const r = t.getTimezoneOffset();
	    return this.Ba(r);
	  }
	  Ba(t) {
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

	var Re = {
	  Ya: "invalid_api_key",
	  Qa: "blacklisted",
	  Va: "no_device_identifier",
	  Wa: "invalid_json_response",
	  Ha: "empty_response",
	  __: "sdk_auth_error",
	};

	const h = {
	  it: {
	    Cn: "data",
	    Mi: "content_cards/sync",
	    vo: "feature_flags/sync",
	    Xo: "template",
	    st: "banners/sync",
	    ka: "push/unregister",
	  },
	  Il: (e) => (null == e ? void 0 : e.St(STORAGE_KEYS.It.lS)),
	  Rm: (e) => (null == e ? void 0 : e.St(STORAGE_KEYS.It._S)),
	  Am: (e, t) => {
	    null == e || e.Pt(STORAGE_KEYS.It.lS, t);
	  },
	  qm: (e, t) => {
	    null == e || e.Pt(STORAGE_KEYS.It._S, t);
	  },
	  gl: (e, t) => {
	    if (!e || !t) return -1;
	    const s = h.Il(e);
	    if (null == s) return -1;
	    const n = s[t];
	    return null == n || isNaN(n) ? -1 : n;
	  },
	  bl: (e, t) => {
	    let s = REQUEST_ATTEMPT_DEFAULT;
	    if (!e || !t) return s;
	    const n = h.Rm(e);
	    return null == n ? s : ((s = n[t]), null == s || isNaN(s) ? REQUEST_ATTEMPT_DEFAULT : s);
	  },
	  nt: (e, t, s) => {
	    if (!e || !t) return;
	    let n = h.Il(e);
	    null == n && (n = {}), (n[t] = s), h.Am(e, n);
	  },
	  ql: (e, t, s) => {
	    if (!e || !t) return;
	    let n = h.Rm(e);
	    null == n && (n = {}), (n[t] = s), h.qm(e, n);
	  },
	  Ji: (e, t) => {
	    e && t && h.ql(e, t, REQUEST_ATTEMPT_DEFAULT);
	  },
	  Sl: (e, t) => {
	    if (!e || !t) return;
	    const s = h.bl(e, t);
	    h.ql(e, t, s + 1);
	  },
	};

	const l = {
	  ot: (t) => {
	    let e, o;
	    try {
	      const r = () => {
	        b$1.error("This browser does not have any supported ajax options!");
	      };
	      let n = !1;
	      if ((window.XMLHttpRequest && (n = !0), !n)) return void r();
	      e = new XMLHttpRequest();
	      const s = (o) => {
	        "function" == typeof t.error && t.error(e.status),
	          "function" == typeof t.ft && t.ft(!1, o);
	      };
	      (e.onload = () => {
	        let o = !1;
	        if (4 !== e.readyState) return;
	        o = (e.status >= 200 && e.status < 300) || 304 === e.status;
	        const r = e.getAllResponseHeaders();
	        if (o) {
	          if ("function" == typeof t.lt) {
	            let o;
	            try {
	              o = JSON.parse(e.responseText);
	            } catch (o) {
	              const n = {
	                error: "" === e.responseText ? Re.Ha : Re.Wa,
	                response: e.responseText,
	              };
	              (0, t.lt)(n, r);
	            }
	            o && t.lt(o, r);
	          }
	          "function" == typeof t.ft && t.ft(!0, r);
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
	      b$1.error(`Network request error: ${getErrorMessage(t)}`);
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

	class Xt {
	  constructor(t, e, i, s, r, n, o, a, h, u, l, c) {
	    (this.tu = t),
	      (this.j = e),
	      (this.Gh = i),
	      (this.Ss = s),
	      (this.C = r),
	      (this.h = n),
	      (this.eu = o),
	      (this.Yh = a),
	      (this.Vh = h),
	      (this.Kh = u),
	      (this.appVersion = l),
	      (this.Ra = c),
	      (this.Xa = (t) => (null == t ? "" : `${t} `)),
	      (this.tu = t),
	      (this.j = e),
	      (this.Gh = i),
	      (this.Ss = s),
	      (this.C = r),
	      (this.h = n),
	      (this.eu = o),
	      (this.Yh = a),
	      (this.Vh = h),
	      (this.Kh = u),
	      (this.appVersion = l),
	      (this.Ra = c),
	      (this.$a = ["npm"]),
	      (this.La = {});
	  }
	  Z(t, e = !1, i = !1) {
	    const r = this.tu.ve(!i),
	      n = r.Uo(),
	      o = this.j.St(STORAGE_KEYS.It.Aa);
	    isEqual(o, n) || (t.device = n),
	      (t.api_key = this.eu),
	      (t.time = convertMsToSeconds(new Date().valueOf(), !0));
	    const a = this.j.St(STORAGE_KEYS.It.Ka) || [],
	      h = this.j.St(STORAGE_KEYS.It.Pa) || "";
	    this.$a.length > 0 &&
	      (!isEqual(a, this.$a) || h !== this.C.$t()) &&
	      (t.sdk_metadata = this.$a),
	      (t.sdk_version = this.Vh),
	      this.Kh && (t.sdk_flavor = this.Kh),
	      (t.app_version = this.appVersion),
	      (t.app_version_code = this.Ra),
	      (t.device_id = r.id);
	    const u = this.Ss.getUserId();
	    if ((e && null !== u && (t.user_id = u), !u && !this.Gh.Fh())) {
	      const e = getAlias(this.j);
	      e && (t.alias = e);
	    }
	    return t;
	  }
	  ut(t, e, i) {
	    const s = e.auth_error,
	      r = e.error;
	    if (!s && !r) return !0;
	    if (s) {
	      let e;
	      this.Gh.Eh();
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
	        this.Gh.Fh() ||
	          (e +=
	            ' Please use the "enableSdkAuthentication" initialization option to enable authentication.'),
	        b$1.error(`SDK Authentication failed ${e}`),
	        this.Ua(t.events || [], t.attributes || []),
	        this.Gh.Ch(r),
	        !1
	      );
	    }
	    if (r) {
	      let i,
	        s = r;
	      switch (s) {
	        case Re.Ha:
	          return (
	            (i = "Received successful response with empty body."),
	            v$1.Dt(p._a, { e: i }),
	            b$1.info(i),
	            !1
	          );
	        case Re.Wa:
	          return (
	            (i = "Received successful response with invalid JSON"),
	            v$1.Dt(p._a, { e: i + ": " + e.response }),
	            b$1.info(i),
	            !1
	          );
	        case Re.Ya:
	          s = `The API key "${t.api_key}" is invalid for the baseUrl ${this.Yh}`;
	          break;
	        case Re.Qa:
	          s =
	            "Sorry, we are not currently accepting your requests. If you think this is in error, please contact us.";
	          break;
	        case Re.Va:
	          s =
	            "No device identifier. Please contact Braze Technical Support for assistance.";
	      }
	      b$1.error("Backend error: " + s);
	    }
	    return !1;
	  }
	  Za(t, e, i) {
	    return !!((t && 0 !== t.length) || (e && 0 !== e.length) || i);
	  }
	  dl(t, e, i, s = !1, r = "sdk") {
	    const n = [],
	      o = (t) => t || "",
	      a = o(this.Ss.getUserId());
	    let u = this.Qo(t);
	    const l = [],
	      c = [];
	    let d,
	      f = null;
	    if (e.length > 0) {
	      const t = [];
	      for (const i of e) {
	        if (((d = i.Uo()), this.Gh.Fh())) {
	          if (a && !d.user_id) {
	            f || (f = {}), f.events || (f.events = []), f.events.push(d);
	            continue;
	          }
	          if (o(d.user_id) !== a) {
	            c.push(d);
	            continue;
	          }
	        }
	        t.push(d);
	      }
	      t.length > 0 && (u.events = t);
	    }
	    if (i.length > 0) {
	      const t = [];
	      for (const e of i)
	        e && (this.Gh.Fh() && o(e.user_id) !== a ? l.push(e) : t.push(e));
	      t.length > 0 && (u.attributes = t);
	    }
	    if ((this.Ua(c, l), (u = this.Z(u, !1, s)), f)) {
	      f = this.Z(f, !1, s);
	      const t = { requestData: f, headers: this.tt(f, h.it.Cn, r) };
	      n.push(t);
	    }
	    if (u && !this.Za(u.events, u.attributes, t)) return f ? n : null;
	    const m = { requestData: u, headers: this.tt(u, h.it.Cn, r) };
	    return n.push(m), n;
	  }
	  Ua(t, e) {
	    if (t) {
	      const e = [];
	      for (const i of t) {
	        const t = ve.fromJson(i);
	        (t.time = convertSecondsToMs(t.time)), e.push(t);
	      }
	      this.j.ol(e);
	    }
	    if (e) for (const t of e) this.j.fl(t);
	  }
	  dt(t, e) {
	    let i = "HTTP error ";
	    null != t && (i += t + " "), (i += e), b$1.error(i);
	  }
	  ml(t) {
	    return v$1.Dt(p.vl, { n: t });
	  }
	  Qo(t, e) {
	    const i = {};
	    t && (i.triggers = !0);
	    const s = null != e ? e : this.Ss.getUserId();
	    if ((s && (i.user_id = s), !i.user_id && !this.Gh.Fh())) {
	      const t = getAlias(this.j);
	      t && (i.alias = t);
	    }
	    return (i.config = { config_time: this.h.Qt() }), { respond_with: i };
	  }
	  Rl(t) {
	    const e = new Date().valueOf();
	    let i = LAST_REQUEST_TO_ENDPOINT_MS_AGO_DEFAULT.toString();
	    const s = h.gl(this.j, t);
	    if (-1 !== s) {
	      i = (e - s).toString();
	    }
	    return i;
	  }
	  tt(t, e, i = "sdk") {
	    const s = [["X-Braze-Api-Key", this.eu]],
	      r = this.Rl(e);
	    s.push(["X-Braze-Last-Req-Ms-Ago", r]);
	    const n = h.bl(this.j, e).toString();
	    s.push(["X-Braze-Req-Attempt", n]);
	    let o = !1;
	    if (
	      (null != t.respond_with &&
	        t.respond_with.triggers &&
	        (s.push(["X-Braze-TriggersRequest", "true"]), (o = !0)),
	      e === h.it.Mi)
	    ) {
	      s.push(["X-Braze-ContentCardsRequest", "true"]);
	      let t = h.bl(this.j, h.it.Mi);
	      (t && "client" !== i) || ((t = 1), h.ql(this.j, h.it.Mi, t));
	      const e = Math.max(0, t - 1);
	      s.push(["BRAZE-SYNC-RETRY-COUNT", e.toString()]), (o = !0);
	    }
	    if (
	      (e === h.it.vo &&
	        (s.push(["X-Braze-FeatureFlagsRequest", "true"]), (o = !0)),
	      o && s.push(["X-Braze-DataRequest", "true"]),
	      "dust" === i && s.push(["X-Braze-Request-Initiated-By", "di"]),
	      this.Gh.Fh())
	    ) {
	      const t = this.Gh.kh();
	      null != t && s.push(["X-Braze-Auth-Signature", t]);
	    }
	    return s;
	  }
	  Al(t, e, i, s) {
	    if (this.La[s]) return;
	    const r = window.setTimeout(() => {
	      b$1.info(`Retrying rate limited ${this.Xa(s)}SDK request.`),
	        this.et(e, i, s);
	    }, t);
	    this.La[s] = r;
	  }
	  fo() {
	    for (const t in this.La) {
	      const e = this.La[t];
	      window.clearTimeout(e);
	    }
	    this.La = {};
	  }
	  et(t, e, i, r) {
	    if (!this.Dl(i))
	      return (
	        b$1.info(`${this.Xa(i)}SDK request being rate limited.`),
	        void ("function" == typeof r && r())
	      );
	    const n = this.kl();
	    if (!n.Tl)
	      return (
	        this.Al(n.yl, t, e, i),
	        void b$1.info(
	          `${this.Xa(
            i,
          )}SDK request being rate limited. Request will be retried in ${Math.trunc(
            n.yl / 1e3,
          )} seconds.`,
	        )
	      );
	    this.j.Pt(STORAGE_KEYS.It.wl, new Date().valueOf());
	    const o = t.device;
	    o && o.os_version instanceof Promise
	      ? o.os_version.then((i) => {
	          (t.device.os_version = i), e(n.Nl);
	        })
	      : e(n.Nl);
	  }
	  Bl(t) {
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
	      v$1.Dt(p._a, { e: t + ": " + i });
	    }
	    return null;
	  }
	  yt(t, e, i, s, r, n) {
	    if (h.bl(this.j, i) >= MAX_RETRY_COUNT_PER_REQUEST) return;
	    let o;
	    n = n || 0;
	    const a = this.Bl(t);
	    r();
	    const u = (t) => {
	      const r = window.setTimeout(() => {
	        e();
	      }, t);
	      s(r), h.Sl(this.j, i);
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
	    } else n ? u(n) : h.Ji(this.j, i);
	  }
	  Cl(t) {
	    var e;
	    null === (e = this.j) || void 0 === e || e.Pt(STORAGE_KEYS.It.zl, t);
	  }
	  jl(t, e) {
	    let i = this.Ml();
	    null == i && (i = {}), (i[t] = e), this.j.Pt(STORAGE_KEYS.It.Xl, i);
	  }
	  $l() {
	    var t;
	    return null === (t = this.j) || void 0 === t ? void 0 : t.St(STORAGE_KEYS.It.zl);
	  }
	  Ml() {
	    var t;
	    return null === (t = this.j) || void 0 === t ? void 0 : t.St(STORAGE_KEYS.It.Xl);
	  }
	  Ll(t, e, i, s, r = "") {
	    let n;
	    if (r) {
	      const t = this.Ml();
	      n = null == t || isNaN(t[r]) ? e : t[r];
	    } else (n = this.$l()), (null == n || isNaN(n)) && (n = e);
	    const o = (t - s) / 1e3;
	    return (n = Math.min(n + o / i, e)), n;
	  }
	  El(t, e) {
	    return Math.max(0, (1 - t) * e * 1e3);
	  }
	  Fl(t, e = "") {
	    var i, r, n, o, a;
	    const u = { Tl: !0, Nl: -1, yl: 0 };
	    if ((null == t && (t = !0), !t && !e)) return u;
	    let l,
	      c,
	      d = null;
	    if (t) d = null === (i = this.j) || void 0 === i ? void 0 : i.St(STORAGE_KEYS.It.wl);
	    else {
	      const t = h.Il(this.j);
	      if (null == t || null == t[e]) return u;
	      d = t[e];
	    }
	    if (null == d || isNaN(d)) return u;
	    if (
	      (t
	        ? ((l =
	            (null === (r = this.h) || void 0 === r ? void 0 : r.Kl()) || -1),
	          (c = (null === (n = this.h) || void 0 === n ? void 0 : n.Pl()) || -1))
	        : ((l =
	            (null === (o = this.h) || void 0 === o ? void 0 : o.Ul(e)) || -1),
	          (c =
	            (null === (a = this.h) || void 0 === a ? void 0 : a.xl(e)) || -1)),
	      -1 === l || -1 === c)
	    )
	      return u;
	    const f = new Date().valueOf();
	    let m = this.Ll(f, l, c, d, e);
	    return m < 1
	      ? ((u.Tl = !1), (u.yl = this.El(m, c)), u)
	      : ((m = Math.trunc(m) - 1),
	        (u.Nl = m),
	        t ? this.Cl(m) : this.jl(e, m),
	        u);
	  }
	  kl() {
	    return this.Fl(!0);
	  }
	  Dl(t) {
	    const e = this.Fl(!1, t);
	    return !(e && !e.Tl);
	  }
	  ct() {
	    this.Gh.ct();
	  }
	  ht() {
	    return this.Yh;
	  }
	  addSdkMetadata(t) {
	    for (const e of t) -1 === this.$a.indexOf(e) && this.$a.push(e);
	  }
	}

	const IamStrings = {
	  EE: "inAppMessage must be an InAppMessage object",
	  TE: "ab-pause-scrolling",
	};
	const IamColors = {
	  IE: 4281545523,
	  AE: 4294967295,
	  _E: 4278219733,
	  SE: 4293914607,
	  OE: 4283782485,
	  LE: 3224580915,
	  NE: 4288387995,
	};
	const IamSlideFrom = { TOP: "TOP", BOTTOM: "BOTTOM" };
	const IamClickAction = { URI: "URI", NONE: "NONE" };
	const IamDismissType = { AUTO_DISMISS: "AUTO_DISMISS", MANUAL: "SWIPE" };
	const IamOpenTarget = { NONE: "NONE", BLANK: "BLANK" };
	const IamImageStyle = { TOP: "TOP", GRAPHIC: "GRAPHIC" };
	const IamOrientation = { PORTRAIT: "PORTRAIT", LANDSCAPE: "LANDSCAPE" };
	const IamTextAlignment = {
	  START: "START",
	  CENTER: "CENTER",
	  END: "END",
	};
	const IamCropType = {
	  CENTER_CROP: "CENTER_CROP",
	  FIT_CENTER: "FIT_CENTER",
	};
	const IamServerTypes = {
	  RE: "SLIDEUP",
	  tE: "MODAL",
	  eE: "MODAL_STYLED",
	  oE: "FULL",
	  ME: "WEB_HTML",
	  CE: "HTML",
	  DE: "HTML_FULL",
	};
	const IamTiming = { gr: 500, sE: 200, aE: 2e3 };
	const IAM_SHOW_CLASS = "ab-show";
	const IAM_HIDE_CLASS = "ab-hide";
	const IAM_SHOWING_CLASS = "ab-iam-showing";
	const IamSerializationKeys = {
	  UE: "m",
	  cE: "ma",
	  nE: "sf",
	  Is: "e",
	  PE: "ti",
	  iE: "ca",
	  URI: "u",
	  pE: "oa",
	  rE: "dt",
	  mE: "d",
	  GE: "i",
	  Bs: "iu",
	  xE: "is",
	  HE: "ic",
	  FE: "ibc",
	  BE: "bc",
	  bE: "tc",
	  gE: "cbc",
	  lE: "ai",
	  YE: "ao",
	  hE: "h",
	  KE: "ha",
	  WE: "htc",
	  XE: "fc",
	  yE: "b",
	  dE: "ct",
	  uE: "o",
	  fE: "hi",
	  CSS: "css",
	  xs: "type",
	  wE: "messageFields",
	  jE: "me",
	  LANGUAGE: "l",
	  Ns: "ia",
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
	  const t = document.getElementsByClassName(IamStrings.TE);
	  for (let o = 0; o < t.length; o++) {
	    const s = t[o].classList;
	    s.contains(IamStrings.TE) && s.remove(IamStrings.TE);
	  }
	}

	class L {
	  constructor(t = !1, s = []) {
	    (this.lt = t), (this.Ce = s), (this.lt = t), (this.Ce = s);
	  }
	  Cs(t) {
	    (this.lt = this.lt && t.lt), this.Ce.push(...t.Ce);
	  }
	}

	const Dt = {
	  cu: () =>
	    "serviceWorker" in navigator &&
	    "undefined" != typeof ServiceWorkerRegistration &&
	    "showNotification" in ServiceWorkerRegistration.prototype &&
	    "PushManager" in window,
	  du: () =>
	    "safari" in window &&
	    "pushNotification" in window.safari &&
	    "function" == typeof window.safari.pushNotification.permission &&
	    "function" == typeof window.safari.pushNotification.requestPermission,
	  isPushSupported: () => Dt.cu() || Dt.du(),
	  isPushBlocked: () => {
	    const o =
	        Dt.isPushSupported() &&
	        "Notification" in window &&
	        null != window.Notification &&
	        null != window.Notification.permission &&
	        "denied" === window.Notification.permission,
	      i =
	        Dt.isPushSupported() &&
	        (!("Notification" in window) || null == window.Notification);
	    return o || i;
	  },
	  isPushPermissionGranted: () =>
	    Dt.isPushSupported() &&
	    "Notification" in window &&
	    null != window.Notification &&
	    null != window.Notification.permission &&
	    "granted" === window.Notification.permission,
	  Yn: () =>
	    Dt.isPushBlocked()
	      ? { Zn: !1, reason: "blocked" }
	      : Dt.isPushSupported()
	      ? Dt.isPushPermissionGranted()
	        ? { Zn: !1, reason: "permissionGranted" }
	        : { Zn: !0 }
	      : { Zn: !1, reason: "unsupported" },
	  So: (o, i) =>
	    "blocked" === o
	      ? `${i} containing a push prompt is not being shown because the user has already declined push permission prompt.`
	      : "unsupported" === o
	      ? `${i} containing a push prompt is not being shown because the browser doesn't support push notifications.`
	      : `${i} containing a push prompt is not being shown because the user has already accepted the permission prompt.`,
	};
	var Dt$1 = Dt;

	const randomInclusive = (t, a) => (
	  (t = Math.ceil(t)),
	  (a = Math.floor(a)),
	  Math.floor(Math.random() * (a - t + 1)) + t
	);

	class Zt {
	  constructor(t, i, s, e, h, o, n, r, l, u) {
	    (this.eu = t),
	      (this.baseUrl = i),
	      (this.C = s),
	      (this.tu = e),
	      (this.Ss = h),
	      (this.h = o),
	      (this.j = n),
	      (this.hc = r),
	      (this.Gh = l),
	      (this.B = u),
	      (this.eu = t),
	      (this.baseUrl = i),
	      (this.nc = 0),
	      (this.fS = n.bS() || 0),
	      (this.lc = null),
	      (this.C = s),
	      (this.tu = e),
	      (this.Ss = h),
	      (this.h = o),
	      (this.j = n),
	      (this.Gh = l),
	      (this.B = u),
	      (this.hc = r),
	      (this.uc = new f()),
	      (this.cc = null),
	      (this.dc = 50),
	      (this.mc = !1),
	      (this.fc = !1);
	  }
	  gc(t, i) {
	    return !t && !i && this.Gh.Ih() >= this.dc;
	  }
	  vc(t) {
	    let i = this.C.am();
	    if (t.length > 0) {
	      const s = this.Ss.getUserId();
	      for (const e of t) {
	        const t = (!e.userId && !s) || e.userId === s;
	        e.type === p.wm && t && (i = !0);
	      }
	    }
	    return i;
	  }
	  bc(t = !1, i = !0, e, o, n, r = !1, u = !1, c = "sdk") {
	    i && this.wc();
	    const d = this.j.gS(),
	      m = this.j.IS();
	    let f = !1;
	    const g = (t, r, u = -1) => {
	        const c = new Date().valueOf();
	        h.nt(this.j, h.it.Cn, c),
	          -1 !== u && r.push(["X-Braze-Req-Tokens-Remaining", u.toString()]);
	        let d = !1;
	        l.ot({
	          url: this.baseUrl + "/data/",
	          data: t,
	          headers: r,
	          lt: (i) => {
	            null != t.respond_with &&
	              t.respond_with.triggers &&
	              (this.nc = Math.max(this.nc - 1, 0)),
	              this.B.ut(t, i, r)
	                ? (this.Gh.ct(),
	                  this.h.sd(i),
	                  (null != t.respond_with &&
	                    t.respond_with.user_id != this.Ss.getUserId()) ||
	                    (null != t.device && this.j.Pt(STORAGE_KEYS.It.Aa, t.device),
	                    null != t.sdk_metadata &&
	                      (this.j.Pt(STORAGE_KEYS.It.Ka, t.sdk_metadata),
	                      this.j.Pt(STORAGE_KEYS.It.Pa, this.C.$t())),
	                    this.hc(i),
	                    h.ql(this.j, h.it.Cn, 1),
	                    "function" == typeof e && e()))
	                : i.auth_error && (d = !0);
	          },
	          error: () => {
	            (d = !0),
	              null != t.respond_with &&
	                t.respond_with.triggers &&
	                (this.nc = Math.max(this.nc - 1, 0)),
	              this.B.Ua(t.events, t.attributes),
	              "function" == typeof o && o();
	          },
	          ft: (t, s) => {
	            "function" == typeof n && n(!d);
	            const e = this.B.Bl(s);
	            let o = 0;
	            if (e)
	              switch (e.type) {
	                case "date":
	                  o = Math.max(e.value - new Date().valueOf(), 0);
	                  break;
	                case "timestamp":
	                  o = e.value;
	              }
	            if (i && !f) {
	              if (d) {
	                h.Sl(this.j, h.it.Cn);
	                const t = this.h.vt(),
	                  i = this.h.gt(),
	                  s = this.h.bt();
	                let e = this.lc;
	                (null == e || e < t) && (e = t);
	                const n = Math.min(s, randomInclusive(t, e * i)) + o;
	                this.kc(n);
	              } else this.kc(Math.max(1e3 * this.fS, o));
	              f = !0;
	            }
	          },
	        });
	      },
	      p = this.vc(d),
	      v = t || p;
	    if (this.gc(r, p))
	      return void b$1.info(
	        "Declining to flush data due to 50 consecutive authentication failures",
	      );
	    if (i && !this.B.Za(d, m, v))
	      return this.kc(), void ("function" == typeof n && n(!0));
	    const w = this.B.dl(v, d, m, u, c);
	    v && this.nc++;
	    let k = !1;
	    if (w)
	      for (const t of w)
	        this.B.et(
	          t.requestData,
	          (i) => g(t.requestData, t.headers, i),
	          h.it.Cn,
	          o,
	        ),
	          (k = !0);
	    this.Gh.Fh() && i && !k
	      ? this.kc()
	      : p &&
	        (b$1.info("Invoking new session subscriptions"),
	        this.uc.A(),
	        (this.fc = !0));
	  }
	  yc() {
	    return this.nc > 0;
	  }
	  kc(t = 1e3 * this.fS) {
	    this.mc ||
	      (this.wc(),
	      (this.cc = window.setTimeout(() => {
	        if (document.hidden) {
	          const t = "visibilitychange",
	            i = () => {
	              document.hidden ||
	                (document.removeEventListener(t, i, !1), this.bc());
	            };
	          document.addEventListener(t, i, !1);
	        } else this.bc();
	      }, t)),
	      (this.lc = t));
	  }
	  wc() {
	    null != this.cc && (clearTimeout(this.cc), (this.cc = null));
	  }
	  initialize() {
	    (this.mc = !1), this.kc();
	  }
	  destroy() {
	    this.uc.removeAllSubscriptions(),
	      this.Gh.xh(),
	      this.wc(),
	      (this.mc = !0),
	      this.bc(void 0, !1, void 0, void 0, void 0, void 0, !0),
	      (this.cc = null),
	      (this.fc = !1);
	  }
	  rn(t) {
	    const i = this.uc.Ut(t);
	    return this.fc && t(), i;
	  }
	  openSession() {
	    const t = this.C.$t() !== this.C.el();
	    t && (this.j.hS(STORAGE_KEYS.Ou.Wh), this.j.hS(STORAGE_KEYS.Ou.Cu)),
	      this.bc(!1, void 0, () => {
	        t && (this.j.Vt(STORAGE_KEYS.It.Zr), this.j.Vt(STORAGE_KEYS.It.At));
	      }),
	      this.Ea(),
	      t &&
	        Promise.resolve().then(function () { return pushManagerFactory; }).then((t) => {
	          if (this.mc) return;
	          const i = t.default.ra();
	          if (
	            null != i &&
	            (Dt$1.isPushPermissionGranted() || Dt$1.isPushBlocked())
	          ) {
	            const t = () => {
	                i.lu()
	                  ? b$1.info(
	                      "Push token maintenance is disabled, not refreshing token for backend.",
	                    )
	                  : i.subscribe();
	              },
	              e = (i, s) => {
	                s && t();
	              },
	              h = () => {
	                const i = this.j.St(STORAGE_KEYS.It.xu);
	                (null == i || i) && t();
	              },
	              o = et._s.Xs;
	            new et(o, b$1).kr(o.Ws.Gu, e, h);
	          }
	        });
	  }
	  jc() {
	    this.j.Vt(STORAGE_KEYS.It.Vr), this.j.Vt(STORAGE_KEYS.It.bi), this.j.Vt(STORAGE_KEYS.It.la);
	  }
	  Sc() {
	    this.j.Vt(STORAGE_KEYS.It.wl),
	      this.j.Vt(STORAGE_KEYS.It.lS),
	      this.j.Vt(STORAGE_KEYS.It.zl),
	      this.j.Vt(STORAGE_KEYS.It.Xl);
	  }
	  changeUser(t, i, e) {
	    const h = this.Ss.getUserId();
	    if (h !== t) {
	      this.C.Sm(),
	        this.jc(),
	        removeAllVisibleInAppMessages(),
	        null != h && this.bc(void 0, !1, void 0, void 0, void 0),
	        this.Ss.Lu(t),
	        e ? this.Gh.setSdkAuthenticationSignature(e) : this.Gh.jh();
	      for (let t = 0; t < i.length; t++) i[t].changeUser(null == h);
	      this.B.fo(),
	        null != h && this.j.Vt(STORAGE_KEYS.It.rS),
	        this.j.Vt(STORAGE_KEYS.It.Aa),
	        this.j.Vt(STORAGE_KEYS.It.uS),
	        this.Sc(),
	        this.openSession(),
	        b$1.info('Changed user to "' + t + '".');
	    } else {
	      let i = "Doing nothing.";
	      e &&
	        this.Gh.kh() !== e &&
	        (this.Gh.setSdkAuthenticationSignature(e),
	        (i = "Updated SDK authentication signature")),
	        b$1.info(`Current user is already ${t}. ${i}`);
	    }
	  }
	  requestImmediateDataFlush(t) {
	    this.wc(), this.C.el();
	    this.bc(
	      void 0,
	      void 0,
	      void 0,
	      () => {
	        b$1.error("Failed to flush data, request will be retried automatically.");
	      },
	      t,
	      !0,
	    );
	  }
	  Ar(t, i, s = "sdk") {
	    this.C.el(),
	      b$1.info("Requesting explicit trigger refresh."),
	      this.bc(!0, void 0, t, i, void 0, void 0, void 0, s);
	  }
	  Hu(t, i) {
	    const e = p.Ac,
	      h = { a: t, l: i },
	      o = v$1.Dt(e, h);
	    return (
	      o && (b$1.info(`Logged alias ${t} with label ${i}`), this.j.Pt(STORAGE_KEYS.It.uS, h)),
	      o
	    );
	  }
	  Yu(t, i, s) {
	    if (this.h.zu(i))
	      return (
	        b$1.info(`Custom Attribute "${i}" is blocklisted, ignoring.`), new L()
	      );
	    const e = { key: i, value: s },
	      h = v$1.Dt(t, e);
	    if (h) {
	      const t = "object" == typeof s ? JSON.stringify(s, null, 2) : s;
	      b$1.info(`Logged custom attribute: ${i} with value: ${t}`);
	    }
	    return h;
	  }
	  setLastKnownLocation(t, i, s, e, h, o) {
	    const n = { latitude: i, longitude: s };
	    null != e && (n.altitude = e),
	      null != h && (n.ll_accuracy = h),
	      null != o && (n.alt_accuracy = o);
	    const r = v$1.Dt(p.Dc, n, t || void 0);
	    return (
	      r &&
	        b$1.info(`Set user last known location as ${JSON.stringify(n, null, 2)}`),
	      r
	    );
	  }
	  Fr(t, i) {
	    const s = this.C.el();
	    return new ve(this.Ss.getUserId(), p.$c, t, s, { cid: i });
	  }
	  qc(t, i) {
	    return new et(t, i);
	  }
	  Ea() {
	    const t = et._s.Xs;
	    this.qc(t, b$1).setItem(t.Ws.Cn, 1, {
	      baseUrl: this.baseUrl,
	      data: { api_key: this.eu, device_id: this.tu.ve().id },
	      userId: this.Ss.getUserId(),
	      sdkAuthEnabled: this.Gh.Fh(),
	    });
	  }
	  Dr(t) {
	    for (const i of t)
	      if (i.api_key === this.eu) this.B.Ua(i.events, i.attributes);
	      else {
	        const t = et._s.Xs;
	        new et(t, b$1).setItem(t.Ws.Br, V$1.de(), i);
	      }
	  }
	  ya(t, i, s) {
	    if (this.h.zu(t))
	      return (
	        b$1.info(`Custom Attribute "${t}" is blocklisted, ignoring.`), new L()
	      );
	    let e, h;
	    return (
	      null === i && null === s
	        ? ((e = p.Cc), (h = { key: t }))
	        : ((e = p.Mc), (h = { key: t, latitude: i, longitude: s })),
	      v$1.Dt(e, h)
	    );
	  }
	  va(t, i) {
	    const s = { group_id: t, status: i };
	    return v$1.Dt(p.Tc, s);
	  }
	}

	class vi {
	  constructor(
	    t = 0,
	    i = [],
	    s = [],
	    h = [],
	    l = null,
	    e = null,
	    r = { enabled: !1 },
	    n = { enabled: !1, refresh_rate_limit: void 0 },
	    a = { enabled: !0, capacity: GLOBAL_RATE_LIMIT_CAPACITY_DEFAULT, refill_rate: GLOBAL_RATE_LIMIT_REFILL_RATE_DEFAULT, endpoint_overrides: {} },
	    o = null,
	    u = null,
	    c = null,
	    d = null,
	    m = null,
	  ) {
	    (this.ed = t),
	      (this.vd = i),
	      (this.md = s),
	      (this.gd = h),
	      (this.fd = l),
	      (this.ld = e),
	      (this.ud = r),
	      (this.Rr = n),
	      (this.nd = a),
	      (this.banners = o),
	      (this.dust = u),
	      (this.Cd = c),
	      (this.wd = d),
	      (this.ad = m);
	  }
	  qt() {
	    return {
	      s: "6.12.0",
	      l: this.ed,
	      e: this.vd,
	      a: this.md,
	      p: this.gd,
	      m: this.fd,
	      v: this.ld,
	      c: this.ud,
	      f: this.Rr,
	      grl: this.nd,
	      b: this.banners,
	      d: this.dust,
	      rb: this.Cd,
	      mst: this.wd,
	      ch: this.ad,
	    };
	  }
	  static _u(t) {
	    let i = t.l;
	    return (
	      "6.12.0" !== t.s && (i = 0),
	      new vi(
	        i,
	        t.e,
	        t.a,
	        t.p,
	        t.m,
	        t.v,
	        t.c,
	        t.f,
	        t.grl,
	        t.b,
	        t.d,
	        t.rb,
	        t.mst,
	        t.ch,
	      )
	    );
	  }
	}

	class li {
	  constructor(t) {
	    (this.j = t),
	      (this.j = t),
	      (this.Gl = new f()),
	      (this._l = new f()),
	      (this.Ol = new f()),
	      (this.Vl = new f()),
	      (this.Hl = new f()),
	      (this.Jl = new f()),
	      (this.Ql = null),
	      (this.Wl = null);
	  }
	  Yl() {
	    if (null == this.Wl) {
	      const t = this.j.St(STORAGE_KEYS.It.Zl);
	      this.Wl = null != t ? vi._u(t) : new vi();
	    }
	    return this.Wl;
	  }
	  Qt() {
	    return this.Yl().ed;
	  }
	  sd(t) {
	    var i, e, n, l, r, o;
	    if (null != t && null != t.config) {
	      const u = t.config;
	      if (u.time > this.Yl().ed) {
	        const t = (t) => (null == t ? this.Yl().nd : t),
	          a = new vi(
	            u.time,
	            u.events_blacklist,
	            u.attributes_blacklist,
	            u.purchases_blacklist,
	            u.messaging_session_timeout,
	            u.vapid_public_key,
	            u.content_cards,
	            u.feature_flags,
	            t(u.global_request_rate_limit),
	            u.banners,
	            u.dust,
	            u.request_backoff,
	            u.minimum_session_timeout,
	            u.conversational_chat,
	          );
	        let h = !1;
	        null != a.ld && this.Wu() !== a.ld && (h = !0);
	        let d = !1;
	        null != a.ud.enabled && this.Pi() !== a.ud.enabled && (d = !0);
	        let c = !1;
	        null != a.Rr.enabled && this.Kr() !== a.Rr.enabled && (c = !0);
	        let v = !1;
	        null !=
	          (null === (i = a.banners) || void 0 === i ? void 0 : i.enabled) &&
	          this.Ot() !==
	            (null === (e = a.banners) || void 0 === e ? void 0 : e.enabled) &&
	          (v = !0);
	        let m = !1;
	        null != (null === (n = a.dust) || void 0 === n ? void 0 : n.enabled) &&
	          this.$n() !==
	            (null === (l = a.dust) || void 0 === l ? void 0 : l.enabled) &&
	          (m = !0);
	        let g = !1;
	        null != (null === (r = a.ad) || void 0 === r ? void 0 : r.enabled) &&
	          this.hd() !==
	            (null === (o = a.ad) || void 0 === o ? void 0 : o.enabled) &&
	          (g = !0),
	          (this.Wl = a),
	          this.j.Pt(STORAGE_KEYS.It.Zl, a.qt()),
	          h && this.Gl.A(),
	          d && this._l.A(),
	          c && this.Ol.A(),
	          v && this.Vl.A(),
	          m && this.Hl.A(),
	          g && this.Jl.A();
	      }
	    }
	  }
	  ju(t) {
	    const i = this.Gl.Ut(t);
	    return this.Ql && this.Gl.removeSubscription(this.Ql), (this.Ql = i), i;
	  }
	  $i(t) {
	    return this._l.Ut(t);
	  }
	  do(t) {
	    return this.Ol.Ut(t);
	  }
	  V(t) {
	    return this.Vl.Ut(t);
	  }
	  Tr(t) {
	    return this.Hl.Ut(t);
	  }
	  dd(t) {
	    return this.Jl.Ut(t);
	  }
	  $e(t) {
	    return -1 !== this.Yl().vd.indexOf(t);
	  }
	  zu(t) {
	    return -1 !== this.Yl().md.indexOf(t);
	  }
	  $r(t) {
	    return -1 !== this.Yl().gd.indexOf(t);
	  }
	  bd() {
	    return this.Yl().fd;
	  }
	  Wu() {
	    return this.Yl().ld;
	  }
	  Pi() {
	    return this.Yl().ud.enabled || !1;
	  }
	  pd() {
	    const t = this.Yl().nd;
	    return !(!t || null == t.enabled) && t.enabled;
	  }
	  Kl() {
	    if (!this.pd()) return -1;
	    const t = this.Yl().nd;
	    return null == t.capacity || t.capacity < 10 ? -1 : t.capacity;
	  }
	  Pl() {
	    if (!this.pd()) return -1;
	    const t = this.Yl().nd;
	    return null == t.refill_rate || t.refill_rate <= 0 ? -1 : t.refill_rate;
	  }
	  Rd(t) {
	    const i = this.Yl().nd.endpoint_overrides;
	    return null == i ? null : i[t];
	  }
	  Ul(t) {
	    const i = this.Rd(t);
	    return null == i || isNaN(i.capacity) || i.capacity <= 0 ? -1 : i.capacity;
	  }
	  xl(t) {
	    const i = this.Rd(t);
	    return null == i || isNaN(i.refill_rate) || i.refill_rate <= 0
	      ? -1
	      : i.refill_rate;
	  }
	  Kr() {
	    return this.Yl().Rr.enabled && null == this.Fo()
	      ? (v$1.Dt(p._a, { e: "Missing feature flag refresh_rate_limit." }), !1)
	      : this.Yl().Rr.enabled || !1;
	  }
	  Fo() {
	    return this.Yl().Rr.refresh_rate_limit;
	  }
	  Ot() {
	    var t;
	    return (
	      (null === (t = this.Yl().banners) || void 0 === t ? void 0 : t.enabled) ||
	      null
	    );
	  }
	  re() {
	    var t;
	    return (
	      (null === (t = this.Yl().banners) || void 0 === t
	        ? void 0
	        : t.max_placements) || 0
	    );
	  }
	  Gt() {
	    var t;
	    const i =
	      null === (t = this.Yl().banners) || void 0 === t
	        ? void 0
	        : t.dismissals_cache_size;
	    return null != i && "number" == typeof i && i > 0 ? i : DISMISSALS_CACHE_SIZE_DEFAULT;
	  }
	  $n() {
	    var t;
	    return (
	      (null === (t = this.Yl().dust) || void 0 === t ? void 0 : t.enabled) || !1
	    );
	  }
	  hd() {
	    var t;
	    return (
	      (null === (t = this.Yl().ad) || void 0 === t ? void 0 : t.enabled) || !1
	    );
	  }
	  vt() {
	    var t;
	    const i =
	      null === (t = this.Yl().Cd) || void 0 === t
	        ? void 0
	        : t.min_sleep_duration_ms;
	    return null != i ? i : REQUEST_BACKOFF_MIN_SLEEP_MS_DEFAULT;
	  }
	  gt() {
	    var t;
	    const i =
	      null === (t = this.Yl().Cd) || void 0 === t ? void 0 : t.scale_factor;
	    return null != i ? i : REQUEST_BACKOFF_SCALE_FACTOR_DEFAULT;
	  }
	  bt() {
	    var t;
	    const i =
	      null === (t = this.Yl().Cd) || void 0 === t
	        ? void 0
	        : t.max_sleep_duration_ms;
	    return null != i ? i : REQUEST_BACKOFF_MAX_SLEEP_MS_DEFAULT;
	  }
	  Ed() {
	    return this.Yl().wd;
	  }
	}

	const DEFAULT_MINIMUM_SESSION_TIMEOUT_IN_MS = 1e4;

	class fi {
	  constructor(s, t, i, e) {
	    (this.j = s),
	      (this.Ss = t),
	      (this.h = i),
	      (this.tm = e),
	      (this.j = s),
	      (this.Ss = t),
	      (this.h = i);
	    const n = this.h.Ed();
	    (this.im = n ? 1e3 * n : DEFAULT_MINIMUM_SESSION_TIMEOUT_IN_MS),
	      (null == e || isNaN(e)) && (e = 1800),
	      e < this.im / 1e3 &&
	        b$1.info(
	          "Specified session timeout of " +
	            e +
	            "s is too small, using the minimum session timeout of " +
	            this.im / 1e3 +
	            "s instead.",
	        ),
	      (this.tm = Math.max(e, this.im / 1e3));
	  }
	  nm(s, t) {
	    return new ve(this.Ss.getUserId(), p.hm, s, t.Iu, { d: convertMsToSeconds(s - t.lm) });
	  }
	  al() {
	    return this.j.$u(STORAGE_KEYS.Ou.um);
	  }
	  $t() {
	    const t = this.j.$u(STORAGE_KEYS.Ou.um);
	    return null == t ? null : t.Iu;
	  }
	  am() {
	    const t = new Date().valueOf(),
	      i = this.h.bd();
	    if (null == i) return !1;
	    const e = this.j.St(STORAGE_KEYS.It.dm),
	      n = null == e || t - e > 1e3 * i;
	    return n && this.j.Pt(STORAGE_KEYS.It.dm, t), n;
	  }
	  ul(s, t) {
	    return null == t || null == t.fm || (!(s - t.lm < this.im) && t.fm < s);
	  }
	  el() {
	    const t = new Date().valueOf(),
	      i = t + 1e3 * this.tm,
	      e = this.j.$u(STORAGE_KEYS.Ou.um);
	    if (this.ul(t, e)) {
	      let n = "Generating session start event with time " + t;
	      if (null != e) {
	        let s = e.pm;
	        s - e.lm < this.im && (s = e.lm + this.im),
	          this.j.gm(this.nm(s, e)),
	          (n += " (old session ended " + s + ")");
	      }
	      (n += ". Will expire " + i.valueOf()), b$1.info(n);
	      const r = new _t(V$1.de(), i);
	      this.j.gm(new ve(this.Ss.getUserId(), p.wm, t, r.Iu)),
	        this.j.Ju(STORAGE_KEYS.Ou.um, r);
	      return null == this.j.St(STORAGE_KEYS.It.dm) && this.j.Pt(STORAGE_KEYS.It.dm, t), r.Iu;
	    }
	    if (null != e) return (e.pm = t), (e.fm = i), this.j.Ju(STORAGE_KEYS.Ou.um, e), e.Iu;
	  }
	  Sm() {
	    const t = this.j.$u(STORAGE_KEYS.Ou.um);
	    null != t &&
	      (this.j.jm(STORAGE_KEYS.Ou.um), this.j.gm(this.nm(new Date().valueOf(), t)));
	  }
	}

	const di = {
	  rl: function (o, t = !1, e) {
	    const r = di.oc(),
	      a = di.sl(),
	      n = new ne.tc(o, r && !t, a, e);
	    let c;
	    return (c = a ? new ne.ec(o) : new ne.rc()), new ne(n, c);
	  },
	  oc: function () {
	    return (
	      navigator.cookieEnabled ||
	      ("cookie" in document &&
	        (document.cookie.length > 0 ||
	          (document.cookie = "test").indexOf.call(document.cookie, "test") >
	            -1))
	    );
	  },
	  sl: function () {
	    let o = !1;
	    try {
	      if (localStorage && localStorage.getItem)
	        try {
	          localStorage.setItem(STORAGE_KEYS.It.ac, "true"),
	            localStorage.getItem(STORAGE_KEYS.It.ac)
	              ? (localStorage.removeItem(STORAGE_KEYS.It.ac), (o = !0))
	              : (o = !1);
	        } catch (t) {
	          if (
	            !(
	              t instanceof Error &&
	              ("QuotaExceededError" === t.name ||
	                "NS_ERROR_DOM_QUOTA_REACHED" === t.name) &&
	              localStorage.length > 0
	            )
	          )
	            throw t;
	          o = !0;
	        }
	    } catch (o) {
	      b$1.info("Local Storage not supported!");
	    }
	    return o;
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
	      (this.hs = !1);
	  }
	  static fromJson(s) {
	    return new ControlMessage(s.trigger_id, s.message_extras);
	  }
	  js() {
	    return !this.hs && ((this.hs = !0), !0);
	  }
	  sm() {
	    return this.hs;
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
	const DOMUtils = { Ic: null, td: _isInView };
	const DIRECTIONS = { Jo: "up", Ko: "down", ie: "left", ne: "right" };
	function supportsPassive() {
	  if (null == DOMUtils.Ic) {
	    DOMUtils.Ic = !1;
	    try {
	      const t = Object.defineProperty({}, "passive", {
	        get: () => {
	          DOMUtils.Ic = !0;
	        },
	      });
	      window.addEventListener("testPassive", () => {}, t),
	        window.removeEventListener("testPassive", () => {}, t);
	    } catch (t) {
	      b$1.error(getErrorMessage(t));
	    }
	  }
	  return DOMUtils.Ic;
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
	        ? (((l > 0 && n === DIRECTIONS.ie) || (l < 0 && n === DIRECTIONS.ne)) &&
	            e(o),
	          (s = null),
	          (i = null))
	        : Math.abs(u) >= 25 &&
	          (((u > 0 &&
	            n === DIRECTIONS.Jo &&
	            t.scrollTop === t.scrollHeight - t.offsetHeight) ||
	            (u < 0 && n === DIRECTIONS.Ko && 0 === t.scrollTop)) &&
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

	const KeyCodes = { To: 32, No: 9, Lo: 13, oh: 27 };

	const isIFrame = (e) => null !== e && "IFRAME" === e.tagName;

	class InAppMessage {
	  constructor(
	    t,
	    s,
	    i,
	    h,
	    e,
	    n,
	    r,
	    o,
	    l,
	    u,
	    a,
	    m,
	    c,
	    d,
	    p,
	    b,
	    g,
	    v,
	    I,
	    j,
	    k,
	    w,
	    y,
	    S,
	    T,
	    x,
	    E,
	    H,
	    M,
	    C,
	    D,
	    z,
	  ) {
	    (this.message = t),
	      (this.messageAlignment = s),
	      (this.slideFrom = i),
	      (this.extras = h),
	      (this.triggerId = e),
	      (this.clickAction = n),
	      (this.uri = r),
	      (this.openTarget = o),
	      (this.dismissType = l),
	      (this.duration = u),
	      (this.icon = a),
	      (this.imageUrl = m),
	      (this.imageStyle = c),
	      (this.iconColor = d),
	      (this.iconBackgroundColor = p),
	      (this.backgroundColor = b),
	      (this.textColor = g),
	      (this.closeButtonColor = v),
	      (this.animateIn = I),
	      (this.animateOut = j),
	      (this.header = k),
	      (this.headerAlignment = w),
	      (this.headerTextColor = y),
	      (this.frameColor = S),
	      (this.buttons = T),
	      (this.cropType = x),
	      (this.orientation = E),
	      (this.htmlId = H),
	      (this.css = M),
	      (this.messageExtras = C),
	      (this.language = D),
	      (this.altImageText = z),
	      (this.message = t),
	      (this.messageAlignment = s || IamTextAlignment.CENTER),
	      (this.duration = u || 5e3),
	      (this.slideFrom = i || IamSlideFrom.BOTTOM),
	      (this.extras = h || {}),
	      (this.triggerId = e),
	      (this.clickAction = n || IamClickAction.NONE),
	      (this.uri = r),
	      (this.openTarget = o || IamOpenTarget.NONE),
	      (this.dismissType = l || IamDismissType.AUTO_DISMISS),
	      (this.icon = a),
	      (this.imageUrl = m),
	      (this.imageStyle = c || IamImageStyle.TOP),
	      (this.iconColor = d || IamColors.AE),
	      (this.iconBackgroundColor = p || IamColors._E),
	      (this.backgroundColor = b || IamColors.AE),
	      (this.textColor = g || IamColors.IE),
	      (this.closeButtonColor = v || IamColors.NE),
	      (this.animateIn = I),
	      null == this.animateIn && (this.animateIn = !0),
	      (this.animateOut = j),
	      null == this.animateOut && (this.animateOut = !0),
	      (this.header = k),
	      (this.headerAlignment = w || IamTextAlignment.CENTER),
	      (this.headerTextColor = y || IamColors.IE),
	      (this.frameColor = S || IamColors.LE),
	      (this.buttons = T || []),
	      (this.cropType = x || IamCropType.FIT_CENTER),
	      (this.orientation = E),
	      (this.htmlId = H),
	      (this.css = M),
	      (this.isControl = !1),
	      (this.messageExtras = C),
	      (this.language = D),
	      (this.altImageText = z),
	      (this.th = !1),
	      (this.hs = !1),
	      (this.rd = !1),
	      (this.sh = !1),
	      (this.ih = !1),
	      (this.Bo = null),
	      (this.$o = null),
	      (this.ti = new f()),
	      (this.hh = new f()),
	      (this.qo = IamTextAlignment.CENTER);
	  }
	  subscribeToClickedEvent(t) {
	    return this.ti.Ut(t);
	  }
	  subscribeToDismissedEvent(t) {
	    return this.hh.Ut(t);
	  }
	  removeSubscription(t) {
	    this.ti.removeSubscription(t), this.hh.removeSubscription(t);
	  }
	  removeAllSubscriptions() {
	    this.ti.removeAllSubscriptions(), this.hh.removeAllSubscriptions();
	  }
	  closeMessage() {
	    this.tl(this.Bo);
	  }
	  zo() {
	    return !0;
	  }
	  od() {
	    return this.zo();
	  }
	  ko() {
	    return null != this.htmlId && this.htmlId.length > 4;
	  }
	  Mo() {
	    return this.ko() && null != this.css && this.css.length > 0;
	  }
	  Co() {
	    if (this.ko() && this.Mo()) return this.htmlId + "-css";
	  }
	  js() {
	    return !this.hs && ((this.hs = !0), !0);
	  }
	  sm() {
	    return this.hs;
	  }
	  Yt(t) {
	    return !this.rd && ((this.rd = !0), this.ti.A(), !0);
	  }
	  Ft() {
	    return !this.sh && ((this.sh = !0), this.hh.A(), !0);
	  }
	  hide(t) {
	    if (t && t.parentNode) {
	      let s = t.closest(".ab-iam-root");
	      if ((null == s && (s = t), this.zo() && null != s.parentNode)) {
	        const t = s.parentNode.classList;
	        t && t.contains(IamStrings.TE) && t.remove(IamStrings.TE),
	          document.body.removeEventListener("touchmove", InAppMessage.eh);
	      }
	      s.className = s.className.replace(IAM_SHOW_CLASS, IAM_HIDE_CLASS);
	    }
	    return this.animateOut || !1;
	  }
	  tl(t, s) {
	    if (null == t) return;
	    if (this.ih) return;
	    let i;
	    (this.ih = !0),
	      (this.Bo = null),
	      (i =
	        -1 === t.className.indexOf("ab-in-app-message")
	          ? t.getElementsByClassName("ab-in-app-message")[0]
	          : t);
	    let h = !1;
	    i && (h = this.hide(i));
	    const e = document.body;
	    let n;
	    null != e && (n = e.scrollTop);
	    const r = () => {
	      if (t && t.parentNode) {
	        let s = t.closest(".ab-iam-root");
	        null == s && (s = t), s.parentNode && s.parentNode.removeChild(s);
	      }
	      const i = this.Co();
	      if (null != i) {
	        const t = document.getElementById(i);
	        t && t.parentNode && t.parentNode.removeChild(t);
	      }
	      null != e && "Safari" === ro.browser && (e.scrollTop = n),
	        s ? s() : this.Ft();
	    };
	    h ? setTimeout(r, IamTiming.gr) : r(), this.$o && this.$o.focus();
	  }
	  Eo() {
	    return document.createTextNode(this.message || "");
	  }
	  Ao(t) {
	    t.setAttribute("alt", this.altImageText || "");
	  }
	  static eh(t) {
	    if (t.targetTouches && t.targetTouches.length > 1) return;
	    const s = t.target;
	    (s &&
	      s.classList &&
	      s.classList.contains("ab-message-text") &&
	      s.scrollHeight > s.clientHeight) ||
	      (document.querySelector(`.${IamStrings.TE}`) &&
	        t.cancelable &&
	        t.preventDefault());
	  }
	  nh(t) {
	    this.ih = !1;
	    const s = t.parentNode;
	    this.zo() &&
	      null != s &&
	      this.orientation !== IamOrientation.LANDSCAPE &&
	      (null != s.classList && s.classList.add(IamStrings.TE),
	      document.body.addEventListener(
	        "touchmove",
	        InAppMessage.eh,
	        !!supportsPassive() && { passive: !1 },
	      )),
	      (t.className += " " + IAM_SHOW_CLASS);
	  }
	  static rh(t) {
	    if (
	      t.keyCode === KeyCodes.oh &&
	      !r.er(U.lh) &&
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
	  uh() {
	    this.th ||
	      r.er(U.lh) ||
	      (document.addEventListener("keydown", InAppMessage.rh, !1),
	      r.ah(() => {
	        document.removeEventListener("keydown", InAppMessage.rh);
	      }),
	      (this.th = !0));
	  }
	  qt(t) {
	    const s = {};
	    return t
	      ? ((s[IamSerializationKeys.UE] = this.message),
	        (s[IamSerializationKeys.cE] = this.messageAlignment),
	        (s[IamSerializationKeys.nE] = this.slideFrom),
	        (s[IamSerializationKeys.Is] = this.extras),
	        (s[IamSerializationKeys.PE] = this.triggerId),
	        (s[IamSerializationKeys.iE] = this.clickAction),
	        (s[IamSerializationKeys.URI] = this.uri),
	        (s[IamSerializationKeys.pE] = this.openTarget),
	        (s[IamSerializationKeys.rE] = this.dismissType),
	        (s[IamSerializationKeys.mE] = this.duration),
	        (s[IamSerializationKeys.GE] = this.icon),
	        (s[IamSerializationKeys.Bs] = this.imageUrl),
	        (s[IamSerializationKeys.xE] = this.imageStyle),
	        (s[IamSerializationKeys.HE] = this.iconColor),
	        (s[IamSerializationKeys.FE] = this.iconBackgroundColor),
	        (s[IamSerializationKeys.BE] = this.backgroundColor),
	        (s[IamSerializationKeys.bE] = this.textColor),
	        (s[IamSerializationKeys.gE] = this.closeButtonColor),
	        (s[IamSerializationKeys.lE] = this.animateIn),
	        (s[IamSerializationKeys.YE] = this.animateOut),
	        (s[IamSerializationKeys.hE] = this.header),
	        (s[IamSerializationKeys.KE] = this.headerAlignment),
	        (s[IamSerializationKeys.WE] = this.headerTextColor),
	        (s[IamSerializationKeys.XE] = this.frameColor),
	        (s[IamSerializationKeys.yE] = this.buttons),
	        (s[IamSerializationKeys.dE] = this.cropType),
	        (s[IamSerializationKeys.uE] = this.orientation),
	        (s[IamSerializationKeys.fE] = this.htmlId),
	        (s[IamSerializationKeys.CSS] = this.css),
	        (s[IamSerializationKeys.xs] = t),
	        (s[IamSerializationKeys.jE] = this.messageExtras),
	        (s[IamSerializationKeys.LANGUAGE] = this.language),
	        (s[IamSerializationKeys.Ns] = this.altImageText),
	        s)
	      : s;
	  }
	}
	(InAppMessage.mh = IamColors),
	  (InAppMessage.SlideFrom = IamSlideFrom),
	  (InAppMessage.ClickAction = IamClickAction),
	  (InAppMessage.DismissType = IamDismissType),
	  (InAppMessage.OpenTarget = IamOpenTarget),
	  (InAppMessage.ImageStyle = IamImageStyle),
	  (InAppMessage.Orientation = IamOrientation),
	  (InAppMessage.TextAlignment = IamTextAlignment),
	  (InAppMessage.CropType = IamCropType),
	  (InAppMessage.dh = IamServerTypes),
	  (InAppMessage.gr = IamTiming.gr),
	  (InAppMessage.sE = IamTiming.sE),
	  (InAppMessage.bs = IamSerializationKeys);

	class HtmlMessage extends InAppMessage {
	  constructor(i, o, r, t, d, s, e, v, n, u, a, c) {
	    super(
	      i,
	      void 0,
	      void 0,
	      o,
	      r,
	      void 0,
	      void 0,
	      void 0,
	      (t = t || IamDismissType.MANUAL),
	      d,
	      void 0,
	      void 0,
	      void 0,
	      void 0,
	      void 0,
	      void 0,
	      void 0,
	      void 0,
	      s,
	      e,
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
	  Yt(i) {
	    if (this.Oo === IamServerTypes.ME) {
	      if (this.rd) return !1;
	      this.rd = !0;
	    }
	    return this.ti.A(i), !0;
	  }
	  qt() {
	    const i = super.qt(IamServerTypes.ME);
	    return (i[IamSerializationKeys.wE] = this.messageFields), i;
	  }
	  static ua(i) {
	    return new HtmlMessage(
	      i[IamSerializationKeys.UE],
	      i[IamSerializationKeys.Is],
	      i[IamSerializationKeys.PE],
	      i[IamSerializationKeys.rE],
	      i[IamSerializationKeys.mE],
	      i[IamSerializationKeys.lE],
	      i[IamSerializationKeys.YE],
	      i[IamSerializationKeys.XE],
	      i[IamSerializationKeys.fE],
	      i[IamSerializationKeys.CSS],
	      i[IamSerializationKeys.wE],
	      i[IamSerializationKeys.jE],
	    );
	  }
	}

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
	      (this.backgroundColor = t || IamColors._E),
	      (this.textColor = i || IamColors.AE),
	      (this.borderColor = r || this.backgroundColor),
	      (this.clickAction = h || IamClickAction.NONE),
	      (this.uri = e),
	      null == n && (n = InAppMessageButton.Qn),
	      (this.id = n),
	      (this.rd = !1),
	      (this.ti = new f());
	  }
	  subscribeToClickedEvent(s) {
	    return this.ti.Ut(s);
	  }
	  removeSubscription(s) {
	    this.ti.removeSubscription(s);
	  }
	  removeAllSubscriptions() {
	    this.ti.removeAllSubscriptions();
	  }
	  Yt() {
	    return !this.rd && ((this.rd = !0), this.ti.A(), !0);
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
	InAppMessageButton.Qn = -1;

	class FullScreenMessage extends InAppMessage {
	  constructor(
	    r,
	    s,
	    e,
	    t,
	    o,
	    i,
	    a,
	    p,
	    m,
	    n,
	    c,
	    f,
	    u,
	    d,
	    l,
	    j,
	    g,
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
	    (p = p || IamDismissType.MANUAL),
	      (k = k || IamOrientation.PORTRAIT),
	      super(
	        r,
	        s,
	        void 0,
	        e,
	        t,
	        o,
	        i,
	        a,
	        p,
	        m,
	        n,
	        c,
	        f,
	        u,
	        d,
	        l,
	        j,
	        g,
	        x,
	        z,
	        h,
	        v,
	        w,
	        y,
	        S,
	        (b = b || IamCropType.CENTER_CROP),
	        k,
	        q,
	        A,
	        B,
	        C,
	        D,
	      ),
	      (this.qo = IamTextAlignment.CENTER);
	  }
	  qt() {
	    return super.qt(IamServerTypes.oE);
	  }
	  static ua(r) {
	    return new FullScreenMessage(
	      r[IamSerializationKeys.UE],
	      r[IamSerializationKeys.cE],
	      r[IamSerializationKeys.Is],
	      r[IamSerializationKeys.PE],
	      r[IamSerializationKeys.iE],
	      r[IamSerializationKeys.URI],
	      r[IamSerializationKeys.pE],
	      r[IamSerializationKeys.rE],
	      r[IamSerializationKeys.mE],
	      r[IamSerializationKeys.GE],
	      r[IamSerializationKeys.Bs],
	      r[IamSerializationKeys.xE],
	      r[IamSerializationKeys.HE],
	      r[IamSerializationKeys.FE],
	      r[IamSerializationKeys.BE],
	      r[IamSerializationKeys.bE],
	      r[IamSerializationKeys.gE],
	      r[IamSerializationKeys.lE],
	      r[IamSerializationKeys.YE],
	      r[IamSerializationKeys.hE],
	      r[IamSerializationKeys.KE],
	      r[IamSerializationKeys.WE],
	      r[IamSerializationKeys.XE],
	      buttonsFromSerializedInAppMessage(r[IamSerializationKeys.yE]),
	      r[IamSerializationKeys.dE],
	      r[IamSerializationKeys.uE],
	      r[IamSerializationKeys.fE],
	      r[IamSerializationKeys.CSS],
	      r[IamSerializationKeys.jE],
	      r[IamSerializationKeys.LANGUAGE],
	      r[IamSerializationKeys.Ns],
	    );
	  }
	}

	class ModalMessage extends InAppMessage {
	  constructor(
	    r,
	    s,
	    e,
	    t,
	    o,
	    i,
	    a,
	    p,
	    m,
	    n,
	    c,
	    f,
	    u,
	    d,
	    l,
	    j,
	    g,
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
	      r,
	      s,
	      void 0,
	      e,
	      t,
	      o,
	      i,
	      a,
	      (p = p || IamDismissType.MANUAL),
	      m,
	      n,
	      c,
	      f,
	      u,
	      d,
	      l,
	      j,
	      g,
	      v,
	      x,
	      z,
	      h,
	      w,
	      y,
	      S,
	      (b = b || IamCropType.FIT_CENTER),
	      void 0,
	      k,
	      q,
	      A,
	      B,
	      C,
	    ),
	      (this.qo = IamTextAlignment.CENTER);
	  }
	  qt() {
	    return super.qt(IamServerTypes.tE);
	  }
	  static ua(r) {
	    return new ModalMessage(
	      r[IamSerializationKeys.UE],
	      r[IamSerializationKeys.cE],
	      r[IamSerializationKeys.Is],
	      r[IamSerializationKeys.PE],
	      r[IamSerializationKeys.iE],
	      r[IamSerializationKeys.URI],
	      r[IamSerializationKeys.pE],
	      r[IamSerializationKeys.rE],
	      r[IamSerializationKeys.mE],
	      r[IamSerializationKeys.GE],
	      r[IamSerializationKeys.Bs],
	      r[IamSerializationKeys.xE],
	      r[IamSerializationKeys.HE],
	      r[IamSerializationKeys.FE],
	      r[IamSerializationKeys.BE],
	      r[IamSerializationKeys.bE],
	      r[IamSerializationKeys.gE],
	      r[IamSerializationKeys.lE],
	      r[IamSerializationKeys.YE],
	      r[IamSerializationKeys.hE],
	      r[IamSerializationKeys.KE],
	      r[IamSerializationKeys.WE],
	      r[IamSerializationKeys.XE],
	      buttonsFromSerializedInAppMessage(r[IamSerializationKeys.yE]),
	      r[IamSerializationKeys.dE],
	      r[IamSerializationKeys.fE],
	      r[IamSerializationKeys.CSS],
	      r[IamSerializationKeys.jE],
	      r[IamSerializationKeys.LANGUAGE],
	      r[IamSerializationKeys.Ns],
	    );
	  }
	}

	class SlideUpMessage extends InAppMessage {
	  constructor(
	    t,
	    s,
	    e,
	    o,
	    i,
	    r,
	    n,
	    d,
	    a,
	    p,
	    u,
	    m,
	    c,
	    l,
	    v,
	    f,
	    x,
	    h,
	    g,
	    j,
	    I,
	    M,
	    b,
	    z,
	  ) {
	    (f = f || IamColors.OE),
	      (v = v || IamColors.SE),
	      super(
	        t,
	        (s = s || IamTextAlignment.START),
	        e,
	        o,
	        i,
	        r,
	        n,
	        d,
	        a,
	        p,
	        u,
	        m,
	        void 0,
	        c,
	        l,
	        v,
	        f,
	        x,
	        h,
	        g,
	        void 0,
	        void 0,
	        void 0,
	        void 0,
	        void 0,
	        void 0,
	        void 0,
	        j,
	        I,
	        M,
	        b,
	        z,
	      ),
	      (this.qo = IamTextAlignment.START);
	  }
	  zo() {
	    return !1;
	  }
	  Eo() {
	    const t = document.createElement("span");
	    return t.appendChild(document.createTextNode(this.message || "")), t;
	  }
	  nh(t) {
	    const s = t.getElementsByClassName("ab-in-app-message")[0];
	    DOMUtils.td(s, !0, !0) ||
	      (this.slideFrom === IamSlideFrom.TOP
	        ? (s.style.top = "0px")
	        : (s.style.bottom = "0px")),
	      super.nh(t);
	  }
	  qt() {
	    return super.qt(IamServerTypes.RE);
	  }
	  static ua(t) {
	    return new SlideUpMessage(
	      t[IamSerializationKeys.UE],
	      t[IamSerializationKeys.cE],
	      t[IamSerializationKeys.nE],
	      t[IamSerializationKeys.Is],
	      t[IamSerializationKeys.PE],
	      t[IamSerializationKeys.iE],
	      t[IamSerializationKeys.URI],
	      t[IamSerializationKeys.pE],
	      t[IamSerializationKeys.rE],
	      t[IamSerializationKeys.mE],
	      t[IamSerializationKeys.GE],
	      t[IamSerializationKeys.Bs],
	      t[IamSerializationKeys.HE],
	      t[IamSerializationKeys.FE],
	      t[IamSerializationKeys.BE],
	      t[IamSerializationKeys.bE],
	      t[IamSerializationKeys.gE],
	      t[IamSerializationKeys.lE],
	      t[IamSerializationKeys.YE],
	      t[IamSerializationKeys.fE],
	      t[IamSerializationKeys.CSS],
	      t[IamSerializationKeys.jE],
	      t[IamSerializationKeys.LANGUAGE],
	      t[IamSerializationKeys.Ns],
	    );
	  }
	}

	function newInAppMessageFromJson(e) {
	  if (!e) return null;
	  if (e.is_control) return ControlMessage.fromJson(e);
	  let o = e.type;
	  null != o && (o = o.toUpperCase());
	  const s = e.message,
	    n = e.text_align_message,
	    t = e.slide_from,
	    r = e.extras,
	    m = e.trigger_id,
	    l = e.click_action,
	    i = e.uri,
	    f = e.open_target,
	    p = e.message_close,
	    u = e.duration,
	    a = e.icon,
	    d = e.image_url,
	    c = e.image_style,
	    g = e.icon_color,
	    j = e.icon_bg_color,
	    w = e.bg_color,
	    h = e.text_color,
	    v = e.close_btn_color,
	    x = e.header,
	    I = e.text_align_header,
	    A = e.header_text_color,
	    F = e.frame_color,
	    M = [];
	  let k = e.btns;
	  null == k && (k = []);
	  for (let e = 0; e < k.length; e++) M.push(InAppMessageButton.fromJson(k[e]));
	  const y = e.crop_type,
	    z = e.orientation,
	    J = e.animate_in,
	    S = e.animate_out;
	  let q = e.html_id,
	    B = e.css;
	  (null != q && "" !== q && null != B && "" !== B) ||
	    ((q = void 0), (B = void 0));
	  const C = e.message_extras,
	    D = e.language,
	    E = e.image_alt;
	  let G;
	  if (o === IamServerTypes.tE || o === IamServerTypes.eE)
	    G = new ModalMessage(
	      s,
	      n,
	      r,
	      m,
	      l,
	      i,
	      f,
	      p,
	      u,
	      a,
	      d,
	      c,
	      g,
	      j,
	      w,
	      h,
	      v,
	      J,
	      S,
	      x,
	      I,
	      A,
	      F,
	      M,
	      y,
	      q,
	      B,
	      C,
	      D,
	      E,
	    );
	  else if (o === IamServerTypes.oE)
	    G = new FullScreenMessage(
	      s,
	      n,
	      r,
	      m,
	      l,
	      i,
	      f,
	      p,
	      u,
	      a,
	      d,
	      c,
	      g,
	      j,
	      w,
	      h,
	      v,
	      J,
	      S,
	      x,
	      I,
	      A,
	      F,
	      M,
	      y,
	      z,
	      q,
	      B,
	      C,
	      D,
	      E,
	    );
	  else if (o === IamServerTypes.RE)
	    G = new SlideUpMessage(
	      s,
	      n,
	      t,
	      r,
	      m,
	      l,
	      i,
	      f,
	      p,
	      u,
	      a,
	      d,
	      g,
	      j,
	      w,
	      h,
	      v,
	      J,
	      S,
	      q,
	      B,
	      C,
	      D,
	      E,
	    );
	  else {
	    if (o !== IamServerTypes.ME && o !== IamServerTypes.CE && o !== IamServerTypes.DE)
	      return void b$1.error("Ignoring message with unknown type " + o);
	    {
	      const o = e.message_fields;
	      (G = new HtmlMessage(s, r, m, p, u, J, S, F, q, B, o, C)),
	        (G.trusted = e.trusted || !1);
	    }
	  }
	  return (G.Oo = o), G;
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

	class es {
	  constructor(t) {
	    (this.xc = t), (this.xc = t);
	  }
	  zc(t) {
	    return null == this.xc || this.xc === t[0];
	  }
	  static fromJson(t) {
	    return new es(t ? t.event_name : null);
	  }
	  qt() {
	    return this.xc;
	  }
	}

	class hr {
	  constructor(t, s, e, i) {
	    (this.zE = t),
	      (this.kE = s),
	      (this.comparator = e),
	      (this.vE = i),
	      (this.zE = t),
	      (this.kE = s),
	      (this.comparator = e),
	      (this.vE = i),
	      this.kE === hr.VE.JE &&
	        this.comparator !== hr.ZE.qE &&
	        this.comparator !== hr.ZE.$E &&
	        this.comparator !== hr.ZE.tT &&
	        this.comparator !== hr.ZE.sT &&
	        (this.vE = dateFromUnixTimestamp(this.vE));
	  }
	  zc(t) {
	    let s = null;
	    switch ((null != t && (s = t[this.zE]), this.comparator)) {
	      case hr.ZE.eT:
	        return null != s && s.valueOf() === this.vE.valueOf();
	      case hr.ZE.iT:
	        return null == s || s.valueOf() !== this.vE.valueOf();
	      case hr.ZE.lT:
	        return null != s && typeof s == typeof this.vE && s > this.vE;
	      case hr.ZE.qE:
	        return this.kE === hr.VE.JE
	          ? null != s && isDate(s) && secondsAgo(s) <= this.vE.valueOf()
	          : null != s && typeof s == typeof this.vE && s >= this.vE;
	      case hr.ZE.rT:
	        return null != s && typeof s == typeof this.vE && s < this.vE;
	      case hr.ZE.$E:
	        return this.kE === hr.VE.JE
	          ? null != s && isDate(s) && secondsAgo(s) >= this.vE.valueOf()
	          : null != s && typeof s == typeof this.vE && s <= this.vE;
	      case hr.ZE.hT:
	        return (
	          null != s &&
	          "string" == typeof s &&
	          typeof s == typeof this.vE &&
	          null != s.match(this.vE)
	        );
	      case hr.ZE.nT:
	        return null != s;
	      case hr.ZE.uT:
	        return null == s;
	      case hr.ZE.tT:
	        return null != s && isDate(s) && secondsInTheFuture(s) < this.vE;
	      case hr.ZE.sT:
	        return null != s && isDate(s) && secondsInTheFuture(s) > this.vE;
	      case hr.ZE.oT:
	        return (
	          null == s ||
	          typeof s != typeof this.vE ||
	          "string" != typeof s ||
	          null == s.match(this.vE)
	        );
	    }
	    return !1;
	  }
	  static fromJson(t) {
	    return new hr(
	      t.property_key,
	      t.property_type,
	      t.comparator,
	      t.property_value,
	    );
	  }
	  qt() {
	    let t = this.vE;
	    return (
	      isDate(this.vE) && (t = convertMsToSeconds(t.valueOf())),
	      { k: this.zE, t: this.kE, c: this.comparator, v: t }
	    );
	  }
	  static _u(t) {
	    return new hr(t.k, t.t, t.c, t.v);
	  }
	}
	(hr.VE = { ET: "boolean", aT: "number", TT: "string", JE: "date" }),
	  (hr.ZE = {
	    eT: 1,
	    iT: 2,
	    lT: 3,
	    qE: 4,
	    rT: 5,
	    $E: 6,
	    hT: 10,
	    nT: 11,
	    uT: 12,
	    tT: 15,
	    sT: 16,
	    oT: 17,
	  });

	class ls {
	  constructor(t) {
	    (this.filters = t), (this.filters = t);
	  }
	  zc(t) {
	    let r = !0;
	    for (let e = 0; e < this.filters.length; e++) {
	      const o = this.filters[e];
	      let s = !1;
	      for (let r = 0; r < o.length; r++)
	        if (o[r].zc(t)) {
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
	      for (let t = 0; t < s.length; t++) o.push(hr.fromJson(s[t]));
	      r.push(o);
	    }
	    return new ls(r);
	  }
	  qt() {
	    const t = [];
	    for (let r = 0; r < this.filters.length; r++) {
	      const e = this.filters[r],
	        o = [];
	      for (let t = 0; t < e.length; t++) o.push(e[t].qt());
	      t.push(o);
	    }
	    return t;
	  }
	  static _u(t) {
	    const r = [];
	    for (let e = 0; e < t.length; e++) {
	      const o = [],
	        s = t[e];
	      for (let t = 0; t < s.length; t++) o.push(hr._u(s[t]));
	      r.push(o);
	    }
	    return new ls(r);
	  }
	}

	class ns {
	  constructor(t, s) {
	    (this.xc = t), (this.tf = s), (this.xc = t), (this.tf = s);
	  }
	  zc(t) {
	    if (null == this.xc || null == this.tf) return !1;
	    const s = t[0],
	      i = t[1];
	    return s === this.xc && this.tf.zc(i);
	  }
	  static fromJson(t) {
	    return new ns(
	      t ? t.event_name : null,
	      t ? ls.fromJson(t.property_filters) : null,
	    );
	  }
	  qt() {
	    return { e: this.xc, pf: this.tf ? this.tf.qt() : null };
	  }
	}

	class ki {
	  constructor(t, i) {
	    (this.if = t), (this.rf = i), (this.if = t), (this.rf = i);
	  }
	  zc(t) {
	    if (null == this.if) return !1;
	    const i = ji.sf(t[0], this.if);
	    if (!i) return !1;
	    let r = null == this.rf || 0 === this.rf.length;
	    if (null != this.rf)
	      for (let i = 0; i < this.rf.length; i++)
	        if (this.rf[i] === t[1]) {
	          r = !0;
	          break;
	        }
	    return i && r;
	  }
	  static fromJson(t) {
	    return new ki(t ? t.id : null, t ? t.buttons : null);
	  }
	  qt() {
	    return this.if;
	  }
	}

	class os {
	  constructor(t) {
	    (this.productId = t), (this.productId = t);
	  }
	  zc(t) {
	    return null == this.productId || t[0] === this.productId;
	  }
	  static fromJson(t) {
	    return new os(t ? t.product_id : null);
	  }
	  qt() {
	    return this.productId;
	  }
	}

	class fs {
	  constructor(t, s) {
	    (this.productId = t), (this.tf = s), (this.productId = t), (this.tf = s);
	  }
	  zc(t) {
	    if (null == this.productId || null == this.tf) return !1;
	    const s = t[0],
	      i = t[1];
	    return s === this.productId && this.tf.zc(i);
	  }
	  static fromJson(t) {
	    return new fs(
	      t ? t.product_id : null,
	      t ? ls.fromJson(t.property_filters) : null,
	    );
	  }
	  qt() {
	    return { id: this.productId, pf: this.tf ? this.tf.qt() : null };
	  }
	}

	class wr {
	  constructor(t) {
	    (this.if = t), (this.if = t);
	  }
	  zc(t) {
	    return null == this.if || ji.sf(t[0], this.if);
	  }
	  static fromJson(t) {
	    return new wr(t ? t.campaign_id : null);
	  }
	  qt() {
	    return this.if;
	  }
	}

	var ot = {
	  OPEN: "open",
	  qr: "purchase",
	  Sr: "push_click",
	  he: "custom_event",
	  rm: "iam_click",
	  Os: "test",
	};

	class ji {
	  constructor(e, t) {
	    (this.type = e), (this.data = t), (this.type = e), (this.data = t);
	  }
	  _c(e, t) {
	    return ji.Ec[this.type] === e && (null == this.data || this.data.zc(t));
	  }
	  static sf(e, t) {
	    let r = null;
	    try {
	      r = window.atob(e);
	    } catch (t) {
	      return b$1.info("Failed to unencode analytics id " + e + ": " + getErrorMessage(t)), !1;
	    }
	    return t === r.split("_")[0];
	  }
	  static fromJson(e) {
	    const t = e.type;
	    let r = null;
	    switch (t) {
	      case ji.Yo.OPEN:
	      case ji.Yo.Os:
	        break;
	      case ji.Yo.qr:
	        r = os.fromJson(e.data);
	        break;
	      case ji.Yo.Pc:
	        r = fs.fromJson(e.data);
	        break;
	      case ji.Yo.Sr:
	        r = wr.fromJson(e.data);
	        break;
	      case ji.Yo.he:
	        r = es.fromJson(e.data);
	        break;
	      case ji.Yo.Rc:
	        r = ns.fromJson(e.data);
	        break;
	      case ji.Yo.rm:
	        r = ki.fromJson(e.data);
	    }
	    return new ji(t, r);
	  }
	  qt() {
	    return { t: this.type, d: this.data ? this.data.qt() : null };
	  }
	  static _u(e) {
	    let t,
	      r = null;
	    switch (e.t) {
	      case ji.Yo.OPEN:
	      case ji.Yo.Os:
	        break;
	      case ji.Yo.qr:
	        r = new os(e.d);
	        break;
	      case ji.Yo.Pc:
	        (t = e.d || {}), (r = new fs(t.id, ls._u(t.pf || [])));
	        break;
	      case ji.Yo.Sr:
	        r = new wr(e.d);
	        break;
	      case ji.Yo.he:
	        r = new es(e.d);
	        break;
	      case ji.Yo.Rc:
	        (t = e.d || {}), (r = new ns(t.e, ls._u(t.pf || [])));
	        break;
	      case ji.Yo.rm:
	        r = new ki(e.d);
	    }
	    return new ji(e.t, r);
	  }
	}
	(ji.Yo = {
	  OPEN: "open",
	  qr: "purchase",
	  Pc: "purchase_property",
	  Sr: "push_click",
	  he: "custom_event",
	  Rc: "custom_event_property",
	  rm: "iam_click",
	  Os: "test",
	}),
	  (ji.Ec = {}),
	  (ji.Ec[ji.Yo.OPEN] = ot.OPEN),
	  (ji.Ec[ji.Yo.qr] = ot.qr),
	  (ji.Ec[ji.Yo.Pc] = ot.qr),
	  (ji.Ec[ji.Yo.Sr] = ot.Sr),
	  (ji.Ec[ji.Yo.he] = ot.he),
	  (ji.Ec[ji.Yo.Rc] = ot.he),
	  (ji.Ec[ji.Yo.rm] = ot.rm),
	  (ji.Ec[ji.Yo.Os] = ot.Os);

	class vt {
	  constructor(t, i = [], s, e, r = 0, h, l, o = 0, n = vt.Td, a, u, d) {
	    (this.id = t),
	      (this.Dd = i),
	      (this.startTime = s),
	      (this.endTime = e),
	      (this.priority = r),
	      (this.type = h),
	      (this.data = l),
	      (this.Pd = o),
	      (this.yd = n),
	      (this.ia = a),
	      (this.jd = u),
	      (this.Nd = d),
	      (this.id = t),
	      (this.Dd = i || []),
	      void 0 === s && (s = null),
	      (this.startTime = s),
	      void 0 === e && (e = null),
	      (this.endTime = e),
	      (this.priority = r || 0),
	      (this.type = h),
	      (this.Pd = o || 0),
	      null == a && (a = 1e3 * (this.Pd + 30)),
	      (this.ia = a),
	      (this.data = l),
	      null != n && (this.yd = n),
	      (this.jd = u),
	      (this.Nd = d || null);
	  }
	  _d(t) {
	    return (
	      null == this.Nd || (this.yd !== vt.Td && t - this.Nd >= 1e3 * this.yd)
	    );
	  }
	  Ad(t) {
	    this.Nd = t;
	  }
	  Id(t) {
	    const i = t + 1e3 * this.Pd;
	    return Math.max(i - new Date().valueOf(), 0);
	  }
	  $d(t) {
	    const i = new Date().valueOf() - t,
	      s = null == t || isNaN(i) || null == this.ia || i < this.ia;
	    return (
	      s ||
	        b$1.info(
	          `Trigger action ${this.type} is no longer eligible for display - fired ${i}ms ago and has a timeout of ${this.ia}ms.`,
	        ),
	      !s
	    );
	  }
	  static fromJson(t) {
	    const i = t.id,
	      s = [];
	    for (let i = 0; i < t.trigger_condition.length; i++)
	      s.push(ji.fromJson(t.trigger_condition[i]));
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
	      vt.Yo,
	      l,
	      "Could not construct Trigger from server data",
	      "Trigger.Types",
	    )
	      ? new vt(i, s, e, r, h, l, u, o, n, a, d)
	      : null;
	  }
	  qt() {
	    const t = [];
	    for (let i = 0; i < this.Dd.length; i++) t.push(this.Dd[i].qt());
	    return {
	      i: this.id,
	      c: t,
	      s: this.startTime,
	      e: this.endTime,
	      p: this.priority,
	      t: this.type,
	      da: this.data,
	      d: this.Pd,
	      r: this.yd,
	      tm: this.ia,
	      ss: this.jd,
	      ld: this.Nd,
	    };
	  }
	  static _u(t) {
	    const i = [],
	      s = t.c || [];
	    for (let t = 0; t < s.length; t++) i.push(ji._u(s[t]));
	    return new vt(
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
	(vt.Yo = { Wo: "inapp", xd: "templated_iam" }), (vt.Td = -1);

	function attachCSS(n, t, o) {
	  const c = n || document.querySelector("head"),
	    e = `ab-${t}-css-definitions-${"6.12.0".replace(/\./g, "-")}`;
	  if (!c) return;
	  const s = c.ownerDocument || document;
	  if (null == s.getElementById(e)) {
	    const n = s.createElement("style");
	    (n.innerHTML = o || ""), (n.id = e);
	    const t = r.er(U.sr);
	    null != t && n.setAttribute("nonce", t), c.appendChild(n);
	  }
	}

	function loadFontAwesome() {
	  if (r.er(U.Uh)) return;
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

	function me(e) {
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
	      (t.keyCode !== KeyCodes.To && t.keyCode !== KeyCodes.Lo) ||
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
	    return b$1.error(IamStrings.EE), !1;
	  const o = s instanceof ControlMessage ? p.om : p.On;
	  return se$1.ra().Dt(s, o).lt;
	}

	function logInAppMessageClick(s) {
	  if (!r.rr()) return !1;
	  if (!(s instanceof InAppMessage)) return b$1.error(IamStrings.EE), !1;
	  const e = se$1.ra().Dt(s, p.Hn);
	  if (e) {
	    s.sm() || logInAppMessageImpression(s);
	    for (let r = 0; r < e.Ce.length; r++)
	      TriggersProviderFactory.o().Ee(ot.rm, [s.triggerId], e.Ce[r]);
	  }
	  return e.lt;
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
	  pa: _isPhone,
	  fa: _getOrientation,
	  Qh: _getCurrentUrl,
	};

	function getUser() {
	  if (r.rr()) return r.zr();
	}

	function _handleBrazeAction(o, e, s) {
	  if (r.rr())
	    if (BRAZE_ACTION_URI_REGEX.test(o)) {
	      const e = getDecodedBrazeAction(o);
	      if (!e) return;
	      const s = (o) => {
	        if (!isValidBrazeActionJson(o))
	          return void b$1.error(
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
	                    : b$1.error(CoreStrings.ee);
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
	                    : b$1.error(CoreStrings.ee);
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
	              b$1.info(`Ignoring unknown Braze Action: ${n}`);
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
	      b$1.error(
	        "inAppMessage argument to logInAppMessageHtmlClick must be an HtmlMessage object.",
	      ),
	      !1
	    );
	  let o = p.Hn;
	  null != t && (o = p.Jn);
	  const m = se$1.ra().Dt(e, o, t, s);
	  if (m.lt)
	    for (let r = 0; r < m.Ce.length; r++)
	      TriggersProviderFactory.o().Ee(ot.rm, [e.triggerId, t], m.Ce[r]);
	  return m.lt;
	}

	const buildHtmlClickHandler = (t, l, i, o) => {
	  const r = i.getAttribute("href"),
	    n = i.onclick;
	  return (s) => {
	    if (null != n && "function" == typeof n && !1 === n.bind(i)(s)) return;
	    let e = parseQueryStringKeyValues(r).abButtonId;
	    if (
	      ((null != e && "" !== e) || (e = i.getAttribute("id") || void 0),
	      null != r && "" !== r && 0 !== r.indexOf("#"))
	    ) {
	      const n =
	          "blank" ===
	          (i.getAttribute("target") || "").toLowerCase().replace("_", ""),
	        u = o || t.openTarget === IamOpenTarget.BLANK || n,
	        m = () => {
	          logInAppMessageHtmlClick(t, e, r), WindowUtils.openUri(r, u, s);
	        };
	      u ? m() : t.tl(l, m);
	    } else logInAppMessageHtmlClick(t, e, r || void 0);
	    return s.stopPropagation(), !1;
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
	            : b$1.error(CoreStrings.ee);
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
	              : b$1.error(CoreStrings.ee);
	          },
	        );
	      },
	      logCustomEvent: function () {
	        const t = arguments;
	        Promise.resolve().then(function () { return logCustomEvent$1; }).then(
	          ({ logCustomEvent: logCustomEvent }) => {
	            if (!r.ao()) return void b$1.error(CoreStrings.ee);
	            logCustomEvent(...Array.prototype.slice.call(t));
	          },
	        );
	      },
	      logPurchase: function () {
	        const t = arguments;
	        Promise.resolve().then(function () { return logPurchase$1; }).then(
	          ({ logPurchase: logPurchase }) => {
	            if (!r.ao()) return void b$1.error(CoreStrings.ee);
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
	              : b$1.error(CoreStrings.ee);
	          },
	        );
	      },
	      requestPushPermission: requestPushPermission(),
	      changeUser: function () {
	        const t = arguments;
	        Promise.resolve().then(function () { return changeUser$1; }).then(({ changeUser: changeUser }) => {
	          if (!r.ao()) return void b$1.error(CoreStrings.ee);
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

	function jt(t, o, s, e, n) {
	  const i = document.createElement("iframe");
	  i.setAttribute("title", "Modal Message"),
	    e && (i.style.zIndex = (e + 1).toString());
	  if (
	    (attachHtmlToIframeWithNonce(i, t.message, n),
	    (i.onload = () => {
	      const e = i.contentWindow;
	      e.focus();
	      const a = e.document.getElementsByTagName("head")[0];
	      if (null != a) {
	        if (t.Mo()) {
	          const o = document.createElement("style");
	          (o.innerHTML = t.css || ""),
	            (o.id = t.Co() || ""),
	            null != n && o.setAttribute("nonce", n),
	            a.appendChild(o);
	        }
	        const o = e.document.createElement("base");
	        null != o && (o.setAttribute("target", "_parent"), a.appendChild(o));
	      }
	      const l = e.document.getElementsByTagName("title");
	      l && l.length > 0 && i.setAttribute("title", l[0].textContent || "");
	      const r = Object.assign(
	        Object.assign(
	          {},
	          buildBrazeBridge(i, (o, s) => t.tl(o, s)),
	        ),
	        {
	          closeMessage: function () {
	            t.tl(i);
	          },
	          logClick: function () {
	            logInAppMessageHtmlClick(t, ...arguments);
	          },
	        },
	      );
	      if (((e.appboyBridge = r), (e.brazeBridge = r), t.Oo !== IamServerTypes.CE)) {
	        const o = e.document.getElementsByTagName("a");
	        for (let e = 0; e < o.length; e++) o[e].onclick = buildHtmlClickHandler(t, i, o[e], s);
	        const n = e.document.getElementsByTagName("button");
	        for (let o = 0; o < n.length; o++) n[o].onclick = buildHtmlClickHandler(t, i, n[o], s);
	      }
	      const c = e.document.body;
	      if (null != c) {
	        t.ko() && (c.id = t.htmlId || "");
	        const o = document.createElement("hidden");
	        (o.onclick = r.closeMessage),
	          (o.className = "ab-programmatic-close-button"),
	          c.appendChild(o);
	      }
	      e.dispatchEvent(new CustomEvent("ab.BridgeReady")),
	        -1 !== i.className.indexOf("ab-start-hidden") &&
	          ((i.className = i.className.replace("ab-start-hidden", "")), o(i));
	    }),
	    (i.className =
	      "ab-in-app-message ab-start-hidden ab-html-message ab-modal-interactions"),
	    ro.OS === OperatingSystems.co)
	  ) {
	    const o = document.createElement("div");
	    return (
	      (o.className = "ab-ios-scroll-wrapper"), o.appendChild(i), (t.Bo = o), o
	    );
	  }
	  return (t.Bo = i), i;
	}

	function logInAppMessageButtonClick(t, o) {
	  var e;
	  if (!r.rr()) return !1;
	  if (!(t instanceof InAppMessageButton))
	    return b$1.error("button must be an InAppMessageButton object"), !1;
	  if (!(o instanceof InAppMessage)) return b$1.error(IamStrings.EE), !1;
	  const s = se$1.ra().Ln(t, o);
	  if (s.lt)
	    for (let r = 0; r < s.Ce.length; r++)
	      TriggersProviderFactory.o().Ee(
	        ot.rm,
	        [
	          o.triggerId,
	          null === (e = t.id) || void 0 === e ? void 0 : e.toString(),
	        ],
	        s.Ce[r],
	      );
	  return s.lt;
	}

	const ie = {
	  Ho: (t) => {
	    const o = t.querySelectorAll(".ab-close-button, .ab-message-button");
	    let e;
	    for (let t = 0; t < o.length; t++) (e = o[t]), (e.tabIndex = 0);
	    if (o.length > 0) {
	      const e = o[0],
	        s = o[o.length - 1];
	      t.addEventListener("keydown", (o) => {
	        const a = document.activeElement;
	        o.keyCode === KeyCodes.No &&
	          (o.shiftKey || (a !== s && a !== t)
	            ? !o.shiftKey ||
	              (a !== e && a !== t) ||
	              (o.preventDefault(), s.focus())
	            : (o.preventDefault(), e.focus()));
	      });
	    }
	  },
	  Io: (t, o) => {
	    o.setAttribute("role", "dialog"),
	      o.setAttribute("aria-modal", "true"),
	      t
	        ? o.setAttribute("aria-labelledby", t)
	        : o.setAttribute("aria-label", "Modal Message");
	  },
	  Go: (t, o, e) => {
	    if (t.buttons && t.buttons.length > 0) {
	      const s = document.createElement("div");
	      (s.className = "ab-message-buttons"), o.appendChild(s);
	      const a = o.getElementsByClassName("ab-message-text")[0];
	      null != a && (a.className += " ab-with-buttons");
	      const l = (s) => (a) => (
	        t.tl(o, () => {
	          logInAppMessageButtonClick(s, t),
	            s.clickAction === IamClickAction.URI &&
	              _handleBrazeAction(s.uri || "", e || t.openTarget === IamOpenTarget.BLANK, a);
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

	function ge(e, o, t, a, n, i, s = document.body, m = "ltr") {
	  if (((e.$o = document.activeElement), e instanceof HtmlMessage))
	    return jt(e, o, a, n, i);
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
	              )
	            : o(l));
	      },
	      r = (o = !0) => {
	        let a = document.querySelectorAll(".ab-iam-root");
	        if (
	          ((a && 0 !== a.length) || (a = i.querySelectorAll(".ab-iam-root")),
	          a && a.length > 0)
	        )
	          if (
	            (a[0].classList.remove("ab-iam-img-loading"),
	            m && (clearTimeout(m), (m = null)),
	            o)
	          )
	            c();
	          else {
	            const o = `Cannot show in-app message ${e.message} because the image failed to load.`;
	            t(o);
	          }
	      };
	    if (
	      (e.imageStyle === IamImageStyle.GRAPHIC && (l.className += " graphic"),
	      e.orientation === IamOrientation.LANDSCAPE && (l.className += " landscape"),
	      null != e.buttons && 0 === e.buttons.length)
	    ) {
	      e.clickAction !== IamClickAction.NONE && (l.className += " ab-clickable");
	      const o = (o) => (
	        e.tl(l, () => {
	          logInAppMessageClick(e),
	            e.clickAction === IamClickAction.URI &&
	              _handleBrazeAction(e.uri || "", a || e.openTarget === IamOpenTarget.BLANK, o);
	        }),
	        o.stopPropagation(),
	        !1
	      );
	      (l.onclick = o),
	        l.addEventListener("keydown", (e) => {
	          if (e.keyCode === KeyCodes.Lo || e.keyCode === KeyCodes.To) return o(e);
	        });
	    }
	    const d = createCloseButton(
	      "Close Message",
	      e.Mo() ? void 0 : toRgba(e.closeButtonColor),
	      () => {
	        e.tl(l);
	      },
	      s,
	    );
	    l.appendChild(d), n && (d.style.zIndex = (n + 2).toString());
	    const u = document.createElement("div");
	    (u.className = "ab-message-text"),
	      (u.dir = s),
	      u.setAttribute("role", "article");
	    const b = (e.messageAlignment || e.qo).toLowerCase();
	    u.className += " " + b + "-aligned";
	    let f = !1;
	    const p = document.createElement("div");
	    if (((p.className = "ab-image-area"), e.imageUrl)) {
	      const o = document.createElement("img");
	      if (
	        (o.setAttribute("src", e.imageUrl),
	        e.Ao(o),
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
	      if (e.cropType === IamCropType.CENTER_CROP) {
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
	      (o.className = "ab-message-header"), (e.Do = V$1.de()), (o.id = e.Do);
	      const t = (e.headerAlignment || IamTextAlignment.CENTER).toLowerCase();
	      (o.className += " " + t + "-aligned"),
	        e.Mo() || (o.style.color = toRgba(e.headerTextColor)),
	        o.appendChild(document.createTextNode(e.header)),
	        u.appendChild(o);
	    }
	    const g = e.Eo();
	    return u.appendChild(g), l.appendChild(u), f || c(), (e.Bo = l), l;
	  })(e, o, t, a, n, s, m);
	  if (e instanceof FullScreenMessage || e instanceof ModalMessage) {
	    const o = e instanceof FullScreenMessage ? "ab-fullscreen" : "ab-modal";
	    (l.className += ` ${o} ab-centered`),
	      ie.Go(e, l, a),
	      ie.Ho(l),
	      ie.Io(e.Do, l);
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
	    detectSwipe(l, DIRECTIONS.ie, (e) => {
	      (l.className += " ab-swiped-left"),
	        null != o && null != o.onclick && o.onclick(e);
	    }),
	      detectSwipe(l, DIRECTIONS.ne, (e) => {
	        (l.className += " ab-swiped-right"),
	          null != o && null != o.onclick && o.onclick(e);
	      }),
	      e.slideFrom === IamSlideFrom.TOP
	        ? ((t = DIRECTIONS.Jo), (a = " ab-swiped-up"))
	        : ((t = DIRECTIONS.Ko), (a = " ab-swiped-down")),
	      detectSwipe(l, t, (e) => {
	        (l.className += a), null != o && null != o.onclick && o.onclick(e);
	      });
	  }
	  return l;
	}

	var Pt = {
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

	class jr {
	  constructor(t, e = !1) {
	    if (
	      ((this.language = t),
	      null != t && (t = t.toLowerCase()),
	      null != t && null == Pt[t])
	    ) {
	      const e = t.indexOf("-");
	      e > 0 && (t = t.substring(0, e));
	    }
	    if (null == Pt[t]) {
	      const a =
	        "Braze does not yet have a localization for language " +
	        t +
	        ", defaulting to English. Please contact us if you are willing and able to help us translate our SDK into this language.";
	      e ? b$1.error(a) : b$1.info(a), (t = "en");
	    }
	    this.language = t;
	  }
	  get(t) {
	    return Pt[this.language][t];
	  }
	  ga() {
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

	const he = {
	  i: !1,
	  na: null,
	  ra: () => {
	    if ((he.t(), !he.na)) {
	      let e = ro.language,
	        t = !1;
	      r.er(U.Ma) && ((e = r.er(U.Ma)), (t = !0)), (he.na = new jr(e, t));
	    }
	    return he.na;
	  },
	  t: () => {
	    he.i || (r.g(he), (he.i = !0));
	  },
	  destroy: () => {
	    (he.na = null), (he.i = !1);
	  },
	};

	function showInAppMessage(e, t, s) {
	  if (!r.rr()) return;
	  if ((setupInAppMessageUI(), null == e)) return !1;
	  if (e instanceof ControlMessage)
	    return (
	      b$1.info(
	        "User received control for a multivariate test, logging to Braze servers.",
	      ),
	      logInAppMessageImpression(e),
	      !0
	    );
	  if (!(e instanceof InAppMessage)) return !1;
	  if (e.constructor === InAppMessage) return !1;
	  e.uh();
	  const o = e instanceof HtmlMessage;
	  if (o && !e.trusted && !r.dr())
	    return (
	      b$1.error(
	        'HTML in-app messages are disabled. Use the "allowUserSuppliedJavascript" option for braze.initialize to enable these messages.',
	      ),
	      !1
	    );
	  if ((null == t && (t = document.body), e.zo())) {
	    if (t.querySelectorAll(`.ab-modal-interactions, .${IAM_SHOWING_CLASS}`).length > 0)
	      return (
	        b$1.info(
	          `Cannot show in-app message ${e.message} because another message is being shown.`,
	        ),
	        !1
	      );
	  }
	  if (WindowUtils.pa()) {
	    const t = WindowUtils.fa();
	    if (
	      (t === ORIENTATION.PORTRAIT && e.orientation === IamOrientation.LANDSCAPE) ||
	      (t === ORIENTATION.LANDSCAPE && e.orientation === IamOrientation.PORTRAIT)
	    ) {
	      const s = t === ORIENTATION.PORTRAIT ? "portrait" : "landscape",
	        o = e.orientation === IamOrientation.PORTRAIT ? "portrait" : "landscape";
	      return (
	        b$1.info(
	          `Not showing ${o} in-app message ${e.message} because the screen is currently ${s}`,
	        ),
	        !1
	      );
	    }
	  }
	  if (!r.dr()) {
	    let t = !1;
	    if (e.buttons && e.buttons.length > 0) {
	      const s = e.buttons;
	      for (let e = 0; e < s.length; e++)
	        if (s[e].clickAction === IamClickAction.URI) {
	          const o = s[e].uri;
	          t = isURIJavascriptOrData(o);
	        }
	    } else e.clickAction === IamClickAction.URI && (t = isURIJavascriptOrData(e.uri));
	    if (t)
	      return (
	        b$1.error(
	          'Javascript click actions are disabled. Use the "allowUserSuppliedJavascript" option for braze.initialize to enable these actions.',
	        ),
	        !1
	      );
	  }
	  const i = document.createElement("div");
	  if (
	    ((i.className = "ab-iam-root v3"),
	    e.zo() && (i.className += ` ${IAM_SHOWING_CLASS}`),
	    (i.className += me(e)),
	    e.language && !o && (i.lang = e.language),
	    e.ko() && (i.id = e.htmlId),
	    r.er(U.ca) && (i.style.zIndex = (r.er(U.ca) + 1).toString()),
	    t.appendChild(i),
	    e.Mo())
	  ) {
	    const t = document.createElement("style");
	    (t.innerHTML = e.css),
	      (t.id = e.Co()),
	      null != r.er(U.sr) && t.setAttribute("nonce", r.er(U.sr)),
	      document.getElementsByTagName("head")[0].appendChild(t);
	  }
	  const n = e instanceof SlideUpMessage,
	    a = ge(
	      e,
	      (t) => {
	        if (e.zo() && e.od()) {
	          const s = document.createElement("div");
	          if (
	            ((s.className = "ab-page-blocker"),
	            e.Mo() || (s.style.backgroundColor = toRgba(e.frameColor)),
	            r.er(U.ca) && (s.style.zIndex = r.er(U.ca).toString()),
	            i.appendChild(s),
	            !r.er(U.lh))
	          ) {
	            const o = new Date().valueOf();
	            s.onclick = (s) => {
	              new Date().valueOf() - o > IamTiming.sE &&
	                (e.tl(t), s.stopPropagation());
	            };
	          }
	          i.appendChild(t), t.focus(), e.nh(i);
	        } else if (n) {
	          const s = document.querySelectorAll(".ab-slideup");
	          let o = null;
	          for (let e = s.length - 1; e >= 0; e--)
	            if (s[e] !== t) {
	              o = s[e];
	              break;
	            }
	          if (e.slideFrom === IamSlideFrom.TOP) {
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
	        } else if (o && !r.er(U.lh)) {
	          const s = e;
	          isIFrame(t) &&
	            t.contentWindow &&
	            t.contentWindow.addEventListener("keydown", function (e) {
	              e.keyCode === KeyCodes.oh && s.closeMessage();
	            });
	        }
	        logInAppMessageImpression(e),
	          e.dismissType === IamDismissType.AUTO_DISMISS &&
	            setTimeout(() => {
	              i.contains(t) && e.tl(t);
	            }, e.duration),
	          "function" == typeof s && s();
	      },
	      (e) => {
	        b$1.info(e), i.parentNode && i.parentNode.removeChild(i);
	      },
	      r.er(U.da),
	      r.er(U.ca),
	      r.er(U.sr),
	      t,
	      he.ra().ga(),
	    );
	  return (o || n) && (i.appendChild(a), e.nh(i)), !0;
	}

	function subscribeToInAppMessage(n) {
	  if (r.rr())
	    return "function" != typeof n
	      ? null
	      : se$1.ra().En(function (r) {
	          return n(r[0]), r.slice(1);
	        });
	}

	function automaticallyShowInAppMessages() {
	  if (!r.rr()) return;
	  setupInAppMessageUI();
	  const s = se$1.ra();
	  if (null == s.Gn()) {
	    const r = subscribeToInAppMessage((s) => showInAppMessage(s));
	    s.Nn(r);
	  }
	  return s.Gn();
	}

	function deferInAppMessage(e) {
	  if (r.rr())
	    return e instanceof ControlMessage
	      ? (b$1.info("Not deferring since this is a ControlMessage."), !1)
	      : e instanceof InAppMessage
	      ? se$1.ra().An(e)
	      : (b$1.info("Not an instance of InAppMessage, ignoring."), !1);
	}

	function getDeferredInAppMessage() {
	  if (r.rr()) return se$1.ra().sa();
	}

	class ea {
	  constructor(t, e, s, i) {
	    (this.B = t),
	      (this.C = e),
	      (this.j = s),
	      (this.Ss = i),
	      (this.B = t),
	      (this.C = e),
	      (this.j = s),
	      (this.Ss = i),
	      (this.In = new f()),
	      r.S(this.In),
	      (this.Tn = 1e3),
	      (this.Dn = 6e4),
	      (this.zn = null),
	      (this.Bn = null),
	      (this._n = null),
	      (this.qn = {});
	  }
	  Pn() {
	    return this.In;
	  }
	  En(t) {
	    return this.In.Ut(t);
	  }
	  Gn() {
	    return this.zn;
	  }
	  Nn(t) {
	    this.zn = t;
	  }
	  Dt(t, e, s, i) {
	    const r = new L();
	    let n;
	    if (e === p.On || t instanceof ControlMessage) {
	      if (!t.js())
	        return (
	          b$1.info(
	            "This in-app message has already received an impression. Ignoring analytics event.",
	          ),
	          r
	        );
	      if (this.Xn(t.triggerId))
	        return (
	          b$1.info(
	            "An impression for this in-app message trigger has already been logged. Ignoring analytics event.",
	          ),
	          r
	        );
	    } else if (e === p.Hn || (t instanceof HtmlMessage && e === p.Jn)) {
	      if (!t.Yt(i))
	        return (
	          b$1.info(
	            "This in-app message has already received a click. Ignoring analytics event.",
	          ),
	          r
	        );
	    }
	    return (
	      (n =
	        t instanceof ControlMessage
	          ? { trigger_ids: [t.triggerId] }
	          : this.Kn(t)),
	      null == n
	        ? r
	        : (t.messageExtras && (n.message_extras = t.messageExtras),
	          null != s && (n.bid = s),
	          v$1.Dt(e, n))
	    );
	  }
	  Ln(t, e) {
	    const s = new L();
	    if (!t.Yt())
	      return (
	        b$1.info(
	          "This in-app message button has already received a click. Ignoring analytics event.",
	        ),
	        s
	      );
	    const i = this.Kn(e);
	    return null == i
	      ? s
	      : t.id === InAppMessageButton.Qn
	      ? (b$1.info(
	          "This in-app message button does not have a tracking id. Not logging event to Braze servers.",
	        ),
	        s)
	      : (null != t.id && (i.bid = t.id), v$1.Dt(p.Jn, i));
	  }
	  Un(t) {
	    const e = t.messageFields;
	    return (null != e && e.is_push_primer) || !1;
	  }
	  Vn(t) {
	    if (!(t instanceof InAppMessage)) return;
	    const e = (t) => {
	      if (!t) return;
	      const e = getDecodedBrazeAction(t);
	      if (containsUnknownBrazeAction(e)) return ineligibleBrazeActionURLErrorMessage(INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES.Wn, "In-App Message");
	      if (containsPushPrimerBrazeAction(e)) {
	        const t = Dt$1.Yn();
	        if (!t.Zn) return Dt$1.So(t.reason, "In-App Message");
	      }
	    };
	    if (this.Un(t)) {
	      const t = Dt$1.Yn();
	      if (!t.Zn) return Dt$1.So(t.reason, "In-App Message");
	    }
	    const s = t.buttons || [];
	    let i;
	    for (const t of s)
	      if (
	        t.clickAction === IamClickAction.URI &&
	        t.uri &&
	        BRAZE_ACTION_URI_REGEX.test(t.uri) &&
	        ((i = e(t.uri)), i)
	      )
	        return i;
	    return t.clickAction === IamClickAction.URI && t.uri && BRAZE_ACTION_URI_REGEX.test(t.uri)
	      ? e(t.uri)
	      : void 0;
	  }
	  Ro(t, e) {
	    e !== this._n && this._o(), (this.Bn = t), (this._n = e);
	  }
	  _o() {
	    null != this.Bn &&
	      (clearTimeout(this.Bn), (this.Bn = null), (this._n = null));
	  }
	  Po(t, e, s, i) {
	    const r = this.B;
	    if (!r) return;
	    this._n && t.triggerId !== this._n && (this._o(), h.Ji(this.j, h.it.Xo));
	    const n = r.Qo(!1),
	      o = r.Z(n);
	    (o.template = { trigger_id: t.triggerId, trigger_event_type: e }),
	      null != s && (o.template.data = s.Uo());
	    const u = r.tt(o, h.it.Xo);
	    r.et(
	      o,
	      (r = -1) => {
	        const n = this.B;
	        if (!n) return;
	        const m = new Date().valueOf();
	        h.nt(this.j, h.it.Xo, m),
	          -1 !== r && u.push(["X-Braze-Req-Tokens-Remaining", r.toString()]);
	        let p,
	          c,
	          g = !1;
	        l.ot({
	          url: `${n.ht()}/template/`,
	          data: o,
	          headers: u,
	          lt: (e) => {
	            if (!n.ut(o, e, u))
	              return void ("function" == typeof t.Vo && t.Vo());
	            if ((n.ct(), null == e || null == e.templated_message)) return;
	            const s = e.templated_message;
	            if (s.type !== vt.Yo.Wo) return;
	            const i = newInAppMessageFromJson(s.data);
	            if (null == i) return;
	            const r = this.Vn(i);
	            if (r)
	              return b$1.error(r), void ("function" == typeof t.Vo && t.Vo());
	            "function" == typeof t.Zo && t.Zo(i);
	          },
	          error: (e) => {
	            (g = !0),
	              (p = e),
	              (c = `getting user personalization for message ${t.triggerId}.`);
	          },
	          ft: (r, o) => {
	            if (new Date().valueOf() - t.ta < t.ia) {
	              let r = 0;
	              if (g) {
	                const e = Math.min(t.ia, this.Dn),
	                  s = this.Tn;
	                null == i && (i = s), (r = Math.min(e, randomInclusive(s, 3 * i)));
	              }
	              n.yt(
	                o,
	                () => {
	                  this.Po(t, e, s, r);
	                },
	                h.it.Xo,
	                (e) => this.Ro(e, t.triggerId),
	                () => this._o(),
	                r,
	              );
	            }
	            g && n.dt(p, c);
	          },
	        });
	      },
	      h.it.Xo,
	    );
	  }
	  Xn(t) {
	    if (null == t || "" === t) return !1;
	    const e = new Date().valueOf(),
	      s = this.qn[t];
	    return (null != s && e - s < IamTiming.aE) || ((this.qn[t] = e), !1);
	  }
	  oa() {
	    this.qn = {};
	  }
	  Kn(t) {
	    if (null == t.triggerId)
	      return (
	        b$1.info(
	          "The in-app message has no analytics id. Not logging event to Braze servers.",
	        ),
	        null
	      );
	    const e = {};
	    return null != t.triggerId && (e.trigger_ids = [t.triggerId]), e;
	  }
	  An(t) {
	    return (
	      !!this.j &&
	      !(
	        !(t && t instanceof InAppMessage && t.constructor !== InAppMessage) ||
	        t instanceof ControlMessage
	      ) &&
	      this.j.Pt(STORAGE_KEYS.It.la, t.qt())
	    );
	  }
	  sa() {
	    if (!this.j) return null;
	    const t = this.j.St(STORAGE_KEYS.It.la);
	    if (!t) return null;
	    let e;
	    switch (t.type) {
	      case IamServerTypes.oE:
	        e = FullScreenMessage.ua(t);
	        break;
	      case IamServerTypes.ME:
	      case IamServerTypes.CE:
	      case IamServerTypes.DE:
	        e = HtmlMessage.ua(t);
	        break;
	      case IamServerTypes.tE:
	      case IamServerTypes.eE:
	        e = ModalMessage.ua(t);
	        break;
	      case IamServerTypes.RE:
	        e = SlideUpMessage.ua(t);
	    }
	    return e && this.ma(), e;
	  }
	  ma() {
	    this.j && this.j.Vt(STORAGE_KEYS.It.la);
	  }
	}

	const se = {
	  na: null,
	  i: !1,
	  ra: () => (
	    se.t(), se.na || (se.na = new ea(r.m(), r.u(), r.p(), r.ir())), se.na
	  ),
	  t: () => {
	    se.i || (r.g(se), (se.i = !0));
	  },
	  destroy: () => {
	    (se.na = null), (se.i = !1);
	  },
	};
	var se$1 = se;

	class Jt {
	  constructor(t, s, i, h, l) {
	    (this.triggerId = t),
	      (this.Zo = s),
	      (this.Vo = i),
	      (this.ta = h),
	      (this.ia = l),
	      (this.triggerId = t),
	      (this.Zo = s),
	      (this.Vo = i),
	      (this.ta = h),
	      (this.ia = l);
	  }
	  static fromJson(t, s, i, h, l) {
	    return null == t || null == t.trigger_id
	      ? null
	      : new Jt(t.trigger_id, s, i, h, l);
	  }
	}

	class vr extends t {
	  constructor(t, i, s, e, r) {
	    super(),
	      (this.tg = t),
	      (this.Rs = i),
	      (this.j = s),
	      (this.Ru = e),
	      (this.ig = r),
	      (this.tg = t),
	      (this.Rs = i),
	      (this.j = s),
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
	    if (this.j) {
	      (this.hg = this.j.St(STORAGE_KEYS.It.iS) || this.hg),
	        (this.ng = this.j.St(STORAGE_KEYS.It.SS) || this.ng),
	        (this.og = this.j.St(STORAGE_KEYS.It.aS) || this.og);
	      for (let t = 0; t < this.triggers.length; t++) {
	        const i = this.triggers[t];
	        i.id && null != this.og[i.id] && i.Ad(this.og[i.id]);
	      }
	    }
	  }
	  ag() {
	    if (!this.j) return;
	    this.lg = this.j.St(STORAGE_KEYS.It.nS) || 0;
	    const t = this.j.St(STORAGE_KEYS.It.oS) || [],
	      i = [];
	    for (let s = 0; s < t.length; s++) i.push(vt._u(t[s]));
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
	            o = s.Id(n.ta || 0);
	          if (o > 0) {
	            let t, r;
	            h.push(n),
	              null != n.ug && (t = n.ug),
	              null != n.dg && ve.RS(n.dg) && (r = ve._u(n.dg));
	            const l = [];
	            if (n.pg && isArray(n.pg))
	              for (let t = 0; t < n.pg.length; t++) {
	                const i = e[n.pg[t]];
	                null != i && l.push(i);
	              }
	            this.eg.push(window.setTimeout(i(s, n.ta || 0, t, r, l), o));
	          }
	        }
	        this.ng[s.id].length > h.length &&
	          ((this.ng[s.id] = h),
	          (r = !0),
	          0 === this.ng[s.id].length && delete this.ng[s.id]);
	      }
	    }
	    r && this.j && this.j.Pt(STORAGE_KEYS.It.SS, this.ng);
	  }
	  mg() {
	    if (!this.j) return;
	    const t = [];
	    for (let i = 0; i < this.triggers.length; i++)
	      t.push(this.triggers[i].qt());
	    (this.lg = new Date().valueOf()),
	      this.j.Pt(STORAGE_KEYS.It.oS, t),
	      this.j.Pt(STORAGE_KEYS.It.nS, this.lg);
	  }
	  bg() {
	    if (!this.j) return;
	    (this.j.St(STORAGE_KEYS.It.nS) || 0) > this.lg ? this.ag() : this.fg();
	  }
	  q(t) {
	    let i = !1;
	    if (null != t && t.triggers) {
	      this.ig.ma(), this.fg();
	      const e = {},
	        r = {};
	      this.triggers = [];
	      for (let s = 0; s < t.triggers.length; s++) {
	        const h = vt.fromJson(t.triggers[s]);
	        if (h) {
	          h.id &&
	            null != this.og[h.id] &&
	            (h.Ad(this.og[h.id]), (e[h.id] = this.og[h.id])),
	            h.id && null != this.ng[h.id] && (r[h.id] = this.ng[h.id]);
	          for (let t = 0; t < h.Dd.length; t++)
	            if (h.Dd[t]._c(ot.Os, null)) {
	              i = !0;
	              break;
	            }
	          this.triggers.push(h);
	        }
	      }
	      isEqual(this.og, e) || ((this.og = e), this.j && this.j.Pt(STORAGE_KEYS.It.aS, this.og)),
	        isEqual(this.ng, r) ||
	          ((this.ng = r), this.j && this.j.Pt(STORAGE_KEYS.It.SS, this.ng)),
	        this.mg(),
	        i &&
	          (b$1.info("Trigger with test condition found, firing test."),
	          this.Ee(ot.Os)),
	        this.Ee(ot.OPEN);
	      const h = this.sg;
	      let n;
	      this.sg = [];
	      for (let t = 0; t < h.length; t++)
	        (n = Array.prototype.slice.call(h[t])), this.Ee(...n);
	    }
	  }
	  cg(t, i, s, e, r) {
	    const h = (e) => {
	        this.fg();
	        const r = new Date().valueOf();
	        t.$d(i) ||
	          (!1 === navigator.onLine && t.type === vt.Yo.Wo && e.imageUrl
	            ? b$1.info(
	                `Not showing ${t.type} trigger action ${t.id} due to offline state.`,
	              )
	            : t._d(r) && this.wg(t, r, s)
	            ? 0 === this.Rs.an()
	              ? b$1.info(
	                  `Not displaying trigger ${t.id} because neither automaticallyShowInAppMessages() nor subscribeToInAppMessage() were called.`,
	                )
	              : (this.Rs.A([e]), this.yg(t, r))
	            : b$1.info(
	                `Not displaying trigger ${t.id} because display time fell outside of the acceptable time window.`,
	              ));
	      },
	      n = () => {
	        this.fg();
	        const h = r.pop();
	        if (null != h)
	          if ((this.Tg(h, i, s, e, r), h.$d(i))) {
	            let t = `Server aborted in-app message display, but the timeout on fallback trigger ${h.id} has already elapsed.`;
	            r.length > 0 && (t += " Continuing to fall back."), b$1.info(t), n();
	          } else {
	            b$1.info(
	              `Server aborted in-app message display. Falling back to lower priority ${h.type} trigger action ${t.id}.`,
	            );
	            const n = 1e3 * h.Pd - (new Date().valueOf() - i);
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
	      case vt.Yo.Wo:
	        if (((o = newInAppMessageFromJson(t.data)), null == o)) {
	          b$1.error(
	            `Could not parse trigger data for trigger ${t.id}, ignoring.`,
	          );
	          break;
	        }
	        if (((l = this.ig.Vn(o)), l)) {
	          b$1.error(l), n();
	          break;
	        }
	        h(o);
	        break;
	      case vt.Yo.xd:
	        if (((a = Jt.fromJson(t.data, h, n, i, t.ia || 0)), null == a)) {
	          b$1.error(
	            `Could not parse trigger data for trigger ${t.id}, ignoring.`,
	          );
	          break;
	        }
	        this.ig.Po(a, s, e);
	        break;
	      default:
	        b$1.error(`Trigger ${t.id} was of unexpected type ${t.type}, ignoring.`);
	    }
	  }
	  Ee(t, i = null, s) {
	    if (!validateValueIsFromEnum(ot, t, "Cannot fire trigger action.", "TriggerEvents")) return;
	    if (this.Ru && this.Ru.yc())
	      return (
	        b$1.info(
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
	        l = e + 1e3 * r.Pd;
	      if (
	        r._d(l) &&
	        (null == r.startTime || r.startTime.valueOf() <= e) &&
	        (null == r.endTime || r.endTime.valueOf() >= e)
	      ) {
	        let s = !1;
	        for (let e = 0; e < r.Dd.length; e++)
	          if (r.Dd[e]._c(t, i)) {
	            s = !0;
	            break;
	          }
	        s && ((h = !1), this.wg(r, l, t) && ((n = !1), o.push(r)));
	      }
	    }
	    if (h)
	      return void b$1.info(
	        `Trigger event ${t} did not match any trigger conditions.`,
	      );
	    if (n)
	      return void b$1.info(
	        `Ignoring ${t} trigger event because a trigger was displayed ${
          r / 1e3
        }s ago.`,
	      );
	    o.sort((t, i) => t.priority - i.priority);
	    const l = o.pop();
	    null != l &&
	      (b$1.info(
	        `Firing ${l.type} trigger action ${l.id} from trigger event ${t}.`,
	      ),
	      this.Tg(l, e, t, s, o),
	      0 === l.Pd
	        ? this.cg(l, e, t, s, o)
	        : this.eg.push(
	            window.setTimeout(() => {
	              this.cg(l, e, t, s, o);
	            }, 1e3 * l.Pd),
	          ));
	  }
	  changeUser(t = !1) {
	    if (((this.triggers = []), this.j && this.j.Vt(STORAGE_KEYS.It.oS), !t)) {
	      (this.sg = []),
	        (this.hg = null),
	        (this.og = {}),
	        (this.ng = {}),
	        this.ig && this.ig.oa();
	      for (let t = 0; t < this.eg.length; t++) clearTimeout(this.eg[t]);
	      (this.eg = []),
	        this.j && (this.j.Vt(STORAGE_KEYS.It.iS), this.j.Vt(STORAGE_KEYS.It.aS), this.j.Vt(STORAGE_KEYS.It.SS));
	    }
	  }
	  clearData() {
	    (this.triggers = []),
	      (this.hg = null),
	      (this.og = {}),
	      (this.ng = {}),
	      this.ig && this.ig.oa();
	    for (let t = 0; t < this.eg.length; t++) clearTimeout(this.eg[t]);
	    this.eg = [];
	  }
	  wg(t, i, s) {
	    if (null == this.hg) return !0;
	    if (s === ot.Os)
	      return (
	        b$1.info(
	          "Ignoring minimum interval between trigger because it is a test type.",
	        ),
	        !0
	      );
	    let e = t.jd;
	    return null == e && (e = this.tg), i - this.hg >= 1e3 * e;
	  }
	  Tg(t, i, e, r, h) {
	    this.fg(), t.id && (this.ng[t.id] = this.ng[t.id] || []);
	    const n = {};
	    let o;
	    (n.ta = i), (n.ug = e), null != r && (o = r.qt()), (n.dg = o);
	    const l = [];
	    for (const t of h) t.id && l.push(t.id);
	    (n.pg = l),
	      t.id && this.ng[t.id].push(n),
	      this.j && this.j.Pt(STORAGE_KEYS.It.SS, this.ng);
	  }
	  yg(t, i) {
	    this.fg(),
	      t.Ad(i),
	      (this.hg = i),
	      t.id && (this.og[t.id] = i),
	      this.j && (this.j.Pt(STORAGE_KEYS.It.iS, i), this.j.Pt(STORAGE_KEYS.It.aS, this.og));
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
	      const i = r.er(U.Dh);
	      (TriggersProviderFactory.provider = new vr(
	        null != i ? i : 30,
	        se$1.ra().Pn(),
	        r.p(),
	        r.nn(),
	        se$1.ra(),
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

	const MAX_RETRIES = 15;
	function buildSseUrl(t, e, n, o, s) {
	  const p = /^https?:\/\//i.test(t) ? t : `https://${t}`;
	  let c = `mite=${encodeURIComponent(e)}&attempts=${n}`;
	  return (
	    o && (c += `&auth=${encodeURIComponent(o)}`),
	    s && (c += `&rcs=${encodeURIComponent(s)}`),
	    `${p}/sse?${c}`
	  );
	}

	const ht = [STORAGE_KEYS.It._i, STORAGE_KEYS.It.Oi, STORAGE_KEYS.It.Gi, STORAGE_KEYS.It.Hi];
	function isConfigExpired(t) {
	  return !!t && Math.floor(new Date().valueOf() / 1e3) >= t;
	}
	function isConfigUsable(t) {
	  return Boolean(t.Ki && t.host) && !isConfigExpired(t.expiration);
	}
	class lt {
	  constructor(t) {
	    (this.j = t), (this.j = t), (this.Vi = null), (this.Wi = null);
	  }
	  read() {
	    return this.j
	      ? {
	          Ki: this.j.St(STORAGE_KEYS.It._i),
	          host: this.j.St(STORAGE_KEYS.It.Oi),
	          Qi: this.j.St(STORAGE_KEYS.It.Gi),
	          expiration: this.j.St(STORAGE_KEYS.It.Hi),
	        }
	      : { Ki: null, host: null, Qi: null, expiration: null };
	  }
	  write(t) {
	    const i = this.j;
	    i &&
	      (i.Pt(STORAGE_KEYS.It._i, t.Ki),
	      i.Pt(STORAGE_KEYS.It.Oi, t.host),
	      t.Qi ? i.Pt(STORAGE_KEYS.It.Gi, t.Qi) : i.Vt(STORAGE_KEYS.It.Gi),
	      t.expiration ? i.Pt(STORAGE_KEYS.It.Hi, t.expiration) : i.Vt(STORAGE_KEYS.It.Hi));
	  }
	  clear() {
	    const t = this.j;
	    t && (t.Vt(STORAGE_KEYS.It._i), t.Vt(STORAGE_KEYS.It.Oi), t.Vt(STORAGE_KEYS.It.Gi), t.Vt(STORAGE_KEYS.It.Hi));
	  }
	  Yi() {
	    const t = this.j;
	    if (!t) return V$1.de();
	    const i = t.St(STORAGE_KEYS.It.Zi),
	      e = new Date().valueOf();
	    if (i && "number" == typeof i.e && i.e > e) return null;
	    const n = V$1.de();
	    t.Pt(STORAGE_KEYS.It.Zi, { t: n, e: e + 2e3 });
	    const r = t.St(STORAGE_KEYS.It.Zi);
	    return r && r.t === n ? n : null;
	  }
	  we(t) {
	    const i = this.j;
	    if (!i) return;
	    const e = i.St(STORAGE_KEYS.It.Zi);
	    (e && e.t !== t) || i.Vt(STORAGE_KEYS.It.Zi);
	  }
	  xe(t, i) {
	    if (this.Vi || null !== this.Wi) return !1;
	    const e = this.read();
	    if (isConfigUsable(e)) return t(e), !0;
	    const s = new Date().valueOf() + 2e3,
	      n = () => {
	        const e = this.read();
	        if (isConfigUsable(e)) return this.Le(), void t(e);
	        new Date().valueOf() >= s &&
	          (this.Le(),
	          b$1.info(
	            "Timed out waiting for another tab to refresh real-time messaging configuration",
	          ),
	          i());
	      };
	    return (
	      (this.Vi = (t) => {
	        if (t.key)
	          for (let i = 0; i < ht.length; i++)
	            if (0 === t.key.indexOf(ht[i])) return void n();
	      }),
	      window.addEventListener("storage", this.Vi),
	      (this.Wi = window.setInterval(n, 100)),
	      !0
	    );
	  }
	  Le() {
	    this.Vi &&
	      (window.removeEventListener("storage", this.Vi), (this.Vi = null)),
	      null !== this.Wi && (window.clearInterval(this.Wi), (this.Wi = null));
	  }
	  destroy() {
	    this.Le();
	  }
	}

	const ct = ["ccr", "ffr", "tgr"];
	class at {
	  constructor(t) {
	    (this.j = t), (this.j = t);
	  }
	  Mr(t) {
	    const r = this.j;
	    if (
	      !r ||
	      !(function (t) {
	        for (const r of ct) if (r === t) return !0;
	        return !1;
	      })(t)
	    )
	      return !0;
	    const n = new Date().valueOf(),
	      e = r.St(STORAGE_KEYS.It._r);
	    if (e && this.Ir(e[t], n)) return !1;
	    const o = {};
	    if (e) for (const t in e) this.Ir(e[t], n) && (o[t] = e[t]);
	    (o[t] = n), r.Pt(STORAGE_KEYS.It._r, o);
	    const i = r.St(STORAGE_KEYS.It._r);
	    return !i || i[t] === n;
	  }
	  Wr() {
	    this.j && this.j.Vt(STORAGE_KEYS.It._r);
	  }
	  Ir(t, r) {
	    return "number" == typeof t && Math.abs(r - t) < 500;
	  }
	}

	const ai = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	function isValidIndividual(i) {
	  if (!i) return !1;
	  for (let e = 0; e < i.length; e++) if (!isAlphanumericChar(i.charAt(e))) return !1;
	  return !0;
	}
	function generateIndividual() {
	  let i = "";
	  for (let e = 0; e < 10; e++)
	    i += ai.charAt(Math.floor(Math.random() * ai.length));
	  return i;
	}
	function buildTabMite(i, e) {
	  if (!i) return i;
	  const t = i.split(":");
	  return t.length < 3
	    ? (b$1.warn(
	        "Real-time messaging identifier is not a full identifier, using it as-is",
	      ),
	      i)
	    : isValidIndividual(e)
	    ? t[0] + ":" + t[1] + ":" + e
	    : (b$1.warn(
	        "Generated per-tab real-time messaging identifier is invalid, using the shared identifier",
	      ),
	      i);
	}

	class sr extends t {
	  constructor(i, t, s, e) {
	    super(),
	      (this.B = i),
	      (this.j = t),
	      (this.h = s),
	      (this.B = i),
	      (this.j = t),
	      (this.h = s),
	      (this.mite = null),
	      (this.ye = null),
	      (this.Se = null),
	      (this.Re = null),
	      (this.ke = e || null),
	      (this.Me = null),
	      (this.Fe = null),
	      (this.Ne = null),
	      (this.T = null),
	      (this.Te = 0),
	      (this.De = MAX_RETRIES),
	      (this.Ue = null),
	      (this.Ae = null),
	      (this.Ge = null),
	      (this.Ie = !0),
	      (this.Je = null),
	      (this.Oe = null),
	      (this.Pe = null),
	      (this.qe = null),
	      (this.Be = !1),
	      (this.ze = new Map()),
	      (this.He = null),
	      (this.Ke = null),
	      (this.Ve = null),
	      (this.We = null),
	      (this._e = new lt(t)),
	      (this.Qe = null),
	      (this.Xe = new at(t)),
	      (this.Ye = !1),
	      this.Ze();
	  }
	  sn() {
	    return this.We || (this.We = generateIndividual()), this.We;
	  }
	  en() {
	    (this.Te = 0), (this.Je = null), (this.Ie = !0);
	  }
	  hn() {
	    return null !== this.Fe && this.Fe === this.Ve;
	  }
	  on(i, t) {
	    const s = i.type;
	    if (!s)
	      return void b$1.warn(
	        `Received real-time message without type: ${JSON.stringify(i)}`,
	      );
	    if ((b$1.info(`Received real-time message of type '${s}'`), "cir" === s))
	      return void this.ln(t || this.Fe);
	    if (!this.Xe.Mr(s))
	      return void b$1.info(
	        `Another tab is handling the real-time message of type '${s}', skipping it`,
	      );
	    const e = this.ze.get(s);
	    if (e && e.an() > 0)
	      try {
	        e.A(i);
	      } catch (i) {
	        b$1.error(`Error invoking subscription for message type '${s}': ${i}`);
	      }
	    else b$1.info(`No subscribers for real-time message type '${s}'`);
	  }
	  ln(i) {
	    i &&
	      this.cn(i) &&
	      (b$1.info("Real-time messaging connection is ready"), (this.Ve = i));
	  }
	  un(i) {
	    this.Ve === i && (this.Ve = null);
	  }
	  Ze() {
	    if (!this.j) return;
	    const i = this._e.read();
	    i.mite && i.host
	      ? ((this.mite = i.mite),
	        (this.ye = i.host),
	        (this.Se = i.auth),
	        (this.Re = i.expiration),
	        b$1.info("Restored real-time messaging configuration from storage"))
	      : (i.mite || i.host) &&
	        (b$1.warn(
	          "Incomplete real-time messaging configuration in storage, clearing",
	        ),
	        this.gn());
	  }
	  dn() {
	    const i = this._e.read();
	    i.mite &&
	      i.host &&
	      (i.auth !== this.Se &&
	        b$1.info(
	          "Using real-time messaging configuration refreshed by another tab",
	        ),
	      (this.mite = i.mite),
	      (this.ye = i.host),
	      (this.Se = i.auth),
	      (this.Re = i.expiration));
	  }
	  Hr() {
	    this.He ||
	      this.Ke ||
	      ((this.He = this.mn("ddr", (i) => {
	        var t, s, e;
	        const n = i.body;
	        if (!n) return;
	        const h = n.r_ms;
	        if ("number" != typeof h) return;
	        const o = n.e,
	          r = (null === (t = this.h) || void 0 === t ? void 0 : t.vt()) || REQUEST_BACKOFF_MIN_SLEEP_MS_DEFAULT,
	          l = (null === (s = this.h) || void 0 === s ? void 0 : s.gt()) || REQUEST_BACKOFF_SCALE_FACTOR_DEFAULT,
	          u = (null === (e = this.h) || void 0 === e ? void 0 : e.bt()) || REQUEST_BACKOFF_MAX_SLEEP_MS_DEFAULT,
	          g = Math.min(u, randomInclusive(r, r * l)),
	          f = Math.round(h + g),
	          p = o ? ` (${o})` : "";
	        b$1.info(
	          `Admin requested disconnect${p}, reconnecting in ${f}ms (r_ms=${h} + backoff=${g})`,
	        ),
	          this.fn(),
	          (this.Ge = window.setTimeout(() => {
	            (this.Ge = null), this.pn();
	          }, f));
	      })),
	      (this.Ke = this.mn("ttl", (i) => {
	        const t = i.body;
	        if (!t) return;
	        b$1.info(`ttl message: ${JSON.stringify(t)}`);
	        const s = t.t_ms;
	        if ("number" != typeof s) return;
	        const e = s;
	        b$1.info(`Time to live set to ${e}ms, will reconnect when expired`);
	        const n = t.rcs;
	        "string" == typeof n && (this.Me = n),
	          null !== this.Ae && window.clearTimeout(this.Ae),
	          (this.Ae = window.setTimeout(() => {
	            (this.Ae = null),
	              b$1.info("Time to live expired, performing gapless reconnection"),
	              this.vn();
	          }, e));
	      })));
	  }
	  wn() {
	    this.Oe ||
	      this.Pe ||
	      ((this.qe = () => {
	        (this.Be = !0), (this.Ie = !1);
	      }),
	      window.addEventListener("beforeunload", this.qe),
	      (this.Oe = () => {
	        (this.Be = !0),
	          this.we(),
	          (this.Fe || this.Ne) &&
	            (b$1.info("Page unloading, closing real-time connection gracefully"),
	            (this.Ie = !1),
	            this.fn());
	      }),
	      window.addEventListener("pagehide", this.Oe),
	      (this.Pe = (i) => {
	        i.persisted &&
	          this.bn() &&
	          !this.Fe &&
	          !this.Ne &&
	          (b$1.info("Page restored from bfcache, reconnecting"),
	          (this.Be = !1),
	          this.en(),
	          this.pn());
	      }),
	      window.addEventListener("pageshow", this.Pe));
	  }
	  Et() {
	    return this.T;
	  }
	  Lt(i) {
	    this.T = i;
	  }
	  mn(i, t) {
	    if ("function" != typeof t) return null;
	    let s = this.ze.get(i);
	    return s || ((s = new f()), this.ze.set(i, s), r.S(s)), s.Ut(t);
	  }
	  yn(i, t) {
	    const s = this.ze.get(i);
	    s && s.removeSubscription(t);
	  }
	  bn() {
	    return Boolean(this.mite && this.ye);
	  }
	  Sn() {
	    return isConfigExpired(this.Re);
	  }
	  gn() {
	    (this.mite = null),
	      (this.ye = null),
	      (this.Se = null),
	      (this.Re = null),
	      (this.Me = null),
	      this._e.clear();
	  }
	  Rn(i, t, s = !1) {
	    const e = () => {
	        "function" == typeof t && t();
	      },
	      n = () => {
	        this.pn(), "function" == typeof i && i();
	      };
	    if (this.Ye) return void e();
	    const o = this.B,
	      r = this.j;
	    if (!o || !r)
	      return (
	        b$1.error("NetworkManager or StorageManager not available"), void e()
	      );
	    if (!this.h || !this.h.$n())
	      return (
	        b$1.info("Real-time messaging is not enabled, skipping refresh"), void e()
	      );
	    const a = this.Qe || this._e.Yi();
	    if (!a && !s)
	      return (
	        b$1.info(
	          "Another tab is refreshing real-time messaging configuration, waiting for the result",
	        ),
	        void this._e.xe(
	          () => {
	            this.dn(), n();
	          },
	          () => this.Rn(i, t, !0),
	        )
	      );
	    (this.Qe = a),
	      this.bn()
	        ? b$1.info("Refreshing real-time messaging configuration")
	        : b$1.info("Fetching initial real-time messaging configuration");
	    const c = o.Z({}, !0),
	      u = o.tt(c, h.it.Cn),
	      g = new Date().valueOf();
	    h.nt(r, h.it.Cn, g),
	      l.ot({
	        url: `${o.ht()}/dust/config`,
	        headers: u,
	        data: c,
	        lt: (i) => {
	          if (!this.Ye) {
	            if ((this.we(), !o.ut(c, i, u)))
	              return (
	                b$1.error(
	                  "Failed to validate server response for real-time messaging configuration",
	                ),
	                void e()
	              );
	            o.ct(),
	              i.mite && i.host
	                ? ((this.mite = i.mite),
	                  (this.ye = i.host),
	                  (this.Se = i.auth || null),
	                  (this.Re = i.expiration || null),
	                  b$1.info(
	                    "Received real-time messaging configuration from server",
	                  ),
	                  this._e.write({
	                    mite: this.mite,
	                    host: this.ye,
	                    auth: this.Se,
	                    expiration: this.Re,
	                  }),
	                  n())
	                : (b$1.info(
	                    "Real-time messaging configuration not available - this SDK version may not be supported",
	                  ),
	                  this.gn(),
	                  e());
	          }
	        },
	        error: (i) => {
	          this.Ye || (this.we(), o.dt(i, "retrieving DUST config"), e());
	        },
	      });
	  }
	  we() {
	    this.Qe && (this._e.we(this.Qe), (this.Qe = null));
	  }
	  pn() {
	    if (!this.Ye && this.h && this.h.$n())
	      if (this.Ne)
	        b$1.info("Real-time messaging connection attempt already in progress");
	      else {
	        if ((this.dn(), this.bn()))
	          return this.Sn()
	            ? (b$1.info(
	                "Real-time messaging auth token has expired, refreshing configuration",
	              ),
	              void this.Rn(void 0, () => {
	                b$1.error(
	                  "Failed to refresh expired real-time messaging configuration",
	                );
	              }))
	            : void (
	                this.kn() &&
	                (this.ke || this.ye) &&
	                (this.Fe &&
	                  (b$1.info(
	                    "Real-time connection already exists, closing before starting new subscription",
	                  ),
	                  this.fn()),
	                this.jn())
	              );
	        b$1.error("Cannot start real-time subscription without configuration");
	      }
	  }
	  kn() {
	    return this.mite ? buildTabMite(this.mite, this.sn()) : null;
	  }
	  xn() {
	    const i = this.kn(),
	      t = this.ke || this.ye;
	    return i && t
	      ? buildSseUrl(t, i, this.Te, this.Se || void 0, this.Me || void 0)
	      : null;
	  }
	  cn(i) {
	    return this.Fe === i || this.Ne === i;
	  }
	  jn(i) {
	    if (this.Ye) return;
	    const t = this.xn();
	    if (t) {
	      this.ke && b$1.info(`Using custom real-time messaging host: ${this.ke}`);
	      try {
	        const s = new EventSource(t);
	        (this.Ne = s),
	          b$1.info(`createConnection: ${t}`),
	          (s.onopen = () => {
	            this.cn(s)
	              ? (this.Ne === s && (this.Ne = null),
	                i
	                  ? (b$1.info(
	                      "Gapless reconnection: new connection established, closing old connection",
	                    ),
	                    i.close())
	                  : b$1.info("Real-time messaging connection established"),
	                (this.Fe = s),
	                this.Ve !== s && (this.Ve = null),
	                (this.Te = 0),
	                (this.Je = null),
	                (this.Ie = !0))
	              : s.close();
	          }),
	          s.addEventListener("msg", (i) => {
	            if (!this.cn(s))
	              return (
	                b$1.info("Ignoring real-time message from superseded connection"),
	                void s.close()
	              );
	            this.Mn(i.data, s);
	          }),
	          (s.onerror = () => {
	            const t = s.readyState;
	            if (this.cn(s)) {
	              if (
	                (this.Be ||
	                  (0 === t
	                    ? b$1.info("Real-time messaging failed to connect")
	                    : b$1.info("Real-time messaging connection lost")),
	                i && this.Fe !== s)
	              )
	                return (
	                  b$1.info("Gapless reconnection failed, keeping old connection"),
	                  s.close(),
	                  this.Ne === s && (this.Ne = null),
	                  void (this.Ie && this.Te < this.De && this.Fn())
	                );
	              if (this.Ne && this.Fe === s)
	                return s.close(), (this.Fe = null), void this.un(s);
	              this.fn(),
	                this.Ie && this.Te < this.De
	                  ? this.Fn()
	                  : (this.Te >= this.De &&
	                      b$1.error(
	                        `Max retry attempts (${this.De}) reached for real-time messaging, giving up for current session`,
	                      ),
	                    (this.Ie = !1));
	            } else s.close();
	          });
	      } catch (i) {
	        b$1.error(
	          `Failed to create real-time messaging connection: ${
            i instanceof Error ? i.message : String(i)
          }`,
	        );
	      }
	    }
	  }
	  Fn() {
	    var i, t, s;
	    this.Te++;
	    const e = (null === (i = this.h) || void 0 === i ? void 0 : i.vt()) || REQUEST_BACKOFF_MIN_SLEEP_MS_DEFAULT,
	      n = (null === (t = this.h) || void 0 === t ? void 0 : t.gt()) || REQUEST_BACKOFF_SCALE_FACTOR_DEFAULT,
	      h = (null === (s = this.h) || void 0 === s ? void 0 : s.bt()) || REQUEST_BACKOFF_MAX_SLEEP_MS_DEFAULT;
	    let o = this.Je;
	    (null == o || o < e) && (o = e);
	    const r = Math.min(h, randomInclusive(e, o * n));
	    (this.Je = r),
	      b$1.info(
	        `Retrying real-time messaging connection in ${r}ms (attempt ${this.Te}/${this.De})`,
	      ),
	      (this.Ue = window.setTimeout(() => {
	        (this.Ue = null), this.pn();
	      }, r));
	  }
	  vn() {
	    if (this.Ne)
	      b$1.info("Real-time messaging connection attempt already in progress");
	    else {
	      if ((this.dn(), this.bn()))
	        return this.Sn()
	          ? (b$1.info(
	              "Auth token expired during gapless reconnection, falling back to regular reconnection",
	            ),
	            this.fn(),
	            void this.pn())
	          : void (this.Ne
	              ? b$1.info(
	                  "Real-time connection attempt already in progress, skipping gapless reconnection",
	                )
	              : (null !== this.Ae &&
	                  (window.clearTimeout(this.Ae), (this.Ae = null)),
	                this.jn(this.Fe || void 0)));
	      b$1.error("Cannot perform gapless reconnection without configuration");
	    }
	  }
	  fn() {
	    null !== this.Ue && (window.clearTimeout(this.Ue), (this.Ue = null)),
	      null !== this.Ae && (window.clearTimeout(this.Ae), (this.Ae = null)),
	      null !== this.Ge && (window.clearTimeout(this.Ge), (this.Ge = null)),
	      (this.Ve = null),
	      this.Ne && (this.Ne.close(), (this.Ne = null)),
	      this.Fe &&
	        (this.Fe.close(),
	        (this.Fe = null),
	        b$1.info("Real-time messaging connection closed"));
	  }
	  Mn(i, t) {
	    try {
	      const s = JSON.parse(i);
	      this.on(s, t);
	    } catch (i) {
	      b$1.warn(
	        `Failed to parse real-time message: ${
          i instanceof Error ? i.message : String(i)
        }`,
	      );
	    }
	  }
	  changeUser(i = !1) {
	    this.fn(),
	      i ||
	        (this.bn() &&
	          b$1.info(
	            "Clearing cached real-time messaging configuration for user change",
	          ),
	        this.gn()),
	      this.en();
	  }
	  clearData(i = !1) {
	    (this.Ie = !1),
	      this.fn(),
	      i &&
	        (this.bn() &&
	          b$1.info(
	            "Clearing cached real-time messaging configuration (wipeData)",
	          ),
	        this.gn(),
	        this.Xe.Wr()),
	      this.en();
	  }
	  destroy() {
	    (this.Ye = !0),
	      (this.Ie = !1),
	      this.fn(),
	      this.we(),
	      this._e.destroy(),
	      this.gn(),
	      this.He && (this.yn("ddr", this.He), (this.He = null)),
	      this.Ke && (this.yn("ttl", this.Ke), (this.Ke = null)),
	      this.qe &&
	        (window.removeEventListener("beforeunload", this.qe), (this.qe = null)),
	      this.Oe &&
	        (window.removeEventListener("pagehide", this.Oe), (this.Oe = null)),
	      this.Pe &&
	        (window.removeEventListener("pageshow", this.Pe), (this.Pe = null)),
	      this.T && (r.removeSubscription(this.T), (this.T = null));
	  }
	}

	const dr = {
	  i: !1,
	  provider: null,
	  o: () => {
	    if ((dr.t(), !dr.provider)) {
	      const t = r.er("dustHost");
	      (dr.provider = new sr(r.m(), r.p(), r.l(), t)),
	        r.v(dr.provider),
	        dr.provider.Hr();
	    }
	    return dr.provider;
	  },
	  t: () => {
	    dr.i || (r.g(dr), (dr.i = !0));
	  },
	  destroy: () => {
	    dr.provider && dr.provider.destroy(), (dr.provider = null), (dr.i = !1);
	  },
	};

	function subscribeToDust() {
	  const t = r.l(),
	    n = r.nn();
	  if (!t || !n) return null;
	  const o = dr.o(),
	    s = () => {
	      if (!o.Et()) {
	        o.wn();
	        const r = n.rn(() => {
	          t.$n() && o.Rn();
	        });
	        return r && o.Lt(r), o.bn() && o.pn(), r;
	      }
	      return o.Et();
	    };
	  return (
	    t.Tr(() => {
	      r.ao() && (t.$n() ? (o.Rn(), s()) : (o.fn(), o.bn() && o.gn()));
	    }),
	    t.$n() ? s() : null
	  );
	}

	class ui {
	  constructor(t, i, s, l, h) {
	    (this.endpoint = t),
	      (this.Uu = i),
	      (this.publicKey = s),
	      (this.sc = l),
	      (this.ld = h),
	      (this.endpoint = t || null),
	      (this.Uu = i || null),
	      (this.publicKey = s || null),
	      (this.sc = l || null),
	      (this.ld = h || null);
	  }
	  qt() {
	    return {
	      e: this.endpoint,
	      c: this.Uu,
	      p: this.publicKey,
	      u: this.sc,
	      v: this.ld,
	    };
	  }
	  static _u(t) {
	    return new ui(t.e, rehydrateDateAfterJsonization(t.c), t.p, t.u, t.v);
	  }
	}

	class Ut {
	  constructor(t, s) {
	    (this.h = t), (this.j = s), (this.h = t), (this.j = s);
	  }
	  getUserId() {
	    const t = this.j.$u(STORAGE_KEYS.Ou.Cu);
	    if (null == t) return null;
	    let i = t.Iu,
	      e = getByteLength(i);
	    if (e > User.br) {
	      for (; e > User.br; ) (i = i.slice(0, i.length - 1)), (e = getByteLength(i));
	      (t.Iu = i), this.j.Ju(STORAGE_KEYS.Ou.Cu, t);
	    }
	    return i;
	  }
	  Lu(t) {
	    const i = null == this.getUserId();
	    this.j.Ju(STORAGE_KEYS.Ou.Cu, new _t(t)), i && this.j.qu(t);
	  }
	  setCustomUserAttribute(t, s) {
	    if (this.h.zu(t))
	      return (
	        b$1.info('Custom Attribute "' + t + '" is blocklisted, ignoring.'), !1
	      );
	    const i = {};
	    return (i[t] = s), this.Bu(User.Eu, i, !0);
	  }
	  Bu(t, s, i = !1, e = !1) {
	    const u = this.j.Fu(this.getUserId(), t, s);
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
	      !e && u && b$1.info(`Logged${o} attribute ${r} with value ${h}`),
	      u
	    );
	  }
	  yu(t, i, e, u, o) {
	    this.Bu("push_token", t, !1, !0),
	      this.Bu("custom_push_public_key", e, !1, !0),
	      this.Bu("custom_push_user_auth", u, !1, !0),
	      this.Bu("custom_push_vapid_public_key", o, !1, !0);
	    const r = et._s.Xs,
	      h = new et(r, b$1),
	      n = new ui(t, i, e, u, o);
	    this.j.Pt(STORAGE_KEYS.It.xu, n.qt()), h.setItem(r.Ws.Gu, r.be, !0);
	  }
	  wu(t) {
	    if (
	      (this.Bu("push_token", null, !1, !0),
	      this.Bu("custom_push_public_key", null, !1, !0),
	      this.Bu("custom_push_user_auth", null, !1, !0),
	      this.Bu("custom_push_vapid_public_key", null, !1, !0),
	      t)
	    ) {
	      const t = et._s.Xs,
	        i = new et(t, b$1);
	      this.j.Pt(STORAGE_KEYS.It.xu, !1), i.setItem(t.Ws.Gu, t.be, !1);
	    }
	  }
	}

	const U = {
	  _h: "allowCrawlerActivity",
	  Nh: "baseUrl",
	  se: "cookieExpiryInDays",
	  Oh: "noCookies",
	  Th: "devicePropertyAllowlist",
	  xa: "disablePushTokenMaintenance",
	  Rh: "enableLogging",
	  Ph: "enableSdkAuthentication",
	  wa: "manageServiceWorkerExternally",
	  Dh: "minimumIntervalBetweenTriggerActionsInSeconds",
	  Lh: "sessionTimeoutInSeconds",
	  yh: "appVersion",
	  Mh: "appVersionNumber",
	  za: "serviceWorkerLocation",
	  ha: "safariWebsitePushId",
	  Ma: "localization",
	  sr: "contentSecurityNonce",
	  nr: "allowUserSuppliedJavascript",
	  ca: "inAppMessageZIndex",
	  da: "openInAppMessagesInNewTab",
	  tn: "openCardsInNewTab",
	  lh: "requireExplicitInAppMessageDismissal",
	  Uh: "doNotLoadFontAwesome",
	  Wh: "deviceId",
	  ba: "serviceWorkerScope",
	  Oi: "dustHost",
	  Bh: "sdkFlavor",
	};
	class Ei {
	  constructor() {
	    (this.eu = ""),
	      (this.Vh = ""),
	      (this.Kh = void 0),
	      (this.Gh = null),
	      (this.tu = null),
	      (this.B = null),
	      (this.Ru = null),
	      (this.h = null),
	      (this.C = null),
	      (this.j = null),
	      (this.Ss = null),
	      (this.Yh = ""),
	      (this.isInitialized = !1),
	      (this.$h = !1),
	      (this.qh = new f()),
	      (this.Hh = new f()),
	      (this.options = {}),
	      (this.Jh = []),
	      (this.Xh = []),
	      (this.In = []),
	      (this.Vh = "6.12.0");
	  }
	  Zh(t) {
	    this.qh.Ut(t);
	  }
	  ah(t) {
	    this.Hh.Ut(t);
	  }
	  initialize(t, i) {
	    var e, r, o;
	    if (this.ao())
	      return b$1.info("Braze has already been initialized with an API key."), !0;
	    this.options = i || {};
	    let n = this.er(U.Rh);
	    const h = parseQueryStringKeyValues(WindowUtils.Qh());
	    if (
	      (h && "true" === h.brazeLogging && (n = !0),
	      b$1.init(n),
	      b$1.info(
	        `Initialization Options: ${JSON.stringify(this.options, null, 2)}`,
	      ),
	      null == t || "" === t || "string" != typeof t)
	    )
	      return b$1.error("Braze requires a valid API key to be initialized."), !1;
	    this.eu = t;
	    let l = this.er(U.Nh);
	    if (null == l || "" === l || "string" != typeof l)
	      return b$1.error("Braze requires a valid baseUrl to be initialized."), !1;
	    !1 === /^https?:/.test(l) && (l = `https://${l}`);
	    const a = l;
	    if (
	      ((l = document.createElement("a")),
	      (l.href = a),
	      "/" === l.pathname && (l = `${l}api/v3`),
	      (this.Yh = l.toString()),
	      ro.il && !this.er(U._h))
	    )
	      return (
	        b$1.info("Ignoring activity from crawler bot " + navigator.userAgent),
	        (this.$h = !0),
	        !1
	      );
	    const u = this.er(U.Oh) || !1,
	      c = this.er(U.se),
	      d = di.sl();
	    if (
	      ((this.j = di.rl(t, u, c)),
	      u && this.j.hl(t),
	      new ne.le(null, !0).wr(STORAGE_KEYS.ce))
	    )
	      return (
	        b$1.info("Ignoring all activity due to previous opt out"),
	        (this.$h = !0),
	        !1
	      );
	    for (const t of keys(this.options))
	      -1 === values(pi).indexOf(t) &&
	        b$1.warn(`Ignoring unknown initialization option '${t}'.`);
	    const m = ["mparticle", "wordpress", "tealium"];
	    if (null != this.er(U.Bh)) {
	      const t = this.er(U.Bh);
	      -1 !== m.indexOf(t)
	        ? (this.Kh = t)
	        : b$1.error("Invalid sdk flavor passed: " + t);
	    }
	    let p = this.er(pi.Th);
	    if (null != p)
	      if (isArray(p)) {
	        const t = [];
	        for (let i = 0; i < p.length; i++)
	          validateValueIsFromEnum(
	            DeviceProperties,
	            p[i],
	            "devicePropertyAllowlist contained an invalid value.",
	            "DeviceProperties",
	          ) && t.push(p[i]);
	        p = t;
	      } else
	        b$1.error(
	          "devicePropertyAllowlist must be an array. Defaulting to all properties.",
	        ),
	          (p = null);
	    const E = this.er(U.Wh);
	    if (E) {
	      const t = new _t(E);
	      this.j.Ju(STORAGE_KEYS.Ou.Wh, t);
	    }
	    (this.tu = new Wt(this.j, p)),
	      (this.h = new li(this.j)),
	      (this.Ss = new Ut(this.h, this.j)),
	      (this.C = new fi(this.j, this.Ss, this.h, this.er(U.Lh)));
	    const I = new f();
	    (this.Gh = new Vt(this.j, this.er(U.Ph), I)),
	      this.S(I),
	      (this.B = new Xt(
	        this.tu,
	        this.j,
	        this.Gh,
	        this.Ss,
	        this.C,
	        this.h,
	        this.eu,
	        this.Yh,
	        this.Vh,
	        this.Kh || "",
	        this.er(U.yh),
	        this.er(U.Mh),
	      )),
	      (this.Ru = new Zt(
	        this.eu,
	        this.Yh,
	        this.C,
	        this.tu,
	        this.Ss,
	        this.h,
	        this.j,
	        (t) => {
	          if (this.ao()) for (const i of this.vr()) i.q(t);
	        },
	        this.Gh,
	        this.B,
	      )),
	      this.Ru.initialize(),
	      u || this.j.ll(),
	      b$1.info(
	        `Initialized for the Braze backend at "${this.er(
          U.Nh,
        )}" with API key "${this.eu}".`,
	      ),
	      TriggersProviderFactory.t(),
	      subscribeToDust(),
	      this.h.do(() => {
	        var t;
	        this.isInitialized &&
	          (null === (t = this.h) || void 0 === t ? void 0 : t.Kr()) &&
	          Promise.resolve().then(function () { return refreshFeatureFlags$1; }).then((t) => {
	            if (!this.isInitialized) return;
	            (0, t.default)();
	          });
	      }),
	      this.Ru.rn(() => {
	        var t;
	        this.isInitialized &&
	          (null === (t = this.h) || void 0 === t ? void 0 : t.Kr()) &&
	          Promise.resolve().then(function () { return refreshFeatureFlags$1; }).then((t) => {
	            if (!this.isInitialized) return;
	            (0, t.default)(void 0, void 0, !0);
	          });
	      }),
	      this.qh.A(this.options),
	      (this.isInitialized = !0),
	      window.dispatchEvent(new CustomEvent("braze.initialized")),
	      this.ar("tgr", () => {
	        var t;
	        null === (t = this.Ru) || void 0 === t || t.Ar(void 0, void 0, "dust");
	      });
	    const _ = null === (e = this.C) || void 0 === e ? void 0 : e.al();
	    return (
	      d ||
	        null == _ ||
	        (null === (r = this.C) || void 0 === r
	          ? void 0
	          : r.ul(new Date().valueOf(), _)) ||
	        null === (o = this.Ru) ||
	        void 0 === o ||
	        o.Ar(),
	      !0
	    );
	  }
	  destroy(t) {
	    if ((b$1.destroy(), this.ao())) {
	      this.Hh.A(), this.Hh.removeAllSubscriptions();
	      for (const t of this.Jh) t.destroy();
	      this.Jh = [];
	      for (const t of this.Xh) t.clearData(!1);
	      this.B && this.B.fo(),
	        (this.Xh = []),
	        this.removeAllSubscriptions(),
	        (this.In = []),
	        null != this.Ru && this.Ru.destroy(),
	        (this.Ru = null),
	        (this.Gh = null),
	        (this.tu = null),
	        (this.B = null),
	        (this.h = null),
	        (this.C = null),
	        (this.Ss = null),
	        (this.options = {}),
	        (this.Kh = void 0),
	        (this.isInitialized = !1),
	        (this.$h = !1),
	        t && (this.j = null);
	    }
	  }
	  rr() {
	    return !this.cl() && (!!this.ao() || (console.warn(CoreStrings.ee), !1));
	  }
	  ja() {
	    return this.eu;
	  }
	  Er() {
	    return this.Gh;
	  }
	  ht() {
	    return this.Yh;
	  }
	  ue() {
	    return this.tu;
	  }
	  m() {
	    return this.B;
	  }
	  er(t) {
	    return this.options[t];
	  }
	  vr() {
	    return this.Xh;
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
	    return this.j;
	  }
	  zr() {
	    if (this.Ss && this.Ru) return new User(this.Ss, this.Ru);
	  }
	  ir() {
	    return this.Ss;
	  }
	  dr() {
	    return !0 === this.er(U.nr);
	  }
	  g(t) {
	    let i = !1;
	    for (const s of this.Jh) s === t && (i = !0);
	    i || this.Jh.push(t);
	  }
	  v(i) {
	    let s = !1;
	    for (const t of this.Xh) t.constructor === i.constructor && (s = !0);
	    i instanceof t && !s && this.Xh.push(i);
	  }
	  S(t) {
	    t instanceof f && this.In.push(t);
	  }
	  removeAllSubscriptions() {
	    if (this.rr()) for (const t of this.In) t.removeAllSubscriptions();
	  }
	  removeSubscription(t) {
	    if (this.rr()) for (const i of this.In) i.removeSubscription(t);
	  }
	  fe(t) {
	    this.$h = t;
	  }
	  ao() {
	    return this.isInitialized;
	  }
	  cl() {
	    return this.$h;
	  }
	  ar(t, i) {
	    if (!this.rr()) return null;
	    return dr.o().mn(t, i);
	  }
	  qi() {
	    return this.Vh;
	  }
	}
	const r = new Ei();

	const v = {
	  Dt: (e, o, t) => {
	    var n, s;
	    const i = new L(),
	      l = r.u();
	    if (!l)
	      return (
	        b$1.info(
	          `Not logging event with type "${e}" because the current session ID could not be found.`,
	        ),
	        i
	      );
	    const d = l.el();
	    return (
	      i.Ce.push(
	        new ve(
	          t || (null === (n = r.ir()) || void 0 === n ? void 0 : n.getUserId()),
	          e,
	          new Date().valueOf(),
	          d,
	          o,
	        ),
	      ),
	      (i.lt =
	        (null === (s = r.p()) || void 0 === s ? void 0 : s.ol(i.Ce)) || !1),
	      i
	    );
	  },
	};
	var v$1 = v;

	class M {
	  constructor(t) {
	    (this.j = t), (this.j = t);
	  }
	  logClick(t) {
	    const n = new L();
	    if ((t.Yt(), null == t.url || "" === t.url))
	      return (
	        b$1.info(`Card ${t.id} has no url. Not logging click to Braze servers.`),
	        n
	      );
	    if (t.id && this.j) {
	      const n = this.j.St(STORAGE_KEYS.It.Zt) || {};
	      (n[t.id] = !0), this.j.Pt(STORAGE_KEYS.It.Zt, n);
	    }
	    const r = this.ls([t]);
	    if (null == r) return n;
	    const i = p.us;
	    return v$1.Dt(i, r);
	  }
	  cs(t) {
	    const n = new L();
	    if (!t.Ft())
	      return (
	        b$1.info(
	          `Card ${t.id} refused this dismissal. Ignoring analytics event.`,
	        ),
	        n
	      );
	    if (t.id && this.j) {
	      const n = this.j.St(STORAGE_KEYS.It.fs) || {};
	      (n[t.id] = !0), this.j.Pt(STORAGE_KEYS.It.fs, n);
	    }
	    const r = this.ls([t]);
	    return null == r ? n : v$1.Dt(p.gs, r);
	  }
	  ds(t) {
	    const n = new L(!0),
	      r = [],
	      i = [];
	    let o = {};
	    this.j && (o = this.j.St(STORAGE_KEYS.It.ps) || {});
	    for (const s of t) {
	      s.js()
	        ? (s instanceof ControlCard ? i.push(s) : r.push(s),
	          s.id && (o[s.id] = !0))
	        : b$1.info(
	            `Card ${s.id} logged an impression too recently. Ignoring analytics event.`,
	          );
	    }
	    const e = this.ls(r),
	      l = this.ls(i);
	    if (null == e && null == l) return (n.lt = !1), n;
	    if ((this.j && this.j.Pt(STORAGE_KEYS.It.ps, o), null != e)) {
	      const t = p.vs,
	        s = v$1.Dt(t, e);
	      n.Cs(s);
	    }
	    if (null != l) {
	      const t = v$1.Dt(p.ws, l);
	      n.Cs(t);
	    }
	    return n;
	  }
	  ls(t) {
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

	const K = {
	  i: !1,
	  na: null,
	  ra: () => (K.t(), K.na || (K.na = new M(r.p())), K.na),
	  t: () => {
	    K.i || (r.g(K), (K.i = !0));
	  },
	  destroy: () => {
	    (K.na = null), (K.i = !1);
	  },
	};
	var K$1 = K;

	const CardStrings = { tr: "must be a Card object" };

	function logCardDismissal(o) {
	  return (
	    !!r.rr() &&
	    (o instanceof Card ? K$1.ra().cs(o).lt : (b$1.error("card " + CardStrings.tr), !1))
	  );
	}

	function logContentCardImpressions(o) {
	  if (!r.rr()) return !1;
	  if (!isArray(o)) return b$1.error("cards must be an array"), !1;
	  for (const r of o)
	    if (!(r instanceof Card)) return b$1.error(`Each card in cards ${CardStrings.tr}`), !1;
	  return K$1.ra().ds(o).lt;
	}

	function logContentCardClick(o) {
	  return (
	    !!r.rr() &&
	    (o instanceof Card ? K$1.ra().logClick(o).lt : (b$1.error("card " + CardStrings.tr), !1))
	  );
	}

	function newCard(e, n, r, t, i, o, l, u, d, a, f, s, w, m, p, C, c, x) {
	  let j;
	  if (n === Card.ks.Ei || n === Card.ks.Ti)
	    j = new ClassicCard(e, r, t, i, o, l, u, d, a, f, s, w, m, p, c, x);
	  else if (n === Card.ks.zs)
	    j = new CaptionedImage(e, r, t, i, o, l, u, d, a, f, s, w, m, p, c, x);
	  else if (n === Card.ks.oi)
	    j = new ImageOnly(e, r, i, l, u, d, f, s, w, m, p, c, x);
	  else {
	    if (n !== Card.ks.ai)
	      return b$1.error("Ignoring card with unknown type " + n), null;
	    j = new ControlCard(e, r, l, u, s, w);
	  }
	  return C && (j.test = C), j;
	}
	function newCardFromContentCardsJson(e) {
	  if (e[Card.ei.ri]) return null;
	  const n = e[Card.ei.qs],
	    r = e[Card.ei.xs],
	    t = e[Card.ei.ys],
	    i = e[Card.ei.As],
	    o = e[Card.ei.Bs],
	    l = e[Card.ei.Ds],
	    u = dateFromUnixTimestamp(e[Card.ei.Es]);
	  let d;
	  d = e[Card.ei.Fs] === Card.ui ? null : dateFromUnixTimestamp(e[Card.ei.Fs]);
	  return newCard(
	    n,
	    r,
	    t,
	    i,
	    o,
	    l,
	    u,
	    d,
	    e[Card.ei.URL],
	    e[Card.ei.Gs],
	    e[Card.ei.Hs],
	    e[Card.ei.Is],
	    e[Card.ei.Js],
	    e[Card.ei.Ks],
	    e[Card.ei.Ls],
	    e[Card.ei.Os] || !1,
	    e[Card.ei.Ms],
	    e[Card.ei.Ns],
	  );
	}
	function newCardFromSerializedValue(e) {
	  return (
	    newCard(
	      e[Card.bs.qs],
	      e[Card.bs.xs],
	      e[Card.bs.ys],
	      e[Card.bs.As],
	      e[Card.bs.Bs],
	      e[Card.bs.Ds],
	      rehydrateDateAfterJsonization(e[Card.bs.Es]),
	      rehydrateDateAfterJsonization(e[Card.bs.Fs]),
	      e[Card.bs.URL],
	      e[Card.bs.Gs],
	      e[Card.bs.Hs],
	      e[Card.bs.Is],
	      e[Card.bs.Js],
	      e[Card.bs.Ks],
	      e[Card.bs.Ls],
	      e[Card.bs.Os] || !1,
	      e[Card.bs.Ms],
	      e[Card.bs.Ns],
	    ) || void 0
	  );
	}

	class rr extends t {
	  constructor(t, s, i, e, h) {
	    super(),
	      (this.Ss = t),
	      (this.j = s),
	      (this.h = i),
	      (this.Ts = e),
	      (this.B = h),
	      (this.Ss = t),
	      (this.j = s),
	      (this.h = i),
	      (this.Ts = e),
	      (this.B = h),
	      (this.Rs = new f()),
	      r.S(this.Rs),
	      (this.Us = 0),
	      (this.$s = 0),
	      (this.cards = []),
	      this.Ps();
	    const n = et._s.Xs;
	    new et(n, b$1).Qs(n.Ws.Vs, (t) => {
	      this.Ys(t);
	    }),
	      (this.Zs = null),
	      (this.T = null),
	      (this.fi = null),
	      (this.di = null),
	      (this.pi = 10);
	  }
	  vi() {
	    return this.Zs;
	  }
	  Ci(t) {
	    this.Zs = t;
	  }
	  Et() {
	    return this.T;
	  }
	  Lt(t) {
	    this.T = t;
	  }
	  Ps() {
	    if (!this.j) return;
	    const t = this.j.St(STORAGE_KEYS.It.bi) || [],
	      i = [];
	    for (let s = 0; s < t.length; s++) {
	      const e = newCardFromSerializedValue(t[s]);
	      null != e && i.push(e);
	    }
	    (this.cards = this.wi(this.gi(i, !1))),
	      (this.Us = this.j.St(STORAGE_KEYS.It.ji) || this.Us),
	      (this.$s = this.j.St(STORAGE_KEYS.It.yi) || this.$s);
	  }
	  Ri(t, i = !1, e = 0, h = 0) {
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
	        if (!h.ni(e))
	          for (let t = 0; t < r.length; t++)
	            if (e.id === r[t].id) {
	              r.splice(t, 1);
	              break;
	            }
	      }
	    }
	    (this.cards = this.wi(this.gi(r, i))),
	      this.Ui(),
	      (this.Us = e),
	      (this.$s = h),
	      this.j && (this.j.Pt(STORAGE_KEYS.It.ji, this.Us), this.j.Pt(STORAGE_KEYS.It.yi, this.$s));
	  }
	  q(t) {
	    if (this.ki() && null != t && t.cards) {
	      this.j && this.j.Pt(STORAGE_KEYS.It.zi, r.qi());
	      const i = t.full_sync;
	      i || this.Ps(),
	        this.Ri(t.cards, i, t.last_full_sync_at, t.last_card_updated_at),
	        this.Rs.A(this.xi(!0));
	    }
	  }
	  Fi(t) {
	    this.Li(), (this.fi = t);
	  }
	  Ys(t) {
	    var s;
	    if (!this.ki()) return;
	    this.Ps();
	    const i = this.cards.slice();
	    let e = null;
	    e = null === (s = this.Ss) || void 0 === s ? void 0 : s.getUserId();
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
	          if (!h.ni(e))
	            for (let t = 0; t < i.length; t++)
	              if (e.id === i[t].id) {
	                i.splice(t, 1);
	                break;
	              }
	        }
	      }
	    (this.cards = this.wi(this.gi(i, !1))), this.Ui(), this.Rs.A(this.xi(!0));
	  }
	  gi(t, i) {
	    let e = {},
	      h = {},
	      r = {};
	    this.j &&
	      ((e = this.j.St(STORAGE_KEYS.It.Zt) || {}),
	      (h = this.j.St(STORAGE_KEYS.It.ps) || {}),
	      (r = this.j.St(STORAGE_KEYS.It.fs) || {}));
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
	        this.j &&
	        (this.j.Pt(STORAGE_KEYS.It.Zt, n), this.j.Pt(STORAGE_KEYS.It.ps, o), this.j.Pt(STORAGE_KEYS.It.fs, l)),
	      t
	    );
	  }
	  wi(t) {
	    const i = [],
	      e = new Date();
	    let h = {};
	    this.j && (h = this.j.St(STORAGE_KEYS.It.fs) || {});
	    let r = !1;
	    for (let s = 0; s < t.length; s++) {
	      const n = t[s].url;
	      if (!this.Ts && n && isURIJavascriptOrData(n)) {
	        b$1.error(
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
	    return r && this.j && this.j.Pt(STORAGE_KEYS.It.fs, h), i;
	  }
	  Ui() {
	    var t;
	    const i = [];
	    for (let t = 0; t < this.cards.length; t++) i.push(this.cards[t].qt());
	    null === (t = this.j) || void 0 === t || t.Pt(STORAGE_KEYS.It.bi, i);
	  }
	  Li() {
	    this.fi && (clearTimeout(this.fi), (this.fi = null));
	  }
	  lr(t, i, e = "sdk") {
	    var n;
	    const o = this.B,
	      u = this.j;
	    if (!o || !u) return void ("function" == typeof i && i());
	    if (("client" === e && (h.Ji(u, h.it.Mi), this.Li()), !this.ki()))
	      return void (
	        null === (n = this.h) ||
	        void 0 === n ||
	        n.$i(() => {
	          this.lr(t, i, "client");
	        })
	      );
	    const f = o.Z({}, !0);
	    u.St(STORAGE_KEYS.It.zi) !== r.qi() && this.Bi(),
	      (f.last_full_sync_at = this.Us),
	      (f.last_card_updated_at = this.$s);
	    const p = o.tt(f, h.it.Mi, e);
	    let v = !1;
	    o.et(
	      f,
	      (s = -1) => {
	        if (this.j) {
	          const t = new Date().valueOf();
	          h.nt(this.j, h.it.Mi, t);
	        }
	        -1 !== s && p.push(["X-Braze-Req-Tokens-Remaining", s.toString()]),
	          l.ot({
	            url: `${o.ht()}/content_cards/sync`,
	            data: f,
	            headers: p,
	            lt: (s) => {
	              if (!o.ut(f, s, p))
	                return (v = !0), void ("function" == typeof i && i());
	              o.ct(), this.q(s), (v = !1), "function" == typeof t && t();
	            },
	            error: (t) => {
	              o.dt(t, "retrieving content cards"),
	                (v = !0),
	                "function" == typeof i && i();
	            },
	            ft: (s, e) => {
	              var r, n, l;
	              let u;
	              if (v) {
	                const t =
	                    (null === (r = this.h) || void 0 === r ? void 0 : r.vt()) ||
	                    REQUEST_BACKOFF_MIN_SLEEP_MS_DEFAULT,
	                  s =
	                    (null === (n = this.h) || void 0 === n ? void 0 : n.gt()) ||
	                    REQUEST_BACKOFF_SCALE_FACTOR_DEFAULT,
	                  i =
	                    (null === (l = this.h) || void 0 === l ? void 0 : l.bt()) ||
	                    REQUEST_BACKOFF_MAX_SLEEP_MS_DEFAULT;
	                let e = this.di;
	                (null == e || e < t) && (e = t), (u = Math.min(i, randomInclusive(t, e * s)));
	              }
	              o.yt(
	                e,
	                () => {
	                  this.lr(t, i);
	                },
	                h.it.Mi,
	                (t) => this.Fi(t),
	                () => this.Li(),
	                u,
	              );
	            },
	          });
	      },
	      h.it.Mi,
	      i,
	    );
	  }
	  xi(t) {
	    t || this.Ps();
	    const i = this.wi(this.cards);
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
	    let e = Math.max(this.$s || 0, this.Us || 0);
	    return (
	      0 === e && (e = void 0),
	      this.j && this.j.St(STORAGE_KEYS.It.yi) === this.$s && void 0 === e && (e = this.$s),
	      new ContentCards(i, dateFromUnixTimestamp(e))
	    );
	  }
	  Kt(t) {
	    return this.Rs.Ut(t);
	  }
	  Bi() {
	    (this.Us = 0),
	      (this.$s = 0),
	      this.j && (this.j.Vt(STORAGE_KEYS.It.ji), this.j.Vt(STORAGE_KEYS.It.yi));
	  }
	  changeUser(t) {
	    t ||
	      ((this.cards = []),
	      this.Rs.A(new ContentCards(this.cards.slice(), null)),
	      this.j &&
	        (this.j.Vt(STORAGE_KEYS.It.bi),
	        this.j.Vt(STORAGE_KEYS.It.Zt),
	        this.j.Vt(STORAGE_KEYS.It.ps),
	        this.j.Vt(STORAGE_KEYS.It.fs))),
	      this.Li(),
	      this.Bi();
	  }
	  clearData(t) {
	    (this.Us = 0),
	      (this.$s = 0),
	      (this.cards = []),
	      this.Rs.A(new ContentCards(this.cards.slice(), null)),
	      t &&
	        this.j &&
	        (this.j.Vt(STORAGE_KEYS.It.bi),
	        this.j.Vt(STORAGE_KEYS.It.Zt),
	        this.j.Vt(STORAGE_KEYS.It.ps),
	        this.j.Vt(STORAGE_KEYS.It.fs),
	        this.j.Vt(STORAGE_KEYS.It.ji),
	        this.j.Vt(STORAGE_KEYS.It.yi)),
	      this.Li();
	  }
	  ki() {
	    return !!this.h && (!!this.h.Pi() || (0 !== this.h.Qt() && this.Xi(), !1));
	  }
	  Xi() {
	    this.Rs.A(new ContentCards([], new Date())), this.j && this.j.Vt(STORAGE_KEYS.It.bi);
	  }
	}

	const ir = {
	  i: !1,
	  provider: null,
	  o: () => (
	    ir.t(),
	    ir.provider ||
	      ((ir.provider = new rr(r.ir(), r.p(), r.l(), r.dr(), r.m())),
	      r.v(ir.provider),
	      r.ar("ccr", () => {
	        var r;
	        null === (r = ir.provider) ||
	          void 0 === r ||
	          r.lr(void 0, void 0, "dust");
	      })),
	    ir.provider
	  ),
	  t: () => {
	    ir.i || (r.g(ir), (ir.i = !0));
	  },
	  destroy: () => {
	    (ir.provider = null), (ir.i = !1);
	  },
	};
	var ir$1 = ir;

	function requestContentCardsRefresh(e, t) {
	  if (r.rr()) return ir$1.o().lr(e, t, "client");
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
	  ur(r) {
	    logContentCardImpressions(r);
	  }
	  cr(r) {
	    return logContentCardClick(r);
	  }
	  Cr() {
	    requestContentCardsRefresh();
	  }
	  hr() {
	    return !0;
	  }
	}
	(ContentCards.mr = 6e4), (ContentCards.gr = 500), (ContentCards.jr = 1e4);

	function getCachedContentCards() {
	  if (r.rr()) return ir$1.o().xi(!1);
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
	    if (((o = e.te), o && e.imageUrl && "number" == typeof e.aspectRatio)) {
	      const t = i / e.aspectRatio;
	      t && (o.style.height = `${t}px`);
	    }
	}
	function cardToHtml(t, e, a, o = "ltr") {
	  const i = document.createElement("div");
	  (i.dir = o),
	    t.language && (i.lang = t.language),
	    (i.className = "ab-card ab-effect-card " + t.ae),
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
	      d && !t.oe)
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
	      detectSwipe(c, DIRECTIONS.ie, (t) => {
	        (i.className += " ab-swiped-left"), e.onclick(t);
	      }),
	      detectSwipe(c, DIRECTIONS.ne, (t) => {
	        (i.className += " ab-swiped-right"), e.onclick(t);
	      });
	  }
	  let s = "",
	    m = !1;
	  if ((t.title && "" !== t.title && ((s = t.title), (m = !0)), m)) {
	    const t = document.createElement("h1");
	    if (
	      ((t.className = "ab-title"),
	      (t.id = V$1.de()),
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
	    (t.te = i),
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
	    }, ContentCards.gr));
	  const e = t.getAttribute(BannerStrings.ea);
	  null != e && removeSubscription(e);
	  const n = t.getAttribute("data-listener-id");
	  null != n &&
	    (window.removeEventListener("scroll", scrollListeners[n]),
	    delete scrollListeners[n]);
	}
	function generateContentCardsUI(t, e) {
	  const n = he.ra(),
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
	    const r = (e) => t.cr(e);
	    for (const a of t.cards) {
	      const i = a instanceof ControlCard;
	      !i || t.hr()
	        ? (o.appendChild(cardToHtml(a, r, e, n.ga())), (s = s || !i))
	        : b$1.error(
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
	    t.Ta || (t.Ta = {});
	    for (let e = 0; e < o.length; e++) {
	      const s = getCardId(o[e]),
	        r = topIsInView(o[e]),
	        a = bottomIsInView(o[e]);
	      if (t.Ta[s]) {
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
	            (t.Ta[e.id] = !0), n.push(e);
	            break;
	          }
	      }
	    }
	    n.length > 0 && t.ur(n);
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
	          (t.innerHTML = he.ra().get("FEED_TIMEOUT_MESSAGE") || ""),
	            null != n.parentNode &&
	              (n.parentNode.appendChild(t), n.parentNode.removeChild(n));
	        }
	        "true" === e.getAttribute("aria-busy") &&
	          e.setAttribute("aria-busy", "false");
	      }
	    }, ContentCards.jr),
	    t.Cr();
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
	    (t.keyCode !== KeyCodes.To && t.keyCode !== KeyCodes.Lo) || a(t);
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
	    (t.keyCode !== KeyCodes.To && t.keyCode !== KeyCodes.Lo) || l(t);
	  }),
	    (i.onclick = l),
	    s.appendChild(i),
	    s.appendChild(r),
	    o.appendChild(generateContentCardsUI(t, e));
	  const d = () => detectContentCardsImpressions(t, o);
	  if ((o.addEventListener("scroll", d), !n)) {
	    window.addEventListener("scroll", d);
	    const t = V$1.de();
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
	          b$1.error(ineligibleBrazeActionURLErrorMessage(INELIGIBLE_BRAZE_ACTION_URL_ERROR_TYPES.Wn, "Content Card"));
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
	  const o = r.er(U.tn) || !1,
	    s = ir$1.o().xi(!1);
	  "function" == typeof t && updateContentCards(s, t(s.cards.slice()), s.lastUpdated, null, o);
	  const a = contentCardsToHtml(s, o, e),
	    i = ir$1.o(),
	    c = i.vi();
	  (null == s.lastUpdated ||
	    new Date().valueOf() - s.lastUpdated.valueOf() > ContentCards.mr) &&
	    (null == c || new Date().valueOf() - c > ContentCards.mr) &&
	    (b$1.info(
	      `Cached content cards were older than max TTL of ${ContentCards.mr} ms, requesting an update from the server.`,
	    ),
	    refreshContentCardsUI(s, a),
	    i.Ci(new Date().valueOf()));
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

	function subscribeToContentCardsUpdates(t) {
	  if (!r.rr()) return;
	  const o = ir$1.o(),
	    n = o.Kt(t);
	  if (!o.Et()) {
	    const t = r.nn();
	    if (t) {
	      const r = t.rn(() => {
	        o.lr(void 0, void 0, "client");
	      });
	      r && o.Lt(r);
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
	        b$1.error("Cannot set SDK metadata because metadata is not an array."), !1
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
	    return void b$1.error("changeUser requires a non-empty userId.");
	  if (getByteLength(e) > User.br)
	    return void b$1.error(
	      `Rejected user id "${e}" because it is longer than ${User.br} bytes.`,
	    );
	  if (null != i && !validateStandardString(i, "set signature for new user", "signature")) return;
	  const t = r.nn();
	  t && t.changeUser(e.toString(), r.vr(), i);
	}

	var changeUser$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		changeUser: changeUser
	});

	function destroy() {
	  b$1.info("Destroying Braze instance"), r.destroy(!0);
	}

	function disableSDK() {
	  const e = r.nn();
	  e && e.requestImmediateDataFlush();
	  const n = r.er(U.se),
	    a = new ne.le(null, !0, n),
	    i = "This-cookie-will-expire-in-" + a.me();
	  a.store(STORAGE_KEYS.ce, i);
	  const o = et._s.Xs;
	  new et(o, b$1).setItem(o.Ws.pe, o.be, !0),
	    b$1.info("disableSDK was called"),
	    r.destroy(!1),
	    r.fe(!0);
	}

	function enableSDK() {
	  new ne.le(null, !0).remove(STORAGE_KEYS.ce);
	  const e = et._s.Xs;
	  new et(e, b$1).ge(e.Ws.pe, e.be),
	    b$1.info("enableSDK was called"),
	    r.destroy(!1),
	    r.fe(!1);
	}

	function getDeviceId(e) {
	  if (!r.rr()) return;
	  const t = r.ue();
	  if (!t) return;
	  const i = t.ve().id;
	  if ("function" != typeof e) return i;
	  b$1.warn(
	    "The callback for getDeviceId is deprecated. You can access its return value directly instead (e.g. `const id = braze.getDeviceId()`)",
	  ),
	    e(i);
	}

	function initialize(i, n) {
	  return r.initialize(i, n);
	}

	function isDisabled() {
	  return !!new ne.le(null, !0).wr(STORAGE_KEYS.ce);
	}

	function isInitialized() {
	  return r.ao();
	}

	function logCustomEvent(t, e) {
	  if (!r.rr()) return !1;
	  if (null == t || t.length <= 0)
	    return (
	      b$1.error(
	        `logCustomEvent requires a non-empty eventName, got "${t}". Ignoring event.`,
	      ),
	      !1
	    );
	  if (!validateCustomString(t, "log custom event", "the event name")) return !1;
	  const [o, n] = validateCustomProperties(
	    e,
	    CoreStrings.je,
	    "eventProperties",
	    `log custom event "${t}"`,
	    "event",
	  );
	  if (!o) return !1;
	  const i = r.l();
	  if (i && i.$e(t))
	    return b$1.info(`Custom Event "${t}" is blocklisted, ignoring.`), !1;
	  const s = v$1.Dt(p.CustomEvent, { n: t, p: n });
	  if (s.lt) {
	    b$1.info(`Logged custom event "${t}".`);
	    for (const o of s.Ce) TriggersProviderFactory.o().Ee(ot.he, [t, e], o);
	  }
	  return s.lt;
	}

	var logCustomEvent$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		logCustomEvent: logCustomEvent
	});

	class na {
	  constructor(i, e, t, s, r, o, n, u, h, a, c) {
	    (this.iu = i),
	      (this.eu = e),
	      (this.tu = t),
	      (this.su = r),
	      (this.ru = o),
	      (this.ou = n),
	      (this.h = u),
	      (this.nu = h),
	      (this.uu = a),
	      (this.j = c),
	      (this.iu = i),
	      (this.eu = e),
	      (this.tu = t),
	      (this.hu = s + "/safari/" + e),
	      (this.su = r || "/service-worker.js"),
	      (this.ou = n),
	      (this.h = u),
	      (this.nu = h || !1),
	      (this.uu = a || !1),
	      (this.j = c),
	      (this.au = Dt$1.cu()),
	      (this.fu = Dt$1.du());
	  }
	  lu() {
	    return this.uu;
	  }
	  pu(i, e, t, s, r) {
	    i.unsubscribe()
	      .then((i) => {
	        i
	          ? this.bu(e, t, s, r)
	          : (b$1.error("Failed to unsubscribe device from push."),
	            "function" == typeof r && r(!1));
	      })
	      .catch((i) => {
	        b$1.error("Push unsubscription error: " + i),
	          "function" == typeof r && r(!1);
	      });
	  }
	  mu(i, e, t) {
	    var s;
	    const r = ((i) => {
	      if ("string" == typeof i) return i;
	      if (0 !== i.endpoint.indexOf("https://android.googleapis.com/gcm/send"))
	        return i.endpoint;
	      let e = i.endpoint;
	      const t = i;
	      return (
	        t.gu &&
	          -1 === i.endpoint.indexOf(t.gu) &&
	          (e = i.endpoint + "/" + t.gu),
	        e
	      );
	    })(i);
	    let o = null,
	      n = null;
	    const u = i;
	    if (null != u.getKey)
	      try {
	        const i = Array.from(new Uint8Array(u.getKey("p256dh"))),
	          e = Array.from(new Uint8Array(u.getKey("auth")));
	        (o = btoa(String.fromCharCode.apply(null, i))),
	          (n = btoa(String.fromCharCode.apply(null, e)));
	      } catch (i) {
	        b$1.error(getErrorMessage(i));
	      }
	    const h = ((i) => {
	      let e;
	      return i.options &&
	        (e = i.options.applicationServerKey) &&
	        e.byteLength &&
	        e.byteLength > 0
	        ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(e))))
	            .replace(/\+/g, "-")
	            .replace(/\//g, "_")
	        : null;
	    })(u);
	    null === (s = this.iu) || void 0 === s || s.yu(r, e, o, n, h),
	      r && "function" == typeof t && t(r, o, n);
	  }
	  vu() {
	    var i;
	    null === (i = this.iu) || void 0 === i || i.wu(!0);
	  }
	  Pu(i, e) {
	    var t;
	    null === (t = this.iu) || void 0 === t || t.wu(!1),
	      b$1.info(i),
	      "function" == typeof e && e(!1);
	  }
	  ku(i, e, t, s) {
	    var r;
	    if ("default" === e.permission)
	      try {
	        window.safari.pushNotification.requestPermission(
	          this.hu,
	          i,
	          {
	            api_key: this.eu,
	            device_id:
	              (null === (r = this.tu) || void 0 === r ? void 0 : r.ve().id) ||
	              "",
	          },
	          (e) => {
	            "granted" === e.permission &&
	              this.iu &&
	              this.iu.setPushNotificationSubscriptionType(
	                User.NotificationSubscriptionTypes.OPTED_IN,
	              ),
	              this.ku(i, e, t, s);
	          },
	        );
	      } catch (i) {
	        this.Pu("Could not request permission for push: " + i, s);
	      }
	    else
	      "denied" === e.permission
	        ? this.Pu(
	            "The user has blocked notifications from this site, or Safari push is not configured in the Braze dashboard.",
	            s,
	          )
	        : "granted" === e.permission &&
	          (b$1.info("Device successfully subscribed to push."),
	          this.mu(e.deviceToken, new Date(), t));
	  }
	  requestPermission(i, e, t) {
	    const s = (s) => {
	      switch (s) {
	        case "granted":
	          return void ("function" == typeof i && i());
	        case "default":
	          return void ("function" == typeof e && e());
	        case "denied":
	          return void ("function" == typeof t && t());
	        default:
	          b$1.error("Received unexpected permission result " + s);
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
	  bu(i, e, t, s) {
	    const r = { userVisibleOnly: !0 };
	    null != e && (r.applicationServerKey = e),
	      i.pushManager
	        .subscribe(r)
	        .then((i) => {
	          b$1.info("Device successfully subscribed to push."),
	            this.mu(i, new Date(), t);
	        })
	        .catch((i) => {
	          Dt$1.isPushBlocked()
	            ? (b$1.info("Permission for push notifications was denied."),
	              "function" == typeof s && s(!1))
	            : (b$1.error("Push subscription failed: " + i),
	              "function" == typeof s && s(!0));
	        });
	  }
	  Du() {
	    if (this.nu) return navigator.serviceWorker.getRegistration(this.su);
	    const i = this.ru ? { scope: this.ru } : void 0;
	    return navigator.serviceWorker.register(this.su, i).then(() =>
	      navigator.serviceWorker.ready.then(
	        (i) => (
	          i &&
	            "function" == typeof i.update &&
	            i.update().catch((i) => {
	              b$1.info("ServiceWorker update failed: " + i);
	            }),
	          i
	        ),
	      ),
	    );
	  }
	  Su(i) {
	    this.nu ||
	      (i.unregister(), b$1.info("Service worker successfully unregistered."));
	  }
	  subscribe(i, e) {
	    if (!Dt$1.isPushSupported())
	      return b$1.info(na.Au), void ("function" == typeof e && e(!1));
	    if (this.au) {
	      if (!this.nu && null != window.location) {
	        let i = this.su;
	        -1 === i.indexOf(window.location.host) &&
	          (i = window.location.host + i),
	          -1 === i.indexOf(window.location.protocol) &&
	            (i = window.location.protocol + "//" + i);
	      }
	      if (Dt$1.isPushBlocked())
	        return void this.Pu(
	          "Notifications from this site are blocked. This may be a temporary embargo or a permanent denial.",
	          e,
	        );
	      if (this.h && !this.h.Wu() && 0 === this.h.Qt())
	        return (
	          b$1.info(
	            "Waiting for VAPID key from server config before subscribing to push.",
	          ),
	          void this.h.ju(() => {
	            this.subscribe(i, e);
	          })
	        );
	      const t = () => {
	          b$1.info("Permission for push notifications was denied."),
	            "function" == typeof e && e(!1);
	        },
	        s = () => {
	          let i = "Permission for push notifications was ignored.";
	          Dt$1.isPushBlocked() &&
	            (i +=
	              " The browser has automatically blocked further permission requests for a period (probably 1 week)."),
	            b$1.info(i),
	            "function" == typeof e && e(!0);
	        },
	        r = Dt$1.isPushPermissionGranted(),
	        o = () => {
	          !r &&
	            this.iu &&
	            this.iu.setPushNotificationSubscriptionType(
	              User.NotificationSubscriptionTypes.OPTED_IN,
	            ),
	            this.Nu(i, e);
	        };
	      this.requestPermission(o, s, t);
	    } else if (this.fu) {
	      if (null == this.ou || "" === this.ou)
	        return (
	          b$1.error(
	            "You must supply the safariWebsitePushId initialization option in order to use registerPush on Safari",
	          ),
	          void ("function" == typeof e && e(!0))
	        );
	      const t = window.safari.pushNotification.permission(this.ou);
	      this.ku(this.ou, t, i, e);
	    }
	  }
	  registerPush(i, e) {
	    if (!Dt$1.isPushSupported())
	      return b$1.info(na.Au), void ("function" == typeof e && e(!1));
	    if (this.au) {
	      if (Dt$1.isPushBlocked())
	        return void this.Pu(
	          "Notifications from this site are blocked. This may be a temporary embargo or a permanent denial.",
	          e,
	        );
	      if (this.h && !this.h.Wu() && 0 === this.h.Qt())
	        return (
	          b$1.info(
	            "Waiting for VAPID key from server config before registering push.",
	          ),
	          void this.h.ju(() => {
	            this.registerPush(i, e);
	          })
	        );
	      if (!Dt$1.isPushPermissionGranted())
	        return void b$1.info(
	          "Push permission has not been granted, so registerPush is a no-op. Call requestPushPermission to prompt the user for permission.",
	        );
	      this.Nu(i, e);
	    } else if (this.fu) {
	      if (null == this.ou || "" === this.ou)
	        return (
	          b$1.error(
	            "You must supply the safariWebsitePushId initialization option in order to use registerPush on Safari",
	          ),
	          void ("function" == typeof e && e(!0))
	        );
	      const t = window.safari.pushNotification.permission(this.ou);
	      "granted" === t.permission
	        ? this.ku(this.ou, t, i, e)
	        : "denied" === t.permission
	        ? this.Pu(
	            "The user has blocked notifications from this site, or Safari push is not configured in the Braze dashboard.",
	            e,
	          )
	        : b$1.info(
	            "Push permission has not been granted, so registerPush is a no-op. Call requestPushPermission to prompt the user for permission.",
	          );
	    }
	  }
	  Nu(i, e) {
	    this.Du()
	      .then((t) => {
	        if (null == t)
	          return (
	            b$1.error(
	              "No service worker registration. Set the `manageServiceWorkerExternally` initialization option to false or ensure that your service worker is registered before calling registerPush.",
	            ),
	            void ("function" == typeof e && e(!0))
	          );
	        t.pushManager
	          .getSubscription()
	          .then((r) => {
	            var o;
	            let n = null;
	            if (
	              (null !=
	                (null === (o = this.h) || void 0 === o ? void 0 : o.Wu()) &&
	                (n = oi.Tu(this.h.Wu())),
	              r)
	            ) {
	              let o,
	                u = null,
	                h = null;
	              if ((this.j && (o = this.j.St(STORAGE_KEYS.It.xu)), o && !isArray(o))) {
	                let i;
	                try {
	                  i = ui._u(o).Uu;
	                } catch (e) {
	                  i = null;
	                }
	                null == i ||
	                  isNaN(i.getTime()) ||
	                  0 === i.getTime() ||
	                  ((u = i), (h = new Date(u)), h.setMonth(u.getMonth() + 6));
	              }
	              null != n &&
	              r.options &&
	              r.options.applicationServerKey &&
	              r.options.applicationServerKey.byteLength &&
	              r.options.applicationServerKey.byteLength > 0 &&
	              !isEqual(n, new Uint8Array(r.options.applicationServerKey))
	                ? (r.options.applicationServerKey.byteLength > 12
	                    ? b$1.info(
	                        "Device was already subscribed to push using a different VAPID provider, creating new subscription.",
	                      )
	                    : b$1.info(
	                        "Attempting to upgrade a gcm_sender_id-based push registration to VAPID - depending on the browser this may or may not result in the same gcm_sender_id-based subscription.",
	                      ),
	                  this.pu(r, t, n, i, e))
	                : r.expirationTime &&
	                  new Date(r.expirationTime).valueOf() <= new Date().valueOf()
	                ? (b$1.info(
	                    "Push subscription is expired, creating new subscription.",
	                  ),
	                  this.pu(r, t, n, i, e))
	                : o && isArray(o)
	                ? this.pu(r, t, n, i, e)
	                : null == h
	                ? (b$1.info(
	                    "No push subscription creation date found, creating new subscription.",
	                  ),
	                  this.pu(r, t, n, i, e))
	                : h.valueOf() <= new Date().valueOf()
	                ? (b$1.info(
	                    "Push subscription older than 6 months, creating new subscription.",
	                  ),
	                  this.pu(r, t, n, i, e))
	                : (b$1.info(
	                    "Device already subscribed to push, sending existing subscription to backend.",
	                  ),
	                  this.mu(r, u, i));
	            } else this.bu(t, n, i, e);
	          })
	          .catch((i) => {
	            b$1.error("Error checking current push subscriptions: " + i);
	          });
	      })
	      .catch((i) => {
	        b$1.error("ServiceWorker registration failed: " + i);
	      });
	  }
	  unsubscribe(i, e) {
	    if (!Dt$1.isPushSupported())
	      return b$1.info(na.Au), void ("function" == typeof i && i());
	    this.au
	      ? navigator.serviceWorker.getRegistration(this.su).then((t) => {
	          t
	            ? t.pushManager
	                .getSubscription()
	                .then((s) => {
	                  s
	                    ? (this.vu(),
	                      s
	                        .unsubscribe()
	                        .then((s) => {
	                          s
	                            ? (b$1.info(
	                                "Device successfully unsubscribed from push.",
	                              ),
	                              "function" == typeof i && i())
	                            : (b$1.error(
	                                "Failed to unsubscribe device from push.",
	                              ),
	                              "function" == typeof e && e()),
	                            this.Su(t);
	                        })
	                        .catch((i) => {
	                          b$1.error("Push unsubscription error: " + i),
	                            "function" == typeof e && e();
	                        }))
	                    : (b$1.info("Device already unsubscribed from push."),
	                      "function" == typeof i && i());
	                })
	                .catch((i) => {
	                  b$1.error("Error unsubscribing from push: " + i),
	                    "function" == typeof e && e();
	                })
	            : (b$1.info("Device already unsubscribed from push."),
	              "function" == typeof i && i());
	        })
	      : this.fu &&
	        (this.vu(),
	        b$1.info("Device unsubscribed from push."),
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
	        r.zr(),
	        r.ja(),
	        r.ue(),
	        r.ht(),
	        r.er(U.za),
	        r.er(U.ba),
	        r.er(U.ha),
	        r.l(),
	        r.er(U.wa),
	        r.er(U.xa),
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

	function unregisterPushTokenOnServer() {
	  if (!r.rr()) return;
	  const e = r.m();
	  if (!e) return;
	  const t = r.p(),
	    n = null == t ? void 0 : t.St(STORAGE_KEYS.It.xu);
	  if (!n || "object" != typeof n || Array.isArray(n)) return;
	  const o = ui._u(n);
	  if (!o.endpoint) return;
	  const i = e.Z({}, !0);
	  i.push_token = o.endpoint;
	  const a = e.tt(i, h.it.ka);
	  e.et(
	    i,
	    (n = -1) => {
	      r.rr() &&
	        (h.nt(t, h.it.ka, new Date().valueOf()),
	        -1 !== n && a.push(["X-Braze-Req-Tokens-Remaining", n.toString()]),
	        l.ot({
	          url: `${e.ht()}/push/unregister`,
	          data: i,
	          headers: a,
	          lt: (r) => {
	            e.ut(i, r, a) && e.ct();
	          },
	        }));
	    },
	    h.it.ka,
	  );
	}

	function unregisterPush(e, n) {
	  if (r.rr()) return unregisterPushTokenOnServer(), ra$1.ra().unsubscribe(e, n);
	}

	var unregisterPush$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		unregisterPush: unregisterPush
	});

	function wipeData() {
	  const o = r.p();
	  if (null == o) return void b$1.warn(CoreStrings.ee);
	  o.clearData();
	  const t = keys(et._s);
	  for (let o = 0; o < t.length; o++) {
	    const n = t[o],
	      r = et._s[n];
	    new et(r, b$1).clearData();
	  }
	  if (r.rr()) for (const o of r.vr()) o.clearData(!0);
	  const n = r.m();
	  n && n.fo();
	}

	const logoutDependencies = {
	  unregisterPush: unregisterPush,
	  disableSDK: disableSDK,
	  wipeData: wipeData,
	};
	function logout(e, o) {
	  r.rr() &&
	    logoutDependencies.unregisterPush(
	      () => {
	        logoutDependencies.disableSDK(),
	          logoutDependencies.wipeData(),
	          "function" == typeof e && e();
	      },
	      () => {
	        "function" == typeof o && o();
	      },
	    );
	}

	const DD = [
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
	];
	function isValidIso4217CurrencyCode(D) {
	  return -1 !== DD.indexOf(D);
	}

	const CartUpdatedActions = {
	  REPLACE: "replace",
	  Ld: "add",
	  Md: "remove",
	};

	const ln = "log eCommerce event";
	function dn(n, t, e) {
	  if (null == n) {
	    if (!e) return;
	    return b$1.error(`Cannot ${ln} because ${t} must be a non-empty string.`), !1;
	  }
	  return "string" != typeof n || (e && n.length <= 0)
	    ? (b$1.error(
	        `Cannot ${ln} because ${t} must be a string${
          e ? "" : " when provided"
        }.`,
	      ),
	      !1)
	    : n.length > 255
	    ? (b$1.error(`Cannot ${ln} because ${t} must be at most 255 characters.`), !1)
	    : !!validateCustomString(n, ln, t) && n;
	}
	function mn(n, t) {
	  return "number" != typeof n || isNaN(n) || !isFinite(n)
	    ? (b$1.error(`Cannot ${ln} because ${t} must be a finite number.`), !1)
	    : n;
	}
	function pn(n, t) {
	  const e = mn(n, t);
	  return (
	    !1 !== e &&
	    (e < 0 ? (b$1.error(`Cannot ${ln} because ${t} must be at least 0.`), !1) : e)
	  );
	}
	const bn = /^[A-Za-z0-9\-_.,:;!?@#%&*()+={}[\]|\\/'`~^<>]+$/;
	function _n(n, t) {
	  return 0 === n.length || n.length > 255
	    ? (b$1.error(
	        `Cannot ${ln} because each ${t} key must be between 1 and 255 characters.`,
	      ),
	      !1)
	    : "$" === n.charAt(0)
	    ? (b$1.error(`Cannot ${ln} because ${t} keys cannot begin with "$".`), !1)
	    : !!bn.test(n) ||
	      (b$1.error(
	        `Cannot ${ln} because ${t} key "${n}" contains invalid characters.`,
	      ),
	      !1);
	}
	function yn(n, t, e) {
	  if (e > 50)
	    return b$1.error(`Cannot ${ln} because ${t} is nested too deeply.`), !1;
	  if (null == n || "object" != typeof n) return !0;
	  if (isArray(n)) {
	    const r = n;
	    for (let n = 0; n < r.length; n++) {
	      const u = r[n];
	      if ("string" == typeof u) {
	        if (u.length > 255)
	          return (
	            b$1.error(
	              `Cannot ${ln} because a ${t} string value exceeds 255 characters.`,
	            ),
	            !1
	          );
	      } else if (!yn(u, t, e + 1)) return !1;
	    }
	    return !0;
	  }
	  if (!isObject$1(n)) return !0;
	  const r = n;
	  for (const n in r) {
	    if (!Object.prototype.hasOwnProperty.call(r, n)) continue;
	    if (!_n(n, t)) return !1;
	    const u = r[n];
	    if ("string" == typeof u) {
	      if (u.length > 255)
	        return (
	          b$1.error(
	            `Cannot ${ln} because a ${t} string value exceeds 255 characters.`,
	          ),
	          !1
	        );
	    } else if (null != u && "object" == typeof u && !yn(u, t, e + 1)) return !1;
	  }
	  return !0;
	}
	function $n(n, t) {
	  if (!isArray(n))
	    return (
	      b$1.error(`Cannot ${ln} because ${t} must be an array of strings.`), !1
	    );
	  for (const e of n) if (!1 === dn(e, t, !0)) return !1;
	  return !0;
	}
	function vn(n, t) {
	  if (null == n) return;
	  const [e, r] = validateCustomProperties(n, CoreStrings.QE, "metadata", ln, t);
	  return !!e && !(null != r && !yn(r, t, 0)) && r;
	}
	function gn(n) {
	  if (null == n || "object" != typeof n || isArray(n))
	    return (
	      b$1.error(`Cannot ${ln} because each product must be an object.`), null
	    );
	  const t = n,
	    e = dn(t.product_id, "product_id", !0),
	    r = dn(t.product_name, "product_name", !0),
	    u = dn(t.variant_id, "variant_id", !0),
	    o = (function (n) {
	      if (!1 === mn(n, "product quantity")) return !1;
	      const t = parseInt(n.toString(), 10);
	      return t !== n
	        ? (b$1.error(`Cannot ${ln} because product quantity must be an integer.`),
	          !1)
	        : n < 0 || n > Number.MAX_SAFE_INTEGER
	        ? (b$1.error(
	            `Cannot ${ln} because product quantity must be between 0 and Number.MAX_SAFE_INTEGER.`,
	          ),
	          !1)
	        : t;
	    })(t.quantity),
	    c = pn(t.price, "product price");
	  if (!1 === e || !1 === r || !1 === u || !1 === o || !1 === c) return null;
	  const a = dn(t.image_url, "image_url", !1),
	    i = dn(t.product_url, "product_url", !1);
	  if (!1 === a || !1 === i) return null;
	  const s = vn(t.metadata, "eCommerce product metadata");
	  if (!1 === s) return null;
	  const l = {
	    product_id: e,
	    product_name: r,
	    variant_id: u,
	    quantity: o,
	    price: c,
	  };
	  return (
	    null != a && (l.image_url = a),
	    null != i && (l.product_url = i),
	    null != s && (l.metadata = s),
	    l
	  );
	}
	function Cn(n) {
	  if (null == n || !isArray(n))
	    return b$1.error(`Cannot ${ln} because products must be an array.`), null;
	  const t = [],
	    e = n;
	  for (const n of e) {
	    const e = gn(n);
	    if (null == e) return null;
	    t.push(e);
	  }
	  return t;
	}
	function jn(n) {
	  const t = (function (n) {
	      if (null == n || "string" != typeof n || n.length <= 0)
	        return (
	          b$1.error(`Cannot ${ln} because currency must be a non-empty string.`),
	          !1
	        );
	      const t = n.toUpperCase();
	      return isValidIso4217CurrencyCode(t)
	        ? t
	        : (b$1.error(
	            `${CoreStrings.QE} requires a valid ISO 4217 currency code, got "${n}". Ignoring event.`,
	          ),
	          !1);
	    })(n.currency),
	    e = dn(n.source, "source", !0);
	  return !1 === t || !1 === e ? null : { currency: t, source: e };
	}
	function hn(n, t) {
	  const e = ["subtotal_value", "tax", "shipping"];
	  for (const r of e)
	    if (null != t[r]) {
	      const e = pn(t[r], r);
	      if (!1 === e) return !1;
	      n[r] = e;
	    }
	  return !0;
	}
	function kn(n, t) {
	  const e = vn(t, "eCommerce event metadata");
	  return !1 !== e && (null != e && (n.metadata = e), !0);
	}
	function wn(n, t) {
	  return null == n || !1 !== dn(n, t, !1);
	}
	function qn(n) {
	  if (null == n || "object" != typeof n || isArray(n)) return !0;
	  const t = n;
	  if (!wn(t.country, "metadata.country")) return !1;
	  if (!wn(t.market_handle, "metadata.market_handle")) return !1;
	  if (null == t.presentment_currency) return !0;
	  if ("object" != typeof t.presentment_currency || isArray(t.presentment_currency))
	    return (
	      b$1.error(
	        `Cannot ${ln} because metadata.presentment_currency must be an object.`,
	      ),
	      !1
	    );
	  const e = t.presentment_currency;
	  if (!wn(e.price, "metadata.presentment_currency.price")) return !1;
	  if (null == e.code) return !0;
	  const r = dn(e.code, "metadata.presentment_currency.code", !1);
	  if ("string" != typeof r) return !1;
	  const u = r.toUpperCase();
	  return isValidIso4217CurrencyCode(u)
	    ? ((e.code = u), !0)
	    : (b$1.error(
	        `${CoreStrings.QE} requires a valid ISO 4217 currency code, got "${r}". Ignoring event.`,
	      ),
	      !1);
	}
	function En(n, t) {
	  const e = dn(n.cart_id, "cart_id", !0),
	    r =
	      null == n.action
	        ? CartUpdatedActions.REPLACE
	        : ((u = n.action),
	          !!validateValueIsFromEnum(
	            CartUpdatedActions,
	            u,
	            `Cannot ${ln} because action is invalid.`,
	            "CartUpdatedActions",
	          ) && u);
	  var u;
	  const o = Cn(n.products);
	  if (!1 === e || !1 === r || null == o) return null;
	  const c = r === CartUpdatedActions.Ld || r === CartUpdatedActions.Md,
	    a = null == n.total_value && c ? void 0 : pn(n.total_value, "total_value");
	  if (!1 === a) return null;
	  const i = {
	    cart_id: e,
	    action: r,
	    currency: t.currency,
	    products: o,
	    source: t.source,
	  };
	  return (
	    void 0 !== a && (i.total_value = a),
	    hn(i, n) && kn(i, n.metadata) ? i : null
	  );
	}
	function sanitizeEcommerceEvent(n) {
	  const t = n.properties;
	  if (null == t || "object" != typeof t || isArray(t))
	    return b$1.error(`${CoreStrings.QE} requires a properties object.`), null;
	  const e = t,
	    r = jn(e);
	  if (null == r) return null;
	  switch (n.name) {
	    case "ecommerce.product_viewed":
	      return (function (n, t) {
	        const e = n.metadata;
	        if (null != n.type && !$n(n.type, "type")) return null;
	        const r = dn(n.product_id, "product_id", !0),
	          u = dn(n.product_name, "product_name", !0),
	          o = dn(n.variant_id, "variant_id", !0),
	          c = pn(n.price, "price"),
	          a = dn(n.image_url, "image_url", !1),
	          i = dn(n.product_url, "product_url", !1);
	        if (
	          !1 === r ||
	          !1 === u ||
	          !1 === o ||
	          !1 === c ||
	          !1 === a ||
	          !1 === i
	        )
	          return null;
	        const s = {
	          product_id: r,
	          product_name: u,
	          variant_id: o,
	          price: c,
	          currency: t.currency,
	          source: t.source,
	        };
	        return (
	          null != a && (s.image_url = a),
	          null != i && (s.product_url = i),
	          null != n.type && (s.type = n.type),
	          kn(s, e) ? s : null
	        );
	      })(e, r);
	    case "ecommerce.cart_updated":
	      return En(e, r);
	    case "ecommerce.checkout_started":
	      return (function (n, t) {
	        const e = dn(n.checkout_id, "checkout_id", !0),
	          r = pn(n.total_value, "total_value"),
	          u = Cn(n.products),
	          o = dn(n.cart_id, "cart_id", !1);
	        if (!1 === e || !1 === r || null == u || !1 === o) return null;
	        const c = {
	          checkout_id: e,
	          total_value: r,
	          currency: t.currency,
	          products: u,
	          source: t.source,
	        };
	        return (
	          null != o && (c.cart_id = o),
	          hn(c, n) && qn(n.metadata) && kn(c, n.metadata) ? c : null
	        );
	      })(e, r);
	    case "ecommerce.order_placed":
	      return (function (n, t) {
	        const e = n.metadata;
	        if (null != e && "object" == typeof e && !isArray(e)) {
	          const n = e;
	          if (null != n.tags && !$n(n.tags, "metadata.tags")) return null;
	          if (
	            null != n.payment_gateway_names &&
	            !$n(n.payment_gateway_names, "metadata.payment_gateway_names")
	          )
	            return null;
	        }
	        const r = dn(n.order_id, "order_id", !0),
	          u = pn(n.total_value, "total_value"),
	          o = Cn(n.products),
	          c = dn(n.cart_id, "cart_id", !1);
	        if (!1 === r || !1 === u || null == o || !1 === c) return null;
	        const a = {
	          order_id: r,
	          total_value: u,
	          currency: t.currency,
	          products: o,
	          source: t.source,
	        };
	        if ((null != c && (a.cart_id = c), null != n.total_discounts)) {
	          const t = pn(n.total_discounts, "total_discounts");
	          if (!1 === t) return null;
	          a.total_discounts = t;
	        }
	        if (null != n.discounts) {
	          if (!isArray(n.discounts))
	            return (
	              b$1.error(`Cannot ${ln} because discounts must be an array.`), null
	            );
	          const [t, e] = validateCustomProperties(
	            { discounts: n.discounts },
	            CoreStrings.QE,
	            "discounts",
	            ln,
	            "eCommerce order discounts",
	          );
	          if (!t || null == e) return null;
	          a.discounts = e.discounts;
	        }
	        return hn(a, n) && qn(n.metadata) && kn(a, n.metadata) ? a : null;
	      })(e, r);
	    default:
	      return (
	        b$1.error(
	          "logEcommerceEvent received an unknown event name. Ignoring event.",
	        ),
	        null
	      );
	  }
	}

	function logEcommerceEvent(e) {
	  if (!r.rr()) return !1;
	  if (null == e || "object" != typeof e || null == e.name)
	    return (
	      b$1.error(
	        'logEcommerceEvent requires an event object with a "name" field.',
	      ),
	      !1
	    );
	  const o = sanitizeEcommerceEvent(e);
	  if (null == o) return !1;
	  const t = r.l();
	  if (t && t.$e(e.name))
	    return (
	      b$1.info(`The eCommerce event "${e.name}" is blocklisted, ignoring.`), !1
	    );
	  const n = v$1.Dt(p.CustomEvent, { n: e.name, p: o });
	  if (n.lt) {
	    b$1.info(`Logged eCommerce event "${e.name}".`);
	    for (const r of n.Ce) TriggersProviderFactory.o().Ee(ot.he, [e.name, e.properties], r);
	  }
	  return n.lt;
	}

	function logPurchase(e, o, i, n, t) {
	  if (!r.rr()) return !1;
	  if (
	    (null == i && (i = "USD"), null == n && (n = 1), null == e || e.length <= 0)
	  )
	    return (
	      b$1.error(
	        `logPurchase requires a non-empty productId, got "${e}", ignoring.`,
	      ),
	      !1
	    );
	  if (!validateCustomString(e, "log purchase", "the purchase name")) return !1;
	  if (null == o || isNaN(parseFloat(o.toString())))
	    return (
	      b$1.error(`logPurchase requires a numeric price, got ${o}, ignoring.`), !1
	    );
	  const s = parseFloat(o.toString()).toFixed(2);
	  if (null == n || isNaN(parseInt(n.toString())))
	    return (
	      b$1.error(`logPurchase requires an integer quantity, got ${n}, ignoring.`),
	      !1
	    );
	  const u = parseInt(n.toString());
	  if (u < 1 || u > MAX_PURCHASE_QUANTITY)
	    return (
	      b$1.error(
	        `logPurchase requires a quantity >1 and <${MAX_PURCHASE_QUANTITY}, got ${u}, ignoring.`,
	      ),
	      !1
	    );
	  if (((i = null != i ? i.toUpperCase() : i), !isValidIso4217CurrencyCode(i)))
	    return (
	      b$1.error(`logPurchase requires a valid currencyCode, got ${i}, ignoring.`),
	      !1
	    );
	  const [a, g] = validateCustomProperties(
	    t,
	    "logPurchase",
	    "purchaseProperties",
	    `log purchase "${e}"`,
	    "purchase",
	  );
	  if (!a) return !1;
	  const c = r.l();
	  if (c && c.$r(e))
	    return b$1.info(`Purchase "${e}" is blocklisted, ignoring.`), !1;
	  const l = v$1.Dt(p.Pr, { pid: e, c: i, p: s, q: u, pr: g });
	  if (l.lt) {
	    b$1.info(`Logged ${u} purchase${u > 1 ? "s" : ""} of "${e}" for ${i} ${s}.`);
	    for (const r of l.Ce) TriggersProviderFactory.o().Ee(ot.qr, [e, t], r);
	  }
	  return l.lt;
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
	  const t = et._s.Xs,
	    o = new et(t, b$1);
	  o.kr(t.Ws.yr, (r, n) => {
	    const e = n.lastClick,
	      s = n.trackingString;
	    b$1.info(`Firing push click trigger from ${s} push click at ${e}`);
	    const c = i.Fr(e, s),
	      g = function () {
	        TriggersProviderFactory.o().Ee(ot.Sr, [s], c);
	      };
	    i.Ar(g, g), o.ge(t.Ws.yr, r);
	  }),
	    o.Qs(t.Ws.Br, function (r) {
	      i.Dr(r);
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
	  b$1.setLogger(e);
	}

	function setSdkAuthenticationSignature(t) {
	  if (!r.rr()) return !1;
	  if ("" === t || !validateStandardString(t, "set signature", "signature", !1)) return !1;
	  const i = r.Er();
	  return !!i && (i.setSdkAuthenticationSignature(t), !0);
	}

	function subscribeToSdkAuthenticationFailures(i) {
	  var n;
	  if (r.rr())
	    return null === (n = r.Er()) || void 0 === n
	      ? void 0
	      : n.subscribeToSdkAuthenticationFailures(i);
	}

	function toggleLogging() {
	  b$1.toggleLogging();
	}

	function isPushBlocked() {
	  if (r.rr()) return Dt$1.isPushBlocked();
	}

	function isPushPermissionGranted() {
	  if (r.rr()) return Dt$1.isPushPermissionGranted();
	}

	function isPushSupported() {
	  if (r.rr()) return Dt$1.isPushSupported();
	}

	function registerPush(t, n) {
	  if (r.rr())
	    return ra$1.ra().registerPush((n, o, e) => {
	      const s = r.nn();
	      s && s.requestImmediateDataFlush(), "function" == typeof t && t(n, o, e);
	    }, n);
	}

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
	    b$1.info(`Property is not of type ${t}.`);
	  }
	  rp(t) {
	    b$1.info(`${t} not found in properties.`);
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
	  qt() {
	    const s = {};
	    return (
	      (s[FeatureFlag.bs.qs] = this.id),
	      (s[FeatureFlag.bs.Jr] = this.enabled),
	      (s[FeatureFlag.bs.Nr] = this.properties),
	      (s[FeatureFlag.bs.Or] = this.trackingString),
	      s
	    );
	  }
	}
	(FeatureFlag.bs = { qs: "id", Jr: "e", Nr: "pr", Or: "fts" }),
	  (FeatureFlag.ei = { qs: "id", Jr: "enabled", Nr: "properties", Or: "fts" });

	function newFeatureFlagFromJson(e) {
	  if (e[FeatureFlag.ei.qs] && "boolean" == typeof e[FeatureFlag.ei.Jr])
	    return new FeatureFlag(
	      e[FeatureFlag.ei.qs],
	      e[FeatureFlag.ei.Jr],
	      e[FeatureFlag.ei.Nr],
	      e[FeatureFlag.ei.Or],
	    );
	  b$1.info(`Unable to create feature flag from ${JSON.stringify(e, null, 2)}`);
	}
	function newFeatureFlagFromSerializedValue(e) {
	  if (e[FeatureFlag.bs.qs] && "boolean" == typeof e[FeatureFlag.bs.Jr])
	    return new FeatureFlag(
	      e[FeatureFlag.bs.qs],
	      e[FeatureFlag.bs.Jr],
	      e[FeatureFlag.bs.Nr],
	      e[FeatureFlag.bs.Or],
	    );
	  b$1.info(
	    `Unable to deserialize feature flag from ${JSON.stringify(e, null, 2)}`,
	  );
	}

	class ar extends t {
	  constructor(t, s, i, e) {
	    super(),
	      (this.h = t),
	      (this.B = s),
	      (this.j = i),
	      (this.C = e),
	      (this.Rr = []),
	      (this.Ur = 0),
	      (this.h = t),
	      (this.B = s),
	      (this.j = i),
	      (this.C = e),
	      (this.Xr = null),
	      (this.Gr = new f()),
	      (this.D = 10),
	      (this.N = null),
	      (this.F = null),
	      r.S(this.Gr);
	  }
	  q(t) {
	    var s;
	    if (
	      (null === (s = this.h) || void 0 === s ? void 0 : s.Kr()) &&
	      null != t &&
	      t.feature_flags
	    ) {
	      this.Rr = [];
	      for (const s of t.feature_flags) {
	        const t = newFeatureFlagFromJson(s);
	        t && this.Rr.push(t);
	      }
	      (this.Ur = new Date().getTime()), this.Lr(), this.Gr.A(this.Rr);
	    }
	  }
	  Qr() {
	    let t = {};
	    this.j && (t = this.j.St(STORAGE_KEYS.It.Vr));
	    const i = {};
	    for (const s in t) {
	      const e = newFeatureFlagFromSerializedValue(t[s]);
	      e && (i[e.id] = e);
	    }
	    return i;
	  }
	  Yr() {
	    var t;
	    return (
	      (null === (t = this.j) || void 0 === t ? void 0 : t.St(STORAGE_KEYS.It.Zr)) || {}
	    );
	  }
	  ho(t) {
	    this.j && this.j.Pt(STORAGE_KEYS.It.Zr, t);
	  }
	  Kt(t) {
	    return this.Gr.Ut(t);
	  }
	  refreshFeatureFlags(t, s, i = !1, e = !0, r = "sdk") {
	    const o = () => {
	      "function" == typeof s && s(), this.Gr.A(this.Rr);
	    };
	    if (!this.lo(i, r))
	      return (
	        !this.Xr &&
	          this.h &&
	          (this.Xr = this.h.do(() => {
	            this.refreshFeatureFlags(t, s, !1, !0, r);
	          })),
	        void o()
	      );
	    const n = this.B;
	    if (!n) return void o();
	    e && this.Y();
	    const u = n.Z({}, !0),
	      f = n.tt(u, h.it.vo, r);
	    let v = !1;
	    n.et(
	      u,
	      (e = -1) => {
	        const n = this.B;
	        if (!n) return void o();
	        const g = new Date().valueOf();
	        h.nt(this.j, h.it.vo, g),
	          -1 !== e && f.push(["X-Braze-Req-Tokens-Remaining", e.toString()]),
	          l.ot({
	            url: `${n.ht()}/feature_flags/sync`,
	            headers: f,
	            data: u,
	            lt: (s) => {
	              if (!n.ut(u, s, f)) return (v = !0), void o();
	              n.ct(), this.q(s), (v = !1), "function" == typeof t && t();
	            },
	            error: (t) => {
	              n.dt(t, "retrieving feature flags"), (v = !0), o();
	            },
	            ft: (e, o) => {
	              var l, u, f;
	              let g;
	              if (v) {
	                const t =
	                    (null === (l = this.h) || void 0 === l ? void 0 : l.vt()) ||
	                    REQUEST_BACKOFF_MIN_SLEEP_MS_DEFAULT,
	                  s =
	                    (null === (u = this.h) || void 0 === u ? void 0 : u.gt()) ||
	                    REQUEST_BACKOFF_SCALE_FACTOR_DEFAULT,
	                  i =
	                    (null === (f = this.h) || void 0 === f ? void 0 : f.bt()) ||
	                    REQUEST_BACKOFF_MAX_SLEEP_MS_DEFAULT;
	                let e = this.N;
	                (null == e || e < t) && (e = t), (g = Math.min(i, randomInclusive(t, e * s)));
	              }
	              n.yt(
	                o,
	                () => {
	                  this.refreshFeatureFlags(t, s, i, !0, r);
	                },
	                h.it.vo,
	                (t) => this.Bt(t),
	                () => this.Y(),
	                g,
	              );
	            },
	          });
	      },
	      h.it.vo,
	      s,
	    );
	  }
	  Y() {
	    null != this.F && (clearTimeout(this.F), (this.F = null));
	  }
	  Bt(t) {
	    this.Y(), (this.F = t);
	  }
	  lo(t, s = "sdk") {
	    if (!this.h) return !1;
	    if (!t && "dust" !== s) {
	      const t = this.h.Fo();
	      if (null == t) return !1;
	      let s = !1;
	      if (!isNaN(t)) {
	        if (-1 === t) return b$1.info("Feature flag refreshes not allowed"), !1;
	        s = new Date().getTime() >= (this.Ur || 0) + 1e3 * t;
	      }
	      if (!s)
	        return (
	          b$1.info(`Feature flag refreshes were rate limited to ${t} seconds`), !1
	        );
	    }
	    return this.h.Kr();
	  }
	  po() {
	    var t;
	    return (
	      (null === (t = this.j) || void 0 === t ? void 0 : t.St(STORAGE_KEYS.It.jo)) || null
	    );
	  }
	  wo() {
	    var t, i;
	    null === (t = this.j) ||
	      void 0 === t ||
	      t.Pt(STORAGE_KEYS.It.jo, null === (i = this.C) || void 0 === i ? void 0 : i.$t());
	  }
	  yo() {
	    var t;
	    const s = null === (t = this.C) || void 0 === t ? void 0 : t.$t(),
	      i = this.po();
	    return null == i || s === i;
	  }
	  Lr() {
	    if (!this.j) return;
	    const t = {};
	    for (const s of this.Rr) {
	      const i = s.qt();
	      t[s.id] = i;
	    }
	    this.j.Pt(STORAGE_KEYS.It.Vr, t), this.j.Pt(STORAGE_KEYS.It.bo, this.Ur), this.wo();
	  }
	  changeUser() {
	    this.Y();
	  }
	  clearData() {
	    this.Y();
	  }
	}

	const lr = {
	  i: !1,
	  provider: null,
	  o: () => (
	    lr.t(),
	    lr.provider ||
	      ((lr.provider = new ar(r.l(), r.m(), r.p(), r.u())),
	      r.v(lr.provider),
	      r.ar("ffr", () => {
	        var r;
	        null === (r = lr.provider) ||
	          void 0 === r ||
	          r.refreshFeatureFlags(void 0, void 0, !1, !0, "dust");
	      })),
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
	  if (e && !e.Kr()) return null;
	  const n = lr$1.o().Qr();
	  return n[t] ? n[t] : null;
	}

	function getAllFeatureFlags() {
	  if (!r.rr()) return;
	  const t = [],
	    e = r.l();
	  if (e && !e.Kr()) return t;
	  const n = lr$1.o().Qr();
	  for (const r in n) t.push(n[r]);
	  return t;
	}

	function subscribeToFeatureFlagsUpdates(t) {
	  if (!r.rr()) return;
	  const e = lr$1.o();
	  if (e.yo()) {
	    const r = getAllFeatureFlags();
	    r && "function" == typeof t && t(r);
	  }
	  return e.Kt(t);
	}

	function logFeatureFlagImpression(e) {
	  if (!r.rr()) return;
	  if (!e) return !1;
	  const t =
	      "Not logging a feature flag impression. The feature flag was not part of any matching experiment.",
	    o = lr$1.o().Qr();
	  if (!o[e]) return b$1.info(t), !1;
	  const n = o[e].trackingString;
	  if (!n) return b$1.info(t), !1;
	  const i = lr$1.o().Yr();
	  if (i[n])
	    return (
	      b$1.info(
	        "Not logging another feature flag impression. This ID was already logged this session.",
	      ),
	      !1
	    );
	  (i[n] = !0), lr$1.o().ho(i);
	  const s = { fid: e, fts: n };
	  return v$1.Dt(p.xo, s).lt;
	}

	class Banner extends PropertiesBase {
	  constructor(s, i, t, h = !1, r = !1, e = -1, n = {}, o = null) {
	    super(n),
	      (this.id = s),
	      (this.placementId = i),
	      (this.html = t),
	      (this.ss = h),
	      (this.isControl = r),
	      (this.ts = e),
	      (this.G = o),
	      (this.id = s),
	      (this.placementId = i),
	      (this.html = t),
	      (this.ss = h),
	      (this.isControl = r),
	      (this.ts = e),
	      (this.hs = !1),
	      (this.rs = !1),
	      (this.es = null);
	  }
	  subscribeToDismissedEvent(s) {
	    return this.ns().Ut(s);
	  }
	  removeSubscription(s) {
	    null != this.es && this.es.removeSubscription(s);
	  }
	  removeAllSubscriptions() {
	    null != this.es && this.es.removeAllSubscriptions();
	  }
	  os() {
	    return this.isControl;
	  }
	  ns() {
	    return null == this.es && (this.es = new f()), this.es;
	  }
	  Ft() {
	    return (
	      !this.rs &&
	      ((this.rs = !0), this.ns().A(), this.removeAllSubscriptions(), !0)
	    );
	  }
	  qt() {
	    return {
	      id: this.id,
	      pid: this.placementId,
	      html: this.html,
	      its: this.ss,
	      ic: this.isControl,
	      eat: this.ts,
	      pr: this.properties,
	      sk: this.G,
	    };
	  }
	}

	function newBannerFromSerializedValue(n) {
	  return new Banner(
	    n.id,
	    n.pid,
	    n.html,
	    n.its,
	    n.ic,
	    n.eat,
	    n.pr,
	    n.sk || null,
	  );
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
	    n.stable_key || null,
	  );
	}

	class e extends t {
	  constructor(t, s, i, e) {
	    super(),
	      (this.h = t),
	      (this.B = s),
	      (this.j = i),
	      (this.C = e),
	      (this.banners = {}),
	      (this.h = t),
	      (this.B = s),
	      (this.j = i),
	      (this.C = e),
	      (this.D = 10),
	      (this.N = null),
	      (this.F = null),
	      (this.R = new f()),
	      r.S(this.R),
	      (this.T = null),
	      (this.I = null);
	  }
	  q(t) {
	    if (this.P() && (this._(t), null != t && t.banners)) {
	      const s = t.request_time,
	        i = "number" != typeof s || isNaN(s) ? null : s,
	        e = this.k(),
	        r = this.$(),
	        o = this.L();
	      this.banners = {};
	      const h = t.banners;
	      for (const t in h) {
	        const s = this.K(t, i, o),
	          l = h[t];
	        let a = null;
	        if (
	          (null != l && null != l.banner && (a = l.banner),
	          this.U(t, a, i, s, e, r))
	        ) {
	          if (s) {
	            const s = e[t];
	            s && (this.banners[t] = s);
	          }
	          continue;
	        }
	        let u = null;
	        null != a && (u = newBannerFromJson(a)), u && (this.banners[t] = u);
	      }
	      this.W(), this.R.A(this.banners);
	    }
	  }
	  U(t, s, i, e, n, r) {
	    return !this.M(t, s, n) && null != i && (!!e || this.X(s, r, i));
	  }
	  K(t, s, i) {
	    if (null == s) return !1;
	    const e = i[t];
	    return "number" == typeof e && !isNaN(e) && s < e;
	  }
	  M(t, s, i) {
	    if (!s) return !1;
	    const e = s.stable_key;
	    if ("string" != typeof e || 0 === e.length) return !1;
	    const n = i[t],
	      r = null == n ? void 0 : n.G;
	    return "string" == typeof r && 0 !== r.length && r !== e;
	  }
	  X(t, s, i) {
	    if (!t) return !1;
	    const e = t.stable_key;
	    if ("string" != typeof e || 0 === e.length) return !1;
	    for (const t of s) {
	      if (t.stable_key !== e) continue;
	      const s = t.dismissal_time;
	      if ("number" == typeof s && !isNaN(s) && s >= i) return !0;
	    }
	    return !1;
	  }
	  _(t) {
	    var s;
	    const i =
	      null === (s = null == t ? void 0 : t.dismissals) || void 0 === s
	        ? void 0
	        : s.acknowledged;
	    if (!i || !isArray(i) || 0 === i.length) return;
	    const e = this.$();
	    if (0 === e.length) return;
	    const n = {};
	    for (const t of i)
	      t.banner_id &&
	        t.dismissal_time &&
	        (n[this.H(t.banner_id, t.dismissal_time)] = !0);
	    const r = e.filter((t) => !n[this.H(t.banner_id, t.dismissal_time)]);
	    r.length !== e.length && this.J(r);
	  }
	  H(t, s) {
	    return `${t}:${s}`;
	  }
	  O(t, s, i, e = !0) {
	    var n;
	    const r = () => {
	      "function" == typeof i && i();
	    };
	    if (!this.P())
	      return void (
	        null === (n = this.h) ||
	        void 0 === n ||
	        n.V(() => {
	          this.O(t, s, i);
	        })
	      );
	    const o = this.B;
	    if (!o) return void r();
	    e && this.Y();
	    const u = o.Z({}, !0);
	    u.time_ms = new Date().valueOf();
	    const f = [];
	    for (const s of t) f.push({ id: s });
	    u.placements = f;
	    const v = this.$().map((t) => ({
	      banner_id: t.banner_id,
	      dismissal_time: t.dismissal_time,
	    }));
	    u.pending_dismissals = v;
	    const p = o.tt(u, h.it.st);
	    let g = !1;
	    o.et(
	      u,
	      (e = -1) => {
	        const n = this.B;
	        if (!n) return void r();
	        const o = new Date().valueOf();
	        h.nt(this.j, h.it.st, o),
	          -1 !== e && p.push(["X-Braze-Req-Tokens-Remaining", e.toString()]);
	        const f = u.time_ms;
	        null == f || "number" != typeof f || isNaN(f) || this.rt(t, f),
	          l.ot({
	            url: `${n.ht()}/banners/sync`,
	            headers: p,
	            data: u,
	            lt: (t) => {
	              if (!n.ut(u, t, p)) return (g = !0), void r();
	              n.ct(), this.q(t), (g = !1), "function" == typeof s && s();
	            },
	            error: (t) => {
	              n.dt(t, "retrieving banners"), (g = !0), r();
	            },
	            ft: (e, r) => {
	              var o, l, u;
	              let f;
	              if (((this.I = t), g)) {
	                const t =
	                    (null === (o = this.h) || void 0 === o ? void 0 : o.vt()) ||
	                    REQUEST_BACKOFF_MIN_SLEEP_MS_DEFAULT,
	                  s =
	                    (null === (l = this.h) || void 0 === l ? void 0 : l.gt()) ||
	                    REQUEST_BACKOFF_SCALE_FACTOR_DEFAULT,
	                  i =
	                    (null === (u = this.h) || void 0 === u ? void 0 : u.bt()) ||
	                    REQUEST_BACKOFF_MAX_SLEEP_MS_DEFAULT;
	                let e = this.N;
	                (null == e || e < t) && (e = t), (f = Math.min(i, randomInclusive(t, e * s)));
	              }
	              n.yt(
	                r,
	                () => {
	                  this.O(t, s, i, !1);
	                },
	                h.it.st,
	                (t) => this.Bt(t),
	                () => this.Y(),
	                f,
	              );
	            },
	          });
	      },
	      h.it.st,
	      i,
	    );
	  }
	  jt() {
	    return this.I;
	  }
	  Ct(t, s) {
	    const i = { id: t.id };
	    s && (i.bid = s);
	    return v$1.Dt(p.Nt, i).lt;
	  }
	  wt(t) {
	    if (!t.G) return !1;
	    const s = this.$();
	    if (s.some((s) => s.banner_id === t.id && s.stable_key === t.G))
	      return (
	        b$1.info(
	          `Not dismissing banner ID ${t.id}. The banner has already been dismissed.`,
	        ),
	        !1
	      );
	    const i = { id: t.id },
	      e = this.k(),
	      n = e[t.placementId];
	    n &&
	      n.G === t.G &&
	      (delete e[t.placementId],
	      (this.banners = e),
	      this.W(),
	      this.R.A(this.banners)),
	      s.push({
	        banner_id: t.id,
	        dismissal_time: new Date().valueOf(),
	        stable_key: t.G,
	      }),
	      this.J(s),
	      t.Ft();
	    return v$1.Dt(p.Rt, i).lt;
	  }
	  Y() {
	    null != this.F && (clearTimeout(this.F), (this.F = null));
	  }
	  Bt(t) {
	    this.Y(), (this.F = t);
	  }
	  k() {
	    let t = {};
	    this.j && (t = this.j.St(STORAGE_KEYS.It.Tt));
	    const i = {};
	    for (const s in t) {
	      let e = null;
	      null != t[s] && (e = newBannerFromSerializedValue(t[s])), e && (i[e.placementId] = e);
	    }
	    return i;
	  }
	  W() {
	    var t;
	    if (!this.j) return;
	    const i = {};
	    for (const s in this.banners) {
	      const e =
	        (null === (t = this.banners[s]) || void 0 === t ? void 0 : t.qt()) ||
	        null;
	      i[s] = e;
	    }
	    this.j.Pt(STORAGE_KEYS.It.Tt, i), this._t();
	  }
	  _t() {
	    var t, i;
	    null === (t = this.j) ||
	      void 0 === t ||
	      t.Pt(STORAGE_KEYS.It.kt, null === (i = this.C) || void 0 === i ? void 0 : i.$t());
	  }
	  xt() {
	    var t;
	    return (
	      (null === (t = this.j) || void 0 === t ? void 0 : t.St(STORAGE_KEYS.It.kt)) || null
	    );
	  }
	  Et() {
	    return this.T;
	  }
	  Lt(t) {
	    this.T = t;
	  }
	  zt() {
	    var t;
	    const s = null === (t = this.C) || void 0 === t ? void 0 : t.$t(),
	      i = this.xt();
	    return null == i || s === i;
	  }
	  Kt(t) {
	    return this.R.Ut(t);
	  }
	  Wt() {
	    var t;
	    return (
	      (null === (t = this.j) || void 0 === t ? void 0 : t.St(STORAGE_KEYS.It.At)) || {}
	    );
	  }
	  Mt(t) {
	    this.j && this.j.Pt(STORAGE_KEYS.It.At, t);
	  }
	  $() {
	    var t;
	    return (
	      (null === (t = this.j) || void 0 === t ? void 0 : t.St(STORAGE_KEYS.It.Xt)) || []
	    );
	  }
	  J(t) {
	    var i;
	    if (!this.j) return;
	    const e = null === (i = this.h) || void 0 === i ? void 0 : i.Gt(),
	      n = null != e ? e : DISMISSALS_CACHE_SIZE_DEFAULT,
	      r = t.length <= n ? t : t.slice(-n);
	    this.j.Pt(STORAGE_KEYS.It.Xt, r);
	  }
	  L() {
	    var t;
	    return (
	      (null === (t = this.j) || void 0 === t ? void 0 : t.St(STORAGE_KEYS.It.Ht)) || {}
	    );
	  }
	  rt(t, i) {
	    if (!this.j) return;
	    const e = this.L();
	    for (const s of t) e[s] = i;
	    this.j.Pt(STORAGE_KEYS.It.Ht, e);
	  }
	  changeUser() {
	    this.Jt(), this.Y();
	  }
	  clearData() {
	    this.Y();
	  }
	  P() {
	    return !!this.h && (!!this.h.Ot() || (0 !== this.h.Qt() && this.Jt(), !1));
	  }
	  Jt() {
	    (this.banners = {}),
	      this.j &&
	        (this.j.Vt(STORAGE_KEYS.It.Tt),
	        this.j.Vt(STORAGE_KEYS.It.At),
	        this.j.Vt(STORAGE_KEYS.It.Xt),
	        this.j.Vt(STORAGE_KEYS.It.Ht)),
	      this.R.A({});
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
	  const t = e.ts,
	    o = new Date().valueOf();
	  return -1 !== t && 1e3 * t < o
	    ? (b$1.info(`Banner with ID: ${e.id} and placement ID: ${r} has expired.`),
	      null)
	    : e;
	}
	function getBanner(n) {
	  var e;
	  if (!r.rr()) return;
	  !1 === (null === (e = r.l()) || void 0 === e ? void 0 : e.Ot()) &&
	    b$1.error(BannerStrings.aa);
	  const t = i.o();
	  if (!t.P()) return null;
	  return getBannerIfNotExpired(t.k(), n);
	}

	function logBannerClick(n, o) {
	  if (!r.rr()) return;
	  if (!(n instanceof Banner))
	    return (
	      b$1.error("Banner argument to logBannerClick must be an Banner object."), !1
	    );
	  const e = i.o(),
	    t = e.k();
	  return 0 === keys(t).length
	    ? (b$1.info("Not logging banner click. No banners exist."), !1)
	    : t[n.placementId]
	    ? e.Ct(n, o)
	    : (b$1.info(
	        `Not logging banner click for ID ${n.placementId}. The placement ID did not correspond to any banner.`,
	      ),
	      !1);
	}

	function logBannerDismissal(n) {
	  if (!r.rr()) return;
	  if (!(n instanceof Banner))
	    return (
	      b$1.error("Banner argument to logBannerDismissal must be a Banner object."),
	      !1
	    );
	  const o = i.o(),
	    e = o.k();
	  return 0 === keys(e).length
	    ? (b$1.info("Not logging banner dismissal. No banners exist."), !1)
	    : e[n.placementId]
	    ? o.wt(n)
	    : (b$1.info(
	        `Not logging banner dismissal for ID ${n.placementId}. The placement ID did not correspond to any banner.`,
	      ),
	      !1);
	}

	function destroyBannerHtml(o) {
	  const r = o.getAttribute(BannerStrings.ea);
	  null != r && removeSubscription(r),
	    o && o.parentNode && o.parentNode.removeChild(o);
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
	  if (n.os()) return controlBannerToHtml(n);
	  const o = document.createElement("iframe");
	  return (
	    (o.id = n.id),
	    t && o.setAttribute("nonce", t),
	    (o.className = "ab-html-banner"),
	    o.setAttribute(BANNER_PLACEMENT_ID, n.placementId),
	    o.setAttribute("title", "Banner"),
	    attachHtmlToIframeWithNonce(o, n.html, t),
	    (o.onload = () => {
	      const t = o.contentWindow,
	        e = t.document.getElementsByTagName("title");
	      e && e.length > 0 && o.setAttribute("title", e[0].textContent || "");
	      const r = Object.assign(Object.assign({}, buildBrazeBridge(o)), {
	        logClick: function () {
	          logBannerClick(n, ...arguments);
	        },
	        closeMessage: function () {
	          !(function (n) {
	            const t = document.getElementById(n.id);
	            t && destroyBannerHtml(t), logBannerDismissal(n);
	          })(n);
	        },
	        setBannerHeight: (n) => {
	          isNaN(n) || !isFinite(n) || n < 0
	            ? b$1.warn(`Invalid banner height: ${n}`)
	            : (o.style.height = `${n}px`);
	        },
	      });
	      (t.brazeBridge = r),
	        (t.appboyBridge = r),
	        t.dispatchEvent(new CustomEvent("ab.BridgeReady"));
	    }),
	    o
	  );
	}

	function logBannerImpressions(o) {
	  if (!r.rr()) return;
	  if (!o || o.length <= 0) return !1;
	  const n = i.o(),
	    s = n.k();
	  if (0 === keys(s).length)
	    return b$1.info("Not logging banners impression. No banners exist."), !1;
	  let e = n.Wt(),
	    t = !1;
	  if (Object.keys(e).some((o) => void 0 !== s[o])) {
	    const o = {};
	    for (const n of Object.keys(e)) {
	      const r = s[n];
	      r && e[n] && (o[r.id] = !0);
	    }
	    (e = o), (t = !0);
	  }
	  const a = [];
	  for (const n of o) {
	    const o = s[n];
	    o
	      ? e[o.id]
	        ? b$1.info(
	            `Not logging banners impression for ID ${n}. This ID was already logged this session.`,
	          )
	        : ((e[o.id] = !0), a.push(o.id))
	      : b$1.info(
	          `Not logging banners impression for ID ${n}. The placement ID did not correspond to any banner.`,
	        );
	  }
	  if (0 === a.length) return t && n.Mt(e), !1;
	  n.Mt(e);
	  const f = { ids: a };
	  return v$1.Dt(p.ro, f).lt;
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
	    (!1 === (null == o ? void 0 : o.Ot()) && b$1.error(BannerStrings.aa),
	    !(null == o ? void 0 : o.Ot()))
	  )
	    return n;
	  const t = i.o().k();
	  for (const r in t) n[r] = getBannerIfNotExpired(t, r);
	  return n;
	}

	function subscribeToBannersUpdates(n) {
	  var o;
	  if (!r.rr()) return;
	  const t = i.o();
	  if (t.zt()) {
	    const r = getAllBanners();
	    r && "function" == typeof n && n(r);
	  }
	  const s = t.Kt(n);
	  if (!t.Et()) {
	    const n =
	      null === (o = r.nn()) || void 0 === o
	        ? void 0
	        : o.rn(() => {
	            const n = t.jt();
	            n && n.length > 0 && t.O(n);
	          });
	    n && t.Lt(n);
	  }
	  return s;
	}

	function insertBanner(e, n) {
	  if (!r.rr()) return;
	  if (!e) return void b$1.error("Not inserting banner: banner was not provided.");
	  if (!n)
	    return void b$1.error("Not inserting banner: parentNode was not provided.");
	  if (!r.er(U.nr))
	    return void b$1.error(
	      "Banners are disabled. Use the 'allowUserSuppliedJavascript' option for braze.initialize to enable these messages.",
	    );
	  setupBannerUI();
	  const o = bannerToHtml(e, r.er(U.sr)),
	    s = subscribeToBannersUpdates((s) => {
	      const i = s[e.placementId];
	      i ? n.replaceChildren(bannerToHtml(i, r.er(U.sr))) : destroyBannerHtml(o);
	    });
	  s && o.setAttribute(BannerStrings.ea, s),
	    n.replaceChildren(o),
	    addPassiveEventListener(window, "scroll", detectBannerImpressions),
	    detectBannerImpressions();
	}

	function requestBannersRefresh(e, t, o) {
	  if (!r.rr()) return void b$1.warn(CoreStrings.ee);
	  const n = r.l();
	  if (!n) return;
	  if (!isArray(e) || 0 === e.length)
	    return void b$1.warn("placementIds should be a non-empty array.");
	  const s = i.o();
	  if ((!1 === n.Ot() && b$1.error(BannerStrings.aa), !s.P()))
	    return void n.V(() => {
	      requestBannersRefresh(e, t, o);
	    });
	  const a = n.re();
	  e.length > a &&
	    (b$1.warn(
	      `Number of placement IDs requested exceeds the max allowed. Trimming placementIds array from length ${e.length} to ${a} (max allowed).`,
	    ),
	    (e = e.slice(0, a))),
	    0 !==
	      (e = e.filter(
	        (e) =>
	          !!isValidBannerPlacementId(e) ||
	          (b$1.warn(
	            `Placement ID should be a valid utf8 string with no whitespaces, filtering out: ${e}`,
	          ),
	          !1),
	      )).length &&
	      (b$1.info(`Requesting banners for placement IDs: ${JSON.stringify(e)}`),
	      s.O(e, t, o));
	}

	function dismissBanner(n) {
	  return logBannerDismissal(n);
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
		logout: logout,
		logEcommerceEvent: logEcommerceEvent,
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
		registerPush: registerPush,
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
		logBannerClick: logBannerClick,
		dismissBanner: dismissBanner
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
	    version = "3.2.0",
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
	    var useEcommerceRecommendedEvents = false;

	    var RECOMMENDED_ECOMMERCE_SOURCE = 'web';
	    var RECOMMENDED_CART_UPDATED_EVENT_NAME = 'ecommerce.cart_updated';
	    var RECOMMENDED_CHECKOUT_STARTED_EVENT_NAME = 'ecommerce.checkout_started';
	    var RECOMMENDED_PRODUCT_VIEWED_EVENT_NAME = 'ecommerce.product_viewed';
	    var RECOMMENDED_ORDER_PLACED_EVENT_NAME = 'ecommerce.order_placed';
	    var RECOMMENDED_ORDER_REFUNDED_EVENT_NAME = 'ecommerce.order_refunded';
	    var RECOMMENDED_IMAGE_URL_ATTRIBUTES = ['image_url', 'Image URL'];
	    var RECOMMENDED_PRODUCT_URL_ATTRIBUTES = ['product_url', 'Product URL'];
	    var RECOMMENDED_CART_ID_ATTRIBUTE = 'cart_id';
	    var RECOMMENDED_CHECKOUT_ID_ATTRIBUTE = 'checkout_id';
	    var RECOMMENDED_SUBTOTAL_VALUE_ATTRIBUTE = 'subtotal_value';
	    // Attribute-name overrides from the connection settings. Each is the
	    // customer-configured attribute that holds the value, or null when
	    // unconfigured, in which case the defaults above are used.
	    var mappedCartIdAttribute = null;
	    var mappedCheckoutIdAttribute = null;
	    var mappedImageUrlAttribute = null;
	    var mappedProductUrlAttribute = null;
	    var mappedSubtotalValueAttribute = null;

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

	    // The Braze Web SDK only exposes logEcommerceEvent in v6.8.0+. Guard against
	    // older host SDKs so we can fall back to legacy forwarding when unsupported.
	    function recommendedEcommerceEventsSupported() {
	        return typeof braze.logEcommerceEvent === 'function';
	    }

	    // The forwarder event carries the session id, so prefer it over reaching for a
	    // global: it needs no feature detection and works on every core SDK version.
	    //
	    // The previous implementation relied on mParticle.getSession(), which is not
	    // exposed on the global object by any core version (verified on 2.23.0 and
	    // 2.75.0), so the lookup silently returned null and every cart/checkout fell
	    // back to a freshly generated id, leaving Braze unable to correlate a cart
	    // across add/remove/checkout/order. mParticle.sessionManager.getSession() is
	    // the supported public accessor, kept here only as a secondary fallback.
	    function getSessionIdForBraze(event) {
	        if (event && event.SessionId) {
	            return String(event.SessionId);
	        }
	        try {
	            if (
	                mParticle &&
	                mParticle.sessionManager &&
	                typeof mParticle.sessionManager.getSession === 'function'
	            ) {
	                return mParticle.sessionManager.getSession();
	            }
	        } catch (e) {
	            // no-op: session id is a best-effort fallback
	        }
	        return null;
	    }

	    function generateEcommerceId() {
	        if (
	            typeof window !== 'undefined' &&
	            window.crypto &&
	            typeof window.crypto.randomUUID === 'function'
	        ) {
	            return window.crypto.randomUUID();
	        }
	        return (
	            'mp-' +
	            new Date().getTime() +
	            '-' +
	            Math.floor(Math.random() * 1000000000)
	        );
	    }

	    // Attribute-mapping settings are "custom JSON" (setting data type 7). The config
	    // API delivers them with the quotes HTML-escaped, so they must be decoded before
	    // parsing (same as decodeSubscriptionGroupMappings, decodeClusterSetting and the
	    // consent mapping):
	    //   [{&quot;jsmap&quot;:null,&quot;map&quot;:null,
	    //     &quot;maptype&quot;:&quot;EventAttributeClass.Name&quot;,
	    //     &quot;value&quot;:&quot;attr_name&quot;}]
	    //
	    // maptype varies by what the setting selects (EventAttributeClass.Name for the
	    // cart/checkout/subtotal settings, ProductAttributeSelector.Name for the URL
	    // ones) and is deliberately ignored: the settings are single-select, so the
	    // first entry with a value is the mapping. This matches the iOS kit and avoids
	    // maptype strings drifting out of sync with the platform.
	    //
	    // Never throws: a malformed setting must not break event forwarding.
	    function getMappedAttributeName(settingValue) {
	        if (!settingValue) {
	            return null;
	        }
	        // No-op when the value is already unescaped, so both shapes work.
	        var decodedSetting = settingValue.replace(/&quot;/g, '"');
	        try {
	            var mappings = JSON.parse(decodedSetting);
	            if (!Array.isArray(mappings)) {
	                return null;
	            }
	            for (var i = 0; i < mappings.length; i++) {
	                var mapping = mappings[i];
	                if (
	                    mapping &&
	                    typeof mapping.value === 'string' &&
	                    mapping.value !== ''
	                ) {
	                    return mapping.value;
	                }
	            }
	            return null;
	        } catch (e) {
	            // Deliberately stricter than the iOS kit, which treats an unparseable
	            // setting as a plain attribute name. The config API always sends the
	            // JSON array form, so a string that does not parse is malformed rather
	            // than a bare name, and returning null keeps the documented default
	            // attribute in play instead of looking up a garbage key.
	            kitLogger(
	                'Braze kit could not parse attribute mapping setting',
	                settingValue
	            );
	            return null;
	        }
	    }

	    function getEcommerceCustomAttribute(event, key) {
	        var attributes = event.EventAttributes || {};
	        if (attributes[key] != null && attributes[key] !== '') {
	            return String(attributes[key]);
	        }
	        return null;
	    }

	    function getRecommendedCartId(event) {
	        // Fall back to the mParticle session id, then a generated id, matching the
	        // Android and iOS kits (a missing session id is unlikely but possible).
	        return (
	            getEcommerceCustomAttribute(
	                event,
	                mappedCartIdAttribute || RECOMMENDED_CART_ID_ATTRIBUTE
	            ) ||
	            getSessionIdForBraze(event) ||
	            generateEcommerceId()
	        );
	    }

	    function getRecommendedCheckoutId(event) {
	        return (
	            getEcommerceCustomAttribute(
	                event,
	                mappedCheckoutIdAttribute || RECOMMENDED_CHECKOUT_ID_ATTRIBUTE
	            ) ||
	            getSessionIdForBraze(event) ||
	            generateEcommerceId()
	        );
	    }

	    function getRecommendedOrderId(event) {
	        if (event.ProductAction && event.ProductAction.TransactionId) {
	            return String(event.ProductAction.TransactionId);
	        }
	        return getSessionIdForBraze(event) || generateEcommerceId();
	    }

	    function getRecommendedProductList(event) {
	        if (event.ProductAction && event.ProductAction.ProductList) {
	            return event.ProductAction.ProductList;
	        }
	        return [];
	    }

	    // Product quantity is a count, so coerce to an integer >= 1 (mirrors the
	    // Android kit's toLong().coerceAtLeast(1)).
	    function getRecommendedQuantity(product) {
	        var quantity = parseInt(product.Quantity, 10);
	        if (isNaN(quantity) || quantity < 1) {
	            quantity = 1;
	        }
	        return quantity;
	    }

	    function getRecommendedTotalValue(event) {
	        if (
	            event.ProductAction &&
	            event.ProductAction.TotalAmount != null &&
	            event.ProductAction.TotalAmount !== ''
	        ) {
	            return parseFloat(event.ProductAction.TotalAmount) || 0;
	        }
	        var total = 0;
	        getRecommendedProductList(event).forEach(function(product) {
	            total +=
	                (parseFloat(product.Price) || 0) *
	                getRecommendedQuantity(product);
	        });
	        return total;
	    }

	    function getRecommendedTotalDiscounts(event) {
	        var value = getEcommerceCustomAttribute(event, 'total_discounts');
	        if (value == null) {
	            return null;
	        }
	        var parsed = parseFloat(value);
	        return isNaN(parsed) ? null : parsed;
	    }

	    function parseRecommendedFloat(value) {
	        if (value == null || value === '') {
	            return null;
	        }
	        var parsed = parseFloat(value);
	        return isNaN(parsed) ? null : parsed;
	    }

	    function getRecommendedTax(event) {
	        return parseRecommendedFloat(
	            event.ProductAction && event.ProductAction.TaxAmount
	        );
	    }

	    function getRecommendedShipping(event) {
	        return parseRecommendedFloat(
	            event.ProductAction && event.ProductAction.ShippingAmount
	        );
	    }

	    // mParticle has no native subtotal field, so subtotal_value is sourced from a
	    // `subtotal_value` commerce custom attribute (like cart_id/total_discounts).
	    function getRecommendedSubtotalValue(event) {
	        return parseRecommendedFloat(
	            getEcommerceCustomAttribute(
	                event,
	                mappedSubtotalValueAttribute ||
	                    RECOMMENDED_SUBTOTAL_VALUE_ATTRIBUTE
	            )
	        );
	    }

	    // tax, shipping, and subtotal_value are optional recognized top-level attributes
	    // on cart_updated/checkout_started/order_placed. Set only when present.
	    function applyRecommendedMonetaryAttributes(properties, event) {
	        var tax = getRecommendedTax(event);
	        if (tax != null) {
	            properties.tax = tax;
	        }
	        var shipping = getRecommendedShipping(event);
	        if (shipping != null) {
	            properties.shipping = shipping;
	        }
	        var subtotalValue = getRecommendedSubtotalValue(event);
	        if (subtotalValue != null) {
	            properties.subtotal_value = subtotalValue;
	        }
	    }

	    // product_viewed and order_refunded have no recognized top-level tax/shipping/
	    // subtotal_value fields, so when present these are preserved in metadata rather
	    // than dropped.
	    function buildRecommendedMonetaryMetadata(event) {
	        var metadata = {};
	        var tax = getRecommendedTax(event);
	        if (tax != null) {
	            metadata.tax = tax;
	        }
	        var shipping = getRecommendedShipping(event);
	        if (shipping != null) {
	            metadata.shipping = shipping;
	        }
	        var subtotalValue = getRecommendedSubtotalValue(event);
	        if (subtotalValue != null) {
	            metadata.subtotal_value = subtotalValue;
	        }
	        return metadata;
	    }

	    function getRecommendedVariantId(product) {
	        return String(product.Variant || product.Sku);
	    }

	    // A configured attribute name takes precedence over the built-in defaults, and
	    // is also excluded from metadata so a promoted value is not emitted twice.
	    function getRecommendedImageUrlAttributes() {
	        return mappedImageUrlAttribute
	            ? [mappedImageUrlAttribute].concat(RECOMMENDED_IMAGE_URL_ATTRIBUTES)
	            : RECOMMENDED_IMAGE_URL_ATTRIBUTES;
	    }

	    function getRecommendedProductUrlAttributes() {
	        return mappedProductUrlAttribute
	            ? [mappedProductUrlAttribute].concat(
	                  RECOMMENDED_PRODUCT_URL_ATTRIBUTES
	              )
	            : RECOMMENDED_PRODUCT_URL_ATTRIBUTES;
	    }

	    function getRecommendedPromotedEventAttributes(eventCategory) {
	        var cartIdAttribute =
	            mappedCartIdAttribute || RECOMMENDED_CART_ID_ATTRIBUTE;
	        var checkoutIdAttribute =
	            mappedCheckoutIdAttribute || RECOMMENDED_CHECKOUT_ID_ATTRIBUTE;
	        var subtotalValueAttribute =
	            mappedSubtotalValueAttribute ||
	            RECOMMENDED_SUBTOTAL_VALUE_ATTRIBUTE;

	        switch (eventCategory) {
	            case CommerceEventType.ProductAddToCart:
	            case CommerceEventType.ProductRemoveFromCart:
	                return [cartIdAttribute, subtotalValueAttribute];
	            case CommerceEventType.ProductCheckout:
	                return [
	                    checkoutIdAttribute,
	                    cartIdAttribute,
	                    subtotalValueAttribute,
	                ];
	            case CommerceEventType.ProductViewDetail:
	                return [subtotalValueAttribute];
	            case CommerceEventType.ProductPurchase:
	                return [
	                    cartIdAttribute,
	                    'total_discounts',
	                    subtotalValueAttribute,
	                ];
	            case CommerceEventType.ProductRefund:
	                return ['total_discounts', subtotalValueAttribute];
	            default:
	                return [];
	        }
	    }

	    function getRecommendedProductAttribute(product, keys) {
	        var attributes = product.Attributes || {};
	        for (var i = 0; i < keys.length; i++) {
	            var value = attributes[keys[i]];
	            if (value != null && value !== '') {
	                return String(value);
	            }
	        }
	        return null;
	    }

	    function emptyObjectToUndefined(obj) {
	        return obj && Object.keys(obj).length ? obj : undefined;
	    }

	    function buildRecommendedProductMetadata(product) {
	        var metadata = {};
	        if (product.Brand) {
	            metadata.brand = product.Brand;
	        }
	        if (product.Category) {
	            metadata.category = product.Category;
	        }
	        if (product.CouponCode) {
	            metadata.coupon_code = product.CouponCode;
	        }
	        if (product.Position != null) {
	            metadata.position = product.Position;
	        }
	        metadata.sku = product.Sku;
	        var attributes = product.Attributes || {};
	        Object.keys(attributes).forEach(function(key) {
	            if (
	                getRecommendedImageUrlAttributes().indexOf(key) === -1 &&
	                getRecommendedProductUrlAttributes().indexOf(key) === -1 &&
	                attributes[key] != null &&
	                attributes[key] !== ''
	            ) {
	                metadata[key] = attributes[key];
	            }
	        });
	        return metadata;
	    }

	    function buildRecommendedEventMetadata(event) {
	        var metadata = {};
	        var attributes = event.EventAttributes || {};
	        var promotedAttributes = getRecommendedPromotedEventAttributes(
	            event.EventCategory
	        );
	        Object.keys(attributes).forEach(function(key) {
	            // Skip only attributes promoted by this event type so unrelated values
	            // remain available to Braze as metadata.
	            if (
	                promotedAttributes.indexOf(key) === -1 &&
	                attributes[key] != null &&
	                attributes[key] !== ''
	            ) {
	                metadata[key] = attributes[key];
	            }
	        });
	        var productAction = event.ProductAction || {};
	        if (productAction.Affiliation) {
	            metadata.affiliation = productAction.Affiliation;
	        }
	        if (productAction.CouponCode) {
	            metadata.coupon_code = productAction.CouponCode;
	        }
	        // tax/shipping are recognized top-level recommended-event attributes
	        // (see applyRecommendedMonetaryAttributes), so they are not duplicated here.
	        return metadata;
	    }

	    function buildRecommendedLineItem(product) {
	        var lineItem = {
	            product_id: String(product.Sku),
	            product_name: String(product.Name),
	            variant_id: getRecommendedVariantId(product),
	            quantity: getRecommendedQuantity(product),
	            price: parseFloat(product.Price) || 0,
	        };
	        var imageUrl = getRecommendedProductAttribute(
	            product,
	            getRecommendedImageUrlAttributes()
	        );
	        if (imageUrl) {
	            lineItem.image_url = imageUrl;
	        }
	        var productUrl = getRecommendedProductAttribute(
	            product,
	            getRecommendedProductUrlAttributes()
	        );
	        if (productUrl) {
	            lineItem.product_url = productUrl;
	        }
	        var metadata = emptyObjectToUndefined(
	            buildRecommendedProductMetadata(product)
	        );
	        if (metadata) {
	            lineItem.metadata = metadata;
	        }
	        return lineItem;
	    }

	    function buildRecommendedLineItems(productList) {
	        return (productList || []).map(buildRecommendedLineItem);
	    }

	    // Forwards a commerce event using Braze's recommended eCommerce schema.
	    // Returns true/false when the event was handled, or null to signal the caller
	    // to fall back to legacy forwarding (no products, or an unsupported action).
	    function logRecommendedCommerceEvent(event) {
	        var productList = getRecommendedProductList(event);
	        if (!productList.length) {
	            return null;
	        }
	        var currency = event.CurrencyCode || 'USD';
	        var source = RECOMMENDED_ECOMMERCE_SOURCE;
	        var eventMetadata = emptyObjectToUndefined(
	            buildRecommendedEventMetadata(event)
	        );
	        var reportEvent = false;
	        var properties;

	        switch (event.EventCategory) {
	            case CommerceEventType.ProductAddToCart:
	            case CommerceEventType.ProductRemoveFromCart:
	                properties = {
	                    cart_id: getRecommendedCartId(event),
	                    currency: currency,
	                    source: source,
	                    total_value: getRecommendedTotalValue(event),
	                    products: buildRecommendedLineItems(productList),
	                    action:
	                        event.EventCategory ===
	                        CommerceEventType.ProductAddToCart
	                            ? 'add'
	                            : 'remove',
	                };
	                applyRecommendedMonetaryAttributes(properties, event);
	                if (eventMetadata) {
	                    properties.metadata = eventMetadata;
	                }
	                reportEvent = braze.logEcommerceEvent({
	                    name: RECOMMENDED_CART_UPDATED_EVENT_NAME,
	                    properties: properties,
	                });
	                break;
	            case CommerceEventType.ProductCheckout:
	                properties = {
	                    checkout_id: getRecommendedCheckoutId(event),
	                    currency: currency,
	                    source: source,
	                    total_value: getRecommendedTotalValue(event),
	                    products: buildRecommendedLineItems(productList),
	                    cart_id: getRecommendedCartId(event),
	                };
	                applyRecommendedMonetaryAttributes(properties, event);
	                if (eventMetadata) {
	                    properties.metadata = eventMetadata;
	                }
	                reportEvent = braze.logEcommerceEvent({
	                    name: RECOMMENDED_CHECKOUT_STARTED_EVENT_NAME,
	                    properties: properties,
	                });
	                break;
	            case CommerceEventType.ProductViewDetail:
	                reportEvent = false;
	                productList.forEach(function(product) {
	                    var viewedProperties = {
	                        product_id: String(product.Sku),
	                        product_name: String(product.Name),
	                        variant_id: getRecommendedVariantId(product),
	                        price: parseFloat(product.Price) || 0,
	                        currency: currency,
	                        source: source,
	                    };
	                    var imageUrl = getRecommendedProductAttribute(
	                        product,
	                        getRecommendedImageUrlAttributes()
	                    );
	                    if (imageUrl) {
	                        viewedProperties.image_url = imageUrl;
	                    }
	                    var productUrl = getRecommendedProductAttribute(
	                        product,
	                        getRecommendedProductUrlAttributes()
	                    );
	                    if (productUrl) {
	                        viewedProperties.product_url = productUrl;
	                    }
	                    var viewedMetadata = emptyObjectToUndefined(
	                        mergeObjects(
	                            mergeObjects(
	                                buildRecommendedProductMetadata(product),
	                                eventMetadata || {}
	                            ),
	                            buildRecommendedMonetaryMetadata(event)
	                        )
	                    );
	                    if (viewedMetadata) {
	                        viewedProperties.metadata = viewedMetadata;
	                    }
	                    reportEvent =
	                        braze.logEcommerceEvent({
	                            name: RECOMMENDED_PRODUCT_VIEWED_EVENT_NAME,
	                            properties: viewedProperties,
	                        }) === true || reportEvent;
	                });
	                break;
	            case CommerceEventType.ProductPurchase:
	                properties = {
	                    order_id: getRecommendedOrderId(event),
	                    currency: currency,
	                    source: source,
	                    total_value: getRecommendedTotalValue(event),
	                    products: buildRecommendedLineItems(productList),
	                    cart_id: getRecommendedCartId(event),
	                };
	                var totalDiscounts = getRecommendedTotalDiscounts(event);
	                if (totalDiscounts != null) {
	                    properties.total_discounts = totalDiscounts;
	                }
	                applyRecommendedMonetaryAttributes(properties, event);
	                if (eventMetadata) {
	                    properties.metadata = eventMetadata;
	                }
	                reportEvent = braze.logEcommerceEvent({
	                    name: RECOMMENDED_ORDER_PLACED_EVENT_NAME,
	                    properties: properties,
	                });
	                break;
	            case CommerceEventType.ProductRefund:
	                // Braze has no typed order_refunded event; forward it as a custom
	                // event that mirrors the recommended ecommerce.order_refunded schema.
	                var refundProperties = {
	                    order_id: getRecommendedOrderId(event),
	                    total_value: getRecommendedTotalValue(event),
	                    currency: currency,
	                    source: source,
	                    products: buildRecommendedLineItems(productList),
	                };
	                var refundDiscounts = getRecommendedTotalDiscounts(event);
	                if (refundDiscounts != null) {
	                    refundProperties.total_discounts = refundDiscounts;
	                }
	                var refundMetadata = emptyObjectToUndefined(
	                    mergeObjects(
	                        eventMetadata || {},
	                        buildRecommendedMonetaryMetadata(event)
	                    )
	                );
	                if (refundMetadata) {
	                    refundProperties.metadata = refundMetadata;
	                }
	                reportEvent = braze.logCustomEvent(
	                    RECOMMENDED_ORDER_REFUNDED_EVENT_NAME,
	                    refundProperties
	                );
	                break;
	            default:
	                return null;
	        }
	        return reportEvent === true;
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
	        // When opted in (and the host Braze SDK supports it), forward supported
	        // commerce actions using Braze's recommended eCommerce schema. Unsupported
	        // actions (or a host SDK without the API) fall back to legacy forwarding.
	        if (
	            useEcommerceRecommendedEvents &&
	            recommendedEcommerceEventsSupported()
	        ) {
	            var recommendedResult = logRecommendedCommerceEvent(event);
	            if (recommendedResult !== null) {
	                return recommendedResult === true;
	            }
	        }
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
	            useEcommerceRecommendedEvents =
	                forwarderSettings.useEcommerceRecommendedEvents === 'True';
	            // Customer-configured attribute names for the recommended eCommerce
	            // fields. Unset settings leave these null and the defaults apply.
	            mappedCartIdAttribute = getMappedAttributeName(
	                forwarderSettings.cartIdAttribute
	            );
	            mappedCheckoutIdAttribute = getMappedAttributeName(
	                forwarderSettings.checkoutIdAttribute
	            );
	            mappedImageUrlAttribute = getMappedAttributeName(
	                forwarderSettings.imageUrlAttribute
	            );
	            mappedProductUrlAttribute = getMappedAttributeName(
	                forwarderSettings.productUrlAttribute
	            );
	            mappedSubtotalValueAttribute = getMappedAttributeName(
	                forwarderSettings.subtotalValueAttribute
	            );
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
