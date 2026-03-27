const express = require("express");

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";
const SHARED_SECRET = process.env.SHARED_SECRET || "";

// sementara bypass auth dulu
const BYPASS_AUTH = false;

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

  const isLeave = body.eventType === "leave";

  const username = body.username || "-";
  const displayName = body.displayName || "-";
  const role = body.role || "-";
  const userId = body.userId || "-";
  const placeId = body.placeId || "-";
  const placeName = body.placeName || "-";
  const jobId =
    body.jobId && String(body.jobId).trim() !== ""
      ? body.jobId
      : "Roblox Studio";
  const playerCount = body.playerCount ?? "-";

  const dateObj = body.eventAt ? new Date(body.eventAt) : null;
  const formattedTime = dateObj
    ? new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }).format(dateObj) + " WIB"
    : "-";

  const discordPayload = {
    username: "Prabowo Subianto",
    embeds: [
      {
        title: isLeave
          ? "Admin/Target Keluar Server"
          : "Admin/Target Masuk Server",
        color: isLeave ? 15158332 : 5763719,
        fields: [
          { name: "Username", value: `\`${username}\``, inline: true },
          { name: "Display Name", value: `\`${displayName}\``, inline: true },
          { name: "Role", value: `\`${role}\``, inline: true },
          { name: "UserId", value: `\`${userId}\``, inline: true },
          { name: "PlaceId", value: `\`${placeId}\``, inline: false },
          { name: "Place Name", value: `\`${placeName}\``, inline: false },
          { name: "JobId", value: `\`${jobId}\``, inline: false },
          { name: "Total Player Server", value: `\`${playerCount}\``, inline: true },
          {
            name: isLeave ? "Waktu Keluar" : "Waktu Masuk",
            value: `\`${formattedTime}\``,
            inline: false
          }
        ],
        footer: {
          text: "Roblox Join/Leave Logger"
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(discordPayload)
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
  console.log("ENV LEN:", SHARED_SECRET.length);
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
