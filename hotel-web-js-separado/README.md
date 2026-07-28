# Hotel Paradise — JavaScript separado por responsabilidades

```text
hotel-web-js-separado/
│
├── index.html
├── styles.css
├── assets/
│   └── images/
│
└── src/
    ├── app.js
    └── core/
        ├── reservas.js
        └── storage.js
```

## src/app.js

Se encarga exclusivamente de la interacción con la página:

- `addEventListener`
- lectura de inputs
- actualización del DOM
- mensajes de error y confirmación
- apertura y cierre de modales
- renderizado de habitaciones y reservas
- llamadas a funciones del `core`

No contiene las reglas principales de disponibilidad, capacidad,
superposición, costos, cancelación u ocupación.

## src/core/reservas.js

Contiene la lógica pura y testeable:

- validación de fechas
- validación de capacidad
- detección de reservas superpuestas
- cálculo de disponibilidad
- cálculo de noches y costos
- creación del objeto reserva
- reglas de cancelación
- cálculo de ocupación

No usa:

- `document`
- DOM
- `alert`
- `confirm`
- `localStorage`

## src/core/storage.js

Se encarga únicamente de la persistencia:

- leer JSON
- guardar JSON
- gestionar la sesión
- inicializar los datos de prueba

## Ejecución

Abrir la carpeta con Visual Studio Code y ejecutar `index.html`
mediante Live Server, ya que se utilizan módulos JavaScript.

## Personal del hotel

- Email: `admin@paradise.com`
- Contraseña: `admin`
