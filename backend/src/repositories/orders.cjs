function createOrderRepository(db) {
  return {
    list: user => user.role === 'admin'
      ? db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
      : db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(user.id),
    find: id => db.prepare('SELECT * FROM orders WHERE id = ?').get(id),
    findByRequest: (userId, key) => db.prepare('SELECT * FROM orders WHERE user_id = ? AND request_key = ?').get(userId, key),
    items: id => db.prepare('SELECT product_id AS id, name, quantity, price_cents FROM order_items WHERE order_id = ?').all(id),
    insert: values => db.prepare('INSERT INTO orders (id, user_id, request_key, customer_name, customer_email, phone, total_cents, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(...values),
    insertItem: (orderId, product) => db.prepare('INSERT INTO order_items (order_id, product_id, name, quantity, price_cents) VALUES (?, ?, ?, ?, ?)').run(orderId, product.id, product.name, product.quantity, product.price_cents)
  };
}
module.exports = { createOrderRepository };
