/**
 * Sankofa Connect — first-run gate for the HTML example.
 *
 * Mirrors the iOS / Android / RN / Flutter / web-app connect screens:
 *
 *   - Persist `apiKey` + `endpoint` in `localStorage` so the user
 *     types them once.
 *   - When no key is saved, render a full-screen overlay form
 *     BEFORE `analytics.js` calls `Sankofa.init(...)`.
 *   - Expose `window.SankofaExampleConnection` so analytics.js can
 *     read the resolved creds; a synchronous `apiKey()` / `endpoint()`
 *     pair keeps the existing init signature unchanged.
 *   - Inject a tiny fixed-position "Disconnect" pill so the user can
 *     return to the connect form from any page without poking the
 *     console.
 *
 * Loaded BEFORE `analytics.js` in every page so init can read the
 * persisted values synchronously.
 */
(function () {
  const STORAGE_API_KEY = 'sankofa.example.apiKey';
  const STORAGE_ENDPOINT = 'sankofa.example.endpoint';
  const DEFAULT_ENDPOINT = 'https://api.sankofa.dev';

  function readKey() {
    try {
      return (localStorage.getItem(STORAGE_API_KEY) || '').trim();
    } catch (_) {
      return '';
    }
  }
  function readEndpoint() {
    try {
      return (localStorage.getItem(STORAGE_ENDPOINT) || '').trim() || DEFAULT_ENDPOINT;
    } catch (_) {
      return DEFAULT_ENDPOINT;
    }
  }
  function save(apiKey, endpoint) {
    try {
      localStorage.setItem(STORAGE_API_KEY, apiKey);
      localStorage.setItem(STORAGE_ENDPOINT, endpoint || DEFAULT_ENDPOINT);
    } catch (_) {
      // Storage failures (Safari private mode, etc.) fall through —
      // the form still completes for the current page load.
    }
  }
  function clear() {
    try {
      localStorage.removeItem(STORAGE_API_KEY);
      localStorage.removeItem(STORAGE_ENDPOINT);
    } catch (_) {}
  }
  function inferEnv(key) {
    if (key.indexOf('sk_test_') === 0) return 'TEST';
    if (key.indexOf('sk_live_') === 0) return 'LIVE';
    return null;
  }

  function renderOverlay(opts) {
    var existing = document.getElementById('sankofa-connect-overlay');
    if (existing) existing.remove();

    var prefilledEndpoint = readEndpoint();
    var html =
      '<div id="sankofa-connect-overlay" style="position:fixed;inset:0;background:rgba(15,15,26,0.96);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">' +
      '<div style="background:#1A1A2E;border:1px solid #2A2A3E;border-radius:20px;padding:28px;max-width:480px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.5);">' +
      '<div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#6C5CE7,#A29BFE);margin-bottom:18px;box-shadow:0 8px 24px rgba(108,92,231,.4);"></div>' +
      '<div style="color:#9CA3AF;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;">Sankofa Developer Sandbox</div>' +
      '<h1 style="color:#fff;font-size:22px;font-weight:700;margin:6px 0 8px;">Connect your project</h1>' +
      '<p style="color:#9CA3AF;font-size:14px;line-height:1.5;margin:0 0 22px;">Paste your Sankofa API key to start tracking events, capturing errors, and exercising every SDK module from this page. Your key is stored in this browser only.</p>' +
      '<label style="color:#fff;font-size:13px;font-weight:600;display:block;margin-bottom:6px;">API key</label>' +
      '<input id="sankofa-connect-key" type="password" autocomplete="off" spellcheck="false" placeholder="sk_test_…" style="width:100%;box-sizing:border-box;background:#16162A;color:#fff;border:1px solid #2A2A3E;border-radius:10px;padding:12px;font-size:14px;" />' +
      '<div id="sankofa-connect-env" style="font-size:12px;margin-top:6px;min-height:14px;"></div>' +
      '<label style="color:#fff;font-size:13px;font-weight:600;display:block;margin:18px 0 6px;">Server endpoint <span style="color:#6B7280;font-weight:400;">(advanced)</span></label>' +
      '<input id="sankofa-connect-endpoint" type="url" autocomplete="off" spellcheck="false" placeholder="https://api.sankofa.dev" value="' + escapeAttr(prefilledEndpoint) + '" style="width:100%;box-sizing:border-box;background:#16162A;color:#fff;border:1px solid #2A2A3E;border-radius:10px;padding:12px;font-size:14px;" />' +
      '<div style="color:#6B7280;font-size:11px;margin-top:4px;">Leave the default for the hosted Sankofa cloud.</div>' +
      '<div id="sankofa-connect-error" style="color:#F87171;font-size:12px;margin-top:10px;min-height:16px;"></div>' +
      '<button id="sankofa-connect-submit" style="width:100%;background:#6C5CE7;color:#fff;border:0;border-radius:14px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;margin-top:12px;">Connect &amp; initialize SDK</button>' +
      '<div style="color:#9CA3AF;font-size:12px;text-align:center;margin-top:14px;">Don\'t have a key? <a href="https://sankofa.dev" target="_blank" rel="noopener" style="color:#A29BFE;font-weight:700;text-decoration:none;">Get one in 30 seconds ↗</a></div>' +
      '</div></div>';

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper.firstChild);

    var keyInput = document.getElementById('sankofa-connect-key');
    var endpointInput = document.getElementById('sankofa-connect-endpoint');
    var envLabel = document.getElementById('sankofa-connect-env');
    var errorLabel = document.getElementById('sankofa-connect-error');
    var submitBtn = document.getElementById('sankofa-connect-submit');

    keyInput.addEventListener('input', function () {
      var env = inferEnv(keyInput.value);
      if (env === 'TEST') {
        envLabel.textContent = 'Detected TEST environment';
        envLabel.style.color = '#EAB308';
      } else if (env === 'LIVE') {
        envLabel.textContent = 'Detected LIVE environment';
        envLabel.style.color = '#22C55E';
      } else {
        envLabel.textContent = '';
      }
      errorLabel.textContent = '';
    });

    function submit() {
      var key = keyInput.value.trim();
      var endpoint = endpointInput.value.trim() || DEFAULT_ENDPOINT;
      if (key.length < 8) {
        errorLabel.textContent = 'That key looks too short — paste the full token.';
        return;
      }
      save(key, endpoint);
      if (opts && opts.onConnect) {
        opts.onConnect();
      } else {
        // Hard reload so analytics.js re-runs with the freshly-saved
        // creds. No-op script-level globals + plugin construction make
        // a soft reinit fragile — a reload is the simplest correct
        // path and matches what the user expects ("I clicked Connect,
        // the page reset, tracking is live").
        window.location.reload();
      }
    }

    submitBtn.addEventListener('click', submit);
    keyInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submit();
    });
    endpointInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submit();
    });

    setTimeout(function () { keyInput.focus(); }, 0);
  }

  function injectDisconnectPill() {
    if (document.getElementById('sankofa-connect-disconnect-pill')) return;
    var pill = document.createElement('button');
    pill.id = 'sankofa-connect-disconnect-pill';
    pill.type = 'button';
    pill.title = 'Disconnect & forget the saved Sankofa API key';
    pill.textContent = 'Sankofa: Disconnect';
    pill.style.cssText =
      'position:fixed;bottom:16px;right:16px;z-index:2147483646;' +
      'background:#1A1A2E;color:#F87171;border:1px solid #2A2A3E;' +
      'border-radius:999px;padding:8px 14px;font-size:11px;font-weight:700;' +
      'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;' +
      'cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.3);opacity:.6;';
    pill.addEventListener('mouseenter', function () { pill.style.opacity = '1'; });
    pill.addEventListener('mouseleave', function () { pill.style.opacity = '.6'; });
    pill.addEventListener('click', function () {
      if (!window.confirm('Disconnect from Sankofa? Your saved API key + endpoint will be removed from this browser.')) return;
      clear();
      window.location.reload();
    });
    document.body.appendChild(pill);
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  // Public surface. analytics.js consults these synchronously when
  // building the Sankofa.init() call.
  window.SankofaExampleConnection = {
    apiKey: readKey,
    endpoint: readEndpoint,
    isConnected: function () { return readKey().length > 0; },
    showConnect: function () { renderOverlay({}); },
    injectDisconnectPill: injectDisconnectPill,
    disconnect: function () { clear(); window.location.reload(); },
  };

  // Render the connect overlay automatically on first paint when no
  // key is saved. We do this on `DOMContentLoaded` so the form has a
  // body to mount into.
  function autoRender() {
    if (window.SankofaExampleConnection.isConnected()) {
      injectDisconnectPill();
    } else {
      renderOverlay({});
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoRender);
  } else {
    autoRender();
  }
})();
