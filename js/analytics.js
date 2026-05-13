/**
 * Sankofa Analytics — initialization and tracking for the ThrivnMe marketing site.
 *
 * Uses the CDN build of @sankofa/browser loaded in index.html <head>.
 * All page-level tracking is centralized here so individual pages
 * stay clean.
 */

// ── Initialize ────────────────────────────────────────────────────────────────

// SankofaDemo (from js/sankofa-demo.js) holds canonical flag/config
// keys + defaults so the HTML example renders offline if the server
// never responds. The IIFE bundles under js/vendor/ expose
// `SankofaSwitch` and `SankofaConfig` globals carrying `switchPlugin`
// and `configPlugin` respectively.
//
// We build the plugins array defensively — each plugin is pushed only
// when its IIFE global is actually present. That way a failed CDN
// fetch for one plugin (Replay, typically) doesn't torpedo the whole
// init and silently break analytics / catch / switch / config.
const plugins = [];
if (typeof SankofaSwitch !== 'undefined' && SankofaSwitch.switchPlugin) {
  plugins.push(SankofaSwitch.switchPlugin({ defaults: SankofaDemo.FLAG_DEFAULTS }));
} else {
  console.warn('[Sankofa demo] SankofaSwitch global missing — Switch plugin skipped.');
}
if (typeof SankofaConfig !== 'undefined' && SankofaConfig.configPlugin) {
  plugins.push(SankofaConfig.configPlugin({ defaults: SankofaDemo.CONFIG_DEFAULTS }));
} else {
  console.warn('[Sankofa demo] SankofaConfig global missing — Config plugin skipped.');
}
if (typeof SankofaReplay !== 'undefined' && SankofaReplay.rrwebReplayPlugin) {
  plugins.push(SankofaReplay.rrwebReplayPlugin({ maskAllInputs: true }));
} else {
  console.warn('[Sankofa demo] SankofaReplay global missing — Replay plugin skipped.');
}
if (typeof SankofaCatch !== 'undefined' && SankofaCatch.catchPlugin) {
  plugins.push(
    SankofaCatch.catchPlugin({
      environment: 'test',
      captureUnhandled: true,
      captureRejections: true,
      release: 'thrivnme-html@0.1.0',
      // 🚀 Phase B — beforeSend hook. Runs AFTER an event is composed
      // but BEFORE the transport sends. Return null to drop entirely;
      // return the event (possibly modified) to ship. Throws swallowed.
      //   1. Drop events whose message contains "[noise]" (framework
      //      warnings you can't fix).
      //   2. Scrub `user_email` from `extra` so PII doesn't leak to
      //      the dashboard.
      beforeSend: function (event) {
        if (event.message && event.message.indexOf('[noise]') >= 0) return null;
        if (event.extra && 'user_email' in event.extra) {
          var scrubbed = Object.assign({}, event.extra, { user_email: '[redacted]' });
          return Object.assign({}, event, { extra: scrubbed });
        }
        return event;
      },
    }),
  );
} else {
  console.warn('[Sankofa demo] SankofaCatch global missing — Catch plugin skipped. Make sure js/vendor/sankofa-catch.min.js is loaded.');
}
if (typeof SankofaPulse !== 'undefined' && SankofaPulse.pulsePlugin) {
  // The plugin owns the modal renderer, the targeting evaluator, and
  // the partial-state queue — host code only needs to call `show()`
  // (see js/pulse-lab.js). `respondent` is optional here; the plugin
  // falls back to Sankofa.distinctId() / anonymousId() if absent.
  plugins.push(SankofaPulse.pulsePlugin({}));
} else {
  console.warn('[Sankofa demo] SankofaPulse global missing — Pulse plugin skipped. Make sure js/vendor/sankofa-pulse.min.js is loaded.');
}

// pageName is referenced by every event tracker on the page, so we
// compute it unconditionally — even when the user hasn't connected
// yet — so the rest of this file's listener bindings stay valid.
var pageName = document.title.split('—')[0]?.trim() || document.title;

// Resolve creds from the connect helper (js/sankofa-connect.js).
// When the user hasn't connected yet, the helper renders an overlay
// form and we skip init — the page reload after submit re-runs this
// file with the saved creds. This mirrors the iOS / Android / RN /
// Flutter / web-app examples: connect once, persist, and a
// "Disconnect" pill (also injected by the helper) returns to the
// form.
var sankofaConn = window.SankofaExampleConnection;
if (!sankofaConn || !sankofaConn.isConnected()) {
  if (sankofaConn && sankofaConn.showConnect) sankofaConn.showConnect();
  console.info('[Sankofa demo] Waiting for API key — Sankofa.init() skipped until the user connects.');
} else {
  Sankofa.init({
    apiKey: sankofaConn.apiKey(),
    endpoint: sankofaConn.endpoint(),
    debug: true,
    plugins: plugins,
  });

  // ── Page View ─────────────────────────────────────────────────────────────
  Sankofa.screen(pageName);
}

// ── CTA Tracking ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Hero CTA
  const heroCta = document.getElementById('hero-cta');
  if (heroCta) {
    heroCta.addEventListener('click', () => {
      Sankofa.track('cta_clicked', {
        label: 'Get Started Free',
        location: 'hero',
        page: pageName,
      });
    });
  }

  // Pricing CTA
  const pricingCta = document.getElementById('pricing-cta');
  if (pricingCta) {
    pricingCta.addEventListener('click', () => {
      Sankofa.track('cta_clicked', {
        label: 'View Pricing',
        location: 'pricing_section',
        page: pageName,
      });
    });
  }

  // Nav link clicks
  document.querySelectorAll('#main-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      Sankofa.track('nav_clicked', {
        label: link.textContent?.trim(),
        href: link.getAttribute('href'),
      });
    });
  });

  // Feature card clicks
  document.querySelectorAll('.feature-card').forEach((card) => {
    card.addEventListener('click', () => {
      Sankofa.track('feature_explored', {
        feature: card.getAttribute('data-feature'),
        page: pageName,
      });
    });
  });
});

// ── Scroll Depth ──────────────────────────────────────────────────────────────

let maxScroll = 0;
const scrollMilestones = [25, 50, 75, 100];
const firedMilestones = new Set();

window.addEventListener('scroll', () => {
  const scrollPct = Math.round(
    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
  );
  if (scrollPct > maxScroll) maxScroll = scrollPct;

  for (const milestone of scrollMilestones) {
    if (scrollPct >= milestone && !firedMilestones.has(milestone)) {
      firedMilestones.add(milestone);
      Sankofa.track('scroll_depth', {
        depth: milestone,
        page: pageName,
      });
    }
  }
});

// ── Identify (after signup/login) ─────────────────────────────────────────────

window.sankofaIdentify = function (userId, traits) {
  Sankofa.identify(userId);
  if (traits) {
    Sankofa.setPerson(traits);
  }
};
