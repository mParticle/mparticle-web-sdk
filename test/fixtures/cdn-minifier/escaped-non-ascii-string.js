// 3.33.0 shipped a string escape like this one. The CDN's NUglify pass writes it back out as the raw
// character, so the minified bundle is no longer ASCII and a Shift_JIS page cannot parse it.
(function () {
    window.addToCartPattern = new RegExp('add to cart[^\u3092]', 'i');
})();
