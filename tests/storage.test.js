import {
  KEYS,
  leerJSON,
  guardarJSON,
  obtenerSesion,
  guardarSesion,
  cerrarSesion,
  inicializarDatos
} from "../src/core/storage.js";

/*
 * Simulación de localStorage para ejecutar los tests en Jest.
 */
const localStorageMock = (() => {
  let datos = {};

  return {
    getItem(clave) {
      return Object.prototype.hasOwnProperty.call(datos, clave)
        ? datos[clave]
        : null;
    },

    setItem(clave, valor) {
      datos[clave] = String(valor);
    },

    removeItem(clave) {
      delete datos[clave];
    },

    clear() {
      datos = {};
    }
  };
})();

globalThis.localStorage = localStorageMock;

beforeEach(() => {
  localStorage.clear();
});

describe("leerJSON", () => {
  test("lee correctamente un valor guardado", () => {
    localStorage.setItem(
      "prueba",
      JSON.stringify([{ id: 1, nombre: "Paulina" }])
    );

    const resultado = leerJSON("prueba");

    expect(resultado).toEqual([
      { id: 1, nombre: "Paulina" }
    ]);
  });

  test("devuelve el valor por defecto cuando no existe la clave", () => {
    const resultado = leerJSON("clave_inexistente");

    expect(resultado).toEqual([]);
  });

  test("devuelve un valor por defecto personalizado", () => {
    const resultado = leerJSON(
      "clave_inexistente",
      { activo: false }
    );

    expect(resultado).toEqual({
      activo: false
    });
  });

  test("devuelve el valor por defecto si el JSON es inválido", () => {
    localStorage.setItem("prueba", "texto que no es JSON");

    const resultado = leerJSON("prueba", []);

    expect(resultado).toEqual([]);
  });
});

describe("guardarJSON", () => {
  test("guarda un objeto convertido a JSON", () => {
    const usuario = {
      id: 1,
      nombre: "Paulina"
    };

    guardarJSON("usuario", usuario);

    expect(localStorage.getItem("usuario")).toBe(
      JSON.stringify(usuario)
    );
  });

  test("permite recuperar el valor guardado", () => {
    const reservas = [
      {
        id: "RES-1",
        habitacion: "Junior"
      }
    ];

    guardarJSON("reservas", reservas);

    expect(leerJSON("reservas")).toEqual(reservas);
  });
});

describe("Manejo de sesión", () => {
  test("guarda una sesión", () => {
    guardarSesion("USR-1");

    expect(localStorage.getItem(KEYS.session)).toBe(
      "USR-1"
    );
  });

  test("obtiene la sesión guardada", () => {
    localStorage.setItem(KEYS.session, "USR-2");

    const resultado = obtenerSesion();

    expect(resultado).toBe("USR-2");
  });

  test("devuelve null cuando no hay sesión", () => {
    const resultado = obtenerSesion();

    expect(resultado).toBeNull();
  });

  test("cierra la sesión", () => {
    guardarSesion("USR-3");

    cerrarSesion();

    expect(obtenerSesion()).toBeNull();
  });
});

describe("inicializarDatos", () => {
  test("crea el usuario administrador", () => {
    inicializarDatos();

    const usuarios = leerJSON(KEYS.users);

    expect(usuarios).toHaveLength(1);

    expect(usuarios[0]).toEqual({
      id: "USR-ADMIN",
      name: "Personal del hotel",
      document: "00000000",
      email: "admin@lasgaviotas.com",
      phone: "",
      password: "admin",
      role: "admin"
    });
  });

  test("crea una lista vacía de reservas", () => {
    inicializarDatos();

    const reservas = leerJSON(KEYS.reservations);

    expect(reservas).toEqual([]);
  });

  test("crea una lista vacía de comentarios", () => {
  inicializarDatos();

  const comentarios = leerJSON(KEYS.comments);

  expect(comentarios).toEqual([]);
});

  test("no sobrescribe usuarios existentes", () => {
    const usuariosExistentes = [
      {
        id: "USR-1",
        name: "Usuario existente"
      }
    ];

    guardarJSON(KEYS.users, usuariosExistentes);

    inicializarDatos();

    expect(leerJSON(KEYS.users)).toEqual(
      usuariosExistentes
    );
  });

  test("no sobrescribe reservas existentes", () => {
    const reservasExistentes = [
      {
        id: "RES-1",
        roomId: "junior"
      }
    ];

    guardarJSON(
      KEYS.reservations,
      reservasExistentes
    );

    inicializarDatos();

    expect(leerJSON(KEYS.reservations)).toEqual(
      reservasExistentes
    );
  });

  test("no sobrescribe comentarios existentes", () => {
    const comentariosExistentes = [
      {
        name: "Comentario existente",
        rating: 5,
        text: "Excelente"
      }
    ];

    guardarJSON(
      KEYS.comments,
      comentariosExistentes
    );

    inicializarDatos();

    expect(leerJSON(KEYS.comments)).toEqual(
      comentariosExistentes
    );
  });
}); 