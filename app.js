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

// TEST: browser -> Railway -> Discord
app.get("/test-discord", async (req, res) => {
  try {
    if (!DISCORD_WEBHOOK_URL) {
      return res.status(500).send("DISCORD_WEBHOOK_URL kosong");
    }

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "Absensi",
        content: "Test dari Railway bro"
      })
    });

    const text = await response.text();
    return res.status(response.ok ? 200 : 500).send(
      `Discord status=${response.status} body=${text}`
    );
  } catch (err) {
    console.log("TEST DISCORD ERROR:", String(err));
    return res.status(500).send(String(err));
  }
});

// TEST: Roblox POST cuma dibales sukses dulu
function handleTest(req, res) {
  console.log("BODY:", JSON.stringify(req.body));
  return res.json({
    ok: true,
    message: "POST masuk ke Railway",
    path: req.path
  });
}

app.post("/", handleTest);
app.post("/roblox/join-log", handleTest);
app.post("/relay/roblox/join-log", handleTest);

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Relay jalan di port ${port}`);
});
