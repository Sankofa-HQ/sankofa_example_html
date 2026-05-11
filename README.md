# Sankofa HTML example (vanilla JS, no bundler)

A static-site example that drives the full Sankofa Web SDK suite — Analytics, Catch (Crashlytics + Sentry merged), Switch, Config, Pulse, Replay — from plain `<script>` tags. **No bundler, no React, no build step** other than vendoring the IIFE builds of each `@sankofa/*` package.

Use this when you want to:

- Drop Sankofa onto a marketing site, landing page, or legacy CMS-rendered HTML.
- See the SDK's behaviour without any framework noise.
- Exercise the IIFE bundles directly (the same builds that get served from a CDN).

---

## Layout

```
sankofa_example_html/
  index.html        landing page
  signup.html       sign-up form (event tracking + Pulse trigger)
  pricing.html      pricing CTAs
  crashes.html      crash gallery — fires every Catch scenario
  pages/            extra demo pages
  css/              styles
  js/
    analytics.js    Sankofa.init + every plugin wired (Switch, Config, Catch, Pulse, Replay)
    crashes.js      crash gallery scenarios incl. Phase A/B demos
    interactions.js form submits + identify
    pulse-lab.js    Pulse survey runtime preview
    vendor/         IIFE bundles for each @sankofa/* package
```

---

## Run

**Don't open via `file://`** — browsers block `fetch()` to `http://localhost:8080` from a `file://` origin (CORS). Serve over HTTP:

```bash
# From example/sankofa_example_html/
python3 -m http.server 5500
# → http://localhost:5500
```

…or `npx serve .`, `php -S localhost:5500`, the VSCode Live Server extension, etc.

Make sure the Sankofa engine is running at the URL configured in `js/analytics.js` (default `http://localhost:8080`).

---

## What it demonstrates

### Analytics (`js/analytics.js`)

- `Sankofa.init` with every plugin registered.
- `Sankofa.screen(pageName)` per page.
- Click + scroll-depth + form-submit tracking.
- `Sankofa.identify` + `Sankofa.setPerson` on form submit.

### Catch crash gallery (`crashes.html` + `js/crashes.js`)

| Button | Phase | What it does |
|---|---|---|
| TypeError: null property access | — | Reads `.length` on undefined |
| ReferenceError: undeclared identifier | — | Calls an undeclared global |
| Unhandled promise rejection | — | Async path with no `.catch()` |
| fetch() to invalid host | — | Network error + manual `captureException` |
| SyntaxError: JSON.parse on HTML | — | Upstream returned 502 HTML |
| Null DOM element | — | `querySelector` returned null |
| RangeError: maximum call stack | — | Infinite recursion |
| Custom error (handled) | — | `CheckoutValidationError` + fingerprint + tags |
| Error inside setTimeout | — | Uncaught throw from timer callback |
| captureMessage (no exception) | — | Warning-level signal, no error object |
| Manual breadcrumb trail | — | 3 breadcrumbs pre-seeded → handled throw |
| **Sankofa.log() breadcrumb** | A | Crashlytics-style log() + manual capture |
| **withScope — temporary overlay** | B | Tags + level + extras on ONE capture only |
| **withScope — nested scopes** | B | Inner inherits + extends outer |
| **beforeSend — see analytics.js** | B | Fires events the hook drops / scrubs |

### Phase B `beforeSend` (`js/analytics.js`)

`catchPlugin({ beforeSend: ... })` is wired at init:

- Drops events whose message contains `"[noise]"`.
- Scrubs `user_email` from `extra` so PII doesn't leak.

### Pulse lab (`js/pulse-lab.js`)

Demonstrates `SankofaPulse.show(surveyId)` + the in-app survey runtime.

---

## Vendored bundles

Each `@sankofa/*` package ships an IIFE build for use without a bundler. The bundles in `js/vendor/` are pre-built and checked in. If you've edited any package's TypeScript source, rebuild the bundle and copy it over:

```bash
# From sdks/sankofa_sdk_web/
cd packages/browser && npm run bundle && \
  cp dist/sankofa.min.js ../../../example/sankofa_example_html/js/vendor/

cd ../catch && npm run bundle && \
  cp dist/sankofa-catch.min.js ../../../example/sankofa_example_html/js/vendor/

# Repeat for switch / config / pulse / replay-rrweb as needed.
```

The `Sankofa.captureException`, `Sankofa.log`, `Sankofa.withScope`, etc. statics (Phase A/B) live on the **browser** IIFE — so if those aren't working in the gallery, rebuild `@sankofa/browser` first.

---

## Troubleshooting

### `Uncaught TypeError: Cannot read properties of undefined (reading 'rrwebReplayPlugin')`

The Replay plugin's CDN build failed to load. After the fix in `js/analytics.js`, this is logged as a warning (`[Sankofa demo] SankofaReplay global missing`) and the rest of the plugins — including Catch — still register. To use Replay, host `sankofa-replay.min.js` locally under `js/vendor/` and swap the `<script>` tag.

### `[Sankofa demo] SankofaCatch global missing` in console

Make sure `<script src="js/vendor/sankofa-catch.min.js"></script>` loads before `js/analytics.js` in the page. If you've edited `@sankofa/catch`, rebuild and copy as above.

### `Sankofa.withScope is not a function`

The vendored `js/vendor/sankofa.min.js` predates Phase B. Rebuild `@sankofa/browser` per the steps above.

---

## Documentation

Full Web SDK reference: [docs.sankofa.dev/sdks/web](https://docs.sankofa.dev/sdks/web/overview).
