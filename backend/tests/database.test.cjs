const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { mkdirSync, mkdtempSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { openDatabase } = require('../src/database/connection.cjs');

test('la migración añade versiones sin reemplazar productos, cuentas ni pedidos existentes', t => {
  const parent = join(__dirname, '..', 'data');
  mkdirSync(parent, { recursive: true });
  const directory = mkdtempSync(join(parent, 'migration-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const filename = join(directory, 'legacy.sqlite');
  const legacy = new DatabaseSync(filename);
  legacy.exec(`
    CREATE TABLE products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, price_cents INTEGER NOT NULL,
      stock INTEGER NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL,
      image TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE users (
      id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'comprador', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE orders (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), request_key TEXT NOT NULL,
      customer_name TEXT NOT NULL, customer_email TEXT NOT NULL, phone TEXT NOT NULL,
      total_cents INTEGER NOT NULL, created_at TEXT NOT NULL, UNIQUE(user_id, request_key)
    );
    CREATE TABLE order_items (
      order_id TEXT NOT NULL REFERENCES orders(id), product_id TEXT NOT NULL REFERENCES products(id),
      name TEXT NOT NULL, quantity INTEGER NOT NULL, price_cents INTEGER NOT NULL,
      PRIMARY KEY(order_id, product_id)
    );
    CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    INSERT INTO metadata VALUES ('seeded', '1');
    INSERT INTO products VALUES ('existing-product', 'Producto existente', 1234, 7, 'Papel', 'Descripción existente', '', 1);
    INSERT INTO users (id, username, email, password_hash) VALUES ('existing-user', 'Cliente', 'cliente@example.com', 'existing-hash');
    INSERT INTO orders VALUES ('existing-order', 'existing-user', 'existing-request-key', 'Cliente', 'cliente@example.com', '', 1234, '2026-01-01T00:00:00.000Z');
    INSERT INTO order_items VALUES ('existing-order', 'existing-product', 'Producto existente', 1, 1234);
  `);
  legacy.close();

  const db = openDatabase(filename);
  try {
    const product = db.prepare('SELECT * FROM products').get();
    assert.equal(product.version, 1);
    assert.equal(product.stock, 7);
    assert.equal(product.price_cents, 1234);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM products').get().count, 1);
    assert.equal(db.prepare('SELECT password_hash FROM users').get().password_hash, 'existing-hash');
    assert.equal(db.prepare('SELECT id FROM orders').get().id, 'existing-order');
    assert.equal(db.prepare('SELECT quantity FROM order_items').get().quantity, 1);
    db.prepare('UPDATE products SET version = 4').run();
  } finally { db.close(); }
  const reopened = openDatabase(filename);
  try { assert.equal(reopened.prepare('SELECT version FROM products').get().version, 4); }
  finally { reopened.close(); }
});
