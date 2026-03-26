const express = require("express");

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

app.use((req, res, next) => {
  console.log("REQ MASUK:", req.method, req.url);
  next();
});

app.get("/", (req, res) => {
  res.send("Relay hidup bro");
});

app.get("/roblox/join-log", (req, res) => {
  res.send("Endpoint join-log siap bro");
});

async function handleJoinLog(req, res) {
  try {
    console.log("BODY:", JSON.stringify(req.body));

    if (!DISCORD_WEBHOOK_URL) {
      return res.status(500).json({ ok: false, error: "DISCORD_WEBHOOK_URL belum diset" });
    }

    const {
      eventType,
      username,
      displayName,
      role,
      userId,
      placeId,
      placeName,
      jobId,
      playerCount,
      eventAt
    } = req.body || {};

    const content =
      `${eventType === "leave" ? "🔴" : "🟢"} ${eventType === "leave" ? "Keluar" : "Masuk"} Server\n` +
      `Username: ${username || "-"}\n` +
      `Display Name: ${displayName || "-"}\n` +
      `Role: ${role || "-"}\n` +
      `UserId: ${userId || "-"}\n` +
      `PlaceId: ${placeId || "-"}\n` +
      `Place Name: ${placeName || "-"}\n` +
      `JobId: ${jobId || "-"}\n` +
      `Player Count: ${playerCount ?? "-"}\n` +
      `Waktu: ${eventAt || "-"}`;

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

    if (!response.ok) {
      const text = await response.text();
      console.log("DISCORD ERROR:", text);
      return res.status(500).json({ ok: false, error: text });
    }

    return res.json({ ok: true, sentToDiscord: true });
  } catch (err) {
    console.log("SERVER ERROR:", String(err));
    return res.status(500).json({ ok: false, error: String(err) });
  }
}

app.post("/", handleJoinLog);
app.post("/roblox/join-log", handleJoinLog);
app.post("/relay/roblox/join-log", handleJoinLog);

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Relay jalan di port ${port}`);
});
