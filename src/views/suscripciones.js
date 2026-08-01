import { getSubscriptions, createSubscription, deleteSubscription } from '../services/dbService.js';
import { formatCurrency, normalizeSubscriptionAmount } from '../utils/mathUtils.js';
import { createElement, appendChildren, showModal } from '../utils/domHelpers.js';

export async function renderSuscripciones(container) {
  const subs = await getSubscriptions();
  const totalMonthly = subs.reduce((acc, s) => acc + normalizeSubscriptionAmount(s.amount, s.frequency), 0);

  const header = createElement('div', '', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);' });
  const totalEl = createElement('h3', '', { textContent: `Total mensual: ${formatCurrency(totalMonthly)}` });
  const addBtn = createElement('button', 'btn btn-primary', { textContent: '+ Nueva Suscripción' });
  appendChildren(header, [totalEl, addBtn]);

  const list = createElement('ul', '', { style: 'list-style:none;display:flex;flex-direction:column;gap:var(--space-sm);' });
  for (const sub of subs) {
    const item = createElement('li', 'card', { style: 'padding:var(--space-md);display:flex;justify-content:space-between;align-items:center;' });
    const info = createElement('div', '');
    const name = createElement('strong', '', { textContent: sub.name });
    const details = createElement('span', '', { 
      textContent: ` | ${formatCurrency(sub.amount)} / ${sub.frequency} | Cobro: ${sub.charge_date}` 
    });
    appendChildren(info, [name, details]);
    const deleteBtn = createElement('button', 'btn btn-danger', { textContent: 'Eliminar' });
    deleteBtn.addEventListener('click', async () => {
      if (confirm(`Eliminar suscripción "${sub.name}"?`)) {
        await deleteSubscription(sub.id);
        renderSuscripciones(container);
      }
    });
    appendChildren(item, [info, deleteBtn]);
    list.appendChild(item);
  }

  addBtn.addEventListener('click', () => {
    const modal = showModal('Nueva Suscripción', `
      <div class="form-group"><label>Nombre</label><input type="text" id="sub-name" /></div>
      <div class="form-group"><label>Monto</label><input type="number" id="sub-amount" step="0.01" /></div>
      <div class="form-group"><label>Frecuencia</label>
        <select id="sub-freq">
          <option value="diario">Diario</option>
          <option value="semanal">Semanal</option>
          <option value="quincenal">Quincenal</option>
          <option value="mensual" selected>Mensual</option>
          <option value="anual">Anual</option>
        </select>
      </div>
      <div class="form-group"><label>Fecha de cobro (día)</label><input type="number" id="sub-charge" min="1" max="31" value="1" /></div>
    `, async () => {
      const name = document.getElementById('sub-name').value.trim();
      const amount = parseFloat(document.getElementById('sub-amount').value);
      const frequency = document.getElementById('sub-freq').value;
      const chargeDate = document.getElementById('sub-charge').value;
      if (name && !isNaN(amount) && amount > 0 && chargeDate) {
        await createSubscription(name, amount, frequency, chargeDate);
        renderSuscripciones(container);
      }
    });
  });

  appendChildren(container, [header, list]);
}
