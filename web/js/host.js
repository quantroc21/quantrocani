/* Bridge giữa trang web và native host (JXA + WKWebView).
   Khi mở bằng trình duyệt thường (dev preview), mọi lệnh được giả lập trong trang. */
(function () {
  const native = !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.host);
  const isTop = window.parent === window;

  function post(msg) {
    if (native) {
      window.webkit.messageHandlers.host.postMessage(JSON.stringify(msg));
    } else if (!isTop) {
      window.parent.postMessage({ __host: msg }, '*');
    } else if (window.DevHost) {
      window.DevHost.handle(msg);
    }
  }

  // Satellite pages: receive ACT commands from dev parent
  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.__act && window.ACT) window.ACT(d.__act);
    if (d.__fx && window.FXCMD) window.FXCMD(d.__fx);
  });

  function q(name, fallback) {
    const v = new URLSearchParams(location.search).get(name);
    return v === null ? fallback : v;
  }

  window.Host = { native, post, q };
})();
