const db = require('./db');

module.exports = {
  create(usuario_id, nombre, valor_total, cuota_minima, numero_cuotas, fecha_pago) {
    const stmt = db.prepare(`
      INSERT INTO deudas (usuario_id, nombre, valor_total, cuota_minima, numero_cuotas, fecha_pago)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(usuario_id, nombre, valor_total, cuota_minima, numero_cuotas, fecha_pago);
    return info.lastInsertRowid;
  },

  findAllByUser(usuario_id) {
    const stmt = db.prepare(`
      SELECT * FROM deudas
      WHERE usuario_id = ? AND activa = 1
      ORDER BY created_at ASC
    `);
    return stmt.all(usuario_id);
  },

  findById(id, usuario_id) {
    const stmt = db.prepare(`
      SELECT * FROM deudas
      WHERE id = ? AND usuario_id = ?
    `);
    return stmt.get(id, usuario_id);
  },

  updatePagadoTotal(id, usuario_id, monto) {
    const stmt = db.prepare(`
      UPDATE deudas
      SET pagado_total = pagado_total + ?
      WHERE id = ? AND usuario_id = ?
    `);
    return stmt.run(monto, id, usuario_id);
  },

  updateCuotaActual(id, usuario_id, nuevaCuota) {
    const stmt = db.prepare(`
      UPDATE deudas
      SET cuota_actual = ?
      WHERE id = ? AND usuario_id = ?
    `);
    return stmt.run(nuevaCuota, id, usuario_id);
  },

  marcarPagada(id, usuario_id) {
    const stmt = db.prepare(`
      UPDATE deudas
      SET activa = 0, pagado_total = valor_total
      WHERE id = ? AND usuario_id = ?
    `);
    return stmt.run(id, usuario_id);
  },

  delete(id, usuario_id) {
    const stmt = db.prepare('DELETE FROM deudas WHERE id = ? AND usuario_id = ?');
    return stmt.run(id, usuario_id);
  }
};
