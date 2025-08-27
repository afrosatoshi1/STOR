// server.js
const express = require("express");
const session = require("express-session");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "stor-secret",
    resave: false,
    saveUninitialized: false,
  })
);

// ===== In-memory "DB" =====
let users = [
  { email: "admin@stor.com", password: "admin123", role: "admin" },
];
let products = [
  { id: 1, name: "iPhone 15", price: 1200, category: "Phones" },
  { id: 2, name: "MacBook Pro", price: 2500, category: "Computers" },
];
let carts = {}; // { userEmail: [ {productId, qty} ] }

// ===== Auth Routes =====
app.post("/api/register", (req, res) => {
  const { email, password } = req.body;
  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ message: "User already exists" });
  }
  users.push({ email, password, role: "user" });
  res.json({ message: "Registered successfully" });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(
    (u) => u.email === email && u.password === password
  );
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  req.session.user = { email: user.email, role: user.role };
  res.json({ message: "Login successful", user: req.session.user });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

app.get("/api/session", (req, res) => {
  res.json({ user: req.session.user || null });
});

// ===== Product Routes =====
app.get("/api/products", (req, res) => {
  res.json(products);
});

app.post("/api/products", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "You must be admin to manage products" });
  }
  const { name, price, category } = req.body;
  const newProduct = { id: Date.now(), name, price, category };
  products.push(newProduct);
  res.json(newProduct);
});

app.delete("/api/products/:id", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "You must be admin to manage products" });
  }
  const id = parseInt(req.params.id);
  products = products.filter((p) => p.id !== id);
  res.json({ message: "Product deleted" });
});

// ===== Cart Routes =====
app.get("/api/cart", (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: "Login required" });
  res.json(carts[req.session.user.email] || []);
});

app.post("/api/cart", (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: "Login required" });
  const { productId, qty } = req.body;
  if (!carts[req.session.user.email]) carts[req.session.user.email] = [];
  carts[req.session.user.email].push({ productId, qty });
  res.json({ message: "Added to cart" });
});

// ===== Admin Page =====
app.get("/admin", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("You must be admin to manage products");
  }
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ===== Catch-all: Send index.html =====
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== Start Server =====
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
