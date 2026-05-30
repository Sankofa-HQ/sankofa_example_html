# Sankofa HTML example (vanilla JS, no bundler)

A static-site example that drives the full Sankofa Web SDK suite — Analytics, Catch (Crashlytics + Sentry merged), Switch, Config, Pulse, Replay — from plain `<script>` tags loaded straight from the jsDelivr CDN. **No bundler, no React, no build step, no vendored files** — every `@sankofa/*` module is pulled from `cdn.jsdelivr.net`, pinned to `@0.2.0`.

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
```

Every `@sankofa/*` module loads from the CDN in each page's `<head>`, e.g.:

```html
<script src="https://cdn.jsdelivr.net/npm/@sankofa/browser@0.2.0/dist/sankofa.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@sankofa/switch@0.2.0/dist/sankofa-switch.min.js"></script>
```

`@sankofa/browser` must load first — the other modules attach to the
`Sankofa` global it defines (`SankofaSwitch`, `SankofaConfig`, `SankofaCatch`,
`SankofaPulse`, `SankofaReplay`).

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

## Pinning a different SDK version

Every page pins `@0.2.0` in its CDN URLs. To move the demo to a newer
release, bump the version in each `<script src>` tag (jsDelivr also accepts a
range like `@0.2` or `@latest`, but an exact pin is reproducible).

The IIFE bundles served from the CDN are produced by each package's
`npm run bundle` (esbuild) step, which now runs automatically on
`prepublishOnly` so the published tarball always ships a fresh
`dist/*.min.js`. To preview an unreleased local build without publishing,
run `npm run bundle` in the package and point a `<script>` tag at the local
`dist/` file.

---

## Troubleshooting

### `[Sankofa demo] SankofaReplay global missing` (or another module missing)

The CDN `<script>` for that module didn't load — usually a network failure
or a version that predates the module being published. `js/analytics.js`
builds its plugin list defensively, so a single missing module is logged as a
warning and the rest of the SDK still initializes. Check the Network tab for
the failing `cdn.jsdelivr.net` request and confirm the pinned version exists.

### `Sankofa.withScope is not a function`

You've pinned a `@sankofa/browser` version that predates the Catch statics
(Phase A/B). Bump the `@sankofa/browser@…` version in every page's
`<script src>` to 0.2.0 or newer.

---

## Documentation

Full Web SDK reference: [docs.sankofa.dev/sdks/web](https://docs.sankofa.dev/sdks/web/overview).
