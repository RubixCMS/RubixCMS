const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const validator = require("validator");

const app = express();
const PORT = process.env.PORT || 30000;
const FILE_PATH = path.join(__dirname, "users.txt");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    let users = [];

    try {
        if (fs.existsSync(FILE_PATH)) {
            const lines = fs.readFileSync(FILE_PATH, "utf8").trim().split("\n");
            users = lines.map(line => {
                if (line.trim()) {
                    return JSON.parse(line);
                }
            }).filter(user => user);
        }
    } catch (error) {
        console.error("Error reading user data:", error);
    }

    res.render("index", { users });
});

app.post("/addUser", async (req, res) => {
    const { email, password, phone, username } = req.body;

    if (!email || !password || !phone || !username) {
        return res.send("Tous les champs sont requis !");
    }

    if (!validator.isEmail(email) || !validator.isMobilePhone(phone)) {
        return res.send("Format d'email ou de téléphone invalide !");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { email, password: hashedPassword, phone, username };

    try {
        fs.appendFileSync(FILE_PATH, JSON.stringify(user) + "\n", "utf8");
    } catch (error) {
        console.error("Error writing user data:", error);
        return res.send("Erreur lors de l'ajout de l'utilisateur.");
    }

    res.redirect("/");
});

app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur le port ${PORT}`);
});