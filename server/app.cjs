const express = require('express');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { randomBytes, randomUUID } = require('node:crypto');
const { join } = require('node:path');
const { existsSync } = require('node:fs');
const { hashPassword, verifyPassword, hashToken, publicUser } = require('./security.cjs');

class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (condition, message, status = 400) => { if (condition) throw new ApiError(status, message); };
const text = (value, max = 100) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const validEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validPassword = password => typeof password === 'string' && password.length >= 10 && password.length <= 128;
const productView = p => ({ id: p.id, name: p.name, price: p.price_cents / 100, stock: p.stock, category: p.category, description: p.description, image: p.image });

function createApp(db, { production = process.env.NODE_ENV === 'production', origin = process.env.APP_ORIGIN || 'http://localhost:3000', limits = true } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: production ? {
    directives: { 'img-src': ["'self'", 'https:', 'data:'], 'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], 'font-src': ["'self'", 'https://fonts.gstatic.com'], 'upgrade-insecure-requests': [] }
  } : false, strictTransportSecurity: production ? undefined : false }));
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // Custom headers require a CORS preflight; cross-origin access is deliberately not enabled.
      if (req.get('X-Requested-With') !== 'PapeleriaKaren' || (req.get('Origin') && req.get('Origin') !== origin)) {
        return res.status(403).json({ message: 'Origen de la solicitud no permitido.' });
      }
    }
    next();
  });
  app.use(express.json({ limit: '32kb' }));
  app.use('/api', (req, res, next) => { req.body ||= {}; next(); });
  if (limits) {
    app.use('/api', rateLimit({ windowMs: 60000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Demasiadas solicitudes. Espera un minuto.' } }));
    app.use('/api/auth', rateLimit({ windowMs: 15 * 60000, limit: 40, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Demasiados intentos. Inténtalo en 15 minutos.' } }));
  }
  app.use('/api', (req, res, next) => {
    const token = (req.headers.cookie || '').split(';').map(c => c.trim()).find(c => c.startsWith('pk_session='))?.slice(11);
    if (token && /^[a-f0-9]{64}$/.test(token)) {
      req.user = db.prepare('SELECT u.* FROM users u JOIN sessions s ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?').get(hashToken(token), Date.now());
      req.tokenHash = hashToken(token);
    }
    next();
  });
  const authenticated = (req, res, next) => req.user ? next() : res.status(401).json({ message: 'Inicia sesión para continuar.' });
  const admin = (req, res, next) => authenticated(req, res, () => req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Necesitas permisos de administración.' }));
  const session = (res, user) => {
    const token = randomBytes(32).toString('hex');
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
    db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(hashToken(token), user.id, Date.now() + 7 * 86400000);
    res.cookie('pk_session', token, { httpOnly: true, secure: production, sameSite: 'strict', path: '/', maxAge: 7 * 86400000 });
    return publicUser(user);
  };
  const orderView = row => ({
    id: row.id, customerName: row.customer_name, customerEmail: row.customer_email,
    total: row.total_cents / 100, createdAt: row.created_at,
    items: db.prepare('SELECT product_id AS id, name, quantity, price_cents FROM order_items WHERE order_id = ?').all(row.id).map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price_cents / 100 }))
  });

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/api/products', (req, res) => res.json(db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY rowid').all().map(productView)));
  app.get('/api/auth/me', (req, res) => res.json({ user: req.user ? publicUser(req.user) : null }));
  app.post('/api/auth/register', async (req, res) => {
    const username = text(req.body.username, 40), email = text(req.body.email, 254).toLowerCase();
    fail(!/^[\p{L}\p{N}_ .-]{3,40}$/u.test(username), 'El usuario debe tener entre 3 y 40 caracteres.');
    fail(!validEmail(email), 'Ingresa un correo válido.');
    fail(!validPassword(req.body.password), 'La contraseña debe tener entre 10 y 128 caracteres.');
    const passwordHash = await hashPassword(req.body.password);
    const id = randomUUID();
    try { db.prepare('INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)').run(id, username, email, passwordHash); }
    catch (error) { if (error.code?.includes('CONSTRAINT') || error.message.includes('UNIQUE')) throw new ApiError(409, 'El usuario o correo ya está registrado.'); throw error; }
    res.status(201).json({ user: session(res, db.prepare('SELECT * FROM users WHERE id = ?').get(id)) });
  });
  app.post('/api/auth/login', async (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(text(req.body.username, 40));
    fail(typeof req.body.password !== 'string' || req.body.password.length > 128, 'Usuario o contraseña incorrectos.', 401);
    // A dummy derivation keeps nonexistent users on the same expensive verification path.
    const matches = await verifyPassword(req.body.password, user?.password_hash || `${'0'.repeat(32)}:${'0'.repeat(128)}`);
    fail(!user || !matches, 'Usuario o contraseña incorrectos.', 401);
    res.json({ user: session(res, user) });
  });
  app.post('/api/auth/logout', (req, res) => {
    if (req.tokenHash) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(req.tokenHash);
    res.clearCookie('pk_session', { httpOnly: true, secure: production, sameSite: 'strict', path: '/' });
    res.json({ ok: true });
  });
  app.post('/api/auth/reset-password', async (req, res) => {
    fail(!validPassword(req.body.password), 'La contraseña debe tener entre 10 y 128 caracteres.');
    const token = text(req.body.token, 64);
    fail(!/^[a-f0-9]{64}$/.test(token), 'El código es inválido o ha vencido.');
    const passwordHash = await hashPassword(req.body.password);
    db.exec('BEGIN IMMEDIATE');
    try {
      const reset = db.prepare('SELECT * FROM password_resets WHERE token_hash = ? AND expires_at > ?').get(hashToken(token), Date.now());
      fail(!reset, 'El código es inválido o ha vencido.');
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, reset.user_id);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(reset.user_id);
      db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(reset.user_id);
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
    res.json({ ok: true });
  });

  app.get('/api/orders', authenticated, (req, res) => {
    const rows = req.user.role === 'admin' ? db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() : db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(rows.map(orderView));
  });
  app.post('/api/orders', authenticated, (req, res) => {
    const { items, requestKey } = req.body;
    const customerName = text(req.body.customerName), customerEmail = text(req.body.customerEmail, 254), phone = text(req.body.phone, 30);
    fail(!customerName || !validEmail(customerEmail), 'Completa tu nombre y un correo válido.');
    fail(typeof requestKey !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(requestKey), 'Identificador de pedido inválido.');
    fail(!Array.isArray(items) || !items.length || items.length > 100, 'El carrito debe contener de 1 a 100 productos.');
    const ids = new Set();
    for (const item of items) {
      fail(!item || typeof item.id !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999 || ids.has(item.id), 'El carrito contiene productos o cantidades inválidos.');
      ids.add(item.id);
    }
    db.exec('BEGIN IMMEDIATE');
    let result, created = true;
    try {
      const existing = db.prepare('SELECT * FROM orders WHERE user_id = ? AND request_key = ?').get(req.user.id, requestKey);
      if (existing) { result = orderView(existing); created = false; }
      else {
        const lines = items.map(item => {
          const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(item.id);
          fail(!product, 'Un producto ya no está disponible.', 409);
          fail(product.stock < item.quantity, `Solo quedan ${product.stock} unidades de ${product.name}.`, 409);
          fail(item.price !== product.price_cents / 100, `El precio de ${product.name} cambió. Revisa el carrito y confirma de nuevo.`, 409);
          return { ...product, quantity: item.quantity };
        });
        const id = randomUUID(), total = lines.reduce((sum, p) => sum + p.price_cents * p.quantity, 0);
        db.prepare('INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, req.user.id, requestKey, customerName, customerEmail, phone, total, new Date().toISOString());
        for (const p of lines) {
          db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(p.quantity, p.id);
          db.prepare('INSERT INTO order_items VALUES (?, ?, ?, ?, ?)').run(id, p.id, p.name, p.quantity, p.price_cents);
        }
        result = orderView(db.prepare('SELECT * FROM orders WHERE id = ?').get(id));
      }
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
    res.status(created ? 201 : 200).json(result);
  });

  function productInput(body) {
    const name = text(body.name), category = text(body.category, 40), description = text(body.description, 500), image = text(body.image, 2000);
    fail(!name || !category || !description, 'Completa nombre, categoría y descripción.');
    fail(typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0.01 || body.price > 1000000, 'El precio debe estar entre $0.01 y $1,000,000.');
    fail(!Number.isInteger(body.stock) || body.stock < 0 || body.stock > 1000000, 'Las existencias deben ser un número entero positivo o cero.');
    fail(image && !/^https:\/\//i.test(image) && !/^\/products\/[a-z0-9-]+\.(webp|png|jpg|svg)$/i.test(image), 'Usa una imagen HTTPS o una ruta local /products/archivo.webp.');
    return [name, Math.round(body.price * 100), body.stock, category, description, image];
  }
  app.post('/api/products', admin, (req, res) => {
    const values = productInput(req.body), id = randomUUID();
    db.prepare('INSERT INTO products (id, name, price_cents, stock, category, description, image) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, ...values);
    res.status(201).json(productView(db.prepare('SELECT * FROM products WHERE id = ?').get(id)));
  });
  app.put('/api/products/:id', admin, (req, res) => {
    const values = productInput(req.body);
    const update = db.prepare('UPDATE products SET name = ?, price_cents = ?, stock = ?, category = ?, description = ?, image = ? WHERE id = ? AND active = 1').run(...values, req.params.id);
    fail(!update.changes, 'Producto no encontrado.', 404);
    res.json(productView(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)));
  });
  app.delete('/api/products/:id', admin, (req, res) => {
    const update = db.prepare('UPDATE products SET active = 0 WHERE id = ? AND active = 1').run(req.params.id);
    fail(!update.changes, 'Producto no encontrado.', 404);
    res.json({ ok: true });
  });
  app.get('/api/users', admin, (req, res) => res.json(db.prepare('SELECT * FROM users ORDER BY created_at DESC').all().map(publicUser)));
  app.use('/api', (req, res) => res.status(404).json({ message: 'Ruta no encontrada.' }));
  const build = join(__dirname, '..', 'build');
  if (existsSync(join(build, 'index.html'))) {
    app.use(express.static(build));
    app.get('/{*path}', (req, res) => res.sendFile(join(build, 'index.html')));
  }
  app.use((error, req, res, next) => {
    const status = error.status || 500;
    if (status >= 500) console.error(error);
    res.status(status).json({ message: status >= 500 ? 'No pudimos completar la operación. Inténtalo de nuevo.' : error.type === 'entity.parse.failed' ? 'El formato de la solicitud no es válido.' : error.message });
  });
  return app;
}

module.exports = { createApp };
