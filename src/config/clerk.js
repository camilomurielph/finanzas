// Importar Clerk desde el import map
import Clerk from '@clerk/clerk-js';

// Reemplaza con tu clave publicable de Clerk
const CLERK_PUBLISHABLE_KEY = 'pk_test_dXB3YXJkLXdyZW4tNzguY2xlcmsuYWNjb3VudHMuZGV2JA';

let clerkInstance = null;
let currentUser = null;

export async function initClerk() {
  if (!clerkInstance) {
    clerkInstance = new Clerk(CLERK_PUBLISHABLE_KEY);
    await clerkInstance.load({
      // Opciones de personalización
      signInUrl: '/',
      afterSignInUrl: '/',
      afterSignUpUrl: '/',
    });
  }

  // Esperar a que el usuario esté autenticado
  await clerkInstance.load();

  if (clerkInstance.user) {
    currentUser = clerkInstance.user;
    return currentUser;
  }

  // Si no está autenticado, mostrar el modal de inicio de sesión
  clerkInstance.openSignIn();
  return null;
}

export function getClerk() {
  return clerkInstance;
}

export function getCurrentUser() {
  return currentUser || (clerkInstance ? clerkInstance.user : null);
}

export function getUserId() {
  const user = getCurrentUser();
  return user ? user.id : null;
}
