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
const PRODUCT_PATH = path.join(__dirname, "products.json");

const db = new sqlite3.Database(DB_PATH);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: config.secret,
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
  res.render("auth/register", { users });
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

  if (users.some((user) => user.email === email)) {
    return res.send("Cet email est déjà utilisé !");
  }
  if (users.some((user) => user.username === username)) {
    return res.send("Ce nom d'utilisateur est déjà pris !");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      email,
      password: hashedPassword,
      phone,
      username,
      balance: 0,
    };

    db.run(
      "INSERT INTO users (email, password, phone, username, balance) VALUES (?, ?, ?, ?, ?)",
      [user.email, user.password, user.phone, user.username, user.balance],
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
    res.redirect("/admin/users-panel");
  });
});

app.get("/login", (req, res) => {
  res.render("auth/login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.send("Email et mot de passe sont requis !");
  }

  const users = await loadUsers();
  const user = users.find((u) => u.email === email);
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
  const user = users.find((u) => u.email === req.session.user.email);
  const email = user.email;
  const targetUser = users.find((u) => u.email === email);
  res.render("home", {
    user,
    users,
    userBalance: targetUser.balance,
    balance: user.balance,
  });
});

app.get("/service", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  const users = await loadUsers();
  const user = users.find((u) => u.email === req.session.user.email);

  if (!user) {
    return res.send("Utilisateur introuvable.");
  }

  res.render("service", { user });
});

app.get("/active-service", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  const users = await loadUsers();
  const user = users.find((u) => u.email === req.session.user.email);
  const email = user.email;
  const targetUser = users.find((u) => u.email === email);

  if (!user) {
    return res.send("Utilisateur introuvable.");
  }

  res.render("active-service", {
    user,
    users,
    userBalance: targetUser.balance,
    balance: user.balance,
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
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
  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.send("Email ou mot de passe incorrect.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.send("Email ou mot de passe incorrect.");
  }

  req.session.user = user;

  if (user.username !== "admin") {
    return res.send("Vous n'êtes pas administrateur !");
  } else {
    res.redirect("/admin/home");
  }
});

app.get("/admin/home", async (req, res) => {
  if (!req.session.user || req.session.user.username !== "admin") {
    return res.redirect("/login");
  }

  const users = await loadUsers();
  const user = users.find((u) => u.email === req.session.user.email);
  const totalUsers = users.length;

  res.render("admin/home", { user, totalUsers });
});

app.get("/admin/settings", async (req, res) => {
  if (!req.session.user || req.session.user.username !== "admin") {
    return res.redirect("/login");
  }

  const users = await loadUsers();
  const user = users.find((u) => u.email === req.session.user.email);
  const totalUsers = users.length;

  res.render("admin/settings", { user, totalUsers });
});

app.get("/admin/users-panel", async (req, res) => {
  if (!req.session.user || req.session.user.username !== "admin") {
    return res.redirect("/login");
  }

  const users = await loadUsers();
  const user = users.find((u) => u.email === req.session.user.email);
  const totalUsers = users.length;

  res.render("admin/users-panel", {
    user,
    totalUsers,
    users,
    balance: user.balance,
  });
});

app.get("/admin/user/balance", async (req, res) => {
  if (!req.session.user || req.session.user.username !== "admin") {
    return res.redirect("/login");
  }

  const users = await loadUsers();
  const user = users.find((u) => u.email === req.session.user.email);
  const totalUsers = users.length;

  const email = req.query.email;
  const targetUser = users.find((u) => u.email === email);

  if (!targetUser) {
    return res.send("Utilisateur introuvable.");
  }

  res.render("admin/user/balance", {
    user,
    totalUsers,
    targetUser,
    email,
    userBalance: targetUser.balance,
  });
});

app.post("/changeBalance", async (req, res) => {
  const { balance } = req.body;
  const email = req.query.email;

  if (!email || balance === undefined) {
    return res.send("Tous les champs sont requis !");
  }

  const users = await loadUsers();
  const user = users.find((u) => u.email === email);

  if (!user) {
    return res.send("Utilisateur non trouvé !");
  }

  db.run(
    "UPDATE users SET balance = ? WHERE email = ?",
    [balance, email],
    (err) => {
      if (err) {
        console.error("Erreur lors de la mise à jour du solde :", err);
        return res.send("Erreur lors de la mise à jour du solde.");
      }
      res.redirect("/admin/home");
    }
  );
});

app.get("/admin/settings/product", async (req, res) => {
  if (!req.session.user || req.session.user.username !== "admin") {
    return res.redirect("/login");
  }

  const users = await loadUsers();
  const user = users.find((u) => u.email === req.session.user.email);
  const totalUsers = users.length;

  fs.readFile("products.json", "utf8", (err, data) => {
    if (err) {
      res.send(err);
      return;
    }

    const products = JSON.parse(data);
    res.render("admin/settings/product", {
      user,
      totalUsers,
      users,
      balance: user.balance,
      products,
    });
  });
});

app.get("/admin/settings/global", async (req, res) => {
  if (!req.session.user || req.session.user.username !== "admin") {
    return res.redirect("/login");
  }

  const users = await loadUsers();
  const user = users.find((u) => u.email === req.session.user.email);
  const totalUsers = users.length;

  res.render("admin/settings/global", {
    user,
    totalUsers,
    users,
    balance: user.balance,
  });
});

app.post("/user/update-balance", async (req, res) => {
  const { email, amount } = req.body;

  if (!amount || isNaN(amount)) {
    return res.send("Montant invalide !");
  }

  const users = await loadUsers();
  const user = users.find((u) => u.email === email);

  if (!user) {
    return res.send("Utilisateur non trouvé.");
  }

  const newBalance = user.balance + parseFloat(amount);

  db.run(
    "UPDATE users SET balance = ? WHERE email = ?",
    [newBalance, email],
    (err) => {
      if (err) {
        console.error("Erreur lors de la mise à jour du solde :", err);
        return res.send("Erreur lors de la mise à jour du solde.");
      }
      res.redirect("/home");
    }
  );
});

app.post("/product-add", async (req, res) => {
  const product_name = req.body.product_name;
  const product_description = req.body.product_description;
  const product_price = req.body.product_price;

  if (!product_name || !product_description || !product_price) {
    return res.status(400).send("Tous les champs sont requis !");
  }

  let products = [];
  if (fs.existsSync(PRODUCT_PATH)) {
    const fileContent = fs.readFileSync(PRODUCT_PATH, "utf8");
    try {
      products = JSON.parse(fileContent);
    } catch (error) {
      return res.status(500).send("Erreur de lecture du fichier JSON");
    }
  }

  const newProduct = {
    name: product_name,
    description: product_description,
    price: product_price,
  };
  products.push(newProduct);

  try {
    fs.writeFileSync(PRODUCT_PATH, JSON.stringify(products, null, 4), "utf8");
    res.redirect("/admin/home");
  } catch (error) {
    return res.status(500).send("Erreur lors de l'écriture du fichier JSON");
  }
});

app.listen(PORT, async () => {
  console.log(
    `RubixCMS a démarré sur le port http://localhost:${PORT} pour l'hébergeur ${config.Host}`
  );

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
  const adminUserExists = users.some(
    (user) => user.email === "admin@rubixcms.com"
  );

  if (!adminUserExists) {
    console.log("Creating default admin user...");
    const hashedPassword = await bcrypt.hash("123", 10);
    const adminUser = {
      email: "admin@rubixcms.com",
      password: hashedPassword,
      phone: "1234567890",
      username: "admin",
    };

    db.run(
      "INSERT INTO users (email, password, phone, username) VALUES (?, ?, ?, ?)",
      [
        adminUser.email,
        adminUser.password,
        adminUser.phone,
        adminUser.username,
      ],
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
