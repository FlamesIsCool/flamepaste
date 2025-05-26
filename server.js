const express = require("express");
const { nanoid } = require("nanoid");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Use a persistent or temp path
const DB_PATH = path.join(__dirname, "pastes.db");
const db = new sqlite3.Database(DB_PATH);

// Create table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS pastes (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT,
      language TEXT,
      visibility TEXT,
      createdAt TEXT,
      expiresAt TEXT
    )
  `);
});

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function isExpired(expiresAt) {
  return expiresAt && new Date(expiresAt) < new Date();
}

// Home Page
app.get("/", (req, res) => {
  res.render("index", { paste: null, request: req });
});

// Create Paste
app.post("/create", (req, res) => {
  const { title, content, language, visibility, expiration } = req.body;
  const id = nanoid(6);
  const now = new Date();
  let expiresAt = null;

  if (expiration === "10min") expiresAt = new Date(now.getTime() + 10 * 60000);
  else if (expiration === "1h") expiresAt = new Date(now.getTime() + 60 * 60000);

  db.run(
    `INSERT INTO pastes (id, title, content, language, visibility, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, title || "Untitled", content, language || "plaintext", visibility || "public", now.toISOString(), expiresAt?.toISOString() || null],
    () => {
      res.redirect(`/paste/${id}`);
    }
  );
});

// View Paste
app.get("/paste/:id", (req, res) => {
  db.get(`SELECT * FROM pastes WHERE id = ?`, [req.params.id], (err, paste) => {
    if (!paste || isExpired(paste.expiresAt) || paste.visibility === "private") {
      return res.status(404).send("Paste not found or expired/private.");
    }
    res.render("index", { paste, request: req });
  });
});

// Raw View
app.get("/raw/:id", (req, res) => {
  db.get(`SELECT * FROM pastes WHERE id = ?`, [req.params.id], (err, paste) => {
    if (!paste || isExpired(paste.expiresAt)) return res.status(404).send("Not found.");
    res.set("Content-Type", "text/plain").send(paste.content);
  });
});

// Public History
app.get("/history", (req, res) => {
  db.all(
    `SELECT * FROM pastes WHERE visibility = 'public' AND (expiresAt IS NULL OR expiresAt > ?) ORDER BY createdAt DESC LIMIT 10`,
    [new Date().toISOString()],
    (err, pastes) => {
      res.render("history", { pastes, request: req });
    }
  );
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
