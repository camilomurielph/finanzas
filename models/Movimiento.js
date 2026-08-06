const db = require('./db');

module.exports = {
  create(bolsillo_id, tipo, monto, descripcion = null) {
    const stmt = db.prepare(`
      INSERT INTO movimientos (bolsillo_id, tipo, monto, descripcion)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(bolsillo_id, tipo, monto, descripcion);
  },

  findAllByBolsillo(bolsillo_id) {
    const stmt = db.prepare(`
      SELECT * FROM movimientos
      WHERE bolsillo_id = ?
      ORDER BY fecha DESC
    `);
    return stmt.all(bolsillo_id);
  },

  deleteAllByBolsillo(bolsillo_id) {
    const stmt = db.prepare('DELETE FROM movimientos WHERE bolsillo_id = ?');
    return stmt.run(bolsillo_id);
  }
};
