const db = require('./db');

module.exports = {
  create(gasto_id, nombre, valor) {
    const stmt = db.prepare(`
      INSERT INTO cuotas (gasto_id, nombre, valor)
      VALUES (?, ?, ?)
    `);
    return stmt.run(gasto_id, nombre, valor);
  },

  findAllByGasto(gasto_id) {
    const stmt = db.prepare('SELECT * FROM cuotas WHERE gasto_id = ? ORDER BY created_at ASC');
    return stmt.all(gasto_id);
  },

  updatePago(id, pagado, fecha_pago) {
    const stmt = db.prepare(`
      UPDATE cuotas SET pagado = ?, fecha_pago = ? WHERE id = ?
    `);
    return stmt.run(pagado, fecha_pago, id);
  },

  deleteAllByGasto(gasto_id) {
    const stmt = db.prepare('DELETE FROM cuotas WHERE gasto_id = ?');
    return stmt.run(gasto_id);
  }
};