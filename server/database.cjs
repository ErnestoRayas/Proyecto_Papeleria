const { DatabaseSync } = require('node:sqlite');
const { mkdirSync } = require('node:fs');
const { dirname, join } = require('node:path');
const products = require('../src/data/products.json');

function openDatabase(filename = process.env.DB_PATH || join(__dirname, 'data', 'papeleria.sqlite')) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'comprador' CHECK(role IN ('comprador', 'admin')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS password_resets (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, price_cents INTEGER NOT NULL CHECK(price_cents > 0),
      stock INTEGER NOT NULL CHECK(stock >= 0), category TEXT NOT NULL,
      description TEXT NOT NULL, image TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      request_key TEXT NOT NULL, customer_name TEXT NOT NULL, customer_email TEXT NOT NULL,
      phone TEXT NOT NULL, total_cents INTEGER NOT NULL, created_at TEXT NOT NULL,
      UNIQUE(user_id, request_key)
    );
    CREATE TABLE IF NOT EXISTS order_items (
      order_id TEXT NOT NULL REFERENCES orders(id), product_id TEXT NOT NULL REFERENCES products(id),
      name TEXT NOT NULL, quantity INTEGER NOT NULL, price_cents INTEGER NOT NULL,
      PRIMARY KEY(order_id, product_id)
    );
  `);
  // Seed only a new database: removing the last product must never recreate the catalog.
  db.exec('CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  if (!db.prepare("SELECT key FROM metadata WHERE key = 'seeded'").get()) {
    const insert = db.prepare('INSERT INTO products (id, name, price_cents, stock, category, description, image) VALUES (?, ?, ?, ?, ?, ?, ?)');
    db.exec('BEGIN IMMEDIATE');
    try {
      for (const p of products) insert.run(p.id, p.name, Math.round(p.price * 100), p.stock, p.category, p.description, p.image);
      db.prepare('INSERT INTO metadata VALUES (?, ?)').run('seeded', '1');
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  return db;
}

module.exports = { openDatabase };
