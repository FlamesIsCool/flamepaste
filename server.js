const express = require("express");
const { nanoid } = require("nanoid");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const PASTE_FILE = path.join(__dirname, "pastes.json");

// Ensure the pastes file exists
if (!fs.existsSync(PASTE_FILE)) {
  fs.writeFileSync(PASTE_FILE, JSON.stringify({}));
}

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Load pastes from file
function loadPastes() {
  return JSON.parse(fs.readFileSync(PASTE_FILE, "utf-8"));
}

// Save pastes to file
function savePastes(pastes) {
  fs.writeFileSync(PASTE_FILE, JSON.stringify(pastes, null, 2));
}

// Home page (new paste form)
app.get("/", (req, res) => {
  res.render("index", { paste: null, request: req });
});

// Create a new paste
app.post("/create", (req, res) => {
  const content = req.body.content;
  const pasteId = nanoid(6);
  const pastes = loadPastes();

  pastes[pasteId] = {
    content,
    createdAt: new Date().toISOString()
  };

  savePastes(pastes);
  res.redirect(`/paste/${pasteId}`);
});

// View a paste by ID
app.get("/paste/:id", (req, res) => {
  const pastes = loadPastes();
  const paste = pastes[req.params.id];

  if (!paste) {
    return res.status(404).send("Paste not found.");
  }

  res.render("index", { paste, request: req });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
