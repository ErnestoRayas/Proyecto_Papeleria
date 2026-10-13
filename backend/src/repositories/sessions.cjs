function createSessionRepository(db) {
  return {
    findUser: (hash, now) => db.prepare('SELECT u.* FROM users u JOIN sessions s ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?').get(hash, now),
    clearExpired: now => db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now),
    insert: (hash, userId, expires) => db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(hash, userId, expires),
    remove: hash => db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hash),
    removeForUser: id => db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id),
    findReset: (hash, now) => db.prepare('SELECT * FROM password_resets WHERE token_hash = ? AND expires_at > ?').get(hash, now),
    clearResets: id => db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(id),
    insertReset: (hash, userId, expires) => db.prepare('INSERT INTO password_resets VALUES (?, ?, ?)').run(hash, userId, expires)
  };
}
module.exports = { createSessionRepository };
