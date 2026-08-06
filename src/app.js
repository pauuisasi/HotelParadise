/*
 * src/app.js
 * Interacción con la página.
 */

import {
  ROOMS,
  validarFechas,
  validarCapacidad,
  contarDisponibles,
  buscarHabitacionesDisponibles,
  calcularNoches,
  crearReserva,
  puedeCancelarReserva,
  requiereAdvertenciaCancelacion,
  calcularOcupacion
} from "./core/reservas.js";

import {
  KEYS,
  leerJSON,
  guardarJSON,
  obtenerSesion,
  guardarSesion,
  cerrarSesion,
  inicializarDatos
} from "./core/storage.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let datosBusqueda = null;
let habitacionSeleccionada = null;

function fechaActualISO() {
  return new Date().toISOString().split("T")[0];
}

function usuarioActual() {
  const usuarioId = obtenerSesion();
  return leerJSON(KEYS.users).find(
    (usuario) => usuario.id === usuarioId
  ) || null;
}

function abrirModal(id) {
  const modal = $(`#${id}`);
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function cerrarModal(id) {
  const modal = $(`#${id}`);
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function mostrarMensaje(id, mensaje, tipo = "") {
  const elemento = $(`#${id}`);
  elemento.textContent = mensaje;
  elemento.className = `feedback ${tipo}`;
}

function mostrarToast(mensaje) {
  const toast = $("#toast");
  toast.textContent = mensaje;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

function escaparHTML(texto) {
  return String(texto).replace(
    /[&<>"']/g,
    (caracter) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[caracter]
  );
}
function obtenerImagenesHabitacion(habitacion) {
  if (
    Array.isArray(habitacion.images) &&
    habitacion.images.length > 0
  ) {
    return habitacion.images;
  }

  return habitacion.image ? [habitacion.image] : [];
}

function actualizarCarruselTarjeta(carrusel, nuevoIndice) {
  const roomId = carrusel.dataset.room;

  const habitacion = ROOMS.find(
    (item) => item.id === roomId
  );

  if (!habitacion) {
    return;
  }

  const imagenes = obtenerImagenesHabitacion(habitacion);

  if (imagenes.length === 0) {
    return;
  }

  const indice =
    ((nuevoIndice % imagenes.length) + imagenes.length) %
    imagenes.length;

  carrusel.dataset.index = String(indice);

  const imagen = carrusel.querySelector(
    ".room-carousel-image"
  );

  const contador = carrusel.querySelector(
    ".room-carousel-counter"
  );

  imagen.src = imagenes[indice];
  imagen.alt =
    `${habitacion.name} - imagen ${indice + 1}`;

  if (contador) {
    contador.textContent =
      `${indice + 1} / ${imagenes.length}`;
  }

  carrusel
    .querySelectorAll(".room-carousel-dot")
    .forEach((punto, posicion) => {
      punto.classList.toggle(
        "active",
        posicion === indice
      );
    });
} 
function configurarCarruselesTarjetas() {
  $$(".room-image-carousel").forEach((carrusel) => {
    const botonAnterior = carrusel.querySelector(
      ".room-carousel-prev"
    );

    const botonSiguiente = carrusel.querySelector(
      ".room-carousel-next"
    );

    const puntos = carrusel.querySelectorAll(
      ".room-carousel-dot"
    );

    botonAnterior?.addEventListener("click", (evento) => {
      evento.preventDefault();
      evento.stopPropagation();

      const indiceActual = Number(
        carrusel.dataset.index || 0
      );

      actualizarCarruselTarjeta(
        carrusel,
        indiceActual - 1
      );
    });

    botonSiguiente?.addEventListener("click", (evento) => {
      evento.preventDefault();
      evento.stopPropagation();

      const indiceActual = Number(
        carrusel.dataset.index || 0
      );

      actualizarCarruselTarjeta(
        carrusel,
        indiceActual + 1
      );
    });

    puntos.forEach((punto) => {
      punto.addEventListener("click", (evento) => {
        evento.preventDefault();
        evento.stopPropagation();

        actualizarCarruselTarjeta(
          carrusel,
          Number(punto.dataset.index)
        );
      });
    });
  });
}
function moverCarruselTarjeta(roomId, direccion) {
  const carrusel = document.querySelector(
    `.room-image-carousel[data-room="${roomId}"]`
  );

  if (!carrusel) {
    return;
  }

  const indiceActual = Number(
    carrusel.dataset.index || 0
  );

  actualizarCarruselTarjeta(
    carrusel,
    indiceActual + direccion
  );
}
function renderizarHabitaciones() {
  $("#roomsContainer").innerHTML = ROOMS.map(
    (habitacion) => {
      const imagenes =
        obtenerImagenesHabitacion(habitacion);

      return `
        <article class="room-card">

          <div
            class="room-image room-image-carousel"
            data-room="${habitacion.id}"
            data-index="0">

            <img
              class="room-carousel-image"
              src="${imagenes[0] || ""}"
              alt="${habitacion.name} - imagen 1">

            ${
              imagenes.length > 1
                ? `
                  <button
                    type="button"
                    class="
                      room-carousel-arrow
                      room-carousel-prev
                    "
                    data-room="${habitacion.id}"
                    aria-label="
                      Ver imagen anterior de
                      ${habitacion.name}
                    ">
                    ‹
                  </button>

                  <button
                    type="button"
                    class="
                      room-carousel-arrow
                      room-carousel-next
                    "
                    data-room="${habitacion.id}"
                    aria-label="
                      Ver imagen siguiente de
                      ${habitacion.name}
                    ">
                    ›
                  </button>

                  <span class="room-carousel-counter">
                    1 / ${imagenes.length}
                  </span>

                  <div class="room-carousel-dots">

                    ${imagenes.map(
                      (_, indice) => `
                        <button
                          type="button"
                          class="room-carousel-dot ${
                            indice === 0
                              ? "active"
                              : ""
                          }"
                          data-room="${habitacion.id}"
                          data-index="${indice}"
                          aria-label="
                            Ver imagen ${indice + 1}
                            de ${habitacion.name}
                          ">
                        </button>
                      `
                    ).join("")}

                  </div>
                `
                : ""
            }

          </div>

          <div class="room-content">

            <div class="room-top">
              <h3>${habitacion.name}</h3>

              <span class="badge">
                ${habitacion.total}
                disponibles inicialmente
              </span>
            </div>

            <p class="price">
              USD ${habitacion.price} / noche
            </p>

            <div class="capacity">
              👥 Hasta ${habitacion.capacity} personas
            </div>

            <ul>
              ${habitacion.features
                .map(
                  (caracteristica) =>
                    `<li>${caracteristica}</li>`
                )
                .join("")}
            </ul>

            <button
              class="btn-primary room-reserve"
              data-room="${habitacion.id}">
              Consultar y reservar
            </button>

          </div>
        </article>
      `;
    }
  ).join("");
   configurarCarruselesTarjetas();
}


function consultarDisponibilidad(evento) {
  evento?.preventDefault();

  const fechaIngreso = $("#checkIn").value;
  const fechaSalida = $("#checkOut").value;
  const huespedes = Number($("#guests").value);

  const resultadoFechas = validarFechas(
    fechaIngreso,
    fechaSalida,
    fechaActualISO()
  );

  if (!resultadoFechas.valido) {
    mostrarMensaje(
      "availabilityMessage",
      resultadoFechas.mensaje,
      "error"
    );
    $("#availabilityResults").innerHTML = "";
    return;
  }

  datosBusqueda = {
    checkIn: fechaIngreso,
    checkOut: fechaSalida,
    guests: huespedes
  };

  const habitacionesDisponibles =
    buscarHabitacionesDisponibles({
      habitaciones: ROOMS,
      reservas: leerJSON(KEYS.reservations),
      fechaIngreso,
      fechaSalida,
      cantidadHuespedes: huespedes
    });

  if (habitacionesDisponibles.length === 0) {
    mostrarMensaje(
      "availabilityMessage",
      "No hay habitaciones disponibles para los datos seleccionados.",
      "error"
    );
    $("#availabilityResults").innerHTML = "";
    return;
  }

  mostrarMensaje(
    "availabilityMessage",
    `${habitacionesDisponibles.length} tipo(s) de habitación disponible(s).`,
    "success"
  );

  $("#availabilityResults").innerHTML =
    habitacionesDisponibles.map(
      (habitacion) => `
        <article class="available-card">
          <h3>${habitacion.name}</h3>
          <p>
            <strong>${habitacion.disponibles}</strong>
            habitación(es) disponible(s)
          </p>
          <p>
            USD ${habitacion.price} por noche ·
            Capacidad ${habitacion.capacity}
          </p>
          <button
            class="btn-primary select-room"
            data-room="${habitacion.id}">
            Elegir habitación
          </button>
        </article>
      `
    ).join("");
}

function seleccionarHabitacion(roomId) {
  if (!datosBusqueda) {
    $("#reserva").scrollIntoView();
    mostrarToast("Primero ingresá las fechas de la estadía.");
    return;
  }

  const usuario = usuarioActual();

  if (!usuario) {
    abrirModal("authModal");
    mostrarMensaje(
      "loginMessage",
      "Iniciá sesión o registrate para continuar.",
      "error"
    );
    return;
  }

  habitacionSeleccionada = ROOMS.find(
    (habitacion) => habitacion.id === roomId
  );

  const resultadoCapacidad = validarCapacidad(
    habitacionSeleccionada,
    datosBusqueda.guests
  );

  if (!resultadoCapacidad.valido) {
    mostrarToast(resultadoCapacidad.mensaje);
    return;
  }

  const noches = calcularNoches(
    datosBusqueda.checkIn,
    datosBusqueda.checkOut
  );

  $("#bookingSummary").innerHTML = `
    <strong>${habitacionSeleccionada.name}</strong><br>
    ${datosBusqueda.checkIn} al ${datosBusqueda.checkOut}<br>
    ${noches} noche(s) · ${datosBusqueda.guests} huésped(es)<br>
    Alojamiento:
    <strong>
      USD ${habitacionSeleccionada.price * noches}
    </strong>
  `;

  abrirModal("bookingModal");
}

function confirmarReserva(evento) {
  evento.preventDefault();

  const usuario = usuarioActual();

  if (usuario?.role === "admin") {
    mostrarToast(
      "Los administradores no pueden realizar reservas."
    );
    return;
  }

  if (
    !usuario ||
    !habitacionSeleccionada ||
    !datosBusqueda
  ) {
    return;
  }

  const reservas = leerJSON(KEYS.reservations);

  const cantidadDisponible = contarDisponibles(
    habitacionSeleccionada,
    reservas,
    datosBusqueda.checkIn,
    datosBusqueda.checkOut
  );

  if (cantidadDisponible <= 0) {
    mostrarMensaje(
      "bookingMessage",
      "La última habitación disponible ya fue reservada.",
      "error"
    );
    return;
  }

  const resultadoCapacidad = validarCapacidad(
    habitacionSeleccionada,
    datosBusqueda.guests
  );

  if (!resultadoCapacidad.valido) {
    mostrarMensaje(
      "bookingMessage",
      resultadoCapacidad.mensaje,
      "error"
    );
    return;
  }

  const extras = {
    parking: $("#serviceParking").checked,
    breakfast: $("#serviceBreakfast").checked,
    transfer: $("#serviceTransfer").checked
  };

  const nuevaReserva = crearReserva({
    id: `RES-${Date.now().toString().slice(-7)}`,
    usuario,
    habitacion: habitacionSeleccionada,
    fechaIngreso: datosBusqueda.checkIn,
    fechaSalida: datosBusqueda.checkOut,
    huespedes: datosBusqueda.guests,
    extras
  });

  reservas.push(nuevaReserva);
  guardarJSON(KEYS.reservations, reservas);

  mostrarMensaje(
    "bookingMessage",
    `Reserva realizada correctamente. Código: ${nuevaReserva.id}`,
    "success"
  );

  consultarDisponibilidad();

  setTimeout(() => {
    cerrarModal("bookingModal");
    renderizarMisReservas();
    mostrarToast("Reserva registrada correctamente.");
  }, 1000);
}

function renderizarComentarios() {
  const comentarios = leerJSON(KEYS.comments);

  $("#commentsList").innerHTML = comentarios.map(
    (comentario) => `
      <article class="comment-card">
        <div class="comment-card-header">
          <h4>${escaparHTML(comentario.name)}</h4>
          <span>
            ${"★".repeat(comentario.rating)}
            ${"☆".repeat(5 - comentario.rating)}
          </span>
        </div>
        <p>${escaparHTML(comentario.text)}</p>
      </article>
    `
  ).join("");
}

function publicarComentario(evento) {
  evento.preventDefault();

  const usuario = usuarioActual();

  if (usuario?.role === "admin") {
    mostrarToast(
      "Los administradores no pueden publicar comentarios."
    );
    return;
  }

  const nombre = $("#commentName").value.trim();
  const texto = $("#commentText").value.trim();
  const puntuacion = Number($("#commentRating").value);

  if (!nombre || !texto) {
    mostrarMensaje(
      "commentMessage",
      "Complete todos los campos.",
      "error"
    );
    return;
  }

  const comentarios = leerJSON(KEYS.comments);

  comentarios.unshift({
    name: nombre,
    rating: puntuacion,
    text: texto
  });

  guardarJSON(KEYS.comments, comentarios);

  evento.target.reset();

  mostrarMensaje(
    "commentMessage",
    "Comentario publicado correctamente.",
    "success"
  );

  renderizarComentarios();
}

function registrarUsuario(evento) {
  evento.preventDefault();

  const usuario = {
    id: `USR-${Date.now().toString().slice(-7)}`,
    name: $("#registerName").value.trim(),
    document: $("#registerDocument").value.trim(),
    email: $("#registerEmail").value.trim().toLowerCase(),
    phone: $("#registerPhone").value.trim(),
    password: $("#registerPassword").value,
    role: "client"
  };

  const camposIncompletos = Object.values(usuario).some(
    (valor) => valor === ""
  );

  if (camposIncompletos) {
    mostrarMensaje(
      "registerMessage",
      "Todos los datos son obligatorios.",
      "error"
    );
    return;
  }

  const usuarios = leerJSON(KEYS.users);

  const usuarioExistente = usuarios.some(
    (item) =>
      item.email === usuario.email ||
      item.document === usuario.document
  );

  if (usuarioExistente) {
    mostrarMensaje(
      "registerMessage",
      "Ya existe un usuario con ese email o documento.",
      "error"
    );
    return;
  }

  usuarios.push(usuario);
  guardarJSON(KEYS.users, usuarios);
  guardarSesion(usuario.id);

  actualizarInterfazSesion();

  mostrarMensaje(
    "registerMessage",
    "Registro realizado correctamente.",
    "success"
  );

  setTimeout(() => {
    cerrarModal("authModal");
    mostrarToast(`Bienvenido/a, ${usuario.name}.`);
  }, 700);
}

function iniciarSesion(evento) {
  evento.preventDefault();

  const email = $("#loginEmail").value.trim().toLowerCase();
  const password = $("#loginPassword").value;

  const usuario = leerJSON(KEYS.users).find(
    (item) =>
      item.email === email &&
      item.password === password
  );

  if (!usuario) {
    mostrarMensaje(
      "loginMessage",
      "Email o contraseña incorrectos.",
      "error"
    );
    return;
  }

  guardarSesion(usuario.id);
  actualizarInterfazSesion();

  mostrarMensaje(
    "loginMessage",
    "Inicio de sesión correcto.",
    "success"
  );

  setTimeout(() => {
    cerrarModal("authModal");
    mostrarToast(`Bienvenido/a, ${usuario.name}.`);
  }, 500);
}

function salir() {
  cerrarSesion();
  actualizarInterfazSesion();
  mostrarToast("Sesión cerrada.");
}

function actualizarInterfazSesion() {
  const usuario = usuarioActual();

  $("#loginOpen").classList.toggle("hidden", Boolean(usuario));
  $("#logoutBtn").classList.toggle("hidden", !usuario);

  $("#myReservationsOpen").classList.toggle(
    "hidden",
    !usuario || usuario.role !== "client"
  );

  $("#adminOpen").classList.toggle(
    "hidden",
    !usuario || usuario.role !== "admin"
  );

  const esAdministrador = usuario?.role === "admin";

  // Deshabilitar formulario de reserva para administradores
  $("#availabilityForm")
    ?.querySelectorAll("input, select, button")
    .forEach((elemento) => {
      elemento.disabled = esAdministrador;
    });

  // Deshabilitar formulario de comentarios para administradores
  $("#commentForm")
    ?.querySelectorAll("input, select, textarea, button")
    .forEach((elemento) => {
      elemento.disabled = esAdministrador;
    });

  $("#adminBookingNotice")?.classList.toggle(
    "hidden",
    !esAdministrador
  );
}

function crearHTMLReserva(reserva, esAdministrador = false) {
  const puedeMostrarCancelar =
    reserva.status !== "Cancelada";

  return `
    <article class="reservation-item">
      <div class="reservation-item-head">
        <div>
          <h3>${reserva.roomName}</h3>
          <small>
            ${reserva.id}
            ${
              esAdministrador
                ? ` · ${escaparHTML(reserva.clientName)}`
                : ""
            }
          </small>
        </div>

        <span
          class="status status-${reserva.status.toLowerCase()}">
          ${reserva.status}
        </span>
      </div>

      <div class="reservation-meta">
        <span>
          <strong>Ingreso:</strong><br>
          ${reserva.checkIn}
        </span>
        <span>
          <strong>Salida:</strong><br>
          ${reserva.checkOut}
        </span>
        <span>
          <strong>Huéspedes:</strong><br>
          ${reserva.guests}
        </span>
        <span>
          <strong>Total estimado:</strong><br>
          USD ${reserva.total}
        </span>
      </div>

      ${
        puedeMostrarCancelar
          ? `
            <div class="actions">
              <button
                class="btn-small btn-danger cancel-reservation"
                data-id="${reserva.id}">
                Cancelar
              </button>
            </div>
          `
          : ""
      }
    </article>
  `;
}

function renderizarMisReservas() {
  const usuario = usuarioActual();

  if (!usuario) {
    return;
  }

  const textoBusqueda =
    $("#reservationSearch")?.value.toLowerCase() || "";

  const filtroEstado =
    $("#reservationStatusFilter")?.value || "";

  const reservas = leerJSON(KEYS.reservations)
    .filter((reserva) => reserva.userId === usuario.id)
    .filter((reserva) =>
      (
        !textoBusqueda ||
        reserva.id.toLowerCase().includes(textoBusqueda) ||
        reserva.roomName.toLowerCase().includes(textoBusqueda)
      ) &&
      (
        !filtroEstado ||
        reserva.status === filtroEstado
      )
    );

  $("#myReservationsList").innerHTML = reservas.length
    ? reservas.map(
        (reserva) => crearHTMLReserva(reserva)
      ).join("")
    : "<p>No se encontraron reservas asociadas al cliente.</p>";
}

function renderizarReservasAdministracion() {
  const textoBusqueda =
    $("#adminReservationSearch")?.value.toLowerCase() || "";

  const filtroEstado =
    $("#adminStatusFilter")?.value || "";

  const reservas = leerJSON(KEYS.reservations)
    .filter((reserva) =>
      (
        !textoBusqueda ||
        reserva.id.toLowerCase().includes(textoBusqueda) ||
        reserva.clientName.toLowerCase().includes(textoBusqueda)
      ) &&
      (
        !filtroEstado ||
        reserva.status === filtroEstado
      )
    );

  $("#adminReservationsList").innerHTML = reservas.length
    ? reservas.map(
        (reserva) => crearHTMLReserva(reserva, true)
      ).join("")
    : "<p>No hay reservas registradas.</p>";
}

function cambiarEstadoReserva(id, nuevoEstado) {
  const usuario = usuarioActual();

  if (!usuario) {
    mostrarToast("Debe iniciar sesión.");
    return;
  }

  const reservas = leerJSON(KEYS.reservations);
  const reserva = reservas.find((item) => item.id === id);

  if (!reserva) {
    mostrarToast("La reserva no existe.");
    return;
  }

  if (nuevoEstado === "Cancelada") {
    const resultado = puedeCancelarReserva(reserva);

    if (!resultado.permitido) {
      mostrarToast(resultado.mensaje);
      return;
    }

    const dentroDelPlazoConCargo =
      requiereAdvertenciaCancelacion(
        reserva.checkIn,
        fechaActualISO()
      );

    if (
      usuario.role === "client" &&
      dentroDelPlazoConCargo
    ) {
      mostrarToast(
        "No puede cancelar porque faltan menos de 3 noches para la fecha de ingreso. Comuníquese con el hotel para solicitar la cancelación."
      );
      return;
    }

    let mensaje =
      "¿Está seguro que desea cancelar la reserva?";

    if (
      usuario.role === "admin" &&
      dentroDelPlazoConCargo
    ) {
      mensaje +=
        "\nLa cancelación se realiza con menos de 3 noches de anticipación. Puede corresponder un cargo que deberá gestionarse manualmente.";
    }

    if (!confirm(mensaje)) {
      return;
    }
  }

  reserva.status = nuevoEstado;
  guardarJSON(KEYS.reservations, reservas);

  renderizarMisReservas();
  renderizarReservasAdministracion();

  mostrarToast(
    `Reserva ${nuevoEstado.toLowerCase()} correctamente.`
  );
}

function consultarOcupacion(evento) {
  evento?.preventDefault();

  const fecha = $("#occupancyDate").value;

  if (!fecha) {
    $("#occupancyResults").innerHTML =
      "<p>Seleccione una fecha válida.</p>";
    return;
  }

  const ocupacion = calcularOcupacion({
    habitaciones: ROOMS,
    reservas: leerJSON(KEYS.reservations),
    fecha
  });

  $("#occupancyResults").innerHTML = `
    <div class="stats">
      <div class="stat">
        <strong>${ocupacion.total}</strong>
        Total
      </div>
      <div class="stat">
        <strong>${ocupacion.ocupadas}</strong>
        Ocupadas
      </div>
      <div class="stat">
        <strong>${ocupacion.disponibles}</strong>
        Disponibles
      </div>
    </div>

    ${ocupacion.detalle.map(
      (item) => `
        <div class="reservation-item">
          <strong>${item.roomName}</strong>:
          ${item.ocupadas} ocupada(s) /
          ${item.disponibles} disponible(s)
        </div>
      `
    ).join("")}
  `;
}

function configurarEventos() {
  $("#availabilityForm").addEventListener(
    "submit",
    consultarDisponibilidad
  );

  $("#bookingForm").addEventListener(
    "submit",
    confirmarReserva
  );

  $("#commentForm").addEventListener(
    "submit",
    publicarComentario
  );

  $("#registerForm").addEventListener(
    "submit",
    registrarUsuario
  );

  $("#loginForm").addEventListener(
    "submit",
    iniciarSesion
  );

  $("#loginOpen").addEventListener(
    "click",
    () => abrirModal("authModal")
  );

  $("#myReservationsOpen").addEventListener(
    "click",
    () => {
      renderizarMisReservas();
      abrirModal("reservationsModal");
    }
  );

  $("#adminOpen").addEventListener(
    "click",
    () => {
      renderizarReservasAdministracion();
      abrirModal("adminModal");
    }
  );

  $("#logoutBtn").addEventListener("click", salir);

  $("#menuToggle").addEventListener(
    "click",
    () => $("#navLinks").classList.toggle("open")
  );

  $("#reservationSearch").addEventListener(
    "input",
    renderizarMisReservas
  );

  $("#reservationStatusFilter").addEventListener(
    "change",
    renderizarMisReservas
  );

  $("#adminReservationSearch").addEventListener(
    "input",
    renderizarReservasAdministracion
  );

  $("#adminStatusFilter").addEventListener(
    "change",
    renderizarReservasAdministracion
  );

  $("#occupancyForm").addEventListener(
    "submit",
    consultarOcupacion
  );

  document.addEventListener("click", (evento) => {
    const modalACerrar = evento.target.dataset.close;

    if (modalACerrar) {
      cerrarModal(modalACerrar);
    }
  const flechaAnterior = evento.target.closest(
    ".room-carousel-prev"
  );

  if (flechaAnterior) {
    moverCarruselTarjeta(
      flechaAnterior.dataset.room,
      -1
    );

    return;
  }

  const flechaSiguiente = evento.target.closest(
    ".room-carousel-next"
  );

  if (flechaSiguiente) {
    moverCarruselTarjeta(
      flechaSiguiente.dataset.room,
      1
    );

    return;
  }

  const puntoCarrusel = evento.target.closest(
    ".room-carousel-dot"
  );

  if (puntoCarrusel) {
    const carrusel = puntoCarrusel.closest(
      ".room-image-carousel"
    );

    actualizarCarruselTarjeta(
      carrusel,
      Number(puntoCarrusel.dataset.index)
    );

    return;
  }
    if (evento.target.classList.contains("room-reserve")) {
      $("#reserva").scrollIntoView();

      habitacionSeleccionada = ROOMS.find(
        (habitacion) =>
          habitacion.id === evento.target.dataset.room
      );
    }

    if (evento.target.classList.contains("select-room")) {
      seleccionarHabitacion(evento.target.dataset.room);
    }

    if (evento.target.classList.contains("cancel-reservation")) {
      cambiarEstadoReserva(
        evento.target.dataset.id,
        "Cancelada"
      );
    }

    if (evento.target.classList.contains("modal")) {
      cerrarModal(evento.target.id);
    }
  });

  $$("[data-auth-tab]").forEach((boton) => {
    boton.addEventListener("click", () => {
      $$("[data-auth-tab]").forEach(
        (item) => item.classList.remove("active")
      );

      boton.classList.add("active");

      $("#loginForm").classList.toggle(
        "hidden",
        boton.dataset.authTab !== "login"
      );

      $("#registerForm").classList.toggle(
        "hidden",
        boton.dataset.authTab !== "register"
      );
    });
  });

  $$("[data-admin-tab]").forEach((boton) => {
    boton.addEventListener("click", () => {
      $$("[data-admin-tab]").forEach(
        (item) => item.classList.remove("active")
      );

      boton.classList.add("active");

      $("#adminReservationsPanel").classList.toggle(
        "hidden",
        boton.dataset.adminTab !== "reservations"
      );

      $("#adminOccupancyPanel").classList.toggle(
        "hidden",
        boton.dataset.adminTab !== "occupancy"
      );
    });
  });
}

function iniciarAplicacion() {
  inicializarDatos();

  renderizarHabitaciones();
  renderizarComentarios();
  actualizarInterfazSesion();

  $("#checkIn").min = fechaActualISO();
  $("#checkOut").min = fechaActualISO();
  $("#occupancyDate").value = fechaActualISO();

  configurarEventos();
}

document.addEventListener(
  "DOMContentLoaded",
  iniciarAplicacion
);
// Coordenadas
const latitud = -34.90368449315336;
const longitud = -56.190495772745855;

// Crear mapa
const mapa = L.map("mapa").setView([latitud, longitud], 16);

// Cargar mapa
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap"
}).addTo(mapa);

// Agregar marcador
L.marker([latitud, longitud])
    .addTo(mapa)
    .bindPopup(`
        <strong>Hotel Las Gaviotas</strong><br>
        Estamos ubicados aquí.
    `)
    .openPopup();


const navLinks = document.getElementById("navLinks");
const menuToggle = document.getElementById("menuToggle");

const loginOpen = document.getElementById("loginOpen");
const myReservationsOpen =
  document.getElementById("myReservationsOpen");

const adminOpen =
  document.getElementById("adminOpen");

const logoutBtn =
  document.getElementById("logoutBtn");

const mobileLoginOpen = document.getElementById("mobileLoginOpen");
const mobileRegisterOpen = document.getElementById("mobileRegisterOpen");
const mobileMyReservationsOpen = document.getElementById(
  "mobileMyReservationsOpen"
);
const mobileAdminOpen = document.getElementById("mobileAdminOpen");
const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");

const mobileReservationsItem = document.getElementById(
  "mobileReservationsItem"
);
const mobileAdminItem = document.getElementById("mobileAdminItem");
const mobileLogoutItem = document.getElementById("mobileLogoutItem");


function cerrarMenuMovil() {
  navLinks.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}

mobileLoginOpen.addEventListener("click", () => {
  loginOpen.click();
  cerrarMenuMovil();
});

mobileRegisterOpen.addEventListener("click", () => {
  loginOpen.click();

  const registerTab = document.querySelector(
    '[data-auth-tab="register"]'
  );

  if (registerTab) {
    registerTab.click();
  }

  cerrarMenuMovil();
});

mobileMyReservationsOpen.addEventListener("click", () => {
  myReservationsOpen.click();
  cerrarMenuMovil();
});

mobileAdminOpen.addEventListener("click", () => {
  adminOpen.click();
  cerrarMenuMovil();
});

mobileLogoutBtn.addEventListener("click", () => {
  logoutBtn.click();
  cerrarMenuMovil();
});

function actualizarMenuMovil() {
  const loginVisible = !loginOpen.classList.contains("hidden");
  const reservasVisible =
    !myReservationsOpen.classList.contains("hidden");
  const adminVisible = !adminOpen.classList.contains("hidden");
  const logoutVisible = !logoutBtn.classList.contains("hidden");

  mobileLoginOpen.parentElement.classList.toggle(
    "hidden",
    !loginVisible
  );

  mobileRegisterOpen.parentElement.classList.toggle(
    "hidden",
    !loginVisible
  );

  mobileReservationsItem.classList.toggle(
    "hidden",
    !reservasVisible
  );

  mobileAdminItem.classList.toggle(
    "hidden",
    !adminVisible
  );

  mobileLogoutItem.classList.toggle(
    "hidden",
    !logoutVisible
  );
}

const observerMenu = new MutationObserver(() => {
  actualizarMenuMovil();
});

[loginOpen, myReservationsOpen, adminOpen, logoutBtn].forEach(
  (elemento) => {
    observerMenu.observe(elemento, {
      attributes: true,
      attributeFilter: ["class"]
    });
  }
);

actualizarMenuMovil();