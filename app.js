const express = require("express");

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const SHARED_SECRET = process.env.SHARED_SECRET;

// true = auth dimatiin sementara buat ngetes
const BYPASS_AUTH = true;

app.use((req, res, next) => {
  console.log("REQ MASUK:", req.method, req.url);
  next();
});

app.get("/", (req, res) => {
  res.send("Relay aktif bro");
});

app.get("/roblox/join-log", (req, res) => {
  res.send("Endpoint join-log siap bro");
});

async function handleJoinLog(req, res) {
  try {
    const auth = req.headers["x-shared-secret"];

    console.log("HEADER ADA:", !!auth);
    console.log("HEADER LEN:", (auth || "").length);
    console.log("ENV LEN:", (SHARED_SECRET || "").length);
    console.log("MATCH:", auth === SHARED_SECRET);
    console.log("BODY:", JSON.stringify(req.body));

    if (!BYPASS_AUTH && (!SHARED_SECRET || auth !== SHARED_SECRET)) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const {
      eventType,
      userId,
      username,
      displayName,
      role,
      placeId,
      placeName,
      jobId,
      playerCount,
      eventAt
    } = req.body || {};

    const dateObj = eventAt ? new Date(eventAt) : null;

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
      : "Tidak diketahui";

    const formattedJobId =
      jobId && String(jobId).trim() !== ""
        ? `\`${jobId}\``
        : "`Studio / Tidak tersedia`";

    const isLeave = eventType === "leave";

    const discordPayload = {
      username: "Absensi",
      embeds: [
        {
          title: isLeave
            ? "Admin/Target Keluar Server"
            : "Admin/Target Masuk Server",
          color: isLeave ? 15158332 : 5763719,
          fields: [
            {
              name: "Username",
              value: username ? `\`${username}\`` : "`-`",
              inline: true
            },
            {
              name: "Display Name",
              value: displayName ? `\`${displayName}\`` : "`-`",
              inline: true
            },
            {
              name: "Role",
              value: role ? `\`${role}\`` : "`Unknown`",
              inline: true
            },
            {
              name: "UserId",
              value: userId ? `\`${userId}\`` : "`-`",
              inline: true
            },
            {
              name: "PlaceId",
              value: placeId ? `\`${placeId}\`` : "`-`",
              inline: false
            },
            {
              name: "Place Name",
              value: placeName ? `\`${placeName}\`` : "`-`",
              inline: false
            },
            {
              name: "JobId",
              value: formattedJobId,
              inline: false
            },
            {
              name: "Total Player Server",
              value: typeof playerCount === "number" ? `\`${playerCount}\`` : "`-`",
              inline: true
            },
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

    if (!DISCORD_WEBHOOK_URL) {
      return res.status(500).json({ ok: false, error: "DISCORD_WEBHOOK_URL belum diset" });
    }

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(discordPayload)
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
