export default createXHR = (function() {
  return function(cb) {
      var xhr;

      try {
          xhr = new window.XMLHttpRequest();
      }
      catch (e) {
          logDebug('Error creating XMLHttpRequest object.');
      }

      if (xhr && cb && "withCredentials" in xhr) {
          xhr.onreadystatechange = cb;
      }
      else if (typeof window.XDomainRequest != 'undefined') {
          logDebug('Creating XDomainRequest object');

          try {
              xhr = new window.XDomainRequest();
              xhr.onload = cb;
          }
          catch (e) {
              logDebug('Error creating XDomainRequest object');
          }
      }

      return xhr;
  }
}());
