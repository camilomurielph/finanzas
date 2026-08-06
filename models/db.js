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

  -- NUEVAS TABLAS PARA SALARIO
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
`);

// ================================================
// MIGRACIONES EXISTENTES
// ================================================

// Migración para gastos (columna pagado)
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

// Migración para movimientos (bolsillo_id permitir NULL)
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

module.exports = db;
