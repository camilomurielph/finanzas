import { createClient } from '@libsql/client/web';

// Reemplaza con tu URL y token de Turso
const TURSO_DATABASE_URL = 'https://tu-base-de-datos.turso.io';
const TURSO_AUTH_TOKEN = 'tu-token-de-autenticacion';

let client = null;

export function getTursoClient() {
  if (!client) {
    client = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    });
  }
  return client;
}
