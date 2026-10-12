const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { openDatabase } = require('./database.cjs');
const { createApp } = require('./app.cjs');
const { hashToken } = require('./security.cjs');

async function fixture(t, options = {}) {
  const db = openDatabase(':memory:');
  const server = createApp(db, { limits: false, ...options }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); db.close(); });
  const url = `http://127.0.0.1:${server.address().port}/api`;
  const request = async (path, { method = 'GET', body, cookie, headers = {} } = {}) => {
    const response = await fetch(`${url}${path}`, { method, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'PapeleriaKaren', ...(cookie ? { Cookie: cookie } : {}), ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0], headers: response.headers };
  };
  const register = async (username = 'Cliente') => request('/auth/register', { method: 'POST', body: { username, email: `${username}@example.com`, password: 'una-contraseña-larga', role: 'admin', tipo: 'admin' } });
  const purchase = (cookie, items, requestKey = 'request-key-123456789') => request('/orders', { method: 'POST', cookie, body: { requestKey, items, customerName: 'Cliente', customerEmail: 'cliente@example.com', total: 0 } });
  return { db, request, register, purchase };
}

test('registro: hash, cookies HttpOnly y rol impuesto por el servidor', async t => {
  const { db, register, request } = await fixture(t);
  const result = await register();
  assert.equal(result.status, 201);
  assert.equal(result.data.user.tipo, 'comprador');
  assert.equal(result.data.user.password, undefined);
  assert.match(result.headers.get('set-cookie'), /HttpOnly/);
  assert.match(result.headers.get('set-cookie'), /SameSite=Strict/);
  const stored = db.prepare('SELECT * FROM users').get();
  assert.notEqual(stored.password_hash, 'una-contraseña-larga');
  assert.match(stored.password_hash, /^[a-f0-9]{32}:[a-f0-9]{128}$/);
  const me = await request('/auth/me', { cookie: result.cookie });
  assert.equal(me.data.user.id, stored.id);
  assert.equal((await register('cliente')).status, 409);
  assert.equal((await request('/auth/login', { method: 'POST', body: { username: 'CLIENTE', password: 'una-contraseña-larga' } })).status, 200);
  assert.equal((await request('/auth/login', { method: 'POST', body: { username: 'Cliente', password: 'incorrecta' } })).status, 401);
  assert.equal((await request('/auth/register', { method: 'POST', body: { username: 'Other', email: 'bad', password: '1234' } })).status, 400);
});

test('los productos son públicos y las operaciones de administración exigen permisos', async t => {
  const { db, request, register } = await fixture(t);
  assert.equal((await request('/products')).data.length, 16);
  assert.equal((await request('/users')).status, 401);
  const customer = await register();
  assert.equal((await request('/users', { cookie: customer.cookie })).status, 403);
  assert.equal((await request('/products', { method: 'POST', cookie: customer.cookie, body: {} })).status, 403);
  db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(customer.data.user.id);
  const body = { name: 'Marcadores', price: 12.5, stock: 3, category: 'Arte', description: 'Marcadores de colores', image: '' };
  const product = await request('/products', { method: 'POST', body, cookie: customer.cookie });
  assert.equal(product.status, 201);
  assert.equal((await request('/products')).data.find(p => p.id === product.data.id).price, 12.5);
  assert.equal((await request(`/products/${product.data.id}`, { method: 'PUT', cookie: customer.cookie, body: { ...body, stock: 1.5 } })).status, 400);
  assert.equal((await request(`/products/${product.data.id}`, { method: 'PUT', cookie: customer.cookie, body: { ...body, price: 16, stock: 2 } })).status, 200);
  assert.equal((await request(`/products/${product.data.id}`, { method: 'DELETE', cookie: customer.cookie })).status, 200);
  assert.equal((await request('/products')).data.some(p => p.id === product.data.id), false);
  const users = await request('/users', { cookie: customer.cookie });
  assert.equal(users.status, 200);
  assert.equal(users.data[0].password_hash, undefined);
});

test('los pedidos validan precios, total, stock y son idempotentes', async t => {
  const { db, register, request, purchase } = await fixture(t);
  const customer = await register();
  assert.equal((await purchase(null, [{ id: 'colores', quantity: 2, price: 95 }])).status, 401);
  assert.equal((await purchase(customer.cookie, [{ id: 'colores', quantity: 2, price: 1 }])).status, 409);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM orders').get().count, 0);
  assert.equal((await purchase(customer.cookie, [{ id: 'colores', quantity: 21, price: 95 }])).status, 409);
  for (const quantity of [-1, 0, 1.5, '2', null]) assert.equal((await purchase(customer.cookie, [{ id: 'colores', quantity, price: 95 }])).status, 400);
  assert.equal((await purchase(customer.cookie, [{ id: 'colores', quantity: 1, price: 95 }, { id: 'colores', quantity: 1, price: 95 }])).status, 400);
  const order = await purchase(customer.cookie, [{ id: 'colores', quantity: 2, price: 95 }]);
  assert.equal(order.status, 201);
  assert.equal(order.data.total, 190);
  assert.equal(db.prepare("SELECT stock FROM products WHERE id = 'colores'").get().stock, 18);
  const retry = await purchase(customer.cookie, [{ id: 'colores', quantity: 2, price: 95 }]);
  assert.equal(retry.status, 200);
  assert.equal(retry.data.id, order.data.id);
  assert.equal(db.prepare("SELECT stock FROM products WHERE id = 'colores'").get().stock, 18);
  const other = await register('OtroCliente');
  assert.deepEqual((await request('/orders', { cookie: other.cookie })).data, []);
  assert.equal((await request('/orders', { cookie: customer.cookie })).data.length, 1);
  db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(other.data.user.id);
  assert.equal((await request('/orders', { cookie: other.cookie })).data.length, 1);
});

test('dos compras simultáneas no venden dos veces la última unidad', async t => {
  const { db, register, purchase } = await fixture(t);
  const customer = await register();
  db.prepare("UPDATE products SET stock = 1 WHERE id = 'colores'").run();
  const results = await Promise.all([
    purchase(customer.cookie, [{ id: 'colores', quantity: 1, price: 95 }], 'simultaneous-request-0001'),
    purchase(customer.cookie, [{ id: 'colores', quantity: 1, price: 95 }], 'simultaneous-request-0002')
  ]);
  assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
  assert.equal(db.prepare("SELECT stock FROM products WHERE id = 'colores'").get().stock, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM orders').get().count, 1);
});

test('un pedido con una línea inválida no consume stock de ninguna otra', async t => {
  const { db, register, purchase } = await fixture(t);
  const customer = await register();
  const result = await purchase(customer.cookie, [{ id: 'colores', quantity: 2, price: 95 }, { id: 'missing', quantity: 1, price: 20 }]);
  assert.equal(result.status, 409);
  assert.equal(db.prepare("SELECT stock FROM products WHERE id = 'colores'").get().stock, 20);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM orders').get().count, 0);
});

test('logout, expiración y recuperación invalidan sesiones y el código solo sirve una vez', async t => {
  const { db, register, request } = await fixture(t);
  const customer = await register();
  const token = randomBytes(32).toString('hex');
  db.prepare('INSERT INTO password_resets VALUES (?, ?, ?)').run(hashToken(token), customer.data.user.id, Date.now() + 60000);
  const reset = await request('/auth/reset-password', { method: 'POST', body: { token, password: 'nueva-contraseña-segura' } });
  assert.equal(reset.status, 200);
  assert.equal((await request('/auth/me', { cookie: customer.cookie })).data.user, null);
  assert.equal((await request('/auth/reset-password', { method: 'POST', body: { token, password: 'otra-contraseña-segura' } })).status, 400);
  const login = await request('/auth/login', { method: 'POST', body: { username: 'Cliente', password: 'nueva-contraseña-segura' } });
  assert.equal(login.status, 200);
  assert.equal((await request('/auth/logout', { method: 'POST', cookie: login.cookie })).status, 200);
  assert.equal((await request('/auth/me', { cookie: login.cookie })).data.user, null);
  const second = await request('/auth/login', { method: 'POST', body: { username: 'Cliente', password: 'nueva-contraseña-segura' } });
  db.prepare('UPDATE sessions SET expires_at = 0').run();
  assert.equal((await request('/auth/me', { cookie: second.cookie })).data.user, null);
});

test('se rechazan escrituras de otro origen, formularios sin cabecera y JSON malformado', async t => {
  const { request } = await fixture(t);
  assert.equal((await request('/auth/logout', { method: 'POST', headers: { Origin: 'https://otro-sitio.com' } })).status, 403);
  assert.equal((await request('/auth/logout', { method: 'POST', headers: { 'X-Requested-With': '' } })).status, 403);
  assert.equal((await request('/auth/register', { method: 'POST' })).status, 400);
  assert.equal((await request('/unknown')).status, 404);
});

test('producción utiliza cookies Secure y cabeceras de seguridad', async t => {
  const { register, request } = await fixture(t, { production: true });
  const customer = await register();
  assert.match(customer.headers.get('set-cookie'), /Secure/);
  const health = await request('/health');
  assert.match(health.headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
});
