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
  const jobId = body.jobId && String(body.jobId).trim() !== ""
    ? body.jobId
    : "Studio / Tidak tersedia";
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
            value: `\`${username}\``,
            inline: true
          },
          {
            name: "Display Name",
            value: `\`${displayName}\``,
            inline: true
          },
          {
            name: "Role",
            value: `\`${role}\``,
            inline: true
          },
          {
            name: "UserId",
            value: `\`${userId}\``,
            inline: true
          },
          {
            name: "PlaceId",
            value: `\`${placeId}\``,
            inline: false
          },
          {
            name: "Place Name",
            value: `\`${placeName}\``,
            inline: false
          },
          {
            name: "JobId",
            value: `\`${jobId}\``,
            inline: false
          },
          {
            name: "Total Player Server",
            value: `\`${playerCount}\``,
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

  const text = await response.text();
  console.log("DISCORD STATUS:", response.status);
  if (text) {
    console.log("DISCORD BODY:", text.slice(0, 300));
  }

  if (!response.ok) {
    throw new Error(`Discord ${response.status}: ${text}`);
  }
}
