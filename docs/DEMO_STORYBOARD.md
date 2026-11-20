# Demo Storyboard — Quest Tracker (Pi Next) — DRAFT

> **Status: DRAFT.** Frame-by-frame plan for the ≤3-minute demo video.
> Total runtime: **2:35 (155 s)**. Narration: `docs/DEMO_NARRATION.md`.
> Video draft built from this board: `docs/demo-draft.mp4`
> (1280×720, silent — voiceover to be recorded from the narration script).
>
> ⚠️ **All preview images in this draft are rendered mockups, NOT real
> screenshots of the app in Pi Browser.** See `previews/README.md`.
> Before the final video, replace every mockup frame with a real screen
> recording / screenshot from Pi Browser (sandbox). Never present a mockup
> as real Pi Browser footage.

## Frame 1 — Title card (0:00–0:18, 18 s)

- **Visual:** Title card, no app screenshot. "Quest Tracker" + subtitle
  "Community quests for Pioneers — Pi Next demo (DRAFT)" + footnote
  "Sandbox only — no real Pi moves."
- **Narration:** Scene 1 (intro — "Hi, I'm building Quest Tracker…").
- **Source asset:** generated title slide (`docs/demo-slides/01-title.png`).
- **To replace for final:** same card, drop the "(DRAFT)" tag once the
  footage is real.

## Frame 2 — What it is / the problem (0:18–0:45, 27 s)

- **Visual:** Mockup `previews/01-quests.png` (quest list) with caption
  "Daily and community quests that give Pioneers a reason to come back."
- **Narration:** Scene 2 (problem = retention; quests + streaks +
  leaderboard fix it; Community Engagement Awards reward retention).
- **On-screen proof:** 6 quests, max 600 XP (from `data/quests.json`).
- **To replace for final:** real Pi Browser recording of the quest list.

## Frame 3 — Sign in with Pi (0:45–1:12, 27 s)

- **Visual:** Mockup `previews/02-profile.png` (Pioneer profile) with
  caption "One tap with Pi Authentication — no new password. Dev Mode
  preview shown here."
- **Narration:** Scene 3 (`Pi.authenticate(['username', 'payments'])`;
  progress saved server-side per Pioneer ID; Dev Mode is a labelled
  preview, not a Pi account).
- **On-screen proof:** demo run `POST /api/auth/register` → 200,
  `demo-pioneer` (see `docs/demo-run-2026-11-20.log`).
- **To replace for final:** real Pi Browser sign-in screen recording.

## Frame 4 — Quests, checklist, daily check-in (1:12–1:35, 23 s)

- **Visual:** Mockup `previews/01-quests.png` with caption "Demo run:
  73 XP after two quest steps and one daily check-in. Streak: 1 day."
- **Narration:** Scene 4 (XP walk 0 → 17 → 33 → 66 → 73; streak steps
  at 1 / 3 / 7 days).
- **On-screen proof (real test numbers):**
  - Welcome quest step 0 → 17 XP; step 1 → 33 XP
  - Invite-a-Pioneer step 0 → 66 XP
  - `POST /api/checkin` → streak 1, 73 XP
- **To replace for final:** real recording of tapping a checklist step
  and the daily check-in.

## Frame 5 — Pi payments: Premium Quest Pack, 1 Pi sandbox (1:35–2:02, 27 s)

- **Visual:** Mockup `previews/03-payment.png` (payment sheet) with
  caption "Pi.createPayment, server-side approve + complete.
  No real Pi moves."
- **Narration:** Scene 5 (payment sheet → server approve → server
  complete; sandbox records `completed-sandbox`; premium locked with
  403 before payment, open after).
- **On-screen proof (real test numbers):**
  - Premium step before payment → HTTP 403
  - `POST /api/payments/approve` → `approved-sandbox`
  - `POST /api/payments/complete` → `completed-sandbox`, premium: true
  - Premium step after payment → 140 XP
- **To replace for final:** real Pi Browser sandbox payment sheet
  recording (needs Test-Pi in the Pi Wallet).

## Frame 6 — Leaderboard (2:02–2:22, 20 s)

- **Visual:** Mockup `previews/02-profile.png` with caption "Top 10
  Pioneers by XP. Demo user finished at 140 XP with Premium unlocked."
- **Narration:** Scene 6 (who it's for: Pioneers who want a daily
  reason to show up; community builders who want an active group).
- **On-screen proof:** `GET /api/leaderboard` → demo-pioneer, 140 XP,
  premium: true, streak: 1.
- **To replace for final:** real leaderboard screen from Pi Browser.

## Frame 7 — End card (2:22–2:35, 13 s)

- **Visual:** End card, no app screenshot. "Built for the Pi community"
  + "DRAFT — replace mockups with real Pi Browser screenshots before
  submitting. Deadline: 5 Jan 2027, 23:59 PST."
- **Narration:** Scene 7 (close + thanks).
- **Source asset:** generated end slide (`docs/demo-slides/07-end.png`).

---

## Build notes (how `demo-draft.mp4` was made)

- Slides rendered with Python PIL (1280×720, DejaVu Sans) from
  `previews/*.png` + generated title/end cards; build script kept in
  `/tmp` (not committed) — re-run from the storyboard if slides change.
- Assembled with ffmpeg (libx264, yuv420p, 30 fps, silent audio track
  so the file has a standard audio stream for editors).
- Verify with: `ffprobe docs/demo-draft.mp4` (expect ~155 s, 1280×720).

## Still needed for the FINAL video (Gondal)

1. Pi account + Pi Browser on a phone; app registered in the Developer
   Web Console; Development URL configured.
2. Real screen recordings in Pi Browser sandbox: sign-in, quest
   checklist, daily check-in, 1 Pi sandbox payment, leaderboard
   (needs Test-Pi in the Pi Wallet).
3. Voiceover recorded from `docs/DEMO_NARRATION.md` (or on-camera
   narration) and mixed over the draft; re-time slides if the read
   runs longer/shorter.
4. Public upload (YouTube or similar) + link in the submission form
   before 5 Jan 2027, 23:59 PST.
