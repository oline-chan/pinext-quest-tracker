# Deploy — Quest Tracker to a public HTTPS URL

App: **Quest Tracker** (Pi Next), App ID `6b00ae2dd54a71cf5a29533f`,
account `@olineManuelL`, Staging (Testnet), status Draft in the Pi
Developer Web Console. The console's next step is **"Deploy to Staging
(Testnet)": deploy to a public HTTPS URL and verify ownership.**

The app is a plain Node.js 18+ server (`server.js`, stdlib only, zero npm
dependencies) serving `public/` and a JSON-file store (`data/db.json`).
It reads `PORT` from the environment, so it runs on any host that gives
it a port. **No money was spent, no account was created, no deploy was
run while writing this guide** — the remaining steps below need a human
with the GitHub / Render account (see "What still needs Gondal").

## Recommended option: Render (free, no credit card) — DO THIS ONE

Verified from Render's own docs and 2026 pricing comparisons (checked
2026-11-21):

- **Free web service, no credit card required.** 750 instance hours/month,
  512 MB RAM, HTTPS URL like `https://pinext-quest-tracker.onrender.com`.
- Deploy straight from the GitHub repo
  (`github.com/oline-chan/pinext-quest-tracker`): Render detects Node,
  `npm install` then `node server.js`.
- **Catch (honest): the free service sleeps after 15 minutes of
  inactivity.** The next visitor waits ~30–60 seconds while it wakes.
  That is fine for the hackathon demo and for Pi's deploy verification —
  Pi only needs the URL to answer while it verifies. It is not
  production hosting, and the JSON-file store (`data/db.json`) is wiped
  on redeploy/restart on Render free. For a hackathon demo that is
  acceptable; swap in a real database before any public launch.
- `render.yaml` in this repo is a ready Blueprint for exactly this
  service (free plan, `PI_SANDBOX=true`, `PI_API_KEY` as a dashboard-only
  secret).

### Steps (Render)

1. Sign up at https://dashboard.render.com/register — with **GitHub**
   (the `oline-chan` account) or email. No credit card is asked for on
   the free tier. (This step needs Gondal or the parent agent: account
   creation needs the GitHub login / email verification, which this
   subagent cannot do.)
2. **New > Web Service** (or **New > Blueprint** and pick this repo —
   the Blueprint reads `render.yaml`).
3. Connect the repo `oline-chan/pinext-quest-tracker`, branch `main`.
4. Confirm: Runtime **Node**, Build Command `npm install`,
   Start Command `node server.js`, Instance Type **Free**.
5. Environment variables:
   - `PI_SANDBOX` = `true` (Staging/Testnet for now)
   - `PI_API_KEY` = *(leave empty until the key is generated — see
     `docs/PI_API_KEY.md`; set it in the Render dashboard, never in git)*
   - `PORT` is set by Render itself — do not override it.
6. **Create Web Service.** Render builds and gives a live HTTPS URL,
   e.g. `https://pinext-quest-tracker.onrender.com`.
7. Check it: open `<url>/api/health` — expect
   `{"ok":true,"app":"pinext-quest-tracker","piSandbox":true,...}`.
   The first load after idle can take ~1 minute (cold start).
8. In the Pi Web Console (app dashboard > Overview), click
   **Deploy to Staging (Testnet)**, enter the Render URL as the Public
   URL, and complete Pi's ownership verification. Then set the
   Development URL to the same URL (or to `http://localhost:3000` for
   local testing — Development URL is only for the dev machine).
9. Upload the app icon in the console: **Settings > General > Icon** —
   use `public/icon-1024.png` (square PNG, exactly 1024×1024, rendered
   from `public/logo.svg`). The icon is an original checkmark mark, not
   the Pi logo — still check it against Pi's trademark guidelines.
10. Generate the Pi Server API Key (Settings > Add-ons > API key) and
    set it as `PI_API_KEY` in Render (Environment). See
    `docs/PI_API_KEY.md` — the key is shown **once**.

## Options evaluated and rejected

| Option | Verdict | Why |
|---|---|---|
| **Render free** | ✅ Use this | No card, real Node server, git deploy, stable HTTPS URL. Sleeps when idle — acceptable. |
| **Cloudflare Quick Tunnel** (`trycloudflare.com`) | ❌ Not from this VM; only as a throwaway test elsewhere | Free, no account, one command — but the URL is random and changes on every restart, dies when the process stops, and has no uptime guarantee. **Tested 2026-11-21 from this VM: FAILED.** `cloudflared` (v2026.11.1) downloads and runs, but requesting a tunnel fails with `tls: first record does not look like a TLS handshake` — the VM's egress proxy breaks cloudflared's TLS to `api.trycloudflare.com`, the same class of failure as Playwright on this VM. It may work from a machine with direct internet (e.g. Gondal's laptop), but it is not a deploy target: Pi's "Deploy to Staging" needs a stable public URL it can verify. |
| **Fly.io** | ❌ No free tier | No monthly free allowance for new orgs; trial is 2 hours of machine runtime or 7 days, then a credit card is required. |
| **Railway** | ❌ Not free, card required | No free tier since 2023; $5 one-time trial credit, then $1/month, and a post-paid card is required (since 2026-03-30). |
| **Vercel (Hobby, free, no card)** | ❌ Wrong shape for this app | Vercel is serverless. This app is a long-running Node `http` server with a JSON-file store; it would need rewriting into serverless functions and the file store would not persist. Not worth it for this hackathon. |
| **Heroku** | ❌ No free tier | Eco plan is $5/month and sleeps too. |

## After deploy: test the real Pi flow

1. Open the Render URL **inside Pi Browser** (sandbox). The app calls
   `Pi.init({version:"2.0", sandbox:true})` — the sandbox flag comes
   from the server's `/api/health`, so no frontend edit is needed.
2. Sign in with Pi, complete a quest, run the 1 Pi sandbox payment
   (needs Test-Pi in the Pi Wallet), check the leaderboard.
3. Then record the real demo video (≤3 min) from Pi Browser for the
   submission — the current `docs/demo-draft.mp4` is mockup slides only.

## What still needs Gondal (deploy)

- **Render account + GitHub connect** (step 1–2 above). No card, no
  money — but the signup needs his GitHub login / email verification.
- **Pi API key generation + entry into Render env vars** (see
  `docs/PI_API_KEY.md`). The key is shown once; it must go through the
  Secure Vault, never chat.
- **Pi Console: Deploy to Staging verification + icon upload** (steps
  8–9). The console session is signed in as `@olineManuelL`.
