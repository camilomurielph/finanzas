const db = require('./db');

module.exports = {
  create(usuario_id, nombre, valor, dia_pago, frecuencia = 'mensual', mes_pago = null) {
    const stmt = db.prepare(`
      INSERT INTO suscripciones (usuario_id, nombre, valor, dia_pago, frecuencia, mes_pago)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(usuario_id, nombre, valor, dia_pago, frecuencia, mes_pago);
    return info.lastInsertRowid;
  },

  findAllByUser(usuario_id) {
    const stmt = db.prepare(`
      SELECT * FROM suscripciones
      WHERE usuario_id = ?
      ORDER BY dia_pago ASC, created_at ASC
    `);
    return stmt.all(usuario_id);
  },

  findById(id, usuario_id) {
    const stmt = db.prepare(`
      SELECT * FROM suscripciones
      WHERE id = ? AND usuario_id = ?
    `);
    return stmt.get(id, usuario_id);
  },

  update(id, usuario_id, { nombre, valor, dia_pago, frecuencia = 'mensual', mes_pago = null }) {
    const stmt = db.prepare(`
      UPDATE suscripciones
      SET nombre = ?, valor = ?, dia_pago = ?, frecuencia = ?, mes_pago = ?
      WHERE id = ? AND usuario_id = ?
    `);
    return stmt.run(nombre, valor, dia_pago, frecuencia, mes_pago, id, usuario_id);
  },

  delete(id, usuario_id) {
    const stmt = db.prepare(`
      DELETE FROM suscripciones
      WHERE id = ? AND usuario_id = ?
    `);
    return stmt.run(id, usuario_id);
  },

  // Obtener el total mensual (las anuales se prorratean entre 12 meses)
  getTotalMensual(usuario_id) {
    const stmt = db.prepare(`
      SELECT SUM(CASE WHEN frecuencia = 'anual' THEN valor / 12.0 ELSE valor END) as total
      FROM suscripciones
      WHERE usuario_id = ?
    `);
    const result = stmt.get(usuario_id);
    return result.total || 0;
  }
};
