/* global Sankofa, SankofaSwitch, SankofaConfig */

/**
 * Canonical demo keys — identical across every Sankofa example
 * (web, react-native, html, ios, android, flutter). One dashboard
 * config row drives every client.
 */
window.SankofaDemo = (function () {
  const FLAGS = {
    NEW_HOME_LAYOUT: 'new_home_layout',
    CHECKOUT_CTA_VARIANT: 'checkout_cta_variant',
    ONBOARDING_V2_ROLLOUT: 'onboarding_v2_rollout',
    AI_SUMMARY_KILL_SWITCH: 'ai_summary_kill_switch',
    AB_PRICING_PAGE: 'ab_pricing_page',
    PREMIUM_BADGE_VISIBLE: 'premium_badge_visible',
  };
  const CONFIG = {
    SUPPORT_URL: 'support_url',
    MAX_UPLOADS_PER_DAY: 'max_uploads_per_day',
    TRIAL_DISCOUNT_PCT: 'trial_discount_pct',
    MAINTENANCE_BANNER_ENABLED: 'maintenance_banner_enabled',
    PRICING_TABLE: 'pricing_table',
    THEME_COLORS: 'theme_colors',
  };

  const FLAG_DEFAULTS = {
    [FLAGS.NEW_HOME_LAYOUT]:        { value: false, reason: 'local_default', version: 0 },
    [FLAGS.CHECKOUT_CTA_VARIANT]:   { value: true, variant: 'control', reason: 'local_default', version: 0 },
    [FLAGS.ONBOARDING_V2_ROLLOUT]:  { value: false, reason: 'local_default', version: 0 },
    [FLAGS.AI_SUMMARY_KILL_SWITCH]: { value: false, reason: 'local_default', version: 0 },
    [FLAGS.AB_PRICING_PAGE]:        { value: true, variant: 'A', reason: 'local_default', version: 0 },
    [FLAGS.PREMIUM_BADGE_VISIBLE]:  { value: true, reason: 'local_default', version: 0 },
  };
  const CONFIG_DEFAULTS = {
    [CONFIG.SUPPORT_URL]:                { value: 'https://support.sankofa.dev', type: 'string', reason: 'local_default', version: 0 },
    [CONFIG.MAX_UPLOADS_PER_DAY]:        { value: 25, type: 'int', reason: 'local_default', version: 0 },
    [CONFIG.TRIAL_DISCOUNT_PCT]:         { value: 0.2, type: 'float', reason: 'local_default', version: 0 },
    [CONFIG.MAINTENANCE_BANNER_ENABLED]: { value: false, type: 'bool', reason: 'local_default', version: 0 },
    [CONFIG.PRICING_TABLE]: {
      value: [
        { name: 'Starter',    price: 0,   features: ['1 project', '1k events/mo'] },
        { name: 'Pro',        price: 49,  features: ['Unlimited projects', '1M events/mo', 'Replay'] },
        { name: 'Enterprise', price: 199, features: ['SSO', 'Priority support', 'Audit log'] },
      ],
      type: 'json', reason: 'local_default', version: 0,
    },
    [CONFIG.THEME_COLORS]: {
      value: { primary: '#e11d48', accent: '#6366f1' },
      type: 'json', reason: 'local_default', version: 0,
    },
  };

  const FLAG_DESCRIPTIONS = {
    [FLAGS.NEW_HOME_LAYOUT]:        'Swap hero between classic and v2.',
    [FLAGS.CHECKOUT_CTA_VARIANT]:   'A/B/C variant — CTA copy + colour.',
    [FLAGS.ONBOARDING_V2_ROLLOUT]:  'Progressive rollout gate.',
    [FLAGS.AI_SUMMARY_KILL_SWITCH]: 'Halt webhook pauses AI summary.',
    [FLAGS.AB_PRICING_PAGE]:        'Variant A/B — reorder pricing tiers.',
    [FLAGS.PREMIUM_BADGE_VISIBLE]:  'Show/hide the premium badge.',
  };
  const CONFIG_DESCRIPTIONS = {
    [CONFIG.SUPPORT_URL]:                'String — support link target.',
    [CONFIG.MAX_UPLOADS_PER_DAY]:        'Int — upload quota shown to the user.',
    [CONFIG.TRIAL_DISCOUNT_PCT]:         'Float 0–1 — trial pricing discount.',
    [CONFIG.MAINTENANCE_BANNER_ENABLED]: 'Bool — amber maintenance banner.',
    [CONFIG.PRICING_TABLE]:              'JSON — pricing tiers.',
    [CONFIG.THEME_COLORS]:               'JSON {primary, accent} — theme tokens.',
  };

  // Canonical Pulse demo survey IDs — match the `seed_pulse` server
  // command and every other example app.
  const SURVEYS = {
    NPS_AFTER_CHECKOUT: 'psv_demo_nps_checkout',
    CSAT_SUPPORT:       'psv_demo_csat_support',
    PRODUCT_RESEARCH:   'psv_demo_product_research',
  };
  const SURVEY_TITLES = {
    [SURVEYS.NPS_AFTER_CHECKOUT]: 'Post-checkout NPS',
    [SURVEYS.CSAT_SUPPORT]:       'Support CSAT',
    [SURVEYS.PRODUCT_RESEARCH]:   'Pro product research',
  };
  const SURVEY_DESCRIPTIONS = {
    [SURVEYS.NPS_AFTER_CHECKOUT]: '11-point NPS with branching follow-up. Sampled at 50%.',
    [SURVEYS.CSAT_SUPPORT]:       '5-point CSAT after a closed support ticket.',
    [SURVEYS.PRODUCT_RESEARCH]:   'Multi-question research panel, gated to plan = pro.',
  };

  return {
    FLAGS,
    CONFIG,
    FLAG_DEFAULTS,
    CONFIG_DEFAULTS,
    FLAG_DESCRIPTIONS,
    CONFIG_DESCRIPTIONS,
    SURVEYS,
    SURVEY_TITLES,
    SURVEY_DESCRIPTIONS,
  };
})();
