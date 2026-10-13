function createProductRepository(db) {
  return {
    list: () => db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY rowid').all(),
    find: id => db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(id),
    insert: (id, values) => db.prepare('INSERT INTO products (id, name, price_cents, stock, category, description, image) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, ...values),
    update: (id, version, values) => db.prepare('UPDATE products SET name = ?, price_cents = ?, stock = ?, category = ?, description = ?, image = ?, version = version + 1 WHERE id = ? AND active = 1 AND version = ?').run(...values, id, version),
    retire: id => db.prepare('UPDATE products SET active = 0, version = version + 1 WHERE id = ? AND active = 1').run(id),
    deductStock: (id, quantity) => db.prepare('UPDATE products SET stock = stock - ?, version = version + 1 WHERE id = ?').run(quantity, id)
  };
}
module.exports = { createProductRepository };
