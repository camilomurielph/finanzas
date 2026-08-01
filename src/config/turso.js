import { createClient } from '@libsql/client/web';

// Reemplaza con tu URL y token de Turso
const TURSO_DATABASE_URL = 'libsql://finanzas-camilomurielph.aws-us-west-2.turso.io';
const TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU1NTM5MjQsImlkIjoiMDE5ZmJiNGQtODkwMS03ZWI1LTljYTYtNzkxZGVhNDFmZmQzIiwia2lkIjoicG11UzJqeERaZTZEa0lZUk10bl9ZNUhxa0pRLVJFZEFHbmhkSDhOT2QydyIsInJpZCI6ImQ2MGYwYzI3LTFlZjYtNDEyOC04MjgwLTJmMDg4NmNmYmE1NCJ9.gwWta4HwT9P7k-RbHi14-gmVR04A3o-kJ6t_3cvrvzRke37s5RB6GD7OlY_KNwpdIcl9gVRP_oh7YKanWlqOAg';

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
