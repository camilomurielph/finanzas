console.log('🚀 main.js se está ejecutando');

import { router } from './router.js';
import { renderSidebar } from './views/sidebar.js';
import { initDB } from './services/dbService.js';

// Elementos del DOM
const sidebarEl = document.getElementById('sidebar');
const viewContainer = document.getElementById('view-container');
const viewTitle = document.getElementById('view-title');

// Inicializar la base de datos (crear tablas y categorías por defecto)
initDB();

// Renderizar sidebar (sin autenticación, usuario fijo "Demo")
renderSidebar(sidebarEl, 'Demo');

// Configurar router
router.setContainer(viewContainer, viewTitle);
router.navigate('bolsillos');

// Escuchar eventos de navegación desde sidebar
document.addEventListener('navigate', (e) => {
  router.navigate(e.detail.view);
});
