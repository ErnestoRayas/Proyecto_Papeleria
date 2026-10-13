const { randomUUID, randomBytes } = require('node:crypto');
const { openDatabase } = require('../src/database/connection.cjs');
const { hashPassword, hashToken } = require('../src/utils/security.cjs');
const { createUserRepository } = require('../src/repositories/users.cjs');
const { createSessionRepository } = require('../src/repositories/sessions.cjs');

async function main() {
  const [command, username, email] = process.argv.slice(2);
  const db = openDatabase();
  const users = createUserRepository(db), sessions = createSessionRepository(db);
  try {
    if (command === 'admin') {
      const password = process.env.ADMIN_PASSWORD;
      if (!username || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 10 || password.length > 128) {
        throw new Error('Define ADMIN_PASSWORD (10–128 caracteres) y ejecuta npm run admin:create -- usuario correo.');
      }
      users.insert(randomUUID(), username.trim(), email.trim().toLowerCase(), await hashPassword(password), 'admin');
      console.log('Administrador creado. Puedes iniciar sesión.');
    } else if (command === 'reset') {
      const user = users.findByUsername(username || '');
      if (!user) throw new Error('Usuario no encontrado. Uso: npm run password:token -- usuario');
      const token = randomBytes(32).toString('hex');
      sessions.clearResets(user.id);
      sessions.insertReset(hashToken(token), user.id, Date.now() + 30 * 60000);
      console.log(`Código de recuperación (válido 30 minutos, un solo uso): ${token}`);
    } else throw new Error('Comando no reconocido.');
  } finally { db.close(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
