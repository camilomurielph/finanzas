const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'finanzas.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    icono TEXT DEFAULT 'tag',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS gastos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    categoria_id INTEGER,
    descripcion TEXT NOT NULL,
    monto REAL NOT NULL,
    fecha TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS suscripciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    monto REAL NOT NULL,
    dia_cobro INTEGER NOT NULL CHECK(dia_cobro BETWEEN 1 AND 31),
    frecuencia TEXT DEFAULT 'mensual',
    mes_cobro INTEGER,
    activa INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bolsillos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    saldo REAL DEFAULT 0,
    meta REAL DEFAULT 0,
    color TEXT DEFAULT '#6366f1',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bolsillo_movimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bolsillo_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('deposito', 'retiro')),
    monto REAL NOT NULL,
    descripcion TEXT DEFAULT '',
    fecha TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (bolsillo_id) REFERENCES bolsillos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS deudas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    acreedor TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    monto_total REAL NOT NULL,
    monto_pagado REAL DEFAULT 0,
    pago_minimo REAL DEFAULT 0,
    cuotas_totales INTEGER DEFAULT 1,
    cuota_actual INTEGER DEFAULT 1,
    fecha_limite TEXT DEFAULT '',
    estado TEXT DEFAULT 'activa' CHECK(estado IN ('activa', 'pagada')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS deuda_abonos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deuda_id INTEGER NOT NULL,
    monto REAL NOT NULL,
    nota TEXT DEFAULT '',
    fecha TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (deuda_id) REFERENCES deudas(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS salario_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL UNIQUE,
    salario_mensual REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS salario_distribuciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    porcentaje REAL NOT NULL,
    color TEXT DEFAULT '#6366f1',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );
`);

// Migración segura para bases de datos existentes en suscripciones
const colsSuscripciones = db.prepare("PRAGMA table_info(suscripciones)").all();
if (!colsSuscripciones.some(col => col.name === 'frecuencia')) {
  db.exec("ALTER TABLE suscripciones ADD COLUMN frecuencia TEXT DEFAULT 'mensual'");
}
if (!colsSuscripciones.some(col => col.name === 'mes_cobro')) {
  db.exec("ALTER TABLE suscripciones ADD COLUMN mes_cobro INTEGER");
}

function seedDefaultCategories(usuarioId) {
  const count = db.prepare('SELECT COUNT(*) as c FROM categorias WHERE usuario_id = ?').get(usuarioId).c;
  if (count === 0) {
    const insert = db.prepare('INSERT INTO categorias (usuario_id, nombre, color, icono) VALUES (?, ?, ?, ?)');
    const defaults = [
      ['Comida', '#f59e0b', 'utensils'],
      ['Transporte', '#3b82f6', 'car'],
      ['Entretenimiento', '#ec4899', 'gamepad'],
      ['Servicios', '#10b981', 'zap'],
      ['Salud', '#ef4444', 'heart'],
      ['Otros', '#8b5cf6', 'tag']
    ];
    for (const [nombre, color, icono] of defaults) {
      insert.run(usuarioId, nombre, color, icono);
    }
  }
}

function seedDefaultSalario(usuarioId) {
  const existing = db.prepare('SELECT id FROM salario_config WHERE usuario_id = ?').get(usuarioId);
  if (!existing) {
    db.prepare('INSERT INTO salario_config (usuario_id, salario_mensual) VALUES (?, 0)').run(usuarioId);
    const insert = db.prepare('INSERT INTO salario_distribuciones (usuario_id, nombre, porcentaje, color) VALUES (?, ?, ?, ?)');
    const defaults = [
      ['Gastos Fijos / Necesidades', 50, '#6366f1'],
      ['Ahorro e Inversión', 30, '#10b981'],
      ['Entretenimiento / Personal', 20, '#f59e0b']
    ];
    for (const [nombre, porcentaje, color] of defaults) {
      insert.run(usuarioId, nombre, porcentaje, color);
    }
  }
}

module.exports = { db, seedDefaultCategories, seedDefaultSalario };
