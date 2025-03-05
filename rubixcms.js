const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const validator = require("validator");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const config = require("./config.json");
const DB_PATH = path.join(__dirname, "users.db");

const db = new sqlite3.Database(DB_PATH);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: "your-secret-key",
        resave: false,
        saveUninitialized: true,
    })
);

app.use((req, res, next) => {
    res.locals.host = config.Host;
    next();
});

async function loadUsers() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM users", [], (err, rows) => {
            if (err) {
                reject("Error fetching users: " + err);
            } else {
                resolve(rows);
            }
        });
    });
}

app.get("/", async (req, res) => {
    const users = await loadUsers();
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

    const users = await loadUsers();
    
    if (users.some(user => user.email === email)) {
        return res.send("Cet email est déjà utilisé !");
    }
    if (users.some(user => user.username === username)) {
        return res.send("Ce nom d'utilisateur est déjà pris !");
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = { email, password: hashedPassword, phone, username };

        db.run(
            "INSERT INTO users (email, password, phone, username) VALUES (?, ?, ?, ?)",
            [user.email, user.password, user.phone, user.username],
            (err) => {
                if (err) {
                    console.error("Error inserting user:", err);
                    return res.send("Erreur lors de l'ajout de l'utilisateur.");
                }
                res.redirect("/");
            }
        );
    } catch (error) {
        console.error("Error writing user data:", error);
        return res.send("Erreur lors de l'ajout de l'utilisateur.");
    }
});

app.post("/deleteUser", (req, res) => {
    const { email } = req.body;

    db.run("DELETE FROM users WHERE email = ?", [email], (err) => {
        if (err) {
            console.error("Error deleting user:", err);
            return res.send("Erreur lors de la suppression de l'utilisateur.");
        }
        res.redirect("/userList");
    });
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.send("Email et mot de passe sont requis !");
    }

    const users = await loadUsers();
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

app.get("/home", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const users = await loadUsers();
    const user = users.find(u => u.email === req.session.user.email);
    res.render("home", { user });
});

app.get("/service", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const users = await loadUsers();
    const user = users.find(u => u.email === req.session.user.email);

    if (!user) {
        return res.send("User not found.");
    }

    res.render("service", { user });
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

app.get("/userlist", (req, res) => {
    res.redirect("/admin-users");
});

app.get("/settings", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const users = await loadUsers();
    const user = users.find(u => u.email === req.session.user.email);

    if (!user) {
        return res.send("User not found.");
    }

    res.render("settings", { user });
});

app.get("/admin/login", (req, res) => {
    res.render("admin/login");
});

app.post("/admin-login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.send("Email et mot de passe sont requis !");
    }

    const users = await loadUsers();
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.send("Email ou mot de passe incorrect.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.send("Email ou mot de passe incorrect.");
    }

    req.session.user = user;

    if (user.username != "admin") {
        return res.send("Vous n'êtes pas administrateur !");
    }
    else {
        res.redirect("/admin/home");
    }
});

app.get("/admin/home", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const users = await loadUsers();
    const user = users.find(u => u.email === req.session.user.email);
    const totalUsers = users.length;

    if (user.username != "admin") {
        res.redirect("/login");
        return res.send("Vous n'êtes pas administrateur !");
    } else {
        res.render("admin/home", { user, totalUsers });
    }
});

app.get("/admin/settings", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const users = await loadUsers();
    const user = users.find(u => u.email === req.session.user.email);
    const totalUsers = users.length;

    if (user.username != "admin") {
        res.redirect("/login");
        return res.send("Vous n'êtes pas administrateur !");
    } else {
        res.render("admin/settings", { user, totalUsers });
    }
});

app.get("/admin/users-panel", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const users = await loadUsers();
    const user = users.find(u => u.email === req.session.user.email);
    const totalUsers = users.length;

    if (user.username != "admin") {
        res.redirect("/admin/login");
        return res.send("Vous n'êtes pas administrateur !");
    } else {
        res.render("admin/users-panel", { user, totalUsers, users });
    }
});

app.listen(PORT, async () => {
    console.log(`RubixCMS a démarré sur le port ${PORT} pour l'hébergeur ${config.Host}`);

    await new Promise((resolve, reject) => {
        db.run(
            "CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, password TEXT, phone TEXT, username TEXT)",
            (err) => {
                if (err) {
                    reject("Error creating table: " + err);
                } else {
                    resolve();
                }
            }
        );
    });

    const users = await loadUsers();
    const adminUserExists = users.some(user => user.email === "admin@rubixcms.com");

    if (!adminUserExists) {
        console.log("Creating default admin user...");
        const hashedPassword = await bcrypt.hash("123", 10);
        const adminUser = {
            email: "admin@rubixcms.com",
            password: hashedPassword,
            phone: "1234567890",
            username: "admin"
        };

        db.run(
            "INSERT INTO users (email, password, phone, username) VALUES (?, ?, ?, ?)",
            [adminUser.email, adminUser.password, adminUser.phone, adminUser.username],
            (err) => {
                if (err) {
                    console.error("Error creating admin user:", err);
                } else {
                    console.log("Default admin user created.");
                }
            }
        );
    }
});
