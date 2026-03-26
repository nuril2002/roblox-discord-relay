const express = require("express");

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const SHARED_SECRET = process.env.SHARED_SECRET;

// Health check
app.get("/", (req, res) => {
  res.send("Relay aktif bro ✅");
});

app.get("/relay", (req, res) => {
  res.send("Relay aktif bro ✅");
});

app.get("/relay/", (req, res) => {
  res.send("Relay aktif bro ✅");
});

async function handleJoinLog(req, res) {
  try {
    const auth = req.headers["x-shared-secret"];

    if (!SHARED_SECRET || auth !== SHARED_SECRET) {
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
            ? "\uD83D\uDD34 Admin/Target Keluar Server"
            : "\uD83D\uDFE2 Admin/Target Masuk Server",
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

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(discordPayload)
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ ok: false, error: text });
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}

// Support dua kemungkinan path
app.post("/roblox/join-log", handleJoinLog);
app.post("/relay/roblox/join-log", handleJoinLog);

const port = process.env.PORT || 3000;
app.listen(port, "127.0.0.1", () => {
  console.log(`Relay jalan di port ${port}`);
});