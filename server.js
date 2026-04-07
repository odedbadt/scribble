import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 8080;
const BASE_PATH = (process.env.BASE_PATH || "").replace(/\/+$/, ""); // e.g. "/scribble"

const router = express.Router();

// Static assets (css, js bundles, images like butterfly.svg)
router.use(express.static(path.join(__dirname, "static")));
router.use("/stamps", express.static(path.join(__dirname, "static/stamps")));

// List available SVG stamp files
router.get("/stamps-list", (req, res) => {
  const stampsDir = path.join(__dirname, "static/stamps");
  const files = fs.existsSync(stampsDir)
    ? fs.readdirSync(stampsDir).filter(f => f.endsWith(".svg")).sort()
    : [];
  res.json(files);
});
router.use("/distro", express.static(path.join(__dirname, "distro")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));
app.set('trust proxy', true);

router.get("/login", (req, res) => {
  const base_url = req.protocol + '://' + req.get('host');
  res.render("login.ejs", {
    "client_id": '983437923698-shfpf6udie0o0akgoa3caj7bdvonkhvo.apps.googleusercontent.com',
    "next_state": 'redirected',
    "scopes": "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.meet.readonly https://www.googleapis.com/auth/drive.metadata https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.photos.readonly https://www.googleapis.com/auth/drive.readonly",
    "base_url": base_url
  });
});

router.get(["/", "/main"], (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use(BASE_PATH || "/", router);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}${BASE_PATH}`);
});