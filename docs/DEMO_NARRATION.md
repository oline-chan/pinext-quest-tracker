# Demo Narration — Quest Tracker (Pi Next) — DRAFT

> **Status: DRAFT — text script only, ready to record. Not a final video.**
> Target length: **2 minutes 35 seconds** (155 s), under the 3-minute limit.
> Deadline: **5 January 2027, 23:59 PST**. Record with the final video after
> replacing the mockup preview images with real Pi Browser screenshots.
> Reading pace: ~140 words per minute. Total: ~355 words.
>
> Honesty note for the recording: every screen in the current draft video is
> a **rendered mockup** (see `previews/README.md`), not a screenshot of the
> app running in Pi Browser. The demo-run numbers below (XP, streak, payment
> status) are real results from the local test run on 2026-11-20 — see
> `docs/demo-run-2026-11-20.log`. Do not present mockups as real Pi Browser
> footage in the final video.

## Scene 1 — Title (0:00–0:18, 18 s)

> "Hi, I'm building Quest Tracker — a community quest app for Pioneers, made
> for Pi Next. If you've ever joined a community app, been excited for a
> week, and then quietly disappeared — this app is the fix for that."

## Scene 2 — What it is, and the problem (0:18–0:45, 27 s)

> "Quest Tracker gives the Pi community daily and weekly quests: check in,
> invite a friend, learn how Pi payments work, and climb a leaderboard.
> The problem is simple. Community apps don't die because people dislike
> them — they die because people forget to come back. Quests, streaks, and
> a leaderboard give Pioneers a reason to return every single day, and
> that retention is exactly what the Community Engagement Awards reward."

## Scene 3 — Sign in with Pi (0:45–1:12, 27 s)

> "Getting started takes seconds. You sign in with Pi — one tap, no new
> password, no new account to remember — using Pi Authentication. The app
> knows who you are as a Pioneer, and your progress is saved on the server
> under your Pioneer ID. In a normal browser you'll see a clearly labelled
> Dev Mode preview instead; the real sign-in happens inside Pi Browser."

## Scene 4 — Quests, checklists, check-in (1:12–1:35, 23 s)

> "Here's the core loop. Pick a quest, check off its steps, and earn XP.
> In our demo run, two steps of the Welcome quest and one invite step took
> a fresh Pioneer from zero to 66 XP. Then a daily check-in added a streak
> of one day — and 7 more XP. Seventy-three XP in under a minute, and the
> streak is what pulls you back tomorrow. Three days in a row unlocks the
> next step; seven days unlocks the one after that."

## Scene 5 — Pi payments: Premium Quest Pack (1:35–2:02, 27 s)

> "Pi isn't just the login — it's also how the app is supported. The
> Premium Quest Pack costs 1 Pi. Tapping unlock opens the Pi payment sheet,
> and the server approves and completes the payment — that's the real
> three-step Pi payment flow, approve then complete. In this demo it ran
> in sandbox mode, so no real Pi moved: the server honestly recorded it as
> completed-sandbox. Before payment, premium quests are locked — the app
> returns a 403. After payment, they're open, and our demo Pioneer jumped
> to 140 XP with a Premium badge."

## Scene 6 — Leaderboard, and who it's for (2:02–2:22, 20 s)

> "Everything feeds the leaderboard — the top ten Pioneers by XP, with
> their streaks and Premium badges. This is for every Pioneer who wants a
> daily reason to show up, and for community builders who want their group
> to stay active instead of fading away."

## Scene 7 — Close (2:22–2:35, 13 s)

> "Quest Tracker: daily quests, streaks, a leaderboard — signed in with Pi,
> and supported with Pi. Built for the Pi community, for Pi Next. Thank you."

---

## Recording checklist (before final cut)

- [ ] Replace all mockup preview images with real screenshots / screen
      recordings of the app running in Pi Browser (sandbox).
- [ ] Record the real Pi sign-in and the 1 Pi sandbox payment on a phone
      (needs Test-Pi in the Pi Wallet).
- [ ] Re-record any line whose on-screen numbers changed (XP walk:
      0 → 17 → 33 → 66 → 73 → 140; streak 1; premium unlocked after
      sandbox payment `completed-sandbox`).
- [ ] Keep the final cut under 3:00; upload publicly (YouTube or similar)
      and put the link in the Developer Web Console submission form.
- [ ] Do not claim a prize payout: the Pi Next prize rail and timing have
      not been published — see `README.md` ("Prize warning").
