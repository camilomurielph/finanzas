// Clerk está disponible globalmente (cargado por script)
// No usamos import, usamos window.Clerk

// Reemplaza con tu clave publicable de Clerk
const CLERK_PUBLISHABLE_KEY = 'pk_test_dXB3YXJkLXdyZW4tNzguY2xlcmsuYWNjb3VudHMuZGV2JA';

let clerkInstance = null;
let currentUser = null;

export async function initClerk() {
  // Esperar a que el script de Clerk se haya cargado
  if (typeof window.Clerk === 'undefined') {
    console.error('Clerk no está disponible. Revisa la carga del script.');
    return null;
  }

  if (!clerkInstance) {
    clerkInstance = new window.Clerk(CLERK_PUBLISHABLE_KEY);
    await clerkInstance.load({
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
