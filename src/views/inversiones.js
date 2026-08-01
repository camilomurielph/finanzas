import { getInvestments, createInvestment, updateInvestmentValue, addInvestmentCapital } from '../services/dbService.js';
import { formatCurrency } from '../utils/mathUtils.js';
import { createElement, appendChildren, showModal } from '../utils/domHelpers.js';

export function renderInversiones(container) {
  const investments = getInvestments();
  const grid = createElement('div', 'cards-grid', { style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--space-md);' });

  for (const inv of investments) {
    const gain = inv.currentValue - inv.capital;
    const gainPercent = inv.capital > 0 ? (gain / inv.capital) * 100 : 0;

    const card = createElement('div', 'card');
    const header = createElement('div', 'card-header');
    const title = createElement('span', 'card-title', { textContent: inv.name });
    appendChildren(header, [title]);

    const amount = createElement('div', 'card-amount', { textContent: formatCurrency(inv.currentValue) });
    const capitalInfo = createElement('div', '', { textContent: `Capital: ${formatCurrency(inv.capital)}`, style: 'color:var(--text-secondary)' });
    const gainInfo = createElement('div', '', { 
      textContent: `${gain >= 0 ? '+' : ''}${formatCurrency(gain)} (${gainPercent.toFixed(2)}%)`,
      style: `color:${gain >= 0 ? 'var(--color-primary)' : 'var(--color-danger)'};font-weight:600;`
    });

    const actions = createElement('div', 'card-actions-row');
    const addBtn = createElement('button', 'btn btn-primary', { textContent: 'Aportar' });
    const updateBtn = createElement('button', 'btn btn-secondary', { textContent: 'Actualizar Valor' });
    appendChildren(actions, [addBtn, updateBtn]);

    appendChildren(card, [header, amount, capitalInfo, gainInfo, actions]);
    grid.appendChild(card);

    addBtn.addEventListener('click', () => {
      showModal('Aportar a inversión', `
        <div class="form-group"><label>Monto</label><input type="number" id="add-capital" step="0.01" /></div>
      `, () => {
        const amount = parseFloat(document.getElementById('add-capital').value);
        if (!isNaN(amount) && amount > 0) {
          addInvestmentCapital(inv.id, amount);
          renderInversiones(container);
        }
      });
    });

    updateBtn.addEventListener('click', () => {
      showModal('Actualizar valor actual', `
        <div class="form-group"><label>Nuevo valor</label><input type="number" id="new-value" step="0.01" value="${inv.currentValue}" /></div>
      `, () => {
        const val = parseFloat(document.getElementById('new-value').value);
        if (!isNaN(val) && val >= 0) {
          updateInvestmentValue(inv.id, val);
          renderInversiones(container);
        }
      });
    });
  }

  const addInvBtn = createElement('button', 'btn btn-primary', { textContent: '+ Nueva Inversión' });
  addInvBtn.addEventListener('click', () => {
    showModal('Nueva Inversión', `
      <div class="form-group"><label>Nombre</label><input type="text" id="inv-name" /></div>
      <div class="form-group"><label>Capital invertido</label><input type="number" id="inv-capital" step="0.01" /></div>
      <div class="form-group"><label>Valor actual (opcional)</label><input type="number" id="inv-current" step="0.01" /></div>
    `, () => {
      const name = document.getElementById('inv-name').value.trim();
      const capital = parseFloat(document.getElementById('inv-capital').value);
      const current = parseFloat(document.getElementById('inv-current').value);
      if (name && !isNaN(capital) && capital > 0) {
        createInvestment(name, capital, isNaN(current) ? null : current);
        renderInversiones(container);
      }
    });
  });

  appendChildren(container, [grid, addInvBtn]);
}
