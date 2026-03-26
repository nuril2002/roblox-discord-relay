const express = require("express");

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";
const SHARED_SECRET = process.env.SHARED_SECRET || "";

// sementara bypass auth dulu
const BYPASS_AUTH = true;

app.use((req, res, next) => {
  console.log("REQ MASUK:", req.method, req.url);
  next();
});

app.get("/", (req, res) => {
  res.status(200).send("Relay hidup bro");
});

app.get("/roblox/join-log", (req, res) => {
  res.status(200).send("Endpoint join-log siap bro");
});

async function sendToDiscord(body) {
  if (!DISCORD_WEBHOOK_URL) {
    throw new Error("DISCORD_WEBHOOK_URL kosong");
  }

  const eventType = body.eventType === "leave" ? "KELUAR" : "MASUK";
  const username = body.username || "-";
  const displayName = body.displayName || "-";
  const role = body.role || "-";
  const userId = body.userId || "-";
  const placeId = body.placeId || "-";
  const placeName = body.placeName || "-";
  const jobId = body.jobId || "-";
  const playerCount = body.playerCount ?? "-";
  const eventAt = body.eventAt || "-";

  const content =
    `${eventType} SERVER\n` +
    `Username: ${username}\n` +
    `Display Name: ${displayName}\n` +
    `Role: ${role}\n` +
    `UserId: ${userId}\n` +
    `PlaceId: ${placeId}\n` +
    `Place Name: ${placeName}\n` +
    `JobId: ${jobId}\n` +
    `Player Count: ${playerCount}\n` +
    `Waktu: ${eventAt}`;

  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: "Absensi",
      content
    })
  });

  const text = await response.text();
  console.log("DISCORD STATUS:", response.status);
  if (text) {
    console.log("DISCORD BODY:", text.slice(0, 300));
  }

  if (!response.ok) {
    throw new Error(`Discord ${response.status}: ${text}`);
  }
}

function acceptRoblox(req, res) {
  const auth = req.headers["x-shared-secret"] || "";

  console.log("HEADER LEN:", auth.length);
  console.log("BODY:", JSON.stringify(req.body));

  if (!BYPASS_AUTH && (!SHARED_SECRET || auth !== SHARED_SECRET)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const payload = req.body || {};

  // balas cepat ke Roblox dulu
  res.status(200).json({ ok: true, queued: true });

  // kirim ke Discord di background
  setImmediate(() => {
    sendToDiscord(payload).catch((err) => {
      console.error("DISCORD SEND ERROR:", err && err.stack ? err.stack : String(err));
    });
  });
}

app.post("/", acceptRoblox);
app.post("/roblox/join-log", acceptRoblox);
app.post("/relay/roblox/join-log", acceptRoblox);

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Relay jalan di port ${port}`);
});
