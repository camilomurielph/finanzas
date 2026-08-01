import { createElement, appendChildren, showModal } from '../utils/domHelpers.js';
import { formatCurrency } from '../utils/mathUtils.js';

export function renderSueldo(container) {
  // Estado local
  let sueldo = 0;
  let gastosPlaneados = [];

  const mainContainer = createElement('div', 'sueldo-container');

  // Formulario de sueldo
  const sueldoSection = createElement('div', '', { style: 'margin-bottom:var(--space-lg);' });
  const sueldoLabel = createElement('label', '', { textContent: 'Sueldo mensual:' });
  const sueldoInput = createElement('input', '', { type: 'number', id: 'sueldo-input', step: '0.01', placeholder: 'Ej: 2500000' });
  const setSueldoBtn = createElement('button', 'btn btn-primary', { textContent: 'Establecer' });
  setSueldoBtn.addEventListener('click', () => {
    const val = parseFloat(sueldoInput.value);
    if (!isNaN(val) && val >= 0) {
      sueldo = val;
      updateUI();
    }
  });
  appendChildren(sueldoSection, [sueldoLabel, sueldoInput, setSueldoBtn]);

  // Lista de gastos planeados
  const gastosSection = createElement('div', '', { style: 'margin-bottom:var(--space-lg);' });
  const gastosHeader = createElement('div', '', { style: 'display:flex;justify-content:space-between;' });
  const gastosTitle = createElement('h3', '', { textContent: 'Gastos planeados' });
  const addGastoBtn = createElement('button', 'btn btn-secondary', { textContent: '+ Añadir gasto' });
  addGastoBtn.addEventListener('click', () => {
    const modal = showModal('Nuevo gasto planeado', `
      <div class="form-group"><label>Concepto</label><input type="text" id="gasto-concept" /></div>
      <div class="form-group"><label>Monto</label><input type="number" id="gasto-amount" step="0.01" /></div>
    `, () => {
      const concept = document.getElementById('gasto-concept').value.trim();
      const amount = parseFloat(document.getElementById('gasto-amount').value);
      if (concept && !isNaN(amount) && amount > 0) {
        gastosPlaneados.push({ concept, amount });
        updateUI();
      }
    });
  });
  appendChildren(gastosHeader, [gastosTitle, addGastoBtn]);
  appendChildren(gastosSection, [gastosHeader]);

  const gastosList = createElement('ul', '', { id: 'gastos-list', style: 'list-style:none;' });
  gastosSection.appendChild(gastosList);

  // Resumen y botón ahorro
  const resumenSection = createElement('div', '', { style: 'margin-top:var(--space-lg);padding:var(--space-md);background:var(--bg-secondary);border-radius:var(--radius-lg);' });
  const saldoDisponibleEl = createElement('p', '', { id: 'saldo-disponible' });
  const ahorroBtn = createElement('button', 'btn btn-primary', { id: 'ahorro-btn', textContent: 'Calcular Ahorro (1/10)' });
  const ahorroResult = createElement('div', '', { id: 'ahorro-result', style: 'margin-top:var(--space-sm);font-weight:600;' });

  ahorroBtn.addEventListener('click', () => {
    const totalGastos = gastosPlaneados.reduce((acc, g) => acc + g.amount, 0);
    const saldo = sueldo - totalGastos;
    if (saldo > 0) {
      const ahorro = saldo / 10;
      ahorroResult.textContent = `💰 Sugerencia de ahorro: ${formatCurrency(ahorro)} (10% del saldo disponible)`;
    } else {
      ahorroResult.textContent = '⚠️ No hay saldo disponible para ahorrar.';
    }
  });

  appendChildren(resumenSection, [saldoDisponibleEl, ahorroBtn, ahorroResult]);

  // Función para actualizar UI
  function updateUI() {
    // Actualizar lista de gastos
    gastosList.innerHTML = '';
    let totalGastos = 0;
    gastosPlaneados.forEach((g, index) => {
      totalGastos += g.amount;
      const li = createElement('li', '', { style: 'display:flex;justify-content:space-between;padding:var(--space-xs) 0;border-bottom:1px solid var(--border-subtle);' });
      const text = createElement('span', '', { textContent: `${g.concept}: ${formatCurrency(g.amount)}` });
      const del = createElement('button', 'btn-icon', { textContent: '✕' });
      del.addEventListener('click', () => {
        gastosPlaneados.splice(index, 1);
        updateUI();
      });
      appendChildren(li, [text, del]);
      gastosList.appendChild(li);
    });

    // Actualizar saldo
    const saldo = sueldo - totalGastos;
    saldoDisponibleEl.textContent = `💰 Saldo disponible: ${formatCurrency(saldo)}`;
    saldoDisponibleEl.style.color = saldo >= 0 ? 'var(--color-primary)' : 'var(--color-danger)';
    // Limpiar resultado ahorro
    ahorroResult.textContent = '';
  }

  appendChildren(mainContainer, [sueldoSection, gastosSection, resumenSection]);
  container.appendChild(mainContainer);

  // Inicializar UI
  updateUI();
}
