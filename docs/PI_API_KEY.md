# Pi Server API Key — generate it safely, use it correctly

App: **Quest Tracker**, App ID `6b00ae2dd54a71cf5a29533f`,
account `@olineManuelL`, Staging (Testnet), status Draft.
**Status: the key has NOT been generated yet.** Nothing in this repo
contains a real key, and no key was generated while writing this guide
— generating it from a cloud browser would lose it the same way the
Meko key was lost (shown once, no way to retrieve it afterwards).

## Where the key lives

In the Pi Developer Web Console, on the app's dashboard:

**Quest Tracker > Settings > Add-ons > API key**

The console text (verified 2026-11-21) says: *"Your app's server uses
this key to call the Pi API (Authorization: Key …). Keep it secret."*
and *"Pi shows a key only once, when it is generated. Lost it?
Generate a new one — your previous key will stop working."*

## How to generate it (Gondal, or the parent agent with him)

1. Open the Web Console (signed in as `@olineManuelL` — QR sign-in via
   Pi Browser if the session expired) and open the Quest Tracker app.
2. Go to **Settings > Add-ons > API key** and click
   **"Generate new key"**.
3. **Copy the key immediately.** It is shown once and can never be
   shown again. Do NOT screenshot it into chat, do NOT paste it in
   chat, do NOT put it in any file that goes to git.
4. Paste it **only** into the Secure Vault entry the parent agent
   sends (the `credentials.request_api_access` card for provider
   `meko`-style custom connector — for Pi it is the same flow with
   provider `pi`), **or** straight into the Render dashboard as the
   `PI_API_KEY` environment variable (Render > service > Environment).
   Either route keeps the value out of chat and out of git.
5. If the key is ever lost or exposed: generate a new one in the same
   place. The old key stops working immediately — then update
   `PI_API_KEY` everywhere it is set (Render env vars) to the new one.

## What the key is for — and what it is NOT for

Two different authorization methods exist in the Pi Platform API
(official Pi Developer Guide, "Pi App Platform APIs",
https://pi-apps.github.io/community-developer-guide/docs/gettingStarted/piAppPlatform/piAppPlatformAPIs/):

| Endpoint | Authorization | Used by |
|---|---|---|
| `GET https://api.minepi.com/v2/me` | `Authorization: Bearer <Pioneer's access token>` | `POST /api/auth/verify` — the access token comes from `Pi.authenticate()` in Pi Browser. **NOT the Server API Key.** |
| `GET https://api.minepi.com/v2/payments/{payment_id}` | `Authorization: Key <Server API Key>` | Server-side payment lookup (not used by this app yet). |
| `POST https://api.minepi.com/v2/payments/{payment_id}/approve` | `Authorization: Key <Server API Key>` | `POST /api/payments/approve` in `server.js`. |
| `POST https://api.minepi.com/v2/payments/{payment_id}/complete` (body `{ "txid": "<txid>" }`) | `Authorization: Key <Server API Key>` | `POST /api/payments/complete` in `server.js`. |

Rules from the same guide:

- **Never create payments with the Platform API.** Payments are
  created only by the client-side SDK (`Pi.createPayment`); the server
  only approves and completes them.
- **Never put the Server API Key in client-side code.** It lives only
  in the server environment (`PI_API_KEY`).

## Bug fixed 2026-11-21: `/api/auth/verify` used the wrong header

The old `server.js` called `GET /v2/me` with
`Authorization: Key <PI_API_KEY>` — which Pi rejects (401) — and it
refused to verify at all when no key was set. Per the official guide,
`/v2/me` takes the **Pioneer's access token** (`Bearer`), so the
endpoint was fixed to:

```js
fetch("https://api.minepi.com/v2/me", {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

It now needs **no** `PI_API_KEY` at all, and it compares the returned
`uid` with the `uid` the client sent (when provided). Verified by test
2026-11-21: with a fake token Pi answers 401 → the endpoint honestly
returns `{ verified: false, ... }` instead of hanging or crashing.

## How the server uses the key (verified in code)

`server.js` reads the key once at startup:

```js
const PI_API_KEY = process.env.PI_API_KEY || "";
```

- `GET /api/health` reports `piApiKeyConfigured: true/false` (never
  the value itself).
- `POST /api/payments/approve` — verifies the amount is exactly 1 Pi,
  then, only when `PI_API_KEY` is set and the payment is not a `dev-`
  simulation, calls `POST /v2/payments/{id}/approve` with
  `Authorization: Key <PI_API_KEY>`. Without a key it records
  `approved-sandbox` and never claims a real approval.
- `POST /api/payments/complete` — same pattern with
  `POST /v2/payments/{id}/complete`, body `{ "txid": "<txid>" }`.
  Without a key it records `completed-sandbox` and unlocks premium.
- The frontend (`public/app.js`) never sees the key. The sandbox flag
  for `Pi.init()` comes from the server (`/api/health` → `piSandbox`,
  driven by `PI_SANDBOX`), so switching Staging → Production is one
  env-var change, not a code edit.

## Testing after the key is set

1. On Render (or locally with `PI_API_KEY=<key> node server.js` —
   never type the real key into a shared terminal log), open
   `/api/health`: `piApiKeyConfigured` must be `true`.
2. In Pi Browser (sandbox), sign in and buy the Premium Quest Pack
   (1 Test-Pi). The server log / `/api/payments` should show
   `status: "approved"` then `"completed"` — **not** `*-sandbox`.
3. If approval fails with a 502, the Pi Platform API refused it — check
   that the key belongs to **this** app (Staging key for the Staging
   app) and that the payment was created in the same network (Testnet).
   A Staging app key does not work for Mainnet payments and vice versa.

## Sources

- Pi App Platform APIs (official guide):
  https://pi-apps.github.io/community-developer-guide/docs/gettingStarted/piAppPlatform/piAppPlatformAPIs/
- Pi Developer Web Console: https://developers.minepi.com/
- This repo: `server.js` (`/api/auth/verify`, `/api/payments/approve`,
  `/api/payments/complete`), `docs/PI_INTEGRATION.md`,
  `docs/DEPLOY.md`.
