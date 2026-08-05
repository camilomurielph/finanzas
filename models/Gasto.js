const db = require('./db');

module.exports = {
  create(usuario_id, tipo_gasto_id, nombre, fecha, valor_total) {
    const stmt = db.prepare(`
      INSERT INTO gastos (usuario_id, tipo_gasto_id, nombre, fecha, valor_total)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(usuario_id, tipo_gasto_id, nombre, fecha, valor_total);
    return info.lastInsertRowid;
  },

  findAllByUser(usuario_id, tipo_gasto_id = null) {
    let sql = `
      SELECT g.*, t.nombre as tipo_nombre
      FROM gastos g
      JOIN tipos_gasto t ON g.tipo_gasto_id = t.id
      WHERE g.usuario_id = ? AND g.archivado = 0
    `;
    const params = [usuario_id];
    if (tipo_gasto_id) {
      sql += ` AND g.tipo_gasto_id = ?`;
      params.push(tipo_gasto_id);
    }
    sql += ` ORDER BY g.fecha ASC, g.created_at ASC`;
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },

  findById(id, usuario_id) {
    const stmt = db.prepare(`
      SELECT g.*, t.nombre as tipo_nombre
      FROM gastos g
      JOIN tipos_gasto t ON g.tipo_gasto_id = t.id
      WHERE g.id = ? AND g.usuario_id = ?
    `);
    return stmt.get(id, usuario_id);
  },

  update(id, usuario_id, { tipo_gasto_id, nombre, fecha, valor_total }) {
    const stmt = db.prepare(`
      UPDATE gastos
      SET tipo_gasto_id = ?, nombre = ?, fecha = ?, valor_total = ?
      WHERE id = ? AND usuario_id = ?
    `);
    return stmt.run(tipo_gasto_id, nombre, fecha, valor_total, id, usuario_id);
  },

  delete(id, usuario_id) {
    const stmt = db.prepare('DELETE FROM gastos WHERE id = ? AND usuario_id = ?');
    return stmt.run(id, usuario_id);
  },

  archive(id, usuario_id) {
    const stmt = db.prepare('UPDATE gastos SET archivado = 1 WHERE id = ? AND usuario_id = ?');
    return stmt.run(id, usuario_id);
  },

  // Nuevo: marcar/desmarcar pago de gasto
  togglePagado(id, usuario_id, pagado) {
    const stmt = db.prepare('UPDATE gastos SET pagado = ? WHERE id = ? AND usuario_id = ?');
    return stmt.run(pagado ? 1 : 0, id, usuario_id);
  },

  // Obtener archivados
  findArchivedByUser(usuario_id) {
    const stmt = db.prepare(`
      SELECT g.*, t.nombre as tipo_nombre
      FROM gastos g
      JOIN tipos_gasto t ON g.tipo_gasto_id = t.id
      WHERE g.usuario_id = ? AND g.archivado = 1
      ORDER BY g.fecha DESC, g.created_at DESC
    `);
    return stmt.all(usuario_id);
  }
};