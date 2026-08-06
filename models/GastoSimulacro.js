const db = require('./db');

module.exports = {
  // Crear un gasto en un simulacro
  create(simulacro_id, nombre, valor) {
    const stmt = db.prepare(`
      INSERT INTO gastos_simulacro (simulacro_id, nombre, valor)
      VALUES (?, ?, ?)
    `);
    return stmt.run(simulacro_id, nombre, valor);
  },

  // Obtener todos los gastos de un simulacro
  findAllBySimulacro(simulacro_id) {
    const stmt = db.prepare(`
      SELECT * FROM gastos_simulacro
      WHERE simulacro_id = ?
      ORDER BY fecha ASC
    `);
    return stmt.all(simulacro_id);
  },

  // Eliminar un gasto
  delete(id, simulacro_id) {
    const stmt = db.prepare(`
      DELETE FROM gastos_simulacro
      WHERE id = ? AND simulacro_id = ?
    `);
    return stmt.run(id, simulacro_id);
  },

  // Eliminar todos los gastos de un simulacro
  deleteAllBySimulacro(simulacro_id) {
    const stmt = db.prepare('DELETE FROM gastos_simulacro WHERE simulacro_id = ?');
    return stmt.run(simulacro_id);
  }
};
