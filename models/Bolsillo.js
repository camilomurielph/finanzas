const db = require('./db');

module.exports = {
  create(usuario_id, nombre) {
    // Obtener el orden máximo actual para asignar el siguiente
    const stmtMax = db.prepare('SELECT MAX(orden) as maxOrden FROM bolsillos WHERE usuario_id = ?');
    const result = stmtMax.get(usuario_id);
    const orden = (result.maxOrden || 0) + 1;

    const stmt = db.prepare(`
      INSERT INTO bolsillos (usuario_id, nombre, saldo, orden)
      VALUES (?, ?, 0, ?)
    `);
    const info = stmt.run(usuario_id, nombre, orden);
    return info.lastInsertRowid;
  },

  findAllByUser(usuario_id) {
    const stmt = db.prepare(`
      SELECT * FROM bolsillos
      WHERE usuario_id = ?
      ORDER BY orden ASC
    `);
    return stmt.all(usuario_id);
  },

  findById(id, usuario_id) {
    const stmt = db.prepare(`
      SELECT * FROM bolsillos
      WHERE id = ? AND usuario_id = ?
    `);
    return stmt.get(id, usuario_id);
  },

  updateNombre(id, usuario_id, nombre) {
    const stmt = db.prepare(`
      UPDATE bolsillos
      SET nombre = ?
      WHERE id = ? AND usuario_id = ?
    `);
    return stmt.run(nombre, id, usuario_id);
  },

  updateSaldo(id, usuario_id, monto) {
    // Incrementar o decrementar el saldo
    const stmt = db.prepare(`
      UPDATE bolsillos
      SET saldo = saldo + ?
      WHERE id = ? AND usuario_id = ?
    `);
    return stmt.run(monto, id, usuario_id);
  },

  delete(id, usuario_id) {
    const stmt = db.prepare(`
      DELETE FROM bolsillos
      WHERE id = ? AND usuario_id = ?
    `);
    return stmt.run(id, usuario_id);
  },

  // Actualizar orden (para drag & drop)
  updateOrden(id, usuario_id, nuevoOrden) {
    const stmt = db.prepare(`
      UPDATE bolsillos
      SET orden = ?
      WHERE id = ? AND usuario_id = ?
    `);
    return stmt.run(nuevoOrden, id, usuario_id);
  },

  // Obtener el número total de bolsillos del usuario
  countByUser(usuario_id) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM bolsillos WHERE usuario_id = ?');
    const result = stmt.get(usuario_id);
    return result.count;
  },

  // Obtener el saldo total de todos los bolsillos
  getTotalSaldo(usuario_id) {
    const stmt = db.prepare('SELECT SUM(saldo) as total FROM bolsillos WHERE usuario_id = ?');
    const result = stmt.get(usuario_id);
    return result.total || 0;
  }
};
