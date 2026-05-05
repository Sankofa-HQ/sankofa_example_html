/* global Sankofa, SankofaPulse, SankofaDemo */

/**
 * Pulse Lab — paints into <section id="sankofa-pulse-lab">.
 *
 * Mirrors the Pulse Lab UIs in the iOS / Android / Flutter / RN / web
 * examples so a customer comparing platforms sees the same surface
 * everywhere. Drives every public Pulse SDK method:
 *   • `getPulse().on(event, listener)` — lifecycle event log
 *   • `getPulse().show(surveyId, opts)` — open a modal
 *   • `getPulse().getActiveMatchingSurveys()` — refresh badge
 *
 * The "Pro user" toggle forwards `userProperties.plan` so the gated
 * `psv_demo_product_research` survey only matches when on.
 */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  let proUser = false;
  const events = [];
  let mountEl = null;

  ready(function () {
    mountEl = document.getElementById('sankofa-pulse-lab');
    if (!mountEl) return;
    if (typeof SankofaPulse === 'undefined' || !SankofaPulse.getPulse) {
      mountEl.innerHTML = '<p style="color:#94a3b8">Pulse SDK not loaded — check js/vendor/sankofa-pulse.min.js</p>';
      return;
    }
    render();
    subscribe();
  });

  function subscribe() {
    const api = SankofaPulse.getPulse();
    if (!api) {
      // Plugin still resolving — Sankofa.init lifecycle is async.
      setTimeout(subscribe, 200);
      return;
    }
    const eventNames = ['survey_shown', 'survey_dismissed', 'survey_completed', 'survey_partial_saved'];
    for (const ev of eventNames) {
      api.on(ev, function (payload) {
        events.unshift({
          event: payload.event,
          surveyId: payload.surveyId,
          responseId: payload.responseId,
          reason: payload.reason,
          timestamp: new Date().toLocaleTimeString(),
        });
        if (events.length > 50) events.length = 50;
        render();
      });
    }
  }

  function render() {
    if (!mountEl) return;
    const registered = !!SankofaPulse.getPulse();
    const surveys = SankofaDemo.SURVEYS;
    const titles = SankofaDemo.SURVEY_TITLES;
    const descriptions = SankofaDemo.SURVEY_DESCRIPTIONS;

    mountEl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <header>
          <h2 style="margin:0;font-size:22px;font-weight:800">Sankofa Pulse Lab</h2>
          <p style="margin:6px 0 0;color:#475569;font-size:13px">
            In-app surveys driven by the Sankofa Pulse SDK. Surveys come from the
            <code>seed_pulse</code> Go command on the local engine.
          </p>
        </header>

        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <div class="pulse-card pulse-status">
            <div class="eyebrow">${registered ? 'REGISTERED' : 'NOT REGISTERED'}</div>
            <p style="margin:6px 0 0;font-weight:600">
              ${registered
                ? 'Pulse plugin active — handshakes flow.'
                : 'Pulse plugin missing. Confirm pulsePlugin() is in Sankofa.init({plugins})'}
            </p>
          </div>
          <div class="pulse-card">
            <div class="eyebrow">HOST CONTEXT</div>
            <label style="display:flex;align-items:center;gap:8px;margin-top:6px;cursor:pointer">
              <input type="checkbox" id="pulse-pro-toggle" ${proUser ? 'checked' : ''} />
              <span><strong>Pro user</strong></span>
            </label>
            <p style="margin:4px 0 0;color:#64748b;font-size:11px">
              Forwarded as <code>userProperties.plan = "${proUser ? 'pro' : 'free'}"</code>.
            </p>
          </div>
        </div>

        <div class="eyebrow" style="margin-top:6px">DEMO SURVEYS</div>
        <div style="display:grid;gap:10px">
          ${[surveys.NPS_AFTER_CHECKOUT, surveys.CSAT_SUPPORT, surveys.PRODUCT_RESEARCH]
            .map(id => surveyCardHtml(id, titles[id], descriptions[id]))
            .join('')}
        </div>

        <div class="eyebrow" style="margin-top:6px">EVENT LOG</div>
        <div id="pulse-event-log" style="display:flex;flex-direction:column;gap:6px;max-height:300px;overflow:auto">
          ${events.length === 0
            ? '<p style="color:#64748b;font-size:12px;margin:0">No events yet — try Show on a survey above.</p>'
            : events.map(eventRowHtml).join('')}
        </div>
      </div>
      <style>
        #sankofa-pulse-lab .eyebrow {
          color:#64748b;font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;
        }
        #sankofa-pulse-lab .pulse-card {
          flex:1 1 220px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;
        }
        #sankofa-pulse-lab .pulse-status { border-color:${registered ? '#22c55e' : '#ef4444'}33; }
        #sankofa-pulse-lab .survey-card {
          background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:8px;
        }
        #sankofa-pulse-lab .survey-card .id {
          font-family:ui-monospace,SFMono-Regular,monospace;color:#64748b;font-size:11px;
        }
        #sankofa-pulse-lab .survey-card .title { font-weight:700;color:#0f172a;font-size:15px; }
        #sankofa-pulse-lab .survey-card .desc { color:#475569;font-size:12px;margin:0; }
        #sankofa-pulse-lab .btn-row { display:flex;gap:8px; }
        #sankofa-pulse-lab .btn-pulse {
          flex:1;border:0;padding:10px;border-radius:6px;background:#f5a623;color:#0f172a;font-weight:700;cursor:pointer;
        }
        #sankofa-pulse-lab .btn-pulse-outline {
          flex:1;border:1px solid #f5a623;padding:10px;border-radius:6px;background:#fff;color:#b45309;font-weight:600;cursor:pointer;
        }
        #sankofa-pulse-lab .eligibility {
          font-family:ui-monospace,SFMono-Regular,monospace;font-size:11px;color:#9d174d;background:#fce7f3;padding:4px 8px;border-radius:6px;align-self:flex-start;
        }
        #sankofa-pulse-lab .event-row {
          background:#0f172a;color:#cbd5e1;border-radius:6px;padding:8px 10px;font-family:ui-monospace,SFMono-Regular,monospace;font-size:11px;
        }
        #sankofa-pulse-lab .event-row .ev { color:#f5a623;font-weight:700; }
        #sankofa-pulse-lab .event-row .ts { color:#64748b;float:right; }
      </style>
    `;

    bindEvents();
  }

  function surveyCardHtml(id, title, desc) {
    const eligibility = lastEligibility[id];
    return `
      <div class="survey-card" data-survey="${id}">
        <div class="title">${title || id}</div>
        <div class="id">${id}</div>
        <p class="desc">${desc || ''}</p>
        ${eligibility ? `<span class="eligibility">${eligibility}</span>` : ''}
        <div class="btn-row">
          <button class="btn-pulse" data-action="show" data-survey="${id}">Show</button>
          <button class="btn-pulse-outline" data-action="check" data-survey="${id}">Check eligibility</button>
        </div>
      </div>
    `;
  }

  function eventRowHtml(entry) {
    const extra = entry.responseId
      ? `<div>response_id: ${entry.responseId}</div>`
      : entry.reason ? `<div>reason: ${entry.reason}</div>` : '';
    return `
      <div class="event-row">
        <span class="ev">${entry.event}</span>
        <span class="ts">${entry.timestamp}</span>
        <div>${entry.surveyId}</div>
        ${extra}
      </div>
    `;
  }

  const lastEligibility = {};

  function bindEvents() {
    const toggle = document.getElementById('pulse-pro-toggle');
    if (toggle) {
      toggle.addEventListener('change', () => {
        proUser = toggle.checked;
        // Clear cached eligibility — the answer depends on the toggle.
        for (const k of Object.keys(lastEligibility)) delete lastEligibility[k];
        render();
      });
    }
    document.querySelectorAll('#sankofa-pulse-lab [data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-survey');
        if (!id) return;
        const api = SankofaPulse.getPulse();
        if (!api) return;
        const userProperties = { plan: proUser ? 'pro' : 'free' };
        if (action === 'show') {
          api.show(id, { userProperties }).catch((err) => {
            console.warn('[Pulse Lab] show failed', err);
          });
        } else if (action === 'check') {
          // The web SDK's `show()` runs the targeting evaluator
          // internally; there's no public `isEligible` yet, so we
          // reuse `getActiveMatchingSurveys()` which returns the
          // currently eligible list. If the survey is in the list,
          // it's eligible right now.
          api.getActiveMatchingSurveys().then((list) => {
            const hit = (list || []).some(s => s && s.id === id);
            lastEligibility[id] = hit ? '✅ eligible' : '🚫 not currently eligible';
            render();
          }).catch(() => {
            lastEligibility[id] = '🚫 lookup failed';
            render();
          });
        }
      });
    });
  }
})();
