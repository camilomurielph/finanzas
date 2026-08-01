// Clerk se carga con script tag y ya está inicializado con la clave.
// Usamos la instancia global window.Clerk directamente.

let currentUser = null;

export async function initClerk() {
  const maxAttempts = 20;
  let attempts = 0;
  while (typeof window.Clerk === 'undefined' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  if (typeof window.Clerk === 'undefined') {
    console.error('❌ Clerk no está disponible. Revisa la carga del script.');
    return null;
  }
  console.log('✅ Clerk disponible globalmente.');
  const clerk = window.Clerk;
  if (!clerk.loaded) {
    await clerk.load();
  }
  if (clerk.user) {
    currentUser = clerk.user;
    return currentUser;
  }
  clerk.openSignIn({
    signInUrl: '/finanzas/',
    afterSignInUrl: '/finanzas/',
    afterSignUpUrl: '/finanzas/',
  });
  return null;
}

export function getClerk() {
  return window.Clerk || null;
}

export function getCurrentUser() {
  return currentUser || (window.Clerk ? window.Clerk.user : null);
}

export function getUserId() {
  const user = getCurrentUser();
  return user ? user.id : null;
}
