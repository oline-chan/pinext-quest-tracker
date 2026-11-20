# Quest Tracker — Pi Community Quests

**Quest Tracker** is a community quest app for Pioneers, built for **Pi Next**
(Pi Network's hackathon, https://minepi.com/pi-next/).

Pioneers sign in with Pi, complete daily and community quests, build
check-in streaks, climb a leaderboard, and unlock a Premium Quest Pack with
a Pi payment. The point of the app is retention: judges for the Community
Engagement Awards look at real user engagement, retention, and community
traction — quests and streaks are designed exactly for that.

> **Status:** working app, running locally. **Not registered, not submitted.**
> No Pi account, API key, or personal data is in this repo. Pi payments run
> in **sandbox mode only** — no real Pi moves.

## Features

- **Quest list** — onboarding, daily, community, and premium quests, each
  with a checklist of steps and XP.
- **Checklist progress** — tap a step to check it off; progress is saved
  server-side per Pioneer ID.
- **Daily check-in + streaks** — 1-day, 3-day, and 7-day streak steps.
- **Leaderboard** — top 10 Pioneers by XP, with streaks and Premium badges.
- **Pi Authentication** — sign in with Pi in Pi Browser
  (`Pi.authenticate(['username', 'payments'], onIncompletePaymentFound)`).
- **Pi payments** — unlock the Premium Quest Pack for 1 Pi via
  `Pi.createPayment`, with server-side approval and completion
  (`POST /api/payments/approve`, `POST /api/payments/complete`).
- **Privacy policy** — `/privacy.html`.
- **PiNet-ready** — a standard web app, so it can be opened via PiNet once
  registered in the Developer Web Console.

## Tech stack

- Node.js 18+ standard library only — **zero npm dependencies**.
- Frontend: vanilla HTML/CSS/JS + the official Pi SDK
  (`https://sdk.minepi.com/pi-sdk.js`).
- Storage: `data/db.json` (JSON file, gitignored). Swap for a real database
  before a public launch.

## Run it locally

```bash
cd pinext-quest-tracker
node server.js
# Open http://localhost:3000
```

No `npm install` needed. Set `PORT` to change the port (default 3000).

### What you will see in a regular browser

The Pi SDK only exists inside Pi Browser, so in a normal browser the app
shows "Pi Browser required for real Pi sign-in", disables Pi sign-in and
Pi payments, and offers a clearly labelled **Dev Mode** button. Dev Mode
uses a local identity (`dev-pioneer`) to preview the quest UI — it is
**not** a Pi account and must never be presented as one.

### Testing the real Pi flow

1. Register the app in the Developer Web Console (see below).
2. Configure the Development URL and open the app in Pi Browser sandbox.
3. Sign in with Pi, complete quests, and run the 1 Pi sandbox payment
   (needs Test-Pi in the Pi Wallet).

## API

| Route | Method | Description |
|---|---|---|
| `/api/health` | GET | Health + sandbox/API-key status |
| `/api/quests` | GET | Quest list |
| `/api/progress?uid=` | GET | A user's XP, streak, premium status, steps |
| `/api/progress` | POST | Toggle a quest step `{uid, questId, stepIndex, done}` |
| `/api/checkin` | POST | Daily check-in `{uid}` |
| `/api/auth/register` | POST | Store Pioneer identity from Pi Auth `{uid, username}` |
| `/api/auth/verify` | POST | Verify an access token via Pi Platform API `/v2/me` with `Authorization: Bearer <accessToken>` (per official Pi docs — needs no `PI_API_KEY`) |
| `/api/leaderboard` | GET | Top 10 by XP |
| `/api/payments/approve` | POST | Server-side payment approval `{paymentId, uid, amount, memo}` |
| `/api/payments/complete` | POST | Server-side payment completion `{paymentId, txid, uid}` |
| `/api/payments?uid=` | GET | Payment records |

## Environment

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `3000` | Server port |
| `PI_SANDBOX` | `true` | `true` = sandbox, no real Pi moves |
| `PI_API_KEY` | _(unset)_ | Pi Platform API key — **server-side only, never in the frontend or git** |

## How to register in the Developer Web Console (for Gondal, later)

Full steps in [`docs/PI_INTEGRATION.md`](docs/PI_INTEGRATION.md). Short version:

1. Create a Pi account and install Pi Browser.
2. Open https://developers.minepi.com/ (scan the QR code with Pi Browser),
   go to the **Hackathon** tab, and register for Pi Next. All team members
   register individually.
3. Create/register the Quest Tracker app: English name, description, logo
   (`public/logo.svg`), preview images (`previews/`), privacy policy
   (`/privacy.html`).
4. Configure the Development URL, get the **Pi Platform API key**, and set
   it as `PI_API_KEY` on the server only.
5. Optional: use the Web Console's AI coding agent via MCP server
   `pi-app-studio` at `https://developers.minepi.com/mcp`, with the prompt
   `Read https://developers.minepi.com/appstudio/agents.md and follow its instructions to onboard this app to Pi Network.`
6. Test in Pi Browser sandbox, enable PiNet, make the demo video
   (≤3 minutes), and submit before **5 January 2027, 11:59 PM PST**.
   Only one team member submits each app.

Submission checklist: [`docs/SUBMISSION_CHECKLIST.md`](docs/SUBMISSION_CHECKLIST.md).

## Prize warning — read this

Pi Next's pool is 200,000 USDT (Judges' Pick 50,000 USDT; Community
Engagement Awards 150,000 USDT for up to 2 teams). **The payment rail and
timing for prizes have NOT been published on the official Pi Next page.**
There is no published information on how USDT is paid, when it is paid,
or what documents are required. Treat Pi Next as a lottery — no payout
is guaranteed.

## License

MIT.
