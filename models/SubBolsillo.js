const db = require('./db');

module.exports = {
  create(bolsillo_id, nombre) {
    const stmt = db.prepare(`
      INSERT INTO sub_bolsillos (bolsillo_id, nombre, saldo)
      VALUES (?, ?, 0)
    `);
    const info = stmt.run(bolsillo_id, nombre);
    return info.lastInsertRowid;
  },

  findAllByBolsillo(bolsillo_id) {
    const stmt = db.prepare(`
      SELECT * FROM sub_bolsillos
      WHERE bolsillo_id = ?
      ORDER BY created_at ASC
    `);
    return stmt.all(bolsillo_id);
  },

  findById(id, bolsillo_id) {
    const stmt = db.prepare(`
      SELECT * FROM sub_bolsillos
      WHERE id = ? AND bolsillo_id = ?
    `);
    return stmt.get(id, bolsillo_id);
  },

  findByIdAndUser(id, usuario_id) {
    const stmt = db.prepare(`
      SELECT sb.* FROM sub_bolsillos sb
      JOIN bolsillos b ON sb.bolsillo_id = b.id
      WHERE sb.id = ? AND b.usuario_id = ?
    `);
    return stmt.get(id, usuario_id);
  },

  updateNombre(id, bolsillo_id, nombre) {
    const stmt = db.prepare(`
      UPDATE sub_bolsillos
      SET nombre = ?
      WHERE id = ? AND bolsillo_id = ?
    `);
    return stmt.run(nombre, id, bolsillo_id);
  },

  updateSaldo(id, bolsillo_id, monto) {
    const stmt = db.prepare(`
      UPDATE sub_bolsillos
      SET saldo = saldo + ?
      WHERE id = ? AND bolsillo_id = ?
    `);
    return stmt.run(monto, id, bolsillo_id);
  },

  delete(id, bolsillo_id) {
    const stmt = db.prepare(`
      DELETE FROM sub_bolsillos
      WHERE id = ? AND bolsillo_id = ?
    `);
    return stmt.run(id, bolsillo_id);
  },

  // Verificar si un bolsillo tiene sub-bolsillos
  hasSubBolsillos(bolsillo_id) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM sub_bolsillos WHERE bolsillo_id = ?');
    const result = stmt.get(bolsillo_id);
    return result.count > 0;
  },

  // Obtener el saldo total de todos los sub-bolsillos de un bolsillo
  getTotalSaldo(bolsillo_id) {
    const stmt = db.prepare('SELECT SUM(saldo) as total FROM sub_bolsillos WHERE bolsillo_id = ?');
    const result = stmt.get(bolsillo_id);
    return result.total || 0;
  }
};
