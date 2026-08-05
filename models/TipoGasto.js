const db = require('./db');

module.exports = {
  create(usuario_id, nombre) {
    const stmt = db.prepare('INSERT INTO tipos_gasto (usuario_id, nombre) VALUES (?, ?)');
    return stmt.run(usuario_id, nombre);
  },
  findAllByUser(usuario_id) {
    const stmt = db.prepare('SELECT * FROM tipos_gasto WHERE usuario_id = ? ORDER BY nombre');
    return stmt.all(usuario_id);
  },
  delete(id, usuario_id) {
    const stmt = db.prepare('DELETE FROM tipos_gasto WHERE id = ? AND usuario_id = ?');
    return stmt.run(id, usuario_id);
  }
};