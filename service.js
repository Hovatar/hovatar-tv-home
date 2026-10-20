"use strict";
/* ============================================================
   HOVATAR home — TizenBrew service file.
   TizenBrew runs this in its privileged service VM, which has the
   Node `require` AND the Tizen `tizen` global (with the
   application.launch privilege from TizenBrew's config.xml).

   The home-screen page (served at 127.0.0.1:8081, no tizen there)
   calls this over localhost to launch native TV apps.
   ============================================================ */
(function () {
  var http;
  try { http = require('http'); } catch (e) { return; }

  function launchApp(appId, cb) {
    try {
      if (typeof tizen !== 'undefined' && tizen.application && tizen.application.launch) {
        tizen.application.launch(
          appId,
          function () { cb(true, ''); },
          function (err) { cb(false, err ? ((err.name || 'Error') + ': ' + (err.message || '')) : 'launch error'); }
        );
        return;
      }
      cb(false, 'tizen.application unavailable');
    } catch (e) { cb(false, String(e)); }
  }

  var server = http.createServer(function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    var m = /^\/launch\/([^?]+)/.exec(req.url || '');
    if (m && m[1]) {
      var appId = decodeURIComponent(m[1]);
      launchApp(appId, function (ok, msg) {
        res.statusCode = ok ? 200 : 500;
        res.end(JSON.stringify({ ok: ok, appId: appId, msg: msg }));
      });
      return;
    }
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, service: 'hovatar-tv-home' }));
  });
  server.on('error', function () {});          /* ignore EADDRINUSE on relaunch */
  try { server.listen(8188, '127.0.0.1'); } catch (e) {}
})();
