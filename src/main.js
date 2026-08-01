import { initClerk, getClerk } from './config/clerk.js';
import { router } from './router.js';
import { renderSidebar } from './views/sidebar.js';
import { loadUserData } from './services/dbService.js';

// Elementos del DOM
const sidebarEl = document.getElementById('sidebar');
const viewContainer = document.getElementById('view-container');
const viewTitle = document.getElementById('view-title');

// Inicializar Clerk y luego arrancar la app
async function initApp() {
  try {
    // Esperar autenticación
    const user = await initClerk();
    if (!user) {
      // Clerk maneja la UI de login automáticamente
      return;
    }

    // Cargar datos del usuario (opcional)
    await loadUserData(user.id);

    // Renderizar sidebar
    renderSidebar(sidebarEl);

    // Configurar router
    router.setContainer(viewContainer, viewTitle);
    router.navigate('bolsillos'); // vista por defecto

    // Escuchar eventos de navegación desde sidebar
    document.addEventListener('navigate', (e) => {
      const { view } = e.detail;
      router.navigate(view);
    });

  } catch (error) {
    console.error('Error al iniciar la aplicación:', error);
  }
}

initApp();
