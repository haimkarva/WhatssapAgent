const express = require("express");

const { startWhatsApp } = require("./whatsapp");
startWhatsApp();

const app = express();

app.get("/ping", (req, res) => res.send("OK"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Ping server is listening on port", PORT);
});
