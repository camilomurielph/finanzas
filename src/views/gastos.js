import { getCategories, getExpenses, createExpense, toggleExpenseCompleted, archiveExpense, getSubExpenses, createSubExpense, toggleSubExpenseCompleted } from '../services/dbService.js';
import { formatCurrency } from '../utils/mathUtils.js';
import { formatDate } from '../utils/dateUtils.js';
import { createElement, appendChildren, showModal } from '../utils/domHelpers.js';

export function renderGastos(container) {
  const categories = getCategories();
  const activeExpenses = getExpenses(null, false);
  const archivedExpenses = getExpenses(null, true);

  // --- Contenedor de pestañas (filtro) ---
  const filterContainer = createElement('div', 'filter-tabs', { style: 'display:flex;gap:var(--space-sm);margin-bottom:var(--space-md);flex-wrap:wrap;' });
  
  // Botón "Todos"
  const allTab = createElement('button', 'btn btn-secondary active', { textContent: 'Todos' });
  allTab.dataset.cat = '';
  allTab.addEventListener('click', () => {
    filterContainer.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
    allTab.classList.add('active');
    renderExpenses(null);
  });
  filterContainer.appendChild(allTab);

  // Botones por categoría
  categories.forEach(cat => {
    const tab = createElement('button', 'btn btn-secondary', { textContent: cat.name });
    tab.dataset.cat = cat.id;
    tab.addEventListener('click', () => {
      filterContainer.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
      tab.classList.add('active');
      renderExpenses(parseInt(tab.dataset.cat));
    });
    filterContainer.appendChild(tab);
  });

  // --- Lista de gastos ---
  const expensesContainer = createElement('div', 'expenses-list');

  function renderExpenses(categoryId = null) {
    expensesContainer.innerHTML = '';
    const filtered = categoryId ? activeExpenses.filter(e => e.categoryId === categoryId) : activeExpenses;
    if (filtered.length === 0) {
      expensesContainer.appendChild(createElement('p', '', { textContent: 'No hay gastos activos.' }));
    } else {
      filtered.forEach(exp => {
        const row = createExpenseRow(exp);
        expensesContainer.appendChild(row);
      });
    }
  }

  // --- Botón agregar gasto ---
  const addBtn = createElement('button', 'btn btn-primary', { textContent: '+ Nuevo Gasto' });
  addBtn.addEventListener('click', () => {
    const catOptions = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    showModal('Nuevo Gasto', `
      <div class="form-group"><label>Descripción</label><input type="text" id="exp-desc" /></div>
      <div class="form-group"><label>Monto</label><input type="number" id="exp-amount" step="0.01" /></div>
      <div class="form-group"><label>Categoría</label><select id="exp-cat">${catOptions}</select></div>
      <div class="form-group"><label>Fecha</label><input type="date" id="exp-date" value="${new Date().toISOString().split('T')[0]}" /></div>
    `, () => {
      const desc = document.getElementById('exp-desc').value.trim();
      const amount = parseFloat(document.getElementById('exp-amount').value);
      const catId = parseInt(document.getElementById('exp-cat').value);
      const date = document.getElementById('exp-date').value;
      if (desc && !isNaN(amount) && amount > 0 && catId) {
        createExpense(desc, amount, catId, date);
        renderGastos(container);
      }
    });
  });

  // --- Render inicial ---
  renderExpenses();

  // --- Gastos archivados (colapsable) ---
  const archiveSection = createElement('div', 'archived-section');
  const archiveToggle = createElement('button', 'btn btn-secondary', { textContent: `📦 Gastos Archivados (${archivedExpenses.length})` });
  const archiveList = createElement('div', 'archived-list', { style: 'display:none;margin-top:var(--space-sm);' });
  if (archivedExpenses.length === 0) {
    archiveList.appendChild(createElement('p', '', { textContent: 'No hay gastos archivados.' }));
  } else {
    archivedExpenses.forEach(exp => {
      const row = createExpenseRow(exp, true);
      archiveList.appendChild(row);
    });
  }
  archiveToggle.addEventListener('click', () => {
    archiveList.style.display = archiveList.style.display === 'none' ? 'block' : 'none';
  });
  appendChildren(archiveSection, [archiveToggle, archiveList]);

  // --- Ensamblar vista ---
  appendChildren(container, [
    createElement('div', 'filters', { style: 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--space-md);margin-bottom:var(--space-md);' }, [filterContainer, addBtn]),
    expensesContainer,
    archiveSection
  ]);
}

// --- Función para crear una fila de gasto ---
function createExpenseRow(exp, isArchived = false) {
  const row = createElement('div', 'expense-row');
  const date = createElement('span', 'expense-date', { textContent: formatDate(exp.date) });
  const desc = createElement('span', 'expense-desc', { textContent: exp.description });
  const amount = createElement('span', 'expense-amount', { textContent: formatCurrency(exp.amount) });
  
  // Contenedor de acciones (dividir, archivar)
  const actions = createElement('div', 'expense-actions');
  if (!isArchived) {
    const divideBtn = createElement('button', 'btn-icon', { textContent: '🔗' });
    divideBtn.addEventListener('click', () => {
      showModal('Dividir Gasto', `
        <div class="form-group"><label>Descripción cuota</label><input type="text" id="sub-desc" placeholder="Cuota 1" /></div>
        <div class="form-group"><label>Monto</label><input type="number" id="sub-amount" step="0.01" /></div>
        <div class="form-group"><label>Anotación</label><input type="text" id="sub-note" placeholder="Opcional" /></div>
      `, () => {
        const desc = document.getElementById('sub-desc').value.trim();
        const amount = parseFloat(document.getElementById('sub-amount').value);
        const note = document.getElementById('sub-note').value.trim();
        if (desc && !isNaN(amount) && amount > 0) {
          createSubExpense(exp.id, desc, amount, note);
          renderGastos(document.getElementById('view-container'));
        }
      });
    });
    actions.appendChild(divideBtn);

    const archiveBtn = createElement('button', 'btn-icon', { textContent: '📁' });
    archiveBtn.addEventListener('click', () => {
      if (confirm('Archivar este gasto?')) {
        archiveExpense(exp.id);
        renderGastos(document.getElementById('view-container'));
      }
    });
    actions.appendChild(archiveBtn);
  }

  // Checkbox (al final de la fila)
  const checkbox = createElement('input', '', { type: 'checkbox', class: 'expense-check', checked: exp.completed ? 'checked' : '' });
  checkbox.addEventListener('change', () => {
    toggleExpenseCompleted(exp.id);
    renderGastos(document.getElementById('view-container'));
  });

  // Ensamblar la fila (orden: fecha, descripción, monto, acciones, checkbox)
  appendChildren(row, [date, desc, amount, actions, checkbox]);

  // --- Subgastos (indentados) ---
  const subContainer = createElement('div', 'sub-expenses', { style: 'grid-column:1/-1;padding-left:var(--space-xl);' });
  const subs = getSubExpenses(exp.id);
  if (subs.length > 0) {
    subs.forEach(sub => {
      const subRow = createElement('div', 'sub-expense-row');
      const subDesc = createElement('span', 'sub-desc', { textContent: sub.description });
      const subAmount = createElement('span', 'sub-amount', { textContent: formatCurrency(sub.amount) });
      const subNote = createElement('span', 'sub-note', { textContent: sub.note || '' });
      const subCheck = createElement('input', '', { type: 'checkbox', class: 'sub-check', checked: sub.completed ? 'checked' : '' });
      subCheck.addEventListener('change', () => {
        toggleSubExpenseCompleted(sub.id);
        renderGastos(document.getElementById('view-container'));
      });
      appendChildren(subRow, [subDesc, subAmount, subNote, subCheck]);
      subContainer.appendChild(subRow);
    });
  }
  row.appendChild(subContainer);

  return row;
}
