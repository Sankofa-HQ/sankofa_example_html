/* global SankofaSwitch, SankofaConfig, SankofaDemo */

/**
 * Wires remote flags + config into the ThrivnMe marketing page.
 * Responsibilities:
 *   - Maintenance banner visibility
 *   - Hero headline + CTA copy + CTA colour (driven by new_home_layout +
 *     checkout_cta_variant + theme_colors)
 *   - Premium badge visibility
 *   - Pricing tile injection (driven by pricing_table + trial_discount_pct +
 *     ab_pricing_page order)
 *   - Support link target (support_url)
 *   - Lab table — decision grid for every canonical key, updates live
 *     when the next handshake arrives
 *
 * The plugins are constructed in analytics.js; this module reads the
 * API handles via their global accessors and subscribes to onChange so
 * every section re-renders on refresh without a full page reload.
 */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    // Prime with cached state before the handshake lands so the page
    // never flashes local defaults if the SDK has a valid cache.
    render();
    subscribe();
  });

  function subscribe() {
    const s = SankofaSwitch.getSwitch();
    const c = SankofaConfig.getConfig();
    if (!s || !c) {
      // Plugins not ready yet — retry on next tick until setup resolves.
      setTimeout(subscribe, 250);
      return;
    }
    for (const k of Object.values(SankofaDemo.FLAGS))   s.onChange(k, render);
    for (const k of Object.values(SankofaDemo.CONFIG))  c.onChange(k, render);
  }

  function getFlag(key) {
    const s = SankofaSwitch.getSwitch();
    return (s && s.getDecision(key)) || SankofaDemo.FLAG_DEFAULTS[key];
  }
  function getConfig(key) {
    const c = SankofaConfig.getConfig();
    return (c && c.getDecision(key)) || SankofaDemo.CONFIG_DEFAULTS[key];
  }

  function render() {
    applyMaintenance();
    applyHero();
    applyPremiumBadge();
    applyPricing();
    applySupport();
    applyAIStatus();
    renderLab();
  }

  // ── Surface 1: maintenance banner ─────────────────────────────────

  function applyMaintenance() {
    const on = getConfig(SankofaDemo.CONFIG.MAINTENANCE_BANNER_ENABLED).value;
    let banner = document.getElementById('sankofa-maintenance');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'sankofa-maintenance';
      banner.style.cssText =
        'background:#fef3c7;color:#92400e;padding:10px 20px;font-size:14px;text-align:center;border-bottom:1px solid #fde68a';
      banner.textContent = '⚠️ Maintenance window in progress — some features may be slow.';
      document.body.prepend(banner);
    }
    banner.style.display = on ? 'block' : 'none';
  }

  // ── Surface 2: hero variant + CTA ─────────────────────────────────

  function applyHero() {
    const newHome = getFlag(SankofaDemo.FLAGS.NEW_HOME_LAYOUT).value;
    const ctaVariant = getFlag(SankofaDemo.FLAGS.CHECKOUT_CTA_VARIANT).variant || 'control';
    const theme = getConfig(SankofaDemo.CONFIG.THEME_COLORS).value || {};

    const heroH1 = document.querySelector('.hero h1');
    const heroP = document.querySelector('.hero p');
    const heroCta = document.getElementById('hero-cta');
    if (!heroH1 || !heroP || !heroCta) return;

    heroH1.textContent = newHome
      ? 'Analytics built for modern product teams'
      : 'Build better mobile apps, faster';
    heroP.textContent = newHome
      ? 'Heatmaps, flags, remote config, OTA updates. One SDK, no tradeoffs.'
      : 'Analytics, OTA updates, and crash reporting — all in one SDK.';

    const ctaLabel =
      ctaVariant === 'blue' ? 'Try it free'
      : ctaVariant === 'red' ? 'Upgrade now'
      : 'Get Started Free';
    const ctaBg =
      ctaVariant === 'blue' ? '#2563eb'
      : ctaVariant === 'red' ? '#dc2626'
      : theme.primary || '#e11d48';

    heroCta.textContent = ctaLabel;
    heroCta.style.backgroundColor = ctaBg;
    heroCta.style.borderColor = ctaBg;
    heroCta.setAttribute('data-variant', ctaVariant);
  }

  // ── Surface 3: premium badge ──────────────────────────────────────

  function applyPremiumBadge() {
    const show = getFlag(SankofaDemo.FLAGS.PREMIUM_BADGE_VISIBLE).value;
    const nav = document.querySelector('#main-nav .nav-links');
    if (!nav) return;

    let badge = document.getElementById('premium-badge');
    if (!show) {
      if (badge) badge.remove();
      return;
    }
    if (badge) return;

    const theme = getConfig(SankofaDemo.CONFIG.THEME_COLORS).value || {};
    badge = document.createElement('span');
    badge.id = 'premium-badge';
    badge.textContent = '✨ Premium';
    badge.style.cssText = [
      'display:inline-block',
      'padding:4px 10px',
      'margin-right:8px',
      'font-size:12px',
      'font-weight:600',
      'border-radius:999px',
      `background:${(theme.primary || '#e11d48') + '22'}`,
      `color:${theme.primary || '#e11d48'}`,
      `border:1px solid ${(theme.primary || '#e11d48') + '55'}`,
    ].join(';');
    nav.prepend(badge);
  }

  // ── Surface 4: pricing tiles ──────────────────────────────────────

  function applyPricing() {
    const arm = getFlag(SankofaDemo.FLAGS.AB_PRICING_PAGE).variant || 'A';
    const tiers = getConfig(SankofaDemo.CONFIG.PRICING_TABLE).value || [];
    const discount = getConfig(SankofaDemo.CONFIG.TRIAL_DISCOUNT_PCT).value || 0;
    const theme = getConfig(SankofaDemo.CONFIG.THEME_COLORS).value || {};

    const section = document.querySelector('.pricing-cta');
    if (!section) return;

    let grid = document.getElementById('sankofa-pricing-grid');
    if (!grid) {
      grid = document.createElement('div');
      grid.id = 'sankofa-pricing-grid';
      grid.style.cssText =
        'display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin:24px auto;max-width:860px;padding:0 24px';
      section.insertBefore(grid, section.querySelector('#pricing-cta'));
    }

    grid.innerHTML = '';
    const ordered = arm === 'B' ? [...tiers].reverse() : tiers;
    ordered.forEach(function (t) {
      const discounted = Math.max(0, t.price * (1 - discount));
      const card = document.createElement('div');
      card.style.cssText = [
        'border:1px solid #e5e7eb',
        'border-radius:12px',
        'padding:18px',
        'background:white',
        'text-align:left',
      ].join(';');
      card.innerHTML = [
        `<div style="font-weight:700;font-size:16px">${t.name}</div>`,
        `<div style="font-size:28px;font-weight:800;color:${theme.primary || '#e11d48'};margin-top:4px">$${discounted.toFixed(0)}<span style="font-size:13px;color:#64748b;font-weight:500"> /mo</span></div>`,
        discount > 0 && t.price > 0
          ? `<div style="font-size:11px;color:#b45309;margin-top:2px">${(discount * 100).toFixed(0)}% off trial</div>`
          : '',
        '<ul style="margin:10px 0 0;padding-left:18px;font-size:13px;color:#475569">' +
          t.features.map(function (f) { return '<li>' + f + '</li>'; }).join('') +
        '</ul>',
      ].join('');
      grid.appendChild(card);
    });

    // Label above the CTA — experiment arm indicator.
    let label = document.getElementById('sankofa-pricing-arm');
    if (!label) {
      label = document.createElement('p');
      label.id = 'sankofa-pricing-arm';
      label.style.cssText = 'font-size:12px;color:#64748b;margin-top:12px;text-align:center';
      section.appendChild(label);
    }
    label.textContent = 'Pricing experiment arm: ' + arm;
  }

  // ── Surface 5: support link ───────────────────────────────────────

  function applySupport() {
    const url = getConfig(SankofaDemo.CONFIG.SUPPORT_URL).value;
    let link = document.getElementById('sankofa-support-link');
    if (!link) {
      const footer = document.querySelector('footer');
      if (!footer) return;
      link = document.createElement('a');
      link.id = 'sankofa-support-link';
      link.style.cssText =
        'display:inline-block;margin:10px auto;color:#e11d48;font-weight:600;font-size:13px';
      footer.insertBefore(link, footer.querySelector('.copyright'));
    }
    link.textContent = '→ Contact support: ' + url;
    link.setAttribute('href', url);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noreferrer');
  }

  // ── Surface 6: AI summary panel ──────────────────────────────────

  function applyAIStatus() {
    const halted = getFlag(SankofaDemo.FLAGS.AI_SUMMARY_KILL_SWITCH).value;
    const onboardingV2 = getFlag(SankofaDemo.FLAGS.ONBOARDING_V2_ROLLOUT).value;
    const maxUploads = getConfig(SankofaDemo.CONFIG.MAX_UPLOADS_PER_DAY).value;

    let panel = document.getElementById('sankofa-ai-panel');
    if (!panel) {
      const container = document.querySelector('.features');
      if (!container) return;
      panel = document.createElement('div');
      panel.id = 'sankofa-ai-panel';
      panel.style.cssText =
        'display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;max-width:1100px;margin:24px auto;padding:0 24px';
      container.parentNode.insertBefore(panel, container.nextSibling);
    }
    panel.innerHTML = '';
    panel.appendChild(
      card(
        'AI summary',
        halted
          ? '<strong style="color:#dc2626">🛑 Paused</strong><br/><span style="color:#64748b">Halt webhook or manual flip set <code>ai_summary_kill_switch</code> to true.</span>'
          : '<strong>Ready for queries</strong><br/><span style="color:#64748b">Kill switch clear.</span>',
      ),
    );
    panel.appendChild(
      card(
        'Uploads',
        `<strong>${maxUploads}</strong> uploads/day<br/><span style="color:#64748b">Gated by <code>onboarding_v2_rollout</code>: <strong style="color:${onboardingV2 ? '#059669' : '#b91c1c'}">${onboardingV2 ? 'open' : 'coming soon'}</strong></span>`,
      ),
    );
  }

  function card(eyebrow, body) {
    const el = document.createElement('div');
    el.style.cssText = 'border:1px solid #e5e7eb;border-radius:12px;padding:16px;background:#f8fafc';
    el.innerHTML =
      '<div style="font-size:11px;font-weight:700;letter-spacing:1.4px;color:#64748b">' + eyebrow.toUpperCase() + '</div>' +
      '<div style="margin-top:8px;font-size:14px;line-height:1.5">' + body + '</div>';
    return el;
  }

  // ── Flags & Config Lab section ────────────────────────────────────

  function renderLab() {
    const host = document.getElementById('sankofa-lab');
    if (!host) return;

    const flagRows = Object.values(SankofaDemo.FLAGS).map(function (k) {
      const d = getFlag(k);
      return {
        key: k,
        description: SankofaDemo.FLAG_DESCRIPTIONS[k],
        value: d.variant ? d.variant + ' (' + String(d.value) + ')' : String(d.value),
        reason: d.reason,
        version: d.version,
      };
    });
    const configRows = Object.values(SankofaDemo.CONFIG).map(function (k) {
      const d = getConfig(k);
      let rendered;
      if (d.type === 'json')         rendered = JSON.stringify(d.value);
      else if (typeof d.value === 'string') rendered = '"' + d.value + '"';
      else                             rendered = String(d.value);
      return {
        key: k,
        description: SankofaDemo.CONFIG_DESCRIPTIONS[k],
        value: rendered + ' · ' + d.type,
        reason: d.reason,
        version: d.version,
      };
    });

    host.innerHTML = `
      <h2 style="margin:0 0 6px">Flags &amp; Config Lab</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 16px">
        Canonical demo keys driving every section above. Edit a flag in the dashboard and refresh
        to see the whole page repaint.
      </p>
      <h3 style="margin:20px 0 8px;font-size:14px;letter-spacing:1px;color:#64748b;text-transform:uppercase">Switch — flags</h3>
      ${rowsHtml(flagRows)}
      <h3 style="margin:24px 0 8px;font-size:14px;letter-spacing:1px;color:#64748b;text-transform:uppercase">Config — typed values</h3>
      ${rowsHtml(configRows)}
    `;
  }

  function rowsHtml(rows) {
    return rows
      .map(function (r) {
        return (
          '<div style="display:grid;grid-template-columns:1.1fr 1.2fr 120px 70px;gap:14px;padding:12px;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:8px;background:white;align-items:center;font-size:13px">' +
            '<div><div style="font-family:monospace;font-weight:700">' + r.key + '</div><div style="color:#64748b;font-size:11px;margin-top:3px">' + r.description + '</div></div>' +
            '<div style="font-family:monospace;color:#b91c1c;font-weight:600;word-break:break-all">' + r.value + '</div>' +
            '<div style="font-family:monospace;font-size:11px;color:#64748b">' + r.reason + '</div>' +
            '<div style="font-family:monospace;font-size:11px;color:#64748b;text-align:right">v' + r.version + '</div>' +
          '</div>'
        );
      })
      .join('');
  }
})();
