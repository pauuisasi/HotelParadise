import {
  validarFechas,
  validarCapacidad,
  fechasSeSuperponen,
  contarDisponibles,
  buscarHabitacionesDisponibles,
  calcularNoches,
  calcularCostoReserva,
  crearReserva,
  puedeCancelarReserva,
  requiereAdvertenciaCancelacion,
  calcularOcupacion
} from "../src/core/reservas.js";

describe("Validación de fechas", () => {
  test("rechaza cuando falta la fecha de ingreso", () => {
    const resultado = validarFechas(
      "",
      "2026-08-08",
      "2026-08-04"
    );

    expect(resultado).toEqual({
      valido: false,
      mensaje: "Debe ingresar la fecha de ingreso y la fecha de salida."
    });
  });

  test("rechaza cuando falta la fecha de salida", () => {
    const resultado = validarFechas(
      "2026-08-05",
      "",
      "2026-08-04"
    );

    expect(resultado).toEqual({
      valido: false,
      mensaje: "Debe ingresar la fecha de ingreso y la fecha de salida."
    });
  });

  test("rechaza una fecha de ingreso anterior a hoy", () => {
    const resultado = validarFechas(
      "2026-08-03",
      "2026-08-08",
      "2026-08-04"
    );

    expect(resultado).toEqual({
      valido: false,
      mensaje: "La fecha de ingreso no puede ser anterior a hoy."
    });
  });

  test("rechaza una salida igual al ingreso", () => {
    const resultado = validarFechas(
      "2026-08-05",
      "2026-08-05",
      "2026-08-04"
    );

    expect(resultado).toEqual({
      valido: false,
      mensaje: "La fecha de salida debe ser posterior a la fecha de ingreso."
    });
  });

  test("rechaza una salida anterior al ingreso", () => {
    const resultado = validarFechas(
      "2026-08-08",
      "2026-08-07",
      "2026-08-04"
    );

    expect(resultado.valido).toBe(false);
  });

  test("acepta fechas válidas", () => {
    const resultado = validarFechas(
      "2026-08-05",
      "2026-08-08",
      "2026-08-04"
    );

    expect(resultado).toEqual({
      valido: true,
      mensaje: ""
    });
  });
});

describe("Validación de capacidad", () => {
  test("rechaza una habitación inexistente", () => {
    const resultado = validarCapacidad(null, 2);

    expect(resultado).toEqual({
      valido: false,
      mensaje: "La habitación seleccionada no existe."
    });
  });

  test("rechaza una cantidad menor a un huésped", () => {
    const habitacion = {
      id: "simple",
      capacity: 2
    };

    const resultado = validarCapacidad(habitacion, 0);

    expect(resultado).toEqual({
      valido: false,
      mensaje: "Debe indicarse al menos un huésped."
    });
  });

  test("rechaza más huéspedes que la capacidad", () => {
    const habitacion = {
      id: "simple",
      capacity: 2
    };

    const resultado = validarCapacidad(habitacion, 3);

    expect(resultado).toEqual({
      valido: false,
      mensaje: "La habitación admite un máximo de 2 huéspedes."
    });
  });

  test("acepta una cantidad válida de huéspedes", () => {
    const habitacion = {
      id: "junior",
      capacity: 3
    };

    const resultado = validarCapacidad(habitacion, 2);

    expect(resultado).toEqual({
      valido: true,
      mensaje: ""
    });
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

  test("no se superponen cuando la primera empieza después", () => {
    const resultado = fechasSeSuperponen(
      "2026-08-12",
      "2026-08-15",
      "2026-08-05",
      "2026-08-10"
    );

    expect(resultado).toBe(false);
  });

  test("no se superponen cuando una termina al comenzar la otra", () => {
    const resultado = fechasSeSuperponen(
      "2026-08-05",
      "2026-08-08",
      "2026-08-08",
      "2026-08-12"
    );

    expect(resultado).toBe(false);
  });
});

describe("Disponibilidad de habitaciones", () => {
  const habitacion = {
    id: "junior",
    name: "Junior Suite",
    capacity: 3,
    total: 5
  };

  test("cuenta solamente reservas activas y superpuestas", () => {
    const reservas = [
      {
        id: "RES-ACTIVA",
        roomId: "junior",
        checkIn: "2026-08-05",
        checkOut: "2026-08-10",
        status: "Confirmada"
      },
      {
        id: "RES-OTRA-HABITACION",
        roomId: "simple",
        checkIn: "2026-08-05",
        checkOut: "2026-08-10",
        status: "Confirmada"
      },
      {
        id: "RES-EXCLUIDA",
        roomId: "junior",
        checkIn: "2026-08-05",
        checkOut: "2026-08-10",
        status: "Confirmada"
      },
      {
        id: "RES-CANCELADA",
        roomId: "junior",
        checkIn: "2026-08-05",
        checkOut: "2026-08-10",
        status: "Cancelada"
      },
      {
        id: "RES-NO-SUPERPUESTA",
        roomId: "junior",
        checkIn: "2026-08-15",
        checkOut: "2026-08-20",
        status: "Confirmada"
      }
    ];

    const resultado = contarDisponibles(
      habitacion,
      reservas,
      "2026-08-07",
      "2026-08-08",
      "RES-EXCLUIDA"
    );

    expect(resultado).toBe(4);
  });

  test("devuelve el total si no existen reservas", () => {
    const resultado = contarDisponibles(
      habitacion,
      [],
      "2026-08-07",
      "2026-08-08"
    );

    expect(resultado).toBe(5);
  });

  test("busca habitaciones con capacidad y disponibilidad", () => {
    const habitaciones = [
      {
        id: "junior",
        name: "Junior Suite",
        capacity: 3,
        total: 2
      },
      {
        id: "business",
        name: "Business",
        capacity: 3,
        total: 1
      },
      {
        id: "simple",
        name: "Simple",
        capacity: 2,
        total: 5
      }
    ];

    const reservas = [
      {
        id: "RES-1",
        roomId: "business",
        checkIn: "2026-08-05",
        checkOut: "2026-08-10",
        status: "Confirmada"
      }
    ];

    const resultado = buscarHabitacionesDisponibles({
      habitaciones,
      reservas,
      fechaIngreso: "2026-08-06",
      fechaSalida: "2026-08-08",
      cantidadHuespedes: 3
    });

    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe("junior");
    expect(resultado[0].disponibles).toBe(2);
  });
});

describe("Cálculo de noches", () => {
  test("calcula correctamente la cantidad de noches", () => {
    const resultado = calcularNoches(
      "2026-08-05",
      "2026-08-08"
    );

    expect(resultado).toBe(3);
  });

  test("calcula una sola noche", () => {
    const resultado = calcularNoches(
      "2026-08-05",
      "2026-08-06"
    );

    expect(resultado).toBe(1);
  });
});

describe("Cálculo del costo de la reserva", () => {
  test("calcula solamente el alojamiento sin extras", () => {
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

  test("calcula alojamiento con todos los extras", () => {
    const resultado = calcularCostoReserva({
      precioPorNoche: 100,
      noches: 2,
      huespedes: 2,
      parking: true,
      desayuno: true,
      traslado: true
    });

    /*
     * Alojamiento: 100 × 2 = 200
     * Parking: 35
     * Desayuno: 40 × 2 huéspedes × 2 noches = 160
     * Traslado: 45
     * Total: 440
     */
    expect(resultado).toBe(440);
  });
});

describe("Creación de reservas", () => {
  test("crea una reserva confirmada con el total correcto", () => {
    const resultado = crearReserva({
      id: "RES-1",
      usuario: {
        id: "USR-1",
        name: "Paulina",
        email: "paulina@email.com"
      },
      habitacion: {
        id: "junior",
        name: "Junior Suite",
        price: 120
      },
      fechaIngreso: "2026-08-05",
      fechaSalida: "2026-08-07",
      huespedes: 2,
      extras: {
        parking: false,
        breakfast: true,
        transfer: false
      }
    });

    expect(resultado).toEqual(
      expect.objectContaining({
        id: "RES-1",
        userId: "USR-1",
        clientName: "Paulina",
        clientEmail: "paulina@email.com",
        roomId: "junior",
        roomName: "Junior Suite",
        checkIn: "2026-08-05",
        checkOut: "2026-08-07",
        guests: 2,
        nights: 2,
        extras: {
          parking: false,
          breakfast: true,
          transfer: false
        },
        total: 400,
        status: "Confirmada"
      })
    );

    expect(typeof resultado.createdAt).toBe("string");
    expect(Number.isNaN(Date.parse(resultado.createdAt))).toBe(false);
  });
});

describe("Cancelación de reservas", () => {
  test("no permite cancelar una reserva inexistente", () => {
    const resultado = puedeCancelarReserva(null);

    expect(resultado).toEqual({
      permitido: false,
      mensaje: "La reserva no existe."
    });
  });

  test("no permite cancelar una reserva ya cancelada", () => {
    const resultado = puedeCancelarReserva({
      status: "Cancelada"
    });

    expect(resultado).toEqual({
      permitido: false,
      mensaje: "La reserva ya está cancelada."
    });
  });

  test("permite cancelar una reserva confirmada", () => {
    const resultado = puedeCancelarReserva({
      status: "Confirmada"
    });

    expect(resultado).toEqual({
      permitido: true,
      mensaje: ""
    });
  });
});

describe("Advertencia de cancelación", () => {
  test("requiere advertencia cuando faltan menos de tres días", () => {
    const resultado = requiereAdvertenciaCancelacion(
      "2026-08-06",
      "2026-08-04"
    );

    expect(resultado).toBe(true);
  });

  test("no requiere advertencia cuando faltan tres días", () => {
    const resultado = requiereAdvertenciaCancelacion(
      "2026-08-07",
      "2026-08-04"
    );

    expect(resultado).toBe(false);
  });

  test("no requiere advertencia cuando faltan más de tres días", () => {
    const resultado = requiereAdvertenciaCancelacion(
      "2026-08-10",
      "2026-08-04"
    );

    expect(resultado).toBe(false);
  });
});

describe("Cálculo de ocupación", () => {
  test("calcula la ocupación total y por habitación", () => {
    const habitaciones = [
      {
        id: "junior",
        name: "Junior Suite",
        total: 2
      },
      {
        id: "simple",
        name: "Simple",
        total: 1
      }
    ];

    const reservas = [
      {
        id: "RES-ACTIVA-JUNIOR",
        roomId: "junior",
        checkIn: "2026-08-01",
        checkOut: "2026-08-10",
        status: "Confirmada"
      },
      {
        id: "RES-ACTIVA-SIMPLE",
        roomId: "simple",
        checkIn: "2026-08-04",
        checkOut: "2026-08-06",
        status: "Confirmada"
      },
      {
        id: "RES-CANCELADA",
        roomId: "junior",
        checkIn: "2026-08-01",
        checkOut: "2026-08-10",
        status: "Cancelada"
      },
      {
        id: "RES-FUTURA",
        roomId: "junior",
        checkIn: "2026-08-08",
        checkOut: "2026-08-10",
        status: "Confirmada"
      },
      {
        id: "RES-FINALIZADA",
        roomId: "simple",
        checkIn: "2026-08-01",
        checkOut: "2026-08-04",
        status: "Confirmada"
      }
    ];

    const resultado = calcularOcupacion({
      habitaciones,
      reservas,
      fecha: "2026-08-04"
    });

    expect(resultado).toEqual({
      total: 3,
      ocupadas: 2,
      disponibles: 1,
      detalle: [
        {
          roomId: "junior",
          roomName: "Junior Suite",
          total: 2,
          ocupadas: 1,
          disponibles: 1
        },
        {
          roomId: "simple",
          roomName: "Simple",
          total: 1,
          ocupadas: 1,
          disponibles: 0
        }
      ]
    });
  });

  test("devuelve toda la disponibilidad cuando no hay reservas", () => {
    const resultado = calcularOcupacion({
      habitaciones: [
        {
          id: "junior",
          name: "Junior Suite",
          total: 5
        }
      ],
      reservas: [],
      fecha: "2026-08-04"
    });

    expect(resultado).toEqual({
      total: 5,
      ocupadas: 0,
      disponibles: 5,
      detalle: [
        {
          roomId: "junior",
          roomName: "Junior Suite",
          total: 5,
          ocupadas: 0,
          disponibles: 5
        }
      ]
    });
  });
}); 