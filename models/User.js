const db = require('./db');

module.exports = {
  findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM usuarios WHERE email = ?');
    return stmt.get(email);
  },
  create(email, passwordHash) {
    const stmt = db.prepare('INSERT INTO usuarios (email, password) VALUES (?, ?)');
    const info = stmt.run(email, passwordHash);
    return info.lastInsertRowid;
  }
};