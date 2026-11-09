const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const db = new Database("database.db");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL
  )
`);

// READ all
app.get("/api/items", (req, res) => {
  res.json(db.prepare("SELECT * FROM items ORDER BY id DESC").all());
});

// Dashboard stats
app.get("/api/stats", (req, res) => {
  const stats = db.prepare(`
    SELECT COUNT(*) AS totalItems,
           COALESCE(SUM(price * quantity), 0) AS totalValue,
           COALESCE(SUM(CASE WHEN quantity <= 5 THEN 1 ELSE 0 END), 0) AS lowStock
    FROM items
  `).get();
  res.json(stats);
});

// CREATE
app.post("/api/items", (req, res) => {
  const { name, category, price, quantity } = req.body;
  if (!name || !category || price == null || quantity == null)
    return res.status(400).json({ error: "All fields are required" });
  const result = db
    .prepare("INSERT INTO items (name, category, price, quantity) VALUES (?, ?, ?, ?)")
    .run(name, category, price, quantity);
  res.status(201).json({ id: result.lastInsertRowid });
});

// UPDATE
app.put("/api/items/:id", (req, res) => {
  const { name, category, price, quantity } = req.body;
  const result = db
    .prepare("UPDATE items SET name=?, category=?, price=?, quantity=? WHERE id=?")
    .run(name, category, price, quantity, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});

// DELETE
app.delete("/api/items/:id", (req, res) => {
  const result = db.prepare("DELETE FROM items WHERE id=?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));