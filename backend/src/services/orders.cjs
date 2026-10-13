const { randomUUID } = require('node:crypto');
const { fail } = require('../utils/errors.cjs');
const { text, validEmail } = require('../utils/validation.cjs');

function createOrderService({ orders, products, transact }) {
  const view = row => ({
    id: row.id, customerName: row.customer_name, customerEmail: row.customer_email,
    total: row.total_cents / 100, createdAt: row.created_at,
    items: orders.items(row.id).map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price_cents / 100 }))
  });
  return {
    list: user => orders.list(user).map(view),
    create(user, body) {
      const { items, requestKey } = body;
      const customerName = text(body.customerName), customerEmail = text(body.customerEmail, 254), phone = text(body.phone, 30);
      fail(!customerName || !validEmail(customerEmail), 'Completa tu nombre y un correo válido.');
      fail(typeof requestKey !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(requestKey), 'Identificador de pedido inválido.');
      fail(!Array.isArray(items) || !items.length || items.length > 100, 'El carrito debe contener de 1 a 100 productos.');
      const ids = new Set();
      for (const item of items) {
        fail(!item || typeof item.id !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999 || ids.has(item.id), 'El carrito contiene productos o cantidades inválidos.');
        ids.add(item.id);
      }
      return transact(() => {
        const existing = orders.findByRequest(user.id, requestKey);
        if (existing) return { order: view(existing), created: false };
        const lines = items.map(item => {
          const product = products.find(item.id);
          fail(!product, 'Un producto ya no está disponible.', 409);
          fail(product.stock < item.quantity, `Solo quedan ${product.stock} unidades de ${product.name}.`, 409);
          fail(item.price !== product.price_cents / 100, `El precio de ${product.name} cambió. Revisa el carrito y confirma de nuevo.`, 409);
          return { ...product, quantity: item.quantity };
        });
        const id = randomUUID(), total = lines.reduce((sum, p) => sum + p.price_cents * p.quantity, 0);
        orders.insert([id, user.id, requestKey, customerName, customerEmail, phone, total, new Date().toISOString()]);
        for (const p of lines) {
          products.deductStock(p.id, p.quantity);
          orders.insertItem(id, p);
        }
        return { order: view(orders.find(id)), created: true };
      });
    }
  };
}
module.exports = { createOrderService };
