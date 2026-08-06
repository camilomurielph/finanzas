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

  -- NUEVAS TABLAS: BOLSILLOS Y MOVIMIENTOS
  CREATE TABLE IF NOT EXISTS bolsillos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    saldo REAL NOT NULL DEFAULT 0,
    orden INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS movimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bolsillo_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    monto REAL NOT NULL,
    descripcion TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bolsillo_id) REFERENCES bolsillos(id) ON DELETE CASCADE
  );
`);

// Migración para gastos (ya existente)
try {
  const columnInfo = db.prepare("PRAGMA table_info(gastos)").all();
  const hasPagado = columnInfo.some(col => col.name === 'pagado');
  if (!hasPagado) {
    db.exec('ALTER TABLE gastos ADD COLUMN pagado BOOLEAN DEFAULT 0;');
    console.log('Migración: columna pagado agregada a gastos');
  }
} catch (err) {
  console.error('Error en migración:', err.message);
}

module.exports = db;
