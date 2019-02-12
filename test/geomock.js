(function() {
  (function() {
    if (typeof navigator === "undefined" || navigator === null) {
      window.navigator = {};
    }
    if (navigator.geolocation == null) {
      window.navigator.geolocation = {};
    }
    navigator.geolocation.delay = 1000;
    navigator.geolocation.shouldFail = false;
    navigator.geolocation.failsAt = -1;
    navigator.geolocation.errorMessage = "There was an error retrieving the position!";
    navigator.geolocation.currentTimeout = -1;
    navigator.geolocation.lastPosReturned = 0;
    navigator.geolocation._sanitizeLastReturned = function() {
      if (this.lastPosReturned > this.waypoints.length - 1) {
        return this.lastPosReturned = 0;
      }
    };
    navigator.geolocation._geoCall = function(method, success, error) {
      var _this = this;
      if (this.shouldFail && (error != null)) {
        return this.currentTimeout = window[method].call(null, function() {
          return error(_this.errorMessage);
        }, this.delay);
      } else {
        if (success != null) {
          return this.currentTimeout = window[method].call(null, function() {
            success(_this.waypoints[_this.lastPosReturned++]);
            return _this._sanitizeLastReturned();
          }, this.delay);
        }
      }
    };
    navigator.geolocation.getCurrentPosition = function(success, error) {
      return this._geoCall("setTimeout", success, error);
    };
    navigator.geolocation.watchPosition = function(success, error) {
      this._geoCall("setInterval", success, error);
      return this.currentTimeout;
    };
    navigator.geolocation.clearWatch = function(id) {
      return clearInterval(id);
    };
    return navigator.geolocation.waypoints = [
      {
        coords: {
          latitude: 52.5168,
          longitude: 13.3889,
          accuracy: 1500
        }
      }
    ];
  })();

}).call(this);
