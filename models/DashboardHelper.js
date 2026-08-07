const db = require('./db');

class DashboardHelper {
  static getResumen(usuario_id) {
    // ===== GASTOS =====
    const totalGastos = db.prepare(`
      SELECT SUM(valor_total) as total
      FROM gastos
      WHERE usuario_id = ? AND archivado = 0
    `).get(usuario_id);

    // Gastos por categoría (para el gráfico)
    const gastosPorCategoria = db.prepare(`
      SELECT t.nombre as categoria, SUM(g.valor_total) as total
      FROM gastos g
      JOIN tipos_gasto t ON g.tipo_gasto_id = t.id
      WHERE g.usuario_id = ? AND g.archivado = 0
      GROUP BY t.nombre
      ORDER BY total DESC
      LIMIT 6
    `).all(usuario_id);

    // Últimos 5 gastos
    const ultimosGastos = db.prepare(`
      SELECT g.*, t.nombre as categoria
      FROM gastos g
      JOIN tipos_gasto t ON g.tipo_gasto_id = t.id
      WHERE g.usuario_id = ? AND g.archivado = 0
      ORDER BY g.fecha DESC
      LIMIT 5
    `).all(usuario_id);

    // ===== SUSCRIPCIONES =====
    const totalSuscripciones = db.prepare(`
      SELECT SUM(valor) as total
      FROM suscripciones
      WHERE usuario_id = ?
    `).get(usuario_id);

    const suscripciones = db.prepare(`
      SELECT * FROM suscripciones
      WHERE usuario_id = ?
      ORDER BY valor DESC
    `).all(usuario_id);

    // ===== BOLSILLOS =====
    const totalBolsillos = db.prepare(`
      SELECT SUM(saldo) as total
      FROM bolsillos
      WHERE usuario_id = ?
    `).get(usuario_id);

    const bolsillos = db.prepare(`
      SELECT * FROM bolsillos
      WHERE usuario_id = ?
      ORDER BY saldo DESC
    `).all(usuario_id);

    // ===== DEUDAS =====
    const totalDeudas = db.prepare(`
      SELECT SUM(valor_total - pagado_total) as total
      FROM deudas
      WHERE usuario_id = ? AND activa = 1 AND archivada = 0
    `).get(usuario_id);

    const deudasActivas = db.prepare(`
      SELECT * FROM deudas
      WHERE usuario_id = ? AND activa = 1 AND archivada = 0
      ORDER BY (valor_total - pagado_total) DESC
      LIMIT 5
    `).all(usuario_id);

    // ===== SALARIO (si hay simulacro activo) =====
    const simulacro = db.prepare(`
      SELECT * FROM simulacros
      WHERE usuario_id = ? AND activo = 1
      ORDER BY fecha_creacion DESC
      LIMIT 1
    `).get(usuario_id);

    // ===== CONTADORES =====
    const countGastos = db.prepare(`
      SELECT COUNT(*) as total FROM gastos WHERE usuario_id = ? AND archivado = 0
    `).get(usuario_id);

    const countDeudas = db.prepare(`
      SELECT COUNT(*) as total FROM deudas WHERE usuario_id = ? AND activa = 1 AND archivada = 0
    `).get(usuario_id);

    const countSuscripciones = db.prepare(`
      SELECT COUNT(*) as total FROM suscripciones WHERE usuario_id = ?
    `).get(usuario_id);

    return {
      totalGastos: totalGastos?.total || 0,
      totalSuscripciones: totalSuscripciones?.total || 0,
      totalBolsillos: totalBolsillos?.total || 0,
      totalDeudas: totalDeudas?.total || 0,
      gastosPorCategoria: gastosPorCategoria || [],
      ultimosGastos: ultimosGastos || [],
      suscripciones: suscripciones || [],
      bolsillos: bolsillos || [],
      deudasActivas: deudasActivas || [],
      simulacro: simulacro || null,
      countGastos: countGastos?.total || 0,
      countDeudas: countDeudas?.total || 0,
      countSuscripciones: countSuscripciones?.total || 0,
    };
  }
}

module.exports = DashboardHelper;
