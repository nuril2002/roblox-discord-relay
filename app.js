const express = require("express");

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

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

app.post("/", async (req, res) => {
  return handleJoinLog(req, res);
});

app.post("/roblox/join-log", async (req, res) => {
  return handleJoinLog(req, res);
});

app.post("/relay/roblox/join-log", async (req, res) => {
  return handleJoinLog(req, res);
});

async function handleJoinLog(req, res) {
  try {
    console.log("BODY:", JSON.stringify(req.body));

    if (!DISCORD_WEBHOOK_URL) {
      console.log("ERROR: DISCORD_WEBHOOK_URL kosong");
      return res.status(500).json({ ok: false, error: "DISCORD_WEBHOOK_URL kosong" });
    }

    const body = req.body || {};
    const eventType = body.eventType || "join";
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
      `${eventType === "leave" ? "KELUAR" : "MASUK"} SERVER\n` +
      `Username: ${username}\n` +
      `Display Name: ${displayName}\n` +
      `Role: ${role}\n` +
      `UserId: ${userId}\n` +
      `PlaceId: ${placeId}\n` +
      `Place Name: ${placeName}\n` +
      `JobId: ${jobId}\n` +
      `Player Count: ${playerCount}\n` +
      `Waktu: ${eventAt}`;

    const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "Absensi",
        content
      })
    });

    console.log("DISCORD STATUS:", discordResponse.status);

    if (!discordResponse.ok) {
      const text = await discordResponse.text();
      console.log("DISCORD ERROR BODY:", text);
      return res.status(500).json({ ok: false, error: text });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.log("SERVER ERROR:", err && err.stack ? err.stack : String(err));
    return res.status(500).json({ ok: false, error: String(err) });
  }
}

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Relay jalan di port ${port}`);
});
