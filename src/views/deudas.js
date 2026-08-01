import { getDebts, createDebt, payDebt, deleteDebt } from '../services/dbService.js';
import { formatCurrency } from '../utils/mathUtils.js';
import { createElement, appendChildren, showModal } from '../utils/domHelpers.js';

export async function renderDeudas(container) {
  const debts = await getDebts();
  const totalDebt = debts.reduce((acc, d) => acc + d.current_balance, 0);

  const header = createElement('div', '', { style: 'display:flex;justify-content:space-between;margin-bottom:var(--space-md);' });
  const totalEl = createElement('h3', '', { textContent: `Total adeudado: ${formatCurrency(totalDebt)}` });
  const addBtn = createElement('button', 'btn btn-primary', { textContent: '+ Nueva Deuda' });
  appendChildren(header, [totalEl, addBtn]);

  const grid = createElement('div', 'cards-grid', { style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--space-md);' });

  for (const debt of debts) {
    const progress = debt.total_amount > 0 ? ((debt.total_amount - debt.current_balance) / debt.total_amount) * 100 : 0;

    const card = createElement('div', 'card');
    const progressBar = createElement('div', 'debt-progress');
    const fill = createElement('div', 'fill', { style: `width:${progress}%;` });
    progressBar.appendChild(fill);

    const header2 = createElement('div', 'card-header');
    const title = createElement('span', 'card-title', { textContent: debt.name });
    const deleteBtn = createElement('button', 'btn-icon', { textContent: '🗑️' });
    deleteBtn.addEventListener('click', async () => {
      if (confirm(`Eliminar deuda "${debt.name}"?`)) {
        await deleteDebt(debt.id);
        renderDeudas(container);
      }
    });
    appendChildren(header2, [title, deleteBtn]);

    const balance = createElement('div', 'card-amount', { textContent: formatCurrency(debt.current_balance) });
    const total = createElement('div', '', { textContent: `Total: ${formatCurrency(debt.total_amount)}`, style: 'color:var(--text-secondary)' });

    const payBtn = createElement('button', 'btn btn-primary', { textContent: 'Abonar' });
    payBtn.addEventListener('click', () => {
      showModal('Abonar a deuda', `
        <div class="form-group"><label>Monto a abonar</label><input type="number" id="pay-amount" step="0.01" max="${debt.current_balance}" /></div>
      `, async () => {
        const amount = parseFloat(document.getElementById('pay-amount').value);
        if (!isNaN(amount) && amount > 0 && amount <= debt.current_balance) {
          await payDebt(debt.id, amount);
          renderDeudas(container);
        }
      });
    });

    appendChildren(card, [progressBar, header2, balance, total, payBtn]);
    grid.appendChild(card);
  }

  addBtn.addEventListener('click', () => {
    showModal('Nueva Deuda', `
      <div class="form-group"><label>Nombre</label><input type="text" id="debt-name" /></div>
      <div class="form-group"><label>Monto total</label><input type="number" id="debt-total" step="0.01" /></div>
      <div class="form-group"><label>Saldo actual (opcional)</label><input type="number" id="debt-balance" step="0.01" /></div>
    `, async () => {
      const name = document.getElementById('debt-name').value.trim();
      const total = parseFloat(document.getElementById('debt-total').value);
      const balance = parseFloat(document.getElementById('debt-balance').value);
      if (name && !isNaN(total) && total > 0) {
        await createDebt(name, total, isNaN(balance) ? null : balance);
        renderDeudas(container);
      }
    });
  });

  appendChildren(container, [header, grid]);
}
