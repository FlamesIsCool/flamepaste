const express = require("express");
const { nanoid } = require("nanoid");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const PASTE_FILE = path.join(__dirname, "pastes.json");

if (!fs.existsSync(PASTE_FILE)) fs.writeFileSync(PASTE_FILE, JSON.stringify({}));

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function loadPastes() {
  return JSON.parse(fs.readFileSync(PASTE_FILE, "utf-8"));
}

function savePastes(pastes) {
  fs.writeFileSync(PASTE_FILE, JSON.stringify(pastes, null, 2));
}

function isExpired(paste) {
  return paste.expiresAt && new Date(paste.expiresAt) < new Date();
}

app.get("/", (req, res) => {
  res.render("index", { paste: null, request: req });
});

app.post("/create", (req, res) => {
  const { title, content, language, visibility, expiration } = req.body;
  const id = nanoid(6);
  const now = new Date();
  let expiresAt = null;

  if (expiration === "10min") expiresAt = new Date(now.getTime() + 10 * 60000);
  else if (expiration === "1h") expiresAt = new Date(now.getTime() + 60 * 60000);

  const pastes = loadPastes();

  pastes[id] = {
    id,
    title: title || "Untitled",
    content,
    language: language || "plaintext",
    visibility: visibility || "public",
    createdAt: now.toISOString(),
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
  };

  savePastes(pastes);
  res.redirect(`/paste/${id}`);
});

app.get("/paste/:id", (req, res) => {
  const pastes = loadPastes();
  const paste = pastes[req.params.id];

  if (!paste || isExpired(paste) || paste.visibility === "private") {
    return res.status(404).send("Paste not found or is private/expired.");
  }

  res.render("index", { paste, request: req });
});

app.get("/raw/:id", (req, res) => {
  const pastes = loadPastes();
  const paste = pastes[req.params.id];

  if (!paste || isExpired(paste)) return res.status(404).send("Not found or expired.");
  res.set("Content-Type", "text/plain").send(paste.content);
});

app.get("/history", (req, res) => {
  const pastes = Object.values(loadPastes())
    .filter(p => p.visibility === "public" && !isExpired(p))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  res.render("history", { pastes, request: req });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
