import { getPockets, createPocket, updatePocket, deletePocket, getMovements, createMovement } from '../services/dbService.js';
import { formatCurrency } from '../utils/mathUtils.js';
import { formatDate } from '../utils/dateUtils.js';
import { createElement, appendChildren, showModal } from '../utils/domHelpers.js';

export function renderBolsillos(container) {
  const pockets = getPockets();
  const grid = createElement('div', 'cards-grid', { style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--space-md);' });

  for (const pocket of pockets) {
    const movements = getMovements(pocket.id);
    const balance = movements.reduce((acc, m) => acc + m.amount, 0);

    const card = createElement('div', 'card');
    const header = createElement('div', 'card-header');
    const title = createElement('span', 'card-title', { textContent: pocket.name });
    const actions = createElement('div', 'card-actions');
    const editBtn = createElement('button', 'btn-icon', { textContent: '✏️' });
    const deleteBtn = createElement('button', 'btn-icon', { textContent: '🗑️' });
    appendChildren(actions, [editBtn, deleteBtn]);
    appendChildren(header, [title, actions]);

    const amount = createElement('div', 'card-amount', { textContent: formatCurrency(balance) });

    const actionRow = createElement('div', 'card-actions-row');
    const addBtn = createElement('button', 'btn btn-primary', { textContent: '+ Añadir' });
    const withdrawBtn = createElement('button', 'btn btn-danger', { textContent: '- Retirar' });
    appendChildren(actionRow, [addBtn, withdrawBtn]);

    // Movimientos recientes
    const movContainer = createElement('div', 'movements');
    const toggle = createElement('button', 'btn btn-secondary', { textContent: '▼ Movimientos recientes' });
    const movList = createElement('ul', 'mov-list', { style: 'display:none;list-style:none;margin-top:var(--space-sm);' });
    movements.slice(0, 5).forEach(m => {
      const li = createElement('li', '', { 
        textContent: `${formatDate(m.date)}: ${m.description || 'Movimiento'} ${formatCurrency(m.amount)}`
      });
      movList.appendChild(li);
    });
    toggle.addEventListener('click', () => {
      movList.style.display = movList.style.display === 'none' ? 'block' : 'none';
    });
    appendChildren(movContainer, [toggle, movList]);

    appendChildren(card, [header, amount, actionRow, movContainer]);
    grid.appendChild(card);

    // Event listeners
    editBtn.addEventListener('click', () => {
      showModal('Editar bolsillo', `
        <div class="form-group">
          <label>Nombre</label>
          <input type="text" id="edit-pocket-name" value="${pocket.name}" />
        </div>
      `, () => {
        const name = document.getElementById('edit-pocket-name').value.trim();
        if (name) {
          updatePocket(pocket.id, name);
          renderBolsillos(container);
        }
      });
    });

    deleteBtn.addEventListener('click', () => {
      if (confirm(`¿Eliminar el bolsillo "${pocket.name}"?`)) {
        deletePocket(pocket.id);
        renderBolsillos(container);
      }
    });

    addBtn.addEventListener('click', () => {
      showModal('Añadir dinero', `
        <div class="form-group">
          <label>Monto</label>
          <input type="number" id="mov-amount" step="0.01" />
        </div>
        <div class="form-group">
          <label>Descripción (opcional)</label>
          <input type="text" id="mov-desc" />
        </div>
      `, () => {
        const amount = parseFloat(document.getElementById('mov-amount').value);
        const desc = document.getElementById('mov-desc').value.trim();
        if (!isNaN(amount) && amount > 0) {
          createMovement(pocket.id, amount, desc);
          renderBolsillos(container);
        }
      });
    });

    withdrawBtn.addEventListener('click', () => {
      showModal('Retirar dinero', `
        <div class="form-group">
          <label>Monto</label>
          <input type="number" id="mov-amount" step="0.01" />
        </div>
        <div class="form-group">
          <label>Descripción (opcional)</label>
          <input type="text" id="mov-desc" />
        </div>
      `, () => {
        const amount = parseFloat(document.getElementById('mov-amount').value);
        const desc = document.getElementById('mov-desc').value.trim();
        if (!isNaN(amount) && amount > 0) {
          createMovement(pocket.id, -amount, desc);
          renderBolsillos(container);
        }
      });
    });
  }

  const addPocketBtn = createElement('button', 'btn btn-primary', { textContent: '+ Nuevo Bolsillo' });
  addPocketBtn.addEventListener('click', () => {
    showModal('Nuevo Bolsillo', `
      <div class="form-group">
        <label>Nombre</label>
        <input type="text" id="new-pocket-name" />
      </div>
    `, () => {
      const name = document.getElementById('new-pocket-name').value.trim();
      if (name) {
        createPocket(name);
        renderBolsillos(container);
      }
    });
  });

  appendChildren(container, [grid, addPocketBtn]);
}
