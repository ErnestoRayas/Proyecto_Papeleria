function createUserRepository(db) {
  return {
    list: () => db.prepare('SELECT * FROM users ORDER BY created_at DESC').all(),
    find: id => db.prepare('SELECT * FROM users WHERE id = ?').get(id),
    findByUsername: username => db.prepare('SELECT * FROM users WHERE username = ?').get(username),
    insert: (id, username, email, passwordHash, role = 'comprador') => db.prepare('INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(id, username, email, passwordHash, role),
    updatePassword: (id, passwordHash) => db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, id)
  };
}
module.exports = { createUserRepository };
