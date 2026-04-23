# Sankofa Catch — HTML crash gallery

`crashes.html` is a single page with one button per realistic browser crash class. Every event flows to `/api/catch/events` on your Sankofa dashboard, grouped by fingerprint, with the breadcrumb trail + live flag snapshot attached.

## Run it

**Don't open it via `file://`** — browsers block `fetch()` to `http://localhost:8080` from a `file://` origin (CORS), so no events will ship. Serve the folder over HTTP instead:

```bash
# From example/sankofa_example_html/
python3 -m http.server 5500
# → http://localhost:5500/crashes.html
```

…or any equivalent (`npx serve .`, `php -S localhost:5500`, Live Server VSCode extension, etc.).

Also make sure the Sankofa dashboard backend is running at the `endpoint` configured in `js/analytics.js` (default `http://localhost:8080`).

## What you'll see

Each button card triggers one of these crash classes:

| Button | Error class |
|---|---|
| TypeError: null property access | `TypeError` — null property read |
| ReferenceError: undeclared identifier | `ReferenceError` — typo / missing import |
| Unhandled promise rejection | `Error` via `unhandledrejection` |
| fetch() to invalid host | `TypeError` (network) + `captureException` with context |
| SyntaxError: JSON.parse on HTML | `SyntaxError` — upstream 502 HTML |
| Null DOM element | `TypeError` — `querySelector` returned null |
| RangeError: maximum call stack | `RangeError` — infinite recursion |
| Custom error (handled) | `CheckoutValidationError` + fingerprint + tags |
| Error inside setTimeout | Uncaught throw from timer callback |
| captureMessage (no exception) | Warning-level signal, no error object |
| Manual breadcrumb trail | 3 breadcrumbs pre-seeded → handled throw |

## Troubleshooting

### Console says `Uncaught TypeError: Cannot read properties of undefined (reading 'rrwebReplayPlugin')`

The Replay plugin's CDN build failed to load. After the fix in `js/analytics.js`, this is now logged as a warning (`[Sankofa demo] SankofaReplay global missing`) and the rest of the plugins — including Catch — still register. If you want Replay working on this page too, host `sankofa-replay.min.js` locally under `js/vendor/` and swap the `<script>` tag in `crashes.html`.

### `[Sankofa demo] SankofaCatch global missing` in console

Make sure `<script src="js/vendor/sankofa-catch.min.js"></script>` loads in the page. If you've edited the web SDK's `@sankofa/catch` package, rebuild its IIFE bundle and copy it over:

```bash
cd sdks/sankofa_sdk_web/packages/catch
npm run bundle
cp dist/sankofa-catch.min.js ../../../example/sankofa_example_html/js/vendor/
```

### Events don't show up in the dashboard

1. Confirm you opened the page via `http://` (not `file://`) — check the URL bar.
2. Open the browser's Network panel and look for `POST /api/catch/events`:
   - 2xx → event landed; refresh the Catch → Issues page.
   - `(failed)` with no response → backend isn't running at the configured endpoint.
   - `401` / `403` → wrong API key.
   - `CORS error` → backend isn't allowing your origin; add it to the project's Authorized Domains in Project Settings → Security & CORS.
3. Confirm you're looking at the right env in the dashboard (key starting with `sk_test_` routes to the Test dataset).
