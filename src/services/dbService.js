import { getTursoClient } from '../config/turso.js';
import { getUserId } from '../config/clerk.js';

const client = getTursoClient();

// Helper para obtener el user_id actual
function getUserIdOrThrow() {
  const id = getUserId();
  if (!id) throw new Error('Usuario no autenticado');
  return id;
}

// --- BOLSILLOS ---
export async function getPockets() {
  const userId = getUserIdOrThrow();
  const result = await client.execute({
    sql: 'SELECT * FROM pockets WHERE user_id = ? ORDER BY name',
    args: [userId]
  });
  return result.rows || [];
}

export async function createPocket(name) {
  const userId = getUserIdOrThrow();
  const result = await client.execute({
    sql: 'INSERT INTO pockets (user_id, name) VALUES (?, ?) RETURNING *',
    args: [userId, name]
  });
  return result.rows?.[0] || null;
}

export async function updatePocket(id, name) {
  const userId = getUserIdOrThrow();
  const result = await client.execute({
    sql: 'UPDATE pockets SET name = ? WHERE id = ? AND user_id = ? RETURNING *',
    args: [name, id, userId]
  });
  return result.rows?.[0] || null;
}

export async function deletePocket(id) {
  const userId = getUserIdOrThrow();
  await client.execute({
    sql: 'DELETE FROM pockets WHERE id = ? AND user_id = ?',
    args: [id, userId]
  });
}

// --- MOVIMIENTOS ---
export async function getMovements(pocketId, limit = 10) {
  const userId = getUserIdOrThrow();
  const result = await client.execute({
    sql: 'SELECT * FROM movements WHERE pocket_id = ? AND user_id = ? ORDER BY date DESC LIMIT ?',
    args: [pocketId, userId, limit]
  });
  return result.rows || [];
}

export async function createMovement(pocketId, amount, description = '') {
  const userId = getUserIdOrThrow();
  const result = await client.execute({
    sql: 'INSERT INTO movements (user_id, pocket_id, amount, description, date) VALUES (?, ?, ?, ?, datetime("now")) RETURNING *',
    args: [userId, pocketId, amount, description]
  });
  return result.rows?.[0] || null;
}

// --- GASTOS ---
export async function getExpenses(categoryId = null, archived = false) {
  const userId = getUserIdOrThrow();
  let sql = 'SELECT * FROM expenses WHERE user_id = ? AND is_archived = ?';
  const args = [userId, archived ? 1 : 0];
  if (categoryId !== null) {
    sql += ' AND category_id = ?';
    args.push(categoryId);
  }
  sql += ' ORDER BY date ASC';
  const result = await client.execute({ sql, args });
  return result.rows || [];
}

export async function createExpense(description, amount, categoryId, date = null) {
  const userId = getUserIdOrThrow();
  const dateStr = date || new Date().toISOString().split('T')[0];
  const result = await client.execute({
    sql: 'INSERT INTO expenses (user_id, description, amount, category_id, date, is_completed, is_archived) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *',
    args: [userId, description, amount, categoryId, dateStr, 0, 0]
  });
  return result.rows?.[0] || null;
}

export async function toggleExpenseCompleted(id) {
  const userId = getUserIdOrThrow();
  const result = await client.execute({
    sql: 'UPDATE expenses SET is_completed = NOT is_completed WHERE id = ? AND user_id = ? RETURNING *',
    args: [id, userId]
  });
  return result.rows?.[0] || null;
}

export async function archiveExpense(id) {
  const userId = getUserIdOrThrow();
  const result = await client.execute({
    sql: 'UPDATE expenses SET is_archived = 1 WHERE id = ? AND user_id = ? RETURNING *',
    args: [id, userId]
  });
  return result.rows?.[0] || null;
}

// --- SUBGASTOS ---
export async function getSubExpenses(expenseId) {
  const userId = getUserIdOrThrow();
  const result = await client.execute({
    sql: 'SELECT * FROM sub_expenses WHERE expense_id = ? AND user_id = ? ORDER BY id',
    args: [expenseId, userId]
  });
  return result.rows || [];
}

export async function createSubExpense(expenseId, description, amount, note = '') {
  const userId = getUserIdOrThrow();
  const result = await client.execute({
    sql: 'INSERT INTO sub_expenses (user_id, expense_id, description, amount, note, is_completed) VALUES (?, ?, ?, ?, ?, ?) RETURNING *',
    args: [userId, expenseId, description, amount, note, 0]
  });
  return result.rows?.[0] || null;
}

export async function toggleSubExpenseCompleted(id) {
  const userId = getUserIdOrThrow();
  const result = await client.execute({
    sql: 'UPDATE sub_expenses SET is_completed = NOT is_completed WHERE id = ? AND user_id = ? RETURNING *',
    args: [id, userId]
  });
  return result.rows?.[0] || null;
}

// --- CATEGORÍAS ---
export async function getCategories() {
  const userId = getUserIdOrThrow();
  const result = await client.execute({
    sql: 'SELECT * FROM categories WHERE user_id = ? ORDER BY name',
    args: [userId]
  });
  return result.rows || [];
}

export async function createCategory(name) {
  const userId = getUserIdOrThrow();
  const result = await client.execute({
    sql: 'INSERT INTO categories (user_id, name) VALUES (?, ?) RETURNING *',
    args: [userId, name]
  });
  return result.rows?.[0] || null;
}

// --- SUSCRIPCIONES ---
export async function getSubscriptions() {
  const userId = getUserIdOrThrow();
  const result = await client.execute({
    sql: 'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY name',
    args: [userId]
  });
  return result.rows || [];
}

export async function createSubscription(name, amount, frequency, chargeDate) {
  const userId = getUserIdOrThrow();
  const result = await client.execute({
    sql: 'INSERT INTO subscriptions (user_id, name, amount, frequency, charge_date) VALUES (?, ?, ?, ?, ?) RETURNING *',
    args: [userId, name, amount, frequency, chargeDate]
  });
  return result.rows?.[0] || null;
}

export async function deleteSubscription(id) {
  const userId = getUserIdOrThrow();
  await client.execute({
    sql: 'DELETE FROM subscriptions WHERE id = ? AND user_id = ?',
    args: [id, userId]
  });
}

// --- INVERSIONES ---
export async function getInvestments() {
  const userId = getUserIdOrThrow();
  const result = await client.execute({
    sql: 'SELECT * FROM investments WHERE user_id = ? ORDER BY name',
    args: [userId]
  });
  return result.rows || [];
}

export async function createInvestment(name, capital, currentValue = null) {
  const userId = getUserIdOrThrow();
  const val = currentValue !== null ? currentValue : capital;
  const result = await client.execute({
    sql: 'INSERT INTO investments (user_id, name, capital, current_value) VALUES (?, ?, ?, ?) RETURNING *',
    args: [userId, name, capital, val]
  });
  return result.rows?.[0] || null;
}

export async function updateInvestmentValue(id, newValue) {
  const userId = getUserIdOrThrow();
  const result = await client.execute({
    sql: 'UPDATE investments SET current_value = ? WHERE id = ? AND user_id = ? RETURNING *',
    args: [newValue, id, userId]
  });
  return result.rows?.[0] || null;
}

export async function addInvestmentCapital(id, additionalCapital) {
  const userId = getUserIdOrThrow();
  const current = await client.execute({
    sql: 'SELECT capital, current_value FROM investments WHERE id = ? AND user_id = ?',
    args: [id, userId]
  });
  if (!current.rows || current.rows.length === 0) throw new Error('Inversión no encontrada');
  const { capital, current_value } = current.rows[0];
  const newCapital = capital + additionalCapital;
  const newCurrent = current_value + additionalCapital;
  const result = await client.execute({
    sql: 'UPDATE investments SET capital = ?, current_value = ? WHERE id = ? AND user_id = ? RETURNING *',
    args: [newCapital, newCurrent, id, userId]
  });
  return result.rows?.[0] || null;
}

// --- DEUDAS ---
export async function getDebts() {
  const userId = getUserIdOrThrow();
  const result = await client.execute({
    sql: 'SELECT * FROM debts WHERE user_id = ? ORDER BY name',
    args: [userId]
  });
  return result.rows || [];
}

export async function createDebt(name, totalAmount, currentBalance = null) {
  const userId = getUserIdOrThrow();
  const bal = currentBalance !== null ? currentBalance : totalAmount;
  const result = await client.execute({
    sql: 'INSERT INTO debts (user_id, name, total_amount, current_balance) VALUES (?, ?, ?, ?) RETURNING *',
    args: [userId, name, totalAmount, bal]
  });
  return result.rows?.[0] || null;
}

export async function payDebt(id, amount) {
  const userId = getUserIdOrThrow();
  const result = await client.execute({
    sql: 'UPDATE debts SET current_balance = current_balance - ? WHERE id = ? AND user_id = ? RETURNING *',
    args: [amount, id, userId]
  });
  return result.rows?.[0] || null;
}

export async function deleteDebt(id) {
  const userId = getUserIdOrThrow();
  await client.execute({
    sql: 'DELETE FROM debts WHERE id = ? AND user_id = ?',
    args: [id, userId]
  });
}

// --- FUNCIÓN DE CARGA INICIAL (crear tablas si no existen) ---
export async function loadUserData(userId) {
  console.log('📦 Cargando datos para usuario:', userId);
  
  // Intentar una consulta simple para verificar conexión
  try {
    const test = await client.execute('SELECT 1');
    console.log('✅ Conexión a Turso verificada:', test);
  } catch (err) {
    console.error('❌ No se pudo conectar a Turso:', err);
    throw err;
  }

  // Crear tablas si no existen (idempotente)
  const queries = [
    `CREATE TABLE IF NOT EXISTS pockets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      pocket_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      date TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS sub_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      expense_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      is_completed INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL,
      charge_date TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS investments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      capital REAL NOT NULL,
      current_value REAL NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS debts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      total_amount REAL NOT NULL,
      current_balance REAL NOT NULL
    )`
  ];

  for (const sql of queries) {
    try {
      const result = await client.execute({ sql });
      // Extraer nombre de tabla del SQL para el log
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || 'tabla';
      console.log(`✅ Tabla creada/verificada: ${tableName}`);
    } catch (error) {
      console.error(`❌ Error creando tabla: ${sql}`, error);
    }
  }

  // Crear categorías por defecto si no existen
  try {
    const existing = await client.execute({
      sql: 'SELECT name FROM categories WHERE user_id = ?',
      args: [userId]
    });
    const existingNames = (existing.rows || []).map(r => r.name);
    const defaultCategories = ['Tarjeta 1', 'Débito', 'Efectivo'];
    for (const cat of defaultCategories) {
      if (!existingNames.includes(cat)) {
        await client.execute({
          sql: 'INSERT INTO categories (user_id, name) VALUES (?, ?)',
          args: [userId, cat]
        });
        console.log(`✅ Categoría creada: ${cat}`);
      }
    }
  } catch (error) {
    console.error('❌ Error creando categorías por defecto:', error);
  }

  console.log('✅ Datos cargados correctamente');
}
