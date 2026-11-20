# Pi Next Submission Checklist — Quest Tracker

Deadline: **Tuesday, 5 January 2027, 11:59 PM PST** (Wednesday, 6 January 2027, 07:59 AM UTC).
Submit in the Developer Web Console: https://developers.minepi.com/ — Hackathon tab.
Only one team member submits each app.

## App requirements (from https://minepi.com/pi-next/)

- [x] English name: **Quest Tracker**
- [x] Accurate English description (see README + index.html meta description)
- [x] Logo that follows Pi's trademark guidelines — `public/logo.svg` is an
      original mark, NOT the Pi logo. Gondal: double-check against the
      trademark guidelines before submitting.
- [x] Preview images that show the app's interface — `previews/`
- [x] Integrates with PiNet — standard web app, enable PiNet in the Web Console
- [x] Privacy policy — `public/privacy.html`
- [x] Pi Authentication integrated (`Pi.authenticate`)
- [x] Pi payments integrated (`Pi.createPayment`, server approve/complete)
- [x] App registered in the Developer Web Console — **Quest Tracker**,
      App ID `6b00ae2dd54a71cf5a29533f`, Staging (Testnet), status Draft
      (created 2026-11-21 03:32 WIB, account `@olineManuelL`).
      Registration for Pi Next itself also done 2026-11-21 03:30 WIB.
- [ ] Deploy to a public HTTPS URL — guide ready: `docs/DEPLOY.md`
      (recommended: Render free, no card; `render.yaml` in repo).
      Then do **Deploy to Staging (Testnet)** in the Web Console with
      that URL, and upload the icon `public/icon-1024.png` (1024×1024).
- [ ] Development URL configured, sandbox tested in Pi Browser
- [ ] Production URL configured, `sandbox: false` for the submitted build
      (one env var: `PI_SANDBOX=false` on the host — the frontend reads
      it from `/api/health`, no code edit needed)
- [ ] `PI_API_KEY` set server-side (never in the frontend or git) —
      safe generate/use guide: `docs/PI_API_KEY.md`. Key NOT generated
      yet; it is shown once and must go through the Secure Vault.
- [ ] Demo video ≤3 minutes, public on YouTube / video platform, link in the form
- [ ] Team members listed in the submission form (all must register for Pi Next)
- [ ] Midpoint submission (optional, for feedback/visibility)

## Demo video outline (≤3 min)

1. What Quest Tracker is: community quests for Pioneers.
2. Walkthrough: sign in with Pi, daily check-in, checklist progress, leaderboard.
3. Who it is for: Pi community members who want a reason to come back daily.
4. Problem: community apps lose users; quests + streaks + leaderboard drive retention.
5. How Pi is part of it: Pi Sign-in (no new password) and Pi payments (1 Pi sandbox premium pack).

## Prize warning (do not promise this)

Pi Next prize pool is 200,000 USDT (Judges' Pick 50,000; Community Engagement
150,000 for up to 2 teams). **The payment rail and timing for prizes have NOT
been published on the official Pi Next page.** Treat Pi Next as a lottery:
no guaranteed payout, no guaranteed date. Do not promise Gondal a payout.
