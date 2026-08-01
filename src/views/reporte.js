// src/views/reporte.js
// import jsPDF from 'jspdf'; // <-- Elimina esta línea
import { getPockets, getMovements, getExpenses, getSubscriptions, getDebts, getInvestments } from '../services/dbService.js';
import { formatCurrency, normalizeSubscriptionAmount } from '../utils/mathUtils.js';
import { createElement } from '../utils/domHelpers.js';

export function renderReporte(container) {
  const generarBtn = createElement('button', 'btn btn-primary', { textContent: '📊 Generar Reporte PDF' });
  const status = createElement('p', '', { textContent: 'Preparando datos...', style: 'margin-top:var(--space-md);' });

  generarBtn.addEventListener('click', async () => {
    status.textContent = 'Generando reporte...';
    try {
      // ... (código de consolidación de datos igual) ...

      // Usar window.jspdf (cargado globalmente)
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      // ... (resto del código del PDF igual) ...

    } catch (error) {
      console.error(error);
      status.textContent = '❌ Error al generar el reporte.';
    }
  });

  container.appendChild(generarBtn);
  container.appendChild(status);
}
