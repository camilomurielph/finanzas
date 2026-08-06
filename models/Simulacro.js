const db = require('./db');

module.exports = {
  // Obtener el simulacro activo del usuario
  getActivo(usuario_id) {
    const stmt = db.prepare(`
      SELECT * FROM simulacros
      WHERE usuario_id = ? AND activo = 1
      ORDER BY fecha_creacion DESC
      LIMIT 1
    `);
    return stmt.get(usuario_id);
  },

  // Crear un nuevo simulacro (desactiva los anteriores)
  crear(usuario_id, salario_inicial) {
    // Desactivar simulacros anteriores
    const desactivar = db.prepare('UPDATE simulacros SET activo = 0 WHERE usuario_id = ?');
    desactivar.run(usuario_id);

    const stmt = db.prepare(`
      INSERT INTO simulacros (usuario_id, salario_inicial, saldo_disponible, ahorro)
      VALUES (?, ?, ?, 0)
    `);
    const info = stmt.run(usuario_id, salario_inicial, salario_inicial);
    return info.lastInsertRowid;
  },

  // Actualizar saldo disponible y ahorro
  actualizar(id, usuario_id, { saldo_disponible, ahorro }) {
    const stmt = db.prepare(`
      UPDATE simulacros
      SET saldo_disponible = ?, ahorro = ?
      WHERE id = ? AND usuario_id = ?
    `);
    return stmt.run(saldo_disponible, ahorro, id, usuario_id);
  },

  // Eliminar simulacro (y sus gastos por cascade)
  eliminar(id, usuario_id) {
    const stmt = db.prepare('DELETE FROM simulacros WHERE id = ? AND usuario_id = ?');
    return stmt.run(id, usuario_id);
  },

  // Reiniciar: desactivar el actual (sin eliminar)
  desactivar(usuario_id) {
    const stmt = db.prepare('UPDATE simulacros SET activo = 0 WHERE usuario_id = ?');
    return stmt.run(usuario_id);
  }
};
