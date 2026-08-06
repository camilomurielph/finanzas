const db = require('./db');

module.exports = {
  create(usuario_id, nombre, valor_total, cuota_minima, numero_cuotas, dia_pago) {
    const stmt = db.prepare(`
      INSERT INTO deudas (usuario_id, nombre, valor_total, cuota_minima, numero_cuotas, dia_pago)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(usuario_id, nombre, valor_total, cuota_minima, numero_cuotas, dia_pago);
    return info.lastInsertRowid;
  },

  // Obtener deudas activas (no archivadas)
  findActiveByUser(usuario_id) {
    const stmt = db.prepare(`
      SELECT * FROM deudas
      WHERE usuario_id = ? AND activa = 1 AND archivada = 0
      ORDER BY created_at ASC
    `);
    return stmt.all(usuario_id);
  },

  // Obtener deudas archivadas
  findArchivedByUser(usuario_id) {
    const stmt = db.prepare(`
      SELECT * FROM deudas
      WHERE usuario_id = ? AND archivada = 1
      ORDER BY created_at DESC
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

  // Restar monto del pagado_total (al eliminar un pago)
  restarPagadoTotal(id, usuario_id, monto) {
    const stmt = db.prepare(`
      UPDATE deudas
      SET pagado_total = pagado_total - ?
      WHERE id = ? AND usuario_id = ?
    `);
    return stmt.run(monto, id, usuario_id);
  },

  marcarPagada(id, usuario_id) {
    const stmt = db.prepare(`
      UPDATE deudas
      SET activa = 0, pagado_total = valor_total, cuota_actual = numero_cuotas
      WHERE id = ? AND usuario_id = ?
    `);
    return stmt.run(id, usuario_id);
  },

  // Archivar una deuda (para deudas pagadas)
  archivar(id, usuario_id) {
    const stmt = db.prepare(`
      UPDATE deudas
      SET archivada = 1, activa = 0
      WHERE id = ? AND usuario_id = ?
    `);
    return stmt.run(id, usuario_id);
  },

  // Desarchivar (restaurar) una deuda
  desarchivar(id, usuario_id) {
    const stmt = db.prepare(`
      UPDATE deudas
      SET archivada = 0, activa = 1
      WHERE id = ? AND usuario_id = ?
    `);
    return stmt.run(id, usuario_id);
  },

  delete(id, usuario_id) {
    const stmt = db.prepare('DELETE FROM deudas WHERE id = ? AND usuario_id = ?');
    return stmt.run(id, usuario_id);
  }
};
