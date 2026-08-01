// Clerk se carga como script global. Esperamos a que exista.
// Reemplaza con tu clave publicable de Clerk
const CLERK_PUBLISHABLE_KEY = 'pk_test_dXB3YXJkLXdyZW4tNzguY2xlcmsuYWNjb3VudHMuZGV2JA';

let clerkInstance = null;
let currentUser = null;

function waitForClerk(maxAttempts = 20, delay = 100) {
  return new Promise((resolve) => {
    let attempts = 0;
    const check = () => {
      if (typeof window.Clerk !== 'undefined') {
        resolve(window.Clerk);
        return;
      }
      attempts++;
      if (attempts >= maxAttempts) {
        console.error('Clerk no se cargó después de varios intentos.');
        resolve(null);
        return;
      }
      setTimeout(check, delay);
    };
    check();
  });
}

export async function initClerk() {
  console.log('⏳ Esperando que Clerk esté disponible...');
  const ClerkGlobal = await waitForClerk();
  if (!ClerkGlobal) {
    console.error('❌ Clerk no está disponible. Revisa la carga del script.');
    return null;
  }
  console.log('✅ Clerk disponible globalmente.');

  if (!clerkInstance) {
    clerkInstance = new ClerkGlobal(CLERK_PUBLISHABLE_KEY);
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
