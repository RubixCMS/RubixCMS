const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const validator = require("validator");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;
const FILE_PATH = path.join(__dirname, "users.txt");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: "your-secret-key", //edit the secret keys
        resave: false,
        saveUninitialized: true,
    })
);

function loadUsers() {
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
    return users;
}

app.get("/", (req, res) => {
    const users = loadUsers();
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

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = { email, password: hashedPassword, phone, username };

        fs.appendFileSync(FILE_PATH, JSON.stringify(user) + "\n", "utf8");
        res.redirect("/");
    } catch (error) {
        console.error("Error writing user data:", error);
        return res.send("Erreur lors de l'ajout de l'utilisateur.");
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.send("Email et mot de passe sont requis !");
    }

    const users = loadUsers();
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.send("Email ou mot de passe incorrect.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.send("Email ou mot de passe incorrect.");
    }

    req.session.user = user;
    res.redirect("/home");
});

app.get('/home', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const users = loadUsers();
    const user = users.find(u => u.email === req.session.user.email);
    res.render("home", { user });
});

app.get('/service', (req, res) => {
    console.log("Session user:", req.session.user);

    if (!req.session.user) {
        return res.redirect('/service');
    }

    const users = loadUsers();
    console.log("Loaded users:", users);

    const user = users.find(u => u.email === req.session.user.email);
    console.log("Found user:", user);

    if (!user) {
        return res.send("User not found.");
    }

    res.render("service", { user });
});

app.get('/logout', (req, res) => {

    req.session.destroy()

    res.render("login");
});

app.listen(PORT, () => {
    console.log(`RubixCMS a démarré sur le port ${PORT}`);
});
