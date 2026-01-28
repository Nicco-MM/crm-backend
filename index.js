const express = require("express");
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/webhook/evolution", (req, res) => {
  console.log("EVENT FROM EVOLUTION:", req.body);
  res.json({ status: "received" });
});

app.listen(PORT, () => {
  console.log("CRM backend running on port " + PORT);
});
