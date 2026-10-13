const express = require('express');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { join } = require('node:path');
const { existsSync } = require('node:fs');
const { transaction } = require('./database/transaction.cjs');
const { createProductRepository } = require('./repositories/products.cjs');
const { createOrderRepository } = require('./repositories/orders.cjs');
const { createUserRepository } = require('./repositories/users.cjs');
const { createSessionRepository } = require('./repositories/sessions.cjs');
const { createProductService } = require('./services/products.cjs');
const { createOrderService } = require('./services/orders.cjs');
const { createAuthService } = require('./services/auth.cjs');
const { loadSession } = require('./middleware/auth.cjs');
const { requestPolicy } = require('./middleware/requestPolicy.cjs');
const { errorHandler } = require('./middleware/errorHandler.cjs');
const { authRoutes } = require('./routes/auth.cjs');
const { productRoutes } = require('./routes/products.cjs');
const { orderRoutes } = require('./routes/orders.cjs');
const { userRoutes } = require('./routes/users.cjs');

function createApp(db, { production = process.env.NODE_ENV === 'production', origin = process.env.APP_ORIGIN || 'http://localhost:3000', limits = true } = {}) {
  const app = express();
  const products = createProductRepository(db), orders = createOrderRepository(db);
  const users = createUserRepository(db), sessions = createSessionRepository(db);
  const transact = operation => transaction(db, operation);

  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: production ? {
    directives: { 'img-src': ["'self'", 'https:', 'data:'], 'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], 'font-src': ["'self'", 'https://fonts.gstatic.com'], 'upgrade-insecure-requests': [] }
  } : false, strictTransportSecurity: production ? undefined : false }));
  app.use('/api', requestPolicy(origin));
  app.use(express.json({ limit: '32kb' }));
  app.use('/api', (req, res, next) => { req.body ||= {}; next(); });
  if (limits) {
    app.use('/api', rateLimit({ windowMs: 60000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Demasiadas solicitudes. Espera un minuto.' } }));
    app.use('/api/auth', rateLimit({ windowMs: 15 * 60000, limit: 40, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Demasiados intentos. Inténtalo en 15 minutos.' } }));
  }
  app.use('/api', loadSession(sessions));
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes(createAuthService({ users, sessions, transact }), production));
  app.use('/api/products', productRoutes(createProductService(products)));
  app.use('/api/orders', orderRoutes(createOrderService({ orders, products, transact })));
  app.use('/api/users', userRoutes(users));
  app.use('/api', (req, res) => res.status(404).json({ message: 'Ruta no encontrada.' }));

  const build = join(__dirname, '..', '..', 'frontend', 'dist');
  if (existsSync(join(build, 'index.html'))) {
    app.use(express.static(build));
    app.get('/{*path}', (req, res) => res.sendFile(join(build, 'index.html')));
  }
  app.use(errorHandler);
  return app;
}
module.exports = { createApp };
