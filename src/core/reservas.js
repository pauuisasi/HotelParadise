/*
 * src/core/reservas.js
 * Lógica pura del sistema de reservas.
 */


export const ROOMS = [
  {
    id: "junior",
    name: "Junior Suite",
    price: 120,
    capacity: 3,
    total: 5,

    image: "./assets/images/JuniorSuite/jun1.jpeg",

    images: [
      "./assets/images/JuniorSuite/jun1.jpeg",
      "./assets/images/JuniorSuite/jun2.jpeg",
      "./assets/images/JuniorSuite/jun3.jpeg",
      "./assets/images/JuniorSuite/jun4.jpeg",
      "./assets/images/JuniorSuite/jun5.jpeg"
    ],

    features: [
      "Living integrado",
      "Mayor tamaño",
      "Más comodidades"
    ]
  },

{
  id: "business",
  name: "Business",
  price: 90,
  capacity: 3,
  total: 10,

  image: "./assets/images/bussines/jun1.jpeg",

  images: [
    "./assets/images/bussines/jun1.jpeg",
    "./assets/images/bussines/jun2.jpeg",
    "./assets/images/bussines/jun3.jpeg"
  ],

  features: [
    "Escritorio",
    "Ideal para trabajo",
    "Baño privado"
  ]
},

  {
    id: "simple",
    name: "Simple",
    price: 75,
    capacity: 2,
    total: 15,

    image: "./assets/images/Simple/simple1.jpeg",

    images: [
      "./assets/images/Simple/simple3.jpeg",
      "./assets/images/Simple/simple2.jpeg",
      "./assets/images/Simple/simple3.jpeg",
      "./assets/images/Simple/simple4.jpeg",
      "./assets/images/Simple/simple5.jpeg",
      "./assets/images/Simple/simple6.jpeg"
    ],

    features: [
      "Habitación estándar",
      "Económica",
      "Para 1 o 2 personas"
    ]
  }
]; 



export function validarFechas(fechaIngreso, fechaSalida, fechaActual) {
  if (!fechaIngreso || !fechaSalida) {
    return {
      valido: false,
      mensaje: "Debe ingresar la fecha de ingreso y la fecha de salida."
    };
  }

  if (fechaIngreso < fechaActual) {
    return {
      valido: false,
      mensaje: "La fecha de ingreso no puede ser anterior a hoy."
    };
  }

  if (fechaSalida <= fechaIngreso) {
    return {
      valido: false,
      mensaje: "La fecha de salida debe ser posterior a la fecha de ingreso."
    };
  }

  return { valido: true, mensaje: "" };
}

export function validarCapacidad(habitacion, cantidadHuespedes) {
  if (!habitacion) {
    return { valido: false, mensaje: "La habitación seleccionada no existe." };
  }

  if (cantidadHuespedes < 1) {
    return { valido: false, mensaje: "Debe indicarse al menos un huésped." };
  }

  if (cantidadHuespedes > habitacion.capacity) {
    return {
      valido: false,
      mensaje: `La habitación admite un máximo de ${habitacion.capacity} huéspedes.`
    };
  }

  return { valido: true, mensaje: "" };
}

export function fechasSeSuperponen(
  ingresoA,
  salidaA,
  ingresoB,
  salidaB
) {
  return ingresoA < salidaB && salidaA > ingresoB;
}

export function contarDisponibles(
  habitacion,
  reservas,
  fechaIngreso,
  fechaSalida,
  reservaExcluidaId = null
) {
  const reservasActivasSuperpuestas = reservas.filter((reserva) =>
    reserva.roomId === habitacion.id &&
    reserva.id !== reservaExcluidaId &&
    reserva.status !== "Cancelada" &&
    fechasSeSuperponen(
      fechaIngreso,
      fechaSalida,
      reserva.checkIn,
      reserva.checkOut
    )
  );

  return habitacion.total - reservasActivasSuperpuestas.length;
}

export function buscarHabitacionesDisponibles({
  habitaciones,
  reservas,
  fechaIngreso,
  fechaSalida,
  cantidadHuespedes
}) {
  return habitaciones
    .filter((habitacion) => habitacion.capacity >= cantidadHuespedes)
    .map((habitacion) => ({
      ...habitacion,
      disponibles: contarDisponibles(
        habitacion,
        reservas,
        fechaIngreso,
        fechaSalida
      )
    }))
    .filter((habitacion) => habitacion.disponibles > 0);
}

export function calcularNoches(fechaIngreso, fechaSalida) {
  const ingreso = new Date(`${fechaIngreso}T00:00:00`);
  const salida = new Date(`${fechaSalida}T00:00:00`);
  return Math.round((salida - ingreso) / 86400000);
}

export function calcularCostoReserva({
  precioPorNoche,
  noches,
  huespedes,
  parking,
  desayuno,
  traslado
}) {
  const alojamiento = precioPorNoche * noches;
  const costoParking = parking ? 35 : 0;
  const costoDesayuno = desayuno ? 40 * huespedes * noches : 0;
  const costoTraslado = traslado ? 45 : 0;

  return alojamiento + costoParking + costoDesayuno + costoTraslado;
}

export function crearReserva({
  id,
  usuario,
  habitacion,
  fechaIngreso,
  fechaSalida,
  huespedes,
  extras
}) {
  const noches = calcularNoches(fechaIngreso, fechaSalida);
  const total = calcularCostoReserva({
    precioPorNoche: habitacion.price,
    noches,
    huespedes,
    parking: extras.parking,
    desayuno: extras.breakfast,
    traslado: extras.transfer
  });

  return {
    id,
    userId: usuario.id,
    clientName: usuario.name,
    clientEmail: usuario.email,
    roomId: habitacion.id,
    roomName: habitacion.name,
    checkIn: fechaIngreso,
    checkOut: fechaSalida,
    guests: huespedes,
    nights: noches,
    extras,
    total,
    status: "Confirmada",
    createdAt: new Date().toISOString()
  };
}

export function puedeCancelarReserva(reserva) {
  if (!reserva) {
    return { permitido: false, mensaje: "La reserva no existe." };
  }

  if (reserva.status === "Cancelada") {
    return { permitido: false, mensaje: "La reserva ya está cancelada." };
  }

  return { permitido: true, mensaje: "" };
}

export function requiereAdvertenciaCancelacion(
  fechaIngreso,
  fechaActual
) {
  const ingreso = new Date(`${fechaIngreso}T00:00:00`);
  const actual = new Date(`${fechaActual}T00:00:00`);
  const diferenciaDias = Math.ceil((ingreso - actual) / 86400000);

  return diferenciaDias < 3;
}

export function calcularOcupacion({
  habitaciones,
  reservas,
  fecha
}) {
  const activas = reservas.filter((reserva) =>
    reserva.status !== "Cancelada" &&
    reserva.checkIn <= fecha &&
    reserva.checkOut > fecha
  );

  const total = habitaciones.reduce(
    (acumulado, habitacion) => acumulado + habitacion.total,
    0
  );

  const detalle = habitaciones.map((habitacion) => {
    const ocupadas = activas.filter(
      (reserva) => reserva.roomId === habitacion.id
    ).length;

    return {
      roomId: habitacion.id,
      roomName: habitacion.name,
      total: habitacion.total,
      ocupadas,
      disponibles: habitacion.total - ocupadas
    };
  });

  return {
    total,
    ocupadas: activas.length,
    disponibles: total - activas.length,
    detalle
  };
}
