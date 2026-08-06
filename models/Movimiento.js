const db = require('./db');

module.exports = {
  // Crear movimiento (para bolsillo o sub-bolsillo)
  create(bolsillo_id, sub_bolsillo_id, tipo, monto, descripcion = null) {
    // Validar que al menos uno de los IDs tenga valor
    if (!bolsillo_id && !sub_bolsillo_id) {
      throw new Error('Debe proporcionar bolsillo_id o sub_bolsillo_id');
    }

    const stmt = db.prepare(`
      INSERT INTO movimientos (bolsillo_id, sub_bolsillo_id, tipo, monto, descripcion)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(bolsillo_id || null, sub_bolsillo_id || null, tipo, monto, descripcion);
  },

  // Obtener movimientos de un bolsillo (incluye los de sus sub-bolsillos)
  findAllByBolsillo(bolsillo_id) {
    const stmt = db.prepare(`
      SELECT 
        m.*,
        sb.nombre as sub_bolsillo_nombre
      FROM movimientos m
      LEFT JOIN sub_bolsillos sb ON m.sub_bolsillo_id = sb.id
      WHERE m.bolsillo_id = ? OR m.sub_bolsillo_id IN (
        SELECT id FROM sub_bolsillos WHERE bolsillo_id = ?
      )
      ORDER BY m.fecha DESC
    `);
    return stmt.all(bolsillo_id, bolsillo_id);
  },

  // Obtener movimientos de un sub-bolsillo específico
  findAllBySubBolsillo(sub_bolsillo_id) {
    const stmt = db.prepare(`
      SELECT * FROM movimientos
      WHERE sub_bolsillo_id = ?
      ORDER BY fecha DESC
    `);
    return stmt.all(sub_bolsillo_id);
  },

  deleteAllByBolsillo(bolsillo_id) {
    const stmt = db.prepare(`
      DELETE FROM movimientos 
      WHERE bolsillo_id = ? OR sub_bolsillo_id IN (
        SELECT id FROM sub_bolsillos WHERE bolsillo_id = ?
      )
    `);
    return stmt.run(bolsillo_id, bolsillo_id);
  },

  deleteAllBySubBolsillo(sub_bolsillo_id) {
    const stmt = db.prepare('DELETE FROM movimientos WHERE sub_bolsillo_id = ?');
    return stmt.run(sub_bolsillo_id);
  }
};
