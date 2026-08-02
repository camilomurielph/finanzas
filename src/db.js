import { createClient } from '@libsql/client'

// Configuración de Turso (proporcionada por el usuario)
const TURSO_URL = 'libsql://finanzas-camilomurielph.aws-us-west-2.turso.io'
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU1NTM5MjQsImlkIjoiMDE5ZmJiNGQtODkwMS03ZWI1LTljYTYtNzkxZGVhNDFmZmQzIiwia2lkIjoicG11UzJqeERaZTZEa0lZUk10bl9ZNUhxa0pRLVJFZEFHbmhkSDhOT2QydyIsInJpZCI6ImQ2MGYwYzI3LTFlZjYtNDEyOC04MjgwLTJmMDg4NmNmYmE1NCJ9.gwWta4HwT9P7k-RbHi14-gmVR04A3o-kJ6t_3cvrvzRke37s5RB6GD7OlY_KNwpdIcl9gVRP_oh7YKanWlqOAg'

// Cliente singleton
export const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN,
})

// Función para inicializar la base de datos (crear tablas si no existen)
export async function initDatabase() {
  const queries = [
    // Bolsillos
    `CREATE TABLE IF NOT EXISTS bolsillos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      monto_actual REAL NOT NULL DEFAULT 0,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS movimientos_bolsillo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bolsillo_id INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('ingreso', 'egreso')),
      monto REAL NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bolsillo_id) REFERENCES bolsillos(id) ON DELETE CASCADE
    )`,
    // Categorías de gasto (3 por defecto)
    `CREATE TABLE IF NOT EXISTS categorias_gasto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE
    )`,
    // Gastos
    `CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria_id INTEGER NOT NULL,
      fecha DATE NOT NULL,
      descripcion TEXT NOT NULL,
      valor REAL NOT NULL,
      pagado BOOLEAN DEFAULT 0,
      archivado BOOLEAN DEFAULT 0,
      FOREIGN KEY (categoria_id) REFERENCES categorias_gasto(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS subgastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gasto_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      valor REAL NOT NULL,
      completado BOOLEAN DEFAULT 0,
      anotacion TEXT,
      FOREIGN KEY (gasto_id) REFERENCES gastos(id) ON DELETE CASCADE
    )`,
    // Suscripciones
    `CREATE TABLE IF NOT EXISTS suscripciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion TEXT NOT NULL,
      valor REAL NOT NULL,
      periodicidad TEXT NOT NULL CHECK(periodicidad IN ('semanal','mensual','trimestral','semestral','anual')),
      fecha_cobro DATE NOT NULL,
      archivada BOOLEAN DEFAULT 0,
      anotacion TEXT
    )`,
    // Inversiones
    `CREATE TABLE IF NOT EXISTS inversiones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      tipo TEXT NOT NULL, -- 'acciones','fondos','cripto','inmuebles','otros'
      fecha_inicio DATE NOT NULL,
      monto_invertido REAL NOT NULL,
      valor_actual REAL NOT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS movimientos_inversion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inversion_id INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('aporte', 'retiro')),
      monto REAL NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inversion_id) REFERENCES inversiones(id) ON DELETE CASCADE
    )`,
    // Deudas
    `CREATE TABLE IF NOT EXISTS deudas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      monto_total REAL NOT NULL,
      monto_restante REAL NOT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS abonos_deuda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deuda_id INTEGER NOT NULL,
      monto REAL NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deuda_id) REFERENCES deudas(id) ON DELETE CASCADE
    )`,
    // Sueldos
    `CREATE TABLE IF NOT EXISTS sueldos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mes INTEGER NOT NULL,
      anio INTEGER NOT NULL,
      valor REAL NOT NULL,
      disponible REAL NOT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS gastos_sueldo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sueldo_id INTEGER NOT NULL,
      descripcion TEXT NOT NULL,
      monto REAL NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sueldo_id) REFERENCES sueldos(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS ahorros_sueldo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sueldo_id INTEGER NOT NULL,
      monto REAL NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sueldo_id) REFERENCES sueldos(id) ON DELETE CASCADE
    )`,
  ]

  for (const sql of queries) {
    await client.execute(sql)
  }

  // Insertar categorías de gasto por defecto si no existen
  const categoriasDefault = ['Tarjeta 1', 'Tarjeta 2', 'Débito']
  for (const nombre of categoriasDefault) {
    await client.execute({
      sql: 'INSERT OR IGNORE INTO categorias_gasto (nombre) VALUES (?)',
      args: [nombre]
    })
  }

  console.log('✅ Base de datos inicializada correctamente')
}
