/**
 * Quest Tracker — frontend.
 *
 * Real Pi flow (only inside Pi Browser, where window.Pi exists):
 *   Pi.init({ version: "2.0", sandbox: true })
 *   Pi.authenticate(['username', 'payments'], onIncompletePaymentFound)
 *     -> { accessToken, user: { uid, username } }
 *   Pi.createPayment({ amount, memo, metadata }, callbacks)
 *     -> callbacks post paymentId to /api/payments/approve and
 *        /api/payments/complete on this server.
 *
 * Dev Mode (regular browser, no window.Pi): a clearly labelled local
 * preview identity ("dev-pioneer"). It is NOT a Pi account, it does not
 * call Pi.authenticate, and it must never be presented as one. It exists
 * only so the quest UI can be tested outside Pi Browser.
 */
const api = {
  async get(path) { const r = await fetch(path); return r.json(); },
  async post(path, body) {
    const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return r.json();
  },
};

let currentUser = null; // { uid, username, via: 'pi' | 'dev' }
let quests = [];

const $ = (id) => document.getElementById(id);
const hasPiSdk = () => typeof window.Pi !== "undefined";

function onIncompletePaymentFound(payment) {
  // Per Pi docs, the SDK reports an unfinished payment here. Hand it to the
  // server to complete it, so the user is not stuck.
  console.warn("Incomplete Pi payment found:", payment);
  if (payment && payment.identifier) {
    api.post("/api/payments/complete", { paymentId: payment.identifier, txid: payment.transaction && payment.transaction.txid, uid: currentUser && currentUser.uid });
  }
}

async function initPi() {
  if (!hasPiSdk()) {
    $("pi-notice").hidden = false;
    $("btn-auth").disabled = true;
    $("btn-premium").disabled = true;
    $("btn-premium").textContent = "Unlock Premium — 1 Pi (needs Pi Browser)";
    return;
  }
  // Sandbox flag comes from the server (/api/health -> piSandbox, driven
  // by the PI_SANDBOX env var), so staging and production never need a
  // frontend edit. Falls back to sandbox:true if the health check fails.
  let sandbox = true;
  try {
    const health = await api.get("/api/health");
    if (typeof health.piSandbox === "boolean") sandbox = health.piSandbox;
  } catch { /* keep sandbox:true */ }
  window.Pi.init({ version: "2.0", sandbox });
}

async function signInWithPi() {
  if (!hasPiSdk()) return;
  try {
    const auth = await window.Pi.authenticate(["username", "payments"], onIncompletePaymentFound);
    currentUser = { uid: auth.user.uid, username: auth.user.username, via: "pi", accessToken: auth.accessToken };
    await api.post("/api/auth/register", { uid: auth.user.uid, username: auth.user.username });
    // Backend verification (needs PI_API_KEY server-side; honest about it).
    const verify = await api.post("/api/auth/verify", { accessToken: auth.accessToken });
    if (!verify.verified) console.warn("Pi auth not server-verified yet:", verify.reason);
    saveSession();
    renderProfile();
    await refreshAll();
  } catch (e) {
    alert("Pi sign-in failed or was cancelled: " + (e && e.message || e));
  }
}

function signInDev() {
  // Local preview only. Never a Pi account.
  currentUser = { uid: "dev-pioneer", username: "dev-pioneer", via: "dev" };
  saveSession();
  renderProfile();
  refreshAll();
}

function saveSession() {
  if (currentUser) localStorage.setItem("qt-user", JSON.stringify({ uid: currentUser.uid, username: currentUser.username, via: currentUser.via }));
}
function loadSession() {
  try { const u = JSON.parse(localStorage.getItem("qt-user") || "null"); if (u) currentUser = u; } catch { /* ignore */ }
}

function renderProfile() {
  $("profile-name").textContent = currentUser
    ? `${currentUser.username}${currentUser.via === "dev" ? " (Dev Mode — not a Pi account)" : " (Pi)"}`
    : "Not signed in";
  $("btn-auth").disabled = Boolean(currentUser) || !hasPiSdk();
}

async function refreshAll() {
  await loadQuests();
  await loadProgress();
  await loadLeaderboard();
  await loadPayments();
}

async function loadQuests() {
  const data = await api.get("/api/quests");
  quests = data.quests || [];
  renderQuests();
}

async function loadProgress() {
  if (!currentUser) { renderStats(null); return; }
  const p = await api.get(`/api/progress?uid=${encodeURIComponent(currentUser.uid)}`);
  renderStats(p);
  renderQuests(p.steps || {});
}

function renderStats(p) {
  $("stat-xp").textContent = p ? p.xp : 0;
  $("stat-streak").textContent = p ? p.streak : 0;
  $("stat-premium").textContent = p && p.premium ? "Premium" : "Free";
  if (!p || !quests.length) { $("stat-done").textContent = "0 / 0"; return; }
  const done = quests.filter((q) => (p.steps[q.id] || []).every(Boolean) && q.steps.length).length;
  $("stat-done").textContent = `${done} / ${quests.length}`;
}

function renderQuests(stepsByQuest) {
  const list = $("quest-list");
  list.innerHTML = "";
  for (const q of quests) {
    const steps = (stepsByQuest && stepsByQuest[q.id]) || q.steps.map(() => false);
    const locked = q.premium && !(currentUser && document.querySelector("#stat-premium").textContent === "Premium");
    const card = document.createElement("div");
    card.className = "quest" + (locked ? " locked" : "");
    const doneCount = steps.filter(Boolean).length;
    card.innerHTML = `<header><h3>${q.title}</h3><span class="badge${q.premium ? " premium" : ""}">${q.category} · ${q.xp} XP${q.premium ? " · Premium" : ""}</span></header>
      <p>${q.description}</p>
      <p><strong>${doneCount} / ${q.steps.length} steps done</strong>${locked ? " — unlock the Premium Quest Pack to play this quest." : ""}</p>`;
    q.steps.forEach((step, i) => {
      const label = document.createElement("label");
      label.className = "step" + (steps[i] ? " done" : "");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = Boolean(steps[i]);
      box.disabled = !currentUser || locked;
      box.addEventListener("change", async () => {
        const r = await api.post("/api/progress", { uid: currentUser.uid, questId: q.id, stepIndex: i, done: box.checked });
        if (r.error) { alert(r.error); box.checked = !box.checked; return; }
        await loadProgress();
        await loadLeaderboard();
      });
      const text = document.createElement("span");
      text.textContent = step;
      label.append(box, text);
      card.appendChild(label);
    });
    list.appendChild(card);
  }
}

async function loadLeaderboard() {
  const data = await api.get("/api/leaderboard");
  const ol = $("leaderboard");
  ol.innerHTML = "";
  if (!data.leaderboard.length) { ol.innerHTML = "<li>No Pioneers yet — be the first!</li>"; return; }
  data.leaderboard.forEach((row, i) => {
    const li = document.createElement("li");
    li.textContent = `#${i + 1} ${row.username} — ${row.xp} XP · ${row.streak}-day streak${row.premium ? " · Premium" : ""}`;
    ol.appendChild(li);
  });
}

async function loadPayments() {
  if (!currentUser) return;
  const data = await api.get(`/api/payments?uid=${encodeURIComponent(currentUser.uid)}`);
  const ul = $("payment-list");
  ul.innerHTML = "";
  if (!data.payments.length) { ul.innerHTML = "<li>No payments yet.</li>"; return; }
  data.payments.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = `${p.memo} — ${p.amount} Pi — ${p.status} (${p.paymentId})`;
    ul.appendChild(li);
  });
}

async function dailyCheckin() {
  if (!currentUser) { alert("Sign in first — with Pi in Pi Browser, or Dev Mode to preview."); return; }
  const r = await api.post("/api/checkin", { uid: currentUser.uid });
  if (r.error) { alert(r.error); return; }
  alert(`Checked in! Current streak: ${r.streak} day(s).`);
  await refreshAll();
}

async function unlockPremium() {
  if (!currentUser) { alert("Sign in first."); return; }
  if (!hasPiSdk()) {
    // Dev-only simulation of the server side of the payment flow.
    if (!confirm("Pi SDK is not available here (not Pi Browser).\n\nSimulate the SANDBOX server-side payment record locally? This moves no real Pi and is for UI testing only.")) return;
    const paymentId = "dev-" + Date.now();
    const a = await api.post("/api/payments/approve", { paymentId, uid: currentUser.uid, amount: 1, memo: "Premium Quest Pack" });
    if (a.error || !a.ok) { alert("Approval failed: " + (a.error || "unknown")); return; }
    const c = await api.post("/api/payments/complete", { paymentId, txid: "sandbox-txid", uid: currentUser.uid });
    if (c.error || !c.ok) { alert("Completion failed: " + (c.error || "unknown")); return; }
    alert("Premium Quest Pack unlocked (sandbox simulation).");
    await refreshAll();
    return;
  }
  // Real Pi SDK payment flow (sandbox: true was set in Pi.init).
  window.Pi.createPayment(
    { amount: 1, memo: "Premium Quest Pack", metadata: { product: "premium-quest-pack" } },
    {
      onReadyForServerApproval: (paymentId) => {
        api.post("/api/payments/approve", { paymentId, uid: currentUser.uid, amount: 1, memo: "Premium Quest Pack" });
      },
      onReadyForServerCompletion: (paymentId, txid) => {
        api.post("/api/payments/complete", { paymentId, txid, uid: currentUser.uid }).then(() => refreshAll());
      },
      onCancel: (paymentId) => { alert("Payment cancelled."); },
      onError: (error, payment) => { alert("Payment error: " + (error && error.message || error)); },
    }
  );
}

function shareWithPioneer() {
  if (hasPiSdk() && window.Pi.openShareDialog) {
    window.Pi.openShareDialog("Quest Tracker", "Join me on Quest Tracker — community quests for Pioneers on Pi!");
  } else {
    const url = location.href;
    if (navigator.share) navigator.share({ title: "Quest Tracker", text: "Join me on Quest Tracker — community quests for Pioneers on Pi!", url }).catch(() => {});
    else { prompt("Copy this link and share it with a Pioneer:", url); }
  }
}

$("btn-auth").addEventListener("click", signInWithPi);
$("btn-dev").addEventListener("click", signInDev);
$("btn-checkin").addEventListener("click", dailyCheckin);
$("btn-premium").addEventListener("click", unlockPremium);
$("btn-share").addEventListener("click", shareWithPioneer);

loadSession();
initPi();
renderProfile();
refreshAll();
