import { renderBolsillos } from './views/bolsillos.js';
import { renderGastos } from './views/gastos.js';
import { renderSuscripciones } from './views/suscripciones.js';
import { renderInversiones } from './views/inversiones.js';
import { renderDeudas } from './views/deudas.js';
import { renderSueldo } from './views/sueldo.js';
import { renderReporte } from './views/reporte.js';

const viewMap = {
  bolsillos: { title: 'Bolsillos', render: renderBolsillos },
  gastos: { title: 'Gastos', render: renderGastos },
  suscripciones: { title: 'Suscripciones', render: renderSuscripciones },
  inversiones: { title: 'Inversiones', render: renderInversiones },
  deudas: { title: 'Deudas', render: renderDeudas },
  sueldo: { title: 'Simulador de Sueldo', render: renderSueldo },
  reporte: { title: 'Reporte', render: renderReporte },
};

let container = null;
let titleEl = null;

export const router = {
  setContainer(containerEl, titleElement) {
    container = containerEl;
    titleEl = titleElement;
  },

  navigate(viewName) {
    if (!container || !titleEl) {
      console.warn('Router no inicializado');
      return;
    }

    const view = viewMap[viewName];
    if (!view) {
      console.error(`Vista no encontrada: ${viewName}`);
      return;
    }

    // Actualizar título
    titleEl.textContent = view.title;

    // Limpiar contenedor y renderizar nueva vista
    container.innerHTML = '';
    view.render(container);

    // Marcar elemento activo en sidebar (evento)
    document.dispatchEvent(new CustomEvent('view-changed', { detail: { view: viewName } }));
  }
};
