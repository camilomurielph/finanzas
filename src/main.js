console.log('🚀 main.js se está ejecutando');

import { initClerk } from './config/clerk.js';
import { router } from './router.js';
import { renderSidebar } from './views/sidebar.js';
import { loadUserData } from './services/dbService.js';

// Elementos del DOM
const sidebarEl = document.getElementById('sidebar');
const viewContainer = document.getElementById('view-container');
const viewTitle = document.getElementById('view-title');

// Inicializar Clerk y luego arrancar la app
async function initApp() {
  console.log('⏳ Iniciando Clerk...');
  try {
    const user = await initClerk();
    console.log('👤 Usuario autenticado:', user);
    if (!user) return;

    await loadUserData(user.id);
    console.log('📦 Datos cargados');

    renderSidebar(sidebarEl);
    router.setContainer(viewContainer, viewTitle);
    router.navigate('bolsillos');

    document.addEventListener('navigate', (e) => {
      router.navigate(e.detail.view);
    });

  } catch (error) {
    console.error('❌ Error al iniciar la aplicación:', error);
  }
}

initApp();
