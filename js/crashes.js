/* global SankofaCatch */

/**
 * Crash gallery — one realistic frontend error class per button.
 *
 * Uses the vendored `SankofaCatch` IIFE bundle (see js/vendor/).
 * The catchPlugin is registered in analytics.js so `window.onerror`
 * and `unhandledrejection` are already being captured; this page just
 * demonstrates manual captureException + addBreadcrumb for scenarios
 * that benefit from context.
 */

(function () {
  const catcher = (SankofaCatch && SankofaCatch.getCatch && SankofaCatch.getCatch()) || null;

  // Sticky user + tag context for every scenario below. Same pattern as
  // the React + Node examples so dashboards look consistent across
  // examples.
  if (catcher) {
    catcher.setUser({
      id: 'usr_demo_42',
      email: 'demo@sankofa.dev',
      username: 'demo',
    });
    catcher.setTags({
      surface: 'crash-gallery',
      page: 'crashes.html',
    });
  }

  // ── Custom error class (used in the "business-logic" scenario) ──

  class CheckoutValidationError extends Error {
    constructor(params) {
      super('checkout validation failed: ' + params.reason + ' (item ' + params.itemSku + ')');
      this.name = 'CheckoutValidationError';
      this.cartId = params.cartId;
      this.reason = params.reason;
      this.itemSku = params.itemSku;
    }
  }

  // ── Scenario definitions ──

  const scenarios = [
    {
      id: 'type-error',
      title: 'TypeError: null property access',
      detail: 'reading .length on undefined — the most common browser crash',
      run: function () {
        const apiResponse = {};
        // Force a runtime error: upstream omitted `items`.
        const count = apiResponse.items.length;
        console.log('never reached', count);
      },
    },
    {
      id: 'reference-error',
      title: 'ReferenceError: undeclared identifier',
      detail: 'typo / missing import / dead code',
      run: function () {
        // Intentional undeclared global.
        trackAnalytics('click'); // eslint-disable-line no-undef
      },
    },
    {
      id: 'unhandled-promise',
      title: 'Unhandled promise rejection',
      detail: 'async path throws, nothing catches',
      run: function () {
        // Not awaited — bubbles to window.unhandledrejection.
        fetch('https://nonexistent.sankofa.invalid/users/usr_does_not_exist').then(function (r) {
          if (!r.ok) throw new Error('profile fetch failed with ' + r.status);
        });
      },
    },
    {
      id: 'fetch-error',
      title: 'fetch() to invalid host',
      detail: 'network error + captureException with context',
      run: async function () {
        try {
          await fetch('https://nonexistent.sankofa.invalid/api/v1/me');
        } catch (err) {
          if (catcher) {
            catcher.captureException(err, {
              level: 'error',
              tags: { subsystem: 'network' },
              extra: {
                url: 'https://nonexistent.sankofa.invalid/api/v1/me',
                method: 'GET',
              },
              fingerprint: ['network', 'dns-resolution'],
            });
          }
        }
      },
    },
    {
      id: 'json-parse',
      title: 'SyntaxError: JSON.parse on HTML',
      detail: 'upstream returned 502 HTML where JSON was expected',
      run: function () {
        const rawBody = '<!DOCTYPE html><html>502 Bad Gateway</html>';
        if (catcher) {
          catcher.addBreadcrumb({
            type: 'http',
            category: 'parse',
            message: 'parsing /api/orders response',
            level: 'debug',
            data: { content_type: 'text/html; charset=utf-8', bytes: rawBody.length },
          });
        }
        JSON.parse(rawBody);
      },
    },
    {
      id: 'dom-null',
      title: 'Null DOM element',
      detail: 'querySelector returned null, code assumed present',
      run: function () {
        const modal = document.querySelector('[data-modal="checkout"]');
        modal.classList.add('open'); // throws: modal is null
      },
    },
    {
      id: 'stack-overflow',
      title: 'RangeError: maximum call stack',
      detail: 'infinite recursion',
      run: function () {
        function recurse(n) { return recurse(n + 1); }
        recurse(0);
      },
    },
    {
      id: 'custom-error',
      title: 'Custom error (handled) with fingerprint',
      detail: 'business-logic error captured manually',
      run: function () {
        try {
          throw new CheckoutValidationError({
            cartId: 'cart_9fQ',
            reason: 'item_out_of_stock',
            itemSku: 'SKU-A7281',
          });
        } catch (err) {
          if (catcher) {
            catcher.captureException(err, {
              level: 'warning',
              fingerprint: ['checkout', 'validation', 'out-of-stock'],
              tags: { flow: 'checkout', stage: 'validate' },
              extra: { cart_id: 'cart_9fQ', sku: 'SKU-A7281' },
            });
          }
        }
      },
    },
    {
      id: 'setTimeout-throw',
      title: 'Error inside setTimeout',
      detail: 'no surrounding try/catch, no request scope',
      run: function () {
        setTimeout(function () {
          throw new Error('scheduled job threw after page load');
        }, 100);
      },
    },
    {
      id: 'log-warning',
      title: 'captureMessage (no exception)',
      detail: 'warning-level signal without an error object',
      run: function () {
        if (catcher) {
          catcher.captureMessage('user tried to open checkout with empty cart', {
            level: 'warning',
            tags: { surface: 'checkout', issue: 'empty-cart' },
            extra: { items_in_cart: 0, user_segment: 'trial' },
          });
        }
      },
    },
    {
      id: 'breadcrumb-trail',
      title: 'Manual breadcrumb trail',
      detail: 'simulated flow → handled error with context',
      run: function () {
        if (!catcher) return;
        catcher.addBreadcrumb({
          type: 'ui.click',
          category: 'button',
          message: 'click #add-to-cart',
          level: 'info',
          data: { sku: 'SKU-A7281', variant: 'large' },
        });
        catcher.addBreadcrumb({
          type: 'http',
          category: 'fetch',
          message: 'POST /api/cart',
          level: 'info',
          data: { status: 500, duration_ms: 812 },
        });
        catcher.addBreadcrumb({
          type: 'ui.transition',
          category: 'router',
          message: 'navigate /checkout → /cart',
          level: 'info',
        });
        try {
          throw new Error('AddToCart failed: upstream returned 500');
        } catch (err) {
          catcher.captureException(err, {
            level: 'error',
            tags: { flow: 'add-to-cart', retriable: 'true' },
          });
        }
      },
    },

    // ── Phase A — Sankofa.log() Crashlytics-style breadcrumb ──
    //
    // log() pushes a free-text crumb onto the ring buffer that rides
    // on the next captured exception. Doesn't bill on its own.
    // Reached via the global `Sankofa.log(...)` static when the
    // browser package is loaded; falls back to a manual breadcrumb
    // call if `Sankofa.log` isn't available in the vendored bundle.
    {
      id: 'phase-a-log',
      title: 'Phase A — Sankofa.log() breadcrumb',
      detail: 'log() pushes a crumb; the next captureException attaches it',
      run: function () {
        if (typeof Sankofa !== 'undefined' && typeof Sankofa.log === 'function') {
          Sankofa.log('user opened payment flow', 'navigation');
          Sankofa.log('cart total: 49.00 USD', 'commerce');
          Sankofa.log('tapped pay button', 'user-action');
        } else if (catcher) {
          catcher.addBreadcrumb({ type: 'log', category: 'navigation', message: 'user opened payment flow', level: 'info' });
          catcher.addBreadcrumb({ type: 'log', category: 'commerce', message: 'cart total: 49.00 USD', level: 'info' });
          catcher.addBreadcrumb({ type: 'log', category: 'user-action', message: 'tapped pay button', level: 'info' });
        }
        try {
          throw new Error('payment gateway returned no token');
        } catch (err) {
          if (typeof Sankofa !== 'undefined' && typeof Sankofa.captureException === 'function') {
            Sankofa.captureException(err);
          } else if (catcher) {
            catcher.captureException(err);
          }
        }
      },
    },

    // ── Phase B — withScope (single + nested) ──
    //
    // Sentry-style temporary scope overlay. Tags / extras / level set
    // inside the closure layer onto captures made inside the closure;
    // the global scope is untouched. Stack-scoped — nested withScope
    // calls compose; async captures deferred past the closure return
    // do NOT see the scope.
    {
      id: 'phase-b-with-scope',
      title: 'Phase B — withScope (temporary overlay)',
      detail: 'tags + level + extras attached to ONE capture only',
      run: function () {
        if (typeof Sankofa === 'undefined' || typeof Sankofa.withScope !== 'function') {
          // Vendored bundle predates Phase B — rebuild + redeploy.
          if (catcher) catcher.captureMessage('withScope not available in this bundle — rebuild @sankofa/browser');
          return;
        }
        Sankofa.withScope(function (scope) {
          scope.setTag('checkout_step', 'payment');
          scope.setTag('payment_method', 'stripe');
          scope.setExtra('cart_id', 'cart_8x92Lq');
          scope.setExtra('cart_value_cents', 4900);
          scope.setLevel('warning');
          scope.setFingerprint(['checkout', 'payment', 'manual']);
          try {
            throw new Error('payment gateway timeout — retried 3x');
          } catch (err) {
            // Only this capture carries the scope's extras + level.
            Sankofa.captureException(err);
          }
        });
        // Subsequent captures lose the scope.
        Sankofa.captureMessage('post-scope event — no checkout_step tag');
      },
    },
    {
      id: 'phase-b-with-scope-nested',
      title: 'Phase B — withScope (nested scopes)',
      detail: 'inner scope inherits + extends the outer at capture time',
      run: function () {
        if (typeof Sankofa === 'undefined' || typeof Sankofa.withScope !== 'function') {
          if (catcher) catcher.captureMessage('withScope not available in this bundle — rebuild @sankofa/browser');
          return;
        }
        Sankofa.withScope(function (outer) {
          outer.setTag('feature', 'billing');
          outer.setExtra('checkout_session', 'sess_12345');
          Sankofa.withScope(function (inner) {
            inner.setTag('substep', 'card-validation');
            inner.setExtra('attempt', 2);
            try {
              throw new TypeError('invalid card number checksum');
            } catch (err) {
              // Carries BOTH feature=billing (outer) AND
              // substep=card-validation (inner).
              Sankofa.captureException(err);
            }
          });
          // After inner pops, only outer's tags apply.
          Sankofa.captureMessage('still in outer scope (no substep)');
        });
      },
    },

    // ── Phase B — beforeSend (see analytics.js) ──
    //
    // The beforeSend hook is configured at init time in analytics.js.
    // It drops events whose message contains "[noise]" and scrubs
    // `user_email` from extras. This button fires events that
    // exercise both branches.
    {
      id: 'phase-b-before-send',
      title: 'Phase B — beforeSend (see analytics.js)',
      detail: 'fires events the hook should drop or scrub',
      run: function () {
        const captureMsg = (typeof Sankofa !== 'undefined' && typeof Sankofa.captureMessage === 'function')
          ? Sankofa.captureMessage
          : (catcher ? catcher.captureMessage.bind(catcher) : null);
        if (!captureMsg) return;
        // 1. "[noise]" → beforeSend returns null → dropped.
        captureMsg('[noise] framework warning — drop me');
        // 2. PII scrubbed — beforeSend rewrites user_email before send.
        captureMsg('checkout failure — beforeSend should scrub user_email', {
          level: 'info',
          extra: {
            user_email: 'ada@example.com',
            note: 'beforeSend should redact user_email',
          },
        });
      },
    },
  ];

  // ── UI wiring ──

  const grid = document.getElementById('crash-grid');
  const statusEl = document.getElementById('crash-status');
  const endpointEl = document.getElementById('env-endpoint');
  const apiKeyEl = document.getElementById('env-apikey');

  // Pull live values from the connect helper so the env line matches
  // whatever credentials the user actually entered. Falls back to the
  // hosted-cloud defaults when the helper is missing (e.g. someone
  // loaded crashes.html standalone).
  var conn = window.SankofaExampleConnection;
  if (endpointEl) {
    endpointEl.textContent = (conn && conn.endpoint && conn.endpoint()) || 'http://localhost:8080';
  }
  if (apiKeyEl) {
    var k = (conn && conn.apiKey && conn.apiKey()) || '';
    apiKeyEl.textContent = k ? k.slice(0, 12) + '…' : 'not connected';
  }

  if (!grid) return;

  scenarios.forEach(function (scenario) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'crash-btn';
    btn.innerHTML = '<strong>' + scenario.title + '</strong><small>' + scenario.detail + '</small>';
    btn.addEventListener('click', function () {
      statusEl.textContent = '🚀 Triggering "' + scenario.title + '"…';
      try {
        const result = scenario.run();
        if (result && typeof result.then === 'function') {
          result.then(
            function () { statusEl.textContent = '✅ "' + scenario.title + '" dispatched (check dashboard)'; },
            function () { statusEl.textContent = '✅ "' + scenario.title + '" dispatched via rejection'; },
          );
        } else {
          statusEl.textContent = '✅ "' + scenario.title + '" fired (check dashboard)';
        }
      } catch (err) {
        // Sync throws are caught by window.onerror via the SDK.
        statusEl.textContent = '💥 "' + scenario.title + '" threw: ' + err.message;
      }
    });
    grid.appendChild(btn);
  });
})();
