
// Capa de persistencia usando localStorage
// Simula tablas de una base de datos

export const DB = {
  // Obtener todos los registros de una colección
  get(collection) {
    try {
      return JSON.parse(localStorage.getItem(collection)) || [];
    } catch {
      return [];
    }
  },
  // Guardar toda la colección
  set(collection, data) {
    localStorage.setItem(collection, JSON.stringify(data));
  },
  // Generar un ID incremental (simula AUTOINCREMENT)
  nextId(collection) {
    const items = this.get(collection);
    const max = items.reduce((max, item) => Math.max(max, item.id || 0), 0);
    return max + 1;
  },
  // Agregar un nuevo registro
  insert(collection, record) {
    const items = this.get(collection);
    const newRecord = { id: this.nextId(collection), ...record };
    items.push(newRecord);
    this.set(collection, items);
    return newRecord;
  },
  // Actualizar un registro por ID
  update(collection, id, updates) {
    const items = this.get(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    const updated = { ...items[index], ...updates };
    items[index] = updated;
    this.set(collection, items);
    return updated;
  },
  // Eliminar un registro por ID
  delete(collection, id) {
    const items = this.get(collection);
    const filtered = items.filter(item => item.id !== id);
    this.set(collection, filtered);
  },
  // Buscar registros que cumplan una condición
  find(collection, predicate) {
    const items = this.get(collection);
    return items.filter(predicate);
  },
  // Buscar un solo registro
  findOne(collection, predicate) {
    const items = this.get(collection);
    return items.find(predicate) || null;
  }
};

// Colecciones predefinidas
export const COLLECTIONS = {
  pockets: 'pockets',
  movements: 'movements',
  categories: 'categories',
  expenses: 'expenses',
  subExpenses: 'subExpenses',
  subscriptions: 'subscriptions',
  investments: 'investments',
  debts: 'debts'
};
