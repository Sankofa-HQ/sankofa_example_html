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

  return {
    FLAGS,
    CONFIG,
    FLAG_DEFAULTS,
    CONFIG_DEFAULTS,
    FLAG_DESCRIPTIONS,
    CONFIG_DESCRIPTIONS,
  };
})();
