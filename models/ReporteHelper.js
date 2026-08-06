const db = require('./db');

class ReporteHelper {
  static getResumen(usuario_id) {
    const data = {};

    // ===== GASTOS =====
    const gastosActivos = db.prepare(`
      SELECT g.*, t.nombre as tipo_nombre
      FROM gastos g
      JOIN tipos_gasto t ON g.tipo_gasto_id = t.id
      WHERE g.usuario_id = ? AND g.archivado = 0
      ORDER BY g.fecha DESC
      LIMIT 10
    `).all(usuario_id);
    
    const totalGastos = db.prepare(`
      SELECT SUM(valor_total) as total
      FROM gastos
      WHERE usuario_id = ? AND archivado = 0
    `).get(usuario_id);
    
    const gastosPorCategoria = db.prepare(`
      SELECT t.nombre, SUM(g.valor_total) as total
      FROM gastos g
      JOIN tipos_gasto t ON g.tipo_gasto_id = t.id
      WHERE g.usuario_id = ? AND g.archivado = 0
      GROUP BY t.nombre
    `).all(usuario_id);

    // ===== SUSCRIPCIONES =====
    const suscripciones = db.prepare(`
      SELECT * FROM suscripciones
      WHERE usuario_id = ?
    `).all(usuario_id);
    
    const totalSuscripciones = db.prepare(`
      SELECT SUM(valor) as total
      FROM suscripciones
      WHERE usuario_id = ?
    `).get(usuario_id);

    // ===== BOLSILLOS =====
    const bolsillos = db.prepare(`
      SELECT * FROM bolsillos
      WHERE usuario_id = ?
      ORDER BY orden ASC
    `).all(usuario_id);
    
    const totalBolsillos = db.prepare(`
      SELECT SUM(saldo) as total
      FROM bolsillos
      WHERE usuario_id = ?
    `).get(usuario_id);

    // Sub-bolsillos
    const subBolsillos = db.prepare(`
      SELECT sb.*, b.nombre as bolsillo_nombre
      FROM sub_bolsillos sb
      JOIN bolsillos b ON sb.bolsillo_id = b.id
      WHERE b.usuario_id = ?
    `).all(usuario_id);

    // ===== DEUDAS =====
    const deudasActivas = db.prepare(`
      SELECT * FROM deudas
      WHERE usuario_id = ? AND activa = 1 AND archivada = 0
    `).all(usuario_id);
    
    const totalDeudas = db.prepare(`
      SELECT SUM(valor_total - pagado_total) as total
      FROM deudas
      WHERE usuario_id = ? AND activa = 1 AND archivada = 0
    `).get(usuario_id);

    // ===== SALARIO =====
    const simulacroActivo = db.prepare(`
      SELECT * FROM simulacros
      WHERE usuario_id = ? AND activo = 1
      ORDER BY fecha_creacion DESC
      LIMIT 1
    `).get(usuario_id);
    
    let gastosSalario = [];
    if (simulacroActivo) {
      gastosSalario = db.prepare(`
        SELECT * FROM gastos_simulacro
        WHERE simulacro_id = ?
      `).all(simulacroActivo.id);
    }

    // ===== RESUMEN =====
    data.resumen = {
      totalGastos: totalGastos?.total || 0,
      totalSuscripciones: totalSuscripciones?.total || 0,
      totalBolsillos: totalBolsillos?.total || 0,
      totalDeudas: totalDeudas?.total || 0,
      salarioDisponible: simulacroActivo ? simulacroActivo.saldo_disponible : 0,
      salarioAhorro: simulacroActivo ? simulacroActivo.ahorro : 0,
    };

    // ===== DETALLES =====
    data.detalles = {
      gastos: {
        recientes: gastosActivos,
        porCategoria: gastosPorCategoria,
      },
      suscripciones: suscripciones,
      bolsillos: bolsillos,
      subBolsillos: subBolsillos,
      deudas: deudasActivas,
      salario: {
        simulacro: simulacroActivo,
        gastos: gastosSalario,
      },
    };

    return data;
  }
}

module.exports = ReporteHelper;
