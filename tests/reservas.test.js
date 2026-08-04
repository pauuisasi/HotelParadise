import {
  validarFechas,
  validarCapacidad,
  fechasSeSuperponen,
  calcularNoches,
  calcularCostoReserva,
  puedeCancelarReserva
} from "../src/core/reservas.js";

describe("Validación de fechas", () => {
  test("acepta fechas válidas", () => {
    const resultado = validarFechas(
      "2026-08-05",
      "2026-08-08",
      "2026-08-04"
    );

    expect(resultado.valido).toBe(true);
    expect(resultado.mensaje).toBe("");
  });

  test("rechaza fechas vacías", () => {
    const resultado = validarFechas(
      "",
      "",
      "2026-08-04"
    );

    expect(resultado.valido).toBe(false);
  });

  test("rechaza una fecha de ingreso anterior a hoy", () => {
    const resultado = validarFechas(
      "2026-08-03",
      "2026-08-08",
      "2026-08-04"
    );

    expect(resultado.valido).toBe(false);
  });

  test("rechaza una salida igual al ingreso", () => {
    const resultado = validarFechas(
      "2026-08-05",
      "2026-08-05",
      "2026-08-04"
    );

    expect(resultado.valido).toBe(false);
  });
});

describe("Cálculo de noches", () => {
  test("calcula correctamente las noches", () => {
    const resultado = calcularNoches(
      "2026-08-05",
      "2026-08-08"
    );

    expect(resultado).toBe(3);
  });
});

describe("Cálculo del costo de la reserva", () => {
  test("calcula el costo sin extras", () => {
    const resultado = calcularCostoReserva({
      precioPorNoche: 100,
      noches: 2,
      huespedes: 2,
      parking: false,
      desayuno: false,
      traslado: false
    });

    expect(resultado).toBe(200);
  });

  test("calcula el costo con todos los extras", () => {
    const resultado = calcularCostoReserva({
      precioPorNoche: 100,
      noches: 2,
      huespedes: 2,
      parking: true,
      desayuno: true,
      traslado: true
    });

    expect(resultado).toBe(440);
  });
});

describe("Validación de capacidad", () => {
  test("rechaza una habitación inexistente", () => {
    const resultado = validarCapacidad(null, 2);

    expect(resultado.valido).toBe(false);
  });

  test("rechaza más huéspedes que la capacidad", () => {
    const habitacion = {
      id: "simple",
      capacity: 2
    };

    const resultado = validarCapacidad(habitacion, 3);

    expect(resultado.valido).toBe(false);
  });

  test("acepta una cantidad válida de huéspedes", () => {
    const habitacion = {
      id: "junior",
      capacity: 3
    };

    const resultado = validarCapacidad(habitacion, 2);

    expect(resultado.valido).toBe(true);
  });
});

describe("Superposición de fechas", () => {
  test("detecta fechas superpuestas", () => {
    const resultado = fechasSeSuperponen(
      "2026-08-05",
      "2026-08-10",
      "2026-08-08",
      "2026-08-12"
    );

    expect(resultado).toBe(true);
  });

  test("no detecta superposición entre fechas separadas", () => {
    const resultado = fechasSeSuperponen(
      "2026-08-05",
      "2026-08-08",
      "2026-08-08",
      "2026-08-12"
    );

    expect(resultado).toBe(false);
  });
});

describe("Cancelación de reservas", () => {
  test("permite cancelar una reserva confirmada", () => {
    const resultado = puedeCancelarReserva({
      status: "Confirmada"
    });

    expect(resultado.permitido).toBe(true);
  });

  test("no permite cancelar una reserva ya cancelada", () => {
    const resultado = puedeCancelarReserva({
      status: "Cancelada"
    });

    expect(resultado.permitido).toBe(false);
  });

  test("no permite cancelar una reserva inexistente", () => {
    const resultado = puedeCancelarReserva(null);

    expect(resultado.permitido).toBe(false);
  });
}); 