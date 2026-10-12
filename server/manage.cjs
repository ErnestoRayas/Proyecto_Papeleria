const { randomUUID, randomBytes } = require('node:crypto');
const { openDatabase } = require('./database.cjs');
const { hashPassword, hashToken } = require('./security.cjs');

async function main() {
  const [command, username, email] = process.argv.slice(2);
  const db = openDatabase();
  try {
    if (command === 'admin') {
      const password = process.env.ADMIN_PASSWORD;
      if (!username || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 10 || password.length > 128) {
        throw new Error('Define ADMIN_PASSWORD (10–128 caracteres) y ejecuta npm run admin:create -- usuario correo.');
      }
      db.prepare('INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(randomUUID(), username.trim(), email.trim().toLowerCase(), await hashPassword(password), 'admin');
      console.log('Administrador creado. Puedes iniciar sesión.');
    } else if (command === 'reset') {
      const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username || '');
      if (!user) throw new Error('Usuario no encontrado. Uso: npm run password:token -- usuario');
      const token = randomBytes(32).toString('hex');
      db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(user.id);
      db.prepare('INSERT INTO password_resets VALUES (?, ?, ?)').run(hashToken(token), user.id, Date.now() + 30 * 60000);
      console.log(`Código de recuperación (válido 30 minutos, un solo uso): ${token}`);
    } else throw new Error('Comando no reconocido.');
  } finally { db.close(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
