/*
 * src/core/storage.js
 * Único módulo responsable de guardar y leer información.
 */

export const KEYS = {
  users: "hp_users",
  reservations: "hp_reservations",
  session: "hp_session",
  comments: "hp_comments"
};

export function leerJSON(clave, valorPorDefecto = []) {
  try {
    const contenido = localStorage.getItem(clave);
    return contenido
      ? JSON.parse(contenido)
      : valorPorDefecto;
  } catch {
    return valorPorDefecto;
  }
}

export function guardarJSON(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor));
}

export function obtenerSesion() {
  return localStorage.getItem(KEYS.session);
}

export function guardarSesion(usuarioId) {
  localStorage.setItem(KEYS.session, usuarioId);
}

export function cerrarSesion() {
  localStorage.removeItem(KEYS.session);
}

export function inicializarDatos() {
  if (!localStorage.getItem(KEYS.users)) {
    guardarJSON(KEYS.users, [
      {
        id: "USR-ADMIN",
        name: "Personal del hotel",
        document: "00000000",
        email: "admin@paradise.com",
        phone: "",
        password: "admin",
        role: "admin"
      }
    ]);
  }

  if (!localStorage.getItem(KEYS.reservations)) {
    guardarJSON(KEYS.reservations, []);
  }

  if (!localStorage.getItem(KEYS.comments)) {
    guardarJSON(KEYS.comments, [
      {
        name: "María González",
        rating: 5,
        text: "Excelente atención y habitaciones impecables."
      },
      {
        name: "Juan Pérez",
        rating: 4,
        text: "Muy buena ubicación y servicios."
      }
    ]);
  }
}
