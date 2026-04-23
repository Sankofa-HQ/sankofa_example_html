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
  ];

  // ── UI wiring ──

  const grid = document.getElementById('crash-grid');
  const statusEl = document.getElementById('crash-status');
  const endpointEl = document.getElementById('env-endpoint');
  const apiKeyEl = document.getElementById('env-apikey');

  if (endpointEl) endpointEl.textContent = 'http://localhost:8080';
  if (apiKeyEl) apiKeyEl.textContent = 'sk_test_b25f965d…';

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
