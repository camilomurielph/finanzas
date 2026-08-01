import jsPDF from 'jspdf';
import { getPockets, getMovements, getExpenses, getSubscriptions, getDebts, getInvestments } from '../services/dbService.js';
import { formatCurrency, normalizeSubscriptionAmount } from '../utils/mathUtils.js';
import { createElement } from '../utils/domHelpers.js';

export async function renderReporte(container) {
  const generarBtn = createElement('button', 'btn btn-primary', { textContent: '📊 Generar Reporte PDF' });
  const status = createElement('p', '', { textContent: 'Preparando datos...', style: 'margin-top:var(--space-md);' });

  generarBtn.addEventListener('click', async () => {
    status.textContent = 'Generando reporte...';
    try {
      // Consolidar datos
      const pockets = await getPockets();
      const pocketBalances = {};
      let totalPockets = 0;
      for (const p of pockets) {
        const movs = await getMovements(p.id);
        const balance = movs.reduce((acc, m) => acc + m.amount, 0);
        pocketBalances[p.name] = balance;
        totalPockets += balance;
      }

      const expenses = await getExpenses(null, false);
      const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

      const subscriptions = await getSubscriptions();
      const totalSubs = subscriptions.reduce((acc, s) => acc + normalizeSubscriptionAmount(s.amount, s.frequency), 0);

      const debts = await getDebts();
      const totalDebts = debts.reduce((acc, d) => acc + d.current_balance, 0);

      const investments = await getInvestments();
      const totalInvestments = investments.reduce((acc, i) => acc + i.current_value, 0);

      // Generar PDF
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Reporte Financiero Personal', 14, 22);
      doc.setFontSize(12);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 32);

      let y = 40;
      doc.setFontSize(14);
      doc.text('Resumen General', 14, y);
      y += 8;
      doc.setFontSize(12);
      doc.text(`Total en Bolsillos: ${formatCurrency(totalPockets)}`, 14, y);
      y += 6;
      doc.text(`Gastos del mes: ${formatCurrency(totalExpenses)}`, 14, y);
      y += 6;
      doc.text(`Suscripciones (mensual): ${formatCurrency(totalSubs)}`, 14, y);
      y += 6;
      doc.text(`Deudas pendientes: ${formatCurrency(totalDebts)}`, 14, y);
      y += 6;
      doc.text(`Inversiones: ${formatCurrency(totalInvestments)}`, 14, y);

      y += 10;
      doc.setFontSize(14);
      doc.text('Detalle de Bolsillos', 14, y);
      y += 8;
      doc.setFontSize(12);
      for (const [name, balance] of Object.entries(pocketBalances)) {
        doc.text(`${name}: ${formatCurrency(balance)}`, 14, y);
        y += 6;
        if (y > 270) { doc.addPage(); y = 20; }
      }

      // Descargar
      doc.save('reporte-financiero.pdf');
      status.textContent = '✅ Reporte generado correctamente.';
    } catch (error) {
      console.error(error);
      status.textContent = '❌ Error al generar el reporte.';
    }
  });

  container.appendChild(generarBtn);
  container.appendChild(status);
}
