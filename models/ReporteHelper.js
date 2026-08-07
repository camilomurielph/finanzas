const db = require('./db');

class ReporteHelper {
  static getResumen(usuario_id) {
    const data = {};

    // ===== GASTOS AGRUPADOS POR TARJETA/CUENTA =====
    // Obtener todas las tarjetas/cuentas del usuario
    const tiposGasto = db.prepare(`
      SELECT * FROM tipos_gasto
      WHERE usuario_id = ?
      ORDER BY nombre ASC
    `).all(usuario_id);

    // Para cada tarjeta, obtener sus gastos
    const gastosPorTarjeta = [];
    tiposGasto.forEach(tipo => {
      const gastos = db.prepare(`
        SELECT * FROM gastos
        WHERE usuario_id = ? AND tipo_gasto_id = ? AND archivado = 0
        ORDER BY fecha DESC
        LIMIT 20
      `).all(usuario_id, tipo.id);
      
      if (gastos.length > 0) {
        gastosPorTarjeta.push({
          tarjeta: tipo.nombre,
          gastos: gastos
        });
      }
    });

    // Total de gastos (para el resumen)
    const totalGastos = db.prepare(`
      SELECT SUM(valor_total) as total
      FROM gastos
      WHERE usuario_id = ? AND archivado = 0
    `).get(usuario_id);

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

    // ===== PAGOS DE DEUDAS =====
    const pagosDeuda = db.prepare(`
      SELECT p.*, d.id as deuda_id
      FROM pagos_deuda p
      JOIN deudas d ON p.deuda_id = d.id
      WHERE d.usuario_id = ?
      ORDER BY p.fecha_pago DESC
    `).all(usuario_id);

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
      gastosPorTarjeta: gastosPorTarjeta,
      suscripciones: suscripciones,
      bolsillos: bolsillos,
      subBolsillos: subBolsillos,
      deudas: deudasActivas,
      pagos: pagosDeuda,
      salario: {
        simulacro: simulacroActivo,
        gastos: gastosSalario,
      },
    };

    return data;
  }
}

module.exports = ReporteHelper;
