const express = require("express");
const { nanoid } = require("nanoid");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const PASTE_FILE = path.join(__dirname, "pastes.json");

// Create paste file if it doesn't exist
if (!fs.existsSync(PASTE_FILE)) {
  fs.writeFileSync(PASTE_FILE, JSON.stringify({}));
}

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function loadPastes() {
  return JSON.parse(fs.readFileSync(PASTE_FILE, "utf-8"));
}

function savePastes(pastes) {
  fs.writeFileSync(PASTE_FILE, JSON.stringify(pastes, null, 2));
}

app.get("/", (req, res) => {
  res.render("index", { paste: null });
});

app.post("/create", (req, res) => {
  const content = req.body.content;
  const pasteId = nanoid(6);
  const pastes = loadPastes();

  pastes[pasteId] = {
    content,
    createdAt: new Date()
  };

  savePastes(pastes);
  res.redirect(`/paste/${pasteId}`);
});

app.get("/paste/:id", (req, res) => {
  const pastes = loadPastes();
  const paste = pastes[req.params.id];

  if (!paste) return res.status(404).send("Paste not found.");
  res.render("index", { paste });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
