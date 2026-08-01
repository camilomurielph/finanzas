import { DB, COLLECTIONS } from '../config/localStorage.js';

// Inicializar la base de datos (crear categorías por defecto)
export function initDB() {
  const cats = DB.get(COLLECTIONS.categories);
  if (cats.length === 0) {
    const defaultCategories = [
      { name: 'Tarjeta 1' },
      { name: 'Débito' },
      { name: 'Efectivo' }
    ];
    defaultCategories.forEach(cat => DB.insert(COLLECTIONS.categories, cat));
    console.log('✅ Categorías por defecto creadas');
  }
}

// --- BOLSILLOS ---
export function getPockets() {
  return DB.get(COLLECTIONS.pockets);
}

export function createPocket(name) {
  return DB.insert(COLLECTIONS.pockets, { name });
}

export function updatePocket(id, name) {
  return DB.update(COLLECTIONS.pockets, id, { name });
}

export function deletePocket(id) {
  DB.delete(COLLECTIONS.pockets, id);
}

// --- MOVIMIENTOS ---
export function getMovements(pocketId) {
  return DB.find(COLLECTIONS.movements, m => m.pocketId === pocketId);
}

export function createMovement(pocketId, amount, description = '') {
  return DB.insert(COLLECTIONS.movements, {
    pocketId,
    amount,
    description: description || (amount > 0 ? 'Añadido' : 'Retirado'),
    date: new Date().toISOString().split('T')[0]
  });
}

// --- GASTOS ---
export function getExpenses(categoryId = null, archived = false) {
  let items = DB.get(COLLECTIONS.expenses);
  items = items.filter(e => e.archived === archived);
  if (categoryId !== null) {
    items = items.filter(e => e.categoryId === categoryId);
  }
  return items.sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function createExpense(description, amount, categoryId, date = null) {
  return DB.insert(COLLECTIONS.expenses, {
    description,
    amount,
    categoryId,
    date: date || new Date().toISOString().split('T')[0],
    completed: false,
    archived: false
  });
}

export function toggleExpenseCompleted(id) {
  const exp = DB.findOne(COLLECTIONS.expenses, e => e.id === id);
  if (exp) {
    return DB.update(COLLECTIONS.expenses, id, { completed: !exp.completed });
  }
  return null;
}

export function archiveExpense(id) {
  return DB.update(COLLECTIONS.expenses, id, { archived: true });
}

// --- SUBGASTOS ---
export function getSubExpenses(expenseId) {
  return DB.find(COLLECTIONS.subExpenses, s => s.expenseId === expenseId);
}

export function createSubExpense(expenseId, description, amount, note = '') {
  return DB.insert(COLLECTIONS.subExpenses, {
    expenseId,
    description,
    amount,
    note,
    completed: false
  });
}

export function toggleSubExpenseCompleted(id) {
  const sub = DB.findOne(COLLECTIONS.subExpenses, s => s.id === id);
  if (sub) {
    return DB.update(COLLECTIONS.subExpenses, id, { completed: !sub.completed });
  }
  return null;
}

// --- CATEGORÍAS ---
export function getCategories() {
  return DB.get(COLLECTIONS.categories);
}

export function createCategory(name) {
  return DB.insert(COLLECTIONS.categories, { name });
}

// --- SUSCRIPCIONES ---
export function getSubscriptions() {
  return DB.get(COLLECTIONS.subscriptions);
}

export function createSubscription(name, amount, frequency, chargeDate) {
  return DB.insert(COLLECTIONS.subscriptions, {
    name,
    amount,
    frequency,
    chargeDate
  });
}

export function deleteSubscription(id) {
  DB.delete(COLLECTIONS.subscriptions, id);
}

// --- INVERSIONES ---
export function getInvestments() {
  return DB.get(COLLECTIONS.investments);
}

export function createInvestment(name, capital, currentValue = null) {
  return DB.insert(COLLECTIONS.investments, {
    name,
    capital,
    currentValue: currentValue !== null ? currentValue : capital
  });
}

export function updateInvestmentValue(id, newValue) {
  return DB.update(COLLECTIONS.investments, id, { currentValue: newValue });
}

export function addInvestmentCapital(id, additionalCapital) {
  const inv = DB.findOne(COLLECTIONS.investments, i => i.id === id);
  if (!inv) throw new Error('Inversión no encontrada');
  const newCapital = inv.capital + additionalCapital;
  const newCurrent = inv.currentValue + additionalCapital;
  return DB.update(COLLECTIONS.investments, id, {
    capital: newCapital,
    currentValue: newCurrent
  });
}

// --- DEUDAS ---
export function getDebts() {
  return DB.get(COLLECTIONS.debts);
}

export function createDebt(name, totalAmount, currentBalance = null) {
  return DB.insert(COLLECTIONS.debts, {
    name,
    totalAmount,
    currentBalance: currentBalance !== null ? currentBalance : totalAmount
  });
}

export function payDebt(id, amount) {
  const debt = DB.findOne(COLLECTIONS.debts, d => d.id === id);
  if (!debt) throw new Error('Deuda no encontrada');
  const newBalance = Math.max(0, debt.currentBalance - amount);
  return DB.update(COLLECTIONS.debts, id, { currentBalance: newBalance });
}

export function deleteDebt(id) {
  DB.delete(COLLECTIONS.debts, id);
}
