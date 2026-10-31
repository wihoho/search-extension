// Generated from extension-stats/extensions/shared/telemetry.ts (esbuild). Edit that file, not this one.
const ENDPOINT = "https://extstats.share.zrok.io/e";
const KEY = "telemetry";
const MAX_ERRORS_PER_DAY = 20;
const store = {
  async get() {
    try {
      if (chrome.storage?.local) return (await chrome.storage.local.get(KEY))[KEY] ?? {};
      return JSON.parse(localStorage.getItem(KEY) ?? "{}");
    } catch {
      return {};
    }
  },
  async set(s) {
    try {
      if (chrome.storage?.local) await chrome.storage.local.set({ [KEY]: s });
      else localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
    }
  }
};
function send(r) {
  try {
    const body = JSON.stringify({ id: chrome.runtime.id, v: chrome.runtime.getManifest().version, ...r });
    fetch(ENDPOINT, { method: "POST", mode: "no-cors", keepalive: true, body }).catch(() => {
    });
  } catch {
  }
}
const dayOf = (d) => d.toISOString().slice(0, 10);
function weekOf(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 3 - (t.getUTCDay() + 6) % 7);
  const jan4 = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((t.getTime() - jan4.getTime()) / 864e5 - 3 + (jan4.getUTCDay() + 6) % 7) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
const delayBucket = (ms) => ms <= 36e5 ? "t1h" : ms <= 864e5 ? "t1d" : ms <= 7 * 864e5 ? "t7d" : "tlate";
function taskFlags(s, now) {
  const flags = [];
  const next = { ...s };
  if (s.installedAt && !s.first) {
    flags.push("first", delayBucket(now.getTime() - s.installedAt));
    next.first = true;
  }
  if (s.day !== dayOf(now)) {
    flags.push("day");
    next.day = dayOf(now);
  }
  if (s.week !== weekOf(now)) {
    flags.push("week");
    next.week = weekOf(now);
  }
  return { flags, next };
}
function describeError(err) {
  let e;
  if (err instanceof Error) e = err;
  else if (typeof err === "string") e = { name: "Error", message: err };
  else if (err && typeof err === "object" && "message" in err) e = err;
  else e = { name: typeof err, message: "" };
  const msg = String(e.message ?? "").replace(/[a-z][\w+.-]*:\/\/\S+/gi, "<url>").replace(/\S+@\S+\.\w+/g, "<email>").replace(/(["`“«]).*?(["`”»])/g, "<q>").replace(/(^|[\s:(=])'[^']*'/g, "$1<q>").replace(/(?:[A-Za-z]:)?[\\/][^\s:,;)]+/g, "<path>").replace(/\b0x[0-9a-f]+\b/gi, "<n>").replace(/\d+/g, "<n>").replace(/\s+/g, " ").trim().slice(0, 140);
  const frame = String(e.stack ?? "").split("\n").map((l) => l.match(/chrome-extension:\/\/[a-p]{32}\/([\w./-]+):(\d+):(\d+)/)).find(Boolean);
  return { s: `${e.name || "Error"}: ${msg}`, at: frame ? `${frame[1]}:${frame[2]}:${frame[3]}` : "" };
}
function trackInstalls() {
  chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason !== "install") return;
    await store.set({ ...await store.get(), installedAt: Date.now() });
    send({ k: "install" });
  });
}
async function trackTask() {
  const { flags, next } = taskFlags(await store.get(), /* @__PURE__ */ new Date());
  await store.set(next);
  send({ k: "task", f: flags });
}
const reportError = (where, err) => sendError(where, describeError(err));
async function sendError(where, { s, at }) {
  try {
    const state = await store.get();
    const today = dayOf(/* @__PURE__ */ new Date());
    const errs = Object.fromEntries(Object.entries(state.errs ?? {}).filter(([, d]) => d === today));
    const key = `${where}|${s}|${at}`;
    if (errs[key] || Object.keys(errs).length >= MAX_ERRORS_PER_DAY) return;
    errs[key] = today;
    await store.set({ ...state, errs });
    send({ k: "error", w: where.slice(0, 40), s: s.slice(0, 200), at: at.slice(0, 80) });
  } catch {
  }
}
function catchErrors(where) {
  addEventListener("error", (e) => {
    if (e instanceof ErrorEvent) reportError(where, e.error ?? e.message);
  });
  addEventListener("unhandledrejection", (e) => reportError(where, e.reason));
}
function relayReport(r) {
  const msg = "task" in r ? { telemetry: "task" } : { telemetry: "error", where: r.where, ...describeError(r.error) };
  try {
    chrome.runtime.sendMessage(msg).catch?.(() => {
    });
  } catch {
  }
}
function listenForRelays() {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.telemetry === "task") trackTask();
    if (msg?.telemetry === "error") sendError(String(msg.where), { s: String(msg.s ?? ""), at: String(msg.at ?? "") });
  });
}
export {
  ENDPOINT,
  catchErrors,
  dayOf,
  delayBucket,
  describeError,
  listenForRelays,
  relayReport,
  reportError,
  taskFlags,
  trackInstalls,
  trackTask,
  weekOf
};
