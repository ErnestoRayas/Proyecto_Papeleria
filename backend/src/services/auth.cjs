const { randomBytes, randomUUID } = require('node:crypto');
const { ApiError, fail } = require('../utils/errors.cjs');
const { text, validEmail, validPassword } = require('../utils/validation.cjs');
const { hashPassword, verifyPassword, hashToken } = require('../utils/security.cjs');

function createAuthService({ users, sessions, transact }) {
  return {
    async register(body) {
      const username = text(body.username, 40), email = text(body.email, 254).toLowerCase();
      fail(!/^[\p{L}\p{N}_ .-]{3,40}$/u.test(username), 'El usuario debe tener entre 3 y 40 caracteres.');
      fail(!validEmail(email), 'Ingresa un correo válido.');
      fail(!validPassword(body.password), 'La contraseña debe tener entre 10 y 128 caracteres.');
      const passwordHash = await hashPassword(body.password), id = randomUUID();
      try { users.insert(id, username, email, passwordHash); }
      catch (error) {
        if (error.code?.includes('CONSTRAINT') || error.message.includes('UNIQUE')) throw new ApiError(409, 'El usuario o correo ya está registrado.');
        throw error;
      }
      return users.find(id);
    },
    async login(body) {
      const user = users.findByUsername(text(body.username, 40));
      fail(typeof body.password !== 'string' || body.password.length > 128, 'Usuario o contraseña incorrectos.', 401);
      // Keep nonexistent users on the same expensive verification path.
      const matches = await verifyPassword(body.password, user?.password_hash || `${'0'.repeat(32)}:${'0'.repeat(128)}`);
      fail(!user || !matches, 'Usuario o contraseña incorrectos.', 401);
      return user;
    },
    createSession(userId) {
      const token = randomBytes(32).toString('hex');
      sessions.clearExpired(Date.now());
      sessions.insert(hashToken(token), userId, Date.now() + 7 * 86400000);
      return token;
    },
    logout(tokenHash) { if (tokenHash) sessions.remove(tokenHash); },
    async resetPassword(body) {
      fail(!validPassword(body.password), 'La contraseña debe tener entre 10 y 128 caracteres.');
      const token = text(body.token, 64);
      fail(!/^[a-f0-9]{64}$/.test(token), 'El código es inválido o ha vencido.');
      const passwordHash = await hashPassword(body.password);
      transact(() => {
        const reset = sessions.findReset(hashToken(token), Date.now());
        fail(!reset, 'El código es inválido o ha vencido.');
        users.updatePassword(reset.user_id, passwordHash);
        sessions.removeForUser(reset.user_id);
        sessions.clearResets(reset.user_id);
      });
    }
  };
}
module.exports = { createAuthService };
