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
Sankofa.init({
  apiKey: 'sk_test_b25f965d194d55bd071fb23921401e7c',
  endpoint: 'http://localhost:8080',
  debug: true,
  plugins: [
    SankofaSwitch.switchPlugin({ defaults: SankofaDemo.FLAG_DEFAULTS }),
    SankofaConfig.configPlugin({ defaults: SankofaDemo.CONFIG_DEFAULTS }),
    SankofaReplay.rrwebReplayPlugin({
      maskAllInputs: true,
    }),
  ],
});

// ── Page View ─────────────────────────────────────────────────────────────────

const pageName = document.title.split('—')[0]?.trim() || document.title;
Sankofa.screen(pageName);

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
