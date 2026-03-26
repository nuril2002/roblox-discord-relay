const express = require("express");

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log("REQ MASUK:", req.method, req.url);
  next();
});

app.get("/", (req, res) => {
  res.send("Relay test hidup bro ✅");
});

app.get("/roblox/join-log", (req, res) => {
  res.send("Endpoint join-log siap bro ✅");
});

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
