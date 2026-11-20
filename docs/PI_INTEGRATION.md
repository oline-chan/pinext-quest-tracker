# Pi Integration — Quest Tracker

How this app integrates with Pi, and what Gondal still has to do in the
Developer Web Console. **Nothing in this repo registers, submits, or pays
anything. No Pi account, API key, or personal data is in this repo.**

## What is integrated (code, already in this repo)

| Pi feature | Where | Status |
|---|---|---|
| Pi SDK load | `public/index.html` — `<script src="https://sdk.minepi.com/pi-sdk.js">` | Done |
| `Pi.init({ version: "2.0", sandbox: true })` | `public/app.js` — `initPi()` | Done, sandbox ON in dev |
| Pi Authentication | `public/app.js` — `signInWithPi()` calls `Pi.authenticate(['username', 'payments'], onIncompletePaymentFound)` | Done, runs only in Pi Browser |
| Backend auth verify | `POST /api/auth/verify` in `server.js` | Done — calls `GET https://api.minepi.com/v2/me` with `Authorization: Bearer <accessToken>` from `Pi.authenticate()` (per the official Pi Developer Guide, `/v2/me` takes the Pioneer's access token, NOT the Server API Key; the earlier version wrongly sent `Key <PI_API_KEY>` and would 401 — fixed 2026-11-21). Needs no `PI_API_KEY`. |
| Pi payments (create) | `public/app.js` — `unlockPremium()` calls `Pi.createPayment({ amount: 1, memo: "Premium Quest Pack", metadata }, callbacks)` | Done |
| Server-side approval | `POST /api/payments/approve` in `server.js` | Done; calls `POST https://api.minepi.com/v2/payments/:id/approve` only when `PI_API_KEY` is set, otherwise records `approved-sandbox` |
| Server-side completion | `POST /api/payments/complete` in `server.js` | Done; calls `POST https://api.minepi.com/v2/payments/:id/complete` only when `PI_API_KEY` is set, otherwise records `completed-sandbox` and unlocks premium |
| PiNet | PiNet lets people outside Pi Browser try part of the app in a standard browser. This app is a standard web app, so it can be opened via PiNet once registered — see steps below. | Code-ready, registration pending |
| Share dialog | `Pi.openShareDialog` in `public/app.js` (falls back to Web Share API) | Done |

## The payment flow, step by step

1. User taps "Unlock Premium Quest Pack — 1 Pi (Sandbox)".
2. `Pi.createPayment` opens the Pi payment sheet in Pi Browser.
3. User reviews and submits. The SDK calls `onReadyForServerApproval(paymentId)`.
4. Frontend posts `paymentId` to `POST /api/payments/approve`. The server
   verifies the amount is exactly 1 Pi, then — in production — approves it
   with the Pi Platform API using the server-side `PI_API_KEY`.
5. The SDK calls `onReadyForServerCompletion(paymentId, txid)`.
6. Frontend posts to `POST /api/payments/complete`. The server completes
   it with the Platform API, records it, and unlocks the premium pack.
7. If a payment is incomplete, `onIncompletePaymentFound` hands it to
   `/api/payments/complete` so the user is not stuck.

**Sandbox vs production:** with `sandbox: true` and no `PI_API_KEY`, no real
Pi moves and the server honestly records `approved-sandbox` /
`completed-sandbox`. Switch to production only after registering the app,
getting the API key, and setting `sandbox: false` in `Pi.init` — and only
with Gondal's approval.

## What Gondal must do (in Pi Browser, with his own Pi account)

1. **Create a Pi account** (if he does not have one) and install **Pi Browser** on his phone.
2. Open the **Developer Web Console** at https://developers.minepi.com/
   (sign in by scanning the QR code with Pi Browser) and open the **Hackathon** tab.
3. **Register for Pi Next** there. All team members must register individually.
4. In the Web Console, **create/register the Quest Tracker app**: English name
   "Quest Tracker", accurate English description, the logo in `public/logo.svg`
   (check it against Pi's trademark guidelines — it is an original mark, not
   the Pi logo), preview images from `previews/`, and the privacy policy at
   `/privacy.html`.
5. Configure the **Development URL** (for sandbox testing) and the production URL.
6. Get the **Pi Platform API key** from the app dashboard (Settings >
   Add-ons > API key > "Generate new key"). Full safe procedure, auth
   table (`Bearer` for `/v2/me`, `Key` for `/v2/payments/...`), and how
   the server uses it: see [`docs/PI_API_KEY.md`](PI_API_KEY.md). Put it
   in the server environment as `PI_API_KEY` — server-side only, never
   in the frontend, never in git, never in chat. The key is shown ONCE;
   if lost, generate a new one (the old one stops working) and update
   it everywhere it is set.
7. Deploy the app to a public HTTPS URL — see
   [`docs/DEPLOY.md`](DEPLOY.md) (recommended: Render free, no credit
   card; `render.yaml` is ready in this repo). Then in the Web Console
   do **Deploy to Staging (Testnet)** with that URL and upload the icon
   `public/icon-1024.png` (1024×1024 PNG, rendered from `logo.svg`).
8. Optionally use the Web Console's AI coding agent (MCP): add the MCP server
   `pi-app-studio` at `https://developers.minepi.com/mcp` to the coding agent
   (Cursor / Claude Code / any MCP client), then prompt it:
   `Read https://developers.minepi.com/appstudio/agents.md and follow its instructions to onboard this app to Pi Network.`
   The agent should ask for confirmation before registering the app, adding
   staging/production URLs, setting up wallet/payments, or submitting for review.
9. **Test in Pi Browser sandbox**: sign in, complete a quest, run the 1 Pi
   sandbox payment (needs Test-Pi in the Pi Wallet), check the leaderboard.
10. **PiNet**: in the Web Console, enable PiNet so people outside Pi Browser
    can try part of the app in a standard web browser.
11. Make the **demo video (≤3 minutes)**, post it publicly on YouTube or
    another video platform, and submit the app in the Web Console before
    **Tuesday, 5 January 2027, 11:59 PM PST**. Only one team member submits
    each app. The video must cover: what the app is, a feature walkthrough,
    who it is for, the problem it solves, and how Pi is part of it
    (Pi Sign-in / Pi payments).

## Sources

- Pi Next: https://minepi.com/pi-next/
- Developer portal: https://developers.minepi.com/
- Pi SDK reference: https://raw.githubusercontent.com/pi-apps/pi-platform-docs/master/SDK_reference.md
- Pi App Platform SDK guide: https://pi-apps.github.io/community-developer-guide/docs/gettingStarted/piAppPlatform/piAppPlatformSDK/
