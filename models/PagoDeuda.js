const db = require('./db');

module.exports = {
  create(deuda_id, monto, tipo) {
    const stmt = db.prepare(`
      INSERT INTO pagos_deuda (deuda_id, monto, tipo)
      VALUES (?, ?, ?)
    `);
    return stmt.run(deuda_id, monto, tipo);
  },

  findAllByDeuda(deuda_id) {
    const stmt = db.prepare(`
      SELECT * FROM pagos_deuda
      WHERE deuda_id = ?
      ORDER BY fecha_pago DESC
    `);
    return stmt.all(deuda_id);
  },

  delete(id, deuda_id) {
    const stmt = db.prepare(`
      DELETE FROM pagos_deuda
      WHERE id = ? AND deuda_id = ?
    `);
    return stmt.run(id, deuda_id);
  }
};
