/**
 * Pi Next — Quest Tracker (Pi App)
 * ---------------------------------
 * A Pi App for the Pi community: quest list, checklist progress, Pioneer
 * profile via Pi Authentication, and a Pi payment flow (sandbox only).
 *
 * Stack: Node.js standard library only — no npm dependencies. This keeps
 * `npm install` out of the way and makes the app runnable anywhere Node 18+
 * is installed.
 *
 * Pi integration (see docs/PI_INTEGRATION.md):
 * - Frontend loads the official Pi SDK: https://sdk.minepi.com/pi-sdk.js
 *   and calls Pi.init({ version: "2.0", sandbox: true }) in development.
 * - Pi.authenticate(['username', 'payments'], onIncompletePaymentFound)
 *   returns { accessToken, user: { uid, username } }. The client user object
 *   is presentation-only; the backend is the source of truth and must verify
 *   the access token against the Pi Platform API (/me) with the server-side
 *   PI_API_KEY. That key is NEVER in the frontend.
 * - Pi.createPayment({ amount, memo, metadata }, callbacks) drives the
 *   three-phase flow: create -> server approve -> server complete.
 *   Server endpoints below implement approve/complete. In sandbox mode
 *   without PI_API_KEY they record the payment as SANDBOX-SIMULATED and
 *   never claim a real on-chain completion. In production they must call
 *   POST https://api.minepi.com/v2/payments/:id/approve and
 *   POST https://api.minepi.com/v2/payments/:id/complete with
 *   `Authorization: Key <PI_API_KEY>`.
 *
 * Storage: data/db.json (JSON file, gitignored). Good enough for a
 * hackathon demo; swap for a real database before a public launch.
 *
 * Environment:
 *   PORT            — default 3000
 *   PI_API_KEY      — Pi Platform API key, server-side ONLY (optional in dev)
 *   PI_SANDBOX      — "true" (default) = sandbox mode, no real Pi moves
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const PI_SANDBOX = process.env.PI_SANDBOX !== "false";
const PI_API_KEY = process.env.PI_API_KEY || "";
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DB_PATH = path.join(ROOT, "data", "db.json");
const QUESTS_PATH = path.join(ROOT, "data", "quests.json");

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------
function defaultDb() {
  return { users: {}, payments: [] };
}

function loadDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch {
    return defaultDb();
  }
}

function saveDb(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function loadQuests() {
  return JSON.parse(fs.readFileSync(QUESTS_PATH, "utf8")).quests;
}

function getUser(db, uid) {
  if (!db.users[uid]) {
    db.users[uid] = {
      uid,
      username: null,
      xp: 0,
      steps: {}, // questId -> [bool, bool, ...]
      checkins: [], // ISO dates, YYYY-MM-DD
      premium: false,
      createdAt: new Date().toISOString(),
    };
  }
  return db.users[uid];
}

function questXp(quest, stepsDone) {
  if (!quest.steps.length) return 0;
  return Math.round((quest.xp * stepsDone) / quest.steps.length);
}

function recomputeXp(db, user) {
  const quests = loadQuests();
  let xp = 0;
  for (const q of quests) {
    const done = (user.steps[q.id] || []).filter(Boolean).length;
    xp += questXp(q, done);
  }
  user.xp = xp;
  return xp;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function streak(checkins) {
  const set = new Set(checkins);
  let n = 0;
  const d = new Date();
  // Streak counts back from today (or yesterday if today is not checked in yet).
  if (!set.has(todayStr())) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function serveStatic(req, res) {
  const urlPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const file = path.normalize(path.join(PUBLIC_DIR, decodeURIComponent(urlPath)));
  if (!file.startsWith(PUBLIC_DIR)) return sendJson(res, 403, { error: "Forbidden" });
  fs.readFile(file, (err, data) => {
    if (err) return sendJson(res, 404, { error: "Not found" });
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
async function handleApi(req, res) {
  const url = new URL(req.url, "http://localhost");
  const db = loadDb();
  const quests = loadQuests();

  // GET /api/health
  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, {
      ok: true,
      app: "pinext-quest-tracker",
      piSandbox: PI_SANDBOX,
      piApiKeyConfigured: Boolean(PI_API_KEY),
      quests: quests.length,
      users: Object.keys(db.users).length,
      payments: db.payments.length,
    });
  }

  // GET /api/quests
  if (req.method === "GET" && url.pathname === "/api/quests") {
    return sendJson(res, 200, { quests });
  }

  // GET /api/progress?uid=...
  if (req.method === "GET" && url.pathname === "/api/progress") {
    const uid = url.searchParams.get("uid");
    if (!uid) return sendJson(res, 400, { error: "uid is required" });
    const user = getUser(db, uid);
    recomputeXp(db, user);
    saveDb(db);
    return sendJson(res, 200, {
      uid: user.uid,
      username: user.username,
      xp: user.xp,
      premium: user.premium,
      streak: streak(user.checkins),
      checkins: user.checkins,
      steps: user.steps,
    });
  }

  // POST /api/progress { uid, questId, stepIndex, done }
  if (req.method === "POST" && url.pathname === "/api/progress") {
    const body = await readJsonBody(req);
    const { uid, questId, stepIndex, done } = body;
    const quest = quests.find((q) => q.id === questId);
    if (!uid || !quest) return sendJson(res, 400, { error: "uid and a valid questId are required" });
    if (typeof stepIndex !== "number" || stepIndex < 0 || stepIndex >= quest.steps.length) {
      return sendJson(res, 400, { error: "stepIndex out of range" });
    }
    if (quest.premium && !getUser(db, uid).premium) {
      return sendJson(res, 403, { error: "Premium quest — unlock the Premium Quest Pack first (Pi payment, sandbox)." });
    }
    const user = getUser(db, uid);
    if (!user.steps[questId]) user.steps[questId] = quest.steps.map(() => false);
    user.steps[questId][stepIndex] = Boolean(done);
    recomputeXp(db, user);
    saveDb(db);
    return sendJson(res, 200, { ok: true, xp: user.xp, steps: user.steps[questId] });
  }

  // POST /api/checkin { uid }
  if (req.method === "POST" && url.pathname === "/api/checkin") {
    const body = await readJsonBody(req);
    if (!body.uid) return sendJson(res, 400, { error: "uid is required" });
    const user = getUser(db, body.uid);
    const today = todayStr();
    if (!user.checkins.includes(today)) user.checkins.push(today);
    // Daily check-in quest, step 0 = "Check in today".
    if (!user.steps["daily-checkin"]) user.steps["daily-checkin"] = [false, false, false];
    user.steps["daily-checkin"][0] = true;
    if (streak(user.checkins) >= 3) user.steps["daily-checkin"][1] = true;
    if (streak(user.checkins) >= 7) user.steps["daily-checkin"][2] = true;
    recomputeXp(db, user);
    saveDb(db);
    return sendJson(res, 200, { ok: true, streak: streak(user.checkins), xp: user.xp });
  }

  // POST /api/auth/register { uid, username } — store the Pioneer identity
  // the client received from Pi.authenticate. The username here is
  // presentation-only; real verification happens in /api/auth/verify.
  if (req.method === "POST" && url.pathname === "/api/auth/register") {
    const body = await readJsonBody(req);
    if (!body.uid) return sendJson(res, 400, { error: "uid is required" });
    const user = getUser(db, body.uid);
    if (body.username) user.username = String(body.username).slice(0, 64);
    saveDb(db);
    return sendJson(res, 200, { ok: true, uid: user.uid, username: user.username });
  }

  // POST /api/auth/verify { accessToken } — backend source of truth.
  // With a real PI_API_KEY this calls GET https://api.minepi.com/v2/me
  // with `Authorization: Key <PI_API_KEY>` and the user access token.
  // Without a key (dev), it honestly reports that it cannot verify.
  if (req.method === "POST" && url.pathname === "/api/auth/verify") {
    const body = await readJsonBody(req);
    if (!body.accessToken) return sendJson(res, 400, { error: "accessToken is required" });
    if (!PI_API_KEY) {
      return sendJson(res, 200, {
        verified: false,
        reason: "PI_API_KEY is not configured. Set it server-side only (never in the frontend) to verify access tokens against the Pi Platform API (/v2/me).",
      });
    }
    try {
      const r = await fetch("https://api.minepi.com/v2/me", {
        headers: { Authorization: `Key ${PI_API_KEY}` },
      });
      const me = await r.json();
      return sendJson(res, 200, { verified: r.ok, me: r.ok ? me : undefined, error: r.ok ? undefined : me });
    } catch (e) {
      return sendJson(res, 502, { verified: false, error: String(e) });
    }
  }

  // GET /api/leaderboard
  if (req.method === "GET" && url.pathname === "/api/leaderboard") {
    const rows = Object.values(db.users)
      .map((u) => ({ uid: u.uid, username: u.username || u.uid.slice(0, 12), xp: recomputeXp(db, u), premium: u.premium, streak: streak(u.checkins) }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 10);
    saveDb(db);
    return sendJson(res, 200, { leaderboard: rows });
  }

  // --- Pi payments: server-side approval / completion ---------------------
  // The Pi SDK calls these from the frontend callbacks. The paymentId comes
  // from Pi, not from us. In production each handler must call the Pi
  // Platform API (approve/complete) with PI_API_KEY before recording the
  // payment as approved/completed. In sandbox mode without a key we record
  // the payment as SANDBOX-SIMULATED — never as a real completed payment.
  if (req.method === "POST" && url.pathname === "/api/payments/approve") {
    const body = await readJsonBody(req);
    const { paymentId, uid, amount, memo } = body;
    if (!paymentId || !uid) return sendJson(res, 400, { error: "paymentId and uid are required" });
    if (Number(amount) !== 1) return sendJson(res, 400, { error: "Unexpected amount — Premium Quest Pack costs 1 Pi." });
    let record = db.payments.find((p) => p.paymentId === paymentId);
    if (!record) {
      record = { paymentId, uid, amount: Number(amount), memo: memo || "Premium Quest Pack", status: "created", createdAt: new Date().toISOString() };
      db.payments.push(record);
    }
    if (PI_API_KEY && !String(paymentId).startsWith("dev-")) {
      try {
        const r = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
          method: "POST",
          headers: { Authorization: `Key ${PI_API_KEY}` },
        });
        if (!r.ok) {
          saveDb(db);
          return sendJson(res, 502, { ok: false, error: "Pi Platform API refused approval", detail: await r.text() });
        }
        record.status = "approved";
      } catch (e) {
        return sendJson(res, 502, { ok: false, error: String(e) });
      }
    } else {
      record.status = "approved-sandbox";
    }
    saveDb(db);
    return sendJson(res, 200, { ok: true, status: record.status, sandbox: PI_SANDBOX, note: PI_API_KEY ? "Approved via Pi Platform API." : "Sandbox simulation — no real Pi moved, no Platform API call made." });
  }

  if (req.method === "POST" && url.pathname === "/api/payments/complete") {
    const body = await readJsonBody(req);
    const { paymentId, txid, uid } = body;
    if (!paymentId) return sendJson(res, 400, { error: "paymentId is required" });
    const record = db.payments.find((p) => p.paymentId === paymentId);
    if (!record) return sendJson(res, 404, { error: "Unknown paymentId" });
    if (PI_API_KEY && !String(paymentId).startsWith("dev-")) {
      try {
        const r = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
          method: "POST",
          headers: { Authorization: `Key ${PI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ txid }),
        });
        if (!r.ok) {
          saveDb(db);
          return sendJson(res, 502, { ok: false, error: "Pi Platform API refused completion", detail: await r.text() });
        }
        record.status = "completed";
      } catch (e) {
        return sendJson(res, 502, { ok: false, error: String(e) });
      }
    } else {
      record.status = "completed-sandbox";
      record.txid = txid || "sandbox-txid";
    }
    record.completedAt = new Date().toISOString();
    // Unlock the premium pack for the payer.
    const user = getUser(db, record.uid || uid);
    user.premium = true;
    saveDb(db);
    return sendJson(res, 200, { ok: true, status: record.status, premium: true, sandbox: PI_SANDBOX });
  }

  // GET /api/payments?uid=...
  if (req.method === "GET" && url.pathname === "/api/payments") {
    const uid = url.searchParams.get("uid");
    const list = db.payments.filter((p) => !uid || p.uid === uid);
    return sendJson(res, 200, { payments: list });
  }

  return sendJson(res, 404, { error: "Unknown API route" });
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) {
      await handleApi(req, res);
    } else {
      serveStatic(req, res);
    }
  } catch (e) {
    console.error(e);
    if (!res.headersSent) sendJson(res, 500, { error: String(e && e.message || e) });
  }
});

server.listen(PORT, () => {
  console.log(`Quest Tracker running at http://localhost:${PORT}`);
  console.log(`Pi sandbox mode: ${PI_SANDBOX ? "ON (no real Pi moves)" : "OFF — production, real Pi!"}`);
  console.log(`Pi API key configured: ${PI_API_KEY ? "yes" : "no (auth verify + payment approval/completion run in sandbox-simulated mode)"}`);
});
