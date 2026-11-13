const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../database/finanzas.db'));
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tipos_gasto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS gastos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    tipo_gasto_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    fecha DATE NOT NULL,
    valor_total REAL NOT NULL,
    pagado BOOLEAN DEFAULT 0,
    archivado BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_gasto_id) REFERENCES tipos_gasto(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS cuotas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gasto_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    valor REAL NOT NULL,
    pagado BOOLEAN DEFAULT 0,
    fecha_pago DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gasto_id) REFERENCES gastos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS suscripciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    valor REAL NOT NULL,
    dia_pago INTEGER NOT NULL CHECK (dia_pago >= 1 AND dia_pago <= 31),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bolsillos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    saldo REAL NOT NULL DEFAULT 0,
    orden INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sub_bolsillos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bolsillo_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    saldo REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bolsillo_id) REFERENCES bolsillos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS movimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bolsillo_id INTEGER,
    sub_bolsillo_id INTEGER,
    tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    monto REAL NOT NULL,
    descripcion TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bolsillo_id) REFERENCES bolsillos(id) ON DELETE CASCADE,
    FOREIGN KEY (sub_bolsillo_id) REFERENCES sub_bolsillos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS simulacros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    salario_inicial REAL NOT NULL,
    saldo_disponible REAL NOT NULL,
    ahorro REAL NOT NULL DEFAULT 0,
    activo BOOLEAN DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS gastos_simulacro (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulacro_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    valor REAL NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (simulacro_id) REFERENCES simulacros(id) ON DELETE CASCADE
  );

  -- TABLAS DE DEUDAS (ACTUALIZADAS)
  CREATE TABLE IF NOT EXISTS deudas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    valor_total REAL NOT NULL,
    pagado_total REAL NOT NULL DEFAULT 0,
    cuota_minima REAL NOT NULL,
    numero_cuotas INTEGER NOT NULL CHECK (numero_cuotas >= 1),
    cuota_actual INTEGER NOT NULL DEFAULT 1,
    dia_pago INTEGER NOT NULL CHECK (dia_pago >= 1 AND dia_pago <= 31),
    activa BOOLEAN DEFAULT 1,
    archivada BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS pagos_deuda (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deuda_id INTEGER NOT NULL,
    monto REAL NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('minimo', 'abono', 'total')),
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deuda_id) REFERENCES deudas(id) ON DELETE CASCADE
  );
`);

// ================================================
// MIGRACIONES
// ================================================

// 1. Migración para gastos (columna pagado)
try {
  const columnInfo = db.prepare("PRAGMA table_info(gastos)").all();
  const hasPagado = columnInfo.some(col => col.name === 'pagado');
  if (!hasPagado) {
    db.exec('ALTER TABLE gastos ADD COLUMN pagado BOOLEAN DEFAULT 0;');
    console.log('Migración: columna pagado agregada a gastos');
  }
} catch (err) {
  console.error('Error en migración de gastos:', err.message);
}

// 2. Migración para movimientos (bolsillo_id permitir NULL)
try {
  const tableInfo = db.prepare("PRAGMA table_info(movimientos)").all();
  const bolsilloCol = tableInfo.find(col => col.name === 'bolsillo_id');
  
  if (bolsilloCol && bolsilloCol.notnull === 1) {
    const hasSubCol = tableInfo.some(col => col.name === 'sub_bolsillo_id');
    
    if (!hasSubCol) {
      db.exec('ALTER TABLE movimientos ADD COLUMN sub_bolsillo_id INTEGER;');
    }
    
    db.exec(`
      CREATE TABLE movimientos_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bolsillo_id INTEGER,
        sub_bolsillo_id INTEGER,
        tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
        monto REAL NOT NULL,
        descripcion TEXT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bolsillo_id) REFERENCES bolsillos(id) ON DELETE CASCADE,
        FOREIGN KEY (sub_bolsillo_id) REFERENCES sub_bolsillos(id) ON DELETE CASCADE
      );

      INSERT INTO movimientos_temp (id, bolsillo_id, sub_bolsillo_id, tipo, monto, descripcion, fecha)
      SELECT id, bolsillo_id, NULL, tipo, monto, descripcion, fecha FROM movimientos;

      DROP TABLE movimientos;
      ALTER TABLE movimientos_temp RENAME TO movimientos;

      CREATE INDEX idx_movimientos_bolsillo ON movimientos(bolsillo_id);
      CREATE INDEX idx_movimientos_sub ON movimientos(sub_bolsillo_id);
    `);
    console.log('Migración: movimientos.bolsillo_id ahora permite NULL');
  }
} catch (err) {
  console.error('Error en migración de movimientos:', err.message);
}

// 3. Migración para deudas: convertir fecha_pago a dia_pago
try {
  const deudaInfo = db.prepare("PRAGMA table_info(deudas)").all();
  const hasFechaPago = deudaInfo.some(col => col.name === 'fecha_pago');
  const hasDiaPago = deudaInfo.some(col => col.name === 'dia_pago');
  
  // Si existe fecha_pago pero no dia_pago, migrar
  if (hasFechaPago && !hasDiaPago) {
    // Agregar columna dia_pago
    db.exec('ALTER TABLE deudas ADD COLUMN dia_pago INTEGER CHECK (dia_pago >= 1 AND dia_pago <= 31);');
    
    // Extraer el día de fecha_pago (formato YYYY-MM-DD)
    const deudas = db.prepare('SELECT id, fecha_pago FROM deudas WHERE fecha_pago IS NOT NULL').all();
    const updateStmt = db.prepare('UPDATE deudas SET dia_pago = ? WHERE id = ?');
    deudas.forEach(d => {
      if (d.fecha_pago) {
        const day = new Date(d.fecha_pago).getDate();
        updateStmt.run(day, d.id);
      }
    });
    
    // Eliminar columna fecha_pago
    // SQLite no permite DROP COLUMN directamente, así que recreamos la tabla
    db.exec(`
      CREATE TABLE deudas_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        valor_total REAL NOT NULL,
        pagado_total REAL NOT NULL DEFAULT 0,
        cuota_minima REAL NOT NULL,
        numero_cuotas INTEGER NOT NULL CHECK (numero_cuotas >= 1),
        cuota_actual INTEGER NOT NULL DEFAULT 1,
        dia_pago INTEGER NOT NULL CHECK (dia_pago >= 1 AND dia_pago <= 31),
        activa BOOLEAN DEFAULT 1,
        archivada BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      );

      INSERT INTO deudas_temp (id, usuario_id, nombre, valor_total, pagado_total, cuota_minima, numero_cuotas, cuota_actual, dia_pago, activa, archivada, created_at)
      SELECT id, usuario_id, nombre, valor_total, pagado_total, cuota_minima, numero_cuotas, cuota_actual, dia_pago, activa, 0, created_at FROM deudas;

      DROP TABLE deudas;
      ALTER TABLE deudas_temp RENAME TO deudas;
    `);
    console.log('Migración: deudas actualizada con dia_pago y archivada');
  }
  
  // Si no existe archivada, agregarla
  if (!deudaInfo.some(col => col.name === 'archivada')) {
    db.exec('ALTER TABLE deudas ADD COLUMN archivada BOOLEAN DEFAULT 0;');
    console.log('Migración: columna archivada agregada a deudas');
  }
} catch (err) {
  console.error('Error en migración de deudas:', err.message);
}

module.exports = db;
