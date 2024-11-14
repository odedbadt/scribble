import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 8080   ;

// Serve static files (CSS and JS)
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "static")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));
app.set('trust proxy', true);

// Set up route for the main page
app.get("/login", (req, res) => {
  const base_url = req.protocol + '://' + req.get('host');
  res.render("login.ejs", {
    "client_id": '983437923698-shfpf6udie0o0akgoa3caj7bdvonkhvo.apps.googleusercontent.com',
    "next_state": 'redirected',
    "scopes": "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.meet.readonly https://www.googleapis.com/auth/drive.metadata https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.photos.readonly https://www.googleapis.com/auth/drive.readonly",
  "base_url":base_url});
});

app.get("/main", (req, res) => {
  res.render("main_screen.ejs", {"dbg": false});
});
app.get("/main_dbg", (req, res) => {
    res.render("main_screen.ejs", {"dbg": true});
  });
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});